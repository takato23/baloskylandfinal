/**
 * Street Details Components
 * Enhanced visual elements for streets, sidewalks, and urban furniture
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Torus, Cone } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Instance, Instances } from '@react-three/drei';
import { BoxGeometry, CylinderGeometry, MeshStandardMaterial, Object3D, Vector3, MathUtils, Group } from 'three';
import { Materials } from '../../utils/materials';
import { useGameStore } from '../../store';

// ============================================
// STREET INFRASTRUCTURE
// ============================================

// Manhole cover (tapa de alcantarilla)
export const Manhole: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        <Cylinder args={[0.4, 0.4, 0.02, 16]} position={[0, 0.01, 0]} receiveShadow>
            <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.4} />
        </Cylinder>
        {/* Grip pattern */}
        <Box args={[0.6, 0.015, 0.05]} position={[0, 0.02, 0]} receiveShadow>
            <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.3} />
        </Box>
        <Box args={[0.6, 0.015, 0.05]} position={[0, 0.02, 0.15]} receiveShadow>
            <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.3} />
        </Box>
        <Box args={[0.6, 0.015, 0.05]} position={[0, 0.02, -0.15]} receiveShadow>
            <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.3} />
        </Box>
        {/* Outer ring */}
        <Torus args={[0.42, 0.04, 8, 24]} position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#5a5a5a" roughness={0.6} metalness={0.5} />
        </Torus>
    </group>
);

// Storm drain grate (rejilla de desague)
export const DrainGrate: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => (
    <group position={position} rotation={rotation}>
        <Box args={[0.8, 0.04, 0.4]} position={[0, 0.02, 0]} receiveShadow>
            <meshStandardMaterial color="#3d3d3d" roughness={0.7} metalness={0.4} />
        </Box>
        {/* Grate bars */}
        {[-0.25, -0.125, 0, 0.125, 0.25].map((x, i) => (
            <Box key={i} args={[0.04, 0.035, 0.35]} position={[x, 0.04, 0]} receiveShadow>
                <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.5} />
            </Box>
        ))}
    </group>
);

// Street crack detail
export const StreetCrack: React.FC<{ position: [number, number, number]; length?: number; rotation?: number }> = ({
    position,
    length = 1,
    rotation = 0
}) => (
    <Box
        args={[length, 0.008, 0.03]}
        position={position}
        rotation={[0, rotation, 0]}
        receiveShadow
    >
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
    </Box>
);

// Oil stain on asphalt
export const OilStain: React.FC<{ position: [number, number, number]; size?: number }> = ({
    position,
    size = 0.5
}) => (
    <Cylinder args={[size, size * 0.8, 0.005, 8]} position={position} receiveShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.1} transparent opacity={0.7} />
    </Cylinder>
);

// Puddle (when raining) - reflective surface
export const Puddle: React.FC<{ position: [number, number, number]; size?: number }> = ({ position, size = 1 }) => {
    const weather = useGameStore(s => s.weather);
    if (weather !== 'rain') return null;

    return (
        <Cylinder args={[size, size * 0.9, 0.01, 12]} position={[position[0], 0.01, position[2]]}>
            <meshStandardMaterial
                color="#8ab4c4"
                roughness={0.05}
                metalness={0.2}
                transparent
                opacity={0.6}
            />
        </Cylinder>
    );
};

// Skid marks near traffic lights
export const SkidMark: React.FC<{ position: [number, number, number]; rotation?: number; length?: number }> = ({
    position,
    rotation = 0,
    length = 2
}) => (
    <group position={position} rotation={[0, rotation, 0]}>
        <Box args={[length, 0.008, 0.15]} position={[0, 0.008, 0.1]} receiveShadow>
            <meshStandardMaterial color="#1f1f1f" roughness={0.95} />
        </Box>
        <Box args={[length * 0.9, 0.008, 0.15]} position={[-0.1, 0.008, -0.1]} receiveShadow>
            <meshStandardMaterial color="#1f1f1f" roughness={0.95} />
        </Box>
    </group>
);

// ============================================
// CURB & SIDEWALK ELEMENTS
// ============================================

// Curb section with height
export const CurbSection: React.FC<{
    position: [number, number, number];
    length: number;
    rotation?: [number, number, number]
}> = ({ position, length, rotation = [0, 0, 0] }) => (
    <group position={position} rotation={rotation}>
        <Box args={[length, 0.15, 0.15]} position={[0, 0.075, 0]} receiveShadow castShadow>
            <meshStandardMaterial color="#c8c0b8" roughness={0.85} />
        </Box>
        {/* Drainage channel at curb base */}
        <Box args={[length, 0.02, 0.08]} position={[0, 0.01, 0.1]} receiveShadow>
            <meshStandardMaterial color="#9a9490" roughness={0.9} />
        </Box>
    </group>
);

// Accessibility ramp at crosswalks
export const AccessRamp: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => (
    <group position={position} rotation={rotation}>
        {/* Ramp surface with tactile indicators */}
        <Box args={[1.2, 0.12, 1]} position={[0, 0.06, 0]} rotation={[0.12, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#d4ccc0" roughness={0.9} />
        </Box>
        {/* Tactile bumps (yellow warning strip) */}
        <group position={[0, 0.13, 0.35]}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
                <group key={i}>
                    {[-0.1, 0, 0.1].map((z, j) => (
                        <Sphere key={j} args={[0.02, 6, 6]} position={[x, 0, z]}>
                            <meshStandardMaterial color="#f2c94c" roughness={0.7} />
                        </Sphere>
                    ))}
                </group>
            ))}
        </group>
    </group>
);

// Tree grate (rejilla alrededor del arbol)
export const TreeGrate: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        {/* Outer frame */}
        <Box args={[1.2, 0.04, 0.1]} position={[0, 0.02, 0.55]} receiveShadow>
            <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.5} />
        </Box>
        <Box args={[1.2, 0.04, 0.1]} position={[0, 0.02, -0.55]} receiveShadow>
            <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.5} />
        </Box>
        <Box args={[0.1, 0.04, 1]} position={[0.55, 0.02, 0]} receiveShadow>
            <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.5} />
        </Box>
        <Box args={[0.1, 0.04, 1]} position={[-0.55, 0.02, 0]} receiveShadow>
            <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.5} />
        </Box>
        {/* Inner grate bars */}
        {[-0.35, -0.15, 0.15, 0.35].map((x, i) => (
            <Box key={i} args={[0.06, 0.03, 0.9]} position={[x, 0.035, 0]} receiveShadow>
                <meshStandardMaterial color="#5a5a5a" roughness={0.6} metalness={0.4} />
            </Box>
        ))}
        {/* Center hole for tree */}
        <Cylinder args={[0.3, 0.3, 0.05, 8]} position={[0, 0.025, 0]}>
            <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
        </Cylinder>
    </group>
);

// Grass strip between sidewalk and curb
export const GrassStrip: React.FC<{
    position: [number, number, number];
    length: number;
    width?: number;
    rotation?: [number, number, number]
}> = ({ position, length, width = 0.4, rotation = [0, 0, 0] }) => (
    <group position={position} rotation={rotation}>
        <Box args={[length, 0.08, width]} position={[0, 0.04, 0]} receiveShadow material={Materials.Grass} />
        {/* Random grass tufts */}
        {Array.from({ length: Math.floor(length * 3) }).map((_, i) => {
            const x = (Math.random() - 0.5) * (length - 0.2);
            const z = (Math.random() - 0.5) * (width - 0.1);
            return (
                <Cone key={i} args={[0.03, 0.08, 4]} position={[x, 0.12, z]}>
                    <meshStandardMaterial color="#6a9a5a" roughness={0.9} />
                </Cone>
            );
        })}
    </group>
);

// ============================================
// URBAN FURNITURE
// ============================================

// Newspaper stand / Kiosko de diarios
export const NewspaperStand: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {/* Main cabinet */}
            <Box args={[0.8, 1.2, 0.5]} position={[0, 0.6, 0]} castShadow>
                <meshStandardMaterial color="#2d5a8a" roughness={0.6} />
            </Box>
            {/* Glass front */}
            <Box args={[0.7, 0.9, 0.02]} position={[0, 0.7, 0.24]}>
                <meshStandardMaterial color="#a8c8e8" roughness={0.1} transparent opacity={0.6} />
            </Box>
            {/* Roof */}
            <Box args={[0.9, 0.08, 0.6]} position={[0, 1.24, 0]} castShadow>
                <meshStandardMaterial color="#1a3a5a" roughness={0.7} />
            </Box>
            {/* Newspaper display */}
            <Box args={[0.6, 0.4, 0.05]} position={[0, 0.7, 0.2]}>
                <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
            </Box>
            {/* Logo/text area */}
            <Box args={[0.5, 0.15, 0.03]} position={[0, 1.1, 0.25]}>
                <meshStandardMaterial color="#ffd700" roughness={0.5} />
            </Box>
        </group>
    </RigidBody>
);

// Phone booth (cabina telefonica retro)
export const PhoneBoothRetro: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {/* Main frame */}
            <Box args={[0.9, 2.2, 0.9]} position={[0, 1.1, 0]} castShadow>
                <meshStandardMaterial color="#cc3333" roughness={0.5} />
            </Box>
            {/* Glass panels */}
            {[-0.44, 0.44].map((x, i) => (
                <Box key={i} args={[0.02, 1.6, 0.7]} position={[x, 1.1, 0]}>
                    <meshStandardMaterial color="#a8c8e8" roughness={0.1} transparent opacity={0.5} />
                </Box>
            ))}
            <Box args={[0.7, 1.6, 0.02]} position={[0, 1.1, 0.44]}>
                <meshStandardMaterial color="#a8c8e8" roughness={0.1} transparent opacity={0.5} />
            </Box>
            {/* Roof */}
            <Box args={[1, 0.15, 1]} position={[0, 2.28, 0]} castShadow>
                <meshStandardMaterial color="#aa2222" roughness={0.6} />
            </Box>
            {/* Phone icon/sign */}
            <Box args={[0.3, 0.3, 0.05]} position={[0, 2.05, 0.47]}>
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </Box>
            {/* Light on top */}
            <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[0, 2.4, 0]}>
                <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.3} />
            </Cylinder>
        </group>
    </RigidBody>
);

// Street bollard (bolardo)
export const Bollard: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
        <group>
            <Cylinder args={[0.12, 0.14, 0.8, 8]} position={[0, 0.4, 0]} castShadow>
                <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.4} />
            </Cylinder>
            {/* Top cap */}
            <Sphere args={[0.13, 8, 8]} position={[0, 0.85, 0]} castShadow>
                <meshStandardMaterial color="#5a5a5a" roughness={0.5} metalness={0.5} />
            </Sphere>
            {/* Reflective stripe */}
            <Torus args={[0.125, 0.02, 8, 16]} position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#ffcc00" roughness={0.3} emissive="#ffcc00" emissiveIntensity={0.1} />
            </Torus>
        </group>
    </RigidBody>
);

// Outdoor cafe table set
export const CafeTableSet: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {/* Table */}
            <Cylinder args={[0.45, 0.45, 0.04, 12]} position={[0, 0.72, 0]} castShadow>
                <meshStandardMaterial color="#f0e8d8" roughness={0.7} />
            </Cylinder>
            <Cylinder args={[0.06, 0.08, 0.7, 8]} position={[0, 0.35, 0]} castShadow>
                <meshStandardMaterial color="#8a8a8a" roughness={0.5} metalness={0.6} />
            </Cylinder>
            <Cylinder args={[0.25, 0.25, 0.02, 8]} position={[0, 0.01, 0]}>
                <meshStandardMaterial color="#6a6a6a" roughness={0.6} metalness={0.5} />
            </Cylinder>

            {/* Chairs */}
            {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, i) => {
                const x = Math.cos(angle) * 0.6;
                const z = Math.sin(angle) * 0.6;
                return (
                    <group key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
                        {/* Seat */}
                        <Box args={[0.35, 0.03, 0.35]} position={[0, 0.45, 0]} castShadow>
                            <meshStandardMaterial color="#cd853f" roughness={0.8} />
                        </Box>
                        {/* Legs */}
                        <Cylinder args={[0.02, 0.02, 0.45, 6]} position={[0.12, 0.22, 0.12]}>
                            <meshStandardMaterial color="#8a8a8a" roughness={0.5} metalness={0.6} />
                        </Cylinder>
                        <Cylinder args={[0.02, 0.02, 0.45, 6]} position={[-0.12, 0.22, 0.12]}>
                            <meshStandardMaterial color="#8a8a8a" roughness={0.5} metalness={0.6} />
                        </Cylinder>
                        <Cylinder args={[0.02, 0.02, 0.45, 6]} position={[0.12, 0.22, -0.12]}>
                            <meshStandardMaterial color="#8a8a8a" roughness={0.5} metalness={0.6} />
                        </Cylinder>
                        <Cylinder args={[0.02, 0.02, 0.45, 6]} position={[-0.12, 0.22, -0.12]}>
                            <meshStandardMaterial color="#8a8a8a" roughness={0.5} metalness={0.6} />
                        </Cylinder>
                        {/* Back */}
                        <Box args={[0.35, 0.35, 0.03]} position={[0, 0.65, -0.16]} castShadow>
                            <meshStandardMaterial color="#cd853f" roughness={0.8} />
                        </Box>
                    </group>
                );
            })}

            {/* Umbrella */}
            <Cylinder args={[0.03, 0.03, 1.5, 6]} position={[0, 1.5, 0]} castShadow>
                <meshStandardMaterial color="#8a8a8a" roughness={0.5} metalness={0.6} />
            </Cylinder>
            <Cone args={[0.8, 0.3, 8]} position={[0, 2.15, 0]} rotation={[Math.PI, 0, 0]} castShadow>
                <meshStandardMaterial color="#e07a5f" roughness={0.7} />
            </Cone>
        </group>
    </RigidBody>
);

// Food truck
export const FoodTruck: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; color?: string }> = ({
    position,
    rotation = [0, 0, 0],
    color = '#e07a5f'
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {/* Main body */}
            <Box args={[2.5, 1.8, 1.5]} position={[0, 1.1, 0]} castShadow>
                <meshStandardMaterial color={color} roughness={0.5} />
            </Box>
            {/* Service window */}
            <Box args={[1.2, 0.8, 0.05]} position={[0, 1.4, 0.76]}>
                <meshStandardMaterial color="#2a2a2a" roughness={0.3} />
            </Box>
            {/* Awning */}
            <Box args={[1.4, 0.05, 0.6]} position={[0, 1.95, 0.95]} rotation={[0.3, 0, 0]} castShadow>
                <meshStandardMaterial color="#f2c94c" roughness={0.7} />
            </Box>
            {/* Wheels */}
            {[[-0.7, 0], [0.7, 0]].map(([x, z], i) => (
                <group key={i} position={[x, 0.25, z]}>
                    <Cylinder args={[0.25, 0.25, 0.1, 12]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
                    </Cylinder>
                    <Cylinder args={[0.12, 0.12, 0.12, 8]} rotation={[0, 0, Math.PI / 2]}>
                        <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.6} />
                    </Cylinder>
                </group>
            ))}
            {/* Menu board */}
            <Box args={[0.6, 0.4, 0.03]} position={[0.8, 1.7, 0.77]}>
                <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
            </Box>
            {/* String lights */}
            {[-0.5, 0, 0.5].map((x, i) => (
                <Sphere key={i} args={[0.04, 6, 6]} position={[x, 2.0, 0.9]}>
                    <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
                </Sphere>
            ))}
        </group>
    </RigidBody>
);

// ============================================
// ADDITIONAL URBAN FURNITURE
// ============================================

// Modern street bench with armrests
export const ModernBench: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {/* Seat - curved modern design */}
            <Box args={[1.5, 0.06, 0.45]} position={[0, 0.45, 0]} castShadow>
                <meshStandardMaterial color="#d4a574" roughness={0.7} />
            </Box>
            {/* Back rest - slightly angled */}
            <Box args={[1.5, 0.35, 0.04]} position={[0, 0.65, -0.2]} rotation={[-0.15, 0, 0]} castShadow>
                <meshStandardMaterial color="#d4a574" roughness={0.7} />
            </Box>
            {/* Metal frame - legs */}
            <Box args={[0.05, 0.45, 0.4]} position={[-0.6, 0.22, 0]} castShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </Box>
            <Box args={[0.05, 0.45, 0.4]} position={[0.6, 0.22, 0]} castShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </Box>
            {/* Armrests */}
            <Box args={[0.05, 0.15, 0.35]} position={[-0.7, 0.55, 0]} castShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </Box>
            <Box args={[0.05, 0.15, 0.35]} position={[0.7, 0.55, 0]} castShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </Box>
        </group>
    </RigidBody>
);

// Modern trash can with recycling compartment
export const ModernTrashCan: React.FC<{ position: [number, number, number]; type?: 'general' | 'recycling' }> = ({
    position,
    type = 'general'
}) => {
    const color = type === 'recycling' ? '#4a90a4' : '#5a5a5a';
    const accentColor = type === 'recycling' ? '#2ecc71' : '#e07a5f';

    return (
        <RigidBody type="fixed" colliders="cuboid" position={position}>
            <group>
                {/* Main body */}
                <Cylinder args={[0.25, 0.22, 0.7, 12]} position={[0, 0.35, 0]} castShadow>
                    <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
                </Cylinder>
                {/* Lid */}
                <Cylinder args={[0.27, 0.27, 0.05, 12]} position={[0, 0.73, 0]} castShadow>
                    <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.3} />
                </Cylinder>
                {/* Opening flap indicator */}
                <Box args={[0.15, 0.02, 0.08]} position={[0, 0.76, 0.1]}>
                    <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
                </Box>
                {/* Icon/symbol strip */}
                <Box args={[0.18, 0.1, 0.01]} position={[0, 0.5, 0.23]}>
                    <meshStandardMaterial color={type === 'recycling' ? '#27ae60' : '#e74c3c'} roughness={0.6} />
                </Box>
            </group>
        </RigidBody>
    );
};

// Bicycle parking station
export const BicycleStation: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; count?: number }> = ({
    position,
    rotation = [0, 0, 0],
    count = 4
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {/* Base platform */}
            <Box args={[count * 0.5 + 0.2, 0.03, 0.8]} position={[0, 0.015, 0]} receiveShadow>
                <meshStandardMaterial color="#6a6a6a" roughness={0.7} metalness={0.3} />
            </Box>
            {/* U-shaped racks */}
            {Array.from({ length: count }).map((_, i) => {
                const x = (i - (count - 1) / 2) * 0.5;
                return (
                    <group key={i} position={[x, 0, 0]}>
                        {/* Left post */}
                        <Cylinder args={[0.025, 0.025, 0.7, 8]} position={[-0.1, 0.35, 0]} castShadow>
                            <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.6} />
                        </Cylinder>
                        {/* Right post */}
                        <Cylinder args={[0.025, 0.025, 0.7, 8]} position={[0.1, 0.35, 0]} castShadow>
                            <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.6} />
                        </Cylinder>
                        {/* Top bar */}
                        <Cylinder args={[0.025, 0.025, 0.22, 8]} position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                            <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.6} />
                        </Cylinder>
                    </group>
                );
            })}
        </group>
    </RigidBody>
);

// Street lamp post (decorative modern style)
export const ModernStreetLamp: React.FC<{ position: [number, number, number]; isOn?: boolean }> = ({
    position,
    isOn = true
}) => {
    const isNight = useGameStore(s => s.isNight);
    const glowIntensity = isNight && isOn ? 1.5 : 0.3;

    return (
        <group position={position}>
            {/* Base */}
            <Cylinder args={[0.15, 0.18, 0.1, 8]} position={[0, 0.05, 0]} castShadow>
                <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.5} />
            </Cylinder>
            {/* Main pole */}
            <Cylinder args={[0.06, 0.08, 3.5, 8]} position={[0, 1.8, 0]} castShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </Cylinder>
            {/* Arm extending outward */}
            <Cylinder args={[0.04, 0.04, 0.8, 6]} position={[0.35, 3.4, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </Cylinder>
            {/* Lamp housing */}
            <Box args={[0.3, 0.15, 0.2]} position={[0.6, 3.3, 0]} castShadow>
                <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.4} />
            </Box>
            {/* Light surface */}
            <Box args={[0.25, 0.02, 0.15]} position={[0.6, 3.2, 0]}>
                <meshStandardMaterial
                    color="#fff8dc"
                    emissive="#fff8dc"
                    emissiveIntensity={glowIntensity}
                    transparent
                    opacity={0.9}
                />
            </Box>
        </group>
    );
};

// Public information board / City map stand
export const CityMapStand: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {/* Main post */}
            <Cylinder args={[0.05, 0.06, 1.8, 8]} position={[0, 0.9, 0]} castShadow>
                <meshStandardMaterial color="#3a5a4a" roughness={0.5} metalness={0.3} />
            </Cylinder>
            {/* Map board frame */}
            <Box args={[0.8, 0.6, 0.08]} position={[0, 1.5, 0.06]} castShadow>
                <meshStandardMaterial color="#3a5a4a" roughness={0.5} />
            </Box>
            {/* Map surface (glass/acrylic) */}
            <Box args={[0.7, 0.5, 0.02]} position={[0, 1.5, 0.11]}>
                <meshStandardMaterial color="#e8e8e8" roughness={0.3} />
            </Box>
            {/* "MAP" indicator */}
            <Box args={[0.25, 0.08, 0.02]} position={[0, 1.85, 0.11]}>
                <meshStandardMaterial color="#2980b9" roughness={0.4} />
            </Box>
        </group>
    </RigidBody>
);

// Electrical utility box
export const UtilityBox: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; color?: string }> = ({
    position,
    rotation = [0, 0, 0],
    color = '#7a8a7a'
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            <Box args={[0.6, 1.0, 0.4]} position={[0, 0.5, 0]} castShadow>
                <meshStandardMaterial color={color} roughness={0.7} />
            </Box>
            {/* Ventilation slits */}
            {[-0.2, 0, 0.2].map((y, i) => (
                <Box key={i} args={[0.4, 0.02, 0.01]} position={[0, 0.6 + y, 0.21]}>
                    <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
                </Box>
            ))}
            {/* Warning sticker */}
            <Box args={[0.15, 0.15, 0.01]} position={[0.15, 0.85, 0.21]}>
                <meshStandardMaterial color="#f1c40f" roughness={0.6} />
            </Box>
        </group>
    </RigidBody>
);

// Parking meter
export const ParkingMeter: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
        <group>
            {/* Pole */}
            <Cylinder args={[0.04, 0.05, 1.0, 8]} position={[0, 0.5, 0]} castShadow>
                <meshStandardMaterial color="#5a5a5a" roughness={0.5} metalness={0.5} />
            </Cylinder>
            {/* Meter head */}
            <Box args={[0.15, 0.25, 0.1]} position={[0, 1.12, 0]} castShadow>
                <meshStandardMaterial color="#4a4a4a" roughness={0.4} metalness={0.4} />
            </Box>
            {/* Display window */}
            <Box args={[0.1, 0.08, 0.01]} position={[0, 1.18, 0.055]}>
                <meshStandardMaterial color="#2a2a2a" roughness={0.2} />
            </Box>
            {/* Coin slot */}
            <Box args={[0.04, 0.02, 0.02]} position={[0, 1.08, 0.055]}>
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </Box>
        </group>
    </RigidBody>
);

// Decorative planter box (rectangular)
export const PlanterBox: React.FC<{ position: [number, number, number]; length?: number; flowerColor?: string }> = ({
    position,
    length = 1.5,
    flowerColor = '#ff69b4'
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
        <group>
            {/* Concrete box */}
            <Box args={[length, 0.5, 0.5]} position={[0, 0.25, 0]} castShadow>
                <meshStandardMaterial color="#b8b0a8" roughness={0.8} />
            </Box>
            {/* Soil */}
            <Box args={[length - 0.1, 0.08, 0.4]} position={[0, 0.52, 0]}>
                <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
            </Box>
            {/* Plants/flowers */}
            {Array.from({ length: Math.floor(length * 3) }).map((_, i) => {
                const x = (i / (length * 3) - 0.5) * (length - 0.3);
                return (
                    <group key={i} position={[x, 0.55, (Math.random() - 0.5) * 0.2]}>
                        {/* Leaves */}
                        <Sphere args={[0.08 + Math.random() * 0.03, 6, 6]} position={[0, 0.05, 0]}>
                            <meshStandardMaterial color="#4a7a4a" roughness={0.8} />
                        </Sphere>
                        {/* Flower */}
                        {Math.random() > 0.4 && (
                            <Sphere args={[0.04, 6, 6]} position={[0, 0.12, 0]}>
                                <meshStandardMaterial color={flowerColor} roughness={0.6} />
                            </Sphere>
                        )}
                    </group>
                );
            })}
        </group>
    </RigidBody>
);

// Street art installation / sculpture base
export const ArtInstallation: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {/* Pedestal base */}
            <Box args={[1.2, 0.15, 1.2]} position={[0, 0.075, 0]} castShadow>
                <meshStandardMaterial color="#d4cec2" roughness={0.7} />
            </Box>
            <Box args={[0.9, 0.6, 0.9]} position={[0, 0.45, 0]} castShadow>
                <meshStandardMaterial color="#d4cec2" roughness={0.7} />
            </Box>
            {/* Abstract sculpture - geometric shapes */}
            <Sphere args={[0.35, 12, 12]} position={[0, 1.1, 0]} castShadow>
                <meshStandardMaterial color="#cd7f32" roughness={0.3} metalness={0.7} />
            </Sphere>
            <Cylinder args={[0.15, 0.25, 0.4, 8]} position={[0.25, 1.3, 0.15]} rotation={[0.3, 0.5, 0.2]} castShadow>
                <meshStandardMaterial color="#cd7f32" roughness={0.3} metalness={0.7} />
            </Cylinder>
            <Box args={[0.2, 0.5, 0.1]} position={[-0.2, 1.4, -0.1]} rotation={[0.2, -0.3, 0.15]} castShadow>
                <meshStandardMaterial color="#cd7f32" roughness={0.3} metalness={0.7} />
            </Box>
        </group>
    </RigidBody>
);

// ============================================
// BUILDING DETAIL ELEMENTS
// ============================================

// AC unit mounted on building wall
export const ACUnit: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
    position,
    rotation = [0, 0, 0]
}) => {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Subtle vibration effect
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * 0.002;
        }
    });

    return (
        <group position={position} rotation={rotation} ref={groupRef}>
            {/* Main unit body */}
            <Box args={[0.6, 0.4, 0.3]} position={[0, 0, 0]} castShadow>
                <meshStandardMaterial color="#e0e0e0" roughness={0.6} />
            </Box>
            {/* Ventilation grille */}
            <Box args={[0.5, 0.25, 0.02]} position={[0, 0.02, 0.16]}>
                <meshStandardMaterial color="#b0b0b0" roughness={0.7} />
            </Box>
            {/* Grille bars */}
            {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
                <Box key={i} args={[0.02, 0.2, 0.01]} position={[x, 0.02, 0.17]}>
                    <meshStandardMaterial color="#8a8a8a" roughness={0.5} />
                </Box>
            ))}
            {/* Top exhaust */}
            <Box args={[0.4, 0.05, 0.2]} position={[0, 0.22, 0]}>
                <meshStandardMaterial color="#d0d0d0" roughness={0.6} />
            </Box>
            {/* Wall mounting bracket */}
            <Box args={[0.5, 0.05, 0.15]} position={[0, -0.22, -0.08]}>
                <meshStandardMaterial color="#6a6a6a" roughness={0.5} metalness={0.4} />
            </Box>
        </group>
    );
};

// Window flower box
export const WindowFlowerBox: React.FC<{ position: [number, number, number]; flowerColor?: string }> = ({
    position,
    flowerColor = '#ff69b4'
}) => (
    <group position={position}>
        {/* Planter box */}
        <Box args={[0.8, 0.2, 0.2]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#8b4513" roughness={0.8} />
        </Box>
        {/* Soil */}
        <Box args={[0.75, 0.05, 0.15]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color="#4a3520" roughness={0.95} />
        </Box>
        {/* Flowers */}
        {[-0.25, 0, 0.25].map((x, i) => (
            <group key={i} position={[x, 0.15, 0]}>
                <Sphere args={[0.05, 6, 6]} position={[0, 0.08, 0]}>
                    <meshStandardMaterial color={flowerColor} emissive={flowerColor} emissiveIntensity={0.1} />
                </Sphere>
                <Cylinder args={[0.01, 0.01, 0.1, 4]} position={[0, 0.02, 0]}>
                    <meshStandardMaterial color="#4a7a4a" roughness={0.9} />
                </Cylinder>
            </group>
        ))}
        {/* Leaves */}
        <Box args={[0.7, 0.08, 0.1]} position={[0, 0.12, 0.02]}>
            <meshStandardMaterial color="#5a8a5a" roughness={0.8} />
        </Box>
    </group>
);

// Building awning (striped canvas)
export const StripedAwning: React.FC<{
    position: [number, number, number];
    width?: number;
    depth?: number;
    rotation?: [number, number, number];
    color1?: string;
    color2?: string
}> = ({
    position,
    width = 2,
    depth = 1,
    rotation = [0, 0, 0],
    color1 = '#e07a5f',
    color2 = '#f5f5f5'
}) => (
    <group position={position} rotation={rotation}>
        {/* Main awning surface - angled */}
        <Box args={[width, 0.05, depth]} position={[0, 0, depth / 2]} rotation={[-0.3, 0, 0]} castShadow>
            <meshStandardMaterial color={color1} roughness={0.7} />
        </Box>
        {/* Stripes */}
        {Array.from({ length: Math.floor(width * 3) }).map((_, i) => {
            const x = (i - Math.floor(width * 3) / 2) * (width / (width * 3));
            return (
                <Box
                    key={i}
                    args={[width / (width * 6), 0.052, depth]}
                    position={[x, 0, depth / 2]}
                    rotation={[-0.3, 0, 0]}
                >
                    <meshStandardMaterial color={i % 2 === 0 ? color1 : color2} roughness={0.7} />
                </Box>
            );
        })}
        {/* Front edge bar */}
        <Cylinder args={[0.03, 0.03, width, 8]} position={[0, -0.15, depth - 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#6a6a6a" roughness={0.4} metalness={0.5} />
        </Cylinder>
        {/* Side supports */}
        <Cylinder args={[0.02, 0.02, 0.4, 6]} position={[-width / 2 + 0.1, -0.08, 0.3]} rotation={[0.3, 0, 0]}>
            <meshStandardMaterial color="#6a6a6a" roughness={0.4} metalness={0.5} />
        </Cylinder>
        <Cylinder args={[0.02, 0.02, 0.4, 6]} position={[width / 2 - 0.1, -0.08, 0.3]} rotation={[0.3, 0, 0]}>
            <meshStandardMaterial color="#6a6a6a" roughness={0.4} metalness={0.5} />
        </Cylinder>
    </group>
);

// Street art / Graffiti panel
export const GraffitiPanel: React.FC<{
    position: [number, number, number];
    rotation?: [number, number, number];
    variant?: 'abstract' | 'mural' | 'tag'
}> = ({
    position,
    rotation = [0, 0, 0],
    variant = 'abstract'
}) => {
    const colors = variant === 'abstract'
        ? ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3']
        : variant === 'mural'
            ? ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9']
            : ['#ff2a6d', '#05d9e8', '#d500f9', '#01012b'];

    return (
        <group position={position} rotation={rotation}>
            {/* Base wall section */}
            <Box args={[2, 1.5, 0.1]} position={[0, 0.75, 0]}>
                <meshStandardMaterial color="#9a9080" roughness={0.95} />
            </Box>
            {/* Abstract art shapes */}
            {variant === 'abstract' && (
                <>
                    <Sphere args={[0.3, 12, 12]} position={[-0.4, 0.9, 0.06]}>
                        <meshStandardMaterial color={colors[0]} roughness={0.6} />
                    </Sphere>
                    <Box args={[0.5, 0.5, 0.02]} position={[0.3, 0.6, 0.06]} rotation={[0, 0, 0.3]}>
                        <meshStandardMaterial color={colors[1]} roughness={0.6} />
                    </Box>
                    <Cylinder args={[0.2, 0.15, 0.4, 6]} position={[0, 1.2, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                        <meshStandardMaterial color={colors[2]} roughness={0.6} />
                    </Cylinder>
                    {/* Splash effect */}
                    {[...Array(8)].map((_, i) => {
                        const angle = (i / 8) * Math.PI * 2;
                        const r = 0.2 + Math.random() * 0.15;
                        return (
                            <Sphere key={i} args={[0.05 + Math.random() * 0.03, 6, 6]}
                                position={[Math.cos(angle) * r, 0.9 + Math.sin(angle) * r * 0.5, 0.06]}>
                                <meshStandardMaterial color={colors[Math.floor(Math.random() * colors.length)]} roughness={0.7} />
                            </Sphere>
                        );
                    })}
                </>
            )}
            {/* Mural style */}
            {variant === 'mural' && (
                <>
                    <Box args={[1.8, 1.3, 0.02]} position={[0, 0.75, 0.06]}>
                        <meshStandardMaterial color={colors[3]} roughness={0.8} />
                    </Box>
                    {/* Simple geometric mural pattern */}
                    <Box args={[0.8, 0.6, 0.02]} position={[-0.3, 0.9, 0.07]}>
                        <meshStandardMaterial color={colors[0]} roughness={0.7} />
                    </Box>
                    <Cylinder args={[0.25, 0.25, 0.02, 16]} position={[0.4, 0.7, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                        <meshStandardMaterial color={colors[1]} roughness={0.7} />
                    </Cylinder>
                    <Box args={[0.4, 0.4, 0.02]} position={[0.5, 1.1, 0.07]} rotation={[0, 0, Math.PI / 4]}>
                        <meshStandardMaterial color={colors[2]} roughness={0.7} />
                    </Box>
                </>
            )}
            {/* Tag/neon style */}
            {variant === 'tag' && (
                <>
                    {/* Neon-like lines */}
                    <Box args={[1.5, 0.08, 0.02]} position={[0, 1.1, 0.06]} rotation={[0, 0, -0.1]}>
                        <meshStandardMaterial color={colors[0]} emissive={colors[0]} emissiveIntensity={0.5} roughness={0.3} />
                    </Box>
                    <Box args={[1.2, 0.06, 0.02]} position={[-0.1, 0.85, 0.06]} rotation={[0, 0, 0.15]}>
                        <meshStandardMaterial color={colors[1]} emissive={colors[1]} emissiveIntensity={0.5} roughness={0.3} />
                    </Box>
                    <Box args={[0.8, 0.07, 0.02]} position={[0.2, 0.6, 0.06]} rotation={[0, 0, -0.2]}>
                        <meshStandardMaterial color={colors[2]} emissive={colors[2]} emissiveIntensity={0.5} roughness={0.3} />
                    </Box>
                    {/* Drip effects */}
                    <Box args={[0.03, 0.2, 0.02]} position={[-0.5, 0.7, 0.06]}>
                        <meshStandardMaterial color={colors[0]} roughness={0.5} />
                    </Box>
                    <Box args={[0.03, 0.15, 0.02]} position={[0.6, 0.5, 0.06]}>
                        <meshStandardMaterial color={colors[1]} roughness={0.5} />
                    </Box>
                </>
            )}
        </group>
    );
};

// Rooftop water tank
export const WaterTank: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        {/* Tank body */}
        <Cylinder args={[0.6, 0.6, 1.2, 12]} position={[0, 0.6, 0]} castShadow>
            <meshStandardMaterial color="#5a7a8a" roughness={0.6} metalness={0.3} />
        </Cylinder>
        {/* Tank lid */}
        <Cone args={[0.65, 0.3, 12]} position={[0, 1.35, 0]} castShadow>
            <meshStandardMaterial color="#4a6a7a" roughness={0.5} metalness={0.4} />
        </Cone>
        {/* Support legs */}
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, i) => {
            const x = Math.cos(angle) * 0.4;
            const z = Math.sin(angle) * 0.4;
            return (
                <Box key={i} args={[0.08, 0.5, 0.08]} position={[x, -0.25, z]} castShadow>
                    <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.5} />
                </Box>
            );
        })}
        {/* Pipe */}
        <Cylinder args={[0.04, 0.04, 0.6, 6]} position={[0.5, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.6} />
        </Cylinder>
    </group>
);

// Power line pole segment
export const PowerLinePole: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        {/* Main pole */}
        <Cylinder args={[0.1, 0.12, 6, 8]} position={[0, 3, 0]} castShadow>
            <meshStandardMaterial color="#5a4530" roughness={0.9} />
        </Cylinder>
        {/* Cross beam */}
        <Box args={[2, 0.1, 0.1]} position={[0, 5.5, 0]} castShadow>
            <meshStandardMaterial color="#5a4530" roughness={0.9} />
        </Box>
        {/* Insulators */}
        {[-0.7, 0, 0.7].map((x, i) => (
            <Cylinder key={i} args={[0.04, 0.06, 0.15, 6]} position={[x, 5.35, 0]} castShadow>
                <meshStandardMaterial color="#2a4a5a" roughness={0.4} />
            </Cylinder>
        ))}
    </group>
);

// Building entrance stairs
export const EntranceStairs: React.FC<{
    position: [number, number, number];
    steps?: number;
    width?: number;
    rotation?: [number, number, number]
}> = ({
    position,
    steps = 3,
    width = 1.5,
    rotation = [0, 0, 0]
}) => (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
        <group>
            {Array.from({ length: steps }).map((_, i) => (
                <Box
                    key={i}
                    args={[width, 0.15, 0.3]}
                    position={[0, 0.075 + i * 0.15, -i * 0.3]}
                    castShadow
                    receiveShadow
                >
                    <meshStandardMaterial color="#b8b0a8" roughness={0.8} />
                </Box>
            ))}
            {/* Side rails */}
            <Cylinder args={[0.03, 0.03, steps * 0.2 + 0.3, 6]} position={[-width / 2 - 0.05, steps * 0.1 + 0.3, -steps * 0.15]}>
                <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </Cylinder>
            <Cylinder args={[0.03, 0.03, steps * 0.2 + 0.3, 6]} position={[width / 2 + 0.05, steps * 0.1 + 0.3, -steps * 0.15]}>
                <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </Cylinder>
        </group>
    </RigidBody>
);

// ============================================
// INSTANCED ELEMENTS FOR PERFORMANCE
// ============================================

// Instanced manholes
const manholeGeo = new CylinderGeometry(0.4, 0.4, 0.02, 12);
export const ManholeInstances: React.FC<{ data: { position: [number, number, number] }[] }> = React.memo(({ data }) => {
    const mat = useMemo(() => new MeshStandardMaterial({ color: '#4a4a4a', roughness: 0.7, metalness: 0.4 }), []);

    return (
        <Instances range={data.length} geometry={manholeGeo} material={mat} receiveShadow>
            {data.map((d, i) => (
                <Instance key={i} position={[d.position[0], 0.01, d.position[2]]} />
            ))}
        </Instances>
    );
});

// Instanced bollards
const bollardGeo = new CylinderGeometry(0.12, 0.14, 0.8, 8);
bollardGeo.translate(0, 0.4, 0);
export const BollardInstances: React.FC<{ data: { position: [number, number, number] }[] }> = React.memo(({ data }) => {
    const mat = useMemo(() => new MeshStandardMaterial({ color: '#4a4a4a', roughness: 0.6, metalness: 0.4 }), []);

    return (
        <Instances range={data.length} geometry={bollardGeo} material={mat} castShadow>
            {data.map((d, i) => (
                <Instance key={i} position={d.position} />
            ))}
        </Instances>
    );
});

// Instanced drain grates
const drainGeo = new BoxGeometry(0.8, 0.04, 0.4);
drainGeo.translate(0, 0.02, 0);
export const DrainInstances: React.FC<{ data: { position: [number, number, number]; rotation: number }[] }> = React.memo(({ data }) => {
    const mat = useMemo(() => new MeshStandardMaterial({ color: '#3d3d3d', roughness: 0.7, metalness: 0.4 }), []);

    return (
        <Instances range={data.length} geometry={drainGeo} material={mat} receiveShadow>
            {data.map((d, i) => (
                <Instance key={i} position={d.position} rotation={[0, d.rotation, 0]} />
            ))}
        </Instances>
    );
});
