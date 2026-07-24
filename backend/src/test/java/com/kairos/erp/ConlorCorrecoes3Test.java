package com.kairos.erp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Terceira leva: OS com nomes (cliente/técnico/aeronave), diagnóstico obrigatório,
 * importação de peças por planilha e base/sugestões da IA.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ConlorCorrecoes3Test {

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

    /** A OS traz os nomes resolvidos (cliente, aeronave) para o técnico ver. */
    @Test
    void osTrazNomesResolvidos() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("50.000.000/0001-00", "adm@c3.com").bearer();
        MvcResult ch = mvc.perform(post("/api/v1/chamados").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomeCliente\":\"Fazenda Nomes\",\"emailCliente\":\"nomes@cli.com\","
                                + "\"serialNumber\":\"AGRAS-N-1\",\"modelo\":\"DJI Agras T50\",\"origem\":\"Pessoalmente\"}"))
                .andExpect(status().isCreated()).andReturn();
        String osId = body(ch).get("ordemServicoId").asText();
        mvc.perform(get("/api/v1/ordens-servico/" + osId).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clienteNome").value("Fazenda Nomes"))
                .andExpect(jsonPath("$.equipamentoSerial").value("AGRAS-N-1"))
                .andExpect(jsonPath("$.equipamentoModelo").value("DJI Agras T50"))
                .andExpect(jsonPath("$.origem").value("Pessoalmente"));
    }

    /** Enviar orçamento sem diagnóstico é bloqueado (409). */
    @Test
    void diagnosticoObrigatorioParaEnviar() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("50.100.000/0001-00", "adm@c3b.com").bearer();
        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-DG-1\",\"modelo\":\"DJI Agras T40\"}"))
                .andExpect(status().isCreated()).andReturn());
        String item = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"DG\",\"descricao\":\"x\",\"saldoInicial\":5,\"pontoReposicao\":1,\"preco\":10}"))
                .andExpect(status().isCreated()).andReturn());
        String os = auth.abrirOs(token, eq, "x");
        auth.iniciarOrcamento(token, os);
        auth.adicionarItem(token, os, item, "1");
        // sem diagnóstico -> 409
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/enviar-aprovacao").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isConflict());
        // com diagnóstico -> ok
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/orcamento-info").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"diagnostico\":\"Motor com ruído\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/enviar-aprovacao").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("AGUARDANDO_APROVACAO"));
    }

    /** Técnico não consegue publicar observação visível ao cliente. */
    @Test
    void tecnicoNaoPublicaObsAoCliente() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("50.200.000/0001-00", "adm@c3c.com").bearer();
        mvc.perform(post("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Tec\",\"email\":\"tec@c3c.com\",\"senha\":\"senha-forte-1\",\"perfil\":\"TECNICO\"}"))
                .andExpect(status().isCreated());
        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-OB-1\",\"modelo\":\"DJI Agras T20\"}"))
                .andExpect(status().isCreated()).andReturn());
        String os = auth.abrirOs(token, eq, "x");
        String tokenTec = "Bearer " + auth.login("tec@c3c.com", "senha-forte-1");
        // técnico tenta marcar visível ao cliente -> é gravada como interna (visivelCliente=false)
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/observacoes").header(HttpHeaders.AUTHORIZATION, tokenTec)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"texto\":\"nota\",\"visivelCliente\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.visivelCliente").value(false));
    }

    /** Importar peças por planilha CSV cria e atualiza itens. */
    @Test
    void importarPecasPorPlanilha() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("50.300.000/0001-00", "adm@c3d.com").bearer();
        String csv = "sku;descricao;quantidade;custo;preco;fornecedor\n"
                + "HELICE-0420;Helice 0420;8;120;250;DJI Store\n"
                + "BICO-XR;Bico XR;30;15;40;AgroPecas\n";
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "pecas.csv", "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));
        mvc.perform(multipart("/api/v1/estoque/itens/importar").file(arquivo)
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.criados").value(2));
        mvc.perform(get("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$[?(@.sku=='HELICE-0420')].saldo").value(8.0))
                .andExpect(jsonPath("$[?(@.sku=='HELICE-0420')].fornecedor").value("DJI Store"));
    }

    /** IA: importar base de conhecimento + gerar sugestões ao fabricante. */
    @Test
    void baseIaEImportacaoESugestaoFabricante() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("50.400.000/0001-00", "adm@c3e.com").bearer();

        String csv = "problema;causa;comoResolver;sugestao\n"
                + "Motor superaquece;Rolamento gasto;Trocar rolamento;Revisar lubrificação\n";
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "base.csv", "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));
        mvc.perform(multipart("/api/v1/kci/base/importar").file(arquivo).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.importados").value(1));
        mvc.perform(get("/api/v1/kci/base").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$[0].problema").value("Motor superaquece"));

        // Cria histórico crônico (2 manutenções do mesmo anel no T20) e checa sugestão ao fabricante
        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-FB-1\",\"modelo\":\"DJI Agras T20\"}"))
                .andExpect(status().isCreated()).andReturn());
        String anel = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"ANEL-FB\",\"descricao\":\"Anel\",\"saldoInicial\":20,\"pontoReposicao\":1,\"preco\":50}"))
                .andExpect(status().isCreated()).andReturn());
        for (int i = 0; i < 2; i++) {
            String os = auth.abrirOs(token, eq, "m" + i);
            auth.concluirFluxo(token, os, anel, "1");
        }
        mvc.perform(get("/api/v1/kci/sugestoes-fabricante").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].modelo").value("DJI Agras T20"))
                .andExpect(jsonPath("$[0].peca").value("ANEL-FB"));
    }
}
