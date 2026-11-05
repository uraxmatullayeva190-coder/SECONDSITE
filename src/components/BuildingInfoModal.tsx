/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Trash2, Move, Zap, Users, Smile, Briefcase } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { getBuildingById } from '../data/buildings';
import { sounds } from '../audio/soundManager';

export const BuildingInfoModal: React.FC = () => {
  const {
    selectedBuilding,
    setSelectedBuildingInstanceId,
    handleDemolishBuilding,
    handleMoveBuilding,
    isPhotoMode,
  } = useGame();

  if (!selectedBuilding || isPhotoMode) return null;

  const def = getBuildingById(selectedBuilding.defId);
  if (!def) return null;

  const refund = Math.round(def.cost * 0.6);

  const handleDemolish = () => {
    handleDemolishBuilding(selectedBuilding.x, selectedBuilding.z);
    setSelectedBuildingInstanceId(null);
  };

  const handleMove = () => {
    handleMoveBuilding(selectedBuilding.instanceId);
  };

  return (
    <div className="fixed top-18 right-3 z-30 w-72 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-100 flex flex-col gap-3 pointer-events-auto select-none">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
            Информация об объекте
          </span>
          <h3 className="text-sm font-bold text-white mt-0.5">{def.name}</h3>
        </div>
        <button
          onClick={() => setSelectedBuildingInstanceId(null)}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{def.description}</p>

      {/* Stats Tags */}
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {def.population > 0 && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Жители: +{def.population}</span>
          </div>
        )}
        {def.jobs > 0 && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>Рабочие: +{def.jobs}</span>
          </div>
        )}
        {def.power !== 0 && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>{def.power > 0 ? `+${def.power}` : def.power} МВт</span>
          </div>
        )}
        {def.happiness > 0 && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Smile className="w-3.5 h-3.5 text-emerald-400" />
            <span>Счастье: +{def.happiness}</span>
          </div>
        )}
      </div>

      {/* Action buttons: Move and Demolish */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleMove}
          className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Move className="w-3.5 h-3.5 text-sky-400" />
          <span>Переместить</span>
        </button>

        <button
          onClick={handleDemolish}
          className="flex-1 py-1.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-semibold border border-rose-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Снести (+${refund})</span>
        </button>
      </div>
    </div>
  );
};
