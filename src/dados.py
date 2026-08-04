"""
=============================================================================
  PREENCHA AQUI  —  este é o único arquivo que você precisa editar.
=============================================================================

Todos os campos abaixo aparecem nos dois PDFs. Enquanto estiverem com o valor
None, o PDF mostra uma marca dourada "[ preencher: ... ]" no lugar. Troque o
None pelo dado verdadeiro (entre aspas) e rode novamente:

    python3 gerar_pdfs.py

Regra de ouro: não invente nada. Se você ainda não tem uma credencial, deixe
None e o documento simplesmente não afirma aquilo — é melhor um campo em
branco do que uma informação que não se sustenta numa checagem do órgão.
"""

# ------------------------------------------------------- identificação -------

INSTRUTOR = {
    "nome": "Mizael Lucas da Silva",
    "titulo_profissional": "Instrutor de Operação de Aeronaves Não Tripuladas",
    "especialidades": "Drones agrícolas, mapeamento e aplicação tática",

    # ---- dados de contato (aparecem na capa e na página de contato) --------
    "telefone": None,            # ex.: "(16) 99999-0000"
    "email": None,               # ex.: "contato@exemplo.com.br"
    "cidade_uf": None,           # ex.: "Ribeirão Preto / SP"
    "site_ou_redes": None,       # ex.: "instagram.com/seuperfil"

    # ---- pessoa física / jurídica ------------------------------------------
    "cpf": None,
    "razao_social": None,        # se houver CNPJ para contratar
    "cnpj": None,
    "cnae": None,                # ex.: "8599-6/04 - Treinamento profissional"

    # ---- credenciais técnicas (só preencha o que você REALMENTE tem) -------
    "cadastro_sisant": None,     # nº do cadastro de operador/aeronave
    "exame_teorico_anac": None,  # ex.: "Aprovado em 00/00/2026"
    "formacao_academica": None,
    "registro_conselho": None,   # ex.: CREA, se aplicável
    "curso_caar": None,          # se já possui o CAAR
    "cadastro_mapa": None,       # nº SIPEAGRO, se aplicável
    "outras_certificacoes": None,

    # ---- experiência --------------------------------------------------------
    "anos_experiencia": None,
    "horas_de_voo": None,
    "turmas_formadas": None,
    "alunos_formados": None,
    "instituicoes_atendidas": None,
    "frota_disponivel": None,    # modelos de drone que você leva para a aula
}

# --------------------------------------------------- dados comerciais --------

COMERCIAL = {
    "validade_proposta": None,   # ex.: "30 dias a contar da data de emissão"
    "prazo_agendamento": None,   # ex.: "15 dias após assinatura"
    "min_alunos": None,          # ex.: "12"
    "max_alunos": None,          # ex.: "25"
    "valor_por_turma": None,
    "valor_por_aluno": None,
    "forma_pagamento": None,
    "abrangencia": None,         # ex.: "Estado de São Paulo; demais estados sob consulta"
    "despesas_deslocamento": None,
}

# ------------------------------------------------------- metadados -----------

DOCUMENTO = {
    "cidade_data": None,         # ex.: "Ribeirão Preto, 10 de agosto de 2026"
    "versao": "1.0",
    "referencia": None,          # nº interno da proposta, se você usar
}


# =============================================================================
#  A partir daqui é só mecânica de renderização — não precisa mexer.
# =============================================================================

from design import campo


def v(grupo, chave, rotulo=None):
    """Devolve o valor preenchido ou a marca dourada de campo pendente."""
    val = grupo.get(chave)
    if val:
        return str(val)
    return campo(rotulo or f"preencher: {chave.replace('_', ' ')}")


def tem(grupo, chave):
    return bool(grupo.get(chave))


def ins(chave, rotulo=None):
    return v(INSTRUTOR, chave, rotulo)


def com(chave, rotulo=None):
    return v(COMERCIAL, chave, rotulo)


def doc(chave, rotulo=None):
    return v(DOCUMENTO, chave, rotulo)


def contato_linha():
    """Linha compacta de contato para a capa."""
    partes = []
    for chave, rot in (("telefone", "telefone"), ("email", "e-mail"),
                       ("cidade_uf", "cidade / UF")):
        partes.append(v(INSTRUTOR, chave, f"preencher: {rot}"))
    return "&nbsp;&nbsp;·&nbsp;&nbsp;".join(partes)
