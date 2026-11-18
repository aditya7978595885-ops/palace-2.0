import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import gsap from 'gsap';
import { Crown, Edit3, Eye, Sparkles } from 'lucide-react';
import {
  BallroomPlaqueData,
  PalaceCustomization,
  ThemePalette,
} from '../types/palace';
import {
  FallingRosePetals,
  FloatingStardust,
  RoyalChandelier,
  RoyalColumn,
} from '../components/SceneEffects';
import { PlaqueEditorModal } from '../components/PlaqueEditorModal';
import {
  createDamaskWallpaperTexture,
  createMarbleTexture,
  createPlaqueCanvasTexture,
  createVelvetTexture,
} from '../utils/proceduralTextures';
import { loadTextureSafe } from '../utils/assetLoader';

interface RoyalBallroomProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  onUpdatePlaque: (partial: Partial<BallroomPlaqueData>) => void;
}

interface BallroomWorldProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  plaqueFocused: boolean;
  onClickPlaque: () => void;
}

/**
 * Draped velvet royal curtain flanking each tall arched ballroom window.
 */
const BallroomCurtainPair: React.FC<{
  position: [number, number, number];
  rotationY: number;
  velvetTex: THREE.Texture;
  goldColor: string;
}> = ({ position, rotationY, velvetTex, goldColor }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tall French Window Glow */}
      <mesh position={[0, 4.7, -0.08]}>
        <planeGeometry args={[3.2, 7.6]} />
        <meshStandardMaterial
          color="#ffdff0"
          emissive="#c98cb8"
          emissiveIntensity={0.65}
          roughness={0.2}
        />
      </mesh>
      {/* Window Mullion Gold Frame */}
      <mesh position={[0, 4.7, -0.02]}>
        <boxGeometry args={[3.45, 7.85, 0.08]} />
        <meshStandardMaterial color={goldColor} metalness={0.86} roughness={0.24} wireframe />
      </mesh>

      {/* Pelmet / Valance Golden Cornice */}
      <mesh position={[0, 8.75, 0.25]}>
        <boxGeometry args={[4.4, 0.36, 0.48]} />
        <meshStandardMaterial color={goldColor} metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Left & Right Sculpted Velvet Drapes */}
      {[-1.55, 1.55].map((x, idx) => (
        <group key={idx} position={[x, 4.5, 0.22]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.36, 0.56, 8.2, 14]} />
            <meshStandardMaterial map={velvetTex} roughness={0.85} />
          </mesh>
          {/* Golden Curtain Tieback Sash */}
          <mesh position={[0, -0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.45, 0.055, 8, 20]} />
            <meshStandardMaterial color={goldColor} metalness={0.94} roughness={0.18} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const BallroomWorld: React.FC<BallroomWorldProps> = ({
  customization,
  theme,
  plaqueFocused,
  onClickPlaque,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [plaqueHovered, setPlaqueHovered] = useState(false);
  const [customMarbleTex, setCustomMarbleTex] = useState<THREE.Texture | null>(null);
  const [customWallTex, setCustomWallTex] = useState<THREE.Texture | null>(null);
  const [customPetalTex, setCustomPetalTex] = useState<THREE.Texture | null>(null);

  const proceduralMarble = useMemo(
    () => createMarbleTexture('#f8f2e8', '#d6c5b3', theme.primary, 8),
    [theme.primary]
  );
  const proceduralWall = useMemo(
    () => createDamaskWallpaperTexture(theme.wallColor, theme.primary, 8, 3),
    [theme.wallColor, theme.primary]
  );
  const velvetTex = useMemo(
    () => createVelvetTexture(theme.burgundy, 2, 3),
    [theme.burgundy]
  );

  // Live engraved 3D plaque CanvasTexture
  const plaqueTexture = useMemo(
    () => createPlaqueCanvasTexture(customization.plaque, theme.primary, theme.burgundy),
    [customization.plaque, theme.primary, theme.burgundy]
  );

  useEffect(() => {
    return () => {
      proceduralMarble.dispose();
      proceduralWall.dispose();
      velvetTex.dispose();
    };
  }, [proceduralMarble, proceduralWall, velvetTex]);

  useEffect(() => {
    return () => {
      plaqueTexture.dispose();
    };
  }, [plaqueTexture]);

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

  useEffect(() => {
    document.body.style.cursor = plaqueHovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [plaqueHovered]);

  // Cinematic GSAP camera focus when the plaque is clicked
  useEffect(() => {
    const controls = controlsRef.current;
    if (plaqueFocused) {
      gsap.to(camera.position, {
        x: 0,
        y: 3.75,
        z: -5.4,
        duration: 1.45,
        ease: 'power3.inOut',
      });
      if (controls) {
        gsap.to(controls.target, {
          x: 0,
          y: 3.65,
          z: -10.8,
          duration: 1.45,
          ease: 'power3.inOut',
        });
      }
    } else {
      gsap.to(camera.position, {
        x: 0,
        y: 4.9,
        z: 13.8,
        duration: 1.45,
        ease: 'power2.inOut',
      });
      if (controls) {
        gsap.to(controls.target, {
          x: 0,
          y: 3.5,
          z: -4.5,
          duration: 1.45,
          ease: 'power2.inOut',
        });
      }
    }
  }, [plaqueFocused, camera]);

  const marbleMap = customMarbleTex || proceduralMarble;
  const wallMap = customWallTex || proceduralWall;

  return (
    <>
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.fogColor, 20, 48]} />

      {/* Romantic Ballroom Lighting */}
      <ambientLight intensity={0.58} color={theme.ambientLight} />
      <hemisphereLight args={['#ffecd6', '#4a1b30', 0.5]} />
      <directionalLight position={[8, 14, 10]} intensity={1.05} color="#ffe3bc" castShadow />
      {/* Dedicated warm spotlight illuminating the Gilded Royal Plaque */}
      <spotLight
        position={[0, 8.8, -5.5]}
        angle={0.48}
        penumbra={0.65}
        intensity={42}
        color="#ffe8b8"
        target-position={[0, 3.6, -10.8]}
      />

      {/* Expansive Reflective Marble Ballroom Dance Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 38]} />
        <MeshReflectorMaterial
          mirror={0.42}
          blur={[340, 120]}
          resolution={512}
          mixBlur={0.85}
          mixStrength={0.75}
          roughness={0.18}
          map={marbleMap}
          color="#faf3e8"
          metalness={0.14}
        />
      </mesh>

      {/* Giant Champagne-Gold Inlaid Dance Floor Compass Medallion */}
      <group position={[0, 0.015, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[5.1, 5.45, 64]} />
          <meshStandardMaterial color={theme.primary} metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh>
          <ringGeometry args={[2.3, 2.52, 48]} />
          <meshStandardMaterial color={theme.primary} metalness={0.92} roughness={0.2} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 8) * Math.PI * 2]}>
            <planeGeometry args={[0.14, 10.2]} />
            <meshStandardMaterial color={theme.primary} metalness={0.9} roughness={0.22} />
          </mesh>
        ))}
      </group>

      {/* Ballroom Walls & Vaulted Ceiling */}
      <mesh position={[0, 6.8, -14.5]}>
        <planeGeometry args={[32, 13.6]} />
        <meshStandardMaterial map={wallMap} roughness={0.54} />
      </mesh>
      <mesh position={[-14.5, 6.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[32, 13.6]} />
        <meshStandardMaterial map={wallMap} roughness={0.54} />
      </mesh>
      <mesh position={[14.5, 6.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[32, 13.6]} />
        <meshStandardMaterial map={wallMap} roughness={0.54} />
      </mesh>
      <mesh position={[0, 13.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 34]} />
        <meshStandardMaterial color="#f5ebd8" roughness={0.62} />
      </mesh>

      {/* Tall Draped Velvet French Windows along Left & Right Ballroom Walls */}
      {[-8, 0, 8].map((z) => (
        <React.Fragment key={z}>
          <BallroomCurtainPair
            position={[-14.25, 0, z]}
            rotationY={Math.PI / 2}
            velvetTex={velvetTex}
            goldColor={theme.primary}
          />
          <BallroomCurtainPair
            position={[14.25, 0, z]}
            rotationY={-Math.PI / 2}
            velvetTex={velvetTex}
            goldColor={theme.primary}
          />
        </React.Fragment>
      ))}

      {/* Grand Ballroom Corinthian Columns */}
      {[-11.4, 11.4].map((x) =>
        [-11.5, -4, 4, 11.5].map((z) => (
          <RoyalColumn
            key={`${x}-${z}`}
            position={[x, 0, z]}
            height={12.8}
            radius={0.52}
            goldColor={theme.primary}
            marbleColor={theme.ivory}
          />
        ))
      )}

      {/* THREE GRAND GOLDEN CRYSTAL CHANDELIERS */}
      <RoyalChandelier
        position={[0, 10.4, 1.0]}
        scale={1.55}
        goldColor={theme.primary}
        glowEnabled={customization.decoratives.enableChandelierGlow}
        lightIntensity={32}
      />
      <RoyalChandelier
        position={[-6.5, 10.6, -5.2]}
        scale={1.15}
        goldColor={theme.primary}
        glowEnabled={customization.decoratives.enableChandelierGlow}
        lightIntensity={20}
      />
      <RoyalChandelier
        position={[6.5, 10.6, -5.2]}
        scale={1.15}
        goldColor={theme.primary}
        glowEnabled={customization.decoratives.enableChandelierGlow}
        lightIntensity={20}
      />

      {/* ROYAL DAIS & LARGE GILDED DEDICATION PLAQUE */}
      <group position={[0, 0, -10.8]}>
        {/* Two-step Velvet & Marble Dais */}
        <mesh position={[0, 0.2, 0.4]} receiveShadow>
          <boxGeometry args={[8.4, 0.4, 4.6]} />
          <meshStandardMaterial map={marbleMap} color={theme.ivory} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.46, 0.1]} receiveShadow>
          <boxGeometry args={[6.8, 0.25, 3.6]} />
          <meshStandardMaterial map={velvetTex} roughness={0.85} />
        </mesh>

        {/* Sculpted Golden Easel / Pedestal */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[2.2, 0.9, 1.1]} />
          <meshStandardMaterial color={theme.ivory} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.48, 0]}>
          <boxGeometry args={[2.5, 0.14, 1.3]} />
          <meshStandardMaterial color={theme.primary} metalness={0.92} roughness={0.18} />
        </mesh>

        {/* Interactive Clickable Gilded Royal Plaque */}
        <group
          position={[0, 3.72, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClickPlaque();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setPlaqueHovered(true);
          }}
          onPointerOut={() => setPlaqueHovered(false)}
        >
          {/* Heavy Sculpted Solid Gold Plaque Frame */}
          <mesh castShadow>
            <boxGeometry args={[3.55, 4.35, 0.22]} />
            <meshStandardMaterial
              color={theme.primary}
              metalness={0.94}
              roughness={0.18}
              emissive={theme.primary}
              emissiveIntensity={plaqueHovered || plaqueFocused ? 0.28 : 0.08}
            />
          </mesh>

          {/* Top Royal Crown Emblem Finial above Plaque */}
          <mesh position={[0, 2.42, 0.05]}>
            <octahedronGeometry args={[0.28, 1]} />
            <meshStandardMaterial
              color="#ffe599"
              metalness={0.96}
              roughness={0.12}
              emissive="#ffcf6b"
              emissiveIntensity={0.4}
            />
          </mesh>

          {/* Engraved High-Resolution Plaque Face */}
          <mesh position={[0, 0, 0.125]}>
            <planeGeometry args={[3.16, 3.95]} />
            <meshStandardMaterial
              map={plaqueTexture}
              roughness={0.28}
              metalness={0.22}
            />
          </mesh>
        </group>

        {/* Flanking Golden Candelabra Stands */}
        {[-3.1, 3.1].map((cx, idx) => (
          <group key={idx} position={[cx, 0.6, 0.5]}>
            <mesh position={[0, 1.25, 0]}>
              <cylinderGeometry args={[0.07, 0.16, 2.5, 12]} />
              <meshStandardMaterial color={theme.primary} metalness={0.92} roughness={0.2} />
            </mesh>
            <mesh position={[0, 2.65, 0]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial
                color="#fff3ce"
                emissive="#ffc970"
                emissiveIntensity={2.0}
              />
            </mesh>
            <pointLight position={[0, 2.8, 0.2]} color="#ffd89a" intensity={9} distance={12} />
          </group>
        ))}
      </group>

      {/* Atmospheric Floating Particles & Rose Petals */}
      <FloatingStardust
        count={220}
        spread={[26, 12, 28]}
        color="#fae2a4"
        size={0.1}
        enabled={customization.decoratives.enableStardust}
      />
      <FallingRosePetals
        count={85}
        area={[24, 12, 26]}
        color={theme.petalColor}
        customTexture={customPetalTex}
        enabled={customization.decoratives.enableFallingPetals}
      />

      <OrbitControls
        ref={controlsRef}
        target={[0, 3.5, -4.5]}
        enablePan={false}
        minDistance={3.2}
        maxDistance={17.5}
        minPolarAngle={Math.PI * 0.24}
        maxPolarAngle={Math.PI * 0.53}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
};

export const RoyalBallroom: React.FC<RoyalBallroomProps> = ({
  customization,
  theme,
  onUpdatePlaque,
}) => {
  const [plaqueFocused, setPlaqueFocused] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const handlePlaqueClick = () => {
    setPlaqueFocused(true);
    setEditorOpen(true);
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 4.9, 13.8], fov: 48 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
      >
        <BallroomWorld
          customization={customization}
          theme={theme}
          plaqueFocused={plaqueFocused}
          onClickPlaque={handlePlaqueClick}
        />
      </Canvas>

      {/* Bottom-Left Ballroom Plaque Presentation Overlay */}
      <div className="pointer-events-none fixed bottom-16 left-4 right-4 z-20 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md">
        <div className="royal-glass pointer-events-auto rounded-3xl p-5 sm:p-6">
          <div className="inline-flex items-center gap-1.5 font-royal-display text-[10px] uppercase tracking-[0.3em] text-[#f4c2c2]">
            <Crown className="h-3.5 w-3.5 text-[#d4af37]" />
            Chapter IV • The Royal Ballroom
          </div>

          <h2 className="gold-shimmer-text font-royal-display mt-1.5 text-lg tracking-[0.14em] sm:text-xl">
            {customization.plaque.mainTitle}
          </h2>

          <p className="font-royal-script mt-1 text-3xl text-[#f4c2c2]">
            {customization.plaque.dedication} {customization.plaque.recipientName}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-[#faf6f0]/90">
            {customization.plaque.romanticMessage}
          </p>

          <div className="mt-2 flex items-center gap-2 font-royal-display text-[10px] uppercase tracking-[0.2em] text-[#f3d9a4]">
            <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
            {customization.plaque.specialDate}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setPlaqueFocused(true);
                setEditorOpen(true);
              }}
              className="royal-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Royal Plaque
            </button>

            <button
              type="button"
              onClick={() => setPlaqueFocused((v) => !v)}
              className="royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px]"
            >
              <Eye className="h-3.5 w-3.5" />
              {plaqueFocused ? 'Wide Ballroom View' : 'Focus on Plaque'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Plaque Engraving Modal */}
      <PlaqueEditorModal
        isOpen={editorOpen}
        plaque={customization.plaque}
        onChange={onUpdatePlaque}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
};
