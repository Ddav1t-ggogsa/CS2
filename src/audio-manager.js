const AUDIO_BUSES = new Set(["master", "effects", "music"]);
const MAX_ACTIVE_SOURCES = 28;

export class AudioManager {
  constructor({ onUnavailable = () => {} } = {}) {
    this.onUnavailable = onUnavailable;
    this.context = null;
    this.masterBus = null;
    this.effectsBus = null;
    this.musicBus = null;
    this.musicModeBus = null;
    this.noiseBuffer = null;
    this.volumes = { master: 0.8, effects: 0.78, music: 0.28 };
    this.sources = new Set();
    this.musicNodes = [];
    this.musicTimer = 0;
    this.musicEnabled = false;
    this.musicNoteIndex = 0;
    this.unavailableReported = false;
    this.lastDamageSound = -Infinity;
  }

  setVolume(bus, value) {
    if (!AUDIO_BUSES.has(bus)) throw new RangeError(`Unknown audio bus: ${bus}`);
    if (!Number.isFinite(value)) throw new TypeError("Audio volume must be a finite number.");
    this.volumes[bus] = Math.max(0, Math.min(1, value));
    const gain = {
      master: this.masterBus,
      effects: this.effectsBus,
      music: this.musicBus,
    }[bus];
    if (gain && this.context) {
      gain.gain.setTargetAtTime(this.volumes[bus], this.context.currentTime, 0.04);
    }
  }

  ensureContext() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio is not supported by this browser.");

      this.context = new AudioContextClass();
      this.masterBus = this.context.createGain();
      this.effectsBus = this.context.createGain();
      this.musicBus = this.context.createGain();
      this.musicModeBus = this.context.createGain();
      this.effectsBus.connect(this.masterBus);
      this.musicBus.connect(this.musicModeBus);
      this.musicModeBus.connect(this.masterBus);
      this.masterBus.connect(this.context.destination);
      this.musicModeBus.gain.value = 0;
      this.setVolume("master", this.volumes.master);
      this.setVolume("effects", this.volumes.effects);
      this.setVolume("music", this.volumes.music);

      const length = Math.floor(this.context.sampleRate * 0.24);
      this.noiseBuffer = this.context.createBuffer(
        1,
        length,
        this.context.sampleRate,
      );
      const samples = this.noiseBuffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) {
        const decay = 1 - index / length;
        samples[index] = (Math.random() * 2 - 1) * decay * decay;
      }
    }
    return this.context;
  }

  unlock() {
    try {
      const context = this.ensureContext();
      const resumed = context.state === "suspended"
        ? context.resume()
        : Promise.resolve();
      return resumed.then(() => {
        if (this.musicEnabled) this.startMenuMusic();
        return true;
      }).catch((error) => {
        this.reportUnavailable(error);
        return false;
      });
    } catch (error) {
      this.reportUnavailable(error);
      return Promise.resolve(false);
    }
  }

  reportUnavailable(error) {
    if (this.unavailableReported) return;
    this.unavailableReported = true;
    console.warn("Audio is unavailable; gameplay will continue without sound.", error);
    this.onUnavailable();
  }

  canStart(sourceCount = 1) {
    return this.sources.size + sourceCount <= MAX_ACTIVE_SOURCES;
  }

  trackSource(source) {
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  getReadyContext() {
    const context = this.ensureContext();
    if (context.state === "suspended") {
      context.resume().catch((error) => this.reportUnavailable(error));
    }
    return context;
  }

  playTone({
    frequency,
    endFrequency = frequency,
    duration = 0.12,
    volume = 0.04,
    waveform = "sine",
    bus = this.effectsBus,
    delay = 0,
  }) {
    if (!this.canStart()) return false;
    try {
      const context = this.getReadyContext();
      const start = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
      if (endFrequency !== frequency) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(1, endFrequency),
          start + duration,
        );
      }
      gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(bus ?? this.effectsBus);
      this.trackSource(oscillator);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.015);
      return true;
    } catch (error) {
      this.reportUnavailable(error);
      return false;
    }
  }

  playNoise({ duration = 0.1, cutoff = 1800, volume = 0.08, bus = this.effectsBus }) {
    if (!this.canStart()) return false;
    try {
      const context = this.getReadyContext();
      if (!this.noiseBuffer) return false;
      const start = context.currentTime;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = this.noiseBuffer;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoff, start);
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(100, cutoff * 0.24),
        start + duration,
      );
      gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(bus ?? this.effectsBus);
      this.trackSource(source);
      source.start(start);
      source.stop(start + duration + 0.015);
      return true;
    } catch (error) {
      this.reportUnavailable(error);
      return false;
    }
  }

  playWeaponShot(sound) {
    if (!sound || !this.canStart(2)) return;
    this.playNoise({
      duration: 0.14,
      cutoff: sound.noiseCutoff,
      volume: sound.noiseVolume,
    });
    this.playTone({
      frequency: sound.bodyFrequency,
      endFrequency: sound.bodyEndFrequency,
      duration: 0.12,
      volume: sound.bodyVolume,
      waveform: sound.waveform,
    });
  }

  playReload(sound, complete) {
    if (!sound) return;
    const frequency = complete ? sound.reloadTone * 1.65 : sound.reloadTone;
    this.playTone({
      frequency,
      endFrequency: complete ? sound.reloadTone * 1.12 : sound.reloadTone * 0.68,
      duration: 0.075,
      volume: 0.045,
      waveform: complete ? "triangle" : "square",
    });
  }

  playFootstep(isWalking) {
    this.playNoise({
      duration: 0.055,
      cutoff: isWalking ? 680 : 920,
      volume: isWalking ? 0.026 : 0.045,
    });
    this.playTone({
      frequency: isWalking ? 72 : 94,
      endFrequency: isWalking ? 48 : 58,
      duration: 0.065,
      volume: isWalking ? 0.035 : 0.055,
      waveform: "triangle",
    });
  }

  playWeaponSwitch() {
    this.playTone({
      frequency: 820,
      endFrequency: 480,
      duration: 0.055,
      volume: 0.04,
      waveform: "square",
    });
    this.playTone({
      frequency: 560,
      endFrequency: 330,
      duration: 0.07,
      volume: 0.032,
      waveform: "triangle",
      delay: 0.07,
    });
  }

  playEnemyElimination() {
    this.playNoise({ duration: 0.12, cutoff: 760, volume: 0.045 });
    this.playTone({
      frequency: 164,
      endFrequency: 68,
      duration: 0.22,
      volume: 0.065,
      waveform: "sine",
    });
  }

  playPlayerDamage(amount = 0, armorDamage = 0) {
    const now = this.context?.currentTime ?? 0;
    if (now - this.lastDamageSound < 0.12) return;
    this.lastDamageSound = now;
    const intensity = Math.min(1, (amount + armorDamage * 0.45) / 28);
    this.playNoise({
      duration: 0.11,
      cutoff: 520 + intensity * 360,
      volume: 0.035 + intensity * 0.04,
    });
    this.playTone({
      frequency: 104 - intensity * 18,
      endFrequency: 48,
      duration: 0.19,
      volume: 0.045 + intensity * 0.045,
      waveform: "sine",
    });
  }

  setMenuMode(enabled) {
    this.musicEnabled = Boolean(enabled);
    if (!this.musicEnabled) {
      this.stopMenuMusic();
      return;
    }
    if (this.context?.state === "running") this.startMenuMusic();
  }

  startMenuMusic() {
    if (!this.musicEnabled || this.musicTimer || !this.context || this.context.state !== "running") {
      return;
    }
    const context = this.context;
    const start = context.currentTime;
    this.musicModeBus.gain.setTargetAtTime(1, start, 0.18);
    for (const [frequency, volume] of [[55, 0.018], [82.41, 0.008]]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + 1.2);
      oscillator.connect(gain);
      gain.connect(this.musicBus);
      this.trackSource(oscillator);
      oscillator.start(start);
      this.musicNodes.push({ oscillator, gain });
    }
    this.musicNoteIndex = 0;
    this.playMenuNote();
    this.musicTimer = window.setInterval(() => this.playMenuNote(), 1750);
  }

  playMenuNote() {
    if (!this.musicEnabled || !this.context || this.context.state !== "running") return;
    const notes = [110, 130.81, 146.83, 98, 123.47, 164.81];
    const frequency = notes[this.musicNoteIndex % notes.length];
    this.musicNoteIndex += 1;
    this.playTone({
      frequency,
      duration: 1.25,
      volume: 0.012,
      waveform: "sine",
      bus: this.musicBus,
    });
  }

  stopMenuMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = 0;
    }
    if (!this.context) {
      this.musicNodes.length = 0;
      return;
    }
    this.musicModeBus.gain.setTargetAtTime(0, this.context.currentTime, 0.035);
    const stopAt = this.context.currentTime + 0.2;
    for (const { oscillator, gain } of this.musicNodes) {
      gain.gain.cancelScheduledValues(this.context.currentTime);
      gain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.035);
      oscillator.stop(stopAt);
    }
    this.musicNodes.length = 0;
  }

  dispose() {
    this.musicEnabled = false;
    this.stopMenuMusic();
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // A scheduled source may already have stopped.
      }
    }
    this.sources.clear();
    if (this.context && this.context.state !== "closed") {
      this.context.close().catch((error) => this.reportUnavailable(error));
    }
  }
}
