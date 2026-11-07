import * as THREE from "three";
import { B, Cyl, R } from "../furniture/primitives";
import type { Materials } from "../materials";
import type { Obstacle } from "../plan";
import { fruitBowl } from "./eclecticProps";
import type { DecorKit } from "./kit";
import { pottedPlant } from "./plants";
import {
  beanBag,
  conePendants,
  discoBall,
  domeLamp,
  kettle,
  NEON_SHAPES,
  neonSign,
  poster,
  recordWall,
  rubberDuck,
  stringLights,
} from "./teenProps";
import type { PosterKey } from "./teenKit";
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

// Exposed brick laid over a wall face, thin enough to stay behind the lamps' glow
function brick(
  g: THREE.Object3D,
  M: Materials,
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
) {
  B(g, M.brick, x, 0, y, w, h, d).castShadow = false;
}

type Poster = [
  y: number,
  center: number,
  w: number,
  h: number,
  print: PosterKey,
  tilt: number,
];

// Above the desk, on the west wall, clear of the monitor
const DESK_POSTERS: Poster[] = [
  [44, 152, 36, 50, "sun", 0.03],
  [92, 162, 34, 46, "wave", -0.04],
  [138, 150, 32, 44, "dots", 0.05],
];

// Bedroom west wall, above the surfboard rug: two rows of records
const RECORDS: [y: number, height: number][] = [
  [-245, 172],
  [-207, 172],
  [-169, 172],
  [-226, 136],
  [-188, 136],
];

type Cushion = [x: number, material: THREE.Material, tilt: number];

export function teenDecor(
  M: Materials,
  kit: DecorKit,
  { ceil, wallH, planning }: DecorContext,
): Decor {
  const t = kit.teen;
  const fixed = new THREE.Group();
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

  // Exposed brick on the TV wall, east of the bedroom door
  brick(fixed, M, 348.5, -99.85, 261, 0.3, wallH);

  // Retro kitchen: sunny yellow tiles between the countertop and the upper cabinets
  const splash = Math.min(60, wallH - 90);
  if (splash > 0) {
    B(fixed, t.retroTiles, 211, 90, 352.7, 258, splash, 0.4).castShadow = false;
    B(fixed, t.retroTiles, 369.5, 90, 331.7, 59, splash, 0.4).castShadow =
      false;
  }

  // Plants in bright glazed pots: by the balcony door and outside
  pottedPlant(fixed, kit, "snake", [385, 0, 273], {
    radius: 12,
    height: 28,
    seed: 31,
    pot: t.pinkGlaze,
  });
  (
    [
      [466, 122, 11, t.tealGlaze, "bush", 5],
      [468, 150, 9, t.sunshineEnamel, "snake", 9],
    ] as const
  ).forEach(([x, y, radius, pot, kind, seed]) =>
    pottedPlant(fixed, kit, kind, [x, 0, y], {
      radius,
      height: radius * 2,
      seed,
      pot,
    }),
  );

  // Bedroom: bean bag in the corner by the window, facing the bed
  beanBag(fixed, t.tangerine, 425, -172, 30, -Math.PI / 2);

  // Bathroom: pink and lime towels, wavy bath mat
  rug(fixed, t.bathMat, 84, 0, -60, 56, 84);
  (
    [
      [-139, t.lime],
      [-111, t.pink],
    ] as const
  ).forEach(([z, material]) => {
    R(fixed, material, 115.4, 68, z, 1.8, 54.6, 25, 0.7);
    R(fixed, material, 117.2, 86, z, 1.4, 36.6, 25, 0.6);
    R(fixed, material, 116.5, 121.6, z, 3.6, 2, 25, 0.9);
  });
  [0, 4.4, 8.8].forEach((dy, i) => {
    const colors = [t.sky, t.cream, t.pink];
    R(fixed, colors[i], 9, 129.2 + dy, -141, 14, 4, 16, 1.5);
    R(fixed, colors[(i + 1) % 3], 110, 171.2 + dy, -130, 13, 4, 18, 1.5);
  });
  rubberDuck(fixed, t.rubberDuck, t.beak, [8, 129.2, -120], 0);
  pottedPlant(fixed, kit, "bush", [110, 171.2, -112], {
    radius: 4.5,
    height: 9,
    seed: 61,
    pot: t.tealGlaze,
  }).scale.setScalar(0.62);

  if (!planning) {
    DESK_POSTERS.forEach(([y, center, w, h, print, tilt]) => {
      if (center + h / 2 > wallH) return;
      poster(
        fixed,
        t.posters[print],
        t.tape,
        [0.3, center, y],
        w,
        h,
        FACING_EAST,
        tilt,
      );
    });
    if (wallH >= 190) recordWall(fixed, t.vinylEdge, t.vinyl, 135, RECORDS);
    // Above the records
    if (wallH >= 240)
      neonSign(
        fixed,
        t.neon.pink,
        t.neonGlow.pink,
        NEON_SHAPES.heart,
        [135.3, 216, -207],
        40,
        FACING_EAST,
        true,
      );
    if (wallH >= 235)
      neonSign(
        fixed,
        t.neon.sky,
        t.neonGlow.sky,
        NEON_SHAPES.star,
        [0.3, 212, 92],
        32,
        FACING_EAST,
      );
    // Party lights looping across the top of the brick wall
    if (wallH >= 220)
      stringLights(
        fixed,
        kit.cord,
        t.bulbs,
        [222, wallH - 12, -98],
        [474, wallH - 12, -98],
        4,
        18,
        30,
      );
  }

  if (!planning && wallH >= ceil)
    discoBall(fixed, t.disco, M.inoxDark, 300, 105, ceil - 42, ceil);

  // Each stool gets its own vinyl seat color
  const seats = [t.vinylPink, t.vinylTangerine, t.vinylLime];
  let stools = 0;

  return {
    fixed,
    obstacles: [
      obstacle(385, 273, 12, "plant"),
      obstacle(466, 122, 11, "plant"),
      obstacle(468, 150, 9, "plant"),
      obstacle(425, -172, 30, "bean bag"),
    ],
    items: {
      island: (g) => {
        // Diner check under the island and the stools
        rug(g, t.checker, 0, 0, -22, 250, 136);
        conePendants(g, kit, t.sunshineEnamel, ceil);
        fruitBowl(g, t.tealGlaze, t.sunshine, t.tangerine, 40, 90, 4);
      },
      stool: (g) => {
        const seat = seats[stools++ % seats.length];
        Cyl(g, seat, 0, 65, 0, 17.5, 3.5);
        Cyl(g, t.chrome, 0, 64.4, 0, 18.4, 1.2);
      },
      fridge: (g) => {
        // Snapshots and magnets on the door, which faces north
        (
          [
            [6, 150, 12, 16, t.posters.sun, 0.06],
            [22, 128, 11, 14, t.posters.wave, -0.08],
            [8, 110, 10, 13, t.posters.bolt, 0.04],
          ] as const
        ).forEach(([x, y, w, h, print, tilt]) =>
          poster(g, print, t.tape, [x, y, -34.6], w, h, Math.PI, tilt),
        );
        (
          [
            [-10, 140, t.teal],
            [-14, 100, t.tangerine],
            [24, 166, t.pink],
            [-6, 170, t.lime],
          ] as const
        ).forEach(([x, y, material]) =>
          Cyl(g, material, x, y, -35.2, 1.8, 1.4, "z"),
        );
      },
      stove: (g) => {
        kettle(g, t.cherryEnamel, t.chrome, 15, 92, 15);
      },
      sofa: (g) => {
        rug(g, t.wavyRug, 0, 0, -8, 240, 150);
        cushions(
          g,
          [
            [-68, t.pink, 0.18],
            [-42, t.teal, -0.1],
            [44, t.tangerine, 0.14],
            [70, t.lime, -0.16],
          ],
          44,
          12,
          36,
          34,
        );
        // Chunky knit blanket folded on the middle seat
        const blanket = R(g, t.knitSunshine, 4, 43, -14, 46, 5, 36, 2);
        blanket.rotation.y = 0.12;
      },
      bed: (g) => {
        // Plum quilt over the duvet, falling over both sides
        R(g, t.plum, 0, 56.2, 32, 142, 1.6, 104, 0.7);
        [-1, 1].forEach((side) =>
          R(g, t.plum, side * 70.6, 34, 32, 1.6, 23, 104, 0.7),
        );
        R(g, t.knitPink, 0, 57.8, 62, 136, 2.4, 30, 1);
        cushions(
          g,
          [
            [-26, t.tangerine, 0.1],
            [0, t.lime, -0.05],
            [26, t.sky, -0.12],
          ],
          57,
          -54,
          34,
          28,
        );
      },
      rack: (g) => {
        if (wallH >= 220)
          neonSign(
            g,
            t.neon.sunshine,
            t.neonGlow.sunshine,
            NEON_SHAPES.bolt,
            [90, 190, -17.7],
            44,
            0,
          );
        // Game console and two controllers on the TV unit
        B(g, t.white, 52, 45, 2, 28, 5, 20);
        B(g, M.black, 52, 50, 2, 26, 0.4, 18);
        (
          [
            [32, 8, t.teal, 0.3],
            [70, 6, t.tangerine, -0.4],
          ] as const
        ).forEach(([x, z, material, turn]) => {
          const pad = R(g, material, x, 45, z, 14, 3.6, 8, 1.6);
          pad.rotation.y = turn;
        });
      },
      desk: (g) => {
        domeLamp(g, kit, t.tangerineEnamel, -18, 75, -62);
        B(g, t.teal, -8, 75, 60, 18, 2.4, 24);
        B(g, t.pink, -8, 77.4, 60, 17, 2.4, 23);
        B(g, t.sunshine, -8, 79.8, 60, 16, 2, 22);
        Cyl(g, t.lime, 6, 75, 70, 4, 10);
        // Round shag rug under the chair
        const shag = Cyl(g, t.shag, 66, 0, 0, 72, 1.4);
        shag.castShadow = false;
        shag.raycast = () => {};
      },
    },
  };
}
