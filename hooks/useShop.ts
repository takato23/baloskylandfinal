/**
 * Shop Hook
 * React hook for shop and inventory management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAvailableSkins,
  getSkinsByCategory,
  getSkinsByRarity,
  getSkin,
  getBundles,
  getBundle,
  getUserInventory,
  getUserSkins,
  purchaseSkin,
  purchaseBundle,
  equipSkin,
  unequipSkin,
  getShopDisplay,
  canUnlockAchievementSkin,
} from '../lib/shop';
import type {
  Skin,
  ShopBundle,
  UserInventory,
  SkinCategory,
  SkinRarity,
  AnimalType,
  AccessoryType,
} from '../types/game';

// ============================================
// Types
// ============================================

export interface SkinWithStatus extends Skin {
  owned: boolean;
  canPurchase: boolean;
}

export interface BundleWithStatus extends ShopBundle {
  ownedCount: number;
  canPurchase: boolean;
}

export interface CategorySkins {
  category: SkinCategory;
  skins: SkinWithStatus[];
}

export interface UseShopReturn {
  // State
  categories: CategorySkins[];
  bundles: BundleWithStatus[];
  inventory: UserInventory | null;
  ownedSkins: Skin[];
  equippedSkinId: string | null;
  previewSkin: Skin | null;
  isLoading: boolean;
  error: string | null;

  // Shop Actions
  purchase: (skinId: string) => Promise<boolean>;
  purchaseBundleById: (bundleId: string) => Promise<{ success: boolean; addedSkins?: string[] }>;

  // Inventory Actions
  equip: (skinId: string) => Promise<{
    success: boolean;
    appearance?: Partial<{
      type: AnimalType;
      skin: string;
      shirt: string;
      pants: string;
      accessory: AccessoryType;
    }>;
  }>;
  unequip: () => Promise<boolean>;

  // Preview
  setPreview: (skinId: string | null) => void;
  getPreviewAppearance: () => Partial<{
    type: AnimalType;
    skin: string;
    shirt: string;
    pants: string;
    accessory: AccessoryType;
  }> | null;

  // Filters
  filterByCategory: (category: SkinCategory) => SkinWithStatus[];
  filterByRarity: (rarity: SkinRarity) => SkinWithStatus[];
  filterOwned: () => SkinWithStatus[];
  filterAvailable: () => SkinWithStatus[];

  // Utilities
  refresh: () => Promise<void>;
  canUnlock: (skinId: string) => Promise<boolean>;
  getSkinById: (skinId: string) => Skin | undefined;
  clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export const useShop = (userId: string): UseShopReturn => {
  const [categories, setCategories] = useState<CategorySkins[]>([]);
  const [bundles, setBundles] = useState<BundleWithStatus[]>([]);
  const [inventory, setInventory] = useState<UserInventory | null>(null);
  const [ownedSkins, setOwnedSkins] = useState<Skin[]>([]);
  const [equippedSkinId, setEquippedSkinId] = useState<string | null>(null);
  const [previewSkin, setPreviewSkin] = useState<Skin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load shop data
  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [shopData, skinsData] = await Promise.all([
        getShopDisplay(userId),
        getUserSkins(userId),
      ]);

      setCategories(shopData.categories);
      setBundles(shopData.bundles);
      setInventory({
        userId,
        coins: shopData.userCoins,
        gems: 0,
        ownedSkins: skinsData.skins.map(s => s.id),
        equippedSkinId: skinsData.equippedId,
      });
      setOwnedSkins(skinsData.skins);
      setEquippedSkinId(skinsData.equippedId || null);
    } catch (err) {
      setError('Failed to load shop');
      console.error('Error loading shop:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  // Purchase skin
  const purchase = useCallback(async (skinId: string): Promise<boolean> => {
    if (!userId) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await purchaseSkin(userId, skinId);

      if (!result.success) {
        setError(result.error || 'Failed to purchase skin');
        return false;
      }

      // Refresh to update inventory
      await refresh();
      return true;
    } catch (err) {
      setError('Failed to purchase skin');
      console.error('Error purchasing skin:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, refresh]);

  // Purchase bundle
  const purchaseBundleById = useCallback(async (
    bundleId: string
  ): Promise<{ success: boolean; addedSkins?: string[] }> => {
    if (!userId) return { success: false };

    setError(null);
    setIsLoading(true);

    try {
      const result = await purchaseBundle(userId, bundleId);

      if (!result.success) {
        setError(result.error || 'Failed to purchase bundle');
        return { success: false };
      }

      // Refresh to update inventory
      await refresh();
      return { success: true, addedSkins: result.addedSkins };
    } catch (err) {
      setError('Failed to purchase bundle');
      console.error('Error purchasing bundle:', err);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [userId, refresh]);

  // Equip skin
  const equip = useCallback(async (
    skinId: string
  ): Promise<{
    success: boolean;
    appearance?: Partial<{
      type: AnimalType;
      skin: string;
      shirt: string;
      pants: string;
      accessory: AccessoryType;
    }>;
  }> => {
    if (!userId) return { success: false };

    setError(null);
    setIsLoading(true);

    try {
      const result = await equipSkin(userId, skinId);

      if (!result.success) {
        setError(result.error || 'Failed to equip skin');
        return { success: false };
      }

      setEquippedSkinId(skinId);
      return { success: true, appearance: result.appearance };
    } catch (err) {
      setError('Failed to equip skin');
      console.error('Error equipping skin:', err);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Unequip skin
  const unequip = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await unequipSkin(userId);

      if (!result.success) {
        setError(result.error || 'Failed to unequip skin');
        return false;
      }

      setEquippedSkinId(null);
      return true;
    } catch (err) {
      setError('Failed to unequip skin');
      console.error('Error unequipping skin:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Set preview
  const setPreview = useCallback((skinId: string | null) => {
    if (skinId) {
      const skin = getSkin(skinId);
      setPreviewSkin(skin || null);
    } else {
      setPreviewSkin(null);
    }
  }, []);

  // Get preview appearance
  const getPreviewAppearance = useCallback((): Partial<{
    type: AnimalType;
    skin: string;
    shirt: string;
    pants: string;
    accessory: AccessoryType;
  }> | null => {
    if (!previewSkin) return null;

    const appearance: Partial<{
      type: AnimalType;
      skin: string;
      shirt: string;
      pants: string;
      accessory: AccessoryType;
    }> = {};

    if (previewSkin.characterType) appearance.type = previewSkin.characterType;
    if (previewSkin.skinColor) appearance.skin = previewSkin.skinColor;
    if (previewSkin.shirtColor) appearance.shirt = previewSkin.shirtColor;
    if (previewSkin.pantsColor) appearance.pants = previewSkin.pantsColor;
    if (previewSkin.accessory) appearance.accessory = previewSkin.accessory;

    return appearance;
  }, [previewSkin]);

  // Filter by category
  const filterByCategory = useCallback((category: SkinCategory): SkinWithStatus[] => {
    const cat = categories.find(c => c.category === category);
    return cat?.skins || [];
  }, [categories]);

  // Filter by rarity
  const filterByRarity = useCallback((rarity: SkinRarity): SkinWithStatus[] => {
    const allSkins: SkinWithStatus[] = [];
    for (const cat of categories) {
      allSkins.push(...cat.skins.filter(s => s.rarity === rarity));
    }
    return allSkins;
  }, [categories]);

  // Filter owned
  const filterOwned = useCallback((): SkinWithStatus[] => {
    const allSkins: SkinWithStatus[] = [];
    for (const cat of categories) {
      allSkins.push(...cat.skins.filter(s => s.owned));
    }
    return allSkins;
  }, [categories]);

  // Filter available for purchase
  const filterAvailable = useCallback((): SkinWithStatus[] => {
    const allSkins: SkinWithStatus[] = [];
    for (const cat of categories) {
      allSkins.push(...cat.skins.filter(s => !s.owned && s.canPurchase));
    }
    return allSkins;
  }, [categories]);

  // Check if can unlock achievement skin
  const canUnlock = useCallback(async (skinId: string): Promise<boolean> => {
    if (!userId) return false;
    return await canUnlockAchievementSkin(userId, skinId);
  }, [userId]);

  // Get skin by ID
  const getSkinById = useCallback((skinId: string): Skin | undefined => {
    return getSkin(skinId);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    categories,
    bundles,
    inventory,
    ownedSkins,
    equippedSkinId,
    previewSkin,
    isLoading,
    error,
    purchase,
    purchaseBundleById,
    equip,
    unequip,
    setPreview,
    getPreviewAppearance,
    filterByCategory,
    filterByRarity,
    filterOwned,
    filterAvailable,
    refresh,
    canUnlock,
    getSkinById,
    clearError,
  };
};

export default useShop;
