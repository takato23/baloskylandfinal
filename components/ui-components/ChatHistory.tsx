/**
 * Chat History Component
 * Displays past conversations with NPCs
 */

import React, { useState, useMemo, memo, useCallback } from 'react';
import { useChatHistory, type ChatConversation } from '../../hooks';

// ============================================
// Utility Functions
// ============================================

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================
// Sub-Components
// ============================================

interface ConversationCardProps {
  conversation: ChatConversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = memo(
  ({ conversation, isSelected, onSelect, onDelete }) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    return (
      <div
        className={`p-3 rounded-xl cursor-pointer transition-all ${
          isSelected
            ? 'bg-purple-100 border-2 border-purple-400'
            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
              {conversation.npcName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-gray-800 truncate">
                {conversation.npcName}
              </h4>
              <p className="text-xs text-gray-500">
                {formatDate(conversation.lastMessageAt)}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
            aria-label="Eliminar conversacion"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {lastMessage && (
          <p className="mt-2 text-xs text-gray-600 line-clamp-2">
            <span className={lastMessage.sender === 'user' ? 'text-purple-600' : 'text-gray-500'}>
              {lastMessage.sender === 'user' ? 'Tu: ' : `${conversation.npcName}: `}
            </span>
            {lastMessage.text}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span>{conversation.messages.length} mensajes</span>
          <span>-</span>
          <span>{formatTime(conversation.lastMessageAt)}</span>
        </div>
      </div>
    );
  }
);

ConversationCard.displayName = 'ConversationCard';

// Message detail view
interface MessageDetailProps {
  conversation: ChatConversation;
  onBack: () => void;
}

const MessageDetail: React.FC<MessageDetailProps> = memo(({ conversation, onBack }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Volver"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {conversation.npcName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">{conversation.npcName}</h3>
            <p className="text-xs text-gray-500">{formatDate(conversation.startedAt)}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[80%]">
              <div
                className={`p-3 rounded-2xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.text}
              </div>
              <p className={`text-[10px] mt-1 text-gray-400 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

MessageDetail.displayName = 'MessageDetail';

// Search bar component
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = memo(({ value, onChange, placeholder = 'Buscar...' }) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-100 border-0 rounded-full px-4 py-2 pl-10 text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
    />
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>
));

SearchBar.displayName = 'SearchBar';

// ============================================
// Main Component
// ============================================

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ isOpen, onClose }) => {
  const {
    conversations,
    deleteConversation,
    clearHistory,
    searchMessages,
    stats,
  } = useChatHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const searchResults = searchMessages(searchQuery);
    const conversationIds = new Set(searchResults.map((r) => r.conversation.id));
    return conversations.filter((conv) => conversationIds.has(conv.id));
  }, [conversations, searchQuery, searchMessages]);

  const handleSelectConversation = useCallback((conversation: ChatConversation) => {
    setSelectedConversation(conversation);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteConversation(id);
    if (selectedConversation?.id === id) {
      setSelectedConversation(null);
    }
  }, [deleteConversation, selectedConversation]);

  const handleClearAll = useCallback(() => {
    clearHistory();
    setShowConfirmClear(false);
    setSelectedConversation(null);
  }, [clearHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md h-[80vh] max-h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-lg">Historial de Chat</h2>
            <p className="text-xs text-purple-200">
              {stats.totalConversations} conversaciones - {stats.totalMessages} mensajes
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {selectedConversation ? (
          <MessageDetail conversation={selectedConversation} onBack={handleBack} />
        ) : (
          <>
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar en conversaciones..."
              />
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                  <svg className="w-16 h-16 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium">No hay conversaciones</p>
                  <p className="text-xs">Las conversaciones con NPCs apareceran aqui</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <ConversationCard
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedConversation?.id === conv.id}
                    onSelect={() => handleSelectConversation(conv)}
                    onDelete={() => handleDelete(conv.id)}
                  />
                ))
              )}
            </div>

            {/* Footer with clear button */}
            {conversations.length > 0 && (
              <div className="p-3 border-t border-gray-100">
                {showConfirmClear ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-600">Eliminar todo el historial?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirmClear(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="w-full text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 py-2 rounded-xl transition-colors"
                  >
                    Limpiar historial
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
