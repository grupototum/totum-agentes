"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ATTACHMENT_LIMITS,
  isAcceptable,
  type AttachmentKind,
  type PendingAttachment,
} from "@/components/chat/attachment-types";

interface UseUploaderOpts {
  conversationId: string | null;
}

interface UploadResp {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  kind: AttachmentKind;
}

/**
 * Hook que gerencia o pipeline de upload de anexos.
 * - addFiles(): valida limites + 5/turn + dispara XHR pra ter onprogress real
 * - removePending(localId): cancela upload em-curso OU remove finalizado
 * - reset(): limpa tudo após submit do chat
 * - readyIds: IDs do server prontos pra mandar no /api/messages
 */
export function useUploader({ conversationId }: UseUploaderOpts) {
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const xhrRefs = useRef<Map<string, XMLHttpRequest>>(new Map());

  const setItem = useCallback(
    (localId: string, patch: Partial<PendingAttachment>) =>
      setPending((curr) =>
        curr.map((p) => (p.localId === localId ? { ...p, ...patch } : p))
      ),
    []
  );

  const removePending = useCallback((localId: string) => {
    const xhr = xhrRefs.current.get(localId);
    xhr?.abort();
    xhrRefs.current.delete(localId);
    setPending((curr) => curr.filter((p) => p.localId !== localId));
  }, []);

  const reset = useCallback(() => {
    for (const xhr of xhrRefs.current.values()) xhr.abort();
    xhrRefs.current.clear();
    setPending([]);
  }, []);

  const startUpload = useCallback(
    (item: PendingAttachment) => {
      const fd = new FormData();
      fd.append("file", item.file);
      if (conversationId) fd.append("conversation_id", conversationId);

      const xhr = new XMLHttpRequest();
      xhrRefs.current.set(item.localId, xhr);
      xhr.open("POST", "/api/uploads");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setItem(item.localId, {
            progress: Math.round((e.loaded / e.total) * 100),
          });
        }
      };
      xhr.onload = () => {
        xhrRefs.current.delete(item.localId);
        if (xhr.status === 201) {
          try {
            const data = JSON.parse(xhr.responseText) as UploadResp;
            setItem(item.localId, {
              status: "done",
              progress: 100,
              serverId: data.id,
              url: data.url,
              kind: data.kind,
            });
          } catch {
            setItem(item.localId, { status: "error", error: "resp_invalid" });
          }
        } else {
          let msg = `HTTP ${xhr.status}`;
          try {
            const j = JSON.parse(xhr.responseText) as { error?: string; detail?: string };
            msg = j.detail || j.error || msg;
          } catch {
            // ignore
          }
          setItem(item.localId, { status: "error", error: msg });
          toast.error(`Falha ao subir ${item.file.name}: ${msg}`);
        }
      };
      xhr.onerror = () => {
        xhrRefs.current.delete(item.localId);
        setItem(item.localId, { status: "error", error: "network" });
        toast.error(`Erro de rede ao subir ${item.file.name}`);
      };
      xhr.onabort = () => {
        xhrRefs.current.delete(item.localId);
      };
      xhr.send(fd);
    },
    [conversationId, setItem]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      setPending((curr) => {
        const room = ATTACHMENT_LIMITS.MAX_PER_TURN - curr.length;
        if (room <= 0) {
          toast.error(`Máximo ${ATTACHMENT_LIMITS.MAX_PER_TURN} anexos por turno`);
          return curr;
        }
        const newOnes: PendingAttachment[] = [];
        for (const f of arr.slice(0, room)) {
          const check = isAcceptable(f);
          if (!check.ok) {
            toast.error(`${f.name}: ${check.reason}`);
            continue;
          }
          const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          newOnes.push({
            localId,
            file: f,
            progress: 0,
            status: "uploading",
          });
        }
        if (arr.length > room) {
          toast.error(
            `${arr.length - room} anexo(s) ignorado(s) — limite ${ATTACHMENT_LIMITS.MAX_PER_TURN}/turno`
          );
        }
        setTimeout(() => {
          for (const it of newOnes) startUpload(it);
        }, 0);
        return [...curr, ...newOnes];
      });
    },
    [startUpload]
  );

  const anyUploading = pending.some((p) => p.status === "uploading");
  const readyIds = pending
    .filter((p) => p.status === "done" && p.serverId)
    .map((p) => p.serverId!);

  return {
    pending,
    addFiles,
    removePending,
    reset,
    anyUploading,
    readyIds,
  };
}
