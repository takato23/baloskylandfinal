/**
 * Event Banner
 * UI overlay displaying current event status, timer, and results
 */

import React, { useEffect, useState, memo } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { formatTime, getTimeRemaining } from '../../lib/events';
import type { EventType } from '../../lib/events';

// ============================================
// Event Icon
// ============================================

const EventIcon: React.FC<{ type: EventType }> = ({ type }) => {
  switch (type) {
    case 'treasure_hunt':
      return <span className="text-3xl">💎</span>;
    case 'skate_race':
      return <span className="text-3xl">🛹</span>;
    default:
      return <span className="text-3xl">🎉</span>;
  }
};

// ============================================
// Event Title
// ============================================

const getEventTitle = (type: EventType): string => {
  switch (type) {
    case 'treasure_hunt':
      return 'Búsqueda del Tesoro';
    case 'skate_race':
      return 'Carrera de Skate';
    default:
      return 'Evento Comunitario';
  }
};

const getEventDescription = (type: EventType): string => {
  switch (type) {
    case 'treasure_hunt':
      return '¡Encuentra los cofres dorados antes que nadie!';
    case 'skate_race':
      return '¡Pasa por todos los checkpoints lo más rápido posible!';
    default:
      return '¡Participa y gana premios!';
  }
};

// ============================================
// Countdown Display
// ============================================

interface CountdownProps {
  seconds: number;
}

const Countdown: React.FC<CountdownProps> = memo(({ seconds }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="text-4xl font-black text-white drop-shadow-lg">
        ⏱️ {formatTime(seconds)}
      </div>
    </div>
  );
});

Countdown.displayName = 'Countdown';

// ============================================
// Leaderboard Display
// ============================================

interface LeaderboardProps {
  rankings: Array<{
    userId: string;
    username: string;
    score: number;
    time?: number;
  }>;
  eventType: EventType;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ rankings, eventType }) => {
  return (
    <div className="bg-white rounded-xl border-4 border-black p-4 max-w-md">
      <h3 className="text-2xl font-black text-purple-600 mb-3 text-center">
        🏆 Resultados
      </h3>
      <div className="space-y-2">
        {rankings.slice(0, 10).map((entry, index) => (
          <div
            key={entry.userId}
            className={`flex items-center justify-between p-2 rounded-lg ${
              index === 0
                ? 'bg-gradient-to-r from-yellow-200 to-yellow-300'
                : index === 1
                ? 'bg-gradient-to-r from-gray-200 to-gray-300'
                : index === 2
                ? 'bg-gradient-to-r from-orange-200 to-orange-300'
                : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </span>
              <span className="font-bold text-gray-800">{entry.username}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 font-bold">
              {eventType === 'treasure_hunt' && <span>💰 {entry.score}</span>}
              {eventType === 'skate_race' && entry.time && (
                <span>⏱️ {formatTime(Math.floor(entry.time / 1000))}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// Event Banner Component
// ============================================

export const EventBanner: React.FC = () => {
  const { currentEvent, isParticipating, leaderboard, playerProgress, joinEvent } = useEvents();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);

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

      // Auto-hide results after 15 seconds
      const timeout = setTimeout(() => {
        setShowResults(false);
      }, 15000);

      return () => clearTimeout(timeout);
    }
  }, [currentEvent, leaderboard]);

  // No active event
  if (!currentEvent || currentEvent.status === 'scheduled') {
    return null;
  }

  // Show results
  if (showResults && leaderboard) {
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in duration-300">
        <Leaderboard rankings={leaderboard.rankings} eventType={currentEvent.type} />
        <button
          onClick={() => setShowResults(false)}
          className="mt-4 w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    );
  }

  // Event starting countdown
  if (currentEvent.status === 'starting') {
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl border-4 border-white shadow-2xl p-8 text-center animate-pulse">
          <EventIcon type={currentEvent.type} />
          <h2 className="text-4xl font-black text-white mt-4 drop-shadow-lg">
            {getEventTitle(currentEvent.type)}
          </h2>
          <p className="text-xl text-white/90 mt-2">{getEventDescription(currentEvent.type)}</p>
          <div className="text-6xl font-black text-white mt-6">
            ¡Comienza en {Math.ceil((currentEvent.startTime - Date.now()) / 1000)}s!
          </div>
        </div>
      </div>
    );
  }

  // Active event banner
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl border-4 border-white shadow-2xl p-4 min-w-[400px] pointer-events-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Event Info */}
          <div className="flex items-center gap-3">
            <EventIcon type={currentEvent.type} />
            <div>
              <h3 className="text-xl font-black text-white drop-shadow-md">
                {getEventTitle(currentEvent.type)}
              </h3>
              {isParticipating && playerProgress && (
                <p className="text-sm text-white/90 font-bold">
                  {currentEvent.type === 'treasure_hunt' && `💰 ${playerProgress.score} cofres`}
                  {currentEvent.type === 'skate_race' &&
                    `✅ ${playerProgress.score} checkpoints`}
                </p>
              )}
            </div>
          </div>

          {/* Timer */}
          <Countdown seconds={timeRemaining} />
        </div>

        {/* Join Button */}
        {!isParticipating && (
          <button
            onClick={() => joinEvent(currentEvent.id)}
            className="mt-3 w-full bg-white text-purple-600 font-black py-2 px-4 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95"
          >
            ¡PARTICIPAR! 🎉
          </button>
        )}

        {/* Participants count */}
        <div className="mt-2 text-center text-sm text-white/80 font-semibold">
          {currentEvent.participants.length} jugadores participando
        </div>
      </div>
    </div>
  );
};
