/**
 * Shop & Skins System
 * In-game store with skins, bundles, and inventory management
 */

import { supabase, isSupabaseConfigured, isTableAvailable, markTableMissing, isMissingTableError, hasPendingTableCheck } from './supabase';
import type {
  Skin,
  UserSkin,
  ShopBundle,
  UserInventory,
  SkinRarity,
  SkinCategory,
  CurrencyType,
  AnimalType,
  AccessoryType,
} from '../types/game';
import { trackEvent } from './achievements';

// ============================================
// Default Skins Catalog
// ============================================

export const DEFAULT_SKINS: Skin[] = [
  // Character Type Skins - Common
  {
    id: 'char_cat',
    name: 'Cool Cat',
    description: 'A sleek feline explorer',
    category: 'character',
    rarity: 'common',
    price: 100,
    currency: 'coins',
    characterType: 'cat',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'char_rabbit',
    name: 'Bouncy Bunny',
    description: 'Hop around the city!',
    category: 'character',
    rarity: 'common',
    price: 100,
    currency: 'coins',
    characterType: 'rabbit',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'char_fox',
    name: 'Sly Fox',
    description: 'Clever and quick',
    category: 'character',
    rarity: 'uncommon',
    price: 250,
    currency: 'coins',
    characterType: 'fox',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'char_panda',
    name: 'Peaceful Panda',
    description: 'Chill vibes only',
    category: 'character',
    rarity: 'uncommon',
    price: 250,
    currency: 'coins',
    characterType: 'panda',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'char_lion',
    name: 'Majestic Lion',
    description: 'King of the city',
    category: 'character',
    rarity: 'rare',
    price: 500,
    currency: 'coins',
    characterType: 'lion',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'char_tiger',
    name: 'Fierce Tiger',
    description: 'Stripes of power',
    category: 'character',
    rarity: 'rare',
    price: 500,
    currency: 'coins',
    characterType: 'tiger',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'char_penguin',
    name: 'Arctic Penguin',
    description: 'Waddle with style',
    category: 'character',
    rarity: 'epic',
    price: 1000,
    currency: 'coins',
    characterType: 'penguin',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'char_platypus',
    name: 'Mysterious Platypus',
    description: 'The rarest of them all',
    category: 'character',
    rarity: 'legendary',
    price: 2500,
    currency: 'coins',
    characterType: 'platypus',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },

  // Color Skins
  {
    id: 'color_neon_pink',
    name: 'Neon Pink',
    description: 'Glow in the city nights',
    category: 'color',
    rarity: 'uncommon',
    price: 200,
    currency: 'coins',
    skinColor: '#ff69b4',
    shirtColor: '#ff1493',
    pantsColor: '#c71585',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'color_ocean_blue',
    name: 'Ocean Blue',
    description: 'Deep sea vibes',
    category: 'color',
    rarity: 'uncommon',
    price: 200,
    currency: 'coins',
    skinColor: '#87ceeb',
    shirtColor: '#4169e1',
    pantsColor: '#191970',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'color_forest_green',
    name: 'Forest Green',
    description: 'One with nature',
    category: 'color',
    rarity: 'uncommon',
    price: 200,
    currency: 'coins',
    skinColor: '#98fb98',
    shirtColor: '#228b22',
    pantsColor: '#006400',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'color_sunset_orange',
    name: 'Sunset Orange',
    description: 'Warm evening glow',
    category: 'color',
    rarity: 'rare',
    price: 400,
    currency: 'coins',
    skinColor: '#ffa07a',
    shirtColor: '#ff4500',
    pantsColor: '#8b0000',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'color_galaxy_purple',
    name: 'Galaxy Purple',
    description: 'Cosmic explorer',
    category: 'color',
    rarity: 'epic',
    price: 800,
    currency: 'coins',
    skinColor: '#dda0dd',
    shirtColor: '#9932cc',
    pantsColor: '#4b0082',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'color_golden',
    name: 'Golden Glory',
    description: 'Shine like a champion',
    category: 'color',
    rarity: 'legendary',
    price: 2000,
    currency: 'coins',
    skinColor: '#ffd700',
    shirtColor: '#daa520',
    pantsColor: '#b8860b',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },

  // Accessory Skins
  {
    id: 'acc_glasses',
    name: 'Cool Shades',
    description: 'Block out the haters',
    category: 'accessory',
    rarity: 'common',
    price: 75,
    currency: 'coins',
    accessory: 'glasses',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'acc_hat',
    name: 'Trendy Hat',
    description: 'Top off your look',
    category: 'accessory',
    rarity: 'common',
    price: 75,
    currency: 'coins',
    accessory: 'hat',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'acc_scarf',
    name: 'Cozy Scarf',
    description: 'Stay warm and stylish',
    category: 'accessory',
    rarity: 'uncommon',
    price: 150,
    currency: 'coins',
    accessory: 'scarf',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'acc_mate',
    name: 'Mate Cup',
    description: 'Argentine style',
    category: 'accessory',
    rarity: 'rare',
    price: 350,
    currency: 'coins',
    accessory: 'mate',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },
  {
    id: 'acc_phone',
    name: 'Smartphone',
    description: 'Always connected',
    category: 'accessory',
    rarity: 'rare',
    price: 350,
    currency: 'coins',
    accessory: 'phone',
    isAvailable: true,
    isLimitedTime: false,
    createdAt: Date.now(),
  },

  // Limited Time Skins
  {
    id: 'limited_winter_bear',
    name: 'Winter Bear',
    description: 'Limited edition winter skin!',
    category: 'character',
    rarity: 'epic',
    price: 1500,
    currency: 'coins',
    characterType: 'bear',
    skinColor: '#e0ffff',
    shirtColor: '#00bfff',
    pantsColor: '#1e90ff',
    accessory: 'scarf',
    isAvailable: true,
    isLimitedTime: true,
    availableUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    createdAt: Date.now(),
  },

  // Achievement Exclusive Skins
  {
    id: 'explorer_skin_platinum',
    name: 'World Explorer',
    description: 'Unlocked by walking 100,000 meters',
    category: 'character',
    rarity: 'legendary',
    price: 0,
    currency: 'coins',
    characterType: 'deer',
    skinColor: '#f5deb3',
    shirtColor: '#8b4513',
    pantsColor: '#654321',
    accessory: 'backpack',
    isAvailable: false,
    isLimitedTime: false,
    requiresAchievement: 'explorer_4',
    createdAt: Date.now(),
  },
  {
    id: 'collector_skin_platinum',
    name: 'Golden Collector',
    description: 'Unlocked by collecting 50,000 coins',
    category: 'color',
    rarity: 'legendary',
    price: 0,
    currency: 'coins',
    skinColor: '#ffd700',
    shirtColor: '#ffec8b',
    pantsColor: '#daa520',
    isAvailable: false,
    isLimitedTime: false,
    requiresAchievement: 'collector_4',
    createdAt: Date.now(),
  },
  {
    id: 'racer_skin_gold',
    name: 'Speed Racer',
    description: 'Unlocked by winning 10 races',
    category: 'character',
    rarity: 'epic',
    price: 0,
    currency: 'coins',
    characterType: 'raccoon',
    skinColor: '#696969',
    shirtColor: '#ff0000',
    pantsColor: '#000000',
    accessory: 'glasses',
    isAvailable: false,
    isLimitedTime: false,
    requiresAchievement: 'racer_4',
    createdAt: Date.now(),
  },
  {
    id: 'style_skin_gold',
    name: 'Fashion Icon',
    description: 'Unlocked by buying 50 skins',
    category: 'character',
    rarity: 'epic',
    price: 0,
    currency: 'coins',
    characterType: 'monkey',
    skinColor: '#deb887',
    shirtColor: '#ff69b4',
    pantsColor: '#9400d3',
    accessory: 'glasses',
    isAvailable: false,
    isLimitedTime: false,
    requiresAchievement: 'style_3',
    createdAt: Date.now(),
  },
  {
    id: 'special_skin_events',
    name: 'Event Champion',
    description: 'Unlocked by winning 5 events',
    category: 'character',
    rarity: 'legendary',
    price: 0,
    currency: 'coins',
    characterType: 'elephant',
    skinColor: '#b0c4de',
    shirtColor: '#4169e1',
    pantsColor: '#191970',
    accessory: 'hat',
    isAvailable: false,
    isLimitedTime: false,
    requiresAchievement: 'special_2',
    createdAt: Date.now(),
  },
];

// ============================================
// Default Bundles
// ============================================

export const DEFAULT_BUNDLES: ShopBundle[] = [
  {
    id: 'bundle_starter',
    name: 'Starter Pack',
    description: 'Great value for new players!',
    skinIds: ['char_cat', 'char_rabbit', 'acc_glasses', 'acc_hat'],
    originalPrice: 350,
    bundlePrice: 250,
    currency: 'coins',
    isAvailable: true,
  },
  {
    id: 'bundle_predator',
    name: 'Predator Pack',
    description: 'Unleash your wild side',
    skinIds: ['char_fox', 'char_lion', 'char_tiger'],
    originalPrice: 1250,
    bundlePrice: 900,
    currency: 'coins',
    isAvailable: true,
  },
  {
    id: 'bundle_rainbow',
    name: 'Rainbow Colors',
    description: 'All color skins in one pack',
    skinIds: ['color_neon_pink', 'color_ocean_blue', 'color_forest_green', 'color_sunset_orange', 'color_galaxy_purple'],
    originalPrice: 1800,
    bundlePrice: 1200,
    currency: 'coins',
    isAvailable: true,
  },
];

// ============================================
// Shop Management
// ============================================

/**
 * Get all available skins
 */
export const getAvailableSkins = (): Skin[] => {
  const now = Date.now();
  return DEFAULT_SKINS.filter(skin => {
    if (!skin.isAvailable && !skin.requiresAchievement) return false;
    if (skin.isLimitedTime && skin.availableUntil && skin.availableUntil < now) return false;
    return true;
  });
};

/**
 * Get skins by category
 */
export const getSkinsByCategory = (category: SkinCategory): Skin[] => {
  return getAvailableSkins().filter(skin => skin.category === category);
};

/**
 * Get skins by rarity
 */
export const getSkinsByRarity = (rarity: SkinRarity): Skin[] => {
  return getAvailableSkins().filter(skin => skin.rarity === rarity);
};

/**
 * Get skin by ID
 */
export const getSkin = (id: string): Skin | undefined => {
  return DEFAULT_SKINS.find(skin => skin.id === id);
};

/**
 * Get all bundles
 */
export const getBundles = (): ShopBundle[] => {
  return DEFAULT_BUNDLES.filter(bundle => bundle.isAvailable);
};

/**
 * Get bundle by ID
 */
export const getBundle = (id: string): ShopBundle | undefined => {
  return DEFAULT_BUNDLES.find(bundle => bundle.id === id);
};

// ============================================
// User Inventory
// ============================================

/**
 * Get user inventory
 */
export const getUserInventory = async (
  userId: string
): Promise<{ inventory?: UserInventory; error?: string }> => {
  // Return default inventory if Supabase not configured or tables missing
  const defaultInventory = (): { inventory: UserInventory } => ({
    inventory: {
      userId,
      coins: 0,
      gems: 0,
      ownedSkins: [],
      equippedSkinId: undefined,
    },
  });

  if (!isSupabaseConfigured()) {
    return defaultInventory();
  }

  try {
    let coins = 0;
    let ownedSkins: string[] = [];
    let equippedSkin: string | undefined;

    // Get user coins and gems (only if table available and no pending check)
    if (isTableAvailable('player_profiles') && !hasPendingTableCheck('player_profiles')) {
      const { data: profile, error: profileError } = await supabase
        .from('player_profiles')
        .select('coins')
        .eq('id', userId)
        .single();

      if (profileError && isMissingTableError(profileError)) {
        markTableMissing('player_profiles');
      } else if (profile) {
        coins = profile.coins || 0;
      }
    }

    // Get owned skins (only if table available and no pending check)
    if (isTableAvailable('user_skins') && !hasPendingTableCheck('user_skins')) {
      const { data: skins, error: skinsError } = await supabase
        .from('user_skins')
        .select('skin_id, equipped_at')
        .eq('user_id', userId);

      if (skinsError && isMissingTableError(skinsError)) {
        markTableMissing('user_skins');
      } else if (skins) {
        ownedSkins = skins.map((s: any) => s.skin_id);
        equippedSkin = skins.find((s: any) => s.equipped_at)?.skin_id;
      }
    }

    const inventory: UserInventory = {
      userId,
      coins,
      gems: 0, // Premium currency - implement later
      ownedSkins,
      equippedSkinId: equippedSkin,
    };

    return { inventory };
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return defaultInventory();
  }
};

/**
 * Get user's owned skins with full details
 */
export const getUserSkins = async (
  userId: string
): Promise<{ skins: Skin[]; equippedId?: string; error?: string }> => {
  // Skip if Supabase not configured, table missing, or already checking
  if (!isSupabaseConfigured() || !isTableAvailable('user_skins') || hasPendingTableCheck('user_skins')) {
    return { skins: [] };
  }

  try {
    const { data, error } = await supabase
      .from('user_skins')
      .select('skin_id, equipped_at')
      .eq('user_id', userId);

    if (error && isMissingTableError(error)) {
      markTableMissing('user_skins');
      return { skins: [] };
    }

    const ownedIds = new Set((data || []).map((s: any) => s.skin_id));
    const equippedId = data?.find((s: any) => s.equipped_at)?.skin_id;

    const skins = DEFAULT_SKINS.filter(skin => ownedIds.has(skin.id));

    return { skins, equippedId };
  } catch (error) {
    console.error('Error fetching user skins:', error);
    return { skins: [] };
  }
};

// ============================================
// Purchase System
// ============================================

/**
 * Purchase a skin
 */
export const purchaseSkin = async (
  userId: string,
  skinId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_skins') || !isTableAvailable('player_profiles') || hasPendingTableCheck('user_skins') || hasPendingTableCheck('player_profiles')) {
    return { success: false, error: 'Database not available' };
  }

  const skin = getSkin(skinId);
  if (!skin) {
    return { success: false, error: 'Skin not found' };
  }

  // Check if skin requires achievement
  if (skin.requiresAchievement) {
    const { data: achievement } = await supabase
      .from('user_achievements')
      .select('completed')
      .eq('user_id', userId)
      .eq('achievement_id', skin.requiresAchievement)
      .maybeSingle();

    if (!achievement?.completed) {
      return { success: false, error: 'Complete the required achievement to unlock this skin' };
    }
  }

  // Check if limited time skin is still available
  if (skin.isLimitedTime && skin.availableUntil && Date.now() > skin.availableUntil) {
    return { success: false, error: 'This limited time skin is no longer available' };
  }

  try {
    // Check if already owned
    const { data: existing } = await supabase
      .from('user_skins')
      .select('id')
      .eq('user_id', userId)
      .eq('skin_id', skinId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'You already own this skin' };
    }

    // Check coins (if not achievement skin)
    if (skin.price > 0) {
      const { data: profile } = await supabase
        .from('player_profiles')
        .select('coins')
        .eq('id', userId)
        .single();

      if (!profile || profile.coins < skin.price) {
        return { success: false, error: 'Insufficient coins' };
      }

      // Deduct coins
      const { error: updateError } = await supabase
        .from('player_profiles')
        .update({ coins: profile.coins - skin.price })
        .eq('id', userId);

      if (updateError) {
        console.error('Error deducting coins:', updateError);
        return { success: false, error: 'Failed to process payment' };
      }
    }

    // Add skin to inventory
    const { error: insertError } = await supabase.from('user_skins').insert({
      user_id: userId,
      skin_id: skinId,
      purchased_at: new Date().toISOString(),
    });

    if (insertError) {
      // Rollback coins if skin insert failed
      if (skin.price > 0) {
        const { data: profile } = await supabase
          .from('player_profiles')
          .select('coins')
          .eq('id', userId)
          .single();
        if (profile) {
          await supabase
            .from('player_profiles')
            .update({ coins: profile.coins + skin.price })
            .eq('id', userId);
        }
      }
      console.error('Error adding skin:', insertError);
      return { success: false, error: 'Failed to add skin to inventory' };
    }

    // Track achievement
    await trackEvent(userId, { type: 'skin_purchased', skinId });

    return { success: true };
  } catch (error) {
    console.error('Error purchasing skin:', error);
    return { success: false, error: 'Failed to purchase skin' };
  }
};

/**
 * Purchase a bundle
 */
export const purchaseBundle = async (
  userId: string,
  bundleId: string
): Promise<{ success: boolean; error?: string; addedSkins?: string[] }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_skins') || !isTableAvailable('player_profiles') || hasPendingTableCheck('user_skins') || hasPendingTableCheck('player_profiles')) {
    return { success: false, error: 'Database not available' };
  }

  const bundle = getBundle(bundleId);
  if (!bundle) {
    return { success: false, error: 'Bundle not found' };
  }

  if (!bundle.isAvailable) {
    return { success: false, error: 'This bundle is no longer available' };
  }

  try {
    // Check which skins user already owns
    const { data: ownedSkins } = await supabase
      .from('user_skins')
      .select('skin_id')
      .eq('user_id', userId)
      .in('skin_id', bundle.skinIds);

    const ownedIds = new Set((ownedSkins || []).map((s: any) => s.skin_id));
    const newSkins = bundle.skinIds.filter(id => !ownedIds.has(id));

    if (newSkins.length === 0) {
      return { success: false, error: 'You already own all skins in this bundle' };
    }

    // Calculate adjusted price based on skins not owned
    const fullPrice = bundle.bundlePrice;
    const discount = (bundle.originalPrice - bundle.bundlePrice) / bundle.skinIds.length;
    const adjustedPrice = Math.floor(
      newSkins.reduce((sum, id) => {
        const skin = getSkin(id);
        return sum + (skin ? skin.price - discount : 0);
      }, 0)
    );
    const finalPrice = Math.max(adjustedPrice, Math.floor(fullPrice * (newSkins.length / bundle.skinIds.length)));

    // Check coins
    const { data: profile } = await supabase
      .from('player_profiles')
      .select('coins')
      .eq('id', userId)
      .single();

    if (!profile || profile.coins < finalPrice) {
      return { success: false, error: 'Insufficient coins' };
    }

    // Deduct coins
    const { error: updateError } = await supabase
      .from('player_profiles')
      .update({ coins: profile.coins - finalPrice })
      .eq('id', userId);

    if (updateError) {
      console.error('Error deducting coins:', updateError);
      return { success: false, error: 'Failed to process payment' };
    }

    // Add skins
    const skinInserts = newSkins.map(skinId => ({
      user_id: userId,
      skin_id: skinId,
      purchased_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from('user_skins').insert(skinInserts);

    if (insertError) {
      // Rollback coins
      await supabase
        .from('player_profiles')
        .update({ coins: profile.coins })
        .eq('id', userId);
      console.error('Error adding skins:', insertError);
      return { success: false, error: 'Failed to add skins to inventory' };
    }

    // Track achievements for each skin
    for (const skinId of newSkins) {
      await trackEvent(userId, { type: 'skin_purchased', skinId });
    }

    return { success: true, addedSkins: newSkins };
  } catch (error) {
    console.error('Error purchasing bundle:', error);
    return { success: false, error: 'Failed to purchase bundle' };
  }
};

// ============================================
// Skin Equipping
// ============================================

/**
 * Equip a skin
 */
export const equipSkin = async (
  userId: string,
  skinId: string
): Promise<{ success: boolean; error?: string; appearance?: Partial<{
  type: AnimalType;
  skin: string;
  shirt: string;
  pants: string;
  accessory: AccessoryType;
}> }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_skins') || hasPendingTableCheck('user_skins')) {
    return { success: false, error: 'Database not available' };
  }

  const skin = getSkin(skinId);
  if (!skin) {
    return { success: false, error: 'Skin not found' };
  }

  try {
    // Check ownership
    const { data: owned } = await supabase
      .from('user_skins')
      .select('id')
      .eq('user_id', userId)
      .eq('skin_id', skinId)
      .maybeSingle();

    if (!owned) {
      return { success: false, error: 'You do not own this skin' };
    }

    // Unequip all other skins
    await supabase
      .from('user_skins')
      .update({ equipped_at: null })
      .eq('user_id', userId);

    // Equip this skin
    const { error } = await supabase
      .from('user_skins')
      .update({ equipped_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('skin_id', skinId);

    if (error) {
      console.error('Error equipping skin:', error);
      return { success: false, error: 'Failed to equip skin' };
    }

    // Build appearance changes
    const appearance: Partial<{
      type: AnimalType;
      skin: string;
      shirt: string;
      pants: string;
      accessory: AccessoryType;
    }> = {};

    if (skin.characterType) appearance.type = skin.characterType;
    if (skin.skinColor) appearance.skin = skin.skinColor;
    if (skin.shirtColor) appearance.shirt = skin.shirtColor;
    if (skin.pantsColor) appearance.pants = skin.pantsColor;
    if (skin.accessory) appearance.accessory = skin.accessory;

    return { success: true, appearance };
  } catch (error) {
    console.error('Error equipping skin:', error);
    return { success: false, error: 'Failed to equip skin' };
  }
};

/**
 * Unequip current skin
 */
export const unequipSkin = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('user_skins') || hasPendingTableCheck('user_skins')) {
    return { success: false, error: 'Database not available' };
  }

  try {
    const { error } = await supabase
      .from('user_skins')
      .update({ equipped_at: null })
      .eq('user_id', userId);

    if (error) {
      console.error('Error unequipping skin:', error);
      return { success: false, error: 'Failed to unequip skin' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error unequipping skin:', error);
    return { success: false, error: 'Failed to unequip skin' };
  }
};

// ============================================
// Shop Display Helpers
// ============================================

/**
 * Get shop display data
 */
export const getShopDisplay = async (userId: string): Promise<{
  categories: {
    category: SkinCategory;
    skins: (Skin & { owned: boolean; canPurchase: boolean })[];
  }[];
  bundles: (ShopBundle & { ownedCount: number; canPurchase: boolean })[];
  userCoins: number;
}> => {
  const { inventory } = await getUserInventory(userId);
  const ownedSet = new Set(inventory?.ownedSkins || []);
  const userCoins = inventory?.coins || 0;

  // Check achievements for locked skins (only if table available)
  let completedAchievements = new Set<string>();
  if (isSupabaseConfigured() && isTableAvailable('user_achievements') && !hasPendingTableCheck('user_achievements')) {
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .eq('completed', true);

    if (error && isMissingTableError(error)) {
      markTableMissing('user_achievements');
    } else {
      completedAchievements = new Set((achievements || []).map((a: any) => a.achievement_id));
    }
  }

  const categories: SkinCategory[] = ['character', 'color', 'accessory', 'bundle'];
  const availableSkins = getAvailableSkins();

  const categorizedSkins = categories
    .filter(c => c !== 'bundle')
    .map(category => ({
      category,
      skins: availableSkins
        .filter(skin => skin.category === category)
        .map(skin => {
          const owned = ownedSet.has(skin.id);
          let canPurchase = !owned && userCoins >= skin.price;

          // Check achievement requirement
          if (skin.requiresAchievement && !completedAchievements.has(skin.requiresAchievement)) {
            canPurchase = false;
          }

          return { ...skin, owned, canPurchase };
        }),
    }));

  const bundles = getBundles().map(bundle => {
    const ownedCount = bundle.skinIds.filter(id => ownedSet.has(id)).length;
    const canPurchase = ownedCount < bundle.skinIds.length && userCoins >= bundle.bundlePrice;
    return { ...bundle, ownedCount, canPurchase };
  });

  return {
    categories: categorizedSkins,
    bundles,
    userCoins,
  };
};

/**
 * Check if user can unlock an achievement skin
 */
export const canUnlockAchievementSkin = async (
  userId: string,
  skinId: string
): Promise<boolean> => {
  const skin = getSkin(skinId);
  if (!skin?.requiresAchievement) return false;

  if (!isSupabaseConfigured() || !isTableAvailable('user_achievements') || hasPendingTableCheck('user_achievements')) {
    return false;
  }

  const { data, error } = await supabase
    .from('user_achievements')
    .select('completed')
    .eq('user_id', userId)
    .eq('achievement_id', skin.requiresAchievement)
    .maybeSingle();

  if (error && isMissingTableError(error)) {
    markTableMissing('user_achievements');
    return false;
  }

  return data?.completed || false;
};
