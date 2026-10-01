class AudioManagerClass {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.vibrationEnabled = true;
    this.musicTimer = null;
    this.musicNode = null;

    // 🎯 Флаг: звук выключен на время рекламы
    this._adMuted = false;
    this._wasMusicBeforeAd = null;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not available');
    }

    const saved = JSON.parse(localStorage.getItem('bubble_settings') || '{}');
    this.enabled = saved.sound !== false;
    this.musicEnabled = saved.music !== false;
    this.vibrationEnabled = saved.vibration !== false;
  }

  save() {
    localStorage.setItem('bubble_settings', JSON.stringify({
      sound: this.enabled,
      music: this.musicEnabled,
      vibration: this.vibrationEnabled
    }));
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ============================================================
  // 🎯 MUTE НА ВРЕМЯ РЕКЛАМЫ
  // VK Bridge не имеет onOpen/onClose колбэков, поэтому глушим
  // звук перед вызовом ShowNativeAds и возвращаем после.
  // ============================================================
  muteForAd() {
    if (this._adMuted) return;
    this._adMuted = true;
    this._wasMusicBeforeAd = this.musicEnabled;

    // Останавливаем музыку
    this.stopMusic();

    // Приостанавливаем AudioContext
    if (this.ctx && this.ctx.state === 'running') {
      try { this.ctx.suspend(); } catch (e) {}
    }
  }

  unmuteAfterAd() {
    if (!this._adMuted) return;
    this._adMuted = false;

    // Возобновляем контекст
    if (this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (e) {}
    }

    // Возвращаем музыку, если была включена
    if (this._wasMusicBeforeAd && this.musicEnabled) {
      this.startMusic();
    }
    this._wasMusicBeforeAd = null;
  }

  beep(freq, duration, type = 'sine', volume = 0.1, detune = 0) {
    if (!this.ctx || !this.enabled) return;
    if (this._adMuted) return; // 🎯 не играем во время рекламы

    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (detune) osc.detune.setValueAtTime(detune, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  shoot() {
    if (!this.ctx || !this.enabled || this._adMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  pop(pitch = 1) {
    if (!this.ctx || !this.enabled || this._adMuted) return;
    const base = 600 * pitch;
    this.beep(base, 0.12, 'sine', 0.12);
    setTimeout(() => this.beep(base * 1.5, 0.1, 'sine', 0.08), 40);
  }

  combo(level = 1) {
    if (this._adMuted) return;
    const notes = [523, 659, 784, 1047, 1319, 1568];
    for (let i = 0; i < Math.min(level + 1, 5); i++) {
      setTimeout(() => this.beep(notes[i], 0.15, 'triangle', 0.1), i * 60);
    }
  }

  win() {
    if (this._adMuted) return;
    const melody = [523, 659, 784, 1047];
    melody.forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.25, 'sine', 0.12), i * 130);
      setTimeout(() => this.beep(f * 2, 0.25, 'sine', 0.05), i * 130);
    });
  }

  lose() {
    if (this._adMuted) return;
    const melody = [400, 350, 300, 200];
    melody.forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.3, 'sawtooth', 0.08), i * 150);
    });
  }

  click() {
    this.beep(700, 0.04, 'square', 0.05);
  }

  bounce() {
    this.beep(300, 0.05, 'square', 0.06);
  }

  setEnabled(on) {
    this.enabled = on;
    this.save();
    if (on) this.resume();
  }

  setMusicEnabled(on) {
    this.musicEnabled = on;
    this.save();
    if (this._adMuted) return; // 🎯 не запускаем во время рекламы
    if (on) this.startMusic();
    else this.stopMusic();
  }

  setVibrationEnabled(on) {
    this.vibrationEnabled = on;
    this.save();
  }

  vibrate(pattern = 20) {
    if (this.vibrationEnabled && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  startMusic() {
    if (!this.ctx || !this.musicEnabled || this.musicTimer) return;
    if (this._adMuted) return; // 🎯 не запускаем во время рекламы
    this.resume();

    const notes = [
      261.63, 329.63, 392.00, 329.63,
      293.66, 349.23, 440.00, 349.23,
      220.00, 261.63, 329.63, 261.63,
      246.94, 293.66, 392.00, 293.66
    ];
    let idx = 0;

    const playNote = () => {
      if (!this.musicEnabled || !this.ctx || this._adMuted) return;
      const f = notes[idx % notes.length];
      this.beep(f, 1.5, 'sine', 0.015);
      this.beep(f * 2, 1.5, 'sine', 0.008);
      idx++;
    };

    playNote();
    this.musicTimer = setInterval(playNote, 900);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

const AudioManager = new AudioManagerClass();
window.AudioManager = AudioManager;