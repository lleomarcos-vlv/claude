# -*- coding: utf-8 -*-
"""Exporta a planilha orcamentaria em CSV para preenchimento no SALIC."""
import csv, json, subprocess, sys
from pathlib import Path

BUILD = Path(__file__).resolve().parent
DIST = BUILD.parent / "dist"
DIST.mkdir(exist_ok=True)

subprocess.run([sys.executable, str(BUILD / "orcamento.py")], check=True, capture_output=True)
d = json.loads((BUILD / "orcamento.json").read_text(encoding="utf-8"))

saida = DIST / "PALAVRA-QUE-LIBERTA-Planilha-Orcamentaria.csv"
with saida.open("w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["Etapa", "Item", "Descrição", "Unidade", "Quantidade",
                "Ocorrências", "Valor unitário (R$)", "Valor total (R$)",
                "Justificativa de precificação"])
    for e in d["etapas"]:
        w.writerow([f'ETAPA {e["codigo"]} — {e["titulo"]}', "", "", "", "", "", "", "", ""])
        for i in e["itens"]:
            w.writerow([e["codigo"], i["codigo"], i["descricao"], i["unidade"],
                        i["quantidade"], i["ocorrencias"],
                        f'{i["valor_unitario"]:.2f}'.replace(".", ","),
                        f'{i["total"]:.2f}'.replace(".", ","),
                        i["justificativa"]])
        w.writerow(["", "", f'SUBTOTAL ETAPA {e["codigo"]}', "", "", "", "",
                    f'{e["subtotal"]:.2f}'.replace(".", ","), ""])
    w.writerow([])
    w.writerow(["", "", "BASE DE CÁLCULO (etapas 1+2+3)", "", "", "", "",
                f'{d["valor_base"]:.2f}'.replace(".", ","), ""])
    w.writerow(["", "", "VALOR TOTAL DO PROJETO", "", "", "", "",
                f'{d["valor_total"]:.2f}'.replace(".", ","), ""])
    w.writerow([])
    w.writerow(["VERIFICAÇÃO DOS LIMITES — IN MinC nº 29/2026"])
    w.writerow(["Item", "Limite", "Apurado", "Situação"])
    for v in d["verificacoes"]:
        w.writerow([v["item"], v["limite"], v["apurado"],
                    "CONFORME" if v["ok"] else "EXCEDIDO"])

print(f"CSV gerado: {saida.name} ({saida.stat().st_size/1024:.0f} KB)")
