/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, X, RotateCcw, RotateCw, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sounds } from '../audio/soundManager';

interface PhotoModeModalProps {
  onCapture: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const PhotoModeModal: React.FC<PhotoModeModalProps> = ({
  onCapture,
  onRotateLeft,
  onRotateRight,
  onZoomIn,
  onZoomOut,
}) => {
  const { isPhotoMode, setIsPhotoMode, cityName } = useGame();

  if (!isPhotoMode) return null;

  const handleExit = () => {
    sounds.playClick();
    setIsPhotoMode(false);
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none select-none flex flex-col justify-between p-4">
      {/* Top watermark */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
          <Camera className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            Фоторежим • {cityName}
          </span>
        </div>

        <button
          onClick={handleExit}
          className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white shadow-lg transition flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Выйти (Esc)</span>
        </button>
      </div>

      {/* Bottom Camera Toolbar */}
      <div className="self-center pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
        <button
          onClick={onRotateLeft}
          title="Повернуть влево"
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onRotateRight}
          title="Повернуть вправо"
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-800" />

        <button
          onClick={onZoomIn}
          title="Приблизить"
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={onZoomOut}
          title="Отдалить"
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-800" />

        <button
          onClick={onCapture}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Сохранить фото (PNG)</span>
        </button>
      </div>
    </div>
  );
};
