const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../src/server');

let server;
let baseUrl;

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json();

  return {
    body,
    status: response.status,
  };
}

before(() => {
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
});

test('GET /health returns the API status', async () => {
  const { body, status } = await getJson('/health');

  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(typeof body.uptime, 'number');
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test('GET /api/products returns paginated sorted products', async () => {
  const { body, status } = await getJson('/api/products?page=2&pageSize=5&sortBy=rating&sortOrder=desc');

  assert.equal(status, 200);
  assert.equal(body.items.length, 5);
  assert.equal(body.pagination.page, 2);
  assert.equal(body.pagination.pageSize, 5);
  assert.equal(body.pagination.hasPreviousPage, true);
  assert.equal(body.sort.sortBy, 'rating');
  assert.equal(body.sort.sortOrder, 'desc');
});

test('GET /api/products filters by search text', async () => {
  const { body, status } = await getJson('/api/products?search=mascara&pageSize=10');

  assert.equal(status, 200);
  assert.equal(body.search, 'mascara');
  assert.ok(body.items.length > 0);
  assert.ok(body.items.every((product) => JSON.stringify(product).toLowerCase().includes('mascara')));
});

test('GET /api/products/suggestions requires at least three search characters', async () => {
  const shortSearch = await getJson('/api/products/suggestions?search=ma');
  const validSearch = await getJson('/api/products/suggestions?search=mas');

  assert.equal(shortSearch.status, 200);
  assert.deepEqual(shortSearch.body.items, []);
  assert.equal(validSearch.status, 200);
  assert.ok(validSearch.body.items.length > 0);
  assert.ok(validSearch.body.items.every((item) => item.title && item.image));
});
