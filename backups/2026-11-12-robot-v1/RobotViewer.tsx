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
const VIEW_DISTANCE = 340;       // how far away the camera starts, in mm

// ---- where things are (mm). Change a number here and the part moves in the model ----
const HALF_W = 31;               // half the body's width (the body is 62 wide)
const WALL = 2;                  // wall thickness of the printed body
const FLOOR_TOP = 12.6;          // top of the floor plate (its underside is 10.2 above the desk)
const AXLE = { y: 20, z: -20 };  // the drive wheels' axle (40 mm wheels, so the centre is 20 up)
const PIVOT = { y: 47, z: -10 }; // where the lift arm swings from (the servo's shaft)
const ARM_LEN = 68;              // pivot to the tip of the arm
const ARM_DOWN = 30;             // how far below level the arm points when it's down, in degrees
const SEAM = 27;                 // where the base and the top shell meet (the two main printed pieces)
// the body's side profile, as (z, y) points going round. A third number sets how round that corner is
const PROFILE_BASE: [number, number, number?][] = [[-40, 10.2], [38, 10.2], [38, SEAM, 0.5], [-40, SEAM, 0.5]];
const PROFILE_TOP: [number, number, number?][] = [[-40, SEAM + 0.5, 0.5], [38, SEAM + 0.5, 0.5], [38, 28, 1], [21, 58], [-26, 58], [-40, 43]];
const FACE = { bottom: [38, 28], top: [21, 58] }; // the sloped front the oled sits in

const deg = Math.PI / 180;
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
    frame: ghost(std(0xdadad6, 0.6)),
    visor: ghost(std(0x0b0c0e, 0.18, 0, { envMapIntensity: 1.3 })),
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

  // ---------- the printed body ----------
  const shell = asGhost(new THREE.Mesh(extrudeAcross(PROFILE_TOP, -HALF_W, HALF_W, 6, 3), M.shell));
  const base = asGhost(new THREE.Mesh(extrudeAcross(PROFILE_BASE, -HALF_W, HALF_W, 5, 3), M.base));
  part("3d printed body: top shell, 2 mm walls", root, outline(shell, 24));
  part("3d printed body: base, 2 mm walls", root, outline(base, 24));
  // the two shelves inside: one for the battery, one for the pico and the power board
  part("battery shelf (printed)", root, asGhost(bx(-HALF_W + WALL, HALF_W - WALL, 26, 27.5, -38, 26, M.frame)));
  part("electronics shelf (printed)", root, asGhost(bx(-HALF_W + WALL, HALF_W - WALL, 33.5, 35, -38, 14, M.frame)));

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
  screen.position.z = 0.86;
  part("the face: 0.96 inch oled, 128 x 64 pixels", face, visor, screen,
    bx(-13.3, 13.3, -9.5, 9.5, -3.9, -2.4, M.glass),            // the display's glass
    bx(-13.35, 13.35, -14.6, 14.6, -5.5, -3.9, M.boardBlack),   // its board
    bx(-12, -6, -3, 3, -8.6, -5.5, M.white), bx(6, 12, -3, 3, -8.6, -5.5, M.white), // the two plug sockets on the back
    bx(-4, 4, 9, 13.5, -7, -5.5, M.chip));

  // ---------- drive: two gearmotors across the back, a wheel on each, a ball caster under the front ----------
  for (const s of [1, -1]) {
    part("micro metal gearmotor, 100:1 (10 x 12 x 26 mm)", root,
      bx(s * 19, s * 29, AXLE.y - 5, AXLE.y + 5, AXLE.z - 6, AXLE.z + 6, M.brass),
      bx(s * 3, s * 19, AXLE.y - 5, AXLE.y + 5, AXLE.z - 6, AXLE.z + 6, M.steel),
      cylX(1.5, s * 29, s * 39, AXLE.y, AXLE.z, M.steel, 16),
      bx(s * 1.5, s * 3, AXLE.y - 3, AXLE.y + 3, AXLE.z - 4, AXLE.z + 4, M.gold));
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(17.6, 2.4, 14, 56), M.tyre);
    tyre.rotation.y = Math.PI / 2;
    tyre.scale.z = 1.45; // 7 mm wide
    tyre.position.set(s * 35.5, AXLE.y, AXLE.z);
    part("wheel, 40 x 7 mm, press-fits the motor's 3 mm shaft", root, tyre,
      cylX(16.2, s * 34.1, s * 36.9, AXLE.y, AXLE.z, M.hub, 56),
      cylX(4.2, s * 32.2, s * 39.2, AXLE.y, AXLE.z, M.accent, 28));
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(4.76, 28, 20), M.steel);
  ball.position.set(0, 4.76, 20);
  part("ball caster, 3/8 inch metal ball", root, ball, cylY(6.6, 4.4, 10.2, 0, 20, M.chip),
    cylY(1.9, FLOOR_TOP, FLOOR_TOP + 1.6, 6.7, 20, M.steel, 6), cylY(1.9, FLOOR_TOP, FLOOR_TOP + 1.6, -6.7, 20, M.steel, 6));

  // ---------- the lift arm: one servo swings two arms with a blade and two tines on the front ----------
  const arm = new THREE.Group();
  arm.position.set(0, PIVOT.y, PIVOT.z);
  root.add(arm);
  const dn = ARM_DOWN * deg, tipY = -Math.sin(dn) * ARM_LEN, tipZ = Math.cos(dn) * ARM_LEN;
  const armBits: THREE.Object3D[] = [];
  for (const s of [1, -1]) {
    const bar = new THREE.Group();
    bar.rotation.x = dn;
    bar.add(bx(s * 34, s * 37, -3, 3, 0, ARM_LEN, M.dark));
    armBits.push(bar, cylX(6, s * 33.6, s * 37.4, 0, 0, M.dark), cylX(2.6, s * 33, s * 38, 0, 0, M.accent, 24));
  }
  // the blade across the front (pushes), and two tines with a lip on the end (slide under things and pull them back)
  armBits.push(bx(-37, 37, tipY - 10, tipY - 1, tipZ - 2, tipZ + 0.6, M.dark));
  for (const s of [1, -1]) {
    armBits.push(bx(s * 12, s * 17, tipY - 10, tipY - 7.6, tipZ, tipZ + 15, M.dark), bx(s * 12, s * 17, tipY - 10, tipY - 5, tipZ + 13, tipZ + 15, M.accent));
  }
  part("lift arm (printed): pushes, lifts and pulls", arm, ...armBits);
  // the servo that drives it, lying sideways with its shaft through the left wall
  part("micro servo (23 x 11 x 29 mm): drives the lift arm", root,
    bx(-29, -6.5, PIVOT.y - 6.1, PIVOT.y + 6.1, PIVOT.z - 6, PIVOT.z + 17, M.servo),
    bx(-26, -23.5, PIVOT.y - 6.1, PIVOT.y + 6.1, PIVOT.z - 10.7, PIVOT.z + 21.7, M.servo),
    cylX(2.4, -33.4, -29, PIVOT.y, PIVOT.z, M.white, 20),
    cylX(5.5, -33.4, -31.6, PIVOT.y, PIVOT.z, M.white, 28));
  part("pivot pin for the right arm", root, cylX(2, 29, 33.6, PIVOT.y, PIVOT.z, M.steel, 16));

  // ---------- floor level: sound, motor driver, haptics, the tilt sensor and the sensors that look down ----------
  const speaker = cylY(10, FLOOR_TOP, FLOOR_TOP + 5, 0, 2, M.chip);
  speaker.scale.z = 1.5; // a 30 x 20 mm oval
  const cone = cylY(7.5, FLOOR_TOP - 0.3, FLOOR_TOP + 0.2, 0, 2, M.cone);
  cone.scale.z = 1.6;
  part("speaker, 8 ohm 1 W (30 x 20 x 5 mm), faces down through the floor", root, speaker, cone);
  part("i2s amplifier (19.4 x 17.8 mm): plays sound through the speaker", root,
    bx(-9.7, 9.7, 20, 21.2, -13, 4.8, M.boardBlue), bx(-2.5, 2.5, 21.2, 22.2, -6.5, -1.5, M.chip), bx(-8, -3, 21.2, 23, -12.5, -8.5, M.accent));
  part("dual motor driver (12.7 x 20.3 mm): runs both drive motors", root,
    bx(13, 25.7, 14, 15.2, -10, 10.3, M.boardGreen), bx(16.5, 22.2, 15.2, 16.4, -3, 3, M.chip));
  part("accelerometer + gyro (26 x 17.8 mm): feels tilts, taps and being picked up", root,
    bx(10.6, 28.4, 20, 21.2, -13, 13, M.boardBlack), bx(17.5, 21.5, 21.2, 22.1, -2, 2, M.chip),
    bx(15.5, 23.5, 21.2, 24.6, -12.6, -8.6, M.white), bx(15.5, 23.5, 21.2, 24.6, 8.6, 12.6, M.white));
  part("haptic driver (25.8 x 17.8 mm): plays buzz patterns on the vibration motor", root,
    bx(-28, -10.2, 14, 15.2, -13, 12.8, M.boardBlack), bx(-21, -17, 15.2, 16.1, -2, 2, M.chip),
    bx(-23, -15, 15.2, 18.6, -12.6, -8.6, M.white), bx(-23, -15, 15.2, 18.6, 8.4, 12.4, M.white));
  part("vibration motor (10 mm disc), stuck to the floor so the whole body buzzes", root, cylY(5, FLOOR_TOP, FLOOR_TOP + 2.7, -16, -33, M.steel));
  for (const s of [1, -1]) {
    part("edge sensor (7.5 x 20 mm): looks down so it never drives off the desk", root,
      bx(s * 20, s * 27.5, FLOOR_TOP, FLOOR_TOP + 1.2, 15.5, 35.5, M.boardGreen),
      bx(s * 21.6, s * 25.9, FLOOR_TOP - 2.6, FLOOR_TOP, 29.5, 33.5, M.chip));
  }
  part("distance sensor (13 x 18 mm): measures how far away things are, 3 cm to 2 m", root,
    bx(-9, 9, 13.5, 26.5, 33.5, 34.7, M.boardGreen), bx(-2.4, 2.4, 18.6, 21.4, 34.7, 35.9, M.chip));
  part("power switch", root, bx(-4.3, 4.3, 18, 22, -38, -34, M.steel), bx(-1.2, 1.8, 19.2, 20.8, -41, -38, M.chip));

  // ---------- battery shelf ----------
  part("lipo battery, 3.7 V 1200 mAh (34 x 62 x 5 mm)", root,
    bx(-17, 17, 27.5, 32.5, -37, 25, M.battery), bx(-17.05, 17.05, 27.45, 32.55, 17, 24, M.tape));

  // ---------- electronics shelf: the brain and the power board, usb ports out the back ----------
  part("raspberry pi pico 2 w (51 x 21 mm): the brain, with wi-fi and bluetooth", root,
    bx(-27, -6, 35.5, 36.5, -38.5, 12.5, M.pico),
    bx(-20.5, -12.5, 36.5, 39.2, -40.2, -34.5, M.steel),   // usb
    bx(-20, -13, 36.5, 37.4, -22, -15, M.chip),            // the rp2350 chip
    bx(-22, -11, 36.5, 38.3, -4, 8, M.steel),              // the wireless module's shield
    bx(-24.5, -22, 36.5, 37.6, -31, -28, M.white));        // the bootsel button
  part("5 V boost + lipo charger (23 x 45 mm): charges over usb, powers everything", root,
    bx(4, 27, 35.5, 37.1, -38.5, 6.5, M.boardBlue),
    bx(11.5, 19.5, 37.1, 39.8, -40.2, -34.5, M.steel),     // charging usb
    bx(18, 26, 37.1, 42.5, -20, -12, M.white),             // battery socket
    bx(7, 14, 37.1, 40.1, -10, -3, M.chip),                // the coil
    bx(15, 20, 37.1, 38.1, -28, -23, M.chip));
  part("i2s microphone (16.7 x 12.7 mm): hears claps and how loud the room is", root,
    bx(14.5, 27.2, 54.8, 56, 2, 18.7, M.boardBlack), bx(19, 22.6, 53.7, 54.8, 8.6, 12.2, M.steel));

  // ---------- little details on the outside ----------
  part("window for the distance sensor", root, bx(-5.5, 5.5, 17.2, 22.8, 37.6, 38.15, M.glass));
  part("microphone hole", root, cylY(0.9, 57.6, 58.08, 20.8, 10.4, M.chip, 16));
  part("usb port: code goes in here", root, bx(-21.5, -11.5, 36, 39.8, -40.15, -39.4, M.chip));
  part("usb port: charging", root, bx(10.5, 20.5, 36.6, 40.4, -40.15, -39.4, M.chip));
  // an accent line down each side
  for (const s of [1, -1]) root.add(bx(s * 31.02, s * 30.6, 30.2, 31.4, -34, 30, M.accent));

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
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(190, 220), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }));
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
    const target = new THREE.Vector3(0, 30, 6);
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
