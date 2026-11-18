import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ArrowRight, DoorOpen, Sparkles } from 'lucide-react';
import { ChapterId, PalaceCustomization, ThemePalette } from '../types/palace';
import {
  FallingRosePetals,
  FloatingStardust,
  RoyalChandelier,
  RoyalColumn,
} from '../components/SceneEffects';
import {
  createDamaskWallpaperTexture,
  createMarbleTexture,
  createRoyalDoorTexture,
  createVelvetTexture,
} from '../utils/proceduralTextures';
import { loadTextureSafe } from '../utils/assetLoader';

interface GrandFoyerProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  onNavigateChapter: (chapter: ChapterId) => void;
}

interface SwingingDoorPairProps {
  position: [number, number, number];
  rotationY: number;
  isOpen: boolean;
  doorTexture: THREE.Texture;
  goldColor: string;
  onToggle: () => void;
}

const SwingingDoorPair: React.FC<SwingingDoorPairProps> = ({
  position,
  rotationY,
  isOpen,
  doorTexture,
  goldColor,
  onToggle,
}) => {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  useEffect(() => {
    if (!leftRef.current || !rightRef.current) return;
    gsap.to(leftRef.current.rotation, {
      y: isOpen ? -1.4 : 0,
      duration: 1.15,
      ease: 'power3.inOut',
    });
    gsap.to(rightRef.current.rotation, {
      y: isOpen ? 1.4 : 0,
      duration: 1.15,
      ease: 'power3.inOut',
    });
  }, [isOpen]);

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Ornate Golden Portal Archway */}
      <mesh position={[0, 4.9, 0]}>
        <boxGeometry args={[4.4, 0.35, 0.5]} />
        <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.22} />
      </mesh>
      <mesh position={[-2.1, 2.4, 0]}>
        <boxGeometry args={[0.32, 4.9, 0.45]} />
        <meshStandardMaterial color={goldColor} metalness={0.86} roughness={0.25} />
      </mesh>
      <mesh position={[2.1, 2.4, 0]}>
        <boxGeometry args={[0.32, 4.9, 0.45]} />
        <meshStandardMaterial color={goldColor} metalness={0.86} roughness={0.25} />
      </mesh>

      {/* Warm Golden Portal Light Beyond */}
      <mesh position={[0, 2.4, -0.3]}>
        <planeGeometry args={[3.9, 4.75]} />
        <meshBasicMaterial color={isOpen ? '#ffebc0' : '#4a2434'} />
      </mesh>

      {/* Left Swinging Leaf */}
      <group ref={leftRef} position={[-1.92, 0, 0.05]}>
        <mesh position={[0.95, 2.38, 0]} castShadow>
          <boxGeometry args={[1.9, 4.7, 0.16]} />
          <meshStandardMaterial
            map={doorTexture}
            roughness={0.32}
            metalness={0.24}
            emissive={goldColor}
            emissiveIntensity={hovered ? 0.18 : 0.04}
          />
        </mesh>
        <mesh position={[1.66, 2.2, 0.12]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={goldColor} metalness={0.95} roughness={0.14} />
        </mesh>
      </group>

      {/* Right Swinging Leaf */}
      <group ref={rightRef} position={[1.92, 0, 0.05]}>
        <mesh position={[-0.95, 2.38, 0]} castShadow>
          <boxGeometry args={[1.9, 4.7, 0.16]} />
          <meshStandardMaterial
            map={doorTexture}
            roughness={0.32}
            metalness={0.24}
            emissive={goldColor}
            emissiveIntensity={hovered ? 0.18 : 0.04}
          />
        </mesh>
        <mesh position={[-1.66, 2.2, 0.12]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={goldColor} metalness={0.95} roughness={0.14} />
        </mesh>
      </group>
    </group>
  );
};

interface FoyerWorldProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  leftDoorOpen: boolean;
  rightDoorOpen: boolean;
  onToggleLeftDoor: () => void;
  onToggleRightDoor: () => void;
}

const FoyerWorld: React.FC<FoyerWorldProps> = ({
  customization,
  theme,
  leftDoorOpen,
  rightDoorOpen,
  onToggleLeftDoor,
  onToggleRightDoor,
}) => {
  const { camera } = useThree();
  const [customMarbleTex, setCustomMarbleTex] = useState<THREE.Texture | null>(null);
  const [customWallTex, setCustomWallTex] = useState<THREE.Texture | null>(null);
  const [customPetalTex, setCustomPetalTex] = useState<THREE.Texture | null>(null);

  const proceduralMarble = useMemo(
    () => createMarbleTexture('#f7f1e8', '#d7c8b6', theme.primary, 6),
    [theme.primary]
  );
  const proceduralWall = useMemo(
    () => createDamaskWallpaperTexture(theme.wallColor, theme.primary, 6, 3),
    [theme.wallColor, theme.primary]
  );
  const velvetTex = useMemo(
    () => createVelvetTexture(theme.burgundy, 1, 6),
    [theme.burgundy]
  );
  const doorTex = useMemo(
    () => createRoyalDoorTexture('#53182b', theme.primary),
    [theme.primary]
  );

  useEffect(() => {
    return () => {
      proceduralMarble.dispose();
      proceduralWall.dispose();
      velvetTex.dispose();
      doorTex.dispose();
    };
  }, [proceduralMarble, proceduralWall, velvetTex, doorTex]);

  useEffect(() => {
    let active = true;
    loadTextureSafe(customization.assets.marbleTextureUrl, 6, 6).then((t) => {
      if (active) setCustomMarbleTex(t);
    });
    loadTextureSafe(customization.assets.wallpaperTextureUrl, 6, 3).then((t) => {
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

  // Smooth cinematic camera glide into the Grand Foyer
  useEffect(() => {
    camera.position.set(0, 3.8, 15.5);
    const tween = gsap.to(camera.position, {
      x: 0,
      y: 4.1,
      z: 11.4,
      duration: 2.0,
      ease: 'power2.out',
    });
    return () => {
      tween.kill();
    };
  }, [camera]);

  const marbleMap = customMarbleTex || proceduralMarble;
  const wallMap = customWallTex || proceduralWall;

  return (
    <>
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.fogColor, 18, 42]} />

      {/* Warm Opulent Interior Lighting */}
      <ambientLight intensity={0.62} color={theme.ambientLight} />
      <hemisphereLight args={['#fff0dc', '#4b2434', 0.55]} />
      <directionalLight position={[6, 12, 8]} intensity={1.1} color="#ffe7c4" castShadow />

      {/* Reflective Veined Marble Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 30]} />
        <MeshReflectorMaterial
          mirror={0.35}
          blur={[320, 120]}
          resolution={512}
          mixBlur={0.9}
          mixStrength={0.65}
          roughness={0.22}
          depthScale={0.5}
          map={marbleMap}
          color="#f7f0e6"
          metalness={0.12}
        />
      </mesh>

      {/* Center Velvet & Gold Carpet Medallion */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 2.5]}>
        <ringGeometry args={[2.9, 3.2, 48]} />
        <meshStandardMaterial color={theme.primary} metalness={0.9} roughness={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 2.5]}>
        <circleGeometry args={[2.9, 48]} />
        <meshStandardMaterial map={velvetTex} roughness={0.8} />
      </mesh>

      {/* Palace Walls */}
      {/* Back Wall behind Grand Staircase */}
      <mesh position={[0, 6.5, -13]} receiveShadow>
        <planeGeometry args={[28, 13]} />
        <meshStandardMaterial map={wallMap} roughness={0.55} />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-12.5, 6.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[28, 13]} />
        <meshStandardMaterial map={wallMap} roughness={0.55} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[12.5, 6.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[28, 13]} />
        <meshStandardMaterial map={wallMap} roughness={0.55} />
      </mesh>
      {/* Coffered Palace Ceiling */}
      <mesh position={[0, 12.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 30]} />
        <meshStandardMaterial color="#f5ebd9" roughness={0.65} />
      </mesh>

      {/* Gilded Ceiling Crown Moldings */}
      {[-12.3, 12.3].map((x, idx) => (
        <mesh key={idx} position={[x, 12.3, 0]}>
          <boxGeometry args={[0.35, 0.45, 28]} />
          <meshStandardMaterial color={theme.primary} metalness={0.88} roughness={0.22} />
        </mesh>
      ))}

      {/* Classical Golden & Marble Pillars Lining the Grand Foyer */}
      {[-8.4, 8.4].map((x) =>
        [-7.5, -1.5, 4.5, 10.5].map((z) => (
          <RoyalColumn
            key={`${x}-${z}`}
            position={[x, 0, z]}
            height={11.8}
            radius={0.48}
            goldColor={theme.primary}
            marbleColor={theme.ivory}
          />
        ))
      )}

      {/* GRAND BIFURCATED ROYAL STAIRCASE */}
      <group position={[0, 0, -5.8]}>
        {/* Lower Central Flight (12 Marble Steps) */}
        {Array.from({ length: 12 }, (_, i) => (
          <group key={i}>
            <mesh position={[0, i * 0.32 + 0.16, -i * 0.44]} castShadow receiveShadow>
              <boxGeometry args={[5.4, 0.34, 0.5]} />
              <meshStandardMaterial map={marbleMap} color={theme.ivory} roughness={0.26} />
            </mesh>
            {/* Velvet Stair Runner Strip */}
            <mesh position={[0, i * 0.32 + 0.34, -i * 0.44]}>
              <boxGeometry args={[2.5, 0.04, 0.48]} />
              <meshStandardMaterial map={velvetTex} roughness={0.85} />
            </mesh>
            {/* Brass Stair Rod */}
            <mesh position={[0, i * 0.32 + 0.36, -i * 0.44 + 0.22]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 2.65, 8]} />
              <meshStandardMaterial color={theme.primary} metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        ))}

        {/* Golden Staircase Handrails */}
        {[-2.55, 2.55].map((x, idx) => (
          <mesh key={idx} position={[x, 2.75, -2.4]} rotation={[-0.62, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 6.4, 12]} />
            <meshStandardMaterial color={theme.primary} metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Upper Mezzanine Balcony */}
        <mesh position={[0, 3.85, -5.9]} receiveShadow castShadow>
          <boxGeometry args={[23, 0.55, 3.2]} />
          <meshStandardMaterial map={marbleMap} color={theme.ivory} roughness={0.28} />
        </mesh>
        {/* Balcony Golden Balustrade Rail */}
        <mesh position={[0, 4.95, -4.4]}>
          <boxGeometry args={[22.8, 0.14, 0.18]} />
          <meshStandardMaterial color={theme.primary} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Balcony Balusters */}
        {Array.from({ length: 24 }, (_, idx) => {
          const bx = -10.8 + idx * 0.94;
          if (Math.abs(bx) < 2.6) return null;
          return (
            <mesh key={idx} position={[bx, 4.45, -4.4]}>
              <cylinderGeometry args={[0.055, 0.065, 0.95, 8]} />
              <meshStandardMaterial color={theme.ivory} roughness={0.3} />
            </mesh>
          );
        })}

        {/* Arched Tall Royal Back Window Behind Staircase */}
        <mesh position={[0, 7.6, -7.1]}>
          <planeGeometry args={[4.8, 6.2]} />
          <meshStandardMaterial
            color="#ffe5be"
            emissive="#f4b698"
            emissiveIntensity={0.95}
          />
        </mesh>
        <mesh position={[0, 7.6, -7.06]}>
          <boxGeometry args={[5.2, 6.6, 0.08]} />
          <meshStandardMaterial color={theme.primary} metalness={0.85} roughness={0.24} wireframe />
        </mesh>
      </group>

      {/* TWO LARGE INTERACTIVE SWINGING DOORS */}
      {/* Left Wing Doors -> Portrait Gallery */}
      <SwingingDoorPair
        position={[-12.2, 0, 1.5]}
        rotationY={Math.PI / 2}
        isOpen={leftDoorOpen}
        doorTexture={doorTex}
        goldColor={theme.primary}
        onToggle={onToggleLeftDoor}
      />

      {/* Right Wing Doors -> Royal Ballroom */}
      <SwingingDoorPair
        position={[12.2, 0, 1.5]}
        rotationY={-Math.PI / 2}
        isOpen={rightDoorOpen}
        doorTexture={doorTex}
        goldColor={theme.primary}
        onToggle={onToggleRightDoor}
      />

      {/* TWO GRAND CRYSTAL CHANDELIERS */}
      <RoyalChandelier
        position={[0, 9.5, 3.2]}
        scale={1.35}
        goldColor={theme.primary}
        glowEnabled={customization.decoratives.enableChandelierGlow}
        lightIntensity={28}
      />
      <RoyalChandelier
        position={[0, 9.8, -5.2]}
        scale={1.15}
        goldColor={theme.primary}
        glowEnabled={customization.decoratives.enableChandelierGlow}
        lightIntensity={24}
      />

      {/* Atmospheric Rose Petals & Stardust */}
      <FallingRosePetals
        count={90}
        area={[20, 11, 20]}
        color={theme.petalColor}
        customTexture={customPetalTex}
        enabled={customization.decoratives.enableFallingPetals}
      />
      <FloatingStardust
        count={170}
        spread={[20, 11, 20]}
        color="#f9dfa4"
        size={0.09}
        enabled={customization.decoratives.enableStardust}
      />

      <OrbitControls
        target={[0, 3.3, -2.5]}
        enablePan={false}
        minDistance={5}
        maxDistance={15.5}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.52}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
};

export const GrandFoyer: React.FC<GrandFoyerProps> = ({
  customization,
  theme,
  onNavigateChapter,
}) => {
  const [leftDoorOpen, setLeftDoorOpen] = useState(false);
  const [rightDoorOpen, setRightDoorOpen] = useState(false);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 3.8, 15.5], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
      >
        <FoyerWorld
          customization={customization}
          theme={theme}
          leftDoorOpen={leftDoorOpen}
          rightDoorOpen={rightDoorOpen}
          onToggleLeftDoor={() => setLeftDoorOpen((v) => !v)}
          onToggleRightDoor={() => setRightDoorOpen((v) => !v)}
        />
      </Canvas>

      {/* Personalized Romantic Welcome Card */}
      <div className="pointer-events-none fixed bottom-16 left-4 right-4 z-20 flex flex-col items-start gap-3 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md">
        <div className="royal-glass pointer-events-auto w-full rounded-3xl p-5 sm:p-6">
          <div className="inline-flex items-center gap-1.5 font-royal-display text-[10px] uppercase tracking-[0.3em] text-[#f4c2c2]">
            <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
            Chapter II • The Grand Foyer
          </div>

          <h2 className="gold-shimmer-text font-royal-display mt-1.5 text-xl tracking-[0.12em] sm:text-2xl">
            {customization.foyerWelcomeTitle}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-[#faf6f0]/85 sm:text-base">
            {customization.foyerWelcomeMessage}
          </p>

          {/* Interactive Door & Wing Controls */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLeftDoorOpen((v) => !v)}
              className="royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px]"
            >
              <DoorOpen className="h-3.5 w-3.5 text-[#d4af37]" />
              {leftDoorOpen ? 'Close Left Doors' : 'Swing Left Doors'}
            </button>
            <button
              type="button"
              onClick={() => setRightDoorOpen((v) => !v)}
              className="royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px]"
            >
              <DoorOpen className="h-3.5 w-3.5 text-[#d4af37]" />
              {rightDoorOpen ? 'Close Right Doors' : 'Swing Right Doors'}
            </button>
          </div>

          {(leftDoorOpen || rightDoorOpen) && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-[#d4af37]/20 pt-3">
              {leftDoorOpen && (
                <button
                  type="button"
                  onClick={() => onNavigateChapter('gallery')}
                  className="royal-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px]"
                >
                  Enter Portrait Gallery
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
              {rightDoorOpen && (
                <button
                  type="button"
                  onClick={() => onNavigateChapter('ballroom')}
                  className="royal-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px]"
                >
                  Enter Royal Ballroom
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <p className="mt-2.5 text-[11px] italic text-[#f4c2c2]/70">
            Click either pair of royal doors inside the 3D hall to swing them open.
          </p>
        </div>
      </div>
    </div>
  );
};
