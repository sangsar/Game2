// ─── متغیرهای سراسری ────────────────────────────────────────────
let game = null;
let currentLanguage = 'fa';
let currentTheme = 'noir';
let typingSpeed = 40;
let currentStory = null;

// ─── کلاس Game ──────────────────────────────────────────────────
class Game {
  constructor() {
    this.state = null;
    this.storyData = null;
    this.isTyping = false;
    this.typingTimer = null;
  }

  // ── نمایش منو ──────────────────────────────────────────────────
  showMenu() {
    const menu = document.getElementById('main-menu');
    const header = document.getElementById('game-header');
    const container = document.getElementById('game-container');
    const footer = document.getElementById('game-footer');
    
    if (menu) menu.classList.remove('hidden');
    if (header) header.style.display = 'none';
    if (container) container.style.display = 'none';
    if (footer) footer.style.display = 'none';
  }

  // ── مخفی کردن منو ──────────────────────────────────────────────
  hideMenu() {
    const menu = document.getElementById('main-menu');
    const header = document.getElementById('game-header');
    const container = document.getElementById('game-container');
    const footer = document.getElementById('game-footer');
    
    if (menu) menu.classList.add('hidden');
    if (header) header.style.display = 'flex';
    if (container) container.style.display = 'block';
    if (footer) footer.style.display = 'flex';
  }

  // ── شروع بازی جدید ────────────────────────────────────────────
  startNewGame() {
    console.log('startNewGame() called');
    
    // تنظیم داستان بر اساس زبان فعلی
    this.storyData = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
    
    // حالت اولیه
    this.state = {
      currentScene: 'intro',
      params: { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 },
      history: [],
      choicesMade: {},
      theme: currentTheme,
      language: currentLanguage,
      gameStarted: true
    };
    
    // مخفی کردن منو و نمایش بازی
    this.hideMenu();
    
    // رندر صحنه اول
    this.renderScene('intro');
    
    // ذخیره
    this._save();
  }

  // ── ادامه بازی ──────────────────────────────────────────────────
  continueGame() {
    const saved = this._load();
    if (saved && saved.gameStarted) {
      this.state = saved;
      this.storyData = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
      this.hideMenu();
      if (saved.theme) this.setTheme(saved.theme);
      this.renderScene(this.state.currentScene);
    } else {
      this.startNewGame();
    }
  }

  // ── مقداردهی اولیه ────────────────────────────────────────────
  initGame() {
    console.log('initGame() called');
    
    // تنظیم داستان
    this.storyData = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
    
    // بارگذاری ذخیره
    const saved = this._load();
    if (saved && saved.gameStarted) {
      this.state = saved;
      this.storyData = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
      if (saved.theme) this.setTheme(saved.theme);
      this.hideMenu();
      this.renderScene(this.state.currentScene);
    } else {
      this.state = {
        currentScene: 'intro',
        params: { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 },
        history: [],
        choicesMade: {},
        theme: currentTheme,
        language: currentLanguage,
        gameStarted: false
      };
      this.showMenu();
    }
    
    this._save();
  }

  // ── رندر صحنه ────────────────────────────────────────────────
  renderScene(sceneId) {
    console.log('renderScene() called for:', sceneId);
    
    if (!this.storyData) {
      console.error('storyData is null!');
      return;
    }
    
    const scene = this.storyData[sceneId];
    if (!scene) {
      console.error('Scene not found:', sceneId);
      return;
    }

    if (!this.state.history.includes(sceneId)) {
      this.state.history.push(sceneId);
    }
    this.state.currentScene = sceneId;
    this._save();

    if (scene.isEnding) {
      this.showEnding(scene);
      return;
    }

    const container = document.getElementById('game-container');
    if (!container) {
      console.error('game-container not found');
      return;
    }

    const narrativeText = scene.text.join('\n');

    const choicesHtml = scene.choices && scene.choices.length > 0
      ? scene.choices.map((choice, idx) =>
          `<button class="choice-btn" data-scene="${sceneId}" data-choice="${idx}">
            ${choice.label}
           </button>`
        ).join('')
      : '<p class="no-choices">[ پایان صحنه ]</p>';

    container.innerHTML = `
      <div class="scene" role="main">
        <pre class="narrative" id="narrative-text">${this._escapeHtml(narrativeText)}</pre>
        <div class="choices" id="choices-container" style="display:flex;">${choicesHtml}</div>
      </div>
    `;

    this._attachChoiceListeners(sceneId);
    container.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── اتصال رویدادهای انتخاب ──────────────────────────────────
  _attachChoiceListeners(sceneId) {
    document.querySelectorAll('.choice-btn').forEach((btn) => {
      btn.removeEventListener('click', this._choiceHandler);
      btn.addEventListener('click', this._choiceHandler = (e) => {
        const choiceIdx = parseInt(btn.dataset.choice, 10);
        this.makeChoice(sceneId, choiceIdx);
      });
    });
  }

  // ── انتخاب ────────────────────────────────────────────────────
  makeChoice(sceneId, choiceIndex) {
    const scene = this.storyData[sceneId];
    if (!scene) return;

    const choice = scene.choices[choiceIndex];
    if (!choice) return;

    this.state.choicesMade[sceneId] = choiceIndex;

    if (choice.params) {
      for (const [param, delta] of Object.entries(choice.params)) {
        if (this.state.params.hasOwnProperty(param)) {
          this.state.params[param] += delta;
        }
      }
    }

    this._save();
    this.renderScene(choice.next);
  }

  // ── ذخیره ────────────────────────────────────────────────────
  _save() {
    try {
      localStorage.setItem('fallen_angels_save', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  // ── بارگذاری ─────────────────────────────────────────────────
  _load() {
    try {
      const raw = localStorage.getItem('fallen_angels_save');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.currentScene || !parsed.params) return null;
      return parsed;
    } catch (e) {
      console.warn('Load failed:', e);
      return null;
    }
  }

  // ── امن‌سازی HTML ────────────────────────────────────────────
  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ─── راه‌اندازی ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired');
  
  // ایجاد نمونه بازی
  game = new Game();
  
  // تنظیم داستان
  currentStory = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
  
  // مقداردهی اولیه
  game.initGame();
  
  // ============================================================
  // دکمه‌های منو – با چند روش مختلف برای اطمینان
  // ============================================================
  
  const startBtn = document.getElementById('menu-new-game');
  const continueBtn = document.getElementById('menu-continue');
  const settingsBtn = document.getElementById('menu-settings');
  
  if (startBtn) {
    console.log('Start button found');
    startBtn.onclick = function(e) {
      e.preventDefault();
      console.log('Start button clicked');
      if (game) {
        game.startNewGame();
      } else {
        console.error('game is null!');
      }
    };
  } else {
    console.error('Start button not found!');
  }
  
  if (continueBtn) {
    continueBtn.onclick = function(e) {
      e.preventDefault();
      if (game) game.continueGame();
    };
  }
  
  if (settingsBtn) {
    settingsBtn.onclick = function(e) {
      e.preventDefault();
      toggleSettings();
    };
  }
  
  // دکمه‌های هدر
  const langBtn = document.getElementById('lang-switch');
  if (langBtn) {
    langBtn.onclick = function() {
      switchLanguage();
    };
  }
  
  const themeBtn = document.getElementById('theme-switch');
  if (themeBtn) {
    themeBtn.onclick = function() {
      switchTheme();
    };
  }
});

// ─── متغیرهای سراسری ────────────────────────────────────────────
window.game = game;
