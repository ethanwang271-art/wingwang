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
const VIEW_DISTANCE = 420;       // how far away the camera starts, in mm

// ---- where things are (mm). Change a number here and the part moves in the model ----
const HALF_W = 46.5;             // half the body's width (the body is 93 wide, so the 85 mm breadboard fits inside)
const WALL = 2;                  // wall thickness of the printed body
const BACK = -38, FRONT = 40;    // the body's back and front
const SEAM = 19;                 // where the base (holding the batteries) and the top shell meet
const SHELF = 20;                // the shelf the breadboard sits on (its underside)
const BOARD_TOP = SHELF + 1.5 + 9.7; // top of the breadboard (it is 9.7 mm thick)
const PICO_Y = BOARD_TOP + 2.5;  // the pico's underside: it stands on its header's 2.5 mm plastic strip
// the body's side profile, as (z, y) points going round. A third number sets how round that corner is
const PROFILE_BASE: [number, number, number?][] = [[BACK, 3], [FRONT, 3], [FRONT, SEAM, 0.5], [BACK, SEAM, 0.5]];
const PROFILE_TOP: [number, number, number?][] = [[BACK, SEAM + 0.5, 0.5], [FRONT, SEAM + 0.5, 0.5], [FRONT, 30, 2], [32, 72], [-28, 72], [BACK, 58]];
const FACE = { bottom: [FRONT, 30], top: [32, 72] }; // the sloped front the oled sits in

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

  // ---------- the printed body: a dark base that holds the batteries, and a white top shell with the face ----------
  const shell = asGhost(new THREE.Mesh(extrudeAcross(PROFILE_TOP, -HALF_W, HALF_W, 10, 3.5), M.shell));
  const base = asGhost(new THREE.Mesh(extrudeAcross(PROFILE_BASE, -HALF_W, HALF_W, 6, 3), M.base));
  part("3d printed body: top shell, 2 mm walls", body, outline(shell, 24));
  part("3d printed body: base, holds the batteries", body, outline(base, 24));
  part("shelf (printed): the breadboard sits on it", body, asGhost(bx(-HALF_W + WALL, HALF_W - WALL, SHELF, SHELF + 1.5, BACK + WALL, FRONT - 9, M.frame)));
  for (const [x, z] of [[-36, -28], [36, -28], [-36, 30], [36, 30]]) part("rubber foot", body, cylY(4, 0, 3, x, z, M.dark, 24));

  // ---------- the face: a dark panel on the sloped front, with the oled behind a window in it ----------
  const face = new THREE.Group();
  const fz = FACE.bottom[0] - FACE.top[0], fy = FACE.top[1] - FACE.bottom[1];
  face.position.set(0, (FACE.bottom[1] + FACE.top[1]) / 2, (FACE.bottom[0] + FACE.top[0]) / 2);
  face.rotation.x = -Math.atan2(fz, fy);
  body.add(face);
  const eyeCanvas = document.createElement("canvas");
  eyeCanvas.width = 128; eyeCanvas.height = 64;
  const eyeTex = new THREE.CanvasTexture(eyeCanvas);
  eyeTex.magFilter = THREE.NearestFilter;
  eyeTex.colorSpace = THREE.SRGBColorSpace;
  const visorShape = roundedShape([[-24, -17], [24, -17], [24, 17], [-24, 17]], 7);
  const visor = asGhost(new THREE.Mesh(new THREE.ExtrudeGeometry(visorShape, { depth: 1.2, bevelEnabled: false, curveSegments: 12 }), M.visor));
  visor.position.z = -0.4;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(21.7, 10.9), new THREE.MeshBasicMaterial({ map: eyeTex, toneMapped: false }));
  screen.position.set(0, 2, 0.86);
  part("the face: 0.96 inch oled, 128 x 64 pixels", face, visor, screen,
    bx(-13, 13, -7.5, 11.5, -3.9, -2.4, M.glass),             // the display's glass
    bx(-13.5, 13.5, -14, 14, -5.5, -3.9, M.boardBlue),        // its board
    bx(-5, 5, 10.5, 13, -14, -5.5, M.chip));                  // the 4 pins on the back, with jumper plugs on them

  // ---------- inside, bottom: the battery holder, lying flat in the base ----------
  const cells: THREE.Object3D[] = [];
  for (const z of [-29.5, -17.3, -5.1]) cells.push(cylX(5.25, -22.2, 22.2, 11.4, z, M.battery, 24), cylX(2, 22.2, 23.4, 11.4, z, M.gold, 12));
  part("3 aaa batteries (about 3.6 to 4.5 v)", body, ...cells);
  part("battery holder with on/off switch (63.5 x 36.8 x 15.7 mm). its switch faces down, through a hole in the base", body,
    outline(asGhost(bx(-31.75, 31.75, 3.5, 19.2, -36, 0.8, M.holder))),
    bx(-27, -19, 2.7, 3.5, -22, -14, M.chip), bx(-25, -22, 1.5, 2.7, -20, -16, M.white));
  part("1n4001 diode: stops usb power flowing back into the batteries", body,
    cylX(1.3, 33, 38.5, 24, -30, M.chip, 16), bx(37.4, 38.2, 22.7, 25.3, -31.3, -28.7, M.steel));

  // ---------- inside, middle: the breadboard, with the pico and the motion sensor plugged into it ----------
  const zMid = (BACK + WALL + 19) / 2; // the breadboard runs from the back wall to 19 mm in front of the middle
  part("half-size breadboard (85 x 55 mm): holds the pico and shares power between the parts", body,
    bx(-42.5, 42.5, SHELF + 1.5, BOARD_TOP, BACK + WALL, 19, M.white),
    bx(-42.5, 42.5, BOARD_TOP - 0.01, BOARD_TOP + 0.05, zMid - 1.2, zMid + 1.2, M.chip),            // the trench down the middle
    bx(-40, 40, BOARD_TOP - 0.01, BOARD_TOP + 0.05, BACK + WALL + 2, BACK + WALL + 2.6, M.redLine),  // power rails
    bx(-40, 40, BOARD_TOP - 0.01, BOARD_TOP + 0.05, 16.4, 17, M.accent));
  part("raspberry pi pico 2 w with header (51 x 21 mm): the brain, with wi-fi", body,
    bx(-40.5, 10.5, BOARD_TOP, PICO_Y, zMid - 10, zMid - 7.5, M.chip),       // the two header strips
    bx(-40.5, 10.5, BOARD_TOP, PICO_Y, zMid + 7.5, zMid + 10, M.chip),
    bx(-40.5, 10.5, PICO_Y, PICO_Y + 1, zMid - 10.5, zMid + 10.5, M.pico),
    bx(-42, -36.3, PICO_Y + 1, PICO_Y + 3.7, zMid - 4, zMid + 4, M.steel),   // usb
    bx(-22, -15, PICO_Y + 1, PICO_Y + 1.9, zMid - 3.5, zMid + 3.5, M.chip),  // the rp2350 chip
    bx(-4, 8, PICO_Y + 1, PICO_Y + 2.8, zMid - 5.5, zMid + 5.5, M.steel),    // the wireless module's shield
    bx(-34, -31, PICO_Y + 1, PICO_Y + 2.1, zMid + 5.5, zMid + 8, M.white));  // the bootsel button
  part("mpu6050 motion sensor (about 21 x 16 mm): feels being picked up and shaken", body,
    bx(17, 38, BOARD_TOP + 2.5, BOARD_TOP + 4, zMid - 8, zMid + 8, M.boardBlue),
    bx(17, 38, BOARD_TOP, BOARD_TOP + 2.5, zMid - 8, zMid - 5.5, M.chip),
    bx(25.5, 29.5, BOARD_TOP + 4, BOARD_TOP + 4.9, zMid - 2, zMid + 2, M.chip));
  // jumper wire plugs standing up from the breadboard
  const plugs: THREE.Object3D[] = [];
  const plugAt = (x: number, z: number, mat: THREE.Material) => plugs.push(bx(x - 1.25, x + 1.25, BOARD_TOP, BOARD_TOP + 14, z - 1.25, z + 1.25, mat));
  plugAt(-38, 15, M.redLine); plugAt(-35.5, 15, M.dark); plugAt(-33, 15, M.accent); plugAt(-30.5, 15, M.tape);
  plugAt(14, 15, M.redLine); plugAt(16.5, 15, M.dark); plugAt(19, 15, M.accent); plugAt(21.5, 15, M.tape);
  plugAt(40, BACK + WALL + 2.3, M.redLine); plugAt(40, BACK + WALL + 6, M.dark);
  part("jumper wires: plug every part into the breadboard, no soldering", body, ...plugs);

  // ---------- inside, top: the buzzer, on the right wall behind a grille ----------
  part("passive buzzer brick (19 x 27 mm): chirps, chimes and alarms", body,
    bx(HALF_W - WALL - 1.6, HALF_W - WALL, 36, 63, -12, 7, M.boardBlack),
    cylX(6, HALF_W - WALL - 1.6 - 9, HALF_W - WALL - 1.6, 49.5, -2.5, M.chip),
    bx(HALF_W - WALL - 9, HALF_W - WALL - 1.6, 37, 40, -9, -1, M.white));
  const holes: THREE.Object3D[] = [];
  for (const [dy, dz] of [[0, 0], [5, 0], [-5, 0], [2.5, 4.3], [-2.5, 4.3], [2.5, -4.3], [-2.5, -4.3]]) holes.push(cylX(1.1, HALF_W - 0.4, HALF_W + 0.05, 49.5 + dy, -2.5 + dz, M.chip, 16));
  part("speaker grille for the buzzer", body, ...holes);

  // ---------- little details on the outside ----------
  part("usb port: code and power go in here", body, bx(-HALF_W - 0.05, -HALF_W + 0.6, PICO_Y - 0.5, PICO_Y + 5, zMid - 5.5, zMid + 5.5, M.chip));
  // an accent line round the seam
  for (const s of [1, -1]) body.add(bx(s * (HALF_W + 0.02), s * (HALF_W - 0.4), SEAM - 0.6, SEAM + 0.6, BACK + 4, FRONT - 4, M.accent));

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
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(230, 230), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }));
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
    const target = new THREE.Vector3(0, 36, 1);
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
