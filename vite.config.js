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
    },
  },

  optimizeDeps: {
    include: ["react-window"],
    force: true, // ✅ ensure react-window is bundled properly
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    commonjsOptions: {
      include: [/react-window/, /node_modules/],
    },
    rollupOptions: {
      external: [], // no external packages are excluded
    },
    chunkSizeWarningLimit: 1500, // optional - silence 500kB warnings
  },

  server: {
    port: 5174,
  },
});
