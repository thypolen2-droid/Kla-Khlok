import { useEffect, useRef, useState } from "react";

interface SymbolSlot {
  readonly id: string;
  readonly label: string;
  readonly previewUrl: string | null;
}

interface PendingImage {
  readonly slotId: string;
  readonly fileName: string;
  readonly previewUrl: string;
}

const defaultSlots: readonly SymbolSlot[] = ["s0", "s1", "s2", "s3", "s4", "s5"].map((id) => ({
  id,
  label: id,
  previewUrl: null,
}));

export function PackEditor() {
  const [slots, setSlots] = useState<readonly SymbolSlot[]>(defaultSlots);
  const [pending, setPending] = useState<PendingImage | null>(null);
  const ownedUrls = useRef<Set<string>>(new Set());

  useEffect(() => () => {
    for (const url of ownedUrls.current) URL.revokeObjectURL(url);
    ownedUrls.current.clear();
  }, []);

  const chooseFile = (slotId: string, file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const previewUrl = URL.createObjectURL(file);
    ownedUrls.current.add(previewUrl);
    setPending({ slotId, fileName: file.name, previewUrl });
  };

  const cancelCrop = () => {
    if (pending) {
      URL.revokeObjectURL(pending.previewUrl);
      ownedUrls.current.delete(pending.previewUrl);
    }
    setPending(null);
  };

  const saveCrop = () => {
    if (!pending) return;
    setSlots((current) => current.map((slot) => {
      if (slot.id !== pending.slotId) return slot;
      if (slot.previewUrl) {
        URL.revokeObjectURL(slot.previewUrl);
        ownedUrls.current.delete(slot.previewUrl);
      }
      return { ...slot, previewUrl: pending.previewUrl };
    }));
    setPending(null);
  };

  return (
    <section className="pack-editor" aria-labelledby="pack-editor-title">
      <h2 id="pack-editor-title">Customize six symbols</h2>
      <p className="editor-help">Choose a square crop for each slot. Built-in IDs stay stable when pictures change.</p>
      <div className="pack-grid">
        {slots.map((slot) => (
          <label className="pack-slot" key={slot.id}>
            <span>{slot.id}</span>
            <span className="slot-preview" style={slot.previewUrl ? { backgroundImage: `url(${slot.previewUrl})` } : undefined}>
              {!slot.previewUrl && slot.label}
            </span>
            <span className="slot-action">Choose picture</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => chooseFile(slot.id, event.target.files?.[0])}
            />
          </label>
        ))}
      </div>
      {pending && (
        <div className="crop-dialog" role="dialog" aria-modal="true" aria-labelledby="crop-title">
          <h3 id="crop-title">Crop {pending.fileName}</h3>
          <div className="crop-preview" style={{ backgroundImage: `url(${pending.previewUrl})` }} />
          <p>Square preview · the center crop will be used.</p>
          <button type="button" onClick={saveCrop}>Use this crop</button>
          <button type="button" onClick={cancelCrop}>Cancel</button>
        </div>
      )}
    </section>
  );
}
