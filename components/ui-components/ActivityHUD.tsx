/**
 * Activity HUD - Premium Animal Crossing-style collecting interface
 * Shows tool wheel, activity status, stats, notifications, and catch celebrations
 */

import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { ToolType, TOOL_TYPES } from '../../types/collectibles';
import { playSound } from '../../utils/audio';

// ============================================
// Constants
// ============================================

const TOOL_NAMES: Record<ToolType, string> = {
  fishing_rod: 'Caña',
  net: 'Red',
  shovel: 'Pala',
  watering_can: 'Regadera',
  axe: 'Hacha',
};

const TOOL_ICONS: Record<ToolType, string> = {
  fishing_rod: '🎣',
  net: '🥅',
  shovel: '⛏️',
  watering_can: '🚿',
  axe: '🪓',
};

const RARITY_CONFIG = {
  common: {
    gradient: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-400/50',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    sparkles: false,
  },
  uncommon: {
    gradient: 'from-green-400 to-emerald-600',
    glow: 'shadow-green-400/50',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    sparkles: false,
  },
  rare: {
    gradient: 'from-blue-400 to-indigo-600',
    glow: 'shadow-blue-400/50',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    sparkles: true,
  },
  legendary: {
    gradient: 'from-purple-500 via-pink-500 to-orange-400',
    glow: 'shadow-purple-500/50',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    sparkles: true,
  },
};

const TOOL_NUMBER_KEYS = ['1', '2', '3', '4', '5'];

// ============================================
// Sparkle Animation Component
// ============================================

const Sparkles: React.FC<{ count?: number; color?: string }> = memo(({ count = 6, color = 'yellow' }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`absolute text-${color}-300 animate-sparkle`}
        style={{
          top: `${20 + Math.random() * 60}%`,
          left: `${10 + Math.random() * 80}%`,
          animationDelay: `${Math.random() * 1.5}s`,
          fontSize: `${10 + Math.random() * 8}px`,
        }}
      >
        ✦
      </div>
    ))}
  </div>
));

Sparkles.displayName = 'Sparkles';

// ============================================
// Notification Toast Component (Enhanced)
// ============================================

interface NotificationToastProps {
  id: string;
  type: 'catch' | 'record' | 'achievement' | 'daily';
  title: string;
  subtitle?: string;
  icon: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = memo(
  ({ id, type, title, subtitle, icon, rarity = 'common', onDismiss }) => {
    const config = RARITY_CONFIG[rarity];

    useEffect(() => {
      const timer = setTimeout(() => onDismiss(id), 5000);
      return () => clearTimeout(timer);
    }, [id, onDismiss]);

    const handleDismiss = useCallback(() => {
      onDismiss(id);
    }, [id, onDismiss]);

    return (
      <div
        className={`
          relative bg-gradient-to-r ${config.gradient} text-white rounded-2xl p-4
          shadow-2xl ${config.glow} shadow-lg border-2 border-white/40
          min-w-[300px] max-w-[360px]
          animate-in slide-in-from-right-full duration-500
          cursor-pointer hover:scale-[1.02] transition-transform
        `}
        onClick={handleDismiss}
      >
        {/* Sparkle effect for rare/legendary */}
        {config.sparkles && <Sparkles />}

        {/* Animated background glow */}
        {(rarity === 'rare' || rarity === 'legendary') && (
          <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse" />
        )}

        {/* Icon badge */}
        <div className="absolute -left-4 -top-4 bg-white rounded-2xl p-3 shadow-xl border-4 border-yellow-400 animate-bounce-in">
          <span className="text-4xl drop-shadow-lg block">{icon}</span>
        </div>

        {/* Content */}
        <div className="ml-12 relative z-10">
          {/* Type badge */}
          {type === 'record' && (
            <span className="inline-block bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full mb-1">
              ¡NUEVO RÉCORD!
            </span>
          )}
          {type === 'achievement' && (
            <span className="inline-block bg-purple-400 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full mb-1">
              ¡LOGRO!
            </span>
          )}

          <h3 className="font-black text-xl drop-shadow-md leading-tight">{title}</h3>
          {subtitle && (
            <p className="text-sm text-white/90 mt-1 italic">"{subtitle}"</p>
          )}

          {/* Rarity indicator */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/20`}>
              {rarity === 'common' && '⭐ Común'}
              {rarity === 'uncommon' && '⭐⭐ Poco común'}
              {rarity === 'rare' && '⭐⭐⭐ Raro'}
              {rarity === 'legendary' && '👑 Legendario'}
            </span>
          </div>
        </div>

        {/* Close hint */}
        <div className="absolute bottom-2 right-3 text-white/50 text-xs">
          Toca para cerrar
        </div>
      </div>
    );
  }
);

NotificationToast.displayName = 'NotificationToast';

// ============================================
// Catch Celebration Screen (Animal Crossing style)
// ============================================

interface CatchCelebrationProps {
  creature: {
    name: string;
    icon: string;
    catchPhrase?: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    size?: string;
    price?: number;
  };
  type: 'fish' | 'bug' | 'fossil';
  isNew: boolean;
  onClose: () => void;
}

const CatchCelebration: React.FC<CatchCelebrationProps> = memo(({ creature, type, isNew, onClose }) => {
  const config = RARITY_CONFIG[creature.rarity];

  useEffect(() => {
    playSound('catch');

    // Auto-close after animation
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Keyboard dismiss
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const actionVerb = type === 'fish' ? '¡Sí! ¡Pesqué' : type === 'bug' ? '¡Lo atrapé!' : '¡Desenterré';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Radial background glow */}
      <div className={`absolute inset-0 bg-gradient-radial from-${creature.rarity === 'legendary' ? 'purple' : creature.rarity === 'rare' ? 'blue' : 'amber'}-500/20 to-transparent`} />

      {/* Confetti for rare/legendary */}
      {(creature.rarity === 'rare' || creature.rarity === 'legendary') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti-celebration"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <div
                className="w-3 h-3"
                style={{
                  backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 5)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main card */}
      <div
        className="relative max-w-md w-full mx-4 animate-in zoom-in-50 slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Speech bubble */}
        <div className={`
          relative bg-gradient-to-br ${config.bg} rounded-3xl p-8
          border-4 ${config.border} shadow-2xl
        `}>
          {/* New badge */}
          {isNew && (
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-black text-sm px-4 py-2 rounded-full shadow-lg border-2 border-white animate-bounce-slow">
              ¡NUEVO!
            </div>
          )}

          {/* Creature display */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              {/* Glow behind icon */}
              <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full blur-2xl opacity-40 scale-150 animate-pulse`} />

              {/* Icon */}
              <span className="relative text-8xl block animate-bounce-celebration drop-shadow-2xl">
                {creature.icon}
              </span>

              {/* Sparkles */}
              {config.sparkles && <Sparkles count={8} />}
            </div>
          </div>

          {/* Catch phrase */}
          <div className="text-center space-y-2">
            <p className={`text-2xl font-black ${config.text}`}>
              {actionVerb} {type === 'bug' ? 'un' : type === 'fish' ? 'un' : 'un'}
            </p>
            <h2 className={`text-3xl font-black ${config.text} uppercase tracking-wide`}>
              {creature.name}!
            </h2>

            {creature.catchPhrase && (
              <p className={`text-lg ${config.text} opacity-80 italic mt-4`}>
                "{creature.catchPhrase}"
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className={`${config.bg} rounded-xl p-3 text-center border ${config.border}`}>
              <span className="text-xs text-gray-500 block">Rareza</span>
              <span className={`font-bold ${config.text}`}>
                {creature.rarity === 'common' && 'Común'}
                {creature.rarity === 'uncommon' && 'Poco común'}
                {creature.rarity === 'rare' && 'Raro'}
                {creature.rarity === 'legendary' && 'Legendario'}
              </span>
            </div>
            {creature.size && (
              <div className={`${config.bg} rounded-xl p-3 text-center border ${config.border}`}>
                <span className="text-xs text-gray-500 block">Tamaño</span>
                <span className={`font-bold ${config.text}`}>{creature.size}</span>
              </div>
            )}
            {creature.price && (
              <div className={`${config.bg} rounded-xl p-3 text-center border ${config.border}`}>
                <span className="text-xs text-gray-500 block">Valor</span>
                <span className={`font-bold ${config.text}`}>{creature.price}🔔</span>
              </div>
            )}
          </div>

          {/* Action hint */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Toca en cualquier lugar para continuar
          </p>
        </div>

        {/* Speech bubble tail */}
        <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 ${config.bg} rotate-45 border-b-4 border-r-4 ${config.border}`} />
      </div>
    </div>
  );
});

CatchCelebration.displayName = 'CatchCelebration';

// ============================================
// Tool Wheel Component (Enhanced)
// ============================================

interface ToolWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolType) => void;
  currentTool: ToolType | null;
  isMobile?: boolean;
}

const ToolWheel: React.FC<ToolWheelProps> = memo(
  ({ isOpen, onClose, onSelectTool, currentTool, isMobile = false }) => {
    const tools = useActivityStore((s) => s.tools.inventory);

    const handleSelectTool = useCallback((tool: ToolType) => {
      playSound('coin');
      onSelectTool(tool);
      onClose();
    }, [onSelectTool, onClose]);

    if (!isOpen) return null;

    // Desktop: Radial menu with enhanced visuals
    if (!isMobile) {
      return (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* Radial wheel */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="relative w-80 h-80 pointer-events-auto animate-in zoom-in-90 duration-300">
              {/* Outer ring glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 blur-xl scale-110" />

              {/* Center circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-2xl flex flex-col items-center justify-center">
                  <span className="text-3xl">🧰</span>
                  <span className="text-[10px] font-bold text-white mt-1">Herramientas</span>
                </div>
              </div>

              {/* Tools arranged in circle */}
              {TOOL_TYPES.map((toolType, index) => {
                const angle = (index / TOOL_TYPES.length) * 360 - 90; // Start from top
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 120;
                const y = Math.sin(rad) * 120;

                const tool = tools.find((t) => t.type === toolType);
                const isEquipped = currentTool === toolType;
                const isAvailable = !!tool;
                const durabilityPercent = tool ? (tool.durability / tool.maxDurability) * 100 : 0;
                const isLowDurability = durabilityPercent < 30;

                return (
                  <button
                    key={toolType}
                    onClick={() => isAvailable && handleSelectTool(toolType)}
                    className={`
                      absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-18 h-18 rounded-2xl flex flex-col items-center justify-center
                      shadow-xl transition-all duration-200
                      ${isAvailable
                        ? isEquipped
                          ? 'bg-gradient-to-br from-green-400 to-emerald-600 scale-115 ring-4 ring-white shadow-green-400/50'
                          : 'bg-gradient-to-br from-blue-400 to-indigo-600 hover:scale-110 cursor-pointer hover:shadow-blue-400/50'
                        : 'bg-gray-400 opacity-40 cursor-not-allowed'
                      }
                      border-3 border-white/60
                    `}
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      width: '72px',
                      height: '72px',
                    }}
                    disabled={!isAvailable}
                    title={`${TOOL_NAMES[toolType]} (${index + 1})`}
                  >
                    <span className="text-3xl drop-shadow-md">{TOOL_ICONS[toolType]}</span>

                    {/* Durability indicator */}
                    {tool && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${isLowDurability ? 'bg-red-400 animate-pulse' : 'bg-white'}`}
                          style={{ width: `${durabilityPercent}%` }}
                        />
                      </div>
                    )}

                    {/* Key hint */}
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Low durability warning */}
                    {isLowDurability && isAvailable && (
                      <span className="absolute -top-2 -left-2 text-lg animate-bounce">⚠️</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hint */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-2xl text-sm whitespace-nowrap flex items-center gap-3">
              <span className="opacity-70">Teclas</span>
              <span className="font-bold">1-5</span>
              <span className="opacity-50">|</span>
              <span className="opacity-70">ESC</span>
              <span className="font-bold">Cerrar</span>
            </div>
          </div>
        </>
      );
    }

    // Mobile: Bottom sheet grid
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Bottom sheet */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-amber-50 to-orange-100 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-t-4 border-amber-400 safe-area-bottom">
          {/* Handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-400 rounded-full" />

          {/* Title */}
          <h3 className="text-xl font-black text-center mb-4 text-amber-900 flex items-center justify-center gap-2">
            <span className="text-2xl">🧰</span>
            Selecciona Herramienta
          </h3>

          {/* Tool grid */}
          <div className="grid grid-cols-3 gap-3">
            {TOOL_TYPES.map((toolType) => {
              const tool = tools.find((t) => t.type === toolType);
              const isEquipped = currentTool === toolType;
              const isAvailable = !!tool;
              const durabilityPercent = tool ? (tool.durability / tool.maxDurability) * 100 : 0;
              const isLowDurability = durabilityPercent < 30;

              return (
                <button
                  key={toolType}
                  onClick={() => isAvailable && handleSelectTool(toolType)}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl shadow-lg
                    transition-all active:scale-95
                    ${isAvailable
                      ? isEquipped
                        ? 'bg-gradient-to-br from-green-400 to-emerald-600 ring-4 ring-green-300'
                        : 'bg-gradient-to-br from-blue-400 to-indigo-600'
                      : 'bg-gray-300 opacity-50'
                    }
                    border-2 border-white/40
                  `}
                  disabled={!isAvailable}
                >
                  <span className="text-4xl">{TOOL_ICONS[toolType]}</span>
                  <span className="text-xs font-bold text-white text-center leading-tight">
                    {TOOL_NAMES[toolType]}
                  </span>

                  {/* Durability bar */}
                  {tool && (
                    <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isLowDurability ? 'bg-red-400 animate-pulse' : 'bg-white'}`}
                        style={{ width: `${durabilityPercent}%` }}
                      />
                    </div>
                  )}

                  {/* Low durability warning */}
                  {isLowDurability && isAvailable && (
                    <span className="absolute top-1 right-1 text-sm">⚠️</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Cerrar
          </button>
        </div>
      </>
    );
  }
);

ToolWheel.displayName = 'ToolWheel';

// ============================================
// Tool Durability Bar Component (Enhanced)
// ============================================

interface ToolDurabilityBarProps {
  tool: ToolType;
  durability: number;
  maxDurability: number;
}

const ToolDurabilityBar: React.FC<ToolDurabilityBarProps> = memo(
  ({ tool, durability, maxDurability }) => {
    const percent = (durability / maxDurability) * 100;
    const isLow = percent < 30;
    const isCritical = percent < 15;

    return (
      <div className={`
        flex items-center gap-3 bg-black/70 backdrop-blur-md rounded-2xl px-4 py-3
        border-2 ${isCritical ? 'border-red-400 animate-pulse' : isLow ? 'border-yellow-400' : 'border-white/20'}
        shadow-lg transition-all
      `}>
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${isCritical ? 'bg-red-500/30' : isLow ? 'bg-yellow-500/30' : 'bg-white/10'}
        `}>
          <span className="text-2xl">{TOOL_ICONS[tool]}</span>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-white text-sm font-bold">{TOOL_NAMES[tool]}</span>
            {isCritical && <span className="text-red-400 text-xs animate-pulse">¡ROTA!</span>}
            {isLow && !isCritical && <span className="text-yellow-400 text-xs">Baja</span>}
          </div>

          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`
                h-full transition-all duration-300 rounded-full
                ${isCritical ? 'bg-red-500 animate-pulse' : isLow ? 'bg-yellow-400' : 'bg-gradient-to-r from-green-400 to-emerald-500'}
              `}
              style={{ width: `${percent}%` }}
            />
          </div>

          <span className="text-white/60 text-[10px]">
            {durability}/{maxDurability} usos
          </span>
        </div>
      </div>
    );
  }
);

ToolDurabilityBar.displayName = 'ToolDurabilityBar';

// ============================================
// Activity Indicators (Enhanced)
// ============================================

const FishingIndicator: React.FC = memo(() => {
  const fishing = useActivityStore((s) => s.fishing);

  if (!fishing.isActive) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl p-4 shadow-xl border-2 border-white/30 min-w-[220px] animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <span className="text-2xl animate-bob">🎣</span>
        </div>
        <div>
          <span className="font-black text-lg block">Pescando</span>
          <span className="text-xs text-white/80">Mantente atento...</span>
        </div>
      </div>

      {fishing.stage === 'waiting' && (
        <div className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
          <span className="text-sm">Esperando un pez...</span>
        </div>
      )}

      {fishing.stage === 'bite' && (
        <div className="bg-yellow-400 text-yellow-900 rounded-xl p-3 text-center animate-pulse">
          <span className="font-black text-lg">¡PICA! ¡Presiona E!</span>
        </div>
      )}

      {fishing.stage === 'reeling' && fishing.fishOnHook && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Enrollando...</span>
            <span className="font-bold">{fishing.fishOnHook.name}</span>
          </div>

          {/* Tension meter */}
          <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`
                absolute inset-y-0 left-0 rounded-full transition-all duration-100
                ${fishing.tension > 80 ? 'bg-red-500 animate-pulse' : fishing.tension > 50 ? 'bg-yellow-400' : 'bg-green-400'}
              `}
              style={{ width: `${fishing.tension}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
              TENSIÓN
            </div>
          </div>

          <div className="flex justify-between text-xs text-white/80">
            <span>Tamaño: {fishing.fishOnHook.size}</span>
            <span>{fishing.tension > 80 ? '¡CUIDADO!' : fishing.tension > 50 ? 'Tensión alta' : 'Estable'}</span>
          </div>
        </div>
      )}
    </div>
  );
});

FishingIndicator.displayName = 'FishingIndicator';

const BugCatchingIndicator: React.FC = memo(() => {
  const bugCatching = useActivityStore((s) => s.bugCatching);

  if (!bugCatching.isActive) return null;

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-4 shadow-xl border-2 border-white/30 min-w-[220px] animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <span className="text-2xl">🥅</span>
        </div>
        <div>
          <span className="font-black text-lg block">Cazando</span>
          <span className="text-xs text-white/80">Acércate con cuidado</span>
        </div>
      </div>

      {bugCatching.stage === 'sneaking' && (
        <div className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
          <span className="animate-pulse">🤫</span>
          <span className="text-sm">Acercándote sigilosamente...</span>
        </div>
      )}

      {bugCatching.swingCooldown > Date.now() && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Recargando red...</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: `${Math.max(0, ((bugCatching.swingCooldown - Date.now()) / 500) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

BugCatchingIndicator.displayName = 'BugCatchingIndicator';

const DiggingIndicator: React.FC = memo(() => {
  const digging = useActivityStore((s) => s.digging);

  if (!digging.isActive) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-4 shadow-xl border-2 border-white/30 min-w-[220px] animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <span className="text-2xl animate-dig">⛏️</span>
        </div>
        <div>
          <span className="font-black text-lg block">Excavando</span>
          <span className="text-xs text-white/80">¿Qué habrá enterrado?</span>
        </div>
      </div>

      {digging.stage === 'digging' && (
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex gap-1 justify-center">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>💨</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>💨</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>💨</span>
          </div>
        </div>
      )}
    </div>
  );
});

DiggingIndicator.displayName = 'DiggingIndicator';

// ============================================
// Quick Stats Bar (Enhanced)
// ============================================

const QuickStatsBar: React.FC = memo(() => {
  const nookMiles = useActivityStore((s) => s.nookMiles);
  const dailyStreak = useActivityStore((s) => s.dailyStreak);
  const caughtFish = useActivityStore((s) => s.caughtFish);
  const caughtBugs = useActivityStore((s) => s.caughtBugs);

  // Calculate today's catches
  const dayAgo = Date.now() - 86400000;
  const todaysCatches = useMemo(() => {
    const recentFish = caughtFish.filter((f) => f.caughtAt > dayAgo).length;
    const recentBugs = caughtBugs.filter((b) => b.caughtAt > dayAgo).length;
    return recentFish + recentBugs;
  }, [caughtFish, caughtBugs, dayAgo]);

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl px-3 py-2 shadow-lg border-2 border-amber-300">
      {/* Today's catches */}
      <div className="flex items-center gap-1.5 px-2">
        <span className="text-lg">🎣</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] text-amber-700 font-medium">Hoy</span>
          <span className="text-sm font-black text-amber-900">{todaysCatches}</span>
        </div>
      </div>

      <div className="w-px h-8 bg-amber-300" />

      {/* Streak */}
      <div className="flex items-center gap-1.5 px-2">
        <span className="text-lg">🔥</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] text-amber-700 font-medium">Racha</span>
          <span className="text-sm font-black text-amber-900">{dailyStreak.currentStreak}d</span>
        </div>
      </div>

      <div className="w-px h-8 bg-amber-300" />

      {/* Nook Miles */}
      <div className="flex items-center gap-1.5 px-2">
        <span className="text-lg">✈️</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] text-amber-700 font-medium">Millas</span>
          <span className="text-sm font-black text-amber-900">{nookMiles.total}</span>
        </div>
      </div>
    </div>
  );
});

QuickStatsBar.displayName = 'QuickStatsBar';

// ============================================
// Mini Critterpedia Button (Enhanced)
// ============================================

interface MiniCritterpediaButtonProps {
  onClick: () => void;
}

const MiniCritterpediaButton: React.FC<MiniCritterpediaButtonProps> = memo(({ onClick }) => {
  const collection = useActivityStore((s) => s.collection);

  const totalFish = 80;
  const totalBugs = 80;
  const total = totalFish + totalBugs;
  const caught = collection.fish.caught.length + collection.bugs.caught.length;
  const percent = Math.round((caught / total) * 100);

  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-2xl px-4 py-3 shadow-xl border-2 border-white/30 hover:scale-105 active:scale-95 transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl group-hover:animate-bounce-slow">📖</span>
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium text-white/90">Critterpedia</span>
          <span className="text-xl font-black">{percent}%</span>
        </div>
      </div>
      <div className="mt-2 w-full h-2.5 bg-white/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </button>
  );
});

MiniCritterpediaButton.displayName = 'MiniCritterpediaButton';

// ============================================
// Main Activity HUD Component
// ============================================

interface Notification {
  id: string;
  type: 'catch' | 'record' | 'achievement' | 'daily';
  title: string;
  subtitle?: string;
  icon: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface ActivityHUDProps {
  isMobile?: boolean;
  onOpenCritterpedia?: () => void;
}

export const ActivityHUD: React.FC<ActivityHUDProps> = memo(({ isMobile = false, onOpenCritterpedia }) => {
  const [toolWheelOpen, setToolWheelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [catchCelebration, setCatchCelebration] = useState<CatchCelebrationProps | null>(null);

  // Store selectors
  const tools = useActivityStore((s) => s.tools);
  const equipTool = useActivityStore((s) => s.equipTool);
  const fishing = useActivityStore((s) => s.fishing);

  const currentTool = tools.equipped;
  const currentToolData = useMemo(
    () => tools.inventory.find((t) => t.type === currentTool),
    [tools.inventory, currentTool]
  );

  // Tool wheel handlers
  const handleOpenToolWheel = useCallback(() => {
    setToolWheelOpen(true);
    playSound('coin');
  }, []);

  const handleCloseToolWheel = useCallback(() => {
    setToolWheelOpen(false);
  }, []);

  const handleSelectTool = useCallback((tool: ToolType) => {
    equipTool(tool);
  }, [equipTool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const index = TOOL_NUMBER_KEYS.indexOf(e.key);
      if (index !== -1) {
        const toolType = TOOL_TYPES[index];
        const tool = tools.inventory.find((t) => t.type === toolType);
        if (tool) {
          equipTool(toolType);
          playSound('coin');
        }
      }

      if (e.key === 'Tab' && !isMobile) {
        e.preventDefault();
        setToolWheelOpen((prev) => !prev);
      }

      if (e.key === 'Escape' && toolWheelOpen) {
        setToolWheelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tools.inventory, equipTool, isMobile, toolWheelOpen]);

  // Notification system
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Watch for catches and show celebration
  useEffect(() => {
    if (fishing.stage === 'caught' && fishing.fishOnHook) {
      const fish = fishing.fishOnHook;
      setCatchCelebration({
        creature: {
          name: fish.name,
          icon: fish.icon,
          catchPhrase: fish.catchPhrase,
          rarity: fish.rarity,
          size: fish.size,
          price: fish.price,
        },
        type: 'fish',
        isNew: true, // Would check against collection
        onClose: () => setCatchCelebration(null),
      });
    }
  }, [fishing.stage, fishing.fishOnHook]);

  return (
    <>
      {/* Catch Celebration */}
      {catchCelebration && (
        <CatchCelebration {...catchCelebration} />
      )}

      {/* Tool Wheel */}
      <ToolWheel
        isOpen={toolWheelOpen}
        onClose={handleCloseToolWheel}
        onSelectTool={handleSelectTool}
        currentTool={currentTool}
        isMobile={isMobile}
      />

      {/* Top-left: Tool selector + durability */}
      <div className="fixed top-20 left-4 z-30 flex flex-col gap-2 pointer-events-auto">
        {currentToolData && (
          <ToolDurabilityBar
            tool={currentToolData.type}
            durability={currentToolData.durability}
            maxDurability={currentToolData.maxDurability}
          />
        )}

        {/* Tool wheel button (mobile) */}
        {isMobile && (
          <button
            onClick={handleOpenToolWheel}
            className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl p-3 shadow-xl border-2 border-white/30 active:scale-95 transition-transform flex items-center gap-2"
          >
            <span className="text-xl">🧰</span>
            <span className="text-sm font-bold">Herramientas</span>
          </button>
        )}
      </div>

      {/* Top-center: Activity status indicators */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 pointer-events-auto">
        <FishingIndicator />
        <BugCatchingIndicator />
        <DiggingIndicator />
      </div>

      {/* Top-right: Quick stats + Critterpedia */}
      <div className="fixed top-4 right-4 z-30 flex flex-col gap-2 items-end pointer-events-auto">
        <QuickStatsBar />
        {onOpenCritterpedia && (
          <MiniCritterpediaButton onClick={onOpenCritterpedia} />
        )}
      </div>

      {/* Bottom-right: Notifications */}
      <div className="fixed bottom-24 right-4 z-30 flex flex-col gap-3 items-end pointer-events-auto max-w-[360px]">
        {notifications.map((notif) => (
          <NotificationToast
            key={notif.id}
            {...notif}
            onDismiss={dismissNotification}
          />
        ))}
      </div>

      {/* Desktop hint */}
      {!isMobile && !toolWheelOpen && (
        <div className="fixed bottom-20 left-4 z-30 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-xl text-xs space-y-1">
            <p className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded font-bold">TAB</span>
              <span className="opacity-70">Herramientas</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded font-bold">1-5</span>
              <span className="opacity-70">Cambio rápido</span>
            </p>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        .animate-sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }

        @keyframes bounce-in {
          0% { transform: scale(0) rotate(-45deg); }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.5s ease-in-out infinite;
        }

        @keyframes bounce-celebration {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-20px) scale(1.1); }
          50% { transform: translateY(-10px) scale(1.05); }
          75% { transform: translateY(-15px) scale(1.08); }
        }
        .animate-bounce-celebration {
          animation: bounce-celebration 1s ease-in-out infinite;
        }

        @keyframes confetti-celebration {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-celebration {
          animation: confetti-celebration ease-out forwards;
        }

        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-3px) rotate(5deg); }
        }
        .animate-bob {
          animation: bob 1s ease-in-out infinite;
        }

        @keyframes dig {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        .animate-dig {
          animation: dig 0.3s ease-in-out infinite;
        }

        .safe-area-bottom {
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  );
});

ActivityHUD.displayName = 'ActivityHUD';

export default ActivityHUD;
