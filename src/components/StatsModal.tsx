/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Building2,
  DollarSign,
  Users,
  Zap,
  Smile,
  Palette,
  MapPin,
  TrendingUp,
  Check,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { CITY_LEVEL_TITLES } from '../data/quests';
import { sounds } from '../audio/soundManager';

interface StatsModalProps {
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
  const {
    cityName,
    setCityName,
    colorTheme,
    setColorTheme,
    stats,
    gridSize,
    unlockedTiles,
    expandTerritory,
    gameMode,
    addNotification,
  } = useGame();

  const [tempName, setTempName] = useState<string>(cityName);
  const [activeTab, setActiveTab] = useState<'budget' | 'demographics' | 'territory' | 'settings'>('budget');

  const themes = [
    { id: 'classic', label: 'Классика', color: '#10b981' },
    { id: 'nordic', label: 'Скандинавия', color: '#0ea5e9' },
    { id: 'sunset', label: 'Теплый закат', color: '#f59e0b' },
    { id: 'cyber', label: 'Кибернеон', color: '#8b5cf6' },
  ];

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setCityName(tempName.trim());
    sounds.playClick();
    addNotification(`Название города изменено на «${tempName.trim()}»!`, 'success');
  };

  const unlockedSet = new Set(unlockedTiles.map(([x, z]) => `${x},${z}`));

  // 4x4 districts grid (each 6x6 cells in 24x24 total grid)
  const districts = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      // Check if center of district is unlocked
      const isUnlocked = unlockedSet.has(`${c * 6 + 2},${r * 6 + 2}`);
      districts.push({ row: r, col: c, isUnlocked });
    }
  }

  const netIncome = stats.incomePerMinute - stats.expensesPerMinute;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{cityName}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Уровень {stats.level}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{CITY_LEVEL_TITLES[stats.level]}</p>
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

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('budget')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'budget' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Бюджет</span>
          </button>
          <button
            onClick={() => setActiveTab('demographics')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'demographics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Жители</span>
          </button>
          <button
            onClick={() => setActiveTab('territory')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'territory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Районы</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Настройки</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto pr-1 flex flex-col gap-3 py-1">
          {activeTab === 'budget' && (
            <div className="flex flex-col gap-3">
              {/* Net Balance Card */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Текущая казна</div>
                  <div className="text-2xl font-black text-amber-300 mt-0.5">
                    ${stats.money.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Чистый баланс</div>
                  <div
                    className={`text-base font-bold flex items-center justify-end gap-1 mt-0.5 ${
                      netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>{netIncome >= 0 ? '+' : ''}${netIncome}/мин</span>
                  </div>
                </div>
              </div>

              {/* Incomes & Expenses Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                {/* Income */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                  <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between">
                    <span>Доходы</span>
                    <span>+${stats.incomePerMinute}/мин</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Налоги жителей:</span>
                      <span>+${Math.round(stats.population * 38)}/мин</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Торговля & Бизнес:</span>
                      <span>+${Math.max(0, stats.incomePerMinute - Math.round(stats.population * 38))}/мин</span>
                    </div>
                  </div>
                </div>

                {/* Expenses */}
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40">
                  <div className="text-xs font-bold text-rose-400 mb-2 flex items-center justify-between">
                    <span>Расходы</span>
                    <span>-${stats.expensesPerMinute}/мин</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Службы и школы:</span>
                      <span>-${Math.round(stats.expensesPerMinute * 0.7)}/мин</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Энергосистема:</span>
                      <span>-${Math.round(stats.expensesPerMinute * 0.3)}/мин</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demographics' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
                  <Users className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400">Население</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {stats.population} / {stats.maxPopulation}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
                  <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400">Энергия</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {stats.powerConsumed} / {stats.powerProduced} МВт
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
                  <Smile className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400">Счастье</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {stats.happiness}%
                  </div>
                </div>
              </div>

              {/* Advisors Tips */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/50">
                <div className="text-xs font-bold text-indigo-300 mb-1.5">Советник мэра:</div>
                <div className="text-xs text-slate-300 space-y-1">
                  {stats.powerProduced < stats.powerConsumed && (
                    <div className="text-rose-400">⚠️ Городу не хватает электроэнергии! Постройте ещё ветрогенератор.</div>
                  )}
                  {stats.population >= stats.maxPopulation && (
                    <div className="text-amber-300">💡 Все жилые дома заселены! Постройте новые таунхаусы или кварталы.</div>
                  )}
                  {stats.jobs < stats.population * 0.7 && (
                    <div className="text-amber-300">💼 Жителям нужны рабочие места! Постройте магазины или мастерскую.</div>
                  )}
                  {stats.powerProduced >= stats.powerConsumed && stats.happiness >= 80 && (
                    <div className="text-emerald-400">✨ Жители очень довольны жизнью в городе! Население стабильно растёт.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'territory' && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-300 leading-relaxed">
                Покупайте прилегающие участки земли для расширения вашего города. Каждый район открывает 36 новых участков для застройки!
              </div>

              {/* Districts Minimap */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                {districts.map((d, i) => (
                  <button
                    key={i}
                    disabled={d.isUnlocked}
                    onClick={() => expandTerritory(d.row, d.col)}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 transition cursor-pointer text-center ${
                      d.isUnlocked
                        ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-300 cursor-default'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-400 hover:text-white hover:border-indigo-500'
                    }`}
                  >
                    {d.isUnlocked ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-[9px] font-bold mt-0.5">Освоен</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-amber-300">$800</span>
                        <span className="text-[9px] text-slate-400">Купить</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col gap-4">
              {/* Rename City */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Название города
                </label>
                <form onSubmit={handleSaveName} className="flex gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Введите название..."
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow"
                  >
                    Сохранить
                  </button>
                </form>
              </div>

              {/* City Color Palette Theme */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Цветовая палитра города
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        sounds.playClick();
                        setColorTheme(t.id);
                        addNotification(`Установлена тема: ${t.label}`, 'info');
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer text-left ${
                        colorTheme === t.id
                          ? 'bg-indigo-950/60 border-indigo-500 text-white'
                          : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-xs font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
