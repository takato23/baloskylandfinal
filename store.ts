/**
 * Game State Store
 * Centralized state management using Zustand
 * Organized by domain for better maintainability
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { RefObject } from 'react';
import { RapierRigidBody } from '@react-three/rapier';
import type {
  AnimalType,
  AccessoryType,
  WeatherType,
  TrafficState,
  NpcConfig,
  ChatMessage,
  LiveConnectionState,
  Vector3,
  CharacterAppearance,
  MobileInputState,
  InventoryItem,
} from './types';
import { ANIMAL_TYPES } from './types';

// Re-export types for backward compatibility
export type { AnimalType, AccessoryType, WeatherType, TrafficState, NpcConfig, ChatMessage, InventoryItem };

// ============================================
// Controls Configuration
// ============================================

export const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  jump: 'jump',
  run: 'run',
  interact: 'interact',
  horn: 'horn',
} as const;

// ============================================
// State Interface
// ============================================

interface GameState {
  // --- Game Progress ---
  coins: number;
  addCoin: (value?: number) => void;
  setCoins: (coins: number) => void;

  // --- Inventory ---
  inventory: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string, count?: number) => void;
  hasItem: (itemId: string, count?: number) => boolean;

  // --- Multiplayer Identity ---
  multiplayerId: string | null;
  multiplayerName: string;
  setMultiplayerId: (id: string | null) => void;
  setMultiplayerName: (name: string) => void;

  // --- Leaderboard ---
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;

  // --- Environment ---
  isNight: boolean;
  setIsNight: (isNight: boolean) => void;
  weather: WeatherType;
  setWeather: (weather: WeatherType) => void;
  trafficState: TrafficState;
  setTrafficState: (state: TrafficState) => void;

  // --- Character Customization ---
  character: CharacterAppearance;
  setSkin: (color: string) => void;
  setShirt: (color: string) => void;
  setPants: (color: string) => void;
  setType: (type: AnimalType) => void;
  setAccessory: (acc: AccessoryType) => void;
  setCharacter: (updates: Partial<CharacterAppearance>) => void;

  // --- Interaction System ---
  interactionLabel: string | null;
  setInteractionLabel: (label: string | null) => void;
  isHolding: boolean;
  setHolding: (holding: boolean) => void;

  // --- Static Dialogue ---
  dialogue: {
    isOpen: boolean;
    title: string;
    text: string;
  };
  openDialogue: (title: string, text: string) => void;
  closeDialogue: () => void;

  // --- Live Voice Session (Gemini) ---
  liveSession: {
    isOpen: boolean;
    npc: NpcConfig | null;
    messages: ChatMessage[];
  };
  liveConnectionState: LiveConnectionState;
  liveVolume: number;
  startLiveSession: (npc: NpcConfig) => void;
  endLiveSession: () => void;
  setLiveConnectionState: (state: LiveConnectionState) => void;
  setLiveVolume: (vol: number) => void;
  addChatMessage: (sender: 'user' | 'npc', text: string) => void;
  clearChatMessages: () => void;

  // --- Player Physical State ---
  isSitting: boolean;
  sitTarget: Vector3 | null;
  sitRotation: Vector3 | null;
  startSitting: (pos: Vector3, rot: Vector3) => void;
  stopSitting: () => void;

  // --- Vehicle State ---
  isDriving: boolean;
  vehicleType: 'skateboard' | null;
  setDriving: (driving: boolean, vehicleType?: 'skateboard' | null) => void;

  // --- Skateboard State ---
  skateboardSpeed: number;
  currentTrick: string | null;
  trickCombo: number;
  lastTrickTime: number;
  setSkateboardSpeed: (speed: number) => void;
  setCurrentTrick: (trick: string | null) => void;
  setTrickCombo: (combo: number) => void;
  updateLastTrickTime: () => void;

  // --- Mobile Input ---
  mobileInput: MobileInputState;
  setJoystick: (x: number, y: number, active: boolean) => void;
  setMobileButton: (btn: 'jump' | 'interact' | 'run' | 'horn', active: boolean) => void;
  resetMobileInput: () => void;

  // --- Run Lock (para botón trabable de correr) ---
  isRunLocked: boolean;
  toggleRunLock: () => void;
  setRunLock: (locked: boolean) => void;

  // --- Player Tracking ---
  playerRef: RefObject<RapierRigidBody> | null;
  setPlayerRef: (ref: RefObject<RapierRigidBody>) => void;
  playerPosition: Vector3;
  setPlayerPosition: (pos: Vector3) => void;

  // --- Accessibility ---
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (enabled: boolean) => void;

  // --- Quality Preset ---
  qualityLevel: 'mobile' | 'low' | 'medium' | 'high';
  setQualityLevel: (level: 'mobile' | 'low' | 'medium' | 'high') => void;
}

// ============================================
// Default Values
// ============================================

// Random color generator for character customization
const getRandomColor = () => {
  const colors = [
    '#fcd5ce', '#f8b4b4', '#a8d5ba', '#b8d4e3', '#f9e79f',
    '#d7bde2', '#aed6f1', '#f5b7b1', '#d5f5e3', '#fadbd8',
    '#e8daef', '#d4efdf', '#fcf3cf', '#d6eaf8', '#fdebd0'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomShirtColor = () => {
  const colors = [
    '#FF9A8B', '#667eea', '#f093fb', '#4facfe', '#43e97b',
    '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#fed6e3',
    '#d299c2', '#fef9d7', '#96fbc4', '#f77062', '#c471f5'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomPantsColor = () => {
  const colors = [
    '#4a90e2', '#2c3e50', '#8e44ad', '#16a085', '#d35400',
    '#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f39c12',
    '#27ae60', '#e67e22', '#2980b9', '#c0392b', '#7f8c8d'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Get random animal type
const getRandomAnimalType = (): AnimalType => {
  return ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)];
};

// Generate a random character appearance
const generateRandomCharacter = (): CharacterAppearance => ({
  type: getRandomAnimalType(),
  skin: getRandomColor(),
  shirt: getRandomShirtColor(),
  pants: getRandomPantsColor(),
  accessory: 'backpack',
});

// Storage key for character persistence
const CHARACTER_STORAGE_KEY = 'villa_libertad_character';

// Load character from localStorage or generate random one
const loadOrCreateCharacter = (): CharacterAppearance => {
  try {
    const saved = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the saved character has all required fields
      if (parsed.type && parsed.skin && parsed.shirt && parsed.pants) {
        return parsed as CharacterAppearance;
      }
    }
  } catch (e) {
    console.log('Creating new random character for player');
  }

  // Generate and save a new random character
  const newCharacter = generateRandomCharacter();
  try {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(newCharacter));
  } catch (e) {
    // localStorage might be full or unavailable
  }
  return newCharacter;
};

// Save character to localStorage
const saveCharacter = (character: CharacterAppearance) => {
  try {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character));
  } catch (e) {
    // localStorage might be full or unavailable
  }
};

const DEFAULT_CHARACTER: CharacterAppearance = loadOrCreateCharacter();

const DEFAULT_MOBILE_INPUT: MobileInputState = {
  joystick: { x: 0, y: 0, active: false },
  buttons: { jump: false, run: false, interact: false, horn: false },
};

// ============================================
// Store Implementation
// ============================================

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // --- Game Progress ---
    coins: 0,
    addCoin: (value = 1) => set((state) => ({ coins: state.coins + value })),
    setCoins: (coins) => set({ coins }),

    // --- Inventory ---
    inventory: [],
    addItem: (newItem) =>
      set((state) => {
        const existingItemIndex = state.inventory.findIndex((i) => i.id === newItem.id);
        if (existingItemIndex >= 0 && state.inventory[existingItemIndex].stackable) {
          const updatedInventory = [...state.inventory];
          updatedInventory[existingItemIndex].count += newItem.count;
          return { inventory: updatedInventory };
        }
        return { inventory: [...state.inventory, newItem] };
      }),
    removeItem: (itemId, count = 1) =>
      set((state) => {
        const existingItemIndex = state.inventory.findIndex((i) => i.id === itemId);
        if (existingItemIndex >= 0) {
          const updatedInventory = [...state.inventory];
          const item = updatedInventory[existingItemIndex];
          if (item.count > count) {
            item.count -= count;
          } else {
            updatedInventory.splice(existingItemIndex, 1);
          }
          return { inventory: updatedInventory };
        }
        return state;
      }),
    hasItem: (itemId, count = 1) => {
      const item = get().inventory.find((i) => i.id === itemId);
      return item ? item.count >= count : false;
    },

    // --- Multiplayer Identity ---
    multiplayerId: null,
    multiplayerName: 'Player',
    setMultiplayerId: (id) => set({ multiplayerId: id }),
    setMultiplayerName: (name) => set({ multiplayerName: name }),

    // --- Leaderboard ---
    showLeaderboard: false,
    setShowLeaderboard: (show) => set({ showLeaderboard: show }),

    // --- Environment ---
    isNight: false,
    setIsNight: (isNight) => set({ isNight }),

    weather: 'sunny',
    setWeather: (weather) => set({ weather }),

    trafficState: 'NS_GREEN',
    setTrafficState: (trafficState) => set({ trafficState }),

    // --- Character Customization ---
    character: DEFAULT_CHARACTER,

    setSkin: (color) =>
      set((state) => {
        const newCharacter = { ...state.character, skin: color };
        saveCharacter(newCharacter);
        return { character: newCharacter };
      }),

    setShirt: (color) =>
      set((state) => {
        const newCharacter = { ...state.character, shirt: color };
        saveCharacter(newCharacter);
        return { character: newCharacter };
      }),

    setPants: (color) =>
      set((state) => {
        const newCharacter = { ...state.character, pants: color };
        saveCharacter(newCharacter);
        return { character: newCharacter };
      }),

    setType: (type) =>
      set((state) => {
        const newCharacter = { ...state.character, type };
        saveCharacter(newCharacter);
        return { character: newCharacter };
      }),

    setAccessory: (accessory) =>
      set((state) => {
        const newCharacter = { ...state.character, accessory };
        saveCharacter(newCharacter);
        return { character: newCharacter };
      }),

    // Update multiple character properties at once
    setCharacter: (updates) =>
      set((state) => {
        const newCharacter = { ...state.character, ...updates };
        saveCharacter(newCharacter);
        return { character: newCharacter };
      }),

    // --- Interaction System ---
    interactionLabel: null,
    setInteractionLabel: (label) => set({ interactionLabel: label }),

    isHolding: false,
    setHolding: (holding) => set({ isHolding: holding }),

    // --- Static Dialogue ---
    dialogue: { isOpen: false, title: '', text: '' },

    openDialogue: (title, text) =>
      set({
        dialogue: { isOpen: true, title, text },
        interactionLabel: null,
      }),

    closeDialogue: () =>
      set({
        dialogue: { isOpen: false, title: '', text: '' },
      }),

    // --- Live Voice Session (Gemini) ---
    liveSession: { isOpen: false, npc: null, messages: [] },
    liveConnectionState: 'disconnected',
    liveVolume: 0,

    startLiveSession: (npc) =>
      set({
        liveSession: { isOpen: true, npc, messages: [] },
        interactionLabel: null,
        liveConnectionState: 'connecting',
      }),

    endLiveSession: () =>
      set({
        liveSession: { isOpen: false, npc: null, messages: [] },
        liveConnectionState: 'disconnected',
        liveVolume: 0,
      }),

    setLiveConnectionState: (liveConnectionState) => set({ liveConnectionState }),

    setLiveVolume: (vol) => set({ liveVolume: Math.max(0, Math.min(1, vol)) }),

    addChatMessage: (sender, text) =>
      set((state) => ({
        liveSession: {
          ...state.liveSession,
          messages: [
            ...state.liveSession.messages,
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sender,
              text,
              timestamp: Date.now(),
            },
          ],
        },
      })),

    clearChatMessages: () =>
      set((state) => ({
        liveSession: {
          ...state.liveSession,
          messages: [],
        },
      })),

    // --- Player Physical State ---
    isSitting: false,
    sitTarget: null,
    sitRotation: null,

    startSitting: (pos, rot) =>
      set({
        isSitting: true,
        sitTarget: pos,
        sitRotation: rot,
        interactionLabel: null,
      }),

    stopSitting: () =>
      set({
        isSitting: false,
        sitTarget: null,
        sitRotation: null,
      }),

    // --- Vehicle State ---
    isDriving: false,
    vehicleType: null,

    setDriving: (driving, vehicleType = null) =>
      set({
        isDriving: driving,
        vehicleType: driving ? vehicleType : null,
        // Clear interaction label when entering/exiting vehicle
        interactionLabel: null,
        // Reset skateboard state when exiting
        ...((!driving) && {
          skateboardSpeed: 0,
          currentTrick: null,
          trickCombo: 0,
        }),
      }),

    // --- Skateboard State ---
    skateboardSpeed: 0,
    currentTrick: null,
    trickCombo: 0,
    lastTrickTime: 0,

    setSkateboardSpeed: (speed) => set({ skateboardSpeed: speed }),

    setCurrentTrick: (trick) =>
      set({
        currentTrick: trick,
        lastTrickTime: trick ? Date.now() : get().lastTrickTime,
      }),

    setTrickCombo: (combo) => set({ trickCombo: combo }),

    updateLastTrickTime: () => set({ lastTrickTime: Date.now() }),

    // --- Mobile Input ---
    mobileInput: DEFAULT_MOBILE_INPUT,

    setJoystick: (x, y, active) =>
      set((state) => ({
        mobileInput: {
          ...state.mobileInput,
          joystick: { x, y, active },
        },
      })),

    setMobileButton: (btn, active) =>
      set((state) => ({
        mobileInput: {
          ...state.mobileInput,
          buttons: { ...state.mobileInput.buttons, [btn]: active },
        },
      })),

    resetMobileInput: () =>
      set({
        mobileInput: DEFAULT_MOBILE_INPUT,
      }),

    // --- Run Lock (para botón trabable de correr) ---
    isRunLocked: false,
    toggleRunLock: () =>
      set((state) => ({
        isRunLocked: !state.isRunLocked,
        // Cuando se traba, también activamos el botón de correr en mobile
        mobileInput: {
          ...state.mobileInput,
          buttons: {
            ...state.mobileInput.buttons,
            run: !state.isRunLocked, // Se invierte porque aún no cambió el estado
          },
        },
      })),
    setRunLock: (locked) =>
      set((state) => ({
        isRunLocked: locked,
        mobileInput: {
          ...state.mobileInput,
          buttons: {
            ...state.mobileInput.buttons,
            run: locked,
          },
        },
      })),

    // --- Player Tracking ---
    playerRef: null,
    setPlayerRef: (ref) => set({ playerRef: ref }),

    playerPosition: [0, 0, 0],
    setPlayerPosition: (pos) => set({ playerPosition: pos }),

    // --- Accessibility ---
    highContrast: false,
    setHighContrast: (enabled) => set({ highContrast: enabled }),
    reduceMotion: false,
    setReduceMotion: (enabled) => set({ reduceMotion: enabled }),

    // --- Quality Preset ---
    qualityLevel: 'medium',
    setQualityLevel: (qualityLevel) => set({ qualityLevel }),
  }))
);

// ============================================
// Selector Helpers (for performance)
// ============================================

// Use these for components that only need specific state slices
export const selectCharacter = (state: GameState) => state.character;
export const selectEnvironment = (state: GameState) => ({
  isNight: state.isNight,
  weather: state.weather,
  trafficState: state.trafficState,
});
export const selectPlayerState = (state: GameState) => ({
  isSitting: state.isSitting,
  isDriving: state.isDriving,
  isHolding: state.isHolding,
  playerPosition: state.playerPosition,
});
export const selectLiveSession = (state: GameState) => ({
  liveSession: state.liveSession,
  liveConnectionState: state.liveConnectionState,
  liveVolume: state.liveVolume,
});
export const selectMobileInput = (state: GameState) => state.mobileInput;
export const selectSkateboardState = (state: GameState) => ({
  skateboardSpeed: state.skateboardSpeed,
  currentTrick: state.currentTrick,
  trickCombo: state.trickCombo,
  lastTrickTime: state.lastTrickTime,
  isDriving: state.isDriving,
  vehicleType: state.vehicleType,
});
