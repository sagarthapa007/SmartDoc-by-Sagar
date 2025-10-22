import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@context": path.resolve(__dirname, "./src/context"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@charts": path.resolve(__dirname, "./src/charts"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@store": path.resolve(__dirname, "./src/store"),
    },
  },
  optimizeDeps: { include: ["react-window"], force: true },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    commonjsOptions: { include: [/react-window/, /node_modules/] },
    rollupOptions: { external: [] },
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5174,
    open: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});