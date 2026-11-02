import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl, R, cm } from "./primitives";

export function buildBath(M: Materials, wallH: number) {
  const g = new THREE.Group();
  // Close-coupled toilet on the west wall, near the shower
  B(g, M.ceramic, 9, 42, -130, 18, 36, 38);
  R(g, M.ceramic, 30, 0, -130, 42, 40, 34, 8);
  const seat = new THREE.Mesh(
    new THREE.CylinderGeometry(cm(18), cm(18), cm(2), 32),
    M.ceramic,
  );
  seat.scale.set(1.25, 1, 0.92);
  seat.position.set(cm(33), cm(41), cm(-130));
  seat.castShadow = true;
  g.add(seat);
  // Wall-hung vanity with a vessel basin and mirror
  B(g, M.main, 23, 40, -60, 46, 42, 60);
  B(g, M.wood, 46.4, 42, -74.5, 0.8, 38, 28);
  B(g, M.wood, 46.4, 42, -45.5, 0.8, 38, 28);
  B(g, M.top, 23, 82, -60, 46, 3, 60);
  Cyl(g, M.ceramic, 26, 85, -60, 15, 11);
  Cyl(g, M.inox, 7, 85, -60, 1.1, 22);
  Cyl(g, M.inox, 13, 106, -60, 0.9, 12, "x");
  if (wallH > 100)
    B(g, M.mirror, 0.8, 100, -60, 1.5, Math.min(85, wallH - 100), 58);
  // Shower: fixed glass, sliding glass and shower head
  const glassH = Math.min(190, wallH),
    tileH = Math.min(210, wallH);
  B(g, M.glass, 45, 0, -159, 46, glassH, 1).castShadow = false;
  B(g, M.glass, 94, 0, -160.5, 46, glassH, 1).castShadow = false;
  if (wallH > 192) {
    B(g, M.frame, 70, 190, -159.5, 96, 2.5, 3);
    // Shower head on the shaft wall, away from the window, as in the builder's image
    B(g, M.inox, 37.5, 205, -198.5, 30, 2.5, 2.5);
    Cyl(g, M.inox, 52, 202, -198.5, 11, 1.5);
  } else {
    Cyl(g, M.inoxDark, 70, 0.3, -198, 4, 0.2);
  }
  // North shower wall: the tile goes around the ventilation window (x 45 to 105, sill 160)
  B(g, M.tile, 33.5, 0, -237.3, 23, tileH, 1.2);
  B(g, M.tile, 111.5, 0, -237.3, 13, tileH, 1.2);
  B(g, M.tile, 75, 0, -237.3, 60, Math.min(160, tileH), 1.2);
  B(g, M.tile, 117.3, 0, -198.5, 1.2, tileH, 78);
  B(g, M.tile, 22.8, 0, -198.5, 1.2, tileH, 78);
  return g;
}
