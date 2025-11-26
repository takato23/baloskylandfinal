/**
 * Economy UI Components
 * Wallet display, Shop panel, Missions panel, Daily reward
 */

import React, { useState, useEffect } from 'react';
import { useEconomyStore, SHOP_ITEMS, MISSIONS, type ShopItem, type Mission } from '../../stores/economyStore';
import { useGameStore } from '../../store';
import { useFormattedPlayTime, useDailyReward } from '../../hooks/useEconomy';
import { playSound } from '../../utils/audio';

// ============================================
// Wallet Display (siempre visible)
// ============================================

export const WalletDisplay: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const coins = useEconomyStore((s) => s.coins);
  const [animating, setAnimating] = useState(false);
  const [prevCoins, setPrevCoins] = useState(coins);

  useEffect(() => {
    if (coins > prevCoins) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }
    setPrevCoins(coins);
  }, [coins, prevCoins]);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,180,0,0.3) 100%)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,215,0,0.5)',
        borderRadius: '20px',
        padding: '8px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        transform: animating ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <span style={{ fontSize: '20px' }}>🪙</span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#FFD700',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {coins.toLocaleString()}
      </span>
    </button>
  );
};

// ============================================
// Daily Reward Popup
// ============================================

export const DailyRewardPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { canClaim, reward, currentStreak, nextStreak, claim } = useDailyReward();
  const [claimed, setClaimed] = useState(false);
  const [earnedReward, setEarnedReward] = useState(0);

  const handleClaim = () => {
    if (canClaim) {
      const earned = claim();
      setEarnedReward(earned);
      setClaimed(true);
      playSound('coin');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #2a1f4e 0%, #1a1333 100%)',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '350px',
          textAlign: 'center',
          border: '3px solid #7c5cbf',
          boxShadow: '0 0 30px rgba(124, 92, 191, 0.5)',
        }}
      >
        <h2 style={{ color: '#FFD700', margin: '0 0 10px 0', fontSize: '24px' }}>
          🎁 Recompensa Diaria
        </h2>

        <div style={{ margin: '20px 0' }}>
          <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '5px' }}>
            Racha actual
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background:
                    day <= currentStreak
                      ? 'linear-gradient(135deg, #FFD700, #FF8C00)'
                      : day === nextStreak && canClaim
                      ? 'linear-gradient(135deg, #4CAF50, #45a049)'
                      : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: day <= currentStreak ? '#000' : '#666',
                  border: day === nextStreak && canClaim ? '2px solid #4CAF50' : 'none',
                }}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {claimed ? (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
            <div style={{ color: '#4CAF50', fontSize: '24px', fontWeight: 'bold' }}>
              +{earnedReward} monedas
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: '20px',
                padding: '12px 30px',
                background: '#7c5cbf',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Continuar
            </button>
          </div>
        ) : canClaim ? (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🪙</div>
            <div style={{ color: '#FFD700', fontSize: '20px', marginBottom: '5px' }}>
              Día {nextStreak}
            </div>
            <div style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}>
              {reward} monedas
            </div>
            <button
              onClick={handleClaim}
              style={{
                marginTop: '20px',
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
              }}
            >
              Reclamar
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
            <div style={{ color: '#aaa', fontSize: '16px' }}>
              Ya reclamaste la recompensa de hoy
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
              Vuelve mañana para mantener tu racha
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: '20px',
                padding: '12px 30px',
                background: '#444',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// Shop Panel
// ============================================

export const ShopPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { coins, unlockedItems, purchaseItem } = useEconomyStore();
  const setType = useGameStore((s) => s.setType);
  const setAccessory = useGameStore((s) => s.setAccessory);
  const setSkin = useGameStore((s) => s.setSkin);
  const setShirt = useGameStore((s) => s.setShirt);
  const setPants = useGameStore((s) => s.setPants);

  const categories = [
    { id: 'all', label: 'Todo', icon: '🏪' },
    { id: 'character', label: 'Personajes', icon: '🐾' },
    { id: 'accessory', label: 'Accesorios', icon: '🎒' },
    { id: 'color', label: 'Colores', icon: '🎨' },
  ];

  const filteredItems =
    selectedCategory === 'all'
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  const handlePurchase = (item: ShopItem) => {
    if (unlockedItems.includes(item.id)) {
      // Ya lo tiene, equiparlo
      if (item.unlocks?.characterType) {
        setType(item.unlocks.characterType as any);
        playSound('gem');
      }
      if (item.unlocks?.accessory) {
        setAccessory(item.unlocks.accessory as any);
        playSound('gem');
      }
      if (item.unlocks?.skinColor) {
        setSkin(item.unlocks.skinColor);
        playSound('gem');
      }
      if (item.unlocks?.shirtColor) {
        setShirt(item.unlocks.shirtColor);
        playSound('gem');
      }
      if (item.unlocks?.pantsColor) {
        setPants(item.unlocks.pantsColor);
        playSound('gem');
      }
      return;
    }

    if (coins < item.price) return;

    const success = purchaseItem(item);
    if (success) {
      playSound('coin');
      // Auto-equip after purchase
      if (item.unlocks?.characterType) {
        setType(item.unlocks.characterType as any);
      }
      if (item.unlocks?.accessory) {
        setAccessory(item.unlocks.accessory as any);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1e3a5f 0%, #0d1b2a 100%)',
          borderRadius: '20px',
          padding: '20px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '3px solid #3d5a80',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h2 style={{ color: '#fff', margin: 0, fontSize: '22px' }}>🏪 Tienda</h2>
          <WalletDisplay />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '15px',
                border: 'none',
                background:
                  selectedCategory === cat.id
                    ? 'linear-gradient(135deg, #4CAF50, #45a049)'
                    : 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
            overflow: 'auto',
            flex: 1,
            padding: '5px',
          }}
        >
          {filteredItems.map((item) => {
            const owned = unlockedItems.includes(item.id);
            const canAfford = coins >= item.price;

            return (
              <div
                key={item.id}
                onClick={() => handlePurchase(item)}
                style={{
                  background: owned
                    ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(69, 160, 73, 0.2))'
                    : 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: owned || canAfford ? 'pointer' : 'not-allowed',
                  border: owned
                    ? '2px solid #4CAF50'
                    : canAfford
                    ? '2px solid transparent'
                    : '2px solid rgba(255,0,0,0.3)',
                  opacity: !owned && !canAfford ? 0.5 : 1,
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (owned || canAfford) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '8px' }}>
                  {item.icon}
                </div>
                <div
                  style={{
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '4px',
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    color: '#aaa',
                    fontSize: '10px',
                    textAlign: 'center',
                    marginBottom: '8px',
                    height: '24px',
                    overflow: 'hidden',
                  }}
                >
                  {item.description}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {owned ? (
                    <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>
                      ✓ Equipar
                    </span>
                  ) : (
                    <>
                      <span style={{ fontSize: '14px' }}>🪙</span>
                      <span
                        style={{
                          color: canAfford ? '#FFD700' : '#ff6b6b',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}
                      >
                        {item.price}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            marginTop: '15px',
            padding: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

// ============================================
// Missions Panel
// ============================================

export const MissionsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'achievement'>('daily');
  const { missionProgress, claimMissionReward, stats, totalPlayTime } = useEconomyStore();

  const tabs = [
    { id: 'daily' as const, label: 'Diarias', icon: '📅' },
    { id: 'weekly' as const, label: 'Semanales', icon: '📆' },
    { id: 'achievement' as const, label: 'Logros', icon: '🏆' },
  ];

  const filteredMissions = MISSIONS.filter((m) => m.category === selectedTab);

  const getMissionCurrentValue = (mission: Mission): number => {
    switch (mission.type) {
      case 'collect':
        return stats.coinsCollected;
      case 'time':
        return totalPlayTime;
      case 'trick':
        return stats.tricksPerformed;
      case 'explore':
        return stats.distanceWalked;
      case 'social':
        return stats.npcsInteracted;
      default:
        return 0;
    }
  };

  const handleClaim = (missionId: string) => {
    const result = claimMissionReward(missionId);
    if (result) {
      playSound('coin');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #2d1f4e 0%, #1a1333 100%)',
          borderRadius: '20px',
          padding: '20px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '3px solid #7c5cbf',
        }}
      >
        {/* Header */}
        <h2 style={{ color: '#fff', margin: '0 0 15px 0', fontSize: '22px' }}>📋 Misiones</h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background:
                  selectedTab === tab.id
                    ? 'linear-gradient(135deg, #7c5cbf, #5c3d9f)'
                    : 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Mission List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredMissions.map((mission) => {
            const progress = missionProgress.find((p) => p.missionId === mission.id);
            const currentValue = progress?.current ?? getMissionCurrentValue(mission);
            const percentage = Math.min((currentValue / mission.target) * 100, 100);
            const isCompleted = progress?.status === 'completed';
            const isClaimed = progress?.status === 'claimed';

            return (
              <div
                key={mission.id}
                style={{
                  background: isClaimed
                    ? 'rgba(255,255,255,0.05)'
                    : isCompleted
                    ? 'rgba(76, 175, 80, 0.2)'
                    : 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '10px',
                  opacity: isClaimed ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>{mission.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                      {mission.name}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '12px' }}>{mission.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '14px' }}>
                      🪙 {mission.reward}
                    </div>
                    {mission.rewardItem && (
                      <div style={{ color: '#9c27b0', fontSize: '11px' }}>+ Item</div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#aaa',
                      marginBottom: '4px',
                    }}
                  >
                    <span>
                      {Math.min(currentValue, mission.target)} / {mission.target}
                    </span>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: isCompleted
                          ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
                          : 'linear-gradient(90deg, #7c5cbf, #9c27b0)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Claim button */}
                {isCompleted && !isClaimed && (
                  <button
                    onClick={() => handleClaim(mission.id)}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '8px',
                      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Reclamar Recompensa
                  </button>
                )}
                {isClaimed && (
                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: '10px',
                      color: '#666',
                      fontSize: '12px',
                    }}
                  >
                    ✓ Completado
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            marginTop: '15px',
            padding: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

// ============================================
// Stats Panel
// ============================================

export const StatsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { stats, totalCoinsEarned, totalPlayTime, consecutiveDays, unlockedItems } =
    useEconomyStore();
  const playTimeFormatted = useFormattedPlayTime();

  const statItems = [
    { label: 'Monedas Totales', value: totalCoinsEarned, icon: '🪙' },
    { label: 'Tiempo Jugado', value: playTimeFormatted, icon: '⏱️' },
    { label: 'Racha de Días', value: `${consecutiveDays} días`, icon: '🔥' },
    { label: 'Items Desbloqueados', value: unlockedItems.length, icon: '🎁' },
    { label: 'Monedas Recolectadas', value: stats.coinsCollected, icon: '💰' },
    { label: 'Trucos Realizados', value: stats.tricksPerformed, icon: '🛹' },
    { label: 'NPCs Interactuados', value: stats.npcsInteracted, icon: '💬' },
    { label: 'Items Comprados', value: stats.itemsPurchased, icon: '🛒' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1a3a2a 0%, #0d1f15 100%)',
          borderRadius: '20px',
          padding: '20px',
          width: '90%',
          maxWidth: '400px',
          border: '3px solid #2e7d32',
        }}
      >
        <h2 style={{ color: '#fff', margin: '0 0 20px 0', fontSize: '22px' }}>📊 Estadísticas</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {statItems.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>{item.icon}</div>
              <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '18px' }}>
                {item.value}
              </div>
              <div style={{ color: '#aaa', fontSize: '11px' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

// ============================================
// Economy Menu Button (para abrir paneles)
// ============================================

export const EconomyMenuButton: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '10px 15px',
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      cursor: 'pointer',
      position: 'relative',
    }}
  >
    <span style={{ fontSize: '20px' }}>{icon}</span>
    <span style={{ color: '#fff', fontSize: '10px' }}>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span
        style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          background: '#ff4444',
          color: 'white',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
        }}
      >
        {badge}
      </span>
    )}
  </button>
);
