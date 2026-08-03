# Boyd Turismo Tour — Sistema de Gestão

Gestão completa de uma empresa de turismo, bilíngue (🇧🇷 Português / 🇺🇸 English), em dois entregáveis:

| Entregável | O que é | Status |
|---|---|---|
| **[`index.html`](index.html)** | Sistema funcional, single-file, offline, pronto para usar hoje | ✅ Operacional |
| **[`docs/ESPECIFICACAO-ERP.md`](docs/ESPECIFICACAO-ERP.md)** | Especificação técnica completa do ERP Premium (arquitetura, 76 módulos, banco de dados, UX, segurança, integrações, roadmap) | ✅ Completa |

---

## 1. Sistema (index.html)

Basta **abrir o arquivo no navegador** — sem instalação, sem servidor, sem internet. Os dados ficam salvos no próprio navegador (`localStorage`) e podem ser exportados em JSON/CSV.

### Módulos

| Módulo | O que faz |
|---|---|
| **Dashboard** | 8 KPIs, gráfico receita × despesa (6 meses), alertas operacionais, próximas partidas, roteiros mais vendidos |
| **Agenda** | Calendário mensal com partidas, retornos e follow-ups de leads |
| **Roteiros** | Catálogo de destinos com preço adulto/criança, duração, o que inclui |
| **Partidas** | Saídas programadas, ocupação, mapa de assentos, custos, margem, lista de passageiros para impressão |
| **Frota** | Veículos, capacidade, vínculo com fornecedor |
| **Equipe** | Motoristas, guias, vendedores, comissão |
| **Reservas** | Passageiros, assentos, descontos, pagamentos parciais, voucher para impressão |
| **Clientes** | Base com histórico de compras, saldo devedor e WhatsApp direto |
| **Leads / CRM** | Funil kanban (novo → contato → proposta → ganho/perdido) com conversão em cliente |
| **Financeiro** | Livro-caixa consolidado (reservas + custos de partida + lançamentos manuais), a receber e a pagar |
| **Relatórios** | Desempenho por roteiro, rentabilidade por partida, top clientes, mix de pagamento, funil |
| **Fornecedores** | Vans, ônibus, hotéis, guias, parques — com avaliação, mapa e WhatsApp |
| **Configurações** | Dados da empresa, tema claro/escuro, moeda, backup e restauração |

### Recursos

- 🌐 **Bilíngue** — troca instantânea PT ⇄ EN (interface, datas, moeda)
- 🌓 **Tema claro e escuro**
- 📱 **Responsivo** — funciona no celular, tablet e desktop
- 🖨️ **Impressos prontos** — lista de passageiros (manifesto) e voucher de viagem
- 💾 **Backup** — exportação/importação JSON e exportação CSV por módulo
- 💵 **Multimoeda** — BRL, USD, EUR, ARS, PYG
- 🔒 **100% local** — nenhum dado sai do computador

### Como começar

1. Abra `index.html` no navegador (Chrome, Edge, Firefox ou Safari).
2. O sistema já vem com os dados da empresa: 4 roteiros (Olímpia, Barretos, Caldas Novas, São Paulo) e o fornecedor de ônibus Angelitur.
3. Em **Configurações**, ajuste os dados da empresa e exporte um backup.
4. Cadastre na ordem: Roteiros → Fornecedores → Frota → Partidas → Clientes → Reservas.

> ⚠️ Os dados ficam no navegador. Exporte o backup JSON com frequência e guarde o arquivo (Google Drive, pendrive, e-mail).

---

## 2. Especificação do ERP Premium

Documento de ~14.500 palavras cobrindo o produto completo, no padrão de operadoras internacionais:

1. **Visão geral** — personas, objetivos, fluxo do negócio, benefícios e ROI
2. **Arquitetura** — frontend, backend, banco, API, autenticação, segurança, permissões, escalabilidade, backup, cloud, offline e sincronização
3. **76 módulos** catalogados em 14 domínios, com fase de entrega
4. **Especificação funcional** — objetivo, funcionalidades, fluxos, campos, botões, filtros, relatórios, permissões, automações e integrações por módulo
5. **Sistema bilíngue** — i18n completo (idioma, moeda, fuso, documentos, comunicação)
6. **Banco de dados** — tabelas, campos, relacionamentos e índices
7. **Dashboard e BI** — KPIs, 16 gráficos, alertas e catálogo de relatórios
8. **UX/UI** — design system, modo claro/escuro, responsividade e acessibilidade WCAG 2.2 AA
9. **Segurança** — LGPD, JWT, 2FA, criptografia, auditoria e continuidade
10. **Integrações** — Maps, Calendar, WhatsApp, PIX, Stripe, PayPal, Mercado Pago, seguradoras, Cadastur, ANTT, IA e mais
11. **Roadmap** — 4 fases, time, custos, requisitos não funcionais, critérios de aceite e riscos

---

## English

Complete management system for a tourism company, fully bilingual (PT/EN).

- **`index.html`** — working single-file app: dashboard, calendar, tours, departures with seat map, bookings with passengers and partial payments, customers, CRM pipeline, fleet, staff, suppliers, consolidated finance ledger, reports, printable passenger manifest and travel voucher, JSON/CSV backup. Runs offline in any browser; data is stored locally and never leaves the device. Switch to English with the **EN** button in the sidebar.
- **`docs/ESPECIFICACAO-ERP.md`** — full technical specification (in Portuguese) for the premium ERP: architecture, 76 modules, database schema, UX/UI system, security & LGPD, integrations and delivery roadmap.
