// packages/ui/src/components/game-lobby/game-lobby.js

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%; padding: 32px; box-sizing: border-box; font-family: inherit; }
  .card { background: white; border-radius: 20px; padding: 40px; max-width: 560px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
  h1 { margin: 0 0 4px; color: #1e1b4b; font-size: 1.8rem; }
  .summary { background: #f5f3ff; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 16px; margin: 20px 0; color: #374151; font-size: 0.95rem; line-height: 1.6; }
  h3 { margin: 24px 0 12px; color: #374151; font-size: 1rem; }
  .difficulty { display: flex; gap: 12px; }
  .difficulty label { flex: 1; }
  .difficulty input[type=radio] { display: none; }
  .difficulty input[type=radio] + span {
    display: block; padding: 10px 0; border-radius: 10px; border: 2px solid #e5e7eb; text-align: center;
    font-weight: 600; cursor: pointer; transition: all 0.15s; color: #6b7280;
  }
  .difficulty input[type=radio]:checked + span { border-color: #7c3aed; background: #7c3aed; color: white; }
  .start-btn {
    width: 100%; padding: 16px; margin-top: 28px; border: none; border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white;
    font-size: 1.1rem; font-weight: 700; cursor: pointer; letter-spacing: 0.5px;
    transition: transform 0.1s, box-shadow 0.1s;
    box-shadow: 0 4px 16px rgba(124,58,237,0.35);
  }
  .start-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(124,58,237,0.45); }
  .start-btn:active { transform: translateY(0); }
</style>
<div class="card">
  <h1>⚡ Speed Sniper</h1>
  <div class="summary"></div>
  <h3>Select Difficulty</h3>
  <div class="difficulty">
    <label><input type="radio" name="diff" value="easy"><span>Easy</span></label>
    <label><input type="radio" name="diff" value="medium" checked><span>Medium</span></label>
    <label><input type="radio" name="diff" value="hard"><span>Hard</span></label>
  </div>
  <button class="start-btn">🎯 Start Game</button>
</div>
`;

export class GameLobby extends HTMLElement {
  static get observedAttributes() { return ['summary']; }

  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
    this._summary = this.shadowRoot.querySelector('.summary');
    this._summary.textContent = this.getAttribute('summary') || '';
    this.shadowRoot.querySelector('.start-btn').addEventListener('click', () => {
      const difficulty = this.shadowRoot.querySelector('input[name=diff]:checked')?.value || 'medium';
      this.dispatchEvent(new CustomEvent('game-start', { bubbles: true, composed: true, detail: { difficulty } }));
    });
  }

  attributeChangedCallback(name, _, val) {
    if (name === 'summary' && this.shadowRoot) this._summary.textContent = val;
  }
}

customElements.define('game-lobby', GameLobby);
