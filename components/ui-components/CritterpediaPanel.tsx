/**
 * CritterpediaPanel - Premium Collection Log
 * Animal Crossing-style creature encyclopedia with museum integration
 */

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { FISH_DATA } from '../../data/fish';
import { BUG_DATA } from '../../data/bugs';
import { FOSSIL_DATA, getDinosaurSets, getFossilsBySet, getSetCompletion } from '../../data/fossils';
import type { Fish, Bug, Fossil } from '../../types/collectibles';
import { playSound } from '../../utils/audio';

interface CritterpediaPanelProps {
  onClose: () => void;
  initialTab?: 'fish' | 'bugs' | 'fossils';
}

// ============================================
// Rarity Configuration
// ============================================

const RARITY_CONFIG = {
  common: {
    color: 'from-slate-400 to-slate-500',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    label: 'Común',
    glow: '',
  },
  uncommon: {
    color: 'from-emerald-400 to-green-500',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    label: 'Poco común',
    glow: '',
  },
  rare: {
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    label: 'Raro',
    glow: 'shadow-blue-400/50',
  },
  legendary: {
    color: 'from-amber-400 via-orange-500 to-red-500',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-400',
    label: 'Legendario',
    glow: 'shadow-amber-400/50',
  },
};

// ============================================
// Tab Button Component
// ============================================

interface TabButtonProps {
  id: 'fish' | 'bugs' | 'fossils';
  label: string;
  icon: string;
  count: number;
  total: number;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = memo(({ id, label, icon, count, total, isActive, onClick }: TabButtonProps) => (
  <button
    onClick={() => {
      playSound('coin');
      onClick();
    }}
    className={`group relative flex-1 py-4 px-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 ${
      isActive
        ? 'bg-white text-emerald-700 shadow-xl scale-105 -translate-y-1'
        : 'bg-white/20 hover:bg-white/40 text-white'
    }`}
  >
    <span className={`text-3xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </span>
    <span className="font-bold text-sm">{label}</span>
    <div className={`text-xs px-2 py-0.5 rounded-full ${
      isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-white/20'
    }`}>
      {count}/{total}
    </div>
    {/* Progress bar */}
    <div className={`absolute bottom-1 left-3 right-3 h-1 rounded-full overflow-hidden ${
      isActive ? 'bg-emerald-200' : 'bg-white/20'
    }`}>
      <div
        className={`h-full transition-all duration-500 ${
          isActive ? 'bg-emerald-500' : 'bg-white/50'
        }`}
        style={{ width: `${(count / total) * 100}%` }}
      />
    </div>
  </button>
));

TabButton.displayName = 'TabButton';

// ============================================
// Filter Chip Component
// ============================================

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}

const FilterChip = memo(({ label, isActive, onClick, count }: FilterChipProps) => (
  <button
    onClick={() => {
      playSound('coin');
      onClick();
    }}
    className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
      isActive
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
        : 'bg-white text-emerald-700 hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-300'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
        isActive ? 'bg-white/30' : 'bg-emerald-100'
      }`}>
        {count}
      </span>
    )}
  </button>
));

FilterChip.displayName = 'FilterChip';

// ============================================
// Creature Card Component
// ============================================

interface CreatureCardProps {
  item: Fish | Bug | Fossil;
  isCaught: boolean;
  isDonated: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const CreatureCard = memo(({ item, isCaught, isDonated, isSelected, onClick }: CreatureCardProps) => {
  const rarity = 'rarity' in item ? item.rarity : 'rare';
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;

  return (
    <button
      onClick={() => {
        playSound('coin');
        onClick();
      }}
      className={`group relative aspect-square rounded-2xl transition-all duration-300 ${
        isSelected
          ? `ring-4 ring-emerald-400 bg-emerald-100 scale-105 shadow-xl ${config.glow}`
          : isCaught
          ? 'bg-white hover:bg-emerald-50 hover:scale-105 shadow-md hover:shadow-lg'
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-4xl sm:text-5xl transition-all duration-300 ${
          !isCaught ? 'grayscale opacity-30' : 'group-hover:scale-110'
        }`}>
          {item.icon}
        </span>
      </div>

      {/* Rarity indicator */}
      <div className={`absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br ${config.color} shadow-sm`} />

      {/* Donated badge */}
      {isDonated && (
        <div className="absolute top-1 right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-xs">✓</span>
        </div>
      )}

      {/* New badge (caught but not donated) */}
      {isCaught && !isDonated && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-md" />
      )}

      {/* Hover name tooltip */}
      {isCaught && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
            {item.nameEs}
          </div>
        </div>
      )}

      {/* Unknown overlay */}
      {!isCaught && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400 text-3xl">?</span>
        </div>
      )}
    </button>
  );
});

CreatureCard.displayName = 'CreatureCard';

// ============================================
// Detail Panel Component
// ============================================

interface DetailPanelProps {
  item: Fish | Bug | Fossil;
  isCaught: boolean;
  isDonated: boolean;
  record?: number;
  onDonate?: () => void;
}

const DetailPanel = memo(({ item, isCaught, isDonated, record, onDonate }: DetailPanelProps) => {
  const rarity = 'rarity' in item ? item.rarity : 'rare';
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;

  if (!isCaught) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <span className="text-5xl text-gray-400">?</span>
        </div>
        <h3 className="text-xl font-bold text-gray-400 mb-2">Sin descubrir</h3>
        <p className="text-gray-400 text-sm">Encuentra esta criatura para conocer más sobre ella</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* Header with icon */}
      <div className="text-center p-6 bg-gradient-to-b from-emerald-50 to-transparent">
        <div className="relative inline-block">
          <span className="text-7xl drop-shadow-lg animate-float-slow">{item.icon}</span>
          {(rarity === 'rare' || rarity === 'legendary') && (
            <>
              <span className="absolute -top-2 -left-2 text-yellow-400 animate-sparkle">✨</span>
              <span className="absolute -bottom-1 -right-2 text-yellow-400 animate-sparkle delay-150">✨</span>
            </>
          )}
        </div>
        <h3 className="text-2xl font-black text-emerald-800 mt-4">{item.nameEs}</h3>
        <p className="text-emerald-600 text-sm">{item.name}</p>
      </div>

      {/* Rarity badge */}
      <div className="flex justify-center mb-4">
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${config.color} shadow-md`}>
          {config.label}
        </span>
      </div>

      {/* Price */}
      <div className="mx-4 mb-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4 border-2 border-amber-200">
        <div className="flex items-center justify-between">
          <span className="text-amber-700 font-medium">Precio de venta</span>
          <span className="text-2xl font-black text-amber-700 flex items-center gap-1">
            {item.price.toLocaleString()}
            <span className="text-lg">🪙</span>
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-gray-600 text-sm leading-relaxed">{item.descriptionEs}</p>
      </div>

      {/* Fish/Bug specific info */}
      {'activeHours' in item && (
        <div className="mx-4 mb-4 space-y-3">
          <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-blue-600 font-medium flex items-center gap-2">
              <span>🕐</span> Horario
            </span>
            <span className="text-blue-700 font-bold">
              {item.activeHours[0] === 0 && item.activeHours[1] === 24
                ? 'Todo el día'
                : `${item.activeHours[0]}:00 - ${item.activeHours[1]}:00`}
            </span>
          </div>

          {'location' in item && (
            <div className="bg-cyan-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-cyan-600 font-medium flex items-center gap-2">
                <span>📍</span> Ubicación
              </span>
              <span className="text-cyan-700 font-bold capitalize">{item.location}</span>
            </div>
          )}

          {'shadowSize' in item && (
            <div className="bg-indigo-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-indigo-600 font-medium flex items-center gap-2">
                <span>👁️</span> Sombra
              </span>
              <span className="text-indigo-700 font-bold">
                {'●'.repeat(item.shadowSize)}{'○'.repeat(6 - item.shadowSize)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Fossil specific info */}
      {'dinoName' in item && (
        <div className="mx-4 mb-4 space-y-3">
          <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-orange-600 font-medium flex items-center gap-2">
              <span>🦖</span> Dinosaurio
            </span>
            <span className="text-orange-700 font-bold">{item.dinoName}</span>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-amber-600 font-medium flex items-center gap-2">
              <span>🦴</span> Parte
            </span>
            <span className="text-amber-700 font-bold capitalize">{item.part}</span>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-wide mb-1">Dato curioso</p>
            <p className="text-blue-800 text-sm">{item.funFactEs}</p>
          </div>
        </div>
      )}

      {/* Catch phrase */}
      {'catchPhraseEs' in item && (
        <div className="mx-4 mb-4 bg-gradient-to-r from-emerald-100 to-green-100 rounded-2xl p-4 border-2 border-emerald-200">
          <p className="text-emerald-700 italic text-center font-medium">"{item.catchPhraseEs}"</p>
        </div>
      )}

      {/* Record (for fish) */}
      {record && (
        <div className="mx-4 mb-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 text-center border-2 border-purple-200">
          <p className="text-purple-600 text-sm font-medium">Tu récord personal</p>
          <p className="text-3xl font-black text-purple-700">{record} cm</p>
        </div>
      )}

      {/* Status badges */}
      <div className="mx-4 mb-4 flex flex-wrap gap-2">
        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
          <span>✓</span> Atrapado
        </span>
        {isDonated ? (
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold flex items-center gap-2">
            <span>🏛️</span> Donado al museo
          </span>
        ) : (
          <button
            onClick={() => {
              playSound('achievement');
              onDonate?.();
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-sm font-bold flex items-center gap-2 hover:shadow-lg transition-all hover:scale-105"
          >
            <span>🏛️</span> Donar al museo
          </button>
        )}
      </div>
    </div>
  );
});

DetailPanel.displayName = 'DetailPanel';

// ============================================
// Stats Footer Component
// ============================================

interface StatsFooterProps {
  stats: {
    totalFishCaught: number;
    totalBugsCaught: number;
    totalFossilsFound: number;
    raresCaught: number;
  };
}

const StatsFooter = memo(({ stats }: StatsFooterProps) => (
  <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-4 grid grid-cols-4 gap-4">
    {[
      { value: stats.totalFishCaught, label: 'Peces', icon: '🐟' },
      { value: stats.totalBugsCaught, label: 'Insectos', icon: '🦋' },
      { value: stats.totalFossilsFound, label: 'Fósiles', icon: '🦴' },
      { value: stats.raresCaught, label: 'Raros', icon: '⭐' },
    ].map(({ value, label, icon }) => (
      <div key={label} className="text-center">
        <div className="text-2xl mb-1">{icon}</div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-white/80">{label}</p>
      </div>
    ))}
  </div>
));

StatsFooter.displayName = 'StatsFooter';

// ============================================
// Main Component
// ============================================

export function CritterpediaPanel({ onClose, initialTab = 'fish' }: CritterpediaPanelProps) {
  const [activeTab, setActiveTab] = useState<'fish' | 'bugs' | 'fossils'>(initialTab);
  const [selectedItem, setSelectedItem] = useState<Fish | Bug | Fossil | null>(null);
  const [filter, setFilter] = useState<'all' | 'caught' | 'donated' | 'missing'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'price' | 'rarity'>('id');
  const [isClosing, setIsClosing] = useState(false);

  const collection = useActivityStore((s) => s.collection);
  const museumDonations = useActivityStore((s) => s.museumDonations);
  const stats = useActivityStore((s) => s.stats);
  const donateToMuseum = useActivityStore((s) => s.donateToMuseum);

  // Calculate completion stats
  const fishStats = useMemo(() => ({
    total: FISH_DATA.length,
    caught: collection.fish.caught.length,
    donated: museumDonations.fish.length,
  }), [collection.fish.caught, museumDonations.fish]);

  const bugStats = useMemo(() => ({
    total: BUG_DATA.length,
    caught: collection.bugs.caught.length,
    donated: museumDonations.bugs.length,
  }), [collection.bugs.caught, museumDonations.bugs]);

  const fossilStats = useMemo(() => ({
    total: FOSSIL_DATA.length,
    found: collection.fossils.found.length,
    donated: museumDonations.fossils.length,
  }), [collection.fossils, museumDonations.fossils]);

  // Filter and sort items
  const { items, caughtIds, donatedIds } = useMemo(() => {
    let items: (Fish | Bug | Fossil)[] = [];
    let caughtIds: string[] = [];
    let donatedIds: string[] = [];

    if (activeTab === 'fish') {
      items = FISH_DATA;
      caughtIds = collection.fish.caught;
      donatedIds = museumDonations.fish;
    } else if (activeTab === 'bugs') {
      items = BUG_DATA;
      caughtIds = collection.bugs.caught;
      donatedIds = museumDonations.bugs;
    } else {
      items = FOSSIL_DATA;
      caughtIds = collection.fossils.found;
      donatedIds = museumDonations.fossils;
    }

    // Apply filter
    if (filter === 'caught') {
      items = items.filter(item => caughtIds.includes(item.id));
    } else if (filter === 'donated') {
      items = items.filter(item => donatedIds.includes(item.id));
    } else if (filter === 'missing') {
      items = items.filter(item => !caughtIds.includes(item.id));
    }

    // Apply sort
    items = [...items].sort((a, b) => {
      if (sortBy === 'name') return a.nameEs.localeCompare(b.nameEs);
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'rarity' && 'rarity' in a && 'rarity' in b) {
        const rarityOrder = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      }
      return 0;
    });

    return { items, caughtIds, donatedIds };
  }, [activeTab, filter, sortBy, collection, museumDonations]);

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: activeTab === 'fish' ? FISH_DATA.length : activeTab === 'bugs' ? BUG_DATA.length : FOSSIL_DATA.length,
    caught: caughtIds.length,
    donated: donatedIds.length,
    missing: (activeTab === 'fish' ? FISH_DATA.length : activeTab === 'bugs' ? BUG_DATA.length : FOSSIL_DATA.length) - caughtIds.length,
  }), [activeTab, caughtIds, donatedIds]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  const handleDonate = useCallback(() => {
    if (selectedItem) {
      const type = activeTab === 'fish' ? 'fish' : activeTab === 'bugs' ? 'bug' : 'fossil';
      donateToMuseum(type, selectedItem.id);
    }
  }, [selectedItem, activeTab, donateToMuseum]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-gradient-to-b from-emerald-100 via-green-50 to-emerald-100 rounded-3xl w-full max-w-5xl h-[85vh] mx-4 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-5 text-white relative overflow-hidden">
          {/* Decorative leaves */}
          <div className="absolute top-0 right-0 text-6xl opacity-20 transform rotate-12">🍃</div>
          <div className="absolute bottom-0 left-10 text-4xl opacity-20 transform -rotate-12">🌿</div>

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                <span className="text-4xl">📖</span>
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Critterpedia</h2>
                <p className="text-emerald-100">Tu enciclopedia de criaturas</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 hover:rotate-90"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mt-6">
            <TabButton
              id="fish"
              label="Peces"
              icon="🐟"
              count={fishStats.caught}
              total={fishStats.total}
              isActive={activeTab === 'fish'}
              onClick={() => { setActiveTab('fish'); setSelectedItem(null); }}
            />
            <TabButton
              id="bugs"
              label="Insectos"
              icon="🦋"
              count={bugStats.caught}
              total={bugStats.total}
              isActive={activeTab === 'bugs'}
              onClick={() => { setActiveTab('bugs'); setSelectedItem(null); }}
            />
            <TabButton
              id="fossils"
              label="Fósiles"
              icon="🦴"
              count={fossilStats.found}
              total={fossilStats.total}
              isActive={activeTab === 'fossils'}
              onClick={() => { setActiveTab('fossils'); setSelectedItem(null); }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-emerald-200 flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 flex-wrap">
            <FilterChip label="Todos" isActive={filter === 'all'} onClick={() => setFilter('all')} count={filterCounts.all} />
            <FilterChip label="Atrapados" isActive={filter === 'caught'} onClick={() => setFilter('caught')} count={filterCounts.caught} />
            <FilterChip label="Donados" isActive={filter === 'donated'} onClick={() => setFilter('donated')} count={filterCounts.donated} />
            <FilterChip label="Faltantes" isActive={filter === 'missing'} onClick={() => setFilter('missing')} count={filterCounts.missing} />
          </div>

          <div className="flex-1" />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded-xl bg-white border-2 border-emerald-200 text-emerald-700 font-medium focus:border-emerald-400 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="id">Por defecto</option>
            <option value="name">Por nombre</option>
            <option value="price">Por precio</option>
            <option value="rarity">Por rareza</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Grid */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gradient-to-b from-white/50 to-emerald-50/50">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-6xl mb-4">🔍</span>
                <h3 className="text-xl font-bold text-gray-400">No hay resultados</h3>
                <p className="text-gray-400">Intenta con otro filtro</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {items.map((item) => (
                  <CreatureCard
                    key={item.id}
                    item={item}
                    isCaught={caughtIds.includes(item.id)}
                    isDonated={donatedIds.includes(item.id)}
                    isSelected={selectedItem?.id === item.id}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className={`w-80 bg-white border-l-2 border-emerald-200 transition-all duration-300 ${
            selectedItem ? 'translate-x-0' : 'translate-x-full hidden sm:block sm:translate-x-0'
          }`}>
            {selectedItem ? (
              <DetailPanel
                item={selectedItem}
                isCaught={caughtIds.includes(selectedItem.id)}
                isDonated={donatedIds.includes(selectedItem.id)}
                record={activeTab === 'fish' ? collection.fish.records[selectedItem.id] : undefined}
                onDonate={handleDonate}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-4xl">👆</span>
                </div>
                <h3 className="text-lg font-bold text-gray-400">Selecciona una criatura</h3>
                <p className="text-gray-400 text-sm">para ver más detalles</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer stats */}
        <StatsFooter stats={stats} />
      </div>

      {/* Custom styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-slow {
          animation: float-slow 3s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }
        .delay-150 {
          animation-delay: 0.15s;
        }
      `}</style>
    </div>
  );
}

export default CritterpediaPanel;
