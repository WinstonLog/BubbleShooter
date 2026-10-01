// ============================================================
// ЛОКАЛИЗАЦИЯ (RU / EN) — Цветной Взрыв
// ============================================================

const LOCALES = {
    ru: {
        // --- Название игры ---
        title: 'Цветной Взрыв',
        subtitle: 'Игра-аркада с шариками',

        // --- Общие ---
        loading: 'Загрузка...',
        initializing: 'Инициализация...',
        back: 'Назад',
        menu: 'В меню',
        restart: 'Заново',
        playAgain: 'Ещё раз',
        resumePlay: 'Продолжить',
        close: 'Закрыть',

        // --- Главное меню ---
        play: 'Играть',
        leaderboard: 'Рейтинг',
        settings: 'Настройки',
        shop: 'Магазин',
        best: 'Лучший счёт',

        // --- HUD / экраны ---
        score: 'Очки',
        bestScore: 'Рекорд',
        coins: 'Монеты',
        pause: 'Пауза',
        gameover: 'Игра окончена',

        // --- Настройки ---
        sound: 'Звук',
        music: 'Музыка',
        vibration: 'Вибрация',

        // --- Реклама ---
        continueAd: 'Продолжить за рекламу',
        adLoading: 'Загрузка рекламы...',
        adNotAvailable: 'Реклама недоступна',
        x2CoinsAd: 'Удвоить монеты за рекламу',

        // --- Комбо / игровые события ---
        excellent: 'Отлично!',
        amazing: 'Потрясающе!',
        perfect: 'Идеально!',

        rowDropSoon: '⚠️ Ряд спустится через 2 хода!',
        rowDropped: '⬇️ Ряд спустился!',

        clearBonus: '🎉 Поле очищено! +{bonus}',
        newRecord: '🏆 Новый рекорд!',

        // --- Рейтинг ---
        leaderboardEmpty: 'Рейтинг пока пуст',
        you: 'Вы',
        yourBest: 'Ваш рекорд',
        openVkLeaderboard: 'Открыть рейтинг VK',

        // --- Монеты / бустеры ---
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

        // --- VK ---
        addToFavorites: 'В избранное',
        support: 'Сообщество',
        favoritesAdded: '⭐ Добавлено в избранное!',
        favoritesFailed: 'Не удалось добавить',
        joinedCommunity: '✅ Спасибо за подписку!',
        joinCommunityFailed: 'Вы можете подписаться позже',
        communityUnavailable: 'Подписка доступна только в VK',
        vkOnly: 'Доступно только в VK',
        lbVkHint: 'Нажми «Открыть рейтинг VK», чтобы увидеть таблицу лидеров',
        loadError: 'Не удалось загрузить прогресс. Играем локально',

        // --- Туториал ---
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
        tutBoosterBody: 'Внизу слева — <b>кнопка ⚡</b>. Нажми — раскроются бустеры: 💣 бомба, ❄️ заморозка, 🎨 смена цвета. Покупай их в магазине!'
    },

    en: {
        // --- Game title ---
        title: 'Color Burst',
        subtitle: 'Bubble arcade game',

        // --- Common ---
        loading: 'Loading...',
        initializing: 'Initializing...',
        back: 'Back',
        menu: 'Menu',
        restart: 'Restart',
        playAgain: 'Play Again',
        resumePlay: 'Resume',
        close: 'Close',

        // --- Main menu ---
        play: 'Play',
        leaderboard: 'Leaderboard',
        settings: 'Settings',
        shop: 'Shop',
        best: 'Best Score',

        // --- HUD / screens ---
        score: 'Score',
        bestScore: 'Best',
        coins: 'Coins',
        pause: 'Pause',
        gameover: 'Game Over',

        // --- Settings ---
        sound: 'Sound',
        music: 'Music',
        vibration: 'Vibration',

        // --- Ads ---
        continueAd: 'Continue for Ad',
        adLoading: 'Loading ad...',
        adNotAvailable: 'Ad not available',
        x2CoinsAd: 'Double coins for Ad',

        // --- Combo / game events ---
        excellent: 'Excellent!',
        amazing: 'Amazing!',
        perfect: 'Perfect!',

        rowDropSoon: '⚠️ Row drops in 2 shots!',
        rowDropped: '⬇️ Row dropped!',

        clearBonus: '🎉 Board cleared! +{bonus}',
        newRecord: '🏆 New record!',

        // --- Leaderboard ---
        leaderboardEmpty: 'Leaderboard is empty',
        you: 'You',
        yourBest: 'Your best',
        openVkLeaderboard: 'Open VK leaderboard',

        // --- Coins / boosters ---
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

        // --- VK ---
        addToFavorites: 'Add to favorites',
        support: 'Community',
        favoritesAdded: '⭐ Added to favorites!',
        favoritesFailed: 'Could not add',
        joinedCommunity: '✅ Thanks for joining!',
        joinCommunityFailed: 'You can join later',
        communityUnavailable: 'Joining is available in VK only',
        vkOnly: 'Available in VK only',
        lbVkHint: 'Tap "Open VK leaderboard" to see the global ranking',
        loadError: 'Failed to load progress. Playing locally',

        // --- Tutorial ---
        tutSkip: 'Skip',
        tutNext: 'Next',
        tutFinish: "Let's go!",

        tutAimTitle: 'Aim and shoot',
        tutAimBody: 'Drag your finger — an <b>aim line</b> appears. It shows where the bubble will fly, including <span class="tip">wall bounces</span>. Release to shoot.',

        tutSwapTitle: 'Swap bubbles',
        tutSwapBody: 'Tap the <b>bubble on the right</b> to swap it with the current one.',

        tutCounterTitle: 'Watch the counter',
        tutCounterBody: '⬇️ is the <b>shot counter</b>. It shows how many shots until a new row drops. When it hits <span class="tip">2</span> — get ready!',

        tutClusterTitle: 'Build clusters',
        tutClusterBody: 'Shoot <b>3+ bubbles of the same color</b> — they pop. Bubbles without support will fall and give bonus points.',

        tutFireTitle: 'Fire bubble',
        tutFireBody: 'A 🔥 bubble <b>explodes everything around it</b>. Hit the thick of it — and wipe out half the screen!',

        tutBoosterTitle: 'Boosters',
        tutBoosterBody: 'Bottom-left — <b>⚡ button</b>. Tap to open: 💣 bomb, ❄️ freeze, 🎨 color. Buy them in the shop!'
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