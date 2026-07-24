package com.kairos.erp.identity.app;

import com.kairos.erp.identity.domain.Perfil;
import com.kairos.erp.identity.domain.Usuario;
import com.kairos.erp.tenancy.app.EmpresaService;
import com.kairos.erp.tenancy.domain.Empresa;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Onboarding público: cria a empresa (tenant) e o seu primeiro usuário
 * <strong>ADMIN</strong> numa única transação. É o único ponto onde uma empresa
 * nasce já com um administrador capaz de provisionar os demais usuários.
 *
 * <p>Coordenação direta entre os contextos {@code tenancy} e {@code identity} na
 * mesma transação, conforme ADR-0003 (evolui para eventos de domínio + outbox).</p>
 */
@Service
public class RegistroService {

    private final EmpresaService empresaService;
    private final UsuarioService usuarioService;

    public RegistroService(EmpresaService empresaService, UsuarioService usuarioService) {
        this.empresaService = empresaService;
        this.usuarioService = usuarioService;
    }

    public record Registro(Empresa empresa, Usuario admin) {
    }

    @Transactional
    public Registro registrar(String nomeEmpresa, String documento,
                              String nomeAdmin, String emailAdmin, String senhaAdmin) {
        Empresa empresa = empresaService.criar(nomeEmpresa, documento);
        Usuario admin = usuarioService.criar(empresa.getId(), nomeAdmin, emailAdmin, senhaAdmin, Perfil.ADMIN);
        return new Registro(empresa, admin);
    }
}
