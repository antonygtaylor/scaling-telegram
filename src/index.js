import { Mulberry32, PerlinNoise } from './utils/prng.js';
import { LevelGenerator } from './game/campaign.js';
import { Terrain } from './game/terrain.js';
import { ParallaxBackground } from './game/parallax.js';
import { Tank } from './game/tank.js';
import { Projectile } from './game/physics.js';
import { ScoringEngine } from './game/scoring.js';
import { AIController } from './game/ai.js';
import { SoundEngine } from './utils/sound.js';
import { ParticleSystem } from './utils/particles.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.worldWidth = 2400;
    this.worldHeight = 900;

    this.cameraX = 0;
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    this.currentLevel = 1;
    this.maxUnlockedLevel = parseInt(localStorage.getItem('rust_iron_unlocked') || '1', 10);
    this.highScores = JSON.parse(localStorage.getItem('rust_iron_scores') || '{}');

    this.gameState = 'MENU'; // 'MENU', 'BRIEFING', 'PLAYING', 'OUTRO', 'PAUSED'
    this.soundEngine = new SoundEngine();
    this.particles = new ParticleSystem();
    this.scoringEngine = new ScoringEngine();

    this.tanks = [];
    this.activeTurnIndex = 0;
    this.activeProjectile = null;
    this.wind = 0;
    this.aiTimeout = null;

    // Power charging state
    this.isChargingPower = false;
    this.powerCharge = 10;
    this.powerDirection = 1;

    // Screen Shake & Camera Tracking
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;

    // Touch Panning state
    this.isTouchPanning = false;
    this.touchStartX = 0;
    this.panStartCameraX = 0;

    this.initCanvasScaling();
    this.bindUI();
    this.updateProgressBadge();
    this.registerServiceWorker();

    window.addEventListener('resize', () => this.initCanvasScaling());
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('ServiceWorker registered with scope:', reg.scope))
          .catch((err) => console.warn('ServiceWorker registration failed:', err));
      });
    }
  }

  initCanvasScaling() {
    const dpr = window.devicePixelRatio || 1;
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    this.canvas.width = this.viewportWidth * dpr;
    this.canvas.height = this.viewportHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  bindUI() {
    // Menu Buttons
    document.getElementById('btn-campaign-start').addEventListener('click', () => {
      this.showBriefing(this.maxUnlockedLevel);
    });

    document.getElementById('btn-level-select').addEventListener('click', () => {
      this.renderSectorGrid();
      this.showScreen('screen-sector-select');
    });

    document.getElementById('btn-back-menu').addEventListener('click', () => {
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-audio-toggle').addEventListener('click', (e) => {
      const enabled = this.soundEngine.toggleSound();
      e.target.innerText = `SOUND: ${enabled ? 'ON' : 'OFF'}`;
    });

    // Briefing Modal launch
    document.getElementById('btn-launch-sector').addEventListener('click', () => {
      this.startSector(this.currentLevel);
    });

    // Angle controls
    document.getElementById('btn-angle-down').addEventListener('click', () => {
      const player = this.getPlayerTank();
      if (player && this.isPlayerTurn()) {
        player.angle = Math.max(0, player.angle - 2);
        this.updateHUD();
      }
    });

    document.getElementById('btn-angle-up').addEventListener('click', () => {
      const player = this.getPlayerTank();
      if (player && this.isPlayerTurn()) {
        player.angle = Math.min(180, player.angle + 2);
        this.updateHUD();
      }
    });

    // Hold to charge FIRE button (touch & mouse)
    const btnFire = document.getElementById('btn-fire');
    const startCharge = (e) => {
      e.preventDefault();
      if (this.isPlayerTurn() && !this.activeProjectile && !this.isChargingPower) {
        this.soundEngine.init();
        this.isChargingPower = true;
        this.powerCharge = 10;
        this.powerDirection = 1;
      }
    };

    const stopCharge = (e) => {
      if (e) e.preventDefault();
      if (this.isChargingPower) {
        this.isChargingPower = false;
        this.firePlayerCannon();
      }
    };

    btnFire.addEventListener('mousedown', startCharge);
    btnFire.addEventListener('mouseup', stopCharge);
    btnFire.addEventListener('touchstart', startCharge, { passive: false });
    btnFire.addEventListener('touchend', stopCharge, { passive: false });

    // Pause Menu
    document.getElementById('btn-pause').addEventListener('click', () => {
      this.showScreen('modal-pause');
      this.gameState = 'PAUSED';
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      document.getElementById('modal-pause').classList.add('hidden');
      this.gameState = 'PLAYING';
    });

    document.getElementById('btn-restart-sector').addEventListener('click', () => {
      document.getElementById('modal-pause').classList.add('hidden');
      this.startSector(this.currentLevel);
    });

    document.getElementById('btn-quit-main').addEventListener('click', () => {
      if (this.aiTimeout) clearTimeout(this.aiTimeout);
      document.getElementById('modal-pause').classList.add('hidden');
      document.getElementById('hud-top').classList.add('hidden');
      document.getElementById('hud-bottom').classList.add('hidden');
      this.showScreen('screen-main-menu');
      this.gameState = 'MENU';
    });

    // Outro actions
    document.getElementById('btn-retry-sector').addEventListener('click', () => {
      document.getElementById('modal-outro').classList.add('hidden');
      this.startSector(this.currentLevel);
    });

    document.getElementById('btn-next-sector').addEventListener('click', () => {
      document.getElementById('modal-outro').classList.add('hidden');
      if (this.currentLevel < 100) {
        this.showBriefing(this.currentLevel + 1);
      } else {
        this.showScreen('screen-main-menu');
      }
    });

    // Canvas Touch Drag for Aiming Handle / Horizontal Panning
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleTouchEnd());
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');
  }

  updateProgressBadge() {
    document.getElementById('text-unlocked-sector').innerText = this.maxUnlockedLevel;
  }

  renderSectorGrid() {
    const grid = document.getElementById('sector-grid');
    grid.innerHTML = '';

    for (let l = 1; l <= 100; l++) {
      const btn = document.createElement('button');
      btn.className = 'sector-btn';
      btn.innerText = l;

      if (l <= this.maxUnlockedLevel) {
        btn.classList.add('unlocked');
        if (this.highScores[l]) {
          btn.classList.add('completed');
        }
        btn.addEventListener('click', () => {
          this.showBriefing(l);
        });
      } else {
        btn.disabled = true;
      }
      grid.appendChild(btn);
    }
  }

  showBriefing(levelId) {
    this.currentLevel = levelId;
    this.levelConfig = LevelGenerator.getLevelConfig(levelId);

    document.getElementById('briefing-theater-name').innerText = this.levelConfig.theater.name.toUpperCase();
    document.getElementById('briefing-title').innerText = `SECTOR ${String(levelId).padStart(3, '0')} BRIEFING`;
    document.getElementById('briefing-lore').innerText = this.levelConfig.briefingText;
    document.getElementById('briefing-enemies-count').innerText = this.levelConfig.enemyCount;
    document.getElementById('briefing-ai-tier').innerText = this.levelConfig.aiTier;

    this.showScreen('modal-briefing');
    this.gameState = 'BRIEFING';
  }

  startSector(levelId) {
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    this.currentLevel = levelId;
    this.levelConfig = LevelGenerator.getLevelConfig(levelId);

    // Initialize PRNG & Noise with Level Seed
    this.prng = new Mulberry32(this.levelConfig.seed);
    this.perlin = new PerlinNoise(this.prng);

    // Build Terrain & Parallax
    this.terrain = new Terrain(this.worldWidth, this.worldHeight, this.prng, this.perlin, this.levelConfig.theater.theme);
    this.parallax = new ParallaxBackground(this.worldWidth, this.worldHeight, this.prng, this.perlin, this.levelConfig.theater.theme);

    // Spawn Tanks
    this.tanks = [];
    // Spawn Player Tank on left side
    const playerX = this.prng.nextInt(150, 400);
    const playerY = this.terrain.getHeightAt(playerX) - 9;
    const playerTank = new Tank(0, true, playerX, playerY, 'COMMANDER', this.levelConfig.theater.theme.tankPlayer);
    this.tanks.push(playerTank);

    // Spawn Enemy Tanks spread across world
    const spacing = (this.worldWidth - 600) / this.levelConfig.enemyCount;
    for (let i = 0; i < this.levelConfig.enemyCount; i++) {
      const minX = 550 + i * spacing;
      const maxX = minX + spacing - 50;
      const enemyX = this.prng.nextInt(minX, maxX);
      const enemyY = this.terrain.getHeightAt(enemyX) - 9;
      const enemyTank = new Tank(i + 1, false, enemyX, enemyY, `HOSTILE 0${i + 1}`, this.levelConfig.theater.theme.tankEnemy);
      this.tanks.push(enemyTank);
    }

    // Reset Turn & Scoring
    this.activeTurnIndex = 0;
    this.scoringEngine.reset();
    this.wind = Math.round(this.prng.nextRange(-10, 10));

    // Center camera on Player
    this.cameraX = Math.max(0, Math.min(this.worldWidth - this.viewportWidth, playerX - this.viewportWidth / 2));

    // Show HUD
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('hud-top').classList.remove('hidden');
    document.getElementById('hud-bottom').classList.remove('hidden');

    this.updateHUD();
    this.gameState = 'PLAYING';
  }

  getPlayerTank() {
    return this.tanks.find(t => t.isPlayer);
  }

  getActiveTank() {
    return this.tanks[this.activeTurnIndex];
  }

  isPlayerTurn() {
    const active = this.getActiveTank();
    return active && active.isPlayer && active.isAlive && !this.activeProjectile;
  }

  firePlayerCannon() {
    const player = this.getPlayerTank();
    if (!player || !this.isPlayerTurn()) return;

    player.power = Math.round(this.powerCharge);
    this.activeProjectile = new Projectile(
      player.x,
      player.y - 10,
      player.angle,
      player.power,
      this.wind,
      player.id
    );

    this.scoringEngine.recordShot();
    this.soundEngine.playCannonFire();
    this.triggerHaptic(50);
  }

  executeAITurn() {
    const aiTank = this.getActiveTank();
    if (!aiTank || aiTank.isPlayer || !aiTank.isAlive) {
      this.nextTurn();
      return;
    }

    // Center camera on AI tank
    this.cameraX = Math.max(0, Math.min(this.worldWidth - this.viewportWidth, aiTank.x - this.viewportWidth / 2));

    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    this.aiTimeout = setTimeout(() => {
      if (this.gameState !== 'PLAYING') return;
      const decision = AIController.calculateTurn(aiTank, this.tanks, this.terrain, this.levelConfig, this.worldWidth);
      aiTank.angle = decision.angle;
      aiTank.power = decision.power;

      this.activeProjectile = new Projectile(
        aiTank.x,
        aiTank.y - 10,
        aiTank.angle,
        aiTank.power,
        this.wind,
        aiTank.id
      );

      this.soundEngine.playCannonFire();
    }, 800);
  }

  nextTurn() {
    this.activeProjectile = null;

    // Check Sector Win / Defeat Conditions
    const player = this.getPlayerTank();
    const aliveEnemies = this.tanks.filter(t => !t.isPlayer && t.isAlive);

    if (!player || !player.isAlive) {
      this.showOutro(false);
      return;
    }

    if (aliveEnemies.length === 0) {
      this.showOutro(true);
      return;
    }

    // Cycle turn queue to next alive tank
    let safetyCounter = 0;
    do {
      this.activeTurnIndex = (this.activeTurnIndex + 1) % this.tanks.length;
      safetyCounter++;
    } while (!this.tanks[this.activeTurnIndex].isAlive && safetyCounter < this.tanks.length);

    // Randomize wind variance each turn
    this.wind = Math.round(this.wind * 0.5 + this.prng.nextRange(-6, 6));

    this.updateHUD();

    if (!this.isPlayerTurn()) {
      this.executeAITurn();
    }
  }

  triggerHaptic(ms = 50) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  triggerScreenShake(duration = 20, intensity = 8) {
    this.screenShakeTime = duration;
    this.screenShakeIntensity = intensity;
  }

  showOutro(isVictory) {
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    this.gameState = 'OUTRO';
    document.getElementById('hud-top').classList.add('hidden');
    document.getElementById('hud-bottom').classList.add('hidden');

    const summary = this.scoringEngine.getSummary();

    const titleEl = document.getElementById('outro-status-title');
    titleEl.innerText = isVictory ? 'SECTOR CLEARED' : 'SECTOR FAILED';
    titleEl.style.color = isVictory ? '#4caf50' : '#f44336';

    document.getElementById('outro-grade').innerText = isVictory ? summary.grade : 'F';
    document.getElementById('outro-base-score').innerText = summary.baseScore;
    document.getElementById('outro-shots-hits').innerText = `${summary.totalShots} / ${summary.totalHits}`;
    document.getElementById('outro-accuracy').innerText = `${summary.accuracy}%`;
    document.getElementById('outro-env-kills').innerText = summary.environmentalKills;
    document.getElementById('outro-total-score').innerText = isVictory ? summary.finalScore : 0;

    if (isVictory) {
      this.soundEngine.playVictory();
      // Unlock next level
      if (this.currentLevel >= this.maxUnlockedLevel && this.currentLevel < 100) {
        this.maxUnlockedLevel = this.currentLevel + 1;
        localStorage.setItem('rust_iron_unlocked', this.maxUnlockedLevel.toString());
      }
      // Save high score
      const prevScore = this.highScores[this.currentLevel] || 0;
      if (summary.finalScore > prevScore) {
        this.highScores[this.currentLevel] = summary.finalScore;
        localStorage.setItem('rust_iron_scores', JSON.stringify(this.highScores));
      }
      this.updateProgressBadge();
    }

    this.showScreen('modal-outro');
  }

  updateHUD() {
    document.getElementById('hud-sector-title').innerText = String(this.currentLevel).padStart(3, '0');

    const active = this.getActiveTank();
    const turnEl = document.getElementById('hud-turn-indicator');
    if (active) {
      turnEl.innerText = active.isPlayer ? 'PLAYER' : active.name;
      turnEl.className = active.isPlayer ? 'hud-value badge-player' : 'hud-value badge-ai';
    }

    // Wind indicator
    const windSpeed = Math.abs(this.wind);
    document.getElementById('hud-wind-speed').innerText = windSpeed;
    const arrow = document.getElementById('hud-wind-arrow');
    arrow.style.transform = this.wind >= 0 ? 'rotate(0deg)' : 'rotate(180deg)';

    // Score
    document.getElementById('hud-score').innerText = this.scoringEngine.score;

    // Player Tank Stats
    const player = this.getPlayerTank();
    if (player) {
      const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
      document.getElementById('hud-hp-bar').style.width = `${hpPercent}%`;
      document.getElementById('hud-hp-text').innerText = `${player.hp}/${player.maxHp}`;
      document.getElementById('hud-angle-val').innerText = `${player.angle}°`;
      document.getElementById('hud-power-val').innerText = `${Math.round(player.power)}%`;
    }
  }

  // Touch & Mouse Handlers for Camera Panning and Aim Dragging
  handleTouchStart(e) {
    if (this.gameState !== 'PLAYING') return;
    const touch = e.touches ? e.touches[0] : e;
    const player = this.getPlayerTank();

    // Check if dragging near player tank to adjust angle handle
    if (player && this.isPlayerTurn()) {
      const playerCanvasX = player.x - this.cameraX;
      const dx = touch.clientX - playerCanvasX;
      const dy = touch.clientY - player.y;

      if (Math.hypot(dx, dy) < 80) {
        this.isAimDragging = true;
        this.updateAngleFromTouch(touch.clientX, touch.clientY, player);
        return;
      }
    }

    // Otherwise horizontal map panning gesture
    this.isTouchPanning = true;
    this.touchStartX = touch.clientX;
    this.panStartCameraX = this.cameraX;
  }

  handleTouchMove(e) {
    if (this.gameState !== 'PLAYING') return;
    const touch = e.touches ? e.touches[0] : e;
    const player = this.getPlayerTank();

    if (this.isAimDragging && player) {
      e.preventDefault();
      this.updateAngleFromTouch(touch.clientX, touch.clientY, player);
    } else if (this.isTouchPanning) {
      e.preventDefault();
      const dx = touch.clientX - this.touchStartX;
      this.cameraX = Math.max(0, Math.min(this.worldWidth - this.viewportWidth, this.panStartCameraX - dx));
    }
  }

  handleTouchEnd() {
    this.isAimDragging = false;
    this.isTouchPanning = false;
  }

  handleMouseDown(e) {
    this.handleTouchStart(e);
  }

  handleMouseMove(e) {
    this.handleTouchMove(e);
  }

  updateAngleFromTouch(clientX, clientY, player) {
    const playerCanvasX = player.x - this.cameraX;
    const dx = clientX - playerCanvasX;
    const dy = player.y - clientY; // Y inverted on canvas

    let rad = Math.atan2(dy, dx);
    let deg = Math.round((rad * 180) / Math.PI);
    if (deg < 0) deg += 360;

    deg = Math.max(0, Math.min(180, deg));
    player.angle = deg;
    this.updateHUD();
  }

  // Main Render Loop
  gameLoop(timestamp) {
    this.update();
    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update() {
    if (this.gameState !== 'PLAYING') return;

    // Power charge animation update
    if (this.isChargingPower) {
      this.powerCharge += this.powerDirection * 1.8;
      if (this.powerCharge >= 100) {
        this.powerCharge = 100;
        this.powerDirection = -1;
      } else if (this.powerCharge <= 5) {
        this.powerCharge = 5;
        this.powerDirection = 1;
      }
      document.getElementById('power-meter-bar').style.width = `${this.powerCharge}%`;
      document.getElementById('hud-power-val').innerText = `${Math.round(this.powerCharge)}%`;
    }

    // Update Particles
    this.particles.update();

    // Update Tanks Gravity / Vertical Falling
    for (const tank of this.tanks) {
      const result = tank.updateGravity(this.terrain, this.worldHeight);
      if (result && result.fallEliminated) {
        this.soundEngine.playCrumble();
        this.particles.addExplosion(tank.x, tank.y, '#333');
        this.triggerScreenShake(15, 6);

        // If an enemy fell due to crater, award Environmental Elimination score
        if (!tank.isPlayer) {
          this.scoringEngine.recordEnvironmentalKill();
        }
      }
    }

    // Update Active Projectile
    if (this.activeProjectile) {
      this.particles.addSmoke(this.activeProjectile.x, this.activeProjectile.y);
      const impact = this.activeProjectile.update(this.terrain, this.worldWidth, this.worldHeight);

      // Camera dynamic tracking following shell trajectory
      this.cameraX = Math.max(0, Math.min(this.worldWidth - this.viewportWidth, this.activeProjectile.x - this.viewportWidth / 2));

      if (impact) {
        if (impact.type === 'impact') {
          // Destructive terrain crater subtraction
          this.terrain.destroyArea(impact.x, impact.y, impact.radius);
          this.particles.addExplosion(impact.x, impact.y);
          this.soundEngine.playExplosion();
          this.triggerScreenShake(25, 10);
          this.triggerHaptic(100);

          // Calculate splash damage for all nearby tanks
          for (const tank of this.tanks) {
            if (!tank.isAlive) continue;
            const dist = Math.hypot(tank.x - impact.x, tank.y - impact.y);
            if (dist <= impact.radius + tank.width / 2) {
              const proximityRatio = Math.max(0, 1 - dist / (impact.radius + tank.width / 2));
              const damage = impact.damage * proximityRatio;
              const actualDamage = tank.takeDamage(damage);

              // Record hit scoring if fired by Player
              if (this.activeProjectile.ownerId === 0 && actualDamage > 0) {
                const isDirect = dist < 15;
                this.scoringEngine.recordHit(isDirect, actualDamage, dist);
              }
            }
          }
        }

        // Delay before transitioning turn
        setTimeout(() => this.nextTurn(), 1000);
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

    this.ctx.save();

    // Apply Screen Shake transform
    if (this.screenShakeTime > 0) {
      this.screenShakeTime--;
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.ctx.translate(shakeX, shakeY);
    }

    // Render Parallax Sky & Background Layers
    if (this.parallax) {
      this.parallax.drawLayers(this.ctx, this.cameraX, this.viewportWidth, this.viewportHeight);
    }

    // Render Destructive Terrain Heightmap
    if (this.terrain) {
      this.terrain.draw(this.ctx, this.cameraX);
    }

    // Render Particles
    this.particles.draw(this.ctx, this.cameraX);

    // Render Tanks
    for (const tank of this.tanks) {
      tank.draw(this.ctx, this.cameraX);
    }

    // Render Active Projectile
    if (this.activeProjectile) {
      this.activeProjectile.draw(this.ctx, this.cameraX);
    }

    // Draw Aim Trajectory Preview for Player Turn
    if (this.isPlayerTurn() && !this.activeProjectile) {
      this.drawTrajectoryPreview();
    }

    this.ctx.restore();
  }

  drawTrajectoryPreview() {
    const player = this.getPlayerTank();
    if (!player) return;

    const rad = (player.angle * Math.PI) / 180;
    const p = this.isChargingPower ? this.powerCharge : 50;
    const speed = p * 0.22;

    let vx = Math.cos(rad) * speed;
    let vy = -Math.sin(rad) * speed;
    let currX = player.x;
    let currY = player.y - 10;

    this.ctx.beginPath();
    this.ctx.moveTo(currX - this.cameraX, currY);

    for (let i = 0; i < 30; i++) {
      vx += this.wind * 0.005;
      vy += 0.25;
      currX += vx;
      currY += vy;

      if (currX < 0 || currX > this.worldWidth || currY > this.worldHeight) break;
      this.ctx.lineTo(currX - this.cameraX, currY);
    }

    this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
    this.ctx.setLineDash([4, 4]);
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
}

// Initialize Application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GameApp();
});
