/**
 * Tank Entity Class
 */
export class Tank {
  constructor(id, isPlayer, x, y, name, color) {
    this.id = id;
    this.isPlayer = isPlayer;
    this.x = x;
    this.y = y;
    this.name = name;
    this.color = color;

    this.maxHp = 100;
    this.hp = 100;
    this.angle = isPlayer ? 45 : 135; // Degrees (0..180)
    this.power = 50; // Power percentage (0..100)

    this.width = 36;
    this.height = 18;
    this.isAlive = true;
    this.isFalling = false;
    this.velocityY = 0;
  }

  updateGravity(terrain, worldHeight) {
    if (!this.isAlive) return;

    const groundY = terrain.getHeightAt(this.x);

    // Tank sits with bottom edge on terrain height (y + height / 2 = groundY)
    const targetY = groundY - this.height / 2;

    if (this.y < targetY - 1) {
      // Tank is floating above carved crater -> apply vertical gravity
      this.isFalling = true;
      this.velocityY += 0.5; // Gravity acceleration
      this.y += this.velocityY;

      // Check vertical fall off bottom screen boundary -> Instant Environmental Elimination
      if (this.y - this.height / 2 > worldHeight) {
        this.hp = 0;
        this.isAlive = false;
        return { fallEliminated: true };
      }
    } else {
      // Landed on terrain
      this.y = targetY;
      this.velocityY = 0;
      this.isFalling = false;
    }

    return { fallEliminated: false };
  }

  takeDamage(amount) {
    if (!this.isAlive) return 0;
    const actualDamage = Math.min(this.hp, Math.round(amount));
    this.hp -= actualDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
    }
    return actualDamage;
  }

  draw(ctx, cameraX) {
    if (!this.isAlive) return;

    const drawX = this.x - cameraX;
    const drawY = this.y;

    ctx.save();
    ctx.translate(drawX, drawY);

    // Tank Body
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Tank Turret Dome
    ctx.beginPath();
    ctx.arc(0, -this.height / 2, 10, Math.PI, 0);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.stroke();

    // Cannon Barrel
    const rad = (this.angle * Math.PI) / 180;
    const barrelLen = 22;
    const barrelX = Math.cos(-rad) * barrelLen;
    const barrelY = Math.sin(-rad) * barrelLen;

    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(barrelX, -this.height / 2 + barrelY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#111';
    ctx.stroke();

    // Tracks
    ctx.fillStyle = '#111';
    ctx.fillRect(-this.width / 2 - 2, this.height / 2 - 4, this.width + 4, 6);

    // Name Label & HP Bar Overlay
    ctx.restore();

    // HP Bar above tank
    const barW = 40;
    const barH = 5;
    const barX = drawX - barW / 2;
    const barY = drawY - this.height / 2 - 22;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);

    const hpPercent = this.hp / this.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ffeb3b' : '#f44336';
    ctx.fillRect(barX, barY, barW * hpPercent, barH);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Name Label
    ctx.fillStyle = this.isPlayer ? '#81c784' : '#ff8a80';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, drawX, barY - 4);

    // Render offscreen / screen boundary directional indicator badge if tank is beyond horizontal viewport
    const viewportWidth = ctx.canvas ? ctx.canvas.width / (window.devicePixelRatio || 1) : 1000;
    if (drawX < 15 || drawX > viewportWidth - 15) {
      const edgeX = Math.max(30, Math.min(viewportWidth - 30, drawX));
      const badgeY = Math.min(drawY - 30, 80);

      ctx.save();
      ctx.fillStyle = this.isPlayer ? '#2e7d32' : '#c62828';
      ctx.beginPath();
      ctx.arc(edgeX, badgeY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(drawX < 15 ? '◄' : '►', edgeX, badgeY);
      ctx.restore();
    }
  }
}
