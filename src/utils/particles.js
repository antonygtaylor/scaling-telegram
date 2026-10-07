/**
 * Visual Polish Particle System (Smoke, Explosions, Dirt Debris, Fire Sparks)
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addExplosion(x, y, color) {
    const count = 40;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: i % 2 === 0 ? '#ff5722' : (i % 3 === 0 ? '#ffeb3b' : color || '#8d6e63'),
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.15
      });
    }
  }

  addSmoke(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 1.5 - 0.5,
      radius: Math.random() * 3 + 2,
      color: '#bdbdbd',
      alpha: 0.8,
      decay: 0.02,
      gravity: -0.01
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, cameraX) {
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}
