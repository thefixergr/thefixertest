/* ══ ιστοσελίδες. — hero: το Meshy μοντέλο του σήματος σε three.js, clay κοράλι ══
   Φορτώνει ΜΕΤΑ το κείμενο (idle), 77K τρίγωνα / 248KB meshopt, three 0.170 από jsDelivr.
   Σέβεται το κουμπί «Κίνηση» (event tf:motion) και σταματά όταν το hero βγει από την οθόνη. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('gl');
const hero = document.getElementById('hero');
if (!canvas || !hero) throw new Error('no hero canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
const isMobile = innerWidth < 760;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);                     // διάφανο: το φόντο/βινιέτα το δίνει η σελίδα

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

scene.add(new THREE.HemisphereLight(0xfff1ea, 0x1a0c08, 0.5));
const key = new THREE.DirectionalLight(0xfff0e6, 2.2); key.position.set(3, 4, 4); scene.add(key);
const fill = new THREE.DirectionalLight(0x9db8ff, 0.6); fill.position.set(-4, -1, 3); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffd0c4, 1.2); rim.position.set(-2, 3, -4); scene.add(rim);

const clay = new THREE.MeshStandardMaterial({ color: 0xff5a3a, roughness: 0.72, metalness: 0.0 });
let group = null;
const isTouch = matchMedia('(hover:none)').matches;

/* ── σωματίδια-κοράλι: αιωρούνται πίσω από το σήμα, κινούνται ΠΑΝΤΑ (και στο κινητό) ── */
const P_COUNT = isMobile ? 140 : 240;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(P_COUNT * 3), pSeed = new Float32Array(P_COUNT);
for (let i = 0; i < P_COUNT; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 14;
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 9;
  pPos[i * 3 + 2] = -2 - Math.random() * 5;
  pSeed[i] = Math.random() * Math.PI * 2;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ color: 0xff6a4d, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
const points = new THREE.Points(pGeo, pMat);
scene.add(points);

function layout() {
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  // desktop: δεξιά, στο ύψος του τίτλου · portrait: πάνω δεξιά, μικρότερο (όπου ήταν και το raymarch)
  const portrait = w / h < 0.85;
  camera.position.set(0, 0, portrait ? 9.4 : 6.9);
  if (group) {
    group.position.set(portrait ? 0.7 : 2.25, portrait ? 1.75 : 0.15, 0);
    group.scale.setScalar(portrait ? 0.68 : 1);
  }
}
new ResizeObserver(layout).observe(hero);

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
loader.load('/assets/3d/mark.glb?v=202609041831', (gltf) => {
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), c = new THREE.Vector3();
  box.getSize(size); box.getCenter(c); model.position.sub(c);
  model.scale.setScalar(2.35 / Math.max(size.x, size.y, size.z));
  model.traverse(o => { if (o.isMesh) { o.material = clay; o.geometry.computeVertexNormals(); } });
  group = new THREE.Group(); group.add(model); scene.add(group);
  layout();
  canvas.classList.add('ready');
  initMini(model);
}, undefined, (e) => console.warn('hero glb', e));

/* ── δεύτερο, μικρό σήμα στο section «Γιατί με AI»: συνεχής αργή περιστροφή ── */
let mini = null;
function initMini(model) {
  const c2 = document.getElementById('glMini');
  if (!c2) return;
  const r2 = new THREE.WebGLRenderer({ canvas: c2, antialias: true, alpha: true });
  r2.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  r2.toneMapping = THREE.ACESFilmicToneMapping; r2.toneMappingExposure = 1.05;
  r2.outputColorSpace = THREE.SRGBColorSpace;
  r2.setClearColor(0x000000, 0);
  const s2 = new THREE.Scene();
  s2.environment = scene.environment;
  s2.add(new THREE.HemisphereLight(0xfff1ea, 0x1a0c08, 0.5));
  const k2 = new THREE.DirectionalLight(0xfff0e6, 2.0); k2.position.set(3, 4, 4); s2.add(k2);
  const rm2 = new THREE.DirectionalLight(0xffd0c4, 1.1); rm2.position.set(-2, 3, -4); s2.add(rm2);
  const cam2 = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam2.position.set(0, 0, 6.4);
  const g2 = new THREE.Group(); g2.add(model.clone()); s2.add(g2);
  const sz = () => { const w = c2.clientWidth || 180, h = c2.clientHeight || 180; r2.setSize(w, h, false); cam2.aspect = w / h; cam2.updateProjectionMatrix(); };
  new ResizeObserver(sz).observe(c2); sz();
  let vis2 = false;
  new IntersectionObserver(en => { vis2 = en[0].isIntersecting; }, { threshold: 0 }).observe(c2);
  mini = { render(t) {
    if (!vis2) return;
    g2.rotation.y = t * 0.5;
    g2.rotation.x = Math.sin(t * 0.4) * 0.18 + 0.12;
    r2.render(s2, cam2);
  }, still() { r2.render(s2, cam2); } };
  c2.classList.add('ready');
}

let mx = 0, my = 0, tmx = 0, tmy = 0, visible = true, running = !document.documentElement.classList.contains('no-motion');
addEventListener('pointermove', e => { tmx = (e.clientX / innerWidth - 0.5) * 2; tmy = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
addEventListener('tf:motion', e => { running = !!e.detail; if (!running) { renderer.render(scene, camera); if (mini) mini.still(); } });

const t0 = performance.now();
renderer.setAnimationLoop(() => {
  if (!running) return;
  const t = (performance.now() - t0) / 1000;
  if (mini) mini.render(t);
  if (!visible) return;
  mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;
  const sc = Math.min(1, (scrollY || 0) / Math.max(1, innerHeight));
  if (group) {
    /* Στο κινητό δεν υπάρχει ποντίκι — το σήμα ταλαντώνεται πιο πλατιά και πιο
       γρήγορα, και δένεται πιο έντονα με το scroll, ώστε να μη δείχνει ποτέ παγωμένο.
       (Όχι πλήρης περιστροφή: edge-on το σήμα χάνει το σχήμα του.) */
    const swing = isTouch ? Math.sin(t * 0.31) * 0.55 : 0;
    const scK = isTouch ? 1.1 : 0.45;
    group.rotation.y = swing + Math.sin(t * 0.19) * 0.36 + mx * 0.40;
    group.rotation.x = Math.sin(t * 0.17) * 0.16 + my * 0.25 + sc * scK;
    group.position.y += (Math.sin(t * 0.5) * 0.05 + sc * 1.2 - group.position.y + (hero.clientWidth / hero.clientHeight < 0.85 ? 1.75 : 0.25)) * 0.08;
  }
  const pp = pGeo.attributes.position.array;
  for (let i = 0; i < P_COUNT; i++) {
    pp[i * 3 + 1] += Math.sin(t * 0.6 + pSeed[i]) * 0.0016;
    pp[i * 3] += Math.cos(t * 0.4 + pSeed[i]) * 0.0011;
  }
  pGeo.attributes.position.needsUpdate = true;
  points.rotation.y = Math.sin(t * 0.05) * 0.1;
  renderer.render(scene, camera);
});
