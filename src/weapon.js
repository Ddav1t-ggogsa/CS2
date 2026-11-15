import * as THREE from "three";
import { WEAPON_CONFIGS } from "./weapon-configs.js";

const MOVEMENT_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD"];
const SWITCH_DURATION = 0.15;
const SWITCH_DROP = 0.52;

export const WEAPON_SKINS = Object.freeze({
  field: Object.freeze({
    label: "FIELD ISSUE",
    colors: { receiver: 0x343b37, polymer: 0x252b27, grip: 0x303630, rail: 0x59615a, accent: 0x697146 },
    roughness: 0.78,
    metalness: 0.22,
  }),
  arctic: Object.freeze({
    label: "ARCTIC CERAMIC",
    colors: { receiver: 0x596875, polymer: 0xa2b4bc, grip: 0x53616b, rail: 0x8ba0a7, accent: 0xe0e7e5 },
    roughness: 0.64,
    metalness: 0.38,
  }),
  obsidian: Object.freeze({
    label: "OBSIDIAN",
    colors: { receiver: 0x171b1e, polymer: 0x252326, grip: 0x17191b, rail: 0x41464a, accent: 0xb18a50 },
    roughness: 0.34,
    metalness: 0.72,
  }),
  ember: Object.freeze({
    label: "EMBERLINE",
    colors: { receiver: 0x332927, polymer: 0x252222, grip: 0x302725, rail: 0x62514a, accent: 0xb95e38 },
    roughness: 0.56,
    metalness: 0.46,
  }),
});

function createRadialTexture(innerColor, outerColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.34, outerColor);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addBox(parent, size, position, material, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent,
  radiusTop,
  radiusBottom,
  length,
  position,
  material,
  rotation = [Math.PI / 2, 0, 0],
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 12),
    material,
  );
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function buildAssaultRifle(root, materials) {
  const { receiver, polymer, grip, rail, accent, glass } = materials;
  addBox(root, [0.22, 0.18, 0.48], [0, 0, 0.08], receiver);
  addBox(root, [0.19, 0.07, 0.4], [0, 0.115, 0.035], rail);
  addBox(root, [0.19, 0.15, 0.46], [0, 0.005, -0.39], polymer);
  addBox(root, [0.17, 0.12, 0.37], [0, 0, 0.43], polymer);
  addBox(root, [0.21, 0.22, 0.055], [0, 0, 0.62], grip);
  addBox(root, [0.17, 0.09, 0.24], [0, -0.045, 0.69], accent);
  addCylinder(root, 0.027, 0.027, 0.51, [0, 0.015, -0.86], rail);
  addCylinder(root, 0.044, 0.038, 0.12, [0, 0.015, -1.17], receiver);
  addBox(root, [0.14, 0.13, 0.34], [0, -0.215, -0.01], polymer, [0.08, 0, 0]);
  addBox(root, [0.13, 0.15, 0.16], [0, -0.205, 0.19], grip, [-0.18, 0, 0]);
  addBox(root, [0.105, 0.23, 0.13], [0, -0.23, 0.22], polymer, [-0.16, 0, 0]);
  addBox(root, [0.16, 0.045, 0.21], [0, 0.108, -0.38], rail);
  addCylinder(root, 0.052, 0.052, 0.19, [0, 0.192, 0.025], receiver);
  addCylinder(root, 0.036, 0.036, 0.012, [0, 0.192, -0.076], glass);
  addBox(root, [0.12, 0.045, 0.16], [0, 0.16, -0.34], accent);

  for (let index = 0; index < 8; index += 1) {
    addBox(root, [0.24, 0.018, 0.018], [0, 0.102, -0.53 + index * 0.045], rail);
  }
  for (const side of [-1, 1]) {
    for (let index = 0; index < 5; index += 1) {
      addBox(root, [0.012, 0.035, 0.025], [side * 0.098, 0.015, -0.53 + index * 0.075], receiver);
    }
    addCylinder(root, 0.022, 0.022, 0.018, [side * 0.116, 0.045, 0.13], rail, [0, 0, Math.PI / 2]);
    addBox(root, [0.018, 0.038, 0.085], [side * 0.12, 0.025, -0.005], accent);
  }

  addBox(root, [0.035, 0.08, 0.07], [0, 0.165, -0.8], rail);
  addBox(root, [0.035, 0.11, 0.055], [0, 0.17, -0.04], rail);
  addBox(root, [0.045, 0.065, 0.08], [0.125, 0.13, 0.11], rail);
  addBox(root, [0.1, 0.045, 0.04], [0, -0.11, 0.19], rail);
  const trigger = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 14), rail);
  trigger.position.set(0, -0.105, 0.22);
  root.add(trigger);
  addBox(root, [0.025, 0.12, 0.035], [0, -0.19, 0.22], receiver, [0.18, 0, 0]);
}

function buildSniperRifle(root, materials) {
  const { receiver, polymer, grip, rail, accent, glass } = materials;
  addBox(root, [0.22, 0.18, 0.42], [0, 0, 0.1], receiver);
  addBox(root, [0.18, 0.14, 0.7], [0, 0.005, -0.47], polymer);
  addBox(root, [0.16, 0.12, 0.38], [0, 0, 0.49], accent);
  addBox(root, [0.2, 0.16, 0.055], [0, 0, 0.68], grip);
  addBox(root, [0.12, 0.22, 0.16], [0, -0.2, 0.19], polymer, [-0.16, 0, 0]);
  addCylinder(root, 0.027, 0.027, 0.83, [0, 0.02, -1.2], rail);
  addCylinder(root, 0.046, 0.04, 0.15, [0, 0.02, -1.68], receiver);
  addBox(root, [0.2, 0.04, 0.42], [0, 0.12, -0.3], rail);

  addCylinder(root, 0.064, 0.064, 0.36, [0, 0.23, -0.02], receiver);
  addCylinder(root, 0.05, 0.05, 0.025, [0, 0.23, -0.215], glass);
  addCylinder(root, 0.057, 0.057, 0.025, [0, 0.23, 0.17], rail);
  addBox(root, [0.08, 0.085, 0.12], [0, 0.155, -0.02], accent);
  addBox(root, [0.034, 0.09, 0.06], [0, 0.16, -1.47], rail);
  addBox(root, [0.034, 0.1, 0.06], [0, 0.17, 0.08], rail);

  for (const side of [-1, 1]) {
    addCylinder(root, 0.015, 0.015, 0.38, [side * 0.1, -0.13, -0.64], rail, [0, 0, side * 0.12]);
    addCylinder(root, 0.02, 0.02, 0.12, [side * 0.13, 0.055, 0.13], accent, [0, 0, Math.PI / 2]);
  }
  addBox(root, [0.1, 0.035, 0.07], [0, -0.12, 0.17], rail);
}

function buildPistol(root, materials) {
  const { receiver, polymer, grip, rail, accent, glass } = materials;
  addBox(root, [0.17, 0.1, 0.37], [0, 0.055, -0.13], rail);
  addBox(root, [0.15, 0.075, 0.3], [0, -0.005, 0.055], receiver);
  addBox(root, [0.125, 0.24, 0.16], [0, -0.16, 0.12], grip, [-0.16, 0, 0]);
  addBox(root, [0.115, 0.17, 0.11], [0, -0.28, 0.15], polymer, [-0.12, 0, 0]);
  addCylinder(root, 0.023, 0.023, 0.3, [0, 0.025, -0.48], rail);
  addCylinder(root, 0.036, 0.033, 0.08, [0, 0.025, -0.67], receiver);
  addBox(root, [0.11, 0.04, 0.23], [0, 0.11, -0.18], receiver);
  addBox(root, [0.04, 0.035, 0.055], [0, 0.13, -0.34], rail);
  addBox(root, [0.035, 0.04, 0.055], [0, 0.13, 0.015], rail);
  addBox(root, [0.1, 0.03, 0.11], [0, -0.07, -0.02], accent);

  const trigger = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 6, 12), rail);
  trigger.position.set(0, -0.07, 0.16);
  root.add(trigger);
  addBox(root, [0.02, 0.09, 0.025], [0, -0.13, 0.15], receiver, [0.15, 0, 0]);
  addCylinder(root, 0.018, 0.018, 0.02, [0, 0.11, -0.31], glass);
}

function buildSmg(root, materials) {
  const { receiver, polymer, grip, rail, accent, glass } = materials;
  addBox(root, [0.2, 0.16, 0.38], [0, 0, 0.08], receiver);
  addBox(root, [0.18, 0.14, 0.37], [0, 0, -0.3], polymer);
  addBox(root, [0.16, 0.11, 0.29], [0, 0, 0.4], polymer);
  addBox(root, [0.17, 0.18, 0.045], [0, 0, 0.58], grip);
  addCylinder(root, 0.024, 0.024, 0.4, [0, 0.025, -0.69], rail);
  addCylinder(root, 0.038, 0.034, 0.1, [0, 0.025, -0.94], receiver);
  addBox(root, [0.13, 0.23, 0.13], [0, -0.19, 0.02], accent, [0.12, 0, 0]);
  addBox(root, [0.12, 0.2, 0.13], [0, -0.17, 0.18], grip, [-0.18, 0, 0]);
  addBox(root, [0.15, 0.04, 0.22], [0, 0.1, -0.25], rail);
  addBox(root, [0.12, 0.06, 0.16], [0, 0.16, 0.07], accent);
  addCylinder(root, 0.04, 0.04, 0.13, [0, 0.19, 0.07], receiver);
  addCylinder(root, 0.027, 0.027, 0.02, [0, 0.19, 0.0], glass);

  for (let index = 0; index < 6; index += 1) {
    addBox(root, [0.205, 0.016, 0.018], [0, 0.095, -0.43 + index * 0.045], rail);
  }
  for (const side of [-1, 1]) {
    for (let index = 0; index < 4; index += 1) {
      addBox(root, [0.012, 0.025, 0.035], [side * 0.093, 0.01, -0.41 + index * 0.085], receiver);
    }
  }
}

function buildShotgun(root, materials) {
  const { receiver, polymer, grip, rail, accent } = materials;
  addBox(root, [0.22, 0.17, 0.4], [0, 0, 0.1], receiver);
  addBox(root, [0.18, 0.13, 0.35], [0, 0.005, -0.35], polymer);
  addBox(root, [0.17, 0.14, 0.4], [0, 0, 0.44], accent);
  addBox(root, [0.2, 0.19, 0.05], [0, 0, 0.65], grip);
  addBox(root, [0.13, 0.24, 0.15], [0, -0.2, 0.19], grip, [-0.18, 0, 0]);
  addCylinder(root, 0.033, 0.033, 0.67, [0, 0.025, -0.87], rail);
  addCylinder(root, 0.048, 0.04, 0.14, [0, 0.025, -1.32], receiver);
  addCylinder(root, 0.038, 0.038, 0.62, [0, -0.075, -0.86], receiver);
  addBox(root, [0.19, 0.13, 0.3], [0, -0.035, -0.41], polymer);
  addBox(root, [0.18, 0.035, 0.2], [0, 0.115, -0.22], rail);
  addBox(root, [0.1, 0.04, 0.045], [0, 0.11, -1.17], accent);
  addBox(root, [0.13, 0.035, 0.06], [0, -0.12, 0.2], rail);

  for (let index = 0; index < 5; index += 1) {
    addBox(root, [0.19, 0.017, 0.025], [0, 0.095, -0.51 + index * 0.05], rail);
  }
  for (const side of [-1, 1]) {
    addBox(root, [0.015, 0.08, 0.11], [side * 0.1, -0.025, -0.4], accent);
  }
}

const MODEL_BUILDERS = {
  assaultRifle: buildAssaultRifle,
  sniperRifle: buildSniperRifle,
  pistol: buildPistol,
  smg: buildSmg,
  shotgun: buildShotgun,
};

export class WeaponSystem {
  constructor(camera) {
    this.camera = camera;
    this.materials = {
      receiver: new THREE.MeshStandardMaterial({
        color: 0x343b37,
        roughness: 0.56,
        metalness: 0.62,
      }),
      polymer: new THREE.MeshStandardMaterial({
        color: 0x252b27,
        roughness: 0.84,
        metalness: 0.08,
      }),
      grip: new THREE.MeshStandardMaterial({
        color: 0x303630,
        roughness: 0.96,
        metalness: 0.02,
      }),
      rail: new THREE.MeshStandardMaterial({
        color: 0x59615a,
        roughness: 0.52,
        metalness: 0.76,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x697146,
        roughness: 0.74,
        metalness: 0.18,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: 0x405e60,
        emissive: 0x102326,
        roughness: 0.22,
        metalness: 0.5,
      }),
    };
    this.shellGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.065, 7);
    this.shellMaterial = new THREE.MeshStandardMaterial({
      color: 0xc28b46,
      roughness: 0.38,
      metalness: 0.78,
    });

    this.models = new Map();
    for (const [weaponId, config] of Object.entries(WEAPON_CONFIGS)) {
      const root = new THREE.Group();
      root.name = `${weaponId}-viewmodel`;
      root.position.set(...config.viewPosition);
      root.rotation.set(0.035, -0.045, -0.02);
      camera.add(root);
      const materials = Object.fromEntries(
        Object.entries(this.materials).map(([name, material]) => [
          name,
          material.clone(),
        ]),
      );
      MODEL_BUILDERS[config.model](root, materials);
      const effects = this.buildEffects(root, config);
      root.visible = weaponId === "assaultRifle";
      this.models.set(weaponId, {
        root,
        effects,
        config,
        materials,
        skinId: "field",
      });
    }

    this.currentWeaponId = "assaultRifle";
    this.activeModel = this.models.get(this.currentWeaponId);
    this.root = this.activeModel.root;
    this.queuedWeaponId = null;
    this.transitionPhase = null;
    this.transitionElapsed = 0;
    this.isSwitching = false;
    this.time = 0;
    this.recoil = 0;
    this.keys = new Set();
    this.sway = new THREE.Vector2();
    this.swayTarget = new THREE.Vector2();

    this.onKeyDown = (event) => {
      if (MOVEMENT_KEYS.includes(event.code)) this.keys.add(event.code);
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onBlur = () => this.keys.clear();
    this.onMouseMove = (event) => {
      if (!document.pointerLockElement) return;
      this.swayTarget.x = THREE.MathUtils.clamp(
        this.swayTarget.x - event.movementX * 0.00055,
        -0.045,
        0.045,
      );
      this.swayTarget.y = THREE.MathUtils.clamp(
        this.swayTarget.y - event.movementY * 0.0004,
        -0.035,
        0.035,
      );
    };
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("mousemove", this.onMouseMove);
  }

  buildEffects(root, config) {
    const muzzlePosition = new THREE.Vector3(...config.muzzlePosition);
    const flash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialTexture(
          config.muzzleFlash.inner,
          config.muzzleFlash.outer,
        ),
        color: config.muzzleFlash.color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
    flash.position.copy(muzzlePosition);
    flash.scale.setScalar(config.muzzleFlash.size);
    flash.visible = false;
    root.add(flash);

    const light = new THREE.PointLight(
      config.muzzleFlash.color,
      0,
      2.2,
      2,
    );
    light.position.copy(muzzlePosition);
    root.add(light);

    const smokeTexture = createRadialTexture(
      "rgba(206, 211, 199, 0.48)",
      "rgba(156, 164, 154, 0.22)",
    );
    const smoke = Array.from({ length: config.muzzleFlash.smokeCount }, () => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: smokeTexture,
          color: 0xc3c6b9,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        }),
      );
      sprite.visible = false;
      root.add(sprite);
      return {
        sprite,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
      };
    });
    const shells = Array.from({ length: 8 }, () => {
      const mesh = new THREE.Mesh(this.shellGeometry, this.shellMaterial);
      mesh.visible = false;
      root.add(mesh);
      return {
        mesh,
        life: 0,
        velocity: new THREE.Vector3(),
        rotationVelocity: new THREE.Vector3(),
      };
    });

    return {
      flash,
      light,
      smoke,
      shells,
      muzzlePosition,
      flashTime: 0,
      config: config.muzzleFlash,
    };
  }

  setWeapon(weaponId) {
    if (!this.models.has(weaponId)) {
      throw new RangeError(`Unknown weapon model: ${weaponId}`);
    }

    if (this.transitionPhase) {
      if (this.transitionPhase === "lowering" && weaponId === this.currentWeaponId) {
        this.activeModel.root.position.set(...this.activeModel.config.viewPosition);
        this.queuedWeaponId = null;
        this.transitionPhase = null;
        this.transitionElapsed = 0;
        this.isSwitching = false;
        return true;
      }
      this.queuedWeaponId = weaponId;
      return true;
    }
    if (weaponId === this.currentWeaponId) return false;

    this.queuedWeaponId = weaponId;
    this.transitionPhase = "lowering";
    this.transitionElapsed = 0;
    this.isSwitching = true;
    this.recoil = 0;
    return true;
  }

  setSkin(weaponId, skinId) {
    const model = this.models.get(weaponId);
    const skin = WEAPON_SKINS[skinId];
    if (!model || !skin) {
      throw new RangeError(`Unknown weapon skin: ${weaponId}/${skinId}`);
    }

    for (const [materialName, color] of Object.entries(skin.colors)) {
      const material = model.materials[materialName];
      material.color.setHex(color);
      material.roughness = skin.roughness;
      material.metalness = skin.metalness;
      material.needsUpdate = true;
    }
    model.skinId = skinId;
  }

  createPreviewModel(weaponId) {
    const model = this.models.get(weaponId);
    if (!model) throw new RangeError(`Unknown weapon model: ${weaponId}`);
    const preview = model.root.clone(true);
    preview.visible = true;
    preview.position.set(-0.15, -0.02, -0.55);
    preview.scale.setScalar(1.55);
    return preview;
  }

  fire(recoil = this.activeModel.config.recoil) {
    if (this.isSwitching) return false;
    this.recoil = Math.min(1.35, this.recoil + recoil);
    const effects = this.activeModel.effects;
    effects.flashTime = effects.config.duration;
    effects.flash.visible = true;
    effects.flash.material.opacity = 0.96;
    effects.flash.material.rotation = Math.random() * Math.PI * 2;
    effects.light.intensity = effects.config.light;

    for (const particle of effects.smoke) {
      particle.life = 0.32 + Math.random() * 0.2;
      particle.maxLife = particle.life;
      particle.sprite.visible = true;
      particle.sprite.position.set(
        effects.muzzlePosition.x + (Math.random() - 0.5) * 0.06,
        effects.muzzlePosition.y + (Math.random() - 0.5) * 0.06,
        effects.muzzlePosition.z - Math.random() * 0.04,
      );
      particle.sprite.scale.setScalar(0.055 + Math.random() * 0.035);
      particle.sprite.material.opacity = 0.26 + Math.random() * 0.12;
      particle.velocity.set(
        (Math.random() - 0.5) * 0.2,
        0.12 + Math.random() * 0.16,
        -0.28 - Math.random() * 0.2,
      );
    }
    const shell = effects.shells.find((entry) => entry.life <= 0);
    if (shell) {
      shell.life = 0.58;
      shell.mesh.visible = true;
      shell.mesh.position.set(0.19 + Math.random() * 0.035, 0.055, -0.3);
      shell.mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      shell.velocity.set(
        0.78 + Math.random() * 0.5,
        1.05 + Math.random() * 0.6,
        -0.2 - Math.random() * 0.45,
      );
      shell.rotationVelocity.set(
        9 + Math.random() * 8,
        5 + Math.random() * 8,
        7 + Math.random() * 9,
      );
    }
    return true;
  }

  updateEffects(effects, delta) {
    effects.flashTime = Math.max(0, effects.flashTime - delta);
    effects.flash.visible = effects.flashTime > 0;
    effects.flash.material.opacity = effects.flashTime > 0
      ? THREE.MathUtils.clamp(effects.flashTime / effects.config.duration, 0, 1)
      : 0;
    effects.light.intensity = effects.flashTime > 0 ? effects.config.light : 0;

    for (const particle of effects.smoke) {
      if (particle.life <= 0) continue;
      particle.life = Math.max(0, particle.life - delta);
      particle.sprite.position.addScaledVector(particle.velocity, delta);
      particle.sprite.scale.multiplyScalar(1 + delta * 1.1);
      particle.sprite.material.opacity = 0.3 * (particle.life / particle.maxLife);
      if (particle.life === 0) particle.sprite.visible = false;
    }
    for (const shell of effects.shells) {
      if (shell.life <= 0) continue;
      shell.life = Math.max(0, shell.life - delta);
      shell.velocity.y -= 4.2 * delta;
      shell.mesh.position.addScaledVector(shell.velocity, delta);
      shell.mesh.rotation.x += shell.rotationVelocity.x * delta;
      shell.mesh.rotation.y += shell.rotationVelocity.y * delta;
      shell.mesh.rotation.z += shell.rotationVelocity.z * delta;
      if (shell.life === 0) shell.mesh.visible = false;
    }
  }

  updateTransition(delta) {
    if (!this.transitionPhase) return 0;
    this.transitionElapsed += delta;
    const progress = THREE.MathUtils.clamp(
      this.transitionElapsed / SWITCH_DURATION,
      0,
      1,
    );

    if (this.transitionPhase === "lowering") {
      if (progress < 1) return -SWITCH_DROP * progress;

      this.activeModel.root.visible = false;
      this.currentWeaponId = this.queuedWeaponId;
      this.activeModel = this.models.get(this.currentWeaponId);
      this.root = this.activeModel.root;
      this.activeModel.root.visible = true;
      this.queuedWeaponId = null;
      this.transitionPhase = "raising";
      this.transitionElapsed = 0;
      return -SWITCH_DROP;
    }

    if (progress < 1) return -SWITCH_DROP * (1 - progress);
    this.transitionPhase = null;
    this.transitionElapsed = 0;
    this.isSwitching = false;

    if (this.queuedWeaponId && this.queuedWeaponId !== this.currentWeaponId) {
      this.transitionPhase = "lowering";
      this.transitionElapsed = 0;
      this.isSwitching = true;
    }
    this.queuedWeaponId = null;
    return 0;
  }

  update(delta) {
    this.time += delta;
    const switchOffset = this.updateTransition(delta);
    const locked = Boolean(document.pointerLockElement);
    const moving = locked && MOVEMENT_KEYS.some((key) => this.keys.has(key));
    const walkPhase = this.time * 9.2;
    const walkBob = Math.sin(walkPhase) * 0.012 * Number(moving);
    const walkSway = Math.cos(walkPhase * 0.5) * 0.009 * Number(moving);
    const idleBob = Math.sin(this.time * 1.65) * 0.003;
    const blend = 1 - Math.exp(-13 * delta);

    this.sway.lerp(this.swayTarget, blend);
    this.swayTarget.multiplyScalar(Math.exp(-7 * delta));
    this.recoil = Math.max(0, this.recoil - 5.5 * delta);

    const position = this.activeModel.config.viewPosition;
    this.activeModel.root.position.set(
      position[0] + this.sway.x + walkSway,
      position[1] + idleBob + walkBob * 0.62 + switchOffset,
      position[2] + this.recoil * 0.075,
    );
    this.activeModel.root.rotation.set(
      0.035 + this.recoil * 0.13 + this.sway.y * 0.45 + walkBob * 0.32,
      -0.045 + this.sway.x * 0.72,
      -0.02 - this.sway.x * 0.62 - walkSway * 0.5,
    );

    for (const model of this.models.values()) {
      this.updateEffects(model.effects, delta);
    }
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("mousemove", this.onMouseMove);

    const geometries = new Set([this.shellGeometry]);
    const materials = new Set(Object.values(this.materials));
    const textures = new Set();
    for (const { root } of this.models.values()) {
      root.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material)
          ? object.material
          : object.material ? [object.material] : [];
        for (const material of objectMaterials) {
          materials.add(material);
          if (material.map) textures.add(material.map);
        }
      });
      root.removeFromParent();
    }
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    this.models.clear();
  }
}
