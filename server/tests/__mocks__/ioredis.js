/**
 * Mock do Redis (ioredis) para testes
 * Este mock simula o comportamento do Redis sem conectar ao serviço real
 */

class MockRedis {
  constructor() {
    this.store = new Map();
    this.connected = true;
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, ...args) {
    this.store.set(key, value);
    return 'OK';
  }

  async del(key) {
    this.store.delete(key);
    return 1;
  }

  async exists(key) {
    return this.store.has(key) ? 1 : 0;
  }

  async incr(key) {
    const value = parseInt(this.store.get(key) || '0') + 1;
    this.store.set(key, value.toString());
    return value;
  }

  async decr(key) {
    const value = parseInt(this.store.get(key) || '0') - 1;
    this.store.set(key, value.toString());
    return value;
  }

  async expire(key, seconds) {
    return 1;
  }

  async ttl(key) {
    return -1;
  }

  async keys(pattern) {
    const allKeys = Array.from(this.store.keys());
    if (pattern === '*') return allKeys;
    const regex = new RegExp(pattern.replace('*', '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async zadd(key, score, member) {
    if (!this.store.has(key)) {
      this.store.set(key, []);
    }
    const set = this.store.get(key);
    set.push({ score, member });
    set.sort((a, b) => a.score - b.score);
    return 1;
  }

  async zremrangebyscore(key, min, max) {
    if (!this.store.has(key)) return 0;
    const set = this.store.get(key);
    const before = set.length;
    const filtered = set.filter(item => item.score < min || item.score > max);
    this.store.set(key, filtered);
    return before - filtered.length;
  }

  async zcard(key) {
    if (!this.store.has(key)) return 0;
    return this.store.get(key).length;
  }

  async zrange(key, start, stop, ...args) {
    if (!this.store.has(key)) return [];
    const set = this.store.get(key);
    const sliced = set.slice(start, stop === -1 ? undefined : stop + 1);
    if (args.includes('WITHSCORES')) {
      return sliced.flatMap(item => [item.member, item.score.toString()]);
    }
    return sliced.map(item => item.member);
  }

  async quit() {
    this.connected = false;
    return 'OK';
  }

  async ping() {
    return 'PONG';
  }

  on(event, callback) {
    return this;
  }
}

module.exports = MockRedis;
