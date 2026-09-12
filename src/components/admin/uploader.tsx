"use client";

import { useCallback, useRef, useState } from "react";

export type UploadedMedia = {
  id: string;
  kind: "image" | "video";
  url: string;
  thumbUrl: string | null;
};

type QueueItem = {
  key: string;
  name: string;
  previewUrl: string;
  progress: number;
  status: "aguardando" | "enviando" | "pronto" | "erro";
  error?: string;
  result?: UploadedMedia;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/quicktime,video/webm";

/**
 * Upload direto do computador ou do celular: arrastar e soltar, vários arquivos
 * de uma vez, barra de progresso real e pre-visualização antes de publicar.
 *
 * O arquivo original vai inteiro para o storage; as versões otimizadas
 * (desktop, mobile e miniatura) são geradas no servidor.
 */
export function Uploader({
  folder = "produtos",
  onUploaded,
  label = "Arraste as fotos aqui ou clique para escolher",
  hint = "JPG, PNG, WEBP até 25 MB • MP4, MOV até 200 MB",
  compact = false,
}: {
  folder?: string;
  onUploaded: (media: UploadedMedia[]) => void;
  label?: string;
  hint?: string;
  compact?: boolean;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const items: QueueItem[] = files.map((file, index) => ({
        key: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
        progress: 0,
        status: "aguardando",
      }));

      setQueue((current) => [...current, ...items]);

      items.forEach((item, index) => {
        const file = files[index];
        const body = new FormData();
        body.append("files", file);
        body.append("folder", folder);

        const request = new XMLHttpRequest();
        request.open("POST", "/api/upload");

        request.upload.addEventListener("progress", (event) => {
          if (!event.lengthComputable) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          setQueue((current) =>
            current.map((entry) =>
              entry.key === item.key ? { ...entry, progress, status: "enviando" } : entry,
            ),
          );
        });

        request.addEventListener("load", () => {
          let payload: { ok?: boolean; data?: { uploaded: UploadedMedia[] }; error?: string } = {};
          try {
            payload = JSON.parse(request.responseText);
          } catch {
            payload = { error: "Resposta inválida do servidor" };
          }

          if (request.status >= 200 && request.status < 300 && payload.data?.uploaded?.[0]) {
            const uploaded = payload.data.uploaded[0];
            setQueue((current) =>
              current.map((entry) =>
                entry.key === item.key
                  ? { ...entry, progress: 100, status: "pronto", result: uploaded }
                  : entry,
              ),
            );
            onUploaded([uploaded]);
          } else {
            setQueue((current) =>
              current.map((entry) =>
                entry.key === item.key
                  ? { ...entry, status: "erro", error: payload.error ?? "Falha no envio" }
                  : entry,
              ),
            );
          }
        });

        request.addEventListener("error", () => {
          setQueue((current) =>
            current.map((entry) =>
              entry.key === item.key
                ? { ...entry, status: "erro", error: "Conexão interrompida" }
                : entry,
            ),
          );
        });

        request.send(body);
      });
    },
    [folder, onUploaded],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          upload([...event.dataTransfer.files]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition ${
          compact ? "gap-1 p-5" : "gap-2 p-9"
        } ${dragging ? "border-gold bg-gold/10" : "border-line bg-white hover:border-gold"}`}
      >
        <span className="text-2xl">📤</span>
        <p className="font-medium text-espresso">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            upload([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {queue.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
                {item.result?.thumbUrl || item.previewUrl ? (
                  <img
                    src={item.result?.thumbUrl || item.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg">🎬</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-espresso">{item.name}</p>
                {item.status === "erro" ? (
                  <p className="text-xs text-danger">{item.error}</p>
                ) : (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-deep">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.status === "pronto" ? "bg-success" : "bg-gold"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <span className="shrink-0 text-xs text-muted">
                {item.status === "pronto" ? "✓ publicado" : `${item.progress}%`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
