// ===== ГЛАВНЫЙ ФАЙЛ =====
// Бесконечный режим + монеты + бустеры + VK Bridge

let game = null;
let currentProgress = {
  best: 0,
  totalScore: 0,
  coins: 0,
  boosters: { bomb: 0, freeze: 0, color: 0 }
};
let adShownThisSession = 0;
let gameLoopStarted = false;
let initStarted = false;

let gameOverProcessing = false;
let clickLock = false;

// 🎯 Флаг: игрок уже выбрал награду за рекламу на экране проигрыша
let adChoiceMade = false;

function locked(handler, delay = 500) {
  return function(e) {
    if (clickLock) return;
    clickLock = true;
    setTimeout(() => { clickLock = false; }, delay);
    return handler(e);
  };
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.add('hidden');
  setTimeout(() => {
    if (loader.parentNode) loader.parentNode.removeChild(loader);
  }, 700);
}

function saveProgressToCloud() {
  try {
    VKSDK.saveProgress({
      best: currentProgress.best,
      totalScore: currentProgress.totalScore,
      coins: Wallet.coins,
      boosters: Wallet.getData().boosters
    });
  } catch (e) {}
}

// ============================================================
// СБРОС КНОПОК РЕКЛАМЫ НА ЭКРАНЕ ПРОИГРЫША
// ============================================================
function resetLoseAdButtons() {
  adChoiceMade = false;

  const doubleBtn = document.getElementById('btn-double-coins');
  const continueBtn = document.getElementById('btn-continue-ad');
  const earnedRow = document.querySelector('.lose-coins-row');

  if (doubleBtn) {
    doubleBtn.style.display = '';
    doubleBtn.disabled = false;
  }
  if (continueBtn) {
    continueBtn.style.display = '';
    continueBtn.disabled = false;
  }
  if (earnedRow) {
    earnedRow.style.opacity = '';
    earnedRow.style.transition = '';
    earnedRow.style.transform = '';
  }
}

function showStartupAdOnce() {
  if (sessionStorage.getItem('bubble_startup_ad_shown') === 'true') return;
  if (!VKSDK.available) return;

  setTimeout(async () => {
    sessionStorage.setItem('bubble_startup_ad_shown', 'true');
    if (window.UI) window.UI.showAdIndicator(true);
    const shown = await VKSDK.showStartupAd();
    if (window.UI) window.UI.showAdIndicator(false);
    log('📺 Startup ad result:', shown);
  }, 500);
}

async function init() {
  if (initStarted) return;
  initStarted = true;

  log('🚀 Init starting...');

  try {
    await VKSDK.init();
  } catch (e) {
    warn('VK SDK init failed (dev mode)', e);
    if (window.setLang) setLang('ru');
  }

  if (window.applyTranslations) applyTranslations();
  log('🌐 Language after SDK init:', getLang());

  AudioManager.init();

  // 🎯 Загружаем прогресс
  try {
    const loaded = await VKSDK.loadProgress();
    currentProgress = {
      best: Number(loaded.best) || 0,
      totalScore: Number(loaded.totalScore) || 0,
      coins: Number(loaded.coins) || 0,
      boosters: loaded.boosters || { bomb: 0, freeze: 0, color: 0 }
    };
    log('✅ Progress loaded:', JSON.stringify(currentProgress));
  } catch (e) {
    warn('loadProgress failed:', e);
    currentProgress = {
      best: 0,
      totalScore: 0,
      coins: 0,
      boosters: { bomb: 0, freeze: 0, color: 0 }
    };
  }

  // 🎯 Инициализируем Wallet ДО UI
  Wallet.setData({
    coins: currentProgress.coins,
    boosters: currentProgress.boosters
  });

  const uiInstance = new UI();
  window.UI = uiInstance;

  const canvas = document.getElementById('game-canvas');
  const fxCanvas = document.getElementById('fx-canvas');

  if (!canvas || !fxCanvas) {
    console.error('❌ Canvas не найден!');
    return;
  }

  game = new Game(canvas, fxCanvas);
  window.game = game;
  game.best = currentProgress.best;

  // ============================================================
  // 🎯 RESIZE
  // ============================================================
  let resizeTimeout;
  function resize() {
    const maxW = window.innerWidth;
    const maxH = window.innerHeight;
    const targetAspect = 480 / 800;

    let w, h;
    if (maxW / maxH > targetAspect) {
      h = maxH; w = h * targetAspect;
    } else {
      w = maxW; h = w / targetAspect;
    }

    w = Math.round(w);
    h = Math.round(h);

    [canvas, fxCanvas].forEach(c => {
      c.style.position = 'absolute';
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      c.style.left = '50%';
      c.style.top = '50%';
      c.style.transform = 'translate(-50%, -50%)';
      c.style.display = 'block';
      c.width = 480;
      c.height = 800;
    });

    game.setSize(480, 800);
  }

  function debouncedResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 100);
  }

  resize();
  window.addEventListener('resize', debouncedResize);
  window.addEventListener('orientationchange', debouncedResize);

  uiInstance.updateBest(currentProgress.best);
  uiInstance.updateCoins();
  uiInstance.updateBoosters();

  const safe = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
    else warn(`⚠️ Element #${id} not found`);
  };

  // ============================================================
  // МЕНЮ / ИГРА
  // ============================================================
  safe('btn-play', 'click', locked(() => {
    if (game.state === 'playing') return;

    AudioManager.click();
    AudioManager.resume();
    uiInstance.hideScreens();
    uiInstance.showHud(true);
    uiInstance.showBoostersBar(true);
    AudioManager.startMusic();

    gameOverProcessing = false;
    resetLoseAdButtons();
    game.startGame();
    VKSDK.gameplayStart();
  }));

  // ============================================================
  // БУСТЕРЫ
  // ============================================================
  safe('btn-booster-bomb', 'click', locked(() => {
    game.activateBomb();
  }, 300));

  safe('btn-booster-freeze', 'click', locked(() => {
    game.activateFreeze();
  }, 300));

  safe('btn-booster-color', 'click', locked(() => {
    game.activateColor();
  }, 300));

  // ============================================================
  // 🎯 VK: В ИЗБРАННОЕ
  // ============================================================
  safe('btn-favorites', 'click', locked(async () => {
    AudioManager.click();

    if (!VKSDK.available) {
      uiInstance.toast(t('vkOnly'));
      return;
    }

    const ok = await VKSDK.addToFavorites();
    if (ok) uiInstance.toast(t('favoritesAdded'));
    else    uiInstance.toast(t('favoritesFailed'));
  }, 1000));

  // ============================================================
  // 🎯 VK: СООБЩЕСТВО
  // ============================================================
  safe('btn-support', 'click', locked(async () => {
    AudioManager.click();

    if (!VKSDK.available) {
      uiInstance.toast(t('communityUnavailable'));
      return;
    }

    const ok = await VKSDK.joinCommunity();
    if (ok) uiInstance.toast(t('joinedCommunity'));
    else    uiInstance.toast(t('joinCommunityFailed'));
  }, 1000));

  // ============================================================
  // МАГАЗИН
  // ============================================================
  safe('btn-shop', 'click', () => {
    AudioManager.click();
    uiInstance.updateCoins();
    uiInstance.showScreen('shop');
  });

  safe('btn-shop-back', 'click', () => {
    AudioManager.click();
    uiInstance.showScreen('menu');
  });

  document.querySelectorAll('[data-buy-booster]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.buyBooster;
      const price = Wallet.getPrice(type);

      if (!Wallet.canAfford(price)) {
        uiInstance.toast(t('notEnoughCoins'));
        AudioManager.bounce();
        return;
      }

      if (Wallet.boosters[type] >= BOOSTER_MAX) {
        uiInstance.toast(t('boosterMax'));
        return;
      }

      Wallet.spend(price);
      Wallet.addBooster(type, 1);

      AudioManager.click();
      AudioManager.vibrate(20);
      uiInstance.toast(t('bought'));
      saveProgressToCloud();
    });
  });

  // ============================================================
  // НАСТРОЙКИ
  // ============================================================
  safe('btn-settings', 'click', () => {
    AudioManager.click();
    uiInstance.showScreen('settings');

    const chkSound = document.getElementById('chk-sound');
    const chkMusic = document.getElementById('chk-music');
    const chkVibration = document.getElementById('chk-vibration');

    if (chkSound) chkSound.checked = AudioManager.enabled;
    if (chkMusic) chkMusic.checked = AudioManager.musicEnabled;
    if (chkVibration) chkVibration.checked = AudioManager.vibrationEnabled;
  });

  safe('btn-settings-back', 'click', () => {
    AudioManager.click();
    uiInstance.showScreen('menu');
  });

  safe('chk-sound', 'change', (e) => AudioManager.setEnabled(e.target.checked));
  safe('chk-music', 'change', (e) => AudioManager.setMusicEnabled(e.target.checked));
  safe('chk-vibration', 'change', (e) => AudioManager.setVibrationEnabled(e.target.checked));

  // ============================================================
  // ПАУЗА
  // ============================================================
  safe('btn-pause', 'click', () => {
    if (game.state !== 'playing') return;
    AudioManager.click();
    game.state = 'paused';
    uiInstance.updatePauseScore(game.score);
    uiInstance.showScreen('pause');
    VKSDK.gameplayStop();
  });

  safe('btn-resume', 'click', () => {
    AudioManager.click();
    uiInstance.hideScreens();
    game.state = 'playing';
    VKSDK.gameplayStart();
  });

  safe('btn-restart-pause', 'click', locked(() => {
    AudioManager.click();
    uiInstance.hideScreens();
    uiInstance.showHud(true);

    gameOverProcessing = false;
    resetLoseAdButtons();
    game.startGame();
    VKSDK.gameplayStart();
  }));

  safe('btn-menu-pause', 'click', () => {
    AudioManager.click();
    uiInstance.showScreen('menu');
    uiInstance.showHud(false);
    uiInstance.showBoostersBar(false);
    game.state = 'menu';
    AudioManager.stopMusic();
    VKSDK.gameplayStop();
  });

  // ============================================================
  // ПРОИГРЫШ
  // ============================================================
  safe('btn-restart', 'click', locked(() => {
    AudioManager.click();
    uiInstance.hideScreens();
    uiInstance.showHud(true);
    uiInstance.showBoostersBar(true);

    gameOverProcessing = false;
    resetLoseAdButtons();
    game.startGame();
    VKSDK.gameplayStart();
  }));

  safe('btn-menu-lose', 'click', () => {
    AudioManager.click();
    uiInstance.showScreen('menu');
    uiInstance.showHud(false);
    uiInstance.showBoostersBar(false);
    game.state = 'menu';
    AudioManager.stopMusic();

    gameOverProcessing = false;
    resetLoseAdButtons();
    VKSDK.gameplayStop();
  });

  // ============================================================
  // 🎯 Х2 МОНЕТ ЗА РЕКЛАМУ
  // ============================================================
  safe('btn-double-coins', 'click', locked(async () => {
    if (adChoiceMade) return;
    adChoiceMade = true;

    AudioManager.click();

    const doubleBtn = document.getElementById('btn-double-coins');
    const continueBtn = document.getElementById('btn-continue-ad');
    const earnedRow = document.querySelector('.lose-coins-row');
    const earnedEl = document.getElementById('lose-coins-earned');

    if (doubleBtn) doubleBtn.disabled = true;

    uiInstance.showAdIndicator(true);
    const rewarded = await VKSDK.showRewardedAd();
    uiInstance.showAdIndicator(false);

    if (rewarded) {
      const earned = Number(doubleBtn?.dataset.earned || 0);
      if (earned > 0) {
        Wallet.addCoins(earned);
        saveProgressToCloud();

        if (earnedEl) earnedEl.textContent = earned * 2;

        if (earnedRow) {
          earnedRow.style.transition = 'transform 0.4s';
          earnedRow.style.transform = 'scale(1.15)';
          setTimeout(() => {
            earnedRow.style.transform = 'scale(1)';
          }, 400);
        }

        uiInstance.toast(`+${earned} 🪙 ×2`);
      }

      if (doubleBtn) doubleBtn.style.display = 'none';
      if (continueBtn) continueBtn.style.display = 'none';
    } else {
      adChoiceMade = false;
      if (doubleBtn) doubleBtn.disabled = false;
      uiInstance.toast(t('adNotAvailable'));
    }
  }, 1500));

  // ============================================================
  // 🎯 ПРОДОЛЖИТЬ ЗА РЕКЛАМУ
  // ============================================================
  safe('btn-continue-ad', 'click', locked(async () => {
    if (adChoiceMade) return;
    adChoiceMade = true;

    AudioManager.click();

    const doubleBtn = document.getElementById('btn-double-coins');
    const continueBtn = document.getElementById('btn-continue-ad');

    if (continueBtn) continueBtn.disabled = true;

    uiInstance.showAdIndicator(true);
    const rewarded = await VKSDK.showRewardedAd();
    uiInstance.showAdIndicator(false);

    if (rewarded) {
      if (doubleBtn) doubleBtn.style.display = 'none';
      if (continueBtn) continueBtn.style.display = 'none';

      gameOverProcessing = false;
      game.continueAfterAd();
      VKSDK.gameplayStart();
      log('✅ Rewarded: game resumed');
    } else {
      adChoiceMade = false;
      if (continueBtn) continueBtn.disabled = false;
      uiInstance.toast(t('adNotAvailable'));
    }
  }, 1500));

  // ============================================================
  // ЛИДЕРБОРД
  // ============================================================
  safe('btn-leaderboard', 'click', () => {
    AudioManager.click();
    uiInstance.showScreen('leaderboard');

    // 🎯 Показываем собственный рекорд
    const selfEl = document.getElementById('lb-self-score');
    if (selfEl) selfEl.textContent = currentProgress.best;

    // Отправляем текущий скор в VK
    try {
      VKSDK.submitScore(currentProgress.best);
    } catch (e) {}
  });

  // 🎯 Открыть нативный лидерборд VK
  safe('btn-open-vk-lb', 'click', locked(async () => {
    AudioManager.click();

    if (!VKSDK.available) {
      uiInstance.toast(t('vkOnly'));
      return;
    }

    const ok = await VKSDK.openLeaderboardBox(currentProgress.best);
    if (!ok) uiInstance.toast(t('adNotAvailable'));
  }, 1000));

  safe('btn-lb-back', 'click', () => {
    AudioManager.click();
    uiInstance.showScreen('menu');
  });

  // ============================================================
  // 💥 ПРОИГРЫШ
  // ============================================================
  window.onGameOver = async (score, shotsFired) => {
    if (gameOverProcessing) return;
    gameOverProcessing = true;

    VKSDK.gameplayStop();
    AudioManager.stopMusic();

    const isNewRecord = score > currentProgress.best;

    currentProgress.best = Math.max(score, currentProgress.best);
    currentProgress.totalScore = (currentProgress.totalScore || 0) + score;

    const earnedCoins = Wallet.coinsFromScore(score);
    if (earnedCoins > 0) {
      Wallet.addCoins(earnedCoins);
    }

    saveProgressToCloud();
    try { await VKSDK.submitScore(currentProgress.best); } catch (e) {}

    const ls = document.getElementById('lose-score');
    const lb = document.getElementById('lose-best');
    if (ls) ls.textContent = score;
    if (lb) lb.textContent = currentProgress.best;

    const lc = document.getElementById('lose-coins-earned');
    if (lc) lc.textContent = earnedCoins;

    adChoiceMade = false;

    const doubleBtn = document.getElementById('btn-double-coins');
    const continueBtn = document.getElementById('btn-continue-ad');

    if (doubleBtn) {
      doubleBtn.disabled = earnedCoins <= 0;
      doubleBtn.dataset.earned = earnedCoins;
      doubleBtn.style.display = earnedCoins > 0 ? '' : 'none';
    }
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.style.display = '';
    }

    uiInstance.updateBest(currentProgress.best);
    uiInstance.updateCoins();

    if (isNewRecord) {
      setTimeout(() => uiInstance.toast(t('newRecord'), 2500), 900);
    }

    setTimeout(async () => {
      uiInstance.showHud(false);
      uiInstance.showBoostersBar(false);
      uiInstance.showScreen('lose');

      adShownThisSession++;
      if (adShownThisSession >= 3 && VKSDK.canShowAd()) {
        setTimeout(async () => {
          uiInstance.showAdIndicator(true);
          const shown = await VKSDK.showFullscreenAd();
          uiInstance.showAdIndicator(false);
          if (shown) adShownThisSession = 0;
        }, 500);
      }
    }, 800);
  };

  // ============================================================
  // Игровой цикл
  // ============================================================
  if (!gameLoopStarted) {
    gameLoopStarted = true;

    let lastTime = performance.now();
    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (game) {
        game.update(dt);
        game.draw();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  VKSDK.onPause(() => {
    AudioManager.stopMusic();
    if (game && game.state === 'playing') {
      game.state = 'paused';
      uiInstance.updatePauseScore(game.score);
      uiInstance.showScreen('pause');
    }
  });

  VKSDK.onResume(() => {});

  uiInstance.showScreen('menu');
  uiInstance.showHud(false);
  uiInstance.showBoostersBar(false);

  setTimeout(hideLoader, 600);

  log('✅ Init complete');
  showStartupAdOnce();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());