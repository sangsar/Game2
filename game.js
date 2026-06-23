/**
 * =============================================================
 *  FALL OF ANGELS — Game Engine
 *  ورژن جدید با معماری تمیز، منو، تنظیمات، ۶ تم
 *  فایل‌های استوری: story_fa.js (STORY_FA) و story_en.js (STORY_EN)
 * =============================================================
 */

'use strict';

// ─── STATE ──────────────────────────────────────────────────────
const STATE = {
    lang: 'fa',
    theme: 'noir',
    typingSpeed: 40,
    gameStarted: false,
    currentScene: 'intro',
    params: { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 },
    history: [],
    choicesMade: {},
    storyData: null
};

// ─── DOM REFS ──────────────────────────────────────────────────
const DOM = {
    menu: document.getElementById('menu-overlay'),
    settings: document.getElementById('settings-panel'),
    header: document.getElementById('game-header'),
    container: document.getElementById('game-container'),
    footer: document.getElementById('game-footer'),
    caseId: document.getElementById('case-id'),
    headerTitle: document.getElementById('header-title'),
    headerSub: document.getElementById('header-sub'),
    statusText: document.getElementById('status-text'),
    speedSlider: document.getElementById('typing-speed'),
    speedLabel: document.getElementById('speed-label'),
};

// ─── UTILITY ──────────────────────────────────────────────────
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getStory() {
    return STATE.lang === 'en' ? STORY_EN : STORY_FA;
}

function getProfile(params) {
    for (const p of PROFILES) {
        if (p.condition(params)) return p;
    }
    return PROFILES[PROFILES.length - 1];
}

// ─── SAVE / LOAD ──────────────────────────────────────────────
function saveGame() {
    try {
        localStorage.setItem('fallen_angels_v2', JSON.stringify({
            lang: STATE.lang,
            theme: STATE.theme,
            gameStarted: STATE.gameStarted,
            currentScene: STATE.currentScene,
            params: STATE.params,
            history: STATE.history,
            choicesMade: STATE.choicesMade
        }));
    } catch (e) {}
}

function loadGame() {
    try {
        const raw = localStorage.getItem('fallen_angels_v2');
        if (!raw) return false;
        const data = JSON.parse(raw);
        STATE.lang = data.lang || 'fa';
        STATE.theme = data.theme || 'noir';
        STATE.gameStarted = data.gameStarted || false;
        STATE.currentScene = data.currentScene || 'intro';
        STATE.params = data.params || { justice:0, empathy:0, pragmatism:0, doubt:0, resolve:0 };
        STATE.history = data.history || [];
        STATE.choicesMade = data.choicesMade || {};
        return true;
    } catch (e) {
        return false;
    }
}

// ─── THEME ─────────────────────────────────────────────────────
function applyTheme(theme) {
    const themes = ['noir', 'blood', 'retro', 'ice', 'silver', 'royal'];
    document.body.classList.remove(...themes.map(t => `theme-${t}`));
    document.body.classList.add(`theme-${theme}`);
    STATE.theme = theme;
    document.querySelectorAll('.set-btn[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    saveGame();
}

// ─── LANGUAGE ─────────────────────────────────────────────────
function applyLanguage(lang) {
    STATE.lang = lang;
    STATE.storyData = getStory();
    document.querySelectorAll('.set-btn[data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    updateUIStrings();
    saveGame();
}

function updateUIStrings() {
    const isEn = STATE.lang === 'en';
    DOM.caseId.textContent = isEn ? 'CASE FILE #011' : 'پرونده #۰۱۱';
    DOM.headerTitle.textContent = isEn ? 'The Fall of Angels' : 'سقوط فرشته‌ها';
    DOM.headerSub.textContent = isEn ? '— A Noir Detective Story —' : '— داستانی کارآگاهی نوآر —';
    DOM.statusText.textContent = isEn ? 'ACTIVE' : 'فعال';
    document.querySelector('.logo-title').textContent = isEn ? 'The Fall of Angels' : 'سقوط فرشته‌ها';
    document.querySelector('.logo-sub').textContent = isEn ? '— Case File #011 —' : '— پرونده‌ی سقوط فرشته‌ها —';
    document.getElementById('btn-start').textContent = isEn ? 'New Game' : 'شروع بازی جدید';
    document.getElementById('btn-continue').textContent = isEn ? 'Continue' : 'ادامه بازی';
    document.getElementById('btn-settings').textContent = isEn ? '⚙️ Settings' : '⚙️ تنظیمات';
    document.querySelector('.menu-footer span').textContent = isEn ? '🕵️ Fremant P.D. — Case #011' : '🕵️ Fremant P.D. — پرونده #۰۱۱';
    document.querySelector('#settings-panel h2').textContent = isEn ? 'Settings' : 'تنظیمات';
    document.querySelector('#btn-close-settings').textContent = isEn ? 'Close' : 'بستن';
}

// ─── RENDER ────────────────────────────────────────────────────
function renderScene(sceneId) {
    const story = STATE.storyData || getStory();
    const scene = story[sceneId];
    if (!scene) {
        console.error('Scene not found:', sceneId);
        return;
    }

    STATE.currentScene = sceneId;
    if (!STATE.history.includes(sceneId)) STATE.history.push(sceneId);
    saveGame();

    if (scene.isEnding) {
        renderEnding(scene);
        return;
    }

    const narrative = scene.text.join('\n');
    const choicesHtml = (scene.choices && scene.choices.length > 0)
        ? scene.choices.map((c, i) =>
            `<button class="choice-btn" data-scene="${sceneId}" data-choice="${i}">${c.label}</button>`
          ).join('')
        : '<p class="no-choices">[ پایان صحنه ]</p>';

    DOM.container.innerHTML = `
        <div class="scene-box">
            <pre class="narrative">${escapeHtml(narrative)}</pre>
            <div class="choices">${choicesHtml}</div>
        </div>
    `;

    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.choice, 10);
            makeChoice(sceneId, idx);
        });
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function makeChoice(sceneId, choiceIndex) {
    const story = STATE.storyData || getStory();
    const scene = story[sceneId];
    if (!scene) return;
    const choice = scene.choices[choiceIndex];
    if (!choice) return;

    STATE.choicesMade[sceneId] = choiceIndex;
    if (choice.params) {
        for (const [key, val] of Object.entries(choice.params)) {
            if (STATE.params.hasOwnProperty(key)) STATE.params[key] += val;
        }
    }
    saveGame();
    renderScene(choice.next);
}

function renderEnding(scene) {
    const profile = getProfile(STATE.params);
    const sceneText = scene.text.join('\n');
    const isEn = STATE.lang === 'en';

    DOM.container.innerHTML = `
        <div class="scene-box ending">
            <pre class="narrative">${escapeHtml(sceneText)}</pre>
            <div class="profile-card">
                <div class="profile-title">━━━━━━━━━━━━━━━━━━━━━</div>
                <div class="profile-title">${isEn ? "William's Profile" : 'پروفایل ویلیام'}</div>
                <div class="profile-title">━━━━━━━━━━━━━━━━━━━━━</div>
                <div class="profile-label">${profile.label}</div>
                <div class="profile-text">${profile.text}</div>
            </div>
            <div class="choices">
                <button class="choice-btn restart-btn" id="btn-restart">${isEn ? 'Start Over' : 'شروع دوباره'}</button>
            </div>
        </div>
    `;

    document.getElementById('btn-restart')?.addEventListener('click', startNewGame);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── GAME ACTIONS ─────────────────────────────────────────────
function startNewGame() {
    STATE.gameStarted = true;
    STATE.currentScene = 'intro';
    STATE.params = { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 };
    STATE.history = [];
    STATE.choicesMade = {};
    STATE.storyData = getStory();
    hideMenu();
    renderScene('intro');
    saveGame();
}

function continueGame() {
    if (STATE.gameStarted) {
        STATE.storyData = getStory();
        hideMenu();
        renderScene(STATE.currentScene);
    } else {
        startNewGame();
    }
}

// ─── MENU ──────────────────────────────────────────────────────
function showMenu() {
    DOM.menu.classList.remove('hidden');
    DOM.header.style.display = 'none';
    DOM.container.style.display = 'none';
    DOM.footer.style.display = 'none';
}

function hideMenu() {
    DOM.menu.classList.add('hidden');
    DOM.header.style.display = 'flex';
    DOM.container.style.display = 'block';
    DOM.footer.style.display = 'flex';
}

// ─── SETTINGS ──────────────────────────────────────────────────
function toggleSettings() {
    const show = DOM.settings.style.display === 'none';
    DOM.settings.style.display = show ? 'flex' : 'none';
}

function closeSettings() {
    DOM.settings.style.display = 'none';
}

// ─── INIT ──────────────────────────────────────────────────────
function init() {
    const hasSave = loadGame();
    STATE.storyData = getStory();

    // اعمال تم و زبان
    applyTheme(STATE.theme);
    applyLanguage(STATE.lang);

    // سرعت تایپ
    DOM.speedSlider.value = STATE.typingSpeed;
    DOM.speedLabel.textContent = STATE.typingSpeed;

    if (hasSave && STATE.gameStarted) {
        showMenu();
        // دکمه ادامه فعال
    } else {
        STATE.gameStarted = false;
        showMenu();
    }

    // ===== رویدادها =====
    document.getElementById('btn-start').addEventListener('click', startNewGame);
    document.getElementById('btn-continue').addEventListener('click', continueGame);
    document.getElementById('btn-settings').addEventListener('click', toggleSettings);
    document.getElementById('btn-close-settings').addEventListener('click', closeSettings);

    // تنظیمات: زبان
    document.querySelectorAll('.set-btn[data-lang]').forEach(btn => {
        btn.addEventListener('click', function() {
            applyLanguage(this.dataset.lang);
        });
    });

    // تنظیمات: تم
    document.querySelectorAll('.set-btn[data-theme]').forEach(btn => {
        btn.addEventListener('click', function() {
            applyTheme(this.dataset.theme);
        });
    });

    // تنظیمات: سرعت تایپ
    DOM.speedSlider.addEventListener('input', function() {
        STATE.typingSpeed = parseInt(this.value);
        DOM.speedLabel.textContent = STATE.typingSpeed;
        saveGame();
    });

    // کلیک بیرون تنظیمات
    DOM.settings.addEventListener('click', function(e) {
        if (e.target === this) closeSettings();
    });

    // Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeSettings();
    });

    // اگر بازی ذخیره شده بود و کاربر ادامه داد
    if (hasSave && STATE.gameStarted) {
        // منو نمایش داده میشه، کاربر خودش انتخاب میکنه
    }
}

// ─── START ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
