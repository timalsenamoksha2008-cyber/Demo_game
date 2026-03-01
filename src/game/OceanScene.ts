import Phaser from 'phaser';
import { playTorpedoShoot, playExplosion, playMenuClick, playKrakenRoar, playSubDamage, playAlert, playCaveEnter, playAmbientDrone } from '@/lib/zzfx';

const WORLD_W = 4000;
const WORLD_H = 8000; // Increased depth significantly for Subnautica feel
const SURFACE_Y = 180;
const SUB_SPEED = 280;

// Dynamic lights setup
const HAS_LIGHTING = true;

interface Creature {
    id: string;
    name: string;
    emoji: string;
    x: number;
    y: number;
    radius: number;
    glowColor: number;
}

const CREATURES: Creature[] = [
    { id: 'dolphin', name: 'Dolphin', emoji: '🐬', x: 700, y: 600, radius: 60, glowColor: 0x4a90d9 },
    { id: 'shark', name: 'Great White Shark', emoji: '🦈', x: 2800, y: 1200, radius: 80, glowColor: 0xff4444 },
    { id: 'jellyfish', name: 'Jellyfish', emoji: '🪼', x: 1200, y: 2800, radius: 50, glowColor: 0xe74c8b },
    { id: 'turtle', name: 'Sea Turtle', emoji: '🐢', x: 2200, y: 3500, radius: 55, glowColor: 0x2ecc71 },
    { id: 'octopus', name: 'Giant Octopus', emoji: '🐙', x: 3000, y: 4800, radius: 65, glowColor: 0x9b59b6 },
    { id: 'shipwreck', name: 'Lost Shipwreck', emoji: '⚓', x: 1800, y: 6200, radius: 70, glowColor: 0x00d4b8 },
    { id: 'anglerfish', name: 'Anglerfish', emoji: '🐡', x: 1200, y: 7200, radius: 55, glowColor: 0xf39c12 },
    { id: 'coral', name: 'Glowing Flora', emoji: '🪸', x: 3000, y: 7600, radius: 45, glowColor: 0xff7675 },
];

const JOURNALS = [
    { id: 'j1', text: "PDA Log 1:\n'I told them the submarine was built with parts from a 2005 Honda Civic. They didn't listen. Now I'm taking on water.'", y: 1800, x: 2000 },
    { id: 'j2', text: "PDA Log 2:\n'Day 42. Discovered toxic jellyfishes. Honestly, still a better work environment than my old corporate job.'", y: 3800, x: 1000 },
    { id: 'j3', text: "PDA Log 3:\n'Emergency Broadcast: This reminds me of that tragedy. The one with the twin... hydrothermal vents falling over. Never forget 9/11.'", y: 3800, x: 3000 },
    { id: 'j4', text: "PDA Log 4:\n'If you are reading this, I have been eaten by the Kraken. Please delete my browser history.'", y: 5800, x: 1500 },
];

const ZONES = [
    { name: 'Coral Reef', yStart: 0, yEnd: 2000, color: 0x0e7fc2 },
    { name: 'Open Ocean', yStart: 2000, yEnd: 4000, color: 0x054f84 },
    { name: 'Deep Sea', yStart: 4000, yEnd: 6000, color: 0x02243d },
    { name: 'The Abyss', yStart: 6000, yEnd: 8000, color: 0x010c18 },
];

export default class OceanScene extends Phaser.Scene {
    private sub!: Phaser.Physics.Arcade.Sprite;
    private propeller!: Phaser.GameObjects.Sprite;
    private headlight!: Phaser.GameObjects.Sprite;
    private headlightLight!: Phaser.GameObjects.Light;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key, Shift: Phaser.Input.Keyboard.Key };

    private creatureSprites: Map<string, Phaser.GameObjects.Text> = new Map();
    private creatureGlows: Map<string, Phaser.GameObjects.Graphics> = new Map();
    private journalSprites: Map<string, Phaser.GameObjects.Text> = new Map();

    private discovered: string[] = [];
    private journalsCollected: string[] = [];
    private health = 100;
    private pressure = 0;
    private torpedoAmmo = 10;
    private sonicPulseCharge = 100;

    private gameActive = true;
    private currentZone = 'Coral Reef';
    private darkOverlay!: Phaser.GameObjects.Graphics;
    private dustMotes: Phaser.GameObjects.Graphics[] = [];

    // Wave System
    private currentWave = 1;
    private enemies: Phaser.GameObjects.Text[] = [];
    private waveTimer!: Phaser.Time.TimerEvent;

    // The Kraken
    private krakenHead!: Phaser.GameObjects.Graphics;
    private krakenTentacles: { segments: Phaser.GameObjects.Graphics[], tx: number, ty: number }[] = [];
    private krakenHealth = 500;
    private krakenActive = false;
    private krakenDefeated = false;
    private krakenRoarTimer = 0;
    private krakenEntrance!: Phaser.GameObjects.Container;

    private torpedoes: Phaser.GameObjects.Graphics[] = [];
    private torpedoCooldown = 0;
    private onStateChange?: (state: GameState) => void;
    private surfaceText!: Phaser.GameObjects.Text;
    private zoneLabelText!: Phaser.GameObjects.Text;

    private depthGates!: Phaser.Physics.Arcade.StaticGroup;

    constructor() {
        super({ key: 'OceanScene' });
    }

    setStateCallback(cb: (state: GameState) => void) {
        this.onStateChange = cb;
    }

    private emitState() {
        const depthFrac = this.sub ? Math.max(0, (this.sub.y - SURFACE_Y) / (WORLD_H - SURFACE_Y)) : 0;
        this.pressure = Math.round(depthFrac * 100);
        this.onStateChange?.({
            health: this.health,
            pressure: this.pressure,
            discovered: [...this.discovered],
            journalsCollected: [...this.journalsCollected],
            currentZone: this.currentZone,
            depth: this.sub ? Math.max(0, Math.round(depthFrac * 100)) : 0,
            gameActive: this.gameActive,
            leviathanHealth: this.krakenHealth,
            leviathanActive: this.krakenActive,
            leviathanDefeated: this.krakenDefeated,
            subY: this.sub?.y ?? 0,
            worldH: WORLD_H,
            torpedoAmmo: this.torpedoAmmo,
            sonicPulseCharge: this.sonicPulseCharge,
            wave: this.currentWave,
        });
    }

    create() {
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

        // Turn down background music volume generically (handled by zzfx later or external audio context)
        // Enable global lighting system
        if (HAS_LIGHTING) {
            this.lights.enable().setAmbientColor(0xffffff);
        }

        // Background and environment
        this.drawBackground();
        this.drawSurface();
        this.drawCorals();     // Deep dive
        this.drawSeaweed();    // Dense kelp
        this.drawAbyssFlora(); // Deep mushrooms
        this.drawHydrothermalVents(); // 911 reference vents
        this.drawSeabed();
        this.createDustMotes();

        this.createDepthGates();

        this.createCreatures();
        this.createJournals();
        this.createKraken();
        this.createCaveEntrance();
        this.createSubmarine();
        this.createDarkOverlay();

        this.cameras.main.startFollow(this.sub, true, 0.07, 0.07);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            W: this.input.keyboard!.addKey('W'),
            A: this.input.keyboard!.addKey('A'),
            S: this.input.keyboard!.addKey('S'),
            D: this.input.keyboard!.addKey('D'),
            Shift: this.input.keyboard!.addKey('SHIFT'), // Sonic Pulse
        };

        this.input.keyboard!.on('keydown-SPACE', () => {
            if (this.gameActive && this.torpedoCooldown <= 0 && this.torpedoAmmo > 0) {
                this.fireTorpedo();
                this.torpedoCooldown = 600;
                this.torpedoAmmo--;
                this.emitState();
            } else if (this.torpedoAmmo <= 0) {
                playMenuClick(); // Click empty sound
            }
        });

        this.input.keyboard!.on('keydown-SHIFT', () => {
            if (this.gameActive && this.sonicPulseCharge >= 100) {
                this.fireSonicPulse();
            }
        });

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.gameActive) return;

                // Restoring Sonic Pulse Over Time
                if (this.sonicPulseCharge < 100) {
                    this.sonicPulseCharge = Math.min(100, this.sonicPulseCharge + 5);
                }

                // Pressure damage
                if (this.pressure > 80) {
                    this.health -= 1;
                    if (Math.random() > 0.8) playSubDamage();
                } else if (this.pressure > 50) {
                    this.health -= 0.5;
                } else {
                    this.health -= 0.2; // Base drain
                }

                if (this.health <= 0) {
                    this.health = 0;
                    this.gameActive = false;
                }
                this.emitState();
            },
            loop: true,
        });

        // Wave Spawner
        this.waveTimer = this.time.addEvent({
            delay: 3000,
            callback: this.spawnWaveEnemy,
            callbackScope: this,
            loop: true,
        });

        // Ammo restock drops
        this.time.addEvent({
            delay: 15000,
            callback: this.spawnAmmoCrate,
            callbackScope: this,
            loop: true,
        });

        // Metal Scrap Spawner (Healing)
        this.time.addEvent({
            delay: 10000,
            callback: this.spawnScrap,
            callbackScope: this,
            loop: true,
        });

        // Ambient Background Music Drone
        this.time.addEvent({
            delay: 8000,
            callback: () => {
                if (this.gameActive) playAmbientDrone();
            },
            loop: true,
        });

        this.emitState();
    }

    private createDepthGates() {
        this.depthGates = this.physics.add.staticGroup();

        // Gate 1: 2000m barrier
        const gate1 = this.add.graphics();
        gate1.fillStyle(0x00d4b8, 0.2);
        gate1.fillRect(0, 0, WORLD_W, 20);
        const g1 = this.add.sprite(WORLD_W / 2, 2000, undefined);
        g1.setSize(WORLD_W, 40);
        this.depthGates.add(g1);
        (g1 as any).requiredScans = 2;
        (g1 as any).requiredJournals = 0;
        (g1 as any).gfx = gate1;
        gate1.setPosition(0, 1990);

        // Gate 2: 4000m barrier
        const gate2 = this.add.graphics();
        gate2.fillStyle(0x00d4b8, 0.2);
        gate2.fillRect(0, 0, WORLD_W, 20);
        const g2 = this.add.sprite(WORLD_W / 2, 4000, undefined);
        g2.setSize(WORLD_W, 40);
        this.depthGates.add(g2);
        (g2 as any).requiredScans = 4;
        (g2 as any).requiredJournals = 2;
        (g2 as any).gfx = gate2;
        gate2.setPosition(0, 3990);

        // Gate 3: 6000m barrier
        const gate3 = this.add.graphics();
        gate3.fillStyle(0x00d4b8, 0.2);
        gate3.fillRect(0, 0, WORLD_W, 20);
        const g3 = this.add.sprite(WORLD_W / 2, 6000, undefined);
        g3.setSize(WORLD_W, 40);
        this.depthGates.add(g3);
        (g3 as any).requiredScans = 8;
        (g3 as any).requiredJournals = 3;
        (g3 as any).gfx = gate3;
        gate3.setPosition(0, 5990);
    }

    private drawBackground() {
        const bg = this.add.graphics();
        const bands = [
            { y: 0, h: 2000, c1: 0x1a8fc0, c2: 0x0e7fc2 },
            { y: 2000, h: 2000, c1: 0x0e7fc2, c2: 0x054f84 },
            { y: 4000, h: 2000, c1: 0x054f84, c2: 0x02243d },
            { y: 6000, h: 2000, c1: 0x02243d, c2: 0x010c18 },
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
        g.lineStyle(2, 0x87ceeb, 0.5);
        for (let x = 0; x < WORLD_W; x += 30) {
            g.lineBetween(x, SURFACE_Y, x + 15, SURFACE_Y);
        }
        g.setPipeline('Light2D');
        g.setDepth(5);
    }

    private drawCorals() {
        const colors = [0xff7675, 0xe17055, 0xfd79a8, 0x00b894, 0xe84393, 0xfdcb6e];
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * WORLD_W;
            const y = 800 + Math.random() * 4000;
            const g = this.add.graphics();
            const color = colors[Math.floor(Math.random() * colors.length)];
            g.fillStyle(color, 0.8);
            g.fillEllipse(x, y, 10 + Math.random() * 20, 30 + Math.random() * 40);
            g.setDepth(2);
        }
    }

    private drawAbyssFlora() {
        // Glowing mushrooms deeply inspired by subnautica
        const colors = [0x00d4b8, 0x9b59b6, 0x00ffcc];
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * WORLD_W;
            const y = 4500 + Math.random() * 3000;
            const g = this.add.graphics();
            const col = colors[Math.floor(Math.random() * colors.length)];

            // Stalk
            g.fillStyle(0x111111, 1);
            g.fillRect(x - 4, y, 8, 40);
            // Cap
            g.fillStyle(col, 0.9);
            g.fillEllipse(x, y - 10, 30, 15);

            // Glow
            g.fillStyle(col, 0.2);
            g.fillCircle(x, y, 50);
            g.setDepth(2);
        }
    }

    private drawHydrothermalVents() {
        for (let i = 0; i < 15; i++) {
            const x = 500 + Math.random() * (WORLD_W - 1000);
            const y = 3000 + Math.random() * 2000;
            const g = this.add.graphics();
            g.fillStyle(0x0a0a0a, 0.9);
            // Twin vents
            g.fillRect(x - 15, y, 12, -80);
            g.fillRect(x + 5, y, 12, -75);
            g.setDepth(2);
        }
    }

    private drawSeaweed() {
        const greens = [0x00b894, 0x00cec9, 0x55a63a, 0x2ecc71];
        for (let i = 0; i < 300; i++) {
            const g = this.add.graphics();
            const x = Math.random() * WORLD_W;
            const baseY = 800 + Math.random() * 5000;
            const color = greens[Math.floor(Math.random() * greens.length)];
            const segments = 4 + Math.floor(Math.random() * 8); // Taller kelp
            for (let s = 0; s < segments; s++) {
                const sx = x + Math.sin(s * 0.8) * 15;
                const sy = baseY - s * 24;
                g.fillStyle(color, 0.6 + Math.random() * 0.3);
                g.fillEllipse(sx, sy, 12, 28);
            }
            g.setDepth(2);
        }
    }

    private drawSeabed() {
        const g = this.add.graphics();
        for (let x = 0; x < WORLD_W; x += 60) {
            g.fillStyle(0x0a0a15, 1);
            g.fillEllipse(x + Math.random() * 30, WORLD_H - 60 + Math.random() * 30, 80 + Math.random() * 60, 40 + Math.random() * 20);
        }
        g.setDepth(2);
    }

    private createDustMotes() {
        for (let i = 0; i < 300; i++) {
            const g = this.add.graphics();
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(0, 0, 1 + Math.random() * 2);
            g.setPosition(Math.random() * WORLD_W, Math.random() * WORLD_H);
            g.setDepth(4);
            this.dustMotes.push(g);
        }
    }

    private createJournals() {
        JOURNALS.forEach(j => {
            const glow = this.add.graphics();
            glow.fillStyle(0x00ffcc, 0.2);
            glow.fillCircle(j.x, j.y, 50);
            glow.setDepth(6);
            this.creatureGlows.set(j.id, glow);

            this.tweens.add({
                targets: glow, alpha: { from: 0.5, to: 1 }, duration: 500, yoyo: true, repeat: -1
            });

            const text = this.add.text(j.x, j.y, '📱', { fontSize: '32px' }).setOrigin(0.5).setDepth(7);
            this.journalSprites.set(j.id, text);
            (text as any).journalText = j.text;
            this.tweens.add({ targets: text, y: j.y - 10, duration: 1500 + Math.random() * 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });
    }

    private createCreatures() {
        CREATURES.forEach(c => {
            const glow = this.add.graphics();
            glow.fillStyle(c.glowColor, 0.15);
            glow.fillCircle(c.x, c.y, c.radius + 40);
            glow.setDepth(6);
            this.creatureGlows.set(c.id, glow);

            this.tweens.add({
                targets: glow,
                alpha: { from: 0.3, to: 1 },
                duration: 2000 + Math.random() * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            const text = this.add.text(c.x, c.y, c.emoji, {
                fontSize: '48px',
            }).setOrigin(0.5).setDepth(7);
            this.creatureSprites.set(c.id, text);

            this.tweens.add({ targets: text, y: c.y - 20, duration: 2000 + Math.random() * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });
    }

    private createKraken() {
        this.krakenHealth = 600; // Buffed HP
        this.krakenHead = this.add.graphics();
        // Huge bulbous head
        this.krakenHead.fillStyle(0x3B1A3D, 1);
        this.krakenHead.fillEllipse(0, -50, 260, 320); // Larger Hitbox

        this.krakenHead.fillStyle(0xFFDD00, 1);
        this.krakenHead.fillCircle(-80, 20, 30);
        this.krakenHead.fillCircle(80, 20, 30);
        this.krakenHead.fillStyle(0xFF0000, 1);
        this.krakenHead.fillEllipse(-80, 20, 10, 35);
        this.krakenHead.fillEllipse(80, 20, 10, 35);

        this.krakenHead.fillStyle(0x1a0a1a, 1);
        this.krakenHead.fillTriangle(0, 100, -40, 160, 40, 160);

        const kx = WORLD_W / 2;
        const ky = WORLD_H - 300;
        this.krakenHead.setPosition(kx, ky);
        this.krakenHead.setDepth(8);

        for (let i = 0; i < 6; i++) {
            const tentacle = [];
            for (let j = 0; j < 8; j++) {
                const seg = this.add.graphics();
                seg.fillStyle(0x4A2A4E, 1);
                seg.fillEllipse(0, 0, 40 - (j * 3), 60 - (j * 4));
                seg.setDepth(7);
                tentacle.push(seg);
            }
            this.krakenTentacles.push({
                segments: tentacle,
                tx: kx + (i - 2.5) * 150,
                ty: ky + 100
            });
        }

        const label = this.add.text(kx, ky - 260, '🦑 THE KRAKEN', {
            fontFamily: 'Boogaloo',
            fontSize: '56px',
            color: '#ff4444',
            shadow: { blur: 20, color: '#ff0000', fill: true }
        }).setOrigin(0.5).setDepth(9);
    }

    private createCaveEntrance() {
        this.krakenEntrance = this.add.container(WORLD_W / 2, WORLD_H - 100);

        const g = this.add.graphics();
        g.fillStyle(0x050510, 1);
        g.fillEllipse(0, 0, 400, 150);
        g.lineStyle(8, 0x00d4b8, 0.4);
        g.strokeEllipse(0, 0, 420, 170);

        this.krakenEntrance.add(g);

        const txt = this.add.text(0, -20, 'ENTRANCE\n(Defeat Kraken)', {
            fontFamily: 'Quicksand', fontSize: '24px', align: 'center', color: '#00d4b8'
        }).setOrigin(0.5);
        this.krakenEntrance.add(txt);
        this.krakenEntrance.setDepth(1);
    }

    private spawnWaveEnemy() {
        if (!this.gameActive || !this.sub) return;

        const depth = this.sub.y;

        // Spread out waves due to depth increase
        if (depth < 2000) this.currentWave = 1;
        else if (depth < 4000) this.currentWave = 2;
        else if (depth < 6000) this.currentWave = 3;
        else this.currentWave = 4;

        const spawnX = Math.random() > 0.5 ? -50 : WORLD_W + 50;
        const spawnY = this.sub.y + (Math.random() - 0.5) * 800;

        let emoji = '🦈';
        let speed = 120;
        let hp = 10;
        let dmg = 15;

        if (this.currentWave === 1) {
            emoji = Math.random() > 0.3 ? '🦈' : '🐡';
            speed = 150;
        } else if (this.currentWave === 2) {
            emoji = Math.random() > 0.5 ? '🪼' : '🦑';
            speed = 100;
            dmg = 25;
        } else if (this.currentWave === 3) {
            emoji = Math.random() > 0.8 ? '🧟' : (Math.random() > 0.5 ? '🦈' : '🪨');
            speed = 220;
            hp = 30; // Spongy
        } else if (this.currentWave === 4) {
            if (this.krakenDefeated) return;
            emoji = '🦴';
            speed = 350; // Kraken flings things fast
        }

        const enemy = this.add.text(spawnX, spawnY, emoji, { fontSize: '48px' }).setOrigin(0.5).setDepth(7);
        (enemy as any).hp = hp;
        (enemy as any).dmg = dmg;
        (enemy as any).baseSpeed = speed;

        this.enemies.push(enemy);
    }

    private spawnAmmoCrate() {
        if (!this.gameActive || !this.sub) return;
        const x = Math.random() * WORLD_W;
        const y = this.sub.y - 1000;
        const crate = this.add.text(x, y, '📦', { fontSize: '36px' }).setOrigin(0.5).setDepth(8);
        (crate as any).isAmmo = true;
        (crate as any).vy = 60 + Math.random() * 60;
        this.enemies.push(crate);
    }

    private spawnScrap() {
        if (!this.gameActive || !this.sub) return;
        const x = Math.random() * WORLD_W;
        const y = this.sub.y - 800;
        const scrap = this.add.text(x, y, '⚙️', { fontSize: '30px' }).setOrigin(0.5).setDepth(8);
        (scrap as any).isScrap = true;
        (scrap as any).vy = 40 + Math.random() * 30; // Falls slightly slower than ammo
        this.enemies.push(scrap);
    }

    private createSubmarine() {
        const g = this.make.graphics({ x: 0, y: 0 });
        g.fillStyle(0xf5a623); g.fillEllipse(60, 35, 110, 45); // Hull
        g.fillStyle(0xe8951d); g.fillEllipse(60, 28, 100, 20); // Top stripe
        g.fillStyle(0xf5a623); g.fillRoundedRect(40, 5, 35, 22, 6); // Tower
        g.fillStyle(0xe8951d); g.fillRect(40, 18, 35, 9);
        g.fillStyle(0x95a5a6); g.fillRect(55, 0, 4, 8); g.fillRect(55, 0, 12, 3); // Periscope
        [35, 55, 75].forEach(px => {
            g.fillStyle(0x2d5a8e); g.fillCircle(px, 35, 7);
            g.fillStyle(0x4a90d9); g.fillCircle(px, 35, 5);
            g.fillStyle(0x87ceeb, 0.6); g.fillCircle(px, 34, 3);
            g.lineStyle(1.5, 0x1a3a5c); g.strokeCircle(px, 35, 7);
        });
        g.fillStyle(0xe8951d); g.fillTriangle(5, 35, 15, 25, 15, 45); // Nose
        g.fillStyle(0xffffff); g.fillCircle(8, 35, 5); // Headlight fixture
        g.fillStyle(0xd4891a); g.fillRect(30, 52, 60, 5); // Keel
        g.generateTexture('sub', 120, 65);
        g.destroy();

        const pg = this.make.graphics({ x: 0, y: 0 });
        pg.fillStyle(0x95a5a6); pg.fillEllipse(12, 6, 20, 8); pg.fillEllipse(12, 18, 20, 8);
        pg.fillStyle(0x7f8c8d); pg.fillCircle(12, 12, 4);
        pg.generateTexture('prop', 24, 24);
        pg.destroy();

        const hg = this.make.graphics({ x: 0, y: 0 });
        hg.fillStyle(0xffffff, 1);
        hg.fillTriangle(0, 50, 600, 0, 600, 100); // Wider and brighter beam
        hg.generateTexture('headlightCone', 600, 100);
        hg.destroy();

        this.sub = this.physics.add.sprite(400, 300, 'sub');
        this.sub.setCollideWorldBounds(true);
        this.sub.setDepth(10);
        this.sub.setDrag(200);

        this.propeller = this.add.sprite(0, 0, 'prop').setDepth(9);
        this.headlight = this.add.sprite(0, 0, 'headlightCone').setDepth(15).setBlendMode(Phaser.BlendModes.ADD);

        if (HAS_LIGHTING) {
            this.headlightLight = this.lights.addLight(0, 0, 800).setColor(0xffffff).setIntensity(3);
        }
    }

    private createDarkOverlay() {
        this.darkOverlay = this.add.graphics();
        this.darkOverlay.setDepth(14);
        this.darkOverlay.setScrollFactor(0);
    }

    private fireSonicPulse() {
        playExplosion(); // Reuse explosion sound
        this.sonicPulseCharge = 0;
        this.cameras.main.shake(300, 0.01);
        this.cameras.main.flash(200, 0, 150, 255);

        const pulse = this.add.graphics();
        pulse.setPosition(this.sub.x, this.sub.y);
        pulse.setDepth(15);

        this.tweens.addCounter({
            from: 0, to: 800, duration: 800,
            onUpdate: (tw) => {
                pulse.clear();
                pulse.lineStyle(6, 0x00d4b8, 1 - tw.progress);
                pulse.strokeCircle(0, 0, tw.getValue());
                pulse.fillStyle(0x00d4b8, 0.2 * (1 - tw.progress));
                pulse.fillCircle(0, 0, tw.getValue());
            },
            onComplete: () => pulse.destroy()
        });

        // Damage Kraken massively if nearby
        if (this.krakenActive && !this.krakenDefeated) {
            if (Phaser.Math.Distance.Between(this.sub.x, this.sub.y, this.krakenHead.x, this.krakenHead.y) < 800) {
                this.krakenHealth -= 80;
                playKrakenRoar();
                if (this.krakenHealth <= 0) {
                    this.krakenDefeated = true;
                    this.defeatKraken();
                }
            }
        }

        // Kill all screen enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!(e as any).isAmmo) {
                if (Phaser.Math.Distance.Between(this.sub.x, this.sub.y, e.x, e.y) < 800) {
                    this.explode(e.x, e.y, 0x00d4b8, 1);
                    e.destroy();
                    this.enemies.splice(i, 1);
                }
            }
        }
        this.emitState();
    }

    private fireTorpedo() {
        playTorpedoShoot();

        const torp = this.add.graphics();
        torp.fillStyle(0x00d4b8, 1);
        torp.fillRoundedRect(-15, -4, 40, 10, 4); // Bigger hitboxes
        torp.fillStyle(0xffaa00, 1);
        torp.fillCircle(this.sub.flipX ? 15 : -15, 0, 6);
        torp.setPosition(this.sub.x, this.sub.y + 10);
        torp.setDepth(11);

        const dir = this.sub.flipX ? -1 : 1;
        (torp as any).vx = dir * 800; // Much faster
        (torp as any).vy = (Math.random() - 0.5) * 20;
        (torp as any).isPlayer = true;
        this.torpedoes.push(torp);

        this.cameras.main.shake(50, 0.002);
    }

    private explode(x: number, y: number, color: number = 0xffaa00, size: number = 1) {
        playExplosion();
        this.cameras.main.shake(100 * size, 0.005 * size);

        const expl = this.add.graphics();
        expl.setPosition(x, y);
        expl.setDepth(12);

        this.tweens.addCounter({
            from: 0,
            to: 100 * size,
            duration: 300 * size,
            onUpdate: (tw) => {
                expl.clear();
                expl.fillStyle(color, 1 - tw.progress);
                expl.fillCircle(0, 0, tw.getValue());
                expl.lineStyle(4, 0xffffff, 1 - tw.progress);
                expl.strokeCircle(0, 0, tw.getValue() * 1.2);
            },
            onComplete: () => expl.destroy()
        });
    }

    update(time: number, delta: number) {
        if (!this.gameActive || !this.sub) return;

        // Block movement if colliding with gates
        let canGoDown = true;
        this.depthGates.children.each((g: any) => {
            if (g.active) {
                // Objective Check
                if (this.discovered.length >= g.requiredScans && this.journalsCollected.length >= g.requiredJournals) {
                    g.active = false;
                    g.gfx.destroy();
                    g.destroy();
                    playAlert();
                    const t = this.add.text(this.sub.x, this.sub.y - 120, 'DEPTH BARRIER UNLOCKED!', { fontFamily: 'Boogaloo', fontSize: '32px', color: '#00d4b8' }).setOrigin(0.5).setDepth(20);
                    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 2000, onComplete: () => t.destroy() });
                } else {
                    // Block sub
                    if (this.sub.y > g.y - 40 && this.sub.y < g.y + 20) {
                        canGoDown = false;
                        this.sub.y = g.y - 41;
                        if (Math.random() < 0.05) {
                            const t = this.add.text(this.sub.x, this.sub.y - 80, `GATED: Need ${g.requiredScans} Scans & ${g.requiredJournals} Journals`, { fontFamily: 'Boogaloo', fontSize: '24px', color: '#ff4444' }).setOrigin(0.5).setDepth(20);
                            this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
                        }
                    }
                }
            }
            return true;
        });

        // Controls
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
        if ((this.cursors.down.isDown || this.wasd.S.isDown) && canGoDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        (this.sub.body as Phaser.Physics.Arcade.Body).setVelocity(vx * SUB_SPEED, vy * SUB_SPEED);

        if (vx < 0) this.sub.setFlipX(true);
        else if (vx > 0) this.sub.setFlipX(false);

        const targetAngle = vx * 5 * (Math.PI / 180);
        this.sub.rotation = Phaser.Math.Linear(this.sub.rotation, targetAngle, 0.1);

        const propX = this.sub.flipX ? this.sub.x + 50 : this.sub.x - 50;
        this.propeller.setPosition(propX, this.sub.y + 10);
        const moving = vx !== 0 || vy !== 0;
        this.propeller.rotation += (moving ? 0.3 : 0.05);

        const hlX = this.sub.flipX ? this.sub.x - 40 : this.sub.x + 40;
        this.headlight.setPosition(hlX, this.sub.y);
        this.headlight.setFlipX(this.sub.flipX);
        this.headlight.setOrigin(this.sub.flipX ? 1 : 0, 0.5);

        const depthFrac = Math.min(1, (this.sub.y - SURFACE_Y) / (WORLD_H - SURFACE_Y));
        const darkness = Math.min(0.80, depthFrac * 1.0); // Reduced maximum opacity for better visibility

        this.darkOverlay.clear();
        this.darkOverlay.fillStyle(0x000010, darkness);
        this.darkOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        if (HAS_LIGHTING) {
            this.lights.setAmbientColor(Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(0xffffff),
                Phaser.Display.Color.ValueToColor(0x000000),
                100, Math.min(100, depthFrac * 100)
            ).color);
            this.headlightLight.setPosition(hlX + (this.sub.flipX ? -300 : 300), this.sub.y);
            this.headlightLight.setIntensity(Math.min(3.5, 1 + depthFrac * 4)); // Even brighter headlight
        }

        this.headlight.setAlpha(0.15 + (depthFrac * 0.45));

        if (moving && Math.random() < 0.4) {
            const eb = this.add.graphics();
            eb.fillStyle(0x87ceeb, 0.6);
            eb.fillCircle(0, 0, 2 + Math.random() * 4);
            eb.setPosition(propX + (Math.random() - 0.5) * 10, this.sub.y + (Math.random() - 0.5) * 10);
            eb.setDepth(9);
            this.tweens.add({
                targets: eb,
                y: eb.y - 100 - Math.random() * 50,
                x: eb.x + (Math.random() - 0.5) * 40,
                scale: 2,
                alpha: 0,
                duration: 1000 + Math.random() * 800,
                onComplete: () => eb.destroy(),
            });
        }

        // Journal Discovery
        JOURNALS.forEach(j => {
            const sprite = this.journalSprites.get(j.id);
            if (sprite && !this.journalsCollected.includes(j.id)) {
                const dist = Phaser.Math.Distance.Between(this.sub.x, this.sub.y, sprite.x, sprite.y);
                if (dist < 80) {
                    this.journalsCollected.push(j.id);
                    playMenuClick();
                    sprite.destroy();
                    if (this.creatureGlows.has(j.id)) this.creatureGlows.get(j.id)!.destroy();

                    // Draw big dark humor text
                    const popup = this.add.text(WORLD_W / 2, this.cameras.main.scrollY + 200, (sprite as any).journalText, {
                        fontFamily: 'Quicksand', fontSize: '24px', color: '#00ffcc', align: 'center',
                        backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 20, y: 20 }
                    }).setOrigin(0.5).setDepth(300).setScrollFactor(0);

                    this.tweens.add({ targets: popup, alpha: 0, y: popup.y - 50, duration: 8000, delay: 2000, onComplete: () => popup.destroy() });
                    this.emitState();
                }
            }
        });

        // Creature Mechanics
        CREATURES.forEach(c => {
            const sprite = this.creatureSprites.get(c.id)!;
            const dist = Phaser.Math.Distance.Between(this.sub.x, this.sub.y, sprite.x, sprite.y);

            if (!this.discovered.includes(c.id)) {
                if (dist < c.radius + 150) {
                    sprite.setScale(Math.min(1.2, 1 + (150 - dist) / 150));
                } else {
                    sprite.setScale(1);
                }

                const inLight = (this.sub.flipX && sprite.x < this.sub.x && sprite.x > this.sub.x - 600 && Math.abs(sprite.y - this.sub.y) < 150) ||
                    (!this.sub.flipX && sprite.x > this.sub.x && sprite.x < this.sub.x + 600 && Math.abs(sprite.y - this.sub.y) < 150);

                if (dist < c.radius + 30 || (dist < 250 && inLight)) {
                    this.discoverCreature(c, sprite);
                }
            }
        });

        this.torpedoCooldown = Math.max(0, this.torpedoCooldown - delta);
        this.torpedoes = this.torpedoes.filter(t => {
            t.x += (t as any).vx * (delta / 1000);
            t.y += (t as any).vy * (delta / 1000);

            if (Math.random() > 0.5) {
                const trail = this.add.graphics();
                trail.fillStyle(0xffffff, 0.5).fillCircle(t.x, t.y, 2).setDepth(10);
                this.tweens.add({ targets: trail, alpha: 0, scale: 3, y: t.y - 20, duration: 400, onComplete: () => trail.destroy() });
            }

            if (this.krakenActive && !this.krakenDefeated) {
                const dist = Phaser.Math.Distance.Between(t.x, t.y, this.krakenHead.x, this.krakenHead.y);
                if (dist < 260) { // massive hitbox for easy hit
                    this.krakenHealth -= 20;
                    this.explode(t.x, t.y, 0xFF00FF, 2.5);
                    playKrakenRoar();
                    t.destroy();
                    if (this.krakenHealth <= 0) {
                        this.krakenDefeated = true;
                        this.defeatKraken();
                    }
                    this.emitState();
                    return false;
                }
            }

            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if ((enemy as any).isAmmo) continue;

                if (Phaser.Math.Distance.Between(t.x, t.y, enemy.x, enemy.y) < 60) {
                    this.explode(enemy.x, enemy.y, 0xff5555, 1);
                    (enemy as any).hp -= 50;
                    if ((enemy as any).hp <= 0) {
                        enemy.destroy();
                        this.enemies.splice(i, 1);
                    }
                    t.destroy();
                    return false;
                }
            }

            if (t.x < 0 || t.x > WORLD_W || t.y < 0 || t.y > WORLD_H) {
                t.destroy();
                return false;
            }
            return true;
        });

        this.enemies = this.enemies.filter(e => {
            if ((e as any).isAmmo) {
                e.y += (e as any).vy * (delta / 1000);
                e.rotation += 0.02;

                if (Phaser.Math.Distance.Between(e.x, e.y, this.sub.x, this.sub.y) < 80) {
                    this.torpedoAmmo += 5;
                    playMenuClick();
                    this.emitState();

                    const t = this.add.text(e.x, e.y, '+5 TORPEDOES', { fontFamily: 'Boogaloo', fontSize: '24px', color: '#00d4b8' }).setOrigin(0.5).setDepth(15);
                    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 1500, onComplete: () => t.destroy() });

                    e.destroy();
                    return false;
                }
                if (e.y > WORLD_H) { e.destroy(); return false; }
                return true;
            }

            const angle = Math.atan2(this.sub.y - e.y, this.sub.x - e.x);
            e.x += Math.cos(angle) * (e as any).baseSpeed * (delta / 1000);
            e.y += Math.sin(angle) * (e as any).baseSpeed * (delta / 1000);

            if (e.x > this.sub.x) e.setFlipX(true);
            else e.setFlipX(false);

            if (Phaser.Math.Distance.Between(e.x, e.y, this.sub.x, this.sub.y) < 60) {
                this.health -= (e as any).dmg || 10;
                this.explode(this.sub.x + (Math.random() - 0.5) * 40, this.sub.y, 0xff0000, 0.5);
                playSubDamage();
                e.destroy();
                this.emitState();
                return false;
            }

            if (Math.abs(e.y - this.sub.y) > 1500) {
                e.destroy();
                return false;
            }

            return true;
        });

        // The KRAKEN Update
        if (this.sub.y > WORLD_H - 1200) {  // At the abyss
            if (!this.krakenActive && !this.krakenDefeated) {
                this.krakenActive = true;
                playAlert();
                this.emitState();
            }

            if (this.krakenActive && !this.krakenDefeated) {
                this.krakenRoarTimer += delta;
                if (this.krakenRoarTimer > 5000) {
                    playKrakenRoar();
                    this.krakenRoarTimer = 0;
                    this.cameras.main.shake(500, 0.005);
                }

                const targetX = Phaser.Math.Clamp(this.sub.x, WORLD_W / 4, (WORLD_W / 4) * 3);
                this.krakenHead.x = Phaser.Math.Linear(this.krakenHead.x, targetX, 0.015); // Slowed down
                this.krakenHead.y = WORLD_H - 200 + Math.sin(time * 0.001) * 50;

                this.krakenTentacles.forEach((tent, i) => {
                    tent.tx = this.krakenHead.x + (i - 2.5) * 90;
                    tent.ty = this.krakenHead.y + 50;

                    let px = tent.tx;
                    let py = tent.ty;

                    tent.segments.forEach((seg, j) => {
                        let targetX = tent.tx + Math.sin(time * 0.002 + i) * 150;
                        let targetY = tent.ty - (200 + j * 50);

                        if (j > 4 && Math.abs(this.sub.x - px) < 400 && this.sub.y > WORLD_H - 1500) {
                            targetX = Phaser.Math.Linear(targetX, this.sub.x, 0.1); // Slowed down tentacles
                            targetY = Phaser.Math.Linear(targetY, this.sub.y, 0.1);
                        }

                        seg.x = Phaser.Math.Linear(seg.x, targetX, 0.1);
                        seg.y = Phaser.Math.Linear(seg.y, targetY, 0.1);

                        if (Phaser.Math.Distance.Between(seg.x, seg.y, this.sub.x, this.sub.y) < 40) {
                            this.health -= 0.1; // Reduced crush damage
                            if (Math.random() < 0.05) playSubDamage();
                            this.cameras.main.shake(100, 0.003);
                            this.emitState();
                        }

                        px = seg.x;
                        py = seg.y;
                    });
                });
            }
        } else {
            this.krakenActive = false;
        }

        if (this.krakenDefeated && this.sub.y > WORLD_H - 200 && Math.abs(this.sub.x - WORLD_W / 2) < 200) {
            if (this.discovered.length >= 8) {
                this.gameActive = false;
                playCaveEnter();
                this.emitState();
            } else {
                if (Math.random() < 0.05) {
                    const t = this.add.text(this.sub.x, this.sub.y - 100, 'I need all 8 creature DNA samples first!', { fontFamily: 'Boogaloo', fontSize: '24px', color: '#ff4444' }).setOrigin(0.5).setDepth(20);
                    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 2000, onComplete: () => t.destroy() });
                }
            }
        }

        const newZone = ZONES.find(z => this.sub.y >= z.yStart && this.sub.y < z.yEnd)?.name || 'The Abyss';
        if (newZone !== this.currentZone) {
            this.currentZone = newZone;
            this.showZoneFlash(newZone);
        }
    }

    private showZoneFlash(zone: string) {
        if (this.zoneLabelText) this.zoneLabelText.destroy();

        playAlert();

        this.zoneLabelText = this.add.text(
            this.cameras.main.scrollX + this.cameras.main.width / 2,
            this.cameras.main.scrollY + this.cameras.main.height / 2 - 100,
            zone.toUpperCase() + `\nThreat Level: ${this.currentWave}`,
            { fontFamily: 'Boogaloo', fontSize: '64px', color: '#00b4d8', align: 'center', stroke: '#000', strokeThickness: 8 }
        ).setOrigin(0.5).setAlpha(0).setDepth(20);

        this.tweens.add({
            targets: this.zoneLabelText,
            alpha: { from: 0, to: 1 },
            y: this.zoneLabelText.y - 50,
            duration: 1000,
            yoyo: true,
            hold: 2000,
            ease: 'Cubic.easeOut',
            onComplete: () => this.zoneLabelText?.destroy(),
        });
    }

    private discoverCreature(creature: Creature, sprite: Phaser.GameObjects.Text) {
        this.discovered.push(creature.id);
        playMenuClick();

        const g = this.add.graphics();
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(sprite.x, sprite.y, creature.radius);
        g.setDepth(8);
        this.tweens.add({
            targets: g,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 1000,
            onComplete: () => g.destroy()
        });

        const t = this.add.text(sprite.x, sprite.y - 80, `Analyzed ${creature.name}!`, {
            fontFamily: 'Boogaloo',
            fontSize: '28px',
            color: '#00d4b8',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(16);

        this.tweens.add({
            targets: t,
            y: t.y - 80,
            alpha: 0,
            duration: 3000,
            onComplete: () => t.destroy()
        });

        if (creature.id === 'shipwreck') {
            this.torpedoAmmo += 15;
        }

        this.emitState();
    }

    private defeatKraken() {
        playExplosion();
        this.cameras.main.flash(4000, 255, 0, 255); // longer flash
        this.cameras.main.shake(3000, 0.03);

        this.tweens.add({
            targets: this.krakenHead,
            y: this.krakenHead.y + 1200,
            rotation: 3,
            alpha: 0,
            duration: 8000,
            ease: 'Power2',
        });

        this.krakenTentacles.forEach(tent => {
            tent.segments.forEach((seg, i) => {
                this.tweens.add({
                    targets: seg,
                    y: seg.y + 1000 + i * 100,
                    alpha: 0,
                    duration: 5000 + Math.random() * 3000,
                });
            });
        });

        const t = this.add.text(WORLD_W / 2, WORLD_H - 200, 'CAVE UNLOCKED!', { fontFamily: 'Boogaloo', fontSize: '56px', color: '#00ff00', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: t, y: WORLD_H - 300, alpha: 0, duration: 4000, onComplete: () => t.destroy() });

        this.emitState();
    }

    resetGame() {
        this.discovered = [];
        this.journalsCollected = [];
        this.health = 100;
        this.pressure = 0;
        this.torpedoAmmo = 10;
        this.sonicPulseCharge = 100;
        this.currentWave = 1;
        this.gameActive = true;
        this.currentZone = 'Coral Reef';
        this.krakenHealth = 500;
        this.krakenActive = false;
        this.krakenDefeated = false;

        this.enemies.forEach(e => e.destroy());
        this.enemies = [];
        this.torpedoes.forEach(t => t.destroy());
        this.torpedoes = [];

        if (this.sub) {
            this.sub.setPosition(400, 300);
        }
        this.emitState();

        this.scene.restart();
    }
}

export interface GameState {
    health: number;
    pressure: number;
    discovered: string[];
    journalsCollected: string[];
    currentZone: string;
    depth: number;
    gameActive: boolean;
    leviathanHealth: number; // Reused for Kraken
    leviathanActive: boolean;
    leviathanDefeated: boolean;
    subY: number;
    worldH: number;
    torpedoAmmo: number;
    sonicPulseCharge: number;
    wave: number;
}
