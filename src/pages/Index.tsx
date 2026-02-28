import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import OceanScene, { GameState } from '@/game/OceanScene';
import IntroCutscene from '@/game/IntroCutscene';
import GameHUD from '@/components/GameHUD';
import { StartScreen, GameOverScreen, AllFoundScreen } from '@/components/GameScreens';

const initialState: GameState = {
  health: 100,
  pressure: 0,
  discovered: [],
  currentZone: 'Coral Reef',
  depth: 0,
  gameActive: false,
  leviathanHealth: 100,
  leviathanActive: false,
  leviathanDefeated: false,
  subY: 0,
  worldH: 3000,
};

export default function Index() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<OceanScene | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [screen, setScreen] = useState<'start' | 'cutscene' | 'playing' | 'gameover' | 'allfound'>('start');

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
    if (!state.gameActive && state.health <= 0) {
      setScreen('gameover');
    } else if (state.discovered.length >= 8) {
      setScreen('allfound');
    }
  }, []);

  const startCutscene = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    const cutscene = new IntroCutscene();
    cutscene.setCompleteCallback(() => {
      // Transition from cutscene to game
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      startOceanGame();
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainerRef.current!,
      width: window.innerWidth,
      height: window.innerHeight,
      scene: cutscene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: { pixelArt: false, antialias: true },
      backgroundColor: '#1a1a2e',
    });

    gameRef.current = game;
    setScreen('cutscene');
  }, []);

  const startOceanGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    const scene = new OceanScene();
    sceneRef.current = scene;
    scene.setStateCallback(handleStateChange);

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainerRef.current!,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: scene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: { pixelArt: false, antialias: true },
      backgroundColor: '#01111f',
    });

    gameRef.current = game;
    setScreen('playing');
  }, [handleStateChange]);

  const restartGame = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.resetGame();
      setScreen('playing');
    } else {
      startOceanGame();
    }
  }, [startOceanGame]);

  useEffect(() => {
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div ref={gameContainerRef} className="absolute inset-0" />

      {screen === 'start' && <StartScreen onStart={startCutscene} />}
      {screen === 'playing' && <GameHUD state={gameState} />}
      {screen === 'gameover' && <GameOverScreen state={gameState} onRestart={restartGame} />}
      {screen === 'allfound' && <AllFoundScreen state={gameState} onRestart={restartGame} />}
    </div>
  );
}
