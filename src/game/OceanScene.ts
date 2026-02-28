import Phaser from 'phaser';

const WORLD_W = 4000;
const WORLD_H = 3000;
const SURFACE_Y = 180;
const SUB_SPEED = 260;

interface Creature {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  radius: number;
  facts: string[];
  glowColor: number;
}

const CREATURES: Creature[] = [
  { id: 'dolphin', name: 'Dolphin', emoji: '🐬', x: 700, y: 600, radius: 60, facts: ['Dolphins sleep with one eye open', 'They can swim up to 20 mph'], glowColor: 0x4a90d9 },
  { id: 'shark', name: 'Great White Shark', emoji: '🦈', x: 1800, y: 1000, radius: 80, facts: ['Sharks can detect a drop of blood in 25 gallons of water', 'They have been around for 450 million years'], glowColor: 0xff4444 },
  { id: 'octopus', name: 'Giant Octopus', emoji: '🐙', x: 1200, y: 1800, radius: 65, facts: ['Octopuses have 3 hearts and blue blood', 'They can change color in milliseconds'], glowColor: 0x9b59b6 },
  { id: 'jellyfish', name: 'Jellyfish', emoji: '🪼', x: 2800, y: 1200, radius: 50, facts: ['Jellyfish are 95% water', 'Some species are immortal'], glowColor: 0xe74c8b },
  { id: 'turtle', name: 'Sea Turtle', emoji: '🐢', x: 2200, y: 450, radius: 55, facts: ['Sea turtles can hold their breath for 5 hours', 'They navigate using Earth\'s magnetic field'], glowColor: 0x2ecc71 },
  { id: 'coral', name: 'Ancient Coral', emoji: '🪸', x: 3000, y: 760, radius: 45, facts: ['Coral reefs support 25% of marine life', 'Some coral colonies are over 4,000 years old'], glowColor: 0xff7675 },
  { id: 'shipwreck', name: 'Lost Shipwreck', emoji: '⚓', x: 1800, y: 2600, radius: 70, facts: ['There are over 3 million shipwrecks on the ocean floor', 'The deepest wreck found is at 6,500 meters'], glowColor: 0x95a5a6 },
  { id: 'anglerfish', name: 'Anglerfish', emoji: '🐡', x: 3200, y: 2200, radius: 55, facts: ['Anglerfish use bioluminescent lures to attract prey', 'Females can be 10 times larger than males'], glowColor: 0xf39c12 },
];

const ZONES = [
  { name: 'Coral Reef', yStart: 0, yEnd: 800, color: 0x0e7fc2 },
  { name: 'Open Ocean', yStart: 800, yEnd: 1600, color: 0x054f84 },
  { name: 'Deep Sea', yStart: 1600, yEnd: 2400, color: 0x02243d },
  { name: 'The Abyss', yStart: 2400, yEnd: 3000, color: 0x010c18 },
];

export default class OceanScene extends Phaser.Scene {
  private sub!: Phaser.Physics.Arcade.Sprite;
  private propeller!: Phaser.GameObjects.Sprite;
  private headlight!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private creatureSprites: Map<string, Phaser.GameObjects.Text> = new Map();
  private creatureGlows: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private discovered: string[] = [];
  private oxygen = 100;
  private gameActive = true;
  private currentZone = 'Coral Reef';
  private darkOverlay!: Phaser.GameObjects.Graphics;
  private dustMotes: Phaser.GameObjects.Graphics[] = [];
  private exhaustBubbles: Phaser.GameObjects.Graphics[] = [];
  private leviathan!: Phaser.GameObjects.Container;
  private leviathanHealth = 100;
  private leviathanActive = false;
  private leviathanDefeated = false;
  private torpedoes: Phaser.GameObjects.Graphics[] = [];
  private torpedoCooldown = 0;
  private sharkTween!: Phaser.Tweens.Tween;
  private onStateChange?: (state: GameState) => void;
  private surfaceText!: Phaser.GameObjects.Text;
  private zoneLabelText!: Phaser.GameObjects.Text;
  private zoneLabelTimer?: Phaser.Time.TimerEvent;
  private lightShafts: Phaser.GameObjects.Graphics[] = [];
  private ventTimers: Phaser.Time.TimerEvent[] = [];
  private leviathanProjectiles: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'OceanScene' });
  }

  setStateCallback(cb: (state: GameState) => void) {
    this.onStateChange = cb;
  }

  private emitState() {
    this.onStateChange?.({
      oxygen: this.oxygen,
      discovered: [...this.discovered],
      currentZone: this.currentZone,
      depth: this.sub ? Math.max(0, Math.round(((this.sub.y - SURFACE_Y) / (WORLD_H - SURFACE_Y)) * 100)) : 0,
      gameActive: this.gameActive,
      leviathanHealth: this.leviathanHealth,
      leviathanActive: this.leviathanActive,
      leviathanDefeated: this.leviathanDefeated,
      subY: this.sub?.y ?? 0,
      worldH: WORLD_H,
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.drawBackground();
    this.drawSurface();
    this.drawLightShafts();
    this.drawCorals();
    this.drawSeaweed();
    this.drawRocks();
    this.drawHydrothermalVents();
    this.drawSeabed();
    this.createDustMotes();
    this.drawZoneLabels();
    this.createCreatures();
    this.createLeviathan();
    this.createSubmarine();
    this.createDarkOverlay();

    this.cameras.main.startFollow(this.sub, true, 0.07, 0.07);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D'),
    };

    // Spacebar for torpedoes
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.gameActive && this.torpedoCooldown <= 0) {
        this.fireTorpedo();
        this.torpedoCooldown = 500;
      }
    });

    // Oxygen drain timer
    this.time.addEvent({
      delay: 1000,
      callback: this.drainOxygen,
      callbackScope: this,
      loop: true,
    });

    // Ambient bubbles
    this.time.addEvent({
      delay: 800,
      callback: this.spawnAmbientBubble,
      callbackScope: this,
      loop: true,
    });

    this.emitState();
  }

  private drawBackground() {
    const bg = this.add.graphics();
    const bands = [
      { y: 0, h: 200, c1: 0x1a8fc0, c2: 0x0e7fc2 },
      { y: 200, h: 600, c1: 0x0e7fc2, c2: 0x0a6fa3 },
      { y: 800, h: 800, c1: 0x054f84, c2: 0x033a63 },
      { y: 1600, h: 800, c1: 0x02243d, c2: 0x011525 },
      { y: 2400, h: 600, c1: 0x010c18, c2: 0x000508 },
    ];
    bands.forEach(b => {
      bg.fillStyle(b.c1, 1);
      bg.fillRect(0, b.y, WORLD_W, b.h / 2);
      bg.fillStyle(b.c2, 1);
      bg.fillRect(0, b.y + b.h / 2, WORLD_W, b.h / 2);
    });
    bg.setDepth(-10);
  }

  private drawSurface() {
    const g = this.add.graphics();
    g.fillStyle(0x1a8fc0, 0.6);
    g.fillRect(0, SURFACE_Y - 20, WORLD_W, 40);
    // Shimmer line
    g.lineStyle(2, 0x87ceeb, 0.5);
    for (let x = 0; x < WORLD_W; x += 30) {
      g.lineBetween(x, SURFACE_Y, x + 15, SURFACE_Y);
    }
    g.setDepth(5);

    this.surfaceText = this.add.text(WORLD_W / 2, SURFACE_Y - 40, '🫧 SURFACE — REFILL OXYGEN', {
      fontFamily: 'Boogaloo',
      fontSize: '18px',
      color: '#00d4b8',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0.7).setDepth(6);
  }

  private drawLightShafts() {
    for (let i = 0; i < 14; i++) {
      const g = this.add.graphics();
      const x = 200 + Math.random() * (WORLD_W - 400);
      const w = 30 + Math.random() * 60;
      const h = 300 + Math.random() * 400;
      g.fillStyle(0x87ceeb, 0.04 + Math.random() * 0.04);
      g.fillTriangle(x, 0, x - w, h, x + w, h);
      g.setDepth(1);
      this.lightShafts.push(g);
      this.tweens.add({
        targets: g,
        x: { from: -20, to: 20 },
        alpha: { from: 0.6, to: 1 },
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawCorals() {
    const colors = [0xff7675, 0xe17055, 0xfd79a8, 0x00b894, 0xe84393, 0xfdcb6e];
    for (let i = 0; i < 40; i++) {
      const g = this.add.graphics();
      const x = 100 + Math.random() * (WORLD_W - 200);
      const y = 720 + Math.random() * 70;
      const color = colors[Math.floor(Math.random() * colors.length)];
      // Stalk
      g.fillStyle(color, 0.8);
      g.fillRect(x - 3, y - 30 - Math.random() * 20, 6, 30 + Math.random() * 20);
      // Branches
      const branches = 2 + Math.floor(Math.random() * 3);
      for (let b = 0; b < branches; b++) {
        const bx = x + (Math.random() - 0.5) * 24;
        const by = y - 20 - Math.random() * 30;
        g.fillCircle(bx, by, 5 + Math.random() * 6);
      }
      // Base
      g.fillStyle(0x2d3436, 0.5);
      g.fillEllipse(x, y, 16, 6);
      g.setDepth(2);
    }
  }

  private drawSeaweed() {
    const greens = [0x00b894, 0x00cec9, 0x55a63a, 0x2ecc71];
    for (let i = 0; i < 60; i++) {
      const g = this.add.graphics();
      const x = 50 + Math.random() * (WORLD_W - 100);
      const baseY = 700 + Math.random() * 90;
      const color = greens[Math.floor(Math.random() * greens.length)];
      const segments = 4 + Math.floor(Math.random() * 4);
      for (let s = 0; s < segments; s++) {
        const sx = x + Math.sin(s * 0.8) * 6;
        const sy = baseY - s * 12;
        g.fillStyle(color, 0.6 + Math.random() * 0.3);
        g.fillEllipse(sx, sy, 8, 14);
      }
      g.setDepth(2);
    }
  }

  private drawRocks() {
    for (let i = 0; i < 35; i++) {
      const g = this.add.graphics();
      const x = Math.random() * WORLD_W;
      const y = 1800 + Math.random() * 1100;
      g.fillStyle(0x1a1a2e, 0.6);
      g.fillEllipse(x, y, 20 + Math.random() * 40, 12 + Math.random() * 20);
      g.setDepth(2);
    }
  }

  private drawHydrothermalVents() {
    for (let i = 0; i < 5; i++) {
      const x = 500 + Math.random() * (WORLD_W - 1000);
      const y = 2000 + Math.random() * 800;
      const g = this.add.graphics();
      g.fillStyle(0x2d3436, 0.8);
      g.fillTriangle(x - 20, y, x + 20, y, x, y - 40);
      g.fillStyle(0xff6b35, 0.4);
      g.fillCircle(x, y - 10, 6);
      g.setDepth(2);

      const timer = this.time.addEvent({
        delay: 600,
        callback: () => {
          if (!this.gameActive) return;
          const smoke = this.add.graphics();
          smoke.fillStyle(0x636e72, 0.4);
          smoke.fillCircle(x + (Math.random() - 0.5) * 10, y - 45, 4);
          smoke.setDepth(3);
          this.tweens.add({
            targets: smoke,
            y: -80,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 2000,
            onComplete: () => smoke.destroy(),
          });
        },
        loop: true,
      });
      this.ventTimers.push(timer);
    }
  }

  private drawSeabed() {
    const g = this.add.graphics();
    for (let x = 0; x < WORLD_W; x += 60) {
      g.fillStyle(0x0a0a15, 0.9);
      g.fillEllipse(x + Math.random() * 30, 2940 + Math.random() * 30, 40 + Math.random() * 30, 15 + Math.random() * 10);
    }
    g.setDepth(2);
  }

  private createDustMotes() {
    for (let i = 0; i < 80; i++) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.15 + Math.random() * 0.15);
      g.fillCircle(0, 0, 1 + Math.random() * 2);
      g.setPosition(Math.random() * WORLD_W, Math.random() * WORLD_H);
      g.setDepth(4);
      this.dustMotes.push(g);
    }
  }

  private drawZoneLabels() {
    ZONES.forEach(z => {
      this.add.text(60, z.yStart + 40, z.name.toUpperCase(), {
        fontFamily: 'Boogaloo',
        fontSize: '28px',
        color: '#ffffff',
      }).setAlpha(0.12).setDepth(3);
    });
  }

  private createCreatures() {
    CREATURES.forEach(c => {
      // Glow aura
      const glow = this.add.graphics();
      glow.fillStyle(c.glowColor, 0.12);
      glow.fillCircle(c.x, c.y, c.radius + 30);
      glow.setDepth(6);
      this.creatureGlows.set(c.id, glow);

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.5, to: 1 },
        duration: 1500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Emoji sprite
      const text = this.add.text(c.x, c.y, c.emoji, {
        fontSize: '40px',
      }).setOrigin(0.5).setDepth(7);
      this.creatureSprites.set(c.id, text);

      // Movement tweens
      if (c.id === 'dolphin') {
        this.tweens.add({ targets: [text, glow], x: c.x + 200, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: [text, glow], y: c.y - 30, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else if (c.id === 'shark') {
        this.sharkTween = this.tweens.add({ targets: [text, glow], x: { from: 300, to: 3700 }, duration: 14000, yoyo: true, repeat: -1, ease: 'Linear' });
      } else if (c.id === 'octopus') {
        this.tweens.add({ targets: [text, glow], y: c.y - 50, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else if (c.id === 'turtle') {
        this.tweens.add({ targets: [text, glow], x: c.x + 300, duration: 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else if (c.id === 'anglerfish') {
        this.tweens.add({ targets: [text, glow], y: c.y - 20, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else if (c.id === 'coral') {
        this.tweens.add({ targets: [text, glow], y: c.y - 8, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });

    // Fish schools
    for (let s = 0; s < 8; s++) {
      const sx = 300 + Math.random() * (WORLD_W - 600);
      const sy = 300 + Math.random() * 1200;
      for (let f = 0; f < 5; f++) {
        const fish = this.add.text(sx + f * 25, sy + (Math.random() - 0.5) * 40, '🐟', { fontSize: '20px' }).setDepth(6);
        this.tweens.add({ targets: fish, x: fish.x + (Math.random() - 0.5) * 80, duration: 2000 + Math.random() * 2000, yoyo: true, repeat: -1, delay: Math.random() * 1000 });
        this.tweens.add({ targets: fish, y: fish.y + (Math.random() - 0.5) * 30, duration: 1500 + Math.random() * 1500, yoyo: true, repeat: -1, delay: Math.random() * 1000 });
      }
    }

    // Shipwreck debris
    const debris = ['🪨', '🐠', '🪨', '🐠'];
    debris.forEach((d, i) => {
      this.add.text(1800 + (Math.random() - 0.5) * 200, 2600 + (Math.random() - 0.5) * 100, d, { fontSize: '24px' }).setDepth(6);
    });
  }

  private createLeviathan() {
    this.leviathan = this.add.container(2000, 2700);
    this.leviathan.setDepth(8);

    // Body segments
    const body = this.add.graphics();
    // Main body
    body.fillStyle(0x1a0a2e, 0.95);
    body.fillEllipse(0, 0, 300, 100);
    // Head
    body.fillStyle(0x2a1040, 0.95);
    body.fillEllipse(-160, 0, 120, 90);
    // Eye
    body.fillStyle(0xff0000, 1);
    body.fillCircle(-180, -15, 12);
    body.fillStyle(0xffff00, 1);
    body.fillCircle(-182, -16, 5);
    // Teeth
    body.fillStyle(0xffffff, 0.9);
    for (let t = 0; t < 6; t++) {
      body.fillTriangle(-210 + t * 12, 20, -204 + t * 12, 20, -207 + t * 12, 35);
    }
    // Tail
    body.fillStyle(0x1a0a2e, 0.9);
    body.fillTriangle(140, 0, 200, -50, 200, 50);
    // Spines
    body.fillStyle(0x4a1a6e, 0.8);
    for (let s = 0; s < 5; s++) {
      const sx = -80 + s * 50;
      body.fillTriangle(sx - 8, -45, sx + 8, -45, sx, -70);
    }

    this.leviathan.add(body);

    // Leviathan label
    const label = this.add.text(0, -90, '🐉 LEVIATHAN', {
      fontFamily: 'Boogaloo',
      fontSize: '20px',
      color: '#ff4444',
      align: 'center',
    }).setOrigin(0.5);
    this.leviathan.add(label);

    // Glow
    const glow = this.add.graphics();
    glow.fillStyle(0xff0000, 0.08);
    glow.fillCircle(0, 0, 200);
    this.leviathan.add(glow);

    // Movement
    this.tweens.add({
      targets: this.leviathan,
      x: { from: 1000, to: 3000 },
      duration: 10000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: this.leviathan,
      y: { from: 2600, to: 2800 },
      duration: 5000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Leviathan projectiles
    this.time.addEvent({
      delay: 2500,
      callback: () => {
        if (!this.gameActive || !this.leviathanActive || this.leviathanDefeated) return;
        this.leviathanShoot();
      },
      loop: true,
    });
  }

  private leviathanShoot() {
    const lx = this.leviathan.x;
    const ly = this.leviathan.y;
    const sx = this.sub.x;
    const sy = this.sub.y;
    const angle = Math.atan2(sy - ly, sx - lx);

    const proj = this.add.graphics();
    proj.fillStyle(0xff0000, 0.8);
    proj.fillCircle(0, 0, 8);
    proj.fillStyle(0xff6600, 0.5);
    proj.fillCircle(0, 0, 12);
    proj.setPosition(lx, ly);
    proj.setDepth(9);
    (proj as any).vx = Math.cos(angle) * 200;
    (proj as any).vy = Math.sin(angle) * 200;
    this.leviathanProjectiles.push(proj);
  }

  private createSubmarine() {
    // Generate submarine texture
    const g = this.make.graphics({ x: 0, y: 0 });
    // Hull
    g.fillStyle(0xf5a623);
    g.fillEllipse(60, 35, 110, 45);
    // Top stripe
    g.fillStyle(0xe8951d);
    g.fillEllipse(60, 28, 100, 20);
    // Conning tower
    g.fillStyle(0xf5a623);
    g.fillRoundedRect(40, 5, 35, 22, 6);
    g.fillStyle(0xe8951d);
    g.fillRect(40, 18, 35, 9);
    // Periscope
    g.fillStyle(0x95a5a6);
    g.fillRect(55, 0, 4, 8);
    g.fillRect(55, 0, 12, 3);
    // Portholes
    [35, 55, 75].forEach(px => {
      g.fillStyle(0x2d5a8e);
      g.fillCircle(px, 35, 7);
      g.fillStyle(0x4a90d9);
      g.fillCircle(px, 35, 5);
      g.fillStyle(0x87ceeb, 0.6);
      g.fillCircle(px, 34, 3);
      g.lineStyle(1.5, 0x1a3a5c);
      g.strokeCircle(px, 35, 7);
    });
    // Nose
    g.fillStyle(0xe8951d);
    g.fillTriangle(5, 35, 15, 25, 15, 45);
    // Headlight
    g.fillStyle(0xffeb3b);
    g.fillCircle(8, 35, 4);
    // Keel
    g.fillStyle(0xd4891a);
    g.fillRect(30, 52, 60, 5);
    // Highlight
    g.fillStyle(0xffffff, 0.2);
    g.fillEllipse(60, 22, 50, 8);
    g.generateTexture('sub', 120, 65);
    g.destroy();

    // Propeller texture
    const pg = this.make.graphics({ x: 0, y: 0 });
    pg.fillStyle(0x95a5a6);
    pg.fillEllipse(12, 6, 20, 8);
    pg.fillEllipse(12, 18, 20, 8);
    pg.fillStyle(0x7f8c8d);
    pg.fillCircle(12, 12, 4);
    pg.generateTexture('prop', 24, 24);
    pg.destroy();

    // Headlight cone
    const hg = this.make.graphics({ x: 0, y: 0 });
    hg.fillStyle(0xffeb3b, 0.15);
    hg.fillTriangle(0, 20, 120, 0, 120, 40);
    hg.generateTexture('headlightCone', 120, 40);
    hg.destroy();

    this.sub = this.physics.add.sprite(400, 300, 'sub');
    this.sub.setCollideWorldBounds(true);
    this.sub.setDepth(10);
    this.sub.setDrag(200);

    this.propeller = this.add.sprite(0, 0, 'prop').setDepth(9);
    this.headlight = this.add.sprite(0, 0, 'headlightCone').setDepth(9).setAlpha(0.3);

    this.tweens.add({
      targets: this.headlight,
      alpha: { from: 0.2, to: 0.5 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createDarkOverlay() {
    this.darkOverlay = this.add.graphics();
    this.darkOverlay.setDepth(15);
    this.darkOverlay.setScrollFactor(0);
  }

  private drainOxygen() {
    if (!this.gameActive) return;
    if (this.sub.y < SURFACE_Y) {
      this.oxygen = Math.min(100, this.oxygen + 3);
    } else {
      const depthFrac = Math.min(1, (this.sub.y - SURFACE_Y) / (WORLD_H - SURFACE_Y));
      this.oxygen -= 2 + depthFrac * 2;
    }
    if (this.oxygen <= 0) {
      this.oxygen = 0;
      this.gameActive = false;
    }
    this.emitState();
  }

  private spawnAmbientBubble() {
    if (!this.gameActive) return;
    const bubble = this.add.graphics();
    bubble.fillStyle(0x87ceeb, 0.3);
    const size = 2 + Math.random() * 4;
    bubble.fillCircle(0, 0, size);
    bubble.setPosition(
      this.cameras.main.scrollX + Math.random() * this.cameras.main.width,
      this.cameras.main.scrollY + this.cameras.main.height
    );
    bubble.setDepth(12);
    this.tweens.add({
      targets: bubble,
      y: bubble.y - 200 - Math.random() * 300,
      x: bubble.x + (Math.random() - 0.5) * 50,
      alpha: 0,
      duration: 3000 + Math.random() * 2000,
      onComplete: () => bubble.destroy(),
    });
  }

  private fireTorpedo() {
    const torp = this.add.graphics();
    torp.fillStyle(0x00d4b8, 0.9);
    torp.fillEllipse(0, 0, 16, 6);
    torp.fillStyle(0xffffff, 0.5);
    torp.fillCircle(this.sub.flipX ? -6 : 6, 0, 3);
    torp.setPosition(this.sub.x, this.sub.y);
    torp.setDepth(11);
    const dir = this.sub.flipX ? -1 : 1;
    (torp as any).vx = dir * 400;
    (torp as any).vy = 0;
    this.torpedoes.push(torp);
  }

  update(time: number, delta: number) {
    if (!this.gameActive || !this.sub) return;

    // Controls
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    (this.sub.body as Phaser.Physics.Arcade.Body).setVelocity(vx * SUB_SPEED, vy * SUB_SPEED);

    if (vx < 0) this.sub.setFlipX(true);
    else if (vx > 0) this.sub.setFlipX(false);

    // Bank
    const targetAngle = vx * 5 * (Math.PI / 180);
    this.sub.rotation = Phaser.Math.Linear(this.sub.rotation, targetAngle, 0.1);

    // Propeller & headlight position
    const propX = this.sub.flipX ? this.sub.x + 65 : this.sub.x - 65;
    this.propeller.setPosition(propX, this.sub.y + 5);
    const moving = vx !== 0 || vy !== 0;
    this.propeller.rotation += (moving ? 0.3 : 0.05);

    const hlX = this.sub.flipX ? this.sub.x - 70 : this.sub.x + 70;
    this.headlight.setPosition(hlX, this.sub.y);
    this.headlight.setFlipX(this.sub.flipX);
    // Headlight brightness by depth
    const depthFrac = Math.min(1, (this.sub.y - SURFACE_Y) / (WORLD_H - SURFACE_Y));
    this.headlight.setAlpha(0.2 + depthFrac * 0.6);

    // Exhaust bubbles
    if (moving && Math.random() < 0.3) {
      const eb = this.add.graphics();
      eb.fillStyle(0x87ceeb, 0.4);
      eb.fillCircle(0, 0, 2 + Math.random() * 2);
      eb.setPosition(propX + (Math.random() - 0.5) * 10, this.sub.y + (Math.random() - 0.5) * 10);
      eb.setDepth(9);
      this.tweens.add({
        targets: eb,
        y: eb.y - 30 - Math.random() * 20,
        x: eb.x + (Math.random() - 0.5) * 20,
        alpha: 0,
        duration: 800 + Math.random() * 500,
        onComplete: () => eb.destroy(),
      });
    }

    // Dark overlay
    this.darkOverlay.clear();
    const darkness = Math.min(0.7, depthFrac * 0.7);
    this.darkOverlay.fillStyle(0x000000, darkness);
    this.darkOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Zone detection
    const newZone = ZONES.find(z => this.sub.y >= z.yStart && this.sub.y < z.yEnd)?.name || 'The Abyss';
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      this.showZoneFlash(newZone);
    }

    // Dust mote movement
    this.dustMotes.forEach(m => {
      m.y -= 0.3;
      if (m.y < 0) m.y = WORLD_H;
    });

    // Creature proximity & discovery
    CREATURES.forEach(c => {
      const sprite = this.creatureSprites.get(c.id)!;
      const dist = Phaser.Math.Distance.Between(this.sub.x, this.sub.y, sprite.x, sprite.y);

      if (!this.discovered.includes(c.id)) {
        if (dist < c.radius + 100) {
          const s = 1 + (1 - (dist - c.radius) / 100) * 0.15;
          sprite.setScale(Math.min(1.15, s));
        } else {
          sprite.setScale(1);
        }

        if (dist < c.radius + 30) {
          this.discoverCreature(c, sprite);
        }
      }
    });

    // Leviathan activation
    if (this.sub.y > 2300 && !this.leviathanDefeated) {
      this.leviathanActive = true;
    } else {
      this.leviathanActive = false;
    }

    // Leviathan collision
    if (this.leviathanActive && !this.leviathanDefeated) {
      const ldist = Phaser.Math.Distance.Between(this.sub.x, this.sub.y, this.leviathan.x, this.leviathan.y);
      if (ldist < 120) {
        this.oxygen -= 0.5;
        this.cameras.main.shake(100, 0.003);
      }
    }

    // Torpedoes update
    this.torpedoCooldown = Math.max(0, this.torpedoCooldown - delta);
    this.torpedoes = this.torpedoes.filter(t => {
      t.x += (t as any).vx * (delta / 1000);
      t.y += (t as any).vy * (delta / 1000);
      // Check leviathan hit
      if (!this.leviathanDefeated) {
        const dist = Phaser.Math.Distance.Between(t.x, t.y, this.leviathan.x, this.leviathan.y);
        if (dist < 150) {
          this.leviathanHealth -= 5;
          this.cameras.main.shake(80, 0.003);
          // Flash
          this.cameras.main.flash(100, 255, 100, 0, true);
          t.destroy();
          if (this.leviathanHealth <= 0) {
            this.leviathanDefeated = true;
            this.leviathanHealth = 0;
            this.defeatLeviathan();
          }
          this.emitState();
          return false;
        }
      }
      // Out of bounds
      if (t.x < 0 || t.x > WORLD_W || t.y < 0 || t.y > WORLD_H) {
        t.destroy();
        return false;
      }
      return true;
    });

    // Leviathan projectiles update
    this.leviathanProjectiles = this.leviathanProjectiles.filter(p => {
      p.x += (p as any).vx * (delta / 1000);
      p.y += (p as any).vy * (delta / 1000);
      const dist = Phaser.Math.Distance.Between(p.x, p.y, this.sub.x, this.sub.y);
      if (dist < 40) {
        this.oxygen -= 8;
        this.cameras.main.shake(150, 0.005);
        p.destroy();
        this.emitState();
        return false;
      }
      if (p.x < 0 || p.x > WORLD_W || p.y < 0 || p.y > WORLD_H) {
        p.destroy();
        return false;
      }
      return true;
    });

    // Jellyfish sine movement
    const jf = this.creatureSprites.get('jellyfish');
    if (jf) {
      jf.y = 1200 + Math.sin(time * 0.001) * 30;
      const jfGlow = this.creatureGlows.get('jellyfish');
      if (jfGlow) {
        jfGlow.clear();
        jfGlow.fillStyle(0xe74c8b, 0.12);
        jfGlow.fillCircle(jf.x, jf.y, 80);
      }
    }

    this.emitState();
  }

  private showZoneFlash(zone: string) {
    if (this.zoneLabelText) this.zoneLabelText.destroy();
    this.zoneLabelText = this.add.text(
      this.cameras.main.scrollX + this.cameras.main.width / 2,
      this.cameras.main.scrollY + this.cameras.main.height / 2,
      zone.toUpperCase(),
      { fontFamily: 'Boogaloo', fontSize: '48px', color: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setAlpha(0).setDepth(20);

    this.tweens.add({
      targets: this.zoneLabelText,
      alpha: { from: 0, to: 0.8 },
      duration: 500,
      yoyo: true,
      hold: 800,
      onComplete: () => this.zoneLabelText?.destroy(),
    });
  }

  private discoverCreature(creature: Creature, sprite: Phaser.GameObjects.Text) {
    this.discovered.push(creature.id);
    this.cameras.main.shake(200, 0.004);
    this.cameras.main.flash(200, 0, 180, 255, true);

    // Star burst
    for (let i = 0; i < 12; i++) {
      const star = this.add.text(sprite.x, sprite.y, '✦', {
        fontSize: '18px',
        color: '#ffd166',
      }).setOrigin(0.5).setDepth(20);
      const angle = (i / 12) * Math.PI * 2;
      this.tweens.add({
        targets: star,
        x: sprite.x + Math.cos(angle) * 80,
        y: sprite.y + Math.sin(angle) * 80,
        alpha: 0,
        duration: 800,
        onComplete: () => star.destroy(),
      });
    }

    // Scale pop
    this.tweens.add({
      targets: sprite,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    this.emitState();
  }

  private defeatLeviathan() {
    // Dramatic effect
    this.cameras.main.shake(500, 0.01);
    this.cameras.main.flash(500, 255, 50, 0, true);

    // Leviathan sinks
    this.tweens.add({
      targets: this.leviathan,
      y: WORLD_H + 200,
      alpha: 0,
      duration: 3000,
      ease: 'Cubic.easeIn',
    });

    this.emitState();
  }

  resetGame() {
    this.discovered = [];
    this.oxygen = 100;
    this.gameActive = true;
    this.currentZone = 'Coral Reef';
    this.leviathanHealth = 100;
    this.leviathanActive = false;
    this.leviathanDefeated = false;
    if (this.sub) {
      this.sub.setPosition(400, 300);
    }
    if (this.leviathan) {
      this.leviathan.setPosition(2000, 2700);
      this.leviathan.setAlpha(1);
    }
    this.emitState();
  }
}

export interface GameState {
  oxygen: number;
  discovered: string[];
  currentZone: string;
  depth: number;
  gameActive: boolean;
  leviathanHealth: number;
  leviathanActive: boolean;
  leviathanDefeated: boolean;
  subY: number;
  worldH: number;
}
