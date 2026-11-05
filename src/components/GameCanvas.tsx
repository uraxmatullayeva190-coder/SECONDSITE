/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { CitySceneController } from '../three/cityScene';
import { sounds } from '../audio/soundManager';

interface GameCanvasProps {
  sceneControllerRef: React.MutableRefObject<CitySceneController | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ sceneControllerRef }) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const {
    gridSize,
    unlockedTiles,
    placedBuildings,
    activeTool,
    setActiveTool,
    buildingRotation,
    rotateBuilding,
    setSelectedBuildingInstanceId,
    handlePlaceBuilding,
    handleDemolishBuilding,
    undoLastAction,
    gameTimeHours,
    weather,
    isPhotoMode,
    setIsPhotoMode,
    gameSpeed,
    setGameSpeed,
  } = useGame();

  // Keep latest callbacks and data in refs to avoid re-initializing Three.js scene
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  const handlePlaceRef = useRef(handlePlaceBuilding);
  handlePlaceRef.current = handlePlaceBuilding;

  const handleDemolishRef = useRef(handleDemolishBuilding);
  handleDemolishRef.current = handleDemolishBuilding;

  const selectBuildingRef = useRef(setSelectedBuildingInstanceId);
  selectBuildingRef.current = setSelectedBuildingInstanceId;

  // Initialize scene ONCE
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const controller = new CitySceneController(canvasMountRef.current, {
      onTileClick: (x, z) => {
        const currentTool = activeToolRef.current;
        if (currentTool.type === 'build') {
          handlePlaceRef.current(x, z);
        } else if (currentTool.type === 'demolish') {
          handleDemolishRef.current(x, z);
        }
      },
      onBuildingSelect: (instanceId) => {
        selectBuildingRef.current(instanceId);
        if (instanceId) {
          sounds.playClick();
        }
      },
    });

    sceneControllerRef.current = controller;

    return () => {
      controller.destroy();
      sceneControllerRef.current = null;
    };
  }, []);

  // Sync grid & buildings data
  useEffect(() => {
    if (sceneControllerRef.current) {
      sceneControllerRef.current.setGridData(gridSize, unlockedTiles, placedBuildings);
    }
  }, [gridSize, unlockedTiles, placedBuildings]);

  // Sync tool and rotation
  useEffect(() => {
    if (sceneControllerRef.current) {
      sceneControllerRef.current.setActiveTool(activeTool, buildingRotation);
    }
  }, [activeTool, buildingRotation]);

  // Sync time & weather
  useEffect(() => {
    if (sceneControllerRef.current) {
      sceneControllerRef.current.updateTimeAndWeather(gameTimeHours, weather);
    }
  }, [gameTimeHours, weather]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        rotateBuilding();
      } else if (e.key === 'Escape') {
        if (isPhotoMode) {
          setIsPhotoMode(false);
        } else if (activeTool.type !== 'select') {
          setActiveTool({ type: 'select' });
        } else {
          setSelectedBuildingInstanceId(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'я' || e.key === 'Я')) {
        undoLastAction();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        setIsPhotoMode(!isPhotoMode);
      } else if (e.key === '1') {
        setGameSpeed(1);
      } else if (e.key === '2') {
        setGameSpeed(2);
      } else if (e.key === ' ') {
        e.preventDefault();
        setGameSpeed(gameSpeed === 0 ? 1 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotateBuilding, undoLastAction, activeTool, setActiveTool, setSelectedBuildingInstanceId, isPhotoMode, setIsPhotoMode, gameSpeed, setGameSpeed]);

  return (
    <div
      ref={canvasMountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
    />
  );
};
