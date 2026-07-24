package com.kairos.erp.kci.app;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

/**
 * Base de conhecimento do KCI (Kairós Core Intelligence) — sistema especialista
 * <strong>offline</strong>, sem dependência de IA externa (doc 13).
 *
 * <p>É um conjunto curado de regras {sintomas → causa provável, ações
 * recomendadas, peças sugeridas}. Mantida em código nesta fase (determinística e
 * auditável); na evolução migra para uma Knowledge Base editável + RAG local.</p>
 */
@Component
public class BaseConhecimentoKci {

    /** Sintoma observável, com uma etiqueta legível para a UI. */
    public record Sintoma(String tag, String rotulo) {
    }

    /** Regra do especialista: se os sintomas ocorrem, esta é a causa e a conduta. */
    public record Regra(Set<String> sintomas, String causa, List<String> acoes, List<String> pecas) {
    }

    private final List<Sintoma> sintomas = List.of(
            new Sintoma("vibracao", "Vibração excessiva"),
            new Sintoma("ruido", "Ruído anormal"),
            new Sintoma("nao_liga", "Não liga"),
            new Sintoma("superaquecimento", "Superaquecimento"),
            new Sintoma("deriva", "Deriva / instabilidade em voo"),
            new Sintoma("gps_fraco", "Sinal de GPS fraco"),
            new Sintoma("perda_conexao", "Perda de conexão com o rádio"),
            new Sintoma("sem_video", "Sem imagem da câmera"),
            new Sintoma("autonomia_baixa", "Autonomia de voo baixa"),
            new Sintoma("led_erro", "LED de erro / firmware"));

    private final List<Regra> regras = List.of(
            new Regra(Set.of("vibracao", "ruido"),
                    "Hélice danificada ou desbalanceada",
                    List.of("Inspecionar hélices", "Trocar hélices e rebalancear o conjunto"),
                    List.of("HELICE-9450")),
            new Regra(Set.of("nao_liga"),
                    "Bateria descarregada ou com falha",
                    List.of("Testar tensão da bateria", "Verificar conectores de energia"),
                    List.of("BATERIA-6S")),
            new Regra(Set.of("superaquecimento", "ruido"),
                    "Motor sobrecarregado ou rolamento gasto",
                    List.of("Verificar rolamentos do motor", "Substituir o motor afetado"),
                    List.of("MOTOR-2207")),
            new Regra(Set.of("deriva", "gps_fraco"),
                    "Falha de GPS / compasso desalinhado",
                    List.of("Recalibrar o compasso", "Atualizar o firmware de navegação"),
                    List.of()),
            new Regra(Set.of("perda_conexao"),
                    "Interferência ou antena danificada",
                    List.of("Inspecionar antenas", "Substituir o módulo de rádio"),
                    List.of()),
            new Regra(Set.of("sem_video"),
                    "Cabo flat ou câmera com defeito",
                    List.of("Reconectar/trocar o cabo flat", "Substituir a câmera"),
                    List.of()),
            new Regra(Set.of("autonomia_baixa"),
                    "Bateria degradada (fim de vida útil)",
                    List.of("Ciclar a bateria", "Substituir a bateria"),
                    List.of("BATERIA-6S")),
            new Regra(Set.of("led_erro"),
                    "Erro de firmware / controladora de voo",
                    List.of("Reinstalar o firmware", "Resetar a controladora de voo"),
                    List.of()));

    public List<Sintoma> sintomas() {
        return sintomas;
    }

    public List<Regra> regras() {
        return regras;
    }
}
