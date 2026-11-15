import * as THREE from "three";

const AMBIENT_COUNT = 72;
const BURST_CAPACITY = 144;
const ELIMINATION_PARTICLE_COUNT = 22;
const LIGHT_POOL_SIZE = 2;

function createParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(16, 16, 1, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.72)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

export class VisualEffects {
  constructor(scene, anchor) {
    this.scene = scene;
    this.anchor = anchor;
    this.elapsed = 0;
    this.ambientGeometry = new THREE.BufferGeometry();
    this.ambientPositions = new Float32Array(AMBIENT_COUNT * 3);
    this.ambientVelocity = new Float32Array(AMBIENT_COUNT * 3);
    this.ambientMaterial = new THREE.PointsMaterial({
      color: 0xd5c29a,
      map: createParticleTexture(),
      size: 0.12,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.resetAmbientParticles();
    this.ambientGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.ambientPositions, 3),
    );
    this.ambientGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    this.ambientPoints = new THREE.Points(this.ambientGeometry, this.ambientMaterial);
    this.ambientPoints.frustumCulled = false;
    this.scene.add(this.ambientPoints);

    this.burstPositions = new Float32Array(BURST_CAPACITY * 3);
    this.burstColors = new Float32Array(BURST_CAPACITY * 3);
    this.burstGeometry = new THREE.BufferGeometry();
    this.burstGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.burstPositions, 3),
    );
    this.burstGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(this.burstColors, 3),
    );
    this.burstGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    this.burstGeometry.attributes.color.setUsage(THREE.DynamicDrawUsage);
    this.burstMaterial = new THREE.PointsMaterial({
      map: createParticleTexture(),
      size: 0.19,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.burstPoints = new THREE.Points(this.burstGeometry, this.burstMaterial);
    this.burstPoints.frustumCulled = false;
    this.scene.add(this.burstPoints);

    this.particles = Array.from({ length: BURST_CAPACITY }, (_, index) => {
      this.burstPositions[index * 3 + 1] = -10000;
      return {
        index,
        life: 0,
        maxLife: 0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
      };
    });
    this.nextParticle = 0;
    this.lights = Array.from({ length: LIGHT_POOL_SIZE }, () => {
      const light = new THREE.PointLight(0xff9a4a, 0, 5, 2);
      this.scene.add(light);
      return { light, life: 0, maxLife: 0, intensity: 0 };
    });
    this.nextLight = 0;
  }

  resetAmbientParticles() {
    for (let index = 0; index < AMBIENT_COUNT; index += 1) {
      const offset = index * 3;
      this.resetAmbientParticle(index, true);
      this.ambientVelocity[offset] = (Math.random() - 0.5) * 0.055;
      this.ambientVelocity[offset + 1] = (Math.random() - 0.5) * 0.035;
      this.ambientVelocity[offset + 2] = (Math.random() - 0.5) * 0.055;
    }
  }

  resetAmbientParticle(index, initial = false) {
    const offset = index * 3;
    const radius = initial ? 38 : 32;
    this.ambientPositions[offset] = this.anchor.x + (Math.random() * 2 - 1) * radius;
    this.ambientPositions[offset + 1] = 0.4 + Math.random() * 8;
    this.ambientPositions[offset + 2] = this.anchor.z + (Math.random() * 2 - 1) * radius;
  }

  spawnElimination(position, team = "red") {
    if (!position?.isVector3) return;
    const baseColor = new THREE.Color(team === "blue" ? 0x78b8f5 : 0xf18a52);
    const origin = position.clone().add(new THREE.Vector3(0, 0.95, 0));
    for (let count = 0; count < ELIMINATION_PARTICLE_COUNT; count += 1) {
      const particle = this.getFreeParticle();
      if (!particle) break;
      const direction = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() * 1.1 + 0.12,
        Math.random() - 0.5,
      ).normalize();
      const speed = 1.3 + Math.random() * 2.8;
      const color = baseColor.clone().lerp(
        new THREE.Color(0xffd18a),
        Math.random() * 0.42,
      );
      particle.position.copy(origin);
      particle.velocity.copy(direction).multiplyScalar(speed);
      particle.color.copy(color);
      particle.life = 0.28 + Math.random() * 0.36;
      particle.maxLife = particle.life;
      this.writeParticle(particle, 1);
    }
    this.spawnLight(origin, baseColor);
  }

  getFreeParticle() {
    for (let attempt = 0; attempt < this.particles.length; attempt += 1) {
      const index = (this.nextParticle + attempt) % this.particles.length;
      const particle = this.particles[index];
      if (particle.life > 0) continue;
      this.nextParticle = (index + 1) % this.particles.length;
      return particle;
    }
    return null;
  }

  writeParticle(particle, opacity) {
    const offset = particle.index * 3;
    this.burstPositions[offset] = particle.position.x;
    this.burstPositions[offset + 1] = particle.position.y;
    this.burstPositions[offset + 2] = particle.position.z;
    this.burstColors[offset] = particle.color.r * opacity;
    this.burstColors[offset + 1] = particle.color.g * opacity;
    this.burstColors[offset + 2] = particle.color.b * opacity;
  }

  spawnLight(position, color) {
    const entry = this.lights[this.nextLight];
    this.nextLight = (this.nextLight + 1) % this.lights.length;
    entry.light.position.copy(position);
    entry.light.color.copy(color);
    entry.life = 0.24;
    entry.maxLife = entry.life;
    entry.intensity = 2.6;
  }

  update(delta) {
    this.elapsed += delta;
    for (let index = 0; index < AMBIENT_COUNT; index += 1) {
      const offset = index * 3;
      this.ambientPositions[offset] += this.ambientVelocity[offset] * delta;
      this.ambientPositions[offset + 1] += this.ambientVelocity[offset + 1] * delta;
      this.ambientPositions[offset + 2] += this.ambientVelocity[offset + 2] * delta;
      const dx = this.ambientPositions[offset] - this.anchor.x;
      const dz = this.ambientPositions[offset + 2] - this.anchor.z;
      if (
        Math.abs(dx) > 42 ||
        Math.abs(dz) > 42 ||
        this.ambientPositions[offset + 1] > 9
      ) {
        this.resetAmbientParticle(index);
      }
    }
    this.ambientGeometry.attributes.position.needsUpdate = true;

    for (const particle of this.particles) {
      if (particle.life <= 0) continue;
      particle.life = Math.max(0, particle.life - delta);
      particle.velocity.y -= 3.8 * delta;
      particle.position.addScaledVector(particle.velocity, delta);
      if (particle.life === 0) {
        particle.position.set(0, -10000, 0);
        this.writeParticle(particle, 0);
      } else {
        this.writeParticle(particle, particle.life / particle.maxLife);
      }
    }
    this.burstGeometry.attributes.position.needsUpdate = true;
    this.burstGeometry.attributes.color.needsUpdate = true;

    for (const entry of this.lights) {
      if (entry.life <= 0) continue;
      entry.life = Math.max(0, entry.life - delta);
      entry.light.intensity = entry.intensity * (entry.life / entry.maxLife);
    }
  }

  dispose() {
    this.scene.remove(this.ambientPoints, this.burstPoints);
    for (const { light } of this.lights) this.scene.remove(light);
    this.ambientGeometry.dispose();
    this.burstGeometry.dispose();
    this.ambientMaterial.map?.dispose();
    this.ambientMaterial.dispose();
    this.burstMaterial.map?.dispose();
    this.burstMaterial.dispose();
  }
}
