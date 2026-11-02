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
  // LG UltraWide 29" monitor facing east, 69.8 × 41.1 × 20.9 cm with stand (owner's
  // measurement): 20.9 cm foot, 5 cm thick body, 67 × 28 cm visible screen
  B(g, M.black, -14.55, 75, 0, 20.9, 1, 22);
  B(g, M.black, -18, 76, 0, 3, 20, 5);
  B(g, M.black, -15, 84.9, 0, 5, 31.2, 69.8);
  const panel = B(g, M.screen, -12.5, 86.9, 0, 0.3, 28, 67);
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
