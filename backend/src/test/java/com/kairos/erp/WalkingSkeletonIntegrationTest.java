package com.kairos.erp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Prova a fatia vertical do núcleo (Fase 3):
 * empresa (tenant) → equipamento por Serial Number → item de estoque →
 * ordem de serviço → baixa automática do KSI → histórico vitalício.
 */
@SpringBootTest
@AutoConfigureMockMvc
class WalkingSkeletonIntegrationTest {

    private static final String TENANT_HEADER = "X-Tenant-Id";

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    private String criarEmpresa(String documento) throws Exception {
        MvcResult r = mvc.perform(post("/api/v1/empresas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Drones Kairós Ltda\",\"documento\":\"" + documento + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return body(r).get("id").asText();
    }

    @Test
    void fluxoCompletoDeServicoComBaixaAutomaticaEHistorico() throws Exception {
        String tenant = criarEmpresa("11.111.111/0001-11");

        // 1) Registrar equipamento por Serial Number
        MvcResult eq = mvc.perform(post("/api/v1/equipamentos")
                        .header(TENANT_HEADER, tenant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-DRONE-0001\",\"modelo\":\"KX-10\",\"fabricante\":\"Kairós\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ATIVO"))
                .andReturn();
        String equipamentoId = body(eq).get("id").asText();

        // 2) Criar item de estoque com saldo 10
        MvcResult item = mvc.perform(post("/api/v1/estoque/itens")
                        .header(TENANT_HEADER, tenant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"HELICE-9450\",\"descricao\":\"Hélice 9450\",\"saldoInicial\":10,\"pontoReposicao\":4}"))
                .andExpect(status().isCreated())
                .andReturn();
        String itemId = body(item).get("id").asText();

        // 3) Abrir OS para o equipamento
        MvcResult os = mvc.perform(post("/api/v1/ordens-servico")
                        .header(TENANT_HEADER, tenant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equipamentoId\":\"" + equipamentoId + "\",\"descricao\":\"Troca de hélices\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.numero").value("OS-000001"))
                .andExpect(jsonPath("$.status").value("ABERTA"))
                .andReturn();
        String osId = body(os).get("id").asText();

        // 4) Adicionar 3 unidades da peça à OS
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/itens")
                        .header(TENANT_HEADER, tenant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemId\":\"" + itemId + "\",\"quantidade\":3}"))
                .andExpect(status().isCreated());

        // 5) Concluir a OS -> baixa automática + evento no histórico
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/concluir")
                        .header(TENANT_HEADER, tenant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONCLUIDA"));

        // 6) Estoque baixou de 10 para 7
        mvc.perform(get("/api/v1/estoque/itens/" + itemId).header(TENANT_HEADER, tenant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").value(7));

        // 7) Histórico vitalício: REGISTRO + SERVICO
        mvc.perform(get("/api/v1/equipamentos/" + equipamentoId + "/historico").header(TENANT_HEADER, tenant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].tipo").value("REGISTRO"))
                .andExpect(jsonPath("$[1].tipo").value("SERVICO"));
    }

    @Test
    void concluirComSaldoInsuficienteFalhaESemBaixaParcial() throws Exception {
        String tenant = criarEmpresa("22.222.222/0001-22");

        String equipamentoId = body(mvc.perform(post("/api/v1/equipamentos")
                        .header(TENANT_HEADER, tenant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-DRONE-0002\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();

        String itemId = body(mvc.perform(post("/api/v1/estoque/itens")
                        .header(TENANT_HEADER, tenant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"BATERIA-6S\",\"descricao\":\"Bateria 6S\",\"saldoInicial\":2,\"pontoReposicao\":1}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();

        String osId = body(mvc.perform(post("/api/v1/ordens-servico")
                        .header(TENANT_HEADER, tenant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equipamentoId\":\"" + equipamentoId + "\",\"descricao\":\"Troca de bateria\"}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();

        // Solicita 5, mas só há 2 em estoque
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/itens")
                        .header(TENANT_HEADER, tenant)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemId\":\"" + itemId + "\",\"quantidade\":5}"))
                .andExpect(status().isCreated());

        // Conclusão falha com 409 (regra de negócio)
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/concluir")
                        .header(TENANT_HEADER, tenant))
                .andExpect(status().isConflict());

        // Rollback: saldo permanece 2 e OS não foi concluída
        mvc.perform(get("/api/v1/estoque/itens/" + itemId).header(TENANT_HEADER, tenant))
                .andExpect(jsonPath("$.saldo").value(2));
        mvc.perform(get("/api/v1/ordens-servico/" + osId).header(TENANT_HEADER, tenant))
                .andExpect(jsonPath("$.status").value("ABERTA"));
    }

    @Test
    void requisicaoSemTenantEhRejeitada() throws Exception {
        mvc.perform(get("/api/v1/equipamentos/qualquer-id"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void tenantInativoOuInexistenteEhProibido() throws Exception {
        mvc.perform(get("/api/v1/equipamentos/qualquer-id").header(TENANT_HEADER, "tenant-inexistente"))
                .andExpect(status().isForbidden());
    }
}
