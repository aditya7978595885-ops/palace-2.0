import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createRosePetalTexture } from '../utils/proceduralTextures';

interface FallingRosePetalsProps {
  count?: number;
  area?: [number, number, number];
  color?: string;
  customTexture?: THREE.Texture | null;
  enabled?: boolean;
}

export const FallingRosePetals: React.FC<FallingRosePetalsProps> = ({
  count = 95,
  area = [22, 12, 22],
  color = '#f4a9bd',
  customTexture = null,
  enabled = true,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const proceduralTex = useMemo(() => createRosePetalTexture(color), [color]);
  useEffect(() => {
    return () => {
      proceduralTex.dispose();
    };
  }, [proceduralTex]);

  const seeds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const s = (n: number) => Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
      const frac = (n: number) => s(n) - Math.floor(s(n));
      return {
        x: (frac(1) - 0.5) * area[0],
        y: frac(2) * area[1] + 0.5,
        z: (frac(3) - 0.5) * area[2],
        speed: 0.35 + frac(4) * 0.45,
        swayAmp: 0.4 + frac(5) * 0.9,
        swayFreq: 0.5 + frac(6) * 0.9,
        phase: frac(7) * Math.PI * 2,
        rotSpeedX: (frac(8) - 0.5) * 1.4,
        rotSpeedY: (frac(9) - 0.5) * 1.6,
        scale: 0.14 + frac(10) * 0.13,
      };
    });
  }, [count, area]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || !enabled) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const p = seeds[i];
      const y = ((p.y - t * p.speed) % area[1] + area[1]) % area[1] + 0.25;
      const x = p.x + Math.sin(t * p.swayFreq + p.phase) * p.swayAmp;
      const z = p.z + Math.cos(t * p.swayFreq * 0.8 + p.phase) * p.swayAmp * 0.7;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        t * p.rotSpeedX + p.phase,
        t * p.rotSpeedY,
        Math.sin(t + p.phase) * 0.8
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1.15]} />
      <meshStandardMaterial
        map={customTexture || proceduralTex}
        transparent
        alphaTest={0.08}
        side={THREE.DoubleSide}
        roughness={0.5}
        metalness={0.05}
        emissive={color}
        emissiveIntensity={0.12}
      />
    </instancedMesh>
  );
};

interface FloatingStardustProps {
  count?: number;
  spread?: [number, number, number];
  color?: string;
  size?: number;
  enabled?: boolean;
}

export const FloatingStardust: React.FC<FloatingStardustProps> = ({
  count = 180,
  spread = [24, 14, 24],
  color = '#f8dfa0',
  size = 0.09,
  enabled = true,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r1 = Math.sin(i * 19.13 + 1.1) * 43758.5453;
      const r2 = Math.sin(i * 37.71 + 2.3) * 43758.5453;
      const r3 = Math.sin(i * 53.91 + 3.7) * 43758.5453;
      arr[i * 3] = (r1 - Math.floor(r1) - 0.5) * spread[0];
      arr[i * 3 + 1] = (r2 - Math.floor(r2)) * spread[1] + 0.5;
      arr[i * 3 + 2] = (r3 - Math.floor(r3) - 0.5) * spread[2];
    }
    return arr;
  }, [count, spread]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !enabled) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.025;
    pointsRef.current.position.y = Math.sin(t * 0.45) * 0.25;
  });

  if (!enabled) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.78}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

interface RoyalChandelierProps {
  position: [number, number, number];
  scale?: number;
  goldColor?: string;
  glowEnabled?: boolean;
  lightIntensity?: number;
}

export const RoyalChandelier: React.FC<RoyalChandelierProps> = ({
  position,
  scale = 1,
  goldColor = '#d4af37',
  glowEnabled = true,
  lightIntensity = 22,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const armsOuter = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);
  const armsInner = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2 + 0.3), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.06;
    groupRef.current.rotation.z = Math.sin(t * 0.5 + position[0]) * 0.015;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Suspension chain & ceiling canopy */}
      <mesh position={[0, 1.85, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.2, 10]} />
        <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.22} />
      </mesh>
      <mesh position={[0, 2.9, 0]}>
        <coneGeometry args={[0.38, 0.28, 16]} />
        <meshStandardMaterial color={goldColor} metalness={0.88} roughness={0.25} />
      </mesh>

      {/* Central sculpted spindle */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 1.35, 16]} />
        <meshStandardMaterial color={goldColor} metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0, -0.52, 0]}>
        <octahedronGeometry args={[0.24, 1]} />
        <meshPhysicalMaterial
          color="#fff9ee"
          roughness={0.05}
          metalness={0.1}
          transmission={0.7}
          thickness={0.5}
          emissive="#ffe7b3"
          emissiveIntensity={glowEnabled ? 0.55 : 0.1}
        />
      </mesh>

      {/* Outer golden ring */}
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.38, 0.05, 12, 40]} />
        <meshStandardMaterial color={goldColor} metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Upper inner golden ring */}
      <mesh position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.04, 10, 32]} />
        <meshStandardMaterial color={goldColor} metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Outer candles & hanging crystal prisms */}
      {armsOuter.map((angle, i) => {
        const x = Math.cos(angle) * 1.38;
        const z = Math.sin(angle) * 1.38;
        return (
          <group key={`outer-${i}`} position={[x, 0.05, z]}>
            {/* Bobeche saucer */}
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.11, 0.06, 0.05, 12]} />
              <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Wax candle */}
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.036, 0.038, 0.28, 10]} />
              <meshStandardMaterial color="#fff8eb" roughness={0.6} />
            </mesh>
            {/* Warm candle flame */}
            <mesh position={[0, 0.4, 0]}>
              <coneGeometry args={[0.038, 0.13, 8]} />
              <meshBasicMaterial color={glowEnabled ? '#ffefc2' : '#9c8a6b'} />
            </mesh>
            {/* Crystal drop */}
            <mesh position={[0, -0.24, 0]}>
              <octahedronGeometry args={[0.09, 0]} />
              <meshStandardMaterial
                color="#fff6e8"
                metalness={0.2}
                roughness={0.08}
                emissive="#ffdca0"
                emissiveIntensity={glowEnabled ? 0.65 : 0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* Upper tier candles */}
      {armsInner.map((angle, i) => {
        const x = Math.cos(angle) * 0.82;
        const z = Math.sin(angle) * 0.82;
        return (
          <group key={`inner-${i}`} position={[x, 0.65, z]}>
            <mesh position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.032, 0.035, 0.24, 10]} />
              <meshStandardMaterial color="#fff8eb" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <coneGeometry args={[0.035, 0.11, 8]} />
              <meshBasicMaterial color={glowEnabled ? '#fff2c9' : '#9c8a6b'} />
            </mesh>
          </group>
        );
      })}

      {glowEnabled && (
        <pointLight
          position={[0, -0.1, 0]}
          color="#ffdca8"
          intensity={lightIntensity}
          distance={24}
          decay={1.8}
        />
      )}
    </group>
  );
};

interface RoyalColumnProps {
  position: [number, number, number];
  height?: number;
  radius?: number;
  goldColor?: string;
  marbleColor?: string;
}

export const RoyalColumn: React.FC<RoyalColumnProps> = ({
  position,
  height = 8.4,
  radius = 0.44,
  goldColor = '#d4af37',
  marbleColor = '#f4ece2',
}) => {
  return (
    <group position={position}>
      {/* Square marble plinth */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.9, 0.5, radius * 2.9]} />
        <meshStandardMaterial color={marbleColor} roughness={0.28} metalness={0.08} />
      </mesh>
      {/* Gilded base torus */}
      <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.12, 0.07, 10, 24]} />
        <meshStandardMaterial color={goldColor} metalness={0.88} roughness={0.22} />
      </mesh>
      {/* Fluted shaft */}
      <mesh position={[0, height / 2 + 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.92, radius, height - 0.8, 20]} />
        <meshStandardMaterial color={marbleColor} roughness={0.22} metalness={0.06} />
      </mesh>
      {/* Golden Corinthian neck ring */}
      <mesh position={[0, height - 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.08, 0.08, 10, 24]} />
        <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Capital flare */}
      <mesh position={[0, height - 0.16, 0]}>
        <cylinderGeometry args={[radius * 1.38, radius * 0.94, 0.42, 16]} />
        <meshStandardMaterial color={goldColor} metalness={0.85} roughness={0.24} />
      </mesh>
      {/* Top abacus */}
      <mesh position={[0, height + 0.12, 0]}>
        <boxGeometry args={[radius * 2.85, 0.22, radius * 2.85]} />
        <meshStandardMaterial color={marbleColor} roughness={0.26} metalness={0.1} />
      </mesh>
    </group>
  );
};
