import { useState } from 'react';
import { GameState } from '@/game/OceanScene';
import { playMenuClick } from '@/lib/zzfx';

interface StartScreenProps {
  onStart: (trialMode: boolean) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [showHelp, setShowHelp] = useState(false);

  const handleStart = (trialMode: boolean) => {
    playMenuClick();
    onStart(trialMode);
  };

  const handleHelp = () => {
    playMenuClick();
    setShowHelp(!showHelp);
  };

  if (showHelp) {
    return (
      <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/90 p-8 backdrop-blur-md">
        <div className="animate-pop-in max-w-xl w-full rounded-2xl border border-primary/30 bg-card/80 p-8 shadow-2xl relative">
          <button onClick={handleHelp} className="absolute top-4 right-4 text-muted-foreground hover:text-white text-2xl">✕</button>
          <h2 className="font-display tracking-widest text-3xl text-primary mb-6 text-center border-b border-white/10 pb-4">HOW TO PLAY</h2>

          <div className="space-y-6 text-sm text-foreground/80 font-body">
            <section>
              <h3 className="text-xl text-accent font-display mb-2 drop-shadow-md">🎮 CONTROLS</h3>
              <ul className="grid grid-cols-2 gap-3 opacity-90">
                <li className="flex items-center gap-3"><kbd className="bg-white/10 px-2 py-1 rounded border border-white/20 shadow-sm">W A S D</kbd> Move</li>
                <li className="flex items-center gap-3"><kbd className="bg-white/10 px-2 py-1 rounded border border-white/20 shadow-sm text-accent font-bold">SPACE</kbd> Torpedo</li>
                <li className="flex items-center gap-3 col-span-2"><kbd className="bg-white/10 px-2 py-1 rounded border border-white/20 shadow-sm text-[#00d4b8] font-bold">SHIFT</kbd> Sonic EMP Pulse (Clears Area)</li>
              </ul>
            </section>

            <section className="bg-black/30 p-4 rounded-lg border border-white/5">
              <h3 className="text-xl text-primary font-display mb-2">🌊 OBJECTIVE</h3>
              <p className="leading-relaxed opacity-90">Dive 8000m deep. You must scan creatures and recover Lost PDAs to unlock deeper Depth Gates. Manage your pressure and survive.</p>
            </section>

            <section>
              <h3 className="text-xl text-destructive font-display mb-2 drop-shadow-md">⚠️ DANGERS</h3>
              <ul className="space-y-2 opacity-90">
                <li>• <strong className="text-white">Water Pressure:</strong> Do not dive too quickly, or your hull will crush!</li>
                <li>• <strong className="text-white">Hostile Fauna:</strong> Sharks, Jellyfish, Zombies, and... something much larger.</li>
              </ul>
            </section>

            <button onClick={handleHelp} className="w-full mt-4 py-3 bg-secondary hover:bg-white/20 text-white font-display text-xl tracking-widest rounded-xl transition-all">Got it!</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[300] flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #001017 0%, #002842 40%, #005a8a 80%, #00b4d8 100%)',
        animation: 'oceanDrift 20s ease-in-out infinite alternate'
      }}>

      {/* Light Rays */}
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZmZiIgc3RvcC1vcGFjaXR5PSIwIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiNmZmYiIHN0b3Atb3BhY2l0eT0iMC4yIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+')] mix-blend-overlay animate-pulse" />

      {/* Animated bubbles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="ocean-bubble pointer-events-none absolute rounded-full bg-white/5 border border-white/20 blur-[1px]"
          style={{
            '--s': `${0.3 + Math.random() * 0.8}`,
            '--d': `${i * 0.8}s`,
            '--dur': `${4 + Math.random() * 5}s`,
            width: `${10 + Math.random() * 40}px`,
            height: `${10 + Math.random() * 40}px`,
            left: `${Math.random() * 100}%`,
          } as React.CSSProperties}
        />
      ))}

      <div className="animate-pop-in flex flex-col items-center gap-8 text-center relative z-10 w-full max-w-md px-4">
        <div className="drop-shadow-[0_0_15px_rgba(0,180,216,0.6)]">
          <h1 className="font-display text-5xl tracking-widest text-[#e0fbfc] md:text-7xl mb-[-10px] animate-float">BENEATH THE</h1>
          <h2 className="font-display text-7xl tracking-widest text-[#90e0ef] md:text-8xl drop-shadow-xl animate-float-delayed">OCEAN</h2>
        </div>

        <p className="font-body text-sm text-[#caf0f8]/80 drop-shadow-md bg-black/20 px-4 py-2 rounded-full border border-white/5">
          Survive the depths. Defeat the Kraken.
        </p>

        <div className="flex flex-col gap-4 w-full mt-4">
          <button
            onClick={() => handleStart(false)}
            className="group relative overflow-hidden font-display w-full rounded-2xl bg-[#0077b6] px-8 py-5 text-2xl tracking-widest text-white transition-all hover:bg-[#0096c7] hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,119,182,0.4)] border border-[#48cae4]/50"
          >
            <span className="relative z-10 drop-shadow-md text-nowrap">🌊 STANDARD DIVE</span>
            <div className="absolute inset-0 h-full w-full opacity-0 group-hover:opacity-20 bg-gradient-to-t from-transparent to-white transition-opacity" />
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleStart(true)}
              className="font-display rounded-xl bg-[#03045e]/60 px-4 py-4 text-lg tracking-widest text-[#90e0ef] border border-[#0077b6] transition-all hover:bg-[#0077b6]/50 hover:-translate-y-1 backdrop-blur-sm"
            >
              ⚓ TRIAL MODE
            </button>
            <button
              onClick={handleHelp}
              className="font-display rounded-xl bg-[#03045e]/60 px-4 py-4 text-lg tracking-widest text-[#90e0ef] border border-[#0077b6] transition-all hover:bg-[#0077b6]/50 hover:-translate-y-1 backdrop-blur-sm"
            >
              ⚙️ HELP / INFO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GameOverScreenProps {
  state: GameState;
  onRestart: () => void;
}

export function GameOverScreen({ state, onRestart }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="animate-pop-in flex max-w-sm flex-col items-center gap-6 rounded-3xl border-2 border-destructive/40 bg-[#0a0a0a] p-10 text-center shadow-[0_0_80px_rgba(220,38,38,0.15)]">
        <span className="text-7xl drop-shadow-2xl animate-pulse-red">💀</span>
        <div>
          <h2 className="font-display text-4xl text-destructive tracking-widest drop-shadow-md">
            HULL BREACHED
          </h2>
          <p className="font-body text-xs text-muted-foreground mt-2 uppercase tracking-widest">Depth Reached: {state.depth}m</p>
        </div>

        <p className="font-body text-sm text-white/70 bg-white/5 py-2 px-4 rounded-lg border border-white/5">
          {state.health <= 0
            ? (state.depth < 30 ? 'Eaten by infected surface dwellers' : (state.leviathanActive ? 'Devoured by the Kraken' : 'Crushed by oceanic pressure'))
            : 'Submarine destroyed'}
        </p>

        <button
          onClick={() => { playMenuClick(); onRestart(); }}
          className="font-display w-full rounded-xl bg-destructive px-6 py-4 text-xl tracking-widest text-white transition-all hover:bg-red-500 hover:scale-105 active:scale-95 shadow-[0_4px_0_hsl(0,50%,30%)]"
        >
          REDEPLOY
        </button>
      </div>
    </div>
  );
}

interface AllFoundScreenProps {
  state: GameState;
  onRestart: () => void;
}

export function AllFoundScreen({ state, onRestart }: AllFoundScreenProps) {
  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-[#001017]/90 backdrop-blur-lg">
      <div className="animate-pop-in flex max-w-md flex-col items-center gap-6 rounded-3xl border border-[#00b4d8]/40 bg-gradient-to-b from-[#002842] to-[#01111f] p-10 text-center shadow-[0_0_100px_rgba(0,180,216,0.3)] relative overflow-hidden">

        {/* Shine effect */}
        <div className="absolute top-0 left-[-100%] w-[50%] h-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[slideInRight_3s_infinite]" />

        <span className="text-6xl drop-shadow-xl animate-float">🏝️</span>
        <div>
          <h2 className="font-display text-4xl text-[#caf0f8] tracking-widest drop-shadow-md">CAVE ESCAPE SECURED!</h2>
          <p className="font-body text-xs text-[#00b4d8] mt-2 uppercase tracking-widest">The Kraken is behind you...</p>
        </div>

        <div className="font-body text-sm text-white/80 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
          You navigated the treacherous depths, survived the infected waters, and discovered the hidden underwater cavern leading to the sanctuary island!
        </div>

        <div className="w-full flex flex-col gap-2 mt-2">
          <div className="bg-[#0077b6]/20 border border-[#00b4d8]/30 text-[#90e0ef] font-display rounded-lg py-2 uppercase tracking-wider text-sm">
            ⛰️ Land Exploration Coming in next update :)
          </div>
          <div className="text-[#caf0f8]/50 font-body text-xs italic">
            Next part coming soon after 800 days...
          </div>
        </div>

        <button
          onClick={() => { playMenuClick(); onRestart(); }}
          className="font-display w-full mt-2 rounded-xl bg-[#0077b6] px-6 py-4 text-xl tracking-widest text-white transition-all hover:bg-[#00b4d8] hover:scale-105 active:scale-95 shadow-[0_4px_0_hsl(199,100%,25%)]"
        >
          🌊 DIVE AGAIN
        </button>
      </div>
    </div>
  );
}
