// ============================================================
// VK SDK WRAPPER
// Полностью заменяет yandex-sdk.js
// API совместим с YandexSDKWrapper, чтобы main.js работал без правок
// ============================================================

const VK_CONFIG = {
  // 🎯 ЗАМЕНИТЕ на реальный ID лидерборда из настроек приложения VK
  LEADERBOARD_ID: 1,
  // 🎯 ЗАМЕНИТЕ на числовой ID сообщества vk.com/veldgame
  GROUP_ID: 0,
  // Резервная ссылка на сообщество (если GROUP_ID не задан)
  COMMUNITY_URL: 'https://vk.com/veldgame',
  // Ключ облачного сохранения
  STORAGE_KEY: 'bubble_save_v1',
  // Минимум времени сессии перед первым ad
  MIN_SESSION_MS: 60000,
  // Cooldown между ad
  AD_COOLDOWN_MS: 60000
};

class VKSDKWrapper {
  constructor() {
    this.vk = null;
    this.user = null;
    this.available = false;
    this.playerAvailable = false;
    this.sessionStartTime = Date.now();
    this.lastAdTime = 0;
    this._initSent = false;
    this._gameplayActive = false;
    this._pauseCallbacks = [];
    this._resumeCallbacks = [];
    this._lastSaveTime = 0;
    this._saving = false;
    this._saveQueue = null;
    this._adMuting = false;
    this._subscribed = false;
  }

  isDevMode() {
    try {
      const h = window.location.hostname;
      const p = window.location.protocol;
      return p === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '';
    } catch (e) { return true; }
  }

  // ------------------------------------------------------------
  // Безопасный вызов VK Bridge
  // ------------------------------------------------------------
  _send(method, params) {
    if (!this.vk) return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        this.vk.send(method, params)
          .then(res => resolve(res || null))
          .catch(err => {
            log('[VK] ' + method + ' rejected:', err);
            resolve(null);
          });
      } catch (e) {
        log('[VK] ' + method + ' threw:', e);
        resolve(null);
      }
    });
  }

  // ------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------
  async init() {
    if (typeof vkBridge === 'undefined') {
      log('🔧 Dev mode: VK Bridge не загружен');
      this.available = false;
      this.playerAvailable = false;
      if (window.setLang) setLang('ru');
      return false;
    }

    this.vk = vkBridge;

    try {
      // VKWebAppInit — РОВНО ОДИН РАЗ
      if (!this._initSent) {
        this._initSent = true;
        const res = await this._send('VKWebAppInit');
        if (res && res.result) log('✅ VKWebAppInit OK');
        else log('⚠️ VKWebAppInit уже был отправлен ранее');
      }

      // Информация о пользователе
      const user = await this._send('VKWebAppGetUserInfo');
      if (user && user.id) {
        this.user = user;
        this.playerAvailable = true;
        const lang = (user.language || 'ru').toLowerCase().split('-')[0];
        if (window.setLang) setLang(lang === 'ru' ? 'ru' : 'en');
        log('✅ VK user loaded:', user.first_name || user.id);
      } else {
        this.playerAvailable = false;
        if (window.setLang) setLang('ru');
      }

      this.available = true;
      this.setupPauseResumeEvents();
      log('✅ VK SDK ready');
      return true;

    } catch (e) {
      warn('⚠️ VK SDK init failed:', e.message);
      this.available = false;
      this.playerAvailable = false;
      if (window.setLang) setLang('ru');
      return false;
    }
  }

  // ------------------------------------------------------------
  // PAUSE / RESUME
  //   — visibilitychange (браузер)
  //   — blur / focus (браузер)
  //   — VKWebAppViewHide / VKWebAppViewRestore (VK Bridge, п. 2.2.5)
  // ------------------------------------------------------------
  setupPauseResumeEvents() {
    // 1) Браузерное сворачивание вкладки
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        log('⏸️ Hidden — pause');
        this.gameplayStop();
        this._pauseCallbacks.forEach(cb => { try { cb(); } catch (e) {} });
      } else {
        log('▶️ Visible — resume');
        this._resumeCallbacks.forEach(cb => { try { cb(); } catch (e) {} });
      }
    });

    // 2) Потеря/получение фокуса окном
    window.addEventListener('blur', () => {
      this._pauseCallbacks.forEach(cb => { try { cb(); } catch (e) {} });
    });
    window.addEventListener('focus', () => {
      this._resumeCallbacks.forEach(cb => { try { cb(); } catch (e) {} });
    });

    // 3) VK Bridge события (сворачивание/разворачивание VK)
    if (this.vk && !this._subscribed) {
      this._subscribed = true;
      try {
        this.vk.subscribe((e) => {
          const type = e && e.detail && e.detail.type;
          if (!type) return;

          if (type === 'VKWebAppViewHide') {
            log('👋 VKWebAppViewHide');
            try { if (window.AudioManager) AudioManager.stopMusic(); } catch (err) {}
            this.gameplayStop();
            this._pauseCallbacks.forEach(cb => { try { cb(); } catch (err) {} });
          }
          else if (type === 'VKWebAppViewRestore') {
            log('👋 VKWebAppViewRestore');
            this._resumeCallbacks.forEach(cb => { try { cb(); } catch (err) {} });
          }
        });
        log('✅ VK Bridge subscribe OK');
      } catch (e) {
        warn('⚠️ VK Bridge subscribe failed:', e.message);
      }
    }

    log('✅ Pause/resume events subscribed');
  }

  onPause(callback) { this._pauseCallbacks.push(callback); }
  onResume(callback) { this._resumeCallbacks.push(callback); }

  // ------------------------------------------------------------
  // GAMEPLAY API
  // ------------------------------------------------------------
  gameplayStart() {
    if (!this.available || this._gameplayActive) return;
    this._gameplayActive = true;
    this._send('VKWebAppGameplayStart');
    log('🎮 Gameplay start');
  }

  gameplayStop() {
    if (!this.available || !this._gameplayActive) return;
    this._gameplayActive = false;
    this._send('VKWebAppGameplayStop');
    log('🎮 Gameplay stop');
  }

  callReady() {
    // VK не требует отдельного ready-события — VKWebAppInit достаточно
  }

  // ------------------------------------------------------------
  // 🎯 ЗВУК НА ВРЕМЯ РЕКЛАМЫ
  // ------------------------------------------------------------
  _muteAudioForAd() {
    if (this._adMuting) return;
    this._adMuting = true;
    try {
      if (window.AudioManager && AudioManager.muteForAd) {
        AudioManager.muteForAd();
      }
    } catch (e) {}
  }

  _unmuteAudioAfterAd() {
    if (!this._adMuting) return;
    this._adMuting = false;
    try {
      if (window.AudioManager && AudioManager.unmuteAfterAd) {
        AudioManager.unmuteAfterAd();
      }
    } catch (e) {}
  }

  // ------------------------------------------------------------
  // 🎯 РЕКЛАМА
  // ------------------------------------------------------------
  canShowAd() {
    if (!this.available) return false;
    if (Date.now() - this.sessionStartTime < VK_CONFIG.MIN_SESSION_MS) {
      log('⏳ Ad blocked: session < 60s');
      return false;
    }
    if (Date.now() - this.lastAdTime < VK_CONFIG.AD_COOLDOWN_MS) {
      log('⏳ Ad blocked: cooldown');
      return false;
    }
    return true;
  }

  async showStartupAd() {
    if (!this.available) {
      log('🔧 Dev mode: startup ad skipped');
      return false;
    }
    log('📺 Requesting startup ad...');

    this._muteAudioForAd();
    this.gameplayStop();

    const res = await this._send('VKWebAppShowNativeAds', {
      ad_format: 'interstitial'
    });

    this.lastAdTime = Date.now();
    this._unmuteAudioAfterAd();
    this.gameplayStart();

    const shown = !!(res && res.result);
    log('📺 Startup ad result:', shown);
    return shown;
  }

  async showFullscreenAd() {
    if (!this.available || !this.canShowAd()) return false;

    this._muteAudioForAd();
    this.gameplayStop();

    const res = await this._send('VKWebAppShowNativeAds', {
      ad_format: 'interstitial'
    });

    this.lastAdTime = Date.now();
    this._unmuteAudioAfterAd();
    this.gameplayStart();

    const shown = !!(res && res.result);
    log('📺 Fullscreen ad result:', shown);
    return shown;
  }

  async showRewardedAd() {
    if (!this.available) {
      log('🔧 Dev mode: симуляция rewarded ad');
      return new Promise(resolve => setTimeout(() => resolve(true), 800));
    }

    // Проверяем доступность именно rewarded-рекламы
    const check = await this._send('VKWebAppCheckNativeAds', {
      ad_format: 'reward'
    });

    if (!check || !check.result) {
      log('⚠️ Rewarded ad not available');
      return false;
    }

    this._muteAudioForAd();
    this.gameplayStop();

    const res = await this._send('VKWebAppShowNativeAds', {
      ad_format: 'reward'
    });

    this.lastAdTime = Date.now();
    this._unmuteAudioAfterAd();
    this.gameplayStart();

    const rewarded = !!(res && res.result === true);
    log('🎬 Rewarded result:', rewarded);
    return rewarded;
  }

  // ------------------------------------------------------------
  // 🎯 ОБЛАЧНЫЕ СОХРАНЕНИЯ (VK Storage)
  // ------------------------------------------------------------
  async saveProgress(data) {
    if (this._saving) {
      this._saveQueue = data;
      return;
    }

    const now = Date.now();
    if (now - this._lastSaveTime < 2000) {
      this._saveQueue = data;
      setTimeout(() => {
        const q = this._saveQueue;
        this._saveQueue = null;
        if (q) this.saveProgress(q);
      }, 2000 - (now - this._lastSaveTime));
      return;
    }

    this._saving = true;
    this._lastSaveTime = now;

    let cloudOk = false;

    // VK Storage
    if (this.available) {
      const res = await this._send('VKWebAppStorageSet', {
        key: VK_CONFIG.STORAGE_KEY,
        value: JSON.stringify(data)
      });
      if (res && res.result) {
        cloudOk = true;
        log('☁️ VK Storage save OK');
      } else {
        warn('☁️ VK Storage save failed');
      }
    }

    // localStorage fallback
    if (!cloudOk) {
      try {
        localStorage.setItem('bubble_save', JSON.stringify(data));
        log('💾 Local fallback save OK');
      } catch (e) {
        warn('💾 Local save failed:', e.message);
      }
    }

    this._saving = false;

    if (this._saveQueue) {
      const q = this._saveQueue;
      this._saveQueue = null;
      this.saveProgress(q);
    }
  }

  // 🎯 Загрузка прогресса с тостом при ошибке (п. 3.5.1)
  async loadProgress() {
    const DEFAULT = {
      best: 0,
      totalScore: 0,
      coins: 0,
      boosters: { bomb: 0, freeze: 0, color: 0 }
    };

    // VK Storage
    if (this.available) {
      try {
        const res = await this._send('VKWebAppStorageGet', {
          keys: [VK_CONFIG.STORAGE_KEY]
        });

        if (res && res.keys && res.keys.length > 0) {
          const item = res.keys[0];
          if (item && item.value) {
            const parsed = JSON.parse(item.value);
            log('☁️ VK Storage load OK');
            return {
              best: Number(parsed.best) || 0,
              totalScore: Number(parsed.totalScore) || 0,
              coins: Number(parsed.coins) || 0,
              boosters: parsed.boosters || { bomb: 0, freeze: 0, color: 0 }
            };
          }
        }
      } catch (e) {
        warn('☁️ VK Storage load failed:', e.message);
        // Заглушка для игрока
        if (window.UI && window.UI.toast && window.t) {
          window.UI.toast(window.t('loadError') || 'Не удалось загрузить прогресс');
        }
      }
    }

    // localStorage fallback
    try {
      const saved = localStorage.getItem('bubble_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        log('💾 Local fallback load OK');
        return {
          best: Number(parsed.best) || 0,
          totalScore: Number(parsed.totalScore) || 0,
          coins: Number(parsed.coins) || 0,
          boosters: parsed.boosters || { bomb: 0, freeze: 0, color: 0 }
        };
      }
    } catch (e) {
      warn('💾 Local load failed:', e.message);
      if (window.UI && window.UI.toast && window.t) {
        window.UI.toast(window.t('loadError') || 'Не удалось загрузить прогресс');
      }
    }

    return DEFAULT;
  }

  // ------------------------------------------------------------
  // 🎯 ЛИДЕРБОРД VK
  // ------------------------------------------------------------
  async submitScore(score) {
    if (!this.available) {
      log('🔧 Dev mode: рекорд сохранён локально:', score);
      return;
    }
    await this._send('VKWebAppSetLeaderboardScore', {
      leaderboard_id: VK_CONFIG.LEADERBOARD_ID,
      score: score
    });
    log('✅ Score submitted to VK:', score);
  }

  async getLeaderboard() {
    // VK не позволяет получить entries клиенту.
    return null;
  }

  async openLeaderboardBox(score) {
    if (!this.available) {
      log('🔧 Dev mode: leaderboard box skipped');
      return false;
    }
    const res = await this._send('VKWebAppShowLeaderBoardBox', {
      user_result: score || 0
    });
    return !!(res && res.result);
  }

  // ------------------------------------------------------------
  // 🎯 VK-СПЕЦИФИКА
  // ------------------------------------------------------------
  async addToFavorites() {
    if (!this.available) {
      log('🔧 Dev mode: favorites skipped');
      return false;
    }
    const res = await this._send('VKWebAppAddToFavorites');
    return !!(res && res.result);
  }

  async joinCommunity() {
    if (!this.available) {
      log('🔧 Dev mode: join community skipped');
      return false;
    }

    if (VK_CONFIG.GROUP_ID && VK_CONFIG.GROUP_ID > 0) {
      const res = await this._send('VKWebAppJoinGroup', {
        group_id: VK_CONFIG.GROUP_ID
      });
      return !!(res && res.result);
    }

    // Резервный вариант: открыть ссылку
    const res = await this._send('VKWebAppOpenURL', {
      url: VK_CONFIG.COMMUNITY_URL
    });
    return !!(res && res.result);
  }
}

const VKSDK = new VKSDKWrapper();
window.VKSDK = VKSDK;
window.VK_CONFIG = VK_CONFIG;