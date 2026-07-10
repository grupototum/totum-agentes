"use client";

import { useCallback, useRef } from "react";
import { Paperclip } from "lucide-react";
import { ATTACHMENT_LIMITS } from "./attachment-types";

interface Props {
  onAdd: (files: FileList | File[]) => void;
  disabled?: boolean;
}

/**
 * Botão `+` ao lado do input. Abre file picker nativo.
 * Accept = whitelist canônica.
 */
export function AttachmentInput({ onAdd, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) onAdd(files);
      // Reset pra permitir re-selecionar mesmo arquivo
      e.target.value = "";
    },
    [onAdd]
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Anexar arquivo"
        aria-label="Anexar arquivo"
      >
        <Paperclip className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_LIMITS.ALLOWED_EXT.join(",") + "," + ATTACHMENT_LIMITS.ALLOWED_MIME.join(",")}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
}
