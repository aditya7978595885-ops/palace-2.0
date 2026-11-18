import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GalleryPhoto } from '../types/palace';
import { createPlaceholderPortraitTexture } from '../utils/proceduralTextures';

interface PhotoFrameProps {
  photo: GalleryPhoto;
  index: number;
  position: [number, number, number];
  rotation: [number, number, number];
  goldColor: string;
  secondaryColor: string;
  isSelected: boolean;
  onSelect: (photo: GalleryPhoto, index: number) => void;
}

function createNameplateTexture(caption: string, date: string, goldColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 128);
  grad.addColorStop(0, '#5a3f12');
  grad.addColorStop(0.5, '#b88d2c');
  grad.addColorStop(1, '#5a3f12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#fff0c2';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1b0d0a';
  const label = caption || 'Cherished Memory';
  let fontSize = 28;
  ctx.font = `600 ${fontSize}px "Playfair Display", Georgia, serif`;
  while (ctx.measureText(label).width > 450 && fontSize > 15) {
    fontSize -= 1;
    ctx.font = `600 ${fontSize}px "Playfair Display", Georgia, serif`;
  }
  ctx.fillText(label, 256, 56);

  ctx.fillStyle = '#331a0e';
  ctx.font = '600 20px "Cinzel", Georgia, serif';
  ctx.fillText(date || 'The Royal Regency', 256, 94);

  // Corner brass rivets
  ctx.fillStyle = goldColor;
  [
    [22, 22],
    [490, 22],
    [22, 106],
    [490, 106],
  ].forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const PhotoFrame: React.FC<PhotoFrameProps> = ({
  photo,
  index,
  position,
  rotation,
  goldColor,
  secondaryColor,
  isSelected,
  onSelect,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [uploadedTexture, setUploadedTexture] = useState<THREE.Texture | null>(null);

  // Frame dimensions adapt naturally to portrait vs landscape photographs
  const clampedAspect = Math.max(0.62, Math.min(1.42, photo.aspectRatio || 0.78));
  const frameHeight = clampedAspect > 1.15 ? 2.15 : 2.55;
  const frameWidth = Math.min(2.85, Math.max(1.62, frameHeight * clampedAspect));
  const canvasWidth = frameWidth - 0.08;
  const canvasHeight = frameHeight - 0.08;
  const planeAspect = canvasWidth / canvasHeight;

  // Procedural monogram placeholder if no user image uploaded
  const placeholderTexture = useMemo(
    () =>
      createPlaceholderPortraitTexture(
        index + 1,
        photo.caption,
        goldColor,
        secondaryColor
      ),
    [index, photo.caption, goldColor, secondaryColor]
  );

  useEffect(() => {
    return () => {
      placeholderTexture.dispose();
    };
  }, [placeholderTexture]);

  // Brass engraved nameplate texture
  const nameplateTexture = useMemo(
    () => createNameplateTexture(photo.caption, photo.date, goldColor),
    [photo.caption, photo.date, goldColor]
  );

  useEffect(() => {
    return () => {
      nameplateTexture.dispose();
    };
  }, [nameplateTexture]);

  // Load user-uploaded DataURL into Three.js texture cleanly
  useEffect(() => {
    if (!photo.dataUrl) {
      setUploadedTexture((prev) => {
        prev?.dispose();
        return null;
      });
      return;
    }

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      photo.dataUrl,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;

        // Apply distortion-free object-fit: cover UV cropping (upper-center bias for portraits)
        const img = tex.image as { width?: number; height?: number } | undefined;
        if (img?.width && img?.height) {
          const imgAspect = img.width / img.height;
          if (imgAspect > planeAspect) {
            const repeatX = planeAspect / imgAspect;
            tex.repeat.set(repeatX, 1);
            tex.offset.set((1 - repeatX) * 0.5, 0);
          } else {
            const repeatY = imgAspect / planeAspect;
            tex.repeat.set(1, repeatY);
            tex.offset.set(0, (1 - repeatY) * 0.65);
          }
        }

        tex.needsUpdate = true;
        setUploadedTexture((prev) => {
          prev?.dispose();
          return tex;
        });
      },
      undefined,
      () => {
        if (!cancelled) setUploadedTexture(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [photo.dataUrl, planeAspect]);

  // Cursor feedback
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  // Subtle royal hover lift & custom rotation interpolation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = hovered || isSelected ? 1.045 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      Math.min(1, delta * 7)
    );
    const targetRotY = rotation[1] + (photo.rotationY || 0);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      Math.min(1, delta * 6)
    );
  });

  const activeMap = uploadedTexture || placeholderTexture;
  const borderThickness = 0.16;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[rotation[0], rotation[1] + (photo.rotationY || 0), rotation[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(photo, index);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Warm brass gallery sconce light above the frame */}
      <group position={[0, frameHeight / 2 + 0.45, 0.25]}>
        <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.36, 8]} />
          <meshStandardMaterial color={goldColor} metalness={0.9} roughness={0.22} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.065, 0.065, 0.72, 12]} />
          <meshStandardMaterial
            color={goldColor}
            metalness={0.92}
            roughness={0.2}
            emissive="#ffe2a8"
            emissiveIntensity={hovered || isSelected ? 0.55 : 0.25}
          />
        </mesh>
      </group>

      {/* Ornate outer gilded backing box */}
      <mesh position={[0, 0, -0.04]} castShadow receiveShadow>
        <boxGeometry
          args={[frameWidth + borderThickness * 2, frameHeight + borderThickness * 2, 0.14]}
        />
        <meshStandardMaterial
          color={goldColor}
          metalness={0.88}
          roughness={0.24}
          emissive={goldColor}
          emissiveIntensity={hovered || isSelected ? 0.22 : 0.05}
        />
      </mesh>

      {/* Sculpted raised gold frame rails (top, bottom, left, right) */}
      <mesh position={[0, frameHeight / 2 + borderThickness / 2, 0.06]}>
        <boxGeometry args={[frameWidth + borderThickness * 2.15, borderThickness, 0.12]} />
        <meshStandardMaterial color="#e6c465" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0, -frameHeight / 2 - borderThickness / 2, 0.06]}>
        <boxGeometry args={[frameWidth + borderThickness * 2.15, borderThickness, 0.12]} />
        <meshStandardMaterial color="#e6c465" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[-frameWidth / 2 - borderThickness / 2, 0, 0.06]}>
        <boxGeometry args={[borderThickness, frameHeight, 0.12]} />
        <meshStandardMaterial color="#e6c465" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[frameWidth / 2 + borderThickness / 2, 0, 0.06]}>
        <boxGeometry args={[borderThickness, frameHeight, 0.12]} />
        <meshStandardMaterial color="#e6c465" metalness={0.92} roughness={0.18} />
      </mesh>

      {/* Top baroque crest finial */}
      <mesh position={[0, frameHeight / 2 + borderThickness + 0.09, 0.08]}>
        <octahedronGeometry args={[0.14, 1]} />
        <meshStandardMaterial color="#f5d88b" metalness={0.94} roughness={0.16} />
      </mesh>

      {/* Corner rosettes */}
      {[
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, -1],
      ].map(([sx, sy], idx) => (
        <mesh
          key={idx}
          position={[
            sx * (frameWidth / 2 + borderThickness * 0.52),
            sy * (frameHeight / 2 + borderThickness * 0.52),
            0.12,
          ]}
        >
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial color="#f8e09e" metalness={0.95} roughness={0.15} />
        </mesh>
      ))}

      {/* Inner champagne matte trim */}
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[frameWidth + 0.04, frameHeight + 0.04]} />
        <meshStandardMaterial color="#f5e6cc" roughness={0.65} />
      </mesh>

      {/* The Photograph Canvas */}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[frameWidth - 0.08, frameHeight - 0.08]} />
        <meshStandardMaterial
          map={activeMap}
          roughness={0.38}
          metalness={0.04}
        />
      </mesh>

      {/* Engraved brass nameplate below the portrait */}
      <mesh position={[0, -frameHeight / 2 - 0.42, 0.04]}>
        <boxGeometry args={[1.45, 0.36, 0.04]} />
        <meshStandardMaterial map={nameplateTexture} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
};
