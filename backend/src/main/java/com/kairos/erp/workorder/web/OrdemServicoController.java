package com.kairos.erp.workorder.web;

import com.kairos.erp.kci.app.DiagnosticoService.Diagnostico;
import com.kairos.erp.workorder.app.OrcamentoService;
import com.kairos.erp.workorder.app.OrcamentoService.Orcamento;
import com.kairos.erp.workorder.app.OrdemServicoService;
import com.kairos.erp.workorder.domain.OrdemServico;
import com.kairos.erp.workorder.domain.OrdemServicoObservacao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Ordens de Serviço — fluxo Conlor por estágios com aprovação do administrativo,
 * orçamento automatizado (PDF e WhatsApp), observações e linha do tempo do cliente.
 */
@RestController
@RequestMapping("/api/v1/ordens-servico")
public class OrdemServicoController {

    private final OrdemServicoService service;
    private final OrcamentoService orcamentos;

    public OrdemServicoController(OrdemServicoService service, OrcamentoService orcamentos) {
        this.service = service;
        this.orcamentos = orcamentos;
    }

    public record AbrirOsRequest(@NotBlank String equipamentoId, String descricao) {
    }

    public record AdicionarItemRequest(@NotBlank String itemId, @NotNull @Positive BigDecimal quantidade) {
    }

    public record AtribuirTecnicoRequest(@NotBlank String tecnicoId) {
    }

    public record DiagnosticoOrcamentoRequest(String diagnostico, BigDecimal maoDeObra) {
    }

    public record AlterarStatusRequest(@NotBlank String status, @NotBlank String motivo) {
    }

    public record ObservacaoRequest(@NotBlank String texto, boolean visivelCliente) {
    }

    public record OsResponse(String id, String numero, String protocolo, String equipamentoId,
                             String equipamentoSerial, String equipamentoModelo,
                             String clienteNome, String tecnicoNome,
                             String status, String descricao, String diagnostico, BigDecimal maoDeObra,
                             String origem, String tecnicoId, String clienteId,
                             LocalDateTime orcamentoAprovadoEm, LocalDateTime adicionaisAprovadosEm,
                             LocalDateTime abertaEm, LocalDateTime concluidaEm) {
        static OsResponse of(OrdemServico os) {
            return of(new OrdemServicoService.OsView(os, null, null, null, null));
        }

        static OsResponse of(OrdemServicoService.OsView v) {
            OrdemServico os = v.os();
            return new OsResponse(os.getId(), os.getNumero(), os.getProtocolo(), os.getEquipamentoId(),
                    v.equipamentoSerial(), v.equipamentoModelo(), v.clienteNome(), v.tecnicoNome(),
                    os.getStatus(), os.getDescricao(), os.getDiagnostico(), os.getMaoDeObra(),
                    os.getOrigem(), os.getTecnicoId(), os.getClienteId(),
                    os.getOrcamentoAprovadoEm(), os.getAdicionaisAprovadosEm(),
                    os.getAbertaEm(), os.getConcluidaEm());
        }
    }

    public record ObservacaoResponse(String id, String autorNome, String texto,
                                     boolean visivelCliente, LocalDateTime criadoEm) {
        static ObservacaoResponse of(OrdemServicoObservacao o) {
            return new ObservacaoResponse(o.getId(), o.getAutorNome(), o.getTexto(),
                    o.isVisivelCliente(), o.getCriadoEm());
        }
    }

    // --- Abertura e consulta ------------------------------------------------

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<OsResponse> abrir(@Valid @RequestBody AbrirOsRequest req) {
        OrdemServico os = service.abrir(req.equipamentoId(), req.descricao());
        return ResponseEntity.status(HttpStatus.CREATED).body(OsResponse.of(os));
    }

    @GetMapping
    public List<OsResponse> listar() {
        return service.listarView().stream().map(OsResponse::of).toList();
    }

    /** Painel "Acesso Geral" — todas as OSs da empresa (somente leitura). */
    @GetMapping("/todas")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public List<OsResponse> listarTodas() {
        return service.listarTodasView().stream().map(OsResponse::of).toList();
    }

    @GetMapping("/{id}")
    public OsResponse buscar(@PathVariable String id) {
        return OsResponse.of(service.buscarView(id));
    }

    // --- Fluxo (técnico) ----------------------------------------------------

    @PostMapping("/{id}/atribuir-tecnico")
    @PreAuthorize("hasRole('ADMIN')")
    public OsResponse atribuirTecnico(@PathVariable String id, @Valid @RequestBody AtribuirTecnicoRequest req) {
        return OsResponse.of(service.atribuirTecnico(id, req.tecnicoId()));
    }

    @PostMapping("/{id}/iniciar-orcamento")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public OsResponse iniciarOrcamento(@PathVariable String id) {
        return OsResponse.of(service.iniciarOrcamento(id));
    }

    @PostMapping("/{id}/orcamento-info")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public OsResponse orcamentoInfo(@PathVariable String id, @Valid @RequestBody DiagnosticoOrcamentoRequest req) {
        return OsResponse.of(service.registrarDiagnostico(id, req.diagnostico(), req.maoDeObra()));
    }

    @PostMapping("/{id}/itens")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Void> adicionarItem(@PathVariable String id, @Valid @RequestBody AdicionarItemRequest req) {
        service.adicionarItem(id, req.itemId(), req.quantidade());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/itens/{itemOsId}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Void> removerItem(@PathVariable String id, @PathVariable String itemOsId) {
        service.removerItem(id, itemOsId);
        return ResponseEntity.noContent().build();
    }

    public record AlterarQuantidadeRequest(@NotNull @Positive BigDecimal quantidade) {
    }

    @PostMapping("/{id}/itens/{itemOsId}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Void> alterarQuantidade(@PathVariable String id, @PathVariable String itemOsId,
                                                  @Valid @RequestBody AlterarQuantidadeRequest req) {
        service.alterarQuantidadeItem(id, itemOsId, req.quantidade());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/enviar-aprovacao")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public OsResponse enviarAprovacao(@PathVariable String id) {
        return OsResponse.of(service.enviarParaAprovacao(id));
    }

    @PostMapping("/{id}/iniciar-manutencao")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public OsResponse iniciarManutencao(@PathVariable String id) {
        return OsResponse.of(service.iniciarManutencao(id));
    }

    @PostMapping("/{id}/ir-estagio2")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public OsResponse irEstagio2(@PathVariable String id) {
        return OsResponse.of(service.irParaEstagio2(id));
    }

    @PostMapping("/{id}/iniciar-estagio2")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public OsResponse iniciarEstagio2(@PathVariable String id) {
        return OsResponse.of(service.iniciarEstagio2(id));
    }

    @PostMapping("/{id}/concluir")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public OsResponse concluir(@PathVariable String id) {
        return OsResponse.of(service.concluir(id));
    }

    // --- Aprovações e poderes (administrativo) ------------------------------

    @PostMapping("/{id}/aprovar")
    @PreAuthorize("hasRole('ADMIN')")
    public OsResponse aprovar(@PathVariable String id) {
        return OsResponse.of(service.aprovar(id));
    }

    @PostMapping("/{id}/reprovar")
    @PreAuthorize("hasRole('ADMIN')")
    public OsResponse reprovar(@PathVariable String id) {
        return OsResponse.of(service.reprovar(id));
    }

    @PostMapping("/{id}/aprovar-estagio2")
    @PreAuthorize("hasRole('ADMIN')")
    public OsResponse aprovarEstagio2(@PathVariable String id) {
        return OsResponse.of(service.aprovarEstagio2(id));
    }

    @PostMapping("/{id}/reprovar-estagio2")
    @PreAuthorize("hasRole('ADMIN')")
    public OsResponse reprovarEstagio2(@PathVariable String id) {
        return OsResponse.of(service.reprovarEstagio2(id));
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('ADMIN')")
    public OsResponse cancelar(@PathVariable String id) {
        return OsResponse.of(service.cancelar(id));
    }

    @PostMapping("/{id}/reabrir")
    @PreAuthorize("hasRole('ADMIN')")
    public OsResponse reabrir(@PathVariable String id) {
        return OsResponse.of(service.reabrir(id));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OsResponse alterarStatus(@PathVariable String id, @Valid @RequestBody AlterarStatusRequest req) {
        return OsResponse.of(service.alterarStatus(id, req.status(), req.motivo()));
    }

    // --- Observações / Sugestões --------------------------------------------

    @GetMapping("/{id}/observacoes")
    public List<ObservacaoResponse> observacoes(@PathVariable String id) {
        return service.observacoesDe(id).stream().map(ObservacaoResponse::of).toList();
    }

    @PostMapping("/{id}/observacoes")
    public ResponseEntity<ObservacaoResponse> adicionarObservacao(@PathVariable String id,
                                                                  @Valid @RequestBody ObservacaoRequest req) {
        OrdemServicoObservacao o = service.adicionarObservacao(id, req.texto(), req.visivelCliente());
        return ResponseEntity.status(HttpStatus.CREATED).body(ObservacaoResponse.of(o));
    }

    // --- Orçamento automatizado ---------------------------------------------

    @GetMapping("/{id}/orcamento")
    public Orcamento orcamento(@PathVariable String id) {
        return orcamentos.montar(id);
    }

    @GetMapping(value = "/{id}/orcamento.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> orcamentoPdf(@PathVariable String id) {
        byte[] pdf = orcamentos.gerarPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=orcamento.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{id}/whatsapp")
    public Map<String, String> whatsapp(@PathVariable String id,
                                        @RequestParam(required = false) String telefone) {
        return Map.of("url", orcamentos.linkWhatsApp(id, telefone));
    }

    // --- Linha do tempo (cliente) -------------------------------------------

    public record PassoTimeline(String rotulo, String estado) {
    }

    public record Timeline(String status, String etapaAtual, String mensagem,
                           int progresso, List<PassoTimeline> passos) {
    }

    private static final List<String> ETAPAS_CLIENTE = List.of(
            "Recebido", "Orçamento", "Aguardando aprovação", "Em manutenção", "Estágio 2", "Finalizado");

    @GetMapping("/{id}/timeline")
    public Timeline timeline(@PathVariable String id) {
        OrdemServico os = service.buscar(id);
        String s = os.getStatus();
        int atual = switch (s) {
            case "FILA_DE_ESPERA" -> 0;
            case "ORCAMENTO" -> 1;
            case "AGUARDANDO_APROVACAO" -> 2;
            case "APROVADO", "ESTAGIO_1" -> 3;
            case "AGUARDANDO_APROVACAO_E2", "APROVADO_E2", "ESTAGIO_2" -> 4;
            case "CONCLUIDA" -> 5;
            default -> -1; // CANCELADA
        };
        String mensagem = switch (s) {
            case "FILA_DE_ESPERA" -> "Recebemos seu equipamento. Ele está na fila para análise.";
            case "ORCAMENTO" -> "O técnico está avaliando seu equipamento e montando o orçamento.";
            case "AGUARDANDO_APROVACAO" -> "O orçamento foi enviado para aprovação.";
            case "APROVADO" -> "Orçamento aprovado. A manutenção será iniciada em breve.";
            case "ESTAGIO_1" -> "A manutenção foi iniciada.";
            case "AGUARDANDO_APROVACAO_E2" -> "Seu drone entrou no Estágio 2 devido à identificação de novos "
                    + "componentes danificados. Aguardando aprovação para continuidade.";
            case "APROVADO_E2" -> "Estágio 2 aprovado. Retomando a manutenção.";
            case "ESTAGIO_2" -> "Manutenção do Estágio 2 em andamento.";
            case "CONCLUIDA" -> "Manutenção concluída. Equipamento pronto para retirada.";
            case "CANCELADA" -> "Este chamado foi cancelado.";
            default -> "";
        };
        List<PassoTimeline> passos = new java.util.ArrayList<>();
        for (int i = 0; i < ETAPAS_CLIENTE.size(); i++) {
            String estado = i < atual ? "feito" : i == atual ? "atual" : "pendente";
            passos.add(new PassoTimeline(ETAPAS_CLIENTE.get(i), estado));
        }
        int progresso = atual < 0 ? 0 : (int) Math.round((atual / 5.0) * 100);
        return new Timeline(s, atual < 0 ? "Cancelado" : ETAPAS_CLIENTE.get(atual), mensagem, progresso, passos);
    }

    // --- IA (diagnóstico por sintomas) --------------------------------------

    public record DiagnosticoRequest(@NotNull List<String> sintomas) {
    }

    @PostMapping("/{id}/diagnostico")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public List<Diagnostico> diagnosticar(@PathVariable String id, @Valid @RequestBody DiagnosticoRequest req) {
        return service.diagnosticar(id, req.sintomas());
    }
}
