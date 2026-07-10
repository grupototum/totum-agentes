"use client";

import { useMemo } from "react";
import { X, FileText, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  bytesPretty,
  type PendingAttachment,
} from "./attachment-types";

interface Props {
  pending: PendingAttachment[];
  onRemove: (localId: string) => void;
}

function PreviewCard({
  item,
  onRemove,
}: {
  item: PendingAttachment;
  onRemove: () => void;
}) {
  const isImage = item.file.type.startsWith("image/");
  const objectUrl = useMemo(() => {
    if (!isImage) return null;
    return URL.createObjectURL(item.file);
  }, [item.file, isImage]);

  return (
    <div
      className={cn(
        "relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-elevated",
        item.status === "error" && "ring-1 ring-destructive"
      )}
      style={{ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.06)" }}
    >
      {/* Thumb / icon */}
      {isImage && objectUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={objectUrl} alt={item.file.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-soft gap-1">
          {item.status === "error" ? (
            <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
          ) : item.file.name.toLowerCase().endsWith(".md") ? (
            <FileText className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {item.file.name.toLowerCase().endsWith(".md") ? "md" : "file"}
          </span>
        </div>
      )}

      {/* Overlay: bottom info */}
      <div
        className="absolute inset-x-0 bottom-0 px-1.5 py-1 text-[10px] leading-tight text-white"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)",
        }}
      >
        <div className="truncate" title={item.file.name}>{item.file.name}</div>
        <div className="text-[9px] text-text-soft/80">{bytesPretty(item.file.size)}</div>
      </div>

      {/* Progress bar */}
      {item.status === "uploading" && (
        <div className="absolute inset-x-0 top-0 h-1 bg-elevated/50">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}

      {/* Spinner overlay during upload */}
      {item.status === "uploading" && item.progress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/40 backdrop-blur-[1px]">
          <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center",
          "bg-surface/80 text-white hover:bg-destructive transition-colors"
        )}
        title="Remover anexo"
        aria-label={`Remover ${item.file.name}`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

export function AttachmentPreview({ pending, onRemove }: Props) {
  if (pending.length === 0) return null;
  const totalBytes = pending.reduce((s, p) => s + p.file.size, 0);
  return (
    <div className="px-1 py-2 space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Anexos ({pending.length})
        </span>
        <span className="text-[10px] text-muted-foreground">
          · total {bytesPretty(totalBytes)}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {pending.map((p) => (
          <PreviewCard
            key={p.localId}
            item={p}
            onRemove={() => onRemove(p.localId)}
          />
        ))}
      </div>
    </div>
  );
}
