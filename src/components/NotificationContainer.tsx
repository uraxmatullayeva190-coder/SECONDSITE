/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const NotificationContainer: React.FC = () => {
  const { notifications, dismissNotification, isPhotoMode } = useGame();

  if (isPhotoMode || notifications.length === 0) return null;

  return (
    <div className="fixed top-18 right-3 z-40 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto p-3 rounded-xl border shadow-xl flex items-start gap-2.5 backdrop-blur-none transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${
            n.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/60 text-emerald-200'
              : n.type === 'warning'
              ? 'bg-slate-900/95 border-amber-500/60 text-amber-200'
              : 'bg-slate-900/95 border-slate-700/80 text-slate-200'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {n.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : n.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <Info className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <div className="flex-1 text-xs leading-relaxed">{n.message}</div>
          <button
            onClick={() => dismissNotification(n.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
