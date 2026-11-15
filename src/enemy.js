import * as THREE from "three";

const GROUND_HEIGHT = -0.08;
const ENEMY_RADIUS = 0.38;
const ENEMY_HEIGHT = 1.85;
const ENEMY_HEALTH = 100;
const RESPAWN_DELAY = 5;
const WAYPOINT_SPACING = 3.5;
const GRID_DIRECTIONS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],              [1, 0],
  [-1, 1],  [0, 1],  [1, 1],
];

export const AI_DIFFICULTIES = Object.freeze({
  easy: Object.freeze({
    label: "EASY",
    detectionRadius: 19,
    chaseSpeed: 1.55,
    attackRange: 15,
    hitChance: 0.42,
    damage: 5,
    fireInterval: 1.55,
  }),
  normal: Object.freeze({
    label: "NORMAL",
    detectionRadius: 27,
    chaseSpeed: 2.05,
    attackRange: 21,
    hitChance: 0.68,
    damage: 8,
    fireInterval: 1.12,
  }),
  hard: Object.freeze({
    label: "HARD",
    detectionRadius: 35,
    chaseSpeed: 2.55,
    attackRange: 27,
    hitChance: 0.88,
    damage: 11,
    fireInterval: 0.82,
  }),
});

const SPAWN_POINTS = [
  [-15, 22],
  [15, 22],
  [-20, 0],
  [20, -15],
  [0, -25],
];

const ARMOR_PALETTES = [
  { armor: 0x525a4b, fabric: 0x303730, helmet: 0x424a3f, visor: 0xc99a56 },
  { armor: 0x56534a, fabric: 0x353733, helmet: 0x49483f, visor: 0x9cad85 },
  { armor: 0x4c5654, fabric: 0x2d3536, helmet: 0x404a49, visor: 0xc19a62 },
];

function horizontalDistanceSquared(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function createMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0.12,
    emissive: options.emissive ?? 0x000000,
  });
}

function addBox(parent, dimensions, position, material, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeHealthSprite(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 32;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    }),
  );
  sprite.scale.set(1.45, 0.24, 1);
  sprite.position.y = 2.18;

  return {
    sprite,
    canvas,
    texture,
    label,
  };
}

function drawHealthSprite(indicator, health, maxHealth) {
  const { canvas, texture, label } = indicator;
  const context = canvas.getContext("2d");
  const ratio = THREE.MathUtils.clamp(health / maxHealth, 0, 1);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(10, 14, 12, 0.84)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = "bold 13px monospace";
  context.fillStyle = "rgba(235, 239, 226, 0.92)";
  context.textBaseline = "middle";
  context.fillText(label, 6, 9);
  context.fillStyle = "rgba(225, 233, 217, 0.2)";
  context.fillRect(6, 18, canvas.width - 12, 8);
  context.fillStyle = ratio > 0.6 ? "#aeca79" : ratio > 0.3 ? "#d4aa5d" : "#df795f";
  context.fillRect(6, 18, (canvas.width - 12) * ratio, 8);
  context.strokeStyle = "rgba(225, 233, 217, 0.68)";
  context.lineWidth = 1;
  context.strokeRect(5.5, 17.5, canvas.width - 11, 9);
  texture.needsUpdate = true;
}

function createEnemyModel(index) {
  const palette = ARMOR_PALETTES[index % ARMOR_PALETTES.length];
  const materials = {
    armor: createMaterial(palette.armor, { roughness: 0.86 }),
    fabric: createMaterial(palette.fabric, { roughness: 0.98 }),
    helmet: createMaterial(palette.helmet, { roughness: 0.7 }),
    visor: createMaterial(palette.visor, {
      roughness: 0.28,
      metalness: 0.48,
      emissive: palette.visor,
    }),
    metal: createMaterial(0x282e2c, { metalness: 0.62, roughness: 0.54 }),
    straps: createMaterial(0x88784f, { roughness: 0.92 }),
  };
  const root = new THREE.Group();
  root.name = `training-bot-${String(index + 1).padStart(2, "0")}`;
  root.userData.isEnemy = true;
  root.userData.active = true;
  root.userData.health = ENEMY_HEALTH;
  root.userData.maxHealth = ENEMY_HEALTH;

  const body = new THREE.Group();
  root.add(body);
  addBox(body, [0.55, 0.3, 0.34], [0, 0.72, 0], materials.fabric);
  addBox(body, [0.62, 0.68, 0.38], [0, 1.12, 0], materials.armor);
  addBox(body, [0.19, 0.62, 0.16], [0, 1.1, -0.22], materials.straps);
  addBox(body, [0.67, 0.12, 0.42], [0, 0.83, 0.02], materials.straps);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.205, 16, 12),
    materials.fabric,
  );
  head.position.set(0, 1.64, 0.015);
  head.castShadow = true;
  body.add(head);
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.68),
    materials.helmet,
  );
  helmet.position.set(0, 1.72, 0.015);
  helmet.castShadow = true;
  body.add(helmet);
  addBox(body, [0.29, 0.075, 0.055], [0, 1.63, 0.205], materials.visor);

  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.18, 0.67, 0);
    body.add(leg);
    addBox(leg, [0.22, 0.48, 0.23], [0, -0.24, 0], materials.fabric);
    addBox(leg, [0.2, 0.25, 0.27], [0, -0.55, 0.035], materials.armor);
    addBox(leg, [0.24, 0.13, 0.36], [0, -0.6, 0.09], materials.metal);
    legs.push(leg);
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.37, 1.34, 0.035);
    body.add(arm);
    addBox(arm, [0.2, 0.44, 0.23], [side * 0.015, -0.21, 0.025], materials.armor);
    addBox(arm, [0.16, 0.23, 0.19], [side * 0.015, -0.52, 0.1], materials.fabric);
    arms.push(arm);
  }
  addBox(body, [0.095, 0.085, 0.72], [0.2, 1.0, 0.48], materials.metal);
  addBox(body, [0.15, 0.11, 0.26], [0.2, 1.01, 0.19], materials.armor);
  addBox(body, [0.075, 0.16, 0.18], [0.2, 0.87, 0.35], materials.fabric);

  const healthBar = makeHealthSprite(root.name.toUpperCase());
  root.add(healthBar.sprite);
  drawHealthSprite(healthBar, ENEMY_HEALTH, ENEMY_HEALTH);

  return {
    root,
    body,
    legs,
    arms,
    healthBar,
    materials: Object.values(materials),
    materialsByType: materials,
  };
}

class WaypointGrid {
  constructor(colliders) {
    this.colliders = colliders;
    this.minX = -52;
    this.minZ = -58;
    this.maxX = 52;
    this.maxZ = 46;
    this.columns = Math.floor((this.maxX - this.minX) / WAYPOINT_SPACING) + 1;
    this.rows = Math.floor((this.maxZ - this.minZ) / WAYPOINT_SPACING) + 1;
    this.nodes = [];
    this.validNodes = [];

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const x = this.minX + column * WAYPOINT_SPACING;
        const z = this.minZ + row * WAYPOINT_SPACING;
        const node = {
          row,
          column,
          x,
          z,
          blocked: this.isBlockedAt(x, z),
        };
        this.nodes.push(node);
        if (!node.blocked) this.validNodes.push(this.index(row, column));
      }
    }

    this.edges = Array.from({ length: this.nodes.length }, () => []);
    for (const index of this.validNodes) {
      const current = this.nodes[index];
      for (const [columnStep, rowStep] of GRID_DIRECTIONS) {
        const row = current.row + rowStep;
        const column = current.column + columnStep;
        if (row < 0 || row >= this.rows || column < 0 || column >= this.columns) continue;

        const nextIndex = this.index(row, column);
        const next = this.nodes[nextIndex];
        if (next.blocked) continue;
        if (columnStep !== 0 && rowStep !== 0) {
          if (
            this.nodes[this.index(current.row, column)].blocked ||
            this.nodes[this.index(row, current.column)].blocked
          ) {
            continue;
          }
        }
        if (this.segmentClear(current, next)) {
          this.edges[index].push({
            index: nextIndex,
            cost: columnStep !== 0 && rowStep !== 0 ? Math.SQRT2 : 1,
          });
        }
      }
    }
  }

  index(row, column) {
    return row * this.columns + column;
  }

  isBlockedAt(x, z) {
    const feet = GROUND_HEIGHT;
    const head = feet + ENEMY_HEIGHT;
    return this.colliders.some((box) => {
      if (feet >= box.max.y || head <= box.min.y) return false;
      const closestX = THREE.MathUtils.clamp(x, box.min.x, box.max.x);
      const closestZ = THREE.MathUtils.clamp(z, box.min.z, box.max.z);
      const dx = x - closestX;
      const dz = z - closestZ;
      return dx * dx + dz * dz < ENEMY_RADIUS * ENEMY_RADIUS;
    });
  }

  nearestNode(position) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;
    for (const index of this.validNodes) {
      const node = this.nodes[index];
      const dx = node.x - position.x;
      const dz = node.z - position.z;
      const distance = dx * dx + dz * dz;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }
    return nearestIndex;
  }

  segmentClear(from, to) {
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    const samples = Math.ceil(distance / 0.75);
    for (let sample = 1; sample < samples; sample += 1) {
      const amount = sample / samples;
      if (this.isBlockedAt(
        THREE.MathUtils.lerp(from.x, to.x, amount),
        THREE.MathUtils.lerp(from.z, to.z, amount),
      )) {
        return false;
      }
    }
    return true;
  }

  findPath(from, to) {
    const start = this.nearestNode(from);
    const goal = this.nearestNode(to);
    if (start < 0 || goal < 0) return [];
    if (start === goal) return [this.nodes[start]];

    const total = this.nodes.length;
    const costs = new Float64Array(total);
    costs.fill(Infinity);
    costs[start] = 0;
    const previous = new Int32Array(total);
    previous.fill(-1);
    const open = [start];
    const inOpen = new Uint8Array(total);
    const closed = new Uint8Array(total);
    inOpen[start] = 1;

    const heuristic = (index) => {
      const node = this.nodes[index];
      const target = this.nodes[goal];
      const dx = Math.abs(node.column - target.column);
      const dz = Math.abs(node.row - target.row);
      return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
    };

    while (open.length > 0) {
      let bestOpenIndex = 0;
      let bestScore = costs[open[0]] + heuristic(open[0]);
      for (let index = 1; index < open.length; index += 1) {
        const score = costs[open[index]] + heuristic(open[index]);
        if (score < bestScore) {
          bestScore = score;
          bestOpenIndex = index;
        }
      }

      const currentIndex = open.splice(bestOpenIndex, 1)[0];
      inOpen[currentIndex] = 0;
      if (currentIndex === goal) break;
      closed[currentIndex] = 1;

      for (const edge of this.edges[currentIndex]) {
        const nextIndex = edge.index;
        if (closed[nextIndex]) continue;
        const tentativeCost = costs[currentIndex] + edge.cost;
        if (tentativeCost >= costs[nextIndex]) continue;

        costs[nextIndex] = tentativeCost;
        previous[nextIndex] = currentIndex;
        if (!inOpen[nextIndex]) {
          open.push(nextIndex);
          inOpen[nextIndex] = 1;
        }
      }
    }

    if (previous[goal] < 0) return [];
    const path = [];
    for (let index = goal; index >= 0; index = previous[index]) {
      path.push(this.nodes[index]);
      if (index === start) break;
    }
    path.reverse();
    return path;
  }
}

export class EnemySystem {
  constructor({
    scene,
    map,
    player,
    playerHealth,
    playerDamage,
    mode = "deathmatch",
    onElimination = () => {},
    difficulty = "normal",
    onActiveCount = () => {},
  }) {
    this.scene = scene;
    this.map = map;
    this.player = player;
    this.playerHealth = playerHealth;
    this.playerDamage = playerDamage;
    this.mode = mode;
    this.onElimination = onElimination;
    this.playerTarget = { type: "player", id: "player", team: "blue" };
    this.onActiveCount = onActiveCount;
    this.difficulty = difficulty;
    this.navigation = new WaypointGrid(map.userData.colliders);
    this.enemyGroup = new THREE.Group();
    this.enemyGroup.name = "training-enemies";
    this.scene.add(this.enemyGroup);
    this.raycaster = new THREE.Raycaster();
    this.enemies = SPAWN_POINTS.map((point, index) => this.createEnemy(point, index));
    this.tracers = [];
    this.setMode(mode);
    this.notifyActiveCount();
  }

  get activeCount() {
    return this.enemies.filter((enemy) => enemy.active).length;
  }

  setDifficulty(difficulty) {
    if (!AI_DIFFICULTIES[difficulty]) {
      throw new RangeError(`Unknown AI difficulty: ${difficulty}`);
    }
    this.difficulty = difficulty;
  }

  setMode(mode) {
    this.mode = mode;
    this.enemyGroup.visible = mode !== "practice";
    for (const bot of this.enemies) {
      bot.team = mode === "teamDeathmatch" && bot.index < 2 ? "blue" : "red";
      bot.root.userData.team = bot.team;
      bot.materialsByType.armor.color.setHex(bot.team === "blue" ? 0x315e86 : 0x88473e);
      bot.materialsByType.helmet.color.setHex(bot.team === "blue" ? 0x263e59 : 0x64342f);
    }
  }

  reset() {
    for (const bot of this.enemies) {
      bot.root.position.copy(bot.spawn);
      bot.root.rotation.set(0, Math.random() * Math.PI * 2, 0);
      bot.body.rotation.set(0, 0, 0);
      bot.body.position.set(0, 0, 0);
      bot.root.userData.health = ENEMY_HEALTH;
      bot.root.userData.active = true;
      bot.healthBar.sprite.visible = true;
      drawHealthSprite(bot.healthBar, ENEMY_HEALTH, ENEMY_HEALTH);
      for (const material of bot.materials) {
        material.transparent = false;
        material.depthWrite = true;
        material.opacity = 1;
      }
      bot.active = true;
      bot.state = "patrol";
      bot.deathRemaining = 0;
      bot.respawnRemaining = 0;
      bot.hitRemaining = 0;
      bot.damageBy.clear();
      bot.lastHitSource = null;
      bot.target = null;
      bot.playerVisible = false;
      bot.perceptionRemaining = 0;
      bot.path = [];
      bot.pathGoal = null;
      bot.pathIndex = 0;
      bot.root.rotation.z = 0;
      if (bot.root.parent !== this.enemyGroup) this.enemyGroup.add(bot.root);
      this.assignPatrolPath(bot);
    }
    this.notifyActiveCount();
  }

  findTarget(bot, difficulty) {
    if (!this.playerHealth.isAlive) return null;
    if (this.mode === "deathmatch") {
      const position = this.player.camera.position;
      const distance = Math.sqrt(horizontalDistanceSquared(bot.root.position, position));
      return bot.team !== this.playerTarget.team &&
        distance <= difficulty.detectionRadius &&
        this.canSeePlayer(bot, position, distance)
        ? this.playerTarget
        : null;
    }

    if (this.mode !== "teamDeathmatch") return null;
    const candidates = this.enemies
      .filter((other) => other !== bot && other.active && other.team !== bot.team)
      .map((other) => ({ type: "bot", id: other.id, team: other.team, bot: other }));
    if (bot.team !== this.playerTarget.team) candidates.push(this.playerTarget);

    let nearest = null;
    let nearestDistance = difficulty.detectionRadius;
    for (const candidate of candidates) {
      const position = candidate.type === "player"
        ? this.player.camera.position
        : candidate.bot.root.position;
      const distance = Math.sqrt(horizontalDistanceSquared(bot.root.position, position));
      if (distance < nearestDistance && this.canSeePlayer(bot, position, distance)) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  createEnemy(spawnPoint, index) {
    const model = createEnemyModel(index);
    const spawn = new THREE.Vector3(spawnPoint[0], GROUND_HEIGHT, spawnPoint[1]);
    const safeIndex = this.navigation.nearestNode(spawn);
    const safeNode = this.navigation.nodes[safeIndex];
    const bot = {
      ...model,
      index,
      id: `bot-${index + 1}`,
      spawn,
      active: true,
      state: "patrol",
      path: [],
      pathIndex: 0,
      pathGoal: null,
      pathUpdateRemaining: 0,
      perceptionRemaining: Math.random() * 0.2,
      attackRemaining: 0.4 + Math.random() * 0.8,
      lastSeenRemaining: 0,
      lastSeenPosition: new THREE.Vector3(),
      hitRemaining: 0,
      hitLean: 0,
      deathRemaining: 0,
      respawnRemaining: 0,
      walkTime: Math.random() * Math.PI * 2,
      materials: model.materials,
      materialsByType: model.materialsByType,
      damageBy: new Map(),
    };
    bot.team = "red";
    bot.root.position.set(safeNode.x, GROUND_HEIGHT, safeNode.z);
    bot.spawn.set(safeNode.x, GROUND_HEIGHT, safeNode.z);
    bot.root.userData.team = bot.team;
    bot.root.addEventListener("damage", (event) => this.handleDamage(bot, event));
    this.enemyGroup.add(bot.root);
    this.assignPatrolPath(bot);
    return bot;
  }

  assignPath(bot, destination) {
    bot.path = this.navigation.findPath(bot.root.position, destination);
    bot.pathIndex = bot.path.length > 1 ? 1 : 0;
    bot.pathGoal = new THREE.Vector3(destination.x, GROUND_HEIGHT, destination.z);
    bot.pathUpdateRemaining = 0.8;
  }

  assignPatrolPath(bot) {
    let bestPath = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const index = this.navigation.validNodes[
        Math.floor(Math.random() * this.navigation.validNodes.length)
      ];
      const node = this.navigation.nodes[index];
      if (horizontalDistanceSquared(bot.root.position, node) < 100) continue;
      const path = this.navigation.findPath(bot.root.position, node);
      if (path.length > 1) {
        bestPath = path;
        break;
      }
    }
    bot.path = bestPath;
    bot.pathIndex = bestPath.length > 1 ? 1 : 0;
    bot.pathGoal = bestPath.length > 0
      ? new THREE.Vector3(bestPath[bestPath.length - 1].x, GROUND_HEIGHT, bestPath[bestPath.length - 1].z)
      : null;
    bot.pathUpdateRemaining = 1.2;
  }

  canSeePlayer(bot, targetPosition, distance) {
    if (distance < 0.5) return true;
    const origin = bot.root.position.clone();
    origin.y += 1.35;
    const direction = targetPosition.clone().sub(origin);
    const targetDistance = direction.length();
    direction.normalize();
    this.raycaster.set(origin, direction);
    this.raycaster.far = Math.max(0, targetDistance - 0.45);
    return this.raycaster.intersectObject(this.map, true).length === 0;
  }

  handleDamage(bot, event) {
    if (!bot.active) return;
    drawHealthSprite(bot.healthBar, bot.root.userData.health, ENEMY_HEALTH);
    bot.hitRemaining = 0.24;
    bot.hitLean = Math.random() < 0.5 ? -1 : 1;
    if (event.attacker?.id && event.attacker.team !== bot.team) {
      bot.damageBy.set(event.attacker.id, event.attacker.team);
      bot.lastHitSource = event.attacker;
    }
    if (bot.root.userData.health <= 0) this.beginDeath(bot);
  }

  beginDeath(bot) {
    if (!bot.active) return;
    bot.active = false;
    bot.state = "dying";
    bot.root.userData.active = false;
    bot.deathRemaining = 0.72;
    bot.deathDirection = Math.random() < 0.5 ? -1 : 1;
    bot.healthBar.sprite.visible = false;
    const killer = bot.lastHitSource;
    if (killer) {
      this.onElimination({
        killerId: killer.id,
        killerTeam: killer.team,
        victimId: bot.id,
        victimTeam: bot.team,
        position: bot.root.position.clone(),
        assists: [...bot.damageBy.keys()].filter((id) => id !== killer.id),
      });
    }
    this.notifyActiveCount();
  }

  finishDeath(bot) {
    bot.root.removeFromParent();
    bot.state = "respawning";
    bot.respawnRemaining = RESPAWN_DELAY;
  }

  respawn(bot) {
    bot.root.position.copy(bot.spawn);
    bot.root.rotation.set(0, Math.random() * Math.PI * 2, 0);
    bot.body.rotation.set(0, 0, 0);
    bot.body.position.set(0, 0, 0);
    bot.root.userData.health = ENEMY_HEALTH;
    bot.root.userData.active = true;
    bot.healthBar.sprite.visible = true;
    drawHealthSprite(bot.healthBar, ENEMY_HEALTH, ENEMY_HEALTH);
    for (const material of bot.materials) {
      material.transparent = false;
      material.depthWrite = true;
      material.opacity = 1;
    }
    bot.active = true;
    bot.state = "patrol";
    bot.path = [];
    bot.pathGoal = null;
    bot.pathIndex = 0;
    bot.hitRemaining = 0;
    bot.damageBy.clear();
    bot.lastHitSource = null;
    bot.target = null;
    bot.playerVisible = false;
    bot.perceptionRemaining = 0;
    bot.root.rotation.z = 0;
    this.enemyGroup.add(bot.root);
    bot.root.updateMatrixWorld(true);
    this.assignPatrolPath(bot);
    this.notifyActiveCount();
  }

  moveAlongPath(bot, delta, speed) {
    while (bot.pathIndex < bot.path.length) {
      const waypoint = bot.path[bot.pathIndex];
      const dx = waypoint.x - bot.root.position.x;
      const dz = waypoint.z - bot.root.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.42) {
        bot.pathIndex += 1;
        continue;
      }

      const step = Math.min(distance, speed * delta);
      const nextX = bot.root.position.x + (dx / distance) * step;
      const nextZ = bot.root.position.z + (dz / distance) * step;
      if (this.navigation.isBlockedAt(nextX, nextZ)) {
        bot.path = [];
        bot.pathIndex = 0;
        bot.pathUpdateRemaining = 0;
        return;
      }

      bot.root.position.x = nextX;
      bot.root.position.z = nextZ;
      return;
    }
  }

  fireAtTarget(bot, target, targetPosition, difficulty) {
    const origin = bot.root.position.clone();
    origin.y += 1.18;
    origin.x += Math.sin(bot.root.rotation.y) * 0.24;
    origin.z += Math.cos(bot.root.rotation.y) * 0.24;
    const targetPoint = targetPosition.clone();
    const hitRoll = Math.random() < difficulty.hitChance;
    if (!hitRoll) {
      targetPoint.x += (Math.random() - 0.5) * 2.6;
      targetPoint.y += (Math.random() - 0.5) * 1.2;
      targetPoint.z += (Math.random() - 0.5) * 2.6;
    }

    const aimPoint = targetPoint.clone();
    const direction = aimPoint.clone().sub(origin);
    const distance = direction.length();
    direction.normalize();
    this.raycaster.set(origin, direction);
    this.raycaster.far = distance;
    const obstacle = this.raycaster.intersectObject(this.map, true)[0];
    const blocked = obstacle && obstacle.distance < distance - 0.45;
    let didHit = false;
    if (!blocked && hitRoll && target.type === "player") {
      const previousHealth = this.playerHealth.health;
      didHit = this.playerDamage.receiveDamage(
        difficulty.damage,
        origin,
        bot.id,
        bot.team,
      );
      if (didHit && previousHealth > 0 && this.playerHealth.health === 0) {
        this.onElimination({
          killerId: bot.id,
          killerTeam: bot.team,
          victimId: "player",
          victimTeam: this.playerTarget.team,
          assists: [],
        });
      }
    } else if (!blocked && hitRoll && target.type === "bot" && target.bot.active) {
      const root = target.bot.root;
      root.userData.health = Math.max(0, root.userData.health - difficulty.damage);
      root.dispatchEvent({
        type: "damage",
        amount: difficulty.damage,
        health: root.userData.health,
        attacker: { id: bot.id, team: bot.team },
      });
      didHit = true;
    }
    const end = blocked ? obstacle.point : aimPoint;
    this.addTracer(origin, end, didHit);
  }

  addTracer(start, end, didHit) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: didHit ? 0xffb867 : 0x9caa85,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.tracers.push({ line, remaining: 0.085 });
  }

  updateTracers(delta) {
    for (let index = this.tracers.length - 1; index >= 0; index -= 1) {
      const tracer = this.tracers[index];
      tracer.remaining -= delta;
      tracer.line.material.opacity = Math.max(0, tracer.remaining / 0.085) * 0.8;
      if (tracer.remaining > 0) continue;
      this.scene.remove(tracer.line);
      tracer.line.geometry.dispose();
      tracer.line.material.dispose();
      this.tracers.splice(index, 1);
    }
  }

  updateEnemy(bot, delta, difficulty) {
    if (!bot.active) {
      if (bot.state === "dying") {
        const progress = 1 - bot.deathRemaining / 0.72;
        bot.deathRemaining = Math.max(0, bot.deathRemaining - delta);
        bot.root.rotation.z = bot.deathDirection * progress * 1.2;
        bot.root.position.y = GROUND_HEIGHT - progress * 0.18;
        for (const material of bot.materials) {
          material.transparent = true;
          material.depthWrite = false;
          material.opacity = 1 - progress * 0.75;
        }
        if (bot.deathRemaining === 0) this.finishDeath(bot);
      } else {
        bot.respawnRemaining = Math.max(0, bot.respawnRemaining - delta);
        if (bot.respawnRemaining <= 1e-6) this.respawn(bot);
      }
      return;
    }

    bot.perceptionRemaining -= delta;
    if (bot.perceptionRemaining <= 0) {
      bot.perceptionRemaining = 0.2 + Math.random() * 0.08;
      bot.target = this.findTarget(bot, difficulty);
      bot.playerVisible = Boolean(bot.target);
      if (bot.playerVisible) {
        const targetPosition = this.getTargetPosition(bot.target);
        bot.lastSeenPosition.set(targetPosition.x, GROUND_HEIGHT, targetPosition.z);
        bot.lastSeenRemaining = 3.2;
        bot.state = "engaged";
      } else {
        bot.lastSeenRemaining = Math.max(0, bot.lastSeenRemaining - 0.28);
        if (bot.lastSeenRemaining > 0) bot.state = "investigating";
        else bot.state = "patrol";
      }
    }

    if (bot.target?.type === "bot" && !bot.target.bot.active) {
      bot.target = null;
      bot.playerVisible = false;
      bot.lastSeenRemaining = 0;
      bot.state = "patrol";
    }

    const target = bot.target;
    const targetPosition = target ? this.getTargetPosition(target) : this.player.camera.position;
    const playerDistance = Math.sqrt(horizontalDistanceSquared(bot.root.position, targetPosition));
    let lookTarget = null;
    if (bot.playerVisible) {
      lookTarget = targetPosition;
      bot.attackRemaining -= delta;
      if (playerDistance <= difficulty.attackRange && bot.attackRemaining <= 0) {
        this.fireAtTarget(bot, target, targetPosition, difficulty);
        bot.attackRemaining = difficulty.fireInterval * (0.86 + Math.random() * 0.28);
      }
    } else if (bot.state === "investigating") {
      lookTarget = bot.lastSeenPosition;
    }

    bot.pathUpdateRemaining -= delta;
    if (bot.playerVisible) {
      const desiredRange = difficulty.attackRange * 0.62;
      const targetMoved = !bot.pathGoal ||
        horizontalDistanceSquared(bot.pathGoal, targetPosition) > 5.5;
      if (playerDistance > desiredRange && (bot.pathUpdateRemaining <= 0 || targetMoved)) {
        this.assignPath(bot, targetPosition);
      }
    } else if (bot.state === "investigating") {
      if (bot.pathUpdateRemaining <= 0 || !bot.pathGoal) {
        this.assignPath(bot, bot.lastSeenPosition);
      }
      if (
        bot.pathIndex >= bot.path.length &&
        horizontalDistanceSquared(bot.root.position, bot.lastSeenPosition) < 2.5
      ) {
        bot.lastSeenRemaining = 0;
        bot.state = "patrol";
      }
    } else if (bot.pathIndex >= bot.path.length) {
      this.assignPatrolPath(bot);
    }

    const shouldCloseDistance =
      bot.state !== "engaged" ||
      playerDistance > difficulty.attackRange * 0.62;
    if (shouldCloseDistance) {
      const waypoint = bot.path[bot.pathIndex];
      if (waypoint) {
        lookTarget = lookTarget ?? waypoint;
        this.moveAlongPath(bot, delta, difficulty.chaseSpeed);
      }
    }

    if (lookTarget) {
      const dx = lookTarget.x - bot.root.position.x;
      const dz = lookTarget.z - bot.root.position.z;
      const targetYaw = Math.atan2(dx, dz);
      const difference = THREE.MathUtils.euclideanModulo(
        targetYaw - bot.root.rotation.y + Math.PI,
        Math.PI * 2,
      ) - Math.PI;
      bot.root.rotation.y += difference * (1 - Math.exp(-8 * delta));
    }

    bot.walkTime += delta * (bot.state === "engaged" ? 7 : 5);
    const moving = bot.pathIndex < bot.path.length && shouldCloseDistance;
    const stride = moving ? Math.sin(bot.walkTime) * 0.48 : 0;
    bot.legs[0].rotation.x = stride;
    bot.legs[1].rotation.x = -stride;
    bot.arms[0].rotation.x = -stride * 0.48 + (bot.state === "engaged" ? -0.28 : 0);
    bot.arms[1].rotation.x = stride * 0.48 + (bot.state === "engaged" ? -0.16 : 0);
    bot.body.position.y = moving ? Math.abs(Math.sin(bot.walkTime * 2)) * 0.035 : 0;
    bot.hitRemaining = Math.max(0, bot.hitRemaining - delta);
    const hitLean = bot.hitRemaining > 0 ? bot.hitLean * 0.12 : 0;
    bot.body.rotation.z = hitLean + (moving ? Math.sin(bot.walkTime) * 0.025 : 0);
    bot.root.updateMatrixWorld(true);
  }

  getTargetPosition(target) {
    return target.type === "player"
      ? this.player.camera.position
      : target.bot.root.position.clone().add(new THREE.Vector3(0, 1.15, 0));
  }

  update(delta) {
    if (this.mode === "practice") {
      this.updateTracers(delta);
      return;
    }
    const difficulty = AI_DIFFICULTIES[this.difficulty];
    for (const bot of this.enemies) this.updateEnemy(bot, delta, difficulty);
    this.updateTracers(delta);
  }

  notifyActiveCount() {
    this.onActiveCount(this.activeCount, this.enemies.length);
  }
}
