// Hero scene: 25k particle Points in spherical volume, GLSL vertex+fragment shader,
// purple/cyan gradient. Mobile: auto-reduce a 8k. Pattern THREE.Points (NON
// InstancedMesh): gl_PointSize valido solo per Points, non per Mesh.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const COUNT = IS_TOUCH ? 8000 : 25000;
const RADIUS = 60;

let renderer, scene, camera, points, raf;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aSize;
  attribute float aSeed;
  varying float vHue;
  varying float vAlpha;

  // gentle noise rotation per particella, mantiene il volume sferico
  void main() {
    vec3 pos = position;
    float t = uTime * 0.15 + aSeed * 6.283;
    pos.x += sin(t) * 1.6;
    pos.y += cos(t * 1.13) * 1.6;
    pos.z += sin(t * 0.71) * 1.6;

    // rotazione globale lenta su Y
    float ang = uTime * 0.06;
    float cs = cos(ang), sn = sin(ang);
    pos = vec3(pos.x * cs + pos.z * sn, pos.y, -pos.x * sn + pos.z * cs);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // size con depth attenuation
    float dist = length(mv.xyz);
    gl_PointSize = uSize * aSize * uPixelRatio * (180.0 / dist);

    // varying per il fragment
    vHue = aSeed;
    vAlpha = smoothstep(140.0, 30.0, dist); // più vicino = più visibile
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying float vHue;
  varying float vAlpha;

  // HSL -> RGB minimal
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    // particella circolare con falloff radiale
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = pow(1.0 - d * 2.0, 1.8);

    // hue: purple 0.78 → cyan 0.55 modulato da seed e tempo
    float hue = mix(0.78, 0.55, fract(vHue + uTime * 0.02));
    vec3 col = hsl2rgb(vec3(hue, 0.85, 0.65));

    gl_FragColor = vec4(col, alpha * vAlpha * 0.85);
  }
`;

export function initHero(canvasEl) {
  if (!canvasEl) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x05060d, 1);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 0, 85);

  // BufferGeometry con position + size + seed
  const positions = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    // distribuzione uniforme nel volume sferico
    const u = Math.random(), v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = Math.cbrt(Math.random()) * RADIUS;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.4 + Math.random() * 1.3;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: dpr },
      uSize: { value: IS_TOUCH ? 6 : 9 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  points = new THREE.Points(geo, material);
  scene.add(points);

  // mouse parallax leggero
  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const clock = new THREE.Clock();
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;

    // camera parallax
    const tx = mx * 8;
    const ty = -my * 8;
    camera.position.x += (tx - camera.position.x) * 0.04;
    camera.position.y += (ty - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', onResize);
}

export function destroyHero() {
  if (raf) cancelAnimationFrame(raf);
  if (renderer) renderer.dispose();
}

// auto-init quando il modulo viene importato dalla pagina
const canvas = document.getElementById('hero-canvas');
if (canvas) initHero(canvas);
