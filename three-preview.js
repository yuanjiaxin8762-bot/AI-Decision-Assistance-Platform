import * as THREE from "https://esm.sh/three";

const container = document.getElementById("agent-preview-avatar");
if (!container) {
  // eslint-disable-next-line no-console
  console.warn("three-preview: container not found");
}

let renderer;
let scene;
let camera;
let animationId;

const character = {
  root: null,
  body: null,
  head: null,
  leftEye: null,
  rightEye: null,
  accessoryRing: null,
  accessoryHorn: null
};

function initScene() {
  if (!container) return;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.45, 4.2);

  const ambient = new THREE.AmbientLight(0x9aa8ff, 0.85);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 3, 4);
  const rim = new THREE.PointLight(0x33e1ff, 1.2, 20);
  rim.position.set(-2.4, -0.5, 2.4);
  scene.add(ambient, key, rim);

  const group = new THREE.Group();
  character.root = group;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x6f7cff,
    emissive: 0x1a224b,
    roughness: 0.35,
    metalness: 0.15
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x8da3ff,
    emissive: 0x22214b,
    roughness: 0.32,
    metalness: 0.2
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), bodyMat);
  body.scale.set(1.0, 0.92, 1.0);
  character.body = body;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.64, 28, 28), headMat);
  head.position.set(0, 0.95, 0);
  character.head = head;
  group.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xe6ecff,
    emissive: 0x6f7cff,
    emissiveIntensity: 0.45
  });
  const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.18, 1.0, 0.52);
  rightEye.position.set(0.18, 1.0, 0.52);
  character.leftEye = leftEye;
  character.rightEye = rightEye;
  group.add(leftEye, rightEye);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.06, 16, 80),
    new THREE.MeshStandardMaterial({
      color: 0x7a3cff,
      emissive: 0x32135f,
      roughness: 0.3,
      metalness: 0.6
    })
  );
  ring.rotation.x = Math.PI / 2.6;
  character.accessoryRing = ring;
  group.add(ring);

  const horn = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.55, 22),
    new THREE.MeshStandardMaterial({
      color: 0xff7b9a,
      emissive: 0x4b1321,
      roughness: 0.25,
      metalness: 0.55
    })
  );
  horn.position.set(0, 1.52, 0);
  horn.visible = false;
  character.accessoryHorn = horn;
  group.add(horn);

  group.rotation.y = Math.PI / 7;
  scene.add(group);
}

function resizeRenderer() {
  if (!renderer || !camera || !container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function applyOffsets(offsets = {}) {
  if (!character.root || !character.body || !character.head) return;
  const rationality = Number(offsets.rationality || 0);
  const risk = Number(offsets.risk || 0);
  const emotion = Number(offsets.emotion || 0);

  const bodyColor = new THREE.Color(0x6f7cff);
  const cool = new THREE.Color(0x7a3cff);
  const warm = new THREE.Color(0xff5f8a);
  const aqua = new THREE.Color(0x33e1ff);

  if (rationality > 15) bodyColor.lerp(cool, 0.5);
  if (risk > 15) bodyColor.lerp(warm, 0.65);
  if (emotion > 15) bodyColor.lerp(aqua, 0.6);

  character.body.material.color.copy(bodyColor);
  character.head.material.color.copy(bodyColor.clone().lerp(new THREE.Color(0xe3ecff), 0.24));

  const bob = 1 + emotion / 220;
  character.head.scale.set(1, bob, 1);

  const eyeScaleY = risk > 15 ? 0.62 : 1;
  character.leftEye.scale.set(1, eyeScaleY, 1);
  character.rightEye.scale.set(1, eyeScaleY, 1);

  character.accessoryRing.visible = risk <= 20;
  character.accessoryHorn.visible = risk > 20;
  if (character.accessoryRing.visible) {
    character.accessoryRing.material.color.set(rationality > 15 ? 0x7a3cff : 0x6f7cff);
    character.accessoryRing.scale.setScalar(1 + Math.max(emotion, 0) / 90);
  }
}

function animate() {
  if (!renderer || !scene || !camera || !character.root) return;
  const t = performance.now() * 0.001;
  character.root.rotation.y = Math.PI / 7 + Math.sin(t * 0.8) * 0.25;
  character.root.rotation.x = Math.sin(t * 0.55) * 0.08;
  character.root.position.y = Math.sin(t * 1.2) * 0.08;
  if (character.accessoryRing) {
    character.accessoryRing.rotation.z += 0.012;
  }
  if (character.accessoryHorn?.visible) {
    character.accessoryHorn.rotation.y += 0.02;
  }
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

function init() {
  if (!container) return;
  initScene();
  const fallback = container.querySelector(".preview-fallback");
  if (fallback) fallback.remove();
  resizeRenderer();

  const cached = window.__latestPreviewOffsets || { rationality: 0, risk: 0, emotion: 0 };
  applyOffsets(cached);
  animate();

  window.addEventListener("resize", resizeRenderer);
  window.addEventListener("agentPreviewUpdate", evt => applyOffsets(evt.detail || {}));
}

init();

window.addEventListener("beforeunload", () => {
  if (animationId) cancelAnimationFrame(animationId);
  renderer?.dispose();
});
