package com.kairos.erp.workorder.app;

import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.equipment.domain.Equipamento;
import com.kairos.erp.equipment.domain.EquipamentoRepository;
import com.kairos.erp.identity.domain.UsuarioRepository;
import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.inventory.domain.ItemEstoque;
import com.kairos.erp.kci.app.DiagnosticoService;
import com.kairos.erp.kci.app.DiagnosticoService.Diagnostico;
import com.kairos.erp.notification.app.NotificacaoService;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.security.UsuarioAtual;
import com.kairos.erp.shared.tenant.TenantContext;
import com.kairos.erp.workorder.domain.OrdemServico;
import com.kairos.erp.workorder.domain.OrdemServico.Status;
import com.kairos.erp.workorder.domain.OrdemServicoItem;
import com.kairos.erp.workorder.domain.OrdemServicoItemRepository;
import com.kairos.erp.workorder.domain.OrdemServicoObservacao;
import com.kairos.erp.workorder.domain.OrdemServicoObservacaoRepository;
import com.kairos.erp.workorder.domain.OrdemServicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Ordem de Serviço da Conlor Drones — fluxo por estágios com aprovação do
 * administrativo, integrado ao estoque (baixa automática na conclusão) e ao
 * histórico vitalício da aeronave.
 */
@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordens;
    private final OrdemServicoItemRepository itens;
    private final OrdemServicoObservacaoRepository observacoes;
    private final EquipamentoService equipamentoService;
    private final EquipamentoRepository equipamentos;
    private final UsuarioRepository usuarios;
    private final EstoqueService estoqueService;
    private final AuditoriaService auditoria;
    private final DiagnosticoService diagnosticoService;
    private final NotificacaoService notificacoes;

    public OrdemServicoService(OrdemServicoRepository ordens,
                               OrdemServicoItemRepository itens,
                               OrdemServicoObservacaoRepository observacoes,
                               EquipamentoService equipamentoService,
                               EquipamentoRepository equipamentos,
                               UsuarioRepository usuarios,
                               EstoqueService estoqueService,
                               AuditoriaService auditoria,
                               DiagnosticoService diagnosticoService,
                               NotificacaoService notificacoes) {
        this.ordens = ordens;
        this.itens = itens;
        this.observacoes = observacoes;
        this.equipamentoService = equipamentoService;
        this.equipamentos = equipamentos;
        this.usuarios = usuarios;
        this.estoqueService = estoqueService;
        this.auditoria = auditoria;
        this.diagnosticoService = diagnosticoService;
        this.notificacoes = notificacoes;
    }

    /** OS com os nomes resolvidos (cliente, técnico, aeronave) para exibição. */
    public record OsView(OrdemServico os, String equipamentoSerial, String equipamentoModelo,
                         String clienteNome, String tecnicoNome) {
    }

    private OsView enriquecer(OrdemServico os) {
        String tenant = os.getTenantId();
        String serial = null;
        String modelo = null;
        Equipamento eq = equipamentos.findByIdAndTenantId(os.getEquipamentoId(), tenant).orElse(null);
        if (eq != null) {
            serial = eq.getSerialNumber();
            modelo = eq.getModelo();
        }
        String clienteNome = os.getClienteId() == null ? null
                : usuarios.findById(os.getClienteId()).map(u -> u.getNome()).orElse(null);
        String tecnicoNome = os.getTecnicoId() == null ? null
                : usuarios.findById(os.getTecnicoId()).map(u -> u.getNome()).orElse(null);
        return new OsView(os, serial, modelo, clienteNome, tecnicoNome);
    }

    @Transactional
    public OrdemServico abrir(String equipamentoId, String descricao) {
        String tenant = TenantContext.require();
        equipamentoService.buscar(equipamentoId); // valida existência + tenant
        String numero = String.format("OS-%06d", ordens.countByTenantId(tenant) + 1);
        OrdemServico os = ordens.save(OrdemServico.abrir(tenant, numero, equipamentoId, descricao));
        auditoria.registrar("OS_ABERTA", "ordem_servico", os.getId(), numero);
        return os;
    }

    /** Abre uma OS já vinculada ao cliente e com a origem do chamado (WhatsApp, Site…). */
    @Transactional
    public OrdemServico abrirChamado(String equipamentoId, String descricao, String clienteId, String origem) {
        OrdemServico os = abrir(equipamentoId, descricao);
        if (clienteId != null) {
            os.vincularCliente(clienteId);
        }
        if (origem != null && !origem.isBlank()) {
            os.definirOrigem(origem);
        }
        return ordens.save(os);
    }

    /** Distribui a OS para o técnico mais adequado (gestão da gerência). */
    @Transactional
    public OrdemServico atribuirTecnico(String ordemServicoId, String tecnicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.atribuirTecnico(tecnicoId);
        ordens.save(os);
        auditoria.registrar("OS_ATRIBUIDA", "ordem_servico", os.getId(), "técnico " + tecnicoId);
        notificacoes.registrar("OS_ATRIBUIDA", "OS " + os.getNumero() + " atribuída a um técnico");
        return os;
    }

    /** Técnico inicia a montagem do orçamento (sai da fila de espera). */
    @Transactional
    public OrdemServico iniciarOrcamento(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.iniciarOrcamento();
        ordens.save(os);
        auditoria.registrar("OS_ORCAMENTO_INICIADO", "ordem_servico", os.getId(), os.getNumero());
        return os;
    }

    /** Diagnóstico + mão de obra durante o orçamento/estágio 1. */
    @Transactional
    public OrdemServico registrarDiagnostico(String ordemServicoId, String diagnostico, BigDecimal maoDeObra) {
        OrdemServico os = buscar(ordemServicoId);
        os.registrarDiagnostico(diagnostico, maoDeObra);
        ordens.save(os);
        auditoria.registrar("OS_DIAGNOSTICO", "ordem_servico", os.getId(), os.getNumero());
        return os;
    }

    /**
     * Adiciona uma peça ao orçamento, com o preço do estoque congelado.
     * Em ORCAMENTO a peça entra no estágio 1; em ESTAGIO_1 entra como adicional
     * (estágio 2, destacada para a nova aprovação do Estágio 2).
     */
    @Transactional
    public OrdemServicoItem adicionarItem(String ordemServicoId, String itemId, BigDecimal quantidade) {
        OrdemServico os = buscar(ordemServicoId);
        int estagio = os.estagioParaNovoItem();
        ItemEstoque item = estoqueService.buscar(itemId); // valida item + tenant
        OrdemServicoItem novo = itens.save(OrdemServicoItem.de(
                os.getId(), itemId, quantidade, estagio, item.getPreco()));
        if (estagio == 2) {
            notificacoes.registrar("ORCAMENTO_ADICIONAL",
                    "OS " + os.getNumero() + ": peça adicional identificada no diagnóstico ("
                            + item.getSku() + ") — requer nova aprovação");
        }
        return novo;
    }

    /** Remove uma peça do orçamento (correção do orçamento). */
    @Transactional
    public void removerItem(String ordemServicoId, String itemOsId) {
        OrdemServico os = buscar(ordemServicoId);
        OrdemServicoItem linha = linhaEditavel(os, itemOsId);
        itens.delete(linha);
        auditoria.registrar("OS_ITEM_REMOVIDO", "ordem_servico", os.getId(), os.getNumero());
    }

    /** Altera a quantidade de uma peça do orçamento (antes da baixa). */
    @Transactional
    public OrdemServicoItem alterarQuantidadeItem(String ordemServicoId, String itemOsId, BigDecimal quantidade) {
        OrdemServico os = buscar(ordemServicoId);
        OrdemServicoItem linha = linhaEditavel(os, itemOsId);
        linha.alterarQuantidade(quantidade);
        OrdemServicoItem salvo = itens.save(linha);
        auditoria.registrar("OS_ITEM_ALTERADO", "ordem_servico", os.getId(), os.getNumero());
        return salvo;
    }

    private OrdemServicoItem linhaEditavel(OrdemServico os, String itemOsId) {
        if (!os.permiteEditarItens()) {
            throw new BusinessException("As peças da OS " + os.getNumero()
                    + " não podem ser editadas na situação atual (" + os.getStatus() + ")");
        }
        OrdemServicoItem linha = itens.findById(itemOsId)
                .filter(i -> i.getOrdemServicoId().equals(os.getId()))
                .orElseThrow(() -> new NotFoundException("Peça não encontrada no orçamento: " + itemOsId));
        if (linha.isBaixado()) {
            throw new BusinessException("A peça já deu baixa no estoque e não pode ser alterada ou removida");
        }
        return linha;
    }

    /** Técnico envia o orçamento para aprovação do administrativo. */
    @Transactional
    public OrdemServico enviarParaAprovacao(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        if (os.getDiagnostico() == null || os.getDiagnostico().isBlank()) {
            throw new BusinessException("O diagnóstico é obrigatório para enviar o orçamento para aprovação");
        }
        os.enviarParaAprovacao();
        ordens.save(os);
        auditoria.registrar("OS_ORCAMENTO_ENVIADO", "ordem_servico", os.getId(), os.getNumero());
        notificacoes.registrar("ORCAMENTO_AGUARDANDO",
                "OS " + os.getNumero() + " aguardando aprovação do orçamento pelo administrativo");
        return os;
    }

    /**
     * Administrativo aprova o orçamento inicial. Ao aprovar, as peças do escopo
     * inicial <strong>dão baixa no estoque</strong> e geram movimentação (se o
     * saldo for insuficiente, a aprovação falha e nada é alterado).
     */
    @Transactional
    public OrdemServico aprovar(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.aprovar();
        baixarItens(os, 1);
        ordens.save(os);
        auditoria.registrar("OS_ORCAMENTO_APROVADO", "ordem_servico", os.getId(), os.getNumero());
        notificacoes.registrar("ORCAMENTO_APROVADO",
                "Orçamento da OS " + os.getNumero() + " aprovado — peças baixadas e manutenção liberada");
        return os;
    }

    /** Baixa no estoque as peças de um estágio ainda não baixadas (na aprovação). */
    private void baixarItens(OrdemServico os, int estagio) {
        for (OrdemServicoItem it : itens.findByOrdemServicoId(os.getId())) {
            if (!it.isBaixado() && it.getEstagio() == estagio) {
                estoqueService.baixar(it.getItemId(), it.getQuantidade(), "OS:" + os.getNumero());
                it.marcarBaixado();
                itens.save(it);
            }
        }
    }

    /** Administrativo reprova o orçamento (volta ao técnico para ajuste). */
    @Transactional
    public OrdemServico reprovar(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.reprovar();
        ordens.save(os);
        auditoria.registrar("OS_ORCAMENTO_REPROVADO", "ordem_servico", os.getId(), os.getNumero());
        notificacoes.registrar("ORCAMENTO_REPROVADO",
                "Orçamento da OS " + os.getNumero() + " reprovado — ajuste necessário");
        return os;
    }

    /** Técnico inicia a manutenção após a liberação do administrativo. */
    @Transactional
    public OrdemServico iniciarManutencao(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.iniciarManutencao();
        ordens.save(os);
        auditoria.registrar("OS_MANUTENCAO_INICIADA", "ordem_servico", os.getId(), os.getNumero());
        notificacoes.registrar("MANUTENCAO_INICIADA",
                "Manutenção da OS " + os.getNumero() + " iniciada (Estágio 1)");
        return os;
    }

    /** Técnico identifica novos defeitos → envia o Estágio 2 para aprovação. */
    @Transactional
    public OrdemServico irParaEstagio2(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.irParaEstagio2();
        ordens.save(os);
        Equipamento eq = equipamentoService.buscar(os.getEquipamentoId());
        auditoria.registrar("OS_ESTAGIO_2_SOLICITADO", "ordem_servico", os.getId(), os.getNumero());
        notificacoes.registrar("ESTAGIO_2_AGUARDANDO",
                "A aeronave " + eq.getModelo() + " (S/N " + eq.getSerialNumber() + ") entrou no Estágio 2 "
                        + "e aguarda aprovação do novo orçamento — OS " + os.getNumero());
        return os;
    }

    /** Administrativo aprova o Estágio 2 — baixa as peças adicionais no estoque. */
    @Transactional
    public OrdemServico aprovarEstagio2(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.aprovarEstagio2();
        baixarItens(os, 2);
        ordens.save(os);
        auditoria.registrar("OS_ESTAGIO_2_APROVADO", "ordem_servico", os.getId(), os.getNumero());
        notificacoes.registrar("ESTAGIO_2_APROVADO",
                "Estágio 2 da OS " + os.getNumero() + " aprovado — peças baixadas e manutenção liberada");
        return os;
    }

    /** Administrativo reprova o Estágio 2 (volta ao Estágio 1). */
    @Transactional
    public OrdemServico reprovarEstagio2(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.reprovarEstagio2();
        ordens.save(os);
        auditoria.registrar("OS_ESTAGIO_2_REPROVADO", "ordem_servico", os.getId(), os.getNumero());
        return os;
    }

    /** Técnico inicia a manutenção do Estágio 2 (após liberação). */
    @Transactional
    public OrdemServico iniciarEstagio2(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.iniciarEstagio2();
        ordens.save(os);
        auditoria.registrar("OS_ESTAGIO_2_INICIADO", "ordem_servico", os.getId(), os.getNumero());
        notificacoes.registrar("ESTAGIO_2_INICIADO",
                "Manutenção do Estágio 2 da OS " + os.getNumero() + " iniciada");
        return os;
    }

    // --- Poderes do administrativo ------------------------------------------

    @Transactional
    public OrdemServico cancelar(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.cancelar();
        ordens.save(os);
        auditoria.registrar("OS_CANCELADA", "ordem_servico", os.getId(), os.getNumero());
        notificacoes.registrar("OS_CANCELADA", "OS " + os.getNumero() + " cancelada pelo administrativo");
        return os;
    }

    @Transactional
    public OrdemServico reabrir(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        os.reabrir();
        ordens.save(os);
        auditoria.registrar("OS_REABERTA", "ordem_servico", os.getId(), os.getNumero());
        return os;
    }

    /**
     * Alteração livre de estágio pelo administrativo (correção/continuidade). O
     * <strong>motivo é obrigatório</strong> e fica registrado na auditoria.
     */
    @Transactional
    public OrdemServico alterarStatus(String ordemServicoId, String status, String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new BusinessException("Informe o motivo da alteração de estágio (fica na auditoria)");
        }
        OrdemServico os = buscar(ordemServicoId);
        Status anterior = Status.valueOf(os.getStatus());
        Status novo;
        try {
            novo = Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Estágio inválido: " + status);
        }
        os.definirStatus(novo);
        ordens.save(os);
        auditoria.registrar("OS_STATUS_ALTERADO", "ordem_servico", os.getId(),
                os.getNumero() + ": " + anterior + " → " + novo + " · motivo: " + motivo.trim());
        return os;
    }

    // --- Observações / Sugestões --------------------------------------------

    @Transactional
    public OrdemServicoObservacao adicionarObservacao(String ordemServicoId, String texto,
                                                      boolean visivelCliente) {
        OrdemServico os = buscar(ordemServicoId);
        if (texto == null || texto.isBlank()) {
            throw new BusinessException("A observação não pode ser vazia");
        }
        // O técnico só registra observações internas — não pode enviar ao cliente.
        boolean visivel = visivelCliente;
        if (UsuarioAtual.temPerfil("TECNICO") && !UsuarioAtual.temPerfil("ADMIN")) {
            visivel = false;
        }
        OrdemServicoObservacao obs = observacoes.save(OrdemServicoObservacao.nova(
                TenantContext.require(), os.getId(), UsuarioAtual.id(), UsuarioAtual.nome(),
                texto.trim(), visivel));
        auditoria.registrar("OS_OBSERVACAO", "ordem_servico", os.getId(), os.getNumero());
        return obs;
    }

    @Transactional(readOnly = true)
    public List<OrdemServicoObservacao> observacoesDe(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        List<OrdemServicoObservacao> lista = observacoes.findByOrdemServicoIdOrderByCriadoEmAsc(os.getId());
        // Cliente só enxerga as observações marcadas como visíveis a ele.
        if (UsuarioAtual.temPerfil("CLIENTE")) {
            return lista.stream().filter(OrdemServicoObservacao::isVisivelCliente).toList();
        }
        return lista;
    }

    // --- Conclusão ----------------------------------------------------------

    @Transactional
    public OrdemServico concluir(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        List<OrdemServicoItem> pecas = itens.findByOrdemServicoId(os.getId());

        os.concluir();

        // As peças normalmente já baixaram na aprovação; aqui só as pendentes
        // (segurança para itens adicionados e não aprovados formalmente).
        for (OrdemServicoItem peca : pecas) {
            if (!peca.isBaixado()) {
                estoqueService.baixar(peca.getItemId(), peca.getQuantidade(), "OS:" + os.getNumero());
                peca.marcarBaixado();
                itens.save(peca);
            }
        }

        ordens.save(os);

        equipamentoService.registrarEvento(
                os.getEquipamentoId(), "SERVICO",
                "Manutenção " + os.getNumero() + " concluída",
                "{\"numero\":\"" + os.getNumero() + "\",\"pecas\":" + pecas.size() + "}");

        auditoria.registrar("OS_CONCLUIDA", "ordem_servico", os.getId(),
                os.getNumero() + " (" + pecas.size() + " peça(s))");
        notificacoes.registrar("OS_CONCLUIDA",
                "Manutenção " + os.getNumero() + " concluída — aeronave pronta para retirada");

        return os;
    }

    // --- Consultas ----------------------------------------------------------

    @Transactional(readOnly = true)
    public OrdemServico buscar(String id) {
        return ordens.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Ordem de serviço não encontrada: " + id));
    }

    /**
     * Diagnóstico assistido pela IA a partir dos sintomas: registra a hipótese
     * principal no histórico vitalício da aeronave.
     */
    @Transactional
    public List<Diagnostico> diagnosticar(String ordemServicoId, List<String> sintomas) {
        OrdemServico os = buscar(ordemServicoId);
        List<Diagnostico> hipoteses = diagnosticoService.diagnosticar(sintomas);

        String resumo = hipoteses.isEmpty()
                ? "Sem hipótese para os sintomas informados"
                : hipoteses.get(0).causa() + " (" + hipoteses.get(0).confianca() + "%)";
        equipamentoService.registrarEvento(os.getEquipamentoId(), "DIAGNOSTICO",
                "IA · OS " + os.getNumero() + ": " + resumo,
                "{\"sintomas\":" + sintomas.size() + ",\"hipoteses\":" + hipoteses.size() + "}");
        auditoria.registrar("OS_DIAGNOSTICADA", "ordem_servico", os.getId(), resumo);
        return hipoteses;
    }

    /**
     * Lista conforme o papel: CLIENTE vê as suas OSs (tracking), TECNICO vê as
     * que lhe foram distribuídas (execução focada), gerência vê todas.
     */
    @Transactional(readOnly = true)
    public List<OrdemServico> listar() {
        String tenant = TenantContext.require();
        String usuario = UsuarioAtual.id();
        if (usuario != null && UsuarioAtual.temPerfil("CLIENTE")) {
            return ordens.findByTenantIdAndClienteIdOrderByAbertaEmDesc(tenant, usuario);
        }
        // Técnico vê as OS atribuídas a ele E as ainda não distribuídas (fila),
        // para poder iniciar o orçamento assim que o chamado é aberto.
        if (usuario != null && UsuarioAtual.temPerfil("TECNICO") && !UsuarioAtual.temPerfil("ADMIN")) {
            return ordens.findParaTecnico(tenant, usuario);
        }
        return ordens.findByTenantIdOrderByAbertaEmDesc(tenant);
    }

    /** Todas as OSs do tenant (painel "Acesso Geral" — leitura). */
    @Transactional(readOnly = true)
    public List<OrdemServico> listarTodas() {
        return ordens.findByTenantIdOrderByAbertaEmDesc(TenantContext.require());
    }

    /** Versões com nomes resolvidos (cliente, técnico, aeronave) para exibição. */
    @Transactional(readOnly = true)
    public List<OsView> listarView() {
        return listar().stream().map(this::enriquecer).toList();
    }

    @Transactional(readOnly = true)
    public List<OsView> listarTodasView() {
        return listarTodas().stream().map(this::enriquecer).toList();
    }

    @Transactional(readOnly = true)
    public OsView buscarView(String id) {
        return enriquecer(buscar(id));
    }

    @Transactional(readOnly = true)
    public List<OrdemServicoItem> itensDa(String ordemServicoId) {
        buscar(ordemServicoId);
        return itens.findByOrdemServicoId(ordemServicoId);
    }

    /** Total do orçamento (peças, preço congelado) — sem mão de obra. */
    public BigDecimal totalDe(List<OrdemServicoItem> linhas) {
        return linhas.stream().map(OrdemServicoItem::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
