package com.kairos.erp.workorder.web;

import com.kairos.erp.workorder.app.OrdemServicoService;
import com.kairos.erp.workorder.domain.OrdemServico;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/ordens-servico")
public class OrdemServicoController {

    private final OrdemServicoService service;

    public OrdemServicoController(OrdemServicoService service) {
        this.service = service;
    }

    public record AbrirOsRequest(
            @NotBlank String equipamentoId,
            String descricao) {
    }

    public record AdicionarItemRequest(
            @NotBlank String itemId,
            @NotNull @Positive BigDecimal quantidade) {
    }

    public record OsResponse(String id, String numero, String equipamentoId,
                             String status, String descricao,
                             LocalDateTime abertaEm, LocalDateTime concluidaEm) {
        static OsResponse of(OrdemServico os) {
            return new OsResponse(os.getId(), os.getNumero(), os.getEquipamentoId(),
                    os.getStatus(), os.getDescricao(), os.getAbertaEm(), os.getConcluidaEm());
        }
    }

    @PostMapping
    public ResponseEntity<OsResponse> abrir(@Valid @RequestBody AbrirOsRequest req) {
        OrdemServico os = service.abrir(req.equipamentoId(), req.descricao());
        return ResponseEntity.status(HttpStatus.CREATED).body(OsResponse.of(os));
    }

    @PostMapping("/{id}/itens")
    public ResponseEntity<Void> adicionarItem(@PathVariable String id,
                                              @Valid @RequestBody AdicionarItemRequest req) {
        service.adicionarItem(id, req.itemId(), req.quantidade());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{id}/concluir")
    public OsResponse concluir(@PathVariable String id) {
        return OsResponse.of(service.concluir(id));
    }

    @GetMapping("/{id}")
    public OsResponse buscar(@PathVariable String id) {
        return OsResponse.of(service.buscar(id));
    }
}
