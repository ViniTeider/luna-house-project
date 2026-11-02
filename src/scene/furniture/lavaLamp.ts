import * as THREE from "three";
import type { Materials } from "../materials";
import { cm } from "./primitives";

const noPicking = () => {};

function turned(
  g: THREE.Object3D,
  mat: THREE.Material,
  profile: number[][],
  [x, y, z]: number[],
) {
  const points = profile.map(([r, h]) => new THREE.Vector2(cm(r), cm(h)));
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 28), mat);
  mesh.position.set(cm(x), cm(y), cm(z));
  g.add(mesh);
  return mesh;
}

function glow(
  g: THREE.Object3D,
  mat: THREE.Material,
  [x, y, z]: number[],
  width: number,
  height: number,
  flat: boolean,
) {
  const geometry = new THREE.PlaneGeometry(cm(width), cm(height));
  if (flat) geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(cm(x), cm(y), cm(z));
  mesh.raycast = noPicking;
  mesh.renderOrder = 2;
  g.add(mesh);
}

// 37 cm lava lamp standing on a surface at height `y`, in the item's local space.
// `wallZ` is where the wall behind it stands, for the pink light spilling on it.
export function lavaLamp(
  g: THREE.Object3D,
  M: Materials,
  x: number,
  y: number,
  z: number,
  wallZ: number,
) {
  const at = [x, y, z];
  turned(
    g,
    M.inoxDark,
    [
      [0, 0],
      [7, 0],
      [7, 1],
      [4.8, 11],
    ],
    at,
  ).castShadow = true;
  turned(
    g,
    M.lavaGlass,
    [
      [4.7, 11],
      [4.2, 18],
      [3.2, 26],
      [2.6, 31],
    ],
    at,
  );
  turned(
    g,
    M.inoxDark,
    [
      [2.7, 31],
      [1.9, 36.5],
      [1.5, 37],
      [0, 37],
    ],
    at,
  );

  const light = new THREE.Group();
  light.userData.overhead = true;
  g.add(light);
  glow(light, M.lavaGlow, [x, y + 28, wallZ + 0.6], 86, 96, false);
  glow(light, M.lavaGlow, [x, y + 0.3, z + 4], 74, 40, true);
}
