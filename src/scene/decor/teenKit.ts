import * as THREE from "three";
import { canvasTexture, seededRandom } from "./canvas";

// Pop colors, a little deeper than primaries, over red brick and honey wood
export const TONES = {
  tangerine: "#ef7d2d",
  sunshine: "#f2c230",
  lime: "#93c13e",
  teal: "#1f8f8a",
  pink: "#e8578f",
  plum: "#5b3a6e",
  sky: "#5aa9d6",
  cream: "#f6eedc",
};

// Wavy retro bands across the rug, from one long side to the other.
function wavyRug(width: number, depth: number) {
  const random = seededRandom(41);
  const w = 1024,
    h = Math.round((1024 * depth) / width);
  const bands = [
    TONES.cream,
    TONES.plum,
    TONES.pink,
    TONES.tangerine,
    TONES.sunshine,
    TONES.cream,
    TONES.teal,
    TONES.lime,
    TONES.cream,
  ];
  const tex = canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = TONES.cream;
    ctx.fillRect(0, 0, w, h);
    const step = h / bands.length;
    bands.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8)
        ctx.lineTo(x, i * step + Math.sin((x / w) * Math.PI * 3) * step * 0.55);
      ctx.lineTo(w, h);
      ctx.fill();
    });
    for (let i = 0; i < 40000; i++) {
      ctx.fillStyle = `rgba(60,40,30,${random() * 0.12})`;
      ctx.fillRect(random() * w, random() * h, 1 + random() * 2, 2);
    }
  });
  tex.repeat.set(1 / width, 1 / depth);
  tex.anisotropy = 8;
  return tex;
}

// Black and white diner check. One copy is `cells` × 25 cm.
function checker(cells: number) {
  const size = 512,
    cell = size / cells;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      for (let i = 0; i < cells; i++)
        for (let j = 0; j < cells; j++) {
          ctx.fillStyle = (i + j) % 2 ? "#202024" : "#f1ede4";
          ctx.fillRect(i * cell, j * cell, cell, cell);
        }
    },
    true,
  );
  tex.repeat.setScalar(1 / (cells * 0.25));
  tex.anisotropy = 8;
  return tex;
}

// Glossy square tiles in sunny yellow, 10 cm each, with white grout.
function retroTiles() {
  const random = seededRandom(5);
  const size = 512,
    cell = size / 4;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = "#f4efe2";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++) {
          const light = 0.94 + random() * 0.08;
          ctx.fillStyle = `rgb(${242 * light},${196 * light},${64 * light})`;
          ctx.fillRect(i * cell + 3, j * cell + 3, cell - 6, cell - 6);
        }
    },
    true,
  );
  tex.repeat.setScalar(1 / 0.4);
  tex.anisotropy = 8;
  return tex;
}

// Cable-knit look: soft vertical ribs.
function knit(color: string) {
  const size = 256;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "rgba(0,0,0,.14)";
      for (let x = 0; x < size; x += 16) ctx.fillRect(x, 0, 4, size);
      ctx.fillStyle = "rgba(255,255,255,.1)";
      for (let x = 8; x < size; x += 16) ctx.fillRect(x, 0, 3, size);
    },
    true,
  );
  tex.repeat.setScalar(10);
  return tex;
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

// Graphic posters, all shapes and no text
const POSTERS = {
  sun: (ctx, w, h) => {
    ctx.fillStyle = TONES.plum;
    ctx.fillRect(0, 0, w, h);
    [TONES.pink, TONES.tangerine, TONES.sunshine].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.7, w * (0.42 - i * 0.12), Math.PI, 0);
      ctx.fill();
    });
    ctx.fillStyle = TONES.teal;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    for (let y = h * 0.76; y < h; y += 14)
      ctx.fillRect(w * 0.15, y, w * 0.7, 3);
  },
  wave: (ctx, w, h) => {
    ctx.fillStyle = TONES.cream;
    ctx.fillRect(0, 0, w, h);
    [TONES.teal, TONES.sky, TONES.pink, TONES.tangerine].forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w * 0.07;
      ctx.beginPath();
      for (let x = -10; x <= w + 10; x += 6) {
        const y = h * (0.25 + i * 0.16) + Math.sin(x / (w * 0.12)) * h * 0.04;
        if (x < 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  },
  dots: (ctx, w, h) => {
    ctx.fillStyle = TONES.tangerine;
    ctx.fillRect(0, 0, w, h);
    const colors = [TONES.cream, TONES.plum, TONES.sunshine, TONES.teal];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = colors[(row + col) % colors.length];
        ctx.beginPath();
        ctx.arc(
          w * (0.17 + col * 0.22),
          h * (0.13 + row * 0.15),
          w * 0.07,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
  },
  bolt: (ctx, w, h) => {
    ctx.fillStyle = TONES.teal;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = TONES.sunshine;
    ctx.beginPath();
    ctx.moveTo(w * 0.58, h * 0.1);
    ctx.lineTo(w * 0.24, h * 0.56);
    ctx.lineTo(w * 0.48, h * 0.56);
    ctx.lineTo(w * 0.38, h * 0.9);
    ctx.lineTo(w * 0.78, h * 0.4);
    ctx.lineTo(w * 0.53, h * 0.4);
    ctx.closePath();
    ctx.fill();
  },
} satisfies Record<string, Draw>;

export type PosterKey = keyof typeof POSTERS;

// Record label in the middle of a vinyl disc, black groove ring around it.
function vinylTexture(label: string) {
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(255,255,255,.07)";
    ctx.lineWidth = 1;
    for (let r = 50; r < 126; r += 4) {
      ctx.beginPath();
      ctx.arc(128, 128, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = label;
    ctx.beginPath();
    ctx.arc(128, 128, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#121214";
    ctx.beginPath();
    ctx.arc(128, 128, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function glowTexture() {
  return canvasTexture(128, 128, (ctx) => {
    const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, "#ffffff");
    glow.addColorStop(0.35, "#5c5c5c");
    glow.addColorStop(1, "#000000");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 128, 128);
  });
}

export type NeonKey = "pink" | "sunshine" | "sky";
const NEON: Record<NeonKey, string> = {
  pink: "#ff4fa3",
  sunshine: "#ffd24a",
  sky: "#62d0ff",
};

const BULB_COLORS = [
  TONES.pink,
  TONES.sunshine,
  TONES.lime,
  TONES.sky,
  TONES.tangerine,
];

export function teenMaterials() {
  const plain = (color: string, roughness = 0.9, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const textured = (map: THREE.Texture, roughness = 0.95) =>
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness, map });
  // Thin shades, seen from inside too
  const shade = (color: string) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
  const glowMap = glowTexture();

  const tube = {} as Record<NeonKey, THREE.MeshBasicMaterial>;
  const glow = {} as Record<NeonKey, THREE.MeshBasicMaterial>;
  (Object.keys(NEON) as NeonKey[]).forEach((key) => {
    tube[key] = new THREE.MeshBasicMaterial({
      color: NEON[key],
      toneMapped: false,
    });
    glow[key] = new THREE.MeshBasicMaterial({
      color: NEON[key],
      map: glowMap,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
  });
  const bulbs = BULB_COLORS.map(
    (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false }),
  );

  const materials = {
    neon: tube,
    neonGlow: glow,
    bulbs,
    posters: Object.fromEntries(
      Object.entries(POSTERS).map(([key, draw]) => [
        key,
        textured(
          canvasTexture(240, 340, (ctx) => draw(ctx, 240, 340)),
          0.7,
        ),
      ]),
    ) as Record<PosterKey, THREE.MeshStandardMaterial>,
    vinyl: [
      TONES.tangerine,
      TONES.teal,
      TONES.pink,
      TONES.sunshine,
      TONES.lime,
      TONES.sky,
    ].map((label) => textured(vinylTexture(label), 0.35)),
    vinylEdge: plain("#121214", 0.35),
    wavyRug: textured(wavyRug(2.4, 1.5), 1),
    bathMat: textured(wavyRug(0.56, 0.84), 1),
    checker: textured(checker(4), 0.5),
    retroTiles: textured(retroTiles(), 0.15),
    knitSunshine: textured(knit(TONES.sunshine), 1),
    knitPink: textured(knit("#f2a6c4"), 1),
    // Textiles and vinyl
    tangerine: plain(TONES.tangerine, 0.85),
    sunshine: plain(TONES.sunshine, 0.85),
    lime: plain(TONES.lime, 0.85),
    teal: plain(TONES.teal, 0.85),
    pink: plain(TONES.pink, 0.85),
    plum: plain(TONES.plum, 0.9),
    sky: plain(TONES.sky, 0.85),
    cream: plain(TONES.cream, 0.95),
    vinylPink: plain(TONES.pink, 0.3),
    vinylTangerine: plain(TONES.tangerine, 0.3),
    vinylLime: plain(TONES.lime, 0.3),
    shag: plain("#c3dd8a", 1),
    // Glazes, enamel and metal
    sunshineEnamel: shade(TONES.sunshine),
    tangerineEnamel: shade(TONES.tangerine),
    cherryEnamel: plain("#d8433b", 0.25),
    tealGlaze: plain(TONES.teal, 0.3),
    pinkGlaze: plain(TONES.pink, 0.3),
    chrome: plain("#d7dadf", 0.12, 1),
    disco: new THREE.MeshStandardMaterial({
      color: "#e9edf2",
      roughness: 0.08,
      metalness: 1,
      flatShading: true,
    }),
    tape: plain("#efe6c8", 0.8),
    rubberDuck: plain("#ffd23f", 0.35),
    beak: plain(TONES.tangerine, 0.4),
    white: plain("#f6f4ef", 0.5),
  };

  const setNight = (night: boolean) => {
    const strength = night ? 1 : 0.45;
    (Object.keys(NEON) as NeonKey[]).forEach((key) => {
      tube[key].color.set(NEON[key]).multiplyScalar(night ? 1.6 : 1);
      glow[key].color.set(NEON[key]).multiplyScalar(strength * 0.7);
    });
    bulbs.forEach((bulb, i) =>
      bulb.color.set(BULB_COLORS[i]).multiplyScalar(night ? 1.8 : 0.9),
    );
  };

  return { ...materials, setNight };
}
