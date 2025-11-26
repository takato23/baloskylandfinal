/**
 * Guilds/Clans System
 * Guild management with roles, treasury, and real-time chat
 */

import { supabase, isSupabaseConfigured, isTableAvailable, markTableMissing, isMissingTableError } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Guild, GuildMember, GuildInvite, GuildChatMessage, GuildRole } from '../types/game';

// ============================================
// Constants
// ============================================

const MAX_GUILD_MEMBERS = 50;
const GUILD_CHANNEL_PREFIX = 'guild:';
const MIN_GUILD_NAME_LENGTH = 3;
const MAX_GUILD_NAME_LENGTH = 24;
const MIN_TAG_LENGTH = 2;
const MAX_TAG_LENGTH = 5;

// ============================================
// Types
// ============================================

export interface GuildBroadcast {
  type: 'chat' | 'member_join' | 'member_leave' | 'member_promote' | 'member_demote' | 'treasury_update' | 'guild_update';
  payload: GuildChatMessage | GuildMember | Guild | { amount: number; userId: string };
  guildId: string;
}

// ============================================
// Channel Management
// ============================================

let guildChannel: RealtimeChannel | null = null;
let currentGuildId: string | null = null;

/**
 * Initialize guild channel for real-time updates
 */
export const initializeGuildChannel = (
  guildId: string,
  onBroadcast: (broadcast: GuildBroadcast) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Guild features disabled.');
    return null;
  }

  // Leave previous guild channel if any
  if (guildChannel && currentGuildId !== guildId) {
    guildChannel.unsubscribe();
  }

  currentGuildId = guildId;
  guildChannel = supabase.channel(`${GUILD_CHANNEL_PREFIX}${guildId}`);

  guildChannel
    .on('broadcast', { event: 'guild' }, ({ payload }) => {
      onBroadcast(payload as GuildBroadcast);
    })
    .subscribe();

  return guildChannel;
};

/**
 * Send guild broadcast
 */
export const sendGuildBroadcast = async (
  broadcast: GuildBroadcast
): Promise<{ success: boolean; error?: string }> => {
  if (!guildChannel || !currentGuildId) {
    return { success: false, error: 'Not connected to guild channel' };
  }

  try {
    await guildChannel.send({
      type: 'broadcast',
      event: 'guild',
      payload: broadcast,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending guild broadcast:', error);
    return { success: false, error: 'Failed to send broadcast' };
  }
};

/**
 * Leave guild channel
 */
export const leaveGuildChannel = async () => {
  if (guildChannel) {
    await guildChannel.unsubscribe();
    guildChannel = null;
    currentGuildId = null;
  }
};

// ============================================
// Guild CRUD Operations
// ============================================

/**
 * Create a new guild
 */
export const createGuild = async (
  ownerId: string,
  ownerUsername: string,
  name: string,
  tag: string,
  description: string = '',
  iconColor: string = '#6366f1'
): Promise<{ success: boolean; error?: string; guild?: Guild }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Validate name
  if (name.length < MIN_GUILD_NAME_LENGTH || name.length > MAX_GUILD_NAME_LENGTH) {
    return { success: false, error: `Guild name must be ${MIN_GUILD_NAME_LENGTH}-${MAX_GUILD_NAME_LENGTH} characters` };
  }

  // Validate tag
  const cleanTag = tag.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanTag.length < MIN_TAG_LENGTH || cleanTag.length > MAX_TAG_LENGTH) {
    return { success: false, error: `Tag must be ${MIN_TAG_LENGTH}-${MAX_TAG_LENGTH} alphanumeric characters` };
  }

  try {
    // Check if user is already in a guild
    const { data: existingMembership } = await supabase
      .from('guild_members')
      .select('id')
      .eq('user_id', ownerId)
      .maybeSingle();

    if (existingMembership) {
      return { success: false, error: 'You are already in a guild' };
    }

    // Check if guild name or tag exists
    const { data: existingGuild } = await supabase
      .from('guilds')
      .select('id')
      .or(`name.ilike.${name},tag.ilike.${cleanTag}`)
      .maybeSingle();

    if (existingGuild) {
      return { success: false, error: 'Guild name or tag already exists' };
    }

    // Create guild
    const { data: guild, error: guildError } = await supabase
      .from('guilds')
      .insert({
        name,
        tag: cleanTag,
        description,
        owner_id: ownerId,
        owner_username: ownerUsername,
        icon_color: iconColor,
        level: 1,
        experience: 0,
        treasury: 0,
        member_count: 1,
        max_members: MAX_GUILD_MEMBERS,
      })
      .select()
      .single();

    if (guildError) {
      console.error('Error creating guild:', guildError);
      return { success: false, error: guildError.message };
    }

    // Add owner as leader
    const { error: memberError } = await supabase.from('guild_members').insert({
      guild_id: guild.id,
      user_id: ownerId,
      username: ownerUsername,
      role: 'leader',
      contribution: 0,
    });

    if (memberError) {
      // Rollback guild creation
      await supabase.from('guilds').delete().eq('id', guild.id);
      console.error('Error adding owner to guild:', memberError);
      return { success: false, error: 'Failed to create guild' };
    }

    const formattedGuild: Guild = {
      id: guild.id,
      name: guild.name,
      tag: guild.tag,
      description: guild.description,
      ownerId: guild.owner_id,
      ownerUsername: guild.owner_username,
      level: guild.level,
      experience: guild.experience,
      treasury: guild.treasury,
      memberCount: guild.member_count,
      maxMembers: guild.max_members,
      iconColor: guild.icon_color,
      createdAt: new Date(guild.created_at).getTime(),
    };

    return { success: true, guild: formattedGuild };
  } catch (error) {
    console.error('Error creating guild:', error);
    return { success: false, error: 'Failed to create guild' };
  }
};

/**
 * Get guild by ID
 */
export const getGuild = async (
  guildId: string
): Promise<{ guild?: Guild; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', guildId)
      .single();

    if (error) {
      console.error('Error fetching guild:', error);
      return { error: error.message };
    }

    const guild: Guild = {
      id: data.id,
      name: data.name,
      tag: data.tag,
      description: data.description,
      ownerId: data.owner_id,
      ownerUsername: data.owner_username,
      level: data.level,
      experience: data.experience,
      treasury: data.treasury,
      memberCount: data.member_count,
      maxMembers: data.max_members,
      iconColor: data.icon_color,
      createdAt: new Date(data.created_at).getTime(),
    };

    return { guild };
  } catch (error) {
    console.error('Error fetching guild:', error);
    return { error: 'Failed to fetch guild' };
  }
};

/**
 * Get user's current guild
 */
export const getUserGuild = async (
  userId: string
): Promise<{ guild?: Guild; membership?: GuildMember; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase not configured' };
  }

  try {
    const { data: memberData, error: memberError } = await supabase
      .from('guild_members')
      .select('*, guilds(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError) {
      console.error('Error fetching user guild:', memberError);
      return { error: memberError.message };
    }

    if (!memberData) {
      return {}; // User not in any guild
    }

    const guildData = memberData.guilds as any;
    const guild: Guild = {
      id: guildData.id,
      name: guildData.name,
      tag: guildData.tag,
      description: guildData.description,
      ownerId: guildData.owner_id,
      ownerUsername: guildData.owner_username,
      level: guildData.level,
      experience: guildData.experience,
      treasury: guildData.treasury,
      memberCount: guildData.member_count,
      maxMembers: guildData.max_members,
      iconColor: guildData.icon_color,
      createdAt: new Date(guildData.created_at).getTime(),
    };

    const membership: GuildMember = {
      id: memberData.id,
      guildId: memberData.guild_id,
      userId: memberData.user_id,
      username: memberData.username,
      role: memberData.role,
      contribution: memberData.contribution,
      joinedAt: new Date(memberData.joined_at).getTime(),
    };

    return { guild, membership };
  } catch (error) {
    console.error('Error fetching user guild:', error);
    return { error: 'Failed to fetch user guild' };
  }
};

/**
 * Get guild members
 */
export const getGuildMembers = async (
  guildId: string
): Promise<{ members: GuildMember[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { members: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('guild_members')
      .select('*')
      .eq('guild_id', guildId)
      .order('role', { ascending: true })
      .order('contribution', { ascending: false });

    if (error) {
      console.error('Error fetching guild members:', error);
      return { members: [], error: error.message };
    }

    const members: GuildMember[] = (data || []).map((m: any) => ({
      id: m.id,
      guildId: m.guild_id,
      userId: m.user_id,
      username: m.username,
      role: m.role,
      contribution: m.contribution,
      joinedAt: new Date(m.joined_at).getTime(),
    }));

    return { members };
  } catch (error) {
    console.error('Error fetching guild members:', error);
    return { members: [], error: 'Failed to fetch members' };
  }
};

/**
 * Search guilds by name or tag
 */
export const searchGuilds = async (
  query: string,
  limit: number = 20
): Promise<{ guilds: Guild[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { guilds: [], error: 'Supabase not configured' };
  }

  if (query.trim().length < 2) {
    return { guilds: [] };
  }

  try {
    const { data, error } = await supabase
      .from('guilds')
      .select('*')
      .or(`name.ilike.%${query}%,tag.ilike.%${query}%`)
      .order('member_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching guilds:', error);
      return { guilds: [], error: error.message };
    }

    const guilds: Guild[] = (data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      tag: g.tag,
      description: g.description,
      ownerId: g.owner_id,
      ownerUsername: g.owner_username,
      level: g.level,
      experience: g.experience,
      treasury: g.treasury,
      memberCount: g.member_count,
      maxMembers: g.max_members,
      iconColor: g.icon_color,
      createdAt: new Date(g.created_at).getTime(),
    }));

    return { guilds };
  } catch (error) {
    console.error('Error searching guilds:', error);
    return { guilds: [], error: 'Failed to search guilds' };
  }
};

/**
 * Get guild leaderboard
 */
export const getGuildLeaderboard = async (
  limit: number = 50
): Promise<{ guilds: Guild[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { guilds: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('guilds')
      .select('*')
      .order('experience', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching guild leaderboard:', error);
      return { guilds: [], error: error.message };
    }

    const guilds: Guild[] = (data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      tag: g.tag,
      description: g.description,
      ownerId: g.owner_id,
      ownerUsername: g.owner_username,
      level: g.level,
      experience: g.experience,
      treasury: g.treasury,
      memberCount: g.member_count,
      maxMembers: g.max_members,
      iconColor: g.icon_color,
      createdAt: new Date(g.created_at).getTime(),
    }));

    return { guilds };
  } catch (error) {
    console.error('Error fetching guild leaderboard:', error);
    return { guilds: [], error: 'Failed to fetch leaderboard' };
  }
};

// ============================================
// Member Management
// ============================================

/**
 * Send guild invite
 */
export const sendGuildInvite = async (
  guildId: string,
  guildName: string,
  guildTag: string,
  fromUserId: string,
  fromUsername: string,
  toUserId: string
): Promise<{ success: boolean; error?: string; invite?: GuildInvite }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Check if target is already in a guild
    const { data: existingMembership } = await supabase
      .from('guild_members')
      .select('id')
      .eq('user_id', toUserId)
      .maybeSingle();

    if (existingMembership) {
      return { success: false, error: 'Player is already in a guild' };
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('guild_invites')
      .select('id')
      .eq('guild_id', guildId)
      .eq('to_user_id', toUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      return { success: false, error: 'Invite already sent' };
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from('guild_invites')
      .insert({
        guild_id: guildId,
        guild_name: guildName,
        guild_tag: guildTag,
        from_user_id: fromUserId,
        from_username: fromUsername,
        to_user_id: toUserId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending guild invite:', error);
      return { success: false, error: error.message };
    }

    const formattedInvite: GuildInvite = {
      id: invite.id,
      guildId: invite.guild_id,
      guildName: invite.guild_name,
      guildTag: invite.guild_tag,
      fromUserId: invite.from_user_id,
      fromUsername: invite.from_username,
      toUserId: invite.to_user_id,
      status: invite.status,
      createdAt: new Date(invite.created_at).getTime(),
    };

    return { success: true, invite: formattedInvite };
  } catch (error) {
    console.error('Error sending guild invite:', error);
    return { success: false, error: 'Failed to send invite' };
  }
};

/**
 * Get pending guild invites for a user
 */
export const getGuildInvites = async (
  userId: string
): Promise<{ invites: GuildInvite[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { invites: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('guild_invites')
      .select('*')
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching guild invites:', error);
      return { invites: [], error: error.message };
    }

    const invites: GuildInvite[] = (data || []).map((i: any) => ({
      id: i.id,
      guildId: i.guild_id,
      guildName: i.guild_name,
      guildTag: i.guild_tag,
      fromUserId: i.from_user_id,
      fromUsername: i.from_username,
      toUserId: i.to_user_id,
      status: i.status,
      createdAt: new Date(i.created_at).getTime(),
    }));

    return { invites };
  } catch (error) {
    console.error('Error fetching guild invites:', error);
    return { invites: [], error: 'Failed to fetch invites' };
  }
};

/**
 * Accept guild invite
 */
export const acceptGuildInvite = async (
  inviteId: string,
  userId: string,
  username: string
): Promise<{ success: boolean; error?: string; guild?: Guild }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from('guild_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return { success: false, error: 'Invite not found' };
    }

    // Check guild capacity
    const { data: guild } = await supabase
      .from('guilds')
      .select('member_count, max_members')
      .eq('id', invite.guild_id)
      .single();

    if (!guild || guild.member_count >= guild.max_members) {
      return { success: false, error: 'Guild is full' };
    }

    // Add member
    const { error: memberError } = await supabase.from('guild_members').insert({
      guild_id: invite.guild_id,
      user_id: userId,
      username,
      role: 'member',
      contribution: 0,
    });

    if (memberError) {
      console.error('Error joining guild:', memberError);
      return { success: false, error: 'Failed to join guild' };
    }

    // Update guild member count
    await supabase
      .from('guilds')
      .update({ member_count: guild.member_count + 1 })
      .eq('id', invite.guild_id);

    // Update invite status
    await supabase
      .from('guild_invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId);

    // Get full guild data
    const { guild: fullGuild } = await getGuild(invite.guild_id);

    // Broadcast to guild
    if (fullGuild) {
      await sendGuildBroadcast({
        type: 'member_join',
        payload: {
          id: '',
          guildId: invite.guild_id,
          userId,
          username,
          role: 'member',
          contribution: 0,
          joinedAt: Date.now(),
        },
        guildId: invite.guild_id,
      });
    }

    return { success: true, guild: fullGuild };
  } catch (error) {
    console.error('Error accepting guild invite:', error);
    return { success: false, error: 'Failed to accept invite' };
  }
};

/**
 * Reject guild invite
 */
export const rejectGuildInvite = async (
  inviteId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('guild_invites')
      .update({ status: 'rejected' })
      .eq('id', inviteId)
      .eq('to_user_id', userId);

    if (error) {
      console.error('Error rejecting guild invite:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting guild invite:', error);
    return { success: false, error: 'Failed to reject invite' };
  }
};

/**
 * Leave guild
 */
export const leaveGuild = async (
  userId: string,
  guildId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Check if user is leader
    const { data: member } = await supabase
      .from('guild_members')
      .select('role, username')
      .eq('user_id', userId)
      .eq('guild_id', guildId)
      .single();

    if (!member) {
      return { success: false, error: 'Not a member of this guild' };
    }

    if (member.role === 'leader') {
      return { success: false, error: 'Leader cannot leave. Transfer ownership or disband the guild.' };
    }

    // Remove member
    const { error } = await supabase
      .from('guild_members')
      .delete()
      .eq('user_id', userId)
      .eq('guild_id', guildId);

    if (error) {
      console.error('Error leaving guild:', error);
      return { success: false, error: error.message };
    }

    // Update member count
    await supabase.rpc('decrement_guild_members', { p_guild_id: guildId });

    // Broadcast
    await sendGuildBroadcast({
      type: 'member_leave',
      payload: {
        id: '',
        guildId,
        userId,
        username: member.username,
        role: member.role,
        contribution: 0,
        joinedAt: 0,
      },
      guildId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error leaving guild:', error);
    return { success: false, error: 'Failed to leave guild' };
  }
};

/**
 * Kick member from guild
 */
export const kickMember = async (
  kickerUserId: string,
  targetUserId: string,
  guildId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Check kicker's role
    const { data: kicker } = await supabase
      .from('guild_members')
      .select('role')
      .eq('user_id', kickerUserId)
      .eq('guild_id', guildId)
      .single();

    if (!kicker || (kicker.role !== 'leader' && kicker.role !== 'officer')) {
      return { success: false, error: 'No permission to kick members' };
    }

    // Check target's role
    const { data: target } = await supabase
      .from('guild_members')
      .select('role, username')
      .eq('user_id', targetUserId)
      .eq('guild_id', guildId)
      .single();

    if (!target) {
      return { success: false, error: 'Member not found' };
    }

    // Officers can only kick members, not other officers or leader
    if (kicker.role === 'officer' && target.role !== 'member') {
      return { success: false, error: 'Cannot kick officers or leader' };
    }

    // Leader cannot kick themselves
    if (target.role === 'leader') {
      return { success: false, error: 'Cannot kick the leader' };
    }

    // Remove member
    const { error } = await supabase
      .from('guild_members')
      .delete()
      .eq('user_id', targetUserId)
      .eq('guild_id', guildId);

    if (error) {
      console.error('Error kicking member:', error);
      return { success: false, error: error.message };
    }

    // Update member count
    await supabase.rpc('decrement_guild_members', { p_guild_id: guildId });

    // Broadcast
    await sendGuildBroadcast({
      type: 'member_leave',
      payload: {
        id: '',
        guildId,
        userId: targetUserId,
        username: target.username,
        role: target.role,
        contribution: 0,
        joinedAt: 0,
      },
      guildId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error kicking member:', error);
    return { success: false, error: 'Failed to kick member' };
  }
};

/**
 * Promote member
 */
export const promoteMember = async (
  promoterUserId: string,
  targetUserId: string,
  guildId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Check promoter is leader
    const { data: promoter } = await supabase
      .from('guild_members')
      .select('role')
      .eq('user_id', promoterUserId)
      .eq('guild_id', guildId)
      .single();

    if (!promoter || promoter.role !== 'leader') {
      return { success: false, error: 'Only the leader can promote members' };
    }

    // Get target
    const { data: target } = await supabase
      .from('guild_members')
      .select('role, username')
      .eq('user_id', targetUserId)
      .eq('guild_id', guildId)
      .single();

    if (!target) {
      return { success: false, error: 'Member not found' };
    }

    if (target.role !== 'member') {
      return { success: false, error: 'Can only promote members to officer' };
    }

    // Promote
    const { error } = await supabase
      .from('guild_members')
      .update({ role: 'officer' })
      .eq('user_id', targetUserId)
      .eq('guild_id', guildId);

    if (error) {
      console.error('Error promoting member:', error);
      return { success: false, error: error.message };
    }

    // Broadcast
    await sendGuildBroadcast({
      type: 'member_promote',
      payload: {
        id: '',
        guildId,
        userId: targetUserId,
        username: target.username,
        role: 'officer',
        contribution: 0,
        joinedAt: 0,
      },
      guildId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error promoting member:', error);
    return { success: false, error: 'Failed to promote member' };
  }
};

/**
 * Demote officer
 */
export const demoteMember = async (
  demoterUserId: string,
  targetUserId: string,
  guildId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Check demoter is leader
    const { data: demoter } = await supabase
      .from('guild_members')
      .select('role')
      .eq('user_id', demoterUserId)
      .eq('guild_id', guildId)
      .single();

    if (!demoter || demoter.role !== 'leader') {
      return { success: false, error: 'Only the leader can demote officers' };
    }

    // Get target
    const { data: target } = await supabase
      .from('guild_members')
      .select('role, username')
      .eq('user_id', targetUserId)
      .eq('guild_id', guildId)
      .single();

    if (!target) {
      return { success: false, error: 'Member not found' };
    }

    if (target.role !== 'officer') {
      return { success: false, error: 'Can only demote officers' };
    }

    // Demote
    const { error } = await supabase
      .from('guild_members')
      .update({ role: 'member' })
      .eq('user_id', targetUserId)
      .eq('guild_id', guildId);

    if (error) {
      console.error('Error demoting member:', error);
      return { success: false, error: error.message };
    }

    // Broadcast
    await sendGuildBroadcast({
      type: 'member_demote',
      payload: {
        id: '',
        guildId,
        userId: targetUserId,
        username: target.username,
        role: 'member',
        contribution: 0,
        joinedAt: 0,
      },
      guildId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error demoting member:', error);
    return { success: false, error: 'Failed to demote member' };
  }
};

// ============================================
// Treasury
// ============================================

/**
 * Contribute to guild treasury
 */
export const contributeToTreasury = async (
  userId: string,
  guildId: string,
  amount: number
): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
  if (!isSupabaseConfigured() || !isTableAvailable('player_profiles')) {
    return { success: false, error: 'Database not available' };
  }

  if (amount <= 0) {
    return { success: false, error: 'Amount must be positive' };
  }

  try {
    // Check user has enough coins
    const { data: profile, error: profileError } = await supabase
      .from('player_profiles')
      .select('coins')
      .eq('id', userId)
      .single();

    if (profileError && isMissingTableError(profileError)) {
      markTableMissing('player_profiles');
      return { success: false, error: 'Database not available' };
    }

    if (!profile || profile.coins < amount) {
      return { success: false, error: 'Insufficient coins' };
    }

    // Deduct from user
    await supabase
      .from('player_profiles')
      .update({ coins: profile.coins - amount })
      .eq('id', userId);

    // Add to treasury
    const { data: guild, error } = await supabase
      .from('guilds')
      .update({ treasury: supabase.rpc('increment', { x: amount }) })
      .eq('id', guildId)
      .select('treasury')
      .single();

    if (error) {
      // Rollback user coins
      await supabase
        .from('player_profiles')
        .update({ coins: profile.coins })
        .eq('id', userId);
      console.error('Error contributing to treasury:', error);
      return { success: false, error: error.message };
    }

    // Update member contribution
    await supabase.rpc('increment_member_contribution', {
      p_user_id: userId,
      p_guild_id: guildId,
      p_amount: amount,
    });

    // Broadcast
    await sendGuildBroadcast({
      type: 'treasury_update',
      payload: { amount, userId },
      guildId,
    });

    return { success: true, newBalance: guild?.treasury };
  } catch (error) {
    console.error('Error contributing to treasury:', error);
    return { success: false, error: 'Failed to contribute' };
  }
};

// ============================================
// Guild Chat
// ============================================

/**
 * Send guild chat message
 */
export const sendGuildMessage = async (
  guildId: string,
  userId: string,
  username: string,
  text: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  if (!text.trim()) {
    return { success: false, error: 'Message cannot be empty' };
  }

  const message: GuildChatMessage = {
    id: `gchat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    guildId,
    userId,
    username,
    text: text.trim(),
    timestamp: Date.now(),
  };

  // Store message
  await supabase.from('guild_chat').insert({
    id: message.id,
    guild_id: guildId,
    user_id: userId,
    username,
    text: message.text,
  });

  // Broadcast
  await sendGuildBroadcast({
    type: 'chat',
    payload: message,
    guildId,
  });

  return { success: true };
};

/**
 * Get guild chat history
 */
export const getGuildChatHistory = async (
  guildId: string,
  limit: number = 100
): Promise<{ messages: GuildChatMessage[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { messages: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('guild_chat')
      .select('*')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching guild chat:', error);
      return { messages: [], error: error.message };
    }

    const messages: GuildChatMessage[] = (data || [])
      .map((m: any) => ({
        id: m.id,
        guildId: m.guild_id,
        userId: m.user_id,
        username: m.username,
        text: m.text,
        timestamp: new Date(m.created_at).getTime(),
      }))
      .reverse();

    return { messages };
  } catch (error) {
    console.error('Error fetching guild chat:', error);
    return { messages: [], error: 'Failed to fetch chat history' };
  }
};

// ============================================
// Guild Disband
// ============================================

/**
 * Disband guild (leader only)
 */
export const disbandGuild = async (
  userId: string,
  guildId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Check user is leader
    const { data: member } = await supabase
      .from('guild_members')
      .select('role')
      .eq('user_id', userId)
      .eq('guild_id', guildId)
      .single();

    if (!member || member.role !== 'leader') {
      return { success: false, error: 'Only the leader can disband the guild' };
    }

    // Delete all members
    await supabase.from('guild_members').delete().eq('guild_id', guildId);

    // Delete all invites
    await supabase.from('guild_invites').delete().eq('guild_id', guildId);

    // Delete chat
    await supabase.from('guild_chat').delete().eq('guild_id', guildId);

    // Delete guild
    const { error } = await supabase.from('guilds').delete().eq('id', guildId);

    if (error) {
      console.error('Error disbanding guild:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error disbanding guild:', error);
    return { success: false, error: 'Failed to disband guild' };
  }
};
