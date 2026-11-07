import * as THREE from "three";
import { B, Cyl, cm } from "../furniture/primitives";
import { glowDisc, lathe } from "./eclecticProps";
import { halo } from "./kit";
import type { DecorKit } from "./kit";

type Point = [x: number, y: number, z: number];

const noPicking = () => {};

// Round paper lantern on a cord, center at `center` cm. Local coordinates of `g`.
export function paperLantern(
  g: THREE.Object3D,
  kit: DecorKit,
  paper: THREE.Material,
  x: number,
  z: number,
  center: number,
  radius: number,
  ceil: number,
) {
  const hanging = new THREE.Group();
  hanging.userData.overhead = true;
  g.add(hanging);
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(cm(radius), 32, 20),
    paper,
  );
  globe.position.set(cm(x), cm(center), cm(z));
  globe.raycast = noPicking;
  hanging.add(globe);
  Cyl(
    hanging,
    kit.cord,
    x,
    center + radius - 1,
    z,
    0.3,
    ceil - center - radius + 1,
  );
  Cyl(hanging, kit.cord, x, ceil - 1.5, z, 4, 1.5);
  const light = new THREE.PointLight("#ffb66e", 0, 5, 1.8);
  light.position.set(cm(x), cm(center), cm(z));
  light.userData.lantern = true;
  hanging.add(light);
  return hanging;
}

// Paper floor lamp in three soft tiers on thin black legs. Plan coordinates.
export function tieredLamp(
  g: THREE.Object3D,
  kit: DecorKit,
  paper: THREE.Material,
  black: THREE.Material,
  x: number,
  z: number,
) {
  const lamp = new THREE.Group();
  lamp.position.set(cm(x), 0, cm(z));
  g.add(lamp);
  [0, 2.1, 4.2].forEach((angle) =>
    Cyl(lamp, black, Math.sin(angle) * 14, 0, Math.cos(angle) * 14, 0.5, 70),
  );
  Cyl(lamp, black, 0, 66, 0, 14.5, 0.6);
  const profile: [number, number][] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const tier = Math.sin(t * Math.PI * 3);
    profile.push([
      Math.max(2, (26 - t * 12) * (0.78 + 0.22 * Math.abs(tier))),
      t * 64,
    ]);
  }
  profile.push([0.01, 64]);
  lathe(lamp, paper, profile, [0, 68, 0]).castShadow = false;
  halo(g, kit, [x, 0.6, z], 120, 120, "y");
}

// Floor lamp with an arching chrome stem from a marble base to a dome shade.
// Plan coordinates; `to` is where the shade hangs.
export function arcLamp(
  g: THREE.Object3D,
  kit: DecorKit,
  chrome: THREE.Material,
  shade: THREE.Material,
  marble: THREE.Material,
  [x, z]: [number, number],
  [tx, tz]: [number, number],
  height: number,
) {
  Cyl(g, marble, x, 0, z, 16, 4);
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(cm(x), cm(4), cm(z)),
    new THREE.Vector3(cm(x), cm(height + 60), cm(z)),
    new THREE.Vector3(cm(tx), cm(height + 14), cm(tz)),
  );
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 40, cm(1), 8),
    chrome,
  );
  stem.castShadow = true;
  stem.raycast = noPicking;
  g.add(stem);
  const dome: [number, number][] = Array.from({ length: 10 }, (_, k) => {
    const a = (k / 9) * (Math.PI / 2);
    return [Math.max(1, 19 * Math.cos(a)), 15 * Math.sin(a)];
  });
  lathe(g, shade, dome, [tx, height, tz]);
  glowDisc(g, kit, tx, height + 1, tz, 16);
  halo(g, kit, [tx, 46, tz], 110, 110, "y");
}

// Picture ledge on a west wall (plan x = `wall`) with album covers leaning on it.
export function albumLedge(
  g: THREE.Object3D,
  wood: THREE.Material,
  covers: THREE.Material[],
  wall: number,
  y0: number,
  y1: number,
  height: number,
  first: number,
) {
  const mid = (y0 + y1) / 2;
  B(g, wood, wall + 4.5, height, mid, 9, 2.5, y1 - y0);
  B(g, wood, wall + 8.5, height + 2.5, mid, 1, 3, y1 - y0);
  const count = Math.floor((y1 - y0) / 33);
  const sleeve = new THREE.PlaneGeometry(cm(31), cm(31));
  for (let i = 0; i < count; i++) {
    const cover = new THREE.Mesh(sleeve, covers[(first + i) % covers.length]);
    cover.position.set(
      cm(wall + 5),
      cm(height + 2.5 + 15.4),
      cm(y0 + 17 + i * 33),
    );
    cover.rotation.set(0, Math.PI / 2, 0);
    cover.rotateX(-0.12);
    cover.castShadow = true;
    g.add(cover);
  }
}

// Knot cushion: a fat tube tied in a knot. `scale` 1 is about 30 cm across.
export function knotCushion(
  g: THREE.Object3D,
  material: THREE.Material,
  [x, y, z]: Point,
  turn: number,
) {
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(cm(7.5), cm(4.2), 80, 12, 2, 3),
    material,
  );
  knot.position.set(cm(x), cm(y + 11), cm(z));
  knot.rotation.set(1.2, turn, 0);
  knot.castShadow = true;
  g.add(knot);
}

// Turntable and two wood speakers on a surface at `top`, local to `g`.
export function recordPlayer(
  g: THREE.Object3D,
  teak: THREE.Material,
  black: THREE.Material,
  vinyl: THREE.Material,
  chrome: THREE.Material,
  x: number,
  top: number,
  z: number,
) {
  B(g, teak, x, top, z, 42, 9, 34);
  Cyl(g, black, x - 4, top + 9, z, 14.5, 1);
  Cyl(g, vinyl, x - 4, top + 10, z, 14.8, 0.4);
  Cyl(g, chrome, x - 4, top + 10.4, z, 1, 1);
  const arm = B(g, chrome, x + 12, top + 10.5, z - 2, 1, 1, 22);
  arm.rotation.y = 0.35;
  [x - 34, x + 34].forEach((sx) => {
    B(g, teak, sx, top, z - 4, 18, 28, 20);
    Cyl(g, black, sx, top + 9, z + 6.2, 5.5, 0.6, "z");
    Cyl(g, black, sx, top + 21, z + 6.2, 2.5, 0.6, "z");
  });
}
