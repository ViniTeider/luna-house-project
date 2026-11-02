import type { PaletteSelection } from "../materials";

export type StyleKey = "Original" | "Cozy";

interface StyleSpec {
  swatch: string;
  // Applied on top of the default palettes when the style is picked.
  palette: Partial<PaletteSelection>;
  sun: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  roomLight: string;
  roomIntensity: number;
}

export const STYLE_DEFAULT: StyleKey = "Original";

export const STYLES: Record<StyleKey, StyleSpec> = {
  Original: {
    swatch: "#17181a",
    palette: {},
    sun: "#fff0dc",
    sunIntensity: 1,
    hemiSky: "#fff7ea",
    hemiGround: "#b6a48d",
    roomLight: "#ffdcb0",
    roomIntensity: 2.6,
  },
  Cozy: {
    swatch: "#c98a4b",
    palette: {
      cabinetry: "Walnut + oak",
      walls: "Cream",
      sofa: "Beige",
      granite: "Dallas White",
      floor: "Honey wood",
    },
    sun: "#ffe0ba",
    sunIntensity: 0.85,
    hemiSky: "#ffedd6",
    hemiGround: "#c9a07a",
    roomLight: "#ffb36b",
    roomIntensity: 1.7,
  },
};
