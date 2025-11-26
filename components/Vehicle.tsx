/**
 * Vehicle System - Skateboard
 * Complete skateboard experience with physics, tricks, and visual effects
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider, CuboidCollider } from '@react-three/rapier';
import { Box, Cylinder, useKeyboardControls, Html } from '@react-three/drei';
import { Vector3, MathUtils, Quaternion, Group } from 'three';
import { useGameStore, Controls } from '../store';
import { playSound, updateListener, createCarEngineSound } from '../utils/audio';
import { CharacterModel } from './player/CharacterModel';

// ============================================
// Constants
// ============================================

const SKATEBOARD = {
  // Movement
  PUSH_FORCE: 6,            // Force per push (balanced)
  MAX_SPEED: 12,            // Maximum speed (realistic)
  FRICTION: 0.985,          // Ground friction (per frame)
  AIR_FRICTION: 0.997,      // Air friction
  BRAKE_FRICTION: 0.92,     // When braking

  // Turning
  TURN_SPEED: 3.5,          // Base turn rate
  TURN_SPEED_FACTOR: 0.15,  // How much speed affects turning

  // Simple jump - same as walking
  JUMP_VELOCITY: 10,        // Simple jump velocity

  // Camera
  CAM_HEIGHT: 4,
  CAM_DISTANCE: 7,
  CAM_LERP: 4,

  // Timers
  PUSH_COOLDOWN: 0.25,      // Faster pushing
  DISMOUNT_DELAY: 0.3,
  JUMP_COOLDOWN: 0.15,      // Short cooldown for responsive jumping

  // Physics
  MASS: 3,                  // Lighter mass for easier curb climbing
};

// ============================================
// Skateboard Visual Model
// ============================================

interface SkateboardModelProps {
  wheelSpeed: number;
}

const SkateboardModel: React.FC<SkateboardModelProps> = ({ wheelSpeed }) => {
  const wheelsRef = useRef<Group[]>([]);

  useFrame((_, delta) => {
    // Rotate wheels based on speed
    wheelsRef.current.forEach(wheel => {
      if (wheel) {
        wheel.rotation.x += wheelSpeed * delta * 10;
      }
    });
  });

  return (
    <group>
      {/* Deck */}
      <group>
        <Box args={[0.22, 0.018, 0.85]} position={[0, 0.075, 0]} castShadow>
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </Box>

        {/* Grip tape */}
        <Box args={[0.2, 0.003, 0.8]} position={[0, 0.087, 0]}>
          <meshStandardMaterial color="#1a1a1a" roughness={1} />
        </Box>

        {/* Nose kick */}
        <Box args={[0.18, 0.018, 0.12]} position={[0, 0.095, 0.42]} rotation={[0.35, 0, 0]}>
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </Box>

        {/* Tail kick */}
        <Box args={[0.18, 0.018, 0.12]} position={[0, 0.095, -0.42]} rotation={[-0.35, 0, 0]}>
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </Box>

        {/* Side graphics */}
        <Box args={[0.005, 0.016, 0.6]} position={[0.11, 0.075, 0]}>
          <meshStandardMaterial color="#ff6b35" />
        </Box>
        <Box args={[0.005, 0.016, 0.6]} position={[-0.11, 0.075, 0]}>
          <meshStandardMaterial color="#ff6b35" />
        </Box>
      </group>

      {/* Front truck */}
      <group position={[0, 0.035, 0.28]}>
        <Box args={[0.2, 0.015, 0.035]}>
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </Box>
        <Box args={[0.04, 0.025, 0.025]} position={[0, -0.01, 0]}>
          <meshStandardMaterial color="#666" metalness={0.9} roughness={0.3} />
        </Box>
      </group>

      {/* Back truck */}
      <group position={[0, 0.035, -0.28]}>
        <Box args={[0.2, 0.015, 0.035]}>
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </Box>
        <Box args={[0.04, 0.025, 0.025]} position={[0, -0.01, 0]}>
          <meshStandardMaterial color="#666" metalness={0.9} roughness={0.3} />
        </Box>
      </group>

      {/* Wheels */}
      {[
        [0.1, 0.025, 0.28],
        [-0.1, 0.025, 0.28],
        [0.1, 0.025, -0.28],
        [-0.1, 0.025, -0.28],
      ].map((pos, i) => (
        <group
          key={i}
          position={pos as [number, number, number]}
          rotation={[0, 0, Math.PI / 2]}
          ref={(el) => { if (el) wheelsRef.current[i] = el; }}
        >
          <Cylinder args={[0.028, 0.028, 0.022, 16]}>
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
          </Cylinder>
          {/* Wheel core */}
          <Cylinder args={[0.012, 0.012, 0.024, 8]}>
            <meshStandardMaterial color="#ff4444" />
          </Cylinder>
        </group>
      ))}

    </group>
  );
};

// ============================================
// Reusable Vector Objects (avoid GC)
// ============================================

const _forward = new Vector3();
const _velocity = new Vector3();
const _camTarget = new Vector3();
const _camPos = new Vector3();
const _axis = new Vector3(0, 1, 0);

// ============================================
// Main Skateboard Component (Simplified)
// ============================================

export const Skateboard: React.FC = () => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const meshGroup = useRef<Group>(null);
  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();

  // Store state
  const isDriving = useGameStore((s) => s.isDriving);
  const vehicleType = useGameStore((s) => s.vehicleType);
  const setDriving = useGameStore((s) => s.setDriving);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const setSkateboardSpeed = useGameStore((s) => s.setSkateboardSpeed);
  const character = useGameStore((s) => s.character);

  // Local state for rendering
  const [speed, setSpeed] = useState(0);
  const [isGrounded, setIsGrounded] = useState(true);

  // Physics refs
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const pushTimerRef = useRef(0);
  const jumpTimerRef = useRef(0);
  const dismountTimerRef = useRef(SKATEBOARD.DISMOUNT_DELAY);
  const lastPushTimeRef = useRef(0);
  const wasGroundedRef = useRef(true);
  const jumpPressedRef = useRef(false);

  const isActive = isDriving && vehicleType === 'skateboard';

  // Initialize position when mounting
  useEffect(() => {
    if (isActive && rigidBody.current) {
      const playerPos = useGameStore.getState().playerPosition;
      const x = Number.isFinite(playerPos[0]) ? playerPos[0] : 0;
      const y = (Number.isFinite(playerPos[1]) ? playerPos[1] : 0) + 0.5;
      const z = Number.isFinite(playerPos[2]) ? playerPos[2] : 0;

      rigidBody.current.setTranslation({ x, y, z }, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.wakeUp();

      velocityRef.current = 0;
      rotationRef.current = 0;
      dismountTimerRef.current = SKATEBOARD.DISMOUNT_DELAY;

      playSound('jump');
    }
  }, [isActive]);

  // Simple jump - same as walking
  const doJump = useCallback(() => {
    if (!rigidBody.current) return;

    rigidBody.current.wakeUp();
    const currentVel = rigidBody.current.linvel();

    // Simple jump - set vertical velocity directly
    rigidBody.current.setLinvel(
      { x: currentVel.x, y: SKATEBOARD.JUMP_VELOCITY, z: currentVel.z },
      true
    );

    jumpTimerRef.current = SKATEBOARD.JUMP_COOLDOWN;
    setIsGrounded(false);
    playSound('jump');
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    // Hide when not active
    if (!isActive) {
      if (rigidBody.current) {
        const pos = rigidBody.current.translation();
        if (pos.y > -50) {
          rigidBody.current.setTranslation({ x: 0, y: -100, z: 0 }, true);
          rigidBody.current.sleep();
        }
      }
      return;
    }

    if (!rigidBody.current) return;

    // Get current state
    const pos = rigidBody.current.translation();
    const vel = rigidBody.current.linvel();

    // Safety check
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z) || pos.y < -20) {
      rigidBody.current.setTranslation({ x: 0, y: 2, z: 0 }, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      velocityRef.current = 0;
      return;
    }

    // Update store position
    setPlayerPosition([pos.x, pos.y, pos.z]);
    setSkateboardSpeed(velocityRef.current);

    // Update audio listener
    camera.getWorldDirection(_forward);
    updateListener([pos.x, pos.y, pos.z], [_forward.x, _forward.y, _forward.z], [0, 1, 0]);

    // Get input
    const keys = getKeys();
    const mobile = useGameStore.getState().mobileInput;

    const wantForward = keys[Controls.forward] || (mobile.joystick.active && mobile.joystick.y < -0.3);
    const wantBackward = keys[Controls.backward] || (mobile.joystick.active && mobile.joystick.y > 0.3);
    const wantLeft = keys[Controls.left] || (mobile.joystick.active && mobile.joystick.x < -0.3);
    const wantRight = keys[Controls.right] || (mobile.joystick.active && mobile.joystick.x > 0.3);
    const wantJump = keys[Controls.jump] || mobile.buttons.jump;
    const wantDismount = keys[Controls.interact] || mobile.buttons.interact;

    // Update timers
    pushTimerRef.current = Math.max(0, pushTimerRef.current - dt);
    jumpTimerRef.current = Math.max(0, jumpTimerRef.current - dt);
    dismountTimerRef.current = Math.max(0, dismountTimerRef.current - dt);

    // Ground detection - more forgiving
    const grounded = Math.abs(vel.y) < 1.5;

    // Landing detection
    if (!wasGroundedRef.current && grounded) {
      playSound('step'); // Landing sound
    }
    wasGroundedRef.current = grounded;
    setIsGrounded(grounded);

    // Reset jump timer when grounded
    if (grounded && jumpTimerRef.current > 0) {
      jumpTimerRef.current = Math.max(0, jumpTimerRef.current - dt * 3); // Faster reset when grounded
    }

    // Dismount
    if (wantDismount && dismountTimerRef.current <= 0) {
      setDriving(false);
      playSound('jump');
      return;
    }

    // Turning
    const turnInput = (wantLeft ? 1 : 0) - (wantRight ? 1 : 0);
    if (turnInput !== 0 && velocityRef.current > 0.5) {
      const speedFactor = 1 - Math.min(velocityRef.current / SKATEBOARD.MAX_SPEED, 0.7) * SKATEBOARD.TURN_SPEED_FACTOR;
      rotationRef.current += turnInput * SKATEBOARD.TURN_SPEED * speedFactor * dt;
    }

    // Pushing
    if (wantForward && pushTimerRef.current <= 0 && grounded) {
      const pushIncrement = SKATEBOARD.PUSH_FORCE * dt * 60;
      velocityRef.current = Math.min(velocityRef.current + pushIncrement, SKATEBOARD.MAX_SPEED);
      pushTimerRef.current = SKATEBOARD.PUSH_COOLDOWN;

      if (state.clock.elapsedTime - lastPushTimeRef.current > 0.25) {
        playSound('step');
        lastPushTimeRef.current = state.clock.elapsedTime;
      }
    }

    // Braking
    if (wantBackward && grounded) {
      velocityRef.current *= SKATEBOARD.BRAKE_FRICTION;
      if (velocityRef.current < 0.1) velocityRef.current = 0;
    }

    // Simple jump - only on press, not hold
    if (wantJump && !jumpPressedRef.current && grounded) {
      jumpPressedRef.current = true;
      doJump();
    }
    if (!wantJump) {
      jumpPressedRef.current = false;
    }

    // Apply friction
    const friction = grounded ? SKATEBOARD.FRICTION : SKATEBOARD.AIR_FRICTION;
    velocityRef.current *= friction;
    if (velocityRef.current < 0.05) velocityRef.current = 0;

    // Apply velocity
    _forward.set(0, 0, -1).applyAxisAngle(_axis, rotationRef.current);
    _velocity.copy(_forward).multiplyScalar(velocityRef.current);

    rigidBody.current.setLinvel({ x: _velocity.x, y: vel.y, z: _velocity.z }, true);

    // Update visual state
    setSpeed(velocityRef.current);

    // Visual rotation
    if (meshGroup.current) {
      meshGroup.current.rotation.y = rotationRef.current;

      // Lean into turns
      const leanAmount = turnInput * Math.min(velocityRef.current / 10, 1) * 0.25;
      meshGroup.current.rotation.z = MathUtils.lerp(meshGroup.current.rotation.z, leanAmount, 0.15);

      // Forward lean when accelerating
      const pushLean = wantForward && grounded ? 0.1 : 0;
      meshGroup.current.rotation.x = MathUtils.lerp(meshGroup.current.rotation.x, pushLean, 0.1);
    }

    // Camera
    _forward.set(0, 0, 1).applyAxisAngle(_axis, rotationRef.current);

    const camDist = SKATEBOARD.CAM_DISTANCE + velocityRef.current * 0.1;
    const camHeight = SKATEBOARD.CAM_HEIGHT;

    _camPos.set(
      pos.x + _forward.x * camDist,
      pos.y + camHeight,
      pos.z + _forward.z * camDist
    );

    const lerpFactor = 1 - Math.exp(-SKATEBOARD.CAM_LERP * dt);
    camera.position.lerp(_camPos, lerpFactor);

    _camTarget.set(pos.x, pos.y + 0.8, pos.z);
    camera.lookAt(_camTarget);
  });

  return (
    <>
      <RigidBody
        ref={rigidBody}
        type="dynamic"
        colliders={false}
        position={[0, -100, 0]}
        mass={SKATEBOARD.MASS}
        friction={0.2}
        restitution={0}
        linearDamping={0.1}
        angularDamping={2}
        lockRotations
        ccd
        enabledRotations={[false, false, false]}
      >
        {/* Capsule collider - slides over curbs smoothly */}
        <CapsuleCollider args={[0.15, 0.25]} position={[0, 0.3, 0]} friction={0.1} />

        <group ref={meshGroup}>
          <SkateboardModel wheelSpeed={speed} />

          {/* Character on skateboard */}
          {isActive && (
            <group position={[0, 0.1, 0.05]} rotation={[0, Math.PI / 2, 0]}>
              <CharacterModel
                isMoving={speed > 1}
                run={false}
                isSitting={false}
                isGrounded={isGrounded}
                skin={character.skin}
                shirt={character.shirt}
                pants={character.pants}
                type={character.type}
                accessory={character.accessory}
              />
            </group>
          )}
        </group>
      </RigidBody>
    </>
  );
};

// ============================================
// World Skateboard (Pickup)
// ============================================

interface WorldSkateboardProps {
  position: [number, number, number];
}

export const WorldSkateboard: React.FC<WorldSkateboardProps> = ({ position }) => {
  const meshRef = useRef<Group>(null);
  const [isNearby, setIsNearby] = useState(false);
  const glowRef = useRef(0);

  const isDriving = useGameStore((s) => s.isDriving);
  const setDriving = useGameStore((s) => s.setDriving);
  const setInteractionLabel = useGameStore((s) => s.setInteractionLabel);
  const playerPosition = useGameStore((s) => s.playerPosition);

  useFrame((_, delta) => {
    if (isDriving) {
      if (isNearby) {
        setIsNearby(false);
        setInteractionLabel(null);
      }
      return;
    }

    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    const nowNearby = distance < 2;

    if (nowNearby !== isNearby) {
      setIsNearby(nowNearby);
      setInteractionLabel(nowNearby ? 'Subir al skateboard' : null);
    }

    // Hover and rotate animation
    if (meshRef.current) {
      meshRef.current.position.y = 0.1 + Math.sin(Date.now() * 0.003) * 0.05;
      meshRef.current.rotation.y += delta * 0.5;
    }

    // Glow pulse
    glowRef.current = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
  });

  // Handle keyboard interaction
  useEffect(() => {
    if (!isNearby || isDriving) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' || e.code === 'Enter') {
        setDriving(true, 'skateboard');
        setInteractionLabel(null);
        playSound('jump');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNearby, isDriving, setDriving, setInteractionLabel]);

  if (isDriving) return null;

  return (
    <group position={position}>
      <group ref={meshRef}>
        <SkateboardModel wheelSpeed={0} />
      </group>

      {/* Glow ring when nearby */}
      {isNearby && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 32]} />
          <meshBasicMaterial
            color="#ffaa00"
            transparent
            opacity={glowRef.current * 0.6}
          />
        </mesh>
      )}

      {/* Pickup sparkle */}
      <pointLight
        position={[0, 0.3, 0]}
        color="#ffdd88"
        intensity={isNearby ? 1.5 : 0.5}
        distance={2}
      />
    </group>
  );
};

// ============================================
// NPC Car
// ============================================

const _npcCarQ = new Quaternion();
const _npcCarAxis = new Vector3(0, 1, 0);

// Shared registry so NPC cars can keep distance without heavy physics queries
type NPCCarLane = { id: string; laneAxis: 'x' | 'z'; lanePos: number; direction: 1 | -1; speedRef: React.MutableRefObject<number>; getPos: () => { x: number; y: number; z: number } | null; };
const npcCarRegistry: NPCCarLane[] = [];

// Keep these in sync with world grid layout (see World.tsx)
const NPC_BLOCK_SIZE = 10;
const NPC_SIDEWALK_WIDTH = 1.5;
const NPC_STREET_WIDTH = 6;
const NPC_CELL_SIZE = NPC_BLOCK_SIZE + NPC_SIDEWALK_WIDTH * 2 + NPC_STREET_WIDTH; // 19
const NPC_RANGE = 2; // GRID_SIZE / 2
const NPC_INTERSECTIONS = Array.from({ length: NPC_RANGE * 2 + 1 }, (_, i) => (i - NPC_RANGE) * NPC_CELL_SIZE);

interface NPCCarProps {
  laneAxis: 'x' | 'z';
  lanePos: number;
  startOffset: number;
  direction: 1 | -1;
  color: string;
}

const CarBodyModel: React.FC<{ color: string; isBraking?: boolean; isNight?: boolean }> = React.memo(({ color, isBraking = false, isNight = false }) => (
  <group>
    {/* Main body */}
    <Box args={[1.8, 0.5, 3.5]} position={[0, 0.5, 0]} castShadow>
      <meshStandardMaterial color={color} />
    </Box>
    {/* Cabin */}
    <Box args={[1.6, 0.6, 2]} position={[0, 1.0, -0.2]} castShadow>
      <meshStandardMaterial color={color} />
    </Box>
    {/* Windows */}
    <Box args={[1.62, 0.5, 1.8]} position={[0, 1.0, -0.2]}>
      <meshStandardMaterial color="#81d4fa" transparent opacity={0.7} />
    </Box>

    {/* Headlights */}
    <Box args={[0.25, 0.15, 0.05]} position={[-0.6, 0.45, 1.78]}>
      <meshStandardMaterial
        color={isNight ? "#ffffcc" : "#ffffff"}
        emissive={isNight ? "#ffff88" : "#ffffff"}
        emissiveIntensity={isNight ? 2 : 0.3}
      />
    </Box>
    <Box args={[0.25, 0.15, 0.05]} position={[0.6, 0.45, 1.78]}>
      <meshStandardMaterial
        color={isNight ? "#ffffcc" : "#ffffff"}
        emissive={isNight ? "#ffff88" : "#ffffff"}
        emissiveIntensity={isNight ? 2 : 0.3}
      />
    </Box>

    {/* Brake lights / Tail lights */}
    <Box args={[0.3, 0.12, 0.05]} position={[-0.6, 0.5, -1.78]}>
      <meshStandardMaterial
        color="#ff0000"
        emissive="#ff0000"
        emissiveIntensity={isBraking ? 3 : 0.5}
      />
    </Box>
    <Box args={[0.3, 0.12, 0.05]} position={[0.6, 0.5, -1.78]}>
      <meshStandardMaterial
        color="#ff0000"
        emissive="#ff0000"
        emissiveIntensity={isBraking ? 3 : 0.5}
      />
    </Box>

    {/* Front bumper */}
    <Box args={[1.7, 0.15, 0.1]} position={[0, 0.25, 1.75]}>
      <meshStandardMaterial color="#333333" />
    </Box>

    {/* Rear bumper */}
    <Box args={[1.7, 0.15, 0.1]} position={[0, 0.25, -1.75]}>
      <meshStandardMaterial color="#333333" />
    </Box>

    {/* License plate light */}
    <Box args={[0.3, 0.08, 0.02]} position={[0, 0.35, -1.78]}>
      <meshStandardMaterial color="#ffffff" />
    </Box>
  </group>
));

// Memoized wheel component to avoid re-renders
const WheelModel: React.FC<{ position: [number, number, number] }> = React.memo(({ position }) => (
  <group position={position} rotation={[0, 0, Math.PI / 2]}>
    <Cylinder args={[0.35, 0.35, 0.3, 16]} castShadow>
      <meshStandardMaterial color="#1a1a1a" />
    </Cylinder>
    <Cylinder args={[0.2, 0.2, 0.31, 8]}>
      <meshStandardMaterial color="#ddd" />
    </Cylinder>
  </group>
));

const isValidVector = (v: { x: number; y: number; z: number }) =>
  Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

export const NPCCar: React.FC<NPCCarProps> = ({ laneAxis, lanePos, startOffset, direction, color }) => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const trafficState = useGameStore((s) => s.trafficState);
  const isNight = useGameStore((s) => s.isNight);
  const playerPosition = useGameStore((s) => s.playerPosition);
  // City bounds: 3x3 grid with CELL_SIZE=19, so map spans roughly -28.5 to +28.5
  // Keep cars well within visible city area
  const limit = 28;
  const currentSpeed = useRef(0);
  const desiredSpeed = useRef(0);
  const [isBraking, setIsBraking] = useState(false);

  // Engine sound - DISABLED for quieter experience
  const engineSoundRef = useRef<ReturnType<typeof createCarEngineSound> | null>(null);
  const ENABLE_CAR_SOUNDS = false;

  // Honking state
  const honkCooldownRef = useRef(0);
  const stoppedForPlayerRef = useRef(0); // Time stopped because of player

  // Each car has slightly different personality (randomized on mount)
  // VERY SLOW speeds - like real city traffic
  const carPersonality = useRef({
    maxSpeed: 3.5 + Math.random() * 2.5,        // 3.5-6.0 m/s (much faster, city speed)
    maxAccel: 1.5 + Math.random() * 1.0,        // 1.5-2.5 m/s² (snappy acceleration)
    maxDecel: 3.0 + Math.random() * 1.0,        // 3.0-4.0 m/s² (good brakes)
    followHeadway: 1.5 + Math.random() * 1.0,   // 1.5-2.5 seconds (less gap)
    cautionLevel: 0.8 + Math.random() * 0.2,    // Slightly more aggressive
    honkPatience: 2.0 + Math.random() * 2.0,    // 2-4s before honking
  });

  const { maxSpeed, maxAccel, maxDecel, followHeadway, cautionLevel, honkPatience } = carPersonality.current;
  const minGap = 8 * cautionLevel;              // Minimum gap (affected by caution)
  const stopLineDistance = 5;                   // Distance to stop before intersection
  const statsTimer = useRef(0);
  const intersections = NPC_INTERSECTIONS;
  const idRef = useRef<string>(`npc-${Math.random().toString(36).slice(2, 7)}`);

  // Initialize engine sound on mount (disabled for quieter experience)
  useEffect(() => {
    if (!ENABLE_CAR_SOUNDS) return;

    const initialPos: [number, number, number] = laneAxis === 'z'
      ? [lanePos, 0.5, direction * startOffset]
      : [direction * startOffset, 0.5, lanePos];
    engineSoundRef.current = createCarEngineSound(initialPos);
    engineSoundRef.current.setVolume(0.08);

    return () => {
      engineSoundRef.current?.stop();
    };
  }, [laneAxis, lanePos, startOffset, direction]);

  // Register / unregister in shared lane list
  useEffect(() => {
    const entry: NPCCarLane = {
      id: typeof idRef.current === 'function' ? idRef.current() : idRef.current,
      laneAxis,
      lanePos,
      direction,
      speedRef: currentSpeed,
      getPos: () => {
        if (!rigidBody.current) return null;
        const p = rigidBody.current.translation();
        return isValidVector(p) ? p : null;
      },
    };
    npcCarRegistry.push(entry);
    return () => {
      const idx = npcCarRegistry.findIndex((c) => c.id === entry.id);
      if (idx !== -1) npcCarRegistry.splice(idx, 1);
    };
  }, [laneAxis, lanePos, direction]);

  // Initial placement respecting startOffset so cars don't spawn stacked
  useEffect(() => {
    if (!rigidBody.current) return;
    const base = laneAxis === 'z'
      ? { x: lanePos, z: direction * startOffset }
      : { x: direction * startOffset, z: lanePos };
    rigidBody.current.setNextKinematicTranslation({ x: base.x, y: 0, z: base.z });
  }, [laneAxis, lanePos, startOffset, direction]);

  const findLeadVehicle = () => {
    if (!rigidBody.current) return { dist: Infinity, leadSpeed: maxSpeed };
    const selfPos = rigidBody.current.translation();
    const selfCoord = laneAxis === 'z' ? selfPos.z : selfPos.x;
    let closestDist = Infinity;
    let leadSpeed = maxSpeed;
    npcCarRegistry.forEach((car) => {
      if (car.laneAxis !== laneAxis || car.lanePos !== lanePos || car.direction !== direction || car.id === idRef.current) return;
      const pos = car.getPos?.();
      if (!pos) return;
      const coord = laneAxis === 'z' ? pos.z : pos.x;
      const dist = (coord - selfCoord) * direction;
      if (dist > 0 && dist < closestDist) {
        closestDist = dist;
        leadSpeed = car.speedRef.current;
      }
    });
    return { dist: closestDist, leadSpeed };
  };

  // Throttled state refs
  const lastCheckTime = useRef(Math.random()); // Random offset to spread load
  const cachedLeadDist = useRef(Infinity);
  const cachedLeadSpeed = useRef(maxSpeed);
  const cachedDistToStopLine = useRef(Infinity);
  const cachedInIntersection = useRef(false);
  const cachedPlayerBlocking = useRef(false);
  const cachedDistToPlayer = useRef(Infinity);

  useFrame((state, delta) => {
    if (!rigidBody.current) return;
    const dt = Math.min(delta, 0.05);
    const pos = rigidBody.current.translation();
    const time = state.clock.elapsedTime;

    // Safety check - reset if invalid position
    if (!isValidVector(pos)) {
      rigidBody.current.setNextKinematicTranslation({
        x: laneAxis === 'x' ? 0 : lanePos,
        y: 0,
        z: laneAxis === 'z' ? 0 : lanePos,
      });
      currentSpeed.current = 0;
      return;
    }

    // Determine if this car can go based on traffic lights
    // NS cars (laneAxis === 'z') go on NS_GREEN
    // EW cars (laneAxis === 'x') go on EW_GREEN
    const hasGreenLight = laneAxis === 'z'
      ? trafficState === 'NS_GREEN'
      : trafficState === 'EW_GREEN';
    const hasYellowLight = laneAxis === 'z'
      ? trafficState === 'NS_YELLOW'
      : trafficState === 'EW_YELLOW';

    // Get current position along the lane
    const currentCoord = laneAxis === 'z' ? pos.z : pos.x;

    // THROTTLED CHECKS (Run every ~0.15s)
    if (time - lastCheckTime.current > 0.15) {
      lastCheckTime.current = time;

      // 1. Find distance to next intersection stop line
      let distToStopLine = Infinity;
      for (const center of intersections) {
        // Stop line is before the intersection center
        const stopLine = center - direction * stopLineDistance;
        const dist = (stopLine - currentCoord) * direction;
        if (dist > 0 && dist < distToStopLine) {
          distToStopLine = dist;
        }
      }
      cachedDistToStopLine.current = distToStopLine;

      // 2. Check if we're currently IN an intersection
      let inIntersection = false;
      for (const center of intersections) {
        const entryPoint = center - direction * stopLineDistance;
        const exitPoint = center + direction * (stopLineDistance + 3);
        const pastEntry = (currentCoord - entryPoint) * direction > 0;
        const beforeExit = (exitPoint - currentCoord) * direction > 0;
        if (pastEntry && beforeExit) {
          inIntersection = true;
          break;
        }
      }
      cachedInIntersection.current = inIntersection;

      // 3. Find lead vehicle
      const { dist: leadDist, leadSpeed } = findLeadVehicle();
      cachedLeadDist.current = leadDist;
      cachedLeadSpeed.current = leadSpeed;

      // 4. Check if player is blocking
      let playerBlocking = false;
      const playerDetectionRange = 8;
      const playerLaneWidth = 2.5;

      const dx = playerPosition[0] - pos.x;
      const dz = playerPosition[2] - pos.z;
      const distToPlayer = Math.sqrt(dx * dx + dz * dz);

      if (distToPlayer < playerDetectionRange) {
        if (laneAxis === 'z') {
          const playerInLane = Math.abs(playerPosition[0] - lanePos) < playerLaneWidth;
          const playerAhead = (playerPosition[2] - pos.z) * direction > 0;
          if (playerInLane && playerAhead) playerBlocking = true;
        } else {
          const playerInLane = Math.abs(playerPosition[2] - lanePos) < playerLaneWidth;
          const playerAhead = (playerPosition[0] - pos.x) * direction > 0;
          if (playerInLane && playerAhead) playerBlocking = true;
        }
      }
      cachedPlayerBlocking.current = playerBlocking;
      cachedDistToPlayer.current = distToPlayer;
    }

    // Use cached values
    const distToStopLine = cachedDistToStopLine.current;
    const inIntersection = cachedInIntersection.current;
    const leadDist = cachedLeadDist.current;
    const leadSpeed = cachedLeadSpeed.current;
    const playerBlocking = cachedPlayerBlocking.current;
    const distToPlayer = cachedDistToPlayer.current;

    // Calculate target speed
    let targetSpeed = maxSpeed;

    // 1. Traffic light logic - MOST IMPORTANT
    if (!inIntersection) {
      // Not in intersection - must respect traffic lights
      if (!hasGreenLight && !hasYellowLight) {
        // RED LIGHT - must stop before intersection
        if (distToStopLine < 20) {
          targetSpeed = 0;
        }
      } else if (hasYellowLight) {
        // YELLOW LIGHT - stop if we have time, otherwise proceed
        if (distToStopLine > 3 && distToStopLine < 15) {
          targetSpeed = 0; // Can stop safely
        }
      }
      // GREEN LIGHT - can proceed normally
    }
    // If in intersection, keep moving to clear it

    // 2. Car following - maintain safe distance
    const safeGap = minGap + currentSpeed.current * followHeadway;
    if (leadDist < minGap) {
      // Too close - stop!
      targetSpeed = 0;
    } else if (leadDist < safeGap) {
      // Getting close - slow down to match lead car
      const ratio = (leadDist - minGap) / (safeGap - minGap);
      targetSpeed = Math.min(targetSpeed, leadSpeed * ratio);
    }

    // 2.5 Player blocking - stop for player (honking disabled for quieter experience)
    if (playerBlocking && distToPlayer < 5) {
      targetSpeed = 0;
      stoppedForPlayerRef.current += dt;
      // Honking disabled - cars just wait patiently
    } else {
      stoppedForPlayerRef.current = 0;
    }

    // 3. Smooth speed changes - very gentle acceleration/deceleration
    const speedDiff = targetSpeed - currentSpeed.current;
    const wasBraking = isBraking;
    let nowBraking = false;

    if (speedDiff > 0) {
      // Accelerating
      currentSpeed.current += Math.min(speedDiff, maxAccel * dt);
    } else {
      // Decelerating
      currentSpeed.current += Math.max(speedDiff, -maxDecel * dt);
      // Show brake lights when actively decelerating
      if (speedDiff < -0.5 || targetSpeed === 0) {
        nowBraking = true;
      }
    }
    currentSpeed.current = Math.max(0, Math.min(currentSpeed.current, maxSpeed));

    // Update brake light state (throttled to avoid excessive re-renders)
    if (nowBraking !== wasBraking) {
      setIsBraking(nowBraking);
    }

    desiredSpeed.current = targetSpeed;

    // 4. Move the car
    let nextX = pos.x;
    let nextZ = pos.z;
    const moveStep = currentSpeed.current * dt;

    // Check if car is far from player (safe to respawn without being seen)
    const distFromPlayer = Math.sqrt(
      Math.pow(playerPosition[0] - pos.x, 2) + Math.pow(playerPosition[2] - pos.z, 2)
    );
    const isFarFromPlayer = distFromPlayer > 25; // Player won't notice respawn

    if (laneAxis === 'z') {
      nextZ += direction * moveStep;
      // At edges: respawn on opposite side if far from player, otherwise stop
      if (nextZ > limit) {
        if (isFarFromPlayer) {
          nextZ = -limit + 2; // Respawn at opposite edge with small offset
          currentSpeed.current = maxSpeed * 0.5; // Start moving again
        } else {
          nextZ = limit;
          currentSpeed.current = 0; // Stop at edge if player might see
        }
      }
      if (nextZ < -limit) {
        if (isFarFromPlayer) {
          nextZ = limit - 2;
          currentSpeed.current = maxSpeed * 0.5;
        } else {
          nextZ = -limit;
          currentSpeed.current = 0;
        }
      }
      _npcCarQ.setFromAxisAngle(_npcCarAxis, direction > 0 ? 0 : Math.PI);
      rigidBody.current.setNextKinematicTranslation({ x: lanePos, y: 0, z: nextZ });
      rigidBody.current.setNextKinematicRotation(_npcCarQ);
    } else {
      nextX += direction * moveStep;
      // At edges: respawn on opposite side if far from player, otherwise stop
      if (nextX > limit) {
        if (isFarFromPlayer) {
          nextX = -limit + 2;
          currentSpeed.current = maxSpeed * 0.5;
        } else {
          nextX = limit;
          currentSpeed.current = 0;
        }
      }
      if (nextX < -limit) {
        if (isFarFromPlayer) {
          nextX = limit - 2;
          currentSpeed.current = maxSpeed * 0.5;
        } else {
          nextX = -limit;
          currentSpeed.current = 0;
        }
      }
      _npcCarQ.setFromAxisAngle(_npcCarAxis, direction > 0 ? -Math.PI / 2 : Math.PI / 2);
      rigidBody.current.setNextKinematicTranslation({ x: nextX, y: 0, z: lanePos });
      rigidBody.current.setNextKinematicRotation(_npcCarQ);
    }

    // Update engine sound (disabled for quieter experience)
    if (ENABLE_CAR_SOUNDS && engineSoundRef.current) {
      engineSoundRef.current.setPosition([pos.x, pos.y + 0.5, pos.z]);
      engineSoundRef.current.setSpeed(currentSpeed.current);
    }

    // Debug stats
    statsTimer.current += dt;
    if (statsTimer.current > 1.0) {
      const active = npcCarRegistry.length;
      const avgSpeed = active ? npcCarRegistry.reduce((sum, car) => sum + car.speedRef.current, 0) / active : 0;
      (window as any).__npcTrafficStats = { active, avgSpeed, updated: performance.now() };
      statsTimer.current = 0;
    }
  });

  return (
    <RigidBody
      ref={rigidBody}
      type="kinematicPosition"
      colliders="hull"
      position={[
        laneAxis === 'x' ? 0 : lanePos,
        0,
        laneAxis === 'z' ? 0 : lanePos,
      ]}
    >
      <group scale={[0.8, 0.8, 0.8]}>
        <CarBodyModel color={color} isBraking={isBraking} isNight={isNight} />
        <WheelModel position={[-0.9, 0.35, 1]} />
        <WheelModel position={[0.9, 0.35, 1]} />
        <WheelModel position={[-0.9, 0.35, -1.2]} />
        <WheelModel position={[0.9, 0.35, -1.2]} />
      </group>
    </RigidBody>
  );
};
