// Claudejon horror short — low-poly, 1080×1920, narrator + word subtitles + countdown + A/B choice.
// Everything the story needs is in story.json (written per video) and timeline.json (built from the voice files).
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, eio, eo, back, hash, mulberry, vnoise } from '/core/lib.js';

const ST = await (await fetch('story.json')).json();
const T = await (await fetch('timeline.json')).json();
const L = Object.fromEntries(T.lines.map(l => [l.id, l]));
const SC = ST.scenes.map((s, i) => ({ ...s, id: s.id || `s${i}`, t0: L[s.id || `s${i}`].t0, t1: L[s.id || `s${i}`].t1 }));
SC.forEach((s, i) => { s.cut0 = i ? (SC[i - 1].t1 + s.t0) / 2 : 0; });
SC.forEach((s, i) => { s.cut1 = i + 1 < SC.length ? SC[i + 1].cut0 : SC[SC.length - 1].t1 + .4; });
const CHOICE0 = SC[SC.length - 1].t1 + .3;
const DUR = T.dur;
const W = innerWidth, H = innerHeight, S = 1.5;
const LANG = (ST.language || 'uz').toLowerCase();
const TXT = LANG.startsWith('en')
  ? { what: 'WHAT DO YOU DO?', comment: 'Write your answer in the comments!', sub: 'Follow for part 2', part: 'Part' }
  : { what: 'NIMA QILASAN?', comment: 'Javobingni kommentga yoz!', sub: 'Davomi uchun obuna bo\'l', part: 'qism' };

// ── renderer + post ───────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(S); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 80);
const post = makePost(renderer, scene, camera, W, H, { ssaa: S, ao: true, aoAmt: .55, aoRadius: .2 });
post.dof.aper = 40; post.dof.maxCoc = 16;
post.bloom.strength = .7; post.bloom.radius = .6; post.bloom.threshold = .9;
post.vig.uniforms.amt.value = .62; post.vig.uniforms.sat.value = .92; post.vig.uniforms.contrast.value = .12;

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .85, ...o });
const glow = (c, k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });
function mesh(geo, mat, parent, pos = [0, 0, 0], shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// ── light rig shared by every place ───────────────────────────────────────────
const hemi = new THREE.HemisphereLight("#6f78c8", "#1a1020", .8); scene.add(hemi);
const moon = new THREE.DirectionalLight('#9fb0ff', 1.1); moon.position.set(-2, 5, 3); moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 5, bottom: -1, near: .5, far: 20 });
scene.add(moon);
const lamp = new THREE.PointLight('#ffd9a0', 3.0, 7, 1.6); lamp.position.set(0, 2.6, -.5); lamp.castShadow = true; scene.add(lamp);
const torch = new THREE.SpotLight('#fff1d6', 3.5, 9, .38, .6, 1.4); torch.castShadow = true; scene.add(torch, torch.target);
const redL = new THREE.PointLight('#ff2a2a', 0, 6, 1.8); scene.add(redL);
const fill = new THREE.PointLight('#ffe2c8', 1.6, 5, 1.6); scene.add(fill);   // soft light from the camera side so faces read

// ── places: each a group, shown only during its scenes ───────────────────────
const places = {};
function place(name, build) { const g = new THREE.Group(); g.visible = false; scene.add(g); build(g); places[name] = g; }
const wallM = M('#3a3550'), floorM = M('#2a2433'), doorM = M('#5a3a2e'), metal = M('#8a8fa0', { roughness: .4, metalness: .5 });
const doors = {};   // place -> door pivot (opens on the "door" event)
place('corridor', g => {
  mesh(new THREE.PlaneGeometry(4, 30).rotateX(-Math.PI / 2), floorM, g, [0, 0, -10]);
  mesh(new THREE.PlaneGeometry(4, 30).rotateX(Math.PI / 2), M('#24202e'), g, [0, 3, -10]);
  for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(30, 3).rotateY(-s * Math.PI / 2), wallM, g, [s * 1.6, 1.5, -10]);
  for (let i = 0; i < 6; i++) {
    const z = -2 - i * 4;
    mesh(box(.9, .05, .5), glow('#ffe7b0', i === 2 ? 1.2 : 2.2), g, [0, 2.97, z], false);
    for (const s of [-1, 1]) mesh(box(.06, 2.1, .9), doorM, g, [s * 1.57, 1.05, z - 1.3]);
  }
  const d = new THREE.Group(); d.position.set(-.5, 0, -22); g.add(d);
  mesh(box(1, 2.2, .08), doorM, d, [.5, 1.1, 0]); mesh(box(.1, .1, .1), metal, d, [.85, 1.05, .06]);
  mesh(box(1.2, 2.4, .02), glow('#ffb36b', 1.6), g, [0, 1.1, -22.06], false);
  doors.corridor = d;
  mesh(box(.5, .22, .05), glow('#2bff6a', 2), g, [0, 2.6, -22.3], false);   // EXIT sign
});
place('elevator', g => {
  mesh(box(2.2, .05, 2.2), M('#3b3a44'), g, [0, 0, 0]);
  mesh(box(2.2, .05, 2.2), M('#2b2a33'), g, [0, 2.6, 0]);
  mesh(box(.05, 2.6, 2.2), metal, g, [-1.1, 1.3, 0]); mesh(box(.05, 2.6, 2.2), metal, g, [1.1, 1.3, 0]);
  mesh(box(2.2, 2.6, .05), metal, g, [0, 1.3, -1.1]);
  mesh(box(.6, .06, .6), glow('#fff3d0', 2.4), g, [0, 2.56, 0], false);
  const panel = mesh(box(.3, .7, .03), M('#1b1b22'), g, [.95, 1.3, -1.06]);
  for (let i = 0; i < 8; i++) mesh(new THREE.CylinderGeometry(.03, .03, .02, 10).rotateX(Math.PI / 2), i === 5 ? glow('#ff3030', 3) : glow('#ffd28a', 1.2), panel, [((i % 2) - .5) * .12, .25 - Math.floor(i / 2) * .14, .02], false);
  mesh(box(.5, .14, .03), glow('#ff3a2a', 2.4), g, [0, 2.35, -1.06], false);   // floor display
  const d = new THREE.Group(); d.position.set(0, 0, 1.1); g.add(d);   // doors behind the camera side
  doors.elevator = d;
});
place('house', g => {
  mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2), M('#3a2a22'), g, [0, 0, -1]);
  mesh(new THREE.PlaneGeometry(10, 4), M('#4a3a3a'), g, [0, 2, -4]);
  for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(10, 4).rotateY(-s * Math.PI / 2), M('#433335'), g, [s * 3, 2, -1]);
  mesh(box(1.4, 1.2, .05), glow('#2a3a8a', 1.3), g, [-1.2, 2.0, -3.97], false);   // night window
  for (const x of [-1.2]) { mesh(box(.06, 1.25, .06), M('#20181a'), g, [x, 2, -3.94]); mesh(box(1.45, .06, .06), M('#20181a'), g, [x, 2, -3.94]); }
  const d = new THREE.Group(); d.position.set(1.0, 0, -3.96); g.add(d);
  mesh(box(1, 2.2, .08), doorM, d, [.5, 1.1, 0]); mesh(box(.08, .08, .08), metal, d, [.88, 1.05, .06]);
  mesh(box(1.04, 2.24, .02), new THREE.MeshBasicMaterial({ color: '#000000' }), g, [1.5, 1.12, -4.0], false);
  doors.house = d;
  const fire = mesh(box(1.1, .9, .4), M('#2a2020'), g, [-2.2, .45, -3.7]); mesh(box(.6, .35, .1), glow('#ff6a1a', 2.2), fire, [0, -.1, .2], false);
  mesh(box(1.2, .5, .6), M('#5a2c2c'), g, [.2, .25, -2.4]);   // sofa
});
place('forest', g => {
  mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), M('#1d2a22'), g, [0, 0, -8]);
  const r = mulberry(5), bark = M('#2a2220'), leaf = M('#1e3a2a');
  for (let i = 0; i < 46; i++) {
    const x = (r() - .5) * 16, z = -2 - r() * 22; if (Math.abs(x) < 1.1 && z > -9) continue;
    const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
    mesh(new THREE.CylinderGeometry(.08, .14, 2.4, 5), bark, t, [0, 1.2, 0]);
    mesh(new THREE.ConeGeometry(.9 + r() * .4, 2.6, 6), leaf, t, [0, 2.9, 0]);
  }
  mesh(new THREE.SphereGeometry(1.2, 12, 8), glow('#e8ecff', 1.6), g, [-5, 12, -30], false);   // moon
  const d = new THREE.Group(); d.position.set(.3, 0, -12); g.add(d);   // a cabin door far away
  mesh(box(2.6, 2.4, 2), M('#3a2a20'), g, [.8, 1.2, -13.1]);
  mesh(box(1, 2, .06), doorM, d, [.5, 1.0, 0]); doors.forest = d;
  mesh(box(.5, .4, .05), glow('#ffb35a', 2), g, [1.6, 1.4, -12.08], false);
});
const FOG = { corridor: ['#120f18', 4, 22], elevator: ['#0e0c12', 4, 12], house: ['#150f10', 4, 14], forest: ['#0b1218', 4.5, 26] };

// ── the threat: eyes, shadow figure, hand ─────────────────────────────────────
const eyesG = new THREE.Group(); scene.add(eyesG);
for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(.045, 8, 6), glow('#ff2020', 5), eyesG, [s * .11, 0, 0], false);
const shadow = new THREE.Group(); scene.add(shadow);
const shM = new THREE.MeshBasicMaterial({ color: '#000000' });
mesh(box(.5, 1.7, .25), shM, shadow, [0, .95, 0], false); mesh(new THREE.SphereGeometry(.2, 8, 6), shM, shadow, [0, 2.0, 0], false);
for (const s of [-1, 1]) { const a = mesh(box(.1, 1.1, .1), shM, shadow, [s * .32, 1.15, 0], false); a.rotation.z = s * .1; }
mesh(new THREE.SphereGeometry(.035, 6, 4), glow('#ff2020', 6), shadow, [-.07, 2.03, .17], false);
mesh(new THREE.SphereGeometry(.035, 6, 4), glow('#ff2020', 6), shadow, [.07, 2.03, .17], false);
const handG = new THREE.Group(); scene.add(handG);
const handM = M('#cfd6c8');
mesh(box(.14, .5, .12), handM, handG, [0, -.25, 0]);
for (let i = 0; i < 4; i++) { const f = mesh(box(.03, .2, .03), handM, handG, [-.05 + i * .033, .08, 0]); f.rotation.z = (i - 1.5) * .12; }

// ── hero: low-poly kid, standing, scared ─────────────────────────────────────
const skin = M('#f2c4a0'), hairM = M(ST.hero?.hair || '#3a2418'), shirt = M(ST.hero?.shirt || '#2f3a5a'), pants = M('#23263a'), dark = M('#141018', { roughness: .35 });
const hero = new THREE.Group(); scene.add(hero);
const torso = new THREE.Group(); torso.position.y = .95; hero.add(torso);
mesh(box(.46, .56, .28), shirt, torso, [0, .3, 0]);
for (const s of [-1, 1]) { mesh(box(.16, .9, .16), pants, hero, [s * .11, .45, 0]); mesh(box(.17, .1, .26), M('#e8e8ee'), hero, [s * .11, .05, .04]); }
const headP = new THREE.Group(); headP.position.set(0, .62, 0); torso.add(headP);
mesh(new THREE.CylinderGeometry(.065, .07, .1, 6), skin, headP, [0, .02, 0]);
const head = new THREE.Group(); head.position.set(0, .26, 0); headP.add(head);
mesh(new THREE.IcosahedronGeometry(.24, 1), skin, head).scale.set(1, 1.1, .97);
mesh(new THREE.SphereGeometry(.252, 7, 4, 0, Math.PI * 2, 0, Math.PI * .45), hairM, head, [0, .04, -.02]).rotation.x = -.3;
const eyes = [], brows = [];
for (const s of [-1, 1]) {
  const e = new THREE.Group(); e.position.set(s * .088, .035, .222); head.add(e);
  mesh(new THREE.SphereGeometry(.032, 8, 6), new THREE.MeshBasicMaterial({ color: '#f4f4f4' }), e, [0, 0, -.004], false);
  mesh(new THREE.SphereGeometry(.018, 8, 6), dark, e, [0, 0, .022], false);
  eyes.push(e);
  const b = mesh(box(.075, .017, .02), hairM, head, [s * .088, .1, .228], false); b.userData.s = s; brows.push(b);
}
mesh(new THREE.ConeGeometry(.032, .075, 4), M('#e9a28c'), head, [0, -.02, .255], false).rotation.x = Math.PI / 2;
const mouth = mesh(box(.08, 1, .02), M('#3a0e10', { roughness: .5 }), head, [0, -.105, .222], false);
const arms = {};
for (const s of [-1, 1]) {
  const sh = new THREE.Group(); sh.position.set(s * .27, .52, 0); torso.add(sh);
  mesh(box(.12, .3, .12), shirt, sh, [0, -.15, 0]);
  const el = new THREE.Group(); el.position.set(0, -.29, 0); sh.add(el);
  mesh(box(.11, .27, .11), shirt, el, [0, -.13, 0]);
  mesh(box(.1, .1, .09), skin, el, [0, -.3, 0]);
  arms[s] = { sh, el };
}
const phone = mesh(box(.07, .13, .015), M('#111'), arms[1].el, [0, -.38, .06], false);
mesh(new THREE.SphereGeometry(.012, 6, 4), glow('#ffffff', 1.2), phone, [0, .05, -.01], false);

// ── timing ────────────────────────────────────────────────────────────────────
const sceneAt = t => SC.findLast(s => t >= s.cut0) || SC[0];
const scared = t => { const s = sceneAt(t); return ['eyes', 'shadow', 'hand', 'door'].includes(s.event) ? seg(t, s.t0 + .6, s.t0 + 1.0) : .25; };
function evK(s, t) { return seg(t, s.t0 + (s.event_at ?? .45) * (s.t1 - s.t0) - .2, s.t0 + (s.event_at ?? .45) * (s.t1 - s.t0) + .35); }

function animate(t) {
  const s = sceneAt(t), plc = places[s.place] ? s.place : 'corridor';
  for (const [k, g] of Object.entries(places)) g.visible = k === plc;
  const [fc, fn, ff] = FOG[plc]; scene.fog = new THREE.Fog(fc, fn, ff); scene.background = new THREE.Color(fc);
  const k = evK(s, t), ev = s.event || 'none';
  // hero placement per place (facing the threat, away from camera at 3/4)
  const HP = { corridor: [0, 0, -2.2], elevator: [-.15, 0, -.35], house: [-.4, 0, -1.2], forest: [0, 0, -3] }[plc];
  hero.position.set(...HP); hero.rotation.y = (SC.indexOf(s) % 2 ? -.45 : .45);
  const fear = clamp(scared(t) + k * .8, 0, 1);
  hero.position.y = Math.abs(Math.sin(t * 13)) * .008 * fear;
  torso.rotation.x = -.06 * fear; torso.rotation.z = Math.sin(t * 17) * .01 * fear;
  headP.rotation.y = Math.sin(t * .9) * .2 + (ev !== 'none' ? (SC.indexOf(s) % 2 ? .9 : -.9) * eio(k) * (1 - seg(t, s.t1 - .6, s.t1)) : 0);   // looks back at the threat
  headP.rotation.x = -.05 + Math.sin(t * 1.3) * .04;
  arms[1].sh.rotation.set(-1.1, 0, .1); arms[1].el.rotation.set(-.6, 0, 0);       // phone up
  arms[-1].sh.rotation.set(-.2 - fear * .9, 0, -.1 - fear * .2); arms[-1].el.rotation.set(-.4 - fear * 1.2, 0, 0);
  for (const e of eyes) e.scale.setScalar(1 + fear * .35);
  for (const b of brows) { b.position.y = .1 + fear * .03; b.rotation.z = -b.userData.s * fear * .25; }
  mouth.scale.set(1 - fear * .3, .012 + fear * .07, 1);
  // torch from the phone
  phone.getWorldPosition(torch.position); torch.target.position.set(HP[0], 1.5, HP[2] - 6);   // phone light reaches into the dark behind
  fill.position.copy(camera.position).add(new THREE.Vector3(.3, .2, 0)); fill.intensity = 1.6;
  // lights per place + flicker
  const fl = ev === 'flicker' || ev === 'shadow' ? (vnoise(t * 22) > .55 ? 1 : .15) * (k > 0 ? 1 : 0) + (k > 0 ? 0 : 1) : 1;
  lamp.position.set(HP[0], 2.6, HP[2] - .5); lamp.intensity = (plc === 'forest' ? .4 : 3) * fl;
  moon.intensity = plc === 'forest' ? 1.5 : .5;
  redL.intensity = 0;
  // threat
  const far = new THREE.Vector3(...{ corridor: [0, 1.5, -12], elevator: [0, 1.4, -1.05], house: [1.5, 1.5, -3.9], forest: [.4, 1.5, -9] }[plc]);
  eyesG.visible = ev === 'eyes' && k > 0; eyesG.position.copy(far); eyesG.scale.setScalar(.6 + k * .5);
  eyesG.children.forEach(c => c.scale.y = vnoise(t * 3) > .85 ? .1 : 1);
  shadow.visible = ev === 'shadow' && k > 0; shadow.position.set(far.x, 0, far.z + (plc === 'elevator' ? .3 : 1.5) * k); shadow.scale.setScalar(.9 + k * .15);
  if (shadow.visible) { redL.position.set(far.x, 2, far.z + 1); redL.intensity = 2 * k; }
  handG.visible = ev === 'hand' && k > 0;
  handG.position.set(HP[0] + .35, -.4 + k * .75, HP[2] + .25); handG.rotation.z = -.3 + Math.sin(t * 6) * .05;
  for (const [p, d] of Object.entries(doors)) d.rotation.y = p === plc && ev === 'door' ? -eio(k) * 1.2 : 0;
}

// ── camera: slow push-in per scene, shake on the scare ───────────────────────
function shoot(t) {
  const s = sceneAt(t), i = SC.indexOf(s), plc = places[s.place] ? s.place : 'corridor', k = evK(s, t);
  const u = eio(seg(t, s.cut0, s.cut1));
  const V = { corridor: [[.55, 1.75, 1.6], [.4, 1.7, .9], [0, 1.45, -6]], elevator: [[.35, 1.7, 2.6], [.25, 1.65, 2.05], [0, 1.35, -1]],
              house: [[1.0, 1.8, 1.9], [.75, 1.7, 1.2], [.2, 1.3, -3.5]], forest: [[.7, 1.7, .3], [.5, 1.65, -.6], [0, 1.4, -10]] }[plc];
  const alt = i % 2 ? -1 : 1;
  camera.position.set(lerp(V[0][0], V[1][0], u) * alt, lerp(V[0][1], V[1][1], u), lerp(V[0][2], V[1][2], u));
  const sh = s.event && s.event !== 'none' ? k * (1 - seg(t, s.t0 + .9 * (s.t1 - s.t0), s.t1)) : 0;
  camera.position.x += (vnoise(t * 25) - .5) * .05 * sh; camera.position.y += (vnoise(t * 31 + 9) - .5) * .05 * sh;
  camera.fov = 42 - sh * 6; camera.aspect = W / H; camera.updateProjectionMatrix();
  camera.lookAt(...V[2]);
  post.dof.focus = camera.position.distanceTo(hero.position.clone().add(new THREE.Vector3(0, 1.4, 0)));
  scene.updateMatrixWorld();
}

// ── UI: title, timer, word subtitles, choice card ────────────────────────────
const ui = document.getElementById('ui');
const el = (html, cls, parent = ui) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; parent.appendChild(d); return d; };
const title = el(`<div class="k">${ST.series || ''}${ST.part ? ` · ${ST.part}-${TXT.part}` : ''}</div><div class="t">${ST.title}</div>`, 'title');
const timer = el('', 'timer');
const sub = el('', 'sub');
const words = SC.map(s => {   // words timed by length inside their scene line
  const ws = s.text.split(/\s+/).filter(Boolean), wt = ws.map(w => 1 + w.length * .9 + (/[.!?…]$/.test(w) ? 3 : /[,;:—]$/.test(w) ? 1.5 : 0));
  const tot = wt.reduce((a, b) => a + b, 0), span = s.t1 - s.t0 - .1; let c = s.t0 + .05;
  const hl = new Set((s.highlight || []).map(h => h.toLowerCase()));
  return ws.map((w, j) => { const a = c; c += span * wt[j] / tot; return { w, a, b: c, hl: hl.has(w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '')) }; });
});
const choice = el(`<div class="q">${ST.choice?.q || TXT.what}</div>
  <div class="ab"><div class="o a"><b>A</b>${ST.choice?.a || ''}</div><div class="o b"><b>B</b>${ST.choice?.b || ''}</div></div>
  <div class="c">💬 ${TXT.comment}</div><div class="h">${TXT.sub}<br><span>${ST.handle || '@yourchannel'}</span></div>`, 'choice');
const pop = (t, t0) => `scale(${lerp(.82, 1, back(seg(t, t0, t0 + .32), 2.2))})`;
const [mm, ss2] = String(ST.timer || '05:00').split(':').map(Number);
const T0 = mm * 60 + ss2;
function overlay(t) {
  const tk = seg(t, .1, .4) * (1 - seg(t, 2.6, 3.0));
  title.style.opacity = tk; title.style.transform = pop(t, .1);
  const left = Math.max(0, T0 - t * (ST.timer_speed || 1.4));
  timer.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
  timer.classList.toggle('hot', left < 60);
  const s = sceneAt(t), i = SC.indexOf(s), ws = words[i];
  if (t < CHOICE0 && ws) {
    const cur = ws.findIndex(w => t >= w.a && t < w.b), j = cur < 0 ? (t < ws[0].a ? 0 : ws.length - 1) : cur;
    const a = Math.floor(j / 5) * 5, chunk = ws.slice(a, a + 5);
    sub.innerHTML = chunk.map((w, n) => `<span class="${w.hl ? 'hl' : ''} ${a + n === j && t >= w.a ? 'on' : ''}">${w.w}</span>`).join('');
    sub.style.display = t >= ws[0].a - .05 ? 'block' : 'none';
  } else sub.style.display = 'none';
  choice.style.display = t >= CHOICE0 ? 'block' : 'none';
  if (t >= CHOICE0) { choice.style.opacity = seg(t, CHOICE0, CHOICE0 + .2); choice.style.transform = pop(t, CHOICE0); }
}

window.EV = [
  { t: .1, type: 'whoosh' },
  ...SC.slice(1).map(s => ({ t: s.cut0, type: 'cut' })),
  ...SC.filter(s => s.event && s.event !== 'none').map(s => ({ t: s.t0 + (s.event_at ?? .45) * (s.t1 - s.t0) - .1, type: s.event === 'flicker' ? 'buzz' : 'sting' })),
  { t: CHOICE0, type: 'boom' },
];
window.DUR = DUR;
window.render = t => { animate(t); shoot(t); overlay(t); post.composer.render(); };
await document.fonts.ready;
window.render(0);
window.READY = true;
