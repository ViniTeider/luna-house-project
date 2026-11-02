import * as THREE from "three";
import type { Materials } from "../materials";
import { B } from "./primitives";

// The fridge and appliances face north, toward the living room.
export function fridge(g: THREE.Group, M: Materials) {
  B(g, M.inoxDark, 0, 3, 3, 70, 183, 66);
  B(g, M.black, 0, 0, 3, 66, 3, 62);
  B(g, M.inox, 0, 3, -32, 70, 66, 5);
  B(g, M.inox, 0, 70, -32, 70, 116, 5);
  B(g, M.black, 0, 69.4, -32.2, 70, 0.6, 5.2);
  B(g, M.black, -28, 72, -36, 2, 40, 2.5);
  B(g, M.black, -28, 26, -36, 2, 40, 2.5);
}
