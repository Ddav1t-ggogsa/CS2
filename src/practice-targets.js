import * as THREE from "three";

const TARGET_HEIGHT = 1.05;
const TARGET_HEALTH = 50;
const TARGET_RESET_DELAY = 0.7;
const TARGET_POSITIONS = [
  [-12, 30, false],
  [-6, 34, true],
  [0, 30, false],
  [6, 34, true],
  [12, 30, false],
];

function makeTarget(index, position, moving, onHit) {
  const root = new THREE.Group();
  root.name = `practice-target-${index + 1}`;
  root.position.set(position[0], 0, position[1]);
  root.userData.isEnemy = true;
  root.userData.active = true;
  root.userData.health = TARGET_HEALTH;
  root.userData.maxHealth = TARGET_HEALTH;
  root.userData.practiceTarget = true;

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.75, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x343b37, metalness: 0.68, roughness: 0.48 }),
  );
  backing.position.y = 0.875;
  backing.castShadow = true;
  root.add(backing);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 1.08, 0.13),
    new THREE.MeshStandardMaterial({
      color: moving ? 0x8c5142 : 0x637052,
      roughness: 0.76,
      metalness: 0.08,
    }),
  );
  board.position.set(0, TARGET_HEIGHT, 0.13);
  board.castShadow = true;
  root.add(board);

  for (const [radius, color] of [[0.35, 0xd5d8c8], [0.23, 0xc98a56], [0.1, 0xe6e1ca]]) {
    const ring = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 24),
      new THREE.MeshStandardMaterial({ color, roughness: 0.65, side: THREE.DoubleSide }),
    );
    ring.position.set(0, TARGET_HEIGHT, 0.201);
    ring.userData.surfaceType = "metal";
    root.add(ring);
  }

  root.userData.baseX = position[0];
  root.userData.moving = moving;
  root.userData.phase = index * 1.4;
  root.userData.resetRemaining = 0;
  root.addEventListener("damage", (event) => {
    if (root.userData.health > 0) return;
    root.userData.active = false;
    root.userData.resetRemaining = TARGET_RESET_DELAY;
    root.visible = false;
    onHit(root, event);
  });
  return root;
}

export class PracticeTargets {
  constructor(scene, onHit = () => {}) {
    this.group = new THREE.Group();
    this.group.name = "practice-targets";
    this.targets = TARGET_POSITIONS.map((entry, index) => {
      const target = makeTarget(index, entry, entry[2], onHit);
      this.group.add(target);
      return target;
    });
    scene.add(this.group);
    this.setEnabled(false);
  }

  setEnabled(enabled) {
    this.group.visible = Boolean(enabled);
  }

  reset() {
    for (const target of this.targets) {
      target.userData.health = TARGET_HEALTH;
      target.userData.active = true;
      target.userData.resetRemaining = 0;
      target.visible = true;
      target.position.x = target.userData.baseX;
    }
  }

  update(delta) {
    for (const target of this.targets) {
      if (!target.userData.active) {
        target.userData.resetRemaining = Math.max(0, target.userData.resetRemaining - delta);
        if (target.userData.resetRemaining === 0) {
          target.userData.health = TARGET_HEALTH;
          target.userData.active = true;
          target.visible = true;
        }
        continue;
      }

      if (target.userData.moving) {
        target.position.x = target.userData.baseX +
          Math.sin(performance.now() * 0.0012 + target.userData.phase) * 3.2;
      }
    }
  }
}
