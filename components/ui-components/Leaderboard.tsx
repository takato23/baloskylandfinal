/**
 * Leaderboard Component
 * Beautiful leaderboard UI with real-time updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '../../store';
import {
  fetchLeaderboard,
  subscribeToLeaderboard,
  unsubscribeFromLeaderboard,
  type LeaderboardEntry,
  type LeaderboardPeriod,
  type LeaderboardData,
} from '../../lib/leaderboard';

// ============================================
// Types
// ============================================

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

// ============================================
// Medal Icons
// ============================================

const MEDAL_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

// ============================================
// Animal Emoji Mapping
// ============================================

const ANIMAL_EMOJI: Record<string, string> = {
  bear: '🐻',
  cat: '🐱',
  rabbit: '🐰',
  fox: '🦊',
  dog: '🐶',
  panda: '🐼',
  koala: '🐨',
  lion: '🦁',
  pig: '🐷',
  chicken: '🐔',
  elephant: '🐘',
  sheep: '🐑',
  penguin: '🐧',
  duck: '🦆',
  zebra: '🦓',
  mouse: '🐭',
  cow: '🐮',
  frog: '🐸',
  monkey: '🐵',
  tiger: '🐯',
  raccoon: '🦝',
  deer: '🦌',
  hedgehog: '🦔',
  beaver: '🦫',
  platypus: '🦫',
};

// ============================================
// Period Tab Component
// ============================================

interface PeriodTabProps {
  period: LeaderboardPeriod;
  currentPeriod: LeaderboardPeriod;
  label: string;
  onClick: (period: LeaderboardPeriod) => void;
}

function PeriodTab({ period, currentPeriod, label, onClick }: PeriodTabProps) {
  const isActive = period === currentPeriod;
  return (
    <button
      onClick={() => onClick(period)}
      className={`
        px-4 py-2 rounded-lg font-semibold transition-all duration-200
        ${
          isActive
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg scale-105'
            : 'bg-white/20 text-white/80 hover:bg-white/30 hover:scale-102'
        }
      `}
    >
      {label}
    </button>
  );
}

// ============================================
// Leaderboard Entry Component
// ============================================

interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  index: number;
  period: LeaderboardPeriod;
  isCurrentPlayer: boolean;
}

function LeaderboardEntryRow({ entry, index, period, isCurrentPlayer }: LeaderboardEntryProps) {
  const rank = index + 1;
  const coins =
    period === 'daily' ? entry.dailyCoins : period === 'weekly' ? entry.weeklyCoins : entry.coins;

  const animalEmoji = ANIMAL_EMOJI[entry.characterType] || '🐾';

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
        ${
          isCurrentPlayer
            ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 shadow-lg scale-102 border-2 border-blue-400/50'
            : rank <= 3
            ? 'bg-white/15 hover:bg-white/20 shadow-md'
            : 'bg-white/5 hover:bg-white/10'
        }
      `}
    >
      {/* Rank */}
      <div className="w-12 text-center flex-shrink-0">
        {rank <= 3 ? (
          <span className="text-3xl animate-bounce" style={{ animationDelay: `${index * 100}ms` }}>
            {MEDAL_ICONS[rank]}
          </span>
        ) : (
          <span className="text-lg font-bold text-white/70">#{rank}</span>
        )}
      </div>

      {/* Animal Avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
        style={{
          background: `linear-gradient(135deg, ${entry.characterSkin}, ${entry.characterShirt})`,
        }}
      >
        {animalEmoji}
      </div>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-lg truncate">
            {entry.username}
            {isCurrentPlayer && (
              <span className="ml-2 text-xs bg-blue-500 px-2 py-0.5 rounded-full">You</span>
            )}
          </span>
        </div>
        <div className="text-xs text-white/60 capitalize">{entry.characterType}</div>
      </div>

      {/* Coins */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-2xl font-bold text-yellow-400">{coins.toLocaleString()}</span>
        <span className="text-xl">🪙</span>
      </div>
    </div>
  );
}

// ============================================
// Main Leaderboard Component
// ============================================

export function Leaderboard({ isOpen, onClose, currentUserId }: LeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('alltime');
  const [data, setData] = useState<LeaderboardData>({
    entries: [],
    currentPlayerRank: null,
    currentPlayerEntry: null,
    totalPlayers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const coins = useGameStore((state) => state.coins);

  // Load leaderboard data
  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLeaderboard(period, currentUserId, 10);
      setData(result);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [period, currentUserId]);

  // Load data on mount and period change
  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen, loadLeaderboard]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isOpen) return;

    const channel = subscribeToLeaderboard(
      (entry) => {
        // Update entry in list if it exists
        setData((prev) => {
          const existingIndex = prev.entries.findIndex((e) => e.userId === entry.userId);
          if (existingIndex >= 0) {
            const newEntries = [...prev.entries];
            newEntries[existingIndex] = entry;
            return { ...prev, entries: newEntries };
          }
          return prev;
        });
        setLastUpdate(Date.now());
      },
      (userId) => {
        // Remove entry from list
        setData((prev) => ({
          ...prev,
          entries: prev.entries.filter((e) => e.userId !== userId),
        }));
        setLastUpdate(Date.now());
      }
    );

    return () => {
      if (channel) {
        unsubscribeFromLeaderboard();
      }
    };
  }, [isOpen]);

  // Check if current player is in top 10
  const currentPlayerInTop10 = useMemo(() => {
    return data.entries.some((e) => e.userId === currentUserId);
  }, [data.entries, currentUserId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-white/20">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div>
                <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
                <p className="text-sm text-white/80">{data.totalPlayers.toLocaleString()} players</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl font-bold transition-all hover:scale-110"
            >
              ×
            </button>
          </div>

          {/* Period Tabs */}
          <div className="flex gap-2 mt-4">
            <PeriodTab period="daily" currentPeriod={period} label="Daily" onClick={setPeriod} />
            <PeriodTab period="weekly" currentPeriod={period} label="Weekly" onClick={setPeriod} />
            <PeriodTab period="alltime" currentPeriod={period} label="All Time" onClick={setPeriod} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/60">Loading leaderboard...</p>
            </div>
          ) : data.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <span className="text-6xl">🏅</span>
              <p className="text-white/60 text-center">
                No players yet!
                <br />
                Be the first to collect coins!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Top 10 entries */}
              {data.entries.map((entry, index) => (
                <LeaderboardEntryRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  period={period}
                  isCurrentPlayer={entry.userId === currentUserId}
                />
              ))}

              {/* Current player if not in top 10 */}
              {!currentPlayerInTop10 && data.currentPlayerEntry && data.currentPlayerRank && (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 border-t-2 border-dashed border-white/20" />
                    <span className="text-white/40 text-sm">Your Rank</span>
                    <div className="flex-1 border-t-2 border-dashed border-white/20" />
                  </div>
                  <LeaderboardEntryRow
                    entry={data.currentPlayerEntry}
                    index={data.currentPlayerRank - 1}
                    period={period}
                    isCurrentPlayer={true}
                  />
                </>
              )}
            </div>
          )}

          {/* Last update indicator */}
          <div className="mt-4 text-center text-xs text-white/40">
            {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>

        {/* Footer with current coins */}
        <div className="border-t-2 border-white/10 px-6 py-4 bg-black/20">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Your Current Coins</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-yellow-400">{coins.toLocaleString()}</span>
              <span className="text-xl">🪙</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
