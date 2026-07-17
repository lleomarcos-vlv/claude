# 📅 Apps de Agendamento — 9 arquivos HTML

Nove aplicativos completos, cada um em **um único arquivo HTML** — é só abrir no navegador do celular ou computador. Não precisa instalar nada, não precisa de servidor.

## Os 9 arquivos

| # | Arquivo | O que é |
|---|---------|---------|
| 1 | `1-barbearia-cliente.html` | 💈 App do **cliente** da barbearia: agenda corte/barba em tempo real |
| 2 | `2-barbearia-barbeiro.html` | 💈 App do **barbeiro**: agenda ao vivo, próximo cliente com contagem, lembretes de WhatsApp, produtos com comissão, chamada de horários livres, comunicados/viagem |
| 3 | `3-barbearia-gerador.html` | ⚙️ **Gerador**: troca foto, nome, ícone, chamada "Cortar cabelo", cores e serviços — e baixa os arquivos 1 e 2 personalizados |
| 4 | `4-salao-cliente.html` | 💅 Versão feminina do app do cliente (salão/studio de beleza) |
| 5 | `5-salao-profissional.html` | 💅 Versão feminina do painel |
| 6 | `6-salao-gerador.html` | ⚙️ Gerador da versão feminina |
| 7 | `7-petshop-cliente.html` | 🐾 App do tutor: banho/tosa com porte P/M/G, cão ou gato, leva-e-traz, perfume, e pedido de **hotelzinho** |
| 8 | `8-petshop-painel.html` | 🐾 App do petshop: agendamentos ao vivo, hospedagem, fidelidade com mensagem automática, **certidão de nascimento do pet**, produtos, comunicados |
| 9 | `9-petshop-gerador.html` | ⚙️ Gerador do petshop: troca só o logotipo (e o que mais quiser) e baixa os arquivos 7 e 8 |

## Como testar agora (2 minutos)

1. Abra o arquivo **1** em uma aba e o arquivo **2** em outra aba do mesmo navegador.
2. Agende um horário na aba do cliente.
3. Em segundos ele aparece na aba do barbeiro 🔔 — confirme e veja o status mudar na aba do cliente.

## Como funciona o tempo real

- **No mesmo aparelho/navegador**: sincroniza sozinho, até sem internet.
- **Entre aparelhos diferentes** (celular do cliente ↔ celular do barbeiro): os dois precisam estar com **internet** (o wifi do estabelecimento serve). Os apps se encontram automaticamente pelo **código da loja** (veja em ⚙️ Ajustes) usando um serviço público de mensagens (MQTT) — nada para configurar.
- A bolinha no topo mostra o estado: 🟢 tempo real conectado · 🟡 modo local.
- Dica de teste: adicione `?loja=meu-teste-123` no fim do endereço para simular outra loja.

## WhatsApp

Páginas HTML não podem enviar WhatsApp sozinhas (o WhatsApp não permite). Por isso os apps **preparam a mensagem pronta** — lembrete de véspera, fidelidade, divulgação de horários, produtos — e enviam com **um toque** pelo `wa.me`. Com 1 dia de antecedência, o painel avisa e lista os lembretes pendentes ao abrir.

## Geradores (arquivos 3, 6 e 9)

1. Abra o gerador, troque a **foto de perfil/logotipo**, nome, WhatsApp, chamada do botão, cores e serviços.
2. Toque em **Gerar aplicativos** e baixe os 2 arquivos prontos.
3. Envie o arquivo do cliente para os clientes (WhatsApp, site, etc.); o do painel fica só com você.
4. **Importante**: para atualizar apps que já estão em uso sem perder os agendamentos, mantenha o mesmo **código da loja**.

💡 A foto, os serviços e os horários também podem ser trocados **depois**, direto no painel (⚙️ Ajustes) — a mudança chega ao app dos clientes em tempo real, sem gerar arquivos novos.

## Avisos honestos

- Os dados ficam salvos no navegador de cada aparelho e trafegam por um servidor MQTT **público e gratuito** — ótimo para demonstração e uso leve, mas sem garantia nem privacidade forte. Evite dados sensíveis.
- Para um negócio rodando a todo vapor, o caminho profissional é ligar os apps a um banco como o Firebase (grátis) ou um servidor próprio — a estrutura dos arquivos já foi pensada para essa evolução.
- Se limpar os dados do navegador, os agendamentos daquele aparelho são apagados (os outros aparelhos reenviam o que tiverem).
