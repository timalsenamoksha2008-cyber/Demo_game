import Phaser from 'phaser';

const GROUND_Y = 420;
const SCENE_WIDTH = 800;
const SCENE_HEIGHT = 500;

export default class IntroCutscene extends Phaser.Scene {
  private onComplete?: () => void;
  private man!: Phaser.GameObjects.Container;
  private zombies: Phaser.GameObjects.Container[] = [];
  private submarine!: Phaser.GameObjects.Container;
  private phase: 'running' | 'boarding' | 'diving' = 'running';
  private manX = -60;
  private legPhase = 0;
  private ocean!: Phaser.GameObjects.Graphics;
  private skipText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'IntroCutscene' });
  }

  setCompleteCallback(cb: () => void) {
    this.onComplete = cb;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Sky
    const sky = this.add.graphics();
    sky.fillStyle(0x1a1a2e, 1);
    sky.fillRect(0, 0, w, h);
    // Red apocalyptic sky
    sky.fillStyle(0x3d0000, 0.6);
    sky.fillRect(0, 0, w, h * 0.4);
    sky.fillStyle(0x1a0000, 0.4);
    sky.fillRect(0, h * 0.3, w, h * 0.2);

    // Moon
    const moon = this.add.graphics();
    moon.fillStyle(0xddddaa, 0.8);
    moon.fillCircle(w * 0.75, 60, 30);
    moon.fillStyle(0x1a1a2e, 0.8);
    moon.fillCircle(w * 0.75 + 8, 55, 28);

    // City silhouette (burning)
    const city = this.add.graphics();
    city.fillStyle(0x0a0a0a, 1);
    for (let i = 0; i < 12; i++) {
      const bx = i * 70 + Math.random() * 20;
      const bh = 60 + Math.random() * 120;
      city.fillRect(bx, GROUND_Y - bh, 50 + Math.random() * 30, bh);
      // Fire glow on some buildings
      if (Math.random() > 0.5) {
        city.fillStyle(0xff4400, 0.3);
        city.fillRect(bx + 5, GROUND_Y - bh, 15, 20);
        city.fillStyle(0x0a0a0a, 1);
      }
    }

    // Ground
    const ground = this.add.graphics();
    ground.fillStyle(0x2d2d1e, 1);
    ground.fillRect(0, GROUND_Y, w, h - GROUND_Y);
    ground.fillStyle(0x3a3a28, 0.6);
    ground.fillRect(0, GROUND_Y, w, 4);

    // Ocean (right side)
    this.ocean = this.add.graphics();
    this.drawOcean(w, h);

    // Ocean bank slope
    const bank = this.add.graphics();
    bank.fillStyle(0x2d2d1e, 1);
    bank.fillTriangle(w * 0.6, GROUND_Y, w * 0.75, GROUND_Y + 60, w * 0.6, GROUND_Y + 60);

    // Submarine in water
    this.submarine = this.createSubmarine();
    this.submarine.setPosition(w * 0.82, GROUND_Y + 40);
    this.submarine.setDepth(5);

    // Man character
    this.man = this.createMan();
    this.man.setPosition(this.manX, GROUND_Y - 25);
    this.man.setDepth(6);

    // Zombies
    for (let i = 0; i < 4; i++) {
      const z = this.createZombie();
      z.setPosition(-150 - i * 100, GROUND_Y - 25);
      z.setDepth(4);
      this.zombies.push(z);
    }

    // Narrative text
    const narText = this.add.text(w / 2, 30, '🧟 THE APOCALYPSE HAS BEGUN...', {
      fontFamily: 'Boogaloo',
      fontSize: '24px',
      color: '#ff4444',
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: narText,
      alpha: { from: 0, to: 1 },
      duration: 1500,
    });

    // Second narrative after delay
    this.time.delayedCall(2000, () => {
      narText.setText('🌊 ESCAPE TO THE DEEP...');
      narText.setColor('#00d4b8');
    });

    // Skip button
    this.skipText = this.add.text(w - 20, h - 20, 'PRESS SPACE TO SKIP ▶', {
      fontFamily: 'Quicksand',
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(1).setAlpha(0.5).setDepth(10);

    this.tweens.add({
      targets: this.skipText,
      alpha: { from: 0.3, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.endCutscene();
    });

    // Click to skip too
    this.input.on('pointerdown', () => {
      this.endCutscene();
    });
  }

  private drawOcean(w: number, h: number) {
    this.ocean.fillStyle(0x023a5c, 0.9);
    this.ocean.fillRect(w * 0.65, GROUND_Y + 20, w * 0.4, h - GROUND_Y);
    this.ocean.fillStyle(0x01111f, 0.7);
    this.ocean.fillRect(w * 0.65, GROUND_Y + 60, w * 0.4, h - GROUND_Y - 40);
    // Water surface shimmer
    this.ocean.lineStyle(2, 0x87ceeb, 0.4);
    for (let x = w * 0.65; x < w; x += 20) {
      this.ocean.lineBetween(x, GROUND_Y + 20, x + 10, GROUND_Y + 20);
    }
  }

  private createMan(): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();

    // Body (blue shirt)
    g.fillStyle(0x3498db, 1);
    g.fillRoundedRect(-8, -20, 16, 22, 3);

    // Head
    g.fillStyle(0xf5c6a0, 1);
    g.fillCircle(0, -28, 10);

    // Hair
    g.fillStyle(0x4a3728, 1);
    g.fillRoundedRect(-8, -38, 16, 8, 3);

    // Eyes (scared)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-4, -30, 3);
    g.fillCircle(4, -30, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(-3, -30, 1.5);
    g.fillCircle(5, -30, 1.5);

    // Mouth (open, scared)
    g.fillStyle(0x000000, 0.8);
    g.fillEllipse(0, -22, 6, 4);

    // Pants
    g.fillStyle(0x2c3e50, 1);
    g.fillRect(-8, 2, 7, 14);
    g.fillRect(1, 2, 7, 14);

    // Arms
    g.fillStyle(0xf5c6a0, 1);
    g.fillRect(-14, -18, 6, 3);
    g.fillRect(8, -18, 6, 3);

    // Shoes
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(-9, 14, 8, 5, 2);
    g.fillRoundedRect(1, 14, 8, 5, 2);

    c.add(g);

    // Sweat drop
    const sweat = this.add.text(10, -35, '💧', { fontSize: '10px' });
    c.add(sweat);
    this.tweens.add({
      targets: sweat,
      y: -40,
      alpha: { from: 1, to: 0 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    return c;
  }

  private createZombie(): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();

    // Body (torn clothes)
    g.fillStyle(0x556b2f, 0.9);
    g.fillRoundedRect(-8, -20, 16, 22, 3);
    // Tear marks
    g.fillStyle(0x3d4f22, 1);
    g.fillRect(-6, -10, 4, 8);

    // Head (green)
    g.fillStyle(0x7a9a4a, 1);
    g.fillCircle(0, -28, 10);

    // Eyes (red)
    g.fillStyle(0xff0000, 0.8);
    g.fillCircle(-4, -30, 3);
    g.fillCircle(4, -30, 3);

    // Mouth
    g.fillStyle(0x3d0000, 1);
    g.fillRect(-5, -22, 10, 3);

    // Arms (stretched forward)
    g.fillStyle(0x7a9a4a, 0.9);
    g.fillRect(8, -20, 14, 4);
    g.fillRect(8, -14, 14, 4);

    // Pants
    g.fillStyle(0x2c2c1e, 1);
    g.fillRect(-8, 2, 7, 14);
    g.fillRect(1, 2, 7, 14);

    c.add(g);
    return c;
  }

  private createSubmarine(): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();

    // Hull
    g.fillStyle(0xf5a623, 1);
    g.fillEllipse(0, 0, 80, 35);
    g.fillStyle(0xe8951d, 1);
    g.fillEllipse(0, -5, 70, 15);

    // Conning tower
    g.fillStyle(0xf5a623, 1);
    g.fillRoundedRect(-12, -25, 24, 16, 4);

    // Periscope
    g.fillStyle(0x95a5a6, 1);
    g.fillRect(-1, -35, 3, 12);

    // Portholes
    [-15, 0, 15].forEach(px => {
      g.fillStyle(0x4a90d9, 1);
      g.fillCircle(px, 0, 5);
      g.fillStyle(0x87ceeb, 0.5);
      g.fillCircle(px, -1, 2);
    });

    // Hatch (open)
    g.fillStyle(0xd4891a, 1);
    g.fillRect(-10, -27, 20, 3);

    c.add(g);

    // Open hatch indicator
    const arrow = this.add.text(0, -45, '⬇', { fontSize: '14px' }).setOrigin(0.5);
    c.add(arrow);
    this.tweens.add({ targets: arrow, y: -40, duration: 500, yoyo: true, repeat: -1 });

    return c;
  }

  update(time: number, delta: number) {
    const w = this.cameras.main.width;
    this.legPhase += delta * 0.01;

    if (this.phase === 'running') {
      // Man runs to the right
      this.manX += 2.5;
      this.man.setPosition(this.manX, GROUND_Y - 25);

      // Bob up and down while running
      this.man.y += Math.sin(this.legPhase * 3) * 1.5;

      // Zombies chase
      this.zombies.forEach((z, i) => {
        z.x += 1.5 - i * 0.15;
        z.y = GROUND_Y - 25 + Math.sin(this.legPhase * 2 + i) * 2;
      });

      // Reach the submarine
      if (this.manX >= w * 0.78) {
        this.phase = 'boarding';
        // Man jumps onto sub
        this.tweens.add({
          targets: this.man,
          x: this.submarine.x,
          y: this.submarine.y - 30,
          duration: 600,
          ease: 'Quad.easeOut',
          onComplete: () => {
            // Man disappears into sub
            this.tweens.add({
              targets: this.man,
              y: this.submarine.y - 10,
              scaleX: 0.5,
              scaleY: 0.5,
              alpha: 0,
              duration: 400,
              onComplete: () => {
                this.phase = 'diving';
                // Submarine dives
                this.tweens.add({
                  targets: this.submarine,
                  y: this.submarine.y + 200,
                  x: this.submarine.x + 50,
                  alpha: 0,
                  duration: 2000,
                  ease: 'Quad.easeIn',
                  onComplete: () => {
                    this.time.delayedCall(500, () => this.endCutscene());
                  },
                });

                // Bubbles from sub
                this.time.addEvent({
                  delay: 200,
                  repeat: 8,
                  callback: () => {
                    const b = this.add.graphics();
                    b.fillStyle(0x87ceeb, 0.5);
                    b.fillCircle(0, 0, 3 + Math.random() * 3);
                    b.setPosition(
                      this.submarine.x + (Math.random() - 0.5) * 30,
                      this.submarine.y - 10
                    );
                    this.tweens.add({
                      targets: b,
                      y: b.y - 40,
                      alpha: 0,
                      duration: 800,
                      onComplete: () => b.destroy(),
                    });
                  },
                });
              },
            });
          },
        });

        // Zombies stop at water edge and groan
        this.zombies.forEach((z, i) => {
          this.tweens.add({
            targets: z,
            x: w * 0.62 - i * 30,
            duration: 1000,
            ease: 'Quad.easeOut',
          });
        });
      }
    }
  }

  private endCutscene() {
    if (this.onComplete) {
      const cb = this.onComplete;
      this.onComplete = undefined;
      cb();
    }
  }
}
