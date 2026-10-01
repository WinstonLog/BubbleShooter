class Bubble {
  static PALETTE = [
    { main: '#ff4757', light: '#ff7b85', dark: '#c72c3e' },
    { main: '#4facfe', light: '#7dc3ff', dark: '#2b7ac7' },
    { main: '#fbbf24', light: '#fcd34d', dark: '#d97706' },
    { main: '#10b981', light: '#34d399', dark: '#047857' },
    { main: '#a855f7', light: '#c084fc', dark: '#7e22ce' },
    { main: '#ec4899', light: '#f472b6', dark: '#be185d' },
    { main: '#06b6d4', light: '#22d3ee', dark: '#0e7490' }
  ];

  static _spriteCache = new Map();
  static _spriteRadius = 20;

  static getColorSet(mainColor) {
    return Bubble.PALETTE.find(c => c.main === mainColor) || Bubble.PALETTE[0];
  }

  static _buildSprite(color) {
    const r = Bubble._spriteRadius;
    const pad = Math.ceil(r * 0.55);
    const size = (r + pad) * 2;
    const cx = size / 2;
    const cy = size / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const c = Bubble.getColorSet(color);

    const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r + pad * 0.95);
    glowGrad.addColorStop(0, c.main + 'CC');
    glowGrad.addColorStop(0.55, c.main + '44');
    glowGrad.addColorStop(1, c.main + '00');
    ctx.beginPath();
    ctx.arc(cx, cy, r + pad * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.75, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.globalAlpha = 1;

    const grad = ctx.createRadialGradient(
      cx - r * 0.35, cy - r * 0.35, r * 0.05,
      cx, cy, r
    );
    grad.addColorStop(0, c.light);
    grad.addColorStop(0.5, c.main);
    grad.addColorStop(1, c.dark);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    const hl = ctx.createRadialGradient(
      cx - r * 0.35, cy - r * 0.4, 0,
      cx - r * 0.35, cy - r * 0.4, r * 0.5
    );
    hl.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.4, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = hl;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.45, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();

    const bl = ctx.createRadialGradient(
      cx + r * 0.2, cy + r * 0.4, 0,
      cx + r * 0.2, cy + r * 0.4, r * 0.4
    );
    bl.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    bl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy + r * 0.4, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = bl;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    return canvas;
  }

  static getSprite(color) {
    let s = Bubble._spriteCache.get(color);
    if (!s) {
      s = Bubble._buildSprite(color);
      Bubble._spriteCache.set(color, s);
    }
    return s;
  }

  static warmupSprites() {
    for (const c of Bubble.PALETTE) {
      Bubble.getSprite(c.main);
    }
  }

  constructor(x, y, color, radius = 20) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = radius;
    this.row = 0;
    this.col = 0;
    this.active = true;
    this.vx = 0;
    this.vy = 0;
    this.moving = false;
    this.falling = false;
    this.spawnTime = performance.now();
    this.wobble = Math.random() * Math.PI * 2;
    this.bounceAnim = 0;

    this.isFire = false;
  }

  draw(ctx) {
    if (!this.active && !this.falling) return;

    const r = this.radius;
    const sprite = Bubble.getSprite(this.color);
    const scale = r / Bubble._spriteRadius;
    const w = sprite.width * scale;
    const h = sprite.height * scale;

    ctx.drawImage(sprite, this.x - w / 2, this.y - h / 2, w, h);

    // 🎯 FIRE overlay
    if (this.isFire) {
      const now = performance.now();
      const pulse = 0.7 + Math.sin(now / 180) * 0.3;
      const auraPulse = 0.55 + Math.sin(now / 260) * 0.45;

      const auraGrad = ctx.createRadialGradient(
        this.x, this.y, r * 0.6,
        this.x, this.y, r * 1.8
      );
      auraGrad.addColorStop(0, `rgba(249, 115, 22, ${0.6 * auraPulse})`);
      auraGrad.addColorStop(0.4, `rgba(251, 146, 60, ${0.35 * auraPulse})`);
      auraGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 0.85, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(251, 146, 60, ${pulse})`;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 0.95, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(249, 115, 22, ${pulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      const outerFlameGrad = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, r * 0.48
      );
      outerFlameGrad.addColorStop(0, 'rgba(255, 235, 150, 1)');
      outerFlameGrad.addColorStop(0.35, 'rgba(251, 191, 36, 1)');
      outerFlameGrad.addColorStop(0.7, 'rgba(249, 115, 22, 0.9)');
      outerFlameGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');

      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 0.48 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = outerFlameGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 0.32 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251, 191, 36, ${0.95 * pulse})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 0.16 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * pulse})`;
      ctx.fill();

      const sparkle = now / 250;
      for (let i = 0; i < 6; i++) {
        const angle = sparkle + (Math.PI * 2 / 6) * i;
        const dist = r * 1.15;
        const sx = this.x + Math.cos(angle) * dist;
        const sy = this.y + Math.sin(angle) * dist;
        const sparkleAlpha = 0.55 + Math.sin(sparkle * 3 + i * 1.2) * 0.4;
        const sparkleSize = r * (0.08 + Math.abs(Math.sin(sparkle * 2 + i)) * 0.06);

        ctx.beginPath();
        ctx.arc(sx, sy, sparkleSize * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${sparkleAlpha * 0.35})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 130, ${sparkleAlpha})`;
        ctx.fill();
      }
    }
  }

  update(dt) {
    if (this.moving) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    if (this.falling) {
      this.vy += 1200 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.99;
    }

    if (this.bounceAnim > 0) {
      this.bounceAnim -= dt;
    }
  }

  bounce() {
    this.bounceAnim = 0.3;
  }
}