'use strict';

// ─── متغیرهای سراسری ────────────────────────────────────────────
let game = null;
let currentLanguage = 'fa';
let currentTheme = 'noir';

// ─── کلاس Game ──────────────────────────────────────────────────
class Game {
  constructor() {
    this.state = null;
    this.storyData = null;
  }

  setTheme(themeName) {
    const themes = ['noir', 'blood', 'retro', 'ice', 'silver', 'royal'];
    document.body.classList.remove(...themes.map(t => `theme-${t}`));
    document.body.classList.add(`theme-${themeName}`);
    currentTheme = themeName;
    if (this.state) {
      this.state.theme = themeName;
      this._save();
    }
  }

  startNewGame() {
    this.storyData = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
    this.state = {
      currentScene: 'intro',
      params: { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 },
      history: [],
      choicesMade: {},
      theme: currentTheme,
      language: currentLanguage,
      gameStarted: true
    };
    this.renderScene('intro');
    this._save();
  }

  initGame() {
    this.storyData = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
    const saved = this._load();
    if (saved && saved.gameStarted) {
      this.state = saved;
      this.storyData = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
      if (saved.theme) this.setTheme(saved.theme);
      this.renderScene(this.state.currentScene);
    } else {
      this.startNewGame();
    }
    this._save();
  }

  renderScene(sceneId) {
    if (!this.storyData) {
      console.error('storyData is null');
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
    if (!container) return;

    const narrativeText = scene.text.join('\n');
    const choicesHtml = scene.choices && scene.choices.length > 0
      ? scene.choices.map((choice, idx) =>
          `<button class="choice-btn" data-scene="${sceneId}" data-choice="${idx}">${choice.label}</button>`
        ).join('')
      : '<p class="no-choices">[ پایان صحنه ]</p>';

    container.innerHTML = `
      <div class="scene">
        <pre class="narrative">${this._escapeHtml(narrativeText)}</pre>
        <div class="choices">${choicesHtml}</div>
      </div>
    `;

    this._attachChoiceListeners(sceneId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  _attachChoiceListeners(sceneId) {
    document.querySelectorAll('.choice-btn').forEach((btn) => {
      btn.onclick = () => {
        const choiceIdx = parseInt(btn.dataset.choice, 10);
        this.makeChoice(sceneId, choiceIdx);
      };
    });
  }

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
          <div class="profile-title">${currentLanguage === 'en' ? "William's Profile" : 'پروفایل ویلیام'}</div>
          <div class="profile-title">━━━━━━━━━━━━━━━━━━━━━</div>
          <div class="profile-label">${profile.label}</div>
          <div class="profile-text">${profile.text}</div>
        </div>
        <div class="choices">
          <button class="choice-btn restart-btn" id="restart-btn">${currentLanguage === 'en' ? 'Start Over' : 'شروع دوباره'}</button>
        </div>
      </div>
    `;
    document.getElementById('restart-btn')?.addEventListener('click', () => this.reset());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  reset() {
    this.state = {
      currentScene: 'intro',
      params: { justice: 0, empathy: 0, pragmatism: 0, doubt: 0, resolve: 0 },
      history: [],
      choicesMade: {},
      theme: currentTheme,
      language: currentLanguage,
      gameStarted: true
    };
    this.storyData = (currentLanguage === 'en') ? STORY_EN : STORY_FA;
    this.renderScene('intro');
    this._save();
  }

  _findProfile(params) {
    for (const pr of PROFILES) {
      if (pr.condition(params)) return pr;
    }
    return PROFILES[PROFILES.length - 1];
  }

  _save() {
    try {
      localStorage.setItem('fallen_angels_save', JSON.stringify(this.state));
    } catch (e) {}
  }

  _load() {
    try {
      const raw = localStorage.getItem('fallen_angels_save');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.currentScene || !parsed.params) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

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
  game = new Game();
  game.initGame();
});
