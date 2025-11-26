/**
 * Multiplayer Chat Component - Roblox Style
 * Messages always visible, input expands on tap
 * Real-time chat connected to Supabase backend
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useMultiplayerV2, useChatMessagesV2, useOnlineCountV2, ChatMessageV2 } from '../../hooks/useMultiplayerV2';
import { useIsMobile, useOrientation } from '../../hooks';
import { isSupabaseConfigured } from '../../lib/supabase';

// ============================================
// Constants
// ============================================

const USERNAME_COLORS = [
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ff9800',
  '#ff5722', '#f44336', '#795548', '#607d8b',
];

const EMOTES = ['👋', '❤️', '😂', '🎉', '👍', '🔥', '⭐', '🎮'];

const getRandomColor = () => USERNAME_COLORS[Math.floor(Math.random() * USERNAME_COLORS.length)];

// Max messages to show in the overlay
const MAX_VISIBLE_MESSAGES = 5;
const MESSAGE_FADE_TIME = 8000; // 8 seconds before messages fade

// ============================================
// Haptic Feedback Helper
// ============================================

const vibrate = (pattern: number = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// ============================================
// Username Modal
// ============================================

interface UsernameModalProps {
  onSubmit: (username: string, color: string) => void;
}

const UsernameModal: React.FC<UsernameModalProps> = memo(({ onSubmit }) => {
  const [username, setUsername] = useState('');
  const [color] = useState(getRandomColor);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length >= 2 && trimmed.length <= 20) {
      // Save to localStorage
      localStorage.setItem('cozy_city_username', trimmed);
      localStorage.setItem('cozy_city_user_color', color);
      onSubmit(trimmed, color);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Unirse al Mundo
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Elige un nombre para jugar con otros exploradores
        </p>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre..."
              maxLength={20}
              className="flex-1 bg-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-purple-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={username.trim().length < 2}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            Entrar al Juego
          </button>
        </form>

        {!isSupabaseConfigured() && (
          <p className="text-xs text-amber-600 mt-3 text-center">
            Modo offline - Configura Supabase para multijugador
          </p>
        )}
      </div>
    </div>
  );
});

UsernameModal.displayName = 'UsernameModal';

// ============================================
// Message Component
// ============================================

interface MessageProps {
  message: ChatMessageV2;
  isOwn: boolean;
}

const Message: React.FC<MessageProps> = memo(({ message, isOwn }) => {
  const timeString = new Date(message.timestamp).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.type === 'system') {
    return (
      <div className="text-center py-0.5">
        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-1`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-[10px] font-semibold" style={{ color: message.color }}>
          {message.username}
        </span>
        <span className="text-[9px] text-gray-400">{timeString}</span>
        {message.type === 'proximity' && (
          <span className="text-[9px] text-blue-400">📍</span>
        )}
      </div>
      <div
        className={`max-w-[90%] px-2 py-1 rounded-xl text-xs ${isOwn
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-tr-sm'
          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}
      >
        {message.text}
      </div>
    </div>
  );
});

Message.displayName = 'Message';

// ============================================
// Minimized Chat Bubble
// ============================================

interface MinimizedBubbleProps {
  unreadCount: number;
  onlineCount: number;
  onClick: () => void;
}

const MinimizedBubble: React.FC<MinimizedBubbleProps> = memo(({ unreadCount, onlineCount, onClick }) => (
  <button
    onClick={() => {
      vibrate(10);
      onClick();
    }}
    className="fixed z-30 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-xl flex items-center gap-1.5 px-3 py-2 hover:scale-105 transition-transform active:scale-95 touch-manipulation top-[72px] left-3"
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    <span className="text-base">💬</span>
    <span className="text-xs font-bold">{onlineCount}</span>
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
));

MinimizedBubble.displayName = 'MinimizedBubble';

// ============================================
// Mobile Header Component
// ============================================

interface MobileHeaderProps {
  onlineCount: number;
  onMinimize: () => void;
  onClose: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = memo(({ onlineCount, onMinimize, onClose }) => (
  <header className="bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-1.5 text-white flex justify-between items-center shadow-lg shrink-0">
    <div className="flex items-center gap-1.5">
      <span className="text-base">🌎</span>
      <div>
        <h3 className="font-bold text-xs leading-tight">Chat Global</h3>
        <span className="text-[9px] text-white/80">{onlineCount} exploradores online</span>
      </div>
    </div>
    <button
      onClick={() => {
        vibrate(10);
        onClose();
      }}
      className="bg-white/20 active:bg-red-500/80 rounded-full p-1.5 text-white transition-all touch-manipulation"
      aria-label="Cerrar"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </header>
));

MobileHeader.displayName = 'MobileHeader';

// ============================================
// Floating Message (Roblox style - fades out)
// ============================================

interface FloatingMessageProps {
  message: ChatMessageV2;
  isNew: boolean;
}

const FloatingMessage: React.FC<FloatingMessageProps> = memo(({ message, isNew }) => {
  if (message.type === 'system') {
    return (
      <div className={`transition-opacity duration-500 ${isNew ? 'opacity-100' : 'opacity-60'}`}>
        <span className="text-[10px] text-white/70 italic">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-1 transition-opacity duration-500 ${isNew ? 'opacity-100' : 'opacity-70'}`}>
      <span
        className="text-[11px] font-bold shrink-0"
        style={{ color: message.color, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
      >
        {message.username}:
      </span>
      <span
        className="text-[11px] text-white break-words"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
      >
        {message.text}
      </span>
    </div>
  );
});

FloatingMessage.displayName = 'FloatingMessage';

// ============================================
// Main Multiplayer Chat Component - Roblox Style
// ============================================

interface MultiplayerChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiplayerChat: React.FC<MultiplayerChatProps> = ({ isOpen, onClose }) => {
  const { isConnected, odIduserId, connect, sendMessage, doEmote } = useMultiplayerV2();
  const messages = useChatMessagesV2();
  const onlineCount = useOnlineCountV2();

  const [inputText, setInputText] = useState('');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [messageTimestamps, setMessageTimestamps] = useState<Record<string, number>>({});

  const inputRef = useRef<HTMLInputElement>(null);

  const isMobile = useIsMobile();
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // Check for saved username
  const savedUsername = localStorage.getItem('cozy_city_username');
  const savedColor = localStorage.getItem('cozy_city_user_color') || getRandomColor();

  // Auto-connect if username exists
  useEffect(() => {
    if (savedUsername && !isConnected) {
      connect(savedUsername, savedColor);
    }
  }, [savedUsername, savedColor, isConnected, connect]);

  // Track message timestamps for fade effect
  useEffect(() => {
    const now = Date.now();
    const newTimestamps: Record<string, number> = {};
    messages.forEach(msg => {
      newTimestamps[msg.id] = messageTimestamps[msg.id] || now;
    });
    setMessageTimestamps(newTimestamps);
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isInputOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputOpen]);

  const handleUsernameSubmit = useCallback((username: string, color: string) => {
    connect(username, color);
  }, [connect]);

  const handleSendMessage = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    vibrate(15);
    sendMessage(inputText.trim(), 'global');
    setInputText('');
    setIsInputOpen(false);
    inputRef.current?.blur();
  }, [inputText, sendMessage]);

  const handleOpenInput = useCallback(() => {
    vibrate(10);
    setIsInputOpen(true);
  }, []);

  const handleCloseInput = useCallback(() => {
    setIsInputOpen(false);
    setInputText('');
    inputRef.current?.blur();
  }, []);

  const handleEmote = useCallback((emote: string) => {
    vibrate(10);
    doEmote(emote, 'emote');
    sendMessage(emote, 'global');
  }, [doEmote, sendMessage]);

  if (!isOpen) return null;

  // Show username modal if not connected
  if (!isConnected) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />;
  }

  // Get recent messages (last 5, within fade time)
  const now = Date.now();
  const recentMessages = messages
    .slice(-MAX_VISIBLE_MESSAGES)
    .filter(msg => (now - (messageTimestamps[msg.id] || msg.timestamp)) < MESSAGE_FADE_TIME);

  // Position based on orientation - away from joystick
  const chatPosition = isLandscape
    ? 'top-16 left-4' // Top left in landscape, below HUD
    : 'top-20 left-4'; // Top left in portrait, below HUD

  return (
    <>
      {/* Floating Messages Overlay - Always visible */}
      <div
        className={`fixed ${chatPosition} z-20 pointer-events-none max-w-[200px]`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="flex flex-col gap-0.5">
          {recentMessages.map((msg) => {
            const age = now - (messageTimestamps[msg.id] || msg.timestamp);
            const isNew = age < 3000;
            return (
              <FloatingMessage
                key={msg.id}
                message={msg}
                isNew={isNew}
              />
            );
          })}
        </div>
      </div>

      {/* Chat Button + Input Area */}
      <div
        className={`fixed ${chatPosition} z-30 pointer-events-auto`}
        style={{
          transform: `translateY(${recentMessages.length * 18 + 8}px)`,
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {isInputOpen ? (
          // Expanded Input
          <div className="flex items-center gap-1.5 animate-in slide-in-from-left duration-150">
            <form onSubmit={handleSendMessage} className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onBlur={() => {
                  // Delay close to allow button clicks
                  setTimeout(() => {
                    if (!inputText.trim()) {
                      handleCloseInput();
                    }
                  }, 150);
                }}
                placeholder="Mensaje..."
                maxLength={200}
                className="w-[140px] bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                enterKeyHint="send"
                style={{ fontSize: '16px' }} // Prevent iOS zoom
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white rounded-lg w-7 h-7 flex items-center justify-center transition-colors touch-manipulation"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
            <button
              onClick={handleCloseInput}
              className="bg-black/40 hover:bg-black/60 text-white/70 rounded-lg w-7 h-7 flex items-center justify-center transition-colors touch-manipulation"
            >
              ✕
            </button>
          </div>
        ) : (
          // Chat Button
          <button
            onClick={handleOpenInput}
            className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg px-2.5 py-1.5 text-white transition-all touch-manipulation active:scale-95"
          >
            <span className="text-sm">💬</span>
            <span className="text-[10px] font-medium">{onlineCount}</span>
          </button>
        )}
      </div>

      {/* Quick Emotes (visible when input is open) */}
      {isInputOpen && (
        <div
          className={`fixed ${chatPosition} z-30 pointer-events-auto animate-in fade-in duration-150`}
          style={{
            transform: `translateY(${recentMessages.length * 18 + 44}px)`,
          }}
        >
          <div className="flex gap-1">
            {EMOTES.slice(0, 4).map((emote) => (
              <button
                key={emote}
                onClick={() => handleEmote(emote)}
                className="bg-black/40 hover:bg-black/60 rounded-lg w-7 h-7 flex items-center justify-center text-sm transition-colors touch-manipulation active:scale-90"
              >
                {emote}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MultiplayerChat;
