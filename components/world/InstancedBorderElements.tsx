import React, { useMemo, useRef } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  DodecahedronGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  Color,
} from 'three';
import { useGameStore } from '../../store';

// Pre-create geometries for instancing
const trunkGeo = new CylinderGeometry(0.3, 0.5, 3.6, 6);
trunkGeo.translate(0, 1.8, 0);

const foliageSphereGeo = new SphereGeometry(2.5, 6, 5);
foliageSphereGeo.translate(0, 4.5, 0);

const pineConeGeo = new ConeGeometry(2, 4, 6);
pineConeGeo.translate(0, 3, 0);

const hillBaseGeo = new SphereGeometry(10, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
const hillMidGeo = new SphereGeometry(7, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
hillMidGeo.translate(0, 2, 0);

const rockGeo = new DodecahedronGeometry(0.6, 0);
rockGeo.translate(0, 0.3, 0);

const flowerStemGeo = new CylinderGeometry(0.03, 0.04, 0.4, 4);
flowerStemGeo.translate(0, 0.2, 0);

const flowerPetalGeo = new SphereGeometry(0.08, 4, 3);
flowerPetalGeo.translate(0, 0.45, 0);

// Materials
const trunkMat = new MeshStandardMaterial({ color: '#78350f' });
const greenFoliage = new MeshStandardMaterial({ color: '#16a34a', flatShading: true });
const pinkFoliage = new MeshStandardMaterial({ color: '#ec4899', flatShading: true });
const orangeFoliage = new MeshStandardMaterial({ color: '#f97316', flatShading: true });
const pineFoliage = new MeshStandardMaterial({ color: '#064e3b', flatShading: true });
const hillGreen = new MeshStandardMaterial({ color: '#22c55e', flatShading: true });
const hillLight = new MeshStandardMaterial({ color: '#4ade80', flatShading: true });
const rockMat = new MeshStandardMaterial({ color: '#94a3b8', flatShading: true });
const stemMat = new MeshStandardMaterial({ color: '#22c55e' });

interface TreeData {
  position: [number, number, number];
  scale: number;
  variant: 'oak' | 'pine' | 'cherry' | 'maple';
}

interface HillData {
  position: [number, number, number];
  scale: number;
  variant: 'green' | 'autumn' | 'snowy';
}

interface RockData {
  position: [number, number, number];
  scale: number;
}

interface FlowerData {
  position: [number, number, number];
  color: string;
}

/**
 * Instanced border trees - renders all border trees with a single draw call per material
 */
export const InstancedBorderTrees: React.FC<{ data: TreeData[] }> = React.memo(({ data }) => {
  const nearDataRef = useRef<TreeData[]>([]);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const accumulator = useRef(0);
  const lastCount = useRef(0);

  useFrame((_, delta) => {
    accumulator.current += delta;
    if (accumulator.current < 0.6) return;
    accumulator.current = 0;

    const player = useGameStore.getState().playerPosition;
    const near: TreeData[] = [];
    const cullDistSq = 60 * 60; // 60 units

    for (const d of data) {
      const dx = d.position[0] - player[0];
      const dz = d.position[2] - player[2];
      const distSq = dx * dx + dz * dz;
      if (distSq < cullDistSq) near.push(d);
    }

    if (near.length !== lastCount.current) {
      nearDataRef.current = near;
      lastCount.current = near.length;
      forceUpdate();
    }
  });

  // Initialize with all data on first render
  if (nearDataRef.current.length === 0 && data.length > 0) {
    nearDataRef.current = data.slice(0, 50); // Initial batch
  }

  const nearData = nearDataRef.current;

  // Separate by variant
  const oaks = nearData.filter((t) => t.variant === 'oak' || t.variant === 'maple');
  const pines = nearData.filter((t) => t.variant === 'pine');
  const cherries = nearData.filter((t) => t.variant === 'cherry');

  return (
    <group>
      {/* Trunks for all trees */}
      {nearData.length > 0 && (
        <Instances range={nearData.length} geometry={trunkGeo} material={trunkMat} castShadow>
          {nearData.map((d, i) => (
            <Instance key={`trunk-${i}`} position={d.position} scale={d.scale} />
          ))}
        </Instances>
      )}

      {/* Oak/Maple foliage (round) */}
      {oaks.length > 0 && (
        <Instances
          range={oaks.length}
          geometry={foliageSphereGeo}
          material={oaks[0]?.variant === 'maple' ? orangeFoliage : greenFoliage}
          castShadow
        >
          {oaks.map((d, i) => (
            <Instance key={`oak-${i}`} position={d.position} scale={d.scale} />
          ))}
        </Instances>
      )}

      {/* Pine foliage (cone) */}
      {pines.length > 0 && (
        <Instances range={pines.length} geometry={pineConeGeo} material={pineFoliage} castShadow>
          {pines.map((d, i) => (
            <Instance key={`pine-${i}`} position={d.position} scale={d.scale} />
          ))}
        </Instances>
      )}

      {/* Cherry foliage (pink) */}
      {cherries.length > 0 && (
        <Instances range={cherries.length} geometry={foliageSphereGeo} material={pinkFoliage} castShadow>
          {cherries.map((d, i) => (
            <Instance key={`cherry-${i}`} position={d.position} scale={d.scale} />
          ))}
        </Instances>
      )}
    </group>
  );
});

/**
 * Instanced hills - much more efficient than individual Hill components
 */
export const InstancedHills: React.FC<{ data: HillData[] }> = React.memo(({ data }) => {
  // Hills are always visible (background elements), no culling needed
  // But we simplify geometry

  const greens = data.filter((h) => h.variant === 'green' || h.variant === 'autumn');

  return (
    <group>
      {/* Hill bases */}
      <Instances range={data.length} geometry={hillBaseGeo} material={hillGreen} receiveShadow>
        {data.map((d, i) => (
          <Instance key={`hill-base-${i}`} position={d.position} scale={d.scale * 0.8} />
        ))}
      </Instances>

      {/* Hill tops (simplified - only one layer instead of 3) */}
      <Instances range={data.length} geometry={hillMidGeo} material={hillLight}>
        {data.map((d, i) => (
          <Instance key={`hill-top-${i}`} position={d.position} scale={d.scale * 0.6} />
        ))}
      </Instances>
    </group>
  );
});

/**
 * Instanced rocks
 */
export const InstancedRocks: React.FC<{ data: RockData[] }> = React.memo(({ data }) => {
  const nearDataRef = useRef<RockData[]>([]);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const accumulator = useRef(0);
  const lastCount = useRef(0);

  useFrame((_, delta) => {
    accumulator.current += delta;
    if (accumulator.current < 0.7) return;
    accumulator.current = 0;

    const player = useGameStore.getState().playerPosition;
    const near: RockData[] = [];
    const cullDistSq = 50 * 50;

    for (const d of data) {
      const dx = d.position[0] - player[0];
      const dz = d.position[2] - player[2];
      if (dx * dx + dz * dz < cullDistSq) near.push(d);
    }

    if (near.length !== lastCount.current) {
      nearDataRef.current = near;
      lastCount.current = near.length;
      forceUpdate();
    }
  });

  if (nearDataRef.current.length === 0 && data.length > 0) {
    nearDataRef.current = data;
  }

  const nearData = nearDataRef.current;

  return nearData.length > 0 ? (
    <Instances range={nearData.length} geometry={rockGeo} material={rockMat} castShadow>
      {nearData.map((d, i) => (
        <Instance key={`rock-${i}`} position={d.position} scale={d.scale} />
      ))}
    </Instances>
  ) : null;
});

/**
 * Instanced flowers - very simplified for performance
 */
export const InstancedFlowers: React.FC<{ data: FlowerData[] }> = React.memo(({ data }) => {
  const nearDataRef = useRef<FlowerData[]>([]);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const accumulator = useRef(0);
  const lastCount = useRef(0);

  useFrame((_, delta) => {
    accumulator.current += delta;
    if (accumulator.current < 0.8) return;
    accumulator.current = 0;

    const player = useGameStore.getState().playerPosition;
    const near: FlowerData[] = [];
    const cullDistSq = 30 * 30; // Flowers have short cull distance

    for (const d of data) {
      const dx = d.position[0] - player[0];
      const dz = d.position[2] - player[2];
      if (dx * dx + dz * dz < cullDistSq) near.push(d);
    }

    if (near.length !== lastCount.current) {
      nearDataRef.current = near;
      lastCount.current = near.length;
      forceUpdate();
    }
  });

  if (nearDataRef.current.length === 0 && data.length > 0) {
    nearDataRef.current = data.slice(0, 20);
  }

  const nearData = nearDataRef.current;

  // Simplify: just render stems and one petal per flower (instead of 5)
  return nearData.length > 0 ? (
    <group>
      <Instances range={nearData.length} geometry={flowerStemGeo} material={stemMat}>
        {nearData.map((d, i) => (
          <Instance key={`stem-${i}`} position={d.position} />
        ))}
      </Instances>
      <Instances range={nearData.length} geometry={flowerPetalGeo}>
        <meshStandardMaterial color="#ec4899" />
        {nearData.map((d, i) => (
          <Instance key={`petal-${i}`} position={d.position} />
        ))}
      </Instances>
    </group>
  ) : null;
});
