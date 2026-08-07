import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT_DIR = fileURLToPath(new URL("../public/icons/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

function svg(size, { radius, padding = 0 }) {
  const inner = size - padding * 2;
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#6C5CE7"/>
        <stop offset="1" stop-color="#8B7CF6"/>
      </linearGradient>
    </defs>
    <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${radius}" fill="url(#g)"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
      font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold"
      font-size="${inner * 0.52}" fill="#ffffff">₽</text>
  </svg>`;
}

const targets = [
  { name: "icon-192.png", size: 192, radius: 40, padding: 0 },
  { name: "icon-512.png", size: 512, radius: 108, padding: 0 },
  { name: "icon-maskable-512.png", size: 512, radius: 0, padding: 64 },
  { name: "apple-touch-icon.png", size: 180, radius: 38, padding: 0 },
];

for (const t of targets) {
  await sharp(Buffer.from(svg(t.size, t)))
    .png()
    .toFile(path.join(OUT_DIR, t.name));
  console.log("wrote", t.name);
}
