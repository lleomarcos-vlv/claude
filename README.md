# claude

## Agente de Scripts (`agente-scripts.html`)

Agente que escreve scripts automaticamente conforme o pedido. É **um único arquivo
HTML** — sem servidor, sem build, sem instalação. Abra no navegador e use.

### Como rodar

```bash
# opção 1: abrir direto
xdg-open agente-scripts.html      # Linux
open agente-scripts.html          # macOS

# opção 2 (recomendada para usar as APIs): servir localmente
python3 -m http.server 8000
# depois acesse http://localhost:8000/agente-scripts.html
```

Alguns provedores rejeitam requisições vindas de `file://`. Se der erro de rede,
use a opção 2.

### Modos de operação

| Modo | Precisa de chave | O que faz |
|---|---|---|
| **Offline** | não | Monta o script a partir de 7 modelos embutidos (backup com rotação, renomear em lote, organizar pasta por tipo, CSV→JSON agrupado, consumir API REST paginada, limpeza por idade, monitorar site). Sem internet. |
| **Google Gemini** | sim (gratuita) | Escreve o script sob medida. Chave em https://aistudio.google.com/apikey |
| **Groq** | sim (gratuita) | Idem, bem rápido. Chave em https://console.groq.com/keys |
| **OpenRouter** | sim (gratuita) | Modelos marcados `:free`. Chave em https://openrouter.ai/keys |

### O que ele faz

- Gera o script em **bash, Python, JavaScript/Node, PowerShell, SQL ou HTML**
- Três estilos de saída: pronto para produção, curto, ou didático comentado
- Resposta em **streaming** (o código aparece enquanto é escrito)
- Separa automaticamente o **código** da **explicação** (requisitos, como usar, cuidados)
- **Ajuste iterativo**: pede alteração em cima do script anterior mantendo o contexto
- **Colar erro e corrigir**: cola a mensagem de erro e recebe o script corrigido
- Copiar / baixar com a extensão certa
- **Rodar aqui**: executa JS de navegador num `iframe` isolado, com o console capturado
- Histórico das últimas 25 gerações, salvo localmente

### Segurança

- A chave de API fica apenas no `localStorage` do seu navegador e só é enviada ao
  provedor escolhido. Não publique o arquivo com a chave preenchida.
- O prompt de sistema exige que operações destrutivas tenham confirmação ou
  `--dry-run`. Os modelos offline simulam por padrão e só alteram arquivos com `--aplicar`.
- Revise qualquer script antes de rodar em dados reais.

---

## Agente de Sites (`agente-site.html`)

Você preenche os dados do cliente e sai um **site institucional completo em um
único arquivo HTML**, pronto para enviar ou hospedar. Também é um arquivo único —
abra no navegador e use.

### Como funciona

1. Preencha nome, ramo, serviços e contato (ou clique em **Preencher exemplo** para ver funcionando).
2. Monte a página no bloco **Seções**: arraste para reordenar, esconda, duplique ou crie novas.
3. Escolha estilo e cor. A prévia se atualiza sozinha, com alternância desktop/celular.
4. **Baixar site (.html)** — um arquivo só, com CSS, JS, logo e fotos embutidos.

### Seções disponíveis

Topo (capa), Serviços, Sobre, Diferenciais, Depoimentos, Perguntas frequentes,
Planos e preços, Galeria de fotos, Bloco de texto, Grupo de botões, Faixa de
chamada e Contato. Pode repetir o mesmo tipo quantas vezes quiser — três blocos
de texto, dois grupos de botões, o que a página pedir.

Em cada seção com botões há **+ criar novo botão**, e cada botão escolhe a ação:
abrir WhatsApp, ligar, enviar e-mail, rolar até outra seção ou abrir um link.

### O que o site gerado já traz

- Responsivo, com menu que vira sanduíche no celular
- Botão flutuante de WhatsApp e formulário que envia a mensagem pelo WhatsApp
  (ou por e-mail, se não houver WhatsApp) — sem back-end
- SEO: `title`, `description`, Open Graph e dados estruturados `LocalBusiness`
- Mapa do endereço opcional
- Três estilos (Moderno escuro, Elegante claro, Vibrante) e cor principal livre
- Contraste de texto calculado pela razão WCAG: qualquer cor escolhida mantém
  pelo menos 4.5:1 nos botões, selos e links

### Textos com IA (opcional)

Com Gemini, Groq ou OpenRouter (chaves gratuitas), o botão **Escrever textos com
IA** preenche slogan, texto institucional, serviços e diferenciais a partir do
nome e do ramo. O site é montado localmente de qualquer jeito — a IA só escreve
o texto, então nada quebra se você não usar. Revise antes de entregar ao cliente.

### Clientes salvos

Cada cliente fica salvo no navegador (até 30), com todas as seções. Dá para
reabrir, editar e gerar de novo depois.
