package com.kairos.erp.finance.web;

import com.kairos.erp.finance.app.FinanceiroPecasService;
import com.kairos.erp.finance.app.FinanceiroPecasService.ResumoPecas;
import com.kairos.erp.finance.app.FinanceiroService;
import com.kairos.erp.finance.app.FinanceiroService.Resumo;
import com.kairos.erp.finance.domain.LancamentoFinanceiro;
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
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/financeiro")
public class FinanceiroController {

    private final FinanceiroService service;
    private final FinanceiroPecasService pecas;

    public FinanceiroController(FinanceiroService service, FinanceiroPecasService pecas) {
        this.service = service;
        this.pecas = pecas;
    }

    /** Financeiro de peças (rentabilidade do estoque) — visão principal do painel. */
    @GetMapping("/pecas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResumoPecas pecas() {
        return pecas.resumo();
    }

    public record CriarLancamentoRequest(
            @NotBlank String tipo,
            @NotBlank String descricao,
            @NotNull BigDecimal valor,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimento,
            String clienteId) {
    }

    public record FaturarOsRequest(
            @NotBlank String ordemServicoId,
            @NotNull BigDecimal valor,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimento) {
    }

    public record LancamentoResponse(String id, String tipo, String descricao, BigDecimal valor,
                                     LocalDate vencimento, String status, String origem, boolean vencido) {
        static LancamentoResponse of(LancamentoFinanceiro l) {
            return new LancamentoResponse(l.getId(), l.getTipo(), l.getDescricao(), l.getValor(),
                    l.getVencimento(), l.getStatus(), l.getOrigem(), l.estaVencido());
        }
    }

    @PostMapping("/lancamentos")
    public ResponseEntity<LancamentoResponse> criar(@Valid @RequestBody CriarLancamentoRequest req) {
        LancamentoFinanceiro l = service.criar(req.tipo(), req.descricao(), req.valor(),
                req.vencimento(), req.clienteId());
        return ResponseEntity.status(HttpStatus.CREATED).body(LancamentoResponse.of(l));
    }

    @GetMapping("/lancamentos")
    public List<LancamentoResponse> listar() {
        return service.listar().stream().map(LancamentoResponse::of).toList();
    }

    @PostMapping("/lancamentos/{id}/pagar")
    public LancamentoResponse pagar(@PathVariable String id) {
        return LancamentoResponse.of(service.pagar(id));
    }

    @PostMapping("/faturar-os")
    public ResponseEntity<LancamentoResponse> faturarOs(@Valid @RequestBody FaturarOsRequest req) {
        LancamentoFinanceiro l = service.faturarOs(req.ordemServicoId(), req.valor(), req.vencimento());
        return ResponseEntity.status(HttpStatus.CREATED).body(LancamentoResponse.of(l));
    }

    @GetMapping("/resumo")
    public Resumo resumo() {
        return service.resumo();
    }
}
