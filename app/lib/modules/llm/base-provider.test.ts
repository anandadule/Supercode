import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

/*
 * Mock LLMManager to break the import chain — base-provider.ts imports it, and
 * LLMManager transitively imports the entire provider registry, which contains
 * classes that don't survive jsdom's module evaluation. We only need a
 * getInstance() that returns a stable empty env.
 */
vi.mock('./manager', () => ({
  LLMManager: {
    getInstance: () => ({ env: {} }),
  },
}));

import { BaseProvider } from './base-provider';

class TestProvider extends BaseProvider {
  name = 'TestProvider';
  staticModels = [];
  config = { apiTokenKey: 'TEST_API_KEY', baseUrlKey: 'TEST_BASE_URL' };
  getModelInstance(): never {
    throw new Error('not used in tests');
  }
}

describe('BaseProvider.getDynamicModelsCacheKey', () => {
  it('returns identical keys for identical inputs', () => {
    const p = new TestProvider();
    const opts = { apiKeys: { TestProvider: 'secret' } };
    expect(p.getDynamicModelsCacheKey(opts)).toBe(p.getDynamicModelsCacheKey(opts));
  });

  it('changes the key when the provider API key changes', () => {
    const p = new TestProvider();
    const a = p.getDynamicModelsCacheKey({ apiKeys: { TestProvider: 'secret-a' } });
    const b = p.getDynamicModelsCacheKey({ apiKeys: { TestProvider: 'secret-b' } });
    expect(a).not.toBe(b);
  });

  it('only includes relevant env keys (ignores unrelated ones)', () => {
    const p = new TestProvider();
    const opts = { serverEnv: { TEST_API_KEY: 'k', UNRELATED_VAR: 'noise' } };
    const key = p.getDynamicModelsCacheKey(opts);
    expect(key).toContain('TEST_API_KEY');
    expect(key).not.toContain('UNRELATED_VAR');
  });

  it('produces stable keys for equivalent provider settings', () => {
    const p = new TestProvider();
    const a = p.getDynamicModelsCacheKey({ providerSettings: { TestProvider: { enabled: true, baseUrl: 'a' } } });
    const b = p.getDynamicModelsCacheKey({ providerSettings: { TestProvider: { enabled: true, baseUrl: 'a' } } });
    expect(a).toBe(b);
  });
});

describe('BaseProvider.getModelsFromCache TTL', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns cached models within the TTL window', () => {
    const p = new TestProvider();
    const opts = { apiKeys: { TestProvider: 'k' } };
    p.storeDynamicModels(opts, [{ name: 'm', label: 'M', provider: 'TestProvider', maxTokenAllowed: 1000 }]);

    // Advance 9 minutes — still under the 10-minute TTL.
    vi.advanceTimersByTime(9 * 60 * 1000);
    expect(p.getModelsFromCache(opts)).not.toBeNull();
  });

  it('invalidates the cache after the TTL elapses', () => {
    const p = new TestProvider();
    const opts = { apiKeys: { TestProvider: 'k' } };
    p.storeDynamicModels(opts, [{ name: 'm', label: 'M', provider: 'TestProvider', maxTokenAllowed: 1000 }]);

    // Advance 11 minutes — past the 10-minute TTL.
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(p.getModelsFromCache(opts)).toBeNull();
  });

  it('invalidates when the cache key changes (e.g. user updates API key)', () => {
    const p = new TestProvider();
    p.storeDynamicModels({ apiKeys: { TestProvider: 'old' } }, []);

    const after = p.getModelsFromCache({ apiKeys: { TestProvider: 'new' } });
    expect(after).toBeNull();
  });
});
