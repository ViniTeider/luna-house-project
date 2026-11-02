import * as THREE from 'three';
import { B } from './furniture.js';
import { WALLS, OPEN_PLAN, FLOOR_RECTS, CEILING_RECTS, RAILING, DOORS } from './plan.js';

const cm = (v) => v / 100;

function capped(mesh, M) {
  // Face +Y escura: é o que dá a leitura de planta baixa na vista de cima.
  mesh.material = [M.wall, M.wall, M.cap, M.wall, M.wall, M.wall];
  return mesh;
}

function windowUnit(g, M, horizontal, wall, op, wallH) {
  const top = Math.min(op.head, wallH);
  if (top <= op.sill) return;
  const c = horizontal ? (wall.y0 + wall.y1) / 2 : (wall.x0 + wall.x1) / 2;
  const len = op.b - op.a;
  const mid = (op.a + op.b) / 2;
  const h = top - op.sill;
  const box = (mat, along, by, alongLen, height, thick) =>
    horizontal
      ? B(g, mat, along, by, c, alongLen, height, thick)
      : B(g, mat, c, by, along, thick, height, alongLen);

  const glass = box(M.glass, mid, op.sill, len, h, 1);
  glass.castShadow = false;
  box(M.frame, op.a + 1, op.sill, 2, h, 5);
  box(M.frame, op.b - 1, op.sill, 2, h, 5);
  box(M.frame, mid, op.sill, 2, h, 4);
  box(M.frame, mid, op.sill, len, 2, 5);
  if (top === op.head) box(M.frame, mid, top - 2, len, 2, 5);
}

function slidingUnit(g, M, wall, op, wallH) {
  const top = Math.min(op.head, wallH);
  const cx = (wall.x0 + wall.x1) / 2;
  const leaf = (op.b - op.a) / 2 + 2;
  const panel = (x, a) => {
    const glass = B(g, M.glass, x, 2, a + leaf / 2, 1, top - 4, leaf);
    glass.castShadow = false;
    B(g, M.frame, x, 0, a + 1, 3, top, 2.4);
    B(g, M.frame, x, 0, a + leaf - 1, 3, top, 2.4);
  };
  panel(cx - 2, op.a);
  // Folha de correr aberta, sobreposta à folha fixa
  panel(cx + 2, op.a + 28);
  B(g, M.frame, cx, 0, (op.a + op.b) / 2, 8, 1.5, op.b - op.a);
  if (top === op.head) B(g, M.frame, cx, top - 3, (op.a + op.b) / 2, 8, 3, op.b - op.a);
}

export function buildWalls(M, wallH) {
  const g = new THREE.Group();
  for (const w of WALLS) {
    const horizontal = w.x1 - w.x0 > w.y1 - w.y0;
    const [start, end] = horizontal ? [w.x0, w.x1] : [w.y0, w.y1];
    const piece = (a, b, by, top) => {
      if (b <= a || top <= by) return;
      const mesh = horizontal
        ? B(g, M.wall, (a + b) / 2, by, (w.y0 + w.y1) / 2, b - a, top - by, w.y1 - w.y0)
        : B(g, M.wall, (w.x0 + w.x1) / 2, by, (a + b) / 2, w.x1 - w.x0, top - by, b - a);
      capped(mesh, M);
    };

    let cursor = start;
    const openings = [...(w.openings ?? [])].sort((p, q) => p.a - q.a);
    for (const op of openings) {
      piece(cursor, op.a, 0, wallH);
      piece(op.a, op.b, 0, Math.min(op.sill, wallH));
      piece(op.a, op.b, op.head, wallH);
      cursor = op.b;
      if (op.type === 'window') windowUnit(g, M, horizontal, w, op, wallH);
      if (op.type === 'sliding') slidingUnit(g, M, w, op, wallH);
    }
    piece(cursor, end, 0, wallH);
  }

  // Guarda-corpo de vidro, 110 cm conforme a planta
  const r = RAILING;
  const glass = B(g, M.glass, (r.x0 + r.x1) / 2, 4, (r.y0 + r.y1) / 2, 1.2, r.h - 7, r.y1 - r.y0);
  glass.castShadow = false;
  B(g, M.frame, (r.x0 + r.x1) / 2, r.h - 3, (r.y0 + r.y1) / 2, 4, 3, r.y1 - r.y0);
  B(g, M.frame, (r.x0 + r.x1) / 2, 0, (r.y0 + r.y1) / 2, 4, 4, r.y1 - r.y0);
  return g;
}

// Retângulos sólidos para colisão e para medir distâncias. Portas ficam livres; janelas não.
export function wallBlockers() {
  const out = [];
  for (const w of WALLS) {
    const horizontal = w.x1 - w.x0 > w.y1 - w.y0;
    const [start, end] = horizontal ? [w.x0, w.x1] : [w.y0, w.y1];
    const rect = (a, b) =>
      horizontal
        ? { x0: a, x1: b, y0: w.y0, y1: w.y1, label: 'parede' }
        : { x0: w.x0, x1: w.x1, y0: a, y1: b, label: 'parede' };
    let cursor = start;
    for (const op of [...(w.openings ?? [])].sort((p, q) => p.a - q.a)) {
      if (op.sill > 0) continue;
      if (op.a > cursor) out.push(rect(cursor, op.a));
      cursor = op.b;
    }
    if (end > cursor) out.push(rect(cursor, end));
  }
  return out;
}

function rectShape({ x0, y0, x1, y1 }) {
  const s = new THREE.Shape();
  s.moveTo(cm(x0), cm(-y0));
  s.lineTo(cm(x1), cm(-y0));
  s.lineTo(cm(x1), cm(-y1));
  s.lineTo(cm(x0), cm(-y1));
  s.closePath();
  return s;
}

function flat(shape, mat, y) {
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildFloors(M) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.1, 7.48), M.cap);
  base.position.set(cm(240), -0.052, cm(-1));
  base.receiveShadow = true;
  g.add(base);

  const open = new THREE.Shape();
  OPEN_PLAN.forEach(([x, y], i) => (i ? open.lineTo(cm(x), cm(-y)) : open.moveTo(cm(x), cm(-y))));
  open.closePath();
  g.add(flat(open, M.floor, 0));
  FLOOR_RECTS.wood.forEach((r) => g.add(flat(rectShape(r), M.floor, 0)));
  FLOOR_RECTS.tile.forEach((r) => g.add(flat(rectShape(r), M.tile, 0.001)));
  return g;
}

export function buildCeiling(M, h) {
  const g = new THREE.Group();
  const mat = M.ceiling.clone();
  mat.side = THREE.BackSide;
  mat.shadowSide = THREE.DoubleSide;
  CEILING_RECTS.forEach((r) => {
    const mesh = flat(rectShape(r), mat, cm(h));
    mesh.castShadow = true;
    g.add(mesh);
  });
  return g;
}

export function buildDoors(M) {
  return DOORS.map((d) => {
    const pivot = new THREE.Group();
    pivot.position.set(cm(d.hinge[0]), 0, cm(d.hinge[1]));
    B(pivot, M.door, d.width / 2, 0, 0, d.width, 208, 3.5);
    B(pivot, M.frame, d.width - 7, 100, 0, 12, 1.5, 6);
    pivot.userData.door = d;
    return pivot;
  });
}
