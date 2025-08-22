import fs from "fs";
import path from "path";
import sharp from "sharp";

const ensure = (p) => fs.mkdirSync(p, { recursive: true });

const srcs = [
  { in: "src/assets/hero-baby.jpg", out: "public/images/hero-baby" },
  { in: "src/assets/teddy-bear.jpg", out: "public/images/teddy-bear" },
];

for (const s of srcs) {
  ensure(path.dirname(s.out));
  try {
    await sharp(s.in).avif({ quality: 50 }).toFile(`${s.out}.avif`);
    await sharp(s.in).webp({ quality: 70 }).toFile(`${s.out}.webp`);
  } catch (e) {
    console.warn("Skip:", s.in, e?.message);
  }
}

ensure("public/icons");
await sharp("src/assets/teddy-bear.jpg").resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp("public/icons/icon-512.png").resize(192, 192).toFile("public/icons/icon-192.png");
await sharp("public/icons/icon-512.png").resize(512, 512).toFile("public/icons/maskable-512.png");

console.log("Imagens/ícones gerados");
