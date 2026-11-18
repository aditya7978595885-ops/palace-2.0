import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  GalleryLayout,
  GalleryPhoto,
  PalaceCustomization,
  ThemePalette,
} from '../types/palace';
import { PhotoFrame } from '../components/PhotoFrame';
import {
  FallingRosePetals,
  FloatingStardust,
  RoyalChandelier,
  RoyalColumn,
} from '../components/SceneEffects';
import {
  createDamaskWallpaperTexture,
  createMarbleTexture,
  createVelvetTexture,
} from '../utils/proceduralTextures';
import { loadTextureSafe } from '../utils/assetLoader';

interface PortraitGalleryProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  isUploading: boolean;
  onUploadSinglePhoto: (frameId: string, file: File) => Promise<boolean>;
  onUploadMultiplePhotos: (files: FileList) => Promise<number>;
  onUpdatePhoto: (id: string, partial: Partial<GalleryPhoto>) => void;
  onDeletePhotoImage: (id: string) => void;
  onSetFrameCount: (count: number) => void;
  onChangeLayout: (layout: GalleryLayout) => void;
}

interface FramePlacement {
  position: [number, number, number];
  rotation: [number, number, number];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

function computeFramePlacements(
  count: number,
  layout: GalleryLayout
): FramePlacement[] {
  const placements: FramePlacement[] = [];

  if (layout === 'semicircle') {
    const radius = Math.max(7.2, count * 1.15);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = THREE.MathUtils.lerp(-Math.PI * 0.42, Math.PI * 0.42, t);
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius + 3.2;
      const rotY = -angle;
      const camDist = 4.3;
      const cx = x - Math.sin(angle) * camDist;
      const cz = z + Math.cos(angle) * camDist;
      placements.push({
        position: [x, 3.0, z],
        rotation: [0, rotY, 0],
        cameraPos: [cx, 3.05, cz],
        cameraTarget: [x, 2.95, z],
      });
    }
    return placements;
  }

  if (layout === 'rotunda') {
    const radius = Math.max(6.8, count * 0.85);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius;
      const rotY = -angle;
      const camDist = 4.2;
      const cx = x - Math.sin(angle) * camDist;
      const cz = z + Math.cos(angle) * camDist;
      placements.push({
        position: [x, 3.0, z],
        rotation: [0, rotY, 0],
        cameraPos: [cx, 3.05, cz],
        cameraTarget: [x, 2.95, z],
      });
    }
    return placements;
  }

  // Default: Classic Palace Corridor (frames alternating along left & right gilded walls)
  const spacing = 4.0;
  const halfPairs = Math.ceil(count / 2);
  const startZ = ((halfPairs - 1) * spacing) / 2 - 2.0;

  for (let i = 0; i < count; i++) {
    const isLeft = i % 2 === 0;
    const row = Math.floor(i / 2);
    const x = isLeft ? -6.3 : 6.3;
    const z = startZ - row * spacing;
    const rotY = isLeft ? Math.PI / 2 : -Math.PI / 2;
    const camX = isLeft ? x + 4.3 : x - 4.3;

    placements.push({
      position: [x, 3.05, z],
      rotation: [0, rotY, 0],
      cameraPos: [camX, 3.05, z],
      cameraTarget: [x, 3.0, z],
    });
  }
  return placements;
}

interface GalleryWorldProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  placements: FramePlacement[];
  selectedIndex: number | null;
  onSelectFrame: (index: number) => void;
}

const GalleryWorld: React.FC<GalleryWorldProps> = ({
  customization,
  theme,
  placements,
  selectedIndex,
  onSelectFrame,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [customMarbleTex, setCustomMarbleTex] = useState<THREE.Texture | null>(null);
  const [customWallTex, setCustomWallTex] = useState<THREE.Texture | null>(null);
  const [customPetalTex, setCustomPetalTex] = useState<THREE.Texture | null>(null);

  const proceduralMarble = useMemo(
    () => createMarbleTexture('#f7f0e6', '#d8c8b6', theme.primary, 8),
    [theme.primary]
  );
  const proceduralWall = useMemo(
    () => createDamaskWallpaperTexture(theme.wallColor, theme.primary, 8, 3),
    [theme.wallColor, theme.primary]
  );
  const velvetTex = useMemo(
    () => createVelvetTexture(theme.burgundy, 1, 8),
    [theme.burgundy]
  );

  useEffect(() => {
    return () => {
      proceduralMarble.dispose();
      proceduralWall.dispose();
      velvetTex.dispose();
    };
  }, [proceduralMarble, proceduralWall, velvetTex]);

  useEffect(() => {
    let active = true;
    loadTextureSafe(customization.assets.marbleTextureUrl, 8, 8).then((t) => {
      if (active) setCustomMarbleTex(t);
    });
    loadTextureSafe(customization.assets.wallpaperTextureUrl, 8, 3).then((t) => {
      if (active) setCustomWallTex(t);
    });
    loadTextureSafe(customization.assets.roseTextureUrl, 1, 1).then((t) => {
      if (active) setCustomPetalTex(t);
    });
    return () => {
      active = false;
    };
  }, [
    customization.assets.marbleTextureUrl,
    customization.assets.wallpaperTextureUrl,
    customization.assets.roseTextureUrl,
  ]);

  // Smooth GSAP camera travel to focused frame or gallery overview
  useEffect(() => {
    const controls = controlsRef.current;
    if (selectedIndex !== null && placements[selectedIndex]) {
      const p = placements[selectedIndex];
      gsap.to(camera.position, {
        x: p.cameraPos[0],
        y: p.cameraPos[1],
        z: p.cameraPos[2],
        duration: 1.15,
        ease: 'power3.inOut',
      });
      if (controls) {
        gsap.to(controls.target, {
          x: p.cameraTarget[0],
          y: p.cameraTarget[1],
          z: p.cameraTarget[2],
          duration: 1.15,
          ease: 'power3.inOut',
        });
      }
    } else {
      const overviewPos =
        customization.galleryLayout === 'corridor'
          ? [0, 3.6, 11.5]
          : customization.galleryLayout === 'semicircle'
          ? [0, 4.0, 10.5]
          : [0, 4.2, 2.2];
      const overviewTarget =
        customization.galleryLayout === 'rotunda' ? [0, 2.9, -4] : [0, 2.9, -3.5];

      gsap.to(camera.position, {
        x: overviewPos[0],
        y: overviewPos[1],
        z: overviewPos[2],
        duration: 1.2,
        ease: 'power2.out',
      });
      if (controls) {
        gsap.to(controls.target, {
          x: overviewTarget[0],
          y: overviewTarget[1],
          z: overviewTarget[2],
          duration: 1.2,
          ease: 'power2.out',
        });
      }
    }
  }, [selectedIndex, placements, customization.galleryLayout, camera]);

  const marbleMap = customMarbleTex || proceduralMarble;
  const wallMap = customWallTex || proceduralWall;
  const isCorridor = customization.galleryLayout === 'corridor';

  return (
    <>
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.fogColor, 18, 44]} />

      <ambientLight intensity={0.68} color={theme.ambientLight} />
      <hemisphereLight args={['#fff4e4', '#4b2335', 0.52]} />
      <directionalLight position={[4, 12, 8]} intensity={0.9} color="#ffebc9" />

      {/* Reflective Marble Gallery Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[34, 42]} />
        <MeshReflectorMaterial
          mirror={0.32}
          blur={[300, 100]}
          resolution={512}
          mixBlur={0.9}
          mixStrength={0.55}
          roughness={0.22}
          map={marbleMap}
          color="#f7f0e6"
          metalness={0.12}
        />
      </mesh>

      {/* Velvet Carpet Runner in Corridor */}
      {isCorridor && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -2]}>
            <planeGeometry args={[3.8, 32]} />
            <meshStandardMaterial map={velvetTex} roughness={0.85} />
          </mesh>
          {[-1.95, 1.95].map((x, idx) => (
            <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.018, -2]}>
              <planeGeometry args={[0.12, 32]} />
              <meshStandardMaterial color={theme.primary} metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      )}

      {/* Corridor Architecture */}
      {isCorridor ? (
        <group>
          {/* Left & Right Gallery Walls */}
          <mesh position={[-6.55, 5.2, -2]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[36, 10.4]} />
            <meshStandardMaterial map={wallMap} roughness={0.55} />
          </mesh>
          <mesh position={[6.55, 5.2, -2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[36, 10.4]} />
            <meshStandardMaterial map={wallMap} roughness={0.55} />
          </mesh>
          {/* End Focal Wall */}
          <mesh position={[0, 5.2, -19]}>
            <planeGeometry args={[14, 10.4]} />
            <meshStandardMaterial map={wallMap} roughness={0.55} />
          </mesh>
          {/* Vaulted Ceiling */}
          <mesh position={[0, 10.2, -2]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[14, 36]} />
            <meshStandardMaterial color="#f5ecdc" roughness={0.62} />
          </mesh>
          {/* Classical Pilaster Columns along corridor */}
          {[-5.8, 5.8].map((x) =>
            [-14, -6, 2, 10].map((z) => (
              <RoyalColumn
                key={`${x}-${z}`}
                position={[x, 0, z]}
                height={9.8}
                radius={0.32}
                goldColor={theme.primary}
                marbleColor={theme.ivory}
              />
            ))
          )}
        </group>
      ) : (
        /* Grand Circular Rotunda Enclosure for Semicircle & Rotunda layouts */
        <group>
          <mesh position={[0, 5.4, 0]}>
            <cylinderGeometry args={[14.5, 14.5, 10.8, 48, 1, true]} />
            <meshStandardMaterial map={wallMap} side={THREE.BackSide} roughness={0.55} />
          </mesh>
          <mesh position={[0, 10.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[14.6, 48]} />
            <meshStandardMaterial color="#f5ecdc" roughness={0.62} />
          </mesh>
          {Array.from({ length: 8 }, (_, idx) => {
            const a = (idx / 8) * Math.PI * 2;
            return (
              <RoyalColumn
                key={idx}
                position={[Math.sin(a) * 13.6, 0, Math.cos(a) * 13.6]}
                height={10.2}
                radius={0.38}
                goldColor={theme.primary}
                marbleColor={theme.ivory}
              />
            );
          })}
        </group>
      )}

      {/* Gallery Chandeliers */}
      <RoyalChandelier
        position={[0, 8.2, 4]}
        scale={1.05}
        goldColor={theme.primary}
        glowEnabled={customization.decoratives.enableChandelierGlow}
        lightIntensity={20}
      />
      <RoyalChandelier
        position={[0, 8.2, -4]}
        scale={1.05}
        goldColor={theme.primary}
        glowEnabled={customization.decoratives.enableChandelierGlow}
        lightIntensity={20}
      />
      <RoyalChandelier
        position={[0, 8.2, -12]}
        scale={1.05}
        goldColor={theme.primary}
        glowEnabled={customization.decoratives.enableChandelierGlow}
        lightIntensity={18}
      />

      {/* ALL 3D GILDED PORTRAIT FRAMES */}
      {customization.photos.map((photo, idx) => {
        const placement = placements[idx];
        if (!placement) return null;
        return (
          <PhotoFrame
            key={photo.id}
            photo={photo}
            index={idx}
            position={placement.position}
            rotation={placement.rotation}
            goldColor={theme.primary}
            secondaryColor={theme.secondary}
            isSelected={selectedIndex === idx}
            onSelect={(_, frameIdx) => onSelectFrame(frameIdx)}
          />
        );
      })}

      {/* Petals & Stardust */}
      <FallingRosePetals
        count={65}
        area={[18, 9.5, 26]}
        color={theme.petalColor}
        customTexture={customPetalTex}
        enabled={customization.decoratives.enableFallingPetals}
      />
      <FloatingStardust
        count={140}
        spread={[18, 9, 26]}
        color="#fae2a4"
        size={0.08}
        enabled={customization.decoratives.enableStardust}
      />

      <OrbitControls
        ref={controlsRef}
        target={[0, 2.9, -3.5]}
        enablePan={true}
        minDistance={2.4}
        maxDistance={16}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.54}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
};

export const PortraitGallery: React.FC<PortraitGalleryProps> = ({
  customization,
  theme,
  isUploading,
  onUploadSinglePhoto,
  onUploadMultiplePhotos,
  onUpdatePhoto,
  onDeletePhotoImage,
  onSetFrameCount,
  onChangeLayout,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [enlargedOpen, setEnlargedOpen] = useState(false);
  const bulkUploadRef = useRef<HTMLInputElement>(null);

  const placements = useMemo(
    () => computeFramePlacements(customization.photos.length, customization.galleryLayout),
    [customization.photos.length, customization.galleryLayout]
  );

  // Keep selectedIndex valid if frame count shrinks
  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= customization.photos.length) {
      setSelectedIndex(null);
      setEnlargedOpen(false);
    }
  }, [customization.photos.length, selectedIndex]);

  const activePhoto =
    selectedIndex !== null ? customization.photos[selectedIndex] ?? null : null;

  const stepFrame = (dir: -1 | 1) => {
    const total = customization.photos.length;
    if (total === 0) return;
    setSelectedIndex((prev) => {
      if (prev === null) return dir === 1 ? 0 : total - 1;
      return (prev + dir + total) % total;
    });
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 3.6, 11.5], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
      >
        <GalleryWorld
          customization={customization}
          theme={theme}
          placements={placements}
          selectedIndex={selectedIndex}
          onSelectFrame={(idx) => {
            setSelectedIndex(idx);
          }}
        />
      </Canvas>

      {/* Bottom-Left Gallery Studio Controls */}
      <div className="pointer-events-none fixed bottom-16 left-4 right-4 z-20 flex flex-col gap-2.5 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md">
        <div className="royal-glass pointer-events-auto rounded-3xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 font-royal-display text-[10px] uppercase tracking-[0.28em] text-[#f4c2c2]">
                <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
                Chapter III • Portrait Gallery
              </div>
              <h2 className="gold-shimmer-text font-royal-display mt-1 text-lg tracking-[0.12em] sm:text-xl">
                {customization.galleryTitle}
              </h2>
            </div>
            <input
              ref={bulkUploadRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onUploadMultiplePhotos(e.target.files);
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => bulkUploadRef.current?.click()}
              className="royal-btn inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px]"
            >
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? 'Loading...' : 'Upload Photos'}
            </button>
          </div>

          {/* Layout & Frame Count Quick Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#d4af37]/20 pt-3">
            <div className="flex items-center gap-1">
              {(['corridor', 'semicircle', 'rotunda'] as GalleryLayout[]).map((layout) => (
                <button
                  key={layout}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(null);
                    onChangeLayout(layout);
                  }}
                  className={`rounded-full px-2.5 py-1 font-royal-display text-[9px] uppercase tracking-wider transition ${
                    customization.galleryLayout === layout
                      ? 'bg-[#d4af37]/30 text-[#fff6df] border border-[#f3d9a4]/65'
                      : 'text-[#faf6f0]/70 hover:bg-white/10'
                  }`}
                >
                  {layout}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-black/30 px-2 py-0.5 text-[10px] text-[#f3d9a4]">
              <button
                type="button"
                onClick={() => onSetFrameCount(customization.galleryFrameCount - 1)}
                aria-label="Decrease frames"
                className="p-1 hover:text-white"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="font-royal-display">{customization.galleryFrameCount} Frames</span>
              <button
                type="button"
                onClick={() => onSetFrameCount(customization.galleryFrameCount + 1)}
                aria-label="Increase frames"
                className="p-1 hover:text-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Frame Tour Stepper */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => stepFrame(-1)}
              className="royal-btn-outline inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev Frame
            </button>

            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="text-[11px] italic text-[#f4c2c2]/85 hover:text-[#fff6df]"
            >
              {selectedIndex !== null
                ? `Inspecting Portrait #${selectedIndex + 1} (Reset View)`
                : 'Click any golden frame to focus & upload'}
            </button>

            <button
              type="button"
              onClick={() => stepFrame(1)}
              className="royal-btn-outline inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px]"
            >
              Next Frame
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Frame Side Inspector Card */}
      {activePhoto && selectedIndex !== null && !enlargedOpen && (
        <div className="royal-glass fixed right-4 top-20 z-20 w-[calc(100%-2rem)] max-w-xs rounded-3xl p-4 sm:right-6">
          <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2.5">
            <span className="font-royal-display text-xs uppercase tracking-[0.2em] text-[#f3d9a4]">
              Portrait #{selectedIndex + 1}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEnlargedOpen(true)}
                title="Enlarge Portrait"
                className="rounded-full border border-[#d4af37]/35 p-1.5 text-[#f3d9a4] hover:bg-white/10"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                aria-label="Close inspector"
                className="rounded-full border border-[#d4af37]/35 p-1.5 text-[#f3d9a4] hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Mini Preview */}
          <div
            onClick={() => setEnlargedOpen(true)}
            className="mt-3 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-[#d4af37]/35 bg-black/40"
          >
            {activePhoto.dataUrl ? (
              <img
                src={activePhoto.dataUrl}
                alt={activePhoto.caption}
                className="h-full w-full object-cover transition hover:scale-105"
              />
            ) : (
              <div className="text-center text-xs text-[#f4c2c2]/80">
                <ImageIcon className="mx-auto mb-1.5 h-6 w-6 text-[#d4af37]" />
                No photograph uploaded yet
              </div>
            )}
          </div>

          {/* Caption & Date Live Inputs */}
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={activePhoto.caption}
              placeholder="Write a romantic caption..."
              onChange={(e) =>
                onUpdatePhoto(activePhoto.id, { caption: e.target.value })
              }
              className="w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-1.5 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
            />
            <input
              type="text"
              value={activePhoto.date}
              placeholder="Date or chapter title..."
              onChange={(e) =>
                onUpdatePhoto(activePhoto.id, { date: e.target.value })
              }
              className="w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-1.5 text-xs text-[#f3d9a4] outline-none focus:border-[#f3d9a4]"
            />
          </div>

          {/* Rotate 3D Frame Slider */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-[#f3d9a4]">
              <span className="inline-flex items-center gap-1">
                <RotateCw className="h-3 w-3" />
                Rotate Frame
              </span>
              <span>{Math.round(((activePhoto.rotationY || 0) * 180) / Math.PI)}°</span>
            </div>
            <input
              type="range"
              min={-0.65}
              max={0.65}
              step={0.05}
              value={activePhoto.rotationY || 0}
              onChange={(e) =>
                onUpdatePhoto(activePhoto.id, {
                  rotationY: parseFloat(e.target.value),
                })
              }
              className="royal-slider mt-1.5 w-full"
            />
          </div>

          {/* Upload / Replace / Delete Actions */}
          <div className="mt-3.5 flex items-center gap-2">
            <label className="royal-btn flex-1 cursor-pointer rounded-full py-2 text-center text-[10px]">
              {activePhoto.dataUrl ? 'Replace Photo' : 'Upload Photo'}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUploadSinglePhoto(activePhoto.id, file);
                    e.target.value = '';
                  }
                }}
              />
            </label>
            {activePhoto.dataUrl && (
              <button
                type="button"
                onClick={() => onDeletePhotoImage(activePhoto.id)}
                title="Clear Photo"
                className="rounded-full border border-rose-400/35 p-2 text-rose-300 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Enlarged Lightbox View */}
      {activePhoto && selectedIndex !== null && enlargedOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setEnlargedOpen(false)}
        >
          <div
            className="royal-glass relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <div>
                <p className="font-royal-display text-[10px] uppercase tracking-[0.28em] text-[#f4c2c2]">
                  {activePhoto.date || `Portrait #${selectedIndex + 1}`}
                </p>
                <h3 className="font-royal-display text-lg tracking-wider text-[#f3d9a4] sm:text-xl">
                  {activePhoto.caption}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEnlargedOpen(false)}
                className="rounded-full border border-[#d4af37]/35 p-2 text-[#f3d9a4] hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#d4af37]/50 bg-black/50 p-2">
              {activePhoto.dataUrl ? (
                <img
                  src={activePhoto.dataUrl}
                  alt={activePhoto.caption}
                  className="max-h-[65vh] w-auto rounded-xl object-contain"
                />
              ) : (
                <div className="p-10 text-center">
                  <ImageIcon className="mx-auto mb-3 h-12 w-12 text-[#d4af37]/80" />
                  <p className="font-royal-display text-sm uppercase tracking-widest text-[#f3d9a4]">
                    This Gilded Frame Awaits Your Photograph
                  </p>
                  <label className="royal-btn mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 text-[11px]">
                    <Upload className="h-4 w-4" />
                    Upload JPG / PNG / WEBP
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onUploadSinglePhoto(activePhoto.id, file);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => stepFrame(-1)}
                className="royal-btn-outline inline-flex items-center gap-1 rounded-full px-4 py-2 text-[10px]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <label className="royal-btn-outline inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[10px]">
                <Upload className="h-3.5 w-3.5" />
                {activePhoto.dataUrl ? 'Replace Photograph' : 'Upload Photograph'}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUploadSinglePhoto(activePhoto.id, file);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => stepFrame(1)}
                className="royal-btn-outline inline-flex items-center gap-1 rounded-full px-4 py-2 text-[10px]"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
