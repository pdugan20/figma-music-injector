import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [['src/ui/**', 'jsdom']],
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
})
