import * as THREE from "three";
import type { Materials } from "../materials";
import { B, cm } from "./primitives";

// Floor-to-ceiling wardrobe on both sides of the bed, with a bridge and LED. Plan coordinates.
export function buildWardrobe(M: Materials, h: number) {
  const g = new THREE.Group();
  const face = -295;
  const module = (
    x0: number,
    x1: number,
    doors: number,
    base = 0,
    handleY = 75,
  ) => {
    const w = x1 - x0;
    B(g, M.main, (x0 + x1) / 2, base, -325, w, h - base, 60);
    const dw = w / doors;
    for (let i = 0; i < doors; i++) {
      const cx = x0 + dw * (i + 0.5);
      B(g, M.main, cx, base + 2, face + 0.6, dw - 0.8, h - base - 4, 1.2);
      B(
        g,
        M.wood,
        cx + (i % 2 ? -dw / 2 + 3 : dw / 2 - 3),
        handleY,
        face + 1.5,
        1.5,
        70,
        1.2,
      );
    }
  };
  module(135, 252, 3);
  module(390, 460, 2);

  // Underside of the cabinet above the bed: 96 cm above the 54 cm mattress, so
  // sitting up stays comfortable, and exactly at the plan cut, so plan stays clear.
  const bridge = 150;

  // Thin panel, leaving depth for the headboard shelf
  const panelTop = Math.min(h, bridge);
  B(g, M.wood, 321, 0, -354, 138, panelTop, 2);
  for (let x = 256; x <= 386; x += 8)
    B(g, M.wood, x, 96, -352.2, 3, panelTop - 96, 1.6);

  // Shelf behind the pillows: top at 80 cm, 26 cm above the mattress,
  // reaching 8 cm over the head of the bed. Leaves 16 cm of usable depth.
  B(g, M.main, 321, 76, -344, 138, 4, 18);
  [275, 367].forEach((x) => {
    B(g, M.black, x, 83, -352.8, 12, 10, 0.4);
    [-2.4, 2.4].forEach((dx) =>
      B(g, M.inoxDark, x + dx, 87, -352.5, 2.6, 1.2, 0.3),
    );
  });
  // Life-size phone and Kindle as a scale reference
  B(g, M.black, 275, 80, -345, 16, 0.8, 7.5);
  B(g, M.screen, 275, 80.8, -345, 15, 0.1, 6.8);
  B(g, M.black, 367, 80, -345, 17.7, 0.9, 12.7);
  B(g, M.ceramic, 367, 80.9, -345, 14, 0.1, 10);

  // Cabinet above the bed, same joinery as the side modules. The plan cut sits
  // at its underside.
  if (h <= bridge) return g;
  module(252, 390, 3, bridge, bridge + 4);

  const leds = [
    { x: 321, y: bridge - 0.6, z: face - 1.5, w: 134, h: 0.6, d: 1.5 },
    { x: 253, y: 0, z: face - 4, w: 1, h: bridge, d: 1.2 },
    { x: 389, y: 0, z: face - 4, w: 1, h: bridge, d: 1.2 },
  ];
  leds.forEach((l) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(cm(l.w), cm(l.h), cm(l.d)),
      M.led,
    );
    mesh.position.set(cm(l.x), cm(l.y + l.h / 2), cm(l.z));
    g.add(mesh);
  });
  return g;
}
