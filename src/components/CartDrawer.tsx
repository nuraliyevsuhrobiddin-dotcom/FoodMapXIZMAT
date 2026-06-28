/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CartItem, Language, translations } from '../types';
import { X, Plus, Minus, Trash2, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { getRestaurantSettings } from '../lib/storage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (dishId: string, quantity: number) => void;
  onRemoveItem: (dishId: string) => void;
  onCheckout: (notes: string) => void;
  language: Language;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  language,
}: CartDrawerProps) {
  const t = translations[language];
  const settings = getRestaurantSettings();
  const subtotal = cartItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const serviceChargeAmount = Math.round(subtotal * (settings.serviceChargePercent / 100));
  const sittingFeeAmount = subtotal > 0 ? settings.tableSittingFee : 0;
  const grandTotal = subtotal + serviceChargeAmount + sittingFeeAmount;

  const formatPrice = (num: number) => {
    return num.toLocaleString('uz-UZ') + ' ' + t.currency;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        id="cart-backdrop"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10" id="cart-pane-wrapper">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-screen max-w-md bg-[#0a0a0a] border-l border-amber-500/20 flex flex-col h-full shadow-2xl relative"
          id="cart-pane"
        >
          {/* Header */}
          <div className="px-4 py-5 border-b border-amber-500/10 flex items-center justify-between bg-neutral-950">
            <h2 className="text-lg font-serif font-semibold text-amber-100 flex items-center gap-2">
              <span>{t.cartTitle}</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-sans">
                {cartItems.reduce((acc, item) => acc + (item.dish.unit === 'kg' ? 1 : item.quantity), 0)}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-amber-400 p-1 cursor-pointer"
              id="btn-close-cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12" id="cart-empty-state">
                <div className="w-16 h-16 rounded-full border border-dashed border-neutral-800 flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-400 max-w-xs">{t.emptyCart}</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.dish.id}
                  className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-3 flex gap-3 items-center"
                  id={`cart-item-${item.dish.id}`}
                >
                  <img
                    src={item.dish.image}
                    alt={item.dish.name[language]}
                    className="w-16 h-16 object-cover rounded-md border border-neutral-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-amber-100 truncate">
                      {item.dish.name[language]}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 mt-1">
                      <span className="text-xs text-amber-400/80 font-medium">
                        {formatPrice(item.dish.price)} {item.dish.unit === 'kg' ? `/ ${t.kg}` : ''}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        ({language === 'uz' ? 'Jami' : language === 'ru' ? 'Всего' : 'Total'}: {formatPrice(item.dish.price * item.quantity)})
                      </span>
                    </div>
                    
                    {/* Quantity / Weight Selector */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-neutral-800 rounded bg-black/40">
                        <button
                          onClick={() => {
                            if (item.dish.unit === 'kg') {
                              onUpdateQuantity(item.dish.id, Math.max(0.1, Number((item.quantity - 0.1).toFixed(1))));
                            } else {
                              onUpdateQuantity(item.dish.id, item.quantity - 1);
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                          id={`btn-cart-dec-${item.dish.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-amber-100 font-semibold px-2 font-mono whitespace-nowrap">
                          {item.quantity} {item.dish.unit === 'kg' ? t.kg : t.pcs}
                        </span>
                        <button
                          onClick={() => {
                            if (item.dish.unit === 'kg') {
                              onUpdateQuantity(item.dish.id, Number((item.quantity + 0.1).toFixed(1)));
                            } else {
                              onUpdateQuantity(item.dish.id, item.quantity + 1);
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                          id={`btn-cart-inc-${item.dish.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.dish.id)}
                    className="text-neutral-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer self-start"
                    id={`btn-cart-remove-${item.dish.id}`}
                    title={t.deleteDish}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer Section */}
          {cartItems.length > 0 && (
            <div className="border-t border-amber-500/15 p-4 bg-neutral-950 space-y-4">
              {/* Order Notes */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-amber-500/60" />
                  {t.orderNotes}
                </label>
                <textarea
                  id="cart-order-notes"
                  placeholder={t.orderNotesPlaceholder}
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-amber-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/40"
                />
              </div>

              {/* Total Calculation */}
              <div className="space-y-1.5 border-t border-neutral-900 pt-3">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>{language === 'uz' ? 'Subtotal' : language === 'ru' ? 'Подытог' : 'Subtotal'}:</span>
                  <span className="font-mono">{formatPrice(subtotal)}</span>
                </div>
                {settings.serviceChargePercent > 0 && (
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>{t.serviceCharge} ({settings.serviceChargePercent}%):</span>
                    <span className="font-mono">+{formatPrice(serviceChargeAmount)}</span>
                  </div>
                )}
                {settings.tableSittingFee > 0 && (
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>{t.tableSittingFee}:</span>
                    <span className="font-mono">+{formatPrice(sittingFeeAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                  <span className="text-xs text-neutral-200 font-bold uppercase tracking-wider">{t.total}:</span>
                  <span className="text-xl font-serif font-bold text-amber-400 font-mono">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Place Order Trigger */}
              <button
                id="btn-confirm-order"
                onClick={() => {
                  const notesInput = document.getElementById('cart-order-notes') as HTMLTextAreaElement | null;
                  onCheckout(notesInput?.value || '');
                }}
                className="w-full gold-btn py-3.5 px-6 rounded-lg text-xs font-semibold tracking-wider uppercase transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {t.placeOrder}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
