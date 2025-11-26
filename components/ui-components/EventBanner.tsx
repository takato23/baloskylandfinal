/**
 * Event Banner
 * Minimal, non-intrusive event notification system
 * Only shows when real multiplayer events are active
 */

import React, { useEffect, useState, memo } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { formatTime, getTimeRemaining } from '../../lib/events';
import type { EventType } from '../../lib/events';

// ============================================
// Event Config
// ============================================

const EVENT_CONFIG: Record<EventType, { icon: string; title: string; description: string }> = {
  treasure_hunt: {
    icon: '💎',
    title: 'Búsqueda del Tesoro',
    description: '¡Encuentra los cofres dorados!',
  },
  skate_race: {
    icon: '🛹',
    title: 'Carrera de Skate',
    description: '¡Pasa por los checkpoints!',
  },
};

// ============================================
// Leaderboard Modal
// ============================================

interface LeaderboardProps {
  rankings: Array<{
    userId: string;
    username: string;
    score: number;
    time?: number;
  }>;
  eventType: EventType;
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ rankings, eventType, onClose }) => {
  const config = EVENT_CONFIG[eventType] || { icon: '🎉', title: 'Evento' };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <span>{config.icon}</span>
            Resultados
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {rankings.slice(0, 10).map((entry, index) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-2.5 rounded-xl ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300'
                  : index === 1
                  ? 'bg-gradient-to-r from-gray-100 to-slate-100 border border-gray-300'
                  : index === 2
                  ? 'bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold w-6">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </span>
                <span className="font-semibold text-gray-800 text-sm">{entry.username}</span>
              </div>
              <span className="text-sm font-bold text-gray-600">
                {eventType === 'treasure_hunt' && `${entry.score} 💎`}
                {eventType === 'skate_race' && entry.time && formatTime(Math.floor(entry.time / 1000))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Event Banner Component
// Minimal, non-intrusive - only shows for real events
// ============================================

export const EventBanner: React.FC = () => {
  const { currentEvent, isParticipating, leaderboard, playerProgress, joinEvent } = useEvents();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Update timer
  useEffect(() => {
    if (!currentEvent || currentEvent.status !== 'active') {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = getTimeRemaining(currentEvent);
      setTimeRemaining(remaining);

      if (remaining === 0 && !showResults) {
        setShowResults(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentEvent, showResults]);

  // Show results when event ends
  useEffect(() => {
    if (currentEvent?.status === 'finished' && leaderboard) {
      setShowResults(true);
    }
  }, [currentEvent, leaderboard]);

  // Reset dismissed state when new event starts
  useEffect(() => {
    if (currentEvent?.id) {
      setIsDismissed(false);
    }
  }, [currentEvent?.id]);

  // No active event - don't show anything
  if (!currentEvent || currentEvent.status === 'scheduled') {
    return null;
  }

  // Show results modal
  if (showResults && leaderboard) {
    return (
      <Leaderboard
        rankings={leaderboard.rankings}
        eventType={currentEvent.type}
        onClose={() => setShowResults(false)}
      />
    );
  }

  const config = EVENT_CONFIG[currentEvent.type] || { icon: '🎉', title: 'Evento', description: '¡Participa!' };

  // Event starting countdown - compact toast
  if (currentEvent.status === 'starting') {
    const countdown = Math.ceil((currentEvent.startTime - Date.now()) / 1000);
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-300">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="font-bold text-sm">{config.title}</p>
            <p className="text-xs text-white/80">Comienza en {countdown}s</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show if dismissed and not participating
  if (isDismissed && !isParticipating) {
    return null;
  }

  // Active event - minimal bottom pill
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-md text-white rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3 border border-white/10">
        <span className="text-xl">{config.icon}</span>

        <div className="flex flex-col">
          <span className="font-bold text-sm leading-tight">{config.title}</span>
          {isParticipating && playerProgress ? (
            <span className="text-xs text-green-400">
              {currentEvent.type === 'treasure_hunt' && `${playerProgress.score} 💎`}
              {currentEvent.type === 'skate_race' && `${playerProgress.score} ✅`}
            </span>
          ) : (
            <span className="text-xs text-white/60">{currentEvent.participants.length} jugando</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm font-mono bg-white/10 px-2 py-1 rounded-lg">
          <span>⏱</span>
          <span>{formatTime(timeRemaining)}</span>
        </div>

        {!isParticipating ? (
          <button
            onClick={() => joinEvent(currentEvent.id)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            Unirse
          </button>
        ) : (
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/40 hover:text-white/70 text-xs px-1"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
