/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { Dish, Order, StaffCall, Language, translations, OrderStatus, AdminNotification, Feedback } from '../types';
import {
  TrendingUp,
  DollarSign,
  Users,
  Utensils,
  Bell,
  Clock,
  Edit2,
  Trash2,
  RefreshCw,
  Calendar,
  Plus,
  QrCode,
  CheckCircle,
  XCircle,
  FileText,
  ChefHat,
  ChevronRight,
  Globe,
  Settings,
  X,
  Play,
  Download,
  Percent,
  Save,
  Search,
  Hash,
  Upload,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getDishes,
  getOrders,
  getStaffCalls,
  updateOrderStatus,
  updateOrderPaymentStatus,
  resolveStaffCall,
  addDish,
  updateDish,
  deleteDish,
  getDashboardStats,
  DashboardStats,
  subscribeToSync,
  getRestaurantSettings,
  saveRestaurantSettings,
  resetTableSession,
  getTableSessionId,
  getAllTableSessions,
  getFeedbacks,
  clearCompletedOrders,
  closeRestaurantShift
} from '../lib/storage';
import { StatsSection } from './admin/StatsSection';
import { OrdersSection } from './admin/OrdersSection';
import { MenuSection } from './admin/MenuSection';
import { playNotificationSound } from './AudioNotification';
import LanguageSelector from './LanguageSelector';
import { generateReceiptPDF, generateSummaryReceiptPDF } from '../lib/receipt';

interface AdminDashboardProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToPortal: () => void;
  onSimulateTable: (tableNum: number) => void;
  addToast: (text: string, type: 'success' | 'info' | 'alert') => void;
}

type ActiveTab = 'dashboard' | 'orders' | 'history' | 'menu' | 'qr' | 'calls' | 'feedback';

export default function AdminDashboard({
  language,
  onLanguageChange,
  onBackToPortal,
  onSimulateTable,
  addToast,
}: AdminDashboardProps) {
  const t = translations[language];

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('qr_admin_auth') === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleVerifyPin = (e: FormEvent) => {
    e.preventDefault();
    const correctCode = import.meta.env.VITE_ADMIN_ACCESS_CODE || 'NukusGold2026';
    if (pinInput === correctCode) {
      setIsAuthenticated(true);
      sessionStorage.setItem('qr_admin_auth', 'true');
      addToast(
        language === 'uz' ? 'Xush kelibsiz, Administrator!' : language === 'ru' ? 'Добро пожаловать, Администратор!' : 'Welcome, Administrator!',
        'success'
      );
    } else {
      setPinError(true);
      setPinInput('');
      addToast(
        language === 'uz' ? 'Noto‘g‘ri parol!' : language === 'ru' ? 'Неверный пароль!' : 'Incorrect password!',
        'alert'
      );
      setTimeout(() => setPinError(false), 500);
    }
  };

  // Admin active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Local state pulled from storage
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    todayRevenue: 0,
    activeTables: 0,
    topDishes: [],
  });

  const [tableSessions, setTableSessions] = useState<Record<number, string>>({});

  // Modal State for Dish Add/Edit
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Table management state
  const [selectedTableForManage, setSelectedTableForManage] = useState<number | null>(null);

  // Search filter for orders (Client Session ID or Order ID)
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('all');

  // Form Fields for Dish Modal
  const [formNameUz, setFormNameUz] = useState('');
  const [formNameRu, setFormNameRu] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescUz, setFormDescUz] = useState('');
  const [formDescRu, setFormDescRu] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState<Dish['category']>('national');
  const [formImage, setFormImage] = useState('');
  const [imageDragActive, setImageDragActive] = useState(false);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsRecommended, setFormIsRecommended] = useState(false);
  const [formPrepTime, setFormPrepTime] = useState(15);
  const [formUnit, setFormUnit] = useState<'pcs' | 'kg'>('pcs');

  // Advanced QR Code Customizer states
  const [qrFgColor, setQrFgColor] = useState('#d4af37'); // Default premium gold
  const [qrBgColor, setQrBgColor] = useState('#080808'); // Default obsidian dark
  const [qrLogoType, setQrLogoType] = useState<'none' | 'initials' | 'star' | 'chef' | 'fork'>('initials');
  const [qrFrameType, setQrFrameType] = useState<'none' | 'elegant' | 'classic' | 'modern' | 'retro'>('elegant');
  const [qrTopText, setQrTopText] = useState('ONLAYN MENYU XIZMATI');
  const [qrBottomText, setQrBottomText] = useState('STOL');
  const [qrBorderWidth, setQrBorderWidth] = useState(3);

  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  // Restaurant settings states
  const [settingsServicePercent, setSettingsServicePercent] = useState(10);
  const [settingsSittingFee, setSettingsSittingFee] = useState(5000);
  const [settingsTableCount, setSettingsTableCount] = useState(12);

  // Real-time notifications state
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);

  // Load/initialize notifications from localStorage or build from active records
  const loadNotifications = async () => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem('qr_admin_notifications');
    let notifsList: AdminNotification[] = [];
    
    if (saved) {
      try {
        notifsList = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse admin notifications', e);
      }
    } else {
      // Build initial list from active/new orders and pending calls to be helpful!
      const currentOrders = await getOrders();
      const currentCalls = await getStaffCalls();
      
      const orderNotifs: AdminNotification[] = currentOrders
        .filter(o => o.status === 'new')
        .map(o => ({
          id: `notif-order-${o.id}`,
          type: 'order',
          title: {
            uz: `Stol ${o.tableNumber}: Yangi buyurtma`,
            ru: `Стол ${o.tableNumber}: Новый заказ`,
            en: `Table ${o.tableNumber}: New Order`
          },
          message: {
            uz: `Jami: ${o.totalAmount.toLocaleString('uz-UZ')} so'm. Izoh: ${o.notes || 'yo\'q'}`,
            ru: `Сумма: ${o.totalAmount.toLocaleString('uz-UZ')} сум. Коммент: ${o.notes || 'нет'}`,
            en: `Total: ${o.totalAmount.toLocaleString('uz-UZ')} UZS. Notes: ${o.notes || 'none'}`
          },
          createdAt: o.createdAt,
          unread: true,
          tableNumber: o.tableNumber,
          referenceId: o.id
        }));

      const callNotifs: AdminNotification[] = currentCalls
        .filter(c => c.status === 'pending')
        .map(c => ({
          id: `notif-call-${c.id}`,
          type: 'call',
          title: {
            uz: `Stol ${c.tableNumber}: ${c.type === 'waiter' ? 'Ofitsiant' : 'Oshpaz'} chaqiruvi`,
            ru: `Стол ${c.tableNumber}: Вызов ${c.type === 'waiter' ? 'официанта' : 'повара'}`,
            en: `Table ${c.tableNumber}: ${c.type === 'waiter' ? 'Waiter' : 'Chef'} called`
          },
          message: {
            uz: `Xodim zudlik bilan stolga yetib borishi kutilmoqda.`,
            ru: `Сотрудник должен немедленно подойти к столу.`,
            en: `Staff is requested to attend the table immediately.`
          },
          createdAt: c.createdAt,
          unread: true,
          tableNumber: c.tableNumber,
          referenceId: c.id
        }));

      notifsList = [...orderNotifs, ...callNotifs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      localStorage.setItem('qr_admin_notifications', JSON.stringify(notifsList));
    }
    
    setNotifications(notifsList);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, unread: false } : n);
      localStorage.setItem('qr_admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, unread: false }));
      localStorage.setItem('qr_admin_notifications', JSON.stringify(updated));
      return updated;
    });
    addToast(
      language === 'uz' ? 'Barcha bildirishnomalar o‘qildi deb belgilandi' : language === 'ru' ? 'Все уведомления отмечены как прочитанные' : 'All notifications marked as read',
      'success'
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('qr_admin_notifications', JSON.stringify([]));
    addToast(
      language === 'uz' ? 'Bildirishnomalar tozalandi' : language === 'ru' ? 'Уведомления очищены' : 'Notifications cleared',
      'info'
    );
  };

  const handleNotifClick = (notif: AdminNotification) => {
    handleMarkAsRead(notif.id);
    setIsNotifPanelOpen(false);
    
    if (notif.type === 'order') {
      setActiveTab('orders');
      setTimeout(() => {
        const element = document.getElementById(`admin-order-card-${notif.referenceId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('pulse-gold-highlight');
          setTimeout(() => {
            element.classList.remove('pulse-gold-highlight');
          }, 3000);
        }
      }, 150);
    } else if (notif.type === 'call') {
      setActiveTab('calls');
      setTimeout(() => {
        const element = document.getElementById(`call-card-${notif.referenceId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('pulse-rose-highlight');
          setTimeout(() => {
            element.classList.remove('pulse-rose-highlight');
          }, 3000);
        }
      }, 150);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    loadNotifications();
  }, []);


  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      addToast(
        language === 'uz'
          ? "Sizning brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi"
          : language === 'ru'
          ? 'Ваш браузер не поддерживает уведомления'
          : 'Your browser does not support notifications',
        'alert'
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        addToast(
          language === 'uz'
            ? 'Bildirishnomalar muvaffaqiyatli yoqildi!'
            : language === 'ru'
            ? 'Уведомления успешно включены!'
            : 'Notifications successfully enabled!',
          'success'
        );
        new Notification('Onlayn Menyu Xizmati', {
          body: language === 'uz'
            ? 'Bildirishnomalar muvaffaqiyatli yoqildi'
            : language === 'ru'
            ? 'Уведомления успешно включены'
            : 'Notifications successfully enabled',
          icon: '/favicon.ico'
        });
      } else {
        addToast(
          language === 'uz'
            ? 'Bildirishnomalarni yuborish rad etildi'
            : language === 'ru'
            ? 'Отказано в отправке уведомлений'
            : 'Notification permission denied',
          'alert'
        );
      }
    } catch (err) {
      console.error('Error requesting notification permission', err);
    }
  };

  // Load latest data from Supabase
  const loadLatestData = async () => {
    try {
      const [d, o, c, s, f, settings, sessions] = await Promise.all([
        getDishes(),
        getOrders(),
        getStaffCalls(),
        getDashboardStats(),
        getFeedbacks(),
        getRestaurantSettings(),
        getAllTableSessions()
      ]);
      setDishes(d);
      setOrders(o);
      setStaffCalls(c);
      setStats(s);
      setFeedbacks(f);

      // Convert sessions array to a record
      const sessionRecord: Record<number, string> = {};
      sessions.forEach(sess => {
        sessionRecord[sess.table_number] = sess.session_id;
      });
      setTableSessions(sessionRecord);

      setSettingsServicePercent(settings.serviceChargePercent);
      setSettingsSittingFee(settings.tableSittingFee);
      setSettingsTableCount(settings.tableCount || 12);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await saveRestaurantSettings({
        serviceChargePercent: settingsServicePercent,
        tableSittingFee: settingsSittingFee,
        tableCount: settingsTableCount
      });
      addToast(t.settingsSaved, 'success');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  useEffect(() => {
    loadLatestData();

    // Subscribe to multi-tab sync
    const unsubscribe = subscribeToSync((type, payload) => {
      loadLatestData();
      
      // If a customer created a new order or called staff, play sound and notify admin!
      if (type === 'ORDER_CREATED') {
        const o = payload as Order;
        
        // Add to persistent notification system
        const newNotif: AdminNotification = {
          id: `notif-order-${o.id}-${Date.now()}`,
          type: 'order',
          title: {
            uz: `Stol ${o.tableNumber}: Yangi buyurtma`,
            ru: `Стол ${o.tableNumber}: Новый заказ`,
            en: `Table ${o.tableNumber}: New Order`
          },
          message: {
            uz: `Jami: ${o.totalAmount.toLocaleString('uz-UZ')} so'm. Izoh: ${o.notes || 'yo\'q'}`,
            ru: `Сумма: ${o.totalAmount.toLocaleString('uz-UZ')} сум. Коммент: ${o.notes || 'нет'}`,
            en: `Total: ${o.totalAmount.toLocaleString('uz-UZ')} UZS. Notes: ${o.notes || 'none'}`
          },
          createdAt: o.createdAt,
          unread: true,
          tableNumber: o.tableNumber,
          referenceId: o.id
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          localStorage.setItem('qr_admin_notifications', JSON.stringify(updated));
          return updated;
        });

        addToast(
          language === 'uz'
            ? `Stol ${o.tableNumber} dan yangi buyurtma keldi!`
            : language === 'ru'
            ? `Новый заказ со стола ${o.tableNumber}!`
            : `New order received from Table ${o.tableNumber}!`,
          'alert'
        );
        playNotificationSound('bell');

        // Trigger real desktop notification if granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const title = language === 'uz' ? 'Yangi buyurtma!' : language === 'ru' ? 'Новый заказ!' : 'New Order!';
          const body = language === 'uz'
            ? `Stol ${o.tableNumber} dan yangi buyurtma keldi. Jami: ${o.totalAmount.toLocaleString('uz-UZ')} so'm`
            : language === 'ru'
            ? `Новый заказ со стола ${o.tableNumber}. Сумма: ${o.totalAmount.toLocaleString('uz-UZ')} сум`
            : `New order received from Table ${o.tableNumber}. Total: ${o.totalAmount.toLocaleString('uz-UZ')} UZS`;
          
          try {
            new Notification(title, {
              body,
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.error('Failed to trigger desktop notification:', e);
          }
        }
      } else if (type === 'STAFF_CALL') {
        const call = payload as StaffCall;
        const msg = call.type === 'waiter' ? 'Ofitsiant' : 'Oshpaz';
        const msgRu = call.type === 'waiter' ? 'официанта' : 'повара';
        const msgEn = call.type === 'waiter' ? 'Waiter' : 'Chef';

        // Add to persistent notification system
        const newNotif: AdminNotification = {
          id: `notif-call-${call.id}-${Date.now()}`,
          type: 'call',
          title: {
            uz: `Stol ${call.tableNumber}: ${msg} chaqiruvi`,
            ru: `Стол ${call.tableNumber}: Вызов ${msgRu}`,
            en: `Table ${call.tableNumber}: ${msgEn} called`
          },
          message: {
            uz: `Xodim zudlik bilan stolga yetib borishi kutilmoqda.`,
            ru: `Сотрудник должен немедленно подойти к столу.`,
            en: `Staff is requested to attend the table immediately.`
          },
          createdAt: call.createdAt,
          unread: true,
          tableNumber: call.tableNumber,
          referenceId: call.id
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          localStorage.setItem('qr_admin_notifications', JSON.stringify(updated));
          return updated;
        });

        addToast(
          language === 'uz'
            ? `Stol ${call.tableNumber}: ${msg} chaqirilmoqda!`
            : language === 'ru'
            ? `Стол ${call.tableNumber}: Вызывают ${call.type === 'waiter' ? 'официанта' : 'шеф-повара'}!`
            : `Table ${call.tableNumber} is calling the ${call.type}!`,
          'alert'
        );
        playNotificationSound('bell');

        // Trigger real desktop notification if granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const title = language === 'uz' ? 'Xodim chaqiruvi!' : language === 'ru' ? 'Вызов сотрудника!' : 'Staff Call!';
          const body = language === 'uz'
            ? `Stol ${call.tableNumber} da ${msg.toLowerCase()} chaqirilmoqda.`
            : language === 'ru'
            ? `На столе ${call.tableNumber} вызывают ${call.type === 'waiter' ? 'официанта' : 'шеф-повара'}.`
            : `Table ${call.tableNumber} is calling ${call.type}.`;
          
          try {
            new Notification(title, {
              body,
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.error('Failed to trigger desktop notification:', e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [language]);

  // Advanced Customized QR Code PNG Generation & Download
  const handleDownloadCustomQR = (num: number) => {
    addToast(
      language === 'uz' ? `Stol ${num} uchun QR dizayni tayyorlanmoqda...` :
      language === 'ru' ? `Подготовка дизайна QR для стола ${num}...` :
      `Preparing QR design for Table ${num}...`,
      'info'
    );

    const canvas = document.createElement('canvas');
    const cardWidth = 600;
    const cardHeight = 850;
    canvas.width = cardWidth;
    canvas.height = cardHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Background
    ctx.fillStyle = qrBgColor;
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // 2. Fetch the QR Code Image from the public API with custom colors
    const fgHex = qrFgColor.replace('#', '');
    const bgHex = qrBgColor.replace('#', '');
    const tableUrl = `${window.location.origin}?table=${num}`;
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(tableUrl)}&color=${fgHex}&bgcolor=${bgHex}&margin=1`;

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Prevent security exception
    img.src = qrImgSrc;

    img.onload = () => {
      try {
        const qrSize = 380;
        const qrX = (cardWidth - qrSize) / 2;
        const qrY = (cardHeight - qrSize) / 2 + 10;

        // Draw the main QR Code graphic
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // 3. Draw Frame decorations
        if (qrFrameType === 'elegant') {
          ctx.strokeStyle = qrFgColor;
          ctx.lineWidth = qrBorderWidth;
          ctx.strokeRect(20, 20, cardWidth - 40, cardHeight - 40);
          
          ctx.lineWidth = Math.max(1, qrBorderWidth - 1);
          ctx.strokeRect(28, 28, cardWidth - 56, cardHeight - 56);

          // Corner brackets
          const size = 30;
          ctx.fillStyle = qrFgColor;
          // Top Left
          ctx.fillRect(20, 20, size, 4);
          ctx.fillRect(20, 20, 4, size);
          // Top Right
          ctx.fillRect(cardWidth - 20 - size, 20, size, 4);
          ctx.fillRect(cardWidth - 20, 20, 4, size);
          // Bottom Left
          ctx.fillRect(20, cardHeight - 20, size, 4);
          ctx.fillRect(20, cardHeight - 20 - size, 4, size);
          // Bottom Right
          ctx.fillRect(cardWidth - 20 - size, cardHeight - 20, size, 4);
          ctx.fillRect(cardWidth - 20, cardHeight - 20 - size, 4, size);

          // Typography
          ctx.font = 'bold 36px Georgia, serif';
          ctx.fillStyle = qrFgColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(qrTopText.toUpperCase(), cardWidth / 2, 75);

          ctx.font = 'bold 46px Georgia, serif';
          ctx.fillText(`${qrBottomText.toUpperCase()} ${num}`, cardWidth / 2, cardHeight - 90);

          ctx.font = 'italic 16px Georgia, serif';
          ctx.fillStyle = qrFgColor + 'b0';
          ctx.fillText('ONLAYN MENYU PREMIUM SELECTION', cardWidth / 2, cardHeight - 45);

        } else if (qrFrameType === 'classic') {
          ctx.strokeStyle = qrFgColor;
          ctx.lineWidth = qrBorderWidth * 2;
          ctx.strokeRect(15, 15, cardWidth - 30, cardHeight - 30);

          // Top Header block
          ctx.fillStyle = qrFgColor;
          ctx.fillRect(25, 25, cardWidth - 50, 90);

          ctx.fillStyle = qrBgColor === '#ffffff' ? '#000000' : '#ffffff';
          ctx.font = 'bold 32px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(qrTopText.toUpperCase(), cardWidth / 2, 70);

          // Table Number Badge
          ctx.fillStyle = qrFgColor;
          ctx.fillRect(cardWidth / 2 - 150, cardHeight - 145, 300, 65);

          ctx.fillStyle = qrBgColor === '#ffffff' ? '#000000' : '#ffffff';
          ctx.font = 'bold 38px Arial, sans-serif';
          ctx.fillText(`${qrBottomText.toUpperCase()} ${num}`, cardWidth / 2, cardHeight - 112);

          ctx.fillStyle = qrFgColor;
          ctx.font = 'bold 20px Arial, sans-serif';
          ctx.fillText('SCAN ME TO ORDER / SKANERLANG', cardWidth / 2, cardHeight - 50);

        } else if (qrFrameType === 'modern') {
          ctx.strokeStyle = qrFgColor;
          ctx.lineWidth = qrBorderWidth;
          ctx.strokeRect(30, 30, cardWidth - 60, cardHeight - 60);

          ctx.fillStyle = qrFgColor;
          ctx.fillRect(cardWidth / 2 - 80, 110, 160, 2);

          ctx.font = 'bold 28px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(qrTopText, cardWidth / 2, 75);

          ctx.font = 'bold 42px "Inter", sans-serif';
          ctx.fillText(`${qrBottomText} ${num}`, cardWidth / 2, cardHeight - 95);

          ctx.font = '16px monospace';
          ctx.fillStyle = qrFgColor + '90';
          ctx.fillText('SCAN THE QR FOR DIGITAL MENU', cardWidth / 2, cardHeight - 50);

        } else if (qrFrameType === 'retro') {
          ctx.strokeStyle = qrFgColor;
          ctx.lineWidth = qrBorderWidth;
          ctx.setLineDash([12, 8]);
          ctx.strokeRect(20, 20, cardWidth - 40, cardHeight - 40);
          ctx.setLineDash([]); // Reset

          ctx.font = 'bold italic 34px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = qrFgColor;
          ctx.fillText(`★  ${qrTopText}  ★`, cardWidth / 2, 80);

          ctx.font = 'bold 50px monospace';
          ctx.fillText(`[ ${qrBottomText} ${num} ]`, cardWidth / 2, cardHeight - 100);

          ctx.font = 'bold 16px monospace';
          ctx.fillText('----------------------------------', cardWidth / 2, cardHeight - 55);
          ctx.fillText('EST. 2024 • ONLAYN MENYU', cardWidth / 2, cardHeight - 40);
        }

        // 4. Draw Central Logo Badge
        if (qrLogoType !== 'none') {
          const badgeRadius = 38;
          const badgeX = cardWidth / 2;
          const badgeY = qrY + (qrSize / 2);

          // Outer circular edge
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeRadius + 2, 0, 2 * Math.PI);
          ctx.fillStyle = qrFgColor;
          ctx.fill();

          // Inner filled circle
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
          ctx.fillStyle = qrBgColor;
          ctx.fill();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = qrFgColor;

          if (qrLogoType === 'initials') {
            ctx.font = 'bold 24px Georgia, serif';
            ctx.fillText('NG', badgeX, badgeY + 1);
          } else if (qrLogoType === 'star') {
            ctx.font = '30px sans-serif';
            ctx.fillText('⭐', badgeX, badgeY + 1);
          } else if (qrLogoType === 'chef') {
            ctx.font = '32px sans-serif';
            ctx.fillText('👨‍🍳', badgeX, badgeY);
          } else if (qrLogoType === 'fork') {
            ctx.font = '30px sans-serif';
            ctx.fillText('🍽️', badgeX, badgeY + 1);
          }
        }

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `OnlaynMenyu-QR-Stol${num}-Design.png`;
        link.href = dataUrl;
        link.click();

        addToast(
          language === 'uz' ? `Dizayn yuklab olindi!` :
          language === 'ru' ? `Дизайн успешно скачан!` :
          `Design successfully downloaded!`,
          'success'
        );
      } catch (err) {
        console.error('Canvas processing error:', err);
        // Direct download fallback
        const link = document.createElement('a');
        link.download = `QR-Stol${num}.png`;
        link.href = qrImgSrc;
        link.click();
      }
    };

    img.onerror = () => {
      const link = document.createElement('a');
      link.download = `QR-Stol${num}.png`;
      link.href = qrImgSrc;
      link.click();
    };
  };

  // Order Status update
  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      await loadLatestData();
      playNotificationSound('success');
      addToast(
        language === 'uz' ? 'Buyurtma holati yangilandi' : language === 'ru' ? 'Статус заказа обновлен' : 'Order status updated',
        'success'
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  // Staff Call Resolve
  const handleResolveCall = async (id: string) => {
    try {
      await resolveStaffCall(id);
      await loadLatestData();
      playNotificationSound('resolve');
      addToast(
        language === 'uz' ? 'Chaqiruv bajarildi' : language === 'ru' ? 'Вызов выполнен' : 'Call marked as resolved',
        'success'
      );
    } catch (error) {
      console.error('Failed to resolve staff call:', error);
    }
  };

  // Dish Modal Open (for editing or adding)
  const openDishModal = (dish: Dish | null) => {
    if (dish) {
      setEditingDish(dish);
      setFormNameUz(dish.name.uz);
      setFormNameRu(dish.name.ru);
      setFormNameEn(dish.name.en);
      setFormDescUz(dish.description.uz);
      setFormDescRu(dish.description.ru);
      setFormDescEn(dish.description.en);
      setFormPrice(dish.price);
      setFormCategory(dish.category);
      setFormImage(dish.image);
      setFormIsPopular(!!dish.isPopular);
      setFormIsRecommended(!!dish.isRecommended);
      setFormPrepTime(dish.preparationTime || 15);
      setFormUnit(dish.unit || 'pcs');
    } else {
      setEditingDish(null);
      setFormNameUz('');
      setFormNameRu('');
      setFormNameEn('');
      setFormDescUz('');
      setFormDescRu('');
      setFormDescEn('');
      setFormPrice(0);
      setFormCategory('national');
      setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop');
      setFormIsPopular(false);
      setFormIsRecommended(false);
      setFormPrepTime(15);
      setFormUnit('pcs');
    }
    setIsDishModalOpen(true);
  };

  // Save Dish (Add or Update)
  const handleSaveDish = async (e: FormEvent) => {
    e.preventDefault();

    const dishPayload: Dish = {
      id: editingDish ? editingDish.id : `dish-${Date.now()}`,
      name: { uz: formNameUz, ru: formNameRu, en: formNameEn },
      description: { uz: formDescUz, ru: formDescRu, en: formDescEn },
      price: Number(formPrice),
      category: formCategory,
      image: formImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
      isPopular: formIsPopular,
      isRecommended: formIsRecommended,
      preparationTime: Number(formPrepTime),
      unit: formUnit
    };

    try {
      if (editingDish) {
        await updateDish(dishPayload);
        addToast(
          language === 'uz' ? 'Taom tahrirlandi' : language === 'ru' ? 'Блюдо отредактировано' : 'Dish edited successfully',
          'success'
        );
      } else {
        await addDish(dishPayload);
        addToast(
          language === 'uz' ? 'Yangi taom qo‘shildi' : language === 'ru' ? 'Добавлено новое блюдо' : 'New dish added successfully',
          'success'
        );
      }

      setIsDishModalOpen(false);
      await loadLatestData();
      playNotificationSound('success');
    } catch (error) {
      console.error('Failed to save dish:', error);
      addToast(language === 'uz' ? 'Xatolik yuz berdi' : language === 'ru' ? 'Произошла ошибка' : 'An error occurred', 'error');
    }
  };

  // Delete Dish
  const handleDeleteDish = async (id: string) => {
    if (window.confirm(language === 'uz' ? 'Ushbu taomni o‘chirishni xohlaysizmi?' : 'Вы уверены, что хотите удалить это блюдо?')) {
      try {
        await deleteDish(id);
        await loadLatestData();
        playNotificationSound('resolve');
        addToast(
          language === 'uz' ? 'Taom muvaffaqiyatli o‘chirildi' : language === 'ru' ? 'Блюдо успешно удалено' : 'Dish deleted successfully',
          'info'
        );
      } catch (error) {
        console.error('Failed to delete dish:', error);
        addToast(language === 'uz' ? 'Xatolik yuz berdi' : language === 'ru' ? 'Произошла ошибка' : 'An error occurred', 'error');
      }
    }
  };

  // Helper formats
  const formatPrice = (num: number) => {
    return num.toLocaleString('uz-UZ') + ' ' + t.currency;
  };

  const pendingCalls = useMemo(() => {
    return staffCalls.filter(c => c.status === 'pending');
  }, [staffCalls]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelled') return false;
      if (o.status === 'delivered' && o.paymentStatus === 'paid') return false;
      return true;
    })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelled') return true;
      if (o.status === 'delivered' && o.paymentStatus === 'paid') return true;
      return false;
    })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const filteredActiveOrders = useMemo(() => {
    let list = activeOrders;
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      list = list.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.tableNumber.toString() === q ||
        (o.sessionId && o.sessionId.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeOrders, orderSearchQuery]);

  const filteredCompletedOrders = useMemo(() => {
    let list = completedOrders;
    if (historyStatusFilter !== 'all') {
      list = list.filter(o => o.status === historyStatusFilter);
    }
    if (historyDateFilter !== 'all') {
      const now = new Date();
      const todayString = now.toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      list = list.filter(o => {
        const orderDate = new Date(o.createdAt);
        if (historyDateFilter === 'today') {
          return orderDate.toDateString() === todayString;
        } else if (historyDateFilter === 'yesterday') {
          return orderDate.toDateString() === yesterdayString;
        } else if (historyDateFilter === 'week') {
          const diffTime = Math.abs(now.getTime() - orderDate.getTime());
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        }
        return true;
      });
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      list = list.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.tableNumber.toString() === q ||
        (o.sessionId && o.sessionId.toLowerCase().includes(q))
      );
    }
    return list;
  }, [completedOrders, orderSearchQuery, historyStatusFilter, historyDateFilter]);

  // Computed state for the currently selected table being managed
  const managedTableSessionId = selectedTableForManage !== null ? (tableSessions[selectedTableForManage] || `sess-${selectedTableForManage}-default`) : '';
  const managedTableSessionOrders = selectedTableForManage !== null 
    ? orders.filter(o => o.tableNumber === selectedTableForManage && o.sessionId === managedTableSessionId && o.status !== 'cancelled')
    : [];
  const managedTableHasActiveOrder = managedTableSessionOrders.length > 0;
  const managedTableHasPendingCall = selectedTableForManage !== null 
    ? staffCalls.some(c => c.tableNumber === selectedTableForManage && c.status === 'pending')
    : false;

  let modalBorderClass = 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]';
  let tableBadgeClass = 'bg-emerald-500 text-black';
  let statusName = language === 'uz' ? "Bo'sh (Toza)" : language === 'ru' ? 'Свободен' : 'Free';

  if (managedTableHasPendingCall) {
    modalBorderClass = 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]';
    tableBadgeClass = 'bg-amber-500 text-black animate-pulse';
    statusName = language === 'uz' ? 'Chaqiruv' : language === 'ru' ? 'Вызов' : 'Staff Called';
  } else if (managedTableHasActiveOrder) {
    modalBorderClass = 'border-rose-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]';
    tableBadgeClass = 'bg-rose-500 text-white font-bold';
    statusName = language === 'uz' ? 'Band' : language === 'ru' ? 'Занят' : 'Busy / Occupied';
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center relative px-4" id="admin-login-screen">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-md glass-card p-8 rounded-2xl shadow-2xl relative border ${
            pinError ? 'border-red-500/50 shake-element' : 'border-amber-500/20'
          }`}
        >
          {/* Decorative lock icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full border border-amber-500/30 flex items-center justify-center bg-black/60 mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-xl font-serif text-amber-100 font-semibold tracking-wide uppercase text-center">
              {language === 'uz' ? 'BOSHQARUV PANELIGA KIRISH' : language === 'ru' ? 'ВХОД В ПАНЕЛЬ УПРАВЛЕНИЯ' : 'ADMIN PANEL ACCESS'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              {language === 'uz' ? 'Davom etish uchun parolni kiriting' : language === 'ru' ? 'Введите пароль для продолжения' : 'Enter access code to continue'}
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-6">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-900 border border-neutral-850 focus:border-amber-500/60 rounded-xl px-4 py-3.5 text-center text-amber-100 text-lg tracking-widest focus:outline-none transition-colors font-mono"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full gold-btn py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                {language === 'uz' ? 'Kirish' : language === 'ru' ? 'Войти' : 'Enter'}
              </button>

              <button
                type="button"
                onClick={onBackToPortal}
                className="w-full py-3 bg-transparent text-neutral-400 hover:text-amber-300 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-colors cursor-pointer"
              >
                {language === 'uz' ? 'Ortga' : language === 'ru' ? 'Назад' : 'Back'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-100 flex flex-col md:flex-row relative" id="admin-dashboard-layout">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-neutral-950 border-b md:border-b-0 md:border-r border-amber-500/10 p-5 flex flex-col justify-between z-20 shrink-0" id="admin-sidebar">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 pulse-gold shrink-0" />
              <div>
                <h1 className="text-sm font-serif font-semibold text-amber-100 tracking-wide uppercase">
                  ONLAYN MENYU
                </h1>
                <p className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase">
                  {t.adminTitle}
                </p>
              </div>
            </div>

            <button
              onClick={onBackToPortal}
              className="text-xs text-neutral-500 hover:text-amber-400 border border-neutral-800 rounded px-2 py-1 md:hidden"
              id="btn-sidebar-back"
            >
              Chiqish
            </button>
          </div>

          <nav className="space-y-1.5" id="sidebar-nav">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-amber-100'
              }`}
              id="nav-tab-dashboard"
            >
              <TrendingUp className="w-4 h-4" />
              {t.adminDashboard}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-amber-100'
              }`}
              id="nav-tab-orders"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
                <span>{t.adminOrders}</span>
              </div>
              {activeOrders.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold ${activeTab === 'orders' ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setHistoryStatusFilter('all');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-amber-100'
              }`}
              id="nav-tab-history"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>
                  {language === 'uz' ? 'Yopilgan Buyurtmalar' : language === 'ru' ? 'Архив Заказов' : 'Order History'}
                </span>
              </div>
              {completedOrders.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold ${activeTab === 'history' ? 'bg-black text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}>
                  {completedOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-amber-100'
              }`}
              id="nav-tab-menu"
            >
              <Utensils className="w-4 h-4" />
              {t.adminMenu}
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-amber-100'
              }`}
              id="nav-tab-qr"
            >
              <QrCode className="w-4 h-4" />
              {t.adminQR}
            </button>

            <button
              onClick={() => setActiveTab('calls')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === 'calls'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-amber-100'
              }`}
              id="nav-tab-calls"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Chaqiruvlar</span>
              </div>
              {pendingCalls.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 pulse-gold animate-bounce shrink-0" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-amber-100'
              }`}
              id="nav-tab-feedback"
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>{t.feedbackTitle}</span>
              </div>
              {feedbacks.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-sans font-semibold bg-neutral-800 text-neutral-400">
                  {feedbacks.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-6 border-t border-neutral-900 space-y-4 hidden md:block">
          {/* Browser Desktop Notification Status & Request button */}
          <div className="space-y-2 bg-neutral-950/80 p-3 rounded-lg border border-neutral-900" id="sidebar-notification-controls">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">
                {language === 'uz' ? 'Bildirishnomalar' : language === 'ru' ? 'Уведомления' : 'Notifications'}
              </span>
              <span className={`w-2 h-2 rounded-full ${
                notificationPermission === 'granted' ? 'bg-emerald-500' :
                notificationPermission === 'denied' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
            </div>
            
            <button
              id="sidebar-btn-request-notifications"
              onClick={requestNotificationPermission}
              className={`w-full py-2 px-3 rounded text-[11px] font-medium transition-all duration-200 text-center flex items-center justify-center gap-2 cursor-pointer ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                  : notificationPermission === 'denied'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-amber-500 text-black hover:bg-amber-400 font-bold'
              }`}
            >
              <Bell className="w-3.5 h-3.5 animate-pulse" />
              {notificationPermission === 'granted'
                ? (language === 'uz' ? 'Yoqilgan' : language === 'ru' ? 'Включено' : 'Enabled')
                : notificationPermission === 'denied'
                ? (language === 'uz' ? 'Rad etilgan' : language === 'ru' ? 'Отклонено' : 'Blocked')
                : (language === 'uz' ? 'Ruxsat berish' : language === 'ru' ? 'Разрешить' : 'Request Access')}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 font-medium">TIL</span>
            <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
          </div>

          <button
            onClick={onBackToPortal}
            className="w-full bg-neutral-900/60 hover:bg-neutral-900 text-xs text-neutral-400 hover:text-amber-300 py-2.5 border border-neutral-800 rounded-lg uppercase tracking-wider transition-all duration-200"
            id="btn-sidebar-logout"
          >
            Tizimdan Chiqish
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6 z-10" id="admin-main-section">
        
        {/* Unified Top Header Controls (Both Desktop and Mobile) */}
        <header className="flex justify-between items-center pb-4 border-b border-neutral-900" id="admin-unified-header">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-serif font-bold text-amber-500 uppercase tracking-widest">
              {activeTab === 'dashboard' && t.adminDashboard}
              {activeTab === 'orders' && t.adminOrders}
              {activeTab === 'history' && (language === 'uz' ? 'Yopilgan Buyurtmalar' : language === 'ru' ? 'Архив Заказов' : 'Order History')}
              {activeTab === 'menu' && t.adminMenu}
              {activeTab === 'qr' && t.adminQR}
              {activeTab === 'calls' && 'Xizmat Chaqiruvi'}
              {activeTab === 'feedback' && t.feedbackTitle}
            </span>
          </div>

          <div className="flex items-center gap-3 relative" id="header-language-container">
            <div className="scale-90 origin-right">
              <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
            </div>
          </div>
        </header>

        {/* STATS OVERVIEW */}
        {activeTab === 'dashboard' && (
          <StatsSection
            language={language}
            t={t}
            notificationPermission={notificationPermission}
            requestNotificationPermission={requestNotificationPermission}
            stats={stats}
            pendingCalls={pendingCalls}
            formatPrice={formatPrice}
            settingsTableCount={settingsTableCount}
            orders={orders}
            staffCalls={staffCalls}
            setSelectedTableForManage={setSelectedTableForManage}
            settingsServicePercent={settingsServicePercent}
            setSettingsServicePercent={setSettingsServicePercent}
            settingsSittingFee={settingsSittingFee}
            setSettingsSittingFee={setSettingsSittingFee}
            setSettingsTableCount={setSettingsTableCount}
            handleSaveSettings={handleSaveSettings}
            tableSessions={tableSessions}
          />
        )}

        {/* TAB: REAL-TIME ORDERS */}
        {activeTab === 'orders' && (
          <OrdersSection
            activeOrders={activeOrders}
            orderSearchQuery={orderSearchQuery}
            setOrderSearchQuery={setOrderSearchQuery}
            filteredActiveOrders={filteredActiveOrders}
            handleUpdateStatus={handleUpdateStatus}
            language={language}
            t={t}
            formatPrice={formatPrice}
            dishes={dishes}
            loadLatestData={loadLatestData}
            addToast={addToast}
          />
        )}

        {/* TAB: DISHES MENU MANAGER */}
        {activeTab === 'menu' && (
          <MenuSection
            dishes={dishes}
            openDishModal={openDishModal}
            handleDeleteDish={handleDeleteDish}
            language={language}
            t={t}
            formatPrice={formatPrice}
          />
        )}

        {/* TAB: QR CODE CENTER */}
        {activeTab === 'qr' && (
          <div className="space-y-8 animate-fadeIn" id="qr-tab-content">
            <div className="text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-amber-100 font-semibold mb-1">
                  {language === 'uz' ? 'Premium QR-Kod Konstruktori' : language === 'ru' ? 'Премиум Конструктор QR-Кодов' : 'Premium QR Code Customizer'}
                </h2>
                <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
                  {language === 'uz'
                    ? 'Stollar uchun QR-kodlarni restoraningiz brendi ranglari, ramka va logotiplari bilan professional tarzda moslashtiring.'
                    : language === 'ru'
                    ? 'Настройте дизайн QR-кодов под бренд вашего ресторана: меняйте цвета, рамки, надписи и центральные логотипы.'
                    : 'Style your table QR codes to perfectly match your brand. Customize colors, frames, titles, and center icons before printing.'}
                </p>
              </div>
            </div>

            {/* INTERACTIVE CUSTOMIZER PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-950/60 rounded-2xl p-6 border border-amber-500/10 backdrop-blur-md" id="qr-customizer-dashboard">
              
              {/* Left Column: Customizer Controls (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4 border-b border-neutral-900 pb-2">
                    {language === 'uz' ? 'Moslashtirish Sozlamalari' : language === 'ru' ? 'Параметры кастомизации' : 'Customization Settings'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Foreground Color Picker & Presets */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-neutral-400 block font-medium">
                        {language === 'uz' ? 'Asosiy Rang (QR & Chiziqlar)' : language === 'ru' ? 'Основной цвет (QR и линии)' : 'Foreground Color (QR & Lines)'}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={qrFgColor}
                          onChange={(e) => setQrFgColor(e.target.value)}
                          className="w-10 h-10 rounded border border-neutral-800 bg-transparent cursor-pointer shrink-0"
                          title="Pick custom foreground color"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { hex: '#d4af37', name: 'Oltin' },
                            { hex: '#10b981', name: 'Emerald' },
                            { hex: '#f43f5e', name: 'Ruby' },
                            { hex: '#3b82f6', name: 'Sapphire' },
                            { hex: '#ffffff', name: 'White' },
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setQrFgColor(c.hex)}
                              style={{ backgroundColor: c.hex }}
                              className={`w-5 h-5 rounded-full border ${qrFgColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-offset-neutral-950 ring-amber-500 scale-110' : 'border-neutral-700'} cursor-pointer`}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Background Color Picker & Presets */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-neutral-400 block font-medium">
                        {language === 'uz' ? 'Orqa Fon Rangi' : language === 'ru' ? 'Цвет заднего фона' : 'Background Color'}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={qrBgColor}
                          onChange={(e) => setQrBgColor(e.target.value)}
                          className="w-10 h-10 rounded border border-neutral-800 bg-transparent cursor-pointer shrink-0"
                          title="Pick custom background color"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { hex: '#080808', name: 'Obsidian' },
                            { hex: '#111827', name: 'Slate' },
                            { hex: '#fdf6e2', name: 'Cream' },
                            { hex: '#ffffff', name: 'White' },
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setQrBgColor(c.hex)}
                              style={{ backgroundColor: c.hex }}
                              className={`w-5 h-5 rounded-full border ${qrBgColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-offset-neutral-950 ring-amber-500 scale-110' : 'border-neutral-700'} cursor-pointer`}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Frame Layout Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-neutral-400 block font-medium">
                    {language === 'uz' ? 'Ramka Dizayn Preseti' : language === 'ru' ? 'Предустановки стиля рамки' : 'Frame Preset Style'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'none', label: language === 'uz' ? 'Oddiy' : language === 'ru' ? 'Простой' : 'Plain' },
                      { id: 'elegant', label: language === 'uz' ? 'Elegant' : language === 'ru' ? 'Элегант' : 'Elegant' },
                      { id: 'classic', label: language === 'uz' ? 'Klassik' : language === 'ru' ? 'Классик' : 'Classic' },
                      { id: 'modern', label: language === 'uz' ? 'Modern' : language === 'ru' ? 'Модерн' : 'Modern' },
                      { id: 'retro', label: language === 'uz' ? 'Retro' : language === 'ru' ? 'Ретро' : 'Retro' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setQrFrameType(f.id as any)}
                        className={`py-2 px-2.5 rounded text-xs font-medium border transition-all cursor-pointer ${
                          qrFrameType === f.id
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500'
                            : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:bg-neutral-800/80 hover:text-neutral-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Central Logo Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-neutral-400 block font-medium">
                    {language === 'uz' ? 'Markaziy Logotip Belgisi' : language === 'ru' ? 'Центральный логотип' : 'Center Logo Badge'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'none', label: language === 'uz' ? 'Logosiz' : language === 'ru' ? 'Без лого' : 'No Logo' },
                      { id: 'initials', label: 'NG Crest (NG)' },
                      { id: 'star', label: 'Star ⭐' },
                      { id: 'chef', label: 'Chef Hat 👨‍🍳' },
                      { id: 'fork', label: 'Fork & Knife 🍽️' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setQrLogoType(l.id as any)}
                        className={`py-2 px-2 rounded text-xs font-medium border transition-all cursor-pointer truncate ${
                          qrLogoType === l.id
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500'
                            : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:bg-neutral-800/80 hover:text-neutral-200'
                        }`}
                        title={l.label}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Labels Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-neutral-400 block">
                      {language === 'uz' ? 'Yuqori Sarlavha' : language === 'ru' ? 'Верхний заголовок' : 'Top Label Title'}
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={qrTopText}
                      onChange={(e) => setQrTopText(e.target.value)}
                      className="w-full bg-neutral-900/90 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
                      placeholder="e.g. ONLAYN MENYU"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-neutral-400 block">
                      {language === 'uz' ? 'Pastki Stol Sarlavhasi' : language === 'ru' ? 'Нижний заголовок стола' : 'Bottom Table Label'}
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={qrBottomText}
                      onChange={(e) => setQrBottomText(e.target.value)}
                      className="w-full bg-neutral-900/90 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
                      placeholder="e.g. STOL"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-neutral-400 block">
                      {language === 'uz' ? 'Chiziq Qalinligi' : language === 'ru' ? 'Толщина линий' : 'Border Width'} ({qrBorderWidth}px)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={qrBorderWidth}
                      onChange={(e) => setQrBorderWidth(Number(e.target.value))}
                      className="w-full accent-amber-500 mt-2 cursor-ew-resize"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Beautiful Live Interactive Preview (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center bg-neutral-950 rounded-xl p-4 border border-neutral-900">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-3">
                  {language === 'uz' ? 'Jonli placard ko\'rinishi (Stol 1 misolida)' : language === 'ru' ? 'Предпросмотр плаката (Пример Стола 1)' : 'Live placard preview (Table 1 Example)'}
                </span>

                {/* Simulated Placard Container with custom styled frame */}
                <div
                  id="live-qr-placard-preview"
                  style={{ backgroundColor: qrBgColor }}
                  className="w-full max-w-[250px] aspect-[1/1.4] rounded-xl p-4 relative flex flex-col items-center justify-between shadow-2xl transition-all duration-300"
                >
                  {/* Decorative Double Border Frame */}
                  {qrFrameType === 'elegant' && (
                    <div
                      style={{ borderColor: qrFgColor, borderWidth: `${qrBorderWidth}px` }}
                      className="absolute inset-2 border pointer-events-none rounded-lg"
                    >
                      <div
                        style={{ borderColor: qrFgColor, borderWidth: `${Math.max(1, qrBorderWidth - 1)}px` }}
                        className="absolute inset-0.5 border"
                      />
                      {/* Inner Corner Accents */}
                      <span className="absolute top-0.5 left-0.5 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: qrFgColor }} />
                      <span className="absolute top-0.5 right-0.5 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: qrFgColor }} />
                      <span className="absolute bottom-0.5 left-0.5 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: qrFgColor }} />
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: qrFgColor }} />
                    </div>
                  )}

                  {qrFrameType === 'classic' && (
                    <div
                      style={{ borderColor: qrFgColor, borderWidth: `${qrBorderWidth * 1.5}px` }}
                      className="absolute inset-1 border pointer-events-none rounded-md"
                    />
                  )}

                  {qrFrameType === 'modern' && (
                    <div
                      style={{ borderColor: qrFgColor, borderWidth: `${qrBorderWidth}px` }}
                      className="absolute inset-2 border pointer-events-none rounded-sm"
                    />
                  )}

                  {qrFrameType === 'retro' && (
                    <div
                      style={{ borderColor: qrFgColor, borderWidth: `${qrBorderWidth}px` }}
                      className="absolute inset-2 border border-dashed pointer-events-none rounded-md"
                    />
                  )}

                  {/* Top Text content */}
                  <div className="w-full text-center pt-2.5 z-10">
                    {qrFrameType === 'classic' ? (
                      <div style={{ backgroundColor: qrFgColor }} className="mx-2 py-1 px-1.5 rounded shadow">
                        <span
                          className="text-[11px] font-bold block truncate uppercase font-sans"
                          style={{ color: qrBgColor === '#ffffff' ? '#000000' : '#ffffff' }}
                        >
                          {qrTopText}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-bold block truncate uppercase ${
                          qrFrameType === 'elegant' ? 'font-serif tracking-wider' : qrFrameType === 'retro' ? 'font-mono tracking-tighter' : 'font-sans'
                        }`}
                        style={{ color: qrFgColor }}
                      >
                        {qrTopText}
                      </span>
                    )}
                    {qrFrameType === 'modern' && (
                      <hr className="w-10 mx-auto mt-1 opacity-40" style={{ borderColor: qrFgColor }} />
                    )}
                  </div>

                  {/* QR Image Frame */}
                  <div className="w-28 h-28 relative flex items-center justify-center p-1 rounded z-10">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '?table=1')}&color=${qrFgColor.replace('#', '')}&bgcolor=${qrBgColor.replace('#', '')}&margin=1`}
                      alt="Preview QR Code"
                      className="w-full h-full object-contain pointer-events-none"
                      referrerPolicy="no-referrer"
                    />

                    {/* Live Logo Badge centered precisely */}
                    {qrLogoType !== 'none' && (
                      <div
                        style={{ backgroundColor: qrBgColor, borderColor: qrFgColor }}
                        className="absolute w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-md select-none text-[11px] font-bold"
                      >
                        {qrLogoType === 'initials' && <span style={{ color: qrFgColor }} className="text-[8px] font-serif">NG</span>}
                        {qrLogoType === 'star' && '⭐'}
                        {qrLogoType === 'chef' && '👨‍🍳'}
                        {qrLogoType === 'fork' && '🍽️'}
                      </div>
                    )}
                  </div>

                  {/* Bottom Text content */}
                  <div className="w-full text-center pb-3.5 z-10">
                    {qrFrameType === 'classic' ? (
                      <div className="space-y-1">
                        <div style={{ backgroundColor: qrFgColor }} className="inline-block px-3 py-0.5 rounded shadow mx-auto">
                          <span
                            className="text-[13px] font-bold block font-sans"
                            style={{ color: qrBgColor === '#ffffff' ? '#000000' : '#ffffff' }}
                          >
                            {qrBottomText} 1
                          </span>
                        </div>
                        <span className="text-[8px] block tracking-tighter" style={{ color: qrFgColor }}>
                          SCAN TO ORDER
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span
                          className={`text-sm font-bold block ${
                            qrFrameType === 'elegant' ? 'font-serif tracking-widest' : qrFrameType === 'retro' ? 'font-mono' : 'font-sans'
                          }`}
                          style={{ color: qrFgColor }}
                        >
                          {qrBottomText} 1
                        </span>
                        {qrFrameType === 'elegant' && (
                          <span className="text-[7px] block tracking-widest uppercase mt-0.5" style={{ color: qrFgColor + '99' }}>
                            ONLAYN MENYU SELECTION
                          </span>
                        )}
                        {qrFrameType === 'retro' && (
                          <span className="text-[7px] block font-mono mt-0.5" style={{ color: qrFgColor + '88' }}>
                            ★ EST. 2024 ★
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  id="btn-test-download-customizer"
                  onClick={() => handleDownloadCustomQR(1)}
                  className="mt-4 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-all duration-200 cursor-pointer shadow flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  {language === 'uz' ? 'Sinov namunasini yuklash' : language === 'ru' ? 'Скачать образец' : 'Download Sample Poster'}
                </button>
              </div>
            </div>

            {/* List of custom stylized QR Codes for each of the tables */}
            <div>
              <h3 className="text-sm font-serif font-bold text-amber-100 mb-4 border-l-2 border-amber-500 pl-2">
                {language === 'uz' ? 'Stollar uchun chop etishga tayyor QR-kartochkalar' : language === 'ru' ? 'Готовые QR-карточки столов для печати' : 'Print-Ready Table QR Placards'} ({settingsTableCount})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: settingsTableCount }, (_, i) => i + 1).map((num) => {
                  const tableUrl = `${window.location.origin}?table=${num}`;
                  // Dynamic customizer image URL
                  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tableUrl)}&color=${qrFgColor.replace('#', '')}&bgcolor=${qrBgColor.replace('#', '')}&margin=1`;

                  return (
                    <div
                      key={num}
                      className="glass-card rounded-xl p-4 border border-amber-500/10 flex flex-col items-center justify-between text-center space-y-4 hover:border-amber-500/30 transition-all duration-300"
                      id={`qr-card-table-${num}`}
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-center w-full pb-2 border-b border-neutral-900/60">
                        <span className="text-xs font-bold text-amber-400 font-serif">
                          {t.tableLabel} {num}
                        </span>
                        <span className="text-[8px] font-mono text-neutral-500 tracking-wider">Onlayn Menyu Custom</span>
                      </div>

                      {/* Small dynamic placard box for display */}
                      <div
                        style={{ backgroundColor: qrBgColor }}
                        className="w-32 h-44 rounded-lg relative flex flex-col items-center justify-between p-2 shadow border border-neutral-900/80 overflow-hidden"
                      >
                        {/* Elegant outer line */}
                        {qrFrameType === 'elegant' && (
                          <div style={{ borderColor: qrFgColor, borderWidth: '1px' }} className="absolute inset-1 border pointer-events-none rounded opacity-80" />
                        )}
                        {qrFrameType === 'classic' && (
                          <div style={{ borderColor: qrFgColor, borderWidth: '2px' }} className="absolute inset-0.5 border pointer-events-none rounded opacity-80" />
                        )}
                        {qrFrameType === 'modern' && (
                          <div style={{ borderColor: qrFgColor, borderWidth: '1px' }} className="absolute inset-1 border pointer-events-none rounded opacity-60" />
                        )}
                        {qrFrameType === 'retro' && (
                          <div style={{ borderColor: qrFgColor, borderWidth: '1px' }} className="absolute inset-1 border border-dashed pointer-events-none rounded opacity-70" />
                        )}

                        <span style={{ color: qrFgColor }} className="text-[8px] font-bold block truncate uppercase max-w-full font-sans tracking-tight scale-90 z-10">
                          {qrTopText}
                        </span>

                        {/* Miniature QR */}
                        <div className="w-20 h-20 relative flex items-center justify-center p-0.5 z-10">
                          <img
                            src={qrImgSrc}
                            alt={`Table ${num}`}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                          {qrLogoType !== 'none' && (
                            <div
                              style={{ backgroundColor: qrBgColor, borderColor: qrFgColor }}
                              className="absolute w-4 h-4 rounded-full border flex items-center justify-center text-[6px] shadow"
                            >
                              {qrLogoType === 'initials' && <span style={{ color: qrFgColor }} className="scale-[0.6] font-serif font-bold leading-none">NG</span>}
                              {qrLogoType === 'star' && '⭐'}
                              {qrLogoType === 'chef' && '👨‍🍳'}
                              {qrLogoType === 'fork' && '🍽️'}
                            </div>
                          )}
                        </div>

                        <span style={{ color: qrFgColor }} className="text-[9px] font-bold block tracking-tight scale-90 z-10">
                          {qrBottomText} {num}
                        </span>
                      </div>

                      {/* Download and Simulation Actions */}
                      <div className="w-full space-y-2 pt-2">
                        <button
                          id={`btn-simulate-qr-${num}`}
                          onClick={() => onSimulateTable(num)}
                          className="w-full bg-amber-500/10 hover:bg-amber-500 border border-amber-500/10 hover:border-amber-500 text-amber-400 hover:text-black py-1.5 rounded text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          {t.simulateQR}
                        </button>

                        <button
                          id={`btn-download-qr-custom-${num}`}
                          onClick={() => handleDownloadCustomQR(num)}
                          className="w-full bg-neutral-900 hover:bg-amber-500 hover:text-black border border-neutral-800 hover:border-amber-500 text-neutral-300 py-1.5 rounded text-[10px] font-mono tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          {t.downloadQR}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: STAFF CALLS */}
        {activeTab === 'calls' && (
          <div className="space-y-6" id="calls-tab-content">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif text-amber-100 font-semibold">
                Xizmat Ko‘rsatish Chaqiruvlari ({pendingCalls.length} faol)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingCalls.length === 0 ? (
                <div className="col-span-full text-center py-12 glass-card rounded-xl border-dashed border-neutral-800">
                  <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500">Mijozlar tomonidan hozircha chaqiruvlar yo'q.</p>
                </div>
              ) : (
                pendingCalls.map(call => (
                  <div
                    key={call.id}
                    className="glass-card rounded-xl p-4 border border-amber-500/30 flex flex-col justify-between space-y-4 pulse-gold"
                    id={`call-card-${call.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${call.type === 'waiter' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {call.type === 'waiter' ? <Users className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-amber-100">
                            {call.type === 'waiter' ? t.callWaiter : t.callChef}
                          </h3>
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            Chaqirilgan vaqt: {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-serif font-bold text-amber-400 bg-neutral-950 border border-amber-500/20 px-2.5 py-1 rounded">
                        STOL {call.tableNumber}
                      </span>
                    </div>

                    <button
                      id={`btn-resolve-call-${call.id}`}
                      onClick={() => handleResolveCall(call.id)}
                      className="w-full bg-amber-500 text-black py-2 rounded font-semibold text-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4 text-black" />
                      {t.resolveCall}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: CUSTOMER FEEDBACKS */}
        {activeTab === 'feedback' && (
          <div className="space-y-6" id="feedback-tab-content">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif text-amber-100 font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                {t.feedbackTitle} ({feedbacks.length})
              </h2>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-xl border-dashed border-neutral-800">
                <Star className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-xs text-neutral-400">{t.noFeedbackYet}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Overview */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="glass-card rounded-xl p-5 border border-neutral-800 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{t.averageRating}</span>
                    <p className="text-5xl font-mono font-extrabold text-amber-400 mt-2">
                      {(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avg = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
                        return (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-2">
                      {feedbacks.length} {language === 'uz' ? 'ta fikrlar asosida' : language === 'ru' ? 'на основе отзывов' : 'based on reviews'}
                    </span>
                  </div>

                  {/* Rating breakdown bars */}
                  <div className="glass-card rounded-xl p-4 border border-neutral-800 space-y-2">
                    <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      {language === 'uz' ? 'Baholar taqsimoti' : language === 'ru' ? 'Распределение оценок' : 'Rating Distribution'}
                    </h3>
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = feedbacks.filter((f) => f.rating === rating).length;
                      const pct = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-2 text-xs">
                          <span className="w-3 font-mono text-neutral-400">{rating}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                          <div className="flex-1 bg-neutral-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right font-mono text-neutral-500 text-[10px]">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Feedbacks List */}
                <div className="lg:col-span-2 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {feedbacks
                    .slice()
                    .reverse()
                    .map((item) => (
                      <div
                        key={item.id}
                        className="glass-card rounded-xl p-4 border border-neutral-800 hover:border-neutral-700/80 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-[10px]">
                              {t.tableLabel} {item.tableNumber}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-800'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {item.comment ? (
                          <p className="text-xs text-neutral-300 mt-2.5 italic font-serif leading-relaxed bg-neutral-950/40 p-2.5 rounded border border-neutral-900/50">
                            "{item.comment}"
                          </p>
                        ) : (
                          <p className="text-[10px] text-neutral-600 mt-2 italic">
                            {language === 'uz' ? 'Izoh qoldirilmagan' : language === 'ru' ? 'Без комментария' : 'No comment provided'}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: ORDER HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6" id="history-tab-content">
            {/* Header Block with quick stats & report/shift management actions */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-neutral-950/40 p-5 border border-neutral-900 rounded-xl">
              <div>
                <h2 className="text-lg font-serif text-amber-100 font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>
                    {language === 'uz' ? 'Buyurtmalar Tarixi' : language === 'ru' ? 'История Выполненных Заказов' : 'Completed Order History'}
                  </span>
                  <span className="text-xs text-neutral-500 font-normal font-mono">
                    ({filteredCompletedOrders.length} / {completedOrders.length})
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  {language === 'uz' ? 'Tizimdagi barcha yakunlangan va bekor qilingan buyurtmalar.' :
                   language === 'ru' ? 'Все завершенные и отмененные заказы в системе.' :
                   'All completed and cancelled orders in the system.'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {completedOrders.length > 0 && (
                  <button
                    id="btn-history-summary-receipt"
                    onClick={async () => {
                      await generateSummaryReceiptPDF(orders, language);
                      addToast(
                        language === 'uz'
                          ? `Umumiy hisobot PDF shaklida yuklab olinmoqda...`
                          : language === 'ru'
                          ? `Общий отчет скачивается в формате PDF...`
                          : `Downloading summary report PDF...`,
                        'success'
                      );
                    }}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-95"
                    title={language === 'uz' ? 'PDF formatida hisobot yuklash' : 'Скачать PDF отчет'}
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {language === 'uz'
                        ? 'Hisobotni Yuklash'
                        : language === 'ru'
                        ? 'Скачать отчет'
                        : 'Download Report'}
                    </span>
                  </button>
                )}

                {completedOrders.length > 0 && (
                  <button
                    onClick={async () => {
                      const isFiltered = filteredCompletedOrders.length < completedOrders.length && filteredCompletedOrders.length > 0;
                      const confirmMsg = isFiltered
                        ? (language === 'uz'
                          ? `Haqiqatdan ham saralangan ${filteredCompletedOrders.length} ta yopilgan buyurtma tarixini tozalamoqchimisiz?`
                          : language === 'ru'
                          ? `Вы действительно хотите очистить историю отфильтрованных заказов (${filteredCompletedOrders.length} шт.)?`
                          : `Are you sure you want to clear the history of the filtered ${filteredCompletedOrders.length} closed orders?`)
                        : t.confirmClearHistory;

                      if (window.confirm(confirmMsg)) {
                        try {
                          if (isFiltered) {
                            const filteredIds = filteredCompletedOrders.map(o => o.id);
                            await clearCompletedOrders(filteredIds);
                          } else {
                            await clearCompletedOrders();
                          }
                          await loadLatestData();
                          addToast(
                            language === 'uz' ? "Buyurtmalar tarixi muvaffaqiyatli tozalandi!" : language === 'ru' ? "История заказов успешно очищена!" : "Order history cleared successfully!",
                            'success'
                          );
                        } catch (error) {
                          console.error(error);
                        }
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-95"
                    title={language === 'uz' ? "Tarixni butunlay tozalash" : "Очистить историю"}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t.clearHistory}</span>
                  </button>
                )}

                <button
                  onClick={async () => {
                    if (window.confirm(t.closeShiftConfirm)) {
                      try {
                        await closeRestaurantShift();
                        await loadLatestData();
                        addToast(
                          language === 'uz' ? "Smena muvaffaqiyatli yopildi! Barcha stollar bo'shatildi." : language === 'ru' ? "Смена успешно закрыта! Все столы освобождены." : "Shift closed successfully! All tables cleared.",
                          'success'
                        );
                      } catch (error) {
                        console.error(error);
                      }
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-95"
                  title={language === 'uz' ? "Smenani yakunlash va stollarni bo'shatish" : "Закрыть смену и очистить столы"}
                >
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>{t.closeShift}</span>
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder={
                    language === 'uz'
                      ? 'Mijoz, seans, buyurtma ID yoki stol bo\'yicha qidirish...'
                      : language === 'ru'
                      ? 'Поиск по клиенту, сессии, заказу или столу...'
                      : 'Search by customer, session, order ID or table...'
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

              {/* Status & Date Filters group */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Date Filters */}
                <div className="flex items-center gap-1 bg-neutral-950 p-1 border border-neutral-900 rounded-lg">
                  <button
                    onClick={() => setHistoryDateFilter('today')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      historyDateFilter === 'today'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-neutral-400 hover:text-amber-100'
                    }`}
                  >
                    {t.today}
                  </button>
                  <button
                    onClick={() => setHistoryDateFilter('yesterday')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      historyDateFilter === 'yesterday'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10 font-bold'
                        : 'text-neutral-400 hover:text-amber-100'
                    }`}
                  >
                    {t.yesterday}
                  </button>
                  <button
                    onClick={() => setHistoryDateFilter('week')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      historyDateFilter === 'week'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10 font-bold'
                        : 'text-neutral-400 hover:text-amber-100'
                    }`}
                  >
                    {t.last7days}
                  </button>
                  <button
                    onClick={() => setHistoryDateFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      historyDateFilter === 'all'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-neutral-400 hover:text-amber-100'
                    }`}
                  >
                    {t.allTime}
                  </button>
                </div>

                {/* Status Filters */}
                <div className="flex gap-1 p-1 bg-neutral-950 border border-neutral-900 rounded-lg">
                  <button
                    onClick={() => setHistoryStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      historyStatusFilter === 'all'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-neutral-400 hover:text-amber-100'
                    }`}
                  >
                    {language === 'uz' ? 'Barchasi' : language === 'ru' ? 'Все' : 'All'}
                  </button>
                  <button
                    onClick={() => setHistoryStatusFilter('delivered')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      historyStatusFilter === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 font-bold'
                        : 'text-neutral-400 hover:text-emerald-400'
                    }`}
                  >
                    {language === 'uz' ? 'Tugallangan' : language === 'ru' ? 'Выполненные' : 'Completed'}
                  </button>
                  <button
                    onClick={() => setHistoryStatusFilter('cancelled')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      historyStatusFilter === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/10 font-bold'
                        : 'text-neutral-400 hover:text-rose-400'
                    }`}
                  >
                    {language === 'uz' ? 'Bekor qilingan' : language === 'ru' ? 'Отмененные' : 'Cancelled'}
                  </button>
                </div>
              </div>
            </div>

            {/* List of Orders */}
            <div className="space-y-4">
              {filteredCompletedOrders.length === 0 ? (
                <div className="text-center py-16 bg-neutral-950/20 border border-dashed border-neutral-900 rounded-xl">
                  <FileText className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                  <p className="text-xs text-neutral-500">
                    {language === 'uz' ? 'Tarixda buyurtmalar topilmadi.' :
                     language === 'ru' ? 'В истории заказов ничего не найдено.' :
                     'No orders found in history.'}
                  </p>
                </div>
              ) : (
                filteredCompletedOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`glass-card rounded-xl p-5 border transition-all duration-300 ${
                      order.status === 'delivered' 
                        ? 'border-emerald-500/10 hover:border-emerald-500/20' 
                        : 'border-rose-500/10 hover:border-rose-500/20'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-900/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-neutral-900 border border-neutral-800 text-amber-400 px-2.5 py-1 rounded">
                          STOL {order.tableNumber}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">#{order.id.slice(-6).toUpperCase()}</span>
                        {order.sessionId && (
                          <span className="text-[9px] font-mono bg-neutral-950 border border-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded" title={language === 'uz' ? 'Mijoz Seansi ID' : 'ID Сессии'}>
                            S:{order.sessionId.slice(-6).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* Status Label */}
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded ${
                          order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {order.status === 'delivered' ? t.statusDelivered : t.statusCancelled}
                        </span>

                        {/* Payment interactive switcher */}
                        <button
                          onClick={async () => {
                            const newStatus = order.paymentStatus === 'paid' ? 'unpaid' : 'paid';
                            try {
                              await updateOrderPaymentStatus(order.id, newStatus);
                              await loadLatestData();
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded transition-colors cursor-pointer border ${
                            order.paymentStatus === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                          title={language === 'uz' ? "To'lov statusini o'zgartirish" : "Изменить статус оплаты"}
                        >
                          {order.paymentStatus === 'paid' ? t.paid : t.unpaid}
                        </button>

                        {/* Individual Receipt download */}
                        {order.status === 'delivered' && (
                          <button
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
                            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-500/30 text-neutral-400 hover:text-amber-400 transition-all cursor-pointer"
                            title={language === 'uz' ? 'Chekni yuklash' : language === 'ru' ? 'Скачать чек' : 'Download Receipt'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timestamp & Meta */}
                    <div className="py-2.5 flex flex-wrap justify-between items-center gap-2 text-[11px] text-neutral-500">
                      <span>
                        {new Date(order.createdAt).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Items list breakdown */}
                    <div className="mt-2 bg-neutral-950/60 border border-neutral-900/60 rounded-lg p-3.5 space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                        {language === 'uz' ? 'Buyurtma Tarkibi' : language === 'ru' ? 'Состав Заказа' : 'Items Breakdown'}
                      </p>
                      
                      <div className="divide-y divide-neutral-900/40 space-y-2">
                        {order.items.map((item, idx) => {
                          const dishRef = dishes.find(d => d.id === item.dishId);
                          const isKg = dishRef?.unit === 'kg' || item.quantity % 1 !== 0;
                          return (
                            <div key={idx} className="flex justify-between items-center text-xs pt-2 first:pt-0">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-500 font-bold font-mono">
                                  {isKg ? `${item.quantity} ${t.kg}` : `x${item.quantity}`}
                                </span>
                                <span className="text-neutral-300 font-medium">
                                  {item.dishName[language] || item.dishName['uz']}
                                </span>
                              </div>
                              <span className="font-mono text-neutral-400">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Fees Breakdown */}
                      {(order.serviceCharge !== undefined || order.tableSittingFee !== undefined) && (
                        <div className="space-y-1 text-[10px] text-neutral-500 pt-2 border-t border-neutral-900/60 font-mono mt-2">
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

                      {/* Notes */}
                      {order.notes && (
                        <div className="mt-2 bg-neutral-900/30 p-2 rounded border border-neutral-900/50 text-[11px] text-neutral-400 italic">
                          <span className="font-semibold text-amber-500/80 mr-1 not-italic">
                            {language === 'uz' ? 'Mijoz izohi:' : language === 'ru' ? 'Комментарий клиента:' : 'Customer note:'}
                          </span>
                          "{order.notes}"
                        </div>
                      )}

                      {/* Total line inside card */}
                      <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-neutral-900">
                        <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                          {language === 'uz' ? 'Umumiy summa:' : language === 'ru' ? 'Итоговая сумма:' : 'Total Amount:'}
                        </span>
                        <span className="text-sm font-bold text-amber-400 font-mono">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* DISH ADD/EDIT MODAL FORM */}
      <AnimatePresence>
        {isDishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="dish-modal-overlay">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setIsDishModalOpen(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-[#0c0c0c] border border-amber-500/30 rounded-xl p-5 md:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
              id="dish-form-modal"
            >
              <div className="flex justify-between items-center pb-4 border-b border-neutral-900 mb-4">
                <h3 className="text-sm font-serif font-semibold text-amber-100 uppercase tracking-wide">
                  {editingDish ? t.editDish : t.addDish}
                </h3>
                <button
                  onClick={() => setIsDishModalOpen(false)}
                  className="text-neutral-500 hover:text-amber-400 p-1"
                  id="btn-close-dish-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDish} className="space-y-4 text-xs" id="dish-form">
                
                {/* Names (Uzbek, Russian, English) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.dishNameUz} *</label>
                    <input
                      type="text"
                      required
                      value={formNameUz}
                      onChange={(e) => setFormNameUz(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.dishNameRu} *</label>
                    <input
                      type="text"
                      required
                      value={formNameRu}
                      onChange={(e) => setFormNameRu(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.dishNameEn} *</label>
                    <input
                      type="text"
                      required
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Descriptions (Uzbek, Russian, English) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.dishDescUz} *</label>
                    <textarea
                      required
                      rows={2}
                      value={formDescUz}
                      onChange={(e) => setFormDescUz(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.dishDescRu} *</label>
                    <textarea
                      required
                      rows={2}
                      value={formDescRu}
                      onChange={(e) => setFormDescRu(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.dishDescEn} *</label>
                    <textarea
                      required
                      rows={2}
                      value={formDescEn}
                      onChange={(e) => setFormDescEn(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Pricing, category and prep time */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">
                      {formUnit === 'kg' ? (language === 'uz' ? "Narxi (1 kg uchun) *" : language === 'ru' ? "Цена (за 1 кг) *" : "Price (per 1 kg) *") : `${t.dishPrice} *`}
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={formPrice || ''}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.dishCategory} *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="national">🍲 Milliy taomlar</option>
                      <option value="fastfood">🍔 Fast Food</option>
                      <option value="drinks">🍹 Ichimliklar</option>
                      <option value="salads">🥗 Salatlar</option>
                      <option value="desserts">🍰 Shirinliklar</option>
                      <option value="combo">🍱 Kombo to‘plamlar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.prepTimeLabel}</label>
                    <input
                      type="number"
                      min={1}
                      value={formPrepTime}
                      onChange={(e) => setFormPrepTime(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">{t.dishUnit} *</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value as 'pcs' | 'kg')}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="pcs">📦 {t.pcs}</option>
                      <option value="kg">⚖️ {t.kg}</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload Area */}
                <div>
                  <label className="block text-neutral-400 font-medium mb-1.5">
                    {language === 'uz' ? 'Taom rasmi' : language === 'ru' ? 'Изображение блюда' : 'Dish Image'}
                  </label>
                  
                  {formImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 p-2 flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                        <img 
                          src={formImage} 
                          alt="Dish Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-300 truncate">
                          {formImage.startsWith('data:') ? (language === 'uz' ? 'Yuklangan rasm.png' : language === 'ru' ? 'Загруженное изображение.png' : 'uploaded_image.png') : 'unsplash_image.jpg'}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5 uppercase">
                          {formImage.startsWith('data:') ? 'Base64 Local' : 'External Link'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById('dish-image-file-input');
                              if (inputEl) inputEl.click();
                            }}
                            className="text-[10px] font-semibold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            {language === 'uz' ? "O'zgartirish" : language === 'ru' ? 'Изменить' : 'Change'}
                          </button>
                          <span className="text-neutral-700">|</span>
                          <button
                            type="button"
                            onClick={() => setFormImage('')}
                            className="text-[10px] font-semibold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            {language === 'uz' ? "O'chirish" : language === 'ru' ? 'Удалить' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setImageDragActive(true);
                      }}
                      onDragLeave={() => setImageDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setImageDragActive(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          if (file.size > 5 * 1024 * 1024) {
                            addToast(
                              language === 'uz' ? "Rasm hajmi 5MB dan kam bo'lishi kerak!" : language === 'ru' ? 'Размер файла не должен превышать 5МБ!' : 'File size must be less than 5MB!',
                              'alert'
                            );
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      onClick={() => {
                        const inputEl = document.getElementById('dish-image-file-input');
                        if (inputEl) inputEl.click();
                      }}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2.5 ${
                        imageDragActive 
                          ? 'border-amber-500 bg-amber-500/5' 
                          : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-amber-500 transition-colors">
                        <Upload className="w-5 h-5 text-amber-500/70" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-300">
                          {language === 'uz' ? "Rasm yuklash uchun bosing yoki sudrang" : language === 'ru' ? 'Нажмите или перетащите для загрузки' : 'Click or drag & drop to upload'}
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                          PNG, JPG, WEBP (MAX. 5MB)
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    id="dish-image-file-input"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          addToast(
                            language === 'uz' ? "Rasm hajmi 5MB dan kam bo'lishi kerak!" : language === 'ru' ? 'Размер файла не должен превышать 5МБ!' : 'File size must be less than 5MB!',
                            'alert'
                          );
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                {/* Flags Checklist */}
                <div className="flex gap-6 py-2">
                  <label className="flex items-center gap-2 text-neutral-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPopular}
                      onChange={(e) => setFormIsPopular(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>{t.isPopularLabel}</span>
                  </label>

                  <label className="flex items-center gap-2 text-neutral-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsRecommended}
                      onChange={(e) => setFormIsRecommended(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>{t.isRecommendedLabel}</span>
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => setIsDishModalOpen(false)}
                    className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 py-2.5 px-5 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {t.cancel}
                  </button>

                  <button
                    type="submit"
                    className="gold-btn py-2.5 px-5 rounded-lg font-semibold cursor-pointer"
                  >
                    {t.save}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TABLE MANAGEMENT MODAL */}
      <AnimatePresence>
        {selectedTableForManage !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="table-manage-modal-overlay">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setSelectedTableForManage(null)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-md bg-[#0c0c0c] border rounded-xl p-5 md:p-6 shadow-2xl z-10 transition-colors ${modalBorderClass}`}
              id="table-manage-modal"
            >
              <div className="flex justify-between items-center pb-4 border-b border-neutral-900 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-colors ${tableBadgeClass}`}>
                    {t.tableLabel} {selectedTableForManage}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    ({statusName})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTableForManage(null)}
                  className="text-neutral-500 hover:text-amber-400 p-1 cursor-pointer"
                  id="btn-close-table-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Session Identification Info */}
                <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg space-y-1">
                  <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-wider">{t.activeSession}</p>
                  <p className="text-amber-400 font-mono text-[11px] font-semibold break-all">
                    #{managedTableSessionId.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {language === 'uz' ? 'Ushbu seans kodi orqali stolga yangi o\'tirgan mijoz buyurtmalari avvalgisidan to\'liq ajratiladi.' :
                     language === 'ru' ? 'Этот код сессии полностью отделяет заказы новых гостей от предыдущих.' :
                     'This session code isolates new customer orders from previous ones.'}
                  </p>
                </div>

                {/* Table Current Activity Stats */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-neutral-300 uppercase tracking-wider text-[10px]">
                    {language === 'uz' ? 'Faol faoliyat' : language === 'ru' ? 'Текущая активность' : 'Current Activity'}
                  </h4>

                  {/* Active Orders */}
                  <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg space-y-2">
                    <p className="font-medium text-neutral-400 flex items-center justify-between">
                      <span>{language === 'uz' ? 'Faol buyurtmalar:' : language === 'ru' ? 'Активные заказы:' : 'Active orders:'}</span>
                      <span className="font-mono text-amber-500">
                        {orders.filter(o => o.tableNumber === selectedTableForManage && o.status !== 'delivered' && o.status !== 'cancelled').length}
                      </span>
                    </p>
                    
                    {orders.filter(o => o.tableNumber === selectedTableForManage && o.status !== 'delivered' && o.status !== 'cancelled').length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {orders.filter(o => o.tableNumber === selectedTableForManage && o.status !== 'delivered' && o.status !== 'cancelled').map(o => (
                          <div key={o.id} className="flex justify-between items-center text-[11px] bg-neutral-900 p-1.5 rounded border border-neutral-800">
                            <span className="text-neutral-300 font-mono">#{o.id.slice(-6).toUpperCase()}</span>
                            <span className="text-amber-500 font-semibold">{(o.totalAmount || 0).toLocaleString('uz-UZ')} UZS</span>
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-semibold ${
                              o.status === 'new' ? 'bg-amber-500/10 text-amber-400' :
                              o.status === 'preparing' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>{o.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic text-[11px]">
                        {language === 'uz' ? 'Faol buyurtmalar yo\'q' : language === 'ru' ? 'Нет активных заказов' : 'No active orders'}
                      </p>
                    )}
                  </div>

                  {/* Pending calls */}
                  <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                    <p className="font-medium text-neutral-400 flex items-center justify-between">
                      <span>{language === 'uz' ? 'Chaqiruvlar statusi:' : language === 'ru' ? 'Статус вызовов:' : 'Calls status:'}</span>
                      <span>
                        {staffCalls.filter(c => c.tableNumber === selectedTableForManage && c.status === 'pending').length > 0 ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                            {language === 'uz' ? 'FAOL CHAQIRUV' : language === 'ru' ? 'АКТИВНЫЙ ВЫЗОВ' : 'ACTIVE CALL'}
                          </span>
                        ) : (
                          <span className="text-neutral-500">{language === 'uz' ? 'Sokin' : language === 'ru' ? 'Покой' : 'Quiet'}</span>
                        )}
                      </span>
                    </p>
                  </div>

                  {/* Session Billing / Payment Status */}
                  {(() => {
                    const currentSessionId = managedTableSessionId;
                    const sessionOrders = orders.filter(o => o.tableNumber === selectedTableForManage && o.sessionId === currentSessionId && o.status !== 'cancelled');
                    const totalSessionAmount = sessionOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                    const unpaidSessionAmount = sessionOrders.filter(o => o.paymentStatus !== 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
                    const paidSessionAmount = sessionOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
                    
                    return (
                      <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg space-y-2">
                        <p className="font-semibold text-neutral-300 uppercase tracking-wider text-[10px]">
                          {language === 'uz' ? 'Seans Hisob-Kitobi' : language === 'ru' ? 'Расчет сессии' : 'Session Billing'}
                        </p>
                        
                        <div className="space-y-1 text-[11px] font-mono">
                          <div className="flex justify-between text-neutral-400">
                            <span>{language === 'uz' ? 'Jami hisob:' : language === 'ru' ? 'Общий счет:' : 'Total bill:'}</span>
                            <span className="font-bold text-neutral-200">{formatPrice(totalSessionAmount)}</span>
                          </div>
                          <div className="flex justify-between text-rose-400">
                            <span>{language === 'uz' ? 'To\'lanmagan:' : language === 'ru' ? 'Не оплачено:' : 'Unpaid:'}</span>
                            <span className="font-bold">{formatPrice(unpaidSessionAmount)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>{language === 'uz' ? 'To\'langan:' : language === 'ru' ? 'Оплачено:' : 'Paid:'}</span>
                            <span className="font-bold">{formatPrice(paidSessionAmount)}</span>
                          </div>
                        </div>

                        {unpaidSessionAmount > 0 && (
                          <button
                            onClick={async () => {
                              // Mark all session orders as paid
                              try {
                                const unpaidOrders = sessionOrders.filter(o => o.paymentStatus !== 'paid');
                                await Promise.all(unpaidOrders.map(o => updateOrderPaymentStatus(o.id, 'paid')));
                                await loadLatestData();
                                addToast(
                                  language === 'uz'
                                    ? `Stol ${selectedTableForManage} bo'yicha barcha to'lovlar qabul qilindi!`
                                    : language === 'ru'
                                    ? `Все оплаты по столу ${selectedTableForManage} приняты!`
                                    : `All payments accepted for Table ${selectedTableForManage}!`,
                                  'success'
                                );
                              } catch (error) {
                                console.error(error);
                              }
                            }}
                            className="w-full mt-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            {language === 'uz' ? 'Barchasini To\'langan deb belgilash' : language === 'ru' ? 'Отметить все оплаченными' : 'Mark all as Paid'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Main Session Control Action */}
                <div className="pt-3 border-t border-neutral-900 space-y-2">
                  <button
                    onClick={async () => {
                      try {
                        await resetTableSession(selectedTableForManage);
                        await loadLatestData();
                        setSelectedTableForManage(null);
                        addToast(
                          language === 'uz'
                            ? `Stol ${selectedTableForManage} tozalandi! Yangi mijoz uchun seans ochildi.`
                            : language === 'ru'
                            ? `Стол ${selectedTableForManage} очищен! Открыта сессия для нового клиента.`
                            : `Table ${selectedTableForManage} cleared! Opened session for next client.`,
                          'success'
                        );
                        playNotificationSound('resolve');
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider"
                    id="btn-clear-table-session"
                  >
                    <X className="w-4 h-4" />
                    <span>{t.clearTable}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onSimulateTable(selectedTableForManage);
                        setSelectedTableForManage(null);
                      }}
                      className="flex items-center justify-center gap-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 font-medium rounded-lg transition-colors cursor-pointer"
                      id="btn-simulate-table-session"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{t.simulateQR}</span>
                    </button>

                    <button
                      onClick={() => setSelectedTableForManage(null)}
                      className="py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
