import * as THREE from "three";
import type { Materials } from "../materials";
import { Cyl, R, cm } from "./primitives";

// Wanbo T2 Max on the headboard shelf: 11.3 × 14.6 × 15.65 cm. Centered on the bed, so
// the lens sits right above the gap between the pillows. Plan coordinates.
const X = 321;
const SHELF_TOP = 80;
const BACK = -352.6;
const WIDTH = 11.3;
const DEPTH = 14.6;
const HEIGHT = 15.65;
const LENS_HEIGHT = SHELF_TOP + 10;
const LENS_Y = BACK + DEPTH;

// Not published: estimated from the listed 40" at 1.1 m and 100" at 2.6 m.
const THROW_RATIO = 1.2;
const WALL_Y = -115;
const IMAGE_BOTTOM = 85;
const IMAGE_W = (WALL_Y - LENS_Y) / THROW_RATIO;
const IMAGE_H = (IMAGE_W * 9) / 16;

export const PROJECTION_TOP = IMAGE_BOTTOM + IMAGE_H;

export function projector(g: THREE.Object3D, M: Materials) {
  R(g, M.projector, X, SHELF_TOP, BACK + DEPTH / 2, WIDTH, HEIGHT, DEPTH, 1.6);
  Cyl(g, M.black, X, LENS_HEIGHT, LENS_Y + 0.4, 3.4, 1, "z");
  Cyl(g, M.screen, X, LENS_HEIGHT, LENS_Y + 1, 2.5, 0.3, "z");
}

function pictureTexture() {
  const W = 960,
    H = 540;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.72);
  sky.addColorStop(0, "#1b2a5a");
  sky.addColorStop(0.5, "#b0507a");
  sky.addColorStop(0.8, "#f59a4c");
  sky.addColorStop(1, "#ffd68a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const sun = ctx.createRadialGradient(
    W * 0.62,
    H * 0.62,
    6,
    W * 0.62,
    H * 0.62,
    190,
  );
  sun.addColorStop(0, "#fff6d8");
  sun.addColorStop(0.16, "#ffe2a0");
  sun.addColorStop(1, "rgba(255,190,110,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  const ridge = (
    base: number,
    height: number,
    phase: number,
    color: string,
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) {
      const t = (x / W) * Math.PI * 2;
      const wave =
        Math.sin(t * 1.4 + phase) +
        0.5 * Math.sin(t * 3.3 + phase * 2) +
        0.2 * Math.sin(t * 8 + phase);
      ctx.lineTo(x, base - height * wave);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  };
  ridge(H * 0.7, 26, 0.6, "#7a4163");
  ridge(H * 0.78, 34, 2.1, "#46294f");
  ridge(H * 0.88, 30, 4, "#1a1228");

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// See-through over the wall: daylight washes the image out, and at night it gets
// close to full color.
export function createProjection() {
  const material = new THREE.MeshBasicMaterial({
    map: pictureTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const geometry = new THREE.PlaneGeometry(cm(IMAGE_W), cm(IMAGE_H));
  geometry.rotateY(Math.PI);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(cm(X), cm(IMAGE_BOTTOM + IMAGE_H / 2), cm(WALL_Y - 0.4));
  mesh.renderOrder = 2;
  const setNight = (night: boolean) => (material.opacity = night ? 0.93 : 0.42);
  return { mesh, setNight };
}
