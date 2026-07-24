package com.kairos.erp.document.app;

import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.document.domain.Documento;
import com.kairos.erp.document.domain.DocumentoRepository;
import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.List;

/**
 * Documentos anexados a equipamentos (etapa 052). Cada anexo é registrado no
 * histórico vitalício do equipamento e na auditoria.
 */
@Service
public class DocumentoService {

    /** Limite por arquivo (5 MB). Mantém o walking skeleton simples e seguro. */
    static final long MAX_BYTES = 5L * 1024 * 1024;

    private final DocumentoRepository repository;
    private final EquipamentoService equipamentos;
    private final AuditoriaService auditoria;

    public DocumentoService(DocumentoRepository repository, EquipamentoService equipamentos,
                            AuditoriaService auditoria) {
        this.repository = repository;
        this.equipamentos = equipamentos;
        this.auditoria = auditoria;
    }

    @Transactional
    public Documento anexar(String equipamentoId, String nome, String tipoConteudo, byte[] conteudo) {
        equipamentos.buscar(equipamentoId); // valida existência + tenant
        if (conteudo == null || conteudo.length == 0) {
            throw new BusinessException("Arquivo vazio");
        }
        if (conteudo.length > MAX_BYTES) {
            throw new BusinessException("Arquivo excede o limite de 5 MB");
        }
        String tenant = TenantContext.require();
        String b64 = Base64.getEncoder().encodeToString(conteudo);
        Documento d = repository.save(Documento.novo(tenant, equipamentoId, nome,
                tipoConteudo == null ? "application/octet-stream" : tipoConteudo, conteudo.length, b64));

        equipamentos.registrarEvento(equipamentoId, "DOCUMENTO",
                "Documento anexado: " + nome, "{\"nome\":\"" + nome + "\"}");
        auditoria.registrar("DOCUMENTO_ANEXADO", "equipamento", equipamentoId, nome);
        return d;
    }

    @Transactional(readOnly = true)
    public List<Documento> listar(String equipamentoId) {
        equipamentos.buscar(equipamentoId); // valida existência + tenant
        return repository.findByEquipamentoIdAndTenantIdOrderByCriadoEmDesc(equipamentoId, TenantContext.require());
    }

    @Transactional(readOnly = true)
    public Documento baixar(String documentoId) {
        return repository.findByIdAndTenantId(documentoId, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Documento não encontrado: " + documentoId));
    }

    public byte[] conteudo(Documento d) {
        return Base64.getDecoder().decode(d.getConteudoB64());
    }
}
