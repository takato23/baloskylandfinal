/**
 * Friends Panel Component
 * UI for managing friends, friend requests, and following friends
 */

import React, { useState, useCallback, memo, useMemo } from 'react';
import { useFriends, type FriendWithStatus, type FriendRequestWithUsername } from '../../hooks/useFriends';
import { useMultiplayerV2 } from '../../hooks/useMultiplayerV2';
import { useIsMobile, useOrientation } from '../../hooks';

// ============================================
// Types
// ============================================

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'friends' | 'requests' | 'search' | 'blocked';

// ============================================
// Friend Item Component
// ============================================

interface FriendItemProps {
  friend: FriendWithStatus;
  onTeleport: (friendId: string, position: [number, number, number]) => void;
  onFollow: (friendId: string) => void;
  onUnfollow: () => void;
  onRemove: (friendId: string) => void;
  onBlock: (friendId: string) => void;
  isFollowing: boolean;
}

const FriendItem: React.FC<FriendItemProps> = memo(({
  friend,
  onTeleport,
  onFollow,
  onUnfollow,
  onRemove,
  onBlock,
  isFollowing,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Online Status */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
              {friend.username?.substring(0, 2).toUpperCase() || friend.friend_id.substring(0, 2).toUpperCase()}
            </div>
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>

          {/* Username */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {friend.username || `User ${friend.friend_id.substring(0, 8)}`}
            </p>
            <p className="text-xs text-gray-500">
              {friend.isOnline ? 'En línea' : 'Desconectado'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Teleport button (only if online) */}
          {friend.isOnline && friend.position && (
            <button
              onClick={() => onTeleport(friend.friend_id, friend.position!)}
              className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
              title="Teletransportarse"
            >
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Follow/Unfollow button (only if online) */}
          {friend.isOnline && (
            <button
              onClick={() => (isFollowing ? onUnfollow() : onFollow(friend.friend_id))}
              className={`p-2 rounded-lg transition-colors ${
                isFollowing
                  ? 'bg-purple-100 text-purple-600'
                  : 'hover:bg-purple-50 text-gray-600'
              }`}
              title={isFollowing ? 'Dejar de seguir' : 'Seguir'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
                  <button
                    onClick={() => {
                      onRemove(friend.friend_id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                  >
                    Eliminar amigo
                  </button>
                  <button
                    onClick={() => {
                      onBlock(friend.friend_id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600"
                  >
                    Bloquear usuario
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

FriendItem.displayName = 'FriendItem';

// ============================================
// Friend Request Item Component
// ============================================

interface RequestItemProps {
  request: FriendRequestWithUsername;
  type: 'incoming' | 'outgoing';
  onAccept?: (requestId: string, senderId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

const RequestItem: React.FC<RequestItemProps> = memo(({ request, type, onAccept, onReject, onCancel }) => {
  const userId = type === 'incoming' ? request.sender_id : request.receiver_id;
  const username = type === 'incoming' ? request.senderUsername : request.receiverUsername;

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-bold">
            {username?.substring(0, 2).toUpperCase() || userId.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {username || `User ${userId.substring(0, 8)}`}
            </p>
            <p className="text-xs text-gray-500">
              {type === 'incoming' ? 'Solicitud recibida' : 'Solicitud enviada'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {type === 'incoming' ? (
            <>
              <button
                onClick={() => onAccept?.(request.id, request.sender_id)}
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Aceptar
              </button>
              <button
                onClick={() => onReject?.(request.id)}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Rechazar
              </button>
            </>
          ) : (
            <button
              onClick={() => onCancel?.(request.id)}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

RequestItem.displayName = 'RequestItem';

// ============================================
// Search Tab Component
// ============================================

interface SearchTabProps {
  onSearch: (query: string) => Promise<{ users: Array<{ id: string; username: string }>; error?: string }>;
  onSendRequest: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

const SearchTab: React.FC<SearchTabProps> = memo(({ onSearch, onSendRequest }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; username: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const { users } = await onSearch(searchQuery);
    setResults(users);
    setIsSearching(false);
  }, [onSearch]);

  const handleSendRequest = useCallback(async (userId: string) => {
    const result = await onSendRequest(userId);
    if (result.success) {
      // Remove from results
      setResults((prev) => prev.filter((u) => u.id !== userId));
    }
  }, [onSendRequest]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="Buscar por nombre de usuario..."
          className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:border-purple-500 focus:bg-white transition-all outline-none"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Results */}
      {isSearching ? (
        <div className="text-center py-8 text-gray-500">Buscando...</div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((user) => (
            <div key={user.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <p className="font-semibold text-gray-800">{user.username}</p>
              </div>
              <button
                onClick={() => handleSendRequest(user.id)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Agregar
              </button>
            </div>
          ))}
        </div>
      ) : query.trim().length >= 2 ? (
        <div className="text-center py-8 text-gray-500">
          No se encontraron usuarios
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">Busca usuarios para agregar como amigos</p>
        </div>
      )}
    </div>
  );
});

SearchTab.displayName = 'SearchTab';

// ============================================
// Main Friends Panel Component
// ============================================

export const FriendsPanel: React.FC<FriendsPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const { odIduserId } = useMultiplayerV2();

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,
    isLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    unfriend,
    block,
    unblock,
    searchForUsers,
    followingFriendId,
    followFriend,
  } = useFriends(odIduserId);

  const isMobile = useIsMobile();
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // ============================================
  // Handlers
  // ============================================

  const handleTeleport = useCallback((friendId: string, position: [number, number, number]) => {
    // TODO: Implement teleport to friend location
    // For now, just show on minimap
    console.log('Teleport to friend:', friendId, position);
  }, []);

  const handleFollow = useCallback((friendId: string) => {
    followFriend(friendId);
  }, [followFriend]);

  const handleUnfollow = useCallback(() => {
    followFriend(null);
  }, [followFriend]);

  const handleRemove = useCallback(async (friendId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar a este amigo?')) {
      await unfriend(friendId);
    }
  }, [unfriend]);

  const handleBlock = useCallback(async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres bloquear a este usuario?')) {
      await block(userId);
    }
  }, [block]);

  const handleUnblock = useCallback(async (userId: string) => {
    await unblock(userId);
  }, [unblock]);

  // ============================================
  // Computed Values
  // ============================================

  const totalRequests = incomingRequests.length + outgoingRequests.length;
  const onlineFriendsCount = friends.filter((f) => f.isOnline).length;

  // ============================================
  // Render
  // ============================================

  if (!isOpen) return null;

  // Responsive sizing
  const panelWidth = isMobile
    ? isLandscape ? 'w-[45vw]' : 'w-full'
    : 'w-[420px]';

  const panelHeight = isMobile
    ? isLandscape ? 'h-full' : 'h-[70vh]'
    : 'h-[600px]';

  return (
    <div className={`fixed ${isMobile ? (isLandscape ? 'right-0 top-0 bottom-0' : 'bottom-0 left-0 right-0') : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'} z-50`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative ${panelWidth} ${panelHeight} bg-white/95 backdrop-blur-xl ${
          isMobile
            ? isLandscape
              ? 'rounded-l-2xl'
              : 'rounded-t-2xl'
            : 'rounded-2xl'
        } shadow-2xl flex flex-col overflow-hidden animate-in ${
          isMobile ? 'slide-in-from-bottom' : 'zoom-in-95'
        } duration-300 border border-gray-200`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h3 className="font-bold text-lg leading-none">Amigos</h3>
              <span className="text-xs text-white/80">
                {onlineFriendsCount} en línea · {friends.length} total
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-200 shrink-0">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Amigos ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Solicitudes
            {totalRequests > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalRequests > 9 ? '9+' : totalRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Buscar
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'blocked'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Bloqueados ({blockedUsers.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="space-y-2">
                  {friends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                      <span className="text-5xl mb-3">👥</span>
                      <p className="text-sm font-medium text-center">No tienes amigos aún</p>
                      <p className="text-xs text-center mt-1">
                        Busca usuarios para agregar como amigos
                      </p>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <FriendItem
                        key={friend.id}
                        friend={friend}
                        onTeleport={handleTeleport}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                        onRemove={handleRemove}
                        onBlock={handleBlock}
                        isFollowing={followingFriendId === friend.friend_id}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  {/* Incoming Requests */}
                  {incomingRequests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Solicitudes recibidas</h4>
                      <div className="space-y-2">
                        {incomingRequests.map((request) => (
                          <RequestItem
                            key={request.id}
                            request={request}
                            type="incoming"
                            onAccept={acceptRequest}
                            onReject={rejectRequest}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outgoing Requests */}
                  {outgoingRequests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Solicitudes enviadas</h4>
                      <div className="space-y-2">
                        {outgoingRequests.map((request) => (
                          <RequestItem
                            key={request.id}
                            request={request}
                            type="outgoing"
                            onCancel={cancelRequest}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {totalRequests === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                      <span className="text-5xl mb-3">✉️</span>
                      <p className="text-sm font-medium text-center">No hay solicitudes pendientes</p>
                    </div>
                  )}
                </div>
              )}

              {/* Search Tab */}
              {activeTab === 'search' && (
                <SearchTab onSearch={searchForUsers} onSendRequest={sendRequest} />
              )}

              {/* Blocked Tab */}
              {activeTab === 'blocked' && (
                <div className="space-y-2">
                  {blockedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                      <span className="text-5xl mb-3">🚫</span>
                      <p className="text-sm font-medium text-center">No hay usuarios bloqueados</p>
                    </div>
                  ) : (
                    blockedUsers.map((blocked) => (
                      <div key={blocked.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold">
                            {blocked.blocked_user_id.substring(0, 2).toUpperCase()}
                          </div>
                          <p className="font-semibold text-gray-800">
                            Usuario bloqueado
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnblock(blocked.blocked_user_id)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Desbloquear
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPanel;
