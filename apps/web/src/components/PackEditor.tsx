import { useEffect, useRef, useState } from "react";

import type { SymbolId } from "@kla-khlok/shared";
import { createIndexedDbPackStorage } from "../storage/packStorage";

interface SymbolSlot {
  readonly id: string;
  readonly label: string;
  readonly previewUrl: string | null;
  readonly blob: Blob | null;
}

interface PendingImage {
  readonly slotId: string;
  readonly fileName: string;
  readonly previewUrl: string;
  readonly blob: Blob;
}

const defaultSlots: readonly SymbolSlot[] = ["s0", "s1", "s2", "s3", "s4", "s5"].map((id) => ({
  id,
  label: id,
  previewUrl: null,
  blob: null,
}));

interface PackEditorProps {
  readonly onSlotImageChange?: (slotId: SymbolId, previewUrl: string) => void;
}

export function PackEditor({ onSlotImageChange }: PackEditorProps) {
  const [slots, setSlots] = useState<readonly SymbolSlot[]>(defaultSlots);
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [storageStatus, setStorageStatus] = useState("Pack is session-only until an image is saved.");
  const ownedUrls = useRef<Set<string>>(new Set());
  const storage = useRef(createIndexedDbPackStorage());

  useEffect(() => () => {
    for (const url of ownedUrls.current) URL.revokeObjectURL(url);
    ownedUrls.current.clear();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void storage.current.load().then((saved) => {
      if (cancelled || !saved) return;
      const restored = saved.slots.map((slot) => {
        const previewUrl = URL.createObjectURL(slot.blob);
        ownedUrls.current.add(previewUrl);
        return { ...slot, previewUrl };
      });
      setSlots(restored);
      setStorageStatus("Saved pack restored from this device.");
    }).catch(() => setStorageStatus("Session-only pack: device storage is unavailable."));
    return () => { cancelled = true; };
  }, []);

  const chooseFile = (slotId: string, file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const previewUrl = URL.createObjectURL(file);
    ownedUrls.current.add(previewUrl);
    setPending({ slotId, fileName: file.name, previewUrl, blob: file });
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
    const nextSlots = slots.map((slot) => {
      if (slot.id !== pending.slotId) return slot;
      if (slot.previewUrl) {
        URL.revokeObjectURL(slot.previewUrl);
        ownedUrls.current.delete(slot.previewUrl);
      }
      return { ...slot, previewUrl: pending.previewUrl, blob: pending.blob };
    });
    setSlots(nextSlots);
    onSlotImageChange?.(pending.slotId as SymbolId, pending.previewUrl);
    void storage.current.save({ revision: `local-${Date.now()}`, slots: nextSlots.filter((slot): slot is SymbolSlot & { blob: Blob } => Boolean(slot.blob)).map((slot) => ({ id: slot.id as SymbolId, label: slot.label, blob: slot.blob })) })
      .then(() => setStorageStatus("Pack saved on this device."))
      .catch(() => setStorageStatus("Pack is usable for this session; device storage is unavailable."));
    setPending(null);
  };

  return (
    <section className="pack-editor" aria-labelledby="pack-editor-title">
      <h2 id="pack-editor-title">Customize six symbols</h2>
      <p className="editor-help">Choose a square crop for each slot. Built-in IDs stay stable when pictures change.</p>
      <p className="storage-status" aria-live="polite">{storageStatus}</p>
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
