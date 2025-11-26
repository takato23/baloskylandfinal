/**
 * ShareModal Component
 * Instagram-optimized sharing interface for screenshots
 * Designed for a 150k follower Instagram audience
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useGameStore } from '../../store';
import {
  captureScreenshot,
  downloadScreenshot,
  shareScreenshot,
  copyScreenshotToClipboard,
  type ScreenshotOptions,
  type ScreenshotResult,
  INSTAGRAM_STORY,
  INSTAGRAM_POST,
} from '../../utils/screenshot';

interface ShareModalProps {
  onClose: () => void;
}

type ShareFormat = 'story' | 'post' | 'landscape' | 'original';
type ShareFilter = 'none' | 'vintage' | 'warm' | 'cool' | 'dramatic' | 'sunset';

const FORMAT_LABELS: Record<ShareFormat, { label: string; icon: string; desc: string }> = {
  story: { label: 'Story', icon: '📱', desc: '9:16 vertical' },
  post: { label: 'Post', icon: '🖼️', desc: '1:1 cuadrado' },
  landscape: { label: 'Paisaje', icon: '🌅', desc: '1.91:1 horizontal' },
  original: { label: 'Original', icon: '🎮', desc: 'Sin recortar' },
};

const FILTER_LABELS: Record<ShareFilter, { label: string; preview: string }> = {
  none: { label: 'Original', preview: 'grayscale(0)' },
  vintage: { label: 'Vintage', preview: 'sepia(0.4) saturate(0.8)' },
  warm: { label: 'Cálido', preview: 'sepia(0.2) saturate(1.2)' },
  cool: { label: 'Frío', preview: 'hue-rotate(20deg) saturate(1.1)' },
  dramatic: { label: 'Dramático', preview: 'contrast(1.2) saturate(0.9)' },
  sunset: { label: 'Atardecer', preview: 'sepia(0.3) hue-rotate(-10deg) saturate(1.3)' },
};

// Predefined captions for Instagram - Optimizados para @Balosky
const CAPTION_TEMPLATES = [
  '🏙️ Explorando mi ciudad cozy ✨ Hecho por @balosky 🇦🇷\n\n#CozyCityExplorer #GamingArgentina #IndieGame #JuegosArgentinos',
  '🛹 Skateando por las calles de mi ciudad virtual 🎮 @balosky\n\n#Skate #Gaming #Argentina #IndieGameDev',
  '🧉 Tomando unos mates en Cozy City con mi personaje 💚 @balosky\n\n#Mate #GamingArg #CozyCityExplorer',
  '🐻 Mi vecinito favorito de paseo 💕 Juegazo de @balosky!\n\n#AnimalCrossing #Cozy #IndieArgentino #GamesArg',
  '⚽ ¡Vamos Argentina! Mi personaje de la selección 🇦🇷 @balosky\n\n#VamosArgentina #Gaming #CozyCityExplorer',
  '🎮 ¿Te copa? Es gratis y lo hizo @balosky 👆 Link en su bio\n\n#IndieGames #GameDev #Argentina #FreeGame',
  '🌆 Atardecer en mi ciudad cozy 🌇 Probalo gratis! @balosky\n\n#CozyGames #Sunset #Gaming #Aesthetic',
  '🎸 Onda indie, estilo único. Juego argentino de @balosky 🇦🇷\n\n#IndieArgentino #Gaming #CozyCityExplorer',
];

export const ShareModal: React.FC<ShareModalProps> = memo(({ onClose }) => {
  const character = useGameStore((s) => s.character);
  const coins = useGameStore((s) => s.coins);
  const trickCombo = useGameStore((s) => s.trickCombo);
  const isDriving = useGameStore((s) => s.isDriving);

  const [format, setFormat] = useState<ShareFormat>('story');
  const [filter, setFilter] = useState<ShareFilter>('none');
  const [watermark, setWatermark] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [showCopied, setShowCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'success' | 'error'>('idle');

  // Generate preview on options change
  const generatePreview = useCallback(async () => {
    setIsCapturing(true);
    try {
      const result = await captureScreenshot({
        format,
        filter,
        watermark,
        quality: 0.7, // Lower quality for preview
      });
      if (result) {
        setPreview(result.dataUrl);
      }
    } catch (err) {
      console.error('Preview generation failed:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [format, filter, watermark]);

  // Generate initial preview
  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  // Handle download
  const handleDownload = async () => {
    setShareStatus('sharing');
    try {
      const success = await downloadScreenshot({ format, filter, watermark });
      setShareStatus(success ? 'success' : 'error');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  // Handle native share (mobile)
  const handleShare = async () => {
    setShareStatus('sharing');
    try {
      const success = await shareScreenshot(
        { format, filter, watermark },
        {
          title: 'Cozy City Explorer',
          text: CAPTION_TEMPLATES[captionIndex],
        }
      );
      setShareStatus(success ? 'success' : 'error');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  // Handle clipboard copy
  const handleCopy = async () => {
    try {
      const success = await copyScreenshotToClipboard({ format, filter, watermark });
      if (success) {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Copy caption to clipboard
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(CAPTION_TEMPLATES[captionIndex]);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = CAPTION_TEMPLATES[captionIndex];
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  // Cycle through captions
  const nextCaption = () => {
    setCaptionIndex((prev) => (prev + 1) % CAPTION_TEMPLATES.length);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] pointer-events-auto backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto m-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📸</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Compartir</h2>
              <p className="text-xs text-gray-500">Optimizado para Instagram</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="relative">
            <div
              className={`relative rounded-xl overflow-hidden bg-gray-900 ${
                format === 'story' ? 'aspect-[9/16] max-h-80' :
                format === 'post' ? 'aspect-square' :
                format === 'landscape' ? 'aspect-[1.91/1]' : 'aspect-video'
              } mx-auto`}
              style={{ maxWidth: format === 'story' ? '200px' : '100%' }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                </div>
              )}
              {isCapturing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>

            {/* Stats badge */}
            {coins > 0 && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold shadow-md">
                🪙 {coins}
              </div>
            )}
            {isDriving && trickCombo > 1 && (
              <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                🔥 x{trickCombo}
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Formato
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(FORMAT_LABELS) as [ShareFormat, typeof FORMAT_LABELS['story']][]).map(
                ([key, { label, icon, desc }]) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      format === key
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="text-xl block">{icon}</span>
                    <span className="text-xs font-bold block mt-1">{label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Filter Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Filtro
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
              {(Object.entries(FILTER_LABELS) as [ShareFilter, typeof FILTER_LABELS['none']][]).map(
                ([key, { label, preview: cssFilter }]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex-shrink-0 w-16 text-center transition-all ${
                      filter === key ? 'scale-110' : ''
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-xl mb-1 bg-gradient-to-br from-blue-400 to-purple-500 ${
                        filter === key ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                      }`}
                      style={{ filter: cssFilter }}
                    />
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Watermark Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-700">Marca de agua</span>
              <p className="text-xs text-gray-500">Incluir "Cozy City Explorer"</p>
            </div>
            <button
              onClick={() => setWatermark(!watermark)}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                watermark ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  watermark ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Caption Suggestions */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Caption sugerido</span>
              <button
                onClick={nextCaption}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                🔄 Otro
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {CAPTION_TEMPLATES[captionIndex]}
            </p>
            <button
              onClick={handleCopyCaption}
              className="text-xs bg-white px-3 py-1.5 rounded-full font-medium text-purple-600 hover:bg-purple-100 transition-colors shadow-sm"
            >
              {showCopied ? '✓ Copiado!' : '📋 Copiar caption'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action - Share (mobile) or Download (desktop) */}
            {'share' in navigator ? (
              <button
                onClick={handleShare}
                disabled={shareStatus === 'sharing'}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {shareStatus === 'sharing' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Preparando...
                  </>
                ) : shareStatus === 'success' ? (
                  <>✓ Compartido!</>
                ) : (
                  <>
                    <span className="text-xl">📤</span>
                    Compartir en Instagram
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                disabled={shareStatus === 'sharing'}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {shareStatus === 'sharing' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Descargando...
                  </>
                ) : shareStatus === 'success' ? (
                  <>✓ Descargado!</>
                ) : (
                  <>
                    <span className="text-xl">💾</span>
                    Descargar imagen
                  </>
                )}
              </button>
            )}

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>💾</span>
                Guardar
              </button>
              <button
                onClick={handleCopy}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>📋</span>
                {showCopied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Instagram Tips - @Balosky */}
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-xl p-4 text-sm text-gray-600 border border-pink-100">
            <p className="font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📸</span> Tips para tu post
            </p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span>📱</span>
                <span>Usa <strong>Story</strong> para stories/reels (9:16)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🖼️</span>
                <span>El formato <strong>Post</strong> es ideal para el feed (1:1)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🏷️</span>
                <span>Incluí hashtags argentinos como #GamingArgentina #IndieArg</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🇦🇷</span>
                <span><strong>Etiquetá a @balosky</strong> para que te repostee!</span>
              </li>
            </ul>

            {/* Call to action para seguir */}
            <div className="mt-3 pt-3 border-t border-pink-200">
              <a
                href="https://instagram.com/balosky"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-bold py-2 px-4 rounded-lg text-sm hover:opacity-90 transition-all"
              >
                <span>Seguí a @Balosky en Instagram</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ShareModal.displayName = 'ShareModal';
