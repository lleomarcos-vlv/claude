# JP Alumínios · Sistema Comercial (orçamentos em PDF)

Sistema local para o Windows: cadastro de clientes, construtor de orçamentos e **PDF profissional** pronto para enviar por WhatsApp.
Funciona **sem internet** e sem instalar nada: tudo está nesta pasta (inclusive a biblioteca de PDF).

## Como iniciar (Windows)
1. Extraia o ZIP em uma pasta (ex.: `C:\JP-Sistema`). Não rode de dentro do ZIP.
2. Dê dois cliques em **`INICIAR.bat`**. Ele abre o `index.html` no Chrome ou no Edge.
3. Use **sempre o mesmo navegador e o mesmo usuário do Windows**: os dados ficam no banco local (IndexedDB) desse navegador.
   Janela anônima/privada **não** guarda dados.

## Guia rápido
1. **Clientes** > *Novo cliente* (nome é obrigatório; CPF/CNPJ é validado; telefone e CEP têm máscara).
2. **Novo orçamento** > escolha o cliente > *Adicionar item* (descrição, tipo do desenho, ambiente, linha, cores, vidro, largura/altura em mm, quantidade e **valor unitário digitado por você**).
3. Informe desconto (R$ ou %), frete, instalação, condição de pagamento e prazo. O total é recalculado na hora.
4. **Salvar**, depois **Pré-visualizar PDF**, **Baixar PDF**, **Abrir PDF para imprimir** (use Ctrl+P na aba aberta) ou **WhatsApp**.
5. Na lista de orçamentos: abrir, duplicar, baixar PDF, excluir (com confirmação) e **Exportar CSV**.

## O PDF
Baseado no orçamento nº 12545 enviado como referência, mantendo todos os campos (cliente, local/ambiente, linha, cor do perfil e do acessório, largura × altura, vidro, valores unitário e total, observações por item, condição de pagamento, prazo, total, aceite do cliente), e com melhorias:
caberem em **1 página** quando possível (a referência usava 2, a segunda quase vazia), valor por extenso, validade opcional, desenho vetorial nítido de cada tipologia (ou foto própria por item), paginação automática com cabeçalho de continuação e rodapé "Página x de y", sem marca de sistema de terceiros.
O desenho automático (porta de correr, janela de correr, janela integrada, maxim-ar, porta de giro, veneziana, fixo) é um **ícone esquemático, não o desenho técnico do produto**. Para mostrar o produto real, envie uma foto no item.
O preço unitário aceita até 4 casas decimais (ex.: 3.779,735), porque o orçamento de referência faz exatamente isso: 4 × 3.779,74 aparece como 15.118,94, e não 15.118,96.

## Backup e restauração
*Configurações e backup* > **Exportar backup (JSON)**: gera `backup_JP_AAAA-MM-DD.json` com clientes, orçamentos (com fotos) e configurações. Guarde uma cópia fora do computador.
**Restaurar backup…**: valida formato, estrutura e verificação de integridade; baixa automaticamente um backup do estado atual; só então substitui os dados (operação atômica: se falhar, nada muda).
Limpar dados de navegação, trocar de navegador ou formatar o PC apaga os dados: por isso o backup periódico é essencial.

## Dados pré-preenchidos
Em *Configurações* a empresa vem preenchida com os dados que constam no PDF de referência e no catálogo (razão social, CNPJ, IE, endereço, telefone, e-mail, Instagram, vendedor Felipe). Confira e corrija. **Não há clientes, produtos, preços ou orçamentos de demonstração.** O orçamento 12545 existe apenas em `tests/` para teste automatizado.

## Estrutura
`index.html` · `INICIAR.bat` · `css/` · `js/core.js` (cálculos, máscaras, extenso) · `js/pdf.js` (gerador de PDF) · `js/db.js` (IndexedDB) · `js/app.js` (telas) · `js/logo.js` (logotipo embutido) · `vendor/jspdf.umd.min.js` (jsPDF 2.5.2, MIT) · `tests/`

## Testes
`node --test tests/core.test.js` (cálculos, extenso, máscaras) e `node tests/e2e.js` (usa a interface no Chromium; requer `npm i playwright-core` e `pdftotext`/`pdfinfo` do Poppler). Ver o relatório de entrega para o que foi executado.

## Limitações
- Sem login: quem acessa o computador/navegador vê os dados.
- **Não implementado nesta versão:** catálogo de produtos com importação do catálogo, pipeline de vendas, agenda/follow-up, prospecção/CSV de leads, relatórios gerenciais e todos os módulos de ERP (pedidos, produção, estoque, compras, financeiro, etc.). A base (banco local, clientes, orçamentos, PDF, backup) foi construída para recebê-los.
- O catálogo enviado (`JP-Aluminios-Apresentacao-leve.pdf`) é uma apresentação institucional: não traz códigos, medidas, acabamentos nem preços de produtos, então não havia o que importar sem inventar dados.
- O botão WhatsApp só abre a conversa com a mensagem pronta (precisa de internet); o PDF deve ser anexado manualmente.
- Pré-visualização em modal depende do leitor de PDF do navegador (Chrome/Edge têm); se não aparecer, use *Baixar PDF*.
