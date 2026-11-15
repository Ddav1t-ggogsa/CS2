export const GAME_MODES = Object.freeze({
  deathmatch: Object.freeze({ label: "DEATHMATCH", targetScore: 20, duration: 300 }),
  teamDeathmatch: Object.freeze({ label: "TEAM DEATHMATCH", targetScore: 30, duration: 300 }),
  practice: Object.freeze({ label: "PRACTICE", targetScore: null, duration: null }),
});

export class MatchManager {
  constructor({ onChange = () => {}, onFinish = () => {} } = {}) {
    this.onChange = onChange;
    this.onFinish = onFinish;
    this.mode = "deathmatch";
    this.status = "idle";
    this.remaining = 0;
    this.scores = { blue: 0, red: 0 };
    this.stats = { kills: 0, deaths: 0, assists: 0, shots: 0, hits: 0 };
  }

  get isRunning() {
    return this.status === "running";
  }

  get accuracy() {
    return this.stats.shots > 0
      ? Math.round((this.stats.hits / this.stats.shots) * 100)
      : 0;
  }

  start(mode, roster = []) {
    if (!GAME_MODES[mode]) throw new RangeError(`Unknown game mode: ${mode}`);
    this.mode = mode;
    this.status = "running";
    this.remaining = GAME_MODES[mode].duration ?? 0;
    this.scores = { blue: 0, red: 0 };
    this.stats = { kills: 0, deaths: 0, assists: 0, shots: 0, hits: 0 };
    this.participants = new Map(
      roster.map(({ id, label, team }) => [
        id,
        { id, label, team, kills: 0, deaths: 0, assists: 0 },
      ]),
    );
    this.notify();
  }

  recordShot() {
    if (!this.isRunning) return;
    this.stats.shots += 1;
    this.notify();
  }

  recordHit() {
    if (!this.isRunning) return;
    this.stats.hits += 1;
    this.notify();
  }

  recordElimination({ killerId, killerTeam, victimId, victimTeam, assists = [] }) {
    if (!this.isRunning || killerTeam === victimTeam) return false;
    if (this.mode === "practice") return false;

    this.scores[killerTeam] += 1;
    const killer = this.ensureParticipant(killerId, killerTeam);
    const victim = this.ensureParticipant(victimId, victimTeam);
    killer.kills += 1;
    victim.deaths += 1;
    for (const id of new Set(assists)) {
      if (id === killerId) continue;
      this.ensureParticipant(id, id === "player" ? "blue" : "red").assists += 1;
    }
    if (killerId === "player") this.stats.kills += 1;
    if (victimId === "player") this.stats.deaths += 1;
    if (killerId !== "player" && assists.includes("player")) this.stats.assists += 1;

    const config = GAME_MODES[this.mode];
    if (this.scores[killerTeam] >= config.targetScore) {
      this.finish(killerTeam, "score");
    } else {
      this.notify();
    }
    return true;
  }

  update(delta) {
    if (!this.isRunning || this.remaining <= 0) return;
    const previousSecond = Math.ceil(this.remaining);
    this.remaining = Math.max(0, this.remaining - delta);
    if (this.remaining === 0) {
      const winner = this.scores.blue === this.scores.red
        ? null
        : this.scores.blue > this.scores.red ? "blue" : "red";
      this.finish(winner, "timer");
    } else if (Math.ceil(this.remaining) !== previousSecond) {
      this.notify();
    }
  }

  finish(winner, reason) {
    if (!this.isRunning) return;
    this.status = "finished";
    this.notify();
    this.onFinish({ winner, mode: this.mode, reason, stats: { ...this.stats } });
  }

  notify() {
    this.onChange({
      mode: this.mode,
      status: this.status,
      remaining: this.remaining,
      scores: { ...this.scores },
      stats: { ...this.stats },
      accuracy: this.accuracy,
      participants: [...(this.participants?.values() ?? [])].map((participant) => ({
        ...participant,
      })),
    });
  }

  ensureParticipant(id, team) {
    if (!this.participants.has(id)) {
      const label = id === "player"
        ? "YOU"
        : id.replace(/^bot-(\d+)$/, "BOT $1").toUpperCase();
      this.participants.set(id, { id, label, team, kills: 0, deaths: 0, assists: 0 });
    }
    return this.participants.get(id);
  }
}
