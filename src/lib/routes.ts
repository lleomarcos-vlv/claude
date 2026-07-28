/**
 * Rotas que rodam fora do "chrome" público (cabeçalho, rodapé, banner de cookies,
 * botões flutuantes). São áreas logadas e telas de autenticação, que têm o próprio
 * layout e não devem exibir a navegação do site institucional.
 */
const APP_PREFIXES = ["/admin", "/area-cliente", "/entrar", "/cadastro"];

export function isAppRoute(pathname: string) {
  return APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
