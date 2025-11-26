/**
 * Multiplayer V2 - Optimized for 50-100+ concurrent players
 * Features:
 * - Spatial grid partitioning with zone-based subscriptions
 * - Delta compression for position updates
 * - LOD system for remote players
 * - Adaptive sync rates based on player density
 * - Interest management (only receive nearby player updates)
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useGameStore } from '../store';
import {
  supabase,
  isSupabaseConfigured,
  PlayerPresence,
} from '../lib/supabase';
import {
  spatialGrid,
  SpatialGrid,
  GRID_CONFIG,
  getZoneChannelName,
  calculateDelta,
  applyDelta,
  type ZoneCoord,
  type PlayerZoneInfo,
  type PositionDelta,
} from '../lib/spatial-grid';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { EmoteData } from '../types/game';

// ============================================
// Configuration
// ============================================

const CONFIG = {
  /** Base sync interval (ms) - adaptive based on player count */
  BASE_SYNC_INTERVAL: 100,
  /** Max sync interval when many players nearby */
  MAX_SYNC_INTERVAL: 250,
  /** Min movement to trigger sync (units) */
  MIN_MOVEMENT_THRESHOLD: 0.05,
  /** Proximity radius for chat (meters) */
  PROXIMITY_RADIUS: 30,
  /** Chat message history limit */
  MAX_CHAT_MESSAGES: 100,
  /** Stale player timeout (ms) */
  STALE_PLAYER_TIMEOUT: 10000,
  /** Cleanup interval (ms) */
  CLEANUP_INTERVAL: 5000,
  /** Zone channel prefix */
  ZONE_PREFIX: 'zone:',
  /** Global presence channel (for low player counts) */
  GLOBAL_CHANNEL: 'game:presence:v2',
  /** Chat channel */
  CHAT_CHANNEL: 'game:chat:v2',
  /** Threshold to switch to zone-based (player count) */
  ZONE_MODE_THRESHOLD: 20,
};

// ============================================
// Types
// ============================================

export interface RemotePlayerV2 {
  odIduserId: string;
  username: string;
  position: [number, number, number];
  targetPosition: [number, number, number];
  rotation: number;
  targetRotation: number;
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
  distance: number;
  lodLevel: 'full' | 'medium' | 'low' | 'hidden';
  zone: ZoneCoord;
  emotes: EmoteData[];
  velocity?: [number, number, number];
}

export interface ChatMessageV2 {
  id: string;
  odIduserId: string;
  username: string;
  text: string;
  color: string;
  timestamp: number;
  type: 'global' | 'proximity' | 'system' | 'zone';
  zone?: string;
}

interface MultiplayerStateV2 {
  isConnected: boolean;
  connectionMode: 'global' | 'zone';
  odIduserId: string;
  username: string;
  userColor: string;
  currentZone: ZoneCoord;
  remotePlayers: Map<string, RemotePlayerV2>;
  chatMessages: ChatMessageV2[];
  onlineCount: number;
  nearbyCount: number;
  localEmotes: EmoteData[];
  lastSyncTime: number;
  lastPosition: [number, number, number] | null;
  lastRotation: number;
}

// ============================================
// Global State
// ============================================

let state: MultiplayerStateV2 = {
  isConnected: false,
  connectionMode: 'global',
  odIduserId: '',
  username: '',
  userColor: '#e91e63',
  currentZone: { x: 0, z: 0 },
  remotePlayers: new Map(),
  chatMessages: [],
  onlineCount: 0,
  nearbyCount: 0,
  localEmotes: [],
  lastSyncTime: 0,
  lastPosition: null,
  lastRotation: 0,
};

// Channels
let globalChannel: RealtimeChannel | null = null;
let chatChannel: RealtimeChannel | null = null;
const zoneChannels: Map<string, RealtimeChannel> = new Map();

// Listeners
const listeners = new Set<() => void>();
const notifyListeners = () => listeners.forEach(l => l());

// ============================================
// User ID
// ============================================

const generateUserId = (): string => {
  const stored = localStorage.getItem('cozy_city_user_id_v2');
  if (stored) return stored;

  const newId = `u_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
  localStorage.setItem('cozy_city_user_id_v2', newId);
  return newId;
};

// ============================================
// Presence Data Compression
// ============================================

interface CompactPresence {
  u: string;  // userId
  n: string;  // username
  p: number[]; // position [x, y, z] * 100 (integers)
  r: number;  // rotation * 100
  c: string;  // character (compact: "type|skin|shirt|pants|acc")
  f: number;  // flags (moving, driving, sitting)
  t: number;  // timestamp
}

const packPresence = (presence: Omit<PlayerPresence, 'lastSeen'>): CompactPresence => ({
  u: presence.odIduserId,
  n: presence.username,
  p: presence.position.map(v => Math.round(v * 100)),
  r: Math.round(presence.rotation * 100),
  c: `${presence.character.type}|${presence.character.skin}|${presence.character.shirt}|${presence.character.pants}|${presence.character.accessory}`,
  f: (presence.isMoving ? 1 : 0) | (presence.isDriving ? 2 : 0) | (presence.isSitting ? 4 : 0),
  t: Date.now(),
});

const unpackPresence = (compact: CompactPresence): PlayerPresence => {
  const [type, skin, shirt, pants, accessory] = compact.c.split('|');
  return {
    odIduserId: compact.u,
    username: compact.n,
    position: compact.p.map(v => v / 100) as [number, number, number],
    rotation: compact.r / 100,
    character: { type, skin, shirt, pants, accessory },
    isMoving: (compact.f & 1) !== 0,
    isDriving: (compact.f & 2) !== 0,
    isSitting: (compact.f & 4) !== 0,
    lastSeen: compact.t,
  };
};

// ============================================
// Zone Channel Management
// ============================================

const subscribeToZone = (zone: ZoneCoord): RealtimeChannel => {
  const channelName = getZoneChannelName(zone);

  if (zoneChannels.has(channelName)) {
    return zoneChannels.get(channelName)!;
  }

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: state.odIduserId },
    },
  });

  channel
    .on('broadcast', { event: 'position' }, ({ payload }) => {
      handlePositionUpdate(payload as CompactPresence);
    })
    .on('broadcast', { event: 'batch' }, ({ payload }) => {
      handleBatchUpdate(payload as CompactPresence[]);
    })
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      handlePresenceSync(presenceState, zone);
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      handlePlayerLeave(key);
    })
    .subscribe();

  zoneChannels.set(channelName, channel);
  return channel;
};

const unsubscribeFromZone = async (zone: ZoneCoord): Promise<void> => {
  const channelName = getZoneChannelName(zone);
  const channel = zoneChannels.get(channelName);

  if (channel) {
    await channel.unsubscribe();
    zoneChannels.delete(channelName);
  }
};

const updateZoneSubscriptions = async (newZone: ZoneCoord): Promise<void> => {
  const interestZones = SpatialGrid.getInterestZones(newZone);
  const interestKeys = new Set(interestZones.map(z => getZoneChannelName(z)));

  // Unsubscribe from zones no longer of interest
  for (const [channelName, channel] of zoneChannels) {
    if (!interestKeys.has(channelName)) {
      await channel.unsubscribe();
      zoneChannels.delete(channelName);
    }
  }

  // Subscribe to new zones of interest
  for (const zone of interestZones) {
    const channelName = getZoneChannelName(zone);
    if (!zoneChannels.has(channelName)) {
      subscribeToZone(zone);
    }
  }
};

// ============================================
// Event Handlers
// ============================================

const handlePositionUpdate = (compact: CompactPresence): void => {
  if (compact.u === state.odIduserId) return;

  const presence = unpackPresence(compact);
  updateRemotePlayer(presence);
};

const handleBatchUpdate = (batch: CompactPresence[]): void => {
  for (const compact of batch) {
    if (compact.u !== state.odIduserId) {
      const presence = unpackPresence(compact);
      updateRemotePlayer(presence);
    }
  }
};

const handlePresenceSync = (presenceState: any, zone: ZoneCoord): void => {
  Object.entries(presenceState).forEach(([key, presences]) => {
    if (key === state.odIduserId) return;

    const presence = (presences as any[])[0];
    if (presence) {
      updateRemotePlayer(presence as PlayerPresence);
    }
  });
};

const handlePlayerLeave = (odIduserId: string): void => {
  const player = state.remotePlayers.get(odIduserId);
  if (player) {
    // System message
    state.chatMessages.push({
      id: `sys_${Date.now()}`,
      odIduserId: 'system',
      username: 'Sistema',
      text: `${player.username} salió del juego`,
      color: '#9c27b0',
      timestamp: Date.now(),
      type: 'system',
    });

    state.remotePlayers.delete(odIduserId);
    spatialGrid.removePlayer(odIduserId);
    state.onlineCount = Math.max(1, state.onlineCount - 1);
    notifyListeners();
  }
};

const updateRemotePlayer = (presence: PlayerPresence): void => {
  const localPos = state.lastPosition || [0, 0, 0];
  const zoneInfo = spatialGrid.updatePlayer(
    presence.odIduserId,
    presence.position,
    localPos as [number, number, number]
  );

  const existing = state.remotePlayers.get(presence.odIduserId);

  // Calculate velocity for prediction
  let velocity: [number, number, number] | undefined;
  if (existing && presence.isMoving) {
    const dt = (presence.lastSeen - existing.lastSeen) / 1000;
    if (dt > 0 && dt < 1) {
      velocity = [
        (presence.position[0] - existing.position[0]) / dt,
        (presence.position[1] - existing.position[1]) / dt,
        (presence.position[2] - existing.position[2]) / dt,
      ];
    }
  }

  const player: RemotePlayerV2 = {
    odIduserId: presence.odIduserId,
    username: presence.username,
    position: existing?.position || presence.position,
    targetPosition: presence.position,
    rotation: existing?.rotation || presence.rotation,
    targetRotation: presence.rotation,
    character: presence.character,
    isMoving: presence.isMoving,
    isDriving: presence.isDriving,
    isSitting: presence.isSitting,
    lastSeen: presence.lastSeen,
    distance: zoneInfo.distance,
    lodLevel: zoneInfo.lodLevel,
    zone: zoneInfo.zone,
    emotes: existing?.emotes || [],
    velocity,
  };

  const isNew = !existing;
  state.remotePlayers.set(presence.odIduserId, player);

  if (isNew) {
    state.onlineCount++;
    state.chatMessages.push({
      id: `sys_${Date.now()}`,
      odIduserId: 'system',
      username: 'Sistema',
      text: `${presence.username} se unió al juego`,
      color: '#9c27b0',
      timestamp: Date.now(),
      type: 'system',
    });
  }

  // Update nearby count
  state.nearbyCount = spatialGrid.getVisiblePlayers(localPos as [number, number, number]).length;

  notifyListeners();
};

// ============================================
// Cleanup
// ============================================

const cleanupStalePlayers = (): void => {
  const now = Date.now();
  const toRemove: string[] = [];

  for (const [odIduserId, player] of state.remotePlayers) {
    if (now - player.lastSeen > CONFIG.STALE_PLAYER_TIMEOUT) {
      toRemove.push(odIduserId);
    }
  }

  for (const odIduserId of toRemove) {
    state.remotePlayers.delete(odIduserId);
    spatialGrid.removePlayer(odIduserId);
  }

  if (toRemove.length > 0) {
    state.onlineCount = state.remotePlayers.size + 1;
    notifyListeners();
  }

  spatialGrid.cleanup();
};

let cleanupInterval: number | null = null;

// ============================================
// Main Hook
// ============================================

export const useMultiplayerV2 = () => {
  const [, forceUpdate] = useState({});
  const odIduserId = useRef(generateUserId());
  const isInitialized = useRef(false);

  const character = useGameStore(s => s.character);
  const playerPosition = useGameStore(s => s.playerPosition);
  const isDriving = useGameStore(s => s.isDriving);
  const isSitting = useGameStore(s => s.isSitting);

  // Subscribe to state changes
  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  // Adaptive sync interval based on nearby players
  const getSyncInterval = useCallback((): number => {
    const nearby = state.nearbyCount;
    if (nearby < 10) return CONFIG.BASE_SYNC_INTERVAL;
    if (nearby < 25) return CONFIG.BASE_SYNC_INTERVAL * 1.5;
    if (nearby < 40) return CONFIG.BASE_SYNC_INTERVAL * 2;
    return CONFIG.MAX_SYNC_INTERVAL;
  }, []);

  // Connect
  const connect = useCallback(async (username: string, color: string = '#e91e63') => {
    if (isInitialized.current || !isSupabaseConfigured()) return;

    state.odIduserId = odIduserId.current;
    state.username = username;
    state.userColor = color;
    state.currentZone = SpatialGrid.getZoneFromPosition(playerPosition as [number, number, number]);
    state.lastPosition = playerPosition as [number, number, number];

    // Initialize global channel (for discovery and low player counts)
    globalChannel = supabase.channel(CONFIG.GLOBAL_CHANNEL, {
      config: {
        broadcast: { self: false },
        presence: { key: odIduserId.current },
      },
    });

    globalChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = globalChannel!.presenceState();
        let count = 0;
        Object.entries(presenceState).forEach(([key, presences]) => {
          if (key !== odIduserId.current) {
            count++;
            const presence = (presences as any[])[0];
            if (presence) {
              updateRemotePlayer(presence as PlayerPresence);
            }
          }
        });
        state.onlineCount = count + 1;

        // Switch to zone mode if too many players
        if (count >= CONFIG.ZONE_MODE_THRESHOLD && state.connectionMode === 'global') {
          state.connectionMode = 'zone';
          updateZoneSubscriptions(state.currentZone);
        }

        notifyListeners();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === odIduserId.current) return;
        const presence = newPresences[0] as PlayerPresence;
        if (presence) {
          updateRemotePlayer(presence);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        handlePlayerLeave(key);
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await globalChannel!.track({
            odIduserId: odIduserId.current,
            username,
            position: playerPosition,
            rotation: 0,
            character: {
              type: character.type,
              skin: character.skin,
              shirt: character.shirt,
              pants: character.pants,
              accessory: character.accessory,
            },
            isMoving: false,
            isDriving: false,
            isSitting: false,
            lastSeen: Date.now(),
          });
        }
      });

    // Initialize chat channel
    chatChannel = supabase.channel(CONFIG.CHAT_CHANNEL);
    chatChannel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        if (payload.userId === odIduserId.current) return;

        // Proximity check if needed
        if (payload.type === 'proximity' && payload.position && state.lastPosition) {
          const distance = SpatialGrid.getDistance(
            payload.position,
            state.lastPosition
          );
          if (distance > CONFIG.PROXIMITY_RADIUS) return;
        }

        state.chatMessages.push({
          id: payload.id,
          odIduserId: payload.userId,
          username: payload.username,
          text: payload.text,
          color: payload.color,
          timestamp: payload.timestamp,
          type: payload.type,
        });

        if (state.chatMessages.length > CONFIG.MAX_CHAT_MESSAGES) {
          state.chatMessages = state.chatMessages.slice(-CONFIG.MAX_CHAT_MESSAGES);
        }

        notifyListeners();
      })
      .on('broadcast', { event: 'emote' }, ({ payload }) => {
        if (payload.userId === odIduserId.current) return;

        const emoteData: EmoteData = {
          id: payload.id,
          emoji: payload.emote,
          action: payload.action,
          timestamp: payload.timestamp,
        };

        const player = state.remotePlayers.get(payload.userId);
        if (player) {
          player.emotes = [...player.emotes, emoteData];
          notifyListeners();
        }
      })
      .subscribe();

    // Start cleanup interval
    cleanupInterval = window.setInterval(cleanupStalePlayers, CONFIG.CLEANUP_INTERVAL);

    state.isConnected = true;
    isInitialized.current = true;
    notifyListeners();
  }, [playerPosition, character]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }

    if (globalChannel) {
      await globalChannel.unsubscribe();
      globalChannel = null;
    }

    if (chatChannel) {
      await chatChannel.unsubscribe();
      chatChannel = null;
    }

    for (const channel of zoneChannels.values()) {
      await channel.unsubscribe();
    }
    zoneChannels.clear();

    state.isConnected = false;
    state.remotePlayers.clear();
    state.onlineCount = 0;
    state.nearbyCount = 0;
    spatialGrid.clear();
    isInitialized.current = false;
    notifyListeners();
  }, []);

  // Sync position
  const syncPosition = useCallback((
    position: [number, number, number],
    rotation: number,
    isMoving: boolean
  ) => {
    const now = Date.now();
    const syncInterval = getSyncInterval();

    if (now - state.lastSyncTime < syncInterval) return;

    // Check if moved enough
    if (state.lastPosition) {
      const distance = SpatialGrid.getDistance(position, state.lastPosition);
      const rotDiff = Math.abs(rotation - state.lastRotation);

      if (distance < CONFIG.MIN_MOVEMENT_THRESHOLD && rotDiff < 0.05 && !isMoving) {
        return;
      }
    }

    state.lastSyncTime = now;
    state.lastPosition = position;
    state.lastRotation = rotation;

    // Check zone change
    const { zoneChanged, newZone } = spatialGrid.updateLocalPlayer(position);

    if (zoneChanged && state.connectionMode === 'zone') {
      state.currentZone = newZone;
      updateZoneSubscriptions(newZone);
    }

    // Build presence update
    const presence: Omit<PlayerPresence, 'lastSeen'> = {
      odIduserId: odIduserId.current,
      username: state.username,
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
    };

    // Send to appropriate channel(s)
    if (state.connectionMode === 'global' && globalChannel) {
      globalChannel.track({
        ...presence,
        lastSeen: now,
      });
    } else {
      // Send to current zone channel
      const zoneChannel = zoneChannels.get(getZoneChannelName(state.currentZone));
      if (zoneChannel) {
        const compact = packPresence(presence);
        zoneChannel.send({
          type: 'broadcast',
          event: 'position',
          payload: compact,
        });
      }

      // Also update global presence (less frequently)
      if (globalChannel && now % 1000 < syncInterval) {
        globalChannel.track({
          ...presence,
          lastSeen: now,
        });
      }
    }
  }, [character, isDriving, isSitting, getSyncInterval]);

  // Send chat message
  const sendMessage = useCallback((text: string, type: 'global' | 'proximity' = 'global') => {
    if (!state.isConnected || !chatChannel) return;

    const message: ChatMessageV2 = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      odIduserId: odIduserId.current,
      username: state.username,
      text,
      color: state.userColor,
      timestamp: Date.now(),
      type,
    };

    state.chatMessages.push(message);
    notifyListeners();

    chatChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        ...message,
        userId: odIduserId.current,
        position: type === 'proximity' ? state.lastPosition : undefined,
      },
    });
  }, []);

  // Send emote
  const doEmote = useCallback((emote: string, action: string) => {
    if (!state.isConnected || !chatChannel) return;

    const emoteData: EmoteData = {
      id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      emoji: emote,
      action: action as any,
      timestamp: Date.now(),
    };

    state.localEmotes.push(emoteData);
    notifyListeners();

    chatChannel.send({
      type: 'broadcast',
      event: 'emote',
      payload: {
        id: emoteData.id,
        userId: odIduserId.current,
        username: state.username,
        emote,
        action,
        position: state.lastPosition,
        timestamp: emoteData.timestamp,
      },
    });
  }, []);

  // Remove emote
  const removeEmote = useCallback((emoteId: string, isLocal: boolean = false) => {
    if (isLocal) {
      state.localEmotes = state.localEmotes.filter(e => e.id !== emoteId);
    } else {
      for (const player of state.remotePlayers.values()) {
        player.emotes = player.emotes.filter(e => e.id !== emoteId);
      }
    }
    notifyListeners();
  }, []);

  return {
    isConnected: state.isConnected,
    isConfigured: isSupabaseConfigured(),
    connectionMode: state.connectionMode,
    odIduserId: odIduserId.current,
    username: state.username,
    currentZone: state.currentZone,
    remotePlayers: Array.from(state.remotePlayers.values()),
    chatMessages: state.chatMessages,
    onlineCount: state.onlineCount,
    nearbyCount: state.nearbyCount,
    localEmotes: state.localEmotes,
    connect,
    disconnect,
    syncPosition,
    sendMessage,
    doEmote,
    removeEmote,
  };
};

// ============================================
// Remote Players Hook with LOD
// ============================================

export const useRemotePlayersV2 = () => {
  const [players, setPlayers] = useState<RemotePlayerV2[]>([]);
  const playerPosition = useGameStore(s => s.playerPosition);

  useEffect(() => {
    const update = () => {
      const visible = spatialGrid.getVisiblePlayers(playerPosition as [number, number, number]);

      const playersWithData = visible
        .map(info => state.remotePlayers.get(info.odIduserId))
        .filter((p): p is RemotePlayerV2 => p !== undefined)
        .map(p => ({
          ...p,
          distance: SpatialGrid.getDistance(p.position, playerPosition as [number, number, number]),
          lodLevel: SpatialGrid.getLODLevel(
            SpatialGrid.getDistance(p.position, playerPosition as [number, number, number])
          ),
        }));

      setPlayers(playersWithData);
    };

    listeners.add(update);
    update();

    return () => { listeners.delete(update); };
  }, [playerPosition]);

  return players;
};

// ============================================
// Stats Hook (for debugging)
// ============================================

export const useMultiplayerStats = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    nearbyPlayers: 0,
    activeZones: 0,
    connectionMode: 'global' as const,
    syncInterval: CONFIG.BASE_SYNC_INTERVAL,
  });

  useEffect(() => {
    const update = () => {
      const zoneStats = spatialGrid.getZoneStats();
      setStats({
        totalPlayers: state.onlineCount,
        nearbyPlayers: state.nearbyCount,
        activeZones: zoneStats.activeZones,
        connectionMode: state.connectionMode,
        syncInterval: state.nearbyCount < 10
          ? CONFIG.BASE_SYNC_INTERVAL
          : state.nearbyCount < 25
            ? CONFIG.BASE_SYNC_INTERVAL * 1.5
            : CONFIG.MAX_SYNC_INTERVAL,
      });
    };

    listeners.add(update);
    const interval = setInterval(update, 1000);

    return () => {
      listeners.delete(update);
      clearInterval(interval);
    };
  }, []);

  return stats;
};

// ============================================
// Hooks for Chat and Online Count
// ============================================

export const useOnlineCountV2 = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(state.onlineCount);
    listeners.add(update);
    update();
    return () => { listeners.delete(update); };
  }, []);

  return count;
};

export const useChatMessagesV2 = () => {
  const [messages, setMessages] = useState<ChatMessageV2[]>([]);

  useEffect(() => {
    const update = () => setMessages([...state.chatMessages]);
    listeners.add(update);
    update();
    return () => { listeners.delete(update); };
  }, []);

  return messages;
};
