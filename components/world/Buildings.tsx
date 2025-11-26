import React, { useState, useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Cylinder, Sphere, Text, useKeyboardControls, Cone, Torus, Detailed } from '@react-three/drei';
import { Playground } from './Playground';
import { InteractiveBush } from './Nature';
import { useGameStore, Controls } from '../../store';
import { playSound } from '../../utils/audio';
import { Materials } from '../../utils/materials';

export const Ambulance: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = ({ position, rotation }) => (
    <RigidBody type="fixed" colliders="hull" position={position} rotation={rotation}>
        <group>
            <Box args={[1.2, 1.2, 2.5]} position={[0, 0.8, 0]} castShadow material={Materials.ClinicalWhite} />
            <Box args={[1.1, 0.8, 0.8]} position={[0, 0.6, 1.5]} castShadow material={Materials.ClinicalWhite} />
            {/* Windows */}
            <Box args={[1, 0.5, 0.1]} position={[0, 0.8, 1.9]}><meshStandardMaterial color="#b3e5fc" /></Box>
            {/* Wheels */}
            <Cylinder args={[0.3, 0.3, 1.4]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.3, 1]}><meshStandardMaterial color="#333" /></Cylinder>
            <Cylinder args={[0.3, 0.3, 1.4]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.3, -0.8]}><meshStandardMaterial color="#333" /></Cylinder>
            {/* Red Stripe */}
            <Box args={[1.22, 0.15, 2.5]} position={[0, 0.8, 0]}><meshStandardMaterial color="#ef5350" /></Box>
            {/* Lights */}
            <Box args={[0.8, 0.1, 0.2]} position={[0, 1.45, 1]}><meshStandardMaterial color="#ef5350" emissive="#ff0000" emissiveIntensity={1} /></Box>
        </group>
    </RigidBody>
)

export const BookReturnBin: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
        <Box args={[0.6, 0.8, 0.6]} position={[0, 0.4, 0]} castShadow><meshStandardMaterial color="#5d4037" /></Box>
        <Box args={[0.5, 0.1, 0.05]} position={[0, 0.6, 0.31]}><meshStandardMaterial color="#1a1a1a" /></Box>
        <Box args={[0.5, 0.2, 0.02]} position={[0, 0.3, 0.31]} material={Materials.PaintWhite} />
        <Text position={[0, 0.3, 0.32]} fontSize={0.1} color="black">BOOKS</Text>
    </RigidBody>
)

export const ATM: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    const openDialogue = useGameStore(s => s.openDialogue);
    const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
    const coins = useGameStore(s => s.coins);
    const isHolding = useGameStore(s => s.isHolding);
    const [inRange, setInRange] = useState(false);
    const [subscribeKeys] = useKeyboardControls();

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed) {
                    openDialogue("Cajero Automatico", `Saldo actual: $${coins}`);
                    playSound('coin');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, openDialogue, coins, isHolding]);

    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                <Box args={[0.8, 1.8, 0.6]} position={[0, 0.9, 0]} castShadow><meshStandardMaterial color="#cfd8dc" /></Box>
                <Box args={[0.6, 0.5, 0.1]} position={[0, 1.2, 0.3]}><meshStandardMaterial color="#81d4fa" /></Box>
                <Box args={[0.6, 0.3, 0.1]} position={[0, 0.7, 0.3]}><meshStandardMaterial color="#546e7a" /></Box>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid" sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel('Ver Saldo'))} onIntersectionExit={() => (setInRange(false), setInteractionLabel(null))}>
                <CuboidCollider args={[1, 1, 1]} position={[0, 1, 0.5]} />
            </RigidBody>
        </group>
    )
}

export const PhoneBooth: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                <Box args={[1, 2.2, 1]} position={[0, 1.1, 0]} castShadow><meshStandardMaterial color="#d32f2f" /></Box>
                <Box args={[0.8, 1.8, 0.8]} position={[0, 1.1, 0]}><meshStandardMaterial color="#b3e5fc" transparent opacity={0.5} /></Box>
            </RigidBody>
        </group>
    )
}

export const VendingMachine: React.FC<{ position: [number, number, number], rotation?: [number, number, number], color?: 'red' | 'blue' }> = ({ position, rotation = [0, 0, 0], color = 'red' }) => {
    const mat = color === 'red' ? Materials.VendingRed : Materials.VendingBlue;
    return (
        <RigidBody type="fixed" colliders="cuboid" friction={0} position={position} rotation={rotation}>
            <group>
                <Box args={[1.2, 2.2, 0.8]} position={[0, 1.1, 0]} castShadow material={mat} />
                <Box args={[1.0, 1.2, 0.1]} position={[0, 1.3, 0.4]} material={Materials.Glass} />
                <Box args={[0.8, 1.2, 0.1]} position={[0, 0.6, 2]} material={Materials.WoodDark} />
                <Sphere args={[0.03]} position={[0.35, 1.5, 0.45]} ><meshStandardMaterial color="#00ff00" emissive="#00ff00" /></Sphere>
                <Sphere args={[0.03]} position={[0.35, 1.4, 0.45]} ><meshStandardMaterial color="#ff0000" emissive="#ff0000" /></Sphere>
            </group>
        </RigidBody>
    )
}

export const BusStop: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => {
    return (
        <group position={position} rotation={rotation}>
            <RigidBody type="fixed" colliders="hull" friction={0}>
                <Box args={[4, 0.1, 4]} position={[0, 0.05, 0]} material={Materials.Sidewalk} />
                <Box args={[3.8, 3, 3.8]} position={[0, 1.5, 0]} castShadow receiveShadow material={Materials.BuildingG} />
                <Box args={[4, 0.2, 4]} position={[0, 3.1, 0]} castShadow material={Materials.Roof} />
                <Box args={[3, 2.5, 0.1]} position={[0, 1.25, -0.5]} castShadow material={Materials.Glass} />
                <Box args={[3.2, 0.1, 2]} position={[0, 2.5, 0.4]} castShadow material={Materials.Metal} />
                <Cylinder args={[0.05, 0.05, 2.5]} position={[-1.4, 1.25, 1.2]} material={Materials.Metal} />
                <Cylinder args={[0.05, 0.05, 2.5]} position={[1.4, 1.25, 1.2]} material={Materials.Metal} />
                <Box args={[2.5, 0.1, 0.6]} position={[0, 0.5, -0.2]} castShadow material={Materials.Metal} />
            </RigidBody>
            <CuboidCollider args={[1.5, 1, 1]} position={[0, 1, 0.5]} sensor />
        </group>
    )
}

const Cottage: React.FC<any> = ({ width, height, mat, isNight }) => {
    const time = Date.now() * 0.001;
    return (
        <group>
            {/* Zócalo/base con detalle de piedra */}
            <Box args={[width + 0.15, 0.35, width + 0.15]} position={[0, 0.175, 0]} castShadow material={Materials.Stone} />
            {/* Franja decorativa en base */}
            <Box args={[width + 0.12, 0.08, width + 0.12]} position={[0, 0.36, 0]} material={Materials.StoneGray} />

            {/* Main building */}
            <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={mat} />

            {/* Cornisa superior con más detalle */}
            <Box args={[width + 0.25, 0.12, width + 0.25]} position={[0, height - 0.06, 0]} castShadow material={Materials.Stone} />
            <Box args={[width + 0.2, 0.08, width + 0.2]} position={[0, height + 0.04, 0]} castShadow material={Materials.StoneCream} />

            {/* Techo con bordes más suaves y color mejorado */}
            <Cone args={[width * 0.88, 2.2, 8]} position={[0, height + 1.1, 0]} rotation={[0, Math.PI / 8, 0]} castShadow material={Materials.Roof} />
            {/* Borde del techo */}
            <Box args={[width * 0.95, 0.08, width * 0.95]} position={[0, height + 0.08, 0]} rotation={[0, Math.PI / 8, 0]} material={Materials.RoofDark} />

            {/* Chimenea mejorada */}
            <Box args={[0.6, 1.5, 0.6]} position={[1, height + 1, -0.5]} castShadow material={Materials.Stone} />
            <Box args={[0.7, 0.2, 0.7]} position={[1, height + 1.85, -0.5]} castShadow material={Materials.Stone} />

            {/* Humo de chimenea (esferas animadas) */}
            {[0, 0.3, 0.6, 0.9].map((offset, i) => (
                <Sphere
                    key={i}
                    args={[0.15 - i * 0.02]}
                    position={[
                        1 + Math.sin(time + i) * 0.1,
                        height + 2.2 + offset + Math.sin(time * 2 + i) * 0.05,
                        -0.5 + Math.cos(time + i) * 0.1
                    ]}
                >
                    <meshStandardMaterial color="#e0e0e0" transparent opacity={0.6 - i * 0.12} />
                </Sphere>
            ))}

            {/* Puerta con detalles */}
            <Box args={[1, 1.5, 0.1]} position={[0, 0.75, width / 2 + 0.05]} receiveShadow material={Materials.Brown} />
            {/* Manija de puerta */}
            <Sphere args={[0.05]} position={[0.3, 0.8, width / 2 + 0.11]}>
                <meshStandardMaterial color="#ffc107" metalness={0.8} roughness={0.2} />
            </Sphere>

            {/* Ventana con marco */}
            <group position={[0, height / 2 + 0.5, width / 2]}>
                {/* Marco de ventana */}
                <Box args={[1.1, 0.08, 0.08]} position={[0, 0.54, 0.06]} material={Materials.Brown} />
                <Box args={[1.1, 0.08, 0.08]} position={[0, -0.54, 0.06]} material={Materials.Brown} />
                <Box args={[0.08, 1, 0.08]} position={[-0.54, 0, 0.06]} material={Materials.Brown} />
                <Box args={[0.08, 1, 0.08]} position={[0.54, 0, 0.06]} material={Materials.Brown} />
                {/* Cruz divisoria */}
                <Box args={[1.1, 0.05, 0.05]} position={[0, 0, 0.07]} material={Materials.Brown} />
                <Box args={[0.05, 1.1, 0.05]} position={[0, 0, 0.07]} material={Materials.Brown} />
                {/* Cristal */}
                <Box args={[1, 1, 0.1]} position={[0, 0, 0.06]}>
                    <meshStandardMaterial
                        color={isNight ? "#FFF8DC" : "#b3e5fc"}
                        emissive={isNight ? "#FFF8DC" : "black"}
                        emissiveIntensity={isNight ? 0.8 : 0}
                    />
                </Box>
                {/* Macetas en ventana */}
                <Box args={[0.25, 0.15, 0.15]} position={[-0.35, -0.58, 0.15]} material={Materials.Terracotta} />
                <Sphere args={[0.08]} position={[-0.35, -0.45, 0.15]}>
                    <meshStandardMaterial color="#ff69b4" />
                </Sphere>
                <Box args={[0.25, 0.15, 0.15]} position={[0.35, -0.58, 0.15]} material={Materials.Terracotta} />
                <Sphere args={[0.08]} position={[0.35, -0.45, 0.15]}>
                    <meshStandardMaterial color="#ffeb3b" />
                </Sphere>
            </group>
        </group>
    );
}

const Townhouse: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        {/* Cuerpo principal */}
        <Box args={[width * 0.9, height, width * 0.6]} position={[0, height / 2, -0.1]} castShadow receiveShadow material={Materials.BuildingB} />
        {/* Volumen adosado */}
        <Box args={[width * 0.7, height * 0.75, width * 0.55]} position={[0.45, height * 0.375, width * 0.1]} castShadow receiveShadow material={Materials.BuildingC} />

        {/* Cubierta a dos aguas simple */}
        <Box args={[width * 0.95, 0.3, width * 0.65]} position={[0, height + 0.1, -0.1]} castShadow material={Materials.RoofDark} />
        <Box args={[width * 0.75, 0.26, width * 0.6]} position={[0.45, height * 0.85, width * 0.1]} castShadow material={Materials.Roof} />

        {/* Puerta */}
        <Box args={[0.9, 1.8, 0.1]} position={[0.05, 0.9, width * 0.3]} receiveShadow material={Materials.LightWood} />
        <Sphere args={[0.05]} position={[0.35, 0.95, width * 0.35]}>
            <meshStandardMaterial color="#ffc107" metalness={0.8} roughness={0.2} />
        </Sphere>

        {/* Ventanas */}
        {[0, 1].map(i => (
            <Box key={i} args={[1.2, 1, 0.1]} position={[-0.7 + i * 1.2, 2, width * 0.32]}>
                <meshStandardMaterial
                    color="#dceff7"
                    emissive={isNight ? "#fff2c2" : "black"}
                    emissiveIntensity={isNight ? 0.7 : 0}
                    transparent
                    opacity={0.9}
                />
            </Box>
        ))}

        {/* Macetas frontales */}
        <Box args={[0.35, 0.2, 0.25]} position={[0.9, 0.2, width * 0.35]} material={Materials.Terracotta} />
        <Sphere args={[0.1]} position={[0.9, 0.35, width * 0.35]} material={Materials.NaturalGreen} />
        <Box args={[0.35, 0.2, 0.25]} position={[-0.8, 0.2, width * 0.35]} material={Materials.Terracotta} />
        <Sphere args={[0.1]} position={[-0.8, 0.35, width * 0.35]} material={Materials.NaturalGreen} />
    </group>
)

const Shop: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        {/* Zócalo/base con detalles */}
        <Box args={[width + 1.15, 0.35, width + 0.15]} position={[0, 0.175, 0]} castShadow material={Materials.Stone} />
        {/* Franja decorativa */}
        <Box args={[width + 1.1, 0.08, width + 0.1]} position={[0, 0.36, 0]} material={Materials.StoneGray} />

        {/* Main building */}
        <Box args={[width + 1, height - 0.5, width]} position={[0, (height - 0.5) / 2, 0]} castShadow receiveShadow material={mat} />

        {/* Pilastras decorativas */}
        <Box args={[0.12, height - 0.5, 0.12]} position={[(width + 1) / 2 - 0.1, (height - 0.5) / 2, width / 2 - 0.1]} material={Materials.StoneCream} />
        <Box args={[0.12, height - 0.5, 0.12]} position={[-(width + 1) / 2 + 0.1, (height - 0.5) / 2, width / 2 - 0.1]} material={Materials.StoneCream} />

        {/* Cornisa superior con más detalle */}
        <Box args={[width + 1.35, 0.12, width + 0.25]} position={[0, height - 0.58, 0]} castShadow material={Materials.Stone} />
        <Box args={[width + 1.3, 0.1, width + 0.2]} position={[0, height - 0.45, 0]} castShadow material={Materials.StoneCream} />

        {/* Toldo con rayas de colores mejorado */}
        <group position={[0, 2.25, width / 2 + 0.55]} rotation={[0.32, 0, 0]}>
            {[...Array(7)].map((_, i) => (
                <Box
                    key={i}
                    args={[(width + 1.2) / 7, 0.18, 1.6]}
                    position={[(i - 3) * ((width + 1.2) / 7), 0, 0]}
                    castShadow
                >
                    <meshStandardMaterial color={i % 2 === 0 ? "#D45555" : "#F8F8F8"} />
                </Box>
            ))}
            {/* Borde del toldo */}
            <Box args={[width + 1.3, 0.06, 0.1]} position={[0, -0.08, 0.78]}>
                <meshStandardMaterial color="#C44545" />
            </Box>
        </group>

        {/* Letrero colgante */}
        <Cylinder args={[0.02, 0.02, 0.4]} position={[-1.2, 2.8, width / 2 + 0.8]} material={Materials.Metal} />
        <Box args={[0.6, 0.4, 0.1]} position={[-1.2, 2.4, width / 2 + 0.8]} castShadow>
            <meshStandardMaterial color="#4a4a4a" />
        </Box>

        {/* Ventana grande tipo escaparate con glow */}
        <group position={[0, 1.2, width / 2]}>
            {/* Marco de ventana */}
            <Box args={[3.1, 0.08, 0.08]} position={[0, 0.79, 0.05]} material={Materials.Brown} />
            <Box args={[3.1, 0.08, 0.08]} position={[0, -0.79, 0.05]} material={Materials.Brown} />
            <Box args={[0.08, 1.5, 0.08]} position={[-1.54, 0, 0.05]} material={Materials.Brown} />
            <Box args={[0.08, 1.5, 0.08]} position={[1.54, 0, 0.05]} material={Materials.Brown} />
            {/* Cristal con glow */}
            <Box args={[3, 1.5, 0.1]} position={[0, 0, 0.05]}>
                <meshStandardMaterial
                    color={isNight ? "#fff" : "#fff"}
                    emissive={isNight ? "#ffffcc" : "black"}
                    emissiveIntensity={isNight ? 0.6 : 0}
                    transparent
                    opacity={0.9}
                />
            </Box>
        </group>

        {/* Macetas decorativas en entrada */}
        <Box args={[0.3, 0.25, 0.3]} position={[-1.5, 0.125, width / 2 + 1.2]} material={Materials.Terracotta} />
        <Sphere args={[0.12]} position={[-1.5, 0.35, width / 2 + 1.2]}>
            <meshStandardMaterial color="#9c27b0" />
        </Sphere>
        <Box args={[0.3, 0.25, 0.3]} position={[1.5, 0.125, width / 2 + 1.2]} material={Materials.Terracotta} />
        <Sphere args={[0.12]} position={[1.5, 0.35, width / 2 + 1.2]}>
            <meshStandardMaterial color="#ff5722" />
        </Sphere>
    </group>
)

const Modern: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={mat} />
        <Box args={[width * 0.8, height * 0.6, width * 0.8]} position={[0.5, height + (height * 0.3), 0.5]} castShadow receiveShadow material={Materials.Stone} />
        <InteractiveBush position={[1, height + (height * 0.6) + 0.5, 1]} />
        <Box args={[width - 0.5, height / 2, 0.1]} position={[0, height / 2, width / 2 + 0.05]}>
            <meshStandardMaterial color={isNight ? "#81d4fa" : "#e1f5fe"} emissive={isNight ? "#81d4fa" : "black"} emissiveIntensity={isNight ? 0.8 : 0} transparent opacity={0.8} />
        </Box>
    </group>
)

const ModernLoft: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height / 2, width]} position={[0, height / 4, 0]} castShadow receiveShadow material={Materials.BrickRed} />
        <Box args={[width, height / 2, width - 0.5]} position={[0, height * 0.75, -0.25]} castShadow receiveShadow material={mat} />
        <Box args={[1.2, 2, 0.1]} position={[1, 1, width / 2 + 0.05]} receiveShadow material={Materials.TrafficBlack} />
        <Box args={[2, 1, 0.1]} position={[-1, height * 0.75, width / 2 - 0.2]}>
            <meshStandardMaterial color={isNight ? "#ffeb3b" : "#b3e5fc"} emissive={isNight ? "#ffeb3b" : "black"} emissiveIntensity={isNight ? 1 : 0} />
        </Box>
    </group>
)

const CafeCorner: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        {/* Volumen principal de estuco cálido con chaflán ligero */}
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.BuildingA} />

        {/* Ventanal de esquina */}
        <Box args={[width * 0.9, 1.5, 0.12]} position={[0, 1, width / 2 + 0.05]}>
            <meshStandardMaterial
                color="#dceff7"
                emissive={isNight ? "#ffe6b0" : "black"}
                emissiveIntensity={isNight ? 0.7 : 0}
                transparent
                opacity={0.9}
            />
        </Box>

        {/* Toldo de lona mostaza/terracota */}
        <group position={[0, 2.2, width / 2 + 0.5]} rotation={[0.25, 0, 0]}>
            {[...Array(6)].map((_, i) => (
                <Box
                    key={i}
                    args={[(width + 0.2) / 6, 0.18, 1.3]}
                    position={[(i - 2.5) * ((width + 0.2) / 6), 0, 0]}
                    castShadow
                    material={i % 2 === 0 ? Materials.AwningTerracotta : Materials.AwningMustard}
                />
            ))}
        </group>

        {/* Barra exterior en madera clara */}
        <Box args={[width * 0.9, 0.12, 0.4]} position={[0, 0.9, width / 2 + 0.35]} castShadow material={Materials.LightWood} />

        {/* Letrero */}
        <Box args={[1.2, 0.35, 0.08]} position={[-width * 0.35, 2.4, width / 2 + 0.12]} castShadow material={Materials.SignageBase} />
        <Text position={[-width * 0.35, 2.4, width / 2 + 0.14]} fontSize={0.25} color="#F2C94C" anchorX="center" anchorY="middle">CAFÉ</Text>

        {/* Macetas */}
        <Box args={[0.35, 0.2, 0.25]} position={[width * 0.5, 0.2, width / 2 + 0.4]} material={Materials.Terracotta} />
        <Sphere args={[0.1]} position={[width * 0.5, 0.35, width / 2 + 0.4]} material={Materials.NaturalGreen} />
        <Box args={[0.35, 0.2, 0.25]} position={[-width * 0.5, 0.2, width / 2 + 0.4]} material={Materials.Terracotta} />
        <Sphere args={[0.1]} position={[-width * 0.5, 0.35, width / 2 + 0.4]} material={Materials.NaturalGreen} />
    </group>
)

const DutchHouse: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width - 1, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={mat} />
        <Cylinder args={[width / 2 - 0.5, width / 2 - 0.5, width, 3]} position={[0, height + 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={Materials.RoofDark} />
        <Box args={[0.8, 0.8, 0.1]} position={[0, height - 1, width / 2 + 0.05]}>
            <meshStandardMaterial color={isNight ? "#ffeb3b" : "#b3e5fc"} emissive={isNight ? "#ffeb3b" : "black"} emissiveIntensity={isNight ? 1 : 0} />
        </Box>
    </group>
)

const Tower: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        {/* Cuerpo del faro urbano */}
        <Cylinder args={[width / 2, width / 2, height, 16]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.WallStucco} />
        {/* Franja de color */}
        <Box args={[width, 0.6, width]} position={[0, height * 0.4, 0]} material={Materials.Terracotta} />
        <Box args={[width, 0.4, width]} position={[0, height * 0.65, 0]} material={Materials.Mustard} />

        {/* Linterna superior */}
        <Cylinder args={[width * 0.35, width * 0.35, 1.2, 12]} position={[0, height + 0.6, 0]} castShadow material={Materials.Metal} />
        <Box args={[width * 0.9, 1.2, width * 0.9]} position={[0, height + 1.5, 0]} castShadow>
            <meshStandardMaterial
                color="#dceff7"
                emissive={isNight ? "#ffe6b0" : "black"}
                emissiveIntensity={isNight ? 1.2 : 0}
                transparent
                opacity={0.8}
            />
        </Box>
        <Cone args={[width * 0.7, 1.2, 8]} position={[0, height + 2.4, 0]} castShadow material={Materials.RoofDark} />

        {/* Baranda superior */}
        <Torus args={[width * 0.6, 0.05, 8, 24]} position={[0, height + 1.1, 0]} material={Materials.Metal} />
    </group>
)

const Library: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={mat} />
        <Cylinder args={[0.3, 0.3, height]} position={[-1.5, height / 2, width / 2 + 1]} castShadow material={Materials.Stone} />
        <Cylinder args={[0.3, 0.3, height]} position={[1.5, height / 2, width / 2 + 1]} castShadow material={Materials.Stone} />
        <Box args={[width + 1, 0.5, width + 2]} position={[0, height, 0.5]} castShadow material={Materials.Stone} />
        <Cone args={[width * 0.6, 1.5, 4]} position={[0, height + 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={Materials.RoofGreen} />
        <BookReturnBin position={[2.5, 0.4, width / 2 + 1.5]} />
        <Box args={[1, 2, 0.1]} position={[0, 1.5, width / 2 + 0.05]}>
            <meshStandardMaterial color={isNight ? "#fff59d" : "#e0f7fa"} emissive={isNight ? "#fff59d" : "black"} emissiveIntensity={isNight ? 0.6 : 0} />
        </Box>
    </group>
)

const Apartment: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        {/* Zócalo/base con detalles */}
        <Box args={[width + 0.15, 0.45, width + 0.15]} position={[0, 0.225, 0]} castShadow material={Materials.Stone} />
        {/* Franja decorativa inferior */}
        <Box args={[width + 0.12, 0.1, width + 0.12]} position={[0, 0.48, 0]} material={Materials.StoneGray} />

        {/* Main building */}
        <Box args={[width, height + 2, width]} position={[0, (height + 2) / 2, 0]} castShadow receiveShadow material={mat} />

        {/* Pilastras decorativas en esquinas */}
        <Box args={[0.15, height + 2, 0.15]} position={[width / 2 - 0.1, (height + 2) / 2, width / 2 - 0.1]} material={Materials.StoneCream} />
        <Box args={[0.15, height + 2, 0.15]} position={[-width / 2 + 0.1, (height + 2) / 2, width / 2 - 0.1]} material={Materials.StoneCream} />

        {/* Cornisa superior con más detalle */}
        <Box args={[width + 0.35, 0.15, width + 0.35]} position={[0, height + 1.85, 0]} castShadow material={Materials.Stone} />
        <Box args={[width + 0.3, 0.12, width + 0.3]} position={[0, height + 2.02, 0]} castShadow material={Materials.StoneCream} />

        {/* Cornisas decorativas entre pisos */}
        {[0, 1, 2].map(i => (
            <Box
                key={`cornice-${i}`}
                args={[width + 0.15, 0.1, width + 0.15]}
                position={[0, 0.7 + i * 1.5, 0]}
                castShadow
                material={Materials.Stone}
            />
        ))}

        {/* Pisos con balcones y ventanas variadas */}
        {[0, 1, 2].map(i => (
            <group key={i}>
                {/* Balcón */}
                <Box args={[1.5, 0.1, 0.5]} position={[0, 1.5 + i * 1.5, width / 2 + 0.25]} castShadow material={Materials.Stone} />

                {/* Barandilla del balcón (barras verticales) */}
                {[-0.6, -0.3, 0, 0.3, 0.6].map((xOffset, idx) => (
                    <Box
                        key={idx}
                        args={[0.03, 0.4, 0.03]}
                        position={[xOffset, 1.7 + i * 1.5, width / 2 + 0.48]}
                        material={Materials.Metal}
                    />
                ))}
                {/* Barras horizontales de barandilla */}
                <Box args={[1.5, 0.03, 0.03]} position={[0, 1.55 + i * 1.5, width / 2 + 0.48]} material={Materials.Metal} />
                <Box args={[1.5, 0.03, 0.03]} position={[0, 1.85 + i * 1.5, width / 2 + 0.48]} material={Materials.Metal} />

                {/* Plantas en balcón */}
                <Box args={[0.2, 0.15, 0.15]} position={[-0.5, 1.6 + i * 1.5, width / 2 + 0.35]} material={Materials.Terracotta} />
                <Sphere args={[0.08]} position={[-0.5, 1.72 + i * 1.5, width / 2 + 0.35]}>
                    <meshStandardMaterial color={i === 0 ? "#4caf50" : i === 1 ? "#ff5722" : "#9c27b0"} />
                </Sphere>

                <Box args={[0.2, 0.15, 0.15]} position={[0.5, 1.6 + i * 1.5, width / 2 + 0.35]} material={Materials.Terracotta} />
                <Sphere args={[0.08]} position={[0.5, 1.72 + i * 1.5, width / 2 + 0.35]}>
                    <meshStandardMaterial color={i === 0 ? "#ffeb3b" : i === 1 ? "#e91e63" : "#00bcd4"} />
                </Sphere>

                {/* Ventana con marco y variedad de iluminación */}
                <group position={[0, 2 + i * 1.5, width / 2]}>
                    {/* Marco de ventana */}
                    <Box args={[1.05, 0.06, 0.06]} position={[0, 0.52, 0.05]} material={Materials.Brown} />
                    <Box args={[1.05, 0.06, 0.06]} position={[0, -0.52, 0.05]} material={Materials.Brown} />
                    <Box args={[0.06, 1, 0.06]} position={[-0.52, 0, 0.05]} material={Materials.Brown} />
                    <Box args={[0.06, 1, 0.06]} position={[0.52, 0, 0.05]} material={Materials.Brown} />
                    {/* Cristal con iluminación variada */}
                    <Box args={[1, 1, 0.1]} position={[0, 0, 0.05]}>
                        <meshStandardMaterial
                            color={isNight && (i + Math.floor(Math.random() * 3)) % 3 === 0 ? "#FFF8DC" : "#b3e5fc"}
                            emissive={isNight && (i + Math.floor(Math.random() * 3)) % 3 === 0 ? "#FFF8DC" : "black"}
                            emissiveIntensity={isNight && (i + Math.floor(Math.random() * 3)) % 3 === 0 ? 0.8 : 0}
                        />
                    </Box>
                    {/* Cortina opcional (semi-transparente) */}
                    {i % 2 === 1 && (
                        <Box args={[0.9, 0.5, 0.05]} position={[0, 0.3, 0.04]}>
                            <meshStandardMaterial color="#ffe0b2" transparent opacity={0.4} />
                        </Box>
                    )}
                </group>
            </group>
        ))}
    </group>
)

const Bakery: React.FC<any> = ({ width, height, mat, isNight }) => {
    const time = Date.now() * 0.001;
    return (
        <group>
            {/* Zócalo/base */}
            <Box args={[width + 0.1, 0.3, width + 0.1]} position={[0, 0.15, 0]} castShadow material={Materials.Stone} />

            {/* Main building */}
            <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.BuildingB} />

            {/* Cornisa superior */}
            <Box args={[width + 0.2, 0.15, width + 0.2]} position={[0, height, 0]} castShadow material={Materials.Stone} />

            {/* Toldo a rayas rosa/blanco */}
            <group position={[0, 1.8, width / 2 + 0.5]} rotation={[0.5, 0, 0]}>
                {[...Array(7)].map((_, i) => (
                    <Box key={i} args={[width / 7, 0.1, 1]} position={[(i - 3) * (width / 7), 0, 0]}>
                        <meshStandardMaterial color={i % 2 === 0 ? "#ffb3ba" : "#fff"} />
                    </Box>
                ))}
            </group>

            {/* Olor visual (esferas flotando como aroma) */}
            {[0, 0.4, 0.8].map((offset, i) => (
                <Sphere
                    key={i}
                    args={[0.12 - i * 0.02]}
                    position={[
                        Math.sin(time * 0.8 + i) * 0.3,
                        height + 0.5 + offset + Math.sin(time * 1.5 + i) * 0.1,
                        width / 2 + 0.5 + Math.cos(time * 0.8 + i) * 0.2
                    ]}
                >
                    <meshStandardMaterial color="#ffd54f" transparent opacity={0.5 - i * 0.12} />
                </Sphere>
            ))}

            {/* Ventana con mostrador visible */}
            <group position={[0, 1, width / 2]}>
                {/* Marco de ventana */}
                <Box args={[width - 0.9, 0.08, 0.08]} position={[0, 0.54, 0.05]} material={Materials.Brown} />
                <Box args={[width - 0.9, 0.08, 0.08]} position={[0, -0.54, 0.05]} material={Materials.Brown} />
                <Box args={[0.08, 1, 0.08]} position={[-(width - 1) / 2 + 0.04, 0, 0.05]} material={Materials.Brown} />
                <Box args={[0.08, 1, 0.08]} position={[(width - 1) / 2 - 0.04, 0, 0.05]} material={Materials.Brown} />
                {/* Cristal */}
                <Box args={[width - 1, 1, 0.1]} position={[0, 0, 0.05]}>
                    <meshStandardMaterial
                        color={isNight ? "#FFF8DC" : "#fff"}
                        emissive={isNight ? "#FFF8DC" : "black"}
                        emissiveIntensity={isNight ? 0.5 : 0}
                    />
                </Box>
                {/* Mostrador interior */}
                <Box args={[width - 1.5, 0.3, 0.05]} position={[0, -0.3, 0.03]}>
                    <meshStandardMaterial color="#8b6342" />
                </Box>
                {/* Productos en mostrador (panes) */}
                <Sphere args={[0.1]} position={[-0.4, -0.2, 0.05]}>
                    <meshStandardMaterial color="#d2691e" />
                </Sphere>
                <Sphere args={[0.1]} position={[0, -0.2, 0.05]}>
                    <meshStandardMaterial color="#d2691e" />
                </Sphere>
                <Sphere args={[0.1]} position={[0.4, -0.2, 0.05]}>
                    <meshStandardMaterial color="#d2691e" />
                </Sphere>
            </group>
        </group>
    );
}

const Cinema: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height + 1, width]} position={[0, (height + 1) / 2, 0]} castShadow receiveShadow material={Materials.BuildingG} />
        <Box args={[width + 0.5, 0.8, 1]} position={[0, 2.5, width / 2 + 0.2]} castShadow material={Materials.TrafficBlack} />
        <Box args={[width, 0.6, 0.1]} position={[0, 2.5, width / 2 + 0.7]}><meshStandardMaterial color="#fff" emissive={isNight ? "#fff" : "black"} emissiveIntensity={isNight ? 0.8 : 0} /></Box>
    </group>
)

const School: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width + 2, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.BrickRed} />
        <Box args={[2, 1.5, 1]} position={[0, 0.75, width / 2 + 0.5]} castShadow material={Materials.Silver} />
        <Box args={[width, 1.5, 0.1]} position={[0, 2.5, width / 2 + 0.05]}><meshStandardMaterial color="#87ceeb" emissive={isNight ? "#87ceeb" : "black"} emissiveIntensity={isNight ? 0.4 : 0} /></Box>
        <Cylinder args={[0.4, 0.4, 0.2]} rotation={[Math.PI / 2, 0, 0]} position={[0, height - 1, width / 2 + 0.1]}><meshStandardMaterial color="white" /></Cylinder>
        <Playground position={[-3.5, 0, width / 2 + 2]} />
    </group>
)

const Clinic: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.ClinicalWhite} />
        <Box args={[width + 0.5, 0.5, width + 0.5]} position={[0, height, 0]} castShadow><meshStandardMaterial color="#cfd8dc" /></Box>
        <group position={[1.5, height - 1, width / 2 + 0.1]}>
            <Box args={[0.2, 0.6, 0.05]}><meshStandardMaterial color="#ef5350" emissive={isNight ? "#ef5350" : "black"} emissiveIntensity={isNight ? 1 : 0} /></Box>
            <Box args={[0.6, 0.2, 0.05]}><meshStandardMaterial color="#ef5350" emissive={isNight ? "#ef5350" : "black"} emissiveIntensity={isNight ? 1 : 0} /></Box>
        </group>
        <Ambulance position={[-2.5, 0.4, width / 2 + 2]} rotation={[0, Math.PI / 4, 0]} />
    </group>
)

const FireStation: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width + 1, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.BrickRed} />
        <Box args={[1.5, 1.5, 0.1]} position={[-1.5, 0.75, width / 2 + 0.05]}><meshStandardMaterial color="#546e7a" /></Box>
        <Box args={[1.5, 1.5, 0.1]} position={[1.5, 0.75, width / 2 + 0.05]}><meshStandardMaterial color="#546e7a" /></Box>
        <Box args={[0.5, 0.5, 0.1]} position={[0, 2, width / 2 + 0.05]}><meshStandardMaterial color="#ffcc80" emissive={isNight ? "#ffcc80" : "black"} emissiveIntensity={isNight ? 0.8 : 0} /></Box>
    </group>
)

const Hotel: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height + 2, width]} position={[0, (height + 2) / 2, 0]} castShadow receiveShadow material={Materials.BuildingB} />
        <Box args={[2, 0.2, 1.5]} position={[0, 1.5, width / 2 + 0.75]}><meshStandardMaterial color="#1a237e" /></Box>
        {[0, 1, 2].map(i => <Box key={i} args={[0.8, 0.8, 0.1]} position={[0, 2.5 + i * 1.2, width / 2 + 0.05]}><meshStandardMaterial color="#fff9c4" emissive={isNight ? "#fff9c4" : "black"} emissiveIntensity={isNight ? 0.8 : 0} /></Box>)}
    </group>
)

const Bookstore: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        {/* Fachada de ladrillo suave */}
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.SoftBrick} />

        {/* Cornisa ligera */}
        <Box args={[width + 0.3, 0.18, width + 0.1]} position={[0, height, 0]} castShadow material={Materials.Stone} />

        {/* Escaparate profundo */}
        <Box args={[width * 0.9, 1.4, 0.12]} position={[0, 1.1, width / 2 + 0.06]}>
            <meshStandardMaterial
                color="#dceff7"
                emissive={isNight ? "#ffe6b0" : "black"}
                emissiveIntensity={isNight ? 0.7 : 0}
                transparent
                opacity={0.88}
            />
        </Box>
        {/* Marcos de madera */}
        <Box args={[width * 0.95, 0.08, 0.08]} position={[0, 1.8, width / 2 + 0.09]} material={Materials.LightWood} />
        <Box args={[width * 0.95, 0.08, 0.08]} position={[0, 0.4, width / 2 + 0.09]} material={Materials.LightWood} />
        <Box args={[0.08, 1.4, 0.08]} position={[ -width * 0.4, 1.1, width / 2 + 0.09]} material={Materials.LightWood} />
        <Box args={[0.08, 1.4, 0.08]} position={[ width * 0.4, 1.1, width / 2 + 0.09]} material={Materials.LightWood} />

        {/* Rótulo */}
        <Box args={[width * 0.9, 0.28, 0.08]} position={[0, 2.25, width / 2 + 0.1]} castShadow material={Materials.SignageBase} />
        <Text position={[0, 2.25, width / 2 + 0.12]} fontSize={0.28} color="#F2C94C" anchorX="center" anchorY="middle">LIBRERÍA</Text>

        {/* Banca lateral */}
        <Box args={[1.6, 0.12, 0.35]} position={[-width * 0.25, 0.45, width / 2 + 0.35]} castShadow material={Materials.LightWood} />
        <Box args={[0.08, 0.4, 0.08]} position={[-width * 0.25 + 0.7, 0.26, width / 2 + 0.35]} material={Materials.Brown} />
        <Box args={[0.08, 0.4, 0.08]} position={[-width * 0.25 - 0.7, 0.26, width / 2 + 0.35]} material={Materials.Brown} />

        {/* Macetas */}
        <Box args={[0.35, 0.2, 0.25]} position={[width * 0.55, 0.2, width / 2 + 0.35]} material={Materials.Terracotta} />
        <Sphere args={[0.1]} position={[width * 0.55, 0.35, width / 2 + 0.35]} material={Materials.NaturalGreen} />
    </group>
)

const Museum: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width + 1, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.Stone} />
        <Sphere args={[width / 2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, height, 0]} castShadow material={Materials.RoofGreen} />
        <Box args={[0.8, 2, 0.1]} position={[1.5, 1.5, width / 2 + 0.05]}><meshStandardMaterial color="#b3e5fc" emissive={isNight ? "#b3e5fc" : "black"} emissiveIntensity={isNight ? 0.5 : 0} /></Box>
        <Box args={[0.8, 2, 0.1]} position={[-1.5, 1.5, width / 2 + 0.05]}><meshStandardMaterial color="#b3e5fc" emissive={isNight ? "#b3e5fc" : "black"} emissiveIntensity={isNight ? 0.5 : 0} /></Box>
    </group>
)

const Arcade: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow><meshStandardMaterial color="#222" /></Box>
        <Text position={[0, 2.5, width / 2 + 0.25]} fontSize={0.5} color="#ff2a6d" anchorX="center" anchorY="middle">ARCADE</Text>
        <Box args={[width, 0.2, 0.2]} position={[0, height - 0.2, width / 2 + 0.1]}><meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={isNight ? 2 : 0} /></Box>
    </group>
)

const BurgerJoint: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.BuildingB} />
        <group position={[0, height + 1, 0]}>
            <Cylinder args={[0.8, 0.8, 0.3]} position={[0, 0, 0]} material={Materials.BurgerBun} />
            <Cylinder args={[0.85, 0.85, 0.15]} position={[0, 0.25, 0]} material={Materials.BurgerMeat} />
            <Cylinder args={[0.8, 0.8, 0.3]} position={[0, 0.5, 0]} material={Materials.BurgerBun} />
        </group>
        <Box args={[2, 1, 0.1]} position={[0, 1.5, width / 2 + 0.05]}><meshStandardMaterial color="#ffcc80" emissive={isNight ? "#ffcc80" : "black"} emissiveIntensity={isNight ? 0.8 : 0} /></Box>
    </group>
)

const IceCreamParlor: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.BuildingCream} />
        <Box args={[width + 0.2, 0.4, width + 0.2]} position={[0, 1, 0]} material={Materials.IceCreamPink} />
        <Cone args={[1, 3, 16]} position={[0, height + 1.5, 0]} rotation={[Math.PI, 0, 0]} castShadow material={Materials.IceCreamCone} />
        <Sphere args={[0.9]} position={[0, height + 3, 0]} material={Materials.IceCreamPink} />
        <Sphere args={[0.3]} position={[0.4, height + 3.5, 0.4]}><meshStandardMaterial color="#ff0000" /></Sphere>
    </group>
)

const PostOffice: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.PostBlue} />
        <Box args={[width + 0.2, 0.2, width + 0.2]} position={[0, height, 0]} material={Materials.PostYellow} />
        <Box args={[0.8, 0.5, 0.05]} position={[0, 1.5, width / 2 + 0.05]}><meshStandardMaterial color="#fff" /></Box>
        <Text position={[0, 1.5, width / 2 + 0.06]} fontSize={0.3} color="#000" anchorX="center" anchorY="middle">CORREO</Text>
    </group>
)

const ArtGallery: React.FC<any> = ({ width, height, mat, isNight }) => (
    <group>
        {/* Mercado tech local: nave baja con pórticos y claraboyas */}
        <Box args={[width + 0.6, height * 0.15, width + 0.4]} position={[0, height * 0.1, 0]} castShadow material={Materials.Paver} />
        <Box args={[width, height * 0.7, width]} position={[0, height * 0.35 + 0.1, 0]} castShadow receiveShadow material={Materials.BuildingF} />

        {/* Pórticos de madera */}
        {[ -width * 0.45, width * 0.45 ].map((x, idx) => (
            <Box key={idx} args={[0.16, height * 0.9, width + 0.2]} position={[x, height * 0.45, 0]} castShadow material={Materials.LightWood} />
        ))}

        {/* Claraboya central */}
        <Box args={[width * 0.6, 0.2, width * 0.4]} position={[0, height * 0.85, 0]} castShadow material={Materials.TemperedGlass} />

        {/* Fachada de vidrio templado hacia el frente */}
        <Box args={[width * 0.9, 1.8, 0.12]} position={[0, 1.1, width / 2 + 0.06]}>
            <meshStandardMaterial
                color="#dceff7"
                emissive={isNight ? "#ffe6b0" : "black"}
                emissiveIntensity={isNight ? 0.9 : 0}
                transparent
                opacity={0.88}
            />
        </Box>

        {/* Marquesina */}
        <Box args={[width + 0.4, 0.18, 1.2]} position={[0, 2.1, width / 2 + 0.5]} rotation={[0.2, 0, 0]} castShadow material={Materials.AwningMustard} />

        {/* Toldos modulares laterales */}
        {[-1, 1].map((side) => (
            <group key={side} position={[side * (width * 0.55), 1.8, 0]} rotation={[0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                {[...Array(3)].map((_, i) => (
                    <Box
                        key={i}
                        args={[width * 0.18, 0.14, 0.8]}
                        position={[0, 0, -width * 0.35 + i * width * 0.35]}
                        castShadow
                        material={i % 2 === 0 ? Materials.AwningTerracotta : Materials.AwningMustard}
                    />
                ))}
            </group>
        ))}

        {/* Rótulo frontal */}
        <Box args={[width * 0.9, 0.25, 0.08]} position={[0, 2.35, width / 2 + 0.1]} castShadow material={Materials.SignageBase} />
        <Text position={[0, 2.35, width / 2 + 0.12]} fontSize={0.26} color="#F2C94C" anchorX="center" anchorY="middle">MERCADO</Text>

        {/* Panel solar estilizado */}
        <Box args={[width * 0.35, 0.08, width * 0.2]} position={[0, height * 0.9, -width * 0.1]} rotation={[Math.PI / 8, 0, 0]} material={Materials.SignageAccent} />

        {/* Macetas grandes */}
        <Box args={[0.5, 0.3, 0.5]} position={[width * 0.55, 0.15, width * 0.35]} material={Materials.Terracotta} />
        <Sphere args={[0.16]} position={[width * 0.55, 0.45, width * 0.35]} material={Materials.NaturalGreen} />
        <Box args={[0.5, 0.3, 0.5]} position={[-width * 0.55, 0.15, width * 0.35]} material={Materials.Terracotta} />
        <Sphere args={[0.16]} position={[-width * 0.55, 0.45, width * 0.35]} material={Materials.NaturalGreen} />
    </group>
)

const Pizzeria: React.FC<any> = ({ width, height, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow receiveShadow material={Materials.BuildingB} />
        {/* Awning */}
        <group position={[0, 1.5, width / 2 + 0.5]} rotation={[0.3, 0, 0]}>
            <Box args={[width + 0.2, 0.1, 1]}><meshStandardMaterial color="#fff" /></Box>
            <Box args={[width / 3, 0.12, 1.02]} position={[-width / 3, 0, 0]} material={Materials.AwningGreen} />
            <Box args={[width / 3, 0.12, 1.02]} position={[width / 3, 0, 0]} material={Materials.AwningRed} />
        </group>
        <Text position={[0, 2.5, width / 2 + 0.1]} fontSize={0.5} color="#d32f2f">PIZZA</Text>
        <Box args={[width - 1, 1, 0.1]} position={[0, 1, width / 2 + 0.05]}><meshStandardMaterial color="#fff" emissive={isNight ? "#ffcc80" : "black"} emissiveIntensity={isNight ? 0.6 : 0} /></Box>
    </group>
);

const FlowerShop: React.FC<any> = ({ width, height, isNight }) => (
    <group>
        <Box args={[width, height / 2, width]} position={[0, height / 4, 0]} castShadow material={Materials.WoodDark} />
        <Box args={[width - 0.2, height / 2, width - 0.2]} position={[0, height * 0.75, 0]} castShadow material={Materials.GlassGreen} />
        {/* Roof */}
        <Cone args={[width / 2 + 0.5, 1.5, 4]} position={[0, height + 0.75, 0]} rotation={[0, Math.PI / 4, 0]} material={Materials.RoofGreen} />
    </group>
);

const MusicStore: React.FC<any> = ({ width, height, isNight }) => (
    <group>
        <Box args={[width, height, width]} position={[0, height / 2, 0]} castShadow material={Materials.MusicBlack} />
        <Box args={[width - 1, 1, 0.2]} position={[0, height - 1, width / 2]} material={Materials.NeonPurple} />
        <Text position={[0, height - 1, width / 2 + 0.15]} fontSize={0.4} color="white">MUSIC</Text>
    </group>
);


export const Building: React.FC<{ position: [number, number, number]; variant: string; width?: number; height?: number }> = ({
    position, variant, width = 4, height = 4
}) => {
    const isNight = useGameStore(s => s.isNight);
    let mat = Materials.BuildingA;
    if (variant === 'B') mat = Materials.BuildingB;
    if (variant === 'C') mat = Materials.BuildingC;
    if (variant === 'D') mat = Materials.BuildingD;
    if (variant === 'E') mat = Materials.BuildingE;
    if (variant === 'F') mat = Materials.BuildingF;
    if (variant === 'G') mat = Materials.BuildingG;
    if (variant === 'H') mat = Materials.BuildingB;
    if (variant === 'I') mat = Materials.BuildingG;
    if (variant === 'L') mat = Materials.BuildingF;
    if (variant === 'M') mat = Materials.BuildingB;
    if (variant === 'N') mat = Materials.BuildingC;
    if (variant === 'O') mat = Materials.BuildingD;
    if (variant === 'P') mat = Materials.BuildingE;
    if (variant === 'Q') mat = Materials.BuildingF;
    if (variant === 'R') mat = Materials.BuildingB;
    if (variant === 'S') mat = Materials.BuildingA;
    if (variant === 'T') mat = Materials.BuildingC;

    const highDetail = (
        <>
            {variant === 'A' && <Cottage width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'B' && <Townhouse width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'C' && <Shop width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'D' && <Modern width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'E' && <Tower width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'F' && <Library width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'G' && <Apartment width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'H' && <Bakery width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'I' && <Cinema width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'J' && <School width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'K' && <Clinic width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'L' && <ModernLoft width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'M' && <CafeCorner width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'N' && <DutchHouse width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'O' && <FireStation width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'P' && <Hotel width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'Q' && <Bookstore width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'R' && <Museum width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'S' && <Arcade width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'T' && <BurgerJoint width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'U' && <IceCreamParlor width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'V' && <PostOffice width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'W' && <ArtGallery width={width} height={height} mat={mat} isNight={isNight} />}
            {variant === 'X' && <Pizzeria width={width} height={height} isNight={isNight} />}
            {variant === 'Y' && <FlowerShop width={width} height={height} isNight={isNight} />}
            {variant === 'Z' && <MusicStore width={width} height={height} isNight={isNight} />}
        </>
    );

    const lowDetail = (
        <group>
            <Box args={[width, height, width]} position={[0, (height) / 2, 0]} castShadow receiveShadow material={mat} />
            <Box args={[width * 0.6, 1.2, 0.08]} position={[0, height * 0.4, width / 2 + 0.04]}>
                <meshStandardMaterial color={isNight ? "#fff2c2" : "#dceff7"} emissive={isNight ? "#fff2c2" : "black"} emissiveIntensity={isNight ? 0.4 : 0} transparent opacity={0.85} />
            </Box>
        </group>
    );

    return (
        <RigidBody type="fixed" colliders="cuboid" position={position} friction={0}>
            <Detailed distances={[0, 45]}>
                <group>{highDetail}</group>
                {lowDetail}
            </Detailed>
        </RigidBody>
    );
};
