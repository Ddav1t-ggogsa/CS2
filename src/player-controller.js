import * as THREE from "three";

const PLAYER_RADIUS = 0.38;
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.62;
const GROUND_HEIGHT = -0.08;
const GRAVITY = 19.5;
const JUMP_SPEED = 6.4;
const LOOK_SENSITIVITY = 0.0021;

function horizontalOverlap(x, z, box) {
  const closestX = THREE.MathUtils.clamp(x, box.min.x, box.max.x);
  const closestZ = THREE.MathUtils.clamp(z, box.min.z, box.max.z);
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS;
}

export class PlayerController {
  constructor(camera, domElement, colliders, { onFootstep = () => {} } = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;
    this.position = new THREE.Vector3(0, GROUND_HEIGHT, 43);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = -0.035;
    this.lookSensitivity = LOOK_SENSITIVITY;
    this.grounded = true;
    this.locked = false;
    this.jumpRequested = false;
    this.keys = new Set();
    this.onFootstep = onFootstep;
    this.footstepTimer = 0.12;
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    this.syncCamera();

    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousemove", this.onMouseMove);
  }

  setLocked(locked) {
    this.locked = locked;
    if (!locked) {
      this.keys.clear();
      this.jumpRequested = false;
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.footstepTimer = 0.12;
    }
  }

  setLookSensitivity(multiplier) {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw new RangeError("Mouse sensitivity must be a positive finite number.");
    }
    this.lookSensitivity = LOOK_SENSITIVITY * multiplier;
  }

  stopMotion() {
    this.keys.clear();
    this.jumpRequested = false;
    this.velocity.set(0, 0, 0);
    this.footstepTimer = 0.12;
  }

  respawnAt(spawnPoints) {
    const safeSpawns = spawnPoints.filter(([x, z]) =>
      Number.isFinite(x) &&
      Number.isFinite(z) &&
      !this.isBlockedAt(x, z, GROUND_HEIGHT),
    );
    if (safeSpawns.length === 0) {
      throw new RangeError("The requested player respawn point is not safe.");
    }

    const [x, z] = safeSpawns[Math.floor(Math.random() * safeSpawns.length)];
    this.position.set(x, GROUND_HEIGHT, z);
    this.yaw = 0;
    this.pitch = -0.035;
    this.grounded = true;
    this.stopMotion();
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    this.syncCamera();
    return this.position.clone();
  }

  dispose() {
    this.setLocked(false);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
  }

  handleKeyDown(event) {
    if (!this.locked) return;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "ShiftRight"].includes(event.code)) {
      event.preventDefault();
      this.keys.add(event.code);
    }
    if (event.code === "Space" && !event.repeat) {
      this.jumpRequested = true;
    }
  }

  handleKeyUp(event) {
    this.keys.delete(event.code);
  }

  handleMouseMove(event) {
    if (!this.locked) return;
    this.yaw -= event.movementX * this.lookSensitivity;
    this.pitch -= event.movementY * this.lookSensitivity;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch,
      -Math.PI / 2 + 0.01,
      Math.PI / 2 - 0.01,
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  isBlockedAt(x, z, feet = this.position.y) {
    const head = feet + PLAYER_HEIGHT;

    return this.colliders.some((box) =>
      feet < box.max.y &&
      head > box.min.y &&
      horizontalOverlap(x, z, box),
    );
  }

  moveHorizontally(delta) {
    const nextX = this.position.x + this.velocity.x * delta;
    if (!this.isBlockedAt(nextX, this.position.z)) {
      this.position.x = nextX;
    } else {
      this.velocity.x = 0;
    }

    const nextZ = this.position.z + this.velocity.z * delta;
    if (!this.isBlockedAt(this.position.x, nextZ)) {
      this.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }
  }

  updateVertical(delta) {
    const previousFeet = this.position.y;
    const nextFeet = previousFeet + this.velocity.y * delta;
    let landingHeight = GROUND_HEIGHT;

    if (this.velocity.y <= 0) {
      for (const box of this.colliders) {
        const top = box.max.y;
        if (
          top > landingHeight &&
          previousFeet >= top - 0.025 &&
          nextFeet <= top &&
          horizontalOverlap(this.position.x, this.position.z, box)
        ) {
          landingHeight = top;
        }
      }
    } else {
      const previousHead = previousFeet + PLAYER_HEIGHT;
      const nextHead = nextFeet + PLAYER_HEIGHT;
      for (const box of this.colliders) {
        if (
          previousHead <= box.min.y &&
          nextHead >= box.min.y &&
          horizontalOverlap(this.position.x, this.position.z, box)
        ) {
          this.position.y = box.min.y - PLAYER_HEIGHT;
          this.velocity.y = 0;
          this.grounded = false;
          return;
        }
      }
    }

    if (nextFeet <= landingHeight) {
      this.position.y = landingHeight;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.position.y = nextFeet;
      this.grounded = false;
    }
  }

  syncCamera() {
    this.camera.position.set(
      this.position.x,
      this.position.y + EYE_HEIGHT,
      this.position.z,
    );
  }

  update(delta) {
    if (!this.locked || delta <= 0) return;

    const forwardInput = Number(this.keys.has("KeyW")) - Number(this.keys.has("KeyS"));
    const strafeInput = Number(this.keys.has("KeyD")) - Number(this.keys.has("KeyA"));
    const inputLength = Math.hypot(forwardInput, strafeInput);
    let targetX = 0;
    let targetZ = 0;

    if (inputLength > 0) {
      const forward = forwardInput / inputLength;
      const strafe = strafeInput / inputLength;
      targetX = -Math.sin(this.yaw) * forward + Math.cos(this.yaw) * strafe;
      targetZ = -Math.cos(this.yaw) * forward - Math.sin(this.yaw) * strafe;
    }

    const isWalking = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const maxSpeed = isWalking ? 2.45 : 6.4;
    const acceleration = this.grounded ? 17 : 5;
    const blend = 1 - Math.exp(-acceleration * delta);
    this.velocity.x += (targetX * maxSpeed - this.velocity.x) * blend;
    this.velocity.z += (targetZ * maxSpeed - this.velocity.z) * blend;

    if (this.jumpRequested && this.grounded) {
      this.velocity.y = JUMP_SPEED;
      this.grounded = false;
    }
    this.jumpRequested = false;

    this.moveHorizontally(delta);
    this.velocity.y -= GRAVITY * delta;
    this.updateVertical(delta);
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.grounded && inputLength > 0 && horizontalSpeed > 1.2) {
      this.footstepTimer -= delta;
      if (this.footstepTimer <= 0) {
        this.onFootstep(isWalking);
        this.footstepTimer = isWalking ? 0.5 : 0.34;
      }
    } else {
      this.footstepTimer = 0.12;
    }
    this.syncCamera();
  }
}
