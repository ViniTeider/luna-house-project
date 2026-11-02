import * as THREE from "three";
import { B } from "../furniture/primitives";
import type { Materials } from "../materials";
import { glowFrom } from "./kit";
import type { DecorKit } from "./kit";

const WALL_GAP = 0.5; // keeps painted light just off the surface
const COVE_DEPTH = 10;
const COVE_OFFSET = 7;

export const COVE_DROP = 14;

// Hidden LED along a solid wall: a slim ledge under the ceiling, with light washing
// the wall below it and the ceiling above. `side` points from the wall into the room.
export function cove(
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
