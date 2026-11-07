import * as THREE from "three";
import { canvasTexture, seededRandom } from "./canvas";

// Warm Brazilian modern: terracotta, olive, mustard and cream, natural fibers and wood
export const TONES = {
  terracotta: "#a2563c",
  clay: "#cf8a69",
  olive: "#5f6b45",
  sage: "#8f9c7d",
  mustard: "#c99a3c",
  cream: "#efe6d4",
  cognac: "#8b5a36",
  jute: "#b89a6b",
  ink: "#1f1e1d",
};

// Woven throw: cream ground with a terracotta key pattern. One copy is 40 cm.
function wovenThrow() {
  const size = 256,
    cell = size / 8;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = TONES.cream;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = TONES.terracotta;
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
          if ((i + j) % 2) continue;
          ctx.fillRect(i * cell + 4, j * cell + 4, cell - 8, cell / 3);
          ctx.fillRect(i * cell + 4, j * cell + 4, cell / 3, cell - 8);
        }
    },
    true,
  );
  tex.repeat.setScalar(1 / 0.4);
  tex.anisotropy = 8;
  return tex;
}

// Braided jute seen from above: rings around the middle, for a round rug.
function juteRings() {
  const random = seededRandom(9);
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = "#b39466";
    ctx.fillRect(0, 0, 512, 512);
    for (let r = 4; r < 256; r += 7) {
      ctx.strokeStyle = r % 14 ? "#c6aa7c" : "#9c7f55";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 20000; i++) {
      ctx.fillStyle = `rgba(70,50,30,${random() * 0.12})`;
      ctx.fillRect(random() * 512, random() * 512, 2, 2);
    }
  });
}

// Black and cream stripes across a rug that is `width` × `depth` m.
function stripeRug(width: number, depth: number) {
  const tex = canvasTexture(64, 512, (ctx) => {
    ctx.fillStyle = "#ece6da";
    ctx.fillRect(0, 0, 64, 512);
    ctx.fillStyle = TONES.ink;
    for (let y = 24; y < 512 - 24; y += 44) ctx.fillRect(0, y, 64, 16);
  });
  tex.repeat.set(1 / width, 1 / depth);
  return tex;
}

// White subway tiles, 7.5 × 15 cm, in running bond. One copy is 30 cm.
function subwayTiles() {
  const random = seededRandom(3);
  const size = 512,
    w = size / 2,
    h = size / 4;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = "#c9c6bf";
      ctx.fillRect(0, 0, size, size);
      for (let row = 0; row < 4; row++)
        for (let col = -1; col < 3; col++) {
          const light = 243 + random() * 10;
          ctx.fillStyle = `rgb(${light},${light},${light - 3})`;
          const x = col * w + (row % 2 ? w / 2 : 0);
          ctx.fillRect(x + 3, row * h + 3, w - 6, h - 6);
        }
    },
    true,
  );
  tex.repeat.setScalar(1 / 0.3);
  tex.anisotropy = 8;
  return tex;
}

// Cane webbing (palhinha): an open octagonal weave over a dark gap.
function caneWeave(ground: string, repeat: number) {
  const size = 128;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "#d8b884";
      ctx.lineWidth = 5;
      for (let i = -size; i < size * 2; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.moveTo(i, size);
        ctx.lineTo(i + size, 0);
        ctx.stroke();
      }
      ctx.lineWidth = 4;
      for (let i = 0; i < size; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }
    },
    true,
  );
  tex.repeat.setScalar(repeat);
  return tex;
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

// Cut-paper prints in the palette, no text
const PRINTS = {
  leaf: (ctx, w, h) => {
    ctx.fillStyle = "#f1e8d8";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = TONES.terracotta;
    for (let i = 0; i < 7; i++) {
      const y = h * (0.2 + i * 0.1);
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.ellipse(
          w / 2 + side * w * 0.16,
          y,
          w * 0.18,
          h * 0.035,
          side * -0.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });
    }
    ctx.fillRect(w / 2 - 3, h * 0.15, 6, h * 0.72);
  },
  arch: (ctx, w, h) => {
    ctx.fillStyle = "#efe4cf";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = TONES.mustard;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.85);
    ctx.lineTo(w * 0.2, h * 0.45);
    ctx.arc(w / 2, h * 0.45, w * 0.3, Math.PI, 0);
    ctx.lineTo(w * 0.8, h * 0.85);
    ctx.fill();
    ctx.fillStyle = TONES.terracotta;
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.32, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
  },
  sun: (ctx, w, h) => {
    ctx.fillStyle = "#f2ead9";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = TONES.clay;
    ctx.beginPath();
    ctx.arc(w * 0.55, h * 0.4, w * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = TONES.olive;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.quadraticCurveTo(w * 0.3, h * 0.5, w, h * 0.72);
    ctx.lineTo(w, h);
    ctx.fill();
  },
  figure: (ctx, w, h) => {
    ctx.fillStyle = "#f3ebdc";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = TONES.terracotta;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.26, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h * 0.36);
    ctx.bezierCurveTo(w * 0.1, h * 0.5, w * 0.3, h * 0.7, w * 0.25, h * 0.85);
    ctx.lineTo(w * 0.72, h * 0.85);
    ctx.bezierCurveTo(w * 0.7, h * 0.6, w * 0.85, h * 0.5, w * 0.6, h * 0.36);
    ctx.fill();
    ctx.fillStyle = TONES.olive;
    ctx.beginPath();
    ctx.ellipse(w * 0.78, h * 0.7, w * 0.06, h * 0.12, 0.4, 0, Math.PI * 2);
    ctx.fill();
  },
} satisfies Record<string, Draw>;

export type PrintKey = keyof typeof PRINTS;

export function brazilMaterials() {
  const plain = (color: string, roughness = 0.9, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const textured = (map: THREE.Texture, roughness = 0.95) =>
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness, map });
  const linen = new THREE.MeshStandardMaterial({
    color: "#efe2c8",
    roughness: 0.95,
    side: THREE.DoubleSide,
    emissive: "#ffc27a",
    emissiveIntensity: 0.05,
  });
  const rattan = textured(caneWeave("#6d5032", 8), 0.9);
  rattan.side = THREE.DoubleSide;

  const materials = {
    prints: Object.fromEntries(
      Object.entries(PRINTS).map(([key, draw]) => [
        key,
        textured(
          canvasTexture(240, 320, (ctx) => draw(ctx, 240, 320)),
          0.8,
        ),
      ]),
    ) as Record<PrintKey, THREE.MeshStandardMaterial>,
    throw: textured(wovenThrow()),
    juteRug: textured(juteRings(), 1),
    stripeRug: textured(stripeRug(1.4, 1.7), 1),
    subway: textured(subwayTiles(), 0.15),
    cane: textured(caneWeave("#3a2a1c", 3), 0.8),
    rattan,
    linen,
    // Wall and ceiling paint, matte
    paintTerracotta: plain(TONES.terracotta, 0.95),
    paintOlive: plain(TONES.olive, 0.95),
    paintMustard: plain(TONES.mustard, 0.95),
    // Textiles and leather
    terracotta: plain(TONES.terracotta, 0.95),
    mustard: plain(TONES.mustard, 0.95),
    olive: plain(TONES.olive, 0.95),
    cream: plain(TONES.cream, 0.95),
    cognac: plain(TONES.cognac, 0.5),
    jute: plain(TONES.jute, 1),
    // Ceramics, metal and plants
    creamGlaze: plain("#ece3d2", 0.35),
    clayPot: plain("#b86a48", 0.85),
    oliveGlaze: plain("#6e7a52", 0.35),
    blackMetal: plain(TONES.ink, 0.45, 0.4),
    stem: plain("#4f6b3a", 0.8),
    cactus: plain("#5d7a4a", 0.7),
    orange: plain("#e07b2a", 0.5),
    mat: plain("#f7f2e8", 0.9),
  };

  const setNight = (night: boolean) => {
    linen.emissiveIntensity = night ? 0.9 : 0.05;
  };

  return { ...materials, setNight };
}
