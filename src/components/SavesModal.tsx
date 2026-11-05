/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  X,
  FolderArchive,
  Save,
  Plus,
  Download,
  Upload,
  Trash2,
  Play,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GameMode } from '../types/game';
import { SCENARIOS } from '../data/scenarios';
import { sounds } from '../audio/soundManager';

interface SavesModalProps {
  onClose: () => void;
}

export const SavesModal: React.FC<SavesModalProps> = ({ onClose }) => {
  const {
    savedCities,
    loadCity,
    saveCurrentCity,
    createNewCity,
    deleteSavedCity,
    exportCityJson,
    importCityJson,
    cityName,
  } = useGame();

  const [mode, setMode] = useState<'list' | 'new'>('list');
  const [newCityName, setNewCityName] = useState<string>('Новый Город');
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('standard');
  const [selectedScenario, setSelectedScenario] = useState<string>(SCENARIOS[0].id);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    createNewCity(
      newCityName.trim(),
      selectedGameMode,
      selectedGameMode === 'challenge' ? selectedScenario : undefined
    );
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importCityJson(content);
        if (success) onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Управление городами</h2>
              <p className="text-xs text-slate-400">Сохраняйте прогресс, загружайте или создавайте новые миры</p>
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

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2">
          {mode === 'list' ? (
            <>
              <button
                onClick={saveCurrentCity}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить текущий</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMode('new')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Новый город</span>
                </button>

                <button
                  onClick={exportCityJson}
                  title="Экспорт в JSON"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Импорт из JSON"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </>
          ) : (
            <button
              onClick={() => setMode('list')}
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              ← Назад к списку городов
            </button>
          )}
        </div>

        {/* Content */}
        {mode === 'new' ? (
          <form onSubmit={handleCreateCity} className="flex flex-col gap-3 py-1 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Название нового города
              </label>
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="Например, Новый Аркадий..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Режим игры
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGameMode('standard')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedGameMode === 'standard'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-white">Обычный</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Баланс, налоги, постепенный рост</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGameMode('sandbox')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedGameMode === 'sandbox'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-300">Песочница</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Бесконечные деньги, все открыто</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGameMode('challenge')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedGameMode === 'challenge'
                      ? 'bg-amber-950/60 border-amber-500 text-white'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-amber-300">Испытания</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Сценарии с особыми целями</div>
                </button>
              </div>
            </div>

            {selectedGameMode === 'challenge' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Выберите сценарий испытания
                </label>
                <div className="flex flex-col gap-2">
                  {SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setSelectedScenario(sc.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        selectedScenario === sc.id
                          ? 'bg-amber-950/40 border-amber-500 text-white'
                          : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-amber-300">{sc.title}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">{sc.description}</div>
                      <div className="text-[10px] font-semibold text-amber-400 mt-1">
                        Цель: {sc.goalDescription} (Старт: ${sc.initialMoney})
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Создать и начать игру</span>
            </button>
          </form>
        ) : (
          <div className="overflow-y-auto pr-1 flex flex-col gap-2.5 py-1">
            {savedCities.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Пока нет сохранённых городов. Нажмите «Сохранить текущий» или создайте новый!
              </div>
            ) : (
              savedCities.map((save) => {
                const isConfirmingDelete = deleteConfirmId === save.id;

                return (
                  <div
                    key={save.id}
                    className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{save.name}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                          Ур. {save.level}
                        </span>
                        {save.gameMode === 'sandbox' && (
                          <span className="text-[9px] font-semibold px-1 rounded bg-emerald-500/20 text-emerald-300">
                            Песочница
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Зданий: {save.buildings.length} • Казна: ${save.money.toLocaleString()} •{' '}
                        {new Date(save.lastPlayed).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          loadCity(save);
                          onClose();
                        }}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Играть</span>
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              deleteSavedCity(save.id);
                              setDeleteConfirmId(null);
                            }}
                            className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg"
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-700 text-slate-300 text-[10px] px-2 py-1.5 rounded-lg"
                          >
                            Нет
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(save.id)}
                          className="p-2 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
