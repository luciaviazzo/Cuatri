/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    // Limita los procesos en paralelo: con muchos archivos de prueba, los workers se quedaban sin
    // arrancar a tiempo en equipos con poca holgura.
    maxWorkers: 3,
    testTimeout: 15_000,
    globals: true,
    setupFiles: './src/test-setup.ts',
    coverage: { provider: 'v8', reporter: ['lcov', 'text'] },
  },
})
