"""
database.py
===========

Camada de persistência local em SQLite.

Cada OSC é salva imediatamente após o processamento (salvamento incremental),
de modo que nenhum dado é perdido caso o programa seja encerrado. Também
armazena o "cursor" de cada partição da enumeração, permitindo que o crawl
continue exatamente do último ponto (resume).

O acesso é protegido por um ``threading.Lock`` — SQLite aceita apenas uma
escrita por vez, e as escritas aqui são rápidas (um registro por OSC).
"""

from __future__ import annotations

import sqlite3
import threading
from pathlib import Path
from typing import Any, Iterable, Iterator

from models import OSC

_OSC_FIELDS = OSC.field_names()


class Database:
    """Wrapper fino sobre SQLite com API orientada ao domínio."""

    def __init__(self, path: Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(
            self.path, check_same_thread=False, timeout=30
        )
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._conn.execute("PRAGMA synchronous=NORMAL;")
        self._init_schema()

    # ------------------------------------------------------------------ schema
    def _init_schema(self) -> None:
        cols = ",\n            ".join(f"{name} TEXT" for name in _OSC_FIELDS
                                      if name != "id_osc")
        with self._lock, self._conn:
            self._conn.execute(
                f"""
                CREATE TABLE IF NOT EXISTS oscs (
                    id_osc INTEGER PRIMARY KEY,
                    {cols},
                    coletado_em TEXT DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS partitions (
                    chave        TEXT PRIMARY KEY,   -- ex.: 'uf:35'
                    offset       INTEGER DEFAULT 0,
                    concluida    INTEGER DEFAULT 0,
                    total_visto  INTEGER DEFAULT 0,
                    atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS meta (
                    chave TEXT PRIMARY KEY,
                    valor TEXT
                );
                """
            )
            self._conn.execute(
                "CREATE INDEX IF NOT EXISTS ix_oscs_cnpj ON oscs(cnpj);"
            )

    # ------------------------------------------------------------------ OSCs
    def upsert_osc(self, osc: OSC) -> None:
        """Insere ou atualiza uma OSC (idempotente por id_osc)."""
        data = osc.to_dict()
        # Não sobrescreve o raw_json com vazio se já existir algo? Mantemos simples:
        columns = [f for f in _OSC_FIELDS]
        placeholders = ",".join("?" for _ in columns)
        updates = ",".join(f"{c}=excluded.{c}" for c in columns if c != "id_osc")
        values = [data.get(c) for c in columns]
        with self._lock, self._conn:
            self._conn.execute(
                f"""
                INSERT INTO oscs ({",".join(columns)})
                VALUES ({placeholders})
                ON CONFLICT(id_osc) DO UPDATE SET {updates},
                    coletado_em=CURRENT_TIMESTAMP;
                """,
                values,
            )

    def exists(self, id_osc: int) -> bool:
        with self._lock:
            cur = self._conn.execute(
                "SELECT 1 FROM oscs WHERE id_osc=? LIMIT 1;", (id_osc,)
            )
            return cur.fetchone() is not None

    def processed_ids(self) -> set[int]:
        """IDs já coletados — usados para pular registros no resume."""
        with self._lock:
            cur = self._conn.execute("SELECT id_osc FROM oscs;")
            return {row[0] for row in cur.fetchall()}

    def count(self) -> int:
        with self._lock:
            cur = self._conn.execute("SELECT COUNT(*) FROM oscs;")
            return int(cur.fetchone()[0])

    def iter_oscs(self) -> Iterator[dict[str, Any]]:
        """Itera todas as OSCs coletadas (para exportação)."""
        with self._lock:
            cur = self._conn.execute("SELECT * FROM oscs ORDER BY id_osc;")
            rows = cur.fetchall()
        for row in rows:
            yield dict(row)

    # ------------------------------------------------------------- partições
    def get_partition(self, chave: str) -> dict[str, Any]:
        with self._lock:
            cur = self._conn.execute(
                "SELECT chave, offset, concluida, total_visto "
                "FROM partitions WHERE chave=?;",
                (chave,),
            )
            row = cur.fetchone()
        if row is None:
            return {"chave": chave, "offset": 0, "concluida": 0, "total_visto": 0}
        return dict(row)

    def save_partition(
        self, chave: str, offset: int, concluida: bool, total_visto: int
    ) -> None:
        with self._lock, self._conn:
            self._conn.execute(
                """
                INSERT INTO partitions (chave, offset, concluida, total_visto,
                                        atualizado_em)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(chave) DO UPDATE SET
                    offset=excluded.offset,
                    concluida=excluded.concluida,
                    total_visto=excluded.total_visto,
                    atualizado_em=CURRENT_TIMESTAMP;
                """,
                (chave, offset, int(concluida), total_visto),
            )

    def pending_partitions(self, chaves: Iterable[str]) -> list[str]:
        """Dentre ``chaves``, retorna as que ainda não foram concluídas."""
        done = self._completed_partitions()
        return [c for c in chaves if c not in done]

    def _completed_partitions(self) -> set[str]:
        with self._lock:
            cur = self._conn.execute(
                "SELECT chave FROM partitions WHERE concluida=1;"
            )
            return {row[0] for row in cur.fetchall()}

    # ------------------------------------------------------------------- meta
    def set_meta(self, chave: str, valor: str) -> None:
        with self._lock, self._conn:
            self._conn.execute(
                "INSERT INTO meta (chave, valor) VALUES (?, ?) "
                "ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor;",
                (chave, valor),
            )

    def get_meta(self, chave: str, default: str | None = None) -> str | None:
        with self._lock:
            cur = self._conn.execute(
                "SELECT valor FROM meta WHERE chave=?;", (chave,)
            )
            row = cur.fetchone()
        return row[0] if row else default

    def stats(self) -> dict[str, Any]:
        with self._lock:
            total = self._conn.execute("SELECT COUNT(*) FROM oscs;").fetchone()[0]
            com_cnpj = self._conn.execute(
                "SELECT COUNT(*) FROM oscs WHERE cnpj != '';"
            ).fetchone()[0]
            com_email = self._conn.execute(
                "SELECT COUNT(*) FROM oscs WHERE email != '';"
            ).fetchone()[0]
            parts_done = self._conn.execute(
                "SELECT COUNT(*) FROM partitions WHERE concluida=1;"
            ).fetchone()[0]
        return {
            "total": total,
            "com_cnpj": com_cnpj,
            "com_email": com_email,
            "particoes_concluidas": parts_done,
        }

    def close(self) -> None:
        with self._lock:
            self._conn.close()
