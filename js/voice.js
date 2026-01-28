/**
 * Voice and speech synthesis module
 */

export class VoiceManager {
  constructor({ getElementFn, getLogFn, clampFn }) {
    this.$ = getElementFn;
    this.log = getLogFn;
    this.clamp = clampFn;
    this.voiceVolume = 1;
    this.jamendoAudio = null;
  }

  /**
   * Set up music ducking callback for when voice starts/ends
   */
  setDuckCallback(callback) {
    this.onDuckChange = callback;
  }

  setJamendoAudio(audio) {
    this.jamendoAudio = audio;
  }

  /**
   * Control music ducking during voice playback
   */
  setDucked(isDucked) {
    if (!this.$("duckMusic").checked) return;
    const target = isDucked 
      ? Math.max(0, Number(this.$("musicVol").value) * 0.25) 
      : Number(this.$("musicVol").value);
    if (this.jamendoAudio) {
      this.jamendoAudio.volume = target;
    }
  }

  /**
   * Speak text using Web Speech API
   */
  speak(text) {
    if (!this.$("voiceOn").checked) return;
    if (!("speechSynthesis" in window)) {
      this.log("Speech not supported on this device/browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 1.0;
    u.volume = this.clamp(this.voiceVolume, 0, 1);

    const voices = window.speechSynthesis.getVoices?.() || [];
    const v = voices.find(v => /en-US/i.test(v.lang)) || voices[0];
    if (v) u.voice = v;

    u.onstart = () => this.setDucked(true);
    u.onend = () => this.setDucked(false);
    u.onerror = () => this.setDucked(false);

    window.speechSynthesis.speak(u);
  }

  /**
   * Generate minute prompt based on style
   */
  buildMinutePrompt(min, minsTotal, style) {
    const remaining = minsTotal - min;
    const bank = {
      coach: [
        `Minute ${min}. Stay tall. Drive the knees. You're on pace.`,
        `Minute ${min}. Smooth steps. Light hands on the rail. Breathe.`,
        `Minute ${min}. Controlled power. You can hold this.`,
        `Minute ${min}. Quick feet. Strong core. Keep moving.`
      ],
      hype: [
        `Minute ${min}! Let's go! You're hunting floors. Keep it loud!`,
        `Minute ${min}! Push push push! You're stronger than the burn!`,
        `Minute ${min}! You own this staircase. Attack the next set!`,
        `Minute ${min}! Big energy! Keep the cadence and fly!`
      ],
      calm: [
        `Minute ${min}. Steady rhythm. In through the nose, out through the mouth.`,
        `Minute ${min}. Relax the shoulders. Keep your breath smooth.`,
        `Minute ${min}. One step at a time. You're doing great.`,
        `Minute ${min}. Stay consistent. Calm power.`
      ]
    };

    const pick = bank[style][(min - 1) % bank[style].length];
    if (remaining === 1) return `${pick} One minute left — finish strong.`;
    if (remaining === 0) return `${pick} Final push — empty the tank!`;
    return pick;
  }

  /**
   * Generate floor callout text based on style
   */
  floorCalloutText(floor, floorsTotal, style) {
    const pct = Math.round((floor / floorsTotal) * 100);
    if (floor === floorsTotal) return `Floor ${floor}. Finish!`;
    if (style === "hype") return `Floor ${floor}! ${pct} percent. Keep climbing!`;
    if (style === "calm") return `Floor ${floor}. ${pct} percent. Smooth and steady.`;
    return `Floor ${floor}. ${pct} percent. On pace.`;
  }

  /**
   * Set voice volume
   */
  setVoiceVolume(volume) {
    this.voiceVolume = Number(volume);
  }

  /**
   * Cancel all speech
   */
  cancel() {
    window.speechSynthesis?.cancel?.();
  }

  /**
   * Warm up voices list (call on init)
   */
  warmUpVoices() {
    try {
      window.speechSynthesis?.getVoices?.();
    } catch {}
  }
}
