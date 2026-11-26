import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;

export class FlightController {
  constructor(canvas, start, onInteract) {
    this.canvas = canvas;
    this.start = start;
    this.onInteract = onInteract;
    this.keys = new Set();
    this.position = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, -1);
    this.cameraTarget = new THREE.Vector3();
    this.joystick = { x: 0, y: 0 };
    this.touchAltitude = 0;
    this.autoTarget = null;
    this.autoCallback = null;
    this.paused = false;
    this.dragging = false;
    this.dragDistance = 0;
    this.bindControls();
    this.reset();
  }

  reset() {
    this.position.fromArray(this.start.position);
    const target = new THREE.Vector3().fromArray(this.start.target);
    const direction = target.clone().sub(this.position);
    this.heading = Math.atan2(direction.x, -direction.z);
    this.targetHeading = this.heading;
    this.pitch = -0.08;
    this.targetPitch = 0;
    this.bank = 0;
    this.speed = 16;
    this.targetSpeed = 16;
    this.autoTarget = null;
    this.autoCallback = null;
    this.cameraTarget.copy(target);
  }

  bindControls() {
    const controlledKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight']);
    window.addEventListener('keydown', (event) => {
      if (document.querySelector('dialog[open]') || !controlledKeys.has(event.code)) return;
      event.preventDefault();
      this.keys.add(event.code);
      this.interact();
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.keys.clear());

    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.dragging = true;
      this.dragDistance = 0;
      this.lastPointer = [event.clientX, event.clientY];
      this.canvas.setPointerCapture(event.pointerId);
      this.interact();
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging) return;
      const dx = event.clientX - this.lastPointer[0];
      const dy = event.clientY - this.lastPointer[1];
      this.dragDistance += Math.abs(dx) + Math.abs(dy);
      this.targetHeading -= dx * 0.0045;
      this.targetPitch = clamp(this.targetPitch - dy * 0.004, -0.48, 0.55);
      this.lastPointer = [event.clientX, event.clientY];
    });
    const endDrag = () => { this.dragging = false; };
    this.canvas.addEventListener('pointerup', endDrag);
    this.canvas.addEventListener('pointercancel', endDrag);
  }

  interact() {
    this.autoTarget = null;
    this.autoCallback = null;
    this.onInteract?.();
  }

  flyTo(place, callback) {
    this.autoTarget = new THREE.Vector3().fromArray(place.approach);
    this.autoCallback = callback;
    this.paused = false;
  }

  setJoystick(x, y) {
    this.joystick.x = clamp(x, -1, 1);
    this.joystick.y = clamp(y, -1, 1);
    if (Math.abs(x) + Math.abs(y) > 0.08) this.interact();
  }

  setTouchAltitude(value) {
    this.touchAltitude = value;
    if (value) this.interact();
  }

  update(delta) {
    if (this.paused) return;
    const dt = Math.min(delta, 0.05);
    const turn = (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0)
      - (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) + this.joystick.x;
    const climb = (this.keys.has('Space') || this.keys.has('ArrowUp') ? 1 : 0)
      - (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('ArrowDown') ? 1 : 0)
      + this.touchAltitude - this.joystick.y;
    const throttle = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);

    if (this.autoTarget) {
      const difference = this.autoTarget.clone().sub(this.position);
      const distance = difference.length();
      this.targetHeading = Math.atan2(difference.x, -difference.z);
      this.targetPitch = clamp(Math.atan2(difference.y, Math.hypot(difference.x, difference.z)), -0.35, 0.4);
      this.targetSpeed = clamp(distance * 0.42, 7, 32);
      if (distance < 10) {
        this.position.copy(this.autoTarget);
        this.autoTarget = null;
        this.targetSpeed = 0;
        this.targetPitch = 0;
        const callback = this.autoCallback;
        this.autoCallback = null;
        callback?.();
      }
    } else {
      this.targetHeading += turn * dt * 1.15;
      this.targetSpeed = clamp(this.targetSpeed + throttle * dt * 14, 0, 48);
      if (Math.abs(climb) > 0.05) this.targetPitch = clamp(climb * 0.48, -0.48, 0.55);
      else this.targetPitch *= Math.exp(-dt * 1.4);
    }

    const headingDelta = Math.atan2(Math.sin(this.targetHeading - this.heading), Math.cos(this.targetHeading - this.heading));
    this.heading += headingDelta * Math.min(1, dt * 3.8);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, 1 - Math.exp(-dt * 3.5));
    this.bank = THREE.MathUtils.lerp(this.bank, clamp(-headingDelta * 0.65 - turn * 0.2, -0.52, 0.52), 1 - Math.exp(-dt * 4));
    this.speed = THREE.MathUtils.lerp(this.speed, this.targetSpeed, 1 - Math.exp(-dt * 1.8));

    this.forward.set(Math.sin(this.heading), 0, -Math.cos(this.heading));
    this.position.addScaledVector(this.forward, Math.cos(this.pitch) * this.speed * dt);
    this.position.y += Math.sin(this.pitch) * this.speed * dt;

    if (this.position.y < 3.4) {
      this.position.y = 3.4;
      this.targetPitch = Math.max(0.08, this.targetPitch);
    }
    if (this.position.y > 260) {
      this.position.y = 260;
      this.targetPitch = Math.min(-0.08, this.targetPitch);
    }

    const beforeX = this.position.x;
    const beforeZ = this.position.z;
    this.position.x = clamp(this.position.x, -980, 980);
    this.position.z = clamp(this.position.z, -1420, 1320);
    if (beforeX !== this.position.x || beforeZ !== this.position.z) {
      this.targetHeading = Math.atan2(-this.position.x, this.position.z);
      this.targetSpeed = Math.min(this.targetSpeed, 16);
    }
  }

  updatePigeon(pigeon, time) {
    const flapStrength = clamp(Math.abs(this.targetPitch) * 1.3 + this.speed / 90, 0.08, 0.9);
    pigeon.update(this.position, this.heading, this.pitch, this.bank, time, this.paused ? 0.05 : flapStrength);
  }

  updateCamera(camera, delta, instant = false) {
    const desired = this.position.clone().addScaledVector(this.forward, -12).add(new THREE.Vector3(0, 4.8, 0));
    const lookAt = this.position.clone().addScaledVector(this.forward, 10).add(new THREE.Vector3(0, -1.8, 0));
    if (instant) {
      camera.position.copy(desired);
      this.cameraTarget.copy(lookAt);
    } else {
      camera.position.lerp(desired, 1 - Math.exp(-Math.min(delta, 0.1) * 4.2));
      this.cameraTarget.lerp(lookAt, 1 - Math.exp(-Math.min(delta, 0.1) * 5));
    }
    camera.lookAt(this.cameraTarget);
  }
}
