import * as THREE from "three";
import { B, Cyl, R } from "../furniture/primitives";
import type { Materials } from "../materials";
import { cove } from "./cove";
import { glowFrom, halo } from "./kit";
import type { DecorKit } from "./kit";
import { pottedPlant } from "./plants";
import type { DecorContext } from "./index";

const WAINSCOT = 120;
const FACING = 0.4; // tile thickness over the wall

function tile(
  g: THREE.Group,
  kit: DecorKit,
  cx: number,
  by: number,
  cz: number,
  w: number,
  h: number,
  d: number,
) {
  if (h <= 0) return;
  B(g, kit.zellige, cx, by, cz, w, h, d).castShadow = false;
}

function showerWalls(g: THREE.Group, kit: DecorKit, top: number) {
  const face = -236.5;
  tile(g, kit, 34, 0, face, 22, top, FACING);
  tile(g, kit, 111.5, 0, face, 13, top, FACING);
  tile(g, kit, 75, 0, face, 60, Math.min(160, top), FACING);
  tile(g, kit, 75, 220, face, 60, top - 220, FACING);
  tile(g, kit, 116.5, 0, -198.5, FACING, top, 76);
  tile(g, kit, 23.5, 0, -198.5, FACING, top, 76);
}

function wainscot(g: THREE.Group, kit: DecorKit, top: number) {
  const h = Math.min(WAINSCOT, top);
  tile(g, kit, FACING / 2, 0, -87, FACING, h, 144);
  tile(g, kit, 59, 0, -15.2, 118, h, FACING);
  tile(g, kit, 117.8, 0, -123.5, FACING, h, 71);
  tile(g, kit, 117.8, 0, -21.5, FACING, h, 13);
  if (top < WAINSCOT + 2) return;
  B(g, kit.clay, 1.2, WAINSCOT, -87, 2.4, 1.6, 144);
  B(g, kit.clay, 59, WAINSCOT, -16.2, 118, 1.6, 2.4);
  B(g, kit.clay, 116.8, WAINSCOT, -123.5, 2.4, 1.6, 71);
}

function bottle(
  g: THREE.Group,
  kit: DecorKit,
  mat: THREE.Material,
  x: number,
  by: number,
  z: number,
  r: number,
  h: number,
) {
  Cyl(g, mat, x, by, z, r, h);
  Cyl(g, kit.cord, x, by + h, z, 0.9, 2.5);
}

function showerShelves(g: THREE.Group, kit: DecorKit) {
  B(g, kit.led, 25, 127.4, -219, 1, 0.5, 27).castShadow = false;
  glowFrom(g, kit, [24.3, 127, -232], [24.3, 127, -206], [0, -34, 0], 0.7);
  bottle(g, kit, kit.amber, 28.5, 130, -229, 3.2, 17);
  bottle(g, kit, kit.amber, 28.5, 130, -221, 3.2, 15);
  bottle(g, kit, kit.clay, 28.5, 130, -210, 2.8, 13);
  bottle(g, kit, kit.clay, 28.5, 158, -226, 2.6, 12);
  Cyl(g, kit.towelLinen, 28.5, 158, -213, 3.6, 7);
}

function foldedTowels(
  g: THREE.Group,
  mat: THREE.Material,
  cx: number,
  by: number,
  cz: number,
  w: number,
  d: number,
  count: number,
) {
  for (let i = 0; i < count; i++) R(g, mat, cx, by + i * 4.4, cz, w, 4, d, 1.5);
}

function shelfThings(g: THREE.Group, kit: DecorKit) {
  // Above the toilet
  foldedTowels(g, kit.towelLinen, 9, 129.2, -140, 14, 16, 3);
  Cyl(g, kit.wicker, 9, 129.2, -120, 6.5, 13);
  pottedPlant(g, kit, "bush", [9, 159.2, -118], {
    radius: 4.5,
    height: 9,
    seed: 97,
    pot: kit.clay,
  }).scale.setScalar(0.62);
  bottle(g, kit, kit.amber, 7, 159.2, -140, 3, 12);
  bottle(g, kit, kit.clay, 12, 159.2, -133, 2.6, 10);
  // Above the towel bar
  foldedTowels(g, kit.cushionRust, 110, 171.2, -142, 13, 18, 3);
  foldedTowels(g, kit.towelLinen, 110, 171.2, -118, 13, 18, 4);
  // Up high, for what is rarely used
  Cyl(g, kit.wicker, 70, 215.2, -23, 7, 13);
  Cyl(g, kit.wicker, 100, 215.2, -23, 7, 13);
}

function downlight(
  g: THREE.Group,
  kit: DecorKit,
  ceil: number,
  x: number,
  z: number,
) {
  Cyl(g, kit.cord, x, ceil - 0.6, z, 4.2, 0.6);
  Cyl(g, kit.led, x, ceil - 0.8, z, 3.2, 0.3);
  halo(g, kit, [x, ceil - 1, z], 60, 60, "y");
}

function vanityTray(g: THREE.Group, kit: DecorKit) {
  B(g, kit.clay, 25, 85, -37.5, 34, 1.2, 12);
  Cyl(g, kit.amber, 16, 86.2, -37.5, 3, 12);
  Cyl(g, kit.cord, 16, 98.2, -37.5, 0.7, 3);
  B(g, kit.cord, 17.4, 100.6, -37.5, 3.4, 0.8, 1);
  Cyl(g, kit.clay, 28, 86.2, -37.5, 3.4, 6.5);
  const flame = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.009, 1),
    kit.bulb,
  );
  flame.scale.y = 1.7;
  flame.position.set(0.28, 0.941, -0.375);
  g.add(flame);
}

function towels(g: THREE.Group, kit: DecorKit) {
  [
    [-139, kit.cushionRust],
    [-111, kit.towelLinen],
  ].forEach(([z, material]) => {
    const mat = material as THREE.Material;
    R(g, mat, 115.4, 68, z as number, 1.8, 54.6, 25, 0.7);
    R(g, mat, 117.2, 86, z as number, 1.4, 36.6, 25, 0.6);
    R(g, mat, 116.5, 121.6, z as number, 3.6, 2, 25, 0.9);
  });
}

function basket(g: THREE.Group, kit: DecorKit) {
  Cyl(g, kit.wicker, 11, 0, -101, 9, 22);
  [
    [-3.5, 22.6],
    [3.5, 22.6],
    [0, 27],
  ].forEach(([dz, y]) =>
    Cyl(g, kit.towelLinen, 11, y + 2, -101 + dz, 3.4, 13, "x"),
  );
}

export function cozyBath(
  fixed: THREE.Group,
  M: Materials,
  kit: DecorKit,
  { ceil, wallH, planning }: DecorContext,
) {
  const g = new THREE.Group();
  fixed.add(g);

  B(g, kit.stoneFloor, 59, 0, -126.5, 118, 0.3, 223).castShadow = false;
  showerWalls(g, kit, Math.min(ceil, wallH));
  wainscot(g, kit, wallH);
  showerShelves(g, kit);
  shelfThings(g, kit);
  vanityTray(g, kit);
  towels(g, kit);
  basket(g, kit);
  R(g, kit.rug, 84, 0.3, -60, 56, 1.4, 84, 0.6).castShadow = false;
  if (planning) return;

  // On top of the mirror cabinet, by the hinge, with the vines over the corner of the mirror
  pottedPlant(g, kit, "trailing", [8, 192, -78], {
    radius: 8,
    height: 13,
    seed: 101,
    drop: 54,
    turn: Math.PI / 2,
    pot: kit.clay,
  });

  // Built-in light: LED hidden around the mirror cabinet and under the vanity
  halo(g, kit, [24, 0.8, -60], 110, 110, "y");
  B(g, kit.led, 12.6, 121.4, -60, 1.6, 0.5, 54).castShadow = false;
  glowFrom(g, kit, [0.6, 121, -88], [0.6, 121, -32], [0, -34, 0], 0.8);
  if (wallH >= 192)
    glowFrom(g, kit, [0.6, 192, -90], [0.6, 192, -30], [0, 40, 0], 0.8);
  if (wallH >= ceil) {
    cove(g, kit, M, ceil, "x", -15, 0, 118, -1, 30);
    downlight(g, kit, ceil, 60, -60);
    downlight(g, kit, ceil, 60, -125);
  }
}
