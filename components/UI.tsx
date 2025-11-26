/**
 * Main UI Layer
 * Orchestrates all UI components for the game
 */

import React, { useState, memo, useCallback, useEffect, lazy, Suspense, useRef } from 'react';
import { useGameStore } from '../store';
import { useIsMobile, useOrientation } from '../hooks';
import { playSound } from '../utils/audio';

// Direct imports for always-needed components
import { ChatWindow, MobileControls, Minimap, GameChat, DebugPanel, EventBanner } from './ui-components';
import { QuickShareButton } from './ui-components/QuickShareButton';
import { PerformanceOverlay } from './PerformanceLogger';
import { Inventory } from './ui/Inventory';
import { MultiplayerChat, OnlineIndicator } from './multiplayer';

// Economy System
import { useEconomy, useDailyReward, useTrickTracker } from '../hooks/useEconomy';
import { useEconomyStore } from '../stores/economyStore';
import {
  WalletDisplay,
  DailyRewardPopup,
  ShopPanel as EconomyShopPanel,
  MissionsPanel,
  StatsPanel,
} from './ui-components/EconomyUI';

// Lazy load heavy components
const Customization = lazy(() => import('./ui-components/Customization').then(m => ({ default: m.Customization })));
const GeminiLiveManager = lazy(() => import('./ui-components/GeminiLiveManager').then(m => ({ default: m.GeminiLiveManager })));
const ShareModal = lazy(() => import('./ui-components/ShareModal').then(m => ({ default: m.ShareModal })));

// Lazy load new feature panels
const TradingPanel = lazy(() => import('./ui-components/TradingPanel'));
const GuildPanel = lazy(() => import('./ui-components/GuildPanel'));
const AchievementsPanel = lazy(() => import('./ui-components/AchievementsPanel'));
const ShopPanel = lazy(() => import('./ui-components/ShopPanel'));

// Lazy load Animal Crossing-style panels
const PhotoModeUI = lazy(() => import('./ui-components/PhotoModeUI').then(m => ({ default: m.PhotoModeUI })));
const DailyRewardsPanel = lazy(() => import('./ui-components/DailyRewardsPanel').then(m => ({ default: m.DailyRewardsPanel })));
const CritterpediaPanel = lazy(() => import('./ui-components/CritterpediaPanel').then(m => ({ default: m.CritterpediaPanel })));
const ActivityHUD = lazy(() => import('./ui-components/ActivityHUD').then(m => ({ default: m.ActivityHUD })));
const SharePanel = lazy(() => import('./ui-components/SharePanel').then(m => ({ default: m.SharePanel })));
const SeasonalEventManager = lazy(() => import('./ui-components/SeasonalEventManager').then(m => ({ default: m.SeasonalEventManager })));

// PWA Install Prompt
import { PWAInstallPrompt } from './ui-components/PWAInstallPrompt';

// ============================================
// Haptic Feedback Helper
// ============================================

const vibrate = (pattern: number = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// ============================================
// Mobile Menu Item Component (Estilo Animal Crossing)
// ============================================

interface MobileMenuItemProps {
  onClick: () => void;
  icon: string;
  label: string;
  bgColor: string;
  delay?: number;
  isVisible: boolean;
}

const MobileMenuItem: React.FC<MobileMenuItemProps> = memo(
  ({ onClick, icon, label, bgColor, delay = 0, isVisible }) => {
    const handleClick = useCallback(() => {
      vibrate(15);
      playSound('coin');
      onClick();
    }, [onClick]);

    return (
      <button
        onClick={handleClick}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl touch-manipulation transition-all pointer-events-auto ${bgColor} border-2 border-white/30 shadow-lg backdrop-blur-sm min-w-[72px] min-h-[72px] ${isVisible
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
          }`}
        aria-label={label}
        style={{
          WebkitTapHighlightColor: 'transparent',
          transitionDelay: isVisible ? `${delay}ms` : '0ms',
          transitionDuration: '200ms',
        }}
      >
        <span className="text-2xl drop-shadow-md">{icon}</span>
        <span className="text-[10px] font-bold text-white drop-shadow-sm leading-tight text-center">{label}</span>
      </button>
    );
  }
);

MobileMenuItem.displayName = 'MobileMenuItem';

// ============================================
// Mobile Quick Action Pill
// ============================================

interface QuickActionPillProps {
  onClick: () => void;
  icon: string;
  label: string;
  bgColor: string;
  pulse?: boolean;
}

const QuickActionPill: React.FC<QuickActionPillProps> = memo(
  ({ onClick, icon, label, bgColor, pulse = false }) => {
    const handleClick = useCallback(() => {
      vibrate(20);
      playSound('jump');
      onClick();
    }, [onClick]);

    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full touch-manipulation transition-all pointer-events-auto ${bgColor} border-2 border-black shadow-lg active:scale-95 ${pulse ? 'animate-pulse' : ''
          }`}
        aria-label={label}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-bold">{label}</span>
      </button>
    );
  }
);

QuickActionPill.displayName = 'QuickActionPill';

// ============================================
// HUD Component
// ============================================

interface HUDProps {
  coins: number;
  isDriving: boolean;
  isHidden: boolean;
  isMobile: boolean;
  isLandscape: boolean;
  onEditCharacter: () => void;
  onStartDriving: () => void;
  onShare: () => void;
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onOpenGuild: () => void;
  onOpenTrading: () => void;
  onOpenCritterpedia: () => void;
  onOpenDailyRewards: () => void;
  onOpenPhotoMode: () => void;
  // Economy
  onOpenEconomyShop: () => void;
  onOpenMissions: () => void;
  onOpenStats: () => void;
  missionBadge?: number;
}

// Menu items configuration - Animal Crossing NookPhone style
const MENU_ITEMS = [
  { id: 'inventory', icon: '🎒', label: 'Mochila', color: 'bg-gradient-to-br from-red-400 to-red-600' },
  { id: 'critterpedia', icon: '🦋', label: 'Bichopeya', color: 'bg-gradient-to-br from-lime-400 to-green-600' },
  { id: 'missions', icon: '📋', label: 'Misiones', color: 'bg-gradient-to-br from-indigo-400 to-indigo-600' },
  { id: 'economyshop', icon: '🏪', label: 'Tienda', color: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
  { id: 'stats', icon: '📊', label: 'Stats', color: 'bg-gradient-to-br from-teal-400 to-teal-600' },
  { id: 'daily', icon: '🎁', label: 'Diario', color: 'bg-gradient-to-br from-pink-400 to-rose-500' },
  { id: 'photo', icon: '📷', label: 'Foto', color: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
  { id: 'achievements', icon: '🏆', label: 'Logros', color: 'bg-gradient-to-br from-amber-400 to-yellow-500' },
  { id: 'skate', icon: '🛹', label: 'Patinar', color: 'bg-gradient-to-br from-orange-400 to-orange-600' },
  { id: 'character', icon: '👕', label: 'Personaje', color: 'bg-gradient-to-br from-amber-400 to-orange-500' },
  { id: 'share', icon: '📤', label: 'Compartir', color: 'bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400' },
] as const;

const HUD: React.FC<HUDProps> = memo(
  ({ coins, isDriving, isHidden, isMobile, isLandscape, onEditCharacter, onStartDriving, onShare, onOpenShop, onOpenAchievements, onOpenGuild, onOpenTrading, onOpenCritterpedia, onOpenDailyRewards, onOpenPhotoMode, onOpenEconomyShop, onOpenMissions, onOpenStats, missionBadge }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const quickMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
      if (!isExpanded && !isQuickMenuOpen) return;

      const handleClickOutside = (e: TouchEvent | MouseEvent) => {
        if (isExpanded && menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsExpanded(false);
        }
        if (isQuickMenuOpen && quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
          setIsQuickMenuOpen(false);
        }
      };

      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isExpanded, isQuickMenuOpen]);

    const toggleExpand = useCallback(() => {
      vibrate(15);
      playSound('coin');
      setIsExpanded(!isExpanded);
      setIsQuickMenuOpen(false);
    }, [isExpanded]);

    const toggleQuickMenu = useCallback(() => {
      vibrate(15);
      playSound('coin');
      setIsQuickMenuOpen(!isQuickMenuOpen);
      setIsExpanded(false);
    }, [isQuickMenuOpen]);

    const handleMenuAction = useCallback((action: string) => {
      setIsExpanded(false);
      switch (action) {
        case 'inventory':
          // Trigger 'I' key press to open inventory
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
          break;
        case 'skate': onStartDriving(); break;
        case 'character': onEditCharacter(); break;
        case 'shop': onOpenShop(); break;
        case 'achievements': onOpenAchievements(); break;
        case 'guild': onOpenGuild(); break;
        case 'trading': onOpenTrading(); break;
        case 'share': onShare(); break;
        case 'critterpedia': onOpenCritterpedia(); break;
        case 'daily': onOpenDailyRewards(); break;
        case 'photo': onOpenPhotoMode(); break;
        // Economy actions
        case 'economyshop': onOpenEconomyShop(); break;
        case 'missions': onOpenMissions(); break;
        case 'stats': onOpenStats(); break;
      }
    }, [onEditCharacter, onOpenShop, onOpenAchievements, onOpenGuild, onOpenTrading, onShare, onOpenCritterpedia, onOpenDailyRewards, onOpenPhotoMode, onOpenEconomyShop, onOpenMissions, onOpenStats]);

    const handleStartSkate = useCallback(() => {
      setIsExpanded(false);
      onStartDriving();
    }, [onStartDriving]);

    // Unified HUD - NookPhone Style for both Mobile and Desktop
    return (
      <div
        ref={menuRef}
        className={`absolute z-40 transition-all duration-300 ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
          } ${isLandscape ? 'top-2 left-2' : 'top-3 left-3'}`}
      >
        {/* Top Bar: Coins + Menu Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coins Display - Estilo AC */}
          <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 border-2 border-yellow-600 px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 font-bold text-lg">
            <span className="text-xl animate-bounce">🪙</span>
            <span className="text-yellow-900">{coins}</span>
          </div>

          {/* Menu Toggle - Estilo AC (hoja) */}
          <button
            onClick={toggleExpand}
            className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center touch-manipulation transition-all active:scale-90 border-2 ${isExpanded
              ? 'bg-gradient-to-br from-red-400 to-red-500 border-red-600 rotate-45'
              : 'bg-gradient-to-br from-green-400 to-green-500 border-green-600'
              }`}
            aria-label={isExpanded ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isExpanded}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span className={`text-2xl transition-transform duration-300 ${isExpanded ? '-rotate-45' : ''}`}>
              {isExpanded ? '✕' : '🍃'}
            </span>
          </button>
        </div>

        {/* Expanded Menu - NookPhone Style */}
        <div
          className={`absolute top-full left-0 mt-3 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${isExpanded
            ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
            : 'opacity-0 -translate-y-10 pointer-events-none scale-90'
            }`}
        >
          {/* Phone Frame */}
          <div className={`bg-[#fbfbfb] rounded-[2.5rem] p-3 shadow-2xl border-8 border-[#e0e0e0] relative overflow-hidden ${isLandscape ? 'w-[400px]' : 'w-[280px]'
            }`}>
            {/* Screen Content */}
            <div className="bg-gradient-to-b from-[#8fd3f4] to-[#84fab0] rounded-[2rem] p-4 min-h-[320px] relative overflow-hidden">

              {/* Status Bar */}
              <div className="flex justify-between items-center mb-4 px-2 text-white/90 text-xs font-bold">
                <span>12:00 PM</span>
                <div className="flex gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* App Grid */}
              <div className={`grid ${isLandscape ? 'grid-cols-4' : 'grid-cols-3'} gap-4 place-items-center`}>
                {MENU_ITEMS.map((item, index) => (
                  <div key={item.id} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleMenuAction(item.id)}
                      className={`w-14 h-14 rounded-2xl ${item.color} shadow-lg flex items-center justify-center text-2xl border-2 border-white/40 active:scale-90 transition-transform`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {item.icon}
                    </button>
                    <span className="text-[10px] font-bold text-white drop-shadow-md bg-black/20 px-1.5 rounded-full">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/20 backdrop-blur-md flex items-center justify-center">
                <div className="w-1/3 h-1 bg-white/50 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Menu - Expandable button with Photo, Character, and Main Menu */}
        {!isDriving && (
          <div
            ref={quickMenuRef}
            className="absolute top-0 right-[-60px] flex flex-col items-center gap-2 pointer-events-auto"
          >
            {/* Main toggle button - Plus/Cross icon */}
            <button
              onClick={toggleQuickMenu}
              className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center touch-manipulation transition-all active:scale-90 border-2 ${
                isQuickMenuOpen
                  ? 'bg-gradient-to-br from-red-400 to-red-500 border-red-600 rotate-45'
                  : 'bg-gradient-to-br from-violet-400 to-violet-500 border-violet-600'
              }`}
              aria-label={isQuickMenuOpen ? 'Cerrar menú rápido' : 'Abrir menú rápido'}
              aria-expanded={isQuickMenuOpen}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className={`text-xl transition-transform duration-300 ${isQuickMenuOpen ? '-rotate-45' : ''}`}>
                {isQuickMenuOpen ? '✕' : '✦'}
              </span>
            </button>

            {/* Expanded quick actions */}
            <div className={`flex flex-col gap-2 transition-all duration-300 ${
              isQuickMenuOpen
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}>
              {/* Photo Mode */}
              <button
                onClick={() => { setIsQuickMenuOpen(false); onOpenPhotoMode(); }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-cyan-600 shadow-lg flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                aria-label="Modo foto"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="text-xl">📷</span>
              </button>

              {/* Character Customization */}
              <button
                onClick={() => { setIsQuickMenuOpen(false); onEditCharacter(); }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-600 shadow-lg flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                aria-label="Editar personaje"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="text-xl">👕</span>
              </button>

              {/* Main Menu (Leaves) */}
              <button
                onClick={() => { setIsQuickMenuOpen(false); toggleExpand(); }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-green-500 border-2 border-green-600 shadow-lg flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                aria-label="Menú principal"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="text-xl">🍃</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

HUD.displayName = 'HUD';

// ============================================
// Interaction Prompt
// ============================================

interface InteractionPromptProps {
  label: string;
  isMobile: boolean;
  reduceMotion: boolean;
}

const InteractionPrompt: React.FC<InteractionPromptProps> = memo(
  ({ label, isMobile, reduceMotion }) => {
    return (
      <div className={`absolute bottom-32 md:bottom-24 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-full font-bold backdrop-blur-md ${reduceMotion ? '' : 'animate-pulse'} z-20 whitespace-nowrap`}>
        {isMobile ? '👋' : '[E]'} {label}
      </div>
    );
  }
);

InteractionPrompt.displayName = 'InteractionPrompt';

// ============================================
// Dialogue Box
// ============================================

interface DialogueBoxProps {
  title: string;
  text: string;
  onClose: () => void;
}

const DialogueBox: React.FC<DialogueBoxProps> = memo(
  ({ title, text, onClose }) => {
    return (
      <div className="absolute inset-x-0 bottom-0 p-6 flex justify-center z-50 pointer-events-auto">
        <div className="bg-white border-4 border-black rounded-xl p-6 max-w-2xl w-full shadow-2xl relative animate-in slide-in-from-bottom-10">
          <h3 className="text-xl font-bold mb-2 text-purple-600">{title}</h3>
          <p className="text-lg text-gray-800 leading-relaxed">{text}</p>
          <button
            onClick={onClose}
            className="absolute bottom-4 right-4 bg-gray-200 px-3 py-1 rounded text-sm text-gray-700 hover:bg-gray-300 font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }
);

DialogueBox.displayName = 'DialogueBox';

// ============================================
// Controls Hint (Desktop)
// ============================================

interface ControlsHintProps {
  isDriving: boolean;
}

const ControlsHint: React.FC<ControlsHintProps> = memo(({ isDriving }) => {
  if (isDriving) {
    return (
      <div className="absolute bottom-4 right-4 text-white text-xs text-right opacity-50 pointer-events-none drop-shadow-md select-none">
        W - Empujar (acelerar)
        <br />
        S - Frenar
        <br />
        A/D - Girar
        <br />
        SPACE - Ollie (salto)
        <br />
        SHIFT + SPACE - Kickflip
        <br />
        E - Bajar del skate
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 text-white text-xs text-right opacity-50 pointer-events-none drop-shadow-md select-none">
      WASD - Moverse
      <br />
      SHIFT - Correr
      <br />
      SPACE - Saltar
      <br />
      E - Interactuar / Skate
      <br />
      H - Bocina
    </div>
  );
});

ControlsHint.displayName = 'ControlsHint';

// ============================================
// Main UI Component
// ============================================

export const UI: React.FC = () => {
  // Store selectors
  const coins = useGameStore((s) => s.coins);
  const interactionLabel = useGameStore((s) => s.interactionLabel);
  const dialogue = useGameStore((s) => s.dialogue);
  const closeDialogue = useGameStore((s) => s.closeDialogue);
  const liveSession = useGameStore((s) => s.liveSession);
  const isDriving = useGameStore((s) => s.isDriving);
  const setDriving = useGameStore((s) => s.setDriving);
  const highContrast = useGameStore((s) => s.highContrast);
  const setHighContrast = useGameStore((s) => s.setHighContrast);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const setReduceMotion = useGameStore((s) => s.setReduceMotion);

  // Local state
  const [showCustomization, setShowCustomization] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMultiplayerChat, setShowMultiplayerChat] = useState(true); // Start open for community

  // New feature panel states
  const [showShop, setShowShop] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showTrading, setShowTrading] = useState(false);

  // Animal Crossing-style panel states
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showCritterpedia, setShowCritterpedia] = useState(false);
  const [showActivityHUD, setShowActivityHUD] = useState(true); // Always visible when playing

  // Economy panel states
  const [showEconomyShop, setShowEconomyShop] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDailyRewardPopup, setShowDailyRewardPopup] = useState(false);

  // Hooks
  const isMobile = useIsMobile();
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // Economy hooks - initialize economy tracking
  const economy = useEconomy();
  const dailyReward = useDailyReward();
  useTrickTracker(); // Auto-track skateboard tricks

  // Economy store for direct access
  const economyCoins = useEconomyStore((s) => s.coins);
  const unclaimedMissions = economy.getUnclaimedMissions();

  // Show daily reward popup on first visit of the day
  useEffect(() => {
    if (dailyReward.canClaim) {
      // Small delay to let game load first
      const timer = setTimeout(() => {
        setShowDailyRewardPopup(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [dailyReward.canClaim]);

  // Mock user data - in production, this would come from auth/store
  const userId = useGameStore((s) => s.multiplayerId) || 'guest-user';
  const username = useGameStore((s) => s.multiplayerName) || 'Player';
  const setCoins = useGameStore((s) => s.setCoins);
  const character = useGameStore((s) => s.character);
  const setCharacter = useGameStore((s) => s.setCharacter);

  // Get user's owned skins for trading (mock data - would come from shop hook)
  const userSkins = [
    { id: 'default', name: 'Default', rarity: 'common' },
  ];

  // Respect prefers-reduced-motion
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(media.matches);
    const handler = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [setReduceMotion]);

  // Callbacks
  const handleEditCharacter = useCallback(() => {
    setShowCustomization(true);
  }, []);

  const handleCloseCustomization = useCallback(() => {
    setShowCustomization(false);
  }, []);

  const handleOpenShare = useCallback(() => {
    setShowShareModal(true);
    playSound('coin'); // Satisfying click sound
  }, []);

  const handleCloseShare = useCallback(() => {
    setShowShareModal(false);
  }, []);

  const handleToggleMultiplayerChat = useCallback(() => {
    setShowMultiplayerChat((prev) => !prev);
  }, []);

  const handleCloseMultiplayerChat = useCallback(() => {
    setShowMultiplayerChat(false);
  }, []);

  const handleStartDriving = useCallback(() => {
    setDriving(true, 'skateboard');
    playSound('jump');
  }, [setDriving]);

  // New panel callbacks
  const handleOpenShop = useCallback(() => {
    setShowShop(true);
    playSound('coin');
  }, []);

  const handleCloseShop = useCallback(() => {
    setShowShop(false);
  }, []);

  const handleOpenAchievements = useCallback(() => {
    setShowAchievements(true);
    playSound('coin');
  }, []);

  const handleCloseAchievements = useCallback(() => {
    setShowAchievements(false);
  }, []);

  const handleOpenGuild = useCallback(() => {
    setShowGuild(true);
    playSound('coin');
  }, []);

  const handleCloseGuild = useCallback(() => {
    setShowGuild(false);
  }, []);

  const handleOpenTrading = useCallback(() => {
    setShowTrading(true);
    playSound('coin');
  }, []);

  const handleCloseTrading = useCallback(() => {
    setShowTrading(false);
  }, []);

  const handleCoinsChanged = useCallback((newCoins: number) => {
    setCoins(newCoins);
  }, [setCoins]);

  const handleSkinEquipped = useCallback((appearance: {
    type?: string;
    skin?: string;
    shirt?: string;
    pants?: string;
    accessory?: string;
  }) => {
    // Update character appearance with equipped skin
    setCharacter({
      ...character,
      ...(appearance.type && { type: appearance.type as any }),
      ...(appearance.skin && { skin: appearance.skin }),
      ...(appearance.shirt && { shirt: appearance.shirt }),
      ...(appearance.pants && { pants: appearance.pants }),
      ...(appearance.accessory && { accessory: appearance.accessory as any }),
    });
  }, [character, setCharacter]);

  const handleRewardClaimed = useCallback((reward: { type: string; amount?: number }) => {
    if (reward.type === 'coins' && reward.amount) {
      setCoins(coins + reward.amount);
      playSound('coin');
    }
  }, [coins, setCoins]);

  // Animal Crossing panel callbacks
  const handleOpenPhotoMode = useCallback(() => {
    setShowPhotoMode(true);
    playSound('camera_shutter');
  }, []);

  const handleClosePhotoMode = useCallback(() => {
    setShowPhotoMode(false);
  }, []);

  const handleOpenDailyRewards = useCallback(() => {
    setShowDailyRewards(true);
    playSound('daily_reward');
  }, []);

  const handleCloseDailyRewards = useCallback(() => {
    setShowDailyRewards(false);
  }, []);

  const handleOpenCritterpedia = useCallback(() => {
    setShowCritterpedia(true);
    playSound('coin');
  }, []);

  const handleCloseCritterpedia = useCallback(() => {
    setShowCritterpedia(false);
  }, []);

  // Derived state
  const isLiveSessionOpen = liveSession.isOpen;
  const hideHUD = isLiveSessionOpen && isMobile;
  const dimOverlays = isLiveSessionOpen && !isMobile;
  const showInteractionPrompt =
    interactionLabel && !dialogue.isOpen && !isLiveSessionOpen;
  const showMobileControls =
    isMobile && !showCustomization && !isLiveSessionOpen && !showShareModal;
  const showControlsHint = !isMobile && !isLiveSessionOpen && !showShareModal;

  return (
    <div className={`${highContrast ? 'filter contrast-[1.15] saturate-110' : ''} ${reduceMotion ? 'motion-reduce' : ''}`}>
      {/* Gemini Live Session Manager (headless) */}
      <Suspense fallback={null}>
        <GeminiLiveManager />
      </Suspense>

      {/* HUD */}
      <HUD
        coins={economyCoins}
        isDriving={isDriving}
        isHidden={hideHUD || dimOverlays || showShareModal || showPhotoMode}
        isMobile={isMobile}
        isLandscape={isLandscape}
        onEditCharacter={handleEditCharacter}
        onStartDriving={handleStartDriving}
        onShare={handleOpenShare}
        onOpenShop={handleOpenShop}
        onOpenAchievements={handleOpenAchievements}
        onOpenGuild={handleOpenGuild}
        onOpenTrading={handleOpenTrading}
        onOpenCritterpedia={handleOpenCritterpedia}
        onOpenDailyRewards={handleOpenDailyRewards}
        onOpenPhotoMode={handleOpenPhotoMode}
        onOpenEconomyShop={() => setShowEconomyShop(true)}
        onOpenMissions={() => setShowMissions(true)}
        onOpenStats={() => setShowStats(true)}
        missionBadge={unclaimedMissions.length}
      />

      {/* Minimap */}
      <Minimap dimmed={dimOverlays} highContrast={highContrast} />

      {/* Chat Window (Gemini Live) */}
      <ChatWindow />

      {/* Event Banner */}
      <EventBanner />

      {/* Interaction Prompt */}
      {showInteractionPrompt && (
        <InteractionPrompt label={interactionLabel} isMobile={isMobile} reduceMotion={reduceMotion} />
      )}

      {/* Static Dialogue Box */}
      {dialogue.isOpen && (
        <DialogueBox
          title={dialogue.title}
          text={dialogue.text}
          onClose={closeDialogue}
        />
      )}

      {/* Character Customization Modal */}
      {showCustomization && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Cargando...</div></div>}>
          <Customization onClose={handleCloseCustomization} />
        </Suspense>
      )}

      {/* Share Modal - Instagram optimized */}
      {showShareModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Preparando...</div></div>}>
          <ShareModal onClose={handleCloseShare} />
        </Suspense>
      )}

      {/* Shop Panel */}
      {showShop && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Cargando tienda...</div></div>}>
          <ShopPanel
            isOpen={showShop}
            onClose={handleCloseShop}
            userId={userId}
            userCoins={coins}
            onCoinsChanged={handleCoinsChanged}
            onSkinEquipped={handleSkinEquipped}
          />
        </Suspense>
      )}

      {/* Achievements Panel */}
      {showAchievements && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Cargando logros...</div></div>}>
          <AchievementsPanel
            isOpen={showAchievements}
            onClose={handleCloseAchievements}
            userId={userId}
            onRewardClaimed={handleRewardClaimed}
          />
        </Suspense>
      )}

      {/* Guild Panel */}
      {showGuild && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Cargando guild...</div></div>}>
          <GuildPanel
            isOpen={showGuild}
            onClose={handleCloseGuild}
            userId={userId}
            username={username}
            userCoins={coins}
          />
        </Suspense>
      )}

      {/* Trading Panel */}
      {showTrading && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Cargando intercambio...</div></div>}>
          <TradingPanel
            isOpen={showTrading}
            onClose={handleCloseTrading}
            userId={userId}
            username={username}
            userCoins={coins}
            userSkins={userSkins}
          />
        </Suspense>
      )}

      {/* ============================================ */}
      {/* Animal Crossing-style Panels                */}
      {/* ============================================ */}

      {/* Critterpedia - Collection Log (Fish, Bugs, Fossils) */}
      {showCritterpedia && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Cargando Bichopeya...</div></div>}>
          <CritterpediaPanel onClose={handleCloseCritterpedia} />
        </Suspense>
      )}

      {/* Daily Rewards Panel */}
      {showDailyRewards && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Cargando recompensas...</div></div>}>
          <DailyRewardsPanel onClose={handleCloseDailyRewards} />
        </Suspense>
      )}

      {/* ============================================ */}
      {/* Economy System Panels                       */}
      {/* ============================================ */}

      {/* Daily Reward Popup (auto-shows on first visit) */}
      {showDailyRewardPopup && (
        <DailyRewardPopup onClose={() => setShowDailyRewardPopup(false)} />
      )}

      {/* Economy Shop Panel */}
      {showEconomyShop && (
        <EconomyShopPanel onClose={() => setShowEconomyShop(false)} />
      )}

      {/* Missions Panel */}
      {showMissions && (
        <MissionsPanel onClose={() => setShowMissions(false)} />
      )}

      {/* Stats Panel */}
      {showStats && (
        <StatsPanel onClose={() => setShowStats(false)} />
      )}

      {/* Photo Mode - Instagram optimized capture */}
      {showPhotoMode && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="text-white text-xl">Preparando cámara...</div></div>}>
          <PhotoModeUI onClose={handleClosePhotoMode} />
        </Suspense>
      )}

      {/* Activity HUD - Tool wheel and activity indicators */}
      {showActivityHUD && !showPhotoMode && !showCustomization && !isLiveSessionOpen && (
        <Suspense fallback={null}>
          <ActivityHUD />
        </Suspense>
      )}

      {/* Seasonal Event Manager - handles event detection and notifications */}
      <Suspense fallback={null}>
        <SeasonalEventManager />
      </Suspense>

      {/* Quick Share Button - appears during epic moments */}
      {!showShareModal && !showCustomization && !isLiveSessionOpen && (
        <QuickShareButton onOpenFullShare={handleOpenShare} />
      )}

      {/* Multiplayer Chat - Replaces old GameChat */}
      <MultiplayerChat isOpen={showMultiplayerChat} onClose={handleCloseMultiplayerChat} />

      {/* Online Indicator - Shows player count, positioned to not block other UI */}
      {!showMultiplayerChat && !isLiveSessionOpen && (
        <OnlineIndicator
          onClick={handleToggleMultiplayerChat}
          className={`fixed z-40 ${isMobile ? 'top-4 left-1/2 -translate-x-1/2' : 'bottom-20 right-4'}`}
        />
      )}

      {/* Mobile Controls */}
      {showMobileControls && <MobileControls />}

      {/* Desktop Controls Hint */}
      {showControlsHint && <ControlsHint isDriving={isDriving} />}

      {/* Accessibility toggles - hidden on mobile during gameplay, accessible via menu */}


      {/* Debug Panel - triple tap top-left or F3 */}
      <DebugPanel />

      {/* Performance Overlay - toggle with ~ key */}
      <PerformanceOverlay />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};
