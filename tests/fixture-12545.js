/* Dados do orçamento de referência nº 12545 (PDF enviado pela JP). Usado SOMENTE em testes; nunca é carregado no sistema. */
module.exports = {
  settings: { empresa: { nome: 'JP ESQUADRIAS DE ALUMINIO E VIDROS', cnpj: '47.693.611/0001-26', ie: '797951711117',
    endereco: 'AV. EDUARDO ANDRÉA MATARAZZO, 703, CENT. PARK', cidade: 'RIBEIRAO PRETO | SP', cep: '14060-431',
    tel: '(16)99464-0640', whats: '(16)994640640', email: 'comercial.jpaluminios@gmail.com', instagram: '@jp.aluminios001' } },
  quote: { numero: '12545', emissao: '2026-10-14', validade: '', vendedor: 'FELIPE NASCIMENTO', contatoVendedor: '16991019797',
    cliente: { nome: 'PAULO FONSECA', cel: '(16)98816-3513', endereco: 'S/N', cep: '14000-001', cidade: 'RIBEIRAO PRETO/SP' },
    items: [
      { amb: 'SALA', descricao: 'PORTA DE CORRER 02 FOLHAS | ATRÁS PAREDE | SUPREMA', linha: 'L. SUPREMA', corPerfil: 'PRETO', corAcessorio: 'PRETO', vidro: 'INCOLOR 06MM COMUM', largura: 2010, altura: 2500, qtd: 1, unit: 37430400, tipo: 'porta_correr', obs: '' },
      { amb: 'BANHEIRO', descricao: 'MAXIM-AR COM 01 MÓDULO | SUPREMA', linha: 'L. SUPREMA', corPerfil: 'PRETO', corAcessorio: 'COR A DEFINIR', vidro: 'INCOLOR 06 MM - COMUM', largura: 600, altura: 800, qtd: 1, unit: 4144000, tipo: 'maxim_ar', obs: 'FALTA DEFINIR A COR' },
      { amb: '', descricao: 'JANELA DE CORRER INTEGRADA 02 FOLHAS | SUPREMA', linha: 'L. SUPREMA', corPerfil: 'PRETO', corAcessorio: 'PRETO', vidro: 'FUME 06MM COMUM', largura: 1600, altura: 1700, qtd: 4, unit: 37797350, tipo: 'janela_integrada', obs: 'COM MOTOR ENTELCO ACOMPANHA CONTROLE REMOTO' } ],
    descontoTipo: 'R$', descontoValor: 0, frete: 0, instalacao: 0, outros: 0,
    pagamento: 'A DEFINIR', prazoEntrega: '60 DIAS CORRIDOS APÓS A MEDIÇÃO DEFINITIVA.', obs: '' }
};
