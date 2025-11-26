import React, { useState, useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Cylinder, Sphere, useKeyboardControls } from '@react-three/drei';
import { useGameStore, Controls } from '../../store';
import { playSound } from '../../utils/audio';
import { Materials } from '../../utils/materials';

export const StreetNameSign: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = ({ position, rotation }) => (
    <RigidBody type="fixed" colliders="hull" position={position} rotation={rotation}>
        <Cylinder args={[0.05, 0.05, 2]} position={[0, 1, 0]} castShadow material={Materials.Silver} />
        <Box args={[0.6, 0.15, 0.02]} position={[0, 1.8, 0]}><meshStandardMaterial color="#43a047" /></Box>
        <Box args={[0.6, 0.15, 0.02]} position={[0, 1.95, 0]} rotation={[0, Math.PI / 2, 0]}><meshStandardMaterial color="#43a047" /></Box>
    </RigidBody>
)

export const SignBoard: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    const messages = ["Tomate un respiro.", "Vas muy bien!", "Mira las estrellas.", "Toma agua!", "Sonrie hoy!"];

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    openDialogue("Cartel Vecinal", messages[Math.floor(Math.random() * messages.length)]);
                    playSound('gem');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                {/* Decorative post */}
                <Cylinder args={[0.1, 0.1, 1.4]} position={[0, 0.7, 0]} castShadow material={Materials.Brown} />
                <Sphere args={[0.12]} position={[0, 1.5, 0]} castShadow material={Materials.Bronze} />

                {/* Ornate board frame */}
                <Box args={[1.1, 0.8, 0.1]} position={[0, 1.3, 0.05]} castShadow><meshStandardMaterial color="#8B4513" /></Box>

                {/* Decorative carved frame border */}
                <Box args={[1.15, 0.08, 0.12]} position={[0, 1.7, 0.05]} castShadow material={Materials.Bronze} />
                <Box args={[1.15, 0.08, 0.12]} position={[0, 0.9, 0.05]} castShadow material={Materials.Bronze} />
                <Box args={[0.08, 0.8, 0.12]} position={[-0.55, 1.3, 0.05]} castShadow material={Materials.Bronze} />
                <Box args={[0.08, 0.8, 0.12]} position={[0.55, 1.3, 0.05]} castShadow material={Materials.Bronze} />

                {/* Corner decorations */}
                <Sphere args={[0.06]} position={[-0.55, 1.7, 0.05]} castShadow material={Materials.Gold} />
                <Sphere args={[0.06]} position={[0.55, 1.7, 0.05]} castShadow material={Materials.Gold} />
                <Sphere args={[0.06]} position={[-0.55, 0.9, 0.05]} castShadow material={Materials.Gold} />
                <Sphere args={[0.06]} position={[0.55, 0.9, 0.05]} castShadow material={Materials.Gold} />

                {/* White background for text */}
                <Box args={[0.9, 0.6, 0.02]} position={[0, 1.3, 0.11]} material={Materials.PaintWhite} />
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Leer'))} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1, 1, 1]} position={[0, 1, 0.5]} />
            </RigidBody>
        </group>
    )
}

export const MenuBoard: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    openDialogue("Menu del Dia", "Hoy: Milanesa con Pure.");
                    playSound('rustle');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                {/* Wooden frame for chalkboard */}
                <Box args={[0.65, 0.85, 0.08]} position={[0, 0.35, 0.15]} rotation={[-0.3, 0, 0]} castShadow><meshStandardMaterial color="#8B4513" /></Box>
                <Box args={[0.65, 0.85, 0.08]} position={[0, 0.35, -0.15]} rotation={[0.3, 0, 0]} castShadow><meshStandardMaterial color="#8B4513" /></Box>

                {/* Chalkboard surfaces with decorative frame */}
                <Box args={[0.55, 0.75, 0.03]} position={[0, 0.35, 0.19]} rotation={[-0.3, 0, 0]} castShadow><meshStandardMaterial color="#2c3e50" /></Box>
                <Box args={[0.55, 0.75, 0.03]} position={[0, 0.35, -0.19]} rotation={[0.3, 0, 0]} castShadow><meshStandardMaterial color="#2c3e50" /></Box>

                {/* Decorative chalk holder at bottom */}
                <Box args={[0.6, 0.06, 0.08]} position={[0, -0.03, 0.15]} rotation={[-0.3, 0, 0]} castShadow material={Materials.WoodDark} />
                <Box args={[0.6, 0.06, 0.08]} position={[0, -0.03, -0.15]} rotation={[0.3, 0, 0]} castShadow material={Materials.WoodDark} />

                {/* Decorative chalk pieces */}
                <Cylinder args={[0.015, 0.015, 0.08]} position={[0.15, 0, 0.16]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color="#ffffff" /></Cylinder>
                <Cylinder args={[0.015, 0.015, 0.08]} position={[-0.1, 0, 0.16]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color="#FFD93D" /></Cylinder>

                {/* Top decorative header */}
                <Box args={[0.7, 0.1, 0.1]} position={[0, 0.8, 0.12]} rotation={[-0.3, 0, 0]} castShadow><meshStandardMaterial color="#D2691E" /></Box>
                <Box args={[0.65, 0.08, 0.02]} position={[0, 0.8, 0.16]} rotation={[-0.3, 0, 0]} castShadow><meshStandardMaterial color="#ffc107" /></Box>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Leer Menu'))} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[0.8, 1, 0.8]} position={[0, 0.5, 0]} />
            </RigidBody>
        </group>
    )
}

export const InfoBoard: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    openDialogue("Info", "Tip: Apreta Shift para correr!");
                    playSound('gem');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                <Cylinder args={[0.06, 0.06, 1]} position={[-0.4, 0.5, 0]} castShadow material={Materials.Silver} />
                <Cylinder args={[0.06, 0.06, 1]} position={[0.4, 0.5, 0]} castShadow material={Materials.Silver} />
                <Box args={[1.2, 0.8, 0.1]} position={[0, 1, 0]} castShadow><meshStandardMaterial color="#2c3e50" /></Box>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Info'))} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1.2, 1, 1]} position={[0, 1, 0.5]} />
            </RigidBody>
        </group>
    )
}

export const StreetClock: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    return (
        <RigidBody type="fixed" colliders="hull" friction={0} position={position} rotation={rotation}>
            <group>
                {/* Ornate vintage base */}
                <Cylinder args={[0.2, 0.25, 0.4]} position={[0, 0.2, 0]} castShadow material={Materials.TrafficBlack} />
                <Cylinder args={[0.18, 0.18, 0.3, 8]} position={[0, 0.55, 0]} castShadow material={Materials.Bronze} />

                {/* Decorative pole with vintage details */}
                <Cylinder args={[0.12, 0.12, 2.2]} position={[0, 1.8, 0]} castShadow material={Materials.TrafficBlack} />
                <Cylinder args={[0.15, 0.15, 0.1, 8]} position={[0, 0.8, 0]} castShadow material={Materials.Bronze} />
                <Cylinder args={[0.15, 0.15, 0.1, 8]} position={[0, 2.8, 0]} castShadow material={Materials.Bronze} />

                {/* Ornamental clock housing */}
                <Box args={[1, 1, 0.35]} position={[0, 3.2, 0]} castShadow material={Materials.TrafficBlack} />
                <Cylinder args={[0.08, 0.08, 0.15, 4]} position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={Materials.Bronze} />

                {/* Clock face (both sides) */}
                <Cylinder args={[0.42, 0.42, 0.37, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0]} castShadow material={Materials.PaintWhite} />

                {/* Decorative rim around clock */}
                <Cylinder args={[0.45, 0.45, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0.2]} castShadow material={Materials.Gold} />
                <Cylinder args={[0.45, 0.45, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, -0.2]} castShadow material={Materials.Gold} />

                {/* Clock hands */}
                <Box args={[0.04, 0.28, 0.02]} position={[0, 3.32, 0.19]} rotation={[0, 0, -0.5]} castShadow material={Materials.TrafficBlack} />
                <Box args={[0.04, 0.2, 0.02]} position={[0, 3.28, 0.19]} rotation={[0, 0, 0.8]} castShadow><meshStandardMaterial color="#8B4513" /></Box>

                {/* Center hub */}
                <Sphere args={[0.03]} position={[0, 3.2, 0.2]} castShadow material={Materials.Bronze} />

                {/* Number markers (decorative dots) */}
                <Sphere args={[0.02]} position={[0, 3.6, 0.19]} castShadow material={Materials.TrafficBlack} />
                <Sphere args={[0.02]} position={[0.4, 3.2, 0.19]} castShadow material={Materials.TrafficBlack} />
                <Sphere args={[0.02]} position={[0, 2.8, 0.19]} castShadow material={Materials.TrafficBlack} />
                <Sphere args={[0.02]} position={[-0.4, 3.2, 0.19]} castShadow material={Materials.TrafficBlack} />
            </group>
        </RigidBody>
    )
}
