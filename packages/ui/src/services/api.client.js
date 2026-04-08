// packages/ui/src/services/api.client.js

export class SpeedSniperApiClient {
  constructor(apiBase) {
    this.apiBase = apiBase.replace(/\/$/, '');
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
    };
  }

  async _fetch(path, options = {}) {
    const res = await fetch(`${this.apiBase}${path}`, {
      ...options,
      headers: { ...this._headers(), ...(options.headers || {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(body?.error?.message || `HTTP ${res.status}`), {
        code: body?.error?.code,
        status: res.status,
      });
    }
    return res.status === 204 ? null : res.json();
  }

  /** POST /sessions */
  createSession({ resourceText, fileName, difficulty = 'medium', rounds = 10 }) {
    return this._fetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({ resourceText, fileName, difficulty, rounds }),
    });
  }

  /** GET /sessions/:id */
  getSession(sessionId) {
    return this._fetch(`/sessions/${sessionId}`);
  }

  /** POST /sessions/:id/start */
  startSession(sessionId) {
    return this._fetch(`/sessions/${sessionId}/start`, {
      method: 'POST',
    });
  }

  /** POST /sessions/:id/tap */
  tap(sessionId, { roundId, selectedAnswer, tapTimestamp }) {
    return this._fetch(`/sessions/${sessionId}/tap`, {
      method: 'POST',
      body: JSON.stringify({ roundId, selectedAnswer, tapTimestamp }),
    });
  }

  /** POST /sessions/:id/miss */
  miss(sessionId, { roundId }) {
    return this._fetch(`/sessions/${sessionId}/miss`, {
      method: 'POST',
      body: JSON.stringify({ roundId }),
    });
  }

  /** GET /sessions/:id/result */
  getResult(sessionId) {
    return this._fetch(`/sessions/${sessionId}/result`);
  }

  /** DELETE /sessions/:id */
  deleteSession(sessionId) {
    return this._fetch(`/sessions/${sessionId}`, { method: 'DELETE' });
  }

  /** GET /health */
  health() {
    return this._fetch('/health');
  }
}
