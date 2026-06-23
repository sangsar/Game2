/**
 * ============================================================
 *  GAME ENGINE – The Fall of Angels
 *  مدیریت کامل بازی، رندر صحنه‌ها، تغییر زبان، ذخیره‌سازی
 * ============================================================
 */

'use strict';

// ─── متغیرهای سراسری ────────────────────────────────────────────
let currentLanguage = 'fa';   // 'fa' یا 'en'
let game = null;

// ─── کلاس Game ──────────────────────────────────────────────────
class Game {
  constructor() {
    this.state = null;
    this.storyData = STORY; // پیش‌فرض فارسی
  }

  // ── تنظیم تم ──────────────────────────────────────────────────
  setTheme(themeName) {
    document.body.classList.remove('theme-retro', 'theme-noir');
    document.body.classList.add(`theme-${themeName}`);
    if (this.state) {
      this.state.theme = themeName;
      this._save();
    }
  }

  // ── مقداردهی اولیه ────────────────────────────────────────────
  initGame() {
    const saved = this._load();
    if (saved) {
      this.state = saved;
    } else {
      this.state = this._getInitialState();
    }
    // انتخاب داستان بر اساس زبان فعلی
    this.storyData = (currentLanguage === 'en') ? STORY2 : STORY;
    this.setTheme(this.state.theme || 'noir');
    this.renderScene(this.state.currentScene);
  }

  // ── ریست ──────────────────────────────────────────────────────
  reset() {
    localStorage.removeItem('fallen_angels_save');
    this.state = this._getInitialState();
    this.storyData = (currentLanguage === 'en') ? STORY2 : STORY;
    this.setTheme('noir');
    this.renderScene('intro');
  }

  // ── رندر صحنه ────────────────────────────────────────────────
  renderScene(sceneId) {
    const scene = this.storyData[sceneId];
    if (!scene) {
      console.error(`Scene not found: ${sceneId}`);
      return;
    }

    // ذخیره‌سازی وضعیت
    if (!this.state.history.includes(sceneId)) {
      this.state.history.push(sceneId);
    }
    this.state.currentScene = sceneId;
    this._save();

    // پایان بازی؟
    if (scene.isEnding) {
      this.showEnding(scene);
      return;
    }

    const container = document.getElementById('game-container');
    if (!container) {
      console.error('Element #game-container not found.');
      return;
    }

    const narrativeText = scene.text.join('\n');

    const choicesHtml = scene.choices.length > 0
      ? scene.choices
          .map((choice, idx) =>
            `<button class="choice-btn" data-scene="${sceneId}" data-choice="${idx}">
              ${choice.label}
             </button>`
          )
          .join('')
      : '<p class="no-choices">[ پایان صحنه ]</p>';

    container.innerHTML = `
      <div class="scene" role="main">
        <pre class="narrative">${this._escapeHtml(narrativeText)}</pre>
        <div class="choices">${choicesHtml}</div>
      </div>
    `;

    // رویدادهای دکمه‌ها
    container.querySelectorAll('.choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const choiceIdx = parseInt(btn.dataset.choice, 10);
        this.makeChoice(sceneId, choiceIdx);
      });
    });

    container.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ── نمایش پایان ──────────────────────────────────────────────
  showEnding(scene) {
    const p = this.state.params;

    const profile = this._findProfile(p);
    const sceneText = scene.text.join('\n');

    const container = document.getElementById('game-container');
    if (!container) return;

    container.innerHTML = `
      <div class="scene ending">
        <pre class="narrative">${this._escapeHtml(sceneText)}</pre>
        <div class="profile-card">
          <div class="profile-title">━━━━━━━━━━━━━━━━━━━━━</div>
          <div class="profile-title">پروفایل ویلیام</div>
          <div class="profile-title">━━━━━━━━━━━━━━━━━━━━━</div>
          <div class="profile-label">${profile.label}</div>
          <div class="profile-text">${profile.text}</div>
        </div>
        <div class="choices">
          <button class="choice-btn restart-btn" id="restart-btn">شروع دوباره</button>
        </div>
      </div>
    `;

    document.getElementById('restart-btn')?.addEventListener('click', () => {
      this.reset();
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── یافتن پروفایل شخصیتی ────────────────────────────────────
  _findProfile(params) {
    for (const pr of PROFILES) {
      if (pr.condition(params)) return pr;
    }
    return PROFILES[PROFILES.length - 1];
  }

  // ── وضعیت اولیه ──────────────────────────────────────────────
  _getInitialState() {
    return {
      currentScene: 'intro',
      params: { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 },
      history: [],
      choicesMade: {},
      theme: 'noir',
    };
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

// ─── تغییر زبان ────────────────────────────────────────────────
function switchLanguage() {
  const btn = document.getElementById('lang-switch');
  const label = document.getElementById('lang-label');
  const caseId = document.getElementById('case-id');
  const mainTitle = document.getElementById('main-title');
  const subtitle = document.getElementById('subtitle');
  const statusText = document.getElementById('status-text');

  // انیمیشن دکمه
  btn.classList.add('switching');

  if (currentLanguage === 'fa') {
    currentLanguage = 'en';
    label.textContent = 'فارسی';
    caseId.textContent = 'CASE FILE #011';
    mainTitle.textContent = 'The Fall of Angels';
    subtitle.textContent = '— A Noir Detective Story —';
    statusText.textContent = 'ACTIVE';
    // تغییر داستان به انگلیسی
    if (game) game.storyData = STORY2;
  } else {
    currentLanguage = 'fa';
    label.textContent = 'English';
    caseId.textContent = 'پرونده #۰۱۱';
    mainTitle.textContent = 'سقوط فرشته‌ها';
    subtitle.textContent = '— داستانی کارآگاهی نوآر —';
    statusText.textContent = 'فعال';
    if (game) game.storyData = STORY;
  }

  // ریست بازی با داستان جدید
  if (game) {
    game.reset();
  }

  // حذف انیمیشن بعد از اتمام
  setTimeout(() => {
    btn.classList.remove('switching');
  }, 600);
}

// ─── راه‌اندازی ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // ایجاد نمونه بازی
  game = new Game();
  game.initGame();

  // دکمه‌ی تغییر زبان
  const langBtn = document.getElementById('lang-switch');
  if (langBtn) {
    langBtn.addEventListener('click', switchLanguage);
  }

  // دکمه‌ی ریست (اختیاری در HTML)
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('آیا مطمئن هستید؟ تمام پیشرفت شما از بین می‌رود.')) {
        game.reset();
      }
    });
  }
});

// ─── متغیرهای سراسری برای دسترسی آسان ────────────────────────
window.switchLanguage = switchLanguage;
window.game = game;
