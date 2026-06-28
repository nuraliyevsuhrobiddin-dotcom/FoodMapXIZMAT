import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Dish, Language } from '../../types';

interface MenuSectionProps {
  dishes: Dish[];
  openDishModal: (dish: Dish | null) => void;
  handleDeleteDish: (id: string) => void;
  language: Language;
  t: any;
  formatPrice: (num: number) => string;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  dishes,
  openDishModal,
  handleDeleteDish,
  language,
  t,
  formatPrice,
}) => {
  return (
    <div className="space-y-6" id="menu-tab-content">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h2 className="text-lg font-serif text-amber-100 font-semibold">
          Taomlar va Narxlar Menyusi ({dishes.length} taom)
        </h2>

        <button
          id="btn-add-new-dish"
          onClick={() => openDishModal(null)}
          className="gold-btn text-xs py-2.5 px-4 rounded-lg flex items-center gap-1.5 uppercase font-semibold cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t.addDish}
        </button>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.map(dish => (
          <div
            key={dish.id}
            className="glass-card rounded-xl border border-amber-500/10 flex flex-col justify-between overflow-hidden"
            id={`admin-dish-item-${dish.id}`}
          >
            <div className="p-4 flex gap-3">
              <img
                src={dish.image}
                alt={dish.name[language]}
                className="w-16 h-16 object-cover rounded-lg border border-neutral-800 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-amber-100 truncate">
                    {dish.name[language]}
                  </h3>
                </div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5 font-semibold">
                  {dish.category}
                </p>
                <p className="text-xs text-amber-400 font-mono font-bold mt-1.5 flex items-center gap-1">
                  {formatPrice(dish.price)}
                  <span className="text-[10px] text-neutral-500 font-sans font-normal">
                    / {dish.unit === 'kg' ? t.kg : t.pcs}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions / Attributes bar */}
            <div className="px-4 py-2.5 bg-neutral-950 border-t border-neutral-900 flex justify-between items-center text-[10px]">
              <div className="flex gap-2">
                {dish.isPopular && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono">POP</span>}
                {dish.isRecommended && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono">REC</span>}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  id={`btn-edit-dish-${dish.id}`}
                  onClick={() => openDishModal(dish)}
                  className="p-1.5 rounded hover:bg-amber-500/10 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                  title={t.editDish}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  id={`btn-delete-dish-${dish.id}`}
                  onClick={() => handleDeleteDish(dish.id)}
                  className="p-1.5 rounded hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title={t.deleteDish}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
