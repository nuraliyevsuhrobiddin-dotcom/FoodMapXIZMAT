import React from 'react';
import { Search, X, FileText } from 'lucide-react';
import { Order, Dish, Language, OrderStatus } from '../../types';
import { updateOrderPaymentStatus } from '../../lib/storage';

interface OrdersSectionProps {
  activeOrders: Order[];
  orderSearchQuery: string;
  setOrderSearchQuery: (val: string) => void;
  filteredActiveOrders: Order[];
  handleUpdateStatus: (id: string, status: OrderStatus) => void;
  language: Language;
  t: any;
  formatPrice: (num: number) => string;
  dishes: Dish[];
  loadLatestData: () => Promise<void>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const OrdersSection: React.FC<OrdersSectionProps> = ({
  activeOrders,
  orderSearchQuery,
  setOrderSearchQuery,
  filteredActiveOrders,
  handleUpdateStatus,
  language,
  t,
  formatPrice,
  dishes,
  loadLatestData,
  addToast,
}) => {
  return (
    <div className="space-y-6" id="orders-tab-content">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-serif text-amber-100 font-semibold">
          Buyurtmalar Navbati ({activeOrders.length} faol)
        </h2>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2">
        <label className="block text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
          {language === 'uz' ? 'Mijoz ID (Seans), Buyurtma ID yoki Stol raqami bo\'yicha qidirish' :
           language === 'ru' ? 'Поиск по ID клиента (сессии), ID заказа или номеру стола' :
           'Search by Customer ID (Session), Order ID or Table Number'}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={orderSearchQuery}
            onChange={(e) => setOrderSearchQuery(e.target.value)}
            placeholder={
              language === 'uz'
                ? 'Mijoz ID, seans ID, buyurtma ID yoki stol raqamini kiriting...'
                : language === 'ru'
                ? 'Введите ID клиента, сессии, заказа или номер стола...'
                : 'Enter customer ID, session ID, order ID or table number...'
            }
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-8 py-2 text-xs text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/40 font-mono transition-colors"
          />
          {orderSearchQuery && (
            <button
              onClick={() => setOrderSearchQuery('')}
              className="absolute right-3 top-2.5 text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Orders list */}
      <div className="space-y-4">
        {filteredActiveOrders.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl border-dashed border-neutral-800">
            <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-500">
              {orderSearchQuery
                ? (language === 'uz' ? 'Siz qidirgan ma\'lumot bo\'yicha hech qanday faol buyurtma topilmadi.' : language === 'ru' ? 'Активных заказов по вашему запросу не найдено.' : 'No active orders found matching your search.')
                : (language === 'uz' ? 'Hozirda hech qanday faol buyurtmalar mavjud emas.' : language === 'ru' ? 'В настоящее время нет активных заказов.' : 'No active orders at the moment.')
              }
            </p>
          </div>
        ) : (
          filteredActiveOrders.map(order => (
            <div
              key={order.id}
              className="glass-card rounded-xl p-5 border border-amber-500/20 space-y-4"
              id={`admin-order-card-${order.id}`}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-neutral-900">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-amber-500 text-black px-2 py-0.5 rounded">
                      STOL {order.tableNumber}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">#{order.id.slice(-6).toUpperCase()}</span>
                    {order.sessionId && (
                      <span className="text-[9px] font-mono bg-neutral-900 border border-neutral-800 text-amber-400 px-1.5 py-0.5 rounded" title={language === 'uz' ? 'Mijoz Seansi ID' : 'ID Сессии'}>
                        SEANS: {order.sessionId.slice(-6).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Buyurtma vaqti: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Status select controller */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-neutral-500 font-mono">Holati:</span>
                  <select
                    id={`order-status-select-${order.id}`}
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                    className={`text-xs font-semibold rounded px-2.5 py-1.5 cursor-pointer focus:outline-none border ${
                      order.status === 'new' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      order.status === 'delivered' ? 'bg-neutral-800 text-neutral-400 border-neutral-700' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <option value="new" className="bg-neutral-950 text-amber-400">{t.statusNew}</option>
                    <option value="preparing" className="bg-neutral-950 text-blue-400">{t.statusPreparing}</option>
                    <option value="ready" className="bg-neutral-950 text-emerald-400">{t.statusReady}</option>
                    <option value="delivered" className="bg-neutral-950 text-neutral-400">{t.statusDelivered}</option>
                    <option value="cancelled" className="bg-neutral-950 text-rose-400">{t.statusCancelled}</option>
                  </select>
                </div>
              </div>

              {/* Order items list */}
              <div className="space-y-2">
                {order.items.map((item, idx) => {
                  const dishRef = dishes.find(d => d.id === item.dishId);
                  const isKg = dishRef?.unit === 'kg' || item.quantity % 1 !== 0;
                  return (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold font-mono">
                          {isKg ? `${item.quantity} ${t.kg}` : `x${item.quantity}`}
                        </span>
                        <span className="text-neutral-300 font-medium">{item.dishName[language]}</span>
                      </div>
                      <span className="font-mono text-neutral-400">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Order Notes */}
              {order.notes && (
                <div className="bg-neutral-950 p-2 rounded border border-neutral-900 text-xs text-neutral-400">
                  <span className="font-semibold text-amber-500/80 mr-1.5">Mijoz izohi:</span>
                  "{order.notes}"
                </div>
              )}

              {/* Fees breakdown */}
              {(order.serviceCharge !== undefined || order.tableSittingFee !== undefined) && (
                <div className="space-y-1 text-[10px] text-neutral-500 pt-2 border-t border-neutral-900/60 font-mono">
                  {order.serviceCharge !== undefined && order.serviceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>{t.serviceCharge}:</span>
                      <span>+{formatPrice(order.serviceCharge)}</span>
                    </div>
                  )}
                  {order.tableSittingFee !== undefined && order.tableSittingFee > 0 && (
                    <div className="flex justify-between">
                      <span>{t.tableSittingFee}:</span>
                      <span>+{formatPrice(order.tableSittingFee)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total and Payment Status Toggle */}
              <div className="flex justify-between items-center pt-3 border-t border-neutral-900 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500 uppercase tracking-wider text-[10px]">{t.paymentStatusLabel}:</span>
                  <button
                    onClick={async () => {
                      const newStatus = order.paymentStatus === 'paid' ? 'unpaid' : 'paid';
                      try {
                        await updateOrderPaymentStatus(order.id, newStatus);
                        await loadLatestData();
                        addToast(
                          language === 'uz'
                            ? `To'lov holati o'zgartirildi: ${newStatus === 'paid' ? 'To\'langan' : 'To\'lanmagan'}`
                            : language === 'ru'
                            ? `Статус оплаты изменен: ${newStatus === 'paid' ? 'Оплачено' : 'Не оплачено'}`
                            : `Payment status changed: ${newStatus === 'paid' ? 'Paid' : 'Unpaid'}`,
                          'success'
                        );
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer border ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                    id={`btn-payment-toggle-${order.id}`}
                    title={language === 'uz' ? 'To\'lov holatini o\'zgartirish' : 'Изменить статус оплаты'}
                  >
                    {order.paymentStatus === 'paid' ? t.paid : t.unpaid}
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 uppercase block tracking-wider">Jami To‘lov:</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
