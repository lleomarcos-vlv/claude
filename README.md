# claude

## Central de Contas

`index.html` — painel para gerenciar contas de Instagram, TikTok, YouTube,
Facebook, Meta Business e Google Ads. Arquivo único, sem dependências: basta
abrir no navegador.

O que dá para fazer:

- Cadastrar, editar e excluir contas com cliente, e-mail de acesso,
  responsável, nível de acesso, status e observações.
- Filtrar por plataforma, por status e buscar em qualquer campo.
- Acompanhar a próxima revisão de acesso, com destaque para o que venceu
  ou vence nos próximos 14 dias.
- Ver quais contas ativas ainda estão sem verificação em duas etapas.
- Exportar a lista em JSON e CSV, e importar o JSON de volta em outro
  dispositivo.

Os dados ficam no `localStorage` do navegador — nada é enviado para
servidor algum. Senhas não são armazenadas por decisão de projeto: o
arquivo fica em texto no navegador, então guarde-as em um gerenciador
dedicado e use este painel para registrar só quem tem acesso ao quê.
