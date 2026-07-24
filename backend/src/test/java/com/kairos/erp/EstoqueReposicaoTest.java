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

/** Cobre o loop de estoque do KSI: entrada eleva saldo; reposição sinaliza ponto de pedido. */
@SpringBootTest
@AutoConfigureMockMvc
class EstoqueReposicaoTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void entradaElevaSaldoEReposicaoListaItemAbaixoDoPonto() throws Exception {
        String token = new AuthHelper(mvc, json).autenticar("33.333.333/0001-33", "admin@ksi-a.com").bearer();

        // Item com saldo 3 e ponto de reposição 5 -> já precisa repor
        String itemId = body(mvc.perform(post("/api/v1/estoque/itens")
                        .header(HttpHeaders.AUTHORIZATION, token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"MOTOR-2207\",\"descricao\":\"Motor 2207\",\"saldoInicial\":3,\"pontoReposicao\":5}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.precisaRepor").value(true))
                .andReturn()).get("id").asText();

        // Aparece na lista de reposição
        mvc.perform(get("/api/v1/estoque/itens/reposicao").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sku").value("MOTOR-2207"));

        // Entrada de 10 -> saldo 13, acima do ponto
        mvc.perform(post("/api/v1/estoque/itens/" + itemId + "/entradas")
                        .header(HttpHeaders.AUTHORIZATION, token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantidade\":10,\"origem\":\"COMPRA-001\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").value(13))
                .andExpect(jsonPath("$.precisaRepor").value(false));

        // Reposição agora vazia
        mvc.perform(get("/api/v1/estoque/itens/reposicao").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void listagemIsolaPorTenant() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String tokenA = auth.autenticar("44.444.444/0001-44", "admin@ksi-x.com").bearer();
        String tokenB = auth.autenticar("55.555.555/0001-55", "admin@ksi-y.com").bearer();

        mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sku\":\"X\",\"descricao\":\"X\",\"saldoInicial\":1,\"pontoReposicao\":0}"))
                .andExpect(status().isCreated());

        // Tenant B não enxerga itens do tenant A
        mvc.perform(get("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
