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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Segunda leva de correções: baixa de estoque na aprovação, chamado visível ao
 * técnico (fila não distribuída), fornecedor na reposição e login DEV com
 * geração de PDF de solicitações de alteração.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ConlorCorrecoes2Test {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    private String id(MvcResult r) throws Exception {
        return body(r).get("id").asText();
    }

    /** A baixa no estoque ocorre na APROVAÇÃO do orçamento (não na conclusão). */
    @Test
    void baixaDeEstoqueOcorreNaAprovacao() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("40.000.000/0001-00", "adm@c2.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-B-1\",\"modelo\":\"DJI Agras T40\"}"))
                .andExpect(status().isCreated()).andReturn());
        String item = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"BX\",\"descricao\":\"Baixa\",\"saldoInicial\":10,"
                                + "\"pontoReposicao\":1,\"preco\":100,\"custo\":40}"))
                .andExpect(status().isCreated()).andReturn());

        String os = auth.abrirOs(token, eq, "x");
        auth.iniciarOrcamento(token, os);
        auth.adicionarItem(token, os, item, "3");
        auth.enviarAprovacao(token, os);

        // Antes de aprovar: saldo intacto (10)
        mvc.perform(get("/api/v1/estoque/itens/" + item).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.saldo").value(10));

        auth.aprovar(token, os);

        // Depois de aprovar: já baixou (7) e há movimentação de SAIDA
        mvc.perform(get("/api/v1/estoque/itens/" + item).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.saldo").value(7));
        mvc.perform(get("/api/v1/estoque/itens/" + item + "/movimentacoes").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$[?(@.tipo=='SAIDA')]").exists());
    }

    /** Um chamado aberto pelo ADM aparece para o técnico (OS ainda na fila). */
    @Test
    void chamadoApareceParaOTecnico() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("40.100.000/0001-00", "adm@c2b.com").bearer();

        // Cria um técnico e abre um chamado (OS não distribuída)
        mvc.perform(post("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Tec\",\"email\":\"tec@c2b.com\",\"senha\":\"senha-forte-1\","
                                + "\"perfil\":\"TECNICO\"}"))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/chamados").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomeCliente\":\"Cli\",\"emailCliente\":\"cli@c2b.com\","
                                + "\"serialNumber\":\"AGRAS-TEC-1\",\"modelo\":\"DJI Agras T20\",\"origem\":\"Telefone\"}"))
                .andExpect(status().isCreated());

        // O técnico enxerga a OS da fila e consegue iniciar o orçamento
        String tokenTec = "Bearer " + auth.login("tec@c2b.com", "senha-forte-1");
        MvcResult lista = mvc.perform(get("/api/v1/ordens-servico").header(HttpHeaders.AUTHORIZATION, tokenTec))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("FILA_DE_ESPERA"))
                .andReturn();
        String osId = body(lista).get(0).get("id").asText();
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/iniciar-orcamento")
                        .header(HttpHeaders.AUTHORIZATION, tokenTec))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ORCAMENTO"));
    }

    /** A reposição traz o fornecedor sugerido para o pedido. */
    @Test
    void reposicaoTrazFornecedor() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("40.200.000/0001-00", "adm@c2c.com").bearer();
        mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"REP\",\"descricao\":\"Repor\",\"saldoInicial\":3,"
                                + "\"pontoReposicao\":5,\"preco\":10,\"custo\":4,\"fornecedor\":\"AgroPeças Ltda\"}"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/estoque/itens/reposicao").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.sku=='REP')].fornecedor").value("AgroPeças Ltda"));
    }

    /** Peças do orçamento: adicionar aparece na lista, editar quantidade e excluir. */
    @Test
    void editarERemoverPecasDoOrcamento() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("40.400.000/0001-00", "adm@c2e.com").bearer();
        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-ED-1\",\"modelo\":\"DJI Agras T40\"}"))
                .andExpect(status().isCreated()).andReturn());
        String item = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"ED\",\"descricao\":\"Editar\",\"saldoInicial\":20,"
                                + "\"pontoReposicao\":1,\"preco\":100,\"custo\":40}"))
                .andExpect(status().isCreated()).andReturn());
        String os = auth.abrirOs(token, eq, "x");
        auth.iniciarOrcamento(token, os);
        auth.adicionarItem(token, os, item, "2");

        // A peça aparece na lista do orçamento
        MvcResult orc = mvc.perform(get("/api/v1/ordens-servico/" + os + "/orcamento").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linhas.length()").value(1))
                .andExpect(jsonPath("$.linhas[0].quantidade").value(2))
                .andExpect(jsonPath("$.total").value(200.00))
                .andReturn();
        String linhaId = body(orc).get("linhas").get(0).get("id").asText();

        // Editar a quantidade -> 5
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/itens/" + linhaId).header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"quantidade\":5}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/ordens-servico/" + os + "/orcamento").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.linhas[0].quantidade").value(5))
                .andExpect(jsonPath("$.total").value(500.00));

        // Excluir a peça -> lista vazia
        mvc.perform(delete("/api/v1/ordens-servico/" + os + "/itens/" + linhaId).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/ordens-servico/" + os + "/orcamento").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.linhas.length()").value(0));
    }

    /** Login DEV: acessa telas de ADMIN e gera o PDF de solicitações de alteração. */
    @Test
    void devAcessaComoAdminEGeraPdf() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("40.300.000/0001-00", "adm@c2d.com").bearer();
        mvc.perform(post("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Dev\",\"email\":\"dev@c2d.com\",\"senha\":\"senha-forte-1\","
                                + "\"perfil\":\"DEV\"}"))
                .andExpect(status().isCreated());
        String tokenDev = "Bearer " + auth.login("dev@c2d.com", "senha-forte-1");

        // DEV enxerga endpoints de ADMIN (papel ADMIN embutido)
        mvc.perform(get("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, tokenDev))
                .andExpect(status().isOk());

        // DEV gera o PDF das solicitações de alteração
        MvcResult pdf = mvc.perform(post("/api/v1/dev/solicitacoes.pdf").header(HttpHeaders.AUTHORIZATION, tokenDev)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Ajustes\",\"itens\":[{\"tela\":\"Estoque\",\"campo\":\"fonte\","
                                + "\"alteracao\":\"aumentar tamanho da letra\"}]}"))
                .andExpect(status().isOk())
                .andExpect(r -> assertThat(r.getResponse().getContentType()).contains("application/pdf"))
                .andReturn();
        assertThat(new String(pdf.getResponse().getContentAsByteArray(), 0, 4)).isEqualTo("%PDF");
    }
}
