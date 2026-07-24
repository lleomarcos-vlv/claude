package com.kairos.erp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Apoio de testes para o fluxo de autenticação: registra empresa + admin e faz
 * login, devolvendo o token e o tenant para uso nas requisições protegidas.
 */
final class AuthHelper {

    static final String SENHA_PADRAO = "senha-forte-123";

    private final MockMvc mvc;
    private final ObjectMapper json;

    AuthHelper(MockMvc mvc, ObjectMapper json) {
        this.mvc = mvc;
        this.json = json;
    }

    record Sessao(String tenantId, String email, String token) {
        /** Valor pronto para o header {@code Authorization}. */
        String bearer() {
            return "Bearer " + token;
        }
    }

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    /** Cria empresa + usuário ADMIN. Devolve o id da empresa (tenant). */
    String registrarEmpresa(String documento, String email) throws Exception {
        MvcResult r = mvc.perform(post("/api/v1/empresas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Kairós","documento":"%s",
                                 "admin":{"nome":"Admin","email":"%s","senha":"%s"}}
                                """.formatted(documento, email, SENHA_PADRAO)))
                .andExpect(status().isCreated())
                .andReturn();
        return body(r).get("id").asText();
    }

    String login(String email, String senha) throws Exception {
        MvcResult r = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"senha\":\"%s\"}".formatted(email, senha)))
                .andExpect(status().isOk())
                .andReturn();
        return body(r).get("token").asText();
    }

    /** Onboarding completo: registra a empresa e já devolve uma sessão autenticada do ADMIN. */
    Sessao autenticar(String documento, String email) throws Exception {
        String tenantId = registrarEmpresa(documento, email);
        String token = login(email, SENHA_PADRAO);
        return new Sessao(tenantId, email, token);
    }

    // --- Apoio ao fluxo da OS por estágios (Conlor) -------------------------

    /** Abre uma OS e devolve o id. */
    String abrirOs(String token, String equipamentoId, String descricao) throws Exception {
        MvcResult r = mvc.perform(post("/api/v1/ordens-servico").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equipamentoId\":\"%s\",\"descricao\":\"%s\"}".formatted(equipamentoId, descricao)))
                .andExpect(status().isCreated())
                .andReturn();
        return body(r).get("id").asText();
    }

    void iniciarOrcamento(String token, String osId) throws Exception {
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/iniciar-orcamento")
                .header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isOk());
    }

    void adicionarItem(String token, String osId, String itemId, String qtd) throws Exception {
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemId\":\"%s\",\"quantidade\":%s}".formatted(itemId, qtd)))
                .andExpect(status().isCreated());
    }

    void enviarAprovacao(String token, String osId) throws Exception {
        // O diagnóstico é obrigatório para enviar o orçamento.
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/orcamento-info")
                        .header(HttpHeaders.AUTHORIZATION, token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"diagnostico\":\"Diagnóstico de teste\",\"maoDeObra\":0}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/enviar-aprovacao")
                .header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isOk());
    }

    void aprovar(String token, String osId) throws Exception {
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/aprovar")
                .header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isOk());
    }

    void iniciarManutencao(String token, String osId) throws Exception {
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/iniciar-manutencao")
                .header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isOk());
    }

    /**
     * Percorre todo o fluxo de uma OS já aberta até CONCLUIDA, consumindo a peça
     * informada: iniciar-orçamento → item → enviar → aprovar → iniciar manutenção → concluir.
     */
    void concluirFluxo(String token, String osId, String itemId, String qtd) throws Exception {
        iniciarOrcamento(token, osId);
        adicionarItem(token, osId, itemId, qtd);
        enviarAprovacao(token, osId);
        aprovar(token, osId);
        iniciarManutencao(token, osId);
        mvc.perform(post("/api/v1/ordens-servico/" + osId + "/concluir")
                .header(HttpHeaders.AUTHORIZATION, token)).andExpect(status().isOk());
    }
}
