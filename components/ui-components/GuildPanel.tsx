/**
 * Guild Panel Component
 * Full guild management interface with chat
 */

import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { useGuild } from '../../hooks/useGuild';
import type { Guild, GuildMember, GuildRole } from '../../types/game';

interface GuildPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  userCoins: number;
}

type TabType = 'overview' | 'members' | 'chat' | 'settings';

const ROLE_COLORS: Record<GuildRole, string> = {
  leader: '#f59e0b',
  officer: '#8b5cf6',
  member: '#6b7280',
};

const ROLE_ICONS: Record<GuildRole, string> = {
  leader: '👑',
  officer: '⚔️',
  member: '👤',
};

const GuildPanel: React.FC<GuildPanelProps> = memo(({
  isOpen,
  onClose,
  userId,
  username,
  userCoins,
}) => {
  const guild = useGuild(userId, username);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guild[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [contributeAmount, setContributeAmount] = useState(100);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Create guild form state
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTag, setNewGuildTag] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [newGuildColor, setNewGuildColor] = useState('#6366f1');

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [guild.chatMessages, activeTab]);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) return;
    const results = await guild.search(searchQuery);
    setSearchResults(results);
  }, [searchQuery, guild]);

  const handleCreateGuild = useCallback(async () => {
    if (!newGuildName || !newGuildTag) return;
    const success = await guild.create(newGuildName, newGuildTag, newGuildDesc, newGuildColor);
    if (success) {
      setShowCreateForm(false);
      setNewGuildName('');
      setNewGuildTag('');
      setNewGuildDesc('');
    }
  }, [newGuildName, newGuildTag, newGuildDesc, newGuildColor, guild]);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    await guild.sendMessage(chatInput);
    setChatInput('');
  }, [chatInput, guild]);

  const handleContribute = useCallback(async () => {
    if (contributeAmount <= 0 || contributeAmount > userCoins) return;
    await guild.contribute(contributeAmount);
  }, [contributeAmount, userCoins, guild]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏰</span>
            {guild.guild ? `[${guild.guild.tag}] ${guild.guild.name}` : 'Guild'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Error Display */}
        {guild.error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
            <span>{guild.error}</span>
            <button onClick={guild.clearError} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* No Guild State */}
        {!guild.guild && !showCreateForm && (
          <div className="flex-1 p-6 space-y-6">
            {/* Guild Invites */}
            {guild.invites.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Guild Invites</h3>
                <div className="space-y-2">
                  {guild.invites.map(invite => (
                    <div key={invite.id} className="bg-indigo-50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">[{invite.guildTag}] {invite.guildName}</p>
                        <p className="text-xs text-gray-500">Invited by {invite.fromUsername}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => guild.acceptInvite(invite.id)}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                        >
                          Join
                        </button>
                        <button
                          onClick={() => guild.rejectInvite(invite.id)}
                          className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Guilds */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Find a Guild</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or tag..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm"
                >
                  Search
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map(g => (
                    <div key={g.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">[{g.tag}] {g.name}</p>
                        <p className="text-xs text-gray-500">{g.memberCount}/{g.maxMembers} members • Level {g.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Guild */}
            <div className="text-center">
              <p className="text-gray-500 mb-4">Or start your own guild</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium"
              >
                Create Guild
              </button>
            </div>
          </div>
        )}

        {/* Create Guild Form */}
        {!guild.guild && showCreateForm && (
          <div className="flex-1 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Create New Guild</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guild Name</label>
              <input
                type="text"
                value={newGuildName}
                onChange={e => setNewGuildName(e.target.value)}
                placeholder="Epic Explorers"
                className="w-full px-3 py-2 border rounded-lg"
                maxLength={24}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag (2-5 characters)</label>
              <input
                type="text"
                value={newGuildTag}
                onChange={e => setNewGuildTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="EPIC"
                className="w-full px-3 py-2 border rounded-lg uppercase"
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newGuildDesc}
                onChange={e => setNewGuildDesc(e.target.value)}
                placeholder="A friendly guild for explorers..."
                className="w-full px-3 py-2 border rounded-lg resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                value={newGuildColor}
                onChange={e => setNewGuildColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateGuild}
                disabled={guild.isLoading || !newGuildName || newGuildTag.length < 2}
                className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
              >
                {guild.isLoading ? 'Creating...' : 'Create Guild'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Guild View */}
        {guild.guild && (
          <>
            {/* Tabs */}
            <div className="flex border-b">
              {(['overview', 'members', 'chat', 'settings'] as TabType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Guild Banner */}
                  <div
                    className="rounded-xl p-4 text-white"
                    style={{ backgroundColor: guild.guild.iconColor }}
                  >
                    <h3 className="text-xl font-bold">[{guild.guild.tag}] {guild.guild.name}</h3>
                    <p className="text-white/80 text-sm mt-1">{guild.guild.description || 'No description'}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-600">{guild.guild.level}</p>
                      <p className="text-xs text-gray-500">Level</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-600">{guild.guild.memberCount}</p>
                      <p className="text-xs text-gray-500">Members</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-amber-500">🪙 {guild.guild.treasury}</p>
                      <p className="text-xs text-gray-500">Treasury</p>
                    </div>
                  </div>

                  {/* Contribute */}
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-medium text-amber-700 mb-2">Contribute to Treasury</h4>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max={userCoins}
                        value={contributeAmount}
                        onChange={e => setContributeAmount(Math.min(userCoins, Math.max(1, parseInt(e.target.value) || 0)))}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={handleContribute}
                        disabled={guild.isLoading || contributeAmount > userCoins}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
                      >
                        Donate
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">Your balance: {userCoins} coins</p>
                  </div>

                  {/* Your Role */}
                  {guild.membership && (
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                      <span className="text-2xl">{ROLE_ICONS[guild.membership.role]}</span>
                      <div>
                        <p className="font-medium capitalize" style={{ color: ROLE_COLORS[guild.membership.role] }}>
                          {guild.membership.role}
                        </p>
                        <p className="text-xs text-gray-500">Contributed: {guild.membership.contribution} coins</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-2">
                  {guild.members.map(member => (
                    <div key={member.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{ROLE_ICONS[member.role]}</span>
                        <div>
                          <p className="font-medium">{member.username}</p>
                          <p className="text-xs text-gray-500 capitalize" style={{ color: ROLE_COLORS[member.role] }}>
                            {member.role} • {member.contribution} contributed
                          </p>
                        </div>
                      </div>

                      {/* Actions for leader/officer */}
                      {guild.membership?.role === 'leader' && member.userId !== userId && (
                        <div className="flex gap-1">
                          {member.role === 'member' && (
                            <button
                              onClick={() => guild.promote(member.userId)}
                              className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs"
                            >
                              Promote
                            </button>
                          )}
                          {member.role === 'officer' && (
                            <button
                              onClick={() => guild.demote(member.userId)}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs"
                            >
                              Demote
                            </button>
                          )}
                          <button
                            onClick={() => guild.kick(member.userId)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                          >
                            Kick
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-80">
                  <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                    {guild.chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`${msg.userId === userId ? 'text-right' : ''}`}
                      >
                        <div
                          className={`inline-block rounded-lg px-3 py-2 max-w-[80%] ${
                            msg.userId === userId
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {msg.userId !== userId && (
                            <p className="text-xs font-medium opacity-70 mb-1">{msg.username}</p>
                          )}
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim()}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {guild.membership?.role === 'leader' ? (
                    <>
                      <p className="text-sm text-gray-500">As the leader, you can manage the guild.</p>
                      <button
                        onClick={guild.disband}
                        className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                      >
                        Disband Guild
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={guild.leave}
                      className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                    >
                      Leave Guild
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

GuildPanel.displayName = 'GuildPanel';

export default GuildPanel;
