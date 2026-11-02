import * as THREE from "three";
import type { Materials } from "../materials";
import { B, R, cm, shadow } from "./primitives";
import type { Mat } from "./primitives";

// Slab with corners rounded from above and a softened edge.
function roundedSlab(
  parent: THREE.Object3D,
  mat: Mat,
  cx: number,
  by: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  r: number,
  edge: number,
) {
  const hw = cm(w) / 2,
    hd = cm(d) / 2,
    rad = cm(r),
    e = cm(edge);
  const inner = (v: number) => v - e;
  const shape = new THREE.Shape();
  shape.moveTo(-inner(hw) + rad, -inner(hd));
  shape.lineTo(inner(hw) - rad, -inner(hd));
  shape.quadraticCurveTo(inner(hw), -inner(hd), inner(hw), -inner(hd) + rad);
  shape.lineTo(inner(hw), inner(hd) - rad);
  shape.quadraticCurveTo(inner(hw), inner(hd), inner(hw) - rad, inner(hd));
  shape.lineTo(-inner(hw) + rad, inner(hd));
  shape.quadraticCurveTo(-inner(hw), inner(hd), -inner(hw), inner(hd) - rad);
  shape.lineTo(-inner(hw), -inner(hd) + rad);
  shape.quadraticCurveTo(-inner(hw), -inner(hd), -inner(hw) + rad, -inner(hd));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: cm(h) - 2 * e,
    bevelEnabled: true,
    bevelThickness: e,
    bevelSize: e,
    bevelSegments: 4,
    curveSegments: 12,
  });
  geo.rotateX(-Math.PI / 2);
  const mesh = shadow(new THREE.Mesh(geo, mat));
  mesh.position.set(cm(cx), cm(by) + e, cm(cz));
  parent.add(mesh);
  return mesh;
}

// 90 cm island. The top overhangs 25 cm to the north so the stools fit underneath.
export function island(g: THREE.Group, M: Materials) {
  B(g, M.main, 0, 0, 11.5, 186, 86, 33);
  [-62, 0, 62].forEach((x) => B(g, M.wood, x, 8, 28.3, 60, 74, 1));
  roundedSlab(g, M.granite, 0, 86, 0, 200, 4, 60, 5, 1);
  [-95, 95].forEach((x) => R(g, M.wood, x, 0, -6, 4, 86.5, 46, 1.5));
}
