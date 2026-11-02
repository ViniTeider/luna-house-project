import * as THREE from "three";
import type { Materials } from "../materials";
import { B, cm } from "./primitives";

export function desk(g: THREE.Group, M: Materials) {
  B(g, M.wood, 0, 72, 0, 52, 3, 170);
  [
    [-22, -80],
    [-22, 80],
    [22, -80],
    [22, 80],
  ].forEach(([x, z]) => B(g, M.black, x, 0, z, 4, 72, 4));
  // 70 cm monitor facing east
  B(g, M.black, -17, 75, 0, 16, 1, 22);
  B(g, M.black, -17, 76, 0, 3, 14, 5);
  B(g, M.black, -14, 86, 0, 2.5, 40, 70);
  const panel = B(g, M.screen, -12.5, 87, 0, 0.3, 38, 68);
  panel.castShadow = false;
  // White F75 keyboard, 30 × 13 cm, Figma measurement
  const kbZ = 9.5,
    kbX = 7;
  B(g, M.white, kbX, 75, kbZ, 13, 2, 30);
  const key = new THREE.BoxGeometry(cm(1.65), cm(0.8), cm(1.65));
  const keys = new THREE.InstancedMesh(key, M.ceramic, 6 * 15);
  const m = new THREE.Matrix4();
  let n = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 15; c++) {
      m.setPosition(
        cm(kbX - 5.2 + r * 2.08),
        cm(77.4),
        cm(kbZ - 13.6 + c * 1.94),
      );
      keys.setMatrixAt(n++, m);
    }
  }
  keys.castShadow = true;
  g.add(keys);
  // White wireless Redragon mouse
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), M.white);
  mouse.scale.set(cm(10.4), cm(3.8 * 1.5), cm(7.1));
  mouse.position.set(cm(kbX), cm(75.6), cm(-19.5));
  mouse.castShadow = true;
  g.add(mouse);
}
