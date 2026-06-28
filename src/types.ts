/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'uz' | 'ru' | 'en';

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Dish {
  id: string;
  name: {
    uz: string;
    ru: string;
    en: string;
  };
  description: {
    uz: string;
    ru: string;
    en: string;
  };
  price: number; // in UZS (Uzbek Soum)
  category: 'national' | 'fastfood' | 'drinks' | 'salads' | 'desserts' | 'combo';
  image: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  preparationTime?: number; // in minutes
  unit?: 'pcs' | 'kg'; // sold by piece or by kilogram
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  notes?: string;
}

export interface OrderItem {
  dishId: string;
  dishName: {
    uz: string;
    ru: string;
    en: string;
  };
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  sessionId?: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string; // ISO string
  status: OrderStatus;
  notes?: string;
  serviceCharge?: number;
  tableSittingFee?: number;
  paymentStatus?: 'unpaid' | 'paid';
}

export interface RestaurantSettings {
  serviceChargePercent: number; // e.g. 10 for 10%
  tableSittingFee: number; // fixed fee in UZS, e.g. 5000
  tableCount?: number; // dynamic table count (defaults to 12)
}

export interface StaffCall {
  id: string;
  tableNumber: number;
  type: 'waiter' | 'chef';
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface Feedback {
  id: string;
  tableNumber: number;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Table {
  number: number;
  status: 'empty' | 'active' | 'waiting';
  currentOrderId?: string;
}

export interface CategoryInfo {
  id: 'national' | 'fastfood' | 'drinks' | 'salads' | 'desserts' | 'combo';
  name: {
    uz: string;
    ru: string;
    en: string;
  };
  icon: string;
}

export interface TranslationDict {
  welcomeTitle: string;
  welcomeSubtitle: string;
  enterClientMode: string;
  enterAdminMode: string;
  selectTable: string;
  startOrdering: string;
  tableLabel: string;
  searchPlaceholder: string;
  allCategories: string;
  popularDishes: string;
  recommendedDishes: string;
  addToCart: string;
  cartTitle: string;
  emptyCart: string;
  total: string;
  placeOrder: string;
  orderNotes: string;
  orderNotesPlaceholder: string;
  orderSuccess: string;
  orderStatusTitle: string;
  orderStatusSubtitle: string;
  callWaiter: string;
  callChef: string;
  waiterCalled: string;
  chefCalled: string;
  callPending: string;
  backToMenu: string;
  currency: string;
  pcs: string;
  kg: string;
  dishUnit: string;
  weightLabel: string;
  selectWeight: string;
  serviceCharge: string;
  tableSittingFee: string;
  settings: string;
  serviceChargePercentLabel: string;
  tableSittingFeeLabel: string;
  tableCountLabel: string;
  saveSettings: string;
  settingsSaved: string;
  mins: string;
  statusNew: string;
  statusPreparing: string;
  statusReady: string;
  statusDelivered: string;
  statusCancelled: string;
  adminTitle: string;
  adminDashboard: string;
  adminOrders: string;
  adminMenu: string;
  adminQR: string;
  totalOrders: string;
  todayRevenue: string;
  activeTables: string;
  topDishes: string;
  actions: string;
  statusLabel: string;
  updateStatus: string;
  addDish: string;
  editDish: string;
  deleteDish: string;
  dishNameUz: string;
  dishNameRu: string;
  dishNameEn: string;
  dishDescUz: string;
  dishDescRu: string;
  dishDescEn: string;
  dishPrice: string;
  dishCategory: string;
  dishImage: string;
  isPopularLabel: string;
  isRecommendedLabel: string;
  prepTimeLabel: string;
  save: string;
  cancel: string;
  generateQR: string;
  downloadQR: string;
  simulateQR: string;
  staffCallsTitle: string;
  resolveCall: string;
  clearTable: string;
  tableCleared: string;
  activeSession: string;
  newClientSession: string;
  paymentStatusLabel: string;
  paid: string;
  unpaid: string;
  markAsPaid: string;
  markAsUnpaid: string;
  totalUnpaid: string;
  leaveFeedback: string;
  feedbackSuccess: string;
  ratingLabel: string;
  commentLabel: string;
  submitFeedback: string;
  feedbackTitle: string;
  averageRating: string;
  allFeedbacks: string;
  noFeedbackYet: string;
  today: string;
  yesterday: string;
  last7days: string;
  allTime: string;
  clearHistory: string;
  confirmClearHistory: string;
  closeShift: string;
  closeShiftConfirm: string;
}

export const translations: Record<Language, TranslationDict> = {
  uz: {
    welcomeTitle: "ONLAYN MENYU XIZMATI",
    welcomeSubtitle: "Hashamatli ta'm va premium xizmat ko'rsatish maskani",
    enterClientMode: "Mijoz Menyusi (Stol orqali)",
    enterAdminMode: "Admin Panel (Boshqaruv)",
    selectTable: "Iltimos, stol raqamini tanlang",
    startOrdering: "Menyuni ko'rish",
    tableLabel: "Stol",
    searchPlaceholder: "Taom yoki ichimlik qidirish...",
    allCategories: "Barcha kategoriyalar",
    popularDishes: "Mashhur taomlar",
    recommendedDishes: "Tavsiya etilgan taomlar",
    addToCart: "Savatga qo'shish",
    cartTitle: "Sizning savatchangiz",
    emptyCart: "Savatchangiz bo'sh. Menyudan taomlarni tanlang!",
    total: "Umumiy summa",
    placeOrder: "Buyurtma berish",
    orderNotes: "Buyurtmaga izoh",
    orderNotesPlaceholder: "Masalan: achchiq bo'lmasin, piyozsiz va h.k.",
    orderSuccess: "Buyurtmangiz muvaffaqiyatli qabul qilindi!",
    orderStatusTitle: "Buyurtma holati",
    orderStatusSubtitle: "Taomingiz tez orada tayyor bo'ladi",
    callWaiter: "Ofitsiant chaqirish",
    callChef: "Oshpaz chaqirish",
    waiterCalled: "Ofitsiantga xabar yuborildi!",
    chefCalled: "Oshpazga xabar yuborildi!",
    callPending: "Chaqiruv kutilmoqda...",
    backToMenu: "Menyuga qaytish",
    currency: "so'm",
    pcs: "dona",
    kg: "kg",
    dishUnit: "Sotish o'lchovi",
    weightLabel: "Miqdor/Vazn (kg)",
    selectWeight: "Kerakli vaznni kiriting (kg)",
    serviceCharge: "Xizmat haqi",
    tableSittingFee: "Stol o'tirish haqi",
    settings: "Xizmat/Stol Sozlamalari",
    serviceChargePercentLabel: "Xizmat haqi foizi (%)",
    tableSittingFeeLabel: "Stol o'tirish haqi (so'm)",
    tableCountLabel: "Stollar soni",
    saveSettings: "Sozlamalarni saqlash",
    settingsSaved: "Sozlamalar saqlandi!",
    mins: "daqiqa",
    statusNew: "Yangi buyurtma",
    statusPreparing: "Tayyorlanmoqda",
    statusReady: "Tayyor",
    statusDelivered: "Yetkazildi",
    statusCancelled: "Bekor qilindi",
    adminTitle: "Restoran Boshqaruv Tizimi",
    adminDashboard: "Dashboard",
    adminOrders: "Buyurtmalar",
    adminMenu: "Taomlar Menyusi",
    adminQR: "QR Kodlar",
    totalOrders: "Jami buyurtmalar",
    todayRevenue: "Bugungi tushum",
    activeTables: "Faol stollar",
    topDishes: "Eng ko'p sotilganlar",
    actions: "Amallar",
    statusLabel: "Holat",
    updateStatus: "Holatni o'zgartirish",
    addDish: "Yangi taom qo'shish",
    editDish: "Taomni tahrirlash",
    deleteDish: "Taomni o'chirish",
    dishNameUz: "Nomi (O'zbekcha)",
    dishNameRu: "Nomi (Ruscha)",
    dishNameEn: "Nomi (Inglizcha)",
    dishDescUz: "Tavsifi (O'zbekcha)",
    dishDescRu: "Tavsifi (Ruscha)",
    dishDescEn: "Tavsifi (Inglizcha)",
    dishPrice: "Narxi (so'm)",
    dishCategory: "Kategoriya",
    dishImage: "Rasm URL manzili",
    isPopularLabel: "Mashhur taom",
    isRecommendedLabel: "Tavsiya etiladi",
    prepTimeLabel: "Tayyorlanish vaqti (daqiqa)",
    save: "Saqlash",
    cancel: "Bekor qilish",
    generateQR: "QR Kod yaratish",
    downloadQR: "QR yuklash",
    simulateQR: "Skaner qilish (Simulyatsiya)",
    staffCallsTitle: "Xodimlarni chaqirish xabarlari",
    resolveCall: "Bajarildi deb belgilash",
    clearTable: "Stolni bo'shatish",
    tableCleared: "Stol muvaffaqiyatli bo'shatildi! Yangi mijoz uchun tayyor.",
    activeSession: "Faol seans",
    newClientSession: "Yangi mijoz seansi",
    paymentStatusLabel: "To'lov holati",
    paid: "To'langan",
    unpaid: "To'lanmagan",
    markAsPaid: "To'langan deb belgilash",
    markAsUnpaid: "To'lanmagan deb belgilash",
    totalUnpaid: "Jami to'lanmagan",
    leaveFeedback: "Fikr-mulohaza qoldirish",
    feedbackSuccess: "Fikr-mulohazangiz uchun rahmat!",
    ratingLabel: "Baholash",
    commentLabel: "Izoh",
    submitFeedback: "Yuborish",
    feedbackTitle: "Mijozlar Fikr-Mulohazalari",
    averageRating: "O'rtacha baho",
    allFeedbacks: "Barcha fikrlar",
    noFeedbackYet: "Hozircha fikrlar mavjud emas.",
    today: "Bugun",
    yesterday: "Kecha",
    last7days: "Oxirgi 7 kun",
    allTime: "Barchasi",
    clearHistory: "Tarixni tozalash",
    confirmClearHistory: "Haqiqatdan ham yopilgan buyurtmalar tarixini butunlay tozalamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!",
    closeShift: "Smenani yopish",
    closeShiftConfirm: "Smenani yopganda barcha faol stollar bo'shatiladi, chaqiruvlar yakunlanadi va buyurtmalar arxivlanadi. Davom etishni xohlaysizmi?",
  },
  ru: {
    welcomeTitle: "ONLAYN MENYU XIZMATI",
    welcomeSubtitle: "Место роскошного вкуса и премиального обслуживания",
    enterClientMode: "Меню Клиента (По столам)",
    enterAdminMode: "Админ Панель (Управление)",
    selectTable: "Пожалуйста, выберите номер стола",
    startOrdering: "Посмотреть меню",
    tableLabel: "Стол",
    searchPlaceholder: "Поиск блюд или напитков...",
    allCategories: "Все категории",
    popularDishes: "Популярные блюда",
    recommendedDishes: "Рекомендуемые блюда",
    addToCart: "В корзину",
    cartTitle: "Ваша корзина",
    emptyCart: "Ваша корзина пуста. Выберите блюда из меню!",
    total: "Общая сумма",
    placeOrder: "Оформить заказ",
    orderNotes: "Комментарий к заказу",
    orderNotesPlaceholder: "Например: не острое, без лука и т.д.",
    orderSuccess: "Ваш заказ успешно принят!",
    orderStatusTitle: "Статус заказа",
    orderStatusSubtitle: "Ваше блюдо скоро будет готово",
    callWaiter: "Вызвать официанта",
    callChef: "Вызвать шеф-повара",
    waiterCalled: "Официант вызван!",
    chefCalled: "Шеф-повар вызван!",
    callPending: "Ожидание вызова...",
    backToMenu: "Вернуться в меню",
    currency: "сум",
    pcs: "шт",
    kg: "кг",
    dishUnit: "Единица продажи",
    weightLabel: "Количество/Вес (кг)",
    selectWeight: "Введите нужный вес (кг)",
    serviceCharge: "Обслуживание",
    tableSittingFee: "Плата за стол",
    settings: "Настройки обслуживания/стола",
    serviceChargePercentLabel: "Процент обслуживания (%)",
    tableSittingFeeLabel: "Плата за стол (сум)",
    tableCountLabel: "Количество столов",
    saveSettings: "Сохранить настройки",
    settingsSaved: "Настройки сохранены!",
    mins: "мин",
    statusNew: "Новый заказ",
    statusPreparing: "Готовится",
    statusReady: "Готов",
    statusDelivered: "Доставлен",
    statusCancelled: "Отменен",
    adminTitle: "Система Управления Рестораном",
    adminDashboard: "Дашборд",
    adminOrders: "Заказы",
    adminMenu: "Меню блюд",
    adminQR: "QR Коды",
    totalOrders: "Всего заказов",
    todayRevenue: "Выручка за сегодня",
    activeTables: "Активные столы",
    topDishes: "Популярные товары",
    actions: "Действия",
    statusLabel: "Статус",
    updateStatus: "Изменить статус",
    addDish: "Добавить новое блюдо",
    editDish: "Редактировать блюдо",
    deleteDish: "Удалить блюдо",
    dishNameUz: "Название (Узбекский)",
    dishNameRu: "Название (Русский)",
    dishNameEn: "Название (Английский)",
    dishDescUz: "Описание (Узбекский)",
    dishDescRu: "Описание (Русский)",
    dishDescEn: "Описание (Английский)",
    dishPrice: "Цена (сум)",
    dishCategory: "Категория",
    dishImage: "URL картинки",
    isPopularLabel: "Популярное блюдо",
    isRecommendedLabel: "Рекомендуется",
    prepTimeLabel: "Время приготовления (мин)",
    save: "Сохранить",
    cancel: "Отмена",
    generateQR: "Создать QR Код",
    downloadQR: "Скачать QR",
    simulateQR: "Симулировать сканирование",
    staffCallsTitle: "Вызовы персонала",
    resolveCall: "Отметить выполненным",
    clearTable: "Освободить стол",
    tableCleared: "Стол успешно освобожден! Готов к новому клиенту.",
    activeSession: "Активная сессия",
    newClientSession: "Сессия нового клиента",
    paymentStatusLabel: "Статус оплаты",
    paid: "Оплачено",
    unpaid: "Не оплачено",
    markAsPaid: "Отметить оплаченным",
    markAsUnpaid: "Отметить неоплаченным",
    totalUnpaid: "Всего не оплачено",
    leaveFeedback: "Оставить отзыв",
    feedbackSuccess: "Спасибо за ваш отзыв!",
    ratingLabel: "Оценка",
    commentLabel: "Комментарий",
    submitFeedback: "Отправить",
    feedbackTitle: "Отзывы клиентов",
    averageRating: "Средняя оценка",
    allFeedbacks: "Все отзывы",
    noFeedbackYet: "Отзывов пока нет.",
    today: "Сегодня",
    yesterday: "Вчера",
    last7days: "Последние 7 дней",
    allTime: "Все время",
    clearHistory: "Очистить историю",
    confirmClearHistory: "Вы действительно хотите полностью очистить историю закрытых заказов? Это действие нельзя отменить!",
    closeShift: "Закрыть смену",
    closeShiftConfirm: "При закрытии смены все активные столы будут освобождены, вызовы завершены, а заказы архивированы. Продолжить?",
  },
  en: {
    welcomeTitle: "ONLAYN MENYU XIZMATI",
    welcomeSubtitle: "A place of luxurious taste and premium service",
    enterClientMode: "Client Menu (By Table)",
    enterAdminMode: "Admin Panel (Management)",
    selectTable: "Please select your table number",
    startOrdering: "View Menu",
    tableLabel: "Table",
    searchPlaceholder: "Search dishes or drinks...",
    allCategories: "All categories",
    popularDishes: "Popular Dishes",
    recommendedDishes: "Recommended Dishes",
    addToCart: "Add to Cart",
    cartTitle: "Your Cart",
    emptyCart: "Your cart is empty. Add dishes from the menu!",
    total: "Total amount",
    placeOrder: "Place Order",
    orderNotes: "Order Notes",
    orderNotesPlaceholder: "E.g., no onions, not spicy, etc.",
    orderSuccess: "Your order has been successfully placed!",
    orderStatusTitle: "Order Status",
    orderStatusSubtitle: "Your dish will be ready soon",
    callWaiter: "Call Waiter",
    callChef: "Call Chef",
    waiterCalled: "Waiter notified!",
    chefCalled: "Chef notified!",
    callPending: "Call pending...",
    backToMenu: "Back to Menu",
    currency: "so'm",
    pcs: "pcs",
    kg: "kg",
    dishUnit: "Selling Unit",
    weightLabel: "Quantity/Weight (kg)",
    selectWeight: "Enter required weight (kg)",
    serviceCharge: "Service charge",
    tableSittingFee: "Table sitting fee",
    settings: "Service/Table Settings",
    serviceChargePercentLabel: "Service charge percentage (%)",
    tableSittingFeeLabel: "Table sitting fee (so'm)",
    tableCountLabel: "Number of Tables",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved!",
    mins: "mins",
    statusNew: "New Order",
    statusPreparing: "Preparing",
    statusReady: "Ready",
    statusDelivered: "Delivered",
    statusCancelled: "Cancelled",
    adminTitle: "Restaurant Management System",
    adminDashboard: "Dashboard",
    adminOrders: "Orders",
    adminMenu: "Dishes Menu",
    adminQR: "QR Codes",
    totalOrders: "Total Orders",
    todayRevenue: "Today's Revenue",
    activeTables: "Active Tables",
    topDishes: "Best Sellers",
    actions: "Actions",
    statusLabel: "Status",
    updateStatus: "Change Status",
    addDish: "Add New Dish",
    editDish: "Edit Dish",
    deleteDish: "Delete Dish",
    dishNameUz: "Name (Uzbek)",
    dishNameRu: "Name (Russian)",
    dishNameEn: "Name (English)",
    dishDescUz: "Description (Uzbek)",
    dishDescRu: "Description (Russian)",
    dishDescEn: "Description (English)",
    dishPrice: "Price (UZS)",
    dishCategory: "Category",
    dishImage: "Image URL",
    isPopularLabel: "Popular Dish",
    isRecommendedLabel: "Recommended",
    prepTimeLabel: "Prep Time (mins)",
    save: "Save",
    cancel: "Cancel",
    generateQR: "Generate QR Code",
    downloadQR: "Download QR",
    simulateQR: "Simulate Scan",
    staffCallsTitle: "Staff Calls Notification",
    resolveCall: "Mark as Resolved",
    clearTable: "Clear Table / New Session",
    tableCleared: "Table successfully cleared! Ready for next customer.",
    activeSession: "Active session",
    newClientSession: "New client session",
    paymentStatusLabel: "Payment status",
    paid: "Paid",
    unpaid: "Unpaid",
    markAsPaid: "Mark as Paid",
    markAsUnpaid: "Mark as Unpaid",
    totalUnpaid: "Total unpaid",
    leaveFeedback: "Leave Feedback",
    feedbackSuccess: "Thank you for your feedback!",
    ratingLabel: "Rating",
    commentLabel: "Comment",
    submitFeedback: "Submit",
    feedbackTitle: "Customer Feedbacks",
    averageRating: "Average Rating",
    allFeedbacks: "All Feedbacks",
    noFeedbackYet: "No feedback received yet.",
    today: "Today",
    yesterday: "Yesterday",
    last7days: "Last 7 days",
    allTime: "All time",
    clearHistory: "Clear History",
    confirmClearHistory: "Are you sure you want to completely clear the closed orders history? This action cannot be undone!",
    closeShift: "Close Shift",
    closeShiftConfirm: "Closing the shift will clear all active tables, resolve pending calls, and archive all orders. Do you wish to continue?",
  }
};

export interface AdminNotification {
  id: string;
  type: 'order' | 'call';
  title: { uz: string; ru: string; en: string };
  message: { uz: string; ru: string; en: string };
  createdAt: string;
  unread: boolean;
  tableNumber: number;
  referenceId: string;
}

