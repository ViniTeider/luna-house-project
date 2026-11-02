import * as THREE from "three";
import type { Materials } from "../materials";
import { microwave } from "./microwave";
import { B } from "./primitives";

// Fixed kitchen parts, in plan coordinates.
export function buildKitchen(M: Materials, withUppers: boolean) {
  const g = new THREE.Group();
  // Countertop: filler next to the fridge and the corner in front of the shaft
  B(g, M.main, 6, 0, 320, 12, 86, 66);
  B(g, M.granite, 6, 86, 320, 12, 4, 66);
  B(g, M.main, 369.5, 0, 309.5, 59, 86, 45);
  B(g, M.wood, 369.5, 12, 286.7, 57, 72, 0.6);
  B(g, M.granite, 369.5, 86, 309.5, 59, 4, 45);
  microwave(g, M, 369.5, 90, 311);
  if (!withUppers) return g;

  // Upper cabinets: 70 cm tall, from 1.50 to 2.20 m, 35 cm deep
  const bottom = 150,
    height = 70,
    depth = 35;
  const run = (x0: number, x1: number, back: number, doors: number) => {
    const front = back - depth,
      w = x1 - x0,
      dw = w / doors;
    B(g, M.main, (x0 + x1) / 2, bottom, back - depth / 2, w, height, depth);
    for (let i = 0; i < doors; i++) {
      const cx = x0 + dw * (i + 0.5);
      B(g, M.main, cx, bottom + 1, front - 0.6, dw - 0.8, height - 2, 1.2);
      B(
        g,
        M.wood,
        cx + (i % 2 ? -dw / 2 + 3 : dw / 2 - 3),
        bottom + 4,
        front - 1.5,
        1.5,
        24,
        1.2,
      );
    }
  };
  run(82, 218, 353, 3); // between the fridge and the hood
  run(280, 340, 353, 2); // between the hood and the shaft
  run(340, 399, 332, 2); // in front of the shaft
  return g;
}
