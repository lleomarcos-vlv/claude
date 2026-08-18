/**
 * Fila offline do PDV (item 42 do briefing).
 *
 * Quando a internet cai, a venda finalizada entra nesta fila (localStorage)
 * e o caixa segue trabalhando. Ao voltar a conexão, cada venda é reenviada
 * na ordem. Conflitos honestos:
 *   · preço usado é o do momento da venda (vai junto no payload);
 *   · se o reenvio falhar por regra de negócio (ex.: caixa fechado), a venda
 *     fica marcada com o erro para resolução humana — nunca é descartada.
 */

export interface PagamentoOffline { forma: string; valor: number }
export interface ItemOffline {
  product_id: string
  qtd: number
  preco_unitario: number
  observacao?: string
}
export interface VendaOffline {
  id: string                    // uuid gerado no cliente
  criada_em: string
  tenant_id: string
  branch_id: string
  modo: string
  customer_id: string | null
  itens: ItemOffline[]
  pagamentos: PagamentoOffline[]
  desconto: number
  erro?: string                 // preenchido quando o reenvio falha
}

export interface ExecutorVenda {
  (venda: VendaOffline): Promise<void>
}

const CHAVE = 'grafista.fila-vendas'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>

export class FilaOffline {
  constructor(private storage: Storage) {}

  listar(): VendaOffline[] {
    try {
      return JSON.parse(this.storage.getItem(CHAVE) ?? '[]') as VendaOffline[]
    } catch {
      return []
    }
  }

  private gravar(fila: VendaOffline[]) {
    if (fila.length === 0) this.storage.removeItem(CHAVE)
    else this.storage.setItem(CHAVE, JSON.stringify(fila))
  }

  enfileirar(venda: VendaOffline) {
    const fila = this.listar()
    if (fila.some((v) => v.id === venda.id)) return   // idempotente
    fila.push(venda)
    this.gravar(fila)
  }

  pendentes(): number {
    return this.listar().length
  }

  comErro(): VendaOffline[] {
    return this.listar().filter((v) => v.erro)
  }

  descartar(id: string) {
    this.gravar(this.listar().filter((v) => v.id !== id))
  }

  /**
   * Reenvia a fila em ordem. Vendas aceitas saem; venda que falha ganha o
   * erro e PERMANECE (as seguintes ainda são tentadas — cada venda é
   * independente). Retorna quantas sincronizaram.
   */
  async sincronizar(executar: ExecutorVenda): Promise<number> {
    const fila = this.listar()
    if (fila.length === 0) return 0
    const restantes: VendaOffline[] = []
    let ok = 0
    for (const venda of fila) {
      try {
        await executar(venda)
        ok++
      } catch (e) {
        restantes.push({ ...venda, erro: e instanceof Error ? e.message : String(e) })
      }
    }
    this.gravar(restantes)
    return ok
  }
}
