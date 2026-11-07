import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Cyl, cm } from "../furniture/primitives";
import type { DecorKit } from "./kit";

export type PlantKind = "tree" | "snake" | "bush" | "trailing" | "hanging";

export const GREENS = ["#3f6d3a", "#4f8044", "#2f5a33", "#5e8f4d"];
const ROWS = 6;

function seededRandom(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

export interface Leaf {
  at: [number, number, number];
  yaw: number;
  pitch: number;
  length: number;
  width: number;
  droop: number;
  color: string;
}

export function leafGeometry({ at, yaw, pitch, length, width, droop, color }: Leaf) {
  const positions: number[] = [];
  const colors: number[] = [];
  const index: number[] = [];
  const green = new THREE.Color(color);
  for (let r = 0; r < ROWS; r++) {
    const t = r / (ROWS - 1);
    const half = (width / 2) * Math.sin(Math.PI * Math.pow(t, 0.75));
    const y = -droop * length * t * t;
    const z = length * t * (1 - 0.18 * droop * t);
    positions.push(-half, y + half * 0.3, z, 0, y, z, half, y + half * 0.3, z);
    const shade = 0.72 + 0.4 * t;
    for (let side = 0; side < 3; side++) {
      const rib = side === 1 ? 1.18 : 1;
      colors.push(
        green.r * shade * rib,
        green.g * shade * rib,
        green.b * shade * rib,
      );
    }
    if (r) {
      const s = r * 3;
      for (let c = 0; c < 2; c++) {
        index.push(s - 3 + c, s + c, s - 2 + c, s - 2 + c, s + c, s + 1 + c);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(index);
  geometry.scale(0.01, 0.01, 0.01);
  geometry.applyMatrix4(
    new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(-pitch, yaw, 0, "YXZ"),
    ),
  );
  geometry.translate(cm(at[0]), cm(at[1]), cm(at[2]));
  geometry.computeVertexNormals();
  return geometry;
}

function foliage(
  kind: PlantKind,
  top: number,
  radius: number,
  drop: number,
  random: () => number,
) {
  const leaves: Leaf[] = [];
  const color = () => GREENS[Math.floor(random() * GREENS.length)];
  if (kind === "tree") {
    for (let i = 0; i < 62; i++) {
      const t = i / 61;
      leaves.push({
        at: [(random() - 0.5) * 6, top + 40 + t * 92, (random() - 0.5) * 6],
        yaw: i * 2.4,
        pitch: 0.75 - t * 0.5 + random() * 0.4,
        length: 26 - t * 8 + random() * 6,
        width: 12 - t * 3,
        droop: 0.42,
        color: color(),
      });
    }
  } else if (kind === "snake") {
    for (let i = 0; i < 16; i++) {
      leaves.push({
        at: [(random() - 0.5) * 12, top, (random() - 0.5) * 12],
        yaw: random() * 6.3,
        pitch: 1.36 + random() * 0.16,
        length: 58 + random() * 42,
        width: 6.5,
        droop: 0.03,
        color: i % 2 ? "#44683a" : "#5f7f45",
      });
    }
  } else if (kind === "bush") {
    for (let i = 0; i < 34; i++) {
      leaves.push({
        at: [(random() - 0.5) * 7, top + random() * 5, (random() - 0.5) * 7],
        yaw: i * 2.4,
        pitch: 0.25 + random() * 0.95,
        length: 12 + random() * 8,
        width: 6.5,
        droop: 0.4,
        color: color(),
      });
    }
  } else {
    // "trailing" falls on the +z side, over an edge; "hanging" falls all around the pot.
    const around = kind === "hanging";
    const vines = around ? 11 : 8;
    for (let vine = 0; vine < vines; vine++) {
      const angle = (vine / vines) * Math.PI * 2 + random() * 0.4;
      const x = around
        ? Math.sin(angle) * (radius + 1)
        : (vine - 3.5) * (radius / 2.4) + random() * 2;
      const z = around ? Math.cos(angle) * (radius + 1) : radius + random() * 3;
      const length = drop * (0.55 + random() * 0.6);
      for (let y = 0; y < length; y += 3.6) {
        const sway = Math.sin(y * 0.28 + vine) * 2;
        leaves.push({
          at: [x + sway, top - y, z],
          yaw: (around ? angle : 0) + (random() - 0.5) * 2.2,
          pitch: -0.2 - random() * 0.5,
          length: 8,
          width: 6,
          droop: 0.3,
          color: color(),
        });
      }
    }
    for (let i = 0; i < 18; i++) {
      leaves.push({
        at: [(random() - 0.5) * radius, top + 1, (random() - 0.5) * radius],
        yaw: random() * 6.3,
        pitch: 0.2 + random() * 0.5,
        length: 9,
        width: 6.5,
        droop: 0.3,
        color: color(),
      });
    }
  }
  return leaves;
}

// x, y and z are the base of the pot, in cm.
export function pottedPlant(
  parent: THREE.Object3D,
  kit: DecorKit,
  kind: PlantKind,
  [x, y, z]: [number, number, number],
  {
    radius = 13,
    height = 30,
    seed = 7,
    pot = kit.terracotta,
    turn = 0,
    drop = 40,
  } = {},
) {
  const g = new THREE.Group();
  g.position.set(cm(x), cm(y), cm(z));
  g.rotation.y = turn;
  const points = [
    [0.7, 0],
    [0.86, 0.1],
    [1, 0.98],
    [1.06, 1],
    [1.06, 1.06],
    [0.92, 1.06],
    [0.92, 0.9],
  ].map(([r, h]) => new THREE.Vector2(cm(radius * r), cm(height * h)));
  const potMesh = new THREE.Mesh(new THREE.LatheGeometry(points, 20), pot);
  potMesh.castShadow = potMesh.receiveShadow = true;
  g.add(potMesh);
  Cyl(g, kit.soil, 0, height * 0.88, 0, radius * 0.92, 1);
  if (kind === "tree") Cyl(g, kit.darkWood, 0, height, 0, 1.3, 128);

  const random = seededRandom(seed * 7919);
  const leaves = foliage(kind, height * 0.92, radius, drop, random);
  const mesh = new THREE.Mesh(
    mergeGeometries(leaves.map(leafGeometry)),
    kit.leaf,
  );
  mesh.castShadow = true;
  g.add(mesh);
  parent.add(g);
  return g;
}

function cord(
  g: THREE.Object3D,
  kit: DecorKit,
  from: THREE.Vector3,
  to: THREE.Vector3,
) {
  const path = to.clone().sub(from);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(cm(0.22), cm(0.22), path.length(), 6),
    kit.cord,
  );
  mesh.position.copy(from).addScaledVector(path, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    path.normalize(),
  );
  g.add(mesh);
}

// A pot hung from the ceiling by three cords. x and z in plan cm, potBase above the floor.
export function hangingPlant(
  parent: THREE.Object3D,
  kit: DecorKit,
  kind: PlantKind,
  x: number,
  z: number,
  potBase: number,
  ceil: number,
  { seed = 31, drop = 46, radius = 9, height = 13 } = {},
) {
  const g = pottedPlant(parent, kit, kind, [x, potBase, z], {
    radius,
    height,
    seed,
    drop,
    pot: kit.clay,
  });
  const knot = new THREE.Vector3(0, cm(height + 26), 0);
  [0, 2.09, 4.19].forEach((angle) => {
    const rim = new THREE.Vector3(
      Math.sin(angle) * cm(radius),
      cm(height),
      Math.cos(angle) * cm(radius),
    );
    cord(g, kit, rim, knot);
  });
  cord(g, kit, knot, new THREE.Vector3(0, cm(ceil - potBase), 0));
  return g;
}
