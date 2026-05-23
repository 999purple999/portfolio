// Hero scene: 40k particle Points in volume sferico, GLSL vertex+fragment shader,
// purple/cyan gradient. Mobile auto-reduce a 14k. Movimento ampio + parallax
// mouse molto aggressivo. Bloom-like via additive blending + double point pass.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const COUNT = IS_TOUCH ? 14000 : 40000;
const RADIUS = 70;

let renderer, scene, camera, points, glow, raf;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aSize;
  attribute float aSeed;
  varying float vHue;
  varying float vAlpha;

  // movimento più ampio per dare un effetto "esplosivo"
  void main() {
    vec3 pos = position;
    float t = uTime * 0.35 + aSeed * 6.283;
    pos.x += sin(t) * 3.5;
    pos.y += cos(t * 1.13) * 3.5;
    pos.z += sin(t * 0.71) * 3.5;

    // pulsazione globale (respiro)
    float breath = 1.0 + sin(uTime * 0.6) * 0.08;
    pos *= breath;

    // rotazione globale Y più visibile
    float ang = uTime * 0.15;
    float cs = cos(ang), sn = sin(ang);
    pos = vec3(pos.x * cs + pos.z * sn, pos.y, -pos.x * sn + pos.z * cs);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = length(mv.xyz);
    gl_PointSize = uSize * aSize * uPixelRatio * (220.0 / dist);

    vHue = aSeed;
    vAlpha = smoothstep(180.0, 25.0, dist);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying float vHue;
  varying float vAlpha;

  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    // core + glow falloff
    float core = pow(1.0 - d * 2.0, 2.5);
    // hue cycling lento purple <-> cyan
    float hue = mix(0.78, 0.55, fract(vHue + uTime * 0.025));
    vec3 col = hsl2rgb(vec3(hue, 0.9, 0.65));
    gl_FragColor = vec4(col, core * vAlpha * 0.95);
  }
`;

// shader per il "glow pass" (particelle più grandi, alpha bassa, sotto)
const glowFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying float vHue;
  varying float vAlpha;
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float falloff = pow(1.0 - d * 2.0, 1.2);
    float hue = mix(0.78, 0.55, fract(vHue + uTime * 0.025));
    vec3 col = hsl2rgb(vec3(hue, 0.85, 0.6));
    gl_FragColor = vec4(col, falloff * vAlpha * 0.18);
  }
`;

export function initHero(canvasEl) {
  if (!canvasEl) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x05060d, 1);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 600);
  camera.position.set(0, 0, 95);

  const positions = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const u = Math.random(),
      v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = Math.cbrt(Math.random()) * RADIUS;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.5 + Math.random() * 1.6;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const sharedUniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: dpr },
    uSize: { value: IS_TOUCH ? 9 : 13 },
  };

  // Glow pass (più grande, sotto)
  const glowMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: glowFragmentShader,
    uniforms: {
      ...sharedUniforms,
      uSize: { value: IS_TOUCH ? 24 : 38 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  glow = new THREE.Points(geo, glowMat);
  scene.add(glow);

  // Core pass (più nitido, sopra)
  const coreMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { ...sharedUniforms, uSize: { value: IS_TOUCH ? 9 : 13 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  points = new THREE.Points(geo, coreMat);
  scene.add(points);

  // Parallax mouse MOLTO aggressivo (richiesto utente "si muovano di più")
  let mx = 0,
    my = 0;
  let velX = 0,
    velY = 0;
  window.addEventListener(
    'mousemove',
    (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      velX = nx - mx;
      velY = ny - my;
      mx = nx;
      my = ny;
    },
    { passive: true },
  );

  // Touch parallax
  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches[0]) {
        mx = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        my = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
      }
    },
    { passive: true },
  );

  const clock = new THREE.Clock();
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    sharedUniforms.uTime.value = t;
    coreMat.uniforms.uTime.value = t;
    glowMat.uniforms.uTime.value = t;

    // Parallax molto evidente (richiesta utente): moltiplicatore 22 e
    // rotazione scene basata sul mouse oltre alla traslazione camera.
    const tx = mx * 22;
    const ty = -my * 22;
    camera.position.x += (tx - camera.position.x) * 0.06;
    camera.position.y += (ty - camera.position.y) * 0.06;
    camera.lookAt(0, 0, 0);

    // ulteriore rotazione scene su mouse drag (effetto orbit)
    if (points) {
      points.rotation.y += (mx * 0.4 - points.rotation.y) * 0.04;
      points.rotation.x += (-my * 0.3 - points.rotation.x) * 0.04;
    }
    if (glow) {
      glow.rotation.y = points.rotation.y;
      glow.rotation.x = points.rotation.x;
    }

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

const canvas = document.getElementById('hero-canvas');
if (canvas) initHero(canvas);
