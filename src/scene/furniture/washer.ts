import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl } from "./primitives";

// Faces north, toward the living room.
export function washer(g: THREE.Group, M: Materials) {
  B(g, M.white, 0, 2, 0, 60, 83, 60);
  B(g, M.black, 0, 0, 0, 54, 2, 54);
  B(g, M.frame, 14, 73, -30.3, 24, 7, 0.5);
  B(g, M.ceramic, -18, 74, -30.3, 16, 6, 0.5);
  Cyl(g, M.inoxDark, 0, 40, -30.5, 19, 1.6, "z");
  Cyl(g, M.screen, 0, 40, -31, 15.5, 1.6, "z");
}
