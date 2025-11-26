import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { Sphere, Cylinder, Box, Cone, Capsule, RoundedBox, Torus } from '@react-three/drei';
import { AnimalType, AccessoryType } from '../../store';
import { playSound } from '../../utils/audio';

type IdleAction = 'none' | 'look' | 'shift_weight' | 'stretch' | 'check_gear' | 'kick_dirt' | 'fix_hair' | 'check_watch' | 'tail_wag' | 'ear_twitch' | 'yawn' | 'hop';

interface CharacterModelProps {
    isMoving: boolean;
    run: boolean;
    isSitting: boolean;
    isGrounded: boolean;
    skin: string;
    shirt: string;
    pants: string;
    type: AnimalType;
    accessory: AccessoryType;
}

// Easing functions available for animation enhancements
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _easeOutElastic = (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _easeOutBounce = (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

// Smooth step function for natural movement
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _smoothStep = (edge0: number, edge1: number, x: number): number => {
    const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
};

// --- AC Style Character Component ---
export const CharacterModel: React.FC<CharacterModelProps> = ({ isMoving, run, isSitting, isGrounded, skin, shirt, pants, type, accessory }) => {
    // Refs for limbs and body parts
    const leftArm = useRef<Group>(null);
    const rightArm = useRef<Group>(null);
    const leftLeg = useRef<Group>(null);
    const rightLeg = useRef<Group>(null);
    const bodyGroup = useRef<Group>(null);
    const headGroup = useRef<Group>(null);
    const eyesGroup = useRef<Group>(null);
    const backpackGroup = useRef<Group>(null);

    // Animation State - Enhanced
    const walkCycle = useRef(0);
    const walkPhase = useRef(0);
    const targetWalkSpeed = useRef(0);
    const currentWalkSpeed = useRef(0);
    const idleTimer = useRef(0);
    const idleActionTimer = useRef(0);
    const currentIdleAction = useRef<IdleAction>('none');
    const prevGrounded = useRef(true);
    const prevMoving = useRef(false);

    // Smooth transition states
    const movementBlend = useRef(0); // 0 = idle, 1 = moving
    const runBlend = useRef(0); // 0 = walk, 1 = run
    const transitionTimer = useRef(0);

    // Physics squash state
    const squash = useRef(0); // 0 to 1
    const stretchY = useRef(1); // For anticipation and follow-through

    // Eye and expression states
    const blinkTimer = useRef(Math.random() * 3 + 1);
    const isBlinking = useRef(false);
    const headLookTarget = useRef(0);
    const headTiltTarget = useRef(0);
    const idleTime = useRef(0);
    const stepTimer = useRef(0);
    const lastStepSide = useRef(0); // -1 left, 1 right

    // Breathing rhythm
    const breathPhase = useRef(0);

    // Limb momentum for follow-through
    const armMomentum = useRef({ left: 0, right: 0 });
    const legMomentum = useRef({ left: 0, right: 0 });

    useFrame((state, delta) => {
        // Clamp delta to prevent extreme values on low framerate
        const safeDelta = Math.min(delta, 0.1);
        const t = state.clock.getElapsedTime();

        // ═══════════════════════════════════════════════════════════════
        // 1. SMOOTH STATE TRANSITIONS
        // ═══════════════════════════════════════════════════════════════

        // Blend between idle and moving states smoothly
        const targetMovementBlend = isMoving ? 1 : 0;
        movementBlend.current = MathUtils.lerp(movementBlend.current, targetMovementBlend, safeDelta * 6);

        // Blend between walk and run smoothly
        const targetRunBlend = run ? 1 : 0;
        runBlend.current = MathUtils.lerp(runBlend.current, targetRunBlend, safeDelta * 4);

        // Detect state changes for transition effects
        if (isMoving !== prevMoving.current) {
            transitionTimer.current = 0.3; // Trigger transition
            if (isMoving) {
                // Starting to move - anticipation squash
                stretchY.current = 0.92;
            }
        }
        prevMoving.current = isMoving;
        transitionTimer.current = Math.max(0, transitionTimer.current - safeDelta);

        // ═══════════════════════════════════════════════════════════════
        // 2. LANDING & JUMP PHYSICS
        // ═══════════════════════════════════════════════════════════════

        if (!prevGrounded.current && isGrounded) {
            // Just landed - squash effect
            squash.current = 1.0;
            playSound('step');
        }
        prevGrounded.current = isGrounded;

        // Animate squash with bounce-back
        const squashTarget = 0;
        const squashSpring = 15 + (isMoving ? 5 : 0); // Faster recovery when moving
        squash.current = MathUtils.lerp(squash.current, squashTarget, safeDelta * squashSpring);
        squash.current = MathUtils.clamp(squash.current, 0, 1);

        // Stretch recovery
        stretchY.current = MathUtils.lerp(stretchY.current, 1, safeDelta * 8);

        // ═══════════════════════════════════════════════════════════════
        // 3. WALK CYCLE ENGINE - Enhanced with proper gait mechanics
        // ═══════════════════════════════════════════════════════════════

        // Walk frequency based on state - more deliberate walk, energetic run
        const walkFreq = MathUtils.lerp(7, 13, runBlend.current);
        targetWalkSpeed.current = isMoving ? walkFreq : 0;

        // Smooth walk speed changes
        currentWalkSpeed.current = MathUtils.lerp(
            currentWalkSpeed.current,
            targetWalkSpeed.current,
            safeDelta * (isMoving ? 8 : 3) // Fast start, gradual stop
        );

        walkCycle.current += safeDelta * currentWalkSpeed.current;
        walkPhase.current = walkCycle.current % (Math.PI * 2);

        // Step sound timing
        if (isMoving && isGrounded) {
            const stepPhase = Math.sin(walkCycle.current);
            if (stepPhase > 0.9 && lastStepSide.current !== 1) {
                lastStepSide.current = 1;
                stepTimer.current = 0.1;
            } else if (stepPhase < -0.9 && lastStepSide.current !== -1) {
                lastStepSide.current = -1;
                stepTimer.current = 0.1;
            }
        }
        stepTimer.current = Math.max(0, stepTimer.current - safeDelta);

        // Idle time tracking
        if (!isMoving) idleTime.current += safeDelta;
        else idleTime.current = 0;

        // ═══════════════════════════════════════════════════════════════
        // 4. IDLE STATE MACHINE - More varied and expressive
        // ═══════════════════════════════════════════════════════════════

        if (!isMoving && !isSitting && isGrounded) {
            idleActionTimer.current -= safeDelta;

            if (idleActionTimer.current <= 0) {
                const rand = Math.random();
                const idleTimeBonus = Math.min(idleTime.current * 0.1, 0.3); // More varied actions over time

                if (rand < 0.2 - idleTimeBonus) {
                    currentIdleAction.current = 'none';
                    idleActionTimer.current = Math.random() * 2 + 1.5;
                }
                else if (rand < 0.35) {
                    currentIdleAction.current = 'look';
                    idleActionTimer.current = Math.random() * 2.5 + 2;
                }
                else if (rand < 0.5) {
                    currentIdleAction.current = 'shift_weight';
                    idleActionTimer.current = Math.random() * 3 + 2.5;
                }
                else if (rand < 0.6) {
                    currentIdleAction.current = 'stretch';
                    idleActionTimer.current = 3;
                }
                else if (rand < 0.7) {
                    currentIdleAction.current = 'kick_dirt';
                    idleActionTimer.current = 1.8;
                }
                else if (rand < 0.78) {
                    currentIdleAction.current = 'check_watch';
                    idleActionTimer.current = 2.8;
                }
                else if (rand < 0.86) {
                    currentIdleAction.current = 'tail_wag';
                    idleActionTimer.current = 2;
                }
                else if (rand < 0.93) {
                    currentIdleAction.current = 'ear_twitch';
                    idleActionTimer.current = 1.2;
                }
                else {
                    currentIdleAction.current = 'yawn';
                    idleActionTimer.current = 2.5;
                }
            }
        } else {
            currentIdleAction.current = 'none';
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. BREATHING SYSTEM - Organic, life-like rhythm
        // ═══════════════════════════════════════════════════════════════

        // Breathing rate varies with activity
        const breathRate = MathUtils.lerp(
            1.5, // Idle: slow, relaxed breathing
            MathUtils.lerp(4, 8, runBlend.current), // Moving: faster breathing
            movementBlend.current
        );
        breathPhase.current += safeDelta * breathRate;

        // Natural breathing curve (not pure sine)
        const breathIn = Math.pow(Math.sin(breathPhase.current), 2) * 0.6;
        const breathOut = Math.pow(Math.cos(breathPhase.current), 2) * 0.4;
        const breathCurve = breathIn - breathOut;

        // ═══════════════════════════════════════════════════════════════
        // 6. BODY ANIMATION - Squash, stretch, bob, sway
        // ═══════════════════════════════════════════════════════════════

        if (bodyGroup.current) {
            // Base breathing amplitude varies with state
            const breathAmp = MathUtils.lerp(0.025, 0.04, movementBlend.current);
            let breathe = breathCurve * breathAmp;

            // WALK/RUN BOB - Enhanced with double-bounce for cartoony feel
            const walkSin = Math.sin(walkCycle.current);
            const walkCos = Math.cos(walkCycle.current);

            // Primary bounce (once per step)
            const primaryBounce = Math.abs(Math.sin(walkCycle.current)) * MathUtils.lerp(0.08, 0.14, runBlend.current);
            // Secondary bounce (twice per step, smaller)
            const secondaryBounce = Math.abs(Math.sin(walkCycle.current * 2)) * MathUtils.lerp(0.02, 0.04, runBlend.current);

            const bob = movementBlend.current * (primaryBounce + secondaryBounce);

            // Hip sway when walking (side to side movement)
            const hipSway = walkSin * MathUtils.lerp(0.03, 0.05, runBlend.current) * movementBlend.current;

            // Target Values
            let targetBodyY = breathe + bob;
            let targetBodyRotZ = hipSway;
            // Reduced forward lean - was causing character to look like floating
            let targetBodyRotX = MathUtils.lerp(0, MathUtils.lerp(0.05, 0.12, runBlend.current), movementBlend.current);
            let targetBodyScaleY = stretchY.current;
            let targetBodyScaleXZ = 1;

            // Sitting adjustment
            if (isSitting) {
                targetBodyY -= 0.15;
                targetBodyRotX = 0;
            }

            // Apply Squash & Stretch
            const squashAmount = squash.current * 0.35;
            targetBodyScaleY -= squashAmount;
            targetBodyScaleXZ += squashAmount * 0.6;
            targetBodyY -= squashAmount * 0.4;

            // IDLE BEHAVIORS - Much more expressive
            const idleProgress = idleActionTimer.current > 0 ?
                Math.max(0, Math.min(1, 1 - idleActionTimer.current / 3)) : 0;

            if (currentIdleAction.current === 'shift_weight') {
                // Weight shift with hip movement
                const shift = Math.sin(t * 0.7) * 0.12;
                const hipShift = Math.sin(t * 0.7 + 0.3) * 0.05;
                targetBodyRotZ = shift;
                targetBodyY += Math.abs(shift) * 0.04;
                targetBodyRotX = hipShift;
            } else if (currentIdleAction.current === 'stretch') {
                const stretchIntensity = Math.sin(idleProgress * Math.PI);
                targetBodyScaleY += stretchIntensity * 0.22;
                targetBodyY += stretchIntensity * 0.15;
                targetBodyRotX = -0.2 * stretchIntensity;
            } else if (currentIdleAction.current === 'yawn') {
                const yawnProgress = Math.sin(idleProgress * Math.PI);
                targetBodyScaleY += yawnProgress * 0.08;
                targetBodyRotX = -0.15 * yawnProgress;
            } else if (currentIdleAction.current === 'none' && !isMoving && movementBlend.current < 0.1) {
                // Subtle idle "life" - gentle sway and bob
                const idleSway = Math.sin(t * 0.4) * 0.02;
                const idleBob = Math.sin(t * 0.7) * 0.012;
                const microShift = Math.sin(t * 2.1) * 0.005;
                targetBodyRotZ += idleSway + microShift;
                targetBodyY += idleBob;
            }

            // Clamp values
            targetBodyScaleY = MathUtils.clamp(targetBodyScaleY, 0.7, 1.35);
            targetBodyScaleXZ = MathUtils.clamp(targetBodyScaleXZ, 0.75, 1.25);
            targetBodyY = MathUtils.clamp(targetBodyY, -0.35, 0.35);

            // Apply with smooth interpolation
            const bodyLerpSpeed = isMoving ? 0.22 : 0.15;
            bodyGroup.current.position.y = MathUtils.lerp(bodyGroup.current.position.y, targetBodyY, bodyLerpSpeed);
            bodyGroup.current.rotation.x = MathUtils.lerp(bodyGroup.current.rotation.x, targetBodyRotX, 0.12);
            bodyGroup.current.rotation.z = MathUtils.lerp(bodyGroup.current.rotation.z, targetBodyRotZ, 0.12);

            // Scale with snappy squash response
            const scaleLerp = squash.current > 0.1 ? 0.35 : 0.2;
            bodyGroup.current.scale.y = MathUtils.lerp(bodyGroup.current.scale.y, targetBodyScaleY, scaleLerp);
            bodyGroup.current.scale.x = MathUtils.lerp(bodyGroup.current.scale.x, targetBodyScaleXZ, scaleLerp);
            bodyGroup.current.scale.z = MathUtils.lerp(bodyGroup.current.scale.z, targetBodyScaleXZ, scaleLerp);

            // Safety clamps
            bodyGroup.current.scale.y = MathUtils.clamp(bodyGroup.current.scale.y, 0.7, 1.35);
            bodyGroup.current.scale.x = MathUtils.clamp(bodyGroup.current.scale.x, 0.75, 1.25);
            bodyGroup.current.scale.z = MathUtils.clamp(bodyGroup.current.scale.z, 0.75, 1.25);
        }

        // ═══════════════════════════════════════════════════════════════
        // 7. HEAD ANIMATION - More alive and reactive
        // ═══════════════════════════════════════════════════════════════

        if (headGroup.current) {
            let targetHeadY = 0, targetHeadZ = 0, targetHeadX = 0;

            // Walking head bob - follows body rhythm
            if (movementBlend.current > 0.1) {
                const headBob = Math.sin(walkCycle.current * 2) * 0.03 * movementBlend.current;
                const headTilt = Math.sin(walkCycle.current) * 0.04 * movementBlend.current;
                targetHeadX = headBob;
                targetHeadZ = headTilt;
            }

            // Idle head behaviors
            if (currentIdleAction.current === 'look') {
                idleTimer.current -= safeDelta;
                if (idleTimer.current <= 0) {
                    const chance = Math.random();
                    if (chance < 0.35) headLookTarget.current = 0.55;
                    else if (chance < 0.7) headLookTarget.current = -0.55;
                    else headLookTarget.current = 0;
                    headTiltTarget.current = (Math.random() - 0.5) * 0.2;
                    idleTimer.current = Math.random() * 1.8 + 0.8;
                }
                targetHeadY = headLookTarget.current;
                targetHeadZ += headLookTarget.current * 0.12 + headTiltTarget.current;
            } else if (currentIdleAction.current === 'kick_dirt') {
                targetHeadX = 0.35;
            } else if (currentIdleAction.current === 'check_watch') {
                targetHeadX = 0.25;
                targetHeadY = 0.35;
                targetHeadZ = -0.1;
            } else if (currentIdleAction.current === 'yawn') {
                const yawnProgress = Math.sin((1 - idleActionTimer.current / 2.5) * Math.PI);
                targetHeadX = -0.25 * yawnProgress; // Tilt back during yawn
            } else if (currentIdleAction.current === 'stretch') {
                const stretchProgress = Math.sin((1 - idleActionTimer.current / 3) * Math.PI);
                targetHeadX = -0.3 * stretchProgress;
            }

            // Subtle idle head movement
            if (!isMoving && currentIdleAction.current === 'none' && movementBlend.current < 0.1) {
                targetHeadZ += Math.sin(t * 1.3) * 0.035;
                targetHeadY += Math.sin(t * 0.4) * 0.06;
                targetHeadX += Math.sin(t * 0.9) * 0.02;
            }

            // Apply with smooth transitions
            headGroup.current.rotation.y = MathUtils.lerp(headGroup.current.rotation.y, targetHeadY, 0.1);
            headGroup.current.rotation.z = MathUtils.lerp(headGroup.current.rotation.z, targetHeadZ, 0.1);
            headGroup.current.rotation.x = MathUtils.lerp(headGroup.current.rotation.x, targetHeadX, 0.12);
        }

        // ═══════════════════════════════════════════════════════════════
        // 8. BLINKING - Natural rhythm with variation
        // ═══════════════════════════════════════════════════════════════

        blinkTimer.current -= safeDelta;
        if (blinkTimer.current <= 0) {
            isBlinking.current = !isBlinking.current;
            if (isBlinking.current) {
                // Blink duration varies
                blinkTimer.current = 0.1 + Math.random() * 0.08;
            } else {
                // Time between blinks varies more
                const baseBlink = 2 + Math.random() * 3;
                // Blink more during idle
                const idleBonus = !isMoving ? Math.random() * 1 : 0;
                blinkTimer.current = baseBlink + idleBonus;
            }
        }

        if (eyesGroup.current) {
            const targetEyeScale = isBlinking.current ? 0.05 : 1;
            eyesGroup.current.scale.y = MathUtils.lerp(eyesGroup.current.scale.y, targetEyeScale, 0.5);
        }

        // ═══════════════════════════════════════════════════════════════
        // 9. LIMB ANIMATION - Natural gait with proper mechanics
        // ═══════════════════════════════════════════════════════════════

        const animateLimb = (
            ref: React.RefObject<Group | null>,
            phaseOffset: number,
            isArm: boolean,
            side: 'left' | 'right'
        ) => {
            if (!ref.current) return;

            let targetRotX = 0, targetRotZ = 0, targetRotY = 0;

            // === SITTING POSE ===
            if (isSitting) {
                if (!isArm) {
                    targetRotX = -Math.PI / 2;
                    targetRotZ = side === 'left' ? 0.1 : -0.1;
                } else {
                    targetRotX = -0.4;
                    targetRotZ = side === 'left' ? 0.25 : -0.25;
                }
            }
            // === AIRBORNE POSE ===
            else if (!isGrounded) {
                if (!isArm) {
                    // Legs tucked with slight spread
                    targetRotX = 0.5;
                    targetRotZ = side === 'left' ? 0.2 : -0.2;
                } else {
                    // Arms out for balance with wave
                    targetRotZ = side === 'left' ? 1.1 : -1.1;
                    targetRotX = -0.5 + Math.sin(t * 10) * 0.35;
                }
            }
            // === WALKING/RUNNING ===
            else if (movementBlend.current > 0.05) {
                const phase = walkCycle.current + phaseOffset;

                // Use eased sine for more natural motion
                const sinPhase = Math.sin(phase);
                const cosPhase = Math.cos(phase);

                // Amplitude increases with run blend
                const baseAmp = MathUtils.lerp(0.7, 1.1, runBlend.current);

                if (!isArm) {
                    // === LEG ANIMATION ===
                    // Forward swing with kick
                    const forwardSwing = sinPhase * baseAmp * 0.9;

                    // Knee lift on forward swing (more pronounced when running)
                    const kneeLift = Math.max(0, sinPhase) * MathUtils.lerp(0.15, 0.35, runBlend.current);

                    // Back kick (smaller, happens on back swing)
                    const backKick = Math.min(0, sinPhase) * 0.3;

                    targetRotX = forwardSwing + kneeLift + backKick;

                    // Slight outward rotation during swing
                    targetRotZ = (side === 'left' ? 1 : -1) * Math.abs(sinPhase) * 0.08;

                    // Hip rotation during stride
                    targetRotY = cosPhase * 0.05 * movementBlend.current;

                } else {
                    // === ARM ANIMATION ===
                    // Arms swing opposite to legs
                    const armSwing = -sinPhase * baseAmp;

                    // More exaggerated when running
                    targetRotX = armSwing * MathUtils.lerp(0.8, 1.3, runBlend.current);

                    // Arms pump in toward body when running
                    const pumpIn = MathUtils.lerp(0.1, 0.35, runBlend.current);
                    targetRotZ = (side === 'left' ? 1 : -1) * pumpIn;

                    // Add a little bounce to arm movement
                    targetRotZ += (side === 'left' ? 1 : -1) * Math.abs(sinPhase) * 0.1;

                    // Subtle arm rotation
                    targetRotY = sinPhase * MathUtils.lerp(0.05, 0.1, runBlend.current);
                }

                // Apply movement blend for smooth transition
                targetRotX *= movementBlend.current;
                targetRotZ *= movementBlend.current;
                targetRotY *= movementBlend.current;
            }
            // === IDLE ANIMATIONS ===
            else {
                // Idle-specific limb animations
                if (currentIdleAction.current === 'stretch' && isArm) {
                    const progress = 1 - idleActionTimer.current / 3;
                    const intensity = Math.sin(progress * Math.PI);
                    targetRotZ = (side === 'left' ? 1 : -1) * Math.PI * 0.8 * intensity;
                    targetRotX = -0.4 * intensity;
                } else if (currentIdleAction.current === 'fix_hair' && isArm && side === 'right') {
                    const progress = 1 - idleActionTimer.current / 2;
                    const intensity = Math.sin(progress * Math.PI);
                    targetRotZ = -2.3 * intensity;
                    targetRotX = 0.4 * intensity;
                } else if (currentIdleAction.current === 'kick_dirt' && !isArm && side === 'right') {
                    // Cute little kicks
                    const kickPhase = Math.sin(t * 12);
                    targetRotX = kickPhase * 0.25;
                    targetRotZ = Math.abs(kickPhase) * 0.1;
                } else if (currentIdleAction.current === 'check_watch' && isArm && side === 'left') {
                    const progress = 1 - idleActionTimer.current / 2.8;
                    const intensity = Math.sin(progress * Math.PI);
                    targetRotX = -0.6 * intensity;
                    targetRotZ = 0.7 * intensity;
                    targetRotY = 0.5 * intensity;
                } else if (currentIdleAction.current === 'yawn' && isArm) {
                    const yawnProgress = Math.sin((1 - idleActionTimer.current / 2.5) * Math.PI);
                    // Arms lift slightly during yawn
                    targetRotZ = (side === 'left' ? 1 : -1) * 0.3 * yawnProgress;
                } else {
                    // Default idle pose with subtle movement
                    if (isArm) {
                        // Check for held items
                        if (accessory === 'mate' && side === 'left') {
                            targetRotX = -0.75;
                            targetRotY = 0.45;
                        } else if (accessory === 'phone' && side === 'right') {
                            targetRotX = -1.15;
                            targetRotZ = -0.35;
                            targetRotY = -0.15;
                        } else if (accessory === 'termo' && side === 'left') {
                            targetRotX = -0.6;
                            targetRotY = 0.3;
                        } else if (accessory === 'alfajor' && side === 'right') {
                            targetRotX = -0.9;
                            targetRotZ = -0.2;
                        } else {
                            // Natural arm hang with subtle sway
                            targetRotZ = (side === 'left' ? 1 : -1) * 0.12;
                            targetRotZ += Math.sin(t * 1.3 + (side === 'left' ? 0 : 1.5)) * 0.05;
                            targetRotX = Math.sin(t * 0.9) * 0.025;
                        }
                    } else {
                        // Legs: subtle weight shifting
                        const weightShift = Math.sin(t * 0.5);
                        if (currentIdleAction.current === 'shift_weight') {
                            targetRotZ = (side === 'left' ? 1 : -1) * weightShift * 0.05;
                            targetRotX = (side === 'left' ? -weightShift : weightShift) * 0.03;
                        } else {
                            targetRotZ = (side === 'left' ? 1 : -1) * weightShift * 0.015;
                        }
                    }
                }
            }

            // Apply with momentum-based smoothing
            const lerpSpeed = movementBlend.current > 0.5 ? 0.2 : 0.14;

            // Track momentum for follow-through
            const prevRotX = ref.current.rotation.x;
            ref.current.rotation.x = MathUtils.lerp(ref.current.rotation.x, targetRotX, lerpSpeed);
            ref.current.rotation.z = MathUtils.lerp(ref.current.rotation.z, targetRotZ, lerpSpeed * 0.85);
            ref.current.rotation.y = MathUtils.lerp(ref.current.rotation.y, targetRotY, lerpSpeed * 0.85);

            // Store momentum
            const rotDiff = ref.current.rotation.x - prevRotX;
            if (isArm) {
                if (side === 'left') armMomentum.current.left = rotDiff;
                else armMomentum.current.right = rotDiff;
            } else {
                if (side === 'left') legMomentum.current.left = rotDiff;
                else legMomentum.current.right = rotDiff;
            }
        };

        // Animate all limbs with proper phase offsets
        // Arms swing opposite to legs (Math.PI offset)
        animateLimb(leftArm, 0, true, 'left');
        animateLimb(rightArm, Math.PI, true, 'right');
        animateLimb(leftLeg, Math.PI, false, 'left');
        animateLimb(rightLeg, 0, false, 'right');

        // ═══════════════════════════════════════════════════════════════
        // 10. SECONDARY MOTION - Backpack, ears, tail
        // ═══════════════════════════════════════════════════════════════

        if (backpackGroup.current && bodyGroup.current) {
            // Backpack bounces and sways with movement
            const bounce = movementBlend.current * Math.sin(walkCycle.current * 2) * 0.025;
            const sway = movementBlend.current * Math.sin(walkCycle.current) * 0.03;
            backpackGroup.current.position.y = 0.35 + bounce;
            backpackGroup.current.rotation.z = MathUtils.lerp(
                backpackGroup.current.rotation.z,
                -bodyGroup.current.rotation.z * 0.6 + sway,
                0.12
            );
            backpackGroup.current.rotation.x = MathUtils.lerp(
                backpackGroup.current.rotation.x,
                -bodyGroup.current.rotation.x * 0.3,
                0.1
            );
        }

    });

    return (
        <group ref={bodyGroup}>
            <group ref={headGroup} position={[0, 0.85, 0]}>
                <Sphere args={[0.38, 32, 32]} scale={[1, 0.9, 1]} castShadow><meshStandardMaterial color={skin} roughness={0.6} /></Sphere>
                {type === 'bear' && (<><Sphere args={[0.12]} position={[-0.25, 0.25, 0]} castShadow><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.12]} position={[0.25, 0.25, 0]} castShadow><meshStandardMaterial color={skin} /></Sphere></>)}
                {type === 'cat' && (<><group position={[-0.22, 0.3, 0]} rotation={[0, 0, 0.2]}><Cone args={[0.12, 0.25, 4]} castShadow><meshStandardMaterial color={skin} /></Cone></group><group position={[0.22, 0.3, 0]} rotation={[0, 0, -0.2]}><Cone args={[0.12, 0.25, 4]} castShadow><meshStandardMaterial color={skin} /></Cone></group></>)}
                {type === 'rabbit' && (<><group position={[-0.2, 0.45, -0.05]} rotation={[0.2, 0, -0.1]}><Capsule args={[0.08, 0.4, 4, 8]} castShadow><meshStandardMaterial color={skin} /></Capsule></group><group position={[0.2, 0.45, -0.05]} rotation={[0.2, 0, 0.1]}><Capsule args={[0.08, 0.4, 4, 8]} castShadow><meshStandardMaterial color={skin} /></Capsule></group></>)}
                {type === 'fox' && (<><group position={[-0.25, 0.35, -0.05]} rotation={[0, 0, 0.2]}><Cone args={[0.14, 0.35, 4]} castShadow><meshStandardMaterial color={skin} /></Cone><Cone args={[0.08, 0.2, 4]} position={[0, -0.05, 0.05]}><meshStandardMaterial color="#fff" /></Cone></group><group position={[0.25, 0.35, -0.05]} rotation={[0, 0, -0.2]}><Cone args={[0.14, 0.35, 4]} castShadow><meshStandardMaterial color={skin} /></Cone><Cone args={[0.08, 0.2, 4]} position={[0, -0.05, 0.05]}><meshStandardMaterial color="#fff" /></Cone></group><Cone args={[0.1, 0.2, 16]} position={[0, -0.05, 0.4]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}><meshStandardMaterial color={skin} /></Cone><Sphere args={[0.04]} position={[0, -0.05, 0.5]}><meshStandardMaterial color="#111" /></Sphere></>)}
                {type === 'dog' && (<><group position={[-0.3, 0.1, 0]} rotation={[0, 0, 0.5]}><Capsule args={[0.1, 0.25, 4, 8]} castShadow><meshStandardMaterial color={skin} /></Capsule></group><group position={[0.3, 0.1, 0]} rotation={[0, 0, -0.5]}><Capsule args={[0.1, 0.25, 4, 8]} castShadow><meshStandardMaterial color={skin} /></Capsule></group><RoundedBox args={[0.2, 0.15, 0.15]} radius={0.05} position={[0, -0.1, 0.35]}><meshStandardMaterial color={skin} /></RoundedBox><Sphere args={[0.06]} position={[0, -0.15, 0.42]}><meshStandardMaterial color="#111" /></Sphere></>)}
                {type === 'panda' && (<><Sphere args={[0.13]} position={[-0.28, 0.28, 0]} castShadow><meshStandardMaterial color="#111" /></Sphere><Sphere args={[0.13]} position={[0.28, 0.28, 0]} castShadow><meshStandardMaterial color="#111" /></Sphere><Sphere args={[0.12]} position={[-0.12, 0.05, 0.3]} scale={[1, 0.8, 0.5]} rotation={[0, 0, -0.2]}><meshStandardMaterial color="#111" /></Sphere><Sphere args={[0.12]} position={[0.12, 0.05, 0.3]} scale={[1, 0.8, 0.5]} rotation={[0, 0, 0.2]}><meshStandardMaterial color="#111" /></Sphere></>)}
                {type === 'koala' && (<><Sphere args={[0.18]} position={[-0.35, 0.15, 0]} scale={[0.8, 1, 0.5]} castShadow><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.12]} position={[-0.35, 0.15, 0.05]} scale={[0.8, 1, 0.5]}><meshStandardMaterial color="#fff" /></Sphere><Sphere args={[0.18]} position={[0.35, 0.15, 0]} scale={[0.8, 1, 0.5]} castShadow><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.12]} position={[0.35, 0.15, 0.05]} scale={[0.8, 1, 0.5]}><meshStandardMaterial color="#fff" /></Sphere><RoundedBox args={[0.12, 0.15, 0.05]} radius={0.05} position={[0, -0.05, 0.35]}><meshStandardMaterial color="#333" /></RoundedBox></>)}
                {type === 'lion' && (<><Torus args={[0.35, 0.1, 16, 32]} position={[0, 0, 0]}><meshStandardMaterial color="#d84315" /></Torus><Torus args={[0.25, 0.2, 16, 32]} position={[0, 0, -0.1]}><meshStandardMaterial color="#d84315" /></Torus><Sphere args={[0.1]} position={[-0.2, 0.3, 0]} castShadow><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.1]} position={[0.2, 0.3, 0]} castShadow><meshStandardMaterial color={skin} /></Sphere></>)}
                {type === 'pig' && (<><Cone args={[0.1, 0.2, 4]} position={[-0.25, 0.3, 0]} rotation={[0, 0, 0.5]}><meshStandardMaterial color={skin} /></Cone><Cone args={[0.1, 0.2, 4]} position={[0.25, 0.3, 0]} rotation={[0, 0, -0.5]}><meshStandardMaterial color={skin} /></Cone><Cylinder args={[0.1, 0.12, 0.15]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0.35]}><meshStandardMaterial color="#f06292" /></Cylinder><Sphere args={[0.02]} position={[-0.04, -0.05, 0.43]}><meshStandardMaterial color="#880e4f" /></Sphere><Sphere args={[0.02]} position={[0.04, -0.05, 0.43]}><meshStandardMaterial color="#880e4f" /></Sphere></>)}
                {type === 'chicken' && (<><Box args={[0.05, 0.1, 0.2]} position={[0, 0.4, 0]}><meshStandardMaterial color="#d32f2f" /></Box><Sphere args={[0.06]} position={[0, 0.45, 0.1]}><meshStandardMaterial color="#d32f2f" /></Sphere><Sphere args={[0.05]} position={[0, 0.42, -0.1]}><meshStandardMaterial color="#d32f2f" /></Sphere><Cone args={[0.08, 0.15, 4]} position={[0, -0.05, 0.4]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#ffeb3b" /></Cone><Sphere args={[0.04]} position={[0, -0.15, 0.35]}><meshStandardMaterial color="#d32f2f" /></Sphere></>)}
                {type === 'elephant' && (<><Cylinder args={[0.25, 0.3, 0.1]} position={[-0.35, 0.1, 0]} rotation={[0, 0, 0.5]}><meshStandardMaterial color={skin} /></Cylinder><Cylinder args={[0.25, 0.3, 0.1]} position={[0.35, 0.1, 0]} rotation={[0, 0, -0.5]}><meshStandardMaterial color={skin} /></Cylinder><group position={[0, -0.1, 0.3]}><Cylinder args={[0.06, 0.04, 0.4]} rotation={[0.5, 0, 0]} position={[0, -0.1, 0.1]}><meshStandardMaterial color={skin} /></Cylinder></group></>)}
                {type === 'sheep' && (<><Sphere args={[0.15]} position={[-0.2, 0.2, -0.1]}><meshStandardMaterial color="#fff" /></Sphere><Sphere args={[0.15]} position={[0.2, 0.2, -0.1]}><meshStandardMaterial color="#fff" /></Sphere><Sphere args={[0.15]} position={[0, 0.3, 0]}><meshStandardMaterial color="#fff" /></Sphere><Sphere args={[0.39, 32, 32]} scale={[1, 0.9, 1]}><meshStandardMaterial color="#1a1a1a" /></Sphere></>)}
                {type === 'penguin' && (<><Sphere args={[0.39]} scale={[1, 0.95, 1]}><meshStandardMaterial color="#1a1a1a" /></Sphere><Sphere args={[0.3]} position={[0, -0.05, 0.1]} scale={[0.8, 0.9, 0.5]}><meshStandardMaterial color="#fff" /></Sphere><Cone args={[0.08, 0.15, 4]} position={[0, -0.05, 0.35]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#ffa726" /></Cone></>)}
                {type === 'duck' && (<><Box args={[0.3, 0.1, 0.4]} position={[0, -0.15, 0.2]}><meshStandardMaterial color="#ffeb3b" /></Box><Cone args={[0.1, 0.2, 4]} position={[0, -0.1, 0.45]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#ff9800" /></Cone><Sphere args={[0.1]} position={[0, 0.35, 0]}><meshStandardMaterial color="#ffeb3b" /></Sphere></>)}
                {type === 'zebra' && (<><Cone args={[0.12, 0.3, 4]} position={[-0.2, 0.35, 0]} rotation={[0, 0, 0.3]}><meshStandardMaterial color="#fff" /></Cone><Cone args={[0.12, 0.3, 4]} position={[0.2, 0.35, 0]} rotation={[0, 0, -0.3]}><meshStandardMaterial color="#fff" /></Cone><RoundedBox args={[0.1, 0.4, 0.2]} radius={0.02} position={[0, 0.2, -0.15]}><meshStandardMaterial color="#333" /></RoundedBox><Box args={[0.3, 0.15, 0.35]} position={[0, -0.1, 0.2]}><meshStandardMaterial color="#fff" /></Box><Sphere args={[0.05]} position={[0, -0.2, 0.4]}><meshStandardMaterial color="#111" /></Sphere></>)}
                {type === 'mouse' && (<><Sphere args={[0.2]} position={[-0.3, 0.3, 0]} scale={[1, 1, 0.2]}><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.2]} position={[0.3, 0.3, 0]} scale={[1, 1, 0.2]}><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.06]} position={[0, -0.1, 0.35]}><meshStandardMaterial color="#333" /></Sphere></>)}
                {type === 'cow' && (<><Cone args={[0.08, 0.2, 8]} position={[-0.2, 0.4, 0]} rotation={[0, 0, 0.3]}><meshStandardMaterial color="#eee" /></Cone><Cone args={[0.08, 0.2, 8]} position={[0.2, 0.4, 0]} rotation={[0, 0, -0.3]}><meshStandardMaterial color="#eee" /></Cone><Sphere args={[0.2]} position={[-0.25, 0.2, 0]}><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.2]} position={[0.25, 0.2, 0]}><meshStandardMaterial color={skin} /></Sphere><RoundedBox args={[0.3, 0.15, 0.1]} radius={0.02} position={[0, -0.15, 0.3]}><meshStandardMaterial color="#FFC0CB" /></RoundedBox></>)}
                {type === 'frog' && (<><Sphere args={[0.15]} position={[-0.2, 0.35, 0]}><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.15]} position={[0.2, 0.35, 0]}><meshStandardMaterial color={skin} /></Sphere><RoundedBox args={[0.4, 0.1, 0.1]} radius={0.05} position={[0, -0.1, 0.3]}><meshStandardMaterial color="#8bc34a" /></RoundedBox></>)}
                {type === 'monkey' && (<><Sphere args={[0.15]} position={[-0.35, 0.1, 0]}><meshStandardMaterial color={skin} /></Sphere><Sphere args={[0.15]} position={[0.35, 0.1, 0]}><meshStandardMaterial color={skin} /></Sphere><RoundedBox args={[0.25, 0.15, 0.1]} radius={0.05} position={[0, -0.1, 0.35]}><meshStandardMaterial color="#d7ccc8" /></RoundedBox></>)}
                {type === 'tiger' && (<><Cone args={[0.12, 0.2, 4]} position={[-0.25, 0.35, 0]} rotation={[0, 0, 0.3]}><meshStandardMaterial color={skin} /></Cone><Cone args={[0.12, 0.2, 4]} position={[0.25, 0.35, 0]} rotation={[0, 0, -0.3]}><meshStandardMaterial color={skin} /></Cone><RoundedBox args={[0.2, 0.15, 0.15]} radius={0.05} position={[0, -0.1, 0.35]}><meshStandardMaterial color="#fff" /></RoundedBox><Sphere args={[0.06]} position={[0, -0.15, 0.42]}><meshStandardMaterial color="#111" /></Sphere><Torus args={[0.35, 0.02, 8, 16]} position={[0, 0.1, 0.01]}><meshStandardMaterial color="#111" /></Torus></>)}

                {/* 5 NEW ANIMALS */}
                {type === 'raccoon' && (<><Box args={[0.3, 0.1, 0.1]} position={[0, 0, 0.28]}><meshStandardMaterial color="#333" /></Box><Cone args={[0.1, 0.2, 4]} position={[-0.2, 0.35, 0]} rotation={[0, 0, 0.3]}><meshStandardMaterial color="#555" /></Cone><Cone args={[0.1, 0.2, 4]} position={[0.2, 0.35, 0]} rotation={[0, 0, -0.3]}><meshStandardMaterial color="#555" /></Cone><Cylinder args={[0.05, 0.02, 0.4]} position={[0, -0.2, -0.25]} rotation={[0.5, 0, 0]}><meshStandardMaterial color="#555" /></Cylinder></>)}
                {type === 'deer' && (<><Cylinder args={[0.02, 0.02, 0.3]} position={[-0.2, 0.5, 0]} rotation={[0, 0, 0.3]}><meshStandardMaterial color="#5d4037" /></Cylinder><Cylinder args={[0.02, 0.02, 0.3]} position={[0.2, 0.5, 0]} rotation={[0, 0, -0.3]}><meshStandardMaterial color="#5d4037" /></Cylinder><Cone args={[0.1, 0.25, 4]} position={[-0.25, 0.3, 0]} rotation={[0, 0, 0.5]}><meshStandardMaterial color={skin} /></Cone><Cone args={[0.1, 0.25, 4]} position={[0.25, 0.3, 0]} rotation={[0, 0, -0.5]}><meshStandardMaterial color={skin} /></Cone><RoundedBox args={[0.15, 0.1, 0.2]} position={[0, -0.1, 0.35]} radius={0.05}><meshStandardMaterial color="#333" /></RoundedBox></>)}
                {type === 'hedgehog' && (<><group position={[0, 0, -0.15]}><Cone args={[0.4, 0.4, 32]} rotation={[-0.2, 0, 0]}><meshStandardMaterial color="#5d4037" /></Cone></group><Sphere args={[0.05]} position={[0, -0.1, 0.38]}><meshStandardMaterial color="#333" /></Sphere></>)}
                {type === 'beaver' && (<><RoundedBox args={[0.25, 0.05, 0.4]} radius={0.02} position={[0, -0.2, -0.25]} rotation={[0.4, 0, 0]}><meshStandardMaterial color="#3e2723" /></RoundedBox><Box args={[0.08, 0.08, 0.02]} position={[0, -0.15, 0.36]}><meshStandardMaterial color="#fff" /></Box><Sphere args={[0.05]} position={[0, -0.2, 0.38]}><meshStandardMaterial color="#111" /></Sphere><Cone args={[0.08, 0.15, 4]} position={[-0.2, 0.35, 0]} rotation={[0, 0, 0.3]}><meshStandardMaterial color={skin} /></Cone><Cone args={[0.08, 0.15, 4]} position={[0.2, 0.35, 0]} rotation={[0, 0, -0.3]}><meshStandardMaterial color={skin} /></Cone></>)}
                {type === 'platypus' && (<><RoundedBox args={[0.2, 0.05, 0.3]} radius={0.02} position={[0, -0.12, 0.4]}><meshStandardMaterial color="#ff9800" /></RoundedBox><RoundedBox args={[0.25, 0.05, 0.4]} radius={0.02} position={[0, -0.2, -0.2]} rotation={[0.2, 0, 0]}><meshStandardMaterial color="#5d4037" /></RoundedBox></>)}

                <group position={[0, 0, 0.32]}>
                    {/* Eyes override */}
                    {type !== 'panda' && type !== 'sheep' && type !== 'penguin' && type !== 'frog' && (<group ref={eyesGroup}><Sphere args={[0.045]} position={[-0.11, 0.05, 0.02]} castShadow><meshStandardMaterial color="#1a1a1a" roughness={0.2} /></Sphere><Sphere args={[0.045]} position={[0.11, 0.05, 0.02]} castShadow><meshStandardMaterial color="#1a1a1a" roughness={0.2} /></Sphere></group>)}
                    {type === 'sheep' && (<group ref={eyesGroup}><Sphere args={[0.045]} position={[-0.11, 0.05, 0.02]} castShadow><meshStandardMaterial color="#fff" roughness={0.2} /></Sphere><Sphere args={[0.045]} position={[0.11, 0.05, 0.02]} castShadow><meshStandardMaterial color="#fff" roughness={0.2} /></Sphere></group>)}
                    {type === 'penguin' && (<group ref={eyesGroup}><Sphere args={[0.045]} position={[-0.11, 0.1, 0.02]} castShadow><meshStandardMaterial color="#fff" roughness={0.2} /><Sphere args={[0.02]} position={[0, 0, 0.04]}><meshStandardMaterial color="black" /></Sphere></Sphere><Sphere args={[0.045]} position={[0.11, 0.1, 0.02]} castShadow><meshStandardMaterial color="#fff" roughness={0.2} /><Sphere args={[0.02]} position={[0, 0, 0.04]}><meshStandardMaterial color="black" /></Sphere></Sphere></group>)}
                    {type === 'frog' && (<group ref={eyesGroup}><Sphere args={[0.06]} position={[-0.2, 0.38, 0.12]} castShadow><meshStandardMaterial color="#fff" /><Sphere args={[0.02]} position={[0, 0, 0.05]}><meshStandardMaterial color="black" /></Sphere></Sphere><Sphere args={[0.06]} position={[0.2, 0.38, 0.12]} castShadow><meshStandardMaterial color="#fff" /><Sphere args={[0.02]} position={[0, 0, 0.05]}><meshStandardMaterial color="black" /></Sphere></Sphere></group>)}

                    {!['fox', 'dog', 'koala', 'pig', 'chicken', 'elephant', 'duck', 'mouse', 'monkey', 'tiger', 'raccoon', 'deer', 'hedgehog', 'beaver', 'platypus'].includes(type) && (<RoundedBox args={[0.08, 0.06, 0.05]} radius={0.02} position={[0, -0.06, 0.04]} castShadow><meshStandardMaterial color="#5c4033" /></RoundedBox>)}
                    <Sphere args={[0.07]} position={[-0.22, -0.1, 0]} scale={[1, 0.6, 0.5]}><meshStandardMaterial color="#ff8fa3" transparent opacity={0.5} /></Sphere><Sphere args={[0.07]} position={[0.22, -0.1, 0]} scale={[1, 0.6, 0.5]}><meshStandardMaterial color="#ff8fa3" transparent opacity={0.5} /></Sphere>
                </group>

                {accessory === 'hat' && (<group position={[0, 0.3, 0]}><Cylinder args={[0.4, 0.4, 0.1]} position={[0, 0, 0]}><meshStandardMaterial color="#3e2723" /></Cylinder><Cylinder args={[0.25, 0.25, 0.3]} position={[0, 0.2, 0]}><meshStandardMaterial color="#3e2723" /></Cylinder><Box args={[0.5, 0.05, 0.05]} position={[0, 0.05, 0.25]}><meshStandardMaterial color="#d84315" /></Box></group>)}
                {accessory === 'glasses' && (<group position={[0, 0.05, 0.35]}><Torus args={[0.08, 0.015, 8, 16]} position={[-0.11, 0, 0]}><meshStandardMaterial color="black" /></Torus><Torus args={[0.08, 0.015, 8, 16]} position={[0.11, 0, 0]}><meshStandardMaterial color="black" /></Torus><Box args={[0.05, 0.01, 0.01]} position={[0, 0, 0]}><meshStandardMaterial color="black" /></Box></group>)}

                {/* NUEVOS ACCESORIOS ARGENTINOS */}
                {/* Boina Gaucha - tradicional argentina */}
                {accessory === 'boina' && (
                  <group position={[0, 0.32, 0]}>
                    <Cylinder args={[0.35, 0.32, 0.08]} position={[0, 0, 0]}><meshStandardMaterial color="#1a1a1a" /></Cylinder>
                    <Sphere args={[0.36]} position={[0, 0.02, 0]} scale={[1, 0.15, 1]}><meshStandardMaterial color="#1a1a1a" /></Sphere>
                    <Sphere args={[0.03]} position={[0, 0.1, 0]}><meshStandardMaterial color="#1a1a1a" /></Sphere>
                  </group>
                )}

                {/* Gorra Argentina - celeste y blanca */}
                {accessory === 'gorraArgentina' && (
                  <group position={[0, 0.32, 0.05]}>
                    <Cylinder args={[0.28, 0.30, 0.12]} position={[0, 0, 0]}><meshStandardMaterial color="#75AADB" /></Cylinder>
                    <Box args={[0.28, 0.02, 0.25]} position={[0, -0.02, 0.22]} rotation={[-0.3, 0, 0]}><meshStandardMaterial color="#75AADB" /></Box>
                    {/* Franjas blancas */}
                    <Cylinder args={[0.29, 0.31, 0.03]} position={[0, 0.03, 0]}><meshStandardMaterial color="white" /></Cylinder>
                  </group>
                )}

                {/* Banderín Argentina */}
                {accessory === 'banderin' && (
                  <group position={[0.3, 0.4, -0.1]} rotation={[0, 0, 0.3]}>
                    <Cylinder args={[0.015, 0.015, 0.5, 8]}><meshStandardMaterial color="#8B4513" /></Cylinder>
                    <group position={[0, 0.15, 0.08]} rotation={[0, 0, 0]}>
                      <Box args={[0.02, 0.2, 0.15]}><meshStandardMaterial color="#75AADB" /></Box>
                      <Box args={[0.021, 0.06, 0.15]} position={[0, 0, 0]}><meshStandardMaterial color="white" /></Box>
                    </group>
                  </group>
                )}
            </group>

            {/* Torso - usa camiseta argentina si está seleccionada */}
            {accessory === 'camisetaArg' ? (
              <group position={[0, 0.45, 0]}>
                {/* Cuerpo base celeste */}
                <RoundedBox args={[0.32, 0.45, 0.25]} radius={0.08} castShadow>
                  <meshStandardMaterial color="#75AADB" />
                </RoundedBox>
                {/* Franjas blancas verticales */}
                <Box args={[0.06, 0.46, 0.26]} position={[-0.09, 0, 0]}><meshStandardMaterial color="white" /></Box>
                <Box args={[0.06, 0.46, 0.26]} position={[0.09, 0, 0]}><meshStandardMaterial color="white" /></Box>
                {/* Cuello */}
                <Box args={[0.33, 0.05, 0.26]} position={[0, 0.2, 0]}><meshStandardMaterial color="#75AADB" /></Box>
              </group>
            ) : (
              <>
                <RoundedBox args={[0.32, 0.45, 0.25]} radius={0.08} position={[0, 0.45, 0]} castShadow><meshStandardMaterial color={shirt} /></RoundedBox>
                <Box args={[0.33, 0.05, 0.26]} position={[0, 0.65, 0]} receiveShadow><meshStandardMaterial color="#ffffff" /></Box>
              </>
            )}

            {accessory === 'backpack' && (<group ref={backpackGroup} position={[0, 0.35, -0.15]}><RoundedBox args={[0.25, 0.3, 0.12]} radius={0.05} castShadow><meshStandardMaterial color="#8d6e63" /></RoundedBox><Box args={[0.26, 0.1, 0.13]} position={[0, -0.05, 0]}><meshStandardMaterial color="#6d4c41" /></Box><Cylinder args={[0.06, 0.06, 0.24, 8]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.2, 0]}><meshStandardMaterial color="#ff7043" /></Cylinder></group>)}
            {accessory === 'scarf' && (<Torus args={[0.22, 0.06, 8, 16]} position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#d81b60" /></Torus>)}

            <group ref={leftArm} position={[-0.24, 0.58, 0]}>
              <group position={[0, -0.15, 0]}>
                <Capsule args={[0.06, 0.28, 4, 8]} castShadow><meshStandardMaterial color={accessory === 'camisetaArg' ? '#75AADB' : shirt} /></Capsule>
                <Sphere args={[0.07]} position={[0, -0.18, 0]}><meshStandardMaterial color={skin} /></Sphere>
                {/* Mate en mano izquierda */}
                {accessory === 'mate' && (
                  <group position={[0, -0.25, 0.05]} rotation={[0.5, 0, 0]}>
                    <Cylinder args={[0.05, 0.04, 0.12]}><meshStandardMaterial color="#5d4037" /></Cylinder>
                    <Box args={[0.01, 0.15, 0.01]} position={[0.02, 0.08, 0.02]} rotation={[0.2, 0, -0.2]}><meshStandardMaterial color="#C0C0C0" /></Box>
                  </group>
                )}
                {/* Termo en mano izquierda */}
                {accessory === 'termo' && (
                  <group position={[0, -0.22, 0.05]} rotation={[0.3, 0, 0]}>
                    <Cylinder args={[0.04, 0.04, 0.22]}><meshStandardMaterial color="#228B22" /></Cylinder>
                    <Cylinder args={[0.035, 0.035, 0.03]} position={[0, 0.12, 0]}><meshStandardMaterial color="#1a1a1a" /></Cylinder>
                    <Cylinder args={[0.02, 0.025, 0.04]} position={[0, 0.15, 0]}><meshStandardMaterial color="#333" /></Cylinder>
                  </group>
                )}
              </group>
            </group>
            <group ref={rightArm} position={[0.24, 0.58, 0]}>
              <group position={[0, -0.15, 0]}>
                <Capsule args={[0.06, 0.28, 4, 8]} castShadow><meshStandardMaterial color={accessory === 'camisetaArg' ? '#75AADB' : shirt} /></Capsule>
                <Sphere args={[0.07]} position={[0, -0.18, 0]}><meshStandardMaterial color={skin} /></Sphere>
                {/* Teléfono en mano derecha */}
                {accessory === 'phone' && (
                  <group position={[0, -0.2, 0.05]} rotation={[0.5, 0, 0]}>
                    <Box args={[0.08, 0.14, 0.01]}><meshStandardMaterial color="#333" /></Box>
                    <Box args={[0.07, 0.12, 0.011]} position={[0, 0.01, 0]}><meshStandardMaterial color="#81d4fa" emissive="#81d4fa" emissiveIntensity={0.5} /></Box>
                  </group>
                )}
                {/* Alfajor en mano derecha */}
                {accessory === 'alfajor' && (
                  <group position={[0, -0.2, 0.05]} rotation={[0.8, 0, 0]}>
                    <Cylinder args={[0.045, 0.045, 0.03]}><meshStandardMaterial color="#5d4037" /></Cylinder>
                    <Cylinder args={[0.048, 0.048, 0.008]} position={[0, 0.015, 0]}><meshStandardMaterial color="#3e2723" /></Cylinder>
                    <Cylinder args={[0.048, 0.048, 0.008]} position={[0, -0.015, 0]}><meshStandardMaterial color="#3e2723" /></Cylinder>
                    {/* Dulce de leche */}
                    <Cylinder args={[0.04, 0.04, 0.01]} position={[0, 0, 0]}><meshStandardMaterial color="#d4a574" /></Cylinder>
                  </group>
                )}
              </group>
            </group>

            <group ref={leftLeg} position={[-0.1, 0.25, 0]}><Cylinder args={[0.075, 0.06, 0.3]} position={[0, -0.15, 0]} castShadow><meshStandardMaterial color={pants} /></Cylinder><RoundedBox args={[0.1, 0.08, 0.18]} radius={0.02} position={[0, -0.3, 0.04]} castShadow><meshStandardMaterial color="#3e2723" /></RoundedBox></group>
            <group ref={rightLeg} position={[0.1, 0.25, 0]}><Cylinder args={[0.075, 0.06, 0.3]} position={[0, -0.15, 0]} castShadow><meshStandardMaterial color={pants} /></Cylinder><RoundedBox args={[0.1, 0.08, 0.18]} radius={0.02} position={[0, -0.3, 0.04]} castShadow><meshStandardMaterial color="#3e2723" /></RoundedBox></group>
        </group>
    );
};
