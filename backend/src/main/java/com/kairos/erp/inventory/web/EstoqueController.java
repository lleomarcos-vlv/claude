package com.kairos.erp.inventory.web;

import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.inventory.app.EstoqueService.ClassificacaoAbc;
import com.kairos.erp.inventory.domain.ItemEstoque;
import com.kairos.erp.inventory.domain.MovimentacaoEstoque;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
            BigDecimal pontoReposicao,
            BigDecimal preco,
            BigDecimal custo,
            String fornecedor) {
    }

    public record ItemResponse(String id, String sku, String descricao,
                               BigDecimal saldo, BigDecimal pontoReposicao,
                               BigDecimal preco, BigDecimal custo, String fornecedor,
                               boolean precisaRepor) {
        static ItemResponse of(ItemEstoque i) {
            return new ItemResponse(i.getId(), i.getSku(), i.getDescricao(),
                    i.getSaldo(), i.getPontoReposicao(), i.getPreco(), i.getCusto(),
                    i.getFornecedor(), i.precisaRepor());
        }
    }

    @PostMapping
    public ResponseEntity<ItemResponse> criar(@Valid @RequestBody CriarItemRequest req) {
        ItemEstoque item = service.criarItem(req.sku(), req.descricao(),
                req.saldoInicial(), req.pontoReposicao(), req.preco(), req.custo(), req.fornecedor());
        return ResponseEntity.status(HttpStatus.CREATED).body(ItemResponse.of(item));
    }

    public record PrecificarRequest(BigDecimal preco, BigDecimal custo, String fornecedor) {
    }

    @PostMapping("/{id}/preco")
    public ItemResponse precificar(@PathVariable String id, @Valid @RequestBody PrecificarRequest req) {
        return ItemResponse.of(service.precificar(id, req.preco(), req.custo(), req.fornecedor()));
    }

    /** Importa peças de uma planilha CSV (sku, descricao, quantidade, custo, preco, fornecedor). */
    @PostMapping("/importar")
    @PreAuthorize("hasRole('ADMIN')")
    public EstoqueService.ImportacaoResumo importar(
            @org.springframework.web.bind.annotation.RequestParam("arquivo")
            org.springframework.web.multipart.MultipartFile arquivo) throws java.io.IOException {
        String csv = new String(arquivo.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        return service.importarPlanilha(csv);
    }

    @GetMapping("/{id}")
    public ItemResponse buscar(@PathVariable String id) {
        return ItemResponse.of(service.buscar(id));
    }

    @GetMapping
    public List<ItemResponse> listar() {
        return service.listar().stream().map(ItemResponse::of).toList();
    }

    public record EntradaRequest(@NotNull @Positive BigDecimal quantidade, String origem) {
    }

    @PostMapping("/{id}/entradas")
    public ItemResponse entrada(@PathVariable String id, @Valid @RequestBody EntradaRequest req) {
        String origem = (req.origem() == null || req.origem().isBlank()) ? "ENTRADA_MANUAL" : req.origem();
        return ItemResponse.of(service.entrada(id, req.quantidade(), origem));
    }

    @GetMapping("/reposicao")
    public List<ItemResponse> reposicao() {
        return service.itensParaRepor().stream().map(ItemResponse::of).toList();
    }

    public record MovimentacaoResponse(String tipo, BigDecimal quantidade, String origem,
                                       LocalDateTime criadoEm) {
        static MovimentacaoResponse of(MovimentacaoEstoque m) {
            return new MovimentacaoResponse(m.getTipo(), m.getQuantidade(), m.getOrigem(), m.getCriadoEm());
        }
    }

    @GetMapping("/{id}/movimentacoes")
    public List<MovimentacaoResponse> movimentacoes(@PathVariable String id) {
        return service.movimentacoesDe(id).stream().map(MovimentacaoResponse::of).toList();
    }

    public record AbcResponse(String itemId, String sku, String descricao,
                              BigDecimal consumo, String classe) {
        static AbcResponse of(ClassificacaoAbc c) {
            return new AbcResponse(c.itemId(), c.sku(), c.descricao(), c.consumo(), c.classe());
        }
    }

    @GetMapping("/abc")
    public List<AbcResponse> curvaAbc() {
        return service.curvaAbc().stream().map(AbcResponse::of).toList();
    }
}
