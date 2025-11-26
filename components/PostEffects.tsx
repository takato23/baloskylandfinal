import { useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Vector2 } from 'three';
import { useGameStore } from '../store';
import { QUALITY_PRESETS } from '../utils/performance';

/**
 * Lightweight post stack:
 * - RenderPass + UnrealBloom with a high threshold so only emissive highlights (neon/lamps) bloom.
 * - Kept intentionally subtle to protect 60fps on mid hardware.
 */
export const PostEffects = () => {
  const { gl, scene, camera, size } = useThree();
  const qualityLevel = useGameStore((s) => s.qualityLevel);
  const quality = QUALITY_PRESETS[qualityLevel];

  // Skip composer entirely on low preset
  if (!quality.bloom) return null;

  const composer = useMemo(() => {
    const target = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(
      new Vector2(size.width, size.height),
      quality.bloomStrength,
      0.4,  // radius
      1.1   // threshold to only catch highlights
    );
    bloom.mipmapBlur = true;
    bloom.enabled = true;
    target.addPass(renderPass);
    target.addPass(bloom);
    return target;
  }, [gl, scene, camera, size.width, size.height, quality]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  useFrame((_, delta) => {
    composer.render(delta);
  }, 1);

  return null;
};
