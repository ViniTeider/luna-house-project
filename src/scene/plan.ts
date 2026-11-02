// Apartment geometry in centimeters, taken from the dimensions on the builder's plan.
// Origin: inner northwest corner of the living room. X grows east, Y grows south.
// Check: 135 + 105 + 160 = 400 (living room width), with the living room 353 long.

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type OpeningType = 'door' | 'window' | 'sliding' | 'grill';

export interface Opening {
  a: number;
  b: number;
  sill: number;
  head: number;
  type: OpeningType;
}

export interface Wall extends Rect {
  openings?: Opening[];
}

export interface Obstacle extends Rect {
  label: string;
}

export interface DoorSpec {
  id: string;
  hinge: [number, number];
  width: number;
  closed: number;
  open: number;
}

export type ItemBuild =
  | 'rack' | 'sofa' | 'desk' | 'chair' | 'island' | 'stool'
  | 'bed' | 'fridge' | 'sink' | 'stove' | 'washer' | 'robot';

export interface ItemSpec {
  id: string;
  label: string;
  build: ItemBuild;
  x: number;
  y: number;
  w: number;
  d: number;
  overhang?: number;
  tucks?: boolean;
}

export interface Room {
  name: string;
  size: string;
  x: number;
  y: number;
}

export interface CameraView {
  pos: [number, number, number];
  target: [number, number, number];
}

export const CEILING_DEFAULT = 250; // not on the plan; adjustable in the UI

const DOOR = 'door' as const;
const WINDOW = 'window' as const;
const SLIDING = 'sliding' as const;

// a/b: start and end of the opening along the wall axis. sill/head: bottom and top.
export const WALLS: Wall[] = [
  { x0: 29, y0: -370, x1: 475, y1: -355 }, // north
  { x0: 29, y0: -355, x1: 44, y1: -253 }, // ventilation shaft, west side
  {
    x0: -15, y0: -253, x1: 118, y1: -238, // bathroom north
    openings: [{ a: 45, b: 105, sill: 160, head: 220, type: WINDOW }],
  },
  {
    x0: -15, y0: -253, x1: 0, y1: 368, // west
    openings: [{ a: 174, b: 254, sill: 0, head: 210, type: DOOR }],
  },
  { x0: 0, y0: -15, x1: 118, y1: 0 }, // bathroom south
  {
    x0: 118, y0: -355, x1: 135, y1: 0, // bathroom / bedroom / hallway
    openings: [{ a: -88, b: -28, sill: 0, head: 210, type: DOOR }],
  },
  { x0: 135, y0: -115, x1: 145, y1: -91 }, // wall stub next to the bedroom door
  {
    x0: 135, y0: -115, x1: 494, y1: -100, // bedroom / living room (TV unit wall)
    openings: [{ a: 147, b: 217, sill: 0, head: 210, type: DOOR }],
  },
  {
    x0: 460, y0: -355, x1: 475, y1: -115, // bedroom east
    openings: [{ a: -300, b: -150, sill: 70, head: 220, type: WINDOW }],
  },
  {
    x0: 479, y0: -100, x1: 494, y1: 80, // east of the former office area
    openings: [{ a: -60, b: 60, sill: 110, head: 220, type: WINDOW }],
  },
  { x0: 399, y0: 80, x1: 494, y1: 97 }, // structure between living room and balcony
  {
    x0: 399, y0: 97, x1: 414, y1: 353, // living room / balcony
    openings: [{ a: 120, b: 270, sill: 0, head: 220, type: SLIDING }],
  },
  {
    x0: 414, y0: 284, x1: 479, y1: 292, // front of the grill niche
    openings: [{ a: 436, b: 473, sill: 85, head: 175, type: 'grill' }],
  },
  { x0: 479, y0: 284, x1: 494, y1: 368 }, // niche east
  { x0: -15, y0: 353, x1: 494, y1: 368 }, // south
  { x0: 340, y0: 332, x1: 399, y1: 353 }, // kitchen shaft
  { x0: 0, y0: -238, x1: 22, y1: -159 }, // bathroom shaft
];

// The office's L-shaped drywall was removed, so living room and office are one space.
export const OPEN_PLAN: [number, number][] = [
  [0, 0], [135, 0], [135, -100], [479, -100], [479, 80], [399, 80],
  [399, 353], [0, 353],
];

export const FLOOR_RECTS: Record<'wood' | 'tile', Rect[]> = {
  wood: [
    { x0: 135, y0: -355, x1: 460, y1: -115 }, // bedroom
    { x0: 147, y0: -115, x1: 217, y1: -100 }, // bedroom threshold
    { x0: 118, y0: -88, x1: 135, y1: -28 }, // bathroom threshold
  ],
  tile: [
    { x0: 0, y0: -238, x1: 118, y1: -15 }, // bathroom
    { x0: 399, y0: 120, x1: 414, y1: 270 }, // balcony threshold
    { x0: 414, y0: 97, x1: 486, y1: 284 }, // balcony
    { x0: 414, y0: 292, x1: 479, y1: 353 }, // niche
  ],
};

export const CEILING_RECTS: Rect[] = [
  { x0: -15, y0: -253, x1: 135, y1: 0 },
  { x0: 135, y0: -370, x1: 494, y1: -100 },
  { x0: 135, y0: -100, x1: 399, y1: 0 },
  { x0: -15, y0: 0, x1: 399, y1: 368 },
  { x0: 399, y0: -100, x1: 494, y1: 97 },
  { x0: 399, y0: 97, x1: 494, y1: 368 },
];

export const RAILING = { x0: 482, y0: 97, x1: 486, y1: 284, h: 110 };

// Swing: angle around the vertical axis. 0 = east, 90 = north, 180 = west.
export const DOORS: DoorSpec[] = [
  { id: 'dorm', hinge: [147, -107], width: 70, closed: 0, open: 90 },
  { id: 'bath', hinge: [126, -28], width: 60, closed: 90, open: 180 },
  { id: 'entry', hinge: [-7, 254], width: 80, closed: 90, open: 0 },
];

export const FIXED_OBSTACLES: Obstacle[] = [
  { x0: 135, y0: -355, x1: 252, y1: -295, label: 'wardrobe' },
  { x0: 390, y0: -355, x1: 460, y1: -295, label: 'wardrobe' },
  { x0: 0, y0: 287, x1: 12, y1: 353, label: 'countertop' },
  { x0: 340, y0: 287, x1: 399, y1: 332, label: 'countertop' },
  { x0: 22, y0: -159, x1: 118, y1: -158, label: 'shower' },
  { x0: 0, y0: -148, x1: 66, y1: -112, label: 'toilet' },
  { x0: 0, y0: -90, x1: 46, y1: -30, label: 'vanity' },
  { x0: RAILING.x0, y0: RAILING.y0, x1: RAILING.x1, y1: RAILING.y1, label: 'railing' },
];

// Draggable furniture. x/y are the center. Starting positions come from Figma, re-anchored to the real walls.
export const ITEMS: ItemSpec[] = [
  { id: 'rack', label: 'TV unit + 55" TV', build: 'rack', x: 335, y: -82, w: 228, d: 36 },
  { id: 'sofa', label: 'Sofa', build: 'sofa', x: 336, y: 23.5, w: 218, d: 105 },
  { id: 'desk', label: 'Office desk', build: 'desk', x: 26, y: 85, w: 52, d: 170 },
  { id: 'chair', label: 'Gaming chair', build: 'chair', x: 92, y: 85, w: 60, d: 60 },
  { id: 'island', label: 'Island', build: 'island', x: 247, y: 196, w: 200, d: 60, overhang: 25 },
  { id: 'stool1', label: 'Stool 1', build: 'stool', x: 184, y: 161, w: 40, d: 40, tucks: true },
  { id: 'stool2', label: 'Stool 2', build: 'stool', x: 247, y: 161, w: 40, d: 40, tucks: true },
  { id: 'stool3', label: 'Stool 3', build: 'stool', x: 310, y: 161, w: 40, d: 40, tucks: true },
  { id: 'bed', label: 'Bed', build: 'bed', x: 321, y: -251, w: 138, d: 188 },
  { id: 'fridge', label: 'Fridge', build: 'fridge', x: 47, y: 315.5, w: 70, d: 73 },
  { id: 'sink', label: 'Sink + dishwasher', build: 'sink', x: 150, y: 320, w: 136, d: 66 },
  { id: 'stove', label: 'Stove', build: 'stove', x: 249, y: 319.5, w: 62, d: 67 },
  { id: 'washer', label: 'Washing machine', build: 'washer', x: 310, y: 317, w: 60, d: 60 },
  { id: 'robot', label: 'S40+ robot vacuum', build: 'robot', x: 376, y: 105, w: 46, d: 34 },
];

export const ROOMS: Room[] = [
  { name: 'Bedroom', size: '3.25 × 2.40 m', x: 297, y: -130 },
  { name: 'Bathroom', size: '1.18 × 2.23 m', x: 72, y: -55 },
  { name: 'Living / Office', size: 'open plan', x: 170, y: 25 },
  { name: 'Kitchen', size: '4.00 m wall', x: 100, y: 268 },
  { name: 'Balcony', size: '0.68 × 1.87 m', x: 448, y: 190 },
];

// [x, height, y] in cm, seen from inside each room.
export const VIEWS: Record<string, CameraView> = {
  Bedroom: { pos: [445, 165, -125], target: [290, 105, -345] },
  'Living room': { pos: [150, 150, 85], target: [345, 90, -100] },
  Office: { pos: [205, 150, 135], target: [15, 85, 75] },
  Kitchen: { pos: [55, 165, 150], target: [235, 100, 345] },
  Bathroom: { pos: [92, 155, -42], target: [20, 70, -205] },
  Balcony: { pos: [450, 150, 104], target: [448, 70, 300] },
};

export const WALK_START = { x: 40, y: 215, yaw: -Math.PI / 2 };
