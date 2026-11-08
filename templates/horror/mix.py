"""Horror mix: narrator (timeline.json) + low drone + heartbeat + stingers on the scares (events.json) → out/mix.wav."""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf, soxr

LIB = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "lemo-opuscar"
sys.path.insert(0, str(LIB / "core" / "audio"))
import sfx
from sfx import SR, add, lp, hp, bp, noise, brown, env_exp, t_, compress, limit

HERE = Path(__file__).resolve().parent
T = json.loads((HERE / "timeline.json").read_text())
EV = json.loads((HERE / "events.json").read_text())["ev"]
DUR = T["dur"]; N = int(DUR * SR)

voice = np.zeros((N, 2), np.float32); vmask = np.zeros(N, np.float32)
for l in T["lines"]:
    a, sr = sf.read(HERE / "voice" / f"n_{l['id']}.wav", dtype="float32")
    if a.ndim > 1: a = a.mean(1)
    a = compress(soxr.resample(a, sr, SR), thr=.3, ratio=3)
    add(voice, a, l["t0"], 1.0, 0)
    s = int(l["t0"] * SR); vmask[s:min(N, s + len(a))] = 1

# drone: two detuned low sines + filtered brown noise, slowly breathing
t = np.arange(N) / SR
drone = (np.sin(2 * np.pi * 55 * t) + .7 * np.sin(2 * np.pi * 55.6 * t) + .4 * np.sin(2 * np.pi * 82.4 * t)) * .5
air = lp(brown(DUR)[:N], 400) * .6
breath = .6 + .4 * np.sin(2 * np.pi * t / 7.5)
bed = (drone * .5 + air) * breath
bed *= np.clip(t / 1.5, 0, 1) * np.clip((DUR - t) / 2, 0, 1)
duck = np.convolve(vmask, np.ones(int(.2 * SR)) / int(.2 * SR), mode="same")
bed *= 1 - .35 * duck
music = np.stack([bed, bed], 1).astype(np.float32) * .16

# heartbeat that speeds up toward the end
hb = 1.0
while hb < DUR - 2.5:
    add(music, sfx.heartbeat(1), hb, .32)
    hb += max(.55, 1.1 - .5 * hb / DUR)

def sting(v=1.0):   # dissonant hit: cluster of saws + noise swell
    d = 1.6; tt = t_(d)
    x = sum(np.sign(np.sin(2 * np.pi * f * tt)) for f in (233, 247, 311, 466)) / 4
    x = lp(x, 2400) * env_exp(d, .5) + bp(noise(d), 300, 3000) * env_exp(d, .25) * .5
    return (x * v).astype(np.float32)

fx = np.zeros((N, 2), np.float32)
for e in EV:
    ty, at = e["type"], e["t"]
    if ty == "whoosh": add(fx, sfx.whoosh(.5, 1), at, .25)
    elif ty == "cut": add(fx, sfx.whoosh(.3, 1), at - .15, .12)
    elif ty == "sting": add(fx, sting(1), at, .38); add(fx, sfx.thump(1, 45), at, .5)
    elif ty == "buzz": add(fx, (hp(noise(.6), 2000) * env_exp(.6, .2) * .3).astype(np.float32), at, .5)
    elif ty == "boom": add(fx, sfx.thump(1, 38), at, .7); add(fx, sfx.rumble(2.0, 1), at, .4)
    elif ty == "creak": add(fx, sfx.creak(1), at, .4)

mix = voice + music + fx
mix = np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
(HERE / "out").mkdir(exist_ok=True)
sf.write(HERE / "out" / "mix.wav", mix.astype(np.float32), SR)
print("mix", round(len(mix) / SR, 2), "s, peak", round(float(np.abs(mix).max()), 3))
