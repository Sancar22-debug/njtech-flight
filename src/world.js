import * as THREE from 'three';
import campus from './data/campus.json';

function polygonGeometry(points, y = 0) {
  const contour = points.map(([x, z]) => new THREE.Vector2(x, -z));
  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);
  const positions = [];
  for (const triangle of triangles) {
    for (const index of triangle) {
      const point = contour[index];
      positions.push(point.x, y, -point.y);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function extrudedGeometry(points, height) {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function createRoadGeometry(roads) {
  const positions = [];
  const indices = [];
  let index = 0;
  for (const road of roads) {
    const width = road.kind === 'footway' ? 1.5 : road.kind === 'service' ? 3 : road.kind === 'tertiary' ? 6 : 4.5;
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x1, z1] = road.points[i];
      const [x2, z2] = road.points[i + 1];
      const length = Math.hypot(x2 - x1, z2 - z1) || 1;
      const nx = -(z2 - z1) / length * width;
      const nz = (x2 - x1) / length * width;
      positions.push(x1 + nx, 0.08, z1 + nz, x1 - nx, 0.08, z1 - nz, x2 + nx, 0.08, z2 + nz, x2 - nx, 0.08, z2 - nz);
      indices.push(index, index + 1, index + 2, index + 2, index + 1, index + 3);
      index += 4;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function textTexture(text, subtitle = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = subtitle ? 256 : 128;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#18342f';
  context.font = '600 74px "Noto Sans SC", sans-serif';
  context.fillText(text, 512, subtitle ? 80 : 64);
  if (subtitle) {
    context.font = '500 34px "DM Sans", sans-serif';
    context.fillStyle = '#62746f';
    context.fillText(subtitle, 512, 178);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function labelSprite(name, english) {
  const material = new THREE.SpriteMaterial({ map: textTexture(name, english), transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(44, 11, 1);
  return sprite;
}

function inside(point, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    if (((zi > point[1]) !== (zj > point[1])) && (point[0] < ((xj - xi) * (point[1] - zi)) / (zj - zi) + xi)) result = !result;
  }
  return result;
}

function addLibrary(scene, building) {
  const height = 31;
  const group = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: '#d9dcd8', roughness: 0.78 });
  const roof = new THREE.MeshStandardMaterial({ color: '#eff0eb', roughness: 0.68 });
  const glass = new THREE.MeshStandardMaterial({ color: '#66838c', roughness: 0.28, metalness: 0.22 });
  const darkGlass = new THREE.MeshStandardMaterial({ color: '#34515b', roughness: 0.22, metalness: 0.3 });
  const stone = new THREE.MeshStandardMaterial({ color: '#bbbcb6', roughness: 0.95 });
  const metal = new THREE.MeshStandardMaterial({ color: '#c8d0d0', roughness: 0.35, metalness: 0.65 });

  const body = new THREE.Mesh(extrudedGeometry(building.points, height), [roof, wall]);
  body.position.y = 0.2;
  group.add(body);

  const xs = building.points.map((point) => point[0]);
  const zs = building.points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const width = maxX - minX;
  const centerX = (minX + maxX) / 2;

  for (let floor = 0; floor < 5; floor++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(width + 1, 0.65, 1.1), roof);
    band.position.set(centerX, 4.5 + floor * 5.7, maxZ + 0.35);
    group.add(band);
  }

  const finGeometry = new THREE.BoxGeometry(0.22, 22, 0.5);
  const fins = new THREE.InstancedMesh(finGeometry, metal, 35);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 35; i++) {
    matrix.makeTranslation(minX + 2 + i * ((width - 4) / 34), 18, maxZ + 0.8);
    fins.setMatrixAt(i, matrix);
  }
  group.add(fins);

  const glazing = new THREE.Mesh(new THREE.BoxGeometry(width - 5, 22, 0.55), glass);
  glazing.position.set(centerX, 18, maxZ + 0.25);
  group.add(glazing);

  const columnGeometry = new THREE.CylinderGeometry(0.65, 0.8, 20, 10);
  const columns = new THREE.InstancedMesh(columnGeometry, stone, 7);
  for (let i = 0; i < 7; i++) {
    matrix.makeTranslation(minX + 6 + i * ((width - 12) / 6), 10, maxZ + 6.5);
    columns.setMatrixAt(i, matrix);
  }
  group.add(columns);

  const upper = new THREE.Mesh(new THREE.BoxGeometry(width * 0.66, 7, 38), [roof, roof, roof, roof, darkGlass, roof]);
  upper.position.set(centerX - width * 0.09, 33.5, maxZ - 24);
  group.add(upper);

  for (let i = 0; i < 9; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72 + i * 1.3, 0.36, 2.2), stone);
    step.position.set(centerX, 0.2 + i * 0.34, maxZ + 26 - i * 2.05);
    group.add(step);
  }

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(30, 0.35, 9), new THREE.MeshStandardMaterial({ color: '#9db8bd', transparent: true, opacity: 0.72, roughness: 0.2, metalness: 0.25 }));
  canopy.position.set(centerX + width * 0.24, 7, maxZ + 5);
  group.add(canopy);

  const signMaterial = new THREE.MeshBasicMaterial({ map: textTexture('逸夫图书馆', 'NJUT  YIFU  LIBRARY'), transparent: true, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(30, 7.5), signMaterial);
  sign.position.set(centerX - width * 0.19, 5.5, maxZ + 0.95);
  group.add(sign);

  const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.45, 18, 66), glass);
  sideGlass.position.set(maxX + 0.3, 17, maxZ - 38);
  group.add(sideGlass);

  scene.add(group);
}

function addTrees(scene) {
  const positions = [];
  for (const road of campus.roads) {
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x1, z1] = road.points[i];
      const [x2, z2] = road.points[i + 1];
      const distance = Math.hypot(x2 - x1, z2 - z1);
      if (distance < 25) continue;
      const nx = -(z2 - z1) / distance;
      const nz = (x2 - x1) / distance;
      for (let d = 20; d < distance; d += 48) {
        const t = d / distance;
        for (const side of [-1, 1]) {
          const x = x1 + (x2 - x1) * t + nx * side * 9;
          const z = z1 + (z2 - z1) * t + nz * side * 9;
          if (!inside([x, z], campus.boundary)) continue;
          if (campus.buildings.some((building) => inside([x, z], building.points))) continue;
          if (campus.waters.some((water) => inside([x, z], water.points))) continue;
          positions.push([x, z, 0.85 + ((positions.length * 37) % 30) / 100]);
        }
      }
    }
  }

  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.45, 4, 6), new THREE.MeshStandardMaterial({ color: '#6c5840', roughness: 1 }), positions.length);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.5, 1), new THREE.MeshStandardMaterial({ color: '#527d52', roughness: 1 }), positions.length);
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  positions.forEach(([x, z, size], index) => {
    matrix.compose(new THREE.Vector3(x, 2, z), quaternion, new THREE.Vector3(size, size, size));
    trunk.setMatrixAt(index, matrix);
    scale.set(size * 1.15, size * 1.35, size * 1.15);
    matrix.compose(new THREE.Vector3(x, 6.1 * size, z), quaternion, scale);
    crown.setMatrixAt(index, matrix);
    crown.setColorAt(index, new THREE.Color(index % 3 === 0 ? '#66885a' : index % 3 === 1 ? '#47714d' : '#739361'));
  });
  scene.add(trunk, crown);
  return { trunk, crown, count: positions.length };
}

function addFountain(scene, water) {
  if (!water) return;
  const group = new THREE.Group();
  group.position.set(water.center[0], 0.25, water.center[1]);
  const material = new THREE.MeshBasicMaterial({ color: '#e4f5f2', transparent: true, opacity: 0.75 });
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.16, 5 + (i % 3), 5), material);
    jet.position.set(Math.cos(angle) * 0.7, 2.4, Math.sin(angle) * 0.7);
    jet.rotation.z = Math.cos(angle) * 0.18;
    jet.rotation.x = Math.sin(angle) * 0.18;
    group.add(jet);
  }
  const basin = new THREE.Mesh(new THREE.RingGeometry(2.5, 2.8, 32), material);
  basin.rotation.x = -Math.PI / 2;
  group.add(basin);
  scene.add(group);
}

export function createWorld(scene, places) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4200, 4200), new THREE.MeshStandardMaterial({ color: '#9cac96', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.15;
  scene.add(ground);

  const campusGround = new THREE.Mesh(polygonGeometry(campus.boundary, 0), new THREE.MeshStandardMaterial({ color: '#b7c3a8', roughness: 1, side: THREE.DoubleSide }));
  scene.add(campusGround);

  scene.add(new THREE.Mesh(createRoadGeometry(campus.roads), new THREE.MeshStandardMaterial({ color: '#a8aaa2', roughness: 0.98, side: THREE.DoubleSide })));

  const wallMaterials = {
    university: new THREE.MeshStandardMaterial({ color: '#d2c4ad', roughness: 0.9 }),
    dormitory: new THREE.MeshStandardMaterial({ color: '#c7b9a5', roughness: 0.95 }),
    default: new THREE.MeshStandardMaterial({ color: '#c8c4b8', roughness: 0.92 }),
  };
  const roofMaterials = {
    university: new THREE.MeshStandardMaterial({ color: '#857e72', roughness: 0.92 }),
    dormitory: new THREE.MeshStandardMaterial({ color: '#986f58', roughness: 0.95 }),
    default: new THREE.MeshStandardMaterial({ color: '#8c8b80', roughness: 0.95 }),
  };

  for (const building of campus.buildings) {
    if (building.name === '逸夫图书馆') {
      addLibrary(scene, building);
      continue;
    }
    const kind = building.kind === 'university' ? 'university' : ['dormitory', 'apartments'].includes(building.kind) ? 'dormitory' : 'default';
    const height = building.height || (building.levels ? building.levels * 3.2 : kind === 'dormitory' ? 16 : 12);
    const mesh = new THREE.Mesh(extrudedGeometry(building.points, height), [roofMaterials[kind], wallMaterials[kind]]);
    mesh.position.y = 0.12;
    scene.add(mesh);

    if (kind === 'university') {
    const xs = building.points.map((point) => point[0]);
      const zs = building.points.map((point) => point[1]);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(Math.max(...xs) - Math.min(...xs), 1.2, 0.3), new THREE.MeshStandardMaterial({ color: '#6e8587', roughness: 0.45 }));
      strip.position.set(building.center[0], height * 0.58, Math.max(...zs) + 0.18);
      scene.add(strip);
    }
  }

  const waterMaterial = new THREE.MeshStandardMaterial({ color: '#6f9da0', roughness: 0.3, metalness: 0.12, transparent: true, opacity: 0.94, side: THREE.DoubleSide });
  for (const water of campus.waters) scene.add(new THREE.Mesh(polygonGeometry(water.points, 0.14), waterMaterial));
  addFountain(scene, campus.waters.find((water) => water.name === '镜湖'));

  const sportMaterial = new THREE.MeshStandardMaterial({ color: '#7b9b79', roughness: 1, side: THREE.DoubleSide });
  const trackMaterial = new THREE.MeshStandardMaterial({ color: '#a77761', roughness: 1, side: THREE.DoubleSide });
  for (const sport of campus.sports) scene.add(new THREE.Mesh(polygonGeometry(sport.points, 0.12), sport.name === '行健田径场' ? trackMaterial : sportMaterial));

  const trees = addTrees(scene);
  const markers = [];
  for (const place of places) {
    const group = new THREE.Group();
    group.position.set(place.position[0], place.position[1] + 25, place.position[2]);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.3, 8, 32), new THREE.MeshBasicMaterial({ color: '#216bff', depthTest: false }));
    ring.rotation.x = Math.PI / 2;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false }));
    const label = labelSprite(place.name, place.english.toUpperCase());
    label.position.y = 10;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(9, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    for (const object of [ring, dot, label, hit]) {
      object.userData.placeId = place.id;
      group.add(object);
    }
    markers.push(group);
    scene.add(group);
  }

  return {
    markers,
    setQuality(quality) {
      const ratio = quality === 'low' ? 0.48 : 1;
      trees.trunk.count = Math.floor(trees.count * ratio);
      trees.crown.count = Math.floor(trees.count * ratio);
    },
  };
}
