package com.kairos.erp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Notificações in-app (etapa 051): geradas por eventos e marcáveis como lidas. */
@SpringBootTest
@AutoConfigureMockMvc
class NotificacaoTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private String id(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void concluirOsGeraNotificacoesEPodeMarcarComoLidas() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("51.000.000/0001-00", "admin@notif.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-NOT-1\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn());
        String item = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"HELICE\",\"descricao\":\"Hélice\",\"saldoInicial\":5,\"pontoReposicao\":4}"))
                .andExpect(status().isCreated()).andReturn());
        // Fluxo completo consumindo 2 (saldo 5 -> 3, abaixo do ponto 4)
        String os = auth.abrirOs(token, eq, "t");
        auth.concluirFluxo(token, os, item, "2");

        // Entre as notificações geradas: OS concluída e estoque baixo
        MvcResult r = mvc.perform(get("/api/v1/notificacoes").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.naoLidas", org.hamcrest.Matchers.greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.notificacoes[?(@.tipo=='OS_CONCLUIDA')]").exists())
                .andExpect(jsonPath("$.notificacoes[?(@.tipo=='ESTOQUE_BAIXO')]").exists())
                .andReturn();
        int antes = json.readTree(r.getResponse().getContentAsString()).get("naoLidas").asInt();
        JsonNode primeira = json.readTree(r.getResponse().getContentAsString()).get("notificacoes").get(0);

        // Marca uma como lida -> cai em 1
        mvc.perform(post("/api/v1/notificacoes/" + primeira.get("id").asText() + "/lida")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/notificacoes").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.naoLidas").value(antes - 1));

        // Marca todas -> zera
        mvc.perform(post("/api/v1/notificacoes/marcar-todas-lidas").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
        MvcResult z = mvc.perform(get("/api/v1/notificacoes").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk()).andReturn();
        assertThat(json.readTree(z.getResponse().getContentAsString()).get("naoLidas").asInt()).isZero();
    }
}
