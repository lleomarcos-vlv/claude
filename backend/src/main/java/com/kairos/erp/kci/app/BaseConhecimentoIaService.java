package com.kairos.erp.kci.app;

import com.kairos.erp.kci.app.ProblemasCronicosService.Cronico;
import com.kairos.erp.kci.domain.ConhecimentoIa;
import com.kairos.erp.kci.domain.ConhecimentoIaRepository;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Base de conhecimento importável da IA (problema/causa/como resolver/sugestão) +
 * geração de sugestões de melhoria para o fabricante a partir dos problemas
 * crônicos por modelo.
 */
@Service
public class BaseConhecimentoIaService {

    private final ConhecimentoIaRepository repository;
    private final ProblemasCronicosService cronicos;

    public BaseConhecimentoIaService(ConhecimentoIaRepository repository, ProblemasCronicosService cronicos) {
        this.repository = repository;
        this.cronicos = cronicos;
    }

    public record ItemConhecimento(String id, String problema, String causa, String solucao, String sugestao) {
        static ItemConhecimento of(ConhecimentoIa c) {
            return new ItemConhecimento(c.getId(), c.getProblema(), c.getCausa(), c.getSolucao(), c.getSugestao());
        }
    }

    public record ImportacaoResumo(int importados, List<String> ignorados) {
    }

    public record SugestaoFabricante(String modelo, String peca, long ocorrencias, String texto) {
    }

    @Transactional(readOnly = true)
    public List<ItemConhecimento> listar() {
        return repository.findByTenantIdOrderByCriadoEmDesc(TenantContext.require())
                .stream().map(ItemConhecimento::of).toList();
    }

    /** Importa a base a partir de um CSV (colunas: problema, causa, comoResolver, sugestao). */
    @Transactional
    public ImportacaoResumo importar(String csv) {
        if (csv == null || csv.isBlank()) {
            throw new BusinessException("Arquivo vazio");
        }
        String[] linhas = csv.replace("\r", "").split("\n");
        if (linhas.length < 2) {
            throw new BusinessException("O arquivo precisa de um cabeçalho e ao menos uma linha");
        }
        char sep = linhas[0].contains(";") ? ';' : ',';
        String[] cab = split(linhas[0], sep);
        Map<String, Integer> col = new HashMap<>();
        for (int i = 0; i < cab.length; i++) {
            col.put(normalizar(cab[i]), i);
        }
        if (!col.containsKey("problema")) {
            throw new BusinessException("O arquivo precisa da coluna 'problema'");
        }
        String tenant = TenantContext.require();
        int importados = 0;
        List<String> ignorados = new ArrayList<>();
        for (int i = 1; i < linhas.length; i++) {
            if (linhas[i].isBlank()) {
                continue;
            }
            String[] c = split(linhas[i], sep);
            String problema = valor(c, col.get("problema"));
            if (problema.isBlank()) {
                continue;
            }
            String causa = valor(c, col.get("causa"));
            String solucao = valor(c, col.getOrDefault("comoresolver", col.get("solucao")));
            String sugestao = valor(c, col.get("sugestao"));
            try {
                repository.save(ConhecimentoIa.novo(tenant, problema, causa, solucao, sugestao));
                importados++;
            } catch (RuntimeException e) {
                ignorados.add(problema + ": " + e.getMessage());
            }
        }
        return new ImportacaoResumo(importados, ignorados);
    }

    /**
     * Gera sugestões de melhoria para o fabricante a partir dos problemas
     * crônicos: modelos com peça recorrente viram um texto pronto para envio.
     */
    @Transactional(readOnly = true)
    public List<SugestaoFabricante> sugestoesFabricante() {
        List<SugestaoFabricante> resultado = new ArrayList<>();
        for (Cronico c : cronicos.cronicos()) {
            if (c.pecaMaisRecorrente() == null || c.manutencoes() < 2) {
                continue;
            }
            String qtd = c.quantidadePeca().stripTrailingZeros().toPlainString();
            String texto = "A aeronave " + c.modelo() + " está apresentando quebra recorrente da peça "
                    + c.pecaMaisRecorrente() + " (" + qtd + " trocas em " + c.manutencoes()
                    + " manutenções). Com base no histórico dos técnicos, sugerimos ao fabricante revisar o "
                    + "projeto/material desse componente e avaliar um reforço, reduzindo falhas em campo.";
            resultado.add(new SugestaoFabricante(c.modelo(), c.pecaMaisRecorrente(), c.manutencoes(), texto));
        }
        return resultado;
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

    private static String normalizar(String s) {
        return java.text.Normalizer.normalize(s == null ? "" : s.trim(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
    }
}
