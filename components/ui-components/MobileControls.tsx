import React, { useState, useRef, useCallback, memo, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store';
import { useOrientation } from '../../hooks';
import { playSound } from '../../utils/audio';

// ============================================
// Constants
// ============================================

const HAPTIC_LIGHT = 10;
const HAPTIC_MEDIUM = 25;
const HAPTIC_HEAVY = 40;

// ============================================
// Haptic Feedback Helper
// ============================================

const vibrate = (pattern: number | number[] = HAPTIC_LIGHT) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
};

// ============================================
// SVG Icons - Diseño profesional AAA
// ============================================

const Icons = {
  jump: (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
      <path
        d="M12 4L12 16M12 4L7 9M12 4L17 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 20H18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  ),
  interact: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M12 2V6M12 18V22M2 12H6M18 12H22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  ),
  run: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <circle cx="14" cy="4" r="2.5" fill="currentColor" />
      <path
        d="M6 20L9 14L12 16L16 10L14 6L10 8L8 14L4 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  walk: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <circle cx="12" cy="4" r="2.5" fill="currentColor" />
      <path
        d="M12 8V13M12 13L9 20M12 13L15 20M8 11H16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  horn: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d="M3 10V14C3 15.1 3.9 16 5 16H7L12 20V4L7 8H5C3.9 8 3 8.9 3 10Z"
        fill="currentColor"
      />
      <path
        d="M16 9C17.3 10.3 17.3 13.7 16 15M19 6C22 9 22 15 19 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  ),
  drift: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <path
        d="M4 12H8M10 12H14M16 12H20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M2 8L6 12L2 16M22 8L18 12L22 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  ),
  exit: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17L21 12L16 7M21 12H9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  skateboard: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="2" y="10" width="20" height="4" rx="2" fill="currentColor" />
      <circle cx="6" cy="17" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="18" cy="17" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7C7 4.2 9.2 2 12 2C14.8 2 17 4.2 17 7V11" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
};

// ============================================
// Premium Game Button - Estilo AAA
// ============================================

interface GameButtonProps {
  onPress: () => void;
  onRelease: () => void;
  size: 'sm' | 'md' | 'lg' | 'xl';
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple';
  icon: React.ReactNode;
  label?: string;
  disabled?: boolean;
  pulse?: boolean;
  glow?: boolean;
  hapticIntensity?: number;
}

const BUTTON_VARIANTS = {
  primary: {
    bg: 'from-blue-400 via-blue-500 to-blue-600',
    border: 'border-blue-700',
    shadow: 'shadow-blue-500/40',
    glow: 'rgba(59, 130, 246, 0.6)',
    innerLight: 'from-blue-300/50',
    ring: 'ring-blue-300',
  },
  secondary: {
    bg: 'from-slate-400 via-slate-500 to-slate-600',
    border: 'border-slate-700',
    shadow: 'shadow-slate-500/40',
    glow: 'rgba(100, 116, 139, 0.6)',
    innerLight: 'from-slate-300/50',
    ring: 'ring-slate-300',
  },
  success: {
    bg: 'from-emerald-400 via-emerald-500 to-emerald-600',
    border: 'border-emerald-700',
    shadow: 'shadow-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.6)',
    innerLight: 'from-emerald-300/50',
    ring: 'ring-emerald-300',
  },
  warning: {
    bg: 'from-amber-400 via-amber-500 to-amber-600',
    border: 'border-amber-700',
    shadow: 'shadow-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.6)',
    innerLight: 'from-amber-200/50',
    ring: 'ring-amber-300',
  },
  danger: {
    bg: 'from-rose-400 via-rose-500 to-rose-600',
    border: 'border-rose-700',
    shadow: 'shadow-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.6)',
    innerLight: 'from-rose-300/50',
    ring: 'ring-rose-300',
  },
  purple: {
    bg: 'from-violet-400 via-violet-500 to-violet-600',
    border: 'border-violet-700',
    shadow: 'shadow-violet-500/40',
    glow: 'rgba(139, 92, 246, 0.6)',
    innerLight: 'from-violet-300/50',
    ring: 'ring-violet-300',
  },
};

const GameButton: React.FC<GameButtonProps> = memo(
  ({ onPress, onRelease, size, variant, icon, label, disabled = false, pulse = false, glow = false, hapticIntensity = HAPTIC_LIGHT }) => {
    const [isPressed, setIsPressed] = useState(false);
    const pressedRef = useRef(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const styles = BUTTON_VARIANTS[variant];

    const sizes = {
      sm: { button: 'w-14 h-14', icon: 'scale-90', label: 'text-[8px]' },
      md: { button: 'w-[68px] h-[68px]', icon: 'scale-100', label: 'text-[9px]' },
      lg: { button: 'w-[78px] h-[78px]', icon: 'scale-110', label: 'text-[10px]' },
      xl: { button: 'w-[88px] h-[88px]', icon: 'scale-125', label: 'text-[11px]' },
    };

    const handlePress = useCallback(() => {
      if (disabled || pressedRef.current) return;
      pressedRef.current = true;
      setIsPressed(true);
      vibrate(hapticIntensity);
      playSound('jump');
      onPress();
    }, [onPress, disabled, hapticIntensity]);

    const handleRelease = useCallback(() => {
      if (!pressedRef.current) return;
      pressedRef.current = false;
      setIsPressed(false);
      if (!disabled) onRelease();
    }, [onRelease, disabled]);

    useEffect(() => {
      const button = buttonRef.current;
      if (!button) return;

      const touchStart = (e: TouchEvent) => {
        e.stopPropagation();
        handlePress();
      };
      const touchEnd = (e: TouchEvent) => {
        e.stopPropagation();
        handleRelease();
      };
      const touchCancel = () => {
        pressedRef.current = false;
        setIsPressed(false);
        onRelease();
      };

      button.addEventListener('touchstart', touchStart, { passive: true });
      button.addEventListener('touchend', touchEnd, { passive: true });
      button.addEventListener('touchcancel', touchCancel, { passive: true });

      return () => {
        button.removeEventListener('touchstart', touchStart);
        button.removeEventListener('touchend', touchEnd);
        button.removeEventListener('touchcancel', touchCancel);
      };
    }, [handlePress, handleRelease, onRelease]);

    return (
      <button
        ref={buttonRef}
        className={`
          ${sizes[size].button} relative rounded-[20px] touch-none select-none
          ${disabled ? 'opacity-40 pointer-events-none' : ''}
          ${pulse && !isPressed ? 'animate-pulse' : ''}
        `}
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={label}
        disabled={disabled}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Outer glow effect */}
        {(glow || isPressed) && (
          <div
            className="absolute -inset-1 rounded-[24px] blur-md opacity-60 transition-opacity duration-200"
            style={{ background: styles.glow }}
          />
        )}

        {/* Button base with 3D effect */}
        <div
          className={`
            absolute inset-0 rounded-[20px] bg-gradient-to-b ${styles.bg}
            border-2 ${styles.border} shadow-lg ${styles.shadow}
            transition-all duration-100
            ${isPressed ? 'translate-y-1 shadow-sm' : 'shadow-xl'}
          `}
        >
          {/* Top highlight - simulates light reflection */}
          <div
            className={`absolute inset-x-2 top-1 h-[40%] rounded-t-[16px] bg-gradient-to-b ${styles.innerLight} to-transparent`}
          />

          {/* Inner shadow at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-[30%] rounded-b-[18px] bg-gradient-to-t from-black/20 to-transparent" />

          {/* Subtle texture overlay */}
          <div className="absolute inset-0 rounded-[18px] opacity-10 bg-[radial-gradient(circle_at_50%_0%,white,transparent_70%)]" />
        </div>

        {/* Bottom shadow layer (3D depth) */}
        <div
          className={`
            absolute inset-x-0 -bottom-1 h-3 rounded-b-[20px] bg-black/30 blur-[2px]
            transition-all duration-100
            ${isPressed ? 'opacity-0 h-1' : 'opacity-100'}
          `}
        />

        {/* Content */}
        <div
          className={`
            relative z-10 flex flex-col items-center justify-center h-full text-white
            transition-transform duration-100
            ${isPressed ? 'translate-y-0.5' : ''}
            ${sizes[size].icon}
          `}
        >
          {/* Icon with drop shadow */}
          <div className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">{icon}</div>

          {/* Label */}
          {label && (
            <span
              className={`${sizes[size].label} font-black tracking-wider mt-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] uppercase`}
            >
              {label}
            </span>
          )}
        </div>

        {/* Press ring effect */}
        {isPressed && (
          <div className={`absolute inset-0 rounded-[20px] ring-4 ${styles.ring} ring-opacity-50 animate-ping`} style={{ animationDuration: '0.4s', animationIterationCount: 1 }} />
        )}
      </button>
    );
  }
);

GameButton.displayName = 'GameButton';

// ============================================
// Toggle Game Button - Para correr trabado
// ============================================

interface ToggleGameButtonProps {
  isActive: boolean;
  onToggle: () => void;
  size: 'sm' | 'md' | 'lg';
  activeVariant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple';
  inactiveVariant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple';
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  activeLabel: string;
  inactiveLabel: string;
}

const ToggleGameButton: React.FC<ToggleGameButtonProps> = memo(
  ({ isActive, onToggle, size, activeVariant, inactiveVariant, activeIcon, inactiveIcon, activeLabel, inactiveLabel }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const styles = BUTTON_VARIANTS[isActive ? activeVariant : inactiveVariant];

    const sizes = {
      sm: { button: 'w-14 h-14', icon: 'scale-90', label: 'text-[8px]' },
      md: { button: 'w-[68px] h-[68px]', icon: 'scale-100', label: 'text-[9px]' },
      lg: { button: 'w-[78px] h-[78px]', icon: 'scale-110', label: 'text-[10px]' },
    };

    const handleToggle = useCallback(() => {
      vibrate(HAPTIC_MEDIUM);
      playSound('jump');
      onToggle();
    }, [onToggle]);

    useEffect(() => {
      const button = buttonRef.current;
      if (!button) return;

      const touchStart = (e: TouchEvent) => {
        e.stopPropagation();
        handleToggle();
      };

      button.addEventListener('touchstart', touchStart, { passive: true });
      return () => button.removeEventListener('touchstart', touchStart);
    }, [handleToggle]);

    return (
      <button
        ref={buttonRef}
        className={`${sizes[size].button} relative rounded-[20px] touch-none select-none`}
        onMouseDown={handleToggle}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={isActive ? activeLabel : inactiveLabel}
        aria-pressed={isActive}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Active glow */}
        {isActive && (
          <div
            className="absolute -inset-1.5 rounded-[26px] blur-lg opacity-70 animate-pulse"
            style={{ background: styles.glow, animationDuration: '1.5s' }}
          />
        )}

        {/* Button base */}
        <div
          className={`
            absolute inset-0 rounded-[20px] bg-gradient-to-b ${styles.bg}
            border-2 ${styles.border} shadow-lg ${styles.shadow}
            transition-all duration-150
            ${isActive ? 'translate-y-0.5 shadow-md scale-[0.97]' : 'shadow-xl'}
          `}
        >
          <div className={`absolute inset-x-2 top-1 h-[40%] rounded-t-[16px] bg-gradient-to-b ${styles.innerLight} to-transparent`} />
          <div className="absolute inset-x-0 bottom-0 h-[30%] rounded-b-[18px] bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Bottom shadow */}
        <div
          className={`
            absolute inset-x-0 -bottom-1 h-3 rounded-b-[20px] bg-black/30 blur-[2px]
            transition-all duration-150
            ${isActive ? 'opacity-30 h-1' : 'opacity-100'}
          `}
        />

        {/* Content */}
        <div
          className={`
            relative z-10 flex flex-col items-center justify-center h-full text-white
            transition-transform duration-150
            ${isActive ? 'translate-y-0.5' : ''}
            ${sizes[size].icon}
          `}
        >
          <div className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
            {isActive ? activeIcon : inactiveIcon}
          </div>
          <span className={`${sizes[size].label} font-black tracking-wider mt-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] uppercase`}>
            {isActive ? activeLabel : inactiveLabel}
          </span>
        </div>

        {/* Lock indicator */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-600 z-20">
            {Icons.lock}
          </div>
        )}
      </button>
    );
  }
);

ToggleGameButton.displayName = 'ToggleGameButton';

// ============================================
// Pill Button - Acciones rápidas
// ============================================

interface PillButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple';
}

const PillButton: React.FC<PillButtonProps> = memo(({ onPress, icon, label, variant }) => {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const styles = BUTTON_VARIANTS[variant];

  const handlePress = useCallback(() => {
    setIsPressed(true);
    vibrate(HAPTIC_LIGHT);
    playSound('coin');
    onPress();
  }, [onPress]);

  const handleRelease = useCallback(() => {
    setIsPressed(false);
  }, []);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const touchStart = () => handlePress();
    const touchEnd = () => handleRelease();

    button.addEventListener('touchstart', touchStart, { passive: true });
    button.addEventListener('touchend', touchEnd, { passive: true });

    return () => {
      button.removeEventListener('touchstart', touchStart);
      button.removeEventListener('touchend', touchEnd);
    };
  }, [handlePress, handleRelease]);

  return (
    <button
      ref={buttonRef}
      className="relative touch-none select-none"
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={label}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div
        className={`
          px-4 py-2.5 rounded-full bg-gradient-to-b ${styles.bg}
          border-2 ${styles.border} shadow-lg ${styles.shadow}
          flex items-center gap-2 transition-all duration-100
          ${isPressed ? 'translate-y-0.5 shadow-sm scale-95' : 'shadow-xl'}
        `}
      >
        <div className={`absolute inset-x-2 top-0.5 h-[50%] rounded-t-full bg-gradient-to-b ${styles.innerLight} to-transparent`} />
        <span className="relative text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{icon}</span>
        <span className="relative text-white font-bold text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{label}</span>
      </div>
    </button>
  );
});

PillButton.displayName = 'PillButton';

// ============================================
// Premium Joystick
// ============================================

interface VirtualJoystickProps {
  onMove: (x: number, y: number, active: boolean) => void;
  size: number;
  stickSize: number;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = memo(({ onMove, size, stickSize }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const isDragging = useRef(false);
  const activeTouchId = useRef<number | null>(null);
  const rafId = useRef<number>(0);
  const lastUpdate = useRef<{ x: number; y: number } | null>(null);
  const onMoveRef = useRef(onMove);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const processMove = (clientX: number, clientY: number) => {
      lastUpdate.current = { x: clientX, y: clientY };
      if (rafId.current) return;

      rafId.current = requestAnimationFrame(() => {
        rafId.current = 0;
        if (!lastUpdate.current || !isDragging.current) return;

        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxDist = size / 2;

        let dx = lastUpdate.current.x - centerX;
        let dy = lastUpdate.current.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        setStickPos({ x: dx, y: dy });
        onMoveRef.current(dx / maxDist, dy / maxDist, true);
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      activeTouchId.current = touch.identifier;
      isDragging.current = true;
      setIsActive(true);
      vibrate(HAPTIC_LIGHT);
      processMove(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const touch = activeTouchId.current !== null
        ? Array.from(e.touches).find(t => t.identifier === activeTouchId.current)
        : e.touches[0];
      if (!touch) return;
      processMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (activeTouchId.current !== null) {
        const touchEnded = !Array.from(e.touches).some(t => t.identifier === activeTouchId.current);
        if (!touchEnded) return;
      }

      isDragging.current = false;
      activeTouchId.current = null;
      lastUpdate.current = null;
      setIsActive(false);

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }

      setStickPos({ x: 0, y: 0 });
      onMoveRef.current(0, 0, false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [size]);

  const intensity = Math.sqrt(stickPos.x * stickPos.x + stickPos.y * stickPos.y) / (size / 2);

  return (
    <div
      ref={containerRef}
      className="relative touch-none select-none"
      style={{ width: size, height: size, WebkitTapHighlightColor: 'transparent' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Outer glow when active */}
      {isActive && (
        <div
          className="absolute -inset-2 rounded-full blur-xl opacity-50 transition-opacity"
          style={{ background: `radial-gradient(circle, rgba(147, 51, 234, ${0.4 + intensity * 0.4}) 0%, transparent 70%)` }}
        />
      )}

      {/* Base ring - metallic look */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border border-slate-600">
        {/* Inner metallic ring */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/50">
          {/* Highlight */}
          <div className="absolute inset-x-4 top-2 h-[30%] rounded-t-full bg-gradient-to-b from-white/10 to-transparent" />
        </div>

        {/* Inner dark area */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-b from-slate-900 to-black border border-slate-700/50">
          {/* Grid pattern */}
          <div className="absolute inset-0 rounded-full opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at center, transparent 0%, transparent 40%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.03) 41%, transparent 41%)',
            backgroundSize: '12px 12px'
          }} />
        </div>
      </div>

      {/* Direction markers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {['top-3', 'bottom-3', 'left-3', 'right-3'].map((pos, i) => (
          <div
            key={pos}
            className={`absolute ${pos} w-2 h-2 rounded-full transition-all duration-150`}
            style={{
              background: intensity > 0.3
                ? `rgba(147, 51, 234, ${0.3 + intensity * 0.5})`
                : 'rgba(255,255,255,0.15)',
              boxShadow: intensity > 0.5 ? '0 0 8px rgba(147, 51, 234, 0.5)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Stick handle - premium 3D look */}
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: stickSize,
          height: stickSize,
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${stickPos.x}px), calc(-50% + ${stickPos.y}px))`,
          transition: isActive ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Shadow under stick */}
        <div
          className="absolute inset-0 rounded-full bg-black/40 blur-md translate-y-2"
          style={{ opacity: isActive ? 0.6 : 0.3 }}
        />

        {/* Stick base */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-xl border border-white/20">
          {/* Top highlight */}
          <div className="absolute inset-x-2 top-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/80 to-transparent" />

          {/* Center dot */}
          <div className="absolute inset-[35%] rounded-full bg-gradient-to-b from-slate-400 to-slate-500 border border-slate-300/50" />

          {/* Bottom shadow */}
          <div className="absolute inset-x-2 bottom-1 h-[25%] rounded-b-full bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Active glow ring */}
        {intensity > 0.3 && (
          <div
            className="absolute -inset-1 rounded-full border-2 border-violet-400/50"
            style={{ boxShadow: `0 0 ${intensity * 15}px rgba(147, 51, 234, ${intensity * 0.6})` }}
          />
        )}
      </div>
    </div>
  );
});

VirtualJoystick.displayName = 'VirtualJoystick';

// ============================================
// Speed Indicator - Racing style
// ============================================

interface SpeedIndicatorProps {
  speed: number;
  maxSpeed?: number;
}

const SpeedIndicator: React.FC<SpeedIndicatorProps> = memo(({ speed, maxSpeed = 50 }) => {
  const speedPercent = Math.min(100, Math.round((speed / maxSpeed) * 100));

  return (
    <div className="relative">
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-2xl blur-lg opacity-40"
        style={{
          background: speedPercent > 70
            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
            : speedPercent > 40
            ? 'linear-gradient(90deg, #22c55e, #f59e0b)'
            : 'linear-gradient(90deg, #3b82f6, #22c55e)',
        }}
      />

      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-4 border border-slate-700 shadow-xl">
        {/* Skateboard icon */}
        <div className="text-white">{Icons.skateboard}</div>

        <div className="flex flex-col gap-1">
          {/* Speed bar */}
          <div className="w-28 h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${speedPercent}%`,
                background: speedPercent > 70
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : speedPercent > 40
                  ? 'linear-gradient(90deg, #22c55e, #f59e0b)'
                  : 'linear-gradient(90deg, #3b82f6, #22c55e)',
                boxShadow: '0 0 10px currentColor',
              }}
            />
          </div>

          {/* Speed text */}
          <span className="text-white text-xs font-black tracking-wider text-center">
            {speedPercent > 0 ? `${speedPercent} KM/H` : 'PARADO'}
          </span>
        </div>
      </div>
    </div>
  );
});

SpeedIndicator.displayName = 'SpeedIndicator';

// ============================================
// Main Mobile Controls Component
// ============================================

export const MobileControls: React.FC = () => {
  const setJoystick = useGameStore((s) => s.setJoystick);
  const setButton = useGameStore((s) => s.setMobileButton);
  const isDriving = useGameStore((s) => s.isDriving);
  const vehicleType = useGameStore((s) => s.vehicleType);
  const interactionLabel = useGameStore((s) => s.interactionLabel);
  const setDriving = useGameStore((s) => s.setDriving);
  const skateboardSpeed = useGameStore((s) => s.skateboardSpeed);
  const currentTrick = useGameStore((s) => s.currentTrick);
  const trickCombo = useGameStore((s) => s.trickCombo);
  const isRunLocked = useGameStore((s) => s.isRunLocked);
  const toggleRunLock = useGameStore((s) => s.toggleRunLock);

  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  const hasInteraction = useMemo(() => !!interactionLabel, [interactionLabel]);
  const isOnSkateboard = isDriving && vehicleType === 'skateboard';

  const handleJoystickMove = useCallback((x: number, y: number, active: boolean) => {
    setJoystick(x, y, active);
  }, [setJoystick]);

  const handleJumpPress = useCallback(() => setButton('jump', true), [setButton]);
  const handleJumpRelease = useCallback(() => setButton('jump', false), [setButton]);
  const handleRunPress = useCallback(() => setButton('run', true), [setButton]);
  const handleRunRelease = useCallback(() => setButton('run', false), [setButton]);
  const handleInteractPress = useCallback(() => setButton('interact', true), [setButton]);
  const handleInteractRelease = useCallback(() => setButton('interact', false), [setButton]);
  const handleHornPress = useCallback(() => setButton('horn', true), [setButton]);
  const handleHornRelease = useCallback(() => setButton('horn', false), [setButton]);

  const handleStartSkateboard = useCallback(() => {
    setDriving(true, 'skateboard');
    vibrate(HAPTIC_MEDIUM);
  }, [setDriving]);

  const joystickSize = isLandscape ? 140 : 120;
  const stickSize = isLandscape ? 60 : 52;

  const joystickPosition = isLandscape ? 'bottom-6 left-6' : 'bottom-28 left-4';
  const buttonsPosition = isLandscape ? 'bottom-6 right-6' : 'bottom-28 right-4';

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-50"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Trick Combo Display */}
      {isOnSkateboard && currentTrick && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-lg opacity-60" />
            <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl px-5 py-2.5 flex items-center gap-3 border border-white/20 shadow-xl">
              <span className="text-white font-black text-lg tracking-wide">{currentTrick}</span>
              {trickCombo > 1 && (
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-sm px-3 py-1 rounded-full shadow-lg">
                  x{trickCombo}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Speed Indicator */}
      {isOnSkateboard && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <SpeedIndicator speed={skateboardSpeed} />
        </div>
      )}

      {/* Virtual Joystick */}
      <div className={`absolute ${joystickPosition} pointer-events-auto`}>
        <VirtualJoystick
          onMove={handleJoystickMove}
          size={joystickSize}
          stickSize={stickSize}
        />

        {!isDriving && (
          <div className="mt-3 text-center">
            <span className="text-white/60 text-[10px] font-bold bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
              Empujá fuerte = Correr
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={`absolute ${buttonsPosition} pointer-events-auto`}>
        {isOnSkateboard ? (
          // Skateboard Controls
          <div className={`flex ${isLandscape ? 'flex-row items-end' : 'flex-col items-end'} gap-4`}>
            <div className={`flex ${isLandscape ? 'flex-col' : 'flex-row'} gap-3`}>
              <GameButton
                size="md"
                variant="warning"
                icon={Icons.exit}
                label="Bajar"
                onPress={handleInteractPress}
                onRelease={handleInteractRelease}
                hapticIntensity={HAPTIC_MEDIUM}
              />
              <GameButton
                size="sm"
                variant="secondary"
                icon={Icons.horn}
                onPress={handleHornPress}
                onRelease={handleHornRelease}
              />
            </div>

            <div className="flex flex-col gap-3">
              <GameButton
                size="lg"
                variant="purple"
                icon={Icons.drift}
                label="Drift"
                onPress={handleRunPress}
                onRelease={handleRunRelease}
                hapticIntensity={HAPTIC_MEDIUM}
              />
              <GameButton
                size="xl"
                variant="danger"
                icon={Icons.jump}
                label="Ollie"
                onPress={handleJumpPress}
                onRelease={handleJumpRelease}
                hapticIntensity={HAPTIC_HEAVY}
                glow
              />
            </div>
          </div>
        ) : (
          // Walking Controls
          <div className={`flex ${isLandscape ? 'flex-row items-end' : 'flex-col items-end'} gap-4`}>
            <div className={`flex ${isLandscape ? 'flex-col' : 'flex-row'} gap-3`}>
              <GameButton
                size="sm"
                variant="warning"
                icon={Icons.horn}
                onPress={handleHornPress}
                onRelease={handleHornRelease}
              />
              <ToggleGameButton
                size="md"
                isActive={isRunLocked}
                onToggle={toggleRunLock}
                activeVariant="success"
                inactiveVariant="secondary"
                activeIcon={Icons.run}
                inactiveIcon={Icons.walk}
                activeLabel="Correr"
                inactiveLabel="Caminar"
              />
            </div>

            <div className="flex flex-col gap-3">
              <GameButton
                size="lg"
                variant="primary"
                icon={Icons.interact}
                label="Usar"
                onPress={handleInteractPress}
                onRelease={handleInteractRelease}
                pulse={hasInteraction}
                glow={hasInteraction}
                hapticIntensity={hasInteraction ? HAPTIC_MEDIUM : HAPTIC_LIGHT}
              />
              <GameButton
                size="xl"
                variant="danger"
                icon={Icons.jump}
                label="Saltar"
                onPress={handleJumpPress}
                onRelease={handleJumpRelease}
                hapticIntensity={HAPTIC_HEAVY}
                glow
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Bar */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        {!isDriving && (
          <PillButton
            icon={Icons.skateboard}
            label="Patinar"
            variant="warning"
            onPress={handleStartSkateboard}
          />
        )}
      </div>

      {/* Context hint */}
      {hasInteraction && !isDriving && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-40 animate-pulse" />
            <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold border border-slate-700 shadow-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              {interactionLabel}
            </div>
          </div>
        </div>
      )}

      {/* Landscape tip */}
      {!isLandscape && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm text-white/70 px-4 py-1.5 rounded-full text-[10px] font-medium flex items-center gap-2 border border-white/10">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Girá para mejor vista
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileControls;
