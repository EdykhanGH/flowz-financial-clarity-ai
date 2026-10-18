import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const src = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "src");

export default defineConfig(({ mode }) => {
  const demo = mode === "demo";
  return {
    plugins: [react()],
    resolve: {
      alias: [
        // The demo build swaps the backend for sample data kept in the browser.
        ...(demo
          ? [
              { find: /^@\/lib\/supabase$/, replacement: path.join(src, "demo/supabase.ts") },
              { find: /^@\/lib\/api$/, replacement: path.join(src, "demo/api.ts") },
            ]
          : []),
        { find: "@", replacement: src },
      ],
    },
    build: demo ? { outDir: "dist-demo", assetsInlineLimit: 100_000, cssCodeSplit: false } : undefined,
    server: { host: true, port: 8080 },
  };
});
