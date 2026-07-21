package com.kairos.erp.equipment.web;

import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.equipment.domain.Equipamento;
import com.kairos.erp.equipment.domain.EquipamentoEvento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/equipamentos")
public class EquipamentoController {

    private final EquipamentoService service;

    public EquipamentoController(EquipamentoService service) {
        this.service = service;
    }

    public record RegistrarEquipamentoRequest(
            @NotBlank String serialNumber,
            @NotBlank String modelo,
            String fabricante) {
    }

    public record EquipamentoResponse(String id, String serialNumber, String modelo,
                                      String fabricante, String status) {
        static EquipamentoResponse of(Equipamento e) {
            return new EquipamentoResponse(e.getId(), e.getSerialNumber(), e.getModelo(),
                    e.getFabricante(), e.getStatus());
        }
    }

    public record EventoResponse(long sequencia, String tipo, String descricao,
                                 String dados, LocalDateTime ocorridoEm) {
        static EventoResponse of(EquipamentoEvento ev) {
            return new EventoResponse(ev.getSequencia(), ev.getTipo(), ev.getDescricao(),
                    ev.getDados(), ev.getOcorridoEm());
        }
    }

    @PostMapping
    public ResponseEntity<EquipamentoResponse> registrar(@Valid @RequestBody RegistrarEquipamentoRequest req) {
        Equipamento e = service.registrar(req.serialNumber(), req.modelo(), req.fabricante());
        return ResponseEntity.status(HttpStatus.CREATED).body(EquipamentoResponse.of(e));
    }

    @GetMapping
    public List<EquipamentoResponse> listar() {
        return service.listar().stream().map(EquipamentoResponse::of).toList();
    }

    @GetMapping("/{id}")
    public EquipamentoResponse buscar(@PathVariable String id) {
        return EquipamentoResponse.of(service.buscar(id));
    }

    @GetMapping("/{id}/historico")
    public List<EventoResponse> historico(@PathVariable String id) {
        return service.historico(id).stream().map(EventoResponse::of).toList();
    }
}
