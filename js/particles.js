class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.textParticles = [];
    this.shockwaves = [];
    this.maxParticles = 150; // 🎯 Жёсткий лимит
  }
  
  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }
  
  burst(x, y, color, count = 8) {
    // 🎯 Ограничиваем количество частиц
    if (this.particles.length >= this.maxParticles) return;
    count = Math.min(count, 6);
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 100 + Math.random() * 150;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        color,
        size: 2 + Math.random() * 3,
        gravity: 500
      });
    }
    
    // Один шоквейв (только если их мало)
    if (this.shockwaves.length < 5) {
      this.shockwaves.push({
        x, y,
        radius: 5,
        maxRadius: 35,
        life: 0.3,
        maxLife: 0.3,
        color
      });
    }
  }
  
  spark(x, y, color) {
    if (this.particles.length >= this.maxParticles) return;
    
    // Только 2 частицы вместо 5
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25,
        maxLife: 0.25,
        color,
        size: 1.5 + Math.random() * 1.5,
        gravity: 200
      });
    }
  }
  
  floatText(x, y, text, color = '#ffffff', size = 24) {
    // Ограничиваем количество текстов
    if (this.textParticles.length >= 5) {
      this.textParticles.shift();
    }
    
    this.textParticles.push({
      x, y,
      vy: -80,
      text,
      color,
      size,
      life: 1.0,
      maxLife: 1.0,
      scale: 0.6,
      scaleTarget: 1
    });
  }
  
  update(dt) {
    // Частицы
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    
    // Тексты
    for (let i = this.textParticles.length - 1; i >= 0; i--) {
      const t = this.textParticles[i];
      t.y += t.vy * dt;
      t.vy *= 0.94;
      t.life -= dt;
      t.scale += (t.scaleTarget - t.scale) * Math.min(1, dt * 12);
      if (t.life <= 0) this.textParticles.splice(i, 1);
    }
    
    // Шоквейвы
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * Math.min(1, dt * 10);
      s.life -= dt;
      if (s.life <= 0) this.shockwaves.splice(i, 1);
    }
  }
  
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Если нечего рисовать — выход
    if (this.particles.length === 0 && 
        this.textParticles.length === 0 && 
        this.shockwaves.length === 0) {
      return;
    }
    
    // Шоквейвы (без shadowBlur — дорого!)
    for (const s of this.shockwaves) {
      const alpha = s.life / s.maxLife;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Частицы (без shadowBlur!)
    for (const p of this.particles) {
      const alpha = Math.min(1, p.life / p.maxLife * 1.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Текст
    if (this.textParticles.length > 0) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (const t of this.textParticles) {
        const alpha = Math.min(1, t.life / t.maxLife * 2);
        ctx.globalAlpha = alpha;
        ctx.font = `900 ${t.size * t.scale}px 'Segoe UI', sans-serif`;
        
        // Только обводка (без shadow)
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 4;
        ctx.strokeText(t.text, t.x, t.y);
        
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    }
  }
  
  clear() {
    this.particles = [];
    this.textParticles = [];
    this.shockwaves = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}