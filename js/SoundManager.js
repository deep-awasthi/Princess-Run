class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.musicGainNode = null;  // GainNode to control background music volume
    this.musicPlaying = false;
    this.settings = {
      musicVolume: 0.5,
      sfxVolume: 0.8,
      mute: false
    };
  }

  init() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  updateSettings(musicVol, sfxVol, mute) {
    const wasMutedOrZero = this.settings.mute || this.settings.musicVolume === 0;

    this.settings.musicVolume = musicVol / 100;
    this.settings.sfxVolume = sfxVol / 100;
    this.settings.mute = mute;

    const isMutedOrZero = this.settings.mute || this.settings.musicVolume === 0;

    if (isMutedOrZero) {
      this.stopMusic();
    } else {
      if (wasMutedOrZero) {
        this.startMusic();
      } else if (this.musicGainNode) {
        // Just update the gain immediately
        const targetGain = this.settings.musicVolume * 0.2;
        this.musicGainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
      }
    }
  }

  playSFX(type) {
    this.init();
    if (!this.audioCtx || this.settings.mute || this.settings.sfxVolume === 0) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime;
    const sfxVol = this.settings.sfxVolume;

    switch (type) {
      case 'jump':
        this.playTone(150, 600, 0.15, 'triangle', sfxVol * 0.3, t);
        break;
      case 'coin':
        this.playTone(523.25, 523.25, 0.08, 'sine', sfxVol * 0.4, t);
        this.playTone(659.25, 659.25, 0.15, 'sine', sfxVol * 0.4, t + 0.08);
        break;
      case 'gem':
        this.playTone(587.33, 587.33, 0.06, 'sine', sfxVol * 0.4, t);
        this.playTone(880, 880, 0.2, 'sine', sfxVol * 0.4, t + 0.06);
        break;
      case 'powerup':
        for (let i = 0; i < 4; i++) {
          this.playTone(200 + i * 200, 400 + i * 200, 0.08, 'triangle', sfxVol * 0.3, t + i * 0.06);
        }
        break;
      case 'bird':
        this.playTone(800, 400, 0.15, 'sawtooth', sfxVol * 0.15, t);
        break;
      case 'poop_squish':
        this.playTone(120, 40, 0.25, 'triangle', sfxVol * 0.5, t);
        break;
      case 'princess_cry':
        this.playTone(400, 300, 0.2, 'sine', sfxVol * 0.4, t);
        this.playTone(400, 300, 0.2, 'sine', sfxVol * 0.4, t + 0.25);
        break;
      case 'victory':
        const melody = [261.63, 329.63, 392.00, 523.25];
        melody.forEach((freq, idx) => {
          this.playTone(freq, freq, 0.12, 'sine', sfxVol * 0.4, t + idx * 0.1);
        });
        break;
      case 'gameover':
        const sad = [392.00, 349.23, 311.13, 220.00];
        sad.forEach((freq, idx) => {
          this.playTone(freq, freq - 20, 0.25, 'sawtooth', sfxVol * 0.25, t + idx * 0.2);
        });
        break;
    }
  }

  playTone(startFreq, endFreq, duration, type, volume, startTime) {
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  startMusic() {
    this.init();
    if (!this.audioCtx || this.musicPlaying) return;
    if (this.settings.mute || this.settings.musicVolume === 0) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Set up music GainNode
    this.musicGainNode = this.audioCtx.createGain();
    this.musicGainNode.connect(this.audioCtx.destination);
    
    // Set starting volume
    const targetGain = (this.settings.mute || this.settings.musicVolume === 0)
      ? 0
      : this.settings.musicVolume * 0.2;
    this.musicGainNode.gain.value = targetGain;

    this.musicPlaying = true;
    this.playMusicLoop();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicGainNode) {
      try {
        this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, this.audioCtx.currentTime);
        this.musicGainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.15);
      } catch (e) {
        // Fallback if audioCtx context is closed/suspended
      }
      this.musicGainNode = null;
    }
  }

  playMusicLoop() {
    if (!this.musicPlaying || !this.musicGainNode) return;

    const notes = [
      261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63, 293.66,
      329.63, 349.23, 392.00, 523.25, 440.00, 392.00, 349.23, 329.63
    ];

    let noteIdx = 0;
    const tempo = 150; // ms per note
    const savedGainNode = this.musicGainNode; // pin current gain node reference

    const playNextNote = () => {
      if (!this.musicPlaying || this.musicGainNode !== savedGainNode) return;

      const currentTime = this.audioCtx.currentTime;
      const freq = notes[noteIdx];

      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();

      osc.connect(noteGain);
      noteGain.connect(this.musicGainNode);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, currentTime);

      noteGain.gain.setValueAtTime(0.3, currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.12);

      osc.start(currentTime);
      osc.stop(currentTime + 0.12);

      noteIdx = (noteIdx + 1) % notes.length;
      setTimeout(playNextNote, tempo);
    };

    playNextNote();
  }
}
window.SoundManager = SoundManager;
