// Geometria do apartamento, em centímetros, extraída das cotas da planta da construtora.
// Origem: canto noroeste interno da sala. X cresce para leste, Y cresce para sul.
// Conferência: 135 + 105 + 160 = 400 (largura da sala) e sala com 353 de altura.

export const CEILING_DEFAULT = 250; // a planta não informa; ajustável na interface

const DOOR = 'door';
const WINDOW = 'window';
const SLIDING = 'sliding';

// a/b: início e fim da abertura ao longo do eixo da parede. sill/head: peitoril e topo.
export const WALLS = [
  { x0: 29, y0: -370, x1: 475, y1: -355 }, // norte
  { x0: 29, y0: -355, x1: 44, y1: -253 }, // poço de ventilação, lado oeste
  {
    x0: -15, y0: -253, x1: 118, y1: -238, // norte do banheiro
    openings: [{ a: 45, b: 105, sill: 160, head: 220, type: WINDOW }],
  },
  {
    x0: -15, y0: -253, x1: 0, y1: 368, // oeste
    openings: [{ a: 174, b: 254, sill: 0, head: 210, type: DOOR }],
  },
  { x0: 0, y0: -15, x1: 118, y1: 0 }, // sul do banheiro
  {
    x0: 118, y0: -355, x1: 135, y1: 0, // banheiro / dormitório / corredor
    openings: [{ a: -88, b: -28, sill: 0, head: 210, type: DOOR }],
  },
  { x0: 135, y0: -115, x1: 145, y1: -91 }, // boneca ao lado da porta do dormitório
  {
    x0: 135, y0: -115, x1: 494, y1: -100, // dormitório / sala (parede do rack)
    openings: [{ a: 147, b: 217, sill: 0, head: 210, type: DOOR }],
  },
  {
    x0: 460, y0: -355, x1: 475, y1: -115, // leste do dormitório
    openings: [{ a: -300, b: -150, sill: 70, head: 220, type: WINDOW }],
  },
  {
    x0: 479, y0: -100, x1: 494, y1: 80, // leste da antiga área do escritório
    openings: [{ a: -60, b: 60, sill: 110, head: 220, type: WINDOW }],
  },
  { x0: 399, y0: 80, x1: 494, y1: 97 }, // estrutura entre sala e sacada
  {
    x0: 399, y0: 97, x1: 414, y1: 353, // sala / sacada
    openings: [{ a: 120, b: 270, sill: 0, head: 220, type: SLIDING }],
  },
  {
    x0: 414, y0: 284, x1: 479, y1: 292, // frente do nicho da churrasqueira
    openings: [{ a: 436, b: 473, sill: 85, head: 175, type: 'grill' }],
  },
  { x0: 479, y0: 284, x1: 494, y1: 368 }, // leste do nicho
  { x0: -15, y0: 353, x1: 494, y1: 368 }, // sul
  { x0: 340, y0: 332, x1: 399, y1: 353 }, // shaft da cozinha
  { x0: 0, y0: -238, x1: 22, y1: -159 }, // shaft do banheiro
];

// A parede de drywall em L do escritório foi removida, por isso sala e escritório são um só ambiente.
export const OPEN_PLAN = [
  [0, 0], [135, 0], [135, -100], [479, -100], [479, 80], [399, 80],
  [399, 353], [0, 353],
];

export const FLOOR_RECTS = {
  wood: [
    { x0: 135, y0: -355, x1: 460, y1: -115 }, // dormitório
    { x0: 147, y0: -115, x1: 217, y1: -100 }, // soleira do dormitório
    { x0: 118, y0: -88, x1: 135, y1: -28 }, // soleira do banheiro
  ],
  tile: [
    { x0: 0, y0: -238, x1: 118, y1: -15 }, // banheiro
    { x0: 399, y0: 120, x1: 414, y1: 270 }, // soleira da sacada
    { x0: 414, y0: 97, x1: 486, y1: 284 }, // sacada
    { x0: 414, y0: 292, x1: 479, y1: 353 }, // nicho
  ],
};

export const CEILING_RECTS = [
  { x0: -15, y0: -253, x1: 135, y1: 0 },
  { x0: 135, y0: -370, x1: 494, y1: -100 },
  { x0: 135, y0: -100, x1: 399, y1: 0 },
  { x0: -15, y0: 0, x1: 399, y1: 368 },
  { x0: 399, y0: -100, x1: 494, y1: 97 },
  { x0: 399, y0: 97, x1: 494, y1: 368 },
];

export const RAILING = { x0: 482, y0: 97, x1: 486, y1: 284, h: 110 };

// Giro: ângulo em torno do eixo vertical. 0 = para leste, 90 = norte, 180 = oeste.
export const DOORS = [
  { id: 'dorm', hinge: [147, -107], width: 70, closed: 0, open: 90 },
  { id: 'bath', hinge: [126, -28], width: 60, closed: 90, open: 180 },
  { id: 'entry', hinge: [-7, 254], width: 80, closed: 90, open: 0 },
];

export const FIXED_OBSTACLES = [
  { x0: 135, y0: -355, x1: 252, y1: -295, label: 'guarda-roupa' },
  { x0: 390, y0: -355, x1: 460, y1: -295, label: 'guarda-roupa' },
  { x0: 0, y0: 287, x1: 12, y1: 353, label: 'bancada' },
  { x0: 340, y0: 287, x1: 399, y1: 332, label: 'bancada' },
  { x0: 22, y0: -159, x1: 118, y1: -158, label: 'box' },
  { x0: 0, y0: -148, x1: 66, y1: -112, label: 'vaso' },
  { x0: 0, y0: -90, x1: 46, y1: -30, label: 'pia' },
  { x0: RAILING.x0, y0: RAILING.y0, x1: RAILING.x1, y1: RAILING.y1, label: 'guarda-corpo' },
];

// Móveis arrastáveis. x/y são o centro. Posições iniciais vêm do Figma, reancoradas nas paredes reais.
export const ITEMS = [
  { id: 'rack', label: 'Rack + TV 55"', build: 'rack', x: 335, y: -82, w: 228, d: 36 },
  { id: 'sofa', label: 'Sofá', build: 'sofa', x: 336, y: 23.5, w: 218, d: 105 },
  { id: 'desk', label: 'Mesa do escritório', build: 'desk', x: 26, y: 85, w: 52, d: 170 },
  { id: 'chair', label: 'Cadeira gamer', build: 'chair', x: 92, y: 85, w: 60, d: 60 },
  { id: 'island', label: 'Ilha', build: 'island', x: 247, y: 196, w: 200, d: 60, overhang: 25 },
  { id: 'stool1', label: 'Banqueta 1', build: 'stool', x: 184, y: 161, w: 40, d: 40, tucks: true },
  { id: 'stool2', label: 'Banqueta 2', build: 'stool', x: 247, y: 161, w: 40, d: 40, tucks: true },
  { id: 'stool3', label: 'Banqueta 3', build: 'stool', x: 310, y: 161, w: 40, d: 40, tucks: true },
  { id: 'bed', label: 'Cama', build: 'bed', x: 321, y: -251, w: 138, d: 188 },
  { id: 'fridge', label: 'Geladeira', build: 'fridge', x: 47, y: 315.5, w: 70, d: 73 },
  { id: 'sink', label: 'Pia + lava-louças', build: 'sink', x: 150, y: 320, w: 136, d: 66 },
  { id: 'stove', label: 'Fogão', build: 'stove', x: 249, y: 319.5, w: 62, d: 67 },
  { id: 'washer', label: 'Máquina de lavar', build: 'washer', x: 310, y: 317, w: 60, d: 60 },
  { id: 'robot', label: 'Robô aspirador S40+', build: 'robot', x: 376, y: 105, w: 46, d: 34 },
];

export const ROOMS = [
  { name: 'Dormitório', size: '3,25 × 2,40 m', x: 297, y: -130 },
  { name: 'Banheiro', size: '1,18 × 2,23 m', x: 72, y: -55 },
  { name: 'Sala / Escritório', size: 'integrados', x: 170, y: 25 },
  { name: 'Cozinha', size: '4,00 m de parede', x: 100, y: 268 },
  { name: 'Sacada', size: '0,68 × 1,87 m', x: 448, y: 190 },
];

// [x, altura, y] em cm, vistos de dentro de cada ambiente.
export const VIEWS = {
  Quarto: { pos: [445, 165, -125], target: [290, 105, -345] },
  Sala: { pos: [150, 150, 85], target: [345, 90, -100] },
  Escritório: { pos: [205, 150, 135], target: [15, 85, 75] },
  Cozinha: { pos: [55, 165, 150], target: [235, 100, 345] },
  Banheiro: { pos: [92, 155, -42], target: [20, 70, -205] },
  Sacada: { pos: [450, 150, 104], target: [448, 70, 300] },
};

export const WALK_START = { x: 40, y: 215, yaw: -Math.PI / 2 };
