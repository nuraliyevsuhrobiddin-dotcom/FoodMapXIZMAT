/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Language, translations } from '../types';
import { motion } from 'motion/react';
import { Coffee, ShieldCheck, User, Compass } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { getRestaurantSettings } from '../lib/storage';

interface WelcomePortalProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSelectTable: (tableNum: number) => void;
  onEnterAdmin: () => void;
}

export default function WelcomePortal({
  language,
  onLanguageChange,
  onSelectTable,
  onEnterAdmin,
}: WelcomePortalProps) {
  const t = translations[language];
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [tableCount, setTableCount] = useState(12);

  useEffect(() => {
    getRestaurantSettings().then((settings) => {
      if (settings && settings.tableCount) {
        setTableCount(settings.tableCount);
      }
    });
  }, []);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#080808] relative overflow-hidden px-4 py-8" id="welcome-portal">
      {/* Premium background gold radial glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-lg mx-auto flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500 font-semibold">Onlayn Menyu Xizmati</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center items-center py-12 z-10">
        {!showTableSelect ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center w-full"
            id="portal-home-screen"
          >
            {/* Elegant Logo Emblem */}
            <div className="mb-8 relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-amber-500/30 flex items-center justify-center p-3 relative bg-black/60">
                <div className="absolute inset-1 rounded-full border border-dashed border-amber-500/10" />
                <Coffee className="w-10 h-10 text-amber-500" />
              </div>
              <div className="absolute w-32 h-32 rounded-full border border-amber-500/10 animate-spin" style={{ animationDuration: '30s' }} />
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-3xl md:text-4xl font-serif tracking-wide text-amber-100 font-bold mb-4">
              {t.welcomeTitle}
            </h1>
            <p className="text-sm text-neutral-400 font-light max-w-sm mx-auto mb-12 leading-relaxed">
              {t.welcomeSubtitle}
            </p>

            {/* Navigation Choices */}
            <div className="space-y-4 w-full">
              <button
                id="btn-customer-portal"
                onClick={() => setShowTableSelect(true)}
                className="w-full gold-btn py-4 px-6 rounded-lg text-sm tracking-wider uppercase flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-black" />
                {t.enterClientMode}
              </button>

              <button
                id="btn-admin-portal"
                onClick={onEnterAdmin}
                className="w-full bg-neutral-900 hover:bg-neutral-800 border border-amber-500/20 hover:border-amber-500/40 text-amber-100/90 py-4 px-6 rounded-lg text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500/80" />
                {t.enterAdminMode}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full"
            id="portal-table-selection"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-serif text-amber-100 font-semibold mb-2">
                {t.selectTable}
              </h2>
              <p className="text-xs text-neutral-400">
                Stol ustidagi QR kodni skanerlash simulyatsiyasi uchun istalgan stoldan kiring
              </p>
            </div>

            {/* Grid of Tables */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {tables.map((num) => (
                <button
                  key={num}
                  id={`btn-select-table-${num}`}
                  onClick={() => onSelectTable(num)}
                  className="bg-neutral-900/60 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/40 text-amber-100 py-4 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-2xl font-serif font-semibold text-amber-400 group-hover:scale-110 transition-transform duration-200">
                    {num}
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    {t.tableLabel}
                  </span>
                </button>
              ))}
            </div>

            <button
              id="btn-back-from-tables"
              onClick={() => setShowTableSelect(false)}
              className="w-full text-center text-xs text-neutral-400 hover:text-amber-300 transition-colors py-2 uppercase tracking-wider"
            >
              {t.backToMenu}
            </button>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center z-10">
        <p className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase">
          Onlayn Menyu Xizmati © 2026 • Premium Dining System
        </p>
      </footer>
    </div>
  );
}
