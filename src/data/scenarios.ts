/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChallengeScenario } from '../types/game';

export const SCENARIOS: ChallengeScenario[] = [
  {
    id: 'eco_metropolis',
    title: 'Зелёный экополис',
    description: 'Постройте процветающий город только с чистыми источниками энергии и парками, достигнув 90% счастья и 80+ жителей.',
    initialMoney: 3000,
    goalDescription: 'Население ≥ 80, Счастье ≥ 90%',
    checkGoal: (stats) => stats.population >= 80 && stats.happiness >= 90,
  },
  {
    id: 'river_crossroads',
    title: 'Мосты через реку',
    description: 'Освойте противоположный берег реки, соединив берега мостами и создав крупный торговый район.',
    initialMoney: 4000,
    goalDescription: 'Население ≥ 120, Доход ≥ $600/мин',
    checkGoal: (stats) => stats.population >= 120 && stats.incomePerMinute >= 600,
  },
  {
    id: 'speedrun_megacity',
    title: 'Скоростной мегаполис',
    description: 'Превратите стартовый капитал в бурлящий центр с небоскрёбом и более чем 150 гражданами.',
    initialMoney: 5000,
    goalDescription: 'Население ≥ 150, Уровень города ≥ 4',
    checkGoal: (stats) => stats.population >= 150 && stats.level >= 4,
  },
];
