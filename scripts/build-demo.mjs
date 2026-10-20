// Builds the demo and folds it into one self-contained HTML page (for sharing as a hosted preview).
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

execSync("npx vite build --mode demo", { stdio: "inherit" });

const dir = "dist-demo";
const assets = path.join(dir, "assets");
const files = readdirSync(assets);
const js = files.filter((f) => f.endsWith(".js")).map((f) => readFileSync(path.join(assets, f), "utf8")).join("\n");
const css = files.filter((f) => f.endsWith(".css")).map((f) => readFileSync(path.join(assets, f), "utf8")).join("\n");
const icon = `data:image/svg+xml;base64,${readFileSync("public/icon.svg").toString("base64")}`;

const page = `<title>Flowz</title>
<meta name="description" content="Flowz — Your interactive account notebook" />
<link rel="icon" href="${icon}" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js.replace(/<\/script/gi, "<\\/script")}
</script>
`;
writeFileSync(path.join(dir, "flowz-demo.html"), page);
console.log(`wrote ${dir}/flowz-demo.html (${Math.round(page.length / 1024)} KB)`);
