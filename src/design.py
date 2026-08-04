"""
Sistema de design compartilhado pelos dois documentos.

Concentra paleta, fontes, estilos de parágrafo, tabelas, caixas de destaque,
capa e rodapé numerado. A ideia é que os arquivos de conteúdo (doc1_*, doc2_*)
cuidem apenas do texto, sem repetir formatação.
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------- paleta -----

NAVY = colors.HexColor("#10243A")       # institucional, base
NAVY_DEEP = colors.HexColor("#081422")  # capa
STEEL = colors.HexColor("#1F5C8B")      # acento frio
STEEL_SOFT = colors.HexColor("#E8EFF5")
GOLD = colors.HexColor("#C8952A")       # acento quente / destaques
GOLD_SOFT = colors.HexColor("#FBF3DF")
ALERT = colors.HexColor("#9E2A2B")      # prazos, proibições
ALERT_SOFT = colors.HexColor("#F9EAEA")
OK = colors.HexColor("#2F6B4F")         # conformidade
OK_SOFT = colors.HexColor("#E9F2EC")
INK = colors.HexColor("#2B3640")        # corpo de texto
INK_SOFT = colors.HexColor("#5A6672")
LINE = colors.HexColor("#C9D2DA")
ZEBRA = colors.HexColor("#F4F7F9")
WHITE = colors.white

PAGE_W, PAGE_H = A4
MARGIN_X = 1.9 * cm
MARGIN_TOP = 2.1 * cm
MARGIN_BOTTOM = 1.9 * cm
CONTENT_W = PAGE_W - 2 * MARGIN_X

# ---------------------------------------------------------------- fontes -----

_FONT_DIR = "/usr/share/fonts/truetype/liberation"
_DEJAVU = "/usr/share/fonts/truetype/dejavu"

FONT = "LSans"
FONT_B = "LSans-B"
FONT_I = "LSans-I"
FONT_BI = "LSans-BI"
FONT_MONO = "LMono"


def register_fonts():
    """Registra as fontes TrueType. Idempotente."""
    already = set(pdfmetrics.getRegisteredFontNames())
    if FONT in already:
        return
    pairs = [
        (FONT, f"{_FONT_DIR}/LiberationSans-Regular.ttf"),
        (FONT_B, f"{_FONT_DIR}/LiberationSans-Bold.ttf"),
        (FONT_I, f"{_FONT_DIR}/LiberationSans-Italic.ttf"),
        (FONT_BI, f"{_FONT_DIR}/LiberationSans-BoldItalic.ttf"),
        (FONT_MONO, f"{_DEJAVU}/DejaVuSansMono.ttf"),
    ]
    for name, path in pairs:
        pdfmetrics.registerFont(TTFont(name, path))
    pdfmetrics.registerFontFamily(
        FONT, normal=FONT, bold=FONT_B, italic=FONT_I, boldItalic=FONT_BI
    )


# --------------------------------------------------------------- estilos -----


def build_styles():
    register_fonts()
    ss = getSampleStyleSheet()

    def add(name, **kw):
        base = dict(fontName=FONT, fontSize=9.6, leading=14.2, textColor=INK)
        base.update(kw)
        style = ParagraphStyle(name=name, **base)
        # a folha de estilos padrão do reportlab já traz alguns nomes
        # (Bullet, Normal...); sobrescrevemos em vez de colidir.
        ss.byName[name] = style
        if name not in [s.name for s in ss.byAlias.values()]:
            ss.byAlias[name] = style
        return style

    add("Corpo", alignment=TA_JUSTIFY, spaceAfter=6.5)
    add("CorpoLeft", alignment=TA_LEFT, spaceAfter=6.5)
    add("CorpoSm", fontSize=8.6, leading=12.4, alignment=TA_JUSTIFY, spaceAfter=5)
    add("Nota", fontSize=8.1, leading=11.6, textColor=INK_SOFT, fontName=FONT_I,
        alignment=TA_JUSTIFY, spaceAfter=5)

    add("H1", fontName=FONT_B, fontSize=17, leading=21, textColor=NAVY,
        spaceBefore=2, spaceAfter=2)
    add("H1Num", fontName=FONT_B, fontSize=17, leading=21, textColor=GOLD)
    add("H2", fontName=FONT_B, fontSize=11.8, leading=15.5, textColor=NAVY,
        spaceBefore=11, spaceAfter=4)
    add("H3", fontName=FONT_B, fontSize=10, leading=13.5, textColor=STEEL,
        spaceBefore=8, spaceAfter=3)

    add("Eyebrow", fontName=FONT_B, fontSize=7.8, leading=10, textColor=GOLD)
    add("Bullet", alignment=TA_LEFT, spaceAfter=3.2, leftIndent=10,
        bulletIndent=1, firstLineIndent=0)

    # células de tabela
    add("Th", fontName=FONT_B, fontSize=8.5, leading=11, textColor=WHITE,
        alignment=TA_LEFT)
    add("Td", fontSize=8.5, leading=11.6, alignment=TA_LEFT)
    add("TdB", fontName=FONT_B, fontSize=8.5, leading=11.6, alignment=TA_LEFT)
    add("TdC", fontSize=8.5, leading=11.6, alignment=TA_CENTER)
    add("TdCB", fontName=FONT_B, fontSize=8.5, leading=11.6, alignment=TA_CENTER)
    add("TdSm", fontSize=7.9, leading=10.6, alignment=TA_LEFT)

    # caixas
    add("BoxTitle", fontName=FONT_B, fontSize=9.4, leading=12.5, textColor=NAVY,
        spaceAfter=3)
    add("BoxBody", fontSize=8.8, leading=12.6, alignment=TA_JUSTIFY)

    # capa
    add("CoverEyebrow", fontName=FONT_B, fontSize=9.4, leading=13,
        textColor=GOLD, alignment=TA_LEFT)
    add("CoverTitle", fontName=FONT_B, fontSize=29, leading=33, textColor=WHITE,
        alignment=TA_LEFT)
    add("CoverSub", fontSize=11.6, leading=16.5, textColor=colors.HexColor("#B9C7D4"),
        alignment=TA_LEFT)
    add("CoverMeta", fontSize=9, leading=13, textColor=colors.HexColor("#93A4B4"),
        alignment=TA_LEFT)
    add("CoverName", fontName=FONT_B, fontSize=13.5, leading=17, textColor=WHITE,
        alignment=TA_LEFT)

    add("TocItem", fontSize=9.4, leading=15.5, alignment=TA_LEFT)
    add("TocNum", fontName=FONT_B, fontSize=9.4, leading=15.5, textColor=GOLD,
        alignment=TA_RIGHT)
    return ss


STYLES = build_styles()
S = STYLES


def P(text, style="Corpo"):
    return Paragraph(text, S[style])


def campo(rotulo):
    """Marca visual de campo a preencher pelo instrutor."""
    return (
        f'<font color="#96701A" backColor="#FBF3DF"><b>&nbsp;[ {rotulo} ]&nbsp;</b></font>'
    )


# ------------------------------------------------------------- flowables -----


class HRule(Flowable):
    def __init__(self, width=None, thickness=0.7, color=LINE, space_before=0,
                 space_after=0):
        super().__init__()
        self.width = width
        self.thickness = thickness
        self.color = color
        self.sb = space_before
        self.sa = space_after

    def wrap(self, aw, ah):
        self._w = self.width or aw
        return (self._w, self.thickness + self.sb + self.sa)

    def draw(self):
        c = self.canv
        c.setStrokeColor(self.color)
        c.setLineWidth(self.thickness)
        y = self.sa
        c.line(0, y, self._w, y)


class SectionHeader(Flowable):
    """Cabeçalho de seção: número em tarja, título e régua inferior."""

    _H = 30

    def __init__(self, number, title, subtitle=None, gap=0):
        super().__init__()
        self.number = str(number)
        self.title = title
        self.subtitle = subtitle
        self.gap = gap          # respiro acima, para seções que não abrem página
        # nunca deixar o cabeçalho órfão no pé da página
        self.keepWithNext = 1

    def wrap(self, aw, ah):
        self._w = aw
        self._sub_h = 0
        if self.subtitle:
            self._sub_p = Paragraph(
                self.subtitle,
                ParagraphStyle("shsub", fontName=FONT, fontSize=9,
                               leading=12.5, textColor=INK_SOFT),
            )
            _, self._sub_h = self._sub_p.wrap(aw - 44, ah)
            self._sub_h += 4
        return (aw, self._H + self._sub_h + 8 + self.gap)

    def draw(self):
        c = self.canv
        top = self._H + self._sub_h + 8
        # tarja com o número
        box_w, box_h = 34, 26
        y = top - box_h - 2
        c.setFillColor(NAVY)
        c.rect(0, y, box_w, box_h, stroke=0, fill=1)
        c.setFillColor(GOLD)
        c.setFont(FONT_B, 14)
        c.drawCentredString(box_w / 2.0, y + 8.2, self.number)
        # título
        c.setFillColor(NAVY)
        c.setFont(FONT_B, 15.5)
        c.drawString(box_w + 10, y + 8.4, self.title)
        if self.subtitle:
            self._sub_p.drawOn(c, box_w + 10, y - self._sub_h + 1)
        # régua
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.6)
        c.line(0, 2, 48, 2)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.7)
        c.line(48, 2, self._w, 2)


class Callout(Flowable):
    """Caixa de destaque com barra lateral colorida."""

    PALETTE = {
        "info": (STEEL, STEEL_SOFT),
        "gold": (GOLD, GOLD_SOFT),
        "alert": (ALERT, ALERT_SOFT),
        "ok": (OK, OK_SOFT),
    }

    def __init__(self, title, body, kind="info", width=None, pad=8):
        super().__init__()
        self.title = title
        self.body = body if isinstance(body, (list, tuple)) else [body]
        self.kind = kind
        self.width = width
        self.pad = pad

    def wrap(self, aw, ah):
        self._w = self.width or aw
        inner = self._w - 2 * self.pad - 5
        self._parts = []
        h = self.pad
        if self.title:
            p = Paragraph(self.title, S["BoxTitle"])
            _, ph = p.wrap(inner, ah)
            self._parts.append((p, ph))
            h += ph + 3
        for b in self.body:
            p = b if isinstance(b, Paragraph) else Paragraph(b, S["BoxBody"])
            _, ph = p.wrap(inner, ah)
            self._parts.append((p, ph))
            h += ph + 3
        h += self.pad - 3
        self._h = h
        return (self._w, h)

    def draw(self):
        c = self.canv
        bar, bg = self.PALETTE[self.kind]
        c.setFillColor(bg)
        c.rect(0, 0, self._w, self._h, stroke=0, fill=1)
        c.setFillColor(bar)
        c.rect(0, 0, 4, self._h, stroke=0, fill=1)
        y = self._h - self.pad
        inner = self._w - 2 * self.pad - 5
        for p, ph in self._parts:
            y -= ph
            p.drawOn(c, self.pad + 5, y)
            y -= 3


class DroneMark(Flowable):
    """Silhueta vetorial de quadricóptero (vista superior)."""

    def __init__(self, size=74, color=GOLD, lw=1.5, alpha=1.0):
        super().__init__()
        self.size = size
        self.color = color
        self.lw = lw
        self.alpha = alpha

    def wrap(self, aw, ah):
        return (self.size, self.size)

    def draw(self):
        c = self.canv
        s = self.size
        cx = cy = s / 2.0
        r = s * 0.19          # raio do rotor
        arm = s * 0.30        # meio-braço
        c.saveState()
        try:
            c.setFillAlpha(self.alpha)
            c.setStrokeAlpha(self.alpha)
        except Exception:
            pass
        c.setStrokeColor(self.color)
        c.setLineWidth(self.lw)
        c.setLineCap(1)
        for dx, dy in ((-1, 1), (1, 1), (-1, -1), (1, -1)):
            ex, ey = cx + dx * arm, cy + dy * arm
            c.line(cx + dx * s * 0.06, cy + dy * s * 0.06, ex, ey)
            c.circle(ex, ey, r, stroke=1, fill=0)
        # corpo central
        c.setFillColor(self.color)
        c.roundRect(cx - s * 0.105, cy - s * 0.085, s * 0.21, s * 0.17,
                    s * 0.045, stroke=0, fill=1)
        # gimbal / câmera
        c.circle(cx, cy - s * 0.135, s * 0.037, stroke=0, fill=1)
        c.restoreState()


# --------------------------------------------------------------- tabelas -----


def data_table(rows, col_widths, header=True, zebra=True, align=None,
               font_size=8.5, pad=5, repeat=1):
    """Tabela padrão: cabeçalho navy, zebra e grade leve."""
    t = Table(rows, colWidths=col_widths, repeatRows=repeat if header else 0)
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), pad),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), pad - 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ]
    if header:
        cmds += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("LINEBELOW", (0, 0), (-1, 0), 0.8, NAVY),
        ]
        if zebra:
            for i in range(1, len(rows)):
                if i % 2 == 0:
                    cmds.append(("BACKGROUND", (0, i), (-1, i), ZEBRA))
    elif zebra:
        for i in range(len(rows)):
            if i % 2 == 1:
                cmds.append(("BACKGROUND", (0, i), (-1, i), ZEBRA))
    if align:
        cmds += align
    t.setStyle(TableStyle(cmds))
    return t


def module_table(rows, widths=None):
    """Tabela de módulos: Módulo | Conteúdo | CH."""
    widths = widths or [CONTENT_W * 0.26, CONTENT_W * 0.62, CONTENT_W * 0.12]
    body = [[P("Módulo", "Th"), P("Conteúdo programático", "Th"),
             P("C.H.", "Th")]]
    total = 0
    for mod, cont, ch in rows:
        body.append([P(mod, "TdB"), P(cont, "TdSm"), P(ch, "TdC")])
        try:
            total += int(str(ch).replace("h", "").strip())
        except ValueError:
            pass
    body.append([P("Carga horária total", "TdB"), P("", "Td"),
                 P(f"{total}h", "TdCB")])
    t = data_table(body, widths)
    n = len(body) - 1
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, n), (-1, n), GOLD_SOFT),
        ("LINEABOVE", (0, n), (-1, n), 0.9, GOLD),
        ("SPAN", (0, n), (1, n)),
    ]))
    return t


class CheckBox(Flowable):
    """Quadradinho vetorial para marcar — não depende de glifo da fonte."""

    def __init__(self, size=9.5):
        super().__init__()
        self.size = size

    def wrap(self, aw, ah):
        return (self.size, self.size)

    def draw(self):
        c = self.canv
        c.setStrokeColor(INK_SOFT)
        c.setLineWidth(0.8)
        c.setFillColor(WHITE)
        c.rect(0, 0, self.size, self.size, stroke=1, fill=1)


def checklist_table(items, widths=None, header=("Item de verificação", "OK")):
    """Lista com quadradinho para marcar — pensada para uso impresso."""
    widths = widths or [CONTENT_W * 0.88, CONTENT_W * 0.12]
    rows = [[P(header[0], "Th"), P(header[1], "Th")]]
    for it in items:
        rows.append([P(it, "Td"), CheckBox()])
    t = data_table(rows, widths)
    t.setStyle(TableStyle([("ALIGN", (1, 1), (1, -1), "CENTER")]))
    return t


def kv_table(pairs, label_w=0.30):
    """Tabela rótulo/valor, sem cabeçalho."""
    widths = [CONTENT_W * label_w, CONTENT_W * (1 - label_w)]
    rows = [[P(k, "TdB"), P(v, "Td")] for k, v in pairs]
    t = Table(rows, colWidths=widths)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("BACKGROUND", (0, 0), (0, -1), STEEL_SOFT),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ]))
    return t


def bullets(items, style="Bullet", marker="&#9679;", color=None):
    color = color or GOLD.hexval()[2:]
    out = []
    for it in items:
        out.append(Paragraph(
            f'<font color="#{color}">{marker}</font>&nbsp;&nbsp;{it}',
            S[style], bulletText=None))
    return out


def numbered(items, style="Bullet"):
    out = []
    for i, it in enumerate(items, 1):
        out.append(Paragraph(
            f'<font color="{GOLD.hexval().replace("0x", "#")}"><b>{i}.</b></font>'
            f'&nbsp;&nbsp;{it}', S[style]))
    return out


# ---------------------------------------------------------------- páginas ----


class DocBuilder(BaseDocTemplate):
    """Template com capa full-bleed, corpo e rodapé numerado."""

    def __init__(self, path, doc_title, short_title, cover_fn, **kw):
        super().__init__(
            path, pagesize=A4,
            leftMargin=MARGIN_X, rightMargin=MARGIN_X,
            topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
            title=doc_title, author=kw.pop("author", ""),
            subject=kw.pop("subject", ""), creator="",
        )
        self.short_title = short_title
        self._cover_fn = cover_fn
        cover_frame = Frame(0, 0, PAGE_W, PAGE_H, id="cover",
                            leftPadding=0, rightPadding=0,
                            topPadding=0, bottomPadding=0)
        body_frame = Frame(MARGIN_X, MARGIN_BOTTOM, CONTENT_W,
                           PAGE_H - MARGIN_TOP - MARGIN_BOTTOM, id="body",
                           leftPadding=0, rightPadding=0,
                           topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[cover_frame],
                         onPage=self._draw_cover),
            PageTemplate(id="body", frames=[body_frame],
                         onPage=self._draw_body_chrome),
        ])

    def _draw_cover(self, canv, doc):
        self._cover_fn(canv, doc)

    def _draw_body_chrome(self, canv, doc):
        canv.saveState()
        # topo: fio fino + título curto
        canv.setStrokeColor(LINE)
        canv.setLineWidth(0.6)
        top_y = PAGE_H - MARGIN_TOP + 12
        canv.line(MARGIN_X, top_y, PAGE_W - MARGIN_X, top_y)
        canv.setFillColor(GOLD)
        canv.rect(MARGIN_X, top_y, 26, 1.6, stroke=0, fill=1)
        canv.setFont(FONT, 7.4)
        canv.setFillColor(INK_SOFT)
        canv.drawString(MARGIN_X, top_y + 5.5, self.short_title)
        # rodapé
        foot_y = MARGIN_BOTTOM - 13
        canv.setStrokeColor(LINE)
        canv.line(MARGIN_X, foot_y + 10, PAGE_W - MARGIN_X, foot_y + 10)
        canv.setFont(FONT, 7.4)
        canv.setFillColor(INK_SOFT)
        canv.drawString(MARGIN_X, foot_y, getattr(self, "footer_left", ""))
        canv.restoreState()


class NumberedCanvas:
    """Fábrica de canvas em duas passagens, para imprimir 'pág. X de Y'."""

    def __init__(self, base_cls, skip_first=True):
        self.base_cls = base_cls
        self.skip_first = skip_first

    def __call__(self, *a, **kw):
        outer = self

        class _C(outer.base_cls):
            def __init__(self, *aa, **kk):
                super().__init__(*aa, **kk)
                self._saved = []

            def showPage(self):
                self._saved.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                total = len(self._saved)
                for i, state in enumerate(self._saved, start=1):
                    self.__dict__.update(state)
                    if not (outer.skip_first and i == 1):
                        self._stamp(i, total)
                    super().showPage()
                super().save()

            def _stamp(self, i, total):
                self.saveState()
                self.setFont(FONT_B, 7.6)
                self.setFillColor(NAVY)
                self.drawRightString(PAGE_W - MARGIN_X, MARGIN_BOTTOM - 13,
                                     f"{i} / {total}")
                self.restoreState()

        return _C(*a, **kw)


def cover_backdrop(canv, accent=GOLD):
    """Fundo da capa: gradiente sólido em faixas + malha discreta."""
    canv.saveState()
    canv.setFillColor(NAVY_DEEP)
    canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # bloco superior levemente mais claro
    canv.setFillColor(NAVY)
    canv.rect(0, PAGE_H * 0.34, PAGE_W, PAGE_H * 0.66, stroke=0, fill=1)
    # diagonais tênues
    canv.setStrokeColor(colors.HexColor("#16324F"))
    canv.setLineWidth(0.8)
    for i in range(-2, 26):
        x = i * 42.0
        canv.line(x, PAGE_H, x + PAGE_H * 0.55, PAGE_H * 0.34)
    # faixa de acento
    canv.setFillColor(accent)
    canv.rect(0, PAGE_H * 0.34 - 4, PAGE_W, 4, stroke=0, fill=1)
    canv.restoreState()


def toc_block(entries):
    """Sumário: número | título | (linha pontilhada implícita)."""
    rows = []
    for num, title in entries:
        rows.append([P(f"{num}", "TocNum"), P(title, "TocItem")])
    t = Table(rows, colWidths=[1.15 * cm, CONTENT_W - 1.15 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.35, colors.HexColor("#E2E8ED")),
    ]))
    return t


__all__ = [
    "NAVY", "NAVY_DEEP", "STEEL", "STEEL_SOFT", "GOLD", "GOLD_SOFT", "ALERT",
    "ALERT_SOFT", "OK", "OK_SOFT", "INK", "INK_SOFT", "LINE", "ZEBRA", "WHITE",
    "PAGE_W", "PAGE_H", "MARGIN_X", "MARGIN_TOP", "MARGIN_BOTTOM", "CONTENT_W",
    "FONT", "FONT_B", "FONT_I", "FONT_BI", "FONT_MONO", "STYLES", "S", "P",
    "campo", "HRule", "SectionHeader", "Callout", "DroneMark", "data_table",
    "module_table", "checklist_table", "kv_table", "bullets", "numbered", "CheckBox",
    "DocBuilder", "NumberedCanvas", "cover_backdrop", "toc_block",
    "cm", "mm", "colors", "Spacer", "PageBreak", "Paragraph", "Table",
    "TableStyle", "KeepTogether", "TA_CENTER", "TA_LEFT", "TA_JUSTIFY",
]
