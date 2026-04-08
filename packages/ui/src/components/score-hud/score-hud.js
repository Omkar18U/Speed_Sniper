// packages/ui/src/components/score-hud/score-hud.js

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    box-sizing: border-box;
    background: linear-gradient(180deg, rgba(15, 10, 40, 0.95) 0%, rgba(15, 10, 40, 0.7) 100%);
    backdrop-filter: blur(20px);
    color: white;
    font-family: inherit;
    z-index: 20;
    border-bottom: 1px solid rgba(124, 58, 237, 0.2);
  }

  .left-section {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .score-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .score-icon {
    font-size: 1.5rem;
    animation: zap-glow 2s ease-in-out infinite;
  }

  @keyframes zap-glow {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(167, 139, 250, 0.5)); }
    50% { filter: drop-shadow(0 0 12px rgba(167, 139, 250, 0.8)); }
  }

  .score {
    font-size: 1.6rem;
    font-weight: 900;
    background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    min-width: 80px;
  }

  .score.bump {
    animation: score-bump 0.3s ease-out;
  }

  @keyframes score-bump {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  .round-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .round-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .round {
    font-size: 1.1rem;
    font-weight: 700;
    color: #c4b5fd;
  }

  .center-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 32px;
  }

  .progress-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .bar-wrap {
    width: 100%;
    max-width: 300px;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 99px;
    overflow: hidden;
    position: relative;
  }

  .bar {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, #ec4899 100%);
    border-radius: 99px;
    width: 0%;
    transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.5);
    position: relative;
  }

  .bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
    animation: bar-shine 2s ease-in-out infinite;
  }

  @keyframes bar-shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .combo {
    min-width: 90px;
    text-align: center;
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 1rem;
    font-weight: 800;
    background: transparent;
    color: transparent;
    transition: all 0.3s ease;
  }

  .combo.active {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%);
    border: 2px solid rgba(251, 191, 36, 0.5);
    color: #fbbf24;
    animation: combo-pulse 0.5s ease;
  }

  .combo.fire {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%);
    border: 2px solid rgba(239, 68, 68, 0.5);
    color: #f97316;
    animation: combo-fire 0.6s ease;
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.3);
  }

  @keyframes combo-pulse {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes combo-fire {
    0% { transform: scale(0.8) rotate(-5deg); }
    25% { transform: scale(1.15) rotate(5deg); }
    50% { transform: scale(1.1) rotate(-3deg); }
    75% { transform: scale(1.05) rotate(2deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  .pause-btn {
    padding: 10px 20px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(10px);
  }

  .pause-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .pause-btn:active {
    transform: translateY(0);
  }
</style>

<div class="left-section">
  <div class="score-container">
    <span class="score-icon">⚡</span>
    <span class="score" id="score">0</span>
  </div>
  <div class="round-container">
    <span class="round-label">Round</span>
    <span class="round" id="round">1/10</span>
  </div>
</div>

<div class="center-section">
  <span class="progress-label">Progress</span>
  <div class="bar-wrap">
    <div class="bar" id="bar"></div>
  </div>
</div>

<div class="right-section">
  <div class="combo" id="combo"></div>
  <button class="pause-btn" id="pause">
    <span>⏸</span>
    <span>Pause</span>
  </button>
</div>
`;

export class ScoreHud extends HTMLElement {
  static get observedAttributes() { return ['score', 'round', 'combo', 'total-rounds']; }

  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
    this._scoreEl = this.shadowRoot.getElementById('score');
    this._roundEl = this.shadowRoot.getElementById('round');
    this._comboEl = this.shadowRoot.getElementById('combo');
    this._barEl = this.shadowRoot.getElementById('bar');
    this._prevScore = 0;
    this._prevCombo = 0;

    this.shadowRoot.getElementById('pause').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('pause-requested', { bubbles: true, composed: true }));
    });

    this._update();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this._update();
  }

  _update() {
    const score = parseInt(this.getAttribute('score') || '0');
    const round = parseInt(this.getAttribute('round') || '1');
    const total = parseInt(this.getAttribute('total-rounds') || '10');
    const combo = parseInt(this.getAttribute('combo') || '0');

    // Animate score change
    if (this._scoreEl) {
      if (score !== this._prevScore) {
        this._scoreEl.classList.remove('bump');
        void this._scoreEl.offsetWidth; // Trigger reflow
        this._scoreEl.classList.add('bump');
      }
      this._scoreEl.textContent = score.toLocaleString();
      this._prevScore = score;
    }

    if (this._roundEl) {
      this._roundEl.textContent = `${round}/${total}`;
    }

    if (this._barEl) {
      this._barEl.style.width = `${Math.min(100, ((round - 1) / total) * 100)}%`;
    }

    if (this._comboEl) {
      if (combo >= 2) {
        this._comboEl.textContent = combo >= 5 ? `🔥 x${combo}` : `✨ x${combo}`;
        this._comboEl.classList.toggle('active', combo >= 2 && combo < 5);
        this._comboEl.classList.toggle('fire', combo >= 5);

        // Animate on combo change
        if (combo !== this._prevCombo && combo >= 2) {
          this._comboEl.style.animation = 'none';
          void this._comboEl.offsetWidth;
          this._comboEl.style.animation = '';
        }
      } else {
        this._comboEl.textContent = '';
        this._comboEl.classList.remove('active', 'fire');
      }
      this._prevCombo = combo;
    }
  }
}

customElements.define('score-hud', ScoreHud);
