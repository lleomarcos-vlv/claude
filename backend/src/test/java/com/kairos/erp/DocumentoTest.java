package com.kairos.erp;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Documentos anexados a equipamentos (etapa 052): upload, lista e download. */
@SpringBootTest
@AutoConfigureMockMvc
class DocumentoTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    @Test
    void anexaListaEBaixaDocumentoRegistrandoNoHistorico() throws Exception {
        String token = new AuthHelper(mvc, json).autenticar("52.000.000/0001-00", "admin@doc.com").bearer();

        String eq = json.readTree(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-DOC-1\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn()
                .getResponse().getContentAsString()).get("id").asText();

        byte[] conteudo = "nota fiscal 12345".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "nota.txt", "text/plain", conteudo);

        String docId = json.readTree(mvc.perform(multipart("/api/v1/equipamentos/" + eq + "/documentos")
                        .file(arquivo).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("nota.txt"))
                .andExpect(jsonPath("$.tamanho").value(conteudo.length))
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        // Lista traz o documento
        mvc.perform(get("/api/v1/equipamentos/" + eq + "/documentos").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nome").value("nota.txt"));

        // Download devolve o conteúdo original
        MvcResult down = mvc.perform(get("/api/v1/documentos/" + docId + "/download").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(down.getResponse().getContentAsByteArray()).isEqualTo(conteudo);

        // O anexo virou evento no histórico vitalício
        mvc.perform(get("/api/v1/equipamentos/" + eq + "/historico").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$[?(@.tipo=='DOCUMENTO')]").exists());
    }
}
