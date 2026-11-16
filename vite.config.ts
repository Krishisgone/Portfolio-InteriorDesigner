import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' keeps the static build portable (any host, any sub-path).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Private sources must never be watched or served.
  server: { watch: { ignored: ['**/Projectss/**', '**/Mehul_Resume/**', '**/private/**'] } },
  build: { target: 'es2022', sourcemap: false },
})
