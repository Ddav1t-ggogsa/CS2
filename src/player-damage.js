export class PlayerDamageSystem {
  constructor({ health, armor, onDamage = () => {} }) {
    this.health = health;
    this.armor = armor;
    this.onDamage = onDamage;
  }

  receiveDamage(amount, sourcePosition = null, sourceId = null, sourceTeam = null) {
    if (!this.health.canReceiveDamage || !Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    const { absorbed, healthDamage } = this.armor.absorbDamage(amount);
    const previousHealth = this.health.health;
    if (healthDamage > 0) this.health.takeDamage(healthDamage);

    const healthLoss = previousHealth - this.health.health;
    if (absorbed > 0 || healthLoss > 0) {
      this.onDamage({
        armorDamage: absorbed,
        healthDamage: healthLoss,
        sourcePosition,
        sourceId,
        sourceTeam,
      });
      return true;
    }

    return false;
  }
}
