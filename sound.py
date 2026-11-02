"""Música y efectos de sonido sintetizados desde cero (numpy). Nada de samples de terceros.

Uso: python sound.py video/public/02
  -> video/public/02/music.wav (sigue la línea de tiempo de data.json y baja cuando habla la voz)
  -> video/public/sfx2/*.wav
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
FPS, GAP, END = 30, 0.12, 45  # igual que Short.tsx
rng = np.random.default_rng(7)


# ---------- utilidades ----------
def T(d):
    return np.arange(int(d * SR)) / SR


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x, axis=-1)


def noise(n):
    return rng.standard_normal(n)


def phase(freq):
    return np.cumsum(np.broadcast_to(freq, freq.shape)) / SR


def saw(freq):
    return 2 * (phase(freq) % 1) - 1


def sine(freq):
    return np.sin(2 * np.pi * phase(freq))


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.full(n, float(s))
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr:
        e[-nr:] *= np.linspace(1, 0, min(nr, n))[-len(e[-nr:]):]
    return e


def pan(x, p=0.0):
    a = (p + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])


def stereo(x):
    return x if x.ndim == 2 else pan(x)


_IR = {}


def reverb(x, decay=2.2, mix=0.3):
    x = stereo(x)
    if decay not in _IR:
        t = T(decay)
        ir = noise((2, len(t))) * np.exp(-t * 6.9 / decay)
        ir = filt(ir, 'low', 5000)
        _IR[decay] = ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    ir = _IR[decay]
    wet = np.vstack([fftconvolve(x[c], ir[c])[: x.shape[1] + ir.shape[1] // 2] for c in range(2)])
    out = np.zeros_like(wet)
    out[:, : x.shape[1]] = x * (1 - mix)
    return out + wet * mix


def svf(x, fc, q=0.8, mode='band'):
    """Filtro variable en el tiempo (para barridos)."""
    low = band = 0.0
    out = np.empty_like(x)
    fco = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    for i in range(len(x)):
        high = x[i] - low - q * band
        band += fco[i] * high
        low += fco[i] * band
        out[i] = band if mode == 'band' else low
    return out


def norm(x, peak=0.9):
    return x * (peak / (np.max(np.abs(x)) + 1e-9))


def save(path, x):
    x = stereo(x)
    pcm = (np.clip(x.T, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------- instrumentos ----------
def kick(d=0.5):
    t = T(d)
    f = 45 + 110 * np.exp(-t * 30)
    return np.tanh(2.2 * sine(f) * np.exp(-t * 7)) + 0.3 * noise(len(t)) * np.exp(-t * 300)


def clap(d=0.4):
    t = T(d)
    e = sum(np.exp(-np.clip(t - k, 0, None) * 120) * (t >= k) for k in (0, 0.011, 0.022))
    e += 0.35 * np.exp(-t * 14)
    return filt(noise(len(t)), 'band', [900, 5000]) * e * 0.8


def hat(d=0.08):
    t = T(d)
    return filt(noise(len(t)), 'high', 7000) * np.exp(-t * 70) * 0.5


def taiko(d=1.0):
    t = T(d)
    body = sine(48 + 40 * np.exp(-t * 18)) * np.exp(-t * 4.5)
    skin = filt(noise(len(t)), 'low', 900) * np.exp(-t * 25) * 0.6
    return np.tanh(1.8 * (body + skin))


def pluck(freq, d=0.7, decay=0.995):
    n = int(d * SR)
    N = int(SR / freq)
    blocks = n // N + 2
    cur = filt(rng.uniform(-1, 1, N), 'low', 6000)
    y = np.empty(blocks * N)
    for b in range(blocks):
        y[b * N:(b + 1) * N] = cur
        cur = decay * 0.5 * (cur + np.roll(cur, -1))
    # corregir afinación: N es entero
    src = np.arange(n) * (freq * N / SR)
    return np.interp(src, np.arange(len(y)), y) * np.exp(-np.arange(n) / SR * 2.5)


def bell(freq, d=2.0):
    t = T(d)
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * 2.2 * np.exp(-t * 3)
    return np.sin(2 * np.pi * freq * t + mod) * np.exp(-t * 2.0) * adsr(len(t), 0.003, 0.05, 1, 0.05)


def pad(notes, d, cutoff=1400):
    t = T(d)
    out = np.zeros((2, len(t)))
    for k, m in enumerate(notes):
        for j, cents in enumerate((-9, 0, 8)):
            v = saw(np.full(len(t), mtof(m) * 2 ** (cents / 1200)))
            out += pan(v, (-0.6, 0, 0.6)[j] * (1 if k % 2 else -1))
    out = filt(out, 'low', cutoff)
    return out * adsr(len(t), 0.6, 0.2, 0.9, 0.8) / (len(notes) * 3)


def bass(freq, d):
    t = T(d)
    x = 0.6 * saw(np.full(len(t), freq)) + 0.8 * sine(np.full(len(t), freq / 2))
    return filt(np.tanh(1.5 * x), 'low', 500) * adsr(len(t), 0.005, 0.15, 0.6, 0.06)


# ---------- efectos ----------
def fx_whoosh(d=0.55, up=True):
    t = T(d)
    fc = 300 + 3200 * np.sin(np.pi * t / d) ** 2 if up else 2500 * np.exp(-t * 4) + 300
    x = svf(noise(len(t)), fc, 0.5) * np.sin(np.pi * t / d) ** 1.5
    p = np.linspace(-0.8, 0.8, len(t))
    return reverb(np.vstack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)]), 1.2, 0.25)


def fx_impact(d=4.5):
    t = T(d)
    sub = sine(25 + 65 * np.exp(-t * 3)) * np.exp(-t * 1.3)
    crack = np.tanh(4 * filt(noise(len(t)), 'high', 1800) * np.exp(-t * 40))
    body = filt(noise(len(t)), 'low', 450) * np.exp(-t * 2.2) * 1.4
    rumble = filt(noise(len(t)), 'low', 110) * np.exp(-t * 0.8) * 2.2
    return reverb(np.tanh(1.3 * (sub + 0.6 * crack + body + rumble)), 3.0, 0.35)


def fx_braam(d=3.0):
    t = T(d)
    x = sum(saw(np.full(len(t), mtof(m) * 2 ** (c / 1200))) for m in (38, 45, 50) for c in (-12, 0, 11))
    fc = 150 + 1500 * np.sin(np.pi * np.clip(t / 1.4, 0, 1)) ** 2 * np.exp(-t * 0.6)
    y = np.tanh(2 * svf(x / 9, fc, 0.4, 'low'))
    return reverb(y * adsr(len(t), 0.04, 0.3, 0.8, 1.2), 3.0, 0.3)


def fx_riser(d=2.6):
    t = T(d)
    tone = saw(220 * 2 ** (2.5 * t / d)) * 0.25
    nz = svf(noise(len(t)), 400 + 7000 * (t / d) ** 2, 0.6)
    return reverb((tone + nz) * (t / d) ** 2, 1.5, 0.3)


def fx_hit(d=2.0):
    t = T(d)
    x = sine(55 + 120 * np.exp(-t * 25)) * np.exp(-t * 4) + filt(noise(len(t)), 'band', [200, 3000]) * np.exp(-t * 18)
    return reverb(np.tanh(1.8 * x), 2.5, 0.4)


def fx_pop(d=0.18):
    t = T(d)
    return pan(sine(1500 * np.exp(-t * 14) + 300) * np.exp(-t * 28) * 0.7, 0)


def fx_step(d=1.4):
    t = T(d)
    x = sine(32 + 60 * np.exp(-t * 18)) * np.exp(-t * 5) + filt(noise(len(t)), 'low', 250) * np.exp(-t * 6)
    return reverb(np.tanh(2 * x), 1.8, 0.3)


def fx_roar(d=2.4):
    t = T(d)
    contour = 1 + 0.5 * np.exp(-((t - 0.55) / 0.45) ** 2)
    jitter = filt(noise(len(t)), 'low', 12) * 6
    f0 = (70 + jitter) * contour
    src = saw(f0) + 0.7 * saw(f0 * 1.013) + 0.9 * noise(len(t))
    src *= 1 + 0.6 * np.sin(2 * np.pi * 28 * t)
    form = filt(src, 'band', [250, 700]) + 0.7 * filt(src, 'band', [900, 1500]) + 0.25 * filt(src, 'band', [2200, 3000])
    y = np.tanh(2.5 * form) * adsr(len(t), 0.12, 0.3, 0.8, 0.9)
    return reverb(y, 2.4, 0.35)


def fx_freeze(d=2.0):
    t = T(d)
    cracks = np.zeros(len(t))
    for _ in range(40):
        i = rng.integers(0, len(t) - 2000)
        cracks[i:i + 600] += noise(600) * np.exp(-np.arange(600) / 60)
    shimmer = sum(np.sin(2 * np.pi * mtof(m) * t) for m in (86, 93, 98)) * 0.15 * np.exp(-t * 1.5)
    return reverb(filt(cracks, 'high', 2500) * 0.6 + shimmer, 2.5, 0.4)


def fx_sparkle(d=2.2):
    out = np.zeros(int(d * SR))
    for k, m in enumerate((84, 88, 91, 96, 100, 103)):
        i = int(k * 0.09 * SR)
        b = (bell(mtof(m), d - k * 0.09) * 0.25)[: len(out) - i]
        out[i:i + len(b)] += b
    return reverb(out, 2.5, 0.45)


def fx_wind(d=6.0):
    t = T(d)
    fc = 500 + 350 * np.sin(2 * np.pi * 0.23 * t) + 200 * np.sin(2 * np.pi * 0.61 * t)
    x = svf(noise(len(t)), fc, 0.25) * adsr(len(t), 1.0, 0.1, 1, 1.5) * 0.8
    return reverb(pan(x, 0), 1.5, 0.3)


def fx_ding(d=2.5):
    return reverb(bell(mtof(88), d) * 0.6 + bell(mtof(95), d) * 0.35, 2.5, 0.35)


def fx_reverse(d=1.6):
    return fx_hit(d)[:, ::-1][:, -int(d * SR):] * np.linspace(0, 1, int(d * SR)) ** 2


def fx_tick2(d=0.25):
    t = T(d)
    click = filt(noise(len(t)), 'band', [2000, 6000]) * np.exp(-t * 400)
    body = np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 80) * 0.5 + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60) * 0.3
    return reverb(click + body, 0.8, 0.2)


def fx_buzzer(d=0.7):
    t = T(d)
    x = saw(np.full(len(t), 220.0)) * 0.5 + saw(np.full(len(t), 277.2)) * 0.4
    return reverb(filt(x, 'low', 1800) * adsr(len(t), 0.01, 0.1, 0.8, 0.15) * 0.6, 1.0, 0.2)


def fx_sniff(d=1.4):
    out = np.zeros(int(d * SR))
    for k, st in enumerate((0.0, 0.32, 0.62)):
        n = int(0.24 * SR)
        tt = np.arange(n) / SR
        b = svf(noise(n), 900 + 1600 * tt / 0.24, 0.6) * np.sin(np.pi * tt / 0.24) ** 2
        i = int(st * SR)
        out[i:i + n] += b * (1 - 0.15 * k)
    return reverb(filt(out, 'low', 4000), 0.8, 0.2)


def fx_crack(d=1.6):
    t = T(d)
    snap = np.tanh(6 * filt(noise(len(t)), 'high', 1200) * np.exp(-t * 90))
    knock = sine(320 * np.exp(-t * 8)) * np.exp(-t * 30) * 0.6
    crumble = np.zeros(len(t))
    for _ in range(25):
        i = rng.integers(int(0.03 * SR), int(0.6 * SR))
        crumble[i:i + 400] += noise(400) * np.exp(-np.arange(400) / 50) * 0.4
    return reverb(snap + knock + filt(crumble, 'high', 2500), 1.2, 0.25)


SFX = {
    'whoosh': fx_whoosh, 'whoosh2': lambda: fx_whoosh(0.4, False), 'impact': fx_impact, 'braam': fx_braam,
    'riser': fx_riser, 'hit': fx_hit, 'pop': fx_pop, 'step': fx_step, 'roar': fx_roar, 'freeze': fx_freeze,
    'sparkle': fx_sparkle, 'wind': fx_wind, 'ding': fx_ding, 'reverse': fx_reverse,
    'tick2': fx_tick2, 'buzzer': fx_buzzer, 'sniff': fx_sniff, 'crack': fx_crack, 'swish': lambda: fx_whoosh(0.3, True),
}


def fx_horn(d=0.9):
    t = T(d)
    x = 0.5 * np.sign(np.sin(2 * np.pi * 392 * t)) + 0.4 * np.sign(np.sin(2 * np.pi * 494 * t))
    env = adsr(len(t), 0.02, 0.05, 0.9, 0.12) * (t < 0.32) + adsr(len(t), 0.02, 0.05, 0.9, 0.2) * (t > 0.4)
    return reverb(filt(x, 'low', 2200) * env * 0.5, 1.2, 0.25)


def fx_glass(d=0.9):
    out = np.zeros(int(d * SR))
    for k in range(30):
        i = rng.integers(0, int(0.6 * SR))
        f = 2500 + rng.random() * 3500
        n = int(0.08 * SR)
        tt = np.arange(n) / SR
        out[i:i + n] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 60) * 0.3
    return reverb(out, 0.8, 0.25)


def fx_toc(d=0.4):
    t = T(d)
    x = sine(260 * np.exp(-t * 6)) * np.exp(-t * 28) + filt(noise(len(t)), 'band', [800, 3000]) * np.exp(-t * 80) * 0.4
    return reverb(x, 0.8, 0.2)


SFX.update({'horn': fx_horn, 'glass': fx_glass, 'toc': fx_toc})


def fx_cluck(d=0.9):
    out = np.zeros(int(d * SR))
    for k, (st, ln, f0) in enumerate(((0.0, 0.09, 620), (0.17, 0.09, 600), (0.36, 0.22, 760))):
        n = int(ln * SR)
        tt = np.arange(n) / SR
        f = f0 * (1 + 0.25 * np.exp(-tt * 30)) * (1 - 0.2 * tt / ln)
        x = saw(f) * 0.6 + noise(n) * 0.25
        x = filt(x, 'band', [700, 2600]) * np.exp(-tt * (18 if k < 2 else 6)) * np.minimum(1, tt * 300)
        i = int(st * SR)
        out[i:i + n] += x
    return reverb(out, 0.6, 0.15)


def fx_chirp(d=0.5):
    out = np.zeros(int(d * SR))
    for st in (0.0, 0.14):
        n = int(0.08 * SR)
        tt = np.arange(n) / SR
        x = np.sin(2 * np.pi * np.cumsum(3000 + 2500 * tt / 0.08) / SR) * np.sin(np.pi * tt / 0.08)
        out[int(st * SR):int(st * SR) + n] += x * 0.5
    return reverb(out, 0.8, 0.25)


SFX.update({'cluck': fx_cluck, 'chirp': fx_chirp})


def fx_drip(d=0.6):
    t = T(d)
    x = np.sin(2 * np.pi * np.cumsum(500 + 1600 * np.minimum(1, t / 0.05)) / SR) * np.exp(-t * 30)
    return reverb(x, 1.0, 0.3)


def fx_blub(d=0.7):
    out = np.zeros(int(d * SR))
    for k, st in enumerate((0.0, 0.12, 0.2, 0.34)):
        n = int(0.07 * SR)
        tt = np.arange(n) / SR
        f = (260 + k * 70) * (1 + 1.6 * tt / 0.07)
        out[int(st * SR):int(st * SR) + n] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.07) * 0.6
    return reverb(filt(out, 'low', 1800), 0.7, 0.25)


def fx_skitter(d=0.8):
    out = np.zeros(int(d * SR))
    for k in range(24):
        i = int((k * 0.03 + rng.uniform(0, 0.01)) * SR)
        n = int(0.004 * SR)
        out[i:i + n] += noise(n) * np.exp(-np.arange(n) / SR * 900) * rng.uniform(0.4, 1)
    return filt(out, 'band', [1800, 6500])


def fx_crunch(d=0.35):
    out = np.zeros(int(d * SR))
    for k in range(9):
        i = int(rng.uniform(0, 0.22) * SR)
        n = int(0.03 * SR)
        out[i:i + n] += noise(n) * np.exp(-np.arange(n) / SR * 120)
    return filt(out, 'band', [900, 5000])


def fx_growl(d=1.0):
    t = T(d)
    f = 75 + 15 * np.sin(2 * np.pi * 3 * t)
    x = filt(saw(f), 'low', 320) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * t / d)
    return x


def fx_splash(d=1.2):
    t = T(d)
    x = filt(noise(len(t)), 'band', [500, 5000]) * np.exp(-t * 7) * 0.7
    x += sine(90 * np.exp(-t * 8) + 40) * np.exp(-t * 12)
    return reverb(x, 1.0, 0.25)


SFX.update({'drip': fx_drip, 'blub': fx_blub, 'skitter': fx_skitter, 'crunch': fx_crunch, 'growl': fx_growl, 'splash': fx_splash})


# ---------- música ----------
def place(buf, x, at, gain=1.0):
    x = stereo(x)
    i = int(at * SR)
    if i >= buf.shape[1]:
        return
    j = min(buf.shape[1], i + x.shape[1])
    buf[:, i:j] += x[:, : j - i] * gain


def compose(starts, total, speech):
    beat = 0.6  # 100 BPM
    q = lambda s: round(s / beat) * beat
    s = [q(x) for x in starts] + [total]
    mus = np.zeros((2, int((total + 3) * SR)))
    Dm, Bb, Gm, A, F, C = (50, 53, 57), (46, 50, 53), (43, 46, 50), (45, 49, 52), (41, 45, 48), (48, 52, 55)

    def chords(a, b, prog, bars=1, cutoff=1400, gain=1.0):
        t, k = a, 0
        while t < b - 0.01:
            d = min(4 * beat * bars, b - t)
            place(mus, pad(prog[k % len(prog)], d + 0.8, cutoff), t, gain)
            t, k = t + d, k + 1

    def grid(a, b, step=beat):
        return np.arange(a, b - 1e-6, step)

    # A: tensión (escena 1): bajo pulsante, taikos, pad Dm, riser al impacto
    a, b = 0, s[1]
    chords(a, b, [Dm], 2, 900)
    for t in grid(a, b, beat / 2):
        place(mus, bass(mtof(38), beat / 2 * 0.9), t, 0.55)
    for i, t in enumerate(grid(a, b)):
        place(mus, taiko(), t, 0.5 if i % 2 else 0.8)
    # B: impacto y desastre (escenas 2-3): drone oscuro, campanas lejanas, latido lento
    a, b = s[1], s[3]
    chords(a, b, [Dm, Bb, Gm, A], 1, 700, 1.2)
    for t in grid(a, b, beat * 2):
        place(mus, taiko(1.2), t, 0.35)
    for t, m in zip(grid(a + beat * 2, b, beat * 3), [86, 81, 89, 84, 81, 86, 77]):
        place(mus, reverb(bell(mtof(m), 2.5), 3.0, 0.6), t, 0.18)
    # C: esperanza (escena 4): acordes mayores + arpegio suave
    a, b = s[3], s[4]
    prog = [F, C, Dm, Bb]
    chords(a, b, prog, 1, 1800)
    for i, t in enumerate(grid(a, b, beat / 2)):
        ch = prog[int((t - a) // (4 * beat)) % 4]
        m = [ch[0] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12][i % 4]
        place(mus, pan(pluck(mtof(m), 0.9), 0.3 if i % 2 else -0.3), t, 0.35)
    for t in grid(a, b, beat * 2):
        place(mus, kick(), t, 0.5)
    # D: "Imagina el mundo hoy": silencio tenso (lo llenan sparkle + riser en la escena)
    # E y G: groove; F: corte emocional
    melody = {  # (beat, midi, largo en beats) por acorde
        0: [(0, 81, 1), (1, 84, .5), (1.5, 81, .5), (2, 79, 1), (3, 77, 1)],
        1: [(0, 79, 1), (1, 76, .5), (1.5, 79, .5), (2, 84, 1.5)],
        2: [(0, 81, 1), (1, 77, .5), (1.5, 81, .5), (2, 86, 1.5)],
        3: [(0, 86, 1), (1, 84, .5), (1.5, 82, .5), (2, 81, 2)],
    }

    def groove(a, b, drums=True, mel=True, arp=True):
        chords(a, b, prog, 1, 2200, 0.9)
        for i, t in enumerate(grid(a, b, beat / 4)):
            k = int((t - a) // (4 * beat)) % 4
            ch = prog[k]
            if arp and i % 2 == 0:
                m = [ch[0] + 24, ch[2] + 12, ch[1] + 24, ch[2] + 24][(i // 2) % 4]
                place(mus, pan(pluck(mtof(m), 0.6), 0.4 if (i // 2) % 2 else -0.4), t, 0.3)
            if drums:
                if i % 4 == 0:
                    root = ch[0] - 12 * ((ch[0] - 36) // 12)  # raíz entre C2 y B2
                    place(mus, bass(mtof(root + (12 if (i // 4) % 4 == 3 else 0)), beat * 0.9), t, 0.5)
                if i % 16 in (0, 10):
                    place(mus, kick(), t, 0.85)
                if i % 16 in (4, 12):
                    place(mus, clap(), t, 0.6)
                if i % 2 == 0:
                    place(mus, pan(hat(), 0.25), t, 0.35 if i % 4 else 0.2)
        if mel:
            bar = 4 * beat
            for n in range(int(np.ceil((b - a) / bar))):
                for bt, m, ln in melody[n % 4]:
                    t = a + n * bar + bt * beat
                    if t < b:
                        place(mus, reverb(bell(mtof(m), ln * beat + 0.8), 1.8, 0.35), t, 0.22)

    groove(s[5], s[6])
    groove(s[6], s[7], drums=False, arp=False)
    groove(s[7], total)
    place(mus, reverb(pad(F, 3.0, 2500), 3.0, 0.4), total - 0.2, 1.0)

    mus = reverb(mus, 2.0, 0.15)[:, : int((total + 1.5) * SR)]
    # baja la música cuando habla la voz (ducking)
    g = np.ones(mus.shape[1])
    for a, b in speech:
        g[int(a * SR):int(b * SR)] = 0.45
    k = np.hanning(int(0.25 * SR))
    g = np.convolve(g, k / k.sum(), mode='same')
    mus = mus * g
    return norm(mus, 0.55)


def duck(mus, speech, level):
    g = np.ones(mus.shape[1])
    for a, b in speech:
        g[int(a * SR):int(b * SR)] = level
    k = np.hanning(int(0.25 * SR))
    return mus * np.convolve(g, k / k.sum(), mode='same')


def compose_trex(s, total, speech, cd0, crack):
    """T-Rex: tensión -> latido del contrarreloj -> persecución -> sigilo -> bici alegre -> silencio y crack -> cierre."""
    beat = 0.5  # 120 BPM
    mus = np.zeros((2, int((total + 3) * SR)))
    Am, F, C, G = (57, 60, 64), (53, 57, 60), (55, 60, 64), (55, 59, 62)
    root = {Am: 45, F: 41, C: 36, G: 43}

    def grid(a, b, step):
        return np.arange(a, b - 1e-6, step)

    def chords(a, b, prog, cutoff, gain):
        t, k = a, 0
        while t < b - 0.01:
            d = min(4 * beat, b - t)
            place(mus, pad(prog[k % len(prog)], d + 0.8, cutoff), t, gain)
            t, k = t + d, k + 1

    melody = {
        C: [(0, 76, 1), (1, 79, .5), (1.5, 76, .5), (2, 84, 1), (3, 79, 1)],
        G: [(0, 74, 1), (1, 79, .5), (1.5, 74, .5), (2, 83, 2)],
        Am: [(0, 76, 1), (1, 81, .5), (1.5, 79, .5), (2, 76, 1), (3, 72, 1)],
        F: [(0, 77, 1), (1, 81, .5), (1.5, 77, .5), (2, 79, 2)],
    }

    def groove(a, b, prog, drums='full', mel=False, gain=1.0):
        chords(a, b, prog, 2000, 0.7 * gain)
        for i, t in enumerate(grid(a, b, beat / 2)):
            ch = prog[int((t - a) // (4 * beat)) % len(prog)]
            if drums == 'full' and i % 2 == 0:
                place(mus, kick(), t, 0.5 * gain)
            if drums == 'half' and i % 4 == 0:
                place(mus, kick(), t, 0.45 * gain)
            if i % 4 == 2:
                place(mus, clap(), t, 0.28 * gain)
            place(mus, pan(hat(), 0.25), t, (0.13 if i % 2 else 0.07) * gain)
            place(mus, bass(mtof(root[ch] + (12 if i % 2 else 0)), beat / 2 * 0.9), t, 0.3 * gain)
            m = [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[2]][i % 4]
            place(mus, pan(pluck(mtof(m), 0.5), 0.35 if i % 2 else -0.35), t, 0.18 * gain)
        if mel:
            bar = 4 * beat
            for n in range(int(np.ceil((b - a) / bar))):
                for bt, m, ln in melody[prog[n % len(prog)]]:
                    t = a + n * bar + bt * beat
                    if t < b:
                        place(mus, reverb(bell(mtof(m), ln * beat + 0.6), 1.6, 0.35), t, 0.15 * gain)

    # 1) tensión hasta que arranca el contrarreloj
    chords(0, cd0, [Am], 700, 0.8)
    for t in grid(0, cd0, beat / 2):
        place(mus, bass(mtof(45), beat / 2 * 0.8), t, 0.25)
    for i, t in enumerate(grid(0, cd0, beat)):
        place(mus, taiko(0.8), t, 0.2 if i % 2 else 0.3)
    # 2) contrarreloj: latido; se corta en "¡TIEMPO!"
    place(mus, pad(Am, 3.0, 500), cd0, 0.5)
    for t in grid(cd0, cd0 + 3, 0.5):
        place(mus, kick(), t, 0.4)
    # 3) persecución
    groove(s[2], s[3], [Am, F, C, G])
    # 4) sigilo: pizzicato con silencios
    chords(s[3], s[4], [Am, F], 900, 0.45)
    pattern = [1, 0, 1, 1, 0, 1, 0, 0]
    for i, t in enumerate(grid(s[3], s[4], beat / 2)):
        ch = [Am, F][int((t - s[3]) // (4 * beat)) % 2]
        if pattern[i % 8]:
            place(mus, pan(pluck(mtof(ch[i % 3] + 12), 0.25, 0.99), 0.3 if i % 2 else -0.3), t, 0.26)
        if i % 4 == 0:
            place(mus, bass(mtof(root[ch]), beat * 0.8), t, 0.28)
    # 5) bici: alegre con melodía
    groove(s[4], s[5], [C, G, Am, F], mel=True)
    # 6) mordida: drone, silencio, golpe
    place(mus, pad(Am, max(0.5, crack - 0.35 - s[5]), 600), s[5], 0.55)
    place(mus, taiko(1.5), crack, 0.45)
    place(mus, pad((45, 52, 57), max(0.5, s[6] - crack), 500), crack + 0.1, 0.45)
    # 7) cierre
    groove(s[6], total, [C, G, Am, F], drums='half', mel=True, gain=0.85)
    place(mus, reverb(pad(C, 3.0, 2500), 3.0, 0.4), total - 0.3, 0.9)
    mus = reverb(mus, 1.6, 0.12)[:, : int((total + 1.5) * SR)]
    return norm(duck(mus, speech, 0.4), 0.4)


def compose_argento(s, total, speech, danger):
    """Mañana curiosa (C G Am F) -> tensión desde "peligro" -> cierre alegre."""
    beat = 0.5
    mus = np.zeros((2, int((total + 3) * SR)))
    C, G, Am, F = (55, 60, 64), (55, 59, 62), (57, 60, 64), (53, 57, 60)
    root = {C: 36, G: 43, Am: 45, F: 41}

    def grid(a, b, step):
        return np.arange(a, b - 1e-6, step)

    def chords(a, b, prog, cutoff, gain):
        t, k = a, 0
        while t < b - 0.01:
            d = min(4 * beat, b - t)
            place(mus, pad(prog[k % len(prog)], d + 0.8, cutoff), t, gain)
            t, k = t + d, k + 1

    mel = {
        C: [(0, 76, 1), (1, 79, .5), (1.5, 76, .5), (2, 84, 1), (3, 79, 1)],
        G: [(0, 74, 1), (1, 79, .5), (1.5, 74, .5), (2, 83, 2)],
        Am: [(0, 76, 1), (1, 81, .5), (1.5, 79, .5), (2, 76, 1), (3, 72, 1)],
        F: [(0, 77, 1), (1, 81, .5), (1.5, 77, .5), (2, 79, 2)],
    }

    def groove(a, b, prog, drums=True, bells=True, gain=1.0):
        chords(a, b, prog, 2200, 0.65 * gain)
        for i, t in enumerate(grid(a, b, beat / 2)):
            ch = prog[int((t - a) // (4 * beat)) % len(prog)]
            if drums:
                if i % 4 == 0:
                    place(mus, kick(), t, 0.42 * gain)
                if i % 8 == 4:
                    place(mus, clap(), t, 0.25 * gain)
                place(mus, pan(hat(), 0.25), t, (0.11 if i % 2 else 0.06) * gain)
                if i % 2 == 0:
                    place(mus, bass(mtof(root[ch]), beat * 0.45), t, 0.28 * gain)
            m = [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[2]][i % 4]
            place(mus, pan(pluck(mtof(m), 0.5), 0.35 if i % 2 else -0.35), t, 0.16 * gain)
        if bells:
            bar = 4 * beat
            for n in range(int(np.ceil((b - a) / bar))):
                for bt, m, ln in mel[prog[n % len(prog)]]:
                    t = a + n * bar + bt * beat
                    if t < b:
                        place(mus, reverb(bell(mtof(m), ln * beat + 0.6), 1.6, 0.35), t, 0.13 * gain)

    groove(0, s[1], [C, G, Am, F], bells=False)
    groove(s[1], s[4], [C, G, Am, F])
    groove(s[4], danger, [F, C], drums=False, bells=False, gain=0.8)
    chords(danger, s[5], [(45, 52, 57)], 600, 0.7)
    for i, t in enumerate(grid(danger, s[5], beat)):
        place(mus, taiko(0.9), t, 0.3 if i % 2 else 0.4)
    for t in grid(danger, s[5], beat / 2):
        place(mus, bass(mtof(33 + 12), beat / 2 * 0.8), t, 0.25)
    groove(s[5], total, [C, G, Am, F], gain=0.85)
    place(mus, reverb(pad(C, 3.0, 2500), 3.0, 0.4), total - 0.3, 0.9)
    mus = reverb(mus, 1.6, 0.12)[:, : int((total + 1.5) * SR)]
    return norm(duck(mus, speech, 0.4), 0.4)


def compose_pollo(s, total, speech, punch):
    """Juguetona (C G Am F). Pausa cómica en "dinosaurio" y después ritmo hasta el final."""
    beat = 0.5
    mus = np.zeros((2, int((total + 3) * SR)))
    C, G, Am, F = (55, 60, 64), (55, 59, 62), (57, 60, 64), (53, 57, 60)
    root = {C: 36, G: 43, Am: 45, F: 41}
    prog = [C, G, Am, F]
    mel = {
        C: [(0, 76, .5), (.5, 79, .5), (1, 84, 1), (2.5, 79, .5), (3, 76, 1)],
        G: [(0, 74, .5), (.5, 79, .5), (1, 83, 1), (2.5, 79, 1.5)],
        Am: [(0, 76, .5), (.5, 81, .5), (1, 84, 1), (2.5, 81, .5), (3, 79, 1)],
        F: [(0, 77, .5), (.5, 81, .5), (1, 84, 1), (2.5, 81, 1.5)],
    }

    def grid(a, b, step):
        return np.arange(a, b - 1e-6, step)

    def section(a, b, drums=True, bells=True, gain=1.0):
        t, k = a, 0
        while t < b - 0.01:
            d = min(4 * beat, b - t)
            place(mus, pad(prog[k % 4], d + 0.8, 2400), t, 0.55 * gain)
            t, k = t + d, k + 1
        for i, t in enumerate(grid(a, b, beat / 2)):
            ch = prog[int((t - a) // (4 * beat)) % 4]
            if drums:
                if i % 4 == 0:
                    place(mus, kick(), t, 0.42 * gain)
                if i % 8 == 4:
                    place(mus, clap(), t, 0.26 * gain)
                place(mus, pan(hat(), 0.25), t, (0.11 if i % 2 else 0.06) * gain)
                if i % 2 == 0:
                    place(mus, bass(mtof(root[ch] + (12 if i % 4 == 2 else 0)), beat * 0.45), t, 0.28 * gain)
            m = [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[2]][i % 4]
            place(mus, pan(pluck(mtof(m), 0.45), 0.35 if i % 2 else -0.35), t, 0.15 * gain)
        if bells:
            bar = 4 * beat
            for n in range(int(np.ceil((b - a) / bar))):
                for bt, m, ln in mel[prog[n % 4]]:
                    t = a + n * bar + bt * beat
                    if t < b:
                        place(mus, reverb(bell(mtof(m), ln * beat + 0.5), 1.5, 0.3), t, 0.12 * gain)

    section(0, punch - 0.15, drums=False, bells=False, gain=0.8)
    section(punch + 0.45, s[6], gain=1.0)
    section(s[6], total, gain=0.85)
    place(mus, reverb(pad(C, 3.0, 2500), 3.0, 0.4), total - 0.3, 0.9)
    mus = reverb(mus, 1.5, 0.12)[:, : int((total + 1.5) * SR)]
    return norm(duck(mus, speech, 0.4), 0.4)


def compose_ant(s, total, speech, sob, corre, gota):
    """Curiosa y alegre -> suspenso en la cuenta regresiva -> alivio -> araña sigilosa y persecución -> gota inquietante -> cierre."""
    beat = 0.5
    mus = np.zeros((2, int((total + 3) * SR)))
    C, G, Am, F, Em = (55, 60, 64), (55, 59, 62), (57, 60, 64), (53, 57, 60), (52, 55, 59)
    root = {C: 36, G: 43, Am: 45, F: 41, Em: 40}
    prog = [C, G, Am, F]
    mel = {
        C: [(0, 76, .5), (.5, 79, .5), (1, 84, 1), (2.5, 79, .5), (3, 76, 1)],
        G: [(0, 74, .5), (.5, 79, .5), (1, 83, 1), (2.5, 79, 1.5)],
        Am: [(0, 76, .5), (.5, 81, .5), (1, 84, 1), (2.5, 81, .5), (3, 79, 1)],
        F: [(0, 77, .5), (.5, 81, .5), (1, 84, 1), (2.5, 81, 1.5)],
    }

    def grid(a, b, step):
        return np.arange(a, b - 1e-6, step)

    def chords(a, b, pr, cutoff, gain):
        t, k = a, 0
        while t < b - 0.01:
            d = min(4 * beat, b - t)
            place(mus, pad(pr[k % len(pr)], d + 0.8, cutoff), t, gain)
            t, k = t + d, k + 1

    def section(a, b, pr=prog, drums=True, bells=True, gain=1.0, step=beat / 2):
        chords(a, b, pr, 2400, 0.55 * gain)
        for i, t in enumerate(grid(a, b, step)):
            ch = pr[int((t - a) // (4 * beat)) % len(pr)]
            if drums:
                if i % 4 == 0:
                    place(mus, kick(), t, 0.42 * gain)
                if i % 8 == 4:
                    place(mus, clap(), t, 0.26 * gain)
                place(mus, pan(hat(), 0.25), t, (0.11 if i % 2 else 0.06) * gain)
                if i % 2 == 0:
                    place(mus, bass(mtof(root[ch] + (12 if i % 4 == 2 else 0)), step * 0.9), t, 0.28 * gain)
            m = [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[2]][i % 4]
            place(mus, pan(pluck(mtof(m), 0.45), 0.35 if i % 2 else -0.35), t, 0.15 * gain)
        if bells:
            bar = 4 * beat
            for n in range(int(np.ceil((b - a) / bar))):
                for bt, m, ln in mel.get(pr[n % len(pr)], []):
                    t = a + n * bar + bt * beat
                    if t < b:
                        place(mus, reverb(bell(mtof(m), ln * beat + 0.5), 1.5, 0.3), t, 0.12 * gain)

    # 1) curiosa, sin batería; 2) camina hasta el borde
    section(0, s[1], drums=False, gain=0.8)
    section(s[1], sob - 0.2, drums=False, bells=False, gain=0.7)
    # cuenta regresiva: latido y pad oscuro
    place(mus, pad(Am, s[2] - sob + 0.3, 600), sob, 0.6)
    for k, t in enumerate(grid(sob + 0.2, s[2] - 0.1, beat * 2)):
        place(mus, kick(), t, 0.42)
        place(mus, kick(), t + 0.22, 0.25)
    # 3) ¡sí!: alivio con ritmo; 4) hambre: más liviano
    section(s[2], s[3], gain=1.0)
    section(s[3], s[4], drums=False, gain=0.8)
    # 5) araña sigilosa (pizzicato con silencios) hasta "corre"; persecución rápida
    chords(s[4], corre, [Am, Em], 800, 0.5)
    pattern = [1, 0, 1, 1, 0, 1, 0, 0]
    for i, t in enumerate(grid(s[4], corre, beat / 2)):
        ch = [Am, Em][int((t - s[4]) // (4 * beat)) % 2]
        if pattern[i % 8]:
            place(mus, pan(pluck(mtof(ch[i % 3] + 12), 0.25, 0.99), 0.3 if i % 2 else -0.3), t, 0.26)
        if i % 4 == 0:
            place(mus, bass(mtof(root[ch]), beat * 0.8), t, 0.28)
    chase_end = s[5] + 1.6
    chords(corre, chase_end, [Am, F, G, Em], 1600, 0.6)
    for i, t in enumerate(grid(corre, chase_end, beat / 4)):
        if i % 2 == 0:
            place(mus, kick(), t, 0.35)
        place(mus, pan(hat(), 0.25), t, 0.09)
        if i % 4 == 0:
            place(mus, taiko(0.8), t, 0.3)
        place(mus, bass(mtof(45 + (12 if i % 2 else 0)), beat / 4 * 0.9), t, 0.22)
    # 6) respiro y gota: drone inquietante y campanitas sueltas
    chords(chase_end, gota, [F, C], 1800, 0.45)
    place(mus, pad((45, 51, 57), s[6] - gota + 0.5, 700), gota, 0.6)
    for t, m in zip(grid(gota + 0.5, s[6] - 0.3, beat * 3), [88, 83, 87, 81, 86, 84, 79]):
        place(mus, reverb(bell(mtof(m), 2.0), 2.5, 0.6), t, 0.12)
    # 7) cierre alegre
    section(s[6], total, gain=0.85)
    place(mus, reverb(pad(C, 3.0, 2500), 3.0, 0.4), total - 0.3, 0.9)
    mus = reverb(mus, 1.5, 0.12)[:, : int((total + 1.5) * SR)]
    return norm(duck(mus, speech, 0.4), 0.4)


def main(folder, mode='asteroide'):
    folder = Path(folder)
    raw = json.loads((folder / 'data.json').read_text(encoding='utf-8'))
    data = raw['scenes']
    extra = raw.get('extra') or []
    starts, speech, f = [], [], 0
    for i, sc in enumerate(data):
        st = f / FPS
        starts.append(st)
        speech += [(st + w['s'] - 0.05, st + w['e'] + 0.1) for w in sc['words']]
        if extra:
            f += int(np.ceil((sc['dur'] + GAP + extra[i]) * FPS))
        else:
            f += int(np.ceil((sc['dur'] + GAP) * FPS)) + (END if i == len(data) - 1 else 0)
    total = f / FPS
    sfx = folder.parent / {'trex': 'sfx3', 'argento': 'sfx3', 'pollo': 'sfx3', 'ant': 'sfx3'}.get(mode, 'sfx2')
    sfx.mkdir(exist_ok=True)
    for name, fn in SFX.items():
        save(sfx / f'{name}.wav', norm(stereo(fn()), 0.9))
    if mode == 'trex':
        cd0 = starts[1] + data[1]['words'][-1]['e'] + 0.15
        crack = starts[5] + next(w['s'] for w in data[5]['words'] if w['w'].startswith('hueso'))
        music = compose_trex(starts, total, speech, cd0, crack)
    elif mode == 'pollo':
        punch = starts[0] + next(w['s'] for w in data[0]['words'] if w['w'].startswith('dinosaurio'))
        music = compose_pollo(starts, total, speech, punch)
    elif mode == 'ant':
        wt = lambda i, k: starts[i] + next(w['s'] for w in data[i]['words'] if w['w'].lower().startswith(k))
        music = compose_ant(starts, total, speech, wt(1, 'sobrevives'), wt(4, 'corre'), wt(5, 'gota'))
    elif mode == 'argento':
        danger = starts[4] + next(w['s'] for w in data[4]['words'] if w['w'].startswith('peligro'))
        music = compose_argento(starts, total, speech, danger)
    else:
        music = compose(starts, total, speech)
    save(folder / 'music.wav', music)
    print('ok', round(total, 2), 's')


if __name__ == '__main__':
    main(*sys.argv[1:])
