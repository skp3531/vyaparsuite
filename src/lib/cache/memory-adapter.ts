import type { ICacheAdapter } from './adapter';

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number | null;
  timer?: NodeJS.Timeout;
}

export class MemoryCacheAdapter implements ICacheAdapter {
  private cache = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      if (entry.timer) clearTimeout(entry.timer);
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const existing = this.cache.get(key);
    if (existing?.timer) {
      clearTimeout(existing.timer);
    }

    let expiresAt: number | null = null;
    let timer: NodeJS.Timeout | undefined;

    if (ttlSeconds && ttlSeconds > 0) {
      expiresAt = Date.now() + ttlSeconds * 1000;
      timer = setTimeout(() => {
        this.cache.delete(key);
      }, ttlSeconds * 1000);

      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    }

    this.cache.set(key, {
      value,
      expiresAt,
      timer,
    });
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry?.timer) {
      clearTimeout(entry.timer);
    }
    this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    // Convert wildcard pattern (e.g. "tenant:*:users") to regular expression
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${escaped}$`);

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        if (entry.timer) {
          clearTimeout(entry.timer);
        }
        this.cache.delete(key);
      }
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async clear(): Promise<void> {
    for (const [, entry] of this.cache) {
      if (entry.timer) {
        clearTimeout(entry.timer);
      }
    }
    this.cache.clear();
  }

  async increment(key: string, by: number = 1): Promise<number> {
    const entry = this.cache.get(key);

    let currentValue = 0;
    let remainingTtlSeconds: number | undefined;

    if (entry) {
      if (entry.expiresAt !== null) {
        const remainingMs = entry.expiresAt - Date.now();
        if (remainingMs > 0) {
          remainingTtlSeconds = Math.ceil(remainingMs / 1000);
          currentValue = typeof entry.value === 'number' ? entry.value : 0;
        }
      } else {
        currentValue = typeof entry.value === 'number' ? entry.value : 0;
      }
    }

    const nextValue = currentValue + by;
    await this.set(key, nextValue, remainingTtlSeconds);
    return nextValue;
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    return this.increment(key, -by);
  }
}

export function createMemoryCacheAdapter(): ICacheAdapter {
  return new MemoryCacheAdapter();
}
