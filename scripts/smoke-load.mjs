import assert from 'node:assert/strict';

const base = process.env.TEST_API_BASE || 'http://localhost:3001/v1';
const paths = ['/health','/listings'];
const durations = [];
let failures = 0;
for (let batch = 0; batch < 10; batch++) {
  await Promise.all(Array.from({ length: 10 }, async (_, index) => {
    const start = performance.now();
    try {
      const response = await fetch(`${base}${paths[index % paths.length]}`);
      if (!response.ok) failures++;
      await response.arrayBuffer();
    } catch { failures++; }
    durations.push(performance.now() - start);
  }));
}
durations.sort((a,b) => a-b);
const p95 = Math.round(durations[Math.ceil(durations.length * 0.95) - 1]);
console.log(`100 requêtes fictives : ${failures} échec(s), P95 ${p95} ms.`);
assert.equal(failures, 0);
assert.ok(p95 < 2000, 'P95 local supérieur à 2 secondes');
