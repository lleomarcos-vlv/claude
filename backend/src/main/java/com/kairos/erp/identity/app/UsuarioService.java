package com.kairos.erp.identity.app;

import com.kairos.erp.identity.domain.Perfil;
import com.kairos.erp.identity.domain.Usuario;
import com.kairos.erp.identity.domain.UsuarioRepository;
import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.tenant.TenantContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Ciclo de vida de usuários (provisionamento e consulta) por tenant.
 * A senha é cifrada aqui (BCrypt) antes de chegar ao domínio.
 */
@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoria;

    public UsuarioService(UsuarioRepository repository, PasswordEncoder passwordEncoder,
                          AuditoriaService auditoria) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.auditoria = auditoria;
    }

    @Transactional
    public Usuario criar(String tenantId, String nome, String email, String senha, Perfil perfil) {
        String normalizado = email.trim().toLowerCase();
        if (repository.existsByEmail(normalizado)) {
            throw new BusinessException("Já existe um usuário com o e-mail " + normalizado);
        }
        Usuario u = Usuario.novo(tenantId, nome, normalizado, passwordEncoder.encode(senha), perfil);
        Usuario salvo = repository.save(u);
        auditoria.registrar("USUARIO_CRIADO", "usuario", salvo.getId(), normalizado + " (" + perfil + ")");
        return salvo;
    }

    @Transactional(readOnly = true)
    public List<Usuario> listar(String tenantId) {
        return repository.findByTenantIdOrderByCriadoEmAsc(tenantId);
    }

    private Usuario buscar(String id) {
        return repository.findById(id)
                .filter(u -> u.getTenantId().equals(TenantContext.require()))
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado: " + id));
    }

    @Transactional
    public Usuario bloquear(String id) {
        Usuario u = buscar(id);
        u.bloquear();
        auditoria.registrar("USUARIO_BLOQUEADO", "usuario", id, u.getEmail());
        return repository.save(u);
    }

    @Transactional
    public Usuario reativar(String id) {
        Usuario u = buscar(id);
        u.reativar();
        auditoria.registrar("USUARIO_REATIVADO", "usuario", id, u.getEmail());
        return repository.save(u);
    }

    @Transactional
    public Usuario alterarPerfil(String id, Perfil perfil) {
        Usuario u = buscar(id);
        u.alterarPerfil(perfil);
        auditoria.registrar("USUARIO_PERFIL_ALTERADO", "usuario", id, u.getEmail() + " → " + perfil);
        return repository.save(u);
    }

    @Transactional
    public Usuario editar(String id, String nome, Perfil perfil) {
        Usuario u = buscar(id);
        u.renomear(nome);
        if (perfil != null) {
            u.alterarPerfil(perfil);
        }
        auditoria.registrar("USUARIO_EDITADO", "usuario", id, u.getEmail());
        return repository.save(u);
    }

    /** Redefine a senha e devolve a nova senha em claro (para entrega ao usuário). */
    @Transactional
    public String redefinirSenha(String id) {
        Usuario u = buscar(id);
        String nova = gerarSenha();
        u.redefinirSenha(passwordEncoder.encode(nova));
        repository.save(u);
        auditoria.registrar("USUARIO_SENHA_REDEFINIDA", "usuario", id, u.getEmail());
        return nova;
    }

    @Transactional
    public void excluir(String id) {
        Usuario u = buscar(id);
        auditoria.registrar("USUARIO_EXCLUIDO", "usuario", id, u.getEmail());
        repository.delete(u);
    }

    /** Provisão de um cliente (usuário CLIENTE) na abertura de chamado. */
    public record ProvisaoCliente(Usuario usuario, String senhaGerada, boolean novo) {
    }

    @Transactional
    public ProvisaoCliente provisionarCliente(String tenantId, String nome, String email) {
        String normalizado = email.trim().toLowerCase();
        Optional<Usuario> existente = repository.findByEmail(normalizado);
        if (existente.isPresent()) {
            return new ProvisaoCliente(existente.get(), null, false);
        }
        String senha = gerarSenha();
        Usuario u = Usuario.novo(tenantId, nome, normalizado, passwordEncoder.encode(senha), Perfil.CLIENTE);
        Usuario salvo = repository.save(u);
        auditoria.registrar("CLIENTE_PROVISIONADO", "usuario", salvo.getId(), normalizado);
        return new ProvisaoCliente(salvo, senha, true);
    }

    private static String gerarSenha() {
        return "geoag-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
