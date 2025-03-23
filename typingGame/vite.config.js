import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Or use "0.0.0.0" explicitly
    port: 5173, // Ensure this matches the port exposed in Docker
    strictPort: true, // Ensures the server fails if port 5173 is unavailable
    watch: {
      usePolling: true, // Useful for file watching in Docker
    },
  },
})
