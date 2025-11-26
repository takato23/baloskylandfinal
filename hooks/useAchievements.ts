/**
 * Achievements Hook
 * React hook for achievement tracking and display
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAchievements,
  getAchievement,
  getAchievementsByCategory,
  getUserAchievements,
  getAllProgress,
  trackEvent,
  claimReward,
  getCompletedCount,
  getAchievementsDisplay,
  subscribeToAchievements,
  unsubscribeFromAchievements,
  type AchievementUnlock,
} from '../lib/achievements';
import type {
  Achievement,
  UserAchievement,
  AchievementProgress,
  AchievementEvent,
  AchievementCategory,
} from '../types/game';

// ============================================
// Types
// ============================================

export interface AchievementWithProgress extends Achievement {
  progress: AchievementProgress;
  userState?: UserAchievement;
}

export interface CategoryAchievements {
  category: AchievementCategory;
  achievements: AchievementWithProgress[];
}

export interface AchievementStats {
  total: number;
  completed: number;
  points: number;
  percentage: number;
}

export interface UseAchievementsReturn {
  // State
  categories: CategoryAchievements[];
  stats: AchievementStats;
  recentUnlocks: Achievement[];
  isLoading: boolean;
  error: string | null;

  // Actions
  track: (event: AchievementEvent) => Promise<AchievementUnlock[]>;
  claim: (achievementId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  getByCategory: (category: AchievementCategory) => AchievementWithProgress[];
  getById: (id: string) => AchievementWithProgress | undefined;
  clearRecentUnlocks: () => void;
  clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export const useAchievements = (userId: string): UseAchievementsReturn => {
  const [categories, setCategories] = useState<CategoryAchievements[]>([]);
  const [stats, setStats] = useState<AchievementStats>({
    total: 0,
    completed: 0,
    points: 0,
    percentage: 0,
  });
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof subscribeToAchievements>>(null);

  // Load achievements data
  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const display = await getAchievementsDisplay(userId);

      setCategories(display.categories);
      setStats({
        total: display.stats.total,
        completed: display.stats.completed,
        points: display.stats.points,
        percentage: display.stats.total > 0
          ? Math.round((display.stats.completed / display.stats.total) * 100)
          : 0,
      });
    } catch (err) {
      setError('Failed to load achievements');
      console.error('Error loading achievements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Handle achievement unlock notification
  const handleUnlock = useCallback((achievement: Achievement) => {
    setRecentUnlocks(prev => [achievement, ...prev.slice(0, 4)]);

    // Update stats
    setStats(prev => ({
      ...prev,
      completed: prev.completed + 1,
      points: prev.points + achievement.points,
      percentage: prev.total > 0
        ? Math.round(((prev.completed + 1) / prev.total) * 100)
        : 0,
    }));

    // Update category data
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        achievements: cat.achievements.map(a =>
          a.id === achievement.id
            ? {
                ...a,
                userState: {
                  userId: userId,
                  achievementId: achievement.id,
                  progress: achievement.requirement,
                  completed: true,
                  completedAt: Date.now(),
                  claimed: false,
                },
                progress: {
                  ...a.progress,
                  current: achievement.requirement,
                  percentage: 100,
                },
              }
            : a
        ),
      }))
    );
  }, [userId]);

  // Subscribe to achievement updates
  useEffect(() => {
    if (!userId) return;

    refresh();
    channelRef.current = subscribeToAchievements(userId, handleUnlock);

    return () => {
      unsubscribeFromAchievements();
    };
  }, [userId, refresh, handleUnlock]);

  // Track event
  const track = useCallback(async (event: AchievementEvent): Promise<AchievementUnlock[]> => {
    if (!userId) return [];

    try {
      const result = await trackEvent(userId, event);

      // Handle unlocks
      for (const unlock of result.unlocked) {
        handleUnlock(unlock.achievement);
      }

      return result.unlocked;
    } catch (err) {
      console.error('Error tracking event:', err);
      return [];
    }
  }, [userId, handleUnlock]);

  // Claim reward
  const claim = useCallback(async (achievementId: string): Promise<boolean> => {
    if (!userId) return false;

    setError(null);

    try {
      const result = await claimReward(userId, achievementId);

      if (!result.success) {
        setError(result.error || 'Failed to claim reward');
        return false;
      }

      // Update local state
      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          achievements: cat.achievements.map(a =>
            a.id === achievementId && a.userState
              ? { ...a, userState: { ...a.userState, claimed: true } }
              : a
          ),
        }))
      );

      return true;
    } catch (err) {
      setError('Failed to claim reward');
      console.error('Error claiming reward:', err);
      return false;
    }
  }, [userId]);

  // Get achievements by category
  const getByCategory = useCallback((category: AchievementCategory): AchievementWithProgress[] => {
    const cat = categories.find(c => c.category === category);
    return cat?.achievements || [];
  }, [categories]);

  // Get achievement by ID
  const getById = useCallback((id: string): AchievementWithProgress | undefined => {
    for (const cat of categories) {
      const achievement = cat.achievements.find(a => a.id === id);
      if (achievement) return achievement;
    }
    return undefined;
  }, [categories]);

  // Clear recent unlocks
  const clearRecentUnlocks = useCallback(() => {
    setRecentUnlocks([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    categories,
    stats,
    recentUnlocks,
    isLoading,
    error,
    track,
    claim,
    refresh,
    getByCategory,
    getById,
    clearRecentUnlocks,
    clearError,
  };
};

export default useAchievements;
