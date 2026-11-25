// A tiny development server for game/ (Node 22, standard library only): run
// `node serve.ts` and open http://localhost:8080 to play Saffron Line. It only
// serves files under game/, so a typo in a path cannot reach the rest of disk.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const port = Number(process.env.PORT ?? 8080);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

createServer((request, response) => {
  const raw = decodeURIComponent((request.url ?? '/').split('?')[0]);
  const asked = raw === '/' ? '/index.html' : raw;
  const filePath = resolve(join(gameRoot, normalize(asked)));
  if (!filePath.startsWith(gameRoot + sep) && filePath !== gameRoot) {
    response.writeHead(403).end('outside game/');
    return;
  }
  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      response.writeHead(404).end('not a file');
      return;
    }
    response.writeHead(200, {
      'content-type': TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'content-length': stats.size,
      'cache-control': 'no-store',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end('not found');
  }
}).listen(port, () => {
  console.log(`Saffron Line is open at http://localhost:${port}`);
});
