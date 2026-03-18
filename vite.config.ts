import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
console.log("--------------------------------------------------");
console.log("LOADING VITE CONFIG WITH REACT PLUGIN");
console.log("--------------------------------------------------");
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/vite.config.ts'],
    },
  },
  plugins: [react(), /* mode === "development" && componentTagger() */].filter(Boolean),
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
