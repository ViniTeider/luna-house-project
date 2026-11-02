import * as THREE from "three";
import type { Materials } from "../materials";
import { B, R } from "./primitives";

// The builder's charcoal grill, in the niche at the end of the balcony.
export function buildGrill(M: Materials, wallH: number) {
  const g = new THREE.Group();
  B(g, M.brick, 446.5, 0, 322.5, 65, 72, 61);
  B(g, M.charcoal, 446.5, 72, 322.5, 58, 4, 54);
  for (let i = 0; i < 26; i++) {
    const x = 422 + (i % 7) * 8,
      z = 300 + Math.floor(i / 7) * 13;
    R(g, M.charcoal, x, 76, z, 6, 3, 8, 1.2);
  }
  for (let x = 420; x <= 473; x += 4.5)
    B(g, M.inox, x, 85, 322.5, 0.7, 0.7, 54);
  [298, 347].forEach((z) => B(g, M.inox, 446.5, 84.3, z, 58, 0.7, 0.7));
  const liningH = Math.min(110, wallH - 72);
  B(g, M.brick, 417.5, 72, 322.5, 7, liningH, 61);
  B(g, M.brick, 475.5, 72, 322.5, 7, liningH, 61);
  B(g, M.brick, 446.5, 72, 350, 65, liningH, 6);
  // Chimney
  if (wallH > 130)
    B(g, M.frame, 446.5, 130, 340, 46, Math.min(60, wallH - 130), 26);
  return g;
}
