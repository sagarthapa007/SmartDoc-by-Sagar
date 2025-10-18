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

  // ✅ Ensures react-window is properly included in production
  optimizeDeps: {
    include: ["react-window"],
  },

  build: {
    outDir: "dist",
    emptyOutDir: true, // ✅ always clears dist before building
    commonjsOptions: {
      include: [/react-window/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: undefined, // ✅ disables code splitting issues
      },
    },
    chunkSizeWarningLimit: 1000, // optional: suppress size warning
  },

  server: {
    port: 517
