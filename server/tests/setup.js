/**
 * Setup global para testes
 * Este arquivo é executado antes de todos os testes
 */

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => require('./__mocks__/supabase'));

// Mock do Redis
jest.mock('ioredis', () => require('./__mocks__/ioredis'));

// Mock do BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: jest.fn().mockResolvedValue({
      id: 'mock-job-id',
      data: {},
      getState: jest.fn().mockResolvedValue('completed'),
    }),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(),
  })),
}));

// Mock do Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      goto: jest.fn().mockResolvedValue(),
      waitForFunction: jest.fn().mockResolvedValue(),
      evaluate: jest.fn().mockResolvedValue({ totalFrames: 60, frameRate: 30 }),
      screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
      setViewport: jest.fn().mockResolvedValue(),
      waitForTimeout: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue(),
    }),
    close: jest.fn().mockResolvedValue(),
  }),
}));

// Mock do child_process (para FFmpeg)
jest.mock('child_process', () => ({
  execFile: jest.fn((cmd, args, options, callback) => {
    if (callback) {
      callback(null, 'mock-stdout', 'mock-stderr');
    }
  }),
  exec: jest.fn((cmd, callback) => {
    if (callback) {
      callback(null, 'mock-stdout', 'mock-stderr');
    }
  }),
}));

// Mock do fs para operações de arquivo
const originalFs = jest.requireActual('fs');
const mockFs = {
  ...originalFs,
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('{}'),
  unlinkSync: jest.fn(),
  rmSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue([]),
  statSync: jest.fn().mockReturnValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 1000,
    mtimeMs: Date.now(),
  }),
  promises: {
    mkdir: jest.fn().mockResolvedValue(),
    writeFile: jest.fn().mockResolvedValue(),
    readFile: jest.fn().mockResolvedValue('{}'),
    unlink: jest.fn().mockResolvedValue(),
    rm: jest.fn().mockResolvedValue(),
    readdir: jest.fn().mockResolvedValue([]),
    stat: jest.fn().mockResolvedValue({
      isFile: () => true,
      isDirectory: () => false,
      size: 1000,
      mtimeMs: Date.now(),
    }),
  },
};
jest.mock('fs', () => mockFs);
jest.mock('fs/promises', () => mockFs.promises);

// Mock do dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';

// Limpar mocks entre testes
afterEach(() => {
  jest.clearAllMocks();
});

// Timeout global para testes
jest.setTimeout(10000);
