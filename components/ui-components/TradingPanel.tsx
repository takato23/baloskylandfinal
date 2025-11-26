/**
 * Trading Panel Component
 * P2P trading interface with anti-scam protection
 */

import React, { useState, memo, useCallback } from 'react';
import { useTrading } from '../../hooks/useTrading';
import type { Trade, TradeItem, TradeRequest } from '../../types/game';
import { RARITY_COLORS } from '../../types/game';

interface TradingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  userCoins: number;
  userSkins: Array<{ id: string; name: string; rarity: string }>;
}

type TabType = 'requests' | 'active' | 'history';

const TradingPanel: React.FC<TradingPanelProps> = memo(({
  isOpen,
  onClose,
  userId,
  username,
  userCoins,
  userSkins,
}) => {
  const trading = useTrading(userId, username);
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [coinsToTrade, setCoinsToTrade] = useState(0);
  const [selectedSkins, setSelectedSkins] = useState<string[]>([]);

  const handleAddItems = useCallback(async () => {
    const items: TradeItem[] = [];

    if (coinsToTrade > 0) {
      items.push({
        type: 'coins',
        itemId: 'coins',
        amount: coinsToTrade,
        name: `${coinsToTrade} Coins`,
      });
    }

    for (const skinId of selectedSkins) {
      const skin = userSkins.find(s => s.id === skinId);
      if (skin) {
        items.push({
          type: 'skin',
          itemId: skinId,
          amount: 1,
          name: skin.name,
          rarity: skin.rarity as any,
        });
      }
    }

    await trading.updateItems(items);
  }, [coinsToTrade, selectedSkins, userSkins, trading]);

  const toggleSkin = (skinId: string) => {
    setSelectedSkins(prev =>
      prev.includes(skinId)
        ? prev.filter(id => id !== skinId)
        : [...prev, skinId]
    );
  };

  if (!isOpen) return null;

  const isInitiator = trading.activeTrade?.initiatorId === userId;
  const myItems = isInitiator
    ? trading.activeTrade?.initiatorItems || []
    : trading.activeTrade?.receiverItems || [];
  const theirItems = isInitiator
    ? trading.activeTrade?.receiverItems || []
    : trading.activeTrade?.initiatorItems || [];
  const myConfirmed = isInitiator
    ? trading.activeTrade?.initiatorConfirmed
    : trading.activeTrade?.receiverConfirmed;
  const theirConfirmed = isInitiator
    ? trading.activeTrade?.receiverConfirmed
    : trading.activeTrade?.initiatorConfirmed;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🤝</span> Trading
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['requests', 'active', 'history'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'history') trading.loadHistory();
              }}
              className={`flex-1 py-3 px-4 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-amber-500 text-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
              {tab === 'requests' && trading.pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {trading.pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {trading.error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between items-center">
            <span>{trading.error}</span>
            <button onClick={trading.clearError} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Incoming Requests */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Incoming Requests</h3>
                {trading.pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-sm">No pending requests</p>
                ) : (
                  <div className="space-y-2">
                    {trading.pendingRequests.map(req => (
                      <div key={req.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{req.fromUsername}</p>
                          <p className="text-xs text-gray-500">wants to trade with you</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => trading.acceptRequest(req)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => trading.rejectRequest(req)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests */}
              {trading.outgoingRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Outgoing Requests</h3>
                  <div className="space-y-2">
                    {trading.outgoingRequests.map(req => (
                      <div key={req.id} className="bg-amber-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">To: {req.toUsername}</p>
                          <p className="text-xs text-gray-500">Waiting for response...</p>
                        </div>
                        <span className="text-amber-500 text-sm">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Trade Tab */}
          {activeTab === 'active' && (
            <div>
              {!trading.activeTrade ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No active trade</p>
                  <p className="text-sm text-gray-400">
                    Click on a player in the game to send a trade request
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Trade Info */}
                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-3 text-center">
                    <p className="font-medium">
                      Trading with{' '}
                      <span className="text-amber-700">
                        {isInitiator
                          ? trading.activeTrade.receiverUsername
                          : trading.activeTrade.initiatorUsername}
                      </span>
                    </p>
                    <p className="text-xs text-amber-600">
                      Expires in {Math.max(0, Math.floor((trading.activeTrade.expiresAt - Date.now()) / 1000))}s
                    </p>
                  </div>

                  {/* Trade Window */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Your Items */}
                    <div className="border-2 border-amber-200 rounded-lg p-3">
                      <h4 className="font-semibold text-amber-700 mb-2 flex items-center justify-between">
                        Your Items
                        {myConfirmed && <span className="text-green-500 text-sm">✓ Confirmed</span>}
                      </h4>
                      <div className="min-h-[100px] space-y-1">
                        {myItems.map((item, i) => (
                          <div key={i} className="text-sm bg-amber-50 rounded px-2 py-1">
                            {item.name}
                          </div>
                        ))}
                        {myItems.length === 0 && (
                          <p className="text-gray-400 text-sm">Add items below</p>
                        )}
                      </div>
                    </div>

                    {/* Their Items */}
                    <div className="border-2 border-blue-200 rounded-lg p-3">
                      <h4 className="font-semibold text-blue-700 mb-2 flex items-center justify-between">
                        Their Items
                        {theirConfirmed && <span className="text-green-500 text-sm">✓ Confirmed</span>}
                      </h4>
                      <div className="min-h-[100px] space-y-1">
                        {theirItems.map((item, i) => (
                          <div key={i} className="text-sm bg-blue-50 rounded px-2 py-1">
                            {item.name}
                          </div>
                        ))}
                        {theirItems.length === 0 && (
                          <p className="text-gray-400 text-sm">Waiting for items...</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Items Section */}
                  <div className="border rounded-lg p-3 space-y-3">
                    <h4 className="font-medium text-gray-700">Add to Trade</h4>

                    {/* Coins */}
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🪙</span>
                      <input
                        type="number"
                        min="0"
                        max={userCoins}
                        value={coinsToTrade}
                        onChange={e => setCoinsToTrade(Math.min(userCoins, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-24 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-sm text-gray-500">/ {userCoins}</span>
                    </div>

                    {/* Skins */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Select skins:</p>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {userSkins.map(skin => (
                          <button
                            key={skin.id}
                            onClick={() => toggleSkin(skin.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              selectedSkins.includes(skin.id)
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            style={{
                              borderLeft: `3px solid ${RARITY_COLORS[skin.rarity as keyof typeof RARITY_COLORS] || '#9ca3af'}`,
                            }}
                          >
                            {skin.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleAddItems}
                      disabled={trading.isLoading || (coinsToTrade === 0 && selectedSkins.length === 0)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
                    >
                      Update My Items
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={trading.confirm}
                      disabled={trading.isLoading || myConfirmed}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        myConfirmed
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {myConfirmed ? '✓ Confirmed' : 'Confirm Trade'}
                    </button>
                    <button
                      onClick={trading.cancel}
                      disabled={trading.isLoading}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Warning */}
                  <p className="text-xs text-gray-500 text-center">
                    ⚠️ Both players must confirm to complete the trade
                  </p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {trading.tradeHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No trade history</p>
              ) : (
                trading.tradeHistory.map(trade => (
                  <div key={trade.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">
                        {trade.initiatorId === userId ? 'You traded with' : 'Traded with you'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        trade.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500 mb-1">Given:</p>
                        {(trade.initiatorId === userId ? trade.initiatorItems : trade.receiverItems).map((item, i) => (
                          <p key={i} className="text-gray-700">{item.name}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Received:</p>
                        {(trade.initiatorId === userId ? trade.receiverItems : trade.initiatorItems).map((item, i) => (
                          <p key={i} className="text-gray-700">{item.name}</p>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(trade.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TradingPanel.displayName = 'TradingPanel';

export default TradingPanel;
