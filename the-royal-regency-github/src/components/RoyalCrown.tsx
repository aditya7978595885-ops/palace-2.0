import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Camera,
  CameraOff,
  Crown,
  Download,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { CrownStyleId, CrownTransform } from '../types/palace';
import { useCamera } from '../hooks/useCamera';
import { loadAssetManifest } from '../utils/assetLoader';

interface CrownMeshProps {
  styleId: CrownStyleId;
  customModelUrl?: string | null;
  transform?: CrownTransform;
  autoSpin?: boolean;
}

/**
 * Loads an optional local GLB/GLTF crown if supplied; returns null gracefully if absent or invalid.
 */
function useOptionalCustomCrown(url: string | null | undefined) {
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (!url) {
      setScene(null);
      return;
    }
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;
        const root = gltf.scene.clone(true);
        // Auto-normalize scale to ~1.8 units wide
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const normScale = 1.8 / maxDim;
        root.scale.setScalar(normScale);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.sub(center.multiplyScalar(normScale));
        setScene(root);
      },
      undefined,
      () => {
        if (!cancelled) setScene(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  return scene;
}

export const RoyalCrownMesh: React.FC<CrownMeshProps> = ({
  styleId,
  customModelUrl,
  transform,
  autoSpin = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const customScene = useOptionalCustomCrown(customModelUrl);

  const palette = useMemo(() => {
    if (styleId === 'rose-tiara') {
      return {
        metal: '#e8b4b8',
        gemPrimary: '#ff5c8a',
        gemSecondary: '#fff4fa',
        velvet: '#6d1c3d',
      };
    }
    if (styleId === 'imperial-diadem') {
      return {
        metal: '#f0d384',
        gemPrimary: '#7ec8ff',
        gemSecondary: '#ffffff',
        velvet: '#2d144a',
      };
    }
    return {
      metal: '#e5bc4b',
      gemPrimary: '#c9184a',
      gemSecondary: '#fff7e6',
      velvet: '#5e1129',
    };
  }, [styleId]);

  const spikes = useMemo(() => {
    const count = styleId === 'rose-tiara' ? 9 : 8;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const isFront = styleId === 'rose-tiara' ? Math.cos(angle - Math.PI / 2) : 1;
      const heightBoost =
        styleId === 'rose-tiara' ? Math.max(0.28, (isFront + 1) * 0.45) : i % 2 === 0 ? 0.92 : 0.62;
      return { angle, heightBoost, major: i % 2 === 0 };
    });
  }, [styleId]);

  const pearls = useMemo(
    () => Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (autoSpin) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.55;
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.4) * 0.08;
    } else if (transform) {
      groupRef.current.position.set(transform.x, transform.y, 0);
      groupRef.current.scale.setScalar(transform.scale);
      groupRef.current.rotation.set(
        transform.rotationX,
        transform.rotationY,
        transform.rotationZ
      );
    }
  });

  if (customScene) {
    return (
      <group ref={groupRef}>
        <primitive object={customScene} />
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {/* Main gilded circlet band */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.92, 0.86, 0.34, 48, 1, true]} />
        <meshStandardMaterial
          color={palette.metal}
          metalness={0.94}
          roughness={0.14}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Top & bottom beveled gold trim rings */}
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.92, 0.045, 16, 48]} />
        <meshStandardMaterial color={palette.metal} metalness={0.96} roughness={0.12} />
      </mesh>
      <mesh position={[0, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.86, 0.048, 16, 48]} />
        <meshStandardMaterial color={palette.metal} metalness={0.96} roughness={0.12} />
      </mesh>

      {/* Velvet royal cap inside Sovereign Crown */}
      {styleId === 'sovereign' && (
        <mesh position={[0, 0.25, 0]} scale={[1, 0.72, 1]}>
          <sphereGeometry args={[0.82, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color={palette.velvet} roughness={0.85} metalness={0.05} />
        </mesh>
      )}

      {/* Sovereign crossed golden arches + top orb & cross */}
      {styleId === 'sovereign' && (
        <group position={[0, 0.2, 0]}>
          {[0, Math.PI / 2].map((rot, idx) => (
            <mesh key={idx} rotation={[0, rot, 0]}>
              <torusGeometry args={[0.88, 0.045, 14, 36, Math.PI]} />
              <meshStandardMaterial color={palette.metal} metalness={0.95} roughness={0.14} />
            </mesh>
          ))}
          <mesh position={[0, 0.94, 0]}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color={palette.metal} metalness={0.96} roughness={0.1} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.045, 0.24, 0.045]} />
            <meshStandardMaterial color={palette.metal} metalness={0.96} roughness={0.1} />
          </mesh>
          <mesh position={[0, 1.19, 0]}>
            <boxGeometry args={[0.17, 0.045, 0.045]} />
            <meshStandardMaterial color={palette.metal} metalness={0.96} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Fleur-de-lis spires & crest gemstones */}
      {spikes.map((s, idx) => {
        const x = Math.cos(s.angle) * 0.9;
        const z = Math.sin(s.angle) * 0.9;
        const h = s.heightBoost * 0.75;
        return (
          <group key={idx} position={[x, 0.16, z]} rotation={[0, -s.angle + Math.PI / 2, 0]}>
            <mesh position={[0, h / 2, 0]}>
              <coneGeometry args={[s.major ? 0.16 : 0.11, h, 6]} />
              <meshStandardMaterial color={palette.metal} metalness={0.95} roughness={0.14} />
            </mesh>
            {/* Pearl or jewel finial at tip */}
            <mesh position={[0, h + 0.05, 0]}>
              <octahedronGeometry args={[s.major ? 0.085 : 0.06, 1]} />
              <meshStandardMaterial
                color={s.major ? palette.gemPrimary : palette.gemSecondary}
                roughness={0.08}
                metalness={0.2}
                emissive={s.major ? palette.gemPrimary : '#ffe8c2'}
                emissiveIntensity={0.45}
              />
            </mesh>
            {/* Band medallion jewel */}
            <mesh position={[0, -0.16, 0.05]}>
              <octahedronGeometry args={[s.major ? 0.095 : 0.065, 0]} />
              <meshStandardMaterial
                color={s.major ? palette.gemPrimary : palette.gemSecondary}
                roughness={0.06}
                metalness={0.15}
                emissive={s.major ? palette.gemPrimary : '#fff0cc'}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        );
      })}

      {/* Pearl rim beading */}
      {pearls.map((angle, idx) => (
        <mesh
          key={`pearl-${idx}`}
          position={[Math.cos(angle) * 0.93, 0.17, Math.sin(angle) * 0.93]}
        >
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.18} metalness={0.12} />
        </mesh>
      ))}
    </group>
  );
};

interface RoyalCrownTryOnModalProps {
  isOpen: boolean;
  recipientName: string;
  crownStyle: CrownStyleId;
  customModelUrl: string | null;
  onChangeCrownStyle: (style: CrownStyleId) => void;
  onClose: () => void;
}

const DEFAULT_MANUAL: CrownTransform = {
  x: 0,
  y: 0.55,
  scale: 1.05,
  rotationZ: 0,
  rotationY: 0,
  rotationX: 0.15,
};

export const RoyalCrownTryOnModal: React.FC<RoyalCrownTryOnModalProps> = ({
  isOpen,
  recipientName,
  crownStyle,
  customModelUrl,
  onChangeCrownStyle,
  onClose,
}) => {
  const [autoTrack, setAutoTrack] = useState(true);
  const [manual, setManual] = useState<CrownTransform>(DEFAULT_MANUAL);
  const [manifestCrownUrl, setManifestCrownUrl] = useState<string | null>(null);
  const [snapshotFlash, setSnapshotFlash] = useState(false);

  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { videoRef, status, errorMessage, facePose, startCamera, stopCamera } =
    useCamera(autoTrack);

  useEffect(() => {
    loadAssetManifest().then((m) => setManifestCrownUrl(m.models.crown));
  }, []);

  // Ensure webcam stops cleanly whenever modal closes
  useEffect(() => {
    if (!isOpen && status === 'active') {
      stopCamera();
    }
  }, [isOpen, status, stopCamera]);

  if (!isOpen) return null;

  const isLive = status === 'active';
  const resolvedCrownModel = customModelUrl || manifestCrownUrl;

  // Combine optional local face tracking with user manual fine-tuning
  const combinedTransform: CrownTransform = isLive && autoTrack && facePose.detected
    ? {
        x: facePose.x * 1.45 + manual.x,
        y: facePose.y * 1.15 + (manual.y - 0.55) + 0.35,
        scale: Math.max(0.45, Math.min(2.2, facePose.scale * manual.scale)),
        rotationZ: manual.rotationZ,
        rotationY: manual.rotationY,
        rotationX: manual.rotationX,
      }
    : manual;

  const handleCaptureSnapshot = () => {
    const out = document.createElement('canvas');
    out.width = 1280;
    out.height = 720;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    // Background / mirrored video
    if (isLive && videoRef.current && videoRef.current.readyState >= 2) {
      ctx.save();
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, out.width, out.height);
      ctx.restore();
    } else {
      const grad = ctx.createRadialGradient(640, 320, 60, 640, 360, 720);
      grad.addColorStop(0, '#3a1735');
      grad.addColorStop(1, '#100716');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, out.width, out.height);
    }

    // Composite WebGL 3D Crown canvas directly on top
    if (webglCanvasRef.current) {
      ctx.drawImage(webglCanvasRef.current, 0, 0, out.width, out.height);
    }

    // Gilded royal keepsake border & dedication
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, out.width - 40, out.height - 40);
    ctx.fillStyle = '#f8e6b5';
    ctx.font = '600 28px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`THE ROYAL REGENCY  •  ${recipientName.toUpperCase()}`, out.width / 2, out.height - 42);

    const link = document.createElement('a');
    link.download = `royal-crown-portrait-${Date.now()}.png`;
    link.href = out.toDataURL('image/png');
    link.click();

    setSnapshotFlash(true);
    window.setTimeout(() => setSnapshotFlash(false), 320);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-6">
      <div className="royal-glass flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl lg:flex-row">
        {/* Left: Live Mirror Viewport & 3D Crown Overlay */}
        <div className="relative flex min-h-[340px] flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#2f1431_0%,#120818_75%)] lg:min-h-[560px]">
          {/* Mirrored live camera video (100% local) */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-500 ${
              isLive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* 3D WebGL Crown Overlay Canvas */}
          <div className="absolute inset-0">
            <Canvas
              camera={{ position: [0, 0.2, 4.2], fov: 40 }}
              gl={{ alpha: true, preserveDrawingBuffer: true, antialias: true }}
              onCreated={({ gl }) => {
                webglCanvasRef.current = gl.domElement;
              }}
            >
              <ambientLight intensity={0.9} color="#fff4e0" />
              <directionalLight position={[4, 6, 6]} intensity={2.1} color="#fff2d2" />
              <pointLight position={[-4, 3, 4]} intensity={1.4} color="#f4c2c2" />
              <pointLight position={[0, -3, 3]} intensity={0.9} color="#d4af37" />
              <Suspense fallback={null}>
                <Environment preset="sunset" />
                <RoyalCrownMesh
                  styleId={crownStyle}
                  customModelUrl={resolvedCrownModel}
                  transform={combinedTransform}
                  autoSpin={!isLive}
                />
              </Suspense>
              {!isLive && <OrbitControls enablePan={false} enableZoom={false} />}
            </Canvas>
          </div>

          {/* Snapshot flash */}
          {snapshotFlash && (
            <div className="pointer-events-none absolute inset-0 bg-white/75 transition-opacity" />
          )}

          {/* Mirror gilded frame vignette */}
          <div className="pointer-events-none absolute inset-4 rounded-2xl border border-[#d4af37]/45 shadow-[inset_0_0_45px_rgba(212,175,55,0.18)]" />

          {/* Status badge */}
          <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2">
            <span className="royal-glass-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-royal-display text-[10px] uppercase tracking-[0.18em] text-[#f3d9a4]">
              <Crown className="h-3.5 w-3.5 text-[#d4af37]" />
              {isLive
                ? autoTrack && facePose.detected
                  ? 'Live Mirror • Face Locked'
                  : 'Live Mirror Active'
                : '3D Crown Studio Preview'}
            </span>
          </div>

          {/* Privacy Assurance Banner */}
          <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-center justify-between gap-2">
            <span className="royal-glass-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] text-[#f4c2c2]/90">
              <ShieldCheck className="h-3.5 w-3.5 text-[#d4af37]" />
              100% Local Camera — Footage never leaves your device
            </span>

            {isLive && (
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="royal-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px]"
              >
                <Download className="h-3.5 w-3.5" />
                Save Keepsake
              </button>
            )}
          </div>
        </div>

        {/* Right: Royal Try-On Controls */}
        <div className="royal-scroll flex w-full flex-col justify-between overflow-y-auto border-t border-[#d4af37]/25 bg-[#140a1d]/95 p-5 lg:w-80 lg:border-l lg:border-t-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-royal-display text-[10px] uppercase tracking-[0.28em] text-[#f4c2c2]">
                  Chapter V • Royal Mirror
                </p>
                <h3 className="font-royal-display mt-1 text-lg tracking-[0.12em] text-[#f3d9a4]">
                  Virtual Crown Try-On
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                aria-label="Close Royal Mirror"
                className="rounded-full border border-[#d4af37]/30 p-1.5 text-[#f3d9a4] hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Camera Activation / Camera Off */}
            <div className="mt-4 flex flex-col gap-2">
              {!isLive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={status === 'requesting'}
                  className="royal-btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs"
                >
                  <Camera className="h-4 w-4" />
                  {status === 'requesting'
                    ? 'Requesting Camera...'
                    : 'Activate Royal Mirror Camera'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="royal-btn-outline inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs text-[#f4c2c2]"
                >
                  <CameraOff className="h-4 w-4" />
                  Turn Camera Off
                </button>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-[#f4c2c2]/35 bg-[#5c162b]/45 p-3 text-xs leading-relaxed text-[#faf6f0]/90">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Crown Style Selector */}
            <div className="mt-5">
              <label className="block font-royal-display text-[10px] uppercase tracking-[0.22em] text-[#f3d9a4]">
                Select Royal Crown
              </label>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'sovereign', label: 'Sovereign' },
                    { id: 'rose-tiara', label: 'Rose Tiara' },
                    { id: 'imperial-diadem', label: 'Diadem' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeCrownStyle(item.id)}
                    className={`rounded-xl border px-2 py-2 font-royal-display text-[10px] uppercase tracking-wider transition ${
                      crownStyle === item.id
                        ? 'border-[#f3d9a4] bg-[#d4af37]/25 text-[#fff7df]'
                        : 'border-white/10 bg-white/5 text-[#faf6f0]/75 hover:border-[#d4af37]/40'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Local Face Tracking Toggle */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#d4af37]/20 bg-white/5 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-xs text-[#faf6f0]/90">
                <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
                Local Face Tracking
              </span>
              <input
                type="checkbox"
                checked={autoTrack}
                onChange={(e) => setAutoTrack(e.target.checked)}
                className="h-4 w-4 accent-[#d4af37]"
              />
            </div>

            {/* Crown Position, Scale & Rotation Controls */}
            <div className="mt-5 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs text-[#f3d9a4]">
                  <span>Horizontal Position</span>
                  <span>{manual.x.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={-1.8}
                  max={1.8}
                  step={0.02}
                  value={manual.x}
                  onChange={(e) => setManual((m) => ({ ...m, x: parseFloat(e.target.value) }))}
                  className="royal-slider mt-1.5 w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#f3d9a4]">
                  <span>Vertical Position</span>
                  <span>{manual.y.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={-1.2}
                  max={1.6}
                  step={0.02}
                  value={manual.y}
                  onChange={(e) => setManual((m) => ({ ...m, y: parseFloat(e.target.value) }))}
                  className="royal-slider mt-1.5 w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#f3d9a4]">
                  <span>Crown Scale</span>
                  <span>{Math.round(manual.scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.45}
                  max={2.0}
                  step={0.02}
                  value={manual.scale}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, scale: parseFloat(e.target.value) }))
                  }
                  className="royal-slider mt-1.5 w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#f3d9a4]">
                  <span>Crown Tilt (Roll)</span>
                  <span>{Math.round((manual.rotationZ * 180) / Math.PI)}°</span>
                </div>
                <input
                  type="range"
                  min={-0.65}
                  max={0.65}
                  step={0.02}
                  value={manual.rotationZ}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, rotationZ: parseFloat(e.target.value) }))
                  }
                  className="royal-slider mt-1.5 w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#f3d9a4]">
                  <span>Crown Angle (Yaw)</span>
                  <span>{Math.round((manual.rotationY * 180) / Math.PI)}°</span>
                </div>
                <input
                  type="range"
                  min={-1.2}
                  max={1.2}
                  step={0.03}
                  value={manual.rotationY}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, rotationY: parseFloat(e.target.value) }))
                  }
                  className="royal-slider mt-1.5 w-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#d4af37]/20 pt-4">
            <button
              type="button"
              onClick={() => setManual(DEFAULT_MANUAL)}
              className="royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Fit
            </button>
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px]"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
