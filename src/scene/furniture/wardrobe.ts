import * as THREE from "three";
import type { Materials } from "../materials";
import { B, cm } from "./primitives";

// Floor-to-ceiling wardrobe on both sides of the bed, with a bridge and LED. Plan coordinates.
export function buildWardrobe(M: Materials, h: number) {
  const g = new THREE.Group();
  const face = -295;
  const module = (x0: number, x1: number, doors: number) => {
    const w = x1 - x0;
    B(g, M.main, (x0 + x1) / 2, 0, -325, w, h, 60);
    const dw = w / doors;
    for (let i = 0; i < doors; i++) {
      const cx = x0 + dw * (i + 0.5);
      B(g, M.main, cx, 2, face + 0.6, dw - 0.8, h - 4, 1.2);
      B(
        g,
        M.wood,
        cx + (i % 2 ? -dw / 2 + 3 : dw / 2 - 3),
        75,
        face + 1.5,
        1.5,
        70,
        1.2,
      );
    }
  };
  module(135, 252, 3);
  module(390, 460, 2);

  // Thin panel, leaving depth for the headboard shelf
  const bridge = 205;
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

  // Cabinet above the bed. The plan cut sits below it.
  if (h <= bridge) return g;
  B(g, M.main, 321, bridge, -337.5, 138, h - bridge, 35);
  const doors = 3;
  const doorW = 138 / doors;
  for (let i = 0; i < doors; i++) {
    const cx = 252 + doorW * (i + 0.5);
    B(g, M.wood, cx, bridge + 1.5, -319.6, doorW - 0.8, h - bridge - 3, 0.8);
    B(g, M.main, cx, bridge + 4, -319, 22, 1.4, 1);
  }

  const leds = [
    { x: 321, y: bridge - 0.6, z: -321.5, w: 134, h: 0.6, d: 1.5 },
    { x: 253, y: 0, z: -324, w: 1, h: bridge, d: 1.2 },
    { x: 389, y: 0, z: -324, w: 1, h: bridge, d: 1.2 },
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
