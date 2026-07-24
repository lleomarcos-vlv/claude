package com.kairos.erp.kci.app;

import com.kairos.erp.kci.app.BaseConhecimentoKci.Regra;
import com.kairos.erp.kci.app.BaseConhecimentoKci.Sintoma;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Motor de diagnóstico do KCI: casa os sintomas informados contra a base de
 * conhecimento e devolve as causas prováveis, ordenadas por confiança, com as
 * ações recomendadas e as peças sugeridas. Determinístico e offline.
 */
@Service
public class DiagnosticoService {

    private final BaseConhecimentoKci base;

    public DiagnosticoService(BaseConhecimentoKci base) {
        this.base = base;
    }

    /** Uma hipótese de diagnóstico com confiança de 0 a 100. */
    public record Diagnostico(String causa, int confianca, List<String> acoes, List<String> pecasSugeridas) {
    }

    public List<Sintoma> sintomasConhecidos() {
        return base.sintomas();
    }

    public List<Diagnostico> diagnosticar(List<String> sintomasInformados) {
        Set<String> informados = sintomasInformados == null ? Set.of()
                : sintomasInformados.stream()
                        .filter(s -> s != null && !s.isBlank())
                        .map(s -> s.trim().toLowerCase())
                        .collect(Collectors.toSet());

        List<Diagnostico> hipoteses = new ArrayList<>();
        for (Regra regra : base.regras()) {
            long casados = regra.sintomas().stream().filter(informados::contains).count();
            if (casados == 0) {
                continue;
            }
            int confianca = (int) Math.round(100.0 * casados / regra.sintomas().size());
            hipoteses.add(new Diagnostico(regra.causa(), confianca, regra.acoes(), regra.pecas()));
        }
        // Mais confiantes primeiro; empate resolvido por mais sintomas explicados.
        hipoteses.sort(Comparator.comparingInt(Diagnostico::confianca).reversed()
                .thenComparing(d -> -d.acoes().size()));
        return hipoteses;
    }
}
