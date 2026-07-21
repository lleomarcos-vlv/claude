import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server em :5173 com proxy de /api para o backend (:8080),
// evitando CORS durante o desenvolvimento.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
