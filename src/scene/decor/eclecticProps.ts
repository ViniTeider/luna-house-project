import * as THREE from "three";
import { B, Cyl, cm } from "../furniture/primitives";
import { halo } from "./kit";
import type { DecorKit } from "./kit";

function lathe(
  g: THREE.Object3D,
  material: THREE.Material,
  profile: [number, number][],
  [x, y, z]: [number, number, number],
) {
  const mesh = new THREE.Mesh(
    new THREE.LatheGeometry(
      profile.map(([r, h]) => new THREE.Vector2(cm(r), cm(h))),
      28,
    ),
    material,
  );
  mesh.position.set(cm(x), cm(y), cm(z));
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

// Disc of light facing down, closing the open bottom of a shade.
function glowDisc(
  g: THREE.Object3D,
  kit: DecorKit,
  x: number,
  y: number,
  z: number,
  r: number,
) {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(cm(r), 24), kit.bulb);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(cm(x), cm(y), cm(z));
  g.add(disc);
}

// Glossy mushroom table lamp standing on a surface at height `top`.
export function mushroomLamp(
  g: THREE.Object3D,
  kit: DecorKit,
  material: THREE.Material,
  x: number,
  top: number,
  z: number,
) {
  lathe(
    g,
    material,
    [
      [0, 0],
      [7, 0],
      [7, 1],
      [2, 3],
      [1.6, 20],
    ],
    [x, top, z],
  );
  const cap: [number, number][] = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 9) * (Math.PI / 2);
    return [Math.max(0.01, 12 * Math.cos(a)), 9 * Math.sin(a)];
  });
  lathe(g, material, cap, [x, top + 20, z]);
  glowDisc(g, kit, x, top + 19.9, z, 11.5);
  halo(g, kit, [x, top + 0.4, z], 56, 56, "y");
}

// Three enamel domes in different colors over the island, bottoms near 88 cm above it.
export function enamelPendants(
  g: THREE.Object3D,
  kit: DecorKit,
  materials: THREE.Material[],
  ceil: number,
) {
  const hanging = new THREE.Group();
  hanging.userData.overhead = true;
  materials.forEach((material, i) => {
    const x = (i - 1) * 64;
    const bottom = 178;
    const dome: [number, number][] = Array.from({ length: 10 }, (_, k) => {
      const a = (k / 9) * (Math.PI / 2);
      return [Math.max(1.2, 15 * Math.cos(a)), 14 * Math.sin(a)];
    });
    lathe(hanging, material, dome, [x, bottom, 0]);
    glowDisc(hanging, kit, x, bottom + 0.3, 0, 14.4);
    Cyl(hanging, kit.cord, x, bottom + 14, 0, 0.3, ceil - bottom - 14);
    Cyl(hanging, material, x, ceil - 2, 0, 5, 2);
  });
  const light = new THREE.PointLight("#ffb46e", 0, 5, 1.8);
  light.position.set(0, 1.7, 0);
  light.userData.lantern = true;
  hanging.add(light);
  g.add(hanging);
}

// Low glazed bowl of lemons and oranges.
export function fruitBowl(
  g: THREE.Object3D,
  bowl: THREE.Material,
  lemon: THREE.Material,
  orange: THREE.Material,
  x: number,
  top: number,
  z: number,
) {
  lathe(
    g,
    bowl,
    [
      [0, 0],
      [7, 0],
      [13, 5],
      [15, 8],
    ],
    [x, top, z],
  );
  [
    [-5, 3, lemon],
    [4, -3, orange],
    [5, 5, lemon],
    [-4, -5, orange],
    [0, 0, lemon],
  ].forEach(([dx, dz, material], i) => {
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(cm(4), 14, 10),
      material as THREE.Material,
    );
    if (material === lemon) fruit.scale.set(1, 0.85, 1.25);
    fruit.position.set(
      cm(x + (dx as number)),
      cm(top + 6 + (i === 4 ? 5 : 0)),
      cm(z + (dz as number)),
    );
    fruit.castShadow = true;
    g.add(fruit);
  });
}

// Thin frame with a mat around the print. `facing` turns the front (+z) toward the room.
export function framed(
  g: THREE.Object3D,
  frame: THREE.Material,
  mat: THREE.Material,
  print: THREE.Material,
  [x, y, z]: [number, number, number],
  w: number,
  h: number,
  facing: number,
) {
  const group = new THREE.Group();
  group.position.set(cm(x), cm(y), cm(z));
  group.rotation.y = facing;
  g.add(group);
  const bar = 1.4;
  B(group, frame, 0, -h / 2, 0, w, bar, 2.4);
  B(group, frame, 0, h / 2 - bar, 0, w, bar, 2.4);
  [-1, 1].forEach((side) =>
    B(group, frame, side * (w / 2 - bar / 2), -h / 2, 0, bar, h, 2.4),
  );
  const inner = (size: number) => size - bar * 2;
  const margin = Math.min(w, h) * 0.14;
  const matMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(cm(inner(w)), cm(inner(h))),
    mat,
  );
  matMesh.position.z = cm(0.3);
  group.add(matMesh);
  const picture = new THREE.Mesh(
    new THREE.PlaneGeometry(
      cm(inner(w) - margin * 2),
      cm(inner(h) - margin * 2),
    ),
    print,
  );
  picture.position.z = cm(0.4);
  group.add(picture);
  return group;
}

// Painted arch on a wall, in the XY plane facing +z: `w` wide and `h` tall, bottom at y = 0.
export function paintedArch(
  g: THREE.Object3D,
  paint: THREE.Material,
  [x, y, z]: [number, number, number],
  w: number,
  h: number,
  facing: number,
) {
  const r = w / 2;
  const shape = new THREE.Shape();
  shape.moveTo(cm(-r), 0);
  shape.lineTo(cm(r), 0);
  shape.lineTo(cm(r), cm(h - r));
  shape.absarc(0, cm(h - r), cm(r), 0, Math.PI, false);
  shape.lineTo(cm(-r), 0);
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 32), paint);
  mesh.position.set(cm(x), cm(y), cm(z));
  mesh.rotation.y = facing;
  mesh.receiveShadow = true;
  mesh.raycast = () => {};
  g.add(mesh);
  return mesh;
}

// Bottle-shaped ceramic vase standing at `y`.
export function vase(
  g: THREE.Object3D,
  material: THREE.Material,
  [x, y, z]: [number, number, number],
  radius: number,
  height: number,
) {
  return lathe(
    g,
    material,
    [
      [0, 0],
      [radius * 0.7, 0],
      [radius, height * 0.35],
      [radius * 0.9, height * 0.7],
      [radius * 0.45, height * 0.88],
      [radius * 0.5, height],
    ],
    [x, y, z],
  );
}

// A few dry branches fanning out of a vase mouth at (x, y, z).
export function driedStems(
  g: THREE.Object3D,
  material: THREE.Material,
  [x, y, z]: [number, number, number],
  length: number,
) {
  [
    [0.25, 0.3],
    [-0.3, 1.9],
    [0.18, 3.6],
    [-0.12, 5],
  ].forEach(([lean, turn]) => {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(cm(0.25), cm(0.4), cm(length), 5),
      material,
    );
    stem.geometry.translate(0, cm(length / 2), 0);
    stem.position.set(cm(x), cm(y), cm(z));
    stem.rotation.set(lean, turn, lean * 0.5, "YXZ");
    stem.castShadow = true;
    g.add(stem);
  });
}

// Round pedestal side table, top at `height`. Plan coordinates.
export function sideTable(
  g: THREE.Object3D,
  material: THREE.Material,
  x: number,
  z: number,
  radius: number,
  height: number,
) {
  Cyl(g, material, x, 0, z, radius * 0.7, 2);
  Cyl(g, material, x, 2, z, 2.5, height - 4.5);
  Cyl(g, material, x, height - 2.5, z, radius, 2.5);
}

// Green glass banker's lamp in the local space of a desk with its top at `top`.
// The shade faces +x, toward whoever sits at the desk.
export function bankersLamp(
  g: THREE.Object3D,
  kit: DecorKit,
  brass: THREE.Material,
  glass: THREE.Material,
  x: number,
  top: number,
  z: number,
) {
  Cyl(g, brass, x, top, z, 7, 1.6);
  Cyl(g, brass, x, top + 1.6, z, 0.7, 30);
  B(g, brass, x + 3, top + 31, z, 7, 1, 1.2);
  const shade = Cyl(g, glass, x + 6, top + 31, z, 6, 26, "z");
  shade.scale.z = 0.55; // the cylinder's z is vertical once it lies along z
  Cyl(g, kit.bulb, x + 6, top + 28.6, z, 2.4, 20, "z").castShadow = false;
  halo(g, kit, [x + 8, top + 0.4, z], 60, 70, "y");
}

// Taper candle in a brass holder, or a pillar candle when `taper` is false.
export function candle(
  g: THREE.Object3D,
  wax: THREE.Material,
  brass: THREE.Material,
  [x, y, z]: [number, number, number],
  height: number,
  taper = true,
) {
  if (!taper) {
    Cyl(g, wax, x, y, z, 3.6, height);
    return;
  }
  Cyl(g, brass, x, y, z, 2.6, 0.8);
  Cyl(g, brass, x, y + 0.8, z, 0.8, 4);
  Cyl(g, brass, x, y + 4.8, z, 1.5, 1.2);
  Cyl(g, wax, x, y + 6, z, 1, height);
}

// Horizontal blinds inside a window recess, slats tilted open to let light through.
// Runs along plan y at plan x = `x`, from `bottom` to `top` (cm above the floor).
export function blinds(
  g: THREE.Object3D,
  slat: THREE.Material,
  x: number,
  y0: number,
  y1: number,
  bottom: number,
  top: number,
  railed: boolean,
) {
  const width = y1 - y0;
  const step = 2.6;
  const count = Math.floor((top - bottom - 4) / step);
  if (count <= 0) return;
  const slats = new THREE.InstancedMesh(
    new THREE.BoxGeometry(cm(2.5), cm(0.2), cm(width)),
    slat,
    count,
  );
  const m = new THREE.Matrix4();
  const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.85));
  const one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < count; i++) {
    m.compose(
      new THREE.Vector3(cm(x), cm(bottom + 2 + i * step), cm((y0 + y1) / 2)),
      tilt,
      one,
    );
    slats.setMatrixAt(i, m);
  }
  slats.castShadow = slats.receiveShadow = true;
  g.add(slats);
  B(g, slat, x, bottom, (y0 + y1) / 2, 3, 1.2, width);
  if (railed) B(g, slat, x, top - 4, (y0 + y1) / 2, 4, 4, width + 1);
}

// Fan with wooden blades and a glass light bowl under the motor. Plan coordinates.
export function ceilingFan(
  g: THREE.Object3D,
  kit: DecorKit,
  wood: THREE.Material,
  metal: THREE.Material,
  x: number,
  y: number,
  ceil: number,
) {
  const fan = new THREE.Group();
  fan.position.set(cm(x), 0, cm(y));
  g.add(fan);
  Cyl(fan, metal, 0, ceil - 4, 0, 7, 4);
  Cyl(fan, metal, 0, ceil - 24, 0, 1, 20);
  Cyl(fan, metal, 0, ceil - 36, 0, 11, 12);
  for (let i = 0; i < 5; i++) {
    const arm = new THREE.Group();
    arm.position.y = cm(ceil - 31);
    arm.rotation.y = (i / 5) * Math.PI * 2 + 0.3;
    fan.add(arm);
    B(arm, metal, 16, -1, 0, 12, 2, 4);
    B(arm, wood, 46, -0.6, 0, 58, 1, 14).rotation.x = 0.12;
  }
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(
      cm(9),
      20,
      10,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    ),
    kit.bulb,
  );
  bowl.position.y = cm(ceil - 36);
  fan.add(bowl);
}

// Skateboard hung flat on a wall at plan x = `wall`, nose up, bottom and wheels
// facing east. `center` is its middle height.
export function skateboard(
  g: THREE.Object3D,
  m: {
    skateDeck: THREE.Material;
    truck: THREE.Material;
    wheel: THREE.Material;
  },
  wall: number,
  y: number,
  center: number,
) {
  const length = 80,
    width = 20,
    ply = 1.2;
  const board = new THREE.Group();
  // Built with the bottom facing +z and the nose up, then turned to face east
  board.position.set(cm(wall + 0.4), cm(center), cm(y));
  board.rotation.y = Math.PI / 2;
  g.add(board);
  const r = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(cm(-r), cm(-length / 2 + r));
  shape.lineTo(cm(-r), cm(length / 2 - r));
  shape.absarc(0, cm(length / 2 - r), cm(r), Math.PI, 0, true);
  shape.lineTo(cm(r), cm(-length / 2 + r));
  shape.absarc(0, cm(-length / 2 + r), cm(r), 0, Math.PI, true);
  const deck = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: cm(ply),
      bevelEnabled: false,
      curveSegments: 16,
    }),
    m.skateDeck,
  );
  deck.castShadow = true;
  board.add(deck);
  // Trucks and wheels stand out from the bottom
  [-27, 27].forEach((ty) => {
    B(board, m.truck, 0, ty - 4, ply + 0.5, 5, 8, 1);
    Cyl(board, m.truck, 0, ty, ply + 4, 0.9, 17, "x");
    [-1, 1].forEach((side) =>
      Cyl(board, m.wheel, side * 9.6, ty, ply + 4, 2.7, 3.2, "x"),
    );
  });
}
