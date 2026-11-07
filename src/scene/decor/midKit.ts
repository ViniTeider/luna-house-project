import * as THREE from "three";
import { canvasTexture, seededRandom } from "./canvas";

// Mid-century and collected: teak, moss velvet, rust and mustard, black and white
// graphics, warm paper light
export const TONES = {
  rust: "#a8482c",
  orange: "#e0672a",
  mustard: "#d1a032",
  moss: "#5c6a4a",
  olive: "#7d7f55",
  navy: "#243a63",
  teak: "#8a5a35",
  cream: "#efe7d6",
  ink: "#1c1b1a",
  pink: "#e98aa4",
  sky: "#7fb1d3",
};

// Bold black and cream zigzag across a rug that is `width` × `depth` m.
function zigzag(width: number, depth: number) {
  const w = 512,
    h = Math.round((512 * depth) / width);
  const tex = canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = TONES.cream;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = TONES.ink;
    const step = h / 7;
    for (let k = -1; k < 8; k++) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += w / 8) {
        const y = k * step + ((x / (w / 8)) % 2 ? step / 2 : 0);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let x = w; x >= 0; x -= w / 8) {
        const y = k * step + ((x / (w / 8)) % 2 ? step / 2 : 0) + step * 0.42;
        ctx.lineTo(x, y);
      }
      ctx.fill();
    }
  });
  tex.repeat.set(1 / width, 1 / depth);
  tex.anisotropy = 8;
  return tex;
}

// Two-color check. One copy is `size` m.
function checker(a: string, b: string, cells: number, size: number) {
  const px = 256,
    cell = px / cells;
  const tex = canvasTexture(
    px,
    px,
    (ctx) => {
      for (let i = 0; i < cells; i++)
        for (let j = 0; j < cells; j++) {
          ctx.fillStyle = (i + j) % 2 ? a : b;
          ctx.fillRect(i * cell, j * cell, cell, cell);
        }
    },
    true,
  );
  tex.repeat.setScalar(1 / size);
  return tex;
}

// Faded kilim runner: rust field, navy and cream bands, a row of hooked diamonds.
function kilim(width: number, depth: number) {
  const random = seededRandom(31);
  const w = 1024,
    h = Math.round((1024 * depth) / width);
  const tex = canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = "#8f3b2a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = TONES.navy;
    ctx.lineWidth = 14;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.strokeStyle = TONES.cream;
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    for (let x = 90; x < w - 60; x += 120) {
      ctx.fillStyle = TONES.navy;
      ctx.beginPath();
      ctx.moveTo(x, h / 2 - h * 0.28);
      ctx.lineTo(x + 46, h / 2);
      ctx.lineTo(x, h / 2 + h * 0.28);
      ctx.lineTo(x - 46, h / 2);
      ctx.fill();
      ctx.fillStyle = TONES.mustard;
      ctx.fillRect(x - 8, h / 2 - 8, 16, 16);
    }
    for (let i = 0; i < 30000; i++) {
      ctx.fillStyle = `rgba(240,220,200,${random() * 0.1})`;
      ctx.fillRect(random() * w, random() * h, 3, 1);
    }
  });
  tex.repeat.set(1 / width, 1 / depth);
  tex.anisotropy = 8;
  return tex;
}

// Rice paper with fine horizontal ribs, for the lanterns.
function ribbedPaper() {
  const tex = canvasTexture(
    64,
    256,
    (ctx) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 64, 256);
      ctx.fillStyle = "rgba(120,90,60,.22)";
      for (let y = 0; y < 256; y += 10) ctx.fillRect(0, y, 64, 2);
    },
    true,
  );
  tex.repeat.set(1, 3);
  return tex;
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const fill = (
  ctx: CanvasRenderingContext2D,
  color: string,
  w: number,
  h: number,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
};
const circle = (
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  r: number,
) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

// Gallery prints and album covers: graphic shapes only, no text
const PRINTS = {
  stack: (ctx, w, h) => {
    fill(ctx, "#e7dfcd", w, h);
    [TONES.ink, TONES.cream, TONES.ink].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(
        w / 2,
        h * (0.32 + i * 0.16),
        w * 0.3,
        h * 0.07,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
    ctx.fillStyle = TONES.rust;
    ctx.fillRect(0, h * 0.86, w, h * 0.14);
  },
  stripes: (ctx, w, h) => {
    fill(ctx, TONES.rust, w, h);
    ctx.fillStyle = TONES.pink;
    for (let x = w * 0.1; x < w; x += w * 0.16)
      ctx.fillRect(x, h * 0.1, w * 0.07, h * 0.8);
  },
  night: (ctx, w, h) => {
    fill(ctx, "#1f2a3a", w, h);
    ctx.fillStyle = "#2f8fb0";
    ctx.fillRect(w * 0.2, h * 0.45, w * 0.6, h * 0.3);
    ctx.fillStyle = TONES.mustard;
    ctx.fillRect(w * 0.25, h * 0.38, w * 0.5, h * 0.07);
    for (let i = 0; i < 4; i++)
      circle(ctx, "#ffe6a0", w * (0.3 + i * 0.13), h * 0.55, w * 0.03);
  },
  sun: (ctx, w, h) => {
    fill(ctx, TONES.mustard, w, h);
    circle(ctx, TONES.orange, w / 2, h * 0.42, w * 0.28);
    ctx.fillStyle = TONES.moss;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
  },
  blobs: (ctx, w, h) => {
    fill(ctx, TONES.cream, w, h);
    ctx.fillStyle = TONES.ink;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(
        w * (0.3 + (i % 2) * 0.38),
        h * (0.25 + i * 0.17),
        w * 0.2,
        h * 0.07,
        i * 0.7,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.lineWidth = w * 0.05;
    ctx.strokeStyle = TONES.ink;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.62, w * 0.22, 0.2, Math.PI);
    ctx.stroke();
  },
  pool: (ctx, w, h) => {
    fill(ctx, "#f1e6d2", w, h);
    ctx.fillStyle = TONES.sky;
    ctx.fillRect(w * 0.08, h * 0.45, w * 0.84, h * 0.42);
    ctx.fillStyle = "#c9b48e";
    ctx.fillRect(w * 0.08, h * 0.38, w * 0.84, h * 0.07);
    [TONES.rust, TONES.ink, TONES.pink].forEach((c, i) =>
      circle(ctx, c, w * (0.25 + i * 0.25), h * 0.33, w * 0.04),
    );
  },
  dots: (ctx, w, h) => {
    fill(ctx, TONES.moss, w, h);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 4; j++)
        circle(
          ctx,
          (i + j) % 2 ? TONES.cream : TONES.orange,
          w * (0.25 + i * 0.25),
          h * (0.2 + j * 0.2),
          w * 0.08,
        );
  },
  cactus: (ctx, w, h) => {
    fill(ctx, TONES.pink, w, h);
    ctx.fillStyle = TONES.moss;
    ctx.fillRect(w * 0.42, h * 0.25, w * 0.16, h * 0.6);
    ctx.fillRect(w * 0.25, h * 0.4, w * 0.12, h * 0.2);
    ctx.fillRect(w * 0.63, h * 0.32, w * 0.12, h * 0.2);
    ctx.fillStyle = TONES.rust;
    ctx.fillRect(w * 0.32, h * 0.82, w * 0.36, h * 0.12);
  },
} satisfies Record<string, Draw>;

export type PrintKey = keyof typeof PRINTS;

export function midMaterials() {
  const plain = (color: string, roughness = 0.9, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const textured = (map: THREE.Texture, roughness = 0.95) =>
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness, map });
  const ribs = ribbedPaper();
  const paper = (color: string, glow: string) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.95,
      map: ribs,
      emissive: glow,
      emissiveMap: ribs,
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    });
  const papers = [paper("#f6efe2", "#ffcf96"), paper("#e8682c", "#ff7a2e")];

  const materials = {
    prints: Object.fromEntries(
      Object.entries(PRINTS).map(([key, draw]) => [
        key,
        textured(
          canvasTexture(240, 320, (ctx) => draw(ctx, 240, 320)),
          0.7,
        ),
      ]),
    ) as Record<PrintKey, THREE.MeshStandardMaterial>,
    // Square versions of the prints, for the album covers
    covers: Object.values(PRINTS).map((draw) =>
      textured(
        canvasTexture(200, 200, (ctx) => draw(ctx, 200, 200)),
        0.6,
      ),
    ),
    whitePaper: papers[0],
    orangePaper: papers[1],
    zigzag: textured(zigzag(2.4, 1.5), 1),
    checkerCushion: textured(checker(TONES.rust, TONES.cream, 4, 1)),
    checkerRug: textured(checker("#7a5236", "#e9dcc4", 8, 1), 1),
    checkerMat: textured(checker(TONES.mustard, TONES.cream, 6, 0.5), 1),
    kilim: textured(kilim(2.2, 0.56), 1),
    // Textiles, velvet and leather
    rust: plain(TONES.rust, 0.8),
    mustard: plain(TONES.mustard, 0.95),
    moss: plain(TONES.moss, 0.85),
    olive: plain(TONES.olive, 0.95),
    navy: plain(TONES.navy, 0.85),
    leather: plain("#1d1b1a", 0.45),
    // Wall paint
    paintRust: plain("#a9614f", 0.95),
    // Wood, ceramic and metal
    teak: plain(TONES.teak, 0.5),
    orangeGloss: plain(TONES.orange, 0.25),
    chrome: plain("#d5d8dc", 0.15, 1),
    blackMetal: plain(TONES.ink, 0.4, 0.4),
    vinyl: plain("#111112", 0.3),
    mat: plain("#f6f1e6", 0.9),
  };

  const setNight = (night: boolean) => {
    papers.forEach((p) => (p.emissiveIntensity = night ? 1.1 : 0.15));
  };

  return { ...materials, setNight };
}
