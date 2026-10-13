#!/usr/bin/env python3
"""Gera o portfólio Checkmate + Liqsy do representante: PDF, PDF leve, PPTX editável e JPGs."""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1]))
from motor import apresentacao as mt  # noqa: E402
from motor.apresentacao import H, I, O, R, W, fit  # noqa: E402

OUT = ROOT.parent / "entregas"
BUILD = ROOT / "build"

CONTATO_NOME = "Felipe"
CONTATO_CARGO = "representante comercial"
CONTATO_TEL = "(16) 99101-9797"
WA = "https://wa.me/5516991019797"
ARQ = "Checkmate-Liqsy-Portfolio"

ESP = "#1D1512"
ESP2 = "#2A201B"
LIGHT = "#F7EFE6"
MUTED_L = "#C2B5A9"
LINE_D = "#3E322B"
CREAM = "#FAF4E8"
CREAM_CM = "#FBF0E8"
CARD = "#FFFBF6"
BROWN = "#2B1B14"
MUTED = "#6B5B51"
LINE = "#E2D5C8"
OLIVE = "#5E6B32"
GOLD = "#C9A45C"
GOLD_D = "#8C6B2F"
PETROL = "#2F4D58"
NAVY = "#28455A"
LQ_GOLD = "#E0BE5C"

M = 16
CW = W - 2 * M

FONTS = {
    ("display", True, False): ROOT / "fontes/BarlowCondensed-Bold.ttf",
    ("display", False, False): ROOT / "fontes/BarlowCondensed-Regular.ttf",
    ("body", True, False): ROOT / "fontes/Barlow-Bold.ttf",
    ("body", False, False): ROOT / "fontes/Barlow-Regular.ttf",
    ("serif", False, True): ROOT / "fontes/PlayfairDisplay-Italic.ttf",
    ("serif", False, False): ROOT / "fontes/PlayfairDisplay-Regular.ttf",
}
FAMILY = {"display": "Barlow Condensed", "body": "Barlow", "serif": "Playfair Display"}


def T(*args, color=BROWN, accent=GOLD_D, **kw):
    return mt.T(*args, color=color, accent=accent, **kw)


def G(x, y, w, h, a0, a1, color=ESP, ease=1.6):
    return mt.G(x, y, w, h, a0, a1, color=color, ease=ease)


def PR(name):
    return ROOT / "produtos" / name


def FT(name):
    return str(ROOT / "fotos" / name)


def MK(name):
    return ROOT / "marcas" / name


def ratio(path):
    with Image.open(path) as im:
        return im.width / im.height


def logo(name, x, y, h, link=None):
    p = MK(name)
    return mt.P(x, y, h * ratio(p), h, p, link=link)


def headline(x, y, w, h, text, size, color, accent, lh=1.08):
    return T(x, y, w, h, text, size, color=color, accent=accent, font="serif", italic=True, lh=lh)


def eyebrow(y, text, color, x=M, w=CW):
    return [R(x, y, 12, 0.6, color),
            T(x, y + 2.6, w, 6, text, 12.5, color=color, font="display", bold=True, track=0.16)]


def label(x, y, w, h, text, size, color, track=0.04, **kw):
    return T(x, y, w, h, text, size, color=color, font="display", bold=True, track=track, **kw)


def footer(dark=True):
    c = LIGHT if dark else BROWN
    suf = "claro" if dark else "escuro"
    cm_h, lq_h = 4.2, 8.4
    cm_w = cm_h * ratio(MK(f"checkmate_logo_{suf}.png"))
    return [
        R(M, 277, CW, 0.3, LINE_D if dark else LINE),
        logo(f"checkmate_logo_{suf}.png", M, 284.1, cm_h),
        R(M + cm_w + 4, 282.8, 0.3, 7, MUTED_L if dark else LINE),
        logo(f"liqsy_logo_{suf}.png", M + cm_w + 8, 281.1, lq_h),
        T(100, 280.8, W - M - 100, 10, f"Pedidos com {CONTATO_NOME}  {{{CONTATO_TEL}}}", 13,
          color=c, accent=GOLD if dark else GOLD_D, font="display", bold=True, align="right",
          valign="middle", track=0.03, link=WA),
    ]


def lista(itens):
    itens = [itens[0]] + [i[0].lower() + i[1:] for i in itens[1:]]
    return ", ".join(itens[:-1]) + " e " + itens[-1] if len(itens) > 1 else itens[0]


def money(v):
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


# ---------------------------------------------------------------- páginas

def page_capa():
    e = [R(0, 0, W, H, ESP),
         I(0, 0, W, 204, FT("cm_bartender.jpg"), focus=(0.56, 0.42)),
         G(0, 0, W, 62, 0.8, 0.0, ease=1.2),
         G(0, 92, W, 112, 0.0, 1.0, ease=1.5)]
    cm_w = 8.2 * ratio(MK("checkmate_logo_claro.png"))
    e += [logo("checkmate_logo_claro.png", M, 19, 8.2),
          R(M + cm_w + 5, 15.5, 0.3, 15, MUTED_L),
          logo("liqsy_logo_claro.png", M + cm_w + 10, 14.5, 16),
          logo("baldo_selo_claro.png", W - M - 19, 13, 19)]
    e += eyebrow(166, "PORTFÓLIO DE BEBIDAS PARA O SEU NEGÓCIO", GOLD)
    e += [headline(M, 176, CW, 34, "Mais sabor no cardápio,\n{menos trabalho no balcão.}", 38,
                   LIGHT, GOLD),
          T(M, 213, 170, 18, "Chá mate Checkmate e xaropes premium Liqsy para bares, cafeterias, "
            "restaurantes e lanchonetes.", 16.5, color="#E2D8CE", lh=1.36),
          R(M, 253, CW, 25, GOLD, radius=1.6, link=WA),
          T(M + 7, 253, 100, 25, f"PEÇA SUA TABELA DE PREÇOS\n{{{CONTATO_NOME}, "
            f"{CONTATO_CARGO}}}", 16, color=ESP, accent="#4A3A22", font="display", bold=True,
            valign="middle", lh=1.15, track=0.05, link=WA),
          T(M + 95, 253, CW - 102, 25, CONTATO_TEL, 30, color=ESP, font="display", bold=True,
            align="right", valign="middle", lh=1.0, link=WA)]
    return dict(bg=ESP, els=e)


def page_marcas():
    e = [R(0, 0, W, H, CREAM)]
    e += eyebrow(16, "QUEM ESTÁ POR TRÁS", GOLD_D)
    e += [headline(M, 25, 140, 30, "A tradição da Baldo\n{no seu cardápio.}", 34, BROWN, GOLD_D),
          logo("baldo_selo_escuro.png", W - M - 27, 15, 27),
          T(M, 60, CW, 26, "Checkmate e Liqsy são marcas da Baldo, apaixonada por mate desde 1920. "
            "É a experiência de quem domina todo o processo da erva-mate, do cultivo ao produto "
            "final, em soluções práticas para quem serve bebidas.", 15, color=MUTED, lh=1.4)]
    cw, top, ch = (CW - 6) / 2, 92, 166
    ph = 84
    cards = [
        dict(img=FT("cm_cliente_drink.jpg"), focus=(0.47, 0.5), logo="checkmate_logo_escuro.png",
             lh=6.4, tag="Onde tem paixão, tem chá mate.",
             desc="Chá mate para servir, para infusão e para revender, com a experiência de "
                  "quem é especialista em erva-mate.",
             itens="SABORIZADO · CONCENTRADO · SACHÊS · GRANEL", cor=OLIVE),
        dict(img=str(PR("lq_hero.jpg")), focus=(0.5, 0.68), logo="liqsy_logo_escuro.png",
             lh=13, tag="A dose perfeita para surpreender.",
             desc="Xaropes premium em 9 sabores para criar bebidas, das cítricas às "
                  "adocicadas, com textura aveludada.",
             itens="GARRAFA 750 ML · BAG-IN-BOX 3 L", cor=NAVY),
    ]
    for j, c in enumerate(cards):
        x = M + j * (cw + 6)
        e += [R(x, top, cw, ch, CARD, stroke=LINE, sw=0.3),
              I(x, top, cw, ph, c["img"], focus=c["focus"]),
              logo(c["logo"], x + 7, top + ph + 9 + (6.4 - c["lh"]) / 2 * (j == 0), c["lh"]),
              headline(x + 7, top + ph + 24, cw - 14, 8, c["tag"], 14, BROWN, GOLD_D),
              T(x + 7, top + ph + 34, cw - 14, 27, c["desc"], 13, color=MUTED, lh=1.38),
              R(x + 7, top + ch - 14, cw - 14, 0.3, LINE),
              label(x + 7, top + ch - 12, cw - 14, 9, c["itens"], 10.5, c["cor"],
                    valign="middle")]
    e += [T(M, 264, CW, 8, f"Atendimento direto com {CONTATO_NOME}, {CONTATO_CARGO} das "
            "marcas.", 12.5, color=MUTED, align="center", valign="middle")]
    return dict(bg=CREAM, els=e + footer(dark=False))


def page_porque():
    e = [R(0, 0, W, H, ESP),
         I(0, 0, W, 116, FT("cm_risada.jpg"), focus=(0.5, 0.4)),
         G(0, 58, W, 58, 0.0, 1.0, ease=1.3)]
    e += eyebrow(108, "POR QUE CHÁ MATE?", GOLD)
    e += [headline(M, 117, CW, 30, "A bebida do momento\n{no seu cardápio.}", 34, LIGHT, GOLD),
          T(M, 150, CW, 15, "Uma tendência global que une sabor, naturalidade e versatilidade, "
            "com preparo simples e sabor consistente.", 15, color=MUTED_L, lh=1.38)]
    stats = [("148%", "de crescimento da produção brasileira de chás prontos para beber em 10 anos"),
             ("4,1% a 4,7%", "de crescimento anual previsto para o mercado global de bebidas "
                             "não alcoólicas"),
             ("Mocktails", "coquetéis sem álcool em alta, principalmente entre o público jovem")]
    sw = (CW - 2 * 7) / 3
    for i, (n, d) in enumerate(stats):
        x = M + i * (sw + 7)
        e += [R(x, 170, sw, 0.5, GOLD),
              label(x, 173.5, sw, 13, n, 30 if i == 0 else 24, GOLD, valign="middle", lh=1.0),
              T(x, 188, sw, 25, d, 12.5, color=MUTED_L, lh=1.32)]
    cols = [("PARA O SEU NEGÓCIO", ["Rentabilidade e versatilidade",
                                    "Preparo simples e padronizado",
                                    "Diversas combinações de sabor"]),
            ("PARA O SEU CLIENTE", ["Refrescante e leve",
                                    "Energia e disposição",
                                    "Ideal para qualquer hora do dia"])]
    bw = (CW - 6) / 2
    for j, (t, itens) in enumerate(cols):
        x = M + j * (bw + 6)
        e += [R(x, 216, bw, 50, ESP2),
              label(x + 6, 221, bw - 12, 7, t, 13, GOLD, track=0.12)]
        for k, it in enumerate(itens):
            yy = 231 + k * 10.5
            e += [O(x + 6, yy + 2.2, 2.2, fill=GOLD),
                  T(x + 11, yy, bw - 17, 7, it, 13.5, color=LIGHT, valign="middle")]
    e += [T(M, 268.5, CW, 6, "Dados de mercado conforme o catálogo Checkmate 2026.", 10.5,
            color=MUTED_L, valign="middle")]
    return dict(bg=ESP, els=e + footer())


def product_card(x, y, w, h, title, yield_txt, desc, imgs, badge=None, img_h=40):
    e = [R(x, y, w, h, CARD, stroke=LINE, sw=0.3)]
    e += imgs
    ty = y + img_h + 4
    if badge:
        e += [R(x + w - 33, ty + 8, 27, 6.5, OLIVE, radius=3.25),
              label(x + w - 33, ty + 8, 27, 6.5, badge, 10, CREAM_CM, align="center",
                    valign="middle", track=0.1)]
    e += [label(x + 6, ty, w - 12, 7, title, 15, BROWN, lh=1.0),
          label(x + 6, ty + 7.5, w - 12, 8, yield_txt, 19, OLIVE, lh=1.0),
          T(x + 6, ty + 16.5, w - 12, h - img_h - 22, desc, 12, color=MUTED, lh=1.33)]
    return e


def row_fit(paths, x, y, w, h, gap=1.0, valign="bottom", bg=CARD):
    n = len(paths)
    cw = (w - gap * (n - 1)) / n
    return [fit(p, x + i * (cw + gap), y, cw, h, valign=valign, bg=bg) for i, p in enumerate(paths)]


def page_checkmate_balcao():
    e = [R(0, 0, W, H, CREAM_CM),
         I(126, 0, W - 126, 92, FT("cm_3l_morango.jpg"), focus=(0.5, 0.62)),
         logo("checkmate_logo_escuro.png", M, 17, 7)]
    e += eyebrow(31, "PARA BARES, CAFETERIAS E RESTAURANTES", OLIVE, w=104)
    e += [headline(M, 40, 104, 28, "Rende muito,\n{prepara rápido.}", 34, BROWN, OLIVE),
          T(M, 70, 102, 22, "Chá mate saborizado e concentrado para um preparo rápido e "
            "padronizado, sem complicações.", 14.5, color=MUTED, lh=1.38)]
    cw, top, gap = (CW - 6) / 2, 98, 6
    ch = (272 - top - gap) / 2
    ih = 40
    bottles = [PR(f"cm_750_{i}.png") for i in range(1, 8)]
    boxes = [PR(f"cm_3l_{i}.png") for i in (1, 2, 3, 4)]
    cards = [
        dict(title="CHÁ MATE SABORIZADO 750 ML", y="RENDE ATÉ 4,5 L", badge="LANÇAMENTO",
             desc="Cranberry, pêssego, morango, maçã verde, mimosa, limão siciliano e limão. "
                  "Pump dosador de 8 ml.",
             imgs=lambda x, y: row_fit(bottles, x + 8, y + 5, cw - 16, ih - 6, gap=1.2)),
        dict(title="CHÁ MATE SABORIZADO 3 L", y="RENDE ATÉ 18 L", badge=None,
             desc="Os mesmos 7 sabores em embalagem de 3 litros, com mais rendimento.",
             imgs=lambda x, y: row_fit(boxes, x + 7, y + 6, cw - 14, ih - 7, gap=2)),
        dict(title="CHÁ MATE CONCENTRADO 3 L", y="RENDE ATÉ 33 L", badge=None,
             desc="Tostado, com sabor natural do mate e erva-mate pura folha. Também em 750 ml, "
                  "que rende até 8,2 L.",
             imgs=lambda x, y: [fit(PR("cm_3l_tostado.png"), x + 14, y + 6, 34, ih - 7, bg=CARD),
                                fit(PR("cm_750_tostado.png"), x + 50, y + 5, 14, ih - 6, bg=CARD)]),
        dict(title="CHÁ MATE TOSTADO 1,5 KG", y="30 SACHÊS  ·  ATÉ 3 L CADA",
             badge=None,
             desc="Sachês de 50 g para infusor elétrico. Sirva puro ou combinado com xaropes.",
             imgs=lambda x, y: [fit(PR("cm_infusor.png"), x + 6, y + 5, 44, ih - 6, bg=CARD),
                                fit(PR("cm_pouch_1500g.png"), x + 52, y + 7, 26, ih - 8, bg=CARD)]),
    ]
    for i, c in enumerate(cards):
        x = M + (i % 2) * (cw + 6)
        y = top + (i // 2) * (ch + gap)
        e += product_card(x, y, cw, ch, c["title"], c["y"], c["desc"], c["imgs"](x, y),
                          badge=c["badge"], img_h=ih)
    return dict(bg=CREAM_CM, els=e + footer(dark=False))


def page_checkmate_infusao():
    e = [R(0, 0, W, H, CREAM_CM),
         I(0, 0, W, 104, FT("cm_cha_quente.jpg"), focus=(0.62, 0.45)),
         G(0, 0, W, 40, 0.65, 0.0, ease=1.2),
         G(0, 50, W, 54, 0.0, 0.92, ease=1.3),
         logo("checkmate_logo_claro.png", M, 15, 7)]
    e += eyebrow(76, "INFUSÃO E VAREJO", GOLD)
    e += [headline(M, 84, CW, 16, "Do sachê à {prateleira.}", 32, LIGHT, GOLD)]
    y0 = 112
    e += [label(M, y0, CW, 8, "SACHÊS EM CAIXINHAS 25 G", 16, BROWN),
          T(M, y0 + 7, CW, 7, "10 sachês de 2,5 g  ·  {12 sabores}  ·  validade de 1 ano", 13,
            color=MUTED, accent=OLIVE, valign="middle")]
    caixas = [PR(f"cm_caixinha_{i:02d}.png") for i in range(1, 13)]
    gw = (CW - 5 * 3) / 6
    for i, p in enumerate(caixas):
        x = M + (i % 6) * (gw + 3)
        y = y0 + 17 + (i // 6) * 22
        e.append(fit(p, x, y, gw, 20, valign="middle", bg=CREAM_CM))
    e += [T(M, y0 + 62, CW, 13, "Bergamota  ·  maçã e canela  ·  laranja  ·  figo  ·  cardamomo e "
            "canela  ·  abacaxi e gengibre  ·  limão  ·  banana e baunilha  ·  cranberry e "
            "hibisco  ·  tosta média  ·  verde repousado  ·  tosta alta", 12, color=MUTED,
            lh=1.38, align="center")]
    y1 = 195
    bw = (CW - 2 * 5) / 3
    blocks = [
        (PR("cm_familia_75g.png"), "CHÁ MATE 75 G",
         "Tostado, pêssego e limão. 3 sachês de 25 g: cada um rende 1,5 L quente ou 1 L gelado."),
        (PR("cm_erva_tostada.png"), "A GRANEL 250 G",
         "Tostado, pura folha, para coar em casa. Rende até 20 L. Caixa com 20 unidades."),
        (PR("cm_erva_verde.png"), "CHÁ MATE 110 G",
         "Verde repousado e tostado. Folhas em repouso de 8 a 12 meses antes da moagem."),
    ]
    for i, (img, t, d) in enumerate(blocks):
        x = M + i * (bw + 5)
        e += [R(x, y1, bw, 76, CARD, stroke=LINE, sw=0.3),
              fit(img, x + 6, y1 + 5, bw - 12, 26, valign="middle", bg=CARD),
              label(x + 6, y1 + 34, bw - 12, 7, t, 14.5, BROWN, lh=1.0),
              T(x + 6, y1 + 42, bw - 12, 32, d, 11.5, color=MUTED, lh=1.33)]
    return dict(bg=CREAM_CM, els=e + footer(dark=False))


def page_liqsy():
    hero = PR("lq_hero.jpg")
    hw = 72
    hh = hw / ratio(hero)
    hb = 66
    hy = hb - 0.18977 * hh
    gy = hy + 0.28358 * hh
    hx = W - M - hw + 4
    e = [R(0, 0, W, H, CREAM),
         R(0, 0, W, hb, PETROL),
         R(0, gy - 0.15, W, 0.3, LQ_GOLD),
         mt.P(hx, hy, hw, hh, hero),
         logo("liqsy_logo_claro.png", M, 11, 25),
         logo("liqsy_tagline_claro.png", M, 41, 15)]
    x0, cw = M, hx - M - 4
    e += eyebrow(gy + 6, "XAROPES PREMIUM", GOLD_D, w=cw)
    e += [headline(x0, gy + 15, cw, 26, "9 sabores para\n{criar sem limites.}", 30, NAVY, GOLD_D),
          T(x0, gy + 42, cw, 26, "Textura aveludada e diluição simples: das experiências cítricas "
            "às adocicadas, com sabor e personalidade em cada combinação.", 13.5, color=MUTED,
            lh=1.38)]
    py = gy + 70
    e += [R(x0, py, cw, 20, CARD, stroke=LINE, sw=0.3),
          label(x0 + 5, py, 34, 20, "1 + 10", 27, NAVY, valign="middle", lh=1.0),
          T(x0 + 38, py, cw - 42, 20, "{PREPARO SIMPLES}\n1 porção de xarope para 10 porções de "
            "água gelada", 12, color=MUTED, accent=NAVY, valign="middle", lh=1.3)]
    fy = py + 25
    fw = (cw - 5) / 2
    for j, (t, r) in enumerate([("GARRAFA 750 ML", "rende 8,25 litros"),
                                ("BAG-IN-BOX 3 L", "rende 33 litros")]):
        x = x0 + j * (fw + 5)
        e += [R(x, fy, fw, 18, NAVY),
              label(x + 4, fy + 2.5, fw - 8, 7, t, 13, CREAM, track=0.06),
              T(x + 4, fy + 9.5, fw - 8, 7, r, 13, color=LQ_GOLD, font="serif", italic=True)]
    sabores = [("limao_siciliano", "LIMÃO\nSICILIANO"), ("gengibre", "GENGIBRE"),
               ("morango", "MORANGO"), ("maca_verde", "MAÇÃ\nVERDE"),
               ("cranberry", "CRANBERRY"), ("frutas_vermelhas", "FRUTAS\nVERMELHAS"),
               ("pessego", "PÊSSEGO"), ("limao", "LIMÃO")]
    by = 214
    bw, g = 19.4, 3.11
    for i, (f, n) in enumerate(sabores):
        x = M + i * (bw + g)
        e += [I(x, by, bw, 44, str(PR(f"lq_garrafa_{f}.jpg")), focus=(0.5, 0.5)),
              label(x - 2, by + 45, bw + 4, 9, n, 10.5, NAVY, align="center", lh=1.0)]
    e += [T(M, by - 9, CW, 7, "{9 SABORES}  ·  bergamota, no destaque acima, e mais estes 8, em "
            "garrafa e bag-in-box", 12, color=MUTED, accent=NAVY, align="center",
            valign="middle")]
    return dict(bg=CREAM, els=e + footer(dark=False))


def fichas():
    return json.loads((ROOT / "fichas.json").read_text(encoding="utf-8"))


def page_fichas():
    F = {f["nome"]: f for f in fichas()}
    lucro_max = max(f["lucro"] for f in F.values())
    custo_min = min(f["custo_total"] for f in F.values())
    e = [R(0, 0, W, H, ESP),
         I(0, 0, W, 90, FT("lq_bartender.jpg"), focus=(0.5, 0.42)),
         G(0, 40, W, 50, 0.0, 1.0, ease=1.3)]
    e += eyebrow(84, "FICHAS TÉCNICAS DE DRINKS", GOLD)
    e += [headline(M, 93, CW, 28, "O cardápio já vem\n{com a conta feita.}", 32, LIGHT, GOLD),
          T(M, 122, CW, 15, f"{len(F)} drinks feitos com chás Checkmate e xaropes Liqsy, com "
            "ficha de preparo, custo e precificação.", 14.5, color=MUTED_L, lh=1.38)]
    alc = sum(1 for f in F.values() if f["tipo"] == "Alcoólico")
    stats = [(f"{len(F)} drinks", f"{alc} com álcool e {len(F) - alc} sem álcool"),
             (f"até {money(lucro_max)}", "de lucro bruto estimado por drink"),
             (f"a partir de {money(custo_min)}", "de custo total por drink")]
    sw = (CW - 2 * 6) / 3
    for i, (n, d) in enumerate(stats):
        x = M + i * (sw + 6)
        e += [R(x, 140, sw, 0.5, GOLD),
              label(x, 143, sw, 10, n, 21, GOLD, valign="middle", lh=1.0),
              T(x, 154, sw, 11, d, 12, color=MUTED_L, lh=1.3)]
    destaques = ["Good Apple", "Sunset", "Moscow Mule", "Sicilian Cooler"]
    cw, top, gap = (CW - 6) / 2, 168, 5
    ch = (262 - top - gap) / 2
    for i, nome in enumerate(destaques):
        f = F[nome]
        x = M + (i % 2) * (cw + 6)
        y = top + (i // 2) * (ch + gap)
        ings = lista([n for n, _, _ in f["ingredientes"] if n.lower() != "gelo"])
        tag = "COM ÁLCOOL" if f["tipo"] == "Alcoólico" else "SEM ÁLCOOL"
        e += [R(x, y, cw, ch, ESP2),
              label(x + 6, y + 4.5, cw - 12, 5, tag, 10.5, GOLD, track=0.14),
              headline(x + 6, y + 10, cw - 12, 9, nome, 17, LIGHT, GOLD, lh=1.0),
              T(x + 6, y + 19.5, cw - 12, 11, ings, 10.5, color=MUTED_L, lh=1.3),
              R(x + 6, y + ch - 12.5, cw - 12, 0.3, LINE_D)]
        cols = [("CUSTO", money(f["custo_total"]), LIGHT), ("VENDA", money(f["preco"]), LIGHT),
                ("LUCRO", money(f["lucro"]), GOLD)]
        qw = (cw - 12) / 3
        for k, (t, v, c) in enumerate(cols):
            e += [label(x + 6 + k * qw, y + ch - 11, qw, 4.5, t, 9, MUTED_L, track=0.12),
                  label(x + 6 + k * qw, y + ch - 6.8, qw, 5.5, v, 13.5, c, lh=1.0)]
    e += [T(M, 264, CW, 10, "Fichas técnicas elaboradas por Antonio Marcos Monteiro | O Homem "
            "Drink. Valores de referência: custos variam conforme fornecedores e região.", 10.5,
            color=MUTED_L, lh=1.3, valign="middle")]
    return dict(bg=ESP, els=e + footer())


def bases(f):
    chas = [n[7:] for n, _, _ in f["ingredientes"] if n.lower().startswith("chá de ")]
    xar = [n[10:] for n, _, _ in f["ingredientes"] if n.lower().startswith("xarope de ")]
    parts = []
    if chas:
        parts.append("Chá " + " e ".join(c.lower() for c in chas))
    if xar:
        parts.append("Xarope " + " e ".join(x.lower() for x in xar))
    return "  ·  ".join(parts)


def page_cardapio():
    F = fichas()
    e = [R(0, 0, W, H, CREAM)]
    e += eyebrow(16, "CARDÁPIO COMPLETO", GOLD_D)
    e += [headline(M, 25, CW, 14, "Custo e lucro de {cada drink.}", 28, BROWN, GOLD_D)]
    cols = [("DRINK", 46, "left"), ("CHÁS E XAROPES", 70, "left"), ("CUSTO TOTAL", 21, "right"),
            ("LUCRO BRUTO", 21, "right"), ("CUSTO %", 20, "right")]
    ty = 46
    x = M
    xs = []
    for t, w, a in cols:
        xs.append((x, w, a))
        e.append(label(x, ty - 3, w, 10, t, 10.5, MUTED, align=a, track=0.1, valign="bottom", lh=1.05))
        x += w
    e.append(R(M, ty + 7, CW, 0.5, BROWN))
    y = ty + 9
    rh = 9.6
    for tipo, preco, titulo in [("Alcoólico", 30, "COM ÁLCOOL"), ("Sem álcool", 24, "SEM ÁLCOOL")]:
        grupo = sorted((f for f in F if f["tipo"] == tipo), key=lambda f: -f["lucro"])
        e += [R(M, y, CW, 7.5, "#EFE6D6"),
              label(M + 2, y, CW - 4, 7.5, f"{titulo}  ·  PREÇO DE VENDA {money(preco)}", 11,
                    GOLD_D, valign="middle", track=0.1)]
        y += 8.5
        for f in grupo:
            vals = [(f["nome"], "display", True, 12.5, BROWN),
                    (bases(f), "body", False, 10.5, MUTED),
                    (money(f["custo_total"]), "display", True, 13, BROWN),
                    (money(f["lucro"]), "display", True, 13, OLIVE),
                    (f"{f['cmv']:.1f}%".replace(".", ","), "display", False, 13, MUTED)]
            for (cx, cw, al), (v, fo, b, s, c) in zip(xs, vals):
                pad = 2 if al == "left" else 0
                e.append(T(cx + pad, y, cw - pad - (1 if al == "right" else 0), rh, v, s,
                           color=c, font=fo, bold=b, align=al, valign="middle", lh=1.1))
            y += rh
            e.append(R(M, y - 0.15, CW, 0.3, LINE))
        y += 2
    e += [T(M, y + 1.5, CW, 12, "Custo total = insumos + 12% de operação do bar, conforme as "
            "fichas técnicas de Antonio Marcos Monteiro | O Homem Drink. Fichas completas com "
            f"modo de preparo com o {CONTATO_NOME}.", 10.5, color=MUTED, lh=1.32)]
    return dict(bg=CREAM, els=e + footer(dark=False))


def page_contato():
    e = [R(0, 0, W, H, ESP),
         I(0, 0, W, 100, FT("cm_granel_cena.jpg"), focus=(0.5, 0.56)),
         G(0, 40, W, 60, 0.0, 1.0, ease=1.4)]
    e += eyebrow(93, "FAÇA SEU PEDIDO", GOLD)
    e += [headline(M, 102, CW, 30, "Vamos montar o cardápio\n{de bebidas do seu negócio?}", 30,
                   LIGHT, GOLD),
          T(M, 132, CW, 15, f"Fale com o {CONTATO_NOME} e receba a tabela de preços, as "
            "condições e a indicação dos produtos certos para o seu público.", 14.5,
            color="#E2D8CE", lh=1.38)]
    steps = [("CHAME NO WHATSAPP", f"Fale direto com o {CONTATO_NOME}."),
             ("CONTE SOBRE O NEGÓCIO", "Tipo de casa, público e bebidas que já vende."),
             ("RECEBA TABELA E FICHAS", "Preços, condições e fichas técnicas de drinks.")]
    sw = (CW - 2 * 7) / 3
    for i, (t, d) in enumerate(steps):
        x = M + i * (sw + 7)
        y = 152
        e += [O(x, y, 10, stroke=GOLD, sw=0.45),
              label(x, y, 10, 10, str(i + 1), 16, GOLD, align="center", valign="middle", lh=1.0),
              label(x, y + 13, sw, 7, t, 14.5, LIGHT, lh=1.0),
              T(x, y + 20, sw, 13, d, 12.5, color=MUTED_L, lh=1.3)]
    py, ph = 190, 64
    qs = 46
    qx = W - M - 6 - qs
    e += [R(M, py, CW, ph, ESP2, link=WA),
          R(M, py, 1.2, ph, GOLD),
          label(M + 8, py + 7, 112, 7, f"{CONTATO_NOME.upper()}  |  "
                f"{CONTATO_CARGO.upper()}", 13, GOLD, track=0.12),
          label(M + 8, py + 15, 116, 20, CONTATO_TEL, 44, LIGHT, valign="middle", lh=1.0,
                track=0, link=WA),
          R(M + 8, py + 41, 82, 14, GOLD, radius=7, link=WA),
          label(M + 8, py + 41, 82, 14, "CHAMAR NO WHATSAPP", 15, ESP, align="center",
                valign="middle", track=0.08, link=WA),
          R(qx, py + 5, qs, qs, "#FFFFFF", radius=1.2, link=WA),
          mt.P(qx + 3.5, py + 8.5, qs - 7, qs - 7, BUILD / "qr_whatsapp.png", link=WA, keep=True),
          label(qx, py + 53, qs, 6, "APONTE A CÂMERA", 11, MUTED_L, align="center",
                valign="middle", track=0.14)]
    cm_w = 7 * ratio(MK("checkmate_logo_claro.png"))
    lq_w = 14 * ratio(MK("liqsy_logo_claro.png"))
    sel = 15
    total = cm_w + 10 + lq_w + 10 + sel
    x0 = (W - total) / 2
    e += [logo("checkmate_logo_claro.png", x0, 266.5, 7),
          R(x0 + cm_w + 5, 263.5, 0.3, 13, MUTED_L),
          logo("liqsy_logo_claro.png", x0 + cm_w + 10, 262.5, 14),
          R(x0 + cm_w + 10 + lq_w + 5, 263.5, 0.3, 13, MUTED_L),
          logo("baldo_selo_claro.png", x0 + cm_w + 10 + lq_w + 10, 262, sel),
          T(M, 281, CW, 6, "MARCAS BALDO  ·  APAIXONADOS POR MATE DESDE 1920", 11.5,
            color=MUTED_L, font="display", bold=True, align="center", valign="middle",
            track=0.16)]
    return dict(bg=ESP, els=e)


PAGES = [page_capa, page_marcas, page_porque, page_checkmate_balcao, page_checkmate_infusao,
         page_liqsy, page_fichas, page_cardapio, page_contato]


def main():
    BUILD.mkdir(exist_ok=True)
    mt.qr_png(WA, BUILD / "qr_whatsapp.png", dark=ESP)
    projeto = mt.Projeto(
        root=ROOT, out=OUT, arquivo=ARQ,
        titulo="Checkmate e Liqsy | Portfólio de bebidas",
        autor=f"{CONTATO_NOME}, {CONTATO_CARGO}",
        assunto="Chá mate Checkmate e xaropes Liqsy para food service",
        palavras=f"pedidos, {CONTATO_NOME}, {CONTATO_TEL}", fontes=FONTS, familias=FAMILY,
        fundo=ESP, rotulo_link=f"WhatsApp {CONTATO_NOME}")
    projeto.gerar([fn() for fn in PAGES])


if __name__ == "__main__":
    main()
