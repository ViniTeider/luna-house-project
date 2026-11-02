import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Procedural city seen from the windows in walk mode. All distances in meters.
// Every opening faces east (+x), so buildings only exist on that side.

const FLOOR_ELEVATION = 25; // apartment floor above the street;
const SKY_RADIUS = 2400;
const CITY_RADIUS = 1500;
const GROUND_HALF = 1700;
const FOG_DENSITY = 0.0012;
const SHADOW_AREA = 320; // ground covered by painted shadows, from the street eastward
const SHADOW_OPACITY = 0.34;

// Where the city can be seen from: spots along the east facade, at eye height.
const EYE_X = 4.85;
const EYE_ZS = [-3, -1.5, 0, 1, 2.8];
const EYE_HEIGHT = 1.6;
const MAX_AZIMUTH = THREE.MathUtils.degToRad(80); // the facade hides anything wider
const AZIMUTH_STEP = THREE.MathUtils.degToRad(0.25);
const ALWAYS_KEPT = 120; // nearby pieces shift too much as you walk to be culled

// The openings on the east facade. With none in view, nothing outside can be seen.
const OPENINGS = [
  [4.73, 0.7, -3, 4.77, 2.2, -1.5], // bedroom window
  [4.92, 1.1, -0.6, 4.96, 2.2, 0.6], // living room window
  [4.84, 0, 0.97, 4.88, 3.2, 2.84], // balcony
].map(
  ([x0, y0, z0, x1, y1, z1]) =>
    new THREE.Box3(
      new THREE.Vector3(x0, y0, z0),
      new THREE.Vector3(x1, y1, z1),
    ),
);

// Street grid: the first road runs north-south right in front of the building.
const BLOCK = 80;
const STREET_X = 16;
const STREET_HALF = 6;
const SIDEWALK = 3;
const STREET_EDGE = STREET_HALF + SIDEWALK;

const WINDOW_TILE = 12; // meters covered by one repeat of the window texture
const WINDOW_CELLS = 4;
const PLAIN_UV: [number, number] = [0.01, 0.95]; // wall color, between windows

const HAZE = { day: "#dfe8ec", night: "#171b29" };
const BUILDING_COLORS = [
  "#e8e2d6",
  "#d9d3c7",
  "#c9c6c1",
  "#b9bcc0",
  "#d8c7ae",
  "#c4a78f",
  "#a9a49d",
  "#eeeae2",
];
const ROOF_BOX_COLOR = "#8e8c88";
const TREE_COLORS = ["#3f6b35", "#4e7a3c", "#35602f", "#5b8743"];
const CAR_COLORS = ["#e6e6e6", "#2b2d31", "#8f9499", "#7c1f24", "#27415f"];

type Rng = () => number;

// Fixed seed, so the city is the same on every visit.
function seededRng(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rng: Rng, list: T[]) => list[Math.floor(rng() * list.length)];

function canvas2d(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function texture(canvas: HTMLCanvasElement, repeat: boolean) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* Sky */

function cloudPuff() {
  const { canvas, ctx } = canvas2d(128, 128);
  const glow = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.45, "rgba(255,255,255,.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

function ridge(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  W: number,
  horizon: number,
  height: number,
  color: string,
) {
  const phases = [1, 2, 3, 5, 8, 13].map((freq) => ({
    freq,
    phase: rng() * Math.PI * 2,
  }));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 2);
  for (let x = 0; x <= W; x += 4) {
    const t = (x / W) * Math.PI * 2;
    const wave = phases.reduce(
      (sum, { freq, phase }) =>
        sum + Math.sin(t * freq + phase) / Math.sqrt(freq),
      0,
    );
    ctx.lineTo(x, horizon - height * (0.55 + 0.22 * wave));
  }
  ctx.lineTo(W, horizon + 2);
  ctx.closePath();
  ctx.fill();
}

function paintSky(sun: THREE.Vector3, night: boolean) {
  const W = 4096,
    H = 2048,
    horizon = H / 2;
  const { canvas, ctx } = canvas2d(W, H);
  const rng = seededRng(7);

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  const stops = night
    ? ["#05070f", "#0a0e1b", HAZE.night]
    : ["#2f6fb8", "#7fb4e2", HAZE.day];
  stops.forEach((color, i) => sky.addColorStop([0, 0.62, 1][i], color));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Matches where SphereGeometry places u and v, so the glow sits behind the real light.
  const sunU = (Math.atan2(sun.z, -sun.x) / (Math.PI * 2) + 1) % 1;
  const sunV = Math.acos(sun.y) / Math.PI;

  if (night) {
    for (let i = 0; i < 2600; i++) {
      ctx.globalAlpha = 0.25 + rng() * 0.7;
      ctx.fillStyle = "#fff";
      const size = rng() < 0.06 ? 3 : 2;
      ctx.fillRect(rng() * W, rng() * horizon * 0.92, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f1efe6";
    ctx.beginPath();
    ctx.arc(sunU * W, sunV * H, 16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (const u of [sunU - 1, sunU, sunU + 1]) {
      const glow = ctx.createRadialGradient(
        u * W,
        sunV * H,
        8,
        u * W,
        sunV * H,
        620,
      );
      glow.addColorStop(0, "rgba(255,252,240,1)");
      glow.addColorStop(0.04, "rgba(255,248,226,.85)");
      glow.addColorStop(0.3, "rgba(255,244,222,.25)");
      glow.addColorStop(1, "rgba(255,244,222,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const puff = cloudPuff();
  const shade = night ? 0.1 : 1;
  for (let i = 0; i < 90; i++) {
    const cx = rng() * W;
    const cy = horizon * (0.38 + rng() * rng() * 0.58);
    const flatten = 0.2 + 0.5 * (1 - cy / horizon); // clouds flatten toward the horizon
    const spread = 90 + rng() * 240;
    const count = 14 + Math.floor(rng() * 26);
    for (let p = 0; p < count; p++) {
      const size = 50 + rng() * 150;
      const x = cx + (rng() - 0.5) * spread * 2;
      const y = cy + (rng() - 0.5) * spread * flatten * 0.8;
      ctx.globalAlpha = (0.1 + rng() * 0.22) * shade;
      ctx.drawImage(
        puff,
        x - size / 2,
        y - (size * flatten) / 2,
        size,
        size * flatten,
      );
      if (x + size > W)
        ctx.drawImage(
          puff,
          x - W - size / 2,
          y - (size * flatten) / 2,
          size,
          size * flatten,
        );
    }
  }
  ctx.globalAlpha = 1;

  ridge(ctx, rng, W, horizon, 26, night ? "#141827" : "#c3d0da");
  ridge(ctx, rng, W, horizon, 15, night ? "#10131f" : "#aebfca");

  ctx.fillStyle = night ? HAZE.night : HAZE.day;
  ctx.fillRect(0, horizon, W, H - horizon);
  const tex = texture(canvas, false);
  tex.generateMipmaps = false; // always magnified on screen, so they would go unused
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/* City */

function windowTextures() {
  const size = 512,
    cell = size / WINDOW_CELLS;
  const rng = seededRng(11);
  const wall = canvas2d(size, size);
  const lit = canvas2d(size, size);
  wall.ctx.fillStyle = "#ffffff";
  wall.ctx.fillRect(0, 0, size, size);
  lit.ctx.fillStyle = "#000000";
  lit.ctx.fillRect(0, 0, size, size);

  for (let col = 0; col < WINDOW_CELLS; col++) {
    for (let row = 0; row < WINDOW_CELLS; row++) {
      const x = col * cell + cell * 0.2,
        y = row * cell + cell * 0.26;
      const w = cell * 0.6,
        h = cell * 0.48;
      const glass = wall.ctx.createLinearGradient(0, y, 0, y + h);
      glass.addColorStop(0, "#8ea3b3"); // sky reflected at the top of the pane
      glass.addColorStop(
        1,
        pick(rng, ["#39454f", "#46535e", "#2f3a44", "#55626c"]),
      );
      wall.ctx.fillStyle = "#efece6";
      wall.ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      wall.ctx.fillStyle = glass;
      wall.ctx.fillRect(x, y, w, h);
      wall.ctx.fillStyle = "#d9d6d0";
      wall.ctx.fillRect(x + w / 2 - 1.5, y, 3, h);
      wall.ctx.fillStyle = "#b9b5ad"; // floor slab
      wall.ctx.fillRect(col * cell, row * cell, cell, 8);
      if (rng() < 0.42) {
        lit.ctx.fillStyle = pick(rng, [
          "#ffd9a0",
          "#ffe9c4",
          "#ffc77e",
          "#dfe9ff",
        ]);
        lit.ctx.fillRect(x, y, w, h);
      }
    }
  }
  return {
    map: texture(wall.canvas, true),
    emissiveMap: texture(lit.canvas, true),
  };
}

interface BoxSpec {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  base: number;
  color: string;
  windows: boolean;
}

function cityBox(rng: Rng, { x, z, w, d, h, base, color, windows }: BoxSpec) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const offsetU = Math.floor(rng() * WINDOW_CELLS) / WINDOW_CELLS;
  const offsetV = Math.floor(rng() * WINDOW_CELLS) / WINDOW_CELLS;

  // BoxGeometry order: 4 vertices each for +x, -x, +y, -y, +z, -z.
  for (let i = 0; i < uv.count; i++) {
    const face = Math.floor(i / 4);
    const roof = face === 2 || face === 3;
    if (!windows || roof) {
      uv.setXY(i, ...PLAIN_UV);
      continue;
    }
    // Snap to whole cells so no window gets cut at the corner of a building.
    const span = face < 2 ? d : w;
    const cellsU =
      Math.max(1, Math.round((span / WINDOW_TILE) * WINDOW_CELLS)) /
      WINDOW_CELLS;
    const cellsV =
      Math.max(1, Math.round((h / WINDOW_TILE) * WINDOW_CELLS)) / WINDOW_CELLS;
    uv.setXY(i, uv.getX(i) * cellsU + offsetU, uv.getY(i) * cellsV + offsetV);
  }

  dropHiddenFaces(geo, x, z, d);
  paintVertices(geo, color, (y) => (y < 0 && windows ? 0.72 : 1));
  geo.translate(x, base + h / 2, z);
  return geo;
}

// Seen from the west, so east faces and undersides never show, nor the far side of each box.
function dropHiddenFaces(
  geo: THREE.BufferGeometry,
  x: number,
  z: number,
  d: number,
) {
  if (x < EYE_X) return; // the building under the apartment
  const faces = [1, 2];
  if (z + d / 2 < EYE_ZS[EYE_ZS.length - 1]) faces.push(4);
  if (z - d / 2 > EYE_ZS[0]) faces.push(5);
  const index = Array.from(geo.index!.array);
  geo.setIndex(faces.flatMap((f) => index.slice(f * 6, (f + 1) * 6)));
}

// Shades vertices by height, so faces fade toward the ground like a contact shadow.
function paintVertices(
  geo: THREE.BufferGeometry,
  color: string,
  shade: (y: number) => number,
) {
  const { r, g, b } = new THREE.Color(color);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const k = shade(pos.getY(i));
    colors.set([r * k, g * k, b * k], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

function floorsAt(rng: Rng, dist: number) {
  if (dist < 130) return 2 + Math.floor(rng() * 4); // keeps the near view open
  if (rng() < 0.14) return 18 + Math.floor(rng() * 16);
  return 4 + Math.floor(rng() * 11);
}

interface Caster {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

// Front-to-back culling: each eye keeps the highest angle blocked so far per direction,
// and anything that stays below it in every direction, from every eye, is left out.
function createHorizon() {
  const buckets = Math.ceil((MAX_AZIMUTH * 2) / AZIMUTH_STEP);
  const eyes = EYE_ZS.map((z) => ({
    z,
    skyline: new Float32Array(buckets).fill(-Math.PI / 2),
  }));

  const span = ({ x, z, w, d }: Caster, eyeZ: number) => {
    const angles = [-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) =>
        Math.atan2(z + (sz * d) / 2 - eyeZ, x + (sx * w) / 2 - EYE_X),
      ),
    );
    const bucket = (angle: number) =>
      Math.floor((angle + MAX_AZIMUTH) / AZIMUTH_STEP);
    return [bucket(Math.min(...angles)), bucket(Math.max(...angles))];
  };

  const elevation = (
    { x, z, w, d, h }: Caster,
    eyeZ: number,
    high: boolean,
  ) => {
    const dx = Math.abs(x - EYE_X),
      dz = Math.abs(z - eyeZ);
    const near = Math.hypot(Math.max(dx - w / 2, 1), Math.max(dz - d / 2, 0));
    const far = Math.hypot(dx + w / 2, dz + d / 2);
    const rise = h - FLOOR_ELEVATION - EYE_HEIGHT;
    return Math.atan2(rise, rise > 0 === high ? near : far);
  };

  const sees = (box: Caster) => {
    if (Math.hypot(box.x, box.z) < ALWAYS_KEPT) return true;
    return eyes.some(({ z, skyline }) => {
      const [first, last] = span(box, z);
      const angle = elevation(box, z, true);
      for (let i = Math.max(first, 0); i <= Math.min(last, buckets - 1); i++) {
        if (angle >= skyline[i]) return true;
      }
      return false;
    });
  };

  const block = (box: Caster) => {
    for (const { z, skyline } of eyes) {
      const [first, last] = span(box, z);
      const angle = elevation(box, z, false);
      for (let i = Math.max(first + 1, 0); i < Math.min(last, buckets); i++) {
        skyline[i] = Math.max(skyline[i], angle);
      }
    }
  };

  return { sees, block };
}

type Horizon = ReturnType<typeof createHorizon>;

function buildCity(rng: Rng, horizon: Horizon) {
  const boxes: THREE.BufferGeometry[] = [];
  const casters: Caster[] = [];
  const street = -FLOOR_ELEVATION;
  const add = (spec: Omit<BoxSpec, "base"> & { base?: number }) =>
    boxes.push(cityBox(rng, { base: street, ...spec }));
  const addCar = (x: number, z: number, along: "x" | "z") => {
    const size = (width: number, length: number) =>
      along === "z" ? { w: width, d: length } : { w: length, d: width };
    const body = { x, z, h: 0.85, base: street + 0.2, windows: false };
    add({ ...body, ...size(1.8, 4.3), color: pick(rng, CAR_COLORS) });
    add({
      ...body,
      ...size(1.5, 2.2),
      h: 0.55,
      base: street + 1.05,
      color: "#23282e",
    });
  };

  const lot = BLOCK - STREET_EDGE * 2;
  const rows = Math.ceil(CITY_RADIUS / BLOCK);
  for (let gx = 0; gx <= rows; gx++) {
    for (let gz = -rows; gz <= rows; gz++) {
      const x0 = STREET_X + gx * BLOCK + STREET_EDGE;
      const z0 = gz * BLOCK + STREET_EDGE;
      const dist = Math.hypot(x0 + lot / 2, z0 + lot / 2);
      if (dist > CITY_RADIUS) continue;

      const plots = dist < 600 ? 3 : 2;
      const plot = lot / plots;
      for (let i = 0; i < plots; i++) {
        for (let j = 0; j < plots; j++) {
          if (rng() < 0.12) continue;
          const w = plot * (0.62 + rng() * 0.3);
          const d = plot * (0.62 + rng() * 0.3);
          const x = x0 + (i + 0.5) * plot;
          const z = z0 + (j + 0.5) * plot;
          const h =
            floorsAt(rng, Math.hypot(x, z)) * (WINDOW_TILE / WINDOW_CELLS);
          casters.push({ x, z, w, d, h });
        }
      }
    }
  }

  const distance = (box: Caster) => Math.hypot(box.x, box.z);
  for (const box of [...casters].sort((a, b) => distance(a) - distance(b))) {
    const roofBox = box.h > 20 ? 3 : 0;
    const seen = horizon.sees({ ...box, h: box.h + roofBox });
    horizon.block(box);
    if (!seen) continue;
    add({ ...box, color: pick(rng, BUILDING_COLORS), windows: true });
    if (roofBox) {
      add({
        ...box,
        w: box.w * 0.3,
        d: box.d * 0.3,
        h: roofBox,
        base: street + box.h,
        color: ROOF_BOX_COLOR,
        windows: false,
      });
    }
  }

  // This building, under the apartment, for anyone looking down from the balcony.
  add({
    x: -15,
    z: 0,
    w: 39.8,
    d: 34,
    h: FLOOR_ELEVATION - 0.11,
    color: BUILDING_COLORS[0],
    windows: true,
  });

  for (let i = 0; i < 46; i++) {
    addCar(STREET_X + (rng() < 0.5 ? -3 : 3), (rng() - 0.5) * 300, "z");
  }
  for (let i = 0; i < 30; i++) {
    const z = (Math.round(rng() * 6) - 3) * BLOCK + (rng() < 0.5 ? -3 : 3);
    addCar(STREET_X + 12 + rng() * 280, z, "x");
  }
  return { geometry: mergeGeometries(boxes), casters };
}

function buildTrees(rng: Rng, horizon: Horizon) {
  const trees: THREE.BufferGeometry[] = [];
  const crowns: Caster[] = [];
  const blob = (
    x: number,
    y: number,
    z: number,
    radius: number,
    color: string,
    detail: number,
  ) => {
    const geo = new THREE.IcosahedronGeometry(radius, detail);
    geo.scale(1, 0.85, 1);
    paintVertices(geo, color, (py) => 0.8 + (0.32 * py) / radius);
    geo.translate(x, y, z);
    trees.push(geo);
  };
  const crown = (x: number, z: number) => {
    const radius = 1.8 + rng() * 1.4;
    const y = -FLOOR_ELEVATION + 3 + radius;
    const color = pick(rng, TREE_COLORS);
    const spot = {
      x,
      z,
      w: radius * 2,
      d: radius * 2,
      h: y + FLOOR_ELEVATION,
    };
    crowns.push(spot);
    if (!horizon.sees({ ...spot, h: spot.h + radius })) return;

    const dist = Math.hypot(x, z);
    blob(x, y, z, radius, color, dist < 300 ? 1 : 0);
    if (dist < 120) {
      for (let i = 0; i < 3; i++) {
        const angle = rng() * Math.PI * 2;
        const offset = radius * 0.6;
        blob(
          x + Math.cos(angle) * offset,
          y + (rng() - 0.3) * offset,
          z + Math.sin(angle) * offset,
          radius * 0.65,
          color,
          1,
        );
      }
    }
  };

  const edge = STREET_HALF + SIDEWALK / 2;
  for (let gx = 0; gx <= 6; gx++) {
    for (const side of [-edge, edge]) {
      if (gx === 0 && side < 0) continue; // the building's own sidewalk stays clear
      for (let z = -420; z <= 420; z += 13) {
        if (rng() < 0.72) crown(STREET_X + gx * BLOCK + side, z + rng() * 4);
      }
    }
  }
  for (let gz = -5; gz <= 5; gz++) {
    for (const side of [-edge, edge]) {
      for (let x = STREET_X + 12; x <= 500; x += 13) {
        if (rng() < 0.6) crown(x + rng() * 4, gz * BLOCK + side);
      }
    }
  }
  return { geometry: mergeGeometries(trees), crowns };
}

// Sun shadows painted on a single texture, so overlaps do not get darker.
function buildShadows(
  sun: THREE.Vector3,
  buildings: Caster[],
  crowns: Caster[],
) {
  const size = 1024,
    m = size / SHADOW_AREA,
    half = SHADOW_AREA / 2;
  const { canvas, ctx } = canvas2d(size, size);
  const px = (x: number) => (x - STREET_X) * m;
  const pz = (z: number) => (z + half) * m;
  const sweepX = -sun.x / sun.y,
    sweepZ = -sun.z / sun.y;

  ctx.fillStyle = "#000";
  for (const { x, z, w, d, h } of buildings) {
    if (x - STREET_X > SHADOW_AREA + 100 || Math.abs(z) > half + 100) continue;
    const corners = [
      [x - w / 2, z - d / 2],
      [x + w / 2, z - d / 2],
      [x + w / 2, z + d / 2],
      [x - w / 2, z + d / 2],
    ];
    corners.forEach(([ax, az], i) => {
      const [bx, bz] = corners[(i + 1) % 4];
      ctx.beginPath();
      ctx.moveTo(px(ax), pz(az));
      ctx.lineTo(px(bx), pz(bz));
      ctx.lineTo(px(bx + sweepX * h), pz(bz + sweepZ * h));
      ctx.lineTo(px(ax + sweepX * h), pz(az + sweepZ * h));
      ctx.closePath();
      ctx.fill();
    });
  }
  for (const { x, z, w, h } of crowns) {
    ctx.beginPath();
    ctx.arc(
      px(x + sweepX * h),
      pz(z + sweepZ * h),
      (w / 2) * m,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Fades with distance instead of ending in a straight line.
  ctx.globalCompositeOperation = "destination-in";
  const fade = ctx.createRadialGradient(
    0,
    size / 2,
    size * 0.5,
    0,
    size / 2,
    size * 0.98,
  );
  fade.addColorStop(0, "#000");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);

  const geo = new THREE.PlaneGeometry(SHADOW_AREA, SHADOW_AREA);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      map: texture(canvas, false),
      color: "#000000",
      transparent: true,
      opacity: SHADOW_OPACITY,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  mesh.position.set(STREET_X + half, -FLOOR_ELEVATION + 0.15, 0);
  return mesh;
}

function streetLamps() {
  const points: number[] = [];
  const y = -FLOOR_ELEVATION + 7;
  for (let gx = 0; gx <= 6; gx++) {
    for (let z = -420; z <= 420; z += 32) {
      points.push(
        STREET_X + gx * BLOCK - STREET_HALF,
        y,
        z,
        STREET_X + gx * BLOCK + STREET_HALF,
        y,
        z + 16,
      );
    }
  }
  for (let gz = -5; gz <= 5; gz++) {
    for (let x = STREET_X + 20; x <= 500; x += 32) {
      points.push(
        x,
        y,
        gz * BLOCK - STREET_HALF,
        x + 16,
        y,
        gz * BLOCK + STREET_HALF,
      );
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: "#ffd9a0",
      size: 2.4,
      map: texture(cloudPuff(), false),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

function groundTile() {
  const size = 1024,
    m = size / BLOCK;
  const { canvas, ctx } = canvas2d(size, size);
  const edge = STREET_EDGE * m,
    half = STREET_HALF * m;

  ctx.fillStyle = "#44464a"; // road
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#a6a39c"; // sidewalk
  ctx.fillRect(half, half, size - half * 2, size - half * 2);
  ctx.fillStyle = "#8b8d80"; // inside the block
  ctx.fillRect(edge, edge, size - edge * 2, size - edge * 2);

  ctx.fillStyle = "#d8d5cb";
  for (let t = edge + 20; t < size - edge; t += 90) {
    ctx.fillRect(t, -3, 44, 6);
    ctx.fillRect(t, size - 3, 44, 6);
    ctx.fillRect(-3, t, 6, 44);
    ctx.fillRect(size - 3, t, 6, 44);
  }
  return texture(canvas, true);
}

function buildGround() {
  const geo = new THREE.PlaneGeometry(GROUND_HALF * 2, GROUND_HALF * 2);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - STREET_X) / BLOCK, pos.getZ(i) / BLOCK);
  }
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ map: groundTile() }),
  );
  mesh.position.y = -FLOOR_ELEVATION;
  return mesh;
}

// Landing behind the entry door, seen from inside like a room.
function buildLanding() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3, 5),
    new THREE.MeshLambertMaterial({ color: "#d6d2c9", side: THREE.BackSide }),
  );
  mesh.position.set(-1.35, 1.5, 2.1);
  return mesh;
}

export interface Landscape {
  group: THREE.Group;
  fog: THREE.FogExp2;
  setNight: (night: boolean) => void;
  updateView: (camera: THREE.Camera) => void;
}

export function createLandscape(sunDirection: THREE.Vector3): Landscape {
  const rng = seededRng(2026);
  const group = new THREE.Group();

  const skyMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    fog: false,
    toneMapped: false,
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(SKY_RADIUS, 48, 32),
    skyMaterial,
  );

  const { map, emissiveMap } = windowTextures();
  const cityMaterial = new THREE.MeshLambertMaterial({
    map,
    emissiveMap,
    emissive: "#ffffff",
    vertexColors: true,
  });
  const horizon = createHorizon();
  const { geometry: cityGeometry, casters } = buildCity(rng, horizon);
  const { geometry: treeGeometry, crowns } = buildTrees(rng, horizon);
  const city = new THREE.Mesh(cityGeometry, cityMaterial);
  const trees = new THREE.Mesh(
    treeGeometry,
    new THREE.MeshLambertMaterial({ vertexColors: true }),
  );
  const shadows = buildShadows(sunDirection, casters, crowns);
  const lamps = streetLamps();
  const outside = new THREE.Group();
  outside.add(buildGround(), shadows, city, trees, lamps);
  group.add(sky, outside, buildLanding());

  const fog = new THREE.FogExp2(HAZE.day, FOG_DENSITY);
  const skies = new Map<boolean, THREE.Texture>();

  const setNight = (night: boolean) => {
    if (!skies.has(night)) skies.set(night, paintSky(sunDirection, night));
    skyMaterial.map = skies.get(night)!;
    skyMaterial.needsUpdate = true;
    cityMaterial.emissiveIntensity = night ? 1.5 : 0;
    lamps.visible = night;
    shadows.visible = !night;
    // three blends fog after converting to sRGB, so the value goes in unconverted to match the sky.
    fog.color.setStyle(
      night ? HAZE.night : HAZE.day,
      THREE.LinearSRGBColorSpace,
    );
  };

  const frustum = new THREE.Frustum();
  const viewProjection = new THREE.Matrix4();
  const updateView = (camera: THREE.Camera) => {
    viewProjection.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    frustum.setFromProjectionMatrix(viewProjection);
    outside.visible = OPENINGS.some((box) => frustum.intersectsBox(box));
  };

  return { group, fog, setNight, updateView };
}
