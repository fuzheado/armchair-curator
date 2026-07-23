// server.mjs — Static file server for Curator's Belt (Toolforge Kubernetes)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 8765;

const DIST = join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

// Cache policy: hash-named assets get immutable, HTML gets short cache
function cacheHeader(ext) {
  if (ext === '.html' || !ext) return 'public, max-age=0, must-revalidate';
  return 'public, max-age=31536000, immutable';
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let filePath = join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);

    // If file doesn't exist, serve index.html (SPA fallback)
    if (!existsSync(filePath)) {
      filePath = join(DIST, 'index.html');
    }

    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const mimeType = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': cacheHeader(ext),
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Fall back to index.html for SPA routing
      try {
        const html = await readFile(join(DIST, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Curator's Belt running on port ${PORT}`);
});
