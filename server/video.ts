import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

export type VideoRendition = { low: Buffer; poster: Buffer; hls: Record<string,Buffer>; durationSeconds: number; width: number; height: number };

export async function makeLowRendition(source: Buffer): Promise<VideoRendition> {
  const directory = await mkdtemp(path.join(tmpdir(), 'nzubu-video-'));
  const input = path.join(directory, 'source.mp4');
  const output = path.join(directory, 'low.mp4');
  const poster = path.join(directory, 'poster.jpg');
  try {
    await writeFile(input, source);
    const { stdout } = await run('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=width,height,duration','-of','json',input], { timeout: 30_000 });
    const stream = JSON.parse(stdout).streams?.[0];
    const width = Number(stream?.width);
    const height = Number(stream?.height);
    const durationSeconds = Number(stream?.duration);
    if (!width || !height || height < width || !Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 180 || width > 3840 || height > 3840) throw new Error('VIDEO_FORMAT_UNSUPPORTED');
    await run('ffmpeg', ['-nostdin','-v','error','-i',input,'-vf','scale=480:-2','-c:v','libx264','-preset','veryfast','-crf','30','-maxrate','600k','-bufsize','1200k','-c:a','aac','-b:a','64k','-movflags','+faststart','-y',output], { timeout: 120_000, maxBuffer: 1024 * 1024 });
    await run('ffmpeg', ['-nostdin','-v','error','-ss',String(Math.min(1,durationSeconds / 2)),'-i',input,'-frames:v','1','-vf','scale=480:-2','-y',poster], { timeout: 30_000 });
    for (const [name, size, rate] of [['low','360','450k'],['high','720','1200k']]) {
      await run('ffmpeg', ['-nostdin','-v','error','-i',input,'-vf',`scale=${size}:-2`,'-c:v','libx264','-preset','veryfast','-maxrate',rate,'-bufsize','1200k','-c:a','aac','-b:a','64k','-hls_time','4','-hls_playlist_type','vod','-hls_segment_filename',path.join(directory,`${name}%03d.ts`),'-y',path.join(directory,`${name}.m3u8`)], { timeout: 120_000, maxBuffer: 1024 * 1024 });
    }
    const master = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=600000\nlow.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1500000\nhigh.m3u8\n';
    await writeFile(path.join(directory, 'master.m3u8'), master);
    const hls: Record<string,Buffer> = {};
    for (const filename of await readdir(directory)) if (/^(master|low|high)\.m3u8$|^(low|high)\d{3}\.ts$/.test(filename)) hls[filename] = await readFile(path.join(directory,filename));
    return { low: await readFile(output), poster: await readFile(poster), hls, durationSeconds, width, height };
  } finally { await rm(directory, { recursive: true, force: true }); }
}
