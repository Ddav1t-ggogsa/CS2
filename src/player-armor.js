const DEFAULT_ARMOR = 100;
const ARMOR_ABSORPTION = 0.65;

export class PlayerArmor {
  constructor({ maxArmor = DEFAULT_ARMOR, onChange = () => {} } = {}) {
    this.maxArmor = maxArmor;
    this.armor = maxArmor;
    this.onChange = onChange;
    this.notifyChange();
  }

  notifyChange() {
    this.onChange({ armor: this.armor, maxArmor: this.maxArmor });
  }

  absorbDamage(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { absorbed: 0, healthDamage: 0 };
    }

    const absorbed = Math.min(this.armor, amount * ARMOR_ABSORPTION);
    if (absorbed > 0) {
      this.armor = Math.max(0, this.armor - absorbed);
      this.notifyChange();
    }

    return { absorbed, healthDamage: amount - absorbed };
  }

  restore() {
    this.armor = this.maxArmor;
    this.notifyChange();
  }
}
