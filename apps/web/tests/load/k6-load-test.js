import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 25 },   // Ramp up to 25 users
    { duration: '2m', target: 50 },   // Hold at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // p95 < 500ms, p99 < 1s
    errors: ['rate<0.05'],                           // Error rate < 5%
    api_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Cookie: AUTH_TOKEN } : {}),
};

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`, { headers });
    check(res, {
      'health status 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  group('Dashboard APIs', () => {
    const endpoints = [
      '/api/dashboard/commercial',
      '/api/dashboard/operational',
      '/api/dashboard/semaforo',
    ];

    for (const endpoint of endpoints) {
      const res = http.get(`${BASE_URL}${endpoint}`, { headers });
      check(res, {
        [`${endpoint} responds`]: (r) => r.status === 200 || r.status === 401,
      });
      errorRate.add(res.status >= 500);
      apiDuration.add(res.timings.duration);
    }
  });

  group('Core Business APIs', () => {
    // Leads list
    const leadsRes = http.get(`${BASE_URL}/api/leads?page=1&limit=20`, { headers });
    check(leadsRes, {
      'leads responds': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(leadsRes.status >= 500);
    apiDuration.add(leadsRes.timings.duration);

    // Quotes list
    const quotesRes = http.get(`${BASE_URL}/api/quotes?page=1&limit=20`, { headers });
    check(quotesRes, {
      'quotes responds': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(quotesRes.status >= 500);
    apiDuration.add(quotesRes.timings.duration);

    // Orders list
    const ordersRes = http.get(`${BASE_URL}/api/orders?page=1&limit=20`, { headers });
    check(ordersRes, {
      'orders responds': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(ordersRes.status >= 500);
    apiDuration.add(ordersRes.timings.duration);

    // Products list
    const productsRes = http.get(`${BASE_URL}/api/products?page=1&limit=20`, { headers });
    check(productsRes, {
      'products responds': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(productsRes.status >= 500);
    apiDuration.add(productsRes.timings.duration);

    // Customers list
    const customersRes = http.get(`${BASE_URL}/api/customers?page=1&limit=20`, { headers });
    check(customersRes, {
      'customers responds': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(customersRes.status >= 500);
    apiDuration.add(customersRes.timings.duration);
  });

  group('Notification & Reports', () => {
    const notifRes = http.get(`${BASE_URL}/api/notifications?page=1&limit=10`, { headers });
    check(notifRes, {
      'notifications responds': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(notifRes.status >= 500);
    apiDuration.add(notifRes.timings.duration);

    const reportsRes = http.get(`${BASE_URL}/api/reports`, { headers });
    check(reportsRes, {
      'reports responds': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(reportsRes.status >= 500);
    apiDuration.add(reportsRes.timings.duration);
  });

  sleep(1); // Think time between iterations
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  // k6 built-in text summary
  return JSON.stringify(data, null, 2);
}
