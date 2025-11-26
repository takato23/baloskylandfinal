/**
 * Game-Integrated Chat Component
 * Chat that feels part of the game UI, not a separate panel
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

// ============================================
// Username Colors - Vibrant game colors
// ============================================

const USERNAME_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF8C00',
];

const getColorForUsername = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length];
};

// ============================================
// Local Storage
// ============================================

const STORAGE_KEY = 'cozy_city_username';
const MESSAGES_KEY = 'cozy_city_chat';

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
  } catch {}
};

const getSavedMessages = (): ChatMessage[] => {
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    if (saved) {
      const messages = JSON.parse(saved);
      const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
      return messages.filter((m: ChatMessage) => m.timestamp > thirtyMinsAgo);
    }
  } catch {}
  return [];
};

const saveMessages = (messages: ChatMessage[]) => {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-30)));
  } catch {}
};

// ============================================
// Floating Message Bubble (appears briefly)
// ============================================

interface FloatingMessageProps {
  message: ChatMessage;
  onComplete: () => void;
}

const FloatingMessage: React.FC<FloatingMessageProps> = memo(({ message, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mb-1">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 max-w-[280px] md:max-w-[350px]">
        <span className="font-bold text-xs" style={{ color: message.color }}>
          {message.username}:
        </span>
        <span className="text-white text-xs ml-1.5">{message.text}</span>
      </div>
    </div>
  );
});

FloatingMessage.displayName = 'FloatingMessage';

// ============================================
// Username Input (inline, game-style)
// ============================================

interface UsernameInputProps {
  onSubmit: (username: string) => void;
}

const UsernameInput: React.FC<UsernameInputProps> = memo(({ onSubmit }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().length >= 2) {
      onSubmit(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tu nombre para chatear..."
        maxLength={15}
        className="flex-1 bg-black/50 border border-white/30 rounded-full px-4 py-2 text-white text-sm placeholder-white/50 focus:border-yellow-400 focus:outline-none backdrop-blur-sm"
      />
      <button
        type="submit"
        disabled={value.trim().length < 2}
        className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-500 text-black font-bold px-4 py-2 rounded-full text-sm transition-colors"
      >
        Entrar
      </button>
    </form>
  );
});

UsernameInput.displayName = 'UsernameInput';

// ============================================
// Main Game Chat Component
// ============================================

export const GameChat: React.FC = () => {
  const [username, setUsername] = useState<string | null>(getSavedUsername());
  const [messages, setMessages] = useState<ChatMessage[]>(getSavedMessages());
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // Save messages when they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Auto-scroll in expanded mode
  useEffect(() => {
    if (isExpanded && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  // Show new messages as floating bubbles
  useEffect(() => {
    if (messages.length > 0 && !isExpanded) {
      const lastMsg = messages[messages.length - 1];
      if (!visibleMessages.find(m => m.id === lastMsg.id)) {
        setVisibleMessages(prev => [...prev.slice(-4), lastMsg]);
      }
    }
  }, [messages, isExpanded]);

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
      color: getColorForUsername(username),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    if (isMobile) {
      inputRef.current?.blur();
      setIsFocused(false);
    }
  }, [inputText, username, isMobile]);

  const handleRemoveVisible = useCallback((id: string) => {
    setVisibleMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsExpanded(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay collapse to allow click on messages
    setTimeout(() => {
      if (!isFocused) {
        setIsExpanded(false);
      }
    }, 200);
  }, [isFocused]);

  // Position based on device
  const chatPosition = isMobile
    ? isLandscape
      ? 'bottom-2 left-2 right-auto w-[45%]'
      : 'bottom-20 left-2 right-2'
    : 'bottom-4 left-4 w-[400px]';

  return (
    <div className={`fixed ${chatPosition} z-30 pointer-events-none`}>
      {/* Floating messages (when not expanded) */}
      {!isExpanded && (
        <div className="mb-2 pointer-events-none">
          {visibleMessages.map(msg => (
            <FloatingMessage
              key={msg.id}
              message={msg}
              onComplete={() => handleRemoveVisible(msg.id)}
            />
          ))}
        </div>
      )}

      {/* Expanded message history */}
      {isExpanded && username && (
        <div
          ref={messagesRef}
          className="bg-black/40 backdrop-blur-md rounded-xl mb-2 max-h-[200px] overflow-y-auto pointer-events-auto border border-white/10"
        >
          <div className="p-2 space-y-1">
            {messages.length === 0 ? (
              <p className="text-white/50 text-xs text-center py-4">
                No hay mensajes. ¡Sé el primero en saludar!
              </p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="text-xs">
                  <span className="font-bold" style={{ color: msg.color }}>
                    {msg.username}:
                  </span>
                  <span className="text-white ml-1">{msg.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat input bar */}
      <div className="pointer-events-auto">
        {!username ? (
          <UsernameInput onSubmit={handleUsernameSubmit} />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Expand/collapse button */}
            <button
              type="button"
              onClick={handleToggleExpand}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isExpanded
                  ? 'bg-yellow-400 text-black'
                  : 'bg-black/50 text-white border border-white/30 backdrop-blur-sm'
              }`}
            >
              <span className="text-lg">{isExpanded ? '▼' : '💬'}</span>
            </button>

            {/* Message input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={handleFocus}
                placeholder={isMobile ? "Mensaje..." : "Escribe un mensaje..."}
                maxLength={200}
                className="w-full bg-black/50 border border-white/30 rounded-full pl-4 pr-12 py-2 text-white text-sm placeholder-white/50 focus:border-yellow-400 focus:outline-none backdrop-blur-sm"
                enterKeyHint="send"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 hover:bg-yellow-300 disabled:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* Username indicator */}
        {username && (
          <div className="mt-1 flex items-center gap-2 text-[10px] text-white/50">
            <span>Chateando como</span>
            <span className="font-bold" style={{ color: getColorForUsername(username) }}>
              {username}
            </span>
            <button
              onClick={() => {
                setUsername(null);
                localStorage.removeItem(STORAGE_KEY);
              }}
              className="text-white/30 hover:text-white/60 underline"
            >
              cambiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameChat;
