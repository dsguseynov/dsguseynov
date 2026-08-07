import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT_DIR = fileURLToPath(new URL("../assets/images/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const PURPLE = "#6C5CE7";
const PURPLE_LIGHT = "#8B7CF6";

function squareWithGlyph(size, { radius = 0, padding = 0, background = true, fill = "#ffffff" } = {}) {
  const inner = size - padding * 2;
  const bg = background
    ? `<defs>
        <linearGradient id="g" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${PURPLE}"/>
          <stop offset="1" stop-color="${PURPLE_LIGHT}"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>`
    : "";
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${bg}
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
      font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold"
      font-size="${inner * 0.52}" fill="${fill}">₽</text>
  </svg>`;
}

const targets = [
  { name: "icon.png", size: 1024, opts: { radius: 0, background: true } },
  { name: "favicon.png", size: 196, opts: { radius: 40, background: true } },
  { name: "splash-icon.png", size: 400, opts: { background: false, fill: PURPLE } },
  { name: "android-icon-background.png", size: 1024, opts: { radius: 0, background: true } },
  {
    name: "android-icon-foreground.png",
    size: 1024,
    opts: { background: false, padding: 200, fill: "#ffffff" },
  },
  {
    name: "android-icon-monochrome.png",
    size: 1024,
    opts: { background: false, padding: 200, fill: "#ffffff" },
  },
];

for (const t of targets) {
  await sharp(Buffer.from(squareWithGlyph(t.size, t.opts)))
    .png()
    .toFile(path.join(OUT_DIR, t.name));
  console.log("wrote", t.name);
}
