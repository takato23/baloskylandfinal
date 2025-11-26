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
    // New performance options
    maxVisibleNPCs: number;
    npcCullDistance: number;
    treeCullDistance: number;
    decorationDensity: number; // 0-1 multiplier for decorative elements
    enableBorderDecorations: boolean;
    enablePuddles: boolean;
    maxCars: number;
}> = {
    mobile: {
        dpr: 0.6,
        shadows: false,
        directionalShadowMapSize: 256,
        bloom: false,
        bloomStrength: 0,
        cameraFar: 60,
        lampLightBudget: 4,
        weatherDensity: 0.1,
        starsCount: 50,
        physicsTimestep: 1 / 30,
        physicsMaxSubsteps: 1,
        // Aggressive mobile culling
        maxVisibleNPCs: 3,
        npcCullDistance: 25,
        treeCullDistance: 30,
        decorationDensity: 0.2,
        enableBorderDecorations: false,
        enablePuddles: false,
        maxCars: 2,
    },
    low: {
        dpr: 0.85,
        shadows: false,
        directionalShadowMapSize: 256,
        bloom: false,
        bloomStrength: 0,
        cameraFar: 90,
        lampLightBudget: 10,
        weatherDensity: 0.3,
        starsCount: 200,
        physicsTimestep: 1 / 45,
        physicsMaxSubsteps: 1,
        maxVisibleNPCs: 5,
        npcCullDistance: 30,
        treeCullDistance: 40,
        decorationDensity: 0.4,
        enableBorderDecorations: true,
        enablePuddles: false,
        maxCars: 3,
    },
    medium: {
        dpr: [1, 1.25],
        shadows: 'basic',
        directionalShadowMapSize: 512,
        bloom: true,
        bloomStrength: 0.28,
        cameraFar: 130,
        lampLightBudget: 20,
        weatherDensity: 0.6,
        starsCount: 600,
        physicsTimestep: 1 / 60,
        physicsMaxSubsteps: 2,
        maxVisibleNPCs: 8,
        npcCullDistance: 40,
        treeCullDistance: 55,
        decorationDensity: 0.7,
        enableBorderDecorations: true,
        enablePuddles: true,
        maxCars: 4,
    },
    high: {
        dpr: [1, 1.5],
        shadows: 'basic',
        directionalShadowMapSize: 1024,
        bloom: true,
        bloomStrength: 0.35,
        cameraFar: 180,
        lampLightBudget: 35,
        weatherDensity: 1,
        starsCount: 1200,
        physicsTimestep: 1 / 60,
        physicsMaxSubsteps: 3,
        maxVisibleNPCs: 15,
        npcCullDistance: 50,
        treeCullDistance: 70,
        decorationDensity: 1,
        enableBorderDecorations: true,
        enablePuddles: true,
        maxCars: 4,
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
