import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/word-in-heart-recitation/",
  plugins: [react()],
  publicDir: "public",
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
  },
});
