import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl, R } from "./primitives";

const WIDTH = 28;
const HEIGHT = 33;
const DEPTH = 30;

// Black air fryer with a pull-out basket, standing at height `y` and facing north.
export function airFryer(
  g: THREE.Object3D,
  M: Materials,
  x: number,
  y: number,
  z: number,
) {
  const front = z - DEPTH / 2;
  [-10, 10].forEach((dx) =>
    [-10, 10].forEach((dz) => Cyl(g, M.frame, x + dx, y, z + dz, 1.2, 1)),
  );
  R(g, M.black, x, y + 1, z, WIDTH, HEIGHT - 1, DEPTH, 4);
  // Basket with its handle, separated from the body by a thin gap
  R(g, M.frame, x, y + 3, front - 0.6, WIDTH - 4, 19, 1.6, 0.7);
  B(g, M.inoxDark, x, y + 22.6, front - 0.1, WIDTH - 6, 0.3, 0.3);
  B(g, M.inoxDark, x, y + 9, front - 3.4, 11, 4, 3);
  // Touch panel on the sloped top of the front
  B(g, M.screen, x, y + 25.5, front - 0.1, 13, 4.5, 0.3);
  Cyl(g, M.inoxDark, x, y + 27.8, front - 0.3, 0.9, 0.2, "z");
}
