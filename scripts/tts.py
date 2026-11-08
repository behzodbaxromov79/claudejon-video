"""
Voice every line of a script into <project>/voice/n_<id>.wav (trimmed, loudness-matched, 48 kHz mono).

    python tts.py <project> lines.json

lines.json: [{"id": "b1", "text": "...", "voice": "saodat", "speed": 1.0, "lang": "uz"}, ...]
Provider is picked by the voice and the keys you have (never printed):
  NeuronAI   (Uzbek and 35+ languages)  env NEURON_API_KEY      voice ids: saodat, madina, kamola, kamron, muhriddin, james, sophia, ...
  ElevenLabs                             env ELEVENLABS_API_KEY  voice = an ElevenLabs voice id ("el:<id>")
  macOS say  (offline, English only)    voice = "say:<name>", e.g. "say:Samantha"
Emotion tags like [sigh] [laughter] [surprise-oh] work with NeuronAI; ElevenLabs v3 takes [whispers] [gasps] etc.
"""
import json, os, subprocess, sys, tempfile
from pathlib import Path

import urllib.request


def neuron(text, voice, lang, speed):
    key = os.environ.get("NEURON_API_KEY", "").strip()
    if not key:
        sys.exit("NEURON_API_KEY yo'q: my.neuronai.uz → API keys → kalit oling va export NEURON_API_KEY=... qiling")
    body = json.dumps({"text": text, "voice_id": voice, "language": lang, "quality": "high", "speed": speed}).encode()
    req = urllib.request.Request("https://my.neuronai.uz/api/v1/tts/synthesize", data=body, method="POST",
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read(), ".wav"


def eleven(text, voice):
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        sys.exit("ELEVENLABS_API_KEY yo'q")
    body = json.dumps({"text": text, "model_id": "eleven_v3"}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128", data=body,
                                 method="POST", headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read(), ".mp3"


def say(text, voice):
    d = tempfile.mkdtemp(); out = Path(d) / "s.aiff"
    subprocess.run(["say", "-v", voice, "-o", str(out), text], check=True)
    return out.read_bytes(), ".aiff"


def main():
    proj, spec = Path(sys.argv[1]), json.loads(Path(sys.argv[2]).read_text())
    (proj / "voice").mkdir(parents=True, exist_ok=True)
    for ln in spec:
        v = ln.get("voice", "saodat")
        if v.startswith("el:"):
            data, ext = eleven(ln["text"], v[3:])
        elif v.startswith("say:"):
            data, ext = say(ln["text"], v[4:])
        else:
            data, ext = neuron(ln["text"], v, ln.get("lang", "uz"), float(ln.get("speed", 1.0)))
        raw = proj / "voice" / f"{ln['id']}{ext}"
        raw.write_bytes(data)
        out = proj / "voice" / f"n_{ln['id']}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af",
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5",
                        "-ar", "48000", "-ac", "1", str(out)], check=True)
        print(ln["id"], "ok")


if __name__ == "__main__":
    main()
