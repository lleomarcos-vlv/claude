package com.kairos.erp.inventory.web;

import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.inventory.domain.ItemEstoque;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/estoque/itens")
public class EstoqueController {

    private final EstoqueService service;

    public EstoqueController(EstoqueService service) {
        this.service = service;
    }

    public record CriarItemRequest(
            @NotBlank String sku,
            @NotBlank String descricao,
            @NotNull BigDecimal saldoInicial,
            BigDecimal pontoReposicao) {
    }

    public record ItemResponse(String id, String sku, String descricao,
                               BigDecimal saldo, BigDecimal pontoReposicao, boolean precisaRepor) {
        static ItemResponse of(ItemEstoque i) {
            return new ItemResponse(i.getId(), i.getSku(), i.getDescricao(),
                    i.getSaldo(), i.getPontoReposicao(), i.precisaRepor());
        }
    }

    @PostMapping
    public ResponseEntity<ItemResponse> criar(@Valid @RequestBody CriarItemRequest req) {
        ItemEstoque item = service.criarItem(req.sku(), req.descricao(),
                req.saldoInicial(), req.pontoReposicao());
        return ResponseEntity.status(HttpStatus.CREATED).body(ItemResponse.of(item));
    }

    @GetMapping("/{id}")
    public ItemResponse buscar(@PathVariable String id) {
        return ItemResponse.of(service.buscar(id));
    }
}
