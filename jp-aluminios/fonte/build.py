#!/usr/bin/env python3
"""Gera a apresentação da JP Alumínios: PDF, PDF leve, PPTX editável e JPGs por página."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1]))
from motor import apresentacao as mt  # noqa: E402
from motor.apresentacao import H, I, O, P, R, W  # noqa: E402

OUT = ROOT.parent / "entregas"
BUILD = ROOT / "build"

CONTATO_NOME = "Felipe"
CONTATO_TEL = "(16) 99101-9797"
WA = "https://wa.me/5516991019797"
ARQ = "JP-Aluminios-Apresentacao"

INK = "#0E0F11"
INK2 = "#181A1D"
STEEL = "#22252A"
LINE = "#33373D"
LIGHT = "#F4F2EE"
MUTED = "#AEB2B8"
PAPER = "#F3F1EC"
LINE_L = "#D6D2C9"
MUTED_D = "#4E5258"
ACCENT = "#C9A26B"
ACCENT_D = "#8A6A3D"

M = 16
CW = W - 2 * M

FONTS = {
    ("display", True, False): ROOT / "fontes/BarlowCondensed-Bold.ttf",
    ("display", False, False): ROOT / "fontes/BarlowCondensed-Regular.ttf",
    ("body", True, False): ROOT / "fontes/Barlow-Bold.ttf",
    ("body", False, False): ROOT / "fontes/Barlow-Regular.ttf",
}
FAMILY = {"display": "Barlow Condensed", "body": "Barlow"}


def G(x, y, w, h, a0, a1, color=INK, ease=1.6):
    return mt.G(x, y, w, h, a0, a1, color=color, ease=ease)


def T(*args, color=LIGHT, accent=ACCENT, **kw):
    return mt.T(*args, color=color, accent=accent, **kw)


def logo_w(h, dark=False):
    im = Image.open(ROOT / f"marca/logo_{'dark' if dark else 'white'}.png")
    return h * im.width / im.height


def eyebrow(y, text, color=ACCENT):
    return [R(M, y, 14, 0.7, color),
            T(M, y + 3, CW, 7, text, 13, color=color, font="display", bold=True, track=0.16)]


def footer(dark_text=True):
    c = LIGHT if dark_text else INK
    return [
        R(M, 278, CW, 0.3, LINE if dark_text else LINE_L),
        P(M, 283.4, logo_w(5.6), 5.6, ROOT / f"marca/logo_{'white' if dark_text else 'dark'}.png"),
        T(96, 281.2, W - M - 96, 10, f"Orçamentos com {CONTATO_NOME}  {{{CONTATO_TEL}}}", 13,
          color=c, font="display", bold=True, align="right", valign="middle", track=0.03,
          link=WA),
    ]


def tile_caption(x, y, w, h, title, sub=None):
    gh = h * 0.55
    els = [G(x, y + h - gh, w, gh, 0.0, 0.88)]
    if sub:
        els += [T(x + 5, y + h - 19.5, w - 10, 8.5, title, 17, font="display", bold=True, track=0.04),
                T(x + 5, y + h - 11.5, w - 10, 7, sub, 13.5, color="#D9D6D0")]
    else:
        els += [T(x + 4.5, y + h - 12, w - 9, 8.5, title, 15.5, font="display", bold=True,
                  track=0.05)]
    return els


# ---------------------------------------------------------------- páginas

def page_capa():
    e = [R(0, 0, W, H, INK),
         I(0, 0, W, 206, "012", focus=(0.5, 0.38)),
         G(0, 0, W, 64, 0.82, 0.0, ease=1.2),
         G(0, 96, W, 110, 0.0, 1.0, ease=1.5),
         P(M, 16, logo_w(10.5), 10.5, ROOT / "marca/logo_white.png"),
         T(W - M - 60, 16, 60, 10.5, "DESDE 2015", 13, color=ACCENT, font="display", bold=True,
           align="right", valign="middle", track=0.16)]
    e += eyebrow(176, "VIDROS E ESQUADRIAS DE ALUMÍNIO")
    e += [T(M, 187, CW, 40, "QUALIDADE QUE\nVALORIZA SEU {IMÓVEL.}", 56, font="display",
            bold=True, lh=0.94, track=0.005),
          T(M, 228, 168, 24, "Soluções sob medida para quem busca beleza, funcionalidade e um "
            "acabamento que faz a diferença.", 17, color="#D9D6D0", lh=1.38),
          R(M, 259, CW, 22, ACCENT, radius=1.6, link=WA),
          T(M + 7, 259, 90, 22, "SOLICITE SEU ORÇAMENTO\n{Fale com o " + CONTATO_NOME +
            " pelo WhatsApp}", 16, color=INK, font="display", bold=True, valign="middle",
            lh=1.15, track=0.06, accent="#3B2E1C", link=WA),
          T(M + 90, 259, CW - 97, 22, CONTATO_TEL, 30, color=INK, font="display", bold=True,
            align="right", valign="middle", lh=1.0, link=WA)]
    return dict(bg=INK, els=e)


def page_quem_somos():
    e = [R(0, 0, W, H, INK),
         I(0, 0, W, 122, "007", focus=(0.5, 0.55)),
         G(0, 62, W, 60, 0.0, 1.0, ease=1.4)]
    e += eyebrow(110, "QUEM SOMOS")
    e += [T(M, 121, CW, 30, "ESPECIALISTAS EM VIDROS\nE ESQUADRIAS DE {ALUMÍNIO.}", 42,
            font="display", bold=True, lh=0.96),
          T(M, 156, CW, 66,
            "A JP Alumínios nasceu com um objetivo claro: oferecer soluções em vidros e esquadrias "
            "de alumínio que unem durabilidade, segurança e elegância.\n"
            "Ao longo dos anos, construímos relações sólidas e de confiança com nossos clientes. "
            "É esse mesmo cuidado que queremos levar para o seu projeto.", 17, color="#D9D6D0", lh=1.42, pspace=9)]
    stats = [("2015", "ano de fundação"),
             ("3 SEGMENTOS", "residencial, comercial e industrial"),
             ("6 LINHAS", "de soluções em vidro e alumínio")]
    cw = (CW - 2 * 8) / 3
    for i, (t, d) in enumerate(stats):
        x = M + i * (cw + 8)
        e += [R(x, 231, cw, 0.6, ACCENT),
              T(x, 235, cw, 9, t, 23, font="display", bold=True, lh=1.0, track=0.02),
              T(x, 245, cw, 22, d, 14, color=MUTED, lh=1.32)]
    return dict(bg=INK, els=e + footer())


def page_servicos():
    e = [R(0, 0, W, H, INK)]
    e += eyebrow(16, "O QUE FAZEMOS")
    e += [T(M, 27, CW, 30, "SOLUÇÕES COMPLETAS\nEM VIDRO E {ALUMÍNIO}", 42, font="display",
            bold=True, lh=0.96),
          T(M, 59, CW, 17, "Do vão da janela à fachada inteira: conheça as linhas de produtos e "
            "serviços da JP Alumínios.", 16.5, color=MUTED, lh=1.38)]
    cards = [("ESQUADRIAS DE ALUMÍNIO", "Janelas, portas e venezianas sob medida para cada vão.",
              ("img", "013", (0.45, 0.5))),
             ("PELE DE VIDRO", "Fachadas envidraçadas, com mais luz natural e presença.",
              ("img", "050", (0.5, 0.45))),
             ("ESCADAS E GUARDA-CORPOS", "Corrimãos e guarda-corpos que protegem com visual leve.",
              ("img", "040", (0.5, 0.55))),
             ("BOX PARA BANHEIRO", "Box de vidro sob medida, prático e elegante no dia a dia.",
              ("img", "041", (0.5, 0.45)))]
    top, gap, bottom, band_h = 78, 5, 272, 44
    cw = (CW - 6) / 2
    ch = (bottom - band_h - gap - top - gap) / 2
    ph = ch - 27
    for i, (t, d, media) in enumerate(cards):
        x = M + (i % 2) * (cw + 6)
        y = top + (i // 2) * (ch + gap)
        e += [R(x, y, cw, ch, INK2),
              I(x, y, cw, ph, media[1], focus=media[2]),
              T(x + 5, y + ph + 4, cw - 10, 7, t, 17, font="display", bold=True, track=0.03,
                lh=1.0),
              T(x + 5, y + ph + 11.5, cw - 10, 13, d, 13.5, color=MUTED, lh=1.3)]

    by = bottom - band_h
    pad, divider = 6, 8
    col_w = (CW - 2 * pad - divider) / 2
    badge = 14
    e += [R(M, by, CW, band_h, INK2),
          R(M, by, CW, 0.6, ACCENT),
          T(M + pad, by + 6.5, CW - 2 * pad, 6, "TAMBÉM FAZEMOS", 12.5, color=ACCENT,
            font="display", bold=True, track=0.16),
          R(M + pad + col_w + divider / 2, by + 17, 0.3, band_h - 23, LINE)]
    extras = [("espelho", "ESPELHOS", "Sob medida, para ampliar e valorizar os ambientes."),
              ("pergolado", "COBERTURAS E PERGOLADOS",
               "Áreas externas protegidas e mais bem aproveitadas.")]
    for j, (ic, t, d) in enumerate(extras):
        x = M + pad + j * (col_w + divider)
        y = by + 17
        tx = x + badge + 4.5
        e += [O(x, y, badge, stroke=ACCENT, sw=0.45),
              P(x + 3, y + 3, badge - 6, badge - 6, ROOT / f"build/icon_{ic}.png"),
              T(tx, y + 0.3, x + col_w - tx, 7, t, 15.5, font="display", bold=True, track=0.03,
                lh=1.0),
              T(tx, y + 7.5, x + col_w - tx, 13, d, 13.5, color=MUTED, lh=1.3)]
    return dict(bg=INK, els=e + footer())


def page_detalhes():
    e = [R(0, 0, W, H, INK)]
    e += eyebrow(16, "QUALIDADE NOS DETALHES")
    e += [T(M, 27, CW, 30, "O ACABAMENTO\nFAZ A {DIFERENÇA.}", 42, font="display", bold=True,
            lh=0.96),
          T(M, 59, CW, 25, "Em vidro e alumínio, a qualidade aparece no alinhamento, no encaixe e "
            "no acabamento. Por isso, o cuidado começa na escolha dos materiais e vai até a "
            "instalação final.", 16.5, color=MUTED, lh=1.38)]
    top, bottom = 86, 272
    bw = 104
    e += [I(M, top, bw, bottom - top, "049", focus=(0.5, 0.45))]
    e += tile_caption(M, top, bw, bottom - top, "PORTAS DE ENTRADA",
                      "A primeira impressão de quem chega.")
    rx, rw = M + bw + 6, CW - bw - 6
    th = (bottom - top - 2 * 5) / 3
    tiles = [("037", (0.5, 0.5), "VENEZIANAS E BRISES"),
             ("044", (0.5, 0.42), "JANELAS SOB MEDIDA"),
             ("047", (0.5, 0.3), "GUARDA-CORPO DE VIDRO")]
    for i, (src, f, cap) in enumerate(tiles):
        y = top + i * (th + 5)
        e.append(I(rx, y, rw, th, src, focus=f))
        e += tile_caption(rx, y, rw, th, cap)
    return dict(bg=INK, els=e + footer())


def page_porque():
    e = [R(0, 0, W, H, PAPER)]
    e += eyebrow(16, "POR QUE A JP ALUMÍNIOS", color=ACCENT_D)
    e += [T(M, 27, CW, 30, "POR QUE CONSIDERAR\nA JP {ALUMÍNIOS?}", 42, color=INK,
            font="display", bold=True, lh=0.96, accent=ACCENT_D),
          T(M, 59, CW, 20, "Mais do que escolher uma janela ou um vidro, você está escolhendo quem "
            "vai cuidar de uma parte importante do seu imóvel.", 16.5, color=MUTED_D, lh=1.38)]
    items = [("MAIS DE 10 ANOS", "De experiência em vidros e esquadrias de alumínio, desde 2015."),
             ("EQUIPE ESPECIALIZADA", "Profissionais treinados para indicar a solução certa para "
              "cada projeto."),
             ("SOLUÇÕES SOB MEDIDA", "Personalizadas de acordo com as necessidades de cada "
              "cliente."),
             ("SEGURANÇA E CONFORTO", "Aliados à estética do seu projeto de arquitetura."),
             ("BOM CUSTO-BENEFÍCIO", "Orçamento otimizado, pensado para o que o seu projeto "
              "precisa."),
             ("ATENDIMENTO DIRETO", f"Você fala com o {CONTATO_NOME}, tira dúvidas e recebe "
              "orientação para escolher bem.")]
    cw = (CW - 10) / 2
    top, rh = 83, 46
    for i, (t, d) in enumerate(items):
        x = M + (i % 2) * (cw + 10)
        y = top + (i // 2) * rh
        e += [R(x, y, cw, 0.3, LINE_L),
              T(x, y + 3.5, 20, 10, f"{i + 1:02d}", 26, color=ACCENT_D, font="display",
                bold=True, lh=1.0),
              T(x, y + 14.5, cw, 7, t, 17.5, color=INK, font="display", bold=True, lh=1.0,
                track=0.03),
              T(x, y + 22.5, cw, 20, d, 14.5, color=MUTED_D, lh=1.32)]
    e += [I(0, 226, W, H - 226, "046", focus=(0.5, 0.13)),
          G(0, 226, W, H - 226, 0.62, 0.94, ease=1.0)]
    e += [T(M, 238, CW, 30, "Mais tranquilidade para decidir,\n{do orçamento à instalação.}", 24,
            font="display", bold=True, lh=1.05, track=0.01)]
    return dict(bg=PAPER, els=e + footer())


def page_aplicacoes():
    e = [R(0, 0, W, H, INK)]
    e += eyebrow(16, "APLICAÇÕES E POSSIBILIDADES")
    e += [T(M, 27, CW, 30, "IMAGINE ISSO NO\nSEU {PROJETO.}", 42, font="display", bold=True,
            lh=0.96),
          T(M, 59, CW, 18, "Construindo ou reformando? Cada ambiente pede uma solução diferente, e a "
            "JP Alumínios ajuda você a encontrar a sua.", 16.5,
            color=MUTED, lh=1.38)]
    tiles = [("045", (0.5, 0.5), "FACHADAS E ENTRADAS"),
             ("048", (0.35, 0.5), "LAZER E PISCINA"),
             ("015", (0.5, 0.5), "AMBIENTES INTERNOS"),
             ("023", (0.5, 0.5), "INTEGRAÇÃO COM A ÁREA EXTERNA")]
    top, bottom, gap = 84, 260, 6
    tw = (CW - gap) / 2
    th = (bottom - top - gap) / 2
    for i, (src, f, cap) in enumerate(tiles):
        x = M + (i % 2) * (tw + gap)
        y = top + (i // 2) * (th + gap)
        e.append(I(x, y, tw, th, src, focus=f))
        e += tile_caption(x, y, tw, th, cap)
    e += [T(M, 264, CW, 8, "CASAS  ·  OBRAS NOVAS  ·  REFORMAS  ·  COMÉRCIOS  ·  INDÚSTRIAS",
            13, color=ACCENT, font="display", bold=True, align="center", valign="middle",
            track=0.12)]
    return dict(bg=INK, els=e + footer())


def page_contato():
    e = [R(0, 0, W, H, INK),
         I(0, 0, W, 104, "038", focus=(0.5, 0.35)),
         G(0, 38, W, 66, 0.0, 1.0, ease=1.4)]
    e += eyebrow(95, "SOLICITE SEU ORÇAMENTO")
    e += [T(M, 106, CW, 32, "VAMOS TIRAR SEU\nPROJETO DO {PAPEL?}", 46, font="display",
            bold=True, lh=0.95),
          T(M, 140, CW, 16, f"Tudo pode começar com uma conversa. Conte para o "
            f"{CONTATO_NOME} o que você precisa e solicite seu orçamento.", 16.5,
            color="#D9D6D0", lh=1.38)]
    steps = [("CHAME NO WHATSAPP", f"Fale direto com o {CONTATO_NOME}."),
             ("CONTE SUA IDEIA", "Envie fotos, medidas ou o projeto, se tiver."),
             ("RECEBA SEU ORÇAMENTO", "Com orientação para a melhor solução.")]
    cw = (CW - 2 * 7) / 3
    for i, (t, d) in enumerate(steps):
        x = M + i * (cw + 7)
        y = 163
        e += [O(x, y, 10, stroke=ACCENT, sw=0.45),
              T(x, y, 10, 10, str(i + 1), 16, color=ACCENT, font="display", bold=True,
                align="center", valign="middle", lh=1.0),
              T(x, y + 13, cw, 7, t, 15.5, font="display", bold=True, lh=1.0, track=0.03),
              T(x, y + 20, cw, 13, d, 13.5, color=MUTED, lh=1.3)]
    py, ph = 202, 62
    qs = 46
    qx = W - M - 6 - qs
    e += [R(M, py, CW, ph, INK2, link=WA),
          R(M, py, 1.2, ph, ACCENT),
          T(M + 8, py + 7, 110, 7, f"{CONTATO_NOME.upper()}  |  JP ALUMÍNIOS", 13.5,
            color=ACCENT, font="display", bold=True, track=0.14),
          T(M + 8, py + 14, 116, 20, CONTATO_TEL, 46, font="display", bold=True, lh=1.0,
            valign="middle", link=WA),
          R(M + 8, py + 39, 82, 14, ACCENT, radius=7, link=WA),
          T(M + 8, py + 39, 82, 14, "CHAMAR NO WHATSAPP", 15, color=INK, font="display",
            bold=True, align="center", valign="middle", track=0.08, link=WA),
          R(qx, py + 5, qs, qs, "#FFFFFF", radius=1.2, link=WA),
          P(qx + 3.5, py + 8.5, qs - 7, qs - 7, ROOT / "build/qr_whatsapp.png", link=WA, keep=True),
          T(qx, py + 52.5, qs, 6, "APONTE A CÂMERA", 11.5, color=MUTED, font="display",
            bold=True, align="center", valign="middle", track=0.14)]
    lw = logo_w(9)
    e += [P((W - lw) / 2, 272, lw, 9, ROOT / "marca/logo_white.png"),
          T(M, 284, CW, 6, "DESDE 2015  ·  RIBEIRÃO PRETO/SP", 12, color=MUTED, font="display",
            bold=True, align="center", valign="middle", track=0.16)]
    return dict(bg=INK, els=e)


PAGES = [page_capa, page_quem_somos, page_servicos, page_detalhes, page_porque,
         page_aplicacoes, page_contato]


def make_icons():
    col = mt.hexrgb(ACCENT) + (255,)
    s = 1600
    sw = 96

    def cap_line(d, p0, p1):
        d.line((*p0, *p1), fill=col, width=sw)
        for p in (p0, p1):
            d.ellipse((p[0] - sw / 2, p[1] - sw / 2, p[0] + sw / 2, p[1] + sw / 2), fill=col)

    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0, x1, y0, y1 = 470, 1130, 120, 1480
    r = (x1 - x0) // 2
    d.arc((x0, y0, x1, y0 + 2 * r), 180, 360, fill=col, width=sw)
    d.rectangle((x0, y0 + r, x0 + sw, y1), fill=col)
    d.rectangle((x1 - sw, y0 + r, x1, y1), fill=col)
    d.rectangle((x0, y1 - sw, x1, y1), fill=col)
    cap_line(d, (650, 820), (900, 570))
    cap_line(d, (650, 1080), (960, 770))
    im.resize((400, 400), Image.LANCZOS).save(BUILD / "icon_espelho.png")

    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for k in range(6):
        cx = 250 + k * 220
        d.rectangle((cx - 38, 330, cx + 38, 500), fill=col)
    d.rectangle((120, 500, 1480, 630), fill=col)
    d.rectangle((300, 630, 410, 1480), fill=col)
    d.rectangle((1190, 630, 1300, 1480), fill=col)
    im.resize((400, 400), Image.LANCZOS).save(BUILD / "icon_pergolado.png")


def main():
    BUILD.mkdir(exist_ok=True)
    make_icons()
    mt.qr_png(WA, BUILD / "qr_whatsapp.png", dark=INK)
    projeto = mt.Projeto(
        root=ROOT, out=OUT, arquivo=ARQ, titulo="JP Alumínios | Apresentação institucional",
        autor="JP Alumínios", assunto="Vidros e esquadrias de alumínio",
        palavras=f"orçamento, {CONTATO_NOME}, {CONTATO_TEL}", fontes=FONTS, familias=FAMILY,
        fundo=INK, rotulo_link=f"WhatsApp {CONTATO_NOME}")
    projeto.gerar([fn() for fn in PAGES])


if __name__ == "__main__":
    main()
