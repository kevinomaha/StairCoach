/**
 * Music playback module with Jamendo API integration
 */

export class MusicManager {
  constructor({ clientId, getElementFn, getLogFn }) {
    this.clientId = clientId;
    this.$ = getElementFn;
    this.log = getLogFn;
    this.audio = null;
    this.currentTrack = null;
  }

  /**
   * Set voice manager reference for ducking callback
   */
  setVoiceManager(voiceManager) {
    this.voiceManager = voiceManager;
  }

  /**
   * Stop current music playback
   */
  stop() {
    if (this.audio) {
      try {
        this.audio.pause();
      } catch {}
      this.audio.src = "";
      this.audio = null;
    }
    this.currentTrack = null;
    if (this.voiceManager) {
      this.voiceManager.setJamendoAudio(null);
    }
  }

  /**
   * Set volume for current audio
   */
  setVolume(volume) {
    if (this.audio) {
      this.audio.volume = volume;
    }
  }

  /**
   * Load and play a random track from Jamendo matching the tag
   */
  async loadTrack() {
    const tag = this.$("jamendoTag").value;

    // Randomize within first 20 to avoid same song every time
    const offset = Math.floor(Math.random() * 20);

    const url =
      `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(this.clientId)}` +
      `&format=json&limit=1&offset=${offset}` +
      `&audioformat=mp32&order=popularity_total` +
      `&tags=${encodeURIComponent(tag)}`;

    this.log(`Loading Jamendo track (${tag})…`);

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Jamendo HTTP ${res.status}`);
    const data = await res.json();
    const track = data?.results?.[0];

    if (!track?.audio) {
      this.log("No Jamendo track returned. Try a different tag.");
      return;
    }

    this.stop();
    this.audio = new Audio(track.audio);
    this.audio.loop = true;
    this.audio.crossOrigin = "anonymous";
    this.audio.volume = Number(this.$("musicVol").value);

    if (this.voiceManager) {
      this.voiceManager.setJamendoAudio(this.audio);
    }

    await this.audio.play();

    this.currentTrack = { name: track.name, artist: track.artist_name };
    this.log(`🎵 Now playing: ${track.name} — ${track.artist_name}`);
  }

  /**
   * Ensure music is ready for playback at race start
   */
  async ensureForStart() {
    const src = this.$("musicSource").value;
    if (src === "off") {
      this.stop();
      return;
    }

    // Jamendo
    if (!this.audio) {
      await this.loadTrack();
    } else {
      // Resume if paused
      try {
        await this.audio.play();
      } catch {}
    }
  }

  /**
   * Pause current playback
   */
  pause() {
    if (this.audio) {
      try {
        this.audio.pause();
      } catch {}
    }
  }

  /**
   * Resume playback
   */
  async play() {
    if (this.audio) {
      try {
        await this.audio.play();
      } catch {}
    }
  }

  /**
   * Get current track info
   */
  getCurrentTrack() {
    return this.currentTrack;
  }
}
