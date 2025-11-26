/**
 * PhotoModeUI - Premium Instagram-optimized photo mode
 * Immersive fullscreen experience with professional filters and poses
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { useGameStore } from '../../store';
import {
  FILTER_PRESETS,
  CHARACTER_POSES,
  PHOTO_FRAMES,
  PHOTO_STICKERS,
  WEEKLY_PHOTO_CHALLENGES,
  type PhotoFilter,
  type FrameStyle,
} from '../../types/photo-mode';
import { playSound } from '../../utils/audio';

interface PhotoModeUIProps {
  onCapture?: () => void;
  onShare?: (platform: 'instagram' | 'twitter' | 'discord') => void;
  onClose?: () => void;
}

// ============================================
// Animated Background Component
// ============================================

const AnimatedBokeh = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white/10 blur-xl animate-float"
        style={{
          width: `${40 + Math.random() * 80}px`,
          height: `${40 + Math.random() * 80}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${8 + Math.random() * 7}s`,
        }}
      />
    ))}
  </div>
));

AnimatedBokeh.displayName = 'AnimatedBokeh';

// ============================================
// Filter Preview Card Component
// ============================================

interface FilterCardProps {
  filter: typeof FILTER_PRESETS[0];
  isSelected: boolean;
  onSelect: () => void;
}

const FilterCard = memo(({ filter, isSelected, onSelect }: FilterCardProps) => (
  <button
    onClick={() => {
      playSound('coin');
      onSelect();
    }}
    className={`group relative flex flex-col items-center transition-all duration-300 ${
      isSelected ? 'scale-105' : 'hover:scale-105'
    }`}
  >
    {/* Filter preview */}
    <div
      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
        isSelected
          ? 'ring-4 ring-white shadow-xl shadow-white/30'
          : 'ring-2 ring-white/20 group-hover:ring-white/50'
      }`}
    >
      <div
        className="w-full h-full bg-gradient-to-br from-sky-400 via-purple-400 to-pink-400"
        style={{
          filter: `brightness(${100 + filter.brightness}%) contrast(${100 + filter.contrast}%) saturate(${100 + filter.saturation}%) hue-rotate(${filter.hue}deg)`,
        }}
      >
        {/* Mini character silhouette */}
        <div className="w-full h-full flex items-end justify-center pb-2">
          <div className="w-6 h-8 bg-black/30 rounded-full" />
        </div>
      </div>
    </div>

    {/* Label */}
    <span className={`mt-2 text-xs font-bold transition-all ${
      isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'
    }`}>
      {filter.displayNameEs}
    </span>

    {/* Selected indicator */}
    {isSelected && (
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <span className="text-[10px]">✓</span>
      </div>
    )}
  </button>
));

FilterCard.displayName = 'FilterCard';

// ============================================
// Pose Button Component
// ============================================

interface PoseButtonProps {
  pose: typeof CHARACTER_POSES[0];
  isSelected: boolean;
  onSelect: () => void;
}

const PoseButton = memo(({ pose, isSelected, onSelect }: PoseButtonProps) => (
  <button
    onClick={() => {
      playSound('coin');
      onSelect();
    }}
    disabled={!pose.isUnlocked}
    className={`group relative flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 ${
      !pose.isUnlocked
        ? 'bg-black/30 opacity-50 cursor-not-allowed'
        : isSelected
        ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-purple-500/30 scale-105'
        : 'bg-white/10 hover:bg-white/20 hover:scale-102'
    }`}
  >
    <span className="text-2xl transition-transform group-hover:scale-110">{pose.icon}</span>
    <div className="text-left">
      <span className={`text-sm font-bold block ${isSelected ? 'text-white' : 'text-white/90'}`}>
        {pose.nameEs}
      </span>
      {!pose.isUnlocked && (
        <span className="text-xs text-white/50">Bloqueado</span>
      )}
    </div>
    {!pose.isUnlocked && (
      <span className="absolute top-1 right-1 text-sm">🔒</span>
    )}
  </button>
));

PoseButton.displayName = 'PoseButton';

// ============================================
// Frame Preview Component
// ============================================

interface FramePreviewProps {
  frame: typeof PHOTO_FRAMES[0];
  isSelected: boolean;
  onSelect: () => void;
}

const FramePreview = memo(({ frame, isSelected, onSelect }: FramePreviewProps) => (
  <button
    onClick={() => {
      playSound('coin');
      onSelect();
    }}
    className={`group relative p-2 rounded-2xl transition-all duration-300 ${
      isSelected
        ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg scale-105'
        : 'bg-white/10 hover:bg-white/20'
    }`}
  >
    <div
      className="w-20 h-20 bg-gradient-to-br from-sky-300 to-purple-400 transition-all"
      style={{
        borderWidth: frame.borderWidth / 2,
        borderColor: frame.borderColor,
        borderStyle: 'solid',
        borderRadius: frame.cornerRadius,
        padding: frame.padding / 4,
      }}
    />
    <span className={`block mt-2 text-xs font-bold ${isSelected ? 'text-white' : 'text-white/70'}`}>
      {frame.nameEs}
    </span>
    {isSelected && (
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <span className="text-[10px]">✓</span>
      </div>
    )}
  </button>
));

FramePreview.displayName = 'FramePreview';

// ============================================
// Sticker Picker Component
// ============================================

interface StickerPickerProps {
  stickers: typeof PHOTO_STICKERS;
  onSelectSticker: (sticker: typeof PHOTO_STICKERS[0]) => void;
}

const StickerPicker = memo(({ stickers, onSelectSticker }: StickerPickerProps) => {
  const categories = ['emoji', 'cute', 'seasonal', 'decoration'] as const;
  const categoryNames = {
    emoji: 'Emojis',
    cute: 'Tiernos',
    seasonal: 'Temporada',
    decoration: 'Decoración',
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const categoryStickers = stickers.filter(s => s.category === category && s.isUnlocked);
        if (categoryStickers.length === 0) return null;

        return (
          <div key={category}>
            <h4 className="text-white/70 text-sm font-bold mb-2 flex items-center gap-2">
              {category === 'emoji' && '😊'}
              {category === 'cute' && '💖'}
              {category === 'seasonal' && '🎃'}
              {category === 'decoration' && '✨'}
              {categoryNames[category]}
            </h4>
            <div className="flex flex-wrap gap-2">
              {categoryStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => {
                    playSound('coin');
                    onSelectSticker(sticker);
                  }}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/30 flex items-center justify-center text-2xl transition-all hover:scale-125 active:scale-95"
                  title={sticker.nameEs}
                >
                  {sticker.icon}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

StickerPicker.displayName = 'StickerPicker';

// ============================================
// Camera Controls Panel
// ============================================

interface CameraControlsProps {
  zoom: number;
  fov: number;
  rotation: number;
  tilt: number;
  onZoomChange: (value: number) => void;
  onFovChange: (value: number) => void;
  onRotationChange: (value: number) => void;
  onTiltChange: (value: number) => void;
  depthOfField: boolean;
  onToggleDoF: () => void;
  hideUI: boolean;
  onToggleHideUI: () => void;
}

const CameraControls = memo(({
  zoom, fov, rotation, tilt,
  onZoomChange, onFovChange, onRotationChange, onTiltChange,
  depthOfField, onToggleDoF, hideUI, onToggleHideUI
}: CameraControlsProps) => (
  <div className="space-y-5">
    {/* Zoom */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70 text-sm font-medium flex items-center gap-2">
          <span>🔍</span> Zoom
        </span>
        <span className="text-white font-bold text-sm">{zoom.toFixed(1)}x</span>
      </div>
      <input
        type="range"
        min="0.5"
        max="3"
        step="0.1"
        value={zoom}
        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full bg-white/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
      />
    </div>

    {/* FOV */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70 text-sm font-medium flex items-center gap-2">
          <span>📐</span> Campo visual
        </span>
        <span className="text-white font-bold text-sm">{fov}°</span>
      </div>
      <input
        type="range"
        min="30"
        max="90"
        step="5"
        value={fov}
        onChange={(e) => onFovChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full bg-white/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
      />
    </div>

    {/* Rotation */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70 text-sm font-medium flex items-center gap-2">
          <span>🔄</span> Rotación
        </span>
        <span className="text-white font-bold text-sm">{rotation}°</span>
      </div>
      <input
        type="range"
        min="-180"
        max="180"
        step="5"
        value={rotation}
        onChange={(e) => onRotationChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full bg-white/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
      />
    </div>

    {/* Tilt */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70 text-sm font-medium flex items-center gap-2">
          <span>↕️</span> Inclinación
        </span>
        <span className="text-white font-bold text-sm">{tilt}°</span>
      </div>
      <input
        type="range"
        min="-45"
        max="45"
        step="5"
        value={tilt}
        onChange={(e) => onTiltChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full bg-white/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
      />
    </div>

    {/* Toggles */}
    <div className="flex flex-col gap-3 pt-2">
      <button
        onClick={onToggleDoF}
        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
          depthOfField
            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        <span className="text-white text-sm font-medium flex items-center gap-2">
          <span>🌸</span> Profundidad de campo
        </span>
        <div className={`w-12 h-6 rounded-full transition-all ${depthOfField ? 'bg-white/30' : 'bg-black/30'}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-all ${depthOfField ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
        </div>
      </button>

      <button
        onClick={onToggleHideUI}
        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
          hideUI
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        <span className="text-white text-sm font-medium flex items-center gap-2">
          <span>👁️</span> Ocultar interfaz
        </span>
        <div className={`w-12 h-6 rounded-full transition-all ${hideUI ? 'bg-white/30' : 'bg-black/30'}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-all ${hideUI ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
        </div>
      </button>
    </div>
  </div>
));

CameraControls.displayName = 'CameraControls';

// ============================================
// Challenges Panel Component
// ============================================

const ChallengesPanel = memo(({ onClose }: { onClose: () => void }) => (
  <div className="absolute top-20 right-4 w-80 bg-black/80 backdrop-blur-xl rounded-3xl p-5 pointer-events-auto border border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-white font-black text-lg flex items-center gap-2">
        <span className="text-2xl">🏆</span> Desafíos Semanales
      </h3>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        ✕
      </button>
    </div>
    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
      {WEEKLY_PHOTO_CHALLENGES.map((challenge, index) => (
        <div
          key={challenge.id}
          className="bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-all group cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
              {challenge.icon}
            </div>
            <div className="flex-1">
              <span className="text-white font-bold block">{challenge.nameEs}</span>
              <p className="text-white/60 text-sm mt-1">{challenge.descriptionEs}</p>
              <div className="mt-2 inline-block bg-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-full">
                {challenge.hashtag}
              </div>
            </div>
          </div>
          {/* Progress bar placeholder */}
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${Math.random() * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
));

ChallengesPanel.displayName = 'ChallengesPanel';

// ============================================
// Share Buttons Component
// ============================================

const ShareButtons = memo(({ onShare }: { onShare: (platform: 'instagram' | 'twitter' | 'discord') => void }) => (
  <div className="flex flex-col gap-3">
    <button
      onClick={() => onShare('instagram')}
      className="group w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all"
      title="Compartir en Instagram"
    >
      <span className="group-hover:animate-bounce">📷</span>
    </button>
    <button
      onClick={() => onShare('twitter')}
      className="group w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all"
      title="Compartir en Twitter"
    >
      <span className="group-hover:animate-bounce">🐦</span>
    </button>
    <button
      onClick={() => onShare('discord')}
      className="group w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all"
      title="Compartir en Discord"
    >
      <span className="group-hover:animate-bounce">💬</span>
    </button>
  </div>
));

ShareButtons.displayName = 'ShareButtons';

// ============================================
// Main PhotoModeUI Component
// ============================================

export function PhotoModeUI({ onCapture, onShare, onClose }: PhotoModeUIProps) {
  const [activeTab, setActiveTab] = useState<'filters' | 'poses' | 'frames' | 'stickers' | 'camera'>('filters');
  const [showChallenges, setShowChallenges] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fov, setFov] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [depthOfField, setDepthOfField] = useState(false);
  const [hideUI, setHideUI] = useState(false);

  const photoMode = useActivityStore((s) => s.photoMode);
  const setFilter = useActivityStore((s) => s.setFilter);
  const setFrame = useActivityStore((s) => s.setFrame);
  const setPose = useActivityStore((s) => s.setPose);
  const takePhoto = useActivityStore((s) => s.takePhoto);
  const savePhoto = useActivityStore((s) => s.savePhoto);
  const exitPhotoMode = useActivityStore((s) => s.exitPhotoMode);
  const stats = useActivityStore((s) => s.stats);

  const isNight = useGameStore((s) => s.isNight);
  const weather = useGameStore((s) => s.weather);

  const handleCapture = useCallback(() => {
    setIsCapturing(true);
    setShowFlash(true);
    playSound('camera_shutter');

    setTimeout(() => {
      const photo = takePhoto();
      photo.weather = weather;
      photo.timeOfDay = isNight ? 'night' : 'day';
      savePhoto(photo);
      onCapture?.();
      setShowFlash(false);
      setIsCapturing(false);
    }, 200);
  }, [takePhoto, savePhoto, onCapture, weather, isNight]);

  const handleShare = useCallback((platform: 'instagram' | 'twitter' | 'discord') => {
    playSound('coin');
    onShare?.(platform);
  }, [onShare]);

  const handleClose = useCallback(() => {
    exitPhotoMode();
    onClose?.();
  }, [exitPhotoMode, onClose]);

  const handleAddSticker = useCallback((sticker: typeof PHOTO_STICKERS[0]) => {
    // In a real implementation, this would add sticker to canvas
    console.log('Adding sticker:', sticker.id);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === ' ' || e.key === 'Enter') handleCapture();
      if (e.key === 'h') setHideUI(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleCapture]);

  const tabs = [
    { id: 'filters' as const, label: 'Filtros', icon: '🎨' },
    { id: 'poses' as const, label: 'Poses', icon: '🧍' },
    { id: 'frames' as const, label: 'Marcos', icon: '🖼️' },
    { id: 'stickers' as const, label: 'Stickers', icon: '✨' },
    { id: 'camera' as const, label: 'Cámara', icon: '📷' },
  ];

  if (hideUI) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Flash effect */}
        {showFlash && <div className="absolute inset-0 bg-white animate-flash z-50 pointer-events-none" />}

        {/* Minimal capture button */}
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl z-50"
        >
          <div className="w-16 h-16 rounded-full border-4 border-white/60" />
        </button>

        {/* Show UI button */}
        <button
          onClick={() => setHideUI(false)}
          className="absolute top-4 right-4 px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-full text-sm z-50 hover:bg-black/70 transition-colors"
        >
          Mostrar UI (H)
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Ambient background */}
      <AnimatedBokeh />

      {/* Flash effect */}
      {showFlash && <div className="absolute inset-0 bg-white animate-flash z-50 pointer-events-none" />}

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-40 pointer-events-auto">
        {/* Exit button */}
        <button
          onClick={handleClose}
          className="group flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-5 py-3 rounded-full transition-all hover:scale-105 shadow-lg"
        >
          <span className="text-xl group-hover:rotate-90 transition-transform">✕</span>
          <span className="font-bold">Salir</span>
        </button>

        {/* Photo counter */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-lg">
          <span className="text-xl">📸</span>
          <span className="font-bold">{stats.totalPhotosTaken}</span>
          <span className="text-white/60 text-sm">fotos</span>
        </div>

        {/* Challenges button */}
        <button
          onClick={() => setShowChallenges(!showChallenges)}
          className={`group flex items-center gap-2 px-5 py-3 rounded-full transition-all hover:scale-105 shadow-lg ${
            showChallenges
              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
              : 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500'
          }`}
        >
          <span className="text-xl group-hover:animate-bounce">🏆</span>
          <span className="text-white font-bold">Desafíos</span>
        </button>
      </div>

      {/* Challenges panel */}
      {showChallenges && <ChallengesPanel onClose={() => setShowChallenges(false)} />}

      {/* Share buttons */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
        <ShareButtons onShare={handleShare} />
      </div>

      {/* Bottom controls panel */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-auto">
        {/* Tab content */}
        <div className="bg-black/70 backdrop-blur-xl mx-4 mb-3 rounded-3xl p-5 border border-white/10 max-h-56 overflow-y-auto custom-scrollbar">
          {/* Filters */}
          {activeTab === 'filters' && (
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar-horizontal">
              {FILTER_PRESETS.map((filter) => (
                <FilterCard
                  key={filter.name}
                  filter={filter}
                  isSelected={photoMode.filter === filter.name}
                  onSelect={() => setFilter(filter.name)}
                />
              ))}
            </div>
          )}

          {/* Poses */}
          {activeTab === 'poses' && (
            <div className="space-y-4">
              {(['casual', 'action', 'cute', 'cool', 'funny'] as const).map((category) => {
                const categoryPoses = CHARACTER_POSES.filter(p => p.category === category);
                if (categoryPoses.length === 0) return null;

                const categoryNames = {
                  casual: 'Casual',
                  action: 'Acción',
                  cute: 'Tierno',
                  cool: 'Cool',
                  funny: 'Divertido',
                };

                return (
                  <div key={category}>
                    <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">
                      {categoryNames[category]}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryPoses.map((pose) => (
                        <PoseButton
                          key={pose.id}
                          pose={pose}
                          isSelected={photoMode.pose === pose.id}
                          onSelect={() => setPose(pose.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Frames */}
          {activeTab === 'frames' && (
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar-horizontal">
              {PHOTO_FRAMES.map((frame) => (
                <FramePreview
                  key={frame.id}
                  frame={frame}
                  isSelected={photoMode.frame === frame.id}
                  onSelect={() => setFrame(frame.id)}
                />
              ))}
            </div>
          )}

          {/* Stickers */}
          {activeTab === 'stickers' && (
            <StickerPicker stickers={PHOTO_STICKERS} onSelectSticker={handleAddSticker} />
          )}

          {/* Camera controls */}
          {activeTab === 'camera' && (
            <CameraControls
              zoom={zoom}
              fov={fov}
              rotation={rotation}
              tilt={tilt}
              onZoomChange={setZoom}
              onFovChange={setFov}
              onRotationChange={setRotation}
              onTiltChange={setTilt}
              depthOfField={depthOfField}
              onToggleDoF={() => setDepthOfField(!depthOfField)}
              hideUI={hideUI}
              onToggleHideUI={() => setHideUI(!hideUI)}
            />
          )}
        </div>

        {/* Tab bar with capture button */}
        <div className="bg-black/90 backdrop-blur-xl px-6 py-4 flex items-center justify-center gap-2 border-t border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playSound('coin');
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white scale-105'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className={`ml-4 w-20 h-20 rounded-full bg-white flex items-center justify-center transition-all shadow-2xl border-4 border-white/50 ${
              isCapturing
                ? 'scale-90 opacity-70'
                : 'hover:scale-105 active:scale-95 hover:shadow-white/30'
            }`}
          >
            <div className="w-16 h-16 rounded-full border-4 border-gray-300" />
          </button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-32 left-4 z-30 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md text-white/60 px-3 py-2 rounded-lg text-xs space-y-1">
          <p><span className="text-white font-bold">ESPACIO</span> - Capturar</p>
          <p><span className="text-white font-bold">H</span> - Ocultar UI</p>
          <p><span className="text-white font-bold">ESC</span> - Salir</p>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.4);
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default PhotoModeUI;
