# Drone Kairós ERP — Frontend (Fase 3)

Painel web em **React 18 + TypeScript (Vite)**, conforme doc 11. Consome a API
do backend e demonstra a fatia vertical de ponta a ponta.

## Funcionalidades
- **Identidade e acesso (etapa 036):** criar conta (empresa + admin) ou **entrar**
  (e-mail/senha); o **JWT** é guardado e enviado em `Authorization: Bearer`. O
  perfil do usuário aparece no topo; 401 encerra a sessão e volta ao login.
- **Equipamentos:** listar, registrar por Serial Number, ver **histórico vitalício**.
- **Estoque (KSI):** listar, cadastrar item, dar entrada, ver **reposição sugerida**.
- **Ordens de Serviço:** abrir, adicionar peças, **concluir** (baixa automática + evento).

## Rodar em desenvolvimento
```bash
# 1) suba o backend (porta 8080) — ver ../backend/README.md
cd ../backend && mvn spring-boot:run

# 2) suba o frontend (porta 5173, com proxy /api -> :8080)
cd ../frontend
npm install
npm run dev
# abra http://localhost:5173
```

## Build de produção
```bash
npm run build   # typecheck (tsc) + bundle (vite) -> dist/
npm run preview # servir o build localmente
```
Build verificado: **32 módulos, bundle ~155 kB (49 kB gzip)**.

## Notas
- Em dev, o Vite faz proxy de `/api` para `http://localhost:8080` (sem CORS).
  O backend também habilita CORS para `localhost:5173` (perfil de dev).
- Autenticação por **JWT** (ver `../adr/0004-*`): o token da sessão fica no
  `localStorage` e o tenant vem do próprio token (claim) — não há mais header de
  tenant. Evolução: OIDC/MFA e *refresh tokens* conforme docs 10/14.
