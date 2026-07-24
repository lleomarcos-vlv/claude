package com.kairos.erp.kci.app;

import com.kairos.erp.equipment.domain.EquipamentoRepository;
import com.kairos.erp.inventory.domain.ItemEstoqueRepository;
import com.kairos.erp.shared.tenant.TenantContext;
import com.kairos.erp.workorder.domain.OrdemServico;
import com.kairos.erp.workorder.domain.OrdemServicoItem;
import com.kairos.erp.workorder.domain.OrdemServicoItemRepository;
import com.kairos.erp.workorder.domain.OrdemServicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * IA preditiva da Conlor — mapeamento de problemas crônicos: analisa o histórico
 * de manutenções concluídas para identificar defeitos sistêmicos por modelo de
 * aeronave (ex.: "Agras T20 — 34 manutenções, peça mais recorrente: anel da
 * bomba"). Alimenta a gestão de estoque previsível e o diagnóstico ágil.
 */
@Service
public class ProblemasCronicosService {

    private final OrdemServicoRepository ordens;
    private final OrdemServicoItemRepository itensOs;
    private final EquipamentoRepository equipamentos;
    private final ItemEstoqueRepository itensEstoque;

    public ProblemasCronicosService(OrdemServicoRepository ordens, OrdemServicoItemRepository itensOs,
                                    EquipamentoRepository equipamentos, ItemEstoqueRepository itensEstoque) {
        this.ordens = ordens;
        this.itensOs = itensOs;
        this.equipamentos = equipamentos;
        this.itensEstoque = itensEstoque;
    }

    public record Cronico(String modelo, long manutencoes, String pecaMaisRecorrente,
                          BigDecimal quantidadePeca) {
    }

    private static final class Agg {
        long manutencoes;
        final Map<String, BigDecimal> pecas = new LinkedHashMap<>();
    }

    @Transactional(readOnly = true)
    public List<Cronico> cronicos() {
        String tenant = TenantContext.require();
        Map<String, Agg> porModelo = new LinkedHashMap<>();

        for (OrdemServico os : ordens.findByTenantIdOrderByAbertaEmDesc(tenant)) {
            if (!os.estaConcluida()) {
                continue;
            }
            String modelo = equipamentos.findByIdAndTenantId(os.getEquipamentoId(), tenant)
                    .map(e -> e.getModelo()).orElse("(desconhecido)");
            Agg agg = porModelo.computeIfAbsent(modelo, k -> new Agg());
            agg.manutencoes++;
            for (OrdemServicoItem osi : itensOs.findByOrdemServicoId(os.getId())) {
                String sku = itensEstoque.findByIdAndTenantId(osi.getItemId(), tenant)
                        .map(i -> i.getSku()).orElse(osi.getItemId());
                agg.pecas.merge(sku, osi.getQuantidade(), BigDecimal::add);
            }
        }

        List<Cronico> resultado = new ArrayList<>();
        for (Map.Entry<String, Agg> e : porModelo.entrySet()) {
            Agg agg = e.getValue();
            String topPeca = null;
            BigDecimal topQtd = BigDecimal.ZERO;
            for (Map.Entry<String, BigDecimal> p : agg.pecas.entrySet()) {
                if (p.getValue().compareTo(topQtd) > 0) {
                    topQtd = p.getValue();
                    topPeca = p.getKey();
                }
            }
            resultado.add(new Cronico(e.getKey(), agg.manutencoes, topPeca, topQtd));
        }
        resultado.sort(Comparator.comparingLong(Cronico::manutencoes).reversed());
        return resultado;
    }
}
