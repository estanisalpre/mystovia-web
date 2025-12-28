import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import '../../i18n';

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
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedWeapon !== null) {
      onSelect(selectedWeapon);
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden p-0 backdrop:bg-black/70"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="weapon-modal-title"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800">
        <hgroup>
          <h2 id="weapon-modal-title" className="text-2xl font-bold text-white">{t('weaponModal.title')}</h2>
          <p className="text-gray-400 text-sm mt-1">{t('weaponModal.subtitle')} {itemName}</p>
        </hgroup>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          type="button"
          aria-label="Cerrar"
        >
          <X size={24} aria-hidden="true" />
        </button>
      </header>

      {/* Weapons Grid */}
      <section className="p-6" aria-label="Lista de armas">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 list-none p-0 m-0">
          {weapons.map((weapon) => (
            <li key={weapon.itemId}>
              <button
                onClick={() => setSelectedWeapon(weapon.itemId)}
                className={`relative w-full p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedWeapon === weapon.itemId
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
                type="button"
                aria-pressed={selectedWeapon === weapon.itemId}
              >
                {/* Checkmark */}
                {selectedWeapon === weapon.itemId && (
                  <mark className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={16} className="text-white" aria-hidden="true" />
                  </mark>
                )}

                {/* Weapon Image */}
                <figure className="h-24 flex items-center justify-center mb-3 m-0">
                  {weapon.imageUrl ? (
                    <img
                      src={weapon.imageUrl}
                      alt={weapon.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <figcaption className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-xs">#{weapon.itemId}</span>
                    </figcaption>
                  )}
                </figure>

                {/* Weapon Name */}
                <p className="text-white text-sm font-semibold text-center m-0">
                  {weapon.name}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="p-6 border-t border-gray-800 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
          type="button"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleConfirm}
          disabled={selectedWeapon === null}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          {t('weaponModal.confirmSelection')}
        </button>
      </footer>
    </dialog>
  );
}
