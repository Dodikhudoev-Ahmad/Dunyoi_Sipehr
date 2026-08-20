import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Heavy, rarely-changing deps get their own vendor chunks so an app-code deploy doesn't
        // invalidate the browser cache for them, and the admin-only libs (react-hook-form/zod)
        // aren't duplicated into the lazy-loaded admin chunk (see src/App.tsx / src/admin/AdminApp.tsx).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'vendor-react'
          if (id.includes('motion')) return 'vendor-motion'
          if (id.includes('@tanstack') || id.includes('axios')) return 'vendor-query'
          if (id.includes('i18next')) return 'vendor-i18n'
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'vendor-forms'
          if (id.includes('lucide-react')) return 'vendor-icons'
          return 'vendor'
        },
      },
    },
  },
})
