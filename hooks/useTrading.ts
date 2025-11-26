/**
 * Trading Hook
 * React hook for P2P trading between players
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeTrading,
  leaveTrading,
  sendTradeRequest,
  acceptTradeRequest,
  rejectTradeRequest,
  updateTradeItems,
  confirmTrade,
  cancelTrade,
  validateTradeItems,
  getTradeHistory,
  type TradeBroadcast,
  type TradeHistoryEntry,
} from '../lib/trading';
import type { Trade, TradeRequest, TradeItem } from '../types/game';

// ============================================
// Types
// ============================================

export interface UseTradingReturn {
  // State
  isConnected: boolean;
  pendingRequests: TradeRequest[];
  outgoingRequests: TradeRequest[];
  activeTrade: Trade | null;
  tradeHistory: TradeHistoryEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  sendRequest: (targetUserId: string, targetUsername: string) => Promise<boolean>;
  acceptRequest: (request: TradeRequest) => Promise<boolean>;
  rejectRequest: (request: TradeRequest) => Promise<boolean>;
  updateItems: (items: TradeItem[]) => Promise<boolean>;
  confirm: () => Promise<boolean>;
  cancel: () => Promise<boolean>;
  validateItems: (items: TradeItem[]) => Promise<{ valid: boolean; error?: string }>;
  loadHistory: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export const useTrading = (userId: string, username: string): UseTradingReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<TradeRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<TradeRequest[]>([]);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof initializeTrading>>(null);

  // Handle incoming broadcasts
  const handleBroadcast = useCallback((broadcast: TradeBroadcast) => {
    switch (broadcast.type) {
      case 'trade_request':
        const request = broadcast.payload as TradeRequest;
        if (request.toUserId === userId) {
          setPendingRequests(prev => [...prev, request]);
        }
        break;

      case 'trade_accepted':
        const acceptedTrade = broadcast.payload as Trade;
        setActiveTrade(acceptedTrade);
        setOutgoingRequests(prev =>
          prev.filter(r => r.toUserId !== broadcast.fromUserId)
        );
        break;

      case 'trade_rejected':
        const rejectedRequest = broadcast.payload as TradeRequest;
        setOutgoingRequests(prev =>
          prev.filter(r => r.id !== rejectedRequest.id)
        );
        break;

      case 'trade_update':
        const updatedTrade = broadcast.payload as Trade;
        setActiveTrade(updatedTrade);
        break;

      case 'trade_confirm':
        const confirmedTrade = broadcast.payload as Trade;
        setActiveTrade(confirmedTrade);
        break;

      case 'trade_complete':
        const completedTrade = broadcast.payload as Trade;
        setActiveTrade(null);
        // Add to history
        setTradeHistory(prev => [{
          id: completedTrade.id,
          initiatorId: completedTrade.initiatorId,
          receiverId: completedTrade.receiverId,
          initiatorItems: completedTrade.initiatorItems,
          receiverItems: completedTrade.receiverItems,
          status: 'completed',
          completedAt: new Date().toISOString(),
        }, ...prev]);
        break;

      case 'trade_cancel':
        setActiveTrade(null);
        break;
    }
  }, [userId]);

  // Initialize trading channel
  useEffect(() => {
    if (!userId) return;

    channelRef.current = initializeTrading(userId, handleBroadcast);
    setIsConnected(!!channelRef.current);

    return () => {
      leaveTrading();
      setIsConnected(false);
    };
  }, [userId, handleBroadcast]);

  // Send trade request
  const sendRequest = useCallback(async (
    targetUserId: string,
    targetUsername: string
  ): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await sendTradeRequest(userId, username, targetUserId, targetUsername);

      if (!result.success) {
        setError(result.error || 'Failed to send request');
        return false;
      }

      if (result.request) {
        setOutgoingRequests(prev => [...prev, result.request!]);
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [userId, username]);

  // Accept trade request
  const acceptRequest = useCallback(async (request: TradeRequest): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await acceptTradeRequest(request);

      if (!result.success) {
        setError(result.error || 'Failed to accept request');
        return false;
      }

      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      if (result.trade) {
        setActiveTrade(result.trade);
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reject trade request
  const rejectRequest = useCallback(async (request: TradeRequest): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await rejectTradeRequest(request);

      if (!result.success) {
        setError(result.error || 'Failed to reject request');
        return false;
      }

      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update trade items
  const updateItems = useCallback(async (items: TradeItem[]): Promise<boolean> => {
    if (!activeTrade) {
      setError('No active trade');
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await updateTradeItems(activeTrade, userId, items);

      if (!result.success) {
        setError(result.error || 'Failed to update items');
        return false;
      }

      if (result.trade) {
        setActiveTrade(result.trade);
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [activeTrade, userId]);

  // Confirm trade
  const confirm = useCallback(async (): Promise<boolean> => {
    if (!activeTrade) {
      setError('No active trade');
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await confirmTrade(activeTrade, userId);

      if (!result.success) {
        setError(result.error || 'Failed to confirm trade');
        return false;
      }

      if (result.completed) {
        setActiveTrade(null);
      } else if (result.trade) {
        setActiveTrade(result.trade);
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [activeTrade, userId]);

  // Cancel trade
  const cancel = useCallback(async (): Promise<boolean> => {
    if (!activeTrade) {
      setError('No active trade');
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await cancelTrade(activeTrade, userId);

      if (!result.success) {
        setError(result.error || 'Failed to cancel trade');
        return false;
      }

      setActiveTrade(null);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [activeTrade, userId]);

  // Validate items
  const validateItems = useCallback(async (
    items: TradeItem[]
  ): Promise<{ valid: boolean; error?: string }> => {
    return await validateTradeItems(userId, items);
  }, [userId]);

  // Load trade history
  const loadHistory = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getTradeHistory(userId);

      if (result.error) {
        setError(result.error);
      } else {
        setTradeHistory(result.trades);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    pendingRequests,
    outgoingRequests,
    activeTrade,
    tradeHistory,
    isLoading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    updateItems,
    confirm,
    cancel,
    validateItems,
    loadHistory,
    clearError,
  };
};

export default useTrading;
