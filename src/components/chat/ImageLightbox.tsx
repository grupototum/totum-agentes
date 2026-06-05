"use client";

import { useCallback, useEffect, useRef } from "react";
import { X, Download } from "lucide-react";

interface Props {
  open: boolean;
  url: string;
  name: string;
  onClose: () => void;
}

export function ImageLightbox({ open, url, name, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      // Click no backdrop fecha
      if (e.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      className="rounded-2xl bg-transparent backdrop:bg-black/80 backdrop:backdrop-blur-sm p-0 max-w-[90vw] max-h-[90vh]"
      aria-label={`Visualizar imagem ${name}`}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          className="block max-w-[90vw] max-h-[90vh] rounded-2xl"
          style={{ boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)" }}
        />
        <div
          className="absolute top-3 right-3 flex items-center gap-2"
        >
          <a
            href={url}
            download={name}
            className="h-9 w-9 rounded-full bg-surface/80 hover:bg-surface text-white flex items-center justify-center transition-colors"
            title="Baixar"
            aria-label="Baixar"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-surface/80 hover:bg-destructive text-white flex items-center justify-center transition-colors"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 text-xs text-white rounded-b-2xl"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)" }}
        >
          {name}
        </div>
      </div>
    </dialog>
  );
}
