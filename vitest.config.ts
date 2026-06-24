import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@engines': path.resolve(__dirname, 'src/engines'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@interfaces': path.resolve(__dirname, 'src/interfaces'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@modules': path.resolve(__dirname, 'src/modules'),
    },
  },
});
