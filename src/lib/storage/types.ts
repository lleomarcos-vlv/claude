export type StoredObject = {
  body: Buffer;
  contentType: string;
  size: number;
};

export interface StorageDriver {
  /** Identificador do driver: local | supabase | s3 */
  readonly name: string;
  /** Grava um objeto. `key` é um caminho relativó, ex: "produtos/abc/original.jpg". */
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Remove um objeto. Não deve lancar erro quando o objeto já não existe. */
  remove(key: string): Promise<void>;
  /** URL que o navegador usa para exibir o arquivo. */
  publicUrl(key: string): string;
  /** Leitura direta (usada apenas pelo driver local, que serve via rota /api/media). */
  read?(key: string): Promise<StoredObject | null>;
}

/** Impede path traversal e normaliza a chave do objeto. */
export function sanitizeKey(key: string): string {
  const normalized = key
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_"))
    .join("/");
  if (!normalized) throw new Error("Chave de storage inválida");
  return normalized;
}
