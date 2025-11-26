/**
 * Event System - Supabase Integration
 * Real-time community events broadcasting and score tracking
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Vector3 } from '../types';

// ============================================
// Types
// ============================================

export type EventType = 'treasure_hunt' | 'skate_race';
export type EventStatus = 'scheduled' | 'starting' | 'active' | 'ending' | 'finished';

export interface EventState {
  id: string;
  type: EventType;
  status: EventStatus;
  startTime: number;
  endTime: number;
  duration: number; // in milliseconds
  participants: string[]; // user IDs
  countdown?: number; // seconds until start
}

export interface TreasureChestData {
  id: string;
  position: Vector3;
  collected: boolean;
  collectedBy?: string;
  collectedAt?: number;
}

export interface RaceCheckpointData {
  id: string;
  position: Vector3;
  rotation: number;
  index: number;
}

export interface PlayerEventProgress {
  userId: string;
  username: string;
  score: number; // coins collected or checkpoints passed
  position?: Vector3;
  lastUpdate: number;
}

export interface EventLeaderboard {
  eventId: string;
  rankings: Array<{
    userId: string;
    username: string;
    score: number;
    time?: number; // for races
  }>;
}

export interface EventBroadcast {
  type: 'event_start' | 'event_update' | 'event_end' | 'chest_collected' | 'checkpoint_passed';
  eventId: string;
  payload: any;
  timestamp: number;
}

// ============================================
// Channel Management
// ============================================

const EVENTS_CHANNEL = 'game:events';
let eventsChannel: RealtimeChannel | null = null;

export const initializeEvents = (
  onEventBroadcast: (broadcast: EventBroadcast) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Events disabled.');
    return null;
  }

  eventsChannel = supabase.channel(EVENTS_CHANNEL);

  eventsChannel
    .on('broadcast', { event: 'event_state' }, ({ payload }) => {
      onEventBroadcast(payload as EventBroadcast);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to events channel');
      }
    });

  return eventsChannel;
};

export const leaveEvents = async () => {
  if (eventsChannel) {
    await eventsChannel.unsubscribe();
    eventsChannel = null;
  }
};

// ============================================
// Event Broadcasting
// ============================================

export const broadcastEventStart = async (event: EventState) => {
  if (!eventsChannel) return;

  try {
    await eventsChannel.send({
      type: 'broadcast',
      event: 'event_state',
      payload: {
        type: 'event_start',
        eventId: event.id,
        payload: event,
        timestamp: Date.now(),
      } as EventBroadcast,
    });
  } catch (error) {
    console.error('Error broadcasting event start:', error);
  }
};

export const broadcastEventUpdate = async (eventId: string, progress: PlayerEventProgress) => {
  if (!eventsChannel) return;

  try {
    await eventsChannel.send({
      type: 'broadcast',
      event: 'event_state',
      payload: {
        type: 'event_update',
        eventId,
        payload: progress,
        timestamp: Date.now(),
      } as EventBroadcast,
    });
  } catch (error) {
    console.error('Error broadcasting event update:', error);
  }
};

export const broadcastEventEnd = async (eventId: string, leaderboard: EventLeaderboard) => {
  if (!eventsChannel) return;

  try {
    await eventsChannel.send({
      type: 'broadcast',
      event: 'event_state',
      payload: {
        type: 'event_end',
        eventId,
        payload: leaderboard,
        timestamp: Date.now(),
      } as EventBroadcast,
    });
  } catch (error) {
    console.error('Error broadcasting event end:', error);
  }
};

export const broadcastChestCollected = async (eventId: string, chestId: string, userId: string) => {
  if (!eventsChannel) return;

  try {
    await eventsChannel.send({
      type: 'broadcast',
      event: 'event_state',
      payload: {
        type: 'chest_collected',
        eventId,
        payload: { chestId, userId },
        timestamp: Date.now(),
      } as EventBroadcast,
    });
  } catch (error) {
    console.error('Error broadcasting chest collection:', error);
  }
};

export const broadcastCheckpointPassed = async (
  eventId: string,
  userId: string,
  checkpointIndex: number,
  time: number
) => {
  if (!eventsChannel) return;

  try {
    await eventsChannel.send({
      type: 'broadcast',
      event: 'event_state',
      payload: {
        type: 'checkpoint_passed',
        eventId,
        payload: { userId, checkpointIndex, time },
        timestamp: Date.now(),
      } as EventBroadcast,
    });
  } catch (error) {
    console.error('Error broadcasting checkpoint pass:', error);
  }
};

// ============================================
// Score Submission
// ============================================

export const submitEventScore = async (
  eventId: string,
  userId: string,
  username: string,
  score: number,
  time?: number
) => {
  if (!isSupabaseConfigured()) return;

  try {
    // Store in localStorage as fallback
    const scores = JSON.parse(localStorage.getItem(`event_scores_${eventId}`) || '[]');
    scores.push({ userId, username, score, time, timestamp: Date.now() });
    localStorage.setItem(`event_scores_${eventId}`, JSON.stringify(scores));

    console.log(`Score submitted for event ${eventId}:`, { userId, username, score, time });
  } catch (error) {
    console.error('Error submitting score:', error);
  }
};

export const getEventLeaderboard = async (eventId: string): Promise<EventLeaderboard> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const scores = JSON.parse(localStorage.getItem(`event_scores_${eventId}`) || '[]');
    const rankings = scores
      .sort((a: any, b: any) => {
        if (a.score !== b.score) return b.score - a.score; // Higher score first
        return (a.time || Infinity) - (b.time || Infinity); // Lower time wins
      })
      .map((s: any) => ({
        userId: s.userId,
        username: s.username,
        score: s.score,
        time: s.time,
      }));

    return { eventId, rankings };
  }

  // In a real implementation, this would query Supabase
  return { eventId, rankings: [] };
};

// ============================================
// Event History
// ============================================

export const getEventHistory = async (): Promise<EventState[]> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const history = JSON.parse(localStorage.getItem('event_history') || '[]');
    return history;
  }

  // In a real implementation, this would query Supabase
  return [];
};

export const saveEventToHistory = async (event: EventState) => {
  try {
    const history = JSON.parse(localStorage.getItem('event_history') || '[]');
    history.unshift(event);
    // Keep only last 50 events
    if (history.length > 50) {
      history.splice(50);
    }
    localStorage.setItem('event_history', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving event to history:', error);
  }
};

// ============================================
// Utility Functions
// ============================================

export const generateEventId = (): string => {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const isEventActive = (event: EventState): boolean => {
  return event.status === 'active' && Date.now() < event.endTime;
};

export const getTimeRemaining = (event: EventState): number => {
  if (!isEventActive(event)) return 0;
  return Math.max(0, Math.floor((event.endTime - Date.now()) / 1000));
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
