# -*- coding: utf-8 -*-
"""Consolida, limpa e deduplica a base de prospeccao de Ribeirao Preto."""
import csv, re, json, unicodedata
from collections import Counter

COLS = ['Nº','Nome informado','Nome sugerido','Status','CNPJ','Telefone','Responsável',
        'Categoria','Cidade','Abordagem','Temperatura','Observações','Origem']

def sem_acento(s):
    return unicodedata.normalize('NFKD', (s or '')).encode('ascii','ignore').decode()

def chave_nome(s):
    s = sem_acento(s).lower()
    s = re.sub(r'\b(ltda|me|epp|eireli|s ?a|cia|comercio|com|servicos|loja|unidade|filial)\b',' ', s)
    s = re.sub(r'\b(de|da|do|dos|das|e|o|a|os|as|em|para|com)\b',' ', s)
    return re.sub(r'[^a-z0-9]','', s)

def so_digitos(s): return re.sub(r'\D','', s or '')

def chave_tel(s):
    d = so_digitos(s)
    if d.startswith('55') and len(d) > 11: d = d[2:]
    if len(d) == 11 and d[2] == '9': return d          # celular com DDD
    if len(d) == 10: return d                           # fixo com DDD
    if len(d) == 9 and d[0] == '9': return '16'+d       # celular sem DDD
    if len(d) == 8: return '16'+d
    return ''

def formatar_tel(s):
    d = chave_tel(s)
    if len(d) == 11: return f"({d[:2]}) {d[2:7]}-{d[7:]}", 'celular'
    if len(d) == 10: return f"({d[:2]}) {d[2:6]}-{d[6:]}", 'fixo'
    bruto = so_digitos(s)
    return (s.strip(), 'verificar') if bruto else ('', '')

def cnpj_valido(c):
    d = so_digitos(c)
    if len(d) != 14 or len(set(d)) == 1: return False
    for tam in (12, 13):
        pesos = list(range(tam-7, 1, -1)) + list(range(9, 1, -1))
        soma = sum(int(d[i])*pesos[i] for i in range(tam))
        resto = soma % 11
        dig = 0 if resto < 2 else 11 - resto
        if int(d[tam]) != dig: return False
    return True

def formatar_cnpj(c):
    d = so_digitos(c)
    if len(d) == 14: return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}"
    return (c or '').strip()

# ---- inferencia de nicho a partir do nome ----
NICHOS = [
 ('Padaria', r'panificadora|padaria|panific'), ('Confeitaria', r'confeitaria|casa de bolos|doceria|biskoit|cookie|bolo'),
 ('Açougue', r'acougue|casa de carne|carnes|picanha|boi |churrasc'), ('Restaurante', r'restaurante|marmitaria|comida|cozinha|self service|gourmet|grill|steak|tulha|massas'),
 ('Hamburgueria', r'burguer|burger|hamburgu|lanche|lanchonete|espetaria|dog'), ('Pizzaria', r'pizza'),
 ('Açaí/Sorveteria', r'acai|sorvet|gelato'), ('Bar', r'\bbar\b|choperia|boteco|pub'),
 ('Distribuidora de bebidas', r'bebida|adega|cervej|distribuidora de beb'), ('Tabacaria', r'tabacaria|narguile'),
 ('Supermercado', r'supermercado|mercado|mercearia|varejao|hortifruti|atacad|cenourao|batatao'),
 ('Pet shop', r'pet ?shop|pet |animais|racao|mascote|filhote|cao |mimado'), ('Veterinária', r'veterinari|vet\b|univet|endovet'),
 ('Farmácia', r'farmacia|drogaria|droga ?raia|drogao|drogal'), ('Clínica odontológica', r'odonto|dentar|dentista|sorri'),
 ('Clínica médica', r'clinica medica|medicar|consultorio'), ('Fisioterapia', r'fisioterapia|physio|pilates'),
 ('Laboratório', r'laboratorio|analises|labor'), ('Estética', r'estetica|spa|massagem|depilac|fisoforma'),
 ('Salão de beleza', r'salao|cabeleir|beleza|beauty|hair|barbear|barber|manicure|unhas|new tons'),
 ('Academia', r'academia|fitness|crossfit|musculacao|pilates|ballet|danca'),
 ('Materiais de construção', r'material de constru|materiais de constru|construcao|construlider|home center|deposito de mat|calura|acabamento'),
 ('Materiais elétricos', r'eletric|eletrica|material eletrico|iluminac|so poste|light'),
 ('Materiais hidráulicos', r'hidraulic|encanamento|tubos'), ('Tintas', r'tintas|tinta '),
 ('Marmoraria', r'marmorar|marmore|granito'), ('Madeireira', r'madeira|madeireira|marcenaria|movel rustico|serraria'),
 ('Ferragens', r'ferragens|ferro|aco |parafuso'), ('Serralheria', r'serralher|solda'),
 ('Vidraçaria', r'vidracar|vidro|esquadria'), ('Autopeças', r'auto ?pecas|autopecas|pecas|rolamento|retifica|fortemak|durao'),
 ('Oficina mecânica', r'mecanica|oficina|auto ?center|auto ?socorro|funilar|cintra car|perfect car|caramurucar|centrovel'),
 ('Pneus/Borracharia', r'pneu|borrachar|silcar|agrimac'), ('Motos', r'moto|motorcycle|scooter|capacete'),
 ('Loja de veículos', r'veiculo|automov|seminovo|concession'), ('Piscinas', r'piscina|pool|aqualinda|solario'),
 ('Móveis', r'moveis|colchoes|colchao|planejados|decorac|estofad|tapecaria|cairu|calê|home'),
 ('Loja de roupas', r'roupa|moda|confeccao|modas|boutique|closet|vestido|alfaiatar|suits|tanger|super g'),
 ('Calçados', r'calcado|sapat|tenis|trilha do pe'), ('Ótica', r'otica|optica|oculos'),
 ('Relojoaria/Joalheria', r'relojoar|relogio|joia|joalher|ourives|joiois'),
 ('Papelaria', r'papelaria|copiadora|multicopi|encaderna'), ('Gráfica', r'grafica|impress|imprimix|artegrafix|ekopress|outdoor|comunicacao visual|adesiv'),
 ('Uniformes/Brindes', r'uniforme|brinde|personaliz|unibrins|sitta'), ('Embalagens', r'embalagem|embalagens|plast|sacola|descartav|nave'),
 ('Produtos de limpeza', r'limpeza|higien|saneante'), ('Floricultura', r'flores|floricultura|flor '),
 ('Presentes/Utilidades', r'presente|utilidade|bazar|armarinho|1 ?99|variedades'), ('Brinquedos', r'brinquedo|kids'),
 ('Informática/TI', r'informatica|tecnologia|sistemas|software|ti \b|computador|notebook|aatech|brasplan|route 66|ribernet'),
 ('Assistência técnica', r'assistencia|conserto|eletronica|component|celular|smartphone|rc service|bru tech'),
 ('Telefonia/Acessórios', r'acessorios para celular|acessorio|quiosque|rai acessorios'),
 ('Agropecuária/Agro', r'agro|agrope|racao|insumo|semente|fertiliz|geo agri|realpec|dinagro|serv agro|hortifrutigranj'),
 ('Indústria/Metalurgia', r'metalurg|usinagem|caldeirar|industri|injec|femac|martifer|valmac|girotti|tecnolife|forte acessorios'),
 ('Transportadora/Logística', r'transport|logistic|frete|mudanca|guincho|cargo|risso|movimente'),
 ('Construtora/Engenharia', r'construtora|incorporad|engenharia|empreiteira|acosta|terraplan'),
 ('Imobiliária', r'imoveis|imobiliar|corretor de imov'), ('Corretora de seguros', r'seguros|corretora|dadalt|binue'),
 ('Contabilidade', r'contabil|contador|escritorio contab'), ('Advocacia', r'advocacia|advogad|juridic'),
 ('Escola/Educação', r'escola|educacao|creche|infantil|colegio|curso|idioma|cna |autoescola|auto escola|micca'),
 ('Buffet/Eventos', r'buffet|evento|festa|salgado|salgadinho|espaco p|quinta linda|pallato|cristal eventos'),
 ('Hotel/Motel', r'hotel|motel|pousada|hostel'), ('Lavanderia', r'lavanderia|lava ?rapid|lava ?jato|higienizac'),
 ('Climatização', r'ar condicionado|climatiz|refrigerac|frio|refriart|climater'),
 ('Controle de pragas', r'dedetiz|controle de praga|extinset|bioforte|imuni'),
 ('Energia solar', r'solar|fotovolt|energia'), ('Segurança eletrônica', r'seguranca|cftv|alarme|monitoramento|cameras'),
 ('Distribuidora de alimentos', r'distribuidora de alim|alimentos|bunge|pd8|cafe|cafes'),
 ('Serviços gerais', r'servico|manutencao|unicenter'),
]
def inferir_nicho(nome, atual=''):
    if (atual or '').strip(): return atual.strip(), False
    n = sem_acento(nome or '').lower()
    for rotulo, pad in NICHOS:
        if re.search(pad, n): return rotulo, True
    return '', False

# ================= 1. INDICE DO QUE JA EXISTE =================
dados = json.load(open('dados_painel.json', encoding='utf-8'))
base_csv = list(csv.DictReader(open('base.csv', encoding='utf-8'), delimiter=';'))

vistos_nome, vistos_tel = {}, {}
def indexar(nome, tel, fonte):
    kn = chave_nome(nome)
    if kn and kn not in vistos_nome: vistos_nome[kn] = fonte
    kt = chave_tel(tel)
    if kt and kt not in vistos_tel: vistos_tel[kt] = fonte

for aba, regs in dados.items():
    for r in regs:
        indexar(r.get('sugerido',''), r.get('telefone',''), 'painel/'+aba)
        indexar(r.get('informado',''), '', 'painel/'+aba)
for r in base_csv:
    indexar(r['Nome sugerido'], r['Telefone'], 'csv')
    indexar(r['Nome informado'], '', 'csv')

# ================= 2. LIMPEZA DA BASE ATUAL =================
# Duplicatas nao sao descartadas: os campos das duas linhas sao fundidos na
# primeira ocorrencia (o registro repetido costuma trazer responsavel/telefone
# que faltavam no original) e a segunda fica marcada como DUPLICADO.
limpo = []
seen_n, seen_t = {}, {}
relatorio = {'tel_corrigido':0,'cnpj_invalido':[],'nicho_inferido':0,'sem_telefone':[],
             'duplicados':[],'campos_recuperados':[]}
MESCLAVEIS = ['CNPJ','Telefone','Responsável','Categoria','Cidade','Abordagem','Temperatura','Observações']

for i, r in enumerate(base_csv, 1):
    nome = (r['Nome sugerido'] or r['Nome informado']).strip()
    kn, kt = chave_nome(nome), chave_tel(r['Telefone'])
    idx_orig = seen_n.get(kn) or (seen_t.get(kt) if kt else None)

    if idx_orig is not None:
        alvo = limpo[idx_orig-1]
        ganhos = []
        for c in MESCLAVEIS:
            if not (alvo[c] or '').strip() and (r[c] or '').strip():
                alvo[c] = r[c].strip(); ganhos.append(c)
        if ganhos:
            relatorio['campos_recuperados'].append((nome, ganhos))
        relatorio['duplicados'].append((i, nome, idx_orig, ganhos))
        obs = (r['Observações'] + ' | ' if r['Observações'] else '')
        limpo.append({'Nº':i,'Nome informado':r['Nome informado'],'Nome sugerido':r['Nome sugerido'],
            'Status':'DUPLICADO','CNPJ':'','Telefone':'','Responsável':'','Categoria':'','Cidade':'',
            'Abordagem':'','Temperatura':'',
            'Observações':obs + f'Mesma empresa do item {idx_orig}; dados uteis ja foram levados para la. Nao ligar duas vezes.',
            'Origem':r['Origem'],'_tipo':''})
        continue

    if kn: seen_n[kn] = i
    if kt: seen_t[kt] = i
    limpo.append({'Nº':i,'Nome informado':r['Nome informado'],'Nome sugerido':r['Nome sugerido'],
        'Status':r['Status'],'CNPJ':r['CNPJ'].strip(),'Telefone':r['Telefone'].strip(),
        'Responsável':r['Responsável'].strip(),'Categoria':r['Categoria'].strip(),'Cidade':r['Cidade'].strip(),
        'Abordagem':r['Abordagem'].strip(),'Temperatura':r['Temperatura'].strip(),
        'Observações':r['Observações'].strip(),'Origem':r['Origem'],'_tipo':''})

# normalizacao aplicada depois da fusao, para nao perder nada no caminho
for reg in limpo:
    if reg['Status'] == 'DUPLICADO' and not reg['Telefone']: continue
    nome = reg['Nome sugerido'] or reg['Nome informado']
    bruto = reg['Telefone']
    tel_fmt, tipo = formatar_tel(bruto)
    reg['_tipo'] = tipo
    if bruto and tel_fmt != bruto: relatorio['tel_corrigido'] += 1
    reg['Telefone'] = tel_fmt
    if not tel_fmt: relatorio['sem_telefone'].append(nome)
    if reg['CNPJ']:
        if cnpj_valido(reg['CNPJ']): reg['CNPJ'] = formatar_cnpj(reg['CNPJ'])
        else:
            relatorio['cnpj_invalido'].append((nome, reg['CNPJ']))
            reg['Observações'] = (reg['Observações'] + ' | ' if reg['Observações'] else '') + \
                'CNPJ nao confere no digito verificador: reconferir antes de usar.'
    cat, inferido = inferir_nicho(nome, reg['Categoria'])
    if inferido: relatorio['nicho_inferido'] += 1
    cat = (cat or '').strip()
    # padroniza a caixa para o filtro de nicho nao listar "bar" e "Bar" separados
    if cat and cat == cat.lower(): cat = cat[0].upper() + cat[1:]
    reg['Categoria'] = cat
    cidade = reg['Cidade'] or 'Ribeirão Preto'
    reg['Cidade'] = 'Ribeirão Preto' if sem_acento(cidade).lower().startswith('ribeir') else cidade

dups_internas = len(relatorio['duplicados'])

# ================= 3. LEADS NOVOS =================
novos, descartados = [], []
for linha in open('raw.tsv', encoding='utf-8'):
    if not linha.strip(): continue
    cat, nome, tel, end = linha.rstrip('\n').split('\t')
    kn, kt = chave_nome(nome), chave_tel(tel)
    motivo = None
    if kt and kt in vistos_tel: motivo = 'telefone ja existe em ' + vistos_tel[kt]
    elif kn and kn in vistos_nome: motivo = 'nome ja existe em ' + vistos_nome[kn]
    if motivo:
        descartados.append((nome, motivo)); continue
    vistos_nome[kn] = 'novo'; vistos_tel[kt] = 'novo'
    tel_fmt, tipo = formatar_tel(tel)
    novos.append({'Nome informado':nome,'Nome sugerido':nome,'Status':'NOVO','CNPJ':'','Telefone':tel_fmt,
        'Responsável':'','Categoria':cat,'Cidade':'Ribeirão Preto','Abordagem':'','Temperatura':'',
        'Observações':f'{end} (busca pública, lote 04). Telefone não confirmado por ligação.',
        'Origem':'Busca web set/2026','_tipo':tipo})

for n, r in enumerate(novos, 1): r['Nº'] = n

def gravar(nome_arq, linhas):
    with open(nome_arq,'w',encoding='utf-8-sig',newline='\r\n') as f:
        w = csv.DictWriter(f, fieldnames=COLS, delimiter=';', quoting=csv.QUOTE_ALL,
                           extrasaction='ignore', lineterminator='\r\n')
        w.writeheader()
        for l in linhas: w.writerow(l)

gravar('demais-empresas-ribeirao-preto-LIMPO.csv', limpo)
gravar('clientes-ligar-ribeirao-preto-NOVOS.csv', novos)
json.dump(novos, open('novos.json','w',encoding='utf-8'), ensure_ascii=False)
json.dump(limpo, open('limpo.json','w',encoding='utf-8'), ensure_ascii=False)
json.dump(relatorio, open('relatorio.json','w',encoding='utf-8'), ensure_ascii=False)

print('=== BASE ATUAL (144 linhas) ===')
print(f"  duplicados marcados : {dups_internas}")
print(f"  telefones corrigidos: {relatorio['tel_corrigido']}")
print(f"  nichos preenchidos  : {relatorio['nicho_inferido']}")
print(f"  CNPJ invalido       : {len(relatorio['cnpj_invalido'])}")
print(f"  sem telefone        : {len(relatorio['sem_telefone'])}")
print('\n=== LEADS NOVOS ===')
print(f"  coletados : {len(novos)+len(descartados)}")
print(f"  descartados por ja existirem: {len(descartados)}")
for n,m in descartados: print(f"     - {n} ({m})")
print('\n=== CAMPOS RECUPERADOS NA FUSAO DE DUPLICATAS ===')
for n,g in relatorio['campos_recuperados']: print(f"     {n}: {', '.join(g)}")
print(f"  NOVOS para importar: {len(novos)}")
cel = sum(1 for r in novos if r['_tipo']=='celular')
print(f"     celular/WhatsApp: {cel} | fixo: {len(novos)-cel}")
print('\n  por nicho:')
for k,v in Counter(r['Categoria'] for r in novos).most_common(): print(f"     {v:>3}  {k}")
