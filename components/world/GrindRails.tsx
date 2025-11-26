/**
 * GrindRails.tsx - Skateboard grindable rails and ramps
 * Features:
 * - Grindable rails with proximity glow
 * - Quarter pipes and half pipes
 * - Various skateable obstacles (boxes, benches, ledges)
 */

import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Cylinder } from '@react-three/drei';
import { useGameStore } from '../../store';
import { Materials } from '../../utils/materials';
import { Group } from 'three';

// ============================================
// GrindRail Component
// ============================================

interface GrindRailProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number;
}

export const GrindRail: React.FC<GrindRailProps> = ({
  position,
  rotation = [0, 0, 0],
  length = 3
}) => {
  const glowRef = useRef<Group>(null);
  const [isNearby, setIsNearby] = useState(false);

  const playerPosition = useGameStore((s) => s.playerPosition);
  const isDriving = useGameStore((s) => s.isDriving);
  const vehicleType = useGameStore((s) => s.vehicleType);

  // Check proximity for glow effect
  useFrame(() => {
    if (!isDriving || vehicleType !== 'skateboard') {
      if (isNearby) setIsNearby(false);
      return;
    }

    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    const nowNearby = distance < 3;
    if (nowNearby !== isNearby) {
      setIsNearby(nowNearby);
    }

    // Pulse glow when nearby
    if (glowRef.current && isNearby) {
      const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Rail supports */}
      <RigidBody type="fixed" colliders="cuboid" friction={0.2}>
        {/* Left support */}
        <Box args={[0.08, 0.6, 0.08]} position={[-length / 2, 0.3, 0]} castShadow material={Materials.Metal} />
        {/* Right support */}
        <Box args={[0.08, 0.6, 0.08]} position={[length / 2, 0.3, 0]} castShadow material={Materials.Metal} />
      </RigidBody>

      {/* Grindable rail (cylindrical) */}
      <RigidBody type="fixed" colliders={false} friction={0.05}>
        <CuboidCollider args={[length / 2, 0.025, 0.025]} position={[0, 0.65, 0]} sensor />
        <Cylinder args={[0.025, 0.025, length, 16]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.65, 0]} castShadow>
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </Cylinder>
      </RigidBody>

      {/* Glow effect when nearby on skateboard */}
      {isNearby && (
        <group ref={glowRef}>
          <Cylinder
            args={[0.08, 0.08, length, 16]}
            rotation={[0, 0, Math.PI / 2]}
            position={[0, 0.65, 0]}
          >
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} />
          </Cylinder>
        </group>
      )}
    </group>
  );
};

// ============================================
// GrindRamp Component (Quarter Pipe / Half Pipe)
// ============================================

interface GrindRampProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: 'small' | 'medium' | 'large';
  type?: 'quarter' | 'half';
}

export const GrindRamp: React.FC<GrindRampProps> = ({
  position,
  rotation = [0, 0, 0],
  size = 'medium',
  type = 'quarter'
}) => {
  // Size configurations
  const sizes = {
    small: { width: 2, height: 1, depth: 1.5 },
    medium: { width: 3, height: 1.5, depth: 2 },
    large: { width: 4, height: 2, depth: 2.5 },
  };

  const { width, height, depth } = sizes[size];

  return (
    <group position={position} rotation={rotation}>
      {/* Main ramp surface */}
      <RigidBody type="fixed" colliders="hull" friction={0.3}>
        <group>
          {/* Ramp angle surface */}
          <Box
            args={[width, 0.1, depth]}
            position={[0, height / 2, -depth / 4]}
            rotation={[-Math.PI / 4, 0, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#666666" roughness={0.8} />
          </Box>

          {/* Base platform */}
          <Box
            args={[width, 0.1, depth / 2]}
            position={[0, 0.05, depth / 4]}
            receiveShadow
          >
            <meshStandardMaterial color="#444444" roughness={0.9} />
          </Box>

          {/* Side supports */}
          <Box args={[0.1, height, depth]} position={[-width / 2 - 0.05, height / 2, 0]} castShadow material={Materials.Brown} />
          <Box args={[0.1, height, depth]} position={[width / 2 + 0.05, height / 2, 0]} castShadow material={Materials.Brown} />

          {/* Back wall (for quarter pipe) */}
          {type === 'quarter' && (
            <Box
              args={[width, height, 0.1]}
              position={[0, height / 2, -depth / 2 - 0.05]}
              castShadow
            >
              <meshStandardMaterial color="#555555" roughness={0.7} />
            </Box>
          )}

          {/* Second ramp for half pipe */}
          {type === 'half' && (
            <Box
              args={[width, 0.1, depth]}
              position={[0, height / 2, depth * 0.75]}
              rotation={[Math.PI / 4, 0, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#666666" roughness={0.8} />
            </Box>
          )}
        </group>
      </RigidBody>

      {/* Coping (grindable edge) */}
      <RigidBody type="fixed" colliders={false} friction={0.05}>
        <CuboidCollider args={[width / 2, 0.03, 0.03]} position={[0, height, -depth / 2]} sensor />
        <Cylinder
          args={[0.03, 0.03, width, 16]}
          rotation={[0, 0, Math.PI / 2]}
          position={[0, height, -depth / 2]}
          castShadow
        >
          <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
        </Cylinder>
      </RigidBody>
    </group>
  );
};

// ============================================
// SkateObstacle Component (Boxes, Benches, Ledges)
// ============================================

interface SkateObstacleProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  type?: 'box' | 'bench' | 'ledge' | 'pyramid';
}

export const SkateObstacle: React.FC<SkateObstacleProps> = ({
  position,
  rotation = [0, 0, 0],
  type = 'box'
}) => {
  const renderObstacle = () => {
    switch (type) {
      case 'box':
        return (
          <RigidBody type="fixed" colliders="cuboid" friction={0.4}>
            <Box args={[1.5, 0.8, 1.5]} position={[0, 0.4, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Box>
            {/* Grindable edges */}
            <RigidBody type="fixed" colliders={false} friction={0.1}>
              <CuboidCollider args={[0.75, 0.03, 0.03]} position={[0, 0.82, 0.75]} sensor />
              <Cylinder args={[0.03, 0.03, 1.5, 8]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.82, 0.75]}>
                <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.3} />
              </Cylinder>
            </RigidBody>
          </RigidBody>
        );

      case 'bench':
        return (
          <group>
            {/* Seat */}
            <RigidBody type="fixed" colliders="cuboid" friction={0.3}>
              <Box args={[2, 0.15, 0.5]} position={[0, 0.5, 0]} castShadow receiveShadow material={Materials.Brown} />
            </RigidBody>
            {/* Grindable edge */}
            <RigidBody type="fixed" colliders={false} friction={0.05}>
              <CuboidCollider args={[1, 0.025, 0.025]} position={[0, 0.575, 0.25]} sensor />
              <Cylinder args={[0.025, 0.025, 2, 12]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.575, 0.25]}>
                <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.2} />
              </Cylinder>
            </RigidBody>
            {/* Legs */}
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
              <Box args={[0.1, 0.5, 0.1]} position={[-0.8, 0.25, -0.15]} material={Materials.Metal} />
              <Box args={[0.1, 0.5, 0.1]} position={[0.8, 0.25, -0.15]} material={Materials.Metal} />
            </RigidBody>
          </group>
        );

      case 'ledge':
        return (
          <group>
            <RigidBody type="fixed" colliders="cuboid" friction={0.4}>
              <Box args={[3, 0.3, 0.6]} position={[0, 0.4, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#cccccc" roughness={0.6} />
              </Box>
            </RigidBody>
            {/* Grindable top edge */}
            <RigidBody type="fixed" colliders={false} friction={0.05}>
              <CuboidCollider args={[1.5, 0.03, 0.03]} position={[0, 0.56, 0.3]} sensor />
              <Cylinder args={[0.03, 0.03, 3, 12]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.56, 0.3]}>
                <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.15} />
              </Cylinder>
            </RigidBody>
            {/* Support wall */}
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
              <Box args={[3, 0.35, 0.1]} position={[0, 0.175, -0.25]} material={Materials.Stone} />
            </RigidBody>
          </group>
        );

      case 'pyramid':
        return (
          <RigidBody type="fixed" colliders="hull" friction={0.5}>
            <group>
              {/* Bottom layer */}
              <Box args={[2, 0.3, 2]} position={[0, 0.15, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#8b7355" roughness={0.8} />
              </Box>
              {/* Middle layer */}
              <Box args={[1.5, 0.3, 1.5]} position={[0, 0.45, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#9b8365" roughness={0.8} />
              </Box>
              {/* Top layer */}
              <Box args={[1, 0.3, 1]} position={[0, 0.75, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#ab9375" roughness={0.8} />
              </Box>
            </group>
          </RigidBody>
        );

      default:
        return null;
    }
  };

  return (
    <group position={position} rotation={rotation}>
      {renderObstacle()}
    </group>
  );
};
