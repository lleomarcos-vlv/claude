import markdown, pathlib, html, re

SRC = pathlib.Path('/home/user/claude/docs/filial-jundiai')
OUT = pathlib.Path('/tmp/claude-0/-home-user-claude/a91e8952-51b1-5a39-ab84-2b7cf4c3bdc5/scratchpad/pdf')

CSS = """
@page { size: A4; margin: @@MARGIN@@; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Liberation Serif","DejaVu Serif",Georgia,serif;
       font-size: @@BASE@@pt; line-height: @@LH@@; color: #1a1a1a; margin: 0; text-align: justify; }
h1,h2,h3,h4 { font-family: "Liberation Sans","DejaVu Sans",Arial,sans-serif; color: #111; text-align: left; }
h1 { font-size: 19pt; line-height: 1.25; margin: 0 0 6pt; border-bottom: 2px solid #333; padding-bottom: 6pt; }
h1 + h3 { margin-top: 4pt; color: #444; font-weight: 500; }
h2 { font-size: 13.5pt; margin: 20pt 0 7pt; padding-bottom: 3pt; border-bottom: 1px solid #ccc;
     page-break-after: avoid; break-after: avoid; }
h3 { font-size: 11.5pt; margin: 14pt 0 5pt; page-break-after: avoid; break-after: avoid; }
p { margin: 0 0 7pt; orphans: 3; widows: 3; }
strong { color: #000; }
ul, ol { margin: 0 0 8pt; padding-left: 18pt; }
li { margin-bottom: 3pt; }
hr { border: 0; border-top: 1px solid #ddd; margin: 16pt 0; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0 12pt; font-size: @@TBL@@pt;
        page-break-inside: avoid; break-inside: avoid; }
th, td { border: 1px solid #bbb; hyphens: auto; padding: 4pt 5pt; text-align: left; vertical-align: top; line-height: 1.35; }
th { background: #ececec; font-family: "Liberation Sans","DejaVu Sans",Arial,sans-serif;
     font-size: 8.5pt; font-weight: 700; }
tr:nth-child(even) td { background: #fafafa; }
blockquote { margin: 10pt 0; padding: 7pt 11pt; border-left: 3px solid #999;
             background: #f6f6f6; font-size: 9.6pt; page-break-inside: avoid; }
blockquote p:last-child { margin-bottom: 0; }
code { font-family: "Liberation Mono","DejaVu Sans Mono",monospace; font-size: 8.8pt;
       background: #f0f0f0; padding: 0.5pt 3pt; border: 1px solid #ddd; border-radius: 2px;
       color: #7a3b00; white-space: normal; overflow-wrap: break-word; }
pre { background: #f6f6f6; border: 1px solid #ddd; padding: 8pt; font-size: 8.5pt;
      line-height: 1.35; overflow: hidden; page-break-inside: avoid; }
pre code { background: none; border: 0; padding: 0; white-space: pre; color: #222; }
em { color: #333; }
a { color: #1a1a1a; text-decoration: none; }
.pagebreak { page-break-before: always; }
"""

PROFILES = {
    '01-projeto-implantacao-filial-jundiai': dict(margin='21mm 19mm 19mm 19mm', base='10.4', lh='1.46', tbl='8.6'),
    '02-resumo-executivo':                   dict(margin='16mm 15mm 15mm 15mm', base='9.2',  lh='1.34', tbl='8.0'),
    '03-portfolio-projetos-jundiai':         dict(margin='22mm 20mm 19mm 20mm', base='10.8', lh='1.52', tbl='9.0'),
    '04-50-motivos':                         dict(margin='21mm 20mm 19mm 20mm', base='10.6', lh='1.50', tbl='9.0'),
    'README':                                dict(margin='22mm 20mm 20mm 20mm', base='10.8', lh='1.52', tbl='9.0'),
}

def hard_breaks(text):
    """Preserva quebras de linha em blocos de metadados (linhas consecutivas iniciadas por **)."""
    lines = text.split('\n')
    out, i = [], 0
    while i < len(lines):
        j = i
        while j < len(lines) and lines[j].startswith('**') and not lines[j].startswith('**|'):
            j += 1
        if j - i >= 2:
            for k in range(i, j - 1):
                out.append(lines[k].rstrip() + '  ')
            out.append(lines[j - 1])
            i = j
        else:
            out.append(lines[i])
            i += 1
    return '\n'.join(out)

def css_for(stem):
    css = CSS
    for k, v in PROFILES[stem].items():
        css = css.replace('@@' + k.upper() + '@@', v)
    return css

def build(md_path, out_html):
    text = hard_breaks(md_path.read_text(encoding='utf-8'))
    body = markdown.markdown(text, extensions=['tables', 'sane_lists', 'attr_list'])
    # quebra de página antes das seções de primeiro nível "# " convertidas em h1 secundários
    parts = body.split('<h1>')
    if len(parts) > 2:
        body = parts[0] + '<h1>' + '<h1 class="pagebreak">'.join(parts[1:])
    doc = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
           f'<title>{html.escape(md_path.stem)}</title><style>{css_for(md_path.stem)}</style></head>'
           f'<body>{body}</body></html>')
    out_html.write_text(doc, encoding='utf-8')

for md in sorted(SRC.glob('*.md')):
    build(md, OUT / (md.stem + '.html'))
    print('html:', md.stem)
