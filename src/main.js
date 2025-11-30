import * as THREE from 'three';
import gsap from 'gsap';

// --- Audio Setup (Procedural Beat) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isPlaying = false;
let nextNoteTime = 0;
let beatCount = 0;

function playKick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.5);
}

function playSnare(time) {
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBuffer.length; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1000;
  const noiseEnvelope = audioCtx.createGain();
  noiseEnvelope.gain.setValueAtTime(1, time);
  noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseEnvelope);
  noiseEnvelope.connect(audioCtx.destination);
  noise.start(time);
}

function scheduler() {
  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    if (beatCount % 4 === 0) playKick(nextNoteTime);
    if (beatCount % 4 === 2) playSnare(nextNoteTime);
    nextNoteTime += 0.5; // 120 BPM approx
    beatCount++;
  }
  if (isPlaying) requestAnimationFrame(scheduler);
}

const playBtn = document.getElementById('play-btn');
const vinylDisk = document.querySelector('.vinyl-disk');

playBtn.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  isPlaying = !isPlaying;
  if (isPlaying) {
    nextNoteTime = audioCtx.currentTime;
    scheduler();
    playBtn.innerText = '|| PAUSE RADIO';
    vinylDisk.classList.add('playing');
  } else {
    playBtn.innerText = '▶ RADIO LOS SANTOS';
    vinylDisk.classList.remove('playing');
  }
});

// --- Custom Cursor Logic ---
const cursor = document.createElement('div');
document.addEventListener('mousemove', (e) => {
  const style = document.createElement('style');
  style.innerHTML = `body::after { left: ${e.clientX}px; top: ${e.clientY}px; }`;
  document.head.appendChild(style);
});

document.querySelectorAll('a, button, li').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

// --- Three.js Scene ---
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffa500); // Sunset Orange base
scene.fog = new THREE.FogExp2(0xffa500, 0.002);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffd700, 1);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Ground (Grid)
const gridHelper = new THREE.GridHelper(200, 50, 0x000000, 0x000000);
scene.add(gridHelper);

const planeGeometry = new THREE.PlaneGeometry(200, 200);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.1;
scene.add(plane);

// Procedural City (Buildings)
const buildings = [];
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.5 });

for (let i = 0; i < 100; i++) {
  const mesh = new THREE.Mesh(geometry, material);
  const x = (Math.random() - 0.5) * 100;
  const z = (Math.random() - 0.5) * 100 - 20;
  const height = Math.random() * 10 + 2;
  
  mesh.position.set(x, height / 2, z);
  mesh.scale.set(Math.random() * 3 + 1, height, Math.random() * 3 + 1);
  
  scene.add(mesh);
  buildings.push(mesh);
}

// Palm Trees (Simplified as Green Cylinders + Cones)
const palmGeo = new THREE.CylinderGeometry(0.2, 0.3, 4);
const palmMat = new THREE.MeshBasicMaterial({ color: 0x4a3c31 });
const leafGeo = new THREE.ConeGeometry(1.5, 1, 5);
const leafMat = new THREE.MeshBasicMaterial({ color: 0x2a6c34 });

for(let i=0; i<20; i++) {
    const trunk = new THREE.Mesh(palmGeo, palmMat);
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 40 + 10;
    trunk.position.set(x, 2, z);
    
    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.y = 2;
    trunk.add(leaves);
    
    scene.add(trunk);
    buildings.push(trunk); // Add to animation loop for parallax effect
}

// Character Cards (Floating Planes)
const textureLoader = new THREE.TextureLoader();
// Using placeholders that look like GTA art
const cardGeo = new THREE.PlaneGeometry(4, 6);

const characters = [
    { color: 0x00ff00, x: -5, z: 0, name: "CJ" },
    { color: 0xff0000, x: 0, z: -2, name: "SMOKE" },
    { color: 0x0000ff, x: 5, z: 0, name: "RYDER" }
];

const charMeshes = [];

characters.forEach(char => {
    const mat = new THREE.MeshBasicMaterial({ 
        color: char.color, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(cardGeo, mat);
    mesh.position.set(char.x, 4, char.z);
    scene.add(mesh);
    charMeshes.push(mesh);

    // Add border (Neon frame)
    const borderGeo = new THREE.EdgesGeometry(cardGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const border = new THREE.LineSegments(borderGeo, borderMat);
    mesh.add(border);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  // Camera subtle movement
  camera.position.x = Math.sin(elapsedTime * 0.2) * 2;
  camera.lookAt(0, 2, -10);

  // Character float
  charMeshes.forEach((mesh, i) => {
      mesh.position.y = 4 + Math.sin(elapsedTime + i) * 0.2;
      mesh.rotation.y = Math.sin(elapsedTime * 0.5 + i) * 0.1;
  });

  // Sky color cycle (Sunset to Night)
  const hue = (Math.sin(elapsedTime * 0.05) + 1) * 0.1 + 0.05; // Orange to reddish
  scene.background.setHSL(hue, 1, 0.5);
  scene.fog.color.setHSL(hue, 1, 0.5);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loading Screen Logic
window.addEventListener('load', () => {
    const bar = document.querySelector('.bar');
    const loader = document.getElementById('loading-screen');
    
    // Simulate loading
    setTimeout(() => { bar.style.width = '50%'; }, 500);
    setTimeout(() => { bar.style.width = '100%'; }, 1500);
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 1000);
        
        // Intro Animation
        gsap.from('.menu li', {
            x: -100,
            opacity: 0,
            stagger: 0.1,
            duration: 1,
            ease: 'power2.out'
        });
    }, 2000);
});

// Mouse Interaction (Parallax)
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    
    gsap.to(camera.rotation, {
        x: -y * 0.1,
        y: -x * 0.1,
        duration: 1
    });
});