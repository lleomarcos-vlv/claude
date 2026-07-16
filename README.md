# 💈 Barbearia do Daniel — Agendamento de horários

Aplicativo Android (React Native + Expo) para barbearia, com **dois perfis no
mesmo app**:

- **Cliente** — escolhe o serviço (corte, barba ou corte + barba), o dia e um
  horário livre, e confirma o agendamento.
- **Barbeiro** — deixa a agenda aberta (dias e horários de atendimento) e vê
  cada horário marcado aparecer **preenchido na agenda**, com nome, serviço e
  telefone do cliente, podendo **confirmar** ou cancelar. Quando o barbeiro
  confirma, o status muda para "Confirmado" no app do cliente.

O barbeiro instala o app e escolhe **"Sou o barbeiro"**; o cliente instala o
mesmo APK e escolhe **"Sou cliente"**. Um único APK, dois aplicativos na
prática — mais simples de distribuir.

## Como rodar no celular (desenvolvimento)

```bash
npm install
npx expo start
```

Escaneie o QR code com o app [Expo Go](https://expo.dev/go) (Android).

## Como gerar o APK para instalar no Android

Jeito mais fácil, usando o serviço gratuito EAS Build (na nuvem, não precisa
de Android Studio):

```bash
npm install -g eas-cli
eas login          # crie uma conta grátis em https://expo.dev se não tiver
eas build -p android --profile preview
```

Ao final, o EAS mostra um link para **baixar o APK** — é esse arquivo que o
barbeiro manda para os clientes instalarem (ou publica na Play Store usando o
perfil `production`, que gera um `.aab`).

Alternativa local (precisa do Android Studio / SDK instalado):

```bash
npx expo run:android --variant release
```

## Sincronização entre os aparelhos (Firebase)

Sem configurar nada, o app roda em **modo demonstração**: os dados ficam
salvos no próprio aparelho (na web, duas abas do navegador se comportam como
dois aparelhos — é assim que a simulação funciona).

Para o agendamento do cliente chegar **em tempo real** no celular do barbeiro,
ative o Firebase (grátis):

1. Crie um projeto em <https://console.firebase.google.com>.
2. Adicione um **app Web** ao projeto e copie o objeto `firebaseConfig`.
3. Cole os valores em [`src/services/firebaseConfig.ts`](src/services/firebaseConfig.ts).
4. No console, crie um banco **Cloud Firestore** e publique estas regras
   (Firestore → Regras):

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

   > Essas regras deixam a agenda aberta para qualquer pessoa com o app.
   > Para produção, recomenda-se ativar o Firebase Auth (login anônimo) e
   > restringir as regras.

5. Gere o APK novamente. Pronto: o cliente marca no celular dele e o horário
   aparece preenchido na hora na agenda do barbeiro.

## Como funciona por dentro

| Pasta/arquivo | O que faz |
| --- | --- |
| `App.tsx` | Escolha de perfil (cliente/barbeiro) e inicialização |
| `src/screens/client/ClientApp.tsx` | Fluxo do cliente: serviço → dia → horário → confirmação + acompanhamento |
| `src/screens/barber/BarberApp.tsx` | Agenda do barbeiro (horários preenchidos, confirmar/cancelar) e ajustes (dias abertos, expediente, duração do corte) |
| `src/services/localStore.ts` | Modo demonstração: dados no aparelho (AsyncStorage) |
| `src/services/firebaseStore.ts` | Produção: Cloud Firestore em tempo real, com trava contra dois clientes marcarem o mesmo horário |
| `src/services/store.ts` | Interface comum entre os dois modos |

Regras de negócio principais:

- Cada horário marcado nasce **"Aguardando confirmação"** e já bloqueia o
  horário para os demais clientes.
- O barbeiro **confirma** (vira "Confirmado" no app do cliente) ou cancela.
- O cliente pode cancelar horários futuros; horários cancelados voltam a
  ficar livres.
- No Firestore, a criação usa transação com id determinístico
  (`2026-07-18_14-00`), impedindo agendamento duplo no mesmo horário.

## Simulação (web)

```bash
npx expo start --web
```

- Abra `http://localhost:8081/?perfil=cliente` em uma aba (celular do cliente)
- Abra `http://localhost:8081/?perfil=barbeiro` em outra aba (celular do barbeiro)

Marque um horário como cliente e veja o horário aparecer preenchido na agenda
do barbeiro, em tempo real.
