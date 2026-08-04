#!/usr/bin/env python3
"""
Confere se o conteúdo de cada página cabe dentro do A4 antes de mandar imprimir.

Uso:
    python3 gerar_pdf.py && python3 conferir_layout.py

Uma página estourada não dá erro na geração do PDF: o texto simplesmente é
cortado na borda. Este script mede a altura real de cada página e avisa.
Requer o playwright (pip install playwright); é opcional e não faz parte da
geração do folheto.
"""

import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
HTML = RAIZ / "dist" / "kairos-mf-folheto-lojas.html"
ALTURA_A4_MM = 297.0
FOLGA_MM = 0.6  # arredondamento de subpixel do navegador


def main():
    if not HTML.exists():
        print(f"Não achei {HTML}. Rode antes: python3 gerar_pdf.py")
        return 1

    from playwright.sync_api import sync_playwright

    sys.path.insert(0, str(RAIZ))
    from gerar_pdf import achar_chromium

    with sync_playwright() as p:
        navegador = p.chromium.launch(
            executable_path=achar_chromium(),
            args=["--no-sandbox"],
        )
        pagina = navegador.new_page()
        pagina.goto(HTML.as_uri())
        pagina.wait_for_timeout(400)

        # O flexbox comprime as caixas para caberem na página, mas o texto de
        # dentro continua vazando. Por isso não basta medir a página: é preciso
        # procurar todo elemento cujo conteúdo é mais alto que a própria caixa.
        medidas = pagina.evaluate(
            """() => [...document.querySelectorAll('.pagina')].map(pag => {
                 const caixa = pag.getBoundingClientRect();
                 const px_por_mm = caixa.height / 297;
                 const vazando = [];
                 let fundo = caixa.top;

                 [pag, ...pag.querySelectorAll('*')].forEach(el => {
                   const r = el.getBoundingClientRect();
                   if (r.height > 0 && r.bottom > fundo) fundo = r.bottom;
                   const excesso = el.scrollHeight - el.clientHeight;
                   if (el.clientHeight > 0 && excesso > 1) {
                     vazando.push({
                       quem: el.className || el.tagName.toLowerCase(),
                       mm: excesso / px_por_mm,
                     });
                   }
                 });

                 return {
                   conteudo_mm: (fundo - caixa.top) / px_por_mm,
                   vazando: vazando,
                 };
               })"""
        )
        navegador.close()

    problemas = 0
    for i, m in enumerate(medidas, start=1):
        nome = "frente" if i == 1 else "verso "
        usado = m["conteudo_mm"]
        sobra = ALTURA_A4_MM - usado

        if m["vazando"]:
            pior = max(m["vazando"], key=lambda v: v["mm"])
            print(f"  p{i} ({nome}): ESTOUROU — falta {pior['mm']:.1f} mm em .{pior['quem']}")
            for v in sorted(m["vazando"], key=lambda v: -v["mm"])[1:4]:
                print(f"           também vaza {v['mm']:.1f} mm em .{v['quem']}")
            problemas += 1
        elif sobra < -FOLGA_MM:
            print(f"  p{i} ({nome}): ESTOUROU {abs(sobra):.1f} mm além da folha")
            problemas += 1
        elif sobra > 25:
            print(f"  p{i} ({nome}): sobrando {sobra:.1f} mm — página com buraco no fim")
        else:
            print(f"  p{i} ({nome}): ok, {usado:.1f} mm de 297 mm")

    if problemas:
        print("\nAjuste os textos em conteudo.json (ou o CSS) e gere de novo.")
        return 1

    print("\nAs duas páginas cabem no A4.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
