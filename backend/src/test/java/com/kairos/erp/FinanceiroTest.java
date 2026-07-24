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

/** Financeiro (doc 18): lançamentos, pagamento e faturamento de OS. */
@SpringBootTest
@AutoConfigureMockMvc
class FinanceiroTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private String id(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void lancamentoPagamentoEResumo() throws Exception {
        String token = new AuthHelper(mvc, json).autenticar("18.000.000/0001-00", "admin@fin.com").bearer();

        String lanc = id(mvc.perform(post("/api/v1/financeiro/lancamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"RECEBER\",\"descricao\":\"Serviço\",\"valor\":1500,\"vencimento\":\"2026-12-31\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ABERTO"))
                .andReturn());

        mvc.perform(post("/api/v1/financeiro/lancamentos/" + lanc + "/pagar").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGO"));

        mvc.perform(get("/api/v1/financeiro/resumo").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recebido").value(1500.0));

        // Valor negativo -> 409
        mvc.perform(post("/api/v1/financeiro/lancamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"PAGAR\",\"descricao\":\"x\",\"valor\":-5}"))
                .andExpect(status().isConflict());
    }

    @Test
    void faturarSoOsConcluida() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("18.100.000/0001-00", "admin@fat.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-FIN-1\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn());
        String item = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"PECA-FIN\",\"descricao\":\"Peça\",\"saldoInicial\":10,\"pontoReposicao\":1}"))
                .andExpect(status().isCreated()).andReturn());
        String os = auth.abrirOs(token, eq, "t");

        // OS ainda na fila -> não fatura (409)
        mvc.perform(post("/api/v1/financeiro/faturar-os").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ordemServicoId\":\"" + os + "\",\"valor\":800}"))
                .andExpect(status().isConflict());

        auth.concluirFluxo(token, os, item, "1");

        // Concluída -> fatura (RECEBER com origem da OS)
        mvc.perform(post("/api/v1/financeiro/faturar-os").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ordemServicoId\":\"" + os + "\",\"valor\":800}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("RECEBER"))
                .andExpect(jsonPath("$.origem").value(org.hamcrest.Matchers.startsWith("OS:")));
    }
}
