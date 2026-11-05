/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Coins,
  Users,
  Zap,
  Smile,
  Sun,
  Cloud,
  CloudRain,
  Moon,
  Play,
  Pause,
  FastForward,
  Camera,
  BarChart3,
  ScrollText,
  FolderArchive,
  Volume2,
  VolumeX,
  HelpCircle,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { CITY_LEVEL_TITLES } from '../data/quests';
import { sounds } from '../audio/soundManager';

interface TopBarProps {
  onOpenStats: () => void;
  onOpenQuests: () => void;
  onOpenSaves: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenStats, onOpenQuests, onOpenSaves }) => {
  const {
    cityName,
    stats,
    gameTimeHours,
    gameDay,
    weather,
    setWeather,
    gameSpeed,
    setGameSpeed,
    setGameTimeHours,
    quests,
    setShowTutorial,
    setIsPhotoMode,
    gameMode,
  } = useGame();

  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());

  const toggleSound = () => {
    const next = !isMuted;
    sounds.setMuted(next);
    setIsMuted(next);
  };

  const pendingQuestsCount = quests.filter((q) => q.completed && !q.claimed).length;

  const toggleDayNight = () => {
    sounds.playClick();
    setGameTimeHours((prev) => (prev >= 6 && prev < 19 ? 22 : 12));
  };

  const cycleWeather = () => {
    sounds.playClick();
    if (weather === 'sunny') setWeather('cloudy');
    else if (weather === 'cloudy') setWeather('rainy');
    else setWeather('sunny');
  };

  const isDay = gameTimeHours >= 6 && gameTimeHours <= 19;
  const levelTitle = CITY_LEVEL_TITLES[stats.level] || 'Мегаполис';

  // XP progress %
  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100));

  return (
    <header className="fixed top-2 left-2 right-2 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      {/* Left: City Brand, Level & XP */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 border border-slate-700/80 shadow-xl rounded-xl px-3.5 py-2 flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide text-white drop-shadow">
                {cityName}
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Ур. {stats.level}
              </span>
              {gameMode === 'sandbox' && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Песочница
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{levelTitle}</div>

            {/* XP Bar */}
            <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300 rounded-full"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center: City Stats & Indicators */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto overflow-x-auto max-w-full py-1">
        {/* Money */}
        <div className="bg-slate-900/90 border border-slate-700/80 shadow-xl rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-200">
              ${stats.money.toLocaleString()}
            </span>
            <span
              className={`text-[10px] font-semibold ${
                stats.incomePerMinute >= stats.expensesPerMinute ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.incomePerMinute >= stats.expensesPerMinute ? '+' : ''}
              ${stats.incomePerMinute - stats.expensesPerMinute}/мин
            </span>
          </div>
        </div>

        {/* Population */}
        <div className="bg-slate-900/90 border border-slate-700/80 shadow-xl rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-sky-200">
              {stats.population} <span className="text-slate-400 font-normal">/ {stats.maxPopulation}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Работа: {stats.employed}/{stats.jobs}
            </span>
          </div>
        </div>

        {/* Power */}
        <div className="bg-slate-900/90 border border-slate-700/80 shadow-xl rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Zap
            className={`w-4 h-4 shrink-0 ${
              stats.powerProduced >= stats.powerConsumed ? 'text-yellow-400' : 'text-rose-500'
            }`}
          />
          <div className="flex flex-col">
            <span
              className={`text-xs font-bold ${
                stats.powerProduced >= stats.powerConsumed ? 'text-yellow-200' : 'text-rose-300'
              }`}
            >
              {stats.powerConsumed} <span className="text-slate-400 font-normal">/ {stats.powerProduced} МВт</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {stats.powerProduced >= stats.powerConsumed ? 'В норме' : 'Дефицит!'}
            </span>
          </div>
        </div>

        {/* Happiness */}
        <div className="bg-slate-900/90 border border-slate-700/80 shadow-xl rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Smile
            className={`w-4 h-4 shrink-0 ${
              stats.happiness >= 75
                ? 'text-emerald-400'
                : stats.happiness >= 50
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">{stats.happiness}%</span>
            <span className="text-[10px] text-slate-400 font-medium">Счастье</span>
          </div>
        </div>
      </div>

      {/* Right: Time, Weather, Speed, Actions */}
      <div className="flex items-center gap-1.5 pointer-events-auto">
        {/* Time & Weather pill */}
        <div className="bg-slate-900/90 border border-slate-700/80 shadow-xl rounded-xl px-2.5 py-1.5 flex items-center gap-2">
          <button
            onClick={toggleDayNight}
            title="Переключить день / ночь"
            className="p-1 hover:bg-slate-800 rounded transition text-slate-300 hover:text-amber-300 cursor-pointer"
          >
            {isDay ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            onClick={cycleWeather}
            title={`Погода: ${weather === 'sunny' ? 'Ясно' : weather === 'cloudy' ? 'Облачно' : 'Дождь'}`}
            className="p-1 hover:bg-slate-800 rounded transition text-slate-300 hover:text-sky-300 cursor-pointer"
          >
            {weather === 'sunny' ? (
              <Sun className="w-3.5 h-3.5 text-amber-300" />
            ) : weather === 'cloudy' ? (
              <Cloud className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            )}
          </button>

          <div className="text-xs font-semibold text-slate-300 pl-1 border-l border-slate-700">
            {String(gameTimeHours).padStart(2, '0')}:00
            <span className="text-[10px] text-slate-400 ml-1">Д.{gameDay}</span>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="bg-slate-900/90 border border-slate-700/80 shadow-xl rounded-xl p-1 flex items-center gap-0.5">
          <button
            onClick={() => setGameSpeed(gameSpeed === 0 ? 1 : 0)}
            title="Пауза"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              gameSpeed === 0 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {gameSpeed === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setGameSpeed(1)}
            title="Обычная скорость"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              gameSpeed === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGameSpeed(2)}
            title="Ускоренная скорость"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              gameSpeed === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quests button with badge */}
        <button
          onClick={onOpenQuests}
          title="Задания и цели"
          className="relative bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl p-2 shadow-xl transition cursor-pointer"
        >
          <ScrollText className="w-4 h-4 text-indigo-400" />
          {pendingQuestsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
              {pendingQuestsCount}
            </span>
          )}
        </button>

        {/* Stats button */}
        <button
          onClick={onOpenStats}
          title="Статистика города"
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl p-2 shadow-xl transition cursor-pointer"
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Saves button */}
        <button
          onClick={onOpenSaves}
          title="Управление городами"
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl p-2 shadow-xl transition cursor-pointer"
        >
          <FolderArchive className="w-4 h-4 text-sky-400" />
        </button>

        {/* Photo Mode */}
        <button
          onClick={() => setIsPhotoMode(true)}
          title="Фоторежим"
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl p-2 shadow-xl transition cursor-pointer"
        >
          <Camera className="w-4 h-4 text-purple-400" />
        </button>

        {/* Audio Mute */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl p-2 shadow-xl transition cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Tutorial */}
        <button
          onClick={() => setShowTutorial(true)}
          title="Обучение"
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl p-2 shadow-xl transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-amber-300" />
        </button>
      </div>
    </header>
  );
};
