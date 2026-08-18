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
