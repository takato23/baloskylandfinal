import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace, VSMShadowMap, PCFSoftShadowMap } from 'three';
import { KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Controls, useGameStore } from './store';
import { Lights } from './components/Lights';
import { World } from './components/World';
import { Player } from './components/Player';
import { UI } from './components/UI';
import { PostEffects } from './components/PostEffects';
import { ExposureController } from './components/ExposureController';
import { PerformanceLogger } from './components/PerformanceLogger';
import { RemotePlayersV2, PlayerSyncV2 } from './components/multiplayer';
import { EventManager } from './components/events';
import { QUALITY_PRESETS, defaultQuality } from './utils/performance';
import { useIsMobile } from './hooks/useIsMobile';

export default function App() {
  // Key mapping for KeyboardControls
  const map = [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.jump, keys: ['Space'] },
    { name: Controls.run, keys: ['Shift'] },
    { name: Controls.interact, keys: ['KeyE', 'Enter'] },
    { name: Controls.horn, keys: ['KeyH'] },
  ];

  const qualityLevel = useGameStore((s) => s.qualityLevel);
  const setQualityLevel = useGameStore((s) => s.setQualityLevel);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const quality = QUALITY_PRESETS[qualityLevel];
  const isMobile = useIsMobile();

  // Auto-pick a sensible default on mount (keeps user overrides intact)
  useEffect(() => {
    if (!qualityLevel) setQualityLevel(defaultQuality());
  }, [qualityLevel, setQualityLevel]);

  return (
    <>
      <KeyboardControls map={map}>
        <Canvas
          shadows={quality.shadows}
          camera={{
            position: [0, 5, 10],
            fov: isMobile ? 55 : 50,  // Wider FOV on mobile = less visible objects
            far: quality.cameraFar,
            near: isMobile ? 0.5 : 0.1  // Further near plane on mobile
          }}
          dpr={quality.dpr}
          gl={{
            antialias: !isMobile,  // Disable antialiasing on mobile
            powerPreference: isMobile ? 'default' : 'high-performance',
            toneMapping: ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: SRGBColorSpace,
            precision: isMobile ? 'mediump' : 'highp',  // Lower precision on mobile
            alpha: false,
            stencil: false,
          }}
          onCreated={({ gl }) => {
            const canVSM =
              gl.capabilities.isWebGL2 &&
              (gl.extensions.has('EXT_color_buffer_float') || gl.extensions.has('WEBGL_color_buffer_float'));

            gl.shadowMap.enabled = !!quality.shadows;
            gl.shadowMap.type = canVSM ? VSMShadowMap : PCFSoftShadowMap;
          }}
          performance={{ min: isMobile ? 0.4 : 0.6, max: 1 }}
        >
          <Suspense fallback={null}>
            {/* Physics World - Increased gravity for snappier fall */}
            <Physics gravity={[0, -40, 0]} timeStep={quality.physicsTimestep} maxSubsteps={quality.physicsMaxSubsteps}>
              <Lights />
              <ExposureController />
              <World />
              <Player />
              {/* Remote players from multiplayer V2 - LOD system for 50-100+ players */}
              <RemotePlayersV2 localPosition={playerPosition as [number, number, number]} />
              {/* Sync local player position to multiplayer V2 - adaptive sync rates */}
              <PlayerSyncV2 />
              {/* Community Events System */}
              <EventManager />
            </Physics>
            <PostEffects />
            <PerformanceLogger />
          </Suspense>
        </Canvas>
      </KeyboardControls>
      <UI />
    </>
  );
}
