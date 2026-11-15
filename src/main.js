import * as THREE from "three";
import { createMap } from "./map.js";
import { PlayerController } from "./player-controller.js";
import { EnemySystem } from "./enemy.js";
import { PlayerHealth } from "./player-health.js";
import { PlayerArmor } from "./player-armor.js";
import { PlayerDamageSystem } from "./player-damage.js";
import { MatchManager } from "./match-manager.js";
import { PracticeTargets } from "./practice-targets.js";
import { ShootingSystem } from "./shooting-system.js";
import { WEAPON_SKINS, WeaponSystem } from "./weapon.js";
import { AudioManager } from "./audio-manager.js";
import { VisualEffects } from "./visual-effects.js";

const viewport = document.querySelector(".viewport");
const mount = document.querySelector("#scene");
const fpsDisplay = document.querySelector("#fps");
const fpsTelemetry = document.querySelector(".telemetry");
const loading = document.querySelector("#loading");
const errorMessage = document.querySelector("#error-message");
const startScreen = document.querySelector("#start-screen");
const launchTitle = document.querySelector("#launch-title");
const launchDescription = document.querySelector("#launch-description");
const playButton = document.querySelector("#play-button");
const modePlayButton = document.querySelector("#mode-play-button");
const modeOptionButtons = document.querySelectorAll("[data-mode-option]");
const menuNavigationButtons = document.querySelectorAll("[data-menu-page]");
const menuPanels = document.querySelectorAll("[data-menu-panel]");
const menuStatus = document.querySelector("#menu-status");
const homeModeSummary = document.querySelector("#home-mode-summary");
const deployModeLabel = document.querySelector("#deploy-mode-label");
const modeDeployLabel = document.querySelector("#mode-deploy-label");
const menuExitButton = document.querySelector("#menu-exit-button");
const pauseScreen = document.querySelector("#pause-screen");
const resumeButton = document.querySelector("#resume-button");
const pauseRestartButton = document.querySelector("#pause-restart-button");
const pauseMainMenuButton = document.querySelector("#pause-main-menu-button");
const pauseSettingsButton = document.querySelector("#pause-settings-button");
const pauseLockMessage = document.querySelector("#pause-lock-message");
const gameModeSelect = document.querySelector("#game-mode");
const deathScreen = document.querySelector("#death-screen");
const respawnButton = document.querySelector("#respawn-button");
const matchEndScreen = document.querySelector("#match-end-screen");
const matchEndTitle = document.querySelector("#match-end-title");
const matchEndDescription = document.querySelector("#match-end-description");
const restartMatchButton = document.querySelector("#restart-match-button");
const difficultySelect = document.querySelector("#bot-difficulty");
const lockMessage = document.querySelector("#lock-message");
const botCount = document.querySelector("#bot-count");
const playerHealthDisplay = document.querySelector("#player-health");
const playerHealthValue = document.querySelector("#player-health-value");
const playerHealthFill = document.querySelector("#player-health-fill");
const playerHealthState = document.querySelector("#player-health-state");
const playerArmorValue = document.querySelector("#player-armor-value");
const playerArmorFill = document.querySelector("#player-armor-fill");
const damageIndicator = document.querySelector("#damage-indicator");
const reticle = document.querySelector("#reticle");
const crosshairShape = document.querySelector("#crosshair-shape");
const crosshairSize = document.querySelector("#crosshair-size");
const crosshairColor = document.querySelector("#crosshair-color");
const scopeOverlay = document.querySelector("#scope-overlay");
const ammoDisplay = document.querySelector("#ammo-display");
const ammoIcon = document.querySelector("#ammo-icon");
const ammoWeapon = document.querySelector("#ammo-weapon");
const ammoKey = document.querySelector("#ammo-key");
const ammoMagazine = document.querySelector("#ammo-current");
const ammoReserve = document.querySelector("#ammo-reserve");
const ammoMagazineFill = document.querySelector("#ammo-magazine-fill");
const reloadIndicator = document.querySelector("#reload-indicator");
const reloadFill = document.querySelector("#reload-fill");
const audioWarning = document.querySelector("#audio-warning");
const masterVolume = document.querySelector("#master-volume");
const effectsVolume = document.querySelector("#effects-volume");
const musicVolume = document.querySelector("#music-volume");
const masterVolumeValue = document.querySelector("#master-volume-value");
const effectsVolumeValue = document.querySelector("#effects-volume-value");
const musicVolumeValue = document.querySelector("#music-volume-value");
const mouseSensitivity = document.querySelector("#mouse-sensitivity");
const mouseSensitivityValue = document.querySelector("#mouse-sensitivity-value");
const graphicsQuality = document.querySelector("#graphics-quality");
const shadowsEnabled = document.querySelector("#shadows-enabled");
const fpsEnabled = document.querySelector("#fps-enabled");
const fullscreenButton = document.querySelector("#fullscreen-button");
const settingsStatus = document.querySelector("#settings-status");
const inventoryWeapons = document.querySelectorAll("[data-weapon-option]");
const weaponSkinSelect = document.querySelector("#weapon-skin");
const previewElement = document.querySelector("#weapon-preview");
const previewWeaponName = document.querySelector("#preview-weapon-name");
const previewSkinLabel = document.querySelector("#preview-skin-label");
const topbarMode = document.querySelector("#topbar-mode");
const matchHud = document.querySelector("#match-hud");
const matchModeDisplay = document.querySelector("#match-mode");
const matchTimer = document.querySelector("#match-timer");
const scoreBlueLabel = document.querySelector("#score-blue-label");
const scoreRedLabel = document.querySelector("#score-red-label");
const scoreBlue = document.querySelector("#score-blue");
const scoreRed = document.querySelector("#score-red");
const scoreTarget = document.querySelector("#score-target");
const eliminationFeed = document.querySelector("#elimination-feed");
const scoreboardScreen = document.querySelector("#scoreboard-screen");
const scoreboardMode = document.querySelector("#scoreboard-mode");
const scoreboardBlue = document.querySelector("#scoreboard-blue");
const scoreboardRed = document.querySelector("#scoreboard-red");
const scoreboardTotalLabel = document.querySelector(".scoreboard-total small");
const scoreboardRows = document.querySelector("#scoreboard-rows");
const matchStats = document.querySelector("#match-stats");
const statKills = document.querySelector("#stat-kills");
const statDeaths = document.querySelector("#stat-deaths");
const statAssists = document.querySelector("#stat-assists");
const statAccuracy = document.querySelector("#stat-accuracy");
const resultScore = document.querySelector("#result-score");
const resultKills = document.querySelector("#result-kills");
const resultDeaths = document.querySelector("#result-deaths");
const resultAssists = document.querySelector("#result-assists");
const resultAccuracy = document.querySelector("#result-accuracy");

if (
  !(viewport instanceof HTMLElement) ||
  !(mount instanceof HTMLElement) ||
  !(fpsDisplay instanceof HTMLElement) ||
  !(fpsTelemetry instanceof HTMLElement) ||
  !(loading instanceof HTMLElement) ||
  !(errorMessage instanceof HTMLElement) ||
  !(startScreen instanceof HTMLElement) ||
  !(launchTitle instanceof HTMLElement) ||
  !(launchDescription instanceof HTMLElement) ||
  !(playButton instanceof HTMLButtonElement) ||
  !(modePlayButton instanceof HTMLButtonElement) ||
  !(menuStatus instanceof HTMLElement) ||
  !(homeModeSummary instanceof HTMLElement) ||
  !(deployModeLabel instanceof HTMLElement) ||
  !(modeDeployLabel instanceof HTMLElement) ||
  !(menuExitButton instanceof HTMLButtonElement) ||
  !(pauseScreen instanceof HTMLElement) ||
  !(resumeButton instanceof HTMLButtonElement) ||
  !(pauseRestartButton instanceof HTMLButtonElement) ||
  !(pauseMainMenuButton instanceof HTMLButtonElement) ||
  !(pauseSettingsButton instanceof HTMLButtonElement) ||
  !(pauseLockMessage instanceof HTMLElement) ||
  !(gameModeSelect instanceof HTMLSelectElement) ||
  !(deathScreen instanceof HTMLElement) ||
  !(respawnButton instanceof HTMLButtonElement) ||
  !(matchEndScreen instanceof HTMLElement) ||
  !(matchEndTitle instanceof HTMLElement) ||
  !(matchEndDescription instanceof HTMLElement) ||
  !(restartMatchButton instanceof HTMLButtonElement) ||
  !(difficultySelect instanceof HTMLSelectElement) ||
  !(lockMessage instanceof HTMLElement) ||
  !(botCount instanceof HTMLElement) ||
  !(playerHealthDisplay instanceof HTMLElement) ||
  !(playerHealthValue instanceof HTMLElement) ||
  !(playerHealthFill instanceof HTMLElement) ||
  !(playerHealthState instanceof HTMLElement) ||
  !(playerArmorValue instanceof HTMLElement) ||
  !(playerArmorFill instanceof HTMLElement) ||
  !(damageIndicator instanceof HTMLElement) ||
  !(reticle instanceof HTMLElement) ||
  !(crosshairShape instanceof HTMLSelectElement) ||
  !(crosshairSize instanceof HTMLSelectElement) ||
  !(crosshairColor instanceof HTMLSelectElement) ||
  !(scopeOverlay instanceof HTMLElement) ||
  !(ammoDisplay instanceof HTMLElement) ||
  !(ammoIcon instanceof SVGElement) ||
  !(ammoWeapon instanceof HTMLElement) ||
  !(ammoKey instanceof HTMLElement) ||
  !(ammoMagazine instanceof HTMLElement) ||
  !(ammoReserve instanceof HTMLElement) ||
  !(ammoMagazineFill instanceof HTMLElement) ||
  !(reloadIndicator instanceof HTMLElement) ||
  !(reloadFill instanceof HTMLElement) ||
  !(audioWarning instanceof HTMLElement) ||
  !(masterVolume instanceof HTMLInputElement) ||
  !(effectsVolume instanceof HTMLInputElement) ||
  !(musicVolume instanceof HTMLInputElement) ||
  !(masterVolumeValue instanceof HTMLOutputElement) ||
  !(effectsVolumeValue instanceof HTMLOutputElement) ||
  !(musicVolumeValue instanceof HTMLOutputElement) ||
  !(mouseSensitivity instanceof HTMLInputElement) ||
  !(mouseSensitivityValue instanceof HTMLOutputElement) ||
  !(graphicsQuality instanceof HTMLSelectElement) ||
  !(shadowsEnabled instanceof HTMLInputElement) ||
  !(fpsEnabled instanceof HTMLInputElement) ||
  !(fullscreenButton instanceof HTMLButtonElement) ||
  !(settingsStatus instanceof HTMLElement) ||
  !(weaponSkinSelect instanceof HTMLSelectElement) ||
  !(previewElement instanceof HTMLElement) ||
  !(previewWeaponName instanceof HTMLElement) ||
  !(previewSkinLabel instanceof HTMLElement) ||
  !(topbarMode instanceof HTMLElement) ||
  !(matchHud instanceof HTMLElement) ||
  !(matchModeDisplay instanceof HTMLElement) ||
  !(matchTimer instanceof HTMLElement) ||
  !(scoreBlueLabel instanceof HTMLElement) ||
  !(scoreRedLabel instanceof HTMLElement) ||
  !(scoreBlue instanceof HTMLElement) ||
  !(scoreRed instanceof HTMLElement) ||
  !(scoreTarget instanceof HTMLElement) ||
  !(eliminationFeed instanceof HTMLElement) ||
  !(scoreboardScreen instanceof HTMLElement) ||
  !(scoreboardMode instanceof HTMLElement) ||
  !(scoreboardBlue instanceof HTMLElement) ||
  !(scoreboardRed instanceof HTMLElement) ||
  !(scoreboardTotalLabel instanceof HTMLElement) ||
  !(scoreboardRows instanceof HTMLElement) ||
  !(matchStats instanceof HTMLElement) ||
  !(statKills instanceof HTMLElement) ||
  !(statDeaths instanceof HTMLElement) ||
  !(statAssists instanceof HTMLElement) ||
  !(statAccuracy instanceof HTMLElement) ||
  !(resultScore instanceof HTMLElement) ||
  !(resultKills instanceof HTMLElement) ||
  !(resultDeaths instanceof HTMLElement) ||
  !(resultAssists instanceof HTMLElement) ||
  !(resultAccuracy instanceof HTMLElement)
) {
  throw new Error("A required scene or player interface element is missing.");
}

const SETTINGS_STORAGE_KEY = "fieldops.settings.v1";
const DEFAULT_SETTINGS = {
  mode: "deathmatch",
  difficulty: "normal",
  startingWeapon: "assaultRifle",
  skins: {},
  sensitivity: 1,
  masterVolume: 0.8,
  effectsVolume: 0.78,
  musicVolume: 0.28,
  graphicsQuality: "high",
  shadows: true,
  showFps: true,
  crosshairColor: "#f18a52",
  crosshairSize: "18",
  crosshairShape: "classic",
};

function readSavedSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...DEFAULT_SETTINGS, skins: {} };
    }
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      skins: saved.skins && typeof saved.skins === "object" && !Array.isArray(saved.skins)
        ? saved.skins
        : {},
    };
  } catch (error) {
    console.warn("Saved settings could not be loaded.", error);
    return { ...DEFAULT_SETTINGS, skins: {} };
  }
}

const settings = readSavedSettings();
const supportedModes = new Set(["deathmatch", "teamDeathmatch", "practice"]);
const supportedDifficulties = new Set(["easy", "normal", "hard"]);
const supportedQualities = new Set(["low", "medium", "high"]);
const supportedCrosshairColors = new Set(["#f18a52", "#f5f4ed", "#f0524f", "#72d8d0"]);
const supportedCrosshairSizes = new Set(["12", "18", "26"]);
const supportedCrosshairShapes = new Set(["classic", "cross", "dot", "circle"]);
if (!supportedModes.has(settings.mode)) settings.mode = DEFAULT_SETTINGS.mode;
if (!supportedDifficulties.has(settings.difficulty)) settings.difficulty = DEFAULT_SETTINGS.difficulty;
if (!["assaultRifle", "sniperRifle", "pistol", "smg", "shotgun"].includes(settings.startingWeapon)) {
  settings.startingWeapon = DEFAULT_SETTINGS.startingWeapon;
}
if (!supportedQualities.has(settings.graphicsQuality)) settings.graphicsQuality = DEFAULT_SETTINGS.graphicsQuality;
if (!supportedCrosshairColors.has(settings.crosshairColor)) settings.crosshairColor = DEFAULT_SETTINGS.crosshairColor;
if (!supportedCrosshairSizes.has(String(settings.crosshairSize))) settings.crosshairSize = DEFAULT_SETTINGS.crosshairSize;
if (!supportedCrosshairShapes.has(settings.crosshairShape)) settings.crosshairShape = DEFAULT_SETTINGS.crosshairShape;
settings.sensitivity = Number.isFinite(settings.sensitivity)
  ? THREE.MathUtils.clamp(settings.sensitivity, 0.25, 2.5)
  : DEFAULT_SETTINGS.sensitivity;
for (const key of ["masterVolume", "effectsVolume", "musicVolume"]) {
  settings[key] = Number.isFinite(settings[key])
    ? THREE.MathUtils.clamp(settings[key], 0, 1)
    : DEFAULT_SETTINGS[key];
}
settings.shadows = Boolean(settings.shadows);
settings.showFps = Boolean(settings.showFps);
settings.skins = Object.fromEntries(
  Object.entries(settings.skins).filter(([weaponId, skinId]) =>
    ["assaultRifle", "sniperRifle", "pistol", "smg", "shotgun"].includes(weaponId) &&
    WEAPON_SKINS[skinId],
  ),
);

gameModeSelect.value = settings.mode;
difficultySelect.value = settings.difficulty;
masterVolume.value = String(settings.masterVolume);
effectsVolume.value = String(settings.effectsVolume);
musicVolume.value = String(settings.musicVolume);
mouseSensitivity.value = String(settings.sensitivity);
graphicsQuality.value = settings.graphicsQuality;
shadowsEnabled.checked = settings.shadows;
fpsEnabled.checked = settings.showFps;
crosshairColor.value = settings.crosshairColor;
crosshairSize.value = String(settings.crosshairSize);
crosshairShape.value = settings.crosshairShape;

let saveSettingsTimer = 0;
function saveSettings() {
  window.clearTimeout(saveSettingsTimer);
  saveSettingsTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      settingsStatus.textContent = "SETTINGS SAVED LOCALLY";
    } catch (error) {
      console.error("Settings could not be saved to local storage.", error);
      settingsStatus.textContent = "LOCAL STORAGE UNAVAILABLE";
    }
  }, 120);
}

const audioManager = new AudioManager({
  onUnavailable: () => {
    audioWarning.hidden = false;
  },
});

for (const [bus, input, output] of [
  ["master", masterVolume, masterVolumeValue],
  ["effects", effectsVolume, effectsVolumeValue],
  ["music", musicVolume, musicVolumeValue],
]) {
  const updateVolume = () => {
    const volume = Number(input.value);
    audioManager.setVolume(bus, volume);
    output.value = `${Math.round(volume * 100)}%`;
    output.textContent = output.value;
    settings[`${bus === "effects" ? "effects" : bus}Volume`] = volume;
    saveSettings();
  };
  input.addEventListener("input", updateVolume);
  updateVolume();
}

audioManager.setMenuMode(true);
startScreen.addEventListener("pointerdown", () => {
  void audioManager.unlock();
}, { once: true });

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  loading.classList.add("is-hidden");
}

let renderer;

try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
} catch (error) {
  showError("WebGL could not be initialized. Try a browser with hardware acceleration enabled.");
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ca89d);
scene.fog = new THREE.Fog(0x9ca89d, 62, 148);

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  220,
);
scene.add(camera);

const ambient = new THREE.HemisphereLight(0xcdd8d0, 0x45473c, 2.05);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffe6c6, 3.1);
sun.position.set(-34, 56, 27);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -72;
sun.shadow.camera.right = 72;
sun.shadow.camera.top = 72;
sun.shadow.camera.bottom = -72;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 150;
sun.shadow.normalBias = 0.035;
sun.shadow.bias = -0.00015;
scene.add(sun);
sun.target.position.set(0, 0, -10);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0xa6c0c5, 0.78);
fill.position.set(30, 18, -32);
scene.add(fill);

function applyGraphicsSettings() {
  const pixelRatios = { low: 0.85, medium: 1.25, high: 1.75 };
  const shadowSizes = { low: 512, medium: 1024, high: 2048 };
  renderer.setPixelRatio(Math.min(
    window.devicePixelRatio || 1,
    pixelRatios[settings.graphicsQuality],
  ));
  renderer.shadowMap.enabled = settings.shadows;
  const shadowSize = shadowSizes[settings.graphicsQuality];
  if (
    sun.shadow.mapSize.x !== shadowSize ||
    sun.shadow.mapSize.y !== shadowSize
  ) {
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
  }
  fpsTelemetry.hidden = !settings.showFps;
  renderer.setSize(window.innerWidth, window.innerHeight);
}
applyGraphicsSettings();

const map = createMap();
scene.add(map);
map.updateMatrixWorld(true);
const player = new PlayerController(
  camera,
  renderer.domElement,
  map.userData.colliders,
  { onFootstep: (isWalking) => audioManager.playFootstep(isWalking) },
);
player.setLookSensitivity(settings.sensitivity);
const weapon = new WeaponSystem(camera);
for (const [weaponId, skinId] of Object.entries(settings.skins)) {
  if (WEAPON_SKINS[skinId] && weapon.models.has(weaponId)) {
    weapon.setSkin(weaponId, skinId);
  }
}
const visualEffects = new VisualEffects(scene, player.position);
let shooting = null;
let damageIndicatorTimer = 0;

function showDamageIndicator(sourcePosition) {
  let angle = 0;
  if (sourcePosition) {
    const dx = sourcePosition.x - player.position.x;
    const dz = sourcePosition.z - player.position.z;
    const forwardX = -Math.sin(player.yaw);
    const forwardZ = -Math.cos(player.yaw);
    const rightX = Math.cos(player.yaw);
    const rightZ = -Math.sin(player.yaw);
    angle = Math.atan2(
      dx * rightX + dz * rightZ,
      dx * forwardX + dz * forwardZ,
    ) * (180 / Math.PI);
  }

  damageIndicator.style.setProperty("--damage-angle", `${angle}deg`);
  damageIndicator.classList.remove("is-active");
  void damageIndicator.offsetWidth;
  damageIndicator.classList.add("is-active");
  window.clearTimeout(damageIndicatorTimer);
  damageIndicatorTimer = window.setTimeout(() => {
    damageIndicator.classList.remove("is-active");
  }, 520);
}

const playerHealth = new PlayerHealth({
  onChange: ({ health, maxHealth, state }) => {
    playerHealthValue.textContent = String(Math.ceil(health)).padStart(3, "0");
    playerHealthFill.style.transform = `scaleX(${health / maxHealth})`;
    playerHealthState.textContent = state === "critical" ? "CRITICAL" : "OPERATIONAL";
    playerHealthState.dataset.state = state;
    playerHealthDisplay.classList.toggle("is-low", state === "critical");
    if (shooting) shooting.setEnabled(state !== "dead");
    if (state === "dead") {
      player.stopMotion();
      reticle.classList.remove("is-visible");
      startScreen.hidden = true;
      deathScreen.hidden = false;
      if (
        document.pointerLockElement === renderer.domElement &&
        typeof document.exitPointerLock === "function"
      ) {
        document.exitPointerLock();
      }
    }
  },
});
const playerArmor = new PlayerArmor({
  onChange: ({ armor, maxArmor }) => {
    playerArmorValue.textContent = String(Math.ceil(armor)).padStart(3, "0");
    playerArmorFill.style.transform = `scaleX(${armor / maxArmor})`;
    playerHealthDisplay.classList.toggle("armor-low", armor <= maxArmor * 0.25);
  },
});
const playerDamage = new PlayerDamageSystem({
  health: playerHealth,
  armor: playerArmor,
  onDamage: ({ sourcePosition, healthDamage, armorDamage }) => {
    showDamageIndicator(sourcePosition);
    audioManager.playPlayerDamage(healthDamage, armorDamage);
  },
});
function formatTime(seconds) {
  const totalSeconds = Math.ceil(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getParticipantLabel(id) {
  if (id === "player") return "YOU";
  return id.replace(/^bot-(\d+)$/, "BOT $1").toUpperCase();
}

function renderScoreboard(state) {
  scoreboardMode.textContent = state.mode === "teamDeathmatch"
    ? "TEAM DEATHMATCH"
    : state.mode.toUpperCase();
  scoreboardBlue.textContent = String(
    state.mode === "practice" ? state.stats.hits : state.scores.blue,
  ).padStart(2, "0");
  scoreboardRed.textContent = String(
    state.mode === "practice" ? state.stats.shots : state.scores.red,
  ).padStart(2, "0");
  scoreboardTotalLabel.textContent = state.mode === "practice"
    ? "HITS / SHOTS"
    : state.mode === "teamDeathmatch" ? "TEAM SCORE" : "MATCH SCORE";

  const participants = [...state.participants].sort((a, b) =>
    a.team.localeCompare(b.team) ||
    b.kills - a.kills ||
    a.deaths - b.deaths ||
    a.label.localeCompare(b.label),
  );
  const rows = document.createDocumentFragment();
  for (const participant of participants) {
    const row = document.createElement("tr");
    row.dataset.team = participant.team;
    if (participant.id === "player") row.classList.add("is-player");
    const team = document.createElement("td");
    team.textContent = state.mode === "teamDeathmatch"
      ? participant.team.toUpperCase()
      : participant.id === "player" ? "YOU" : state.mode === "practice" ? "—" : "HOSTILE";
    const operator = document.createElement("td");
    operator.textContent = participant.label;
    row.append(team, operator);
    for (const value of [participant.kills, participant.deaths, participant.assists]) {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.append(cell);
    }
    rows.append(row);
  }
  scoreboardRows.replaceChildren(rows);
}

function updateMatchHud(state) {
  matchModeDisplay.textContent = state.mode === "teamDeathmatch"
    ? "TEAM DEATHMATCH"
    : state.mode.toUpperCase();
  topbarMode.textContent = matchModeDisplay.textContent;
  scoreBlueLabel.textContent = state.mode === "teamDeathmatch"
    ? "BLUE"
    : state.mode === "practice" ? "HITS" : "YOU";
  scoreRedLabel.textContent = state.mode === "teamDeathmatch"
    ? "RED"
    : state.mode === "practice" ? "SHOTS" : "HOSTILES";
  scoreBlue.textContent = String(
    state.mode === "practice" ? state.stats.hits : state.scores.blue,
  ).padStart(2, "0");
  scoreRed.textContent = String(
    state.mode === "practice" ? state.stats.shots : state.scores.red,
  ).padStart(2, "0");
  matchTimer.textContent = state.mode === "practice"
    ? "∞"
    : formatTime(state.remaining);
  scoreTarget.textContent = state.mode === "practice"
    ? `PRACTICE · ${state.accuracy}% ACCURACY`
    : `FIRST TO ${state.mode === "teamDeathmatch" ? 30 : 20}`;
  matchHud.hidden = state.status === "idle";
  matchStats.hidden = state.status === "idle";
  statKills.textContent = String(state.stats.kills);
  statDeaths.textContent = String(state.stats.deaths);
  statAssists.textContent = String(state.stats.assists);
  statAccuracy.textContent = `${state.accuracy}%`;
  renderScoreboard(state);
}

function showEliminationNotice(result) {
  const notice = document.createElement("div");
  notice.className = "elimination-notice";
  const assistsPlayer = result.assists?.includes("player");
  const isDefeat = result.victimId === "player";
  notice.classList.toggle("is-defeat", isDefeat);
  notice.classList.toggle("is-assist", assistsPlayer && !isDefeat);

  const symbol = document.createElement("span");
  symbol.className = "elimination-symbol";
  symbol.textContent = assistsPlayer && !isDefeat ? "+" : "×";
  const message = document.createElement("span");
  message.textContent = isDefeat
    ? `${getParticipantLabel(result.killerId)} ELIMINATED YOU`
    : result.killerId === "player"
      ? `YOU ELIMINATED ${getParticipantLabel(result.victimId)}`
      : assistsPlayer
        ? `ASSIST · ${getParticipantLabel(result.victimId)}`
        : `${getParticipantLabel(result.killerId)} ELIMINATED ${getParticipantLabel(result.victimId)}`;
  notice.append(symbol, message);
  eliminationFeed.prepend(notice);
  while (eliminationFeed.children.length > 4) {
    eliminationFeed.lastElementChild.remove();
  }
  window.setTimeout(() => notice.remove(), 4500);
}

let matchManager;
matchManager = new MatchManager({
  onChange: updateMatchHud,
  onFinish: ({ winner, mode, reason, stats }) => {
    const won = winner === "blue";
    matchEndTitle.textContent = winner === null
      ? "DRAW"
      : won ? "VICTORY" : "DEFEAT";
    matchEndTitle.dataset.result = winner === null ? "draw" : won ? "win" : "loss";
    matchEndDescription.textContent = reason === "timer"
      ? "Time expired. The higher score takes the match."
      : `${winner === null ? "Neither side" : won ? "Your side" : "The opposing side"} reached the target score.`;
    resultScore.textContent = `${String(matchManager.scores.blue).padStart(2, "0")} — ${String(matchManager.scores.red).padStart(2, "0")}`;
    resultKills.textContent = String(stats.kills);
    resultDeaths.textContent = String(stats.deaths);
    resultAssists.textContent = String(stats.assists);
    resultAccuracy.textContent = `${matchManager.accuracy}%`;
    matchEndScreen.hidden = false;
    deathScreen.hidden = true;
    startScreen.hidden = true;
    player.stopMotion();
    if (shooting) shooting.setEnabled(false);
    if (document.pointerLockElement === renderer.domElement) {
      document.exitPointerLock();
    }
  },
});
const enemies = new EnemySystem({
  scene,
  map,
  player,
  playerHealth,
  playerDamage,
  mode: gameModeSelect.value,
  difficulty: difficultySelect.value,
  onElimination: (result) => {
    if (result.victimId !== "player" && result.position) {
      visualEffects.spawnElimination(result.position, result.victimTeam);
      if (result.victimTeam !== "blue") audioManager.playEnemyElimination();
    }
    showEliminationNotice(result);
    matchManager.recordElimination(result);
  },
  onActiveCount: (active, total) => {
    botCount.textContent = `${String(active).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  },
});
const practiceTargets = new PracticeTargets(scene);
shooting = new ShootingSystem({
  camera,
  scene,
  map,
  enemyGroup: enemies.enemyGroup,
  extraTargets: [practiceTargets.group],
  targetValidator: (target) => {
    if (target.userData.practiceTarget) return matchManager.mode === "practice";
    if (matchManager.mode === "teamDeathmatch") {
      return target.userData.team !== "blue";
    }
    return true;
  },
  onShot: () => matchManager.recordShot(),
  onHit: () => matchManager.recordHit(),
  weapon,
  audio: audioManager,
  pointerLockElement: renderer.domElement,
  hud: {
    ammoDisplay,
    ammoIcon,
    weaponName: ammoWeapon,
    weaponKey: ammoKey,
    magazine: ammoMagazine,
    reserve: ammoReserve,
    magazineFill: ammoMagazineFill,
    reloadIndicator,
    reloadFill,
    audioWarning,
    reticle,
    scopeOverlay,
  },
});

difficultySelect.addEventListener("change", () => {
  enemies.setDifficulty(difficultySelect.value);
  settings.difficulty = difficultySelect.value;
  updateMenuSummary();
  saveSettings();
});

let previewRenderer = null;
let previewScene = null;
let previewCamera = null;
let previewModel = null;
let previewPointerDown = false;
let previewLastPointerX = 0;
const previewAmbient = new THREE.HemisphereLight(0xdce9e7, 0x39413f, 3);
const previewKeyLight = new THREE.DirectionalLight(0xffdfb1, 4);
previewKeyLight.position.set(-2.2, 3.4, 4);

function updateWeaponPreview() {
  const weaponId = settings.startingWeapon;
  const weaponConfig = weapon.models.get(weaponId)?.config;
  previewWeaponName.textContent = weaponConfig?.displayName ?? ammoWeapon.textContent;
  const skinId = settings.skins[weaponId] ?? "field";
  weaponSkinSelect.value = skinId;
  previewSkinLabel.textContent = WEAPON_SKINS[skinId]?.label ?? WEAPON_SKINS.field.label;
  if (!previewRenderer || !previewScene || !previewCamera) return;

  if (previewModel) {
    previewScene.remove(previewModel);
    previewModel = null;
  }
  try {
    previewModel = weapon.createPreviewModel(weaponId);
    previewModel.rotation.set(0.22, 0.96, 0.08);
    previewScene.add(previewModel);
    resizeWeaponPreview();
  } catch (error) {
    console.error("Weapon preview could not be updated.", error);
    settingsStatus.textContent = "WEAPON PREVIEW UNAVAILABLE";
  }
}

function resizeWeaponPreview() {
  if (!previewRenderer || !previewCamera) return;
  const bounds = previewElement.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return;
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  previewRenderer.setSize(bounds.width, bounds.height, false);
  previewCamera.aspect = bounds.width / bounds.height;
  previewCamera.updateProjectionMatrix();
}

try {
  previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0x151b1c);
  previewScene.add(previewAmbient, previewKeyLight);
  previewCamera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
  previewCamera.position.set(0, 0.12, 3.8);
  previewCamera.lookAt(0, 0, 0);
  previewRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  previewRenderer.outputColorSpace = THREE.SRGBColorSpace;
  previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  previewElement.replaceChildren(previewRenderer.domElement);
  resizeWeaponPreview();
} catch (error) {
  console.warn("The armory preview renderer could not be initialized.", error);
  settingsStatus.textContent = "WEAPON PREVIEW UNAVAILABLE";
}

function modeLabel(mode) {
  return mode === "teamDeathmatch"
    ? "TEAM DEATHMATCH"
    : mode.toUpperCase();
}

function updateMenuSummary() {
  const label = modeLabel(gameModeSelect.value);
  homeModeSummary.textContent = `${label} · ${difficultySelect.value.toUpperCase()}`;
  deployModeLabel.textContent = matchManager.isRunning && matchManager.mode === gameModeSelect.value
    ? `RESUME ${label}`
    : label;
  modeDeployLabel.textContent = label;
  for (const button of modeOptionButtons) {
    button.classList.toggle("is-selected", button.dataset.modeOption === gameModeSelect.value);
  }
}

function showMenuPage(page) {
  for (const panel of menuPanels) {
    const active = panel.dataset.menuPanel === page;
    panel.hidden = !active;
    panel.classList.toggle("is-current", active);
  }
  for (const button of menuNavigationButtons) {
    button.classList.toggle("is-active", button.dataset.menuPage === page);
  }
  if (page === "inventory") updateWeaponPreview();
  if (page === "settings") settingsStatus.textContent = "SETTINGS SAVED LOCALLY";
}

function selectMode(mode) {
  if (!supportedModes.has(mode)) return;
  gameModeSelect.value = mode;
  settings.mode = mode;
  updateMenuSummary();
  saveSettings();
  if (mode === "practice") {
    launchDescription.textContent = "Train your aim on reactive targets with unlimited ammunition.";
  } else if (mode === "teamDeathmatch") {
    launchDescription.textContent = "Fight with blue squadmates against the opposing team.";
  } else {
    launchDescription.textContent = "Eliminate hostiles. First operator to 20 takes the round.";
  }
}

for (const button of menuNavigationButtons) {
  button.addEventListener("click", () => showMenuPage(button.dataset.menuPage));
}
for (const button of modeOptionButtons) {
  button.addEventListener("click", () => selectMode(button.dataset.modeOption));
}
for (const button of inventoryWeapons) {
  button.addEventListener("click", () => {
    const weaponId = button.dataset.weaponOption;
    if (!weapon.models.has(weaponId)) return;
    settings.startingWeapon = weaponId;
    for (const option of inventoryWeapons) {
      option.classList.toggle("is-selected", option === button);
    }
    shooting.setWeapon(weaponId);
    updateWeaponPreview();
    saveSettings();
  });
}

weaponSkinSelect.addEventListener("change", () => {
  const skinId = weaponSkinSelect.value;
  const weaponId = settings.startingWeapon;
  if (!WEAPON_SKINS[skinId] || !weapon.models.has(weaponId)) return;
  settings.skins[weaponId] = skinId;
  weapon.setSkin(weaponId, skinId);
  updateWeaponPreview();
  saveSettings();
});

for (const [page, button] of [
  ["modes", document.querySelector("#menu-modes-button")],
  ["inventory", document.querySelector("#menu-inventory-button")],
  ["settings", document.querySelector("#menu-settings-button")],
]) {
  if (button instanceof HTMLButtonElement) {
    button.addEventListener("click", () => showMenuPage(page));
  }
}

mouseSensitivity.addEventListener("input", () => {
  settings.sensitivity = Number(mouseSensitivity.value);
  player.setLookSensitivity(settings.sensitivity);
  mouseSensitivityValue.value = `${Math.round(settings.sensitivity * 100)}%`;
  mouseSensitivityValue.textContent = mouseSensitivityValue.value;
  saveSettings();
});
mouseSensitivityValue.value = `${Math.round(settings.sensitivity * 100)}%`;
mouseSensitivityValue.textContent = mouseSensitivityValue.value;

graphicsQuality.addEventListener("change", () => {
  settings.graphicsQuality = graphicsQuality.value;
  applyGraphicsSettings();
  saveSettings();
});
shadowsEnabled.addEventListener("change", () => {
  settings.shadows = shadowsEnabled.checked;
  applyGraphicsSettings();
  saveSettings();
});
fpsEnabled.addEventListener("change", () => {
  settings.showFps = fpsEnabled.checked;
  applyGraphicsSettings();
  saveSettings();
});

function updateFullscreenButton() {
  fullscreenButton.textContent = document.fullscreenElement
    ? "EXIT FULLSCREEN  ↙"
    : "ENTER FULLSCREEN  ↗";
  settings.fullscreen = Boolean(document.fullscreenElement);
  saveSettings();
}
fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (viewport.requestFullscreen) {
      await viewport.requestFullscreen();
    } else {
      settingsStatus.textContent = "FULLSCREEN IS NOT AVAILABLE";
      return;
    }
  } catch (error) {
    console.error("Fullscreen mode could not be changed.", error);
    settingsStatus.textContent = "FULLSCREEN REQUEST WAS BLOCKED";
  }
});
document.addEventListener("fullscreenchange", updateFullscreenButton);
updateFullscreenButton();

difficultySelect.addEventListener("change", updateMenuSummary);
gameModeSelect.addEventListener("change", () => {
  selectMode(gameModeSelect.value);
});
for (const input of [crosshairColor, crosshairSize, crosshairShape]) {
  input.addEventListener("change", () => {
    settings.crosshairColor = crosshairColor.value;
    settings.crosshairSize = crosshairSize.value;
    settings.crosshairShape = crosshairShape.value;
    updateCrosshair();
    saveSettings();
  });
}

previewElement.addEventListener("pointerdown", (event) => {
  previewPointerDown = true;
  previewLastPointerX = event.clientX;
  previewElement.setPointerCapture(event.pointerId);
});
previewElement.addEventListener("pointermove", (event) => {
  if (!previewPointerDown || !previewModel) return;
  previewModel.rotation.y += (event.clientX - previewLastPointerX) * 0.012;
  previewLastPointerX = event.clientX;
});
previewElement.addEventListener("pointerup", () => {
  previewPointerDown = false;
});
previewElement.addEventListener("pointercancel", () => {
  previewPointerDown = false;
});
updateMenuSummary();
for (const button of inventoryWeapons) {
  button.classList.toggle("is-selected", button.dataset.weaponOption === settings.startingWeapon);
}
if (!weapon.models.has(settings.startingWeapon)) settings.startingWeapon = "assaultRifle";
shooting.setWeapon(settings.startingWeapon);
updateWeaponPreview();
showMenuPage("home");

const clock = new THREE.Clock();
let frames = 0;
let fpsStart = performance.now();
let hasStarted = false;
let menuRequested = false;
const PLAYER_RESPAWN_POINTS = [
  [0, 43],
  [-8, 43],
  [8, 43],
  [-15, 43],
  [15, 43],
];

function startNewMatch(mode) {
  menuRequested = false;
  player.respawnAt(PLAYER_RESPAWN_POINTS);
  playerHealth.restore();
  playerArmor.restore();
  enemies.setMode(mode);
  shooting.setWeapon(settings.startingWeapon);
  matchManager.start(mode, [
    { id: "player", label: "YOU", team: "blue" },
    ...enemies.enemies.map((bot) => ({
      id: bot.id,
      label: getParticipantLabel(bot.id),
      team: bot.team,
    })),
  ]);
  enemies.reset();
  practiceTargets.reset();
  practiceTargets.setEnabled(mode === "practice");
  shooting.resetAmmo();
  shooting.setUnlimitedAmmo(mode === "practice");
  shooting.setEnabled(true);
  scoreboardScreen.hidden = true;
  eliminationFeed.replaceChildren();
  pauseScreen.hidden = true;
  deathScreen.hidden = true;
  matchEndScreen.hidden = true;
  lockMessage.textContent = "";
}

function updatePointerLockState() {
  const isLocked = document.pointerLockElement === renderer.domElement;
  player.setLocked(isLocked);
  viewport.classList.toggle("is-playing", isLocked);
  audioManager.setMenuMode(
    !isLocked && playerHealth.isAlive && matchManager.status !== "finished",
  );
  if (!isLocked) scoreboardScreen.hidden = true;
  if (matchManager.status === "finished") {
    startScreen.hidden = true;
    pauseScreen.hidden = true;
    deathScreen.hidden = true;
    matchEndScreen.hidden = false;
    scoreboardScreen.hidden = true;
    reticle.classList.remove("is-visible");
    return;
  }

  if (!playerHealth.isAlive) {
    pauseScreen.hidden = true;
    reticle.classList.remove("is-visible");
    startScreen.hidden = true;
    deathScreen.hidden = false;
    return;
  }

  deathScreen.hidden = true;
  reticle.classList.toggle("is-visible", isLocked);

  if (isLocked) {
    hasStarted = true;
    menuRequested = false;
    pauseScreen.hidden = true;
    startScreen.hidden = true;
    player.camera.rotation.set(player.pitch, player.yaw, 0);
    lockMessage.textContent = "";
    pauseLockMessage.textContent = "";
    return;
  }

  if (hasStarted && matchManager.isRunning && !menuRequested) {
    startScreen.hidden = true;
    pauseScreen.hidden = false;
    return;
  }
  pauseScreen.hidden = true;
  startScreen.hidden = false;
  updateMenuSummary();
}

document.addEventListener("pointerlockchange", updatePointerLockState);
document.addEventListener("keydown", (event) => {
  if (event.code === "Escape" && document.pointerLockElement === renderer.domElement) {
    menuRequested = false;
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.code !== "Tab" ||
    event.repeat ||
    document.pointerLockElement !== renderer.domElement ||
    !matchManager.isRunning
  ) {
    return;
  }
  event.preventDefault();
  scoreboardScreen.hidden = false;
});
document.addEventListener("keyup", (event) => {
  if (event.code === "Tab") scoreboardScreen.hidden = true;
});
window.addEventListener("blur", () => {
  scoreboardScreen.hidden = true;
});

function updateCrosshair() {
  reticle.dataset.shape = crosshairShape.value;
  reticle.style.setProperty("--reticle-size", `${crosshairSize.value}px`);
  reticle.style.setProperty("--reticle-color", crosshairColor.value);
}

crosshairShape.addEventListener("change", updateCrosshair);
crosshairSize.addEventListener("change", updateCrosshair);
crosshairColor.addEventListener("change", updateCrosshair);
updateCrosshair();
document.addEventListener("pointerlockerror", () => {
  if (!playerHealth.isAlive || matchManager.status === "finished") return;
  audioManager.setMenuMode(true);
  if (hasStarted && matchManager.isRunning && !menuRequested) {
    startScreen.hidden = true;
    pauseScreen.hidden = false;
    pauseLockMessage.textContent = "Mouse capture was blocked. Try RESUME again.";
  } else {
    pauseScreen.hidden = true;
    startScreen.hidden = false;
    lockMessage.textContent = "Mouse capture was blocked. Check browser permissions and try again.";
  }
});

async function requestGamePointerLock() {
  if (typeof renderer.domElement.requestPointerLock !== "function") {
    lockMessage.textContent = "Pointer lock is not supported by this browser.";
    return false;
  }

  try {
    await renderer.domElement.requestPointerLock();
    player.camera.rotation.set(player.pitch, player.yaw, 0);
    return true;
  } catch (error) {
    console.error("Pointer lock request failed.", error);
    lockMessage.textContent = "Mouse capture was blocked. Check browser permissions and try again.";
    return false;
  }
}

playButton.addEventListener("click", async () => {
  void audioManager.unlock();
  const selectedMode = gameModeSelect.value;
  if (!matchManager.isRunning || matchManager.mode !== selectedMode) {
    startNewMatch(selectedMode);
  }
  menuRequested = true;
  await requestGamePointerLock();
});

modePlayButton.addEventListener("click", async () => {
  void audioManager.unlock();
  startNewMatch(gameModeSelect.value);
  menuRequested = true;
  await requestGamePointerLock();
});

resumeButton.addEventListener("click", async () => {
  void audioManager.unlock();
  menuRequested = false;
  pauseLockMessage.textContent = "";
  await requestGamePointerLock();
});

pauseRestartButton.addEventListener("click", async () => {
  void audioManager.unlock();
  startNewMatch(gameModeSelect.value);
  await requestGamePointerLock();
});

pauseMainMenuButton.addEventListener("click", () => {
  menuRequested = true;
  pauseScreen.hidden = true;
  startScreen.hidden = false;
  showMenuPage("home");
  updateMenuSummary();
  audioManager.setMenuMode(true);
});

pauseSettingsButton.addEventListener("click", () => {
  menuRequested = true;
  pauseScreen.hidden = true;
  startScreen.hidden = false;
  showMenuPage("settings");
  audioManager.setMenuMode(true);
});

menuExitButton.addEventListener("click", () => {
  window.close();
  window.setTimeout(() => {
    if (!window.closed) {
      menuStatus.textContent = "CLOSE THIS BROWSER TAB TO EXIT";
    }
  }, 100);
});

respawnButton.addEventListener("click", async () => {
  void audioManager.unlock();
  try {
    player.respawnAt(PLAYER_RESPAWN_POINTS);
  } catch (error) {
    console.error("Player respawn failed.", error);
    lockMessage.textContent = "No safe respawn point is available. Please try again.";
    return;
  }

  playerArmor.restore();
  if (!playerHealth.respawn()) return;
  shooting.setEnabled(true);
  deathScreen.hidden = true;
  startScreen.hidden = false;
  lockMessage.textContent = "";
  await requestGamePointerLock();
});

restartMatchButton.addEventListener("click", async () => {
  void audioManager.unlock();
  startNewMatch(gameModeSelect.value);
  await requestGamePointerLock();
});

function updateFps(now) {
  frames += 1;
  const elapsed = now - fpsStart;
  if (elapsed >= 500) {
    fpsDisplay.textContent = String(Math.round((frames * 1000) / elapsed));
    frames = 0;
    fpsStart = now;
  }
}

function render(now) {
  requestAnimationFrame(render);
  const delta = Math.min(clock.getDelta(), 0.05);
  playerHealth.update(delta);
  if (playerHealth.isAlive) player.update(delta);
  const isLocked = document.pointerLockElement === renderer.domElement;
  const menuIsVisible = !startScreen.hidden || !pauseScreen.hidden;
  if (!isLocked && menuIsVisible) {
    const menuPan = Math.sin(now * 0.00016) * 0.075;
    const menuTilt = Math.sin(now * 0.00011) * 0.012;
    player.camera.rotation.set(player.pitch + menuTilt, player.yaw + menuPan, 0);
  }
  if (matchManager.isRunning && player.locked && playerHealth.isAlive) {
    matchManager.update(delta);
    enemies.update(delta);
  }
  if (matchManager.isRunning && matchManager.mode === "practice") {
    practiceTargets.update(delta);
  }
  weapon.update(delta);
  shooting.update(delta);
  visualEffects.update(delta);
  renderer.render(scene, camera);
  if (previewRenderer && previewScene && previewCamera && previewModel && !document.querySelector("#menu-inventory-panel").hidden) {
    if (!previewPointerDown) previewModel.rotation.y += delta * 0.22;
    previewRenderer.render(previewScene, previewCamera);
  }
  updateFps(now);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  resizeWeaponPreview();
}

window.addEventListener("resize", resize);
window.addEventListener("pagehide", () => {
  audioManager.dispose();
  visualEffects.dispose();
  shooting.dispose();
  weapon.dispose();
  player.dispose();
  previewRenderer?.dispose();
  previewScene?.clear();
});
updatePointerLockState();
requestAnimationFrame(() => loading.classList.add("is-hidden"));
requestAnimationFrame(render);
