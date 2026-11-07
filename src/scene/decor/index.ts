import * as THREE from "three";
import type { Materials } from "../materials";
import type { ItemBuild, Obstacle } from "../plan";
import { blossomDecor } from "./blossom";
import { brazilDecor } from "./brazil";
import { cozyDecor } from "./cozy";
import { eclecticDecor } from "./eclectic";
import { midDecor } from "./mid";
import type { DecorKit } from "./kit";
import type { StyleKey } from "./styles";
import { teenDecor } from "./teen";

export { createDecorKit } from "./kit";
export type { DecorKit } from "./kit";
export { STYLE_DEFAULT, STYLES } from "./styles";
export type { StyleKey } from "./styles";

export interface DecorContext {
  ceil: number;
  wallH: number;
  planning: boolean;
}

export interface Decor {
  fixed: THREE.Group;
  obstacles: Obstacle[];
  // Built into each piece of furniture, so it moves along with it.
  items: Partial<Record<ItemBuild, (group: THREE.Group) => void>>;
}

export function buildDecor(
  style: StyleKey,
  M: Materials,
  kit: DecorKit,
  context: DecorContext,
): Decor {
  if (style === "Cozy") return cozyDecor(M, kit, context);
  if (style === "Eclectic") return eclecticDecor(M, kit, context);
  if (style === "Teen Loft") return teenDecor(M, kit, context);
  if (style === "Blossom") return blossomDecor(M, kit, context);
  if (style === "Brazilian Modern") return brazilDecor(M, kit, context);
  if (style === "Mid-Century") return midDecor(M, kit, context);
  return { fixed: new THREE.Group(), obstacles: [], items: {} };
}
