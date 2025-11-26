import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useGameStore } from '../store';

/**
 * Simple auto-exposure clamp tuned for weather:
 * keeps snow/rain from blowing out highlights while avoiding night under-exposure.
 */
export const ExposureController = () => {
  const weather = useGameStore((s) => s.weather);
  const isNight = useGameStore((s) => s.isNight);
  const { gl } = useThree();

  useFrame(() => {
    let target = 1.0;
    if (isNight) target = 0.78;
    else if (weather === 'snow') target = 0.85;
    else if (weather === 'rain') target = 0.9;
    else target = 1.05;

    // Clamp between safe min/max to avoid blown highlights or dull scenes
    target = MathUtils.clamp(target, 0.75, 1.08);
    gl.toneMappingExposure = MathUtils.lerp(gl.toneMappingExposure, target, 0.05);
  });

  return null;
};
