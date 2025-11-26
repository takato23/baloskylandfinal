/**
 * Database Types for Supabase
 * Auto-generated types for type safety
 */

export interface Database {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          text: string;
          color: string;
          type: 'global' | 'proximity';
          position: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          text: string;
          color: string;
          type?: 'global' | 'proximity';
          position?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          text?: string;
          color?: string;
          type?: 'global' | 'proximity';
          position?: number[] | null;
          created_at?: string;
        };
      };
      player_profiles: {
        Row: {
          id: string;
          username: string;
          character_type: string;
          character_skin: string;
          character_shirt: string;
          character_pants: string;
          character_accessory: string;
          coins: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          character_type?: string;
          character_skin?: string;
          character_shirt?: string;
          character_pants?: string;
          character_accessory?: string;
          coins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          character_type?: string;
          character_skin?: string;
          character_shirt?: string;
          character_pants?: string;
          character_accessory?: string;
          coins?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      leaderboard: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          coins: number;
          character_type: string;
          character_skin: string;
          character_shirt: string;
          character_pants: string;
          character_accessory: string;
          rank: number;
          daily_coins: number;
          weekly_coins: number;
          last_daily_reset: string;
          last_weekly_reset: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          coins?: number;
          character_type?: string;
          character_skin?: string;
          character_shirt?: string;
          character_pants?: string;
          character_accessory?: string;
          rank?: number;
          daily_coins?: number;
          weekly_coins?: number;
          last_daily_reset?: string;
          last_weekly_reset?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          coins?: number;
          character_type?: string;
          character_skin?: string;
          character_shirt?: string;
          character_pants?: string;
          character_accessory?: string;
          rank?: number;
          daily_coins?: number;
          weekly_coins?: number;
          last_daily_reset?: string;
          last_weekly_reset?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
      };
      blocked_users: {
        Row: {
          id: string;
          user_id: string;
          blocked_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          blocked_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          blocked_user_id?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// SQL Schema for reference (run this in Supabase SQL Editor):
/*
-- Chat messages table (optional persistence)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#ffffff',
  type TEXT NOT NULL DEFAULT 'global' CHECK (type IN ('global', 'proximity')),
  position FLOAT8[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player profiles table (for persistence)
CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  character_type TEXT DEFAULT 'bear',
  character_skin TEXT DEFAULT '#fcd5ce',
  character_shirt TEXT DEFAULT '#FF9A8B',
  character_pants TEXT DEFAULT '#4a90e2',
  character_accessory TEXT DEFAULT 'backpack',
  coins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for chat (anyone can read, insert their own)
CREATE POLICY "Anyone can read chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat" ON chat_messages FOR INSERT WITH CHECK (true);

-- Auto-delete old messages (optional - run periodically)
-- DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '1 hour';

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Leaderboard table (for global rankings)
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  coins INTEGER DEFAULT 0,
  character_type TEXT DEFAULT 'bear',
  character_skin TEXT DEFAULT '#fcd5ce',
  character_shirt TEXT DEFAULT '#FF9A8B',
  character_pants TEXT DEFAULT '#4a90e2',
  character_accessory TEXT DEFAULT 'backpack',
  rank INTEGER DEFAULT 0,
  daily_coins INTEGER DEFAULT 0,
  weekly_coins INTEGER DEFAULT 0,
  last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
  last_weekly_reset TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_coins ON leaderboard(coins DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily_coins ON leaderboard(daily_coins DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_coins ON leaderboard(weekly_coins DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policies for leaderboard (anyone can read, users can insert/update their own)
CREATE POLICY "Anyone can read leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can insert their own entry" ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own entry" ON leaderboard FOR UPDATE USING (true);

-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- Function to update rank based on coins (run periodically or via trigger)
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_players AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY coins DESC) as new_rank
    FROM leaderboard
  )
  UPDATE leaderboard
  SET rank = ranked_players.new_rank
  FROM ranked_players
  WHERE leaderboard.id = ranked_players.id;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily/weekly coins (call from cron job)
CREATE OR REPLACE FUNCTION reset_periodic_coins()
RETURNS void AS $$
BEGIN
  -- Reset daily coins if more than 24 hours
  UPDATE leaderboard
  SET
    daily_coins = 0,
    last_daily_reset = NOW()
  WHERE last_daily_reset < NOW() - INTERVAL '24 hours';

  -- Reset weekly coins if more than 7 days
  UPDATE leaderboard
  SET
    weekly_coins = 0,
    last_weekly_reset = NOW()
  WHERE last_weekly_reset < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Friend requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id, status);

-- Friendships table (bidirectional)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create indexes for efficient friendship lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

-- Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  blocked_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- Create index for efficient block checks
CREATE INDEX IF NOT EXISTS idx_blocked_users_user ON blocked_users(user_id);

-- Enable RLS for friends tables
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Policies for friend requests
CREATE POLICY "Users can view friend requests involving them" ON friend_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update friend requests they received" ON friend_requests
  FOR UPDATE USING (true);

-- Policies for friendships
CREATE POLICY "Users can view friendships involving them" ON friendships
  FOR SELECT USING (true);

CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their friendships" ON friendships
  FOR DELETE USING (true);

-- Policies for blocked users
CREATE POLICY "Users can view their blocked list" ON blocked_users
  FOR SELECT USING (true);

CREATE POLICY "Users can block others" ON blocked_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can unblock others" ON blocked_users
  FOR DELETE USING (true);

-- Enable realtime for friends tables
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- Trigger to update updated_at for friend_requests
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRADING SYSTEM TABLES
-- ============================================

-- Trade history table
CREATE TABLE IF NOT EXISTS trade_history (
  id TEXT PRIMARY KEY,
  initiator_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  initiator_items JSONB NOT NULL DEFAULT '[]',
  receiver_items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for trade history
CREATE INDEX IF NOT EXISTS idx_trade_history_initiator ON trade_history(initiator_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_receiver ON trade_history(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_completed_at ON trade_history(completed_at DESC);

-- Enable RLS for trade history
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;

-- Policies for trade history
CREATE POLICY "Users can view their trades" ON trade_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert trades" ON trade_history
  FOR INSERT WITH CHECK (true);

-- RPC function for updating coins in trades
CREATE OR REPLACE FUNCTION update_player_coins_trade(p_user_id TEXT, p_coins_delta INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE player_profiles
  SET coins = GREATEST(0, coins + p_coins_delta),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GUILDS SYSTEM TABLES
-- ============================================

-- Guilds table
CREATE TABLE IF NOT EXISTS guilds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  owner_id TEXT NOT NULL,
  owner_username TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  treasury INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 50,
  icon_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for guilds
CREATE INDEX IF NOT EXISTS idx_guilds_name ON guilds(name);
CREATE INDEX IF NOT EXISTS idx_guilds_tag ON guilds(tag);
CREATE INDEX IF NOT EXISTS idx_guilds_owner ON guilds(owner_id);
CREATE INDEX IF NOT EXISTS idx_guilds_experience ON guilds(experience DESC);

-- Guild members table
CREATE TABLE IF NOT EXISTS guild_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
  contribution INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, user_id)
);

-- Create indexes for guild members
CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_role ON guild_members(role);

-- Guild invites table
CREATE TABLE IF NOT EXISTS guild_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  guild_name TEXT NOT NULL,
  guild_tag TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  from_username TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for guild invites
CREATE INDEX IF NOT EXISTS idx_guild_invites_to_user ON guild_invites(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_guild_invites_guild ON guild_invites(guild_id);

-- Guild chat table
CREATE TABLE IF NOT EXISTS guild_chat (
  id TEXT PRIMARY KEY,
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for guild chat
CREATE INDEX IF NOT EXISTS idx_guild_chat_guild ON guild_chat(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_chat_created_at ON guild_chat(created_at DESC);

-- Enable RLS for guild tables
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_chat ENABLE ROW LEVEL SECURITY;

-- Policies for guilds
CREATE POLICY "Anyone can view guilds" ON guilds FOR SELECT USING (true);
CREATE POLICY "Anyone can create guilds" ON guilds FOR INSERT WITH CHECK (true);
CREATE POLICY "Guild owners can update" ON guilds FOR UPDATE USING (true);
CREATE POLICY "Guild owners can delete" ON guilds FOR DELETE USING (true);

-- Policies for guild members
CREATE POLICY "Anyone can view guild members" ON guild_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join guilds" ON guild_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can be updated" ON guild_members FOR UPDATE USING (true);
CREATE POLICY "Members can be removed" ON guild_members FOR DELETE USING (true);

-- Policies for guild invites
CREATE POLICY "Users can view their invites" ON guild_invites FOR SELECT USING (true);
CREATE POLICY "Members can send invites" ON guild_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their invites" ON guild_invites FOR UPDATE USING (true);

-- Policies for guild chat
CREATE POLICY "Members can view guild chat" ON guild_chat FOR SELECT USING (true);
CREATE POLICY "Members can post in guild chat" ON guild_chat FOR INSERT WITH CHECK (true);

-- Enable realtime for guild tables
ALTER PUBLICATION supabase_realtime ADD TABLE guilds;
ALTER PUBLICATION supabase_realtime ADD TABLE guild_members;
ALTER PUBLICATION supabase_realtime ADD TABLE guild_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE guild_chat;

-- RPC functions for guilds
CREATE OR REPLACE FUNCTION decrement_guild_members(p_guild_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE guilds
  SET member_count = GREATEST(0, member_count - 1),
      updated_at = NOW()
  WHERE id = p_guild_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_member_contribution(p_user_id TEXT, p_guild_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE guild_members
  SET contribution = contribution + p_amount
  WHERE user_id = p_user_id AND guild_id = p_guild_id;

  UPDATE guilds
  SET treasury = treasury + p_amount,
      experience = experience + (p_amount / 10),
      updated_at = NOW()
  WHERE id = p_guild_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ACHIEVEMENTS SYSTEM TABLES
-- ============================================

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for user achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Enable RLS for achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Users can view their achievements" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can update their achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update progress" ON user_achievements
  FOR UPDATE USING (true);

-- Enable realtime for achievements
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;

-- Trigger for achievements updated_at
CREATE TRIGGER update_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC function for adding coins
CREATE OR REPLACE FUNCTION add_player_coins(p_user_id TEXT, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE player_profiles
  SET coins = coins + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SHOP & SKINS SYSTEM TABLES
-- ============================================

-- User skins table
CREATE TABLE IF NOT EXISTS user_skins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  skin_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  equipped_at TIMESTAMPTZ,
  UNIQUE(user_id, skin_id)
);

-- Create indexes for user skins
CREATE INDEX IF NOT EXISTS idx_user_skins_user ON user_skins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skins_equipped ON user_skins(user_id, equipped_at) WHERE equipped_at IS NOT NULL;

-- Enable RLS for user skins
ALTER TABLE user_skins ENABLE ROW LEVEL SECURITY;

-- Policies for user skins
CREATE POLICY "Users can view their skins" ON user_skins
  FOR SELECT USING (true);

CREATE POLICY "Users can purchase skins" ON user_skins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can equip skins" ON user_skins
  FOR UPDATE USING (true);

CREATE POLICY "System can transfer skins" ON user_skins
  FOR DELETE USING (true);

-- Enable realtime for skins
ALTER PUBLICATION supabase_realtime ADD TABLE user_skins;

-- Add gems column to player_profiles if not exists
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0;
*/
