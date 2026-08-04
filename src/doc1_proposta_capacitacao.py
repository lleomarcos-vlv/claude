"""
DOCUMENTO 1 — Proposta de capacitação operacional em drones para instituições
de segurança pública e Forças Armadas.
"""

from reportlab.platypus import NextPageTemplate, Spacer, PageBreak, KeepTogether
from reportlab.lib.units import cm

from design import (
    ALERT, CONTENT_W, DocBuilder, DroneMark, FONT, FONT_B, GOLD, GOLD_SOFT,
    INK_SOFT, LINE, NAVY, NumberedCanvas, OK, P, PAGE_H, PAGE_W, S, STEEL,
    Callout, HRule, MARGIN_X, SectionHeader, bullets, campo, checklist_table,
    cover_backdrop, data_table, kv_table, module_table, numbered, toc_block,
    Paragraph, Table, TableStyle, colors, WHITE, MARGIN_BOTTOM,
)
import dados as D

TITULO = "Capacitação Operacional em Aeronaves Não Tripuladas (Drones)"
SUBTITULO = ("Formação, fiscalização e emprego tático para instituições de "
             "segurança pública e Forças Armadas")
CURTO = "Proposta de Capacitação em Drones · Segurança Pública e Defesa"


# ----------------------------------------------------------------- capa ------

def desenhar_capa(canv, doc):
    cover_backdrop(canv)
    canv.saveState()

    x = MARGIN_X
    largura = CONTENT_W

    # marca do drone, alto à direita
    dm = DroneMark(size=96, color=GOLD, lw=1.7, alpha=0.95)
    dm.canv = canv
    canv.saveState()
    canv.translate(PAGE_W - MARGIN_X - 96, PAGE_H - 108)
    dm.draw()
    canv.restoreState()

    # eyebrow
    canv.setFillColor(GOLD)
    canv.setFont(FONT_B, 9.2)
    canv.drawString(x, PAGE_H - 74, "PROPOSTA TÉCNICA DE CAPACITAÇÃO PROFISSIONAL")
    canv.setStrokeColor(GOLD)
    canv.setLineWidth(1.4)
    canv.line(x, PAGE_H - 84, x + 52, PAGE_H - 84)

    # título
    y = PAGE_H - 132
    canv.setFillColor(WHITE)
    canv.setFont(FONT_B, 30)
    for linha in ["CAPACITAÇÃO", "OPERACIONAL EM", "DRONES"]:
        canv.drawString(x, y, linha)
        y -= 34
    canv.setFillColor(GOLD)
    canv.setFont(FONT_B, 13)
    canv.drawString(x, y - 2, "AERONAVES NÃO TRIPULADAS · RBAC Nº 100")

    # subtítulo
    y -= 44
    canv.setFillColor(colors.HexColor("#B9C7D4"))
    canv.setFont(FONT, 11.4)
    for linha in [
        "Formação de operadores, protocolo de abordagem e fiscalização,",
        "e emprego tático do drone na atividade de segurança pública.",
    ]:
        canv.drawString(x, y, linha)
        y -= 16

    # destinatários
    y -= 20
    canv.setFillColor(GOLD)
    canv.setFont(FONT_B, 8.4)
    canv.drawString(x, y, "DIRIGIDO A")
    y -= 15
    canv.setFillColor(colors.HexColor("#D5DEE6"))
    canv.setFont(FONT, 9.6)
    canv.drawString(x, y, "Polícia Militar  ·  Polícia Civil  ·  Polícia Penal  ·  Polícia Científica")
    y -= 14
    canv.drawString(x, y, "Corpo de Bombeiros  ·  Guarda Municipal  ·  Defesa Civil  ·  Forças Armadas")

    # três pilares — ocupam o miolo da capa com informação de venda
    pilares = [
        ("5", "TRILHAS", "de 16 a 40 horas, combináveis"),
        ("5", "FASES", "no protocolo de abordagem"),
        ("1º/1/2027", "", "prazo do exame obrigatório da ANAC"),
    ]
    col_w = largura / 3.0
    py = 420
    for i, (num, palavra, desc) in enumerate(pilares):
        cx = x + i * col_w
        canv.setStrokeColor(GOLD)
        canv.setLineWidth(1.6)
        canv.line(cx, py + 30, cx + 22, py + 30)
        canv.setFillColor(WHITE)
        canv.setFont(FONT_B, 17)
        canv.drawString(cx, py + 8, num)
        if palavra:
            canv.setFillColor(GOLD)
            canv.setFont(FONT_B, 10)
            canv.drawString(cx + canv.stringWidth(num, FONT_B, 17) + 5,
                            py + 8, palavra)
        canv.setFillColor(colors.HexColor("#93A4B4"))
        canv.setFont(FONT, 8.2)
        canv.drawString(cx, py - 8, desc)

    # selo de atualização normativa
    selo_y = PAGE_H * 0.34 + 26
    canv.setFillColor(colors.HexColor("#16324F"))
    canv.roundRect(x, selo_y, largura, 46, 4, stroke=0, fill=1)
    canv.setFillColor(GOLD)
    canv.rect(x, selo_y, 3.5, 46, stroke=0, fill=1)
    canv.setFillColor(WHITE)
    canv.setFont(FONT_B, 9)
    canv.drawString(x + 14, selo_y + 28,
                    "CONTEÚDO ATUALIZADO PARA O MARCO REGULATÓRIO DE 2026")
    canv.setFillColor(colors.HexColor("#A9BAC9"))
    canv.setFont(FONT, 8.3)
    canv.drawString(x + 14, selo_y + 13,
                    "RBAC nº 100 (Resolução ANAC nº 805)  ·  ICA 100-40 e ICA 100-48 (DECEA)  "
                    "·  Portaria MAPA nº 298/2021")

    # bloco inferior — instrutor
    canv.setFillColor(GOLD)
    canv.setFont(FONT_B, 8.4)
    canv.drawString(x, 196, "INSTRUTOR RESPONSÁVEL")
    canv.setFillColor(WHITE)
    canv.setFont(FONT_B, 16)
    canv.drawString(x, 172, D.INSTRUTOR["nome"])
    canv.setFillColor(colors.HexColor("#A9BAC9"))
    canv.setFont(FONT, 9.6)
    canv.drawString(x, 156, D.INSTRUTOR["titulo_profissional"])
    canv.drawString(x, 142, D.INSTRUTOR["especialidades"])

    canv.setStrokeColor(colors.HexColor("#2A4763"))
    canv.setLineWidth(0.8)
    canv.line(x, 118, x + largura, 118)

    # contato (com marca de campo pendente, se for o caso)
    def linha_contato(rotulo, chave):
        val = D.INSTRUTOR.get(chave)
        if val:
            return f"{rotulo}: {val}"
        return f"{rotulo}: ____________________"

    canv.setFillColor(colors.HexColor("#93A4B4"))
    canv.setFont(FONT, 9)
    canv.drawString(x, 98, linha_contato("Telefone", "telefone"))
    canv.drawString(x + largura * 0.34, 98, linha_contato("E-mail", "email"))
    canv.drawString(x, 82, linha_contato("Cidade/UF", "cidade_uf"))

    cd = D.DOCUMENTO.get("cidade_data") or "____________________"
    canv.drawString(x + largura * 0.34, 82, f"Emissão: {cd}")

    canv.setFillColor(colors.HexColor("#6B7D8D"))
    canv.setFont(FONT, 7.6)
    canv.drawString(x, 56, f"Documento técnico-comercial · versão "
                           f"{D.DOCUMENTO.get('versao', '1.0')} · "
                           f"uso institucional")
    canv.restoreState()


# --------------------------------------------------------------- conteúdo ----

def historia():
    st = []
    A = st.append

    # ---------------------------------------------------------- sumário -----
    A(Paragraph("SUMÁRIO", S["H1"]))
    A(HRule(space_after=2, color=GOLD, thickness=1.4, width=48))
    A(Spacer(1, 4))
    A(HRule(space_after=10))
    A(toc_block([
        ("1", "Sumário executivo"),
        ("2", "O momento normativo: o que mudou em 2026"),
        ("3", "O instrutor responsável"),
        ("4", "Por que capacitar: os dois lados do drone na corporação"),
        ("5", "Aplicações operacionais por força"),
        ("6", "Trilhas de formação e matriz curricular"),
        ("7", "Protocolo de abordagem a operador de drone"),
        ("8", "Documentos exigíveis na abordagem — consulta rápida"),
        ("9", "Enquadramentos e encaminhamentos possíveis"),
        ("10", "Metodologia, infraestrutura e logística"),
        ("11", "Certificação emitida ao concluinte"),
        ("12", "Formatos de contratação e investimento"),
        ("13", "Diferenciais desta proposta"),
        ("14", "Próximos passos"),
        ("A", "Anexo A — Ficha de abordagem a operador de drone"),
        ("B", "Anexo B — Checklist de voo institucional"),
        ("C", "Anexo C — Base normativa consultada"),
    ]))
    A(Spacer(1, 18))
    A(Callout(
        "Como ler este documento",
        ["Os campos destacados em <b>dourado</b> — no formato "
         "<font color='#96701A' backColor='#FBF3DF'><b>&nbsp;[ preencher: ... ]&nbsp;</b></font> "
         "— são dados de identificação, credenciais e valores que devem ser "
         "informados pelo instrutor antes da apresentação formal. Nenhum dado "
         "curricular, numérico ou de credenciamento foi presumido: o que não "
         "está preenchido é porque deve ser confirmado na fonte."],
        kind="gold"))
    A(PageBreak())

    # ------------------------------------------------- 1. sumário exec. -----
    A(SectionHeader(1, "Sumário executivo"))
    A(P(
        "Esta proposta apresenta um programa de capacitação em operação, "
        "fiscalização e emprego tático de aeronaves não tripuladas (drones) "
        "desenhado especificamente para instituições de segurança pública e "
        "Forças Armadas. O programa cobre as duas frentes em que a corporação "
        "encontra o drone no dia a dia: <b>como operadora</b>, empregando a "
        "aeronave em suas missões, e <b>como autoridade</b>, abordando e "
        "fiscalizando terceiros que operam drones em via pública, sobre "
        "eventos, sobre unidades prisionais ou em áreas restritas."))
    A(P(
        "O conteúdo foi reescrito para o marco regulatório que passou a "
        "vigorar em 2026 — o <b>RBAC nº 100</b> da ANAC, que substituiu "
        "integralmente o antigo RBAC-E nº 94, e a <b>nova edição da ICA "
        "100-40</b> do DECEA. Esse ponto é decisivo: a maior parte do material "
        "de treinamento disponível no mercado, e praticamente todo o "
        "conhecimento consolidado nas corporações até 2025, refere-se a uma "
        "norma que <b>não está mais em vigor</b>. Classes 1, 2 e 3 deixaram de "
        "existir como critério; entrou em seu lugar um modelo baseado em risco "
        "operacional, com as categorias Aberta, Específica e Certificada."))
    A(Spacer(1, 4))
    A(Callout(
        "Há um prazo, e ele é curto",
        ["A aprovação em <b>exame teórico de conhecimentos da ANAC</b> passou a "
         "ser requisito para todo piloto remoto de aeronave não isenta — acima "
         "de 250 g — em <b>qualquer</b> categoria de operação. A Resolução ANAC "
         "nº 805 dispensou o cumprimento dessa exigência até "
         "<b>31 de dezembro de 2026</b>; a obrigatoriedade passa a valer em "
         "<b>1º de janeiro de 2027</b>.",
         "Na prática: os efetivos que hoje operam drones institucionais têm uma "
         "janela definida para serem formados e aprovados. Capacitação "
         "realizada dentro de 2026 chega ao prazo com folga; deixada para 2027, "
         "encontra a corporação com pilotos já em situação irregular."],
        kind="alert"))
    A(Spacer(1, 6))
    A(Paragraph("O que a corporação recebe", S["H2"]))
    A(Spacer(1, 1))
    for b in bullets([
        "<b>Efetivo habilitado e documentado</b> — operadores preparados para o "
        "exame teórico da ANAC e para conduzir a operação institucional dentro "
        "da norma, com registro individual de aproveitamento.",
        "<b>Protocolo de abordagem pronto para uso</b> — sequência operacional "
        "padronizada para abordar quem está pilotando um drone, verificar "
        "documentação e decidir o encaminhamento, com ficha de campo "
        "reproduzível (Anexo A).",
        "<b>Segurança jurídica</b> — clareza sobre o que é infração "
        "administrativa (competência da ANAC, DECEA ou ANATEL) e o que é fato "
        "criminal (competência da autoridade policial), reduzindo tanto a "
        "omissão quanto o excesso na atuação.",
        "<b>Autonomia futura</b> — trilha de formação de instrutores internos, "
        "para que a corporação passe a multiplicar o treinamento com seu "
        "próprio quadro.",
        "<b>Certificação individual</b> — certificado de capacitação "
        "profissional para cada concluinte, com conteúdo programático e carga "
        "horária no verso, apto a averbação funcional (seção 11).",
    ]):
        A(b)
    A(Spacer(1, 24))

    # ------------------------------------------------ 2. momento normativo --
    A(SectionHeader(
        2, "O momento normativo: o que mudou em 2026",
        "Três alterações simultâneas tornaram obsoleto o treinamento anterior."))
    A(P(
        "Entre março e julho de 2026 o Brasil substituiu, ao mesmo tempo, a "
        "norma da autoridade de aviação civil e a norma de acesso ao espaço "
        "aéreo. Quem foi treinado sob o regime anterior aprendeu um vocabulário "
        "— \"drone classe 3\", \"cadastro por peso\" — que já não descreve as "
        "obrigações vigentes."))
    A(Spacer(1, 5))

    A(Callout(
        "1 · ANAC — RBAC nº 100 substitui o RBAC-E nº 94",
        ["Aprovado pela <b>Resolução ANAC nº 805</b>, o RBAC nº 100 entrou em "
         "vigor em <b>16 de junho de 2026</b> e substituiu integralmente o "
         "RBAC-E nº 94, que vigorava desde 2017. Sai o modelo prescritivo "
         "baseado em classes de peso; entra a classificação por "
         "<b>risco operacional</b>, em três categorias: Aberta, Específica e "
         "Certificada."],
        kind="info"))
    A(Spacer(1, 5))
    A(Callout(
        "2 · DECEA — nova edição da ICA 100-40",
        ["Oficializada pela <b>Portaria DECEA nº 2094/DNOR8, de 18 de março de "
         "2026</b> (publicada no BCA nº 058, de 30 de março de 2026), a nova "
         "ICA 100-40 entrou em vigor em <b>1º de julho de 2026</b> e passou a "
         "concentrar em documento único todas as regras de acesso ao espaço "
         "aéreo por aeronaves não tripuladas. A <b>ICA 100-48</b> entrou em "
         "vigor na mesma data.",
         "Atenção a um ponto que gera confusão em campo: a dispensa de "
         "requisitos da ANAC para aeronaves de até 250 g <b>não</b> se estende "
         "automaticamente às exigências do DECEA. As duas normas têm recortes "
         "próprios, e a solicitação de acesso ao espaço aéreo segue lógica "
         "própria — verificar sempre a versão vigente da ICA antes de orientar "
         "um operador em abordagem."],
        kind="info"))
    A(Spacer(1, 5))
    A(Callout(
        "3 · ANAC — exame teórico obrigatório a partir de 1º/1/2027",
        ["Todo piloto remoto de aeronave não isenta (acima de 250 g) deverá ter "
         "sido aprovado em exame teórico da ANAC, em qualquer categoria de "
         "operação. A avaliação está disponível gratuitamente no portal de "
         "capacitação da Agência e é composta de <b>20 questões</b> sobre "
         "fundamentos do RBAC nº 100, espaço aéreo, risco e operação. "
         "A Resolução nº 805 dispensa a exigência até 31/12/2026."],
        kind="alert"))
    A(Spacer(1, 10))

    A(Paragraph("Quadro comparativo — regime anterior e regime vigente", S["H2"]))
    A(data_table(
        [[P("Aspecto", "Th"), P("RBAC-E nº 94 (até 2026)", "Th"),
          P("RBAC nº 100 (vigente)", "Th")],
         [P("Lógica da norma", "TdB"),
          P("Prescritiva, organizada por peso máximo de decolagem.", "TdSm"),
          P("Baseada em risco operacional da missão.", "TdSm")],
         [P("Classificação", "TdB"),
          P("Classes 1, 2 e 3, definidas por faixa de peso.", "TdSm"),
          P("Categorias Aberta, Específica e Certificada.", "TdSm")],
         [P("Operação de baixo risco", "TdB"),
          P("Classe 3 em VLOS até 400 pés.", "TdSm"),
          P("Categoria <b>Aberta</b>: até 25 kg, VLOS ou EVLOS, até 120 m "
            "(400 pés) AGL, afastada de terceiros não envolvidos. Dispensa "
            "autorização operacional prévia da ANAC.", "TdSm")],
         [P("Operação de risco médio", "TdB"),
          P("Autorização caso a caso.", "TdSm"),
          P("Categoria <b>Específica</b>: exige avaliação de risco pela "
            "metodologia <b>SORA</b>, ou enquadramento em Cenário Padrão (STS) "
            "com declaração de conformidade. Gera o <b>COE — Cadastro de "
            "Operador de UA</b>.", "TdSm")],
         [P("Habilitação do piloto", "TdB"),
          P("Licença e habilitação exigidas apenas para classes 1 e 2, ou "
            "classe 3 acima de 400 pés.", "TdSm"),
          P("<b>Exame teórico da ANAC para todo piloto de UA acima de 250 g</b>, "
            "em qualquer categoria — obrigatório a partir de 1º/1/2027.", "TdSm")],
         [P("Seguro", "TdB"),
          P("Exigido conforme o caso.", "TdSm"),
          P("Seguro de danos a terceiros exigido pela seção <b>100.37</b>, com "
            "exceções previstas no regulamento — entre elas <b>entes "
            "estatais</b> e certas operações agrícolas em área não habitada.",
            "TdSm")],
         [P("Segurança pública", "TdB"),
          P("Sem cenário padrão específico.", "TdSm"),
          P("Regras customizadas para polícia, bombeiros e defesa civil, com "
            "previsão de Cenário Padrão próprio para órgãos controlados pelo "
            "Estado (Instrução Suplementar 100.103-002A).", "TdSm")],
         ],
        [CONTENT_W * 0.17, CONTENT_W * 0.375, CONTENT_W * 0.455]))
    A(Spacer(1, 8))
    A(Callout(
        "O que isso significa para a corporação",
        ["A existência de um <b>Cenário Padrão para órgãos de segurança "
         "pública</b> é a principal boa notícia do novo regulamento. Operações "
         "que se enquadram em um STS dispensam a análise SORA completa: basta "
         "declarar conformidade com os requisitos do cenário e obter "
         "autorização por via muito mais rápida. Isso viabiliza emprego "
         "operacional em situações emergenciais — mas só funciona se houver, "
         "no efetivo, quem saiba enquadrar a missão corretamente. É exatamente "
         "esse conhecimento que a capacitação entrega.",
         "Registre-se, porém, um alerta que o próprio regulamento faz: a "
         "dispensa de uma exigência da ANAC <b>não</b> dispensa as regras do "
         "DECEA, da ANATEL, do Ministério da Defesa, do Ministério da "
         "Agricultura e Pecuária ou de outros entes. Conformidade aqui é "
         "sempre multi-órgão."],
        kind="ok"))
    A(Spacer(1, 24))

    # -------------------------------------------------------- 3. instrutor --
    A(SectionHeader(3, "O instrutor responsável"))
    A(P(
        f"<b>{D.INSTRUTOR['nome']}</b> atua na formação de operadores de "
        "aeronaves não tripuladas com especialização em drones agrícolas — "
        "segmento que concentra as operações civis de maior exigência técnica, "
        "por envolver voo em baixa altura, carga útil variável, aplicação de "
        "insumos e responsabilidade agronômica — e em aplicação tática do "
        "equipamento. Essa origem importa para o público desta proposta: o "
        "drone agrícola opera sob restrições de precisão, peso e segurança "
        "muito próximas das que uma guarnição encontra em missão real."))
    A(Spacer(1, 6))
    A(Paragraph("Identificação e contato", S["H2"]))
    A(kv_table([
        ("Nome completo", D.INSTRUTOR["nome"]),
        ("Atuação", D.INSTRUTOR["titulo_profissional"]),
        ("Especialidades", D.INSTRUTOR["especialidades"]),
        ("Telefone", D.ins("telefone")),
        ("E-mail", D.ins("email")),
        ("Cidade / UF", D.ins("cidade_uf")),
        ("Site / redes", D.ins("site_ou_redes")),
        ("CPF", D.ins("cpf")),
        ("Razão social", D.ins("razao_social", "preencher se houver CNPJ")),
        ("CNPJ", D.ins("cnpj", "preencher se houver CNPJ")),
        ("CNAE de atividade", D.ins("cnae")),
    ], label_w=0.30))
    A(Spacer(1, 10))

    A(Paragraph("Credenciais técnicas", S["H2"]))
    A(P(
        "O quadro abaixo é o núcleo de credibilidade da proposta e por isso "
        "nada nele foi presumido. Cada linha deve ser preenchida apenas se "
        "houver documento comprobatório correspondente, que acompanhará a "
        "proposta em anexo.", "CorpoSm"))
    A(Spacer(1, 3))
    A(kv_table([
        ("Cadastro de operador / aeronave (SISANT)", D.ins("cadastro_sisant")),
        ("Exame teórico ANAC (RBAC nº 100)", D.ins("exame_teorico_anac")),
        ("Formação acadêmica", D.ins("formacao_academica")),
        ("Registro em conselho profissional", D.ins("registro_conselho",
                                                    "preencher se aplicável")),
        ("Curso de Aplicação Aeroagrícola Remota (CAAR)", D.ins("curso_caar")),
        ("Cadastro no MAPA (SIPEAGRO)", D.ins("cadastro_mapa",
                                              "preencher se aplicável")),
        ("Outras certificações", D.ins("outras_certificacoes")),
    ], label_w=0.42))
    A(Spacer(1, 10))

    A(Paragraph("Experiência e recursos didáticos", S["H2"]))
    A(kv_table([
        ("Tempo de atuação", D.ins("anos_experiencia")),
        ("Horas de voo registradas", D.ins("horas_de_voo")),
        ("Turmas conduzidas", D.ins("turmas_formadas")),
        ("Profissionais formados", D.ins("alunos_formados")),
        ("Instituições atendidas", D.ins("instituicoes_atendidas")),
        ("Frota disponibilizada para as aulas", D.ins("frota_disponivel")),
    ], label_w=0.42))
    A(Spacer(1, 8))
    A(P(
        "Documentação comprobatória de todos os itens acima — certificados, "
        "cadastros, apólices, contratos e registros de voo — é fornecida em "
        "anexo mediante solicitação da corporação, inclusive para instrução de "
        "processo administrativo de contratação.", "Nota"))
    A(Spacer(1, 24))

    # ----------------------------------------------------- 4. por que ------
    A(SectionHeader(
        4, "Por que capacitar: os dois lados do drone na corporação"))
    A(P(
        "Toda instituição de segurança pública hoje se relaciona com o drone "
        "por duas vias distintas, que exigem competências diferentes e são "
        "frequentemente confundidas no planejamento de treinamento."))
    A(Spacer(1, 4))
    A(data_table(
        [[P("", "Th"), P("A corporação como OPERADORA", "Th"),
          P("A corporação como AUTORIDADE", "Th")],
         [P("Situação", "TdB"),
          P("A instituição possui e emprega drones em suas próprias missões.",
            "TdSm"),
          P("Um terceiro está pilotando um drone e a guarnição precisa "
            "verificar a regularidade.", "TdSm")],
         [P("Competência necessária", "TdB"),
          P("Pilotagem segura, enquadramento da missão na categoria correta, "
            "cadastro, autorização de espaço aéreo, registro da operação e "
            "preservação da prova obtida.", "TdSm"),
          P("Abordagem segura, conhecimento dos documentos exigíveis, "
            "distinção entre infração administrativa e crime, encaminhamento "
            "correto e limites da atuação.", "TdSm")],
         [P("Risco de não capacitar", "TdB"),
          P("Acidente com dano a terceiro; autuação da própria corporação; "
            "prova obtida por meio irregular e questionada em juízo; "
            "responsabilização do comandante da operação.", "TdSm"),
          P("Omissão diante de fato grave; ou o oposto — apreensão sem base "
            "legal, alegação de abuso de autoridade e responsabilização "
            "pessoal do agente.", "TdSm")],
         [P("Trilha aplicável", "TdB"),
          P("Trilhas 1, 2 e 5 (seção 6).", "TdSm"),
          P("Trilha 3 (seção 6) e Protocolo da seção 7.", "TdSm")],
         ],
        [CONTENT_W * 0.16, CONTENT_W * 0.42, CONTENT_W * 0.42]))
    A(Spacer(1, 10))

    A(Paragraph("Os quatro riscos concretos de manter o efetivo sem formação",
                S["H2"]))
    for b in numbered([
        "<b>Prova contaminada.</b> Imagem aérea produzida em operação "
        "irregular — sem autorização de espaço aéreo, fora dos limites da "
        "categoria, sem registro adequado — tem sua licitude questionada. O "
        "custo não aparece no dia do voo, e sim na audiência, meses depois.",
        "<b>Autuação da corporação.</b> As Resoluções ANAC nº 761 e nº 762, de "
        "dezembro de 2024, vigentes desde 1º de janeiro de 2026, substituíram "
        "as tabelas de infrações anteriores e dimensionam a sanção conforme o "
        "grupo do regulado. Vale para toda a regulação federal de aviação "
        "civil, drones incluídos. Cabe registrar ainda que cadastro e etiqueta "
        "de identificação visível são obrigações <b>distintas</b>: a ausência "
        "das duas pode gerar autuações separadas e cumulativas.",
        "<b>Acidente evitável.</b> Perda de enlace, falha de bateria, vento "
        "acima do limite do equipamento e sobrevoo de pessoas não envolvidas "
        "são causas recorrentes e todas endereçáveis por treinamento e "
        "checklist. Drone em queda sobre público é lesão corporal, não avaria "
        "de material.",
        "<b>Abordagem malfeita.</b> Sem parâmetro, o agente oscila entre dois "
        "erros opostos — liberar quem cometia fato criminal ou apreender "
        "equipamento sem base legal. O segundo caso costuma retornar como "
        "representação por abuso de autoridade e ação de indenização.",
    ]):
        A(b)
    A(Spacer(1, 24))

    # ------------------------------------------------------ 5. aplicações ---
    A(SectionHeader(5, "Aplicações operacionais por força",
                    "O treinamento é ajustado ao emprego real de cada instituição."))
    A(data_table(
        [[P("Instituição", "Th"), P("Empregos operacionais trabalhados no curso", "Th")],
         [P("Polícia Militar", "TdB"),
          P("Patrulhamento aéreo preventivo; apoio a cerco e "
            "acompanhamento de fuga; policiamento de eventos e grandes "
            "públicos; gerenciamento de crise e distúrbios civis; localização "
            "de pessoa desaparecida; varredura prévia de área de risco antes "
            "da entrada da guarnição; leitura de terreno em ocorrência em "
            "área de mata ou comunidade; documentação de local de crime até a "
            "chegada da perícia.", "TdSm")],
         [P("Polícia Civil e Polícia Científica", "TdB"),
          P("Registro e documentação de local de crime com vista aérea "
            "métrica; reconstituição e croqui; apoio a cumprimento de mandado "
            "de busca com reconhecimento prévio do imóvel e das rotas de "
            "fuga; levantamento de áreas de interesse em investigação; "
            "mapeamento de sítios de desova e áreas de difícil acesso; "
            "cadeia de custódia da mídia produzida.", "TdSm")],
         [P("Polícia Penal", "TdB"),
          P("Vigilância de perímetro e muralhas; detecção de arremessos e "
            "de entregas por drone; inspeção de telhados, coberturas e áreas "
            "internas de difícil acesso; reconhecimento pós-motim; apoio a "
            "escolta e a operações de revista geral; noções de resposta a "
            "drone hostil sobre a unidade.", "TdSm")],
         [P("Corpo de Bombeiros e Defesa Civil", "TdB"),
          P("Busca e salvamento em mata, água e área urbana; combate a "
            "incêndio florestal com leitura de frente de fogo; reconhecimento "
            "de estrutura colapsada antes da entrada de equipe; enchentes e "
            "alagamentos; mapeamento de encosta e área de risco geológico; "
            "avaliação de dano pós-desastre; emprego de sensor térmico.",
            "TdSm")],
         [P("Guarda Municipal", "TdB"),
          P("Fiscalização de posturas e uso do solo; proteção do patrimônio "
            "público; apoio à fiscalização ambiental e a denúncias de "
            "descarte irregular; monitoramento de trânsito e de eventos; "
            "vigilância de praças, parques e equipamentos municipais.",
            "TdSm")],
         [P("Forças Armadas", "TdB"),
          P("Reconhecimento e vigilância de área; apoio a operações de "
            "Garantia da Lei e da Ordem; patrulhamento de faixa de fronteira; "
            "levantamento topográfico e planialtimétrico de área de "
            "instrução; apoio a adestramento e a exercícios; avaliação de "
            "dano; emprego em apoio à Defesa Civil.", "TdSm")],
         ],
        [CONTENT_W * 0.235, CONTENT_W * 0.765]))
    A(Spacer(1, 8))
    A(P(
        "A grade é montada por força e por perfil de efetivo. Uma turma de "
        "Polícia Penal recebe mais horas em perímetro prisional e detecção de "
        "arremesso; uma turma de Bombeiros, mais horas em sensor térmico e "
        "busca; uma turma de Guarda Municipal, mais horas em fiscalização e "
        "prova administrativa. O núcleo normativo e de segurança de voo é "
        "comum a todas.", "Nota"))
    A(Spacer(1, 24))

    # ------------------------------------------------- 6. matriz curricular -
    A(SectionHeader(6, "Trilhas de formação e matriz curricular",
                    "Cinco trilhas combináveis, de 16 a 40 horas."))
    A(P(
        "As trilhas podem ser contratadas isoladamente ou combinadas em um "
        "programa progressivo. A recomendação para uma corporação que está "
        "estruturando sua capacidade aérea é a sequência "
        "<b>Trilha 1 → Trilha 2 → Trilha 5</b>, formando primeiro os "
        "operadores e, ao final, os multiplicadores internos. Para "
        "corporações que já operam e precisam apenas padronizar a "
        "fiscalização, a <b>Trilha 3</b> é autônoma."))
    A(Spacer(1, 8))

    A(Paragraph("Trilha 1 — Fundamentos e operação segura de UA  ·  16 horas",
                S["H2"]))
    A(P("Base obrigatória para qualquer efetivo que vá tocar no equipamento. "
        "Alinhada ao conteúdo do exame teórico da ANAC.", "CorpoSm"))
    A(module_table([
        ("1.1 Marco regulatório",
         "Estrutura da regulação brasileira: ANAC, DECEA, ANATEL e demais "
         "órgãos. RBAC nº 100 e a lógica de risco. Categorias Aberta, "
         "Específica e Certificada. O que mudou em relação ao RBAC-E nº 94. "
         "Aeronaves isentas e o limite de 250 g.", "4"),
        ("1.2 Espaço aéreo",
         "Estrutura do espaço aéreo brasileiro. ICA 100-40 e ICA 100-48. "
         "Solicitação de acesso via SARPAS e sua relação com o cadastro. "
         "Limite de 120 m (400 pés) AGL. Áreas restritas, proibidas e "
         "perigosas. Proximidade de aeródromos e heliportos.", "3"),
        ("1.3 Cadastro e documentação",
         "Cadastro de aeronave e de operador; validade de 24 meses. Etiqueta "
         "de identificação. Seguro de danos a terceiros (seção 100.37) e as "
         "exceções aplicáveis a entes estatais. Homologação ANATEL do drone e "
         "do controle. Documentação que deve acompanhar a operação.", "3"),
        ("1.4 Segurança de voo",
         "Meteorologia aplicada: vento, rajada, umidade, temperatura. "
         "Baterias de lítio: carga, transporte, descarte e resposta a "
         "incêndio. Perda de enlace e retorno automático. Falhas mais comuns "
         "e ações de contingência. Checklist pré, durante e pós-voo.", "3"),
        ("1.5 Prática de pilotagem",
         "Comandos e modos de voo. Decolagem e pouso. Circuitos, "
         "estacionário e órbita. Voo com referência visual. Simulação de "
         "emergência: perda de GPS, bateria crítica e pouso forçado.", "3"),
    ]))
    A(Spacer(1, 12))

    A(Paragraph("Trilha 2 — Emprego tático em segurança pública  ·  40 horas",
                S["H2"]))
    A(P("Pressupõe a Trilha 1 concluída. Voltada à guarnição que vai empregar "
        "o drone em ocorrência real.", "CorpoSm"))
    A(module_table([
        ("2.1 Planejamento de missão",
         "Definição de objetivo, área e janela de operação. Enquadramento na "
         "categoria correta. Cenários Padrão (STS) para órgãos de segurança "
         "pública e a Instrução Suplementar 100.103-002A. Quando é necessária "
         "avaliação de risco pela metodologia SORA. Análise de risco "
         "simplificada para emprego emergencial.", "6"),
        ("2.2 Operação em ambiente urbano",
         "Voo entre edificações; efeitos de turbulência e de reflexão de "
         "sinal. Interferência eletromagnética e perda de enlace em área "
         "densa. Sobrevoo de pessoas e de via pública: limites e mitigações. "
         "Posicionamento da estação de pilotagem e segurança do operador em "
         "ocorrência.", "6"),
        ("2.3 Sensores e produto de imagem",
         "Câmera visual, zoom e suas limitações probatórias. Sensor térmico: "
         "leitura, interpretação e erros comuns. Iluminador e operação "
         "noturna. Alto-falante em gerenciamento de crise. Fotogrametria "
         "básica para croqui e medição.", "6"),
        ("2.4 Emprego em ocorrências",
         "Cerco e acompanhamento; busca de pessoa; varredura prévia de área "
         "de risco; apoio a entrada tática; policiamento de evento; "
         "gerenciamento de crise; perímetro prisional. Coordenação por rádio "
         "entre piloto, observador e comando da operação.", "8"),
        ("2.5 Prova, imagem e responsabilidade",
         "Cadeia de custódia da mídia: coleta, hash, armazenamento e "
         "encaminhamento. Registro da operação e livro de voo. Tratamento de "
         "imagem de terceiros e o regime aplicável à atividade de segurança "
         "pública. Limites constitucionais: intimidade e inviolabilidade do "
         "domicílio.", "6"),
        ("2.6 Exercício prático integrado",
         "Três cenários encenados de ponta a ponta, com briefing, execução, "
         "produção de mídia e debriefing: busca de pessoa em área de mata; "
         "apoio a cerco em área urbana; reconhecimento de perímetro.", "8"),
    ]))
    A(Spacer(1, 24))

    A(Paragraph("Trilha 3 — Fiscalização e abordagem a operador de drone  ·  "
                "16 horas", S["H2"]))
    A(P("Trilha autônoma, dirigida a todo o efetivo de rua — não apenas aos "
        "pilotos. É a trilha de maior alcance por policial capacitado.",
        "CorpoSm"))
    A(module_table([
        ("3.1 O que a norma exige do operador civil",
         "Leitura prática do RBAC nº 100 na perspectiva de quem fiscaliza. "
         "Documentos exigíveis e a quem cada um pertence. Aeronave isenta e "
         "os cuidados com o limite de 250 g. Diferença entre operação "
         "recreativa e não recreativa.", "3"),
        ("3.2 Competências e limites",
         "O que é competência da ANAC, do DECEA e da ANATEL, e o que é "
         "atribuição da autoridade policial. Quando a conduta é apenas "
         "infração administrativa e quando há fato criminal. Fundamentos e "
         "limites da abordagem e da busca pessoal. Vedações da lei de abuso "
         "de autoridade.", "4"),
        ("3.3 Protocolo de abordagem",
         "As cinco fases do protocolo da seção 7, treinadas passo a passo. "
         "Segurança do agente e de terceiros durante a abordagem. Como "
         "solicitar o pouso sem provocar queda. Preenchimento da ficha de "
         "abordagem (Anexo A).", "4"),
        ("3.4 Apreensão e encaminhamento",
         "Requisitos para apreensão do equipamento e o risco da apreensão sem "
         "base. Lavratura do boletim de ocorrência com os elementos técnicos "
         "corretos. Encaminhamento à ANAC, ao DECEA e à Polícia Civil. "
         "Preservação do equipamento e da mídia embarcada.", "3"),
        ("3.5 Casos práticos",
         "Simulação de abordagens em quatro cenários: operador regular; "
         "operador irregular de boa-fé; sobrevoo de residência com denúncia "
         "de vizinho; drone sobre unidade prisional.", "2"),
    ]))
    A(Spacer(1, 12))

    A(Paragraph("Trilha 4 — Aplicação aeroagrícola remota  ·  28 horas",
                S["H2"]))
    A(P("Trilha de especialização. Interessa a batalhões e companhias de "
        "policiamento ambiental e rural, à fiscalização agropecuária e a "
        "unidades militares com atividade agrícola. Estruturada segundo o "
        "conteúdo mínimo do <b>CAAR — Curso de Aplicação Aeroagrícola "
        "Remota</b>, previsto na Portaria MAPA nº 298/2021.", "CorpoSm"))
    A(module_table([
        ("4.1 Aeronaves remotamente pilotadas agrícolas",
         "Características e categorias das ARP agrícolas. Sistemas de "
         "pulverização e de distribuição de sólidos. Bicos, bombas e "
         "calibração. Autonomia, carga útil e centro de gravidade.", "6"),
        ("4.2 Legislação e boas práticas",
         "Portaria MAPA nº 298/2021 e o registro do operador no SIPEAGRO. "
         "Legislação de agrotóxicos e receituário. Responsabilidade técnica. "
         "Interface com o RBAC nº 100 e com a ICA 100-40. Órgãos estaduais de "
         "defesa agropecuária e ambiental.", "6"),
        ("4.3 Pragas, doenças e tecnologia de aplicação",
         "Alvo biológico e momento da aplicação. Tamanho de gota, volume de "
         "calda e cobertura. Deriva: causas, medição e mitigação. Condições "
         "meteorológicas limitantes. Tríplice lavagem e destinação de "
         "embalagem.", "8"),
        ("4.4 Planejamento operacional e segurança",
         "Planejamento de faixas e sobreposição. Delimitação de área e faixa "
         "de segurança. Equipamento de proteção individual. Contaminação, "
         "primeiros socorros e resposta a incidente. Registro da aplicação.",
         "6"),
        ("4.5 Avaliação final",
         "Prova teórica de aproveitamento sobre o conteúdo da trilha.", "2"),
    ]))
    A(Spacer(1, 6))
    A(Callout(
        "Observação importante sobre o CAAR",
        ["Esta trilha é <b>estruturada conforme o conteúdo mínimo</b> do CAAR, "
         "mas a emissão de certificado de CAAR válido para fins de registro no "
         "MAPA depende de a entidade de ensino estar <b>cadastrada no "
         "Ministério</b> e de <b>homologação de cada turma</b>. Enquanto esse "
         "cadastro não estiver formalizado, a trilha deve ser oferecida e "
         "descrita como capacitação técnica — não como CAAR. O segundo "
         "documento desta entrega detalha o caminho para obter o cadastro."],
        kind="alert"))
    A(Spacer(1, 24))

    A(Paragraph("Trilha 5 — Formação de instrutores internos  ·  24 horas",
                S["H2"]))
    A(P("Para a corporação que quer deixar de depender de contratação externa "
        "e multiplicar o treinamento com o próprio quadro.", "CorpoSm"))
    A(module_table([
        ("5.1 Didática aplicada",
         "Planejamento de aula e de exercício prático. Condução de briefing e "
         "debriefing. Avaliação de aluno e critérios objetivos de "
         "aproveitamento. Gestão de turma em área de voo.", "6"),
        ("5.2 Domínio normativo aprofundado",
         "Leitura direta do RBAC nº 100 e da ICA 100-40. Acompanhamento de "
         "alterações normativas e onde consultar a versão vigente. "
         "Enquadramento de missões atípicas.", "6"),
        ("5.3 Segurança de instrução",
         "Gestão de risco na área de voo com aluno em comando. Delimitação e "
         "sinalização. Protocolo de assunção de comando. Registro de "
         "incidente de instrução.", "6"),
        ("5.4 Estágio supervisionado",
         "Conduzir módulo de aula sob supervisão do instrutor responsável, "
         "com avaliação e devolutiva estruturada.", "6"),
    ]))
    A(Spacer(1, 10))
    A(Paragraph("Resumo das trilhas", S["H2"]))
    A(data_table(
        [[P("Trilha", "Th"), P("Público", "Th"), P("Pré-requisito", "Th"),
          P("C.H.", "Th")],
         [P("1 · Fundamentos e operação segura", "TdB"),
          P("Todo efetivo que vá operar", "TdSm"), P("—", "TdSm"),
          P("16h", "TdC")],
         [P("2 · Emprego tático", "TdB"),
          P("Guarnição operacional e pilotos", "TdSm"), P("Trilha 1", "TdSm"),
          P("40h", "TdC")],
         [P("3 · Fiscalização e abordagem", "TdB"),
          P("Todo o efetivo de rua", "TdSm"), P("—", "TdSm"), P("16h", "TdC")],
         [P("4 · Aplicação aeroagrícola remota", "TdB"),
          P("Policiamento ambiental e rural; fiscalização", "TdSm"),
          P("Trilha 1", "TdSm"), P("28h", "TdC")],
         [P("5 · Formação de instrutores", "TdB"),
          P("Quadro designado para multiplicar", "TdSm"),
          P("Trilhas 1 e 2", "TdSm"), P("24h", "TdC")],
         ],
        [CONTENT_W * 0.32, CONTENT_W * 0.34, CONTENT_W * 0.22,
         CONTENT_W * 0.12],
        align=[("ALIGN", (3, 1), (3, -1), "CENTER")]))
    A(Spacer(1, 24))

    # -------------------------------------------------------- 7. protocolo --
    A(SectionHeader(
        7, "Protocolo de abordagem a operador de drone",
        "Sequência operacional em cinco fases, treinada na Trilha 3."))
    A(P(
        "Este protocolo é o núcleo prático da capacitação e o item que as "
        "corporações mais têm demandado, porque hoje não existe padronização: "
        "cada guarnição improvisa. A sequência abaixo foi construída para ser "
        "executável por qualquer policial de rua, sem conhecimento técnico "
        "prévio de aviação, e para produzir dois resultados — decisão correta "
        "no local e documentação aproveitável depois."))
    A(Spacer(1, 6))
    A(Callout(
        "Princípio que organiza todo o protocolo",
        ["<b>Voar drone não é ilícito.</b> A regra é a licitude; a exceção é a "
         "irregularidade. A abordagem serve para <b>verificar</b>, não para "
         "presumir infração. E a maioria absoluta das irregularidades "
         "encontradas em campo é <b>administrativa</b> — cadastro vencido, "
         "falta de autorização, ausência de etiqueta — cuja competência "
         "sancionadora é da ANAC ou do DECEA, e <b>não</b> da autoridade "
         "policial. O papel da guarnição nesses casos é registrar bem e "
         "encaminhar, não punir."],
        kind="gold"))
    A(Spacer(1, 10))

    A(Paragraph("Fase 1 — Observação e enquadramento (antes de abordar)",
                S["H3"]))
    A(P("Antes de se apresentar, a guarnição colhe os elementos que vão "
        "orientar toda a abordagem. Trinta segundos de observação evitam a "
        "maior parte dos erros.", "CorpoSm"))
    for b in bullets([
        "<b>Onde está o drone.</b> Altura aparente, distância do operador, e "
        "sobretudo <b>o que há embaixo</b>: pessoas, via movimentada, "
        "residências, aeródromo próximo, unidade prisional, presídio, "
        "instalação militar ou área restrita.",
        "<b>Quem opera.</b> Localizar o piloto e verificar se há observador. "
        "Confirmar se o piloto mantém o drone em linha de visada.",
        "<b>Contexto.</b> Há evento, obra, filmagem, atividade agrícola, "
        "levantamento técnico? Há denúncia prévia que motivou o deslocamento?",
        "<b>Risco imediato.</b> Existe perigo concreto e atual a pessoas ou a "
        "aeronave tripulada? Se sim, a prioridade deixa de ser documental e "
        "passa a ser a <b>cessação do risco</b>.",
    ], style="CorpoSm"):
        A(b)
    A(Spacer(1, 8))

    A(Paragraph("Fase 2 — Aproximação e solicitação de pouso", S["H3"]))
    A(Callout(
        "Segurança primeiro: nunca interrompa o voo bruscamente",
        ["Não toque no drone em voo, não tente agarrá-lo, não obstrua o "
         "controle e não determine o desligamento imediato dos motores. "
         "Qualquer dessas ações provoca <b>queda</b> — e a queda de uma "
         "aeronave de vários quilos sobre pessoas produz lesão corporal, com "
         "responsabilidade recaindo sobre quem provocou a interrupção.",
         "A ordem correta é: <b>identifique-se, determine ao operador que "
         "execute o pouso em local seguro e aguarde o pouso concluído.</b> "
         "Somente com a aeronave no solo e os motores parados a verificação "
         "documental começa."],
        kind="alert"))
    A(Spacer(1, 5))
    for b in numbered([
        "Identificação da guarnição e informação objetiva do motivo da "
        "abordagem (rotina, denúncia, área restrita).",
        "Determinação para que o <b>próprio operador</b> pouse a aeronave em "
        "local seguro, afastado de pessoas.",
        "Aguardo do pouso e da parada completa dos rotores. Só então "
        "solicitar o afastamento do operador do equipamento, se necessário.",
        "Verificação de que não há terceiro em risco e que a via está "
        "liberada.",
    ], style="CorpoSm"):
        A(b)
    A(Spacer(1, 8))

    A(Paragraph("Fase 3 — Verificação documental", S["H3"]))
    A(P("Solicitar, na ordem, os documentos do quadro da seção 8. O documento "
        "primário é a <b>certidão de cadastro (SISANT)</b> — dela decorre a "
        "identificação da aeronave e do responsável legal. Boa parte da "
        "documentação hoje é apresentada em tela de celular, o que é "
        "aceitável; o que importa é a conferência dos dados, não o suporte.",
        "CorpoSm"))
    A(Spacer(1, 3))
    for b in bullets([
        "<b>Confira a correspondência.</b> O número da etiqueta afixada na "
        "aeronave deve corresponder ao número do cadastro apresentado. "
        "Divergência é indício relevante.",
        "<b>Confira a validade.</b> O cadastro de aeronave tem validade de "
        "<b>24 meses</b>. Cadastro vencido é irregularidade.",
        "<b>Confira o responsável.</b> O cadastro vincula a aeronave a uma "
        "pessoa física ou jurídica responsável. Se quem opera não é o "
        "responsável, isso não é por si irregular, mas deve constar do "
        "registro.",
        "<b>Confira a autorização de espaço aéreo.</b> A solicitação é feita "
        "ao DECEA e o operador deve apresentar o protocolo ou a autorização "
        "correspondente à operação em curso — mesma data, mesmo local, mesma "
        "aeronave.",
        "<b>Registre o que não for apresentado.</b> A ausência de um documento "
        "é o fato a documentar; a valoração da infração cabe ao órgão "
        "competente.",
    ], style="CorpoSm"):
        A(b)
    A(Spacer(1, 24))

    A(Paragraph("Fase 4 — Decisão", S["H3"]))
    A(P("Três saídas possíveis, e o erro mais comum em campo é tratar a "
        "segunda como se fosse a terceira.", "CorpoSm"))
    A(data_table(
        [[P("Situação encontrada", "Th"), P("Natureza", "Th"),
          P("Conduta da guarnição", "Th")],
         [P("Documentação regular e operação dentro dos limites.", "TdSm"),
          P("Regular", "TdCB"),
          P("Orientar, se couber, e liberar. Registro simplificado da "
            "abordagem para fins estatísticos.", "TdSm")],
         [P("Falta ou vício de documentação, ou operação fora dos limites da "
            "categoria, <b>sem</b> perigo concreto e sem indício de crime.",
            "TdSm"),
          P("Infração<br/>administrativa", "TdCB"),
          P("<b>Não apreender.</b> Determinar a cessação da operação, "
            "identificar operador e aeronave, registrar minuciosamente e "
            "encaminhar comunicação ao órgão competente (ANAC / DECEA / "
            "ANATEL). Orientar o operador sobre a regularização.", "TdSm")],
         [P("Perigo concreto a pessoas ou a aeronave tripulada; sobrevoo de "
            "área proibida; entrega de objeto em unidade prisional; captação "
            "de interior de residência; desobediência a ordem legal; ou "
            "qualquer indício de crime.", "TdSm"),
          P("Fato<br/>criminal", "TdCB"),
          P("Atuação policial plena: cessação do risco, condução, lavratura "
            "de boletim de ocorrência circunstanciado, apreensão do "
            "equipamento como elemento de prova quando presente situação de "
            "flagrante e encaminhamento à autoridade policial competente.",
            "TdSm")],
         ],
        [CONTENT_W * 0.36, CONTENT_W * 0.16, CONTENT_W * 0.48]))
    A(Spacer(1, 6))
    A(Callout(
        "Sobre apreensão do equipamento",
        ["A apreensão exige base legal. Em situação de <b>flagrante</b> de fato "
         "criminal, o equipamento é elemento de prova e a apreensão se "
         "justifica. <b>Fora</b> de hipótese de flagrante claro, a apreensão "
         "depende de ordem judicial. Apreender drone por irregularidade "
         "meramente administrativa — cadastro vencido, falta de autorização — "
         "é o erro que mais frequentemente retorna como representação por "
         "abuso de autoridade e ação de indenização contra o agente e contra "
         "o Estado.",
         "Quando a apreensão for cabível: descrever o equipamento com marca, "
         "modelo, número de série e número de etiqueta; apreender também "
         "controle, baterias e cartão de memória; e preservar a mídia "
         "embarcada com registro de cadeia de custódia — ela costuma ser a "
         "prova mais relevante do conjunto."],
        kind="alert"))
    A(Spacer(1, 8))

    A(Paragraph("Fase 5 — Registro e encaminhamento", S["H3"]))
    for b in numbered([
        "<b>Ficha de abordagem</b> (Anexo A) preenchida no local, ainda com o "
        "operador presente.",
        "<b>Boletim de ocorrência</b> com os elementos técnicos corretos: "
        "identificação da aeronave e da etiqueta, número de cadastro, "
        "existência ou não de autorização de espaço aéreo, altura e local "
        "aproximados da operação, o que havia sob a área sobrevoada e o que "
        "foi ou não apresentado.",
        "<b>Comunicação à ANAC</b> quando houver indício de infração aos "
        "requisitos do RBAC nº 100 — cadastro, etiqueta, limites de categoria, "
        "seguro.",
        "<b>Comunicação ao DECEA</b> quando a questão envolver acesso ao "
        "espaço aéreo, sobrevoo de área restrita ou proximidade de aeródromo.",
        "<b>Comunicação à ANATEL</b> quando houver indício de equipamento de "
        "radiocomunicação sem homologação.",
        "<b>Encaminhamento à Polícia Civil</b> quando houver indício de crime, "
        "para instauração do procedimento cabível.",
    ], style="CorpoSm"):
        A(b)
    A(Spacer(1, 8))

    A(Paragraph("O que não fazer — dez erros recorrentes", S["H2"]))
    A(data_table(
        [[P("Não faça", "Th"), P("Por quê", "Th")],
         [P("Agarrar ou derrubar o drone em voo.", "TdSm"),
          P("Provoca queda e transfere para o agente a responsabilidade por "
            "eventual lesão ou dano.", "TdSm")],
         [P("Determinar desligamento imediato dos motores em voo.", "TdSm"),
          P("Mesmo efeito da anterior. O correto é determinar o pouso.",
            "TdSm")],
         [P("Apreender por irregularidade administrativa.", "TdSm"),
          P("Falta base legal; gera representação por abuso de autoridade.",
            "TdSm")],
         [P("Exigir documento que a norma não exige.", "TdSm"),
          P("Nota fiscal do equipamento e habilitação para aeronave isenta, "
            "por exemplo, não são exigências gerais. Exigência indevida "
            "vicia a abordagem.", "TdSm")],
         [P("Presumir irregularidade pelo simples fato de haver um drone "
            "voando.", "TdSm"),
          P("A operação regular é a regra. Abordagem sem qualquer elemento "
            "objetivo é frágil.", "TdSm")],
         [P("Apagar, mover ou visualizar livremente a mídia embarcada.",
            "TdSm"),
          P("Rompe a cadeia de custódia e compromete a prova.", "TdSm")],
         [P("Liberar o operador sem registrar nada em caso irregular.",
            "TdSm"),
          P("Sem registro, o órgão competente não tem como autuar e a "
            "irregularidade se perde.", "TdSm")],
         [P("Confundir competência: autuar em nome da ANAC.", "TdSm"),
          P("A guarnição comunica; a autuação é do órgão regulador.",
            "TdSm")],
         [P("Conduzir a abordagem sob a área de voo.", "TdSm"),
          P("Expõe a guarnição a queda do próprio equipamento abordado.",
            "TdSm")],
         [P("Deixar de acionar a Polícia Civil diante de indício de crime.",
            "TdSm"),
          P("Omissão em fato criminal, especialmente nos casos de unidade "
            "prisional e aeródromo.", "TdSm")],
         ],
        [CONTENT_W * 0.40, CONTENT_W * 0.60]))
    A(Spacer(1, 24))

    # -------------------------------------------------- 8. documentos -------
    A(SectionHeader(8, "Documentos exigíveis na abordagem",
                    "Quadro de consulta rápida — reproduzível em cartão de bolso."))
    A(data_table(
        [[P("Documento", "Th"), P("Órgão", "Th"), P("Quando é exigível", "Th"),
          P("O que conferir", "Th")],
         [P("Certidão de cadastro da aeronave (SISANT)", "TdB"),
          P("ANAC", "TdSm"),
          P("Aeronave acima de 250 g. Documento primário da abordagem.",
            "TdSm"),
          P("Número; correspondência com a etiqueta afixada; validade de 24 "
            "meses; responsável legal vinculado.", "TdSm")],
         [P("Etiqueta de identificação na aeronave", "TdB"),
          P("ANAC", "TdSm"),
          P("Sempre que houver cadastro. É obrigação <b>autônoma</b> em "
            "relação ao cadastro.", "TdSm"),
          P("Presença física, legibilidade e coincidência do número. A falta "
            "de cadastro e a falta de etiqueta podem ser autuadas "
            "cumulativamente.", "TdSm")],
         [P("Autorização de acesso ao espaço aéreo (SARPAS)", "TdB"),
          P("DECEA", "TdSm"),
          P("Conforme a operação, na forma da ICA 100-40 vigente.", "TdSm"),
          P("Protocolo ou autorização; coincidência de data, horário, local e "
            "aeronave com a operação em curso.", "TdSm")],
         [P("Comprovação de aprovação em exame teórico", "TdB"),
          P("ANAC", "TdSm"),
          P("Piloto de aeronave acima de 250 g, em qualquer categoria — "
            "<b>obrigatório a partir de 1º/1/2027</b>.", "TdSm"),
          P("Até 31/12/2026 a exigência está dispensada pela Resolução nº 805; "
            "orientar, não autuar.", "TdSm")],
         [P("Cadastro de Operador de UA (COE)", "TdB"),
          P("ANAC", "TdSm"),
          P("Operação em categoria <b>Específica</b>.", "TdSm"),
          P("Existência do cadastro e correspondência entre a operação "
            "observada e o que foi autorizado ou declarado.", "TdSm")],
         [P("Seguro de danos a terceiros", "TdB"),
          P("ANAC<br/>(seção 100.37)", "TdSm"),
          P("Regra geral para operação de UAS, com exceções no regulamento — "
            "entre elas entes estatais e certas operações agrícolas em área "
            "não habitada.", "TdSm"),
          P("Apólice vigente e cobertura para a operação. Verificar se o caso "
            "se enquadra em exceção antes de apontar irregularidade.",
            "TdSm")],
         [P("Homologação do equipamento de radiocomunicação", "TdB"),
          P("ANATEL", "TdSm"),
          P("Drone e controle (enlace de radiofrequência).", "TdSm"),
          P("Selo ou registro de homologação. Equipamento importado sem "
            "homologação é irregularidade de competência da ANATEL.",
            "TdSm")],
         [P("Documento de identificação do operador", "TdB"),
          P("—", "TdSm"),
          P("Sempre.", "TdSm"),
          P("Identificação civil e correspondência com o responsável do "
            "cadastro, quando for o caso.", "TdSm")],
         [P("Registro no MAPA (SIPEAGRO) e CAAR", "TdB"),
          P("MAPA", "TdSm"),
          P("Aplicação de agrotóxicos, fertilizantes, corretivos, "
            "inoculantes ou sementes por ARP.", "TdSm"),
          P("Registro do operador; curso do piloto; receituário agronômico e "
            "responsabilidade técnica, conforme a Portaria nº 298/2021.",
            "TdSm")],
         ],
        [CONTENT_W * 0.235, CONTENT_W * 0.105, CONTENT_W * 0.30,
         CONTENT_W * 0.36], pad=4))
    A(Spacer(1, 7))
    A(P(
        "As normas de referência são alteradas com frequência — o próprio ano "
        "de 2026 concentrou três mudanças relevantes. A capacitação inclui "
        "orientação sobre <b>onde consultar a versão vigente</b> de cada norma, "
        "para que o quadro acima possa ser mantido atualizado pela própria "
        "corporação.", "Nota"))
    A(Spacer(1, 24))

    # --------------------------------------------- 9. enquadramentos --------
    A(SectionHeader(9, "Enquadramentos e encaminhamentos possíveis"))
    A(Callout(
        "Leitura obrigatória antes do quadro",
        ["O quadro abaixo é <b>instrumento didático de orientação</b>, não "
         "parecer jurídico. O enquadramento definitivo de qualquer conduta "
         "depende dos elementos concretos do caso e deve ser validado pela "
         "assessoria jurídica da corporação e pela autoridade policial "
         "competente. A finalidade aqui é evitar os dois extremos: tratar "
         "fato criminal como mera irregularidade, e tratar irregularidade "
         "administrativa como crime."],
        kind="gold"))
    A(Spacer(1, 8))
    A(data_table(
        [[P("Conduta observada", "Th"), P("Natureza", "Th"),
          P("Referência", "Th"), P("Quem apura", "Th")],
         [P("Operar aeronave acima de 250 g sem cadastro.", "TdSm"),
          P("Administrativa", "TdSm"),
          P("RBAC nº 100; Resoluções ANAC nº 761 e 762/2024.", "TdSm"),
          P("ANAC", "TdSm")],
         [P("Aeronave cadastrada sem etiqueta de identificação.", "TdSm"),
          P("Administrativa", "TdSm"), P("RBAC nº 100.", "TdSm"),
          P("ANAC", "TdSm")],
         [P("Operar sem autorização de acesso ao espaço aéreo.", "TdSm"),
          P("Administrativa", "TdSm"), P("ICA 100-40 (DECEA).", "TdSm"),
          P("DECEA / ANAC", "TdSm")],
         [P("Exceder 120 m (400 pés) AGL em categoria Aberta.", "TdSm"),
          P("Administrativa", "TdSm"), P("RBAC nº 100.", "TdSm"),
          P("ANAC", "TdSm")],
         [P("Sobrevoar pessoas não envolvidas em categoria Aberta.", "TdSm"),
          P("Administrativa<br/>(ou criminal, se houver perigo concreto)",
            "TdSm"),
          P("RBAC nº 100; Código Penal, art. 132, conforme o caso.", "TdSm"),
          P("ANAC / Polícia Civil", "TdSm")],
         [P("Operar sem seguro, quando exigível.", "TdSm"),
          P("Administrativa", "TdSm"), P("RBAC nº 100, seção 100.37.", "TdSm"),
          P("ANAC", "TdSm")],
         [P("Equipamento de radiocomunicação sem homologação.", "TdSm"),
          P("Administrativa", "TdSm"),
          P("Lei nº 9.472/1997 e regulamentação da ANATEL.", "TdSm"),
          P("ANATEL", "TdSm")],
         [P("Operar nas proximidades de aeródromo ou em área proibida, "
            "expondo a perigo aeronave tripulada.", "TdSm"),
          P("<b>Criminal</b>", "TdSm"),
          P("Código Penal, art. 261 — atentado contra a segurança de "
            "transporte aéreo; reclusão de 2 a 5 anos.", "TdSm"),
          P("Polícia Federal / Polícia Civil", "TdSm")],
         [P("Entregar ou arremessar objeto em estabelecimento prisional por "
            "drone.", "TdSm"),
          P("<b>Criminal</b>", "TdSm"),
          P("Conforme o objeto: Código Penal, art. 349-A (aparelho "
            "telefônico); Lei nº 11.343/2006, art. 33 (drogas); Lei nº "
            "10.826/2003 (armas e munições).", "TdSm"),
          P("Polícia Penal / Polícia Civil", "TdSm")],
         [P("Captar intencionalmente o interior de residência.", "TdSm"),
          P("<b>Criminal</b> e/ou ilícito civil", "TdSm"),
          P("Constituição, art. 5º, X e XI; Código Penal, art. 216-B "
            "(registro não autorizado da intimidade sexual); Lei das "
            "Contravenções Penais, art. 65. A jurisprudência avalia caso a "
            "caso — distância, intenção de captar o interior, finalidade do "
            "voo e dano concreto. Sobrevoo breve sem captação do interior "
            "tende a não configurar ilícito.", "TdSm"),
          P("Polícia Civil", "TdSm")],
         [P("Descumprir ordem legal de pousar a aeronave.", "TdSm"),
          P("<b>Criminal</b>", "TdSm"),
          P("Código Penal, art. 330 (desobediência) ou art. 329 "
            "(resistência), conforme a conduta.", "TdSm"),
          P("PM / Polícia Civil", "TdSm")],
         [P("Empregar drone para vigiar guarnição, alvo ou rota com "
            "finalidade criminosa.", "TdSm"),
          P("<b>Criminal</b>", "TdSm"),
          P("Enquadramento conforme o crime associado; elemento de prova em "
            "organização criminosa (Lei nº 12.850/2013).", "TdSm"),
          P("Polícia Civil", "TdSm")],
         [P("Pulverizar insumos por ARP sem registro do operador ou sem "
            "curso do piloto.", "TdSm"),
          P("Administrativa", "TdSm"),
          P("Portaria MAPA nº 298/2021; Lei nº 7.802/1989.", "TdSm"),
          P("MAPA / órgão estadual", "TdSm")],
         ],
        [CONTENT_W * 0.255, CONTENT_W * 0.145, CONTENT_W * 0.42,
         CONTENT_W * 0.18], pad=4))
    A(Spacer(1, 24))

    # ------------------------------------------------- 10. metodologia ------
    A(SectionHeader(10, "Metodologia, infraestrutura e logística"))
    A(Paragraph("Método", S["H2"]))
    for b in bullets([
        "<b>Proporção 40 / 60.</b> Quarenta por cento de carga teórica e "
        "sessenta por cento de prática e simulação. Nenhum módulo normativo é "
        "ministrado sem exercício de aplicação correspondente.",
        "<b>Turma reduzida na prática.</b> A parte de voo é conduzida em "
        "subgrupos, com tempo individual de comando garantido e registro de "
        "aproveitamento por aluno.",
        "<b>Cenários encenados.</b> Os módulos operacionais e de abordagem são "
        "avaliados em simulação, não em prova escrita — inclusive com o "
        "preenchimento da ficha de abordagem sob pressão de tempo.",
        "<b>Material de consulta permanente.</b> Cada aluno recebe apostila, "
        "checklists de voo e o cartão de bolso com o quadro de documentos "
        "exigíveis da seção 8.",
        "<b>Avaliação objetiva.</b> Prova teórica no modelo do exame da ANAC — "
        "20 questões — mais avaliação prática por critérios definidos. O "
        "resultado individual é entregue à corporação.",
    ]):
        A(b)
    A(Spacer(1, 10))

    A(Paragraph("Divisão de responsabilidades", S["H2"]))
    A(data_table(
        [[P("Fornecido pelo instrutor", "Th"),
          P("Fornecido pela corporação", "Th")],
         [P("Instrução, material didático impresso e digital, aeronaves para "
            "a prática, checklists, instrumentos de avaliação, certificados e "
            "relatório final de turma.", "TdSm"),
          P("Sala com projeção para a parte teórica; área externa adequada "
            "para voo, preferencialmente em instalação própria; indicação de "
            "um oficial ou responsável de ligação; relação nominal do "
            "efetivo; e as aeronaves institucionais, quando houver interesse "
            "em treinar no próprio equipamento.", "TdSm")],
         ],
        [CONTENT_W * 0.5, CONTENT_W * 0.5]))
    A(Spacer(1, 8))
    A(Callout(
        "Recomendação: treinar no equipamento da corporação",
        ["Sempre que a instituição já possuir aeronaves, recomenda-se que parte "
         "da carga prática seja conduzida <b>nelas</b>, e não apenas na frota "
         "do instrutor. O ganho é direto: o efetivo termina o curso "
         "familiarizado com o equipamento que vai efetivamente empregar, e a "
         "corporação recebe, junto, um diagnóstico do estado da própria frota "
         "e da regularidade de seus cadastros."],
        kind="ok"))
    A(Spacer(1, 10))

    A(Paragraph("Requisitos da área de voo", S["H2"]))
    for b in bullets([
        "Área aberta, sem rede elétrica sobre o setor de operação e sem "
        "público não envolvido.",
        "Afastamento de aeródromos, heliportos e áreas restritas, ou "
        "autorização de acesso ao espaço aéreo previamente obtida — a "
        "solicitação é feita pelo instrutor com apoio da corporação.",
        "Ponto de energia para carga de baterias e local coberto para "
        "briefing.",
        "Delimitação e sinalização do setor de decolagem e pouso.",
    ], style="CorpoSm"):
        A(b)
    A(Spacer(1, 24))

    # ------------------------------------------------ 11. certificação ------
    A(SectionHeader(11, "Certificação emitida ao concluinte"))
    A(P(
        "Cada concluinte aprovado recebe <b>certificado de capacitação "
        "profissional</b> nominal, com número de registro e verso contendo "
        "conteúdo programático, carga horária por módulo e critério de "
        "aproveitamento. O certificado é emitido na modalidade de curso livre "
        "de formação continuada, com fundamento na Lei nº 9.394/1996 (Lei de "
        "Diretrizes e Bases da Educação Nacional), art. 42, e no Decreto nº "
        "5.154/2004."))
    A(Spacer(1, 5))
    A(Callout(
        "Transparência sobre o alcance do certificado",
        ["Certificados de curso livre têm <b>validade legal em todo o "
         "território nacional</b> como comprovação de capacitação, "
         "aperfeiçoamento e qualificação profissional — e servem regularmente "
         "para averbação funcional, pontuação em progressão de carreira e "
         "comprovação em processo seletivo, conforme os critérios de cada "
         "corporação.",
         "Não se trata, porém, de curso \"reconhecido pelo MEC\": a legislação "
         "brasileira <b>não atribui ao Ministério da Educação competência "
         "regulatória</b> sobre cursos livres, de extensão ou de qualificação "
         "profissional — apenas sobre educação básica, técnica e superior. "
         "Qualquer fornecedor que anuncie curso de drone \"reconhecido pelo "
         "MEC\" está prestando informação incorreta, e a corporação deve "
         "tratar isso como sinal de alerta na análise de propostas.",
         "O documento complementar desta entrega — <b>Rotas Legais de "
         "Certificação</b> — detalha o assunto e apresenta os caminhos "
         "efetivamente existentes de reconhecimento oficial, inclusive "
         "parceria com instituição de ensino credenciada pelo MEC para "
         "emissão de certificado de extensão universitária, quando a "
         "corporação exigir esse formato em edital."],
        kind="gold"))
    A(Spacer(1, 8))
    A(Paragraph("Conteúdo do certificado", S["H2"]))
    for b in bullets([
        "Nome completo, documento de identificação e, quando aplicável, posto "
        "ou graduação e unidade do concluinte.",
        "Denominação do curso, trilha e carga horária total.",
        "Período de realização e local.",
        "Fundamento legal da emissão e natureza de curso livre de formação "
        "continuada.",
        "Número de registro único, com controle em livro de registro do "
        "instrutor e possibilidade de verificação de autenticidade.",
        "No verso: conteúdo programático por módulo, com carga horária "
        "individual e critério de aprovação aplicado.",
        "Identificação e assinatura do instrutor responsável.",
    ], style="CorpoSm"):
        A(b)
    A(Spacer(1, 8))
    A(P(
        "Além dos certificados individuais, a corporação recebe "
        "<b>relatório final de turma</b> com a relação de aprovados, o "
        "aproveitamento individual, as observações sobre desempenho prático e "
        "as recomendações de continuidade — documento útil para instruir a "
        "designação de pilotos institucionais e a escolha dos futuros "
        "instrutores internos."))
    A(Spacer(1, 24))

    # -------------------------------------------------- 12. investimento ----
    A(SectionHeader(12, "Formatos de contratação e investimento"))
    A(P(
        "A contratação pode ocorrer por turma fechada na própria instituição — "
        "formato recomendado, por permitir treinar no equipamento e no terreno "
        "reais — ou por vagas individuais em turma aberta. Os valores abaixo "
        "devem ser preenchidos conforme a proposta comercial vigente e a "
        "modalidade de contratação aplicável ao órgão."))
    A(Spacer(1, 6))
    A(kv_table([
        ("Efetivo mínimo por turma", D.com("min_alunos")),
        ("Efetivo máximo por turma", D.com("max_alunos")),
        ("Investimento por turma fechada", D.com("valor_por_turma")),
        ("Investimento por vaga individual", D.com("valor_por_aluno")),
        ("Condições de pagamento", D.com("forma_pagamento")),
        ("Abrangência de atendimento", D.com("abrangencia")),
        ("Despesas de deslocamento e hospedagem", D.com("despesas_deslocamento")),
        ("Prazo para agendamento", D.com("prazo_agendamento")),
        ("Validade desta proposta", D.com("validade_proposta")),
    ], label_w=0.42))
    A(Spacer(1, 8))
    A(Callout(
        "Sobre a modalidade de contratação pelo órgão público",
        ["A contratação de instrutor para capacitação de efetivo é usualmente "
         "viabilizada por contratação direta de serviço de treinamento, nos "
         "termos da Lei nº 14.133/2021, ou por dispensa em razão do valor, "
         "quando cabível. A definição da modalidade e do enquadramento é "
         "atribuição da área de licitações e contratos da corporação; o "
         "instrutor se compromete a fornecer toda a documentação "
         "habilitatória, curricular e comprobatória necessária à instrução do "
         "processo, no prazo solicitado."],
        kind="info"))
    A(Spacer(1, 12))

    # ------------------------------------------------- 13. diferenciais -----
    A(SectionHeader(13, "Diferenciais desta proposta"))
    A(data_table(
        [[P("Diferencial", "Th"), P("O que significa na prática", "Th")],
         [P("Conteúdo na norma vigente", "TdB"),
          P("Grade construída sobre o RBAC nº 100 e a nova ICA 100-40, não "
            "sobre o RBAC-E nº 94 revogado. É o ponto a verificar em qualquer "
            "proposta concorrente: material que ainda fala em \"classe 3\" "
            "está desatualizado.", "TdSm")],
         [P("Protocolo de abordagem estruturado", "TdB"),
          P("Não é um tópico solto na apostila: é uma sequência de cinco "
            "fases, com ficha de campo reproduzível e simulação avaliada. "
            "Poucos programas no mercado tratam o lado da fiscalização.",
            "TdSm")],
         [P("Origem no drone agrícola", "TdB"),
          P("Segmento civil de maior exigência técnica — baixa altura, carga "
            "variável, responsabilidade por deriva e dano a terceiro. Traz "
            "para a sala uma cultura de checklist e margem de segurança que "
            "se transfere diretamente à operação policial.", "TdSm")],
         [P("Formação de multiplicadores", "TdB"),
          P("A Trilha 5 encerra a dependência de contratação externa: a "
            "corporação passa a formar seu próprio efetivo.", "TdSm")],
         [P("Entregáveis documentais", "TdB"),
          P("Certificados individuais, relatório de turma, checklists, ficha "
            "de abordagem e cartão de consulta rápida — material que "
            "permanece na corporação depois do curso.", "TdSm")],
         [P("Transparência sobre certificação", "TdB"),
          P("A proposta declara com precisão o alcance do certificado emitido, "
            "em vez de alegar reconhecimento inexistente. Isso protege a "
            "corporação de questionamento futuro sobre a validade da "
            "capacitação contratada.", "TdSm")],
         ],
        [CONTENT_W * 0.26, CONTENT_W * 0.74]))
    A(Spacer(1, 24))

    # ---------------------------------------------- 14. próximos passos -----
    A(SectionHeader(14, "Próximos passos"))
    for b in numbered([
        "<b>Reunião técnica de alinhamento</b> — sem custo, presencial ou "
        "remota, para apresentar o programa ao comando e ajustar a grade ao "
        "emprego real da unidade.",
        "<b>Diagnóstico da situação atual</b> — levantamento da frota "
        "institucional, da regularidade dos cadastros e do efetivo que já "
        "opera, para dimensionar as trilhas necessárias.",
        "<b>Proposta formal ajustada</b> — carga horária, cronograma, efetivo "
        "e investimento definidos, no formato exigido pela área de contratos.",
        "<b>Agendamento e execução</b> — definição de datas, área de voo e, "
        "quando necessário, solicitação de acesso ao espaço aéreo para a "
        "atividade de instrução.",
        "<b>Entrega e encerramento</b> — certificação dos aprovados, relatório "
        "final de turma e plano de continuidade.",
    ]):
        A(b)
    A(Spacer(1, 14))

    assinatura = Table(
        [[P("", "Td")],
         [P(f"<b>{D.INSTRUTOR['nome']}</b>", "TdC")],
         [P(D.INSTRUTOR["titulo_profissional"], "TdC")]],
        colWidths=[CONTENT_W * 0.55])
    assinatura.setStyle(TableStyle([
        ("LINEABOVE", (0, 1), (0, 1), 0.8, NAVY),
        ("TOPPADDING", (0, 1), (0, 1), 5),
        ("BOTTOMPADDING", (0, 0), (0, 0), 26),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))

    # contato e assinatura viajam juntos — assinatura solta em página vazia
    # é o tipo de detalhe que desqualifica uma proposta
    A(KeepTogether([
        Paragraph("Contato", S["H2"]),
        kv_table([
            ("Instrutor responsável", D.INSTRUTOR["nome"]),
            ("Telefone", D.ins("telefone")),
            ("E-mail", D.ins("email")),
            ("Cidade / UF", D.ins("cidade_uf")),
            ("Site / redes", D.ins("site_ou_redes")),
            ("Referência desta proposta",
             D.doc("referencia", "preencher se houver numeração interna")),
            ("Local e data", D.doc("cidade_data")),
        ], label_w=0.34),
        Spacer(1, 22),
        Table([[assinatura]], colWidths=[CONTENT_W],
              style=TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")])),
    ]))
    A(PageBreak())

    # ------------------------------------------------------- anexo A --------
    A(SectionHeader("A", "Anexo A — Ficha de abordagem a operador de drone",
                    "Formulário de campo. Pode ser reproduzido livremente pela "
                    "corporação."))
    A(P("Preencher no local, com o operador presente. Os campos assinalados "
        "com <b>·</b> são os que costumam faltar no boletim de ocorrência e "
        "inviabilizar a atuação posterior do órgão regulador.", "CorpoSm"))
    A(Spacer(1, 5))

    def linha_form(rotulo, altura=17):
        return [P(rotulo, "TdSm"), P("", "Td")]

    campos_form = [
        "Data e hora da abordagem",
        "Local (endereço / referência / coordenada)",
        "Unidade e guarnição",
        "Motivo da abordagem (rotina / denúncia / área restrita)",
    ]
    campos_op = [
        "Nome completo do operador",
        "Documento de identificação",
        "Telefone e endereço",
        "Operador é o responsável do cadastro? (sim / não)",
    ]
    campos_ae = [
        "· Marca e modelo da aeronave",
        "· Número de série",
        "· Número da etiqueta afixada",
        "· Número do cadastro apresentado",
        "· Coincidem etiqueta e cadastro? (sim / não)",
        "· Validade do cadastro",
        "Peso aproximado / aeronave acima de 250 g? (sim / não)",
    ]
    campos_voo = [
        "· Altura aproximada de voo",
        "· O que havia sob a área sobrevoada",
        "· Havia pessoas não envolvidas sob a aeronave? (sim / não)",
        "Aeronave em linha de visada do piloto? (sim / não)",
        "Havia observador auxiliar? (sim / não)",
        "Proximidade de aeródromo, unidade prisional, instalação militar ou "
        "área restrita",
    ]
    campos_docs = [
        "· Certidão de cadastro — apresentada? (sim / não)",
        "· Autorização de acesso ao espaço aéreo — apresentada? (sim / não)",
        "Seguro de danos a terceiros — apresentado? (sim / não / não aplicável)",
        "Homologação do equipamento — verificada? (sim / não)",
        "Comprovação de exame teórico — apresentada? (sim / não / dispensada)",
    ]
    campos_fim = [
        "Conclusão (regular / irregularidade administrativa / fato criminal)",
        "Providências adotadas",
        "Houve apreensão? Em caso positivo, fundamento e itens apreendidos",
        "Órgãos comunicados (ANAC / DECEA / ANATEL / Polícia Civil)",
        "Número do boletim de ocorrência",
        "Nome, posto/graduação e assinatura do responsável",
    ]

    def bloco_form(titulo, itens, altura=18):
        rows = [[P(titulo, "Th"), P("", "Th")]]
        for it in itens:
            rows.append(linha_form(it))
        t = data_table(rows, [CONTENT_W * 0.47, CONTENT_W * 0.53], zebra=False,
                       pad=4)
        estilos = [("SPAN", (0, 0), (1, 0))]
        for i in range(1, len(rows)):
            estilos.append(("MINROWHEIGHT", (0, i), (-1, i), altura)
                           if False else ("TOPPADDING", (0, i), (-1, i), 7))
            estilos.append(("BOTTOMPADDING", (0, i), (-1, i), 7))
            estilos.append(("BACKGROUND", (1, i), (1, i), colors.HexColor("#FCFDFE")))
        t.setStyle(TableStyle(estilos))
        # cada bloco viaja inteiro para a página seguinte, se não couber
        return KeepTogether([t])

    A(bloco_form("1 · IDENTIFICAÇÃO DA ABORDAGEM", campos_form))
    A(Spacer(1, 7))
    A(bloco_form("2 · OPERADOR", campos_op))
    A(Spacer(1, 7))
    A(bloco_form("3 · AERONAVE", campos_ae))
    A(Spacer(1, 7))
    A(bloco_form("4 · CONDIÇÕES DA OPERAÇÃO", campos_voo))
    A(Spacer(1, 7))
    A(bloco_form("5 · DOCUMENTAÇÃO VERIFICADA", campos_docs))
    A(Spacer(1, 7))
    A(bloco_form("6 · CONCLUSÃO E ENCAMINHAMENTO", campos_fim))
    A(Spacer(1, 24))

    # ------------------------------------------------------- anexo B --------
    A(SectionHeader("B", "Anexo B — Checklist de voo institucional",
                    "Para uso da corporação em suas próprias operações."))
    A(Paragraph("Antes do voo", S["H2"]))
    A(checklist_table([
        "Missão definida e enquadrada na categoria de operação correta.",
        "Cadastro da aeronave vigente e etiqueta de identificação afixada e "
        "legível.",
        "Acesso ao espaço aéreo solicitado e autorizado para o local, data e "
        "horário da operação.",
        "Verificação de aeródromos, heliportos e áreas restritas no raio da "
        "operação.",
        "Condições meteorológicas dentro dos limites do equipamento — vento, "
        "rajada, visibilidade e precipitação.",
        "Baterias da aeronave e do controle carregadas e sem deformação, "
        "inchaço ou dano.",
        "Hélices íntegras, sem trinca, e corretamente travadas.",
        "Firmware e cartão de memória verificados; memória com espaço livre.",
        "Calibração de bússola e aquisição de posicionamento concluídas.",
        "Altura máxima, limite de distância e ação de retorno automático "
        "configurados.",
        "Ponto de retorno definido em local livre de obstáculos.",
        "Setor de decolagem e pouso delimitado e livre de pessoas não "
        "envolvidas.",
        "Briefing realizado com piloto, observador e comando da operação.",
        "Rota de contingência e local alternativo de pouso definidos.",
    ]))
    A(Spacer(1, 10))
    A(Paragraph("Durante o voo", S["H2"]))
    A(checklist_table([
        "Aeronave mantida em linha de visada, conforme a categoria de "
        "operação.",
        "Altura mantida dentro do limite autorizado.",
        "Nível de bateria monitorado com margem para retorno.",
        "Ausência de sobrevoo de pessoas não envolvidas e de via de tráfego "
        "intenso.",
        "Comunicação ativa com o observador e com o comando da operação.",
        "Espaço aéreo observado quanto a aeronave tripulada — em especial "
        "helicóptero em baixa altura.",
        "Qualidade do enlace acompanhada; ação imediata em caso de degradação.",
    ]))
    A(Spacer(1, 10))
    A(Paragraph("Após o voo", S["H2"]))
    A(checklist_table([
        "Pouso concluído em local seguro e rotores parados.",
        "Registro da operação no livro de voo: data, local, duração, piloto e "
        "finalidade.",
        "Mídia produzida transferida com registro de cadeia de custódia.",
        "Inspeção pós-voo do equipamento e registro de qualquer avaria.",
        "Baterias armazenadas em nível e local adequados.",
        "Ocorrências e incidentes registrados e comunicados na forma "
        "estabelecida.",
    ]))
    A(Spacer(1, 24))

    # ------------------------------------------------------- anexo C --------
    A(SectionHeader("C", "Anexo C — Base normativa consultada"))
    A(P("Relação das normas e atos que fundamentam o conteúdo desta proposta. "
        "A regulação de aeronaves não tripuladas tem alterado com frequência; "
        "recomenda-se conferir a versão vigente de cada ato junto ao órgão "
        "emissor antes de aplicação em caso concreto.", "CorpoSm"))
    A(Spacer(1, 5))
    A(data_table(
        [[P("Norma / ato", "Th"), P("Órgão", "Th"), P("Objeto", "Th")],
         [P("RBAC nº 100 — Requisitos gerais para aeronaves não tripuladas de "
            "uso civil, aprovado pela Resolução nº 805", "TdSm"),
          P("ANAC", "TdSm"),
          P("Marco geral vigente desde 16/6/2026; substituiu integralmente o "
            "RBAC-E nº 94. Categorias Aberta, Específica e Certificada; "
            "cadastro; seguro (seção 100.37); exame teórico de piloto remoto.",
            "TdSm")],
         [P("RBAC-E nº 94", "TdSm"), P("ANAC", "TdSm"),
          P("Norma anterior, vigente de 2017 a 2026 — <b>revogada</b>. Citada "
            "apenas para fins de comparação histórica.", "TdSm")],
         [P("Instrução Suplementar 100.103-002A", "TdSm"), P("ANAC", "TdSm"),
          P("Cenário padrão para operações com UAS de órgãos de segurança "
            "pública, polícia, fiscalização tributária e aduaneira, defesa "
            "civil, corpo de bombeiros e demais órgãos ou entidades "
            "controlados pelo Estado. <b>Conferir na ANAC a situação de "
            "publicação e a versão vigente</b> antes de fundamentar uma "
            "operação nesta Instrução Suplementar.", "TdSm")],
         [P("Resoluções nº 761 e nº 762, de dezembro de 2024", "TdSm"),
          P("ANAC", "TdSm"),
          P("Vigentes desde 1º/1/2026. Substituíram as tabelas de infrações "
            "anteriores e dimensionam a sanção conforme o grupo do regulado, "
            "em toda a regulação federal de aviação civil.", "TdSm")],
         [P("ICA 100-40 — Aeronaves não tripuladas e o acesso ao espaço aéreo "
            "brasileiro; Portaria DECEA nº 2094/DNOR8, de 18/3/2026 (BCA nº "
            "058, de 30/3/2026)", "TdSm"),
          P("DECEA", "TdSm"),
          P("Nova edição vigente desde 1º/7/2026. Consolida em documento único "
            "as regras de acesso ao espaço aéreo por aeronaves não "
            "tripuladas.", "TdSm")],
         [P("ICA 100-48", "TdSm"), P("DECEA", "TdSm"),
          P("Vigente desde 1º/7/2026, em conjunto com a ICA 100-40.", "TdSm")],
         [P("Lei nº 9.472/1997 e regulamentação de homologação", "TdSm"),
          P("ANATEL", "TdSm"),
          P("Homologação de equipamentos de radiocomunicação — aeronave e "
            "controle.", "TdSm")],
         [P("Portaria nº 298, de 22/9/2021", "TdSm"), P("MAPA", "TdSm"),
          P("Uso de aeronaves remotamente pilotadas na aviação agrícola. "
            "Vigente desde 1º/10/2021. Registro do operador no SIPEAGRO; "
            "exigência do CAAR para o piloto; cadastramento de entidades de "
            "ensino e homologação de turmas.", "TdSm")],
         [P("Lei nº 7.802/1989 e Decreto nº 4.074/2002", "TdSm"),
          P("União", "TdSm"),
          P("Agrotóxicos: receituário, responsabilidade técnica e destinação "
            "de embalagens.", "TdSm")],
         [P("Lei nº 7.565/1986 — Código Brasileiro de Aeronáutica", "TdSm"),
          P("União", "TdSm"),
          P("Marco legal da aviação civil; fundamento das competências "
            "sancionadoras.", "TdSm")],
         [P("Lei nº 9.394/1996, art. 42, e Decreto nº 5.154/2004", "TdSm"),
          P("MEC / União", "TdSm"),
          P("Fundamento legal da oferta de cursos livres de formação inicial e "
            "continuada e da emissão dos certificados correspondentes.",
            "TdSm")],
         [P("Constituição Federal, art. 5º, X e XI, e art. 144", "TdSm"),
          P("União", "TdSm"),
          P("Intimidade e inviolabilidade do domicílio; competências dos "
            "órgãos de segurança pública.", "TdSm")],
         [P("Código Penal — arts. 132, 216-B, 261, 329, 330 e 349-A", "TdSm"),
          P("União", "TdSm"),
          P("Tipos penais de incidência mais frequente em ocorrências com "
            "drones.", "TdSm")],
         [P("Lei nº 13.869/2019", "TdSm"), P("União", "TdSm"),
          P("Abuso de autoridade — limites da abordagem, da busca e da "
            "apreensão.", "TdSm")],
         [P("Lei nº 14.133/2021", "TdSm"), P("União", "TdSm"),
          P("Licitações e contratos administrativos — enquadramento da "
            "contratação do treinamento.", "TdSm")],
         ],
        [CONTENT_W * 0.34, CONTENT_W * 0.11, CONTENT_W * 0.55], pad=4))
    A(Spacer(1, 10))
    A(Callout(
        "Ressalva técnica",
        ["Este documento tem finalidade técnico-comercial e didática. Não "
         "constitui parecer jurídico nem substitui a consulta às normas "
         "vigentes e à assessoria jurídica da corporação. Datas, numerações e "
         "requisitos aqui reproduzidos foram levantados junto a fontes "
         "públicas e devem ser conferidos no órgão emissor antes de aplicação "
         "em caso concreto — em especial porque a regulação de aeronaves não "
         "tripuladas está em ciclo de alteração acelerado."],
        kind="info"))
    return st


def gerar(caminho):
    doc = DocBuilder(
        caminho, doc_title=TITULO, short_title=CURTO,
        cover_fn=desenhar_capa,
        author=D.INSTRUTOR["nome"],
        subject="Proposta de capacitação em aeronaves não tripuladas para "
                "instituições de segurança pública e Forças Armadas",
    )
    doc.footer_left = (f"{D.INSTRUTOR['nome']} · Capacitação em Aeronaves Não "
                       f"Tripuladas · v{D.DOCUMENTO.get('versao', '1.0')}")
    story = [NextPageTemplate("body"), Spacer(1, 1), PageBreak()] + historia()
    from reportlab.pdfgen.canvas import Canvas
    doc.build(story, canvasmaker=NumberedCanvas(Canvas, skip_first=True))
    return caminho
