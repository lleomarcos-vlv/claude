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

/**
 * Correções Conlor: abertura de chamados, fluxo com aprovações do administrativo
 * (inclusive Estágio 2 e reprovação), observações/sugestões com visibilidade ao
 * cliente, gestão de usuários (bloqueio/reativação/perfil), financeiro de peças e
 * relatório da IA preditiva.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ConlorCorrecoesTest {

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

    /** Criar Novo Chamado provisiona cliente + aeronave + OS na fila com protocolo. */
    @Test
    void chamadoProvisionaClienteAeronaveEOs() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.000.000/0001-00", "adm@chamado.com").bearer();

        MvcResult r = mvc.perform(post("/api/v1/chamados").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomeCliente\":\"Fazenda Aurora\",\"emailCliente\":\"aurora@cli.com\","
                                + "\"telefone\":\"62999990000\",\"serialNumber\":\"AGRAS-CH-1\","
                                + "\"modelo\":\"DJI Agras T40\",\"origem\":\"WhatsApp\",\"descricao\":\"Não liga\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("FILA_DE_ESPERA"))
                .andExpect(jsonPath("$.protocolo").isNotEmpty())
                .andExpect(jsonPath("$.clienteEmail").value("aurora@cli.com"))
                .andExpect(jsonPath("$.senhaGerada").isNotEmpty())
                .andExpect(jsonPath("$.clienteNovo").value(true))
                .andReturn();

        // O cliente provisionado consegue autenticar e vê o próprio chamado.
        String senha = body(r).get("senhaGerada").asText();
        String tokenCliente = "Bearer " + auth.login("aurora@cli.com", senha);
        mvc.perform(get("/api/v1/ordens-servico").header(HttpHeaders.AUTHORIZATION, tokenCliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /** Fluxo completo com aprovações: fila → orçamento → aprovação → Estágio 1 → Estágio 2. */
    @Test
    void fluxoComAprovacoesInclusiveEstagio2() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.100.000/0001-00", "adm2@chamado.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-FL-1\",\"modelo\":\"DJI Agras T40\"}"))
                .andExpect(status().isCreated()).andReturn());
        String p1 = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"P1\",\"descricao\":\"Peça 1\",\"saldoInicial\":10,"
                                + "\"pontoReposicao\":1,\"preco\":100,\"custo\":40}"))
                .andExpect(status().isCreated()).andReturn());
        String p2 = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"P2\",\"descricao\":\"Peça 2\",\"saldoInicial\":10,"
                                + "\"pontoReposicao\":1,\"preco\":300,\"custo\":150}"))
                .andExpect(status().isCreated()).andReturn());

        String os = auth.abrirOs(token, eq, "Chamado");

        // Reprovação: enviar e reprovar volta ao orçamento
        auth.iniciarOrcamento(token, os);
        auth.adicionarItem(token, os, p1, "1");
        auth.enviarAprovacao(token, os);
        estagio(os, token, "AGUARDANDO_APROVACAO");
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/reprovar").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
        estagio(os, token, "ORCAMENTO");

        // Reenvia, aprova e inicia a manutenção
        auth.enviarAprovacao(token, os);
        auth.aprovar(token, os);
        estagio(os, token, "APROVADO");
        auth.iniciarManutencao(token, os);
        estagio(os, token, "ESTAGIO_1");

        // Estágio 2: adiciona peça adicional, envia p/ aprovação, aprova e inicia
        auth.adicionarItem(token, os, p2, "1");
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/ir-estagio2").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
        estagio(os, token, "AGUARDANDO_APROVACAO_E2");
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/aprovar-estagio2").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/iniciar-estagio2").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
        estagio(os, token, "ESTAGIO_2");

        // Conclui (baixa as duas peças)
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/concluir").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
        estagio(os, token, "CONCLUIDA");

        // Linha do tempo do cliente reflete a conclusão
        mvc.perform(get("/api/v1/ordens-servico/" + os + "/timeline").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONCLUIDA"))
                .andExpect(jsonPath("$.progresso").value(100));
    }

    private void estagio(String os, String token, String esperado) throws Exception {
        mvc.perform(get("/api/v1/ordens-servico/" + os).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.status").value(esperado));
    }

    /** Poderes do administrativo: cancelar, reabrir e alterar estágio livremente. */
    @Test
    void adminCancelaReabreEAlteraEstagio() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.200.000/0001-00", "adm3@chamado.com").bearer();
        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-ADM-1\",\"modelo\":\"DJI Agras T20\"}"))
                .andExpect(status().isCreated()).andReturn());
        String os = auth.abrirOs(token, eq, "x");

        mvc.perform(post("/api/v1/ordens-servico/" + os + "/cancelar").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELADA"));
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/reabrir").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("FILA_DE_ESPERA"));
        // Alterar estágio exige motivo (fica na auditoria)
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/status").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ESTAGIO_1\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/ordens-servico/" + os + "/status").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ESTAGIO_1\",\"motivo\":\"correção manual\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ESTAGIO_1"));
    }

    /** Observações: cliente só enxerga as marcadas como visíveis a ele. */
    @Test
    void observacoesRespeitamVisibilidadeDoCliente() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.300.000/0001-00", "adm4@chamado.com").bearer();

        MvcResult ch = mvc.perform(post("/api/v1/chamados").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomeCliente\":\"Cliente Obs\",\"emailCliente\":\"obs@cli.com\","
                                + "\"serialNumber\":\"AGRAS-OBS-1\",\"modelo\":\"DJI Agras T20\",\"origem\":\"Site\"}"))
                .andExpect(status().isCreated()).andReturn();
        String osId = body(ch).get("ordemServicoId").asText();
        String senha = body(ch).get("senhaGerada").asText();

        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/observacoes").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"texto\":\"nota interna\",\"visivelCliente\":false}"))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/observacoes").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"texto\":\"iniciamos a higienização\",\"visivelCliente\":true}"))
                .andExpect(status().isCreated());

        // Admin vê as duas
        mvc.perform(get("/api/v1/ordens-servico/" + osId + "/observacoes").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.length()").value(2));

        // Cliente vê só a visível
        String tokenCli = "Bearer " + auth.login("obs@cli.com", senha);
        mvc.perform(get("/api/v1/ordens-servico/" + osId + "/observacoes").header(HttpHeaders.AUTHORIZATION, tokenCli))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].texto").value("iniciamos a higienização"));
    }

    /** Gestão de usuários: bloquear impede login; reativar restaura. */
    @Test
    void bloqueioImpedeLoginEReativaRestaura() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.400.000/0001-00", "adm5@chamado.com").bearer();

        String uid = id(mvc.perform(post("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Tec Um\",\"email\":\"tec@u.com\",\"senha\":\"senha-forte-1\","
                                + "\"perfil\":\"TECNICO\"}"))
                .andExpect(status().isCreated()).andReturn());

        // Bloqueia → login falha (401)
        mvc.perform(post("/api/v1/usuarios/" + uid + "/bloquear").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tec@u.com\",\"senha\":\"senha-forte-1\"}"))
                .andExpect(status().isUnauthorized());

        // Reativa → login volta a funcionar
        mvc.perform(post("/api/v1/usuarios/" + uid + "/reativar").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(true));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tec@u.com\",\"senha\":\"senha-forte-1\"}"))
                .andExpect(status().isOk());

        // Altera perfil e redefine senha
        mvc.perform(post("/api/v1/usuarios/" + uid).header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"perfil\":\"CLIENTE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.perfil").value("CLIENTE"));
        MvcResult reset = mvc.perform(post("/api/v1/usuarios/" + uid + "/redefinir-senha")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk()).andReturn();
        String novaSenha = body(reset).get("senha").asText();
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tec@u.com\",\"senha\":\"" + novaSenha + "\"}"))
                .andExpect(status().isOk());
    }

    /** Perfil inválido (FABRICANTE não existe mais) é rejeitado. */
    @Test
    void perfilForaDosTresEhRejeitado() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.500.000/0001-00", "adm6@chamado.com").bearer();
        mvc.perform(post("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"X\",\"email\":\"x@x.com\",\"senha\":\"senha-forte-1\","
                                + "\"perfil\":\"FABRICANTE\"}"))
                .andExpect(status().isConflict());
    }

    /** Financeiro de peças traz custo, venda, margem, lucro e volume vendido. */
    @Test
    void financeiroDePecasCalculaMargemELucro() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.600.000/0001-00", "adm7@chamado.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-FIN-1\",\"modelo\":\"DJI Agras T40\"}"))
                .andExpect(status().isCreated()).andReturn());
        String peca = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"MARGEM\",\"descricao\":\"Peça margem\",\"saldoInicial\":10,"
                                + "\"pontoReposicao\":1,\"preco\":100,\"custo\":60}"))
                .andExpect(status().isCreated()).andReturn());
        String os = auth.abrirOs(token, eq, "x");
        auth.concluirFluxo(token, os, peca, "2"); // vende 2 → lucro 2*(100-60)=80

        mvc.perform(get("/api/v1/financeiro/pecas").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lucroTotal").value(80.0))
                .andExpect(jsonPath("$.receitaTotal").value(200.0))
                .andExpect(jsonPath("$.pecas[0].sku").value("MARGEM"))
                .andExpect(jsonPath("$.pecas[0].margemUnitaria").value(40.0))
                .andExpect(jsonPath("$.pecas[0].volumeVendido").value(2));
    }

    /** Relatório da IA preditiva: JSON + exportação CSV. */
    @Test
    void relatorioIaGeraJsonECsv() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.700.000/0001-00", "adm8@chamado.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"AGRAS-IA-1\",\"modelo\":\"DJI Agras T20\"}"))
                .andExpect(status().isCreated()).andReturn());
        String peca = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"ANEL\",\"descricao\":\"Anel\",\"saldoInicial\":20,"
                                + "\"pontoReposicao\":1,\"preco\":50,\"custo\":20}"))
                .andExpect(status().isCreated()).andReturn());
        for (int i = 0; i < 2; i++) {
            String os = auth.abrirOs(token, eq, "m" + i);
            auth.concluirFluxo(token, os, peca, "1");
        }

        mvc.perform(get("/api/v1/kci/relatorio").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.osConcluidas").value(2))
                .andExpect(jsonPath("$.pecasMaisTrocadas[0].sku").value("ANEL"));

        MvcResult csv = mvc.perform(get("/api/v1/kci/relatorio.csv").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk()).andReturn();
        assertThat(csv.getResponse().getContentAsString()).contains("ANEL");
    }

    /** Relatório PDF da auditoria é gerado (assinatura %PDF). */
    @Test
    void auditoriaExportaPdf() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("30.800.000/0001-00", "adm9@chamado.com").bearer();
        MvcResult pdf = mvc.perform(get("/api/v1/auditoria/relatorio.pdf").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(r -> assertThat(r.getResponse().getContentType()).contains("application/pdf"))
                .andReturn();
        byte[] bytes = pdf.getResponse().getContentAsByteArray();
        assertThat(new String(bytes, 0, 4)).isEqualTo("%PDF");
    }
}
