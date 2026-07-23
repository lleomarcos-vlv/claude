"""
models.py
=========

Modelo de dados canônico de uma OSC (Organização da Sociedade Civil).

Centraliza o schema em um único ``dataclass`` tipado, com utilitários para
serialização (dict/linha de planilha) e para a lista completa de campos. Todos
os módulos (parser, database, excel, webapp) usam este contrato.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, fields, asdict
from typing import Any


@dataclass
class OSC:
    """Registro completo e normalizado de uma OSC."""

    # Identificação
    id_osc: int | None = None
    nome: str = ""
    razao_social: str = ""
    nome_fantasia: str = ""
    cnpj: str = ""
    situacao: str = ""
    natureza_juridica: str = ""

    # Endereço
    endereco: str = ""
    numero: str = ""
    complemento: str = ""
    bairro: str = ""
    cidade: str = ""
    uf: str = ""
    estado: str = ""
    cep: str = ""
    codigo_municipio_ibge: str = ""
    latitude: str = ""
    longitude: str = ""

    # Atuação
    area_atuacao: str = ""
    atividade_economica: str = ""
    data_fundacao: str = ""
    data_cadastro_cnpj: str = ""
    responsavel: str = ""

    # Contato
    telefone: str = ""
    celular: str = ""
    whatsapp: str = ""
    email: str = ""
    site: str = ""

    # Redes sociais
    facebook: str = ""
    instagram: str = ""
    linkedin: str = ""
    youtube: str = ""

    # Capital humano
    num_funcionarios: str = ""
    num_voluntarios: str = ""

    # Vínculos e títulos
    convenios: str = ""
    certificacoes: str = ""
    oscip: str = ""
    cebas: str = ""
    utilidade_publica: str = ""

    # Descrição / complementos
    resumo: str = ""
    situacao_imovel: str = ""
    observacoes: str = ""

    # Metadados de coleta (não exportados por padrão para o Excel principal)
    fonte: str = "api"
    raw_json: str = ""

    # ------------------------------------------------------------------ util
    @classmethod
    def field_names(cls) -> list[str]:
        return [f.name for f in fields(cls)]

    @property
    def endereco_completo(self) -> str:
        """Endereço em uma linha: logradouro, número - complemento."""
        partes: list[str] = []
        if self.endereco:
            partes.append(self.endereco)
        if self.numero:
            partes.append(str(self.numero))
        base = ", ".join(partes)
        if self.complemento:
            base = f"{base} - {self.complemento}" if base else self.complemento
        return base.strip(" ,-")

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_row(self, columns: list[tuple[str, str]]) -> list[Any]:
        """Gera a linha de planilha na ordem das ``columns`` (chave, título)."""
        row: list[Any] = []
        for key, _title in columns:
            if key == "endereco_completo":
                row.append(self.endereco_completo)
            else:
                row.append(getattr(self, key, ""))
        return row

    def merge(self, other: "OSC") -> "OSC":
        """Preenche campos vazios deste registro com valores de ``other``."""
        for f in fields(self):
            if not getattr(self, f.name) and getattr(other, f.name):
                setattr(self, f.name, getattr(other, f.name))
        return self

    def dumps_raw(self, extra: dict[str, Any]) -> None:
        """Serializa o JSON bruto agregado (para auditoria/rastreabilidade)."""
        try:
            self.raw_json = json.dumps(extra, ensure_ascii=False, default=str)
        except (TypeError, ValueError):
            self.raw_json = ""


@dataclass
class OSCStub:
    """Registro mínimo produzido pela enumeração (lista de resultados)."""

    id_osc: int
    nome: str = ""
    cnpj: str = ""
    natureza_juridica: str = ""
    endereco: str = ""
    area_atuacao: str = ""

    def to_osc(self) -> OSC:
        return OSC(
            id_osc=self.id_osc,
            nome=self.nome,
            cnpj=self.cnpj,
            natureza_juridica=self.natureza_juridica,
            endereco=self.endereco,
            area_atuacao=self.area_atuacao,
        )
