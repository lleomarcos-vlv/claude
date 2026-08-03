# -*- coding: utf-8 -*-
"""
Planilha orcamentaria analitica do projeto PALAVRA QUE LIBERTA.

Gera:
  - build/orcamento.json  -> consumido pelo gerador de HTML
  - saida em tela com a verificacao dos limites da IN MinC no 29/2026

Estrutura de etapas conforme padrao SALIC:
  1. PRE-PRODUCAO E IMPLANTACAO
  2. PRODUCAO E EXECUCAO
  3. POS-PRODUCAO, PUBLICACAO E AVALIACAO
  4. ACESSIBILIDADE, COMUNICACAO E DIVULGACAO ACESSIVEL   (limite 20%)
  5. CUSTOS ADMINISTRATIVOS                               (limite 15%)
  6. CAPTACAO DE RECURSOS                                 (limite 10% / R$ 150 mil)

Dimensionamento: 16 meses de execucao, 2 Nucleos Palavra Livre permanentes,
24 Jovens Mediadores bolsistas, Circuito Literario Itinerante em 12 pontos,
1 antologia publicada e 1 seminario.
"""

import json
from pathlib import Path

BUILD = Path(__file__).resolve().parent


def item(codigo, descricao, unidade, qtd, ocorrencias, valor_unit, justificativa=""):
    """Cria uma rubrica. Total = quantidade * ocorrencias * valor unitario."""
    return {
        "codigo": codigo,
        "descricao": descricao,
        "unidade": unidade,
        "quantidade": qtd,
        "ocorrencias": ocorrencias,
        "valor_unitario": valor_unit,
        "total": round(qtd * ocorrencias * valor_unit, 2),
        "justificativa": justificativa,
    }


def brl(v):
    return "R$ " + f"{v:,.2f}".replace(",", "@").replace(".", ",").replace("@", ".")


# ---------------------------------- ETAPA 1 - PRE-PRODUCAO (meses 1 e 2) ---

etapa1 = [
    item("1.01", "Coordenação geral — etapa de pré-produção", "mês", 1, 2, 7500.00,
         "Profissional sênior responsável pela direção do programa, interlocução "
         "institucional e conformidade normativa. Referência: CBO 262105 (produtor "
         "cultural) acrescida de responsabilidade de coordenação de programa."),
    item("1.02", "Produção executiva — etapa de pré-produção", "mês", 1, 2, 6000.00,
         "Responsável por contratos, cotações, logística e implantação dos núcleos."),
    item("1.03", "Coordenação pedagógica — etapa de pré-produção", "mês", 1, 2, 5500.00,
         "Desenho da metodologia de mediação de leitura e da trilha formativa."),
    item("1.04", "Consultoria de diagnóstico territorial e linha de base",
         "serviço", 1, 1, 14000.00,
         "Pesquisa de campo nos territórios: perfil populacional, equipamentos "
         "existentes, escolas parceiras e linha de base dos indicadores de leitura. "
         "Produto: relatório diagnóstico que baliza a avaliação de impacto."),
    item("1.05", "Elaboração de metodologia e material pedagógico (3 cadernos)",
         "produto", 3, 1, 7000.00,
         "Caderno do Mediador, Caderno de Rodas de Leitura e Caderno de "
         "Acessibilidade na Mediação. Inclui redação, revisão, ilustração e "
         "diagramação acessível."),
    item("1.06", "Consultoria especializada em acessibilidade — plano e laudo",
         "serviço", 1, 1, 12000.00,
         "Elaboração do Plano de Acessibilidade (física, comunicacional, atitudinal "
         "e metodológica) e laudo dos espaços conforme ABNT NBR 9050. Exigência da "
         "IN MinC nº 29/2026."),
    item("1.07", "Articulação comunitária e mobilização de participantes",
         "mês", 1, 2, 3500.00,
         "Agente de território responsável pela mobilização de famílias, escolas, "
         "associações de bairro e equipamentos públicos socioassistenciais."),
    item("1.08", "Adequação e adaptação acessível dos espaços — 2 núcleos",
         "núcleo", 2, 1, 15000.00,
         "Rampa, sinalização tátil e visual, piso podotátil, adequação de sanitário, "
         "pintura, instalação elétrica e iluminação. Espaços cedidos em regime de "
         "parceria; o recurso custeia exclusivamente a adequação."),
    item("1.09", "Mobiliário e equipamentos dos núcleos — 2 núcleos",
         "núcleo", 2, 1, 19000.00,
         "Estantes, mesas, cadeiras, pufes, 2 computadores com leitor de tela, "
         "projetor, caixa de som, lupa eletrônica e armário. Média de três cotações."),
    item("1.10", "Identidade visual, projeto gráfico e sinalização do programa",
         "serviço", 1, 1, 13000.00,
         "Marca do programa, manual de aplicação, sinalização dos núcleos e "
         "templates acessíveis (contraste mínimo AA e tipografia legível)."),
]

# ------------------------------------ ETAPA 2 - PRODUCAO (meses 3 a 14) ---

etapa2 = [
    item("2.01", "Coordenação geral — etapa de produção", "mês", 1, 12, 7500.00,
         "Direção do programa durante os 12 meses de operação continuada."),
    item("2.02", "Produção executiva — etapa de produção", "mês", 1, 12, 6000.00,
         "Gestão operacional, contratos, compras e logística."),
    item("2.03", "Coordenação pedagógica — etapa de produção", "mês", 1, 12, 5500.00,
         "Supervisão metodológica, formação continuada e avaliação pedagógica."),
    item("2.04", "Bibliotecário(a) responsável técnico (registro no CRB)",
         "mês", 1, 12, 5000.00,
         "Formação e tratamento técnico do acervo, catalogação, política de "
         "empréstimo e capacitação das equipes. Exigência técnica para acervos "
         "abertos ao público."),
    item("2.05", "Mediador-coordenador de núcleo", "profissional/mês", 2, 12, 3500.00,
         "Um profissional por núcleo, responsável pelo funcionamento diário, pela "
         "programação e pela supervisão dos jovens mediadores."),
    item("2.06", "Assistente de produção", "mês", 1, 12, 2800.00,
         "Apoio administrativo e logístico à operação dos núcleos e do circuito."),
    item("2.07", "Articulador comunitário — etapa de produção", "mês", 1, 12, 3500.00,
         "Manutenção das parcerias territoriais e busca ativa de participantes."),
    item("2.08", "Analista de monitoramento e avaliação", "mês", 1, 12, 3800.00,
         "Coleta, tratamento e análise dos indicadores; produção dos relatórios de "
         "impacto exigidos pelo patrocinador e pelo MinC."),
    item("2.09", "Bolsa-formação Jovem Mediador de Leitura", "bolsa/mês", 24, 6, 700.00,
         "24 jovens de 16 a 29 anos moradores dos territórios, em trilha formativa "
         "de 6 meses. Bolsa de incentivo à permanência; não configura vínculo "
         "empregatício, conforme instrumento de bolsa-formação."),
    item("2.10", "Oficineiros — escrita criativa, slam e contação de histórias",
         "hora/aula", 288, 1, 165.00,
         "288 horas/aula distribuídas nos 2 núcleos ao longo de 12 meses (6h "
         "semanais por núcleo). Valor hora/aula compatível com tabelas referenciais "
         "de projetos culturais."),
    item("2.11", "Escritores e mediadores convidados — encontros literários",
         "cachê", 16, 1, 2200.00,
         "16 encontros com autores, com prioridade para autores da literatura "
         "periférica, negra, indígena e regional. Cachê médio de mercado para "
         "atividade de 3 horas, incluindo deslocamento."),
    item("2.12", "Formação inicial dos Jovens Mediadores — 120h (2 turmas)",
         "turma", 2, 1, 16000.00,
         "Mediação de leitura, acessibilidade, direitos humanos e gestão de acervo. "
         "Inclui formadores, material didático e certificação."),
    item("2.13", "Aquisição de acervo literário para os núcleos",
         "exemplar", 3000, 1, 38.00,
         "3.000 exemplares (1.500 por núcleo), com curadoria diversificada: "
         "literatura brasileira, africana e indígena, infantojuvenil, quadrinhos, "
         "mangás e obras de direitos humanos. Preço médio com desconto institucional "
         "de distribuidoras."),
    item("2.14", "Aquisição de acervo acessível — braile, letra ampliada e audiolivro",
         "exemplar", 400, 1, 92.00,
         "400 exemplares em formatos acessíveis (200 por núcleo). Custo unitário "
         "superior em razão da produção especializada."),
    item("2.15", "Acervo digital acessível — licenças de plataforma de leitura",
         "licença/ano", 2, 1, 6500.00,
         "Assinatura anual de biblioteca digital compatível com leitores de tela."),
    item("2.16", "Circuito Literário Itinerante — produção de 12 sessões",
         "sessão", 12, 1, 4800.00,
         "Sessões em escolas públicas, praças, CRAS, unidades socioeducativas e "
         "unidades prisionais. Inclui transporte, montagem, equipe de apoio, seguro "
         "e material. Média de três cotações."),
    item("2.17", "Seminário Franz de Castro: Literatura, Memória e Direitos Humanos",
         "evento", 1, 1, 38000.00,
         "Evento de dois dias com mesas, oficinas e lançamento da antologia. Inclui "
         "locação, estrutura, equipe técnica, passagens e hospedagem de convidados."),
    item("2.18", "Participação na Feira Internacional do Livro de Ribeirão Preto",
         "ativação", 1, 1, 28000.00,
         "Estande institucional, programação de saraus e slams dos núcleos e "
         "distribuição gratuita da antologia. A 24ª FIL reuniu 274 mil pessoas."),
    item("2.19", "Manutenção e custeio dos núcleos — energia, água, internet e limpeza",
         "núcleo/mês", 2, 12, 1250.00,
         "Custeio operacional dos dois espaços durante a execução."),
    item("2.20", "Material de consumo pedagógico e de oficinas",
         "núcleo/mês", 2, 12, 520.00,
         "Papelaria, materiais de escrita, insumos de oficina e higiene."),
    item("2.21", "Transporte de participantes e equipe",
         "mês", 1, 12, 4800.00,
         "Deslocamento de participantes em situação de vulnerabilidade, incluindo "
         "veículo adaptado para pessoas com deficiência, e da equipe entre núcleos "
         "e pontos do circuito."),
    item("2.22", "Alimentação em atividades formativas e eventos",
         "mês", 1, 12, 3500.00,
         "Lanche em oficinas, formações e sessões do circuito. Item essencial para a "
         "permanência de participantes em situação de vulnerabilidade."),
    item("2.23", "Seguro de responsabilidade civil e de participantes",
         "mês", 1, 12, 780.00,
         "Cobertura obrigatória para atividades com público e com menores de idade."),
    item("2.24", "Registro audiovisual e fotográfico das ações",
         "mês", 1, 12, 2400.00,
         "Documentação das atividades para prestação de contas, comunicação e "
         "memória do projeto."),
]

# ------------------------------- ETAPA 3 - POS-PRODUCAO (meses 13 a 16) ---

etapa3 = [
    item("3.01", "Coordenação editorial da antologia", "serviço", 1, 1, 18000.00,
         "Curadoria dos textos produzidos nas oficinas, organização da obra e "
         "acompanhamento de todo o processo editorial."),
    item("3.02", "Preparação de originais e revisão de texto", "serviço", 1, 1, 11000.00,
         "Preparação e duas rodadas de revisão da antologia (cerca de 180 páginas)."),
    item("3.03", "Projeto gráfico, diagramação e capa", "serviço", 1, 1, 14000.00,
         "Projeto gráfico original com requisitos de legibilidade e contraste."),
    item("3.04", "Ilustração da antologia", "serviço", 1, 1, 9000.00,
         "Ilustrações originais, com prioridade para artistas dos territórios."),
    item("3.05", "Impressão da antologia — 3.000 exemplares", "exemplar", 3000, 1, 14.50,
         "Formato 14x21cm, cerca de 180 páginas, miolo offset 90g, capa 250g com "
         "laminação. Preço unitário dentro da faixa de mercado para a tiragem "
         "(R$ 6,00 a R$ 15,00). Média de três cotações gráficas."),
    item("3.06", "Registro de ISBN, ficha catalográfica e depósito legal",
         "serviço", 1, 1, 3200.00,
         "Obrigações legais da produção editorial."),
    item("3.07", "Produção do audiolivro da antologia", "produto", 1, 1, 22000.00,
         "Narração profissional, direção, estúdio, edição e masterização. Medida de "
         "acessibilidade comunicacional integrada ao produto principal."),
    item("3.08", "E-book acessível em EPUB3 e edição em braile", "produto", 1, 1, 13000.00,
         "Versão digital navegável compatível com leitores de tela e edição reduzida "
         "em braile para os núcleos e bibliotecas parceiras."),
    item("3.09", "Logística de distribuição gratuita da antologia",
         "serviço", 1, 1, 8000.00,
         "Embalagem, transporte e entrega a participantes, escolas públicas, "
         "bibliotecas, unidades prisionais e socioeducativas."),
    item("3.10", "Avaliação externa de impacto", "serviço", 1, 1, 26000.00,
         "Instituição independente responsável pela avaliação de resultados, com "
         "linha de base e medição final. Relatório de acesso público."),
    item("3.11", "Relatório final e documentário curto do projeto", "produto", 1, 1, 18000.00,
         "Relatório de resultados em versão acessível e videodocumentário de 12 "
         "minutos com legendas, janela de Libras e audiodescrição."),
    item("3.12", "Coordenação geral e produção executiva — pós-produção",
         "mês", 1, 2, 13500.00,
         "Coordenação geral e produção executiva nos dois meses de encerramento, "
         "publicação e prestação de contas."),
]

# ---------- ETAPA 4 - ACESSIBILIDADE, COMUNICACAO E DIVULGACAO ACESSIVEL ---
# Limite normativo: ate 20% do valor do projeto.

etapa4 = [
    item("4.01", "Intérprete de Libras nas atividades públicas", "hora", 280, 1, 185.00,
         "Cobertura de 100% das sessões públicas, formações e eventos, conforme a IN "
         "MinC nº 29/2026. Dupla de intérpretes em atividades superiores a 1 hora."),
    item("4.02", "Audiodescrição ao vivo e roteirizada", "hora", 120, 1, 200.00,
         "Audiodescrição das atividades e dos materiais visuais do projeto."),
    item("4.03", "Legendagem descritiva de conteúdos audiovisuais", "minuto", 420, 1, 30.00,
         "Legendagem para surdos e ensurdecidos de todo o material audiovisual."),
    item("4.04", "Guia-intérprete e apoio a pessoas com deficiência", "diária", 40, 1, 400.00,
         "Suporte individualizado em atividades com participação de pessoas com "
         "deficiência visual e surdocegueira."),
    item("4.05", "Consultoria de acessibilidade atitudinal e formação da equipe",
         "serviço", 1, 1, 14000.00,
         "Formação de 16 horas para toda a equipe e para os jovens mediadores, "
         "conduzida por consultores com deficiência."),
    item("4.06", "Assessoria de imprensa e comunicação", "mês", 1, 12, 3800.00,
         "Relacionamento com veículos regionais e nacionais e produção de conteúdo."),
    item("4.07", "Gestão de mídias sociais e conteúdo acessível", "mês", 1, 12, 3200.00,
         "Publicações com texto alternativo, legendas e janela de Libras."),
    item("4.08", "Peças gráficas e sinalização acessível", "serviço", 1, 1, 21000.00,
         "Cartazes, banners, folders em formato acessível, materiais em braile e "
         "peças com QR code para versão em áudio."),
    item("4.09", "Site do projeto com padrão de acessibilidade digital",
         "produto", 1, 1, 16000.00,
         "Portal conforme WCAG 2.1 nível AA, com repositório público dos resultados "
         "e da prestação de contas."),
    item("4.10", "Vídeo institucional acessível", "produto", 1, 1, 14000.00,
         "Vídeo de 3 minutos com Libras, audiodescrição e legendas."),
    item("4.11", "Veiculação de peças publicitárias", "serviço", 1, 1, 32000.00,
         "Mídia regional e digital. Rubrica limitada a 5% dos recursos captados e ao "
         "teto de R$ 100.000,00, conforme a IN MinC nº 29/2026."),
]

# ------------------------------------- ETAPA 5 - CUSTOS ADMINISTRATIVOS ----
# Limite normativo: ate 15% do valor do projeto; nenhuma despesa isolada pode
# superar 50% do total desta etapa.

etapa5 = [
    item("5.01", "Assessoria contábil do projeto", "mês", 1, 16, 2600.00,
         "Contador com registro no CRC, responsável pela escrituração segregada do "
         "projeto e pela prestação de contas no SALIC."),
    item("5.02", "Assessoria jurídica", "serviço", 1, 1, 18000.00,
         "Contratos, direitos autorais, cessão de imagem e conformidade com a LGPD. "
         "Honorários referenciados na tabela URH da OAB."),
    item("5.03", "Auditoria independente das contas do projeto", "serviço", 1, 1, 22000.00,
         "Auditoria externa voluntária, além do exigido, como diferencial de "
         "governança para o patrocinador."),
    item("5.04", "Despesas bancárias e tarifas da conta vinculada", "mês", 1, 16, 300.00,
         "Conta corrente exclusiva do PRONAC, exigida pela legislação."),
    item("5.05", "Apoio administrativo e financeiro", "mês", 1, 14, 3000.00,
         "Rotinas de pagamento, conciliação, arquivo de comprovantes e alimentação "
         "do sistema de prestação de contas."),
    item("5.06", "Material de escritório, licenças de software e correios",
         "mês", 1, 14, 750.00,
         "Custeio administrativo da gestão do projeto."),
    item("5.07", "Elaboração do projeto e adequação ao SALIC", "serviço", 1, 1, 22000.00,
         "Concepção, redação técnica, planilha orçamentária e submissão no sistema."),
]

# ------------------------------------- ETAPA 6 - CAPTACAO DE RECURSOS ------
# Limite normativo: ate 10% do valor do projeto, teto de R$ 150.000,00,
# pago proporcionalmente ao efetivamente captado.

etapa6 = [
    item("6.01", "Serviços de captação de recursos incentivados", "serviço", 1, 1, 92000.00,
         "Remuneração vinculada ao efetivamente captado, respeitados o limite de 10% "
         "do valor do projeto e o teto de R$ 150.000,00 previstos na IN MinC nº "
         "29/2026. Não há pagamento sem captação correspondente."),
]

ETAPAS = [
    ("1", "PRÉ-PRODUÇÃO E IMPLANTAÇÃO", etapa1),
    ("2", "PRODUÇÃO E EXECUÇÃO", etapa2),
    ("3", "PÓS-PRODUÇÃO, PUBLICAÇÃO E AVALIAÇÃO", etapa3),
    ("4", "ACESSIBILIDADE, COMUNICAÇÃO E DIVULGAÇÃO ACESSÍVEL", etapa4),
    ("5", "CUSTOS ADMINISTRATIVOS", etapa5),
    ("6", "CAPTAÇÃO DE RECURSOS", etapa6),
]

# ------------------------------------------------------------ apuracao -----

subtotais = {c: round(sum(i["total"] for i in itens), 2) for c, _, itens in ETAPAS}
valor_base = round(subtotais["1"] + subtotais["2"] + subtotais["3"], 2)
valor_total = round(sum(subtotais.values()), 2)

pct = lambda v: round(v / valor_total * 100, 2)
lim_acess, lim_admin, lim_capta = pct(subtotais["4"]), pct(subtotais["5"]), pct(subtotais["6"])

maior_admin = max(etapa5, key=lambda i: i["total"])
pct_maior_admin = round(maior_admin["total"] / subtotais["5"] * 100, 2)

publicidade = next(i for i in etapa4 if i["codigo"] == "4.11")
pct_publicidade = pct(publicidade["total"])

verificacoes = [
    {"item": "Custos administrativos",
     "limite": "até 15% do valor do projeto",
     "apurado": f"{lim_admin}% — {brl(subtotais['5'])}",
     "ok": lim_admin <= 15.0},
    {"item": "Maior despesa isolada dentro dos custos administrativos",
     "limite": "até 50% do total da etapa",
     "apurado": f"{pct_maior_admin}% — {brl(maior_admin['total'])}",
     "ok": pct_maior_admin <= 50.0},
    {"item": "Acessibilidade, comunicação e divulgação acessível",
     "limite": "até 20% do valor do projeto",
     "apurado": f"{lim_acess}% — {brl(subtotais['4'])}",
     "ok": lim_acess <= 20.0},
    {"item": "Veiculação de peças publicitárias",
     "limite": "até 5% do captado, teto de R$ 100.000,00",
     "apurado": f"{pct_publicidade}% — {brl(publicidade['total'])}",
     "ok": pct_publicidade <= 5.0 and publicidade["total"] <= 100000.0},
    {"item": "Captação de recursos",
     "limite": "até 10% do valor do projeto, teto de R$ 150.000,00",
     "apurado": f"{lim_capta}% — {brl(subtotais['6'])}",
     "ok": lim_capta <= 10.0 and subtotais["6"] <= 150000.0},
    {"item": "Valor total do projeto",
     "limite": "até R$ 15.000.000,00 por projeto (demais pessoas jurídicas)",
     "apurado": brl(valor_total),
     "ok": valor_total <= 15000000.0},
    {"item": "Prazo de execução",
     "limite": "até 36 meses",
     "apurado": "16 meses",
     "ok": True},
]

dados = {
    "etapas": [{"codigo": c, "titulo": t, "itens": i, "subtotal": subtotais[c]}
               for c, t, i in ETAPAS],
    "subtotais": subtotais,
    "valor_base": valor_base,
    "valor_total": valor_total,
    "verificacoes": verificacoes,
    "percentuais": {"acessibilidade": lim_acess, "administrativos": lim_admin,
                    "captacao": lim_capta,
                    "finalisticas": round(valor_base / valor_total * 100, 2)},
}

(BUILD / "orcamento.json").write_text(
    json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    print("=" * 80)
    print("PALAVRA QUE LIBERTA — PLANILHA ORÇAMENTÁRIA ANALÍTICA")
    print("=" * 80)
    for cod, titulo, itens in ETAPAS:
        print(f"\nETAPA {cod} — {titulo}")
        print("-" * 80)
        for i in itens:
            print(f"  {i['codigo']}  {i['descricao'][:54]:<54} {brl(i['total']):>16}")
        print(f"  {'SUBTOTAL ETAPA ' + cod:>58} {brl(subtotais[cod]):>16}")

    print("\n" + "=" * 80)
    print(f"{'BASE DE CÁLCULO (etapas 1+2+3)':>58} {brl(valor_base):>16}")
    print(f"{'VALOR TOTAL DO PROJETO':>58} {brl(valor_total):>16}")
    print("=" * 80)
    print("\nVERIFICAÇÃO DOS LIMITES DA IN MinC Nº 29/2026")
    print("-" * 80)
    todas_ok = True
    for v in verificacoes:
        todas_ok &= v["ok"]
        print(f"[{'OK  ' if v['ok'] else 'FALHA'}] {v['item']}")
        print(f"         limite : {v['limite']}")
        print(f"         apurado: {v['apurado']}")
    print("-" * 80)
    print("RESULTADO:", "TODOS OS LIMITES ATENDIDOS" if todas_ok else "HÁ LIMITE EXCEDIDO")
    print("=" * 80)
