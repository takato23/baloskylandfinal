/**
 * Leaderboard System
 * Real-time leaderboard with daily/weekly/all-time rankings
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Database } from './database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  coins: number;
  characterType: string;
  characterSkin: string;
  characterShirt: string;
  characterPants: string;
  characterAccessory: string;
  rank: number;
  dailyCoins: number;
  weeklyCoins: number;
  lastDailyReset: string;
  lastWeeklyReset: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentPlayerRank: number | null;
  currentPlayerEntry: LeaderboardEntry | null;
  totalPlayers: number;
}

// ============================================
// Local Cache
// ============================================

interface LeaderboardCache {
  data: LeaderboardData | null;
  period: LeaderboardPeriod;
  timestamp: number;
}

let cache: LeaderboardCache = {
  data: null,
  period: 'alltime',
  timestamp: 0,
};

const CACHE_TTL = 30000; // 30 seconds

// ============================================
// Helper Functions
// ============================================

function mapRowToEntry(row: Database['public']['Tables']['leaderboard']['Row']): LeaderboardEntry {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    coins: row.coins,
    characterType: row.character_type,
    characterSkin: row.character_skin,
    characterShirt: row.character_shirt,
    characterPants: row.character_pants,
    characterAccessory: row.character_accessory,
    rank: row.rank,
    dailyCoins: row.daily_coins,
    weeklyCoins: row.weekly_coins,
    lastDailyReset: row.last_daily_reset,
    lastWeeklyReset: row.last_weekly_reset,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// Leaderboard Operations
// ============================================

/**
 * Fetch leaderboard data for a given period
 */
export async function fetchLeaderboard(
  period: LeaderboardPeriod = 'alltime',
  currentUserId?: string,
  limit: number = 10
): Promise<LeaderboardData> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Using cached leaderboard data.');
    return cache.data || { entries: [], currentPlayerRank: null, currentPlayerEntry: null, totalPlayers: 0 };
  }

  // Check cache
  const now = Date.now();
  if (cache.data && cache.period === period && now - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  try {
    // Determine which column to sort by
    const sortColumn = period === 'daily' ? 'daily_coins' : period === 'weekly' ? 'weekly_coins' : 'coins';

    // Fetch top players
    const { data: topPlayers, error: topError } = await supabase
      .from('leaderboard')
      .select('*')
      .order(sortColumn, { ascending: false })
      .limit(limit);

    if (topError) throw topError;

    // Get total player count
    const { count: totalPlayers, error: countError } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Fetch current player's entry if userId provided
    let currentPlayerEntry: LeaderboardEntry | null = null;
    let currentPlayerRank: number | null = null;

    if (currentUserId) {
      const { data: playerData, error: playerError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (!playerError && playerData) {
        currentPlayerEntry = mapRowToEntry(playerData);

        // Calculate rank based on period
        const { count: rank, error: rankError } = await supabase
          .from('leaderboard')
          .select('*', { count: 'exact', head: true })
          .gt(sortColumn, currentPlayerEntry[period === 'daily' ? 'dailyCoins' : period === 'weekly' ? 'weeklyCoins' : 'coins']);

        if (!rankError && rank !== null) {
          currentPlayerRank = rank + 1;
        }
      }
    }

    const entries = (topPlayers || []).map(mapRowToEntry);

    const leaderboardData: LeaderboardData = {
      entries,
      currentPlayerRank,
      currentPlayerEntry,
      totalPlayers: totalPlayers || 0,
    };

    // Update cache
    cache = {
      data: leaderboardData,
      period,
      timestamp: now,
    };

    return leaderboardData;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return cache.data || { entries: [], currentPlayerRank: null, currentPlayerEntry: null, totalPlayers: 0 };
  }
}

/**
 * Submit or update player score
 */
export async function submitScore(
  userId: string,
  username: string,
  coins: number,
  character: {
    type: string;
    skin: string;
    shirt: string;
    pants: string;
    accessory: string;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Score not submitted.');
    return false;
  }

  try {
    // Check if player already exists
    const { data: existingPlayer, error: fetchError } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's ok
      throw fetchError;
    }

    const now = new Date();
    const nowStr = now.toISOString();

    if (existingPlayer) {
      // Player exists - update their score
      const lastDailyReset = new Date(existingPlayer.last_daily_reset);
      const lastWeeklyReset = new Date(existingPlayer.last_weekly_reset);

      // Check if we need to reset daily/weekly
      const daysSinceDaily = (now.getTime() - lastDailyReset.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceWeekly = (now.getTime() - lastWeeklyReset.getTime()) / (1000 * 60 * 60 * 24);

      const coinDiff = coins - existingPlayer.coins;

      const updates: Database['public']['Tables']['leaderboard']['Update'] = {
        username,
        coins,
        character_type: character.type,
        character_skin: character.skin,
        character_shirt: character.shirt,
        character_pants: character.pants,
        character_accessory: character.accessory,
        daily_coins: daysSinceDaily >= 1 ? coinDiff : existingPlayer.daily_coins + coinDiff,
        weekly_coins: daysSinceWeekly >= 7 ? coinDiff : existingPlayer.weekly_coins + coinDiff,
        last_daily_reset: daysSinceDaily >= 1 ? nowStr : existingPlayer.last_daily_reset,
        last_weekly_reset: daysSinceWeekly >= 7 ? nowStr : existingPlayer.last_weekly_reset,
      };

      const { error: updateError } = await supabase
        .from('leaderboard')
        .update(updates)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      // New player - insert
      const { error: insertError } = await supabase.from('leaderboard').insert({
        user_id: userId,
        username,
        coins,
        character_type: character.type,
        character_skin: character.skin,
        character_shirt: character.shirt,
        character_pants: character.pants,
        character_accessory: character.accessory,
        daily_coins: coins,
        weekly_coins: coins,
        last_daily_reset: nowStr,
        last_weekly_reset: nowStr,
      });

      if (insertError) throw insertError;
    }

    // Invalidate cache
    cache.timestamp = 0;

    return true;
  } catch (error) {
    console.error('Error submitting score:', error);
    return false;
  }
}

/**
 * Get player's rank for a specific period
 */
export async function getPlayerRank(userId: string, period: LeaderboardPeriod = 'alltime'): Promise<number | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const sortColumn = period === 'daily' ? 'daily_coins' : period === 'weekly' ? 'weekly_coins' : 'coins';

    // Get player's score
    const { data: playerData, error: playerError } = await supabase
      .from('leaderboard')
      .select(sortColumn)
      .eq('user_id', userId)
      .single();

    if (playerError || !playerData) return null;

    const playerScore = playerData[sortColumn];

    // Count how many players have higher score
    const { count, error: countError } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt(sortColumn, playerScore);

    if (countError || count === null) return null;

    return count + 1;
  } catch (error) {
    console.error('Error getting player rank:', error);
    return null;
  }
}

// ============================================
// Real-time Subscriptions
// ============================================

let leaderboardChannel: RealtimeChannel | null = null;

/**
 * Subscribe to leaderboard updates
 */
export function subscribeToLeaderboard(
  onUpdate: (entry: LeaderboardEntry) => void,
  onDelete?: (userId: string) => void
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Real-time leaderboard disabled.');
    return null;
  }

  leaderboardChannel = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'leaderboard',
      },
      (payload) => {
        const entry = mapRowToEntry(payload.new as Database['public']['Tables']['leaderboard']['Row']);
        onUpdate(entry);
        cache.timestamp = 0; // Invalidate cache
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'leaderboard',
      },
      (payload) => {
        const entry = mapRowToEntry(payload.new as Database['public']['Tables']['leaderboard']['Row']);
        onUpdate(entry);
        cache.timestamp = 0; // Invalidate cache
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'leaderboard',
      },
      (payload) => {
        if (onDelete && payload.old) {
          const old = payload.old as Database['public']['Tables']['leaderboard']['Row'];
          onDelete(old.user_id);
        }
        cache.timestamp = 0; // Invalidate cache
      }
    )
    .subscribe();

  return leaderboardChannel;
}

/**
 * Unsubscribe from leaderboard updates
 */
export async function unsubscribeFromLeaderboard(): Promise<void> {
  if (leaderboardChannel) {
    await leaderboardChannel.unsubscribe();
    leaderboardChannel = null;
  }
}

/**
 * Clear leaderboard cache
 */
export function clearLeaderboardCache(): void {
  cache = {
    data: null,
    period: 'alltime',
    timestamp: 0,
  };
}
