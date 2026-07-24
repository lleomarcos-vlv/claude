package com.kairos.erp.scheduling.web;

import com.kairos.erp.scheduling.app.AgendamentoService;
import com.kairos.erp.scheduling.domain.Agendamento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Agendamento autônomo do cliente + gestão de leads da gerência (Conlor).
 */
@RestController
@RequestMapping("/api/v1/agendamentos")
public class AgendamentoController {

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    public record SolicitarRequest(
            String nomeCliente,
            String telefone,
            @NotBlank String serialNumber,
            @NotBlank String modelo,
            @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataHora,
            String observacao) {
    }

    public record ConfirmarRequest(
            String tecnicoId,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataHora) {
    }

    public record AgendamentoResponse(String id, String nomeCliente, String telefone,
                                      String serialNumber, String modelo,
                                      LocalDateTime dataHora, String observacao,
                                      String status, String ordemServicoId) {
        static AgendamentoResponse of(Agendamento a) {
            return new AgendamentoResponse(a.getId(), a.getNomeCliente(), a.getTelefone(),
                    a.getSerialNumber(), a.getModelo(), a.getDataHora(), a.getObservacao(),
                    a.getStatus(), a.getOrdemServicoId());
        }
    }

    @PostMapping
    public ResponseEntity<AgendamentoResponse> solicitar(@Valid @RequestBody SolicitarRequest req) {
        Agendamento a = service.solicitar(req.nomeCliente(), req.telefone(), req.serialNumber(),
                req.modelo(), req.dataHora(), req.observacao());
        return ResponseEntity.status(HttpStatus.CREATED).body(AgendamentoResponse.of(a));
    }

    @GetMapping
    public List<AgendamentoResponse> listar() {
        return service.listar().stream().map(AgendamentoResponse::of).toList();
    }

    /** Agenda em tempo real do dia (horários já tomados) — visível a todos os papéis. */
    @GetMapping("/agenda")
    public List<AgendamentoResponse> agenda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return service.agendaDoDia(data).stream().map(AgendamentoResponse::of).toList();
    }

    @PostMapping("/{id}/confirmar")
    @PreAuthorize("hasRole('ADMIN')")
    public AgendamentoResponse confirmar(@PathVariable String id,
                                         @RequestBody(required = false) ConfirmarRequest req) {
        String tecnico = req == null ? null : req.tecnicoId();
        LocalDateTime data = req == null ? null : req.dataHora();
        return AgendamentoResponse.of(service.confirmar(id, tecnico, data));
    }

    @PostMapping("/{id}/recusar")
    @PreAuthorize("hasRole('ADMIN')")
    public AgendamentoResponse recusar(@PathVariable String id) {
        return AgendamentoResponse.of(service.recusar(id));
    }
}
