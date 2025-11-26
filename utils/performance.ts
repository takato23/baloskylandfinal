// Centralized quality presets so we can toggle fidelity without touching gameplay.
export type QualityLevel = 'mobile' | 'low' | 'medium' | 'high';

export const QUALITY_PRESETS: Record<QualityLevel, {
    dpr: number | [number, number];
    shadows: boolean | 'basic';
    directionalShadowMapSize: 256 | 512 | 1024;
    bloom: boolean;
    bloomStrength: number;
    cameraFar: number;
    lampLightBudget: number;
    weatherDensity: number; // factor 0-1 applied to particle counts
    starsCount: number;
    physicsTimestep: number; // seconds
    physicsMaxSubsteps: number;
}> = {
    mobile: {
        dpr: 0.75,
        shadows: false,
        directionalShadowMapSize: 256,
        bloom: false,
        bloomStrength: 0,
        cameraFar: 80,
        lampLightBudget: 8,
        weatherDensity: 0.2,
        starsCount: 100,
        physicsTimestep: 1 / 30,
        physicsMaxSubsteps: 1,
    },
    high: {
        dpr: [1, 1.5],
        shadows: 'basic',
        directionalShadowMapSize: 1024,
        bloom: true,
        bloomStrength: 0.35,
        cameraFar: 180,
        lampLightBudget: 40,
        weatherDensity: 1,
        starsCount: 1600,
        physicsTimestep: 1 / 60,
        physicsMaxSubsteps: 3,
    },
    medium: {
        dpr: [1, 1.25],
        shadows: 'basic',
        directionalShadowMapSize: 512,
        bloom: true,
        bloomStrength: 0.28,
        cameraFar: 150,
        lampLightBudget: 28,
        weatherDensity: 0.65,
        starsCount: 900,
        physicsTimestep: 1 / 60,
        physicsMaxSubsteps: 2,
    },
    low: {
        dpr: 1,
        shadows: false,
        directionalShadowMapSize: 256,
        bloom: false,
        bloomStrength: 0,
        cameraFar: 110,
        lampLightBudget: 16,
        weatherDensity: 0.4,
        starsCount: 400,
        physicsTimestep: 1 / 50,
        physicsMaxSubsteps: 1,
    },
};

// Helper to detect if device is low-end
export const isLowEndDevice = () => navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

// Helper to detect mobile devices
export const isMobileDevice = () => {
    const hasTouch = 'ontouchstart' in window;
    const smallScreen = window.innerWidth <= 1024;
    const lowConcurrency = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    const lowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;

    return hasTouch && (smallScreen || lowConcurrency || lowMemory);
};

// Auto-select preset based on device capability (default medium on desktop)
export const defaultQuality = (): QualityLevel =>
    isMobileDevice() ? 'mobile' : (isLowEndDevice() ? 'low' : 'medium');
