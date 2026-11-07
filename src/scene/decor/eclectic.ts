import * as THREE from "three";
import { B, Cyl, R } from "../furniture/primitives";
import type { Materials } from "../materials";
import type { Obstacle } from "../plan";
import type { PrintKey } from "./eclecticKit";
import type { DecorKit } from "./kit";
import {
  bankersLamp,
  blinds,
  candle,
  ceilingFan,
  driedStems,
  enamelPendants,
  framed,
  fruitBowl,
  mushroomLamp,
  paintedArch,
  sideTable,
  skateboard,
  vase,
} from "./eclecticProps";
import { hangingPlant, pottedPlant } from "./plants";
import type { Decor, DecorContext } from "./index";

const FACING_EAST = Math.PI / 2;

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

type Frame = [
  y: number,
  center: number,
  w: number,
  h: number,
  print: PrintKey,
  frame: "wood" | "black",
];

// Mixed sizes above the desk, on the west wall, clear of the monitor and of the
// entrance door.
const DESK_GALLERY: Frame[] = [
  [35, 175, 34, 44, "hills", "wood"],
  [78, 190, 28, 28, "stroke", "black"],
  [78, 150, 28, 22, "line", "black"],
  [118, 168, 40, 52, "field", "wood"],
  [155, 180, 22, 30, "leaves", "wood"],
];

// Bedroom west wall, above the surfboard rug
const BEDROOM_WALL = 135;
const SKATE_Y = -207;

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

type Cushion = [x: number, material: THREE.Material, tilt: number];

export function eclecticDecor(
  M: Materials,
  kit: DecorKit,
  { ceil, wallH, planning }: DecorContext,
): Decor {
  const e = kit.eclectic;
  const fixed = new THREE.Group();
  const frames = { wood: M.wood, black: e.blackFrame };
  const hang = (wallX: number, list: Frame[]) =>
    list.forEach(([y, center, w, h, print, frame]) => {
      if (center + h / 2 > wallH) return;
      framed(
        fixed,
        frames[frame],
        e.mat,
        e.prints[print],
        [wallX + 1.2, center, y],
        w,
        h,
        FACING_EAST,
      );
    });
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

  // One big plant in a glazed pot by the balcony door, and three pots outside
  pottedPlant(fixed, kit, "tree", [385, 0, 273], {
    radius: 13,
    height: 30,
    seed: 21,
    pot: e.inkGlaze,
  });
  (
    [
      [466, 118, 11, kit.terracotta, "bush", 4],
      [446, 110, 8, e.oliveGlaze, "bush", 7],
      [468, 142, 9, kit.clay, "snake", 12],
    ] as const
  ).forEach(([x, y, radius, pot, kind, seed]) =>
    pottedPlant(fixed, kit, kind, [x, 0, y], {
      radius,
      height: radius * 2,
      seed,
      pot,
    }),
  );

  // Living room corner: tall plant in a basket; side table at the end of the sofa
  pottedPlant(fixed, kit, "tree", [464, 0, -82], {
    radius: 14,
    height: 32,
    seed: 11,
    pot: kit.wicker,
  });
  sideTable(fixed, e.inkGlaze, 462, 45, 15, 52);
  vase(fixed, e.oliveGlaze, [459, 52, 40], 5, 20);
  driedStems(fixed, kit.darkWood, [459, 70, 40], 46);
  B(fixed, e.mat, 464, 52, 50, 12, 2.4, 16);
  B(fixed, e.rustVelvet, 464, 54.4, 50, 11, 2, 15);
  candle(fixed, e.waxOchre, e.brass, [465, 56.4, 50], 10, false);

  // White blinds inside the window recesses
  const blindTop = Math.min(220, wallH);
  blinds(fixed, e.slat, 462.5, -300, -150, 70, blindTop, wallH >= 220);
  blinds(fixed, e.slat, 481.5, -60, 60, 110, blindTop, wallH >= 220);

  // Bedroom: kilim runner beside the bed; a bud vase and a candle on the headboard shelf
  rug(fixed, e.runner, 425, 0, -225, 60, 120);
  vase(fixed, e.rustGloss, [345, 80, -346], 3, 12);
  candle(fixed, e.wax, e.brass, [296, 80, -346], 14);

  // Bathroom: olive and rust towels, kilim bath mat
  rug(fixed, e.bathMat, 84, 0, -60, 56, 84);
  (
    [
      [-139, e.oliveTowel],
      [-111, e.rustVelvet],
    ] as const
  ).forEach(([z, material]) => {
    R(fixed, material, 115.4, 68, z, 1.8, 54.6, 25, 0.7);
    R(fixed, material, 117.2, 86, z, 1.4, 36.6, 25, 0.6);
    R(fixed, material, 116.5, 121.6, z, 3.6, 2, 25, 0.9);
  });

  // Bathroom shelves: folded towels, a vase and a small plant
  [0, 4.4, 8.8].forEach((dy, i) => {
    R(fixed, i % 2 ? e.oliveTowel : e.mat, 9, 129.2 + dy, -141, 14, 4, 16, 1.5);
    R(
      fixed,
      i % 2 ? e.mat : e.rustVelvet,
      110,
      171.2 + dy,
      -130,
      13,
      4,
      18,
      1.5,
    );
  });
  vase(fixed, e.inkGlaze, [8, 129.2, -122], 3.5, 13);
  driedStems(fixed, kit.darkWood, [8, 142, -122], 22);
  pottedPlant(fixed, kit, "bush", [110, 171.2, -112], {
    radius: 4.5,
    height: 9,
    seed: 97,
    pot: e.oliveGlaze,
  }).scale.setScalar(0.62);

  // Handmade olive tiles between the countertop and the upper cabinets
  const splash = Math.min(60, wallH - 90);
  if (splash > 0) {
    B(fixed, e.oliveTiles, 211, 90, 352.7, 258, splash, 0.4).castShadow = false;
    B(fixed, e.oliveTiles, 369.5, 90, 331.7, 59, splash, 0.4).castShadow =
      false;
  }
  // Two-tone wall behind the desk: deep ink up to 1 m, white with the gallery above
  B(fixed, e.paintInk, 0.15, 0, 87, 0.3, Math.min(100, wallH), 174).castShadow =
    false;

  if (!planning) {
    hang(0, DESK_GALLERY);
    if (wallH >= 180) skateboard(fixed, e, BEDROOM_WALL, SKATE_Y, 132);
    // Pothos spilling from the top of the cabinet in front of the shaft
    if (wallH >= 235)
      pottedPlant(fixed, kit, "trailing", [372, 220, 304], {
        radius: 9,
        height: 13,
        seed: 17,
        drop: 64,
        turn: Math.PI,
        pot: kit.terracotta,
      });
  }

  if (!planning && wallH >= ceil) {
    ceilingFan(fixed, kit, M.wood, e.fanMetal, 336, -22, ceil);
    hangingPlant(fixed, kit, "hanging", 452, -34, 186, ceil, {
      seed: 83,
      drop: 56,
    });
  }

  return {
    fixed,
    obstacles: [
      obstacle(385, 273, 13, "plant"),
      obstacle(466, 118, 11, "plant"),
      obstacle(446, 110, 8, "plant"),
      obstacle(468, 142, 9, "plant"),
      obstacle(464, -82, 14, "plant"),
      obstacle(462, 45, 15, "side table"),
    ],
    items: {
      island: (g) => {
        const enamel = e.oliveEnamel;
        enamelPendants(g, kit, [enamel, enamel, enamel], ceil);
        fruitBowl(g, e.inkGlaze, e.lemon, e.orange, 40, 90, 4);
      },
      sofa: (g) => {
        rug(g, e.vintageRug, 0, 0, -8, 262, 158);
        cushions(
          g,
          [
            [-64, e.rustVelvet, 0.2],
            [-36, e.ticking, -0.12],
            [62, e.ochre, 0.16],
          ],
          44,
          12,
          38,
          36,
        );
        R(g, e.gingham, -97, 61.2, 2, 27, 2, 74, 0.9);
        R(g, e.gingham, -110.5, 33, 2, 2, 29, 74, 0.9);
      },
      bed: (g) => {
        // Light blue blanket folded over the foot of the bed
        R(g, e.blanketBlue, 0, 56.2, 46, 142, 1.6, 34, 0.7);
        [-1, 1].forEach((side) =>
          R(g, e.blanketBlue, side * 70.6, 36, 46, 1.6, 21, 34, 0.7),
        );
        cushions(
          g,
          [
            [-20, e.gingham, 0.1],
            [22, e.mat, -0.1],
          ],
          57,
          -54,
          44,
          20,
        );
      },
      sink: (g) => {
        // Utensil crock and cutting boards, between the basin and the stove
        vase(g, e.creamGloss, [57, 90, 12], 5.5, 14).scale.y = 0.8;
        [-1.5, 1.5].forEach((dx, i) =>
          Cyl(g, kit.darkWood, 57 + dx, 96, 12 + i, 0.6, 18),
        );
        [
          [52, 20, M.wood],
          [58, 18, kit.darkWood],
        ].forEach(([x, w, material]) => {
          const board = R(
            g,
            material as THREE.Material,
            x as number,
            90,
            30,
            w as number,
            30 - (w as number) / 3,
            2,
            0.8,
          );
          board.rotation.x = 0.1;
        });
      },
      stool: (g) => {
        Cyl(g, e.cognac, 0, 65, 0, 16.5, 2.5);
      },
      rack: (g) => {
        // Terracotta arch painted on the wall behind the TV
        if (wallH >= 215)
          paintedArch(g, e.paintTerracotta, [0, 0, -17.8], 170, 215, 0);
        mushroomLamp(g, kit, e.rustGloss, 88, 45, 0);
        (
          [
            [e.ink, 26, 3],
            [e.mat, 24, 2.6],
            [e.ochre, 25, 3.2],
          ] as const
        ).forEach(([material, w, h], i) =>
          B(g, material, 58, 45 + [0, 3, 5.6][i], 2, w, h, 18),
        );
        candle(g, e.wax, e.brass, [58, 53.8, 2], 12, false);
        candle(g, e.wax, e.brass, [72, 45, 6], 20);
        if (wallH < 190) return;
        // Floating shelf to the right of the TV, with pothos and candles
        B(g, M.wood, 78, 168, -9, 64, 3, 18);
        B(g, e.mat, 62, 171, -10, 16, 2.6, 12);
        candle(g, e.waxOchre, e.brass, [62, 173.6, -10], 9, false);
        pottedPlant(g, kit, "trailing", [96, 171, -10], {
          radius: 7,
          height: 11,
          seed: 29,
          drop: 62,
          pot: kit.terracotta,
        });
      },
      desk: (g) => {
        bankersLamp(g, kit, e.brass, e.bankerGlass, -14, 75, -66);
        B(g, e.ink, -10, 75, 62, 16, 3, 22);
        B(g, e.ochre, -10, 78, 62, 15, 2.4, 21);
        vase(g, e.inkGlaze, [-10, 80.4, 62], 3, 10);
        // Flatweave rug under the desk and the chair
        rug(g, e.flatweave, 52, 0, 0, 150, 160);
      },
    },
  };
}
