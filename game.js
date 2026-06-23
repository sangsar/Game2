/**
 * =============================================================
 *  FALL OF ANGELS — Game Engine v4
 *  با دکمه‌های زبان و تم در هدر + ذخیره‌سازی کامل
 * =============================================================
 */

'use strict';

console.log('🔍 game.js loaded');

// ===== CHECK STORY FILES =====
if (typeof STORY_FA === 'undefined') {
    console.error('❌ STORY_FA is not defined!');
}
if (typeof STORY_EN === 'undefined') {
    console.error('❌ STORY_EN is not defined!');
}

// ===== STATE =====
const STATE = {
    lang: 'fa',
    theme: 'noir',
    typingSpeed: 40,
    gameStarted: false,
    currentScene: 'intro',
    params: { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 },
    history: [],
    choicesMade: {},
};

// ===== DOM REFS =====
const $ = (id) => document.getElementById(id);
const DOM = {
    menu: $('menu-overlay'),
    settings: $('settings-panel'),
    header: $('game-header'),
    container: $('game-container'),
    footer: $('game-footer'),
    caseId: $('case-id'),
    headerTitle: $('header-title'),
    headerSub: $('header-sub'),
    statusText: $('status-text'),
    speedSlider: $('typing-speed'),
    speedLabel: $('speed-label'),
    btnStart: $('btn-start'),
    btnContinue: $('btn-continue'),
    btnSettings: $('btn-settings'),
    btnCloseSettings: $('btn-close-settings'),
    btnLang: $('btn-lang'),
    btnTheme: $('btn-theme'),
};

console.log('📦 DOM elements found:', {
    btnLang: !!DOM.btnLang,
    btnTheme: !!DOM.btnTheme,
});

// ===== UTILITY =====
function getStory() {
    if (STATE.lang === 'en') {
        if (typeof STORY_EN === 'undefined') {
            console.error('STORY_EN is undefined!');
            return null;
        }
        return STORY_EN;
    } else {
        if (typeof STORY_FA === 'undefined') {
            console.error('STORY_FA is undefined!');
            return null;
        }
        return STORY_FA;
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getProfile(params) {
    if (typeof PROFILES === 'undefined') {
        console.error('PROFILES is undefined!');
        return { label: 'Unknown', text: 'Profile not found.' };
    }
    for (const p of PROFILES) {
        if (p.condition(params)) return p;
    }
    return PROFILES[PROFILES.length - 1];
}

// ===== SAVE / LOAD =====
function saveGame() {
    try {
        const data = {
            lang: STATE.lang,
            theme: STATE.theme,
            gameStarted: STATE.gameStarted,
            currentScene: STATE.currentScene,
            params: STATE.params,
            history: STATE.history,
            choicesMade: STATE.choicesMade
        };
        localStorage.setItem('fallen_angels_v4', JSON.stringify(data));
        console.log('💾 Game saved:', data.currentScene);
    } catch (e) {
        console.warn('Save failed:', e);
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem('fallen_angels_v4');
        if (!raw) return false;
        const data = JSON.parse(raw);
        STATE.lang = data.lang || 'fa';
        STATE.theme = data.theme || 'noir';
        STATE.gameStarted = data.gameStarted || false;
        STATE.currentScene = data.currentScene || 'intro';
        STATE.params = data.params || { justice:0, empathy:0, pragmatism:0, doubt:0, resolve:0 };
        STATE.history = data.history || [];
        STATE.choicesMade = data.choicesMade || {};
        console.log('📂 Game loaded:', STATE.currentScene);
        return true;
    } catch (e) {
        console.warn('Load failed:', e);
        return false;
    }
}

// ===== THEME =====
function applyTheme(theme) {
    const themes = ['noir', 'blood', 'retro', 'ice', 'silver', 'royal'];
    document.body.classList.remove(...themes.map(t => `theme-${t}`));
    document.body.classList.add(`theme-${theme}`);
    STATE.theme = theme;
    
    // به‌روزرسانی دکمه‌های تنظیمات
    document.querySelectorAll('.set-btn[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    // به‌روزرسانی دکمه هدر
    if (DOM.btnTheme) {
        const labels = { noir:'🖤 Noir', blood:'🩸 Blood', retro:'📜 Retro', ice:'❄️ Ice', silver:'⚪ Silver', royal:'👑 Royal' };
        DOM.btnTheme.textContent = labels[theme] || '🎨 Theme';
    }
    
    saveGame();
    console.log('🎨 Theme applied:', theme);
}

// ===== LANGUAGE =====
function applyLanguage(lang) {
    STATE.lang = lang;
    
    // به‌روزرسانی دکمه‌های تنظیمات
    document.querySelectorAll('.set-btn[data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // به‌روزرسانی دکمه هدر
    if (DOM.btnLang) {
        DOM.btnLang.textContent = lang === 'fa' ? '🇮🇷 فارسی' : '🇬🇧 English';
    }
    
    updateUIStrings();
    saveGame();
    console.log('🌐 Language applied:', lang);
}

function updateUIStrings() {
    const isEn = STATE.lang === 'en';
    if (DOM.caseId) DOM.caseId.textContent = isEn ? 'CASE FILE #011' : 'پرونده #۰۱۱';
    if (DOM.headerTitle) DOM.headerTitle.textContent = isEn ? 'The Fall of Angels' : 'سقوط فرشته‌ها';
    if (DOM.headerSub) DOM.headerSub.textContent = isEn ? '— A Noir Detective Story —' : '— داستانی کارآگاهی نوآر —';
    if (DOM.statusText) DOM.statusText.textContent = isEn ? 'ACTIVE' : 'فعال';
    
    const logoTitle = document.querySelector('.logo-title');
    const logoSub = document.querySelector('.logo-sub');
    if (logoTitle) logoTitle.textContent = isEn ? 'The Fall of Angels' : 'سقوط فرشته‌ها';
    if (logoSub) logoSub.textContent = isEn ? '— Case File #011 —' : '— پرونده‌ی سقوط فرشته‌ها —';
    
    if (DOM.btnStart) DOM.btnStart.textContent = isEn ? 'New Game' : 'شروع بازی جدید';
    if (DOM.btnContinue) DOM.btnContinue.textContent = isEn ? 'Continue' : 'ادامه بازی';
    if (DOM.btnSettings) DOM.btnSettings.textContent = isEn ? '⚙️ Settings' : '⚙️ تنظیمات';
    
    const menuFooter = document.querySelector('.menu-footer span');
    if (menuFooter) menuFooter.textContent = isEn ? '🕵️ Fremant P.D. — Case #011' : '🕵️ Fremant P.D. — پرونده #۰۱۱';
    
    const settingsTitle = document.querySelector('#settings-panel h2');
    if (settingsTitle) settingsTitle.textContent = isEn ? 'Settings' : 'تنظیمات';
    if (DOM.btnCloseSettings) DOM.btnCloseSettings.textContent = isEn ? 'Close' : 'بستن';
}

// ===== RENDER =====
function renderScene(sceneId) {
    const story = getStory();
    if (!story) {
        console.error('❌ No story data available!');
        DOM.container.innerHTML = `<div class="scene-box"><p style="color:red;">خطا: داستان پیدا نشد. فایل‌های story_fa.js و story_en.js را بررسی کنید.</p></div>`;
        return;
    }

    const scene = story[sceneId];
    if (!scene) {
        console.error('❌ Scene not found:', sceneId);
        DOM.container.innerHTML = `<div class="scene-box"><p style="color:red;">خطا: صحنه "${sceneId}" پیدا نشد.</p></div>`;
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
    console.log('📖 Rendered scene:', sceneId);
}

function makeChoice(sceneId, choiceIndex) {
    const story = getStory();
    if (!story) return;
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

// ===== GAME ACTIONS =====
function startNewGame() {
    console.log('🚀 startNewGame() called');
    STATE.gameStarted = true;
    STATE.currentScene = 'intro';
    STATE.params = { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 };
    STATE.history = [];
    STATE.choicesMade = {};
    hideMenu();
    renderScene('intro');
    saveGame();
}

function continueGame() {
    console.log('🔄 continueGame() called');
    if (STATE.gameStarted) {
        hideMenu();
        renderScene(STATE.currentScene);
    } else {
        startNewGame();
    }
}

// ===== MENU =====
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

// ===== SETTINGS =====
function toggleSettings() {
    const show = DOM.settings.style.display === 'none';
    DOM.settings.style.display = show ? 'flex' : 'none';
}

function closeSettings() {
    DOM.settings.style.display = 'none';
}

// ===== INIT =====
function init() {
    const hasSave = loadGame();
    
    // اعمال تم و زبان
    applyTheme(STATE.theme);
    applyLanguage(STATE.lang);

    // سرعت تایپ
    DOM.speedSlider.value = STATE.typingSpeed;
    DOM.speedLabel.textContent = STATE.typingSpeed;

    if (hasSave && STATE.gameStarted) {
        showMenu();
    } else {
        STATE.gameStarted = false;
        showMenu();
    }

    // ===== رویدادهای منو =====
    DOM.btnStart?.addEventListener('click', startNewGame);
    DOM.btnContinue?.addEventListener('click', continueGame);
    DOM.btnSettings?.addEventListener('click', toggleSettings);
    DOM.btnCloseSettings?.addEventListener('click', closeSettings);

    // ===== رویدادهای تنظیمات =====
    document.querySelectorAll('.set-btn[data-lang]').forEach(btn => {
        btn.addEventListener('click', function() {
            applyLanguage(this.dataset.lang);
        });
    });

    document.querySelectorAll('.set-btn[data-theme]').forEach(btn => {
        btn.addEventListener('click', function() {
            applyTheme(this.dataset.theme);
        });
    });

    DOM.speedSlider?.addEventListener('input', function() {
        STATE.typingSpeed = parseInt(this.value);
        DOM.speedLabel.textContent = STATE.typingSpeed;
        saveGame();
    });

    // ===== رویدادهای هدر (دکمه‌های زبان و تم) =====
    DOM.btnLang?.addEventListener('click', function() {
        const newLang = STATE.lang === 'fa' ? 'en' : 'fa';
        applyLanguage(newLang);
        // اگر بازی شروع شده، داستان رو با زبان جدید دوباره رندر کن
        if (STATE.gameStarted) {
            renderScene(STATE.currentScene);
        }
    });

    DOM.btnTheme?.addEventListener('click', function() {
        const themes = ['noir', 'blood', 'retro', 'ice', 'silver', 'royal'];
        const currentIndex = themes.indexOf(STATE.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        applyTheme(themes[nextIndex]);
    });

    // کلیک بیرون تنظیمات
    DOM.settings?.addEventListener('click', function(e) {
        if (e.target === this) closeSettings();
    });

    // Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeSettings();
    });

    console.log('✅ Game initialized successfully');
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
