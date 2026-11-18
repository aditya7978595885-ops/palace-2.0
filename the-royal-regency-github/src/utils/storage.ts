import { DEFAULT_CUSTOMIZATION } from '../data/defaultContent';
import { PalaceCustomization } from '../types/palace';

const DB_NAME = 'TheRoyalRegencyDB';
const DB_VERSION = 1;
const STORE_NAME = 'palaceState';
const STATE_KEY = 'customization_v1';
const LS_FALLBACK_KEY = 'the_royal_regency_state_v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export function mergeWithDefaults(
  raw: Partial<PalaceCustomization> | null | undefined,
  base: PalaceCustomization = DEFAULT_CUSTOMIZATION
): PalaceCustomization {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(base);
  }

  return {
    ...base,
    ...raw,
    plaque: {
      ...base.plaque,
      ...(raw.plaque ?? {}),
    },
    decoratives: {
      ...base.decoratives,
      ...(raw.decoratives ?? {}),
    },
    assets: {
      ...base.assets,
      ...(raw.assets ?? {}),
    },
    photos:
      Array.isArray(raw.photos) && raw.photos.length > 0
        ? raw.photos
        : structuredClone(base.photos),
    memories:
      Array.isArray(raw.memories)
        ? raw.memories
        : structuredClone(base.memories),
  };
}

/**
 * Loads the site-wide published configuration from /palace-config.json
 * so every visitor immediately sees the owner's uploaded photos & romantic texts.
 */
export async function loadPublishedConfig(): Promise<Partial<PalaceCustomization> | null> {
  try {
    const res = await fetch('/palace-config.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<PalaceCustomization>;
    if (!data || typeof data !== 'object' || !data.publishedAt || data.publishedAt <= 0) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function saveCustomization(data: PalaceCustomization): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error('Failed to save to IndexedDB'));
    });
    db.close();
  } catch {
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Unable to persist customization locally:', err);
    }
  }
}

async function readLocalBrowserSave(): Promise<Partial<PalaceCustomization> | null> {
  try {
    const db = await openDatabase();
    const result = await new Promise<Partial<PalaceCustomization> | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(STATE_KEY);
        req.onsuccess = () => resolve(req.result as Partial<PalaceCustomization> | undefined);
        req.onerror = () => reject(req.error ?? new Error('Failed to read IndexedDB'));
      }
    );
    db.close();
    if (result) return result;
  } catch {
    // Fall back to localStorage below
  }

  try {
    const raw = window.localStorage.getItem(LS_FALLBACK_KEY);
    if (raw) {
      return JSON.parse(raw) as Partial<PalaceCustomization>;
    }
  } catch {
    // Ignore malformed fallback
  }

  return null;
}

export async function loadCustomization(): Promise<PalaceCustomization> {
  const [published, localSave] = await Promise.all([
    loadPublishedConfig(),
    readLocalBrowserSave(),
  ]);

  const baseConfig = published
    ? mergeWithDefaults(published, DEFAULT_CUSTOMIZATION)
    : structuredClone(DEFAULT_CUSTOMIZATION);

  if (!localSave) {
    return baseConfig;
  }

  // If the site owner published a newer palace-config.json than what this visitor cached,
  // show the newly published photos and messages immediately.
  const publishedTs = published?.publishedAt ?? 0;
  const localTs = localSave.publishedAt ?? 0;
  if (publishedTs > 0 && publishedTs > localTs) {
    return baseConfig;
  }

  return mergeWithDefaults(localSave, baseConfig);
}

export async function clearCustomization(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    // Ignore
  }

  try {
    window.localStorage.removeItem(LS_FALLBACK_KEY);
  } catch {
    // Ignore
  }
}
