#!/usr/bin/env python3
"""
Gera os dois PDFs.

    python3 gerar_pdfs.py

Para colocar seus dados reais (telefone, e-mail, credenciais, valores), edite
o arquivo src/dados.py e rode este script de novo. Os campos ainda não
preenchidos aparecem no PDF destacados em dourado, no formato
"[ preencher: ... ]".
"""

import os
import sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(RAIZ, "src"))

SAIDA = os.path.join(RAIZ, "saida")

DOCS = [
    ("doc1_proposta_capacitacao",
     "1 - Proposta de Capacitacao em Drones - Seguranca Publica e Defesa.pdf"),
    ("doc2_rotas_certificacao",
     "2 - Rotas Legais de Certificacao - Cursos de Drones.pdf"),
]


def main():
    os.makedirs(SAIDA, exist_ok=True)
    import importlib

    falhas = 0
    for modulo, nome in DOCS:
        destino = os.path.join(SAIDA, nome)
        try:
            mod = importlib.import_module(modulo)
            mod.gerar(destino)
            tam = os.path.getsize(destino) / 1024.0
            print(f"  OK   {nome}  ({tam:.0f} KB)")
        except Exception as exc:  # noqa: BLE001
            falhas += 1
            print(f"  ERRO {nome}: {type(exc).__name__}: {exc}")
            import traceback
            traceback.print_exc()

    print()
    if falhas:
        print(f"{falhas} documento(s) com erro.")
        return 1
    print(f"Concluído. Arquivos em: {SAIDA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
