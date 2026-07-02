import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const port = Number(process.env.PORT || 5174);
const adminPassword = process.env.ATMIKA_ADMIN_PASSWORD || 'change-me-atmika';
const sessionTtlMs = 1000 * 60 * 60 * 12;
const sessions = new Map();

const contentJsonPath = path.join(root, 'public', 'content.json');
const contentJsPath = path.join(root, 'public', 'content.js');
const backupDir = path.join(root, 'data', 'backups');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const json = (response, status, payload, headers = {}) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(payload));
};

const readBody = async (request, limit = 1024 * 1024 * 3) => new Promise((resolve, reject) => {
  let body = '';

  request.on('data', (chunk) => {
    body += chunk;

    if (body.length > limit) {
      reject(new Error('Слишком большой запрос'));
      request.destroy();
    }
  });

  request.on('end', () => resolve(body));
  request.on('error', reject);
});

const parseCookies = (request) => Object.fromEntries(
  String(request.headers.cookie || '')
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const index = cookie.indexOf('=');
      return [
        decodeURIComponent(cookie.slice(0, index)),
        decodeURIComponent(cookie.slice(index + 1)),
      ];
    }),
);

const getSession = (request) => {
  const token = parseCookies(request).atmika_admin_session;

  if (!token) {
    return null;
  }

  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  session.expiresAt = Date.now() + sessionTtlMs;
  return session;
};

const isSecureRequest = (request) => (
  request.headers['x-forwarded-proto'] === 'https'
  || process.env.NODE_ENV === 'production'
);

const sessionCookie = (request, token) => [
  `atmika_admin_session=${encodeURIComponent(token)}`,
  'Path=/',
  'HttpOnly',
  'SameSite=Strict',
  `Max-Age=${Math.floor(sessionTtlMs / 1000)}`,
  isSecureRequest(request) ? 'Secure' : '',
].filter(Boolean).join('; ');

const safeEqual = (left, right) => {
  const leftHash = createHash('sha256').update(String(left)).digest('hex');
  const rightHash = createHash('sha256').update(String(right)).digest('hex');
  return leftHash === rightHash;
};

const readContent = async () => JSON.parse(await readFile(contentJsonPath, 'utf8'));

const writeContent = async (content) => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error('Контент должен быть объектом');
  }

  await mkdir(backupDir, { recursive: true });

  const current = await readFile(contentJsonPath, 'utf8').catch(() => '');
  if (current) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await writeFile(path.join(backupDir, `content-${stamp}.json`), current, 'utf8');
  }

  const jsonText = `${JSON.stringify(content, null, 2)}\n`;
  const jsText = `window.ATMIKA_CONTENT = ${JSON.stringify(content, null, 2)};\n`;
  const tmpJson = `${contentJsonPath}.tmp`;
  const tmpJs = `${contentJsPath}.tmp`;

  await writeFile(tmpJson, jsonText, 'utf8');
  await writeFile(tmpJs, jsText, 'utf8');
  await rename(tmpJson, contentJsonPath);
  await rename(tmpJs, contentJsPath);
};

const handleApi = async (request, response, url) => {
  try {
    if (url.pathname === '/api/admin/session' && request.method === 'GET') {
      json(response, 200, { authenticated: Boolean(getSession(request)) });
      return;
    }

    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      const body = JSON.parse(await readBody(request) || '{}');

      if (!safeEqual(body.password, adminPassword)) {
        json(response, 401, { error: 'Неверный пароль' });
        return;
      }

      const token = randomBytes(32).toString('base64url');
      sessions.set(token, { expiresAt: Date.now() + sessionTtlMs });
      json(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie(request, token) });
      return;
    }

    if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
      const token = parseCookies(request).atmika_admin_session;

      if (token) {
        sessions.delete(token);
      }

      json(response, 200, { ok: true }, {
        'Set-Cookie': 'atmika_admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
      });
      return;
    }

    if (!getSession(request)) {
      json(response, 401, { error: 'Нужно войти в админку' });
      return;
    }

    if (url.pathname === '/api/admin/content' && request.method === 'GET') {
      json(response, 200, { content: await readContent() });
      return;
    }

    if (url.pathname === '/api/admin/content' && request.method === 'POST') {
      const body = JSON.parse(await readBody(request) || '{}');
      await writeContent(body.content);
      json(response, 200, { ok: true });
      return;
    }

    json(response, 404, { error: 'API endpoint not found' });
  } catch (error) {
    json(response, 500, { error: error.message || 'Ошибка сервера' });
  }
};

const serveStatic = async (request, response, url) => {
  const rawPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const normalized = path.normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(root, normalized);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    let target = filePath;
    const info = await stat(target);

    if (info.isDirectory()) {
      target = path.join(target, 'index.html');
      await stat(target);
    }

    const extension = path.extname(target).toLowerCase();
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' || extension === '.js' || extension === '.css'
        ? 'no-store'
        : 'public, max-age=2592000, immutable',
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname.startsWith('/api/admin/')) {
    await handleApi(request, response, url);
    return;
  }

  await serveStatic(request, response, url);
}).listen(port, '127.0.0.1', () => {
  console.log(`Atmika admin API listening on http://127.0.0.1:${port}`);

  if (adminPassword === 'change-me-atmika') {
    console.warn('ATMIKA_ADMIN_PASSWORD is not set. Using development password: change-me-atmika');
  }
});
