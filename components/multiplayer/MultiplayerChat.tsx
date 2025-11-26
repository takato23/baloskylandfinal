/**
 * Multiplayer Chat Component
 * Real-time chat connected to Supabase backend
 * Supports global and proximity chat for 100+ users
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
      <div className="text-center py-1">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-2`}>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs font-semibold" style={{ color: message.color }}>
          {message.username}
        </span>
        <span className="text-[10px] text-gray-400">{timeString}</span>
        {message.type === 'proximity' && (
          <span className="text-[10px] text-blue-400">(cerca)</span>
        )}
      </div>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
          isOwn
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
    onClick={onClick}
    className="fixed bottom-20 right-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-xl flex items-center gap-2 px-4 py-3 hover:scale-105 transition-transform active:scale-95"
  >
    <span className="text-xl">💬</span>
    <span className="text-sm font-bold">{onlineCount} online</span>
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
));

MinimizedBubble.displayName = 'MinimizedBubble';

// ============================================
// Main Multiplayer Chat Component
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmotes, setShowEmotes] = useState(false);
  const [chatType, setChatType] = useState<'global' | 'proximity'>('global');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCount = useRef(0);

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

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  // Track unread messages
  useEffect(() => {
    if (isMinimized && messages.length > lastMessageCount.current) {
      setUnreadCount((prev) => prev + (messages.length - lastMessageCount.current));
    }
    lastMessageCount.current = messages.length;
  }, [messages.length, isMinimized]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const handleUsernameSubmit = useCallback((username: string, color: string) => {
    connect(username, color);
  }, [connect]);

  const handleSendMessage = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText.trim(), chatType);
    setInputText('');

    if (isMobile) {
      inputRef.current?.blur();
    }
  }, [inputText, chatType, sendMessage, isMobile]);

  const handleEmote = useCallback((emote: string) => {
    doEmote(emote);
    sendMessage(emote, 'global');
    setShowEmotes(false);
  }, [doEmote, sendMessage]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleExpand = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  if (!isOpen) return null;

  // Show username modal if not connected
  if (!isConnected) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />;
  }

  // Show minimized bubble
  if (isMinimized) {
    return (
      <MinimizedBubble
        unreadCount={unreadCount}
        onlineCount={onlineCount}
        onClick={handleExpand}
      />
    );
  }

  // Responsive sizing
  const chatWidth = isMobile ? (isLandscape ? 'w-[45vw]' : 'w-full') : 'w-[400px]';
  const chatHeight = isMobile ? (isLandscape ? 'h-full' : 'h-[60vh]') : 'h-[500px]';

  return (
    <div
      className={`fixed ${
        isMobile ? (isLandscape ? 'right-0 top-0 bottom-0' : 'bottom-0 left-0 right-0') : 'bottom-4 right-4'
      } z-40`}
    >
      <div
        className={`${chatWidth} ${chatHeight} bg-white/95 backdrop-blur-xl ${
          isMobile ? (isLandscape ? 'rounded-l-2xl' : 'rounded-t-2xl') : 'rounded-2xl'
        } shadow-2xl flex flex-col overflow-hidden animate-in ${
          isMobile ? 'slide-in-from-bottom' : 'slide-in-from-right'
        } duration-300 border border-gray-200`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌎</span>
            <div>
              <h3 className="font-bold text-base leading-none">Chat Global</h3>
              <span className="text-xs text-white/80">{onlineCount} exploradores online</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={handleMinimize}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                aria-label="Minimizar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Type Toggle */}
        <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 border-b border-gray-100 shrink-0">
          <button
            onClick={() => setChatType('global')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              chatType === 'global'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => setChatType('proximity')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              chatType === 'proximity'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            📍 Cercanos
          </button>
          <div className="flex-1" />
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">En vivo</span>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
              <span className="text-4xl">👋</span>
              <p className="text-sm font-medium text-center">No hay mensajes aun</p>
              <p className="text-xs text-center">Se el primero en saludar!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <Message key={msg.id} message={msg} isOwn={msg.odIduserId === odIduserId} />
            ))
          )}
        </div>

        {/* Emotes Panel */}
        {showEmotes && (
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex gap-2 flex-wrap">
            {EMOTES.map((emote) => (
              <button
                key={emote}
                onClick={() => handleEmote(emote)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emote}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEmotes(!showEmotes)}
              className="bg-gray-100 hover:bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center transition-colors shrink-0"
            >
              😊
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={chatType === 'proximity' ? 'Mensaje a jugadores cercanos...' : 'Escribe un mensaje...'}
              maxLength={500}
              className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
              enterKeyHint="send"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerChat;
