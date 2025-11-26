/**
 * useEvents Hook
 * React hook for subscribing to event state and managing event participation
 */

import { useEffect, useState, useCallback } from 'react';
import {
  initializeEvents,
  leaveEvents,
  broadcastEventUpdate,
  submitEventScore,
  getEventLeaderboard,
  type EventState,
  type EventBroadcast,
  type PlayerEventProgress,
  type EventLeaderboard,
  type EventType,
} from '../lib/events';
import { useGameStore } from '../store';

interface UseEventsReturn {
  currentEvent: EventState | null;
  isParticipating: boolean;
  leaderboard: EventLeaderboard | null;
  playerProgress: PlayerEventProgress | null;
  allProgress: Map<string, PlayerEventProgress>;
  joinEvent: (eventId: string) => void;
  leaveEvent: () => void;
  updateProgress: (score: number, position?: [number, number, number]) => void;
  submitFinalScore: (score: number, time?: number) => Promise<void>;
}

export const useEvents = (): UseEventsReturn => {
  const [currentEvent, setCurrentEvent] = useState<EventState | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [leaderboard, setLeaderboard] = useState<EventLeaderboard | null>(null);
  const [playerProgress, setPlayerProgress] = useState<PlayerEventProgress | null>(null);
  const [allProgress, setAllProgress] = useState<Map<string, PlayerEventProgress>>(new Map());

  const playerPosition = useGameStore((s) => s.playerPosition);

  // Initialize events channel
  useEffect(() => {
    const handleBroadcast = (broadcast: EventBroadcast) => {
      switch (broadcast.type) {
        case 'event_start':
          setCurrentEvent(broadcast.payload as EventState);
          setLeaderboard(null);
          setAllProgress(new Map());
          break;

        case 'event_update':
          const progress = broadcast.payload as PlayerEventProgress;
          setAllProgress((prev) => {
            const updated = new Map(prev);
            updated.set(progress.userId, progress);
            return updated;
          });
          break;

        case 'event_end':
          setLeaderboard(broadcast.payload as EventLeaderboard);
          setCurrentEvent((prev) => (prev ? { ...prev, status: 'finished' } : null));
          setIsParticipating(false);
          break;

        case 'chest_collected':
          // Handle chest collection notifications
          console.log('Chest collected:', broadcast.payload);
          break;

        case 'checkpoint_passed':
          // Handle checkpoint pass notifications
          console.log('Checkpoint passed:', broadcast.payload);
          break;
      }
    };

    const channel = initializeEvents(handleBroadcast);

    return () => {
      leaveEvents();
    };
  }, []);

  // Join event
  const joinEvent = useCallback((eventId: string) => {
    if (!currentEvent || currentEvent.id !== eventId) return;

    setIsParticipating(true);
    setPlayerProgress({
      userId: 'local_player', // TODO: Get from auth
      username: 'Player', // TODO: Get from profile
      score: 0,
      position: playerPosition,
      lastUpdate: Date.now(),
    });
  }, [currentEvent, playerPosition]);

  // Leave event
  const leaveEvent = useCallback(() => {
    setIsParticipating(false);
    setPlayerProgress(null);
  }, []);

  // Update progress during event
  const updateProgress = useCallback(
    (score: number, position?: [number, number, number]) => {
      if (!isParticipating || !currentEvent || !playerProgress) return;

      const updatedProgress: PlayerEventProgress = {
        ...playerProgress,
        score,
        position: position || playerPosition,
        lastUpdate: Date.now(),
      };

      setPlayerProgress(updatedProgress);
      broadcastEventUpdate(currentEvent.id, updatedProgress);
    },
    [isParticipating, currentEvent, playerProgress, playerPosition]
  );

  // Submit final score at event end
  const submitFinalScore = useCallback(
    async (score: number, time?: number) => {
      if (!currentEvent || !playerProgress) return;

      await submitEventScore(
        currentEvent.id,
        playerProgress.userId,
        playerProgress.username,
        score,
        time
      );

      // Fetch updated leaderboard
      const updatedLeaderboard = await getEventLeaderboard(currentEvent.id);
      setLeaderboard(updatedLeaderboard);
    },
    [currentEvent, playerProgress]
  );

  return {
    currentEvent,
    isParticipating,
    leaderboard,
    playerProgress,
    allProgress,
    joinEvent,
    leaveEvent,
    updateProgress,
    submitFinalScore,
  };
};
