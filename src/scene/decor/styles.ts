import type { PaletteSelection } from "../materials";

export type StyleKey = "Original" | "Cozy" | "Eclectic" | "Teen Loft" | "Blossom" | "Brazilian Modern";

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
  // Fun and cozy city loft: exposed brick, a retro kitchen, pop colors and neon shapes
  "Teen Loft": {
    swatch: "#e8578f",
    palette: {
      cabinetry: "Teal + wood",
      walls: "Butter",
      sofa: "Plum",
      granite: "Dallas White",
      floor: "Honey wood",
    },
    sun: "#fff3e2",
    sunIntensity: 1,
    hemiSky: "#fff4e6",
    hemiGround: "#c9a07a",
    roomLight: "#ffc79a",
    roomIntensity: 2.2,
  },
  // Romantic and soft: cherry blossom trees with fairy lights, painted panels and
  // pothos vines over cream, dusty rose and sage
  Blossom: {
    swatch: "#e6a3b4",
    palette: {
      cabinetry: "Blush + oak",
      walls: "Cream",
      sofa: "Dusty rose",
      granite: "Dallas White",
      floor: "Light wood",
    },
    sun: "#fff1e4",
    sunIntensity: 1,
    hemiSky: "#fff3ea",
    hemiGround: "#c9a99a",
    roomLight: "#ffc4a8",
    roomIntensity: 2.1,
  },
  // Warm and modern Brazilian: color blocking in terracotta, olive and mustard,
  // natural fibers, wood shelves, plants and black track lights
  "Brazilian Modern": {
    swatch: "#a2563c",
    palette: {
      cabinetry: "Sage + freijó",
      walls: "Cream",
      sofa: "Beige",
      granite: "São Gabriel Black",
      floor: "Chevron oak",
    },
    sun: "#ffe9cc",
    sunIntensity: 1.05,
    hemiSky: "#fff1de",
    hemiGround: "#c99a74",
    roomLight: "#ffc48a",
    roomIntensity: 2.2,
  },
};
