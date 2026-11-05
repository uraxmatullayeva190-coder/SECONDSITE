/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ScrollText, CheckCircle2, Gift, Coins, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sounds } from '../audio/soundManager';

interface QuestsModalProps {
  onClose: () => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({ onClose }) => {
  const { quests, claimQuestReward, stats, placedBuildings } = useGame();

  const getProgress = (q: (typeof quests)[0]) => {
    if (q.completed) return 100;
    if (q.targetType === 'population') {
      return Math.min(100, Math.round((stats.population / q.targetValue) * 100));
    }
    if (q.targetType === 'happiness') {
      return Math.min(100, Math.round((stats.happiness / q.targetValue) * 100));
    }
    if (q.targetType === 'roads') {
      const roads = placedBuildings.filter((b) => b.defId === 'road' || b.defId === 'bridge').length;
      return Math.min(100, Math.round((roads / q.targetValue) * 100));
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Задания и цели развития</h2>
              <p className="text-xs text-slate-400">Выполняйте задания для получения опыта и финансирования</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quests List */}
        <div className="overflow-y-auto pr-1 flex flex-col gap-2.5 py-1">
          {quests.map((q) => {
            const progress = getProgress(q);

            return (
              <div
                key={q.id}
                className={`p-3.5 rounded-xl border transition flex flex-col gap-2 ${
                  q.claimed
                    ? 'bg-slate-800/20 border-slate-800/40 opacity-60'
                    : q.completed
                    ? 'bg-indigo-950/40 border-indigo-500/70 ring-1 ring-indigo-500/40'
                    : 'bg-slate-800/40 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{q.title}</span>
                      {q.claimed && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" /> Выполнено
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{q.description}</p>
                  </div>

                  {/* Rewards tag */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-800/50">
                      <Coins className="w-3 h-3" /> +${q.rewardMoney}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-300">
                      <Sparkles className="w-2.5 h-2.5" /> +{q.rewardXp} XP
                    </span>
                  </div>
                </div>

                {/* Progress bar or Claim button */}
                <div className="mt-1 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-3">
                  {q.completed && !q.claimed ? (
                    <button
                      onClick={() => claimQuestReward(q.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Забрать награду (${q.rewardMoney})</span>
                    </button>
                  ) : (
                    <>
                      <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-slate-400">
                        {progress}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
