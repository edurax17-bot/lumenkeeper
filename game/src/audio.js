// WebAudio sound, synthesized live — no audio files, so the game stays
// fully offline. Every effect is a short oscillator/noise gesture, and the
// combo pitch climbs with the player's kill chain.

export function createAudio() {
  let context = null;
  let muted = false;
  let hum = null;

  function ensure() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      startHum();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }

  function startHum() {
    // A quiet low drone under the game, so silence never feels dead.
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0.02;
    osc.connect(gain).connect(context.destination);
    osc.start();
    hum = { osc, gain };
  }

  function tone({ freq = 440, freqEnd = null, type = 'sine', seconds = 0.12, volume = 0.12, delay = 0 }) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  function noise({ seconds = 0.15, volume = 0.12, delay = 0 }) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    source.connect(gain).connect(ctx.destination);
    source.start(t0);
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      if (hum) hum.gain.gain.value = muted ? 0 : 0.02;
      return muted;
    },
    get muted() { return muted; },
    shoot() { tone({ freq: 720, freqEnd: 340, type: 'square', seconds: 0.07, volume: 0.05 }); },
    hit() { noise({ seconds: 0.06, volume: 0.07 }); },
    kill(combo) {
      const step = Math.min(combo, 12);
      tone({ freq: 320 + step * 28, freqEnd: 140, type: 'triangle', seconds: 0.14, volume: 0.1 });
    },
    ember(combo) {
      const step = Math.min(combo, 12);
      tone({ freq: 660 + step * 30, type: 'sine', seconds: 0.09, volume: 0.07 });
    },
    hurt() {
      tone({ freq: 140, freqEnd: 55, type: 'sawtooth', seconds: 0.35, volume: 0.16 });
      noise({ seconds: 0.2, volume: 0.1 });
    },
    lanternHit() {
      tone({ freq: 90, freqEnd: 40, type: 'sawtooth', seconds: 0.5, volume: 0.2 });
      noise({ seconds: 0.3, volume: 0.14 });
    },
    waveHorn() {
      tone({ freq: 220, type: 'triangle', seconds: 0.25, volume: 0.12 });
      tone({ freq: 330, type: 'triangle', seconds: 0.3, volume: 0.12, delay: 0.18 });
    },
    shop() { tone({ freq: 520, freqEnd: 780, type: 'sine', seconds: 0.18, volume: 0.1 }); },
    buy() {
      tone({ freq: 880, type: 'sine', seconds: 0.1, volume: 0.1 });
      tone({ freq: 1320, type: 'sine', seconds: 0.14, volume: 0.1, delay: 0.08 });
    },
    victory() {
      [523, 659, 784, 1047].forEach((freq, i) =>
        tone({ freq, type: 'triangle', seconds: 0.35, volume: 0.12, delay: i * 0.13 }));
    },
    defeat() {
      [392, 330, 262, 196].forEach((freq, i) =>
        tone({ freq, type: 'triangle', seconds: 0.4, volume: 0.12, delay: i * 0.16 }));
    },
  };
}
