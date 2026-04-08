# ⚡ Speed Sniper

**Speed Sniper** is an AI-powered educational reflex game where you upload any study material (PDF, TXT, or Markdown) and test your knowledge in a fast-paced token-shooting game — questions generated live by Google Gemini.

![Speed Sniper Screenshot](docs/screenshot.png)

---

## 🎮 How It Works

1. **Upload** your study material (PDF, TXT, Markdown — up to 500KB)
2. **Choose** your difficulty: Easy, Medium, or Hard
3. **Play** — answer AI-generated questions by tapping the correct token as they drift across the screen
4. **Score** points with speed bonuses and combo multipliers

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/YOUR_USERNAME/Speed_Sniper.git
cd Speed_Sniper
npm install

# 2. Set up your environment
cp .env.example packages/api/.env
# Edit packages/api/.env and add your GEMINI_API_KEY

# 3. Build the API
npx tsc -p packages/api/tsconfig.app.json

# 4. Start the API server (terminal 1)
node packages/api/dist/main.js

# 5. Start the UI dev server (terminal 2)
npx nx serve ui
```

The game will be available at **http://localhost:8080**

---

## 🏗️ Architecture

```
Final_SS/
├── packages/
│   ├── api/          # Node.js / Express / TypeScript backend
│   │   ├── src/
│   │   │   ├── routes/       # REST API endpoints
│   │   │   ├── services/     # Gemini AI, session logic, scoring
│   │   │   ├── middleware/   # Validation, error handling
│   │   │   └── store/        # In-memory session storage
│   │   └── dist/             # Compiled output (gitignored)
│   └── ui/           # Vanilla Web Components frontend
│       └── src/
│           ├── components/   # Custom elements
│           ├── services/     # API client
│           └── utils/        # PDF extraction
└── docs/             # Architecture & API docs
```

**Key tech:**
- **Backend**: Node.js + Express + TypeScript, Zod validation, pino logging, rate limiting
- **AI**: Google Gemini 2.5 Flash — generates quiz questions from your content
- **Frontend**: Vanilla Web Components, PDF.js for client-side PDF extraction
- **Monorepo**: NX workspace

---

## 🔑 Environment Variables

Copy `.env.example` to `packages/api/.env` and fill in your values:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `PORT` | No | API port (default: `3000`) |
| `SESSION_TTL_MINUTES` | No | Session lifetime (default: `30`) |
| `CORS_ORIGINS` | No | Allowed origins (default: `*`) |

---

## 🧪 Testing

```bash
npx nx test @speed-sniper/api
```

---

## 🐳 Docker

```bash
docker build -t speed-sniper-api -f packages/api/Dockerfile .
docker run -p 3000:3000 --env-file packages/api/.env speed-sniper-api
```

---

## 📜 License

MIT © 2024
