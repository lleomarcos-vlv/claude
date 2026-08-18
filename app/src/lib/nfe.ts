/**
 * Leitura do XML de NFe do fornecedor (item 14).
 *
 * Extrai o essencial para conferência e entrada de mercadoria: emitente,
 * chave, itens (código, descrição, NCM, EAN, quantidade, unidade, valor).
 * Parser próprio, sem DOM: funciona no navegador e no Node (testável),
 * e tolera namespaces/prefixos comuns nos XMLs reais.
 *
 * A entrada NUNCA é lançada direto: a tela de conferência mostra o que foi
 * lido e o operador mapeia cada item a um produto antes de gravar.
 */

export interface ItemNfe {
  codigo: string
  descricao: string
  ncm: string | null
  ean: string | null
  unidade: string
  qtd: number
  valor_unitario: number
  valor_total: number
}

export interface NotaFiscal {
  chave: string | null
  numero: string | null
  serie: string | null
  emitida_em: string | null
  emitente: {
    cnpj: string | null
    nome: string | null
    ie: string | null
  }
  valor_total: number | null
  itens: ItemNfe[]
}

/** Conteúdo da primeira ocorrência de <tag>…</tag> dentro de um trecho. */
function tag(trecho: string, nome: string): string | null {
  const re = new RegExp(`<(?:\\w+:)?${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${nome}>`, 'i')
  const m = trecho.match(re)
  return m ? decodificar(m[1].trim()) : null
}

/** Todas as ocorrências do bloco <tag>…</tag>. */
function blocos(trecho: string, nome: string): string[] {
  const re = new RegExp(`<(?:\\w+:)?${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${nome}>`, 'gi')
  const saida: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(trecho)) !== null) saida.push(m[1])
  return saida
}

function decodificar(texto: string): string {
  return texto
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function numero(texto: string | null): number {
  const n = Number(texto ?? '')
  return Number.isFinite(n) ? n : 0
}

/** Unidades comuns de NFe → chaves de public.units. */
export function mapearUnidadeNfe(uCom: string): string {
  const u = uCom.trim().toLowerCase().replace(/\.$/, '')
  const mapa: Record<string, string> = {
    un: 'un', und: 'un', unid: 'un', pc: 'un', pç: 'un', pca: 'un',
    kg: 'kg', g: 'g', grs: 'g', mg: 'mg',
    l: 'l', lt: 'l', litro: 'l', ml: 'ml',
    cx: 'cx', caixa: 'cx', fd: 'fardo', fardo: 'fardo',
    pct: 'pacote', pac: 'pacote', sc: 'saco', saco: 'saco',
    gf: 'garrafa', garrafa: 'garrafa', lata: 'lata', lt350: 'lata',
  }
  return mapa[u] ?? 'un'
}

export function lerNfe(xml: string): NotaFiscal {
  if (!/<(?:\w+:)?infNFe[\s>]/i.test(xml)) {
    throw new Error('Arquivo não parece ser um XML de NFe (infNFe ausente).')
  }

  const chaveAttr = xml.match(/<(?:\w+:)?infNFe[^>]*\bId\s*=\s*"NFe(\d{44})"/i)
  const ide = blocos(xml, 'ide')[0] ?? ''
  const emit = blocos(xml, 'emit')[0] ?? ''
  const totalBloco = blocos(xml, 'ICMSTot')[0] ?? ''

  const itens: ItemNfe[] = blocos(xml, 'det').map((det) => {
    const prod = blocos(det, 'prod')[0] ?? det
    return {
      codigo: tag(prod, 'cProd') ?? '',
      descricao: tag(prod, 'xProd') ?? '',
      ncm: tag(prod, 'NCM'),
      ean: (() => {
        const e = tag(prod, 'cEAN')
        return e && /^\d{8,14}$/.test(e) ? e : null   // "SEM GTIN" vira null
      })(),
      unidade: mapearUnidadeNfe(tag(prod, 'uCom') ?? 'un'),
      qtd: numero(tag(prod, 'qCom')),
      valor_unitario: numero(tag(prod, 'vUnCom')),
      valor_total: numero(tag(prod, 'vProd')),
    }
  })

  return {
    chave: chaveAttr?.[1] ?? null,
    numero: tag(ide, 'nNF'),
    serie: tag(ide, 'serie'),
    emitida_em: tag(ide, 'dhEmi') ?? tag(ide, 'dEmi'),
    emitente: {
      cnpj: tag(emit, 'CNPJ'),
      nome: tag(emit, 'xNome'),
      ie: tag(emit, 'IE'),
    },
    valor_total: totalBloco ? numero(tag(totalBloco, 'vNF')) : null,
    itens,
  }
}
