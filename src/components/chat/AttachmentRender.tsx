"use client";

import { useState, useCallback } from "react";
import { FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { bytesPretty, type AttachmentMeta } from "./attachment-types";
import { ImageLightbox } from "./ImageLightbox";
import { MessageContent } from "./MessageContent";

interface Props {
  attachments: AttachmentMeta[];
}

interface MdState {
  [id: string]: { open: boolean; content?: string; loading?: boolean; error?: string };
}

export function AttachmentRender({ attachments }: Props) {
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const [mdState, setMdState] = useState<MdState>({});

  const toggleMd = useCallback(async (att: AttachmentMeta) => {
    setMdState((curr) => {
      const cur = curr[att.id] ?? { open: false };
      // Já temos conteúdo: só toggle
      if (cur.content) {
        return { ...curr, [att.id]: { ...cur, open: !cur.open } };
      }
      return { ...curr, [att.id]: { open: true, loading: true } };
    });
    // Se já tinha conteúdo, sai
    const existing = mdState[att.id];
    if (existing?.content) return;

    try {
      const r = await fetch(att.url, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      setMdState((curr) => ({
        ...curr,
        [att.id]: { open: true, content: text, loading: false },
      }));
    } catch (e) {
      setMdState((curr) => ({
        ...curr,
        [att.id]: {
          open: true,
          loading: false,
          error: e instanceof Error ? e.message : "erro",
        },
      }));
    }
  }, [mdState]);

  if (attachments.length === 0) return null;
  const images = attachments.filter((a) => a.kind === "image");
  const markdowns = attachments.filter((a) => a.kind === "markdown");

  return (
    <div className="space-y-2 mt-2">
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-2",
            images.length === 1 ? "grid-cols-1" :
            images.length === 2 ? "grid-cols-2" :
            "grid-cols-3"
          )}
        >
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightbox({ url: img.url, name: img.name })}
              className="relative aspect-square overflow-hidden rounded-xl bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
              style={{ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.06)" }}
              aria-label={`Abrir ${img.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {markdowns.map((md) => {
        const st = mdState[md.id] ?? { open: false };
        return (
          <div
            key={md.id}
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--surface)",
              boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.06)",
            }}
          >
            <button
              type="button"
              onClick={() => toggleMd(md)}
              className="w-full text-left px-3 py-2 flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <FileText className="h-3.5 w-3.5 text-brand-red-light shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-0 text-xs text-white truncate">{md.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{bytesPretty(md.size)}</span>
              <ChevronDown
                className={cn("h-3 w-3 text-muted-foreground transition-transform", st.open && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {st.open && (
              <div className="px-3 pb-3 pt-1" style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.06)" }}>
                {st.loading && <div className="text-xs text-muted-foreground py-2">Carregando…</div>}
                {st.error && <div className="text-xs text-destructive py-2">Falha: {st.error}</div>}
                {st.content && (
                  <MessageContent content={st.content} variant="assistant" />
                )}
              </div>
            )}
          </div>
        );
      })}

      {lightbox && (
        <ImageLightbox
          open={true}
          url={lightbox.url}
          name={lightbox.name}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
