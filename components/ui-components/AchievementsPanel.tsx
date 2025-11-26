/**
 * Achievements Panel Component
 * Display and claim achievements with progress tracking
 */

import React, { useState, memo, useCallback, useEffect } from 'react';
import { useAchievements, type AchievementWithProgress, type CategoryAchievements } from '../../hooks/useAchievements';
import type { AchievementCategory, AchievementTier } from '../../types/game';
import { ACHIEVEMENT_TIER_COLORS } from '../../types/game';

interface AchievementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onRewardClaimed?: (reward: { type: string; amount?: number }) => void;
}

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  explorer: '🗺️',
  collector: '💰',
  social: '👥',
  racer: '🏎️',
  style: '👗',
  special: '⭐',
};

const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  explorer: 'Explorer',
  collector: 'Collector',
  social: 'Social',
  racer: 'Racer',
  style: 'Style',
  special: 'Special',
};

const AchievementsPanel: React.FC<AchievementsPanelProps> = memo(({
  isOpen,
  onClose,
  userId,
  onRewardClaimed,
}) => {
  const achievements = useAchievements(userId);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('explorer');
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<AchievementWithProgress | null>(null);

  // Handle new unlocks
  useEffect(() => {
    if (achievements.recentUnlocks.length > 0) {
      const recent = achievements.recentUnlocks[0];
      const fullAchievement = achievements.getById(recent.id);
      if (fullAchievement) {
        setUnlockedAchievement(fullAchievement);
        setShowUnlockAnimation(true);
        const timer = setTimeout(() => {
          setShowUnlockAnimation(false);
          achievements.clearRecentUnlocks();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [achievements.recentUnlocks]);

  const handleClaim = useCallback(async (achievementId: string) => {
    const success = await achievements.claim(achievementId);
    if (success && onRewardClaimed) {
      const achievement = achievements.getById(achievementId);
      if (achievement?.rewardType) {
        onRewardClaimed({
          type: achievement.rewardType,
          amount: achievement.rewardAmount,
        });
      }
    }
  }, [achievements, onRewardClaimed]);

  const currentAchievements = achievements.getByCategory(selectedCategory);

  if (!isOpen) return null;

  return (
    <>
      {/* Unlock Animation Overlay */}
      {showUnlockAnimation && unlockedAchievement && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] animate-fadeIn">
          <div className="text-center animate-bounceIn">
            <div className="text-6xl mb-4 animate-pulse">{unlockedAchievement.icon}</div>
            <h2 className="text-3xl font-bold text-white mb-2">Achievement Unlocked!</h2>
            <p className="text-xl text-amber-400 mb-4">{unlockedAchievement.name}</p>
            <p className="text-gray-300">{unlockedAchievement.description}</p>
            {unlockedAchievement.rewardType && (
              <div className="mt-4 bg-amber-500/20 rounded-lg px-4 py-2 inline-block">
                <p className="text-amber-400">
                  +{unlockedAchievement.rewardAmount || 'Skin'} {unlockedAchievement.rewardType}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-amber-500 to-yellow-500 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <h2 className="text-xl font-bold text-white">Achievements</h2>
                <p className="text-white/80 text-sm">
                  {achievements.stats.completed}/{achievements.stats.total} • {achievements.stats.points} points
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-3 bg-gray-50 border-b">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>{achievements.stats.percentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
                style={{ width: `${achievements.stats.percentage}%` }}
              />
            </div>
          </div>

          {/* Error Display */}
          {achievements.error && (
            <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
              <span>{achievements.error}</span>
              <button onClick={achievements.clearError} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex overflow-x-auto border-b px-2">
            {(Object.keys(CATEGORY_ICONS) as AchievementCategory[]).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-1.5 px-4 py-3 font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'border-b-2 border-amber-500 text-amber-600 bg-amber-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{CATEGORY_ICONS[category]}</span>
                <span className="hidden sm:inline">{CATEGORY_NAMES[category]}</span>
              </button>
            ))}
          </div>

          {/* Achievements List */}
          <div className="flex-1 overflow-y-auto p-4">
            {achievements.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {currentAchievements.map(achievement => {
                  const isCompleted = achievement.userState?.completed;
                  const isClaimed = achievement.userState?.claimed;
                  const progress = achievement.progress;

                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-xl p-4 transition-all ${
                        isCompleted
                          ? isClaimed
                            ? 'bg-gray-100 border border-gray-200'
                            : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                            isCompleted ? 'bg-amber-100' : 'bg-gray-100 grayscale opacity-50'
                          }`}
                        >
                          {achievement.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>
                              {achievement.name}
                            </h3>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                              style={{
                                backgroundColor: `${ACHIEVEMENT_TIER_COLORS[achievement.tier]}20`,
                                color: ACHIEVEMENT_TIER_COLORS[achievement.tier],
                              }}
                            >
                              {achievement.tier}
                            </span>
                          </div>
                          <p className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                            {achievement.description}
                          </p>

                          {/* Progress Bar */}
                          {!isCompleted && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{progress.current.toLocaleString()}</span>
                                <span>{progress.target.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Reward */}
                          {achievement.rewardType && (
                            <div className="mt-2 flex items-center gap-1 text-xs">
                              <span className="text-gray-500">Reward:</span>
                              <span className="text-amber-600 font-medium">
                                {achievement.rewardType === 'coins' && `🪙 ${achievement.rewardAmount}`}
                                {achievement.rewardType === 'skin' && '👕 Exclusive Skin'}
                                {achievement.rewardType === 'title' && '🏷️ Title'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status/Claim Button */}
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            isClaimed ? (
                              <span className="text-green-500 text-sm font-medium flex items-center gap-1">
                                ✓ Claimed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleClaim(achievement.id)}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium animate-pulse"
                              >
                                Claim!
                              </button>
                            )
                          ) : (
                            <span className="text-gray-400 text-sm">
                              {Math.round(progress.percentage)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Points Summary */}
          <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Achievement Points</span>
              <span className="text-xl font-bold text-amber-600">{achievements.stats.points}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out;
        }
      `}</style>
    </>
  );
});

AchievementsPanel.displayName = 'AchievementsPanel';

export default AchievementsPanel;
