import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { B, Cyl, cm } from "../furniture/primitives";
import { PETALS } from "./blossomKit";
import { seededRandom } from "./canvas";
import { lathe, vase } from "./eclecticProps";
import type { DecorKit } from "./kit";
import { GREENS, leafGeometry } from "./plants";

type Point = [x: number, y: number, z: number];

const noPicking = () => {};
const UP = new THREE.Vector3(0, 1, 0);

interface Branching {
  length: number;
  radius: number;
  depth: number;
  // Highest point the twigs may reach, in cm
  maxH: number;
  // Horizontal direction the crown spreads toward
  lean: THREE.Vector3;
  seed: number;
}

// Branches in bloom with warm fairy lights tucked among the flowers. `base` is in
// the local cm of `g`.
function blossomBranches(
  g: THREE.Object3D,
  kit: DecorKit,
  wood: THREE.Material,
  petal: THREE.Material,
  base: THREE.Vector3,
  { length, radius, depth, maxH, lean, seed }: Branching,
) {
  const random = seededRandom(seed);
  const pieces: THREE.BufferGeometry[] = [];
  const blooms: THREE.Vector3[] = [];
  const jitter = (size: number) =>
    new THREE.Vector3(
      (random() - 0.5) * size,
      (random() - 0.5) * size,
      (random() - 0.5) * size,
    );

  const grow = (
    start: THREE.Vector3,
    dir: THREE.Vector3,
    len: number,
    r: number,
    level: number,
  ) => {
    let end = start.clone().addScaledVector(dir, len);
    // Near the ceiling the branch turns sideways
    if (end.y > maxH) {
      dir.y = Math.min(dir.y, 0.1);
      dir.normalize();
      end = start.clone().addScaledVector(dir, len);
      end.y = Math.min(end.y, maxH);
    }
    const span = end.clone().sub(start);
    const piece = new THREE.CylinderGeometry(
      cm(Math.max(0.3, r * 0.7)),
      cm(r),
      cm(span.length()),
      6,
    );
    piece.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(UP, span.clone().normalize()),
    );
    const mid = start.clone().add(end).multiplyScalar(0.5);
    piece.translate(cm(mid.x), cm(mid.y), cm(mid.z));
    pieces.push(piece);
    if (level <= 1)
      for (let i = 0; i < (level ? 4 : 8); i++)
        blooms.push(
          start
            .clone()
            .lerp(end, 0.3 + random() * 0.7)
            .add(jitter(9)),
        );
    if (!level) return;
    const children = level > 2 ? 2 : 3;
    for (let i = 0; i < children; i++) {
      const side = jitter(2).projectOnPlane(dir).normalize();
      const next = dir
        .clone()
        .addScaledVector(side, 0.55 + random() * 0.4)
        .addScaledVector(lean, 0.3)
        .addScaledVector(UP, 0.12)
        .normalize();
      grow(end, next, len * 0.76, r * 0.68, level - 1);
    }
  };
  grow(base, UP.clone(), length, radius, depth);

  const branches = new THREE.Mesh(mergeGeometries(pieces), wood);
  branches.castShadow = true;
  branches.raycast = noPicking;
  g.add(branches);

  const flowers = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(cm(1), 1),
    petal,
    blooms.length * 3,
  );
  const bulbs = new THREE.InstancedMesh(
    new THREE.SphereGeometry(cm(1.1), 8, 6),
    kit.bulb,
    Math.ceil(blooms.length / 3),
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const color = new THREE.Color();
  blooms.forEach((p, i) => {
    for (let k = 0; k < 3; k++) {
      const size = 1.2 + random() * 1.3;
      m.compose(
        p.clone().add(jitter(5)).multiplyScalar(0.01),
        q,
        new THREE.Vector3(size, size * 0.8, size),
      );
      flowers.setMatrixAt(i * 3 + k, m);
      flowers.setColorAt(
        i * 3 + k,
        color.set(PETALS[Math.floor(random() * PETALS.length)]),
      );
    }
    if (i % 3 === 0) {
      m.makeTranslation(p.clone().add(jitter(5)).multiplyScalar(0.01));
      bulbs.setMatrixAt(i / 3, m);
    }
  });
  flowers.castShadow = true;
  flowers.raycast = bulbs.raycast = noPicking;
  g.add(flowers, bulbs);
}

// Cherry blossom tree in a tall glazed pot, reaching up to `maxH`. Plan coordinates;
// `lean` is the plan direction [x, y] its crown spreads toward.
export function blossomTree(
  g: THREE.Object3D,
  kit: DecorKit,
  materials: { petal: THREE.Material; pot: THREE.Material },
  x: number,
  y: number,
  maxH: number,
  lean: [number, number],
  seed: number,
) {
  const tree = new THREE.Group();
  tree.position.set(cm(x), 0, cm(y));
  g.add(tree);
  lathe(
    tree,
    materials.pot,
    [
      [0, 0],
      [9, 0],
      [13, 8],
      [14, 26],
      [12, 34],
      [12.6, 36],
      [0, 34],
    ],
    [0, 0, 0],
  );
  blossomBranches(
    tree,
    kit,
    kit.darkWood,
    materials.petal,
    new THREE.Vector3(0, 34, 0),
    {
      length: 58,
      radius: 3.4,
      depth: 5,
      maxH,
      lean: new THREE.Vector3(lean[0], 0, lean[1]).normalize(),
      seed,
    },
  );
}

// A few flowering twigs in a bud vase standing at `at`.
export function blossomSprig(
  g: THREE.Object3D,
  kit: DecorKit,
  materials: { petal: THREE.Material; vase: THREE.Material },
  at: Point,
  seed: number,
) {
  vase(g, materials.vase, at, 4.5, 18);
  blossomBranches(
    g,
    kit,
    kit.darkWood,
    materials.petal,
    new THREE.Vector3(at[0], at[1] + 16, at[2]),
    {
      length: 14,
      radius: 0.6,
      depth: 2,
      maxH: at[1] + 60,
      lean: new THREE.Vector3(1, 0, 0),
      seed,
    },
  );
}

// Pothos vine pinned along a path of [x, height, y] plan points, 1–2 cm off the
// wall, leaves turned toward `facing` (0 = south, π/2 = east, π = north).
export function wallVine(
  g: THREE.Object3D,
  kit: DecorKit,
  stem: THREE.Material,
  path: Point[],
  facing: number,
  seed: number,
) {
  const random = seededRandom(seed);
  const curve = new THREE.CatmullRomCurve3(
    path.map(([x, h, y]) => new THREE.Vector3(x, h, y)),
  );
  const steps = Math.floor(curve.getLength() / 3.4);
  const leaves = Array.from({ length: steps }, (_, i) => {
    const p = curve.getPointAt((i + 0.5) / steps);
    return leafGeometry({
      at: [p.x, p.y, p.z],
      yaw: facing + (random() - 0.5) * 1.8,
      pitch: -0.5 + random() * 0.8,
      length: 7 + random() * 3,
      width: 6 + random() * 1.5,
      droop: 0.3,
      color: GREENS[Math.floor(random() * GREENS.length)],
    });
  });
  const mesh = new THREE.Mesh(mergeGeometries(leaves), kit.leaf);
  mesh.castShadow = true;
  mesh.raycast = noPicking;
  g.add(mesh);
  const scaled = new THREE.CatmullRomCurve3(
    curve.points.map((p) => p.clone().multiplyScalar(0.01)),
  );
  const wire = new THREE.Mesh(
    new THREE.TubeGeometry(scaled, steps, cm(0.25), 5),
    stem,
  );
  wire.raycast = noPicking;
  g.add(wire);
}

// Vine looped along a wall from a to b, with tails hanging from the low points.
export function vineSwags(
  g: THREE.Object3D,
  kit: DecorKit,
  stem: THREE.Material,
  a: Point,
  b: Point,
  swags: number,
  sag: number,
  tail: number,
  facing: number,
  seed: number,
) {
  const at = (t: number): Point => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t - sag * Math.abs(Math.sin(t * swags * Math.PI)),
    a[2] + (b[2] - a[2]) * t,
  ];
  const count = swags * 8;
  wallVine(
    g,
    kit,
    stem,
    Array.from({ length: count + 1 }, (_, i) => at(i / count)),
    facing,
    seed,
  );
  for (let i = 0; i < swags; i++) {
    const [x, h, y] = at((i + 0.5) / swags);
    const length = tail * (0.6 + ((i * 37) % 10) / 20);
    wallVine(
      g,
      kit,
      stem,
      [0, 0.33, 0.66, 1].map((t, k) => [
        x + (k % 2 ? 3 : -2),
        h - length * t,
        y,
      ]),
      facing,
      seed + i + 1,
    );
  }
}

// Round mirror in a woven rattan sunburst. Built facing +z, turned by `facing`.
export function rattanMirror(
  g: THREE.Object3D,
  rattan: THREE.Material,
  mirror: THREE.Material,
  [x, y, z]: Point,
  radius: number,
  facing: number,
) {
  const sun = new THREE.Group();
  sun.position.set(cm(x), cm(y), cm(z));
  sun.rotation.y = facing;
  g.add(sun);
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(cm(radius * 0.5), 40),
    mirror,
  );
  glass.position.z = cm(1.4);
  sun.add(glass);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(cm(radius * 0.52), cm(1.3), 8, 40),
    rattan,
  );
  ring.position.z = cm(1.4);
  ring.castShadow = true;
  sun.add(ring);
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2;
    const length = radius * (i % 2 ? 0.34 : 0.46);
    const ray = new THREE.Mesh(
      new THREE.BoxGeometry(cm(length), cm(1.2), cm(0.8)),
      rattan,
    );
    const r = radius * 0.54 + length / 2;
    ray.position.set(cm(Math.cos(angle) * r), cm(Math.sin(angle) * r), cm(0.8));
    ray.rotation.z = angle;
    ray.castShadow = true;
    sun.add(ray);
  }
}

// Photos clipped to a string of fairy lights, hung on a wall from a to b (plan
// [x, height, y]), photos turned toward `facing`.
export function photoString(
  g: THREE.Object3D,
  kit: DecorKit,
  clip: THREE.Material,
  photos: THREE.Material[],
  a: Point,
  b: Point,
  sag: number,
  count: number,
  facing: number,
  seed: number,
) {
  const random = seededRandom(seed);
  const at = (t: number) =>
    new THREE.Vector3(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - sag * Math.sin(t * Math.PI),
      a[2] + (b[2] - a[2]) * t,
    );
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 13 }, (_, i) => at(i / 12).multiplyScalar(0.01)),
  );
  const wire = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 40, cm(0.2), 5),
    kit.cord,
  );
  wire.raycast = noPicking;
  g.add(wire);
  const globe = new THREE.SphereGeometry(cm(1.1), 8, 6);
  for (let i = 0; i < count * 2 + 1; i++) {
    const p = at(i / (count * 2));
    const bulb = new THREE.Mesh(globe, kit.bulb);
    bulb.position.set(cm(p.x), cm(p.y - 1.5), cm(p.z));
    g.add(bulb);
  }
  for (let i = 0; i < count; i++) {
    const p = at((i + 0.5) / count);
    const photo = new THREE.Group();
    photo.position.set(cm(p.x), cm(p.y), cm(p.z));
    photo.rotation.set(0, facing, (random() - 0.5) * 0.25);
    g.add(photo);
    const print = new THREE.Mesh(
      new THREE.PlaneGeometry(cm(9), cm(11)),
      photos[i % photos.length],
    );
    print.position.set(0, cm(-6.5), cm(0.6));
    photo.add(print);
    B(photo, clip, 0, -2, 0.6, 1.2, 3, 0.8);
  }
}

// Three milk glass globes over the island, bottoms near 88 cm above it.
export function globePendants(
  g: THREE.Object3D,
  kit: DecorKit,
  glass: THREE.Material,
  brass: THREE.Material,
  ceil: number,
) {
  const hanging = new THREE.Group();
  hanging.userData.overhead = true;
  const center = 190;
  [-64, 0, 64].forEach((x) => {
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(cm(12), 24, 16),
      glass,
    );
    globe.position.set(cm(x), cm(center), 0);
    hanging.add(globe);
    Cyl(hanging, brass, x, center + 10.5, 0, 3.4, 3);
    Cyl(hanging, kit.cord, x, center + 13, 0, 0.3, ceil - center - 13);
    Cyl(hanging, brass, x, ceil - 2, 0, 5, 2);
  });
  const light = new THREE.PointLight("#ffc9a0", 0, 5, 1.8);
  light.position.set(0, cm(center - 10), 0);
  light.userData.lantern = true;
  hanging.add(light);
  g.add(hanging);
}

// Sitting teddy bear, about 32 cm tall, looking toward `turn` (0 = +z).
export function teddyBear(
  g: THREE.Object3D,
  fur: THREE.Material,
  muzzle: THREE.Material,
  [x, y, z]: Point,
  turn: number,
) {
  const bear = new THREE.Group();
  bear.position.set(cm(x), cm(y), cm(z));
  bear.rotation.y = turn;
  g.add(bear);
  const ball = (
    material: THREE.Material,
    r: number,
    [px, py, pz]: Point,
    [sx, sy, sz]: Point = [1, 1, 1],
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(cm(r), 18, 12),
      material,
    );
    mesh.position.set(cm(px), cm(py), cm(pz));
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    bear.add(mesh);
  };
  ball(fur, 9, [0, 9, 0], [1, 1.1, 0.85]);
  ball(fur, 7, [0, 24, 1]);
  [-1, 1].forEach((side) => {
    ball(fur, 2.6, [side * 5, 30, 0]);
    ball(fur, 3.2, [side * 9, 12, 3], [0.8, 1.5, 0.8]);
    ball(fur, 3.6, [side * 5, 3.4, 7], [0.9, 0.8, 1.4]);
  });
  ball(muzzle, 3, [0, 22.5, 7], [1, 0.8, 0.8]);
}
