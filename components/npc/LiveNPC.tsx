import React, { useRef, useState, useEffect, useMemo } from 'react';
import { RigidBody, CapsuleCollider, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Billboard, Text, Html, useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Group } from 'three';
import { useGameStore, Controls, NpcConfig, AnimalType, AccessoryType } from '../../store';
import { playSound } from '../../utils/audio';
import { CharacterModel } from '../player/CharacterModel';

const Y_AXIS = new Vector3(0, 1, 0);
const RENDER_DISTANCE = 35; // NPCs beyond this are culled
const UPDATE_DISTANCE = 25; // NPCs beyond this get reduced updates
const LOD_DISTANCE = 15; // NPCs beyond this use simplified animations

export const LiveNPC: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; config: NpcConfig; overrideType?: AnimalType }> = ({ position, rotation = [0, 0, 0], config, overrideType }) => {
    const rigidBody = useRef<RapierRigidBody>(null);
    const setInteractionLabel = useGameStore((state) => state.setInteractionLabel);
    const startLiveSession = useGameStore((state) => state.startLiveSession);
    const liveSession = useGameStore(s => s.liveSession);
    const endLiveSession = useGameStore(s => s.endLiveSession);
    const liveConnectionState = useGameStore(s => s.liveConnectionState);
    const liveVolume = useGameStore(s => s.liveVolume);
    const playerRef = useGameStore(s => s.playerRef);
    const isHolding = useGameStore(s => s.isHolding);

    const [subscribeKeys] = useKeyboardControls();
    const [inRange, setInRange] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lodLevel, setLodLevel] = useState<'high' | 'medium' | 'low'>('high');
    const frameSkip = useRef(0);

    // Per-instance vectors to avoid conflicts between NPCs
    const vectors = useMemo(() => ({
        curVec: new Vector3(),
        diff: new Vector3(),
        q: new Quaternion(),
        targetQ: new Quaternion(),
        playerPos: new Vector3(),
    }), []);

    const startPos = useRef<Vector3 | null>(null);
    const state = useRef<'idle' | 'moving'>('idle');
    const stateTimer = useRef(Math.random() * 5);
    const targetPos = useRef(new Vector3());
    const moveSpeed = 2;
    const bodyGroup = useRef<Group>(null);

    const isLive = liveSession.isOpen && liveSession.npc?.name === config.name;

    const [appearance] = useState(() => ({
        type: overrideType || (['bear', 'cat', 'rabbit', 'fox', 'dog', 'panda', 'koala', 'lion', 'pig', 'chicken', 'elephant', 'sheep', 'penguin', 'duck', 'zebra'] as AnimalType[])[Math.floor(Math.random() * 15)],
        skin: ['#fcd5ce', '#e0ac69', '#8d5524', '#ffdbac'][Math.floor(Math.random() * 4)],
        shirt: ['#FF9A8B', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 4)],
        pants: ['#4a90e2', '#5D4037', '#333333'][Math.floor(Math.random() * 3)],
        accessory: (['none', 'backpack', 'glasses', 'hat', 'scarf'] as AccessoryType[])[Math.floor(Math.random() * 5)]
    }));

    useEffect(() => {
        if (inRange && !isHolding) {
            const sub = subscribeKeys((state) => state[Controls.interact], (pressed) => {
                if (pressed && !isLive) {
                    startLiveSession(config);
                    playSound('coin');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, config, startLiveSession, subscribeKeys, isLive, isHolding]);

    useFrame((rootState, delta) => {
        if (!rigidBody.current) return;

        // Distance-based culling check (every 10 frames for performance)
        frameSkip.current++;
        const shouldCheckDistance = frameSkip.current % 10 === 0;

        if (shouldCheckDistance && playerRef?.current) {
            const pp = playerRef.current.translation();
            const npcPos = rigidBody.current.translation();
            vectors.playerPos.set(pp.x, pp.y, pp.z);
            const dist = vectors.playerPos.distanceTo(new Vector3(npcPos.x, npcPos.y, npcPos.z));

            // Update visibility and LOD
            setIsVisible(dist < RENDER_DISTANCE);
            if (dist < LOD_DISTANCE) setLodLevel('high');
            else if (dist < UPDATE_DISTANCE) setLodLevel('medium');
            else setLodLevel('low');

            // Skip updates for far NPCs (unless in conversation)
            if (dist > UPDATE_DISTANCE && !isLive) {
                return;
            }
        }

        // Skip some frames for medium LOD NPCs
        if (lodLevel === 'medium' && frameSkip.current % 2 !== 0 && !isLive) {
            return;
        }

        if (!startPos.current) {
            const t = rigidBody.current.translation();
            startPos.current = new Vector3(t.x, t.y, t.z);
            targetPos.current.copy(startPos.current);
        }

        const currentPos = rigidBody.current.translation();
        const currentVel = rigidBody.current.linvel();
        const { curVec, diff, q, targetQ } = vectors;

        if (isLive) {
            if (playerRef?.current) {
                const pp = playerRef.current.translation();
                const dx = pp.x - currentPos.x;
                const dz = pp.z - currentPos.z;
                const angle = Math.atan2(dx, dz);

                const currentRot = rigidBody.current.rotation();
                q.set(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
                targetQ.setFromAxisAngle(Y_AXIS, angle);
                q.slerp(targetQ, delta * 5);
                rigidBody.current.setRotation(q, true);
            }
            rigidBody.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
            return;
        }

        stateTimer.current -= delta;

        if (state.current === 'idle') {
            if (stateTimer.current <= 0) {
                const r = 3;
                const dx = (Math.random() - 0.5) * 2 * r;
                const dz = (Math.random() - 0.5) * 2 * r;
                targetPos.current.set(startPos.current.x + dx, startPos.current.y, startPos.current.z + dz);
                state.current = 'moving';
                stateTimer.current = 5 + Math.random() * 5;
            }
            rigidBody.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
        } else if (state.current === 'moving') {
            curVec.set(currentPos.x, currentPos.y, currentPos.z);
            diff.subVectors(targetPos.current, curVec);
            diff.y = 0;
            const dist = diff.length();

            if (dist < 0.5 || stateTimer.current <= 0) {
                state.current = 'idle';
                stateTimer.current = Math.random() * 5 + 3;
                rigidBody.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
            } else {
                diff.normalize().multiplyScalar(moveSpeed);
                rigidBody.current.setLinvel({ x: diff.x, y: currentVel.y, z: diff.z }, true);
                const angle = Math.atan2(diff.x, diff.z);
                q.setFromAxisAngle(Y_AXIS, angle);
                rigidBody.current.setRotation(q, true);
            }
        }
    });

    // Don't render physics or character if too far
    if (!isVisible && !isLive) {
        return null;
    }

    return (
        <group position={position} rotation={rotation}>
            <RigidBody
                ref={rigidBody}
                type={lodLevel === 'low' ? 'fixed' : 'dynamic'} // Use fixed body for far NPCs to save physics calculations
                colliders={false}
                lockRotations
                linearDamping={1}
                angularDamping={5}
                friction={0.2}
                mass={60}
            >
                <CapsuleCollider args={[0.3, 0.3]} position={[0, 0.6, 0]} />
                <group ref={bodyGroup}>
                    <CharacterModel
                        isMoving={lodLevel === 'high' && state.current === 'moving' && !isLive} // Disable animation for medium/low LOD
                        run={false}
                        isSitting={false}
                        isGrounded={true}
                        skin={appearance.skin}
                        shirt={appearance.shirt}
                        pants={appearance.pants}
                        type={appearance.type}
                        accessory={appearance.accessory}
                    />
                    {isLive && (
                        <Html position={[0, 2.8, 0]} center distanceFactor={12} zIndexRange={[100, 0]} pointerEvents="auto">
                            <div className="flex flex-col items-center animate-in zoom-in duration-300" style={{ pointerEvents: 'auto' }}>
                                <div className={`relative w-24 h-24 rounded-full border-4 shadow-xl flex items-center justify-center bg-white overflow-hidden transition-colors duration-500 ${liveConnectionState === 'connected' ? 'border-green-400' : 'border-yellow-400'}`}>
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 opacity-80" style={{ transform: `scale(${0.8 + liveVolume})`, transition: 'transform 0.1s ease-out' }} />
                                    <div className="absolute inset-0 flex items-center justify-center text-4xl">{liveConnectionState === 'connected' ? '🎙️' : '⏳'}</div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); endLiveSession(); }} className="mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-4 rounded-full text-sm shadow-lg pointer-events-auto transition-transform active:scale-95">Cerrar</button>
                            </div>
                        </Html>
                    )}
                    {!isLive && (
                        <group position={[0, 1.8, 0]}>
                            <Billboard>
                                {inRange && !isHolding && (<Text fontSize={0.25} color="black" outlineWidth={0.02} outlineColor="white">💬 Hablar</Text>)}
                                <Text position={[0, -0.3, 0]} fontSize={0.2} color="#333" anchorX="center" anchorY="bottom">{config.name}</Text>
                            </Billboard>
                        </group>
                    )}
                </group>
                <CuboidCollider args={[1.5, 1, 1.5]} position={[0, 1, 0]} sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel(`Hablar con ${config.name}`))} onIntersectionExit={() => (setInteractionLabel(null), setInRange(false))} />
            </RigidBody>
        </group>
    );
};
