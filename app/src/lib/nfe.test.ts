import { describe, expect, it } from 'vitest'
import { lerNfe, mapearUnidadeNfe } from './nfe'

const XML_EXEMPLO = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
 <NFe>
  <infNFe Id="NFe35260845997418000153550010000012341000012349" versao="4.00">
   <ide>
    <cUF>35</cUF><nNF>1234</nNF><serie>1</serie>
    <dhEmi>2026-08-10T09:30:00-03:00</dhEmi>
   </ide>
   <emit>
    <CNPJ>45997418000153</CNPJ>
    <xNome>Distribuidora de Bebidas SA &amp; Cia</xNome>
    <IE>123456789012</IE>
   </emit>
   <det nItem="1">
    <prod>
     <cProd>XAR-500</cProd>
     <cEAN>7891000123456</cEAN>
     <xProd>Xarope de Morango 500ml</xProd>
     <NCM>21069090</NCM>
     <uCom>CX</uCom>
     <qCom>10.0000</qCom>
     <vUnCom>55.0000</vUnCom>
     <vProd>550.00</vProd>
    </prod>
   </det>
   <det nItem="2">
    <prod>
     <cProd>AGUA-15</cProd>
     <cEAN>SEM GTIN</cEAN>
     <xProd>Agua Mineral 1,5L</xProd>
     <NCM>22011000</NCM>
     <uCom>UN</uCom>
     <qCom>60.0000</qCom>
     <vUnCom>2.5000</vUnCom>
     <vProd>150.00</vProd>
    </prod>
   </det>
   <total><ICMSTot><vNF>700.00</vNF></ICMSTot></total>
  </infNFe>
 </NFe>
</nfeProc>`

describe('lerNfe', () => {
  it('extrai chave, número, emitente e total', () => {
    const nf = lerNfe(XML_EXEMPLO)
    expect(nf.chave).toBe('35260845997418000153550010000012341000012349')
    expect(nf.numero).toBe('1234')
    expect(nf.serie).toBe('1')
    expect(nf.emitente.cnpj).toBe('45997418000153')
    expect(nf.emitente.nome).toBe('Distribuidora de Bebidas SA & Cia')
    expect(nf.valor_total).toBe(700)
  })

  it('extrai os itens com NCM, EAN, unidade mapeada e valores', () => {
    const nf = lerNfe(XML_EXEMPLO)
    expect(nf.itens).toHaveLength(2)
    expect(nf.itens[0]).toMatchObject({
      codigo: 'XAR-500', ncm: '21069090', ean: '7891000123456',
      unidade: 'cx', qtd: 10, valor_unitario: 55, valor_total: 550,
    })
    // "SEM GTIN" não pode virar código de barras
    expect(nf.itens[1].ean).toBeNull()
    expect(nf.itens[1].unidade).toBe('un')
  })

  it('recusa XML que não é NFe', () => {
    expect(() => lerNfe('<html><body>não sou nota</body></html>')).toThrow(/NFe/)
  })

  it('tolera prefixo de namespace nas tags', () => {
    const comPrefixo = XML_EXEMPLO.replace(/<(\/?)(infNFe|ide|emit|det|prod|cProd|xProd|qCom|uCom|vUnCom|vProd|nNF|serie)/g, '<$1nfe:$2')
    const nf = lerNfe(comPrefixo)
    expect(nf.itens).toHaveLength(2)
    expect(nf.itens[0].codigo).toBe('XAR-500')
  })
})

describe('mapearUnidadeNfe', () => {
  it('mapeia variações comuns', () => {
    expect(mapearUnidadeNfe('CX')).toBe('cx')
    expect(mapearUnidadeNfe('UND')).toBe('un')
    expect(mapearUnidadeNfe('LT')).toBe('l')
    expect(mapearUnidadeNfe('desconhecida')).toBe('un')
  })
})
