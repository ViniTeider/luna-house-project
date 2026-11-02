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
  floorTex?: 'planks' | 'tile';
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

export function createMaterials() {
  const plain = (color: string, roughness = 0.6, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

  const planks = plankTexture();
  const tile = tileTexture();
  const fine = grainTexture();
  const fabric = fabricTexture();

  const M = {
    textures: { planks, tile },
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
