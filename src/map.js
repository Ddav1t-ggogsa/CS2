import * as THREE from "three";
import { createMaterials } from "./materials.js";

function addBox(parent, materials, dimensions, position, material, options = {}) {
  const geometry = new THREE.BoxGeometry(...dimensions);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  parent.add(mesh);
  return mesh;
}

function addCollider(parent, dimensions, position) {
  const [x, y, z] = position;
  parent.userData.colliders.push(
    new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(...dimensions),
    ),
  );
}

function addCylinder(parent, radiusTop, radiusBottom, height, position, material, segments = 10) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addWarehouse(parent, materials, position, dimensions, variant = 0) {
  const [width, height, depth] = dimensions;
  const [x, y, z] = position;
  addCollider(parent, dimensions, position);
  const wallMaterial = variant === 0 ? materials.concrete : materials.concreteDark;
  addBox(parent, materials, dimensions, position, wallMaterial);
  addBox(
    parent,
    materials,
    [width + 1.5, 0.65, depth + 1.5],
    [x, y + height / 2 + 0.2, z],
    materials.darkMetal,
  );

  const frontZ = z + depth / 2 + 0.045;
  const doorWidth = Math.min(5.4, width * 0.31);
  addBox(
    parent,
    materials,
    [doorWidth, height * 0.63, 0.12],
    [x, y - height * 0.16, frontZ],
    materials.darkMetal,
  );
  for (let side = -1; side <= 1; side += 2) {
    const windowX = x + side * width * 0.32;
    addBox(
      parent,
      materials,
      [Math.min(3.2, width * 0.17), 1.15, 0.09],
      [windowX, y + height * 0.2, frontZ + 0.025],
      materials.glass,
    );
    addBox(
      parent,
      materials,
      [Math.min(3.5, width * 0.18), 0.11, 0.2],
      [windowX, y + height * 0.2 - 0.68, frontZ + 0.08],
      materials.darkMetal,
    );
  }

  for (let index = -2; index <= 2; index += 1) {
    const ribX = x + (index * width) / 5;
    addBox(
      parent,
      materials,
      [0.12, height * 0.34, 0.15],
      [ribX, y - height * 0.31, frontZ + 0.06],
      materials.darkMetal,
      { castShadow: false },
    );
  }

  for (let index = 0; index < 3; index += 1) {
    const ventX = x - width * 0.3 + index * width * 0.3;
    addBox(
      parent,
      materials,
      [1.35, 0.22, 0.18],
      [ventX, y + height * 0.35 - index * 0.42, frontZ + 0.06],
      materials.darkMetal,
    );
  }
}

function addContainer(parent, materials, position, dimensions, material) {
  const [width, height, depth] = dimensions;
  const [x, y, z] = position;
  addCollider(parent, dimensions, position);
  addBox(parent, materials, dimensions, position, material);

  const ribCount = Math.max(8, Math.floor(width * 2.2));
  for (let rib = 0; rib < ribCount; rib += 1) {
    const ribX = x - width / 2 + ((rib + 0.5) * width) / ribCount;
    addBox(
      parent,
      materials,
      [0.075, height - 0.22, depth + 0.08],
      [ribX, y, z],
      materials.darkMetal,
      { castShadow: false },
    );
  }

  const endZ = z + depth / 2 + 0.06;
  addBox(
    parent,
    materials,
    [width - 0.24, height - 0.2, 0.11],
    [x, y, endZ],
    material,
  );
  for (let rib = 0; rib < 6; rib += 1) {
    const ribX = x - width * 0.42 + rib * width * 0.168;
    addBox(
      parent,
      materials,
      [0.1, height - 0.3, 0.14],
      [ribX, y, endZ + 0.08],
      materials.darkMetal,
      { castShadow: false },
    );
  }
  for (let corner = -1; corner <= 1; corner += 2) {
    addBox(
      parent,
      materials,
      [0.22, height, 0.22],
      [x + corner * (width / 2 - 0.12), y, endZ + 0.12],
      materials.darkMetal,
    );
  }
}

function addBarrier(parent, materials, position, width, material = materials.concrete) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2 - 0.08, 0.55);
  shape.lineTo(width / 2 - 0.34, 1.12);
  shape.lineTo(-width / 2 + 0.34, 1.12);
  shape.lineTo(-width / 2 + 0.08, 0.55);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.7,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.06,
    bevelThickness: 0.05,
  });
  geometry.translate(0, 0, -0.35);
  const barrier = new THREE.Mesh(geometry, material);
  barrier.position.set(...position);
  barrier.castShadow = true;
  barrier.receiveShadow = true;
  parent.add(barrier);
  addCollider(
    parent,
    [width + 0.12, 1.3, 0.82],
    [position[0], position[1] + 0.61, position[2]],
  );

  for (let index = -1; index <= 1; index += 1) {
    addBox(
      parent,
      materials,
      [0.72, 0.16, 0.76],
      [position[0] + index * (width / 3), position[1] + 0.65, position[2]],
      index === 0 ? materials.paintYellow : materials.concreteDark,
      { castShadow: false },
    );
  }
}

function addPalletStack(parent, materials, position) {
  const [x, y, z] = position;
  addCollider(parent, [1.4, 1.8, 1.2], [x, y + 0.9, z]);
  for (let level = 0; level < 3; level += 1) {
    const offset = level % 2 === 0 ? -0.05 : 0.05;
    addBox(
      parent,
      materials,
      [1.3, 0.55, 1.1],
      [x + offset, y + 0.28 + level * 0.59, z],
      materials.sand,
    );
    for (let slat = -1; slat <= 1; slat += 1) {
      addBox(
        parent,
        materials,
        [0.11, 0.62, 1.13],
        [x + offset + slat * 0.45, y + 0.28 + level * 0.59, z],
        materials.concreteDark,
      );
    }
  }
}

function addStreetLamp(parent, materials, position) {
  const [x, y, z] = position;
  addCylinder(parent, 0.09, 0.14, 6.2, [x, y + 3.1, z], materials.darkMetal, 8);
  addCollider(parent, [0.28, 6.2, 0.28], [x, y + 3.1, z]);
  addBox(
    parent,
    materials,
    [1.5, 0.12, 0.12],
    [x + 0.62, y + 6.05, z],
    materials.darkMetal,
  );
  addBox(
    parent,
    materials,
    [0.7, 0.16, 0.34],
    [x + 1.2, y + 5.96, z],
    materials.paintYellow,
  );
}

export function createMap() {
  const root = new THREE.Group();
  root.userData.colliders = [];
  const materials = createMaterials();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    materials.asphalt,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  ground.receiveShadow = true;
  root.add(ground);

  const boundaryMaterial = materials.concreteDark;
  addBox(root, materials, [114, 7, 3], [0, 3.5, -63], boundaryMaterial);
  addCollider(root, [114, 7, 3], [0, 3.5, -63]);
  addBox(root, materials, [3, 7, 114], [-57, 3.5, -6], boundaryMaterial);
  addCollider(root, [3, 7, 114], [-57, 3.5, -6]);
  addBox(root, materials, [3, 7, 114], [57, 3.5, -6], boundaryMaterial);
  addCollider(root, [3, 7, 114], [57, 3.5, -6]);
  addBox(root, materials, [114, 7, 3], [0, 3.5, 51], boundaryMaterial);
  addCollider(root, [114, 7, 3], [0, 3.5, 51]);

  addWarehouse(root, materials, [2, 7, -47], [27, 14, 19], 0);
  addWarehouse(root, materials, [40, 4.7, -16], [18, 9.4, 17], 1);
  addWarehouse(root, materials, [-40, 3.8, -24], [17, 7.6, 15], 0);
  addWarehouse(root, materials, [-34, 3.5, 22], [20, 7, 15], 1);

  addContainer(
    root,
    materials,
    [-31, 1.4, -4],
    [13, 2.8, 2.8],
    materials.containerBlue,
  );
  addContainer(
    root,
    materials,
    [-31, 4.25, -4],
    [13, 2.8, 2.8],
    materials.containerOxide,
  );
  addContainer(
    root,
    materials,
    [31, 1.4, 12],
    [12, 2.8, 2.8],
    materials.containerOxide,
  );
  addContainer(
    root,
    materials,
    [31, 4.25, 12],
    [12, 2.8, 2.8],
    materials.containerBlue,
  );
  addContainer(
    root,
    materials,
    [14, 1.35, -12],
    [10, 2.7, 2.7],
    materials.containerBlue,
  );
  addContainer(
    root,
    materials,
    [-12, 1.35, 14],
    [10, 2.7, 2.7],
    materials.containerOxide,
  );

  addBarrier(root, materials, [-20, 0, 13], 8);
  addBarrier(root, materials, [0, 0, -1], 9, materials.concreteDark);
  addBarrier(root, materials, [21, 0, -27], 8);
  addBarrier(root, materials, [-38, 0, -44], 7);
  addBarrier(root, materials, [39, 0, 31], 7);

  addPalletStack(root, materials, [10, 0.03, 27]);
  addPalletStack(root, materials, [-45, 0.03, -5]);
  addPalletStack(root, materials, [44, 0.03, -37]);

  addStreetLamp(root, materials, [-21, 0, 37]);
  addStreetLamp(root, materials, [21, 0, 37]);
  addStreetLamp(root, materials, [-46, 0, 4]);
  addStreetLamp(root, materials, [47, 0, -33]);

  for (let index = 0; index < 8; index += 1) {
    const z = 45 - index * 13;
    addBox(
      root,
      materials,
      [0.16, 3.5, 0.16],
      [-55, 1.75, z],
      materials.darkMetal,
    );
    addCollider(root, [0.16, 3.5, 0.16], [-55, 1.75, z]);
    addBox(
      root,
      materials,
      [0.16, 3.5, 0.16],
      [55, 1.75, z],
      materials.darkMetal,
    );
    addCollider(root, [0.16, 3.5, 0.16], [55, 1.75, z]);
  }

  for (let index = 0; index < 10; index += 1) {
    const laneStripe = addBox(
      root,
      materials,
      [0.18, 0.025, 2.5],
      [0, -0.045, 40 - index * 7],
      materials.paintWhite,
      { castShadow: false },
    );
    laneStripe.receiveShadow = false;
  }

  for (const [x, z, width, depth] of [
    [-25, 34, 4.5, 0.18],
    [-25, 31, 4.5, 0.18],
    [25, 34, 4.5, 0.18],
    [25, 31, 4.5, 0.18],
    [-18, -32, 0.18, 4.5],
    [-15, -32, 0.18, 4.5],
    [18, 5, 0.18, 4.5],
    [21, 5, 0.18, 4.5],
  ]) {
    addBox(
      root,
      materials,
      [width, 0.025, depth],
      [x, -0.04, z],
      materials.paintYellow,
      { castShadow: false, receiveShadow: false },
    );
  }

  for (let index = 0; index < 6; index += 1) {
    const x = -7.5 + index * 3;
    addBox(
      root,
      materials,
      [0.13, 0.02, 4.2],
      [x, -0.035, -36],
      materials.paintYellow,
      { castShadow: false, receiveShadow: false },
    );
  }

  return root;
}
