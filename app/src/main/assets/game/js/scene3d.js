// رحلة المدربة — العالم ثلاثي الأبعاد (Three.js)
// رندر واحد يتنقل بين الشاشات: الشاشة الرئيسية، المتجر، والمعركة.
// إذا فشل التحميل (جهاز ضعيف أو بدون WebGL) ترجع اللعبة للرسومات العادية تلقائياً.
import * as THREE from 'three';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';

const MODELS = {
  shahd:   { file: 'shahd.glb',   height: 1.75, human: true },
  mazen:   { file: 'mazen.glb',   height: 1.75, human: true },
  salma:   { file: 'salma.glb',   height: 1.7,  human: true },
  sharara: { file: 'sharara.glb', height: 0.85, fox: true, idle: 'Survey', attack: 'Run' },
  waraqa:  { file: 'waraqa.glb',  tex: 'waraqa.png',  height: 1.0 },
  fuqaa:   { file: 'fuqaa.glb',   tex: 'fuqaa.png',   height: 1.0 },
  hasawa:  { file: 'hasawa.glb',  tex: 'hasawa.png',  height: 1.1 }
};
const SKIN = 0xe8b48c;
const TYPE_COLOR = { electric: 0xfde047, water: 0x38bdf8, grass: 0x4ade80, fire: 0xfb923c, rock: 0xb08850, normal: 0xffffff };

const loader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();
const cache = {};

function loadModel(id) {
  if (!cache[id]) {
    const m = MODELS[id];
    cache[id] = Promise.all([
      loader.loadAsync('models/' + m.file),
      m.tex ? texLoader.loadAsync('models/' + m.tex) : Promise.resolve(null)
    ]).then(([gltf, tex]) => {
      if (tex) { tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; }
      return { gltf, tex };
    });
  }
  return cache[id];
}

// نسخة جديدة من الموديل مع هيكل عظمي مستقل
function cloneSkinned(src) {
  const clone = src.clone(true);
  const srcBones = {}, cloneBones = {};
  src.traverse(o => { if (o.isBone) srcBones[o.name] = o; });
  clone.traverse(o => { if (o.isBone) cloneBones[o.name] = o; });
  const srcMeshes = [], cloneMeshes = [];
  src.traverse(o => { if (o.isSkinnedMesh) srcMeshes.push(o); });
  clone.traverse(o => { if (o.isSkinnedMesh) cloneMeshes.push(o); });
  cloneMeshes.forEach((cm, i) => {
    const sm = srcMeshes[i];
    const bones = sm.skeleton.bones.map(b => cloneBones[b.name]);
    cm.bind(new THREE.Skeleton(bones, sm.skeleton.boneInverses), sm.bindMatrix);
  });
  return clone;
}

// ===== إعادة تلوين جلد الثعلب حسب شكل شرارة =====
const foxTexCache = {};
function foxTexture(baseTex, look) {
  const key = (look && look.body) || '#facc15';
  if (foxTexCache[key]) return foxTexCache[key];
  const img = baseTex.image;
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  const t = new THREE.Color(key);
  const tip = new THREE.Color((look && look.tip) || '#38bdf8');
  const tr = t.r * 255, tg = t.g * 255, tb = t.b * 255;
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
    const sat = mx ? (mx - mn) / mx : 0;
    const lum = (r * 0.3 + gg * 0.59 + b * 0.11) / 255;
    if (sat > 0.35 && r > b) {            // الفرو البرتقالي
      const k = 0.55 + lum * 0.9;
      d.data[i] = Math.min(255, tr * k); d.data[i + 1] = Math.min(255, tg * k); d.data[i + 2] = Math.min(255, tb * k);
    } else if (lum < 0.25) {              // الأطراف الغامقة
      d.data[i] = tip.r * 200; d.data[i + 1] = tip.g * 200; d.data[i + 2] = tip.b * 200;
    }
  }
  g.putImageData(d, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
  foxTexCache[key] = tex;
  return tex;
}

// يبني شخصية جاهزة: موديل + حركات + ألوان
async function makeActor(id, look) {
  const def = MODELS[id];
  const { gltf, tex } = await loadModel(id);
  const obj = cloneSkinned(gltf.scene);
  obj.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const cloned = mats.map(m => {
      const mm = m.clone();
      mm.roughness = 0.75; mm.metalness = 0;
      if (tex) { mm.map = tex; mm.color.set(0xffffff); }
      if (def.fox) { mm.map = foxTexture(m.map || mm.map, look); mm.color.set(0xffffff); }
      if (def.human) applyHumanColors(mm, id, look);
      mm.needsUpdate = true;
      return mm;
    });
    o.material = Array.isArray(o.material) ? cloned : cloned[0];
  });
  // توحيد الحجم وجعل القدمين على الأرض
  const wrap = new THREE.Group();
  wrap.add(obj);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3();
  obj.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const size = box.getSize(new THREE.Vector3());
  const s = def.height / (size.y || 1);
  obj.scale.multiplyScalar(s);
  obj.updateMatrixWorld(true);
  const box2 = new THREE.Box3();
  obj.traverse(o => { if (o.isMesh) box2.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); });
  const c = box2.getCenter(new THREE.Vector3());
  obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box2.min.y;

  const mixer = new THREE.AnimationMixer(obj);
  const clips = {};
  gltf.animations.forEach(a => { clips[a.name.split('|').pop()] = a; });
  const actor = { id, def, root: wrap, model: obj, mixer, clips, current: null, tweens: [] };
  play(actor, def.idle || 'Idle', true);
  return actor;
}

function applyHumanColors(m, id, look) {
  const n = m.name;
  if (n === 'Skin') m.color.setHex(id === 'mazen' ? 0xd9a06f : SKIN);
  if (n === 'Face') { m.color.setHex(0x2a1a12); m.roughness = 0.35; }
  if (id === 'shahd') {
    const L = Object.assign({ jacket: '#14b8a6', pants: '#1e3a8a', straps: '#7c3aed', hair: '#6b3a1f' }, look || {});
    if (n === 'Shirt') m.color.set(L.jacket);
    if (n === 'Pants') m.color.set(L.pants);
    if (n === 'Belt') m.color.set(L.straps);
    if (n === 'Hair') m.color.set(L.hair);
  }
  if (id === 'mazen') {
    if (n === 'Shirt') m.color.set('#2563eb');
    if (n === 'Pants') m.color.set('#374151');
    if (n === 'Hair') m.color.set('#1f2937');
  }
  if (id === 'salma') {
    if (n === 'Main') m.color.set('#f8fafc');
    if (n === 'Black') m.color.set('#7c3aed');
    if (n === 'Hair') m.color.set('#cbd5e1');
  }
}

function play(actor, name, loop, fade = 0.2) {
  const clip = actor.clips[name];
  if (!clip) return null;
  const action = actor.mixer.clipAction(clip);
  action.reset();
  action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
  action.clampWhenFinished = !loop;
  if (actor.current && actor.current !== action) actor.current.crossFadeTo(action, fade, false);
  action.play();
  actor.current = action;
  return action;
}

function playOnce(actor, name, backTo) {
  const a = play(actor, name, false, 0.12);
  if (!a) return Promise.resolve();
  return new Promise(res => {
    const dur = a.getClip().duration * 1000;
    setTimeout(() => { if (backTo) play(actor, backTo, true); res(); }, Math.min(dur, 1400));
  });
}

// ===== حركات بسيطة بالوقت =====
const tweens = [];
function tween(ms, fn) {
  return new Promise(res => tweens.push({ t0: performance.now(), ms, fn, res }));
}
const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ===== المشهد =====
let renderer, camera, scene, clock, host = null, mode = null, running = false;
const world = { ground: null, deco: null, lights: null };

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'gl';
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  clock = new THREE.Clock();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x6b8f5e, 1.6);
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
  sun.position.set(6, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
  sun.shadow.bias = -0.0005;
  scene.add(hemi, sun);
  world.lights = { hemi, sun };
  buildWorld('village');
  window.addEventListener('resize', resize);
}

const PALETTES = {
  village: { sky: 0x8fd3ff, fog: 0xcfeeff, ground: 0x7ccf63, pad: 0xa8e08f, tree: 0x2f9e44, trunk: 0x8b5a2b },
  forest:  { sky: 0x5fb39a, fog: 0x9ed9c0, ground: 0x3f9d4c, pad: 0x6cc070, tree: 0x166534, trunk: 0x5b3a1e },
  path:    { sky: 0xffc38a, fog: 0xffe2c2, ground: 0x9fcf55, pad: 0xe8c27a, tree: 0x3f8f3a, trunk: 0x7a4a24 },
  night:   { sky: 0x2a2466, fog: 0x4c3a8a, ground: 0x2e6b3f, pad: 0x4a8f5c, tree: 0x14532d, trunk: 0x3b2614 },
  lab:     { sky: 0xdbe4ff, fog: 0xeef2ff, ground: 0xcbd5e1, pad: 0xe2e8f0, tree: 0x7c3aed, trunk: 0x64748b }
};

function buildWorld(name) {
  const p = PALETTES[name] || PALETTES.village;
  scene.background = new THREE.Color(p.sky);
  scene.fog = new THREE.Fog(p.fog, 12, 40);
  if (world.deco) scene.remove(world.deco);
  const deco = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: p.ground, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  deco.add(ground);
  // أشجار وصخور حول الساحة
  const rnd = mulberry(name.length * 99);
  const treeMat = new THREE.MeshStandardMaterial({ color: p.tree, roughness: 0.9, flatShading: true });
  const trunkMat = new THREE.MeshStandardMaterial({ color: p.trunk, roughness: 1 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 1, flatShading: true });
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = 7 + rnd() * 12;
    const x = Math.cos(a) * r, z = Math.sin(a) * r - 6;
    if (z > -3) continue;
    const t = new THREE.Group();
    const h = 1.2 + rnd() * 1.6;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, h * 0.5, 6), trunkMat);
    trunk.position.y = h * 0.25; t.add(trunk);
    const crown = new THREE.Mesh(rnd() > 0.5 ? new THREE.ConeGeometry(0.8 + rnd() * 0.4, h, 7) : new THREE.IcosahedronGeometry(0.75 + rnd() * 0.4, 0), treeMat);
    crown.position.y = h * 0.5 + 0.55; t.add(crown);
    t.position.set(x, 0, z);
    t.traverse(o => { if (o.isMesh) o.castShadow = true; });
    deco.add(t);
  }
  for (let i = 0; i < 10; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + rnd() * 0.35, 0), rockMat);
    const a = rnd() * Math.PI * 2, r = 4 + rnd() * 6;
    rock.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r - 4);
    if (rock.position.z > 0) continue;
    rock.castShadow = true; deco.add(rock);
  }
  if (name === 'night') {
    world.lights.hemi.intensity = 0.8; world.lights.sun.intensity = 1.2; world.lights.sun.color.set(0xb4c6ff);
  } else {
    world.lights.hemi.intensity = 1.6; world.lights.sun.intensity = 2.4; world.lights.sun.color.set(0xfff4e0);
  }
  world.deco = deco;
  world.palette = p;
  scene.add(deco);
}

function clearWorld() {
  if (world.deco) { scene.remove(world.deco); world.deco = null; }
  scene.background = null; scene.fog = null;
  world.lights.hemi.intensity = 1.7; world.lights.sun.intensity = 2.4; world.lights.sun.color.set(0xfff4e0);
}

function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function pad(x, z, r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, 0.12, 40),
    new THREE.MeshStandardMaterial({ color: world.palette.pad, roughness: 0.95 }));
  m.position.set(x, 0.06, z); m.receiveShadow = true;
  return m;
}

function resize() {
  if (!host || !renderer) return;
  const w = host.clientWidth || 1, h = host.clientHeight || 1;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
  camera.aspect = w / h; camera.updateProjectionMatrix();
}

function attach(el) {
  host = el;
  if (renderer.domElement.parentNode !== el) el.prepend(renderer.domElement);
  resize();
  if (!running) { running = true; clock.getDelta(); loop(); }
}

function detach() {
  running = false;
  host = null;
}

const actors = new Set();
function loop() {
  if (!running) return;
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = performance.now();
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const k = Math.min(1, (now - tw.t0) / tw.ms);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.res(); }
  }
  actors.forEach(a => a.mixer.update(dt));
  if (mode && mode.update) mode.update(dt, now);
  renderer.render(scene, camera);
}

function clearStage() {
  if (mode && mode.group) scene.remove(mode.group);
  actors.clear();
  particles.length = 0;
  mode = null;
}

// ===== جسيمات المؤثرات =====
const particles = [];
function burst(pos, color, count = 26, spread = 1.2) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
  const geo = new THREE.IcosahedronGeometry(0.06, 0);
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(pos);
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * spread * 3, Math.random() * spread * 3, (Math.random() - 0.5) * spread * 3);
    g.add(m);
  }
  mode.group.add(g);
  return tween(650, k => {
    g.children.forEach(m => { m.position.addScaledVector(m.userData.v, 0.016); m.userData.v.y -= 0.12; m.scale.setScalar(1 - k * 0.8); });
    mat.opacity = 1 - k;
    if (k >= 1) mode && mode.group.remove(g);
  });
}

function lightning(from, to) {
  const pts = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const p = from.clone().lerp(to, i / n);
    if (i > 0 && i < n) p.add(new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6));
    pts.push(p);
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0xfffbe6, transparent: true });
  const line = new THREE.Line(geo, mat);
  const glow = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.6 }));
  glow.scale.setScalar(1.002);
  mode.group.add(line, glow);
  const flash = new THREE.PointLight(0xfde047, 6, 8);
  flash.position.copy(to); mode.group.add(flash);
  return tween(380, k => {
    mat.opacity = 1 - k; glow.material.opacity = 0.6 * (1 - k); flash.intensity = 6 * (1 - k);
    if (k >= 1) { mode && mode.group.remove(line, glow, flash); }
  });
}

function projectile(from, to, color, size = 0.16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 10), new THREE.MeshBasicMaterial({ color }));
  const light = new THREE.PointLight(color, 3, 4);
  m.add(light);
  mode.group.add(m);
  return tween(380, k => {
    m.position.copy(from).lerp(to, ease(k));
    m.position.y += Math.sin(k * Math.PI) * 0.6;
    if (k >= 1) mode && mode.group.remove(m);
  });
}

function flashRed(actor) {
  const mats = [];
  actor.model.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.push(m)); });
  return tween(450, k => {
    const v = Math.sin(k * Math.PI * 3) > 0 ? 0.6 : 0;
    mats.forEach(m => { m.emissive && m.emissive.setRGB(v, v * 0.1, v * 0.1); });
    if (k >= 1) mats.forEach(m => m.emissive && m.emissive.setRGB(0, 0, 0));
  });
}

// ===== شاشة المعركة =====
const POS = [new THREE.Vector3(-1.0, 0.12, 1.6), new THREE.Vector3(1.1, 0.12, -2.2)];

const CAM = { x: -1.6, y: 2.3, z: 5.4, lx: 0.4, ly: 0.55, lz: -0.9 };
window.__CAM = CAM;

const Battle = {
  async start(el, bg) {
    clearStage();
    buildWorld(bg || 'forest');
    const group = new THREE.Group();
    group.add(pad(POS[0].x, POS[0].z, 1.1), pad(POS[1].x, POS[1].z, 1.1));
    scene.add(group);
    mode = { group, mons: [null, null], t: 0,
      update(dt, now) {
        // حركة كاميرا خفيفة حتى يبين المشهد حي
        const s = Math.sin(now / 2600) * 0.12;
        camera.position.set(CAM.x + s, CAM.y, CAM.z);
        camera.lookAt(CAM.lx, CAM.ly, CAM.lz);
      } };
    camera.fov = 42; camera.updateProjectionMatrix();
    attach(el);
  },

  async setMon(side, species, look, enter) {
    if (!mode || !mode.mons) return;
    const old = mode.mons[side];
    if (old) { mode.group.remove(old.root); actors.delete(old); }
    const a = await makeActor(species, look);
    const pos = POS[side], other = POS[1 - side];
    a.root.position.copy(pos);
    a.root.rotation.y = Math.atan2(other.x - pos.x, other.z - pos.z);
    if (side === 1) a.root.scale.setScalar(1.15);
    mode.group.add(a.root);
    actors.add(a);
    mode.mons[side] = a;
    if (enter) {
      const s0 = a.root.scale.x;
      burst(pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xffffff, 18, 0.8);
      await tween(450, k => { const b = k < 1 ? Math.sin(k * Math.PI * 0.5) * (1 + 0.15 * Math.sin(k * Math.PI)) : 1; a.root.scale.setScalar(s0 * Math.max(0.01, b)); });
    }
  },

  async attack(side, mtype) {
    const a = mode && mode.mons[side], t = mode && mode.mons[1 - side];
    if (!a || !t) return;
    const from = a.root.position.clone(), to = t.root.position.clone();
    const dir = to.clone().sub(from).normalize();
    const color = TYPE_COLOR[mtype] || 0xffffff;
    const anim = a.def.attack || 'Bite_Front';
    play(a, anim, !!a.def.fox);
    // اندفاع نحو الخصم
    await tween(220, k => a.root.position.copy(from).addScaledVector(dir, ease(k) * 0.9));
    const head = from.clone().add(new THREE.Vector3(0, a.def.height * 0.6, 0));
    const target = to.clone().add(new THREE.Vector3(0, t.def.height * 0.55, 0));
    if (mtype === 'electric') await lightning(head, target);
    else if (mtype === 'water' || mtype === 'grass' || mtype === 'rock' || mtype === 'fire') await projectile(head, target, color);
    burst(target, color);
    tween(260, k => a.root.position.copy(from).addScaledVector(dir, (1 - ease(k)) * 0.9)).then(() => play(a, a.def.idle || 'Idle', true));
  },

  async hit(side) {
    const a = mode && mode.mons[side];
    if (!a) return;
    if (a.clips.HitRecieve) playOnce(a, 'HitRecieve', a.def.idle || 'Idle');
    const p = a.root.position.clone();
    flashRed(a);
    await tween(420, k => { a.root.position.x = p.x + Math.sin(k * Math.PI * 6) * 0.08 * (1 - k); });
  },

  async faint(side) {
    const a = mode && mode.mons[side];
    if (!a) return;
    if (a.clips.Death) { await playOnce(a, 'Death'); }
    const p = a.root.position.clone(), r = a.root.rotation.z;
    await tween(600, k => {
      a.root.position.y = p.y - k * 0.6;
      if (!a.clips.Death) a.root.rotation.z = r + k * 1.4;
      a.root.traverse(o => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { m.transparent = true; m.opacity = 1 - k; }); } });
    });
  },

  async heal(side) {
    const a = mode && mode.mons[side];
    if (!a) return;
    burst(a.root.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0x86efac, 30, 0.6);
    if (a.clips.Yes) playOnce(a, 'Yes', a.def.idle || 'Idle');
  },

  async cheer(side) {
    const a = mode && mode.mons[side];
    if (!a) return;
    if (a.clips.Dance) play(a, 'Dance', true);
    else if (a.clips.Run) play(a, 'Run', true);
  },

  stop() { if (mode && mode.mons) { clearStage(); } detach(); }
};

// ===== عرض الشخصيات (الشاشة الرئيسية والمتجر) =====
const Showcase = {
  async show(el, opts) {
    clearStage();
    clearWorld();
    const group = new THREE.Group();
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), new THREE.ShadowMaterial({ opacity: 0.28 }));
    shadow.rotation.x = -Math.PI / 2; shadow.receiveShadow = true; group.add(shadow);
    scene.add(group);
    mode = { group, update: null };
    attach(el);
    const sh = await makeActor('shahd', opts.outfit);
    const fx = await makeActor('sharara', opts.skin);
    if (!mode || mode.group !== group) return; // تغيرت الشاشة أثناء التحميل
    sh.root.position.set(0.35, 0, 0);
    sh.root.rotation.y = -0.25;
    fx.root.position.set(-0.75, 0, 0.45);
    fx.root.rotation.y = 0.6;
    group.add(sh.root, fx.root);
    actors.add(sh); actors.add(fx);
    mode.sh = sh; mode.fx = fx;
    const camY = opts.camY != null ? opts.camY : 1.05;
    const dist = opts.dist || 3.6;
    mode.update = (dt, now) => {
      const a = Math.sin(now / 4000) * 0.25;
      camera.position.set(Math.sin(a) * dist, camY + 0.25, Math.cos(a) * dist);
      camera.lookAt(0, camY - 0.1, 0);
    };
    if (sh.clips.Victory && opts.cheer) playOnce(sh, 'Victory', 'Idle');
  },

  async restyle(outfit, skin) {
    if (!mode || !mode.sh) return;
    const g = mode.group;
    const sh = await makeActor('shahd', outfit);
    const fx = await makeActor('sharara', skin);
    if (!mode || mode.group !== g) return;
    sh.root.position.copy(mode.sh.root.position); sh.root.rotation.copy(mode.sh.root.rotation);
    fx.root.position.copy(mode.fx.root.position); fx.root.rotation.copy(mode.fx.root.rotation);
    g.remove(mode.sh.root, mode.fx.root); actors.delete(mode.sh); actors.delete(mode.fx);
    g.add(sh.root, fx.root); actors.add(sh); actors.add(fx);
    mode.sh = sh; mode.fx = fx;
    if (sh.clips.Victory) playOnce(sh, 'Victory', 'Idle');
    burst(new THREE.Vector3(0, 1, 0), 0xfde047, 30, 0.7);
  },

  stop() { clearStage(); detach(); }
};

// ===== التشغيل =====
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

const ready = (async () => {
  if (!webglOK()) throw new Error('NO_WEBGL');
  initRenderer();
  // تحميل مسبق لأهم الموديلات
  await Promise.all(['shahd', 'sharara', 'waraqa'].map(loadModel));
  return true;
})();

window.Scene3D = { ready, Battle, Showcase };
window.dispatchEvent(new Event('scene3d'));
