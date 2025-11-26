/**
 * useEconomy Hook
 * Conecta el sistema de economía con el gameplay
 * Auto-trackea misiones, tiempo de juego y recompensas
 */

import { useEffect, useCallback, useRef } from 'react';
import { useEconomyStore, MISSIONS, type Mission } from '../stores/economyStore';
import { useGameStore } from '../store';

// ============================================
// Hook Principal
// ============================================

export function useEconomy() {
  const economyStore = useEconomyStore();
  const gameStore = useGameStore();

  const playTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const lastCoinsRef = useRef(economyStore.stats.coinsCollected);
  const lastTricksRef = useRef(economyStore.stats.tricksPerformed);

  // --- Iniciar sesión y tracking de tiempo ---
  useEffect(() => {
    economyStore.startSession();

    // Actualizar tiempo cada segundo
    playTimeInterval.current = setInterval(() => {
      economyStore.updatePlayTime();
    }, 1000);

    return () => {
      if (playTimeInterval.current) {
        clearInterval(playTimeInterval.current);
      }
    };
  }, []);

  // --- Sincronizar monedas del gameStore al economyStore ---
  useEffect(() => {
    // Cuando cambian las coins en gameStore, actualizar economyStore
    const unsubscribe = useGameStore.subscribe(
      (state) => state.coins,
      (newCoins, prevCoins) => {
        if (newCoins > prevCoins) {
          const diff = newCoins - prevCoins;
          economyStore.addCoins(diff);
        }
      }
    );

    return unsubscribe;
  }, []);

  // --- Auto-check de misiones ---
  useEffect(() => {
    const checkMissions = () => {
      const { stats, totalPlayTime, missionProgress, updateMissionProgress, completeMission } = economyStore;

      MISSIONS.forEach((mission) => {
        const progress = missionProgress.find((p) => p.missionId === mission.id);
        const currentStatus = progress?.status;

        // Si ya está completada o reclamada, skip
        if (currentStatus === 'completed' || currentStatus === 'claimed') {
          return;
        }

        let currentValue = 0;

        switch (mission.type) {
          case 'collect':
            currentValue = stats.coinsCollected;
            break;
          case 'time':
            currentValue = totalPlayTime;
            break;
          case 'trick':
            currentValue = stats.tricksPerformed;
            break;
          case 'explore':
            currentValue = stats.distanceWalked;
            break;
          case 'social':
            currentValue = stats.npcsInteracted;
            break;
        }

        // Actualizar progreso
        if (currentValue > 0) {
          updateMissionProgress(mission.id, currentValue);
        }

        // Verificar si se completó (re-check fresh progress)
        const freshProgress = economyStore.missionProgress.find((p) => p.missionId === mission.id);
        const freshStatus = freshProgress?.status;
        if (currentValue >= mission.target && freshStatus !== 'completed' && freshStatus !== 'claimed') {
          completeMission(mission.id);
        }
      });
    };

    // Check missions cada segundo
    const interval = setInterval(checkMissions, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Funciones de utilidad ---
  const collectCoin = useCallback((value: number = 1) => {
    // Esto se llama desde el componente Coin
    gameStore.addCoin(value);
    // El subscribe de arriba sincroniza automáticamente
  }, []);

  const performTrick = useCallback(() => {
    economyStore.incrementStat('tricksPerformed');
  }, []);

  const interactWithNpc = useCallback(() => {
    economyStore.incrementStat('npcsInteracted');
  }, []);

  const updateDistance = useCallback((meters: number, isDriving: boolean) => {
    if (isDriving) {
      economyStore.incrementStat('distanceDriven', meters);
    } else {
      economyStore.incrementStat('distanceWalked', meters);
    }
  }, []);

  const canAfford = useCallback((price: number) => {
    return economyStore.coins >= price;
  }, [economyStore.coins]);

  const getUnclaimedMissions = useCallback(() => {
    return economyStore.missionProgress.filter((p) => p.status === 'completed');
  }, [economyStore.missionProgress]);

  const getMissionProgress = useCallback((missionId: string): { current: number; target: number; percentage: number } | null => {
    const mission = MISSIONS.find((m) => m.id === missionId);
    const progress = economyStore.missionProgress.find((p) => p.missionId === missionId);

    if (!mission) return null;

    const current = progress?.current ?? 0;
    return {
      current,
      target: mission.target,
      percentage: Math.min((current / mission.target) * 100, 100),
    };
  }, [economyStore.missionProgress]);

  return {
    // State
    coins: economyStore.coins,
    totalCoinsEarned: economyStore.totalCoinsEarned,
    unlockedItems: economyStore.unlockedItems,
    playTime: economyStore.totalPlayTime,
    stats: economyStore.stats,
    consecutiveDays: economyStore.consecutiveDays,

    // Actions
    collectCoin,
    performTrick,
    interactWithNpc,
    updateDistance,
    canAfford,

    // Shop
    purchaseItem: economyStore.purchaseItem,
    hasItem: economyStore.hasItem,
    equipItem: economyStore.equipItem,

    // Daily Reward
    checkDailyReward: economyStore.checkDailyReward,
    claimDailyReward: economyStore.claimDailyReward,

    // Missions
    getUnclaimedMissions,
    getMissionProgress,
    claimMissionReward: economyStore.claimMissionReward,
  };
}

// ============================================
// Hook para formato de tiempo
// ============================================

export function useFormattedPlayTime() {
  const totalPlayTime = useEconomyStore((s) => s.totalPlayTime);

  const hours = Math.floor(totalPlayTime / 3600);
  const minutes = Math.floor((totalPlayTime % 3600) / 60);
  const seconds = totalPlayTime % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// ============================================
// Hook para tracking de trucos (para integrar con skateboard)
// ============================================

export function useTrickTracker() {
  const incrementStat = useEconomyStore((s) => s.incrementStat);
  const currentTrick = useGameStore((s) => s.currentTrick);
  const lastTrackedTrick = useRef<string | null>(null);

  useEffect(() => {
    if (currentTrick && currentTrick !== lastTrackedTrick.current) {
      incrementStat('tricksPerformed');
      lastTrackedTrick.current = currentTrick;
    }
  }, [currentTrick, incrementStat]);
}

// ============================================
// Hook para Daily Login Reward
// ============================================

export function useDailyReward() {
  const { checkDailyReward, claimDailyReward, lastPlayDate, consecutiveDays } = useEconomyStore();

  const dailyRewardStatus = checkDailyReward();

  return {
    canClaim: dailyRewardStatus.canClaim,
    reward: dailyRewardStatus.reward,
    currentStreak: consecutiveDays,
    nextStreak: dailyRewardStatus.day,
    claim: claimDailyReward,
  };
}
