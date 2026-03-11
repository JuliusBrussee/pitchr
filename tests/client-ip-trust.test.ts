import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { getClientIpFallback } from '@/lib/rateLimit';

const ORIGINAL_ENV = {
  TRUST_PROXY_HEADERS: process.env.TRUST_PROXY_HEADERS,
  TRUSTED_CLIENT_IP_HEADERS: process.env.TRUSTED_CLIENT_IP_HEADERS,
};

function restoreEnv() {
  if (ORIGINAL_ENV.TRUST_PROXY_HEADERS === undefined) {
    delete process.env.TRUST_PROXY_HEADERS;
  } else {
    process.env.TRUST_PROXY_HEADERS = ORIGINAL_ENV.TRUST_PROXY_HEADERS;
  }

  if (ORIGINAL_ENV.TRUSTED_CLIENT_IP_HEADERS === undefined) {
    delete process.env.TRUSTED_CLIENT_IP_HEADERS;
  } else {
    process.env.TRUSTED_CLIENT_IP_HEADERS = ORIGINAL_ENV.TRUSTED_CLIENT_IP_HEADERS;
  }
}

afterEach(() => {
  restoreEnv();
});

describe('getClientIpFallback trust model', () => {
  it('ignores forwarded headers unless proxy trust is explicitly enabled', () => {
    process.env.TRUST_PROXY_HEADERS = 'false';
    const request = new NextRequest('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '198.51.100.25',
      },
    });

    expect(getClientIpFallback(request)).toBeNull();
  });

  it('extracts first IP from x-forwarded-for when trust is enabled', () => {
    process.env.TRUST_PROXY_HEADERS = 'true';
    const request = new NextRequest('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '198.51.100.25, 203.0.113.1',
      },
    });

    expect(getClientIpFallback(request)).toBe('198.51.100.25');
  });

  it('supports header priority override with validation', () => {
    process.env.TRUST_PROXY_HEADERS = 'true';
    process.env.TRUSTED_CLIENT_IP_HEADERS = 'x-real-ip,x-forwarded-for';
    const request = new NextRequest('http://localhost/api/test', {
      headers: {
        'x-real-ip': 'not-an-ip',
        'x-forwarded-for': '203.0.113.7, 198.51.100.8',
      },
    });

    expect(getClientIpFallback(request)).toBe('203.0.113.7');
  });
});
