"""Mix: voices (timeline.json) + a light marimba/pad bed + UI foley (events.json) → out/mix.wav (48 kHz stereo)."""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf, soxr

LIB = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "lemo-opuscar"
sys.path.insert(0, str(LIB / "core" / "audio"))
import sfx
from sfx import SR, add, lp, hp, noise, env_exp, t_, compress, limit

HERE = Path(__file__).resolve().parent
T = json.loads((HERE / "timeline.json").read_text())
EV = json.loads((HERE / "events.json").read_text())["ev"]
DUR = T["dur"]
N = int(DUR * SR)
L = {l["id"]: l for l in T["lines"]}

# ── voices ────────────────────────────────────────────────────────────────────
voice = np.zeros((N, 2), np.float32)
vmask = np.zeros(N, np.float32)
for l in T["lines"]:
    a, sr = sf.read(HERE / "voice" / f"n_{l['id']}.wav", dtype="float32")
    if a.ndim > 1: a = a.mean(1)
    a = soxr.resample(a, sr, SR)
    a = compress(a, thr=.3, ratio=3)
    add(voice, a, l["t0"], 1.0, -.08 if l["who"] == "boy" else .08)
    s, e = int(l["t0"] * SR), min(N, int(l["t0"] * SR) + len(a))
    vmask[s:e] = 1

# ── music bed: 92 bpm, F major, marimba arpeggio + soft pad + light kick/shaker ─
BPM = 92; beat = 60 / BPM; bar = 4 * beat
def hz(m): return 440 * 2 ** ((m - 69) / 12)
CH = [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 60]]   # Fmaj7 Dm7 Bbmaj7 C
def marimba(f, v):
    d = .9; t = t_(d)
    x = np.sin(2 * np.pi * f * t) * env_exp(d, .32) + .35 * np.sin(2 * np.pi * f * 4 * t) * env_exp(d, .05)
    x[:int(.003 * SR)] *= np.linspace(0, 1, int(.003 * SR))
    return (x * v).astype(np.float32)
def pad(fs, d):
    t = t_(d); x = sum(np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.003 * t) for f in fs)
    e = np.minimum(1, t / .8) * np.minimum(1, (d - t) / .8)
    return lp(x * e, 1400).astype(np.float32) / len(fs)
music = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(11)
order = [0, 2, 1, 3, 2, 1, 3, 2]
drop0, drop1 = -1.0, -1.0                                       # no musical drop in this one
k = 0; t = 0.0
while t < DUR:
    ch = CH[k % 4]
    add(music, pad([hz(m) for m in ch], bar + .8), t, .09)
    for i in range(8):
        tt = t + i * beat / 2
        if drop0 <= tt < drop1: continue
        m = ch[order[i]] + 12 + (12 if i in (3, 7) and rng.random() < .5 else 0)
        add(music, marimba(hz(m), .16 * (1 if i % 2 == 0 else .7)), tt, 1, rng.uniform(-.4, .4))
        sh = hp(noise(.06), 6000) * env_exp(.06, .012)
        add(music, sh.astype(np.float32), tt + .01, .025 * (1.3 if i % 2 else .8), .3)
    for b in (0, 2):
        tb = t + b * beat
        if not drop0 <= tb < drop1: add(music, sfx.thump(.5, 58), tb, .35)
    t += bar; k += 1
g = np.ones(N, np.float32)
tt = np.arange(N) / SR
g *= np.clip(tt / 1.0, 0, 1) * np.clip((DUR - tt) / 2.0, 0, 1)
gap = (tt >= drop0) & (tt < drop1); g[gap] *= .25
# duck under the voice (smoothed mask)
ker = np.ones(int(.15 * SR)) / int(.15 * SR)
duck = np.convolve(vmask, ker, mode="same")
g *= 1 - .55 * duck
music *= g[:, None]

# ── foley from the page's cues ─────────────────────────────────────────────────
fx = np.zeros((N, 2), np.float32)
for e in EV:
    ty, at = e["type"], e["t"]
    if ty == "whoosh": add(fx, sfx.whoosh(.4, 1), at - .1, .22)
    elif ty == "tick": add(fx, sfx.click(1.6, 1), at, .12, .2)
    elif ty == "pop": add(fx, sfx.pop(1), at, .3, -.2)
    elif ty == "ding": add(fx, sfx.ding(1), at, .22)
    elif ty == "yay":
        for i, m in enumerate([72, 76, 79, 84]): add(fx, marimba(hz(m), .25), at + i * .07, 1, -.3 + i * .2)

mix = voice * 1.0 + music * 1.0 + fx
mix = limit(mix, .95) if mix.ndim == 1 else np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
(HERE / "out").mkdir(exist_ok=True)
sf.write(HERE / "out" / "mix.wav", mix.astype(np.float32), SR)
print("mix", round(len(mix) / SR, 2), "s, peak", round(float(np.abs(mix).max()), 3))
