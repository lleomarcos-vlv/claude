# Drone Kairós ERP — Frontend (Fase 3)

Painel web em **React 18 + TypeScript (Vite)**, conforme doc 11. Consome a API
do backend e demonstra a fatia vertical de ponta a ponta.

## Funcionalidades
- **Empresa (tenant):** criar/selecionar; o `tenantId` vai no header `X-Tenant-Id`.
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
Build verificado: **32 módulos, bundle ~154 kB (48 kB gzip)**.

## Notas
- Em dev, o Vite faz proxy de `/api` para `http://localhost:8080` (sem CORS).
  O backend também habilita CORS para `localhost:5173` (perfil de dev).
- Autenticação ainda não implementada (ver `../adr/0003-*`): o tenant é
  informado manualmente. UI de login entra na etapa de segurança.
