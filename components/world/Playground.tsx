import React from 'react';
import { RigidBody } from '@react-three/rapier';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import { Materials } from '../../utils/materials';

export const Playground: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        {/* Rainbow Slide - vibrant colors */}
        <RigidBody type="fixed" colliders="hull">
            {/* Slide structure with rainbow gradient effect */}
            <Box args={[0.8, 1.5, 0.8]} position={[0, 0.75, 0]} castShadow><meshStandardMaterial color="#FF6B6B" /></Box>
            <Box args={[0.5, 0.1, 0.8]} position={[1.0, 1.35, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow><meshStandardMaterial color="#FF6B6B" /></Box>
            <Box args={[0.5, 0.1, 0.8]} position={[1.6, 1.05, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow><meshStandardMaterial color="#FFD93D" /></Box>
            <Box args={[0.5, 0.1, 0.8]} position={[2.2, 0.75, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow><meshStandardMaterial color="#6BCF7F" /></Box>
            <Box args={[0.5, 0.1, 0.8]} position={[2.8, 0.45, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow><meshStandardMaterial color="#4D96FF" /></Box>
            {/* Safety rails */}
            <Cylinder args={[0.05, 0.05, 2]} position={[1.8, 0.95, 0.45]} rotation={[0, 0, -Math.PI / 6]} castShadow><primitive object={Materials.Silver} attach="material" /></Cylinder>
            <Cylinder args={[0.05, 0.05, 2]} position={[1.8, 0.95, -0.45]} rotation={[0, 0, -Math.PI / 6]} castShadow><primitive object={Materials.Silver} attach="material" /></Cylinder>
        </RigidBody>

        {/* Enhanced Swings with detailed seats */}
        <group position={[-2.5, 0, 0]}>
            {/* Frame */}
            <Cylinder args={[0.06, 0.06, 2.5]} position={[-1, 1.25, 0]} rotation={[0.2, 0, 0]} castShadow><primitive object={Materials.Metal} attach="material" /></Cylinder>
            <Cylinder args={[0.06, 0.06, 2.5]} position={[-1, 1.25, 1.5]} rotation={[-0.2, 0, 0]} castShadow><primitive object={Materials.Metal} attach="material" /></Cylinder>
            <Cylinder args={[0.06, 0.06, 2.5]} position={[1, 1.25, 0]} rotation={[0.2, 0, 0]} castShadow><primitive object={Materials.Metal} attach="material" /></Cylinder>
            <Cylinder args={[0.06, 0.06, 2.5]} position={[1, 1.25, 1.5]} rotation={[-0.2, 0, 0]} castShadow><primitive object={Materials.Metal} attach="material" /></Cylinder>
            <Cylinder args={[0.06, 0.06, 2.2]} position={[0, 2.4, 0.75]} rotation={[0, 0, Math.PI / 2]} castShadow><primitive object={Materials.Metal} attach="material" /></Cylinder>

            {/* Detailed swing seat with back support */}
            <Box args={[0.45, 0.08, 0.35]} position={[0, 0.5, 0.75]} castShadow><meshStandardMaterial color="#FF6B6B" /></Box>
            <Box args={[0.45, 0.25, 0.05]} position={[0, 0.62, 0.6]} castShadow><meshStandardMaterial color="#FF6B6B" /></Box>
            <Cylinder args={[0.02, 0.02, 1.9]} position={[-0.18, 1.45, 0.75]} castShadow><primitive object={Materials.Silver} attach="material" /></Cylinder>
            <Cylinder args={[0.02, 0.02, 1.9]} position={[0.18, 1.45, 0.75]} castShadow><primitive object={Materials.Silver} attach="material" /></Cylinder>
        </group>

        {/* Small Castle Play Structure */}
        <group position={[3.5, 0, 2]}>
            {/* Main tower */}
            <Cylinder args={[0.6, 0.6, 2]} position={[0, 1, 0]} castShadow><meshStandardMaterial color="#A78BFA" /></Cylinder>
            {/* Cone roof */}
            <Cylinder args={[0, 0.7, 0.8]} position={[0, 2.4, 0]} castShadow><meshStandardMaterial color="#FFD93D" /></Cylinder>
            {/* Windows */}
            <Box args={[0.15, 0.25, 0.05]} position={[0, 1.2, 0.62]} castShadow><meshStandardMaterial color="#4D96FF" /></Box>
            <Box args={[0.15, 0.25, 0.05]} position={[0, 1.2, -0.62]} castShadow><meshStandardMaterial color="#4D96FF" /></Box>
            {/* Door */}
            <Box args={[0.3, 0.5, 0.05]} position={[0, 0.25, 0.62]} castShadow><meshStandardMaterial color="#8B4513" /></Box>
            {/* Side turrets */}
            <Cylinder args={[0.35, 0.35, 1.2]} position={[-0.9, 0.6, 0]} castShadow><meshStandardMaterial color="#F9A8D4" /></Cylinder>
            <Cylinder args={[0, 0.4, 0.5]} position={[-0.9, 1.45, 0]} castShadow><meshStandardMaterial color="#6BCF7F" /></Cylinder>
            <Cylinder args={[0.35, 0.35, 1.2]} position={[0.9, 0.6, 0]} castShadow><meshStandardMaterial color="#F9A8D4" /></Cylinder>
            <Cylinder args={[0, 0.4, 0.5]} position={[0.9, 1.45, 0]} castShadow><meshStandardMaterial color="#6BCF7F" /></Cylinder>
        </group>

        {/* Seesaw (Balancín) */}
        <group position={[-5, 0, -2]}>
            {/* Central pivot */}
            <Cylinder args={[0.15, 0.15, 0.5]} position={[0, 0.25, 0]} castShadow><primitive object={Materials.Metal} attach="material" /></Cylinder>
            <Sphere args={[0.2]} position={[0, 0.5, 0]} castShadow><meshStandardMaterial color="#FFD93D" /></Sphere>
            {/* Seesaw plank */}
            <Box args={[3, 0.12, 0.4]} position={[0, 0.5, 0]} castShadow><meshStandardMaterial color="#FF6B6B" /></Box>
            {/* Handles */}
            <Cylinder args={[0.04, 0.04, 0.5]} position={[-1.3, 0.75, 0]} castShadow><meshStandardMaterial color="#4D96FF" /></Cylinder>
            <Cylinder args={[0.04, 0.04, 0.5]} position={[1.3, 0.75, 0]} castShadow><meshStandardMaterial color="#4D96FF" /></Cylinder>
            {/* Seats */}
            <Box args={[0.4, 0.08, 0.35]} position={[-1.3, 0.58, 0]} castShadow><meshStandardMaterial color="#6BCF7F" /></Box>
            <Box args={[0.4, 0.08, 0.35]} position={[1.3, 0.58, 0]} castShadow><meshStandardMaterial color="#6BCF7F" /></Box>
        </group>

        {/* Sandbox with rounded border */}
        <group position={[4, 0, -2.5]}>
            {/* Circular wooden border */}
            <Cylinder args={[2, 2, 0.3]} position={[0, 0.15, 0]} receiveShadow><primitive object={Materials.WoodDark} attach="material" /></Cylinder>
            {/* Sand */}
            <Cylinder args={[1.85, 1.85, 0.2]} position={[0, 0.1, 0]} receiveShadow><meshStandardMaterial color="#F4E4C1" /></Cylinder>
            {/* Colorful buckets */}
            <Cylinder args={[0.15, 0.2, 0.3]} position={[1, 0.35, 0]} castShadow><meshStandardMaterial color="#FF6B6B" /></Cylinder>
            <Cylinder args={[0.15, 0.2, 0.3]} position={[-0.8, 0.35, 0.8]} castShadow><meshStandardMaterial color="#4D96FF" /></Cylinder>
            <Cylinder args={[0.15, 0.2, 0.3]} position={[0.5, 0.35, -1.2]} castShadow><meshStandardMaterial color="#6BCF7F" /></Cylinder>
        </group>
    </group>
)
