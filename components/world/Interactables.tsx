import React, { useState, useEffect, useRef } from 'react';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Box, Cylinder, Sphere, Cone, Torus, useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useGameStore, Controls } from '../../store';
import { playSound } from '../../utils/audio';
import { Materials } from '../../utils/materials';

export const Telescope: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    openDialogue("Telescopio", "Ves una constelacion con forma de milanesa.");
                    playSound('gem');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                <Cylinder args={[0.05, 0.05, 1]} position={[0, 0.5, 0]} rotation={[0.2, 0, 0]} material={Materials.Silver} />
                <Cylinder args={[0.05, 0.05, 1]} position={[-0.3, 0.5, -0.3]} rotation={[-0.2, 0, 0.2]} material={Materials.Silver} />
                <Cylinder args={[0.05, 0.05, 1]} position={[0.3, 0.5, -0.3]} rotation={[-0.2, 0, -0.2]} material={Materials.Silver} />
                <Cylinder args={[0.1, 0.12, 1.2]} position={[0, 1.2, 0]} rotation={[Math.PI / 3, 0, 0]} castShadow material={Materials.Bronze} />
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Mirar'))} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1, 1, 1]} position={[0, 1, 0]} />
            </RigidBody>
        </group>
    )
}

export const StreetEasel: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    openDialogue("Caballete", "Pintaste un atardecer hermoso!");
                    playSound('rustle');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                <Box args={[0.05, 1.5, 0.05]} position={[-0.3, 0.75, 0]} rotation={[0.1, 0, 0]} material={Materials.Brown} />
                <Box args={[0.05, 1.5, 0.05]} position={[0.3, 0.75, 0]} rotation={[0.1, 0, 0]} material={Materials.Brown} />
                <Box args={[0.05, 1.4, 0.05]} position={[0, 0.7, -0.4]} rotation={[-0.2, 0, 0]} material={Materials.Brown} />
                <Box args={[0.8, 0.6, 0.05]} position={[0, 1.1, 0.05]} rotation={[0.1, 0, 0]} castShadow><meshStandardMaterial color="#fff" /></Box>
                <Box args={[0.8, 0.1, 0.1]} position={[0, 0.75, 0.1]} rotation={[0.1, 0, 0]} material={Materials.Brown} />
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Pintar'))} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1, 1, 1]} position={[0, 1, 0.5]} />
            </RigidBody>
        </group>
    )
}

export const DrinkingFountain: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            <RigidBody type="fixed" colliders="hull">
                <Box args={[0.5, 0.8, 0.5]} position={[0, 0.4, 0]} castShadow material={Materials.Stone} />
                <Sphere args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.8, 0]} rotation={[Math.PI, 0, 0]} castShadow material={Materials.Silver} />
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && playSound('gem')}>
                <CuboidCollider args={[1, 1, 1]} position={[0, 0.5, 0]} />
            </RigidBody>
        </group>
    )
}

export const PicnicTable: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const startSitting = useGameStore(s => s.startSitting);
    const isHolding = useGameStore(s => s.isHolding);
    const [subscribeKeys] = useKeyboardControls();
    const [inRange, setInRange] = useState(false);

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (p) => p && startSitting([position[0], position[1] + 0.6, position[2]], rotation), { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                {/* Table Top */}
                <Box args={[1.8, 0.1, 1.2]} position={[0, 0.6, 0]} castShadow receiveShadow material={Materials.WoodDark} />

                {/* Checkered Tablecloth Pattern - red and white squares */}
                <Box args={[0.4, 0.02, 0.3]} position={[-0.6, 0.66, -0.4]}><meshStandardMaterial color="#ef5350" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[-0.2, 0.66, -0.4]}><meshStandardMaterial color="#ffffff" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[0.2, 0.66, -0.4]}><meshStandardMaterial color="#ef5350" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[0.6, 0.66, -0.4]}><meshStandardMaterial color="#ffffff" /></Box>

                <Box args={[0.4, 0.02, 0.3]} position={[-0.6, 0.66, -0.1]}><meshStandardMaterial color="#ffffff" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[-0.2, 0.66, -0.1]}><meshStandardMaterial color="#ef5350" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[0.2, 0.66, -0.1]}><meshStandardMaterial color="#ffffff" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[0.6, 0.66, -0.1]}><meshStandardMaterial color="#ef5350" /></Box>

                <Box args={[0.4, 0.02, 0.3]} position={[-0.6, 0.66, 0.2]}><meshStandardMaterial color="#ef5350" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[-0.2, 0.66, 0.2]}><meshStandardMaterial color="#ffffff" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[0.2, 0.66, 0.2]}><meshStandardMaterial color="#ef5350" /></Box>
                <Box args={[0.4, 0.02, 0.3]} position={[0.6, 0.66, 0.2]}><meshStandardMaterial color="#ffffff" /></Box>

                {/* Decorative Food Items */}
                {/* Basket */}
                <Cylinder args={[0.15, 0.2, 0.15]} position={[-0.5, 0.75, 0]} castShadow><meshStandardMaterial color="#8B4513" /></Cylinder>
                <Cylinder args={[0.02, 0.02, 0.35]} position={[-0.5, 0.9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color="#8B4513" /></Cylinder>

                {/* Sandwich on plate */}
                <Cylinder args={[0.12, 0.12, 0.02]} position={[0.3, 0.69, 0.1]} castShadow><meshStandardMaterial color="#ffffff" /></Cylinder>
                <Box args={[0.15, 0.05, 0.15]} position={[0.3, 0.72, 0.1]} castShadow><meshStandardMaterial color="#FFE4B5" /></Box>
                <Box args={[0.15, 0.02, 0.15]} position={[0.3, 0.745, 0.1]} castShadow><meshStandardMaterial color="#90EE90" /></Box>

                {/* Apple */}
                <Sphere args={[0.06]} position={[0.5, 0.72, -0.2]} castShadow><meshStandardMaterial color="#FF6347" /></Sphere>

                {/* Drink cup */}
                <Cylinder args={[0.05, 0.06, 0.12]} position={[-0.2, 0.74, -0.3]} castShadow><meshStandardMaterial color="#87CEEB" transparent opacity={0.7} /></Cylinder>

                {/* Benches */}
                <Box args={[1.8, 0.08, 0.4]} position={[0, 0.35, 1]} castShadow material={Materials.WoodDark} />
                <Box args={[1.8, 0.08, 0.4]} position={[0, 0.35, -1]} castShadow material={Materials.WoodDark} />

                {/* Legs */}
                <Cylinder args={[0.08, 0.08, 0.6]} position={[-0.7, 0.3, 0]} rotation={[0, 0, 0.2]} material={Materials.WoodDark} />
                <Cylinder args={[0.08, 0.08, 0.6]} position={[0.7, 0.3, 0]} rotation={[0, 0, -0.2]} material={Materials.WoodDark} />
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInteractionLabel(isHolding ? null : "Sentarse"), setInRange(true))} onIntersectionExit={() => (setInteractionLabel(null), setInRange(false))}>
                <CuboidCollider args={[1.5, 1, 2]} position={[0, 0.5, 0]} />
            </RigidBody>
        </group>
    );
}

export const Statue: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="fixed" colliders="hull" friction={0}>
        <group position={position}>
            {/* Ornate stone base with tiers */}
            <Box args={[1.4, 0.3, 1.4]} position={[0, 0.15, 0]} castShadow material={Materials.Stone} />
            <Box args={[1.2, 0.3, 1.2]} position={[0, 0.45, 0]} castShadow material={Materials.Stone} />
            <Cylinder args={[0.5, 0.5, 0.4, 8]} position={[0, 0.8, 0]} castShadow material={Materials.Stone} />

            {/* Decorative plaque */}
            <Box args={[0.8, 0.15, 0.05]} position={[0, 0.65, 0.65]} castShadow material={Materials.Bronze} />
            <Box args={[0.7, 0.1, 0.02]} position={[0, 0.65, 0.68]} castShadow><meshStandardMaterial color="#2c3e50" /></Box>

            {/* Friendly cat statue */}
            {/* Body */}
            <Sphere args={[0.4, 16, 16]} position={[0, 1.4, 0]} castShadow material={Materials.Bronze} />

            {/* Head */}
            <Sphere args={[0.35, 16, 16]} position={[0, 1.9, 0]} castShadow material={Materials.Bronze} />

            {/* Ears */}
            <Cone args={[0.15, 0.3, 4]} position={[-0.2, 2.15, 0]} castShadow material={Materials.Bronze} />
            <Cone args={[0.15, 0.3, 4]} position={[0.2, 2.15, 0]} castShadow material={Materials.Bronze} />

            {/* Eyes (shiny gold) */}
            <Sphere args={[0.08]} position={[-0.12, 1.95, 0.3]} castShadow material={Materials.Gold} />
            <Sphere args={[0.08]} position={[0.12, 1.95, 0.3]} castShadow material={Materials.Gold} />

            {/* Nose */}
            <Sphere args={[0.06]} position={[0, 1.85, 0.35]} castShadow><meshStandardMaterial color="#FFB6C1" /></Sphere>

            {/* Sitting pose legs */}
            <Sphere args={[0.18, 16, 16]} position={[-0.25, 1.05, 0.15]} castShadow material={Materials.Bronze} />
            <Sphere args={[0.18, 16, 16]} position={[0.25, 1.05, 0.15]} castShadow material={Materials.Bronze} />

            {/* Tail (curved) */}
            <Cylinder args={[0.08, 0.08, 0.6]} position={[0, 1.3, -0.35]} rotation={[0.5, 0, 0]} castShadow material={Materials.Bronze} />
            <Sphere args={[0.1]} position={[0, 1.55, -0.55]} castShadow material={Materials.Bronze} />

            {/* Decorative collar with bell */}
            <Cylinder args={[0.25, 0.25, 0.08, 16]} position={[0, 1.65, 0]} castShadow><meshStandardMaterial color="#ef5350" /></Cylinder>
            <Sphere args={[0.06]} position={[0, 1.6, 0.25]} castShadow material={Materials.Gold} />
        </group>
    </RigidBody>
)

export const Coin: React.FC<{ position: [number, number, number]; type?: 'bronze' | 'silver' | 'gold' }> = ({ position, type = 'bronze' }) => {
    const [collected, setCollected] = useState(false);
    const addCoin = useGameStore((state) => state.addCoin);
    const groupRef = useRef<Group>(null);
    const sparklesRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current && !collected) {
            groupRef.current.rotation.y += 0.05;
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        }

        // Animate sparkle particles
        if (sparklesRef.current && !collected) {
            sparklesRef.current.children.forEach((sparkle, i) => {
                const offset = i * (Math.PI * 2 / 4);
                sparkle.position.x = Math.sin(state.clock.elapsedTime * 2 + offset) * 0.3;
                sparkle.position.z = Math.cos(state.clock.elapsedTime * 2 + offset) * 0.3;
                sparkle.position.y = Math.sin(state.clock.elapsedTime * 3 + offset) * 0.2;
            });
        }
    });

    if (collected) return null;

    const glowColor = type === 'gold' ? '#ffeb3b' : type === 'silver' ? '#e0e0e0' : '#cd7f32';
    const glowIntensity = type === 'gold' ? 1.5 : type === 'silver' ? 0.8 : 0.5;

    return (
        <RigidBody type="fixed" colliders="ball" sensor position={position} onIntersectionEnter={({ other }) => { if (other.rigidBodyObject?.name === 'player' && !collected) { setCollected(true); addCoin(type === 'gold' ? 10 : type === 'silver' ? 5 : 1); playSound('coin'); } }}>
            <group ref={groupRef}>
                {/* Main coin */}
                <Torus args={[type === 'gold' ? 0.25 : 0.2, 0.06, 8, 16]} castShadow material={type === 'gold' ? Materials.Gold : type === 'silver' ? Materials.Silver : Materials.Bronze} />

                {/* Glow effect */}
                <Sphere args={[type === 'gold' ? 0.35 : 0.28, 16, 16]}>
                    <meshStandardMaterial
                        color={glowColor}
                        transparent
                        opacity={0.15}
                        emissive={glowColor}
                        emissiveIntensity={glowIntensity}
                    />
                </Sphere>

                {/* Sparkle particles */}
                <group ref={sparklesRef}>
                    <Sphere args={[0.04]}>
                        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
                    </Sphere>
                    <Sphere args={[0.04]}>
                        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
                    </Sphere>
                    <Sphere args={[0.04]}>
                        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
                    </Sphere>
                    <Sphere args={[0.04]}>
                        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
                    </Sphere>
                </group>
            </group>
        </RigidBody>
    );
};

export const Fountain: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const waterRef = React.useRef<Group>(null);

    // Animate water jets
    useFrame((state) => {
        if (waterRef.current) {
            waterRef.current.children.forEach((child, i) => {
                child.position.y = 1.2 + Math.abs(Math.sin(state.clock.elapsedTime * 2 + i * 0.5)) * 1.2;
            });
        }
    });

    return (
        <RigidBody type="fixed" colliders="trimesh" position={position} friction={0}>
            <group>
                {/* Multi-level ornate base */}
                <Cylinder args={[2.5, 2.7, 0.3, 16]} position={[0, 0.15, 0]} receiveShadow castShadow material={Materials.Stone} />
                <Cylinder args={[2.2, 2.4, 0.4, 16]} position={[0, 0.4, 0]} receiveShadow castShadow material={Materials.Stone} />
                <Cylinder args={[2, 2.2, 0.5, 16]} position={[0, 0.7, 0]} receiveShadow castShadow material={Materials.Stone} />

                {/* Water pool */}
                <Cylinder args={[1.85, 1.85, 0.4, 16]} position={[0, 0.85, 0]} material={Materials.Water} />

                {/* Decorative center pedestal with tiers */}
                <Cylinder args={[0.5, 0.5, 1.8, 12]} position={[0, 1.45, 0]} castShadow material={Materials.Stone} />
                <Cylinder args={[0.6, 0.5, 0.2, 12]} position={[0, 0.65, 0]} castShadow material={Materials.Stone} />
                <Cylinder args={[0.7, 0.6, 0.2, 12]} position={[0, 2.25, 0]} castShadow material={Materials.Stone} />

                {/* Top ornamental sphere */}
                <Sphere args={[0.4, 16, 16]} position={[0, 2.65, 0]} castShadow><meshStandardMaterial color="#d9d9dd" metalness={0.3} roughness={0.5} /></Sphere>

                {/* Animated water jets (spheres moving up) */}
                <group ref={waterRef}>
                    <Sphere args={[0.08]} position={[0, 1.2, 0]}><meshStandardMaterial color="#a6e3e9" transparent opacity={0.8} emissive="#a6e3e9" emissiveIntensity={0.5} /></Sphere>
                    <Sphere args={[0.08]} position={[0.3, 1.2, 0]}><meshStandardMaterial color="#a6e3e9" transparent opacity={0.8} emissive="#a6e3e9" emissiveIntensity={0.5} /></Sphere>
                    <Sphere args={[0.08]} position={[-0.3, 1.2, 0]}><meshStandardMaterial color="#a6e3e9" transparent opacity={0.8} emissive="#a6e3e9" emissiveIntensity={0.5} /></Sphere>
                    <Sphere args={[0.08]} position={[0, 1.2, 0.3]}><meshStandardMaterial color="#a6e3e9" transparent opacity={0.8} emissive="#a6e3e9" emissiveIntensity={0.5} /></Sphere>
                    <Sphere args={[0.08]} position={[0, 1.2, -0.3]}><meshStandardMaterial color="#a6e3e9" transparent opacity={0.8} emissive="#a6e3e9" emissiveIntensity={0.5} /></Sphere>
                </group>

                {/* Decorative fish swimming in the fountain */}
                <Sphere args={[0.12, 8, 8]} position={[1, 0.95, 0.5]} castShadow><meshStandardMaterial color="#ff8c42" /></Sphere>
                <Sphere args={[0.12, 8, 8]} position={[-0.8, 0.95, -0.6]} castShadow><meshStandardMaterial color="#ff8c42" /></Sphere>
                <Sphere args={[0.12, 8, 8]} position={[0.5, 0.95, -0.8]} castShadow><meshStandardMaterial color="#ffa500" /></Sphere>

                {/* Coins in the fountain */}
                <Coin position={[0.8, 1.0, 0]} type="silver" />
                <Coin position={[-0.8, 1.0, 0]} type="silver" />
                <Coin position={[0.3, 1.0, 0.7]} type="bronze" />
            </group>
        </RigidBody>
    );
};

export const WishingWell: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    openDialogue("Pozo de los Deseos", "Pediste un deseo. Las monedas brillan en el fondo!");
                    playSound('gem');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                {/* Stone base and well structure */}
                <Cylinder args={[1.2, 1.3, 1.5, 12]} position={[0, 0.75, 0]} castShadow material={Materials.Stone} />
                <Cylinder args={[1.1, 1.1, 0.3, 12]} position={[0, 1.65, 0]} castShadow material={Materials.Stone} />

                {/* Inner water pool with coins */}
                <Cylinder args={[0.95, 0.95, 0.4, 12]} position={[0, 1.4, 0]} material={Materials.Water} />

                {/* Glowing coins at the bottom */}
                <Sphere args={[0.05]} position={[0.3, 1.25, 0.2]}><meshStandardMaterial color="#ffc107" emissive="#ffb300" emissiveIntensity={1.5} /></Sphere>
                <Sphere args={[0.05]} position={[-0.2, 1.25, -0.3]}><meshStandardMaterial color="#ececec" emissive="#ffffff" emissiveIntensity={1} /></Sphere>
                <Sphere args={[0.05]} position={[0.4, 1.25, -0.2]}><meshStandardMaterial color="#cd7f32" emissive="#cd7f32" emissiveIntensity={0.8} /></Sphere>
                <Sphere args={[0.05]} position={[-0.4, 1.25, 0.3]}><meshStandardMaterial color="#ffc107" emissive="#ffb300" emissiveIntensity={1.5} /></Sphere>

                {/* Wooden roof support posts */}
                <Cylinder args={[0.08, 0.08, 2]} position={[-0.9, 2.5, -0.9]} castShadow material={Materials.WoodDark} />
                <Cylinder args={[0.08, 0.08, 2]} position={[0.9, 2.5, -0.9]} castShadow material={Materials.WoodDark} />
                <Cylinder args={[0.08, 0.08, 2]} position={[-0.9, 2.5, 0.9]} castShadow material={Materials.WoodDark} />
                <Cylinder args={[0.08, 0.08, 2]} position={[0.9, 2.5, 0.9]} castShadow material={Materials.WoodDark} />

                {/* Wooden roof beams */}
                <Cylinder args={[0.06, 0.06, 2]} position={[0, 3.5, -0.9]} rotation={[0, 0, Math.PI / 2]} castShadow material={Materials.WoodDark} />
                <Cylinder args={[0.06, 0.06, 2]} position={[0, 3.5, 0.9]} rotation={[0, 0, Math.PI / 2]} castShadow material={Materials.WoodDark} />
                <Cylinder args={[0.06, 0.06, 2]} position={[-0.9, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={Materials.WoodDark} />
                <Cylinder args={[0.06, 0.06, 2]} position={[0.9, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={Materials.WoodDark} />

                {/* Roof (pyramid shape) */}
                <Cylinder args={[0, 1.4, 1, 4]} position={[0, 4.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><meshStandardMaterial color="#8B4513" /></Cylinder>

                {/* Bucket hanging from roof */}
                <Cylinder args={[0.01, 0.01, 1.5]} position={[0, 3, 0]} castShadow><meshStandardMaterial color="#8B4513" /></Cylinder>
                <Cylinder args={[0.15, 0.18, 0.25]} position={[0, 2, 0]} castShadow material={Materials.WoodDark} />
                <Cylinder args={[0.01, 0.01, 0.2]} position={[0, 2.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={Materials.Metal} />
            </RigidBody>

            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Pedir Deseo'))} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1.5, 1.5, 1.5]} position={[0, 1.5, 0]} />
            </RigidBody>
        </group>
    );
};

// Interactive Newspaper Kiosk
export const InteractiveKiosk: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    const headlines = [
        "GATO LOCAL RESCATADO DE ARBOL - BOMBEROS CELEBRAN",
        "NUEVA PIZZERIA ABRE - 'LA MEJOR MASA DEL BARRIO'",
        "FESTIVAL DE HELADOS ESTE FIN DE SEMANA",
        "CLIMA PERFECTO PARA PASEAR EN EL PARQUE",
        "CONCURSO DE MASCOTAS - INSCRIPCIONES ABIERTAS"
    ];

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    const headline = headlines[Math.floor(Math.random() * headlines.length)];
                    openDialogue("Diario del Día", headline);
                    playSound('rustle');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
                {/* Main structure */}
                <Box args={[1.2, 2, 0.8]} position={[0, 1, 0]} castShadow>
                    <meshStandardMaterial color="#2d5a27" roughness={0.7} />
                </Box>
                {/* Glass window */}
                <Box args={[1, 1.2, 0.05]} position={[0, 1.3, 0.38]} castShadow>
                    <meshStandardMaterial color="#87ceeb" transparent opacity={0.5} metalness={0.3} />
                </Box>
                {/* Magazines display */}
                {[-0.3, 0, 0.3].map((x, i) => (
                    <Box key={i} args={[0.25, 0.35, 0.02]} position={[x, 1.3, 0.35]} castShadow>
                        <meshStandardMaterial color={['#e74c3c', '#3498db', '#f1c40f'][i]} />
                    </Box>
                ))}
                {/* Awning */}
                <Box args={[1.4, 0.1, 1]} position={[0, 2.05, 0.1]}>
                    <meshStandardMaterial color="#c0392b" roughness={0.8} />
                </Box>
                {/* Counter */}
                <Box args={[1.3, 0.1, 0.3]} position={[0, 0.8, 0.55]} castShadow>
                    <meshStandardMaterial color="#8b4513" roughness={0.6} />
                </Box>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor
                onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Leer Diario'))}
                onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1.2, 1.5, 1.2]} position={[0, 1, 0.8]} />
            </RigidBody>
        </group>
    );
};

// Interactive Vending Machine with random prizes
export const InteractiveVendingMachine: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; type?: 'drinks' | 'snacks' | 'toys' }> = ({
    position,
    rotation = [0, 0, 0],
    type = 'drinks'
}) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const addCoin = useGameStore(s => s.addCoin);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    const items = {
        drinks: ["Gaseosa de Frutilla", "Agua Mineral Sparkle", "Jugo de Naranja Fresco", "Té Helado de Durazno"],
        snacks: ["Galletas de Chocolate", "Papas Fritas Crujientes", "Barra de Cereal", "Maní Salado"],
        toys: ["Figurita Misteriosa", "Pelotita Saltarina", "Sticker Brillante", "Mini Dinosaurio"]
    };

    const colors = {
        drinks: '#1e88e5',
        snacks: '#ff7043',
        toys: '#9c27b0'
    };

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    const item = items[type][Math.floor(Math.random() * items[type].length)];
                    // 20% chance to get bonus coins
                    if (Math.random() < 0.2) {
                        addCoin(5);
                        openDialogue("Máquina Expendedora", `¡Obtuviste: ${item}! 🎉 ¡Y encontraste monedas de bonificación!`);
                        playSound('coin');
                    } else {
                        openDialogue("Máquina Expendedora", `¡Obtuviste: ${item}!`);
                        playSound('gem');
                    }
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding, type, addCoin]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
                {/* Main body */}
                <Box args={[0.8, 1.8, 0.6]} position={[0, 0.9, 0]} castShadow>
                    <meshStandardMaterial color={colors[type]} roughness={0.5} />
                </Box>
                {/* Display window */}
                <Box args={[0.6, 1, 0.05]} position={[0, 1.1, 0.28]} castShadow>
                    <meshStandardMaterial color="#333" metalness={0.3} roughness={0.3} />
                </Box>
                {/* Product rows */}
                {[0.3, 0, -0.3].map((y, row) => (
                    <group key={row}>
                        {[-0.15, 0.15].map((x, col) => (
                            <Cylinder key={col} args={[0.06, 0.06, 0.15]} position={[x, 1.1 + y, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                                <meshStandardMaterial color={type === 'drinks' ? ['#e74c3c', '#27ae60', '#f39c12', '#3498db'][row * 2 + col] : '#fff'} />
                            </Cylinder>
                        ))}
                    </group>
                ))}
                {/* Coin slot */}
                <Box args={[0.1, 0.03, 0.02]} position={[0.25, 0.5, 0.31]}>
                    <meshStandardMaterial color="#222" metalness={0.8} />
                </Box>
                {/* Dispenser tray */}
                <Box args={[0.5, 0.15, 0.3]} position={[0, 0.15, 0.15]}>
                    <meshStandardMaterial color="#333" roughness={0.7} />
                </Box>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor
                onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Usar'))}
                onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[0.8, 1.2, 0.8]} position={[0, 0.9, 0.5]} />
            </RigidBody>
        </group>
    );
};

// Street Musician / Performer with ambient music interaction
export const StreetMusician: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; instrument?: 'guitar' | 'accordion' | 'violin' }> = ({
    position,
    rotation = [0, 0, 0],
    instrument = 'guitar'
}) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const addCoin = useGameStore(s => s.addCoin);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();
    const groupRef = useRef<Group>(null);

    // Subtle swaying animation
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    const songs = [
        "🎵 Toca una melodía alegre que te hace sonreír",
        "🎵 Una canción nostálgica que te recuerda a casa",
        "🎵 Un ritmo animado que te dan ganas de bailar",
        "🎵 Una dulce melodía que calma el corazón"
    ];

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    const song = songs[Math.floor(Math.random() * songs.length)];
                    openDialogue("Músico Callejero", song);
                    playSound('gem');
                    // Small tip
                    if (Math.random() < 0.3) {
                        addCoin(1);
                    }
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding, addCoin]);

    return (
        <group position={position} rotation={rotation} ref={groupRef}>
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
                {/* Stool */}
                <Cylinder args={[0.25, 0.25, 0.4]} position={[0, 0.2, 0]} castShadow>
                    <meshStandardMaterial color="#8b4513" roughness={0.7} />
                </Cylinder>
                {/* Body */}
                <Cylinder args={[0.2, 0.25, 0.6]} position={[0, 0.7, 0]} castShadow>
                    <meshStandardMaterial color="#4a6741" roughness={0.8} />
                </Cylinder>
                {/* Head */}
                <Sphere args={[0.2]} position={[0, 1.1, 0]} castShadow>
                    <meshStandardMaterial color="#f5deb3" roughness={0.6} />
                </Sphere>
                {/* Hat */}
                <Cylinder args={[0.25, 0.22, 0.15]} position={[0, 1.3, 0]} castShadow>
                    <meshStandardMaterial color="#2c3e50" roughness={0.5} />
                </Cylinder>
                <Cylinder args={[0.35, 0.35, 0.03]} position={[0, 1.23, 0]} castShadow>
                    <meshStandardMaterial color="#2c3e50" roughness={0.5} />
                </Cylinder>
                {/* Instrument */}
                {instrument === 'guitar' && (
                    <group position={[0.2, 0.7, 0.2]} rotation={[0.3, 0.5, 0]}>
                        <Box args={[0.1, 0.5, 0.05]} position={[0, 0.25, 0]} castShadow>
                            <meshStandardMaterial color="#8b4513" roughness={0.6} />
                        </Box>
                        <Cylinder args={[0.15, 0.15, 0.08]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                            <meshStandardMaterial color="#cd853f" roughness={0.5} />
                        </Cylinder>
                    </group>
                )}
                {/* Tip jar */}
                <Cylinder args={[0.1, 0.12, 0.15]} position={[0.4, 0.08, 0.3]} castShadow>
                    <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
                </Cylinder>
                {/* Coins in jar */}
                <Sphere args={[0.03]} position={[0.38, 0.05, 0.28]}>
                    <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
                </Sphere>
                <Sphere args={[0.03]} position={[0.42, 0.05, 0.32]}>
                    <meshStandardMaterial color="#c0c0c0" />
                </Sphere>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor
                onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Escuchar'))}
                onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1.2, 1.2, 1.2]} position={[0, 0.8, 0]} />
            </RigidBody>
        </group>
    );
};

// Interactive Postbox for sending postcards
export const InteractivePostbox: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    const messages = [
        "Enviaste una postal a tu abuela. ¡Le va a encantar!",
        "Tu carta de amor está en camino... 💕",
        "Invitación para la fiesta enviada!",
        "Postal del viaje despachada a tus amigos"
    ];

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    const msg = messages[Math.floor(Math.random() * messages.length)];
                    openDialogue("Buzón", msg);
                    playSound('rustle');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                {/* Post */}
                <Cylinder args={[0.08, 0.08, 1]} position={[0, 0.5, 0]} castShadow>
                    <meshStandardMaterial color="#333" roughness={0.6} />
                </Cylinder>
                {/* Box body */}
                <Cylinder args={[0.25, 0.25, 0.4, 8]} position={[0, 1.2, 0]} castShadow>
                    <meshStandardMaterial color="#e74c3c" roughness={0.5} />
                </Cylinder>
                {/* Top dome */}
                <Sphere args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 1.4, 0]} castShadow>
                    <meshStandardMaterial color="#e74c3c" roughness={0.5} />
                </Sphere>
                {/* Slot */}
                <Box args={[0.15, 0.02, 0.1]} position={[0, 1.25, 0.2]}>
                    <meshStandardMaterial color="#111" />
                </Box>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor
                onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Enviar Carta'))}
                onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[0.8, 1, 0.8]} position={[0, 1, 0]} />
            </RigidBody>
        </group>
    );
};

// Interactive Ice Cream Cart
export const IceCreamCart: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    const flavors = [
        { name: "Dulce de Leche", emoji: "🍦" },
        { name: "Chocolate", emoji: "🍫" },
        { name: "Frutilla", emoji: "🍓" },
        { name: "Limón", emoji: "🍋" },
        { name: "Menta Granizada", emoji: "🌿" }
    ];

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    const flavor = flavors[Math.floor(Math.random() * flavors.length)];
                    openDialogue("Carrito de Helados", `${flavor.emoji} ¡Pediste un helado de ${flavor.name}! ¡Delicioso!`);
                    playSound('gem');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
                {/* Cart body */}
                <Box args={[1.2, 0.8, 0.7]} position={[0, 0.6, 0]} castShadow>
                    <meshStandardMaterial color="#fff" roughness={0.4} />
                </Box>
                {/* Wheels */}
                <Cylinder args={[0.15, 0.15, 0.08]} position={[-0.5, 0.15, 0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <meshStandardMaterial color="#333" roughness={0.5} />
                </Cylinder>
                <Cylinder args={[0.15, 0.15, 0.08]} position={[0.5, 0.15, 0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <meshStandardMaterial color="#333" roughness={0.5} />
                </Cylinder>
                {/* Umbrella pole */}
                <Cylinder args={[0.03, 0.03, 1.2]} position={[0, 1.6, 0]} castShadow>
                    <meshStandardMaterial color="#8b4513" roughness={0.6} />
                </Cylinder>
                {/* Umbrella top */}
                <Cone args={[0.8, 0.4, 8]} position={[0, 2.3, 0]} castShadow>
                    <meshStandardMaterial color="#ff6b6b" roughness={0.6} />
                </Cone>
                {/* Ice cream display containers */}
                {[[-0.3, '#f5deb3'], [0, '#8b4513'], [0.3, '#ffb6c1']].map(([x, color], i) => (
                    <Cylinder key={i} args={[0.12, 0.15, 0.25]} position={[x as number, 1.1, 0]} castShadow>
                        <meshStandardMaterial color={color as string} roughness={0.3} />
                    </Cylinder>
                ))}
                {/* Sign */}
                <Box args={[0.6, 0.2, 0.02]} position={[0, 1.5, 0.36]}>
                    <meshStandardMaterial color="#ffeb3b" roughness={0.5} />
                </Box>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor
                onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Pedir Helado'))}
                onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1, 1.2, 1]} position={[0, 0.8, 0.5]} />
            </RigidBody>
        </group>
    );
};

// Gumball Machine
export const GumballMachine: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();
    const gumballsRef = useRef<Group>(null);

    // Animate gumballs slightly
    useFrame((state) => {
        if (gumballsRef.current) {
            gumballsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
        }
    });

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e91e63'];

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    const colorNames = ['rojo', 'azul', 'verde', 'naranja', 'violeta', 'rosa'];
                    const idx = Math.floor(Math.random() * colorNames.length);
                    openDialogue("Máquina de Chicles", `¡Salió un chicle ${colorNames[idx]}! 🔵`);
                    playSound('coin');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                {/* Base */}
                <Cylinder args={[0.2, 0.25, 0.3]} position={[0, 0.15, 0]} castShadow>
                    <meshStandardMaterial color="#c0392b" roughness={0.5} />
                </Cylinder>
                {/* Glass globe */}
                <Sphere args={[0.25, 16, 16]} position={[0, 0.55, 0]}>
                    <meshStandardMaterial color="#fff" transparent opacity={0.3} roughness={0.1} />
                </Sphere>
                {/* Gumballs inside */}
                <group ref={gumballsRef}>
                    {colors.map((color, i) => {
                        const angle = (i / colors.length) * Math.PI * 2;
                        const r = 0.1;
                        return (
                            <Sphere key={i} args={[0.05]} position={[Math.cos(angle) * r, 0.55 + (i % 2) * 0.05, Math.sin(angle) * r]}>
                                <meshStandardMaterial color={color} roughness={0.3} />
                            </Sphere>
                        );
                    })}
                </group>
                {/* Top cap */}
                <Cylinder args={[0.08, 0.15, 0.1]} position={[0, 0.85, 0]} castShadow>
                    <meshStandardMaterial color="#c0392b" roughness={0.5} />
                </Cylinder>
                {/* Coin slot */}
                <Box args={[0.05, 0.02, 0.15]} position={[0.18, 0.35, 0]}>
                    <meshStandardMaterial color="#333" metalness={0.6} />
                </Box>
                {/* Dispenser */}
                <Box args={[0.08, 0.08, 0.1]} position={[0, 0.05, 0.2]}>
                    <meshStandardMaterial color="#333" />
                </Box>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor
                onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Sacar Chicle'))}
                onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[0.6, 0.8, 0.6]} position={[0, 0.5, 0]} />
            </RigidBody>
        </group>
    );
};

export const ThrowableBall: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const rigidBody = useRef<RapierRigidBody>(null);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const playerRef = useGameStore(s => s.playerRef);
    const setHolding = useGameStore(s => s.setHolding);
    const [held, setHeld] = useState(false);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    // Subscribe to interact key for pickup/throw
    useEffect(() => {
        if (inRange || held) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    if (!held) {
                        // Pick Up
                        setHeld(true);
                        setHolding(true);
                        playSound('rustle');
                    } else {
                        // Throw
                        setHeld(false);
                        setHolding(false);
                        if (rigidBody.current && playerRef?.current) {
                            // Apply impulse in camera direction
                            // We don't have direct access to camera here inside useEffect easily without useThree,
                            // but we handle the throw logic in useFrame where we have state access or just set a flag
                            // Actually, let's just set a flag to throw in next frame
                        }
                        playSound('jump'); // Throw sound
                    }
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, held, setHolding, playerRef]);

    useFrame((state) => {
        if (!rigidBody.current) return;

        if (held && playerRef?.current) {
            // Keep object attached to player
            const playerPos = playerRef.current.translation();
            const camDir = new Vector3();
            state.camera.getWorldDirection(camDir);

            // Calculate hold position (slightly in front and up)
            const holdPos = new Vector3(playerPos.x, playerPos.y + 1.2, playerPos.z).add(camDir.clone().multiplyScalar(1.0));

            rigidBody.current.setTranslation(holdPos, true);
            rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

            // Interaction Label
            setInteractionLabel("Lanzar");
        } else if (!held && inRange) {
            const isHoldingGlobal = useGameStore.getState().isHolding;
            if (!isHoldingGlobal) setInteractionLabel("Agarrar Pelota");
        }
    });

    // Logic to handle throw impulse
    // We'll use a frame check to apply impulse if we just released it
    const wasHeld = useRef(false);
    useFrame((state) => {
        if (wasHeld.current && !held && rigidBody.current) {
            // Just released
            const camDir = new Vector3();
            state.camera.getWorldDirection(camDir);
            const force = 20;
            rigidBody.current.applyImpulse(camDir.multiplyScalar(force), true);
        }
        wasHeld.current = held;
    });

    return (
        <RigidBody
            ref={rigidBody}
            colliders="ball"
            restitution={0.8}
            friction={0.5}
            position={position}
            mass={1}
            canSleep={false}
        >
            <Sphere args={[0.3]} castShadow>
                <meshStandardMaterial color="#ff4444" roughness={0.4} />
            </Sphere>
            {/* Sensor for pickup range */}
            {!held && (
                <CuboidCollider
                    args={[1, 1, 1]}
                    sensor
                    onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && setInRange(true)}
                    onIntersectionExit={() => { setInRange(false); setInteractionLabel(null); }}
                />
            )}
        </RigidBody>
    )
}
