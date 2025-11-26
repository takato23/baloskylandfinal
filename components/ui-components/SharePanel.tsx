/**
 * SharePanel - Instagram-optimized photo sharing interface
 * Appears after taking a photo with preview, share buttons, and caption editor
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { useGameStore } from '../../store';
import type { SavedPhoto, PhotoFilter } from '../../types/photo-mode';
import { WEEKLY_PHOTO_CHALLENGES } from '../../types/photo-mode';
import {
  downloadImage,
  shareToSocial,
  copyToClipboard,
  copyImageToClipboard,
  generateShareableLink,
  generateHashtags,
  simulateLikes,
  type HashtagContext,
  type PlayerStats,
} from '../../lib/social';

interface SharePanelProps {
  photo: SavedPhoto;
  imageDataUrl: string;
  onClose: () => void;
  onSave?: (photo: SavedPhoto) => void;
}

export function SharePanel({ photo, imageDataUrl, onClose, onSave }: SharePanelProps) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useActivityStore((s) => s.stats);
  const dailyStreak = useActivityStore((s) => s.dailyStreak);
  const savePhoto = useActivityStore((s) => s.savePhoto);
  const photoGallery = useActivityStore((s) => s.photoGallery);

  const isNight = useGameStore((s) => s.isNight);
  const weather = useGameStore((s) => s.weather);

  const MAX_CAPTION_LENGTH = 2200; // Instagram caption limit

  // Generate suggested hashtags based on context
  const suggestedHashtags = generateHashtags({
    filter: photo.filter,
    timeOfDay: photo.timeOfDay,
    weather: photo.weather,
    event: photo.event,
  });

  // Check if photo matches any weekly challenges
  const matchedChallenges = WEEKLY_PHOTO_CHALLENGES.filter(challenge => {
    const req = challenge.requirements;
    if (req.filter && !req.filter.includes(photo.filter)) return false;
    if (req.timeOfDay && !req.timeOfDay.includes(photo.timeOfDay)) return false;
    if (req.weather && !req.weather.includes(photo.weather)) return false;
    if (req.duringEvent && photo.event !== req.duringEvent) return false;
    return true;
  });

  const hasMatchedChallenge = matchedChallenges.length > 0;

  // Initialize with some suggested hashtags
  useEffect(() => {
    if (suggestedHashtags.length > 0) {
      setSelectedHashtags(suggestedHashtags.slice(0, 5));
    }
  }, []);

  const handleShare = useCallback(async (platform: 'instagram' | 'twitter' | 'discord' | 'facebook') => {
    setIsSharing(true);
    setShareSuccess(null);

    try {
      const success = await shareToSocial(imageDataUrl, {
        platform,
        caption,
        hashtags: selectedHashtags,
        url: generateShareableLink(photo, {
          fishCaught: stats.totalFishCaught,
          streak: dailyStreak.currentStreak,
          photosTaken: stats.totalPhotosTaken,
          daysPlayed: stats.daysPlayed,
        }),
      });

      if (success) {
        setShareSuccess(platform);

        // Update photo with share info
        const updatedPhoto: SavedPhoto = {
          ...photo,
          shared: true,
          sharedTo: [...(photo.sharedTo || []), platform],
          likes: photo.likes + simulateLikes(photo),
        };

        savePhoto(updatedPhoto);
        onSave?.(updatedPhoto);

        // Update gallery stats
        setTimeout(() => setShareSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setIsSharing(false);
    }
  }, [imageDataUrl, caption, selectedHashtags, photo, stats, dailyStreak, savePhoto, onSave]);

  const handleDownload = useCallback(() => {
    downloadImage(imageDataUrl, {
      filename: `cozy-city-${Date.now()}-${photo.filter}.png`,
      filter: photo.filter,
      timestamp: photo.takenAt,
    });
    setShareSuccess('download');
    setTimeout(() => setShareSuccess(null), 2000);
  }, [imageDataUrl, photo]);

  const handleCopyImage = useCallback(async () => {
    const success = await copyImageToClipboard(imageDataUrl);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [imageDataUrl]);

  const handleCopyCaption = useCallback(async () => {
    const fullCaption = caption + '\n\n' + selectedHashtags.join(' ');
    const success = await copyToClipboard(fullCaption);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [caption, selectedHashtags]);

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomHashtag = () => {
    const input = prompt('Enter custom hashtag (without #):');
    if (input) {
      const tag = input.startsWith('#') ? input : `#${input}`;
      if (!selectedHashtags.includes(tag)) {
        setSelectedHashtags(prev => [...prev, tag]);
      }
    }
  };

  const remainingChars = MAX_CAPTION_LENGTH - caption.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <span>📸</span>
            <span>Compartir Foto</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Photo Preview */}
          <div className="relative rounded-2xl overflow-hidden mb-6 bg-black/30">
            <img
              src={imageDataUrl}
              alt="Captured photo"
              className="w-full h-auto"
            />

            {/* Stats Overlay Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-3 py-2 rounded-full text-sm transition-colors"
            >
              {showStats ? '👁️ Ocultar Stats' : '📊 Mostrar Stats'}
            </button>

            {/* Stats Overlay */}
            {showStats && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                <div className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <div className="text-white/70 text-sm">Peces Capturados</div>
                    <div className="text-2xl font-bold">🐟 {stats.totalFishCaught}</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm">Racha Diaria</div>
                    <div className="text-2xl font-bold">🔥 {dailyStreak.currentStreak} días</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm">Fotos Tomadas</div>
                    <div className="text-2xl font-bold">📷 {stats.totalPhotosTaken}</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm">Días Jugados</div>
                    <div className="text-2xl font-bold">📅 {stats.daysPlayed}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Challenge Badge */}
            {hasMatchedChallenge && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg animate-pulse">
                <span>🏆</span>
                <span>¡Desafío Completado!</span>
              </div>
            )}
          </div>

          {/* Challenge Info */}
          {hasMatchedChallenge && (
            <div className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <span>🎉</span>
                <span>Desafíos Completados</span>
              </h3>
              <div className="space-y-2">
                {matchedChallenges.map(challenge => (
                  <div key={challenge.id} className="flex items-center gap-3 text-white/90">
                    <span className="text-xl">{challenge.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{challenge.nameEs}</div>
                      <div className="text-sm text-white/70">{challenge.descriptionEs}</div>
                    </div>
                    <div className="text-yellow-400 font-bold">
                      {challenge.reward.type === 'coins' ? `+${challenge.reward.amount} 💰` : '🎁'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caption Editor */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Caption</label>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isOverLimit ? 'text-red-400' : 'text-white/60'}`}>
                  {remainingChars} caracteres restantes
                </span>
                <button
                  onClick={handleCopyCaption}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  {copySuccess ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escribe un caption increíble..."
              className="w-full bg-black/30 text-white rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows={4}
              maxLength={MAX_CAPTION_LENGTH}
            />
          </div>

          {/* Hashtag Suggestions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-white font-medium">Hashtags Sugeridos</label>
              <button
                onClick={addCustomHashtag}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                + Agregar personalizado
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedHashtags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleHashtag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedHashtags.includes(tag)
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedHashtags.length > 0 && (
              <div className="mt-3 text-white/60 text-sm">
                Hashtags seleccionados: {selectedHashtags.length}
              </div>
            )}
          </div>

          {/* Photo Info */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-white/60 mb-1">Filtro</div>
              <div className="text-white font-medium capitalize">{photo.filter}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-white/60 mb-1">Clima</div>
              <div className="text-white font-medium">
                {photo.weather === 'sunny' ? '☀️ Soleado' :
                 photo.weather === 'rain' ? '🌧️ Lluvioso' : '❄️ Nevando'}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-white/60 mb-1">Hora</div>
              <div className="text-white font-medium">
                {photo.timeOfDay === 'morning' ? '🌅 Mañana' :
                 photo.timeOfDay === 'day' ? '☀️ Día' :
                 photo.timeOfDay === 'evening' ? '🌆 Tarde' : '🌙 Noche'}
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Instagram */}
            <button
              onClick={() => handleShare('instagram')}
              disabled={isSharing}
              className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:from-yellow-500 hover:via-pink-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">📷</span>
              <div className="text-left">
                <div>Instagram</div>
                <div className="text-xs font-normal opacity-80">Stories optimizado</div>
              </div>
            </button>

            {/* Twitter */}
            <button
              onClick={() => handleShare('twitter')}
              disabled={isSharing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">🐦</span>
              <div className="text-left">
                <div>Twitter/X</div>
                <div className="text-xs font-normal opacity-80">Compartir tweet</div>
              </div>
            </button>

            {/* Discord */}
            <button
              onClick={() => handleShare('discord')}
              disabled={isSharing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">💬</span>
              <div className="text-left">
                <div>Discord</div>
                <div className="text-xs font-normal opacity-80">Compartir en servidor</div>
              </div>
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-2xl">💾</span>
              <div className="text-left">
                <div>Descargar</div>
                <div className="text-xs font-normal opacity-80">Guardar imagen</div>
              </div>
            </button>
          </div>

          {/* Additional Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyImage}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              {copySuccess ? '✓ Imagen Copiada' : '📋 Copiar Imagen'}
            </button>
            <button
              onClick={() => {
                const link = generateShareableLink(photo, {
                  fishCaught: stats.totalFishCaught,
                  streak: dailyStreak.currentStreak,
                  photosTaken: stats.totalPhotosTaken,
                  daysPlayed: stats.daysPlayed,
                });
                copyToClipboard(link);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
              }}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              {copySuccess ? '✓ Link Copiado' : '🔗 Copiar Link'}
            </button>
          </div>

          {/* Success Message */}
          {shareSuccess && (
            <div className="mt-4 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2">
              <span>✓</span>
              <span>
                {shareSuccess === 'instagram' && '¡Preparado para Instagram Stories!'}
                {shareSuccess === 'twitter' && '¡Abierto para compartir en Twitter!'}
                {shareSuccess === 'discord' && '¡Imagen descargada para Discord!'}
                {shareSuccess === 'download' && '¡Imagen descargada exitosamente!'}
              </span>
            </div>
          )}

          {/* Photo Stats */}
          <div className="mt-6 bg-white/5 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center text-white">
              <div>
                <div className="text-2xl font-bold">{photoGallery.totalPhotos}</div>
                <div className="text-sm text-white/60">Fotos Totales</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{photoGallery.totalShares}</div>
                <div className="text-sm text-white/60">Compartidas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{photoGallery.totalLikes}</div>
                <div className="text-sm text-white/60">Likes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharePanel;
