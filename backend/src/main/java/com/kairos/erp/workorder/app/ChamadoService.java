package com.kairos.erp.workorder.app;

import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.equipment.domain.Equipamento;
import com.kairos.erp.identity.app.UsuarioService;
import com.kairos.erp.identity.app.UsuarioService.ProvisaoCliente;
import com.kairos.erp.notification.app.NotificacaoService;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.tenant.TenantContext;
import com.kairos.erp.workorder.domain.OrdemServico;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Abertura de chamados pelo administrativo. A partir de um contato do cliente
 * (WhatsApp, Instagram, Facebook, Telefone, Site), provisiona automaticamente
 * tudo: cadastra o cliente (usuário + senha), registra a aeronave, gera a OS na
 * fila com protocolo e libera o painel do cliente.
 */
@Service
public class ChamadoService {

    private final UsuarioService usuarios;
    private final EquipamentoService equipamentos;
    private final OrdemServicoService ordens;
    private final AuditoriaService auditoria;
    private final NotificacaoService notificacoes;

    public ChamadoService(UsuarioService usuarios, EquipamentoService equipamentos,
                          OrdemServicoService ordens, AuditoriaService auditoria,
                          NotificacaoService notificacoes) {
        this.usuarios = usuarios;
        this.equipamentos = equipamentos;
        this.ordens = ordens;
        this.auditoria = auditoria;
        this.notificacoes = notificacoes;
    }

    public record Chamado(OrdemServico ordemServico, String protocolo, String clienteEmail,
                          String senhaGerada, boolean clienteNovo) {
    }

    @Transactional
    public Chamado criar(String nomeCliente, String emailCliente, String telefone,
                         String serialNumber, String modelo, String origem, String descricao) {
        if (nomeCliente == null || nomeCliente.isBlank()) {
            throw new BusinessException("Informe o nome do cliente");
        }
        if (serialNumber == null || serialNumber.isBlank() || modelo == null || modelo.isBlank()) {
            throw new BusinessException("Informe o Serial Number e o modelo da aeronave");
        }

        // 1) Cliente (usuário + senha). Sem e-mail, gera um login de acesso.
        String email = (emailCliente == null || emailCliente.isBlank())
                ? "cliente-" + UUID.randomUUID().toString().substring(0, 8) + "@chamado.local"
                : emailCliente;
        ProvisaoCliente prov = usuarios.provisionarCliente(TenantContext.require(), nomeCliente, email);

        // 2) Aeronave (registra se nova)
        Equipamento eq = equipamentos.obterOuRegistrar(serialNumber, modelo);

        // 3) OS na fila, vinculada ao cliente, com a origem do chamado
        String desc = (descricao == null || descricao.isBlank())
                ? "Chamado aberto via " + (origem == null ? "atendimento" : origem) : descricao;
        OrdemServico os = ordens.abrirChamado(eq.getId(), desc, prov.usuario().getId(), origem);

        auditoria.registrar("CHAMADO_ABERTO", "ordem_servico", os.getId(),
                os.getProtocolo() + " · " + nomeCliente + " · " + origem);
        notificacoes.registrar("CHAMADO_ABERTO",
                "Novo chamado " + os.getProtocolo() + " de " + nomeCliente + " (" + modelo + ") — via "
                        + (origem == null ? "atendimento" : origem));

        return new Chamado(os, os.getProtocolo(), prov.usuario().getEmail(),
                prov.senhaGerada(), prov.novo());
    }
}
