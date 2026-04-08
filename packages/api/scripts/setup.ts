import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function run(cmd: string, cwd: string = ROOT): void {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function fileExists(p: string): boolean {
  return fs.existsSync(p);
}

async function main(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║          SPEED SNIPER — SETUP                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\n');

  // ── Step 1: Check if .env already has a real key ──────────
  let existingKey = '';
  if (fileExists(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const match = envContent.match(/^GEMINI_API_KEY=(.+)$/m);
    if (match && match[1] && match[1] !== 'your_gemini_api_key_here') {
      existingKey = match[1];
    }
  }

  let geminiKey = existingKey;

  if (existingKey) {
    console.log(`✅  Found existing Gemini API key in .env`);
    const reuse = await ask('   Use this key? (Y/n): ');
    if (reuse.toLowerCase() === 'n') {
      geminiKey = '';
    }
  }

  // ── Step 2: Ask for key if not reusing ────────────────────
  if (!geminiKey) {
    console.log('\n📋  You need a Google Gemini API key.');
    console.log('    Get one free at: https://aistudio.google.com/app/apikey\n');
    geminiKey = await ask('🔑  Paste your Gemini API key here: ');

    if (!geminiKey || geminiKey.length < 10) {
      console.error('\n❌  Invalid key. Please try again.\n');
      process.exit(1);
    }
  }

  // ── Step 3: Write .env ────────────────────────────────────
  const envContent = [
    `GEMINI_API_KEY=${geminiKey}`,
    `PORT=3000`,
    `SESSION_TTL_MINUTES=30`,
    `CORS_ORIGINS=*`,
    `LOG_LEVEL=info`,
  ].join('\n') + '\n';

  fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
  console.log('\n✅  Gemini API key saved to api/.env\n');

  // ── Step 4: Install dependencies if needed ────────────────
  if (!fileExists(path.join(ROOT, 'node_modules'))) {
    console.log('📦  Installing dependencies...\n');
    run('npm install', ROOT);
    console.log('\n✅  Dependencies installed\n');
  } else {
    console.log('✅  Dependencies already installed\n');
  }

  // ── Step 5: Build ─────────────────────────────────────────
  console.log('🔨  Building project...\n');
  run('npm run build', ROOT);
  console.log('\n✅  Build complete\n');

  // ── Step 6: Start API server ──────────────────────────────
  console.log('🚀  Starting Speed Sniper API on http://localhost:3000\n');
  const server = spawn('node', ['dist/index.js'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env },
    detached: false,
  });

  // ── Step 7: Wait for server to be ready, then open browser ─
  await new Promise<void>((resolve) => setTimeout(resolve, 2000));

  console.log('\n🌐  Opening game in browser...\n');

  // FIX: In monorepo, ui/src/index.html is the source
  const uiPath = path.resolve(ROOT, '..', 'ui', 'src', 'index.html');
  const uiUrl = fileExists(uiPath) ? `file://${uiPath}` : 'http://localhost:3000';

  const openCmd =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32'  ? 'start' :
                                    'xdg-open';

  try {
    run(`${openCmd} "${uiUrl}"`);
  } catch {
    console.log(`   Could not auto-open browser. Open this manually:\n   ${uiUrl}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  Speed Sniper is running!');
  console.log(`   API:  http://localhost:3000/api/v1`);
  console.log(`   UI:   ${uiUrl}`);
  console.log('   Press Ctrl+C to stop.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Keep process alive (server runs until Ctrl+C)
  server.on('exit', (code) => {
    console.log(`\nServer stopped (exit code ${code ?? 0})`);
    process.exit(code ?? 0);
  });
}

main().catch((err: unknown) => {
  console.error('\n❌  Setup failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
