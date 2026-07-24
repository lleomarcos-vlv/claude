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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Prova a fatia vertical do núcleo (Fase 3) já sob autenticação (etapa 036):
 * onboarding (empresa + admin) → login → equipamento por Serial Number →
 * item de estoque → ordem de serviço → baixa automática do KSI → histórico
 * vitalício. O tenant vem do token (claim), não de header.
 */
@SpringBootTest
@AutoConfigureMockMvc
class WalkingSkeletonIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void fluxoCompletoDeServicoComBaixaAutomaticaEHistorico() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("11.111.111/0001-11", "admin@drones-a.com").bearer();

        // 1) Registrar equipamento por Serial Number
        MvcResult eq = mvc.perform(post("/api/v1/equipamentos")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-DRONE-0001\",\"modelo\":\"KX-10\",\"fabricante\":\"Kairós\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ATIVO"))
                .andReturn();
        String equipamentoId = body(eq).get("id").asText();

        // 2) Criar item de estoque com saldo 10
        MvcResult item = mvc.perform(post("/api/v1/estoque/itens")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"HELICE-9450\",\"descricao\":\"Hélice 9450\",\"saldoInicial\":10,\"pontoReposicao\":4}"))
                .andExpect(status().isCreated())
                .andReturn();
        String itemId = body(item).get("id").asText();

        // 3) Abrir OS para o equipamento (entra na fila de espera)
        MvcResult os = mvc.perform(post("/api/v1/ordens-servico")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equipamentoId\":\"" + equipamentoId + "\",\"descricao\":\"Troca de hélices\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.numero").value("OS-000001"))
                .andExpect(jsonPath("$.status").value("FILA_DE_ESPERA"))
                .andReturn();
        String osId = body(os).get("id").asText();

        // 4-5) Fluxo por estágios com 3 peças e conclusão (baixa + histórico)
        auth.concluirFluxo(token, osId, itemId, "3");
        mvc.perform(get("/api/v1/ordens-servico/" + osId).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.status").value("CONCLUIDA"));

        // 6) Estoque baixou de 10 para 7
        mvc.perform(get("/api/v1/estoque/itens/" + itemId).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").value(7));

        // 7) Histórico vitalício: REGISTRO + SERVICO
        mvc.perform(get("/api/v1/equipamentos/" + equipamentoId + "/historico").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].tipo").value("REGISTRO"))
                .andExpect(jsonPath("$[1].tipo").value("SERVICO"));
    }

    @Test
    void concluirComSaldoInsuficienteFalhaESemBaixaParcial() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("22.222.222/0001-22", "admin@drones-b.com").bearer();

        String equipamentoId = body(mvc.perform(post("/api/v1/equipamentos")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-DRONE-0002\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();

        String itemId = body(mvc.perform(post("/api/v1/estoque/itens")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"BATERIA-6S\",\"descricao\":\"Bateria 6S\",\"saldoInicial\":2,\"pontoReposicao\":1}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();

        String osId = body(mvc.perform(post("/api/v1/ordens-servico")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equipamentoId\":\"" + equipamentoId + "\",\"descricao\":\"Troca de bateria\"}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();

        // Monta o orçamento solicitando 5 (só há 2 em estoque) e envia para aprovação
        auth.iniciarOrcamento(token, osId);
        auth.adicionarItem(token, osId, itemId, "5");
        auth.enviarAprovacao(token, osId);

        // A APROVAÇÃO tenta dar baixa e falha com 409 (saldo insuficiente)
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/aprovar")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isConflict());

        // Rollback: saldo permanece 2 e a OS segue aguardando aprovação
        mvc.perform(get("/api/v1/estoque/itens/" + itemId).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.saldo").value(2));
        mvc.perform(get("/api/v1/ordens-servico/" + osId).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.status").value("AGUARDANDO_APROVACAO"));
    }

    @Test
    void requisicaoSemTokenEhRejeitada() throws Exception {
        mvc.perform(get("/api/v1/equipamentos/qualquer-id"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenInvalidoEhRejeitado() throws Exception {
        mvc.perform(get("/api/v1/equipamentos/qualquer-id")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer token.invalido.aqui"))
                .andExpect(status().isUnauthorized());
    }
}
