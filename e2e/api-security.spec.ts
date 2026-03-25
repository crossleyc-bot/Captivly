import { test, expect } from '@playwright/test';

/**
 * Tests that internal API routes are properly protected and return
 * correct error responses for unauthenticated requests.
 */
test.describe('Internal API route protection', () => {
  test('POST /api/leads/score returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/leads/score', {
      data: { lead_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/sequences/send returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/sequences/send', {
      data: { message_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/sequences/generate returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/sequences/generate', {
      data: { campaign_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/reports/generate returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/reports/generate');
    expect(response.status()).toBe(401);
  });
});

test.describe('Public API validation', () => {
  test('POST /api/contact returns 400 for missing fields', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: { name: '', email: '', message: '' },
    });
    expect(response.status()).toBe(400);
  });

  test('POST /api/contact returns 400 for invalid email', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: { name: 'Test', email: 'not-an-email', message: 'Hello' },
    });
    expect(response.status()).toBe(400);
  });

  test('POST /api/chat returns 400 for missing business_id', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: { message: 'Hello' },
    });
    expect(response.status()).toBe(400);
  });

  test('POST /api/stripe/create-checkout returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/stripe/create-checkout', {
      data: { plan: 'growth' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Webhook endpoint validation', () => {
  test('POST /api/meta/webhook returns 200 for non-page objects', async ({ request }) => {
    const response = await request.post('/api/meta/webhook', {
      data: { object: 'instagram', entry: [] },
    });
    expect(response.status()).toBe(200);
  });

  test('POST /api/google/webhook returns 400 for missing data', async ({ request }) => {
    const response = await request.post('/api/google/webhook', {
      data: { message: {} },
    });
    expect(response.status()).toBe(400);
  });

  test('GET /api/meta/webhook with valid token returns 200', async ({ request }) => {
    const response = await request.get('/api/meta/webhook', {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'captivly_webhook_secret',
        'hub.challenge': 'test_challenge_123',
      },
    });
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('test_challenge_123');
  });

  test('GET /api/meta/webhook with invalid token returns 403', async ({ request }) => {
    const response = await request.get('/api/meta/webhook', {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'test',
      },
    });
    expect(response.status()).toBe(403);
  });
});
