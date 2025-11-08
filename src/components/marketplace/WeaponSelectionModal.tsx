import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface Weapon {
  itemId: number;
  name: string;
  imageUrl?: string;
}

interface WeaponSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  weapons: Weapon[];
  onSelect: (weaponId: number) => void;
  itemName: string;
}

export default function WeaponSelectionModal({
  isOpen,
  onClose,
  weapons,
  onSelect,
  itemName
}: WeaponSelectionModalProps) {
  const [selectedWeapon, setSelectedWeapon] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedWeapon !== null) {
      onSelect(selectedWeapon);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-60"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl z-70 border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Selecciona tu Arma</h2>
            <p className="text-gray-400 text-sm mt-1">Elige el arma para tu {itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Weapons Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {weapons.map((weapon) => (
              <button
                key={weapon.itemId}
                onClick={() => setSelectedWeapon(weapon.itemId)}
                className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedWeapon === weapon.itemId
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                {/* Checkmark */}
                {selectedWeapon === weapon.itemId && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}

                {/* Weapon Image */}
                <div className="h-24 flex items-center justify-center mb-3">
                  {weapon.imageUrl ? (
                    <img
                      src={weapon.imageUrl}
                      alt={weapon.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-xs">#{weapon.itemId}</span>
                    </div>
                  )}
                </div>

                {/* Weapon Name */}
                <p className="text-white text-sm font-semibold text-center">
                  {weapon.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedWeapon === null}
            className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Selección
          </button>
        </div>
      </div>
    </>
  );
}
