package com.kairos.erp.bi.app;

import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.inventory.app.EstoqueService.ClassificacaoAbc;
import com.kairos.erp.inventory.domain.ItemEstoque;
import com.kairos.erp.workorder.app.OrdemServicoService;
import com.kairos.erp.workorder.domain.OrdemServico;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Comparator;

/**
 * Business Intelligence (etapa 076): agrega indicadores do tenant a partir dos
 * serviços de domínio (somente leitura), para os painéis e gráficos.
 */
@Service
public class BiService {

    private final EquipamentoService equipamentos;
    private final EstoqueService estoque;
    private final OrdemServicoService ordens;

    public BiService(EquipamentoService equipamentos, EstoqueService estoque, OrdemServicoService ordens) {
        this.equipamentos = equipamentos;
        this.estoque = estoque;
        this.ordens = ordens;
    }

    public record SaldoItem(String sku, BigDecimal saldo) {
    }

    public record Indicadores(
            long equipamentos,
            long itens,
            long osAbertas,
            long osConcluidas,
            long itensParaRepor,
            Map<String, Long> curvaAbc,
            Map<String, Long> osPorStatus,
            List<SaldoItem> estoquePorItem) {
    }

    @Transactional(readOnly = true)
    public Indicadores indicadores() {
        List<ItemEstoque> itens = estoque.listar();
        List<OrdemServico> listaOs = ordens.listar();
        List<ClassificacaoAbc> abc = estoque.curvaAbc();

        Map<String, Long> abcDist = new LinkedHashMap<>();
        abcDist.put("A", abc.stream().filter(c -> "A".equals(c.classe())).count());
        abcDist.put("B", abc.stream().filter(c -> "B".equals(c.classe())).count());
        abcDist.put("C", abc.stream().filter(c -> "C".equals(c.classe())).count());

        // Distribuição por estágio real do fluxo Conlor (mantém a ordem do funil)
        Map<String, Long> osStatus = new LinkedHashMap<>();
        for (OrdemServico.Status s : OrdemServico.Status.values()) {
            long n = listaOs.stream().filter(o -> s.name().equals(o.getStatus())).count();
            if (n > 0) {
                osStatus.put(s.name(), n);
            }
        }
        long abertas = listaOs.stream()
                .filter(o -> !"CONCLUIDA".equals(o.getStatus()) && !"CANCELADA".equals(o.getStatus()))
                .count();
        long concluidas = listaOs.stream().filter(o -> "CONCLUIDA".equals(o.getStatus())).count();

        List<SaldoItem> estoquePorItem = itens.stream()
                .sorted(Comparator.comparing(ItemEstoque::getSaldo).reversed())
                .limit(8)
                .map(i -> new SaldoItem(i.getSku(), i.getSaldo()))
                .toList();

        return new Indicadores(
                equipamentos.listar().size(),
                itens.size(),
                abertas,
                concluidas,
                estoque.itensParaRepor().size(),
                abcDist,
                osStatus,
                estoquePorItem);
    }
}
