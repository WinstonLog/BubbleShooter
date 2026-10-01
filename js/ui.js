// ============================================================
// UI — экраны, HUD, тосты, лидерборд, монеты, бустеры
// ============================================================
class UI {
  constructor() {
    this.screens = {
      menu: document.getElementById('screen-menu'),
      settings: document.getElementById('screen-settings'),
      pause: document.getElementById('screen-pause'),
      lose: document.getElementById('screen-lose'),
      leaderboard: document.getElementById('screen-leaderboard'),
      shop: document.getElementById('screen-shop')
    };

    this.hud = document.getElementById('hud');
    this.scoreEl = document.getElementById('score');
    this.hudBestEl = document.getElementById('hud-best-value');
    this.bestEl = document.getElementById('best-score');
    this.pauseScoreEl = document.getElementById('pause-score');

    this.shotsCounterEl = document.getElementById('shots-counter');
    this.shotsContainerEl = document.getElementById('hud-shots');

    // 🎯 Монеты
    this.coinsEls = document.querySelectorAll('[data-coins]');
    this.shopCoinsEl = document.getElementById('shop-coins');

    // 🎯 Бустеры
    this.boosterButtons = {
      bomb: document.getElementById('btn-booster-bomb'),
      freeze: document.getElementById('btn-booster-freeze'),
      color: document.getElementById('btn-booster-color')
    };
    this.boosterCountEls = {
      bomb: document.getElementById('booster-bomb-count'),
      freeze: document.getElementById('booster-freeze-count'),
      color: document.getElementById('booster-color-count')
    };
    this.boostersBar = document.getElementById('boosters-bar');
    this.boostersToggle = document.getElementById('btn-boosters-toggle');
    this.boostersTotalEl = document.getElementById('boosters-total');

    // 🎯 Магазин
    this.shopBuyButtons = document.querySelectorAll('[data-buy-booster]');

    this.adIndicator = document.getElementById('ad-indicator');
    this.toastContainer = document.getElementById('toast-container');

    this._currentScreen = 'menu';
    this._boostersCollapseTimer = null;

    console.log('🎨 UI: coinsEls =', this.coinsEls.length,
                '| boosters =', Object.keys(this.boosterButtons).map(k => `${k}:${!!this.boosterButtons[k]}`).join(', '));

    // 🎯 Подписываемся на Wallet
    if (window.Wallet) {
      window.Wallet.onChange = () => {
        this.updateCoins();
        this.updateBoosters();
      };
      this.updateCoins();
      this.updateBoosters();
    } else {
      console.warn('⚠️ UI: window.Wallet не найден!');
    }

    // 🎯 Настройка сворачивания бустеров
    this._setupBoostersToggle();
  }

  // ============================================================
  // 🎯 СВОРАЧИВАНИЕ БУСТЕРОВ
  // ============================================================
  _setupBoostersToggle() {
    if (!this.boostersToggle || !this.boostersBar) return;

    this.boostersToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = this.boostersBar.classList.toggle('expanded');

      if (window.AudioManager) AudioManager.click();

      if (isExpanded) {
        // 🎯 Автосворачивание через 5 сек
        clearTimeout(this._boostersCollapseTimer);
        this._boostersCollapseTimer = setTimeout(() => {
          this.boostersBar.classList.remove('expanded');
        }, 5000);
      } else {
        clearTimeout(this._boostersCollapseTimer);
      }
    });

    // 🎯 Клик по бустеру — обновляем таймер
    Object.values(this.boosterButtons).forEach(btn => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        clearTimeout(this._boostersCollapseTimer);
        this._boostersCollapseTimer = setTimeout(() => {
          this.boostersBar.classList.remove('expanded');
        }, 1500);
      });
    });
  }

  // ============================================================
  // ЭКРАНЫ
  // ============================================================
  hideScreens() {
    for (const key in this.screens) {
      const el = this.screens[key];
      if (el) el.classList.add('hidden');
    }
    this._currentScreen = null;
  }

  showScreen(name) {
    for (const key in this.screens) {
      const el = this.screens[key];
      if (!el) continue;
      if (key === name) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
    this._currentScreen = name;
  }

  showHud(show) {
    if (!this.hud) return;
    if (show) this.hud.classList.remove('hidden');
    else this.hud.classList.add('hidden');
  }

  showBoostersBar(show) {
    if (!this.boostersBar) return;
    if (show) {
      this.boostersBar.classList.remove('hidden');
    } else {
      this.boostersBar.classList.add('hidden');
      this.boostersBar.classList.remove('expanded');
    }
  }

  updateScore(score, pulse = false) {
    if (!this.scoreEl) return;
    this.scoreEl.textContent = score;

    if (pulse) {
      const parent = this.scoreEl.closest('.hud-item');
      if (parent) {
        parent.classList.remove('pulse');
        void parent.offsetWidth;
        parent.classList.add('pulse');
      }
    }
  }

  updateBest(value) {
    if (this.bestEl) this.bestEl.textContent = value;
    if (this.hudBestEl) this.hudBestEl.textContent = value;
  }

  updatePauseScore(score) {
    if (this.pauseScoreEl) this.pauseScoreEl.textContent = score;
  }

  // ============================================================
  // 🎯 СЧЁТЧИК ХОДОВ
  // ============================================================
  updateShotsCounter(value) {
    if (!this.shotsCounterEl) return;

    if (value === 0 || value === null || value === undefined) {
      this.shotsCounterEl.textContent = '∞';
      if (this.shotsContainerEl) {
        this.shotsContainerEl.classList.remove('danger');
        this.shotsContainerEl.classList.add('infinite');
      }
      return;
    }

    this.shotsCounterEl.textContent = value;

    if (this.shotsContainerEl) {
      this.shotsContainerEl.classList.remove('infinite');
      if (value <= 2 && value > 0) this.shotsContainerEl.classList.add('danger');
      else this.shotsContainerEl.classList.remove('danger');
    }
  }

  // ============================================================
  // 🎯 МОНЕТЫ
  // ============================================================
  updateCoins() {
    if (!window.Wallet) return;

    const c = window.Wallet.coins;
    this.coinsEls.forEach(el => { el.textContent = c; });
    if (this.shopCoinsEl) this.shopCoinsEl.textContent = c;

    this.shopBuyButtons.forEach(btn => {
      const type = btn.dataset.buyBooster;
      const price = (window.BOOSTER_PRICES && window.BOOSTER_PRICES[type]) || 0;
      const canAfford = window.Wallet.canAfford(price);
      btn.disabled = !canAfford;
      btn.classList.toggle('disabled', !canAfford);
    });
  }

  // ============================================================
  // 🎯 БУСТЕРЫ
  // ============================================================
  updateBoosters() {
    if (!window.Wallet) return;

    const types = (window.BOOSTER_TYPES) || ['bomb', 'freeze', 'color'];
    let total = 0;

    for (const type of types) {
      const countEl = this.boosterCountEls[type];
      const btnEl = this.boosterButtons[type];
      const count = window.Wallet.boosters[type] || 0;

      total += count;

      if (countEl) countEl.textContent = count;

      if (btnEl) {
        btnEl.disabled = count <= 0;
        btnEl.classList.toggle('empty', count <= 0);
      }
    }

    // 🎯 Общая сумма в badge
    if (this.boostersTotalEl) {
      this.boostersTotalEl.textContent = total;
      this.boostersTotalEl.classList.toggle('empty', total <= 0);
    }

    // 🎯 Подсветка кнопки, если есть бустеры
    if (this.boostersToggle) {
      this.boostersToggle.classList.toggle('has-boosters', total > 0);
    }
  }

  showAdIndicator(show) {
    if (!this.adIndicator) return;
    if (show) this.adIndicator.classList.remove('hidden');
    else this.adIndicator.classList.add('hidden');
  }

  toast(text, duration = 2500) {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);

    const all = this.toastContainer.querySelectorAll('.toast');
    if (all.length > 4) all[0].remove();
  }

  renderLeaderboard(data, currentScore = 0) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    list.innerHTML = '';

    if (!data || !data.entries || data.entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'lb-loading';
      empty.textContent = t('leaderboardEmpty');
      list.appendChild(empty);
      return;
    }

    for (const entry of data.entries) {
      const item = document.createElement('div');
      item.className = 'lb-item';

      const isSelf = entry.player && data.userRank === entry.rank;
      if (isSelf) item.classList.add('self');

      const rank = document.createElement('div');
      rank.className = 'lb-rank';
      if (entry.rank === 1) rank.classList.add('gold');
      else if (entry.rank === 2) rank.classList.add('silver');
      else if (entry.rank === 3) rank.classList.add('bronze');
      rank.textContent = entry.rank;

      const name = document.createElement('div');
      name.className = 'lb-name';
      const publicName = entry.player && entry.player.publicName
        ? entry.player.publicName
        : (isSelf ? t('you') : 'Anonymous');
      name.textContent = publicName;

      const score = document.createElement('div');
      score.className = 'lb-score';
      score.textContent = entry.score;

      item.appendChild(rank);
      item.appendChild(name);
      item.appendChild(score);
      list.appendChild(item);
    }
  }

  updateContinueLevel() {}
  updateLevel() {}
  updateLevelProgress() {}
  showLevelProgress() {}
}