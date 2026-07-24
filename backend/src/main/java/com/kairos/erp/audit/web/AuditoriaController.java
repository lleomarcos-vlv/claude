package com.kairos.erp.audit.web;

import com.kairos.erp.audit.app.AuditoriaPdfService;
import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.audit.domain.EventoAuditoria;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Consulta e exportação da trilha de auditoria do tenant. Privativo do ADMIN.
 * A trilha é imutável (append-only): não há endpoints de edição ou exclusão.
 */
@RestController
@RequestMapping("/api/v1/auditoria")
public class AuditoriaController {

    private final AuditoriaService service;
    private final AuditoriaPdfService pdf;

    public AuditoriaController(AuditoriaService service, AuditoriaPdfService pdf) {
        this.service = service;
        this.pdf = pdf;
    }

    public record EventoResponse(String usuarioEmail, String usuarioNome, String acao, String recursoTipo,
                                 String recursoId, String detalhe, String ip, String tela,
                                 LocalDateTime ocorridoEm) {
        static EventoResponse of(EventoAuditoria e) {
            return new EventoResponse(e.getUsuarioEmail(), e.getUsuarioNome(), e.getAcao(), e.getRecursoTipo(),
                    e.getRecursoId(), e.getDetalhe(), e.getIp(), e.getTela(), e.getOcorridoEm());
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<EventoResponse> listar(@RequestParam(defaultValue = "100") int limite) {
        int seguro = Math.max(1, Math.min(limite, 500));
        return service.recentes(seguro).stream().map(EventoResponse::of).toList();
    }

    /**
     * Relatório PDF da auditoria por intervalo. Sem parâmetros, gera a semana
     * corrente (últimos 7 dias). Com {@code inicio}/{@code fim}, usa o período.
     */
    @GetMapping(value = "/relatorio.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> relatorioPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        LocalDate ate = fim != null ? fim : LocalDate.now();
        LocalDate de = inicio != null ? inicio : ate.minusDays(6);
        LocalDateTime inicioDt = de.atStartOfDay();
        LocalDateTime fimDt = ate.plusDays(1).atStartOfDay();
        List<EventoAuditoria> eventos = service.noIntervalo(inicioDt, fimDt);
        byte[] bytes = pdf.gerar(eventos, de, ate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=auditoria-" + de + "-a-" + ate + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}
