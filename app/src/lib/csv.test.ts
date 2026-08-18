import { describe, expect, it } from 'vitest'
import { detectarSeparador, lerCsv, lerNumeroBr, sugerirMapeamento } from './csv'

describe('detectarSeparador', () => {
  it('detecta ponto-e-vírgula do Excel BR', () => {
    expect(detectarSeparador('nome;preco;sku\na;1;x')).toBe(';')
  })
  it('detecta vírgula padrão', () => {
    expect(detectarSeparador('nome,preco,sku')).toBe(',')
  })
  it('ignora separador dentro de aspas', () => {
    expect(detectarSeparador('"a;b",c,d')).toBe(',')
  })
})

describe('lerCsv', () => {
  it('lê cabeçalho e linhas', () => {
    const t = lerCsv('nome,preco\nX-Burger,18.90\nX-Salada,21.90\n')
    expect(t.cabecalho).toEqual(['nome', 'preco'])
    expect(t.linhas).toEqual([['X-Burger', '18.90'], ['X-Salada', '21.90']])
  })
  it('trata aspas com vírgula e aspas escapadas', () => {
    const t = lerCsv('nome,obs\n"Filé, à Parmegiana","disse ""ok"""\n')
    expect(t.linhas[0]).toEqual(['Filé, à Parmegiana', 'disse "ok"'])
  })
  it('descarta linhas vazias', () => {
    const t = lerCsv('a,b\n1,2\n\n   ,  \n3,4')
    expect(t.linhas).toHaveLength(2)
  })
  it('suporta quebra de linha dentro de aspas', () => {
    const t = lerCsv('nome,obs\n"Bolo","duas\nlinhas"\n')
    expect(t.linhas[0][1]).toBe('duas\nlinhas')
  })
})

describe('lerNumeroBr', () => {
  it('lê formato brasileiro', () => {
    expect(lerNumeroBr('1.234,56')).toBe(1234.56)
    expect(lerNumeroBr('18,90')).toBe(18.9)
  })
  it('lê formato com ponto decimal', () => {
    expect(lerNumeroBr('18.90')).toBe(18.9)
    expect(lerNumeroBr('1,234.56')).toBe(1234.56)
  })
  it('vazio e lixo viram null', () => {
    expect(lerNumeroBr('')).toBeNull()
    expect(lerNumeroBr('abc')).toBeNull()
  })
})

describe('sugerirMapeamento', () => {
  it('sugere pelos nomes usuais', () => {
    const m = sugerirMapeamento(['Descrição', 'Preço de Venda', 'EAN', 'Custo', 'Categoria'])
    expect(m['Descrição']).toBe('nome')
    expect(m['Preço de Venda']).toBe('preco')
    expect(m['EAN']).toBe('codigo_barras')
    expect(m['Custo']).toBe('custo')
    expect(m['Categoria']).toBe('categoria')
  })
  it('não mapeia o mesmo campo duas vezes', () => {
    const m = sugerirMapeamento(['Preço', 'Valor'])
    expect(Object.values(m).filter((v) => v === 'preco')).toHaveLength(1)
  })
})
