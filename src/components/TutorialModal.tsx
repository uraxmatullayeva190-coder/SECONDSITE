/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, ChevronRight, X, Sparkles, Home, Navigation, Zap, Store, TrendingUp } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sounds } from '../audio/soundManager';

export const TutorialModal: React.FC = () => {
  const { tutorialStep, setTutorialStep, showTutorial, setShowTutorial } = useGame();

  if (!showTutorial) return null;

  const steps = [
    {
      step: 1,
      title: '1. Построй первый дом',
      desc: 'Открой категорию «Жильё» в нижней панели и выбери «Уютный коттедж». Размести его на свободном зелёном участке сетки.',
      icon: <Home className="w-5 h-5 text-amber-400" />,
    },
    {
      step: 2,
      title: '2. Проложи дорогу',
      desc: 'Перейди во вкладку «Дороги» и проложи улицу рядом с домом, чтобы связать его со всемирной транспортной сетью.',
      icon: <Navigation className="w-5 h-5 text-sky-400" />,
    },
    {
      step: 3,
      title: '3. Добавь электростанцию',
      desc: 'Во вкладке «Энергия & Пром» выбери «Ветрогенератор». Он обеспечит город чистым электричеством.',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
    },
    {
      step: 4,
      title: '4. Построй магазин',
      desc: 'Перейди в «Коммерцию» и возведи «Минимаркет» или «Кафе», чтобы обеспечить жителей товарами и работой.',
      icon: <Store className="w-5 h-5 text-pink-400" />,
    },
    {
      step: 5,
      title: '5. Твой город развивается!',
      desc: 'По дорогам поедут автомобили, по тротуарам пойдут пешеходы, а в казну польются налоги. Экспериментируй и строй мегаполис!',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const handleClose = () => {
    sounds.playClick();
    setShowTutorial(false);
    localStorage.setItem('my_mini_city_tutorial_done', 'true');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Добро пожаловать в My Mini City!</h2>
              <p className="text-xs text-slate-400">Быстрый старт в 5 простых шагов</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="flex flex-col gap-2.5 my-1">
          {steps.map((s) => {
            const isCompleted = tutorialStep > s.step;
            const isCurrent = tutorialStep === s.step;

            return (
              <div
                key={s.step}
                className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                  isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/70'
                    : isCompleted
                    ? 'bg-slate-800/40 border-slate-700/50 opacity-80'
                    : 'bg-slate-800/20 border-slate-800/40 opacity-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-800 shrink-0">
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{s.title}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                        Текущий шаг
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleClose}
            className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            Пропустить обучение
          </button>

          <button
            onClick={handleClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Начать строительство</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
