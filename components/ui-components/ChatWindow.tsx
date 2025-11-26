import React, { useEffect, useRef, useState, memo, useCallback, useMemo, lazy, Suspense } from 'react';
import { useGameStore } from '../../store';
import { useIsMobile, useOrientation } from '../../hooks';
import type { ChatMessage } from '../../types';

// Lazy load ChatHistory for code splitting
const ChatHistory = lazy(() => import('./ChatHistory').then(m => ({ default: m.ChatHistory })));

// ============================================
// Constants
// ============================================

const KEYBOARD_THRESHOLD = 0.75; // Viewport height ratio to detect keyboard
const SCROLL_BEHAVIOR_THRESHOLD = 5; // Messages threshold for smooth scroll

// ============================================
// Utility Functions
// ============================================

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'Ahora';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
  return formatTimestamp(timestamp);
};

// Haptic feedback for mobile
const vibrate = (pattern: number = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// ============================================
// Connection Badge Component
// ============================================

const ConnectionBadge: React.FC<{
  state: 'disconnected' | 'connecting' | 'connected';
  reduceMotion?: boolean;
}> = memo(({ state, reduceMotion = false }) => {
  const config = {
    disconnected: { color: 'bg-red-500', text: 'Desconectado', icon: '⚠️' },
    connecting: { color: 'bg-yellow-500', text: 'Conectando...', icon: '🔄' },
    connected: { color: 'bg-green-500', text: 'Conectado', icon: '✓' },
  }[state];

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${config.color} ${state === 'connecting' && !reduceMotion ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-medium text-gray-600">{config.text}</span>
    </div>
  );
});

ConnectionBadge.displayName = 'ConnectionBadge';

// ============================================
// Typing Indicator Component
// ============================================

const TypingIndicator: React.FC<{ reduceMotion?: boolean; npcName?: string }> = memo(({ reduceMotion = false, npcName }) => (
  <div className="flex justify-start">
    <div className="bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-2 h-2 bg-purple-400 rounded-full ${reduceMotion ? 'opacity-60' : 'animate-bounce'}`}
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.6s' }}
            />
          ))}
        </div>
        {npcName && <span className="text-xs text-gray-400">{npcName} escribiendo...</span>}
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

// ============================================
// Voice Activity Indicator Component
// ============================================

const VoiceActivityIndicator: React.FC<{
  volume: number;
  isUser?: boolean;
  size?: 'sm' | 'md' | 'lg';
  reduceMotion?: boolean;
}> = memo(({ volume, isUser = false, size = 'md', reduceMotion = false }) => {
  const bars = size === 'lg' ? 7 : size === 'md' ? 5 : 3;
  const maxHeight = size === 'lg' ? 24 : size === 'md' ? 16 : 12;

  return (
    <div className={`flex gap-0.5 items-end ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ height: `${maxHeight}px` }}>
      {Array.from({ length: bars }).map((_, i) => {
        const normalizedIndex = i / (bars - 1);
        const centerWeight = 1 - Math.abs(normalizedIndex - 0.5) * 2;
        const randomJitter = reduceMotion ? 0 : Math.random() * 4;
        const height = Math.max(4, Math.min(maxHeight, (volume * maxHeight * (0.5 + centerWeight * 0.5)) + randomJitter));
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${
              isUser ? 'bg-white/80' : 'bg-purple-400'
            }`}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
});

VoiceActivityIndicator.displayName = 'VoiceActivityIndicator';

// ============================================
// Minimized Chat Bubble Component
// ============================================

interface MinimizedChatProps {
  npcName: string;
  isNpcSpeaking: boolean;
  volume: number;
  onExpand: () => void;
  onClose: () => void;
  reduceMotion?: boolean;
  isMobile?: boolean;
}

const MinimizedChat: React.FC<MinimizedChatProps> = memo(
  ({ npcName, isNpcSpeaking, volume, onExpand, onClose, reduceMotion = false, isMobile = false }) => (
    <div className={`fixed ${isMobile ? 'bottom-32 right-4' : 'bottom-4 right-4'} z-50 pointer-events-auto`}>
      <div
        className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full px-4 py-3 shadow-xl flex items-center gap-3 border-2 border-white/20 touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            isNpcSpeaking ? `bg-blue-400 ${reduceMotion ? '' : 'animate-pulse'}` : 'bg-green-400'
          }`}
        />
        <button
          onClick={() => {
            vibrate(10);
            onExpand();
          }}
          className="flex items-center gap-2 text-white font-medium min-h-[44px] touch-manipulation"
        >
          <span className="text-sm">{npcName}</span>
          {isNpcSpeaking && <VoiceActivityIndicator volume={volume} size="sm" reduceMotion={reduceMotion} />}
        </button>
        <button
          onClick={() => {
            vibrate(10);
            onClose();
          }}
          className="ml-2 text-white/70 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Cerrar chat"
        >
          ✕
        </button>
      </div>
    </div>
  )
);

MinimizedChat.displayName = 'MinimizedChat';

// ============================================
// Message Bubble Component
// ============================================

interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
  showTimestamp?: boolean;
  reduceMotion?: boolean;
  highContrast?: boolean;
  isMobile?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = memo(
  ({ message, isUser, showTimestamp = true, reduceMotion = false, highContrast = false, isMobile = false }) => {
    const [showTime, setShowTime] = useState(false);

    const handleToggleTime = useCallback(() => {
      if (isMobile) vibrate(5);
      setShowTime(!showTime);
    }, [showTime, isMobile]);

    return (
      <div
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} group ${
          reduceMotion ? '' : 'animate-in fade-in slide-in-from-bottom-2 duration-200'
        }`}
        onClick={handleToggleTime}
      >
        <div className={`flex flex-col ${isMobile ? 'max-w-[90%]' : 'max-w-[85%]'}`}>
          <div
            className={`${isMobile ? 'p-3.5' : 'p-3'} rounded-2xl text-sm shadow-sm transition-all ${
              isUser
                ? `bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tr-sm ${
                    highContrast ? 'ring-2 ring-purple-300' : ''
                  }`
                : `bg-white text-gray-800 border border-gray-100 rounded-tl-sm ${
                    highContrast ? 'ring-2 ring-gray-300' : ''
                  }`
            }`}
          >
            <p className={`whitespace-pre-wrap break-words leading-relaxed ${isMobile ? 'text-base' : 'text-sm'}`}>
              {message.text}
            </p>
          </div>

          {showTimestamp && (
            <span
              className={`text-[10px] mt-1 transition-opacity duration-200 ${
                isUser ? 'text-right text-gray-400' : 'text-left text-gray-400'
              } ${showTime ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
            >
              {formatRelativeTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

// ============================================
// Empty State Component
// ============================================

const EmptyState: React.FC<{ npcName?: string; isMobile?: boolean }> = memo(({ npcName, isMobile = false }) => (
  <div className={`flex flex-col items-center justify-center h-full text-gray-400 space-y-3 ${isMobile ? 'py-6 px-4' : 'py-8 px-4'}`}>
    <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} bg-purple-100 rounded-full flex items-center justify-center`}>
      <span className={`${isMobile ? 'text-2xl' : 'text-3xl'}`}>🎙️</span>
    </div>
    <div className="text-center">
      <p className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-600`}>
        {npcName ? `Habla con ${npcName}` : 'Habla para comenzar'}
      </p>
      <p className="text-xs text-gray-400 mt-1">El NPC te escucha en tiempo real</p>
    </div>
    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-full">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      <span>Micrófono listo</span>
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

// ============================================
// Quick Actions Component
// ============================================

const QuickActions: React.FC<{
  onAction: (action: string) => void;
  disabled?: boolean;
  isMobile?: boolean;
}> = memo(({ onAction, disabled = false, isMobile = false }) => {
  const actions = [
    { id: 'greet', label: '👋 Hola', text: '¡Hola! ¿Cómo estás?' },
    { id: 'help', label: '❓ Ayuda', text: '¿Puedes ayudarme?' },
    { id: 'bye', label: '👋 Adiós', text: '¡Hasta luego!' },
  ];

  const handleAction = useCallback((text: string) => {
    if (isMobile) vibrate(10);
    onAction(text);
  }, [onAction, isMobile]);

  return (
    <div className="flex gap-2 overflow-x-auto py-1 px-1 scrollbar-hide">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleAction(action.text)}
          disabled={disabled}
          className={`flex-shrink-0 ${isMobile ? 'text-sm min-h-[40px] px-4' : 'text-xs px-3'} py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

// ============================================
// Mobile Header Component
// ============================================

interface MobileHeaderProps {
  npcName: string;
  connectionState: 'disconnected' | 'connecting' | 'connected';
  isNpcSpeaking: boolean;
  liveVolume: number;
  reduceMotion: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onOpenHistory: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = memo(({
  npcName,
  connectionState,
  isNpcSpeaking,
  liveVolume,
  reduceMotion,
  onMinimize,
  onClose,
  onOpenHistory,
}) => (
  <header className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-3 py-2.5 text-white flex justify-between items-center shadow-lg shrink-0 safe-area-inset-top">
    <div className="flex items-center gap-2">
      {/* NPC Avatar */}
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-base font-bold">
          {npcName.charAt(0)}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-purple-600 ${
            connectionState === 'connected'
              ? isNpcSpeaking
                ? `bg-blue-400 ${reduceMotion ? '' : 'animate-pulse'}`
                : 'bg-green-400'
              : `bg-yellow-400 ${reduceMotion ? '' : 'animate-pulse'}`
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm leading-tight truncate">{npcName}</h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-purple-200 font-medium">
            {connectionState === 'connected'
              ? isNpcSpeaking
                ? 'Hablando...'
                : 'En línea'
              : 'Conectando...'}
          </span>
          {isNpcSpeaking && connectionState === 'connected' && (
            <VoiceActivityIndicator volume={liveVolume} size="sm" reduceMotion={reduceMotion} />
          )}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-0.5">
      {/* History button */}
      <button
        onClick={() => {
          vibrate(10);
          onOpenHistory();
        }}
        className="bg-white/10 active:bg-white/30 rounded-full p-2 text-white transition-all min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
        aria-label="Ver historial"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {/* Minimize button */}
      <button
        onClick={() => {
          vibrate(10);
          onMinimize();
        }}
        className="bg-white/10 active:bg-white/30 rounded-full p-2 text-white transition-all min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
        aria-label="Minimizar chat"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {/* Close button */}
      <button
        onClick={() => {
          vibrate(10);
          onClose();
        }}
        className="bg-white/10 active:bg-red-500/80 rounded-full p-2 text-white transition-all min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
        aria-label="Cerrar chat"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </header>
));

MobileHeader.displayName = 'MobileHeader';

// ============================================
// Main Chat Window Component
// ============================================

export const ChatWindow: React.FC = () => {
  // Store selectors
  const liveSession = useGameStore((s) => s.liveSession);
  const endLiveSession = useGameStore((s) => s.endLiveSession);
  const connectionState = useGameStore((s) => s.liveConnectionState);
  const liveVolume = useGameStore((s) => s.liveVolume);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const highContrast = useGameStore((s) => s.highContrast);
  const reduceMotion = useGameStore((s) => s.reduceMotion);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Local state
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Hooks
  const isMobile = useIsMobile();
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // Memoized values
  const isNpcSpeaking = useMemo(() => liveVolume > 0.1, [liveVolume]);
  const messageCount = liveSession.messages.length;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      const behavior = messageCount > SCROLL_BEHAVIOR_THRESHOLD && !reduceMotion ? 'smooth' : 'auto';
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, [messageCount, reduceMotion]);

  // Hide quick actions after first message
  useEffect(() => {
    if (messageCount > 0) {
      setShowQuickActions(false);
    }
  }, [messageCount]);

  // Detect keyboard open/close on mobile using visualViewport API
  useEffect(() => {
    if (!isMobile) return;

    const handleViewportResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(currentHeight);
      setIsKeyboardOpen(currentHeight < window.innerHeight * KEYBOARD_THRESHOLD);
    };

    // Use visualViewport API for better keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    } else {
      window.addEventListener('resize', handleViewportResize);
    }

    handleViewportResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      } else {
        window.removeEventListener('resize', handleViewportResize);
      }
    };
  }, [isMobile]);

  // Focus input when keyboard opens (mobile)
  useEffect(() => {
    if (isMobile && isKeyboardOpen && inputRef.current) {
      // Small delay to ensure the keyboard is fully open
      const timer = setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isKeyboardOpen]);

  // Send message handler
  const handleSendMessage = useCallback((text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    vibrate(15);
    addChatMessage('user', messageText.trim());
    setInputText('');

    if (isMobile) {
      // Blur to dismiss keyboard after sending
      setTimeout(() => inputRef.current?.blur(), 100);
    }
  }, [inputText, addChatMessage, isMobile]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  }, [handleSendMessage]);

  const handleQuickAction = useCallback((text: string) => {
    handleSendMessage(text);
  }, [handleSendMessage]);

  const handleMinimize = useCallback(() => {
    vibrate(10);
    setIsMinimized(true);
  }, []);

  const handleExpand = useCallback(() => {
    vibrate(10);
    setIsMinimized(false);
  }, []);

  const handleClose = useCallback(() => {
    vibrate(15);
    endLiveSession();
  }, [endLiveSession]);

  const handleOpenHistory = useCallback(() => {
    vibrate(10);
    setShowHistoryModal(true);
  }, []);

  // Early return if session not open
  if (!liveSession.isOpen || !liveSession.npc) return null;

  // Show minimized version
  if (isMinimized) {
    return (
      <MinimizedChat
        npcName={liveSession.npc.name}
        isNpcSpeaking={isNpcSpeaking}
        volume={liveVolume}
        onExpand={handleExpand}
        onClose={handleClose}
        reduceMotion={reduceMotion}
        isMobile={isMobile}
      />
    );
  }

  // Calculate responsive dimensions
  const getMobileDimensions = () => {
    if (!isMobile) {
      return {
        width: 'w-[420px]',
        height: 'h-[650px]',
        position: 'pb-8 pr-8',
        roundedClass: 'rounded-3xl',
      };
    }

    if (isLandscape) {
      return {
        width: 'w-[55vw] max-w-[500px]',
        height: 'h-full',
        position: 'right-0 top-0 bottom-0',
        roundedClass: 'rounded-l-3xl',
      };
    }

    // Portrait mode
    const heightClass = isKeyboardOpen ? 'h-[45vh]' : 'h-[65vh]';
    return {
      width: 'w-full',
      height: heightClass,
      position: 'bottom-0 left-0 right-0',
      roundedClass: 'rounded-t-3xl',
    };
  };

  const { width, height, position, roundedClass } = getMobileDimensions();

  return (
    <div
      className={`absolute inset-0 z-40 pointer-events-none flex flex-col justify-end items-center md:items-end ${isMobile ? '' : position}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div
        className={`${width} ${height} bg-white/98 backdrop-blur-xl ${roundedClass} shadow-2xl flex flex-col overflow-hidden pointer-events-auto ${
          reduceMotion ? '' : `animate-in ${isMobile ? 'slide-in-from-bottom' : 'slide-in-from-right'} duration-300`
        } border border-gray-200/50 ${highContrast ? 'ring-2 ring-black' : ''}`}
        role="dialog"
        aria-label={`Chat con ${liveSession.npc.name}`}
        style={{
          maxHeight: isMobile && isKeyboardOpen ? `${viewportHeight * 0.5}px` : undefined,
        }}
      >
        {/* Header */}
        {isMobile ? (
          <MobileHeader
            npcName={liveSession.npc.name}
            connectionState={connectionState}
            isNpcSpeaking={isNpcSpeaking}
            liveVolume={liveVolume}
            reduceMotion={reduceMotion}
            onMinimize={handleMinimize}
            onClose={handleClose}
            onOpenHistory={handleOpenHistory}
          />
        ) : (
          <header className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-4 py-3 text-white flex justify-between items-center shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {liveSession.npc.name.charAt(0)}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-purple-600 ${
                    connectionState === 'connected'
                      ? isNpcSpeaking
                        ? `bg-blue-400 ${reduceMotion ? '' : 'animate-pulse'}`
                        : 'bg-green-400'
                      : `bg-yellow-400 ${reduceMotion ? '' : 'animate-pulse'}`
                  }`}
                />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">{liveSession.npc.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-purple-200 font-medium">
                    {connectionState === 'connected'
                      ? isNpcSpeaking
                        ? 'Hablando...'
                        : 'En línea'
                      : 'Conectando...'}
                  </span>
                  {isNpcSpeaking && connectionState === 'connected' && (
                    <VoiceActivityIndicator volume={liveVolume} size="sm" reduceMotion={reduceMotion} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenHistory}
                className="bg-white/10 hover:bg-white/20 rounded-full p-2.5 text-white transition-all hover:scale-105"
                aria-label="Ver historial"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="bg-white/10 hover:bg-red-500/80 rounded-full p-2.5 text-white transition-all hover:scale-105"
                aria-label="Cerrar chat"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>
        )}

        {/* Voice Activity Banner (when speaking) */}
        {isNpcSpeaking && connectionState === 'connected' && !isKeyboardOpen && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2 flex items-center justify-center shrink-0 border-b border-purple-100">
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
              <VoiceActivityIndicator volume={liveVolume} size={isMobile ? 'md' : 'lg'} reduceMotion={reduceMotion} />
              <span className={`text-purple-700 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                {liveSession.npc.name} hablando
              </span>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-4'} space-y-3 bg-gradient-to-b from-gray-50/80 to-white min-h-0 scroll-smooth overscroll-contain`}
        >
          {messageCount === 0 ? (
            <EmptyState npcName={liveSession.npc.name} isMobile={isMobile} />
          ) : (
            <>
              {liveSession.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isUser={msg.sender === 'user'}
                  showTimestamp={true}
                  reduceMotion={reduceMotion}
                  highContrast={highContrast}
                  isMobile={isMobile}
                />
              ))}
              {isNpcSpeaking && (
                <TypingIndicator reduceMotion={reduceMotion} npcName={liveSession.npc.name} />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <footer className={`${isMobile ? (isKeyboardOpen ? 'p-2' : 'p-3') : 'p-3'} bg-white border-t border-gray-100 shrink-0 space-y-2`}>
          {/* Connection status - compact on mobile */}
          <div className="flex items-center justify-center">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              connectionState === 'connected' ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionState === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
              } ${!reduceMotion ? 'animate-pulse' : ''}`} />
              <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium ${
                connectionState === 'connected' ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {connectionState === 'connected' ? 'Mic activo' : 'Conectando...'}
              </span>
              {connectionState === 'connected' && !isMobile && (
                <span className="text-[10px] text-gray-400 border-l border-gray-200 pl-2 ml-1">
                  Gemini Live
                </span>
              )}
            </div>
          </div>

          {/* Quick actions (only shown when no messages and not keyboard open) */}
          {showQuickActions && messageCount === 0 && !isKeyboardOpen && (
            <QuickActions
              onAction={handleQuickAction}
              disabled={connectionState !== 'connected'}
              isMobile={isMobile}
            />
          )}

          {/* Text input */}
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className={`flex-1 bg-gray-100 border-0 rounded-full ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2.5 text-sm'} focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none ${
                highContrast ? 'ring-1 ring-gray-400' : ''
              }`}
              enterKeyHint="send"
              aria-label="Mensaje de texto"
              autoComplete="off"
              autoCorrect="on"
              style={{ fontSize: isMobile ? '16px' : undefined }} // Prevent iOS zoom
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full ${isMobile ? 'w-12 h-12' : 'w-11 h-11'} flex items-center justify-center active:from-purple-700 active:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:shadow-lg active:scale-95 shrink-0 touch-manipulation`}
              aria-label="Enviar mensaje"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </footer>
      </div>

      {/* Chat History Modal */}
      {showHistoryModal && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-8">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
          </div>
        }>
          <ChatHistory isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default ChatWindow;
