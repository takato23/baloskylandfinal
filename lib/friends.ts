/**
 * Friends System
 * Handles friend requests, friendships, and blocking for Cozy City Explorer
 */

import { supabase, isSupabaseConfigured, isTableAvailable, markTableMissing, isMissingTableError, PlayerPresence } from './supabase';
import type { Database } from './database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Type-safe table helpers (to handle Supabase typing issues with new tables)
type FriendRequestsTable = Database['public']['Tables']['friend_requests'];
type FriendshipsTable = Database['public']['Tables']['friendships'];
type BlockedUsersTable = Database['public']['Tables']['blocked_users'];

// Helper to get typed table reference
const getFriendRequestsTable = () => supabase.from('friend_requests') as any;
const getFriendshipsTable = () => supabase.from('friendships') as any;
const getBlockedUsersTable = () => supabase.from('blocked_users') as any;

// ============================================
// Types
// ============================================

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  user_id: string;
  blocked_user_id: string;
  created_at: string;
}

export interface FriendProfile {
  userId: string;
  username: string;
  isOnline: boolean;
  position?: [number, number, number];
  character?: {
    type: string;
    skin: string;
    shirt: string;
    pants: string;
    accessory: string;
  };
}

// ============================================
// Friend Requests
// ============================================

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (
  senderId: string,
  receiverId: string
): Promise<{ success: boolean; error?: string; request?: FriendRequest }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  if (senderId === receiverId) {
    return { success: false, error: 'Cannot send friend request to yourself' };
  }

  try {
    // Check if already friends
    const { data: existingFriendship } = await getFriendshipsTable()
      .select('id')
      .or(`user_id.eq.${senderId},user_id.eq.${receiverId}`)
      .or(`friend_id.eq.${senderId},friend_id.eq.${receiverId}`)
      .maybeSingle();

    if (existingFriendship) {
      return { success: false, error: 'Already friends' };
    }

    // Check if user is blocked
    const { data: blocked } = await getBlockedUsersTable()
      .select('id')
      .or(
        `and(user_id.eq.${senderId},blocked_user_id.eq.${receiverId}),and(user_id.eq.${receiverId},blocked_user_id.eq.${senderId})`
      )
      .maybeSingle();

    if (blocked) {
      return { success: false, error: 'Cannot send request' };
    }

    // Check for existing request
    const { data: existingRequest } = await getFriendRequestsTable()
      .select('*')
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .maybeSingle();

    if (existingRequest) {
      // If there's a pending request from the other user, accept it automatically
      if (existingRequest.sender_id === receiverId && existingRequest.status === 'pending') {
        return await acceptFriendRequest(existingRequest.id, receiverId, senderId);
      }
      return { success: false, error: 'Request already exists' };
    }

    // Create new request
    const { data, error } = await getFriendRequestsTable()
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending' as const,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: error.message };
    }

    return { success: true, request: data };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: 'Failed to send request' };
  }
};

/**
 * Accept a friend request and create bidirectional friendship
 */
export const acceptFriendRequest = async (
  requestId: string,
  receiverId: string,
  senderId: string
): Promise<{ success: boolean; error?: string; request?: FriendRequest }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Update request status
    const { data: request, error: updateError } = await getFriendRequestsTable()
      .update({ status: 'accepted' as const })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error accepting friend request:', updateError);
      return { success: false, error: updateError.message };
    }

    // Create bidirectional friendships
    const { error: friendship1Error } = await getFriendshipsTable().insert({
      user_id: receiverId,
      friend_id: senderId,
    });

    const { error: friendship2Error } = await getFriendshipsTable().insert({
      user_id: senderId,
      friend_id: receiverId,
    });

    if (friendship1Error || friendship2Error) {
      console.error('Error creating friendships:', friendship1Error || friendship2Error);
      return { success: false, error: 'Failed to create friendship' };
    }

    return { success: true, request };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: 'Failed to accept request' };
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (
  requestId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await getFriendRequestsTable()
      .update({ status: 'rejected' as const })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting friend request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return { success: false, error: 'Failed to reject request' };
  }
};

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (
  requestId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await getFriendRequestsTable().delete().eq('id', requestId);

    if (error) {
      console.error('Error canceling friend request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error canceling friend request:', error);
    return { success: false, error: 'Failed to cancel request' };
  }
};

/**
 * Get incoming friend requests
 */
export const getIncomingRequests = async (
  userId: string
): Promise<{ requests: FriendRequest[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { requests: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await getFriendRequestsTable()
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incoming requests:', error);
      return { requests: [], error: error.message };
    }

    return { requests: data || [] };
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    return { requests: [], error: 'Failed to fetch requests' };
  }
};

/**
 * Get outgoing friend requests
 */
export const getOutgoingRequests = async (
  userId: string
): Promise<{ requests: FriendRequest[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { requests: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await getFriendRequestsTable()
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outgoing requests:', error);
      return { requests: [], error: error.message };
    }

    return { requests: data || [] };
  } catch (error) {
    console.error('Error fetching outgoing requests:', error);
    return { requests: [], error: 'Failed to fetch requests' };
  }
};

// ============================================
// Friendships
// ============================================

/**
 * Get list of friends
 */
export const getFriends = async (
  userId: string
): Promise<{ friends: Friendship[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { friends: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await getFriendshipsTable()
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching friends:', error);
      return { friends: [], error: error.message };
    }

    return { friends: data || [] };
  } catch (error) {
    console.error('Error fetching friends:', error);
    return { friends: [], error: 'Failed to fetch friends' };
  }
};

/**
 * Remove a friend (deletes both directions)
 */
export const removeFriend = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Delete both directions
    const { error: error1 } = await getFriendshipsTable()
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', friendId);

    const { error: error2 } = await getFriendshipsTable()
      .delete()
      .eq('user_id', friendId)
      .eq('friend_id', userId);

    if (error1 || error2) {
      console.error('Error removing friend:', error1 || error2);
      return { success: false, error: 'Failed to remove friend' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: 'Failed to remove friend' };
  }
};

// ============================================
// Blocking
// ============================================

/**
 * Block a user
 */
export const blockUser = async (
  userId: string,
  blockedUserId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  if (userId === blockedUserId) {
    return { success: false, error: 'Cannot block yourself' };
  }

  try {
    // Remove friendship if exists
    await removeFriend(userId, blockedUserId);

    // Delete any pending requests
    await getFriendRequestsTable()
      .delete()
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${blockedUserId}),and(sender_id.eq.${blockedUserId},receiver_id.eq.${userId})`
      );

    // Add to blocked list
    const { error } = await getBlockedUsersTable().insert({
      user_id: userId,
      blocked_user_id: blockedUserId,
    });

    if (error) {
      console.error('Error blocking user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: 'Failed to block user' };
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (
  userId: string,
  blockedUserId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await getBlockedUsersTable()
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId);

    if (error) {
      console.error('Error unblocking user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { success: false, error: 'Failed to unblock user' };
  }
};

/**
 * Get list of blocked users
 */
export const getBlockedUsers = async (
  userId: string
): Promise<{ blocked: BlockedUser[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { blocked: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await getBlockedUsersTable()
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocked users:', error);
      return { blocked: [], error: error.message };
    }

    return { blocked: data || [] };
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return { blocked: [], error: 'Failed to fetch blocked users' };
  }
};

/**
 * Check if a user is blocked
 */
export const isUserBlocked = async (
  userId: string,
  checkUserId: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const { data } = await getBlockedUsersTable()
      .select('id')
      .or(
        `and(user_id.eq.${userId},blocked_user_id.eq.${checkUserId}),and(user_id.eq.${checkUserId},blocked_user_id.eq.${userId})`
      )
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
};

// ============================================
// Real-time Subscriptions
// ============================================

let friendRequestsChannel: RealtimeChannel | null = null;
let friendshipsChannel: RealtimeChannel | null = null;

/**
 * Subscribe to friend request changes
 */
export const subscribeFriendRequests = (
  userId: string,
  onRequest: (request: FriendRequest) => void,
  onUpdate: (request: FriendRequest) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured()) return null;

  friendRequestsChannel = supabase
    .channel('friend_requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friend_requests',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        onRequest(payload.new as FriendRequest);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friend_requests',
        filter: `sender_id=eq.${userId}`,
      },
      (payload) => {
        onUpdate(payload.new as FriendRequest);
      }
    )
    .subscribe();

  return friendRequestsChannel;
};

/**
 * Subscribe to friendship changes
 */
export const subscribeFriendships = (
  userId: string,
  onFriendAdded: (friendship: Friendship) => void,
  onFriendRemoved: (friendship: Friendship) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured()) return null;

  friendshipsChannel = supabase
    .channel('friendships')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onFriendAdded(payload.new as Friendship);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'friendships',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onFriendRemoved(payload.old as Friendship);
      }
    )
    .subscribe();

  return friendshipsChannel;
};

/**
 * Unsubscribe from friend updates
 */
export const unsubscribeFriends = async () => {
  if (friendRequestsChannel) {
    await friendRequestsChannel.unsubscribe();
    friendRequestsChannel = null;
  }
  if (friendshipsChannel) {
    await friendshipsChannel.unsubscribe();
    friendshipsChannel = null;
  }
};

// ============================================
// Search
// ============================================

/**
 * Search for users by username (for adding friends)
 * This searches the player_profiles table
 */
export const searchUsers = async (
  query: string,
  currentUserId: string,
  limit: number = 20
): Promise<{ users: Array<{ id: string; username: string }>; error?: string }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('player_profiles')) {
    return { users: [] };
  }

  if (query.trim().length < 2) {
    return { users: [] };
  }

  try {
    // Search player_profiles by username
    const { data, error } = await supabase
      .from('player_profiles')
      .select('id, username')
      .ilike('username', `%${query}%`)
      .neq('id', currentUserId)
      .limit(limit);

    if (error) {
      if (isMissingTableError(error)) {
        markTableMissing('player_profiles');
        return { users: [] };
      }
      console.error('Error searching users:', error);
      return { users: [], error: error.message };
    }

    return { users: data || [] };
  } catch (error) {
    console.error('Error searching users:', error);
    return { users: [], error: 'Failed to search users' };
  }
};
