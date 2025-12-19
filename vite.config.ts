import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "yjs": path.resolve(__dirname, "node_modules/yjs"),
      "y-prosemirror": path.resolve(__dirname, "node_modules/y-prosemirror"),
      "y-protocols": path.resolve(__dirname, "node_modules/y-protocols"),
      "prosemirror-model": path.resolve(__dirname, "node_modules/prosemirror-model"),
      "prosemirror-state": path.resolve(__dirname, "node_modules/prosemirror-state"),
      "prosemirror-view": path.resolve(__dirname, "node_modules/prosemirror-view"),
      "prosemirror-transform": path.resolve(__dirname, "node_modules/prosemirror-transform"),
      "prosemirror-schema-list": path.resolve(__dirname, "node_modules/prosemirror-schema-list"),
    }
  }
})
