import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDefaultPhotos,
  DEFAULT_CUSTOMIZATION,
  FONT_STYLES,
  THEMES,
} from '../data/defaultContent';
import {
  BallroomPlaqueData,
  CustomAssetOverrides,
  DecorativeOptions,
  GalleryPhoto,
  PalaceCustomization,
  RomanticMemory,
  ThemeId,
  ThemePalette,
} from '../types/palace';
import {
  clearCustomization,
  loadCustomization,
  mergeWithDefaults,
  saveCustomization,
} from '../utils/storage';

export function useCustomization() {
  const [customization, setCustomization] = useState<PalaceCustomization>(() =>
    structuredClone(DEFAULT_CUSTOMIZATION)
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<number | null>(null);

  // Initial load from IndexedDB
  useEffect(() => {
    let active = true;
    loadCustomization()
      .then((loaded) => {
        if (!active) return;
        setCustomization(loaded);
        setIsLoaded(true);
      })
      .catch(() => {
        if (active) setIsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist changes to IndexedDB (debounced)
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus('saving');
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveCustomization(customization)
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('idle'));
    }, 300);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [customization, isLoaded]);

  // Compute active theme merged with any custom color overrides
  const activeTheme: ThemePalette = useMemo(() => {
    const base = THEMES[customization.themeId] ?? THEMES['rose-champagne'];
    return {
      ...base,
      primary: customization.customAccentColor || base.primary,
      background: customization.customBackgroundColor || base.background,
    };
  }, [
    customization.themeId,
    customization.customAccentColor,
    customization.customBackgroundColor,
  ]);

  const activeFonts = useMemo(
    () => FONT_STYLES[customization.fontStyle] ?? FONT_STYLES['regency-classic'],
    [customization.fontStyle]
  );

  // Sync CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--royal-accent', activeTheme.primary);
    root.style.setProperty('--royal-secondary', activeTheme.secondary);
    root.style.setProperty('--royal-ivory', activeTheme.ivory);
    root.style.setProperty('--royal-burgundy', activeTheme.burgundy);
    root.style.setProperty('--royal-bg', activeTheme.background);
    root.style.setProperty('--royal-font-display', activeFonts.display);
    root.style.setProperty('--royal-font-body', activeFonts.body);
    root.style.setProperty('--royal-font-script', activeFonts.script);
  }, [activeTheme, activeFonts]);

  const updateField = useCallback(
    <K extends keyof PalaceCustomization>(key: K, value: PalaceCustomization[K]) => {
      setCustomization((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setTheme = useCallback((themeId: ThemeId) => {
    const palette = THEMES[themeId];
    setCustomization((prev) => ({
      ...prev,
      themeId,
      customAccentColor: palette.primary,
      customBackgroundColor: palette.background,
    }));
  }, []);

  const updatePlaque = useCallback((partial: Partial<BallroomPlaqueData>) => {
    setCustomization((prev) => ({
      ...prev,
      plaque: { ...prev.plaque, ...partial },
    }));
  }, []);

  const updateDecoratives = useCallback((partial: Partial<DecorativeOptions>) => {
    setCustomization((prev) => ({
      ...prev,
      decoratives: { ...prev.decoratives, ...partial },
    }));
  }, []);

  const updateAssetOverride = useCallback(
    <K extends keyof CustomAssetOverrides>(key: K, value: CustomAssetOverrides[K]) => {
      setCustomization((prev) => ({
        ...prev,
        assets: { ...prev.assets, [key]: value },
      }));
    },
    []
  );

  const setFrameCount = useCallback((count: number) => {
    const clamped = Math.max(4, Math.min(12, Math.round(count)));
    setCustomization((prev) => {
      const current = [...prev.photos];
      if (clamped > current.length) {
        const extras = createDefaultPhotos(clamped).slice(current.length);
        return {
          ...prev,
          galleryFrameCount: clamped,
          photos: [...current, ...extras],
        };
      }
      return {
        ...prev,
        galleryFrameCount: clamped,
        photos: current.slice(0, clamped),
      };
    });
  }, []);

  const updatePhoto = useCallback((id: string, partial: Partial<GalleryPhoto>) => {
    setCustomization((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));
  }, []);

  const deletePhotoImage = useCallback((id: string) => {
    setCustomization((prev) => ({
      ...prev,
      photos: prev.photos.map((p) =>
        p.id === id ? { ...p, dataUrl: null, aspectRatio: 0.8 } : p
      ),
    }));
  }, []);

  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    setCustomization((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.photos.length ||
        toIndex >= prev.photos.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const next = [...prev.photos];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, photos: next };
    });
  }, []);

  const addMemory = useCallback((memory: Omit<RomanticMemory, 'id'>) => {
    setCustomization((prev) => ({
      ...prev,
      memories: [
        ...prev.memories,
        {
          ...memory,
          id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        },
      ],
    }));
  }, []);

  const updateMemory = useCallback((id: string, partial: Partial<RomanticMemory>) => {
    setCustomization((prev) => ({
      ...prev,
      memories: prev.memories.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    }));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setCustomization((prev) => ({
      ...prev,
      memories: prev.memories.filter((m) => m.id !== id),
    }));
  }, []);

  const resetToDefault = useCallback(async () => {
    await clearCustomization();
    const fresh = await loadCustomization();
    setCustomization(fresh);
    setSaveStatus('saved');
  }, []);

  const importFromJson = useCallback((rawJson: string): boolean => {
    try {
      const parsed = JSON.parse(rawJson) as Partial<PalaceCustomization>;
      setCustomization(mergeWithDefaults(parsed));
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    customization,
    isLoaded,
    saveStatus,
    activeTheme,
    activeFonts,
    updateField,
    setTheme,
    updatePlaque,
    updateDecoratives,
    updateAssetOverride,
    setFrameCount,
    updatePhoto,
    deletePhotoImage,
    reorderPhotos,
    addMemory,
    updateMemory,
    deleteMemory,
    resetToDefault,
    importFromJson,
  };
}
