import React, { useEffect } from 'react';
import { useGameStore } from '../../store';
import { InventoryItem } from '../../types';

const InventorySlot: React.FC<{ item?: InventoryItem; onClick?: () => void }> = ({ item, onClick }) => {
    return (
        <div
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 flex items-center justify-center relative cursor-pointer hover:bg-white/30 transition-all"
            onClick={onClick}
        >
            {item ? (
                <>
                    <span className="text-3xl filter drop-shadow-md">{item.icon}</span>
                    {item.count > 1 && (
                        <span className="absolute bottom-1 right-1 text-xs font-bold text-white bg-black/50 px-1.5 rounded-full">
                            {item.count}
                        </span>
                    )}
                </>
            ) : (
                <div className="w-2 h-2 bg-white/10 rounded-full" />
            )}
        </div>
    );
};

export const Inventory: React.FC = () => {
    const inventory = useGameStore((state) => state.inventory);
    const [isOpen, setIsOpen] = React.useState(false);

    // Toggle with 'I' key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'i') {
                setIsOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    // Create a grid of 20 slots
    const slots = Array.from({ length: 20 }).map((_, index) => inventory[index]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">Mochila</h2>
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-400/20 px-4 py-2 rounded-full border border-yellow-400/50 flex items-center gap-2">
                            <span>💰</span>
                            <span className="font-bold text-yellow-100">{useGameStore.getState().coins}</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                    {slots.map((item, index) => (
                        <InventorySlot
                            key={index}
                            item={item}
                            onClick={() => {
                                if (item) {
                                    console.log('Clicked item:', item.name);
                                    // Future: Show item details/actions
                                }
                            }}
                        />
                    ))}
                </div>

                <div className="mt-6 text-center text-white/50 text-sm">
                    Presiona 'I' para cerrar
                </div>
            </div>
        </div>
    );
};
