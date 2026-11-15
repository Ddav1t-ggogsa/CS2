import * as THREE from "three";
import { WEAPON_CONFIGS } from "./weapon-configs.js";

export { WEAPON_CONFIGS } from "./weapon-configs.js";

const WEAPON_KEY_MAP = new Map([
  ["Digit1", "assaultRifle"],
  ["Numpad1", "assaultRifle"],
  ["Digit2", "sniperRifle"],
  ["Numpad2", "sniperRifle"],
  ["Digit3", "pistol"],
  ["Numpad3", "pistol"],
  ["Digit4", "smg"],
  ["Numpad4", "smg"],
  ["Digit5", "shotgun"],
  ["Numpad5", "shotgun"],
]);

const IMPACT_PROFILES = {
  metal: {
    count: 7,
    color: 0xffb451,
    life: 0.23,
    speed: 3.2,
    size: 0.035,
    gravity: 8,
    additive: true,
  },
  glass: {
    count: 6,
    color: 0x9fe5df,
    life: 0.28,
    speed: 2.4,
    size: 0.03,
    gravity: 7,
    additive: true,
  },
  concrete: {
    count: 5,
    color: 0xaaa99b,
    life: 0.52,
    speed: 0.65,
    size: 0.09,
    gravity: -0.15,
    additive: false,
  },
  dirt: {
    count: 5,
    color: 0x9a8061,
    life: 0.58,
    speed: 0.52,
    size: 0.1,
    gravity: -0.1,
    additive: false,
  },
};
const MAX_IMPACT_PARTICLES = 120;

function createRadialTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.72)");
  gradient.addColorStop(0.28, "rgba(255, 255, 255, 0.36)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function getSurfaceType(hit) {
  const material = Array.isArray(hit.object.material)
    ? hit.object.material[hit.face?.materialIndex ?? 0]
    : hit.object.material;
  return material?.userData?.surfaceType ?? "concrete";
}

export class ShootingSystem {
  constructor({
    camera,
    scene,
    map,
    enemyGroup = null,
    extraTargets = [],
    targetValidator = () => true,
    onShot = () => {},
    onHit = () => {},
    weapon,
    audio,
    pointerLockElement,
    hud,
    weaponId = "assaultRifle",
  }) {
    this.camera = camera;
    this.scene = scene;
    this.map = map;
    this.weapon = weapon;
    this.audio = audio;
    this.targets = [map, enemyGroup, ...extraTargets].filter(Boolean);
    this.targetValidator = targetValidator;
    this.onShot = onShot;
    this.onHit = onHit;
    this.pointerLockElement = pointerLockElement;
    this.hud = hud;
    this.raycaster = new THREE.Raycaster();
    this.aimPoint = new THREE.Vector2(0, 0);
    this.baseFov = camera.fov;
    this.impactTexture = createRadialTexture();
    this.particles = [];
    this.ammoByWeapon = new Map(
      Object.entries(WEAPON_CONFIGS).map(([id, config]) => [
        id,
        { magazine: config.magazineSize, reserve: config.reserveAmmo },
      ]),
    );
    this.weaponId = null;
    this.config = null;
    this.magazine = 0;
    this.reserve = 0;
    this.fireCooldown = 0;
    this.isFiring = false;
    this.isAiming = false;
    this.isReloading = false;
    this.reloadRemaining = 0;
    this.enabled = true;
    this.unlimitedAmmo = false;

    this.setWeapon(weaponId);

    this.onMouseDown = (event) => {
      if (!this.enabled || document.pointerLockElement !== this.pointerLockElement) return;
      if (event.button === 2) {
        event.preventDefault();
        this.setAiming(true);
        return;
      }
      if (event.button !== 0) return;
      event.preventDefault();
      this.isFiring = !this.config.semiAutomatic;
      this.fire();
    };
    this.onMouseUp = (event) => {
      if (event.button === 0) this.isFiring = false;
      if (event.button === 2) this.setAiming(false);
    };
    this.onKeyDown = (event) => {
      if (
        !this.enabled ||
        document.pointerLockElement !== this.pointerLockElement ||
        event.repeat
      ) {
        return;
      }
      const requestedWeapon = WEAPON_KEY_MAP.get(event.code);
      if (requestedWeapon) {
        event.preventDefault();
        this.setWeapon(requestedWeapon);
      } else if (event.code === "KeyR") {
        event.preventDefault();
        this.reload();
      }
    };
    this.onPointerLockChange = () => {
      if (document.pointerLockElement !== this.pointerLockElement) {
        this.isFiring = false;
        this.setAiming(false);
      }
    };
    this.onContextMenu = (event) => {
      if (document.pointerLockElement === this.pointerLockElement) event.preventDefault();
    };

    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    document.addEventListener("contextmenu", this.onContextMenu);
    window.addEventListener("keydown", this.onKeyDown);
    this.updateHud();
  }

  setWeapon(weaponId) {
    const config = WEAPON_CONFIGS[weaponId];
    if (!config) {
      throw new RangeError(`Unknown weapon configuration: ${weaponId}`);
    }
    if (weaponId === this.weaponId) return false;

    const playSwitchSound = this.weaponId !== null;
    if (this.weaponId) {
      this.ammoByWeapon.set(this.weaponId, {
        magazine: this.magazine,
        reserve: this.reserve,
      });
    }

    this.weaponId = weaponId;
    this.config = config;
    const ammo = this.ammoByWeapon.get(weaponId);
    this.magazine = ammo.magazine;
    this.reserve = ammo.reserve;
    this.isFiring = false;
    this.setAiming(false);
    this.isReloading = false;
    this.reloadRemaining = 0;
    this.fireCooldown = 0;
    this.weapon.setWeapon(weaponId);
    if (playSwitchSound) this.audio.playWeaponSwitch();
    this.updateHud();
    return true;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.isFiring = false;
      this.setAiming(false);
    }
  }

  setUnlimitedAmmo(enabled) {
    this.unlimitedAmmo = Boolean(enabled);
    if (this.unlimitedAmmo) {
      this.isReloading = false;
      this.reloadRemaining = 0;
    }
    this.updateHud();
  }

  resetAmmo() {
    this.ammoByWeapon = new Map(
      Object.entries(WEAPON_CONFIGS).map(([id, config]) => [
        id,
        { magazine: config.magazineSize, reserve: config.reserveAmmo },
      ]),
    );
    const ammo = this.ammoByWeapon.get(this.weaponId);
    this.magazine = ammo.magazine;
    this.reserve = ammo.reserve;
    this.isReloading = false;
    this.reloadRemaining = 0;
    this.fireCooldown = 0;
    this.updateHud();
  }

  setAiming(aiming) {
    this.isAiming = Boolean(aiming && this.config?.zoomFov);
    this.hud.scopeOverlay.hidden = !this.isAiming;
    this.hud.reticle.classList.toggle("is-scoped", this.isAiming);
  }

  updateHud() {
    this.hud.ammoIcon.dataset.weapon = this.weaponId;
    this.hud.weaponName.textContent = this.config.displayName;
    this.hud.weaponKey.textContent = String(this.config.slot);
    this.hud.magazine.textContent = this.unlimitedAmmo
      ? "∞"
      : String(this.magazine).padStart(2, "0");
    this.hud.reserve.textContent = this.unlimitedAmmo
      ? "∞"
      : String(this.reserve).padStart(2, "0");
    this.hud.magazineFill.style.transform =
      `scaleX(${this.unlimitedAmmo ? 1 : this.magazine / this.config.magazineSize})`;
    this.hud.ammoDisplay.classList.toggle(
      "is-low",
      !this.unlimitedAmmo && this.magazine <= Math.ceil(this.config.magazineSize * 0.2),
    );
    this.hud.reloadIndicator.hidden = !this.isReloading;
    this.hud.reloadFill.style.transform = "scaleX(0)";
  }

  fire() {
    if (
      !this.enabled ||
      this.isReloading ||
      this.weapon.isSwitching ||
      this.fireCooldown > 0
    ) {
      return false;
    }
    if (!this.unlimitedAmmo && this.magazine <= 0) {
      this.isFiring = false;
      return false;
    }

    if (!this.unlimitedAmmo) {
      this.magazine -= 1;
      this.ammoByWeapon.set(this.weaponId, {
        magazine: this.magazine,
        reserve: this.reserve,
      });
    }
    this.fireCooldown = 60 / this.config.fireRate;
    this.weapon.fire(this.config.recoil);
    this.audio.playWeaponShot(this.config.sound);
    this.onShot();
    this.resolveShot();
    this.updateHud();
    return true;
  }

  reload() {
    if (
      this.unlimitedAmmo ||
      this.isReloading ||
      this.magazine >= this.config.magazineSize ||
      this.reserve <= 0
    ) {
      return false;
    }

    this.isReloading = true;
    this.reloadRemaining = this.config.reloadDuration;
    this.hud.reloadIndicator.hidden = false;
    this.hud.reloadFill.style.transform = "scaleX(0)";
    this.audio.playReload(this.config.sound, false);
    return true;
  }

  finishReload() {
    const needed = this.config.magazineSize - this.magazine;
    const loaded = Math.min(needed, this.reserve);
    this.magazine += loaded;
    this.reserve -= loaded;
    this.ammoByWeapon.set(this.weaponId, {
      magazine: this.magazine,
      reserve: this.reserve,
    });
    this.isReloading = false;
    this.reloadRemaining = 0;
    this.audio.playReload(this.config.sound, true);
    this.updateHud();
  }

  resolveShot() {
    const pelletCount = this.config.pellets;
    let hitTarget = false;
    for (let pellet = 0; pellet < pelletCount; pellet += 1) {
      const radius = Math.sqrt(Math.random()) * this.config.spread;
      const angle = Math.random() * Math.PI * 2;
      this.aimPoint.set(Math.cos(angle) * radius, Math.sin(angle) * radius);
      this.raycaster.setFromCamera(this.aimPoint, this.camera);
      this.raycaster.far = this.config.range;
      const intersections = this.raycaster.intersectObjects(this.targets, true);
      const hit = intersections.find((intersection) => {
        for (let parent = intersection.object; parent; parent = parent.parent) {
          if (parent.userData.isEnemy) {
            return parent.userData.active && this.targetValidator(parent);
          }
        }
        return true;
      });
      if (hit) {
        const isTargetHit = this.getTargetRoot(hit.object) !== null;
        if (isTargetHit && !hitTarget) {
          hitTarget = true;
          this.onHit();
        }
        this.resolveHit(hit);
      }
    }
    this.aimPoint.set(0, 0);
  }

  getTargetRoot(object) {
    for (let parent = object; parent && parent !== this.map; parent = parent.parent) {
      if (parent.userData.isEnemy) return parent;
    }
    return null;
  }

  resolveHit(hit) {
    const surfaceType = getSurfaceType(hit);
    const normal = hit.face
      ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
      : new THREE.Vector3(0, 1, 0);
    const point = hit.point.clone().addScaledVector(normal, 0.012);
    this.createImpact(point, normal, surfaceType);

    hit.object.dispatchEvent({
      type: "shot",
      damage: this.config.damage,
      point: point.clone(),
      surfaceType,
      weaponId: this.weaponId,
    });

    for (let target = hit.object; target && target !== this.map; target = target.parent) {
      if (typeof target.userData.health !== "number") continue;
      target.userData.health = Math.max(0, target.userData.health - this.config.damage);
      target.dispatchEvent({
        type: "damage",
        amount: this.config.damage,
        health: target.userData.health,
        point: point.clone(),
        weaponId: this.weaponId,
        attacker: { id: "player", team: "blue" },
      });
      break;
    }
  }

  createImpact(position, normal, surfaceType) {
    const profile = IMPACT_PROFILES[surfaceType] ?? IMPACT_PROFILES.concrete;
    const count = Math.min(profile.count, MAX_IMPACT_PARTICLES - this.particles.length);
    for (let index = 0; index < count; index += 1) {
      const spriteMaterial = new THREE.SpriteMaterial({
        map: this.impactTexture,
        color: profile.color,
        transparent: true,
        depthWrite: false,
        blending: profile.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        opacity: profile.additive ? 0.95 : 0.5,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.setScalar(profile.size * (0.65 + Math.random() * 0.7));

      const direction = normal.clone().multiplyScalar(0.45).add(
        new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() * 0.9 + 0.08,
          Math.random() - 0.5,
        ),
      ).normalize();
      const speed = profile.speed * (0.55 + Math.random() * 0.9);
      const life = profile.life * (0.65 + Math.random() * 0.7);

      this.scene.add(sprite);
      this.particles.push({
        sprite,
        velocity: direction.multiplyScalar(speed),
        life,
        maxLife: life,
        initialSize: sprite.scale.x,
        gravity: profile.gravity,
        expands: !profile.additive,
      });
    }
  }

  updateParticles(delta) {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life = Math.max(0, particle.life - delta);
      particle.velocity.y -= particle.gravity * delta;
      particle.sprite.position.addScaledVector(particle.velocity, delta);

      const progress = 1 - particle.life / particle.maxLife;
      const scale = particle.initialSize * (1 + (particle.expands ? progress * 2.2 : 0));
      particle.sprite.scale.setScalar(scale);
      particle.sprite.material.opacity = (particle.expands ? 0.5 : 0.95) * (1 - progress);

      if (particle.life === 0) {
        this.scene.remove(particle.sprite);
        particle.sprite.material.dispose();
        this.particles.splice(index, 1);
      }
    }
  }

  update(delta) {
    this.fireCooldown = Math.max(0, this.fireCooldown - delta);
    const targetFov = this.isAiming ? this.config.zoomFov : this.baseFov;
    const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, delta);
    if (Math.abs(nextFov - this.camera.fov) > 0.001) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }

    if (this.isReloading) {
      this.reloadRemaining = Math.max(0, this.reloadRemaining - delta);
      const progress = 1 - this.reloadRemaining / this.config.reloadDuration;
      this.hud.reloadFill.style.transform = `scaleX(${progress})`;
      if (this.reloadRemaining === 0) this.finishReload();
    }
    if (
      this.isFiring &&
      this.enabled &&
      !this.config.semiAutomatic &&
      !this.isReloading &&
      !this.weapon.isSwitching &&
      this.fireCooldown === 0
    ) {
      this.fire();
    }
    this.updateParticles(delta);
  }

  dispose() {
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    document.removeEventListener("contextmenu", this.onContextMenu);
    window.removeEventListener("keydown", this.onKeyDown);
    for (const particle of this.particles) {
      this.scene.remove(particle.sprite);
      particle.sprite.material.dispose();
    }
    this.particles.length = 0;
    this.impactTexture.dispose();
  }
}
