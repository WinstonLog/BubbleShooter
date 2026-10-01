class Game {
  constructor(canvas, fxCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fxCanvas = fxCanvas;

    this.state = 'menu';
    this.score = 0;
    this.best = 0;
    this.comboCount = 0;
    this.lastPopTime = 0;
    this._startingGame = false;

    this.shotsFired = 0;
    this.clearsCount = 0;

    this.shotsUntilDrop = 5;
    this._lastDangerToast = 0;

    this.pendingBomb = false;
    this.freezeShots = 0;

    this.bgCanvas = document.createElement('canvas');
    this.background = new Background(this.bgCanvas);
    this.particles = new ParticleSystem(fxCanvas);

    this.grid = null;
    this.shooter = null;
    this.flyingBubbles = [];
    this.fallingBubbles = [];

    this.shake = 0;
    this.fieldStartBubbles = 0;
    this._lastShootTime = 0;

    this.tutorial = null;

    Bubble.warmupSprites();
    this.setupInput();
  }

  setSize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.fxCanvas.width = w;
    this.fxCanvas.height = h;
    this.background.resize(w, h);
    this.particles.resize(w, h);

    if (this.grid) {
      this.grid.setSize(w);
      if (this.shooter) this.shooter.setSize(w, h);
    }

    if (this.tutorial && this.tutorial.active) {
      this.tutorial.onResize();
    }
  }

  getDifficulty() {
    const shots = this.shotsFired;
    if (shots < 40)  return { level: 1,  colors: 4, rows: 6,  dropEvery: 5 };
    if (shots < 80)  return { level: 4,  colors: 5, rows: 7,  dropEvery: 5 };
    if (shots < 130) return { level: 7,  colors: 5, rows: 8,  dropEvery: 4 };
    if (shots < 200) return { level: 10, colors: 6, rows: 9,  dropEvery: 4 };
    return                  { level: 20, colors: 6, rows: 10, dropEvery: 4 };
  }

  setupInput() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      let clientX, clientY;

      if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (typeof e.clientX === 'number') {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
      }

      return {
        x: (clientX - rect.left) * (this.canvas.width / rect.width),
        y: (clientY - rect.top) * (this.canvas.height / rect.height)
      };
    };

    const block = () => this.tutorial && this.tutorial.active;

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.state !== 'playing' || block()) return;
      const pos = getPos(e);
      if (this.shooter) this.shooter.aim(pos.x, pos.y);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state !== 'playing' || block()) return;
      const pos = getPos(e);
      if (this.shooter) this.shooter.aim(pos.x, pos.y);
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.state !== 'playing' || block()) return;
      const pos = getPos(e);
      if (this.shooter) this.shooter.aim(pos.x, pos.y);
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (this.state !== 'playing' || block()) return;
      const now = performance.now();
      if (now - this._lastShootTime < 120) return;
      this._lastShootTime = now;

      const pos = getPos(e);
      if (this.shooter && this.shooter.hitTestNext(pos.x, pos.y)) {
        this.shooter.swap();
        return;
      }
      this.doShoot();
    }, { passive: true });

    this.canvas.addEventListener('click', (e) => {
      if (this.state !== 'playing' || block()) return;
      const now = performance.now();
      if (now - this._lastShootTime < 120) return;
      this._lastShootTime = now;

      const pos = getPos(e);
      if (this.shooter && this.shooter.hitTestNext(pos.x, pos.y)) {
        this.shooter.swap();
        return;
      }
      this.doShoot();
    });
  }

  startGame() {
    if (this._startingGame) return;
    this._startingGame = true;

    this.score = 0;
    this.state = 'playing';
    this.comboCount = 0;
    this.lastPopTime = 0;
    this.shake = 0;
    this.shotsFired = 0;
    this.clearsCount = 0;
    this.pendingBomb = false;
    this.freezeShots = 0;

    const diff = this.getDifficulty();
    this.shotsUntilDrop = diff.dropEvery;
    this._lastDangerToast = 0;

    this.grid = new Grid(11, 20);
    this.grid.setSize(this.canvas.width);
    this.grid.generate(diff.level);

    this.fieldStartBubbles = this.grid.bubbles.filter(b => b.active).length;

    this.shooter = new Shooter(this.canvas, this.grid);
    this.shooter.setSize(this.canvas.width, this.canvas.height);
    this.shooter.loadCurrent();
    this.shooter.canSwap = true;

    this.flyingBubbles = [];
    this.fallingBubbles = [];
    this.particles.clear();

    if (window.UI) {
      window.UI.updateScore(0);
      window.UI.updateShotsCounter(this.shotsUntilDrop);
      window.UI.updateBoosters();
    }

    if (!localStorage.getItem('bubble_tutorial_completed')) {
      setTimeout(() => {
        if (!this.tutorial) this.tutorial = new Tutorial(this);
        this.tutorial.start();
      }, 800);
    }

    log('▶️ Game started');
    setTimeout(() => { this._startingGame = false; }, 500);
  }

  doShoot() {
    if (!this.shooter?.currentBubble) return;
    if (this.shooter.currentBubble.moving) return;

    const bubble = this.shooter.shoot();
    if (bubble) {
      if (this.pendingBomb) {
        bubble.isBomb = true;
        this.pendingBomb = false;
        if (window.UI) window.UI.updateBoosters();
      }
      this.flyingBubbles.push(bubble);
      this.shotsFired++;
      AudioManager.shoot();
      AudioManager.vibrate(10);
    }
  }

  // ============================================================
  // 🎯 UPDATE FLYING — граница снапа упирается в верхний ряд
  // ============================================================
  updateFlying(dt) {
    const gridBubbles = this.grid.bubbles;

    // 🎯 Верхняя граница сетки = верхняя точка самого верхнего ряда
    const gridMinRow = this.grid.getMinRow();
    const topLimitY = this.grid.getY(gridMinRow) - this.grid.bubbleRadius;

    for (let i = this.flyingBubbles.length - 1; i >= 0; i--) {
      const bubble = this.flyingBubbles[i];
      bubble.update(dt);

      if (bubble.x - bubble.radius < 0) {
        bubble.x = bubble.radius;
        bubble.vx = Math.abs(bubble.vx);
        this.particles.spark(bubble.x, bubble.y, bubble.color);
        AudioManager.bounce();
      } else if (bubble.x + bubble.radius > this.canvas.width) {
        bubble.x = this.canvas.width - bubble.radius;
        bubble.vx = -Math.abs(bubble.vx);
        this.particles.spark(bubble.x, bubble.y, bubble.color);
        AudioManager.bounce();
      }

      // 🎯 Снап в верхний ряд
      if (bubble.y - bubble.radius <= topLimitY) {
        this.snapAndResolve(bubble);
        this.flyingBubbles.splice(i, 1);
        continue;
      }

      let collided = false;
      for (let j = 0; j < gridBubbles.length; j++) {
        const other = gridBubbles[j];
        if (!other.active) continue;
        const dx = bubble.x - other.x;
        const dy = bubble.y - other.y;
        const rSum = bubble.radius + other.radius - 1;
        if (dx * dx + dy * dy < rSum * rSum) {
          this.snapAndResolve(bubble);
          this.flyingBubbles.splice(i, 1);
          collided = true;
          break;
        }
      }
      if (collided) continue;

      if (bubble.y > this.canvas.height + 30) {
        this.flyingBubbles.splice(i, 1);
      }
    }
  }

  snapAndResolve(bubble) {
    if (this.state !== 'playing') return;

    if (bubble.isBomb) {
      bubble.active = false;
      Wallet.useBooster('bomb');
      if (window.UI) window.UI.updateBoosters();
      this.detonateBombAt(bubble.x, bubble.y);
      this.checkGameState();
      return;
    }

    const hitX = bubble.x;
    const hitY = bubble.y;

    this.grid.snapToGrid(bubble);

    if (this.grid.getBubbleAt(bubble.row, bubble.col)) {
      bubble.x = hitX;
      bubble.y = hitY;

      const freeSlot = this.grid.findNearestFreeSlot(bubble);
      if (freeSlot) {
        bubble.row = freeSlot.row;
        bubble.col = freeSlot.col;
      } else {
        bubble.active = false;
        return;
      }
    }

    bubble.moving = false;
    bubble.active = true;
    bubble.vx = 0;
    bubble.vy = 0;
    bubble.bounce();
    bubble.x = this.grid.getX(bubble.row, bubble.col);
    bubble.y = this.grid.getY(bubble.row);

    this.grid.bubbles.push(bubble);
    this.grid.markDirty();

    this.particles.spark(bubble.x, bubble.y, bubble.color);

    const cluster = this.grid.findCluster(bubble);
    const minCluster = 3;

    if (cluster.length >= minCluster) {
      this.resolveCluster(cluster);
    }

    if (this.freezeShots > 0) {
      this.freezeShots--;
      if (window.UI) {
        window.UI.toast(t('freezeActive', { n: this.freezeShots }), 900);
        window.UI.updateBoosters();
      }
    } else {
      this.shotsUntilDrop--;
      if (window.UI) window.UI.updateShotsCounter(this.shotsUntilDrop);

      if (this.shotsUntilDrop === 2 || this.shotsUntilDrop === 1) {
        const now = performance.now();
        if (now - this._lastDangerToast > 3000) {
          this._lastDangerToast = now;
          if (window.UI) window.UI.toast(t('rowDropSoon'), 1500);
        }
      }

      if (this.shotsUntilDrop <= 0) {
        this.dropGrid();
        this.shotsUntilDrop = this.getDifficulty().dropEvery;
        if (window.UI) {
          window.UI.updateShotsCounter(this.shotsUntilDrop);
          window.UI.toast(t('rowDropped'), 1200);
        }
        this._lastDangerToast = 0;
      }
    }

    if (this.shooter) {
      this.shooter.ensureValidColors();
    }

    this.checkGameState();
  }

  detonateBombAt(x, y) {
    const radius = this.grid.bubbleRadius * 3.2;
    const radiusSq = radius * radius;

    this.particles.burst(x, y, '#f97316', 20);
    this.particles.burst(x, y, '#fbbf24', 14);
    AudioManager.combo(4);
    AudioManager.vibrate([60, 30, 80]);
    this.shake = 14;

    let destroyed = 0;
    for (const b of this.grid.bubbles) {
      if (!b.active) continue;
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < radiusSq) {
        b.active = false;
        b.falling = true;
        b.vy = -200;
        b.vx = (Math.random() - 0.5) * 400;
        this.fallingBubbles.push(b);
        destroyed++;
      }
    }

    this.grid.bubbles = this.grid.bubbles.filter(b => b.active);
    this.grid.markDirty();

    const points = destroyed * 15;
    this.score += points;
    if (window.UI) {
      window.UI.updateScore(this.score, true);
      window.UI.toast(`💣 +${points}`, 1200);
    }

    const floating = this.grid.findFloating();
    for (const b of floating) {
      b.active = false;
      b.falling = true;
      b.vy = -100;
      b.vx = (Math.random() - 0.5) * 200;
      this.fallingBubbles.push(b);
    }
    if (floating.length > 0) {
      this.grid.bubbles = this.grid.bubbles.filter(b => b.active);
      this.grid.markDirty();
      this.score += floating.length * 20;
      if (window.UI) window.UI.updateScore(this.score, true);
    }

    const container = document.getElementById('game-container');
    if (container) {
      container.classList.remove('danger-flash');
      void container.offsetWidth;
      container.classList.add('danger-flash');
    }
  }

  activateBomb() {
    if (this.state !== 'playing') return false;
    if (this.pendingBomb) return false;
    if (!Wallet.hasBooster('bomb')) {
      if (window.UI) window.UI.toast(t('noBooster'), 1200);
      return false;
    }
    this.pendingBomb = true;
    if (window.UI) {
      window.UI.toast(t('bombActivated'), 1200);
      window.UI.updateBoosters();
    }
    AudioManager.click();
    AudioManager.vibrate(20);
    return true;
  }

  activateFreeze() {
    if (this.state !== 'playing') return false;
    if (this.freezeShots > 0) {
      if (window.UI) window.UI.toast(t('freezeAlreadyActive'), 1200);
      return false;
    }
    if (!Wallet.hasBooster('freeze')) {
      if (window.UI) window.UI.toast(t('noBooster'), 1200);
      return false;
    }
    Wallet.useBooster('freeze');
    this.freezeShots = 5;
    if (window.UI) {
      window.UI.toast(t('freezeActivated'), 1500);
      window.UI.updateBoosters();
    }
    AudioManager.click();
    AudioManager.vibrate(20);
    return true;
  }

  activateColor() {
    if (this.state !== 'playing') return false;
    if (!this.shooter?.currentBubble) return false;
    if (!Wallet.hasBooster('color')) {
      if (window.UI) window.UI.toast(t('noBooster'), 1200);
      return false;
    }
    if (this.shooter.currentBubble.moving) return false;

    const colors = this.grid.getUsableColors();
    if (colors.length === 0) return false;

    const current = this.shooter.currentBubble.color;
    const candidates = colors.filter(c => c !== current);
    const pool = candidates.length > 0 ? candidates : colors;
    const newColor = pool[Math.floor(Math.random() * pool.length)];

    this.shooter.currentBubble.color = newColor;
    Wallet.useBooster('color');
    if (window.UI) {
      window.UI.toast(t('colorChanged'), 1200);
      window.UI.updateBoosters();
    }
    AudioManager.click();
    AudioManager.vibrate(20);
    return true;
  }

  // ============================================================
  // 🎯 СПУСК РЯДА
  // ============================================================
  dropGrid() {
    if (!this.grid || this.state !== 'playing') return;

    this.grid.dropOffset += this.grid.rowHeight;
    this.addNewRowAbove();

    for (const b of this.grid.bubbles) {
      if (!b.active) continue;
      b.y = this.grid.getY(b.row);
    }

    this.grid.markDirty();
    this.shake = 4;
    AudioManager.vibrate(15);

    const container = document.getElementById('game-container');
    if (container) {
      container.classList.remove('danger-flash');
      void container.offsetWidth;
      container.classList.add('danger-flash');
    }

    log('⬇️ Row dropped');
    this.checkLoseCondition();
  }

  // ============================================================
  // 🎯 ДОБАВЛЕНИЕ РЯДА СВЕРХУ
  // ============================================================
  addNewRowAbove() {
    const minRow = this.grid.getMinRow();
    const newRow = minRow - 1;

    const diff = this.getDifficulty();
    const fullPalette = Bubble.PALETTE.slice(0, diff.colors).map(c => c.main);
    const activeColors = this.grid.getActiveColors();

    let palette;
    if (activeColors.length === 0) {
      palette = fullPalette;
    } else if (activeColors.length === 1) {
      const extras = fullPalette.filter(c => c !== activeColors[0])
        .sort(() => Math.random() - 0.5);
      palette = [activeColors[0], ...extras.slice(0, Math.min(3, extras.length))];
    } else if (activeColors.length === 2) {
      const extras = fullPalette.filter(c => !activeColors.includes(c))
        .sort(() => Math.random() - 0.5);
      palette = [...activeColors, ...extras.slice(0, Math.min(2, extras.length))];
    } else {
      palette = [...activeColors];
    }

    if (palette.length === 1 && fullPalette.length > 1) {
      const extra = fullPalette.filter(c => c !== palette[0]);
      if (extra.length > 0) palette.push(extra[Math.floor(Math.random() * extra.length)]);
    }

    const colsInRow = this.grid.getColsInRow(newRow);

    for (let col = 0; col < colsInRow; col++) {
      if (Math.random() < 0.15) continue;

      const color = palette[Math.floor(Math.random() * palette.length)];
      const bubble = new Bubble(
        this.grid.getX(newRow, col),
        this.grid.getY(newRow),
        color,
        this.grid.bubbleRadius
      );
      bubble.row = newRow;
      bubble.col = col;

      if (Math.random() < 0.03) bubble.isFire = true;

      this.grid.bubbles.push(bubble);
    }

    this.grid.markDirty();
    if (this.shooter) this.shooter.ensureValidColors();

    log(`➕ Added row ${newRow}`);
  }

  checkLoseCondition() {
    const dangerY = this.shooter.y - 60;
    for (const b of this.grid.bubbles) {
      if (b.active && b.y + b.radius >= dangerY) {
        if (this.state === 'playing') {
          this.state = 'gameover';
          log('💥 GAME OVER! Score:', this.score);
          AudioManager.lose();
          AudioManager.vibrate([100, 50, 100, 50, 200]);

          if (this.score > this.best) this.best = this.score;

          if (window.onGameOver) window.onGameOver(this.score, this.shotsFired);
        }
        return;
      }
    }
  }

  resolveCluster(cluster) {
    const now = performance.now();
    if (now - this.lastPopTime < 1500) {
      this.comboCount++;
    } else {
      this.comboCount = 0;
    }
    this.lastPopTime = now;

    const fireBubbles = cluster.filter(b => b.isFire);
    let fireBonusPoints = 0;

    if (fireBubbles.length > 0) {
      fireBonusPoints = this.detonateFire(fireBubbles);
    }

    let points = cluster.length * 10;
    if (this.comboCount > 0) points += this.comboCount * 20;
    points += fireBonusPoints;

    let cx = 0, cy = 0;
    for (const b of cluster) {
      cx += b.x;
      cy += b.y;
    }
    cx /= cluster.length;
    cy /= cluster.length;

    for (const b of cluster) {
      b.active = false;
      b.falling = true;
      b.vy = -100;
      b.vx = (Math.random() - 0.5) * 200;
      this.fallingBubbles.push(b);
    }

    this.grid.bubbles = this.grid.bubbles.filter(b => b.active);
    this.grid.markDirty();

    this.particles.burst(cx, cy, cluster[0].color, 8);
    AudioManager.pop();

    const floating = this.grid.findFloating();
    if (floating.length > 0) {
      for (const b of floating) {
        b.active = false;
        b.falling = true;
        b.vy = -100;
        b.vx = (Math.random() - 0.5) * 200;
        this.fallingBubbles.push(b);

        if (b.isFire) points += 50;
        else points += 20;
      }

      this.grid.bubbles = this.grid.bubbles.filter(b => b.active);
      this.grid.markDirty();

      this.particles.floatText(cx, cy - 30, `+${floating.length * 20}`, '#fbbf24', 28);
    }

    this.score += points;
    if (window.UI) window.UI.updateScore(this.score, true);

    this.shake = Math.min(8, cluster.length * 0.6);

    if (this.comboCount >= 2) {
      const texts = ['', '', t('excellent'), t('amazing'), t('perfect')];
      const text = texts[Math.min(this.comboCount, 4)];
      if (text) {
        this.particles.floatText(
          this.canvas.width / 2,
          this.canvas.height / 2 - 40,
          text,
          '#a855f7',
          32
        );
      }
      AudioManager.combo(this.comboCount);
    }

    if (this.shooter) this.shooter.ensureValidColors();
  }

  detonateFire(fireBubbles) {
    let totalPoints = 0;
    const destroyed = new Set();
    const fireQueue = [...fireBubbles];

    while (fireQueue.length > 0) {
      const fire = fireQueue.shift();
      if (!fire || !fire.active) continue;

      const radius = this.grid.bubbleRadius * 3.5;
      const radiusSq = radius * radius;

      this.particles.burst(fire.x, fire.y, '#f97316', 16);

      for (const b of this.grid.bubbles) {
        if (!b.active) continue;
        if (b === fire) continue;
        if (destroyed.has(b)) continue;

        const dx = b.x - fire.x;
        const dy = b.y - fire.y;

        if (dx * dx + dy * dy < radiusSq) {
          destroyed.add(b);
          b.active = false;
          b.falling = true;
          b.vy = -200;
          b.vx = (Math.random() - 0.5) * 400;
          this.fallingBubbles.push(b);

          if (b.isFire && !fireQueue.includes(b)) fireQueue.push(b);

          if (b.isFire) totalPoints += 50;
          else totalPoints += 15;
        }
      }

      fire.active = false;
      fire.falling = true;
      fire.vy = -300;
      fire.vx = (Math.random() - 0.5) * 400;
      this.fallingBubbles.push(fire);
      destroyed.add(fire);
      totalPoints += 30;
    }

    if (destroyed.size > 0) {
      this.grid.bubbles = this.grid.bubbles.filter(b => b.active);
      this.grid.markDirty();

      if (window.UI) window.UI.toast('🔥 FIRE! +' + totalPoints);
      AudioManager.combo(4);
      AudioManager.vibrate([50, 30, 50, 30, 80]);
      this.shake = 12;

      const container = document.getElementById('game-container');
      if (container) {
        container.classList.remove('danger-flash');
        void container.offsetWidth;
        container.classList.add('danger-flash');
      }
    }

    return totalPoints;
  }

  checkGameState() {
    if (this.state !== 'playing') return;

    const active = this.grid.bubbles.filter(b => b.active);

    if (active.length === 0 && this.flyingBubbles.length === 0) {
      this.clearsCount++;
      const bonus = 500 + this.clearsCount * 100;
      this.score += bonus;
      if (window.UI) {
        window.UI.updateScore(this.score, true);
        window.UI.toast(t('clearBonus', { bonus }), 2000);
      }
      AudioManager.win();
      AudioManager.vibrate([50, 50, 100]);
      this.shake = 10;

      setTimeout(() => this.spawnNewWave(), 400);
      return;
    }

    const dangerY = this.shooter.y - 60;
    for (const b of active) {
      if (b.y + b.radius >= dangerY) {
        this.state = 'gameover';
        log('💥 GAME OVER! Score:', this.score);
        AudioManager.lose();
        AudioManager.vibrate([100, 50, 100, 50, 200]);

        if (this.score > this.best) this.best = this.score;
        if (window.onGameOver) window.onGameOver(this.score, this.shotsFired);
        return;
      }
    }
  }

  spawnNewWave() {
    if (this.state !== 'playing') return;

    const diff = this.getDifficulty();

    this.grid.bubbles = [];
    this.grid.dropOffset = 0;
    this.grid.targetDropOffset = 0;
    this.grid.markDirty();
    this.grid.generate(diff.level);

    this.fieldStartBubbles = this.grid.bubbles.filter(b => b.active).length;

    this.shotsUntilDrop = diff.dropEvery;
    this._lastDangerToast = 0;
    if (window.UI) window.UI.updateShotsCounter(this.shotsUntilDrop);

    if (this.shooter) {
      this.shooter.grid = this.grid;
      this.shooter.ensureValidColors();
    }

    log(`🌊 New wave ${this.clearsCount}`);
  }

  continueAfterAd() {
    if (!this.grid) return;
    log('🎬 Continue after ad');

    const dangerY = this.shooter.y - 60;
    const activeBubbles = this.grid.bubbles.filter(b => b.active);

    if (activeBubbles.length === 0) {
      this.state = 'playing';
      if (this.shooter) this.shooter.canSwap = true;
      this._justResumed = true;
      setTimeout(() => { this._justResumed = false; }, 500);
      return;
    }

    let maxRow = -Infinity;
    for (const b of activeBubbles) {
      if (b.row > maxRow) maxRow = b.row;
    }

    let dangerRow = maxRow;
    for (let r = maxRow; r >= maxRow - 50; r--) {
      const rowY = this.grid.getY(r);
      const rr = this.grid.bubbleRadius;
      if (rowY + rr >= dangerY) {
        dangerRow = r;
        break;
      }
    }

    const removeFromRow = dangerRow - 4;

    let removedCount = 0;
    for (const b of this.grid.bubbles) {
      if (!b.active) continue;
      if (b.row >= removeFromRow) {
        b.active = false;
        b.falling = true;
        b.vy = 200;
        b.vx = (Math.random() - 0.5) * 300;
        this.fallingBubbles.push(b);
        this.particles.burst(b.x, b.y, b.color, 6);
        removedCount++;
      }
    }

    this.grid.bubbles = this.grid.bubbles.filter(b => b.active);
    this.grid.markDirty();

    const remaining = this.grid.bubbles.filter(b => b.active);
    if (remaining.length > 0) {
      let minRow = Infinity;
      for (const b of remaining) {
        if (b.row < minRow) minRow = b.row;
      }
      if (minRow !== 0) {
        for (const b of remaining) b.row -= minRow;
      }
      this.grid.dropOffset = 0;
      this.grid.targetDropOffset = 0;

      for (const b of remaining) {
        b.x = this.grid.getX(b.row, b.col);
        b.y = this.grid.getY(b.row);
      }
      this.grid.markDirty();
    } else {
      this.grid.dropOffset = 0;
    }

    if (this.shooter) this.shooter.canSwap = true;

    this.state = 'playing';
    this.comboCount = 0;
    this.lastPopTime = 0;
    this.shake = 5;
    this.pendingBomb = false;
    this.freezeShots = 0;

    this.shotsUntilDrop = this.getDifficulty().dropEvery;
    this._lastDangerToast = 0;
    if (window.UI) {
      window.UI.updateShotsCounter(this.shotsUntilDrop);
      window.UI.updateBoosters();
    }

    if (window.UI) {
      window.UI.hideScreens();
      window.UI.showHud(true);
    }

    AudioManager.click();
    AudioManager.vibrate(20);

    if (window.UI && removedCount > 0) {
      this.particles.floatText(
        this.canvas.width / 2,
        this.canvas.height / 2 - 60,
        '−4 ряда!',
        '#fbbf24',
        36
      );
    }

    const container = document.getElementById('game-container');
    if (container) {
      container.classList.remove('danger-flash');
      void container.offsetWidth;
      container.classList.add('danger-flash');
    }

    if (this.shooter) this.shooter.ensureValidColors();

    this._justResumed = true;
    setTimeout(() => { this._justResumed = false; }, 800);

    log('✅ Resumed after ad');
  }

  updateFalling(dt) {
    for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
      const b = this.fallingBubbles[i];
      b.update(dt);
      if (b.y > this.canvas.height + 60) {
        this.fallingBubbles.splice(i, 1);
      }
    }
    if (this.fallingBubbles.length > 40) {
      this.fallingBubbles.splice(0, this.fallingBubbles.length - 40);
    }
  }

  update(dt) {
    if (this.state === 'paused') return;

    if (this.tutorial && this.tutorial.active) {
      this.background.update(dt);
      this.particles.update(dt);
      return;
    }

    this.background.update(dt);

    if (this.state === 'playing') {
      if (this.grid) this.grid.update(dt);
      if (this.shooter) this.shooter.update(dt);
      this.updateFlying(dt);
      this.updateFalling(dt);
      this.particles.update(dt);

      if (this.shake > 0) {
        this.shake = Math.max(0, this.shake - dt * 20);
      }
      if (!this._justResumed) {
        this.checkGameState();
      }
    } else if (this.state === 'gameover') {
      this.updateFalling(dt);
      this.particles.update(dt);
      if (this.shake > 0) {
        this.shake = Math.max(0, this.shake - dt * 20);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();

    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      ctx.translate(sx, sy);
    }

    this.background.draw();
    ctx.drawImage(this.bgCanvas, 0, 0);

    if (this.state === 'menu') {
      ctx.restore();
      return;
    }

    if (this.shooter) {
      const dangerY = this.shooter.y - 60;
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, dangerY);
      ctx.lineTo(this.canvas.width, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.shooter) this.shooter.drawAimLine(ctx);
    if (this.grid) this.grid.draw(ctx);

    for (const b of this.fallingBubbles) b.draw(ctx);
    for (const b of this.flyingBubbles) b.draw(ctx);

    if (this.shooter) {
      this.shooter.drawCannon(ctx);
      if (this.shooter.currentBubble) {
        this.shooter.currentBubble.x = this.shooter.x;
        this.shooter.currentBubble.y = this.shooter.y;
        this.shooter.currentBubble.draw(ctx);
      }
      if (this.shooter.nextBubble) {
        this.shooter.drawNextBubble(ctx);
      }
    }

    if (this.pendingBomb && this.shooter) {
      ctx.save();
      ctx.font = '32px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(249, 115, 22, 0.9)';
      ctx.shadowBlur = 20;
      ctx.fillText('💣', this.shooter.x, this.shooter.y - 60);
      ctx.restore();
    }

    if (this.freezeShots > 0) {
      ctx.save();
      ctx.font = '20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(150, 220, 255, 0.9)';
      ctx.shadowColor = 'rgba(79, 172, 254, 0.9)';
      ctx.shadowBlur = 12;
      ctx.fillText('❄️ ' + this.freezeShots, 60, 60);
      ctx.restore();
    }

    ctx.restore();
    this.particles.draw();
  }
}