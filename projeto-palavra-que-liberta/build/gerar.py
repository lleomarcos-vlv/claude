# -*- coding: utf-8 -*-
"""
Monta o HTML final do dossie e gera o PDF via Chromium headless.

Fluxo:
  1. executa orcamento.py (garante orcamento.json atualizado)
  2. concatena as partes de src/partes/ na ordem alfabetica
  3. injeta as tabelas geradas a partir do orcamento
  4. embute o CSS
  5. renderiza o PDF com o Chromium

Uso:  python3 build/gerar.py
"""

import json
import re
import subprocess
import sys
from pathlib import Path

BUILD = Path(__file__).resolve().parent
ROOT = BUILD.parent
SRC = ROOT / "src"
PARTES = SRC / "partes"
DIST = ROOT / "dist"
DIST.mkdir(exist_ok=True)

CHROME_CANDIDATOS = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
]


def brl(v):
    return "R$ " + f"{v:,.2f}".replace(",", "@").replace(".", ",").replace("@", ".")


def num(v):
    """Formata quantidade: inteiro sem casas, fracionario com duas."""
    return str(int(v)) if float(v).is_integer() else f"{v:.2f}".replace(".", ",")


# ------------------------------------------------------------- planilha ----

def tabela_planilha(dados):
    """Planilha orcamentaria analitica completa, etapa por etapa."""
    linhas = [
        '<h2>13.1 Planilha analítica por etapa</h2>',
        '<table class="compacta">',
        "<thead><tr>"
        '<th style="width:7%">Item</th>'
        '<th style="width:39%">Descrição</th>'
        '<th class="centro" style="width:9%">Unidade</th>'
        '<th class="centro" style="width:6%">Qtd.</th>'
        '<th class="centro" style="width:7%">Ocorr.</th>'
        '<th class="num" style="width:15%">Valor unit.</th>'
        '<th class="num" style="width:17%">Total</th>'
        "</tr></thead><tbody>",
    ]

    for etapa in dados["etapas"]:
        linhas.append(
            f'<tr class="etapa-cabecalho"><td colspan="7">ETAPA {etapa["codigo"]} — '
            f'{etapa["titulo"]}</td></tr>'
        )
        for i in etapa["itens"]:
            just = (
                f'<span class="rubrica-just">{i["justificativa"]}</span>'
                if i.get("justificativa")
                else ""
            )
            linhas.append(
                f'<tr><td>{i["codigo"]}</td>'
                f'<td>{i["descricao"]}{just}</td>'
                f'<td class="centro">{i["unidade"]}</td>'
                f'<td class="centro">{num(i["quantidade"])}</td>'
                f'<td class="centro">{num(i["ocorrencias"])}</td>'
                f'<td class="num">{brl(i["valor_unitario"])}</td>'
                f'<td class="num">{brl(i["total"])}</td></tr>'
            )
        linhas.append(
            f'<tr class="subtotal"><td colspan="6">SUBTOTAL DA ETAPA {etapa["codigo"]}</td>'
            f'<td class="num">{brl(etapa["subtotal"])}</td></tr>'
        )

    linhas.append(
        f'<tr class="subtotal"><td colspan="6">BASE DE CÁLCULO — ETAPAS FINALÍSTICAS (1+2+3)</td>'
        f'<td class="num">{brl(dados["valor_base"])}</td></tr>'
    )
    linhas.append(
        f'<tr class="total"><td colspan="6"><strong>VALOR TOTAL DO PROJETO</strong></td>'
        f'<td class="num"><strong>{brl(dados["valor_total"])}</strong></td></tr>'
    )
    linhas.append("</tbody></table>")
    return "\n".join(linhas)


def tabela_resumo(dados, com_acumulado=True):
    """Resumo por etapa com percentuais calculados do JSON."""
    meses = {
        "1": "1 a 3", "2": "3 a 14", "3": "12 a 16",
        "4": "1 a 16", "5": "1 a 16", "6": "conforme captação",
    }
    total = dados["valor_total"]
    cab = (
        '<table class="compacta"><thead><tr>'
        '<th style="width:34%">Etapa</th>'
        '<th class="centro" style="width:16%">Meses</th>'
        '<th class="num" style="width:20%">Valor</th>'
        '<th class="centro" style="width:13%">% do total</th>'
        + ('<th class="centro">Acumulado</th>' if com_acumulado else "")
        + "</tr></thead><tbody>"
    )
    linhas = [cab]
    acum = 0.0
    for e in dados["etapas"]:
        p = e["subtotal"] / total * 100
        acum += p
        col = f'<td class="centro">{acum:.2f}%</td>'.replace(".", ",") if com_acumulado else ""
        linhas.append(
            f'<tr><td>{e["codigo"]} — {e["titulo"].capitalize()}</td>'
            f'<td class="centro">{meses[e["codigo"]]}</td>'
            f'<td class="num">{brl(e["subtotal"])}</td>'
            f'<td class="centro">{p:.2f}%</td>'.replace(".", ",") + col + "</tr>"
        )
    extra = '<td class="centro">—</td>' if com_acumulado else ""
    linhas.append(
        '<tr class="total"><td><strong>Total</strong></td>'
        '<td class="centro"><strong>16 meses</strong></td>'
        f'<td class="num"><strong>{brl(total)}</strong></td>'
        '<td class="centro"><strong>100,00%</strong></td>' + extra + "</tr>"
    )
    linhas.append("</tbody></table>")
    fin = dados["percentuais"]["finalisticas"]
    linhas.append(
        f'<p class="nota">As etapas finalísticas — pré-produção, produção e '
        f'pós-produção — concentram <strong>{fin:.2f}%</strong> do orçamento. '
        "Custos vinculados (acessibilidade e comunicação, administrativos e captação) "
        "somam o restante, todos dentro dos respectivos limites normativos.</p>".replace(
            f"{fin:.2f}", f"{fin:.2f}".replace(".", ",")
        )
    )
    return "\n".join(linhas)


def tabela_verificacoes(dados, estilo_check=False):
    """Tabela de verificacao dos limites normativos."""
    if estilo_check:
        linhas = [
            '<table class="check compacta"><thead><tr>'
            '<th class="centro" style="width:6%">✓</th>'
            '<th style="width:38%">Limite normativo</th>'
            "<th>Apurado neste projeto</th>"
            "</tr></thead><tbody>"
        ]
        for v in dados["verificacoes"]:
            marca = '<td class="centro ok">✓</td>' if v["ok"] else '<td class="centro">✗</td>'
            linhas.append(
                f'{ "<tr>" }{marca}<td>{v["item"]} — <em>{v["limite"]}</em></td>'
                f'<td>{v["apurado"]}</td></tr>'
            )
        linhas.append("</tbody></table>")
        return "\n".join(linhas)

    linhas = [
        "<table><thead><tr>"
        '<th style="width:34%">Item verificado</th>'
        '<th style="width:30%">Limite normativo</th>'
        '<th style="width:22%">Apurado</th>'
        '<th class="centro">Situação</th>'
        "</tr></thead><tbody>"
    ]
    for v in dados["verificacoes"]:
        selo = (
            '<span class="status-ok">Conforme</span>'
            if v["ok"]
            else '<span style="color:#9B2226;font-weight:700">Excedido</span>'
        )
        linhas.append(
            f'<tr><td><strong>{v["item"]}</strong></td>'
            f'<td>{v["limite"]}</td>'
            f'<td>{v["apurado"]}</td>'
            f'<td class="centro">{selo}</td></tr>'
        )
    linhas.append("</tbody></table>")
    return "\n".join(linhas)


# ------------------------------------------------------------- montagem ----

def montar_html():
    subprocess.run([sys.executable, str(BUILD / "orcamento.py")],
                   check=True, capture_output=True)
    dados = json.loads((BUILD / "orcamento.json").read_text(encoding="utf-8"))

    partes = sorted(PARTES.glob("*.html"))
    if not partes:
        raise SystemExit("Nenhuma parte encontrada em src/partes/")
    corpo = "\n\n".join(p.read_text(encoding="utf-8") for p in partes)

    corpo = corpo.replace("<!--PLANILHA-->", tabela_planilha(dados))
    corpo = corpo.replace("<!--RESUMO_ETAPAS-->", tabela_resumo(dados, True))
    corpo = corpo.replace("<!--RESUMO_ETAPAS_2-->", tabela_resumo(dados, False))
    corpo = corpo.replace("<!--VERIFICACOES-->", tabela_verificacoes(dados, False))
    corpo = corpo.replace("<!--VERIFICACOES_CHECK-->", tabela_verificacoes(dados, True))

    restantes = re.findall(r"<!--([A-Z_0-9]+)-->", corpo)
    if restantes:
        raise SystemExit(f"Placeholders não substituídos: {set(restantes)}")

    css = (SRC / "estilo.css").read_text(encoding="utf-8")
    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Palavra que Liberta — Rede de Leitura, Escrita e Cidadania</title>
<meta name="author" content="Associação Franz de Castro Holzwarth">
<meta name="description" content="Projeto cultural para a Lei Federal de Incentivo à Cultura — Ribeirão Preto/SP">
<style>
{css}
</style>
</head>
<body>
{corpo}
</body>
</html>
"""
    saida = BUILD / "projeto.html"
    saida.write_text(html, encoding="utf-8")
    return saida, dados


def achar_chrome():
    for c in CHROME_CANDIDATOS:
        if Path(c).exists():
            return c
    raise SystemExit("Chromium não encontrado nos caminhos conhecidos.")


def gerar_pdf(html_path, pdf_path):
    chrome = achar_chrome()
    cmd = [
        chrome, "--headless", "--disable-gpu", "--no-sandbox",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=15000",
        f"--print-to-pdf={pdf_path}",
        f"file://{html_path}",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if not Path(pdf_path).exists():
        print(r.stdout, r.stderr)
        raise SystemExit("Falha ao gerar o PDF.")
    return pdf_path


def gerar_guia():
    """Documento complementar: guia de conformidade da Lei Rouanet."""
    css = (SRC / "estilo.css").read_text(encoding="utf-8")
    corpo = (SRC / "guia.html").read_text(encoding="utf-8")
    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Lei Rouanet — o que a lei exige · Guia de conformidade</title>
<meta name="author" content="Associação Franz de Castro Holzwarth">
<style>
{css}
</style>
</head>
<body>
{corpo}
</body>
</html>
"""
    hp = BUILD / "guia.html"
    hp.write_text(html, encoding="utf-8")
    pdf = DIST / "GUIA-CONFORMIDADE-LEI-ROUANET-2026.pdf"
    gerar_pdf(hp, pdf)
    return pdf


if __name__ == "__main__":
    html_path, dados = montar_html()
    pdf = DIST / "PALAVRA-QUE-LIBERTA-Projeto-Completo.pdf"
    gerar_pdf(html_path, pdf)
    guia = gerar_guia()

    print(f"Dossiê do projeto : {pdf.name}  ({pdf.stat().st_size/1024:.0f} KB)")
    print(f"Guia de conformid.: {guia.name}  ({guia.stat().st_size/1024:.0f} KB)")
    print(f"Valor total do projeto: {brl(dados['valor_total'])}")
    print("Limites normativos:",
          "todos conformes" if all(v["ok"] for v in dados["verificacoes"]) else "VERIFICAR")
