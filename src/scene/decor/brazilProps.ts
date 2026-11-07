import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { B, Cyl, R, cm } from "../furniture/primitives";
import { seededRandom } from "./canvas";
import { glowDisc, lathe } from "./eclecticProps";
import { glowFrom, halo } from "./kit";
import type { DecorKit } from "./kit";
import { GREENS, leafGeometry } from "./plants";

type Point = [x: number, y: number, z: number];
type Radii = [nw: number, ne: number, se: number, sw: number];

const noPicking = () => {};

// Rectangle from (x0, y0) to (x1, y1) with its own radius at each corner, in cm.
function roundedRect(
  path: THREE.Path,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  [nw, ne, se, sw]: Radii,
) {
  path.moveTo(cm(x0 + nw), cm(y0));
  path.lineTo(cm(x1 - ne), cm(y0));
  path.quadraticCurveTo(cm(x1), cm(y0), cm(x1), cm(y0 + ne));
  path.lineTo(cm(x1), cm(y1 - se));
  path.quadraticCurveTo(cm(x1), cm(y1), cm(x1 - se), cm(y1));
  path.lineTo(cm(x0 + sw), cm(y1));
  path.quadraticCurveTo(cm(x0), cm(y1), cm(x0), cm(y1 - sw));
  path.lineTo(cm(x0), cm(y0 + nw));
  path.quadraticCurveTo(cm(x0), cm(y0), cm(x0 + nw), cm(y0));
}

// Paint on the ceiling, seen from below: a plan rectangle with rounded corners,
// optionally with a rounded hole that keeps the ceiling's own color.
export function ceilingPaint(
  g: THREE.Object3D,
  paint: THREE.Material,
  ceil: number,
  [x0, y0, x1, y1]: [number, number, number, number],
  radii: Radii,
  hole?: { inset: number; radius: number },
) {
  const shape = new THREE.Shape();
  roundedRect(shape, x0, y0, x1, y1, radii);
  if (hole) {
    const path = new THREE.Path();
    const { inset, radius } = hole;
    roundedRect(path, x0 + inset, y0 + inset, x1 - inset, y1 - inset, [
      radius,
      radius,
      radius,
      radius,
    ]);
    shape.holes.push(path);
  }
  const geometry = new THREE.ShapeGeometry(shape, 16);
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, paint);
  mesh.position.y = cm(ceil - 0.4);
  mesh.raycast = noPicking;
  mesh.receiveShadow = true;
  g.add(mesh);
}

// Black track on the ceiling from a to b (plan x, y) with spots aimed at `target`.
export function trackLight(
  g: THREE.Object3D,
  kit: DecorKit,
  black: THREE.Material,
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  ceil: number,
  spots: number,
  target: Point,
) {
  const track = new THREE.Group();
  g.add(track);
  const length = Math.hypot(bx - ax, by - ay);
  const bar = B(track, black, 0, ceil - 3.5, 0, length, 3.5, 3.5);
  bar.rotation.y = -Math.atan2(by - ay, bx - ax);
  bar.position.x = cm((ax + bx) / 2);
  bar.position.z = cm((ay + by) / 2);
  for (let i = 0; i < spots; i++) {
    const t = (i + 0.5) / spots;
    const at = new THREE.Vector3(
      cm(ax + (bx - ax) * t),
      cm(ceil - 6),
      cm(ay + (by - ay) * t),
    );
    const aim = new THREE.Vector3(cm(target[0]), cm(target[1]), cm(target[2]))
      .sub(at)
      .normalize();
    const spot = new THREE.Group();
    spot.position.copy(at);
    spot.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim);
    track.add(spot);
    Cyl(track, black, at.x * 100, ceil - 6, at.z * 100, 0.6, 3);
    Cyl(spot, black, 0, -12, 0, 3.6, 12);
    glowDisc(spot, kit, 0, -12.1, 0, 2.6);
  }
}

// Wood shelf on the wall at local z = `wall` (facing +z), LED strip underneath washing
// the wall below with light. `x0`/`x1` are its ends, `y` its underside.
export function ledShelf(
  g: THREE.Object3D,
  kit: DecorKit,
  wood: THREE.Material,
  x0: number,
  x1: number,
  y: number,
  wall: number,
  depth = 20,
) {
  B(g, wood, (x0 + x1) / 2, y, wall + depth / 2, x1 - x0, 3.5, depth);
  B(
    g,
    kit.led,
    (x0 + x1) / 2,
    y - 0.5,
    wall + 4,
    x1 - x0 - 4,
    0.5,
    1,
  ).castShadow = false;
  glowFrom(
    g,
    kit,
    [x0 + 2, y, wall + 0.3],
    [x1 - 2, y, wall + 0.3],
    [0, -70, 0],
    0.7,
  );
}

// Tripod floor lamp with a linen drum shade. Plan coordinates.
export function tripodLamp(
  g: THREE.Object3D,
  kit: DecorKit,
  wood: THREE.Material,
  shade: THREE.Material,
  x: number,
  z: number,
) {
  const lamp = new THREE.Group();
  lamp.position.set(cm(x), 0, cm(z));
  g.add(lamp);
  [0, 2.1, 4.2].forEach((angle) => {
    const leg = Cyl(
      lamp,
      wood,
      Math.sin(angle) * 12,
      0,
      Math.cos(angle) * 12,
      1.2,
      128,
    );
    leg.rotation.set(Math.cos(angle) * 0.1, 0, -Math.sin(angle) * 0.1);
    leg.position.y = cm(63);
  });
  const drum = lathe(
    lamp,
    shade,
    [
      [21, 0],
      [21, 30],
    ],
    [0, 122, 0],
  );
  drum.castShadow = false;
  glowDisc(lamp, kit, 0, 124, 0, 19);
  halo(g, kit, [x, 0.6, z], 110, 110, "y");
}

// Monstera in a woven basket: long stems, big leaves leaning out. Plan coordinates.
export function monstera(
  g: THREE.Object3D,
  kit: DecorKit,
  stem: THREE.Material,
  basket: THREE.Material,
  x: number,
  z: number,
  seed: number,
) {
  const random = seededRandom(seed);
  const plant = new THREE.Group();
  plant.position.set(cm(x), 0, cm(z));
  g.add(plant);
  lathe(
    plant,
    basket,
    [
      [0, 0],
      [13, 0],
      [17, 28],
      [17.6, 30],
      [0, 28],
    ],
    [0, 0, 0],
  );
  const leaves: THREE.BufferGeometry[] = [];
  const stems: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 16; i++) {
    const yaw = i * 2.4 + random() * 0.4;
    const lean = 0.25 + random() * 0.45;
    const length = 45 + random() * 55;
    const dir = new THREE.Vector3(
      Math.sin(yaw) * Math.sin(lean),
      Math.cos(lean),
      Math.cos(yaw) * Math.sin(lean),
    );
    const tip = new THREE.Vector3(0, 28, 0).addScaledVector(dir, length);
    const piece = new THREE.CylinderGeometry(cm(0.5), cm(0.7), cm(length), 5);
    piece.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir,
      ),
    );
    piece.translate(cm(tip.x / 2), cm(28 + (tip.y - 28) / 2), cm(tip.z / 2));
    stems.push(piece);
    const size = 28 + random() * 14;
    leaves.push(
      leafGeometry({
        at: [tip.x, tip.y, tip.z],
        yaw,
        pitch: 0.15 + random() * 0.35,
        length: size,
        width: size * 1.1,
        droop: 0.35,
        color: GREENS[i % 2 ? 2 : 0],
      }),
    );
  }
  const stalks = new THREE.Mesh(mergeGeometries(stems), stem);
  const foliage = new THREE.Mesh(mergeGeometries(leaves), kit.leaf);
  [stalks, foliage].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.raycast = noPicking;
    plant.add(mesh);
  });
}

// Column cactus with two arms in a clay pot. Plan coordinates.
export function cactus(
  g: THREE.Object3D,
  green: THREE.Material,
  pot: THREE.Material,
  x: number,
  z: number,
  height: number,
) {
  const plant = new THREE.Group();
  plant.position.set(cm(x), 0, cm(z));
  g.add(plant);
  lathe(
    plant,
    pot,
    [
      [0, 0],
      [9, 0],
      [12, 20],
      [12.6, 22],
      [0, 20],
    ],
    [0, 0, 0],
  );
  R(plant, green, 0, 18, 0, 11, height, 11, 5.4);
  [
    [-1, 0.45, 0.35],
    [1, 0.6, 0.25],
  ].forEach(([side, at, size]) => {
    R(plant, green, side * 8, 18 + height * at, 0, 8, 6, 7, 3.4);
    R(
      plant,
      green,
      side * 11,
      18 + height * at,
      0,
      7.5,
      height * size,
      7.5,
      3.6,
    );
  });
}

// Round armchair with a matching ottoman in front, facing +z. Plan coordinates.
export function armchair(
  g: THREE.Object3D,
  fabric: THREE.Material,
  legs: THREE.Material,
  x: number,
  z: number,
  turn: number,
) {
  const chair = new THREE.Group();
  chair.position.set(cm(x), 0, cm(z));
  chair.rotation.y = turn;
  g.add(chair);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => Cyl(chair, legs, sx * 26, 0, sz * 22, 1.2, 14)),
  );
  R(chair, fabric, 0, 14, 0, 66, 16, 62, 6);
  R(chair, fabric, 0, 30, 4, 50, 12, 52, 5);
  const back = R(chair, fabric, 0, 28, -24, 66, 50, 16, 7);
  back.rotation.x = -0.12;
  [-1, 1].forEach((side) => R(chair, fabric, side * 28, 28, 2, 12, 22, 56, 5));
  // Ottoman
  Cyl(chair, legs, 0, 0, 62, 10, 3);
  R(chair, fabric, 0, 3, 62, 46, 36, 40, 8);
}

// Painted wainscoting on a west wall (plan x = `wall`), from y0 to y1, `height` tall.
export function wainscot(
  g: THREE.Object3D,
  paint: THREE.Material,
  wall: number,
  y0: number,
  y1: number,
  height: number,
) {
  const mid = (y0 + y1) / 2,
    span = y1 - y0;
  B(g, paint, wall + 0.4, 0, mid, 0.8, height, span).castShadow = false;
  B(g, paint, wall + 1.2, 0, mid, 1.6, 10, span);
  B(g, paint, wall + 1.6, height - 4, mid, 2.4, 4, span);
  for (let y = y0 + 16; y < y1 - 8; y += 30)
    B(g, paint, wall + 1.2, 10, y, 1.6, height - 14, 3);
}

// Woven rattan domes over the island, bottoms near 90 cm above it.
export function rattanPendants(
  g: THREE.Object3D,
  kit: DecorKit,
  rattan: THREE.Material,
  ceil: number,
) {
  const hanging = new THREE.Group();
  hanging.userData.overhead = true;
  const bottom = 180;
  [-48, 48].forEach((x) => {
    const dome: [number, number][] = Array.from({ length: 10 }, (_, k) => {
      const a = (k / 9) * (Math.PI / 2);
      return [Math.max(1.5, 24 * Math.cos(a)), 18 * Math.sin(a)];
    });
    lathe(hanging, rattan, dome, [x, bottom, 0]);
    glowDisc(hanging, kit, x, bottom + 8, 0, 6);
    Cyl(hanging, kit.cord, x, bottom + 18, 0, 0.3, ceil - bottom - 18);
    Cyl(hanging, kit.cord, x, ceil - 2, 0, 5, 2);
  });
  const light = new THREE.PointLight("#ffbd7a", 0, 5, 1.8);
  light.position.set(0, cm(bottom), 0);
  light.userData.lantern = true;
  hanging.add(light);
  g.add(hanging);
}
