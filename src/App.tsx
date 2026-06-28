/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Language, translations } from './types';
import WelcomePortal from './components/WelcomePortal';
import ClientMenu from './components/ClientMenu';
import AdminDashboard from './components/AdminDashboard';
import Toast, { ToastMessage } from './components/Toast';
import { initializeStorage } from './lib/storage';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qr_language');
      if (saved === 'uz' || saved === 'ru' || saved === 'en') {
        return saved;
      }
    }
    return 'uz';
  });

  const [view, setView] = useState<'portal' | 'client' | 'admin'>('portal');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initialize storage values on application start and clean up theme classes
  useEffect(() => {
    initializeStorage();
    if (typeof window !== 'undefined') {
      document.body.classList.remove('light-mode');
      const appRoot = document.getElementById('app-root');
      if (appRoot) appRoot.classList.remove('light-mode');
      localStorage.removeItem('qr_theme');
    }
  }, []);

  // Helper to add beautiful visual toast overlays
  const addToast = (text: string, type: 'success' | 'info' | 'alert' = 'info') => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Synchronize language state with localStorage
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('qr_language', newLang);
  };

  // URL Parameter monitoring: checks if client scanned a QR code (URL matches ?table=3)
  useEffect(() => {
    const parseUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table');
      if (tableParam) {
        const parsed = parseInt(tableParam, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
          setTableNumber(parsed);
          setView('client');
          
          const t = translations[language];
          addToast(
            language === 'uz'
              ? `Stol ${parsed} menyusi ochildi`
              : language === 'ru'
              ? `Открыто меню для стола ${parsed}`
              : `Opened menu for Table ${parsed}`,
            'success'
          );
        }
      }
    };

    parseUrlParams();

    // Listen to history popstates or custom hash changes
    window.addEventListener('popstate', parseUrlParams);
    return () => window.removeEventListener('popstate', parseUrlParams);
  }, [language]);

  // Handle back navigation / clear URL parameters smoothly
  const handleBackToPortal = () => {
    // Clear URL query parameters without reloading the page
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('table');
      window.history.pushState({}, '', url.toString());
    }
    setTableNumber(null);
    setView('portal');
  };

  // Handle simulating table scans from admin dashboard
  const handleSimulateTableFromAdmin = (num: number) => {
    // Update URL query parameters to match table selection
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('table', String(num));
      window.history.pushState({}, '', url.toString());
    }
    setTableNumber(num);
    setView('client');
  };

  const handleSelectTableFromPortal = (num: number) => {
    // Update URL query parameters
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('table', String(num));
      window.history.pushState({}, '', url.toString());
    }
    setTableNumber(num);
    setView('client');
  };

  return (
    <div className="min-h-screen bg-[#080808] selection:bg-amber-500 selection:text-black" id="app-root">
      {/* Toast Overlay Renderer */}
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Screen Views router */}
      {view === 'portal' && (
        <WelcomePortal
          language={language}
          onLanguageChange={handleLanguageChange}
          onSelectTable={handleSelectTableFromPortal}
          onEnterAdmin={() => setView('admin')}
        />
      )}

      {view === 'client' && tableNumber !== null && (
        <ClientMenu
          tableNumber={tableNumber}
          language={language}
          onLanguageChange={handleLanguageChange}
          onBackToPortal={handleBackToPortal}
          addToast={addToast}
        />
      )}

      {view === 'admin' && (
        <AdminDashboard
          language={language}
          onLanguageChange={handleLanguageChange}
          onBackToPortal={handleBackToPortal}
          onSimulateTable={handleSimulateTableFromAdmin}
          addToast={addToast}
        />
      )}
    </div>
  );
}
