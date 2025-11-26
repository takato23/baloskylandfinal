import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DirectionalLight, Color, Fog, Mesh, AdditiveBlending, DoubleSide, Vector3, InstancedMesh, Object3D, MathUtils, Quaternion, Euler, OrthographicCamera } from 'three';
import { Stars } from '@react-three/drei';
import { useGameStore } from '../store';
import { QUALITY_PRESETS } from '../utils/performance';
import { playSound } from '../utils/audio';

const CYCLE_DURATION = 300; // 5 minutes per full day/night cycle
const SUN_DISTANCE = 100;

// Cloud system with fluffy grouped spheres
const Clouds: React.FC = () => {
    const mesh = useRef<InstancedMesh>(null);
    const dummy = useMemo(() => new Object3D(), []);
    const qualityLevel = useGameStore(s => s.qualityLevel);
    const quality = QUALITY_PRESETS[qualityLevel];
    const cloudCount = Math.floor(10 * quality.weatherDensity);

    // Each cloud is made of multiple spheres
    const clouds = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 12; i++) {
            temp.push({
                pos: new Vector3(
                    (Math.random() - 0.5) * 80,
                    15 + Math.random() * 10,
                    (Math.random() - 0.5) * 80
                ),
                drift: (Math.random() - 0.5) * 0.3,
                size: 0.8 + Math.random() * 0.4,
                offset: Math.random() * Math.PI * 2
            });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!mesh.current) return;

        // Frame skipping for mobile optimization
        if (qualityLevel === 'mobile') {
            if (Math.floor(state.clock.elapsedTime * 30) % 2 !== 0) return;
        }

        const playerPos = useGameStore.getState().playerPosition;

        clouds.forEach((cloud, i) => {
            if (i >= cloudCount) {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
                return;
            }

            // Slow horizontal drift
            cloud.pos.x += cloud.drift * delta;
            cloud.pos.z += cloud.drift * 0.3 * delta;

            // Keep clouds near player
            const dx = cloud.pos.x - playerPos[0];
            const dz = cloud.pos.z - playerPos[2];
            if (Math.abs(dx) > 50) cloud.pos.x = playerPos[0] + (Math.random() - 0.5) * 60;
            if (Math.abs(dz) > 50) cloud.pos.z = playerPos[2] + (Math.random() - 0.5) * 60;

            // Gentle bobbing
            cloud.pos.y = 18 + Math.sin(state.clock.elapsedTime * 0.3 + cloud.offset) * 0.5;

            dummy.position.copy(cloud.pos);
            dummy.scale.set(cloud.size * 3, cloud.size * 1.5, cloud.size * 2);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, 12]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </instancedMesh>
    );
};

// Simple birds with wing flapping
const Birds: React.FC = () => {
    const groupRef = useRef<InstancedMesh>(null);
    const dummy = useMemo(() => new Object3D(), []);
    const qualityLevel = useGameStore(s => s.qualityLevel);
    const quality = QUALITY_PRESETS[qualityLevel];
    const isNight = useGameStore(s => s.isNight);
    const birdCount = Math.floor(4 * quality.weatherDensity);

    const birds = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            temp.push({
                pos: new Vector3(
                    Math.cos(angle) * 15,
                    12 + Math.random() * 8,
                    Math.sin(angle) * 15
                ),
                angle: angle,
                speed: 0.3 + Math.random() * 0.2,
                radius: 12 + Math.random() * 8,
                height: 12 + Math.random() * 6,
                flapPhase: Math.random() * Math.PI * 2
            });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current || isNight) return;

        // Frame skipping for mobile optimization
        if (qualityLevel === 'mobile') {
            if (Math.floor(state.clock.elapsedTime * 30) % 2 !== 0) return;
        }

        const playerPos = useGameStore.getState().playerPosition;

        birds.forEach((bird, i) => {
            if (i >= birdCount) {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                groupRef.current!.setMatrixAt(i, dummy.matrix);
                return;
            }

            // Circle around player
            bird.angle += bird.speed * delta;
            bird.pos.x = playerPos[0] + Math.cos(bird.angle) * bird.radius;
            bird.pos.z = playerPos[2] + Math.sin(bird.angle) * bird.radius;
            bird.pos.y = bird.height + Math.sin(state.clock.elapsedTime + bird.flapPhase) * 1.5;

            dummy.position.copy(bird.pos);
            dummy.rotation.y = bird.angle + Math.PI / 2;

            // Wing flap effect (scale on X axis)
            const flap = Math.abs(Math.sin(state.clock.elapsedTime * 8 + bird.flapPhase));
            dummy.scale.set(0.8 + flap * 0.4, 0.4, 0.6);

            dummy.updateMatrix();
            groupRef.current!.setMatrixAt(i, dummy.matrix);
        });
        groupRef.current.instanceMatrix.needsUpdate = true;
    });

    if (isNight) return null;

    return (
        <instancedMesh ref={groupRef} args={[undefined, undefined, 5]} frustumCulled={false}>
            <coneGeometry args={[0.3, 0.8, 4]} />
            <meshBasicMaterial color="#2d2d2d" />
        </instancedMesh>
    );
};

// Butterflies near flowers
const Butterflies: React.FC = () => {
    const qualityLevel = useGameStore(s => s.qualityLevel);

    // Skip butterflies entirely on mobile for performance
    if (qualityLevel === 'mobile') return null;

    const groupRef = useRef<InstancedMesh>(null);
    const dummy = useMemo(() => new Object3D(), []);
    const quality = QUALITY_PRESETS[qualityLevel];
    const isNight = useGameStore(s => s.isNight);
    const butterflyCount = Math.floor(6 * quality.weatherDensity);

    const butterflies = useMemo(() => {
        const colors = ['#ff69b4', '#ffd700', '#87ceeb', '#ff8c69', '#9370db'];
        const temp = [];
        for (let i = 0; i < 8; i++) {
            temp.push({
                pos: new Vector3(
                    (Math.random() - 0.5) * 30,
                    1.5 + Math.random() * 2,
                    (Math.random() - 0.5) * 30
                ),
                vel: new Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 2
                ),
                color: colors[Math.floor(Math.random() * colors.length)],
                phase: Math.random() * Math.PI * 2
            });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current || isNight) return;

        // Frame skipping for mobile optimization
        if (qualityLevel === 'mobile') {
            if (Math.floor(state.clock.elapsedTime * 30) % 2 !== 0) return;
        }

        const playerPos = useGameStore.getState().playerPosition;

        butterflies.forEach((butterfly, i) => {
            if (i >= butterflyCount) {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                groupRef.current!.setMatrixAt(i, dummy.matrix);
                return;
            }

            // Erratic but smooth movement
            butterfly.pos.add(butterfly.vel.clone().multiplyScalar(delta));

            // Random direction changes
            if (Math.random() < 0.02) {
                butterfly.vel.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 2
                );
            }

            // Keep near player and above ground
            const dx = butterfly.pos.x - playerPos[0];
            const dz = butterfly.pos.z - playerPos[2];
            if (Math.abs(dx) > 20) butterfly.pos.x = playerPos[0] + (Math.random() - 0.5) * 30;
            if (Math.abs(dz) > 20) butterfly.pos.z = playerPos[2] + (Math.random() - 0.5) * 30;
            if (butterfly.pos.y < 1) butterfly.pos.y = 1.5;
            if (butterfly.pos.y > 4) butterfly.pos.y = 3.5;

            // Bobbing motion
            butterfly.pos.y = 2 + Math.sin(state.clock.elapsedTime * 2 + butterfly.phase) * 0.8;

            dummy.position.copy(butterfly.pos);

            // Wing flap (scale on Z axis)
            const flap = Math.sin(state.clock.elapsedTime * 12 + butterfly.phase);
            dummy.scale.set(0.15, 0.05, 0.2 + flap * 0.15);
            dummy.rotation.y = Math.atan2(butterfly.vel.z, butterfly.vel.x);

            dummy.updateMatrix();
            groupRef.current!.setMatrixAt(i, dummy.matrix);
        });
        groupRef.current.instanceMatrix.needsUpdate = true;
    });

    if (isNight) return null;

    return (
        <instancedMesh ref={groupRef} args={[undefined, undefined, 8]} frustumCulled={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color="#ff69b4" transparent opacity={0.7} side={DoubleSide} />
        </instancedMesh>
    );
};

// Falling leaves with autumn colors
const FallingLeaves: React.FC = () => {
    const qualityLevel = useGameStore(s => s.qualityLevel);

    // Skip falling leaves entirely on mobile for performance
    if (qualityLevel === 'mobile') return null;

    const mesh = useRef<InstancedMesh>(null);
    const dummy = useMemo(() => new Object3D(), []);
    const quality = QUALITY_PRESETS[qualityLevel];
    const isNight = useGameStore(s => s.isNight);
    const leafCount = Math.floor(15 * quality.weatherDensity);

    const leaves = useMemo(() => {
        const colors = ['#ff6b35', '#f7931e', '#c1272d', '#8b4513', '#daa520'];
        const temp = [];
        for (let i = 0; i < 20; i++) {
            temp.push({
                pos: new Vector3(
                    (Math.random() - 0.5) * 40,
                    8 + Math.random() * 12,
                    (Math.random() - 0.5) * 40
                ),
                vel: Math.random() * 0.3 + 0.2,
                rotation: new Euler(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                ),
                rotSpeed: new Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ),
                color: colors[Math.floor(Math.random() * colors.length)],
                swayPhase: Math.random() * Math.PI * 2
            });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!mesh.current) return;

        // Frame skipping for mobile optimization
        if (qualityLevel === 'mobile') {
            if (Math.floor(state.clock.elapsedTime * 30) % 2 !== 0) return;
        }

        const playerPos = useGameStore.getState().playerPosition;

        leaves.forEach((leaf, i) => {
            if (i >= leafCount) {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
                return;
            }

            // Falling with sway
            leaf.pos.y -= leaf.vel * delta;
            leaf.pos.x += Math.sin(state.clock.elapsedTime * 2 + leaf.swayPhase) * 0.5 * delta;
            leaf.pos.z += Math.cos(state.clock.elapsedTime * 1.5 + leaf.swayPhase) * 0.5 * delta;

            // Spinning
            leaf.rotation.x += leaf.rotSpeed.x * delta;
            leaf.rotation.y += leaf.rotSpeed.y * delta;
            leaf.rotation.z += leaf.rotSpeed.z * delta;

            // Reset if hit ground
            if (leaf.pos.y < 0.5) {
                leaf.pos.y = 15 + Math.random() * 5;
                leaf.pos.x = playerPos[0] + (Math.random() - 0.5) * 40;
                leaf.pos.z = playerPos[2] + (Math.random() - 0.5) * 40;
            }

            // Keep near player
            const dx = leaf.pos.x - playerPos[0];
            const dz = leaf.pos.z - playerPos[2];
            if (Math.abs(dx) > 25) leaf.pos.x = playerPos[0] - (dx > 0 ? 24 : -24);
            if (Math.abs(dz) > 25) leaf.pos.z = playerPos[2] - (dz > 0 ? 24 : -24);

            dummy.position.copy(leaf.pos);
            dummy.rotation.copy(leaf.rotation);
            dummy.scale.set(0.2, 0.02, 0.15);

            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    // Only show during certain times (optional - show always for now)
    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, 20]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#ff6b35" transparent opacity={0.8} />
        </instancedMesh>
    );
};

// Weather Particle System
const Weather: React.FC = () => {
    const weather = useGameStore(s => s.weather);
    const qualityLevel = useGameStore(s => s.qualityLevel);
    const quality = QUALITY_PRESETS[qualityLevel];
    const { camera } = useThree();
    const mesh = useRef<InstancedMesh>(null);
    const dummy = useMemo(() => new Object3D(), []);
    const baseCount = weather === 'rain' ? 900 : (weather === 'snow' ? 520 : 0);
    const count = Math.floor(baseCount * quality.weatherDensity);
    const tempVec = useMemo(() => new Vector3(), []);
    
    // Particles state
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 1200; i++) {
            temp.push({
                pos: new Vector3((Math.random() - 0.5) * 50, Math.random() * 30, (Math.random() - 0.5) * 50),
                vel: Math.random() * 0.5 + 0.5,
                offset: Math.random() * 100
            });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (!mesh.current || weather === 'sunny') return;

        // Frame skipping for mobile optimization
        if (qualityLevel === 'mobile') {
            if (Math.floor(state.clock.elapsedTime * 30) % 2 !== 0) return;
        }

        const playerPos = useGameStore.getState().playerPosition;
        tempVec.set(playerPos[0], playerPos[1], playerPos[2]);
        mesh.current.visible = camera.position.distanceTo(tempVec) < 35;
        if (!mesh.current.visible) return;

        particles.forEach((p, i) => {
            if (i >= count) {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
                return;
            }

            if (weather === 'rain') {
                p.pos.y -= (15 + p.vel * 5) * delta; // Fast fall
                // Slight wind drift
                p.pos.x += Math.sin(state.clock.elapsedTime * 0.5) * 0.1 * delta;
            } else {
                // Snow with pronounced swaying
                p.pos.y -= (2 + p.vel) * delta; // Slow fall
                p.pos.x += Math.sin(state.clock.elapsedTime * 2 + p.offset) * 0.3 * delta;
                p.pos.z += Math.cos(state.clock.elapsedTime * 1.5 + p.offset) * 0.2 * delta;
            }

            // Reset if below ground or too far
            if (p.pos.y < 0) {
                p.pos.y = 25 + Math.random() * 5;
                p.pos.x = (Math.random() - 0.5) * 50 + playerPos[0];
                p.pos.z = (Math.random() - 0.5) * 50 + playerPos[2];
            }

            // Keep mostly centered around player for performance
            const dx = p.pos.x - playerPos[0];
            const dz = p.pos.z - playerPos[2];
            if (Math.abs(dx) > 30) p.pos.x = playerPos[0] - (dx > 0 ? 29 : -29);
            if (Math.abs(dz) > 30) p.pos.z = playerPos[2] - (dz > 0 ? 29 : -29);

            dummy.position.copy(p.pos);

            if (weather === 'rain') {
                // Stylized rain drops - longer streaks
                dummy.scale.set(0.04, 1.2, 0.04);
                dummy.rotation.set(0.1, 0, 0.05);
            } else {
                // Larger, more visible snowflakes
                dummy.scale.set(0.15, 0.15, 0.15);
                // Gentle rotation as they fall
                dummy.rotation.set(
                    state.clock.elapsedTime * 0.5 + p.offset,
                    state.clock.elapsedTime * 0.3 + p.offset,
                    state.clock.elapsedTime * 0.4 + p.offset
                );
            }

            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    if (weather === 'sunny') return null;

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, 1200]} frustumCulled={false}>
            {weather === 'rain' ? (
                <cylinderGeometry args={[0.5, 0.5, 1, 4]} />
            ) : (
                <octahedronGeometry args={[1, 0]} />
            )}
            <meshBasicMaterial
                color={weather === 'rain' ? "#c4d7e8" : "#f0f8ff"}
                transparent
                opacity={weather === 'rain' ? 0.5 : 0.85}
            />
        </instancedMesh>
    );
};

// Fake Volumetric Sun Shafts
const SunShafts: React.FC<{ sunPosition: [number, number, number], opacity: number }> = ({ sunPosition, opacity }) => {
    const qualityLevel = useGameStore(s => s.qualityLevel);

    // Skip sun shafts entirely on mobile for performance
    if (qualityLevel === 'mobile') return null;

    const groupRef = useRef<Mesh>(null);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.lookAt(0, 0, 0);
        }
    });

    if (opacity <= 0.01) return null;

    return (
        <group position={sunPosition}>
            <mesh ref={groupRef} position={[0, 0, -20]}>
                <cylinderGeometry args={[5, 30, 80, 8, 1, true]} />
                <meshBasicMaterial 
                    color="#fff" 
                    transparent 
                    opacity={opacity * 0.15} 
                    blending={AdditiveBlending} 
                    side={DoubleSide} 
                    depthWrite={false} 
                />
            </mesh>
        </group>
    )
}

export const Lights: React.FC = () => {
  const dirLight = useRef<DirectionalLight>(null);
  const { scene, camera } = useThree();
  const setIsNight = useGameStore((state) => state.setIsNight);
  const playerPosition = useGameStore((state) => state.playerPosition);
  const weather = useGameStore((state) => state.weather);
  const setWeather = useGameStore((state) => state.setWeather);
  const qualityLevel = useGameStore((state) => state.qualityLevel);
  const quality = QUALITY_PRESETS[qualityLevel];

  // Toggle golden-hour lock for consistent warm look
  const GOLDEN_MODE = true;
  const goldenAngle = Math.PI * 0.25; // ~45° elev, tarde dorada

  // Apply quality-dependent shadow budget once
  useEffect(() => {
    if (!dirLight.current) return;
    dirLight.current.castShadow = !!quality.shadows;
    dirLight.current.shadow.mapSize.set(quality.directionalShadowMapSize, quality.directionalShadowMapSize);
    dirLight.current.shadow.normalBias = 0.04;
    dirLight.current.shadow.bias = -0.0005;
  }, [quality]);
  
  const sunPositionRef = useRef<[number, number, number]>([0, 50, 0]);
  const shaftOpacity = useRef(0);
  const nextSoundTime = useRef(0);
  const weatherTimer = useRef(0);
  const shadowExtent = useRef(40);
  const tempVec = useMemo(() => new Vector3(), []);
  const tempOffset = useMemo(() => new Vector3(), []);
  
  // Cozy atmospheric colors with anime-style warmth
  const colors = {
    day: {
        bg: new Color('#87CEEB'), // Paleta base cielo
        fog: new Color('#dce9f5'),
        ambient: 0.65,
        directional: 1.1
    },
    rain: {
        bg: new Color('#6b7580'),
        fog: new Color('#c8d0d8'),
        ambient: 0.58,
        directional: 0.45
    },
    snow: {
        bg: new Color('#b8c8d8'),
        fog: new Color('#f0f4f8'),
        ambient: 0.72,
        directional: 0.55
    },
    sunset: {
        bg: new Color('#ffb074'), // golden hour cálido
        fog: new Color('#ffc5a0'),
        ambient: 0.5,
        directional: 0.82
    },
    night: {
        bg: new Color('#1a1d2e'), // Deep blue-purple night sky
        fog: new Color('#252840'),
        ambient: 0.32,
        directional: 0.22
    },
  };

  // Weather Cycle (disabled if golden mode)
  useFrame((state, delta) => {
      if (GOLDEN_MODE) {
          if (weather !== 'sunny') setWeather('sunny');
          return;
      }
      weatherTimer.current += delta;
      // Change weather every ~2 minutes
      if (weatherTimer.current > 120) {
          const r = Math.random();
          if (r < 0.6) setWeather('sunny');
          else if (r < 0.85) setWeather('rain');
          else setWeather('snow');
          weatherTimer.current = 0;
      }
  });

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const nTime = GOLDEN_MODE ? 0.25 : (time % CYCLE_DURATION) / CYCLE_DURATION;
    const angle = GOLDEN_MODE ? goldenAngle : nTime * Math.PI * 2;
    
    const x = Math.cos(angle) * SUN_DISTANCE;
    const y = Math.sin(angle) * SUN_DISTANCE;
    
    sunPositionRef.current = [x, y, 20];

    // Ambient 3D Sounds
    if (time > nextSoundTime.current) {
        const rand = Math.random();
        const soundAngle = Math.random() * Math.PI * 2;
        const soundDist = 5 + Math.random() * 15; 
        const sX = playerPosition[0] + Math.cos(soundAngle) * soundDist;
        const sZ = playerPosition[2] + Math.sin(soundAngle) * soundDist;
        const sY = playerPosition[1] + 2 + Math.random() * 5; 
        const soundPos: [number, number, number] = [sX, sY, sZ];

        if (y > 10) {
            if (rand < 0.5) playSound('bird', soundPos);
            // Car sounds disabled for quieter cozy experience
        } else if (y < -10) {
            if (rand < 0.6) playSound('cricket', soundPos);
            // Car sounds disabled for quieter cozy experience
        }
        nextSoundTime.current = time + 3 + Math.random() * 7;
    }

    if (dirLight.current) {
      dirLight.current.position.set(x, y, 20);
      
      if (y > 0) {
        // Day/Sunset
        const isSunset = y < 30; 
        
        let targetIntensity = isSunset ? 0.85 : 1.15;
        
        // Weather dimming
        if (weather === 'rain') targetIntensity *= 0.5;
        if (weather === 'snow') targetIntensity *= 0.7;

        dirLight.current.intensity = MathUtils.lerp(dirLight.current.intensity, targetIntensity, 0.08);

        const sunColor = new Color();
        if (weather !== 'sunny') {
             sunColor.setHSL(0.12, 0.05, 0.88); // neutral overcast
             shaftOpacity.current = 0;
        } else if(isSunset) {
             sunColor.set('#ffbf86'); // dorado tarde
             shaftOpacity.current = 0.35; 
        } else {
             sunColor.set('#ffd7a3'); // luz cálida suave
             shaftOpacity.current = 0.25; 
        }
        dirLight.current.color.lerp(sunColor, 0.12);
        dirLight.current.castShadow = true;

      } else {
        // Night
        dirLight.current.intensity = 0.22;
        dirLight.current.color.lerp(new Color('#9fb5ff'), 0.15); 
        shaftOpacity.current = 0;
      dirLight.current.castShadow = true;
      }
    }

    // Shadow frustum LOD + texel snapping to minimize shimmering and wasted atlas space
    if (dirLight.current) {
      const light = dirLight.current;
      const shadowCam = light.shadow.camera as OrthographicCamera;

      const camDist = camera.position.distanceTo(tempVec.set(playerPosition[0], camera.position.y, playerPosition[2]));
      const targetExtent = camDist > 40 ? 70 : 40;
      shadowExtent.current = MathUtils.lerp(shadowExtent.current, targetExtent, 0.12);

      shadowCam.left = -shadowExtent.current;
      shadowCam.right = shadowExtent.current;
      shadowCam.top = shadowExtent.current;
      shadowCam.bottom = -shadowExtent.current;
      shadowCam.near = 5;
      shadowCam.far = 120;

      const mapSize = light.shadow.mapSize.x || quality.directionalShadowMapSize;
      const texel = (shadowCam.right - shadowCam.left) / mapSize;

      // Snap target to texel grid in world space and keep light offset stable
      tempOffset.copy(light.position).sub(light.target.position);
      const snappedTargetX = Math.round(playerPosition[0] / texel) * texel;
      const snappedTargetZ = Math.round(playerPosition[2] / texel) * texel;

      light.target.position.set(snappedTargetX, playerPosition[1], snappedTargetZ);
      light.target.updateMatrixWorld();

      light.position.set(snappedTargetX + tempOffset.x, light.position.y, snappedTargetZ + tempOffset.z);

      shadowCam.updateProjectionMatrix();
      shadowCam.updateMatrixWorld();
    }

    // Update Global Night State
    const isNightNow = y < 5; 
    setIsNight(isNightNow);

    // Environment Interpolation
    let targetBg, targetFog;
    let fogNear, fogFar;
    
    if (y > 25) { 
      targetBg = weather === 'sunny' ? colors.day.bg : (weather === 'rain' ? colors.rain.bg : colors.snow.bg);
      targetFog = weather === 'sunny' ? colors.day.fog : (weather === 'rain' ? colors.rain.fog : colors.snow.fog);
      fogNear = weather === 'sunny' ? 28 : 14;
      fogFar = weather === 'sunny' ? 95 : 58;
    } else if (y > -15) { 
      // Sunset override unless raining heavily
      targetBg = weather === 'sunny' ? colors.sunset.bg : colors.rain.bg;
      targetFog = weather === 'sunny' ? colors.sunset.fog : colors.rain.fog;
      fogNear = 18;
      fogFar = 78;
    } else { 
      targetBg = colors.night.bg;
      targetFog = colors.night.fog;
      fogNear = 7;  
      fogFar = 46; 
    }

    if (!scene.background) scene.background = new Color();
    (scene.background as Color).lerp(targetBg, 0.02);
    
    if (!scene.fog) scene.fog = new Fog(targetFog, 10, 50);
    (scene.fog as Fog).color.lerp(targetFog, 0.02);
    
    (scene.fog as Fog).near = MathUtils.lerp((scene.fog as Fog).near, fogNear, 0.01);
    (scene.fog as Fog).far = MathUtils.lerp((scene.fog as Fog).far, fogFar, 0.01);
  });

  return (
    <>
      <hemisphereLight skyColor="#87CEEB" groundColor="#c7b08a" intensity={0.35} />
      <ambientLight intensity={weather === 'sunny' ? 0.45 : 0.55} />
      <directionalLight
        ref={dirLight}
        castShadow
        position={[10, 20, 10]}
        shadow-mapSize={[quality.directionalShadowMapSize, quality.directionalShadowMapSize]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={5}
        shadow-camera-far={120}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <SunShafts sunPosition={sunPositionRef.current} opacity={shaftOpacity.current} />
      <Stars radius={80} depth={40} count={quality.starsCount} factor={3} saturation={0.35} fade speed={0.3} />
      <Weather />
      <Clouds />
      <Birds />
      <Butterflies />
      <FallingLeaves />
    </>
  );
};
