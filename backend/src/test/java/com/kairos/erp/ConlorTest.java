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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Especificação Conlor Drones: agendamento autônomo + gestão de leads,
 * orçamento automatizado (valor calculado, PDF e WhatsApp) e IA preditiva
 * (sugestões ativas por correlação de peças + problemas crônicos por modelo).
 */
@SpringBootTest
@AutoConfigureMockMvc
class ConlorTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private String id(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    /** Cliente agenda em tempo real; gerência confirma e nasce a OS na Fila de Espera. */
    @Test
    void agendamentoAutonomoGeraOsNaFilaDeEspera() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("90.000.000/0001-00", "adm@conlor.com").bearer();

        String futuro = LocalDateTime.now().plusDays(2).withNano(0)
                .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        // Cliente solicita informando S/N + modelo + nome (RF do PDF)
        MvcResult sol = mvc.perform(post("/api/v1/agendamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomeCliente\":\"Fazenda Boa Vista\",\"telefone\":\"+55 62 99999-0000\","
                                + "\"serialNumber\":\"AGRAS-T40-777\",\"modelo\":\"DJI Agras T40\","
                                + "\"dataHora\":\"" + futuro + "\",\"observacao\":\"Revisão de safra\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SOLICITADO"))
                .andReturn();
        String agId = id(sol);

        // Agenda em tempo real do dia mostra o horário tomado
        String dia = futuro.substring(0, 10);
        mvc.perform(get("/api/v1/agendamentos/agenda?data=" + dia).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.serialNumber=='AGRAS-T40-777')]").exists());

        // Gerência confirma o lead -> registra aeronave + abre OS na Fila de Espera
        MvcResult conf = mvc.perform(post("/api/v1/agendamentos/" + agId + "/confirmar")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMADO"))
                .andReturn();
        String osId = body(conf).get("ordemServicoId").asText();
        assertThat(osId).isNotBlank();

        mvc.perform(get("/api/v1/ordens-servico/" + osId).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FILA_DE_ESPERA"));
    }

    /** Orçamento automatizado: valor calculado das peças + PDF + link WhatsApp. */
    @Test
    void orcamentoCalculaValorGeraPdfEWhatsApp() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("90.100.000/0001-00", "adm2@conlor.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-T20-1\",\"modelo\":\"DJI Agras T20\"}"))
                .andExpect(status().isCreated()).andReturn());

        // Peças precificadas no estoque (preço vinculado ao gerador de orçamento)
        String helice = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"HELICE-54\",\"descricao\":\"Hélice 54\",\"saldoInicial\":10,"
                                + "\"pontoReposicao\":2,\"preco\":250.00}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.preco").value(250.00))
                .andReturn());

        String os = auth.abrirOs(token, eq, "Troca de hélices");
        auth.iniciarOrcamento(token, os);
        auth.adicionarItem(token, os, helice, "4"); // 4 x 250 = 1000

        // Orçamento consolidado com valor calculado
        mvc.perform(get("/api/v1/ordens-servico/" + os + "/orcamento").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modelo").value("DJI Agras T20"))
                .andExpect(jsonPath("$.linhas[0].sku").value("HELICE-54"))
                .andExpect(jsonPath("$.linhas[0].precoUnitario").value(250.00))
                .andExpect(jsonPath("$.total").value(1000.00))
                .andExpect(jsonPath("$.totalAdicionais").value(0));

        // PDF automático (application/pdf, com assinatura %PDF)
        MvcResult pdf = mvc.perform(get("/api/v1/ordens-servico/" + os + "/orcamento.pdf")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(r -> assertThat(r.getResponse().getContentType()).contains("application/pdf"))
                .andReturn();
        byte[] bytes = pdf.getResponse().getContentAsByteArray();
        assertThat(new String(bytes, 0, 4)).isEqualTo("%PDF");

        // Link de WhatsApp pronto para envio ao telefone do cliente
        mvc.perform(get("/api/v1/ordens-servico/" + os + "/whatsapp?telefone=5562999990000")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.startsWith("https://wa.me/5562999990000")));
    }

    /**
     * Segunda aprovação: peça eletrônica descoberta no Estágio 1 entra como
     * adicional destacado e recompõe o total do orçamento.
     */
    @Test
    void adicionaisDoEstagio1EntramComoSegundaAprovacao() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("90.200.000/0001-00", "adm3@conlor.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-T40-9\",\"modelo\":\"DJI Agras T40\"}"))
                .andExpect(status().isCreated()).andReturn());
        String helice = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"HELICE-54\",\"descricao\":\"Hélice\",\"saldoInicial\":10,"
                                + "\"pontoReposicao\":2,\"preco\":200.00}"))
                .andExpect(status().isCreated()).andReturn());
        String radar = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"RADAR-OMNI\",\"descricao\":\"Radar\",\"saldoInicial\":5,"
                                + "\"pontoReposicao\":1,\"preco\":900.00}"))
                .andExpect(status().isCreated()).andReturn());

        String os = auth.abrirOs(token, eq, "Queda");
        auth.iniciarOrcamento(token, os);
        auth.adicionarItem(token, os, helice, "2");   // escopo inicial: 2 x 200 = 400
        auth.enviarAprovacao(token, os);
        auth.aprovar(token, os);
        auth.iniciarManutencao(token, os);            // ESTAGIO_1
        // Estágio 1: diagnóstico revela problema eletrônico -> adiciona radar (adicional)
        auth.adicionarItem(token, os, radar, "1");    // adicional: 1 x 900 = 900

        mvc.perform(get("/api/v1/ordens-servico/" + os + "/orcamento").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalInicial").value(400.00))
                .andExpect(jsonPath("$.totalAdicionais").value(900.00))
                .andExpect(jsonPath("$.total").value(1300.00))
                .andExpect(jsonPath("$.linhas[?(@.adicional==true)].sku").value("RADAR-OMNI"));
    }

    /** IA preditiva — sugestões ativas: hélice + eixo do braço → padrão "Queda". */
    @Test
    void sugestoesAtivasInferemPadraoDeQueda() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("90.300.000/0001-00", "adm4@conlor.com").bearer();

        mvc.perform(post("/api/v1/kci/sugestoes").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pecas\":[\"HELICE-54 Hélice de carbono\",\"EIXO-BRACO Eixo do braço\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.padrao=='Queda')]").exists())
                .andExpect(jsonPath("$[?(@.padrao=='Queda')].verificar[*]",
                        org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("Radares"))));
    }

    /** IA preditiva — problemas crônicos: modelo com histórico recorrente de uma peça. */
    @Test
    void problemasCronicosMapeiamPecaRecorrentePorModelo() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("90.400.000/0001-00", "adm5@conlor.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-T20-CRON\",\"modelo\":\"DJI Agras T20\"}"))
                .andExpect(status().isCreated()).andReturn());
        String anel = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"ANEL-BOMBA\",\"descricao\":\"Anel da bomba\",\"saldoInicial\":20,"
                                + "\"pontoReposicao\":4,\"preco\":45.00}"))
                .andExpect(status().isCreated()).andReturn());

        // Três manutenções concluídas consumindo o anel da bomba
        for (int i = 0; i < 3; i++) {
            String os = auth.abrirOs(token, eq, "Manutenção " + i);
            auth.concluirFluxo(token, os, anel, "1");
        }

        mvc.perform(get("/api/v1/kci/cronicos").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].modelo").value("DJI Agras T20"))
                .andExpect(jsonPath("$[0].manutencoes").value(3))
                .andExpect(jsonPath("$[0].pecaMaisRecorrente").value("ANEL-BOMBA"));
    }
}
