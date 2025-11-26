/**
 * Guild Hook
 * React hook for guild/clan management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeGuildChannel,
  leaveGuildChannel,
  createGuild,
  getGuild,
  getUserGuild,
  getGuildMembers,
  searchGuilds,
  getGuildLeaderboard,
  sendGuildInvite,
  getGuildInvites,
  acceptGuildInvite,
  rejectGuildInvite,
  leaveGuild,
  kickMember,
  promoteMember,
  demoteMember,
  contributeToTreasury,
  sendGuildMessage,
  getGuildChatHistory,
  disbandGuild,
  type GuildBroadcast,
} from '../lib/guilds';
import type { Guild, GuildMember, GuildInvite, GuildChatMessage } from '../types/game';

// ============================================
// Types
// ============================================

export interface UseGuildReturn {
  // State
  guild: Guild | null;
  membership: GuildMember | null;
  members: GuildMember[];
  invites: GuildInvite[];
  chatMessages: GuildChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Guild Actions
  create: (name: string, tag: string, description?: string, iconColor?: string) => Promise<boolean>;
  leave: () => Promise<boolean>;
  disband: () => Promise<boolean>;
  search: (query: string) => Promise<Guild[]>;
  getLeaderboard: () => Promise<Guild[]>;

  // Member Actions
  invite: (targetUserId: string) => Promise<boolean>;
  acceptInvite: (inviteId: string) => Promise<boolean>;
  rejectInvite: (inviteId: string) => Promise<boolean>;
  kick: (targetUserId: string) => Promise<boolean>;
  promote: (targetUserId: string) => Promise<boolean>;
  demote: (targetUserId: string) => Promise<boolean>;

  // Treasury
  contribute: (amount: number) => Promise<boolean>;

  // Chat
  sendMessage: (text: string) => Promise<boolean>;
  loadChatHistory: () => Promise<void>;

  // Utilities
  loadGuild: () => Promise<void>;
  loadMembers: () => Promise<void>;
  loadInvites: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export const useGuild = (userId: string, username: string): UseGuildReturn => {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [membership, setMembership] = useState<GuildMember | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [invites, setInvites] = useState<GuildInvite[]>([]);
  const [chatMessages, setChatMessages] = useState<GuildChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof initializeGuildChannel>>(null);

  // Handle broadcasts
  const handleBroadcast = useCallback((broadcast: GuildBroadcast) => {
    switch (broadcast.type) {
      case 'chat':
        const message = broadcast.payload as GuildChatMessage;
        setChatMessages(prev => [...prev, message]);
        break;

      case 'member_join':
        const newMember = broadcast.payload as GuildMember;
        setMembers(prev => [...prev, newMember]);
        setGuild(prev => prev ? { ...prev, memberCount: prev.memberCount + 1 } : null);
        break;

      case 'member_leave':
        const leftMember = broadcast.payload as GuildMember;
        setMembers(prev => prev.filter(m => m.userId !== leftMember.userId));
        setGuild(prev => prev ? { ...prev, memberCount: prev.memberCount - 1 } : null);
        break;

      case 'member_promote':
      case 'member_demote':
        const updatedMember = broadcast.payload as GuildMember;
        setMembers(prev =>
          prev.map(m => m.userId === updatedMember.userId ? { ...m, role: updatedMember.role } : m)
        );
        break;

      case 'treasury_update':
        const treasuryData = broadcast.payload as { amount: number; userId: string };
        setGuild(prev => prev ? { ...prev, treasury: prev.treasury + treasuryData.amount } : null);
        setMembers(prev =>
          prev.map(m =>
            m.userId === treasuryData.userId
              ? { ...m, contribution: m.contribution + treasuryData.amount }
              : m
          )
        );
        break;

      case 'guild_update':
        const updatedGuild = broadcast.payload as Guild;
        setGuild(updatedGuild);
        break;
    }
  }, []);

  // Connect to guild channel when guild changes
  useEffect(() => {
    if (guild?.id) {
      channelRef.current = initializeGuildChannel(guild.id, handleBroadcast);
      setIsConnected(!!channelRef.current);
    } else {
      leaveGuildChannel();
      setIsConnected(false);
    }

    return () => {
      leaveGuildChannel();
    };
  }, [guild?.id, handleBroadcast]);

  // Load user's guild on mount
  useEffect(() => {
    if (userId) {
      loadGuild();
      loadInvites();
    }
  }, [userId]);

  // Load guild data
  const loadGuild = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserGuild(userId);

      if (result.error) {
        setError(result.error);
      } else {
        setGuild(result.guild || null);
        setMembership(result.membership || null);

        if (result.guild) {
          await loadMembers();
          await loadChatHistory();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load members
  const loadMembers = useCallback(async () => {
    if (!guild?.id) return;

    const result = await getGuildMembers(guild.id);
    if (!result.error) {
      setMembers(result.members);
    }
  }, [guild?.id]);

  // Load invites
  const loadInvites = useCallback(async () => {
    const result = await getGuildInvites(userId);
    if (!result.error) {
      setInvites(result.invites);
    }
  }, [userId]);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!guild?.id) return;

    const result = await getGuildChatHistory(guild.id);
    if (!result.error) {
      setChatMessages(result.messages);
    }
  }, [guild?.id]);

  // Create guild
  const create = useCallback(async (
    name: string,
    tag: string,
    description?: string,
    iconColor?: string
  ): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await createGuild(userId, username, name, tag, description, iconColor);

      if (!result.success) {
        setError(result.error || 'Failed to create guild');
        return false;
      }

      if (result.guild) {
        setGuild(result.guild);
        setMembership({
          id: '',
          guildId: result.guild.id,
          userId,
          username,
          role: 'leader',
          contribution: 0,
          joinedAt: Date.now(),
        });
        setMembers([{
          id: '',
          guildId: result.guild.id,
          userId,
          username,
          role: 'leader',
          contribution: 0,
          joinedAt: Date.now(),
        }]);
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [userId, username]);

  // Leave guild
  const leave = useCallback(async (): Promise<boolean> => {
    if (!guild?.id) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await leaveGuild(userId, guild.id);

      if (!result.success) {
        setError(result.error || 'Failed to leave guild');
        return false;
      }

      setGuild(null);
      setMembership(null);
      setMembers([]);
      setChatMessages([]);

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [guild?.id, userId]);

  // Disband guild
  const disband = useCallback(async (): Promise<boolean> => {
    if (!guild?.id) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await disbandGuild(userId, guild.id);

      if (!result.success) {
        setError(result.error || 'Failed to disband guild');
        return false;
      }

      setGuild(null);
      setMembership(null);
      setMembers([]);
      setChatMessages([]);

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [guild?.id, userId]);

  // Search guilds
  const search = useCallback(async (query: string): Promise<Guild[]> => {
    const result = await searchGuilds(query);
    return result.guilds;
  }, []);

  // Get leaderboard
  const getLeaderboard = useCallback(async (): Promise<Guild[]> => {
    const result = await getGuildLeaderboard();
    return result.guilds;
  }, []);

  // Invite player
  const invite = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!guild) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await sendGuildInvite(
        guild.id,
        guild.name,
        guild.tag,
        userId,
        username,
        targetUserId
      );

      if (!result.success) {
        setError(result.error || 'Failed to send invite');
        return false;
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [guild, userId, username]);

  // Accept invite
  const acceptInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await acceptGuildInvite(inviteId, userId, username);

      if (!result.success) {
        setError(result.error || 'Failed to accept invite');
        return false;
      }

      if (result.guild) {
        setGuild(result.guild);
        setMembership({
          id: '',
          guildId: result.guild.id,
          userId,
          username,
          role: 'member',
          contribution: 0,
          joinedAt: Date.now(),
        });
        await loadMembers();
        await loadChatHistory();
      }

      setInvites(prev => prev.filter(i => i.id !== inviteId));

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [userId, username]);

  // Reject invite
  const rejectInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    setError(null);

    const result = await rejectGuildInvite(inviteId, userId);

    if (!result.success) {
      setError(result.error || 'Failed to reject invite');
      return false;
    }

    setInvites(prev => prev.filter(i => i.id !== inviteId));
    return true;
  }, [userId]);

  // Kick member
  const kick = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!guild?.id) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await kickMember(userId, targetUserId, guild.id);

      if (!result.success) {
        setError(result.error || 'Failed to kick member');
        return false;
      }

      setMembers(prev => prev.filter(m => m.userId !== targetUserId));
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [guild?.id, userId]);

  // Promote member
  const promote = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!guild?.id) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await promoteMember(userId, targetUserId, guild.id);

      if (!result.success) {
        setError(result.error || 'Failed to promote member');
        return false;
      }

      setMembers(prev =>
        prev.map(m => m.userId === targetUserId ? { ...m, role: 'officer' } : m)
      );
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [guild?.id, userId]);

  // Demote member
  const demote = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!guild?.id) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await demoteMember(userId, targetUserId, guild.id);

      if (!result.success) {
        setError(result.error || 'Failed to demote member');
        return false;
      }

      setMembers(prev =>
        prev.map(m => m.userId === targetUserId ? { ...m, role: 'member' } : m)
      );
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [guild?.id, userId]);

  // Contribute to treasury
  const contribute = useCallback(async (amount: number): Promise<boolean> => {
    if (!guild?.id) return false;

    setError(null);
    setIsLoading(true);

    try {
      const result = await contributeToTreasury(userId, guild.id, amount);

      if (!result.success) {
        setError(result.error || 'Failed to contribute');
        return false;
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [guild?.id, userId]);

  // Send chat message
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!guild?.id) return false;

    const result = await sendGuildMessage(guild.id, userId, username, text);

    if (!result.success) {
      setError(result.error || 'Failed to send message');
      return false;
    }

    return true;
  }, [guild?.id, userId, username]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    guild,
    membership,
    members,
    invites,
    chatMessages,
    isConnected,
    isLoading,
    error,
    create,
    leave,
    disband,
    search,
    getLeaderboard,
    invite,
    acceptInvite,
    rejectInvite,
    kick,
    promote,
    demote,
    contribute,
    sendMessage,
    loadChatHistory,
    loadGuild,
    loadMembers,
    loadInvites,
    clearError,
  };
};

export default useGuild;
