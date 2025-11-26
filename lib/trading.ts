/**
 * Trading System
 * Real-time P2P trading between players with anti-scam protection
 */

import { supabase, isSupabaseConfigured, isTableAvailable, markTableMissing, isMissingTableError } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Trade, TradeItem, TradeRequest, TradeStatus } from '../types/game';

// ============================================
// Constants
// ============================================

const TRADE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const TRADE_CHANNEL_PREFIX = 'trade:';

// ============================================
// Types
// ============================================

export interface TradeBroadcast {
  type: 'trade_request' | 'trade_accepted' | 'trade_rejected' | 'trade_update' | 'trade_confirm' | 'trade_cancel' | 'trade_complete';
  payload: Trade | TradeRequest;
  fromUserId: string;
  toUserId: string;
}

// ============================================
// Channel Management
// ============================================

let tradeChannel: RealtimeChannel | null = null;

/**
 * Initialize trading channel for a user
 */
export const initializeTrading = (
  userId: string,
  onTradeBroadcast: (broadcast: TradeBroadcast) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Trading features disabled.');
    return null;
  }

  const channelName = `${TRADE_CHANNEL_PREFIX}${userId}`;
  tradeChannel = supabase.channel(channelName);

  tradeChannel
    .on('broadcast', { event: 'trade' }, ({ payload }) => {
      onTradeBroadcast(payload as TradeBroadcast);
    })
    .subscribe();

  return tradeChannel;
};

/**
 * Send trade broadcast to another user
 */
export const sendTradeBroadcast = async (
  targetUserId: string,
  broadcast: TradeBroadcast
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const targetChannel = supabase.channel(`${TRADE_CHANNEL_PREFIX}${targetUserId}`);

    await targetChannel.subscribe();
    await targetChannel.send({
      type: 'broadcast',
      event: 'trade',
      payload: broadcast,
    });
    await targetChannel.unsubscribe();

    return { success: true };
  } catch (error) {
    console.error('Error sending trade broadcast:', error);
    return { success: false, error: 'Failed to send trade broadcast' };
  }
};

/**
 * Leave trading channel
 */
export const leaveTrading = async () => {
  if (tradeChannel) {
    await tradeChannel.unsubscribe();
    tradeChannel = null;
  }
};

// ============================================
// Trade Requests
// ============================================

/**
 * Send a trade request to another player
 */
export const sendTradeRequest = async (
  fromUserId: string,
  fromUsername: string,
  toUserId: string,
  toUsername: string
): Promise<{ success: boolean; error?: string; request?: TradeRequest }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  if (fromUserId === toUserId) {
    return { success: false, error: 'Cannot trade with yourself' };
  }

  const request: TradeRequest = {
    id: `trade_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fromUserId,
    fromUsername,
    toUserId,
    toUsername,
    status: 'pending',
    createdAt: Date.now(),
  };

  // Send broadcast to target user
  const result = await sendTradeBroadcast(toUserId, {
    type: 'trade_request',
    payload: request,
    fromUserId,
    toUserId,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, request };
};

/**
 * Accept a trade request and create trade session
 */
export const acceptTradeRequest = async (
  request: TradeRequest
): Promise<{ success: boolean; error?: string; trade?: Trade }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  const trade: Trade = {
    id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    initiatorId: request.fromUserId,
    initiatorUsername: request.fromUsername,
    receiverId: request.toUserId,
    receiverUsername: request.toUsername,
    initiatorItems: [],
    receiverItems: [],
    initiatorConfirmed: false,
    receiverConfirmed: false,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + TRADE_EXPIRY_MS,
  };

  // Notify both parties
  await sendTradeBroadcast(request.fromUserId, {
    type: 'trade_accepted',
    payload: trade,
    fromUserId: request.toUserId,
    toUserId: request.fromUserId,
  });

  return { success: true, trade };
};

/**
 * Reject a trade request
 */
export const rejectTradeRequest = async (
  request: TradeRequest
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  await sendTradeBroadcast(request.fromUserId, {
    type: 'trade_rejected',
    payload: { ...request, status: 'rejected' },
    fromUserId: request.toUserId,
    toUserId: request.fromUserId,
  });

  return { success: true };
};

// ============================================
// Trade Session Management
// ============================================

/**
 * Update items in a trade (add/remove)
 */
export const updateTradeItems = async (
  trade: Trade,
  userId: string,
  items: TradeItem[]
): Promise<{ success: boolean; error?: string; trade?: Trade }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Check if trade is still valid
  if (trade.status !== 'pending') {
    return { success: false, error: 'Trade is no longer active' };
  }

  if (Date.now() > trade.expiresAt) {
    return { success: false, error: 'Trade has expired' };
  }

  // Update trade with new items
  const isInitiator = userId === trade.initiatorId;
  const updatedTrade: Trade = {
    ...trade,
    initiatorItems: isInitiator ? items : trade.initiatorItems,
    receiverItems: !isInitiator ? items : trade.receiverItems,
    // Reset confirmations when items change
    initiatorConfirmed: false,
    receiverConfirmed: false,
  };

  // Notify the other party
  const targetUserId = isInitiator ? trade.receiverId : trade.initiatorId;
  await sendTradeBroadcast(targetUserId, {
    type: 'trade_update',
    payload: updatedTrade,
    fromUserId: userId,
    toUserId: targetUserId,
  });

  return { success: true, trade: updatedTrade };
};

/**
 * Confirm trade (both parties must confirm)
 */
export const confirmTrade = async (
  trade: Trade,
  userId: string
): Promise<{ success: boolean; error?: string; trade?: Trade; completed?: boolean }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  if (trade.status !== 'pending') {
    return { success: false, error: 'Trade is no longer active' };
  }

  if (Date.now() > trade.expiresAt) {
    return { success: false, error: 'Trade has expired' };
  }

  const isInitiator = userId === trade.initiatorId;
  const updatedTrade: Trade = {
    ...trade,
    initiatorConfirmed: isInitiator ? true : trade.initiatorConfirmed,
    receiverConfirmed: !isInitiator ? true : trade.receiverConfirmed,
  };

  // Check if both confirmed
  const bothConfirmed = updatedTrade.initiatorConfirmed && updatedTrade.receiverConfirmed;

  if (bothConfirmed) {
    updatedTrade.status = 'confirmed';
  }

  // Notify the other party
  const targetUserId = isInitiator ? trade.receiverId : trade.initiatorId;
  await sendTradeBroadcast(targetUserId, {
    type: bothConfirmed ? 'trade_complete' : 'trade_confirm',
    payload: updatedTrade,
    fromUserId: userId,
    toUserId: targetUserId,
  });

  // If both confirmed, execute the trade
  if (bothConfirmed) {
    const executeResult = await executeTrade(updatedTrade);
    if (!executeResult.success) {
      return { success: false, error: executeResult.error };
    }
    updatedTrade.status = 'completed';
  }

  return { success: true, trade: updatedTrade, completed: bothConfirmed };
};

/**
 * Cancel an active trade
 */
export const cancelTrade = async (
  trade: Trade,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  if (trade.status !== 'pending' && trade.status !== 'confirmed') {
    return { success: false, error: 'Trade cannot be cancelled' };
  }

  const cancelledTrade: Trade = {
    ...trade,
    status: 'cancelled',
  };

  // Notify the other party
  const targetUserId = userId === trade.initiatorId ? trade.receiverId : trade.initiatorId;
  await sendTradeBroadcast(targetUserId, {
    type: 'trade_cancel',
    payload: cancelledTrade,
    fromUserId: userId,
    toUserId: targetUserId,
  });

  return { success: true };
};

// ============================================
// Trade Execution
// ============================================

/**
 * Execute the trade - transfer items between players
 * This should be done server-side in production for security
 */
export const executeTrade = async (
  trade: Trade
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Transfer coins from initiator to receiver
    const initiatorCoins = trade.initiatorItems
      .filter(item => item.type === 'coins')
      .reduce((sum, item) => sum + item.amount, 0);

    const receiverCoins = trade.receiverItems
      .filter(item => item.type === 'coins')
      .reduce((sum, item) => sum + item.amount, 0);

    // Update initiator's coins (subtract what they give, add what they receive)
    if (initiatorCoins > 0 || receiverCoins > 0) {
      const { error: initiatorError } = await supabase.rpc('update_player_coins_trade', {
        p_user_id: trade.initiatorId,
        p_coins_delta: receiverCoins - initiatorCoins,
      });

      if (initiatorError) {
        console.error('Error updating initiator coins:', initiatorError);
        return { success: false, error: 'Failed to transfer coins' };
      }

      const { error: receiverError } = await supabase.rpc('update_player_coins_trade', {
        p_user_id: trade.receiverId,
        p_coins_delta: initiatorCoins - receiverCoins,
      });

      if (receiverError) {
        console.error('Error updating receiver coins:', receiverError);
        return { success: false, error: 'Failed to transfer coins' };
      }
    }

    // Transfer skins
    const initiatorSkins = trade.initiatorItems.filter(item => item.type === 'skin');
    const receiverSkins = trade.receiverItems.filter(item => item.type === 'skin');

    for (const skin of initiatorSkins) {
      // Remove from initiator
      await supabase
        .from('user_skins')
        .delete()
        .eq('user_id', trade.initiatorId)
        .eq('skin_id', skin.itemId);

      // Add to receiver
      await supabase.from('user_skins').insert({
        user_id: trade.receiverId,
        skin_id: skin.itemId,
        purchased_at: new Date().toISOString(),
      });
    }

    for (const skin of receiverSkins) {
      // Remove from receiver
      await supabase
        .from('user_skins')
        .delete()
        .eq('user_id', trade.receiverId)
        .eq('skin_id', skin.itemId);

      // Add to initiator
      await supabase.from('user_skins').insert({
        user_id: trade.initiatorId,
        skin_id: skin.itemId,
        purchased_at: new Date().toISOString(),
      });
    }

    // Record trade in history
    await supabase.from('trade_history').insert({
      id: trade.id,
      initiator_id: trade.initiatorId,
      receiver_id: trade.receiverId,
      initiator_items: JSON.stringify(trade.initiatorItems),
      receiver_items: JSON.stringify(trade.receiverItems),
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error executing trade:', error);
    return { success: false, error: 'Failed to execute trade' };
  }
};

// ============================================
// Trade History
// ============================================

export interface TradeHistoryEntry {
  id: string;
  initiatorId: string;
  receiverId: string;
  initiatorItems: TradeItem[];
  receiverItems: TradeItem[];
  status: TradeStatus;
  completedAt: string;
}

/**
 * Get trade history for a user
 */
export const getTradeHistory = async (
  userId: string,
  limit: number = 50
): Promise<{ trades: TradeHistoryEntry[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { trades: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('trade_history')
      .select('*')
      .or(`initiator_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trade history:', error);
      return { trades: [], error: error.message };
    }

    const trades: TradeHistoryEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      initiatorId: row.initiator_id,
      receiverId: row.receiver_id,
      initiatorItems: JSON.parse(row.initiator_items || '[]'),
      receiverItems: JSON.parse(row.receiver_items || '[]'),
      status: row.status,
      completedAt: row.completed_at,
    }));

    return { trades };
  } catch (error) {
    console.error('Error fetching trade history:', error);
    return { trades: [], error: 'Failed to fetch trade history' };
  }
};

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate that a user has the items they want to trade
 */
export const validateTradeItems = async (
  userId: string,
  items: TradeItem[]
): Promise<{ valid: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('player_profiles') || !isTableAvailable('user_skins')) {
    return { valid: false, error: 'Database not available' };
  }

  try {
    // Check coins
    const totalCoins = items
      .filter(item => item.type === 'coins')
      .reduce((sum, item) => sum + item.amount, 0);

    if (totalCoins > 0) {
      const { data: profile, error: profileError } = await supabase
        .from('player_profiles')
        .select('coins')
        .eq('id', userId)
        .single();

      if (profileError && isMissingTableError(profileError)) {
        markTableMissing('player_profiles');
        return { valid: false, error: 'Database not available' };
      }

      if (!profile || profile.coins < totalCoins) {
        return { valid: false, error: 'Insufficient coins' };
      }
    }

    // Check skins
    const skinIds = items
      .filter(item => item.type === 'skin')
      .map(item => item.itemId);

    if (skinIds.length > 0) {
      const { data: ownedSkins, error: skinsError } = await supabase
        .from('user_skins')
        .select('skin_id')
        .eq('user_id', userId)
        .in('skin_id', skinIds);

      if (skinsError && isMissingTableError(skinsError)) {
        markTableMissing('user_skins');
        return { valid: false, error: 'Database not available' };
      }

      const ownedSkinIds = new Set((ownedSkins || []).map((s: any) => s.skin_id));
      const missingSkins = skinIds.filter(id => !ownedSkinIds.has(id));

      if (missingSkins.length > 0) {
        return { valid: false, error: 'You do not own some of these skins' };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating trade items:', error);
    return { valid: false, error: 'Validation failed' };
  }
};
