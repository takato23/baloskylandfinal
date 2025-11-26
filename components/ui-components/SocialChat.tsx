/**
 * Social Chat Component
 * Real-time chat for users to communicate in the social plaza
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useIsMobile, useOrientation } from '../../hooks';

// ============================================
// Types
// ============================================

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  color: string;
}

interface SocialChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

// ============================================
// Username Colors
// ============================================

const USERNAME_COLORS = [
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ff9800',
  '#ff5722', '#f44336', '#795548', '#607d8b',
];

const getRandomColor = () => USERNAME_COLORS[Math.floor(Math.random() * USERNAME_COLORS.length)];

// ============================================
// Local Storage Helpers
// ============================================

const STORAGE_KEY = 'cozy_city_username';
const MESSAGES_KEY = 'cozy_city_messages';

const getSavedUsername = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const saveUsername = (username: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, username);
  } catch {
    // Ignore storage errors
  }
};

const getSavedMessages = (): ChatMessage[] => {
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    if (saved) {
      const messages = JSON.parse(saved);
      // Only keep messages from the last hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      return messages.filter((m: ChatMessage) => m.timestamp > oneHourAgo);
    }
  } catch {
    // Ignore storage errors
  }
  return [];
};

const saveMessages = (messages: ChatMessage[]) => {
  try {
    // Only save the last 50 messages
    const toSave = messages.slice(-50);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
};

// ============================================
// Username Modal
// ============================================

interface UsernameModalProps {
  onSubmit: (username: string) => void;
}

const UsernameModal: React.FC<UsernameModalProps> = memo(({ onSubmit }) => {
  const [username, setUsername] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length >= 2 && trimmed.length <= 20) {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Bienvenido al Chat
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Elige un nombre para chatear con otros exploradores
        </p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tu nombre..."
            maxLength={20}
            className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-purple-500 focus:bg-white transition-all outline-none mb-4"
          />
          <button
            type="submit"
            disabled={username.trim().length < 2}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            Entrar al Chat
          </button>
        </form>
      </div>
    </div>
  );
});

UsernameModal.displayName = 'UsernameModal';

// ============================================
// Message Component
// ============================================

interface MessageProps {
  message: ChatMessage;
  isOwn: boolean;
}

const Message: React.FC<MessageProps> = memo(({ message, isOwn }) => {
  const timeString = new Date(message.timestamp).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-2`}>
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className="text-xs font-semibold"
          style={{ color: message.color }}
        >
          {message.username}
        </span>
        <span className="text-[10px] text-gray-400">{timeString}</span>
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
  onClick: () => void;
}

const MinimizedBubble: React.FC<MinimizedBubbleProps> = memo(({ unreadCount, onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-20 right-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-14 h-14 shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
  >
    <span className="text-2xl">💬</span>
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
));

MinimizedBubble.displayName = 'MinimizedBubble';

// ============================================
// Main Social Chat Component
// ============================================

export const SocialChat: React.FC<SocialChatProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState<string | null>(getSavedUsername());
  const [userColor] = useState(getRandomColor);
  const [messages, setMessages] = useState<ChatMessage[]>(getSavedMessages());
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMobile = useIsMobile();
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  // Save messages to localStorage
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  // Simulate receiving messages (for demo - replace with real WebSocket)
  useEffect(() => {
    if (!isOpen) return;

    // Demo: Add welcome message if no messages
    if (messages.length === 0 && username) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        username: 'Sistema',
        text: `Bienvenido ${username}! Este es el chat de la plaza social.`,
        timestamp: Date.now(),
        color: '#9c27b0',
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, username]);

  const handleUsernameSubmit = useCallback((name: string) => {
    setUsername(name);
    saveUsername(name);
  }, []);

  const handleSendMessage = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !username) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      text: inputText.trim(),
      timestamp: Date.now(),
      color: userColor,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Blur input on mobile
    if (isMobile) {
      inputRef.current?.blur();
    }
  }, [inputText, username, userColor, isMobile]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleExpand = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  if (!isOpen) return null;

  // Show username modal if not set
  if (!username) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />;
  }

  // Show minimized bubble
  if (isMinimized) {
    return <MinimizedBubble unreadCount={unreadCount} onClick={handleExpand} />;
  }

  // Responsive sizing
  const chatWidth = isMobile
    ? isLandscape ? 'w-[45vw]' : 'w-full'
    : 'w-[380px]';

  const chatHeight = isMobile
    ? isLandscape ? 'h-full' : 'h-[60vh]'
    : 'h-[500px]';

  return (
    <div className={`fixed ${isMobile ? (isLandscape ? 'right-0 top-0 bottom-0' : 'bottom-0 left-0 right-0') : 'bottom-4 right-4'} z-40`}>
      <div
        className={`${chatWidth} ${chatHeight} bg-white/95 backdrop-blur-xl ${
          isMobile
            ? isLandscape
              ? 'rounded-l-2xl'
              : 'rounded-t-2xl'
            : 'rounded-2xl'
        } shadow-2xl flex flex-col overflow-hidden animate-in ${
          isMobile ? 'slide-in-from-bottom' : 'slide-in-from-right'
        } duration-300 border border-gray-200`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h3 className="font-bold text-base leading-none">Chat Social</h3>
              <span className="text-xs text-white/80">Plaza de {username}</span>
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

        {/* Online indicator */}
        <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 border-b border-gray-100 shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-600">Chat activo - Mensajes en tiempo real</span>
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
              <Message
                key={msg.id}
                message={msg}
                isOwn={msg.username === username}
              />
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje..."
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
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Los mensajes se guardan por 1 hora
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialChat;
