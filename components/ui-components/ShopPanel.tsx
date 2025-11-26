/**
 * Shop Panel Component
 * Skin catalog with purchase, preview, and equip functionality
 */

import React, { useState, memo, useCallback } from 'react';
import { useShop, type SkinWithStatus, type BundleWithStatus } from '../../hooks/useShop';
import type { SkinCategory, SkinRarity } from '../../types/game';
import { RARITY_COLORS, RARITY_PRICES } from '../../types/game';

interface ShopPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userCoins: number;
  onCoinsChanged?: (newCoins: number) => void;
  onSkinEquipped?: (appearance: {
    type?: string;
    skin?: string;
    shirt?: string;
    pants?: string;
    accessory?: string;
  }) => void;
}

type TabType = 'skins' | 'bundles' | 'inventory';
type FilterType = 'all' | SkinCategory;

// Category icons for display - extended to match UI filters
const CATEGORY_ICONS: Record<string, string> = {
  all: '🏪',
  character: '🐾',
  color: '🎨',
  accessory: '🎀',
  bundle: '📦',
};

const CATEGORY_NAMES: Record<string, string> = {
  all: 'All Items',
  character: 'Characters',
  color: 'Colors',
  accessory: 'Accessories',
  bundle: 'Bundles',
};

const RARITY_ORDER: SkinRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// Helper function to get skin icon based on category/type
const getSkinIcon = (skin: SkinWithStatus): string => {
  if (skin.icon) return skin.icon;
  if (skin.characterType) {
    const characterIcons: Record<string, string> = {
      bear: '🐻', cat: '🐱', rabbit: '🐰', fox: '🦊', dog: '🐕',
      panda: '🐼', koala: '🐨', lion: '🦁', pig: '🐷', chicken: '🐔',
      elephant: '🐘', sheep: '🐑', penguin: '🐧', duck: '🦆', zebra: '🦓',
      mouse: '🐭', cow: '🐄', frog: '🐸', monkey: '🐵', tiger: '🐯',
      raccoon: '🦝', deer: '🦌', hedgehog: '🦔', beaver: '🦫', platypus: '🦫',
    };
    return characterIcons[skin.characterType] || '🐾';
  }
  if (skin.accessory) {
    const accessoryIcons: Record<string, string> = {
      backpack: '🎒', glasses: '👓', hat: '🎩', mate: '🧉', phone: '📱', scarf: '🧣',
    };
    return accessoryIcons[skin.accessory] || '🎀';
  }
  if (skin.skinColor) return '🎨';
  return '✨';
};

const ShopPanel: React.FC<ShopPanelProps> = memo(({
  isOpen,
  onClose,
  userId,
  userCoins,
  onCoinsChanged,
  onSkinEquipped,
}) => {
  const shop = useShop(userId);
  const [activeTab, setActiveTab] = useState<TabType>('skins');
  const [categoryFilter, setCategoryFilter] = useState<FilterType>('all');
  const [selectedSkin, setSelectedSkin] = useState<SkinWithStatus | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const handlePurchase = useCallback(async (skin: SkinWithStatus) => {
    const success = await shop.purchase(skin.id);
    if (success) {
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 2000);
      if (onCoinsChanged) {
        onCoinsChanged(userCoins - (skin.price || 0));
      }
    }
    setShowPurchaseConfirm(false);
  }, [shop, userCoins, onCoinsChanged]);

  const handleBundlePurchase = useCallback(async (bundle: BundleWithStatus) => {
    const result = await shop.purchaseBundleById(bundle.id);
    if (result.success) {
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 2000);
      if (onCoinsChanged) {
        onCoinsChanged(userCoins - bundle.bundlePrice);
      }
    }
  }, [shop, userCoins, onCoinsChanged]);

  const handleEquip = useCallback(async (skinId: string) => {
    const result = await shop.equip(skinId);
    if (result.success && result.appearance && onSkinEquipped) {
      onSkinEquipped(result.appearance as any);
    }
  }, [shop, onSkinEquipped]);

  const handleUnequip = useCallback(async () => {
    await shop.unequip();
  }, [shop]);

  const handlePreview = useCallback((skin: SkinWithStatus | null) => {
    setSelectedSkin(skin);
    shop.setPreview(skin?.id || null);
  }, [shop]);

  // Get filtered skins
  const getFilteredSkins = useCallback((): SkinWithStatus[] => {
    if (categoryFilter === 'all') {
      const allSkins: SkinWithStatus[] = [];
      for (const cat of shop.categories) {
        allSkins.push(...cat.skins);
      }
      return allSkins.sort((a, b) => {
        const aIndex = RARITY_ORDER.indexOf(a.rarity);
        const bIndex = RARITY_ORDER.indexOf(b.rarity);
        return bIndex - aIndex;
      });
    }
    return shop.filterByCategory(categoryFilter);
  }, [shop, categoryFilter]);

  if (!isOpen) return null;

  const filteredSkins = getFilteredSkins();
  const ownedSkins = shop.filterOwned();

  return (
    <>
      {/* Purchase Success Animation */}
      {purchaseSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl text-xl font-bold animate-bounce shadow-lg">
            Purchase Successful! 🎉
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛍️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Shop</h2>
                <p className="text-white/80 text-sm flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    🪙 {userCoins.toLocaleString()}
                  </span>
                  <span className="text-white/60">•</span>
                  <span>{ownedSkins.length} items owned</span>
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

          {/* Tabs */}
          <div className="flex border-b">
            {(['skins', 'bundles', 'inventory'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab === 'skins' && '🎨 '}
                {tab === 'bundles' && '📦 '}
                {tab === 'inventory' && '🎒 '}
                {tab}
              </button>
            ))}
          </div>

          {/* Error Display */}
          {shop.error && (
            <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
              <span>{shop.error}</span>
              <button onClick={shop.clearError} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Skins Tab */}
            {activeTab === 'skins' && (
              <>
                {/* Category Filter */}
                <div className="w-40 border-r bg-gray-50 p-2 overflow-y-auto">
                  {(['all', 'character', 'color', 'accessory', 'bundle'] as FilterType[]).map(category => (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors flex items-center gap-2 ${
                        categoryFilter === category
                          ? 'bg-purple-500 text-white'
                          : 'hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>{CATEGORY_ICONS[category]}</span>
                      <span>{CATEGORY_NAMES[category]}</span>
                    </button>
                  ))}
                </div>

                {/* Skins Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {shop.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredSkins.map(skin => (
                        <SkinCard
                          key={skin.id}
                          skin={skin}
                          isSelected={selectedSkin?.id === skin.id}
                          isEquipped={shop.equippedSkinId === skin.id}
                          onSelect={() => handlePreview(skin)}
                          onPurchase={() => {
                            setSelectedSkin(skin);
                            setShowPurchaseConfirm(true);
                          }}
                          onEquip={() => handleEquip(skin.id)}
                          userCoins={userCoins}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Bundles Tab */}
            {activeTab === 'bundles' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-4">
                  {shop.bundles.map(bundle => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      onPurchase={() => handleBundlePurchase(bundle)}
                      userCoins={userCoins}
                    />
                  ))}
                  {shop.bundles.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No bundles available</p>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="flex-1 overflow-y-auto p-4">
                {ownedSkins.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">Your inventory is empty</p>
                    <p className="text-sm text-gray-400">Purchase items from the shop to see them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {ownedSkins.map(skin => (
                      <div
                        key={skin.id}
                        className={`bg-white rounded-xl border-2 p-3 transition-all cursor-pointer ${
                          shop.equippedSkinId === skin.id
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePreview(skin as SkinWithStatus)}
                      >
                        <div className="text-3xl text-center mb-2">{skin.icon}</div>
                        <p className="text-sm font-medium text-center truncate">{skin.name}</p>
                        <p
                          className="text-xs text-center capitalize"
                          style={{ color: RARITY_COLORS[skin.rarity] }}
                        >
                          {skin.rarity}
                        </p>
                        {shop.equippedSkinId === skin.id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnequip();
                            }}
                            className="w-full mt-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium"
                          >
                            Unequip
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(skin.id);
                            }}
                            className="w-full mt-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium"
                          >
                            Equip
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Panel - shows when skin selected */}
          {selectedSkin && activeTab === 'skins' && (
            <div className="border-t bg-gray-50 p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center text-4xl border-2"
                  style={{ borderColor: RARITY_COLORS[selectedSkin.rarity] }}
                >
                  {getSkinIcon(selectedSkin)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{selectedSkin.name}</h3>
                  <p className="text-sm text-gray-600">{selectedSkin.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                      style={{
                        backgroundColor: `${RARITY_COLORS[selectedSkin.rarity]}20`,
                        color: RARITY_COLORS[selectedSkin.rarity],
                      }}
                    >
                      {selectedSkin.rarity}
                    </span>
                    {selectedSkin.isLimitedTime && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                        ⏰ Limited Time
                      </span>
                    )}
                    {selectedSkin.requiresAchievement && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                        🏆 Achievement Exclusive
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {selectedSkin.owned ? (
                    shop.equippedSkinId === selectedSkin.id ? (
                      <button
                        onClick={() => handleUnequip()}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                      >
                        Unequip
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEquip(selectedSkin.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                      >
                        Equip
                      </button>
                    )
                  ) : (
                    <>
                      {selectedSkin.requiresAchievement ? (
                        <p className="text-sm text-purple-600">Complete achievement to unlock</p>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-amber-600 mb-1">
                            🪙 {selectedSkin.price?.toLocaleString()}
                          </p>
                          <button
                            onClick={() => setShowPurchaseConfirm(true)}
                            disabled={!selectedSkin.canPurchase || userCoins < (selectedSkin.price || 0)}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
                          >
                            {userCoins < (selectedSkin.price || 0) ? 'Not Enough Coins' : 'Purchase'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseConfirm && selectedSkin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Confirm Purchase</h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-4xl">{getSkinIcon(selectedSkin)}</div>
              <div>
                <p className="font-medium">{selectedSkin.name}</p>
                <p
                  className="text-sm capitalize"
                  style={{ color: RARITY_COLORS[selectedSkin.rarity] }}
                >
                  {selectedSkin.rarity}
                </p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-gray-600">Price</p>
              <p className="text-2xl font-bold text-amber-600">🪙 {selectedSkin.price?.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                Balance after: 🪙 {(userCoins - (selectedSkin.price || 0)).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseConfirm(false)}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedSkin)}
                disabled={shop.isLoading}
                className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
              >
                {shop.isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ShopPanel.displayName = 'ShopPanel';

// Skin Card Component
const SkinCard: React.FC<{
  skin: SkinWithStatus;
  isSelected: boolean;
  isEquipped: boolean;
  onSelect: () => void;
  onPurchase: () => void;
  onEquip: () => void;
  userCoins: number;
}> = memo(({ skin, isSelected, isEquipped, onSelect, onPurchase, onEquip, userCoins }) => {
  const canAfford = userCoins >= (skin.price || 0);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl border-2 p-3 transition-all cursor-pointer relative ${
        isSelected
          ? 'border-purple-400 shadow-lg scale-105'
          : isEquipped
          ? 'border-green-400'
          : skin.owned
          ? 'border-gray-300'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Badges */}
      <div className="absolute top-1 right-1 flex flex-col gap-1">
        {skin.isLimitedTime && (
          <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">⏰</span>
        )}
        {skin.requiresAchievement && (
          <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">🏆</span>
        )}
        {isEquipped && (
          <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">✓</span>
        )}
      </div>

      {/* Icon */}
      <div className={`text-3xl text-center mb-2 ${!skin.owned && !skin.canPurchase ? 'grayscale opacity-50' : ''}`}>
        {getSkinIcon(skin)}
      </div>

      {/* Name */}
      <p className="text-sm font-medium text-center truncate">{skin.name}</p>

      {/* Rarity */}
      <p
        className="text-xs text-center capitalize mb-2"
        style={{ color: RARITY_COLORS[skin.rarity] }}
      >
        {skin.rarity}
      </p>

      {/* Price/Status */}
      {skin.owned ? (
        <p className="text-center text-green-600 text-xs font-medium">Owned</p>
      ) : skin.requiresAchievement ? (
        <p className="text-center text-purple-600 text-xs">🔒 Locked</p>
      ) : (
        <p className={`text-center text-xs font-medium ${canAfford ? 'text-amber-600' : 'text-red-500'}`}>
          🪙 {skin.price?.toLocaleString()}
        </p>
      )}
    </div>
  );
});

SkinCard.displayName = 'SkinCard';

// Bundle Card Component
const BundleCard: React.FC<{
  bundle: BundleWithStatus;
  onPurchase: () => void;
  userCoins: number;
}> = memo(({ bundle, onPurchase, userCoins }) => {
  const canAfford = userCoins >= bundle.bundlePrice;
  const discount = Math.round((1 - bundle.bundlePrice / bundle.originalPrice) * 100);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center text-3xl text-white">
          📦
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{bundle.name}</h3>
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
          <div className="flex flex-wrap gap-1">
            {bundle.skinIds.map((skinId, i) => (
              <span key={i} className="bg-white px-2 py-0.5 rounded text-xs text-gray-600 border">
                {skinId}
              </span>
            ))}
          </div>
          {bundle.ownedCount > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              You already own {bundle.ownedCount} of {bundle.skinIds.length} items
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400 line-through">🪙 {bundle.originalPrice.toLocaleString()}</p>
          <p className="text-xl font-bold text-purple-600">🪙 {bundle.bundlePrice.toLocaleString()}</p>
          <button
            onClick={onPurchase}
            disabled={!bundle.canPurchase || !canAfford}
            className="mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
          >
            {!canAfford ? 'Not Enough' : bundle.ownedCount === bundle.skinIds.length ? 'Owned' : 'Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
});

BundleCard.displayName = 'BundleCard';

export default ShopPanel;
