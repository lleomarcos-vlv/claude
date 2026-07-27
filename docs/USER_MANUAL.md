# Manual do Usuário — Conlor PC Cleaner

Bem-vindo! Este guia explica cada parte da interface e como usar a ferramenta com segurança.

---

## 1. Visão geral da tela

```
┌───────────────────────────────────────────────────────────────────────────┐
│ 🧹 Conlor PC Cleaner            [⚠ admin]  ☐ Modo Simulação  ☑ Tema escuro │
├──────────────┬────────────────────────────────────────────────────────────┤
│  AÇÕES        │  [ Análise ] [ Arquivos grandes ] [ Duplicados ] [ Discos ] │
│  🔍 Analisar  │                                                            │
│  ✨ Limpeza   │   Cartões de resumo (recuperável, movível, duplicados)     │
│  📦 Transferir│   Lista de categorias de limpeza (com seleção)             │
│  🧨 Completa  │                                                            │
│  ↩️ Restaurar │                                                            │
│  ⚙️ Config.   │                                                            │
│               │                                                            │
│  💽 Sistema   │                                                            │
│  🔌 HD externo│                                                            │
├──────────────┴────────────────────────────────────────────────────────────┤
│ Status .....................................................  42%          │
│ ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░              │
├───────────────────────────────────────────────────────────────────────────┤
│ LOGS EM TEMPO REAL                                                          │
│ [10:32:01] OK    Análise concluída em 4.2s.                                │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Cabeçalho**: título, aviso de administrador (com botão para elevar), **Modo Simulação** e
  alternância de **tema claro/escuro**.
- **Barra lateral**: botões de ação e cartões dos discos (interno e HD externo).
- **Área central**: abas com os resultados.
- **Rodapé**: status + barra de progresso.
- **Console de logs**: histórico em tempo real, colorido por severidade.

---

## 2. Os botões

### 🔍 Analisar PC
Examina o computador **sem alterar nada** e preenche as abas:
- **Análise**: categorias de temporários/cache com tamanho e caixas de seleção.
- **Arquivos grandes**: arquivos pessoais grandes que poderiam ir para o HD externo, com o
  motivo (ex.: *"Não utilizado há 210 dias"*, *"Imagem de disco (ISO)"*).
- **Duplicados**: grupos de arquivos idênticos (SHA-256).
- **Discos & Apps**: saúde SMART dos discos e espaço de caches de VMs, IDEs e jogos (informativo).

### ✨ Limpeza Inteligente
Remove **apenas** as categorias marcadas que são seguras (temporários e caches). Rápida e, na
maioria dos casos, **não exige administrador**. Ideal para uso frequente.

### 🧨 Limpeza Completa
Faz tudo da Inteligente e ainda executa utilitários do Windows: **cleanmgr**, **DISM**,
**SFC**, **flush de DNS** e caches que exigem administrador (Windows Update, Prefetch). Pode
levar vários minutos. Pede confirmação antes de iniciar.

### 📦 Transferir para HD Externo
Move os **arquivos grandes marcados** (aba "Arquivos grandes") para o HD externo selecionado,
organizados em `Backup_PC` (Vídeos, Fotos, Documentos, ISOs, Compactados, etc.). Os arquivos são
**movidos** (não copiados) e a operação é **reversível**. Pede confirmação e verifica espaço livre.

### ↩️ Restaurar Backup
Desfaz a **última transferência**: devolve os arquivos do HD externo às suas pastas originais,
usando o manifesto salvo automaticamente.

### ⚙️ Configurações
Abre a janela de ajustes (veja a seção 5).

---

## 3. Modo Simulação (recomendado na 1ª vez)

Ative **Modo Simulação** no cabeçalho. Com ele ligado, **nenhum arquivo é apagado ou movido** —
a ferramenta apenas calcula e mostra exatamente o que faria, com relatório completo. Perfeito
para conhecer o comportamento sem riscos.

---

## 4. Seleção do HD externo

No painel **🔌 HD externo** da barra lateral:
1. Conecte o dispositivo.
2. Clique em **🔄** para atualizar.
3. Escolha a unidade na lista. Aparecem capacidade e espaço livre.

A ferramenta **detecta automaticamente** discos externos/removíveis e nunca considera o disco do
sistema como destino de transferência.

---

## 5. Configurações

| Ajuste | O que faz |
|--------|-----------|
| **Modo Simulação** | Liga/desliga a simulação global. |
| **Criar ponto de restauração** | Tenta um ponto de restauração antes de operações grandes (requer admin). |
| **Detectar duplicados** | Ativa a verificação SHA-256 na análise (mais lenta). |
| **Tamanho mínimo para mover (MB)** | Só sugere mover arquivos acima desse tamanho (padrão 100). |
| **"Não utilizado" após (dias)** | Marca como não usado arquivos sem acesso há N dias (padrão 90). |
| **HD externo padrão** | Unidade pré-selecionada (ex.: `E:\`). |
| **Comprimir antes de transferir** | Compacta arquivos muito grandes em `.zip` no destino. |
| **Pastas protegidas** | Pastas que **nunca** serão tocadas (além das já protegidas). |
| **Tipos de arquivo extras** | Extensões adicionais consideradas "movíveis". |
| **Agendamento** | Limpeza inteligente automática (diária/semanal/mensal) via Agendador do Windows. |

Também é possível **Exportar** e **Importar** todas as configurações em JSON, e abrir a pasta de
**Logs**.

---

## 6. Relatórios

Ao final de cada limpeza ou transferência, três relatórios são gerados em
`%LOCALAPPDATA%\ConlorPCCleaner\Reports\`:
- **HTML** — visual, com cartões e tabelas (abre no navegador).
- **PDF** — resumo portátil.
- **TXT** — texto puro.

Cada relatório traz: espaço liberado, arquivos limpos, arquivos movidos, tempo gasto, HD
utilizado e **possíveis melhorias**. Use os botões **📄 Relatório** e **📁 Pasta** na barra lateral.

---

## 7. Perguntas frequentes

**A ferramenta pode apagar minhas fotos/documentos?**
Não automaticamente. Arquivos pessoais só são **movidos** para o HD externo, com sua confirmação,
e você pode desfazer com "Restaurar Backup".

**Preciso ser administrador?**
Não para a Limpeza Inteligente. Para DISM/SFC/Windows Update/Prefetch, clique em
"Reiniciar como Admin".

**Limpar o cache do navegador me desconecta dos sites?**
A limpeza remove apenas arquivos de cache; históricos, senhas e cookies não são alvo.

**Como cancelar uma operação em andamento?**
Clique em **⛔ Cancelar operação** (aparece na barra lateral enquanto algo executa).

**Onde vejo o que aconteceu?**
No console de **Logs em tempo real** e nos arquivos em `%LOCALAPPDATA%\ConlorPCCleaner\Logs\`.
