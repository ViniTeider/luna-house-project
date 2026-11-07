import * as THREE from "three";
import { cm } from "../furniture/primitives";
import { blossomMaterials } from "./blossomKit";
import { canvasTexture } from "./canvas";
import { eclecticMaterials } from "./eclecticKit";
import { teenMaterials } from "./teenKit";

const noPicking = () => {};
const GLOW_COLOR = new THREE.Color("#ffae5e"); // about 2700 K

function paperTexture() {
  return canvasTexture(64, 256, (ctx) => {
    const glow = ctx.createLinearGradient(0, 0, 0, 256);
    glow.addColorStop(0, "#e9a862");
    glow.addColorStop(0.5, "#fff3dc");
    glow.addColorStop(1, "#e9a862");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 64, 256);
    ctx.fillStyle = "rgba(150,92,44,.4)";
    for (let y = 6; y < 256; y += 14) ctx.fillRect(0, y, 64, 2);
  });
}

function woolTexture() {
  let seed = 3;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tex = canvasTexture(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 9000; i++) {
        ctx.fillStyle = `rgba(120,92,62,${random() * 0.2})`;
        ctx.fillRect(random() * 256, random() * 256, 2 + random() * 5, 2);
      }
    },
    true,
  );
  tex.anisotropy = 8;
  return tex;
}

// Handmade square tiles: each one a little different, with thin grout between them.
function zelligeTexture() {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const size = 1024,
    cell = size / 10;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = "#b9a98f";
      ctx.fillRect(0, 0, size, size);
      for (let col = 0; col < 10; col++) {
        for (let row = 0; row < 10; row++) {
          const light = 226 + random() * 28;
          const r = Math.round(light),
            g = Math.round(light * 0.92),
            b = Math.round(light * 0.8);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(col * cell + 2, row * cell + 2, cell - 4, cell - 4);
        }
      }
    },
    true,
  );
  tex.anisotropy = 8;
  return tex;
}

function stoneFloorTexture() {
  let seed = 19;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const size = 1024,
    cell = size / 2;
  const tex = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = "#8d7c66";
      ctx.fillRect(0, 0, size, size);
      for (let col = 0; col < 2; col++) {
        for (let row = 0; row < 2; row++) {
          const light = 214 + random() * 14;
          ctx.fillStyle = `rgb(${light},${light * 0.9},${light * 0.76})`;
          ctx.fillRect(col * cell + 2, row * cell + 2, cell - 4, cell - 4);
        }
      }
      for (let i = 0; i < 2400; i++) {
        ctx.fillStyle = `rgba(120,96,70,${random() * 0.1})`;
        ctx.fillRect(random() * size, random() * size, 2 + random() * 26, 2);
      }
    },
    true,
  );
  tex.anisotropy = 8;
  return tex;
}

function haloTexture() {
  return canvasTexture(128, 128, (ctx) => {
    const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, "#ffffff");
    glow.addColorStop(0.45, "#6e6e6e");
    glow.addColorStop(1, "#000000");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 128, 128);
  });
}

// Light spilling on a surface is painted instead of computed: one real light per
// strip would cost time on every pixel of the screen.
export function createDecorKit() {
  const additive = {
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
  } as const;
  const plain = (color: string, roughness = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const kit = {
    glow: new THREE.MeshBasicMaterial({ ...additive, vertexColors: true }),
    halo: new THREE.MeshBasicMaterial({ ...additive, map: haloTexture() }),
    led: new THREE.MeshBasicMaterial({ color: "#ffd6a0", toneMapped: false }),
    paper: new THREE.MeshBasicMaterial({
      map: paperTexture(),
      toneMapped: false,
    }),
    bulb: new THREE.MeshBasicMaterial({ color: "#ffc98a", toneMapped: false }),
    leaf: new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    }),
    terracotta: plain("#a65f3e"),
    clay: plain("#d9cdb8"),
    darkWood: plain("#3a281b", 0.6),
    soil: plain("#2c2118", 1),
    cord: plain("#1d1a17", 0.7),
    curtain: new THREE.MeshStandardMaterial({
      color: "#e8dbc3",
      roughness: 0.95,
      side: THREE.DoubleSide,
    }),
    rug: new THREE.MeshStandardMaterial({
      color: "#d8c5a6",
      roughness: 1,
      map: woolTexture(),
    }),
    zellige: new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.32,
      map: zelligeTexture(),
    }),
    stoneFloor: new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.6,
      map: stoneFloorTexture(),
    }),
    towelLinen: plain("#d8cbb4", 1),
    amber: new THREE.MeshStandardMaterial({
      color: "#7a3f16",
      roughness: 0.2,
    }),
    wicker: plain("#a07c52", 0.9),
    cushionRust: plain("#97583c", 0.95),
    cushionOchre: plain("#b58f5a", 0.95),
    throw: plain("#8c6a48", 0.95),
    eclectic: eclecticMaterials(),
    teen: teenMaterials(),
    blossom: blossomMaterials(),
  };

  const setNight = (night: boolean) => {
    const strength = night ? 0.44 : 0.05;
    kit.glow.color.copy(GLOW_COLOR).multiplyScalar(strength);
    kit.halo.color.copy(GLOW_COLOR).multiplyScalar(strength);
    kit.paper.color.set(night ? "#ffffff" : "#e2d4bf");
    kit.led.color.set(night ? "#ffd6a0" : "#f3dcc0");
    kit.bulb.color.set(night ? "#ffc98a" : "#e8d8c0");
    kit.teen.setNight(night);
    kit.blossom.setNight(night);
  };

  return { ...kit, setNight };
}

export type DecorKit = ReturnType<typeof createDecorKit>;

type Point = [x: number, y: number, z: number];

function ownMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.raycast = noPicking;
  mesh.renderOrder = 2;
  parent.add(mesh);
  return mesh;
}

// Light fading from the edge a-b along `fade`, all in cm.
export function glowFrom(
  parent: THREE.Object3D,
  kit: DecorKit,
  a: Point,
  b: Point,
  fade: Point,
  strength = 1,
) {
  const rows: [number, number][] = [
    [0, 1],
    [0.3, 0.38],
    [0.65, 0.1],
    [1, 0],
  ];
  const positions: number[] = [];
  const colors: number[] = [];
  const index: number[] = [];
  rows.forEach(([t, light], row) => {
    for (const p of [a, b]) {
      positions.push(
        cm(p[0] + fade[0] * t),
        cm(p[1] + fade[1] * t),
        cm(p[2] + fade[2] * t),
      );
      colors.push(light * strength, light * strength, light * strength);
    }
    if (row) {
      const s = row * 2;
      index.push(s - 2, s - 1, s, s, s - 1, s + 1);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(index);
  return ownMesh(parent, geometry, kit.glow);
}

// A soft round pool of light. `facing` is the axis it looks along.
export function halo(
  parent: THREE.Object3D,
  kit: DecorKit,
  center: Point,
  width: number,
  height: number,
  facing: "x" | "y" | "z",
) {
  const geometry = new THREE.PlaneGeometry(cm(width), cm(height));
  if (facing === "x") geometry.rotateY(Math.PI / 2);
  if (facing === "y") geometry.rotateX(-Math.PI / 2);
  const mesh = ownMesh(parent, geometry, kit.halo);
  mesh.position.set(cm(center[0]), cm(center[1]), cm(center[2]));
  return mesh;
}

// Wavy cloth hanging along z, from `top` down to the floor.
export function curtain(
  parent: THREE.Object3D,
  kit: DecorKit,
  x: number,
  z0: number,
  z1: number,
  top: number,
) {
  const width = z1 - z0;
  const folds = Math.max(3, Math.round(width / 9));
  const geometry = new THREE.PlaneGeometry(cm(width), cm(top), folds * 6, 1);
  geometry.rotateY(Math.PI / 2);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getZ(i) + cm(width) / 2) / cm(width);
    pos.setX(i, cm(Math.sin(t * folds * Math.PI * 2) * 2.6));
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, kit.curtain);
  mesh.position.set(cm(x), cm(top / 2), cm((z0 + z1) / 2));
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
