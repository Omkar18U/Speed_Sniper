// packages/ui/src/components/results-panel/results-panel.js

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 32px;
    box-sizing: border-box;
    font-family: inherit;
    position: relative;
    overflow: hidden;
  }

  /* Confetti container */
  .confetti-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
    overflow: hidden;
  }

  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    animation: confetti-fall 4s ease-in-out forwards;
  }

  @keyframes confetti-fall {
    0% {
      transform: translateY(-100px) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }

  /* Card styles */
  .card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 243, 255, 0.95) 100%);
    border-radius: 28px;
    padding: 40px;
    max-width: 720px;
    width: 100%;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.2),
      0 0 100px rgba(124, 58, 237, 0.1);
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    z-index: 10;
    animation: card-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes card-appear {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(40px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 32px;
  }

  .grade-badge {
    width: 100px;
    height: 100px;
    margin: 0 auto 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 900;
    animation: badge-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
  }

  .grade-badge.s-rank {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    box-shadow: 0 10px 40px rgba(251, 191, 36, 0.5);
  }

  .grade-badge.a-rank {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    box-shadow: 0 10px 40px rgba(34, 197, 94, 0.4);
  }

  .grade-badge.b-rank {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
  }

  .grade-badge.c-rank {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
  }

  .grade-badge.d-rank {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
  }

  @keyframes badge-pop {
    from {
      opacity: 0;
      transform: scale(0);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  h1 {
    margin: 0 0 8px;
    font-size: 2.2rem;
    background: linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fade-up 0.5s ease 0.4s both;
  }

  .subtitle {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
    animation: fade-up 0.5s ease 0.5s both;
  }

  @keyframes fade-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Stats grid */
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin: 28px 0;
  }

  .stat {
    background: white;
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    border: 2px solid rgba(124, 58, 237, 0.1);
    transition: all 0.3s ease;
    animation: stat-appear 0.5s ease calc(var(--delay, 0) * 0.1s + 0.5s) both;
  }

  .stat:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.15);
    border-color: rgba(124, 58, 237, 0.3);
  }

  @keyframes stat-appear {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .stat .icon {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }

  .stat .val {
    font-size: 2rem;
    font-weight: 900;
    background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat .lbl {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  /* Round breakdown */
  .breakdown-section {
    margin-top: 28px;
  }

  .breakdown-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #1e1b4b;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .round-card {
    background: white;
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 12px;
    border-left: 4px solid #e5e7eb;
    transition: all 0.2s ease;
    animation: round-appear 0.4s ease calc(var(--delay, 0) * 0.05s + 0.8s) both;
  }

  .round-card:hover {
    transform: translateX(4px);
  }

  @keyframes round-appear {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .round-card.correct {
    border-left-color: #22c55e;
    background: linear-gradient(135deg, white 0%, #f0fdf4 100%);
  }

  .round-card.wrong {
    border-left-color: #ef4444;
    background: linear-gradient(135deg, white 0%, #fef2f2 100%);
  }

  .round-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .round-num {
    font-weight: 700;
    color: #374151;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .round-status {
    font-size: 1rem;
  }

  .round-pts {
    font-weight: 800;
    font-size: 0.95rem;
    padding: 4px 12px;
    border-radius: 100px;
  }

  .round-pts.correct {
    color: #16a34a;
    background: rgba(34, 197, 94, 0.1);
  }

  .round-pts.wrong {
    color: #dc2626;
    background: rgba(239, 68, 68, 0.1);
  }

  .round-question {
    font-size: 0.95rem;
    color: #1e1b4b;
    margin-bottom: 14px;
    font-weight: 500;
    line-height: 1.4;
  }

  .answers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .answer-box {
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 0.85rem;
  }

  .answer-box .label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
    opacity: 0.7;
    font-weight: 600;
  }

  .answer-box .value {
    font-weight: 700;
  }

  .correct-answer {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    color: #166534;
  }

  .your-answer {
    background: #f3f4f6;
    color: #374151;
  }

  .your-answer.wrong {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
  }

  .your-answer.correct {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    color: #166534;
  }

  /* Action buttons */
  .actions {
    display: flex;
    gap: 14px;
    margin-top: 32px;
    animation: fade-up 0.5s ease 1s both;
  }

  .btn {
    flex: 1;
    padding: 18px;
    border: none;
    border-radius: 14px;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .btn:hover {
    transform: translateY(-4px);
  }

  .btn:active {
    transform: translateY(-2px);
  }

  .btn-primary {
    background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
    color: white;
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);
  }

  .btn-primary:hover {
    box-shadow: 0 15px 40px rgba(124, 58, 237, 0.5);
  }

  .btn-secondary {
    background: white;
    color: #374151;
    border: 2px solid #e5e7eb;
  }

  .btn-secondary:hover {
    border-color: #7c3aed;
    color: #7c3aed;
  }
</style>

<div class="confetti-container" id="confetti"></div>

<div class="card">
  <div class="header">
    <div class="grade-badge" id="grade-badge">A</div>
    <h1 id="title">Excellent!</h1>
    <p class="subtitle" id="subtitle">You've mastered this material</p>
  </div>

  <div class="stats" id="stats"></div>

  <div class="breakdown-section">
    <div class="breakdown-title">
      <span>📋</span>
      <span>Round-by-Round Review</span>
    </div>
    <div id="breakdown"></div>
  </div>

  <div class="actions">
    <button class="btn btn-secondary" id="new-res">
      <span>📁</span>
      <span>New Resource</span>
    </button>
    <button class="btn btn-primary" id="play-again">
      <span>🔄</span>
      <span>Play Again</span>
    </button>
  </div>
</div>
`;

export class ResultsPanel extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

    // Initialize audio context for celebration sound
    this._audioContext = null;

    this.shadowRoot.getElementById('play-again').addEventListener('click', () =>
      this.dispatchEvent(new CustomEvent('play-again', { bubbles: true, composed: true }))
    );
    this.shadowRoot.getElementById('new-res').addEventListener('click', () =>
      this.dispatchEvent(new CustomEvent('new-resource', { bubbles: true, composed: true }))
    );
  }

  _getAudioContext() {
    if (!this._audioContext) {
      this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._audioContext;
  }

  _playCelebrationSound() {
    try {
      const ctx = this._getAudioContext();

      // Create a triumphant fanfare-like sound
      const oscillator1 = ctx.createOscillator();
      const oscillator2 = ctx.createOscillator();
      const gainNode1 = ctx.createGain();
      const gainNode2 = ctx.createGain();
      const mainGain = ctx.createGain();

      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      gainNode1.connect(mainGain);
      gainNode2.connect(mainGain);
      mainGain.connect(ctx.destination);

      // Triumphant chord progression C-E-G-C
      oscillator1.type = 'triangle';
      oscillator2.type = 'sine';

      const now = ctx.currentTime;

      // First chord: C major
      oscillator1.frequency.setValueAtTime(261.63, now); // C4
      oscillator2.frequency.setValueAtTime(329.63, now); // E4

      // Second chord: E major
      oscillator1.frequency.setValueAtTime(329.63, now + 0.3); // E4
      oscillator2.frequency.setValueAtTime(415.30, now + 0.3); // G#4

      // Third chord: G major
      oscillator1.frequency.setValueAtTime(392.00, now + 0.6); // G4
      oscillator2.frequency.setValueAtTime(493.88, now + 0.6); // B4

      // Final high C
      oscillator1.frequency.setValueAtTime(523.25, now + 0.9); // C5
      oscillator2.frequency.setValueAtTime(659.25, now + 0.9); // E5

      // Volume envelope
      gainNode1.gain.setValueAtTime(0.15, now);
      gainNode1.gain.setValueAtTime(0.2, now + 0.1);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      gainNode2.gain.setValueAtTime(0.1, now);
      gainNode2.gain.setValueAtTime(0.15, now + 0.1);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      oscillator1.start(now);
      oscillator2.start(now);
      oscillator1.stop(now + 1.2);
      oscillator2.stop(now + 1.2);

    } catch (e) {
      console.log('Audio not available');
    }
  }

  _createConfetti() {
    const container = this.shadowRoot.getElementById('confetti');
    const colors = ['#7c3aed', '#ec4899', '#22c55e', '#fbbf24', '#3b82f6', '#f97316'];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';

      const shapes = ['50%', '0%'];
      confetti.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)];

      if (Math.random() > 0.5) {
        confetti.style.width = '8px';
        confetti.style.height = '16px';
      }

      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 5000);
    }
  }

  _getGrade(accuracy) {
    if (accuracy >= 90) return { grade: 'S', title: 'Perfect!', subtitle: 'Absolutely incredible performance!', rank: 's-rank' };
    if (accuracy >= 80) return { grade: 'A', title: 'Excellent!', subtitle: 'You\'ve mastered this material', rank: 'a-rank' };
    if (accuracy >= 70) return { grade: 'B', title: 'Great Job!', subtitle: 'Solid understanding shown', rank: 'b-rank' };
    if (accuracy >= 60) return { grade: 'C', title: 'Good Effort!', subtitle: 'Keep practicing to improve', rank: 'c-rank' };
    return { grade: 'D', title: 'Keep Trying!', subtitle: 'Review the material and try again', rank: 'd-rank' };
  }

  setResult(result, rounds) {
    if (!this.shadowRoot) return;
    const accuracy = Math.round(result.accuracy * 100);
    const dur = result.durationMs ? `${Math.round(result.durationMs / 1000)}s` : '—';

    // Set grade and title
    const gradeInfo = this._getGrade(accuracy);
    const gradeBadge = this.shadowRoot.getElementById('grade-badge');
    gradeBadge.textContent = gradeInfo.grade;
    gradeBadge.className = 'grade-badge ' + gradeInfo.rank;

    this.shadowRoot.getElementById('title').textContent = gradeInfo.title;
    this.shadowRoot.getElementById('subtitle').textContent = gradeInfo.subtitle;

    // Confetti and celebration for good performance
    if (accuracy >= 70) {
      setTimeout(() => {
        this._createConfetti();
        this._playCelebrationSound();
      }, 500);
    } else {
      // Play a milder celebration sound for any completion
      setTimeout(() => this._playCelebrationSound(), 300);
    }

    // Stats with staggered animation
    const statsData = [
      { icon: '⚡', val: result.totalScore.toLocaleString(), lbl: 'Score' },
      { icon: '🎯', val: accuracy + '%', lbl: 'Accuracy' },
      { icon: '🔥', val: 'x' + result.maxCombo, lbl: 'Max Combo' },
      { icon: '✅', val: result.hits, lbl: 'Hits' },
      { icon: '❌', val: result.misses, lbl: 'Misses' },
      { icon: '⏱️', val: dur, lbl: 'Duration' }
    ];

    this.shadowRoot.getElementById('stats').innerHTML = statsData.map((s, i) => `
      <div class="stat" style="--delay: ${i}">
        <div class="icon">${s.icon}</div>
        <div class="val">${s.val}</div>
        <div class="lbl">${s.lbl}</div>
      </div>
    `).join('');

    // Round breakdown
    const breakdown = this.shadowRoot.getElementById('breakdown');
    breakdown.innerHTML = '';

    (result.roundBreakdown || []).forEach((rb, i) => {
      const round = rounds?.[i];
      const isCorrect = rb.correct;
      const question = round?.question || `Round ${i + 1}`;
      const correctAnswer = round?.correctAnswer || '—';
      const selectedAnswer = rb.selectedAnswer || 'No answer';
      const points = rb.scoreDelta || 0;

      const card = document.createElement('div');
      card.className = `round-card ${isCorrect ? 'correct' : 'wrong'}`;
      card.style = `--delay: ${i}`;
      card.innerHTML = `
        <div class="round-header">
          <span class="round-num">
            <span class="round-status">${isCorrect ? '✓' : '✗'}</span>
            Round ${i + 1}
          </span>
          <span class="round-pts ${isCorrect ? 'correct' : 'wrong'}">${isCorrect ? '+' : ''}${points} pts</span>
        </div>
        <div class="round-question">${question}</div>
        <div class="answers">
          <div class="answer-box correct-answer">
            <div class="label">✓ Correct Answer</div>
            <div class="value">${correctAnswer}</div>
          </div>
          <div class="answer-box your-answer ${isCorrect ? 'correct' : 'wrong'}">
            <div class="label">Your Answer</div>
            <div class="value">${selectedAnswer}</div>
          </div>
        </div>
      `;
      breakdown.appendChild(card);
    });
  }
}

customElements.define('results-panel', ResultsPanel);
