import * as THREE from "three";
import { canvasTexture, seededRandom } from "./canvas";

// Romantic and soft: dusty rose, cream and sage, with a little cherry red
export const TONES = {
  rose: "#b98482",
  mauve: "#8f6470",
  blush: "#e6bcbc",
  sage: "#9aa98a",
  cherry: "#a8323a",
  cream: "#f3ebdd",
  bark: "#4a3426",
};

export const PETALS = ["#f2a9ba", "#ea93a9", "#f7c6d1", "#df7f99", "#fbe0e6"];

// Pressed flower on cream paper: a curved stem, a few leaves, one bloom on top.
function pressedFlower(seed: number) {
  const random = seededRandom(seed);
  const w = 240,
    h = 320;
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = "#f1e9da";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(120,96,60,${random() * 0.06})`;
      ctx.fillRect(random() * w, random() * h, 2, 2);
    }
    const bend = (random() - 0.5) * 60;
    const top: [number, number] = [w / 2 + bend * 0.6, h * 0.3];
    ctx.strokeStyle = "#6f8a5a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.92);
    ctx.quadraticCurveTo(w / 2 + bend, h * 0.6, top[0], top[1]);
    ctx.stroke();
    ctx.fillStyle = "#7f9668";
    for (let i = 0; i < 5; i++) {
      const t = 0.45 + i * 0.09;
      const side = i % 2 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(
        w / 2 + bend * (1 - t) * 0.9 + side * 16,
        h * t + 20,
        18,
        6,
        side * -0.6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    const petals = [TONES.blush, TONES.rose, "#d8818f", TONES.cherry];
    const color = petals[seed % petals.length];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.fillStyle = i % 2 ? color : TONES.blush;
      ctx.beginPath();
      ctx.ellipse(
        top[0] + Math.cos(angle) * 18,
        top[1] + Math.sin(angle) * 18,
        16,
        10,
        angle,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = "#c9a24a";
    ctx.beginPath();
    ctx.arc(top[0], top[1], 7, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Instant photo: white border, wider at the bottom, and a soft little scene.
function snapshot(seed: number) {
  const random = seededRandom(seed);
  const w = 120,
    h = 146;
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = "#f8f6f1";
    ctx.fillRect(0, 0, w, h);
    const skies = [
      ["#f6c9b8", "#fbe7d6"],
      ["#b9d3e3", "#eef3f2"],
      ["#e8b9c8", "#f6e2e6"],
      ["#c7d6b8", "#f1efe2"],
    ];
    const [sky, haze] = skies[seed % skies.length];
    const fill = ctx.createLinearGradient(0, 8, 0, 112);
    fill.addColorStop(0, sky);
    fill.addColorStop(1, haze);
    ctx.fillStyle = fill;
    ctx.fillRect(8, 8, w - 16, 104);
    ctx.save();
    ctx.beginPath();
    ctx.rect(8, 8, w - 16, 104);
    ctx.clip();
    ctx.fillStyle = "rgba(255,244,220,.9)";
    ctx.beginPath();
    ctx.arc(30 + random() * 60, 40 + random() * 20, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = seed % 2 ? "#8e9c7e" : "#b98482";
    ctx.beginPath();
    ctx.moveTo(8, 112);
    for (let x = 8; x <= w - 8; x += 4)
      ctx.lineTo(x, 84 + Math.sin(x / 18 + seed) * 8);
    ctx.lineTo(w - 8, 112);
    ctx.fill();
    ctx.restore();
  });
}

// White cotton quilt with black vines stitched across it. One copy is 50 cm.
function embroidered() {
  const random = seededRandom(23);
  const size = 512;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = "#f4f1ea";
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "rgba(30,28,26,.85)";
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      for (let row = 0; row < 4; row++) {
        const y0 = row * 128 + 40;
        ctx.beginPath();
        for (let x = 0; x <= size; x += 8)
          ctx.lineTo(x, y0 + Math.sin((x / size) * Math.PI * 4 + row) * 22);
        ctx.stroke();
        for (let i = 0; i < 10; i++) {
          const x = random() * size;
          const y = y0 + Math.sin((x / size) * Math.PI * 4 + row) * 22;
          ctx.beginPath();
          ctx.ellipse(x + 8, y - 8, 9, 4, -0.7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    },
    true,
  );
  tex.repeat.setScalar(1 / 0.5);
  tex.anisotropy = 8;
  return tex;
}

// Cream rug with a dusty rose border and a sage vine running inside it,
// one copy over the whole rug.
function borderRug(width: number, depth: number) {
  const random = seededRandom(17);
  const w = 1024,
    h = Math.round((1024 * depth) / width);
  const tex = canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = "#eadfcd";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = TONES.rose;
    ctx.lineWidth = 40;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.strokeStyle = TONES.sage;
    ctx.lineWidth = 6;
    ctx.strokeRect(80, 80, w - 160, h - 160);
    ctx.fillStyle = TONES.blush;
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      ctx.arc(
        120 + random() * (w - 240),
        120 + random() * (h - 240),
        6 + random() * 8,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    for (let i = 0; i < 40000; i++) {
      ctx.fillStyle = `rgba(90,70,60,${random() * 0.08})`;
      ctx.fillRect(random() * w, random() * h, 2, 1 + random() * 2);
    }
  });
  tex.repeat.set(1 / width, 1 / depth);
  tex.anisotropy = 8;
  return tex;
}

// Glazed fish-scale tiles in blush. One copy is 24 cm.
function scaleTiles() {
  const size = 512,
    cols = 4,
    r = size / cols / 2;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = "#f3ece4";
      ctx.fillRect(0, 0, size, size);
      for (let row = -1; row < 9; row++)
        for (let col = -1; col <= cols; col++) {
          const x = col * r * 2 + (row % 2 ? r : 0) + r;
          const y = row * r;
          ctx.fillStyle = (row + col) % 3 ? "#e3b8b6" : "#d9a6a6";
          ctx.beginPath();
          ctx.arc(x, y, r - 3, 0, Math.PI);
          ctx.fill();
        }
    },
    true,
  );
  tex.repeat.setScalar(1 / 0.24);
  tex.anisotropy = 8;
  return tex;
}

export function blossomMaterials() {
  const plain = (color: string, roughness = 0.9, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const textured = (map: THREE.Texture, roughness = 0.95) =>
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness, map });
  const milkGlass = new THREE.MeshStandardMaterial({
    color: "#f7efe6",
    roughness: 0.25,
    emissive: "#ffcf9e",
    emissiveIntensity: 0.1,
  });

  const materials = {
    pressed: [2, 5, 7].map((seed) => textured(pressedFlower(seed), 0.8)),
    photos: [1, 2, 3, 4, 5, 6, 7].map((seed) => textured(snapshot(seed), 0.6)),
    // Blossoms take their color from each instance
    petal: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 }),
    quilt: textured(embroidered(), 1),
    rug: textured(borderRug(2.5, 1.6), 1),
    bathMat: plain("#eadfcd", 1),
    scaleTiles: textured(scaleTiles(), 0.2),
    stem: plain("#4c6b3c", 0.8),
    milkGlass,
    // Textiles
    rose: plain(TONES.rose, 0.95),
    mauve: plain(TONES.mauve, 0.95),
    blush: plain(TONES.blush, 0.95),
    sage: plain(TONES.sage, 0.95),
    cherry: plain(TONES.cherry, 0.85),
    cream: plain(TONES.cream, 0.95),
    plush: plain("#9b6a45", 1),
    // Glazes and metal
    creamGlaze: plain("#efe6d6", 0.3),
    sageGlaze: plain("#8e9c7e", 0.3),
    roseGlaze: plain("#c99694", 0.3),
    brass: plain("#b8954e", 0.3, 0.8),
    frame: plain("#c9a57c", 0.6),
    mat: plain("#f7f2e8", 0.9),
    rattan: plain("#b98e5c", 0.85),
    clip: plain("#d8c3a0", 0.6),
  };

  const setNight = (night: boolean) => {
    milkGlass.emissiveIntensity = night ? 1.4 : 0.1;
  };

  return { ...materials, setNight };
}
