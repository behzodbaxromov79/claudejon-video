"""
Place the voiced lines one after another and write <project>/timeline.json (+ a 24 fps loudness envelope per line for lip-sync).

    python timeline.py <project> b1 c1 b2 c2 ...        # explicit order (skit)
    python timeline.py <project> --story                # order = story.json scenes (horror)

Options: --gap 0.4 (pause between lines), --tail 3.6 (seconds after the last line, e.g. for the end card), --start 0.6
Prints each line's start/end and the pauses inside it — use those to split subtitles and time gestures.
"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf

args = sys.argv[1:]
proj = Path(args.pop(0))
def opt(name, default):
    if name in args:
        i = args.index(name); v = float(args[i + 1]); del args[i:i + 2]; return v
    return default
gap, tail, start = opt("--gap", .4), opt("--tail", 3.6), opt("--start", .6)
if "--story" in args:
    st = json.loads((proj / "story.json").read_text())
    order = [s.get("id") or f"s{i}" for i, s in enumerate(st["scenes"])]
else:
    order = args
fps, t, lines, env = 24, start, [], {}
for n, lid in enumerate(order):
    if n: t += gap
    a, sr = sf.read(proj / "voice" / f"n_{lid}.wav", dtype="float32")
    if a.ndim > 1: a = a.mean(1)
    d = len(a) / sr
    lines.append({"id": lid, "who": "boy" if lid.startswith("b") else "claude" if lid.startswith("c") else "narrator",
                  "t0": round(t, 3), "t1": round(t + d, 3)})
    hop = int(sr / fps)
    fr = [float(np.sqrt((a[i:i + hop] ** 2).mean())) for i in range(0, len(a), hop)]
    ref = np.percentile([x for x in fr if x > 0] or [1], 95)
    env[lid] = [round(min(1.2, x / ref), 3) for x in fr]
    pauses, i = [], 0
    e = env[lid]
    while i < len(e):
        if e[i] < .06:
            j = i
            while j < len(e) and e[j] < .06: j += 1
            if j - i >= 4 and i > 0 and j < len(e): pauses.append(round((i + j) / 2 / fps, 2))
            i = j
        else:
            i += 1
    print(f"{lid}: {t:6.2f} → {t + d:6.2f}  ({d:.2f}s)  pauses at {pauses}")
    t += d
dur = round(t + tail, 2)
(proj / "timeline.json").write_text(json.dumps({"dur": dur, "fps": fps, "lines": lines, "env": env}))
print("total", dur, "s")
