import * as THREE from "three";
import { B, Cyl, cm } from "../furniture/primitives";
import { glowDisc, lathe } from "./eclecticProps";
import { halo } from "./kit";
import type { DecorKit } from "./kit";

type Point = [x: number, y: number, z: number];
type Flat = [u: number, v: number];

const noPicking = () => {};

// Outlines for the neon signs, about 1 unit across, centered on the origin
export const NEON_SHAPES: Record<"bolt" | "heart" | "star", Flat[]> = {
  bolt: [
    [0.12, 0.5],
    [-0.3, -0.04],
    [-0.02, -0.04],
    [-0.14, -0.5],
    [0.3, 0.1],
    [0.02, 0.1],
  ],
  heart: Array.from({ length: 40 }, (_, i) => {
    const t = (i / 40) * Math.PI * 2;
    return [
      (16 * Math.sin(t) ** 3) / 34,
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)) /
        34,
    ] as Flat;
  }),
  star: Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 ? 0.21 : 0.5;
    return [Math.cos(a) * r, Math.sin(a) * r] as Flat;
  }),
};

// Glass tube bent into `shape`, standing 2 cm off a wall, with its light on the wall
// behind. Built facing +z, then turned by `facing`. `size` is the width in cm.
export function neonSign(
  g: THREE.Object3D,
  tube: THREE.Material,
  glow: THREE.Material,
  shape: Flat[],
  [x, y, z]: Point,
  size: number,
  facing: number,
  smooth = false,
) {
  const sign = new THREE.Group();
  sign.position.set(cm(x), cm(y), cm(z));
  sign.rotation.y = facing;
  g.add(sign);
  const points = shape.map(
    ([u, v]) => new THREE.Vector3(cm(u * size), cm(v * size), cm(2)),
  );
  let path: THREE.Curve<THREE.Vector3>;
  if (smooth) path = new THREE.CatmullRomCurve3(points, true);
  else {
    const lines = new THREE.CurvePath<THREE.Vector3>();
    points.forEach((p, i) =>
      lines.add(new THREE.LineCurve3(p, points[(i + 1) % points.length])),
    );
    path = lines;
  }
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(path, 240, cm(0.8), 8, true),
    tube,
  );
  mesh.raycast = noPicking;
  sign.add(mesh);
  const light = new THREE.Mesh(
    new THREE.PlaneGeometry(cm(size * 2), cm(size * 2)),
    glow,
  );
  light.position.z = cm(0.4);
  light.raycast = noPicking;
  light.renderOrder = 2;
  sign.add(light);
  return sign;
}

// Party lights hanging in `swags` loops from a to b, bulbs cycling through colors.
export function stringLights(
  g: THREE.Object3D,
  cord: THREE.Material,
  bulbs: THREE.Material[],
  a: Point,
  b: Point,
  swags: number,
  sag: number,
  count: number,
) {
  const point = (t: number) =>
    new THREE.Vector3(
      cm(a[0] + (b[0] - a[0]) * t),
      cm(
        a[1] +
          (b[1] - a[1]) * t -
          sag * Math.abs(Math.sin(t * swags * Math.PI)),
      ),
      cm(a[2] + (b[2] - a[2]) * t),
    );
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: swags * 10 + 1 }, (_, i) => point(i / (swags * 10))),
  );
  const wire = new THREE.Mesh(
    new THREE.TubeGeometry(curve, swags * 24, cm(0.2), 5),
    cord,
  );
  wire.raycast = noPicking;
  g.add(wire);
  const globe = new THREE.SphereGeometry(cm(1.8), 12, 8);
  for (let i = 0; i < count; i++) {
    const p = point((i + 0.5) / count);
    const bulb = new THREE.Mesh(globe, bulbs[i % bulbs.length]);
    bulb.scale.y = 1.3;
    bulb.position.copy(p).setY(p.y - cm(3));
    bulb.raycast = noPicking;
    g.add(bulb);
  }
}

// Vinyl records hung on a wall at plan x = `wallX`, faces turned east.
export function recordWall(
  g: THREE.Object3D,
  edge: THREE.Material,
  labels: THREE.Material[],
  wallX: number,
  spots: [y: number, height: number][],
) {
  spots.forEach(([y, height], i) => {
    const label = labels[i % labels.length];
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(cm(15), cm(15), cm(0.4), 40),
      [edge, label, label],
    );
    disc.rotation.z = Math.PI / 2;
    disc.position.set(cm(wallX + 1.2), cm(height), cm(y));
    g.add(disc);
  });
}

// Unframed poster held up by four bits of tape. Built facing +z, turned by `facing`.
export function poster(
  g: THREE.Object3D,
  print: THREE.Material,
  tape: THREE.Material,
  [x, y, z]: Point,
  w: number,
  h: number,
  facing: number,
  tilt = 0,
) {
  const group = new THREE.Group();
  group.position.set(cm(x), cm(y), cm(z));
  group.rotation.set(0, facing, 0);
  g.add(group);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(cm(w), cm(h)), print);
  sheet.rotation.z = tilt;
  sheet.position.z = cm(0.2);
  sheet.receiveShadow = true;
  group.add(sheet);
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sy) => {
      const strip = B(
        sheet,
        tape,
        sx * (w / 2 - 2),
        sy * (h / 2 - 2) - 1,
        0.1,
        7,
        2.4,
        0.1,
      );
      strip.rotation.z = sx * sy * 0.7;
      strip.castShadow = false;
    }),
  );
  return group;
}

// Squashy bean bag with a raised back toward `turn`. Plan coordinates.
export function beanBag(
  g: THREE.Object3D,
  material: THREE.Material,
  x: number,
  z: number,
  radius: number,
  turn: number,
) {
  const bag = new THREE.Group();
  bag.position.set(cm(x), 0, cm(z));
  bag.rotation.y = turn;
  g.add(bag);
  const seat = new THREE.Mesh(
    new THREE.SphereGeometry(cm(radius), 28, 18),
    material,
  );
  seat.scale.set(1, 0.55, 1);
  seat.position.y = cm(radius * 0.5);
  const back = new THREE.Mesh(
    new THREE.SphereGeometry(cm(radius * 0.72), 24, 16),
    material,
  );
  back.scale.set(1.1, 0.95, 0.7);
  back.position.set(0, cm(radius * 0.95), cm(-radius * 0.45));
  [seat, back].forEach((part) => {
    part.castShadow = part.receiveShadow = true;
    bag.add(part);
  });
}

// Three metal cone shades over the island (use a double-sided material), bottoms 88 cm above it.
export function conePendants(
  g: THREE.Object3D,
  kit: DecorKit,
  shade: THREE.Material,
  ceil: number,
) {
  const hanging = new THREE.Group();
  hanging.userData.overhead = true;
  const bottom = 178;
  [-64, 0, 64].forEach((x) => {
    lathe(
      hanging,
      shade,
      [
        [13, 0],
        [12.6, 1],
        [4, 20],
        [1.5, 22],
      ],
      [x, bottom, 0],
    );
    glowDisc(hanging, kit, x, bottom + 3, 0, 10);
    Cyl(hanging, kit.cord, x, bottom + 22, 0, 0.3, ceil - bottom - 22);
    Cyl(hanging, shade, x, ceil - 2, 0, 5, 2);
  });
  const light = new THREE.PointLight("#ffbd7a", 0, 5, 1.8);
  light.position.set(0, 1.7, 0);
  light.userData.lantern = true;
  hanging.add(light);
  g.add(hanging);
}

// Faceted mirror ball on a chain. Plan coordinates.
export function discoBall(
  g: THREE.Object3D,
  mirror: THREE.Material,
  chain: THREE.Material,
  x: number,
  z: number,
  center: number,
  ceil: number,
) {
  const hanging = new THREE.Group();
  hanging.userData.overhead = true;
  g.add(hanging);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(cm(11), 3), mirror);
  ball.position.set(cm(x), cm(center), cm(z));
  ball.rotation.y = 0.4;
  ball.castShadow = true;
  hanging.add(ball);
  Cyl(hanging, chain, x, center + 10, z, 0.3, ceil - center - 10);
  Cyl(hanging, chain, x, ceil - 1.5, z, 3, 1.5);
}

// Round-bellied kettle on a cooktop at height `top`, spout toward +x.
export function kettle(
  g: THREE.Object3D,
  body: THREE.Material,
  chrome: THREE.Material,
  x: number,
  top: number,
  z: number,
) {
  lathe(
    g,
    body,
    [
      [0, 0],
      [8, 0],
      [10.5, 6],
      [9, 14],
      [4, 18],
      [0, 18.5],
    ],
    [x, top, z],
  );
  Cyl(g, chrome, x, top + 18, z, 1.4, 2.4);
  const spout = Cyl(g, body, x + 10, top + 9, z, 1.4, 12);
  spout.rotation.z = -0.9;
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(cm(7), cm(0.8), 8, 20, Math.PI),
    chrome,
  );
  handle.position.set(cm(x), cm(top + 17), cm(z));
  handle.castShadow = true;
  g.add(handle);
}

// Yellow rubber duck, about 9 cm long, looking toward `turn`.
export function rubberDuck(
  g: THREE.Object3D,
  body: THREE.Material,
  beak: THREE.Material,
  [x, y, z]: Point,
  turn: number,
) {
  const duck = new THREE.Group();
  duck.position.set(cm(x), cm(y), cm(z));
  duck.rotation.y = turn;
  g.add(duck);
  const sphere = (material: THREE.Material, r: number, p: Point, s: Point) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(cm(r), 16, 12),
      material,
    );
    mesh.position.set(cm(p[0]), cm(p[1]), cm(p[2]));
    mesh.scale.set(...s);
    mesh.castShadow = true;
    duck.add(mesh);
  };
  sphere(body, 4, [0, 3, 0], [1.25, 0.8, 1]);
  sphere(body, 2.6, [2.6, 6.8, 0], [1, 1, 1]);
  sphere(beak, 1.2, [5.2, 6.4, 0], [1.3, 0.5, 1]);
}

// Dome desk lamp (double-sided material) with the shade leaning over the desk (+x). `top` is the desktop.
export function domeLamp(
  g: THREE.Object3D,
  kit: DecorKit,
  metal: THREE.Material,
  x: number,
  top: number,
  z: number,
) {
  Cyl(g, metal, x, top, z, 8, 2);
  const arm = Cyl(g, metal, x + 6, top + 2, z, 0.9, 36);
  arm.rotation.z = -0.35;
  const head = new THREE.Group();
  head.position.set(cm(x + 13), cm(top + 36), cm(z));
  head.rotation.z = -0.5;
  g.add(head);
  lathe(
    head,
    metal,
    [
      [10, 0],
      [9.6, 1.2],
      [7, 8],
      [2, 11],
      [0, 11],
    ],
    [0, -8, 0],
  );
  glowDisc(head, kit, 0, -7, 0, 9);
  halo(g, kit, [x + 22, top + 0.4, z], 70, 70, "y");
}
