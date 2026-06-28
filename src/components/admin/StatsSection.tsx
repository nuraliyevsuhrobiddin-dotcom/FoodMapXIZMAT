import React from 'react';
import { 
  Bell, FileText, DollarSign, Users, TrendingUp, Settings, Percent, Hash, Save 
} from 'lucide-react';
import { Order, StaffCall, Language } from '../../types';
import { DashboardStats } from '../../lib/storage';

interface StatsSectionProps {
  language: Language;
  t: any;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => void;
  stats: DashboardStats;
  pendingCalls: StaffCall[];
  formatPrice: (num: number) => string;
  settingsTableCount: number;
  orders: Order[];
  staffCalls: StaffCall[];
  setSelectedTableForManage: (tableNum: number | null) => void;
  settingsServicePercent: number;
  setSettingsServicePercent: (val: number) => void;
  settingsSittingFee: number;
  setSettingsSittingFee: (val: number) => void;
  setSettingsTableCount: (val: number) => void;
  handleSaveSettings: () => void;
  tableSessions: Record<number, string>;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  language,
  t,
  notificationPermission,
  requestNotificationPermission,
  stats,
  pendingCalls,
  formatPrice,
  settingsTableCount,
  orders,
  staffCalls,
  setSelectedTableForManage,
  settingsServicePercent,
  setSettingsServicePercent,
  settingsSittingFee,
  setSettingsSittingFee,
  setSettingsTableCount,
  handleSaveSettings,
  tableSessions
}) => {
  return (
    <div className="space-y-6" id="dashboard-tab-content">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-serif text-amber-100 font-semibold">
          Sotuv va Faoliyat Tahlili
        </h2>
        <span className="text-[10px] font-mono text-neutral-500">
          Bugun: {new Date().toLocaleDateString('uz-UZ')}
        </span>
      </div>

      {notificationPermission !== 'granted' && (
        <div className="glass-card border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="banner-notification-request">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-100">
                {language === 'uz' ? 'Desktop Bildirishnomalarni Yoqing!' : language === 'ru' ? 'Включите браузерные уведомления!' : 'Enable Browser Notifications!'}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {language === 'uz' 
                  ? 'Yangi buyurtmalar va chaqiruvlarni real-vaqt rejimida ekraningizda ko\'rib boring.' 
                  : language === 'ru' 
                  ? 'Получайте мгновенные всплывающие оповещения о новых заказах и вызовах.' 
                  : 'Get real-time desktop popups whenever a customer places an order or calls for assistance.'}
              </p>
            </div>
          </div>
          <button
            id="dashboard-btn-enable-notifications"
            onClick={requestNotificationPermission}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-md hover:shadow-amber-500/10 shrink-0 self-start sm:self-auto"
          >
            {language === 'uz' ? 'Faollashtirish' : language === 'ru' ? 'Активировать' : 'Enable Now'}
          </button>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-semibold leading-tight break-words" title={t.totalOrders}>
              {t.totalOrders}
            </p>
            <p className="text-base sm:text-lg font-bold font-mono text-amber-100 mt-1 leading-none">
              {stats.totalOrders}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-semibold leading-tight break-words" title={t.todayRevenue}>
              {t.todayRevenue}
            </p>
            <p className="text-sm sm:text-base font-bold font-mono text-amber-400 mt-1 leading-none">
              {formatPrice(stats.todayRevenue)}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-semibold leading-tight break-words" title={t.activeTables}>
              {t.activeTables}
            </p>
            <p className="text-base sm:text-lg font-bold font-mono text-amber-100 mt-1 leading-none">
              {stats.activeTables}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-semibold leading-tight break-words" title="Chaqiruvlar">
              Chaqiruvlar
            </p>
            <p className="text-base sm:text-lg font-bold font-mono text-rose-400 mt-1 leading-none">
              {pendingCalls.length}
            </p>
          </div>
        </div>
      </div>

      {/* Top Sold Dishes & Table Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Best Sellers */}
        <div className="glass-card rounded-xl p-5 border border-amber-500/10 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            {t.topDishes}
          </h3>

          <div className="space-y-4">
            {stats.topDishes.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">Xarid qilingan taomlar hozircha yo'q.</p>
            ) : (
              stats.topDishes.map((dish, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-300">{dish.name}</span>
                    <span className="font-mono text-amber-400">{dish.count} {t.pcs}</span>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-1">
                    <div 
                      className="bg-amber-500 h-1 rounded-full" 
                      style={{ width: `${Math.min(100, (dish.count / (stats.topDishes[0]?.count || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table Monitoring */}
        <div className="glass-card rounded-xl p-5 border border-amber-500/10 space-y-4">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              {language === 'uz' ? 'Stollar Faoliyati Monitoringi' : language === 'ru' ? 'Мониторинг Столов' : 'Table Activity Monitoring'}
            </h3>
          </div>

          {/* Visual Legend */}
          <div className="flex flex-wrap gap-4 items-center justify-start text-[10px] font-mono border-b border-neutral-900 pb-3 pt-1">
            <span className="text-neutral-500 uppercase tracking-wider font-semibold mr-1">
              {language === 'uz' ? 'Holatlar:' : language === 'ru' ? 'Статусы:' : 'Statuses:'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400/50" />
              <span className="text-emerald-400 font-medium">
                {language === 'uz' ? "Bo'sh" : language === 'ru' ? 'Свободен' : 'Free'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400/50" />
              <span className="text-rose-400 font-medium">
                {language === 'uz' ? 'Band' : language === 'ru' ? 'Занят' : 'Occupied (Band)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400/50 animate-pulse" />
              <span className="text-amber-400 font-medium">
                {language === 'uz' ? 'Chaqiruv' : language === 'ru' ? 'Вызов' : 'Staff Call'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {Array.from({ length: settingsTableCount }, (_, i) => i + 1).map((tableNum) => {
              const currentSessionId = tableSessions[tableNum] || `sess-${tableNum}-default`;
              const sessionOrders = orders.filter(o => o.tableNumber === tableNum && o.sessionId === currentSessionId && o.status !== 'cancelled');
              const hasActiveOrder = sessionOrders.length > 0;
              const hasPendingCall = staffCalls.some(c => c.tableNumber === tableNum && c.status === 'pending');
              
              let bgClass = 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40';
              let statusLabel = language === 'uz' ? "Bo'sh" : language === 'ru' ? 'Свободен' : 'Free';
              
              if (hasPendingCall) {
                bgClass = 'bg-amber-500/10 border-amber-500/50 text-amber-300 animate-pulse hover:bg-amber-500/15 hover:border-amber-500/70';
                statusLabel = language === 'uz' ? 'Chaqiruv' : language === 'ru' ? 'Вызов' : 'Call';
              } else if (hasActiveOrder) {
                bgClass = 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-semibold hover:bg-rose-500/15 hover:border-rose-500/60';
                statusLabel = language === 'uz' ? 'Band' : language === 'ru' ? 'Занят' : 'Busy';
              }

              return (
                <button
                  key={tableNum}
                  onClick={() => setSelectedTableForManage(tableNum)}
                  className={`py-3 rounded-lg border text-center transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.98] ${bgClass}`}
                  id={`dashboard-table-indicator-${tableNum}`}
                  title={language === 'uz' ? 'Stolni boshqarish' : language === 'ru' ? 'Управление столом' : 'Manage table'}
                >
                  <p className="text-lg font-serif font-bold">{tableNum}</p>
                  <p className="text-[7.5px] uppercase font-mono tracking-wider opacity-90">
                    {statusLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Restaurant Fees & Service Charge Settings */}
      <div className="glass-card rounded-xl p-5 border border-amber-500/10 space-y-4 max-w-2xl">
        <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-500" />
          {t.settings}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Service Charge Percent */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
              {t.serviceChargePercentLabel}
            </label>
            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs">
              <Percent className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <input
                type="number"
                min="0"
                max="100"
                value={settingsServicePercent}
                onChange={(e) => setSettingsServicePercent(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent border-none text-amber-100 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Table Sitting Fee */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
              {t.tableSittingFeeLabel}
            </label>
            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs">
              <span className="text-neutral-500 shrink-0 font-semibold text-[10px] uppercase font-mono">UZS</span>
              <input
                type="number"
                min="0"
                step="500"
                value={settingsSittingFee}
                onChange={(e) => setSettingsSittingFee(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent border-none text-amber-100 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Number of Tables */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
              {t.tableCountLabel}
            </label>
            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs">
              <Hash className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <input
                type="number"
                min="1"
                max="100"
                value={settingsTableCount}
                onChange={(e) => setSettingsTableCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 12)))}
                className="w-full bg-transparent border-none text-amber-100 focus:outline-none font-mono"
                id="input-restaurant-table-count"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            id="btn-save-restaurant-settings"
            onClick={handleSaveSettings}
            className="gold-btn py-2 px-5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
          >
            <Save className="w-4 h-4 text-black" />
            <span>{t.saveSettings}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
