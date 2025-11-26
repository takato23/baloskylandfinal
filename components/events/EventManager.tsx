/**
 * Event Manager
 * Central orchestrator for scheduling and managing community events
 */

import React, { useEffect, useState, useCallback } from 'react';
import { TreasureHunt } from './TreasureHunt';
import { SkateRace } from './SkateRace';
import { useEvents } from '../../hooks/useEvents';
import {
  generateEventId,
  broadcastEventStart,
  broadcastEventEnd,
  saveEventToHistory,
  type EventState,
  type EventType,
} from '../../lib/events';

// ============================================
// Event Scheduler
// ============================================

const EVENT_INTERVAL = 30 * 60 * 1000; // 30 minutes
const EVENT_DURATION = 5 * 60 * 1000; // 5 minutes
const COUNTDOWN_DURATION = 30 * 1000; // 30 seconds

const EVENT_TYPES: EventType[] = ['treasure_hunt', 'skate_race'];

// ============================================
// Event Manager Component
// ============================================

export const EventManager: React.FC = () => {
  const { currentEvent, isParticipating, submitFinalScore } = useEvents();
  const [nextEventTime, setNextEventTime] = useState<number>(Date.now() + EVENT_INTERVAL);
  const [eventEnded, setEventEnded] = useState(false);

  // Schedule next event
  const scheduleNextEvent = useCallback(() => {
    const randomType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const startTime = Date.now() + EVENT_INTERVAL;
    const endTime = startTime + EVENT_DURATION;

    const event: EventState = {
      id: generateEventId(),
      type: randomType,
      status: 'scheduled',
      startTime,
      endTime,
      duration: EVENT_DURATION,
      participants: [],
      countdown: Math.floor(EVENT_INTERVAL / 1000),
    };

    setNextEventTime(startTime);
    console.log('Next event scheduled:', event);
  }, []);

  // Start event (can be triggered manually or by timer)
  const startEvent = useCallback((type?: EventType) => {
    const eventType = type || EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const startTime = Date.now();
    const endTime = startTime + EVENT_DURATION;

    const event: EventState = {
      id: generateEventId(),
      type: eventType,
      status: 'starting',
      startTime,
      endTime,
      duration: EVENT_DURATION,
      participants: [],
    };

    // Broadcast event start
    broadcastEventStart(event);

    // Transition to active after countdown
    setTimeout(() => {
      event.status = 'active';
      broadcastEventStart(event);
    }, COUNTDOWN_DURATION);

    console.log('Event started:', event);
  }, []);

  // Initialize with first event
  useEffect(() => {
    scheduleNextEvent();

    // Auto-start first event after 1 minute for testing
    const autoStart = setTimeout(() => {
      startEvent();
    }, 60 * 1000);

    return () => clearTimeout(autoStart);
  }, [scheduleNextEvent, startEvent]);

  // Auto-schedule events
  useEffect(() => {
    const checkSchedule = setInterval(() => {
      const now = Date.now();

      // Start event if time reached
      if (now >= nextEventTime) {
        startEvent();
        scheduleNextEvent();
      }
    }, 1000);

    return () => clearInterval(checkSchedule);
  }, [nextEventTime, startEvent, scheduleNextEvent]);

  // Handle event completion
  const handleEventComplete = useCallback(
    async (score: number, time?: number) => {
      if (!currentEvent) return;

      setEventEnded(true);

      // Submit final score
      await submitFinalScore(score, time);

      // Save to history
      const completedEvent: EventState = {
        ...currentEvent,
        status: 'finished',
      };
      await saveEventToHistory(completedEvent);

      // Broadcast event end
      const leaderboard = {
        eventId: currentEvent.id,
        rankings: [
          {
            userId: 'local_player',
            username: 'Player',
            score,
            time,
          },
        ],
      };
      await broadcastEventEnd(currentEvent.id, leaderboard);

      // Clear event ended state after delay
      setTimeout(() => {
        setEventEnded(false);
      }, 10000);
    },
    [currentEvent, submitFinalScore]
  );

  // Expose manual event trigger (for admin/testing)
  useEffect(() => {
    // @ts-ignore - Add to window for console access
    window.triggerEvent = (type?: EventType) => {
      startEvent(type);
    };

    return () => {
      // @ts-ignore
      delete window.triggerEvent;
    };
  }, [startEvent]);

  // Render active event
  if (!currentEvent || currentEvent.status === 'scheduled') {
    return null;
  }

  return (
    <group>
      {currentEvent.type === 'treasure_hunt' && currentEvent.status === 'active' && (
        <TreasureHunt event={currentEvent} onComplete={handleEventComplete} />
      )}

      {currentEvent.type === 'skate_race' && currentEvent.status === 'active' && (
        <SkateRace event={currentEvent} onComplete={handleEventComplete} />
      )}
    </group>
  );
};

// ============================================
// Admin Controls (Development)
// ============================================

declare global {
  interface Window {
    triggerEvent?: (type?: EventType) => void;
  }
}

// Usage in console:
// window.triggerEvent('treasure_hunt')
// window.triggerEvent('skate_race')
// window.triggerEvent() // random
