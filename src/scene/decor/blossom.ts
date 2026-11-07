import * as THREE from "three";
import { B, Cyl, R } from "../furniture/primitives";
import type { Materials } from "../materials";
import type { Obstacle } from "../plan";
import {
  blossomSprig,
  blossomTree,
  globePendants,
  photoString,
  rattanMirror,
  teddyBear,
  vineSwags,
} from "./blossomProps";
import { framed } from "./eclecticProps";
import type { DecorKit } from "./kit";
import { pottedPlant } from "./plants";
import type { Decor, DecorContext } from "./index";

const FACING_EAST = Math.PI / 2;
const FACING_NORTH = Math.PI;

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

// Flat rug that the furniture can stand on without being picked instead of the floor
function rug(
  g: THREE.Object3D,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
) {
  const mesh = B(g, material, x, y, z, w, 1.2, d);
  mesh.castShadow = false;
  mesh.raycast = () => {};
}

// Pressed flowers above the monitor: [plan y, center height, width, height, print]
const DESK_PRINTS: [number, number, number, number, number][] = [
  [50, 158, 28, 36, 0],
  [85, 166, 32, 42, 1],
  [120, 158, 28, 36, 2],
];

type Cushion = [x: number, material: THREE.Material, tilt: number];

export function blossomDecor(
  M: Materials,
  kit: DecorKit,
  { ceil, wallH, planning }: DecorContext,
): Decor {
  const b = kit.blossom;
  const fixed = new THREE.Group();
  const top = Math.min(ceil, wallH) - 6;
  const cushions = (
    g: THREE.Group,
    list: Cushion[],
    y: number,
    z: number,
    w: number,
    h: number,
  ) =>
    list.forEach(([x, material, tilt]) => {
      const cushion = R(g, material, x, y, z, w, h, 13, 6);
      cushion.rotation.set(-0.3, 0, tilt);
    });
  const sprig = (
    g: THREE.Object3D,
    at: [number, number, number],
    seed: number,
  ) => blossomSprig(g, kit, { petal: b.petal, vase: b.creamGlaze }, at, seed);

  // Exposed brick on the TV wall, east of the bedroom door, thin enough to stay
  // behind the lava lamp's glow
  B(fixed, M.brick, 348.5, 0, -99.85, 261, wallH, 0.3).castShadow = false;

  // Cherry blossom trees with fairy lights: in the living room corner by the window,
  // and in the bedroom between the wardrobe and the window, reaching over the bed
  blossomTree(
    fixed,
    kit,
    { petal: b.petal, pot: b.creamGlaze },
    463,
    -84,
    top,
    [-1, 0.6],
    5,
  );
  blossomTree(
    fixed,
    kit,
    { petal: b.petal, pot: b.roseGlaze },
    443,
    -280,
    top,
    [-1, 0.5],
    12,
  );

  // Balcony: two pots in soft glazes
  (
    [
      [466, 120, 11, b.sageGlaze, "bush", 3],
      [468, 146, 9, b.creamGlaze, "bush", 8],
    ] as const
  ).forEach(([x, y, radius, pot, kind, seed]) =>
    pottedPlant(fixed, kit, kind, [x, 0, y], {
      radius,
      height: radius * 2,
      seed,
      pot,
    }),
  );

  // Bathroom: blush and sage towels, a sprig on the shelf
  rug(fixed, b.bathMat, 84, 0, -60, 56, 84);
  (
    [
      [-139, b.sage],
      [-111, b.blush],
    ] as const
  ).forEach(([z, material]) => {
    R(fixed, material, 115.4, 68, z, 1.8, 54.6, 25, 0.7);
    R(fixed, material, 117.2, 86, z, 1.4, 36.6, 25, 0.6);
    R(fixed, material, 116.5, 121.6, z, 3.6, 2, 25, 0.9);
  });
  [0, 4.4, 8.8].forEach((dy, i) => {
    const colors = [b.cream, b.blush, b.sage];
    R(fixed, colors[i], 9, 129.2 + dy, -141, 14, 4, 16, 1.5);
    R(fixed, colors[(i + 2) % 3], 110, 171.2 + dy, -130, 13, 4, 18, 1.5);
  });
  sprig(fixed, [8, 129.2, -120], 41);

  // Blush fish-scale tiles between the countertop and the upper cabinets
  const splash = Math.min(60, wallH - 90);
  if (splash > 0) {
    B(fixed, b.scaleTiles, 211, 90, 352.7, 258, splash, 0.4).castShadow = false;
    B(fixed, b.scaleTiles, 369.5, 90, 331.7, 59, splash, 0.4).castShadow =
      false;
  }

  if (!planning) {
    DESK_PRINTS.forEach(([y, center, w, h, print]) => {
      if (center + h / 2 > wallH) return;
      framed(
        fixed,
        b.frame,
        b.mat,
        b.pressed[print],
        [1.2, center, y],
        w,
        h,
        FACING_EAST,
      );
    });
    // Bedroom west wall: two strings of fairy lights with instant photos
    if (wallH >= 200)
      [
        [190, 1],
        [150, 5],
      ].forEach(([h, seed]) =>
        photoString(
          fixed,
          kit,
          b.clip,
          b.photos,
          [136, h, -284],
          [136, h, -126],
          10,
          7,
          FACING_EAST,
          seed,
        ),
      );
  }

  // Pothos pinned along the top of the walls, with tails hanging down
  if (!planning && wallH >= 200) {
    const vine = (
      a: [number, number, number],
      bEnd: [number, number, number],
      swags: number,
      facing: number,
      seed: number,
    ) => vineSwags(fixed, kit, b.stem, a, bEnd, swags, 14, 34, facing, seed);
    const h = wallH - 8;
    vine([224, h, -98.5], [474, h, -98.5], 3, 0, 3);
    vine([136.5, h, -292], [136.5, h, -118], 2, FACING_EAST, 9);
    vine([1.5, h, 4], [1.5, h, 168], 2, FACING_EAST, 15);
    // Along the top of the upper cabinets, from a pot on the cabinet by the shaft
    if (wallH >= 235) {
      pottedPlant(fixed, kit, "trailing", [372, 220, 306], {
        radius: 9,
        height: 13,
        seed: 23,
        drop: 50,
        turn: Math.PI,
        pot: b.creamGlaze,
      });
      vineSwags(
        fixed,
        kit,
        b.stem,
        [338, 222, 317],
        [84, 222, 317],
        3,
        8,
        22,
        FACING_NORTH,
        27,
      );
    }
  }

  return {
    fixed,
    obstacles: [
      obstacle(463, -84, 14, "blossom tree"),
      obstacle(443, -280, 14, "blossom tree"),
      obstacle(466, 120, 11, "plant"),
      obstacle(468, 146, 9, "plant"),
    ],
    items: {
      island: (g) => {
        globePendants(g, kit, b.milkGlass, b.brass, ceil);
        sprig(g, [40, 90, 4], 52);
      },
      stool: (g) => {
        Cyl(g, b.blush, 0, 65, 0, 16.5, 3);
      },
      sofa: (g) => {
        rug(g, b.rug, 0, 0, -8, 250, 160);
        cushions(
          g,
          [
            [-64, b.quilt, 0.16],
            [-38, b.sage, -0.1],
            [60, b.blush, 0.14],
          ],
          44,
          12,
          38,
          36,
        );
        // Embroidered quilt folded on the seat
        const quilt = R(g, b.quilt, 70, 43, -14, 42, 6, 34, 2);
        quilt.rotation.y = 0.15;
      },
      bed: (g) => {
        // Mauve bedspread falling to the sides, white embroidered quilt over it
        R(g, b.mauve, 0, 56.2, 18, 142, 1.6, 152, 0.7);
        [-1, 1].forEach((side) =>
          R(g, b.mauve, side * 70.6, 22, 18, 1.6, 35, 152, 0.7),
        );
        R(g, b.quilt, 0, 57.8, 34, 132, 1.4, 112, 0.6);
        R(g, b.quilt, 0, 57.8, -27, 132, 3, 12, 1.2);
        cushions(
          g,
          [
            [-22, b.blush, 0.1],
            [24, b.sage, -0.1],
          ],
          57,
          -54,
          40,
          32,
        );
        teddyBear(g, b.plush, b.cream, [-46, 57.8, -30], 0.35);
      },
      rack: (g) => {
        if (wallH >= 215) {
          // Rattan sunburst mirror left of the TV
          rattanMirror(g, b.rattan, M.mirror, [-93, 166, -17.4], 24, 0);
          // Floating shelves right of the TV: books, a candle and a pothos
          [128, 172].forEach((h) => B(g, M.wood, 92, h, -10, 40, 2.4, 15));
          (
            [
              [78, 4, 24, b.rose],
              [82.4, 3.4, 22, b.sage],
              [86.2, 3, 20, b.cream],
            ] as const
          ).forEach(([x, w, h, material]) =>
            B(g, material, x, 130.4, -11, w, h, 14),
          );
          const leaning = B(g, b.mauve, 90.6, 130.4, -11, 3, 19, 13);
          leaning.rotation.z = -0.25;
          Cyl(g, b.cream, 104, 130.4, -10, 3.4, 8);
          pottedPlant(g, kit, "trailing", [94, 174.4, -10], {
            radius: 7,
            height: 11,
            seed: 33,
            drop: 52,
            pot: b.creamGlaze,
          });
        }
        sprig(g, [64, 45, 2], 61);
      },
      desk: (g) => {
        sprig(g, [-10, 75, 62], 73);
      },
    },
  };
}
