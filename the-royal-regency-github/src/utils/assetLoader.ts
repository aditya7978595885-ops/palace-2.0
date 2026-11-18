import * as THREE from 'three';

export interface AssetManifest {
  images: {
    palaceExterior: string | null;
    gardenBackdrop: string | null;
    royalCrest: string | null;
  };
  textures: {
    marbleFloor: string | null;
    wallpaper: string | null;
    velvetCurtain: string | null;
    rosePetal: string | null;
    gardenPath: string | null;
  };
  models: {
    crown: string | null;
    chandelier: string | null;
    fountain: string | null;
    gazebo: string | null;
  };
  audio: {
    backgroundMusic: string | null;
  };
}

const EMPTY_MANIFEST: AssetManifest = {
  images: { palaceExterior: null, gardenBackdrop: null, royalCrest: null },
  textures: {
    marbleFloor: null,
    wallpaper: null,
    velvetCurtain: null,
    rosePetal: null,
    gardenPath: null,
  },
  models: { crown: null, chandelier: null, fountain: null, gazebo: null },
  audio: { backgroundMusic: null },
};

let cachedManifest: AssetManifest | null = null;

export async function loadAssetManifest(): Promise<AssetManifest> {
  if (cachedManifest) return cachedManifest;
  try {
    const res = await fetch('/assets/manifest.json');
    if (!res.ok) {
      cachedManifest = EMPTY_MANIFEST;
      return cachedManifest;
    }
    const json = (await res.json()) as Partial<AssetManifest>;
    cachedManifest = {
      images: { ...EMPTY_MANIFEST.images, ...(json.images ?? {}) },
      textures: { ...EMPTY_MANIFEST.textures, ...(json.textures ?? {}) },
      models: { ...EMPTY_MANIFEST.models, ...(json.models ?? {}) },
      audio: { ...EMPTY_MANIFEST.audio, ...(json.audio ?? {}) },
    };
    return cachedManifest;
  } catch {
    cachedManifest = EMPTY_MANIFEST;
    return cachedManifest;
  }
}

/**
 * Safely loads an image URL or DataURL into a Three.js Texture with graceful fallback.
 */
export function loadTextureSafe(
  url: string | null | undefined,
  repeatX = 1,
  repeatY = 1
): Promise<THREE.Texture | null> {
  if (!url) return Promise.resolve(null);

  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (repeatX !== 1 || repeatY !== 1) {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(repeatX, repeatY);
        }
        texture.anisotropy = 4;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
}
