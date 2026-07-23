# Barbearia — App de Agendamento

Três arquivos HTML independentes (funcionam abrindo direto no navegador, sem servidor).
Os dados sincronizam em tempo real entre o app do cliente e o painel: instantâneo no
mesmo aparelho (localStorage + BroadcastChannel) e entre aparelhos via MQTT público
quando há internet. Ambos precisam usar o **mesmo código de loja** (`shopId`).

## Arquivos

- **`cliente.html`** — app do cliente: agenda serviço, dia e horário; escolhe o barbeiro
  (opcional); acompanha o status do agendamento.
- **`barbeiro.html`** — painel do dono/administrador (agenda, clientes, barbeiros,
  produtos, avisos e ajustes).
- **`gerador.html`** — gera versões personalizadas do app do cliente e do painel
  (nome, cores, serviços etc.). Ele embute os outros dois arquivos como modelo.

## Novidades desta versão

- **Fundo preto** em todos os apps para melhor visualização (mantendo o dourado da marca).
- **Barbeiros e comissão** (painel → aba *Barbeiros*): cadastre cada barbeiro com a sua
  porcentagem. A comissão é **calculada automaticamente** a partir dos atendimentos
  concluídos e das vendas de produtos no mês. É possível atribuir o barbeiro no encaixe,
  direto no card da agenda ou ao concluir o atendimento.
- **Mercado Pago (opcional)** (painel → aba *Ajustes*): ative e cole o seu link de
  pagamento. Um botão **💳 Cobrar** passa a aparecer nos agendamentos, enviando o valor e
  o link pelo WhatsApp.
- **Disparo de mensagens** (painel → aba *Avisos*): envie a mesma mensagem para vários
  clientes no WhatsApp (todos, sumidos há 30+ dias, ou a agenda de amanhã), com
  personalização por `{nome}`.
- **Lembrete automático** (painel → aba *Ajustes*): ligue/desligue e escolha avisar
  **1 hora** ou **30 minutos** antes do horário. Com o painel aberto, o app avisa (som +
  alerta + notificação) quando está chegando a hora e já prepara a mensagem do cliente
  para enviar com um toque.

> Observação: por serem apps 100% no navegador (sem servidor), o WhatsApp é sempre aberto
> com a mensagem pronta para envio com um toque — o disparo real do WhatsApp depende
> do envio pelo aparelho. O lembrete automático funciona enquanto o painel estiver aberto.
