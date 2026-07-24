package com.kairos.erp.workorder.web;

import com.kairos.erp.workorder.app.ChamadoService;
import com.kairos.erp.workorder.app.ChamadoService.Chamado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Abertura de chamados pelo administrativo (Criar Novo Chamado). Cria cliente,
 * aeronave, OS, protocolo e credenciais em uma única operação.
 */
@RestController
@RequestMapping("/api/v1/chamados")
public class ChamadoController {

    private final ChamadoService service;

    public ChamadoController(ChamadoService service) {
        this.service = service;
    }

    public record CriarChamadoRequest(
            @NotBlank String nomeCliente,
            String emailCliente,
            String telefone,
            @NotBlank String serialNumber,
            @NotBlank String modelo,
            String origem,
            String descricao) {
    }

    public record ChamadoResponse(String ordemServicoId, String numero, String protocolo,
                                  String status, String clienteEmail, String senhaGerada,
                                  boolean clienteNovo) {
        static ChamadoResponse of(Chamado c) {
            return new ChamadoResponse(c.ordemServico().getId(), c.ordemServico().getNumero(),
                    c.protocolo(), c.ordemServico().getStatus(), c.clienteEmail(),
                    c.senhaGerada(), c.clienteNovo());
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ChamadoResponse> criar(@Valid @RequestBody CriarChamadoRequest req) {
        Chamado c = service.criar(req.nomeCliente(), req.emailCliente(), req.telefone(),
                req.serialNumber(), req.modelo(), req.origem(), req.descricao());
        return ResponseEntity.status(HttpStatus.CREATED).body(ChamadoResponse.of(c));
    }
}
