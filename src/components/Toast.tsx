/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Info, BellRing, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'alert';
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function Toast({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none" id="toast-wrapper">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { key?: string; toast: ToastMessage; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-400 shrink-0" />,
    alert: <BellRing className="w-5 h-5 text-amber-500 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30',
    info: 'border-amber-500/20',
    alert: 'border-amber-500/40 pulse-gold'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, y: -10, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className={`pointer-events-auto w-full glass-card border p-4 rounded-lg shadow-2xl flex items-start gap-3 ${borders[toast.type]}`}
      id={`toast-item-${toast.id}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-100 leading-normal">
          {toast.text}
        </p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
        id={`btn-close-toast-${toast.id}`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
