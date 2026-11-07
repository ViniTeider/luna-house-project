import * as THREE from "three";
import { B, Cyl, R, cm } from "../furniture/primitives";
import type { Materials } from "../materials";
import type { Obstacle } from "../plan";
import { cactus } from "./brazilProps";
import { framed, lathe, mushroomLamp } from "./eclecticProps";
import type { DecorKit } from "./kit";
import type { PrintKey } from "./midKit";
import {
  albumLedge,
  arcLamp,
  knotCushion,
  paperLantern,
  recordPlayer,
  tieredLamp,
} from "./midProps";
import { pottedPlant } from "./plants";
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

type Frame = [x: number, center: number, w: number, h: number, print: PrintKey];

// Gallery wall around the TV, in the TV unit's space (TV from -61 to 61, 85 to 156)
const GALLERY: Frame[] = [
  [-94, 118, 30, 40, "sun"],
  [-92, 178, 36, 48, "night"],
  [-44, 204, 44, 32, "pool"],
  [6, 200, 26, 34, "stripes"],
  [44, 208, 30, 40, "stack"],
  [92, 186, 34, 46, "cactus"],
  [94, 124, 26, 34, "dots"],
];

// Black and white abstracts on the bedroom's rust wall
const BEDROOM_FRAMES: [
  y: number,
  center: number,
  w: number,
  h: number,
  print: PrintKey,
][] = [
  [-236, 165, 44, 56, "blobs"],
  [-178, 158, 32, 42, "stack"],
];

type Cushion = [x: number, material: THREE.Material, tilt: number];

export function midDecor(
  M: Materials,
  kit: DecorKit,
  { ceil, wallH, planning }: DecorContext,
): Decor {
  const t = kit.mid;
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

  // Bedroom: rust wall behind the frames
  B(fixed, t.paintRust, 135.15, 0, -205, 0.3, wallH, 180).castShadow = false;

  // Plants: palm in a clay pot in the living room corner, cactus on the balcony
  pottedPlant(fixed, kit, "tree", [462, 0, -80], {
    radius: 14,
    height: 30,
    seed: 37,
    pot: kit.terracotta,
  });
  cactus(fixed, kit.eclectic.oliveGlaze, kit.terracotta, 466, 124, 56);
  pottedPlant(fixed, kit, "snake", [468, 0, 152], {
    radius: 10,
    height: 20,
    seed: 19,
    pot: t.teak,
  });

  // Living room: arc lamp from the corner by the window, shade over the sofa
  arcLamp(
    fixed,
    kit,
    t.chrome,
    t.orangeGloss,
    kit.clay,
    [464, 46],
    [398, 16],
    186,
  );

  // Kitchen: kilim runner between the island and the counters
  rug(fixed, t.kilim, 175, 0, 257, 220, 56);

  // Bedroom: paper floor lamp in the corner, check rug by the bed
  tieredLamp(fixed, kit, t.whitePaper, t.blackMetal, 443, -280);
  rug(fixed, t.checkerRug, 425, 0, -205, 60, 130);

  // Bathroom: mustard and olive towels, check mat
  rug(fixed, t.checkerMat, 84, 0, -60, 56, 84);
  (
    [
      [-139, t.olive],
      [-111, t.mustard],
    ] as const
  ).forEach(([z, material]) => {
    R(fixed, material, 115.4, 68, z, 1.8, 54.6, 25, 0.7);
    R(fixed, material, 117.2, 86, z, 1.4, 36.6, 25, 0.6);
    R(fixed, material, 116.5, 121.6, z, 3.6, 2, 25, 0.9);
  });

  if (!planning) {
    BEDROOM_FRAMES.forEach(([y, center, w, h, print]) => {
      if (center + h / 2 > wallH) return;
      framed(
        fixed,
        t.teak,
        t.mat,
        t.prints[print],
        [136.2, center, y],
        w,
        h,
        FACING_EAST,
      );
    });
    // Office: album covers on two picture ledges above the desk
    if (wallH >= 225) {
      albumLedge(fixed, M.wood, t.covers, 0, 20, 154, 138, 0);
      albumLedge(fixed, M.wood, t.covers, 0, 20, 154, 186, 4);
    }
  }

  if (!planning && wallH >= ceil)
    paperLantern(fixed, kit, t.whitePaper, 321, -150, ceil - 46, 22, ceil);

  return {
    fixed,
    obstacles: [
      obstacle(462, -80, 15, "plant"),
      obstacle(466, 124, 13, "plant"),
      obstacle(468, 152, 10, "plant"),
      obstacle(464, 46, 17, "floor lamp"),
      obstacle(443, -280, 16, "floor lamp"),
    ],
    items: {
      island: (g) => {
        // Big orange paper lantern, as over a dining table
        paperLantern(g, kit, t.orangePaper, 0, 0, ceil - 64, 30, ceil);
        // Wavy orange vase with a few flowers
        const wave: [number, number][] = Array.from({ length: 16 }, (_, i) => [
          i === 0 ? 0.01 : 5 + Math.sin((i / 15) * Math.PI * 3) * 1.6,
          (i / 15) * 22,
        ]);
        lathe(g, t.orangeGloss, wave, [-40, 90, 4]);
        (
          [
            [-42, 118, 2, t.mustard],
            [-37, 121, 6, kit.teen.pink],
            [-44, 123, 7, t.rust],
          ] as const
        ).forEach(([x, y, z, material]) => {
          Cyl(g, kit.teen.lime, x, 110, z, 0.3, y - 110);
          const bloom = new THREE.Mesh(
            new THREE.IcosahedronGeometry(cm(3), 1),
            material,
          );
          bloom.position.set(cm(x), cm(y), cm(z));
          bloom.castShadow = true;
          g.add(bloom);
        });
      },
      stool: (g) => {
        Cyl(g, t.leather, 0, 65, 0, 17, 3);
      },
      sofa: (g) => {
        rug(g, t.zigzag, 0, 0, -8, 240, 150);
        cushions(
          g,
          [
            [-66, t.checkerCushion, 0.16],
            [-40, t.rust, -0.1],
            [64, t.checkerCushion, -0.12],
          ],
          44,
          12,
          36,
          34,
        );
        knotCushion(g, t.navy, [30, 43, 4], 0.3);
        // Mustard knit throw folded on the left seat
        const knit = R(g, kit.teen.knitSunshine, -20, 43, -16, 44, 5, 34, 2);
        knit.rotation.y = -0.12;
      },
      bed: (g) => {
        // Olive quilt over the duvet, falling over both sides
        R(g, t.olive, 0, 56.2, 30, 142, 1.6, 108, 0.7);
        [-1, 1].forEach((side) =>
          R(g, t.olive, side * 70.6, 32, 30, 1.6, 25, 108, 0.7),
        );
        cushions(
          g,
          [
            [-22, t.checkerCushion, 0.1],
            [22, t.mustard, -0.1],
          ],
          57,
          -54,
          40,
          30,
        );
        knotCushion(g, t.moss, [0, 57, -40], 0.6);
      },
      rack: (g) => {
        recordPlayer(g, t.teak, t.blackMetal, t.vinyl, t.chrome, 52, 45, 0);
        if (wallH < 230) return;
        GALLERY.forEach(([x, center, w, h, print], i) =>
          framed(
            g,
            i % 2 ? t.teak : t.blackMetal,
            t.mat,
            t.prints[print],
            [x, center, -16.4],
            w,
            h,
            0,
          ),
        );
      },
      desk: (g) => {
        mushroomLamp(g, kit, t.orangeGloss, -12, 75, -62);
        B(g, t.mustard, -8, 75, 62, 16, 3, 22);
        B(g, t.rust, -8, 78, 62, 15, 2.6, 21);
        B(g, t.navy, -8, 80.6, 62, 14, 2.2, 20);
      },
    },
  };
}
