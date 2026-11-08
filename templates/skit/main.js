// Claudejon skit — low-poly boy + Claude robot, night window, 1080×1920.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from '/core/lib.js';

const T = await (await fetch('timeline.json')).json();
const L = Object.fromEntries(T.lines.map(l => [l.id, l]));
const DUR = T.dur;
const W = innerWidth, H = innerHeight, S = 1.5;

// ── renderer + post ───────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(S); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0d2c');
const camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 60);
const post = makePost(renderer, scene, camera, W, H, { ssaa: S, ao: true, aoAmt: .6, aoRadius: .2 });
post.dof.aper = 46; post.dof.maxCoc = 18;
post.bloom.strength = .45; post.bloom.radius = .55; post.bloom.threshold = 1.0;
post.vig.uniforms.amt.value = .38; post.vig.uniforms.sat.value = 1.08; post.vig.uniforms.contrast.value = .08;

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .85, ...o });
const glow = (c, k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });
function mesh(geo, mat, parent, pos = [0, 0, 0], shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(...pos);
  m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// ── lights ────────────────────────────────────────────────────────────────────
scene.add(new THREE.HemisphereLight('#8a93ff', '#2a1c3c', 1.0));
const key = new THREE.DirectionalLight('#ffd8b6', 2.7);
key.position.set(-2.2, 3.4, 3.6); key.target.position.set(0, 1, 0);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.5, bottom: -1, near: .5, far: 12 });
key.shadow.bias = -.0004; key.shadow.normalBias = .02;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight('#6f84ff', 2.4); rim.position.set(1.6, 2.6, -3); scene.add(rim);
const warm = new THREE.PointLight('#ff9b6b', 2.2, 4.5, 1.6); warm.position.set(1.5, 1.1, 1.3); scene.add(warm);

// ── room: bench, wall, window, city bokeh, string lights ─────────────────────
mesh(box(6, .5, .95), M('#26214a'), scene, [0, .25, .02]);
mesh(new THREE.PlaneGeometry(20, 20).rotateX(-Math.PI / 2), M('#15132e'), scene, [0, 0, 0]);
mesh(box(8, .95, .12), M('#1b1940'), scene, [0, .47, -2.62]);
const frameM = M('#11123a', { roughness: .6 });
for (const x of [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6]) mesh(box(.08, 6, .1), frameM, scene, [x, 3, -2.6], false);
for (const y of [.95, 2.75, 4.4]) mesh(box(8, .07, .1), frameM, scene, [0, y, -2.6], false);
{ // sky gradient far behind the glass
  const g = new THREE.PlaneGeometry(70, 46, 1, 8); const col = [];
  const top = new THREE.Color('#2a3bc0'), mid = new THREE.Color('#2033a0'), bot = new THREE.Color('#0e1250');
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + 23) / 46; const c = v > .45 ? mid.clone().lerp(top, (v - .45) / .55) : bot.clone().lerp(mid, v / .45); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true })); m.position.set(0, 6, -20); scene.add(m);
}
{ // city lights (become bokeh through the depth of field)
  const N = 260, r = mulberry(7);
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.06, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), N);
  const pal = ['#ffd08a', '#ffe9c4', '#ffb070', '#ff6f8e', '#ff4d4d', '#9fb4ff', '#ffffff'];
  const o = new THREE.Object3D();
  for (let i = 0; i < N; i++) {
    const z = -5 - r() * 11; o.position.set((r() - .5) * 14, -.6 + Math.pow(r(), 1.6) * 4.2, z);
    o.scale.setScalar(.6 + r() * 1.6); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    im.setColorAt(i, new THREE.Color(pal[Math.floor(r() * pal.length)]).multiplyScalar(1.6 + r() * 2.2));
  }
  scene.add(im);
}
const bulbs = [];
{ // string lights across the top of the window
  const bm = glow('#ffe1a6', 4.5), wire = M('#0c0c22');
  for (let i = 0; i <= 18; i++) {
    const u = i / 18, x = lerp(-2.6, 2.6, u), y = 2.32 - Math.sin(u * Math.PI) * .22;
    bulbs.push(mesh(new THREE.IcosahedronGeometry(.035, 1), bm, scene, [x, y, -1.7], false));
  }
  const neon = glow('#ff3b4a', 3.2); mesh(box(.05, 1.6, .05), neon, scene, [1.42, 1.55, -2.45], false);
}

// ── boy ───────────────────────────────────────────────────────────────────────
const skin = M('#f2c4a0'), hairM = M('#8a4c2a'), sweater = M('#6a54d8'), pants = M('#4c40bf'), shoeM = M('#f1f1f4'), dark = M('#141018', { roughness: .35 });
const boy = new THREE.Group(); boy.position.set(-.33, .5, .12); scene.add(boy);
const hips = new THREE.Group(); boy.add(hips);
const torso = new THREE.Group(); hips.add(torso);
mesh(box(.46, .52, .28), sweater, torso, [0, .34, 0]);
mesh(new THREE.CylinderGeometry(.12, .13, .09, 6), sweater, torso, [0, .63, 0]);
const headP = new THREE.Group(); headP.position.set(0, .66, 0); torso.add(headP);
mesh(new THREE.CylinderGeometry(.065, .07, .1, 6), skin, headP, [0, .02, 0]);
const head = new THREE.Group(); head.position.set(0, .26, 0); headP.add(head);
const skull = mesh(new THREE.IcosahedronGeometry(.24, 1), skin, head); skull.scale.set(1, 1.1, .97);
for (const s of [-1, 1]) mesh(new THREE.IcosahedronGeometry(.05, 0), skin, head, [s * .235, .0, 0]);
{ // hair: a cap and spikes
  const cap = mesh(new THREE.SphereGeometry(.252, 7, 4, 0, Math.PI * 2, 0, Math.PI * .42), hairM, head, [0, .03, -.02]); cap.rotation.x = -.32;
  const r = mulberry(3);
  for (let i = 0; i < 17; i++) {
    const az = (i / 17) * Math.PI * 2 + r() * .3, ph = .25 + r() * .75;
    if (Math.cos(az) > .55 && ph > .7) continue;           // keep the forehead clear
    const n = new THREE.Vector3(Math.sin(az) * Math.sin(ph), Math.cos(ph), Math.cos(az) * Math.sin(ph) - .25).normalize();
    const h = .16 + r() * .14;
    const c = mesh(new THREE.ConeGeometry(.06 + r() * .03, h, 5), hairM, head);
    c.position.copy(n.clone().multiplyScalar(.22)).add(new THREE.Vector3(0, .05, 0));
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n.clone().add(new THREE.Vector3(0, .7, -.2)).normalize());
    c.translateY(h * .35);
  }
}
const eyes = [], brows = [];
for (const s of [-1, 1]) {
  const e = new THREE.Group(); e.position.set(s * .088, .035, .222); head.add(e);
  mesh(new THREE.SphereGeometry(.03, 8, 6), dark, e, [0, 0, 0], false);
  mesh(new THREE.SphereGeometry(.009, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }), e, [.009, .011, .024], false);
  eyes.push(e);
  const b = mesh(box(.075, .017, .02), hairM, head, [s * .088, .105, .226], false); b.userData.s = s; brows.push(b);
}
const nose = mesh(new THREE.ConeGeometry(.032, .075, 4), M('#e9a28c'), head, [0, -.02, .255], false); nose.rotation.x = Math.PI / 2;
const mouth = mesh(box(.1, 1, .02), M('#5c1a1c', { roughness: .5 }), head, [0, -.105, .222], false);
const arms = {};
for (const s of [-1, 1]) {
  const sh = new THREE.Group(); sh.position.set(s * .27, .53, 0); torso.add(sh);
  mesh(new THREE.IcosahedronGeometry(.075, 0), sweater, sh, [0, 0, 0]);
  mesh(box(.12, .3, .12), sweater, sh, [0, -.15, 0]);
  const el = new THREE.Group(); el.position.set(0, -.29, 0); sh.add(el);
  mesh(box(.11, .27, .11), sweater, el, [0, -.13, 0]);
  const hand = mesh(box(.1, .1, .09), skin, el, [0, -.31, 0]);
  const finger = mesh(box(.032, .1, .032), skin, hand, [0, -.09, 0]); finger.visible = false;
  arms[s] = { sh, el, hand, finger };
}
for (const s of [-1, 1]) {
  mesh(box(.17, .15, .46), pants, hips, [s * .11, .075, .2]);
  mesh(box(.15, .44, .15), pants, hips, [s * .11, -.16, .41]);
  mesh(box(.17, .1, .27), shoeM, hips, [s * .11, -.43, .46]);
}

// ── Claude robot ──────────────────────────────────────────────────────────────
const coral = M('#e07a52', { roughness: .7 });
const robot = new THREE.Group(); robot.position.set(.48, .5, .02); scene.add(robot);
const rb = new THREE.Group(); rb.position.y = .13; robot.add(rb);
mesh(box(.8, .58, .52), coral, rb, [0, .29, 0]);
const reyes = [];
for (const s of [-1, 1]) reyes.push(mesh(box(.055, .14, .02), dark, rb, [s * .14, .36, .262], false));
const rarms = [];
for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * .4, .3, 0); rb.add(a); mesh(box(.1, .11, .16), coral, a, [s * .05, 0, 0]); rarms.push(a); }
for (const x of [-.29, -.1, .1, .29]) mesh(box(.085, .14, .09), coral, robot, [x, .07, .12]);

// ── timing helpers ────────────────────────────────────────────────────────────
const at = (id, rel) => L[id].t0 + rel;
function speech(id, t) {          // 0..1 mouth/voice level of a line at time t
  const l = L[id]; if (t < l.t0 || t > l.t1) return 0;
  const e = T.env[id], f = (t - l.t0) * T.fps, i = Math.floor(f), k = f - i;
  return clamp(lerp(e[i] ?? 0, e[i + 1] ?? 0, k), 0, 1.2);
}
const who = t => T.lines.find(l => t >= l.t0 && t <= l.t1);
const boyTalk = t => ['b1', 'b2', 'b3'].reduce((a, id) => a + speech(id, t), 0);
const botTalk = t => ['c1', 'c2', 'c3', 'c4'].reduce((a, id) => a + speech(id, t), 0);

// boy poses: per arm [shoulder x, shoulder z(out), elbow x], plus body
const P = {
  rest:   { a: [[-.38, .08, -1.15], [-.38, .08, -1.15]], pitch: 0, roll: 0, lift: 0, lean: 0 },
  wow:    { a: [[-.7, .35, -1.6], [-.7, .35, -1.6]], pitch: -.14, roll: 0, lift: .05, lean: -.1 },
  cheer:  { a: [[-2.5, .35, -.5], [-2.5, .35, -.5]], pitch: -.12, roll: 0, lift: .06, lean: -.06 },   // both arms up
  point:  { a: [[-.38, .08, -1.15], [-1.35, -.05, -.25]], pitch: -.04, roll: .05, lift: .03, lean: .06 },
  shrug:  { a: [[-.25, .5, -1.7], [-.25, .5, -1.7]], pitch: -.03, roll: .1, lift: .03, lean: -.02 },
  think:  { a: [[-.38, .08, -1.15], [-.6, -.35, -2.3]], pitch: -.08, roll: -.08, lift: 0, lean: 0 },   // hand to chin
  thumbs: { a: [[-.38, .08, -1.15], [-1.0, .2, -1.9]], pitch: -.04, roll: -.06, lift: .02, lean: 0 },
};
const KEYS = [
  [0, 'cheer'], [at('b1', 2.0), 'point'], [at('b1', 4.6), 'rest'],
  [at('b2', 0), 'shrug'], [at('b2', 3.0), 'rest'],
  [at('c2', 3.2), 'think'], [at('c3', 6.0), 'rest'],
  [at('b3', -.1), 'wow'], [at('b3', 2.3), 'point'],
  [at('c4', .2), 'thumbs'],
];
function pose(t) {
  let i = 0; while (i + 1 < KEYS.length && KEYS[i + 1][0] <= t) i++;
  const a = P[KEYS[Math.max(0, i - 1)][1]], b = P[KEYS[i][1]];
  const k = i === 0 ? 1 : eio(seg(t, KEYS[i][0], KEYS[i][0] + .38));
  const mix = (x, y) => lerp(x, y, k);
  return { a: [0, 1].map(j => [0, 1, 2].map(n => mix(a.a[j][n], b.a[j][n]))), pitch: mix(a.pitch, b.pitch), roll: mix(a.roll, b.roll), lift: mix(a.lift, b.lift), lean: mix(a.lean, b.lean) };
}
const blink = (t, seed) => { const p = 3.3, n = Math.floor((t + seed) / p), s = (t + seed) - n * p - (.6 + hash(n + seed) * 2); return s > 0 && s < .14 ? 1 - Math.sin(s / .14 * Math.PI) * .92 : 1; };

function animate(t) {
  // boy
  const p = pose(t), talkB = boyTalk(t);
  const bounce = seg(t, 0, .2) * (1 - seg(t, at('b1', 1.8), at('b1', 2.2)));
  hips.position.y = p.lift + bounce * Math.abs(Math.sin(t * 8)) * .03;
  torso.rotation.x = p.lean; torso.scale.y = 1 + Math.sin(t * 2.3) * .008;
  boy.rotation.y = .16;
  headP.rotation.y = .42 + Math.sin(t * .7) * .03 + (talkB > .2 ? Math.sin(t * 5.1) * .02 : 0);
  headP.rotation.x = p.pitch + talkB * .025 * Math.sin(t * 9);
  headP.rotation.z = p.roll;
  for (const [j, s] of [[0, -1], [1, 1]]) {
    const A = arms[s], q = p.a[j];
    A.sh.rotation.set(q[0], 0, s * q[1]);
    A.el.rotation.set(q[2], 0, 0);
    A.finger.visible = s === 1 && ((t > at('b1', 2.0) && t < at('b1', 4.7)) || t > at('b3', 2.3) && t < at('c4', .3));
  }
  // face
  const glad = seg(t, 0, .3) * (1 - seg(t, at('b1', 4.4), at('b1', 4.9))) + seg(t, at('c4', .2), at('c4', .6));
  const wow = seg(t, at('b3', -.1), at('b3', .15)) * (1 - seg(t, at('b3', 2.0), at('b3', 2.4)));
  const curious = seg(t, at('c2', 3.0), at('c2', 3.4)) * (1 - seg(t, at('c3', 6.0), at('c3', 6.4)));
  const bl = blink(t, .3);
  for (const e of eyes) { const sc = 1 + wow * .3 + curious * .08; e.scale.set(sc, sc * bl, sc); }
  for (const b of brows) {
    b.position.y = .105 + wow * .035 + glad * .02 + curious * .015;
    b.rotation.z = -b.userData.s * (clamp(glad, 0, 1) * .16 + curious * .08);   // positive = angry, so glad/curious lift the inner ends
  }
  const open = clamp(talkB, 0, 1);
  mouth.scale.set(1 + clamp(glad, 0, 1) * .4 - open * .15, .012 + open * .07 + wow * .03, 1);
  // robot
  const talkC = botTalk(t);
  const tilt = seg(t, at('c1', -.1), at('c1', .3)) * (1 - seg(t, at('c1', 1.5), at('c1', 1.9)));   // curious tilt
  const laugh = seg(t, at('c2', 0), at('c2', .15)) * (1 - seg(t, at('c2', 1.0), at('c2', 1.3)));
  const sure = seg(t, at('c2', 1.0), at('c2', 1.2)) * (1 - seg(t, at('c2', 2.4), at('c2', 2.7)));
  const proud = seg(t, at('c3', 6.0), at('c3', 6.2)) * (1 - seg(t, at('c3', 7.4), at('c3', 7.8)));
  const hop = Math.max(sure * Math.abs(Math.sin((t - at('c2', 1.0)) * 9)) * .08, laugh * Math.abs(Math.sin((t - at('c2', 0)) * 11)) * .05,
                       proud * Math.abs(Math.sin((t - at('c3', 6.0)) * 9)) * .06);
  rb.position.y = .13 + hop;
  rb.scale.set(1 - talkC * .025, 1 + talkC * .05 + laugh * .04 * Math.sin(t * 22), 1 - talkC * .02);
  const rToCam = seg(t, at('c2', -.3), at('c2', .3)) * (1 - seg(t, at('b3', -.2), at('b3', .2)));
  const rEnd = seg(t, at('c4', -.3), at('c4', .3));
  robot.rotation.y = lerp(lerp(-.42, -.15, eio(rToCam)), 0, eio(rEnd));
  rb.rotation.z = tilt * .12 + Math.sin(t * 1.3) * .015 + (talkC > .2 ? Math.sin(t * 7) * .012 : 0);
  rb.rotation.x = 0;
  const rbl = blink(t, 1.7);
  for (const e of reyes) e.scale.y = rbl * (laugh > .5 ? .45 : 1) * (1 + talkC * .08 + tilt * .15);
  rarms[0].rotation.z = -.15 + talkC * Math.sin(t * 6) * .25 + rEnd * Math.sin(t * 7) * .45;
  rarms[1].rotation.z = .15 - talkC * Math.sin(t * 6 + 1) * .25 - sure * .5 - rEnd * .35;
  bulbs.forEach((b, i) => b.scale.setScalar(.9 + .2 * Math.sin(t * 1.7 + i * 1.3)));
}

// ── shots ─────────────────────────────────────────────────────────────────────
const BOYHEAD = new THREE.Vector3(-.33, 1.42, .12), ROBO = new THREE.Vector3(.48, .95, .02), MID = new THREE.Vector3(.08, 1.1, .05);
const SH = [
  { t0: 0,               p0: [-.18, 1.26, 3.0],  p1: [-.22, 1.27, 2.6],  l: [-.3, 1.14, 0],  fov: 42, f: BOYHEAD },
  { t0: at('c1', -.2),   p0: [.3, 1.1, 2.9],     p1: [.34, 1.08, 2.6],   l: [.47, 1.12, 0],  fov: 42, f: ROBO },
  { t0: at('b2', -.2),   p0: [-.16, 1.44, 2.05], p1: [-.19, 1.44, 1.8],  l: [-.31, 1.42, 0], fov: 36, f: BOYHEAD },
  { t0: at('c2', -.15),  p0: [.3, 1.1, 3.0],     p1: [.35, 1.08, 2.6],   l: [.47, 1.18, 0],  fov: 42, f: ROBO },
  { t0: at('c2', 3.0),   p0: [.08, 1.62, 4.6],   p1: [.08, 1.6, 4.25],   l: [.08, 1.56, 0],  fov: 42, f: MID },   // wide; characters sit low, chat panel above
  { t0: at('b3', -.2),   p0: [-.9, 1.5, 2.7],    p1: [-.8, 1.48, 2.4],   l: [-.1, 1.1, 0],   fov: 42, f: BOYHEAD },
  { t0: at('c4', -.2),   p0: [.48, 1.06, 2.7],   p1: [.48, 1.04, 2.3],   l: [.48, 1.08, 0],  fov: 40, f: ROBO },
];
SH.forEach((s, i) => s.t1 = i + 1 < SH.length ? SH[i + 1].t0 : DUR);
function shoot(t) {
  const s = SH.findLast(s => t >= s.t0) || SH[0], k = eio(seg(t, s.t0, s.t1));
  camera.position.set(...s.p0.map((v, i) => lerp(v, s.p1[i], k)));
  camera.fov = s.fov; camera.aspect = W / H; camera.updateProjectionMatrix();
  camera.lookAt(...s.l);
  post.dof.focus = camera.position.distanceTo(s.f);
}

// ── UI: hook, subtitles, chat demo, end card ─────────────────────────────────
const ui = document.getElementById('ui');
const el = (html, cls, parent = ui) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; parent.appendChild(d); return d; };
const hook = el(`Bizga ham <span>o'rgating!</span> 🙏`, 'hook');
const CUES = [
  ['b1', .3, 2.0, `<b>Claude...</b> 🤩`],
  ['b1', 2.0, 99, `Kechagi videodan keyin bizga <b>juda ko'p</b> odam yozishdi!`],
  ['c1', 0, 99, `Rostdanmi? <b>Nima deyishdi?</b>`],
  ['b2', 0, 99, `«Shunaqa videolar qanday qilinadi, <b>bizga ham o'rgating</b>», deyishdi.`],
  ['c2', 0, 3.17, `<b>Albatta o'rgatamiz!</b> 😄 Juda oson.`],
  ['c2', 3.17, 99, `<b>Claude ilovasini</b> oching → skillni qo'shing → «boshla» deb yozing.`],
  ['c3', 0, 2.08, `Keyin Claude o'zi so'raydi:`],
  ['c3', 2.08, 5.81, `qanday video, <b>qaysi tilda</b>, qahramonlar kim...`],
  ['c3', 5.81, 99, `Siz javob berasiz — <b>video tayyor!</b> 🎬`],
  ['b3', 0, 2.33, `Voy, shunchalik <b>osonmi?</b> 😳`],
  ['b3', 2.33, 99, `Skillni <b>qayerdan</b> olamiz?`],
  ['c4', 0, 99, `Skillni olish uchun <b>Directga yozing!</b> ✉️`],
].map(([id, a, b, html]) => ({ t0: at(id, a), t1: Math.min(at(id, b), L[id].t1 + .3), html, d: el(html, 'sub') }));

// chat demo: a generic AI chat, not any app's real interface
const chat = el(`<div class="hd"><div class="dot"></div><div>Claude ilovasi</div></div><div class="body"></div>`, 'panel'); chat.id = 'chat';
const body = chat.querySelector('.body');
const MSG = [
  ['c2', 5.0, `<div class="sk">🧩 Skill qo'shildi: <b>Video studiya</b></div>`],
  ['c2', 6.9, `<div class="me">boshla</div>`],
  ['c3', 1.2, `<div class="ai">Zo'r! Bir nechta savol:</div>`],
  ['c3', 2.2, `<div class="ai">🎬 Qanday video kerak?</div>`],
  ['c3', 3.0, `<div class="ai">🌐 Qaysi tilda?</div>`],
  ['c3', 3.8, `<div class="ai">🧑‍🤝‍🧑 Qahramonlar kim?</div>`],
  ['c3', 4.6, `<div class="ai">🎙 Ovoz qanaqa bo'lsin?</div>`],
  ['c3', 6.2, `<div class="ok">✅ Video tayyor!</div>`],
].map(([id, a, html]) => ({ t: at(id, a), d: el(html, 'msg', body) }));
const CHAT0 = at('c2', 3.1), CHAT1 = at('b3', -.15);
const end = el(`<div class="a">Skillni olish uchun 👇</div><div class="b">✉️ Directga yozing</div><div class="c">@claudejon_youtube</div>`, ''); end.id = 'end';
const END0 = at('c4', .3);
const pop = (t, t0) => { const k = seg(t, t0, t0 + .32); return `scale(${lerp(.82, 1, back(k, 2.2))})`; };

function overlay(t) {
  const hk = seg(t, .15, .45) * (1 - seg(t, 3.6, 3.95));
  hook.style.opacity = hk; hook.style.transform = pop(t, .15);
  for (const c of CUES) {
    const on = t >= c.t0 && t < c.t1;
    c.d.style.display = on ? 'block' : 'none';
    if (on) c.d.style.transform = `translateY(${(1 - eo(seg(t, c.t0, c.t0 + .18))) * 18}px)`;
  }
  const chOn = t >= CHAT0 && t < CHAT1;
  chat.style.display = chOn ? 'block' : 'none';
  if (chOn) { chat.style.opacity = seg(t, CHAT0, CHAT0 + .2) * (1 - seg(t, CHAT1 - .25, CHAT1)); chat.style.transform = `translateY(${(1 - eo(seg(t, CHAT0, CHAT0 + .3))) * -40}px)`; }
  for (const m of MSG) {
    const on = t >= m.t;
    m.d.style.display = on ? 'block' : 'none';
    if (on) { m.d.style.opacity = seg(t, m.t, m.t + .15); m.d.style.transform = `translateY(${(1 - eo(seg(t, m.t, m.t + .25))) * 24}px)`; }
  }
  end.style.display = t >= END0 ? 'block' : 'none';
  if (t >= END0) { end.style.transform = pop(t, END0); end.style.opacity = seg(t, END0, END0 + .15); }
}

// sound cues for the mix
window.EV = [
  { t: .15, type: 'whoosh' },
  { t: CHAT0, type: 'whoosh' },
  ...MSG.map(m => ({ t: m.t, type: m.d.querySelector('.ok') ? 'ding' : m.d.querySelector('.me') ? 'tick' : 'pop' })),
  { t: END0, type: 'ding' },
  ...SH.slice(1).map(s => ({ t: s.t0, type: 'cut' })),
];
window.DUR = DUR;
const CLEAN = location.search.includes("clean");
if (CLEAN) ui.style.display = "none";
const AVATAR = location.search.includes("avatar");
if (AVATAR) {
  boy.visible = false; ui.style.display = "block"; ui.innerHTML = "";
  const tag = document.createElement("div"); tag.textContent = "Claudejon";
  Object.assign(tag.style, { position: "absolute", left: 0, right: 0, top: "70%", textAlign: "center", color: "#fff",
    fontFamily: "'Lilita One', sans-serif", fontSize: Math.round(W * .13) + "px", letterSpacing: "2px",
    textShadow: "0 8px 0 rgba(10,8,40,.55), 0 0 40px rgba(10,8,40,.8)" });
  ui.appendChild(tag);
}
window.render = t => {
  animate(t); shoot(t); if (!AVATAR) overlay(t);
  if (AVATAR) { robot.rotation.y = 0; rb.rotation.set(0, 0, 0); camera.position.set(.48, 1.02, 2.55); camera.fov = 34; camera.updateProjectionMatrix(); camera.lookAt(.48, .74, 0); post.dof.focus = camera.position.distanceTo(new THREE.Vector3(.48, .92, .28)); }
  post.composer.render();
};
await document.fonts.ready;
window.render(0);
window.READY = true;
