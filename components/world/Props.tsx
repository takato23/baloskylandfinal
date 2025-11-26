import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Cylinder, Torus, Cone, Sphere, useKeyboardControls } from '@react-three/drei';
import { useGameStore, Controls } from '../../store';
import { playSound } from '../../utils/audio';
import { Materials } from '../../utils/materials';

export const Fence: React.FC<{ position: [number, number, number], rotation?: [number, number, number], width?: number }> = ({ position, rotation = [0, 0, 0], width = 2 }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    openDialogue("Cerca de Madera", "La madera se siente tibia por el sol.");
                    playSound('rustle');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    const picketCount = Math.floor(width * 2.5);
    const picketSpacing = (width * 2) / picketCount;

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders={false} friction={0}>
                {/* Invisible Colliders for Physics */}
                {Array.from({ length: picketCount }).map((_, i) => {
                    const x = -width + i * picketSpacing;
                    return <CuboidCollider key={i} args={[0.04, 0.5, 0.04]} position={[x, 0.5, 0]} />;
                })}
                <CuboidCollider args={[width, 0.05, 0.04]} position={[0, 0.7, 0]} />
                <CuboidCollider args={[width, 0.05, 0.04]} position={[0, 0.3, 0]} />
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Apoyarse'))} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[width / 2, 1, 0.5]} position={[0, 0.5, 0]} />
            </RigidBody>

            {/* Picket fence posts with pointed tops */}
            {Array.from({ length: picketCount }).map((_, i) => {
                const x = -width + i * picketSpacing;
                return (
                    <group key={i} position={[x, 0, 0]}>
                        <Box args={[0.08, 0.9, 0.08]} position={[0, 0.45, 0]} castShadow>
                            <meshStandardMaterial color="#f5f5dc" roughness={0.85} />
                        </Box>
                        {/* Pointed top */}
                        <Cone args={[0.06, 0.15, 4]} position={[0, 0.98, 0]} castShadow>
                            <meshStandardMaterial color="#f5f5dc" roughness={0.85} />
                        </Cone>
                    </group>
                );
            })}

            {/* Horizontal rails */}
            <Box args={[width * 2, 0.06, 0.08]} position={[0, 0.7, 0]} castShadow>
                <meshStandardMaterial color="#e8e8d0" roughness={0.85} />
            </Box>
            <Box args={[width * 2, 0.06, 0.08]} position={[0, 0.3, 0]} castShadow>
                <meshStandardMaterial color="#e8e8d0" roughness={0.85} />
            </Box>
        </group>
    )
}

export const SpeedBump: React.FC<{ position: [number, number, number]; rotation: [number, number, number] }> = ({ position, rotation }) => (
    <group position={position} rotation={rotation}>
        <RigidBody type="fixed" colliders="cuboid" friction={1}>
            <Cylinder args={[0.2, 0.2, 5.5, 8]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.1, 1]} position={[0, 0.02, 0]}>
                <meshStandardMaterial color="#FBC02D" />
            </Cylinder>
            {/* Stripes */}
            <Box args={[0.5, 0.05, 0.22]} position={[-2, 0.025, 0]} material={Materials.TrafficBlack} />
            <Box args={[0.5, 0.05, 0.22]} position={[-1, 0.025, 0]} material={Materials.TrafficBlack} />
            <Box args={[0.5, 0.05, 0.22]} position={[0, 0.025, 0]} material={Materials.TrafficBlack} />
            <Box args={[0.5, 0.05, 0.22]} position={[1, 0.025, 0]} material={Materials.TrafficBlack} />
            <Box args={[0.5, 0.05, 0.22]} position={[2, 0.025, 0]} material={Materials.TrafficBlack} />
        </RigidBody>
    </group>
)

export const TrafficCone: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="dynamic" colliders="hull" friction={0.6} restitution={0.4} mass={0.5} position={position}>
        <group>
            <Box args={[0.4, 0.05, 0.4]} position={[0, 0.025, 0]}><meshStandardMaterial color="#ff6d00" /></Box>
            <Cone args={[0.15, 0.6, 16]} position={[0, 0.35, 0]}><meshStandardMaterial color="#ff6d00" /></Cone>
            <Torus args={[0.08, 0.02, 8, 16]} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} material={Materials.PaintWhite} />
        </group>
    </RigidBody>
)

export const BikeRack: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => (
    <RigidBody type="fixed" colliders="cuboid" friction={0} position={position} rotation={rotation}>
        <group>
            {/* Wave-like bike rack design */}
            <Torus args={[0.25, 0.04, 12, 20]} position={[-0.6, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <meshStandardMaterial color="#5a7d8a" roughness={0.4} metalness={0.7} />
            </Torus>
            <Torus args={[0.25, 0.04, 12, 20]} position={[-0.2, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <meshStandardMaterial color="#5a7d8a" roughness={0.4} metalness={0.7} />
            </Torus>
            <Torus args={[0.25, 0.04, 12, 20]} position={[0.2, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <meshStandardMaterial color="#5a7d8a" roughness={0.4} metalness={0.7} />
            </Torus>
            <Torus args={[0.25, 0.04, 12, 20]} position={[0.6, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <meshStandardMaterial color="#5a7d8a" roughness={0.4} metalness={0.7} />
            </Torus>

            {/* Connecting spiral elements */}
            <Torus args={[0.08, 0.03, 8, 16]} position={[-0.4, 0.28, 0]} rotation={[0, Math.PI / 2, Math.PI / 4]} castShadow>
                <meshStandardMaterial color="#6b8e9e" roughness={0.4} metalness={0.7} />
            </Torus>
            <Torus args={[0.08, 0.03, 8, 16]} position={[0, 0.28, 0]} rotation={[0, Math.PI / 2, -Math.PI / 4]} castShadow>
                <meshStandardMaterial color="#6b8e9e" roughness={0.4} metalness={0.7} />
            </Torus>
            <Torus args={[0.08, 0.03, 8, 16]} position={[0.4, 0.28, 0]} rotation={[0, Math.PI / 2, Math.PI / 4]} castShadow>
                <meshStandardMaterial color="#6b8e9e" roughness={0.4} metalness={0.7} />
            </Torus>

            {/* Base plate */}
            <Box args={[1.5, 0.04, 0.2]} position={[0, 0.02, 0]} castShadow>
                <meshStandardMaterial color="#4a5f6b" roughness={0.6} metalness={0.5} />
            </Box>
        </group>
    </RigidBody>
)

export const TrashCan: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const addCoin = useGameStore(s => s.addCoin);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [isDirty, setIsDirty] = useState(() => Math.random() < 0.5);
    const [subscribeKeys] = useKeyboardControls();

    useEffect(() => {
        if (inRange && !isHolding) {
            const action = isDirty ? 'Limpiar' : 'Revisar';
            setInteractionLabel(action);

            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    if (isDirty) {
                        setIsDirty(false);
                        addCoin(5);
                        playSound('coin');
                        openDialogue("¡Limpieza!", "Limpiaste la basura y encontraste 5 monedas.");
                        setInteractionLabel('Revisar');
                    } else {
                        openDialogue("Basura", "Ya está limpio.");
                        playSound('rustle');
                    }
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, isDirty, openDialogue, addCoin, setInteractionLabel, isHolding]);

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders={false} friction={0}>
                <CuboidCollider args={[0.25, 0.35, 0.25]} position={[0, 0.35, 0]} />
                <CuboidCollider args={[0.8, 1, 0.8]} position={[0, 0.5, 0]} sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && setInRange(true)} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))} />

                {/* Rounded body - park green color */}
                <Cylinder args={[0.28, 0.24, 0.65, 20]} position={[0, 0.33, 0]} castShadow>
                    <meshStandardMaterial color="#6b9e78" roughness={0.6} />
                </Cylinder>

                {/* Decorative bands */}
                <Torus args={[0.29, 0.025, 12, 20]} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#4a7056" roughness={0.7} />
                </Torus>
                <Torus args={[0.29, 0.025, 12, 20]} position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#4a7056" roughness={0.7} />
                </Torus>

                {/* Domed lid */}
                <Sphere args={[0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.66, 0]} castShadow>
                    <meshStandardMaterial color="#4a7056" roughness={0.5} />
                </Sphere>

                {/* Lid knob */}
                <Cylinder args={[0.06, 0.08, 0.1, 12]} position={[0, 0.8, 0]} castShadow>
                    <meshStandardMaterial color="#8db89a" roughness={0.6} />
                </Cylinder>

                {/* Recycling symbol embossed on side */}
                <Box args={[0.02, 0.15, 0.15]} position={[0, 0.4, 0.29]} castShadow>
                    <meshStandardMaterial color="#e8f5e9" roughness={0.8} />
                </Box>

                {isDirty && (
                    <group position={[0, 0.85, 0]}>
                        <Sphere args={[0.12]} position={[0.08, 0, 0]}><meshStandardMaterial color="#8d6e63" /></Sphere>
                        <Box args={[0.15, 0.15, 0.15]} position={[-0.08, 0.03, 0]} rotation={[0.4, 0.4, 0]}><meshStandardMaterial color="#eee" /></Box>
                    </group>
                )}
            </RigidBody>
        </group>
    )
}

export const ParkBin: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="fixed" colliders="cuboid" friction={0} position={position}>
        <group>
            <Cylinder args={[0.28, 0.28, 0.7, 8]} position={[0, 0.35, 0]} castShadow material={Materials.Brown} />
            <Cylinder args={[0.3, 0.3, 0.1, 8]} position={[0, 0.75, 0]} castShadow material={Materials.TrafficBlack} />
        </group>
    </RigidBody>
)

export const FireHydrant: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="fixed" colliders="cuboid" friction={0} position={position}>
        <group>
            {/* Base plate */}
            <Cylinder args={[0.22, 0.24, 0.08, 8]} position={[0, 0.04, 0]} castShadow>
                <meshStandardMaterial color="#cc3333" roughness={0.7} metalness={0.2} />
            </Cylinder>

            {/* Main body - bright red */}
            <Cylinder args={[0.14, 0.16, 0.55, 12]} position={[0, 0.32, 0]} castShadow>
                <meshStandardMaterial color="#e63946" roughness={0.5} metalness={0.3} />
            </Cylinder>

            {/* Top cap */}
            <Cylinder args={[0.16, 0.14, 0.12, 12]} position={[0, 0.65, 0]} castShadow>
                <meshStandardMaterial color="#cc3333" roughness={0.6} metalness={0.2} />
            </Cylinder>

            {/* Side outlet caps */}
            <Cylinder args={[0.06, 0.06, 0.15, 8]} position={[0.12, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <meshStandardMaterial color="#ffd700" roughness={0.4} metalness={0.6} />
            </Cylinder>
            <Cylinder args={[0.06, 0.06, 0.15, 8]} position={[-0.12, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <meshStandardMaterial color="#ffd700" roughness={0.4} metalness={0.6} />
            </Cylinder>

            {/* Chain detail */}
            <Torus args={[0.025, 0.008, 8, 12]} position={[0.18, 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={Materials.Silver} />
            <Torus args={[0.025, 0.008, 8, 12]} position={[0.18, 0.35, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={Materials.Silver} />

            {/* Center pentagon nut on top */}
            <Cylinder args={[0.08, 0.08, 0.06, 5]} position={[0, 0.74, 0]} castShadow>
                <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.7} />
            </Cylinder>
        </group>
    </RigidBody>
)

export const BirdBath: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="fixed" colliders="cuboid" friction={0} position={position}>
        <group>
            <Cylinder args={[0.1, 0.15, 0.6]} position={[0, 0.3, 0]} castShadow material={Materials.Stone} />
            <Cylinder args={[0.4, 0.1, 0.1]} position={[0, 0.65, 0]} castShadow material={Materials.Stone} />
            <Cylinder args={[0.35, 0.35, 0.05]} position={[0, 0.68, 0]} material={Materials.Water} />
        </group>
    </RigidBody>
)

export const Mailbox: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [subscribeKeys] = useKeyboardControls();
    const [inRange, setInRange] = useState(false);

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (p) => p && (openDialogue("Buzon", "Esta vacio!"), playSound('gem')), { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders={false} friction={0}>
                <CuboidCollider args={[0.1, 0.6, 0.1]} position={[0, 0.6, 0]} />
                <CuboidCollider args={[1, 1, 1]} position={[0, 1, 0.5]} sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel("Mirar Cartas"))} onIntersectionExit={() => (setInteractionLabel(null), setInRange(false))} />

                <Box args={[0.1, 1.2, 0.1]} position={[0, 0.6, 0]} castShadow material={Materials.Brown} />
                <Box args={[0.6, 0.4, 0.8]} position={[0, 1.2, 0]} castShadow><meshStandardMaterial color="#90CAF9" /></Box>
            </RigidBody>
        </group>
    );
}

export const Bench: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const startSitting = useGameStore(s => s.startSitting);
    const isHolding = useGameStore(s => s.isHolding);
    const [subscribeKeys] = useKeyboardControls();
    const [inRange, setInRange] = useState(false);

    useEffect(() => {
        if (inRange && !isHolding) {
            setInteractionLabel("Sentarse");
            const sub = subscribeKeys((state) => state[Controls.interact], (p) => {
                if (p) startSitting([position[0], position[1] + 0.6, position[2]], rotation);
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, setInteractionLabel, startSitting, position, rotation, subscribeKeys, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders={false} friction={0}>
                <CuboidCollider args={[1, 0.1, 0.4]} position={[0, 0.5, 0]} />
                <CuboidCollider args={[1.2, 1, 0.8]} position={[0, 0.5, 0]} sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && setInRange(true)} onIntersectionExit={() => (setInteractionLabel(null), setInRange(false))} />

                {/* Curved seat made of multiple segments */}
                <Box args={[0.4, 0.08, 0.7]} position={[-0.8, 0.5, 0]} rotation={[0.05, 0, 0]} castShadow receiveShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>
                <Box args={[0.4, 0.08, 0.7]} position={[-0.4, 0.52, 0]} rotation={[0.02, 0, 0]} castShadow receiveShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>
                <Box args={[0.4, 0.08, 0.7]} position={[0, 0.53, 0]} castShadow receiveShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>
                <Box args={[0.4, 0.08, 0.7]} position={[0.4, 0.52, 0]} rotation={[-0.02, 0, 0]} castShadow receiveShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>
                <Box args={[0.4, 0.08, 0.7]} position={[0.8, 0.5, 0]} rotation={[-0.05, 0, 0]} castShadow receiveShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>

                {/* Individual backrest slats */}
                <Box args={[0.08, 0.5, 0.08]} position={[-0.8, 0.9, -0.3]} castShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>
                <Box args={[0.08, 0.5, 0.08]} position={[-0.4, 0.9, -0.3]} castShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>
                <Box args={[0.08, 0.5, 0.08]} position={[0, 0.9, -0.3]} castShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>
                <Box args={[0.08, 0.5, 0.08]} position={[0.4, 0.9, -0.3]} castShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>
                <Box args={[0.08, 0.5, 0.08]} position={[0.8, 0.9, -0.3]} castShadow><meshStandardMaterial color="#a0714f" roughness={0.8} /></Box>

                {/* Decorative spiral legs */}
                <Torus args={[0.12, 0.04, 8, 12]} position={[-0.9, 0.3, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Bronze} />
                <Cylinder args={[0.06, 0.08, 0.3, 8]} position={[-0.9, 0.15, 0.3]} castShadow material={Materials.Bronze} />
                <Torus args={[0.12, 0.04, 8, 12]} position={[0.9, 0.3, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Bronze} />
                <Cylinder args={[0.06, 0.08, 0.3, 8]} position={[0.9, 0.15, 0.3]} castShadow material={Materials.Bronze} />
                <Torus args={[0.12, 0.04, 8, 12]} position={[-0.9, 0.3, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Bronze} />
                <Cylinder args={[0.06, 0.08, 0.3, 8]} position={[-0.9, 0.15, -0.3]} castShadow material={Materials.Bronze} />
                <Torus args={[0.12, 0.04, 8, 12]} position={[0.9, 0.3, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Bronze} />
                <Cylinder args={[0.06, 0.08, 0.3, 8]} position={[0.9, 0.15, -0.3]} castShadow material={Materials.Bronze} />
            </RigidBody>
        </group>
    );
}

export const TrafficLight: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; type?: 'NS' | 'EW' }> = ({ position, rotation = [0, 0, 0], type = 'NS' }) => {
    const trafficState = useGameStore(s => s.trafficState);

    let greenActive = false;
    let yellowActive = false;
    let redActive = false;

    if (type === 'NS') {
        if (trafficState === 'NS_GREEN') greenActive = true;
        else if (trafficState === 'NS_YELLOW') yellowActive = true;
        else redActive = true;
    } else {
        if (trafficState === 'EW_GREEN') greenActive = true;
        else if (trafficState === 'EW_YELLOW') yellowActive = true;
        else redActive = true;
    }

    // Scaled down cozy version - 2.5m tall instead of 4m
    return (
        <RigidBody type="fixed" colliders={false} position={position} rotation={rotation} friction={0}>
            <CuboidCollider args={[0.08, 1.1, 0.08]} position={[0, 1.1, 0]} />
            <CuboidCollider args={[0.2, 0.4, 0.15]} position={[0, 2.1, 0]} />

            <group>
                {/* Cute round base */}
                <Cylinder args={[0.25, 0.3, 0.1, 12]} position={[0, 0.05, 0]} receiveShadow>
                    <meshStandardMaterial color="#4a5568" roughness={0.6} />
                </Cylinder>
                {/* Thinner, shorter pole */}
                <Cylinder args={[0.07, 0.09, 2.2, 10]} position={[0, 1.15, 0]} castShadow>
                    <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.3} />
                </Cylinder>
                {/* Rounded housing with cute visor */}
                <Box args={[0.4, 0.75, 0.32]} position={[0, 2.1, 0]} castShadow>
                    <meshStandardMaterial color="#1f2937" roughness={0.4} />
                </Box>
                {/* Top cap */}
                <Cylinder args={[0.22, 0.22, 0.08, 8]} position={[0, 2.52, 0]} castShadow>
                    <meshStandardMaterial color="#374151" roughness={0.5} />
                </Cylinder>
                {/* Visor/hood over lights */}
                <Box args={[0.42, 0.06, 0.18]} position={[0, 2.35, 0.22]} castShadow>
                    <meshStandardMaterial color="#1f2937" roughness={0.4} />
                </Box>
                {/* Red */}
                <Sphere args={[0.1]} position={[0, 2.32, 0.14]}>
                    <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={redActive ? 3 : 0.15} toneMapped={false} />
                </Sphere>
                {/* Amber */}
                <Sphere args={[0.1]} position={[0, 2.1, 0.14]}>
                    <meshStandardMaterial color="#ffbb33" emissive="#ffbb00" emissiveIntensity={yellowActive ? 3 : 0.15} toneMapped={false} />
                </Sphere>
                {/* Green */}
                <Sphere args={[0.1]} position={[0, 1.88, 0.14]}>
                    <meshStandardMaterial color="#00cc66" emissive="#00ff00" emissiveIntensity={greenActive ? 3 : 0.15} toneMapped={false} />
                </Sphere>
            </group>
        </RigidBody>
    );
};

export const StreetLamp: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const isNight = useGameStore(s => s.isNight);
    const bulbMesh = useRef<any>(null);
    const glowRef = useRef<any>(null);
    const lightRef = useRef<any>(null);
    const seed = useRef(Math.random());

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        let targetEmissive = 0, targetGlow = 0, targetIntensity = 0;
        if (isNight) {
            const flicker = Math.sin(t * 2 + seed.current * 10) * 0.04 + Math.cos(t * 13) * 0.015;
            targetEmissive = 2.5 + flicker;
            targetGlow = 0.35 + flicker * 0.08;
            targetIntensity = 6 + flicker * 1.5;
            if (bulbMesh.current) bulbMesh.current.material.color.setHSL(0.12 + flicker * 0.008, 0.85, 0.55);
        }
        if (bulbMesh.current) bulbMesh.current.material.emissiveIntensity = MathUtils.lerp(bulbMesh.current.material.emissiveIntensity, targetEmissive, 0.1);
        if (glowRef.current) glowRef.current.material.opacity = MathUtils.lerp(glowRef.current.material.opacity, targetGlow, 0.05);
        if (lightRef.current) lightRef.current.intensity = MathUtils.lerp(lightRef.current.intensity, targetIntensity, 0.1);
    });

    return (
        <RigidBody type="fixed" colliders="hull" position={position} rotation={rotation} friction={0}>
            <group>
                {/* Ornate base */}
                <Cylinder args={[0.25, 0.28, 0.15, 8]} position={[0, 0.08, 0]} castShadow material={Materials.Bronze} />
                <Cylinder args={[0.22, 0.22, 0.1, 8]} position={[0, 0.2, 0]} castShadow material={Materials.TrafficBlack} />

                {/* Main post with Victorian details */}
                <Cylinder args={[0.09, 0.11, 3, 12]} position={[0, 1.7, 0]} castShadow material={Materials.TrafficBlack} />

                {/* Decorative bands */}
                <Torus args={[0.12, 0.03, 8, 12]} position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Bronze} />
                <Torus args={[0.12, 0.03, 8, 12]} position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Bronze} />

                {/* Curved hook arm */}
                <Torus args={[0.3, 0.05, 8, 12]} position={[0, 3.2, 0]} rotation={[0, 0, Math.PI / 2]} material={Materials.TrafficBlack} />
                <Cylinder args={[0.05, 0.05, 0.4, 8]} position={[0.3, 3.3, 0]} rotation={[0, 0, Math.PI / 4]} castShadow material={Materials.TrafficBlack} />

                {/* Victorian lantern box with roof */}
                <group position={[0.5, 3.1, 0]}>
                    {/* Lantern box frame */}
                    <Box args={[0.4, 0.5, 0.4]} position={[0, 0, 0]} material={Materials.TrafficBlack} />

                    {/* Glass panels */}
                    <Box args={[0.35, 0.45, 0.02]} position={[0, 0, 0.19]}><meshStandardMaterial color="#ffe6cc" transparent opacity={0.3} roughness={0.1} /></Box>
                    <Box args={[0.35, 0.45, 0.02]} position={[0, 0, -0.19]}><meshStandardMaterial color="#ffe6cc" transparent opacity={0.3} roughness={0.1} /></Box>
                    <Box args={[0.02, 0.45, 0.35]} position={[0.19, 0, 0]}><meshStandardMaterial color="#ffe6cc" transparent opacity={0.3} roughness={0.1} /></Box>
                    <Box args={[0.02, 0.45, 0.35]} position={[-0.19, 0, 0]}><meshStandardMaterial color="#ffe6cc" transparent opacity={0.3} roughness={0.1} /></Box>

                    {/* Pyramid roof */}
                    <Cone args={[0.28, 0.25, 4]} position={[0, 0.38, 0]} castShadow material={Materials.Bronze} />
                    <Sphere args={[0.05]} position={[0, 0.55, 0]} castShadow material={Materials.Gold} />

                    {/* Light source inside */}
                    <Sphere ref={bulbMesh} args={[0.12]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#ffe8cc" emissive="#ffcc88" emissiveIntensity={0} toneMapped={false} />
                    </Sphere>
                    <Sphere ref={glowRef} args={[0.7]} position={[0, 0, 0]}>
                        <meshBasicMaterial color="#ffcc88" transparent opacity={0} depthWrite={false} />
                    </Sphere>
                    <pointLight ref={lightRef} color="#ffcc88" distance={10} decay={2} intensity={0} />
                </group>
            </group>
        </RigidBody>
    )
}

export const ParkLampPost: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const isNight = useGameStore(s => s.isNight);
    const bulbMesh1 = useRef<any>(null);
    const bulbMesh2 = useRef<any>(null);
    const glowRef1 = useRef<any>(null);
    const glowRef2 = useRef<any>(null);
    const lightRef1 = useRef<any>(null);
    const lightRef2 = useRef<any>(null);
    const seed = useRef(Math.random());

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        let targetEmissive = 0, targetGlow = 0, targetIntensity = 0;
        if (isNight) {
            const flicker = Math.sin(t * 2 + seed.current * 10) * 0.03 + Math.cos(t * 11) * 0.012;
            targetEmissive = 2.8 + flicker;
            targetGlow = 0.4 + flicker * 0.1;
            targetIntensity = 7 + flicker * 1.8;
            if (bulbMesh1.current) bulbMesh1.current.material.color.setHSL(0.12 + flicker * 0.008, 0.85, 0.55);
            if (bulbMesh2.current) bulbMesh2.current.material.color.setHSL(0.12 + flicker * 0.008, 0.85, 0.55);
        }
        if (bulbMesh1.current) bulbMesh1.current.material.emissiveIntensity = MathUtils.lerp(bulbMesh1.current.material.emissiveIntensity, targetEmissive, 0.1);
        if (bulbMesh2.current) bulbMesh2.current.material.emissiveIntensity = MathUtils.lerp(bulbMesh2.current.material.emissiveIntensity, targetEmissive, 0.1);
        if (glowRef1.current) glowRef1.current.material.opacity = MathUtils.lerp(glowRef1.current.material.opacity, targetGlow, 0.05);
        if (glowRef2.current) glowRef2.current.material.opacity = MathUtils.lerp(glowRef2.current.material.opacity, targetGlow, 0.05);
        if (lightRef1.current) lightRef1.current.intensity = MathUtils.lerp(lightRef1.current.intensity, targetIntensity, 0.1);
        if (lightRef2.current) lightRef2.current.intensity = MathUtils.lerp(lightRef2.current.intensity, targetIntensity, 0.1);
    });

    return (
        <RigidBody type="fixed" colliders="hull" position={position} rotation={rotation} friction={0}>
            <group>
                {/* Ornate base */}
                <Cylinder args={[0.3, 0.35, 0.2, 12]} position={[0, 0.1, 0]} castShadow material={Materials.Bronze} />
                <Torus args={[0.32, 0.04, 12, 16]} position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Gold} />

                {/* Main post */}
                <Cylinder args={[0.1, 0.12, 3.2, 12]} position={[0, 1.8, 0]} castShadow material={Materials.TrafficBlack} />

                {/* Decorative bands */}
                <Torus args={[0.13, 0.035, 10, 16]} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Bronze} />
                <Torus args={[0.13, 0.035, 10, 16]} position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.Bronze} />

                {/* Top ornament */}
                <Sphere args={[0.15, 16, 16]} position={[0, 3.5, 0]} castShadow material={Materials.Gold} />

                {/* Left lantern */}
                <group position={[-0.5, 3.2, 0]}>
                    <Torus args={[0.15, 0.04, 8, 12]} position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={Materials.TrafficBlack} />
                    <Box args={[0.35, 0.45, 0.35]} position={[0, -0.1, 0]} material={Materials.TrafficBlack} />
                    <Box args={[0.3, 0.4, 0.02]} position={[0, -0.1, 0.165]}><meshStandardMaterial color="#ffe6cc" transparent opacity={0.3} roughness={0.1} /></Box>
                    <Box args={[0.3, 0.4, 0.02]} position={[0, -0.1, -0.165]}><meshStandardMaterial color="#ffe6cc" transparent opacity={0.3} roughness={0.1} /></Box>
                    <Cone args={[0.24, 0.22, 4]} position={[0, 0.18, 0]} castShadow material={Materials.Bronze} />
                    <Sphere ref={bulbMesh1} args={[0.1]} position={[0, -0.1, 0]}><meshStandardMaterial color="#ffe8cc" emissive="#ffcc88" emissiveIntensity={0} toneMapped={false} /></Sphere>
                    <Sphere ref={glowRef1} args={[0.6]} position={[0, -0.1, 0]}><meshBasicMaterial color="#ffcc88" transparent opacity={0} depthWrite={false} /></Sphere>
                    <pointLight ref={lightRef1} color="#ffcc88" distance={9} decay={2} intensity={0} />
                </group>

                {/* Right lantern */}
                <group position={[0.5, 3.2, 0]}>
                    <Torus args={[0.15, 0.04, 8, 12]} position={[-0.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={Materials.TrafficBlack} />
                    <Box args={[0.35, 0.45, 0.35]} position={[0, -0.1, 0]} material={Materials.TrafficBlack} />
                    <Box args={[0.3, 0.4, 0.02]} position={[0, -0.1, 0.165]}><meshStandardMaterial color="#ffe6cc" transparent opacity={0.3} roughness={0.1} /></Box>
                    <Box args={[0.3, 0.4, 0.02]} position={[0, -0.1, -0.165]}><meshStandardMaterial color="#ffe6cc" transparent opacity={0.3} roughness={0.1} /></Box>
                    <Cone args={[0.24, 0.22, 4]} position={[0, 0.18, 0]} castShadow material={Materials.Bronze} />
                    <Sphere ref={bulbMesh2} args={[0.1]} position={[0, -0.1, 0]}><meshStandardMaterial color="#ffe8cc" emissive="#ffcc88" emissiveIntensity={0} toneMapped={false} /></Sphere>
                    <Sphere ref={glowRef2} args={[0.6]} position={[0, -0.1, 0]}><meshBasicMaterial color="#ffcc88" transparent opacity={0} depthWrite={false} /></Sphere>
                    <pointLight ref={lightRef2} color="#ffcc88" distance={9} decay={2} intensity={0} />
                </group>
            </group>
        </RigidBody>
    )
}

export const FlowerBasket: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => (
    <group position={position} rotation={rotation}>
        {/* Hanging chain */}
        <Cylinder args={[0.01, 0.01, 0.4, 6]} position={[0, 0.6, 0]}>
            <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.8} />
        </Cylinder>

        {/* Basket */}
        <group position={[0, 0.3, 0]}>
            {/* Wicker basket body */}
            <Cylinder args={[0.22, 0.18, 0.25, 12]} position={[0, 0, 0]} castShadow>
                <meshStandardMaterial color="#8b7355" roughness={0.9} />
            </Cylinder>

            {/* Basket rim */}
            <Torus args={[0.23, 0.02, 8, 12]} position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <meshStandardMaterial color="#6b5848" roughness={0.9} />
            </Torus>

            {/* Flowers - Pink */}
            <Sphere args={[0.08, 8, 8]} position={[0.12, 0.2, 0.08]} castShadow>
                <meshStandardMaterial color="#ff9eb5" roughness={0.8} />
            </Sphere>
            <Sphere args={[0.08, 8, 8]} position={[-0.1, 0.22, -0.08]} castShadow>
                <meshStandardMaterial color="#ff9eb5" roughness={0.8} />
            </Sphere>

            {/* Flowers - Purple */}
            <Sphere args={[0.07, 8, 8]} position={[0.08, 0.25, -0.12]} castShadow>
                <meshStandardMaterial color="#c8a2e0" roughness={0.8} />
            </Sphere>
            <Sphere args={[0.07, 8, 8]} position={[-0.12, 0.18, 0.1]} castShadow>
                <meshStandardMaterial color="#c8a2e0" roughness={0.8} />
            </Sphere>

            {/* Flowers - White */}
            <Sphere args={[0.06, 8, 8]} position={[0, 0.28, 0]} castShadow>
                <meshStandardMaterial color="#fff5f8" roughness={0.8} />
            </Sphere>

            {/* Green leaves/foliage */}
            <Sphere args={[0.15, 8, 8]} position={[0, 0.08, 0]} castShadow>
                <meshStandardMaterial color="#7cb879" roughness={0.9} />
            </Sphere>
            <Cone args={[0.05, 0.15, 6]} position={[0.15, 0.1, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
                <meshStandardMaterial color="#6ba869" roughness={0.9} />
            </Cone>
            <Cone args={[0.05, 0.15, 6]} position={[-0.15, 0.12, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
                <meshStandardMaterial color="#6ba869" roughness={0.9} />
            </Cone>
        </group>
    </group>
)
