package com.kairos.erp.notification.web;

import com.kairos.erp.notification.app.NotificacaoService;
import com.kairos.erp.notification.domain.Notificacao;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/** Central de notificações do tenant (etapa 051). */
@RestController
@RequestMapping("/api/v1/notificacoes")
public class NotificacaoController {

    private final NotificacaoService service;

    public NotificacaoController(NotificacaoService service) {
        this.service = service;
    }

    public record NotificacaoResponse(String id, String tipo, String mensagem,
                                      boolean lida, LocalDateTime criadoEm) {
        static NotificacaoResponse of(Notificacao n) {
            return new NotificacaoResponse(n.getId(), n.getTipo(), n.getMensagem(), n.isLida(), n.getCriadoEm());
        }
    }

    public record CentralResponse(long naoLidas, List<NotificacaoResponse> notificacoes) {
    }

    @GetMapping
    public CentralResponse listar(@RequestParam(defaultValue = "30") int limite) {
        int seguro = Math.max(1, Math.min(limite, 200));
        List<NotificacaoResponse> itens = service.listar(seguro).stream()
                .map(NotificacaoResponse::of).toList();
        return new CentralResponse(service.naoLidas(), itens);
    }

    @PostMapping("/{id}/lida")
    public void marcarLida(@PathVariable String id) {
        service.marcarLida(id);
    }

    @PostMapping("/marcar-todas-lidas")
    public void marcarTodasLidas() {
        service.marcarTodasLidas();
    }
}
