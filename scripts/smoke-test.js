// scripts/smoke-test.js
const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

async function request(path, method = 'GET', body = null) {
  const url = new URL(`${API_BASE}${path}`);
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
          } else {
            resolve(data ? JSON.parse(data) : null);
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSmokeTest() {
  console.log('🚀 Starting Speed Sniper Smoke Test...');

  try {
    // 1. Health Check
    console.log('Checking health...');
    const health = await request('/health');
    console.log('✅ Health OK:', health);

    // 2. Create Session
    console.log('Creating session...');
    const session = await request('/sessions', 'POST', {
      resourceText: 'This is a test resource for smoke testing. It needs to be at least 10 chars.',
      difficulty: 'easy',
      rounds: 3
    });
    const sessionId = session.sessionId;
    console.log(`✅ Session created: ${sessionId}`);

    // 3. Process Tap (Round 1)
    const round1 = session.rounds[0];
    console.log(`Tapping round 1 (ID: ${round1.id})...`);
    const tapResult = await request(`/sessions/${sessionId}/tap`, 'POST', {
      roundId: round1.id,
      selectedAnswer: round1.tokens.find(t => t.isCorrect).text,
      tapTimestamp: Date.now()
    });
    console.log('✅ Tap result:', tapResult.correct ? 'Correct' : 'Failed');

    // 4. Get Result (Should fail because not complete)
    console.log('Checking result (expecting 409)...');
    try {
      await request(`/sessions/${sessionId}/result`);
    } catch (err) {
      if (err.message.includes('409')) {
        console.log('✅ Correctly refused result for incomplete session');
      } else {
        throw err;
      }
    }

    // 5. Delete Session
    console.log('Deleting session...');
    await request(`/sessions/${sessionId}`, 'DELETE');
    console.log('✅ Session deleted');

    console.log('\n✨ Smoke test PASSED!');
  } catch (error) {
    console.error('\n❌ Smoke test FAILED!');
    console.error(error);
    process.exit(1);
  }
}

runSmokeTest();
