import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * El build se escribe dentro de ../public (la carpeta que publica Cloudflare Pages)
 * SIN vaciarla: solo agrega tv-react.html y la carpeta tv-react-assets/.
 * tv.html, index.html, _headers y _routes.json quedan intactos.
 */
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "../public",
    emptyOutDir: false,
    assetsDir: "tv-react-assets",
    rollupOptions: { input: "tv-react.html" },
  },
  server: { port: 5174 },
});
