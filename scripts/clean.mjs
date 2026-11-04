import { rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
for (const name of ['dist', 'server.js']) {
  const target = path.resolve(root, name);
  if (path.dirname(target) !== root) throw new Error(`Chemin refusé : ${target}`);
  await rm(target, { recursive: name === 'dist', force: true });
}
