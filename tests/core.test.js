const test = require('node:test'), assert = require('node:assert');
const C = require('../js/core.js');

test('parseBRL / formatBRL', () => {
  assert.equal(C.parseBRL('3.743,04'), 374304);
  assert.equal(C.parseBRL('R$ 3.743,04'), 374304);
  assert.equal(C.parseBRL('3743.04'), 374304);
  assert.equal(C.parseBRL('3.743'), 374300);
  assert.equal(C.parseBRL('414,4'), 41440);
  assert.equal(C.parseBRL(''), 0);
  assert.ok(Number.isNaN(C.parseBRL('abc')));
  assert.equal(C.formatBRL(1927638), '19.276,38');
  assert.equal(C.formatBRL(5), '0,05');
  assert.equal(C.formatBRL(100000000), '1.000.000,00');
});

test('totais reproduzem o orçamento 12545 de referência (R$ 19.276,38)', () => {
  const q = { descontoTipo: 'R$', descontoValor: 0, items: [
    { qtd: 1, unit: 37430400 }, { qtd: 1, unit: 4144000 }, { qtd: 4, unit: 37797350 }] };
  assert.equal(C.itemTotal(q.items[2]), 1511894); // 4 x 3.779,735 (exibido 3.779,74) = 15.118,94 como no original
  const t = C.calcTotals(q);
  assert.equal(t.subtotal, 1927638);
  assert.equal(t.total, 1927638);
});

test('preço unitário com até 4 casas', () => {
  assert.equal(C.parseUnit('3.779,735'), 37797350);
  assert.equal(C.parseUnit('3.743,04'), 37430400);
  assert.equal(C.formatUnit(37797350), '3.779,735');
  assert.equal(C.formatUnit(37430400), '3.743,04');
  assert.equal(C.formatUnit(1000000), '100,00');
  assert.equal(C.formatUnit(5), '0,0005');
  assert.ok(Number.isNaN(C.parseUnit('x')));
});

test('desconto percentual, em reais, frete e instalação', () => {
  const items = [{ qtd: 2, unit: 10000000 }]; // 2 x R$ 1.000,00
  assert.equal(C.calcTotals({ items, descontoTipo: '%', descontoValor: 5 }).desconto, 10000);
  assert.equal(C.calcTotals({ items, descontoTipo: '%', descontoValor: 7.5 }).total, 185000);
  assert.equal(C.calcTotals({ items, descontoTipo: 'R$', descontoValor: 12345, frete: 5000, instalacao: 30000 }).total, 200000 - 12345 + 35000);
  assert.ok(C.calcTotals({ items, descontoTipo: 'R$', descontoValor: 300000 }).errors.length > 0);
  assert.ok(C.calcTotals({ items, descontoTipo: '%', descontoValor: 120 }).errors.length > 0);
});

test('valor por extenso', () => {
  const e = C.extensoBRL;
  assert.equal(e(1927638), 'dezenove mil, duzentos e setenta e seis reais e trinta e oito centavos');
  assert.equal(e(100), 'um real');
  assert.equal(e(0), 'zero reais');
  assert.equal(e(1), 'um centavo');
  assert.equal(e(10000), 'cem reais');
  assert.equal(e(10100), 'cento e um reais');
  assert.equal(e(100000), 'mil reais');
  assert.equal(e(200000), 'dois mil reais');
  assert.equal(e(100100), 'mil e um reais');
  assert.equal(e(111000), 'mil, cento e dez reais');
  assert.equal(e(120000), 'mil e duzentos reais');
  assert.equal(e(374304), 'três mil, setecentos e quarenta e três reais e quatro centavos');
  assert.equal(e(100000000), 'um milhão de reais');
  assert.equal(e(250000000 + 100), 'dois milhões, quinhentos mil e um reais');
});

test('datas, máscaras e documentos', () => {
  assert.equal(C.fmtDate('2026-10-14'), '14/10/2026');
  assert.equal(C.addDaysISO('2026-10-14', 20), '2026-11-03');
  assert.equal(C.addDaysISO('2026-12-25', 10), '2027-01-04');
  assert.equal(C.maskPhone('16988163513'), '(16) 98816-3513');
  assert.equal(C.maskPhone('1632345678'), '(16) 3234-5678');
  assert.equal(C.maskCEP('14000001'), '14000-001');
  assert.equal(C.maskDoc('47693611000126'), '47.693.611/0001-26');
  assert.ok(C.validCNPJ('47.693.611/0001-26'));
  assert.ok(!C.validCNPJ('47.693.611/0001-27'));
  assert.ok(C.validCPF('529.982.247-25'));
  assert.ok(!C.validCPF('111.111.111-11'));
  assert.ok(C.validDoc(''));
});
