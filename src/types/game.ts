/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BuildingCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'civic'
  | 'decor'
  | 'roads';

export interface BuildingDefinition {
  id: string;
  name: string;
  category: BuildingCategory;
  cost: number;
  upkeep: number; // monthly/tick cost
  population: number; // max citizens housed
  jobs: number; // jobs provided
  power: number; // positive = provides power, negative = consumes power
  happiness: number; // happiness bonus provided
  size: [number, number]; // width, depth in grid cells
  color: string;
  accentColor: string;
  description: string;
  minLevel: number;
  icon: string;
  styleVariant?: 'cottage' | 'apartment' | 'skyscraper' | 'shop' | 'cafe' | 'mall' | 'office' | 'factory' | 'wind' | 'solar' | 'school' | 'hospital' | 'fire' | 'police' | 'park' | 'fountain' | 'monument' | 'road' | 'bridge';
}

export interface PlacedBuilding {
  instanceId: string;
  defId: string;
  x: number;
  z: number;
  rotation: number; // 0, 90, 180, 270 in degrees
  builtAt: number;
  level: number;
  powered: boolean;
  occupancy: number;
}

export type TileType = 'grass' | 'water' | 'road' | 'building' | 'empty';

export interface GridTile {
  x: number;
  z: number;
  type: TileType;
  unlocked: boolean;
  districtId?: string;
  buildingInstanceId?: string;
  elevation: number;
  isWater: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardMoney: number;
  rewardXp: number;
  targetType: 'population' | 'building_count' | 'happiness' | 'income' | 'roads';
  targetValue: number;
  targetCategory?: BuildingCategory | string;
  completed: boolean;
  claimed: boolean;
}

export type GameMode = 'standard' | 'sandbox' | 'challenge';

export interface ChallengeScenario {
  id: string;
  title: string;
  description: string;
  initialMoney: number;
  goalDescription: string;
  checkGoal: (state: CityStats) => boolean;
}

export interface CityStats {
  money: number;
  population: number;
  maxPopulation: number;
  jobs: number;
  employed: number;
  powerProduced: number;
  powerConsumed: number;
  happiness: number;
  incomePerMinute: number;
  expensesPerMinute: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface CitySaveData {
  version: number;
  id: string;
  name: string;
  colorTheme: string;
  gameMode: GameMode;
  money: number;
  xp: number;
  level: number;
  gridSize: number;
  buildings: PlacedBuilding[];
  unlockedTiles: [number, number][]; // coordinates of unlocked tiles
  quests: Quest[];
  gameTimeHours: number;
  lastPlayed: number;
  scenarioId?: string;
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy';

export type ActiveTool = 
  | { type: 'select' }
  | { type: 'build'; buildingId: string }
  | { type: 'demolish' }
  | { type: 'move' };
