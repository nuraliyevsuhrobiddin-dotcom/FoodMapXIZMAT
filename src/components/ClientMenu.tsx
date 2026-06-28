/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Dish, CartItem, Language, translations, Order, CategoryInfo, StaffCall } from '../types';
import {
  Search,
  SlidersHorizontal,
  UtensilsCrossed,
  Clock,
  Sparkles,
  Flame,
  ChevronRight,
  BellRing,
  ChefHat,
  ShoppingBag,
  ArrowLeft,
  X,
  Plus,
  Minus,
  Scale,
  Compass,
  FileText,
  Download,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getDishes,
  getOrders,
  getStaffCalls,
  createStaffCall,
  createOrder,
  subscribeToSync,
  getTableSessionId,
  addFeedback
} from '../lib/storage';
import { playNotificationSound } from './AudioNotification';
import CartDrawer from './CartDrawer';
import LanguageSelector from './LanguageSelector';
import { generateReceiptPDF } from '../lib/receipt';

interface ClientMenuProps {
  tableNumber: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToPortal: () => void;
  addToast: (text: string, type: 'success' | 'info' | 'alert') => void;
}

const CATEGORIES: CategoryInfo[] = [
  { id: 'national', name: { uz: 'Milliy taomlar', ru: 'Национальные блюда', en: 'National Dishes' }, icon: '🍲' },
  { id: 'fastfood', name: { uz: 'Fast Food', ru: 'Фастфуд', en: 'Fast Food' }, icon: '🍔' },
  { id: 'drinks', name: { uz: 'Ichimliklar', ru: 'Напитки', en: 'Drinks' }, icon: '🍹' },
  { id: 'salads', name: { uz: 'Salatlar', ru: 'Салаты', en: 'Salads' }, icon: '🥗' },
  { id: 'desserts', name: { uz: 'Shirinliklar', ru: 'Десерты', en: 'Desserts' }, icon: '🍰' },
  { id: 'combo', name: { uz: 'Kombo to‘plamlar', ru: 'Комбо наборы', en: 'Combo Sets' }, icon: '🍱' }
];

export default function ClientMenu({
  tableNumber,
  language,
  onLanguageChange,
  onBackToPortal,
  addToast
}: ClientMenuProps) {
  const t = translations[language];

  // Local state for dishes, orders, calls
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  
  // Filtering & searching
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Weight Picker Modal state
  const [weightPickerDish, setWeightPickerDish] = useState<Dish | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number>(1.0);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Load orders, calls, and dishes for this specific table
  const fetchTableData = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const allOrders = await getOrders();
      const currentSessionId = await getTableSessionId(tableNumber);
      const tableOrders = allOrders.filter(o => o.tableNumber === tableNumber && o.sessionId === currentSessionId);
      setOrders(tableOrders);

      const allCalls = await getStaffCalls();
      const tableCalls = allCalls.filter(c => c.tableNumber === tableNumber && c.status === 'pending');
      setStaffCalls(tableCalls);

      const allDishes = await getDishes();
      setDishes(allDishes);
    } catch (error) {
      console.error('Error fetching table data:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();

    // Subscribe to multi-tab sync changes
    const unsubscribe = subscribeToSync((type, payload) => {
      if (type === 'ORDERS_CHANGED' || type === 'ORDER_CREATED' || type === 'ORDER_STATUS_CHANGED') {
        // If an order status changed, notify the client if they own it!
        if (type === 'ORDER_STATUS_CHANGED') {
          const changedOrder = payload as Order;
          if (changedOrder.tableNumber === tableNumber) {
            if (changedOrder.status === 'ready') {
              addToast(
                language === 'uz' 
                  ? `Stol ${tableNumber}: Buyurtmangiz tayyor bo'ldi! Ofitsiant olib kelmoqda.`
                  : language === 'ru'
                  ? `Стол ${tableNumber}: Ваш заказ готов! Официант уже несет его.`
                  : `Table ${tableNumber}: Your order is ready! The waiter is on their way.`,
                'alert'
              );
              playNotificationSound('bell');
            } else if (changedOrder.status === 'preparing') {
              addToast(
                language === 'uz' 
                  ? `Buyurtmangiz oshxonada tayyorlanishni boshladi.`
                  : language === 'ru'
                  ? `Ваш заказ начали готовить на кухне.`
                  : `Your order is now being prepared in the kitchen.`,
                'info'
              );
              playNotificationSound('resolve');
            }
          }
        }
        fetchTableData();
      } else if (type === 'CALLS_CHANGED' || type === 'STAFF_CALL_RESOLVED') {
        fetchTableData();
      } else if (type === 'MENU_CHANGED') {
        getDishes().then(setDishes);
      } else if (type === 'TABLE_SESSION_RESET') {
        const payloadData = payload as { tableNumber: number; newSessionId: string };
        if (payloadData.tableNumber === tableNumber) {
          setCartItems([]);
          addToast(
            language === 'uz'
              ? 'Stol seansi yakunlandi. Yangi buyurtmalar uchun tayyor.'
              : language === 'ru'
              ? 'Сессия стола завершена. Готов к новым заказам.'
              : 'Table session ended. Ready for new orders.',
            'info'
          );
          fetchTableData();
        }
      } else if (type === 'SHIFT_CLOSED') {
        setCartItems([]);
        addToast(
          language === 'uz'
            ? "Restoran smenasi yopildi. Stol seansi yangilandi."
            : language === 'ru'
            ? "Смена ресторана закрыта. Сессия стола обновлена."
            : "Restaurant shift closed. Table session refreshed.",
          'info'
        );
        fetchTableData();
      }
    });

    return () => unsubscribe();
  }, [tableNumber, language]);

  // Handle staff calling
  const handleCallStaff = async (type: 'waiter' | 'chef') => {
    // Check if there is already a pending call of this type to avoid duplicates
    const existing = staffCalls.find(c => c.type === type && c.status === 'pending');
    if (existing) {
      addToast(t.callPending, 'info');
      return;
    }

    try {
      await createStaffCall(tableNumber, type);
      playNotificationSound('bell');
      addToast(type === 'waiter' ? t.waiterCalled : t.chefCalled, 'success');
      await fetchTableData();
    } catch (error) {
      console.error('Failed to create staff call:', error);
    }
  };

  const handleSubmitFeedback = async (e: FormEvent) => {
    e.preventDefault();
    if (feedbackRating < 1 || feedbackRating > 5) return;
    try {
      await addFeedback(tableNumber, feedbackRating, feedbackComment);
      addToast(t.feedbackSuccess, 'success');
      setFeedbackComment('');
      setFeedbackRating(5);
      setIsFeedbackOpen(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  // Cart operations
  const handleAddToCart = (dish: Dish, customQty?: number) => {
    // If it's a weight-based dish and no custom quantity/weight was passed,
    // intercept the call and open the weight picker modal.
    if (dish.unit === 'kg' && customQty === undefined) {
      const existing = cartItems.find(item => item.dish.id === dish.id);
      setSelectedWeight(existing ? existing.quantity : 1.0);
      setWeightPickerDish(dish);
      return;
    }

    const qtyToAdd = customQty !== undefined ? customQty : 1;
    const exists = cartItems.some(item => item.dish.id === dish.id);

    setCartItems(prev => {
      const idx = prev.findIndex(item => item.dish.id === dish.id);
      if (idx !== -1) {
        const updated = [...prev];
        if (customQty !== undefined) {
          // If from picker modal, directly override with the selected weight
          updated[idx].quantity = customQty;
        } else {
          updated[idx].quantity += 1;
        }
        return updated;
      } else {
        return [...prev, { dish, quantity: qtyToAdd }];
      }
    });

    addToast(
      exists && customQty === undefined
        ? (language === 'uz' 
            ? `${dish.name.uz} savatchada oshirildi` 
            : language === 'ru' 
            ? `${dish.name.ru} увеличен в корзине` 
            : `${dish.name.en} quantity increased`)
        : (language === 'uz' 
            ? `${dish.name.uz} savatchaga qo'shildi` 
            : language === 'ru' 
            ? `${dish.name.ru} добавлен в корзину` 
            : `${dish.name.en} added to cart`),
      'success'
    );
    playNotificationSound('resolve');
  };

  const handleUpdateCartQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(dishId);
      return;
    }
    setCartItems(prev => prev.map(item => item.dish.id === dishId ? { ...item, quantity } : item));
  };

  const handleRemoveCartItem = (dishId: string) => {
    setCartItems(prev => prev.filter(item => item.dish.id !== dishId));
    addToast(
      language === 'uz' ? 'Taom savatdan o‘chirildi' : language === 'ru' ? 'Блюдо удалено из корзины' : 'Item removed from cart',
      'info'
    );
  };

  const handleCheckout = async (notes: string) => {
    if (cartItems.length === 0) return;

    try {
      await createOrder(tableNumber, cartItems, notes);
      setCartItems([]);
      setIsCartOpen(false);
      playNotificationSound('success');
      addToast(t.orderSuccess, 'success');
      await fetchTableData();
    } catch (error) {
      console.error('Failed to checkout order:', error);
      addToast(
        language === 'uz'
          ? 'Buyurtma yuborishda xatolik. Iltimos qayta urinib ko\'ring.'
          : language === 'ru'
          ? 'Ошибка при отправке заказа. Пожалуйста, попробуйте снова.'
          : 'Error placing order. Please try again.',
        'alert'
      );
    }
  };

  // Filtered and sorted dishes
  const filteredDishes = useMemo(() => {
    return dishes
      .filter(dish => {
        const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
        const dishName = dish.name?.[language] || '';
        const dishDesc = dish.description?.[language] || '';
        const matchesSearch = 
          dishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dishDesc.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        return 0; // default order
      });
  }, [dishes, selectedCategory, searchTerm, sortBy, language]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders]);

  const deliveredOrders = useMemo(() => {
    return orders.filter(o => o.status === 'delivered');
  }, [orders]);

  const hasPendingWaiter = staffCalls.some(c => c.type === 'waiter' && c.status === 'pending');
  const hasPendingChef = staffCalls.some(c => c.type === 'chef' && c.status === 'pending');

  const formatPrice = (num: number) => {
    return num.toLocaleString('uz-UZ') + ' ' + t.currency;
  };

  // Show loading screen while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
        <div className="text-center">
          <p className="text-amber-100 font-semibold text-lg">
            {language === 'uz' ? 'Yuklanmoqda...' : language === 'ru' ? 'Загрузка...' : 'Loading...'}
          </p>
          <p className="text-neutral-500 text-sm mt-1">
            {language === 'uz' ? 'Iltimos kuting' : language === 'ru' ? 'Пожалуйста, подождите' : 'Please wait'}
          </p>
        </div>
      </div>
    );
  }

  // Show error screen if loading failed
  if (loadError && dishes.length === 0) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6 px-6">
        <div className="text-5xl">⚠️</div>
        <div className="text-center">
          <p className="text-amber-100 font-semibold text-lg">
            {language === 'uz' ? 'Ulanishda xatolik' : language === 'ru' ? 'Ошибка подключения' : 'Connection Error'}
          </p>
          <p className="text-neutral-500 text-sm mt-2 max-w-xs">
            {language === 'uz'
              ? 'Internet aloqasi sekin yoki baza bilan bog\'lanib bo\'lmadi.'
              : language === 'ru'
              ? 'Медленное интернет-соединение или не удалось подключиться к базе данных.'
              : 'Slow internet or could not connect to the database.'}
          </p>
        </div>
        <button
          onClick={fetchTableData}
          className="gold-btn px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer"
        >
          {language === 'uz' ? '🔄 Qayta urinish' : language === 'ru' ? '🔄 Повторить' : '🔄 Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col pb-24 relative" id="client-menu-portal">
      {/* Background radial glows */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass-header px-4 py-4 flex items-center justify-between" id="client-header">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPortal}
            className="text-neutral-400 hover:text-amber-400 transition-colors p-1"
            id="btn-client-back"
            title={t.backToMenu}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h1 className="text-sm font-serif font-semibold text-amber-100 tracking-wide uppercase">
                {t.tableLabel} {tableNumber}
              </h1>
            </div>
            <p className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase">ONLAYN MENYU XIZMATI</p>
          </div>
        </div>

        {/* Call Buttons / Language */}
        <div className="flex items-center gap-2">
          {/* Waiter button */}
          <button
            id="btn-call-waiter"
            onClick={() => handleCallStaff('waiter')}
            className={`p-2 rounded-full border transition-all duration-300 relative flex items-center justify-center cursor-pointer ${
              hasPendingWaiter
                ? 'border-amber-500 bg-amber-500/20 text-amber-300 pulse-gold'
                : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-amber-400 hover:border-amber-500/30'
            }`}
            title={t.callWaiter}
          >
            <BellRing className="w-4 h-4" />
            {hasPendingWaiter && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {/* Chef button */}
          <button
            id="btn-call-chef"
            onClick={() => handleCallStaff('chef')}
            className={`p-2 rounded-full border transition-all duration-300 relative flex items-center justify-center cursor-pointer ${
              hasPendingChef
                ? 'border-amber-500 bg-amber-500/20 text-amber-300 pulse-gold'
                : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-amber-400 hover:border-amber-500/30'
            }`}
            title={t.callChef}
          >
            <ChefHat className="w-4 h-4" />
            {hasPendingChef && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {/* Language Selector */}
          <div className="scale-90 origin-right">
            <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 space-y-6 z-10">
        
        {/* Active Order Progress Trackers */}
        <AnimatePresence>
          {activeOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
              id="active-orders-progress-section"
            >
              <h2 className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {t.orderStatusTitle} ({activeOrders.length})
              </h2>

              {activeOrders.map(order => {
                // Determine percentage of progress
                const percent = 
                  order.status === 'new' ? 15 :
                  order.status === 'preparing' ? 55 :
                  order.status === 'ready' ? 90 :
                  order.status === 'delivered' ? 100 : 0;

                const statusLabel = 
                  order.status === 'new' ? t.statusNew :
                  order.status === 'preparing' ? t.statusPreparing :
                  order.status === 'ready' ? t.statusReady :
                  order.status === 'delivered' ? t.statusDelivered : t.statusCancelled;

                const colorClass = 
                  order.status === 'ready' ? 'bg-amber-500' :
                  order.status === 'preparing' ? 'bg-amber-400' : 'bg-neutral-600';

                return (
                  <div key={order.id} className="glass-card rounded-lg p-3.5 border border-amber-500/20" id={`order-track-${order.id}`}>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-mono text-[10px] text-neutral-400">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className="font-semibold text-amber-300 flex items-center gap-1">
                        {order.status === 'preparing' && <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
                        {statusLabel}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-2 border border-neutral-900">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${percent}%` }} 
                        transition={{ duration: 0.8 }} 
                        className={`h-full ${colorClass}`} 
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-2 pt-2 border-t border-neutral-900">
                      <span>{order.items.reduce((acc, i) => acc + i.quantity, 0)} {t.pcs} • {formatPrice(order.totalAmount)}</span>
                      <div className="flex items-center gap-2 font-semibold">
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-medium ${
                          order.paymentStatus === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                        }`}>
                          {order.paymentStatus === 'paid' ? t.paid : t.unpaid}
                        </span>
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivered Orders & Receipt Downloads */}
        <AnimatePresence>
          {deliveredOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
              id="delivered-orders-receipt-section"
            >
              <h2 className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                {language === 'uz' ? 'YETKAZILGAN BUYURTMALAR VA CHEKLAR' : language === 'ru' ? 'ДОСТАВЛЕННЫЕ ЗАКАЗЫ И ЧЕКИ' : 'DELIVERED ORDERS & RECEIPTS'} ({deliveredOrders.length})
              </h2>

              {deliveredOrders.map(order => (
                <div key={order.id} className="glass-card rounded-lg p-3.5 border border-emerald-500/20" id={`delivered-order-${order.id}`}>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-mono text-[10px] text-neutral-400">#{order.id.slice(-6).toUpperCase()}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                      }`}>
                        {order.paymentStatus === 'paid' ? t.paid : t.unpaid}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                        {t.statusDelivered}
                      </span>
                    </div>
                  </div>

                  {/* Summary of items in brief */}
                  <div className="text-[11px] text-neutral-300 space-y-1 font-mono border-b border-neutral-900 pb-2 mb-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-neutral-400 max-w-[180px] truncate">
                          {item.dishName[language] || item.dishName.en}
                        </span>
                        <span>{item.quantity} x {formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs">
                      <span className="text-neutral-500 text-[9px] block mb-0.5">
                        {new Date(order.createdAt).toLocaleDateString('uz-UZ')} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-bold text-amber-200">{formatPrice(order.totalAmount)}</span>
                    </div>

                    <button
                      id={`btn-download-receipt-${order.id}`}
                      onClick={async () => {
                        await generateReceiptPDF(order, language);
                        addToast(
                          language === 'uz'
                            ? `Chek PDF shaklida yuklab olinmoqda...`
                            : language === 'ru'
                            ? `Чек скачивается в формате PDF...`
                            : `Downloading receipt PDF...`,
                          'success'
                        );
                      }}
                      className="px-3 py-1.5 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-[11px] flex items-center gap-1.5 transition-all duration-300 shadow-sm cursor-pointer hover:shadow-emerald-900/30 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {language === 'uz' ? 'Chekni yuklash' : language === 'ru' ? 'Скачать чек' : 'Download Receipt'}
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Section */}
        <div className="glass-card rounded-lg p-3.5 border border-neutral-800" id="client-feedback-section">
          {!isFeedbackOpen ? (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-semibold text-amber-100 uppercase tracking-wide">
                  {t.leaveFeedback}
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  {language === 'uz' ? 'Xizmat sifatini baholang' : language === 'ru' ? 'Оцените качество обслуживания' : 'Rate your dining experience'}
                </p>
              </div>
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium text-[11px] flex items-center gap-1.5 transition-all duration-300 cursor-pointer active:scale-95"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{t.leaveFeedback}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
              <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                <span className="text-xs font-bold text-amber-100 uppercase tracking-wide">
                  {t.leaveFeedback}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stars selection */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider mr-2">{t.ratingLabel}:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="text-amber-400 hover:scale-110 active:scale-90 transition-transform cursor-pointer p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= feedbackRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 ml-1">({feedbackRating}/5)</span>
              </div>

              {/* Comment field */}
              <div className="space-y-1">
                <label className="block text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">
                  {t.commentLabel}:
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder={
                    language === 'uz'
                      ? "Taassurotlaringiz, taklif yoki shikoyatlaringiz..."
                      : language === 'ru'
                      ? "Ваши впечатления, предложения или жалобы..."
                      : "Share your thoughts, suggestions, or complaints..."
                  }
                  className="w-full bg-neutral-950 border border-neutral-900 rounded-lg p-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/40 min-h-[60px]"
                  maxLength={500}
                />
              </div>

              {/* Form buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-medium text-[11px] transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-amber-500 text-black font-semibold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>{t.submitFeedback}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Custom Search & Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
            <input
              id="menu-search-input"
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-full pl-10 pr-4 py-2.5 text-xs text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3 text-neutral-500 hover:text-amber-400"
                id="btn-clear-search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <SlidersHorizontal className="absolute left-3 top-3 w-4 h-4 text-neutral-500 pointer-events-none" />
            <select
              id="menu-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-900/60 border border-neutral-800/80 rounded-full pl-9 pr-6 py-2.5 text-xs text-amber-100 font-medium cursor-pointer focus:outline-none focus:border-amber-500/40 appearance-none"
            >
              <option value="default">↕ &nbsp; Saralash</option>
              <option value="priceAsc">Arzonroq</option>
              <option value="priceDesc">Qimmatroq</option>
            </select>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="overflow-x-auto pb-1 flex gap-2 scrollbar-none" id="categories-scroll-container">
          <button
            id="cat-tab-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-black border-amber-500'
                : 'bg-neutral-900/40 text-neutral-400 border-neutral-800/80 hover:text-amber-200 hover:border-amber-500/20'
            }`}
          >
            ✨ {t.allCategories}
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`cat-tab-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-neutral-900/40 text-neutral-400 border-neutral-800/80 hover:text-amber-200 hover:border-amber-500/20'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name[language]}</span>
            </button>
          ))}
        </div>

        {/* Popular / Recommended sections if 'all' is selected and no search term */}
        {!searchTerm && selectedCategory === 'all' && (
          <>
            {/* Recommended Section (Horizontal Cards) */}
            <div className="space-y-3" id="recommended-dishes-section">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {t.recommendedDishes}
                </h3>
              </div>

              <div className="overflow-x-auto flex gap-4 pb-2 scrollbar-none" id="recommended-scroll">
                {dishes.filter(d => d.isRecommended).map(dish => (
                  <div
                    key={dish.id}
                    className="w-48 shrink-0 glass-card rounded-lg p-2.5 border border-amber-500/10 flex flex-col justify-between"
                    id={`rec-card-${dish.id}`}
                  >
                    <div className="relative">
                      <img
                        src={dish.image}
                        alt={dish.name[language]}
                        className="w-full h-24 object-cover rounded-md mb-2 border border-neutral-800"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-1 right-1 text-[8px] font-mono uppercase bg-amber-500 text-black px-1.5 py-0.5 rounded font-semibold tracking-wider">
                        Recom
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-amber-100 truncate">{dish.name[language]}</h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-1">{dish.description[language]}</p>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-900">
                      <span className="text-xs font-mono font-semibold text-amber-400 whitespace-nowrap shrink-0">
                        {formatPrice(dish.price)}{dish.unit === 'kg' ? ` / ${t.kg}` : ''}
                      </span>
                      <button
                        id={`btn-add-rec-${dish.id}`}
                        onClick={() => handleAddToCart(dish)}
                        className="p-1 rounded-full bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Section (Grid Cards) */}
            <div className="space-y-3" id="popular-dishes-section">
              <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                {t.popularDishes}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {dishes.filter(d => d.isPopular).slice(0, 4).map(dish => (
                  <div
                    key={dish.id}
                    className="glass-card rounded-lg p-2.5 border border-amber-500/10 flex flex-col justify-between"
                    id={`pop-card-${dish.id}`}
                  >
                    <img
                      src={dish.image}
                      alt={dish.name[language]}
                      className="w-full h-24 object-cover rounded-md mb-2 border border-neutral-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-amber-100 truncate">{dish.name[language]}</h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-1">{dish.description[language]}</p>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-900">
                      <span className="text-xs font-mono font-semibold text-amber-400 whitespace-nowrap shrink-0">
                        {formatPrice(dish.price)}{dish.unit === 'kg' ? ` / ${t.kg}` : ''}
                      </span>
                      <button
                        id={`btn-add-pop-${dish.id}`}
                        onClick={() => handleAddToCart(dish)}
                        className="p-1 rounded-full bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Core Menu List / Filtered List */}
        <div className="space-y-3" id="core-menu-list-section">
          <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
            {selectedCategory === 'all' ? t.allCategories : CATEGORIES.find(c => c.id === selectedCategory)?.name[language]}
          </h3>

          <div className="space-y-3">
            {filteredDishes.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">
                Ushbu bo‘limda hozircha taomlar mavjud emas
              </div>
            ) : (
              filteredDishes.map(dish => (
                <div
                  key={dish.id}
                  className="glass-card border border-amber-500/5 hover:border-amber-500/20 rounded-lg p-3 flex gap-3 items-center transition-all duration-300"
                  id={`dish-item-${dish.id}`}
                >
                  {/* Dish Image */}
                  <div className="relative shrink-0">
                    <img
                      src={dish.image}
                      alt={dish.name[language]}
                      className="w-20 h-20 object-cover rounded-md border border-neutral-800"
                      referrerPolicy="no-referrer"
                    />
                    {dish.preparationTime && (
                      <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-mono text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Clock className="w-2 h-2" />
                        {dish.preparationTime} {t.mins}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-amber-100 truncate pr-2">
                          {dish.name[language]}
                        </h4>
                        {dish.isPopular && (
                          <span className="text-[7px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded shrink-0">
                            POP
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 font-light">
                        {dish.description[language]}
                      </p>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-semibold text-amber-400 font-mono whitespace-nowrap shrink-0">
                        {formatPrice(dish.price)}{dish.unit === 'kg' ? ` / ${t.kg}` : ''}
                      </span>

                      <button
                        id={`btn-add-${dish.id}`}
                        onClick={() => handleAddToCart(dish)}
                        className="gold-btn text-[10px] py-1 px-3 rounded-full flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform whitespace-nowrap shrink-0"
                      >
                        <ShoppingBag className="w-3 h-3 text-black" />
                        {t.addToCart}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Floating Cart Indicator */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto pointer-events-auto"
            id="floating-cart-bar"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#121212] border border-amber-500/30 hover:border-amber-500/60 p-4 rounded-full flex items-center justify-between shadow-2xl transition-all duration-300 active:scale-98 cursor-pointer relative overflow-hidden group"
              id="btn-open-cart-floating"
            >
              {/* Dynamic gold flow glow inside button */}
              <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />

              <div className="flex items-center gap-3 z-10">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center relative">
                  <ShoppingBag className="w-4 h-4 text-black" />
                  <span className="absolute -top-1 -right-1 text-[9px] font-mono font-bold bg-neutral-950 border border-amber-500 text-amber-400 w-4 h-4 rounded-full flex items-center justify-center">
                    {cartItems.reduce((acc, item) => acc + (item.dish.unit === 'kg' ? 1 : item.quantity), 0)}
                  </span>
                </div>
                <div>
                  <p className="text-left text-[9px] text-neutral-400 uppercase tracking-wider font-medium">
                    Savatni ko'rish
                  </p>
                  <p className="text-left text-xs font-mono text-amber-400 font-bold">
                    {formatPrice(cartItems.reduce((sum, i) => sum + (i.dish.price * i.quantity), 0))}
                  </p>
                </div>
              </div>

              <span className="text-xs text-amber-300 font-semibold tracking-wide uppercase flex items-center gap-1 z-10 group-hover:translate-x-1 transition-transform">
                <span>{t.placeOrder}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onCheckout={handleCheckout}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* Weight Picker Modal */}
      <AnimatePresence>
        {weightPickerDish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="weight-picker-overlay">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setWeightPickerDish(null)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-[#0c0c0c] border border-amber-500/30 rounded-2xl p-6 shadow-2xl z-10 text-xs"
              id="weight-picker-modal"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-3 border-b border-neutral-900 mb-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-amber-100 uppercase tracking-wide">
                    {weightPickerDish.name[language]}
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {language === 'uz' ? 'Iltimos, kerakli vaznni tanlang' : language === 'ru' ? 'Пожалуйста, выберите нужный вес' : 'Please select required weight'}
                  </p>
                </div>
                <button
                  onClick={() => setWeightPickerDish(null)}
                  className="text-neutral-500 hover:text-amber-400 p-1 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Price per Kg info */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 mb-5 flex items-center justify-between">
                <span className="text-neutral-400 font-medium">
                  {language === 'uz' ? '1 kg narxi' : language === 'ru' ? 'Цена за 1 кг' : 'Price per 1 kg'}
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {formatPrice(weightPickerDish.price)}
                </span>
              </div>

              {/* Selected Weight Input & Incrementor */}
              <div className="space-y-4 mb-6">
                <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  {t.selectWeight}
                </label>
                
                <div className="flex items-center justify-between gap-3 bg-neutral-950 border border-neutral-900 rounded-xl p-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWeight(prev => Math.max(0.1, Number((prev - 0.1).toFixed(1))))}
                    className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer border border-neutral-800"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSelectedWeight(isNaN(val) ? 0.1 : Math.max(0.1, Number(val.toFixed(1))));
                      }}
                      className="w-20 bg-transparent text-center text-lg font-mono font-bold text-amber-100 focus:outline-none"
                    />
                    <span className="text-sm font-semibold text-neutral-500 font-mono">
                      {t.kg}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedWeight(prev => Number((prev + 0.1).toFixed(1)))}
                    className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer border border-neutral-800"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[0.5, 1.0, 1.5, 2.0, 3.0].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeight(w)}
                      className={`py-2 px-1 rounded-lg border font-mono font-semibold transition-all text-center active:scale-95 cursor-pointer text-[10px] ${
                        selectedWeight === w
                          ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                      }`}
                    >
                      {w} {t.kg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Price Calculation Display */}
              <div className="border-t border-neutral-900 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-medium">
                    {language === 'uz' ? 'Umumiy hisob' : language === 'ru' ? 'Итоговая стоимость' : 'Total estimate'}
                  </span>
                  <div className="text-right">
                    <p className="text-base font-mono font-extrabold text-amber-400">
                      {formatPrice(Number((selectedWeight * weightPickerDish.price).toFixed(0)))}
                    </p>
                    <p className="text-[9px] text-neutral-500 mt-0.5">
                      {selectedWeight} {t.kg} × {formatPrice(weightPickerDish.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setWeightPickerDish(null)}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 py-3 rounded-xl font-medium transition-colors cursor-pointer text-center"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(weightPickerDish, selectedWeight);
                    setWeightPickerDish(null);
                  }}
                  className="flex-1 gold-btn py-3 rounded-xl font-bold transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4 text-black" />
                  <span>{t.addToCart}</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
