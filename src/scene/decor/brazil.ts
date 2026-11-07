import * as THREE from "three";
import { B, Cyl, R } from "../furniture/primitives";
import type { Materials } from "../materials";
import type { Obstacle } from "../plan";
import {
  armchair,
  cactus,
  ceilingPaint,
  ledShelf,
  monstera,
  rattanPendants,
  tripodLamp,
  trackLight,
  wainscot,
} from "./brazilProps";
import type { PrintKey } from "./brazilKit";
import {
  driedStems,
  framed,
  fruitBowl,
  paintedArch,
  vase,
} from "./eclecticProps";
import type { DecorKit } from "./kit";
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

type Print = [y: number, center: number, w: number, h: number, print: PrintKey];

// Bedroom west wall, above the wainscoting
const BEDROOM_PRINTS: Print[] = [
  [-248, 168, 36, 48, "leaf"],
  [-200, 160, 28, 36, "sun"],
  [-158, 168, 36, 48, "figure"],
];

// Inside the mustard arch, above the monitor
const DESK_PRINTS: Print[] = [
  [64, 160, 30, 40, "arch"],
  [106, 160, 30, 40, "leaf"],
];

type Cushion = [x: number, material: THREE.Material, tilt: number];

export function brazilDecor(
  M: Materials,
  kit: DecorKit,
  { ceil, wallH, planning }: DecorContext,
): Decor {
  const t = kit.brazil;
  const fixed = new THREE.Group();
  const hang = (list: Print[], wallX: number) =>
    list.forEach(([y, center, w, h, print]) => {
      if (center + h / 2 > wallH) return;
      framed(
        fixed,
        M.wood,
        t.mat,
        t.prints[print],
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

  // Color blocking: the TV wall in terracotta, east of the bedroom door
  B(fixed, t.paintTerracotta, 348.5, 0, -99.85, 261, wallH, 0.3).castShadow =
    false;
  // Bedroom: olive wainscoting on the west wall
  wainscot(fixed, t.paintOlive, 135, -293, -117, 110);
  // Office: mustard arch behind the desk
  if (wallH >= 205)
    paintedArch(fixed, t.paintMustard, [0.3, 0, 85], 150, 205, FACING_EAST);

  // White subway tiles between the countertop and the upper cabinets
  const splash = Math.min(60, wallH - 90);
  if (splash > 0) {
    B(fixed, t.subway, 211, 90, 352.7, 258, splash, 0.4).castShadow = false;
    B(fixed, t.subway, 369.5, 90, 331.7, 59, splash, 0.4).castShadow = false;
  }

  // Plants: monstera in a basket in the living room corner, cacti on the balcony
  monstera(fixed, kit, t.stem, t.jute, 462, -80, 7);
  cactus(fixed, t.cactus, t.clayPot, 466, 124, 52);
  pottedPlant(fixed, kit, "bush", [468, 0, 152], {
    radius: 10,
    height: 20,
    seed: 14,
    pot: t.clayPot,
  });

  // Living room: tripod lamp at the end of the sofa
  tripodLamp(fixed, kit, M.wood, t.linen, 462, 40);

  // Bedroom: terracotta armchair and ottoman in the corner, facing the projection
  armchair(fixed, t.terracotta, t.blackMetal, 425, -258, 0);

  // Bathroom: terracotta and olive towels, jute mat
  rug(fixed, t.jute, 84, 0, -60, 56, 84);
  (
    [
      [-139, t.olive],
      [-111, t.terracotta],
    ] as const
  ).forEach(([z, material]) => {
    R(fixed, material, 115.4, 68, z, 1.8, 54.6, 25, 0.7);
    R(fixed, material, 117.2, 86, z, 1.4, 36.6, 25, 0.6);
    R(fixed, material, 116.5, 121.6, z, 3.6, 2, 25, 0.9);
  });
  [0, 4.4, 8.8].forEach((dy, i) => {
    const colors = [t.cream, t.terracotta, t.mustard];
    R(fixed, colors[i], 9, 129.2 + dy, -141, 14, 4, 16, 1.5);
    R(fixed, colors[(i + 1) % 3], 110, 171.2 + dy, -130, 13, 4, 18, 1.5);
  });
  vase(fixed, t.clayPot, [8, 129.2, -122], 3.5, 13);
  driedStems(fixed, kit.wicker, [8, 142, -122], 22);

  if (!planning) {
    hang(BEDROOM_PRINTS, 135);
    hang(DESK_PRINTS, 0);
  }

  if (!planning && wallH >= ceil) {
    // Paint wrapping from the TV wall onto the ceiling, ending in a soft curve
    ceilingPaint(
      fixed,
      t.paintTerracotta,
      ceil,
      [218, -100, 479, -38],
      [0, 0, 40, 40],
    );
    // Bedroom ceiling framed in terracotta around a rounded cream middle
    ceilingPaint(
      fixed,
      t.paintTerracotta,
      ceil,
      [135, -355, 460, -115],
      [0, 0, 0, 0],
      { inset: 26, radius: 60 },
    );
    // Kitchen ceiling in olive over the counters
    ceilingPaint(fixed, t.paintOlive, ceil, [0, 280, 399, 353], [40, 40, 0, 0]);
    // Black tracks with spots: over the sofa toward the TV wall, and over the desk
    trackLight(
      fixed,
      kit,
      t.blackMetal,
      [240, 10],
      [440, 10],
      ceil,
      4,
      [335, 120, -100],
    );
    trackLight(
      fixed,
      kit,
      t.blackMetal,
      [70, 30],
      [70, 150],
      ceil,
      3,
      [20, 80, 90],
    );
  }

  return {
    fixed,
    obstacles: [
      obstacle(462, -80, 18, "plant"),
      obstacle(466, 124, 13, "plant"),
      obstacle(468, 152, 10, "plant"),
      obstacle(462, 40, 18, "floor lamp"),
      obstacle(425, -258, 34, "armchair"),
      obstacle(425, -196, 24, "ottoman"),
    ],
    items: {
      island: (g) => {
        rattanPendants(g, kit, t.rattan, ceil);
        fruitBowl(g, t.creamGlaze, t.orange, t.orange, 40, 90, 4);
        vase(g, t.clayPot, [-50, 90, 6], 5, 22);
        driedStems(g, kit.wicker, [-50, 112, 6], 36);
      },
      stool: (g) => {
        Cyl(g, t.cane, 0, 65, 0, 17, 1.2);
      },
      sofa: (g) => {
        // Round jute rug in front of the sofa
        const jute = Cyl(g, t.juteRug, 0, 0, -45, 85, 1.2);
        jute.castShadow = false;
        jute.raycast = () => {};
        cushions(
          g,
          [
            [-66, t.terracotta, 0.16],
            [-40, t.mustard, -0.1],
            [40, t.cream, 0.12],
            [66, t.olive, -0.14],
          ],
          44,
          12,
          36,
          34,
        );
        // Woven throw over the right arm
        R(g, t.throw, 97, 61.2, 2, 27, 2, 74, 0.9);
        R(g, t.throw, 110.5, 33, 2, 2, 29, 74, 0.9);
      },
      bed: (g) => {
        // Woven terracotta throw across the foot of the bed
        R(g, t.throw, 0, 56.2, 54, 142, 1.6, 56, 0.7);
        [-1, 1].forEach((side) =>
          R(g, t.throw, side * 70.6, 30, 54, 1.6, 27, 56, 0.7),
        );
        cushions(
          g,
          [
            [-20, t.terracotta, 0.1],
            [22, t.olive, -0.1],
          ],
          57,
          -54,
          40,
          26,
        );
      },
      rack: (g) => {
        if (wallH < 215) return;
        // Long wood shelf above the TV with a LED strip, books, ceramics and pothos
        ledShelf(g, kit, M.wood, -104, 104, 196, -17.7);
        const top = 199.5;
        (
          [
            [-86, 4, 24, t.cream],
            [-81.6, 3.6, 22, t.terracotta],
            [-77.6, 3.4, 26, t.olive],
          ] as const
        ).forEach(([x, w, h, material]) =>
          B(g, material, x, top, -9, w, h, 15),
        );
        B(g, t.mustard, -52, top, -8, 22, 3, 16);
        B(g, t.cream, -52, top + 3, -8, 20, 2.6, 15);
        vase(g, t.creamGlaze, [-52, top + 5.6, -8], 3.5, 12);
        vase(g, t.clayPot, [18, top, -8], 5, 16);
        framed(g, M.wood, t.mat, t.prints.sun, [48, top + 14, -14], 22, 28, 0);
        [-28, 82].forEach((x, i) =>
          pottedPlant(g, kit, "trailing", [x, top, -8], {
            radius: 7,
            height: 11,
            seed: 41 + i * 6,
            drop: 60,
            pot: i ? t.clayPot : t.creamGlaze,
          }),
        );
      },
      desk: (g) => {
        vase(g, t.clayPot, [-10, 75, 64], 5, 20);
        driedStems(g, kit.wicker, [-10, 95, 64], 34);
        B(g, t.olive, -8, 75, -62, 16, 3, 22);
        B(g, t.cream, -8, 78, -62, 15, 2.4, 21);
        // Striped rug under the chair
        rug(g, t.stripeRug, 66, 0, 0, 140, 170);
      },
    },
  };
}
