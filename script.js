/* ==========================================================================
   PROSPECTAR — inteligência de empresas (demo 100% front-end)
   --------------------------------------------------------------------------
   Modelo de dados: a base real (23.702.546 empresas) é representada por uma
   AMOSTRA PONDERADA. Cada registro gerado carrega um peso (`w`) — a quantidade
   de empresas reais que ele representa. Todos os agregados da tela (cards,
   mapa, tabelas, gráficos) são somas ponderadas sobre a amostra filtrada, o
   que mantém números consistentes entre todas as abas.
   ========================================================================== */
'use strict';

/* ------------------------------ utilidades ------------------------------ */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rnd = mulberry32(20260830);
const ri  = (a,b)=>a+Math.floor(rnd()*(b-a+1));
const pick= arr=>arr[Math.floor(rnd()*arr.length)];
function pickW(pairs){ // [[valor,peso],...]
  let t=0; for(const p of pairs) t+=p[1];
  let r=rnd()*t;
  for(const p of pairs){ r-=p[1]; if(r<=0) return p[0]; }
  return pairs[pairs.length-1][0];
}
const nf  = new Intl.NumberFormat('pt-BR');
const nf1 = new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const fmtInt = v => nf.format(Math.round(v));
function fmtMoney(v){
  const a=Math.abs(v);
  if(a>=1e12) return 'R$ '+(a>=1e14?fmtInt(v/1e12):nf1.format(v/1e12))+' Trilhões';
  if(a>=1e9)  return 'R$ '+(a>=1e11?fmtInt(v/1e9):nf1.format(v/1e9))+' Bilhões';
  if(a>=1e6)  return 'R$ '+(a>=1e8?fmtInt(v/1e6):nf1.format(v/1e6))+' Milhões';
  if(a>=1e3)  return 'R$ '+fmtInt(v/1e3)+' Mil';
  return 'R$ '+fmtInt(v);
}
function fmtMoneyFull(v){return 'R$ '+nf.format(Math.round(v));}
function fmtCompact(v){
  if(v>=1e9) return nf1.format(v/1e9)+'B';
  if(v>=1e6) return nf1.format(v/1e6)+'M';
  if(v>=1e3) return nf1.format(v/1e3)+'K';
  return fmtInt(v);
}
const pct = (a,b)=> b? (a/b*100):0;
const norm= s => (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const el  = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ------------------------------ tabelas base ---------------------------- */
const TOTAL_EMPRESAS = 23702546;
const TOTAL_FATURAMENTO = 152e12;

const REGIOES = {
  'Norte':['AC','AP','AM','PA','RO','RR','TO'],
  'Nordeste':['AL','BA','CE','MA','PB','PE','PI','RN','SE'],
  'Centro-Oeste':['DF','GO','MT','MS'],
  'Sudeste':['ES','MG','RJ','SP'],
  'Sul':['PR','RS','SC']
};

/* uf, nome, região, coluna/linha no grid do mapa, total de empresas */
const ESTADOS = [
  ['RR','Roraima','Norte',3,1,52000],       ['AP','Amapá','Norte',4,1,58000],
  ['AM','Amazonas','Norte',2,2,213000],     ['PA','Pará','Norte',3,2,521000],
  ['MA','Maranhão','Nordeste',4,2,342000],  ['CE','Ceará','Nordeste',5,2,724000],
  ['RN','Rio Grande do Norte','Nordeste',6,2,281000],
  ['AC','Acre','Norte',1,3,62000],          ['RO','Rondônia','Norte',2,3,198000],
  ['TO','Tocantins','Norte',3,3,161000],    ['PI','Piauí','Nordeste',4,3,224000],
  ['PB','Paraíba','Nordeste',5,3,284000],   ['PE','Pernambuco','Nordeste',6,3,782000],
  ['MT','Mato Grosso','Centro-Oeste',2,4,498000], ['GO','Goiás','Centro-Oeste',3,4,951000],
  ['BA','Bahia','Nordeste',4,4,1204000],    ['AL','Alagoas','Nordeste',5,4,221000],
  ['SE','Sergipe','Nordeste',6,4,186000],
  ['MS','Mato Grosso do Sul','Centro-Oeste',2,5,361000],
  ['DF','Distrito Federal','Centro-Oeste',3,5,452000],
  ['MG','Minas Gerais','Sudeste',4,5,2396000], ['ES','Espírito Santo','Sudeste',5,5,552000],
  ['PR','Paraná','Sul',2,6,1504000],        ['SP','São Paulo','Sudeste',3,6,6629546],
  ['RJ','Rio de Janeiro','Sudeste',4,6,1948000],
  ['SC','Santa Catarina','Sul',2,7,1346000],
  ['RS','Rio Grande do Sul','Sul',2,8,1552000]
].map(a=>({uf:a[0],nome:a[1],regiao:a[2],col:a[3],row:a[4],empresas:a[5]}));
const UF_MAP = Object.fromEntries(ESTADOS.map(e=>[e.uf,e]));

/* municípios nomeados + nomes usados no restante (interior) de cada estado */
const CIDADES = {
 SP:[['SÃO PAULO',2248955],['CAMPINAS',214300],['GUARULHOS',168900],['RIBEIRÃO PRETO',128700],['SÃO BERNARDO DO CAMPO',132400],['OSASCO',111200],['SOROCABA',105600],['SÃO JOSÉ DOS CAMPOS',98300],['SANTOS',92400]],
 MG:[['BELO HORIZONTE',466560],['UBERLÂNDIA',118400],['CONTAGEM',74300],['JUIZ DE FORA',71900],['BETIM',44200]],
 RJ:[['RIO DE JANEIRO',912008],['NITERÓI',92700],['DUQUE DE CAXIAS',78400],['NOVA IGUAÇU',66100],['CAMPOS DOS GOYTACAZES',45300]],
 PR:[['CURITIBA',407407],['LONDRINA',96800],['MARINGÁ',88500],['PONTA GROSSA',43700],['CASCAVEL',42900]],
 RS:[['PORTO ALEGRE',251285],['CAXIAS DO SUL',71300],['CANOAS',44800],['PELOTAS',36500],['SANTA MARIA',32400]],
 SC:[['FLORIANÓPOLIS',118900],['JOINVILLE',96400],['BLUMENAU',71200],['CHAPECÓ',42800],['ITAJAÍ',38600]],
 BA:[['SALVADOR',294642],['FEIRA DE SANTANA',62300],['VITÓRIA DA CONQUISTA',38900],['CAMAÇARI',26400]],
 CE:[['FORTALEZA',292506],['CAUCAIA',26800],['JUAZEIRO DO NORTE',24300]],
 PE:[['RECIFE',246900],['JABOATÃO DOS GUARARAPES',48200],['OLINDA',34700],['CARUARU',33100]],
 GO:[['GOIÂNIA',273468],['APARECIDA DE GOIÂNIA',62400],['ANÁPOLIS',41300]],
 ES:[['VITÓRIA',78900],['SERRA',56400],['VILA VELHA',54200],['CARIACICA',33800]],
 PA:[['BELÉM',133400],['ANANINDEUA',38700],['SANTARÉM',24600]],
 MT:[['CUIABÁ',118700],['VÁRZEA GRANDE',34200],['RONDONÓPOLIS',30900]],
 MS:[['CAMPO GRANDE',152300],['DOURADOS',33100]],
 MA:[['SÃO LUÍS',116800],['IMPERATRIZ',26400]],
 PB:[['JOÃO PESSOA',108600],['CAMPINA GRANDE',39700]],
 RN:[['NATAL',118400],['MOSSORÓ',30200]],
 PI:[['TERESINA',103700],['PARNAÍBA',15300]],
 AL:[['MACEIÓ',104300],['ARAPIRACA',18700]],
 AM:[['MANAUS',152600],['PARINTINS',8400]],
 RO:[['PORTO VELHO',78900],['JI-PARANÁ',18200]],
 SE:[['ARACAJU',89400],['NOSSA SENHORA DO SOCORRO',12600]],
 TO:[['PALMAS',54300],['ARAGUAÍNA',19800]],
 AC:[['RIO BRANCO',36800]],
 AP:[['MACAPÁ',34600]],
 RR:[['BOA VISTA',37900]],
 DF:[['BRASÍLIA',404763]]
};
const INTERIOR = {
 SP:['BAURU','PIRACICABA','JUNDIAÍ','LIMEIRA','ARARAQUARA','MARÍLIA','FRANCA','TAUBATÉ'],
 MG:['MONTES CLAROS','POÇOS DE CALDAS','DIVINÓPOLIS','GOVERNADOR VALADARES','VARGINHA'],
 RJ:['PETRÓPOLIS','VOLTA REDONDA','MACAÉ','CABO FRIO'],
 PR:['FOZ DO IGUAÇU','GUARAPUAVA','TOLEDO','PARANAGUÁ'],
 RS:['NOVO HAMBURGO','PASSO FUNDO','BENTO GONÇALVES','RIO GRANDE'],
 SC:['CRICIÚMA','LAGES','BALNEÁRIO CAMBORIÚ','JARAGUÁ DO SUL'],
 BA:['ILHÉUS','JUAZEIRO','BARREIRAS','ITABUNA'],
 CE:['SOBRAL','MARACANAÚ','CRATO'],
 PE:['PETROLINA','GARANHUNS','PAULISTA'],
 GO:['RIO VERDE','CATALÃO','ITUMBIARA'],
 ES:['LINHARES','COLATINA','GUARAPARI'],
 PA:['MARABÁ','CASTANHAL','PARAUAPEBAS'],
 MT:['SINOP','SORRISO','LUCAS DO RIO VERDE'],
 MS:['TRÊS LAGOAS','CORUMBÁ','PONTA PORÃ'],
 MA:['CAXIAS','TIMON','AÇAILÂNDIA'],
 PB:['PATOS','BAYEUX','SOUSA'],
 RN:['PARNAMIRIM','CAICÓ','CURRAIS NOVOS'],
 PI:['PICOS','FLORIANO','PIRIPIRI'],
 AL:['PALMEIRA DOS ÍNDIOS','RIO LARGO','UNIÃO DOS PALMARES'],
 AM:['ITACOATIARA','MANACAPURU','TEFÉ'],
 RO:['ARIQUEMES','VILHENA','CACOAL'],
 SE:['LAGARTO','ITABAIANA','ESTÂNCIA'],
 TO:['GURUPI','PORTO NACIONAL','PARAÍSO DO TOCANTINS'],
 AC:['CRUZEIRO DO SUL','SENA MADUREIRA'],
 AP:['SANTANA','LARANJAL DO JARI'],
 RR:['RORAINÓPOLIS','CARACARAÍ'],
 DF:['TAGUATINGA','CEILÂNDIA','ÁGUAS CLARAS','GAMA']
};

const SETORES = [
  ['Serviços',.18],['Varejo',.19],['Construção',.085],['Tecnologia',.075],['Transporte',.07],
  ['Alimentação',.06],['Saúde',.06],['Restaurantes',.05],['Indústria',.045],['Agricultura',.045],
  ['Manufatura',.04],['Financeiro',.04],['Educação',.035],['Turismo',.025]
];
const SETOR_NOMES = SETORES.map(s=>s[0]);

const SECOES = {
  'Serviços':['Outras Atividades de Serviços','Atividades Administrativas e Serviços Complementares','Atividades Profissionais, Científicas e Técnicas'],
  'Varejo':['Comércio; Reparação de Veículos e Motocicletas'],
  'Construção':['Construção'],
  'Tecnologia':['Informação e Comunicação'],
  'Transporte':['Transporte, Armazenagem e Correio'],
  'Alimentação':['Indústrias de Transformação','Alojamento e Alimentação'],
  'Saúde':['Saúde Humana e Serviços Sociais'],
  'Restaurantes':['Alojamento e Alimentação'],
  'Indústria':['Indústrias de Transformação'],
  'Agricultura':['Agricultura, Pecuária e Produção Florestal'],
  'Manufatura':['Indústrias de Transformação'],
  'Financeiro':['Atividades Financeiras, de Seguros e Serviços Relacionados'],
  'Educação':['Educação'],
  'Turismo':['Alojamento e Alimentação']
};

const CNAES = [
  ['6201-5/01','Desenvolvimento de programas de computador sob encomenda','Tecnologia'],
  ['6202-3/00','Desenvolvimento e licenciamento de programas customizáveis','Tecnologia'],
  ['6209-1/00','Suporte técnico e manutenção em tecnologia da informação','Tecnologia'],
  ['6311-9/00','Tratamento de dados e hospedagem na internet','Tecnologia'],
  ['4781-4/00','Comércio varejista de artigos do vestuário e acessórios','Varejo'],
  ['4711-3/02','Comércio varejista de mercadorias — supermercados','Varejo'],
  ['4530-7/03','Comércio a varejo de peças e acessórios para veículos','Varejo'],
  ['4744-0/99','Comércio varejista de materiais de construção','Varejo'],
  ['5611-2/01','Restaurantes e similares','Restaurantes'],
  ['5611-2/03','Lanchonetes, casas de chá e sucos','Restaurantes'],
  ['1091-1/02','Fabricação de produtos de padaria e confeitaria','Alimentação'],
  ['1071-6/00','Fabricação de açúcar em bruto','Alimentação'],
  ['4120-4/00','Construção de edifícios','Construção'],
  ['4211-1/01','Construção de rodovias e ferrovias','Construção'],
  ['4322-3/01','Instalações hidráulicas e sanitárias','Construção'],
  ['8610-1/01','Atividades de atendimento hospitalar','Saúde'],
  ['8630-5/03','Atividade médica ambulatorial restrita a consultas','Saúde'],
  ['8650-0/04','Atividades de fisioterapia','Saúde'],
  ['8513-9/00','Ensino fundamental','Educação'],
  ['8599-6/04','Treinamento em desenvolvimento profissional e gerencial','Educação'],
  ['5510-8/01','Hotéis','Turismo'],
  ['7911-2/00','Agências de viagens','Turismo'],
  ['4930-2/02','Transporte rodoviário de carga intermunicipal e internacional','Transporte'],
  ['5320-2/02','Serviços de entrega rápida','Transporte'],
  ['5211-7/01','Armazéns gerais e depósitos','Transporte'],
  ['6422-1/00','Bancos múltiplos com carteira comercial','Financeiro'],
  ['6613-4/00','Administração de cartões de crédito','Financeiro'],
  ['6619-3/99','Outras atividades auxiliares dos serviços financeiros','Financeiro'],
  ['0111-3/02','Cultivo de milho','Agricultura'],
  ['0151-2/01','Criação de bovinos para corte','Agricultura'],
  ['0113-0/00','Cultivo de cana-de-açúcar','Agricultura'],
  ['2599-3/99','Fabricação de outros produtos de metal','Manufatura'],
  ['3101-2/00','Fabricação de móveis com predominância de madeira','Manufatura'],
  ['2229-3/02','Fabricação de artefatos de material plástico','Manufatura'],
  ['1052-0/00','Fabricação de laticínios','Indústria'],
  ['2063-1/00','Fabricação de cosméticos e produtos de higiene','Indústria'],
  ['2811-9/00','Fabricação de motores e turbinas','Indústria'],
  ['8211-3/00','Serviços combinados de escritório e apoio administrativo','Serviços'],
  ['8121-4/00','Limpeza em prédios e domicílios','Serviços'],
  ['6920-6/01','Atividades de contabilidade','Serviços'],
  ['6911-7/01','Serviços advocatícios','Serviços'],
  ['7020-4/00','Consultoria em gestão empresarial','Serviços']
];
const NCMS = [
  ['8471.30.12','Máquinas automáticas para processamento de dados','Tecnologia'],
  ['8517.62.59','Aparelhos para transmissão/recepção de dados','Tecnologia'],
  ['1701.14.00','Açúcar de cana em bruto','Agricultura'],
  ['1005.90.10','Milho em grão','Agricultura'],
  ['0201.30.00','Carnes bovinas desossadas, frescas ou refrigeradas','Agricultura'],
  ['6109.10.00','Camisetas de malha de algodão','Varejo'],
  ['6403.99.90','Calçados com sola de borracha','Varejo'],
  ['3004.90.69','Medicamentos para uso humano','Saúde'],
  ['9018.90.99','Instrumentos e aparelhos médico-cirúrgicos','Saúde'],
  ['7308.90.90','Estruturas de ferro ou aço para construção','Construção'],
  ['2523.29.10','Cimento Portland comum','Construção'],
  ['8703.23.10','Automóveis de passageiros','Manufatura'],
  ['9403.60.00','Móveis de madeira','Manufatura'],
  ['3923.30.00','Garrafões, garrafas e frascos de plástico','Indústria'],
  ['2207.10.00','Álcool etílico não desnaturado','Indústria'],
  ['4011.10.00','Pneus novos para automóveis','Transporte'],
  ['2710.19.32','Óleos lubrificantes','Transporte'],
  ['1905.90.90','Produtos de padaria e confeitaria','Alimentação'],
  ['0901.21.00','Café torrado não descafeinado','Alimentação']
];

const PORTES = [
  ['MEI',.600,72000,[1,1],[1000,5000]],
  ['Microempresa',.293,480000,[2,9],[5000,80000]],
  ['Pequena Empresa',.085,4200000,[10,49],[80000,900000]],
  ['Média Empresa',.018,42000000,[50,249],[900000,12000000]],
  ['Grande Empresa',.004,520000000,[250,1500],[12000000,900000000]]
];
const PORTE_NOMES = PORTES.map(p=>p[0]);

const SITUACOES = ['Ativa','Suspensa','Inapta','Baixada'];
const NATUREZAS = ['Empresário Individual (MEI)','Empresário Individual','Sociedade Empresária Limitada',
  'Sociedade Limitada Unipessoal','Sociedade Anônima Fechada','Sociedade Anônima Aberta','Cooperativa'];
const REGIMES = ['Simples Nacional','Lucro Presumido','Lucro Real'];
const RISCOS = ['Baixo','Médio','Alto'];
const DIGITAL = [['website','Website','fa-globe'],['instagram','Instagram','fa-instagram'],
  ['facebook','Facebook','fa-facebook'],['linkedin','LinkedIn','fa-linkedin'],
  ['google','Google Business','fa-google'],['ecommerce','E-commerce','fa-cart-shopping']];
const DIG_PROB = {
  website:[.58,.72,.88,.95,.99], instagram:[.50,.58,.66,.72,.78],
  facebook:[.44,.50,.56,.60,.66], linkedin:[.14,.26,.52,.78,.94],
  google:[.55,.66,.78,.86,.93],  ecommerce:[.12,.20,.32,.42,.55]
};
const DECISORES = [['socios','Sócios'],['proprietarios','Proprietários'],['diretores','Diretores'],
  ['ceos','CEOs'],['gerentes','Gerentes'],['compradores','Compradores'],['marketing','Marketing'],
  ['financeiro','Financeiro'],['rh','RH'],['tecnologia','Tecnologia']];

const PALAVRAS_SETOR = {
  'Tecnologia':['software','saas','cloud','dados','automação','ti','startup'],
  'Serviços':['consultoria','terceirização','assessoria','facilities','contabilidade'],
  'Varejo':['loja','atacado','franquia','distribuidora','magazine'],
  'Alimentação':['alimentos','bebidas','panificação','laticínios'],
  'Restaurantes':['delivery','food service','pizzaria','cafeteria'],
  'Manufatura':['fábrica','usinagem','injeção','montagem'],
  'Indústria':['industrial','produção','planta','maquinário'],
  'Construção':['obra','incorporadora','engenharia','empreiteira'],
  'Saúde':['clínica','hospital','odontologia','laboratório'],
  'Educação':['escola','curso','treinamento','ead'],
  'Turismo':['hotel','pousada','agência','eventos'],
  'Transporte':['logística','frota','armazenagem','fretamento'],
  'Financeiro':['crédito','investimento','seguros','fintech'],
  'Agricultura':['agro','fazenda','pecuária','safra']
};
const CRESC_SETOR={'Tecnologia':12,'Saúde':8,'Agricultura':7,'Turismo':6,'Financeiro':5,'Serviços':4,
  'Construção':3,'Transporte':2,'Educação':2,'Alimentação':1,'Varejo':1,'Restaurantes':0,
  'Indústria':-1,'Manufatura':-2};
const PALAVRAS_GERAIS = ['exportação','importação','b2b','sustentabilidade','licitação','franquia'];
const NOME_PRE = ['Alfa','Nova','Prime','Global','Vale','Central','Real','Atlas','Norte','Sul','Mega',
  'Delta','Ipê','Aurora','Vértice','Sigma','Horizonte','Pampa','Cerrado','Litoral','Serra','Aliança','Bandeirante'];
const NOME_SUF = ['LTDA','ME','S.A.','EIRELI','& Cia','Group','Brasil','Comercial'];
const NOME_MID = {
  'Tecnologia':['Tech','Systems','Digital','Soft','Data'],'Serviços':['Serviços','Consultoria','Assessoria','Solutions'],
  'Varejo':['Comércio','Distribuidora','Store','Varejo'],'Alimentação':['Alimentos','Foods','Nutri'],
  'Restaurantes':['Restaurante','Gastronomia','Sabor'],'Manufatura':['Manufatura','Metal','Plásticos'],
  'Indústria':['Indústria','Industrial','Produtos'],'Construção':['Construções','Engenharia','Empreendimentos'],
  'Saúde':['Saúde','Clínica','Medical'],'Educação':['Educação','Ensino','Academy'],
  'Turismo':['Turismo','Viagens','Hotelaria'],'Transporte':['Transportes','Logística','Cargas'],
  'Financeiro':['Financeira','Capital','Invest'],'Agricultura':['Agro','Agropecuária','Rural']
};

/* --------------------------- geração da amostra -------------------------- */
const N_ALVO = 950;
const ROWS = [];

function decisoresPara(si){
  const d={}; DECISORES.forEach(x=>d[x[0]]=0);
  d.socios = si<=1?1:ri(1,Math.min(2+si,6));
  if(rnd()<[.55,.45,.3,.15,.05][si]) d.proprietarios = 1;
  const p={diretores:[0,.02,.3,.75,.98],ceos:[0,.03,.22,.6,.95],gerentes:[0,.2,.7,.95,1],
    compradores:[0,.05,.3,.7,.95],marketing:[0,.06,.28,.62,.92],financeiro:[0,.1,.42,.8,.97],
    rh:[0,.03,.2,.65,.95],tecnologia:[0,.05,.24,.6,.93]};
  const q={diretores:[0,1,1,3,7],ceos:[0,1,1,1,1],gerentes:[0,1,3,8,26],compradores:[0,1,1,3,9],
    marketing:[0,1,1,2,8],financeiro:[0,1,2,3,9],rh:[0,1,1,2,7],tecnologia:[0,1,2,4,12]};
  for(const k in p) if(rnd()<p[k][si]) d[k]=Math.max(1,Math.round(q[k][si]*(.6+rnd()*.8)));
  return d;
}

(function gerar(){
  // 1. entradas geográficas: cidades nomeadas + bucket "interior" de cada UF
  const entradas=[];
  ESTADOS.forEach(e=>{
    const nomeadas = CIDADES[e.uf]||[];
    let soma=0; nomeadas.forEach(c=>{entradas.push({cidade:c[0],uf:e.uf,total:c[1],rank:true}); soma+=c[1];});
    const resto = Math.max(0, e.empresas - soma);
    if(resto>0) entradas.push({cidade:null,uf:e.uf,total:resto,rank:false});
  });
  // 2. distribui registros por município E por porte (estratificado), para que
  //    nenhuma cidade fique sem representante de cada porte — o que tornaria o
  //    faturamento municipal instável, já que as grandes empresas concentram receita.
  const MIN_LINHAS=[1,1,1,2,3];
  entradas.forEach(ent=>{
    const n = Math.max(1, Math.round(N_ALVO*ent.total/TOTAL_EMPRESAS));
    PORTES.forEach((porte,si)=>{
    const linhas = Math.max(MIN_LINHAS[si], Math.round(n*porte[1]));
    const w = ent.total*porte[1]/linhas;
    for(let i=0;i<linhas;i++){
      const setor = pickW(SETORES);
      const cidade= ent.rank? ent.cidade : pick(INTERIOR[ent.uf]||[UF_MAP[ent.uf].nome.toUpperCase()]);
      const cnaesSet = CNAES.filter(c=>c[2]===setor);
      const cnae  = pick(cnaesSet.length?cnaesSet:CNAES);
      let cnae2=null;
      if(rnd()<.62){ const o=CNAES[Math.floor(rnd()*CNAES.length)]; if(o[0]!==cnae[0]) cnae2=o; }
      const ncmSet= NCMS.filter(n=>n[2]===setor);
      const ncm   = (ncmSet.length && rnd()<.55)? pick(ncmSet) : (rnd()<.15? pick(NCMS):null);
      const situacao = pickW([['Ativa',.87],['Suspensa',.05],['Inapta',.045],['Baixada',.035]]);
      const natureza = si===0? 'Empresário Individual (MEI)'
        : si===1? pickW([['Empresário Individual',.4],['Sociedade Empresária Limitada',.4],['Sociedade Limitada Unipessoal',.2]])
        : si===2? pickW([['Sociedade Empresária Limitada',.7],['Sociedade Limitada Unipessoal',.2],['Empresário Individual',.1]])
        : si===3? pickW([['Sociedade Empresária Limitada',.75],['Sociedade Anônima Fechada',.18],['Cooperativa',.07]])
        : pickW([['Sociedade Anônima Fechada',.45],['Sociedade Anônima Aberta',.2],['Sociedade Empresária Limitada',.3],['Cooperativa',.05]]);
      const regime = si===0? 'Simples Nacional'
        : si<=2? pickW([['Simples Nacional',.78],['Lucro Presumido',.19],['Lucro Real',.03]])
        : si===3? pickW([['Simples Nacional',.22],['Lucro Presumido',.55],['Lucro Real',.23]])
        : pickW([['Lucro Real',.62],['Lucro Presumido',.33],['Simples Nacional',.05]]);
      const score = Math.min(98, Math.max(12, Math.round(52 + si*7 + (rnd()-.4)*42)));
      const empregados = si===0?1:ri(porte[3][0],porte[3][1]);
      const receita = porte[2]*(0.35+rnd()*1.8)*(setor==='Financeiro'?1.6:setor==='Agricultura'?1.3:1);
      const dig={}; DIGITAL.forEach(d=>{dig[d[0]] = rnd() < DIG_PROB[d[0]][si];});
      const kw = [];
      (PALAVRAS_SETOR[setor]||[]).forEach(p=>{ if(rnd()<.5) kw.push(p); });
      if(rnd()<.3) kw.push(pick(PALAVRAS_GERAIS));
      if(dig.ecommerce) kw.push('e-commerce');
      const nome = `${pick(NOME_PRE)} ${pick(NOME_MID[setor]||['Brasil'])} ${pick(NOME_SUF)}`;
      ROWS.push({
        name:nome, city:cidade, state:ent.uf, regiao:UF_MAP[ent.uf].regiao,
        sector:setor, secao:pick(SECOES[setor]), size:porte[0], sizeIdx:si,
        cnae:cnae[0], cnaeLabel:cnae[1], cnae2:cnae2?cnae2[0]:null, cnae2Label:cnae2?cnae2[1]:null,
        ncm:ncm?ncm[0]:null, ncmLabel:ncm?ncm[1]:null, keywords:kw,
        revenue:receita, employees:empregados, financialScore:score,
        growth: Math.round((score-52)/4 + CRESC_SETOR[setor] + (rnd()-.5)*14),
        risco: score>=70?'Baixo':score>=45?'Médio':'Alto',
        debt: score>=70? receita*rnd()*.06 : score>=45? receita*(.06+rnd()*.15) : receita*(.2+rnd()*.4),
        situacao, natureza, regime, simples:regime==='Simples Nacional', mei:si===0,
        capital: Math.round(porte[4][0] + rnd()*(porte[4][1]-porte[4][0])),
        ano: Math.min(2026, 1968 + Math.floor(Math.pow(rnd(),.55)*58)),
        ...dig, dec:decisoresPara(si), agg:!ent.rank, w
      });
    }
    });
  });
  // 3. calibra o faturamento para que a base completa some exatamente R$ 152 tri
  const soma = ROWS.reduce((s,r)=>s+r.revenue*r.w,0);
  const k = TOTAL_FATURAMENTO/soma;
  ROWS.forEach(r=>{r.revenue*=k; r.debt*=k;});
})();

/* ------------------------------- estado --------------------------------- */
const F = {
  regioes:new Set(), estados:new Set(), setores:new Set(), secoes:new Set(),
  cnaePri:new Set(), cnaeSec:new Set(), ncm:new Set(), palavras:[],
  portes:new Set(), decisores:new Set(), digital:new Set(), riscos:new Set(),
  situacao:'', natureza:'', regime:'', simples:false, mei:false,
  funcMin:0, funcMax:2000, anoMin:1960, anoMax:2026,
  capMin:0, capMax:100, scoreMin:0, scoreMax:100, revMin:0, revMax:100
};
const UI = {
  view:'calculadora', tab:'regiao',
  cidSort:{key:'empresas',dir:-1}, cidPage:1, cidQuery:'',
  empSort:{key:'revenue',dir:-1}, empPage:1, empQuery:''
};
const charts = {};

const capVal = v => v<=0?0:Math.round(Math.pow(10, v/100*7));
const revVal = v => v<=0?0:Math.round(Math.pow(10, v/100*9));

/* ------------------------------- filtro --------------------------------- */
function match(r){
  if(F.regioes.size && !F.regioes.has(r.regiao)) return false;
  if(F.estados.size && !F.estados.has(r.state)) return false;
  if(F.setores.size && !F.setores.has(r.sector)) return false;
  if(F.secoes.size  && !F.secoes.has(r.secao)) return false;
  if(F.cnaePri.size && !F.cnaePri.has(r.cnae)) return false;
  if(F.cnaeSec.size && !(r.cnae2 && F.cnaeSec.has(r.cnae2))) return false;
  if(F.ncm.size     && !(r.ncm && F.ncm.has(r.ncm))) return false;
  if(F.portes.size  && !F.portes.has(r.size)) return false;
  if(F.riscos.size  && !F.riscos.has(r.risco)) return false;
  if(F.decisores.size){ let ok=false; for(const k of F.decisores) if(r.dec[k]>0){ok=true;break;} if(!ok) return false; }
  if(F.digital.size){ for(const k of F.digital) if(!r[k]) return false; }
  if(F.situacao && r.situacao!==F.situacao) return false;
  if(F.natureza && r.natureza!==F.natureza) return false;
  if(F.regime   && r.regime!==F.regime) return false;
  if(F.simples  && !r.simples) return false;
  if(F.mei      && !r.mei) return false;
  if(r.employees<F.funcMin || (F.funcMax<2000 && r.employees>F.funcMax)) return false;
  if(r.ano<F.anoMin || r.ano>F.anoMax) return false;
  if(r.capital<capVal(F.capMin) || (F.capMax<100 && r.capital>capVal(F.capMax))) return false;
  if(r.financialScore<F.scoreMin || r.financialScore>F.scoreMax) return false;
  if(r.revenue<revVal(F.revMin) || (F.revMax<100 && r.revenue>revVal(F.revMax))) return false;
  if(F.palavras.length){
    const hay = norm(r.name+' '+r.sector+' '+r.cnaeLabel+' '+(r.ncmLabel||'')+' '+r.keywords.join(' '));
    if(!F.palavras.some(p=>hay.includes(norm(p)))) return false;
  }
  return true;
}
const filtrar = ()=>ROWS.filter(match);
const temFiltro = ()=>JSON.stringify(serial())!==JSON.stringify(BASE_F);
function serial(){
  return {r:[...F.regioes],e:[...F.estados],s:[...F.setores],sc:[...F.secoes],c1:[...F.cnaePri],
    c2:[...F.cnaeSec],n:[...F.ncm],p:F.palavras,po:[...F.portes],d:[...F.decisores],
    dg:[...F.digital],rk:[...F.riscos],si:F.situacao,na:F.natureza,re:F.regime,sm:F.simples,
    me:F.mei,fmin:F.funcMin,fmax:F.funcMax,amin:F.anoMin,amax:F.anoMax,cmin:F.capMin,
    cmax:F.capMax,smin:F.scoreMin,smax:F.scoreMax,rvmin:F.revMin,rvmax:F.revMax};
}
const BASE_F = JSON.parse(JSON.stringify(serial()));

/* ----------------------------- agregação -------------------------------- */
function agregar(rows){
  const a = {n:0, fat:0, emp:0, capital:0, score:0, growth:0, debt:0,
    porUF:{}, porCidade:{}, porSetor:{}, porPorte:{}, porNatureza:{}, porDecada:{},
    dig:{}, dec:{}, decEmp:{}, risco:{Baixo:0,'Médio':0,Alto:0}, scoreBuckets:[0,0,0,0,0],
    simples:0, ativa:0, growthSetor:{}, rows};
  DIGITAL.forEach(d=>a.dig[d[0]]=0);
  DECISORES.forEach(d=>{a.dec[d[0]]=0;a.decEmp[d[0]]=0;});
  rows.forEach(r=>{
    const w=r.w, fat=r.revenue*w;
    a.n+=w; a.fat+=fat; a.emp+=r.employees*w; a.capital+=r.capital*w;
    a.score+=r.financialScore*w; a.growth+=r.growth*w; a.debt+=r.debt*w;
    a.porUF[r.state]=(a.porUF[r.state]||0)+w;
    if(!r.agg){
      if(!a.porCidade[r.city]) a.porCidade[r.city]={cidade:r.city,uf:r.state,empresas:0,faturamento:0};
      a.porCidade[r.city].empresas+=w; a.porCidade[r.city].faturamento+=fat;
    }
    a.porSetor[r.sector]=(a.porSetor[r.sector]||0)+w;
    a.porPorte[r.size]=(a.porPorte[r.size]||0)+w;
    a.porNatureza[r.natureza]=(a.porNatureza[r.natureza]||0)+w;
    const dec=Math.floor(r.ano/10)*10; a.porDecada[dec]=(a.porDecada[dec]||0)+w;
    DIGITAL.forEach(d=>{ if(r[d[0]]) a.dig[d[0]]+=w; });
    DECISORES.forEach(d=>{ const c=r.dec[d[0]]; if(c>0){ a.dec[d[0]]+=c*w; a.decEmp[d[0]]+=w; } });
    a.risco[r.risco]+=w;
    a.scoreBuckets[Math.min(4,Math.floor(r.financialScore/20))]+=w;
    if(r.simples) a.simples+=w;
    if(r.situacao==='Ativa') a.ativa+=w;
    if(!a.growthSetor[r.sector]) a.growthSetor[r.sector]={s:0,w:0};
    a.growthSetor[r.sector].s+=r.growth*w; a.growthSetor[r.sector].w+=w;
  });
  a.scoreMedio = a.n? a.score/a.n : 0;
  a.growthMedio= a.n? a.growth/a.n : 0;
  a.ticket     = a.n? a.fat/a.n : 0;
  a.empMedio   = a.n? a.emp/a.n : 0;
  a.totalDecisores = Object.values(a.dec).reduce((s,v)=>s+v,0);
  return a;
}

/* ======================================================================== */
/*                                   UI                                     */
/* ======================================================================== */
const BLUE='#1565c0', GREEN='#22a06b', AMBER='#e0a300', RED='#d64545';
const PALETA=['#1565c0','#2e7fd4','#4a97e0','#66aeea','#22a06b','#3fb583','#7bc9a5','#0d47a1',
  '#5c6bc0','#8e99f3','#26a69a','#78909c','#e0a300','#d64545'];

function toast(msg){
  const t=el('toast'); t.textContent=msg; t.hidden=false;
  clearTimeout(toast._t); toast._t=setTimeout(()=>{t.hidden=true;},2600);
}

/* --------------------------- listas de filtro --------------------------- */
const LISTS=[
  {id:'listRegiao',  set:F.regioes,   items:()=>Object.keys(REGIOES).map(r=>({v:r,l:r})),                         cnt:r=>r.regiao},
  {id:'listEstado',  set:F.estados,   items:()=>ESTADOS.map(e=>({v:e.uf,l:e.nome+' ('+e.uf+')'})),                cnt:r=>r.state},
  {id:'listSetor',   set:F.setores,   items:()=>SETOR_NOMES.map(s=>({v:s,l:s})),                                  cnt:r=>r.sector},
  {id:'listCnaePri', set:F.cnaePri,   items:()=>CNAES.map(c=>({v:c[0],l:c[0]+' — '+c[1]})),                       cnt:r=>r.cnae},
  {id:'listCnaeSec', set:F.cnaeSec,   items:()=>CNAES.map(c=>({v:c[0],l:c[0]+' — '+c[1]})),                       cnt:r=>r.cnae2},
  {id:'listNcm',     set:F.ncm,       items:()=>NCMS.map(n=>({v:n[0],l:n[0]+' — '+n[1]})),                        cnt:r=>r.ncm},
  {id:'listPorte',   set:F.portes,    items:()=>PORTE_NOMES.map(p=>({v:p,l:p})),                                  cnt:r=>r.size},
  {id:'listDecisor', set:F.decisores, items:()=>DECISORES.map(d=>({v:d[0],l:d[1]})),                              cnt:null},
  {id:'listRisco',   set:F.riscos,    items:()=>RISCOS.map(r=>({v:r,l:'Risco '+r})),                              cnt:r=>r.risco},
  {id:'listDigital', set:F.digital,   items:()=>DIGITAL.map(d=>({v:d[0],l:d[1]})),                                cnt:null}
];
const LIST_BY_ID = Object.fromEntries(LISTS.map(l=>[l.id,l]));
const listQuery = {};

function contagens(rows){
  const c={}; LISTS.forEach(l=>c[l.id]={});
  rows.forEach(r=>{
    const w=r.w;
    LISTS.forEach(l=>{ if(l.cnt){ const k=l.cnt(r); if(k!=null) c[l.id][k]=(c[l.id][k]||0)+w; } });
    DECISORES.forEach(d=>{ if(r.dec[d[0]]>0) c.listDecisor[d[0]]=(c.listDecisor[d[0]]||0)+w; });
    DIGITAL.forEach(d=>{ if(r[d[0]]) c.listDigital[d[0]]=(c.listDigital[d[0]]||0)+w; });
  });
  return c;
}
function marcar(txt,q){
  if(!q) return esc(txt);
  const i=norm(txt).indexOf(norm(q));
  if(i<0) return esc(txt);
  return esc(txt.slice(0,i))+'<mark>'+esc(txt.slice(i,i+q.length))+'</mark>'+esc(txt.slice(i+q.length));
}
function renderListas(cnt){
  LISTS.forEach(cfg=>{
    const box=el(cfg.id); if(!box) return;
    const q=listQuery[cfg.id]||'';
    const itens=cfg.items().filter(it=>!q || norm(it.l).includes(norm(q)));
    if(!itens.length){ box.innerHTML='<div class="empty-opt">Nenhum resultado para "'+esc(q)+'"</div>'; return; }
    box.innerHTML=itens.map(it=>{
      const on=cfg.set.has(it.v);
      const n=cnt[cfg.id][it.v]||0;
      return `<label class="opt${on?' selected':''}" data-list="${cfg.id}" data-value="${esc(it.v)}">
        <input type="checkbox" ${on?'checked':''}>
        <span class="opt-txt" title="${esc(it.l)}">${marcar(it.l,q)}</span>
        <span class="opt-cnt">${n?fmtCompact(n):''}</span></label>`;
    }).join('');
  });
}

/* ------------------------------- mapa ----------------------------------- */
function corEscala(t){ // t 0..1  → azul claro → azul escuro
  const a=[234,242,251], b=[8,48,107];
  return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`;
}
function renderMapa(A){
  const svg=el('mapaBrasil'); if(!svg||!window.GEO) return;
  const max=Math.max(1,...ESTADOS.map(e=>A.porUF[e.uf]||0));
  const fatUF={}; A.rows.forEach(r=>fatUF[r.state]=(fatUF[r.state]||0)+r.revenue*r.w);

  const AREA_MIN=250;                       // abaixo disso o rótulo vai para fora do mapa
  const fora=GEO.uf.filter(u=>u.a<AREA_MIN).sort((a,b)=>a.cy-b.cy);
  let ultimoY=-99;
  const rotulosFora=fora.map(u=>{
    const y=Math.max(ultimoY+11,u.cy); ultimoY=y;
    const x=Math.max(u.bb[1][0]+8, 318);
    return `<g class="lbl-out" data-uf="${u.uf}">
      <line x1="${u.bb[1][0]-1}" y1="${u.cy}" x2="${x-3}" y2="${y}"></line>
      <text x="${x}" y="${y+3}">${u.uf}</text></g>`;
  }).join('');

  svg.innerHTML =
    `<g class="paises">${GEO.sa.map(p=>`<path d="${p.d}"><title>${esc(p.n)}</title></path>`).join('')}</g>`+
    `<g class="estados">${GEO.uf.map(u=>{
      const v=A.porUF[u.uf]||0, on=F.estados.has(u.uf);
      return `<path class="uf${on?' on':''}" data-uf="${u.uf}" d="${u.d}" fill="${corEscala(v/max)}"></path>`;
    }).join('')}</g>`+
    `<path class="contorno" d="${GEO.br}"></path>`+
    `<g class="rotulos">${GEO.uf.filter(u=>u.a>=AREA_MIN).map(u=>{
      const t=(A.porUF[u.uf]||0)/max;
      return `<text x="${u.cx}" y="${u.cy+3}" fill="${t>.55?'#fff':'#33414f'}">${u.uf}</text>`;
    }).join('')}${rotulosFora}</g>`;

  const ticks=el('legendTicks');
  ticks.innerHTML=[0,.25,.5,.75,1].map(f=>`<span>${f===0?'0':fmtCompact(max*f)}</span>`).join('');

  const tip=el('mapTip'), holder=svg.parentElement;
  const mostrar=(uf,ev)=>{
    const e=UF_MAP[uf], b=holder.getBoundingClientRect();
    tip.hidden=false;
    tip.innerHTML=`<b>${e.nome}</b><span>${fmtInt(A.porUF[uf]||0)} empresas</span>`+
      `<span>${fmtMoney(fatUF[uf]||0)}</span><span>Região ${e.regiao}</span>`;
    let x=ev.clientX-b.left+14, y=ev.clientY-b.top+14;
    if(x+tip.offsetWidth>b.width) x=Math.max(0,ev.clientX-b.left-tip.offsetWidth-14);
    if(y+tip.offsetHeight>b.height) y=Math.max(0,y-tip.offsetHeight-28);
    tip.style.left=x+'px'; tip.style.top=y+'px';
  };
  svg.querySelectorAll('[data-uf]').forEach(g=>{
    const uf=g.dataset.uf;
    g.addEventListener('mousemove',ev=>mostrar(uf,ev));
    g.addEventListener('mouseleave',()=>{tip.hidden=true;});
    g.addEventListener('click',()=>{
      F.estados.has(uf)?F.estados.delete(uf):F.estados.add(uf);
      tip.hidden=true; UI.cidPage=1; UI.empPage=1; render();
      toast(UF_MAP[uf].nome+(F.estados.has(uf)?' adicionado ao filtro':' removido do filtro'));
    });
  });
}

/* ---------------------------- tabela cidades ---------------------------- */
function cidadesFiltradas(A){
  let l=Object.values(A.porCidade).filter(c=>c.empresas>0);
  if(UI.cidQuery) l=l.filter(c=>norm(c.cidade).includes(norm(UI.cidQuery))||norm(c.uf).includes(norm(UI.cidQuery)));
  const {key,dir}=UI.cidSort;
  l.sort((a,b)=>{
    const x=a[key],y=b[key];
    return (typeof x==='string'? x.localeCompare(y,'pt-BR') : x-y)*dir;
  });
  return l;
}
function renderCidades(A){
  const lista=cidadesFiltradas(A), porPag=10;
  const paginas=Math.max(1,Math.ceil(lista.length/porPag));
  if(UI.cidPage>paginas) UI.cidPage=paginas;
  const parte=lista.slice((UI.cidPage-1)*porPag,UI.cidPage*porPag);
  const tb=el('tblCidades').querySelector('tbody');
  tb.innerHTML=parte.length? parte.map(c=>`<tr>
      <td class="strong">${esc(c.cidade)}</td><td class="num">${c.uf}</td>
      <td class="num">${fmtInt(c.empresas)}</td><td class="num">${fmtMoney(c.faturamento)}</td></tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:#7b8697;padding:18px">Nenhuma cidade encontrada</td></tr>';
  el('tblCidades').querySelectorAll('th.sortable').forEach(th=>{
    th.classList.toggle('sorted',th.dataset.sort===UI.cidSort.key);
    const i=th.querySelector('i');
    i.className='fa-solid '+(th.dataset.sort===UI.cidSort.key?(UI.cidSort.dir>0?'fa-sort-up':'fa-sort-down'):'fa-sort');
  });
  pager('pagerCidades',UI.cidPage,paginas,lista.length,'cidades',p=>{UI.cidPage=p;render();});
}
function pager(id,page,paginas,total,rotulo,cb){
  const box=el(id); if(!box) return;
  let html=`<span>${fmtInt(total)} ${rotulo}</span>`;
  html+=`<button ${page<=1?'disabled':''} data-p="${page-1}"><i class="fa-solid fa-chevron-left"></i></button>`;
  const ini=Math.max(1,Math.min(page-2,paginas-4)), fim=Math.min(paginas,ini+4);
  for(let p=ini;p<=fim;p++) html+=`<button class="${p===page?'on':''}" data-p="${p}">${p}</button>`;
  html+=`<button ${page>=paginas?'disabled':''} data-p="${page+1}"><i class="fa-solid fa-chevron-right"></i></button>`;
  box.innerHTML=html;
  box.querySelectorAll('button[data-p]').forEach(b=>b.onclick=()=>{
    const p=+b.dataset.p; if(p>=1&&p<=paginas) cb(p);
  });
}

/* ------------------------------ gráficos -------------------------------- */
function chart(id,cfg){
  const c=el(id); if(!c) return;
  if(!window.Chart){                       // CDN indisponível: aviso no lugar do gráfico
    const box=c.parentElement;
    if(box && !box.querySelector('.chart-off')){
      const d=document.createElement('p');
      d.className='chart-off';
      d.textContent='Gráfico indisponível: a biblioteca Chart.js (CDN) não pôde ser carregada.';
      box.appendChild(d);
    }
    return;
  }
  if(charts[id]) charts[id].destroy();
  charts[id]=new Chart(c.getContext('2d'),cfg);
}
const baseOpts = {responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{callbacks:{}}},
  scales:{x:{grid:{display:false},ticks:{color:'#7b8697'}},
          y:{grid:{color:'#eef1f5'},ticks:{color:'#7b8697',callback:v=>fmtCompact(v)}}}};

function renderSetorChart(A){
  const dados=SETOR_NOMES.map(s=>({s,v:A.porSetor[s]||0})).sort((a,b)=>b.v-a.v);
  chart('chartSetor',{type:'bar',data:{labels:dados.map(d=>d.s),
    datasets:[{data:dados.map(d=>d.v),backgroundColor:dados.map((d,i)=>PALETA[i%PALETA.length]),borderRadius:3}]},
    options:{...baseOpts,indexAxis:'y',
      scales:{x:{grid:{color:'#eef1f5'},ticks:{color:'#7b8697',callback:v=>fmtCompact(v)}},
              y:{grid:{display:false},ticks:{color:'#4a5666'}}},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtInt(c.raw)+' empresas'}}}}});
}

/* ------------------------------- painéis -------------------------------- */
function renderPorte(A){
  el('kpiPorte').innerHTML=PORTE_NOMES.map((p,i)=>{
    const v=A.porPorte[p]||0;
    return `<div class="kpi accent-blue"><div class="k-label"><i class="fa-solid fa-building"></i> ${p}</div>
      <div class="k-value">${fmtInt(v)}</div>
      <div class="k-sub">${nf1.format(pct(v,A.n))}% da seleção</div>
      <div class="bar"><i style="width:${Math.min(100,pct(v,A.n))}%;background:${PALETA[i]}"></i></div></div>`;
  }).join('');
  chart('chartPorte',{type:'bar',data:{labels:PORTE_NOMES,
    datasets:[{data:PORTE_NOMES.map(p=>A.porPorte[p]||0),backgroundColor:PALETA.slice(0,5),borderRadius:3}]},
    options:{...baseOpts,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtInt(c.raw)+' empresas'}}}}});
  const fat={}; A.rows.forEach(r=>fat[r.size]=(fat[r.size]||0)+r.revenue*r.w);
  chart('chartPorteFat',{type:'doughnut',data:{labels:PORTE_NOMES,
    datasets:[{data:PORTE_NOMES.map(p=>fat[p]||0),backgroundColor:PALETA.slice(0,5),borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'right',labels:{color:'#4a5666',boxWidth:12}},
        tooltip:{callbacks:{label:c=>c.label+': '+fmtMoney(c.raw)}}}}});
}

function renderDecisores(A){
  const box=[['Total de Decisores',A.totalDecisores,'fa-users','accent-blue'],
    ['CEOs',A.dec.ceos,'fa-user-tie','accent-green'],
    ['Diretores',A.dec.diretores,'fa-user-gear','accent-blue'],
    ['Gerentes',A.dec.gerentes,'fa-user-group','accent-green'],
    ['Sócios e Proprietários',A.dec.socios+A.dec.proprietarios,'fa-handshake','accent-blue']];
  el('kpiDecisores').innerHTML=box.map(b=>`<div class="kpi ${b[3]}">
    <div class="k-label"><i class="fa-solid ${b[2]}"></i> ${b[0]}</div>
    <div class="k-value">${fmtInt(b[1])}</div>
    <div class="k-sub">contatos estimados</div></div>`).join('');
  const dados=DECISORES.map(d=>({l:d[1],v:A.dec[d[0]]})).sort((a,b)=>b.v-a.v);
  chart('chartDecisores',{type:'bar',data:{labels:dados.map(d=>d.l),
    datasets:[{data:dados.map(d=>d.v),backgroundColor:dados.map((d,i)=>PALETA[i%PALETA.length]),borderRadius:3}]},
    options:{...baseOpts,indexAxis:'y',
      scales:{x:{grid:{color:'#eef1f5'},ticks:{color:'#7b8697',callback:v=>fmtCompact(v)}},
              y:{grid:{display:false},ticks:{color:'#4a5666'}}},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtInt(c.raw)+' contatos'}}}}});
  el('tblDecisores').querySelector('tbody').innerHTML=DECISORES.map(d=>{
    const cob=pct(A.decEmp[d[0]],A.n);
    return `<tr><td class="strong">${d[1]}</td><td class="num">${fmtInt(A.dec[d[0]])}</td>
      <td class="num">${fmtInt(A.decEmp[d[0]])}</td>
      <td class="num"><span class="pill ${cob>50?'ok':cob>20?'warn':'neutral'}">${nf1.format(cob)}%</span></td></tr>`;
  }).join('');
}

function renderCadastrais(A){
  el('kpiCadastrais').innerHTML=`
    <div class="kpi accent-green"><div class="k-label"><i class="fa-solid fa-circle-check"></i> CNPJ ativo</div>
      <div class="k-value">${fmtInt(A.ativa)}</div><div class="k-sub">${nf1.format(pct(A.ativa,A.n))}% da seleção</div></div>
    <div class="kpi accent-blue"><div class="k-label"><i class="fa-solid fa-percent"></i> Simples Nacional</div>
      <div class="k-value">${fmtInt(A.simples)}</div><div class="k-sub">${nf1.format(pct(A.simples,A.n))}% da seleção</div></div>
    <div class="kpi accent-blue"><div class="k-label"><i class="fa-solid fa-id-card"></i> MEI</div>
      <div class="k-value">${fmtInt(A.porPorte['MEI']||0)}</div><div class="k-sub">${nf1.format(pct(A.porPorte['MEI']||0,A.n))}% da seleção</div></div>
    <div class="kpi accent-blue"><div class="k-label"><i class="fa-solid fa-coins"></i> Capital social médio</div>
      <div class="k-value">${fmtMoney(A.n?A.capital/A.n:0)}</div><div class="k-sub">por empresa</div></div>`;
  const nat=Object.entries(A.porNatureza).sort((a,b)=>b[1]-a[1]);
  chart('chartNatureza',{type:'bar',data:{labels:nat.map(n=>n[0]),
    datasets:[{data:nat.map(n=>n[1]),backgroundColor:nat.map((n,i)=>PALETA[i%PALETA.length]),borderRadius:3}]},
    options:{...baseOpts,indexAxis:'y',
      scales:{x:{grid:{color:'#eef1f5'},ticks:{color:'#7b8697',callback:v=>fmtCompact(v)}},
              y:{grid:{display:false},ticks:{color:'#4a5666',font:{size:10}}}},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtInt(c.raw)+' empresas'}}}}});
  const dec=Object.keys(A.porDecada).map(Number).sort((a,b)=>a-b);
  chart('chartAbertura',{type:'line',data:{labels:dec.map(d=>d+'s'),
    datasets:[{data:dec.map(d=>A.porDecada[d]),borderColor:BLUE,backgroundColor:'rgba(21,101,192,.12)',
      fill:true,tension:.3,pointRadius:3,pointBackgroundColor:BLUE}]},
    options:{...baseOpts,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtInt(c.raw)+' empresas'}}}}});
}

function renderSaude(A){
  const risco=A.risco;
  el('kpiSaude').innerHTML=`
    <div class="kpi accent-blue"><div class="k-label"><i class="fa-solid fa-sack-dollar"></i> Faturamento estimado</div>
      <div class="k-value">${fmtMoney(A.fat)}</div><div class="k-sub">ticket médio ${fmtMoney(A.ticket)}</div></div>
    <div class="kpi ${A.growthMedio>=0?'accent-green':'accent-red'}"><div class="k-label"><i class="fa-solid fa-arrow-trend-up"></i> Crescimento médio</div>
      <div class="k-value">${A.growthMedio>=0?'+':''}${nf1.format(A.growthMedio)}%</div><div class="k-sub">últimos 12 meses</div></div>
    <div class="kpi ${A.scoreMedio>=70?'accent-green':A.scoreMedio>=45?'accent-amber':'accent-red'}">
      <div class="k-label"><i class="fa-solid fa-gauge-high"></i> Score financeiro</div>
      <div class="k-value">${nf1.format(A.scoreMedio)}</div>
      <div class="bar"><i style="width:${A.scoreMedio}%;background:${A.scoreMedio>=70?GREEN:A.scoreMedio>=45?AMBER:RED}"></i></div></div>
    <div class="kpi accent-red"><div class="k-label"><i class="fa-solid fa-triangle-exclamation"></i> Empresas em risco</div>
      <div class="k-value">${fmtInt(risco.Alto)}</div><div class="k-sub">${nf1.format(pct(risco.Alto,A.n))}% da seleção</div></div>
    <div class="kpi accent-amber"><div class="k-label"><i class="fa-solid fa-file-invoice-dollar"></i> Dívidas estimadas</div>
      <div class="k-value">${fmtMoney(A.debt)}</div><div class="k-sub">${nf1.format(pct(A.debt,A.fat))}% do faturamento</div></div>`;
  chart('chartScore',{type:'bar',data:{labels:['0–19','20–39','40–59','60–79','80–100'],
    datasets:[{data:A.scoreBuckets,backgroundColor:[RED,RED,AMBER,GREEN,GREEN],borderRadius:3}]},
    options:{...baseOpts,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtInt(c.raw)+' empresas'}}}}});
  const g=Object.entries(A.growthSetor).map(([s,o])=>({s,v:o.w?o.s/o.w:0})).sort((a,b)=>b.v-a.v);
  chart('chartCrescimento',{type:'bar',data:{labels:g.map(x=>x.s),
    datasets:[{data:g.map(x=>x.v),backgroundColor:g.map(x=>x.v>=5?GREEN:x.v>=0?AMBER:RED),borderRadius:3}]},
    options:{...baseOpts,scales:{x:{grid:{display:false},ticks:{color:'#7b8697',font:{size:10}}},
      y:{grid:{color:'#eef1f5'},ticks:{color:'#7b8697',callback:v=>v+'%'}}},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>nf1.format(c.raw)+'% de crescimento médio'}}}}});
}

function renderDigital(A){
  el('kpiDigital').innerHTML=DIGITAL.map((d,i)=>{
    const v=A.dig[d[0]], p=pct(v,A.n);
    return `<div class="kpi accent-blue"><div class="k-label"><i class="fa-brands ${d[2]}"></i>${d[2].startsWith('fa-globe')||d[2].startsWith('fa-cart')?'':''} Empresas com ${d[1]}</div>
      <div class="k-value">${nf1.format(p)}%</div>
      <div class="k-sub">${fmtInt(v)} empresas</div>
      <div class="bar"><i style="width:${p}%;background:${PALETA[i%PALETA.length]}"></i></div></div>`;
  }).join('');
  el('kpiDigital').querySelectorAll('.fa-globe,.fa-cart-shopping').forEach(i=>i.className=i.className.replace('fa-brands','fa-solid'));
  chart('chartDigital',{type:'bar',data:{labels:DIGITAL.map(d=>d[1]),
    datasets:[{data:DIGITAL.map(d=>pct(A.dig[d[0]],A.n)),backgroundColor:PALETA.slice(0,6),borderRadius:3}]},
    options:{...baseOpts,scales:{x:{grid:{display:false},ticks:{color:'#4a5666'}},
      y:{grid:{color:'#eef1f5'},max:100,ticks:{color:'#7b8697',callback:v=>v+'%'}}},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>nf1.format(c.raw)+'% das empresas selecionadas'}}}}});
}

/* --------------------------- tabela empresas ---------------------------- */
function empresasFiltradas(A){
  let l=A.rows.slice();
  if(UI.empQuery){
    const q=norm(UI.empQuery);
    l=l.filter(r=>norm(r.name).includes(q)||norm(r.city).includes(q)||norm(r.sector).includes(q)||norm(r.state)===q);
  }
  const {key,dir}=UI.empSort;
  l.sort((a,b)=>{
    const x=a[key],y=b[key];
    return (typeof x==='string'? x.localeCompare(y,'pt-BR') : x-y)*dir;
  });
  return l;
}
function renderEmpresas(A){
  const lista=empresasFiltradas(A), porPag=15;
  const paginas=Math.max(1,Math.ceil(lista.length/porPag));
  if(UI.empPage>paginas) UI.empPage=paginas;
  const parte=lista.slice((UI.empPage-1)*porPag,UI.empPage*porPag);
  el('badgeEmpresas').textContent=fmtInt(A.n)+' empresas na base';
  el('tblEmpresas').querySelector('tbody').innerHTML = parte.length? parte.map(r=>`<tr>
    <td class="strong">${esc(r.name)}</td><td>${esc(r.city)}</td><td class="num">${r.state}</td>
    <td>${r.sector}</td><td>${r.size}</td><td class="num">${fmtMoney(r.revenue)}</td>
    <td class="num">${fmtInt(r.employees)}</td>
    <td class="num"><span class="pill ${r.financialScore>=70?'ok':r.financialScore>=45?'warn':'bad'}">${r.financialScore}</span></td>
    <td><span class="dig">${DIGITAL.map(d=>`<i class="${d[2].startsWith('fa-globe')||d[2].startsWith('fa-cart')?'fa-solid':'fa-brands'} ${d[2]}${r[d[0]]?' on':''}" title="${d[1]}"></i>`).join('')}</span></td>
    </tr>`).join('') : '<tr><td colspan="9" style="text-align:center;color:#7b8697;padding:22px">Nenhuma empresa corresponde aos filtros</td></tr>';
  el('tblEmpresas').querySelectorAll('th.sortable').forEach(th=>{
    th.classList.toggle('sorted',th.dataset.sort===UI.empSort.key);
    const i=th.querySelector('i');
    i.className='fa-solid '+(th.dataset.sort===UI.empSort.key?(UI.empSort.dir>0?'fa-sort-up':'fa-sort-down'):'fa-sort');
  });
  pager('pagerEmpresas',UI.empPage,paginas,lista.length,'registros na amostra',p=>{UI.empPage=p;render();});
}

/* ------------------------------- render --------------------------------- */
let ULTIMO=null;
function render(){
  const rows=filtrar();
  const A=agregar(rows); ULTIMO=A;
  renderListas(contagens(rows));

  el('statEmpresas').textContent=fmtInt(A.n);
  el('statFaturamento').textContent=fmtMoney(A.fat);
  const p=pct(A.n,TOTAL_EMPRESAS);
  el('statEmpresasSub').textContent = temFiltro()? `${nf1.format(p)}% da base nacional`:'Base nacional completa';
  el('statFaturamentoSub').textContent = A.n? 'Ticket médio '+fmtMoney(A.ticket):'';

  // marcadores de filtro ativo
  const ativos={
    regiao:F.regioes.size+F.estados.size, setores:F.setores.size+F.secoes.size,
    cnaePri:F.cnaePri.size, cnaeSec:F.cnaeSec.size, ncm:F.ncm.size, palavras:F.palavras.length,
    porte:F.portes.size+(F.funcMin>0||F.funcMax<2000?1:0), decisores:F.decisores.size,
    digital:F.digital.size,
    saude:F.riscos.size+(F.scoreMin>0||F.scoreMax<100?1:0)+(F.revMin>0||F.revMax<100?1:0),
    cadastrais:(F.situacao?1:0)+(F.natureza?1:0)+(F.regime?1:0)+(F.simples?1:0)+(F.mei?1:0)
      +(F.anoMin>1960||F.anoMax<2026?1:0)+(F.capMin>0||F.capMax<100?1:0)
  };
  ativos.setor=ativos.setores+ativos.cnaePri+ativos.cnaeSec+ativos.ncm+ativos.palavras;
  document.querySelectorAll('.fgroup').forEach(g=>{
    const d=g.querySelector(':scope > .fgroup-head .dot');
    if(d) d.hidden=!ativos[g.dataset.group];
  });

  if(UI.view==='empresas'){ renderEmpresas(A); return; }
  if(UI.tab==='regiao'){ renderMapa(A); renderCidades(A); renderSetorChart(A); }
  else if(UI.tab==='porte') renderPorte(A);
  else if(UI.tab==='decisores') renderDecisores(A);
  else if(UI.tab==='cadastrais') renderCadastrais(A);
  else if(UI.tab==='saude') renderSaude(A);
  else if(UI.tab==='digital') renderDigital(A);
}

/* ------------------------------ exportação ------------------------------ */
function dadosExport(tipo){
  const A=ULTIMO;
  switch(tipo){
    case 'estados': return {nome:'empresas-por-estado',head:['UF','Estado','Região','Empresas','Faturamento'],
      rows:ESTADOS.map(e=>[e.uf,e.nome,e.regiao,Math.round(A.porUF[e.uf]||0),
        Math.round(A.rows.filter(r=>r.state===e.uf).reduce((s,r)=>s+r.revenue*r.w,0))])};
    case 'cidades': return {nome:'top-cidades',head:['Cidade','UF','Empresas','Faturamento'],
      rows:cidadesFiltradas(A).map(c=>[c.cidade,c.uf,Math.round(c.empresas),Math.round(c.faturamento)])};
    case 'setores': return {nome:'empresas-por-setor',head:['Setor','Empresas','% da seleção'],
      rows:SETOR_NOMES.map(s=>[s,Math.round(A.porSetor[s]||0),nf1.format(pct(A.porSetor[s]||0,A.n))])};
    case 'porte': return {nome:'empresas-por-porte',head:['Porte','Empresas','% da seleção'],
      rows:PORTE_NOMES.map(p=>[p,Math.round(A.porPorte[p]||0),nf1.format(pct(A.porPorte[p]||0,A.n))])};
    case 'decisores': return {nome:'decisores',head:['Função','Contatos','Empresas com a função','Cobertura %'],
      rows:DECISORES.map(d=>[d[1],Math.round(A.dec[d[0]]),Math.round(A.decEmp[d[0]]),nf1.format(pct(A.decEmp[d[0]],A.n))])};
    case 'natureza': return {nome:'natureza-juridica',head:['Natureza jurídica','Empresas'],
      rows:Object.entries(A.porNatureza).sort((a,b)=>b[1]-a[1]).map(n=>[n[0],Math.round(n[1])])};
    case 'score': return {nome:'score-financeiro',head:['Faixa de score','Empresas'],
      rows:['0–19','20–39','40–59','60–79','80–100'].map((l,i)=>[l,Math.round(A.scoreBuckets[i])])};
    case 'digital': return {nome:'presenca-digital',head:['Canal','Empresas','%'],
      rows:DIGITAL.map(d=>[d[1],Math.round(A.dig[d[0]]),nf1.format(pct(A.dig[d[0]],A.n))])};
    default: return {nome:'empresas',head:['Empresa','Cidade','UF','Setor','Seção CNAE','CNAE','Porte',
      'Faturamento','Funcionários','Score','Risco','Situação','Natureza jurídica','Regime','Abertura',
      'Capital social','Website','Instagram','LinkedIn','E-commerce','Empresas representadas'],
      rows:empresasFiltradas(A).map(r=>[r.name,r.city,r.state,r.sector,r.secao,r.cnae,r.size,
        Math.round(r.revenue),r.employees,r.financialScore,r.risco,r.situacao,r.natureza,r.regime,r.ano,
        r.capital,r.website?'Sim':'Não',r.instagram?'Sim':'Não',r.linkedin?'Sim':'Não',
        r.ecommerce?'Sim':'Não',Math.round(r.w)])};
  }
}
function baixarCSV(tipo){
  const d=dadosExport(tipo);
  const linhas=[d.head,...d.rows].map(l=>l.map(c=>{
    const s=String(c); return /[";\n]/.test(s)? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(';'));
  const blob=new Blob(['﻿'+linhas.join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='prospectar-'+d.nome+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast(d.rows.length+' linhas exportadas para CSV');
}
function copiarDados(tipo){
  const d=dadosExport(tipo);
  const txt=[d.head,...d.rows].map(l=>l.join('\t')).join('\n');
  copiar(txt,'Dados copiados para a área de transferência');
}
function copiar(txt,msg){
  if(navigator.clipboard&&window.isSecureContext){
    navigator.clipboard.writeText(txt).then(()=>toast(msg)).catch(()=>fallback());
  } else fallback();
  function fallback(){
    const ta=document.createElement('textarea');
    ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{document.execCommand('copy'); toast(msg);}catch(e){toast('Não foi possível copiar');}
    ta.remove();
  }
}

/* -------------------------------- modais -------------------------------- */
function abrirModal(titulo,html){
  el('modalTitle').textContent=titulo;
  el('modalBody').innerHTML=html;
  el('modal').hidden=false;
}
const fecharModal=()=>{el('modal').hidden=true;};

function modalMercado(){
  const A=ULTIMO;
  const top=(obj,n)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n);
  const ufs=top(A.porUF,5).map(([uf,v])=>`<li>${UF_MAP[uf].nome}: <b>${fmtInt(v)}</b> empresas</li>`).join('');
  const set=top(A.porSetor,5).map(([s,v])=>`<li>${s}: <b>${fmtInt(v)}</b> empresas (${nf1.format(pct(v,A.n))}%)</li>`).join('');
  const cid=cidadesFiltradas(A).slice(0,5).map(c=>`<li>${c.cidade}/${c.uf}: <b>${fmtInt(c.empresas)}</b></li>`).join('');
  abrirModal('Resumo de Mercado',`
    <div class="mkt-grid">
      <div class="mkt-box"><div class="m-l">Empresas</div><div class="m-v">${fmtInt(A.n)}</div></div>
      <div class="mkt-box"><div class="m-l">Faturamento anual</div><div class="m-v">${fmtMoney(A.fat)}</div></div>
      <div class="mkt-box"><div class="m-l">Ticket médio</div><div class="m-v">${fmtMoney(A.ticket)}</div></div>
      <div class="mkt-box"><div class="m-l">Score médio</div><div class="m-v">${nf1.format(A.scoreMedio)}</div></div>
      <div class="mkt-box"><div class="m-l">Decisores mapeados</div><div class="m-v">${fmtInt(A.totalDecisores)}</div></div>
      <div class="mkt-box"><div class="m-l">Com website</div><div class="m-v">${nf1.format(pct(A.dig.website,A.n))}%</div></div>
    </div>
    <h4>Top estados</h4><ul>${ufs||'<li>—</li>'}</ul>
    <h4>Top setores</h4><ul>${set||'<li>—</li>'}</ul>
    <h4>Top cidades</h4><ul>${cid||'<li>—</li>'}</ul>
    <h4>Filtros aplicados</h4><ul>${resumoFiltros()}</ul>`);
}
function resumoFiltros(){
  const p=[];
  if(F.regioes.size) p.push('Regiões: '+[...F.regioes].join(', '));
  if(F.estados.size) p.push('Estados: '+[...F.estados].join(', '));
  if(F.setores.size) p.push('Setores: '+[...F.setores].join(', '));
  if(F.secoes.size)  p.push('Seções CNAE: '+[...F.secoes].join(', '));
  if(F.cnaePri.size) p.push('CNAE primário: '+[...F.cnaePri].join(', '));
  if(F.cnaeSec.size) p.push('CNAE secundário: '+[...F.cnaeSec].join(', '));
  if(F.ncm.size)     p.push('NCM: '+[...F.ncm].join(', '));
  if(F.palavras.length) p.push('Palavras-chave: '+F.palavras.join(', '));
  if(F.portes.size)  p.push('Porte: '+[...F.portes].join(', '));
  if(F.decisores.size) p.push('Decisores: '+[...F.decisores].join(', '));
  if(F.digital.size) p.push('Presença digital: '+[...F.digital].join(', '));
  if(F.riscos.size)  p.push('Risco: '+[...F.riscos].join(', '));
  if(F.situacao) p.push('Situação: '+F.situacao);
  if(F.natureza) p.push('Natureza: '+F.natureza);
  if(F.regime)   p.push('Regime: '+F.regime);
  if(F.simples)  p.push('Optante pelo Simples Nacional');
  if(F.mei)      p.push('Somente MEI');
  if(F.funcMin>0||F.funcMax<2000) p.push('Funcionários: '+F.funcMin+' a '+(F.funcMax>=2000?'2000+':F.funcMax));
  if(F.anoMin>1960||F.anoMax<2026) p.push('Abertura: '+F.anoMin+' a '+F.anoMax);
  if(F.capMin>0||F.capMax<100) p.push('Capital social: '+fmtMoney(capVal(F.capMin))+' a '+(F.capMax>=100?'sem limite':fmtMoney(capVal(F.capMax))));
  if(F.scoreMin>0||F.scoreMax<100) p.push('Score: '+F.scoreMin+' a '+F.scoreMax);
  if(F.revMin>0||F.revMax<100) p.push('Faturamento: '+fmtMoney(revVal(F.revMin))+' a '+(F.revMax>=100?'sem limite':fmtMoney(revVal(F.revMax))));
  return p.length? p.map(x=>'<li>'+esc(x)+'</li>').join('') : '<li>Nenhum filtro aplicado — base nacional completa.</li>';
}
function textoResumo(){
  const A=ULTIMO;
  return ['PROSPECTAR — Resumo de Mercado',
    'Empresas: '+fmtInt(A.n),
    'Faturamento anual: '+fmtMoney(A.fat),
    'Ticket médio: '+fmtMoney(A.ticket),
    'Score financeiro médio: '+nf1.format(A.scoreMedio),
    'Decisores mapeados: '+fmtInt(A.totalDecisores),
    '',
    'Filtros: '+resumoFiltros().replace(/<\/li>/g,' | ').replace(/<[^>]+>/g,'').trim()
  ].join('\n');
}

const TEXTOS_FERRAMENTA={
  extensao:['Extensão Google Chrome','Nesta demonstração a extensão não é distribuída. Em uma implantação real, ela captura o CNPJ da página aberta e devolve o dossiê da empresa (porte, CNAE, decisores e presença digital) usando os mesmos filtros da Calculadora.'],
  videos:['Galeria de vídeos','Espaço reservado para tutoriais em vídeo da plataforma. Nenhum conteúdo externo é carregado nesta demonstração.'],
  blog:['Blog da Prospecção','Espaço reservado para artigos sobre prospecção B2B, ICP e qualificação de leads. Nenhum conteúdo externo é carregado nesta demonstração.'],
  conteudos:['Conteúdos Gratuitos','Espaço reservado para materiais ricos (planilhas, scripts de abordagem e checklists de qualificação).'],
  base:['Base de Conhecimento','Espaço reservado para a documentação da plataforma: como montar um ICP, combinar filtros e exportar listas.']
};
function ferramenta(t){
  switch(t){
    case 'leads': baixarCSV('empresas'); break;
    case 'lista': case 'empresa': case 'geracao':
      trocarView('empresas');
      if(t!=='geracao') setTimeout(()=>el('buscaEmpresa').focus(),80);
      toast(t==='geracao'?'Lista pronta para geração de leads':'Lista de empresas aberta');
      break;
    case 'cnae':
      abrirGrupo('cnaePri'); el('sidebar').classList.add('open'); el('backdrop').classList.add('show');
      setTimeout(()=>{const i=document.querySelector('[data-search="listCnaePri"]'); i.scrollIntoView({block:'center'}); i.focus();},80);
      break;
    case 'socio':
      trocarView('calculadora'); trocarTab('decisores'); abrirGrupo('decisores');
      toast('Consulta de sócios e decisores');
      break;
    case 'inteligencia': modalMercado(); break;
    default:{ const x=TEXTOS_FERRAMENTA[t]; if(x) abrirModal(x[0],'<p>'+x[1]+'</p>'); }
  }
}

/* ------------------------------ navegação ------------------------------- */
function trocarView(v){
  UI.view=v;
  document.querySelectorAll('.viewnav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  el('viewCalculadora').hidden = v!=='calculadora';
  el('viewEmpresas').hidden    = v!=='empresas';
  render();
}
function trocarTab(t){
  UI.tab=t;
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+t));
  if(UI.view!=='calculadora') trocarView('calculadora'); else render();
}
function abrirGrupo(nome){
  const g=document.querySelector(`.fgroup[data-group="${nome}"]`);
  if(!g) return;
  g.classList.add('open');
  let p=g.parentElement.closest('.fgroup');
  while(p){ p.classList.add('open'); p=p.parentElement.closest('.fgroup'); }
}

/* ------------------------------- filtros -------------------------------- */
function limparFiltros(){
  ['regioes','estados','setores','secoes','cnaePri','cnaeSec','ncm','portes','decisores','digital','riscos']
    .forEach(k=>F[k].clear());
  F.palavras=[]; F.situacao=F.natureza=F.regime=''; F.simples=F.mei=false;
  F.funcMin=0; F.funcMax=2000; F.anoMin=1960; F.anoMax=2026;
  F.capMin=0; F.capMax=100; F.scoreMin=0; F.scoreMax=100; F.revMin=0; F.revMax=100;
  ['funcMin','funcMax','anoMin','anoMax','capMin','capMax','scoreMin','scoreMax','revMin','revMax']
    .forEach(id=>{el(id).value=F[id];});
  el('selSituacao').value=''; el('selNatureza').value=''; el('selRegime').value='';
  el('chkSimples').checked=false; el('chkMei').checked=false;
  document.querySelectorAll('.search-input').forEach(i=>{ if(i.id!=='buscaCidade'&&i.id!=='buscaEmpresa') i.value=''; });
  Object.keys(listQuery).forEach(k=>listQuery[k]='');
  UI.cidPage=1; UI.empPage=1; UI.cidQuery=''; UI.empQuery='';
  el('buscaCidade').value=''; el('buscaEmpresa').value='';
  renderTags(); atualizarLabels(); render();
}
function renderTags(){
  el('tagsPalavras').innerHTML=F.palavras.map((p,i)=>
    `<span class="tag">${esc(p)}<button data-tag="${i}" aria-label="Remover">&times;</button></span>`).join('');
}
function atualizarLabels(){
  el('lblFunc').textContent = F.funcMin+' a '+(F.funcMax>=2000?'2.000+':fmtInt(F.funcMax));
  el('lblAno').textContent  = F.anoMin+' a '+F.anoMax;
  el('lblCap').textContent  = fmtMoney(capVal(F.capMin))+' a '+(F.capMax>=100?'sem limite':fmtMoney(capVal(F.capMax)));
  el('lblScore').textContent= F.scoreMin+' a '+F.scoreMax;
  el('lblRev').textContent  = fmtMoney(revVal(F.revMin))+' a '+(F.revMax>=100?'sem limite':fmtMoney(revVal(F.revMax)));
}
function parRange(idMin,idMax,chaveMin,chaveMax){
  const a=el(idMin), b=el(idMax);
  const upd=()=>{
    let x=+a.value,y=+b.value;
    if(x>y){ if(document.activeElement===a) y=x; else x=y; a.value=x; b.value=y; }
    F[chaveMin]=x; F[chaveMax]=y;
    atualizarLabels(); UI.cidPage=1; UI.empPage=1; render();
  };
  a.addEventListener('input',upd); b.addEventListener('input',upd);
}

/* ------------------------------- atalhos -------------------------------- */
function atalho(tipo,valor){
  switch(tipo){
    case 'setor': F.setores.clear(); F.setores.add(valor); abrirGrupo('setores'); break;
    case 'estado': F.estados.clear(); F.estados.add(valor); abrirGrupo('regiao'); break;
    case 'secao': F.secoes.clear(); F.secoes.add(valor); break;
    case 'porte': F.portes.clear(); F.portes.add(valor); abrirGrupo('porte'); break;
    case 'faturamento':{
      const v=+valor;
      F.revMin=Math.round(Math.log10(v+1)/9*100); F.revMax=100;
      el('revMin').value=F.revMin; el('revMax').value=100; abrirGrupo('saude'); break;
    }
    case 'funcionarios': F.funcMin=+valor; el('funcMin').value=F.funcMin; abrirGrupo('porte'); break;
    case 'digital': F.digital.clear(); F.digital.add(valor); abrirGrupo('digital'); break;
    case 'simples': F.simples=true; el('chkSimples').checked=true; abrirGrupo('cadastrais'); break;
    case 'mei': F.mei=true; el('chkMei').checked=true; abrirGrupo('cadastrais'); break;
    case 'cidade':
      trocarView('calculadora'); trocarTab('regiao');
      setTimeout(()=>{el('buscaCidade').scrollIntoView({behavior:'smooth',block:'center'}); el('buscaCidade').focus();},120);
      return;
  }
  UI.cidPage=1; UI.empPage=1;
  atualizarLabels();
  trocarView(UI.view);
  window.scrollTo({top:0,behavior:'smooth'});
  toast('Filtro aplicado: '+(tipo==='faturamento'?'faturamento acima de '+fmtMoney(+valor)
        :tipo==='funcionarios'?'mais de '+valor+' funcionários'
        :tipo==='simples'?'Simples Nacional':tipo==='mei'?'MEI':valor));
}

/* --------------------------------- init --------------------------------- */
function init(){
  if(window.Chart){
    Chart.defaults.font.family='"Segoe UI",Roboto,-apple-system,Arial,sans-serif';
    Chart.defaults.font.size=11.5;
    Chart.defaults.color='#4a5666';
  }
  // selects cadastrais
  const opts=(arr,todos)=>['<option value="">'+todos+'</option>'].concat(arr.map(o=>`<option>${o}</option>`)).join('');
  el('selSituacao').innerHTML=opts(SITUACOES,'Todas');
  el('selNatureza').innerHTML=opts(NATUREZAS,'Todas');
  el('selRegime').innerHTML=opts(REGIMES,'Todos');
  el('selSituacao').onchange=e=>{F.situacao=e.target.value; UI.empPage=1; render();};
  el('selNatureza').onchange=e=>{F.natureza=e.target.value; UI.empPage=1; render();};
  el('selRegime').onchange  =e=>{F.regime  =e.target.value; UI.empPage=1; render();};
  el('chkSimples').onchange =e=>{F.simples =e.target.checked; render();};
  el('chkMei').onchange     =e=>{F.mei     =e.target.checked; render();};

  parRange('funcMin','funcMax','funcMin','funcMax');
  parRange('anoMin','anoMax','anoMin','anoMax');
  parRange('capMin','capMax','capMin','capMax');
  parRange('scoreMin','scoreMax','scoreMin','scoreMax');
  parRange('revMin','revMax','revMin','revMax');

  // colapsar seções
  document.querySelectorAll('.fgroup-head').forEach(h=>{
    h.addEventListener('click',()=>h.parentElement.classList.toggle('open'));
  });
  // buscas dentro das listas
  document.querySelectorAll('[data-search]').forEach(inp=>{
    inp.addEventListener('input',()=>{ listQuery[inp.dataset.search]=inp.value.trim(); render(); });
    inp.addEventListener('click',e=>e.stopPropagation());
  });
  // seleção múltipla
  el('sidebar').addEventListener('click',e=>{
    const opt=e.target.closest('.opt'); if(!opt) return;
    e.preventDefault();
    const cfg=LIST_BY_ID[opt.dataset.list], v=opt.dataset.value;
    cfg.set.has(v)? cfg.set.delete(v) : cfg.set.add(v);
    UI.cidPage=1; UI.empPage=1; render();
  });
  // palavras-chave
  el('inputPalavra').addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      const v=e.target.value.trim();
      if(v && !F.palavras.includes(v)){ F.palavras.push(v); e.target.value=''; renderTags(); UI.empPage=1; render(); }
    }
  });
  el('tagsPalavras').addEventListener('click',e=>{
    const b=e.target.closest('[data-tag]'); if(!b) return;
    F.palavras.splice(+b.dataset.tag,1); renderTags(); render();
  });

  el('btnLimpar').onclick=e=>{e.stopPropagation(); limparFiltros(); toast('Filtros limpos');};
  el('btnEncontrar').onclick=()=>{
    render();
    window.scrollTo({top:0,behavior:'smooth'});
    el('sidebar').classList.remove('open'); el('backdrop').classList.remove('show');
    toast(fmtInt(ULTIMO.n)+' empresas encontradas · '+fmtMoney(ULTIMO.fat)+' em faturamento');
  };
  el('btnExportarBase').onclick=()=>baixarCSV('empresas');

  // topo
  el('btnImprimir').onclick=()=>window.print();
  el('btnMercado').onclick=modalMercado;
  el('btnMenu').onclick=()=>{
    el('sidebar').classList.toggle('open');
    el('backdrop').classList.toggle('show',el('sidebar').classList.contains('open'));
  };
  el('backdrop').onclick=()=>{el('sidebar').classList.remove('open'); el('backdrop').classList.remove('show');};
  el('btnCollapse').onclick=()=>el('sidebar').classList.toggle('collapsed');
  document.querySelectorAll('.viewnav-btn').forEach(b=>b.onclick=()=>trocarView(b.dataset.view));
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>trocarTab(b.dataset.tab));

  // ordenação das tabelas
  el('tblCidades').querySelectorAll('th.sortable').forEach(th=>th.onclick=()=>{
    const k=th.dataset.sort;
    UI.cidSort = UI.cidSort.key===k? {key:k,dir:-UI.cidSort.dir} : {key:k,dir:k==='cidade'||k==='uf'?1:-1};
    UI.cidPage=1; render();
  });
  el('tblEmpresas').querySelectorAll('th.sortable').forEach(th=>th.onclick=()=>{
    const k=th.dataset.sort;
    UI.empSort = UI.empSort.key===k? {key:k,dir:-UI.empSort.dir} : {key:k,dir:typeof ROWS[0][k]==='string'?1:-1};
    UI.empPage=1; render();
  });
  el('buscaCidade').addEventListener('input',e=>{UI.cidQuery=e.target.value; UI.cidPage=1; render();});
  el('buscaEmpresa').addEventListener('input',e=>{UI.empQuery=e.target.value; UI.empPage=1; render();});

  // exportar / menus
  document.addEventListener('click',e=>{
    const exp=e.target.closest('[data-export]');
    if(exp){ baixarCSV(exp.dataset.export); fecharMenus(); return; }
    const cop=e.target.closest('[data-copy]');
    if(cop){ copiarDados(cop.dataset.copy); fecharMenus(); return; }
    const mb=e.target.closest('[data-menu]');
    if(mb){
      const m=document.querySelector(`.menu[data-menu-for="${mb.dataset.menu}"]`);
      const aberto=m.classList.contains('open');
      fecharMenus(); m.classList.toggle('open',!aberto); return;
    }
    if(!e.target.closest('.menu')) fecharMenus();
    const q=e.target.closest('[data-quick]');
    if(q){ atalho(q.dataset.quick,q.dataset.value); return; }
    const t=e.target.closest('[data-tool]');
    if(t){ ferramenta(t.dataset.tool); return; }
  });
  const fecharMenus=()=>document.querySelectorAll('.menu.open').forEach(m=>m.classList.remove('open'));

  el('btnFecharModal').onclick=fecharModal;
  el('btnFecharModal2').onclick=fecharModal;
  el('modal').addEventListener('click',e=>{ if(e.target===el('modal')) fecharModal(); });
  el('btnCopiarResumo').onclick=()=>copiar(textoResumo(),'Resumo copiado');
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ fecharModal(); fecharMenus(); } });

  renderTags(); atualizarLabels(); render();
}
document.addEventListener('DOMContentLoaded',init);
