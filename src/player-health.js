const DEFAULT_HEALTH = 100;
const RESPAWN_INVULNERABILITY = 2;

export class PlayerHealth {
  constructor({ maxHealth = DEFAULT_HEALTH, onChange = () => {} } = {}) {
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.invulnerabilityRemaining = 0;
    this.onChange = onChange;
    this.notifyChange();
  }

  get isAlive() {
    return this.health > 0;
  }

  get canReceiveDamage() {
    return this.isAlive && this.invulnerabilityRemaining <= 0;
  }

  get state() {
    if (!this.isAlive) return "dead";
    return this.health <= this.maxHealth * 0.3 ? "critical" : "ready";
  }

  notifyChange() {
    this.onChange({
      health: this.health,
      maxHealth: this.maxHealth,
      state: this.state,
      invulnerabilityRemaining: this.invulnerabilityRemaining,
    });
  }

  takeDamage(amount) {
    if (!this.canReceiveDamage || !Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    this.notifyChange();
    return true;
  }

  respawn() {
    if (this.isAlive) return false;

    this.health = this.maxHealth;
    this.invulnerabilityRemaining = RESPAWN_INVULNERABILITY;
    this.notifyChange();
    return true;
  }

  restore() {
    this.health = this.maxHealth;
    this.invulnerabilityRemaining = 0;
    this.notifyChange();
  }

  update(delta) {
    if (delta <= 0 || this.invulnerabilityRemaining <= 0) return;
    this.invulnerabilityRemaining = Math.max(0, this.invulnerabilityRemaining - delta);
  }
}
