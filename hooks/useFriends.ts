/**
 * Friends Hook
 * Manages friend requests, friendships, and following friends in the game
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  getFriends,
  removeFriend,
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked,
  subscribeFriendRequests,
  subscribeFriendships,
  unsubscribeFriends,
  searchUsers,
  type FriendRequest,
  type Friendship,
  type BlockedUser,
  type FriendProfile,
} from '../lib/friends';

// Get remote players from multiplayer system V2
import { useMultiplayerV2 } from './useMultiplayerV2';

// ============================================
// Types
// ============================================

export interface FriendWithStatus extends Friendship {
  username?: string;
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

export interface FriendRequestWithUsername extends FriendRequest {
  senderUsername?: string;
  receiverUsername?: string;
}

// ============================================
// Main Friends Hook
// ============================================

export const useFriends = (userId: string) => {
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestWithUsername[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestWithUsername[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingFriendId, setFollowingFriendId] = useState<string | null>(null);

  const { remotePlayers } = useMultiplayerV2();
  const isInitialized = useRef(false);

  // ============================================
  // Load Data
  // ============================================

  const loadFriends = useCallback(async () => {
    const { friends: friendsList, error } = await getFriends(userId);
    if (!error && friendsList) {
      // Enhance with online status from remote players
      const friendsWithStatus = friendsList.map((friend) => {
        const remotePlayer = remotePlayers.find(
          (p) => p.odIduserId === friend.friend_id
        );
        return {
          ...friend,
          isOnline: !!remotePlayer,
          position: remotePlayer?.position,
          character: remotePlayer?.character,
          username: remotePlayer?.username,
        };
      });
      setFriends(friendsWithStatus);
    }
  }, [userId, remotePlayers]);

  const loadIncomingRequests = useCallback(async () => {
    const { requests, error } = await getIncomingRequests(userId);
    if (!error && requests) {
      setIncomingRequests(requests);
    }
  }, [userId]);

  const loadOutgoingRequests = useCallback(async () => {
    const { requests, error } = await getOutgoingRequests(userId);
    if (!error && requests) {
      setOutgoingRequests(requests);
    }
  }, [userId]);

  const loadBlockedUsers = useCallback(async () => {
    const { blocked, error } = await getBlockedUsers(userId);
    if (!error && blocked) {
      setBlockedUsers(blocked);
    }
  }, [userId]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadFriends(),
      loadIncomingRequests(),
      loadOutgoingRequests(),
      loadBlockedUsers(),
    ]);
    setIsLoading(false);
  }, [loadFriends, loadIncomingRequests, loadOutgoingRequests, loadBlockedUsers]);

  // ============================================
  // Initialize and Subscribe
  // ============================================

  useEffect(() => {
    if (!userId || isInitialized.current) return;

    // Initial load
    loadAll();

    // Subscribe to real-time updates
    const requestsChannel = subscribeFriendRequests(
      userId,
      (request) => {
        // New incoming request
        setIncomingRequests((prev) => [request, ...prev]);
      },
      (request) => {
        // Request was accepted/rejected
        setOutgoingRequests((prev) => prev.filter((r) => r.id !== request.id));
        if (request.status === 'accepted') {
          loadFriends(); // Refresh friends list
        }
      }
    );

    const friendshipsChannel = subscribeFriendships(
      userId,
      (friendship) => {
        // New friend added
        loadFriends();
      },
      (friendship) => {
        // Friend removed
        setFriends((prev) => prev.filter((f) => f.friend_id !== friendship.friend_id));
        // Stop following if this was the followed friend
        if (followingFriendId === friendship.friend_id) {
          setFollowingFriendId(null);
        }
      }
    );

    isInitialized.current = true;

    return () => {
      unsubscribeFriends();
    };
  }, [userId, loadAll, loadFriends, followingFriendId]);

  // Update online status when remote players change
  useEffect(() => {
    if (friends.length > 0) {
      const updatedFriends = friends.map((friend) => {
        const remotePlayer = remotePlayers.find(
          (p) => p.odIduserId === friend.friend_id
        );
        return {
          ...friend,
          isOnline: !!remotePlayer,
          position: remotePlayer?.position,
          character: remotePlayer?.character,
          username: remotePlayer?.username || friend.username,
        };
      });
      setFriends(updatedFriends);
    }
  }, [remotePlayers]);

  // ============================================
  // Friend Request Actions
  // ============================================

  const sendRequest = useCallback(
    async (receiverId: string) => {
      const result = await sendFriendRequest(userId, receiverId);
      if (result.success) {
        await loadOutgoingRequests();
      }
      return result;
    },
    [userId, loadOutgoingRequests]
  );

  const acceptRequest = useCallback(
    async (requestId: string, senderId: string) => {
      const result = await acceptFriendRequest(requestId, userId, senderId);
      if (result.success) {
        await loadIncomingRequests();
        await loadFriends();
      }
      return result;
    },
    [userId, loadIncomingRequests, loadFriends]
  );

  const rejectRequest = useCallback(
    async (requestId: string) => {
      const result = await rejectFriendRequest(requestId);
      if (result.success) {
        await loadIncomingRequests();
      }
      return result;
    },
    [loadIncomingRequests]
  );

  const cancelRequest = useCallback(
    async (requestId: string) => {
      const result = await cancelFriendRequest(requestId);
      if (result.success) {
        await loadOutgoingRequests();
      }
      return result;
    },
    [loadOutgoingRequests]
  );

  // ============================================
  // Friendship Actions
  // ============================================

  const unfriend = useCallback(
    async (friendId: string) => {
      const result = await removeFriend(userId, friendId);
      if (result.success) {
        setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
        // Stop following if this was the followed friend
        if (followingFriendId === friendId) {
          setFollowingFriendId(null);
        }
      }
      return result;
    },
    [userId, followingFriendId]
  );

  const block = useCallback(
    async (blockedUserId: string) => {
      const result = await blockUser(userId, blockedUserId);
      if (result.success) {
        await loadBlockedUsers();
        await loadFriends();
        // Stop following if this was the followed friend
        if (followingFriendId === blockedUserId) {
          setFollowingFriendId(null);
        }
      }
      return result;
    },
    [userId, loadBlockedUsers, loadFriends, followingFriendId]
  );

  const unblock = useCallback(
    async (blockedUserId: string) => {
      const result = await unblockUser(userId, blockedUserId);
      if (result.success) {
        await loadBlockedUsers();
      }
      return result;
    },
    [userId, loadBlockedUsers]
  );

  const checkBlocked = useCallback(
    async (checkUserId: string) => {
      return await isUserBlocked(userId, checkUserId);
    },
    [userId]
  );

  // ============================================
  // Search Users
  // ============================================

  const searchForUsers = useCallback(
    async (query: string) => {
      return await searchUsers(query, userId);
    },
    [userId]
  );

  // ============================================
  // Follow Friend
  // ============================================

  const followFriend = useCallback((friendId: string | null) => {
    setFollowingFriendId(friendId);
  }, []);

  const getFollowedFriendPosition = useCallback((): [number, number, number] | null => {
    if (!followingFriendId) return null;

    const friend = friends.find((f) => f.friend_id === followingFriendId);
    return friend?.position || null;
  }, [followingFriendId, friends]);

  // ============================================
  // Return API
  // ============================================

  return {
    // Data
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,
    isLoading,

    // Friend Requests
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,

    // Friendships
    unfriend,
    block,
    unblock,
    checkBlocked,

    // Search
    searchForUsers,

    // Following
    followingFriendId,
    followFriend,
    getFollowedFriendPosition,

    // Refresh
    refresh: loadAll,
  };
};

export default useFriends;
