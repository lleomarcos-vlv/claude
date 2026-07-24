package com.kairos.erp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** KCI: diagnóstico por regras (offline) e integração com a OS (061-067). */
@SpringBootTest
@AutoConfigureMockMvc
class KciDiagnosticoTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private String id(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void motorDeDiagnosticoSugereCausaProvavel() throws Exception {
        String token = new AuthHelper(mvc, json).autenticar("61.500.000/0001-00", "admin@kci.com").bearer();

        // Catálogo de sintomas disponível
        mvc.perform(get("/api/v1/kci/sintomas").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.tag=='vibracao')]").exists());

        // Vibração + ruído -> hélice desbalanceada (confiança 100%)
        mvc.perform(post("/api/v1/kci/diagnostico").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sintomas\":[\"vibracao\",\"ruido\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].causa").value(org.hamcrest.Matchers.containsString("Hélice")))
                .andExpect(jsonPath("$[0].confianca").value(100))
                .andExpect(jsonPath("$[0].pecasSugeridas[0]").value("HELICE-9450"));
    }

    @Test
    void diagnosticoNaOsRegistraEventoNoHistorico() throws Exception {
        String token = new AuthHelper(mvc, json).autenticar("61.600.000/0001-00", "admin@kci2.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-KCI-1\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn());
        String os = id(mvc.perform(post("/api/v1/ordens-servico").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equipamentoId\":\"" + eq + "\",\"descricao\":\"vibração\"}"))
                .andExpect(status().isCreated()).andReturn());

        mvc.perform(post("/api/v1/ordens-servico/" + os + "/diagnostico").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sintomas\":[\"vibracao\",\"ruido\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].confianca").value(100));

        // O diagnóstico virou evento no histórico vitalício do equipamento
        mvc.perform(get("/api/v1/equipamentos/" + eq + "/historico").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.tipo=='DIAGNOSTICO')]").exists());
    }
}
