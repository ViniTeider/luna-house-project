import * as THREE from "three";
import type { Materials } from "../materials";
import { lavaLamp } from "./lavaLamp";
import { B } from "./primitives";

// TV unit against the north wall, with the TV mounted above it.
export function rack(g: THREE.Group, M: Materials) {
  B(g, M.main, 0, 12, 0, 228, 33, 36);
  [-76, 0, 76].forEach((x) => B(g, M.wood, x, 14, 18.3, 74, 29, 1));
  [-38, 38].forEach((x) => B(g, M.main, x, 14, 18.6, 1, 29, 1));
  [
    [-108, -14],
    [108, -14],
    [-108, 14],
    [108, 14],
  ].forEach(([x, z]) => B(g, M.black, x, 0, z, 3, 12, 3));
  // 55" TV mounted on the wall without feet: 122.6 × 71 × 6 cm, with a 2 cm bracket behind it.
  const tvBottom = 85,
    tvZ = -13;
  B(g, M.black, 0, tvBottom + 25, -17, 30, 20, 2);
  B(g, M.black, 0, tvBottom, tvZ, 122.6, 71, 6);
  const tv = B(g, M.screen, 0, tvBottom + 1, tvZ + 3.2, 120.6, 69, 0.4);
  tv.castShadow = false;
  lavaLamp(g, M, -96, 45, 0, -18);
}
