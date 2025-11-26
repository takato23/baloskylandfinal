import React, { useMemo, createContext, useContext, useRef } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, MeshStandardMaterial, DoubleSide, MathUtils, MeshBasicMaterial, Vector3, Quaternion, Euler } from 'three';
import { Materials } from '../../utils/materials';
import { useGameStore } from '../../store';
import { QUALITY_PRESETS } from '../../utils/performance';

// --- Shared Geometries ---
const boxGeo = new BoxGeometry(1, 1, 1);
const cylinderGeo = new CylinderGeometry(1, 1, 1, 8);
const coneGeo = new ConeGeometry(1, 1, 8);
const sphereGeo = new SphereGeometry(1, 8, 8);

// --- Contexts for Instancing ---
// We use context to allow child components to register themselves to a parent Instances group
// But for simplicity in this refactor, we will export components that wrap <Instances> 
// and accept a list of props, OR components that are meant to be used inside an <Instances> block.

// --- 1. TREES ---
// Tree is composite: 1 Trunk (Cylinder), 2 Leaves (Cylinder/Cone)
// We need 3 separate InstancedMesh groups for this, or merge geometry. 
// Merging is harder for culling. Separate groups is easier.

export const InstancedTrees: React.FC<{ data: { position: [number, number, number], scale?: number }[] }> = ({ data }) => {
    return (
        <group>
            {/* Trunks */}
            <Instances range={data.length} geometry={cylinderGeo} material={Materials.Brown} castShadow receiveShadow>
                {data.map((d, i) => (
                    <Instance key={i} position={[d.position[0], d.position[1] + 0.75 * (d.scale || 1), d.position[2]]} scale={[0.2 * (d.scale || 1), 1.5 * (d.scale || 1), 0.2 * (d.scale || 1)]} />
                ))}
            </Instances>
            {/* Bottom Foliage */}
            <Instances range={data.length} geometry={cylinderGeo} material={Materials.DarkGreen} castShadow receiveShadow>
                {data.map((d, i) => (
                    <Instance key={i} position={[d.position[0], d.position[1] + 2.5 * (d.scale || 1), d.position[2]]} scale={[1.2 * (d.scale || 1), 2 * (d.scale || 1), 1.2 * (d.scale || 1)]} /> // Scale 0 radius to 1.2? CylinderGeo is 1,1,1. Tree was 0, 1.2. 
                    // Wait, Tree.tsx uses Cylinder args=[0, 1.2, 2, 8]. Top radius 0, bottom 1.2.
                    // Standard CylinderGeo is top 1, bottom 1. 
                    // We can't easily change top/bottom radius via scale alone if they are different ratios.
                    // We should use ConeGeometry for the tree foliage or a specific CylinderGeometry.
                ))}
            </Instances>
            {/* Top Foliage */}
            {/* ... Actually, let's use specific geometries for the tree parts to match the look exactly */}
        </group>
    );
};

// Better approach: Define the specific geometries used in the original components
const treeTrunkGeo = new CylinderGeometry(0.2, 0.2, 1.5, 8);
const treeFoliageBottomGeo = new CylinderGeometry(0, 1.2, 2, 8);
const treeFoliageTopGeo = new CylinderGeometry(0, 0.9, 1.5, 8);
const treeLowGeo = new ConeGeometry(1, 2.6, 6);
treeLowGeo.translate(0, 1.3, 0);

export const TreeInstances: React.FC<{ data: { position: [number, number, number], scale?: number }[] }> = ({ data }) => {
    const nearDataRef = React.useRef(data);
    const farDataRef = React.useRef<typeof data>([]);
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const accumulator = React.useRef(0);
    const lastNearCount = React.useRef(data.length);
    const lastFarCount = React.useRef(0);

    React.useEffect(() => {
        nearDataRef.current = data;
        lastNearCount.current = data.length;
        forceUpdate();
    }, [data]);

    useFrame((_, delta) => {
        accumulator.current += delta;
        if (accumulator.current < 0.5) return;
        accumulator.current = 0;

        const player = useGameStore.getState().playerPosition;
        const near: typeof data = [];
        const far: typeof data = [];
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            const dx = d.position[0] - player[0];
            const dz = d.position[2] - player[2];
            const distSq = dx * dx + dz * dz;
            if (distSq < 25 * 25) near.push(d);
            else far.push(d);
        }

        // Only update if counts changed to avoid unnecessary re-renders
        if (near.length !== lastNearCount.current || far.length !== lastFarCount.current) {
            nearDataRef.current = near;
            farDataRef.current = far;
            lastNearCount.current = near.length;
            lastFarCount.current = far.length;
            forceUpdate();
        }
    });

    const nearData = nearDataRef.current;
    const farData = farDataRef.current;

    return (
        <group>
            <Instances range={nearData.length} geometry={treeTrunkGeo} material={Materials.Brown} castShadow receiveShadow>
                {nearData.map((d, i) => (
                    <Instance key={`t-${i}`} position={[d.position[0], d.position[1] + 0.75 * (d.scale || 1), d.position[2]]} scale={[d.scale || 1, d.scale || 1, d.scale || 1]} />
                ))}
            </Instances>
            <Instances range={nearData.length} geometry={treeFoliageBottomGeo} material={Materials.DarkGreen} castShadow receiveShadow>
                {nearData.map((d, i) => (
                    <Instance key={`fb-${i}`} position={[d.position[0], d.position[1] + 2.5 * (d.scale || 1), d.position[2]]} scale={[d.scale || 1, d.scale || 1, d.scale || 1]} />
                ))}
            </Instances>
            <Instances range={nearData.length} geometry={treeFoliageTopGeo} material={Materials.DarkGreen} castShadow receiveShadow>
                {nearData.map((d, i) => (
                    <Instance key={`ft-${i}`} position={[d.position[0], d.position[1] + 3.5 * (d.scale || 1), d.position[2]]} scale={[d.scale || 1, d.scale || 1, d.scale || 1]} />
                ))}
            </Instances>

            {/* Low LOD cones for trees beyond 25m */}
            {farData.length > 0 && (
                <Instances range={farData.length} geometry={treeLowGeo} material={Materials.DarkGreen}>
                    {farData.map((d, i) => (
                        <Instance key={`low-${i}`} position={[d.position[0], d.position[1], d.position[2]]} scale={[d.scale || 1, d.scale || 1, d.scale || 1]} />
                    ))}
                </Instances>
            )}
        </group>
    )
}

// --- 2. ROAD MARKINGS ---
// Most road markings are white or yellow boxes.
// We can group them by material.

export const InstancedRoadMarkings: React.FC<{
    whiteBoxes: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }[],
    yellowBoxes: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }[],
    asphaltBoxes: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }[]
}> = ({ whiteBoxes, yellowBoxes, asphaltBoxes }) => {
    return (
        <group>
            {/* White Paint */}
            {whiteBoxes.length > 0 && (
                <Instances range={whiteBoxes.length} geometry={boxGeo} material={Materials.PaintWhite}>
                    {whiteBoxes.map((d, i) => (
                        <Instance key={i} position={d.position} rotation={d.rotation} scale={d.scale} />
                    ))}
                </Instances>
            )}

            {/* Yellow Paint */}
            {yellowBoxes.length > 0 && (
                <Instances range={yellowBoxes.length} geometry={boxGeo} material={Materials.PaintYellow}>
                    {yellowBoxes.map((d, i) => (
                        <Instance key={i} position={d.position} rotation={d.rotation} scale={d.scale} />
                    ))}
                </Instances>
            )}

            {/* Asphalt Patches (used in some markings) */}
            {asphaltBoxes.length > 0 && (
                <Instances range={asphaltBoxes.length} geometry={boxGeo} material={Materials.Asphalt}>
                    {asphaltBoxes.map((d, i) => (
                        <Instance key={i} position={d.position} rotation={d.rotation} scale={d.scale} />
                    ))}
                </Instances>
            )}
        </group>
    )
}

// --- Lamp Instances ---
const lampPoleGeo = new CylinderGeometry(0.1, 0.12, 3.5, 8);
lampPoleGeo.translate(0, 1.75, 0);
const lampArmGeo = new BoxGeometry(0.1, 0.1, 1.2);
lampArmGeo.translate(0, 3.5, 0.4);
const lampShadeGeo = new ConeGeometry(0.3, 0.4, 8);
lampShadeGeo.translate(0, 3.5, 0.9);
const lampBulbGeo = new SphereGeometry(0.15, 8, 8);
lampBulbGeo.translate(0, 3.3, 0.9);

export const LampInstances: React.FC<{ data: { position: [number, number, number], rotation: [number, number, number] }[] }> = React.memo(({ data }) => {
    const isNight = useGameStore(s => s.isNight);
    const bulbMat = useRef<MeshStandardMaterial>(null);
    const glowMat = useRef<MeshBasicMaterial>(null);
    const nearDataRef = React.useRef(data);
    const farDataRef = React.useRef<typeof data>([]);
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const accumulator = React.useRef(0);
    const lastNearCount = React.useRef(data.length);
    const lastFarCount = React.useRef(0);

    useFrame((state) => {
        accumulator.current += state.clock.getDelta();
        if (accumulator.current > 0.7) {
            accumulator.current = 0;
            const player = useGameStore.getState().playerPosition;
            const near: typeof data = [];
            const far: typeof data = [];
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                const dx = d.position[0] - player[0];
                const dz = d.position[2] - player[2];
                const distSq = dx * dx + dz * dz;
                if (distSq < 25 * 25) near.push(d);
                else far.push(d);
            }

            // Only update if counts changed to avoid unnecessary re-renders
            if (near.length !== lastNearCount.current || far.length !== lastFarCount.current) {
                nearDataRef.current = near;
                farDataRef.current = far;
                lastNearCount.current = near.length;
                lastFarCount.current = far.length;
                forceUpdate();
            }
        }

        if (!bulbMat.current || !glowMat.current) return;
        const t = state.clock.getElapsedTime();
        const flicker = isNight ? Math.sin(t * 2) * 0.05 + Math.cos(t * 13) * 0.02 : 0;

        const targetEmissive = isNight ? 3 + flicker : 0;
        const targetGlow = isNight ? 0.4 + flicker * 0.1 : 0;
        const targetColor = isNight ? '#ffcc00' : '#444';

        bulbMat.current.emissiveIntensity = MathUtils.lerp(bulbMat.current.emissiveIntensity, targetEmissive, 0.1);
        bulbMat.current.color.set(targetColor);
        glowMat.current.opacity = MathUtils.lerp(glowMat.current.opacity, targetGlow, 0.1);
    });

    const nearData = nearDataRef.current;
    const farData = farDataRef.current;

    return (
        <group>
            <Instances range={nearData.length} geometry={lampPoleGeo} material={Materials.TrafficBlack}>
                {nearData.map((d, i) => <Instance key={`p-${i}`} position={d.position} rotation={d.rotation} />)}
            </Instances>
            <Instances range={nearData.length} geometry={lampArmGeo} material={Materials.TrafficBlack}>
                {nearData.map((d, i) => <Instance key={`a-${i}`} position={d.position} rotation={d.rotation} />)}
            </Instances>
            <Instances range={nearData.length} geometry={lampShadeGeo} material={Materials.TrafficBlack}>
                {nearData.map((d, i) => <Instance key={`s-${i}`} position={d.position} rotation={d.rotation} />)}
            </Instances>

            {/* Bulb */}
            <Instances range={nearData.length} geometry={lampBulbGeo}>
                <meshStandardMaterial ref={bulbMat} color="#444" emissive="#ffaa00" emissiveIntensity={0} toneMapped={false} />
                {nearData.map((d, i) => <Instance key={`b-${i}`} position={d.position} rotation={d.rotation} />)}
            </Instances>

            {/* Glow (Optional, maybe too expensive for transparency? Let's keep it but optimized) */}
            <Instances range={nearData.length} geometry={lampBulbGeo} scale={5}>
                <meshBasicMaterial ref={glowMat} color="#ffaa00" transparent opacity={0} depthWrite={false} />
                {nearData.map((d, i) => <Instance key={`g-${i}`} position={d.position} rotation={d.rotation} />)}
            </Instances>

            {/* Far LOD: only the pole to keep silhouette without details */}
            {farData.length > 0 && (
                <Instances range={farData.length} geometry={lampPoleGeo} material={Materials.TrafficBlack}>
                    {farData.map((d, i) => <Instance key={`fp-${i}`} position={d.position} rotation={d.rotation} />)}
                </Instances>
            )}
        </group>
    );
});

// Separate lightweight lights so lamps actually illuminate at noche sin spawnear cientos de luces
// We only place a light on every 2nd lamp to keep performance reasonable.
export const LampPointLights: React.FC<{ data: { position: [number, number, number], rotation: [number, number, number] }[] }> = React.memo(({ data }) => {
    const isNight = useGameStore(s => s.isNight);
    const playerRef = useGameStore(s => s.playerPosition);
    const qualityLevel = useGameStore(s => s.qualityLevel);
    const quality = QUALITY_PRESETS[qualityLevel];

    // limit to the 40 closest lamps to the player
    const sorted = useMemo(() => {
        const cloned = [...data];
        return cloned;
    }, [data]);

    return (
        <>
            {sorted
                .map((lamp, idx) => {
                    const dx = lamp.position[0] - playerRef[0];
                    const dz = lamp.position[2] - playerRef[2];
                    return { lamp, distSq: dx * dx + dz * dz, idx };
                })
                .sort((a, b) => a.distSq - b.distSq)
                .slice(0, quality.lampLightBudget)
                .map(({ lamp, idx }) => (
                    <pointLight
                        key={idx}
                        color="#ffdd99"
                        intensity={isNight ? 2.1 : 0}
                        distance={7}
                        decay={2.4}
                        position={[lamp.position[0], lamp.position[1] + 3.5, lamp.position[2]]}
                        castShadow={false}
                    />
                ))}
        </>
    );
});

// --- 3. FENCES ---
// Fences are made of boxes.
// Post: 0.15, 1, 0.15
// Rail: width, 0.1, 0.05
const fencePostGeo = new BoxGeometry(0.15, 1, 0.15);
const fenceRailGeo = new BoxGeometry(1, 0.1, 0.05); // Width 1 base, scaled X

// --- URBAN FURNITURE INSTANCES ---

// Parking Meter Geometry (simplified for instancing)
const parkingMeterPoleGeo = new CylinderGeometry(0.04, 0.04, 1, 8);
parkingMeterPoleGeo.translate(0, 0.5, 0);
const parkingMeterHeadGeo = new BoxGeometry(0.12, 0.25, 0.08);
parkingMeterHeadGeo.translate(0, 1.12, 0);

export const ParkingMeterInstances: React.FC<{ data: { position: [number, number, number] }[] }> = React.memo(({ data }) => {
    return (
        <group>
            <Instances range={data.length} geometry={parkingMeterPoleGeo} material={Materials.TrafficBlack} castShadow>
                {data.map((d, i) => <Instance key={`pole-${i}`} position={d.position} />)}
            </Instances>
            <Instances range={data.length} geometry={parkingMeterHeadGeo} material={Materials.Metal} castShadow>
                {data.map((d, i) => <Instance key={`head-${i}`} position={d.position} />)}
            </Instances>
        </group>
    );
});

// Modern Trash Can Geometry
const trashCanBodyGeo = new CylinderGeometry(0.25, 0.22, 0.8, 12);
trashCanBodyGeo.translate(0, 0.4, 0);
const trashCanTopGeo = new CylinderGeometry(0.28, 0.25, 0.08, 12);
trashCanTopGeo.translate(0, 0.84, 0);

export const TrashCanInstances: React.FC<{ data: { position: [number, number, number]; isRecycling?: boolean }[] }> = React.memo(({ data }) => {
    const generalMat = useMemo(() => new MeshStandardMaterial({ color: '#3a5a40', roughness: 0.6 }), []);
    const recyclingMat = useMemo(() => new MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.6 }), []);

    const generalData = data.filter(d => !d.isRecycling);
    const recyclingData = data.filter(d => d.isRecycling);

    return (
        <group>
            {/* General trash cans */}
            {generalData.length > 0 && (
                <>
                    <Instances range={generalData.length} geometry={trashCanBodyGeo} material={generalMat} castShadow>
                        {generalData.map((d, i) => <Instance key={`body-${i}`} position={d.position} />)}
                    </Instances>
                    <Instances range={generalData.length} geometry={trashCanTopGeo} material={Materials.TrafficBlack} castShadow>
                        {generalData.map((d, i) => <Instance key={`top-${i}`} position={d.position} />)}
                    </Instances>
                </>
            )}
            {/* Recycling cans */}
            {recyclingData.length > 0 && (
                <>
                    <Instances range={recyclingData.length} geometry={trashCanBodyGeo} material={recyclingMat} castShadow>
                        {recyclingData.map((d, i) => <Instance key={`r-body-${i}`} position={d.position} />)}
                    </Instances>
                    <Instances range={recyclingData.length} geometry={trashCanTopGeo} material={Materials.TrafficBlack} castShadow>
                        {recyclingData.map((d, i) => <Instance key={`r-top-${i}`} position={d.position} />)}
                    </Instances>
                </>
            )}
        </group>
    );
});

// Planter Box Geometry (simplified)
const planterBoxGeo = new BoxGeometry(1, 0.4, 0.5);
planterBoxGeo.translate(0, 0.2, 0);
const planterSoilGeo = new BoxGeometry(0.9, 0.1, 0.4);
planterSoilGeo.translate(0, 0.35, 0);

export const PlanterBoxInstances: React.FC<{ data: { position: [number, number, number]; length?: number }[] }> = React.memo(({ data }) => {
    const concreteMat = useMemo(() => new MeshStandardMaterial({ color: '#808080', roughness: 0.8 }), []);
    const soilMat = useMemo(() => new MeshStandardMaterial({ color: '#5d4037', roughness: 0.9 }), []);

    return (
        <group>
            <Instances range={data.length} geometry={planterBoxGeo} material={concreteMat} castShadow receiveShadow>
                {data.map((d, i) => (
                    <Instance key={`box-${i}`} position={d.position} scale={[d.length || 1, 1, 1]} />
                ))}
            </Instances>
            <Instances range={data.length} geometry={planterSoilGeo} material={soilMat}>
                {data.map((d, i) => (
                    <Instance key={`soil-${i}`} position={d.position} scale={[d.length || 1, 1, 1]} />
                ))}
            </Instances>
        </group>
    );
});

// Power Line Pole Geometry (simplified for instancing)
const poleMastGeo = new CylinderGeometry(0.12, 0.15, 8, 8);
poleMastGeo.translate(0, 4, 0);
const poleArmGeo = new BoxGeometry(2, 0.1, 0.1);
poleArmGeo.translate(0, 7.5, 0);

export const PowerPoleInstances: React.FC<{ data: { position: [number, number, number] }[] }> = React.memo(({ data }) => {
    return (
        <group>
            <Instances range={data.length} geometry={poleMastGeo} material={Materials.TrafficBlack} castShadow>
                {data.map((d, i) => <Instance key={`mast-${i}`} position={d.position} />)}
            </Instances>
            <Instances range={data.length} geometry={poleArmGeo} material={Materials.TrafficBlack} castShadow>
                {data.map((d, i) => <Instance key={`arm-${i}`} position={d.position} />)}
            </Instances>
        </group>
    );
});

// AC Unit Geometry (simplified for building walls)
const acBodyGeo = new BoxGeometry(0.6, 0.4, 0.3);
const acGrilleGeo = new BoxGeometry(0.5, 0.25, 0.02);

export const ACUnitInstances: React.FC<{ data: { position: [number, number, number]; rotation?: [number, number, number] }[] }> = React.memo(({ data }) => {
    const bodyMat = useMemo(() => new MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.6 }), []);
    const grilleMat = useMemo(() => new MeshStandardMaterial({ color: '#b0b0b0', roughness: 0.7 }), []);

    return (
        <group>
            <Instances range={data.length} geometry={acBodyGeo} material={bodyMat} castShadow>
                {data.map((d, i) => (
                    <Instance key={`body-${i}`} position={d.position} rotation={d.rotation || [0, 0, 0]} />
                ))}
            </Instances>
            <Instances range={data.length} geometry={acGrilleGeo} material={grilleMat}>
                {data.map((d, i) => {
                    // Offset grille forward based on rotation
                    const r = d.rotation || [0, 0, 0];
                    const offset = new Vector3(0, 0.02, 0.16);
                    const q = new Quaternion().setFromEuler(new Euler(r[0], r[1], r[2]));
                    offset.applyQuaternion(q);
                    return (
                        <Instance
                            key={`grille-${i}`}
                            position={[d.position[0] + offset.x, d.position[1] + offset.y, d.position[2] + offset.z]}
                            rotation={r}
                        />
                    );
                })}
            </Instances>
        </group>
    );
});

// Utility Box Geometry
const utilityBoxGeo = new BoxGeometry(0.5, 0.8, 0.4);
utilityBoxGeo.translate(0, 0.4, 0);

export const UtilityBoxInstances: React.FC<{ data: { position: [number, number, number]; rotation?: [number, number, number]; color?: string }[] }> = React.memo(({ data }) => {
    // Group by color for efficient instancing
    const grouped = useMemo(() => {
        const groups: Record<string, typeof data> = {};
        data.forEach(d => {
            const c = d.color || '#7a8a7a';
            if (!groups[c]) groups[c] = [];
            groups[c].push(d);
        });
        return groups;
    }, [data]);

    return (
        <group>
            {Object.entries(grouped).map(([color, items]) => (
                <Instances key={color} range={items.length} geometry={utilityBoxGeo} castShadow>
                    <meshStandardMaterial color={color} roughness={0.7} />
                    {items.map((d, i) => (
                        <Instance key={i} position={d.position} rotation={d.rotation || [0, 0, 0]} />
                    ))}
                </Instances>
            ))}
        </group>
    );
});

export const FenceInstances: React.FC<{ data: { position: [number, number, number], rotation: [number, number, number], width: number }[] }> = React.memo(({ data }) => {
    // Pre-calculate instance data
    const { posts, rails } = useMemo(() => {
        const posts: any[] = [];
        const rails: any[] = [];
        const dummy = new Vector3();
        const dummyQ = new Quaternion();
        const dummyE = new Euler();

        data.forEach(d => {
            const { position, rotation, width } = d;
            const rot = new Euler(rotation[0], rotation[1], rotation[2]);
            const q = new Quaternion().setFromEuler(rot);

            // Post 1 (Left)
            const p1Offset = new Vector3(-width / 2, 0.5, 0).applyQuaternion(q);
            posts.push({ position: [position[0] + p1Offset.x, position[1] + p1Offset.y, position[2] + p1Offset.z], rotation: rotation });

            // Post 2 (Right)
            const p2Offset = new Vector3(width / 2, 0.5, 0).applyQuaternion(q);
            posts.push({ position: [position[0] + p2Offset.x, position[1] + p2Offset.y, position[2] + p2Offset.z], rotation: rotation });

            // Rail 1 (Top)
            const r1Offset = new Vector3(0, 0.8, 0).applyQuaternion(q);
            rails.push({ position: [position[0] + r1Offset.x, position[1] + r1Offset.y, position[2] + r1Offset.z], rotation: rotation, scale: [width, 1, 1] });

            // Rail 2 (Bottom)
            const r2Offset = new Vector3(0, 0.4, 0).applyQuaternion(q);
            rails.push({ position: [position[0] + r2Offset.x, position[1] + r2Offset.y, position[2] + r2Offset.z], rotation: rotation, scale: [width, 1, 1] });
        });

        return { posts, rails };
    }, [data]);

    return (
        <group>
            <Instances range={posts.length} geometry={fencePostGeo} material={Materials.WoodDark} castShadow>
                {posts.map((d, i) => <Instance key={i} position={d.position} rotation={d.rotation} />)}
            </Instances>
            <Instances range={rails.length} geometry={fenceRailGeo} material={Materials.WoodDark} castShadow>
                {rails.map((d, i) => <Instance key={i} position={d.position} rotation={d.rotation} scale={d.scale} />)}
            </Instances>
        </group>
    )
});
