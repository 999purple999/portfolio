// Hero scene: ORB 3D centrale, mesh isosfera con displacement shader noise.
// Niente più 40k particle additive che saturavano a blob bianco.
// Stile: oggetto unico, contenuto, espressivo. Apple-product-page energy.

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

let renderer, scene, camera, orb, ring1, ring2, raf;
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

const vert = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPos;

  // 3D simplex noise (Ashima)
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    vec3 pos = position;
    float n = snoise(pos * 1.6 + vec3(uTime * 0.25));
    float n2 = snoise(pos * 3.2 + vec3(uTime * 0.15));
    pos += normal * (n * 0.18 + n2 * 0.06);
    vNormal = normalize(normalMatrix * normal);
    vPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPos;

  void main(){
    // Fresnel rim: luce sul bordo, scuro al centro -> effetto "core energetico"
    float fres = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.6);
    // Gradient interno: purple deep -> cyan rim
    vec3 inner = vec3(0.20, 0.05, 0.45);  // purple deep
    vec3 rim   = vec3(0.66, 0.40, 1.0);   // light purple
    vec3 accent= vec3(0.40, 0.85, 1.0);   // cyan accent sul bordo
    vec3 col = mix(inner, rim, fres);
    col = mix(col, accent, fres * fres * 0.7);
    // brillantino animato
    float spark = 0.5 + 0.5 * sin(uTime * 1.4 + vPos.y * 6.0);
    col += vec3(0.05, 0.02, 0.10) * spark;
    gl_FragColor = vec4(col, 0.92);
  }
`;

export function initHero(canvasEl) {
  if (!canvasEl) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl, alpha: true, antialias: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(dpr);

  // Canvas relativo al wrapper hero, NON fullscreen
  const sz = canvasEl.getBoundingClientRect();
  renderer.setSize(sz.width, sz.height, false);
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, sz.width / sz.height, 0.1, 100);
  camera.position.set(0, 0, 5);

  const geo = new THREE.IcosahedronGeometry(1.2, IS_TOUCH ? 5 : 7);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
  });
  orb = new THREE.Mesh(geo, mat);
  scene.add(orb);

  // Anelli orbita (wireframe)
  const ringGeo = new THREE.TorusGeometry(1.8, 0.005, 8, 128);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35 });
  ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2.3;
  scene.add(ring1);
  ring2 = new THREE.Mesh(ringGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.22 }));
  ring2.rotation.x = Math.PI / 1.6;
  ring2.rotation.y = Math.PI / 3;
  ring2.scale.setScalar(1.25);
  scene.add(ring2);

  // Mouse parallax leggero
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
    mat.uniforms.uTime.value = t;
    if (orb) {
      orb.rotation.y = t * 0.18 + mx * 0.6;
      orb.rotation.x = -my * 0.4;
    }
    if (ring1) ring1.rotation.z = t * 0.25;
    if (ring2) ring2.rotation.z = -t * 0.18;
    renderer.render(scene, camera);
  }
  animate();

  // Resize via ResizeObserver (legato al wrapper)
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
