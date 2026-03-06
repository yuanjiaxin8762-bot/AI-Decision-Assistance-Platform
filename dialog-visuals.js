import * as THREE from "https://esm.sh/three";

function mountParticleBackground() {
  const host = document.getElementById("app-particles");
  if (!host) return;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 1, 1000);
  camera.position.z = 120;

  const count = 520;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 220;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 130;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 180;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x6f7cff,
    size: 1.2,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });
  const points = new THREE.Points(geom, mat);
  scene.add(points);

  const palette = {
    calm: new THREE.Color(0x6f7cff),
    anxious: new THREE.Color(0xff6f7c),
    excited: new THREE.Color(0xa05cff)
  };

  const animate = () => {
    points.rotation.y += 0.0008;
    points.rotation.x += 0.00025;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();

  window.addEventListener("dialogEmotionShift", evt => {
    const mood = evt.detail?.mood || "calm";
    const target = palette[mood] || palette.calm;
    mat.color.lerp(target, 0.4);
  });

  window.addEventListener("resize", () => {
    if (!host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
  });
}

function mountDialogStage() {
  const host = document.getElementById("dialog-3d-stage");
  if (!host) return;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 100);
  camera.position.set(0, 2.4, 9);

  const ambient = new THREE.AmbientLight(0x9db0ff, 0.8);
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(1.8, 2.6, 3.4);
  scene.add(ambient, key);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.1, 48),
    new THREE.MeshBasicMaterial({ color: 0x10182c, transparent: true, opacity: 0.5 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.2;
  scene.add(floor);

  const agentNodes = [];
  const defaultProfiles = [
    { name: "理性+", color: "#546dff", accent: "#5ab8ff", accessory: "visor", avatar: "./assets/agents/rational.png" },
    { name: "冒险+", color: "#ff6b7f", accent: "#ff8a63", accessory: "horn", avatar: "./assets/agents/adventure.png" },
    { name: "情绪+", color: "#8c74ff", accent: "#9f7bff", accessory: "wave", avatar: "./assets/agents/empath.png" },
    { name: "直觉", color: "#67a8ff", accent: "#7dd7ff", accessory: "antenna", avatar: "./assets/agents/intuitive.png" },
    { name: "谨慎", color: "#5840d8", accent: "#63d4a8", accessory: "shield", avatar: "./assets/agents/guardian.png" }
  ];
  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();

  const getAvatarTexture = avatarUrl => {
    if (!avatarUrl) return null;
    if (textureCache.has(avatarUrl)) return textureCache.get(avatarUrl);
    const tex = textureLoader.load(avatarUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(avatarUrl, tex);
    return tex;
  };

  const makeAccessory = profile => {
    const accentColor = new THREE.Color(profile.accent || "#8aa4ff");
    if (profile.accessory === "horn") {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.42, 16),
        new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor.clone().multiplyScalar(0.25), metalness: 0.5 })
      );
      cone.position.set(0.12, 0.58, 0.08);
      return cone;
    }
    if (profile.accessory === "visor") {
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.12, 0.1),
        new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor.clone().multiplyScalar(0.2), metalness: 0.55 })
      );
      visor.position.set(0, 0.1, 0.38);
      return visor;
    }
    if (profile.accessory === "wave") {
      const wave = new THREE.Mesh(
        new THREE.TorusGeometry(0.44, 0.04, 12, 64),
        new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor.clone().multiplyScalar(0.2), metalness: 0.55 })
      );
      wave.rotation.x = Math.PI / 2.2;
      wave.position.set(0, -0.28, 0);
      return wave;
    }
    if (profile.accessory === "antenna") {
      const antenna = new THREE.Group();
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8),
        new THREE.MeshStandardMaterial({ color: accentColor })
      );
      stem.position.y = 0.58;
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 14, 14),
        new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor.clone().multiplyScalar(0.35) })
      );
      tip.position.y = 0.74;
      antenna.add(stem, tip);
      return antenna;
    }
    if (profile.accessory === "shield") {
      const shield = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.06, 14, 48),
        new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor.clone().multiplyScalar(0.2), metalness: 0.6 })
      );
      shield.rotation.x = Math.PI / 2.2;
      shield.position.set(0, -0.1, 0.08);
      return shield;
    }
    const spark = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor.clone().multiplyScalar(0.25) })
    );
    spark.position.set(0.25, 0.48, 0.08);
    return spark;
  };

  const createAgentNode = (profile, index, total) => {
    const g = new THREE.Group();
    const color = new THREE.Color(profile.color || "#6f7cff");
    const avatarTex = getAvatarTexture(profile.avatar);
    if (avatarTex) {
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.46, 0.64, 48),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(profile.accent || "#8aa4ff"),
          transparent: true,
          opacity: 0.42,
          side: THREE.DoubleSide
        })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -0.32;
      g.add(halo);

      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: avatarTex,
          transparent: true,
          depthWrite: false
        })
      );
      sprite.scale.set(1.55, 1.55, 1);
      sprite.position.y = 0.1;
      g.add(sprite);
    } else {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 26, 26),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color.clone().multiplyScalar(0.2),
          roughness: 0.32,
          metalness: 0.2
        })
      );
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 20, 20),
        new THREE.MeshStandardMaterial({
          color: color.clone().lerp(new THREE.Color("#e2efff"), 0.35),
          roughness: 0.35
        })
      );
      cheek.scale.set(1, 0.8, 0.9);
      cheek.position.set(0, -0.3, 0.18);
      g.add(shell, cheek, makeAccessory(profile));
    }

    const angle = (Math.PI * 2 * index) / total;
    g.position.set(Math.cos(angle) * 2.9, -0.15, Math.sin(angle) * 1.2);
    scene.add(g);
    return { node: g, angleBase: angle, profile };
  };

  const rebuildAgents = (profiles = defaultProfiles) => {
    while (agentNodes.length) {
      const item = agentNodes.pop();
      scene.remove(item.node);
    }
    const safe = profiles.length ? profiles : defaultProfiles;
    safe.forEach((profile, idx) => {
      agentNodes.push(createAgentNode(profile, idx, safe.length));
    });
  };
  rebuildAgents(defaultProfiles);

  let focusIndex = 0;
  const animate = () => {
    const t = performance.now() * 0.001;
    agentNodes.forEach((entry, idx) => {
      const targetX = idx === focusIndex ? 0 : Math.cos(entry.angleBase) * 2.9;
      const targetZ = idx === focusIndex ? 2.2 : Math.sin(entry.angleBase) * 1.2;
      const targetY = idx === focusIndex ? 0.25 : -0.15 + Math.sin(t * 1.3 + idx) * 0.06;
      entry.node.position.x += (targetX - entry.node.position.x) * 0.055;
      entry.node.position.z += (targetZ - entry.node.position.z) * 0.055;
      entry.node.position.y += (targetY - entry.node.position.y) * 0.055;
      entry.node.rotation.y += idx === focusIndex ? 0.022 : 0.008;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();

  window.addEventListener("dialogSpeakerFocus", evt => {
    const id = Number(evt.detail?.index || 0);
    focusIndex = Number.isNaN(id) ? 0 : Math.max(0, Math.min(agentNodes.length - 1, id));
  });

  window.addEventListener("dialogAgentsUpdate", evt => {
    const profiles = evt.detail?.agents;
    if (!Array.isArray(profiles)) return;
    rebuildAgents(profiles);
    focusIndex = Math.max(0, Math.min(focusIndex, agentNodes.length - 1));
  });

  window.addEventListener("resize", () => {
    if (!host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
  });
}

mountParticleBackground();
mountDialogStage();
