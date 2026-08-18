/**
 * Leitura de CSV para o importador (item 45).
 * Suporta separador vírgula ou ponto-e-vírgula (Excel BR), aspas com escape,
 * e números no formato brasileiro ("1.234,56").
 */

export interface TabelaCsv {
  cabecalho: string[]
  linhas: string[][]
}

export function detectarSeparador(texto: string): ',' | ';' {
  const primeira = texto.split(/\r?\n/, 1)[0] ?? ''
  let virgulas = 0
  let pontoVirgulas = 0
  let dentroAspas = false
  for (const ch of primeira) {
    if (ch === '"') dentroAspas = !dentroAspas
    else if (!dentroAspas && ch === ',') virgulas++
    else if (!dentroAspas && ch === ';') pontoVirgulas++
  }
  return pontoVirgulas > virgulas ? ';' : ','
}

export function lerCsv(texto: string): TabelaCsv {
  const sep = detectarSeparador(texto)
  const linhas: string[][] = []
  let linha: string[] = []
  let campo = ''
  let dentroAspas = false

  const fecharCampo = () => { linha.push(campo); campo = '' }
  const fecharLinha = () => {
    fecharCampo()
    if (linha.some((c) => c.trim() !== '')) linhas.push(linha)
    linha = []
  }

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]
    if (dentroAspas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++ }
        else dentroAspas = false
      } else campo += ch
    } else if (ch === '"') {
      dentroAspas = true
    } else if (ch === sep) {
      fecharCampo()
    } else if (ch === '\n') {
      fecharLinha()
    } else if (ch !== '\r') {
      campo += ch
    }
  }
  if (campo !== '' || linha.length > 0) fecharLinha()

  const [cabecalho = [], ...resto] = linhas
  return { cabecalho: cabecalho.map((c) => c.trim()), linhas: resto }
}

/** "1.234,56" → 1234.56 · "1234.56" → 1234.56 · "" → null */
export function lerNumeroBr(texto: string): number | null {
  const t = texto.trim()
  if (t === '') return null
  const normalizado = /,\d{1,4}$/.test(t)
    ? t.replace(/\./g, '').replace(',', '.')
    : t.replace(/,/g, '')
  const n = Number(normalizado)
  return Number.isFinite(n) ? n : null
}

/** Sugere o mapeamento coluna → campo pelo nome do cabeçalho. */
export function sugerirMapeamento(cabecalho: string[]): Record<string, string> {
  const alvo: Record<string, RegExp> = {
    nome: /^(nome|produto|descri)/i,
    categoria: /^(categoria|grupo|se[cç][aã]o)/i,
    sku: /^(sku|c[oó]digo interno|c[oó]d\.? ?int|refer[eê]ncia)/i,
    codigo_barras: /^(ean|gtin|c[oó]digo de barras|barras)/i,
    preco: /^(pre[cç]o|valor|venda)/i,
    custo: /^custo/i,
    unidade: /^(unidade|un\.?|medida)$/i,
  }
  const mapa: Record<string, string> = {}
  for (const coluna of cabecalho) {
    for (const [campo, re] of Object.entries(alvo)) {
      if (re.test(coluna) && !Object.values(mapa).includes(campo)) {
        mapa[coluna] = campo
        break
      }
    }
  }
  return mapa
}
