import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Referências de tamanho: TV 55" 122,6 cm de largura (medida do usuário) e 71 cm de altura sem os pés, mouse Redragon 10,4×7,1×3,8 cm,
// cadeira gamer 123–131 cm de altura, lava-louças slim 45×60×85 cm.
// Larguras e profundidades dos demais móveis vêm do Figma; alturas seguem o padrão de mercado.

const cm = (v) => v / 100;
const HOOD_DUCT_BASE = 184;

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Reescala os UVs para metros, assim a textura não estica conforme o tamanho da peça.
function scaleBoxUV(geo, w, h, d) {
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  const uv = geo.attributes.uv;
  faces.forEach(([u, v], face) => {
    for (let i = 0; i < 4; i++) {
      const n = face * 4 + i;
      uv.setXY(n, uv.getX(n) * cm(u), uv.getY(n) * cm(v));
    }
  });
}

// cx/cz: centro; by: base. Tudo em cm.
export function B(parent, mat, cx, by, cz, w, h, d) {
  const geo = new THREE.BoxGeometry(cm(w), cm(h), cm(d));
  scaleBoxUV(geo, w, h, d);
  const mesh = shadow(new THREE.Mesh(geo, mat));
  mesh.position.set(cm(cx), cm(by + h / 2), cm(cz));
  parent.add(mesh);
  return mesh;
}

export function R(parent, mat, cx, by, cz, w, h, d, radius = 3) {
  const geo = new RoundedBoxGeometry(cm(w), cm(h), cm(d), 4, cm(radius));
  const mesh = shadow(new THREE.Mesh(geo, mat));
  mesh.position.set(cm(cx), cm(by + h / 2), cm(cz));
  parent.add(mesh);
  return mesh;
}

export function Cyl(parent, mat, cx, by, cz, r, h, axis = 'y') {
  const geo = new THREE.CylinderGeometry(cm(r), cm(r), cm(h), 24);
  const mesh = shadow(new THREE.Mesh(geo, mat));
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.set(cm(cx), cm(by + (axis === 'y' ? h / 2 : 0)), cm(cz));
  parent.add(mesh);
  return mesh;
}

// Rack encostado na parede ao norte, com a TV fixada acima dele.
function rack(g, M) {
  B(g, M.main, 0, 12, 0, 228, 33, 36);
  [-76, 0, 76].forEach((x) => B(g, M.wood, x, 14, 18.3, 74, 29, 1));
  [-38, 38].forEach((x) => B(g, M.main, x, 14, 18.6, 1, 29, 1));
  [[-108, -14], [108, -14], [-108, 14], [108, 14]].forEach(([x, z]) => B(g, M.black, x, 0, z, 3, 12, 3));
  // TV de 55" fixada na parede, sem os pés: 122,6 × 71 × 6 cm, com o suporte de 2 cm atrás.
  const tvBottom = 85, tvZ = -13;
  B(g, M.black, 0, tvBottom + 25, -17, 30, 20, 2);
  B(g, M.black, 0, tvBottom, tvZ, 122.6, 71, 6);
  const tv = B(g, M.screen, 0, tvBottom + 1, tvZ + 3.2, 120.6, 69, 0.4);
  tv.castShadow = false;
}

// Sofá voltado para o norte, para a TV
function sofa(g, M) {
  const W = 218, D = 105;
  [[-100, -44], [100, -44], [-100, 44], [100, 44]].forEach(([x, z]) => B(g, M.wood, x, 0, z, 5, 12, 5));
  R(g, M.sofa, 0, 12, 0, W, 16, D, 3);
  R(g, M.sofa, -W / 2 + 12, 22, 0, 24, 40, D, 7);
  R(g, M.sofa, W / 2 - 12, 22, 0, 24, 40, D, 7);
  R(g, M.sofa, 0, 26, D / 2 - 12, W - 46, 56, 24, 8);
  const seatW = (W - 50) / 3;
  [-1, 0, 1].forEach((i) => {
    R(g, M.sofa, i * seatW, 28, -11, seatW - 1.5, 15, 78, 5);
    const back = R(g, M.sofa, i * seatW, 43, 24, seatW - 3, 38, 16, 6);
    back.rotation.x = -0.13;
  });
}

function desk(g, M) {
  B(g, M.wood, 0, 72, 0, 52, 3, 170);
  [[-22, -80], [-22, 80], [22, -80], [22, 80]].forEach(([x, z]) => B(g, M.black, x, 0, z, 4, 72, 4));
  // Monitor de 70 cm, voltado para leste
  B(g, M.black, -17, 75, 0, 16, 1, 22);
  B(g, M.black, -17, 76, 0, 3, 14, 5);
  B(g, M.black, -14, 86, 0, 2.5, 40, 70);
  const panel = B(g, M.screen, -12.5, 87, 0, 0.3, 38, 68);
  panel.castShadow = false;
  // Teclado F75 branco, 30 × 13 cm, medida do Figma
  const kbZ = 9.5, kbX = 7;
  B(g, M.white, kbX, 75, kbZ, 13, 2, 30);
  const key = new THREE.BoxGeometry(cm(1.65), cm(0.8), cm(1.65));
  const keys = new THREE.InstancedMesh(key, M.ceramic, 6 * 15);
  const m = new THREE.Matrix4();
  let n = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 15; c++) {
      m.setPosition(cm(kbX - 5.2 + r * 2.08), cm(77.4), cm(kbZ - 13.6 + c * 1.94));
      keys.setMatrixAt(n++, m);
    }
  }
  keys.castShadow = true;
  g.add(keys);
  // Mouse Redragon branco sem fio
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), M.white);
  mouse.scale.set(cm(10.4), cm(3.8 * 1.5), cm(7.1));
  mouse.position.set(cm(kbX), cm(75.6), cm(-19.5));
  mouse.castShadow = true;
  g.add(mouse);
}

// Cadeira gamer preta e verde, voltada para oeste, para a mesa
function chair(g, M) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = B(g, M.black, Math.cos(a) * 16, 6, Math.sin(a) * 16, 32, 3, 5);
    leg.rotation.y = -a;
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(cm(3.2), 12, 10), M.blackSoft);
    wheel.position.set(cm(Math.cos(a) * 30), cm(3.2), cm(Math.sin(a) * 30));
    wheel.castShadow = true;
    g.add(wheel);
  }
  Cyl(g, M.inoxDark, 0, 8, 0, 2.5, 34);
  R(g, M.blackSoft, -2, 40, 0, 50, 10, 50, 4);
  [-16, 16].forEach((z) => R(g, M.green, -2, 49.5, z, 44, 1.5, 7, 0.7));
  const back = new THREE.Group();
  back.position.set(cm(23), cm(48), 0);
  back.rotation.z = 0.12;
  g.add(back);
  R(back, M.blackSoft, 0, 0, 0, 10, 76, 54, 4);
  R(back, M.green, -4.2, 8, 0, 3, 55, 16, 1.4);
  [-24, 24].forEach((z) => R(back, M.blackSoft, -3, 20, z, 8, 56, 8, 3));
  R(back, M.blackSoft, -5, 66, 0, 8, 13, 20, 3);
  [-29, 29].forEach((z) => {
    B(g, M.black, 2, 45, z, 4, 20, 4);
    R(g, M.blackSoft, -1, 65, z, 26, 3.5, 8, 1.4);
  });
}

// Placa com cantos arredondados vistos de cima e aresta suavizada.
function roundedSlab(parent, mat, cx, by, cz, w, h, d, r, edge) {
  const hw = cm(w) / 2, hd = cm(d) / 2, rad = cm(r), e = cm(edge);
  const inner = (v) => v - e;
  const shape = new THREE.Shape();
  shape.moveTo(-inner(hw) + rad, -inner(hd));
  shape.lineTo(inner(hw) - rad, -inner(hd));
  shape.quadraticCurveTo(inner(hw), -inner(hd), inner(hw), -inner(hd) + rad);
  shape.lineTo(inner(hw), inner(hd) - rad);
  shape.quadraticCurveTo(inner(hw), inner(hd), inner(hw) - rad, inner(hd));
  shape.lineTo(-inner(hw) + rad, inner(hd));
  shape.quadraticCurveTo(-inner(hw), inner(hd), -inner(hw), inner(hd) - rad);
  shape.lineTo(-inner(hw), -inner(hd) + rad);
  shape.quadraticCurveTo(-inner(hw), -inner(hd), -inner(hw) + rad, -inner(hd));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: cm(h) - 2 * e, bevelEnabled: true, bevelThickness: e, bevelSize: e, bevelSegments: 4, curveSegments: 12,
  });
  geo.rotateX(-Math.PI / 2);
  const mesh = shadow(new THREE.Mesh(geo, mat));
  mesh.position.set(cm(cx), cm(by) + e, cm(cz));
  parent.add(mesh);
  return mesh;
}

// Ilha de 90 cm. O tampo avança 25 cm ao norte para as banquetas entrarem embaixo.
function island(g, M) {
  B(g, M.main, 0, 0, 11.5, 186, 86, 33);
  [-62, 0, 62].forEach((x) => B(g, M.wood, x, 8, 28.3, 60, 74, 1));
  roundedSlab(g, M.granite, 0, 86, 0, 200, 4, 60, 5, 1);
  [-95, 95].forEach((x) => R(g, M.wood, x, 0, -6, 4, 86.5, 46, 1.5));
}

// Banqueta de 65 cm, proporcional à ilha
function stool(g, M) {
  Cyl(g, M.wood, 0, 61, 0, 18, 4);
  [[-13, -13], [13, -13], [-13, 13], [13, 13]].forEach(([x, z]) => {
    const leg = B(g, M.black, x, 0, z, 2.4, 62, 2.4);
    leg.rotation.set(z > 0 ? 0.05 : -0.05, 0, x > 0 ? -0.05 : 0.05);
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(cm(17), cm(0.8), 8, 32), M.black);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = cm(22);
  g.add(ring);
}

// Cama de casal com a cabeceira ao norte
function bed(g, M) {
  B(g, M.main, 0, 6, 0, 138, 24, 188);
  B(g, M.black, 0, 0, 0, 126, 6, 176);
  R(g, M.ceramic, 0, 30, 0, 136, 24, 186, 5);
  R(g, M.duvet, 0, 50, 34, 140, 6, 118, 3);
  B(g, M.wood, 0, 56, 72, 138, 1.5, 36);
  [-34, 34].forEach((x) => R(g, M.fabricLight, x, 54, -68, 62, 14, 42, 6));
  [-34, 34].forEach((x) => {
    const p = R(g, M.duvet, x, 58, -76, 56, 30, 12, 5);
    p.rotation.x = -0.12;
  });
}

// As geladeiras e os eletros têm a frente voltada para o norte, para a sala.
function fridge(g, M) {
  B(g, M.inoxDark, 0, 3, 3, 70, 183, 66);
  B(g, M.black, 0, 0, 3, 66, 3, 62);
  B(g, M.inox, 0, 3, -32, 70, 66, 5);
  B(g, M.inox, 0, 70, -32, 70, 116, 5);
  B(g, M.black, 0, 69.4, -32.2, 70, 0.6, 5.2);
  B(g, M.black, -28, 72, -36, 2, 40, 2.5);
  B(g, M.black, -28, 26, -36, 2, 40, 2.5);
}

function sink(g, M) {
  B(g, M.black, 0, 0, 0, 136, 10, 62);
  // Lava-louças slim de embutir: 45 cm, encostada na geladeira
  B(g, M.inox, -45.5, 10, -0.5, 45, 75, 63);
  B(g, M.black, -45.5, 76, -32.3, 45, 8, 0.6);
  B(g, M.inoxDark, -45.5, 68, -33.5, 34, 2, 2);
  // Gabinete da pia: 91 cm
  B(g, M.main, 22.5, 10, 0, 91, 76, 66);
  B(g, M.wood, 0, 10, -33.2, 0.5, 76, 0.5);
  [0, 46].forEach((x) => B(g, M.wood, x + 0.5, 12, -33.3, 44, 72, 0.6));
  // Tampo com recorte para a cuba
  const top = (x0, x1, z0, z1) => B(g, M.granite, (x0 + x1) / 2, 86, (z0 + z1) / 2, x1 - x0, 4, z1 - z0);
  top(-68, -18, -33, 33);
  top(42, 68, -33, 33);
  top(-18, 42, -33, -25);
  top(-18, 42, 15, 33);
  B(g, M.inox, 12, 72, -5, 60, 1, 40);
  B(g, M.inox, -17.5, 72, -5, 1, 17, 40);
  B(g, M.inox, 41.5, 72, -5, 1, 17, 40);
  B(g, M.inox, 12, 72, -24.5, 60, 17, 1);
  B(g, M.inox, 12, 72, 14.5, 60, 17, 1);
  Cyl(g, M.inox, 12, 90, 22, 1.2, 24);
  Cyl(g, M.inox, 12, 113, 12, 1, 20, 'z');
}

function stove(g, M) {
  B(g, M.white, 0, 6, 0, 62, 82, 67);
  [[-27, -29], [27, -29], [-27, 29], [27, 29]].forEach(([x, z]) => B(g, M.black, x, 0, z, 4, 6, 4));
  B(g, M.black, 0, 88, 0, 60, 1, 64);
  [[-15, -15], [15, -15], [-15, 15], [15, 15]].forEach(([x, z]) => {
    Cyl(g, M.inoxDark, x, 89, z, 7, 1);
    Cyl(g, M.black, x, 90, z, 4.5, 1);
    B(g, M.black, x, 91, z, 20, 1, 1.4);
    B(g, M.black, x, 91, z, 1.4, 1, 20);
  });
  B(g, M.screen, 0, 18, -33.8, 50, 42, 0.6);
  B(g, M.inox, 0, 62, -35, 52, 2, 2);
  B(g, M.white, 0, 68, -33.8, 60, 18, 0.5);
  [-22, -11, 0, 11, 22].forEach((x) => Cyl(g, M.black, x, 77, -34.8, 2, 2.4, 'z'));
  // Coifa de parede, 60 cm, a 75 cm do tampo. A chaminé acompanha o pé-direito.
  const hood = new THREE.Group();
  hood.userData.overhead = true;
  g.add(hood);
  B(hood, M.inox, 0, 165, 8.5, 60, 5, 50);
  B(hood, M.black, 0, 164.6, 8.5, 52, 0.4, 42);
  B(hood, M.inox, 0, 170, 18.5, 34, 14, 30);
  const duct = B(hood, M.inox, 0, HOOD_DUCT_BASE, 23.5, 26, 100, 20);
  duct.userData.hoodDuct = true;
}

export function fitHoodDuct(group, ceiling) {
  group.traverse((o) => {
    if (!o.userData.hoodDuct) return;
    const h = ceiling - HOOD_DUCT_BASE;
    o.scale.y = h / 100;
    o.position.y = cm(HOOD_DUCT_BASE + h / 2);
  });
}

function washer(g, M) {
  B(g, M.white, 0, 2, 0, 60, 83, 60);
  B(g, M.black, 0, 0, 0, 54, 2, 54);
  B(g, M.frame, 14, 73, -30.3, 24, 7, 0.5);
  B(g, M.ceramic, -18, 74, -30.3, 16, 6, 0.5);
  Cyl(g, M.inoxDark, 0, 40, -30.5, 19, 1.6, 'z');
  Cyl(g, M.screen, 0, 40, -31, 15.5, 1.6, 'z');
}

// Robô carregando na base. A parede fica a leste (+x). Medidas do S40: 34 × 34 × 9,8 cm e base de 13 × 12 × 9,5 cm.
function robot(g, M) {
  B(g, M.white, 16.9, 0, 0, 12.1, 9.5, 13);
  B(g, M.inoxDark, 10.6, 1, 0, 0.5, 2, 8);
  Cyl(g, M.white, -6, 0.6, 0, 17, 7);
  Cyl(g, M.ceramic, -6, 7.6, 0, 16, 0.3);
  Cyl(g, M.white, 1, 7.9, 0, 4.5, 1.9);
  B(g, M.inoxDark, -22.4, 2, 0, 0.6, 3, 16);
}

const BUILDERS = { rack, sofa, desk, chair, island, stool, bed, fridge, sink, stove, washer, robot };

export function buildItem(item, M) {
  const group = new THREE.Group();
  BUILDERS[item.build](group, M);
  group.userData.item = item;
  return group;
}

// Guarda-roupa até o teto dos dois lados da cama, com ponte e LED. Coordenadas da planta.
export function buildWardrobe(M, h) {
  const g = new THREE.Group();
  const face = -295;
  const module = (x0, x1, doors) => {
    const w = x1 - x0;
    B(g, M.main, (x0 + x1) / 2, 0, -325, w, h, 60);
    const dw = w / doors;
    for (let i = 0; i < doors; i++) {
      const cx = x0 + dw * (i + 0.5);
      B(g, M.main, cx, 2, face + 0.6, dw - 0.8, h - 4, 1.2);
      B(g, M.wood, cx + (i % 2 ? -dw / 2 + 3 : dw / 2 - 3), 75, face + 1.5, 1.5, 70, 1.2);
    }
  };
  module(135, 252, 3);
  module(390, 460, 2);

  // Painel fino, para sobrar profundidade na prateleira da cabeceira
  const bridge = 205;
  const panelTop = Math.min(h, bridge);
  B(g, M.wood, 321, 0, -354, 138, panelTop, 2);
  for (let x = 256; x <= 386; x += 8) B(g, M.wood, x, 96, -352.2, 3, panelTop - 96, 1.6);

  // Prateleira atrás dos travesseiros: tampo a 80 cm, 26 cm acima do colchão,
  // avançando 8 cm sobre a cabeceira. Sobra 16 cm de fundo útil.
  B(g, M.main, 321, 76, -344, 138, 4, 18);
  [275, 367].forEach((x) => {
    B(g, M.black, x, 83, -352.8, 12, 10, 0.4);
    [-2.4, 2.4].forEach((dx) => B(g, M.inoxDark, x + dx, 87, -352.5, 2.6, 1.2, 0.3));
  });
  // Celular e Kindle em tamanho real, como referência de escala
  B(g, M.black, 275, 80, -345, 16, 0.8, 7.5);
  B(g, M.screen, 275, 80.8, -345, 15, 0.1, 6.8);
  B(g, M.black, 367, 80, -345, 17.7, 0.9, 12.7);
  B(g, M.ceramic, 367, 80.9, -345, 14, 0.1, 10);

  // Armário sobre a cama. Na planta o corte fica abaixo dele.
  if (h <= bridge) return g;
  B(g, M.main, 321, bridge, -337.5, 138, h - bridge, 35);
  const doors = 3;
  const doorW = 138 / doors;
  for (let i = 0; i < doors; i++) {
    const cx = 252 + doorW * (i + 0.5);
    B(g, M.wood, cx, bridge + 1.5, -319.6, doorW - 0.8, h - bridge - 3, 0.8);
    B(g, M.main, cx, bridge + 4, -319, 22, 1.4, 1);
  }

  const leds = [
    { x: 321, y: bridge - 0.6, z: -321.5, w: 134, h: 0.6, d: 1.5 },
    { x: 253, y: 0, z: -324, w: 1, h: bridge, d: 1.2 },
    { x: 389, y: 0, z: -324, w: 1, h: bridge, d: 1.2 },
  ];
  leds.forEach((l) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(cm(l.w), cm(l.h), cm(l.d)), M.led);
    mesh.position.set(cm(l.x), cm(l.y + l.h / 2), cm(l.z));
    g.add(mesh);
  });
  return g;
}

// Partes fixas da cozinha, em coordenadas da planta.
export function buildKitchen(M, withUppers) {
  const g = new THREE.Group();
  // Bancada: arremate junto à geladeira e canto em frente ao shaft
  B(g, M.main, 6, 0, 320, 12, 86, 66);
  B(g, M.granite, 6, 86, 320, 12, 4, 66);
  B(g, M.main, 369.5, 0, 309.5, 59, 86, 45);
  B(g, M.wood, 369.5, 12, 286.7, 57, 72, 0.6);
  B(g, M.granite, 369.5, 86, 309.5, 59, 4, 45);
  if (!withUppers) return g;

  // Armários superiores: 70 cm de altura, de 1,50 a 2,20 m, com 35 cm de profundidade
  const bottom = 150, height = 70, depth = 35;
  const run = (x0, x1, back, doors) => {
    const front = back - depth, w = x1 - x0, dw = w / doors;
    B(g, M.main, (x0 + x1) / 2, bottom, back - depth / 2, w, height, depth);
    for (let i = 0; i < doors; i++) {
      const cx = x0 + dw * (i + 0.5);
      B(g, M.main, cx, bottom + 1, front - 0.6, dw - 0.8, height - 2, 1.2);
      B(g, M.wood, cx + (i % 2 ? -dw / 2 + 3 : dw / 2 - 3), bottom + 4, front - 1.5, 1.5, 24, 1.2);
    }
  };
  run(82, 218, 353, 3); // entre a geladeira e a coifa
  run(280, 340, 353, 2); // entre a coifa e o shaft
  run(340, 399, 332, 2); // em frente ao shaft
  return g;
}

export function buildBath(M, wallH) {
  const g = new THREE.Group();
  // Vaso com caixa acoplada, parede oeste, perto do box
  B(g, M.ceramic, 9, 42, -130, 18, 36, 38);
  R(g, M.ceramic, 30, 0, -130, 42, 40, 34, 8);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(cm(18), cm(18), cm(2), 32), M.ceramic);
  seat.scale.set(1.25, 1, 0.92);
  seat.position.set(cm(33), cm(41), cm(-130));
  seat.castShadow = true;
  g.add(seat);
  // Gabinete suspenso com cuba de apoio e espelho
  B(g, M.main, 23, 40, -60, 46, 42, 60);
  B(g, M.wood, 46.4, 42, -74.5, 0.8, 38, 28);
  B(g, M.wood, 46.4, 42, -45.5, 0.8, 38, 28);
  B(g, M.top, 23, 82, -60, 46, 3, 60);
  Cyl(g, M.ceramic, 26, 85, -60, 15, 11);
  Cyl(g, M.inox, 7, 85, -60, 1.1, 22);
  Cyl(g, M.inox, 13, 106, -60, 0.9, 12, 'x');
  if (wallH > 100) B(g, M.mirror, 0.8, 100, -60, 1.5, Math.min(85, wallH - 100), 58);
  // Box: vidro fixo, vidro de correr e chuveiro
  const glassH = Math.min(190, wallH), tileH = Math.min(210, wallH);
  B(g, M.glass, 45, 0, -159, 46, glassH, 1).castShadow = false;
  B(g, M.glass, 94, 0, -160.5, 46, glassH, 1).castShadow = false;
  if (wallH > 192) {
    B(g, M.frame, 70, 190, -159.5, 96, 2.5, 3);
    // Chuveiro na parede do shaft, longe da janela, como na imagem da construtora
    B(g, M.inox, 37.5, 205, -198.5, 30, 2.5, 2.5);
    Cyl(g, M.inox, 52, 202, -198.5, 11, 1.5);
  } else {
    Cyl(g, M.inoxDark, 70, 0.3, -198, 4, 0.2);
  }
  // Parede norte do box: o azulejo contorna a janela de ventilação (x 45 a 105, peitoril 160)
  B(g, M.tile, 33.5, 0, -237.3, 23, tileH, 1.2);
  B(g, M.tile, 111.5, 0, -237.3, 13, tileH, 1.2);
  B(g, M.tile, 75, 0, -237.3, 60, Math.min(160, tileH), 1.2);
  B(g, M.tile, 117.3, 0, -198.5, 1.2, tileH, 78);
  B(g, M.tile, 22.8, 0, -198.5, 1.2, tileH, 78);
  return g;
}

// Churrasqueira a carvão da construtora, no nicho do fim da sacada.
export function buildGrill(M, wallH) {
  const g = new THREE.Group();
  B(g, M.brick, 446.5, 0, 322.5, 65, 72, 61);
  B(g, M.charcoal, 446.5, 72, 322.5, 58, 4, 54);
  for (let i = 0; i < 26; i++) {
    const x = 422 + (i % 7) * 8, z = 300 + Math.floor(i / 7) * 13;
    R(g, M.charcoal, x, 76, z, 6, 3, 8, 1.2);
  }
  for (let x = 420; x <= 473; x += 4.5) B(g, M.inox, x, 85, 322.5, 0.7, 0.7, 54);
  [298, 347].forEach((z) => B(g, M.inox, 446.5, 84.3, z, 58, 0.7, 0.7));
  const liningH = Math.min(110, wallH - 72);
  B(g, M.brick, 417.5, 72, 322.5, 7, liningH, 61);
  B(g, M.brick, 475.5, 72, 322.5, 7, liningH, 61);
  B(g, M.brick, 446.5, 72, 350, 65, liningH, 6);
  // Chaminé
  if (wallH > 130) B(g, M.frame, 446.5, 130, 340, 46, Math.min(60, wallH - 130), 26);
  return g;
}
