/**
 * Chat History Hook
 * Manages persistent chat history with local storage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChatMessage, NpcConfig } from '../types';

// ============================================
// Configuration
// ============================================

const STORAGE_KEY = 'cozy_city_chat_history';
const MAX_CONVERSATIONS = 10;
const MAX_MESSAGES_PER_CONVERSATION = 50;
const HISTORY_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================
// Types
// ============================================

export interface ChatConversation {
  id: string;
  npcName: string;
  npcVoice: string;
  messages: ChatMessage[];
  startedAt: number;
  lastMessageAt: number;
}

interface ChatHistoryData {
  conversations: ChatConversation[];
  lastUpdated: number;
}

// ============================================
// Utility Functions
// ============================================

const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const loadFromStorage = (): ChatHistoryData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed: ChatHistoryData = JSON.parse(data);

    // Filter expired conversations
    const now = Date.now();
    parsed.conversations = parsed.conversations.filter(
      (conv) => now - conv.lastMessageAt < HISTORY_EXPIRY_MS
    );

    return parsed;
  } catch (error) {
    console.warn('[ChatHistory] Failed to load from storage:', error);
    return null;
  }
};

const saveToStorage = (data: ChatHistoryData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[ChatHistory] Failed to save to storage:', error);
  }
};

// ============================================
// Hook Implementation
// ============================================

export function useChatHistory() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from storage on mount
  useEffect(() => {
    const data = loadFromStorage();
    if (data) {
      setConversations(data.conversations);
    }
    setIsLoaded(true);
  }, []);

  // Save to storage whenever conversations change
  useEffect(() => {
    if (!isLoaded) return;

    saveToStorage({
      conversations,
      lastUpdated: Date.now(),
    });
  }, [conversations, isLoaded]);

  // Start a new conversation
  const startConversation = useCallback((npc: NpcConfig): string => {
    const id = generateConversationId();

    const newConversation: ChatConversation = {
      id,
      npcName: npc.name,
      npcVoice: npc.voiceName,
      messages: [],
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
    };

    setConversations((prev) => {
      // Keep only the latest conversations
      const updated = [newConversation, ...prev].slice(0, MAX_CONVERSATIONS);
      return updated;
    });

    setCurrentConversationId(id);
    return id;
  }, []);

  // Add message to current conversation
  const addMessage = useCallback((message: ChatMessage) => {
    if (!currentConversationId) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== currentConversationId) return conv;

        const updatedMessages = [...conv.messages, message].slice(-MAX_MESSAGES_PER_CONVERSATION);

        return {
          ...conv,
          messages: updatedMessages,
          lastMessageAt: Date.now(),
        };
      })
    );
  }, [currentConversationId]);

  // Add multiple messages at once (for syncing from store)
  const syncMessages = useCallback((messages: ChatMessage[]) => {
    if (!currentConversationId) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== currentConversationId) return conv;

        // Merge messages by id to avoid duplicates
        const existingIds = new Set(conv.messages.map((m) => m.id));
        const newMessages = messages.filter((m) => !existingIds.has(m.id));

        if (newMessages.length === 0) return conv;

        const updatedMessages = [...conv.messages, ...newMessages]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-MAX_MESSAGES_PER_CONVERSATION);

        return {
          ...conv,
          messages: updatedMessages,
          lastMessageAt: Date.now(),
        };
      })
    );
  }, [currentConversationId]);

  // End current conversation
  const endConversation = useCallback(() => {
    setCurrentConversationId(null);
  }, []);

  // Get conversation by ID
  const getConversation = useCallback(
    (id: string): ChatConversation | undefined => {
      return conversations.find((conv) => conv.id === id);
    },
    [conversations]
  );

  // Get current conversation
  const currentConversation = useMemo(() => {
    if (!currentConversationId) return null;
    return conversations.find((conv) => conv.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  // Delete a conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setConversations([]);
    setCurrentConversationId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Search messages across all conversations
  const searchMessages = useCallback(
    (query: string): { conversation: ChatConversation; message: ChatMessage }[] => {
      if (!query.trim()) return [];

      const lowerQuery = query.toLowerCase();
      const results: { conversation: ChatConversation; message: ChatMessage }[] = [];

      for (const conv of conversations) {
        for (const msg of conv.messages) {
          if (msg.text.toLowerCase().includes(lowerQuery)) {
            results.push({ conversation: conv, message: msg });
          }
        }
      }

      return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
    },
    [conversations]
  );

  // Get conversations with a specific NPC
  const getConversationsWithNpc = useCallback(
    (npcName: string): ChatConversation[] => {
      return conversations.filter((conv) => conv.npcName === npcName);
    },
    [conversations]
  );

  // Statistics
  const stats = useMemo(() => {
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const uniqueNpcs = new Set(conversations.map((conv) => conv.npcName)).size;

    return {
      totalConversations: conversations.length,
      totalMessages,
      uniqueNpcs,
      oldestConversation: conversations.length > 0
        ? Math.min(...conversations.map((conv) => conv.startedAt))
        : null,
    };
  }, [conversations]);

  return {
    // State
    conversations,
    currentConversation,
    currentConversationId,
    isLoaded,
    stats,

    // Actions
    startConversation,
    addMessage,
    syncMessages,
    endConversation,
    getConversation,
    deleteConversation,
    clearHistory,
    searchMessages,
    getConversationsWithNpc,
  };
}

export default useChatHistory;
