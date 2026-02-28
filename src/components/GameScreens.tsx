import { GameState } from '@/game/OceanScene';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="absolute inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #01111f 0%, #023a5c 50%, #0a6fa3 100%)' }}>
      {/* Animated bubbles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="ocean-bubble pointer-events-none absolute rounded-full border border-primary/20"
          style={{
            '--s': `${0.5 + Math.random() * 0.8}`,
            '--d': `${i * 1.5}s`,
            '--dur': `${6 + Math.random() * 4}s`,
            width: `${20 + Math.random() * 30}px`,
            height: `${20 + Math.random() * 30}px`,
            left: `${10 + Math.random() * 80}%`,
            background: 'radial-gradient(circle, hsla(170,100%,42%,0.1), transparent)',
          } as React.CSSProperties}
        />
      ))}

      <div className="animate-pop-in flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="font-display text-6xl tracking-wider text-primary md:text-8xl">DEEP SEA</h1>
          <h2 className="font-display text-4xl tracking-wider text-accent md:text-6xl">ESCAPE</h2>
          <p className="mt-1 font-body text-xs text-destructive">🧟 The dead walk. The ocean is your only hope.</p>
        </div>

        <p className="max-w-md font-body text-sm text-muted-foreground">
          Escape the zombie apocalypse! Dive deep, discover 8 hidden creatures, survive the water pressure, and defeat the Leviathan lurking in the abyss.
        </p>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-background/30 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-body text-xs text-foreground">
            <kbd className="rounded bg-muted px-2 py-0.5 font-bold">WASD</kbd> Move
          </div>
          <div className="flex items-center gap-2 font-body text-xs text-foreground">
            <kbd className="rounded bg-muted px-2 py-0.5 font-bold">↑←↓→</kbd> Move
          </div>
          <div className="flex items-center gap-2 font-body text-xs text-foreground">
            <kbd className="rounded bg-muted px-2 py-0.5 font-bold">SPACE</kbd> Torpedo
          </div>
          <div className="flex items-center gap-2 font-body text-xs text-foreground">
            ❤️ Survive!
          </div>
        </div>

        <button
          onClick={onStart}
          className="font-display w-full rounded-xl bg-primary px-8 py-4 text-xl tracking-widest text-primary-foreground transition-transform hover:-translate-y-1 active:translate-y-0"
          style={{ boxShadow: '0 4px 0 hsl(170 100% 30%)' }}
        >
          🌊 DIVE IN!
        </button>

        <p className="font-body text-xs text-muted-foreground">
          🧟 Escape the apocalypse · 8 creatures · 🐉 Leviathan boss in the abyss
        </p>
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
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="animate-pop-in flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-card p-8 text-center"
        style={{ boxShadow: '0 0 60px hsla(0, 70%, 55%, 0.2)' }}>
        <span className="text-5xl">{state.health <= 0 ? (state.depth < 30 ? '🧟' : '💀') : '💀'}</span>
        <h2 className="font-display text-3xl text-destructive">
          {state.health <= 0
            ? (state.depth < 30 ? 'EATEN BY ZOMBIES' : (state.leviathanActive ? 'DESTROYED BY LEVIATHAN' : 'CRUSHED BY PRESSURE'))
            : 'GAME OVER'}
        </h2>
        <p className="font-body text-sm text-muted-foreground">
          You discovered {state.discovered.length} of 8 creatures
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {state.discovered.map(id => {
            const c = [
              { id: 'dolphin', emoji: '🐬' }, { id: 'shark', emoji: '🦈' },
              { id: 'octopus', emoji: '🐙' }, { id: 'jellyfish', emoji: '🪼' },
              { id: 'turtle', emoji: '🐢' }, { id: 'coral', emoji: '🪸' },
              { id: 'shipwreck', emoji: '⚓' }, { id: 'anglerfish', emoji: '🐡' },
            ].find(cr => cr.id === id);
            return (
              <span key={id} className="rounded-full bg-primary/20 px-3 py-1 text-lg">{c?.emoji}</span>
            );
          })}
        </div>
        <button
          onClick={onRestart}
          className="font-display w-full rounded-xl bg-destructive px-6 py-3 text-lg tracking-widest text-destructive-foreground transition-transform hover:-translate-y-1 active:translate-y-0"
          style={{ boxShadow: '0 4px 0 hsl(0, 50%, 40%)' }}
        >
          TRY AGAIN
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
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="animate-pop-in flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-accent/30 bg-card p-8 text-center"
        style={{ boxShadow: '0 0 60px hsla(170, 100%, 70%, 0.2)' }}>
        <span className="animate-spin text-5xl" style={{ animationDuration: '3s' }}>🏰</span>
        <h2 className="font-display text-3xl text-primary">SANCTUARY REACHED!</h2>
        <p className="font-body text-sm text-muted-foreground">
          You gathered the bioluminescence of 8 sea creatures, defeated the Leviathan, and unlocked the safe haven free from the apocalypse!
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-2xl">
          🐬 🦈 🐙 🪼 🐢 🪸 ⚓ 🐡
        </div>
        <button
          onClick={onRestart}
          className="font-display w-full rounded-xl bg-primary px-6 py-3 text-lg tracking-widest text-primary-foreground transition-transform hover:-translate-y-1 active:translate-y-0"
          style={{ boxShadow: '0 4px 0 hsl(170, 80%, 30%)' }}
        >
          🌊 DIVE AGAIN
        </button>
      </div>
    </div>
  );
}
