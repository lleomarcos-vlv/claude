package com.kairos.erp.workorder.domain;

import com.kairos.erp.shared.error.BusinessException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Ordem de Serviço (OS) — fluxo Conlor Drones com aprovação do administrativo:
 *
 * <pre>
 * FILA_DE_ESPERA
 *   → ORCAMENTO                  (técnico monta: diagnóstico, peças, mão de obra)
 *   → AGUARDANDO_APROVACAO       (enviado ao administrativo)
 *   → APROVADO                   (gerente aprovou; libera "Iniciar manutenção")
 *   → ESTAGIO_1                  (manutenção em execução)
 *       ├─ CONCLUIDA             (concluir serviço)
 *       └─ AGUARDANDO_APROVACAO_E2 (surgiram novos defeitos → novo orçamento)
 *              → APROVADO_E2     (gerente aprovou o Estágio 2)
 *              → ESTAGIO_2       (manutenção do Estágio 2)
 *              → CONCLUIDA
 * </pre>
 *
 * <p>O administrativo pode ainda cancelar, reabrir e alterar o estágio de
 * qualquer OS (poder total do painel administrativo).</p>
 */
@Entity
@Table(name = "ordem_servico")
public class OrdemServico {

    public enum Status {
        FILA_DE_ESPERA, ORCAMENTO, AGUARDANDO_APROVACAO, APROVADO, ESTAGIO_1,
        AGUARDANDO_APROVACAO_E2, APROVADO_E2, ESTAGIO_2, CONCLUIDA, CANCELADA
    }

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "numero", length = 30, nullable = false)
    private String numero;

    /** Protocolo do chamado (informado ao cliente). */
    @Column(name = "protocolo", length = 30)
    private String protocolo;

    @Column(name = "equipamento_id", length = 36, nullable = false)
    private String equipamentoId;

    @Column(name = "status", length = 30, nullable = false)
    private String status;

    @Column(name = "descricao", length = 500)
    private String descricao;

    /** Diagnóstico do técnico (preenchido no orçamento). */
    @Column(name = "diagnostico", length = 2000)
    private String diagnostico;

    /** Valor da mão de obra (compõe o total do orçamento). */
    @Column(name = "mao_de_obra", precision = 18, scale = 2)
    private BigDecimal maoDeObra = BigDecimal.ZERO;

    /** Origem do chamado (WhatsApp, Instagram, Facebook, Telefone, Site). */
    @Column(name = "origem", length = 30)
    private String origem;

    /** Técnico responsável pela execução (distribuído pela gerência). */
    @Column(name = "tecnico_id", length = 36)
    private String tecnicoId;

    /** Cliente dono da aeronave (acompanha e aprova pelo app). */
    @Column(name = "cliente_id", length = 36)
    private String clienteId;

    @Column(name = "orcamento_aprovado_em")
    private LocalDateTime orcamentoAprovadoEm;

    @Column(name = "adicionais_aprovados_em")
    private LocalDateTime adicionaisAprovadosEm;

    @Column(name = "aberta_em", nullable = false)
    private LocalDateTime abertaEm;

    @Column(name = "concluida_em")
    private LocalDateTime concluidaEm;

    protected OrdemServico() {
    }

    public static OrdemServico abrir(String tenantId, String numero, String equipamentoId, String descricao) {
        OrdemServico os = new OrdemServico();
        os.id = UUID.randomUUID().toString();
        os.tenantId = tenantId;
        os.numero = numero;
        os.protocolo = numero;
        os.equipamentoId = equipamentoId;
        os.descricao = descricao;
        os.status = Status.FILA_DE_ESPERA.name();
        os.maoDeObra = BigDecimal.ZERO;
        os.abertaEm = LocalDateTime.now();
        return os;
    }

    public void atribuirTecnico(String tecnicoId) {
        this.tecnicoId = tecnicoId;
    }

    public void vincularCliente(String clienteId) {
        this.clienteId = clienteId;
    }

    public void definirOrigem(String origem) {
        this.origem = origem;
    }

    /** Técnico inicia a montagem do orçamento (sai da fila de espera). */
    public void iniciarOrcamento() {
        exigirStatus("iniciar o orçamento", Status.FILA_DE_ESPERA);
        this.status = Status.ORCAMENTO.name();
    }

    /** Registra o diagnóstico e a mão de obra durante o orçamento/estágio 1. */
    public void registrarDiagnostico(String diagnostico, BigDecimal maoDeObra) {
        exigirStatus("registrar o diagnóstico", Status.ORCAMENTO, Status.ESTAGIO_1);
        if (diagnostico != null) {
            this.diagnostico = diagnostico;
        }
        if (maoDeObra != null) {
            if (maoDeObra.signum() < 0) {
                throw new BusinessException("A mão de obra não pode ser negativa");
            }
            this.maoDeObra = maoDeObra;
        }
    }

    /** Técnico envia o orçamento para aprovação do administrativo. */
    public void enviarParaAprovacao() {
        exigirStatus("enviar para aprovação", Status.ORCAMENTO);
        this.status = Status.AGUARDANDO_APROVACAO.name();
    }

    /** Administrativo aprova o orçamento inicial. */
    public void aprovar() {
        exigirStatus("aprovar o orçamento", Status.AGUARDANDO_APROVACAO);
        this.orcamentoAprovadoEm = LocalDateTime.now();
        this.status = Status.APROVADO.name();
    }

    /** Administrativo reprova o orçamento — volta para ajuste do técnico. */
    public void reprovar() {
        exigirStatus("reprovar o orçamento", Status.AGUARDANDO_APROVACAO);
        this.status = Status.ORCAMENTO.name();
    }

    /** Técnico inicia a manutenção após a liberação do administrativo. */
    public void iniciarManutencao() {
        exigirStatus("iniciar a manutenção", Status.APROVADO);
        this.status = Status.ESTAGIO_1.name();
    }

    /** Técnico identifica novos defeitos → envia o Estágio 2 para aprovação. */
    public void irParaEstagio2() {
        exigirStatus("ir para o Estágio 2", Status.ESTAGIO_1);
        this.status = Status.AGUARDANDO_APROVACAO_E2.name();
    }

    /** Administrativo aprova o novo orçamento do Estágio 2. */
    public void aprovarEstagio2() {
        exigirStatus("aprovar o Estágio 2", Status.AGUARDANDO_APROVACAO_E2);
        this.adicionaisAprovadosEm = LocalDateTime.now();
        this.status = Status.APROVADO_E2.name();
    }

    /** Administrativo reprova o Estágio 2 — volta ao Estágio 1. */
    public void reprovarEstagio2() {
        exigirStatus("reprovar o Estágio 2", Status.AGUARDANDO_APROVACAO_E2);
        this.status = Status.ESTAGIO_1.name();
    }

    /** Técnico inicia a manutenção do Estágio 2 (após liberação). */
    public void iniciarEstagio2() {
        exigirStatus("iniciar o Estágio 2", Status.APROVADO_E2);
        this.status = Status.ESTAGIO_2.name();
    }

    /** Conclui o serviço (a partir do Estágio 1 sem adicionais, ou do Estágio 2). */
    public void concluir() {
        exigirStatus("concluir o serviço", Status.ESTAGIO_1, Status.ESTAGIO_2);
        this.status = Status.CONCLUIDA.name();
        this.concluidaEm = LocalDateTime.now();
    }

    // --- Poderes do administrativo ------------------------------------------

    public void cancelar() {
        if (estaConcluida()) {
            throw new BusinessException("Uma OS concluída não pode ser cancelada — OS " + numero);
        }
        this.status = Status.CANCELADA.name();
    }

    public void reabrir() {
        if (!estaConcluida() && !Status.CANCELADA.name().equals(status)) {
            throw new BusinessException("Só é possível reabrir uma OS concluída ou cancelada — OS " + numero);
        }
        this.status = Status.FILA_DE_ESPERA.name();
        this.concluidaEm = null;
    }

    /** Alteração livre de estágio pelo administrativo (correção/continuidade). */
    public void definirStatus(Status novo) {
        this.status = novo.name();
        if (novo != Status.CONCLUIDA) {
            this.concluidaEm = null;
        }
    }

    private void exigirStatus(String acao, Status... esperados) {
        for (Status s : esperados) {
            if (s.name().equals(status)) {
                return;
            }
        }
        throw new BusinessException("Não é possível " + acao + " na situação atual ("
                + status + ") — OS " + numero);
    }

    // --- Consultas de estado ------------------------------------------------

    private static final Set<String> PERMITE_ITENS =
            Set.of(Status.ORCAMENTO.name(), Status.ESTAGIO_1.name());

    public boolean estaConcluida() {
        return Status.CONCLUIDA.name().equals(status);
    }

    public boolean emOrcamento() {
        return Status.ORCAMENTO.name().equals(status);
    }

    public boolean emEstagio1() {
        return Status.ESTAGIO_1.name().equals(status);
    }

    public boolean permiteEditarItens() {
        return PERMITE_ITENS.contains(status);
    }

    /** Estágio (1=inicial, 2=adicional) do item a incluir conforme o status. */
    public int estagioParaNovoItem() {
        if (emOrcamento()) {
            return 1;
        }
        if (emEstagio1()) {
            return 2;
        }
        throw new BusinessException("Peças só podem ser incluídas no Orçamento ou no Estágio 1 — OS "
                + numero + " está em " + status);
    }

    // --- Getters ------------------------------------------------------------

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getNumero() {
        return numero;
    }

    public String getProtocolo() {
        return protocolo;
    }

    public String getEquipamentoId() {
        return equipamentoId;
    }

    public String getStatus() {
        return status;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getDiagnostico() {
        return diagnostico;
    }

    public BigDecimal getMaoDeObra() {
        return maoDeObra == null ? BigDecimal.ZERO : maoDeObra;
    }

    public String getOrigem() {
        return origem;
    }

    public String getTecnicoId() {
        return tecnicoId;
    }

    public String getClienteId() {
        return clienteId;
    }

    public LocalDateTime getOrcamentoAprovadoEm() {
        return orcamentoAprovadoEm;
    }

    public LocalDateTime getAdicionaisAprovadosEm() {
        return adicionaisAprovadosEm;
    }

    public LocalDateTime getAbertaEm() {
        return abertaEm;
    }

    public LocalDateTime getConcluidaEm() {
        return concluidaEm;
    }
}
