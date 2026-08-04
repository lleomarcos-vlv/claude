#!/usr/bin/env python3
"""Gera os QR Codes e renderiza o panfleto da Verde Fixo em PDF pronto para grafica.

Uso:
    python3 build.py

Saida:
    assets/qr-site.svg      QR Code para www.verdefixo.com
    assets/qr-whatsapp.svg  QR Code para o WhatsApp (11) 92685-7062
    verde-fixo-panfleto-a4.pdf           Panfleto A4 frente e verso (210 x 297 mm)
    verde-fixo-panfleto-a4-sangria.pdf   Mesma arte com 3 mm de sangria (216 x 303 mm)
"""

import pathlib
import subprocess
import sys

import qrcode
import qrcode.image.svg

BASE = pathlib.Path(__file__).parent.resolve()
ASSETS = BASE / "assets"

SITE_URL = "https://www.verdefixo.com"
WHATSAPP_URL = "https://wa.me/5511926857062"

CHROMIUM_CANDIDATOS = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
]


def gerar_qr(dados: str, destino: pathlib.Path) -> None:
    """Gera um QR Code vetorial (SVG) com correcao de erro alta, ideal para impressao."""
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(dados)
    qr.make(fit=True)
    img = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
    img.save(str(destino))
    print(f"  QR gerado: {destino.name} -> {dados}")


def encontrar_chromium() -> str:
    for caminho in CHROMIUM_CANDIDATOS:
        if pathlib.Path(caminho).exists():
            return caminho
    for padrao in ("chromium-*/chrome-linux/chrome",):
        for achado in sorted(pathlib.Path("/opt/pw-browsers").glob(padrao), reverse=True):
            return str(achado)
    for candidato in ("chromium", "chromium-browser", "google-chrome"):
        caminho = subprocess.run(
            ["which", candidato], capture_output=True, text=True
        ).stdout.strip()
        if caminho:
            return caminho
    sys.exit("Chromium nao encontrado. Instale o Chromium para gerar o PDF.")


def renderizar_pdf(html: pathlib.Path, pdf: pathlib.Path) -> None:
    subprocess.run(
        [
            encontrar_chromium(),
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=10000",
            f"--print-to-pdf={pdf}",
            html.as_uri(),
        ],
        check=True,
        capture_output=True,
    )
    print(f"  PDF gerado: {pdf.name} ({pdf.stat().st_size / 1024:.0f} KB)")


# A arte e desenhada em 210 x 297 mm com 13 mm de respiro nas laterais.
# Para a versao com sangria a folha cresce 3 mm para cada lado (216 x 303 mm) e
# o respiro passa a ser medido a partir da borda da folha (13 + 3 = 16 mm), de
# modo que as faixas coloridas chegam ate o corte e o conteudo nao se desloca.
CSS_SANGRIA = """
<style>
  @page { size: 216mm 303mm; margin: 0; }
  .page { width: 216mm; height: 303mm; }
  .page > * { padding-left: 16mm; padding-right: 16mm; }
  .topbar { flex: 0 0 20mm; height: 20mm; padding-top: 3mm; }
  .footbar { padding-bottom: 3mm; }
</style>
"""


def renderizar_com_sangria(origem: pathlib.Path, pdf: pathlib.Path) -> None:
    """Renderiza a mesma arte numa folha 3 mm maior em cada lado."""
    html = origem.read_text(encoding="utf-8").replace("</head>", CSS_SANGRIA + "</head>")
    # gravado ao lado do original para que os caminhos de assets/ continuem validos
    temporario = origem.with_name("_sangria.tmp.html")
    temporario.write_text(html, encoding="utf-8")
    try:
        renderizar_pdf(temporario, pdf)
    finally:
        temporario.unlink(missing_ok=True)


def main() -> None:
    ASSETS.mkdir(exist_ok=True)

    print("Gerando QR Codes...")
    gerar_qr(SITE_URL, ASSETS / "qr-site.svg")
    gerar_qr(WHATSAPP_URL, ASSETS / "qr-whatsapp.svg")

    print("Renderizando PDFs...")
    renderizar_pdf(BASE / "panfleto.html", BASE / "verde-fixo-panfleto-a4.pdf")
    renderizar_com_sangria(
        BASE / "panfleto.html", BASE / "verde-fixo-panfleto-a4-sangria.pdf"
    )

    print("Pronto.")


if __name__ == "__main__":
    main()
