"use client";
// app/projects/robot/RobotViewer.tsx
// The 3D model of version 1 of the robot (the stationary desk buddy) on its project page (app/projects/robot/page.tsx).
// Everything is laid out in real millimetres: x = left/right, y = up, z = front/back (the face looks along +z).
// Drag to turn it all the way round, click then scroll to zoom, and flip x-ray to see the parts inside.
// Hover (or tap) a part to see what it is. The wheeled version 2 model is saved in backups/2026-11-12-robot-v2-wheels/.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// ---- tweak these ----
const SHELL_COLOUR = 0xf3f3ef;   // the printed body (warm white)
const ACCENT_COLOUR = 0x1f5fd9;  // the blue bits (same blue as the logo)
const BASE_COLOUR = 0x2b2d33;    // the lower part of the body (the base piece)
const DARK_COLOUR = 0x1c1d21;    // the feet
const EYE_COLOUR = "#eaf4ff";    // the eyes on the oled
const SPIN_SPEED = 1.1;          // how fast it turns by itself when "spin" is on
const XRAY_GHOST = 0.17;         // in x-ray view, how visible the body stays (0 = gone, 1 = solid)
const XRAY_LINES = 0x30507f;     // in x-ray view, the fine lines round the body's edges
const SHAKE_SECONDS = 1.4;       // how long it wobbles when you press "shake"
const DIZZY_SECONDS = 2.2;       // how long the dizzy eyes last after that
const VIEW_DISTANCE = 470;       // how far away the camera starts, in mm

// ---- where things are (mm). Change a number here and the part moves in the model ----
// It's a little character: a big round head with the face, and a small body with the batteries, on two feet.
// the shells have 2 mm walls; every part below sits at least that far inside them
// the head: big enough for the breadboard to stand upright inside it, behind the face
const HEAD = { hw: 46.5, y0: 50, y1: 116, z0: -33, z1: 33, round: 20 }; // half width, bottom, top, back, front, corner roundness
const BOARD = { y0: 56, y1: 111, z0: -3.7, z1: 6 };   // the breadboard, standing upright (85 wide x 55 tall x 9.7 thick). Its holes face the back
const EAR = { y: 83.5, z: -10, r: 15 };               // the round ears on the sides of the head
// the body: holds the batteries, lying flat, with the motion sensor on top
const BODY = { hw: 38, y0: 2, y1: 48, z0: -27, z1: 27, round: 12 };
const NECK = { r: 14, y0: 46, y1: 52 };               // the hollow neck the wires run through

const std = (color: number, roughness = 0.6, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

// a box given by its two corners
const bx = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return m;
};
// cylinders lying along x, or standing along y
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
    redLine: std(0xd23a32, 0.5),
    cone: std(0x45474d, 0.7),
    glass: std(0x06070a, 0.08, 0, { envMapIntensity: 1.5 }),
  };

  // everything that wobbles when it's shaken goes in "body" (the shadow on the desk stays put)
  const body = new THREE.Group();
  root.add(body);

  // a rounded block, drawn from the side (z, y) and pushed out sideways, used for the head and the body
  const roundBlock = (hw: number, y0: number, y1: number, z0: number, z1: number, round: number, mat: THREE.Material) =>
    new THREE.Mesh(extrudeAcross([[z0, y0], [z1, y0], [z1, y1], [z0, y1]], -hw, hw, round, Math.min(8, round * 0.45)), mat);

  // ---------- the printed shells: head, body and neck ----------
  const head = asGhost(roundBlock(HEAD.hw, HEAD.y0, HEAD.y1, HEAD.z0, HEAD.z1, HEAD.round, M.shell));
  part("head (printed): holds the face, the breadboard, the pico and the buzzer", body, outline(head, 24));
  const torso = asGhost(roundBlock(BODY.hw, BODY.y0, BODY.y1, BODY.z0, BODY.z1, BODY.round, M.shell));
  part("body (printed): holds the batteries and the motion sensor. its bottom unscrews to change batteries", body, outline(torso, 24));
  part("neck (printed): hollow, so the wires can run from the body up to the head", body, asGhost(cylY(NECK.r, NECK.y0, NECK.y1, 0, 0, M.base, 40)));
  // two little feet, and two stubby arms
  for (const sx of [1, -1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), M.base);
    foot.scale.set(13, 8, 19);
    foot.position.set(sx * 18, 8, 9);
    part("foot (printed)", body, asGhost(foot));
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(6.5, 16, 8, 20), M.shell);
    arm.position.set(sx * (BODY.hw + 4), 29, 2);
    arm.rotation.z = sx * 0.32;
    part("arm (printed)", body, asGhost(arm));
  }
  // a little antenna on top
  part("antenna (printed, just for looks)", body, cylY(1.6, HEAD.y1 - 2, HEAD.y1 + 11, 0, -4, M.base, 16),
    (() => { const b = new THREE.Mesh(new THREE.SphereGeometry(4.5, 24, 16), M.accent); b.position.set(0, HEAD.y1 + 14, -4); return b; })());
  // round ears. The left one has the pico's usb port in it; the right one is a grille for the buzzer
  for (const sx of [1, -1]) {
    const ear = cylX(EAR.r, sx * HEAD.hw - sx * 0.5, sx * (HEAD.hw + 3.5), EAR.y, EAR.z, M.base, 48);
    const ring = cylX(EAR.r - 3, sx * (HEAD.hw + 3.4), sx * (HEAD.hw + 3.7), EAR.y, EAR.z, M.accent, 48);
    part(sx < 0 ? "left ear: the usb port is inside it" : "right ear: a grille for the buzzer", body, ear, ring);
  }
  part("usb port: code and power go in here", body, bx(-HEAD.hw - 3.8, -HEAD.hw - 3.4, EAR.y - 2.5, EAR.y + 2.5, -12.5, -4.5, M.chip));
  const holes: THREE.Object3D[] = [];
  for (const [dy, dz] of [[0, 0], [5, 0], [-5, 0], [2.5, 4.3], [-2.5, 4.3], [2.5, -4.3], [-2.5, -4.3]]) holes.push(cylX(1.1, HEAD.hw + 3.6, HEAD.hw + 3.8, EAR.y + dy, -14.5 + dz, M.chip, 16));
  part("grille for the buzzer", body, ...holes);
  // blue cheeks
  for (const sx of [1, -1]) {
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), M.accent);
    cheek.position.set(sx * 31, 69, HEAD.z1 + 0.06);
    body.add(cheek);
  }

  // ---------- the face: a dark panel on the front of the head, with the oled behind a window in it ----------
  const face = new THREE.Group();
  face.position.set(0, 86, HEAD.z1);
  body.add(face);
  const eyeCanvas = document.createElement("canvas");
  eyeCanvas.width = 128; eyeCanvas.height = 64;
  const eyeTex = new THREE.CanvasTexture(eyeCanvas);
  eyeTex.magFilter = THREE.NearestFilter;
  eyeTex.colorSpace = THREE.SRGBColorSpace;
  const visorShape = roundedShape([[-27, -17], [27, -17], [27, 17], [-27, 17]], 13);
  const visor = asGhost(new THREE.Mesh(new THREE.ExtrudeGeometry(visorShape, { depth: 1, bevelEnabled: false, curveSegments: 14 }), M.visor));
  visor.position.z = -0.6;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(21.7, 10.9), new THREE.MeshBasicMaterial({ map: eyeTex, toneMapped: false }));
  screen.position.set(0, 1.5, 0.45);
  part("the face: 0.96 inch oled, 128 x 64 pixels", face, visor, screen,
    bx(-13, 13, -8, 11, -4, -2.5, M.glass),                   // the display's glass
    bx(-13.5, 13.5, -14.5, 13.5, -5.6, -4, M.boardBlue),      // its board
    bx(-15.5, 15.5, -16.5, 15.5, -10, -5.6, M.holder),        // its case (size estimated: measure yours)
    bx(-5, 5, 10, 12.5, -24, -10, M.chip));                   // the 4 jumper plugs on its pins

  // ---------- inside the head: the breadboard standing upright, with the pico on its back ----------
  const zHoles = BOARD.z0, yMid = (BOARD.y0 + BOARD.y1) / 2;
  part("half-size breadboard (85 x 55 mm), standing upright: shares power between the parts", body,
    bx(-42.5, 42.5, BOARD.y0, BOARD.y1, BOARD.z0, BOARD.z1, M.white),
    bx(-42.5, 42.5, yMid - 1.2, yMid + 1.2, zHoles - 0.05, zHoles + 0.01, M.chip),
    bx(-40, 40, BOARD.y0 + 2, BOARD.y0 + 2.6, zHoles - 0.05, zHoles + 0.01, M.redLine),
    bx(-40, 40, BOARD.y1 - 2.6, BOARD.y1 - 2, zHoles - 0.05, zHoles + 0.01, M.accent));
  const pz = zHoles - 2.5; // the pico's board, standing off the breadboard on its header strips
  part("raspberry pi pico 2 w with header (51 x 21 mm): the brain, with wi-fi", body,
    bx(-42.5, 8.5, yMid - 10, yMid - 7.5, pz, zHoles, M.chip),
    bx(-42.5, 8.5, yMid + 7.5, yMid + 10, pz, zHoles, M.chip),
    bx(-42.5, 8.5, yMid - 10.5, yMid + 10.5, pz - 1, pz, M.pico),
    bx(-44, -38.3, yMid - 4, yMid + 4, pz - 3.7, pz - 1, M.steel),   // usb, facing the left ear
    bx(-24, -17, yMid - 3.5, yMid + 3.5, pz - 1.9, pz - 1, M.chip),  // the rp2350 chip
    bx(-6, 6, yMid - 5.5, yMid + 5.5, pz - 2.8, pz - 1, M.steel),    // the wireless module's shield
    bx(-36, -33, yMid + 5.5, yMid + 8, pz - 2.1, pz - 1, M.white));  // the bootsel button
  const plugs: THREE.Object3D[] = [];
  const plugAt = (x: number, y: number, mat: THREE.Material) => plugs.push(bx(x - 1.25, x + 1.25, y - 1.25, y + 1.25, zHoles - 14, zHoles, mat));
  plugAt(-39, BOARD.y0 + 5, M.redLine); plugAt(-36.5, BOARD.y0 + 5, M.dark); plugAt(-34, BOARD.y0 + 5, M.accent); plugAt(-31.5, BOARD.y0 + 5, M.tape);
  plugAt(12, yMid - 6, M.redLine); plugAt(14.5, yMid - 6, M.dark); plugAt(17, yMid + 6, M.accent); plugAt(19.5, yMid + 6, M.tape);
  plugAt(39, BOARD.y0 + 2.3, M.redLine); plugAt(39, BOARD.y1 - 2.3, M.dark);
  part("jumper wires: plug every part into the breadboard, no soldering", body, ...plugs);
  part("passive buzzer brick (19 x 27 mm): chirps, chimes and alarms, behind the right ear", body,
    bx(33.9, 35.5, EAR.y - 13.5, EAR.y + 13.5, -24, -5, M.boardBlack),
    cylX(6, 35.5, 44.5, EAR.y, -14.5, M.chip),
    bx(28, 33.9, EAR.y - 12.5, EAR.y - 9.5, -21, -13, M.white));

  // ---------- inside the body: the batteries, the motion sensor and the diode ----------
  const cells: THREE.Object3D[] = [];
  for (const z of [-12.2, 0, 12.2]) cells.push(cylX(5.25, -22.2, 22.2, 16, z, M.battery, 24), cylX(2, 22.2, 23.4, 16, z, M.gold, 12));
  part("3 aaa batteries (about 3.6 to 4.5 v)", body, ...cells);
  part("battery holder with on/off switch (63.5 x 36.8 x 15.7 mm). its switch faces down, through a hole between the feet", body,
    outline(asGhost(bx(-31.75, 31.75, 8.2, 23.9, -18.4, 18.4, M.holder))),
    bx(-4, 4, 7.4, 8.2, -10, -2, M.chip), bx(-1.5, 1.5, 5.8, 7.4, -8, -4, M.white));
  part("mpu6050 motion sensor (about 21 x 16 mm): feels being picked up and shaken", body,
    bx(-10.5, 10.5, 26, 27.5, -8, 8, M.boardBlue), bx(-2, 2, 27.5, 28.4, -2, 2, M.chip),
    bx(-10.5, 10.5, 27.5, 30, 5.5, 8, M.chip),
    bx(-8.5, -6, 30, 44, 6, 8.5, M.redLine), bx(-6, -3.5, 30, 44, 6, 8.5, M.dark), bx(-3.5, -1, 30, 44, 6, 8.5, M.accent), bx(-1, 1.5, 30, 44, 6, 8.5, M.tape));
  part("1n4001 diode: stops usb power flowing back into the batteries", body,
    cylX(1.3, 14, 19.5, 28, -14, M.chip, 16), bx(18.4, 19.2, 26.7, 29.3, -15.3, -12.7, M.steel));

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
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.05, 1);
  root.add(shadow);

  return { root, body, ghostMats, lineMat, eyeCanvas, eyeTex, shadow };
}

// draws the oled. open = 1 wide open, 0 shut. look = -1 left to 1 right. dizzy = spirals for eyes.
// clock = show the time instead of eyes (like the real one will, set over wi-fi)
function drawEyes(c: HTMLCanvasElement, open: number, look: number, dizzy: number, clock: string) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = ctx.strokeStyle = EYE_COLOUR;
  if (clock) {
    ctx.font = "bold 34px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(clock, 64, 34);
    return;
  }
  if (dizzy >= 0) { // two spirals, turning
    ctx.lineWidth = 3;
    for (const cx of [38, 90]) {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 6; a += 0.2) {
        const r = 1 + a * 1.15, x = cx + Math.cos(a + dizzy) * r, y = 32 + Math.sin(a + dizzy) * r;
        if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return;
  }
  const h = Math.max(4, 34 * open), w = 24, y = 32 - h / 2, dx = Math.round(look * 9);
  for (const cx of [38, 90]) {
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + dx, y, w, h, Math.min(8, h / 2));
    ctx.fill();
  }
}

export default function RobotViewer() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [xray, setXray] = useState(false);
  const [spin, setSpin] = useState(true);
  const [clock, setClock] = useState(false);
  const [label, setLabel] = useState<{ text: string; x: number; y: number } | null>(null);
  const xrayRef = useRef(false), spinRef = useRef(true), clockRef = useRef(false), shakeRef = useRef(-1);

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
    const target = new THREE.Vector3(0, 62, 0);
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

    let raf = 0, last = performance.now(), xr = 0, eyeKey = "", seen = true;
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
      // "shake": it wobbles about like it's being shaken, then its eyes go dizzy
      const t = now / 1000;
      if (shakeRef.current === 0) shakeRef.current = t; // just pressed
      const st = shakeRef.current > 0 ? t - shakeRef.current : -1;
      if (st > SHAKE_SECONDS + DIZZY_SECONDS) shakeRef.current = -1;
      const wob = st >= 0 && st < SHAKE_SECONDS ? Math.sin(st * 34) * (1 - st / SHAKE_SECONDS) : 0;
      robot.body.rotation.z = wob * 0.14;
      robot.body.rotation.x = wob * 0.05;
      robot.body.position.y = Math.abs(wob) * 9;
      // the face: blinks every few seconds and glances about; dizzy after a shake; or the time, if "clock" is on
      const b = t % 3.6;
      const open = b < 0.16 ? Math.abs(b - 0.08) / 0.08 : 1;
      const look = Math.round(Math.sin(t * 0.55) * Math.max(0, Math.sin(t * 0.21)) * 4) / 4;
      const dizzy = st >= 0 ? Math.round(t * 8) / 2 : -1;
      const d = new Date();
      const time = clockRef.current && st < 0 ? `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}` : "";
      const k = `${open.toFixed(1)}|${look}|${dizzy}|${time}`;
      if (k !== eyeKey) { eyeKey = k; drawEyes(robot.eyeCanvas, open, look, dizzy, time); robot.eyeTex.needsUpdate = true; }
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
      <canvas ref={canvasRef} role="img" aria-label="A 3D model of the desk robot. Drag to turn it round." className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />
      {/* the name of the part under the pointer */}
      {label && (
        <div className="pointer-events-none absolute z-10 max-w-[16rem] rounded-md bg-neutral-900 px-3 py-1.5 text-sm lowercase leading-snug text-white shadow-lg" style={{ left: Math.max(8, label.x + 14), top: Math.max(8, label.y + 14) }}>
          {label.text}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <span className="text-sm font-light lowercase text-neutral-500">drag to rotate, click then scroll to zoom</span>
        <span className="flex gap-2">
          <button type="button" onClick={() => { shakeRef.current = 0; }} className={pill(false)}>shake</button>
          <button type="button" aria-pressed={clock} onClick={() => { clockRef.current = !clockRef.current; setClock(clockRef.current); }} className={pill(clock)}>clock</button>
          <button type="button" aria-pressed={xray} onClick={() => { xrayRef.current = !xrayRef.current; setXray(xrayRef.current); }} className={pill(xray)}>x-ray</button>
          <button type="button" aria-pressed={spin} onClick={() => { spinRef.current = !spinRef.current; setSpin(spinRef.current); }} className={pill(spin)}>spin</button>
        </span>
      </div>
    </div>
  );
}
