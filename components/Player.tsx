
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, vec3, CapsuleCollider, CuboidCollider, BallCollider } from '@react-three/rapier';
import { Vector3, Group, MathUtils, Quaternion } from 'three';
import { useKeyboardControls, Sphere, Cylinder, Box, Cone, Capsule, RoundedBox, Torus } from '@react-three/drei';
import { Controls, useGameStore, AnimalType, AccessoryType } from '../store';
import { playSound, updateListener } from '../utils/audio';

const MOVEMENT_SPEED = 5;
const RUN_MULTIPLIER = 1.8;
const JUMP_FORCE = 8; // Reduced for a natural short hop
const POSITION_UPDATE_INTERVAL = 0.05; // Update position every 50ms instead of every frame

// Reusable objects to avoid garbage collection in useFrame
const _playerDirection = new Vector3();
const _playerFrontVector = new Vector3();
const _playerSideVector = new Vector3();
const _playerDir = new Vector3();
const _playerCameraOffset = new Vector3(0, 6, 8);
const _playerDesiredPosition = new Vector3();
let _positionUpdateAccumulator = 0;

import { CharacterModel } from './player/CharacterModel';
export const Player: React.FC = () => {
    const body = useRef<RapierRigidBody>(null);
    const [subscribeKeys, getKeys] = useKeyboardControls();

    const bodyMesh = useRef<Group>(null);
    const [isMoving, setIsMoving] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isGrounded, setIsGrounded] = useState(false);
    const stepTimer = useRef(0);

    // Selector for character state to prevent re-renders in other components if player changes
    const character = useGameStore((state) => state.character);
    const isSitting = useGameStore((state) => state.isSitting);
    const sitTarget = useGameStore((state) => state.sitTarget);
    const sitRotation = useGameStore((state) => state.sitRotation);
    const stopSitting = useGameStore((state) => state.stopSitting);
    const setPlayerRef = useGameStore((state) => state.setPlayerRef);
    const isDriving = useGameStore((state) => state.isDriving);
    const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);

    useEffect(() => { if (body.current) setPlayerRef(body); }, [setPlayerRef]);

    // Teleport player near the car when exiting
    useEffect(() => {
        if (!isDriving && body.current) {
            const lastPos = useGameStore.getState().playerPosition;
            const px = Number.isFinite(lastPos[0]) ? lastPos[0] + 2 : 2;
            const py = Number.isFinite(lastPos[1]) ? lastPos[1] + 2 : 2;
            const pz = Number.isFinite(lastPos[2]) ? lastPos[2] : 2;
            // Teleport slightly to the left and up to avoid clipping
            body.current.setTranslation(vec3({ x: px, y: py, z: pz }), true);
            body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
    }, [isDriving]);

    useEffect(() => {
        if (isSitting && body.current && sitTarget) {
            body.current.setTranslation(vec3({ x: sitTarget[0], y: sitTarget[1], z: sitTarget[2] }), true);
            body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            if (bodyMesh.current && sitRotation) bodyMesh.current.rotation.set(sitRotation[0], sitRotation[1], sitRotation[2]);
        }
    }, [isSitting, sitTarget, sitRotation]);

    useFrame((state, delta) => {
        if (!body.current) return;

        // Update Audio Listener Position and Orientation
        const pos = body.current.translation();

        // Safety check for NaN
        if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) {
            body.current.setTranslation(vec3({ x: 0, y: 5, z: 5 }), true);
            body.current.setLinvel(vec3({ x: 0, y: 0, z: 0 }), true);
            return;
        }

        const cam = state.camera;
        cam.getWorldDirection(_playerDir);
        updateListener([pos.x, pos.y, pos.z], [_playerDir.x, _playerDir.y, _playerDir.z], [0, 1, 0]);

        // When driving, hide player, disable controls, but keep syncing position for minimap/world logic
        if (isDriving) {
            body.current.setTranslation(vec3({ x: 0, y: -10, z: 0 }), true); // Hide underground
            return;
        }

        // Throttle position updates to avoid infinite re-renders (update every 50ms)
        _positionUpdateAccumulator += delta;
        if (_positionUpdateAccumulator >= POSITION_UPDATE_INTERVAL) {
            _positionUpdateAccumulator = 0;
            setPlayerPosition([pos.x, pos.y, pos.z]);
        }

        if (pos.y < -10) { body.current.setTranslation(vec3({ x: 0, y: 5, z: 0 }), true); body.current.setLinvel(vec3({ x: 0, y: 0, z: 0 }), true); }

        const keys = getKeys();
        const mobileInput = useGameStore.getState().mobileInput;
        const jump = keys.jump || mobileInput.buttons.jump;
        const run = keys.run || mobileInput.buttons.run;

        if (isSitting) {
            if (jump || keys.forward || keys.backward || keys.left || keys.right || mobileInput.joystick.active) {
                stopSitting();
                body.current.applyImpulse({ x: 0, y: 2, z: 0 }, true);
            } else {
                if (sitTarget) {
                    const t = body.current.translation();
                    if (Math.abs(t.x - sitTarget[0]) > 0.1 || Math.abs(t.z - sitTarget[2]) > 0.1) {
                        body.current.setTranslation(vec3({ x: sitTarget[0], y: sitTarget[1], z: sitTarget[2] }), true);
                    }
                }
                return;
            }
        }

        const velocity = body.current.linvel();
        _playerFrontVector.set(0, 0, Number(keys.backward) - Number(keys.forward));
        _playerSideVector.set(Number(keys.left) - Number(keys.right), 0, 0);
        _playerDirection.subVectors(_playerFrontVector, _playerSideVector).normalize();

        if (mobileInput.joystick.active) {
            _playerDirection.set(mobileInput.joystick.x, 0, mobileInput.joystick.y);
            if (_playerDirection.length() > 1) _playerDirection.normalize();
        }

        const speed = run ? MOVEMENT_SPEED * RUN_MULTIPLIER : MOVEMENT_SPEED;
        _playerDirection.multiplyScalar(speed);

        // Apply linear velocity for movement BUT preserve Y velocity from physics (gravity)
        body.current.setLinvel({ x: _playerDirection.x, y: velocity.y, z: _playerDirection.z }, true);

        const moving = _playerDirection.length() > 0.1;
        setIsMoving(moving);
        setIsRunning(run);

        if (moving && bodyMesh.current) {
            const angle = Math.atan2(_playerDirection.x, _playerDirection.z);
            const currentRotation = bodyMesh.current.rotation.y;
            let rotationDiff = angle - currentRotation;
            while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
            while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
            bodyMesh.current.rotation.y += rotationDiff * 10 * delta;

            // Only apply subtle turn lean to Z axis, let CharacterModel handle X rotation
            const turnLean = MathUtils.clamp(-rotationDiff * speed * 0.03, -0.15, 0.15);
            bodyMesh.current.rotation.z = MathUtils.lerp(bodyMesh.current.rotation.z, turnLean, 0.1);
            // Don't override X rotation - CharacterModel handles forward lean internally
            bodyMesh.current.rotation.x = MathUtils.lerp(bodyMesh.current.rotation.x, 0, 0.1);

            if (Math.abs(velocity.y) < 0.1) {
                stepTimer.current += delta;
                const stepInterval = run ? 0.3 : 0.45;
                if (stepTimer.current > stepInterval) { playSound('step'); stepTimer.current = 0; }
            }
        } else if (bodyMesh.current) {
            // Reset leans
            bodyMesh.current.rotation.z = MathUtils.lerp(bodyMesh.current.rotation.z, 0, 0.1);
            bodyMesh.current.rotation.x = MathUtils.lerp(bodyMesh.current.rotation.x, 0, 0.1);
        }

        if (jump && isGrounded) {
            body.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
            playSound('jump');
            setIsGrounded(false); // Immediate feedback
        }

        const playerPos = vec3(body.current.translation());
        _playerDesiredPosition.set(playerPos.x, playerPos.y, playerPos.z).add(_playerCameraOffset);
        if (Number.isFinite(_playerDesiredPosition.x)) {
            // Time-corrected lerp for smooth framerate-independent camera follow
            // factor = 1 - Math.exp(-speed * delta)
            // speed of 5-10 is usually good for camera
            const lerpFactor = 1 - Math.exp(-5 * delta);
            state.camera.position.lerp(_playerDesiredPosition, lerpFactor);
            state.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
        }
    });

    return (
        <RigidBody
            ref={body}
            name="player"
            colliders={false}
            lockRotations
            position={[0, 5, 5]}
            friction={0}
            restitution={0}
            linearDamping={0.1}
            angularDamping={1}
            ccd={true}
        >
            <CapsuleCollider args={[0.3, 0.3]} position={[0, 0.65, 0]} />
            <CapsuleCollider args={[0.1, 0.25]} position={[0, 0.35, 0]} />
            <CuboidCollider
                args={[0.2, 0.1, 0.2]}
                position={[0, 0.1, 0]}
                sensor
                onIntersectionEnter={() => setIsGrounded(true)}
                onIntersectionExit={() => setIsGrounded(false)}
            />

            <group ref={bodyMesh}>
                <CharacterModel
                    isMoving={isMoving}
                    run={isRunning}
                    isSitting={isSitting}
                    isGrounded={isGrounded}
                    skin={character.skin}
                    shirt={character.shirt}
                    pants={character.pants}
                    type={character.type}
                    accessory={character.accessory}
                />
            </group>
        </RigidBody>
    );
};
