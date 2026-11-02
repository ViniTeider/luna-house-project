import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl, cm } from "./primitives";

// 65 cm stool, proportional to the island
export function stool(g: THREE.Group, M: Materials) {
  Cyl(g, M.wood, 0, 61, 0, 18, 4);
  [
    [-13, -13],
    [13, -13],
    [-13, 13],
    [13, 13],
  ].forEach(([x, z]) => {
    const leg = B(g, M.black, x, 0, z, 2.4, 62, 2.4);
    leg.rotation.set(z > 0 ? 0.05 : -0.05, 0, x > 0 ? -0.05 : 0.05);
  });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(cm(17), cm(0.8), 8, 32),
    M.black,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = cm(22);
  g.add(ring);
}
