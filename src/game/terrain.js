/**
 * Destructive Terrain Heightmap & Canvas Renderer
 */
export class Terrain {
  constructor(worldWidth, worldHeight, prng, perlin, theaterTheme) {
    this.width = worldWidth;
    this.height = worldHeight;
    this.prng = prng;
    this.perlin = perlin;
    this.theme = theaterTheme;

    // Heightmap array holding y-coordinate for each x integer along worldWidth
    this.heights = new Float32Array(this.width);

    // Offscreen canvas buffer for high-performance rendering & crater subtraction
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.generateHeightmap();
    this.renderToBuffer();
  }

  generateHeightmap() {
    const baseHeight = this.height * 0.6;
    const amplitude = this.height * 0.25;
    const frequency = 0.003;

    for (let x = 0; x < this.width; x++) {
      // Base terrain elevation using octave Perlin noise
      const n = this.perlin.fbm1D(x * frequency, 4, 0.5, 2.0);

      // Ensure steep valleys/chasm regions for tactical play in higher levels
      let elevation = baseHeight + n * amplitude;

      // Ensure left and right edges don't clip outside lower bounds
      elevation = Math.max(this.height * 0.2, Math.min(this.height * 0.85, elevation));

      this.heights[x] = elevation;
    }
  }

  renderToBuffer() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw solid terrain polygon
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    ctx.lineTo(0, this.heights[0]);

    for (let x = 1; x < this.width; x++) {
      ctx.lineTo(x, this.heights[x]);
    }

    ctx.lineTo(this.width, this.height);
    ctx.closePath();

    // Create linear gradient based on current theater theme
    const fillGrad = ctx.createLinearGradient(0, this.height * 0.2, 0, this.height);
    fillGrad.addColorStop(0, this.theme.terrainTop);
    fillGrad.addColorStop(0.3, this.theme.terrainMid);
    fillGrad.addColorStop(1, this.theme.terrainBase);

    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Top surface grass/rock edge outline
    ctx.strokeStyle = this.theme.terrainEdge;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Add texture details / strata lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    for (let y = this.height * 0.4; y < this.height; y += 20) {
      ctx.beginPath();
      for (let x = 0; x < this.width; x += 15) {
        const offset = Math.sin(x * 0.02 + y) * 3;
        if (y > this.heights[x]) {
          ctx.lineTo(x, y + offset);
        } else {
          ctx.moveTo(x, y + offset);
        }
      }
      ctx.stroke();
    }
  }

  /**
   * Carves a radial explosion crater out of the terrain canvas and heightmap.
   * @param {number} cx Explosion X coordinate
   * @param {number} cy Explosion Y coordinate
   * @param {number} radius Explosion radius in pixels
   */
  destroyArea(cx, cy, radius) {
    const startX = Math.max(0, Math.floor(cx - radius));
    const endX = Math.min(this.width - 1, Math.ceil(cx + radius));

    // 1. Subtract crater on offscreen canvas buffer using destination-out blend mode
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Update heightmap array for physical collision and tank gravity calculations
    for (let x = startX; x <= endX; x++) {
      const dx = x - cx;
      if (Math.abs(dx) <= radius) {
        // Height of circle at this dx offset
        const dy = Math.sqrt(radius * radius - dx * dx);
        const craterBottomY = cy + dy;

        // If crater cuts below current ground surface, push height down
        if (craterBottomY > this.heights[x] && (cy - dy) <= this.heights[x]) {
          this.heights[x] = Math.max(this.heights[x], craterBottomY);
        }
      }
    }
  }

  /**
   * Gets the height of terrain at a specific X coordinate.
   */
  getHeightAt(x) {
    const clampedX = Math.max(0, Math.min(this.width - 1, Math.floor(x)));
    return this.heights[clampedX];
  }

  /**
   * Render the pre-rendered canvas buffer onto main viewport context.
   */
  draw(mainCtx, cameraX) {
    mainCtx.drawImage(this.canvas, -cameraX, 0);
  }
}
