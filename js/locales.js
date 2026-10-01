// ============================================================
// ЛОКАЛИЗАЦИЯ (RU / EN)
// ============================================================

const LOCALES = {
    ru: {
        loading: 'Загрузка...',
        initializing: 'Инициализация...',
        back: 'Назад',
        menu: 'В меню',
        restart: 'Заново',
        playAgain: 'Ещё раз',
        resumePlay: 'Продолжить',

        play: 'Играть',
        leaderboard: 'Рейтинг',
        settings: 'Настройки',
        shop: 'Магазин',
        best: 'Лучший счёт',

        score: 'Очки',
        bestScore: 'Рекорд',
        coins: 'Монеты',

        pause: 'Пауза',
        gameover: 'Игра окончена',

        sound: 'Звук',
        music: 'Музыка',
        vibration: 'Вибрация',

        continueAd: 'Продолжить за рекламу',
        adLoading: 'Загрузка рекламы...',
        adNotAvailable: 'Реклама недоступна',
        x2CoinsAd: 'Удвоить монеты за рекламу',

        excellent: 'Отлично!',
        amazing: 'Потрясающе!',
        perfect: 'Идеально!',

        rowDropSoon: '⚠️ Ряд спустится через 2 хода!',
        rowDropped: '⬇️ Ряд спустился!',

        clearBonus: '🎉 Поле очищено! +{bonus}',
        newRecord: '🏆 Новый рекорд!',

        leaderboardEmpty: 'Рейтинг пока пуст',
        you: 'Вы',

        earned: 'Заработано',

        boosterBomb: 'Бомба',
        boosterBombDesc: 'Взрывает всё в радиусе',
        boosterFreeze: 'Заморозка',
        boosterFreezeDesc: '5 ходов без спуска',
        boosterColor: 'Смена цвета',
        boosterColorDesc: 'Меняет цвет шарика',

        bombActivated: '💣 Бомба заряжена!',
        freezeActivated: '❄️ Заморозка на 5 ходов!',
        freezeActive: '❄️ Осталось: {n}',
        freezeAlreadyActive: '❄️ Уже активно!',
        colorChanged: '🎨 Цвет изменён!',

        noBooster: 'Нет бустера',
        notEnoughCoins: 'Недостаточно монет',
        boosterMax: 'Максимум бустеров',
        bought: '✅ Куплено!',

        boostersTitle: 'Бустеры',
        boostersEmpty: 'Пусто',

        // 🎯 VK
        addToFavorites: 'В избранное',
        support: 'Сообщество',
        openVkLeaderboard: 'Открыть рейтинг VK',
        yourBest: 'Ваш рекорд',
        favoritesAdded: '⭐ Добавлено в избранное!',
        favoritesFailed: 'Не удалось добавить',
        joinedCommunity: '✅ Спасибо за подписку!',
        joinCommunityFailed: 'Вы можете подписаться позже',
        communityUnavailable: 'Подписка доступна только в VK',
        vkOnly: 'Доступно только в VK',

        tutSkip: 'Пропустить',
        tutNext: 'Далее',
        tutFinish: 'Поехали!',

        tutAimTitle: 'Прицелься и стреляй',
        tutAimBody: 'Веди пальцем по экрану — появится <b>линия прицела</b>. Она покажет, куда полетит шарик, включая <span class="tip">отскоки от стен</span>. Отпусти палец — выстрел.',

        tutSwapTitle: 'Меняй шарики',
        tutSwapBody: 'Тапни по <b>шарику справа</b>, чтобы поменять его местами с текущим.',

        tutCounterTitle: 'Следи за счётчиком',
        tutCounterBody: '⬇️ — <b>счётчик ходов</b>. Показывает, через сколько выстрелов спустится новый ряд. Когда станет <span class="tip">2</span> — готовься!',

        tutClusterTitle: 'Собирай кластеры',
        tutClusterBody: 'Стреляй в <b>3+ шарика одного цвета</b> — они лопнут. Шарики без опоры упадут и дадут бонус.',

        tutFireTitle: 'Огненный шарик',
        tutFireBody: 'Шарик с 🔥 взрывает <b>всё вокруг себя</b>. Попади им в гущу — и снесёшь пол-экрана!',

        tutBoosterTitle: 'Бустеры',
        tutBoosterBody: 'Внизу слева — <b>кнопка ⚡</b>. Нажми — раскроются бустеры: 💣 бомба, ❄️ заморозка, 🎨 смена цвета. Покупай их в магазине!',
    },

    en: {
        loading: 'Loading...',
        initializing: 'Initializing...',
        back: 'Back',
        menu: 'Menu',
        restart: 'Restart',
        playAgain: 'Play Again',
        resumePlay: 'Resume',

        play: 'Play',
        leaderboard: 'Leaderboard',
        settings: 'Settings',
        shop: 'Shop',
        best: 'Best Score',

        score: 'Score',
        bestScore: 'Best',
        coins: 'Coins',

        pause: 'Pause',
        gameover: 'Game Over',

        sound: 'Sound',
        music: 'Music',
        vibration: 'Vibration',

        continueAd: 'Continue for Ad',
        adLoading: 'Loading ad...',
        adNotAvailable: 'Ad not available',
        x2CoinsAd: 'Double coins for Ad',

        excellent: 'Excellent!',
        amazing: 'Amazing!',
        perfect: 'Perfect!',

        rowDropSoon: '⚠️ Row drops in 2 shots!',
        rowDropped: '⬇️ Row dropped!',

        clearBonus: '🎉 Board cleared! +{bonus}',
        newRecord: '🏆 New record!',

        leaderboardEmpty: 'Leaderboard is empty',
        you: 'You',

        earned: 'Earned',

        boosterBomb: 'Bomb',
        boosterBombDesc: 'Explodes everything around',
        boosterFreeze: 'Freeze',
        boosterFreezeDesc: '5 shots without drops',
        boosterColor: 'Color Swap',
        boosterColorDesc: 'Changes bubble color',

        bombActivated: '💣 Bomb loaded!',
        freezeActivated: '❄️ Frozen for 5 shots!',
        freezeActive: '❄️ Left: {n}',
        freezeAlreadyActive: '❄️ Already active!',
        colorChanged: '🎨 Color changed!',

        noBooster: 'No booster',
        notEnoughCoins: 'Not enough coins',
        boosterMax: 'Max boosters',
        bought: '✅ Bought!',

        boostersTitle: 'Boosters',
        boostersEmpty: 'Empty',

        // 🎯 VK
        addToFavorites: 'Add to favorites',
        support: 'Community',
        openVkLeaderboard: 'Open VK leaderboard',
        yourBest: 'Your best',
        favoritesAdded: '⭐ Added to favorites!',
        favoritesFailed: 'Could not add',
        joinedCommunity: '✅ Thanks for joining!',
        joinCommunityFailed: 'You can join later',
        communityUnavailable: 'Joining is available in VK only',
        vkOnly: 'Available in VK only',

        tutSkip: 'Skip',
        tutNext: 'Next',
        tutFinish: "Let's go!",

        tutAimTitle: 'Aim and shoot',
        tutAimBody: 'Drag your finger — an <b>aim line</b> appears. Release to shoot.',

        tutSwapTitle: 'Swap bubbles',
        tutSwapBody: 'Tap the <b>bubble on the right</b> to swap it.',

        tutCounterTitle: 'Watch the counter',
        tutCounterBody: '⬇️ is the <b>shot counter</b>. When it hits <span class="tip">2</span> — get ready!',

        tutClusterTitle: 'Build clusters',
        tutClusterBody: 'Shoot <b>3+ bubbles of the same color</b> — they pop.',

        tutFireTitle: 'Fire bubble',
        tutFireBody: 'A 🔥 bubble <b>explodes everything around it</b>!',

        tutBoosterTitle: 'Boosters',
        tutBoosterBody: 'Bottom-left — <b>⚡ button</b>. Tap to open: 💣 bomb, ❄️ freeze, 🎨 color. Buy them in the shop!',
    }
};

let _currentLang = 'ru';

function setLang(lang) {
    _currentLang = (lang === 'en') ? 'en' : 'ru';
    document.documentElement.lang = _currentLang;
    console.log('🌐 Locales: language set to', _currentLang);
}

function getLang() {
    return _currentLang;
}

function t(key, vars) {
    const dict = LOCALES[_currentLang] || LOCALES.ru;
    let str = dict[key];
    if (str === undefined) str = LOCALES.ru[key] || key;
    if (vars) {
        for (const k in vars) {
            str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
        }
    }
    return str;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        el.textContent = t(key);
    });
}

window.LOCALES = LOCALES;
window.setLang = setLang;
window.getLang = getLang;
window.t = t;
window.applyTranslations = applyTranslations;