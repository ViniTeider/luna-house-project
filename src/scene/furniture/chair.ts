import * as THREE from "three";
import type { Materials } from "../materials";
import { B, Cyl, R, cm } from "./primitives";

// Black and green gaming chair facing west, toward the desk
export function chair(g: THREE.Group, M: Materials) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = B(g, M.black, Math.cos(a) * 16, 6, Math.sin(a) * 16, 32, 3, 5);
    leg.rotation.y = -a;
    const wheel = new THREE.Mesh(
      new THREE.SphereGeometry(cm(3.2), 12, 10),
      M.blackSoft,
    );
    wheel.position.set(cm(Math.cos(a) * 30), cm(3.2), cm(Math.sin(a) * 30));
    wheel.castShadow = true;
    g.add(wheel);
  }
  Cyl(g, M.inoxDark, 0, 8, 0, 2.5, 34);
  R(g, M.blackSoft, -2, 40, 0, 50, 10, 50, 4);
  [-16, 16].forEach((z) => R(g, M.green, -2, 49.5, z, 44, 1.5, 7, 0.7));
  const back = new THREE.Group();
  back.position.set(cm(23), cm(48), 0);
  back.rotation.z = 0.12;
  g.add(back);
  R(back, M.blackSoft, 0, 0, 0, 10, 76, 54, 4);
  R(back, M.green, -4.2, 8, 0, 3, 55, 16, 1.4);
  [-24, 24].forEach((z) => R(back, M.blackSoft, -3, 20, z, 8, 56, 8, 3));
  R(back, M.blackSoft, -5, 66, 0, 8, 13, 20, 3);
  [-29, 29].forEach((z) => {
    B(g, M.black, 2, 45, z, 4, 20, 4);
    R(g, M.blackSoft, -1, 65, z, 26, 3.5, 8, 1.4);
  });
}
