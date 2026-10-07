/**
 * Multi-layer Parallax Scrolling Background Engine
 */
export class ParallaxBackground {
  constructor(worldWidth, worldHeight, prng, perlin, theaterTheme) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.prng = prng;
    this.perlin = perlin;
    this.theme = theaterTheme;

    this.layers = [];
    this.generateLayers();
  }

  generateLayers() {
    // Layer 1: Distant Mountain Silhouettes (Scroll speed factor 0.1)
    this.layers.push({
      speedFactor: 0.1,
      color: this.theme.bgFar,
      canvas: this.renderSilhouette(0.15, 0.001, 0.4, 0.25)
    });

    // Layer 2: Midground Industrial Ruins / Hills (Scroll speed factor 0.3)
    this.layers.push({
      speedFactor: 0.3,
      color: this.theme.bgMid,
      canvas: this.renderSilhouette(0.3, 0.002, 0.5, 0.2)
    });

    // Layer 3: Foreground Atmospheric Fog / Structures (Scroll speed factor 0.6)
    this.layers.push({
      speedFactor: 0.6,
      color: this.theme.bgNear,
      canvas: this.renderSilhouette(0.5, 0.004, 0.55, 0.15)
    });
  }

  renderSilhouette(seedOffset, freq, baseRatio, ampRatio) {
    const canvas = document.createElement('canvas');
    canvas.width = this.worldWidth;
    canvas.height = this.worldHeight;
    const ctx = canvas.getContext('2d');

    const baseH = this.worldHeight * baseRatio;
    const amp = this.worldHeight * ampRatio;

    ctx.fillStyle = this.theme.bgSilhouette;
    ctx.beginPath();
    ctx.moveTo(0, this.worldHeight);

    for (let x = 0; x < this.worldWidth; x += 4) {
      const noiseVal = this.perlin.noise1D((x + seedOffset * 1000) * freq);
      const y = baseH + noiseVal * amp;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(this.worldWidth, this.worldHeight);
    ctx.closePath();
    ctx.fill();

    return canvas;
  }

  drawSky(ctx, viewportWidth, viewportHeight) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewportHeight);
    skyGrad.addColorStop(0, this.theme.skyTop);
    skyGrad.addColorStop(1, this.theme.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  }

  drawLayers(ctx, cameraX, viewportWidth, viewportHeight) {
    this.drawSky(ctx, viewportWidth, viewportHeight);

    for (const layer of this.layers) {
      const offsetX = (cameraX * layer.speedFactor) % this.worldWidth;

      ctx.save();
      ctx.globalAlpha = 0.85;
      // Draw parallax layer offset
      ctx.drawImage(layer.canvas, -offsetX, 0);
      if (offsetX > this.worldWidth - viewportWidth) {
        ctx.drawImage(layer.canvas, this.worldWidth - offsetX, 0);
      }
      ctx.restore();
    }
  }
}
