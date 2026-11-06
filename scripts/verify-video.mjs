import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const { makeLowRendition } = await import(process.env.VIDEO_MODULE || '../server/video.ts');
const directory = mkdtempSync(path.join(tmpdir(), 'nzubu-video-check-'));
try {
  const input = path.join(directory, 'sample.mp4');
  execFileSync('ffmpeg', ['-nostdin','-v','error','-f','lavfi','-i','testsrc=size=360x640:rate=24','-t','2','-c:v','libx264','-pix_fmt','yuv420p','-y',input], { timeout: 30_000 });
  const result = await makeLowRendition(readFileSync(input));
  assert.equal(result.width, 360);
  assert.equal(result.height, 640);
  assert.ok(result.poster.subarray(0,2).equals(Buffer.from([0xff,0xd8])));
  assert.ok(result.low.length > 100);
  assert.match(result.hls['master.m3u8'].toString(), /low\.m3u8/);
  assert.ok(Object.keys(result.hls).some((name) => name.endsWith('.ts')));
  console.log('Pipeline vidéo fictif vérifié : MP4 léger, vignette et HLS.');
} finally { rmSync(directory, { recursive: true, force: true }); }
