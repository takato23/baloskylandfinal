import { InstancedRoadMarkings, TreeInstances, LampInstances, LampPointLights, FenceInstances } from './world/InstancedWorldElements';
import { Quaternion, Vector3, Euler } from 'three';
import * as THREE from 'three';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Torus, Cone, Text, Cylinder } from '@react-three/drei';
import { useGameStore, NpcConfig, AnimalType } from '../store';
import { Skateboard, WorldSkateboard, NPCCar } from './Vehicle';
import { Materials } from '../utils/materials';
import { Fence, SpeedBump, TrafficCone, BikeRack, TrashCan, ParkBin, FireHydrant, BirdBath, Mailbox, Bench, TrafficLight } from './world/Props';
import { Ambulance, BookReturnBin, ATM, PhoneBooth, VendingMachine, BusStop, Building } from './world/Buildings';
import { Playground } from './world/Playground';
import {
    InteractiveBush,
    Planter,
    FlowerPot,
    FlowerPatch
} from './world/Nature';
import { StreetNameSign, SignBoard, MenuBoard, InfoBoard, StreetClock } from './world/Signs';
import {
    Telescope,
    DrinkingFountain,
    PicnicTable,
    Coin,
    Fountain,
    ThrowableBall
} from './world/Interactables';
import { GrindRail, GrindRamp, SkateObstacle } from './world/GrindRails';
import { SimpleNPC } from './npc/SimpleNPC';
import { LiveNPC } from './npc/LiveNPC';
import { CharacterModel } from './player/CharacterModel';
import {
    Puddle,
    FoodTruck,
    PhoneBoothRetro,
    ManholeInstances,
    DrainInstances,
    BollardInstances
} from './world/StreetDetails';
import { ActivitySpawner } from './activities/ActivitySpawner';
import { OptimizedBoundary } from './world/OptimizedBoundary';
import { OptimizedNPCs } from './world/OptimizedNPCs';
import { InteractiveBillboard } from './world/Billboard';
import { FishingPond } from './world/FishingPond';
import { QUALITY_PRESETS } from '../utils/performance';

// --- Configuration ---
// REDUCED for mobile performance: 3x3 grid instead of 5x5
const GRID_SIZE = 3;
const BLOCK_SIZE = 10;
const SIDEWALK_WIDTH = 1.5;
const SIDEWALK_HEIGHT = 0.15;
const STREET_WIDTH = 6;
const CELL_SIZE = BLOCK_SIZE + (SIDEWALK_WIDTH * 2) + STREET_WIDTH;
const MAP_SIZE = GRID_SIZE * CELL_SIZE;

const dedupeByGrid = <T,>(items: T[], positionGetter: (item: T) => [number, number, number], cell = 0.25) => {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
        const [x, , z] = positionGetter(item);
        const key = `${Math.round(x / cell)}_${Math.round(z / cell)}`;
        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    }
    return result;
};

// Helper to add box data
const addBox = (list: any[], size: [number, number, number], pos: [number, number, number], rot: [number, number, number], offset: [number, number, number] = [0, 0, 0]) => {
    // We need to apply the rotation to the offset to get the correct world position
    const q = new Quaternion().setFromEuler(new Euler(rot[0], rot[1], rot[2]));
    const offsetVec = new Vector3(offset[0], offset[1], offset[2]).applyQuaternion(q);

    list.push({
        position: [pos[0] + offsetVec.x, pos[1] + offsetVec.y, pos[2] + offsetVec.z],
        rotation: rot,
        scale: size
    });
};

// Helper to generate trees for a block
const getBlockTrees = (x: number, z: number) => {
    const trees: { position: [number, number, number], scale: number }[] = [];
    const pos: [number, number, number] = [x * CELL_SIZE, 0, z * CELL_SIZE];
    const seed = Math.abs(x * 7 + z * 13);
    const isCenter = x === 0 && z === 0;
    const hasBuilding = seed % 3 !== 0;

    if (isCenter) {
        trees.push({ position: [pos[0] - 3.5, 0.2, pos[2] - 3.5], scale: 1.2 });
        trees.push({ position: [pos[0] + 3.5, 0.2, pos[2] - 3.5], scale: 1.2 });
        trees.push({ position: [pos[0] - 3.5, 0.2, pos[2] + 3.5], scale: 1.2 });
        trees.push({ position: [pos[0] + 3.5, 0.2, pos[2] + 3.5], scale: 1.2 });
    } else {
        if (!hasBuilding) {
            trees.push({ position: [pos[0] - 2, 0.2, pos[2] - 2], scale: 1 });
            trees.push({ position: [pos[0] + 2, 0.2, pos[2] + 2], scale: 1.2 });
        }
    }
    return trees;
};

// Helper to generate lamps for a block
// Lamps are positioned on sidewalk corners, facing the street for proper illumination
const getBlockLamps = (x: number, z: number) => {
    const lamps: { position: [number, number, number], rotation: [number, number, number] }[] = [];
    const pos: [number, number, number] = [x * CELL_SIZE, 0, z * CELL_SIZE];
    const seed = Math.abs(x * 7 + z * 13);
    const isCenter = x === 0 && z === 0;

    const addLamp = (relPos: [number, number, number], rot: [number, number, number]) => {
        lamps.push({ position: [pos[0] + relPos[0], relPos[1], pos[2] + relPos[2]], rotation: rot });
    };

    // Lamp placement: on sidewalk corners, facing diagonally toward street intersection
    // This provides better light coverage and looks more natural
    const sidewalkEdge = BLOCK_SIZE / 2 + SIDEWALK_WIDTH - 0.3; // Just inside sidewalk edge

    if (isCenter) {
        // Park block: lamps at each corner of the park, facing outward toward streets
        addLamp([-sidewalkEdge, 0.15, -sidewalkEdge], [0, Math.PI * 0.75, 0]);  // NW corner
        addLamp([sidewalkEdge, 0.15, -sidewalkEdge], [0, -Math.PI * 0.75, 0]);  // NE corner
        addLamp([-sidewalkEdge, 0.15, sidewalkEdge], [0, Math.PI * 0.25, 0]);   // SW corner
        addLamp([sidewalkEdge, 0.15, sidewalkEdge], [0, -Math.PI * 0.25, 0]);   // SE corner
    } else {
        // Regular blocks: alternate lamp placement for variety
        // Corners - staggered placement based on seed
        if (seed % 2 === 0) {
            addLamp([sidewalkEdge, 0.15, -sidewalkEdge], [0, -Math.PI * 0.75, 0]);  // NE corner
            addLamp([-sidewalkEdge, 0.15, sidewalkEdge], [0, Math.PI * 0.25, 0]);   // SW corner
        } else {
            addLamp([-sidewalkEdge, 0.15, -sidewalkEdge], [0, Math.PI * 0.75, 0]);  // NW corner
            addLamp([sidewalkEdge, 0.15, sidewalkEdge], [0, -Math.PI * 0.25, 0]);   // SE corner
        }

        // Additional mid-sidewalk lamps for longer blocks (based on seed)
        if (seed % 3 === 0) {
            addLamp([sidewalkEdge, 0.15, 0], [0, -Math.PI / 2, 0]);  // East side mid
        }
        if (seed % 3 === 1) {
            addLamp([-sidewalkEdge, 0.15, 0], [0, Math.PI / 2, 0]);  // West side mid
        }
    }

    return lamps;
};

// Helper to generate street details (manholes, drains, etc.) for the entire grid
const getStreetDetails = (gridSize: number, cellSize: number, sidewalkWidth: number, blockSize: number) => {
    const manholes: { position: [number, number, number] }[] = [];
    const drains: { position: [number, number, number]; rotation: number }[] = [];
    const bollards: { position: [number, number, number] }[] = [];
    const range = Math.floor(gridSize / 2);

    for (let x = -range; x <= range; x++) {
        for (let z = -range; z <= range; z++) {
            const cx = x * cellSize;
            const cz = z * cellSize;
            const seed = Math.abs(x * 7 + z * 13);

            // Manholes in intersections (one per intersection)
            if (seed % 2 === 0) {
                manholes.push({ position: [cx + 2, 0, cz + 2] });
            }
            if (seed % 3 === 0) {
                manholes.push({ position: [cx - 3, 0, cz - 3] });
            }

            // Drain grates along curbs
            const curbOffset = blockSize / 2 + sidewalkWidth;
            drains.push({ position: [cx, 0, cz + curbOffset + 0.5], rotation: 0 });
            drains.push({ position: [cx, 0, cz - curbOffset - 0.5], rotation: 0 });

            // Bollards at corners (pedestrian areas)
            if (seed % 4 === 0) {
                const cornerOffset = blockSize / 2 + sidewalkWidth - 0.3;
                bollards.push({ position: [cx + cornerOffset, 0.2, cz + cornerOffset] });
                bollards.push({ position: [cx - cornerOffset, 0.2, cz + cornerOffset] });
            }
        }
    }

    return { manholes, drains, bollards };
};

// Helper to generate fences for a block
// IMPORTANT: Fences must stay within the block boundaries (BLOCK_SIZE/2 = 5 units from center)
// to avoid crossing into streets. Max width = BLOCK_SIZE - 1 = 9 for centered fences,
// but we use smaller segments near edges to leave gaps for walkways.
const getBlockFences = (x: number, z: number) => {
    const fences: { position: [number, number, number], rotation: [number, number, number], width: number }[] = [];
    const pos: [number, number, number] = [x * CELL_SIZE, 0, z * CELL_SIZE];
    const seed = Math.abs(x * 7 + z * 13);
    const isCenter = x === 0 && z === 0;
    const hasBuilding = seed % 3 !== 0;
    const buildingVariant = (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] as const)[seed % 26];
    const isResidential = ['A', 'B', 'G', 'N', 'P'].includes(buildingVariant);

    const addFence = (relPos: [number, number, number], rot: [number, number, number], w: number) => {
        fences.push({ position: [pos[0] + relPos[0], relPos[1], pos[2] + relPos[2]], rotation: rot, width: w });
    };

    // Max fence extent from center of block edge = BLOCK_SIZE/2 - small margin
    // Using smaller fence segments that don't extend beyond the grass/sidewalk area
    const maxFenceHalfWidth = 3.5; // Safe half-width to stay within block

    if (isCenter) {
        // Plaza central sin cercas - completamente accesible
        // No fences for the central plaza - fully walkable
    } else {
        if (hasBuilding) {
            if (isResidential) {
                // Residential fences - two segments per side with gap in middle for entrance
                // Side fences (parallel to Z axis, at X edges of block)
                addFence([4.2, 0.2, -2], [0, Math.PI / 2, 0], 3);
                addFence([4.2, 0.2, 2], [0, Math.PI / 2, 0], 3);
                addFence([-4.2, 0.2, -2], [0, Math.PI / 2, 0], 3);
                addFence([-4.2, 0.2, 2], [0, Math.PI / 2, 0], 3);
                // Back fence (at -Z edge, two segments leaving center gap)
                addFence([-2.5, 0.2, -4.2], [0, 0, 0], 3);
                addFence([2.5, 0.2, -4.2], [0, 0, 0], 3);
            }
        } else {
            // Empty lot / park fences - shorter segments
            addFence([-2.5, 0.2, 4.2], [0, 0, 0], 3);
            addFence([2.5, 0.2, 4.2], [0, 0, 0], 3);
            addFence([-2.5, 0.2, -4.2], [0, 0, 0], 3);
            addFence([2.5, 0.2, -4.2], [0, 0, 0], 3);
        }
    }
    return fences;
};

// Traffic lights: positioned at each intersection corner for realistic traffic control
// Each intersection has 4 traffic lights - one per corner facing the approaching traffic
const TrafficLightsGrid: React.FC = React.memo(() => {
    const range = Math.floor(GRID_SIZE / 2);
    const intersections = React.useMemo(() => {
        const coords: number[] = [];
        for (let i = -range; i <= range; i++) coords.push(i * CELL_SIZE);
        return coords;
    }, [range]);

    // Position on sidewalk - closer to corner, well inside sidewalk bounds
    const cornerOffset = BLOCK_SIZE / 2 + SIDEWALK_WIDTH * 0.5;

    const lights: React.ReactNode[] = [];

    intersections.forEach((cx) => {
        intersections.forEach((cz) => {
            // Only 2 traffic lights per intersection (diagonal corners)
            // NE corner - NS traffic light
            lights.push(
                <TrafficLight
                    key={`ns-ne-${cx}-${cz}`}
                    position={[cx + cornerOffset, 0, cz - cornerOffset]}
                    rotation={[0, Math.PI, 0]}
                    type="NS"
                />
            );

            // SW corner - EW traffic light
            lights.push(
                <TrafficLight
                    key={`ew-sw-${cx}-${cz}`}
                    position={[cx - cornerOffset, 0, cz + cornerOffset]}
                    rotation={[0, 0, 0]}
                    type="EW"
                />
            );
        });
    });

    return <>{lights}</>;
});

// Enhanced sidewalk with visual details
const CobbleSidewalk: React.FC<{ width: number; depth: number; position: [number, number, number] }> = ({ width, depth, position }) => {
    // Create tile pattern effect with multiple layers
    const tileSize = 0.8;
    const numTilesX = Math.floor(width / tileSize);
    const numTilesZ = Math.floor(depth / tileSize);

    return (
        <group position={[position[0], position[1], position[2]]}>
            {/* Base sidewalk */}
            <Box
                args={[width, 0.14, depth]}
                position={[0, 0.07, 0]}
                material={Materials.Sidewalk}
                receiveShadow
            />
            {/* Raised edge/curb detail on outer edge */}
            <Box
                args={[width + 0.08, 0.18, 0.08]}
                position={[0, 0.09, depth > width ? 0 : (depth / 2 - 0.04)]}
                material={Materials.Curb}
                castShadow
            />
            {/* Subtle tile lines (just a few for visual interest without too many draw calls) */}
            {width > 2 && (
                <>
                    <Box args={[0.02, 0.01, depth * 0.9]} position={[-width / 4, 0.145, 0]}>
                        <meshStandardMaterial color="#C8C4BC" />
                    </Box>
                    <Box args={[0.02, 0.01, depth * 0.9]} position={[width / 4, 0.145, 0]}>
                        <meshStandardMaterial color="#C8C4BC" />
                    </Box>
                </>
            )}
        </group>
    );
};

// SIMPLIFIED CityBlock for mobile performance
const CityBlock: React.FC<{ x: number; z: number; isCenter?: boolean }> = React.memo(({ x, z, isCenter }) => {
    const position: [number, number, number] = [x * CELL_SIZE, 0, z * CELL_SIZE];
    const seed = Math.abs(x * 7 + z * 13);
    const hasBuilding = seed % 3 !== 0;
    const buildingVariant = (['A', 'B', 'C', 'D', 'E', 'F'] as const)[seed % 6]; // Reduced variants
    const buildingHeight = 3 + (seed % 2);
    const yPos = SIDEWALK_HEIGHT / 2;
    const curbOffset = (BLOCK_SIZE + SIDEWALK_WIDTH) / 2;

    // Only one NPC in center - El Alcalde Milei
    let npcConfig: NpcConfig | null = null;
    let overrideType: AnimalType | undefined = undefined;
    if (x === 0 && z === 0) {
        npcConfig = {
            name: 'Javier Milei',
            systemInstruction: `Sos Javier Milei, el alcalde libertario de Villa Libertad. Sos un león con una melena épica.

CONTEXTO DEL PUEBLO - VILLA LIBERTAD:
Villa Libertad es un pintoresco pueblo argentino donde viven celebridades de la farándula retiradas o de vacaciones. Es como un country pero con más drama y más cámaras.

RESIDENTES IMPORTANTES:
- Jorge Rial: Tu archienemigo mediático. Tiene una radio local "Radio Intrusos FM" donde te critica 24/7. Vive chusmeando a todos.
- Mirtha Legrand: La matriarca eterna del pueblo. Sus almuerzos dominicales son eventos sociales obligatorios. Te invita siempre pero vos cancelás.
- Susana Giménez: Tu vecina que se queja de tus discursos nocturnos. Tiene una mansión rosa y 47 perros.
- La Locomotora Oliveras: El jefe de seguridad municipal. Ex boxeador que resuelve todo a las piñas.
- Viviana Canosa: Conductora de "Radio Libertad FM" que te defiende fanáticamente.
- Moria Casán: Dueña del único teatro del pueblo "La One". Habla con acento raro y se cree diosa.
- Marcelo Tinelli: Dueño del canal de TV local. Hace bailar a todos en la plaza los sábados.
- Wanda Nara: La empresaria del pueblo. Tiene una heladería y siempre hay drama con algún ex.

TU HISTORIA:
- Ganaste la intendencia prometiendo "eliminar la casta farandulera" (pero ahora vivís rodeado de ellos)
- Tu mascota Conan es tu asesor económico (es un mastín que ladra cuando hay inflación)
- Tenés una estatua tuya en la plaza que Rial vandalizó pintándole bigotes

PERSONALIDAD:
- Hablás con PASIÓN y ÉNFASIS, gritando conceptos económicos
- Mencionás la escuela austríaca de economía en contextos random
- Llamás "zurdos" o "colectivistas" a todos, incluyendo a Mirtha por servir comida gratis
- Te emocionás hasta las lágrimas cuando hablás de libertad
- Decís "A VER" y "O SEA" cada 3 palabras
- Insultás al "estado" aunque vos seas el estado local
- Amás a los perros más que a las personas

FRASES TÍPICAS: "VIVA LA LIBERTAD CARAJO", "el estado es una organización criminal", "zurdo empobrecedor", "no vine a guiar corderos sino a despertar leones", "la casta tiene miedo"

Respondé SIEMPRE en español rioplatense argento. Sé dramático, gracioso y muy en personaje. Si te preguntan por otros residentes, contá chismes de ellos.`,
            voiceName: 'Fenrir',
            greeting: '¡¡VIVA LA LIBERTAD CARAJO!! Bienvenido a Villa Libertad, el ÚNICO pueblo donde el estado no te roba... bueno, casi.'
        };
        overrideType = 'lion';
    }

    // Invisible Ramps
    const rampW = 4; const rampH = 0.05; const rampL = BLOCK_SIZE + SIDEWALK_WIDTH * 2;

    return (
        <group position={position}>
            {/* Physics colliders for sidewalks - combined into fewer bodies */}
            <RigidBody type="fixed" colliders="cuboid" friction={1}>
                <Box args={[BLOCK_SIZE + SIDEWALK_WIDTH * 2, SIDEWALK_HEIGHT, SIDEWALK_WIDTH]} position={[0, yPos, -(BLOCK_SIZE + SIDEWALK_WIDTH) / 2]} visible={false} />
                <Box args={[BLOCK_SIZE + SIDEWALK_WIDTH * 2, SIDEWALK_HEIGHT, SIDEWALK_WIDTH]} position={[0, yPos, (BLOCK_SIZE + SIDEWALK_WIDTH) / 2]} visible={false} />
                <Box args={[SIDEWALK_WIDTH, SIDEWALK_HEIGHT, BLOCK_SIZE]} position={[-(BLOCK_SIZE + SIDEWALK_WIDTH) / 2, yPos, 0]} visible={false} />
                <Box args={[SIDEWALK_WIDTH, SIDEWALK_HEIGHT, BLOCK_SIZE]} position={[(BLOCK_SIZE + SIDEWALK_WIDTH) / 2, yPos, 0]} visible={false} />
            </RigidBody>

            {/* Visual sidewalks - simplified to 4 */}
            <CobbleSidewalk width={BLOCK_SIZE + SIDEWALK_WIDTH * 2} depth={SIDEWALK_WIDTH} position={[0, yPos, -(BLOCK_SIZE + SIDEWALK_WIDTH) / 2]} />
            <CobbleSidewalk width={BLOCK_SIZE + SIDEWALK_WIDTH * 2} depth={SIDEWALK_WIDTH} position={[0, yPos, (BLOCK_SIZE + SIDEWALK_WIDTH) / 2]} />
            <CobbleSidewalk width={SIDEWALK_WIDTH} depth={BLOCK_SIZE} position={[-(BLOCK_SIZE + SIDEWALK_WIDTH) / 2, yPos, 0]} />
            <CobbleSidewalk width={SIDEWALK_WIDTH} depth={BLOCK_SIZE} position={[(BLOCK_SIZE + SIDEWALK_WIDTH) / 2, yPos, 0]} />

            {/* Curb ramps */}
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
                <Box args={[rampL, rampH, rampW]} position={[0, 0.05, -curbOffset - 0.5]} rotation={[0.25, 0, 0]} visible={false} />
                <Box args={[rampL, rampH, rampW]} position={[0, 0.05, curbOffset + 0.5]} rotation={[-0.25, 0, 0]} visible={false} />
            </RigidBody>

            {/* Grass block with texture variation */}
            <RigidBody type="fixed" colliders="cuboid" friction={1}>
                <Box args={[BLOCK_SIZE, 0.2, BLOCK_SIZE]} position={[0, 0.1, 0]} material={Materials.Grass} />
            </RigidBody>
            {/* Grass variation patches for visual interest */}
            <Box args={[2, 0.01, 2.5]} position={[-2.5, 0.205, 2]} material={Materials.GrassLight} />
            <Box args={[1.8, 0.01, 1.8]} position={[3, 0.205, -2.5]} material={Materials.GrassDark} />

            {isCenter ? (
                <>
                    {/* Enhanced Central Park */}
                    <Fountain position={[0, 0.1, 0]} />

                    {/* Improved cobblestone paths with borders */}
                    <group>
                        {/* Main path N-S */}
                        <Box args={[1.8, 0.02, BLOCK_SIZE - 2]} position={[0, 0.21, 0]} material={Materials.Cobblestone} />
                        <Box args={[0.08, 0.025, BLOCK_SIZE - 2]} position={[-0.95, 0.215, 0]} material={Materials.CurbDark} />
                        <Box args={[0.08, 0.025, BLOCK_SIZE - 2]} position={[0.95, 0.215, 0]} material={Materials.CurbDark} />
                        {/* Main path E-W */}
                        <Box args={[BLOCK_SIZE - 2, 0.02, 1.8]} position={[0, 0.21, 0]} material={Materials.Cobblestone} />
                        <Box args={[BLOCK_SIZE - 2, 0.025, 0.08]} position={[0, 0.215, -0.95]} material={Materials.CurbDark} />
                        <Box args={[BLOCK_SIZE - 2, 0.025, 0.08]} position={[0, 0.215, 0.95]} material={Materials.CurbDark} />
                    </group>

                    {/* Flower beds around fountain */}
                    <Box args={[0.8, 0.08, 0.8]} position={[-1.8, 0.24, -1.8]} material={Materials.Dirt} />
                    <Box args={[0.8, 0.08, 0.8]} position={[1.8, 0.24, -1.8]} material={Materials.Dirt} />
                    <Box args={[0.8, 0.08, 0.8]} position={[-1.8, 0.24, 1.8]} material={Materials.Dirt} />
                    <Box args={[0.8, 0.08, 0.8]} position={[1.8, 0.24, 1.8]} material={Materials.Dirt} />

                    {/* Park benches with better placement */}
                    <Bench position={[-3.2, 0.2, 0]} rotation={[0, Math.PI / 2, 0]} />
                    <Bench position={[3.2, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]} />
                    <Bench position={[0, 0.2, -3.2]} rotation={[0, 0, 0]} />
                    <Bench position={[0, 0.2, 3.2]} rotation={[0, Math.PI, 0]} />

                    {/* NPC */}
                    {npcConfig && <LiveNPC position={[1.5, 1.0, 1.5]} rotation={[0, -Math.PI / 4, 0]} config={npcConfig} overrideType={overrideType} />}

                    {/* Minimal skate elements */}
                    <GrindRail position={[0, 0.2, 3]} rotation={[0, 0, 0]} length={3} />
                </>
            ) : (
                <>
                    {hasBuilding ? (
                        <Building position={[0, 0.2, 0]} variant={buildingVariant} height={buildingHeight} width={BLOCK_SIZE - 2} />
                    ) : (
                        // Empty lot - just grass, one bench
                        <Bench position={[0, 0.2, 0]} rotation={[0, 0, 0]} />
                    )}
                </>
            )}
        </group>
    );
});

const RoadMarkings: React.FC = React.memo(() => {
    const { white, yellow, asphalt } = React.useMemo(() => {
        const white: any[] = [];
        const yellow: any[] = [];
        const asphalt: any[] = [];

        // Generators
        const addCrosswalk = (pos: [number, number, number], rot: [number, number, number]) => {
            const stripeWidth = 0.6; const gap = 0.25; const count = 5;
            for (let k = 0; k < count; k++) {
                // Wider, brighter stripes with rounded edges effect
                addBox(white, [stripeWidth, 0.04, 3.2], pos, rot, [(k * (stripeWidth + gap)) - 1.5, 0, 0]);
            }
        };
        const addStopLine = (pos: [number, number, number], rot: [number, number, number]) => addBox(white, [0.5, 0.03, 5.5], pos, rot);
        const addParkingLine = (pos: [number, number, number], rot: [number, number, number]) => addBox(white, [0.1, 0.02, 2], pos, rot);
        const addDoubleYellow = (pos: [number, number, number], rot: [number, number, number]) => {
            addBox(yellow, [2, 0.02, 0.1], pos, rot, [0, 0, -0.08]);
            addBox(yellow, [2, 0.02, 0.1], pos, rot, [0, 0, 0.08]);
        };
        const addBusStop = (pos: [number, number, number], rot: [number, number, number]) => {
            addBox(yellow, [4, 0.02, 1.5], pos, rot);
            addBox(asphalt, [3.8, 0.021, 1.3], pos, rot);
            addBox(yellow, [3, 0.022, 0.3], pos, rot);
        };
        const addLoadingZone = (pos: [number, number, number], rot: [number, number, number]) => {
            addBox(asphalt, [4, 0.02, 1.5], pos, rot);
            for (let i = 0; i < 6; i++) {
                // Diagonal stripes are tricky with simple box scaling/rotation if we want them to stay within bounds
                // But for now let's just add them as rotated boxes
                // We need to combine the base rotation with the stripe rotation
                // This is getting complex for a simple refactor. 
                // Simplified loading zone: just yellow box
                addBox(yellow, [0.2, 0.03, 1.5], pos, [rot[0], rot[1] + Math.PI / 4, rot[2]], [-1.5 + i * 0.6, 0, 0]);
            }
        };
        // Simplified Arrows (just boxes for now to save time/complexity, or skip)
        // Arrows use Cones which are not in our InstancedRoadMarkings yet (only boxes).
        // We will skip arrows for this pass to ensure stability, or add them later.

        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                const x = (i - (GRID_SIZE - 1) / 2) * CELL_SIZE;
                const z = (j - (GRID_SIZE - 1) / 2) * CELL_SIZE;
                const dist = BLOCK_SIZE / 2 + SIDEWALK_WIDTH + 1.5;
                const stopDist = dist + 2;

                addCrosswalk([x, 0.02, z - dist], [0, 0, 0]);
                addStopLine([x + 2, 0.02, z - stopDist], [0, 0, 0]);
                addCrosswalk([x, 0.02, z + dist], [0, 0, 0]);
                addStopLine([x - 2, 0.02, z + stopDist], [0, 0, 0]);
                addCrosswalk([x + dist, 0.02, z], [0, Math.PI / 2, 0]);
                addStopLine([x + stopDist, 0.02, z - 2], [0, Math.PI / 2, 0]);
                addCrosswalk([x - dist, 0.02, z], [0, Math.PI / 2, 0]);
                addStopLine([x - stopDist, 0.02, z + 2], [0, Math.PI / 2, 0]);
            }
        }

        for (let i = 0; i < GRID_SIZE - 1; i++) {
            const x = (i - (GRID_SIZE - 1) / 2) * CELL_SIZE + (CELL_SIZE / 2);
            for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
                addBox(white, [0.2, 0.02, 2], [x, 0.01, j * 4], [0, 0, 0]);
                if (j % 3 === 0) {
                    addParkingLine([x - 3, 0.01, j * 4], [0, 0, 0]);
                    addParkingLine([x - 3, 0.01, j * 4 + 2.5], [0, 0, 0]);
                }
                if (j % 5 === 0) addLoadingZone([x - 3, 0.015, j * 4 + 5], [0, 0, 0]);
            }
        }

        for (let i = 0; i < GRID_SIZE - 1; i++) {
            const z = (i - (GRID_SIZE - 1) / 2) * CELL_SIZE + (CELL_SIZE / 2);
            for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
                addDoubleYellow([j * 4, 0.01, z], [0, 0, 0]);
                if ((i + j) % 7 === 0) addBusStop([j * 4, 0.01, z + 2.5], [0, 0, 0]);
            }
        }

        return { white, yellow, asphalt };
    }, []);

    return <InstancedRoadMarkings whiteBoxes={white} yellowBoxes={yellow} asphaltBoxes={asphalt} />;
});

// ============================================
// City Boundary - Premium Animal Crossing Style
// ============================================

// Colina con capas de color y detalles decorativos
const Hill: React.FC<{ position: [number, number, number]; scale?: number; variant?: 'green' | 'autumn' | 'snowy' }> =
    ({ position, scale = 1, variant = 'green' }) => {
        const colors = {
            green: { base: '#22c55e', mid: '#4ade80', peak: '#86efac', accent: '#15803d' },
            autumn: { base: '#ea580c', mid: '#f97316', peak: '#fdba74', accent: '#c2410c' },
            snowy: { base: '#94a3b8', mid: '#cbd5e1', peak: '#f1f5f9', accent: '#64748b' },
        };
        const c = colors[variant];

        return (
            <group position={position}>
                <mesh position={[0, 0, 0]} receiveShadow>
                    <sphereGeometry args={[10 * scale, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={c.base} flatShading />
                </mesh>
                <mesh position={[0, 2 * scale, 0]}>
                    <sphereGeometry args={[7 * scale, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={c.mid} flatShading />
                </mesh>
                <mesh position={[0, 5 * scale, 0]}>
                    <sphereGeometry args={[4 * scale, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={c.peak} flatShading />
                </mesh>
                <mesh position={[3 * scale, 1 * scale, 2 * scale]}>
                    <dodecahedronGeometry args={[1.5 * scale, 0]} />
                    <meshStandardMaterial color={c.accent} flatShading />
                </mesh>
                <mesh position={[-4 * scale, 0.5 * scale, -1 * scale]}>
                    <dodecahedronGeometry args={[1 * scale, 0]} />
                    <meshStandardMaterial color={c.accent} flatShading />
                </mesh>
            </group>
        );
    };

// Árbol frondoso con variantes de estilo
const BorderTree: React.FC<{ position: [number, number, number]; scale?: number; variant?: 'oak' | 'pine' | 'cherry' | 'maple' }> =
    ({ position, scale = 1, variant = 'oak' }) => {
        const configs = {
            oak: { trunk: '#78350f', foliage: ['#16a34a', '#22c55e', '#4ade80'], shape: 'round' },
            pine: { trunk: '#451a03', foliage: ['#064e3b', '#047857', '#059669'], shape: 'cone' },
            cherry: { trunk: '#7c2d12', foliage: ['#ec4899', '#f472b6', '#f9a8d4'], shape: 'round' },
            maple: { trunk: '#78350f', foliage: ['#dc2626', '#f97316', '#fbbf24'], shape: 'round' },
        };
        const cfg = configs[variant];

        if (cfg.shape === 'cone') {
            return (
                <group position={position} scale={scale}>
                    <mesh position={[0, 1.2, 0]} castShadow>
                        <cylinderGeometry args={[0.25, 0.4, 2.4, 8]} />
                        <meshStandardMaterial color={cfg.trunk} />
                    </mesh>
                    <mesh position={[0, 2.5, 0]} castShadow>
                        <coneGeometry args={[2.2, 2.5, 8]} />
                        <meshStandardMaterial color={cfg.foliage[0]} flatShading />
                    </mesh>
                    <mesh position={[0, 4, 0]} castShadow>
                        <coneGeometry args={[1.6, 2, 8]} />
                        <meshStandardMaterial color={cfg.foliage[1]} flatShading />
                    </mesh>
                    <mesh position={[0, 5.2, 0]} castShadow>
                        <coneGeometry args={[1, 1.5, 8]} />
                        <meshStandardMaterial color={cfg.foliage[2]} flatShading />
                    </mesh>
                </group>
            );
        }

        return (
            <group position={position} scale={scale}>
                <mesh position={[0, 1.8, 0]} castShadow>
                    <cylinderGeometry args={[0.3, 0.5, 3.6, 8]} />
                    <meshStandardMaterial color={cfg.trunk} />
                </mesh>
                <mesh position={[0.3, 0.15, 0.3]} rotation={[0, 0, 0.3]} castShadow>
                    <cylinderGeometry args={[0.1, 0.15, 0.6, 6]} />
                    <meshStandardMaterial color={cfg.trunk} />
                </mesh>
                <mesh position={[-0.3, 0.15, -0.2]} rotation={[0, 0, -0.3]} castShadow>
                    <cylinderGeometry args={[0.1, 0.15, 0.6, 6]} />
                    <meshStandardMaterial color={cfg.trunk} />
                </mesh>
                <mesh position={[0, 4.5, 0]} castShadow>
                    <sphereGeometry args={[2.5, 10, 8]} />
                    <meshStandardMaterial color={cfg.foliage[0]} flatShading />
                </mesh>
                <mesh position={[1.2, 4, 0.8]} castShadow>
                    <sphereGeometry args={[1.5, 8, 6]} />
                    <meshStandardMaterial color={cfg.foliage[1]} flatShading />
                </mesh>
                <mesh position={[-1, 4.2, -0.6]} castShadow>
                    <sphereGeometry args={[1.3, 8, 6]} />
                    <meshStandardMaterial color={cfg.foliage[2]} flatShading />
                </mesh>
                <mesh position={[0.5, 5.2, -0.5]} castShadow>
                    <sphereGeometry args={[1.1, 6, 5]} />
                    <meshStandardMaterial color={cfg.foliage[1]} flatShading />
                </mesh>
                <mesh position={[-0.8, 3.8, 1]} castShadow>
                    <sphereGeometry args={[1.2, 6, 5]} />
                    <meshStandardMaterial color={cfg.foliage[0]} flatShading />
                </mesh>
            </group>
        );
    };

// Cerca estilo pueblo pintoresco
const PictureFence: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; length?: number }> =
    ({ position, rotation = [0, 0, 0], length = 10 }) => {
        const posts = Math.floor(length / 2.5);

        return (
            <group position={position} rotation={rotation}>
                {Array.from({ length: posts + 1 }).map((_, i) => (
                    <group key={`post-${i}`} position={[i * 2.5 - length / 2, 0, 0]}>
                        <mesh position={[0, 0.7, 0]} castShadow>
                            <boxGeometry args={[0.18, 1.4, 0.18]} />
                            <meshStandardMaterial color="#fef3c7" />
                        </mesh>
                        <mesh position={[0, 1.5, 0]} castShadow>
                            <sphereGeometry args={[0.14, 8, 6]} />
                            <meshStandardMaterial color="#fde68a" />
                        </mesh>
                    </group>
                ))}
                <mesh position={[0, 1.1, 0]} castShadow>
                    <boxGeometry args={[length, 0.12, 0.08]} />
                    <meshStandardMaterial color="#fef9c3" />
                </mesh>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[length, 0.12, 0.08]} />
                    <meshStandardMaterial color="#fef9c3" />
                </mesh>
                <mesh position={[0, 0.25, 0]} castShadow>
                    <boxGeometry args={[length, 0.1, 0.06]} />
                    <meshStandardMaterial color="#fde68a" />
                </mesh>
            </group>
        );
    };

// Flor decorativa para el borde
const BorderFlower: React.FC<{ position: [number, number, number]; color?: string }> = ({ position, color = '#ec4899' }) => {
    return (
        <group position={position}>
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.03, 0.04, 0.4, 6]} />
                <meshStandardMaterial color="#22c55e" />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} position={[Math.cos(i * 1.256) * 0.12, 0.45, Math.sin(i * 1.256) * 0.12]} rotation={[0.3, i * 1.256, 0]}>
                    <sphereGeometry args={[0.08, 6, 4]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            ))}
            <mesh position={[0, 0.45, 0]}>
                <sphereGeometry args={[0.06, 6, 4]} />
                <meshStandardMaterial color="#fbbf24" />
            </mesh>
        </group>
    );
};

// Roca decorativa
const BorderRock: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 0.3, 0]} castShadow>
                <dodecahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial color="#94a3b8" flatShading />
            </mesh>
            <mesh position={[0.4, 0.15, 0.2]}>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color="#a1a1aa" flatShading />
            </mesh>
        </group>
    );
};

// Agua premium con efecto de olas y espuma
const WaterBorder: React.FC<{ size: number }> = ({ size }) => {
    const waterRef = useRef<THREE.Mesh>(null);
    const foamRef = useRef<THREE.Mesh>(null);

    useEffect(() => {
        if (!waterRef.current) return;
        const material = waterRef.current.material as THREE.MeshStandardMaterial;
        let time = 0;
        const animate = () => {
            time += 0.02;
            if (material) {
                material.emissiveIntensity = 0.15 + Math.sin(time) * 0.08;
            }
            if (foamRef.current) {
                foamRef.current.position.y = -0.05 + Math.sin(time * 2) * 0.02;
            }
        };
        const interval = setInterval(animate, 30);
        return () => clearInterval(interval);
    }, []);

    const innerSize = size;
    const waterWidth = 8;

    return (
        <group>
            {/* Norte */}
            <mesh ref={waterRef} position={[0, -0.08, -innerSize - waterWidth / 2]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[innerSize * 2 + waterWidth * 2, waterWidth]} />
                <meshStandardMaterial color="#22d3ee" transparent opacity={0.85} emissive="#06b6d4" emissiveIntensity={0.15} roughness={0.1} metalness={0.3} />
            </mesh>
            <mesh ref={foamRef} position={[0, -0.03, -innerSize - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[innerSize * 2 + waterWidth * 2, 1.5]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.6} />
            </mesh>

            {/* Sur */}
            <mesh position={[0, -0.08, innerSize + waterWidth / 2]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[innerSize * 2 + waterWidth * 2, waterWidth]} />
                <meshStandardMaterial color="#22d3ee" transparent opacity={0.85} emissive="#06b6d4" emissiveIntensity={0.15} roughness={0.1} metalness={0.3} />
            </mesh>
            <mesh position={[0, -0.03, innerSize + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[innerSize * 2 + waterWidth * 2, 1.5]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.6} />
            </mesh>

            {/* Este */}
            <mesh position={[innerSize + waterWidth / 2, -0.08, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[waterWidth, innerSize * 2 + waterWidth * 2]} />
                <meshStandardMaterial color="#22d3ee" transparent opacity={0.85} emissive="#06b6d4" emissiveIntensity={0.15} roughness={0.1} metalness={0.3} />
            </mesh>
            <mesh position={[innerSize + 0.5, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.5, innerSize * 2]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.6} />
            </mesh>

            {/* Oeste */}
            <mesh position={[-innerSize - waterWidth / 2, -0.08, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[waterWidth, innerSize * 2 + waterWidth * 2]} />
                <meshStandardMaterial color="#22d3ee" transparent opacity={0.85} emissive="#06b6d4" emissiveIntensity={0.15} roughness={0.1} metalness={0.3} />
            </mesh>
            <mesh position={[-innerSize - 0.5, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.5, innerSize * 2]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.6} />
            </mesh>

            {/* Esquinas */}
            {[
                [innerSize + waterWidth / 2, -innerSize - waterWidth / 2],
                [-innerSize - waterWidth / 2, -innerSize - waterWidth / 2],
                [innerSize + waterWidth / 2, innerSize + waterWidth / 2],
                [-innerSize - waterWidth / 2, innerSize + waterWidth / 2],
            ].map(([x, z], i) => (
                <mesh key={`corner-${i}`} position={[x, -0.08, z]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[waterWidth, waterWidth]} />
                    <meshStandardMaterial color="#22d3ee" transparent opacity={0.85} emissive="#06b6d4" emissiveIntensity={0.15} roughness={0.1} metalness={0.3} />
                </mesh>
            ))}
        </group>
    );
};

// Puente decorativo
const DecorativeBridge: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> =
    ({ position, rotation = [0, 0, 0] }) => {
        return (
            <group position={position} rotation={rotation}>
                <mesh position={[0, 0.8, 0]} castShadow>
                    <torusGeometry args={[2, 0.3, 8, 16, Math.PI]} />
                    <meshStandardMaterial color="#92400e" />
                </mesh>
                <mesh position={[0, 1.5, 0]} castShadow>
                    <boxGeometry args={[4.5, 0.15, 1.2]} />
                    <meshStandardMaterial color="#a16207" />
                </mesh>
                {[-0.5, 0.5].map((z, i) => (
                    <group key={`rail-${i}`}>
                        {[-1.8, -0.9, 0, 0.9, 1.8].map((x, j) => (
                            <mesh key={`post-${j}`} position={[x, 1.9, z]} castShadow>
                                <boxGeometry args={[0.1, 0.8, 0.1]} />
                                <meshStandardMaterial color="#ca8a04" />
                            </mesh>
                        ))}
                        <mesh position={[0, 2.2, z]} castShadow>
                            <boxGeometry args={[4.2, 0.08, 0.08]} />
                            <meshStandardMaterial color="#eab308" />
                        </mesh>
                    </group>
                ))}
            </group>
        );
    };

// Cielo con nubes
const SkyBackground: React.FC = () => {
    return (
        <group>
            {[
                { pos: [0, 30, -150], rot: [0, 0, 0] },
                { pos: [0, 30, 150], rot: [0, Math.PI, 0] },
                { pos: [150, 30, 0], rot: [0, -Math.PI / 2, 0] },
                { pos: [-150, 30, 0], rot: [0, Math.PI / 2, 0] },
            ].map((sky, i) => (
                <mesh key={`sky-${i}`} position={sky.pos as [number, number, number]} rotation={sky.rot as [number, number, number]}>
                    <planeGeometry args={[500, 120]} />
                    <meshBasicMaterial color="#87ceeb" />
                </mesh>
            ))}
            {[
                { pos: [-40, 45, -130], scale: 1.2 },
                { pos: [60, 50, -125], scale: 0.9 },
                { pos: [20, 42, 130], scale: 1.1 },
                { pos: [-70, 48, 125], scale: 1.0 },
                { pos: [130, 44, -30], scale: 0.8 },
                { pos: [125, 52, 50], scale: 1.3 },
                { pos: [-125, 46, 20], scale: 1.0 },
                { pos: [-130, 50, -40], scale: 0.9 },
            ].map((cloud, i) => (
                <group key={`cloud-${i}`} position={cloud.pos as [number, number, number]} scale={cloud.scale}>
                    <mesh><sphereGeometry args={[6, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
                    <mesh position={[5, -1, 0]}><sphereGeometry args={[5, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
                    <mesh position={[-4, -0.5, 0]}><sphereGeometry args={[4.5, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
                    <mesh position={[2, 2, 0]}><sphereGeometry args={[4, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
                </group>
            ))}
        </group>
    );
};

// Pasto exterior con variación de color
const OuterGrass: React.FC<{ size: number }> = ({ size }) => {
    const grassSize = 120;
    const offset = size + 18;

    return (
        <group>
            {[
                { pos: [0, -0.15, -offset - grassSize / 2], size: [grassSize * 3, grassSize] },
                { pos: [0, -0.15, offset + grassSize / 2], size: [grassSize * 3, grassSize] },
                { pos: [offset + grassSize / 2, -0.15, 0], size: [grassSize, grassSize * 3] },
                { pos: [-offset - grassSize / 2, -0.15, 0], size: [grassSize, grassSize * 3] },
            ].map((g, i) => (
                <mesh key={`grass-${i}`} position={g.pos as [number, number, number]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={g.size as [number, number]} />
                    <meshStandardMaterial color="#4ade80" />
                </mesh>
            ))}
            {[
                [15, -0.12, -offset - 20],
                [-25, -0.12, -offset - 35],
                [40, -0.12, offset + 25],
                [-10, -0.12, offset + 40],
                [offset + 30, -0.12, 15],
                [offset + 20, -0.12, -30],
                [-offset - 25, -0.12, 20],
                [-offset - 40, -0.12, -15],
            ].map((pos, i) => (
                <mesh key={`dark-grass-${i}`} position={pos as [number, number, number]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[8, 12]} />
                    <meshStandardMaterial color="#22c55e" />
                </mesh>
            ))}
        </group>
    );
};

const BoundaryWalls: React.FC = React.memo(() => {
    const halfSize = MAP_SIZE / 2 + 5;
    const height = 10;
    const thickness = 2;
    const fenceOffset = halfSize - 1;
    const hillOffset = halfSize + 30;
    const treeOffset = halfSize + 10;

    // Árboles variados en el borde
    const borderTrees = React.useMemo(() => {
        const trees: { pos: [number, number, number]; scale: number; variant: 'oak' | 'pine' | 'cherry' | 'maple' }[] = [];
        const variants: ('oak' | 'pine' | 'cherry' | 'maple')[] = ['oak', 'pine', 'cherry', 'maple'];
        const spacing = 6;
        const count = Math.floor((halfSize * 2) / spacing);

        for (let i = 0; i <= count; i++) {
            const offset = -halfSize + i * spacing + (Math.random() - 0.5) * 2;
            const scale = 0.7 + Math.random() * 0.5;
            const variant = variants[Math.floor(Math.random() * variants.length)];

            trees.push({ pos: [offset, 0, -treeOffset + (Math.random() - 0.5) * 3], scale, variant });
            trees.push({ pos: [offset, 0, treeOffset + (Math.random() - 0.5) * 3], scale, variant });
            trees.push({ pos: [treeOffset + (Math.random() - 0.5) * 3, 0, offset], scale, variant });
            trees.push({ pos: [-treeOffset + (Math.random() - 0.5) * 3, 0, offset], scale, variant });
        }
        return trees;
    }, [halfSize, treeOffset]);

    // Colinas variadas
    const hills = React.useMemo(() => {
        const h: { pos: [number, number, number]; scale: number; variant: 'green' | 'autumn' | 'snowy' }[] = [];
        const variants: ('green' | 'autumn' | 'snowy')[] = ['green', 'green', 'green', 'autumn'];

        const positions = [
            { pos: [0, 0, -hillOffset], scale: 2.5 },
            { pos: [-35, 0, -hillOffset - 15], scale: 1.8 },
            { pos: [45, 0, -hillOffset + 5], scale: 2.2 },
            { pos: [0, 0, hillOffset], scale: 2.3 },
            { pos: [30, 0, hillOffset + 10], scale: 1.9 },
            { pos: [-50, 0, hillOffset - 5], scale: 1.6 },
            { pos: [hillOffset, 0, 0], scale: 2.0 },
            { pos: [hillOffset + 15, 0, -30], scale: 1.7 },
            { pos: [hillOffset - 5, 0, 40], scale: 2.4 },
            { pos: [-hillOffset, 0, 0], scale: 2.1 },
            { pos: [-hillOffset - 10, 0, 25], scale: 1.5 },
            { pos: [-hillOffset + 5, 0, -45], scale: 1.9 },
        ];

        positions.forEach((p, i) => {
            h.push({ ...p, pos: p.pos as [number, number, number], variant: variants[i % variants.length] });
        });

        return h;
    }, [hillOffset]);

    // Flores decorativas
    const flowers = React.useMemo(() => {
        const f: { pos: [number, number, number]; color: string }[] = [];
        const colors = ['#ec4899', '#f472b6', '#a855f7', '#3b82f6', '#eab308', '#ef4444'];

        for (let i = 0; i < 60; i++) {
            const side = Math.floor(Math.random() * 4);
            const offset = (Math.random() - 0.5) * halfSize * 1.8;
            const dist = halfSize + 2 + Math.random() * 4;

            let pos: [number, number, number];
            switch (side) {
                case 0: pos = [offset, 0, -dist]; break;
                case 1: pos = [offset, 0, dist]; break;
                case 2: pos = [dist, 0, offset]; break;
                default: pos = [-dist, 0, offset];
            }

            f.push({ pos, color: colors[Math.floor(Math.random() * colors.length)] });
        }
        return f;
    }, [halfSize]);

    // Rocas decorativas
    const rocks = React.useMemo(() => {
        const r: { pos: [number, number, number]; scale: number }[] = [];

        for (let i = 0; i < 20; i++) {
            const side = Math.floor(Math.random() * 4);
            const offset = (Math.random() - 0.5) * halfSize * 1.6;
            const dist = halfSize + 5 + Math.random() * 8;

            let pos: [number, number, number];
            switch (side) {
                case 0: pos = [offset, 0, -dist]; break;
                case 1: pos = [offset, 0, dist]; break;
                case 2: pos = [dist, 0, offset]; break;
                default: pos = [-dist, 0, offset];
            }

            r.push({ pos, scale: 0.5 + Math.random() * 1.5 });
        }
        return r;
    }, [halfSize]);

    return (
        <group>
            {/* Colisiones invisibles */}
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
                <CuboidCollider args={[halfSize, height, thickness]} position={[0, height / 2, -halfSize]} />
                <CuboidCollider args={[halfSize, height, thickness]} position={[0, height / 2, halfSize]} />
                <CuboidCollider args={[thickness, height, halfSize]} position={[halfSize, height / 2, 0]} />
                <CuboidCollider args={[thickness, height, halfSize]} position={[-halfSize, height / 2, 0]} />
            </RigidBody>

            {/* Cielo y nubes */}
            <SkyBackground />

            {/* Pasto exterior */}
            <OuterGrass size={halfSize} />

            {/* Agua con efecto premium */}
            <WaterBorder size={halfSize} />

            {/* Puentes decorativos */}
            <DecorativeBridge position={[0, 0, -halfSize - 4]} rotation={[0, 0, 0]} />
            <DecorativeBridge position={[0, 0, halfSize + 4]} rotation={[0, Math.PI, 0]} />
            <DecorativeBridge position={[halfSize + 4, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
            <DecorativeBridge position={[-halfSize - 4, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

            {/* Cercas pintoreszcas */}
            <PictureFence position={[0, 0, -fenceOffset]} rotation={[0, 0, 0]} length={halfSize * 1.8} />
            <PictureFence position={[0, 0, fenceOffset]} rotation={[0, 0, 0]} length={halfSize * 1.8} />
            <PictureFence position={[-fenceOffset, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={halfSize * 1.8} />
            <PictureFence position={[fenceOffset, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={halfSize * 1.8} />

            {/* Árboles variados */}
            {borderTrees.map((tree, i) => (
                <BorderTree key={`tree-${i}`} position={tree.pos} scale={tree.scale} variant={tree.variant} />
            ))}

            {/* Colinas en el horizonte */}
            {hills.map((hill, i) => (
                <Hill key={`hill-${i}`} position={hill.pos} scale={hill.scale} variant={hill.variant} />
            ))}

            {/* Flores */}
            {flowers.map((f, i) => (
                <BorderFlower key={`flower-${i}`} position={f.pos} color={f.color} />
            ))}

            {/* Rocas */}
            {rocks.map((r, i) => (
                <BorderRock key={`rock-${i}`} position={r.pos} scale={r.scale} />
            ))}
        </group>
    );
});

export const World: React.FC = () => {
    const blocks = [];
    const range = Math.floor(GRID_SIZE / 2);
    const setTrafficState = useGameStore(s => s.setTrafficState);
    const isDriving = useGameStore(s => s.isDriving);
    const vehicleType = useGameStore(s => s.vehicleType);
    const qualityLevel = useGameStore(s => s.qualityLevel);
    const quality = QUALITY_PRESETS[qualityLevel];
    const groundSize = MAP_SIZE + 10; // Aligns with BoundaryWalls to avoid visible ground beyond collision

    // Improved Traffic Controller with Yellow Lights
    // Longer green lights to allow slow-moving cars more time to pass
    useEffect(() => {
        let cycle = 0;
        // Cycle: NS Green(8s) -> NS Yellow(2.5s) -> All Red(1.5s) -> EW Green(8s) -> EW Yellow(2.5s) -> All Red(1.5s)
        const states = [
            { s: 'NS_GREEN', d: 8000 },    // Longer green for slow cars
            { s: 'NS_YELLOW', d: 2500 },   // Slightly longer yellow for safety
            { s: 'ALL_RED', d: 1500 },     // Longer all-red for intersection clearing
            { s: 'EW_GREEN', d: 8000 },    // Longer green for slow cars
            { s: 'EW_YELLOW', d: 2500 },   // Slightly longer yellow for safety
            { s: 'ALL_RED', d: 1500 }      // Longer all-red for intersection clearing
        ] as const;

        const runCycle = () => {
            setTrafficState(states[cycle].s);
            const duration = states[cycle].d;
            cycle = (cycle + 1) % states.length;
            setTimeout(runCycle, duration);
        };

        runCycle();
        return () => { };
    }, [setTrafficState]);

    // Generate Trees
    const allTrees = React.useMemo(() => {
        const trees: any[] = [];
        for (let x = -range; x <= range; x++) {
            for (let z = -range; z <= range; z++) {
                trees.push(...getBlockTrees(x, z));
            }
        }
        return trees;
    }, [range]);

    const allLamps = React.useMemo(() => {
        const lamps: any[] = [];
        for (let x = -range; x <= range; x++) {
            for (let z = -range; z <= range; z++) {
                lamps.push(...getBlockLamps(x, z));
            }
        }
        return dedupeByGrid(lamps, (l) => l.position, 0.5);
    }, [range]);

    const allFences = React.useMemo(() => {
        const fences: any[] = [];
        for (let x = -range; x <= range; x++) {
            for (let z = -range; z <= range; z++) {
                fences.push(...getBlockFences(x, z));
            }
        }
        return dedupeByGrid(fences, (f) => f.position, 0.5);
    }, [range]);

    // Street details (manholes, drains, bollards)
    const streetDetails = React.useMemo(() =>
        getStreetDetails(GRID_SIZE, CELL_SIZE, SIDEWALK_WIDTH, BLOCK_SIZE),
        []
    );

    for (let x = -range; x <= range; x++) {
        for (let z = -range; z <= range; z++) {
            const isCenter = x === 0 && z === 0;
            blocks.push(<CityBlock key={`${x}-${z}`} x={x} z={z} isCenter={isCenter} />);
        }
    }
    // Traffic Spawning - Quality-based car count
    const npcCars = useMemo(() => {
        const cars: React.ReactNode[] = [];
        const laneOffset = 2;
        const mainRoadIndex = 0;
        const carColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
        const roadZ = mainRoadIndex * CELL_SIZE + CELL_SIZE / 2;
        const roadX = mainRoadIndex * CELL_SIZE + CELL_SIZE / 2;
        const carStartOffset = 20;

        // Limit cars based on quality settings
        if (quality.maxCars >= 1) {
            cars.push(
                <NPCCar key="h-east" laneAxis="x" lanePos={roadZ + laneOffset}
                    startOffset={-carStartOffset} direction={1} color={carColors[0]} />
            );
        }
        if (quality.maxCars >= 2) {
            cars.push(
                <NPCCar key="h-west" laneAxis="x" lanePos={roadZ - laneOffset}
                    startOffset={carStartOffset} direction={-1} color={carColors[1]} />
            );
        }
        if (quality.maxCars >= 3) {
            cars.push(
                <NPCCar key="v-south" laneAxis="z" lanePos={roadX - laneOffset}
                    startOffset={-carStartOffset} direction={1} color={carColors[2]} />
            );
        }
        if (quality.maxCars >= 4) {
            cars.push(
                <NPCCar key="v-north" laneAxis="z" lanePos={roadX + laneOffset}
                    startOffset={carStartOffset} direction={-1} color={carColors[3]} />
            );
        }
        return cars;
    }, [quality.maxCars]);

    return (
        <group>
            {/* Ground - Enhanced Asphalt with visual details */}
            <RigidBody type="fixed" colliders="cuboid" friction={0}>
                <Box args={[groundSize, 0.1, groundSize]} position={[0, -0.05, 0]} receiveShadow material={Materials.AsphaltDetailed} />
            </RigidBody>

            {/* Street texture overlays - subtle variations for realism */}
            <group position={[0, 0.001, 0]}>
                {/* Subtle road wear patterns */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <Box
                        key={`wear-${i}`}
                        args={[2 + Math.random() * 3, 0.002, 0.3 + Math.random() * 0.5]}
                        position={[(i - 2) * CELL_SIZE * 0.8, 0, (i % 3 - 1) * CELL_SIZE * 0.6]}
                        receiveShadow
                    >
                        <meshStandardMaterial color="#404040" transparent opacity={0.3} />
                    </Box>
                ))}
            </group>

            {/* Road Markings */}
            <RoadMarkings />
            <TrafficLightsGrid />

            {/* Instanced World Elements */}
            <TreeInstances data={allTrees} />
            <LampInstances data={allLamps} />
            <LampPointLights data={allLamps} />
            <FenceInstances data={allFences} />

            {/* Street Infrastructure Details */}
            <ManholeInstances data={streetDetails.manholes} />
            <DrainInstances data={streetDetails.drains} />
            <BollardInstances data={streetDetails.bollards} />

            {/* Puddles (only on medium+ quality) */}
            {quality.enablePuddles && (
                <>
                    <Puddle position={[5, 0, 10]} size={0.8} />
                    <Puddle position={[-12, 0, -8]} size={1.2} />
                </>
            )}

            {/* City Blocks */}
            {blocks}

            {/* ============================================ */}
            {/* RESIDENTES DE VILLA LIBERTAD - Optimized NPCs */}
            {/* Uses distance-based culling for performance */}
            {/* ============================================ */}
            <OptimizedNPCs />
            {/* Minimal urban furniture for performance */}
            <FoodTruck position={[CELL_SIZE * 1.5, 0.2, -CELL_SIZE / 2]} rotation={[0, Math.PI / 2, 0]} color="#e07a5f" />
            <PhoneBoothRetro position={[CELL_SIZE / 2 + 5, 0.2, CELL_SIZE / 2 + 5]} rotation={[0, -Math.PI / 4, 0]} />

            {npcCars}
            {isDriving && vehicleType === 'skateboard' && <Skateboard />}

            {/* Skateboards scattered around the city - reduced for performance */}
            <WorldSkateboard position={[5, 0.1, 8]} />
            <WorldSkateboard position={[-20, 0.1, 15]} />

            {/* Animal Crossing-style activities */}
            <ActivitySpawner
                gridSize={GRID_SIZE}
                cellSize={CELL_SIZE}
                blockSize={BLOCK_SIZE}
            />

            {/* Interactive Billboard - Community Screen */}
            <InteractiveBillboard
                position={[CELL_SIZE * 1.2, 0, -CELL_SIZE * 0.8]}
                rotation={[0, Math.PI * 0.8, 0]}
                size={[10, 5.6]}
            />

            {/* Fishing Pond - Single dedicated fishing area */}
            <FishingPond
                position={[-CELL_SIZE * 1.1, 0, CELL_SIZE * 0.9]}
                size={[7, 5]}
            />

            {/* Optimized boundary with quality-aware decorations */}
            <OptimizedBoundary mapSize={MAP_SIZE} />
        </group>
    );
};
