import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

const analyze = process.env.VITE_BUNDLE_ANALYZE === "1";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.NODE_ENV === 'production' ? '/baby-vivi-lili-main/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    mode === 'development' &&
    componentTagger(),
    analyze && visualizer({
      filename: "dist/stats.html",
      open: false,
      template: "treemap",
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Enxoval Baby Brasil",
        short_name: "Enxoval",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          { urlPattern: /^\/assets\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "assets", expiration:{ maxEntries:200, maxAgeSeconds: 60*60*24*30 } } },
          { urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "supabase", networkTimeoutSeconds: 3,
              expiration:{ maxEntries:200, maxAgeSeconds: 60*60*24*7 } } },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react")) return "react-vendor";
          if (id.includes("@radix-ui")) return "radix-ui";
          if (id.includes("shadcn")) return "radix-ui";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("recharts")) return "recharts";
          // fallback geral de terceiros
          return "vendor";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
}));
