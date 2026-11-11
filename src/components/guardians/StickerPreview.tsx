import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";
import type { CollectibleSticker } from "../../data/collectibles";
import { tx } from "../../i18n";

export default function StickerPreview({ sticker, onClose }: {
  sticker: CollectibleSticker;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog ref={dialogRef} className="sticker-preview" aria-labelledby="sticker-preview-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="sticker-preview__heading">
        <span>{tx("Ilustración 3D · Sticker")}</span>
        <button type="button" onClick={onClose} autoFocus aria-label={tx("Cerrar vista del sticker")}><X size={22} /></button>
      </div>
      <img src={sticker.image} alt={tx(sticker.name)} width="640" height="640" />
      <h2 id="sticker-preview-title">{tx(sticker.name)}</h2>
      <p>{sticker.venue} · {sticker.place}</p>
      {!sticker.experienceId && <p>{tx("Las condiciones para obtener este sticker están en preparación.")}</p>}
      <a href={sticker.sourceUrl} target="_blank" rel="noopener noreferrer">
        {tx("Conocer el taller")} <ExternalLink size={15} aria-hidden="true" />
      </a>
    </dialog>
  );
}
