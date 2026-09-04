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
loader.load('/assets/3d/mark.glb?v=202609041651', (gltf) => {
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), c = new THREE.Vector3();
  box.getSize(size); box.getCenter(c); model.position.sub(c);
  model.scale.setScalar(2.35 / Math.max(size.x, size.y, size.z));
  model.traverse(o => { if (o.isMesh) { o.material = clay; o.geometry.computeVertexNormals(); } });
  group = new THREE.Group(); group.add(model); scene.add(group);
  layout();
  canvas.classList.add('ready');
}, undefined, (e) => console.warn('hero glb', e));

let mx = 0, my = 0, tmx = 0, tmy = 0, visible = true, running = !document.documentElement.classList.contains('no-motion');
addEventListener('pointermove', e => { tmx = (e.clientX / innerWidth - 0.5) * 2; tmy = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
addEventListener('tf:motion', e => { running = !!e.detail; if (!running) renderer.render(scene, camera); });

const t0 = performance.now();
renderer.setAnimationLoop(() => {
  if (!visible || !running) return;
  const t = (performance.now() - t0) / 1000;
  mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;
  const sc = Math.min(1, (scrollY || 0) / Math.max(1, innerHeight));
  if (group) {
    group.rotation.y = Math.sin(t * 0.19) * 0.36 + mx * 0.40;
    group.rotation.x = Math.sin(t * 0.17) * 0.16 + my * 0.25 + sc * 0.45;
    group.position.y += (Math.sin(t * 0.5) * 0.05 + sc * 1.2 - group.position.y + (hero.clientWidth / hero.clientHeight < 0.85 ? 1.75 : 0.25)) * 0.08;
  }
  renderer.render(scene, camera);
});
