import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer, loadConfigFromFile, preview } from 'vite';

const configFile = fileURLToPath(new URL('../vite.config.ts', import.meta.url));
const webRoot = fileURLToPath(new URL('..', import.meta.url));
const distIndex = fileURLToPath(new URL('../dist/index.html', import.meta.url));
const spaPaths = [
  '/marketplace',
  '/marketplace?query=cats%20dogs&sort=new',
  '/marketplace/',
  '/more?x=1',
  '/meme/test-id',
  '/m?x=1'
];
const marker = 'vite-proxy-upstream-marker';

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

async function request(origin, pathname) {
  const response = await fetch(`${origin}${pathname}`, { headers: { accept: 'text/html' } });
  return { body: await response.text(), status: response.status };
}

function replaceTargets(proxy, target) {
  return Object.fromEntries(Object.entries(proxy).map(([key, options]) => [
    key,
    { ...options, target }
  ]));
}

function assertOnlyTargetsChanged(original, replacement, target) {
  assert.deepEqual(Object.keys(replacement), Object.keys(original));
  for (const [key, options] of Object.entries(original)) {
    assert.deepEqual(replacement[key], { ...options, target });
  }
}

async function loadProxyConfig(mode, section) {
  const loaded = await loadConfigFromFile({ command: 'serve', mode }, configFile);
  assert.ok(loaded, `Vite must load ${section} configuration`);
  const proxy = loaded.config[section]?.proxy;
  assert.ok(proxy, `${section} must retain a proxy map`);
  assert.deepEqual(Object.keys(proxy), ['/api', '/m/']);
  return proxy;
}

async function assertSpaAndProxies(origin, calls, expectedEntry) {
  for (const pathname of spaPaths) {
    const response = await request(origin, pathname);
    assert.equal(response.status, 200, `${pathname} should serve an SPA document`);
    assert.match(response.body, expectedEntry, `${pathname} should serve the SPA entry`);
    assert.equal(calls.length, 0, `${pathname} must not reach the upstream proxy`);
  }

  const memePath = '/m/test-id?query=cats%20dogs&x=1&x=2';
  const memeResponse = await request(origin, memePath);
  assert.equal(memeResponse.body, marker);
  assert.deepEqual(calls, [memePath]);

  const apiPath = '/api/test?same-query';
  const apiResponse = await request(origin, apiPath);
  assert.equal(apiResponse.body, marker);
  assert.deepEqual(calls, [memePath, apiPath]);
}

async function withDevServer(proxy, run) {
  // The file watcher is off (`watch: null`): this test only routes requests, it never edits a
  // file. With the watcher on, the dependency scan that `listen()` starts resolves workspace
  // packages (`@memeon/shared`) and registers their package.json with chokidar asynchronously; on
  // Linux that fs.watch can land after `close()` has already shut the watcher, and the leaked
  // handle keeps the process alive forever (CI sat 30 minutes after "passed" had printed). The
  // value has to be set on the loaded config object: `mergeConfig` drops `null` overrides, so an
  // inline `server.watch: null` beside `configFile` never reaches the server.
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, configFile);
  const server = await createServer({
    ...loaded.config,
    configFile: false,
    root: webRoot,
    mode: 'development',
    logLevel: 'silent',
    server: { ...loaded.config.server, host: '127.0.0.1', port: 0, strictPort: true, proxy, watch: null }
  });
  try {
    await server.listen();
    const address = server.httpServer.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await server.close();
  }
}

async function withPreviewServer(proxy, run) {
  const server = await preview({
    configFile,
    mode: 'production',
    logLevel: 'silent',
    preview: { host: '127.0.0.1', port: 0, strictPort: true, proxy }
  });
  try {
    const address = server.httpServer.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await server.close();
  }
}

const calls = [];
const upstream = createHttpServer((request, response) => {
  calls.push(request.url);
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(marker);
});

try {
  const upstreamOrigin = await listen(upstream);
  const devProxy = await loadProxyConfig('development', 'server');
  const previewProxy = await loadProxyConfig('production', 'preview');
  const devProxyWithMarker = replaceTargets(devProxy, upstreamOrigin);
  const previewProxyWithMarker = replaceTargets(previewProxy, upstreamOrigin);
  assertOnlyTargetsChanged(devProxy, devProxyWithMarker, upstreamOrigin);
  assertOnlyTargetsChanged(previewProxy, previewProxyWithMarker, upstreamOrigin);

  const legacyPrefixProxy = { ...devProxyWithMarker, '/m': devProxyWithMarker['/m/'] };
  delete legacyPrefixProxy['/m/'];
  await withDevServer(legacyPrefixProxy, async origin => {
    const response = await request(origin, '/marketplace');
    assert.equal(response.body, marker, 'the former /m prefix proxies /marketplace');
    assert.deepEqual(calls, ['/marketplace']);
  });

  calls.length = 0;
  await withDevServer(devProxyWithMarker, origin => assertSpaAndProxies(origin, calls, /\/[@]vite\/client[\s\S]*\/src\/main\.tsx/));

  const builtIndex = await readFile(distIndex, 'utf8');
  const builtEntry = builtIndex.match(/<script type="module"[^>]*src="([^"]+)"/u)?.[1];
  assert.ok(builtEntry, 'the built SPA must have a module entry');
  assert.match(builtEntry, /^\/assets\//u);

  calls.length = 0;
  await withPreviewServer(previewProxyWithMarker, origin => assertSpaAndProxies(origin, calls, new RegExp(builtEntry.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))));
  console.log('Vite dev and preview proxy routing passed.');
} finally {
  await close(upstream);
}
