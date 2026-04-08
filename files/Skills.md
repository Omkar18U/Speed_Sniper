# Skills.md — Google Antigravity Patterns & Conventions

This file captures conventions, gotchas, and reusable patterns specific to building Speed Sniper with Google Antigravity.

---

## 1. Web Component Structure

Every Antigravity component in this project follows this pattern:

```javascript
// components/token-sprite/token-sprite.js
export class TokenSprite extends HTMLElement {
  static get observedAttributes() {
    return ['text', 'is-correct', 'scale'];
  }

  connectedCallback() {
    this.render();
    this.attachEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) this.render();
  }

  render() {
    this.innerHTML = `
      <div class="token" style="transform: scale(${this.getAttribute('scale') || 1})">
        ${this.getAttribute('text')}
      </div>
    `;
  }

  attachEvents() {
    this.querySelector('.token').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('token-tap', {
        bubbles: true,
        detail: { text: this.getAttribute('text') }
      }));
    });
  }
}

customElements.define('token-sprite', TokenSprite);
```

---

## 2. Animation Loop (Token Drift)

Use `requestAnimationFrame` for all token movement. Never use CSS transitions for drift — the server controls speed params.

```javascript
class GameCanvas extends HTMLElement {
  startAnimationLoop() {
    const tokens = this._activeTokens; // array of { el, x, y, driftSpeed, wobble, startTime }

    const tick = (timestamp) => {
      if (this._paused) return;

      tokens.forEach(token => {
        const elapsed = timestamp - token.startTime;
        const newX = token.spawnX - (token.driftSpeedPx * elapsed / 1000);
        const newY = token.spawnY + Math.sin(elapsed / 1000 * token.wobbleFrequency * 2 * Math.PI) * token.wobbleAmplitude;

        token.el.style.transform = `translate(${newX}px, ${newY}px) rotate(${token.rotationDeg}deg) scale(${token.scale})`;

        // Check if token has exited left edge
        if (newX < -token.el.offsetWidth) {
          this.handleTokenExit(token);
        }
      });

      this._rafId = requestAnimationFrame(tick);
    };

    this._rafId = requestAnimationFrame(tick);
  }

  stopAnimationLoop() {
    cancelAnimationFrame(this._rafId);
  }
}
```

---

## 3. Event Communication Between Components

Components communicate via **custom events bubbling up to a root coordinator**, not direct DOM references.

```
<speed-sniper-root>            ← Listens for all events, owns API client
  <upload-zone>                → dispatches: 'resource-ready'
  <game-lobby>                 → dispatches: 'game-start'
  <game-canvas>                → dispatches: 'token-tap', 'token-exit', 'round-complete'
  <score-hud>                  ← receives: scoreUpdate attribute
  <results-panel>              ← receives: session-result attribute
```

Root coordinator pattern:
```javascript
class SpeedSniperRoot extends HTMLElement {
  connectedCallback() {
    this.addEventListener('resource-ready', e => this.onResourceReady(e.detail));
    this.addEventListener('token-tap', e => this.onTokenTap(e.detail));
    this.addEventListener('token-exit', e => this.onTokenExit(e.detail));
  }

  async onTokenTap({ tokenId, roundId, answer, timestamp }) {
    const result = await this.apiClient.submitTap(this._sessionId, { roundId, selectedAnswer: answer, tapTimestamp: timestamp });
    this.querySelector('score-hud').setAttribute('score', result.totalScore);
    this.querySelector('score-hud').setAttribute('combo', result.combo);
  }
}
```

---

## 4. PDF Text Extraction (Client-Side)

Use PDF.js to extract text before sending to API:

```javascript
import * as pdfjsLib from 'pdfjs-dist';

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 50); // PRD: max 50 pages

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }

  return fullText.slice(0, 200_000); // PRD: max 200KB plain text
}
```

---

## 5. Touch + Mouse Unified Tap Detection

Support both mobile and desktop:

```javascript
function attachTapHandler(tokenEl, onTap) {
  let touchMoved = false;

  tokenEl.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
  tokenEl.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
  tokenEl.addEventListener('touchend', (e) => {
    if (!touchMoved) {
      e.preventDefault();
      onTap(Date.now());
    }
  });

  tokenEl.addEventListener('click', () => onTap(Date.now()));
}
```

---

## 6. Pause / Resume

On pause: freeze animation loop, dim canvas, show resume button.

```javascript
pause() {
  this._paused = true;
  this._pauseTime = performance.now();
  cancelAnimationFrame(this._rafId);
  this.querySelector('.canvas-overlay').classList.add('visible');
}

resume() {
  // Offset all token start times by the paused duration
  const pauseDuration = performance.now() - this._pauseTime;
  this._activeTokens.forEach(t => { t.startTime += pauseDuration; });
  this._paused = false;
  this.startAnimationLoop();
}
```

---

## 7. Hit / Miss Animations

```css
/* token-sprite.css */
.token {
  transition: none; /* Never use transition for drift */
}

.token.hit {
  animation: burst 0.4s ease-out forwards;
}

.token.miss {
  animation: fadeout 0.3s ease-in forwards;
}

@keyframes burst {
  0%   { transform: scale(1); opacity: 1; }
  50%  { transform: scale(1.6); opacity: 0.8; background: #22c55e; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes fadeout {
  to { opacity: 0; transform: translateX(-20px); }
}
```

---

## 8. API Client Wrapper

```javascript
// services/api.client.js
export class SpeedSniperApiClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.headers = { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
  }

  async createSession(resourceText, difficulty = 'medium') {
    const res = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ resourceText, difficulty })
    });
    if (!res.ok) throw await this._parseError(res);
    return res.json();
  }

  async submitTap(sessionId, { roundId, selectedAnswer, tapTimestamp }) {
    const res = await fetch(`${this.baseUrl}/sessions/${sessionId}/tap`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ roundId, selectedAnswer, tapTimestamp })
    });
    if (!res.ok) throw await this._parseError(res);
    return res.json();
  }

  async submitMiss(sessionId, roundId) {
    const res = await fetch(`${this.baseUrl}/sessions/${sessionId}/miss`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ roundId })
    });
    if (!res.ok) throw await this._parseError(res);
    return res.json();
  }

  async getResult(sessionId) {
    const res = await fetch(`${this.baseUrl}/sessions/${sessionId}/result`, { headers: this.headers });
    if (!res.ok) throw await this._parseError(res);
    return res.json();
  }

  async _parseError(res) {
    const body = await res.json().catch(() => ({}));
    return new Error(body?.error?.message || `HTTP ${res.status}`);
  }
}
```

---

## 9. Antigravity Component Registration

Register all components in a single `index.js` entry point:

```javascript
// ui/index.js
import { UploadZone } from './components/upload-zone/upload-zone.js';
import { GameLobby } from './components/game-lobby/game-lobby.js';
import { GameCanvas } from './components/game-canvas/game-canvas.js';
import { TokenSprite } from './components/token-sprite/token-sprite.js';
import { ScoreHud } from './components/score-hud/score-hud.js';
import { ResultsPanel } from './components/results-panel/results-panel.js';
import { SpeedSniperRoot } from './components/speed-sniper-root/speed-sniper-root.js';

customElements.define('upload-zone', UploadZone);
customElements.define('game-lobby', GameLobby);
customElements.define('game-canvas', GameCanvas);
customElements.define('token-sprite', TokenSprite);
customElements.define('score-hud', ScoreHud);
customElements.define('results-panel', ResultsPanel);
customElements.define('speed-sniper-root', SpeedSniperRoot);
```

Host page usage:
```html
<script type="module" src="/ui/index.js"></script>
<speed-sniper-root api-base="https://your-domain.com/api/v1" api-key="dev-key"></speed-sniper-root>
```
