import { beforeEach, describe, expect, it } from 'vitest'
import { FilaOffline, type VendaOffline } from './fila-offline'

function memoria() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  }
}

function venda(id: string): VendaOffline {
  return {
    id,
    criada_em: '2026-08-18T12:00:00Z',
    tenant_id: 't1',
    branch_id: 'b1',
    modo: 'Balcão',
    customer_id: null,
    itens: [{ product_id: 'p1', qtd: 2, preco_unitario: 14 }],
    pagamentos: [{ forma: 'pix', valor: 28 }],
    desconto: 0,
  }
}

describe('FilaOffline', () => {
  let fila: FilaOffline
  beforeEach(() => { fila = new FilaOffline(memoria()) })

  it('enfileira e conta pendentes', () => {
    fila.enfileirar(venda('a'))
    fila.enfileirar(venda('b'))
    expect(fila.pendentes()).toBe(2)
  })

  it('é idempotente por id (reenvio do mesmo clique não duplica)', () => {
    fila.enfileirar(venda('a'))
    fila.enfileirar(venda('a'))
    expect(fila.pendentes()).toBe(1)
  })

  it('sincroniza em ordem e limpa a fila', async () => {
    fila.enfileirar(venda('a'))
    fila.enfileirar(venda('b'))
    const ordem: string[] = []
    const ok = await fila.sincronizar(async (v) => { ordem.push(v.id) })
    expect(ok).toBe(2)
    expect(ordem).toEqual(['a', 'b'])
    expect(fila.pendentes()).toBe(0)
  })

  it('venda que falha permanece com o erro; as demais sincronizam', async () => {
    fila.enfileirar(venda('a'))
    fila.enfileirar(venda('b'))
    fila.enfileirar(venda('c'))
    const ok = await fila.sincronizar(async (v) => {
      if (v.id === 'b') throw new Error('Nenhum caixa aberto nesta filial.')
    })
    expect(ok).toBe(2)
    expect(fila.pendentes()).toBe(1)
    expect(fila.comErro()[0]).toMatchObject({ id: 'b', erro: 'Nenhum caixa aberto nesta filial.' })
  })

  it('venda com erro pode ser descartada manualmente', async () => {
    fila.enfileirar(venda('a'))
    await fila.sincronizar(async () => { throw new Error('x') })
    fila.descartar('a')
    expect(fila.pendentes()).toBe(0)
  })

  it('sobrevive a storage corrompido', () => {
    const s = memoria()
    s.setItem('grafista.fila-vendas', '{lixo')
    const f = new FilaOffline(s)
    expect(f.listar()).toEqual([])
  })
})
