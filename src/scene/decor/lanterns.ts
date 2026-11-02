import * as THREE from "three";
import { Cyl, cm } from "../furniture/primitives";
import type { DecorKit } from "./kit";

// Pleated washi paper lantern. `center` and `radius` are in cm, in local item space.
function lantern(
  g: THREE.Object3D,
  kit: DecorKit,
  x: number,
  center: number,
  radius: number,
  ceiling: number,
) {
  const height = radius * 1.7;
  const rings = 28;
  const profile = Array.from({ length: rings + 1 }, (_, i) => {
    const angle = 0.2 + (i / rings) * (Math.PI - 0.4);
    const pleat = 1 + 0.018 * Math.cos(i * Math.PI);
    return new THREE.Vector2(
      cm(radius * Math.sin(angle) * pleat),
      cm((height / 2) * Math.cos(angle)),
    );
  });
  const paper = new THREE.Mesh(new THREE.LatheGeometry(profile, 24), kit.paper);
  paper.position.set(cm(x), cm(center), 0);
  g.add(paper);

  const top = center + (height / 2) * Math.cos(0.2);
  const bottom = center - (height / 2) * Math.cos(0.2);
  const cap = radius * Math.sin(0.2) + 0.8;
  Cyl(g, kit.darkWood, x, top - 0.5, 0, cap, 2);
  Cyl(g, kit.darkWood, x, bottom - 1.5, 0, cap, 2);
  Cyl(g, kit.cord, x, top + 1, 0, 0.3, ceiling - top - 1);
  Cyl(g, kit.darkWood, x, ceiling - 2, 0, 5, 2);
}

// Three lanterns in a row, with the bottoms 80 to 90 cm above the top of the island, the
// usual range for pendants. They belong to the island, so they follow it around.
export function islandLanterns(g: THREE.Object3D, kit: DecorKit, ceil: number) {
  const hanging = new THREE.Group();
  hanging.userData.overhead = true;
  lantern(hanging, kit, -66, 183, 15, ceil);
  lantern(hanging, kit, 0, 195, 19, ceil);
  lantern(hanging, kit, 66, 183, 15, ceil);
  const light = new THREE.PointLight("#ffb46e", 0, 5, 1.8);
  light.position.set(0, 1.7, 0);
  light.userData.lantern = true;
  hanging.add(light);
  g.add(hanging);
}

// Andon floor lamp: a paper column in a dark wood frame. Base center in plan cm.
export function andonLamp(
  g: THREE.Object3D,
  kit: DecorKit,
  x: number,
  z: number,
) {
  const size = 26,
    height = 92,
    foot = 8;
  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(cm(size - 2), cm(height), cm(size - 2)),
    kit.paper,
  );
  paper.position.set(cm(x), cm(foot + height / 2), cm(z));
  g.add(paper);
  for (const [dx, dz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const px = x + (dx * size) / 2,
      pz = z + (dz * size) / 2;
    Cyl(g, kit.darkWood, px, 0, pz, 1.1, foot + height + 2);
  }
}
