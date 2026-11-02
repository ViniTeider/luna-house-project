import * as THREE from "three";
import { B, Cyl, R, cm } from "../furniture/primitives";
import type { Materials } from "../materials";
import type { Obstacle } from "../plan";
import { curtain, glowFrom, halo } from "./kit";
import type { DecorKit } from "./kit";
import { andonLamp, islandLanterns } from "./lanterns";
import { hangingPlant, pottedPlant } from "./plants";
import type { Decor, DecorContext } from "./index";

const WALL_GAP = 0.5; // keeps painted light just off the surface
const COVE_DROP = 14;
const COVE_DEPTH = 10;
const COVE_OFFSET = 7;
const STRING_BULBS = 18;

const obstacle = (
  x: number,
  y: number,
  r: number,
  label: string,
): Obstacle => ({
  x0: x - r,
  x1: x + r,
  y0: y - r,
  y1: y + r,
  label,
});

// Hidden LED along a solid wall: a slim ledge under the ceiling, with light washing
// the wall below it and the ceiling above. `side` points from the wall into the room.
function cove(
  g: THREE.Group,
  kit: DecorKit,
  M: Materials,
  ceil: number,
  axis: "x" | "z",
  at: number,
  a: number,
  b: number,
  side: 1 | -1,
  drop: number,
) {
  const y = ceil - COVE_DROP;
  const mid = (a + b) / 2,
    len = b - a;
  const inset = at + side * (COVE_OFFSET + COVE_DEPTH / 2);
  const stripAt = at + side * (COVE_OFFSET - 0.4);
  const wall = at + side * WALL_GAP;
  if (axis === "x") {
    B(g, M.ceiling, mid, y, inset, len, 6, COVE_DEPTH).castShadow = false;
    B(g, kit.led, mid, y + 6, stripAt, len, 1.2, 0.8).castShadow = false;
    glowFrom(g, kit, [a, ceil, wall], [b, ceil, wall], [0, -drop, 0]);
    const under = ceil - 0.5;
    glowFrom(
      g,
      kit,
      [a, under, wall],
      [b, under, wall],
      [0, 0, side * 46],
      0.7,
    );
  } else {
    B(g, M.ceiling, inset, y, mid, COVE_DEPTH, 6, len).castShadow = false;
    B(g, kit.led, stripAt, y + 6, mid, 0.8, 1.2, len).castShadow = false;
    glowFrom(g, kit, [wall, ceil, a], [wall, ceil, b], [0, -drop, 0]);
    const under = ceil - 0.5;
    glowFrom(
      g,
      kit,
      [wall, under, a],
      [wall, under, b],
      [side * 46, 0, 0],
      0.7,
    );
  }
}

function underCabinet(
  g: THREE.Group,
  kit: DecorKit,
  x0: number,
  x1: number,
  wallZ: number,
  fullWall: boolean,
) {
  const mid = (x0 + x1) / 2;
  B(g, kit.led, mid, 149.2, wallZ - 12, x1 - x0 - 4, 0.8, 1.6).castShadow =
    false;
  if (!fullWall) return;
  const z = wallZ - WALL_GAP;
  glowFrom(g, kit, [x0, 150, z], [x1, 150, z], [0, -58, 0], 0.5);
}

function balconyString(g: THREE.Group, kit: DecorKit, ceil: number) {
  const point = (t: number) =>
    new THREE.Vector3(
      cm(477),
      cm(ceil - 10 - 16 * Math.sin(t * Math.PI)),
      cm(100 + t * 182),
    );
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 11 }, (_, i) => point(i / 10)),
  );
  g.add(
    new THREE.Mesh(new THREE.TubeGeometry(curve, 40, cm(0.2), 5), kit.cord),
  );
  for (let i = 0; i < STRING_BULBS; i++) {
    const p = point((i + 0.5) / STRING_BULBS);
    const bulb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(cm(1.7), 1),
      kit.bulb,
    );
    bulb.position.copy(p).setY(p.y - cm(3));
    g.add(bulb);
  }
}

function rod(
  g: THREE.Group,
  kit: DecorKit,
  x: number,
  z0: number,
  z1: number,
  y: number,
) {
  const mesh = Cyl(g, kit.darkWood, x, y, (z0 + z1) / 2, 1.1, z1 - z0, "z");
  mesh.castShadow = false;
}

export function cozyDecor(
  M: Materials,
  kit: DecorKit,
  { ceil, wallH, planning }: DecorContext,
): Decor {
  const fixed = new THREE.Group();
  const fullHeight = !planning && wallH >= ceil;

  // Plants, in spots that keep the passages free
  pottedPlant(fixed, kit, "tree", [464, 0, -82], { radius: 14, height: 34 });
  pottedPlant(fixed, kit, "tree", [435, 0, -135], {
    radius: 14,
    height: 34,
    seed: 3,
    pot: kit.clay,
  });
  pottedPlant(fixed, kit, "snake", [385, 0, 273], {
    radius: 13,
    height: 34,
    seed: 5,
    pot: kit.clay,
  });
  pottedPlant(fixed, kit, "bush", [461, 0, 268], {
    radius: 11,
    height: 26,
    seed: 9,
  });

  // Paper floor lamp next to the sofa
  andonLamp(fixed, kit, 463, 60);

  const curtainTop = Math.min(ceil - 8, wallH);
  [
    [-295, -263],
    [-182, -146],
  ].forEach(([a, b]) => curtain(fixed, kit, 455, a, b, curtainTop));
  [
    [-68, -36],
    [36, 68],
  ].forEach(([a, b]) => curtain(fixed, kit, 474, a, b, curtainTop));
  if (fullHeight) {
    rod(fixed, kit, 455, -297, -144, curtainTop);
    rod(fixed, kit, 474, -70, 70, curtainTop);
  }

  if (!planning) {
    halo(fixed, kit, [463, 1, 60], 120, 120, "y");
    // Vines fall over the front of the upper cabinets
    const facingNorth = Math.PI;
    [
      [112, 326, 60, 17],
      [309, 326, 52, 19],
    ].forEach(([x, y, drop, seed]) => {
      pottedPlant(fixed, kit, "trailing", [x, 220, y], {
        radius: 9,
        height: 14,
        seed,
        drop,
        turn: facingNorth,
        pot: seed % 2 ? kit.clay : kit.terracotta,
      });
    });
    // Shelf of trailing plants on the wall, above the desk
    B(fixed, M.wood, 10, 148, 85, 20, 3, 124);
    [36, 134].forEach((y, i) => {
      pottedPlant(fixed, kit, "trailing", [8, 151, y], {
        radius: 7,
        height: 12,
        seed: 61 + i * 12,
        drop: 62,
        turn: Math.PI / 2,
        pot: kit.clay,
      });
    });
    underCabinet(fixed, kit, 82, 218, 353, wallH >= 150);
    underCabinet(fixed, kit, 280, 340, 353, wallH >= 150);
    underCabinet(fixed, kit, 340, 399, 332, wallH >= 150);
    if (wallH >= 150) halo(fixed, kit, [478.4, 95, 62], 90, 150, "x");
  }

  if (fullHeight) {
    cove(fixed, kit, M, ceil, "x", -100, 146, 479, 1, 62);
    cove(fixed, kit, M, ceil, "x", -115, 135, 460, -1, 38);
    cove(fixed, kit, M, ceil, "z", 0, 0, 353, 1, 36);
    if (ceil - COVE_DROP >= 222) {
      cove(fixed, kit, M, ceil, "x", 353, 0, 234, -1, 28);
      cove(fixed, kit, M, ceil, "x", 353, 264, 340, -1, 28);
    }
    balconyString(fixed, kit, ceil);
    hangingPlant(fixed, kit, "hanging", 450, 240, 188, ceil, { seed: 67 });
    hangingPlant(fixed, kit, "hanging", 430, -240, 186, ceil, {
      seed: 83,
      drop: 56,
    });
  }

  return {
    fixed,
    obstacles: [
      obstacle(464, -82, 14, "plant"),
      obstacle(435, -135, 14, "plant"),
      obstacle(385, 273, 13, "plant"),
      obstacle(461, 268, 11, "plant"),
      obstacle(463, 60, 14, "floor lamp"),
    ],
    items: {
      island: (g) => islandLanterns(g, kit, ceil),
      sofa: (g) => {
        const rug = B(g, kit.rug, 0, 0, -8, 262, 1.2, 158);
        rug.castShadow = false;
        rug.raycast = () => {};
        [
          [-64, kit.cushionRust, 0.2],
          [-36, kit.cushionOchre, -0.12],
          [62, kit.cushionOchre, 0.16],
        ].forEach(([x, material, tilt]) => {
          const cushion = R(
            g,
            material as THREE.Material,
            x as number,
            44,
            12,
            38,
            36,
            13,
            6,
          );
          cushion.rotation.set(-0.3, 0, tilt as number);
        });
        R(g, kit.throw, 97, 61.2, 2, 27, 2, 74, 0.9);
        R(g, kit.throw, 110.5, 33, 2, 2, 29, 74, 0.9);
      },
      bed: (g) => {
        const pillow = R(g, kit.cushionRust, 0, 57, -54, 62, 20, 11, 5);
        pillow.rotation.x = -0.3;
        const glow = new THREE.Group();
        glow.userData.overhead = true;
        g.add(glow);
        const y = 0.6;
        glowFrom(glow, kit, [-63, y, -94], [-63, y, 88], [-46, 0, 0]);
        glowFrom(glow, kit, [63, y, -94], [63, y, 88], [46, 0, 0]);
        glowFrom(glow, kit, [-63, y, 88], [63, y, 88], [0, 0, 46]);
      },
      rack: (g) => {
        pottedPlant(g, kit, "bush", [96, 45, 2], {
          radius: 7,
          height: 13,
          seed: 23,
          pot: kit.clay,
        });
        const glow = new THREE.Group();
        glow.userData.overhead = true;
        g.add(glow);
        halo(glow, kit, [0, 121, -17.4], 216, 150, "z");
        glowFrom(glow, kit, [-112, 0.6, 18], [112, 0.6, 18], [0, 0, 46]);
      },
      desk: (g) => {
        const glow = new THREE.Group();
        glow.userData.overhead = true;
        g.add(glow);
        halo(glow, kit, [-25.4, 100, 0], 150, 92, "x");
      },
    },
  };
}
