import * as THREE from 'three';

export function createPigeon(scene) {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  root.add(visual);

  const grey = new THREE.MeshStandardMaterial({ color: '#87949d', roughness: 0.86 });
  const lightGrey = new THREE.MeshStandardMaterial({ color: '#c9d0d2', roughness: 0.9 });
  const wingGrey = new THREE.MeshStandardMaterial({ color: '#71818c', roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: '#202a30', roughness: 0.65 });
  const beakMaterial = new THREE.MeshStandardMaterial({ color: '#d9a28a', roughness: 0.8 });
  const blue = new THREE.MeshStandardMaterial({ color: '#216bff', roughness: 0.72 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), grey);
  body.scale.set(1.05, 0.92, 1.48);
  visual.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.82, 20, 14), lightGrey);
  chest.position.set(0, -0.12, -0.65);
  chest.scale.set(0.95, 1, 0.9);
  visual.add(chest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.69, 22, 16), grey);
  head.position.set(0, 0.7, -1.13);
  visual.add(head);

  const neckSheen = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 12), new THREE.MeshStandardMaterial({ color: '#668c8c', roughness: 0.5, metalness: 0.08 }));
  neckSheen.position.set(0, 0.3, -0.8);
  neckSheen.scale.set(1, 0.75, 0.9);
  visual.add(neckSheen);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 12), beakMaterial);
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 0.62, -1.88);
  visual.add(beak);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), dark);
    eye.position.set(side * 0.49, 0.88, -1.53);
    visual.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    glint.position.set(side * 0.53, 0.92, -1.59);
    visual.add(glint);
  }

  const wingGeometry = new THREE.SphereGeometry(1, 18, 10);
  const leftWing = new THREE.Group();
  const rightWing = new THREE.Group();
  for (const [wing, side] of [[leftWing, -1], [rightWing, 1]]) {
    wing.position.set(side * 0.76, 0.18, -0.05);
    const mesh = new THREE.Mesh(wingGeometry, wingGrey);
    mesh.position.x = side * 0.88;
    mesh.scale.set(1.25, 0.14, 0.8);
    wing.add(mesh);
    for (let i = 0; i < 4; i++) {
      const feather = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.72, 4, 8), lightGrey);
      feather.rotation.x = Math.PI / 2;
      feather.position.set(side * (1.2 + i * 0.18), -0.03, 0.25 + i * 0.12);
      wing.add(feather);
    }
    visual.add(wing);
  }

  const tail = new THREE.Group();
  tail.position.set(0, 0.05, 1.22);
  for (let i = -2; i <= 2; i++) {
    const feather = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.8, 4, 8), i % 2 ? grey : lightGrey);
    feather.rotation.x = Math.PI / 2;
    feather.rotation.z = i * 0.13;
    feather.position.set(i * 0.18, 0, 0.5);
    tail.add(feather);
  }
  visual.add(tail);

  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.13, 10, 28), blue);
  scarf.position.set(0, 0.35, -0.83);
  scarf.scale.y = 0.82;
  visual.add(scarf);

  const scarfTail = new THREE.Group();
  scarfTail.position.set(0.38, 0.35, -0.45);
  for (let i = 0; i < 2; i++) {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.07, 1.25 + i * 0.25), blue);
    ribbon.position.set(i * 0.28, -i * 0.12, 0.55 + i * 0.1);
    ribbon.rotation.y = -0.12 + i * 0.18;
    scarfTail.add(ribbon);
  }
  visual.add(scarfTail);

  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.5, 8), beakMaterial);
    foot.position.set(side * 0.35, -0.92, 0.25);
    foot.rotation.x = 0.35;
    visual.add(foot);
  }

  visual.scale.setScalar(1.25);
  scene.add(root);

  return {
    root,
    update(position, heading, pitch, bank, time, flapStrength) {
      root.position.copy(position);
      root.rotation.y = heading;
      visual.rotation.x = pitch * 0.42;
      visual.rotation.z = bank;
      const flap = Math.sin(time * (flapStrength > 0.2 ? 10 : 4)) * (0.12 + flapStrength * 0.65);
      leftWing.rotation.z = -0.12 - flap;
      rightWing.rotation.z = 0.12 + flap;
      leftWing.rotation.y = -0.1;
      rightWing.rotation.y = 0.1;
      scarfTail.rotation.x = Math.sin(time * 5) * 0.08 - pitch * 0.3;
      scarfTail.rotation.y = Math.sin(time * 3.2) * 0.08;
      tail.rotation.x = -pitch * 0.25;
    },
  };
}
