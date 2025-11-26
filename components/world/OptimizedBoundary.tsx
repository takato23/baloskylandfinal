import React, { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box } from '@react-three/drei';
import { useGameStore } from '../../store';
import { QUALITY_PRESETS } from '../../utils/performance';
import {
  InstancedBorderTrees,
  InstancedHills,
  InstancedRocks,
  InstancedFlowers,
} from './InstancedBorderElements';

interface OptimizedBoundaryProps {
  mapSize: number;
}

/**
 * Optimized boundary walls with quality-aware decorations.
 * Uses instancing for trees, hills, rocks, and flowers.
 * Conditionally renders decorations based on quality settings.
 */
export const OptimizedBoundary: React.FC<OptimizedBoundaryProps> = React.memo(({ mapSize }) => {
  const qualityLevel = useGameStore((s) => s.qualityLevel);
  const quality = QUALITY_PRESETS[qualityLevel];

  const halfSize = mapSize / 2 + 5;
  const height = 10;
  const thickness = 2;
  const fenceOffset = halfSize - 1;
  const hillOffset = halfSize + 30;
  const treeOffset = halfSize + 10;

  // Generate border trees data
  const borderTrees = useMemo(() => {
    if (!quality.enableBorderDecorations) return [];

    const trees: { position: [number, number, number]; scale: number; variant: 'oak' | 'pine' | 'cherry' | 'maple' }[] = [];
    const variants: ('oak' | 'pine' | 'cherry' | 'maple')[] = ['oak', 'pine', 'cherry', 'maple'];
    const spacing = quality.decorationDensity < 0.5 ? 12 : 6;
    const count = Math.floor((halfSize * 2) / spacing);

    for (let i = 0; i <= count; i++) {
      const offset = -halfSize + i * spacing + (Math.random() - 0.5) * 2;
      const scale = 0.7 + Math.random() * 0.5;
      const variant = variants[Math.floor(Math.random() * variants.length)];

      // Only add trees on 2 sides for lower quality
      if (quality.decorationDensity >= 0.5) {
        trees.push({ position: [offset, 0, -treeOffset], scale, variant });
        trees.push({ position: [offset, 0, treeOffset], scale, variant });
      }
      trees.push({ position: [treeOffset, 0, offset], scale, variant });
      trees.push({ position: [-treeOffset, 0, offset], scale, variant });
    }

    // Limit total trees based on density
    const maxTrees = Math.floor(100 * quality.decorationDensity);
    return trees.slice(0, maxTrees);
  }, [halfSize, treeOffset, quality.enableBorderDecorations, quality.decorationDensity]);

  // Generate hills data
  const hills = useMemo(() => {
    if (!quality.enableBorderDecorations) return [];

    const h: { position: [number, number, number]; scale: number; variant: 'green' | 'autumn' | 'snowy' }[] = [];
    const variants: ('green' | 'autumn' | 'snowy')[] = ['green', 'green', 'green', 'autumn'];

    // Reduced positions for performance
    const positions = quality.decorationDensity >= 0.7
      ? [
          { pos: [0, 0, -hillOffset], scale: 2.5 },
          { pos: [-35, 0, -hillOffset - 15], scale: 1.8 },
          { pos: [45, 0, -hillOffset + 5], scale: 2.2 },
          { pos: [0, 0, hillOffset], scale: 2.3 },
          { pos: [30, 0, hillOffset + 10], scale: 1.9 },
          { pos: [-50, 0, hillOffset - 5], scale: 1.6 },
          { pos: [hillOffset, 0, 0], scale: 2.0 },
          { pos: [-hillOffset, 0, 0], scale: 2.1 },
        ]
      : [
          // Minimal hills for low quality
          { pos: [0, 0, -hillOffset], scale: 2.5 },
          { pos: [0, 0, hillOffset], scale: 2.3 },
          { pos: [hillOffset, 0, 0], scale: 2.0 },
          { pos: [-hillOffset, 0, 0], scale: 2.1 },
        ];

    positions.forEach((p, i) => {
      h.push({ position: p.pos as [number, number, number], scale: p.scale, variant: variants[i % variants.length] });
    });

    return h;
  }, [hillOffset, quality.enableBorderDecorations, quality.decorationDensity]);

  // Generate flowers data
  const flowers = useMemo(() => {
    if (!quality.enableBorderDecorations || quality.decorationDensity < 0.5) return [];

    const f: { position: [number, number, number]; color: string }[] = [];
    const colors = ['#ec4899', '#f472b6', '#a855f7', '#3b82f6', '#eab308', '#ef4444'];
    const flowerCount = Math.floor(60 * quality.decorationDensity);

    for (let i = 0; i < flowerCount; i++) {
      const side = Math.floor(Math.random() * 4);
      const offset = (Math.random() - 0.5) * halfSize * 1.8;
      const dist = halfSize + 2 + Math.random() * 4;

      let pos: [number, number, number];
      switch (side) {
        case 0: pos = [offset, 0, -dist]; break;
        case 1: pos = [offset, 0, dist]; break;
        case 2: pos = [dist, 0, offset]; break;
        default: pos = [-dist, 0, offset];
      }

      f.push({ position: pos, color: colors[Math.floor(Math.random() * colors.length)] });
    }
    return f;
  }, [halfSize, quality.enableBorderDecorations, quality.decorationDensity]);

  // Generate rocks data
  const rocks = useMemo(() => {
    if (!quality.enableBorderDecorations || quality.decorationDensity < 0.4) return [];

    const r: { position: [number, number, number]; scale: number }[] = [];
    const rockCount = Math.floor(20 * quality.decorationDensity);

    for (let i = 0; i < rockCount; i++) {
      const side = Math.floor(Math.random() * 4);
      const offset = (Math.random() - 0.5) * halfSize * 1.6;
      const dist = halfSize + 5 + Math.random() * 8;

      let pos: [number, number, number];
      switch (side) {
        case 0: pos = [offset, 0, -dist]; break;
        case 1: pos = [offset, 0, dist]; break;
        case 2: pos = [dist, 0, offset]; break;
        default: pos = [-dist, 0, offset];
      }

      r.push({ position: pos, scale: 0.5 + Math.random() * 1.5 });
    }
    return r;
  }, [halfSize, quality.enableBorderDecorations, quality.decorationDensity]);

  return (
    <group>
      {/* Invisible collision walls */}
      <RigidBody type="fixed" colliders={false} friction={0}>
        <CuboidCollider args={[halfSize, height, thickness]} position={[0, height / 2, -halfSize]} />
        <CuboidCollider args={[halfSize, height, thickness]} position={[0, height / 2, halfSize]} />
        <CuboidCollider args={[thickness, height, halfSize]} position={[halfSize, height / 2, 0]} />
        <CuboidCollider args={[thickness, height, halfSize]} position={[-halfSize, height / 2, 0]} />
      </RigidBody>

      {/* Sky background - simplified */}
      <SimpleSkyBackground />

      {/* Outer grass - simplified */}
      <SimpleOuterGrass size={halfSize} />

      {/* Simple water border */}
      <SimpleWaterBorder size={halfSize} />

      {/* Instanced decorations (only if enabled) */}
      {quality.enableBorderDecorations && (
        <>
          <InstancedBorderTrees data={borderTrees} />
          <InstancedHills data={hills} />
          {flowers.length > 0 && <InstancedFlowers data={flowers} />}
          {rocks.length > 0 && <InstancedRocks data={rocks} />}

          {/* Simple fences */}
          <SimpleFences halfSize={halfSize} fenceOffset={fenceOffset} />
        </>
      )}
    </group>
  );
});

// Simplified sky background
const SimpleSkyBackground: React.FC = React.memo(() => (
  <group>
    {/* Just 4 simple planes instead of complex clouds */}
    {[
      { pos: [0, 30, -150] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [0, 30, 150] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] },
      { pos: [150, 30, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number] },
      { pos: [-150, 30, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
    ].map((sky, i) => (
      <mesh key={`sky-${i}`} position={sky.pos} rotation={sky.rot}>
        <planeGeometry args={[500, 120]} />
        <meshBasicMaterial color="#87ceeb" />
      </mesh>
    ))}
  </group>
));

// Simplified outer grass
const SimpleOuterGrass: React.FC<{ size: number }> = React.memo(({ size }) => {
  const grassSize = 120;
  const offset = size + 18;

  return (
    <group>
      {[
        { pos: [0, -0.15, -offset - grassSize / 2] as [number, number, number], size: [grassSize * 3, grassSize] as [number, number] },
        { pos: [0, -0.15, offset + grassSize / 2] as [number, number, number], size: [grassSize * 3, grassSize] as [number, number] },
        { pos: [offset + grassSize / 2, -0.15, 0] as [number, number, number], size: [grassSize, grassSize * 3] as [number, number] },
        { pos: [-offset - grassSize / 2, -0.15, 0] as [number, number, number], size: [grassSize, grassSize * 3] as [number, number] },
      ].map((g, i) => (
        <mesh key={`grass-${i}`} position={g.pos} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={g.size} />
          <meshStandardMaterial color="#4ade80" />
        </mesh>
      ))}
    </group>
  );
});

// Simplified water border
const SimpleWaterBorder: React.FC<{ size: number }> = React.memo(({ size }) => {
  const waterWidth = 8;

  return (
    <group>
      {/* 4 water strips */}
      <mesh position={[0, -0.08, -size - waterWidth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size * 2 + waterWidth * 2, waterWidth]} />
        <meshStandardMaterial color="#22d3ee" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, -0.08, size + waterWidth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size * 2 + waterWidth * 2, waterWidth]} />
        <meshStandardMaterial color="#22d3ee" transparent opacity={0.8} />
      </mesh>
      <mesh position={[size + waterWidth / 2, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[waterWidth, size * 2 + waterWidth * 2]} />
        <meshStandardMaterial color="#22d3ee" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-size - waterWidth / 2, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[waterWidth, size * 2 + waterWidth * 2]} />
        <meshStandardMaterial color="#22d3ee" transparent opacity={0.8} />
      </mesh>
    </group>
  );
});

// Simplified fences
const SimpleFences: React.FC<{ halfSize: number; fenceOffset: number }> = React.memo(({ halfSize, fenceOffset }) => (
  <group>
    {/* 4 simple fence lines using boxes */}
    <Box args={[halfSize * 1.8, 1.2, 0.1]} position={[0, 0.6, -fenceOffset]}>
      <meshStandardMaterial color="#fef3c7" />
    </Box>
    <Box args={[halfSize * 1.8, 1.2, 0.1]} position={[0, 0.6, fenceOffset]}>
      <meshStandardMaterial color="#fef3c7" />
    </Box>
    <Box args={[0.1, 1.2, halfSize * 1.8]} position={[-fenceOffset, 0.6, 0]}>
      <meshStandardMaterial color="#fef3c7" />
    </Box>
    <Box args={[0.1, 1.2, halfSize * 1.8]} position={[fenceOffset, 0.6, 0]}>
      <meshStandardMaterial color="#fef3c7" />
    </Box>
  </group>
));

export default OptimizedBoundary;
