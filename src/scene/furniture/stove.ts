import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl, cm } from "./primitives";

const HOOD_DUCT_BASE = 184;

// Faces north, toward the living room.
export function stove(g: THREE.Group, M: Materials) {
  B(g, M.white, 0, 6, 0, 62, 82, 67);
  [
    [-27, -29],
    [27, -29],
    [-27, 29],
    [27, 29],
  ].forEach(([x, z]) => B(g, M.black, x, 0, z, 4, 6, 4));
  B(g, M.black, 0, 88, 0, 60, 1, 64);
  [
    [-15, -15],
    [15, -15],
    [-15, 15],
    [15, 15],
  ].forEach(([x, z]) => {
    Cyl(g, M.inoxDark, x, 89, z, 7, 1);
    Cyl(g, M.black, x, 90, z, 4.5, 1);
    B(g, M.black, x, 91, z, 20, 1, 1.4);
    B(g, M.black, x, 91, z, 1.4, 1, 20);
  });
  B(g, M.screen, 0, 18, -33.8, 50, 42, 0.6);
  B(g, M.inox, 0, 62, -35, 52, 2, 2);
  B(g, M.white, 0, 68, -33.8, 60, 18, 0.5);
  [-22, -11, 0, 11, 22].forEach((x) =>
    Cyl(g, M.black, x, 77, -34.8, 2, 2.4, "z"),
  );
  // 60 cm wall hood, 75 cm above the cooktop. The duct follows the ceiling height.
  const hood = new THREE.Group();
  hood.userData.overhead = true;
  g.add(hood);
  B(hood, M.inox, 0, 165, 8.5, 60, 5, 50);
  B(hood, M.black, 0, 164.6, 8.5, 52, 0.4, 42);
  B(hood, M.inox, 0, 170, 18.5, 34, 14, 30);
  const duct = B(hood, M.inox, 0, HOOD_DUCT_BASE, 23.5, 26, 100, 20);
  duct.userData.hoodDuct = true;
}

export function fitHoodDuct(group: THREE.Object3D, ceiling: number) {
  group.traverse((o) => {
    if (!o.userData.hoodDuct) return;
    const h = ceiling - HOOD_DUCT_BASE;
    o.scale.y = h / 100;
    o.position.y = cm(HOOD_DUCT_BASE + h / 2);
  });
}
