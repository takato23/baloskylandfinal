/**
 * Skateboard Visual Effects System
 * High-performance effects using instanced rendering and object pooling
 */

import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color, Vector3 } from 'three';

// ============================================
// Constants
// ============================================

const EFFECTS = {
  // Speed lines
  SPEEDLINES_COUNT: 20,
  SPEEDLINES_MIN_SPEED: 8, // Show when going fast
  SPEEDLINES_LENGTH: 2,
  SPEEDLINES_SPREAD: 3,

  // Dust particles
  DUST_POOL_SIZE: 30,
  DUST_PARTICLE_LIFETIME: 0.6,
  DUST_SPAWN_RATE: 0.05, // Seconds between spawns when conditions met
  DUST_MIN_SPEED: 3,

  // Trail marks
  TRAIL_POOL_SIZE: 50,
  TRAIL_FADE_TIME: 3,
  TRAIL_SPAWN_RATE: 0.03,

  // Trick popup
  POPUP_DURATION: 1.2,
  POPUP_RISE_SPEED: 2,
  COMBO_WINDOW: 2.0, // Seconds to chain tricks
};

// ============================================
// Speed Lines Component
// ============================================

interface SpeedLinesProps {
  speed: number;
  position: [number, number, number];
  rotation: number;
}

export const SpeedLines: React.FC<SpeedLinesProps> = ({ speed, position, rotation }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const lineData = useMemo(() =>
    Array.from({ length: EFFECTS.SPEEDLINES_COUNT }, () => ({
      offset: Math.random() * Math.PI * 2,
      radius: 1 + Math.random() * EFFECTS.SPEEDLINES_SPREAD,
      z: -2 - Math.random() * 4,
      speed: 0.5 + Math.random() * 0.5,
    })),
    []
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const speedRatio = Math.max(0, Math.min(1, (speed - EFFECTS.SPEEDLINES_MIN_SPEED) / 10));
    const visible = speed > EFFECTS.SPEEDLINES_MIN_SPEED;

    if (!visible) {
      meshRef.current.count = 0;
      return;
    }

    meshRef.current.count = EFFECTS.SPEEDLINES_COUNT;

    lineData.forEach((line, i) => {
      // Move line backward relative to player direction
      line.z += (15 + speed * 2) * delta * line.speed;

      // Reset when too far
      if (line.z > 1) {
        line.z = -6;
        line.offset = Math.random() * Math.PI * 2;
      }

      // Position around player
      const angle = rotation + line.offset;
      const x = position[0] + Math.cos(angle) * line.radius;
      const y = position[1] + 0.2 + Math.random() * 0.3;
      const z = position[2] + Math.sin(angle) * line.radius + line.z;

      tempObject.position.set(x, y, z);
      tempObject.rotation.y = rotation;
      tempObject.scale.set(
        0.02,
        0.02,
        EFFECTS.SPEEDLINES_LENGTH * (1 + speedRatio * 0.5)
      );

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, EFFECTS.SPEEDLINES_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
    </instancedMesh>
  );
};

// ============================================
// Dust Particles Component
// ============================================

interface Particle {
  active: boolean;
  position: Vector3;
  velocity: Vector3;
  lifetime: number;
  maxLifetime: number;
  size: number;
}

interface DustParticlesProps {
  position: [number, number, number];
  velocity: [number, number, number];
  isGrounded: boolean;
  isBraking: boolean;
  justLanded: boolean;
}

export const DustParticles: React.FC<DustParticlesProps> = ({
  position,
  velocity,
  isGrounded,
  isBraking,
  justLanded,
}) => {
  const meshRef = useRef<InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);
  const tempObject = useMemo(() => new Object3D(), []);
  const spawnTimer = useRef(0);

  // Initialize particle pool
  useMemo(() => {
    particlesRef.current = Array.from({ length: EFFECTS.DUST_POOL_SIZE }, () => ({
      active: false,
      position: new Vector3(),
      velocity: new Vector3(),
      lifetime: 0,
      maxLifetime: EFFECTS.DUST_PARTICLE_LIFETIME,
      size: 0.1 + Math.random() * 0.1,
    }));
  }, []);

  const spawnParticle = useCallback((pos: [number, number, number], vel: [number, number, number], burst = false) => {
    const particle = particlesRef.current.find(p => !p.active);
    if (!particle) return;

    const count = burst ? 5 : 1;
    for (let i = 0; i < count; i++) {
      const p = particlesRef.current.find(p => !p.active);
      if (!p) break;

      const spread = burst ? 0.5 : 0.2;
      p.active = true;
      p.position.set(
        pos[0] + (Math.random() - 0.5) * spread,
        pos[1] + 0.05,
        pos[2] + (Math.random() - 0.5) * spread
      );

      const velMagnitude = burst ? 2 : 0.5;
      p.velocity.set(
        vel[0] * -0.2 + (Math.random() - 0.5) * velMagnitude,
        0.5 + Math.random() * 1,
        vel[2] * -0.2 + (Math.random() - 0.5) * velMagnitude
      );

      p.lifetime = 0;
      p.maxLifetime = EFFECTS.DUST_PARTICLE_LIFETIME * (0.8 + Math.random() * 0.4);
    }
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const speed = Math.sqrt(velocity[0] ** 2 + velocity[2] ** 2);

    // Spawn conditions
    spawnTimer.current += delta;

    // Landing burst
    if (justLanded) {
      spawnParticle(position, velocity, true);
    }

    // Braking trail
    if (isBraking && speed > EFFECTS.DUST_MIN_SPEED && spawnTimer.current > EFFECTS.DUST_SPAWN_RATE) {
      spawnParticle(position, velocity, false);
      spawnTimer.current = 0;
    }

    // Update particles
    let activeCount = 0;
    particlesRef.current.forEach((particle, i) => {
      if (!particle.active) return;

      particle.lifetime += delta;
      if (particle.lifetime >= particle.maxLifetime) {
        particle.active = false;
        return;
      }

      // Physics
      particle.velocity.y -= 3 * delta; // Gravity
      particle.velocity.multiplyScalar(0.95); // Friction
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));

      // Render
      const alpha = 1 - (particle.lifetime / particle.maxLifetime);
      tempObject.position.copy(particle.position);
      tempObject.scale.setScalar(particle.size * alpha);
      tempObject.updateMatrix();

      meshRef.current.setMatrixAt(activeCount, tempObject.matrix);
      meshRef.current.setColorAt(activeCount, new Color(0.6, 0.5, 0.4).multiplyScalar(alpha));
      activeCount++;
    });

    meshRef.current.count = activeCount;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, EFFECTS.DUST_POOL_SIZE]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.6} />
    </instancedMesh>
  );
};

// ============================================
// Trick Popup Component
// ============================================

interface TrickPopupProps {
  visible: boolean;
  trickName: string;
  comboCount: number;
  onComplete: () => void;
}

export const TrickPopup: React.FC<TrickPopupProps> = ({
  visible,
  trickName,
  comboCount,
  onComplete,
}) => {
  const [display, setDisplay] = useState(false);
  const lifetime = useRef(0);
  const yOffset = useRef(0);

  useFrame((_, delta) => {
    if (visible && !display) {
      setDisplay(true);
      lifetime.current = 0;
      yOffset.current = 0;
    }

    if (display) {
      lifetime.current += delta;
      yOffset.current += EFFECTS.POPUP_RISE_SPEED * delta;

      if (lifetime.current >= EFFECTS.POPUP_DURATION) {
        setDisplay(false);
        onComplete();
      }
    }
  });

  if (!display) return null;

  const alpha = 1 - Math.min(1, lifetime.current / EFFECTS.POPUP_DURATION);
  const scale = 1 + (1 - alpha) * 0.3; // Pop effect

  return (
    <group>
      <mesh position={[0, 2 + yOffset.current, -5]} scale={scale}>
        {/* Shadow/outline */}
        <textGeometry args={[trickName, { size: 0.5, height: 0.05 }]} />
        <meshBasicMaterial color="#000000" opacity={alpha * 0.5} transparent />
      </mesh>

      <mesh position={[0.02, 2.02 + yOffset.current, -4.98]} scale={scale}>
        <textGeometry args={[trickName, { size: 0.5, height: 0.05 }]} />
        <meshBasicMaterial
          color={comboCount > 1 ? "#ffaa00" : "#ffffff"}
          opacity={alpha}
          transparent
        />
      </mesh>

      {comboCount > 1 && (
        <mesh position={[2, 1.5 + yOffset.current, -5]} scale={scale * 0.7}>
          <textGeometry args={[`x${comboCount}`, { size: 0.4, height: 0.03 }]} />
          <meshBasicMaterial color="#ffaa00" opacity={alpha} transparent />
        </mesh>
      )}
    </group>
  );
};

// ============================================
// Skate Trail Component
// ============================================

interface TrailMark {
  active: boolean;
  position: Vector3;
  rotation: number;
  lifetime: number;
}

interface SkateTrailProps {
  position: [number, number, number];
  rotation: number;
  speed: number;
  isGrounded: boolean;
}

export const SkateTrail: React.FC<SkateTrailProps> = ({
  position,
  rotation,
  speed,
  isGrounded,
}) => {
  const meshRef = useRef<InstancedMesh>(null);
  const marksRef = useRef<TrailMark[]>([]);
  const tempObject = useMemo(() => new Object3D(), []);
  const spawnTimer = useRef(0);

  // Initialize trail pool
  useMemo(() => {
    marksRef.current = Array.from({ length: EFFECTS.TRAIL_POOL_SIZE }, () => ({
      active: false,
      position: new Vector3(),
      rotation: 0,
      lifetime: 0,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Spawn trail marks when moving
    if (isGrounded && speed > 1) {
      spawnTimer.current += delta;

      if (spawnTimer.current > EFFECTS.TRAIL_SPAWN_RATE) {
        const mark = marksRef.current.find(m => !m.active);
        if (mark) {
          mark.active = true;
          mark.position.set(position[0], position[1] + 0.01, position[2]);
          mark.rotation = rotation;
          mark.lifetime = 0;
        }
        spawnTimer.current = 0;
      }
    }

    // Update marks
    let activeCount = 0;
    marksRef.current.forEach((mark, i) => {
      if (!mark.active) return;

      mark.lifetime += delta;
      if (mark.lifetime >= EFFECTS.TRAIL_FADE_TIME) {
        mark.active = false;
        return;
      }

      const alpha = 1 - (mark.lifetime / EFFECTS.TRAIL_FADE_TIME);

      tempObject.position.copy(mark.position);
      tempObject.rotation.y = mark.rotation;
      tempObject.scale.set(0.15, 0.01, 0.4);
      tempObject.updateMatrix();

      meshRef.current.setMatrixAt(activeCount, tempObject.matrix);
      meshRef.current.setColorAt(activeCount, new Color(0.1, 0.1, 0.1).multiplyScalar(alpha * 0.3));
      activeCount++;
    });

    meshRef.current.count = activeCount;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, EFFECTS.TRAIL_POOL_SIZE]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.8} depthWrite={false} />
    </instancedMesh>
  );
};

// ============================================
// Combo System Hook
// ============================================

export const useComboSystem = () => {
  const [currentTrick, setCurrentTrick] = useState('');
  const [comboCount, setComboCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const lastTrickTime = useRef(0);

  const registerTrick = useCallback((trickName: string) => {
    const now = Date.now() / 1000;

    if (now - lastTrickTime.current < EFFECTS.COMBO_WINDOW) {
      // Combo!
      setComboCount(prev => prev + 1);
    } else {
      // New combo
      setComboCount(1);
    }

    setCurrentTrick(trickName);
    setShowPopup(true);
    lastTrickTime.current = now;
  }, []);

  const resetCombo = useCallback(() => {
    setShowPopup(false);
  }, []);

  return {
    currentTrick,
    comboCount,
    showPopup,
    registerTrick,
    resetCombo,
  };
};
