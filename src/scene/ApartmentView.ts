import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import {
  buildBath,
  buildGrill,
  buildItem,
  buildKitchen,
  buildWardrobe,
  fitHoodDuct,
} from "./furniture";
import { createLandscape } from "./landscape";
import type { Landscape } from "./landscape";
import { createMaterials } from "./materials";
import type { Materials, PaletteSelection } from "./materials";
import { FIXED_OBSTACLES, ITEMS, ROOMS, VIEWS, WALK_START } from "./plan";
import type { DoorSpec, ItemSpec, Obstacle, Rect } from "./plan";
import {
  buildCeiling,
  buildDoors,
  buildFloors,
  buildWalls,
  wallBlockers,
} from "./structure";

const cm = (v: number) => v / 100;
const TIGHT_CM = 60; // below this a passage gets uncomfortable
const PLAN_CUT = 150; // floor plan cut height, as in technical drawings
const RADIUS = 15; // fits through the project's 35 cm passages
const MODEL_CAMERA: [number, number, number] = [5.9, 9.2, 9.6];
const MODEL_TARGET: [number, number, number] = [cm(235), 0.5, 0];
const MAX_PIXEL_RATIO = 2;
const WALK_PIXEL_RATIO = 1.5; // the whole screen is detailed materials while walking
const RENDER_AFTER_INPUT = 500; // ms, so UI changes and camera damping get drawn

export const MODEL_CUT = 140;

export type Mode = "orbit" | "plan" | "walk";

export interface Settings {
  ceil: number;
  cut: number;
  led: boolean;
  night: boolean;
  doorsOpen: boolean;
  roomsOn: boolean;
  palette: PaletteSelection;
}

export interface ItemPlacement {
  x: number;
  y: number;
  rot: number;
}

export type Layout = Record<string, ItemPlacement>;

export interface SelectionInfo {
  label: string;
  size: string;
  warning: { text: string; danger: boolean } | null;
}

export interface ViewCallbacks {
  onSelectionChange: (selection: SelectionInfo | null) => void;
  onLayoutChange: (layout: Layout, merge: boolean) => void;
  onWalkLockChange: (locked: boolean) => void;
}

interface PlacedItem extends ItemSpec, ItemPlacement {
  home: { x: number; y: number };
  mesh: THREE.Group;
}

interface Clearance {
  axis: "x" | "y";
  sign: 1 | -1;
  from: number;
  dist: number;
  edge: number;
  label: string;
}

const overlaps = (a: Rect, b: Rect) =>
  a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

function footprint(item: PlacedItem): Rect {
  const [w, d] = item.rot % 2 ? [item.d, item.w] : [item.w, item.d];
  return {
    x0: item.x - w / 2,
    x1: item.x + w / 2,
    y0: item.y - d / 2,
    y1: item.y + d / 2,
  };
}

// The part of the island that touches the floor: the top's overhang rotates with it.
function floorFootprint(item: PlacedItem): Rect {
  const f = footprint(item);
  const sides = [
    ["y0", 1],
    ["x1", -1],
    ["y1", -1],
    ["x0", 1],
  ] as const;
  const [side, sign] = sides[item.rot % 4];
  return { ...f, [side]: f[side] + sign * (item.overhang ?? 0) };
}

function placeItem(item: PlacedItem) {
  item.mesh.position.set(cm(item.x), 0, cm(item.y));
  item.mesh.rotation.y = (-item.rot * Math.PI) / 2;
}

// The 3D engine is imperative and lives outside React's render cycle. UI state
// comes in through update() and applyLayout() and goes out through the callbacks.
export class ApartmentView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly pmrem: THREE.PMREMGenerator;
  private readonly scene = new THREE.Scene();
  private readonly persp = new THREE.PerspectiveCamera(42, 1, 0.05, 3000);
  private readonly ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
  private camera: THREE.Camera = this.persp;
  private readonly orbit: OrbitControls;
  private readonly planControls: OrbitControls;
  private readonly walker: PointerLockControls;

  private readonly sun = new THREE.DirectionalLight("#fff0dc", 3.1);
  private readonly hemi = new THREE.HemisphereLight("#fff7ea", "#b6a48d", 0.9);
  private readonly roomLights: THREE.PointLight[];
  private readonly ledBridge = new THREE.RectAreaLight(
    "#ffcf96",
    0,
    1.34,
    0.08,
  );
  private readonly ledPoint = new THREE.PointLight("#ffc98a", 0, 3.4, 1.8);

  private readonly M: Materials;
  private readonly items: PlacedItem[];
  private readonly itemsGroup = new THREE.Group();
  private readonly doors: THREE.Group[];
  private readonly fixed: Obstacle[];
  private shell: THREE.Group[] = [];
  private landscape: Landscape | null = null;

  private readonly distLineGeo = new THREE.BufferGeometry();
  private readonly distLines: THREE.LineSegments;
  private readonly outlineGeo = new THREE.BufferGeometry();
  private readonly outline: THREE.LineSegments;
  private readonly roomEls: { el: HTMLDivElement; pos: THREE.Vector3 }[];
  private readonly distEls: HTMLDivElement[];
  private readonly distPositions = Array.from(
    { length: 4 },
    () => new THREE.Vector3(),
  );

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly dragPoint = new THREE.Vector3();
  private readonly walkDir = new THREE.Vector3();
  private readonly walkRight = new THREE.Vector3();
  private readonly keys = new Set<string>();
  private readonly listeners = new AbortController();

  private settings: Settings;
  private mode: Mode = "orbit";
  private selected: PlacedItem | null = null;
  private drag: { item: PlacedItem; dx: number; dy: number } | null = null;
  private pressed: { x: number; y: number } | null = null;
  private lastFrame = performance.now();
  private renderUntil = 0;
  private readonly lastView = new THREE.Matrix4();
  private raf = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly labelsRoot: HTMLElement,
    initial: { settings: Settings; layout: Layout },
    private readonly callbacks: ViewCallbacks,
  ) {
    this.settings = initial.settings;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    RectAreaLightUniformsLib.init();

    this.persp.position.set(...MODEL_CAMERA);
    this.ortho.position.set(cm(240), 12, cm(-1));
    this.ortho.up.set(0, 0, -1);
    this.ortho.lookAt(cm(240), 0, cm(-1));

    this.orbit = new OrbitControls(this.persp, canvas);
    this.orbit.target.set(...MODEL_TARGET);
    this.orbit.enableDamping = true;
    this.orbit.maxPolarAngle = Math.PI / 2 - 0.02;
    this.orbit.minDistance = 0.8;
    this.orbit.maxDistance = 20;

    this.planControls = new OrbitControls(this.ortho, canvas);
    this.planControls.target.set(cm(240), 0, cm(-1));
    this.planControls.enableRotate = false;
    this.planControls.enableDamping = true;
    this.planControls.minZoom = 0.8;
    this.planControls.maxZoom = 10;
    this.planControls.enabled = false;

    this.walker = new PointerLockControls(this.persp, canvas);

    this.sun.position.set(11, 9, -3.5);
    this.sun.target.position.set(cm(240), 0, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    Object.assign(this.sun.shadow.camera, {
      left: -6,
      right: 6,
      top: 6,
      bottom: -6,
      near: 1,
      far: 30,
    });
    this.scene.add(this.sun, this.sun.target, this.hemi);

    this.roomLights = [
      [300, -235],
      [190, 40],
      [190, 240],
      [60, -100],
    ].map(([x, y]) => {
      const light = new THREE.PointLight("#ffdcb0", 0, 7, 1.6);
      light.position.set(cm(x), 2.2, cm(y));
      this.scene.add(light);
      return light;
    });

    this.ledBridge.position.set(cm(321), 1.48, cm(-297));
    this.ledBridge.rotation.x = -Math.PI / 2;
    this.ledPoint.position.set(cm(321), 1.3, cm(-300));
    this.scene.add(this.ledBridge, this.ledPoint);

    this.M = createMaterials();
    this.M.apply(this.settings.palette);
    this.scene.add(buildFloors(this.M), this.itemsGroup);

    this.items = ITEMS.map((base) => {
      const placed = initial.layout[base.id];
      const item: PlacedItem = {
        ...base,
        home: { x: base.x, y: base.y },
        x: placed?.x ?? base.x,
        y: placed?.y ?? base.y,
        rot: placed?.rot ?? 0,
        mesh: buildItem(base, this.M),
      };
      item.mesh.userData.item = item;
      this.itemsGroup.add(item.mesh);
      placeItem(item);
      return item;
    });

    this.doors = buildDoors(this.M);
    this.scene.add(...this.doors);
    this.fixed = [...wallBlockers(), ...FIXED_OBSTACLES];

    const lineBuffer = () =>
      new THREE.Float32BufferAttribute(new Float32Array(8 * 3), 3);
    this.distLineGeo.setAttribute("position", lineBuffer());
    this.distLines = this.overlayLines(this.distLineGeo, "#ffffff", 10);
    this.outlineGeo.setAttribute("position", lineBuffer());
    this.outline = this.overlayLines(this.outlineGeo, "#8fdf8b", 11);

    this.roomEls = ROOMS.map((room) => {
      const el = document.createElement("div");
      el.className = "room-label";
      el.innerHTML = `<strong>${room.name}</strong>${room.size}`;
      labelsRoot.append(el);
      return { el, pos: new THREE.Vector3(cm(room.x), 0.3, cm(room.y)) };
    });
    this.distEls = Array.from({ length: 4 }, () => {
      const el = document.createElement("div");
      el.className = "dist-label";
      el.hidden = true;
      labelsRoot.append(el);
      return el;
    });

    this.bindInput();
    this.resize();
    this.rebuildShell();
    this.applyLighting();
    this.applyDoors();
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.listeners.abort();
    this.orbit.dispose();
    this.planControls.dispose();
    this.walker.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.labelsRoot.replaceChildren();
  }

  /* API used by the UI */

  get isDragging() {
    return this.drag !== null;
  }

  update(next: Settings) {
    const prev = this.settings;
    this.settings = next;
    if (prev === next) return;
    if (prev.ceil !== next.ceil || prev.cut !== next.cut) this.rebuildShell();
    if (prev.palette !== next.palette) this.M.apply(next.palette);
    if (prev.doorsOpen !== next.doorsOpen) this.applyDoors();
    this.applyLighting();
  }

  setMode(mode: Mode) {
    if (this.walker.isLocked) this.walker.unlock();
    this.mode = mode;
    this.camera = mode === "plan" ? this.ortho : this.persp;
    if (mode === "walk") {
      this.persp.fov = 70;
      this.persp.position.set(cm(WALK_START.x), 1.6, cm(WALK_START.y));
      this.persp.rotation.set(0, WALK_START.yaw, 0, "YXZ");
      this.select(null);
    } else {
      this.persp.fov = 42;
    }
    this.persp.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        mode === "walk" ? WALK_PIXEL_RATIO : MAX_PIXEL_RATIO,
      ),
    );
    this.syncControls();
    this.rebuildShell();
    this.applyLighting();
    this.resize();
    this.refreshSelection();
  }

  goToView(name: string) {
    const view = VIEWS[name];
    this.persp.fov = 66;
    this.persp.updateProjectionMatrix();
    this.persp.position.set(...(view.pos.map(cm) as [number, number, number]));
    this.orbit.target.set(...(view.target.map(cm) as [number, number, number]));
    this.orbit.update();
  }

  resetCamera() {
    this.persp.position.set(...MODEL_CAMERA);
    this.orbit.target.set(...MODEL_TARGET);
    this.orbit.update();
  }

  getLayout(): Layout {
    return Object.fromEntries(
      this.items.map(({ id, x, y, rot }) => [id, { x, y, rot }]),
    );
  }

  applyLayout(layout: Layout) {
    this.items.forEach((item) => {
      Object.assign(item, layout[item.id]);
      placeItem(item);
    });
    this.renderer.shadowMap.needsUpdate = true;
    this.refreshSelection();
  }

  resetLayout() {
    this.items.forEach((item) => {
      Object.assign(item, item.home, { rot: 0 });
      placeItem(item);
    });
    this.select(null);
    this.itemsMoved();
  }

  rotateSelected() {
    if (!this.selected) return;
    this.selected.rot = (this.selected.rot + 1) % 4;
    placeItem(this.selected);
    this.itemsMoved();
  }

  clearSelection() {
    this.select(null);
  }

  /* Scene */

  private overlayLines(
    geometry: THREE.BufferGeometry,
    color: string,
    order: number,
  ) {
    const lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color,
        depthTest: false,
        transparent: true,
      }),
    );
    lines.renderOrder = order;
    lines.frustumCulled = false;
    lines.visible = false;
    this.scene.add(lines);
    return lines;
  }

  private rebuildShell() {
    this.scene.remove(...this.shell);
    this.shell.forEach((group) =>
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      }),
    );

    const { ceil, cut } = this.settings;
    const walking = this.mode === "walk";
    const planning = this.mode === "plan";
    const wallH = walking ? ceil : planning ? PLAN_CUT : Math.min(cut, ceil);

    const ceiling = buildCeiling(this.M, ceil);
    ceiling.visible = walking;
    this.shell = [
      buildWalls(this.M, wallH),
      buildWardrobe(this.M, planning ? PLAN_CUT : ceil),
      ceiling,
      buildBath(this.M, wallH),
      buildGrill(this.M, wallH),
      buildKitchen(this.M, !planning),
    ];
    this.scene.add(...this.shell);
    this.excludeFromFog();

    fitHoodDuct(this.itemsGroup, ceil);
    this.itemsGroup.traverse((o) => {
      if (o.userData.overhead) o.visible = !planning;
    });
    this.doors.forEach((door) => (door.scale.y = Math.min(1, wallH / 208)));
    this.renderer.shadowMap.needsUpdate = true;
  }

  private excludeFromFog() {
    const visit = (o: THREE.Object3D) => {
      if (o === this.landscape?.group) return;
      if (o instanceof THREE.Mesh)
        [o.material].flat().forEach((material) => (material.fog = false));
      o.children.forEach(visit);
    };
    visit(this.scene);
  }

  private applyLighting() {
    const { night, led, cut, ceil } = this.settings;
    const planning = this.mode === "plan";
    if (planning) this.sun.position.set(4.5, 12, 1.5);
    else this.sun.position.set(11, 9, -3.5);
    this.sun.intensity = night ? 0 : planning ? 1.6 : 3.1;
    this.hemi.intensity = night
      ? 0.12
      : this.mode === "walk"
        ? 1.5
        : planning
          ? 1.7
          : 1.1;
    this.scene.environmentIntensity = night ? 0.08 : 0.45;
    // Hidden rather than dimmed: a light at zero still costs time on every pixel.
    this.roomLights.forEach((light) => {
      light.intensity = night ? 2.6 : 0;
      light.visible = night;
    });
    this.ledBridge.intensity = led ? (night ? 18 : 7) : 0;
    this.ledPoint.intensity = led ? (night ? 1.8 : 0.5) : 0;
    this.ledBridge.visible = this.ledPoint.visible = led;
    this.M.led.emissiveIntensity = led ? 3 : 0;
    this.M.led.color.set(led ? "#fff3df" : "#55524c");
    const inside =
      this.mode === "walk" || (this.mode === "orbit" && cut >= ceil);
    this.scene.background = new THREE.Color(
      night ? "#0d0f15" : inside ? "#cfe2ee" : "#34353a",
    );
    this.applyLandscape();
    this.renderer.shadowMap.needsUpdate = true;
  }

  // Built on the first walk, since no other mode shows it.
  private applyLandscape() {
    const walking = this.mode === "walk";
    if (walking && !this.landscape) {
      this.landscape = createLandscape(this.sun.position.clone().normalize());
      this.scene.add(this.landscape.group);
    }
    if (!this.landscape) return;
    this.landscape.group.visible = walking;
    this.scene.fog = walking ? this.landscape.fog : null;
    this.landscape.setNight(this.settings.night);
  }

  private applyDoors() {
    this.doors.forEach((pivot) => {
      const door = pivot.userData.door as DoorSpec;
      pivot.rotation.y = THREE.MathUtils.degToRad(
        this.settings.doorsOpen ? door.open : door.closed,
      );
    });
    this.renderer.shadowMap.needsUpdate = true;
  }

  private resize = () => {
    const w = innerWidth,
      h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.persp.aspect = w / h;
    // Shifts the image to the center of the free area, right of the panel.
    const panelGap = this.mode !== "walk" && w > 720 ? 136 : 0;
    if (panelGap) this.persp.setViewOffset(w, h, -panelGap, 0, w, h);
    else this.persp.clearViewOffset();
    this.persp.updateProjectionMatrix();

    const halfH = 4.3;
    const halfW = halfH * (w / h);
    const shift = (panelGap / h) * 2 * halfH;
    const lift = 0.2;
    Object.assign(this.ortho, {
      left: -halfW - shift,
      right: halfW - shift,
      top: halfH + lift,
      bottom: -halfH + lift,
    });
    this.ortho.updateProjectionMatrix();
  };

  private syncControls() {
    this.orbit.enabled = this.mode === "orbit";
    this.planControls.enabled = this.mode === "plan";
  }

  /* Distances and selection */

  private blockersFor(item: PlacedItem): Obstacle[] {
    const others = this.items
      .filter((o) => o !== item)
      .flatMap((o) => {
        if (item.tucks && o.overhang)
          return [{ ...floorFootprint(o), label: o.label }];
        const rect = footprint(o);
        // A stool that is only under the top's overhang does not touch the island.
        if (item.overhang && o.tucks && !overlaps(floorFootprint(item), rect))
          return [];
        return [{ ...rect, label: o.label }];
      });
    return [...this.fixed, ...others];
  }

  // Free clearance in the four directions, up to the nearest obstacle.
  private clearances(item: PlacedItem) {
    const f = footprint(item);
    const others = this.blockersFor(item);
    const hits = others.filter((b) => overlaps(f, b));
    const dirs = [
      { axis: "x", sign: -1, from: f.x0 },
      { axis: "x", sign: 1, from: f.x1 },
      { axis: "y", sign: -1, from: f.y0 },
      { axis: "y", sign: 1, from: f.y1 },
    ] as const;
    const results: Clearance[] = [];
    for (const dir of dirs) {
      let best: Clearance | null = null;
      for (const b of others) {
        const lateral =
          dir.axis === "x"
            ? b.y0 < f.y1 && b.y1 > f.y0
            : b.x0 < f.x1 && b.x1 > f.x0;
        if (!lateral) continue;
        const edge =
          dir.axis === "x"
            ? dir.sign < 0
              ? b.x1
              : b.x0
            : dir.sign < 0
              ? b.y1
              : b.y0;
        const dist = (edge - dir.from) * dir.sign;
        if (dist >= -0.01 && (!best || dist < best.dist)) {
          best = { ...dir, dist: Math.max(0, dist), edge, label: b.label };
        }
      }
      if (best) results.push(best);
    }
    return { results, hits, f };
  }

  private select(item: PlacedItem | null) {
    this.selected = item;
    this.refreshSelection();
  }

  private refreshSelection() {
    const item = this.mode === "walk" ? null : this.selected;
    this.distEls.forEach((el) => (el.hidden = true));
    if (!item) {
      this.distLines.visible = this.outline.visible = false;
      this.callbacks.onSelectionChange(null);
      return;
    }

    const { results, hits, f } = this.clearances(item);
    const line = this.distLineGeo.attributes.position as THREE.BufferAttribute;
    const y = 0.03;
    const midX = (f.x0 + f.x1) / 2,
      midY = (f.y0 + f.y1) / 2;
    results.forEach((r, i) => {
      const start = r.axis === "x" ? [r.from, midY] : [midX, r.from];
      const end = r.axis === "x" ? [r.edge, midY] : [midX, r.edge];
      line.setXYZ(i * 2, cm(start[0]), y, cm(start[1]));
      line.setXYZ(i * 2 + 1, cm(end[0]), y, cm(end[1]));
      const el = this.distEls[i];
      const rounded = Math.round(r.dist);
      el.hidden = false;
      el.textContent = `${rounded} cm`;
      el.title = `to ${r.label}`;
      el.className = `dist-label${hits.length || rounded === 0 ? " touch" : rounded < TIGHT_CM ? " tight" : ""}`;
      this.distPositions[i].set(
        cm((start[0] + end[0]) / 2),
        0.05,
        cm((start[1] + end[1]) / 2),
      );
    });
    for (let i = results.length * 2; i < 8; i++) line.setXYZ(i, 0, 0, 0);
    line.needsUpdate = true;
    this.distLines.visible = true;

    const corners = [
      [f.x0, f.y0],
      [f.x1, f.y0],
      [f.x1, f.y1],
      [f.x0, f.y1],
    ];
    const outline = this.outlineGeo.attributes
      .position as THREE.BufferAttribute;
    corners.forEach(([x, z], i) => {
      const [nx, nz] = corners[(i + 1) % 4];
      outline.setXYZ(i * 2, cm(x), y, cm(z));
      outline.setXYZ(i * 2 + 1, cm(nx), y, cm(nz));
    });
    outline.needsUpdate = true;
    (this.outline.material as THREE.LineBasicMaterial).color.set(
      hits.length ? "#ff6b5e" : "#8fdf8b",
    );
    this.outline.visible = true;

    const tight = results.filter((r) => r.dist > 0 && r.dist < TIGHT_CM);
    let warning: SelectionInfo["warning"] = null;
    if (hits.length) {
      const names = [...new Set(hits.map((h) => h.label))].join(", ");
      warning = { text: `Colliding with: ${names}.`, danger: true };
    } else if (tight.length) {
      const list = tight
        .map((r) => `${Math.round(r.dist)} cm to ${r.label}`)
        .join("; ");
      warning = { text: `Tight passage: ${list}.`, danger: false };
    }
    this.callbacks.onSelectionChange({
      label: item.label,
      size: `${f.x1 - f.x0} × ${f.y1 - f.y0} cm`,
      warning,
    });
  }

  private itemsMoved(merge = false) {
    this.renderer.shadowMap.needsUpdate = true;
    this.refreshSelection();
    this.callbacks.onLayoutChange(this.getLayout(), merge);
  }

  /* Input */

  private bindInput() {
    const { signal } = this.listeners;
    // In the capture phase, before OrbitControls, so dragging does not rotate the camera.
    this.canvas.addEventListener("pointerdown", this.onPointerDown, {
      capture: true,
      signal,
    });
    this.canvas.addEventListener("pointermove", this.onPointerMove, { signal });
    this.canvas.addEventListener("pointerup", this.onPointerUp, { signal });
    window.addEventListener("resize", this.resize, { signal });
    window.addEventListener("keydown", this.onKeyDown, { signal });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code), {
      signal,
    });
    for (const type of [
      "pointerdown",
      "pointermove",
      "pointerup",
      "wheel",
      "keydown",
      "keyup",
      "resize",
    ]) {
      window.addEventListener(type, this.keepRendering, {
        signal,
        passive: true,
      });
    }
    this.walker.addEventListener("lock", this.onLock);
    this.walker.addEventListener("unlock", this.onUnlock);
  }

  private keepRendering = () => {
    this.renderUntil = performance.now() + RENDER_AFTER_INPUT;
  };

  private onLock = () => this.callbacks.onWalkLockChange(true);
  private onUnlock = () => this.callbacks.onWalkLockChange(false);

  private setPointer(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  private pickItem() {
    const hit = this.raycaster.intersectObjects(
      this.itemsGroup.children,
      true,
    )[0];
    if (!hit) return null;
    let object: THREE.Object3D | null = hit.object;
    while (object && !object.userData.item) object = object.parent;
    return object
      ? { item: object.userData.item as PlacedItem, y: hit.point.y }
      : null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.mode === "walk") {
      if (!this.walker.isLocked) this.walker.lock();
      return;
    }
    this.setPointer(e);
    this.pressed = { x: e.clientX, y: e.clientY };
    const hit = this.pickItem();
    if (!hit) return;
    this.select(hit.item);
    this.dragPlane.constant = -hit.y;
    this.raycaster.ray.intersectPlane(this.dragPlane, this.dragPoint);
    this.drag = {
      item: hit.item,
      dx: hit.item.x - this.dragPoint.x * 100,
      dy: hit.item.y - this.dragPoint.z * 100,
    };
    this.orbit.enabled = this.planControls.enabled = false;
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.drag) return;
    this.setPointer(e);
    if (!this.raycaster.ray.intersectPlane(this.dragPlane, this.dragPoint))
      return;
    this.drag.item.x = Math.round(this.dragPoint.x * 100 + this.drag.dx);
    this.drag.item.y = Math.round(this.dragPoint.z * 100 + this.drag.dy);
    placeItem(this.drag.item);
    this.renderer.shadowMap.needsUpdate = true;
    this.refreshSelection();
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.drag) {
      this.drag = null;
      this.syncControls();
      this.itemsMoved();
    } else if (
      this.pressed &&
      this.mode !== "walk" &&
      Math.hypot(e.clientX - this.pressed.x, e.clientY - this.pressed.y) < 4
    ) {
      this.select(null);
    }
    this.pressed = null;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) return;
    if (this.mode === "walk") {
      this.keys.add(e.code);
      return;
    }
    if (!this.selected) return;
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const step = steps[e.code];
    if (step) {
      e.preventDefault();
      this.selected.x += step[0];
      this.selected.y += step[1];
      placeItem(this.selected);
      this.itemsMoved(true);
    } else if (e.code === "KeyR") {
      this.rotateSelected();
    } else if (e.code === "Escape") {
      this.select(null);
    }
  };

  private blocked(x: number, y: number) {
    const near = (b: Rect) =>
      x > b.x0 - RADIUS &&
      x < b.x1 + RADIUS &&
      y > b.y0 - RADIUS &&
      y < b.y1 + RADIUS;
    return this.fixed.some(near) || this.items.some((i) => near(footprint(i)));
  }

  private stepWalk(dt: number) {
    if (!this.walker.isLocked) return;
    const { keys, walkDir, walkRight, camera } = this;
    const pressed = (...codes: string[]) =>
      codes.some((c) => keys.has(c)) ? 1 : 0;
    const forward = pressed("KeyW", "ArrowUp") - pressed("KeyS", "ArrowDown");
    const side = pressed("KeyD", "ArrowRight") - pressed("KeyA", "ArrowLeft");
    if (!forward && !side) return;
    camera.getWorldDirection(walkDir);
    walkDir.y = 0;
    walkDir.normalize();
    walkRight.crossVectors(walkDir, camera.up);
    const speed = (pressed("ShiftLeft", "ShiftRight") ? 2.4 : 1.4) * dt;
    const move = walkDir
      .multiplyScalar(forward)
      .addScaledVector(walkRight, side)
      .normalize()
      .multiplyScalar(speed);
    const x = camera.position.x * 100,
      y = camera.position.z * 100;
    const nx = x + move.x * 100,
      ny = y + move.z * 100;
    // Each axis is tested separately to slide along walls.
    if (!this.blocked(nx, y)) camera.position.x = nx / 100;
    if (!this.blocked(camera.position.x * 100, ny))
      camera.position.z = ny / 100;
  }

  /* Main loop */

  private project(el: HTMLElement, pos: THREE.Vector3) {
    const p = pos.clone().project(this.camera);
    const visible = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
    el.style.visibility = visible ? "visible" : "hidden";
    const x = ((p.x + 1) / 2) * innerWidth;
    const y = ((1 - p.y) / 2) * innerHeight;
    el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  }

  private frame = (now: number) => {
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    if (this.mode === "orbit") this.orbit.update();
    if (this.mode === "plan") this.planControls.update();
    this.stepWalk(dt);

    const showRooms = this.settings.roomsOn && this.mode === "plan";
    this.roomEls.forEach(({ el, pos }) => {
      el.hidden = !showRooms;
      if (showRooms) this.project(el, pos);
    });
    this.distEls.forEach((el, i) => {
      if (!el.hidden) this.project(el, this.distPositions[i]);
    });

    // A still scene is not drawn again, which is what lets the laptop rest.
    this.camera.updateMatrixWorld();
    const moved = !this.lastView.equals(this.camera.matrixWorld);
    if (
      moved ||
      this.renderer.shadowMap.needsUpdate ||
      now < this.renderUntil
    ) {
      this.lastView.copy(this.camera.matrixWorld);
      if (this.mode === "walk") this.landscape?.updateView(this.camera);
      this.renderer.render(this.scene, this.camera);
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  /* Used to check the layout and take screenshots. */
  debugApi() {
    return {
      THREE,
      scene: this.scene,
      items: this.items,
      byId: (id: string) => this.items.find((i) => i.id === id)!,
      camera: () => this.camera,
      blocked: (x: number, y: number) => this.blocked(x, y),
      clearances: (item: PlacedItem) => this.clearances(item),
      screenOf: (id: string) => {
        const item = this.items.find((i) => i.id === id)!;
        const p = new THREE.Vector3(cm(item.x), 1.0, cm(item.y)).project(
          this.camera,
        );
        return [((p.x + 1) / 2) * innerWidth, ((1 - p.y) / 2) * innerHeight];
      },
    };
  }
}
