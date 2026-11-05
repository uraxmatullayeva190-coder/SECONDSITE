/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ActiveTool,
  BuildingCategory,
  BuildingDefinition,
  CitySaveData,
  CityStats,
  GameMode,
  PlacedBuilding,
  Quest,
  WeatherType,
} from '../types/game';
import { BUILDINGS_CATALOG, getBuildingById } from '../data/buildings';
import { INITIAL_QUESTS } from '../data/quests';
import { SCENARIOS } from '../data/scenarios';
import { sounds } from '../audio/soundManager';

interface UndoAction {
  type: 'build' | 'demolish';
  building: PlacedBuilding;
  refundCost: number;
}

interface NotificationToast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

interface GameContextType {
  // City core
  cityName: string;
  setCityName: (name: string) => void;
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  scenarioId?: string;

  // Stats & Economy
  stats: CityStats;
  gameTimeHours: number;
  gameDay: number;
  weather: WeatherType;
  setWeather: (w: WeatherType) => void;
  gameSpeed: number; // 0 = pause, 1 = normal, 2 = fast
  setGameSpeed: (speed: number) => void;
  setGameTimeHours: React.Dispatch<React.SetStateAction<number>>;

  // Grid & Building
  gridSize: number;
  unlockedTiles: [number, number][];
  placedBuildings: PlacedBuilding[];
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  buildingRotation: number;
  rotateBuilding: () => void;
  selectedBuilding: PlacedBuilding | null;
  setSelectedBuildingInstanceId: (id: string | null) => void;

  // Actions
  handlePlaceBuilding: (x: number, z: number) => boolean;
  handleDemolishBuilding: (x: number, z: number) => boolean;
  handleMoveBuilding: (instanceId: string) => void;
  undoLastAction: () => void;
  canUndo: boolean;
  expandTerritory: (districtRow: number, districtCol: number) => boolean;

  // Quests & Tutorial
  quests: Quest[];
  claimQuestReward: (questId: string) => void;
  tutorialStep: number;
  setTutorialStep: (step: number) => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;

  // Saves & Modals
  savedCities: CitySaveData[];
  loadCity: (cityData: CitySaveData) => void;
  saveCurrentCity: () => void;
  createNewCity: (name: string, mode: GameMode, scenarioId?: string) => void;
  deleteSavedCity: (id: string) => void;
  exportCityJson: () => void;
  importCityJson: (jsonStr: string) => boolean;

  // Notifications
  notifications: NotificationToast[];
  dismissNotification: (id: string) => void;
  addNotification: (message: string, type?: 'info' | 'success' | 'warning') => void;

  // Photo mode
  isPhotoMode: boolean;
  setIsPhotoMode: (active: boolean) => void;
}

const STORAGE_KEY = 'my_mini_city_saves_v1';
const CURRENT_SAVE_KEY = 'my_mini_city_current_id';

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cityId, setCityId] = useState<string>(() => 'city_' + Date.now());
  const [cityName, setCityName] = useState<string>('Солнечный');
  const [colorTheme, setColorTheme] = useState<string>('classic');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [scenarioId, setScenarioId] = useState<string | undefined>(undefined);

  // Economy & Progression
  const [money, setMoney] = useState<number>(2500);
  const [population, setPopulation] = useState<number>(4);
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);

  // Time & Weather
  const [gameTimeHours, setGameTimeHours] = useState<number>(10);
  const [gameDay, setGameDay] = useState<number>(1);
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [gameSpeed, setGameSpeed] = useState<number>(1);

  // Grid
  const gridSize = 24;
  const [unlockedTiles, setUnlockedTiles] = useState<[number, number][]>(() => {
    // Initial unlocked 12x12 center plot
    const tiles: [number, number][] = [];
    for (let x = 6; x < 18; x++) {
      for (let z = 6; z < 18; z++) {
        tiles.push([x, z]);
      }
    }
    return tiles;
  });

  // Buildings starter setup (welcoming default street and cozy cottage)
  const [placedBuildings, setPlacedBuildings] = useState<PlacedBuilding[]>(() => [
    { instanceId: 'b_road_1', defId: 'road', x: 10, z: 9, rotation: 0, builtAt: Date.now(), level: 1, powered: true, occupancy: 0 },
    { instanceId: 'b_road_2', defId: 'road', x: 10, z: 10, rotation: 0, builtAt: Date.now(), level: 1, powered: true, occupancy: 0 },
    { instanceId: 'b_road_3', defId: 'road', x: 10, z: 11, rotation: 0, builtAt: Date.now(), level: 1, powered: true, occupancy: 0 },
    { instanceId: 'b_road_4', defId: 'road', x: 10, z: 12, rotation: 0, builtAt: Date.now(), level: 1, powered: true, occupancy: 0 },
    { instanceId: 'b_cottage_1', defId: 'cottage', x: 11, z: 10, rotation: 270, builtAt: Date.now(), level: 1, powered: true, occupancy: 4 },
  ]);

  // Tools & Interaction
  const [activeTool, setActiveTool] = useState<ActiveTool>({ type: 'select' });
  const [buildingRotation, setBuildingRotation] = useState<number>(0);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  // Quests & Tutorial
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [tutorialStep, setTutorialStep] = useState<number>(() => {
    return localStorage.getItem('my_mini_city_tutorial_done') ? 0 : 1;
  });
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    return !localStorage.getItem('my_mini_city_tutorial_done');
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

  // Photo mode
  const [isPhotoMode, setIsPhotoMode] = useState<boolean>(false);

  // Saved cities
  const [savedCities, setSavedCities] = useState<CitySaveData[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = 'notif_' + Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Compute stats dynamically
  let maxPopulation = 0;
  let jobs = 0;
  let powerProduced = 0;
  let powerConsumed = 0;
  let totalUpkeep = 0;
  let commercialIncome = 0;
  let decorHappiness = 0;
  let civicHappiness = 0;

  placedBuildings.forEach((pb) => {
    const def = getBuildingById(pb.defId);
    if (!def) return;

    if (def.category === 'residential') maxPopulation += def.population;
    if (def.jobs > 0) jobs += def.jobs;

    if (def.power > 0) powerProduced += def.power;
    else powerConsumed += Math.abs(def.power);

    totalUpkeep += def.upkeep;

    if (def.category === 'commercial') {
      commercialIncome += (def.jobs * 4.5) + (def.happiness * 2.5);
    }
    if (def.category === 'industrial') {
      commercialIncome += def.jobs * 3.8;
    }
    if (def.category === 'decor') {
      decorHappiness += def.happiness;
    }
    if (def.category === 'civic') {
      civicHappiness += def.happiness;
    }
  });

  // Taxes: each citizen pays $3.2 per tick
  const residentialTaxes = Math.round(population * 3.2);
  const incomePerMinute = Math.round((residentialTaxes + commercialIncome) * 12);
  const expensesPerMinute = Math.round(totalUpkeep * 12);

  // Power satisfaction ratio
  const powerSurplus = powerProduced - powerConsumed;
  const isPowerSufficient = powerProduced >= powerConsumed;

  // Happiness calculation (0-100%)
  let baseHappiness = 65;
  if (!isPowerSufficient) baseHappiness -= 28;
  if (jobs >= population * 0.7) baseHappiness += 12;
  else baseHappiness -= 15;
  baseHappiness += Math.min(20, decorHappiness);
  baseHappiness += Math.min(25, civicHappiness);
  const happiness = Math.max(10, Math.min(100, Math.round(baseHappiness)));

  const xpToNextLevel = level * 300;

  const stats: CityStats = {
    money: gameMode === 'sandbox' ? 999999 : money,
    population,
    maxPopulation,
    jobs,
    employed: Math.min(population, jobs),
    powerProduced,
    powerConsumed,
    happiness,
    incomePerMinute,
    expensesPerMinute,
    level,
    xp,
    xpToNextLevel,
  };

  // Add XP helper with level-up celebration
  const addXp = useCallback((amount: number) => {
    setXp((prev) => {
      let currentXp = prev + amount;
      let curLevel = level;
      while (currentXp >= curLevel * 300) {
        currentXp -= curLevel * 300;
        curLevel += 1;
        setLevel(curLevel);
        sounds.playLevelUp();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        addNotification(`Поздравляем! Ваш город достиг уровня ${curLevel}!`, 'success');
      }
      return currentXp;
    });
  }, [level, addNotification]);

  // Rotate tool
  const rotateBuilding = useCallback(() => {
    setBuildingRotation((prev) => (prev + 90) % 360);
    sounds.playClick();
  }, []);

  // Place building
  const handlePlaceBuilding = useCallback((x: number, z: number): boolean => {
    if (activeTool.type !== 'build') return false;
    const def = getBuildingById(activeTool.buildingId);
    if (!def) return false;

    // Check money
    if (gameMode !== 'sandbox' && money < def.cost) {
      sounds.playClick();
      addNotification(`Недостаточно средств! Нужно $${def.cost}`, 'warning');
      return false;
    }

    const newBuilding: PlacedBuilding = {
      instanceId: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      defId: def.id,
      x,
      z,
      rotation: buildingRotation,
      builtAt: Date.now(),
      level: 1,
      powered: true,
      occupancy: 0,
    };

    setPlacedBuildings((prev) => [...prev, newBuilding]);

    if (gameMode !== 'sandbox') {
      setMoney((m) => m - def.cost);
    }

    // Add to undo stack
    setUndoStack((prev) => [
      ...prev.slice(-9),
      { type: 'build', building: newBuilding, refundCost: Math.round(def.cost * 0.7) },
    ]);

    sounds.playBuild();
    addXp(Math.max(15, Math.round(def.cost * 0.1)));

    // Tutorial step advance
    if (tutorialStep === 1 && def.category === 'residential') {
      setTutorialStep(2);
      addNotification('Отлично! Теперь соедините дом дорогой.', 'success');
    } else if (tutorialStep === 2 && def.category === 'roads') {
      setTutorialStep(3);
      addNotification('Превосходно! Добавьте ветрогенератор для энергии.', 'success');
    } else if (tutorialStep === 3 && def.id === 'wind_turbine') {
      setTutorialStep(4);
      addNotification('Супер! Теперь постройте магазин или кафе.', 'success');
    } else if (tutorialStep === 4 && def.category === 'commercial') {
      setTutorialStep(5);
      addNotification('Готово! Вы освоили основы строительства!', 'success');
      localStorage.setItem('my_mini_city_tutorial_done', 'true');
    }

    return true;
  }, [activeTool, buildingRotation, gameMode, money, addNotification, addXp, tutorialStep]);

  // Demolish building
  const handleDemolishBuilding = useCallback((x: number, z: number): boolean => {
    const target = placedBuildings.find((b) => {
      const def = getBuildingById(b.defId);
      if (!def) return false;
      const [w, d] = def.size;
      return x >= b.x && x < b.x + w && z >= b.z && z < b.z + d;
    });

    if (!target) return false;

    const def = getBuildingById(target.defId);
    const refund = def ? Math.round(def.cost * 0.6) : 0;

    setPlacedBuildings((prev) => prev.filter((b) => b.instanceId !== target.instanceId));

    if (gameMode !== 'sandbox' && refund > 0) {
      setMoney((m) => m + refund);
      sounds.playCoin();
    } else {
      sounds.playDemolish();
    }

    setUndoStack((prev) => [
      ...prev.slice(-9),
      { type: 'demolish', building: target, refundCost: refund },
    ]);

    addNotification(`Объект снесён (+ $${refund})`, 'info');
    if (selectedInstanceId === target.instanceId) {
      setSelectedInstanceId(null);
    }
    return true;
  }, [placedBuildings, gameMode, selectedInstanceId, addNotification]);

  // Move building
  const handleMoveBuilding = useCallback((instanceId: string) => {
    const target = placedBuildings.find((b) => b.instanceId === instanceId);
    if (!target) return;

    // Set tool to build this building and remove existing instance
    setActiveTool({ type: 'build', buildingId: target.defId });
    setBuildingRotation(target.rotation);
    setPlacedBuildings((prev) => prev.filter((b) => b.instanceId !== instanceId));
    setSelectedInstanceId(null);
    sounds.playClick();
    addNotification('Выберите новое место для размещения здания', 'info');
  }, [placedBuildings, addNotification]);

  // Undo last action
  const undoLastAction = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (last.type === 'build') {
      // Remove placed building and refund partial cost
      setPlacedBuildings((prev) => prev.filter((b) => b.instanceId !== last.building.instanceId));
      if (gameMode !== 'sandbox') {
        const def = getBuildingById(last.building.defId);
        if (def) setMoney((m) => m + def.cost);
      }
      addNotification('Действие отменено (строительство отменено)', 'info');
    } else if (last.type === 'demolish') {
      // Restore demolished building and deduct refund
      setPlacedBuildings((prev) => [...prev, last.building]);
      if (gameMode !== 'sandbox' && last.refundCost > 0) {
        setMoney((m) => Math.max(0, m - last.refundCost));
      }
      addNotification('Действие отменено (здание восстановлено)', 'info');
    }
    sounds.playClick();
  }, [undoStack, gameMode, addNotification]);

  // Expand territory
  const expandTerritory = useCallback((districtRow: number, districtCol: number): boolean => {
    const cost = 800;
    if (gameMode !== 'sandbox' && money < cost) {
      addNotification(`Недостаточно средств для покупки участка! Нужно $${cost}`, 'warning');
      return false;
    }

    const startX = districtCol * 6;
    const startZ = districtRow * 6;
    const newTiles: [number, number][] = [];

    for (let x = startX; x < startX + 6; x++) {
      for (let z = startZ; z < startZ + 6; z++) {
        if (x < gridSize && z < gridSize) {
          newTiles.push([x, z]);
        }
      }
    }

    setUnlockedTiles((prev) => {
      const set = new Set(prev.map(([x, z]) => `${x},${z}`));
      newTiles.forEach(([x, z]) => set.add(`${x},${z}`));
      return Array.from(set).map((k) => k.split(',').map(Number) as [number, number]);
    });

    if (gameMode !== 'sandbox') {
      setMoney((m) => m - cost);
    }

    sounds.playLevelUp();
    addNotification(`Новый район открыт! (+36 участков)`, 'success');
    return true;
  }, [gameMode, money, gridSize, addNotification]);

  // Quests check & claim
  const claimQuestReward = useCallback((questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && q.completed && !q.claimed) {
          setMoney((m) => m + q.rewardMoney);
          addXp(q.rewardXp);
          sounds.playQuestSuccess();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          addNotification(`Задание выполнено! +$${q.rewardMoney}, +${q.rewardXp} XP`, 'success');
          return { ...q, claimed: true };
        }
        return q;
      })
    );
  }, [addXp, addNotification]);

  // Check quests progress on updates
  useEffect(() => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.completed) return q;
        let isDone = false;

        if (q.targetType === 'population') {
          isDone = population >= q.targetValue;
        } else if (q.targetType === 'happiness') {
          isDone = happiness >= q.targetValue;
        } else if (q.targetType === 'roads') {
          const roadCount = placedBuildings.filter((b) => b.defId === 'road' || b.defId === 'bridge').length;
          isDone = roadCount >= q.targetValue;
        } else if (q.targetType === 'building_count') {
          if (q.targetCategory) {
            const count = placedBuildings.filter((b) => {
              const def = getBuildingById(b.defId);
              return b.defId === q.targetCategory || def?.category === q.targetCategory;
            }).length;
            isDone = count >= q.targetValue;
          }
        }

        if (isDone) {
          sounds.playCoin();
          addNotification(`Цель достигнута: «${q.title}»! Нажмите, чтобы забрать награду.`, 'success');
          return { ...q, completed: true };
        }
        return q;
      })
    );
  }, [population, happiness, placedBuildings, addNotification]);

  // Simulation tick timer (every 1s / gameSpeed)
  useEffect(() => {
    if (gameSpeed === 0) return;

    const interval = setInterval(() => {
      // 1. Advance in-game hour
      setGameTimeHours((prev) => {
        const next = (prev + 1) % 24;
        if (next === 0) {
          setGameDay((d) => d + 1);
        }
        return next;
      });

      // 2. Economy calculation
      if (gameMode !== 'sandbox') {
        const netHourlyChange = Math.round((residentialTaxes + commercialIncome - totalUpkeep) / 12);
        setMoney((m) => Math.max(0, m + netHourlyChange));
      }

      // 3. Population gradual migration
      setPopulation((prevPop) => {
        if (prevPop < maxPopulation && isPowerSufficient && happiness >= 45) {
          const growth = Math.max(1, Math.floor((maxPopulation - prevPop) * 0.15));
          return Math.min(maxPopulation, prevPop + growth);
        } else if (prevPop > maxPopulation) {
          return Math.max(maxPopulation, prevPop - 2);
        }
        return prevPop;
      });

      // Random dynamic weather shift (1 in 40 chance)
      if (Math.random() < 0.025) {
        const weathers: WeatherType[] = ['sunny', 'cloudy', 'rainy'];
        const nw = weathers[Math.floor(Math.random() * weathers.length)];
        setWeather(nw);
      }
    }, 1500 / gameSpeed);

    return () => clearInterval(interval);
  }, [gameSpeed, gameMode, residentialTaxes, commercialIncome, totalUpkeep, maxPopulation, isPowerSufficient, happiness]);

  // Save / Load logic
  const saveCurrentCity = useCallback(() => {
    const saveData: CitySaveData = {
      version: 1,
      id: cityId,
      name: cityName,
      colorTheme,
      gameMode,
      money,
      xp,
      level,
      gridSize,
      buildings: placedBuildings,
      unlockedTiles,
      quests,
      gameTimeHours,
      lastPlayed: Date.now(),
      scenarioId,
    };

    setSavedCities((prev) => {
      const filtered = prev.filter((c) => c.id !== cityId);
      const updated = [saveData, ...filtered];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    localStorage.setItem(CURRENT_SAVE_KEY, cityId);
    addNotification(`Город «${cityName}» успешно сохранён!`, 'info');
  }, [cityId, cityName, colorTheme, gameMode, money, xp, level, gridSize, placedBuildings, unlockedTiles, quests, gameTimeHours, scenarioId, addNotification]);

  const loadCity = useCallback((save: CitySaveData) => {
    setCityId(save.id);
    setCityName(save.name);
    setColorTheme(save.colorTheme || 'classic');
    setGameMode(save.gameMode || 'standard');
    setMoney(save.money);
    setXp(save.xp);
    setLevel(save.level);
    setPlacedBuildings(save.buildings);
    setUnlockedTiles(save.unlockedTiles);
    setQuests(save.quests || INITIAL_QUESTS);
    setGameTimeHours(save.gameTimeHours || 12);
    setScenarioId(save.scenarioId);
    setActiveTool({ type: 'select' });
    setSelectedInstanceId(null);
    setUndoStack([]);
    sounds.playLevelUp();
    addNotification(`Город «${save.name}» загружен!`, 'success');
  }, [addNotification]);

  const createNewCity = useCallback((name: string, mode: GameMode, scenario?: string) => {
    const sc = SCENARIOS.find((s) => s.id === scenario);
    const startMoney = mode === 'sandbox' ? 999999 : (sc ? sc.initialMoney : 2500);

    const newId = 'city_' + Date.now();
    setCityId(newId);
    setCityName(name || 'Новый Город');
    setGameMode(mode);
    setScenarioId(scenario);
    setMoney(startMoney);
    setXp(0);
    setLevel(1);
    setPopulation(4);
    setGameTimeHours(10);
    setGameDay(1);
    setQuests(INITIAL_QUESTS);

    // Initial unlocked 12x12
    const tiles: [number, number][] = [];
    for (let x = 6; x < 18; x++) {
      for (let z = 6; z < 18; z++) {
        tiles.push([x, z]);
      }
    }
    setUnlockedTiles(tiles);

    setPlacedBuildings([
      { instanceId: 'b_road_1', defId: 'road', x: 10, z: 9, rotation: 0, builtAt: Date.now(), level: 1, powered: true, occupancy: 0 },
      { instanceId: 'b_road_2', defId: 'road', x: 10, z: 10, rotation: 0, builtAt: Date.now(), level: 1, powered: true, occupancy: 0 },
      { instanceId: 'b_road_3', defId: 'road', x: 10, z: 11, rotation: 0, builtAt: Date.now(), level: 1, powered: true, occupancy: 0 },
      { instanceId: 'b_road_4', defId: 'road', x: 10, z: 12, rotation: 0, builtAt: Date.now(), level: 1, powered: true, occupancy: 0 },
      { instanceId: 'b_cottage_1', defId: 'cottage', x: 11, z: 10, rotation: 270, builtAt: Date.now(), level: 1, powered: true, occupancy: 4 },
    ]);

    setActiveTool({ type: 'select' });
    setSelectedInstanceId(null);
    setUndoStack([]);
    sounds.playLevelUp();
    addNotification(`Создан новый город «${name}»!`, 'success');
  }, [addNotification]);

  const deleteSavedCity = useCallback((id: string) => {
    setSavedCities((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    addNotification('Сохранение удалено.', 'info');
  }, [addNotification]);

  const exportCityJson = useCallback(() => {
    const saveData: CitySaveData = {
      version: 1,
      id: cityId,
      name: cityName,
      colorTheme,
      gameMode,
      money,
      xp,
      level,
      gridSize,
      buildings: placedBuildings,
      unlockedTiles,
      quests,
      gameTimeHours,
      lastPlayed: Date.now(),
      scenarioId,
    };
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cityName.toLowerCase().replace(/\s+/g, '_')}_save.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Файл сохранения экспортирован!', 'success');
  }, [cityId, cityName, colorTheme, gameMode, money, xp, level, gridSize, placedBuildings, unlockedTiles, quests, gameTimeHours, scenarioId, addNotification]);

  const importCityJson = useCallback((jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr) as CitySaveData;
      if (!data.buildings || !data.unlockedTiles) throw new Error('Invalid format');
      loadCity(data);
      return true;
    } catch {
      addNotification('Ошибка при импорте файла сохранения!', 'warning');
      return false;
    }
  }, [loadCity, addNotification]);

  const selectedBuilding = placedBuildings.find((b) => b.instanceId === selectedInstanceId) || null;

  return (
    <GameContext.Provider
      value={{
        cityName,
        setCityName,
        colorTheme,
        setColorTheme,
        gameMode,
        setGameMode,
        scenarioId,
        stats,
        gameTimeHours,
        gameDay,
        weather,
        setWeather,
        gameSpeed,
        setGameSpeed,
        setGameTimeHours,
        gridSize,
        unlockedTiles,
        placedBuildings,
        activeTool,
        setActiveTool,
        buildingRotation,
        rotateBuilding,
        selectedBuilding,
        setSelectedBuildingInstanceId: setSelectedInstanceId,
        handlePlaceBuilding,
        handleDemolishBuilding,
        handleMoveBuilding,
        undoLastAction,
        canUndo: undoStack.length > 0,
        expandTerritory,
        quests,
        claimQuestReward,
        tutorialStep,
        setTutorialStep,
        showTutorial,
        setShowTutorial,
        savedCities,
        loadCity,
        saveCurrentCity,
        createNewCity,
        deleteSavedCity,
        exportCityJson,
        importCityJson,
        notifications,
        dismissNotification,
        addNotification,
        isPhotoMode,
        setIsPhotoMode,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
