class Background {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.bubbles = [];
    this.time = 0;
    this.w = 480;
    this.h = 800;

    // 🎯 Кэш статического фона (градиенты)
    this._staticBg = null;

    this.init();
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.w = w;
    this.h = h;
    this._staticBg = null; // сбросить кэш при resize
    this.init();
  }

  init() {
    const w = this.w;
    const h = this.h;

    // 🎯 Строим кэш статики ОДИН РАЗ
    this._buildStaticBg();

    // Звёзды (анимируются — рисуем поверх кэша)
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 10 + 5,
        alpha: Math.random() * 0.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2
      });
    }

    // Фоновые пузыри
    this.bubbles = [];
    const colors = ['#4facfe', '#00f2fe', '#a855f7', '#ec4899', '#fbbf24'];
    for (let i = 0; i < 8; i++) {
      this.bubbles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 40 + 20,
        speed: Math.random() * 15 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.06 + 0.03,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  // ============================================================
  // 🎯 СТАТИЧЕСКИЙ ФОН — градиент рендерится один раз
  // ============================================================
  _buildStaticBg() {
    const w = this.w;
    const h = this.h;

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cctx = c.getContext('2d');

    // Основной градиент
    const grad = cctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2d1b69');
    grad.addColorStop(0.4, '#1a1a4a');
    grad.addColorStop(1, '#0a0e27');
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, w, h);

    // Радиальное свечение
    const radGrad = cctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, h * 0.8);
    radGrad.addColorStop(0, 'rgba(79, 172, 254, 0.15)');
    radGrad.addColorStop(1, 'rgba(79, 172, 254, 0)');
    cctx.fillStyle = radGrad;
    cctx.fillRect(0, 0, w, h);

    this._staticBg = c;
  }

  update(dt) {
    this.time += dt;

    for (const s of this.stars) {
      s.y += s.speed * dt;
      s.twinkle += dt * 3;
      if (s.y > this.h) {
        s.y = -5;
        s.x = Math.random() * this.w;
      }
    }

    for (const b of this.bubbles) {
      b.y -= b.speed * dt;
      b.wobble += dt;
      b.x += Math.sin(b.wobble) * 8 * dt;
      if (b.y + b.size < 0) {
        b.y = this.h + b.size;
        b.x = Math.random() * this.w;
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.w, h = this.h;

    ctx.clearRect(0, 0, w, h);

    // 🎯 Статический фон из кэша — O(1) вместо ~3 градиентов
    if (this._staticBg) {
      ctx.drawImage(this._staticBg, 0, 0);
    }

    // Фоновые пузыри (двигаются — рисуем каждый кадр)
    for (const b of this.bubbles) {
      const g = ctx.createRadialGradient(
        b.x - b.size * 0.3, b.y - b.size * 0.3, 0,
        b.x, b.y, b.size
      );
      g.addColorStop(0, b.color);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = b.alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Звёзды
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(s.twinkle);
      ctx.globalAlpha = s.alpha * twinkle;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}