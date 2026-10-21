import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Serves the Vercel functions in api/ during `npm run dev`, so the AI works locally too.
function localApi(): Plugin {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const name = req.url.slice(5).split("?")[0];
        let raw = "";
        for await (const chunk of req) raw += chunk;
        const mod = await server.ssrLoadModule(`/api/${name}.ts`);
        let code = 200;
        const shim = {
          status(c: number) { code = c; return shim; },
          json(body: unknown) {
            res.statusCode = code;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(body));
          },
        };
        await mod.default({ method: req.method, body: raw ? JSON.parse(raw) : {} }, shim);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return { plugins: [react(), localApi()] };
});
