import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Off is already Vite's default, but this is a public site and shipping
    // readable sources is the kind of thing that silently turns back on when
    // someone adds a plugin or a preset. Stating it makes it reviewable.
    sourcemap: false,
  },
})
