import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: [
      'hooks/**/*.test.ts',
      'hooks/**/*.test.tsx',
      'lib/**/*.test.ts',
      'lib/**/*.test.tsx',
      'services/**/*.test.ts',
      'services/**/*.test.tsx',
      'views/**/*.test.ts',
      'views/**/*.test.tsx',
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
    ],
    exclude: ['node_modules/**', 'tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'npm:@supabase/supabase-js@^2.97.0': '@supabase/supabase-js',
    },
  },
  assetsInclude: ['**/*.glsl'],
});
