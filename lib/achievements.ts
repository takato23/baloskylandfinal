/**
 * Achievements System
 * Track player progress and unlock achievements with rewards
 */

import { supabase, isSupabaseConfigured, isTableAvailable, markTableMissing, isMissingTableError, hasPendingTableCheck } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  Achievement,
  UserAchievement,
  AchievementProgress,
  AchievementEvent,
  AchievementCategory,
  AchievementTier,
} from '../types/game';

// ============================================
// Achievement Definitions
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  // Explorer Achievements
  {
    id: 'explorer_1',
    name: 'First Steps',
    description: 'Walk 100 meters',
    category: 'explorer',
    tier: 'bronze',
    icon: '👟',
    requirement: 100,
    points: 10,
    rewardType: 'coins',
    rewardAmount: 50,
  },
  {
    id: 'explorer_2',
    name: 'City Walker',
    description: 'Walk 1,000 meters',
    category: 'explorer',
    tier: 'silver',
    icon: '🚶',
    requirement: 1000,
    points: 25,
    rewardType: 'coins',
    rewardAmount: 150,
  },
  {
    id: 'explorer_3',
    name: 'Marathon Runner',
    description: 'Walk 10,000 meters',
    category: 'explorer',
    tier: 'gold',
    icon: '🏃',
    requirement: 10000,
    points: 50,
    rewardType: 'coins',
    rewardAmount: 500,
  },
  {
    id: 'explorer_4',
    name: 'World Traveler',
    description: 'Walk 100,000 meters',
    category: 'explorer',
    tier: 'platinum',
    icon: '🌍',
    requirement: 100000,
    points: 100,
    rewardType: 'skin',
    rewardId: 'explorer_skin_platinum',
  },

  // Collector Achievements
  {
    id: 'collector_1',
    name: 'Coin Finder',
    description: 'Collect 50 coins',
    category: 'collector',
    tier: 'bronze',
    icon: '🪙',
    requirement: 50,
    points: 10,
    rewardType: 'coins',
    rewardAmount: 25,
  },
  {
    id: 'collector_2',
    name: 'Treasure Hunter',
    description: 'Collect 500 coins',
    category: 'collector',
    tier: 'silver',
    icon: '💰',
    requirement: 500,
    points: 25,
    rewardType: 'coins',
    rewardAmount: 100,
  },
  {
    id: 'collector_3',
    name: 'Gold Digger',
    description: 'Collect 5,000 coins',
    category: 'collector',
    tier: 'gold',
    icon: '🏆',
    requirement: 5000,
    points: 50,
    rewardType: 'coins',
    rewardAmount: 500,
  },
  {
    id: 'collector_4',
    name: 'Millionaire',
    description: 'Collect 50,000 coins',
    category: 'collector',
    tier: 'platinum',
    icon: '💎',
    requirement: 50000,
    points: 100,
    rewardType: 'skin',
    rewardId: 'collector_skin_platinum',
  },

  // Social Achievements
  {
    id: 'social_1',
    name: 'First Friend',
    description: 'Add 1 friend',
    category: 'social',
    tier: 'bronze',
    icon: '🤝',
    requirement: 1,
    points: 10,
    rewardType: 'coins',
    rewardAmount: 50,
  },
  {
    id: 'social_2',
    name: 'Social Butterfly',
    description: 'Add 10 friends',
    category: 'social',
    tier: 'silver',
    icon: '🦋',
    requirement: 10,
    points: 25,
    rewardType: 'coins',
    rewardAmount: 200,
  },
  {
    id: 'social_3',
    name: 'Popular Player',
    description: 'Add 50 friends',
    category: 'social',
    tier: 'gold',
    icon: '⭐',
    requirement: 50,
    points: 50,
    rewardType: 'coins',
    rewardAmount: 500,
  },
  {
    id: 'social_4',
    name: 'Guild Member',
    description: 'Join a guild',
    category: 'social',
    tier: 'bronze',
    icon: '🏰',
    requirement: 1,
    points: 15,
    rewardType: 'coins',
    rewardAmount: 100,
  },
  {
    id: 'social_5',
    name: 'Guild Contributor',
    description: 'Contribute 1,000 coins to guild treasury',
    category: 'social',
    tier: 'silver',
    icon: '💝',
    requirement: 1000,
    points: 30,
    rewardType: 'coins',
    rewardAmount: 250,
  },

  // Racer Achievements
  {
    id: 'racer_1',
    name: 'Skate Beginner',
    description: 'Drive 500 meters on skateboard',
    category: 'racer',
    tier: 'bronze',
    icon: '🛹',
    requirement: 500,
    points: 10,
    rewardType: 'coins',
    rewardAmount: 50,
  },
  {
    id: 'racer_2',
    name: 'Speed Demon',
    description: 'Drive 5,000 meters on skateboard',
    category: 'racer',
    tier: 'silver',
    icon: '💨',
    requirement: 5000,
    points: 25,
    rewardType: 'coins',
    rewardAmount: 200,
  },
  {
    id: 'racer_3',
    name: 'Race Winner',
    description: 'Win 1 skate race',
    category: 'racer',
    tier: 'bronze',
    icon: '🥇',
    requirement: 1,
    points: 20,
    rewardType: 'coins',
    rewardAmount: 100,
  },
  {
    id: 'racer_4',
    name: 'Racing Champion',
    description: 'Win 10 skate races',
    category: 'racer',
    tier: 'gold',
    icon: '🏆',
    requirement: 10,
    points: 75,
    rewardType: 'skin',
    rewardId: 'racer_skin_gold',
  },
  {
    id: 'racer_5',
    name: 'Trick Master',
    description: 'Perform 100 tricks',
    category: 'racer',
    tier: 'silver',
    icon: '🔄',
    requirement: 100,
    points: 30,
    rewardType: 'coins',
    rewardAmount: 250,
  },

  // Style Achievements
  {
    id: 'style_1',
    name: 'First Outfit',
    description: 'Buy your first skin',
    category: 'style',
    tier: 'bronze',
    icon: '👕',
    requirement: 1,
    points: 10,
    rewardType: 'coins',
    rewardAmount: 50,
  },
  {
    id: 'style_2',
    name: 'Fashionista',
    description: 'Buy 10 skins',
    category: 'style',
    tier: 'silver',
    icon: '👗',
    requirement: 10,
    points: 30,
    rewardType: 'coins',
    rewardAmount: 200,
  },
  {
    id: 'style_3',
    name: 'Wardrobe Master',
    description: 'Buy 50 skins',
    category: 'style',
    tier: 'gold',
    icon: '👑',
    requirement: 50,
    points: 75,
    rewardType: 'skin',
    rewardId: 'style_skin_gold',
  },
  {
    id: 'style_4',
    name: 'Emote Lover',
    description: 'Use 100 emotes',
    category: 'style',
    tier: 'bronze',
    icon: '😄',
    requirement: 100,
    points: 15,
    rewardType: 'coins',
    rewardAmount: 75,
  },

  // Special Achievements
  {
    id: 'special_1',
    name: 'Treasure Master',
    description: 'Find all treasures in a treasure hunt',
    category: 'special',
    tier: 'gold',
    icon: '🗺️',
    requirement: 1,
    points: 50,
    rewardType: 'coins',
    rewardAmount: 500,
  },
  {
    id: 'special_2',
    name: 'Event Winner',
    description: 'Win 5 events',
    category: 'special',
    tier: 'gold',
    icon: '🎉',
    requirement: 5,
    points: 75,
    rewardType: 'skin',
    rewardId: 'special_skin_events',
  },
  {
    id: 'special_3',
    name: 'NPC Friend',
    description: 'Talk to 10 NPCs',
    category: 'special',
    tier: 'bronze',
    icon: '💬',
    requirement: 10,
    points: 15,
    rewardType: 'coins',
    rewardAmount: 100,
  },
  {
    id: 'special_4',
    name: 'Trader',
    description: 'Complete 10 trades',
    category: 'special',
    tier: 'silver',
    icon: '🤲',
    requirement: 10,
    points: 30,
    rewardType: 'coins',
    rewardAmount: 250,
  },
];

// ============================================
// Progress Tracking Keys
// ============================================

export const ACHIEVEMENT_KEYS = {
  distance_walked: ['explorer_1', 'explorer_2', 'explorer_3', 'explorer_4'],
  coins_collected: ['collector_1', 'collector_2', 'collector_3', 'collector_4'],
  friends_added: ['social_1', 'social_2', 'social_3'],
  guild_joined: ['social_4'],
  guild_contribution: ['social_5'],
  distance_driven: ['racer_1', 'racer_2'],
  races_won: ['racer_3', 'racer_4'],
  tricks_performed: ['racer_5'],
  skins_purchased: ['style_1', 'style_2', 'style_3'],
  emotes_used: ['style_4'],
  treasures_found: ['special_1'],
  events_won: ['special_2'],
  npcs_talked: ['special_3'],
  trades_completed: ['special_4'],
} as const;

// ============================================
// Types
// ============================================

export interface AchievementUnlock {
  achievement: Achievement;
  reward?: { type: 'coins' | 'skin' | 'title'; amount?: number; id?: string };
}

// ============================================
// Achievement Management
// ============================================

/**
 * Get all achievements
 */
export const getAchievements = (): Achievement[] => {
  return ACHIEVEMENTS;
};

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

/**
 * Get achievement by ID
 */
export const getAchievement = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

// ============================================
// User Progress Management
// ============================================

/**
 * Get user's achievement progress
 */
export const getUserAchievements = async (
  userId: string
): Promise<{ achievements: UserAchievement[]; error?: string }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_achievements') || hasPendingTableCheck('user_achievements')) {
    return { achievements: [] };
  }

  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      if (isMissingTableError(error)) {
        markTableMissing('user_achievements');
        return { achievements: [] };
      }
      console.error('Error fetching user achievements:', error);
      return { achievements: [], error: error.message };
    }

    const achievements: UserAchievement[] = (data || []).map((a: any) => ({
      userId: a.user_id,
      achievementId: a.achievement_id,
      progress: a.progress,
      completed: a.completed,
      completedAt: a.completed_at ? new Date(a.completed_at).getTime() : undefined,
      claimed: a.claimed,
    }));

    return { achievements };
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return { achievements: [], error: 'Failed to fetch achievements' };
  }
};

/**
 * Get user's progress for a specific achievement
 */
export const getAchievementProgress = async (
  userId: string,
  achievementId: string
): Promise<AchievementProgress | null> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_achievements') || hasPendingTableCheck('user_achievements')) {
    const achievement = getAchievement(achievementId);
    if (!achievement) return null;
    return {
      achievementId,
      current: 0,
      target: achievement.requirement,
      percentage: 0,
    };
  }

  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('progress')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (error && isMissingTableError(error)) {
      markTableMissing('user_achievements');
    }

    const achievement = getAchievement(achievementId);
    if (!achievement) return null;

    const current = data?.progress || 0;
    return {
      achievementId,
      current,
      target: achievement.requirement,
      percentage: Math.min(100, (current / achievement.requirement) * 100),
    };
  } catch {
    return null;
  }
};

/**
 * Get all progress for user
 */
export const getAllProgress = async (
  userId: string
): Promise<{ progress: AchievementProgress[]; error?: string }> => {
  // Return default progress if Supabase not configured or table missing
  const defaultProgress = (): { progress: AchievementProgress[] } => ({
    progress: ACHIEVEMENTS.map(achievement => ({
      achievementId: achievement.id,
      current: 0,
      target: achievement.requirement,
      percentage: 0,
    })),
  });

  if (!isSupabaseConfigured() || !isTableAvailable('user_achievements') || hasPendingTableCheck('user_achievements')) {
    return defaultProgress();
  }

  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id, progress')
      .eq('user_id', userId);

    if (error) {
      if (isMissingTableError(error)) {
        markTableMissing('user_achievements');
        return defaultProgress();
      }
      console.error('Error fetching progress:', error);
      return { progress: [], error: 'Failed to fetch progress' };
    }

    const progressMap = new Map((data || []).map((d: any) => [d.achievement_id, d.progress]));

    const progress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
      const current = progressMap.get(achievement.id) || 0;
      return {
        achievementId: achievement.id,
        current,
        target: achievement.requirement,
        percentage: Math.min(100, (current / achievement.requirement) * 100),
      };
    });

    return { progress };
  } catch (error) {
    console.error('Error fetching progress:', error);
    return { progress: [], error: 'Failed to fetch progress' };
  }
};

/**
 * Update achievement progress
 */
export const updateProgress = async (
  userId: string,
  achievementId: string,
  amount: number,
  increment: boolean = true
): Promise<{ success: boolean; unlocked?: AchievementUnlock; error?: string }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_achievements') || hasPendingTableCheck('user_achievements')) {
    // Silently succeed in local-only mode
    return { success: true };
  }

  const achievement = getAchievement(achievementId);
  if (!achievement) {
    return { success: false, error: 'Achievement not found' };
  }

  try {
    // Get current progress
    const { data: existing, error: fetchError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (fetchError && isMissingTableError(fetchError)) {
      markTableMissing('user_achievements');
      return { success: true };
    }

    if (existing?.completed) {
      return { success: true }; // Already completed
    }

    const currentProgress = existing?.progress || 0;
    const newProgress = increment ? currentProgress + amount : amount;
    const completed = newProgress >= achievement.requirement;

    // Upsert progress
    const { error } = await supabase.from('user_achievements').upsert({
      user_id: userId,
      achievement_id: achievementId,
      progress: newProgress,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      claimed: false,
    });

    if (error) {
      if (isMissingTableError(error)) {
        markTableMissing('user_achievements');
        return { success: true };
      }
      console.error('Error updating progress:', error);
      return { success: false, error: error.message };
    }

    if (completed && !existing?.completed) {
      return {
        success: true,
        unlocked: {
          achievement,
          reward: achievement.rewardType
            ? {
                type: achievement.rewardType,
                amount: achievement.rewardAmount,
                id: achievement.rewardId,
              }
            : undefined,
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating progress:', error);
    return { success: false, error: 'Failed to update progress' };
  }
};

/**
 * Track achievement event
 */
export const trackEvent = async (
  userId: string,
  event: AchievementEvent
): Promise<{ unlocked: AchievementUnlock[] }> => {
  const unlocked: AchievementUnlock[] = [];

  let achievementIds: string[] = [];
  let amount = 0;

  switch (event.type) {
    case 'coins_collected':
      achievementIds = ACHIEVEMENT_KEYS.coins_collected;
      amount = event.amount;
      break;
    case 'distance_walked':
      achievementIds = ACHIEVEMENT_KEYS.distance_walked;
      amount = event.meters;
      break;
    case 'distance_driven':
      achievementIds = ACHIEVEMENT_KEYS.distance_driven;
      amount = event.meters;
      break;
    case 'tricks_performed':
      achievementIds = ACHIEVEMENT_KEYS.tricks_performed;
      amount = event.count;
      break;
    case 'race_won':
      achievementIds = ACHIEVEMENT_KEYS.races_won;
      amount = 1;
      break;
    case 'treasure_found':
      achievementIds = ACHIEVEMENT_KEYS.treasures_found;
      amount = event.count;
      break;
    case 'friend_added':
      achievementIds = ACHIEVEMENT_KEYS.friends_added;
      amount = 1;
      break;
    case 'guild_joined':
      achievementIds = ACHIEVEMENT_KEYS.guild_joined;
      amount = 1;
      break;
    case 'skin_purchased':
      achievementIds = ACHIEVEMENT_KEYS.skins_purchased;
      amount = 1;
      break;
    case 'emote_used':
      achievementIds = ACHIEVEMENT_KEYS.emotes_used;
      amount = 1;
      break;
    case 'npc_talked':
      achievementIds = ACHIEVEMENT_KEYS.npcs_talked;
      amount = 1;
      break;
  }

  for (const achievementId of achievementIds) {
    const result = await updateProgress(userId, achievementId, amount);
    if (result.unlocked) {
      unlocked.push(result.unlocked);
    }
  }

  return { unlocked };
};

/**
 * Claim achievement reward
 */
export const claimReward = async (
  userId: string,
  achievementId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_achievements') || hasPendingTableCheck('user_achievements')) {
    return { success: false, error: 'Database not available' };
  }

  const achievement = getAchievement(achievementId);
  if (!achievement) {
    return { success: false, error: 'Achievement not found' };
  }

  try {
    // Check if completed but not claimed
    const { data: userAchievement, error: fetchError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (fetchError && isMissingTableError(fetchError)) {
      markTableMissing('user_achievements');
      return { success: false, error: 'Database not available' };
    }

    if (!userAchievement?.completed) {
      return { success: false, error: 'Achievement not completed' };
    }

    if (userAchievement.claimed) {
      return { success: false, error: 'Reward already claimed' };
    }

    // Mark as claimed
    await supabase
      .from('user_achievements')
      .update({ claimed: true })
      .eq('user_id', userId)
      .eq('achievement_id', achievementId);

    // Grant reward
    if (achievement.rewardType === 'coins' && achievement.rewardAmount) {
      await supabase.rpc('add_player_coins', {
        p_user_id: userId,
        p_amount: achievement.rewardAmount,
      });
    } else if (achievement.rewardType === 'skin' && achievement.rewardId) {
      await supabase.from('user_skins').insert({
        user_id: userId,
        skin_id: achievement.rewardId,
        purchased_at: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error claiming reward:', error);
    return { success: false, error: 'Failed to claim reward' };
  }
};

/**
 * Get completed achievements count
 */
export const getCompletedCount = async (
  userId: string
): Promise<{ total: number; completed: number; points: number }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_achievements') || hasPendingTableCheck('user_achievements')) {
    return { total: ACHIEVEMENTS.length, completed: 0, points: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .eq('completed', true);

    if (error && isMissingTableError(error)) {
      markTableMissing('user_achievements');
      return { total: ACHIEVEMENTS.length, completed: 0, points: 0 };
    }

    const completedIds = new Set((data || []).map((d: any) => d.achievement_id));
    const points = ACHIEVEMENTS
      .filter(a => completedIds.has(a.id))
      .reduce((sum, a) => sum + a.points, 0);

    return {
      total: ACHIEVEMENTS.length,
      completed: completedIds.size,
      points,
    };
  } catch {
    return { total: ACHIEVEMENTS.length, completed: 0, points: 0 };
  }
};

// ============================================
// Real-time Subscriptions
// ============================================

let achievementChannel: RealtimeChannel | null = null;

/**
 * Subscribe to achievement updates
 */
export const subscribeToAchievements = (
  userId: string,
  onUnlock: (achievement: Achievement) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_achievements') || hasPendingTableCheck('user_achievements')) return null;

  achievementChannel = supabase
    .channel('achievements')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_achievements',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const data = payload.new as any;
        if (data.completed && !payload.old?.completed) {
          const achievement = getAchievement(data.achievement_id);
          if (achievement) {
            onUnlock(achievement);
          }
        }
      }
    )
    .subscribe();

  return achievementChannel;
};

/**
 * Unsubscribe from achievements
 */
export const unsubscribeFromAchievements = async () => {
  if (achievementChannel) {
    await achievementChannel.unsubscribe();
    achievementChannel = null;
  }
};

// ============================================
// Achievement Display Helpers
// ============================================

/**
 * Get display data for achievements panel
 */
export const getAchievementsDisplay = async (
  userId: string
): Promise<{
  categories: {
    category: AchievementCategory;
    achievements: (Achievement & { progress: AchievementProgress; userState?: UserAchievement })[];
  }[];
  stats: { total: number; completed: number; points: number };
}> => {
  const { achievements: userAchievements } = await getUserAchievements(userId);
  const { progress: allProgress } = await getAllProgress(userId);
  const stats = await getCompletedCount(userId);

  const userMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));
  const progressMap = new Map(allProgress.map(p => [p.achievementId, p]));

  const categories: AchievementCategory[] = ['explorer', 'collector', 'social', 'racer', 'style', 'special'];

  return {
    categories: categories.map(category => ({
      category,
      achievements: ACHIEVEMENTS.filter(a => a.category === category).map(achievement => ({
        ...achievement,
        progress: progressMap.get(achievement.id) || {
          achievementId: achievement.id,
          current: 0,
          target: achievement.requirement,
          percentage: 0,
        },
        userState: userMap.get(achievement.id),
      })),
    })),
    stats,
  };
};
