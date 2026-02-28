import Phaser from 'phaser';

const GROUND_Y = 420;

export default class IntroCutscene extends Phaser.Scene {
  private onComplete?: () => void;
  private man!: Phaser.GameObjects.Container;
  private zombies: { container: Phaser.GameObjects.Container; speed: number; lastAttack: number }[] = [];
  private submarine!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private legPhase = 0;
  private health = 100;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBg!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private isBoarding = false;
  private isJumping = false;
  private velocityY = 0;
  private manBaseY = GROUND_Y - 25;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private instructionText!: Phaser.GameObjects.Text;
  private waveNum = 0;
  private waveText!: Phaser.GameObjects.Text;

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

    // City silhouette
    const city = this.add.graphics();
    city.fillStyle(0x0a0a0a, 1);
    for (let i = 0; i < 12; i++) {
      const bx = i * 70 + Math.random() * 20;
      const bh = 60 + Math.random() * 120;
      city.fillRect(bx, GROUND_Y - bh, 50 + Math.random() * 30, bh);
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
    const ocean = this.add.graphics();
    ocean.fillStyle(0x023a5c, 0.9);
    ocean.fillRect(w * 0.75, GROUND_Y + 20, w * 0.3, h - GROUND_Y);
    ocean.fillStyle(0x01111f, 0.7);
    ocean.fillRect(w * 0.75, GROUND_Y + 60, w * 0.3, h - GROUND_Y - 40);
    ocean.lineStyle(2, 0x87ceeb, 0.4);
    for (let x = w * 0.75; x < w; x += 20) {
      ocean.lineBetween(x, GROUND_Y + 20, x + 10, GROUND_Y + 20);
    }

    // Bank slope
    const bank = this.add.graphics();
    bank.fillStyle(0x2d2d1e, 1);
    bank.fillTriangle(w * 0.7, GROUND_Y, w * 0.82, GROUND_Y + 60, w * 0.7, GROUND_Y + 60);

    // Submarine
    this.submarine = this.createSubmarine();
    this.submarine.setPosition(w * 0.88, GROUND_Y + 40);
    this.submarine.setDepth(5);

    // Man (player controlled)
    this.man = this.createMan();
    this.man.setPosition(w * 0.15, GROUND_Y - 25);
    this.man.setDepth(6);

    // HUD - health bar
    this.healthBg = this.add.graphics().setDepth(10).setScrollFactor(0);
    this.healthBar = this.add.graphics().setDepth(10).setScrollFactor(0);
    this.healthText = this.add.text(w / 2, 16, '❤️ 100', {
      fontFamily: 'Boogaloo', fontSize: '18px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
    this.drawHealthBar();

    // Narrative
    this.add.text(w / 2, 50, '🧟 SURVIVE THE APOCALYPSE!', {
      fontFamily: 'Boogaloo', fontSize: '22px', color: '#ff4444', align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.9);

    // Instructions
    this.instructionText = this.add.text(w / 2, h - 30, '⬅️ ➡️ MOVE  |  ⬆️ JUMP  |  REACH THE SUBMARINE ➡️🚢', {
      fontFamily: 'Quicksand', fontSize: '13px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.7);

    // Wave text
    this.waveText = this.add.text(w / 2, 80, '', {
      fontFamily: 'Boogaloo', fontSize: '28px', color: '#ff6644',
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D'),
    };

    // Spawn initial zombies
    this.spawnWave();

    // Spawn waves periodically
    this.spawnTimer = this.time.addEvent({
      delay: 6000,
      callback: () => this.spawnWave(),
      loop: true,
    });
  }

  private spawnWave() {
    this.waveNum++;
    const count = Math.min(2 + this.waveNum, 8);
    const w = this.cameras.main.width;

    // Show wave text
    this.waveText.setText(`WAVE ${this.waveNum}`).setAlpha(1);
    this.tweens.add({ targets: this.waveText, alpha: 0, duration: 2000, delay: 500 });

    for (let i = 0; i < count; i++) {
      const fromLeft = Math.random() > 0.3;
      const xPos = fromLeft ? -40 - i * 60 : w + 40 + i * 60;
      const speed = 60 + Math.random() * 40 + this.waveNum * 8;
      const z = this.createZombie();
      z.setPosition(xPos, GROUND_Y - 25);
      z.setDepth(4);
      this.zombies.push({ container: z, speed, lastAttack: 0 });
    }
  }

  private drawHealthBar() {
    const w = this.cameras.main.width;
    const barW = 160;
    const barH = 14;
    const x = w / 2 - barW / 2;
    const y = 6;

    this.healthBg.clear();
    this.healthBg.fillStyle(0x000000, 0.5);
    this.healthBg.fillRoundedRect(x - 2, y - 2, barW + 4, barH + 4, 6);

    this.healthBar.clear();
    const frac = Math.max(0, this.health / 100);
    const color = frac > 0.5 ? 0x44ff44 : frac > 0.25 ? 0xffaa00 : 0xff3333;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRoundedRect(x, y, barW * frac, barH, 5);

    this.healthText.setText(`❤️ ${Math.ceil(this.health)}`);
  }

  private createMan(): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();

    g.fillStyle(0x3498db, 1);
    g.fillRoundedRect(-8, -20, 16, 22, 3);
    g.fillStyle(0xf5c6a0, 1);
    g.fillCircle(0, -28, 10);
    g.fillStyle(0x4a3728, 1);
    g.fillRoundedRect(-8, -38, 16, 8, 3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-4, -30, 3);
    g.fillCircle(4, -30, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(-3, -30, 1.5);
    g.fillCircle(5, -30, 1.5);
    g.fillStyle(0x000000, 0.8);
    g.fillEllipse(0, -22, 6, 4);
    g.fillStyle(0x2c3e50, 1);
    g.fillRect(-8, 2, 7, 14);
    g.fillRect(1, 2, 7, 14);
    g.fillStyle(0xf5c6a0, 1);
    g.fillRect(-14, -18, 6, 3);
    g.fillRect(8, -18, 6, 3);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(-9, 14, 8, 5, 2);
    g.fillRoundedRect(1, 14, 8, 5, 2);

    c.add(g);
    return c;
  }

  private createZombie(): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();

    g.fillStyle(0x556b2f, 0.9);
    g.fillRoundedRect(-8, -20, 16, 22, 3);
    g.fillStyle(0x3d4f22, 1);
    g.fillRect(-6, -10, 4, 8);
    g.fillStyle(0x7a9a4a, 1);
    g.fillCircle(0, -28, 10);
    g.fillStyle(0xff0000, 0.8);
    g.fillCircle(-4, -30, 3);
    g.fillCircle(4, -30, 3);
    g.fillStyle(0x3d0000, 1);
    g.fillRect(-5, -22, 10, 3);
    g.fillStyle(0x7a9a4a, 0.9);
    g.fillRect(8, -20, 14, 4);
    g.fillRect(8, -14, 14, 4);
    g.fillStyle(0x2c2c1e, 1);
    g.fillRect(-8, 2, 7, 14);
    g.fillRect(1, 2, 7, 14);

    c.add(g);
    return c;
  }

  private createSubmarine(): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();

    g.fillStyle(0xf5a623, 1);
    g.fillEllipse(0, 0, 80, 35);
    g.fillStyle(0xe8951d, 1);
    g.fillEllipse(0, -5, 70, 15);
    g.fillStyle(0xf5a623, 1);
    g.fillRoundedRect(-12, -25, 24, 16, 4);
    g.fillStyle(0x95a5a6, 1);
    g.fillRect(-1, -35, 3, 12);

    [-15, 0, 15].forEach(px => {
      g.fillStyle(0x4a90d9, 1);
      g.fillCircle(px, 0, 5);
      g.fillStyle(0x87ceeb, 0.5);
      g.fillCircle(px, -1, 2);
    });

    g.fillStyle(0xd4891a, 1);
    g.fillRect(-10, -27, 20, 3);

    c.add(g);

    // Blinking arrow
    const arrow = this.add.text(0, -50, '⬇️ GET IN!', {
      fontFamily: 'Boogaloo', fontSize: '12px', color: '#ffd166',
    }).setOrigin(0.5);
    c.add(arrow);
    this.tweens.add({ targets: arrow, y: -45, duration: 500, yoyo: true, repeat: -1 });

    return c;
  }

  update(time: number, delta: number) {
    if (this.isBoarding || this.health <= 0) return;

    const w = this.cameras.main.width;
    this.legPhase += delta * 0.01;
    const dt = delta / 1000;

    // Player movement
    const speed = 4;
    let moveX = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) moveX = -speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) moveX = speed;

    const wantJump = this.cursors.up.isDown || this.wasd.W.isDown;

    this.man.x += moveX;
    this.man.x = Phaser.Math.Clamp(this.man.x, 20, w - 20);

    // Flip direction
    if (moveX > 0) this.man.scaleX = 1;
    else if (moveX < 0) this.man.scaleX = -1;

    // Gravity-based jump
    if (!this.isJumping && wantJump) {
      this.isJumping = true;
      this.velocityY = -420;
    }

    if (this.isJumping) {
      // Apply gravity
      this.velocityY += 900 * dt;
      this.man.y += this.velocityY * dt;

      // Land on ground
      if (this.man.y >= this.manBaseY) {
        this.man.y = this.manBaseY;
        this.isJumping = false;
        this.velocityY = 0;
      }
    } else {
      // Running bob only when on ground
      if (moveX !== 0) {
        this.man.y = this.manBaseY + Math.sin(this.legPhase * 4) * 3;
      } else {
        this.man.y = this.manBaseY;
      }
    }

    // Zombie AI
    for (const z of this.zombies) {
      const dx = this.man.x - z.container.x;
      const dir = dx > 0 ? 1 : -1;
      z.container.x += dir * z.speed * dt;
      z.container.y = GROUND_Y - 25 + Math.sin(this.legPhase * 2 + z.speed) * 2;
      z.container.scaleX = dir;

      // Collision — check x distance and whether player is near ground level
      const xDist = Math.abs(this.man.x - z.container.x);
      const yDist = Math.abs(this.man.y - z.container.y);
      if (xDist < 25 && yDist < 35 && time - z.lastAttack > 800) {
        z.lastAttack = time;
        this.health -= 8;
        this.drawHealthBar();
        this.cameras.main.flash(150, 255, 0, 0, false);

        const kb = this.man.x > z.container.x ? 30 : -30;
        this.tweens.add({ targets: this.man, x: this.man.x + kb, duration: 100 });

        if (this.health <= 0) {
          this.health = 0;
          this.drawHealthBar();
          this.gameOver();
          return;
        }
      }
    }

    // Check submarine reach — use x-distance only since sub is in the water below
    const xToSub = Math.abs(this.man.x - this.submarine.x);
    if (xToSub < 50) {
      this.boardSubmarine();
    }
  }

  private boardSubmarine() {
    this.isBoarding = true;
    this.spawnTimer.remove();
    this.instructionText.setText('🚢 BOARDING SUBMARINE...');

    // Man jumps into sub
    this.tweens.add({
      targets: this.man,
      x: this.submarine.x,
      y: this.submarine.y - 30,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.man,
          y: this.submarine.y - 10,
          scaleX: 0.5, scaleY: 0.5, alpha: 0,
          duration: 400,
          onComplete: () => {
            // Sub dives
            this.tweens.add({
              targets: this.submarine,
              y: this.submarine.y + 200,
              alpha: 0,
              duration: 1800,
              ease: 'Quad.easeIn',
              onComplete: () => {
                this.time.delayedCall(400, () => this.endCutscene());
              },
            });

            // Bubbles
            this.time.addEvent({
              delay: 200, repeat: 6,
              callback: () => {
                const b = this.add.graphics();
                b.fillStyle(0x87ceeb, 0.5);
                b.fillCircle(0, 0, 3 + Math.random() * 3);
                b.setPosition(this.submarine.x + (Math.random() - 0.5) * 30, this.submarine.y - 10);
                this.tweens.add({ targets: b, y: b.y - 40, alpha: 0, duration: 800, onComplete: () => b.destroy() });
              },
            });

            // Zombies stop at water
            const w = this.cameras.main.width;
            this.zombies.forEach((z, i) => {
              this.tweens.add({ targets: z.container, x: w * 0.68 - i * 25, duration: 1000, ease: 'Quad.easeOut' });
            });
          },
        });
      },
    });
  }

  private gameOver() {
    this.spawnTimer.remove();

    // Man falls
    this.tweens.add({ targets: this.man, angle: 90, alpha: 0.3, duration: 600 });

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Game over overlay
    const overlay = this.add.graphics().setDepth(20);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, w, h);

    this.add.text(w / 2, h / 2 - 30, '💀 YOU DIED', {
      fontFamily: 'Boogaloo', fontSize: '36px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(21);

    const retry = this.add.text(w / 2, h / 2 + 20, '🔄 CLICK TO RETRY', {
      fontFamily: 'Boogaloo', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: retry, alpha: { from: 0.5, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

    retry.on('pointerdown', () => {
      this.health = 100;
      this.zombies.forEach(z => z.container.destroy());
      this.zombies = [];
      this.waveNum = 0;
      this.isBoarding = false;
      this.scene.restart();
    });
  }

  private endCutscene() {
    if (this.onComplete) {
      const cb = this.onComplete;
      this.onComplete = undefined;
      cb();
    }
  }
}
