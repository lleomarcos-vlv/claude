package com.kairos.erp.inventory.app;

import com.kairos.erp.inventory.domain.ItemEstoque;
import com.kairos.erp.inventory.domain.ItemEstoqueRepository;
import com.kairos.erp.inventory.domain.MovimentacaoEstoque;
import com.kairos.erp.inventory.domain.MovimentacaoEstoqueRepository;
import com.kairos.erp.notification.app.NotificacaoService;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kairos.erp.inventory.domain.MovimentacaoEstoqueRepository.ConsumoItem;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EstoqueService {

    private final ItemEstoqueRepository itens;
    private final MovimentacaoEstoqueRepository movimentacoes;
    private final NotificacaoService notificacoes;

    public EstoqueService(ItemEstoqueRepository itens, MovimentacaoEstoqueRepository movimentacoes,
                          NotificacaoService notificacoes) {
        this.itens = itens;
        this.movimentacoes = movimentacoes;
        this.notificacoes = notificacoes;
    }

    @Transactional
    public ItemEstoque criarItem(String sku, String descricao, BigDecimal saldoInicial,
                                 BigDecimal pontoReposicao, BigDecimal preco, BigDecimal custo,
                                 String fornecedor) {
        String tenant = TenantContext.require();
        if (itens.existsByTenantIdAndSku(tenant, sku)) {
            throw new BusinessException("SKU já cadastrado: " + sku);
        }
        ItemEstoque item = itens.save(
                ItemEstoque.novo(tenant, sku, descricao, saldoInicial, pontoReposicao, preco, custo, fornecedor));
        if (saldoInicial != null && saldoInicial.signum() > 0) {
            movimentacoes.save(MovimentacaoEstoque.de(tenant, item.getId(), "ENTRADA", saldoInicial, "SALDO_INICIAL"));
        }
        return item;
    }

    /** Atualiza preço de venda, custo de compra e/ou fornecedor da peça. */
    @Transactional
    public ItemEstoque precificar(String itemId, BigDecimal preco, BigDecimal custo, String fornecedor) {
        ItemEstoque item = buscar(itemId);
        if (preco != null) {
            item.precificar(preco);
        }
        if (custo != null) {
            item.definirCusto(custo);
        }
        if (fornecedor != null) {
            item.definirFornecedor(fornecedor);
        }
        return itens.save(item);
    }

    public record ImportacaoResumo(int criados, int atualizados, List<String> ignorados) {
    }

    /**
     * Importa peças de uma planilha CSV (colunas: sku, descricao, quantidade,
     * custo, preco, fornecedor — cabeçalho na 1ª linha). SKU novo é criado; SKU
     * existente tem nome/custo/preço/fornecedor atualizados e a quantidade dá
     * entrada no estoque. Aceita separador ';' ou ','.
     */
    @Transactional
    public ImportacaoResumo importarPlanilha(String csv) {
        if (csv == null || csv.isBlank()) {
            throw new BusinessException("Arquivo vazio");
        }
        String[] linhas = csv.replace("\r", "").split("\n");
        if (linhas.length < 2) {
            throw new BusinessException("A planilha precisa de um cabeçalho e ao menos uma linha");
        }
        char sep = linhas[0].contains(";") ? ';' : ',';
        String[] cab = split(linhas[0], sep);
        Map<String, Integer> col = new HashMap<>();
        for (int i = 0; i < cab.length; i++) {
            col.put(normalizarCol(cab[i]), i);
        }
        if (!col.containsKey("sku")) {
            throw new BusinessException("A planilha precisa da coluna 'sku'");
        }
        int criados = 0;
        int atualizados = 0;
        List<String> ignorados = new ArrayList<>();
        String tenant = TenantContext.require();
        for (int i = 1; i < linhas.length; i++) {
            if (linhas[i].isBlank()) {
                continue;
            }
            String[] campos = split(linhas[i], sep);
            String sku = valor(campos, col.get("sku"));
            if (sku.isBlank()) {
                continue;
            }
            String descricao = valor(campos, col.get("descricao"));
            BigDecimal quantidade = numero(valor(campos, col.get("quantidade")));
            BigDecimal custo = numero(valor(campos, col.get("custo")));
            BigDecimal preco = numero(valor(campos, col.get("preco")));
            String fornecedor = valor(campos, col.get("fornecedor"));
            try {
                ItemEstoque existente = itens.findByTenantIdAndSku(tenant, sku).orElse(null);
                if (existente == null) {
                    ItemEstoque novo = itens.save(ItemEstoque.novo(tenant, sku,
                            descricao.isBlank() ? sku : descricao, quantidade,
                            BigDecimal.ZERO, preco, custo, fornecedor.isBlank() ? null : fornecedor));
                    if (quantidade.signum() > 0) {
                        movimentacoes.save(MovimentacaoEstoque.de(tenant, novo.getId(), "ENTRADA",
                                quantidade, "IMPORTACAO"));
                    }
                    criados++;
                } else {
                    if (!descricao.isBlank()) {
                        existente.renomear(descricao);
                    }
                    if (preco.signum() > 0) {
                        existente.precificar(preco);
                    }
                    if (custo.signum() > 0) {
                        existente.definirCusto(custo);
                    }
                    if (!fornecedor.isBlank()) {
                        existente.definirFornecedor(fornecedor);
                    }
                    if (quantidade.signum() > 0) {
                        existente.entrada(quantidade);
                        movimentacoes.save(MovimentacaoEstoque.de(tenant, existente.getId(), "ENTRADA",
                                quantidade, "IMPORTACAO"));
                    }
                    itens.save(existente);
                    atualizados++;
                }
            } catch (RuntimeException e) {
                ignorados.add(sku + ": " + e.getMessage());
            }
        }
        return new ImportacaoResumo(criados, atualizados, ignorados);
    }

    private static String[] split(String linha, char sep) {
        return linha.split(java.util.regex.Pattern.quote(String.valueOf(sep)), -1);
    }

    private static String valor(String[] campos, Integer idx) {
        if (idx == null || idx >= campos.length || campos[idx] == null) {
            return "";
        }
        return campos[idx].trim().replaceAll("^\"|\"$", "");
    }

    private static BigDecimal numero(String s) {
        if (s == null || s.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(s.replace(".", "").replace(",", ".").replaceAll("[^0-9.\\-]", ""));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static String normalizarCol(String s) {
        return java.text.Normalizer.normalize(s == null ? "" : s.trim(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z]", "");
    }

    /** Consumo total (saídas) por item do tenant — base do financeiro de peças. */
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> consumoPorItem() {
        Map<String, BigDecimal> consumo = new HashMap<>();
        for (ConsumoItem c : movimentacoes.consumoPorItem(TenantContext.require())) {
            consumo.put(c.getItemId(), c.getTotal() == null ? BigDecimal.ZERO : c.getTotal());
        }
        return consumo;
    }

    @Transactional(readOnly = true)
    public ItemEstoque buscar(String id) {
        return itens.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Item de estoque não encontrado: " + id));
    }

    /** Baixa automática de estoque com origem rastreável (ex.: conclusão de OS). */
    @Transactional
    public void baixar(String itemId, BigDecimal quantidade, String origem) {
        String tenant = TenantContext.require();
        ItemEstoque item = buscar(itemId);
        item.baixa(quantidade);
        itens.save(item);
        movimentacoes.save(MovimentacaoEstoque.de(tenant, item.getId(), "SAIDA", quantidade, origem));
        if (item.precisaRepor()) {
            notificacoes.registrar("ESTOQUE_BAIXO",
                    "Item " + item.getSku() + " no ponto de reposição (saldo " + item.getSaldo() + ")");
        }
    }

    /** Entrada de estoque (ex.: recebimento de compra) com origem rastreável. */
    @Transactional
    public ItemEstoque entrada(String itemId, BigDecimal quantidade, String origem) {
        String tenant = TenantContext.require();
        ItemEstoque item = buscar(itemId);
        item.entrada(quantidade);
        itens.save(item);
        movimentacoes.save(MovimentacaoEstoque.de(tenant, item.getId(), "ENTRADA", quantidade, origem));
        return item;
    }

    @Transactional(readOnly = true)
    public List<ItemEstoque> listar() {
        return itens.findByTenantIdOrderBySkuAsc(TenantContext.require());
    }

    /** Itens que atingiram o ponto de reposição (sugestão de compra — KSI). */
    @Transactional(readOnly = true)
    public List<ItemEstoque> itensParaRepor() {
        return itens.findParaRepor(TenantContext.require());
    }

    /** Histórico de movimentações de um item (mais recentes primeiro). */
    @Transactional(readOnly = true)
    public List<MovimentacaoEstoque> movimentacoesDe(String itemId) {
        buscar(itemId); // valida item + tenant
        return movimentacoes.findByItemIdOrderByCriadoEmDesc(itemId);
    }

    public record ClassificacaoAbc(String itemId, String sku, String descricao,
                                   BigDecimal consumo, String classe) {
    }

    /**
     * Curva ABC por <strong>consumo</strong> (soma das saídas): ordena os itens do
     * maior para o menor consumo e classifica pela participação acumulada —
     * A até 80%, B até 95%, C o restante (itens sem consumo caem em C). Critério
     * clássico do KSI; na evolução pode ponderar por custo unitário.
     */
    @Transactional(readOnly = true)
    public List<ClassificacaoAbc> curvaAbc() {
        String tenant = TenantContext.require();
        // Consumo agregado numa única consulta (evita N+1 por item).
        Map<String, BigDecimal> consumoPorItem = new HashMap<>();
        for (ConsumoItem c : movimentacoes.consumoPorItem(tenant)) {
            consumoPorItem.put(c.getItemId(), c.getTotal() == null ? BigDecimal.ZERO : c.getTotal());
        }
        record Linha(ItemEstoque item, BigDecimal consumo) {
        }
        List<Linha> linhas = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (ItemEstoque item : itens.findByTenantIdOrderBySkuAsc(tenant)) {
            BigDecimal consumo = consumoPorItem.getOrDefault(item.getId(), BigDecimal.ZERO);
            linhas.add(new Linha(item, consumo));
            total = total.add(consumo);
        }
        linhas.sort(Comparator.comparing(Linha::consumo).reversed());

        List<ClassificacaoAbc> resultado = new ArrayList<>();
        BigDecimal acumulado = BigDecimal.ZERO;
        for (Linha l : linhas) {
            String classe;
            if (total.signum() == 0 || l.consumo().signum() == 0) {
                classe = "C";
            } else {
                // Classifica pela participação acumulada ANTES deste item: assim o
                // item que cruza um limite pertence à classe superior (A até 80%,
                // B até 95%). Sem isso, um único item (100%) cairia em C.
                double fracaoAntes = acumulado.doubleValue() / total.doubleValue();
                classe = fracaoAntes < 0.80 ? "A" : fracaoAntes < 0.95 ? "B" : "C";
                acumulado = acumulado.add(l.consumo());
            }
            resultado.add(new ClassificacaoAbc(l.item().getId(), l.item().getSku(),
                    l.item().getDescricao(), l.consumo(), classe));
        }
        return resultado;
    }
}
