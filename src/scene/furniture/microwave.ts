import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl } from "./primitives";

const WIDTH = 46;
const HEIGHT = 26;
const DEPTH = 36;

// White countertop microwave, about 20 L, standing at height `y` and facing north.
export function microwave(
  g: THREE.Object3D,
  M: Materials,
  x: number,
  y: number,
  z: number,
) {
  const front = z - DEPTH / 2;
  [-18, 18].forEach((dx) =>
    [-14, 14].forEach((dz) => Cyl(g, M.black, x + dx, y, z + dz, 1.4, 1)),
  );
  B(g, M.white, x, y + 1, z, WIDTH, HEIGHT - 1, DEPTH);
  B(g, M.white, x + 5.5, y + 2, front - 0.6, 33, HEIGHT - 3, 1.2);
  B(g, M.screen, x + 7, y + 5.5, front - 1.3, 23, 16, 0.3);
  B(g, M.inoxDark, x - 8.6, y + 5, front - 2, 1.4, 17, 1.6);
  B(g, M.black, x - 16.5, y + 19, front - 0.2, 9, 3.4, 0.4);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++)
      B(
        g,
        M.inoxDark,
        x - 19.4 + col * 2.9,
        y + 8.5 + row * 3,
        front - 0.2,
        2,
        1.6,
        0.3,
      );
}
