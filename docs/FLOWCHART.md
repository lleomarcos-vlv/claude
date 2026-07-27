# Fluxogramas — Conlor PC Cleaner

Diagramas em [Mermaid](https://mermaid.js.org/). O GitHub renderiza automaticamente.

## 1. Fluxo principal do usuário

```mermaid
flowchart TD
    A([Início]) --> B[Abrir Conlor PC Cleaner]
    B --> C{Modo Simulação?}
    C -- Sim --> D[Nada é alterado — apenas simula]
    C -- Não --> E[Operações reais]
    D --> F[🔍 Analisar PC]
    E --> F
    F --> G[Ver resultados nas abas]
    G --> H{O que fazer?}
    H -- Limpar --> I[✨ Limpeza Inteligente / 🧨 Completa]
    H -- Liberar espaço --> J[📦 Transferir para HD externo]
    H -- Desfazer --> K[↩️ Restaurar Backup]
    I --> L[Gerar relatório HTML/PDF/TXT]
    J --> L
    K --> L
    L --> M([Fim])
```

## 2. Decisão de segurança (apagar)

```mermaid
flowchart TD
    A[Arquivo candidato à exclusão] --> B{Está em pasta de<br/>temp/cache conhecida?}
    B -- Não --> X[❌ NÃO apaga]
    B -- Sim --> C{SafetyGuard.IsSafeToDelete?}
    C -- É pasta pessoal? --> X
    C -- Está na lista de exclusão? --> X
    C -- Seguro --> D{Modo Simulação?}
    D -- Sim --> E[Soma tamanho — não apaga]
    D -- Não --> F[Apaga com segurança<br/>ignora arquivos travados]
```

## 3. Decisão de segurança (mover para HD externo)

```mermaid
flowchart TD
    A[Arquivo pessoal grande] --> B{SafetyGuard.IsSafeToMove?}
    B -- É system-critical? --> X[❌ NÃO move]
    B -- É extensão de sistema<br/>DLL/SYS/DRV? --> X
    B -- Está excluído? --> X
    B -- Seguro --> C{Tamanho ≥ mínimo<br/>e tipo movível?}
    C -- Não --> Y[Ignora]
    C -- Sim --> D[Confirma com o usuário]
    D -- Cancelou --> Y
    D -- Confirmou --> E[Move para Backup_PC/&lt;categoria&gt;]
    E --> F[Grava entrada no manifesto]
    F --> G[Permite desfazer depois]
```

## 4. Pipeline de análise

```mermaid
flowchart LR
    S([Analisar]) --> C1[Temp/Cache<br/>categorias]
    S --> C2[Arquivos<br/>grandes]
    S --> C3[Duplicados<br/>SHA-256]
    S --> C4[Caches de<br/>apps/jogos]
    S --> C5[Saúde SMART]
    C1 --> R[ScanResult]
    C2 --> R
    C3 --> R
    C4 --> R
    C5 --> R
    R --> U[Atualiza UI + resumo]
```

## 5. Elevação sob demanda

```mermaid
flowchart TD
    A[Operação requer admin] --> B{Já é administrador?}
    B -- Sim --> C[Executa normalmente]
    B -- Não --> D[Marca etapa como 'ignorada']
    D --> E[UI mostra 'Reiniciar como Admin']
    E --> F{Usuário clicou?}
    F -- Sim --> G[Relança via runas + UAC]
    F -- Não --> H[Continua sem privilégios]
```
