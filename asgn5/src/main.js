import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// ─── Renderer ───────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ─── Scene & Camera ─────────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 25);

// ─── Controls ───────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 80;
controls.maxPolarAngle = Math.PI / 2 + 0.1;

// ─── Texture Loader ─────────────────────────────────────────────────────────
const texLoader = new THREE.TextureLoader();

// ─── Skybox ──────────────────────────────────────────────────────────────────
// Procedural skybox using a gradient shader (no external assets needed)
const skyGeo = new THREE.SphereGeometry(400, 32, 32);
const skyMat = new THREE.ShaderMaterial({
  uniforms: {
    topColor:    { value: new THREE.Color(0x0a1628) },
    bottomColor: { value: new THREE.Color(0x1a3a5c) },
    offset:      { value: 20 },
    exponent:    { value: 0.4 },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `,
  side: THREE.BackSide,
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

// ─── Lights (5 different types) ───────────────────────────────────────────────
// 1. Ambient
const ambientLight = new THREE.AmbientLight(0x334466, 0.8);
scene.add(ambientLight);

// 2. Directional (sun)
const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
dirLight.position.set(20, 40, 15);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 200;
dirLight.shadow.camera.left = -60;
dirLight.shadow.camera.right = 60;
dirLight.shadow.camera.top = 60;
dirLight.shadow.camera.bottom = -60;
scene.add(dirLight);

// 3. Hemisphere
const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5a2a, 0.6);
scene.add(hemiLight);

// 4. Point light (glowing lantern effect)
const pointLight = new THREE.PointLight(0xff6633, 3, 20);
pointLight.position.set(0, 5, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// Visual marker for point light
const plSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.25, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xff6633 })
);
plSphere.position.copy(pointLight.position);
scene.add(plSphere);

// 5. Spot light
const spotLight = new THREE.SpotLight(0x9966ff, 4, 40, Math.PI / 8, 0.3, 1);
spotLight.position.set(-10, 15, 5);
spotLight.castShadow = true;
scene.add(spotLight);

// 6. RectAreaLight
RectAreaLightUniformsLib.init();
const rectLight = new THREE.RectAreaLight(0x00ccff, 3, 6, 3);
rectLight.position.set(12, 4, -8);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
scene.add(new RectAreaLightHelper(rectLight));

// ─── Ground Plane ─────────────────────────────────────────────────────────────
const groundTex = texLoader.load(
  'https://threejs.org/examples/textures/hardwood2_diffuse.jpg',
  (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 8); }
);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ─── Helper: place object ─────────────────────────────────────────────────────
function place(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// ─── Materials ─────────────────────────────────────────────────────────────────
const matRed    = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });
const matBlue   = new THREE.MeshStandardMaterial({ color: 0x2244cc, roughness: 0.4, metalness: 0.3 });
const matGreen  = new THREE.MeshStandardMaterial({ color: 0x22aa44, roughness: 0.7 });
const matGold   = new THREE.MeshStandardMaterial({ color: 0xddaa22, roughness: 0.2, metalness: 0.8 });
const matWhite  = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
const matPurple = new THREE.MeshStandardMaterial({ color: 0x9933cc, roughness: 0.3, metalness: 0.5 });
const matOrange = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.6 });
const matTeal   = new THREE.MeshStandardMaterial({ color: 0x11bbaa, roughness: 0.4, metalness: 0.2 });

// Texture on a box
const crateTex = texLoader.load('https://threejs.org/examples/textures/crate.gif');
const matCrate  = new THREE.MeshStandardMaterial({ map: crateTex });

// ─── 20+ Primary Shapes ────────────────────────────────────────────────────────

// --- Cubes (6) ---
const cubes = [];
const cubePositions = [
  [-6, 0.5, -6], [6, 0.5, -6], [-6, 0.5, 6], [6, 0.5, 6],
  [0, 0.5, -10], [0, 1.5, -10],
];
const cubeMats = [matRed, matBlue, matGold, matPurple, matCrate, matOrange];
cubePositions.forEach(([x, y, z], i) => {
  const size = 0.8 + Math.random() * 0.6;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), cubeMats[i]);
  cubes.push(place(mesh, x, y, z));
});

// --- Stacked crates tower (textured, animated) ---
const tower = [];
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), matCrate);
  tower.push(place(m, -12, 0.6 + i * 1.2, -12));
}

// --- Spheres (4) ---
place(new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), matGold), -3, 0.7, 3);
place(new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), matRed), 10, 1.2, -5);
place(new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), matPurple), 5, 0.5, 8);
place(new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 32), matTeal), -8, 0.9, 2);

// --- Cylinders (4) ---
place(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3, 32), matBlue), 8, 1.5, 5);
place(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 2, 32), matOrange), -5, 1, -3);
place(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.5, 32), matGold), 0, 0.25, 5);
place(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 16), matGreen), -15, 2, 5);

// --- Cones (3) ---
place(new THREE.Mesh(new THREE.ConeGeometry(1, 3, 32), matGreen), 4, 1.5, -8);
place(new THREE.Mesh(new THREE.ConeGeometry(0.6, 2, 8), matRed), -4, 1, -8);
place(new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.5, 32), matPurple), 14, 1.25, 3);

// ─── Tall pillars for visual interest ──────────────────────────────────────────
[[-20, 0, -20], [20, 0, -20], [-20, 0, 20], [20, 0, 20]].forEach(([x, y, z]) => {
  place(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 12), matWhite), x, 5, z);
  place(new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), matGold), x, 10.9, z);
});

// ─── GLTF Model (Flower.glb) ────────────────────────────────────────────────
const gltfLoader = new GLTFLoader();
let flowerModel = null;
gltfLoader.load(
  './Flower.glb',
  (gltf) => {
    flowerModel = gltf.scene;
    flowerModel.scale.set(3, 3, 3);
    flowerModel.position.set(0, 0, 0);
    flowerModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(flowerModel);
    console.log('Flower.glb loaded successfully!');
  },
  (xhr) => console.log('Flower loading:', (xhr.loaded / xhr.total * 100).toFixed(1) + '%'),
  (err) => {
    console.warn('Could not load Flower.glb — make sure it is in the project root.', err);
    // Fallback: a procedural flower placeholder
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, side: THREE.DoubleSide });
    const stemMat  = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 2, 12), stemMat);
    place(stem, 0, 1, 0);
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), centerMat);
    place(center, 0, 2.2, 0);
    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), petalMat);
      const angle = (i / 6) * Math.PI * 2;
      place(petal, Math.cos(angle) * 0.55, 2.2, Math.sin(angle) * 0.55);
    }
  }
);

// ─── Particles / Stars ───────────────────────────────────────────────────────
const starGeo = new THREE.BufferGeometry();
const starCount = 1200;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 600;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true })
);
scene.add(stars);

// ─── WOW POINT: Orbiting moon + mini solar system ────────────────────────────
// A small "solar system" orbits above the scene
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffdd44 })
);
sunMesh.position.set(0, 20, 0);
scene.add(sunMesh);

const sunGlow = new THREE.PointLight(0xffdd44, 2, 25);
sunMesh.add(sunGlow);

const planets = [];
const planetData = [
  { r: 0.35, dist: 3,   speed: 1.5,  color: 0x2288ff, tilt: 0 },
  { r: 0.55, dist: 5,   speed: 0.9,  color: 0xff8833, tilt: 0.3 },
  { r: 0.25, dist: 7,   speed: 0.5,  color: 0x22dd88, tilt: 0.5 },
];
planetData.forEach(({ r, dist, speed, color, tilt }) => {
  const pivot = new THREE.Object3D();
  pivot.rotation.z = tilt;
  sunMesh.add(pivot);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 16, 16),
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.position.set(dist, 0, 0);
  pivot.add(mesh);
  planets.push({ pivot, speed });
});

// Orbit ring visual for solar system
const orbitRingGeo = new THREE.RingGeometry(4.95, 5.05, 64);
const orbitRingMat = new THREE.MeshBasicMaterial({ color: 0x334455, side: THREE.DoubleSide });
const orbitRingMesh = new THREE.Mesh(orbitRingGeo, orbitRingMat);
orbitRingMesh.rotation.x = Math.PI / 2;
sunMesh.add(orbitRingMesh);


// ─── Resize handler ──────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animate ────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();

  // Rotate cubes
  cubes.forEach((c, i) => {
    c.rotation.x = t * (0.3 + i * 0.07);
    c.rotation.y = t * (0.2 + i * 0.05);
  });

  // Bounce tower crates
  tower.forEach((b, i) => {
    b.position.y = 0.6 + i * 1.2 + Math.sin(t * 2 + i) * 0.1;
  });


  // Float ring removed

  // Flower model slow rotation
  if (flowerModel) {
    flowerModel.rotation.y = t * 0.4;
  }

  // Animate point light orbit
  pointLight.position.x = Math.sin(t * 0.7) * 8;
  pointLight.position.z = Math.cos(t * 0.7) * 8;
  plSphere.position.copy(pointLight.position);

  // Solar system planets
  planets.forEach(({ pivot, speed }) => {
    pivot.rotation.y = t * speed;
  });
  sunMesh.rotation.y = t * 0.2;


  controls.update();
  renderer.render(scene, camera);
});
