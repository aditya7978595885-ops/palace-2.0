import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import gsap from 'gsap';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PalaceCustomization, ThemePalette } from '../types/palace';
import {
  FallingRosePetals,
  FloatingStardust,
  RoyalColumn,
} from '../components/SceneEffects';
import {
  createMarbleTexture,
  createRoyalDoorTexture,
  createVelvetTexture,
} from '../utils/proceduralTextures';
import { loadTextureSafe } from '../utils/assetLoader';

interface PalaceArrivalProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  onEnterPalace: () => void;
}

/**
 * Custom twilight sky gradient dome shader (deep royal indigo -> dusty rose horizon).
 */
const TwilightSkyDome: React.FC<{ topColor: string; horizonColor: string }> = ({
  topColor,
  horizonColor,
}) => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(topColor) },
        uMid: { value: new THREE.Color('#2a153d') },
        uHorizon: { value: new THREE.Color(horizonColor) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uHorizon;
        varying vec3 vPos;
        void main() {
          float h = clamp(vPos.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(uHorizon, uMid, smoothstep(0.42, 0.62, h));
          col = mix(col, uTop, smoothstep(0.62, 0.92, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, [topColor, horizonColor]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[85, 32, 24]} />
    </mesh>
  );
};

interface ArrivalWorldProps {
  customization: PalaceCustomization;
  theme: ThemePalette;
  entering: boolean;
  onTriggerEnter: () => void;
  onEnterComplete: () => void;
}

const ArrivalWorld: React.FC<ArrivalWorldProps> = ({
  customization,
  theme,
  entering,
  onTriggerEnter,
  onEnterComplete,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const leftDoorPivotRef = useRef<THREE.Group>(null);
  const rightDoorPivotRef = useRef<THREE.Group>(null);
  const portalLightRef = useRef<THREE.PointLight>(null);
  const [doorHovered, setDoorHovered] = useState(false);
  const [customMarbleTex, setCustomMarbleTex] = useState<THREE.Texture | null>(null);
  const [customPetalTex, setCustomPetalTex] = useState<THREE.Texture | null>(null);

  const proceduralMarble = useMemo(
    () => createMarbleTexture('#f4ece2', '#cfc1b0', theme.primary, 5),
    [theme.primary]
  );
  const doorTexture = useMemo(
    () => createRoyalDoorTexture('#4a1626', theme.primary),
    [theme.primary]
  );
  const velvetTexture = useMemo(
    () => createVelvetTexture(theme.burgundy, 1, 4),
    [theme.burgundy]
  );

  useEffect(() => {
    return () => {
      proceduralMarble.dispose();
      doorTexture.dispose();
      velvetTexture.dispose();
    };
  }, [proceduralMarble, doorTexture, velvetTexture]);

  useEffect(() => {
    let active = true;
    loadTextureSafe(customization.assets.marbleTextureUrl, 5, 5).then((t) => {
      if (active) setCustomMarbleTex(t);
    });
    loadTextureSafe(customization.assets.roseTextureUrl, 1, 1).then((t) => {
      if (active) setCustomPetalTex(t);
    });
    return () => {
      active = false;
    };
  }, [customization.assets.marbleTextureUrl, customization.assets.roseTextureUrl]);

  useEffect(() => {
    document.body.style.cursor = doorHovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [doorHovered]);

  // Initial subtle camera glide-in on arrival
  useEffect(() => {
    camera.position.set(0, 8.2, 34);
    const tween = gsap.to(camera.position, {
      x: 0,
      y: 6.4,
      z: 28.5,
      duration: 2.2,
      ease: 'power2.out',
    });
    return () => {
      tween.kill();
    };
  }, [camera]);

  // Animate royal doors swinging open and flying into the glowing foyer
  useEffect(() => {
    if (!entering) return;
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        onEnterComplete();
      },
    });

    if (leftDoorPivotRef.current && rightDoorPivotRef.current) {
      tl.to(
        leftDoorPivotRef.current.rotation,
        { y: 1.48, duration: 1.5, ease: 'power3.inOut' },
        0
      );
      tl.to(
        rightDoorPivotRef.current.rotation,
        { y: -1.48, duration: 1.5, ease: 'power3.inOut' },
        0
      );
    }

    if (portalLightRef.current) {
      tl.to(portalLightRef.current, { intensity: 75, duration: 1.4, ease: 'power2.in' }, 0.2);
    }

    tl.to(
      camera.position,
      { x: 0, y: 3.6, z: 3.2, duration: 1.9, ease: 'power2.inOut' },
      0.45
    );

    if (controlsRef.current) {
      tl.to(
        controlsRef.current.target,
        { x: 0, y: 3.4, z: -6, duration: 1.7, ease: 'power2.inOut' },
        0.45
      );
    }

    return () => {
      tl.kill();
    };
  }, [entering, camera, onEnterComplete]);

  // Gentle candlelight pulse on palace portal
  useFrame(({ clock }) => {
    if (portalLightRef.current && !entering) {
      portalLightRef.current.intensity = 16 + Math.sin(clock.getElapsedTime() * 2.4) * 2.2;
    }
  });

  const marbleMap = customMarbleTex || proceduralMarble;

  // Palace glowing window coordinates
  const windowPositions = useMemo(() => {
    const coords: Array<[number, number, number]> = [];
    // Left & right wings - 2 stories
    for (const side of [-1, 1]) {
      for (const xOff of [6.2, 9.2, 12.2]) {
        coords.push([side * xOff, 4.4, 0.86]);
        coords.push([side * xOff, 8.2, 0.86]);
      }
      // Central upper story windows flanking main crest
      coords.push([side * 3.1, 8.6, 1.56]);
    }
    return coords;
  }, []);

  return (
    <>
      <fog attach="fog" args={[theme.fogColor, 20, 68]} />
      <TwilightSkyDome topColor={theme.background} horizonColor="#592848" />
      <Stars radius={55} depth={32} count={2600} factor={3.2} saturation={0.45} fade speed={0.5} />

      {/* Glowing Crescent Moon */}
      <group position={[-18, 22, -38]}>
        <mesh>
          <sphereGeometry args={[2.5, 24, 24]} />
          <meshBasicMaterial color="#fff1d0" />
        </mesh>
        <mesh position={[0.9, 0.3, 0.5]}>
          <sphereGeometry args={[2.25, 24, 24]} />
          <meshBasicMaterial color={theme.background} />
        </mesh>
      </group>

      {/* Atmospheric Twilight Lighting */}
      <ambientLight intensity={0.5} color="#cab8e8" />
      <hemisphereLight args={['#9478c4', '#2e1624', 0.65]} />
      <directionalLight
        position={[-14, 20, 14]}
        intensity={1.35}
        color="#ffdcb8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[16, 12, 10]} intensity={0.55} color="#f4b6c8" />

      {/* Courtyard Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 10]} receiveShadow>
        <planeGeometry args={[80, 70]} />
        <meshStandardMaterial
          map={marbleMap}
          color="#ddd2dc"
          roughness={0.34}
          metalness={0.14}
        />
      </mesh>

      {/* Reflective Courtyard Pool Apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 13.5]}>
        <circleGeometry args={[3.6, 48]} />
        <meshStandardMaterial
          color="#281d42"
          roughness={0.08}
          metalness={0.75}
          emissive="#402448"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh position={[0, 0.14, 13.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.65, 0.14, 12, 48]} />
        <meshStandardMaterial color={theme.ivory} roughness={0.3} />
      </mesh>

      {/* GRAND PALACE ARCHITECTURE */}
      <group position={[0, 0, -2]}>
        {/* Main Central Pavilion */}
        <mesh position={[0, 6.5, -1.2]} castShadow receiveShadow>
          <boxGeometry args={[10.5, 13, 5.4]} />
          <meshStandardMaterial color={theme.wallColor} roughness={0.42} metalness={0.05} />
        </mesh>

        {/* Left & Right Grand Wings */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 9.5, 5.5, -1.8]} castShadow receiveShadow>
              <boxGeometry args={[9.4, 11, 5.2]} />
              <meshStandardMaterial color={theme.wallColor} roughness={0.45} metalness={0.04} />
            </mesh>
            {/* Mansard Wing Roof */}
            <mesh position={[side * 9.5, 12.1, -1.8]} castShadow>
              <cylinderGeometry args={[3.9, 5.4, 2.4, 4]} />
              <meshStandardMaterial color="#2a2240" roughness={0.45} metalness={0.35} />
            </mesh>
            {/* Wing Corner Dome Tower */}
            <mesh position={[side * 14.3, 6.2, -1.4]} castShadow>
              <cylinderGeometry args={[2.1, 2.3, 12.4, 20]} />
              <meshStandardMaterial color={theme.wallColor} roughness={0.4} />
            </mesh>
            <mesh position={[side * 14.3, 13.2, -1.4]}>
              <sphereGeometry args={[2.15, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color="#312448" roughness={0.32} metalness={0.48} />
            </mesh>
            <mesh position={[side * 14.3, 15.9, -1.4]}>
              <coneGeometry args={[0.16, 1.8, 10]} />
              <meshStandardMaterial color={theme.primary} metalness={0.92} roughness={0.18} />
            </mesh>
            {/* Gilded Cornice Molding */}
            <mesh position={[side * 9.5, 11.0, 0.9]}>
              <boxGeometry args={[9.6, 0.28, 0.35]} />
              <meshStandardMaterial color={theme.primary} metalness={0.86} roughness={0.22} />
            </mesh>
          </group>
        ))}

        {/* Central Classical Triangular Pediment */}
        <mesh position={[0, 14.2, 1.3]} rotation={[0, 0, 0]}>
          <coneGeometry args={[6.3, 2.8, 4]} />
          <meshStandardMaterial color={theme.ivory} roughness={0.35} />
        </mesh>
        {/* Grand Central Royal Dome */}
        <mesh position={[0, 14.4, -1.4]}>
          <cylinderGeometry args={[3.4, 3.6, 2.4, 28]} />
          <meshStandardMaterial color={theme.ivory} roughness={0.38} />
        </mesh>
        <mesh position={[0, 16.5, -1.4]}>
          <sphereGeometry args={[3.45, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#2c1d42" roughness={0.28} metalness={0.55} />
        </mesh>
        {/* Gilded Rib Finial Spire */}
        <mesh position={[0, 20.6, -1.4]}>
          <coneGeometry args={[0.24, 2.4, 12]} />
          <meshStandardMaterial color={theme.primary} metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, 19.6, -1.4]}>
          <sphereGeometry args={[0.38, 16, 16]} />
          <meshStandardMaterial color={theme.primary} metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Classical Portico Columns */}
        <RoyalColumn position={[-4.2, 1.5, 2.1]} height={9.6} radius={0.38} goldColor={theme.primary} marbleColor={theme.ivory} />
        <RoyalColumn position={[-2.4, 1.5, 2.1]} height={9.6} radius={0.38} goldColor={theme.primary} marbleColor={theme.ivory} />
        <RoyalColumn position={[2.4, 1.5, 2.1]} height={9.6} radius={0.38} goldColor={theme.primary} marbleColor={theme.ivory} />
        <RoyalColumn position={[4.2, 1.5, 2.1]} height={9.6} radius={0.38} goldColor={theme.primary} marbleColor={theme.ivory} />

        {/* Glowing Palace Windows */}
        {windowPositions.map(([wx, wy, wz], idx) => (
          <group key={idx} position={[wx, wy, wz]}>
            {/* Gilded window surround */}
            <mesh position={[0, 0, -0.02]}>
              <boxGeometry args={[1.5, 2.55, 0.14]} />
              <meshStandardMaterial color={theme.primary} metalness={0.82} roughness={0.26} />
            </mesh>
            {/* Warm candlelit window pane */}
            <mesh position={[0, 0, 0.06]}>
              <planeGeometry args={[1.22, 2.25]} />
              <meshStandardMaterial
                color="#ffe6b0"
                emissive="#ffbe6b"
                emissiveIntensity={1.35}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}

        {/* Golden Palace Interior Glow behind Doors */}
        <mesh position={[0, 4.1, 0.55]}>
          <planeGeometry args={[4.4, 5.4]} />
          <meshBasicMaterial color="#ffe4a8" />
        </mesh>
        <pointLight
          ref={portalLightRef}
          position={[0, 4.2, 1.3]}
          color="#ffd28a"
          intensity={16}
          distance={18}
          decay={1.8}
        />

        {/* Ornate Door Arch Frame */}
        <mesh position={[0, 6.85, 1.48]}>
          <boxGeometry args={[4.7, 0.36, 0.45]} />
          <meshStandardMaterial color={theme.primary} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* LARGE ANIMATED ROYAL ENTRANCE DOORS (click directly to enter!) */}
        <group
          position={[0, 1.5, 1.45]}
          onClick={(e) => {
            e.stopPropagation();
            if (!entering) onTriggerEnter();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setDoorHovered(true);
          }}
          onPointerOut={() => setDoorHovered(false)}
        >
          {/* Left Door Leaf pivoting on left hinge */}
          <group ref={leftDoorPivotRef} position={[-2.05, 0, 0]}>
            <mesh position={[1.02, 2.6, 0]} castShadow>
              <boxGeometry args={[2.02, 5.2, 0.2]} />
              <meshStandardMaterial
                map={doorTexture}
                roughness={0.32}
                metalness={0.24}
                emissive={theme.primary}
                emissiveIntensity={doorHovered ? 0.16 : 0.03}
              />
            </mesh>
            {/* Golden Ring Knocker */}
            <mesh position={[1.76, 2.35, 0.14]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.14, 0.035, 10, 20]} />
              <meshStandardMaterial color={theme.primary} metalness={0.95} roughness={0.14} />
            </mesh>
          </group>

          {/* Right Door Leaf pivoting on right hinge */}
          <group ref={rightDoorPivotRef} position={[2.05, 0, 0]}>
            <mesh position={[-1.02, 2.6, 0]} castShadow>
              <boxGeometry args={[2.02, 5.2, 0.2]} />
              <meshStandardMaterial
                map={doorTexture}
                roughness={0.32}
                metalness={0.24}
                emissive={theme.primary}
                emissiveIntensity={doorHovered ? 0.16 : 0.03}
              />
            </mesh>
            <mesh position={[-1.76, 2.35, 0.14]}>
              <torusGeometry args={[0.14, 0.035, 10, 20]} />
              <meshStandardMaterial color={theme.primary} metalness={0.95} roughness={0.14} />
            </mesh>
          </group>
        </group>

        {/* GRAND MARBLE ENTRANCE STAIRCASE */}
        <group position={[0, 0, 2.5]}>
          {/* Top Landing Platform */}
          <mesh position={[0, 0.75, 0.6]} receiveShadow castShadow>
            <boxGeometry args={[10.4, 1.5, 3.6]} />
            <meshStandardMaterial map={marbleMap} color={theme.ivory} roughness={0.25} />
          </mesh>

          {/* 7 Sweeping Marble Steps */}
          {Array.from({ length: 7 }, (_, i) => {
            const width = 8.4 + i * 0.55;
            const height = 1.4 - i * 0.2;
            const z = 2.6 + i * 0.65;
            return (
              <mesh key={i} position={[0, height / 2, z]} receiveShadow castShadow>
                <boxGeometry args={[width, height, 0.72]} />
                <meshStandardMaterial map={marbleMap} color={theme.ivory} roughness={0.28} />
              </mesh>
            );
          })}

          {/* Burgundy Velvet Carpet Runner */}
          <mesh position={[0, 0.9, 4.65]} rotation={[0.29, 0, 0]} receiveShadow>
            <boxGeometry args={[3.4, 0.07, 5.1]} />
            <meshStandardMaterial map={velvetTexture} roughness={0.82} />
          </mesh>
          {/* Gold Carpet Trim */}
          {[-1.74, 1.74].map((x, idx) => (
            <mesh key={idx} position={[x, 0.92, 4.65]} rotation={[0.29, 0, 0]}>
              <boxGeometry args={[0.09, 0.08, 5.1]} />
              <meshStandardMaterial color={theme.primary} metalness={0.9} roughness={0.2} />
            </mesh>
          ))}

          {/* Four Glowing Royal Courtyard Lantern Pedestals */}
          {[
            [-4.8, 1.5, 2.3],
            [4.8, 1.5, 2.3],
            [-6.4, 0, 7.2],
            [6.4, 0, 7.2],
          ].map(([lx, ly, lz], idx) => (
            <group key={idx} position={[lx, ly, lz]}>
              <mesh position={[0, 0.8, 0]} castShadow>
                <boxGeometry args={[0.68, 1.6, 0.68]} />
                <meshStandardMaterial color={theme.ivory} roughness={0.35} />
              </mesh>
              <mesh position={[0, 1.9, 0]}>
                <cylinderGeometry args={[0.06, 0.1, 0.7, 10]} />
                <meshStandardMaterial color={theme.primary} metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 2.45, 0]}>
                <octahedronGeometry args={[0.34, 1]} />
                <meshStandardMaterial
                  color="#fff3ce"
                  emissive="#ffca72"
                  emissiveIntensity={2.2}
                />
              </mesh>
              <pointLight
                position={[0, 2.6, 0]}
                color="#ffd38c"
                intensity={7}
                distance={12}
                decay={2}
              />
            </group>
          ))}
        </group>
      </group>

      {/* Floating Golden Stardust & Rose Petals */}
      <FloatingStardust
        count={240}
        spread={[36, 18, 32]}
        color="#fae2a8"
        size={0.12}
        enabled={customization.decoratives.enableStardust}
      />
      <FallingRosePetals
        count={80}
        area={[28, 14, 24]}
        color={theme.petalColor}
        customTexture={customPetalTex}
        enabled={customization.decoratives.enableFallingPetals}
      />

      <OrbitControls
        ref={controlsRef}
        target={[0, 6.8, -1.5]}
        enablePan={false}
        minDistance={12}
        maxDistance={38}
        minPolarAngle={Math.PI * 0.24}
        maxPolarAngle={Math.PI * 0.49}
        minAzimuthAngle={-Math.PI * 0.32}
        maxAzimuthAngle={Math.PI * 0.32}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};

export const PalaceArrival: React.FC<PalaceArrivalProps> = ({
  customization,
  theme,
  onEnterPalace,
}) => {
  const [entering, setEntering] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const tween = gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 1.25, ease: 'power3.out', delay: 0.25 }
    );
    return () => {
      tween.kill();
    };
  }, []);

  const handleEnterClick = () => {
    if (entering) return;
    setEntering(true);
    if (heroRef.current) {
      gsap.to(heroRef.current, { opacity: 0, y: 18, duration: 0.65, ease: 'power2.in' });
    }
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 8.2, 34], fov: 46 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <ArrivalWorld
          customization={customization}
          theme={theme}
          entering={entering}
          onTriggerEnter={handleEnterClick}
          onEnterComplete={onEnterPalace}
        />
      </Canvas>

      {/* Romantic Twilight Welcome Overlay */}
      <div
        ref={heroRef}
        className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center px-4 sm:bottom-6"
      >
        <div className="royal-glass pointer-events-auto max-w-lg rounded-3xl px-5 py-4 text-center sm:px-8 sm:py-5">
          <div className="inline-flex items-center gap-2 font-royal-display text-[10px] uppercase tracking-[0.35em] text-[#f4c2c2]">
            <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
            Chapter I • The Royal Arrival
          </div>

          <h1 className="gold-shimmer-text font-royal-display mt-1.5 text-2xl font-semibold tracking-[0.16em] sm:text-3xl">
            {customization.arrivalTitle}
          </h1>

          <p className="font-royal-script mt-0.5 text-2xl text-[#f4c2c2] sm:text-3xl">
            For {customization.recipientName}
          </p>

          <p className="mt-1 font-royal-display text-[10px] uppercase tracking-[0.2em] text-[#f3d9a4]/90">
            {customization.arrivalSubtitle}
          </p>

          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#faf6f0]/85 sm:text-sm">
            {customization.arrivalMessage}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={entering}
              onClick={handleEnterClick}
              className="royal-btn inline-flex items-center gap-2.5 rounded-full px-6 py-2.5 text-xs sm:px-8 sm:py-3"
            >
              {entering ? 'Opening Royal Doors...' : 'Enter The Palace'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-[11px] italic text-[#f4c2c2]/70">
            Drag to admire the twilight estate • Click the grand palace doors to enter
          </p>
        </div>
      </div>
    </div>
  );
};
