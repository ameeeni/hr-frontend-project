import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text', 'html'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules/**',
        '**/*.spec.ts',
        'src/main.ts',
        'src/environments/**',
        '**/*.config.ts',
        '**/*.config.js',
        'coverage/**',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
