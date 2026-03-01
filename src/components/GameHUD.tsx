import { GameState } from '@/game/OceanScene';

const CREATURES_INFO = [
  { id: 'dolphin', name: 'Dolphin', emoji: '🐬' },
  { id: 'shark', name: 'Shark', emoji: '🦈' },
  { id: 'octopus', name: 'Octopus', emoji: '🐙' },
  { id: 'jellyfish', name: 'Jellyfish', emoji: '🪼' },
  { id: 'turtle', name: 'Turtle', emoji: '🐢' },
  { id: 'coral', name: 'Coral', emoji: '🪸' },
  { id: 'shipwreck', name: 'Shipwreck', emoji: '⚓' },
  { id: 'anglerfish', name: 'Anglerfish', emoji: '🐡' },
];

interface GameHUDProps {
  state: GameState;
}

export default function GameHUD({ state }: GameHUDProps) {
  const healthColor = state.health > 60 ? 'bg-primary' : state.health > 30 ? 'bg-accent' : 'bg-destructive';
  const healthCritical = state.health < 30;
  const pressureLevel = state.pressure > 70 ? 'text-destructive' : state.pressure > 40 ? 'text-accent' : 'text-primary';

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(180deg, rgba(1,17,31,0.8) 0%, transparent 100%)' }}>
        {/* Health */}
        <div className="flex items-center gap-2">
          <span className="text-lg">❤️</span>
          <div className={`relative h-5 w-36 overflow-hidden rounded-full bg-muted ${healthCritical ? 'animate-pulse-red' : ''}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${healthColor}`}
              style={{ width: `${Math.max(0, state.health)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-body text-xs font-bold text-foreground">
              {Math.round(state.health)}%
            </span>
          </div>
        </div>

        {/* Sonic Pulse */}
        <div className="flex items-center gap-2">
          <span className="text-lg animate-pulse" style={{ color: state.sonicPulseCharge >= 100 ? '#00d4b8' : '#4a90d9' }}>◎</span>
          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted/60 border border-primary/20">
            <div className="h-full bg-[#00d4b8] transition-all" style={{ width: `${state.sonicPulseCharge}%` }} />
          </div>
        </div>

        {/* Ammo */}
        <div className="flex items-center gap-2">
          <span className="text-lg">⚓</span>
          <span className="font-display text-lg text-primary">{state.torpedoAmmo}</span>
        </div>

        {/* Zone */}
        <div className="rounded-lg border border-primary/40 bg-background/60 px-4 py-1">
          <span className="font-display text-sm tracking-wider text-primary">{state.currentZone}</span>
        </div>

        {/* Discovery counter */}
        <div className="flex items-center gap-2">
          <span className="font-body text-sm font-semibold text-foreground">
            🐠 {state.discovered.length}/8
          </span>
        </div>
      </div>

      {/* Surface Warning */}
      {state.depth < 25 && state.gameActive && (
        <div className="absolute left-1/2 top-14 -translate-x-1/2 animate-pulse rounded-lg bg-red-900/80 px-4 py-2 text-center border border-red-500">
          <span className="font-display text-sm tracking-wider text-red-200">☣️ TOXIC SURFACE: DIVE NOW!</span>
        </div>
      )}

      {/* Health warning */}
      {state.health < 25 && state.depth >= 25 && (
        <div className="absolute left-1/2 top-14 -translate-x-1/2 animate-bounce rounded-lg bg-destructive/90 px-4 py-2 text-center">
          <span className="font-display text-sm tracking-wider text-destructive-foreground">⚠ HEALTH CRITICAL!</span>
        </div>
      )}

      {/* Objective Tracker */}
      <div className="absolute right-4 top-4 rounded-xl border border-primary/20 bg-background/80 p-4 shadow-lg backdrop-blur-sm">
        <h3 className="font-display text-xs tracking-widest text-primary/80 mb-2">OBJECTIVES / SCANS</h3>
        <ul className="font-body text-[10px] text-muted-foreground space-y-1">
          <li className={state.depth > 25 ? "text-primary line-through" : ""}>1. Escape Toxic Surface</li>
          <li className={state.journalsCollected?.length >= 4 ? "text-primary line-through" : ""}>2. Recover Lost PDAs ({state.journalsCollected?.length || 0}/4)</li>
          <li className={state.discovered.length === 8 ? "text-primary line-through" : ""}>3. Scan Marine Life ({state.discovered.length}/8)</li>
          <li className={state.leviathanDefeated ? "text-primary line-through" : state.leviathanActive ? "text-destructive blink" : ""}>4. Defeat The Kraken</li>
          <li className={state.leviathanDefeated && state.depth > 7900 ? "text-primary line-through" : ""}>5. Enter Sanctuary Cave</li>
        </ul>
      </div>

      {/* Depth & Pressure indicator */}
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
        <span className="font-body text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          style={{ writingMode: 'vertical-rl' }}>DEPTH</span>
        <div className="relative h-40 w-2 rounded-full bg-muted/40">
          <div
            className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-accent transition-all duration-300"
            style={{ top: `${state.depth}%` }}
          />
        </div>
        <span className="font-body text-[10px] text-muted-foreground">{state.depth}%</span>

        {/* Water pressure */}
        <div className="mt-2 flex flex-col items-center gap-1">
          <span className="font-body text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            style={{ writingMode: 'vertical-rl' }}>PRESSURE</span>
          <div className="relative h-20 w-2 overflow-hidden rounded-full bg-muted/40">
            <div
              className="absolute bottom-0 w-full rounded-full bg-secondary transition-all duration-500"
              style={{
                height: `${state.pressure}%`,
                background: state.pressure > 70
                  ? 'hsl(var(--destructive))'
                  : state.pressure > 40
                    ? 'hsl(var(--accent))'
                    : 'hsl(var(--primary))',
              }}
            />
          </div>
          <span className={`font-body text-[10px] font-bold ${pressureLevel}`}>{state.pressure}%</span>
        </div>
      </div>

      {/* Leviathan health bar */}
      {state.leviathanActive && !state.leviathanDefeated && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-fade-in-up">
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-sm tracking-wider text-destructive">🦑 THE KRAKEN</span>
            <div className="h-3 w-48 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-destructive transition-all duration-300"
                style={{ width: `${state.leviathanHealth}%` }}
              />
            </div>
            <span className="font-body text-[10px] text-muted-foreground">SPACE to fire torpedoes</span>
          </div>
        </div>
      )}

      {/* Leviathan defeated */}
      {state.leviathanDefeated && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-bounce-in">
          <span className="font-display text-lg text-accent">🏆 THE KRAKEN DEFEATED!</span>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4">
        <div className="rounded-lg bg-background/40 px-3 py-2 backdrop-blur-sm">
          <p className="font-body text-[10px] text-muted-foreground">
            WASD / Arrows: Move · SPACE: Torpedo
          </p>
        </div>
      </div>

      {/* Discovered creatures */}
      <div className="absolute bottom-4 right-4 flex gap-1">
        {CREATURES_INFO.map(c => (
          <div
            key={c.id}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition-all ${state.discovered.includes(c.id)
              ? 'bg-primary/20 scale-100'
              : 'bg-muted/20 scale-90 opacity-40 grayscale'
              }`}
            title={c.name}
          >
            {c.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
