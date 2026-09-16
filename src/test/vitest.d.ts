/// <reference types="vitest" />

import { expect, vi, test, describe, it, beforeEach, afterEach } from 'vitest';

declare global {
  const expect: typeof expect;
  const vi: typeof vi;
  const test: typeof test;
  const describe: typeof describe;
  const it: typeof it;
  const beforeEach: typeof beforeEach;
  const afterEach: typeof afterEach;
}

export {};
