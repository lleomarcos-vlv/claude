# Manual do administrador — Padaria Villa Reis

Guia direto para quem cuida do site no dia a dia. Não é preciso saber nada de
programação.

---

## 1. Entrar no painel

Acesse o endereço do site seguido de `/admin`, por exemplo
`www.padariavillareis.com.br/admin`, e informe e-mail e senha.

A sessão dura 8 horas. Depois disso o sistema pede a senha de novo, o que
protege a padaria caso alguém esqueça o computador aberto.

No celular, o menu abre pelo botão ☰ no canto superior esquerdo.

---

## 2. Cadastrar um produto

1. Menu **Produtos** → botão **+ Novo produto**.
2. Preencha **Nome**, **Preço** e **Categoria**. Só esses três são obrigatórios.
3. Em **Fotos e vídeos**, clique em **+ Adicionar fotos e vídeos**:
   - arraste os arquivos direto para a área tracejada, ou
   - clique e escolha do computador; no celular abre a câmera e a galeria.
   - dá para selecionar várias fotos de uma vez.
4. Aguarde a barra de progresso chegar a 100%.
5. A primeira foto vira a principal. Para trocar, clique em **usar** embaixo de
   outra foto. Para mudar a ordem, use as setas ← →.
6. Marque as opções que se aplicam:
   - **Produto disponível**: aparece no site.
   - **Mais pedido**: entra na vitrine "Mais pedidos" da página inicial.
   - **Novidade**: entra na seção "Novidades".
   - **Feito na Villa Reis**: entra na vitrine de artesanais.
   - **Pode ser adicionado ao carrinho**: desmarque para itens que só saem sob
     encomenda (bolo de festa, kit de 100 salgados). O botão do cliente muda
     para "Sob encomenda".
7. **Salvar produto**. Ele aparece no site na hora.

### Sobre a qualidade das fotos

Envie a foto original, do tamanho que saiu da câmera ou do celular. **Não passe
a foto pelo WhatsApp antes**, porque o WhatsApp reduz a qualidade e isso não
tem volta.

O sistema guarda o arquivo original intacto e cria automaticamente as versões
menores que o site usa para carregar rápido. Você não precisa redimensionar
nada.

Aceita JPG, PNG, WEBP (até 25 MB) e MP4, MOV (até 200 MB).

---

## 3. Mudar preço

Duas formas:

- **Preço definitivo:** Produtos → clique no produto → altere o campo Preço →
  Salvar.
- **Promoção temporária:** menu **Promoções** → escolha o produto → informe o
  preço promocional e o período. O preço antigo aparece riscado e o selo de
  desconto entra automaticamente no card, na página do produto e na aba Ofertas.

Terminado o período, o preço normal volta sozinho. Para encerrar antes, clique
em **ativa** na lista de promoções para pausá-la.

---

## 4. Esconder um produto sem excluir

Na lista de Produtos, clique em **ocultar**. O produto some do site mas
continua cadastrado, com fotos e histórico. Para trazer de volta, clique em
**ativar**.

Use isso para itens sazonais, e não a exclusão.

---

## 5. Trocar o banner da página inicial

Menu **Banners** → **Novo banner**:

- escolha uma foto ou um vídeo (fica bonito em formato deitado, tipo 16:9);
- escreva o título e o subtítulo;
- defina o texto e o link do botão;
- opcionalmente informe início e término, útil para Páscoa, Natal, Dia das Mães.

O primeiro banner ativo dentro do período é o que aparece.

---

## 6. Categorias

Menu **Categorias**. Dá para criar, renomear (clique no nome e edite), definir
a ordem, escolher um ícone, ocultar e marcar quais aparecem no formulário de
encomendas.

Categoria com produtos não pode ser excluída: mova ou apague os produtos antes.

---

## 7. Pedidos

Todo pedido feito pelo site fica registrado em **Pedidos**, mesmo que a
conversa continue no WhatsApp.

Fluxo de status: **Novo → Confirmado → Em preparação → Pronto → Entregue**
(ou Cancelado).

O botão **Responder no WhatsApp** abre a conversa com o cliente já identificada
pelo número do pedido.

---

## 8. Encomendas

Menu **Encomendas** reúne as solicitações de orçamento, com data desejada,
número de pessoas, descrição e a foto de referência que o cliente enviou.

Status: **Novo → Orçamento enviado → Confirmado → Concluído**.

---

## 9. Galeria e Instagram

Menu **Galeria e Instagram**, com três abas:

- **Galeria**: fotos do ambiente, do balcão e da produção, usadas nas seções
  visuais do site.
- **Instagram**: a vitrine "Siga a Villa Reis" da página inicial. Cadastre as
  fotos manualmente e informe o link do post.
- **Biblioteca**: todos os arquivos enviados. Dá para baixar o original e
  excluir o que não usa mais.

Excluir um arquivo da biblioteca remove também as versões otimizadas e não tem
volta.

---

## 10. Configurações

Menu **Configurações**. É aqui que se muda, sem código:

nome da padaria, frase de apoio, título e subtítulo da home, texto da seção
"Feito na Villa Reis", telefone, **WhatsApp**, e-mail, endereço completo, link
do Google Maps, mapa incorporado, Instagram, Facebook, horários de
funcionamento, ativar ou desativar pedidos online, ativar ou desativar entrega,
aviso de entrega, pedido mínimo, título e descrição para o Google.

**O número do WhatsApp** deve ser digitado só com números, incluindo país e
DDD: `5516999998888`.

---

## 11. Perguntas frequentes

**Alterei e não vejo mudança no site.**
Atualize a página com Ctrl+F5 (ou puxe a tela para baixo no celular). O site
guarda cache por até um minuto.

**A foto ficou cortada no card.**
Os cards usam formato retrato (4:5). Fotos deitadas são cortadas nas laterais.
Para produto, prefira foto em pé ou quadrada.

**O cliente pode ver o painel?**
Não. `/admin` exige login e está bloqueado para o Google.

**Como instalo o site como aplicativo no celular?**
Abra o site no navegador do celular e escolha "Adicionar à tela de início".
O ícone da Villa Reis aparece junto dos outros aplicativos.

**Esqueci a senha.**
É preciso rodar o comando de criação de administrador no servidor. Fale com
quem cuida da hospedagem e peça para executar `npm run seed` com as novas
credenciais no arquivo `.env`.
