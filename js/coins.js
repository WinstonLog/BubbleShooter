// ============================================================
// МОНЕТЫ И БУСТЕРЫ
// ============================================================

const BOOSTER_TYPES = ['bomb', 'freeze', 'color'];

const BOOSTER_PRICES = {
  bomb: 50,
  freeze: 30,
  color: 20
};

const BOOSTER_MAX = 9;
const COINS_PER_100 = 1;

class WalletClass {
  constructor() {
    this.coins = 0;
    this.boosters = { bomb: 0, freeze: 0, color: 0 };
    this.onChange = null;
  }

  setData(data) {
    if (!data) return;
    this.coins = Math.max(0, Number(data.coins) || 0);
    const b = data.boosters || {};
    this.boosters = {
      bomb: Math.min(BOOSTER_MAX, Math.max(0, Number(b.bomb) || 0)),
      freeze: Math.min(BOOSTER_MAX, Math.max(0, Number(b.freeze) || 0)),
      color: Math.min(BOOSTER_MAX, Math.max(0, Number(b.color) || 0))
    };
    this._notify();
  }

  getData() {
    return {
      coins: this.coins,
      boosters: { ...this.boosters }
    };
  }

  _notify() {
    if (this.onChange) {
      try { this.onChange(this); } catch (e) {}
    }
  }

  addCoins(amount) {
    const add = Math.floor(amount);
    if (add <= 0) return this.coins;
    this.coins += add;
    this._notify();
    return this.coins;
  }

  canAfford(price) {
    return this.coins >= price;
  }

  spend(price) {
    if (!this.canAfford(price)) return false;
    this.coins -= price;
    this._notify();
    return true;
  }

  addBooster(type, count = 1) {
    if (!BOOSTER_TYPES.includes(type)) return false;
    this.boosters[type] = Math.min(BOOSTER_MAX, this.boosters[type] + count);
    this._notify();
    return true;
  }

  useBooster(type) {
    if (!BOOSTER_TYPES.includes(type)) return false;
    if (this.boosters[type] <= 0) return false;
    this.boosters[type]--;
    this._notify();
    return true;
  }

  hasBooster(type) {
    return this.boosters[type] > 0;
  }

  getPrice(type) {
    return BOOSTER_PRICES[type] || 0;
  }

  coinsFromScore(score) {
    return Math.floor(score / 100) * COINS_PER_100;
  }

  reset() {
    this.coins = 0;
    this.boosters = { bomb: 0, freeze: 0, color: 0 };
    this._notify();
  }
}

const Wallet = new WalletClass();

// 🎯 КРИТИЧНО: присваиваем к window, иначе UI не найдёт
window.Wallet = Wallet;
window.BOOSTER_TYPES = BOOSTER_TYPES;
window.BOOSTER_PRICES = BOOSTER_PRICES;
window.BOOSTER_MAX = BOOSTER_MAX;