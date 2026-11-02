import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl } from "./primitives";

// Faces north, toward the living room.
export function sink(g: THREE.Group, M: Materials) {
  B(g, M.black, 0, 0, 0, 136, 10, 62);
  // Slim built-in dishwasher: 45 cm, next to the fridge
  B(g, M.inox, -45.5, 10, -0.5, 45, 75, 63);
  B(g, M.black, -45.5, 76, -32.3, 45, 8, 0.6);
  B(g, M.inoxDark, -45.5, 68, -33.5, 34, 2, 2);
  // Sink cabinet: 91 cm
  B(g, M.main, 22.5, 10, 0, 91, 76, 66);
  B(g, M.wood, 0, 10, -33.2, 0.5, 76, 0.5);
  [0, 46].forEach((x) => B(g, M.wood, x + 0.5, 12, -33.3, 44, 72, 0.6));
  // Countertop with a cutout for the basin
  const top = (x0: number, x1: number, z0: number, z1: number) =>
    B(g, M.granite, (x0 + x1) / 2, 86, (z0 + z1) / 2, x1 - x0, 4, z1 - z0);
  top(-68, -18, -33, 33);
  top(42, 68, -33, 33);
  top(-18, 42, -33, -25);
  top(-18, 42, 15, 33);
  B(g, M.inox, 12, 72, -5, 60, 1, 40);
  B(g, M.inox, -17.5, 72, -5, 1, 17, 40);
  B(g, M.inox, 41.5, 72, -5, 1, 17, 40);
  B(g, M.inox, 12, 72, -24.5, 60, 17, 1);
  B(g, M.inox, 12, 72, 14.5, 60, 17, 1);
  Cyl(g, M.inox, 12, 90, 22, 1.2, 24);
  Cyl(g, M.inox, 12, 113, 12, 1, 20, "z");
}
