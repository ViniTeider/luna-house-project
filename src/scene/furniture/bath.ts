import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import type { Materials } from "../materials";
import { B, Cyl, R, cm } from "./primitives";

// Mirror cabinet above the vanity, high enough to clear the tap
const CABINET = { bottom: 122, height: 70, width: 60, depth: 14, y: -60 };
const CABINET_OPEN = THREE.MathUtils.degToRad(100);
const SILL = 160; // ventilation window, x 45 to 105

function revolve(
  g: THREE.Object3D,
  mat: THREE.Material,
  profile: number[][],
  [x, y, z]: number[],
) {
  const points = profile.map(([r, h]) => new THREE.Vector2(cm(r), cm(h)));
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 40), mat);
  mesh.position.set(cm(x), cm(y), cm(z));
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function pipe(
  g: THREE.Object3D,
  mat: THREE.Material,
  from: number[],
  bend: number[],
  to: number[],
  radius: number,
) {
  const point = ([x, y, z]: number[]) => new THREE.Vector3(cm(x), cm(y), cm(z));
  const curve = new THREE.QuadraticBezierCurve3(
    point(from),
    point(bend),
    point(to),
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 18, cm(radius), 10),
    mat,
  );
  mesh.castShadow = true;
  g.add(mesh);
}

// Close-coupled toilet on the west wall, near the shower, with the lid down
function toilet(g: THREE.Object3D, M: Materials) {
  R(g, M.ceramic, 9, 42, -130, 18, 34, 38, 2.5);
  R(g, M.ceramic, 9.5, 76, -130, 19, 2.5, 39.5, 1);
  Cyl(g, M.inox, 9.5, 78.5, -130, 2.4, 0.5);
  const pan = revolve(
    g,
    M.ceramic,
    [
      [0, 0],
      [10.5, 0],
      [11, 8],
      [12.5, 22],
      [17, 34],
      [18.5, 38],
      [0, 38.5],
    ],
    [33, 0, -130],
  );
  pan.scale.set(1.3, 1, 0.92);
  [39.3, 41.4].forEach((y, i) => {
    const part = Cyl(g, M.ceramic, 33, y, -130, 18, i ? 1.8 : 1.4);
    part.scale.set(1.28, 1, 0.92);
  });
  [-139, -121].forEach((z) => Cyl(g, M.inox, 16, 41, z, 1.4, 1.2));
}

// Wall-hung vanity with a real vessel basin and a curved tap
function vanity(g: THREE.Object3D, M: Materials) {
  // Lacquered, not wood, because of the humidity
  B(g, M.vanity, 23, 40, -60, 46, 42, 60);
  B(g, M.vanityFront, 46.4, 42, -74.5, 0.8, 38, 28);
  B(g, M.vanityFront, 46.4, 42, -45.5, 0.8, 38, 28);
  [-62, -58].forEach((z) => B(g, M.inoxDark, 47, 66, z, 0.8, 12, 1));
  B(g, M.top, 23, 82, -60, 46, 3, 60);
  revolve(
    g,
    M.ceramic,
    [
      [0, 0],
      [7, 0],
      [12, 2.5],
      [15, 11],
      [14.6, 11.6],
      [14, 11.3],
      [11, 3.6],
      [3, 1.8],
      [0, 1.6],
    ],
    [26, 85, -60],
  );
  Cyl(g, M.inoxDark, 26, 86.7, -60, 1.7, 0.2);
  Cyl(g, M.inox, 7, 85, -60, 1.1, 21);
  pipe(g, M.inox, [7, 106, -60], [8, 114, -60], [19, 103, -60], 0.75);
  Cyl(g, M.inox, 7, 98, -55.5, 0.5, 8, "z");
}

function mirrorCabinet(g: THREE.Object3D, M: Materials, open: boolean) {
  const { bottom, height, width, depth, y } = CABINET;
  const top = bottom + height;
  const near = y - width / 2;

  B(g, M.white, 0.5, bottom, y, 1, height, width);
  [bottom, top - 1.2].forEach((by) =>
    B(g, M.vanity, depth / 2, by, y, depth, 1.2, width),
  );
  [near + 0.6, near + width - 0.6].forEach((cz) =>
    B(g, M.vanity, depth / 2, bottom, cz, depth, height, 1.2),
  );
  const shelves = [bottom + 1.2, bottom + 24, bottom + 47];
  shelves.slice(1).forEach((by) => {
    B(g, M.glass, depth / 2, by, y, depth - 2, 0.6, width - 2.4).castShadow =
      false;
  });
  // Everyday things, so the depth of the shelves reads at real scale
  const item = (
    shelf: number,
    z: number,
    r: number,
    h: number,
    mat = M.white,
  ) => Cyl(g, mat, 7, shelves[shelf] + 0.6, y + z, r, h);
  item(0, -20, 3.4, 11, M.ceramic);
  item(0, -11, 2.2, 15, M.inoxDark);
  item(0, 8, 3, 14);
  item(0, 18, 3, 9, M.ceramic);
  item(1, -18, 2.6, 13);
  item(1, -8, 3.2, 8, M.ceramic);
  item(1, 12, 2.4, 16, M.inoxDark);
  item(2, -14, 3, 10, M.ceramic);
  item(2, 6, 2.2, 13);
  item(2, 17, 3.2, 7);

  const door = new THREE.Group();
  door.position.set(cm(depth), 0, cm(near));
  door.rotation.y = open ? CABINET_OPEN : 0;
  B(door, M.frame, 0.7, bottom, width / 2, 1.4, height, width);
  const glass = new Reflector(
    new THREE.PlaneGeometry(cm(width - 1.2), cm(height - 1.2)),
    {
      textureWidth: 640,
      textureHeight: Math.round((640 * height) / width),
      clipBias: 0.002,
      color: 0xe9eef0,
    },
  );
  glass.rotation.y = Math.PI / 2;
  glass.position.set(cm(1.5), cm(bottom + height / 2), cm(width / 2));
  door.add(glass);
  g.add(door);
}

function shower(g: THREE.Object3D, M: Materials, wallH: number) {
  const glassH = Math.min(190, wallH),
    tileH = Math.min(210, wallH);
  B(g, M.glass, 45, 0, -159, 46, glassH, 1).castShadow = false;
  B(g, M.glass, 94, 0, -160.5, 46, glassH, 1).castShadow = false;
  B(g, M.tile, 70, 0, -159.8, 96, 3, 6);
  B(g, M.frame, 70, 3, -159.8, 96, 1.2, 3);
  B(g, M.frame, 113.5, 90, -162, 1.6, 34, 1.6);
  B(g, M.inoxDark, 70, 0.1, -230, 70, 0.4, 4.5);
  // Valve at 1.10 m on the shaft wall, feeding the rain head on the same wall
  Cyl(g, M.inox, 25, 110, -198.5, 5.5, 1.2, "x");
  Cyl(g, M.inoxDark, 27, 110, -198.5, 1.1, 3.4, "x");
  B(g, M.inoxDark, 28.5, 109.3, -202, 1, 1.4, 8);
  if (wallH > 192) {
    B(g, M.frame, 70, 190, -159.5, 96, 2.5, 3);
    Cyl(g, M.inox, 24.6, 112, -198.5, 0.9, 93);
    B(g, M.inox, 37.5, 205, -198.5, 30, 2.5, 2.5);
    Cyl(g, M.inox, 52, 202, -198.5, 11, 1.5);
  } else {
    Cyl(g, M.inoxDark, 70, 0.3, -198, 4, 0.2);
  }
  // North wall: the tile goes around the ventilation window
  B(g, M.tile, 33.5, 0, -237.3, 23, tileH, 1.2);
  B(g, M.tile, 111.5, 0, -237.3, 13, tileH, 1.2);
  B(g, M.tile, 75, 0, -237.3, 60, Math.min(SILL, tileH), 1.2);
  B(g, M.tile, 117.3, 0, -198.5, 1.2, tileH, 78);
  B(g, M.tile, 22.8, 0, -198.5, 1.2, tileH, 78);
}

// Open shelves in the free stretches of wall, none of them over a passage below head height
function shelves(g: THREE.Object3D, M: Materials) {
  // Above the toilet, reaching no further than the cistern
  [128, 158].forEach((by) => B(g, M.frame, 9, by, -130, 18, 1.2, 40));
  // In the shower, on the shaft wall
  [128, 156].forEach((by) => B(g, M.frame, 28.5, by + 0.8, -219, 10, 1.2, 30));
  // Above the towel bar
  B(g, M.frame, 110.5, 170, -125, 15, 1.2, 54);
  // High up on the south wall, above the door when it opens
  B(g, M.frame, 86, 214, -23, 62, 1.2, 16);
}

// Heights from usual guides: paper holder around 66 cm, towel bar around 1.22 m.
function accessories(g: THREE.Object3D, M: Materials) {
  Cyl(g, M.inoxDark, 34, 66, -91, 0.6, 2.5, "z");
  Cyl(g, M.inoxDark, 34, 66, -94, 0.5, 12, "x");
  Cyl(g, M.white, 34, 66, -96, 5.5, 10, "x");
  B(g, M.inoxDark, 116.6, 121.4, -125, 1.2, 1.2, 62);
  [-152, -98].forEach((z) => B(g, M.inoxDark, 117.2, 120.4, z, 1.6, 3.2, 1.6));
}

export function buildBath(
  M: Materials,
  wallH: number,
  { cabinet, cabinetOpen }: { cabinet: boolean; cabinetOpen: boolean },
) {
  const g = new THREE.Group();
  toilet(g, M);
  vanity(g, M);
  if (cabinet) {
    mirrorCabinet(g, M, cabinetOpen);
    shelves(g, M);
  }
  shower(g, M, wallH);
  accessories(g, M);
  return g;
}
