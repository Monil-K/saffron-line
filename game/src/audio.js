// The kitchen's sound: a small WebAudio synth, no files. Chops are filtered
// noise, the sizzle is a looping noise bed that fades with the pan, the service
// bell is two struck sines, and the music is a slow pentatonic loop played by
// scheduled plucks over a warm drone. Everything starts on the first gesture.

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let noiseBuffer = null;
  let sizzle = null;
  let musicTimer = null;
  let nextNoteAt = 0;
  let step = 0;
  let muted = false;

  const scale = [0, 3, 5, 7, 10, 12, 15];
  const chords = [
    [196.0, 246.94, 293.66],
    [174.61, 220.0, 261.63],
    [220.0, 261.63, 329.63],
    [164.81, 207.65, 246.94],
  ];

  function ensure() {
    if (ctx) return ctx;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.85;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.3;
    musicGain.connect(master);

    const seconds = 2;
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function noise(duration, filterHz, gain) {
    if (!ensure()) return;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterHz;
    filter.Q.value = 1.2;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    source.connect(filter).connect(amp).connect(master);
    source.start();
    source.stop(ctx.currentTime + duration + 0.02);
  }

  function tone(freq, duration, gain, type = 'sine', delay = 0) {
    if (!ensure()) return;
    const at = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(amp).connect(master);
    osc.start(at);
    osc.stop(at + duration + 0.03);
  }

  function bell(freq, gain) {
    if (!ensure()) return;
    const at = ctx.currentTime;
    [1, 2.02, 3.01].forEach((mult, index) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * mult, at);
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, at);
      amp.gain.exponentialRampToValueAtTime(gain / (index + 1), at + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, at + 1.5 - index * 0.3);
      osc.connect(amp).connect(master);
      osc.start(at);
      osc.stop(at + 1.6);
    });
  }

  function startSizzle() {
    if (!ensure() || sizzle) return;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const amp = ctx.createGain();
    amp.gain.value = 0.0001;
    source.connect(filter).connect(amp).connect(master);
    source.start();
    sizzle = { source, amp, filter };
  }

  function musicBar() {
    if (!ensure() || muted) return;
    const bar = Math.floor(step / 8) % chords.length;
    const chord = chords[bar];
    // A slow arpeggio over the chord, with a little rest between notes.
    const noteIndex = step % 8;
    if (noteIndex === 0) {
      const drone = ctx.createOscillator();
      drone.type = 'triangle';
      drone.frequency.value = chord[0] / 2;
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, ctx.currentTime);
      amp.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.6);
      amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.4);
      drone.connect(amp).connect(musicGain);
      drone.start();
      drone.stop(ctx.currentTime + 3.5);
    }
    if (noteIndex % 2 === 0 || Math.random() < 0.25) {
      const degree = scale[(step * 3 + bar) % scale.length];
      const freq = 220 * Math.pow(2, (degree + 12) / 12);
      tone(freq, 1.1, 0.035, 'triangle');
      tone(freq * 2, 0.5, 0.012, 'sine', 0.02);
    }
    step += 1;
  }

  function startMusic() {
    if (!ensure() || musicTimer) return;
    nextNoteAt = ctx.currentTime + 0.4;
    musicTimer = setInterval(() => {
      if (!ctx) return;
      while (nextNoteAt < ctx.currentTime + 0.4) {
        musicBar();
        nextNoteAt += 0.46;
      }
    }, 120);
  }

  return {
    unlock() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      startMusic();
      startSizzle();
    },
    chop() {
      noise(0.09, 1500 + Math.random() * 400, 0.5);
      tone(120, 0.08, 0.2, 'triangle');
    },
    pick() {
      tone(520, 0.08, 0.08, 'triangle');
      tone(780, 0.06, 0.05, 'sine', 0.05);
    },
    plate() {
      noise(0.16, 2600, 0.18);
      tone(660, 0.16, 0.07, 'sine');
    },
    serve() {
      bell(880, 0.22);
      bell(1320, 0.1);
    },
    order() {
      bell(1046, 0.1);
      bell(784, 0.08);
    },
    error() {
      tone(140, 0.2, 0.16, 'sawtooth');
      tone(110, 0.22, 0.12, 'sawtooth', 0.06);
    },
    burn() {
      noise(0.35, 900, 0.3);
      tone(90, 0.3, 0.1, 'sawtooth');
    },
    clock() {
      tone(440, 0.12, 0.09, 'square');
      tone(330, 0.18, 0.09, 'square', 0.16);
    },
    setSizzle(level) {
      if (!ensure() || !sizzle) return;
      const target = Math.max(0.0001, level * 0.06);
      sizzle.amp.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
      sizzle.filter.frequency.setTargetAtTime(2600 + level * 2400, ctx.currentTime, 0.1);
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.85;
    },
    isMuted() {
      return muted;
    },
  };
}
