import * as THREE from "three";
import { canvasTexture, seededRandom } from "./canvas";

// Earthy, grown-up accents over a white and light-wood base
export const TONES = {
  rust: "#a4532f",
  ochre: "#c1913a",
  olive: "#6c7044",
  ink: "#2f3b50",
  rose: "#c4928a",
  oxblood: "#74302a",
  cream: "#ede5d4",
};

function stripes(
  ground: string,
  color: string,
  band: number,
  gap: number,
  repeat: number,
) {
  const size = 256;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = color;
      for (let x = 0; x < size; x += band + gap) ctx.fillRect(x, 0, band, size);
    },
    true,
  );
  tex.repeat.setScalar(repeat);
  return tex;
}

// Two-tone check: bands crossing at half strength, darker where they meet.
function gingham(color: string, repeat: number) {
  const size = 256,
    cell = size / 8;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = "#f4f0e8";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 8; i += 2) {
        ctx.fillRect(i * cell, 0, cell, size);
        ctx.fillRect(0, i * cell, size, cell);
      }
    },
    true,
  );
  tex.repeat.setScalar(repeat);
  tex.anisotropy = 8;
  return tex;
}

// Flatweave rug: cream field, ink and rust bands, a row of small diamonds.
// One copy spans a whole rug of `width` × `depth` meters (box UVs are in meters).
function flatweave(width: number, depth: number) {
  const random = seededRandom(13);
  const w = 600,
    h = 640;
  const tex = canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = TONES.cream;
    ctx.fillRect(0, 0, w, h);
    const band = (y: number, height: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, y, w, height);
      ctx.fillRect(0, h - y - height, w, height);
    };
    band(40, 34, TONES.ink);
    band(90, 10, TONES.rust);
    band(116, 6, TONES.ink);
    ctx.fillStyle = TONES.rust;
    for (let x = 30; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, h / 2 - 22);
      ctx.lineTo(x + 16, h / 2);
      ctx.lineTo(x, h / 2 + 22);
      ctx.lineTo(x - 16, h / 2);
      ctx.fill();
    }
    for (let i = 0; i < 30000; i++) {
      ctx.fillStyle = `rgba(80,64,44,${random() * 0.1})`;
      ctx.fillRect(random() * w, random() * h, 3, 1);
    }
  });
  tex.repeat.set(1 / width, 1 / depth);
  tex.anisotropy = 8;
  return tex;
}

// Faded vintage rug: ivory field, washed-out blue border and medallion, rust details. Sized for the
// 2.62 × 1.58 m rug under the sofa.
function vintageRug() {
  const random = seededRandom(29);
  const w = 1024,
    h = 640;
  const tex = canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = "#d6cab4";
    ctx.fillRect(0, 0, w, h);
    const frame = (inset: number, width: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    };
    frame(34, 52, "#5f7088");
    frame(70, 8, "#a4674c");
    frame(92, 14, "#8193a8");
    const diamond = (cx: number, cy: number, rx: number, ry: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - ry);
      ctx.lineTo(cx + rx, cy);
      ctx.lineTo(cx, cy + ry);
      ctx.lineTo(cx - rx, cy);
      ctx.fill();
    };
    ctx.fillStyle = "#6c7f98";
    diamond(w / 2, h / 2, 220, 150);
    ctx.fillStyle = "#cdbfa8";
    diamond(w / 2, h / 2, 160, 108);
    ctx.fillStyle = "#a4674c";
    diamond(w / 2, h / 2, 76, 52);
    ctx.fillStyle = "#6c7f98";
    [
      [190, 175],
      [w - 190, 175],
      [190, h - 175],
      [w - 190, h - 175],
    ].forEach(([x, y]) => diamond(x, y, 40, 30));
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = `rgba(230,214,190,${random() * 0.16})`;
      ctx.beginPath();
      ctx.ellipse(
        random() * w,
        random() * h,
        10 + random() * 40,
        6 + random() * 18,
        random() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    for (let i = 0; i < 26000; i++) {
      ctx.fillStyle = `rgba(40,30,24,${random() * 0.14})`;
      ctx.fillRect(random() * w, random() * h, 2, 1 + random() * 3);
    }
  });
  tex.repeat.set(1 / 2.62, 1 / 1.58);
  tex.anisotropy = 8;
  return tex;
}

// Handmade glazed tiles in olive, each one a little different. One copy is 40 cm.
function oliveTiles() {
  const random = seededRandom(47);
  const size = 512,
    cell = size / 4;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = "#cbc3b1";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const shade = 0.82 + random() * 0.3;
          ctx.fillStyle = `rgb(${110 * shade},${122 * shade},${82 * shade})`;
          ctx.fillRect(i * cell + 3, j * cell + 3, cell - 6, cell - 6);
          const glaze = ctx.createRadialGradient(
            i * cell + cell * random(),
            j * cell + cell * random(),
            4,
            i * cell + cell / 2,
            j * cell + cell / 2,
            cell * 0.7,
          );
          glaze.addColorStop(0, "rgba(255,255,240,.18)");
          glaze.addColorStop(1, "rgba(255,255,240,0)");
          ctx.fillStyle = glaze;
          ctx.fillRect(i * cell + 3, j * cell + 3, cell - 6, cell - 6);
        }
      }
    },
    true,
  );
  tex.repeat.setScalar(1 / 0.4);
  tex.anisotropy = 8;
  return tex;
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function softRect(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.filter = "blur(3px)";
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Quiet abstract art for the gallery walls
const PRINTS: Record<string, Draw> = {
  field: (ctx, w, h) => {
    ctx.fillStyle = "#e7dccb";
    ctx.fillRect(0, 0, w, h);
    softRect(ctx, TONES.rust, w * 0.12, h * 0.1, w * 0.76, h * 0.42);
    softRect(ctx, TONES.ochre, w * 0.12, h * 0.58, w * 0.76, h * 0.3);
  },
  hills: (ctx, w, h) => {
    ctx.fillStyle = "#efe6d6";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d9b48f";
    ctx.beginPath();
    ctx.arc(w * 0.66, h * 0.38, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    [
      [0.55, TONES.rose],
      [0.68, TONES.olive],
      [0.8, TONES.ink],
    ].forEach(([base, color], i) => {
      ctx.fillStyle = color as string;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6)
        ctx.lineTo(
          x,
          h * (base as number) + Math.sin(x / (w * 0.22) + i * 2) * h * 0.05,
        );
      ctx.lineTo(w, h);
      ctx.fill();
    });
  },
  line: (ctx, w, h) => {
    ctx.fillStyle = "#f2ece0";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.85);
    ctx.bezierCurveTo(w * 0.1, h * 0.4, w * 0.5, h * 0.15, w * 0.55, h * 0.4);
    ctx.bezierCurveTo(w * 0.6, h * 0.65, w * 0.3, h * 0.6, w * 0.42, h * 0.45);
    ctx.bezierCurveTo(w * 0.55, h * 0.28, w * 0.9, h * 0.4, w * 0.78, h * 0.85);
    ctx.stroke();
  },
  leaves: (ctx, w, h) => {
    ctx.fillStyle = "#ece3d1";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = TONES.olive;
    ctx.fillStyle = TONES.olive;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.9);
    ctx.quadraticCurveTo(w * 0.45, h * 0.5, w / 2, h * 0.12);
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const y = h * (0.78 - i * 0.09);
      const side = i % 2 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(
        w / 2 + side * w * 0.14,
        y,
        w * 0.15,
        h * 0.03,
        side * -0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  },
  stroke: (ctx, w, h) => {
    ctx.fillStyle = "#efe8dc";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = TONES.ink;
    ctx.lineCap = "round";
    ctx.lineWidth = w * 0.11;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.62, w * 0.3, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  },
};

export type PrintKey = keyof typeof PRINTS;

export function eclecticMaterials() {
  const plain = (color: string, roughness = 0.9, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const textured = (map: THREE.Texture, roughness = 0.95) =>
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness, map });
  const prints = Object.fromEntries(
    Object.entries(PRINTS).map(([key, draw]) => [
      key,
      textured(
        canvasTexture(240, 320, (ctx) => draw(ctx, 240, 320)),
        0.8,
      ),
    ]),
  ) as Record<PrintKey, THREE.MeshStandardMaterial>;

  return {
    prints,
    ticking: textured(stripes(TONES.cream, TONES.ink, 3, 13, 3)),
    flatweave: textured(flatweave(1.5, 1.6), 1),
    runner: textured(flatweave(0.6, 1.2), 1),
    bathMat: textured(flatweave(0.56, 0.84), 1),
    vintageRug: textured(vintageRug(), 1),
    oliveTowel: plain("#7d815a", 1),
    gingham: textured(gingham("#6f8db3", 3)),
    blanketBlue: plain("#a9c0cc", 0.95),
    skateDeck: plain("#161618", 0.55),
    truck: plain("#a9adb2", 0.3, 0.8),
    wheel: plain("#ece4cf", 0.5),
    // Lamps, candles, blinds
    bankerGlass: plain("#1f5e42", 0.15),
    fanMetal: plain("#4a3b2e", 0.45, 0.5),
    slat: plain("#f3f1eb", 0.6),
    wax: plain("#f1eadb", 0.7),
    waxOchre: plain("#d9a65a", 0.7),
    oliveTiles: textured(oliveTiles(), 0.2),
    // Wall paint, a little chalky
    paintTerracotta: plain("#c4866b", 0.95),
    paintInk: plain("#3c4a60", 0.95),
    // Textiles
    rustVelvet: plain(TONES.rust, 0.8),
    ochre: plain(TONES.ochre, 0.9),
    ink: plain(TONES.ink, 0.9),
    rose: plain(TONES.rose, 0.95),
    cognac: plain("#8b5333", 0.55),
    // Glazes, enamel and metal
    rustGloss: plain(TONES.rust, 0.25),
    creamGloss: plain(TONES.cream, 0.25),
    oliveEnamel: plain(TONES.olive, 0.3),
    inkGlaze: plain(TONES.ink, 0.3),
    oliveGlaze: plain("#7c8158", 0.35),
    brass: plain("#b8954e", 0.3, 0.8),
    mat: plain("#f4efe5", 0.9),
    blackFrame: plain("#1f1f22", 0.5),
    lemon: plain("#e2c04a", 0.5),
    orange: plain("#dd8a36", 0.5),
  };
}
