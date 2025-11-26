import React, { useRef, useState, useEffect } from 'react';
import { RigidBody, CapsuleCollider, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Billboard, Text, useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { useGameStore, Controls, AnimalType, AccessoryType } from '../../store';
import { playSound } from '../../utils/audio';
import { CharacterModel } from '../player/CharacterModel';

// Reusable objects to avoid garbage collection in useFrame
const _simpleNpcCurVec = new Vector3();
const _simpleNpcDiff = new Vector3();
const _simpleNpcQ = new Quaternion();
const _simpleNpcAxis = new Vector3(0, 1, 0);

export const SimpleNPC: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; name: string; dialogue: string; overrideType?: AnimalType }> = ({ position, rotation = [0, 0, 0], name, dialogue, overrideType }) => {
    const rigidBody = useRef<RapierRigidBody>(null);
    const setInteractionLabel = useGameStore((state) => state.setInteractionLabel);
    const openDialogue = useGameStore((state) => state.openDialogue);
    const isHolding = useGameStore(s => s.isHolding);
    const [subscribeKeys] = useKeyboardControls();
    const [inRange, setInRange] = useState(false);

    const startPos = useRef<Vector3 | null>(null);
    const state = useRef<'idle' | 'moving'>('idle');
    const stateTimer = useRef(Math.random() * 5);
    const targetPos = useRef(new Vector3());
    const moveSpeed = 2;

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
                if (pressed) {
                    openDialogue(name, dialogue);
                    playSound('coin');
                }
            }, { fireImmediately: false });
            return () => sub();
        }
    }, [inRange, name, dialogue, openDialogue, isHolding]);

    useFrame((rootState, delta) => {
        if (!rigidBody.current) return;
        if (!startPos.current) {
            const t = rigidBody.current.translation();
            startPos.current = new Vector3(t.x, t.y, t.z);
            targetPos.current.copy(startPos.current);
        }

        const currentPos = rigidBody.current.translation();
        const currentVel = rigidBody.current.linvel();
        stateTimer.current -= delta;

        // Throttled logic for state transitions (run every frame but logic inside is time-based)
        // Physics updates must run every frame for smoothness

        if (state.current === 'idle') {
            if (stateTimer.current <= 0) {
                const r = 4; // Wander radius
                const dx = (Math.random() - 0.5) * 2 * r;
                const dz = (Math.random() - 0.5) * 2 * r;
                targetPos.current.set(startPos.current.x + dx, startPos.current.y, startPos.current.z + dz);
                state.current = 'moving';
                stateTimer.current = 4 + Math.random() * 4;
            }
            // Only update physics if velocity is significant to avoid waking up sleeping bodies unnecessarily
            if (Math.abs(currentVel.x) > 0.1 || Math.abs(currentVel.z) > 0.1) {
                rigidBody.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
            }
        } else if (state.current === 'moving') {
            _simpleNpcCurVec.set(currentPos.x, currentPos.y, currentPos.z);
            _simpleNpcDiff.subVectors(targetPos.current, _simpleNpcCurVec);
            _simpleNpcDiff.y = 0;
            const dist = _simpleNpcDiff.length();

            if (dist < 0.5 || stateTimer.current <= 0) {
                state.current = 'idle';
                stateTimer.current = Math.random() * 5 + 3;
                rigidBody.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
            } else {
                _simpleNpcDiff.normalize().multiplyScalar(moveSpeed);
                rigidBody.current.setLinvel({ x: _simpleNpcDiff.x, y: currentVel.y, z: _simpleNpcDiff.z }, true);

                // Throttle rotation updates slightly or just keep them smooth
                const angle = Math.atan2(_simpleNpcDiff.x, _simpleNpcDiff.z);
                _simpleNpcQ.setFromAxisAngle(_simpleNpcAxis, angle);
                rigidBody.current.setRotation(_simpleNpcQ, true);
            }
        }
    });

    return (
        <group position={position} rotation={rotation}>
            <RigidBody ref={rigidBody} type="dynamic" colliders={false} lockRotations linearDamping={1} angularDamping={5} friction={0.2} mass={60}>
                <CapsuleCollider args={[0.3, 0.3]} position={[0, 0.6, 0]} />
                <CharacterModel
                    isMoving={state.current === 'moving'}
                    run={false}
                    isSitting={false}
                    isGrounded={true}
                    skin={appearance.skin}
                    shirt={appearance.shirt}
                    pants={appearance.pants}
                    type={appearance.type}
                    accessory={appearance.accessory}
                />
                <group position={[0, 1.8, 0]}>
                    <Billboard>
                        {inRange && !isHolding && <Text fontSize={0.25} color="black" outlineWidth={0.02} outlineColor="white">💬 Hablar</Text>}
                        <Text position={[0, -0.3, 0]} fontSize={0.2} color="#333" anchorX="center" anchorY="bottom">{name}</Text>
                    </Billboard>
                </group>
                <CuboidCollider args={[1.5, 1, 1.5]} position={[0, 1, 0]} sensor onIntersectionEnter={({ other }) => other.rigidBodyObject?.name === 'player' && (setInRange(true), !isHolding && setInteractionLabel(`Hablar con ${name}`))} onIntersectionExit={() => (setInteractionLabel(null), setInRange(false))} />
            </RigidBody>
        </group>
    );
};
