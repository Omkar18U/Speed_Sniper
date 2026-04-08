// packages/ui/src/components/upload-zone/upload-zone.js
import { extractTextFromPdf } from '../../utils/pdf-extract.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    padding: 24px;
    width: 100%;
    max-width: 600px;
    position: relative;
  }

  /* Floating particles background */
  .particles {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }

  .particle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: rgba(124, 58, 237, 0.3);
    border-radius: 50%;
    animation: float-up 15s infinite linear;
  }

  .particle:nth-child(1) { left: 10%; animation-delay: 0s; animation-duration: 12s; }
  .particle:nth-child(2) { left: 20%; animation-delay: 2s; animation-duration: 14s; width: 6px; height: 6px; }
  .particle:nth-child(3) { left: 30%; animation-delay: 4s; animation-duration: 10s; }
  .particle:nth-child(4) { left: 50%; animation-delay: 1s; animation-duration: 16s; width: 10px; height: 10px; }
  .particle:nth-child(5) { left: 65%; animation-delay: 3s; animation-duration: 13s; }
  .particle:nth-child(6) { left: 75%; animation-delay: 5s; animation-duration: 11s; width: 5px; height: 5px; }
  .particle:nth-child(7) { left: 85%; animation-delay: 2s; animation-duration: 15s; }
  .particle:nth-child(8) { left: 95%; animation-delay: 4s; animation-duration: 12s; width: 7px; height: 7px; }

  @keyframes float-up {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
  }

  /* Hero Section */
  .hero {
    text-align: center;
    margin-bottom: 32px;
    position: relative;
    z-index: 1;
  }

  .logo-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    box-shadow: 0 10px 40px rgba(124, 58, 237, 0.4);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 10px 40px rgba(124, 58, 237, 0.4); }
    50% { box-shadow: 0 10px 60px rgba(124, 58, 237, 0.6), 0 0 80px rgba(236, 72, 153, 0.3); }
  }

  .hero h1 {
    font-size: 2.5rem;
    font-weight: 900;
    margin: 0 0 12px;
    background: linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 80px rgba(167, 139, 250, 0.5);
    letter-spacing: -0.02em;
  }

  .hero p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
    margin: 0;
    line-height: 1.5;
  }

  .hero .highlight {
    color: #a78bfa;
    font-weight: 600;
  }

  /* Upload Zone */
  .zone {
    position: relative;
    z-index: 1;
    width: 100%;
    border: 3px dashed rgba(124, 58, 237, 0.5);
    border-radius: 24px;
    padding: 48px 32px;
    text-align: center;
    cursor: pointer;
    background: rgba(124, 58, 237, 0.08);
    backdrop-filter: blur(20px);
    transition: all 0.3s ease;
  }

  .zone:hover {
    border-color: #a78bfa;
    background: rgba(124, 58, 237, 0.15);
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(124, 58, 237, 0.3);
  }

  .zone.drag-over {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.15);
    transform: scale(1.02);
    box-shadow: 0 20px 60px rgba(34, 197, 94, 0.3);
  }

  .zone[hidden] { display: none; }

  .upload-icon {
    width: 72px;
    height: 72px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: bounce-soft 2s ease-in-out infinite;
  }

  .upload-icon svg {
    width: 36px;
    height: 36px;
    fill: white;
  }

  @keyframes bounce-soft {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .zone h2 {
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 8px;
  }

  .zone p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.95rem;
    margin: 0;
  }

  .zone .hint {
    margin-top: 16px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 100px;
    display: inline-block;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    font-weight: 500;
  }

  .error {
    color: #f87171;
    margin-top: 16px;
    font-size: 0.9rem;
    font-weight: 600;
    background: rgba(248, 113, 113, 0.1);
    padding: 12px 20px;
    border-radius: 12px;
  }

  .loading {
    color: #a78bfa;
    margin-top: 16px;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(167, 139, 250, 0.3);
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  input[type=file] { display: none; }

  /* Difficulty Panel */
  .difficulty-panel {
    position: relative;
    z-index: 1;
    width: 100%;
    text-align: center;
    animation: fade-in 0.4s ease;
  }

  .difficulty-panel[hidden] { display: none; }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .file-info {
    background: rgba(34, 197, 94, 0.15);
    border: 2px solid rgba(34, 197, 94, 0.3);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    gap: 16px;
    backdrop-filter: blur(10px);
  }

  .file-icon {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
  }

  .file-details { text-align: left; flex: 1; }

  .file-name {
    font-weight: 700;
    color: white;
    font-size: 1.05rem;
    margin-bottom: 4px;
  }

  .file-status {
    color: #4ade80;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .difficulty-title {
    color: white;
    font-size: 1.6rem;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .difficulty-subtitle {
    color: rgba(255, 255, 255, 0.6);
    font-size: 1rem;
    margin-bottom: 24px;
  }

  .difficulty-options {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .diff-btn {
    padding: 20px 32px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 120px;
  }

  .diff-btn:hover {
    border-color: rgba(124, 58, 237, 0.5);
    background: rgba(124, 58, 237, 0.15);
    transform: translateY(-4px);
  }

  .diff-btn.selected {
    border-color: #7c3aed;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    transform: translateY(-4px);
    box-shadow: 0 10px 40px rgba(124, 58, 237, 0.4);
  }

  .diff-label {
    font-weight: 800;
    font-size: 1.1rem;
    color: white;
  }

  .diff-desc {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .diff-btn.selected .diff-desc { color: rgba(255, 255, 255, 0.9); }

  .start-btn {
    margin-top: 32px;
    padding: 20px 64px;
    border: none;
    border-radius: 16px;
    background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
    color: white;
    font-size: 1.25rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 10px 40px rgba(124, 58, 237, 0.5);
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.02em;
  }

  .start-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    100% { left: 100%; }
  }

  .start-btn:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 15px 50px rgba(124, 58, 237, 0.6);
  }

  .start-btn:active {
    transform: translateY(-2px) scale(0.98);
  }

  .start-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .gen-status {
    margin-top: 20px;
    font-size: 0.9rem;
    color: #a78bfa;
  }

  .gen-status[hidden] { display: none; }

  /* Feature badges */
  .features {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 24px;
  }

  .feature {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 100px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .feature span { font-size: 1rem; }
</style>

<div class="particles">
  <div class="particle"></div>
  <div class="particle"></div>
  <div class="particle"></div>
  <div class="particle"></div>
  <div class="particle"></div>
  <div class="particle"></div>
  <div class="particle"></div>
  <div class="particle"></div>
</div>

<div class="hero">
  <div class="logo-icon">⚡</div>
  <h1>Speed Sniper</h1>
  <p>Turn any study material into a <span class="highlight">fast-paced reflex game</span><br>powered by AI</p>
</div>

<div class="zone" role="button" tabindex="0" aria-label="Upload resource">
  <div class="upload-icon">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
    </svg>
  </div>
  <h2>Drop your study material</h2>
  <p>PDF, TXT, or Markdown files up to 500KB</p>
  <div class="hint">Click to browse files</div>
  <div class="error" hidden></div>
  <div class="loading" hidden>
    <div class="loading-spinner"></div>
    <span>Extracting text...</span>
  </div>
  <div class="features">
    <div class="feature"><span>🎯</span> 10 Rounds</div>
    <div class="feature"><span>🧠</span> AI Generated</div>
    <div class="feature"><span>⚡</span> Reflex Test</div>
  </div>
</div>

<div class="difficulty-panel" hidden>
  <div class="file-info">
    <div class="file-icon">✓</div>
    <div class="file-details">
      <div class="file-name" id="file-name">document.pdf</div>
      <div class="file-status">Ready to generate quiz!</div>
    </div>
  </div>
  <div class="difficulty-title">Select Your Challenge</div>
  <div class="difficulty-subtitle">Pick a difficulty that matches your skill level</div>
  <div class="difficulty-options">
    <button class="diff-btn" data-difficulty="easy">
      <span class="diff-label">Easy</span>
      <span class="diff-desc">Basic recall</span>
    </button>
    <button class="diff-btn selected" data-difficulty="medium">
      <span class="diff-label">Medium</span>
      <span class="diff-desc">Applied knowledge</span>
    </button>
    <button class="diff-btn" data-difficulty="hard">
      <span class="diff-label">Hard</span>
      <span class="diff-desc">Expert mode</span>
    </button>
  </div>
  <button class="start-btn" id="start-btn">Start Game</button>
  <div class="gen-status" id="gen-status" hidden>Generating questions...</div>
</div>

<input type="file" accept=".txt,.md,.pdf" />
`;

export class UploadZone extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

    this._zone = this.shadowRoot.querySelector('.zone');
    this._input = this.shadowRoot.querySelector('input');
    this._error = this.shadowRoot.querySelector('.error');
    this._loading = this.shadowRoot.querySelector('.loading');
    this._difficultyPanel = this.shadowRoot.querySelector('.difficulty-panel');
    this._fileNameEl = this.shadowRoot.getElementById('file-name');
    this._startBtn = this.shadowRoot.getElementById('start-btn');
    this._genStatus = this.shadowRoot.getElementById('gen-status');
    this._hero = this.shadowRoot.querySelector('.hero');

    this._selectedDifficulty = 'medium';
    this._resourceText = null;
    this._fileName = null;

    this._zone.addEventListener('click', () => this._input.click());
    this._zone.addEventListener('keydown', (e) => e.key === 'Enter' && this._input.click());
    this._zone.addEventListener('dragover', (e) => { e.preventDefault(); this._zone.classList.add('drag-over'); });
    this._zone.addEventListener('dragleave', () => this._zone.classList.remove('drag-over'));
    this._zone.addEventListener('drop', (e) => { e.preventDefault(); this._zone.classList.remove('drag-over'); this._handle(e.dataTransfer.files[0]); });
    this._input.addEventListener('change', () => this._handle(this._input.files[0]));

    // Difficulty buttons
    this.shadowRoot.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._selectedDifficulty = btn.dataset.difficulty;
      });
    });

    // Start button
    this._startBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('resource-ready', {
        bubbles: true, composed: true,
        detail: {
          text: this._resourceText,
          fileName: this._fileName,
          difficulty: this._selectedDifficulty
        }
      }));
    });
  }

  _showError(msg) {
    this._error.textContent = msg;
    this._error.hidden = false;
    this._loading.hidden = true;
  }

  _showDifficultyPanel(fileName) {
    this._zone.hidden = true;
    this._hero.style.display = 'none';
    this._difficultyPanel.hidden = false;
    this._fileNameEl.textContent = fileName;
  }

  async _handle(file) {
    if (!file) return;
    this._error.hidden = true;
    const allowed = ['.txt', '.md', '.pdf'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) return this._showError('Unsupported file type. Use .txt, .md, or .pdf');
    if (file.size > 500 * 1024 && ext !== '.pdf') return this._showError('File exceeds 500KB limit');

    this._loading.hidden = false;
    try {
      let text;
      if (ext === '.pdf') {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
        if (new Blob([text]).size > 500 * 1024) text = text.slice(0, 500 * 1024);
      }
      this._loading.hidden = true;
      this._resourceText = text;
      this._fileName = file.name;
      this._showDifficultyPanel(file.name);
    } catch (err) {
      this._showError(`Failed to read file: ${err.message}`);
    }
  }

  reset() {
    this._zone.hidden = false;
    this._hero.style.display = 'block';
    this._difficultyPanel.hidden = true;
    this._resourceText = null;
    this._fileName = null;
    this._input.value = '';
  }
}

customElements.define('upload-zone', UploadZone);
