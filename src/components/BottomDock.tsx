/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Home,
  Store,
  Factory,
  Shield,
  Trees,
  Navigation,
  Wrench,
  Trash2,
  RotateCw,
  Undo2,
  ChevronDown,
  ChevronUp,
  Lock,
  Zap,
  Users,
  Smile,
  Briefcase,
  MousePointer,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { BUILDINGS_CATALOG } from '../data/buildings';
import { BuildingCategory, BuildingDefinition } from '../types/game';
import { sounds } from '../audio/soundManager';

export const BottomDock: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    buildingRotation,
    rotateBuilding,
    undoLastAction,
    canUndo,
    stats,
    gameMode,
    isPhotoMode,
  } = useGame();

  const [activeCategory, setActiveCategory] = useState<BuildingCategory | 'tools'>('residential');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (isPhotoMode) return null;

  const categories: { id: BuildingCategory | 'tools'; label: string; icon: React.ReactNode }[] = [
    { id: 'residential', label: 'Жильё', icon: <Home className="w-4 h-4" /> },
    { id: 'commercial', label: 'Коммерция', icon: <Store className="w-4 h-4" /> },
    { id: 'industrial', label: 'Энергия & Пром', icon: <Factory className="w-4 h-4" /> },
    { id: 'civic', label: 'Службы', icon: <Shield className="w-4 h-4" /> },
    { id: 'decor', label: 'Декор & Парки', icon: <Trees className="w-4 h-4" /> },
    { id: 'roads', label: 'Дороги', icon: <Navigation className="w-4 h-4" /> },
    { id: 'tools', label: 'Инструменты', icon: <Wrench className="w-4 h-4" /> },
  ];

  const currentBuildings = BUILDINGS_CATALOG.filter((b) => b.category === activeCategory);

  const selectBuilding = (def: BuildingDefinition) => {
    sounds.playClick();
    if (activeTool.type === 'build' && activeTool.buildingId === def.id) {
      // Toggle off to inspect
      setActiveTool({ type: 'select' });
    } else {
      setActiveTool({ type: 'build', buildingId: def.id });
    }
  };

  const selectTool = (type: 'select' | 'demolish') => {
    sounds.playClick();
    setActiveTool({ type });
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 pointer-events-none select-none">
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => {
            sounds.playClick();
            setIsCollapsed(!isCollapsed);
          }}
          className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white px-3.5 py-1 rounded-full shadow-lg transition flex items-center gap-1.5 cursor-pointer backdrop-blur-none"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Панель строительства</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Свернуть меню</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Dock Container */}
      {!isCollapsed && (
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2 transition-all duration-200">
          {/* Category Tabs & Quick Utility Actions */}
          <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-2 overflow-x-auto">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sounds.playClick();
                      setActiveCategory(cat.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions: Rotate & Undo */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800 shrink-0">
              {/* Rotate */}
              <button
                onClick={rotateBuilding}
                title="Повернуть здание [Клавиша R]"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer border border-slate-700/60"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>{buildingRotation}°</span>
              </button>

              {/* Undo */}
              <button
                onClick={undoLastAction}
                disabled={!canUndo}
                title="Отменить последнее действие"
                className={`p-1.5 rounded-xl transition cursor-pointer border border-slate-700/60 ${
                  canUndo
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                    : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards Tray / Tool Tray */}
          {activeCategory === 'tools' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
              {/* Select Tool */}
              <button
                onClick={() => selectTool('select')}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  activeTool.type === 'select'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <MousePointer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Осмотр и выбор</div>
                  <div className="text-[10px] text-slate-400">Кликните на здание для деталей</div>
                </div>
              </button>

              {/* Demolish Tool */}
              <button
                onClick={() => selectTool('demolish')}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  activeTool.type === 'demolish'
                    ? 'bg-rose-600/30 border-rose-500 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-300">Бульдозер (Снос)</div>
                  <div className="text-[10px] text-slate-400">Возврат 60% стоимости</div>
                </div>
              </button>

              {/* Rotate hint card */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Поворот [R]</div>
                  <div className="text-[10px] text-slate-400">Вращайте объект перед установкой</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-stretch gap-2 overflow-x-auto py-1 scrollbar-thin">
              {currentBuildings.map((def) => {
                const isSelected = activeTool.type === 'build' && activeTool.buildingId === def.id;
                const isLocked = gameMode !== 'sandbox' && stats.level < def.minLevel;
                const canAfford = gameMode === 'sandbox' || stats.money >= def.cost;

                return (
                  <button
                    key={def.id}
                    disabled={isLocked}
                    onClick={() => selectBuilding(def)}
                    className={`relative flex flex-col justify-between min-w-[155px] max-w-[170px] p-2.5 rounded-xl border transition cursor-pointer shrink-0 text-left ${
                      isSelected
                        ? 'bg-indigo-600/25 border-indigo-400 ring-2 ring-indigo-500/40'
                        : isLocked
                        ? 'bg-slate-800/30 border-slate-800/80 opacity-55 cursor-not-allowed'
                        : canAfford
                        ? 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                        : 'bg-slate-800/40 border-slate-700/60 opacity-75'
                    }`}
                  >
                    {/* Top: Name & Size */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold text-white leading-tight truncate">
                          {def.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-700/70 text-slate-300">
                          {def.size[0]}×{def.size[1]}
                        </span>
                      </div>

                      {/* Stats Badges */}
                      <div className="flex flex-wrap gap-1 text-[10px] mb-2">
                        {def.population > 0 && (
                          <span className="flex items-center gap-0.5 text-sky-300 bg-sky-950/60 px-1 py-0.5 rounded border border-sky-800/50">
                            <Users className="w-2.5 h-2.5" /> +{def.population}
                          </span>
                        )}
                        {def.jobs > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/50">
                            <Briefcase className="w-2.5 h-2.5" /> +{def.jobs}
                          </span>
                        )}
                        {def.power !== 0 && (
                          <span
                            className={`flex items-center gap-0.5 px-1 py-0.5 rounded border ${
                              def.power > 0
                                ? 'text-yellow-300 bg-yellow-950/60 border-yellow-800/50'
                                : 'text-slate-300 bg-slate-800/60 border-slate-700'
                            }`}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            {def.power > 0 ? `+${def.power}` : def.power}
                          </span>
                        )}
                        {def.happiness > 0 && (
                          <span className="flex items-center gap-0.5 text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/50">
                            <Smile className="w-2.5 h-2.5" /> +{def.happiness}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Price or Lock */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                      {isLocked ? (
                        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Требуется ур. {def.minLevel}</span>
                        </div>
                      ) : (
                        <div
                          className={`text-xs font-bold ${
                            canAfford ? 'text-amber-300' : 'text-rose-400'
                          }`}
                        >
                          ${def.cost.toLocaleString()}
                        </div>
                      )}
                      {isSelected && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                          Выбрано
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
