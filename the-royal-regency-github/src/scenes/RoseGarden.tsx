import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { BookHeart, Crown, Heart, Sparkles, X } from 'lucide-react';
import { CrownStyleId, PalaceCustomization, ThemePalette } from '../types/palace';
import {
  FallingRosePetals,
  FloatingStardust,
  RoyalColumn,
} from '../components/SceneEffects';
import { RoyalCrownMesh, RoyalCrownTryOnModal } from '../components/RoyalCrown';
import { createGardenPathTexture } from '../utils/proceduralTextures';
import { loadTextureSafe } from '../utils/assetLoader';

interface RoseGardenProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  onChangeCrownStyle: (style: CrownStyleId) => void;
}

/**
 * Custom golden-hour romantic sunset sky dome shader.
 */
const SunsetSkyDome: React.FC = () => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color('#301947') },
        uMid: { value: new THREE.Color('#c85a7c') },
        uHorizon: { value: new THREE.Color('#ffb876') },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith;
        uniform vec3 uMid;
        uniform vec3 uHorizon;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.34, h));
          col = mix(col, uZenith, smoothstep(0.32, 0.85, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[90, 32, 24]} />
    </mesh>
  );
};

/**
 * Hundreds of instanced 3D garden roses (stems + foliage + layered rose blossoms)
 * arranged neatly across royal French parterre flowerbeds.
 */
const InstancedRoseGardenBeds: React.FC<{
  density: 'lush' | 'abundant' | 'grand';
}> = ({ density }) => {
  const blossomRef = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);

  const count = density === 'grand' ? 520 : density === 'abundant' ? 360 : 220;

  const { matricesBlossom, matricesStem, colors } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const bMats: THREE.Matrix4[] = [];
    const sMats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];

    const palette = [
      new THREE.Color('#d62849'),
      new THREE.Color('#f27494'),
      new THREE.Color('#f7b2c4'),
      new THREE.Color('#fff1e6'),
      new THREE.Color('#e05374'),
      new THREE.Color('#f5c69c'),
    ];

    // Four symmetric royal flowerbeds around the central fountain plaza
    const beds: Array<[number, number, number, number]> = [
      [-11.5, -3.4, -10.5, -2.5],
      [3.4, 11.5, -10.5, -2.5],
      [-11.5, -3.4, 2.8, 10.5],
      [3.4, 11.5, 2.8, 10.5],
    ];

    for (let i = 0; i < count; i++) {
      const bed = beds[i % beds.length];
      const r1 = Math.sin(i * 12.9898 + 1.7) * 43758.5453;
      const r2 = Math.sin(i * 78.233 + 3.1) * 43758.5453;
      const r3 = Math.sin(i * 45.164 + 5.9) * 43758.5453;
      const f1 = r1 - Math.floor(r1);
      const f2 = r2 - Math.floor(r2);
      const f3 = r3 - Math.floor(r3);

      const x = THREE.MathUtils.lerp(bed[0], bed[1], f1);
      const z = THREE.MathUtils.lerp(bed[2], bed[3], f2);
      const height = 0.55 + f3 * 0.65;
      const scale = 0.22 + f3 * 0.14;

      // Stem
      dummy.position.set(x, height * 0.45, z);
      dummy.rotation.set((f1 - 0.5) * 0.15, f2 * Math.PI * 2, (f3 - 0.5) * 0.15);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      sMats.push(dummy.matrix.clone());

      // Rose blossom head
      dummy.position.set(x, height + 0.08, z);
      dummy.rotation.set(f1 * 0.4, f2 * Math.PI * 2, f3 * 0.4);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      bMats.push(dummy.matrix.clone());

      cols.push(palette[i % palette.length]);
    }

    return { matricesBlossom: bMats, matricesStem: sMats, colors: cols };
  }, [count]);

  useEffect(() => {
    if (!blossomRef.current || !stemRef.current) return;
    for (let i = 0; i < count; i++) {
      blossomRef.current.setMatrixAt(i, matricesBlossom[i]);
      blossomRef.current.setColorAt(i, colors[i]);
      stemRef.current.setMatrixAt(i, matricesStem[i]);
    }
    blossomRef.current.instanceMatrix.needsUpdate = true;
    if (blossomRef.current.instanceColor) {
      blossomRef.current.instanceColor.needsUpdate = true;
    }
    stemRef.current.instanceMatrix.needsUpdate = true;
  }, [count, matricesBlossom, matricesStem, colors]);

  return (
    <group>
      {/* Rose stems & bushes */}
      <instancedMesh ref={stemRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.04, 0.09, 0.9, 6]} />
        <meshStandardMaterial color="#2b5235" roughness={0.82} />
      </instancedMesh>

      {/* Layered rose blossoms */}
      <instancedMesh ref={blossomRef} args={[undefined, undefined, count]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.45} metalness={0.06} />
      </instancedMesh>

      {/* Boxwood Garden Bed Borders */}
      {[
        [-7.45, -6.5],
        [7.45, -6.5],
        [-7.45, 6.65],
        [7.45, 6.65],
      ].map(([bx, bz], idx) => (
        <mesh key={idx} position={[bx, 0.25, bz]} receiveShadow castShadow>
          <boxGeometry args={[8.5, 0.5, 8.2]} />
          <meshStandardMaterial color="#23472d" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Multi-tiered royal marble garden fountain with sparkling animated water jets.
 */
const RoyalGardenFountain: React.FC<{ goldColor: string; marbleColor: string }> = ({
  goldColor,
  marbleColor,
}) => {
  const dropletsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dropletCount = 72;

  useFrame(({ clock }) => {
    if (!dropletsRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < dropletCount; i++) {
      const stream = i % 12;
      const phase = ((t * 0.9 + (i / dropletCount)) % 1);
      const angle = (stream / 12) * Math.PI * 2;
      const radius = 0.25 + phase * 1.95;
      const y = 2.95 + Math.sin(phase * Math.PI) * 1.15 - phase * 2.15;

      dummy.position.set(Math.cos(angle) * radius, Math.max(0.65, y), Math.sin(angle) * radius);
      dummy.scale.setScalar(0.065 * (1 - phase * 0.35));
      dummy.updateMatrix();
      dropletsRef.current.setMatrixAt(i, dummy.matrix);
    }
    dropletsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Marble Basin Ring */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.8, 3.05, 0.84, 36]} />
        <meshStandardMaterial color={marbleColor} roughness={0.32} />
      </mesh>
      {/* Shimmering Sunset Water Surface */}
      <mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.55, 36]} />
        <meshStandardMaterial
          color="#a8d5ea"
          roughness={0.08}
          metalness={0.62}
          emissive="#f4a89c"
          emissiveIntensity={0.22}
        />
      </mesh>
      {/* Central Sculpted Pedestal */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.65, 2.2, 20]} />
        <meshStandardMaterial color={marbleColor} roughness={0.3} />
      </mesh>
      {/* Upper Golden Tier Bowl */}
      <mesh position={[0, 2.35, 0]}>
        <cylinderGeometry args={[1.25, 0.45, 0.45, 24]} />
        <meshStandardMaterial color={marbleColor} roughness={0.26} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={goldColor} metalness={0.92} roughness={0.18} />
      </mesh>

      {/* Sparkling Water Droplets */}
      <instancedMesh ref={dropletsRef} args={[undefined, undefined, dropletCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color="#fff4e8"
          emissive="#ffd6b8"
          emissiveIntensity={0.5}
          roughness={0.1}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
    </group>
  );
};

/**
 * Animated 3D Butterflies with gently flapping wings fluttering over the roses.
 */
const AnimatedButterflies: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const groupRefs = useRef<Array<THREE.Group | null>>([]);
  const leftWingRefs = useRef<Array<THREE.Mesh | null>>([]);
  const rightWingRefs = useRef<Array<THREE.Mesh | null>>([]);

  const butterflies = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        radiusX: 4.5 + (i % 5) * 1.9,
        radiusZ: 4.0 + ((i * 2) % 5) * 1.7,
        baseY: 1.65 + (i % 4) * 0.55,
        speed: 0.34 + (i % 3) * 0.12,
        phase: (i / 14) * Math.PI * 2,
        color: i % 3 === 0 ? '#ffd89c' : i % 3 === 1 ? '#f9b4c9' : '#fff0c9',
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.getElapsedTime();

    butterflies.forEach((b, i) => {
      const grp = groupRefs.current[i];
      if (!grp) return;

      const angle = t * b.speed + b.phase;
      const x = Math.sin(angle) * b.radiusX;
      const z = Math.cos(angle * 0.85) * b.radiusZ - 2.0;
      const y = b.baseY + Math.sin(t * 2.2 + b.phase) * 0.38;

      const nextX = Math.sin(angle + 0.05) * b.radiusX;
      const nextZ = Math.cos((angle + 0.05) * 0.85) * b.radiusZ - 2.0;
      grp.position.set(x, y, z);
      grp.rotation.y = Math.atan2(nextX - x, nextZ - z);

      const flap = Math.sin(t * 13 + b.phase * 4) * 0.72;
      if (leftWingRefs.current[i]) leftWingRefs.current[i]!.rotation.z = flap;
      if (rightWingRefs.current[i]) rightWingRefs.current[i]!.rotation.z = -flap;
    });
  });

  if (!enabled) return null;

  return (
    <group>
      {butterflies.map((b, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          <mesh
            ref={(el) => {
              leftWingRefs.current[i] = el;
            }}
            position={[-0.12, 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.14, 12]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            ref={(el) => {
              rightWingRefs.current[i] = el;
            }}
            position={[0.12, 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.14, 12]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface GardenWorldProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  onOpenCrownModal: () => void;
}

const GardenWorld: React.FC<GardenWorldProps> = ({
  customization,
  theme,
  onOpenCrownModal,
}) => {
  const { camera } = useThree();
  const [crownHovered, setCrownHovered] = useState(false);
  const [customPetalTex, setCustomPetalTex] = useState<THREE.Texture | null>(null);

  const pathTex = useMemo(() => createGardenPathTexture(), []);
  useEffect(() => {
    return () => {
      pathTex.dispose();
    };
  }, [pathTex]);

  useEffect(() => {
    let active = true;
    loadTextureSafe(customization.assets.roseTextureUrl, 1, 1).then((t) => {
      if (active) setCustomPetalTex(t);
    });
    return () => {
      active = false;
    };
  }, [customization.assets.roseTextureUrl]);

  useEffect(() => {
    document.body.style.cursor = crownHovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [crownHovered]);

  // Smooth golden-hour arrival glide
  useEffect(() => {
    camera.position.set(0, 6.2, 22);
    const tween = gsap.to(camera.position, {
      x: 0,
      y: 5.2,
      z: 16.5,
      duration: 2.1,
      ease: 'power2.out',
    });
    return () => {
      tween.kill();
    };
  }, [camera]);

  const gazeboColumns = useMemo(
    () => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2),
    []
  );

  return (
    <>
      <fog attach="fog" args={['#b86878', 24, 72]} />
      <SunsetSkyDome />

      {/* Glowing Golden-Hour Setting Sun */}
      <mesh position={[0, 12, -58]}>
        <sphereGeometry args={[7.5, 32, 32]} />
        <meshBasicMaterial color="#ffe2a8" />
      </mesh>
      <mesh position={[0, 12, -59]}>
        <sphereGeometry args={[10.5, 32, 32]} />
        <meshBasicMaterial color="#ff9d6c" transparent opacity={0.28} />
      </mesh>

      {/* Romantic Golden-Hour Lighting */}
      <ambientLight intensity={0.62} color="#ffd7c2" />
      <hemisphereLight args={['#ffc99e', '#3c2e28', 0.65]} />
      <directionalLight
        position={[0, 14, -26]}
        intensity={2.1}
        color="#ffbe7d"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[12, 10, 14]} intensity={0.65} color="#f6b8d0" />

      {/* Lush Royal Garden Lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[95, 95]} />
        <meshStandardMaterial color="#345638" roughness={0.92} />
      </mesh>

      {/* Limestone Garden Pathways (Cross Axes + Central Plaza) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[4.4, 40]} />
        <meshStandardMaterial map={pathTex} roughness={0.78} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[36, 4.4]} />
        <meshStandardMaterial map={pathTex} roughness={0.78} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
        <circleGeometry args={[4.6, 48]} />
        <meshStandardMaterial map={pathTex} roughness={0.74} />
      </mesh>

      {/* Hundreds of Blooming 3D Roses */}
      <InstancedRoseGardenBeds density={customization.decoratives.roseDensity} />

      {/* Central Sculpted Royal Fountain */}
      <RoyalGardenFountain goldColor={theme.primary} marbleColor={theme.ivory} />

      {/* ROMANTIC MARBLE & GOLD GARDEN GAZEBO */}
      <group position={[0, 0, -14.2]}>
        {/* Raised Circular Gazebo Floor */}
        <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.2, 4.6, 0.5, 32]} />
          <meshStandardMaterial color={theme.ivory} roughness={0.32} />
        </mesh>
        {/* Six Fluted Marble Columns */}
        {gazeboColumns.map((angle, idx) => (
          <RoyalColumn
            key={idx}
            position={[Math.cos(angle) * 3.55, 0.45, Math.sin(angle) * 3.55]}
            height={4.8}
            radius={0.22}
            goldColor={theme.primary}
            marbleColor={theme.ivory}
          />
        ))}
        {/* Gazebo Ring Entablature */}
        <mesh position={[0, 5.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.55, 0.18, 12, 36]} />
          <meshStandardMaterial color={theme.ivory} roughness={0.35} />
        </mesh>
        {/* Openwork Gilded Gazebo Dome */}
        <mesh position={[0, 5.5, 0]}>
          <sphereGeometry args={[3.55, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial
            color={theme.primary}
            metalness={0.9}
            roughness={0.22}
            wireframe
          />
        </mesh>
        <mesh position={[0, 9.3, 0]}>
          <coneGeometry args={[0.18, 1.1, 10]} />
          <meshStandardMaterial color={theme.primary} metalness={0.94} roughness={0.16} />
        </mesh>

        {/* Warm Gazebo Fairy Light */}
        <pointLight position={[0, 4.4, 0]} color="#ffd59e" intensity={18} distance={16} />

        {/* Velvet Crown Pedestal & Hovering Interactive 3D Crown inside Gazebo */}
        <group
          position={[0, 0.5, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onOpenCrownModal();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setCrownHovered(true);
          }}
          onPointerOut={() => setCrownHovered(false)}
        >
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.58, 0.72, 1.3, 20]} />
            <meshStandardMaterial color={theme.ivory} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.35, 0]}>
            <cylinderGeometry args={[0.56, 0.56, 0.12, 20]} />
            <meshStandardMaterial color={theme.burgundy} roughness={0.85} />
          </mesh>
          <group position={[0, 2.05, 0]} scale={0.58}>
            <RoyalCrownMesh
              styleId={customization.crownStyle}
              customModelUrl={customization.assets.crownModelUrl}
              autoSpin
            />
          </group>
        </group>
      </group>

      {/* Animated Flapping Butterflies */}
      <AnimatedButterflies enabled={customization.decoratives.enableButterflies} />

      {/* Falling Rose Petals & Golden-Hour Sun Motes */}
      <FallingRosePetals
        count={120}
        area={[28, 11, 28]}
        color={theme.petalColor}
        customTexture={customPetalTex}
        enabled={customization.decoratives.enableFallingPetals}
      />
      <FloatingStardust
        count={180}
        spread={[30, 11, 30]}
        color="#ffe3a8"
        size={0.11}
        enabled={customization.decoratives.enableStardust}
      />

      <OrbitControls
        target={[0, 2.6, -4]}
        enablePan={false}
        minDistance={6.5}
        maxDistance={25}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.48}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};

export const RoseGarden: React.FC<RoseGardenProps> = ({
  customization,
  theme,
  onChangeCrownStyle,
}) => {
  const [crownModalOpen, setCrownModalOpen] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 6.2, 22], fov: 48 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }}
      >
        <GardenWorld
          customization={customization}
          theme={theme}
          onOpenCrownModal={() => setCrownModalOpen(true)}
        />
      </Canvas>

      {/* Romantic Sunset Finale Overlay & Royal Crown Try-On Trigger */}
      <div className="pointer-events-none fixed bottom-16 left-4 right-4 z-20 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-lg">
        <div className="royal-glass pointer-events-auto rounded-3xl p-5 sm:p-6">
          <div className="inline-flex items-center gap-1.5 font-royal-display text-[10px] uppercase tracking-[0.3em] text-[#f4c2c2]">
            <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
            Chapter V • The Sunset Rose Garden
          </div>

          <h2 className="gold-shimmer-text font-royal-display mt-1.5 text-lg tracking-[0.12em] sm:text-xl">
            {customization.gardenDedication}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-[#faf6f0]/90 sm:text-base">
            {customization.gardenClosingMessage}
          </p>

          <p className="font-royal-script mt-2 text-2xl text-[#f4c2c2]">
            — {customization.senderName}, to {customization.recipientName}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCrownModalOpen(true)}
              className="royal-btn inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px]"
            >
              <Crown className="h-4 w-4" />
              Try On The Royal Crown
            </button>

            {customization.memories.length > 0 && (
              <button
                type="button"
                onClick={() => setMemoriesOpen(true)}
                className="royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[10px]"
              >
                <BookHeart className="h-3.5 w-3.5 text-[#f4c2c2]" />
                Our Memories ({customization.memories.length})
              </button>
            )}
          </div>

          <p className="mt-2.5 text-[11px] italic text-[#f4c2c2]/75">
            Click the floating crown inside the marble gazebo or press &ldquo;Try On The Royal Crown&rdquo;.
          </p>
        </div>
      </div>

      {/* Interactive 3D Crown Camera Try-On Modal */}
      <RoyalCrownTryOnModal
        isOpen={crownModalOpen}
        recipientName={customization.recipientName}
        crownStyle={customization.crownStyle}
        customModelUrl={customization.assets.crownModelUrl}
        onChangeCrownStyle={onChangeCrownStyle}
        onClose={() => setCrownModalOpen(false)}
      />

      {/* Romantic Memories Keepsake Modal */}
      {memoriesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => setMemoriesOpen(false)}
        >
          <div
            className="royal-glass royal-scroll max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#d4af37]/25 pb-4">
              <div>
                <p className="font-royal-display text-[10px] uppercase tracking-[0.28em] text-[#f4c2c2]">
                  Keepsake Chronicle
                </p>
                <h3 className="gold-shimmer-text font-royal-display mt-1 text-xl tracking-[0.14em]">
                  Cherished Memories
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMemoriesOpen(false)}
                className="rounded-full border border-[#d4af37]/30 p-2 text-[#f3d9a4] hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {customization.memories.map((memory) => (
                <div
                  key={memory.id}
                  className="rounded-2xl border border-[#d4af37]/25 bg-black/30 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-royal-display text-sm tracking-wider text-[#f3d9a4]">
                      {memory.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#f4c2c2]/30 bg-[#5c162b]/40 px-2.5 py-0.5 text-[10px] text-[#f4c2c2]">
                      <Heart className="h-3 w-3" />
                      {memory.date}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#faf6f0]/85">
                    {memory.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
