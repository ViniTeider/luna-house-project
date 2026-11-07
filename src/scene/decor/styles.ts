import type { PaletteSelection } from "../materials";

export type StyleKey = "Original" | "Cozy" | "Eclectic";

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
  // Collected and colorful: white and light wood as a base, earthy color in paint, art and textiles
  Eclectic: {
    swatch: "#a4532f",
    palette: {
      cabinetry: "White + wood",
      walls: "Off-white",
      sofa: "Sage",
      granite: "Dallas White",
      floor: "Light wood",
    },
    sun: "#fff6ea",
    sunIntensity: 1.05,
    hemiSky: "#f7f6f2",
    hemiGround: "#c9b8a0",
    roomLight: "#ffd2a0",
    roomIntensity: 2.3,
  },
};
