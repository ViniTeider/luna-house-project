import * as THREE from "three";
import { SURF_RUG } from "../materials";
import type { Materials } from "../materials";
import { cm } from "./primitives";

// Beside the bed, where you step down, clear of the bedroom door. Plan coordinates.
const CENTER_X = 195;
const CENTER_Y = -205;
const THICKNESS = 1.2;

// Pointed nose to the north and a rounded tail to the south, in meters.
function outline() {
  const { width, length } = SURF_RUG;
  const w = width / 2,
    l = length / 2;
  const shape = new THREE.Shape();
  shape.moveTo(0, l);
  shape.bezierCurveTo(w * 0.55, l * 0.72, w, l * 0.34, w, -l * 0.05);
  shape.bezierCurveTo(w, -l * 0.5, w * 0.72, -l, 0, -l);
  shape.bezierCurveTo(-w * 0.72, -l, -w, -l * 0.5, -w, -l * 0.05);
  shape.bezierCurveTo(-w, l * 0.34, -w * 0.55, l * 0.72, 0, l);
  return shape;
}

export function buildSurfRug(M: Materials) {
  const geometry = new THREE.ExtrudeGeometry(outline(), {
    depth: cm(THICKNESS),
    bevelEnabled: false,
    curveSegments: 28,
  });
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, [M.surfRug, M.surfRugEdge]);
  mesh.position.set(cm(CENTER_X), 0, cm(CENTER_Y));
  mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}
