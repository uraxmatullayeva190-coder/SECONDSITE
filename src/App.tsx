/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { CitySceneController } from './three/cityScene';
import { GameCanvas } from './components/GameCanvas';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { TutorialModal } from './components/TutorialModal';
import { StatsModal } from './components/StatsModal';
import { QuestsModal } from './components/QuestsModal';
import { SavesModal } from './components/SavesModal';
import { BuildingInfoModal } from './components/BuildingInfoModal';
import { PhotoModeModal } from './components/PhotoModeModal';
import { NotificationContainer } from './components/NotificationContainer';

const GameInterface: React.FC = () => {
  const sceneControllerRef = useRef<CitySceneController | null>(null);

  const [showStats, setShowStats] = useState<boolean>(false);
  const [showQuests, setShowQuests] = useState<boolean>(false);
  const [showSaves, setShowSaves] = useState<boolean>(false);

  const { isPhotoMode, cityName } = useGame();

  const handleCaptureScreenshot = () => {
    if (!sceneControllerRef.current) return;
    const dataUrl = sceneControllerRef.current.captureScreenshot();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${cityName.toLowerCase().replace(/\s+/g, '_')}_screenshot.png`;
    a.click();
  };

  const handleRotateLeft = () => {
    sceneControllerRef.current?.rotateCameraCounterClockwise();
  };

  const handleRotateRight = () => {
    sceneControllerRef.current?.rotateCameraClockwise();
  };

  const handleZoomIn = () => {
    sceneControllerRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    sceneControllerRef.current?.zoomOut();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 3D Scene Viewport (100% unobstructed, stable WebGL canvas) */}
      <GameCanvas sceneControllerRef={sceneControllerRef} />

      {/* Main HUD Overlays (hidden during photo mode) */}
      {!isPhotoMode && (
        <>
          <TopBar
            onOpenStats={() => setShowStats(true)}
            onOpenQuests={() => setShowQuests(true)}
            onOpenSaves={() => setShowSaves(true)}
          />

          <BottomDock />

          <BuildingInfoModal />

          <NotificationContainer />

          <TutorialModal />

          {showStats && <StatsModal onClose={() => setShowStats(false)} />}
          {showQuests && <QuestsModal onClose={() => setShowQuests(false)} />}
          {showSaves && <SavesModal onClose={() => setShowSaves(false)} />}
        </>
      )}

      {/* Photo Mode Toolbar */}
      <PhotoModeModal
        onCapture={handleCaptureScreenshot}
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameInterface />
    </GameProvider>
  );
}
