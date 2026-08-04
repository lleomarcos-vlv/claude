#!/usr/bin/env python3
"""
Gera o folheto A4 frente e verso da Kairós MF para entrega em lojas.

Uso:
    python3 gerar_pdf.py

Saída (em dist/, com um .html de cada para conferir na tela):
    kairos-mf-folheto-lojas.pdf                   arte até a borda, para gráfica
    kairos-mf-folheto-lojas-impressora-comum.pdf  com margem, para impressora de mesa

Os textos ficam em conteudo.json e os contatos em config.json.
Nenhum dos dois exige mexer neste arquivo.
"""

import base64
import io
import json
import shutil
import subprocess
import sys
from html import escape
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
DIST = RAIZ / "dist"
FONTES = RAIZ / "fontes"
NOME_SAIDA = "kairos-mf-folheto-lojas"

# Um valor que ainda comece com isto é tratado como campo não preenchido e sai
# destacado no PDF, para ninguém imprimir mil folhas com o telefone errado.
MARCA_PENDENTE = "PREENCHER"

# Quanto a arte encolhe na versão para impressora comum. 0.93 deixa cerca de
# 7 mm livres nas laterais e 10 mm em cima e embaixo — folga suficiente para a
# margem que impressoras domésticas e de escritório não conseguem imprimir.
ESCALA_MARGEM_SEGURA = 0.93

CORES = {
    "tinta": "#12212F",
    "azul": "#0D2340",
    "ambar": "#E9A020",
    "ambar_claro": "#FBF0DA",
    "papel": "#FFFFFF",
    "papel_tom": "#F6F4EF",
    "linha": "#DCD8CF",
    "apoio": "#5B6773",
}

PESOS_FONTE = [
    ("Inter", 400, "Inter-Regular.woff2"),
    ("Inter", 500, "Inter-Medium.woff2"),
    ("Inter", 600, "Inter-SemiBold.woff2"),
    ("Inter", 700, "Inter-Bold.woff2"),
    ("Inter Display", 700, "InterDisplay-Bold.woff2"),
    ("Inter Display", 800, "InterDisplay-ExtraBold.woff2"),
    ("Inter Display", 900, "InterDisplay-Black.woff2"),
]


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------

def pendente(valor):
    """Diz se um campo do config.json ainda está com o texto de exemplo."""
    return not valor or str(valor).strip().upper().startswith(MARCA_PENDENTE)


def limpo(valor):
    """Remove o prefixo PREENCHER para mostrar só o exemplo em si."""
    texto = str(valor or "").strip()
    if texto.upper().startswith(MARCA_PENDENTE):
        texto = texto[len(MARCA_PENDENTE):].strip()
    return texto


def campo(valor, vazio="a preencher"):
    """Devolve o HTML de um dado de contato, destacando o que falta preencher."""
    if pendente(valor):
        return f'<span class="pendente">{escape(limpo(valor) or vazio)}</span>'
    return escape(str(valor).strip())


def linhas(texto):
    """Escapa o texto e transforma quebras de linha do JSON em <br>.

    Serve para controlar à mão onde os títulos grandes quebram, em vez de
    deixar uma palavra solta na última linha.
    """
    return "<br>".join(escape(parte) for parte in str(texto).split("\n"))


def fontes_embutidas():
    """Lê as fontes do disco e devolve as regras @font-face já com os dados dentro."""
    regras = []
    for familia, peso, arquivo in PESOS_FONTE:
        caminho = FONTES / arquivo
        if not caminho.exists():
            print(f"  aviso: fonte ausente, seguindo sem ela -> {arquivo}")
            continue
        dados = base64.b64encode(caminho.read_bytes()).decode("ascii")
        regras.append(
            f"@font-face{{font-family:'{familia}';font-style:normal;"
            f"font-weight:{peso};font-display:block;"
            f"src:url(data:font/woff2;base64,{dados}) format('woff2');}}"
        )
    return "\n".join(regras)


def qrcode_whatsapp(cfg):
    """
    Monta o QR do WhatsApp em SVG. Sem o número internacional no config.json
    devolve None, e o folheto imprime um espaço reservado no lugar.
    """
    numero = "".join(ch for ch in str(cfg.get("whatsapp_numero_internacional", "")) if ch.isdigit())
    if not numero:
        return None

    from urllib.parse import quote

    destino = f"https://wa.me/{numero}"
    mensagem = str(cfg.get("whatsapp_mensagem", "")).strip()
    if mensagem:
        destino += f"?text={quote(mensagem)}"

    import qrcode
    import qrcode.image.svg

    imagem = qrcode.make(
        destino,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
        image_factory=qrcode.image.svg.SvgPathImage,
    )
    buffer = io.BytesIO()
    imagem.save(buffer)
    svg = buffer.getvalue().decode("utf-8")
    return svg[svg.index("<svg"):]


# --------------------------------------------------------------------------
# Blocos da página
# --------------------------------------------------------------------------

def bloco_frente(cfg, txt):
    itens = "".join(
        f'<li><span class="quadro"></span><span class="dor">{escape(item)}</span></li>'
        for item in txt["checklist"]
    )
    return f"""
<section class="pagina frente">
  <header class="capa">
    <div class="capa-topo">
      <div class="marca">
        <div class="marca-nome">{escape(cfg["marca"])}</div>
        <div class="marca-sub">{escape(cfg["marca_linha2"])}</div>
      </div>
      <div class="capa-kicker">{linhas(txt["kicker"])}</div>
    </div>

    <h1 class="titulo">
      <span class="t-linha">{linhas(txt["titulo_linha1"])}</span>
      <span class="t-linha">{linhas(txt["titulo_linha2"])}</span>
      <span class="t-destaque">{linhas(txt["titulo_destaque"])}</span>
    </h1>
  </header>

  <div class="corpo">
    <p class="chamada">{escape(txt["chamada"])}</p>

    <div class="checklist">
      <div class="secao-cabeca">
        <h2 class="secao-titulo">{escape(txt["checklist_titulo"])}</h2>
        <p class="secao-apoio">{escape(txt["checklist_apoio"])}</p>
      </div>
      <ul class="dores">{itens}</ul>
    </div>
  </div>

  <footer class="faixa">
    <strong>{escape(txt["faixa_final_forte"])}</strong>
    <span>{escape(txt["faixa_final_texto"])}</span>
    <span class="vira">vire &rarr;</span>
  </footer>
</section>
"""


def bloco_verso(cfg, txt):
    passos = "".join(
        f"""<li class="passo">
              <div class="passo-num">{i}</div>
              <div class="passo-txt">
                <h3>{escape(p["titulo"])}</h3>
                <p>{escape(p["texto"])}</p>
              </div>
            </li>"""
        for i, p in enumerate(txt["passos"], start=1)
    )

    exemplos = "".join(
        f'<li>{escape(item)}</li>' for item in txt["exemplos"]
    )

    linhas = "".join(
        f"""<tr>
              <td class="c-antes">{escape(antes)}</td>
              <td class="c-depois">{escape(depois)}</td>
            </tr>"""
        for antes, depois in txt["comparativo"]
    )

    svg_qr = qrcode_whatsapp(cfg)
    if svg_qr:
        qr_html = f'<div class="qr">{svg_qr}</div>'
    else:
        qr_html = (
            '<div class="qr qr-vazio">'
            '<span>QR do WhatsApp</span>'
            '<small>preencha whatsapp_numero_internacional no config.json</small>'
            "</div>"
        )

    cnpj = str(cfg.get("cnpj", "")).strip()
    linha_cnpj = f' &nbsp;·&nbsp; CNPJ {escape(cnpj)}' if cnpj else ""

    consultor = str(cfg.get("consultor", "")).strip()
    valor_consultor = (
        f'<span class="preenchido">{escape(consultor)}</span>'
        if consultor else '<span class="linha-manual"></span>'
    )

    return f"""
<section class="pagina verso">
  <header class="verso-topo">
    <div class="marca marca-mini">
      <div class="marca-nome">{escape(cfg["marca"])}</div>
      <div class="marca-sub">{escape(cfg["marca_linha2"])}</div>
    </div>
    <div class="verso-kicker">{escape(cfg["assinatura_rodape"])}</div>
  </header>

  <div class="verso-corpo">
    <div class="secao-cabeca">
      <h2 class="secao-titulo">{escape(txt["passos_titulo"])}</h2>
      <p class="secao-apoio">{escape(txt["passos_apoio"])}</p>
    </div>
    <ol class="passos">{passos}</ol>

    <div class="duas-colunas">
      <div class="coluna">
        <div class="secao-cabeca">
          <h2 class="secao-titulo">{escape(txt["exemplos_titulo"])}</h2>
          <p class="secao-apoio">{escape(txt["exemplos_apoio"])}</p>
        </div>
        <ul class="exemplos">{exemplos}</ul>
      </div>

      <div class="coluna">
        <div class="secao-cabeca">
          <h2 class="secao-titulo">{escape(txt["comparativo_titulo"])}</h2>
        </div>
        <table class="comparativo">
          <thead>
            <tr>
              <th class="c-antes">{escape(txt["comparativo_col1"])}</th>
              <th class="c-depois">{escape(txt["comparativo_col2"])}</th>
            </tr>
          </thead>
          <tbody>{linhas}</tbody>
        </table>
      </div>
    </div>

    <div class="cta">
      <div class="cta-texto">
        <span class="cta-selo">{escape(txt["cta_selo"])}</span>
        <h2>{escape(txt["cta_titulo"])}</h2>
        <p>{escape(txt["cta_texto"])}</p>
        <div class="contato-forte">{campo(cfg["whatsapp"], "(00) 00000-0000")}</div>
        <ul class="contatos">
          <li><b>E-mail</b> {campo(cfg["email"])}</li>
          <li><b>Site</b> {campo(cfg["site"])}</li>
          <li><b>Instagram</b> {campo(cfg["instagram"])}</li>
          <li><b>Atendemos</b> {campo(cfg["cidade"])}</li>
          <li><b>Horário</b> {campo(cfg["atendimento"])}</li>
        </ul>
      </div>
      <div class="cta-qr">
        {qr_html}
        <p class="qr-label">{escape(txt["cta_qr_label"])}</p>
      </div>
    </div>
  </div>

  <footer class="verso-rodape">
    <div class="manual">
      <span>{escape(txt["rodape_campos_label"])}</span> {valor_consultor}
      <span class="sep">{escape(txt["rodape_data_label"])}</span>
      <span class="linha-manual curta"></span>
    </div>
    <div class="assinatura">{escape(cfg["assinatura_rodape"])}{linha_cnpj}</div>
  </footer>
</section>
"""


# --------------------------------------------------------------------------
# CSS
# --------------------------------------------------------------------------

def css():
    c = CORES
    return f"""
*{{box-sizing:border-box;margin:0;padding:0}}

@page{{size:A4;margin:0}}

html,body{{
  font-family:'Inter','Liberation Sans',Arial,sans-serif;
  color:{c['tinta']};
  background:#fff;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
  text-rendering:optimizeLegibility;
}}

.pagina{{
  width:210mm;height:297mm;
  background:{c['papel']};
  position:relative;overflow:hidden;
  display:flex;flex-direction:column;
  margin:0 auto;
  page-break-after:always;break-after:page;
}}
.pagina:last-child{{page-break-after:auto;break-after:auto}}

@media screen{{
  body{{padding:14mm 0;background:#8B8F94}}
  .pagina{{box-shadow:0 6px 26px rgba(0,0,0,.34);margin-bottom:14mm}}
}}

/* Versão para impressora de casa ou de escritório: a arte é reduzida e
   centralizada, porque essas impressoras têm uma faixa de 4 a 6 mm nas bordas
   onde não conseguem imprimir. Sem isso, as tarjas azul e amarela saem
   cortadas. Para gráfica, use o arquivo sem esse ajuste. */
body.margem-segura .pagina{{
  transform:scale({ESCALA_MARGEM_SEGURA});
  transform-origin:center center;
}}

/* ---------- tipografia base ---------- */
.secao-cabeca{{margin-bottom:3.6mm}}
.secao-titulo{{
  font-family:'Inter Display','Inter',sans-serif;
  font-weight:800;font-size:14.2pt;letter-spacing:-.018em;
  color:{c['azul']};line-height:1.12;
}}
.secao-titulo::after{{
  content:"";display:block;width:15mm;height:1.5mm;
  background:{c['ambar']};border-radius:1mm;margin-top:2.4mm;
}}
.secao-apoio{{
  font-size:9.1pt;color:{c['apoio']};margin-top:2.6mm;line-height:1.45;
}}

/* =======================================================================
   FRENTE
   ======================================================================= */
.capa{{
  background:{c['azul']};color:#fff;
  padding:13mm 15mm 12mm;
  position:relative;
}}
.capa::after{{
  content:"";position:absolute;left:0;right:0;bottom:0;
  height:2.2mm;background:{c['ambar']};
}}
.capa-topo{{
  display:flex;align-items:flex-start;justify-content:space-between;
  gap:8mm;padding-bottom:11mm;
  border-bottom:.35mm solid rgba(255,255,255,.22);
}}
.marca-nome{{
  font-family:'Inter Display','Inter',sans-serif;
  font-weight:900;font-size:17pt;letter-spacing:.10em;line-height:1;
}}
.marca-sub{{
  font-weight:600;font-size:6.9pt;letter-spacing:.235em;
  color:{c['ambar']};margin-top:1.9mm;
}}
.capa-kicker{{
  max-width:66mm;text-align:right;
  font-size:8.1pt;line-height:1.5;color:rgba(255,255,255,.74);
  padding-top:1.5mm;
}}

.titulo{{margin-top:11mm}}
.t-linha{{
  display:block;
  font-family:'Inter Display','Inter',sans-serif;
  font-weight:800;font-size:26pt;line-height:1.14;letter-spacing:-.028em;
  color:rgba(255,255,255,.93);
}}
.t-destaque{{
  display:block;margin-top:4mm;
  font-family:'Inter Display','Inter',sans-serif;
  font-weight:900;font-size:26pt;line-height:1.14;letter-spacing:-.028em;
  color:{c['ambar']};
}}

.corpo{{
  flex:1;padding:11mm 15mm 0;
  display:flex;flex-direction:column;
}}
.chamada{{
  font-size:11.1pt;line-height:1.58;color:{c['tinta']};
  padding-left:5mm;border-left:1.2mm solid {c['ambar']};
  margin-bottom:11mm;
}}

.checklist{{flex:1}}
.dores{{list-style:none;margin-top:5.5mm}}
.dores li{{
  display:flex;gap:4.2mm;align-items:flex-start;
  padding:3.5mm 0;
  border-bottom:.3mm solid {c['linha']};
}}
.dores li:first-child{{border-top:.3mm solid {c['linha']}}}
.quadro{{
  flex:none;width:5.2mm;height:5.2mm;margin-top:.4mm;
  border:.5mm solid {c['azul']};border-radius:1.1mm;background:#fff;
}}
.dor{{font-size:10.1pt;line-height:1.44}}

.faixa{{
  background:{c['ambar']};
  padding:6.5mm 15mm;
  display:flex;align-items:baseline;gap:3.5mm;
}}
.faixa strong{{
  font-family:'Inter Display','Inter',sans-serif;
  font-weight:900;font-size:12.4pt;color:{c['azul']};
  white-space:nowrap;letter-spacing:-.01em;
}}
.faixa span{{font-size:9.5pt;line-height:1.42;color:#3E2E0C}}
.faixa .vira{{
  margin-left:auto;white-space:nowrap;
  font-weight:700;font-size:9.5pt;color:{c['azul']};
}}

/* =======================================================================
   VERSO
   ======================================================================= */
.verso-topo{{
  background:{c['azul']};color:#fff;
  padding:6.5mm 15mm;
  display:flex;align-items:center;justify-content:space-between;gap:8mm;
  border-bottom:1.8mm solid {c['ambar']};
}}
.marca-mini .marca-nome{{font-size:12.4pt}}
.marca-mini .marca-sub{{font-size:5.9pt;margin-top:1.4mm}}
.verso-kicker{{font-size:8pt;color:rgba(255,255,255,.62)}}

.verso-corpo{{flex:1;padding:7.5mm 15mm 0;display:flex;flex-direction:column}}

/* passos */
.passos{{
  list-style:none;display:grid;grid-template-columns:repeat(4,1fr);
  gap:3.8mm;margin-bottom:7mm;
}}
.passo{{
  background:{c['papel_tom']};
  border:.3mm solid {c['linha']};
  border-top:1.4mm solid {c['azul']};
  border-radius:1.6mm;
  padding:3.6mm 3.4mm;
}}
.passo-num{{
  width:6.6mm;height:6.6mm;border-radius:50%;
  background:{c['ambar']};color:{c['azul']};
  font-family:'Inter Display','Inter',sans-serif;font-weight:900;font-size:9.6pt;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:2.6mm;
}}
.passo-txt h3{{
  font-family:'Inter Display','Inter',sans-serif;
  font-weight:800;font-size:9.1pt;line-height:1.18;
  color:{c['azul']};margin-bottom:1.9mm;letter-spacing:-.012em;
}}
.passo-txt p{{font-size:7.6pt;line-height:1.42;color:{c['apoio']}}}

/* duas colunas */
.duas-colunas{{
  display:grid;grid-template-columns:1fr 1fr;gap:9mm;
  margin-bottom:7mm;
}}
.exemplos{{list-style:none}}
.exemplos li{{
  position:relative;padding:1.9mm 0 1.9mm 5.6mm;
  font-size:8.5pt;line-height:1.38;
  border-bottom:.3mm dotted {c['linha']};
}}
.exemplos li:last-child{{border-bottom:0}}
.exemplos li::before{{
  content:"";position:absolute;left:0;top:3.5mm;
  width:2.2mm;height:2.2mm;border-radius:.5mm;
  background:{c['ambar']};
}}

.comparativo{{width:100%;border-collapse:collapse;margin-top:.6mm}}
.comparativo th{{
  font-size:7.3pt;font-weight:700;letter-spacing:.055em;text-transform:uppercase;
  padding:2.3mm 2.8mm;text-align:left;
}}
.comparativo th.c-antes{{color:{c['apoio']};background:{c['papel_tom']}}}
.comparativo th.c-depois{{color:#fff;background:{c['azul']}}}
.comparativo td{{
  font-size:8pt;line-height:1.34;padding:2.3mm 2.8mm;
  border-bottom:.3mm solid {c['linha']};vertical-align:top;
}}
.comparativo td.c-antes{{color:{c['apoio']};background:{c['papel_tom']}}}
.comparativo td.c-depois{{color:{c['tinta']};font-weight:600;background:{c['ambar_claro']}}}

/* chamada para ação */
.cta{{
  margin-top:auto;
  background:{c['azul']};color:#fff;border-radius:2.2mm;
  display:flex;gap:8mm;padding:6.8mm 7mm;
  position:relative;overflow:hidden;
}}
.cta::before{{
  content:"";position:absolute;left:0;top:0;bottom:0;width:2mm;background:{c['ambar']};
}}
.cta-texto{{flex:1}}
.cta-selo{{
  display:inline-block;background:{c['ambar']};color:{c['azul']};
  font-size:6.9pt;font-weight:700;letter-spacing:.075em;text-transform:uppercase;
  padding:1.3mm 2.6mm;border-radius:.9mm;margin-bottom:3mm;
}}
.cta-texto h2{{
  font-family:'Inter Display','Inter',sans-serif;
  font-weight:900;font-size:15pt;line-height:1.12;letter-spacing:-.024em;
  margin-bottom:2.4mm;
}}
.cta-texto>p{{
  font-size:8.4pt;line-height:1.46;color:rgba(255,255,255,.78);
  margin-bottom:3.8mm;max-width:105mm;
}}
.contato-forte{{
  font-family:'Inter Display','Inter',sans-serif;
  font-weight:900;font-size:17.5pt;line-height:1.28;letter-spacing:-.02em;
  color:{c['ambar']};margin-bottom:3mm;
}}
.contatos{{
  list-style:none;display:grid;grid-template-columns:1fr 1fr;
  gap:1.5mm 6mm;
}}
.contatos li{{font-size:8.1pt;line-height:1.36;color:rgba(255,255,255,.88)}}
.contatos b{{
  display:block;font-size:6.6pt;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:.5mm;
}}
.pendente{{
  color:{c['ambar']};border-bottom:.3mm dashed {c['ambar']};padding-bottom:.3mm;
}}
.contato-forte .pendente{{border-bottom-width:.5mm}}

.cta-qr{{
  flex:none;width:34mm;display:flex;flex-direction:column;align-items:center;
}}
.qr{{
  width:34mm;height:34mm;background:#fff;border-radius:1.6mm;padding:2.2mm;
}}
.qr svg{{width:100%;height:100%;display:block}}
.qr-vazio{{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:1.6mm;text-align:center;padding:3mm;
  background:rgba(255,255,255,.07);
  border:.4mm dashed rgba(255,255,255,.4);
}}
.qr-vazio span{{font-size:8pt;font-weight:700;color:{c['ambar']}}}
.qr-vazio small{{font-size:5.9pt;line-height:1.32;color:rgba(255,255,255,.55)}}
.qr-label{{
  font-size:7.2pt;line-height:1.32;text-align:center;
  color:rgba(255,255,255,.62);margin-top:2.6mm;
}}

/* rodapé */
.verso-rodape{{
  padding:4.5mm 15mm 6mm;
  display:flex;align-items:flex-end;justify-content:space-between;gap:8mm;
}}
.manual{{font-size:7.8pt;color:{c['apoio']};display:flex;align-items:baseline;gap:2.2mm}}
.manual .sep{{margin-left:4mm}}
.linha-manual{{
  display:inline-block;width:38mm;
  border-bottom:.3mm solid {c['apoio']};
}}
.linha-manual.curta{{width:20mm}}
.preenchido{{font-weight:600;color:{c['tinta']}}}
.assinatura{{font-size:7.2pt;color:#9AA2AB;text-align:right}}
"""


# --------------------------------------------------------------------------
# Montagem e geração
# --------------------------------------------------------------------------

def montar_html(cfg, txt, margem_segura=False):
    classe = ' class="margem-segura"' if margem_segura else ""
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>{escape(cfg['assinatura_rodape'])} — Folheto para lojas</title>
<style>
{fontes_embutidas()}
{css()}
</style>
</head>
<body{classe}>
{bloco_frente(cfg, txt['frente'])}
{bloco_verso(cfg, txt['verso'])}
</body>
</html>
"""


def achar_chromium():
    candidatos = [
        "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
        shutil.which("google-chrome"),
    ]
    for c in candidatos:
        if c and Path(c).exists():
            return c
    for c in sorted(Path("/opt/pw-browsers").glob("chromium-*/chrome-linux/chrome"), reverse=True):
        return str(c)
    return None


def gerar_pdf(html_path, pdf_path):
    """Imprime o HTML em PDF. Tenta o Chromium e cai para o WeasyPrint."""
    navegador = achar_chromium()
    if navegador:
        perfil = DIST / ".chrome-perfil"
        comando = [
            navegador,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            f"--user-data-dir={perfil}",
            "--no-pdf-header-footer",
            "--virtual-time-budget=8000",
            f"--print-to-pdf={pdf_path}",
            html_path.as_uri(),
        ]
        r = subprocess.run(comando, capture_output=True, text=True, timeout=180)
        if pdf_path.exists() and pdf_path.stat().st_size > 0:
            shutil.rmtree(perfil, ignore_errors=True)
            return "chromium"
        print("  Chromium falhou, tentando WeasyPrint...")
        print("  " + (r.stderr or "").strip()[:500])

    from weasyprint import HTML
    HTML(filename=str(html_path)).write_pdf(str(pdf_path))
    return "weasyprint"


def main():
    cfg = json.loads((RAIZ / "config.json").read_text(encoding="utf-8"))
    txt = json.loads((RAIZ / "conteudo.json").read_text(encoding="utf-8"))

    DIST.mkdir(exist_ok=True)

    versoes = [
        (NOME_SAIDA, False, "gráfica / impressão sem margem"),
        (f"{NOME_SAIDA}-impressora-comum", True, "impressora de casa ou escritório"),
    ]

    for nome, margem_segura, para_quem in versoes:
        html_path = DIST / f"{nome}.html"
        pdf_path = DIST / f"{nome}.pdf"

        html_path.write_text(montar_html(cfg, txt, margem_segura), encoding="utf-8")
        motor = gerar_pdf(html_path, pdf_path)
        tamanho = pdf_path.stat().st_size / 1024
        print(f"{pdf_path.relative_to(RAIZ)}  ({tamanho:.0f} KB, via {motor})")
        print(f"    para: {para_quem}")

    faltando = [
        chave for chave in
        ("whatsapp", "email", "site", "instagram", "cidade")
        if pendente(cfg.get(chave))
    ]
    if not str(cfg.get("whatsapp_numero_internacional", "")).strip():
        faltando.append("whatsapp_numero_internacional (QR code)")

    if faltando:
        print("\nAinda faltam dados reais em config.json — NÃO mande imprimir ainda:")
        for chave in faltando:
            print(f"  - {chave}")
        print("Esses campos saem destacados em amarelo no PDF para você não perder de vista.")
    else:
        print("\nTodos os contatos preenchidos. Pode mandar para a gráfica.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
