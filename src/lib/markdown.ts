/**
 * Renderizador Markdown mínimo para os posts do blog.
 *
 * Cobre exatamente o que o conteúdo usa (títulos, listas, tabelas, citações,
 * negrito, itálico, links e código inline) e escapa todo o HTML de entrada —
 * assim não carregamos um parser completo no bundle nem abrimos brecha de XSS.
 */

type Token = { html: string };

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: Token[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Títulos
    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      // Os h2 recebem id para servir de âncora no sumário do post.
      const id = level === 2 ? ` id="${anchorId(heading[2])}"` : "";
      out.push({ html: `<h${level}${id}>${inline(heading[2])}</h${level}>` });
      i++;
      continue;
    }

    // Divisor
    if (/^---+$/.test(line.trim())) {
      out.push({ html: "<hr>" });
      i++;
      continue;
    }

    // Tabela
    if (line.includes("|") && lines[i + 1] && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push({ html: `<div class="table-scroll"><table>${thead}${tbody}</table></div>` });
      continue;
    }

    // Citação
    if (line.startsWith("> ")) {
      const buffer: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buffer.push(lines[i].slice(2));
        i++;
      }
      out.push({ html: `<blockquote><p>${inline(buffer.join(" "))}</p></blockquote>` });
      continue;
    }

    // Lista ordenada
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(inline(lines[i].replace(/^\d+\.\s/, "")));
        i++;
      }
      out.push({ html: `<ol>${items.map((t) => `<li>${t}</li>`).join("")}</ol>` });
      continue;
    }

    // Lista não ordenada
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(inline(lines[i].replace(/^[-*]\s/, "")));
        i++;
      }
      out.push({ html: `<ul>${items.map((t) => `<li>${t}</li>`).join("")}</ul>` });
      continue;
    }

    // Parágrafo
    const buffer: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{2,4})\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith("> ") &&
      !/^---+$/.test(lines[i].trim())
    ) {
      buffer.push(lines[i]);
      i++;
    }
    out.push({ html: `<p>${inline(buffer.join(" "))}</p>` });
  }

  return out.map((t) => t.html).join("\n");
}

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function inline(text: string) {
  let out = escapeHtml(text);
  // Código inline primeiro, para o conteúdo não sofrer as outras substituições.
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const safe = /^(https?:\/\/|\/|#|mailto:|tel:)/.test(href) ? href : "#";
    const external = safe.startsWith("http");
    return `<a href="${safe}"${external ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
  });
  return out;
}

function anchorId(text: string) {
  return text
    .replace(/\*\*/g, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Extrai os títulos de nível 2 para montar o sumário do post. */
export function extractHeadings(source: string) {
  return source
    .split("\n")
    .map((l) => /^##\s+(.*)$/.exec(l))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ text: m[1].replace(/\*\*/g, ""), id: anchorId(m[1]) }));
}
