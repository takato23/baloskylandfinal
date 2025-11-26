# Plan Integral de Optimización Móvil - Cozy City Explorer

## Resumen Ejecutivo

Este documento presenta un plan completo de optimización para dispositivos móviles del juego Cozy City Explorer. El objetivo es lograr **60 FPS estables** en dispositivos móviles de gama media, reducir el consumo de batería y mejorar la experiencia de usuario táctil.

---

## 1. Estado Actual del Proyecto

### 1.1 Fortalezas Existentes
- ✅ Detección móvil implementada (`useIsMobile.ts`)
- ✅ Controles táctiles con joystick virtual (`MobileControls.tsx`)
- ✅ Sistema de presets de calidad (`performance.ts`: low/medium/high)
- ✅ Viewport configurado correctamente (`user-scalable=no`)
- ✅ Retroalimentación háptica implementada
- ✅ Instanciación de geometrías para árboles, lámparas y cercas
- ✅ LOD básico en árboles (near/far separation)

### 1.2 Problemas Identificados

| Área | Problema | Impacto |
|------|----------|---------|
| **Rendering** | Bloom activo en quality medium | Alto consumo GPU |
| **Physics** | 60 FPS timestep en todos los presets | CPU intensivo |
| **World** | CobbleSidewalk genera miles de boxes | Memoria/Draw calls |
| **Shadows** | VSM shadows activas en medium | GPU intensivo |
| **Particles** | Clima/estrellas sin pooling | GC spikes |
| **UI** | Sin lazy loading de componentes | Bundle size |
| **Audio** | Web Audio sin suspensión en background | Batería |
| **Input** | Joystick recalcula en cada touch move | CPU |

---

## 2. Plan de Optimización por Áreas

### 2.1 Preset de Calidad "Mobile" (PRIORIDAD ALTA)

**Archivo:** `utils/performance.ts`

```typescript
export const QUALITY_PRESETS = {
  // ... existing presets ...

  mobile: {
    dpr: 0.75,                    // Reducir resolución de render
    shadows: false,               // Sin sombras dinámicas
    directionalShadowMapSize: 0,
    bloom: false,                 // Sin post-processing
    bloomStrength: 0,
    cameraFar: 80,               // Reducir distancia de visión
    lampLightBudget: 8,          // Menos luces dinámicas
    weatherDensity: 0.2,         // Mínimos efectos de clima
    starsCount: 100,             // Reducir partículas
    physicsTimestep: 1/30,       // Physics a 30 FPS
    physicsMaxSubsteps: 1,
    // Mobile-specific
    instanceCullingDistance: 20, // Culling agresivo
    disablePostEffects: true,
    simplifiedGeometry: true,
    reducedDrawCalls: true,
  },
};
```

**Detección automática:**
```typescript
export const isMobileDevice = () => {
  const hasTouch = 'ontouchstart' in window;
  const isSmallScreen = window.innerWidth <= 1024;
  const isLowEnd = navigator.hardwareConcurrency < 4;
  const hasLowMemory = (navigator as any).deviceMemory < 4;

  return hasTouch && (isSmallScreen || isLowEnd || hasLowMemory);
};

export const defaultQuality = (): QualityLevel =>
  isMobileDevice() ? 'mobile' : (isLowEndDevice() ? 'low' : 'medium');
```

---

### 2.2 Optimización del World/Geometría (PRIORIDAD ALTA)

#### 2.2.1 Eliminar CobbleSidewalk en Mobile

**Archivo:** `components/World.tsx`

El componente `CobbleSidewalk` genera **miles de boxes individuales** para crear textura visual. Esto es catastrófico en mobile.

**Solución:**
```typescript
// Reemplazar CobbleSidewalk con textura simple en mobile
const SimplifiedSidewalk: React.FC<{...}> = ({ width, depth, position }) => {
  const isMobile = useGameStore(s => s.qualityLevel === 'mobile');

  if (isMobile) {
    return (
      <Box
        args={[width, 0.16, depth]}
        position={position}
        material={Materials.Sidewalk}
        receiveShadow={false}
      />
    );
  }

  // CobbleSidewalk original para desktop
  return <CobbleSidewalk {...props} />;
};
```

#### 2.2.2 Reducir Complejidad de Bloques

```typescript
// En CityBlock, saltar decoraciones en mobile
const CityBlock: React.FC<{...}> = ({ x, z, isCenter }) => {
  const isMobile = useGameStore(s => s.qualityLevel === 'mobile');

  return (
    <group>
      {/* Física siempre */}
      <RigidBody>...</RigidBody>

      {/* Simplificar visual en mobile */}
      {isMobile ? (
        <SimplifiedSidewalk ... />
      ) : (
        <CobbleSidewalk ... />
      )}

      {/* Omitir decoraciones menores en mobile */}
      {!isMobile && (
        <>
          <SidewalkCrack ... />
          <SidewalkSpot ... />
          <CornerPost ... />
        </>
      )}
    </group>
  );
};
```

#### 2.2.3 LOD Agresivo para Edificios

```typescript
// Crear versiones simplificadas de edificios para mobile
const BuildingLOD: React.FC<{...}> = ({ position, variant, height, width }) => {
  const isMobile = useGameStore(s => s.qualityLevel === 'mobile');
  const playerPos = useGameStore(s => s.playerPosition);

  const distance = Math.hypot(
    position[0] - playerPos[0],
    position[2] - playerPos[2]
  );

  // En mobile: box simple a distancia
  if (isMobile && distance > 30) {
    return (
      <Box
        args={[width, height, width]}
        position={[position[0], height/2, position[2]]}
        material={Materials.BuildingGray}
      />
    );
  }

  return <Building {...props} />;
};
```

---

### 2.3 Optimización de Rendering (PRIORIDAD ALTA)

#### 2.3.1 Canvas Settings para Mobile

**Archivo:** `App.tsx`

```typescript
<Canvas
  shadows={quality.shadows}
  camera={{
    position: [0, 5, 10],
    fov: isMobile ? 55 : 50,  // FOV más amplio = menos objetos visibles
    far: quality.cameraFar,
    near: isMobile ? 0.5 : 0.1,  // Near plane más alejado
  }}
  dpr={quality.dpr}
  gl={{
    antialias: !isMobile,           // Sin antialiasing en mobile
    powerPreference: 'default',      // No forzar high-performance en mobile
    precision: isMobile ? 'mediump' : 'highp',
    alpha: false,                    // Sin transparencia de canvas
    stencil: false,                  // Sin stencil buffer
    depth: true,
  }}
  frameloop={isMobile ? 'demand' : 'always'}  // Render on demand
  performance={{
    min: isMobile ? 0.4 : 0.6,
    max: 1,
    debounce: 200,
  }}
>
```

#### 2.3.2 Frustum Culling Mejorado

```typescript
// Hook para culling manual basado en distancia
export function useDistanceCulling(
  position: [number, number, number],
  threshold: number = 40
): boolean {
  const playerPos = useGameStore(s => s.playerPosition);

  const dx = position[0] - playerPos[0];
  const dz = position[2] - playerPos[2];
  const distSq = dx * dx + dz * dz;

  return distSq < threshold * threshold;
}

// Uso en componentes
const Prop: React.FC<{position}> = ({ position }) => {
  const isVisible = useDistanceCulling(position, 30);
  if (!isVisible) return null;
  return <ActualProp ... />;
};
```

---

### 2.4 Optimización de Physics (PRIORIDAD MEDIA)

**Archivo:** `App.tsx`

```typescript
<Physics
  gravity={[0, -40, 0]}
  timeStep={quality.physicsTimestep}
  maxSubsteps={quality.physicsMaxSubsteps}
  // Nuevas optimizaciones
  interpolate={!isMobile}              // Sin interpolación en mobile
  colliders={isMobile ? 'ball' : 'hull'} // Colisionadores más simples
  paused={isBackgrounded}              // Pausar cuando app en background
>
```

#### 2.4.1 Colisionadores Simplificados en Mobile

```typescript
// Reemplazar CapsuleCollider complejo con esfera simple
const PlayerCollider: React.FC = () => {
  const isMobile = useGameStore(s => s.qualityLevel === 'mobile');

  if (isMobile) {
    return <BallCollider args={[0.5]} position={[0, 0.5, 0]} />;
  }

  return (
    <>
      <CapsuleCollider args={[0.3, 0.3]} position={[0, 0.65, 0]} />
      <CapsuleCollider args={[0.1, 0.25]} position={[0, 0.35, 0]} />
      <CuboidCollider sensor ... />
    </>
  );
};
```

---

### 2.5 Optimización de Controles Móviles (PRIORIDAD ALTA)

#### 2.5.1 Throttling del Joystick

**Archivo:** `components/ui-components/MobileControls.tsx`

```typescript
// Throttle touch moves para reducir actualizaciones
const throttledUpdateStick = useMemo(
  () => throttle((e: TouchEvent | MouseEvent) => {
    updateStick(e);
  }, 16), // ~60fps máximo
  [updateStick]
);

// Usar RAF para actualizaciones suaves
const rafId = useRef<number>(0);

const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
  e.preventDefault();
  if (!isDragging.current) return;

  cancelAnimationFrame(rafId.current);
  rafId.current = requestAnimationFrame(() => {
    throttledUpdateStick(e);
  });
}, [throttledUpdateStick]);
```

#### 2.5.2 Gesture Recognition Mejorado

```typescript
// Detectar gestos comunes
const useGestures = () => {
  const lastTap = useRef(0);
  const touchStart = useRef<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    // Double tap detection
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap = jump
      setButton('jump', true);
    }
    lastTap.current = now;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;

    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;

    // Swipe up = jump
    if (dy < -50 && Math.abs(dx) < 30) {
      setButton('jump', true);
    }
    // Swipe down = interact
    if (dy > 50 && Math.abs(dx) < 30) {
      setButton('interact', true);
    }
  };

  return { handleTouchStart, handleTouchEnd };
};
```

#### 2.5.3 Botones con Áreas de Touch Más Grandes

```typescript
// Aumentar hit areas en mobile
const ActionButton: React.FC<ActionButtonProps> = ({ size, ...props }) => {
  // Mínimo 48x48dp según Material Design guidelines
  const minSize = 48;

  const sizeClasses = {
    sm: `min-w-[${minSize}px] min-h-[${minSize}px] w-14 h-14`,
    md: `min-w-[${minSize}px] min-h-[${minSize}px] w-16 h-16`,
    lg: `min-w-[${minSize}px] min-h-[${minSize}px] w-20 h-20`,
    xl: `min-w-[${minSize}px] min-h-[${minSize}px] w-24 h-24`,
  };

  return (
    <button
      className={`${sizeClasses[size]} touch-manipulation`}
      // touch-manipulation previene el delay de 300ms
      ...
    />
  );
};
```

---

### 2.6 Optimización de Audio (PRIORIDAD MEDIA)

**Archivo:** `utils/audio.ts`

```typescript
// Suspender audio cuando app en background
let audioContext: AudioContext | null = null;

export const initAudio = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Listener para visibilidad
document.addEventListener('visibilitychange', () => {
  if (!audioContext) return;

  if (document.hidden) {
    audioContext.suspend();
  } else {
    audioContext.resume();
  }
});

// Pool de sonidos para evitar crear nuevos nodos
const soundPool: Map<string, AudioBufferSourceNode[]> = new Map();
const POOL_SIZE = 5;

export const playPooledSound = (type: string) => {
  let pool = soundPool.get(type);
  if (!pool) {
    pool = [];
    soundPool.set(type, pool);
  }

  // Reusar nodo existente o crear nuevo
  let node = pool.find(n => !n.playing);
  if (!node && pool.length < POOL_SIZE) {
    node = createSoundNode(type);
    pool.push(node);
  }

  if (node) {
    node.start();
  }
};
```

---

### 2.7 Optimización de Memoria (PRIORIDAD MEDIA)

#### 2.7.1 Lazy Loading de Componentes UI

**Archivo:** `components/UI.tsx`

```typescript
import { lazy, Suspense } from 'react';

// Lazy load componentes pesados
const Customization = lazy(() => import('./ui-components/Customization'));
const ChatWindow = lazy(() => import('./ui-components/ChatWindow'));
const GeminiLiveManager = lazy(() => import('./ui-components/GeminiLiveManager'));

export const UI: React.FC = () => {
  return (
    <>
      {/* Solo cargar cuando se necesita */}
      {showCustomization && (
        <Suspense fallback={<LoadingSpinner />}>
          <Customization onClose={handleCloseCustomization} />
        </Suspense>
      )}

      {liveSession.isOpen && (
        <Suspense fallback={null}>
          <ChatWindow />
          <GeminiLiveManager />
        </Suspense>
      )}
    </>
  );
};
```

#### 2.7.2 Dispose de Geometrías No Usadas

```typescript
// Hook para cleanup automático
export const useDisposable = <T extends { dispose: () => void }>(
  factory: () => T,
  deps: any[]
) => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    ref.current = factory();

    return () => {
      ref.current?.dispose();
      ref.current = null;
    };
  }, deps);

  return ref.current;
};

// Uso
const MyComponent = () => {
  const geometry = useDisposable(
    () => new BoxGeometry(1, 1, 1),
    []
  );

  return <mesh geometry={geometry} ... />;
};
```

---

### 2.8 PWA y Offline Support (PRIORIDAD BAJA)

**Archivo:** `public/manifest.json` (nuevo)

```json
{
  "name": "Cozy City Explorer",
  "short_name": "CityExplorer",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#87CEEB",
  "theme_color": "#4A90E2",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Archivo:** `index.html`

```html
<head>
  <!-- PWA meta tags -->
  <link rel="manifest" href="/manifest.json">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#87CEEB">

  <!-- Prevent pull-to-refresh -->
  <style>
    body {
      overscroll-behavior: none;
      -webkit-overflow-scrolling: auto;
    }
  </style>
</head>
```

---

### 2.9 Optimización de Red/Bundle (PRIORIDAD MEDIA)

#### 2.9.1 Code Splitting

```typescript
// Cargar el mundo por chunks
const World = lazy(() => import('./components/World'));
const Vehicle = lazy(() => import('./components/Vehicle'));
const NPC = lazy(() => import('./components/npc/LiveNPC'));

// Precargar durante idle time
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./components/Vehicle');
    import('./components/npc/LiveNPC');
  });
}
```

#### 2.9.2 Compresión de Assets

```typescript
// vite.config.ts
export default {
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei', '@react-three/rapier'],
          'ui': ['./src/components/ui-components'],
        },
      },
    },
  },
};
```

---

## 3. Métricas de Éxito

| Métrica | Estado Actual (Est.) | Objetivo |
|---------|---------------------|----------|
| FPS (iPhone 12) | ~25-35 | 55-60 |
| FPS (Android mid-range) | ~20-30 | 45-55 |
| Time to Interactive | ~5s | <3s |
| Bundle Size | ~2MB | <1.5MB |
| Memory Usage | ~300MB | <200MB |
| Draw Calls | ~500+ | <150 |
| Battery Drain (30min) | Alto | Medio |

---

## 4. Plan de Implementación

### Fase 1: Quick Wins (1-2 días)
1. [ ] Crear preset `mobile` en `performance.ts`
2. [ ] Deshabilitar CobbleSidewalk en mobile
3. [ ] Reducir partículas de clima/estrellas
4. [ ] Configurar Canvas con settings mobile
5. [ ] Throttle del joystick

### Fase 2: Rendering (2-3 días)
1. [ ] Implementar LOD para edificios
2. [ ] Agregar distance culling hook
3. [ ] Simplificar colliders en mobile
4. [ ] Reducir geometría de props decorativos

### Fase 3: Performance Deep (2-3 días)
1. [ ] Lazy loading de componentes UI
2. [ ] Audio pooling y suspensión
3. [ ] Dispose automático de geometrías
4. [ ] Physics interpolation fix

### Fase 4: Polish (1-2 días)
1. [ ] PWA manifest
2. [ ] Code splitting
3. [ ] Gesture recognition mejorado
4. [ ] Testing en dispositivos reales

---

## 5. Herramientas de Monitoreo

### 5.1 Performance Logger Mejorado

```typescript
// Extender PerformanceLogger.tsx
export const PerformanceLogger = () => {
  const [stats, setStats] = useState({
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
  });

  useFrame(({ gl }) => {
    const info = gl.info;
    setStats({
      fps: 1 / delta,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      memory: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
    });
  });

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-0 left-0 bg-black/80 text-green-400 text-xs p-2 font-mono">
      <div>FPS: {stats.fps.toFixed(0)}</div>
      <div>Draw: {stats.drawCalls}</div>
      <div>Tris: {(stats.triangles / 1000).toFixed(1)}K</div>
      <div>Mem: {stats.memory.toFixed(0)}MB</div>
    </div>
  );
};
```

---

## 6. Checklist de Testing

### Dispositivos Objetivo
- [ ] iPhone SE (2020) - baseline iOS
- [ ] iPhone 12/13 - mid-range iOS
- [ ] Samsung A52/A53 - mid-range Android
- [ ] Pixel 4a - stock Android
- [ ] iPad (cualquier generación) - tablet

### Tests a Ejecutar
- [ ] Cold start time
- [ ] FPS durante gameplay normal
- [ ] FPS durante skateboard + trucos
- [ ] Memoria después de 10min de juego
- [ ] Responsividad del joystick
- [ ] Latencia de botones
- [ ] Batería después de 30min
- [ ] Comportamiento en background/foreground

---

## 7. Recursos Adicionales

- [Three.js Performance Tips](https://threejs.org/docs/#manual/en/introduction/How-to-optimize)
- [React Three Fiber Performance](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance)
- [Web Performance for Mobile](https://web.dev/mobile/)
- [Material Design Touch Targets](https://m3.material.io/foundations/interaction/touch-targets)
