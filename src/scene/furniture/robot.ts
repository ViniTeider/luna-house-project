import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl } from "./primitives";

// Robot charging on its dock. The wall is to the east (+x). S40 sizes: 34 × 34 × 9.8 cm, dock 13 × 12 × 9.5 cm.
export function robot(g: THREE.Group, M: Materials) {
  B(g, M.white, 16.9, 0, 0, 12.1, 9.5, 13);
  B(g, M.inoxDark, 10.6, 1, 0, 0.5, 2, 8);
  Cyl(g, M.white, -6, 0.6, 0, 17, 7);
  Cyl(g, M.ceramic, -6, 7.6, 0, 16, 0.3);
  Cyl(g, M.white, 1, 7.9, 0, 4.5, 1.9);
  B(g, M.inoxDark, -22.4, 2, 0, 0.6, 3, 16);
}
