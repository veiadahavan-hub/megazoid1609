module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/server.js', // Ignora o server principal
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  moduleNameMapper: {
    '^@supabase/supabase-js$': '<rootDir>/tests/__mocks__/supabase.js',
    '^ioredis$': '<rootDir>/tests/__mocks__/ioredis.js',
  },
};
