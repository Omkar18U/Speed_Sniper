// packages/ui/src/components/speed-sniper-root/speed-sniper-root.js
import { SpeedSniperApiClient } from '../../services/api.client.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #0f0a28 0%, #1a0a3c 50%, #0f172a 100%);
    font-family: 'Inter', system-ui, sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* Animated background particles */
  .bg-particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }

  .bg-particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(124, 58, 237, 0.3);
    border-radius: 50%;
    animation: particle-drift 20s linear infinite;
  }

  .bg-particle:nth-child(1) { left: 5%; animation-delay: 0s; }
  .bg-particle:nth-child(2) { left: 15%; animation-delay: 3s; }
  .bg-particle:nth-child(3) { left: 25%; animation-delay: 6s; }
  .bg-particle:nth-child(4) { left: 40%; animation-delay: 2s; }
  .bg-particle:nth-child(5) { left: 55%; animation-delay: 5s; }
  .bg-particle:nth-child(6) { left: 70%; animation-delay: 1s; }
  .bg-particle:nth-child(7) { left: 85%; animation-delay: 4s; }
  .bg-particle:nth-child(8) { left: 95%; animation-delay: 7s; }

  @keyframes particle-drift {
    0% { transform: translateY(100vh) scale(0); opacity: 0; }
    10% { opacity: 1; transform: translateY(90vh) scale(1); }
    90% { opacity: 1; }
    100% { transform: translateY(-10vh) scale(0.5); opacity: 0; }
  }

  .screen {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: screen-fade-in 0.4s ease;
  }

  .screen[hidden] {
    display: none !important;
  }

  @keyframes screen-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  game-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Generating screen */
  .generating {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 40px;
    text-align: center;
  }

  .generating-icon {
    width: 100px;
    height: 100px;
    position: relative;
  }

  .spinner-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 4px solid rgba(167, 139, 250, 0.1);
    border-radius: 50%;
  }

  .spinner-ring.active {
    border-top-color: #a78bfa;
    border-right-color: #ec4899;
    animation: spin 1s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
  }

  .spinner-inner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2.5rem;
    animation: pulse-icon 2s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse-icon {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
  }

  .generating-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }

  .generating-subtitle {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    max-width: 300px;
  }

  .generating-steps {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(167, 139, 250, 0.3);
    animation: step-pulse 1.5s ease-in-out infinite;
  }

  .step-dot:nth-child(1) { animation-delay: 0s; }
  .step-dot:nth-child(2) { animation-delay: 0.2s; }
  .step-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes step-pulse {
    0%, 100% { background: rgba(167, 139, 250, 0.3); transform: scale(1); }
    50% { background: #a78bfa; transform: scale(1.3); }
  }

  /* Error screen */
  .error-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 242, 242, 0.95) 100%);
    border-radius: 24px;
    padding: 40px;
    text-align: center;
    max-width: 420px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: card-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes card-appear {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .error-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
  }

  .error-card h2 {
    color: #dc2626;
    margin: 0 0 12px;
    font-size: 1.5rem;
    font-weight: 800;
  }

  .error-card p {
    color: #6b7280;
    margin: 0 0 24px;
    line-height: 1.5;
  }

  .error-card button {
    padding: 14px 32px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
    color: white;
    cursor: pointer;
    font-weight: 700;
    font-size: 1rem;
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
    transition: all 0.2s ease;
  }

  .error-card button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(124, 58, 237, 0.4);
  }
</style>

<div class="bg-particles">
  <div class="bg-particle"></div>
  <div class="bg-particle"></div>
  <div class="bg-particle"></div>
  <div class="bg-particle"></div>
  <div class="bg-particle"></div>
  <div class="bg-particle"></div>
  <div class="bg-particle"></div>
  <div class="bg-particle"></div>
</div>

<!-- Upload/Landing screen -->
<div class="screen" id="screen-idle">
  <upload-zone id="upload-zone"></upload-zone>
</div>

<!-- Generating screen -->
<div class="screen" id="screen-generating" hidden>
  <div class="generating">
    <div class="generating-icon">
      <div class="spinner-ring"></div>
      <div class="spinner-ring active"></div>
      <div class="spinner-inner">🧠</div>
    </div>
    <h2 class="generating-title" id="gen-msg">Generating Questions...</h2>
    <p class="generating-subtitle">AI is creating personalized quiz questions from your material</p>
    <div class="generating-steps">
      <div class="step-dot"></div>
      <div class="step-dot"></div>
      <div class="step-dot"></div>
    </div>
  </div>
</div>

<!-- Game screen -->
<div class="screen" id="screen-game" hidden style="display:none;">
  <game-canvas id="canvas"></game-canvas>
</div>

<!-- Results screen -->
<div class="screen" id="screen-results" hidden>
  <results-panel id="results"></results-panel>
</div>

<!-- Error screen -->
<div class="screen" id="screen-error" hidden>
  <div class="error-card">
    <div class="error-icon">😕</div>
    <h2>Oops! Something went wrong</h2>
    <p id="error-msg">We couldn't process your request. Please try again.</p>
    <button id="error-retry">Try Again</button>
  </div>
</div>
`;

export class SpeedSniperRoot extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

    const apiBase = this.getAttribute('api-base') || '/api/v1';
    this._api = new SpeedSniperApiClient(apiBase);

    this._session = null;
    this._rounds = null;
    this._currentRoundIndex = 0;
    this._score = 0;
    this._combo = 0;
    this._startedAt = null;
    this._resource = null;
    this._difficulty = 'medium';

    // Wire screens
    this._screens = {
      idle: this.shadowRoot.getElementById('screen-idle'),
      generating: this.shadowRoot.getElementById('screen-generating'),
      game: this.shadowRoot.getElementById('screen-game'),
      results: this.shadowRoot.getElementById('screen-results'),
      error: this.shadowRoot.getElementById('screen-error'),
    };
    this._canvas = this.shadowRoot.getElementById('canvas');
    this._results = this.shadowRoot.getElementById('results');
    this._uploadZone = this.shadowRoot.getElementById('upload-zone');

    this.shadowRoot.getElementById('error-retry').addEventListener('click', () => {
      this._uploadZone.reset();
      this._showScreen('idle');
    });

    // Event listeners
    this.shadowRoot.addEventListener('resource-ready', (e) => this._onResourceReady(e.detail));
    this.shadowRoot.addEventListener('token-tap-result', (e) => this._onTokenTap(e.detail));
    this.shadowRoot.addEventListener('token-exit', (e) => this._onTokenExit(e.detail));
    this.shadowRoot.addEventListener('play-again', () => this._playAgain());
    this.shadowRoot.addEventListener('new-resource', () => {
      this._uploadZone.reset();
      this._showScreen('idle');
    });
  }

  _showScreen(name) {
    for (const [key, el] of Object.entries(this._screens)) {
      el.hidden = key !== name;
      if (key === 'game') el.style.display = name === 'game' ? 'block' : 'none';
    }
  }

  async _onResourceReady({ text, fileName, difficulty }) {
    this._resource = { text, fileName };
    this._difficulty = difficulty || 'medium';
    this._showScreen('generating');
    this.shadowRoot.getElementById('gen-msg').textContent = 'Generating Questions...';

    try {
      // Generate questions with selected difficulty
      const res = await this._api.createSession({
        resourceText: text,
        fileName,
        difficulty: this._difficulty
      });
      this._session = res;
      this._rounds = res.rounds;

      // Start the session immediately
      await this._api.startSession(this._session.sessionId);

      // Go directly to game
      this._currentRoundIndex = 0;
      this._score = 0;
      this._combo = 0;
      this._startedAt = Date.now();
      this._showScreen('game');
      this._loadCurrentRound();
    } catch (err) {
      this._showError(err.message || 'Failed to generate questions. Please try again.');
    }
  }

  _loadCurrentRound() {
    const round = this._rounds[this._currentRoundIndex];
    this._canvas.setHud(this._score, this._currentRoundIndex, this._combo, this._rounds.length);
    this._canvas.loadRound(round);
  }

  async _onTokenTap({ roundId, selectedAnswer, tapTimestamp, isCorrect }) {
    try {
      const res = await this._api.tap(this._session.sessionId, { roundId, selectedAnswer, tapTimestamp });
      this._score = res.totalScore;
      this._combo = res.combo;
      this._canvas.setHud(this._score, this._currentRoundIndex, this._combo, this._rounds.length);

      if (res.gameComplete) {
        await this._showResults();
      } else if (res.roundComplete) {
        this._currentRoundIndex = res.nextRoundIndex;
        setTimeout(() => this._loadCurrentRound(), 800);
      }
    } catch (err) {
      console.error('Tap error:', err);
    }
  }

  async _onTokenExit({ tokenId }) {
    if (this._rounds[this._currentRoundIndex]?.tokens.every(t => {
      // Only trigger miss once — guard via session state
    })) return;

    const round = this._rounds[this._currentRoundIndex];
    const correctToken = round?.tokens.find(t => t.isCorrect);
    if (correctToken?.id !== tokenId) return; // Only process miss when correct token exits

    try {
      const res = await this._api.miss(this._session.sessionId, { roundId: round.id });
      this._score = res.totalScore;
      this._combo = 0;
      this._canvas.setHud(this._score, this._currentRoundIndex, this._combo, this._rounds.length);

      if (res.gameComplete) {
        await this._showResults();
      } else if (res.roundComplete) {
        this._currentRoundIndex = res.nextRoundIndex;
        setTimeout(() => this._loadCurrentRound(), 800);
      }
    } catch (err) {
      console.error('Miss error:', err);
    }
  }

  async _showResults() {
    try {
      const result = await this._api.getResult(this._session.sessionId);
      this._showScreen('results');
      this._results.setResult(result, this._rounds);
    } catch (err) {
      // Build result from local state if API fails
      this._showScreen('results');
      this._results.setResult({
        totalScore: this._score,
        hits: 0, misses: 0, maxCombo: 0,
        accuracy: 0, durationMs: Date.now() - this._startedAt,
        roundBreakdown: [],
      }, this._rounds);
    }
  }

  async _playAgain() {
    this._showScreen('generating');
    this.shadowRoot.getElementById('gen-msg').textContent = 'Generating New Questions...';

    try {
      const res = await this._api.createSession({
        resourceText: this._resource.text,
        fileName: this._resource.fileName,
        difficulty: this._difficulty,
      });
      this._session = res;
      this._rounds = res.rounds;

      await this._api.startSession(this._session.sessionId);

      this._currentRoundIndex = 0;
      this._score = 0;
      this._combo = 0;
      this._startedAt = Date.now();
      this._showScreen('game');
      this._loadCurrentRound();
    } catch (err) {
      this._showError(err.message || 'Failed to generate questions. Please try again.');
    }
  }

  _showError(msg) {
    this.shadowRoot.getElementById('error-msg').textContent = msg;
    this._showScreen('error');
  }
}

customElements.define('speed-sniper-root', SpeedSniperRoot);
