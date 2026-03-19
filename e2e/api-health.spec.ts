import { test, expect } from '@playwright/test';

test.describe('API route availability', () => {
  test('GET /api/meta/webhook returns 403 without proper params', async ({ request }) => {
    const response = await request.get('/api/meta/webhook');
    expect(response.status()).toBe(403);
  });

  test('POST /api/stripe/webhook returns 400 without signature', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      data: '{}',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
  });

  test('GET /api/zapier/leads returns 401 without API key', async ({ request }) => {
    const response = await request.get('/api/zapier/leads');
    expect(response.status()).toBe(401);
  });

  test('GET /api/zapier/conversions returns 401 without API key', async ({ request }) => {
    const response = await request.get('/api/zapier/conversions');
    expect(response.status()).toBe(401);
  });
});
