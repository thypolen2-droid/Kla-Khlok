import type { SymbolId } from "@kla-khlok/shared";

export interface StoredPackSlot {
  readonly id: SymbolId;
  readonly label: string;
  readonly blob: Blob;
}

export interface StoredPack {
  readonly revision: string;
  readonly slots: readonly StoredPackSlot[];
}

export interface PackStorage {
  load(): Promise<StoredPack | null>;
  save(pack: StoredPack): Promise<void>;
}

const STORE_NAME = "packs";
const RECORD_KEY = "active";

export function createIndexedDbPackStorage(databaseName = "kla-khlok"): PackStorage {
  const open = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = window.indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });

  return {
    async load() {
      const database = await open();
      return new Promise<StoredPack | null>((resolve, reject) => {
        const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(RECORD_KEY);
        request.onsuccess = () => resolve((request.result as StoredPack | undefined) ?? null);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB load failed"));
      });
    },
    async save(pack) {
      const database = await open();
      return new Promise<void>((resolve, reject) => {
        const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(pack, RECORD_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error("IndexedDB save failed"));
      });
    },
  };
}

export function createMemoryPackStorage(options: { readonly failSaves?: boolean } = {}): PackStorage {
  let stored: StoredPack | null = null;
  return {
    async load() { return stored; },
    async save(pack) {
      if (options.failSaves) throw new Error("Quota exceeded");
      stored = structuredClone(pack);
    },
  };
}
