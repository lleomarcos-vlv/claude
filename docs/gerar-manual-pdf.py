# -*- coding: utf-8 -*-
"""PDF 'geoAG — Manual de Operacao / Passo a Passo do Zero' (marca geoAG).
Foco: colocar administracao e tecnicos operando oficialmente. Infra ao final.
Texto em portugues acentuado (literal UTF-8, WinAnsi-safe). Evita -> e emoji."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    Preformatted, HRFlowable, NextPageTemplate, PageBreak, Flowable, CondPageBreak,
)

OUT = "/home/user/claude/docs/Integracao-geoAG-Passo-a-Passo.pdf"
SETA = "»"   # » separador de navegacao (WinAnsi-safe)
TR   = "—"   # — travessao
MID  = "·"   # · ponto medio

VERDE_ESC = colors.HexColor("#2f6a1e"); VERDE = colors.HexColor("#4f9e2e")
LARANJA = colors.HexColor("#f39200"); INK = colors.HexColor("#1f2937")
MUTED = colors.HexColor("#6b7280"); LINHA = colors.HexColor("#d7e3cd")
VERDE_BG = colors.HexColor("#eef5e8"); CODE_BG = colors.HexColor("#f3f6f0")
LARANJA_BG = colors.HexColor("#fdeccd")

styles = getSampleStyleSheet(); S = {}
S['body'] = ParagraphStyle('body', parent=styles['Normal'], fontName='Helvetica',
                           fontSize=10, leading=14.5, textColor=INK, spaceAfter=5)
S['muted'] = ParagraphStyle('muted', parent=S['body'], fontSize=8.7, textColor=MUTED)
S['h1'] = ParagraphStyle('h1', parent=styles['Normal'], fontName='Helvetica-Bold',
                         fontSize=14.5, leading=17, textColor=VERDE_ESC, spaceBefore=6, spaceAfter=2)
S['h2'] = ParagraphStyle('h2', parent=styles['Normal'], fontName='Helvetica-Bold',
                         fontSize=11.5, leading=14, textColor=VERDE, spaceBefore=9, spaceAfter=2)
S['li'] = ParagraphStyle('li', parent=S['body'], leftIndent=13, bulletIndent=3, spaceAfter=3)
S['code'] = ParagraphStyle('code', parent=styles['Code'], fontName='Courier',
                           fontSize=8.7, leading=12, textColor=colors.HexColor("#14320a"))
S['th'] = ParagraphStyle('th', parent=S['body'], fontName='Helvetica-Bold',
                         fontSize=9, textColor=colors.white, leading=12)
S['td'] = ParagraphStyle('td', parent=S['body'], fontSize=9, leading=12.5, spaceAfter=0)
S['callout'] = ParagraphStyle('callout', parent=S['body'], fontSize=9.3, leading=13.5,
                              textColor=colors.HexColor("#5a3b00"))
S['step'] = ParagraphStyle('step', parent=S['body'], fontSize=9.5, leading=13, spaceAfter=0)
S['stepnum'] = ParagraphStyle('stepnum', parent=S['td'], textColor=colors.white,
                              alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=11)
S['cover_sub'] = ParagraphStyle('cs', parent=S['body'], fontSize=12.5, leading=17,
                                textColor=INK, alignment=TA_CENTER)
S['cover_small'] = ParagraphStyle('csm', parent=S['muted'], alignment=TA_CENTER, fontSize=9.5, leading=14)

story = []

def h1(txt, keep=True):
    if keep: story.append(CondPageBreak(42*mm))
    story.append(Spacer(1, 4)); story.append(Paragraph(txt, S['h1']))
    story.append(HRFlowable(width="100%", thickness=2, color=LARANJA, spaceBefore=1, spaceAfter=6, lineCap='round'))

def h2(txt):
    story.append(CondPageBreak(24*mm)); story.append(Paragraph(txt, S['h2']))

def p(txt, style='body'):
    story.append(Paragraph(txt, S[style]))

def bullets(items):
    for it in items: story.append(Paragraph(it, S['li'], bulletText='•'))

def steps(items):
    rows = [[Paragraph(str(i), S['stepnum']), Paragraph(it, S['step'])] for i, it in enumerate(items, 1)]
    t = Table(rows, colWidths=[9*mm, 156*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), VERDE), ('LINEBELOW', (0,0), (0,-2), 1.2, colors.white),
        ('BACKGROUND', (1,0), (1,-1), VERDE_BG), ('BOX', (1,0), (1,-1), 0.4, LINHA),
        ('LINEBELOW', (1,0), (1,-2), 0.4, LINHA), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (1,0), (1,-1), 8), ('RIGHTPADDING', (1,0), (1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t); story.append(Spacer(1, 6))

def code(txt):
    box = Table([[Preformatted(txt, S['code'])]], colWidths=[165*mm])
    box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CODE_BG), ('BOX', (0,0), (-1,-1), 0.6, LINHA),
        ('LEFTPADDING', (0,0), (-1,-1), 9), ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), 7), ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LINEBEFORE', (0,0), (0,-1), 3, VERDE),
    ]))
    story.append(box); story.append(Spacer(1, 5))

def callout(txt):
    box = Table([[Paragraph(txt, S['callout'])]], colWidths=[165*mm])
    box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LARANJA_BG),
        ('LEFTPADDING', (0,0), (-1,-1), 10), ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7), ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LINEBEFORE', (0,0), (0,-1), 3, LARANJA),
    ]))
    story.append(box); story.append(Spacer(1, 6))

def table(header, rows, widths):
    data = [[Paragraph(c, S['th']) for c in header]] + [[Paragraph(c, S['td']) for c in r] for r in rows]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), VERDE_ESC),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, VERDE_BG]),
        ('GRID', (0,0), (-1,-1), 0.4, LINHA), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t); story.append(Spacer(1, 6))

# --- CAPA ------------------------------------------------------------------
class Wordmark(Flowable):
    def __init__(self, size=54):
        super().__init__(); self.size = size; self.width = 0; self.height = size*1.2
    def draw(self):
        c = self.canv; c.saveState(); c.setFont("Helvetica-Bold", self.size)
        wgeo = c.stringWidth("geo", "Helvetica-Bold", self.size)
        total = wgeo + c.stringWidth("AG", "Helvetica-Bold", self.size)
        x = (165*mm - total) / 2.0
        c.setFillColor(VERDE); c.drawString(x, 0, "geo")
        c.setFillColor(LARANJA); c.drawString(x + wgeo, 0, "AG"); c.restoreState()

def cover():
    story.append(Spacer(1, 26*mm)); story.append(Wordmark(56)); story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="42%", thickness=2.5, color=LARANJA, hAlign='CENTER', spaceBefore=4, spaceAfter=16))
    story.append(Paragraph("Manual de Operação", ParagraphStyle('ct', parent=S['body'],
        fontName='Helvetica-Bold', fontSize=25, leading=29, textColor=VERDE_ESC, alignment=TA_CENTER)))
    story.append(Paragraph("Passo a Passo do Zero", ParagraphStyle('ct2', parent=S['body'],
        fontName='Helvetica-Bold', fontSize=25, leading=29, textColor=LARANJA, alignment=TA_CENTER)))
    story.append(Spacer(1, 7*mm))
    story.append(Paragraph("Como colocar a <b>administração</b> e os <b>técnicos</b> "
                           "operando oficialmente", S['cover_sub']))
    story.append(Paragraph("Assistência Técnica de Drones DJI Agras", S['cover_small']))
    story.append(Spacer(1, 14*mm))
    box = Table([[Paragraph(
        "<b>geoAG</b> " + TR + " Goiânia-GO<br/>"
        "Av. Francisco de Melo, Quadra 41, Lote 06 " + TR + " 74.345-210, Vila Rosa<br/>"
        "contato@geoag.com.br &nbsp;" + MID + "&nbsp; +55 (62) 3914-4516 &nbsp;" + MID + "&nbsp; https://geoag.com.br",
        S['cover_small'])]], colWidths=[130*mm])
    box.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), VERDE_BG), ('BOX', (0,0), (-1,-1), 1, VERDE),
        ('TOPPADDING', (0,0), (-1,-1), 12), ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 12), ('RIGHTPADDING', (0,0), (-1,-1), 12)]))
    box.hAlign = 'CENTER'; story.append(box); story.append(Spacer(1, 8*mm))
    story.append(Paragraph("Documento operacional do cliente &nbsp;" + MID + "&nbsp; Julho de 2026", S['cover_small']))
    story.append(NextPageTemplate('corpo')); story.append(PageBreak())

# ===========================================================================
cover()

h1("Como usar este manual", keep=False)
p("Este guia mostra, <b>do zero</b>, como deixar o sistema do geoAG <b>funcionando "
  "oficialmente</b> no dia a dia " + TR + " com a <b>administração</b> e os "
  "<b>técnicos</b> trabalhando. A parte de servidor/instalação fica resumida no "
  "fim (Parte 6); o detalhe técnico está em <font face='Courier'>docs/INTEGRACAO-GEOAG.md</font>.")
table(["Parte", "O que você faz"], [
    ["1. Entrar e entender os perfis", "primeiro acesso; quem enxerga o quê"],
    ["2. Preparar a operação (Admin)", "trocar senha, cadastrar equipe e estoque"],
    ["3. O dia a dia por papel", "administração, técnico e cliente, passo a passo"],
    ["4. O ciclo completo da OS", "quem age em cada estágio e qual botão usa"],
    ["5. Fechamento e controle", "conclusão, financeiro, IA, auditoria"],
    ["6. Ir ao ar oficialmente + infra", "checklist final e como subir o sistema"],
], [70*mm, 95*mm])

h1("Parte 1 " + TR + " Entrar e entender os perfis")
p("O sistema tem <b>três perfis</b>. Cada pessoa entra com o seu e-mail e senha e "
  "só enxerga o que é do seu papel:")
table(["Perfil", "Quem é", "O que vê no menu"], [
    ["ADMIN (Administração)", "gerência / recepção",
     "Painel, Chamados, Ordens de Serviço, Estoque, IA Preditiva, Financeiro, Usuários, Auditoria"],
    ["TÉCNICO", "oficina / manutenção",
     "Painel, Agendamentos, Ordens de Serviço (executa o serviço; não vê valores)"],
    ["CLIENTE", "dono do drone",
     "Início, Agendar, Meus chamados (acompanha pela linha do tempo)"],
], [40*mm, 33*mm, 92*mm])
h2("Primeiro acesso da Administração")
steps([
    "Abra o endereço do sistema no navegador (ex.: <b>http://SERVIDOR:8080</b>, ou "
    "<b>https://app.geoag.com.br</b> em produção).",
    "Entre com o usuário ADMIN do geoAG (padrão <b>contato@geoag.com.br</b>) e a senha inicial.",
    "Vá em <b>Usuários</b>, ache o seu usuário e clique em <b>resetar senha</b> "
    "(ou defina uma senha forte que só a gerência conheça).",
])
callout("A senha inicial do administrador é provisória. <b>Troque-a no primeiro "
        "acesso</b> " + TR + " e nunca compartilhe o perfil ADMIN com técnicos.")

h1("Parte 2 " + TR + " Preparar a operação (Administração)")
p("Antes de atender o primeiro cliente de verdade, a administração deixa a casa "
  "pronta em <b>dois cadastros</b>: a equipe e o estoque de peças.")
h2("2.1 Cadastrar a equipe (menu Usuários)")
p("Crie um acesso para cada pessoa. As aeronaves e os clientes entram sozinhos depois "
  "(ao abrir chamados) " + TR + " aqui você cadastra a <b>equipe interna</b>.")
steps([
    "Menu <b>Usuários</b> " + SETA + " card <b>Novo usuário</b>.",
    "Preencha <b>Nome</b>, <b>E-mail</b> e <b>Senha</b> (mínimo 8 caracteres).",
    "Escolha o <b>Perfil</b>: <b>TECNICO</b> para a oficina; <b>ADMIN</b> para outra "
    "pessoa da gerência.",
    "Clique em <b>Criar usuário</b>. Repita para cada técnico e administrador.",
])
p("Na lista você ainda pode, a qualquer momento: <b>bloquear/reativar</b> um acesso, "
  "<b>resetar senha</b> (o sistema gera uma nova e mostra na tela) e trocar o perfil "
  "pela caixinha da coluna Perfil.", 'muted')
h2("2.2 Cadastrar o estoque de peças (menu Estoque)")
p("O estoque abastece duas coisas: o <b>preço no orçamento</b> (venda) e o "
  "<b>financeiro</b> (custo). Sem peças cadastradas, o técnico não tem o que lançar.")
steps([
    "Menu <b>Estoque</b> " + SETA + " card <b>Nova peça</b>.",
    "Preencha <b>SKU</b> (código, ex.: HELICE-0420), <b>Descrição</b>, <b>Saldo "
    "inicial</b> e <b>Estoque mínimo</b> (quando avisar para repor).",
    "Informe <b>Custo (R$)</b>, <b>Venda (R$)</b> e <b>Fornecedor</b> " + SETA + " <b>Cadastrar</b>.",
    "Muitas peças? Use <b>Importar planilha</b> (CSV: sku, descricao, quantidade, custo, preco, fornecedor).",
])
p("No dia a dia: quando <b>chegar peça nova</b>, use <b>Alimentar estoque</b> (peça + "
  "quantidade recebida " + SETA + " <b>Dar entrada</b>). O sistema avisa sozinho quais "
  "peças <b>precisam de pedido</b> quando o saldo cai abaixo do mínimo.", 'muted')
callout("O <b>técnico não vê preços</b> em lugar nenhum " + TR + " ele só escolhe a peça "
        "e a quantidade. Custo, venda, orçamento em R$ e financeiro são <b>exclusivos "
        "da administração</b>.")

h1("Parte 3 " + TR + " O dia a dia, por papel")
h2("3.1 Administração " + TR + " abrir o chamado (menu Chamados)")
p("Quando o cliente procura o geoAG (WhatsApp, Instagram, telefone, site...), a "
  "administração abre o chamado. Em um clique o sistema cadastra o cliente (com login "
  "e senha), registra a aeronave pelo Serial Number, cria a OS na fila e gera o protocolo.")
steps([
    "Menu <b>Chamados</b> " + SETA + " card <b>Abrir chamado</b>.",
    "Preencha: <b>Nome do cliente</b>, <b>E-mail</b> e <b>Telefone (WhatsApp)</b>, "
    "<b>Serial Number</b>, <b>Modelo</b>, <b>Origem do contato</b> e o <b>Relato</b>.",
    "Clique em <b>Abrir chamado</b>. Aparece o <b>protocolo</b> e o <b>login + senha "
    "inicial</b> do cliente.",
    "Clique em <b>Enviar login por WhatsApp</b> para o cliente já acompanhar pelo app.",
])
p("Ainda em Chamados, a administração <b>confirma ou recusa</b> os agendamentos que os "
  "clientes solicitam (leads) e vê os chamados recentes e a lista de clientes.", 'muted')
h2("3.2 Técnico " + TR + " executar o serviço (menu Ordens de Serviço)")
p("O técnico vê <b>Minhas ordens</b> (as atribuídas a ele) e <b>Acesso geral</b> (todas "
  "as da empresa, só leitura). Seleciona a OS e toca o fluxo:")
steps([
    "Selecione a OS na fila e clique em <b>Iniciar orçamento</b>.",
    "Escreva o <b>Diagnóstico</b> (obrigatório) e <b>Salvar</b>. Se quiser ajuda, use "
    "o <b>Diagnóstico assistido (IA)</b>: marque os sintomas " + SETA + " <b>Diagnosticar</b>.",
    "Em <b>Adicionar peça</b>, escolha a peça e a quantidade " + SETA + " <b>Adicionar</b> "
    "(o técnico vê o saldo, não o preço).",
    "Clique em <b>Enviar para aprovação</b> (só libera depois do diagnóstico salvo).",
    "Aprovado pela gerência, clique em <b>Iniciar manutenção</b> e faça o serviço.",
    "Terminou? <b>Concluir serviço</b>. Surgiu defeito novo? <b>Ir para Estágio 2</b> "
    "(monta um novo orçamento e volta para aprovação).",
])
h2("3.3 Administração " + TR + " aprovar e acompanhar")
p("A gerência é quem aprova o dinheiro. Na OS que estiver <b>Aguardando aprovação</b>:")
steps([
    "Abra a OS e confira o <b>Orçamento</b> (peças, mão de obra e total em R$).",
    "Clique em <b>Baixar PDF</b> ou <b>WhatsApp</b> para enviar o orçamento ao cliente.",
    "Combine com o cliente e clique em <b>Aprovar orçamento</b> (ou <b>Reprovar</b>). "
    "O mesmo vale para o <b>Estágio 2</b>.",
    "Use <b>Observações</b> marcando <b>visível ao cliente</b> para dar recados que "
    "aparecem na linha do tempo dele.",
])
p("Poderes extras da administração na OS: <b>cancelar</b>, <b>reabrir</b> e <b>alterar "
  "estágio</b> manualmente (pede um motivo, que fica registrado na auditoria).", 'muted')
h2("3.4 Cliente " + TR + " acompanhar")
p("O cliente entra com o login que recebeu por WhatsApp e vê, em <b>Meus chamados</b>, "
  "uma <b>linha do tempo</b> com o progresso e mensagens amigáveis (“Manutenção "
  "iniciada”, “Entrou no Estágio 2”, “Pronto para retirada”). Em <b>Agendar</b>, "
  "ele pode pedir um horário " + TR + " que a administração confirma.")

h1("Parte 4 " + TR + " O ciclo completo da OS (quem faz o quê)")
p("Este é o coração da operação. Cada linha é um estágio: quem age e qual botão usa.")
table(["Estágio", "Quem age", "O que faz (botão no sistema)"], [
    ["Fila de Espera", "Técnico", "Iniciar orçamento"],
    ["Orçamento", "Técnico", "Diagnóstico (obrigatório) + peças; Enviar para aprovação"],
    ["Aguardando aprovação", "Administração", "Aprovar orçamento (ou Reprovar)"],
    ["Aprovado", "Técnico", "Iniciar manutenção"],
    ["Estágio 1", "Técnico", "Concluir serviço  ou  Ir para Estágio 2"],
    ["Aguard. aprovação (E2)", "Administração", "Aprovar Estágio 2 (ou Reprovar)"],
    ["Estágio 2 aprovado", "Técnico", "Iniciar manutenção (Estágio 2)"],
    ["Estágio 2", "Técnico", "Concluir serviço"],
    ["Finalizado", "Sistema (automático)", "baixa das peças + histórico da aeronave + financeiro + auditoria"],
], [42*mm, 40*mm, 83*mm])
callout("Regra de ouro: <b>o técnico executa, a administração aprova</b>. Nada anda para "
        "a manutenção sem a aprovação do orçamento pela gerência.")

h1("Parte 5 " + TR + " Fechamento e controle (Administração)")
p("Ao <b>Concluir serviço</b>, o sistema faz tudo sozinho: <b>baixa as peças</b> do "
  "estoque, grava o evento no <b>histórico vitalício</b> da aeronave (pelo Serial "
  "Number), atualiza o <b>financeiro</b> e registra a <b>auditoria</b>.")
bullets([
    "<b>Financeiro</b> (menu Financeiro) " + TR + " custo, venda, margem, lucro e giro das peças.",
    "<b>IA Preditiva</b> (menu IA Preditiva) " + TR + " problemas crônicos, peças mais trocadas "
    "e recomendações, com exportação.",
    "<b>Auditoria</b> (menu Auditoria) " + TR + " tudo o que foi feito (usuário, data, IP, tela). "
    "Exporte o <b>PDF por período</b> " + TR + " já sai com o cabeçalho <b>geoAG</b> e o contato.",
])

h1("Parte 6 " + TR + " Ir ao ar oficialmente")
h2("6.1 Checklist " + TR + " “funcionando oficialmente”")
p("Antes de liberar para a equipe atender clientes de verdade, confirme:")
bullets([
    "[ ] Usuário ADMIN acessa e a <b>senha inicial foi trocada</b>.",
    "[ ] <b>Equipe cadastrada</b> em Usuários (técnicos e administração).",
    "[ ] <b>Estoque</b> com peças, <b>custo</b>, <b>venda</b> e <b>fornecedor</b>.",
    "[ ] <b>Chamado-teste</b> aberto: protocolo gerado e login enviado por WhatsApp.",
    "[ ] <b>Fluxo completo testado</b>: abrir " + SETA + " orçar " + SETA + " aprovar " + SETA +
    " manutenção " + SETA + " concluir.",
    "[ ] <b>PDF do orçamento</b> sai com os dados; a marca geoAG no topo e no rodapé.",
    "[ ] O <b>cliente-teste</b> consegue entrar e ver a linha do tempo.",
    "[ ] Marca <b>geoAG</b> (verde/laranja) no título da aba, no topo e no rodapé.",
])
callout("Dica: rode primeiro um <b>chamado-teste</b> de ponta a ponta com a equipe (um "
        "“ensaio”). Quando esse ciclo fechar certinho, o geoAG está pronto para atender "
        "oficialmente.")
h2("6.2 Como subir o sistema (resumo técnico)")
p("Se o sistema ainda não está instalado no servidor, o caminho mais simples é o "
  "<b>Docker</b>. Passo a passo detalhado em <font face='Courier'>docs/INTEGRACAO-GEOAG.md</font>.")
steps([
    "No servidor, copie o projeto e rode <font face='Courier'>cp .env.example .env</font>.",
    "No <font face='Courier'>.env</font>: senhas fortes (banco e KAIROS_JWT_SECRET), o "
    "<b>CNPJ real</b> (GEOAG_CNPJ) e <font face='Courier'>GEOAG_ONBOARDING_SEED=true</font>.",
    "Suba com <font face='Courier'>docker compose up --build -d</font> " + TR + " o sistema "
    "cria a empresa geoAG e o admin sozinho.",
    "Acesse (ex.: http://SERVIDOR:8080) e siga a Parte 1 deste manual.",
])
code("cp .env.example .env\n# edite o .env (senhas, GEOAG_CNPJ)\ndocker compose up --build -d")
p("Para treinar a equipe sem mexer em dados reais, há um modo demonstração (Windows: "
  "dois cliques em install.bat e depois iniciar.bat), com dados fictícios.", 'muted')

story.append(Spacer(1, 10))
box = Table([[Paragraph("<font color='white'><b>Suporte geoAG</b> &nbsp;" + MID +
    "&nbsp; contato@geoag.com.br &nbsp;" + MID + "&nbsp; +55 (62) 3914-4516 &nbsp;" + MID +
    "&nbsp; https://geoag.com.br</font>", ParagraphStyle('w', parent=S['cover_small'], textColor=colors.white))]],
    colWidths=[165*mm])
box.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), VERDE_ESC),
    ('TOPPADDING', (0,0), (-1,-1), 11), ('BOTTOMPADDING', (0,0), (-1,-1), 11)]))
story.append(box)

# --- Templates -------------------------------------------------------------
def rodape(canvas, doc):
    canvas.saveState(); canvas.setStrokeColor(LINHA); canvas.setLineWidth(0.6)
    canvas.line(22*mm, 16*mm, 188*mm, 16*mm)
    canvas.setFont("Helvetica", 8); canvas.setFillColor(MUTED)
    canvas.drawString(22*mm, 11*mm, "geoAG " + TR + " Manual de Operação " + TR + " Passo a Passo do Zero")
    canvas.setFillColor(VERDE_ESC); canvas.setFont("Helvetica-Bold", 8)
    canvas.drawRightString(188*mm, 11*mm, "Página %d" % (doc.page - 1))
    canvas.restoreState()

def capa_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VERDE_ESC); canvas.rect(0, 281*mm, 210*mm, 16*mm, fill=1, stroke=0)
    canvas.setFillColor(LARANJA); canvas.rect(0, 279.5*mm, 210*mm, 1.5*mm, fill=1, stroke=0)
    canvas.setFillColor(VERDE_ESC); canvas.rect(0, 0, 210*mm, 10*mm, fill=1, stroke=0)
    canvas.setFillColor(LARANJA); canvas.rect(0, 10*mm, 210*mm, 1.5*mm, fill=1, stroke=0)
    canvas.restoreState()

doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=22*mm, rightMargin=22*mm,
                      topMargin=20*mm, bottomMargin=20*mm,
                      title="geoAG - Manual de Operacao - Passo a Passo do Zero", author="geoAG")
doc.addPageTemplates([
    PageTemplate(id='capa', frames=[Frame(22*mm, 20*mm, 166*mm, 250*mm, id='capa')], onPage=capa_bg),
    PageTemplate(id='corpo', frames=[Frame(22*mm, 20*mm, 166*mm, 255*mm, id='corpo')], onPage=rodape),
])
doc.build(story)
print("PDF gerado:", OUT)
