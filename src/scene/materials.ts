import * as THREE from 'three';

interface GraniteSpec {
  base: string;
  flecks: [color: string, count: number, size: number][];
}

export interface PaletteValues {
  main?: string;
  wood?: string;
  top?: string;
  wall?: string;
  sofa?: string;
  floor?: string;
  floorTex?: 'planks' | 'tile' | 'chevron';
  granite?: GraniteSpec;
}

export type PaletteKey = 'cabinetry' | 'walls' | 'sofa' | 'granite' | 'floor';
export type PaletteSelection = Record<PaletteKey, string>;

interface PaletteGroup {
  label: string;
  default: string;
  options: Record<string, PaletteValues>;
}

export const PALETTES: Record<PaletteKey, PaletteGroup> = {
  cabinetry: {
    label: 'Cabinetry',
    default: 'Black + wood',
    options: {
      'Black + wood': { main: '#17181a', wood: '#b48a5e', top: '#23252a' },
      'White + wood': { main: '#ece8e1', wood: '#d6b890', top: '#e6e3dc' },
      'Graphite + wood': { main: '#43474c', wood: '#9a7350', top: '#5a5e63' },
      'Green + wood': { main: '#24382f', wood: '#c6a077', top: '#e6e1d6' },
      'Walnut + oak': { main: '#5e412c', wood: '#c09468', top: '#e4d8c4' },
      'Blush + oak': { main: '#e4cdc4', wood: '#cfa97f', top: '#ebe2d8' },
      'Sage + freijó': { main: '#8d9b80', wood: '#b98a5c', top: '#e6e1d6' },
      'Teal + wood': { main: '#2b8a86', wood: '#d2a56f', top: '#e6e3dc' },
    },
  },
  walls: {
    label: 'Walls',
    default: 'Cream',
    options: {
      Cream: { wall: '#efe5d0' },
      Sand: { wall: '#e0d1b7' },
      'Off-white': { wall: '#f6f3ec' },
      'Warm gray': { wall: '#cfc9bf' },
      'Sage green': { wall: '#b9c4ae' },
      Butter: { wall: '#f3e3b3' },
    },
  },
  sofa: {
    label: 'Sofa',
    default: 'Blue',
    options: {
      Blue: { sofa: '#27466e' },
      Gray: { sofa: '#7b7e83' },
      Beige: { sofa: '#cdbba0' },
      Black: { sofa: '#232326' },
      Green: { sofa: '#2f5444' },
      Sage: { sofa: '#a3ac95' },
      Plum: { sofa: '#5b3a6e' },
      'Dusty rose': { sofa: '#b98482' },
    },
  },
  granite: {
    label: 'Granite (island and countertop)',
    default: 'São Gabriel Black',
    options: {
      'São Gabriel Black': {
        granite: { base: '#15161a', flecks: [['#3a3d45', 9000, 2.2], ['#8a8f99', 2500, 1.4], ['#d8d6cf', 350, 1.5]] },
      },
      'Corumbá Gray': {
        granite: { base: '#77787b', flecks: [['#3f4043', 14000, 2.8], ['#b9b9b6', 12000, 2.4], ['#1f2022', 3000, 2]] },
      },
      'Dallas White': {
        granite: { base: '#dcd8cf', flecks: [['#8e8a82', 9000, 2.4], ['#2f2e2c', 4000, 2.2], ['#b9a98e', 3000, 2.4]] },
      },
      'Ubatuba Green': {
        granite: { base: '#1c2a25', flecks: [['#3f5a4b', 12000, 2.6], ['#0c1210', 6000, 2.2], ['#a8a27f', 1500, 1.5]] },
      },
    },
  },
  floor: {
    label: 'Floor',
    default: 'Light wood',
    options: {
      'Light wood': { floor: '#dcbd93', floorTex: 'planks' },
      'Honey wood': { floor: '#c49a68', floorTex: 'planks' },
      'Dark wood': { floor: '#7a5338', floorTex: 'planks' },
      'Gray porcelain': { floor: '#cfcdc8', floorTex: 'tile' },
      'Chevron oak': { floor: '#c39462', floorTex: 'chevron' },
    },
  },
};

function canvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  metersPerRepeat: number,
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.setScalar(1 / metersPerRepeat);
  return tex;
}

// Deterministic generator: textures look the same on every load.
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function grain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rand: () => number,
  strength = 0.05,
) {
  for (let i = 0; i < h / 1.6; i++) {
    const gy = y + rand() * h;
    ctx.strokeStyle = `rgba(60,40,20,${rand() * strength})`;
    ctx.lineWidth = 0.5 + rand();
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.bezierCurveTo(x + w * 0.3, gy + rand() * 5 - 2.5, x + w * 0.7, gy + rand() * 5 - 2.5, x + w, gy);
    ctx.stroke();
  }
}

// Textures are light and the tone comes from material.color, so palettes can be swapped.
function plankTexture() {
  const rand = rng(11);
  return canvasTexture(2048, (ctx, s) => {
    const rows = 12;
    const ph = s / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * s * 0.5;
      while (x < s) {
        const w = s * (0.45 + rand() * 0.2);
        const tone = 240 + rand() * 15;
        ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
        ctx.fillRect(x, r * ph, w, ph);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, r * ph, w, ph);
        ctx.clip();
        grain(ctx, x, r * ph, w, ph, rand, 0.05);
        ctx.restore();
        ctx.fillStyle = 'rgba(50,35,20,.3)';
        ctx.fillRect(x, r * ph, 2, ph);
        x += w;
      }
      ctx.fillStyle = 'rgba(50,35,20,.3)';
      ctx.fillRect(0, r * ph, s, 2);
    }
  }, 2.16);
}

// Short planks meeting at an angle in alternating columns
function chevronTexture() {
  const rand = rng(17);
  return canvasTexture(1024, (ctx, s) => {
    const cols = 8;
    const cw = s / cols;
    const ph = s / 16;
    for (let c = 0; c < cols; c++) {
      const dir = c % 2 ? 1 : -1;
      const x0 = c * cw;
      for (let k = -18; k < 34; k++) {
        const y0 = k * ph - (dir > 0 ? 0 : -cw);
        const tone = 236 + rand() * 19;
        ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + cw, y0 + dir * cw);
        ctx.lineTo(x0 + cw, y0 + dir * cw + ph);
        ctx.lineTo(x0, y0 + ph);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(50,35,20,.32)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, 1.2);
}

function grainTexture() {
  const rand = rng(23);
  return canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, s, s);
    grain(ctx, 0, 0, s, s, rand, 0.14);
  }, 1.2);
}

function tileTexture(tiles = 2) {
  const rand = rng(37);
  return canvasTexture(1024, (ctx, s) => {
    const t = s / tiles;
    for (let i = 0; i < tiles; i++) {
      for (let j = 0; j < tiles; j++) {
        const tone = 236 + rand() * 12;
        ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
        ctx.fillRect(i * t, j * t, t, t);
      }
    }
    ctx.strokeStyle = 'rgba(90,90,90,.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= tiles; i++) {
      ctx.beginPath(); ctx.moveTo(i * t, 0); ctx.lineTo(i * t, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * t); ctx.lineTo(s, i * t); ctx.stroke();
    }
  }, 1.2);
}

function graniteTexture({ base, flecks }: GraniteSpec) {
  const rand = rng(71);
  return canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (const [color, count, size] of flecks) {
      ctx.fillStyle = color;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.ellipse(rand() * s, rand() * s, 0.4 + rand() * size, 0.4 + rand() * size, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 0.8);
}

function fabricTexture() {
  const rand = rng(53);
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 30000; i++) {
      const v = 190 + rand() * 65;
      ctx.fillStyle = `rgba(${v},${v},${v},.55)`;
      ctx.fillRect(rand() * s, rand() * s, 2, 2);
    }
  }, 0.3);
}

function brickTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#d9d2c9';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const h = s / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = -1; c < 5; c++) {
        ctx.fillStyle = (r * 3 + c * 5) % 3 ? '#9d4c35' : '#8a4230';
        ctx.fillRect(c * (s / 4) + (r % 2 ? s / 8 : 0) + 3, r * h + 3, s / 4 - 6, h - 6);
      }
    }
  }, 0.6);
}

export const SURF_RUG = { width: 0.62, length: 1.65 };

// Lengthwise deck of a surfboard: white, blue rails and stripes, thin center stringer.
function surfRugTexture() {
  const tex = canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = '#f4f3ee';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#1b4f9c';
    ctx.fillRect(0, 0, s * 0.13, s);
    ctx.fillRect(s * 0.87, 0, s * 0.13, s);
    ctx.fillRect(s * 0.3, 0, s * 0.1, s);
    ctx.fillRect(s * 0.6, 0, s * 0.1, s);
    ctx.fillStyle = '#6fa8dc';
    ctx.fillRect(s * 0.17, 0, s * 0.05, s);
    ctx.fillRect(s * 0.78, 0, s * 0.05, s);
    ctx.fillStyle = '#16345f';
    ctx.fillRect(s * 0.495, 0, s * 0.01, s);
    for (let i = 0; i < 26000; i++) {
      ctx.fillStyle = `rgba(30,40,70,${Math.random() * 0.07})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 2);
    }
  }, 1);
  tex.repeat.set(1 / SURF_RUG.width, 1 / SURF_RUG.length);
  tex.offset.set(0.5, 0.5);
  return tex;
}

function lavaGlassTexture() {
  const tex = canvasTexture(512, (ctx, s) => {
    const liquid = ctx.createLinearGradient(0, s, 0, 0);
    liquid.addColorStop(0, '#ff5fb3');
    liquid.addColorStop(0.4, '#f02c95');
    liquid.addColorStop(1, '#a3126a');
    ctx.fillStyle = liquid;
    ctx.fillRect(0, 0, s, s);
    const blobs = [
      [0.15, 0.82, 0.13, 0.15],
      [0.5, 0.9, 0.2, 0.1],
      [0.82, 0.76, 0.12, 0.16],
      [0.34, 0.5, 0.09, 0.16],
      [0.68, 0.42, 0.08, 0.11],
      [0.1, 0.24, 0.06, 0.09],
      [0.5, 0.14, 0.09, 0.1],
    ];
    blobs.forEach(([x, y, rx, ry]) => {
      ctx.fillStyle = '#ffc1e2';
      ctx.beginPath();
      ctx.ellipse(x * s, y * s, rx * s, ry * s, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }, 1);
  return tex;
}

function pinkGlowTexture() {
  return canvasTexture(128, (ctx, s) => {
    const glow = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    glow.addColorStop(0, '#ff4fb0');
    glow.addColorStop(0.5, '#6b1a4d');
    glow.addColorStop(1, '#000000');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, s, s);
  }, 1);
}

export function createMaterials() {
  const plain = (color: string, roughness = 0.6, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

  const planks = plankTexture();
  const tile = tileTexture();
  const chevron = chevronTexture();
  const fine = grainTexture();
  const fabric = fabricTexture();

  const M = {
    textures: { planks, tile, chevron },
    wall: plain('#efe5d0', 0.9),
    cap: plain('#2c2d30', 0.9),
    main: plain('#17181a', 0.45, 0.05),
    wood: plain('#b48a5e', 0.55, 0, { map: fine }),
    top: plain('#23252a', 0.3, 0.05),
    granite: plain('#ffffff', 0.42, 0, { envMapIntensity: 0.25 }),
    floor: plain('#dcbd93', 0.55, 0, { map: planks }),
    tile: plain('#d6d4cf', 0.35, 0, { map: tile }),
    sofa: plain('#27466e', 0.95, 0, { map: fabric }),
    fabricLight: plain('#ece7dd', 0.95, 0, { map: fabric }),
    duvet: plain('#c9c2b4', 0.95, 0, { map: fabric }),
    white: plain('#f2f1ed', 0.35),
    projector: plain('#1e3f68', 0.4),
    surfRug: plain('#ffffff', 1, 0, { map: surfRugTexture() }),
    surfRugEdge: plain('#1b4f9c', 1),
    lavaGlass: new THREE.MeshBasicMaterial({ map: lavaGlassTexture(), toneMapped: false }),
    lavaGlow: new THREE.MeshBasicMaterial({
      map: pinkGlowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    vanity: plain('#d2c5ae', 0.4),
    vanityFront: plain('#e0d5c1', 0.32),
    black: plain('#101113', 0.4),
    blackSoft: plain('#1a1b1e', 0.85),
    green: plain('#2fae5a', 0.7),
    inox: plain('#b9bcc0', 0.3, 0.85),
    inoxDark: plain('#6a6d71', 0.32, 0.8),
    ceramic: plain('#fbfbf8', 0.15),
    glass: plain('#bcdce4', 0.05, 0.1, { transparent: true, opacity: 0.22, depthWrite: false }),
    mirror: plain('#dfe9ee', 0.04, 1),
    screen: plain('#06070a', 0.12, 0.3),
    frame: plain('#222327', 0.5, 0.4),
    door: plain('#f1ece1', 0.6),
    brick: plain('#ffffff', 0.9, 0, { map: brickTexture() }),
    charcoal: plain('#1c1b1a', 0.95),
    ceiling: plain('#f7f4ee', 0.95),
    led: new THREE.MeshStandardMaterial({ color: '#fff3df', emissive: '#ffcf96', emissiveIntensity: 3 }),
  };

  const graniteCache = new Map<GraniteSpec, THREE.CanvasTexture>();

  const apply = (selection: PaletteSelection) => {
    const c = {} as Required<PaletteValues>;
    (Object.keys(selection) as PaletteKey[]).forEach((group) => {
      Object.assign(c, PALETTES[group].options[selection[group]]);
    });
    if (!graniteCache.has(c.granite)) graniteCache.set(c.granite, graniteTexture(c.granite));
    M.granite.map = graniteCache.get(c.granite) ?? null;
    M.granite.needsUpdate = true;
    M.main.color.set(c.main);
    M.wood.color.set(c.wood);
    M.top.color.set(c.top);
    M.wall.color.set(c.wall);
    M.sofa.color.set(c.sofa);
    M.floor.color.set(c.floor);
    M.floor.map = M.textures[c.floorTex];
    M.floor.roughness = c.floorTex === 'tile' ? 0.3 : 0.55;
    M.floor.needsUpdate = true;
  };

  return { ...M, apply };
}

export type Materials = ReturnType<typeof createMaterials>;
