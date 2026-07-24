package com.kairos.erp.kci.app;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;

/**
 * IA preditiva da Conlor — sugestões ativas de manutenção: ao avaliar um
 * orçamento, correlaciona as peças listadas e infere a causa provável,
 * alertando o técnico sobre componentes frequentemente afetados no mesmo
 * cenário (ex.: hélices + eixos de braço → padrão "Queda" → verificar
 * radares e sistema aviônico). Motor determinístico e offline.
 */
@Service
public class SugestaoService {

    /** Regra de correlação: N ou mais grupos de peças presentes → padrão inferido. */
    private record Regra(String padrao, int minGrupos, List<Set<String>> grupos,
                         String alerta, List<String> verificar) {
    }

    private final List<Regra> regras = List.of(
            new Regra("Queda", 2,
                    List.of(Set.of("helice"), Set.of("eixo", "braco", "braço"),
                            Set.of("trem", "pouso"), Set.of("carenagem", "casco")),
                    "Padrão de QUEDA detectado: as peças do orçamento são típicas de impacto.",
                    List.of("Radares (obstáculos/terreno)", "Sistema aviônico (IMU/controladora)",
                            "Compasso e GPS", "Estrutura do chassi")),
            new Regra("Sistema de Pulverização", 1,
                    List.of(Set.of("bomba", "anel"), Set.of("bico"), Set.of("mangueira"),
                            Set.of("pulveriz"), Set.of("tanque")),
                    "Padrão de PULVERIZAÇÃO: verifique o circuito hidráulico completo.",
                    List.of("Anéis e vedações da bomba", "Filtros e bicos",
                            "Mangueiras e conexões", "Vazão por seção")),
            new Regra("Energia", 1,
                    List.of(Set.of("bateria"), Set.of("carregador"), Set.of("fonte", "conector")),
                    "Padrão de ENERGIA: risco de células degradadas ou conectores aquecidos.",
                    List.of("Ciclo completo e balanceamento das células", "Conectores de potência",
                            "BMS e firmware da bateria")),
            new Regra("Navegação/Aviônica", 1,
                    List.of(Set.of("radar"), Set.of("antena"), Set.of("gps"), Set.of("imu")),
                    "Padrão de NAVEGAÇÃO: recalibração e atualização recomendadas.",
                    List.of("Recalibrar compasso e IMU", "Atualizar firmware de navegação",
                            "Teste de voo assistido")));

    /** Uma sugestão ativa apresentada ao técnico durante o orçamento. */
    public record Sugestao(String padrao, String alerta, List<String> verificar) {
    }

    /**
     * Analisa os textos das peças do orçamento (SKU + descrição) e devolve os
     * padrões inferidos, na ordem das regras.
     */
    public List<Sugestao> analisar(List<String> textosDasPecas) {
        String texto = normalizar(String.join(" ", textosDasPecas));
        List<Sugestao> sugestoes = new ArrayList<>();
        for (Regra regra : regras) {
            int grupos = 0;
            Set<String> encontrados = new TreeSet<>();
            for (Set<String> grupo : regra.grupos()) {
                boolean bateu = grupo.stream().map(SugestaoService::normalizar)
                        .anyMatch(texto::contains);
                if (bateu) {
                    grupos++;
                    encontrados.addAll(grupo);
                }
            }
            if (grupos >= regra.minGrupos()) {
                sugestoes.add(new Sugestao(regra.padrao(), regra.alerta(), regra.verificar()));
            }
        }
        return sugestoes;
    }

    private static String normalizar(String s) {
        return java.text.Normalizer.normalize(s == null ? "" : s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }
}
