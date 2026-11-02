import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { createMaterials, PALETTES } from './materials.js';
import { buildItem, fitHoodDuct, buildWardrobe, buildBath, buildGrill, buildKitchen } from './furniture.js';
import { buildWalls, wallBlockers, buildFloors, buildCeiling, buildDoors } from './structure.js';
import { CEILING_DEFAULT, ITEMS, FIXED_OBSTACLES, ROOMS, VIEWS, WALK_START } from './plan.js';

const cm = (v) => v / 100;
const STORAGE_KEY = 'luna-house-v1';
const TIGHT_CM = 60; // abaixo disso a passagem fica desconfortável
const MODEL_CUT = 140;
const MODEL_CAMERA = [5.9, 9.2, 9.6];

const $ = (id) => document.getElementById(id);
const canvas = $('scene');

const saved = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}; } catch { return {}; }
})();

const state = {
  mode: 'orbit',
  ceil: saved.ceil ?? CEILING_DEFAULT,
  cut: saved.cut ?? MODEL_CUT,
  led: saved.led ?? true,
  night: saved.night ?? false,
  doorsOpen: saved.doorsOpen ?? true,
  roomsOn: saved.roomsOn ?? true,
  palette: Object.fromEntries(
    Object.entries(PALETTES).map(([k, p]) => [k, saved.palette?.[k] in p.options ? saved.palette[k] : p.default]),
  ),
};

/* Renderer e câmeras */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
RectAreaLightUniformsLib.init();

const persp = new THREE.PerspectiveCamera(42, 1, 0.05, 80);
persp.position.set(...MODEL_CAMERA);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
ortho.position.set(cm(240), 12, cm(-1));
ortho.up.set(0, 0, -1);
ortho.lookAt(cm(240), 0, cm(-1));
let camera = persp;

const orbit = new OrbitControls(persp, canvas);
orbit.target.set(cm(235), 0.5, cm(0));
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI / 2 - 0.02;
orbit.minDistance = 0.8;
orbit.maxDistance = 20;

const planControls = new OrbitControls(ortho, canvas);
planControls.target.set(cm(240), 0, cm(-1));
planControls.enableRotate = false;
planControls.enableDamping = true;
planControls.minZoom = 0.8;
planControls.maxZoom = 10;
planControls.enabled = false;

const walker = new PointerLockControls(persp, canvas);

/* Luzes */
const sun = new THREE.DirectionalLight('#fff0dc', 3.1);
sun.position.set(11, 9, -3.5);
sun.target.position.set(cm(240), 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#fff7ea', '#b6a48d', 0.9);
scene.add(hemi);

const roomLights = [[300, -235], [190, 40], [190, 240], [60, -100]].map(([x, y]) => {
  const l = new THREE.PointLight('#ffdcb0', 0, 7, 1.6);
  l.position.set(cm(x), 2.2, cm(y));
  scene.add(l);
  return l;
});

const ledBridge = new THREE.RectAreaLight('#ffcf96', 0, 1.34, 0.08);
ledBridge.position.set(cm(321), 2.03, cm(-322));
ledBridge.rotation.x = -Math.PI / 2;
const ledPoint = new THREE.PointLight('#ffc98a', 0, 3.4, 1.8);
ledPoint.position.set(cm(321), 1.85, cm(-325));
scene.add(ledBridge, ledPoint);

/* Modelo */
const M = createMaterials();
M.apply(state.palette);
scene.add(buildFloors(M));

// Posições iniciais de versões anteriores: quem não moveu a peça recebe a posição nova.
const OLD_HOME_Y = { island: [221], stool: [162, 186] };

const items = ITEMS.map((base) => {
  const pos = saved.layout?.[base.id];
  if (pos && OLD_HOME_Y[base.build]?.includes(pos.y)) pos.y = base.y;
  return { ...base, home: { x: base.x, y: base.y }, rot: pos?.rot ?? 0, x: pos?.x ?? base.x, y: pos?.y ?? base.y };
});
const itemsGroup = new THREE.Group();
scene.add(itemsGroup);
items.forEach((item) => {
  item.mesh = buildItem(item, M);
  itemsGroup.add(item.mesh);
  placeItem(item);
});

const doors = buildDoors(M);
scene.add(...doors);

let wallsGroup, wardrobeGroup, ceilingGroup, bathGroup, grillGroup, kitchenGroup;
const PLAN_CUT = 150; // altura do corte da planta baixa, como em desenho técnico

function rebuildShell() {
  if (wallsGroup) {
    const old = [wallsGroup, wardrobeGroup, ceilingGroup, bathGroup, grillGroup, kitchenGroup];
    scene.remove(...old);
    old.forEach((g) => g.traverse((o) => o.geometry?.dispose()));
  }
  const walking = state.mode === 'walk';
  const planning = state.mode === 'plan';
  const wallH = walking ? state.ceil : planning ? PLAN_CUT : Math.min(state.cut, state.ceil);
  wallsGroup = buildWalls(M, wallH);
  wardrobeGroup = buildWardrobe(M, planning ? PLAN_CUT : state.ceil);
  ceilingGroup = buildCeiling(M, state.ceil);
  ceilingGroup.visible = walking;
  bathGroup = buildBath(M, wallH);
  grillGroup = buildGrill(M, wallH);
  kitchenGroup = buildKitchen(M, !planning);
  scene.add(wallsGroup, wardrobeGroup, ceilingGroup, bathGroup, grillGroup, kitchenGroup);
  fitHoodDuct(itemsGroup, state.ceil);
  itemsGroup.traverse((o) => { if (o.userData.overhead) o.visible = !planning; });
  doors.forEach((d) => (d.scale.y = Math.min(1, wallH / 208)));
  renderer.shadowMap.needsUpdate = true;
}

function applyLighting() {
  const n = state.night;
  const planning = state.mode === 'plan';
  sun.position.set(...(planning ? [4.5, 12, 1.5] : [11, 9, -3.5]));
  sun.intensity = n ? 0 : planning ? 1.6 : 3.1;
  hemi.intensity = n ? 0.12 : state.mode === 'walk' ? 1.5 : planning ? 1.7 : 1.1;
  scene.environmentIntensity = n ? 0.08 : 0.45;
  roomLights.forEach((l) => (l.intensity = n ? 2.6 : 0));
  ledBridge.intensity = state.led ? (n ? 18 : 7) : 0;
  ledPoint.intensity = state.led ? (n ? 1.8 : 0.5) : 0;
  M.led.emissiveIntensity = state.led ? 3 : 0;
  M.led.color.set(state.led ? '#fff3df' : '#55524c');
  const inside = state.mode === 'walk' || (state.mode === 'orbit' && state.cut >= state.ceil);
  scene.background = new THREE.Color(n ? '#0d0f15' : inside ? '#cfe2ee' : '#34353a');
  renderer.shadowMap.needsUpdate = true;
}

function applyDoors() {
  doors.forEach((pivot) => {
    const d = pivot.userData.door;
    pivot.rotation.y = THREE.MathUtils.degToRad(state.doorsOpen ? d.open : d.closed);
  });
  renderer.shadowMap.needsUpdate = true;
}

/* Footprints e distâncias */
function footprint(item) {
  const [w, d] = item.rot % 2 ? [item.d, item.w] : [item.w, item.d];
  return { x0: item.x - w / 2, x1: item.x + w / 2, y0: item.y - d / 2, y1: item.y + d / 2 };
}

function placeItem(item) {
  item.mesh.position.set(cm(item.x), 0, cm(item.y));
  item.mesh.rotation.y = (-item.rot * Math.PI) / 2;
}

const walls = wallBlockers();
const fixed = [...walls, ...FIXED_OBSTACLES];

// Parte da ilha que toca o chão: o balanço do tampo gira junto com ela.
function floorFootprint(item) {
  const f = footprint(item);
  const side = [['y0', 1], ['x1', -1], ['y1', -1], ['x0', 1]][item.rot % 4];
  return { ...f, [side[0]]: f[side[0]] + side[1] * item.overhang };
}

function blockersFor(item) {
  const others = items.filter((o) => o !== item).flatMap((o) => {
    if (item.tucks && o.overhang) return [{ ...floorFootprint(o), label: o.label }];
    const rect = footprint(o);
    // Banqueta que está só sob o balanço do tampo não encosta na ilha.
    if (item.overhang && o.tucks && !overlaps(floorFootprint(item), rect)) return [];
    return [{ ...rect, label: o.label }];
  });
  return [...fixed, ...others];
}

const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// Maior folga livre nas quatro direções, até o obstáculo mais próximo.
function clearances(item) {
  const f = footprint(item);
  const others = blockersFor(item);
  const hits = others.filter((b) => overlaps(f, b));
  const dirs = [
    { axis: 'x', sign: -1, from: f.x0 },
    { axis: 'x', sign: 1, from: f.x1 },
    { axis: 'y', sign: -1, from: f.y0 },
    { axis: 'y', sign: 1, from: f.y1 },
  ];
  const results = dirs.map((dir) => {
    let best = null;
    for (const b of others) {
      const lateral = dir.axis === 'x' ? b.y0 < f.y1 && b.y1 > f.y0 : b.x0 < f.x1 && b.x1 > f.x0;
      if (!lateral) continue;
      const edge = dir.axis === 'x' ? (dir.sign < 0 ? b.x1 : b.x0) : dir.sign < 0 ? b.y1 : b.y0;
      const dist = (edge - dir.from) * dir.sign;
      if (dist >= -0.01 && (!best || dist < best.dist)) best = { dist: Math.max(0, dist), edge, label: b.label };
    }
    return best && { ...dir, ...best };
  });
  return { results: results.filter(Boolean), hits, f };
}

/* Rótulos em HTML posicionados sobre o canvas */
const labelsRoot = $('labels');
const roomEls = ROOMS.map((room) => {
  const el = document.createElement('div');
  el.className = 'room-label';
  el.innerHTML = `<strong>${room.name}</strong>${room.size}`;
  labelsRoot.append(el);
  return { el, pos: new THREE.Vector3(cm(room.x), 0.3, cm(room.y)) };
});
const distEls = Array.from({ length: 4 }, () => {
  const el = document.createElement('div');
  el.className = 'dist-label';
  el.hidden = true;
  labelsRoot.append(el);
  return el;
});
const distPositions = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

function project(el, pos) {
  const p = pos.clone().project(camera);
  const visible = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
  el.style.visibility = visible ? 'visible' : 'hidden';
  const x = ((p.x + 1) / 2) * innerWidth;
  const y = ((1 - p.y) / 2) * innerHeight;
  el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
}

const distLineGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(8 * 3), 3));
const distLines = new THREE.LineSegments(
  distLineGeo,
  new THREE.LineBasicMaterial({ color: '#ffffff', depthTest: false, transparent: true }),
);
distLines.renderOrder = 10;
distLines.frustumCulled = false;
distLines.visible = false;
scene.add(distLines);

const outlineGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(8 * 3), 3));
const outline = new THREE.LineSegments(
  outlineGeo,
  new THREE.LineBasicMaterial({ color: '#8fdf8b', depthTest: false, transparent: true }),
);
outline.renderOrder = 11;
outline.frustumCulled = false;
outline.visible = false;
scene.add(outline);

let selected = null;

function updateHud() {
  const inspector = $('inspector');
  $('tip').hidden = !!selected || state.mode === 'walk';
  if (!selected || state.mode === 'walk') {
    inspector.hidden = true;
    distLines.visible = outline.visible = false;
    distEls.forEach((el) => (el.hidden = true));
    return;
  }
  inspector.hidden = false;
  const { results, hits, f } = clearances(selected);
  const w = f.x1 - f.x0, d = f.y1 - f.y0;
  $('itemName').textContent = selected.label;
  $('itemSize').textContent = `${w} × ${d} cm`;

  const line = distLineGeo.attributes.position;
  const y = 0.03;
  const midX = (f.x0 + f.x1) / 2, midY = (f.y0 + f.y1) / 2;
  distEls.forEach((el) => (el.hidden = true));
  results.forEach((r, i) => {
    const start = r.axis === 'x' ? [r.from, midY] : [midX, r.from];
    const end = r.axis === 'x' ? [r.edge, midY] : [midX, r.edge];
    line.setXYZ(i * 2, cm(start[0]), y, cm(start[1]));
    line.setXYZ(i * 2 + 1, cm(end[0]), y, cm(end[1]));
    const el = distEls[i];
    el.hidden = false;
    const rounded = Math.round(r.dist);
    el.textContent = `${rounded} cm`;
    el.title = `até ${r.label}`;
    el.className = `dist-label${hits.length || rounded === 0 ? ' touch' : rounded < TIGHT_CM ? ' tight' : ''}`;
    distPositions[i].set(cm((start[0] + end[0]) / 2), 0.05, cm((start[1] + end[1]) / 2));
  });
  for (let i = results.length * 2; i < 8; i++) line.setXYZ(i, 0, 0, 0);
  line.needsUpdate = true;
  distLines.visible = true;

  const corners = [[f.x0, f.y0], [f.x1, f.y0], [f.x1, f.y1], [f.x0, f.y1]];
  const op = outlineGeo.attributes.position;
  corners.forEach(([x, z], i) => {
    const [nx, nz] = corners[(i + 1) % 4];
    op.setXYZ(i * 2, cm(x), y, cm(z));
    op.setXYZ(i * 2 + 1, cm(nx), y, cm(nz));
  });
  op.needsUpdate = true;
  outline.material.color.set(hits.length ? '#ff6b5e' : '#8fdf8b');
  outline.visible = true;

  const warn = $('itemWarn');
  if (hits.length) {
    const names = [...new Set(hits.map((h) => h.label))].join(', ');
    warn.textContent = `Colidindo com: ${names}.`;
    warn.classList.add('danger');
    warn.hidden = false;
  } else {
    const tight = results.filter((r) => r.dist > 0 && r.dist < TIGHT_CM);
    warn.classList.remove('danger');
    warn.hidden = tight.length === 0;
    if (tight.length) {
      warn.textContent = `Passagem apertada: ${tight.map((r) => `${Math.round(r.dist)} cm até ${r.label}`).join('; ')}.`;
    }
  }
}

function select(item) {
  selected = item;
  updateHud();
}

function moved(merge = false) {
  renderer.shadowMap.needsUpdate = true;
  updateHud();
  persist();
  commit(merge);
}

function persist() {
  const layout = Object.fromEntries(items.map((i) => [i.id, { x: i.x, y: i.y, rot: i.rot }]));
  const { ceil, cut, led, night, doorsOpen, roomsOn, palette } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ceil, cut, led, night, doorsOpen, roomsOn, palette, layout }));
}

/* Desfazer e refazer. O corte das paredes fica de fora porque só muda a vista. */
const HISTORY_LIMIT = 100;
const MERGE_MS = 800;
const undoStack = [];
const redoStack = [];

function snapshot() {
  const { ceil, led, night, doorsOpen, roomsOn, palette } = state;
  const layout = Object.fromEntries(items.map((i) => [i.id, { x: i.x, y: i.y, rot: i.rot }]));
  return JSON.stringify({ ceil, led, night, doorsOpen, roomsOn, palette, layout });
}

let current = snapshot();
let lastMerge = 0;

function syncHistoryButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

// merge: toques seguidos nas setas contam como uma ação só.
function commit(merge = false) {
  const next = snapshot();
  if (next === current) return;
  const now = performance.now();
  if (!(merge && now - lastMerge < MERGE_MS)) undoStack.push(current);
  lastMerge = merge ? now : 0;
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack.length = 0;
  current = next;
  syncHistoryButtons();
}

function restore(json) {
  const { layout, palette, ...rest } = JSON.parse(json);
  Object.assign(state, rest, { palette });
  items.forEach((i) => {
    Object.assign(i, layout[i.id]);
    placeItem(i);
  });
  current = json;
  lastMerge = 0;
  M.apply(state.palette);
  renderPalettes();
  syncForm();
  rebuildShell();
  applyLighting();
  applyDoors();
  updateHud();
  persist();
  syncHistoryButtons();
}

function undo() {
  if (!undoStack.length || drag) return;
  redoStack.push(current);
  restore(undoStack.pop());
}

function redo() {
  if (!redoStack.length || drag) return;
  undoStack.push(current);
  restore(redoStack.pop());
}

/* Arrastar móveis */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragPoint = new THREE.Vector3();
let drag = null;
let pressed = null;

function setPointer(e) {
  const rect = canvas.getBoundingClientRect();
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
}

function pickItem() {
  const hit = raycaster.intersectObjects(itemsGroup.children, true)[0];
  if (!hit) return null;
  let o = hit.object;
  while (o && !o.userData.item) o = o.parent;
  return o ? { item: o.userData.item, y: hit.point.y } : null;
}

canvas.addEventListener('pointerdown', (e) => {
  if (state.mode === 'walk') {
    if (!walker.isLocked) walker.lock();
    return;
  }
  setPointer(e);
  pressed = { x: e.clientX, y: e.clientY };
  const hit = pickItem();
  if (!hit) return;
  select(hit.item);
  dragPlane.constant = -hit.y;
  raycaster.ray.intersectPlane(dragPlane, dragPoint);
  drag = { item: hit.item, dx: hit.item.x - dragPoint.x * 100, dy: hit.item.y - dragPoint.z * 100 };
  orbit.enabled = planControls.enabled = false;
  canvas.setPointerCapture(e.pointerId);
}, { capture: true }); // antes do OrbitControls, para o arrasto não girar a câmera

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  setPointer(e);
  if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
  drag.item.x = Math.round(dragPoint.x * 100 + drag.dx);
  drag.item.y = Math.round(dragPoint.z * 100 + drag.dy);
  placeItem(drag.item);
  renderer.shadowMap.needsUpdate = true;
  updateHud();
});

canvas.addEventListener('pointerup', (e) => {
  if (drag) {
    drag = null;
    syncControls();
    moved();
  } else if (pressed && Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) < 4 && state.mode !== 'walk') {
    select(null);
  }
  pressed = null;
});

function rotateSelected() {
  if (!selected) return;
  selected.rot = (selected.rot + 1) % 4;
  placeItem(selected);
  moved();
}

addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) {
    const redoKey = e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey);
    if (e.code === 'KeyZ' || redoKey) {
      e.preventDefault();
      if (redoKey) redo();
      else undo();
    }
    return;
  }
  if (state.mode === 'walk') {
    keys.add(e.code);
    return;
  }
  if (!selected) return;
  const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.code];
  if (step) {
    e.preventDefault();
    selected.x += step[0];
    selected.y += step[1];
    placeItem(selected);
    moved(true);
  } else if (e.code === 'KeyR') {
    rotateSelected();
  } else if (e.code === 'Escape') {
    select(null);
  }
});
addEventListener('keyup', (e) => keys.delete(e.code));

/* Caminhar */
const keys = new Set();
const RADIUS = 15; // deixa passar pelos corredores de 35 cm do projeto
const walkDir = new THREE.Vector3();
const walkRight = new THREE.Vector3();

function blocked(x, y) {
  const near = (b) => x > b.x0 - RADIUS && x < b.x1 + RADIUS && y > b.y0 - RADIUS && y < b.y1 + RADIUS;
  return fixed.some(near) || items.some((i) => near(footprint(i)));
}

function stepWalk(dt) {
  if (!walker.isLocked) return;
  const forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const side = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  if (!forward && !side) return;
  camera.getWorldDirection(walkDir);
  walkDir.y = 0;
  walkDir.normalize();
  walkRight.crossVectors(walkDir, camera.up);
  const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 2.4 : 1.4) * dt;
  const move = walkDir.multiplyScalar(forward).addScaledVector(walkRight, side).normalize().multiplyScalar(speed);
  const x = camera.position.x * 100, y = camera.position.z * 100;
  const nx = x + move.x * 100, ny = y + move.z * 100;
  // Cada eixo é testado separadamente para deslizar junto às paredes.
  if (!blocked(nx, y)) camera.position.x = nx / 100;
  if (!blocked(camera.position.x * 100, ny)) camera.position.z = ny / 100;
}

walker.addEventListener('lock', () => ($('walkhint').hidden = true));
walker.addEventListener('unlock', () => {
  if (state.mode === 'walk') $('walkhint').hidden = false;
});

/* Modos e interface */
function syncControls() {
  orbit.enabled = state.mode === 'orbit';
  planControls.enabled = state.mode === 'plan';
}

function setMode(mode) {
  if (walker.isLocked) walker.unlock();
  state.mode = mode;
  document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  document.body.classList.toggle('walking', mode === 'walk');
  camera = mode === 'plan' ? ortho : persp;
  $('walkhint').hidden = mode !== 'walk';
  if (mode === 'walk') {
    persp.fov = 70;
    persp.position.set(cm(WALK_START.x), 1.6, cm(WALK_START.y));
    persp.rotation.set(0, WALK_START.yaw, 0, 'YXZ');
    select(null);
  } else {
    persp.fov = 42;
  }
  persp.updateProjectionMatrix();
  syncControls();
  rebuildShell();
  applyLighting();
  resize();
  updateHud();
}

function setCut(value) {
  state.cut = value;
  $('cut').value = value;
  $('cut').oninput();
}

function goToView(name) {
  const v = VIEWS[name];
  if (state.mode !== 'orbit') setMode('orbit');
  persp.fov = 66;
  persp.updateProjectionMatrix();
  setCut(280);
  persp.position.set(...v.pos.map(cm));
  orbit.target.set(...v.target.map(cm));
  orbit.update();
}

function goToOverview() {
  setMode('orbit');
  setCut(MODEL_CUT);
  persp.position.set(...MODEL_CAMERA);
  orbit.target.set(cm(235), 0.5, 0);
  orbit.update();
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  persp.aspect = w / h;
  // Desloca a imagem para o centro da área livre, à direita do painel.
  const panelGap = state.mode !== 'walk' && w > 720 ? 136 : 0;
  if (panelGap) persp.setViewOffset(w, h, -panelGap, 0, w, h);
  else persp.clearViewOffset();
  persp.updateProjectionMatrix();

  const halfH = 4.3;
  const halfW = halfH * (w / h);
  const shift = (panelGap / h) * 2 * halfH;
  const lift = 0.2;
  Object.assign(ortho, { left: -halfW - shift, right: halfW - shift, top: halfH + lift, bottom: -halfH + lift });
  ortho.updateProjectionMatrix();
}
addEventListener('resize', resize);

function renderPalettes() {
  const root = $('palettes');
  root.innerHTML = '<h2>Paletas</h2>';
  for (const [key, group] of Object.entries(PALETTES)) {
    const wrap = document.createElement('div');
    wrap.className = 'palette';
    wrap.innerHTML = `<div class="hint">${group.label}</div>`;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const [name, values] of Object.entries(group.options)) {
      const b = document.createElement('button');
      b.className = state.palette[key] === name ? 'active' : '';
      const color = values.main ?? values.wall ?? values.sofa ?? values.floor ?? values.granite.base;
      b.innerHTML = `<span class="swatch" style="background:${color}"></span>${name}`;
      b.onclick = () => {
        state.palette[key] = name;
        M.apply(state.palette);
        renderPalettes();
        persist();
        commit();
      };
      chips.append(b);
    }
    wrap.append(chips);
    root.append(wrap);
  }
}

function syncForm() {
  const meters = (v) => `${(v / 100).toFixed(2).replace('.', ',')} m`;
  $('ceil').value = state.ceil;
  $('cut').value = state.cut;
  $('ceilOut').textContent = meters(state.ceil);
  $('cutOut').textContent = state.cut >= state.ceil ? 'sem corte' : meters(state.cut);
  $('led').checked = state.led;
  $('night').checked = state.night;
  $('doors').checked = state.doorsOpen;
  $('rooms').checked = state.roomsOn;
}

function bindUI() {
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.onclick = () => (b.dataset.mode === 'orbit' ? goToOverview() : setMode(b.dataset.mode));
  });
  const views = $('views');
  Object.keys(VIEWS).forEach((name) => {
    const b = document.createElement('button');
    b.textContent = name;
    b.onclick = () => goToView(name);
    views.append(b);
  });

  const ceil = $('ceil'), cut = $('cut');
  syncForm();
  ceil.oninput = () => { state.ceil = +ceil.value; syncForm(); rebuildShell(); persist(); };
  ceil.onchange = () => commit();
  cut.oninput = () => { state.cut = +cut.value; syncForm(); rebuildShell(); applyLighting(); persist(); };

  const toggle = (id, key, fn) => {
    const el = $(id);
    el.onchange = () => { state[key] = el.checked; fn(); persist(); commit(); };
  };
  toggle('led', 'led', applyLighting);
  toggle('night', 'night', applyLighting);
  toggle('doors', 'doorsOpen', applyDoors);
  toggle('rooms', 'roomsOn', () => {});

  syncForm();
  $('undo').onclick = undo;
  $('redo').onclick = redo;
  $('rotate').onclick = rotateSelected;
  $('deselect').onclick = () => select(null);
  $('reset').onclick = () => {
    items.forEach((i) => {
      i.x = i.home.x;
      i.y = i.home.y;
      i.rot = 0;
      placeItem(i);
    });
    select(null);
    moved();
  };
}

/* Laço principal */
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (state.mode === 'orbit') orbit.update();
  if (state.mode === 'plan') planControls.update();
  stepWalk(dt);

  const showRooms = state.roomsOn && state.mode === 'plan';
  roomEls.forEach(({ el, pos }) => {
    el.hidden = !showRooms;
    if (showRooms) project(el, pos);
  });
  distEls.forEach((el, i) => { if (!el.hidden) project(el, distPositions[i]); });

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

renderPalettes();
bindUI();
syncHistoryButtons();
resize();
rebuildShell();
applyLighting();
applyDoors();
requestAnimationFrame(frame);

// Usado para conferir o layout e gerar capturas.
window.__luna = {
  items, state, scene, THREE, undoStack, redoStack, setMode, goToView, select, clearances, blocked, camera: () => camera,
  byId: (id) => items.find((i) => i.id === id),
  screenOf: (id) => {
    const i = items.find((o) => o.id === id);
    const p = new THREE.Vector3(cm(i.x), 1.0, cm(i.y)).project(camera);
    return [((p.x + 1) / 2) * innerWidth, ((1 - p.y) / 2) * innerHeight];
  },
};
