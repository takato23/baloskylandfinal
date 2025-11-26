/**
 * Multiplayer Hooks
 * Real-time player presence and chat for 100+ concurrent users
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../store';
import {
  initializePresence,
  initializeChat,
  updatePresence,
  sendChatMessage,
  sendEmote,
  disconnectAll,
  isSupabaseConfigured,
  PlayerPresence,
  ChatMessagePayload,
  EmotePayload,
} from '../lib/supabase';
import type { RealtimePresenceState } from '@supabase/supabase-js';
import type { EmoteData } from '../types/game';

// ============================================
// Constants
// ============================================

const POSITION_SYNC_INTERVAL = 100; // ms between position updates
const PROXIMITY_RADIUS = 30; // meters for proximity chat
const MAX_VISIBLE_PLAYERS = 50; // Performance limit

// ============================================
// Types
// ============================================

export interface RemotePlayer {
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
  // Interpolation
  targetPosition: [number, number, number];
  targetRotation: number;
  // Emotes
  emotes: EmoteData[];
}

export interface MultiplayerChatMessage {
  id: string;
  odIduserId: string;
  username: string;
  text: string;
  color: string;
  timestamp: number;
  type: 'global' | 'proximity' | 'system';
}

// ============================================
// User ID Generation
// ============================================

const generateUserId = (): string => {
  const stored = localStorage.getItem('cozy_city_user_id');
  if (stored) return stored;

  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('cozy_city_user_id', newId);
  return newId;
};

// ============================================
// Multiplayer State Store Extension
// ============================================

interface MultiplayerState {
  isConnected: boolean;
  odIduserId: string;
  username: string;
  userColor: string;
  remotePlayers: Map<string, RemotePlayer>;
  chatMessages: MultiplayerChatMessage[];
  onlineCount: number;
  localEmotes: EmoteData[];
  playerEmotes: Map<string, EmoteData[]>;
}

// Global state for multiplayer (outside React for performance)
let multiplayerState: MultiplayerState = {
  isConnected: false,
  odIduserId: '',
  username: '',
  userColor: '#e91e63',
  remotePlayers: new Map(),
  chatMessages: [],
  onlineCount: 0,
  localEmotes: [],
  playerEmotes: new Map(),
};

// Listeners for state changes
const listeners = new Set<() => void>();
const notifyListeners = () => listeners.forEach((l) => l());

// ============================================
// Main Multiplayer Hook
// ============================================

export const useMultiplayer = () => {
  const [, forceUpdate] = useState({});
  const odIduserId = useRef(generateUserId());
  const lastPositionUpdate = useRef(0);
  const isInitialized = useRef(false);

  // Get game state
  const character = useGameStore((s) => s.character);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const isDriving = useGameStore((s) => s.isDriving);
  const isSitting = useGameStore((s) => s.isSitting);

  // Subscribe to state changes
  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  // Initialize multiplayer connection
  const connect = useCallback((username: string, color: string = '#e91e63') => {
    if (isInitialized.current || !isSupabaseConfigured()) return;

    multiplayerState.odIduserId = odIduserId.current;
    multiplayerState.username = username;
    multiplayerState.userColor = color;

    // Initialize presence
    initializePresence(
      odIduserId.current,
      // On sync
      (state: RealtimePresenceState<PlayerPresence>) => {
        const newPlayers = new Map<string, RemotePlayer>();
        let count = 0;

        Object.entries(state).forEach(([key, presences]) => {
          if (key === odIduserId.current) return; // Skip self

          const presence = presences[0] as PlayerPresence;
          if (!presence) return;

          count++;
          if (count > MAX_VISIBLE_PLAYERS) return; // Performance limit

          const existing = multiplayerState.remotePlayers.get(key);
          newPlayers.set(key, {
            odIduserId: key,
            username: presence.username,
            position: existing?.position || presence.position,
            rotation: existing?.rotation || presence.rotation,
            targetPosition: presence.position,
            targetRotation: presence.rotation,
            character: presence.character,
            isMoving: presence.isMoving,
            isDriving: presence.isDriving,
            isSitting: presence.isSitting,
            lastSeen: presence.lastSeen,
            emotes: multiplayerState.playerEmotes.get(key) || [],
          });
        });

        multiplayerState.remotePlayers = newPlayers;
        multiplayerState.onlineCount = count + 1; // Include self
        multiplayerState.isConnected = true;
        notifyListeners();
      },
      // On join
      (key: string, presence: PlayerPresence) => {
        if (key === odIduserId.current) return;

        multiplayerState.remotePlayers.set(key, {
          odIduserId: key,
          username: presence.username,
          position: presence.position,
          rotation: presence.rotation,
          targetPosition: presence.position,
          targetRotation: presence.rotation,
          character: presence.character,
          isMoving: presence.isMoving,
          isDriving: presence.isDriving,
          isSitting: presence.isSitting,
          lastSeen: presence.lastSeen,
          emotes: multiplayerState.playerEmotes.get(key) || [],
        });
        multiplayerState.onlineCount++;

        // System message
        multiplayerState.chatMessages.push({
          id: `sys_${Date.now()}`,
          odIduserId: 'system',
          username: 'Sistema',
          text: `${presence.username} se unió al juego`,
          color: '#9c27b0',
          timestamp: Date.now(),
          type: 'system',
        });

        notifyListeners();
      },
      // On leave
      (key: string) => {
        const player = multiplayerState.remotePlayers.get(key);
        if (player) {
          multiplayerState.chatMessages.push({
            id: `sys_${Date.now()}`,
            odIduserId: 'system',
            username: 'Sistema',
            text: `${player.username} salió del juego`,
            color: '#9c27b0',
            timestamp: Date.now(),
            type: 'system',
          });
        }
        multiplayerState.remotePlayers.delete(key);
        multiplayerState.onlineCount = Math.max(1, multiplayerState.onlineCount - 1);
        notifyListeners();
      }
    );

    // Initialize chat
    initializeChat(
      (message: ChatMessagePayload) => {
        // Don't duplicate own messages
        if (message.userId === odIduserId.current) return;

        // Proximity check if needed
        if (message.type === 'proximity' && message.position) {
          const distance = Math.sqrt(
            Math.pow(message.position[0] - playerPosition[0], 2) +
            Math.pow(message.position[2] - playerPosition[2], 2)
          );
          if (distance > PROXIMITY_RADIUS) return;
        }

        multiplayerState.chatMessages.push({
          id: message.id,
          odIduserId: message.userId,
          username: message.username,
          text: message.text,
          color: message.color,
          timestamp: message.timestamp,
          type: message.type,
        });

        // Keep only last 100 messages
        if (multiplayerState.chatMessages.length > 100) {
          multiplayerState.chatMessages = multiplayerState.chatMessages.slice(-100);
        }

        notifyListeners();
      },
      (emotePayload: EmotePayload) => {
        // Don't duplicate own emotes
        if (emotePayload.userId === odIduserId.current) return;

        // Create emote data
        const emoteData: EmoteData = {
          id: emotePayload.id,
          emoji: emotePayload.emote,
          action: emotePayload.action as any,
          timestamp: emotePayload.timestamp,
        };

        // Add to player's emote queue
        const playerEmotes = multiplayerState.playerEmotes.get(emotePayload.userId) || [];
        playerEmotes.push(emoteData);
        multiplayerState.playerEmotes.set(emotePayload.userId, playerEmotes);

        // Update remote player if exists
        const player = multiplayerState.remotePlayers.get(emotePayload.userId);
        if (player) {
          player.emotes = playerEmotes;
        }

        notifyListeners();
      }
    );

    isInitialized.current = true;
    notifyListeners();
  }, [playerPosition]);

  // Disconnect
  const disconnect = useCallback(() => {
    disconnectAll();
    multiplayerState.isConnected = false;
    multiplayerState.remotePlayers.clear();
    multiplayerState.onlineCount = 0;
    isInitialized.current = false;
    notifyListeners();
  }, []);

  // Send position update (throttled)
  const syncPosition = useCallback((
    position: [number, number, number],
    rotation: number,
    isMoving: boolean
  ) => {
    const now = Date.now();
    if (now - lastPositionUpdate.current < POSITION_SYNC_INTERVAL) return;
    lastPositionUpdate.current = now;

    updatePresence({
      odIduserId: odIduserId.current,
      username: multiplayerState.username,
      position,
      rotation,
      character: {
        type: character.type,
        skin: character.skin,
        shirt: character.shirt,
        pants: character.pants,
        accessory: character.accessory,
      },
      isMoving,
      isDriving,
      isSitting,
    });
  }, [character, isDriving, isSitting]);

  // Send chat message
  const sendMessage = useCallback((text: string, type: 'global' | 'proximity' = 'global') => {
    if (!multiplayerState.isConnected) return;

    const message: MultiplayerChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      odIduserId: odIduserId.current,
      username: multiplayerState.username,
      text,
      color: multiplayerState.userColor,
      timestamp: Date.now(),
      type,
    };

    // Add to local state immediately
    multiplayerState.chatMessages.push(message);
    notifyListeners();

    // Send to server
    sendChatMessage({
      userId: odIduserId.current,
      username: multiplayerState.username,
      text,
      color: multiplayerState.userColor,
      type,
      position: type === 'proximity' ? playerPosition as [number, number, number] : undefined,
    });
  }, [playerPosition]);

  // Send emote
  const doEmote = useCallback((emote: string, action: string) => {
    if (!multiplayerState.isConnected) return;

    // Create local emote
    const emoteData: EmoteData = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emoji: emote,
      action: action as any,
      timestamp: Date.now(),
    };

    // Add to local emotes
    multiplayerState.localEmotes.push(emoteData);
    notifyListeners();

    // Send to server
    sendEmote({
      userId: odIduserId.current,
      username: multiplayerState.username,
      emote,
      action,
      position: playerPosition as [number, number, number],
    });
  }, [playerPosition]);

  // Remove completed emote
  const removeEmote = useCallback((emoteId: string, isLocal: boolean = false) => {
    if (isLocal) {
      multiplayerState.localEmotes = multiplayerState.localEmotes.filter(e => e.id !== emoteId);
    } else {
      // Remove from player emotes
      multiplayerState.playerEmotes.forEach((emotes, playerId) => {
        const filtered = emotes.filter(e => e.id !== emoteId);
        if (filtered.length === 0) {
          multiplayerState.playerEmotes.delete(playerId);
        } else {
          multiplayerState.playerEmotes.set(playerId, filtered);
        }

        // Update remote player
        const player = multiplayerState.remotePlayers.get(playerId);
        if (player) {
          player.emotes = filtered;
        }
      });
    }
    notifyListeners();
  }, []);

  return {
    isConnected: multiplayerState.isConnected,
    isConfigured: isSupabaseConfigured(),
    odIduserId: odIduserId.current,
    username: multiplayerState.username,
    remotePlayers: Array.from(multiplayerState.remotePlayers.values()),
    chatMessages: multiplayerState.chatMessages,
    onlineCount: multiplayerState.onlineCount,
    localEmotes: multiplayerState.localEmotes,
    connect,
    disconnect,
    syncPosition,
    sendMessage,
    doEmote,
    removeEmote,
  };
};

// ============================================
// Remote Players Hook (for 3D rendering)
// ============================================

export const useRemotePlayers = () => {
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const playerPosition = useGameStore((s) => s.playerPosition);

  useEffect(() => {
    const update = () => {
      // Sort by distance and limit
      const sorted = Array.from(multiplayerState.remotePlayers.values())
        .map((p) => ({
          ...p,
          distance: Math.sqrt(
            Math.pow(p.position[0] - playerPosition[0], 2) +
            Math.pow(p.position[2] - playerPosition[2], 2)
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, MAX_VISIBLE_PLAYERS);

      setPlayers(sorted);
    };

    listeners.add(update);
    update();

    return () => {
      listeners.delete(update);
    };
  }, [playerPosition]);

  return players;
};

// ============================================
// Online Count Hook
// ============================================

export const useOnlineCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(multiplayerState.onlineCount);
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  return count;
};

// ============================================
// Chat Messages Hook
// ============================================

export const useChatMessages = () => {
  const [messages, setMessages] = useState<MultiplayerChatMessage[]>([]);

  useEffect(() => {
    const update = () => setMessages([...multiplayerState.chatMessages]);
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  return messages;
};
