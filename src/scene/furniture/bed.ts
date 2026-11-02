import * as THREE from "three";
import type { Materials } from "../materials";
import { B, R } from "./primitives";

// Double bed with the headboard to the north
export function bed(g: THREE.Group, M: Materials) {
  B(g, M.main, 0, 6, 0, 138, 24, 188);
  B(g, M.black, 0, 0, 0, 126, 6, 176);
  R(g, M.ceramic, 0, 30, 0, 136, 24, 186, 5);
  R(g, M.duvet, 0, 50, 34, 140, 6, 118, 3);
  B(g, M.wood, 0, 56, 72, 138, 1.5, 36);
  [-34, 34].forEach((x) => R(g, M.fabricLight, x, 54, -68, 62, 14, 42, 6));
  [-34, 34].forEach((x) => {
    const p = R(g, M.duvet, x, 58, -76, 56, 30, 12, 5);
    p.rotation.x = -0.12;
  });
}
