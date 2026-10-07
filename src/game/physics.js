/**
 * Projectile Physics Engine
 * Calculates parabolic trajectories with gravity and wind resistance.
 */
export class Projectile {
  constructor(x, y, angleDeg, power, wind, ownerId) {
    this.x = x;
    this.y = y;
    this.ownerId = ownerId;

    // Convert power (0..100) to velocity magnitude
    const velocityScale = 0.22;
    const speed = power * velocityScale;

    // Convert angle to radians (0 deg = right, 90 deg = straight up, 180 deg = left)
    const rad = (angleDeg * Math.PI) / 180;
    this.vx = Math.cos(rad) * speed;
    this.vy = -Math.sin(rad) * speed;

    this.wind = wind; // Horizontal force
    this.gravity = 0.25; // Vertical acceleration
    this.radius = 3;

    this.trail = []; // Trail points for smoke effect
    this.isDead = false;
    this.explosionRadius = 35;
    this.maxDamage = 75;
  }

  update(terrain, worldWidth, worldHeight) {
    if (this.isDead) return null;

    // Add trail point
    this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
    if (this.trail.length > 20) {
      this.trail.shift();
    }

    // Apply wind and gravity
    this.vx += this.wind * 0.005;
    this.vy += this.gravity;

    // Move projectile
    this.x += this.vx;
    this.y += this.vy;

    // Fade trail points
    for (const pt of this.trail) {
      pt.alpha -= 0.04;
    }

    // Check boundary conditions
    if (this.x < 0 || this.x > worldWidth || this.y > worldHeight + 100) {
      this.isDead = true;
      return { type: 'out_of_bounds', x: this.x, y: this.y };
    }

    // Check terrain collision
    const groundY = terrain.getHeightAt(this.x);
    if (this.y >= groundY) {
      this.isDead = true;
      return {
        type: 'impact',
        x: this.x,
        y: groundY,
        radius: this.explosionRadius,
        damage: this.maxDamage
      };
    }

    return null;
  }

  draw(ctx, cameraX) {
    if (this.isDead) return;

    const drawX = this.x - cameraX;
    const drawY = this.y;

    // Draw smoke trail
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      ctx.beginPath();
      ctx.arc(pt.x - cameraX, pt.y, Math.max(1, i * 0.25), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 200, 200, ${Math.max(0, pt.alpha)})`;
      ctx.fill();
    }

    // Draw shell
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();
    ctx.strokeStyle = '#ff5722';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
