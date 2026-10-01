// ============================================================
// ТУТОРИАЛ ДЛЯ НОВИЧКА (v7 — 5 шагов, без босса)
// ============================================================

class Tutorial {
  constructor(game) {
    this.game = game;
    this.step = 0;
    this.active = false;

    this.steps = [
      {
        icon: '🎯',
        title: t('tutAimTitle'),
        body: t('tutAimBody'),
        pos: () => ({
          x: this.game.canvas.width / 2,
          y: this.game.canvas.height - 320,
          r: 170
        }),
        shape: 'circle'
      },
      {
        icon: '🔄',
        title: t('tutSwapTitle'),
        body: t('tutSwapBody'),
        pos: () => ({
          x: this.game.canvas.width / 2 + 70,
          y: this.game.canvas.height - 65,
          r: 48
        }),
        shape: 'circle'
      },
      {
        icon: '⏱️',
        title: t('tutCounterTitle'),
        body: t('tutCounterBody'),
        selector: '#hud-shots',
        shape: 'rect'
      },
      {
        icon: '💥',
        title: t('tutClusterTitle'),
        body: t('tutClusterBody'),
        pos: () => this._findClusterPos(),
        shape: 'circle'
      },
      {
        icon: '🔥',
        title: t('tutFireTitle'),
        body: t('tutFireBody'),
        pos: () => this._findFireBubblePos(),
        shape: 'circle'
      }
    ];

    this._buildDOM();
  }

  _findFireBubblePos() {
    const grid = this.game.grid;
    const fallback = { x: this.game.canvas.width / 2, y: 300, r: 100 };

    if (!grid || !grid.bubbles) return fallback;

    const fireBubble = grid.bubbles.find(b => b.active && b.isFire);

    if (fireBubble) {
      return {
        x: fireBubble.x,
        y: fireBubble.y,
        r: Math.max(fireBubble.radius * 2.5, 60)
      };
    }
    return fallback;
  }

  _findClusterPos() {
    const grid = this.game.grid;
    const fallback = { x: this.game.canvas.width / 2, y: 260, r: 140 };

    if (!grid || !grid.bubbles) return fallback;

    const visited = new Set();
    let bestCluster = [];
    const activeBubbles = grid.bubbles.filter(b => b.active);

    for (const b of activeBubbles) {
      const key = `${b.row},${b.col}`;
      if (visited.has(key)) continue;

      const cluster = grid.findCluster(b);
      for (const c of cluster) {
        visited.add(`${c.row},${c.col}`);
      }

      if (cluster.length > bestCluster.length) {
        bestCluster = cluster;
      }
    }

    if (bestCluster.length >= 3) {
      let cx = 0, cy = 0;
      for (const b of bestCluster) {
        cx += b.x;
        cy += b.y;
      }
      cx /= bestCluster.length;
      cy /= bestCluster.length;

      return {
        x: cx,
        y: cy,
        r: Math.max(90, bestCluster.length * 12)
      };
    }
    return fallback;
  }

  _buildDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'hidden';

    overlay.innerHTML = `
      <div id="tutorial-spotlight"></div>
      <div class="tutorial-arrow" id="tutorial-arrow" style="display:none"></div>

      <div id="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-icon" id="tut-icon">🎯</div>
          <div style="min-width:0;flex:1;">
            <div class="tutorial-step" id="tut-step">ШАГ 1 / 5</div>
            <div class="tutorial-title" id="tut-title"></div>
          </div>
        </div>
        <div class="tutorial-body" id="tut-body"></div>
        <div class="tutorial-progress" id="tut-progress"></div>
        <div class="tutorial-actions">
          <button class="tutorial-btn tutorial-btn-skip" id="tut-skip">${t('tutSkip')}</button>
          <button class="tutorial-btn tutorial-btn-primary" id="tut-next">${t('tutNext')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    this.overlay = overlay;
    this.spotEl = overlay.querySelector('#tutorial-spotlight');
    this.arrowEl = overlay.querySelector('#tutorial-arrow');
    this.cardEl = overlay.querySelector('#tutorial-card');

    this.spotEl.style.transition = 'none';

    this.iconEl = overlay.querySelector('#tut-icon');
    this.stepEl = overlay.querySelector('#tut-step');
    this.titleEl = overlay.querySelector('#tut-title');
    this.bodyEl = overlay.querySelector('#tut-body');
    this.progressEl = overlay.querySelector('#tut-progress');
    this.nextBtn = overlay.querySelector('#tut-next');
    this.skipBtn = overlay.querySelector('#tut-skip');

    for (let i = 0; i < this.steps.length; i++) {
      const d = document.createElement('div');
      d.className = 'tutorial-dot';
      this.progressEl.appendChild(d);
    }

    this.nextBtn.addEventListener('click', () => this.next());
    this.skipBtn.addEventListener('click', () => this.finish());

    this._onResize = () => this.onResize();
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.step = 0;

    this.overlay.classList.remove('hidden');
    this.cardEl.style.opacity = '0';

    requestAnimationFrame(() => {
      this.overlay.classList.add('active');
      setTimeout(() => {
        this.cardEl.style.opacity = '';
        this._showStep(0);
      }, 50);
    });

    AudioManager.click();
  }

  finish() {
    if (!this.active) return;
    this.active = false;

    this.overlay.classList.remove('active');
    setTimeout(() => this.overlay.classList.add('hidden'), 350);

    localStorage.setItem('bubble_tutorial_completed', 'true');
    AudioManager.click();
    AudioManager.vibrate(20);
  }

  next() {
    this.step++;
    if (this.step >= this.steps.length) {
      this.finish();
      return;
    }
    this._showStep(this.step);
    AudioManager.click();
  }

  _showStep(index) {
    const s = this.steps[index];
    if (!s) return;

    this.iconEl.textContent = s.icon;
    this.titleEl.textContent = s.title;
    this.bodyEl.innerHTML = s.body;
    this.stepEl.textContent = `ШАГ ${index + 1} / ${this.steps.length}`;

    this.nextBtn.textContent = (index === this.steps.length - 1)
      ? t('tutFinish')
      : t('tutNext');

    this.progressEl.querySelectorAll('.tutorial-dot').forEach((d, i) => {
      d.classList.toggle('active', i === index);
      d.classList.toggle('done', i < index);
    });

    this._refreshPositions(s);
  }

  _refreshPositions(step) {
    const target = this._getTargetScreenRect(step);
    if (!target) return;

    const left = target.x - target.w / 2;
    const top = target.y - target.h / 2;
    const radius = target.shape === 'circle' ? '50%' : '16px';

    this.spotEl.style.transition = 'none';
    this.spotEl.style.left = left + 'px';
    this.spotEl.style.top = top + 'px';
    this.spotEl.style.width = target.w + 'px';
    this.spotEl.style.height = target.h + 'px';
    this.spotEl.style.borderRadius = radius;

    void this.spotEl.offsetWidth;

    const spotCenterY = target.y;
    const viewportH = window.innerHeight;
    const spotInTopHalf = spotCenterY < viewportH / 2;

    this.cardEl.style.top = 'auto';
    this.cardEl.style.bottom = 'auto';

    if (spotInTopHalf) {
      this.cardEl.style.bottom = 'calc(20px + env(safe-area-inset-bottom, 0px))';
    } else {
      this.cardEl.style.top = 'calc(80px + env(safe-area-inset-top, 0px))';
    }

    this._positionArrow(target, spotInTopHalf);
  }

  _getTargetScreenRect(step) {
    if (step.selector) {
      const el = document.querySelector(step.selector);
      if (el) {
        const r = el.getBoundingClientRect();
        const pad = 10;
        return {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          w: r.width + pad * 2,
          h: r.height + pad * 2,
          shape: 'rect'
        };
      }
    }

    if (step.pos) {
      const pos = step.pos();
      if (!pos) return null;

      const canvas = this.game.canvas;
      const rect = canvas.getBoundingClientRect();
      const canvasW = canvas.width;
      const canvasH = canvas.height;

      const style = getComputedStyle(canvas);
      const borderL = parseFloat(style.borderLeftWidth) || 0;
      const borderR = parseFloat(style.borderRightWidth) || 0;
      const borderT = parseFloat(style.borderTopWidth) || 0;
      const borderB = parseFloat(style.borderBottomWidth) || 0;

      const contentW = rect.width - borderL - borderR;
      const contentH = rect.height - borderT - borderB;

      const scaleX = contentW / canvasW;
      const scaleY = contentH / canvasH;
      const scaleAvg = (scaleX + scaleY) / 2;

      const screenX = rect.left + borderL + pos.x * scaleX;
      const screenY = rect.top + borderT + pos.y * scaleY;
      const screenR = pos.r * scaleAvg;

      return {
        x: screenX,
        y: screenY,
        w: screenR * 2,
        h: screenR * 2,
        shape: step.shape || 'circle'
      };
    }
    return null;
  }

  _positionArrow(target, spotInTopHalf) {
    const arrowSize = 40;
    const gap = 14;

    this.arrowEl.style.display = 'block';

    if (spotInTopHalf) {
      const ax = target.x - arrowSize / 2;
      const ay = target.y + target.h / 2 + gap;
      this.arrowEl.style.left = ax + 'px';
      this.arrowEl.style.top = ay + 'px';
      this.arrowEl.textContent = '👆';
    } else {
      const ax = target.x - arrowSize / 2;
      const ay = target.y - target.h / 2 - arrowSize - gap;
      this.arrowEl.style.left = ax + 'px';
      this.arrowEl.style.top = ay + 'px';
      this.arrowEl.textContent = '👇';
    }
  }

  onResize() {
    if (!this.active) return;
    const s = this.steps[this.step];
    if (!s) return;
    this._refreshPositions(s);
  }
}