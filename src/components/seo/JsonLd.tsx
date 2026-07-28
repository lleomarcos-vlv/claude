/**
 * Injeta dados estruturados Schema.org.
 *
 * Vai no HTML do servidor (sem JavaScript no cliente) usando @graph, o que
 * permite os nós se referenciarem por @id — a forma que o Google recomenda
 * quando a página tem mais de um tipo de entidade.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const graph = Array.isArray(data) ? data : [data];

  return (
    <script
      type="application/ld+json"
      // O conteúdo é gerado pelo próprio servidor a partir de dados internos.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
