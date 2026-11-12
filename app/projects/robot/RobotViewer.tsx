"use client";
// app/projects/robot/RobotViewer.tsx
// The 3D model of the robot on the robot project page (app/projects/robot/page.tsx).
// Everything is laid out in real millimetres: x = left/right, y = up, z = front/back (the face looks along +z).
// Drag to turn it all the way round, click then scroll to zoom, and flip x-ray to see the parts inside.
// Hover (or tap) a part to see what it is.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// ---- tweak these ----
const SHELL_COLOUR = 0xf3f3ef;   // the printed body (warm white)
const ACCENT_COLOUR = 0x1f5fd9;  // the blue bits (same blue as the logo)
const DARK_COLOUR = 0x1c1d21;    // the lift arm, tyres and face panel
const BASE_COLOUR = 0x2b2d33;    // the lower half of the body (the base piece)
const EYE_COLOUR = "#eaf4ff";    // the eyes on the oled
const SPIN_SPEED = 1.1;          // how fast it turns by itself when "spin" is on
const XRAY_GHOST = 0.17;         // in x-ray view, how visible the body stays (0 = gone, 1 = solid)
const XRAY_LINES = 0x30507f;     // in x-ray view, the fine lines round the body's edges
const LIFT_DEGREES = 70;         // how far the lift arm swings up
const VIEW_DISTANCE = 380;       // how far away the camera starts, in mm

// ---- where things are (mm). Change a number here and the part moves in the model ----
const HALF_W = 33;               // half the body's width (the body is 66 wide)
const FLOOR_TOP = 11.4;          // top of the floor plate (its underside is 9 above the desk)
const WHEEL_D = 52;              // wheel size. The seller doesn't publish it, so this is my estimate: measure yours and change it
const WHEEL_W = 8;               // wheel width (also an estimate)
const AXLE = { y: WHEEL_D / 2, z: -22 }; // the drive wheels' axle
const PIVOT = { y: 40, z: 10 };  // where the lift arm swings from (the lift servo's shaft)
const ARM_LEN = 48;              // pivot to the tip of the arm
const ARM_DOWN = 35.7;           // how far below level the arm points when it's down, in degrees
const SEAM = 30;                 // where the base and the top shell meet (the two main printed pieces)
const DECK = 36;                 // the flat back the battery pack sits on
// the body's side profile, as (z, y) points going round. A third number sets how round that corner is
const PROFILE_BASE: [number, number, number?][] = [[-42, 9], [42, 9], [42, SEAM, 0.5], [-42, SEAM, 0.5]];
const PROFILE_TOP: [number, number, number?][] = [[-42, SEAM + 0.5, 0.5], [42, SEAM + 0.5, 0.5], [42, 34, 1], [30, 64], [0, 64], [-3, DECK, 2], [-42, DECK, 2]];
const FACE = { bottom: [42, 34], top: [30, 64] }; // the sloped front the oled sits in

const deg = Math.PI / 180;
const std = (color: number, roughness = 0.6, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

// a box given by its two corners
const bx = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return m;
};
// cylinders lying along x, standing along y, or pointing along z
const cylX = (r: number, x0: number, x1: number, y: number, z: number, mat: THREE.Material, seg = 40) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), seg), mat);
  m.rotation.z = Math.PI / 2;
  m.position.set((x0 + x1) / 2, y, z);
  return m;
};
const cylY = (r: number, y0: number, y1: number, x: number, z: number, mat: THREE.Material, seg = 40) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(y1 - y0), seg), mat);
  m.position.set(x, (y0 + y1) / 2, z);
  return m;
};
const cylZ = (r: number, z0: number, z1: number, x: number, y: number, mat: THREE.Material, seg = 40) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), seg), mat);
  m.rotation.x = Math.PI / 2;
  m.position.set(x, y, (z0 + z1) / 2);
  return m;
};

// an outline with its corners rounded off
function roundedShape(pts: [number, number, number?][], r: number) {
  const s = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const k = Math.min(p[2] ?? r, la / 2, lb / 2);
    const inX = p[0] + ((a[0] - p[0]) / la) * k, inY = p[1] + ((a[1] - p[1]) / la) * k;
    const outX = p[0] + ((b[0] - p[0]) / lb) * k, outY = p[1] + ((b[1] - p[1]) / lb) * k;
    if (i === 0) s.moveTo(inX, inY); else s.lineTo(inX, inY);
    s.quadraticCurveTo(p[0], p[1], outX, outY);
  }
  s.closePath();
  return s;
}

// a side profile (z, y) pushed out sideways into a solid, x0 to x1 wide, with softened edges
function extrudeAcross(pts: [number, number, number?][], x0: number, x1: number, round: number, bevel: number) {
  const shape = roundedShape(pts.map(([z, y, r]) => [-z, y, r]), round);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: x1 - x0 - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel,
    bevelSegments: 4, curveSegments: 10,
  });
  g.rotateY(Math.PI / 2);
  g.translate(x0 + bevel, 0, 0);
  return g;
}

// builds the whole robot. Returns the model plus the bits the page animates
function buildRobot() {
  const root = new THREE.Group();
  const ghostMats: THREE.MeshStandardMaterial[] = []; // the body's materials: these fade in x-ray view
  const ghost = (m: THREE.MeshStandardMaterial) => { ghostMats.push(m); return m; };
  const lineMat = new THREE.LineBasicMaterial({ color: XRAY_LINES, transparent: true, opacity: 0 });
  const lines = new THREE.Group();
  root.add(lines);

  // a named part: hovering any piece of it shows its name
  const part = (label: string, parent: THREE.Object3D, ...objs: THREE.Object3D[]) => {
    const g = new THREE.Group();
    g.userData.label = label;
    objs.forEach((o) => g.add(o));
    parent.add(g);
    return g;
  };
  const asGhost = (m: THREE.Mesh) => { m.userData.ghost = true; return m; };
  const outline = (m: THREE.Mesh, angle = 30) => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, angle), lineMat);
    l.position.copy(m.position); l.rotation.copy(m.rotation); l.scale.copy(m.scale);
    lines.add(l);
    return m;
  };

  const M = {
    shell: ghost(std(SHELL_COLOUR, 0.48)),
    base: ghost(std(BASE_COLOUR, 0.55)),
    holder: ghost(std(0x18191c, 0.6)),
    frame: ghost(std(0xdadad6, 0.6)),
    visor: ghost(std(0x08090b, 0.8, 0, { envMapIntensity: 0.15 })),
    accent: std(ACCENT_COLOUR, 0.4),
    dark: std(DARK_COLOUR, 0.55),
    tyre: std(0x141416, 0.9),
    hub: std(0xe9e9e6, 0.5),
    steel: std(0xc9cbd0, 0.32, 1),
    brass: std(0xb8963f, 0.38, 1),
    chip: std(0x111214, 0.5),
    gold: std(0xd0aa4a, 0.35, 1),
    white: std(0xeeeeea, 0.6),
    pico: std(0x1d6b3c, 0.55),
    boardBlack: std(0x17181b, 0.55),
    boardBlue: std(0x1b3f96, 0.5),
    boardGreen: std(0x0f5a45, 0.55),
    battery: std(0xb4b7be, 0.35, 0.7),
    tape: std(0xd9a514, 0.6),
    servo: std(0x2e6fe2, 0.35),
    cone: std(0x45474d, 0.7),
    glass: std(0x06070a, 0.08, 0, { envMapIntensity: 1.5 }),
  };

  // ---------- the printed body: a dark base, and a white top with the head at the front ----------
  const shell = asGhost(new THREE.Mesh(extrudeAcross(PROFILE_TOP, -HALF_W, HALF_W, 6, 3), M.shell));
  const base = asGhost(new THREE.Mesh(extrudeAcross(PROFILE_BASE, -HALF_W, HALF_W, 5, 3), M.base));
  part("3d printed body: top shell, 2 mm walls", root, outline(shell, 24));
  part("3d printed body: base, 2 mm walls", root, outline(base, 24));

  // ---------- the face: a dark panel on the sloped front, with the oled behind a window in it ----------
  const face = new THREE.Group();
  const fz = FACE.bottom[0] - FACE.top[0], fy = FACE.top[1] - FACE.bottom[1];
  face.position.set(0, (FACE.bottom[1] + FACE.top[1]) / 2, (FACE.bottom[0] + FACE.top[0]) / 2);
  face.rotation.x = -Math.atan2(fz, fy);
  root.add(face);
  const eyeCanvas = document.createElement("canvas");
  eyeCanvas.width = 128; eyeCanvas.height = 64;
  const eyeTex = new THREE.CanvasTexture(eyeCanvas);
  eyeTex.magFilter = THREE.NearestFilter;
  eyeTex.colorSpace = THREE.SRGBColorSpace;
  const visorShape = roundedShape([[-20, -13.5], [20, -13.5], [20, 13.5], [-20, 13.5]], 5);
  const visor = asGhost(new THREE.Mesh(new THREE.ExtrudeGeometry(visorShape, { depth: 1.2, bevelEnabled: false, curveSegments: 10 }), M.visor));
  visor.position.z = -0.4;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(21.7, 10.9), new THREE.MeshBasicMaterial({ map: eyeTex, toneMapped: false }));
  screen.position.set(0, 2, 0.86);
  part("the face: 0.96 inch oled, 128 x 64 pixels", face, visor, screen,
    bx(-13, 13, -7.5, 11.5, -3.9, -2.4, M.glass),             // the display's glass
    bx(-13.5, 13.5, -14, 14, -5.5, -3.9, M.boardBlue),        // its board (27 x 28 mm)
    bx(-5, 5, 10.5, 13, -8, -5.5, M.chip));                   // the 4 pins on the back

  // ---------- drive: two wheel servos across the back. They plug straight into the pico, no driver board ----------
  const R = WHEEL_D / 2;
  for (const s of [1, -1]) {
    part("wheel servo (9 g size): spins all the way round, speed set by the pico", root,
      bx(s * 6, s * 32.4, AXLE.y - 6.1, AXLE.y + 6.1, AXLE.z - 6, AXLE.z + 17, M.servo),
      bx(s * 26, s * 28.5, AXLE.y - 6.1, AXLE.y + 6.1, AXLE.z - 10.7, AXLE.z + 21.7, M.servo),
      cylX(2.4, s * 32.4, s * 37.5, AXLE.y, AXLE.z, M.white, 20));
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(R - 2.6, 2.6, 14, 64), M.tyre);
    tyre.rotation.y = Math.PI / 2;
    tyre.scale.z = WHEEL_W / 5.2;
    tyre.position.set(s * (34.5 + WHEEL_W / 2), AXLE.y, AXLE.z);
    part("wheel and tyre: comes with the wheel servo and pushes onto its shaft", root, tyre,
      cylX(R - 4, s * 35.6, s * (33.4 + WHEEL_W), AXLE.y, AXLE.z, M.hub, 64),
      cylX(4.6, s * 34.2, s * (35 + WHEEL_W), AXLE.y, AXLE.z, M.accent, 28));
  }
  // a rounded bump under the middle is the third point it rests on. Printed as part of the base
  const skid = new THREE.Mesh(new THREE.SphereGeometry(4.5, 28, 20), M.base);
  skid.position.set(0, 4.5, 6);
  part("skid (printed): the third point it rests on", root, asGhost(skid), asGhost(cylY(4.5, 4.5, 9, 0, 6, M.base)));

  // ---------- the lift arm: one servo swings two arms with a blade and two tines on the front ----------
  const arm = new THREE.Group();
  arm.position.set(0, PIVOT.y, PIVOT.z);
  root.add(arm);
  const dn = ARM_DOWN * deg, tipY = -Math.sin(dn) * ARM_LEN, tipZ = Math.cos(dn) * ARM_LEN;
  const ax0 = HALF_W + 1.5, ax1 = HALF_W + 4.5; // the arms run just outside the body
  const armBits: THREE.Object3D[] = [];
  for (const s of [1, -1]) {
    const bar = new THREE.Group();
    bar.rotation.x = dn;
    bar.add(bx(s * ax0, s * ax1, -3, 3, 0, ARM_LEN, M.dark));
    armBits.push(bar, cylX(5.5, s * (ax0 - 0.4), s * (ax1 + 0.4), 0, 0, M.dark), cylX(2.6, s * (ax0 - 1), s * (ax1 + 1), 0, 0, M.accent, 24));
  }
  // the blade across the front (pushes), and two tines with a lip on the end (slide under things and pull them back)
  armBits.push(bx(-ax1, ax1, tipY - 9, tipY - 1, tipZ - 1, tipZ + 1.6, M.dark));
  for (const s of [1, -1]) {
    armBits.push(bx(s * 12, s * 17, tipY - 9, tipY - 6.6, tipZ, tipZ + 11, M.dark), bx(s * 12, s * 17, tipY - 9, tipY - 4, tipZ + 9, tipZ + 11, M.accent));
  }
  part("lift arm (printed): pushes, lifts and pulls", arm, ...armBits);
  part("micro servo (22 x 11.5 x 27 mm): swings the lift arm", root,
    bx(-32.4, -6, PIVOT.y - 6.1, PIVOT.y + 6.1, PIVOT.z - 6, PIVOT.z + 17, M.servo),
    bx(-28.5, -26, PIVOT.y - 6.1, PIVOT.y + 6.1, PIVOT.z - 10.7, PIVOT.z + 21.7, M.servo),
    cylX(2.4, -34.6, -32.4, PIVOT.y, PIVOT.z, M.white, 20));
  part("pivot pin for the right arm", root, cylX(2, 31, ax0, PIVOT.y, PIVOT.z, M.steel, 16));

  // ---------- floor level: the brain, and the small parts ----------
  part("raspberry pi pico 2 w (51 x 21 mm): the brain. everything plugs into it", root,
    bx(-10.5, 10.5, 12.6, 13.6, -41.5, 9.5, M.pico),
    bx(-4, 4, 13.6, 16.3, -43.2, -37.5, M.steel),            // usb
    bx(-3.5, 3.5, 13.6, 14.5, -25, -18, M.chip),             // the rp2350 chip
    bx(-5.5, 5.5, 13.6, 15.4, -7, 5, M.steel),               // the wireless module's shield
    bx(-8, -5.5, 13.6, 14.7, -34, -31, M.white));            // the bootsel button
  part("buzzer (12 x 10 mm): beeps and chirps", root, cylY(6, FLOOR_TOP, FLOOR_TOP + 10, 22, 6, M.chip), cylY(1.2, FLOOR_TOP + 10, FLOOR_TOP + 10.1, 22, 6, M.cone, 12));
  part("vibration motor: stuck to the floor so the whole body buzzes", root, cylY(5, FLOOR_TOP, FLOOR_TOP + 3, -22, 5, M.steel));
  part("two transistors on a scrap of board: switch the buzzer and the vibration motor", root,
    bx(-29, -13, 12, 13.2, -20, -6, M.boardGreen), bx(-26, -22, 13.2, 17, -17, -13, M.chip), bx(-20, -16, 13.2, 17, -17, -13, M.chip));
  // the edge sensor sits in the floor of the nose, its two infrared probes looking down
  part("edge sensor (34 x 27 mm, two infrared probes): looks down so it never drives off the desk", root,
    bx(-17.1, 17.1, 9.6, 11.2, 12.5, 39.7, M.boardBlack),
    bx(-9.5, -4.5, 6.5, 9.6, 33.5, 38, M.chip), bx(4.5, 9.5, 6.5, 9.6, 33.5, 38, M.chip),
    bx(-4, 4, 11.2, 13.8, 14, 17, M.white));
  // the distance sensor stands behind the chin, its two round "eyes" poking through
  const canMat = M.steel;
  const cans: THREE.Object3D[] = [];
  for (const s of [1, -1]) {
    cans.push(cylZ(8, 30, 42.4, s * 13, 21.5, canMat), cylZ(6.6, 42.4, 42.5, s * 13, 21.5, M.cone, 32));
  }
  part("ultrasonic distance sensor (45 x 20 mm): measures how far away things are, 2 cm to 4.5 m", root,
    bx(-22.5, 22.5, 11.5, 31.5, 28.4, 30, M.boardBlue), ...cans);

  // ---------- on the back: the battery pack, where you can reach it to swap batteries and switch it off ----------
  const cells: THREE.Object3D[] = [];
  for (const z of [-34.2, -22, -9.8]) cells.push(cylX(5.25, -22.2, 22.2, DECK + 7.6, z, M.battery, 24), cylX(2, 22.2, 23.4, DECK + 7.6, z, M.gold, 12));
  part("3 aaa batteries (4.5 v)", root, ...cells);
  part("battery holder with on/off switch (63.5 x 36.8 x 15.7 mm)", root,
    outline(asGhost(bx(-31.75, 31.75, DECK, DECK + 15.7, -40.4, -3.6, M.holder))),
    bx(-27, -19, DECK + 15.7, DECK + 16.5, -26, -18, M.chip), bx(-25, -22, DECK + 16.5, DECK + 17.7, -24, -20, M.white));

  // ---------- little details on the outside ----------
  part("usb port: code goes in here", root, bx(-5, 5, 13, 17, -42.15, -41.4, M.chip));
  // an accent line down each side
  for (const s of [1, -1]) root.add(bx(s * (HALF_W + 0.02), s * (HALF_W - 0.4), 32.4, 33.6, -36, 34, M.accent));

  // the soft shadow on the desk
  const sc = document.createElement("canvas");
  sc.width = sc.height = 256;
  const sctx = sc.getContext("2d");
  if (sctx) {
    const g = sctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, "rgba(0,0,0,0.34)"); g.addColorStop(0.55, "rgba(0,0,0,0.13)"); g.addColorStop(1, "rgba(0,0,0,0)");
    sctx.fillStyle = g; sctx.fillRect(0, 0, 256, 256);
  }
  const shadowTex = new THREE.CanvasTexture(sc);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(210, 240), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.05, 6);
  root.add(shadow);

  return { root, ghostMats, lineMat, arm, eyeCanvas, eyeTex, shadow };
}

// draws the eyes on the oled. open = 1 wide open, 0 shut. look = -1 left to 1 right
function drawEyes(c: HTMLCanvasElement, open: number, look: number, happy: number) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = EYE_COLOUR;
  const h = Math.max(4, 34 * open), w = 24, y = 32 - h / 2, dx = Math.round(look * 9);
  for (const cx of [38, 90]) {
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + dx, y, w, h, Math.min(8, h / 2));
    ctx.fill();
  }
  if (happy > 0) { // a smile pushes the bottoms of the eyes up into arches
    ctx.fillStyle = "#000";
    for (const cx of [38, 90]) {
      ctx.beginPath();
      ctx.ellipse(cx + dx, y + h + 6 - happy * 14, 17, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default function RobotViewer() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [xray, setXray] = useState(false);
  const [spin, setSpin] = useState(true);
  const [lift, setLift] = useState(false);
  const [label, setLabel] = useState<{ text: string; x: number; y: number } | null>(null);
  const xrayRef = useRef(false), spinRef = useRef(true), liftRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pm.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.85;
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-120, 220, 180);
    scene.add(key);

    const robot = buildRobot();
    scene.add(robot.root);

    const camera = new THREE.PerspectiveCamera(28, 1, 10, 4000);
    const target = new THREE.Vector3(0, 32, 4);
    camera.position.set(target.x + VIEW_DISTANCE * 0.56, target.y + VIEW_DISTANCE * 0.3, target.z + VIEW_DISTANCE * 0.77);
    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(target);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.enableZoom = false; // switched on by a click, so scrolling the page past the model doesn't zoom it
    controls.minDistance = 130;
    controls.maxDistance = 700;
    controls.autoRotateSpeed = SPIN_SPEED;
    let dragging = false;
    controls.addEventListener("start", () => { dragging = true; setLabel(null); });
    controls.addEventListener("end", () => { dragging = false; });

    const size = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.9 ? 28 / Math.max(0.55, w / h) * 0.9 : 28; // step back a little on tall, narrow screens
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(size);
    ro.observe(wrap);
    size();

    // hovering or tapping a part shows its name
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const meshes: THREE.Mesh[] = [];
    robot.root.traverse((o) => { if ((o as THREE.Mesh).isMesh && o !== robot.shadow) meshes.push(o as THREE.Mesh); });
    const pick = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const list = xrayRef.current ? meshes.filter((m) => !m.userData.ghost) : meshes;
      const hit = ray.intersectObjects(list, false)[0];
      let o: THREE.Object3D | null = hit ? hit.object : null;
      while (o && !o.userData.label) o = o.parent;
      const text = o ? (o.userData.label as string) : "";
      if (!text) setLabel(null);
      else setLabel({ text, x: e.clientX - r.left, y: e.clientY - r.top });
    };
    const onMove = (e: PointerEvent) => { if (!dragging && e.pointerType === "mouse") pick(e); };
    const onDown = (e: PointerEvent) => { controls.enableZoom = true; if (e.pointerType !== "mouse") pick(e); };
    const onLeave = () => { controls.enableZoom = false; setLabel(null); };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerleave", onLeave);

    let raf = 0, last = performance.now(), xr = 0, lf = 0, eyeKey = "", seen = true;
    const io = new IntersectionObserver((en) => { seen = en[0].isIntersecting; });
    io.observe(wrap);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!seen) return;
      // x-ray fades the body out so the parts show through
      const xg = xrayRef.current ? 1 : 0;
      xr += (xg - xr) * (1 - Math.exp(-dt * 7));
      if (Math.abs(xg - xr) < 0.003) xr = xg;
      for (const m of robot.ghostMats) {
        const tr = xr > 0.002;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } // three needs telling when this flips
        m.opacity = 1 - (1 - XRAY_GHOST) * xr;
        m.depthWrite = xr < 0.5;
      }
      robot.lineMat.opacity = 0.5 * xr;
      robot.shadow.material.opacity = 1 - 0.5 * xr;
      // the lift arm
      const lg = liftRef.current ? 1 : 0;
      lf += (lg - lf) * (1 - Math.exp(-dt * 5));
      robot.arm.rotation.x = -lf * LIFT_DEGREES * deg;
      // the face: blinks every few seconds, glances about, and smiles while the arm is up
      const t = now / 1000, b = t % 3.6;
      const open = b < 0.16 ? Math.abs(b - 0.08) / 0.08 : 1;
      const look = Math.round(Math.sin(t * 0.55) * Math.max(0, Math.sin(t * 0.21)) * 4) / 4;
      const k = `${open.toFixed(1)}|${look}|${lf.toFixed(1)}`;
      if (k !== eyeKey) { eyeKey = k; drawEyes(robot.eyeCanvas, open, look, lf); robot.eyeTex.needsUpdate = true; }
      controls.autoRotate = spinRef.current && !dragging;
      controls.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerleave", onLeave);
      controls.dispose();
      robot.root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
          const map = (x as THREE.MeshBasicMaterial).map;
          if (map) map.dispose();
          x.dispose();
        });
      });
      room.dispose();
      env.dispose();
      pm.dispose();
      renderer.dispose();
    };
  }, []);

  const pill = (on: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm lowercase transition ${on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700 hover:border-neutral-500"}`;

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas ref={canvasRef} role="img" aria-label="A 3D model of the robot. Drag to turn it round." className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />
      {/* the name of the part under the pointer */}
      {label && (
        <div className="pointer-events-none absolute z-10 max-w-[16rem] rounded-md bg-neutral-900 px-3 py-1.5 text-sm lowercase leading-snug text-white shadow-lg" style={{ left: Math.max(8, label.x + 14), top: Math.max(8, label.y + 14) }}>
          {label.text}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <span className="text-sm font-light lowercase text-neutral-500">drag to rotate, click then scroll to zoom</span>
        <span className="flex gap-2">
          <button type="button" aria-pressed={lift} onClick={() => { liftRef.current = !liftRef.current; setLift(liftRef.current); }} className={pill(lift)}>lift</button>
          <button type="button" aria-pressed={xray} onClick={() => { xrayRef.current = !xrayRef.current; setXray(xrayRef.current); }} className={pill(xray)}>x-ray</button>
          <button type="button" aria-pressed={spin} onClick={() => { spinRef.current = !spinRef.current; setSpin(spinRef.current); }} className={pill(spin)}>spin</button>
        </span>
      </div>
    </div>
  );
}
