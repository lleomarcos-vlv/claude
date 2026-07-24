package com.kairos.erp.document.web;

import com.kairos.erp.document.app.DocumentoService;
import com.kairos.erp.document.domain.Documento;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/** Documentos anexados a equipamentos (etapa 052): upload, lista e download. */
@RestController
public class DocumentoController {

    private final DocumentoService service;

    public DocumentoController(DocumentoService service) {
        this.service = service;
    }

    public record DocumentoResponse(String id, String nome, String tipoConteudo,
                                    long tamanho, LocalDateTime criadoEm) {
        static DocumentoResponse of(Documento d) {
            return new DocumentoResponse(d.getId(), d.getNome(), d.getTipoConteudo(),
                    d.getTamanho(), d.getCriadoEm());
        }
    }

    @PostMapping("/api/v1/equipamentos/{id}/documentos")
    public ResponseEntity<DocumentoResponse> anexar(@PathVariable String id,
                                                    @RequestParam("arquivo") MultipartFile arquivo)
            throws IOException {
        String nome = arquivo.getOriginalFilename() == null ? "arquivo" : arquivo.getOriginalFilename();
        Documento d = service.anexar(id, nome, arquivo.getContentType(), arquivo.getBytes());
        return ResponseEntity.status(HttpStatus.CREATED).body(DocumentoResponse.of(d));
    }

    @GetMapping("/api/v1/equipamentos/{id}/documentos")
    public List<DocumentoResponse> listar(@PathVariable String id) {
        return service.listar(id).stream().map(DocumentoResponse::of).toList();
    }

    @GetMapping("/api/v1/documentos/{id}/download")
    public ResponseEntity<Resource> baixar(@PathVariable String id) {
        Documento d = service.baixar(id);
        ByteArrayResource corpo = new ByteArrayResource(service.conteudo(d));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(d.getNome()).build().toString())
                .contentType(MediaType.parseMediaType(d.getTipoConteudo()))
                .contentLength(d.getTamanho())
                .body(corpo);
    }
}
