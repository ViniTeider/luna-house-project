import * as THREE from "three";
import type { Materials } from "../materials";
import { B, R } from "./primitives";

// Sofa facing north, toward the TV
export function sofa(g: THREE.Group, M: Materials) {
  const W = 218,
    D = 105;
  [
    [-100, -44],
    [100, -44],
    [-100, 44],
    [100, 44],
  ].forEach(([x, z]) => B(g, M.wood, x, 0, z, 5, 12, 5));
  R(g, M.sofa, 0, 12, 0, W, 16, D, 3);
  R(g, M.sofa, -W / 2 + 12, 22, 0, 24, 40, D, 7);
  R(g, M.sofa, W / 2 - 12, 22, 0, 24, 40, D, 7);
  R(g, M.sofa, 0, 26, D / 2 - 12, W - 46, 56, 24, 8);
  const seatW = (W - 50) / 3;
  [-1, 0, 1].forEach((i) => {
    R(g, M.sofa, i * seatW, 28, -11, seatW - 1.5, 15, 78, 5);
    const back = R(g, M.sofa, i * seatW, 43, 24, seatW - 3, 38, 16, 6);
    back.rotation.x = -0.13;
  });
}
