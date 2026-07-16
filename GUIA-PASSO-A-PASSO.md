# 📱 Guia passo a passo — Barbearia do Daniel

Este guia explica, do zero, como **rodar**, **instalar no Android**, **usar**
e **publicar** o aplicativo de agendamento da barbearia.

> **Como o app funciona:** é um único aplicativo com dois perfis. O barbeiro
> instala e escolhe **"Sou o barbeiro"**; cada cliente instala o mesmo APK e
> escolhe **"Sou cliente"**. O cliente agenda o corte e o horário aparece
> **preenchido na agenda do barbeiro**, que então **confirma** — e o status
> muda para "Confirmado" no app do cliente.
>
> As telas do fluxo completo estão na pasta [`capturas-da-simulacao/`](capturas-da-simulacao/).

---

## Parte 1 — Ver o app rodando em 5 minutos (sem gerar APK)

Você só precisa de um computador e do celular na **mesma rede Wi-Fi**.

1. **Instale o Node.js** no computador: baixe a versão LTS em
   <https://nodejs.org> e instale (avançar, avançar, concluir).
2. **Extraia o ZIP** do projeto em uma pasta (ex.: `barbearia-app`).
3. Abra o **terminal** (no Windows: abra a pasta, clique na barra de endereço,
   digite `cmd` e Enter) e rode:

   ```bash
   npm install
   npx expo start
   ```

4. No celular Android, instale o app **Expo Go** (Play Store).
5. Abra o Expo Go e **escaneie o QR code** que apareceu no terminal.
   O app da barbearia abre na hora. ✅

> Se o QR code não conectar, rode `npx expo start --tunnel`.

---

## Parte 2 — Gerar o APK (arquivo que instala em qualquer Android)

O APK é gerado **na nuvem, de graça**, pelo serviço oficial do Expo (EAS).
Não precisa de Android Studio.

1. Crie uma conta gratuita em <https://expo.dev> (e-mail e senha).
2. No terminal, dentro da pasta do projeto:

   ```bash
   npm install -g eas-cli
   eas login
   eas build -p android --profile preview
   ```

3. Na primeira vez, o EAS faz algumas perguntas — pode aceitar as respostas
   padrão (Enter). Ele mesmo cria a chave de assinatura do app.
4. Aguarde o build terminar (10 a 20 minutos). Ao final aparece um **link**;
   abra-o e clique em **Download** para baixar o arquivo `.apk`.
5. **Distribua o APK**: mande o arquivo pelo WhatsApp, Google Drive ou cabo
   USB para o seu celular e para os celulares dos clientes.
6. No celular, toque no arquivo para instalar. Se o Android avisar sobre
   "fontes desconhecidas", toque em **Configurações → Permitir desta fonte**
   e volte para concluir a instalação. ✅

---

## Parte 3 — Como usar o app

### 📋 No celular do barbeiro (uma única vez)

1. Abra o app e toque em **"Sou o barbeiro"**.
2. Vá na aba **Ajustes** e configure:
   - Nome da barbearia e nome do barbeiro;
   - **Dias com agenda aberta** (toque nos dias para ligar/desligar);
   - Horário de **abertura** e **fechamento** (botões − e +);
   - **Duração de cada horário** (30, 45 ou 60 min);
   - Toque em **Salvar agenda**.
3. Pronto — a agenda está aberta. Na aba **Agenda**:
   - Cada horário marcado aparece **preenchido** com nome, serviço e
     telefone do cliente;
   - Horários novos chegam como **"Aguardando confirmação"** (borda amarela
     e um pontinho no dia) — toque em **"✓ Confirmar horário"**;
   - Também é possível **Cancelar** um horário (ele volta a ficar livre).

### ✂️ No celular do cliente

1. Abra o app e toque em **"Sou cliente"**.
2. Digite **nome** e **WhatsApp** (o barbeiro verá esses dados) e toque em
   **Começar** — isso só é pedido na primeira vez.
3. Agende em 3 toques:
   1. Escolha o **serviço** (corte, barba ou corte + barba);
   2. Escolha o **dia** (dias fechados aparecem apagados);
   3. Escolha um **horário livre** (ocupados ficam riscados);
   4. Confira o resumo e toque em **Confirmar**.
4. Na aba **Meus horários**, acompanhe o status:
   - 🟡 **Aguardando confirmação** — o barbeiro ainda não confirmou;
   - 🟢 **Confirmado** — horário garantido;
   - O cliente pode **cancelar** um horário futuro se precisar.

---

## Parte 4 — Ligar a sincronização entre os celulares (Firebase — grátis)

Sem esta etapa o app funciona em **modo demonstração**: os dados ficam só no
aparelho. Para o agendamento do cliente chegar **na hora** no celular do
barbeiro, ative o Firebase (leva ~10 minutos):

1. Acesse <https://console.firebase.google.com> com uma conta Google e
   clique em **Criar projeto** (pode desativar o Analytics).
2. Dentro do projeto, clique no ícone **`</>` (Web)** para adicionar um app,
   dê um apelido qualquer e clique em **Registrar app**.
3. O Firebase mostra um trecho de código com `const firebaseConfig = {...}`.
   **Copie os valores** (apiKey, authDomain, projectId, storageBucket,
   messagingSenderId, appId).
4. Abra o arquivo **`src/services/firebaseConfig.ts`** do projeto e substitua
   os valores de exemplo pelos copiados. Salve.
5. No menu lateral do console: **Criação → Firestore Database → Criar banco
   de dados** (modo de produção, local `southamerica-east1`).
6. Na aba **Regras** do Firestore, cole e publique:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /agendamentos/{id} {
         allow read, write: if true;
       }
       match /config/{id} {
         allow read, write: if true;
       }
     }
   }
   ```

7. Gere o APK de novo (Parte 2) e reinstale nos celulares. Pronto: agora
   cliente e barbeiro ficam sincronizados em tempo real, cada um no seu
   celular, em qualquer lugar. ✅

> A faixa "Modo demonstração" some sozinha quando o Firebase está
> configurado. O app já impede que dois clientes marquem o mesmo horário.

---

## Parte 5 — Publicar na Google Play Store (opcional)

Para não precisar mandar o APK manualmente, você pode publicar o app na loja:

1. **Crie a conta de desenvolvedor** em <https://play.google.com/console>
   (taxa única de US$ 25 cobrada pelo Google).
2. Gere o pacote de loja (`.aab` em vez de `.apk`):

   ```bash
   eas build -p android --profile production
   ```

3. No Play Console, clique em **Criar app**, preencha nome
   ("Barbearia do Daniel"), idioma e categoria (Beleza/Estilo de vida).
4. Complete as fichas obrigatórias (o console vai guiando):
   - **Ficha da loja**: descrição curta/longa, ícone 512×512 e pelo menos
     2 capturas de tela (use as da pasta `capturas-da-simulacao/`);
   - **Classificação de conteúdo** (questionário simples);
   - **Política de privacidade** (uma página simples dizendo que o app
     armazena apenas nome e telefone para fins de agendamento);
   - **Público-alvo** (maiores de 13 anos).
5. Em **Versões → Produção → Criar nova versão**, envie o arquivo `.aab`
   baixado do EAS e clique em **Enviar para revisão**.
6. O Google revisa em alguns dias e o app fica disponível na Play Store. 🎉

**Para atualizar o app no futuro:** aumente o `versionCode` (e o `version`)
no arquivo `app.json`, gere um novo build e envie a nova versão no console.

---

## Problemas comuns

| Problema | Solução |
| --- | --- |
| QR code do Expo não conecta | Celular e computador na mesma rede Wi-Fi, ou use `npx expo start --tunnel` |
| Android bloqueia a instalação do APK | Permita "instalar apps de fontes desconhecidas" para o app por onde você abriu o arquivo |
| Agendamento não aparece no outro celular | O app está em modo demonstração — configure o Firebase (Parte 4) e gere o APK de novo |
| Quero mudar serviços e preços | Edite a lista `SERVICES` em `src/types.ts` e gere o APK de novo |
| Quero mudar o nome "Daniel" | Aba **Ajustes** no perfil do barbeiro (sem mexer em código) |
