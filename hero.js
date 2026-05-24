// Hero: NETWORK MESH 3D simbolico — nodi connessi, edges pulsanti.
// Simboleggia: mesh P2P (HALCYON), collab CRDT (K-Perception), edge SaaS (K-Quest),
// modular DSP routing (KLab). Visivamente: "connessioni che lavorano".

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

let renderer, scene, camera, group, nodesMesh, linesMesh, raf;
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const N_NODES = IS_TOUCH ? 28 : 56;
const RADIUS = 1.7;
const LINK_DIST = 1.45; // soglia distanza per disegnare edge

const nodeVert = /* glsl */ `
  uniform float uTime;
  attribute float aSeed;
  varying float vSeed;
  varying float vGlow;
  void main(){
    vec3 pos = position;
    // micro float per dare vita
    pos.x += sin(uTime * 0.4 + aSeed * 6.28) * 0.025;
    pos.y += cos(uTime * 0.3 + aSeed * 6.28) * 0.025;
    pos.z += sin(uTime * 0.5 + aSeed * 3.14) * 0.025;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = length(mv.xyz);
    gl_PointSize = (52.0 / dist) * (1.0 + 0.4 * sin(uTime * 1.6 + aSeed * 9.0));
    vSeed = aSeed;
    vGlow = smoothstep(8.0, 2.0, dist);
  }
`;
const nodeFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying float vSeed;
  varying float vGlow;
  void main(){
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = pow(1.0 - d * 2.0, 1.8);
    float halo = pow(1.0 - d * 2.0, 0.6) * 0.22;
    // colore: purple di base con cyan occasionale (1 nodo su 6)
    bool accent = fract(vSeed * 7.0) > 0.83;
    vec3 col = accent ? vec3(0.40, 0.85, 1.0) : vec3(0.78, 0.42, 1.0);
    vec3 final = col * (core + halo);
    gl_FragColor = vec4(final, (core + halo) * vGlow);
  }
`;

const lineVert = /* glsl */ `
  uniform float uTime;
  attribute float aPair;
  varying float vAlpha;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // pulse animato per edge (data-flow visivo)
    float pulse = 0.5 + 0.5 * sin(uTime * 1.2 + aPair * 6.28);
    vAlpha = 0.10 + pulse * 0.35;
  }
`;
const lineFrag = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  void main(){
    gl_FragColor = vec4(0.65, 0.40, 1.0, vAlpha);
  }
`;

export function initHero(canvasEl) {
  if (!canvasEl) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  const sz = canvasEl.getBoundingClientRect();
  renderer.setSize(sz.width, sz.height, false);
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, sz.width / sz.height, 0.1, 100);
  camera.position.set(0, 0, 5);

  group = new THREE.Group();
  scene.add(group);

  // === NODI: posizionati su superficie sferica (fibonacci sphere per uniformità) ===
  const positions = new Float32Array(N_NODES * 3);
  const seeds = new Float32Array(N_NODES);
  const nodes = []; // copia js per calcolo edges
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N_NODES; i++) {
    const y = 1 - (i / (N_NODES - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const px = x * RADIUS, py = y * RADIUS, pz = z * RADIUS;
    positions[i * 3] = px; positions[i * 3 + 1] = py; positions[i * 3 + 2] = pz;
    seeds[i] = Math.random();
    nodes.push([px, py, pz]);
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  nodeGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const nodeMat = new THREE.ShaderMaterial({
    vertexShader: nodeVert, fragmentShader: nodeFrag,
    uniforms: { uTime: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  nodesMesh = new THREE.Points(nodeGeo, nodeMat);
  group.add(nodesMesh);

  // === EDGES: linee fra coppie di nodi vicini ===
  const linePositions = [];
  const linePairs = [];
  for (let i = 0; i < N_NODES; i++) {
    for (let j = i + 1; j < N_NODES; j++) {
      const dx = nodes[i][0] - nodes[j][0];
      const dy = nodes[i][1] - nodes[j][1];
      const dz = nodes[i][2] - nodes[j][2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < LINK_DIST) {
        linePositions.push(...nodes[i], ...nodes[j]);
        const pair = Math.random();
        linePairs.push(pair, pair);
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  lineGeo.setAttribute('aPair', new THREE.BufferAttribute(new Float32Array(linePairs), 1));
  const lineMat = new THREE.ShaderMaterial({
    vertexShader: lineVert, fragmentShader: lineFrag,
    uniforms: { uTime: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  linesMesh = new THREE.LineSegments(lineGeo, lineMat);
  group.add(linesMesh);

  // === Mouse parallax ===
  let mx = 0, my = 0;
  canvasEl.parentElement?.addEventListener('mousemove', (e) => {
    const r = canvasEl.parentElement.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    my = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });

  const clock = new THREE.Clock();
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    nodeMat.uniforms.uTime.value = t;
    lineMat.uniforms.uTime.value = t;
    // rotazione organica + parallax
    group.rotation.y = t * 0.16 + mx * 0.5;
    group.rotation.x = Math.sin(t * 0.08) * 0.15 + (-my * 0.35);
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => {
    const s = canvasEl.getBoundingClientRect();
    if (s.width === 0) return;
    renderer.setSize(s.width, s.height, false);
    camera.aspect = s.width / s.height;
    camera.updateProjectionMatrix();
  });
  if (canvasEl.parentElement) ro.observe(canvasEl.parentElement);
}

export function destroyHero() {
  if (raf) cancelAnimationFrame(raf);
  if (renderer) renderer.dispose();
}

const canvas = document.getElementById('hero-canvas');
if (canvas) initHero(canvas);
