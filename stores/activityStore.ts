/**
 * Activity Store - Animal Crossing-style gameplay state
 * Manages fishing, bug catching, fossils, crafting, museum, daily activities
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Vector3 } from '../types/game';
import type {
  Fish, Bug, Fossil, FlowerSpecies,
  CaughtFish, CaughtBug, FoundFossil, PlantedFlower,
  CollectionProgress, FishingState, BugCatchingState, DiggingState,
  Tool, PlayerTools, ToolType, MuseumStats,
} from '../types/collectibles';
import type {
  DailyStreak, DailyTask, TaskProgress, DailyTasksState,
  NookMilesProgress, SeasonalEvent,
} from '../types/daily-events';
import type {
  Recipe, LearnedRecipe, MaterialStack, CraftingState,
  InventorySlot, PlayerInventory, PlayerHome, PlayerCatalog,
} from '../types/crafting';
import type {
  PhotoModeState, SavedPhoto, PhotoGallery, PhotoFilter, FrameStyle,
} from '../types/photo-mode';
import { FISH_DATA } from '../data/fish';
import { BUG_DATA } from '../data/bugs';
import { FOSSIL_DATA } from '../data/fossils';

// ============================================
// Activity State Interface
// ============================================

interface ActivityState {
  // --- Collection Progress ---
  collection: CollectionProgress;

  // --- Caught Items (History) ---
  caughtFish: CaughtFish[];
  caughtBugs: CaughtBug[];
  foundFossils: FoundFossil[];

  // --- Active Activity States ---
  fishing: FishingState;
  bugCatching: BugCatchingState;
  digging: DiggingState;

  // --- Tools ---
  tools: PlayerTools;

  // --- Inventory & Crafting ---
  inventory: PlayerInventory;
  materials: MaterialStack[];
  learnedRecipes: LearnedRecipe[];
  crafting: CraftingState;

  // --- Home ---
  home: PlayerHome | null;

  // --- Catalog ---
  catalog: PlayerCatalog;

  // --- Daily Activities ---
  dailyStreak: DailyStreak;
  dailyTasks: DailyTasksState;
  nookMiles: NookMilesProgress;
  lastDailyReset: string; // YYYY-MM-DD

  // --- Active Events ---
  activeEvent: SeasonalEvent | null;

  // --- Photo Mode ---
  photoMode: PhotoModeState;
  photoGallery: PhotoGallery;

  // --- Museum Donations ---
  museumDonations: {
    fish: string[];
    bugs: string[];
    fossils: string[];
  };

  // --- Statistics ---
  stats: {
    totalFishCaught: number;
    totalBugsCaught: number;
    totalFossilsFound: number;
    totalItemsCrafted: number;
    totalPhotosTaken: number;
    longestFish: number;
    raresCaught: number;
    daysPlayed: number;
  };

  // === ACTIONS ===

  // Fishing Actions
  startFishing: (position: Vector3) => void;
  castLine: () => void;
  reelIn: () => void;
  catchFish: (fish: Fish, size: number) => void;
  failCatch: () => void;
  stopFishing: () => void;

  // Bug Catching Actions
  equipNet: () => void;
  swingNet: (position: Vector3) => void;
  catchBug: (bug: Bug) => void;
  missedBug: () => void;

  // Fossil Actions
  startDigging: (position: Vector3) => void;
  digUp: () => void;
  findFossil: (fossil: Fossil) => void;
  assessFossil: (fossilId: string) => void;

  // Tool Actions
  equipTool: (tool: ToolType | null) => void;
  useTool: () => void;
  craftTool: (toolType: ToolType, tier: 'flimsy' | 'regular' | 'golden') => void;

  // Inventory Actions
  addToInventory: (item: InventorySlot) => void;
  removeFromInventory: (itemId: string, quantity: number) => void;
  addMaterial: (materialId: string, quantity: number) => void;
  removeMaterial: (materialId: string, quantity: number) => boolean;
  hasMaterials: (materials: MaterialStack[]) => boolean;

  // Recipe Actions
  learnRecipe: (recipeId: string) => void;
  startCrafting: (recipe: Recipe) => void;
  completeCrafting: () => void;
  cancelCrafting: () => void;

  // Museum Actions
  donateToMuseum: (type: 'fish' | 'bug' | 'fossil', itemId: string) => void;
  getMuseumStats: () => MuseumStats;

  // Daily Actions
  claimDailyReward: () => boolean;
  completeTask: (taskId: string) => void;
  refreshDailyTasks: () => void;
  addNookMiles: (amount: number) => void;

  // Photo Mode Actions
  enterPhotoMode: () => void;
  exitPhotoMode: () => void;
  setFilter: (filter: PhotoFilter) => void;
  setFrame: (frame: FrameStyle) => void;
  setPose: (poseId: string) => void;
  takePhoto: () => SavedPhoto;
  savePhoto: (photo: SavedPhoto) => void;
  deletePhoto: (photoId: string) => void;

  // Event Actions
  setActiveEvent: (event: SeasonalEvent | null) => void;

  // Reset
  resetProgress: () => void;
}

// ============================================
// Initial State
// ============================================

const initialCollection: CollectionProgress = {
  fish: { caught: [], donated: [], records: {} },
  bugs: { caught: [], donated: [] },
  fossils: { found: [], assessed: [], donated: [], completedSets: [] },
  flowers: { discovered: [], bred: [] },
};

const initialFishing: FishingState = {
  isActive: false,
  castPosition: null,
  fishOnHook: null,
  tension: 0,
  stage: 'idle',
};

const initialBugCatching: BugCatchingState = {
  isActive: false,
  targetBug: null,
  swingCooldown: 0,
  stage: 'idle',
};

const initialDigging: DiggingState = {
  isActive: false,
  targetSpot: null,
  stage: 'idle',
};

// Starter tools - given to new players so they can immediately enjoy activities
const STARTER_TOOLS: Tool[] = [
  {
    type: 'fishing_rod',
    name: 'Flimsy Fishing Rod',
    nameEs: 'Caña de Pescar Básica',
    icon: '🎣',
    durability: 20,
    maxDurability: 20,
    tier: 'flimsy',
  },
  {
    type: 'net',
    name: 'Flimsy Net',
    nameEs: 'Red Básica',
    icon: '🥅',
    durability: 20,
    maxDurability: 20,
    tier: 'flimsy',
  },
  {
    type: 'shovel',
    name: 'Flimsy Shovel',
    nameEs: 'Pala Básica',
    icon: '⛏️',
    durability: 20,
    maxDurability: 20,
    tier: 'flimsy',
  },
];

const initialTools: PlayerTools = {
  equipped: null,
  inventory: [...STARTER_TOOLS],
};

const initialInventory: PlayerInventory = {
  slots: [],
  maxSlots: 20,
  pocketExpansions: 0,
};

const initialCrafting: CraftingState = {
  isOpen: false,
  selectedRecipe: null,
  craftingProgress: 0,
  isCrafting: false,
  workbenchPosition: null,
};

const initialDailyStreak: DailyStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastClaimDate: '',
  totalDaysClaimed: 0,
  weeklyProgress: [false, false, false, false, false, false, false],
};

const initialDailyTasks: DailyTasksState = {
  tasks: [],
  progress: [],
  refreshedAt: 0,
  bonusComplete: false,
};

const initialNookMiles: NookMilesProgress = {
  total: 0,
  lifetime: 0,
  achievements: [],
};

const initialPhotoMode: PhotoModeState = {
  isActive: false,
  camera: {
    isActive: false,
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 50,
    zoom: 1,
    rotation: 0,
    tilt: 0,
    roll: 0,
  },
  filter: 'none',
  customFilter: null,
  pose: 'stand',
  frame: 'none',
  stickers: [],
  caption: '',
  showUI: true,
  hideCharacter: false,
  depthOfField: false,
  dofFocusDistance: 5,
  dofAperture: 2.8,
};

const initialGallery: PhotoGallery = {
  photos: [],
  favorites: [],
  albums: [],
  totalPhotos: 0,
  totalLikes: 0,
  totalShares: 0,
};

const initialStats = {
  totalFishCaught: 0,
  totalBugsCaught: 0,
  totalFossilsFound: 0,
  totalItemsCrafted: 0,
  totalPhotosTaken: 0,
  longestFish: 0,
  raresCaught: 0,
  daysPlayed: 1,
};

// ============================================
// Store Implementation
// ============================================

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      // Initial State
      collection: initialCollection,
      caughtFish: [],
      caughtBugs: [],
      foundFossils: [],
      fishing: initialFishing,
      bugCatching: initialBugCatching,
      digging: initialDigging,
      tools: initialTools,
      inventory: initialInventory,
      materials: [],
      learnedRecipes: [],
      crafting: initialCrafting,
      home: null,
      catalog: { entries: [], wishlist: [] },
      dailyStreak: initialDailyStreak,
      dailyTasks: initialDailyTasks,
      nookMiles: initialNookMiles,
      lastDailyReset: '',
      activeEvent: null,
      photoMode: initialPhotoMode,
      photoGallery: initialGallery,
      museumDonations: { fish: [], bugs: [], fossils: [] },
      stats: initialStats,

      // === FISHING ACTIONS ===
      startFishing: (position) => set({
        fishing: {
          ...initialFishing,
          isActive: true,
          castPosition: position,
          stage: 'casting',
        },
        tools: { ...get().tools, equipped: 'fishing_rod' },
      }),

      castLine: () => set((state) => ({
        fishing: { ...state.fishing, stage: 'waiting' },
      })),

      reelIn: () => set((state) => ({
        fishing: { ...state.fishing, stage: 'reeling', tension: 50 },
      })),

      catchFish: (fish, size) => {
        const state = get();
        const isNewCatch = !state.collection.fish.caught.includes(fish.id);
        const isRecord = size > (state.collection.fish.records[fish.id] || 0);

        const newCaughtFish: CaughtFish = {
          fishId: fish.id,
          caughtAt: Date.now(),
          size,
          isRecord,
          location: state.fishing.castPosition || [0, 0, 0],
        };

        set({
          fishing: { ...initialFishing, stage: 'caught' },
          caughtFish: [...state.caughtFish, newCaughtFish],
          collection: {
            ...state.collection,
            fish: {
              ...state.collection.fish,
              caught: isNewCatch
                ? [...state.collection.fish.caught, fish.id]
                : state.collection.fish.caught,
              records: isRecord
                ? { ...state.collection.fish.records, [fish.id]: size }
                : state.collection.fish.records,
            },
          },
          stats: {
            ...state.stats,
            totalFishCaught: state.stats.totalFishCaught + 1,
            longestFish: Math.max(state.stats.longestFish, size),
            raresCaught: fish.rarity === 'rare' || fish.rarity === 'legendary'
              ? state.stats.raresCaught + 1
              : state.stats.raresCaught,
          },
        });
      },

      failCatch: () => set({
        fishing: { ...initialFishing, stage: 'escaped' },
      }),

      stopFishing: () => set({
        fishing: initialFishing,
      }),

      // === BUG CATCHING ACTIONS ===
      equipNet: () => set({
        bugCatching: { ...initialBugCatching, isActive: true },
        tools: { ...get().tools, equipped: 'net' },
      }),

      swingNet: (position) => set((state) => ({
        bugCatching: {
          ...state.bugCatching,
          stage: 'swinging',
          swingCooldown: Date.now() + 500,
        },
      })),

      catchBug: (bug) => {
        const state = get();
        const isNewCatch = !state.collection.bugs.caught.includes(bug.id);

        const newCaughtBug: CaughtBug = {
          bugId: bug.id,
          caughtAt: Date.now(),
          location: state.bugCatching.targetBug ? [0, 0, 0] : [0, 0, 0],
        };

        set({
          bugCatching: { ...state.bugCatching, stage: 'caught' },
          caughtBugs: [...state.caughtBugs, newCaughtBug],
          collection: {
            ...state.collection,
            bugs: {
              ...state.collection.bugs,
              caught: isNewCatch
                ? [...state.collection.bugs.caught, bug.id]
                : state.collection.bugs.caught,
            },
          },
          stats: {
            ...state.stats,
            totalBugsCaught: state.stats.totalBugsCaught + 1,
            raresCaught: bug.rarity === 'rare' || bug.rarity === 'legendary'
              ? state.stats.raresCaught + 1
              : state.stats.raresCaught,
          },
        });
      },

      missedBug: () => set((state) => ({
        bugCatching: { ...state.bugCatching, stage: 'missed' },
      })),

      // === FOSSIL ACTIONS ===
      startDigging: (position) => set({
        digging: { isActive: true, targetSpot: position, stage: 'digging' },
        tools: { ...get().tools, equipped: 'shovel' },
      }),

      digUp: () => set((state) => ({
        digging: { ...state.digging, stage: 'found' },
      })),

      findFossil: (fossil) => {
        const state = get();
        const newFoundFossil: FoundFossil = {
          fossilId: fossil.id,
          foundAt: Date.now(),
          assessed: false,
          location: state.digging.targetSpot || [0, 0, 0],
        };

        set({
          digging: initialDigging,
          foundFossils: [...state.foundFossils, newFoundFossil],
          collection: {
            ...state.collection,
            fossils: {
              ...state.collection.fossils,
              found: [...state.collection.fossils.found, fossil.id],
            },
          },
          stats: {
            ...state.stats,
            totalFossilsFound: state.stats.totalFossilsFound + 1,
          },
        });
      },

      assessFossil: (fossilId) => set((state) => ({
        collection: {
          ...state.collection,
          fossils: {
            ...state.collection.fossils,
            assessed: [...state.collection.fossils.assessed, fossilId],
          },
        },
        foundFossils: state.foundFossils.map(f =>
          f.fossilId === fossilId ? { ...f, assessed: true } : f
        ),
      })),

      // === TOOL ACTIONS ===
      equipTool: (tool) => set((state) => ({
        tools: { ...state.tools, equipped: tool },
      })),

      useTool: () => {
        const state = get();
        const equipped = state.tools.equipped;
        if (!equipped) return;

        const toolIndex = state.tools.inventory.findIndex(t => t.type === equipped);
        if (toolIndex === -1) return;

        const tool = state.tools.inventory[toolIndex];
        const newDurability = tool.durability - 1;

        if (newDurability <= 0) {
          // Tool breaks
          set({
            tools: {
              equipped: null,
              inventory: state.tools.inventory.filter((_, i) => i !== toolIndex),
            },
          });
        } else {
          set({
            tools: {
              ...state.tools,
              inventory: state.tools.inventory.map((t, i) =>
                i === toolIndex ? { ...t, durability: newDurability } : t
              ),
            },
          });
        }
      },

      craftTool: (toolType, tier) => {
        const durability = tier === 'flimsy' ? 10 : tier === 'regular' ? 30 : 100;
        const toolNames: Record<ToolType, string> = {
          fishing_rod: 'Fishing Rod',
          net: 'Net',
          shovel: 'Shovel',
          watering_can: 'Watering Can',
          axe: 'Axe',
        };

        const newTool: Tool = {
          type: toolType,
          name: `${tier === 'flimsy' ? 'Flimsy' : tier === 'golden' ? 'Golden' : ''} ${toolNames[toolType]}`,
          nameEs: toolNames[toolType],
          icon: toolType === 'fishing_rod' ? '🎣' : toolType === 'net' ? '🥅' : toolType === 'shovel' ? '⛏️' : toolType === 'watering_can' ? '🚿' : '🪓',
          durability,
          maxDurability: durability,
          tier,
        };

        set((state) => ({
          tools: {
            ...state.tools,
            inventory: [...state.tools.inventory, newTool],
          },
        }));
      },

      // === INVENTORY ACTIONS ===
      addToInventory: (item) => set((state) => {
        const existingIndex = state.inventory.slots.findIndex(
          s => s.itemId === item.itemId && s.itemType === item.itemType
        );

        if (existingIndex >= 0) {
          return {
            inventory: {
              ...state.inventory,
              slots: state.inventory.slots.map((s, i) =>
                i === existingIndex
                  ? { ...s, quantity: s.quantity + item.quantity }
                  : s
              ),
            },
          };
        }

        return {
          inventory: {
            ...state.inventory,
            slots: [...state.inventory.slots, item],
          },
        };
      }),

      removeFromInventory: (itemId, quantity) => set((state) => ({
        inventory: {
          ...state.inventory,
          slots: state.inventory.slots
            .map(s => s.itemId === itemId
              ? { ...s, quantity: s.quantity - quantity }
              : s
            )
            .filter(s => s.quantity > 0),
        },
      })),

      addMaterial: (materialId, quantity) => set((state) => {
        const existing = state.materials.find(m => m.materialId === materialId);
        if (existing) {
          return {
            materials: state.materials.map(m =>
              m.materialId === materialId
                ? { ...m, quantity: m.quantity + quantity }
                : m
            ),
          };
        }
        return {
          materials: [...state.materials, { materialId: materialId as any, quantity }],
        };
      }),

      removeMaterial: (materialId, quantity) => {
        const state = get();
        const existing = state.materials.find(m => m.materialId === materialId);
        if (!existing || existing.quantity < quantity) return false;

        set({
          materials: state.materials
            .map(m => m.materialId === materialId
              ? { ...m, quantity: m.quantity - quantity }
              : m
            )
            .filter(m => m.quantity > 0),
        });
        return true;
      },

      hasMaterials: (materials) => {
        const state = get();
        return materials.every(required => {
          const owned = state.materials.find(m => m.materialId === required.materialId);
          return owned && owned.quantity >= required.quantity;
        });
      },

      // === RECIPE ACTIONS ===
      learnRecipe: (recipeId) => set((state) => ({
        learnedRecipes: [
          ...state.learnedRecipes,
          { recipeId, learnedAt: Date.now(), timesCrafted: 0, favorite: false },
        ],
      })),

      startCrafting: (recipe) => set({
        crafting: {
          ...get().crafting,
          isOpen: true,
          selectedRecipe: recipe,
          isCrafting: true,
          craftingProgress: 0,
        },
      }),

      completeCrafting: () => {
        const state = get();
        const recipe = state.crafting.selectedRecipe;
        if (!recipe) return;

        // Remove materials
        recipe.materials.forEach(mat => {
          get().removeMaterial(mat.materialId, mat.quantity);
        });

        // Add crafted item to inventory
        get().addToInventory({
          itemId: recipe.resultItemId,
          itemType: 'furniture',
          quantity: recipe.resultQuantity,
        });

        set({
          crafting: { ...initialCrafting },
          learnedRecipes: state.learnedRecipes.map(r =>
            r.recipeId === recipe.id
              ? { ...r, timesCrafted: r.timesCrafted + 1 }
              : r
          ),
          stats: {
            ...state.stats,
            totalItemsCrafted: state.stats.totalItemsCrafted + 1,
          },
        });
      },

      cancelCrafting: () => set({
        crafting: initialCrafting,
      }),

      // === MUSEUM ACTIONS ===
      donateToMuseum: (type, itemId) => set((state) => {
        const key = type === 'fish' ? 'fish' : type === 'bug' ? 'bugs' : 'fossils';
        return {
          museumDonations: {
            ...state.museumDonations,
            [key]: [...state.museumDonations[key], itemId],
          },
          collection: {
            ...state.collection,
            [type === 'bug' ? 'bugs' : type]: {
              ...state.collection[type === 'bug' ? 'bugs' : type],
              donated: [...state.collection[type === 'bug' ? 'bugs' : type].donated, itemId],
            },
          },
        };
      }),

      getMuseumStats: () => {
        const state = get();
        const totalFish = FISH_DATA.length;
        const totalBugs = BUG_DATA.length;
        const totalFossils = FOSSIL_DATA.length;
        const total = totalFish + totalBugs + totalFossils;

        const donated =
          state.museumDonations.fish.length +
          state.museumDonations.bugs.length +
          state.museumDonations.fossils.length;

        return {
          totalDonations: donated,
          fishCount: state.museumDonations.fish.length,
          bugCount: state.museumDonations.bugs.length,
          fossilCount: state.museumDonations.fossils.length,
          completionPercentage: Math.round((donated / total) * 100),
        };
      },

      // === DAILY ACTIONS ===
      claimDailyReward: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];

        if (state.dailyStreak.lastClaimDate === today) {
          return false; // Already claimed
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isConsecutive = state.dailyStreak.lastClaimDate === yesterday;

        const newStreak = isConsecutive ? state.dailyStreak.currentStreak + 1 : 1;
        const dayIndex = (newStreak - 1) % 7;

        set({
          dailyStreak: {
            currentStreak: newStreak,
            longestStreak: Math.max(state.dailyStreak.longestStreak, newStreak),
            lastClaimDate: today,
            totalDaysClaimed: state.dailyStreak.totalDaysClaimed + 1,
            weeklyProgress: state.dailyStreak.weeklyProgress.map((claimed, i) =>
              i === dayIndex ? true : (i < dayIndex ? claimed : false)
            ),
          },
        });

        return true;
      },

      completeTask: (taskId) => set((state) => ({
        dailyTasks: {
          ...state.dailyTasks,
          progress: state.dailyTasks.progress.map(p =>
            p.taskId === taskId ? { ...p, completed: true, claimedAt: Date.now() } : p
          ),
        },
      })),

      refreshDailyTasks: () => set((state) => ({
        dailyTasks: {
          ...state.dailyTasks,
          refreshedAt: Date.now(),
          bonusComplete: false,
        },
      })),

      addNookMiles: (amount) => set((state) => ({
        nookMiles: {
          ...state.nookMiles,
          total: state.nookMiles.total + amount,
          lifetime: state.nookMiles.lifetime + amount,
        },
      })),

      // === PHOTO MODE ACTIONS ===
      enterPhotoMode: () => set({
        photoMode: { ...get().photoMode, isActive: true },
      }),

      exitPhotoMode: () => set({
        photoMode: { ...initialPhotoMode },
      }),

      setFilter: (filter) => set((state) => ({
        photoMode: { ...state.photoMode, filter },
      })),

      setFrame: (frame) => set((state) => ({
        photoMode: { ...state.photoMode, frame },
      })),

      setPose: (poseId) => set((state) => ({
        photoMode: { ...state.photoMode, pose: poseId },
      })),

      takePhoto: () => {
        const state = get();
        const photo: SavedPhoto = {
          id: `photo_${Date.now()}`,
          takenAt: Date.now(),
          location: 'Cozy City',
          locationEs: 'Ciudad Acogedora',
          filter: state.photoMode.filter,
          frame: state.photoMode.frame,
          pose: state.photoMode.pose,
          caption: state.photoMode.caption,
          thumbnail: '',
          fullImage: '',
          likes: 0,
          shared: false,
          weather: 'sunny',
          timeOfDay: 'day',
        };

        set({
          stats: {
            ...state.stats,
            totalPhotosTaken: state.stats.totalPhotosTaken + 1,
          },
        });

        return photo;
      },

      savePhoto: (photo) => set((state) => ({
        photoGallery: {
          ...state.photoGallery,
          photos: [...state.photoGallery.photos, photo],
          totalPhotos: state.photoGallery.totalPhotos + 1,
        },
      })),

      deletePhoto: (photoId) => set((state) => ({
        photoGallery: {
          ...state.photoGallery,
          photos: state.photoGallery.photos.filter(p => p.id !== photoId),
          favorites: state.photoGallery.favorites.filter(id => id !== photoId),
        },
      })),

      // === EVENT ACTIONS ===
      setActiveEvent: (event) => set({ activeEvent: event }),

      // === RESET ===
      resetProgress: () => set({
        collection: initialCollection,
        caughtFish: [],
        caughtBugs: [],
        foundFossils: [],
        fishing: initialFishing,
        bugCatching: initialBugCatching,
        digging: initialDigging,
        tools: initialTools,
        inventory: initialInventory,
        materials: [],
        learnedRecipes: [],
        crafting: initialCrafting,
        home: null,
        catalog: { entries: [], wishlist: [] },
        dailyStreak: initialDailyStreak,
        dailyTasks: initialDailyTasks,
        nookMiles: initialNookMiles,
        lastDailyReset: '',
        activeEvent: null,
        photoMode: initialPhotoMode,
        photoGallery: initialGallery,
        museumDonations: { fish: [], bugs: [], fossils: [] },
        stats: initialStats,
      }),
    }),
    {
      name: 'cozy-city-activity-storage',
      partialize: (state) => ({
        // Only persist these fields
        collection: state.collection,
        caughtFish: state.caughtFish,
        caughtBugs: state.caughtBugs,
        foundFossils: state.foundFossils,
        tools: state.tools,
        inventory: state.inventory,
        materials: state.materials,
        learnedRecipes: state.learnedRecipes,
        home: state.home,
        catalog: state.catalog,
        dailyStreak: state.dailyStreak,
        nookMiles: state.nookMiles,
        lastDailyReset: state.lastDailyReset,
        photoGallery: state.photoGallery,
        museumDonations: state.museumDonations,
        stats: state.stats,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectFishingState = (state: ActivityState) => state.fishing;
export const selectBugCatchingState = (state: ActivityState) => state.bugCatching;
export const selectCollection = (state: ActivityState) => state.collection;
export const selectTools = (state: ActivityState) => state.tools;
export const selectInventory = (state: ActivityState) => state.inventory;
export const selectPhotoMode = (state: ActivityState) => state.photoMode;
export const selectDailyStreak = (state: ActivityState) => state.dailyStreak;
export const selectStats = (state: ActivityState) => state.stats;
export const selectMuseumDonations = (state: ActivityState) => state.museumDonations;
