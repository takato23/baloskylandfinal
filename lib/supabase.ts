/**
 * Supabase Client Configuration
 * Real-time multiplayer backend for Cozy City Explorer
 */

import { createClient, RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables - set these in .env.local
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for presence updates
    },
  },
});

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Track which tables are known to be missing (to avoid repeated 404 errors)
const missingTables = new Set<string>();

// Track tables with in-flight requests to prevent parallel requests to missing tables
const pendingTableChecks = new Map<string, Promise<boolean>>();

/**
 * Check if a table exists and is accessible
 * Caches missing tables to avoid repeated 404 errors
 */
export const isTableAvailable = (tableName: string): boolean => {
  return !missingTables.has(tableName);
};

/**
 * Check if there's already a pending request for this table
 */
export const hasPendingTableCheck = (tableName: string): boolean => {
  return pendingTableChecks.has(tableName);
};

/**
 * Wait for a pending table check to complete
 */
export const waitForTableCheck = async (tableName: string): Promise<boolean> => {
  const pending = pendingTableChecks.get(tableName);
  if (pending) {
    return pending;
  }
  return isTableAvailable(tableName);
};

/**
 * Register that we're starting a request to a table
 * Returns a resolver function to call when the request completes
 */
export const startTableCheck = (tableName: string): (() => void) | null => {
  // If table is already known to be missing, don't start check
  if (missingTables.has(tableName)) {
    return null;
  }

  // If there's already a pending check, don't start another
  if (pendingTableChecks.has(tableName)) {
    return null;
  }

  let resolver: (value: boolean) => void;
  const promise = new Promise<boolean>((resolve) => {
    resolver = resolve;
  });
  pendingTableChecks.set(tableName, promise);

  return () => {
    pendingTableChecks.delete(tableName);
    resolver!(isTableAvailable(tableName));
  };
};

/**
 * Mark a table as missing (called when we get a 404/PGRST205 error)
 */
export const markTableMissing = (tableName: string): void => {
  if (!missingTables.has(tableName)) {
    missingTables.add(tableName);
    // Clear any pending check
    pendingTableChecks.delete(tableName);
    // Only log once per table
    console.warn(`Supabase table '${tableName}' not found. Related features will use local-only mode.`);
  }
};

/**
 * Check if an error indicates a missing table
 */
export const isMissingTableError = (error: any): boolean => {
  if (!error) return false;
  // PGRST205: Could not find the table in the schema cache
  // 404: Table not found
  // Also check for 42P01 (undefined_table) PostgreSQL error
  const code = error.code || error.status?.toString();
  return code === 'PGRST205' || code === '42P01' || code === '404' ||
         error.message?.includes('not found') || error.message?.includes('does not exist');
};

// ============================================
// Channel Names
// ============================================

export const CHANNELS = {
  PRESENCE: 'game:presence',
  CHAT: 'game:chat',
  WORLD: 'game:world',
  EMOTES: 'game:emotes',
} as const;

// ============================================
// Types
// ============================================

export interface PlayerPresence {
  odIduserId: string;
  username: string;
  position: [number, number, number];
  rotation: number;
  character: {
    type: string;
    skin: string;
    shirt: string;
    pants: string;
    accessory: string;
  };
  isMoving: boolean;
  isDriving: boolean;
  isSitting: boolean;
  lastSeen: number;
}

// Alias for backward compatibility
export type { PlayerPresence as UserPresence };

export interface ChatMessagePayload {
  id: string;
  userId: string;
  username: string;
  text: string;
  color: string;
  timestamp: number;
  type: 'global' | 'proximity';
  position?: [number, number, number]; // For proximity chat
}

export interface EmotePayload {
  id: string;
  userId: string;
  username: string;
  emote: string;
  action: string;
  position: [number, number, number];
  timestamp: number;
}

// ============================================
// Presence System
// ============================================

let presenceChannel: RealtimeChannel | null = null;
let chatChannel: RealtimeChannel | null = null;

export const initializePresence = (
  userId: string,
  onPresenceSync: (state: RealtimePresenceState<PlayerPresence>) => void,
  onPresenceJoin: (key: string, newPresence: PlayerPresence) => void,
  onPresenceLeave: (key: string) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Multiplayer features disabled.');
    return null;
  }

  presenceChannel = supabase.channel(CHANNELS.PRESENCE, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel?.presenceState<PlayerPresence>() || {};
      onPresenceSync(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (newPresences[0]) {
        onPresenceJoin(key, newPresences[0] as PlayerPresence);
      }
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      onPresenceLeave(key);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to presence channel');
      }
    });

  return presenceChannel;
};

export const updatePresence = async (presence: Partial<PlayerPresence>) => {
  if (!presenceChannel) return;

  try {
    await presenceChannel.track({
      ...presence,
      lastSeen: Date.now(),
    });
  } catch (error) {
    console.error('Error updating presence:', error);
  }
};

export const leavePresence = async () => {
  if (presenceChannel) {
    await presenceChannel.untrack();
    await presenceChannel.unsubscribe();
    presenceChannel = null;
  }
};

// ============================================
// Chat System
// ============================================

export const initializeChat = (
  onMessage: (message: ChatMessagePayload) => void,
  onEmote?: (emote: EmotePayload) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  chatChannel = supabase.channel(CHANNELS.CHAT);

  chatChannel
    .on('broadcast', { event: 'message' }, ({ payload }) => {
      onMessage(payload as ChatMessagePayload);
    })
    .on('broadcast', { event: 'emote' }, ({ payload }) => {
      // Call emote handler if provided
      if (onEmote) {
        onEmote(payload as EmotePayload);
      }
    })
    .subscribe();

  return chatChannel;
};

export const sendChatMessage = async (message: Omit<ChatMessagePayload, 'id' | 'timestamp'>) => {
  if (!chatChannel) return;

  try {
    await chatChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        ...message,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

export const sendEmote = async (emote: Omit<EmotePayload, 'id' | 'timestamp'>) => {
  if (!chatChannel) return;

  try {
    await chatChannel.send({
      type: 'broadcast',
      event: 'emote',
      payload: {
        ...emote,
        id: `emote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error sending emote:', error);
  }
};

export const leaveChat = async () => {
  if (chatChannel) {
    await chatChannel.unsubscribe();
    chatChannel = null;
  }
};

// ============================================
// Cleanup
// ============================================

export const disconnectAll = async () => {
  await leavePresence();
  await leaveChat();
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    disconnectAll();
  });
}
