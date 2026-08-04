"""
DOCUMENTO 2 — Rotas legais para emissão de certificados de capacitação em
drones com validade e reconhecimento oficial.
"""

from reportlab.platypus import NextPageTemplate, Spacer, PageBreak
from reportlab.lib.units import cm

from design import (
    ALERT, CONTENT_W, Callout, DocBuilder, DroneMark, FONT, FONT_B, GOLD,
    HRule, INK_SOFT, MARGIN_X, NAVY, NumberedCanvas, OK, P, PAGE_H, PAGE_W, S,
    STEEL, SectionHeader, bullets, campo, checklist_table, colors,
    cover_backdrop, data_table, kv_table, numbered, toc_block, Paragraph,
    Table, TableStyle, WHITE, GOLD_SOFT, LINE, STEEL_SOFT,
)
import dados as D

TITULO = "Rotas Legais de Certificação — Cursos de Capacitação em Drones"
CURTO = "Rotas Legais de Certificação · Cursos de Capacitação em Drones"


def desenhar_capa(canv, doc):
    cover_backdrop(canv, accent=STEEL)
    canv.saveState()
    x = MARGIN_X

    dm = DroneMark(size=96, color=STEEL, lw=1.7, alpha=0.95)
    dm.canv = canv
    canv.saveState()
    canv.translate(PAGE_W - MARGIN_X - 96, PAGE_H - 108)
    dm.draw()
    canv.restoreState()

    canv.setFillColor(colors.HexColor("#5B9BD5"))
    canv.setFont(FONT_B, 9.2)
    canv.drawString(x, PAGE_H - 74, "DOCUMENTO TÉCNICO COMPLEMENTAR · USO INTERNO")
    canv.setStrokeColor(colors.HexColor("#5B9BD5"))
    canv.setLineWidth(1.4)
    canv.line(x, PAGE_H - 84, x + 52, PAGE_H - 84)

    y = PAGE_H - 132
    canv.setFillColor(WHITE)
    canv.setFont(FONT_B, 30)
    for linha in ["ROTAS LEGAIS", "DE CERTIFICAÇÃO"]:
        canv.drawString(x, y, linha)
        y -= 34
    canv.setFillColor(colors.HexColor("#5B9BD5"))
    canv.setFont(FONT_B, 13)
    canv.drawString(x, y + 4, "CURSOS DE CAPACITAÇÃO EM AERONAVES NÃO TRIPULADAS")

    y -= 34
    canv.setFillColor(colors.HexColor("#B9C7D4"))
    canv.setFont(FONT, 11.4)
    for linha in [
        "Como emitir certificado com validade jurídica real, o que o MEC",
        "efetivamente reconhece — e quais são os caminhos de reconhecimento",
        "oficial disponíveis para um curso de drones no Brasil.",
    ]:
        canv.drawString(x, y, linha)
        y -= 16

    # as seis rotas, já anunciadas na capa
    canv.setFillColor(colors.HexColor("#5B9BD5"))
    canv.setFont(FONT_B, 8.4)
    canv.drawString(x, 520, "AS SEIS ROTAS ANALISADAS")
    rotas = [
        ("A · Curso livre fundamentado", "D · Cadastro no MAPA (CAAR)"),
        ("B · Extensão universitária", "E · Exame teórico da ANAC"),
        ("C · Qualificação técnica", "F · Reconhecimento corporativo"),
    ]
    canv.setFillColor(colors.HexColor("#D5DEE6"))
    canv.setFont(FONT, 9.4)
    ry = 498
    for esq, dir_ in rotas:
        canv.drawString(x, ry, esq)
        canv.drawString(x + CONTENT_W * 0.5, ry, dir_)
        ry -= 15

    # caixa de resposta direta, já na capa
    box_y = PAGE_H * 0.34 + 30
    canv.setFillColor(colors.HexColor("#16324F"))
    canv.roundRect(x, box_y, CONTENT_W, 96, 4, stroke=0, fill=1)
    canv.setFillColor(colors.HexColor("#C8952A"))
    canv.rect(x, box_y, 3.5, 96, stroke=0, fill=1)
    canv.setFillColor(colors.HexColor("#C8952A"))
    canv.setFont(FONT_B, 9)
    canv.drawString(x + 14, box_y + 76, "A RESPOSTA CURTA, ANTES DE VIRAR A PÁGINA")
    canv.setFillColor(WHITE)
    canv.setFont(FONT, 9.4)
    linhas = [
        "Curso de drone não é — e não pode ser — “reconhecido pelo MEC”. Não é",
        "dificuldade burocrática: a lei não deu ao Ministério competência sobre curso livre,",
        "de extensão ou de qualificação profissional. Existem, porém, cinco outras rotas de",
        "reconhecimento oficial, todas viáveis — e uma delas, o cadastro no MAPA, é a mais",
        "valiosa para quem trabalha com drone agrícola. Este documento detalha cada uma.",
    ]
    ly = box_y + 60
    for linha in linhas:
        canv.drawString(x + 14, ly, linha)
        ly -= 12.6

    canv.setFillColor(colors.HexColor("#5B9BD5"))
    canv.setFont(FONT_B, 8.4)
    canv.drawString(x, 196, "PREPARADO PARA")
    canv.setFillColor(WHITE)
    canv.setFont(FONT_B, 16)
    canv.drawString(x, 172, D.INSTRUTOR["nome"])
    canv.setFillColor(colors.HexColor("#A9BAC9"))
    canv.setFont(FONT, 9.6)
    canv.drawString(x, 156, D.INSTRUTOR["titulo_profissional"])

    canv.setStrokeColor(colors.HexColor("#2A4763"))
    canv.setLineWidth(0.8)
    canv.line(x, 132, x + CONTENT_W, 132)

    cd = D.DOCUMENTO.get("cidade_data") or "____________________"
    canv.setFillColor(colors.HexColor("#93A4B4"))
    canv.setFont(FONT, 9)
    canv.drawString(x, 112, f"Emissão: {cd}")
    canv.drawString(x + CONTENT_W * 0.34, 112,
                    f"Versão: {D.DOCUMENTO.get('versao', '1.0')}")
    canv.setFillColor(colors.HexColor("#6B7D8D"))
    canv.setFont(FONT, 7.6)
    canv.drawString(x, 62, "Documento complementar à Proposta de Capacitação "
                           "Operacional em Drones · não constitui parecer jurídico")
    canv.restoreState()


def historia():
    st = []
    A = st.append

    # -------------------------------------------------------- sumário -------
    A(Paragraph("SUMÁRIO", S["H1"]))
    A(HRule(space_after=2, color=GOLD, thickness=1.4, width=48))
    A(Spacer(1, 4))
    A(HRule(space_after=10))
    A(toc_block([
        ("1", "A pergunta e a resposta honesta"),
        ("2", "Quem regula o quê na educação brasileira"),
        ("3", "Rota A — Curso livre bem fundamentado"),
        ("4", "Rota B — Extensão universitária com instituição credenciada"),
        ("5", "Rota C — Qualificação profissional técnica de nível médio"),
        ("6", "Rota D — Entidade de ensino cadastrada no MAPA (CAAR)"),
        ("7", "Rota E — Alinhamento ao exame teórico da ANAC"),
        ("8", "Rota F — Reconhecimento institucional e corporativo"),
        ("9", "Comparativo das seis rotas"),
        ("10", "Roteiro recomendado de implantação"),
        ("11", "Anatomia de um certificado em conformidade"),
        ("12", "Registro, numeração e rastreabilidade"),
        ("13", "O que nunca escrever — e por quê"),
        ("14", "Checklist de implantação"),
        ("15", "Base legal consolidada"),
    ]))
    A(Spacer(1, 20))
    A(Callout(
        "Para que serve este documento",
        ["Ele responde a uma pergunta prática — <i>como o Mizael pode emitir "
         "certificado reconhecido pelo MEC ou por outro órgão?</i> — e a "
         "responde sem contornar o ponto desconfortável: <b>a rota MEC não "
         "existe para esse tipo de curso</b>. O que existe é melhor, porque é "
         "verificável.",
         "É um documento de uso interno, mas as seções 1, 2, 9 e 11 podem ser "
         "apresentadas a uma corporação que questione a validade do "
         "certificado — e frequentemente resolvem a objeção na hora, porque "
         "demonstram domínio do assunto."],
        kind="gold"))
    A(PageBreak())

    # ------------------------------------------------------ 1. resposta -----
    A(SectionHeader(1, "A pergunta e a resposta honesta"))
    A(P(
        "A pergunta aparece em praticamente toda negociação: <i>\"esse "
        "certificado é reconhecido pelo MEC?\"</i>. Ela é feita de boa-fé — "
        "quem pergunta quer saber se o documento tem valor. Mas a pergunta "
        "está mal formulada, e responder \"sim\" para agradar cria um "
        "problema muito maior do que resolve."))
    A(Spacer(1, 5))
    A(Callout(
        "O que a legislação efetivamente diz",
        ["O Ministério da Educação atua sobre <b>educação básica, educação "
         "profissional técnica de nível médio e educação superior</b>. Cursos "
         "de <b>extensão, qualificação profissional e formação inicial e "
         "continuada</b> — categoria em que se enquadra qualquer curso de "
         "pilotagem de drone — <b>não se submetem a processo de autorização, "
         "reconhecimento ou credenciamento pelo Ministério</b>, porque a "
         "legislação brasileira não atribuiu ao MEC poder regulatório sobre "
         "essa modalidade.",
         "Consequência direta: não existe, nem pode existir, curso livre de "
         "drone \"reconhecido pelo MEC\". Quem anuncia isso está anunciando "
         "algo que o órgão não emite."],
        kind="alert"))
    A(Spacer(1, 6))
    A(Callout(
        "E a boa notícia, que é a parte que interessa",
        ["Não precisar de reconhecimento do MEC <b>não</b> significa que o "
         "certificado seja fraco. A validade do curso livre decorre de "
         "legislação própria — a <b>Lei nº 9.394/1996 (LDB), art. 42</b>, e o "
         "<b>Decreto nº 5.154/2004</b> — e o certificado tem "
         "<b>validade legal em todo o território nacional</b> como comprovação "
         "de capacitação, aperfeiçoamento, atualização, extensão ou "
         "qualificação profissional. Serve para averbação funcional, "
         "pontuação em progressão de carreira, horas complementares e "
         "comprovação em processo seletivo.",
         "O que sustenta o valor desse certificado não é uma chancela "
         "ministerial inexistente: é a <b>seriedade e a rastreabilidade de "
         "quem emite</b>. E isso se constrói — é justamente o que as rotas "
         "deste documento fazem."],
        kind="ok"))
    A(Spacer(1, 8))
    A(Paragraph("Como responder à objeção, em uma frase", S["H2"]))
    A(Callout(
        "Roteiro de resposta",
        ["<i>\"O MEC não reconhece curso de drone — e não reconhece o de "
         "nenhum concorrente meu, porque a lei não dá essa competência ao "
         "Ministério; ele regula educação básica, técnica e superior. Meu "
         "certificado é de curso livre de formação continuada, com fundamento "
         "no art. 42 da LDB e no Decreto 5.154/2004, tem validade nacional e "
         "é aceito para averbação funcional. Se a corporação precisar de "
         "certificado emitido por instituição credenciada pelo MEC, eu "
         "viabilizo por parceria de extensão universitária — e se o interesse "
         "for a área agrícola, o reconhecimento que realmente importa é o do "
         "Ministério da Agricultura, que eu \"</i>"
         + campo("preencher: já possuo / estou providenciando") + "<i>\".\"</i>",
         "Essa resposta converte melhor do que um \"sim\" falso, por um motivo "
         "simples: demonstra que você conhece a regulação melhor do que quem "
         "perguntou. Em venda para órgão público, isso é o argumento."],
        kind="info"))
    A(Spacer(1, 24))

    # ---------------------------------------------------- 2. quem regula ----
    A(SectionHeader(2, "Quem regula o quê na educação brasileira"))
    A(P("Entender esse mapa evita 90% dos erros de comunicação comercial e "
        "todos os riscos de autuação por publicidade enganosa."))
    A(Spacer(1, 5))
    A(data_table(
        [[P("Nível / modalidade", "Th"), P("Quem autoriza ou reconhece", "Th"),
          P("Exemplos", "Th"), P("Curso de drone se encaixa?", "Th")],
         [P("Educação superior — graduação e pós-graduação <i>stricto "
            "sensu</i>", "TdB"),
          P("MEC, com apoio do INEP e do CNE; pós <i>stricto sensu</i> "
            "avaliada pela CAPES", "TdSm"),
          P("Bacharelado, licenciatura, tecnólogo, mestrado, doutorado",
            "TdSm"),
          P("Não — salvo se você constituir ou se associar a uma instituição "
            "de ensino superior credenciada", "TdSm")],
         [P("Pós-graduação <i>lato sensu</i> (especialização)", "TdB"),
          P("Ofertada por instituição credenciada pelo MEC, sob as regras do "
            "CNE", "TdSm"),
          P("Especialização em geoprocessamento, em agricultura de precisão",
            "TdSm"),
          P("Sim, como disciplina dentro de uma especialização de uma "
            "instituição credenciada", "TdSm")],
         [P("Educação profissional técnica de nível médio", "TdB"),
          P("Sistema de ensino ao qual a escola pertence — em regra o "
            "<b>Conselho Estadual de Educação</b>; registro no SISTEC",
            "TdSm"),
          P("Técnico em Agronegócio, em Agrimensura, em Geoprocessamento",
            "TdSm"),
          P("Sim, como qualificação profissional técnica — <b>Rota C</b>",
            "TdSm")],
         [P("Extensão universitária", "TdB"),
          P("A própria instituição credenciada, em regulamento próprio — "
            "<b>sem</b> processo de reconhecimento no MEC", "TdSm"),
          P("Curso de extensão em operação de RPA", "TdSm"),
          P("Sim, por parceria — <b>Rota B</b>", "TdSm")],
         [P("Formação inicial e continuada / qualificação profissional "
            "(curso livre)", "TdB"),
          P("<b>Ninguém autoriza previamente.</b> Base legal direta na LDB, "
            "art. 42, e no Decreto nº 5.154/2004", "TdSm"),
          P("Curso de pilotagem de drone, curso de pulverização, capacitação "
            "corporativa", "TdSm"),
          P("Sim — é aqui que o curso está hoje — <b>Rota A</b>", "TdSm")],
         [P("Capacitação técnica setorial", "TdB"),
          P("O órgão regulador do <b>setor</b>, não o MEC: MAPA, ANAC, "
            "ANATEL, conselhos profissionais", "TdSm"),
          P("CAAR (MAPA), exame teórico de piloto remoto (ANAC)", "TdSm"),
          P("<b>Sim — e é aqui que está o reconhecimento oficial que vale "
            "mais</b> — Rotas D e E", "TdSm")],
         ],
        [CONTENT_W * 0.235, CONTENT_W * 0.265, CONTENT_W * 0.235,
         CONTENT_W * 0.265], pad=4))
    A(Spacer(1, 8))
    A(Callout(
        "A conclusão estratégica",
        ["Para um curso de drone, perseguir o MEC é perseguir o órgão errado. "
         "O reconhecimento que efetivamente agrega valor — e que um "
         "comprador institucional sabe verificar — vem do "
         "<b>órgão regulador do setor</b>: o MAPA para aplicação "
         "aeroagrícola, a ANAC para a competência do piloto. Somado a uma "
         "parceria de extensão com instituição credenciada, quando o edital "
         "exigir esse formato, o conjunto é mais forte do que qualquer "
         "alegação de \"reconhecido pelo MEC\" — e sobrevive a auditoria."],
        kind="ok"))
    A(Spacer(1, 24))

    # ---------------------------------------------------------- rota A ------
    A(SectionHeader(3, "Rota A — Curso livre bem fundamentado",
                    "Situação atual. Prazo: imediato. Custo: baixo."))
    A(P("É a base de tudo e já está disponível hoje. O objetivo desta rota não "
        "é obter autorização — ela não é necessária — e sim <b>blindar</b> a "
        "oferta: deixar a documentação, o certificado e a comunicação "
        "comercial em conformidade, de modo que nenhuma corporação consiga "
        "questionar a validade do que foi contratado."))
    A(Spacer(1, 6))
    A(Paragraph("Base legal", S["H2"]))
    A(kv_table([
        ("Fundamento principal",
         "Lei nº 9.394/1996 (LDB), art. 42 — cursos de livre oferta, abertos à "
         "comunidade, com matrícula condicionada à capacidade de "
         "aproveitamento e não ao nível de escolaridade; sem carga horária "
         "preestabelecida."),
        ("Fundamento complementar",
         "Decreto nº 5.154/2004 — organização da educação profissional, "
         "incluindo a formação inicial e continuada."),
        ("Natureza", "Educação não formal. Não se submete a autorização, "
                     "reconhecimento ou credenciamento pelo MEC."),
        ("Efeito do certificado",
         "Validade legal em todo o território nacional como comprovação de "
         "capacitação, aperfeiçoamento, atualização, extensão ou qualificação "
         "profissional."),
    ], label_w=0.26))
    A(Spacer(1, 8))
    A(Paragraph("O que fazer, na prática", S["H2"]))
    for b in numbered([
        "<b>Formalizar a pessoa jurídica</b> com CNAE de atividade compatível — "
        "usualmente <b>8599-6/04</b>, treinamento em desenvolvimento "
        "profissional e gerencial. Isso não é exigência de validade do "
        "certificado, mas é o primeiro item que um setor de contratos de órgão "
        "público confere. Situação atual: " + D.ins("cnae", "preencher: CNAE"),
        "<b>Redigir e arquivar o projeto pedagógico</b> de cada trilha: "
        "objetivo, público, pré-requisitos, conteúdo programático por módulo, "
        "carga horária, metodologia, critério de avaliação e critério de "
        "aprovação. É o documento que sustenta o certificado se ele for "
        "questionado.",
        "<b>Instituir regulamento de emissão de certificados</b>: quem assina, "
        "qual o critério mínimo de frequência e aproveitamento, como se numera, "
        "como se registra, por quanto tempo se guarda e como se verifica "
        "autenticidade.",
        "<b>Manter livro de registro de certificados</b> — físico ou digital — "
        "com numeração sequencial e sem lacuna. Sem isso, o certificado é uma "
        "folha bonita sem lastro documental.",
        "<b>Guardar as evidências de cada turma</b>: lista de presença "
        "assinada, instrumentos de avaliação corrigidos, plano de aula "
        "executado e registro fotográfico da parte prática. Prazo de guarda "
        "recomendado: cinco anos.",
        "<b>Revisar toda a comunicação comercial</b> à luz da seção 13 deste "
        "documento — site, redes, proposta e o próprio certificado.",
    ]):
        A(b)
    A(Spacer(1, 8))
    A(data_table(
        [[P("O que você PODE afirmar", "Th"), P("O que você NÃO PODE afirmar",
                                               "Th")],
         [P("\"Certificado de curso livre de capacitação profissional, com "
            "fundamento na Lei nº 9.394/1996, art. 42, e no Decreto nº "
            "5.154/2004.\"<br/><br/>"
            "\"Certificado com validade legal em todo o território "
            "nacional.\"<br/><br/>"
            "\"Válido para comprovação de capacitação e qualificação "
            "profissional.\"<br/><br/>"
            "\"Curso livre — não requer autorização do MEC, por não estar "
            "sujeito à regulação ministerial.\"", "TdSm"),
          P("\"Reconhecido pelo MEC.\"<br/><br/>"
            "\"Autorizado pelo MEC\" ou \"credenciado pelo MEC\".<br/><br/>"
            "\"Diploma\" — curso livre emite <b>certificado</b>, não "
            "diploma.<br/><br/>"
            "\"Habilita legalmente a pilotar\" — a competência do piloto vem "
            "do exame da ANAC, não do seu curso.<br/><br/>"
            "\"Equivalente a curso técnico.\"", "TdSm")],
         ],
        [CONTENT_W * 0.5, CONTENT_W * 0.5]))
    A(Spacer(1, 24))

    # ---------------------------------------------------------- rota B ------
    A(SectionHeader(4, "Rota B — Extensão universitária com instituição "
                       "credenciada",
                    "Prazo: 2 a 6 meses. Custo: médio. Alto impacto comercial."))
    A(P(
        "Esta é a rota que resolve, de forma legítima, a exigência de "
        "\"certificado com respaldo do MEC\" que às vezes aparece em edital. "
        "O mecanismo é simples: quem emite o certificado é uma "
        "<b>instituição de ensino superior credenciada pelo MEC</b>, na "
        "modalidade de <b>extensão universitária</b>. O credenciamento é da "
        "instituição — e é real, verificável e citável. Você entra como "
        "conteudista e instrutor responsável."))
    A(Spacer(1, 5))
    A(Callout(
        "Precisão importante para não repetir o erro",
        ["O curso de extensão em si <b>não</b> é \"reconhecido pelo MEC\" — a "
         "extensão é regida por regulamento próprio da instituição e não passa "
         "por processo de reconhecimento ministerial. O que é credenciado pelo "
         "MEC é a <b>instituição emissora</b>. A formulação correta, e "
         "defensável em auditoria, é: <i>\"certificado de extensão "
         "universitária emitido pela [instituição], credenciada pelo MEC\"</i> "
         "— e nunca <i>\"curso reconhecido pelo MEC\"</i>."],
        kind="alert"))
    A(Spacer(1, 6))
    A(Paragraph("Como estruturar", S["H2"]))
    for b in numbered([
        "<b>Selecionar a instituição parceira.</b> Priorize faculdades, "
        "centros universitários e institutos federais da sua região com curso "
        "de Agronomia, Engenharia Agrícola, Agronegócio ou Geoprocessamento — "
        "há afinidade temática e interesse institucional em extensão. "
        "Confirme o credenciamento na consulta pública do e-MEC antes de "
        "qualquer conversa.",
        "<b>Levar uma proposta pronta.</b> A instituição tem pouco tempo e "
        "muita burocracia; quem chega com projeto pedagógico redigido, carga "
        "horária definida, ementa por módulo e material didático montado tem "
        "chance real de aprovação. Quem chega com uma ideia, não.",
        "<b>Definir o modelo de parceria.</b> Os formatos usuais são: curso de "
        "extensão da instituição com você como instrutor contratado; convênio "
        "de cooperação técnica com divisão de receita; ou você como docente de "
        "disciplina em curso de extensão maior. O ponto sensível a acordar por "
        "escrito é a <b>titularidade do material didático</b>.",
        "<b>Formalizar por instrumento escrito</b> — convênio, contrato ou "
        "termo de cooperação — com objeto, carga horária, responsabilidades, "
        "modelo de certificado, vigência e propriedade intelectual.",
        "<b>Submeter à instância competente</b> da instituição (colegiado, "
        "câmara ou pró-reitoria de extensão). É esta aprovação que autoriza a "
        "emissão do certificado em nome da instituição.",
    ]):
        A(b)
    A(Spacer(1, 8))
    A(data_table(
        [[P("Vantagens", "Th"), P("Pontos de atenção", "Th")],
         [P("Atende exigência de edital que pede certificado de instituição "
            "credenciada pelo MEC.<br/><br/>"
            "Certificado com marca institucional — peso comercial "
            "imediato.<br/><br/>"
            "Acesso a estrutura física, laboratório e área para a parte "
            "prática.<br/><br/>"
            "Abre caminho para disciplina em pós-graduação "
            "<i>lato sensu</i>.<br/><br/>"
            "Pode gerar horas complementares para alunos da própria "
            "instituição.", "TdSm"),
          P("Prazo de aprovação interna é lento e imprevisível.<br/><br/>"
            "Divisão de receita reduz a margem por turma.<br/><br/>"
            "A instituição pode exigir titulação mínima do docente — verifique "
            "no início da conversa.<br/><br/>"
            "Risco de perder a titularidade do material se o contrato for "
            "malfeito.<br/><br/>"
            "Você passa a depender do calendário e do ritmo da instituição.",
            "TdSm")],
         ],
        [CONTENT_W * 0.5, CONTENT_W * 0.5]))
    A(Spacer(1, 24))

    # ---------------------------------------------------------- rota C ------
    A(SectionHeader(5, "Rota C — Qualificação profissional técnica de nível "
                       "médio",
                    "Prazo: 12 meses ou mais. Custo: alto. Maior formalidade."))
    A(P(
        "É a rota mais robusta e a mais trabalhosa. Aqui o curso passa a "
        "integrar o <b>sistema formal de ensino</b> como qualificação "
        "profissional técnica de nível médio, com registro no SISTEC. Faz "
        "sentido como projeto de médio prazo, não como solução para a próxima "
        "negociação."))
    A(Spacer(1, 6))
    A(Paragraph("Como funciona", S["H2"]))
    for b in bullets([
        "A autorização não vem do MEC diretamente: cursos técnicos de nível "
        "médio são autorizados pelo <b>sistema de ensino ao qual a escola "
        "pertence</b> — em regra o <b>Conselho Estadual de Educação</b> do "
        "estado onde a instituição está sediada.",
        "Exige constituir ou se associar a uma <b>instituição de educação "
        "profissional</b> credenciada pelo respectivo sistema de ensino, com "
        "corpo docente titulado, infraestrutura, regimento escolar, projeto "
        "pedagógico e secretaria escolar.",
        "O curso deve dialogar com o <b>Catálogo Nacional de Cursos "
        "Técnicos</b>. A operação de drone tipicamente entra como "
        "<b>qualificação profissional</b> dentro de eixos como Recursos "
        "Naturais, Controle e Processos Industriais ou Informação e "
        "Comunicação, ou como itinerário formativo de um técnico já "
        "catalogado.",
        "Os certificados e diplomas passam a ser registrados no <b>SISTEC</b>, "
        "com validade nacional no sistema formal — inclusive para fins de "
        "comprovação de escolaridade técnica.",
    ]):
        A(b)
    A(Spacer(1, 7))
    A(Callout(
        "Recomendação prática",
        ["Não comece por aqui. O caminho realista é <b>associar-se a uma "
         "escola técnica que já seja credenciada</b> e oferecer o curso como "
         "qualificação dentro da estrutura dela — em vez de credenciar uma "
         "instituição própria. O esforço cai de anos para meses, e o efeito "
         "comercial é praticamente o mesmo.",
         "Como o credenciamento é estadual, os requisitos variam. Confirme as "
         "exigências no Conselho Estadual de Educação do seu estado antes de "
         "assumir qualquer compromisso — este documento não substitui essa "
         "consulta."],
        kind="info"))
    A(Spacer(1, 12))

    # ---------------------------------------------------------- rota D ------
    A(SectionHeader(6, "Rota D — Entidade de ensino cadastrada no MAPA (CAAR)",
                    "Prazo: 3 a 8 meses. Custo: médio. A rota de maior retorno."))
    A(Callout(
        "Esta é a rota mais importante deste documento",
        ["Se a especialidade é <b>drone agrícola</b>, aqui está o "
         "reconhecimento oficial que realmente existe, que é exigido por lei "
         "e que o cliente <b>não tem alternativa</b> senão contratar de quem "
         "o possui. Não é um selo de marketing: é uma condição de "
         "regularidade da operação do cliente.",
         "Enquanto o MEC simplesmente não se aplica ao caso, o Ministério da "
         "Agricultura e Pecuária <b>tem</b> um procedimento formal de "
         "cadastramento de entidades de ensino — e quem obtém esse cadastro "
         "passa a ocupar uma posição que a maior parte dos concorrentes não "
         "consegue ocupar."],
        kind="ok"))
    A(Spacer(1, 6))
    A(Paragraph("O quadro normativo", S["H2"]))
    A(kv_table([
        ("Norma", "Portaria MAPA nº 298, de 22 de setembro de 2021, vigente "
                  "desde 1º de outubro de 2021."),
        ("Objeto", "Uso de aeronave remotamente pilotada (ARP) para aplicação "
                   "de agrotóxicos e afins, adjuvantes, fertilizantes, "
                   "inoculantes, corretivos e sementes."),
        ("Registro do operador", "Obrigatório junto ao MAPA, por requerimento "
                                 "no SIPEAGRO."),
        ("Exigência para o piloto",
         "Curso de Aplicação Aeroagrícola Remota — <b>CAAR</b> — reconhecido "
         "pelo Ministério."),
        ("Conteúdo mínimo do CAAR",
         "28 horas, com módulos de características das ARP, legislação e boas "
         "práticas; pragas, doenças e tecnologia de aplicação; componentes da "
         "ARP, planejamento operacional e segurança; e prova final."),
        ("Quem pode ministrar",
         "Entidades de ensino <b>cadastradas pelo MAPA</b>, com "
         "<b>homologação de cada turma</b>."),
    ], label_w=0.28))
    A(Spacer(1, 8))
    A(Paragraph("Passos para obter o cadastro", S["H2"]))
    for b in numbered([
        "<b>Obter o CAAR como aluno primeiro</b>, se ainda não o tem — é "
        "condição de credibilidade antes de pleitear o cadastro como "
        "entidade. Situação atual: " + D.ins("curso_caar",
                                             "preencher: possui CAAR?"),
        "<b>Constituir a pessoa jurídica</b> com objeto social e CNAE "
        "compatíveis com prestação de serviço de treinamento.",
        "<b>Montar o projeto do curso</b> aderente ao conteúdo mínimo de 28 "
        "horas, com ementa por módulo, carga horária, material didático, "
        "instrumento de prova final e critério de aprovação.",
        "<b>Comprovar corpo docente qualificado</b>, incluindo responsável "
        "técnico habilitado para os módulos de pragas, doenças e tecnologia de "
        "aplicação — tipicamente engenheiro agrônomo com registro em conselho. "
        "Situação atual: " + D.ins("registro_conselho",
                                   "preencher: responsável técnico"),
        "<b>Comprovar estrutura</b> para as partes teórica e prática: sala, "
        "aeronave de pulverização, equipamento de proteção individual e área "
        "para exercício.",
        "<b>Protocolar o requerimento de cadastramento</b> junto ao MAPA e "
        "acompanhar a exigência de <b>homologação de cada turma</b> — é uma "
        "obrigação continuada, não um selo obtido uma única vez.",
        "<b>Acompanhar a atualização normativa.</b> Há expectativa de novo "
        "decreto e nova portaria substituindo o regime atual, sob a "
        "justificativa de que a tecnologia evoluiu além da norma de 2021. "
        "Confirme a versão vigente no Ministério antes de protocolar.",
    ]):
        A(b)
    A(Spacer(1, 6))
    A(Callout(
        "Enquanto o cadastro não sair",
        ["A trilha agrícola pode e deve continuar sendo oferecida — mas "
         "descrita como <b>capacitação técnica estruturada conforme o conteúdo "
         "mínimo do CAAR</b>, e nunca como CAAR. Emitir certificado "
         "apresentado como CAAR sem o cadastro da entidade e a homologação da "
         "turma cria dois problemas simultâneos: o certificado não serve ao "
         "cliente para o registro que ele precisa, e a oferta fica exposta "
         "como informação enganosa."],
        kind="alert"))
    A(Spacer(1, 24))

    # ---------------------------------------------------------- rota E ------
    A(SectionHeader(7, "Rota E — Alinhamento ao exame teórico da ANAC",
                    "Prazo: imediato. Custo: nenhum. Argumento comercial forte."))
    A(P(
        "A ANAC não credencia escolas de drone e não homologa cursos livres — "
        "não existe \"curso autorizado pela ANAC\". O que existe, e é novo, é "
        "o <b>exame teórico de conhecimentos</b> exigido do piloto remoto. E "
        "aí surge uma oportunidade objetiva: o curso pode ser <b>alinhado ao "
        "conteúdo do exame</b> e vendido pelo resultado — aprovação do aluno."))
    A(Spacer(1, 5))
    A(Paragraph("Os fatos que sustentam o argumento", S["H2"]))
    A(kv_table([
        ("Exigência", "Aprovação em exame teórico da ANAC para todo piloto "
                      "remoto de aeronave não isenta — acima de 250 g — em "
                      "qualquer categoria de operação."),
        ("Vigência", "Obrigatória a partir de <b>1º de janeiro de 2027</b>. A "
                     "Resolução nº 805 dispensa o cumprimento até "
                     "<b>31 de dezembro de 2026</b>."),
        ("Formato", "20 questões sobre fundamentos do RBAC nº 100, espaço "
                    "aéreo, risco e operação de drones — regras de voo, "
                    "categorias por risco, cadastro, autorização e "
                    "responsabilidades."),
        ("Acesso", "Disponível no portal de capacitação da ANAC e realizável "
                   "gratuitamente."),
    ], label_w=0.20))
    A(Spacer(1, 8))
    A(Paragraph("Como transformar isso em proposta", S["H2"]))
    for b in bullets([
        "<b>Mapear a grade contra o conteúdo do exame</b>, módulo por módulo, "
        "e incluir esse mapeamento como anexo da proposta. Um comprador "
        "institucional consegue conferir — e isso vale mais do que adjetivo.",
        "<b>Aplicar simulado no mesmo formato</b> — 20 questões — como "
        "avaliação final do curso, e entregar o desempenho individual à "
        "corporação.",
        "<b>Vender o prazo, não o curso.</b> A obrigatoriedade começa em "
        "1º/1/2027 e a dispensa termina em 31/12/2026. Toda instituição que "
        "opera drone hoje tem uma janela definida, e ela está se fechando.",
        "<b>Ser preciso na linguagem.</b> Diga <i>\"curso preparatório para o "
        "exame teórico de piloto remoto da ANAC\"</i>. Nunca <i>\"curso "
        "autorizado\"</i>, <i>\"credenciado\"</i> ou <i>\"homologado pela "
        "ANAC\"</i> — nada disso existe.",
        "<b>Fazer o exame você mesmo e divulgar a aprovação.</b> É gratuito, "
        "verificável e resolve de imediato a pergunta \"o instrutor é "
        "habilitado?\". Situação atual: " + D.ins("exame_teorico_anac",
                                                  "preencher: já fez o exame?"),
    ]):
        A(b)
    A(Spacer(1, 12))

    # ---------------------------------------------------------- rota F ------
    A(SectionHeader(8, "Rota F — Reconhecimento institucional e corporativo",
                    "Prazo: por negociação. Custo: nenhum. Efeito imediato na venda."))
    A(P(
        "Rota frequentemente ignorada e, para o público de segurança pública, "
        "muitas vezes a <b>mais decisiva</b>. Para um policial, o que dá valor "
        "concreto ao certificado não é a chancela de um ministério: é a "
        "<b>averbação na ficha funcional</b> e a <b>pontuação em progressão de "
        "carreira</b>. Isso não depende do MEC — depende da própria "
        "corporação."))
    A(Spacer(1, 6))
    A(Paragraph("O que buscar em cada negociação", S["H2"]))
    for b in numbered([
        "<b>Averbação funcional.</b> Solicite, já na proposta, que a "
        "corporação reconheça a capacitação para fins de averbação. Basta que "
        "o certificado atenda aos requisitos formais internos — que costumam "
        "ser carga horária mínima, conteúdo programático no verso e "
        "identificação do responsável.",
        "<b>Publicação em boletim interno.</b> Curso concluído e publicado em "
        "boletim tem efeito permanente no histórico do militar ou servidor — e "
        "gera prova social interna que abre a próxima turma sozinha.",
        "<b>Chancela conjunta com a escola de formação da corporação.</b> "
        "Muitas instituições têm academia, centro de formação ou diretoria de "
        "ensino próprios que podem <b>coemitir</b> o certificado. Um "
        "certificado com o brasão da corporação vale, internamente, mais do "
        "que qualquer selo externo.",
        "<b>Credenciamento como instrutor externo.</b> Algumas corporações "
        "mantêm cadastro de instrutores credenciados. Entrar nesse cadastro "
        "transforma venda pontual em recorrência.",
        "<b>Inclusão na matriz curricular interna.</b> O objetivo final: o "
        "conteúdo de drone virar disciplina permanente do currículo de "
        "formação e de atualização da corporação — com você como conteudista "
        "de referência.",
    ]):
        A(b)
    A(Spacer(1, 7))
    A(Callout(
        "Por que essa rota converte tanto",
        ["Ela inverte a conversa. Em vez de você tentar provar que seu "
         "certificado tem valor externo, a corporação passa a atribuir valor "
         "interno a ele — e é esse valor que o aluno percebe. Um sargento "
         "quer o curso que pontua na promoção dele; o nome do órgão que "
         "chancelou é secundário."],
        kind="ok"))
    A(Spacer(1, 24))

    # ------------------------------------------------------ 9. comparativo --
    A(SectionHeader(9, "Comparativo das seis rotas"))
    A(data_table(
        [[P("Rota", "Th"), P("Prazo", "Th"), P("Custo", "Th"),
          P("O que passa a poder afirmar", "Th"), P("Prioridade", "Th")],
         [P("A · Curso livre fundamentado", "TdB"), P("Imediato", "TdSm"),
          P("Baixo", "TdSm"),
          P("Certificado de curso livre com fundamento na LDB, art. 42, e no "
            "Decreto nº 5.154/2004, com validade nacional.", "TdSm"),
          P("<b>1ª</b><br/>Fazer agora", "TdSm")],
         [P("E · Alinhamento ao exame da ANAC", "TdB"), P("Imediato", "TdSm"),
          P("Nenhum", "TdSm"),
          P("Curso preparatório para o exame teórico de piloto remoto da ANAC, "
            "com simulado no formato oficial.", "TdSm"),
          P("<b>1ª</b><br/>Fazer agora", "TdSm")],
         [P("F · Reconhecimento corporativo", "TdB"),
          P("Por negociação", "TdSm"), P("Nenhum", "TdSm"),
          P("Capacitação reconhecida pela corporação para averbação funcional "
            "e progressão de carreira.", "TdSm"),
          P("<b>1ª</b><br/>Em cada proposta", "TdSm")],
         [P("D · Cadastro no MAPA (CAAR)", "TdB"), P("3 a 8 meses", "TdSm"),
          P("Médio", "TdSm"),
          P("Entidade de ensino cadastrada no MAPA, apta a ministrar o CAAR — "
            "curso exigido por norma federal.", "TdSm"),
          P("<b>2ª</b><br/>Maior retorno", "TdSm")],
         [P("B · Extensão universitária", "TdB"), P("2 a 6 meses", "TdSm"),
          P("Médio", "TdSm"),
          P("Certificado de extensão emitido por instituição credenciada pelo "
            "MEC.", "TdSm"),
          P("<b>3ª</b><br/>Quando o edital exigir", "TdSm")],
         [P("C · Qualificação técnica de nível médio", "TdB"),
          P("12 meses ou mais", "TdSm"), P("Alto", "TdSm"),
          P("Qualificação profissional técnica integrante do sistema formal de "
            "ensino, com registro no SISTEC.", "TdSm"),
          P("<b>4ª</b><br/>Projeto de médio prazo", "TdSm")],
         ],
        [CONTENT_W * 0.19, CONTENT_W * 0.115, CONTENT_W * 0.085,
         CONTENT_W * 0.42, CONTENT_W * 0.19], pad=4))
    A(Spacer(1, 10))
    A(Callout(
        "Leitura do quadro",
        ["As três primeiras rotas custam pouco ou nada e podem estar "
         "implantadas em semanas — juntas, elas já resolvem a objeção de "
         "certificação em qualquer negociação. A rota D é onde está o retorno "
         "real de médio prazo, porque cria uma barreira de entrada que os "
         "concorrentes não superam facilmente. A rota B só compensa quando um "
         "edital específico exigir instituição credenciada. A rota C é "
         "ambição, não urgência."],
        kind="gold"))
    A(Spacer(1, 24))

    # ------------------------------------------------------- 10. roteiro ----
    A(SectionHeader(10, "Roteiro recomendado de implantação"))
    A(Paragraph("Fase 1 — Primeiros 30 dias  ·  arrumar a casa", S["H2"]))
    A(checklist_table([
        "Pessoa jurídica formalizada com CNAE de treinamento compatível.",
        "Projeto pedagógico escrito e arquivado para cada trilha ofertada.",
        "Regulamento de emissão de certificados instituído por escrito.",
        "Livro de registro de certificados criado, com numeração sequencial.",
        "Modelo de certificado revisado — frente e verso (seção 11).",
        "Site, redes sociais, proposta e apresentação revisados à luz da "
        "seção 13.",
        "Exame teórico de piloto remoto da ANAC realizado pelo instrutor.",
        "Grade mapeada contra o conteúdo do exame da ANAC, em anexo à "
        "proposta.",
    ]))
    A(Spacer(1, 10))
    A(Paragraph("Fase 2 — 30 a 90 dias  ·  transformar em argumento de venda",
                S["H2"]))
    A(checklist_table([
        "Simulado de 20 questões no formato oficial implantado como avaliação "
        "final.",
        "Pedido de averbação funcional incluído como cláusula padrão nas "
        "propostas.",
        "Contato com a diretoria de ensino de pelo menos duas corporações para "
        "coemissão de certificado.",
        "CAAR obtido como aluno, se ainda não possuído.",
        "Instituições de ensino superior da região mapeadas, com "
        "credenciamento conferido no e-MEC.",
        "Proposta de curso de extensão redigida e protocolada em pelo menos "
        "uma instituição.",
    ]))
    A(Spacer(1, 10))
    A(Paragraph("Fase 3 — 90 a 240 dias  ·  construir a barreira de entrada",
                S["H2"]))
    A(checklist_table([
        "Responsável técnico habilitado identificado e formalizado para os "
        "módulos agronômicos.",
        "Estrutura de aula prática comprovável — aeronave de pulverização, EPI "
        "e área.",
        "Requerimento de cadastramento como entidade de ensino protocolado no "
        "MAPA.",
        "Versão vigente da norma do MAPA conferida antes do protocolo.",
        "Rotina de homologação de turma incorporada ao processo interno.",
        "Convênio de extensão universitária assinado, se aprovado.",
    ]))
    A(Spacer(1, 10))
    A(Paragraph("Fase 4 — a partir de 240 dias  ·  consolidar", S["H2"]))
    A(checklist_table([
        "Avaliação de viabilidade da rota C, isolada ou por associação a "
        "escola técnica já credenciada.",
        "Verificação de autenticidade de certificado disponibilizada "
        "publicamente.",
        "Portfólio de turmas realizadas documentado, com autorização de uso.",
        "Credenciamento como instrutor externo pleiteado nas corporações "
        "atendidas.",
    ]))
    A(Spacer(1, 24))

    # -------------------------------------------------- 11. certificado -----
    A(SectionHeader(11, "Anatomia de um certificado em conformidade",
                    "O documento que sustenta — ou derruba — toda a operação."))
    A(P("Um certificado mal redigido anula o trabalho de um curso bem dado. Os "
        "dois quadros abaixo são o gabarito mínimo."))
    A(Spacer(1, 7))

    A(Paragraph("Frente", S["H2"]))
    A(data_table(
        [[P("Elemento", "Th"), P("Conteúdo e cuidado necessário", "Th")],
         [P("Identificação do emissor", "TdB"),
          P("Razão social completa, CNPJ e endereço. Se houver coemissão com "
            "instituição parceira, ambas as identificações.", "TdSm")],
         [P("Título do documento", "TdB"),
          P("<b>CERTIFICADO</b>. Nunca \"diploma\" — diploma é ato do sistema "
            "formal de ensino.", "TdSm")],
         [P("Qualificação do concluinte", "TdB"),
          P("Nome completo e documento de identificação. Para público "
            "militar, incluir posto ou graduação e unidade — é o que permite a "
            "averbação.", "TdSm")],
         [P("Objeto", "TdB"),
          P("Denominação exata do curso e da trilha, carga horária total em "
            "horas e período de realização.", "TdSm")],
         [P("Natureza e fundamento", "TdB"),
          P("Texto expresso: <i>\"Curso livre de formação continuada, "
            "ministrado nos termos da Lei nº 9.394/1996, art. 42, e do Decreto "
            "nº 5.154/2004.\"</i> É esta linha que responde à objeção do MEC "
            "sem precisar de conversa.", "TdSm")],
         [P("Local e data de emissão", "TdB"),
          P("Cidade, unidade federativa e data.", "TdSm")],
         [P("Número de registro", "TdB"),
          P("Número único, sequencial, correspondente ao livro de registro. "
            "Sugestão de formato: <b>AAAA-TT-NNN</b> — ano, número da turma, "
            "número do aluno.", "TdSm")],
         [P("Assinatura", "TdB"),
          P("Nome, qualificação e assinatura do instrutor responsável. Se "
            "houver coemissão, assinatura do representante da instituição "
            "parceira.", "TdSm")],
         [P("Verificação de autenticidade", "TdB"),
          P("Meio de conferência — código, QR ou página de consulta. Item que "
            "mais eleva a percepção de seriedade e o mais frequentemente "
            "ausente no mercado.", "TdSm")],
         ],
        [CONTENT_W * 0.24, CONTENT_W * 0.76]))
    A(Spacer(1, 10))

    A(Paragraph("Verso — obrigatório para averbação funcional", S["H2"]))
    A(P("Sem o verso, muitas corporações recusam a averbação por "
        "impossibilidade de conferir o conteúdo. É o item que transforma o "
        "certificado em documento útil para o aluno.", "CorpoSm"))
    A(Spacer(1, 3))
    A(data_table(
        [[P("Elemento", "Th"), P("Conteúdo", "Th")],
         [P("Conteúdo programático", "TdB"),
          P("Relação de módulos com a respectiva carga horária individual, "
            "somando exatamente a carga horária declarada na frente.", "TdSm")],
         [P("Metodologia", "TdB"),
          P("Proporção entre carga teórica e prática, e recursos "
            "empregados.", "TdSm")],
         [P("Critério de aprovação", "TdB"),
          P("Frequência mínima e nota mínima exigidas, com o desempenho "
            "efetivamente alcançado pelo concluinte, quando aplicável.",
            "TdSm")],
         [P("Corpo docente", "TdB"),
          P("Nome e qualificação de cada instrutor que atuou na turma.",
            "TdSm")],
         [P("Base normativa do conteúdo", "TdB"),
          P("Indicação expressa das normas técnicas que fundamentaram a grade "
            "— RBAC nº 100, ICA 100-40, Portaria MAPA nº 298/2021. Demonstra "
            "atualidade e é um diferencial verificável.", "TdSm")],
         [P("Ressalva de alcance", "TdB"),
          P("Nota expressa de que se trata de curso livre, não sujeito a "
            "reconhecimento pelo MEC, e de que a habilitação para operação de "
            "aeronave não tripulada observa a regulação da ANAC. Essa ressalva "
            "<b>protege</b> quem emite.", "TdSm")],
         ],
        [CONTENT_W * 0.24, CONTENT_W * 0.76]))
    A(Spacer(1, 24))

    # ------------------------------------------------------- 12. registro ---
    A(SectionHeader(12, "Registro, numeração e rastreabilidade"))
    A(P(
        "Este é o ponto que separa uma operação de treinamento séria de uma "
        "fábrica de papel. Como não há órgão autorizando previamente o curso "
        "livre, a <b>consistência documental do emissor</b> é o que sustenta o "
        "certificado quando ele é questionado — em auditoria, em processo "
        "administrativo ou em juízo."))
    A(Spacer(1, 6))
    A(Paragraph("Estrutura mínima de controle", S["H2"]))
    A(data_table(
        [[P("Instrumento", "Th"), P("Conteúdo", "Th"), P("Guarda", "Th")],
         [P("Livro de registro de certificados", "TdB"),
          P("Número sequencial, data de emissão, nome e documento do "
            "concluinte, curso, carga horária, turma e resultado. Sem lacuna "
            "na numeração — lacuna é o primeiro indício de fragilidade.",
            "TdSm"),
          P("Permanente", "TdSm")],
         [P("Pasta de turma", "TdB"),
          P("Lista de presença assinada por dia, plano de aula executado, "
            "instrumentos de avaliação corrigidos, ata de resultado final e "
            "registro fotográfico da parte prática.", "TdSm"),
          P("5 anos", "TdSm")],
         [P("Projeto pedagógico vigente", "TdB"),
          P("Versão aplicada a cada turma, com data de vigência — para "
            "demonstrar o que foi efetivamente ministrado em cada período.",
            "TdSm"),
          P("Permanente", "TdSm")],
         [P("Contratos e convênios", "TdB"),
          P("Instrumentos com corporações e instituições parceiras, com "
            "objeto, carga horária e modelo de certificado acordado.", "TdSm"),
          P("5 anos após o término", "TdSm")],
         [P("Documentação do instrutor", "TdB"),
          P("Certificados, exames, cadastros e registros profissionais "
            "próprios, atualizados — é a primeira coisa que um setor de "
            "contratos pede.", "TdSm"),
          P("Permanente", "TdSm")],
         ],
        [CONTENT_W * 0.24, CONTENT_W * 0.60, CONTENT_W * 0.16]))
    A(Spacer(1, 8))
    A(Paragraph("Verificação de autenticidade", S["H2"]))
    for b in bullets([
        "Uma página pública simples, onde se digita o número do certificado e "
        "aparecem nome, curso, carga horária e data, já resolve — não é "
        "necessário sistema complexo.",
        "QR code impresso no certificado apontando para essa consulta. Custo "
        "praticamente zero e efeito grande na percepção de seriedade.",
        "Cuidado com dado pessoal: exibir apenas o necessário para conferência "
        "e evitar expor documento de identificação completo na consulta "
        "pública.",
        "Proteção contra fraude: numeração não previsível e conferência "
        "cruzada com o livro de registro antes de confirmar qualquer "
        "autenticidade por escrito.",
    ], style="CorpoSm"):
        A(b)
    A(Spacer(1, 12))

    # -------------------------------------------------- 13. nunca escrever --
    A(SectionHeader(13, "O que nunca escrever — e por quê"))
    A(P(
        "As afirmações abaixo aparecem com frequência no mercado de cursos de "
        "drone. Todas são incorretas, e algumas expõem quem as usa a "
        "responsabilização por publicidade enganosa — o Código de Defesa do "
        "Consumidor, art. 37, veda a publicidade capaz de induzir o "
        "consumidor a erro sobre a natureza e a qualidade do serviço. Diante "
        "de órgão público, o problema é maior: informação inverídica em "
        "processo de contratação tem desdobramento administrativo próprio."))
    A(Spacer(1, 6))
    A(data_table(
        [[P("Não escreva", "Th"), P("Por que é incorreto", "Th"),
          P("Escreva assim", "Th")],
         [P("\"Curso reconhecido pelo MEC\"", "TdB"),
          P("O MEC não reconhece curso livre, de extensão ou de qualificação "
            "profissional — não detém competência para isso.", "TdSm"),
          P("\"Curso livre de formação continuada, nos termos da LDB, art. 42, "
            "e do Decreto nº 5.154/2004\"", "TdSm")],
         [P("\"Certificado válido em todo o Brasil, reconhecido pelo MEC\"",
            "TdB"),
          P("A primeira parte é verdadeira; a segunda invalida a frase "
            "inteira.", "TdSm"),
          P("\"Certificado com validade legal em todo o território nacional\"",
            "TdSm")],
         [P("\"Curso autorizado pela ANAC\"", "TdB"),
          P("A ANAC não autoriza, credencia nem homologa cursos livres de "
            "drone.", "TdSm"),
          P("\"Curso preparatório para o exame teórico de piloto remoto da "
            "ANAC\"", "TdSm")],
         [P("\"Habilitação para pilotar drone\"", "TdB"),
          P("A competência do piloto decorre do exame da ANAC, não do "
            "certificado do curso.", "TdSm"),
          P("\"Capacitação para a operação e preparação para o exame teórico "
            "da ANAC\"", "TdSm")],
         [P("\"Certificado CAAR\" sem o cadastro da entidade", "TdB"),
          P("O CAAR só é válido se ministrado por entidade cadastrada no MAPA, "
            "com turma homologada.", "TdSm"),
          P("\"Capacitação técnica estruturada conforme o conteúdo mínimo do "
            "CAAR\"", "TdSm")],
         [P("\"Diploma de piloto de drone\"", "TdB"),
          P("Diploma é ato do sistema formal de ensino; curso livre emite "
            "certificado.", "TdSm"),
          P("\"Certificado de capacitação profissional\"", "TdSm")],
         [P("\"Equivalente a curso técnico\"", "TdB"),
          P("Equivalência entre níveis de ensino depende de ato do sistema "
            "formal.", "TdSm"),
          P("\"Capacitação profissional em nível de formação continuada\"",
            "TdSm")],
         [P("\"Certificado reconhecido pelo Exército / pela Polícia Militar\"",
            "TdB"),
          P("Somente se houver ato formal da corporação nesse sentido — e aí "
            "cite o ato.", "TdSm"),
          P("\"Capacitação ministrada para a [corporação], conforme "
            "contrato/convênio nº ...\"", "TdSm")],
         ],
        [CONTENT_W * 0.28, CONTENT_W * 0.38, CONTENT_W * 0.34], pad=4))
    A(Spacer(1, 24))

    # ------------------------------------------------------ 14. checklist ---
    A(SectionHeader(14, "Checklist de implantação"))
    A(P("Consolidação de tudo o que precisa existir, para conferência "
        "periódica.", "CorpoSm"))
    A(Spacer(1, 5))
    A(Paragraph("Documentação da pessoa jurídica", S["H2"]))
    A(checklist_table([
        "CNPJ ativo com objeto social e CNAE compatíveis com treinamento.",
        "Regularidade fiscal e trabalhista em dia — exigida em qualquer "
        "contratação pública.",
        "Conta bancária e capacidade de emissão de nota fiscal de serviço.",
    ]))
    A(Spacer(1, 8))
    A(Paragraph("Documentação pedagógica", S["H2"]))
    A(checklist_table([
        "Projeto pedagógico por trilha, datado e arquivado.",
        "Ementa por módulo com carga horária individual.",
        "Material didático próprio, com indicação da base normativa e da data "
        "de atualização.",
        "Instrumentos de avaliação teórica e prática, com gabarito e critério.",
        "Regulamento de emissão de certificados.",
        "Modelo de certificado — frente e verso — revisado conforme a seção 11.",
    ]))
    A(Spacer(1, 8))
    A(Paragraph("Credenciais do instrutor", S["H2"]))
    A(checklist_table([
        "Exame teórico de piloto remoto da ANAC realizado e aprovado.",
        "Cadastro de aeronave e de operador regular e vigente.",
        "Seguro de danos a terceiros para as aeronaves usadas em aula, quando "
        "exigível.",
        "CAAR obtido, para atuação na área agrícola.",
        "Responsável técnico habilitado formalizado para os módulos "
        "agronômicos.",
        "Documentação comprobatória digitalizada e pronta para instruir "
        "processo de contratação.",
    ]))
    A(Spacer(1, 8))
    A(Paragraph("Comunicação comercial", S["H2"]))
    A(checklist_table([
        "Nenhuma menção a reconhecimento pelo MEC em qualquer peça.",
        "Nenhuma menção a autorização, credenciamento ou homologação pela "
        "ANAC.",
        "Fundamento legal do curso livre citado corretamente onde couber.",
        "Uso do nome de corporações atendidas somente com autorização escrita.",
        "Grade mapeada contra o conteúdo do exame da ANAC, disponível como "
        "anexo.",
    ]))
    A(Spacer(1, 24))

    # ------------------------------------------------------ 15. base legal --
    A(SectionHeader(15, "Base legal consolidada"))
    A(P("Reunião das normas citadas ao longo do documento, com a rota a que "
        "cada uma se refere. Serve como fonte para as citações que aparecem em "
        "proposta, site e certificado — citar a norma correta é parte do "
        "argumento.", "CorpoSm"))
    A(Spacer(1, 3))
    A(data_table(
        [[P("Norma", "Th"), P("O que estabelece", "Th"),
          P("Rota relacionada", "Th")],
         [P("Lei nº 9.394/1996 (LDB), art. 42", "TdB"),
          P("Cursos de livre oferta, abertos à comunidade, com matrícula "
            "condicionada à capacidade de aproveitamento e não ao nível de "
            "escolaridade; sem carga horária preestabelecida.", "TdSm"),
          P("A", "TdSm")],
         [P("Decreto nº 5.154/2004", "TdB"),
          P("Organização da educação profissional, incluindo a formação "
            "inicial e continuada. Fundamento complementar da emissão de "
            "certificados de curso livre.", "TdSm"),
          P("A", "TdSm")],
         [P("Lei nº 9.394/1996 (LDB), Título VI e arts. 43 e seguintes", "TdB"),
          P("Educação superior e atuação regulatória do MEC — inclusive a "
            "delimitação do que efetivamente se submete a credenciamento e "
            "reconhecimento.", "TdSm"),
          P("B", "TdSm")],
         [P("Catálogo Nacional de Cursos Técnicos e normas do CNE", "TdB"),
          P("Organização da educação profissional técnica de nível médio e das "
            "qualificações profissionais correspondentes.", "TdSm"),
          P("C", "TdSm")],
         [P("Normas do Conselho Estadual de Educação e registro no SISTEC",
            "TdB"),
          P("Autorização de cursos técnicos no âmbito do sistema estadual de "
            "ensino e registro dos certificados e diplomas emitidos.", "TdSm"),
          P("C", "TdSm")],
         [P("Portaria MAPA nº 298, de 22/9/2021", "TdB"),
          P("Uso de ARP na aviação agrícola; registro do operador no "
            "SIPEAGRO; exigência do CAAR para o piloto; cadastramento de "
            "entidades de ensino e homologação de turmas.", "TdSm"),
          P("D", "TdSm")],
         [P("Lei nº 7.802/1989 e Decreto nº 4.074/2002", "TdB"),
          P("Agrotóxicos: receituário, responsabilidade técnica e destinação "
            "de embalagens — conteúdo obrigatório da grade agrícola.", "TdSm"),
          P("D", "TdSm")],
         [P("RBAC nº 100, aprovado pela Resolução ANAC nº 805", "TdB"),
          P("Marco geral vigente para aeronaves não tripuladas de uso civil "
            "desde 16/6/2026; substituiu o RBAC-E nº 94. Institui o exame "
            "teórico de piloto remoto, obrigatório a partir de 1º/1/2027, com "
            "dispensa até 31/12/2026.", "TdSm"),
          P("E", "TdSm")],
         [P("ICA 100-40 e ICA 100-48 (DECEA)", "TdB"),
          P("Acesso ao espaço aéreo brasileiro por aeronaves não tripuladas. "
            "Nova edição da ICA 100-40 pela Portaria DECEA nº 2094/DNOR8, de "
            "18/3/2026, vigente desde 1º/7/2026.", "TdSm"),
          P("E", "TdSm")],
         [P("Lei nº 8.078/1990 (CDC), art. 37", "TdB"),
          P("Vedação à publicidade enganosa — fundamento da seção 13 deste "
            "documento.", "TdSm"),
          P("Todas", "TdSm")],
         [P("Lei nº 14.133/2021", "TdB"),
          P("Licitações e contratos administrativos — habilitação e "
            "documentação exigível na contratação por órgão público.", "TdSm"),
          P("F", "TdSm")],
         ],
        [CONTENT_W * 0.28, CONTENT_W * 0.58, CONTENT_W * 0.14], pad=4))
    A(Spacer(1, 10))
    A(Callout(
        "Ressalva",
        ["Este documento é orientação técnica e estratégica, elaborada a partir "
         "de fontes públicas, e <b>não constitui parecer jurídico</b>. Os "
         "procedimentos de cadastramento junto ao MAPA, de credenciamento no "
         "âmbito estadual e de parceria com instituição de ensino têm "
         "requisitos que variam e se alteram — inclusive há expectativa de "
         "nova norma federal substituindo o regime atual de aviação agrícola. "
         "Antes de assumir compromisso contratual ou de veicular qualquer "
         "afirmação de reconhecimento, confirme a exigência vigente no órgão "
         "competente e, quando o valor envolvido justificar, submeta o modelo "
         "de certificado e as peças de comunicação à análise de advogado."],
        kind="info"))
    return st


def gerar(caminho):
    doc = DocBuilder(
        caminho, doc_title=TITULO, short_title=CURTO,
        cover_fn=desenhar_capa,
        author=D.INSTRUTOR["nome"],
        subject="Rotas legais para emissão de certificados de capacitação em "
                "aeronaves não tripuladas",
    )
    doc.footer_left = (f"Rotas Legais de Certificação · {D.INSTRUTOR['nome']} · "
                       f"v{D.DOCUMENTO.get('versao', '1.0')}")
    story = [NextPageTemplate("body"), Spacer(1, 1), PageBreak()] + historia()
    from reportlab.pdfgen.canvas import Canvas
    doc.build(story, canvasmaker=NumberedCanvas(Canvas, skip_first=True))
    return caminho
