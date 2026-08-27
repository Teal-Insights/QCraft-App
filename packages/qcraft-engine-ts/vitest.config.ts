import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Golden-master sweeps read many CSVs; keep output readable on failure.
    reporters: ['default'],
  },
});
