package com.kairos.erp.finance.app;

import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.inventory.domain.ItemEstoque;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Financeiro de peças (Conlor): rentabilidade do estoque virtual. Para cada peça
 * calcula custo, venda, margem, lucro, volume vendido, giro, estoque mínimo/
 * recomendado e uma previsão simples de consumo — a partir das movimentações e
 * dos preços cadastrados. Substitui o financeiro genérico (contas a pagar/receber)
 * no painel administrativo.
 */
@Service
public class FinanceiroPecasService {

    private final EstoqueService estoque;

    public FinanceiroPecasService(EstoqueService estoque) {
        this.estoque = estoque;
    }

    public record PecaFinanceiro(String itemId, String sku, String descricao,
                                 BigDecimal custo, BigDecimal preco, BigDecimal margemUnitaria,
                                 BigDecimal margemPercentual, BigDecimal saldo,
                                 BigDecimal volumeVendido, BigDecimal receita, BigDecimal lucro,
                                 BigDecimal giro, BigDecimal estoqueMinimo,
                                 BigDecimal estoqueRecomendado, BigDecimal previsaoConsumo) {
    }

    public record ResumoPecas(BigDecimal receitaTotal, BigDecimal custoTotal, BigDecimal lucroTotal,
                              BigDecimal margemMedia, BigDecimal valorEstoque,
                              int itens, int itensParaRepor, List<PecaFinanceiro> pecas) {
    }

    @Transactional(readOnly = true)
    public ResumoPecas resumo() {
        Map<String, BigDecimal> consumo = estoque.consumoPorItem();
        List<PecaFinanceiro> pecas = new ArrayList<>();
        BigDecimal receitaTotal = BigDecimal.ZERO;
        BigDecimal custoTotal = BigDecimal.ZERO;
        BigDecimal lucroTotal = BigDecimal.ZERO;
        BigDecimal valorEstoque = BigDecimal.ZERO;
        int itensParaRepor = 0;

        for (ItemEstoque i : estoque.listar()) {
            BigDecimal vol = consumo.getOrDefault(i.getId(), BigDecimal.ZERO);
            BigDecimal receita = i.getPreco().multiply(vol);
            BigDecimal custoVendido = i.getCusto().multiply(vol);
            BigDecimal lucro = receita.subtract(custoVendido);
            BigDecimal margemUnit = i.margemUnitaria();
            BigDecimal margemPct = i.getPreco().signum() == 0 ? BigDecimal.ZERO
                    : margemUnit.multiply(BigDecimal.valueOf(100))
                    .divide(i.getPreco(), 1, RoundingMode.HALF_UP);
            BigDecimal giro = i.getSaldo().signum() == 0 ? vol
                    : vol.divide(i.getSaldo(), 2, RoundingMode.HALF_UP);
            // Previsão simples: consumo histórico projetado para o próximo ciclo (~1/6).
            BigDecimal previsao = vol.divide(BigDecimal.valueOf(6), 0, RoundingMode.CEILING);
            BigDecimal recomendado = i.getPontoReposicao().add(previsao);

            pecas.add(new PecaFinanceiro(i.getId(), i.getSku(), i.getDescricao(),
                    i.getCusto(), i.getPreco(), margemUnit, margemPct, i.getSaldo(),
                    vol, receita, lucro, giro, i.getPontoReposicao(), recomendado, previsao));

            receitaTotal = receitaTotal.add(receita);
            custoTotal = custoTotal.add(custoVendido);
            lucroTotal = lucroTotal.add(lucro);
            valorEstoque = valorEstoque.add(i.getCusto().multiply(i.getSaldo()));
            if (i.precisaRepor()) {
                itensParaRepor++;
            }
        }
        pecas.sort(Comparator.comparing(PecaFinanceiro::lucro).reversed());

        BigDecimal margemMedia = receitaTotal.signum() == 0 ? BigDecimal.ZERO
                : lucroTotal.multiply(BigDecimal.valueOf(100)).divide(receitaTotal, 1, RoundingMode.HALF_UP);

        return new ResumoPecas(receitaTotal, custoTotal, lucroTotal, margemMedia, valorEstoque,
                pecas.size(), itensParaRepor, pecas);
    }
}
