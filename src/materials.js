import * as THREE from "three";

function makeNoiseTexture(base, options = {}) {
  const { size = 512, variation = 30, fibers = false } = options;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  const [red, green, blue] = base;

  for (let index = 0; index < image.data.length; index += 4) {
    const noise = (Math.random() - 0.5) * variation;
    image.data[index] = Math.max(0, Math.min(255, red + noise));
    image.data[index + 1] = Math.max(0, Math.min(255, green + noise));
    image.data[index + 2] = Math.max(0, Math.min(255, blue + noise));
    image.data[index + 3] = 255;
  }

  context.putImageData(image, 0, 0);

  if (fibers) {
    for (let index = 0; index < 85; index += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const length = 8 + Math.random() * 70;
      context.strokeStyle = `rgba(18, 19, 16, ${0.025 + Math.random() * 0.07})`;
      context.lineWidth = 0.5 + Math.random() * 1.5;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + length * (Math.random() - 0.5), y + length);
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function createMaterials() {
  const concreteMap = makeNoiseTexture([112, 111, 101], { variation: 34, fibers: true });
  const asphaltMap = makeNoiseTexture([72, 76, 72], { variation: 28 });
  const metalMap = makeNoiseTexture([101, 111, 104], { variation: 24, fibers: true });
  const rustMap = makeNoiseTexture([127, 83, 55], { variation: 26, fibers: true });
  const sandMap = makeNoiseTexture([153, 139, 111], { variation: 24, fibers: true });

  asphaltMap.repeat.set(18, 18);
  concreteMap.repeat.set(2, 2);
  metalMap.repeat.set(1, 1);
  rustMap.repeat.set(1, 1);
  sandMap.repeat.set(1, 1);

  const materials = {
    asphalt: new THREE.MeshStandardMaterial({
      map: asphaltMap,
      roughness: 0.96,
      color: 0xb9bdb3,
    }),
    concrete: new THREE.MeshStandardMaterial({
      map: concreteMap,
      roughness: 0.94,
      color: 0xbab9a9,
    }),
    concreteDark: new THREE.MeshStandardMaterial({
      map: concreteMap,
      roughness: 0.95,
      color: 0x77796f,
    }),
    metal: new THREE.MeshStandardMaterial({
      map: metalMap,
      roughness: 0.72,
      metalness: 0.24,
      color: 0xb2b9ae,
    }),
    containerBlue: new THREE.MeshStandardMaterial({
      map: metalMap,
      roughness: 0.66,
      metalness: 0.28,
      color: 0x557578,
    }),
    containerOxide: new THREE.MeshStandardMaterial({
      map: rustMap,
      roughness: 0.78,
      metalness: 0.18,
      color: 0xb47c53,
    }),
    sand: new THREE.MeshStandardMaterial({
      map: sandMap,
      roughness: 1,
      color: 0xd2c3a2,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x353b38,
      roughness: 0.82,
      metalness: 0.38,
    }),
    paintYellow: new THREE.MeshStandardMaterial({
      color: 0xc3a851,
      roughness: 0.88,
    }),
    paintWhite: new THREE.MeshStandardMaterial({
      color: 0xd8d5c7,
      roughness: 0.92,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x283c3b,
      roughness: 0.3,
      metalness: 0.35,
      emissive: 0x0d1816,
    }),
  };

  const metalSurfaces = new Set(["metal", "darkMetal", "containerBlue", "containerOxide"]);
  for (const [name, material] of Object.entries(materials)) {
    material.userData.surfaceType = name === "glass"
      ? "glass"
      : metalSurfaces.has(name)
        ? "metal"
        : name === "asphalt" || name === "sand"
          ? "dirt"
          : "concrete";
  }

  return materials;
}
