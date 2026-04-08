// packages/ui/src/components/game-canvas/game-canvas.js

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: linear-gradient(135deg, #0f0a28 0%, #1a0a3c 50%, #0f172a 100%);
    font-family: inherit;
  }

  /* Animated background grid */
  .bg-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: grid-move 20s linear infinite;
    pointer-events: none;
  }

  @keyframes grid-move {
    0% { transform: translate(0, 0); }
    100% { transform: translate(60px, 60px); }
  }

  /* Ambient glow effects */
  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
    pointer-events: none;
    animation: orb-float 8s ease-in-out infinite;
  }

  .glow-orb.purple {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
    top: -100px;
    right: -100px;
  }

  .glow-orb.pink {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #ec4899 0%, transparent 70%);
    bottom: -50px;
    left: -50px;
    animation-delay: -4s;
  }

  .glow-orb.blue {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
    top: 40%;
    left: 30%;
    animation-delay: -2s;
  }

  @keyframes orb-float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(20px, -20px) scale(1.1); }
  }

  /* Question display */
  .question-container {
    position: absolute;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    text-align: center;
    max-width: 800px;
    width: 90%;
  }

  .question {
    background: rgba(15, 10, 40, 0.8);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(124, 58, 237, 0.3);
    border-radius: 20px;
    padding: 24px 40px;
    color: white;
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.5;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(124, 58, 237, 0.1);
    animation: question-appear 0.5s ease-out;
  }

  @keyframes question-appear {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .question-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #a78bfa;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  /* Instruction hint */
  .hint {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: pulse-hint 2s ease-in-out infinite;
    z-index: 5;
  }

  @keyframes pulse-hint {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }

  .hint-icon {
    font-size: 1.2rem;
  }

  /* Pause overlay */
  .pause-overlay {
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(15, 10, 40, 0.9);
    backdrop-filter: blur(20px);
    z-index: 100;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: white;
  }

  .pause-overlay.active {
    display: flex;
    animation: fade-in 0.3s ease;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .pause-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    animation: pause-bounce 1s ease-in-out infinite;
  }

  @keyframes pause-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .pause-text {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .resume-btn {
    padding: 16px 48px;
    border: none;
    border-radius: 16px;
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
    color: white;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 10px 40px rgba(124, 58, 237, 0.4);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .resume-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 50px rgba(124, 58, 237, 0.5);
  }

  /* Round transition flash */
  .round-flash {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(124, 58, 237, 0.3) 0%, transparent 70%);
    pointer-events: none;
    opacity: 0;
    z-index: 50;
  }

  .round-flash.active {
    animation: flash-pulse 0.6s ease-out;
  }

  @keyframes flash-pulse {
    0% { opacity: 1; transform: scale(0.8); }
    100% { opacity: 0; transform: scale(2); }
  }

  /* Correct/Wrong feedback */
  .feedback-flash {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    z-index: 40;
  }

  .feedback-flash.correct {
    background: radial-gradient(circle at center, rgba(34, 197, 94, 0.4) 0%, transparent 70%);
    animation: feedback-glow 0.5s ease-out;
  }

  .feedback-flash.wrong {
    background: radial-gradient(circle at center, rgba(239, 68, 68, 0.4) 0%, transparent 70%);
    animation: feedback-glow 0.5s ease-out;
  }

  @keyframes feedback-glow {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  /* Encouragement pop-up */
  .encouragement {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2.5rem;
    font-weight: 900;
    color: #22c55e;
    text-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.5), 0 4px 8px rgba(0,0,0,0.5);
    z-index: 60;
    pointer-events: none;
    opacity: 0;
    white-space: nowrap;
  }

  .encouragement.show {
    animation: encouragement-pop 1s ease-out forwards;
  }

  @keyframes encouragement-pop {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }
    40% {
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -70%) scale(1);
    }
  }
</style>

<div class="bg-grid"></div>
<div class="glow-orb purple"></div>
<div class="glow-orb pink"></div>
<div class="glow-orb blue"></div>

<score-hud id="hud"></score-hud>

<div class="question-container">
  <div class="question">
    <span class="question-label">Tap the correct answer</span>
    <span id="question"></span>
  </div>
</div>

<div class="hint">
  <span class="hint-icon">👆</span>
  <span>Tap the correct answer before it disappears!</span>
</div>

<div class="round-flash" id="round-flash"></div>
<div class="feedback-flash" id="feedback-flash"></div>
<div class="encouragement" id="encouragement"></div>

<div class="pause-overlay" id="pause-overlay">
  <div class="pause-icon">⏸️</div>
  <div class="pause-text">Game Paused</div>
  <button class="resume-btn" id="resume-btn">
    <span>▶</span>
    <span>Resume</span>
  </button>
</div>
`;

export class GameCanvas extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

    this._tokens = new Map();
    this._round = null;
    this._paused = false;
    this._animId = null;
    this._roundResolved = false;

    // Initialize audio context for sound effects
    this._audioContext = null;

    this._hud = this.shadowRoot.getElementById('hud');
    this._questionEl = this.shadowRoot.getElementById('question');
    this._pauseOverlay = this.shadowRoot.getElementById('pause-overlay');
    this._roundFlash = this.shadowRoot.getElementById('round-flash');
    this._feedbackFlash = this.shadowRoot.getElementById('feedback-flash');
    this._encouragementEl = this.shadowRoot.getElementById('encouragement');

    // Encouragement messages pool
    this._encouragements = [
      "Nice!", "Smart!", "You're on fire!", "Brilliant!", "Great job!",
      "Perfect!", "Amazing!", "Keep it up!", "Excellent!", "Genius!",
      "Nailed it!", "You rock!", "Superb!", "Fantastic!", "Well done!"
    ];

    this.shadowRoot.getElementById('resume-btn').addEventListener('click', () => this._resume());
    this.shadowRoot.addEventListener('pause-requested', () => this._pause());
    this.shadowRoot.addEventListener('token-tap', (e) => this._onTokenTap(e));
  }

  _getAudioContext() {
    if (!this._audioContext) {
      this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._audioContext;
  }

  _playCorrectSound() {
    try {
      const ctx = this._getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Happy ascending tone
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.log('Audio not available');
    }
  }

  _playWrongSound() {
    try {
      const ctx = this._getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Low descending buzz
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(100, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.log('Audio not available');
    }
  }

  _showEncouragement() {
    const msg = this._encouragements[Math.floor(Math.random() * this._encouragements.length)];
    this._encouragementEl.textContent = msg;
    this._encouragementEl.classList.remove('show');
    void this._encouragementEl.offsetWidth; // Trigger reflow
    this._encouragementEl.classList.add('show');
  }

  _onMiss() {
    // Play wrong sound for missed questions (when correct token exits screen)
    this._playWrongSound();

    // Show feedback flash for miss
    this._feedbackFlash.classList.remove('correct', 'wrong');
    void this._feedbackFlash.offsetWidth;
    this._feedbackFlash.classList.add('wrong');
  }

  loadRound(round) {
    this._clearTokens();
    this._round = round;
    this._roundResolved = false;
    this._paused = false;
    this._questionEl.textContent = round.question;

    // Flash effect for new round
    this._roundFlash.classList.remove('active');
    void this._roundFlash.offsetWidth; // Trigger reflow
    this._roundFlash.classList.add('active');

    const now = performance.now();
    const canvasH = this.getBoundingClientRect().height || window.innerHeight;
    const canvasW = this.getBoundingClientRect().width || window.innerWidth;

    // Keep tokens in playable area - avoid HUD (top 80px) and question box (180px), leave some bottom margin
    const questionBoxHeight = 180;
    const bottomMargin = 80;
    const playableAreaStart = questionBoxHeight;
    const playableAreaEnd = canvasH - bottomMargin;
    const playableHeight = playableAreaEnd - playableAreaStart;

    const SPAWN_DELAY = 400;

    round.tokens.forEach((token, index) => {
      const el = document.createElement('token-sprite');
      el.setAttribute('token-id', token.id);
      el.setAttribute('answer', token.text);
      el.setAttribute('is-correct', token.isCorrect);
      el.textContent = token.text;

      const startX = canvasW + 80;
      // Map API's 0-100% into the actual playable area
      const startY = playableAreaStart + (token.spawnY / 100) * playableHeight;

      el.style.left = `0px`;
      el.style.top = `0px`;
      el.style.transform = `translate(${startX}px, ${startY}px)`;
      el.style.opacity = '0';

      this.shadowRoot.appendChild(el);

      const tokenStartTime = now + (index * SPAWN_DELAY);
      this._tokens.set(token.id, {
        el,
        data: token,
        startTime: tokenStartTime,
        spawnX: startX,
        spawnY: startY,
        spawned: false
      });
    });

    cancelAnimationFrame(this._animId);
    this._animId = requestAnimationFrame((ts) => this._animate(ts));
  }

  _animate(timestamp) {
    if (this._paused) return;
    if (this._roundResolved) {
      this._animId = requestAnimationFrame((ts) => this._animate(ts));
      return;
    }

    const canvasW = this.getBoundingClientRect().width || window.innerWidth;

    for (const [tokenId, entry] of this._tokens.entries()) {
      if (!this.shadowRoot.contains(entry.el)) continue;
      const state = entry.el.getAttribute('state');
      if (state === 'hit' || state === 'miss') continue;

      if (timestamp < entry.startTime) continue;

      if (!entry.spawned) {
        entry.spawned = true;
        entry.el.style.opacity = '1';
      }

      const elapsed = (timestamp - entry.startTime) / 1000;
      const x = entry.spawnX - entry.data.driftSpeedPx * elapsed;
      const y = entry.spawnY + Math.sin(elapsed * entry.data.wobbleFrequency * 2 * Math.PI) * entry.data.wobbleAmplitude;

      entry.el.style.transform = `translate(${x}px, ${y}px) rotate(${entry.data.rotationDeg}deg) scale(${entry.data.scale})`;

      const elW = entry.el.offsetWidth || 140;
      if (x < -elW && !this._roundResolved) {
        const isCorrectToken = entry.el.getAttribute('is-correct') === 'true';

        // If the correct answer token exits, play miss sound
        if (isCorrectToken) {
          this._onMiss();
          this._roundResolved = true;
        }

        this.dispatchEvent(new CustomEvent('token-exit', {
          bubbles: true, composed: true, detail: { tokenId, isCorrect: isCorrectToken }
        }));
        entry.el.setAttribute('state', 'miss');
      }
    }

    this._animId = requestAnimationFrame((ts) => this._animate(ts));
  }

  _onTokenTap(e) {
    if (this._roundResolved) return;
    const { tokenId, answer, timestamp } = e.detail;
    const entry = this._tokens.get(tokenId);
    if (!entry || entry.el.getAttribute('state')) return;

    const isCorrect = entry.el.getAttribute('is-correct') === 'true';
    entry.el.setState(isCorrect ? 'hit' : 'miss');

    // Play sound effect
    if (isCorrect) {
      this._playCorrectSound();
      this._showEncouragement();
    } else {
      this._playWrongSound();
    }

    // Show feedback flash
    this._feedbackFlash.classList.remove('correct', 'wrong');
    void this._feedbackFlash.offsetWidth;
    this._feedbackFlash.classList.add(isCorrect ? 'correct' : 'wrong');

    this._roundResolved = true;
    this.dispatchEvent(new CustomEvent('token-tap-result', {
      bubbles: true, composed: true,
      detail: {
        roundId: this._round.id,
        selectedAnswer: answer,
        tapTimestamp: timestamp,
        isCorrect,
      },
    }));

    setTimeout(() => {
      for (const [id, entry2] of this._tokens.entries()) {
        if (id !== tokenId && !entry2.el.getAttribute('state')) {
          entry2.el.setAttribute('state', 'miss');
        }
      }
    }, 400);
  }

  _pause() {
    this._paused = true;
    this._pauseOverlay.classList.add('active');
    cancelAnimationFrame(this._animId);
    const now = performance.now();
    for (const entry of this._tokens.values()) {
      entry._pausedAt = now;
    }
    this.dispatchEvent(new CustomEvent('pause-requested', { bubbles: true, composed: true }));
  }

  _resume() {
    const now = performance.now();
    for (const entry of this._tokens.values()) {
      if (entry._pausedAt) {
        entry.startTime += now - entry._pausedAt;
        entry._pausedAt = null;
      }
    }
    this._paused = false;
    this._pauseOverlay.classList.remove('active');
    this._animId = requestAnimationFrame((ts) => this._animate(ts));
    this.dispatchEvent(new CustomEvent('resume-requested', { bubbles: true, composed: true }));
  }

  setHud(score, roundIndex, combo, totalRounds) {
    this._hud.setAttribute('score', score);
    this._hud.setAttribute('round', roundIndex + 1);
    this._hud.setAttribute('combo', combo);
    this._hud.setAttribute('total-rounds', totalRounds);
  }

  _clearTokens() {
    cancelAnimationFrame(this._animId);
    for (const entry of this._tokens.values()) {
      entry.el.remove();
    }
    this._tokens.clear();
  }
}

customElements.define('game-canvas', GameCanvas);
