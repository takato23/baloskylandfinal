import React, { useRef, useState } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Sphere, Cone, Cylinder } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, MathUtils } from 'three';
import { playSound } from '../../utils/audio';
import { Materials } from '../../utils/materials';

export const InteractiveBush: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const groupRef = useRef<Group>(null);
    const [hovered, setHovered] = useState(false);
    const wobbleTime = useRef(0);

    useFrame((state, delta) => {
        if (hovered && groupRef.current) {
            wobbleTime.current += delta * 15;
            const scale = 1 + Math.sin(wobbleTime.current) * 0.08;
            const rot = Math.sin(wobbleTime.current * 0.6) * 0.08;
            groupRef.current.scale.set(scale, scale, scale);
            groupRef.current.rotation.z = rot;
        } else if (groupRef.current) {
            groupRef.current.scale.lerp(new Vector3(1, 1, 1), 0.15);
            groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0, 0.15);
            wobbleTime.current = 0;
        }
    });

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders={false} sensor onIntersectionEnter={() => { setHovered(true); playSound('rustle'); }} onIntersectionExit={() => setHovered(false)}>
                <CuboidCollider args={[0.6, 0.6, 0.6]} position={[0, 0.5, 0]} />
            </RigidBody>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                <group ref={groupRef}>
                    {/* Main bush body with varied sphere sizes */}
                    <Sphere args={[0.45]} position={[0, 0.35, 0]} castShadow material={Materials.DarkGreen} />
                    <Sphere args={[0.4]} position={[0.25, 0.25, 0.15]} castShadow material={Materials.DarkGreen} />
                    <Sphere args={[0.35]} position={[-0.25, 0.25, -0.1]} castShadow material={Materials.DarkGreen} />
                    <Sphere args={[0.3]} position={[0.15, 0.45, -0.2]} castShadow material={Materials.DarkGreen} />
                    <Sphere args={[0.28]} position={[-0.2, 0.4, 0.15]} castShadow material={Materials.DarkGreen} />

                    {/* Small colorful flowers scattered on bush */}
                    <Sphere args={[0.08]} position={[0.25, 0.5, 0.2]}><meshStandardMaterial color="#ff69b4" /></Sphere>
                    <Sphere args={[0.07]} position={[-0.15, 0.55, -0.1]}><meshStandardMaterial color="#ffd700" /></Sphere>
                    <Sphere args={[0.08]} position={[0.1, 0.6, 0.1]}><meshStandardMaterial color="#ffffff" /></Sphere>
                    <Sphere args={[0.07]} position={[-0.25, 0.45, 0.2]}><meshStandardMaterial color="#ff8c94" /></Sphere>
                </group>
            </RigidBody>
        </group>
    )
}

export const Planter: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="fixed" colliders="hull" friction={0}>
        <group position={position}>
            <Box args={[0.8, 0.6, 0.8]} position={[0, 0.3, 0]} castShadow material={Materials.Brown} />
            <Box args={[0.6, 0.1, 0.6]} position={[0, 0.6, 0]} material={Materials.DarkGreen} />
            <Cone args={[0.3, 0.6, 8]} position={[0, 0.8, 0]} castShadow material={Materials.DarkGreen} />
            <Sphere args={[0.1]} position={[0.2, 0.8, 0.2]}><meshStandardMaterial color="#ff69b4" /></Sphere>
            <Sphere args={[0.1]} position={[-0.1, 0.9, -0.1]}><meshStandardMaterial color="#ffd700" /></Sphere>
        </group>
    </RigidBody>
)

export const FlowerPot: React.FC<{ position: [number, number, number], color?: string }> = ({ position, color = "purple" }) => (
    <RigidBody type="fixed" colliders="hull" friction={0}>
        <group position={position}>
            <Cylinder args={[0.15, 0.1, 0.25, 8]} position={[0, 0.125, 0]} castShadow material={Materials.Terracotta} />
            <Sphere args={[0.15]} position={[0, 0.25, 0]} material={Materials.DarkGreen} />
            <Sphere args={[0.08]} position={[0, 0.35, 0.05]}><meshStandardMaterial color={color} /></Sphere>
        </group>
    </RigidBody>
)

export const FlowerPatch: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const groupRef = useRef<Group>(null);
    const [hovered, setHovered] = useState(false);
    const flowerColors = ['#ff69b4', '#ffd700', '#ffffff', '#ff8c94', '#ba68c8', '#4fc3f7'];

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        }
    });

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders={false} sensor onIntersectionEnter={() => { setHovered(true); playSound('rustle') }} onIntersectionExit={() => setHovered(false)}>
                <CuboidCollider args={[0.8, 0.5, 0.8]} position={[0, 0.2, 0]} />
            </RigidBody>
            <group ref={groupRef}>
                <Box args={[1.2, 0.1, 1.2]} position={[0, 0.05, 0]} receiveShadow material={Materials.DarkGreen} />
                {/* Flowers with petals (circle of small spheres) and stems */}
                {[...Array(8)].map((_, i) => {
                    const x = (Math.random() - 0.5) * 0.9;
                    const z = (Math.random() - 0.5) * 0.9;
                    const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                    return (
                        <group key={i} position={[x, 0.1, z]}>
                            {/* Stem */}
                            <Cylinder args={[0.02, 0.02, 0.3, 4]} position={[0, 0.15, 0]} material={Materials.DarkGreen} />
                            {/* Center */}
                            <Sphere args={[0.06]} position={[0, 0.32, 0]}><meshStandardMaterial color="#ffd700" /></Sphere>
                            {/* Petals in circle */}
                            {[...Array(5)].map((_, p) => {
                                const angle = (p / 5) * Math.PI * 2;
                                const px = Math.cos(angle) * 0.08;
                                const pz = Math.sin(angle) * 0.08;
                                return <Sphere key={p} args={[0.05]} position={[px, 0.32, pz]}><meshStandardMaterial color={color} /></Sphere>
                            })}
                        </group>
                    )
                })}
            </group>
        </group>
    )
}

export const Tree: React.FC<{ position: [number, number, number]; scale?: number; withFruits?: boolean }> = ({ position, scale = 1, withFruits = false }) => {
    const fruitColors = ['#ff6b6b', '#ffd93d', '#6bcf7f'];
    const fruitColor = fruitColors[Math.floor(Math.random() * fruitColors.length)];

    return (
        <RigidBody type="fixed" colliders="hull" position={position} scale={scale} friction={0}>
            <group>
                {/* Thicker, slightly curved trunk */}
                <Cylinder args={[0.25, 0.35, 1.8, 8]} position={[0, 0.9, 0]} castShadow receiveShadow material={Materials.Brown} />

                {/* Rounded foliage made of multiple spheres */}
                <Sphere args={[0.9]} position={[0, 2.2, 0]} castShadow receiveShadow material={Materials.DarkGreen} />
                <Sphere args={[0.8]} position={[0.5, 2.5, 0.3]} castShadow receiveShadow material={Materials.DarkGreen} />
                <Sphere args={[0.75]} position={[-0.4, 2.4, -0.2]} castShadow receiveShadow material={Materials.DarkGreen} />
                <Sphere args={[0.7]} position={[0.3, 2.8, -0.3]} castShadow receiveShadow material={Materials.DarkGreen} />
                <Sphere args={[0.7]} position={[-0.3, 2.7, 0.4]} castShadow receiveShadow material={Materials.DarkGreen} />
                <Sphere args={[0.65]} position={[0, 3.1, 0]} castShadow receiveShadow material={Materials.DarkGreen} />

                {/* Optional fruit spheres */}
                {withFruits && (
                    <>
                        <Sphere args={[0.12]} position={[0.6, 2.3, 0.2]}><meshStandardMaterial color={fruitColor} /></Sphere>
                        <Sphere args={[0.11]} position={[-0.5, 2.5, 0.3]}><meshStandardMaterial color={fruitColor} /></Sphere>
                        <Sphere args={[0.13]} position={[0.3, 2.7, -0.4]}><meshStandardMaterial color={fruitColor} /></Sphere>
                        <Sphere args={[0.1]} position={[-0.2, 2.9, 0.1]}><meshStandardMaterial color={fruitColor} /></Sphere>
                    </>
                )}
            </group>
        </RigidBody>
    );
};

export const RoundTree: React.FC<{ position: [number, number, number]; scale?: number; foliageColor?: string; withFruits?: boolean }> = ({
    position,
    scale = 1,
    foliageColor = '#4c7152',
    withFruits = false
}) => {
    const fruitColors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#ff69b4'];
    const fruitColor = fruitColors[Math.floor(Math.random() * fruitColors.length)];

    return (
        <RigidBody type="fixed" colliders="hull" position={position} scale={scale} friction={0}>
            <group>
                {/* Short, thick trunk - Animal Crossing style */}
                <Cylinder args={[0.35, 0.45, 1.2, 8]} position={[0, 0.6, 0]} castShadow receiveShadow material={Materials.Brown} />

                {/* Perfect spherical foliage */}
                <Sphere args={[1.2]} position={[0, 2.1, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={foliageColor} flatShading />
                </Sphere>

                {/* Optional decorative fruits/flowers */}
                {withFruits && (
                    <>
                        <Sphere args={[0.15]} position={[0.8, 2.0, 0.5]}><meshStandardMaterial color={fruitColor} /></Sphere>
                        <Sphere args={[0.14]} position={[-0.7, 2.2, -0.4]}><meshStandardMaterial color={fruitColor} /></Sphere>
                        <Sphere args={[0.13]} position={[0.5, 2.6, -0.6]}><meshStandardMaterial color={fruitColor} /></Sphere>
                        <Sphere args={[0.15]} position={[-0.6, 2.5, 0.5]}><meshStandardMaterial color={fruitColor} /></Sphere>
                        <Sphere args={[0.12]} position={[0.3, 2.9, 0.2]}><meshStandardMaterial color={fruitColor} /></Sphere>
                    </>
                )}
            </group>
        </RigidBody>
    );
};

export const FlowerBush: React.FC<{ position: [number, number, number]; flowerColor?: string }> = ({
    position,
    flowerColor = '#ff69b4'
}) => {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.03;
        }
    });

    return (
        <RigidBody type="fixed" colliders="hull" position={position} friction={0}>
            <group ref={groupRef}>
                {/* Base bush structure */}
                <Sphere args={[0.5]} position={[0, 0.4, 0]} castShadow material={Materials.DarkGreen} />
                <Sphere args={[0.45]} position={[0.3, 0.35, 0.2]} castShadow material={Materials.DarkGreen} />
                <Sphere args={[0.4]} position={[-0.3, 0.3, -0.1]} castShadow material={Materials.DarkGreen} />

                {/* Many small flowers scattered on top */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i / 12) * Math.PI * 2;
                    const radius = 0.3 + Math.random() * 0.2;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    const y = 0.5 + Math.random() * 0.2;
                    return (
                        <Sphere key={i} args={[0.08]} position={[x, y, z]}>
                            <meshStandardMaterial color={flowerColor} />
                        </Sphere>
                    );
                })}
            </group>
        </RigidBody>
    );
};

export const TallGrass: React.FC<{ position: [number, number, number]; bladeCount?: number }> = ({
    position,
    bladeCount = 8
}) => {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle wind animation
            const windStrength = Math.sin(state.clock.elapsedTime * 2) * 0.08;
            groupRef.current.rotation.z = windStrength;
            groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 1.5) * 0.05;
        }
    });

    return (
        <group position={position}>
            <group ref={groupRef}>
                {[...Array(bladeCount)].map((_, i) => {
                    const angle = (i / bladeCount) * Math.PI * 2;
                    const radius = Math.random() * 0.15;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    const height = 0.4 + Math.random() * 0.2;
                    const tilt = (Math.random() - 0.5) * 0.2;

                    return (
                        <group key={i} position={[x, 0, z]} rotation={[0, 0, tilt]}>
                            {/* Grass blade - thin cylinder */}
                            <Cylinder args={[0.01, 0.02, height, 4]} position={[0, height / 2, 0]} material={Materials.DarkGreen} />
                            {/* Pointed tip */}
                            <Cone args={[0.02, 0.08, 4]} position={[0, height + 0.04, 0]} material={Materials.DarkGreen} />
                        </group>
                    );
                })}
            </group>
        </group>
    );
};

// ============================================
// ENHANCED VEGETATION VARIETIES
// ============================================

// Pine/Conifer tree - triangular shape
export const PineTree: React.FC<{ position: [number, number, number]; scale?: number; snowCovered?: boolean }> = ({
    position,
    scale = 1,
    snowCovered = false
}) => {
    const foliageColor = snowCovered ? '#a8d8c8' : '#2d5a3a';

    return (
        <RigidBody type="fixed" colliders="hull" position={position} scale={scale} friction={0}>
            <group>
                {/* Trunk */}
                <Cylinder args={[0.15, 0.2, 1.0, 6]} position={[0, 0.5, 0]} castShadow receiveShadow material={Materials.Brown} />

                {/* Layered cones for pine foliage */}
                <Cone args={[0.9, 1.2, 8]} position={[0, 1.6, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={foliageColor} flatShading />
                </Cone>
                <Cone args={[0.7, 1.0, 8]} position={[0, 2.4, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={foliageColor} flatShading />
                </Cone>
                <Cone args={[0.5, 0.8, 8]} position={[0, 3.1, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={foliageColor} flatShading />
                </Cone>
                <Cone args={[0.3, 0.6, 8]} position={[0, 3.6, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={foliageColor} flatShading />
                </Cone>

                {/* Snow caps if covered */}
                {snowCovered && (
                    <>
                        <Cone args={[0.4, 0.2, 8]} position={[0, 2.2, 0]} rotation={[Math.PI, 0, 0]}>
                            <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
                        </Cone>
                        <Cone args={[0.3, 0.15, 8]} position={[0, 2.9, 0]} rotation={[Math.PI, 0, 0]}>
                            <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
                        </Cone>
                    </>
                )}
            </group>
        </RigidBody>
    );
};

// Willow tree - drooping branches
export const WillowTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
    position,
    scale = 1
}) => {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle sway
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
        }
    });

    return (
        <RigidBody type="fixed" colliders="hull" position={position} scale={scale} friction={0}>
            <group ref={groupRef}>
                {/* Trunk - thicker at base */}
                <Cylinder args={[0.25, 0.4, 2.0, 8]} position={[0, 1.0, 0]} castShadow receiveShadow material={Materials.Brown} />

                {/* Main canopy */}
                <Sphere args={[1.0]} position={[0, 2.5, 0]} castShadow receiveShadow material={Materials.DarkGreen} />

                {/* Drooping branches (represented as elongated shapes) */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i / 12) * Math.PI * 2;
                    const x = Math.cos(angle) * 0.8;
                    const z = Math.sin(angle) * 0.8;
                    const length = 1.5 + Math.random() * 0.5;

                    return (
                        <Cylinder
                            key={i}
                            args={[0.05, 0.08, length, 4]}
                            position={[x, 2.0 - length / 2, z]}
                            rotation={[(Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3]}
                            castShadow
                        >
                            <meshStandardMaterial color="#5a8a5a" roughness={0.8} />
                        </Cylinder>
                    );
                })}
            </group>
        </RigidBody>
    );
};

// Cherry blossom tree - pink flowers
export const CherryBlossomTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
    position,
    scale = 1
}) => {
    const blossomColors = ['#ffb7c5', '#ffc0cb', '#ff69b4', '#fff0f5'];

    return (
        <RigidBody type="fixed" colliders="hull" position={position} scale={scale} friction={0}>
            <group>
                {/* Trunk */}
                <Cylinder args={[0.2, 0.3, 1.5, 8]} position={[0, 0.75, 0]} castShadow receiveShadow material={Materials.Brown} />

                {/* Main branches */}
                <Cylinder args={[0.1, 0.12, 0.8, 6]} position={[0.4, 1.8, 0]} rotation={[0, 0, -0.5]} castShadow material={Materials.Brown} />
                <Cylinder args={[0.1, 0.12, 0.8, 6]} position={[-0.4, 1.8, 0]} rotation={[0, 0, 0.5]} castShadow material={Materials.Brown} />

                {/* Blossom clusters */}
                <Sphere args={[0.6]} position={[0, 2.3, 0]} castShadow>
                    <meshStandardMaterial color="#ffb7c5" roughness={0.7} />
                </Sphere>
                <Sphere args={[0.5]} position={[0.6, 2.2, 0.2]} castShadow>
                    <meshStandardMaterial color="#ffc0cb" roughness={0.7} />
                </Sphere>
                <Sphere args={[0.5]} position={[-0.5, 2.1, -0.2]} castShadow>
                    <meshStandardMaterial color="#ffb7c5" roughness={0.7} />
                </Sphere>
                <Sphere args={[0.45]} position={[0.3, 2.6, -0.3]} castShadow>
                    <meshStandardMaterial color="#fff0f5" roughness={0.7} />
                </Sphere>

                {/* Individual blossoms */}
                {[...Array(20)].map((_, i) => {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 0.4 + Math.random() * 0.6;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    const y = 2.0 + Math.random() * 0.8;
                    const color = blossomColors[Math.floor(Math.random() * blossomColors.length)];

                    return (
                        <Sphere key={i} args={[0.06 + Math.random() * 0.04, 6, 6]} position={[x, y, z]}>
                            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
                        </Sphere>
                    );
                })}
            </group>
        </RigidBody>
    );
};

// Palm tree - tropical style
export const PalmTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
    position,
    scale = 1
}) => {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Tropical sway
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
            groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.9) * 0.02;
        }
    });

    return (
        <RigidBody type="fixed" colliders="hull" position={position} scale={scale} friction={0}>
            <group ref={groupRef}>
                {/* Curved trunk segments */}
                <Cylinder args={[0.2, 0.25, 0.8, 8]} position={[0, 0.4, 0]} castShadow>
                    <meshStandardMaterial color="#8b7355" roughness={0.9} />
                </Cylinder>
                <Cylinder args={[0.18, 0.2, 0.8, 8]} position={[0.05, 1.2, 0]} rotation={[0.05, 0, 0.02]} castShadow>
                    <meshStandardMaterial color="#8b7355" roughness={0.9} />
                </Cylinder>
                <Cylinder args={[0.15, 0.18, 0.8, 8]} position={[0.1, 2.0, 0]} rotation={[0.08, 0, 0.03]} castShadow>
                    <meshStandardMaterial color="#8b7355" roughness={0.9} />
                </Cylinder>

                {/* Palm fronds */}
                {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2;
                    const x = Math.cos(angle) * 0.3;
                    const z = Math.sin(angle) * 0.3;
                    const tiltX = Math.cos(angle) * 0.6;
                    const tiltZ = Math.sin(angle) * 0.6;

                    return (
                        <Cone
                            key={i}
                            args={[0.3, 1.5, 4]}
                            position={[x + tiltX * 0.5, 2.6 - 0.3, z + tiltZ * 0.5]}
                            rotation={[tiltX, 0, tiltZ]}
                            castShadow
                        >
                            <meshStandardMaterial color="#3a7a3a" roughness={0.8} />
                        </Cone>
                    );
                })}

                {/* Coconuts */}
                <Sphere args={[0.1, 8, 8]} position={[0.15, 2.4, 0.1]}>
                    <meshStandardMaterial color="#8b4513" roughness={0.8} />
                </Sphere>
                <Sphere args={[0.1, 8, 8]} position={[-0.1, 2.35, -0.1]}>
                    <meshStandardMaterial color="#8b4513" roughness={0.8} />
                </Sphere>
            </group>
        </RigidBody>
    );
};

// Hedge / Trimmed bush - geometric shape
export const TrimmedHedge: React.FC<{
    position: [number, number, number];
    size?: [number, number, number];
    rotation?: [number, number, number]
}> = ({
    position,
    size = [2, 0.8, 0.5],
    rotation = [0, 0, 0]
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation} friction={0}>
        <Box args={size} position={[0, size[1] / 2, 0]} castShadow receiveShadow material={Materials.DarkGreen} />
    </RigidBody>
);

// Topiary - shaped bush (ball on stick)
export const Topiary: React.FC<{ position: [number, number, number]; shape?: 'ball' | 'cone' | 'spiral' }> = ({
    position,
    shape = 'ball'
}) => (
    <RigidBody type="fixed" colliders="hull" position={position} friction={0}>
        <group>
            {/* Pot */}
            <Cylinder args={[0.25, 0.2, 0.4, 8]} position={[0, 0.2, 0]} castShadow material={Materials.Terracotta} />

            {/* Stem */}
            <Cylinder args={[0.05, 0.05, 0.8, 6]} position={[0, 0.6, 0]} castShadow material={Materials.Brown} />

            {/* Shaped foliage */}
            {shape === 'ball' && (
                <Sphere args={[0.4, 12, 12]} position={[0, 1.2, 0]} castShadow material={Materials.DarkGreen} />
            )}
            {shape === 'cone' && (
                <Cone args={[0.4, 0.8, 8]} position={[0, 1.4, 0]} castShadow material={Materials.DarkGreen} />
            )}
            {shape === 'spiral' && (
                <>
                    <Sphere args={[0.35, 10, 10]} position={[0, 1.0, 0]} castShadow material={Materials.DarkGreen} />
                    <Sphere args={[0.25, 10, 10]} position={[0, 1.4, 0]} castShadow material={Materials.DarkGreen} />
                    <Sphere args={[0.18, 10, 10]} position={[0, 1.7, 0]} castShadow material={Materials.DarkGreen} />
                </>
            )}
        </group>
    </RigidBody>
);

// Raised flower bed with border
export const RaisedFlowerBed: React.FC<{
    position: [number, number, number];
    size?: [number, number];
    flowerColors?: string[]
}> = ({
    position,
    size = [2, 1.5],
    flowerColors = ['#ff69b4', '#ffd700', '#ba68c8', '#4fc3f7', '#ff8c94']
}) => {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle sway for flowers
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
        }
    });

    return (
        <RigidBody type="fixed" colliders="cuboid" position={position} friction={0}>
            <group ref={groupRef}>
                {/* Stone border */}
                <Box args={[size[0] + 0.2, 0.25, size[1] + 0.2]} position={[0, 0.125, 0]} castShadow>
                    <meshStandardMaterial color="#9a9080" roughness={0.8} />
                </Box>

                {/* Soil fill */}
                <Box args={[size[0], 0.15, size[1]]} position={[0, 0.25, 0]} receiveShadow>
                    <meshStandardMaterial color="#5a4530" roughness={0.95} />
                </Box>

                {/* Flowers randomly placed */}
                {[...Array(Math.floor(size[0] * size[1] * 4))].map((_, i) => {
                    const x = (Math.random() - 0.5) * (size[0] - 0.3);
                    const z = (Math.random() - 0.5) * (size[1] - 0.3);
                    const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                    const height = 0.2 + Math.random() * 0.15;

                    return (
                        <group key={i} position={[x, 0.33, z]}>
                            {/* Stem */}
                            <Cylinder args={[0.015, 0.015, height, 4]} position={[0, height / 2, 0]}>
                                <meshStandardMaterial color="#4a7a4a" roughness={0.9} />
                            </Cylinder>
                            {/* Flower */}
                            <Sphere args={[0.05 + Math.random() * 0.02, 6, 6]} position={[0, height + 0.02, 0]}>
                                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
                            </Sphere>
                            {/* Leaves */}
                            <Box args={[0.06, 0.02, 0.03]} position={[0.03, height * 0.4, 0]} rotation={[0, 0.3, 0.2]}>
                                <meshStandardMaterial color="#5a8a4a" roughness={0.8} />
                            </Box>
                        </group>
                    );
                })}
            </group>
        </RigidBody>
    );
};

// Ground cover / Ivy patch
export const IvyPatch: React.FC<{ position: [number, number, number]; radius?: number }> = ({
    position,
    radius = 1
}) => (
    <group position={position}>
        {/* Base ground cover */}
        <Cylinder args={[radius, radius, 0.05, 12]} position={[0, 0.025, 0]} receiveShadow>
            <meshStandardMaterial color="#4a6a3a" roughness={0.9} />
        </Cylinder>

        {/* Scattered leaf clusters */}
        {[...Array(Math.floor(radius * 15))].map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius * 0.9;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;

            return (
                <Sphere key={i} args={[0.05 + Math.random() * 0.03, 4, 4]} position={[x, 0.06, z]}>
                    <meshStandardMaterial color={`hsl(${100 + Math.random() * 30}, 50%, ${30 + Math.random() * 15}%)`} roughness={0.85} />
                </Sphere>
            );
        })}
    </group>
);

// Autumn tree variant with falling leaves animation
export const AutumnTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
    position,
    scale = 1
}) => {
    const leafColors = ['#ff6b35', '#f7c59f', '#ff8c42', '#ffc857', '#e85d04'];

    return (
        <RigidBody type="fixed" colliders="hull" position={position} scale={scale} friction={0}>
            <group>
                {/* Trunk */}
                <Cylinder args={[0.25, 0.35, 1.8, 8]} position={[0, 0.9, 0]} castShadow receiveShadow material={Materials.Brown} />

                {/* Autumn colored foliage */}
                <Sphere args={[0.9]} position={[0, 2.2, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#ff6b35" roughness={0.7} />
                </Sphere>
                <Sphere args={[0.8]} position={[0.5, 2.5, 0.3]} castShadow receiveShadow>
                    <meshStandardMaterial color="#f7c59f" roughness={0.7} />
                </Sphere>
                <Sphere args={[0.75]} position={[-0.4, 2.4, -0.2]} castShadow receiveShadow>
                    <meshStandardMaterial color="#ff8c42" roughness={0.7} />
                </Sphere>
                <Sphere args={[0.65]} position={[0, 3.0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#ffc857" roughness={0.7} />
                </Sphere>

                {/* Individual colorful leaves */}
                {[...Array(15)].map((_, i) => {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 0.3 + Math.random() * 0.8;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    const y = 2.0 + Math.random() * 1.2;
                    const color = leafColors[Math.floor(Math.random() * leafColors.length)];

                    return (
                        <Sphere key={i} args={[0.08 + Math.random() * 0.04, 6, 6]} position={[x, y, z]}>
                            <meshStandardMaterial color={color} roughness={0.8} />
                        </Sphere>
                    );
                })}
            </group>
        </RigidBody>
    );
};
