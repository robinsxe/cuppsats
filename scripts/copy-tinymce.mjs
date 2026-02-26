import { cp, copyFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "node_modules", "tinymce");
const dest = join(root, "public", "tinymce");

await mkdir(dest, { recursive: true });

// Copy directories: skins, icons, themes, models, plugins
for (const folder of ["skins", "icons", "themes", "models", "plugins"]) {
  await cp(join(src, folder), join(dest, folder), { recursive: true });
}

// Copy core JS file
await copyFile(join(src, "tinymce.min.js"), join(dest, "tinymce.min.js"));

console.log("TinyMCE assets copied to public/tinymce/");
