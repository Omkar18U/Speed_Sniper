// packages/ui/src/components/token-sprite/token-sprite.js

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    position: absolute;
    display: block;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    z-index: 10;
  }

  .hit-area {
    /* Invisible expanded hit area for easier tapping */
    padding: 16px;
    margin: -16px;
    cursor: pointer;
  }

  .pill {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    padding: 16px 28px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,235,255,0.95) 100%);
    border: 3px solid #7c3aed;
    box-shadow:
      0 4px 20px rgba(124, 58, 237, 0.4),
      0 0 40px rgba(124, 58, 237, 0.2),
      inset 0 2px 4px rgba(255,255,255,0.8);
    font-weight: 800;
    font-size: 1.1rem;
    color: #1e1b4b;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
    backdrop-filter: blur(8px);
    text-shadow: 0 1px 2px rgba(255,255,255,0.5);
    letter-spacing: 0.02em;
    pointer-events: auto;
  }

  .pill:hover {
    transform: scale(1.08);
    box-shadow:
      0 6px 30px rgba(124, 58, 237, 0.6),
      0 0 60px rgba(124, 58, 237, 0.3),
      inset 0 2px 4px rgba(255,255,255,0.8);
    border-color: #8b5cf6;
  }

  .pill:active {
    transform: scale(0.95);
    box-shadow:
      0 2px 10px rgba(124, 58, 237, 0.5),
      0 0 20px rgba(124, 58, 237, 0.2);
  }

  /* Correct answer glow pulse */
  :host([is-correct="true"]) .pill {
    animation: glow-pulse 1.5s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% {
      box-shadow:
        0 4px 20px rgba(124, 58, 237, 0.4),
        0 0 40px rgba(124, 58, 237, 0.2),
        inset 0 2px 4px rgba(255,255,255,0.8);
    }
    50% {
      box-shadow:
        0 4px 30px rgba(124, 58, 237, 0.6),
        0 0 60px rgba(124, 58, 237, 0.35),
        inset 0 2px 4px rgba(255,255,255,0.8);
    }
  }

  /* HIT state - Success animation */
  :host([state=hit]) .pill {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-color: #15803d;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    animation: hit-burst 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    pointer-events: none;
  }

  /* MISS state - Error animation */
  :host([state=miss]) .pill {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-color: #b91c1c;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    animation: miss-shake 400ms ease-out forwards;
    pointer-events: none;
  }

  @keyframes hit-burst {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    30% {
      transform: scale(1.4);
      opacity: 1;
      box-shadow: 0 0 60px rgba(34, 197, 94, 0.8), 0 0 100px rgba(34, 197, 94, 0.4);
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }

  @keyframes miss-shake {
    0% { transform: translateX(0); opacity: 1; }
    20% { transform: translateX(-8px) rotate(-2deg); }
    40% { transform: translateX(8px) rotate(2deg); }
    60% { transform: translateX(-4px); opacity: 0.7; }
    100% { transform: translateX(-60px); opacity: 0; }
  }

  /* Ripple effect on tap */
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(124, 58, 237, 0.4);
    transform: scale(0);
    animation: ripple-effect 0.6s linear;
    pointer-events: none;
  }

  @keyframes ripple-effect {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
</style>
<div class="hit-area">
  <div class="pill"><slot></slot></div>
</div>
`;

export class TokenSprite extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

    const hitArea = this.shadowRoot.querySelector('.hit-area');
    const pill = this.shadowRoot.querySelector('.pill');

    // Handle both click and touch for better mobile support
    const handleTap = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.getAttribute('state')) return; // Already tapped

      // Create ripple effect
      this._createRipple(e, pill);

      this.dispatchEvent(new CustomEvent('token-tap', {
        bubbles: true,
        composed: true,
        detail: {
          tokenId: this.getAttribute('token-id'),
          answer: this.getAttribute('answer'),
          timestamp: Date.now(),
        },
      }));
    };

    hitArea.addEventListener('click', handleTap);
    hitArea.addEventListener('touchend', handleTap, { passive: false });
  }

  _createRipple(event, container) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (rect.width / 2 - size / 2) + 'px';
    ripple.style.top = (rect.height / 2 - size / 2) + 'px';

    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  setState(state) {
    this.setAttribute('state', state);
  }
}

customElements.define('token-sprite', TokenSprite);
