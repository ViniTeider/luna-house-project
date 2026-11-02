import * as THREE from "three";
import type { Materials } from "../materials";
import type { ItemBuild, ItemSpec } from "../plan";
import { bed } from "./bed";
import { chair } from "./chair";
import { desk } from "./desk";
import { fridge } from "./fridge";
import { island } from "./island";
import { rack } from "./rack";
import { robot } from "./robot";
import { sink } from "./sink";
import { sofa } from "./sofa";
import { stool } from "./stool";
import { stove } from "./stove";
import { washer } from "./washer";

export { buildBath } from "./bath";
export { buildGrill } from "./grill";
export { buildKitchen } from "./kitchen";
export { createProjection, PROJECTION_TOP } from "./projector";
export { fitHoodDuct } from "./stove";
export { buildWardrobe } from "./wardrobe";

// Size references: 55" TV 122.6 cm wide (owner's measurement) and 71 cm tall without feet, Mouse 10.4×7.1×3.8 cm,
// gaming chair 123–131 cm tall, slim dishwasher 45×60×85 cm.
// Other furniture widths and depths come from Figma; heights follow market standards.

const BUILDERS: Record<ItemBuild, (g: THREE.Group, M: Materials) => void> = {
  rack,
  sofa,
  desk,
  chair,
  island,
  stool,
  bed,
  fridge,
  sink,
  stove,
  washer,
  robot,
};

export function buildItem(item: ItemSpec, M: Materials) {
  const group = new THREE.Group();
  BUILDERS[item.build](group, M);
  group.userData.item = item;
  return group;
}
