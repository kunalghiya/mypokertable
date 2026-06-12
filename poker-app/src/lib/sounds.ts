// Premium casino sounds via Web Audio API
// Philosophy: no square waves, no fixed-pitch sine tones — use noise shaping,
// filtered bursts, and multi-stage envelopes to get a real physical feel.

let _ctx: AudioContext | null = null
let _initialized = false

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  return _ctx
}

// ── Core DSP helpers ───────────────────────────────────────────────────────

function noise(ac: AudioContext, dur: number): AudioBufferSourceNode {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  return src
}

function osc(ac: AudioContext, freq: number, type: OscillatorType = 'sine'): OscillatorNode {
  const o = ac.createOscillator()
  o.type = type
  o.frequency.value = freq
  return o
}

function gain(ac: AudioContext, v: number): GainNode {
  const g = ac.createGain()
  g.gain.value = v
  return g
}

function bpf(ac: AudioContext, freq: number, q = 1): BiquadFilterNode {
  const f = ac.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  f.Q.value = q
  return f
}

function lpf(ac: AudioContext, freq: number): BiquadFilterNode {
  const f = ac.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = freq
  return f
}

function hpf(ac: AudioContext, freq: number): BiquadFilterNode {
  const f = ac.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = freq
  return f
}

// ── CHIP CLICK ─────────────────────────────────────────────────────────────
// Real clay poker chip: two layers —
//   1. Low thud: short noise burst through 200Hz LPF (the "mass" of the chip)
//   2. High click: narrow-band noise at 3kHz (the ceramic ring on contact)
//   3. Tiny room tail: filtered reverb noise
function playChip(vol = 1) {
  const ac = ctx()
  const now = ac.currentTime

  // Layer 1: thud body
  const thudNoise = noise(ac, 0.08)
  const thudFilt  = lpf(ac, 220)
  const thudGain  = gain(ac, 0)
  thudGain.gain.setValueAtTime(0, now)
  thudGain.gain.linearRampToValueAtTime(vol * 0.9, now + 0.001)
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  thudNoise.connect(thudFilt).connect(thudGain).connect(ac.destination)
  thudNoise.start(now); thudNoise.stop(now + 0.08)

  // Layer 2: high click
  const clickNoise = noise(ac, 0.04)
  const clickFilt  = bpf(ac, 3200, 3)
  const clickGain  = gain(ac, 0)
  clickGain.gain.setValueAtTime(0, now)
  clickGain.gain.linearRampToValueAtTime(vol * 0.5, now + 0.0005)
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)
  clickNoise.connect(clickFilt).connect(clickGain).connect(ac.destination)
  clickNoise.start(now); clickNoise.stop(now + 0.04)

  // Layer 3: subtle mid ring (chip resonance)
  const ringOsc = osc(ac, 1800)
  const ringGain = gain(ac, 0)
  ringGain.gain.setValueAtTime(0, now)
  ringGain.gain.linearRampToValueAtTime(vol * 0.06, now + 0.001)
  ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
  ringOsc.connect(ringGain).connect(ac.destination)
  ringOsc.start(now); ringOsc.stop(now + 0.05)
}

// ── CHIP SHUFFLE / CASCADE ─────────────────────────────────────────────────
// Rapid-fire cascade of chip hits, velocity-descending, slight pitch spread.
// Used on session start / hand log.
function playShuffle(vol = 1) {
  const ac = ctx()
  const now = ac.currentTime
  const count = 6
  const gap = 0.052 // 52ms between chips

  for (let i = 0; i < count; i++) {
    const t = now + i * gap
    const vel = vol * (1 - i * 0.08) // each chip slightly quieter

    // Thud
    const n1 = noise(ac, 0.07)
    const f1 = lpf(ac, 200 + i * 15) // slight pitch rise each chip
    const g1 = gain(ac, 0)
    g1.gain.setValueAtTime(0, t)
    g1.gain.linearRampToValueAtTime(vel * 0.85, t + 0.001)
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.055)
    n1.connect(f1).connect(g1).connect(ac.destination)
    n1.start(t); n1.stop(t + 0.07)

    // Click
    const n2 = noise(ac, 0.03)
    const f2 = bpf(ac, 3000 + i * 80, 2.5)
    const g2 = gain(ac, 0)
    g2.gain.setValueAtTime(0, t)
    g2.gain.linearRampToValueAtTime(vel * 0.35, t + 0.0008)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.028)
    n2.connect(f2).connect(g2).connect(ac.destination)
    n2.start(t); n2.stop(t + 0.03)
  }
}

// ── REBUY / BUYIN ─────────────────────────────────────────────────────────
// Heavier stack drop — more chips, more bass, longer tail.
// Distinct from single chip click.
function playRebuy(vol = 1) {
  const ac = ctx()
  const now = ac.currentTime

  // Heavy bass thud
  const thudN = noise(ac, 0.12)
  const thudF = lpf(ac, 160)
  const thudG = gain(ac, 0)
  thudG.gain.setValueAtTime(0, now)
  thudG.gain.linearRampToValueAtTime(vol * 1.1, now + 0.002)
  thudG.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  thudN.connect(thudF).connect(thudG).connect(ac.destination)
  thudN.start(now); thudN.stop(now + 0.12)

  // Wide click burst
  const clickN = noise(ac, 0.05)
  const clickF = bpf(ac, 2800, 2)
  const clickG = gain(ac, 0)
  clickG.gain.setValueAtTime(0, now)
  clickG.gain.linearRampToValueAtTime(vol * 0.65, now + 0.001)
  clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
  clickN.connect(clickF).connect(clickG).connect(ac.destination)
  clickN.start(now); clickN.stop(now + 0.05)

  // 3 quick settling chips
  ;[0.045, 0.09, 0.13].forEach((delay, i) => {
    const t = now + delay
    const v = vol * (0.55 - i * 0.12)

    const sn = noise(ac, 0.05)
    const sf = lpf(ac, 240 - i * 20)
    const sg = gain(ac, 0)
    sg.gain.setValueAtTime(0, t)
    sg.gain.linearRampToValueAtTime(v, t + 0.001)
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
    sn.connect(sf).connect(sg).connect(ac.destination)
    sn.start(t); sn.stop(t + 0.05)

    const cn = noise(ac, 0.025)
    const cf = bpf(ac, 3200 - i * 100, 3)
    const cg = gain(ac, 0)
    cg.gain.setValueAtTime(0, t)
    cg.gain.linearRampToValueAtTime(v * 0.4, t + 0.001)
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02)
    cn.connect(cf).connect(cg).connect(ac.destination)
    cn.start(t); cn.stop(t + 0.025)
  })
}

// ── CARD DEAL ─────────────────────────────────────────────────────────────
// Crisp paper flutter + soft felt landing.
// Sounds nothing like a chip — high-freq flutter first, then a soft thud.
function playCard(vol = 1) {
  const ac = ctx()
  const now = ac.currentTime

  // Flutter (high-pass noise, very short)
  const fn = noise(ac, 0.06)
  const ff = hpf(ac, 4000)
  const fg = gain(ac, 0)
  fg.gain.setValueAtTime(0, now)
  fg.gain.linearRampToValueAtTime(vol * 0.3, now + 0.003)
  fg.gain.setValueAtTime(vol * 0.3, now + 0.012)
  fg.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
  fn.connect(ff).connect(fg).connect(ac.destination)
  fn.start(now); fn.stop(now + 0.06)

  // Felt landing thud — appears just after the flutter
  const tn = noise(ac, 0.07)
  const tf = lpf(ac, 280)
  const tg = gain(ac, 0)
  tg.gain.setValueAtTime(0, now + 0.015)
  tg.gain.linearRampToValueAtTime(vol * 0.5, now + 0.018)
  tg.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
  tn.connect(tf).connect(tg).connect(ac.destination)
  tn.start(now + 0.015); tn.stop(now + 0.08)
}

// ── DING (winner / session end) ────────────────────────────────────────────
// Modern, warm bell. Not a 16-bit blip — use a real marimba-ish tone:
// fundamental + stretched overtones with slow exponential decay.
function playDing(vol = 1) {
  const ac = ctx()
  const now = ac.currentTime

  // Main tone
  const o1 = osc(ac, 740) // slightly detuned for warmth
  const g1 = gain(ac, 0)
  g1.gain.setValueAtTime(0, now)
  g1.gain.linearRampToValueAtTime(vol * 0.55, now + 0.003)
  g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
  o1.connect(g1).connect(ac.destination)
  o1.start(now); o1.stop(now + 1.3)

  // 2nd harmonic (slightly sharp — marimba inharmonicity)
  const o2 = osc(ac, 1510)
  const g2 = gain(ac, 0)
  g2.gain.setValueAtTime(0, now)
  g2.gain.linearRampToValueAtTime(vol * 0.22, now + 0.002)
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
  o2.connect(g2).connect(ac.destination)
  o2.start(now); o2.stop(now + 0.7)

  // 3rd harmonic
  const o3 = osc(ac, 2350)
  const g3 = gain(ac, 0)
  g3.gain.setValueAtTime(0, now)
  g3.gain.linearRampToValueAtTime(vol * 0.08, now + 0.001)
  g3.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  o3.connect(g3).connect(ac.destination)
  o3.start(now); o3.stop(now + 0.3)

  // Attack transient — mallet hit noise
  const an = noise(ac, 0.02)
  const af = bpf(ac, 2000, 1.5)
  const ag = gain(ac, 0)
  ag.gain.setValueAtTime(0, now)
  ag.gain.linearRampToValueAtTime(vol * 0.2, now + 0.002)
  ag.gain.exponentialRampToValueAtTime(0.001, now + 0.015)
  an.connect(af).connect(ag).connect(ac.destination)
  an.start(now); an.stop(now + 0.02)
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

export function initSounds() {
  if (_initialized) return
  _initialized = true
  // Resume AudioContext on first user interaction (browser policy)
  const resume = () => {
    if (_ctx) _ctx.resume()
    else _ctx = new AudioContext()
    document.removeEventListener('pointerdown', resume)
  }
  document.addEventListener('pointerdown', resume)
}

export const sfx = {
  chip:    (vol = 0.85) => playChip(vol),
  rebuy:   (vol = 0.90) => playRebuy(vol),
  card:    (vol = 0.75) => playCard(vol),
  ding:    (vol = 0.80) => playDing(vol),
  shuffle: (vol = 0.85) => playShuffle(vol),
}
