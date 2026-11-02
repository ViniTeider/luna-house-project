import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const cm = (v: number) => v / 100;

export function shadow<T extends THREE.Mesh>(mesh: T) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Rescales UVs to meters so the texture does not stretch with the size of the piece.
function scaleBoxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number) {
  const faces = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  const uv = geo.attributes.uv;
  faces.forEach(([u, v], face) => {
    for (let i = 0; i < 4; i++) {
      const n = face * 4 + i;
      uv.setXY(n, uv.getX(n) * cm(u), uv.getY(n) * cm(v));
    }
  });
}

// cx/cz: center; by: bottom. Everything in cm.
export type Mat = THREE.Material;

export function B(
  parent: THREE.Object3D,
  mat: Mat,
  cx: number,
  by: number,
  cz: number,
  w: number,
  h: number,
  d: number,
) {
  const geo = new THREE.BoxGeometry(cm(w), cm(h), cm(d));
  scaleBoxUV(geo, w, h, d);
  const mesh = shadow(new THREE.Mesh(geo, mat));
  mesh.position.set(cm(cx), cm(by + h / 2), cm(cz));
  parent.add(mesh);
  return mesh;
}

export function R(
  parent: THREE.Object3D,
  mat: Mat,
  cx: number,
  by: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  radius = 3,
) {
  const geo = new RoundedBoxGeometry(cm(w), cm(h), cm(d), 4, cm(radius));
  const mesh = shadow(new THREE.Mesh(geo, mat));
  mesh.position.set(cm(cx), cm(by + h / 2), cm(cz));
  parent.add(mesh);
  return mesh;
}

export function Cyl(
  parent: THREE.Object3D,
  mat: Mat,
  cx: number,
  by: number,
  cz: number,
  r: number,
  h: number,
  axis: "x" | "y" | "z" = "y",
) {
  const geo = new THREE.CylinderGeometry(cm(r), cm(r), cm(h), 24);
  const mesh = shadow(new THREE.Mesh(geo, mat));
  if (axis === "x") mesh.rotation.z = Math.PI / 2;
  if (axis === "z") mesh.rotation.x = Math.PI / 2;
  mesh.position.set(cm(cx), cm(by + (axis === "y" ? h / 2 : 0)), cm(cz));
  parent.add(mesh);
  return mesh;
}
