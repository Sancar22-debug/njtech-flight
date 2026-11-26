import './style.css';
import * as THREE from 'three';
import { createWorld } from './world.js';
import { createPigeon } from './pigeon.js';
import { FlightController } from './flight.js';
import { places, start } from './data/places.js';

const startedAt = performance.now();
const canvas = document.querySelector('#world');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#dbe7e5');
scene.fog = new THREE.Fog('#dbe7e5', 620, 2100);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 3600);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch {
  document.querySelector('#loading').textContent = '当前浏览器无法启动 WebGL。请开启硬件加速或换用现代浏览器。';
  throw new Error('WebGL unavailable');
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const mobile = matchMedia('(max-width: 760px)').matches;
let quality = 'auto';
function applyQuality() {
  const ratio = quality === 'low' ? 1 : quality === 'high' ? Math.min(devicePixelRatio, 2) : Math.min(devicePixelRatio, mobile ? 1.15 : 1.5);
  renderer.setPixelRatio(ratio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  world.setQuality(quality === 'auto' && mobile ? 'low' : quality);
  document.querySelector('#quality').textContent = `画质 · ${{ auto: '自动', low: '流畅', high: '精细' }[quality]}`;
}

scene.add(new THREE.HemisphereLight('#eaf4f3', '#7c8066', 2.25));
const sunlight = new THREE.DirectionalLight('#fff1d6', 2.65);
sunlight.position.set(-450, 700, 350);
scene.add(sunlight);
const fill = new THREE.DirectionalLight('#c4d8ee', 0.55);
fill.position.set(500, 240, -400);
scene.add(fill);

const world = createWorld(scene, places);
const pigeon = createPigeon(scene);
const flight = new FlightController(canvas, start, () => {
  document.querySelector('#explore').innerHTML = '自由飞行中 <span>↗</span>';
});
applyQuality();
flight.updateCamera(camera, 1, true);

const placeList = document.querySelector('#place-list');
document.querySelector('.place-count').textContent = `${places.length} PLACES`;
for (const [index, place] of places.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'place-item';
  button.dataset.place = place.id;
  button.innerHTML = `<span class="place-number">0${index + 1}</span><span><span class="place-name">${place.name}</span><span class="place-en">${place.english}</span></span><span class="place-arrow">↗</span>`;
  button.addEventListener('click', () => openPlace(place));
  placeList.append(button);
}

const placeDialog = document.querySelector('#place-dialog');
const helpDialog = document.querySelector('#help-dialog');
let activePlace = null;

function openPlace(place) {
  activePlace = place;
  flight.paused = true;
  document.querySelector('#place-card').innerHTML = `
    <div class="place-card-grid">
      <div class="place-photo-wrap">
        <img class="place-photo" src="${place.photo}" alt="${place.photoAlt}" loading="lazy" />
        <span class="place-photo-credit">照片 / Photo: <a href="${place.sourceUrl}" target="_blank" rel="noreferrer">${place.author}</a> · <a href="${place.licenseUrl}" target="_blank" rel="noreferrer">${place.license}</a> · 网页裁切</span>
      </div>
      <div class="place-copy">
        <p class="eyebrow">${place.category}</p>
        <h2>${place.name}</h2>
        <p class="english-title">${place.english}</p>
        <p class="place-description">${place.description}</p>
        <p class="place-description" lang="en">${place.descriptionEn}</p>
        <div class="place-fact"><strong>从哪里进入 / ACCESS</strong><span>${place.access}<br>${place.accessEn}</span></div>
        <button class="fly-button" type="button">飞到这里 / Fly here →</button>
        <p class="verification-note">${place.note}</p>
      </div>
    </div>`;
  placeDialog.querySelector('.fly-button').addEventListener('click', () => {
    placeDialog.close();
    flight.flyTo(place, () => openPlace(place));
  });
  placeDialog.showModal();
}

for (const dialog of [placeDialog, helpDialog]) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => { flight.paused = false; });
}

document.querySelector('#help-button').addEventListener('click', () => {
  flight.paused = true;
  helpDialog.showModal();
});
document.querySelector('#open-nearby').addEventListener('click', () => {
  if (activePlace) openPlace(activePlace);
});

function resetFlight() {
  for (const dialog of [placeDialog, helpDialog]) if (dialog.open) dialog.close();
  flight.paused = false;
  flight.reset();
  flight.updateCamera(camera, 1, true);
  document.querySelector('#nearby').hidden = true;
}
document.querySelector('#reset').addEventListener('click', resetFlight);
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyR' && !document.querySelector('dialog[open]')) resetFlight();
});
document.querySelector('#explore').addEventListener('click', () => {
  flight.interact();
  canvas.focus();
});
canvas.tabIndex = 0;
document.querySelector('#quality').addEventListener('click', () => {
  quality = quality === 'auto' ? 'low' : quality === 'low' ? 'high' : 'auto';
  applyQuality();
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
canvas.addEventListener('pointerup', (event) => {
  if (flight.dragDistance > 5) return;
  pointer.set(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(world.markers, true)[0];
  if (hit) {
    const place = places.find((item) => item.id === hit.object.userData.placeId);
    if (place) openPlace(place);
  }
});

const joystick = document.querySelector('#joystick');
const stick = document.querySelector('#stick');
let joystickPointer = null;
function moveJoystick(event) {
  const bounds = joystick.getBoundingClientRect();
  const x = event.clientX - bounds.left - bounds.width / 2;
  const y = event.clientY - bounds.top - bounds.height / 2;
  const length = Math.hypot(x, y);
  const limit = 26;
  const scale = length > limit ? limit / length : 1;
  const px = x * scale;
  const py = y * scale;
  stick.style.transform = `translate(${px}px, ${py}px)`;
  flight.setJoystick(px / limit, py / limit);
}
joystick.addEventListener('pointerdown', (event) => {
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  moveJoystick(event);
});
joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId === joystickPointer) moveJoystick(event);
});
function releaseJoystick() {
  joystickPointer = null;
  stick.style.transform = '';
  flight.setJoystick(0, 0);
}
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);
for (const [selector, value] of [['#ascend', 1], ['#descend', -1]]) {
  const button = document.querySelector(selector);
  button.addEventListener('pointerdown', (event) => {
    button.setPointerCapture(event.pointerId);
    flight.setTouchAltitude(value);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(type, () => flight.setTouchAltitude(0));
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const altitude = document.querySelector('#altitude');
const speed = document.querySelector('#speed');
const compassNeedle = document.querySelector('#compass-needle');
const nearby = document.querySelector('#nearby');
const clock = new THREE.Clock();
let firstFrame = true;
let nearbyId = null;

function animate() {
  const delta = clock.getDelta();
  const time = clock.elapsedTime;
  flight.update(delta);
  flight.updatePigeon(pigeon, time);
  flight.updateCamera(camera, delta);

  for (const [index, marker] of world.markers.entries()) {
    marker.position.y = places[index].position[1] + 25 + Math.sin(time * 1.8 + index) * 1.2;
    marker.children[0].rotation.z = time * 0.4;
    const labelDistance = camera.position.distanceTo(marker.position);
    const labelScale = THREE.MathUtils.clamp(labelDistance / 180, 0.25, 1);
    const label = marker.children[2];
    label.visible = labelDistance > 45 && labelDistance < 650;
    label.scale.set(44 * labelScale, 11 * labelScale, 1);
  }

  altitude.textContent = Math.round(flight.position.y);
  speed.textContent = Math.round(flight.speed * 3.6);
  compassNeedle.style.transform = `rotate(${-flight.heading}rad)`;

  let closest = null;
  let closestDistance = Infinity;
  for (const place of places) {
    const distance = Math.hypot(flight.position.x - place.position[0], flight.position.z - place.position[2]);
    if (distance < closestDistance) {
      closest = place;
      closestDistance = distance;
    }
  }
  if (closestDistance < 105 && !document.querySelector('dialog[open]')) {
    if (nearbyId !== closest.id) {
      nearbyId = closest.id;
      activePlace = closest;
      document.querySelector('#nearby-name').textContent = `已接近 · ${closest.name}`;
    }
    nearby.hidden = false;
  } else {
    nearby.hidden = true;
    nearbyId = null;
  }

  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    document.querySelector('#loading').classList.add('ready');
    window.__NJTECH_METRICS__ = { firstFrameMs: Math.round(performance.now() - startedAt), buildings: 173, places: places.length };
  }
}
renderer.setAnimationLoop(animate);

window.njtechFlight = {
  getState: () => ({
    position: flight.position.toArray(),
    speed: flight.speed,
    heading: flight.heading,
    autoNavigating: Boolean(flight.autoTarget),
    quality,
    nearby: nearbyId,
    dialog: placeDialog.open ? activePlace?.id : null,
  }),
  flyTo: (id) => {
    const place = places.find((item) => item.id === id);
    if (place) flight.flyTo(place, () => openPlace(place));
  },
  openPlace: (id) => {
    const place = places.find((item) => item.id === id);
    if (place) openPlace(place);
  },
  reset: resetFlight,
};
