/**
 * Economy Store - Sistema de Economía con Persistencia LocalStorage
 * Maneja monedas, items desbloqueados, tiempo jugado y misiones
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export type ItemCategory = 'character' | 'accessory' | 'color' | 'vehicle' | 'emote';
export type MissionType = 'collect' | 'explore' | 'time' | 'trick' | 'social';
export type MissionStatus = 'locked' | 'active' | 'completed' | 'claimed';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  price: number;
  icon: string;
  // Lo que desbloquea
  unlocks?: {
    characterType?: string;
    accessory?: string;
    skinColor?: string;
    shirtColor?: string;
    pantsColor?: string;
  };
  // Requisitos opcionales
  requiresMission?: string;
  requiresLevel?: number;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  icon: string;
  target: number;        // Meta a alcanzar
  reward: number;        // Monedas de recompensa
  rewardItem?: string;   // Item opcional de recompensa
  repeatable: boolean;   // Si se puede repetir diariamente
  category: 'daily' | 'weekly' | 'achievement';
}

export interface MissionProgress {
  missionId: string;
  current: number;
  status: MissionStatus;
  completedAt?: number;
  claimedAt?: number;
}

export interface EconomyState {
  // --- Monedas ---
  coins: number;
  totalCoinsEarned: number;

  // --- Items Desbloqueados ---
  unlockedItems: string[];
  equippedItems: Record<ItemCategory, string | null>;

  // --- Tiempo de Juego ---
  totalPlayTime: number;      // segundos totales
  sessionStartTime: number;   // timestamp de inicio de sesión
  lastPlayDate: string;       // YYYY-MM-DD para daily rewards
  consecutiveDays: number;    // días seguidos jugando

  // --- Misiones ---
  missionProgress: MissionProgress[];
  dailyMissionsResetAt: number;

  // --- Estadísticas ---
  stats: {
    coinsCollected: number;
    distanceWalked: number;
    distanceDriven: number;
    tricksPerformed: number;
    npcsInteracted: number;
    itemsPurchased: number;
  };

  // --- Acciones de Monedas ---
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;

  // --- Acciones de Items ---
  unlockItem: (itemId: string) => void;
  equipItem: (category: ItemCategory, itemId: string | null) => void;
  hasItem: (itemId: string) => boolean;
  purchaseItem: (item: ShopItem) => boolean;

  // --- Acciones de Tiempo ---
  updatePlayTime: () => void;
  startSession: () => void;
  checkDailyReward: () => { canClaim: boolean; reward: number; day: number };
  claimDailyReward: () => number;

  // --- Acciones de Misiones ---
  updateMissionProgress: (missionId: string, progress: number) => void;
  completeMission: (missionId: string) => void;
  claimMissionReward: (missionId: string) => { coins: number; item?: string } | null;
  resetDailyMissions: () => void;

  // --- Acciones de Stats ---
  incrementStat: (stat: keyof EconomyState['stats'], amount?: number) => void;

  // --- Reset ---
  resetEconomy: () => void;
}

// ============================================
// Defaults
// ============================================

const DEFAULT_STATS = {
  coinsCollected: 0,
  distanceWalked: 0,
  distanceDriven: 0,
  tricksPerformed: 0,
  npcsInteracted: 0,
  itemsPurchased: 0,
};

const DEFAULT_EQUIPPED: Record<ItemCategory, string | null> = {
  character: null,
  accessory: null,
  color: null,
  vehicle: null,
  emote: null,
};

// ============================================
// Store
// ============================================

export const useEconomyStore = create<EconomyState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // --- Initial State ---
        coins: 0,
        totalCoinsEarned: 0,
        unlockedItems: [],
        equippedItems: { ...DEFAULT_EQUIPPED },
        totalPlayTime: 0,
        sessionStartTime: Date.now(),
        lastPlayDate: '',
        consecutiveDays: 0,
        missionProgress: [],
        dailyMissionsResetAt: 0,
        stats: { ...DEFAULT_STATS },

        // --- Coin Actions ---
        addCoins: (amount) =>
          set((state) => ({
            coins: state.coins + amount,
            totalCoinsEarned: state.totalCoinsEarned + amount,
            stats: {
              ...state.stats,
              coinsCollected: state.stats.coinsCollected + amount,
            },
          })),

        spendCoins: (amount) => {
          const { coins } = get();
          if (coins >= amount) {
            set({ coins: coins - amount });
            return true;
          }
          return false;
        },

        // --- Item Actions ---
        unlockItem: (itemId) =>
          set((state) => ({
            unlockedItems: state.unlockedItems.includes(itemId)
              ? state.unlockedItems
              : [...state.unlockedItems, itemId],
          })),

        equipItem: (category, itemId) =>
          set((state) => ({
            equippedItems: {
              ...state.equippedItems,
              [category]: itemId,
            },
          })),

        hasItem: (itemId) => get().unlockedItems.includes(itemId),

        purchaseItem: (item) => {
          const state = get();
          if (state.coins < item.price) return false;
          if (state.unlockedItems.includes(item.id)) return false;

          set({
            coins: state.coins - item.price,
            unlockedItems: [...state.unlockedItems, item.id],
            stats: {
              ...state.stats,
              itemsPurchased: state.stats.itemsPurchased + 1,
            },
          });
          return true;
        },

        // --- Time Actions ---
        updatePlayTime: () => {
          const now = Date.now();
          const { sessionStartTime } = get();
          const sessionSeconds = Math.floor((now - sessionStartTime) / 1000);
          set((state) => ({
            totalPlayTime: state.totalPlayTime + 1,
            sessionStartTime: now - (sessionSeconds % 1) * 1000,
          }));
        },

        startSession: () => set({ sessionStartTime: Date.now() }),

        checkDailyReward: () => {
          const { lastPlayDate, consecutiveDays } = get();
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          if (lastPlayDate === today) {
            return { canClaim: false, reward: 0, day: consecutiveDays };
          }

          const newStreak = lastPlayDate === yesterday ? consecutiveDays + 1 : 1;
          // Rewards escalonados: día 1=10, día 2=20, ..., día 7+=100
          const reward = Math.min(newStreak * 10, 100);

          return { canClaim: true, reward, day: newStreak };
        },

        claimDailyReward: () => {
          const { canClaim, reward, day } = get().checkDailyReward();
          if (!canClaim) return 0;

          const today = new Date().toISOString().split('T')[0];
          set((state) => ({
            coins: state.coins + reward,
            totalCoinsEarned: state.totalCoinsEarned + reward,
            lastPlayDate: today,
            consecutiveDays: day,
          }));

          return reward;
        },

        // --- Mission Actions ---
        updateMissionProgress: (missionId, progress) =>
          set((state) => {
            const existingIndex = state.missionProgress.findIndex(
              (m) => m.missionId === missionId
            );

            if (existingIndex >= 0) {
              const updated = [...state.missionProgress];
              updated[existingIndex] = {
                ...updated[existingIndex],
                current: Math.max(updated[existingIndex].current, progress),
              };
              return { missionProgress: updated };
            }

            return {
              missionProgress: [
                ...state.missionProgress,
                { missionId, current: progress, status: 'active' as MissionStatus },
              ],
            };
          }),

        completeMission: (missionId) =>
          set((state) => {
            const updated = state.missionProgress.map((m) =>
              m.missionId === missionId && m.status === 'active'
                ? { ...m, status: 'completed' as MissionStatus, completedAt: Date.now() }
                : m
            );
            return { missionProgress: updated };
          }),

        claimMissionReward: (missionId) => {
          const state = get();
          const mission = state.missionProgress.find(
            (m) => m.missionId === missionId && m.status === 'completed'
          );

          if (!mission) return null;

          // Buscar la misión en el catálogo para obtener la recompensa
          const missionData = MISSIONS.find((m) => m.id === missionId);
          if (!missionData) return null;

          set((prevState) => ({
            coins: prevState.coins + missionData.reward,
            totalCoinsEarned: prevState.totalCoinsEarned + missionData.reward,
            unlockedItems: missionData.rewardItem
              ? [...prevState.unlockedItems, missionData.rewardItem]
              : prevState.unlockedItems,
            missionProgress: prevState.missionProgress.map((m) =>
              m.missionId === missionId
                ? { ...m, status: 'claimed' as MissionStatus, claimedAt: Date.now() }
                : m
            ),
          }));

          return { coins: missionData.reward, item: missionData.rewardItem };
        },

        resetDailyMissions: () =>
          set((state) => ({
            missionProgress: state.missionProgress.filter((m) => {
              const mission = MISSIONS.find((mi) => mi.id === m.missionId);
              return mission?.category !== 'daily';
            }),
            dailyMissionsResetAt: Date.now(),
          })),

        // --- Stats Actions ---
        incrementStat: (stat, amount = 1) =>
          set((state) => ({
            stats: {
              ...state.stats,
              [stat]: state.stats[stat] + amount,
            },
          })),

        // --- Reset ---
        resetEconomy: () =>
          set({
            coins: 0,
            totalCoinsEarned: 0,
            unlockedItems: [],
            equippedItems: { ...DEFAULT_EQUIPPED },
            totalPlayTime: 0,
            sessionStartTime: Date.now(),
            lastPlayDate: '',
            consecutiveDays: 0,
            missionProgress: [],
            dailyMissionsResetAt: 0,
            stats: { ...DEFAULT_STATS },
          }),
      }),
      {
        name: 'cozy-city-economy',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          coins: state.coins,
          totalCoinsEarned: state.totalCoinsEarned,
          unlockedItems: state.unlockedItems,
          equippedItems: state.equippedItems,
          totalPlayTime: state.totalPlayTime,
          lastPlayDate: state.lastPlayDate,
          consecutiveDays: state.consecutiveDays,
          missionProgress: state.missionProgress,
          dailyMissionsResetAt: state.dailyMissionsResetAt,
          stats: state.stats,
        }),
      }
    )
  )
);

// ============================================
// Shop Catalog
// ============================================

export const SHOP_ITEMS: ShopItem[] = [
  // --- Personajes ---
  {
    id: 'char_panda',
    name: 'Panda',
    description: 'Un adorable panda blanco y negro',
    category: 'character',
    price: 500,
    icon: '🐼',
    unlocks: { characterType: 'panda' },
  },
  {
    id: 'char_fox',
    name: 'Zorro',
    description: 'Un astuto zorro naranja',
    category: 'character',
    price: 500,
    icon: '🦊',
    unlocks: { characterType: 'fox' },
  },
  {
    id: 'char_penguin',
    name: 'Pingüino',
    description: 'Un simpático pingüino del sur',
    category: 'character',
    price: 750,
    icon: '🐧',
    unlocks: { characterType: 'penguin' },
  },
  {
    id: 'char_lion',
    name: 'León',
    description: 'El rey de la ciudad',
    category: 'character',
    price: 1000,
    icon: '🦁',
    unlocks: { characterType: 'lion' },
  },
  {
    id: 'char_tiger',
    name: 'Tigre',
    description: 'Un majestuoso tigre rayado',
    category: 'character',
    price: 1000,
    icon: '🐯',
    unlocks: { characterType: 'tiger' },
  },
  {
    id: 'char_monkey',
    name: 'Mono',
    description: 'Un mono juguetón',
    category: 'character',
    price: 600,
    icon: '🐵',
    unlocks: { characterType: 'monkey' },
  },

  // --- Accesorios ---
  {
    id: 'acc_glasses',
    name: 'Anteojos',
    description: 'Anteojos de sol cool',
    category: 'accessory',
    price: 200,
    icon: '🕶️',
    unlocks: { accessory: 'glasses' },
  },
  {
    id: 'acc_hat',
    name: 'Sombrero',
    description: 'Un elegante sombrero',
    category: 'accessory',
    price: 300,
    icon: '🎩',
    unlocks: { accessory: 'hat' },
  },
  {
    id: 'acc_scarf',
    name: 'Bufanda',
    description: 'Una bufanda abrigada',
    category: 'accessory',
    price: 250,
    icon: '🧣',
    unlocks: { accessory: 'scarf' },
  },
  {
    id: 'acc_mate',
    name: 'Mate',
    description: 'El clásico mate argentino',
    category: 'accessory',
    price: 150,
    icon: '🧉',
    unlocks: { accessory: 'mate' },
  },
  {
    id: 'acc_boina',
    name: 'Boina',
    description: 'Boina tradicional',
    category: 'accessory',
    price: 200,
    icon: '🎓',
    unlocks: { accessory: 'boina' },
  },
  {
    id: 'acc_termo',
    name: 'Termo',
    description: 'Para llevar el agua caliente',
    category: 'accessory',
    price: 300,
    icon: '🫗',
    unlocks: { accessory: 'termo' },
  },
  {
    id: 'acc_argentina',
    name: 'Camiseta Argentina',
    description: 'La gloriosa albiceleste',
    category: 'accessory',
    price: 400,
    icon: '🇦🇷',
    unlocks: { accessory: 'camisetaArg' },
  },

  // --- Colores ---
  {
    id: 'color_gold',
    name: 'Piel Dorada',
    description: 'Brilla como el oro',
    category: 'color',
    price: 800,
    icon: '✨',
    unlocks: { skinColor: '#FFD700' },
  },
  {
    id: 'color_rainbow_shirt',
    name: 'Remera Arcoíris',
    description: 'Todos los colores del arcoíris',
    category: 'color',
    price: 600,
    icon: '🌈',
    unlocks: { shirtColor: '#FF69B4' },
  },
  {
    id: 'color_neon_pants',
    name: 'Pantalón Neón',
    description: 'Pantalones que brillan',
    category: 'color',
    price: 500,
    icon: '💚',
    unlocks: { pantsColor: '#39FF14' },
  },

  // --- Vehículos (para futuro) ---
  {
    id: 'vehicle_gold_skate',
    name: 'Skate Dorado',
    description: 'Un skateboard de oro puro',
    category: 'vehicle',
    price: 2000,
    icon: '🛹',
  },
];

// ============================================
// Missions Catalog
// ============================================

export const MISSIONS: Mission[] = [
  // --- Daily Missions ---
  {
    id: 'daily_collect_10',
    name: 'Coleccionista',
    description: 'Recolecta 10 monedas',
    type: 'collect',
    icon: '🪙',
    target: 10,
    reward: 20,
    repeatable: true,
    category: 'daily',
  },
  {
    id: 'daily_play_5min',
    name: 'Explorador Casual',
    description: 'Juega por 5 minutos',
    type: 'time',
    icon: '⏱️',
    target: 300, // segundos
    reward: 15,
    repeatable: true,
    category: 'daily',
  },
  {
    id: 'daily_tricks_3',
    name: 'Skater del Día',
    description: 'Haz 3 trucos en el skate',
    type: 'trick',
    icon: '🛹',
    target: 3,
    reward: 25,
    repeatable: true,
    category: 'daily',
  },

  // --- Weekly Missions ---
  {
    id: 'weekly_collect_100',
    name: 'Cazador de Tesoros',
    description: 'Recolecta 100 monedas esta semana',
    type: 'collect',
    icon: '💰',
    target: 100,
    reward: 150,
    repeatable: true,
    category: 'weekly',
  },
  {
    id: 'weekly_play_1hr',
    name: 'Ciudadano Dedicado',
    description: 'Juega 1 hora esta semana',
    type: 'time',
    icon: '🏆',
    target: 3600,
    reward: 100,
    repeatable: true,
    category: 'weekly',
  },

  // --- Achievements (One-time) ---
  {
    id: 'ach_first_coin',
    name: 'Primera Moneda',
    description: 'Recolecta tu primera moneda',
    type: 'collect',
    icon: '🌟',
    target: 1,
    reward: 10,
    repeatable: false,
    category: 'achievement',
  },
  {
    id: 'ach_rich_100',
    name: 'Ahorrador',
    description: 'Acumula 100 monedas',
    type: 'collect',
    icon: '💎',
    target: 100,
    reward: 50,
    repeatable: false,
    category: 'achievement',
  },
  {
    id: 'ach_rich_500',
    name: 'Millonario',
    description: 'Acumula 500 monedas',
    type: 'collect',
    icon: '👑',
    target: 500,
    reward: 100,
    rewardItem: 'color_gold',
    repeatable: false,
    category: 'achievement',
  },
  {
    id: 'ach_tricks_10',
    name: 'Pro Skater',
    description: 'Realiza 10 trucos en total',
    type: 'trick',
    icon: '🔥',
    target: 10,
    reward: 75,
    repeatable: false,
    category: 'achievement',
  },
  {
    id: 'ach_play_30min',
    name: 'Residente',
    description: 'Juega 30 minutos en total',
    type: 'time',
    icon: '🏠',
    target: 1800,
    reward: 50,
    repeatable: false,
    category: 'achievement',
  },
  {
    id: 'ach_play_2hr',
    name: 'Vecino Veterano',
    description: 'Juega 2 horas en total',
    type: 'time',
    icon: '🏅',
    target: 7200,
    reward: 200,
    repeatable: false,
    category: 'achievement',
  },
];

// ============================================
// Selectors
// ============================================

export const selectEconomyCoins = (state: EconomyState) => state.coins;
export const selectUnlockedItems = (state: EconomyState) => state.unlockedItems;
export const selectPlayTime = (state: EconomyState) => state.totalPlayTime;
export const selectStats = (state: EconomyState) => state.stats;
export const selectMissions = (state: EconomyState) => state.missionProgress;
