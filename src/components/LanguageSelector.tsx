/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from '../types';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇺🇸' }
  ];

  return (
    <div className="relative inline-block text-left" id="lang-selector-container">
      <div className="flex items-center gap-1 bg-black/40 border border-amber-500/20 rounded-full px-3 py-1.5 backdrop-blur-md">
        <Globe className="w-4 h-4 text-amber-500/80" />
        <select
          id="lang-select"
          value={currentLanguage}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="bg-transparent text-xs text-amber-100 font-medium cursor-pointer focus:outline-none border-none py-0 pl-1 pr-6"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-neutral-900 text-amber-100 py-1">
              {lang.flag} &nbsp; {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
