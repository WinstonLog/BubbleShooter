class Shooter {
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.grid = grid;
    this.x = canvas.width / 2;
    this.y = canvas.height - 80;
    this.angle = -Math.PI / 2;
    this.currentBubble = null;
    this.nextBubble = null;
    this.radius = grid.bubbleRadius;
    this.speed = 1000;
    this.recoil = 0;

    this.canSwap = true;
    this.swapAnim = 0;
    this.nextX = 0;
    this.nextY = 0;
    this.nextR = 0;
  }

  setSize(w, h) {
    this.x = w / 2;
    this.y = h - 80;
  }

  loadCurrent() {
    if (!this.currentBubble) {
      this.currentBubble = this.nextBubble || this.makeBubble();
      this.nextBubble = this.makeBubble();
      this.currentBubble.x = this.x;
      this.currentBubble.y = this.y;

      this.ensureValidColors();
    }
  }

  makeBubble() {
    const colors = this.grid.getUsableColors();
    const palette = colors.length > 0
      ? colors
      : Bubble.PALETTE.slice(0, 4).map(c => c.main);
    const color = palette[Math.floor(Math.random() * palette.length)];
    return new Bubble(this.x, this.y, color, this.radius);
  }

  // ============================================================
  // 🎯 ГАРАНТИЯ ВАЛИДНЫХ ЦВЕТОВ
  // ============================================================
  ensureValidColors() {
    if (!this.currentBubble || !this.nextBubble) return;

    const usableColors = this.grid.getUsableColors();
    if (usableColors.length === 0) return;

    const currentColor = this.currentBubble.color;
    const nextColor = this.nextBubble.color;
    const currentIsValid = usableColors.includes(currentColor);
    const nextIsValid = usableColors.includes(nextColor);

    if (usableColors.length === 1) {
      const onlyColor = usableColors[0];
      if (!currentIsValid) this.currentBubble.color = onlyColor;
      if (!nextIsValid) this.nextBubble.color = onlyColor;
      return;
    }

    if (!currentIsValid && !nextIsValid) {
      const shuffled = [...usableColors].sort(() => Math.random() - 0.5);
      this.currentBubble.color = shuffled[0];
      this.nextBubble.color = shuffled[1] || shuffled[0];
      return;
    }

    if (!currentIsValid) {
      const candidates = usableColors.filter(c => c !== this.nextBubble.color);
      const pool = candidates.length > 0 ? candidates : usableColors;
      this.currentBubble.color = pool[Math.floor(Math.random() * pool.length)];
    }

    if (!nextIsValid) {
      const candidates = usableColors.filter(c => c !== this.currentBubble.color);
      const pool = candidates.length > 0 ? candidates : usableColors;
      this.nextBubble.color = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  swap() {
    if (!this.canSwap) {
      AudioManager.bounce();
      return false;
    }
    if (this.currentBubble?.moving) return false;
    if (!this.currentBubble || !this.nextBubble) return false;

    const temp = this.currentBubble;
    this.currentBubble = this.nextBubble;
    this.nextBubble = temp;

    this.currentBubble.x = this.x;
    this.currentBubble.y = this.y;
    this.currentBubble.vx = 0;
    this.currentBubble.vy = 0;
    this.currentBubble.moving = false;

    this.canSwap = false;
    this.swapAnim = 1;

    AudioManager.click();
    AudioManager.vibrate(15);

    log('🔄 Swapped bubbles');
    return true;
  }

  hitTestNext(x, y) {
    const dx = x - this.nextX;
    const dy = y - this.nextY;
    return (dx * dx + dy * dy) <= (this.nextR * this.nextR);
  }

  aim(mouseX, mouseY) {
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    let angle = Math.atan2(dy, dx);

    const minAngle = -Math.PI + 0.15;
    const maxAngle = -0.15;

    if (angle > 0) {
      angle = angle > Math.PI / 2 ? minAngle : maxAngle;
    }
    angle = Math.max(minAngle, Math.min(maxAngle, angle));
    this.angle = angle;
  }

  shoot() {
    if (!this.currentBubble || this.currentBubble.moving) return null;
    const bubble = this.currentBubble;
    bubble.moving = true;
    bubble.vx = Math.cos(this.angle) * this.speed;
    bubble.vy = Math.sin(this.angle) * this.speed;
    this.currentBubble = null;
    this.recoil = 1;

    this.canSwap = true;

    setTimeout(() => this.loadCurrent(), 250);
    return bubble;
  }

  // ============================================================
  // 🎯 ПРИЦЕЛ — верхняя граница зависит от верхнего ряда
  // (учитывает новые ряды сверху через grid.getMinRow())
  // ============================================================
  drawAimLine(ctx) {
    if (this.currentBubble?.moving) return;
    if (!this.currentBubble) return;

    const startX = this.x;
    const startY = this.y;
    let x = startX;
    let y = startY;
    let vx = Math.cos(this.angle);
    let vy = Math.sin(this.angle);

    const step = 8;
    const maxSteps = 140;
    const maxBounces = 3;
    let bounces = 0;

    // 🎯 Верхняя граница = верхняя точка самого верхнего ряда
    const gridMinRow = this.grid.getMinRow();
    const topLimitY = this.grid.getY(gridMinRow) - this.grid.bubbleRadius;

    const points = [{ x: startX, y: startY }];
    let endX = startX;
    let endY = startY;

    for (let i = 0; i < maxSteps; i++) {
      x += vx * step;
      y += vy * step;

      // Отскок от левой стены
      if (x - this.radius < 0) {
        x = this.radius;
        vx = -vx;
        bounces++;
      }
      // Отскок от правой стены
      else if (x + this.radius > this.canvas.width) {
        x = this.canvas.width - this.radius;
        vx = -vx;
        bounces++;
      }

      // 🎯 Потолок — верх верхнего ряда
      if (y - this.radius <= topLimitY) {
        endX = x;
        endY = y;
        points.push({ x: endX, y: endY });
        break;
      }

      // Проверка столкновения с пузырьками
      let hit = false;
      for (const b of this.grid.bubbles) {
        if (!b.active) continue;
        const dx = x - b.x;
        const dy = y - b.y;
        const rSum = b.radius + this.radius - 4;
        if (dx * dx + dy * dy < rSum * rSum) {
          hit = true;
          break;
        }
      }

      if (hit) {
        endX = x;
        endY = y;
        points.push({ x: endX, y: endY });
        break;
      }

      points.push({ x, y });
      endX = x;
      endY = y;

      if (bounces >= maxBounces) break;
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // ---- 1. Внешнее свечение ----
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = 'rgba(79, 172, 254, 0.12)';
    ctx.lineWidth = 10;
    ctx.stroke();

    // ---- 2. Основная линия с затуханием ----
    const segCount = points.length - 1;
    for (let i = 0; i < segCount; i++) {
      const t = i / Math.max(1, segCount - 1);
      const alpha = 0.85 * (1 - t * 0.65);

      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.strokeStyle = `rgba(120, 200, 255, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // ---- 3. Точки вдоль траектории ----
    const dotEvery = 5;
    for (let i = dotEvery; i < points.length; i += dotEvery) {
      const t = i / points.length;
      const alpha = 0.95 * (1 - t * 0.55);
      const dotR = 2.8 * (1 - t * 0.4);

      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, dotR * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(79, 172, 254, ${alpha * 0.25})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
      ctx.fill();
    }

    // ---- 4. Маркер точки попадания ----
    const c = Bubble.getColorSet(this.currentBubble.color);
    const pulse = 0.75 + Math.sin(performance.now() / 200) * 0.25;

    const glowGrad = ctx.createRadialGradient(
      endX, endY, 0,
      endX, endY, this.radius * 1.6
    );
    glowGrad.addColorStop(0, c.main + '80');
    glowGrad.addColorStop(0.5, c.main + '30');
    glowGrad.addColorStop(1, c.main + '00');
    ctx.beginPath();
    ctx.arc(endX, endY, this.radius * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(endX, endY, this.radius * (0.7 + pulse * 0.12), 0, Math.PI * 2);
    ctx.strokeStyle = c.main;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endX, endY, this.radius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = c.light;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = pulse;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(endX, endY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();

    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(endX - 6, endY);
    ctx.lineTo(endX + 6, endY);
    ctx.moveTo(endX, endY - 6);
    ctx.lineTo(endX, endY + 6);
    ctx.stroke();

    ctx.restore();
  }

  // ============================================================
  // СЛЕДУЮЩИЙ ПУЗЫРЁК + СВАП
  // ============================================================
  drawNextBubble(ctx) {
    const sx = this.x + 70;
    const sy = this.y + 15;
    const r = this.radius * 0.65;

    this.nextX = sx;
    this.nextY = sy;
    this.nextR = r + 10;

    const swapPulse = this.swapAnim > 0
      ? 1 + Math.sin(this.swapAnim * Math.PI) * 0.25
      : 1;

    ctx.save();

    const bgGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, (r + 14) * swapPulse);
    bgGlow.addColorStop(0, this.canSwap
      ? 'rgba(79, 172, 254, 0.25)'
      : 'rgba(255, 255, 255, 0.08)');
    bgGlow.addColorStop(1, 'rgba(79, 172, 254, 0)');
    ctx.beginPath();
    ctx.arc(sx, sy, (r + 14) * swapPulse, 0, Math.PI * 2);
    ctx.fillStyle = bgGlow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy, (r + 8) * swapPulse, 0, Math.PI * 2);
    ctx.fillStyle = this.canSwap
      ? 'rgba(79, 172, 254, 0.12)'
      : 'rgba(255, 255, 255, 0.05)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy, (r + 8) * swapPulse, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = this.canSwap
      ? 'rgba(79, 172, 254, 0.7)'
      : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = this.canSwap ? 2 : 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    if (this.nextBubble) {
      const prev = {
        x: this.nextBubble.x,
        y: this.nextBubble.y,
        radius: this.nextBubble.radius
      };
      this.nextBubble.x = sx;
      this.nextBubble.y = sy;
      this.nextBubble.radius = r * swapPulse;
      this.nextBubble.draw(ctx);
      this.nextBubble.x = prev.x;
      this.nextBubble.y = prev.y;
      this.nextBubble.radius = prev.radius;
    }

    if (this.canSwap && this.currentBubble && !this.currentBubble.moving) {
      ctx.save();
      const pulse = 0.7 + Math.sin(performance.now() / 400) * 0.3;

      ctx.beginPath();
      ctx.arc(sx, sy - r - 14, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(79, 172, 254, 0.25)';
      ctx.fill();

      ctx.globalAlpha = pulse;
      ctx.strokeStyle = 'rgba(79, 172, 254, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 14px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⇄', sx, sy - r - 14);

      ctx.restore();
    }
  }

  // ============================================================
  // 🎯 ПУШКА
  // ============================================================
  drawCannon(ctx) {
    const now = performance.now() / 1000;
    const recoil = this.recoil * 10;

    // ---- СТВОЛ ----
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);

    const barrelLen = 52;
    const barrelW = 22;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    const barrelGrad = ctx.createLinearGradient(-barrelW / 2, 0, barrelW / 2, 0);
    barrelGrad.addColorStop(0, '#0f1820');
    barrelGrad.addColorStop(0.15, '#3a4a5c');
    barrelGrad.addColorStop(0.4, '#7a95ad');
    barrelGrad.addColorStop(0.55, '#9ab5c9');
    barrelGrad.addColorStop(0.75, '#4a6178');
    barrelGrad.addColorStop(1, '#0f1820');

    ctx.beginPath();
    ctx.moveTo(-barrelW / 2, -barrelLen + recoil);
    ctx.lineTo(-barrelW / 2 + 3, 0);
    ctx.lineTo(barrelW / 2 - 3, 0);
    ctx.lineTo(barrelW / 2, -barrelLen + recoil);
    ctx.closePath();
    ctx.fillStyle = barrelGrad;
    ctx.fill();
    ctx.restore();

    const shineGrad = ctx.createLinearGradient(0, -barrelLen + recoil, 0, 0);
    shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    shineGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.moveTo(-3, -barrelLen + recoil + 4);
    ctx.lineTo(-3, 0);
    ctx.lineTo(3, 0);
    ctx.lineTo(3, -barrelLen + recoil + 4);
    ctx.closePath();
    ctx.fillStyle = shineGrad;
    ctx.fill();

    for (let i = 1; i <= 3; i++) {
      const ringY = -barrelLen * (i / 4) + recoil;
      const ringW = barrelW - (i * 1.5);

      ctx.beginPath();
      ctx.ellipse(0, ringY, ringW / 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, ringY - 1, ringW / 2, 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120, 200, 255, 0.35)';
      ctx.fill();
    }

    const muzzleY = -barrelLen + recoil;
    const muzzlePulse = 0.6 + Math.sin(now * 5) * 0.4;

    const muzzleGlow = ctx.createRadialGradient(0, muzzleY, 0, 0, muzzleY, barrelW);
    muzzleGlow.addColorStop(0, `rgba(79, 172, 254, ${muzzlePulse * 0.7})`);
    muzzleGlow.addColorStop(0.5, `rgba(79, 172, 254, ${muzzlePulse * 0.25})`);
    muzzleGlow.addColorStop(1, 'rgba(79, 172, 254, 0)');
    ctx.beginPath();
    ctx.arc(0, muzzleY, barrelW, 0, Math.PI * 2);
    ctx.fillStyle = muzzleGlow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, muzzleY, barrelW / 2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(79, 172, 254, ${0.6 + muzzlePulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, muzzleY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0e27';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, muzzleY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 230, 255, ${muzzlePulse})`;
    ctx.fill();

    ctx.restore();

    // ---- БАЗА ----
    ctx.save();
    ctx.translate(this.x, this.y);

    const outerGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, 48);
    outerGlow.addColorStop(0, 'rgba(79, 172, 254, 0.35)');
    outerGlow.addColorStop(0.6, 'rgba(79, 172, 254, 0.08)');
    outerGlow.addColorStop(1, 'rgba(79, 172, 254, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;

    const baseGrad = ctx.createRadialGradient(-10, -12, 5, 0, 0, 38);
    baseGrad.addColorStop(0, '#6b8aa3');
    baseGrad.addColorStop(0.4, '#3a4a5c');
    baseGrad.addColorStop(0.75, '#1e2a35');
    baseGrad.addColorStop(1, '#0a0f15');

    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    const rimGrad = ctx.createLinearGradient(-38, -38, 38, 38);
    rimGrad.addColorStop(0, 'rgba(150, 200, 240, 0.7)');
    rimGrad.addColorStop(0.5, 'rgba(79, 172, 254, 0.3)');
    rimGrad.addColorStop(1, 'rgba(120, 180, 220, 0.6)');
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const innerGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 26);
    innerGrad.addColorStop(0, '#3a4a5c');
    innerGrad.addColorStop(1, '#0d141b');
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    const corePulse = 0.55 + Math.sin(now * 3) * 0.45;

    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
    coreGrad.addColorStop(0, `rgba(180, 230, 255, ${corePulse * 0.9})`);
    coreGrad.addColorStop(0.3, `rgba(79, 172, 254, ${corePulse * 0.6})`);
    coreGrad.addColorStop(0.7, `rgba(79, 172, 254, ${corePulse * 0.2})`);
    coreGrad.addColorStop(1, 'rgba(79, 172, 254, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const arcStart = now * 1.5 + (Math.PI * 2 / 3) * i;
      const arcAlpha = 0.5 + Math.sin(now * 2 + i * 1.5) * 0.3;

      ctx.beginPath();
      ctx.arc(0, 0, 33, arcStart, arcStart + 0.7);
      ctx.strokeStyle = `rgba(79, 172, 254, ${arcAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i + now * 0.3;
      const bx = Math.cos(a) * 33;
      const by = Math.sin(a) * 33;
      const boltAlpha = 0.6 + Math.sin(now * 3 + i) * 0.35;

      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150, 220, 255, ${boltAlpha})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 3 + corePulse * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + corePulse * 0.3})`;
    ctx.fill();

    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  update(dt) {
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 5);
    }
    if (this.swapAnim > 0) {
      this.swapAnim = Math.max(0, this.swapAnim - dt * 2.5);
    }
    if (this.currentBubble) this.currentBubble.update(dt);
  }
}