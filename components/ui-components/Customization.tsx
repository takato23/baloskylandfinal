/**
 * Character Customization Modal
 * Sistema de personalización estilo Animal Crossing
 * Diseñado para la comunidad argentina de @Balosky
 */

import React, { memo, useCallback, useState } from 'react';
import { useGameStore } from '../../store';
import { ANIMAL_TYPES, ACCESSORY_TYPES } from '../../types';
import type { AnimalType, AccessoryType } from '../../types';

interface CustomizationProps {
  onClose: () => void;
}

// Emojis para cada animal (estilo AC)
const ANIMAL_EMOJIS: Record<AnimalType, string> = {
  bear: '🐻', cat: '🐱', rabbit: '🐰', fox: '🦊', dog: '🐶',
  panda: '🐼', koala: '🐨', lion: '🦁', pig: '🐷', chicken: '🐔',
  elephant: '🐘', sheep: '🐑', penguin: '🐧', duck: '🦆', zebra: '🦓',
  mouse: '🐭', cow: '🐮', frog: '🐸', monkey: '🐵', tiger: '🐯',
  raccoon: '🦝', deer: '🦌', hedgehog: '🦔', beaver: '🦫', platypus: '🥚',
};

const ANIMAL_DISPLAY_NAMES: Record<AnimalType, string> = {
  bear: 'Oso', cat: 'Gato', rabbit: 'Conejo', fox: 'Zorro', dog: 'Perro',
  panda: 'Panda', koala: 'Koala', lion: 'León', pig: 'Cerdo', chicken: 'Pollo',
  elephant: 'Elefante', sheep: 'Oveja', penguin: 'Pingüino', duck: 'Pato', zebra: 'Cebra',
  mouse: 'Ratón', cow: 'Vaca', frog: 'Rana', monkey: 'Mono', tiger: 'Tigre',
  raccoon: 'Mapache', deer: 'Ciervo', hedgehog: 'Erizo', beaver: 'Castor', platypus: 'Ornitorrinco',
};

const ACCESSORY_DISPLAY_NAMES: Record<AccessoryType, string> = {
  none: 'Ninguno',
  backpack: 'Mochila',
  glasses: 'Anteojos',
  hat: 'Sombrero',
  mate: 'Mate 🧉',
  phone: 'Teléfono',
  scarf: 'Bufanda',
  // Nuevos accesorios argentinos
  boina: 'Boina Gaucha',
  gorraArgentina: 'Gorra Argentina 🇦🇷',
  banderin: 'Banderín',
  alfajor: 'Alfajor',
  termo: 'Termo',
  camisetaArg: 'Camiseta Arg',
};

const ACCESSORY_EMOJIS: Record<AccessoryType, string> = {
  none: '❌', backpack: '🎒', glasses: '👓', hat: '🎩', mate: '🧉',
  phone: '📱', scarf: '🧣', boina: '🎭', gorraArgentina: '🇦🇷',
  banderin: '🚩', alfajor: '🍫', termo: '🫖', camisetaArg: '👕',
};

// Presets de outfits temáticos argentinos
interface OutfitPreset {
  name: string;
  icon: string;
  description: string;
  type?: AnimalType;
  skin: string;
  shirt: string;
  pants: string;
  accessory: AccessoryType;
}

const OUTFIT_PRESETS: OutfitPreset[] = [
  {
    name: 'Gaucho',
    icon: '🤠',
    description: 'Estilo pampeano tradicional',
    skin: '#e0ac69',
    shirt: '#8B4513',
    pants: '#1a1a1a',
    accessory: 'boina',
  },
  {
    name: 'Selección',
    icon: '⚽',
    description: 'Vamos Argentina!',
    skin: '#fcd5ce',
    shirt: '#75AADB',
    pants: '#ffffff',
    accessory: 'gorraArgentina',
  },
  {
    name: 'Porteño',
    icon: '🏙️',
    description: 'Estilo Buenos Aires',
    skin: '#ffdbac',
    shirt: '#2c2c2c',
    pants: '#1a1a1a',
    accessory: 'glasses',
  },
  {
    name: 'Matero',
    icon: '🧉',
    description: 'Con mate en mano',
    skin: '#d4a574',
    shirt: '#228B22',
    pants: '#4a4a4a',
    accessory: 'mate',
  },
  {
    name: 'Skater BA',
    icon: '🛹',
    description: 'Urbano y moderno',
    skin: '#fcd5ce',
    shirt: '#ff6b6b',
    pants: '#2d3436',
    accessory: 'backpack',
  },
  {
    name: 'Indie',
    icon: '🎸',
    description: 'Onda alternativa',
    skin: '#f5cba7',
    shirt: '#9b59b6',
    pants: '#2c3e50',
    accessory: 'scarf',
  },
  {
    name: 'Veranito',
    icon: '☀️',
    description: 'Calorcito argento',
    skin: '#e0ac69',
    shirt: '#f39c12',
    pants: '#3498db',
    accessory: 'hat',
  },
  {
    name: 'Patagónico',
    icon: '🏔️',
    description: 'Sur argentino',
    skin: '#fcd5ce',
    shirt: '#c0392b',
    pants: '#34495e',
    accessory: 'scarf',
  },
];

// Paleta de colores populares argentinos
const COLOR_PRESETS = {
  skin: [
    { color: '#fcd5ce', name: 'Rosado claro' },
    { color: '#ffdbac', name: 'Durazno' },
    { color: '#e0ac69', name: 'Bronceado' },
    { color: '#d4a574', name: 'Canela' },
    { color: '#8d5524', name: 'Moreno' },
    { color: '#c68642', name: 'Caramelo' },
  ],
  shirt: [
    { color: '#75AADB', name: 'Celeste Argentina' },
    { color: '#ff6b6b', name: 'Coral' },
    { color: '#2c2c2c', name: 'Negro BA' },
    { color: '#228B22', name: 'Verde Mate' },
    { color: '#9b59b6', name: 'Violeta' },
    { color: '#f39c12', name: 'Naranja Sol' },
    { color: '#e74c3c', name: 'Rojo River' },
    { color: '#0033a0', name: 'Azul Boca' },
  ],
  pants: [
    { color: '#1a1a1a', name: 'Negro' },
    { color: '#ffffff', name: 'Blanco' },
    { color: '#2d3436', name: 'Gris oscuro' },
    { color: '#4a90e2', name: 'Jean clásico' },
    { color: '#34495e', name: 'Azul noche' },
    { color: '#8B4513', name: 'Marrón gaucho' },
  ],
};

// Tabs para organizar la UI
type CustomizationTab = 'presets' | 'animal' | 'colors' | 'accessory';

export const Customization: React.FC<CustomizationProps> = memo(({ onClose }) => {
  const character = useGameStore((s) => s.character);
  const setSkin = useGameStore((s) => s.setSkin);
  const setShirt = useGameStore((s) => s.setShirt);
  const setPants = useGameStore((s) => s.setPants);
  const setType = useGameStore((s) => s.setType);
  const setAccessory = useGameStore((s) => s.setAccessory);
  const setCharacter = useGameStore((s) => s.setCharacter);

  const [activeTab, setActiveTab] = useState<CustomizationTab>('presets');

  const handleTypeClick = useCallback(
    (type: AnimalType) => {
      setType(type);
    },
    [setType]
  );

  const handleAccessoryClick = useCallback(
    (acc: AccessoryType) => {
      setAccessory(acc);
    },
    [setAccessory]
  );

  const handlePresetClick = useCallback(
    (preset: OutfitPreset) => {
      setCharacter({
        ...(preset.type && { type: preset.type }),
        skin: preset.skin,
        shirt: preset.shirt,
        pants: preset.pants,
        accessory: preset.accessory,
      });
    },
    [setCharacter]
  );

  const handleSkinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSkin(e.target.value);
    },
    [setSkin]
  );

  const handleShirtChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShirt(e.target.value);
    },
    [setShirt]
  );

  const handlePantsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPants(e.target.value);
    },
    [setPants]
  );

  return (
    <div
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-[100] pointer-events-auto backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gradient-to-b from-amber-50 to-orange-50 p-0 rounded-3xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[92vh] overflow-hidden m-2 sm:m-3 animate-in zoom-in-95 duration-200 border-4 border-amber-200">
        {/* Header - Estilo Animal Crossing (compacto en móvil) */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b-4 border-amber-600/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-2xl sm:text-3xl animate-bounce">{ANIMAL_EMOJIS[character.type]}</div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow-md">Mi Personaje</h2>
              <p className="text-[10px] sm:text-xs text-amber-100">by @Balosky</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/40 active:bg-white/50 text-white font-bold text-lg sm:text-xl w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all active:scale-90 touch-manipulation"
            aria-label="Cerrar"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            ✕
          </button>
        </div>

        {/* Tabs de navegación - Estilo AC (optimizado touch) */}
        <div className="flex bg-amber-100/50 border-b-2 border-amber-200">
          {[
            { id: 'presets' as const, label: 'Outfits', icon: '👔' },
            { id: 'animal' as const, label: 'Animal', icon: '🐾' },
            { id: 'colors' as const, label: 'Colores', icon: '🎨' },
            { id: 'accessory' as const, label: 'Items', icon: '✨' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-bold transition-all touch-manipulation min-h-[52px] ${
                activeTab === tab.id
                  ? 'bg-white text-amber-700 border-b-4 border-amber-500 -mb-0.5'
                  : 'text-amber-600 hover:bg-amber-100 active:bg-amber-200'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="block text-xl sm:text-lg">{tab.icon}</span>
              <span className="text-[10px] sm:text-xs">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido scrolleable (más espacio en móvil) */}
        <div className="p-3 sm:p-5 overflow-y-auto max-h-[50vh] sm:max-h-[55vh] space-y-4 sm:space-y-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* TAB: Presets de Outfits */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-sm text-amber-700 font-medium text-center">
                🇦🇷 Estilos argentinos listos para usar
              </p>
              <div className="grid grid-cols-2 gap-3">
                {OUTFIT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset)}
                    className="group bg-white rounded-xl p-3 border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl group-hover:animate-bounce">{preset.icon}</span>
                      <span className="font-bold text-amber-800">{preset.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{preset.description}</p>
                    {/* Mini preview de colores */}
                    <div className="flex gap-1 mt-2">
                      <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: preset.shirt }} />
                      <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: preset.pants }} />
                      <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: preset.skin }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Selección de Animal */}
          {activeTab === 'animal' && (
            <div className="space-y-4">
              <p className="text-sm text-amber-700 font-medium text-center">
                🐾 Elegí tu vecino favorito
              </p>
              <div className="grid grid-cols-5 gap-2">
                {ANIMAL_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeClick(type)}
                    className={`p-2 rounded-xl text-center transition-all transform hover:scale-110 ${
                      character.type === type
                        ? 'bg-amber-400 shadow-lg ring-2 ring-amber-500 scale-105'
                        : 'bg-white hover:bg-amber-100 border-2 border-amber-200'
                    }`}
                    title={ANIMAL_DISPLAY_NAMES[type]}
                  >
                    <span className="text-2xl block">{ANIMAL_EMOJIS[type]}</span>
                    <span className="text-[10px] text-gray-600 block truncate">{ANIMAL_DISPLAY_NAMES[type]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Colores */}
          {activeTab === 'colors' && (
            <div className="space-y-5">
              {/* Color de piel */}
              <div className="bg-white rounded-xl p-4 border-2 border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    👤 Piel
                  </label>
                  <input
                    type="color"
                    value={character.skin}
                    onChange={handleSkinChange}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-amber-300"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.skin.map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => setSkin(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                        character.skin === color ? 'ring-2 ring-amber-500 ring-offset-2 border-amber-400' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
              </div>

              {/* Color de remera */}
              <div className="bg-white rounded-xl p-4 border-2 border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    👕 Remera
                  </label>
                  <input
                    type="color"
                    value={character.shirt}
                    onChange={handleShirtChange}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-amber-300"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.shirt.map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => setShirt(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                        character.shirt === color ? 'ring-2 ring-amber-500 ring-offset-2 border-amber-400' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
              </div>

              {/* Color de pantalones */}
              <div className="bg-white rounded-xl p-4 border-2 border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    👖 Pantalones
                  </label>
                  <input
                    type="color"
                    value={character.pants}
                    onChange={handlePantsChange}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-amber-300"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.pants.map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => setPants(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                        character.pants === color ? 'ring-2 ring-amber-500 ring-offset-2 border-amber-400' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Accesorios */}
          {activeTab === 'accessory' && (
            <div className="space-y-4">
              <p className="text-sm text-amber-700 font-medium text-center">
                ✨ Dale onda a tu personaje
              </p>
              <div className="grid grid-cols-3 gap-3">
                {ACCESSORY_TYPES.map((acc) => (
                  <button
                    key={acc}
                    onClick={() => handleAccessoryClick(acc)}
                    className={`p-3 rounded-xl text-center transition-all transform hover:scale-105 ${
                      character.accessory === acc
                        ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white shadow-lg'
                        : 'bg-white hover:bg-purple-50 border-2 border-purple-200 text-gray-700'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{ACCESSORY_EMOJIS[acc]}</span>
                    <span className="text-xs font-medium block">{ACCESSORY_DISPLAY_NAMES[acc]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer con preview y botón - Estilo AC (optimizado móvil) */}
        <div className="bg-gradient-to-t from-amber-100 to-transparent px-3 sm:px-5 py-3 sm:py-4 border-t-2 border-amber-200 safe-area-inset-bottom">
          {/* Preview actual */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-2 bg-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-inner border-2 border-amber-200">
              <span className="text-xl sm:text-2xl">{ANIMAL_EMOJIS[character.type]}</span>
              <div className="flex gap-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 shadow-sm" style={{ backgroundColor: character.skin }} title="Piel" />
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 shadow-sm" style={{ backgroundColor: character.shirt }} title="Remera" />
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 shadow-sm" style={{ backgroundColor: character.pants }} title="Pantalón" />
              </div>
              <span className="text-base sm:text-lg">{ACCESSORY_EMOJIS[character.accessory]}</span>
            </div>
          </div>

          {/* Botón confirmar - optimizado para touch */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-500 hover:from-green-500 hover:via-emerald-600 hover:to-green-600 text-white font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] border-b-4 border-green-700 text-base sm:text-lg touch-manipulation min-h-[52px]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            ¡Listo! 🎉
          </button>
        </div>
      </div>
    </div>
  );
});

Customization.displayName = 'Customization';
