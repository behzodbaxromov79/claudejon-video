---
name: claudejon-video
description: Makes vertical (1080×1920) low-poly 3D videos for Instagram Reels, YouTube Shorts and TikTok, entirely in code — two kinds — (1) 3D skits: two cartoon characters (a boy and an orange robot by default, or the user's own) talking with real voices, lip-sync, gestures, subtitles and on-screen panels; (2) scary stories: a narrator, dark low-poly places (elevator, corridor, house, forest), scares (eyes, shadow, door, hand, flicker), a countdown timer, word-by-word subtitles and an A/B "what do you do?" choice card. Use when the user writes «boshla», asks for a 3D video, multfilm, skit, dialog video, qo'rqinchli hikoya / scary story / horror short, Reels or Shorts with characters, in Uzbek, Russian or English.
---

# Claudejon Video

Two templates, one pipeline: **script → voices → timeline → scene code → check stills → sound → render → deliver**.
Rendering uses the free, MIT-licensed Lemo-Opuscar library (github.com/lemomo-ai/lemo-opuscar): its `core/` tools render the page
frame by frame in a headless browser and mux the sound. Credit it when the user asks how the video was made.

Speak to the user in **their** language (default Uzbek). Keep messages short and friendly; the user is usually not a programmer.

## 0. Start («boshla» or any video request)

1. Run `sh "<skill dir>/scripts/setup.sh"` → note `LIB=<path>` from the last line. Then start
   `sh "<skill dir>/scripts/setup.sh" deps` **in the background** (minutes the first time). If it reports a missing system tool
   (Node 20+, ffmpeg, Python 3.11+, git), tell the user the one command to install it; don't install system software yourself.
2. Ask **one** round of questions (numbered, with example answers), then work without stopping:
   1. **Video turi:** 🎭 3D suhbat (ikki qahramon gaplashadi) yoki 👻 qo'rqinchli hikoya?
   2. **Til:** o'zbekcha / русский / English?
   3. **Mavzu:** nima haqida? (suhbat uchun: kim kimga nima deydi; hikoya uchun: qayerda, kim, nima bo'ladi)
   4. **Qahramonlar** (suhbat): ismlari, kim gapiradi; ranglari (soch, kiyim). Default: bola + to'q sariq robot «Claude».
   5. **Ovoz:** NeuronAI (o'zbekcha uchun eng yaxshisi — my.neuronai.uz'dan API kalit kerak), ElevenLabs (kalit kerak),
      yoki bepul macOS ovozi (faqat inglizcha). Kalitni chatga yozdirma: `export NEURON_API_KEY=...` qilib terminalga qo'yishini so'ra,
      yoki `~/.claudejon-keys` fayliga yozib `source` qilish.
   6. **Davomiyligi:** 30–60 soniya (default 45). **Oxirgi karta:** kanal nomi yoki chaqiriq (masalan «@kanalingiz», «Directga yozing»).
3. Project folder: `<name>/` in the user's current folder (lowercase, digits, hyphens). Copy the template:
   `cp -R "<skill dir>/templates/skit/." <name>/` or `templates/horror/.`

Commands below run from `$LIB` with the project's **absolute** path `P`.

## 1A. 3D suhbat (templates/skit)

The template is a finished 42-second skit ("Bizga ham o'rgating!"): read `main.js` once before editing — every section is labelled.

1. **Script.** 5–9 short lines, ids `b1, b2…` for the first character (the boy), `c1, c2…` for the second (the robot).
   Natural spoken phrases, one idea per line; a hook in the first 2 seconds; the last line is the call to action.
   NeuronAI emotion tags help a lot: `[sigh]`, `[laughter]`, `[surprise-oh]`, `[surprise-ah]`, `[dissatisfaction-hnn]`.
2. **Voices.** Write `lines.json` (`[{"id":"b1","text":"…","voice":"muhriddin","speed":0.95,"lang":"uz"}, …]`) and run
   `"$LIB/.venv/bin/python" "<skill dir>/scripts/tts.py" "$P" "$P/lines.json"`. Good NeuronAI pairs: boy `muhriddin` (speed .92–.95),
   girl/robot `saodat`; English `james` / `sophia`. A user's own voice clone id works the same way.
3. **Timeline.** `"$LIB/.venv/bin/python" "<skill dir>/scripts/timeline.py" "$P" b1 c1 b2 c2 …` — it prints where each line
   starts and the pauses inside it (use them to split subtitles and time gestures).
4. **Edit `main.js`:**
   - `boyTalk` / `botTalk`: the lists of line ids for each character.
   - `P` (poses) and `KEYS` (which pose when, `at('b2', 1.5)` = 1.5 s into line b2).
   - face moods in `animate()` (`glad`, `wow`, `curious` for the boy; `laugh`, `sure`, `tilt` for the robot) — re-point them at your lines.
   - `SH` shots: one per line or idea; close-ups on the speaker, a wide shot when a panel is on screen.
   - `hook` (big text, first 3.6 s), `CUES` (subtitles: [line, from, to, html]; `<b>` = accent colour), the chat/info panel
     (`MSG`, `CHAT0/CHAT1`) and `end` (final card). Remove the panel if the story doesn't need it.
   - character colours: `skin, hairM, sweater, pants` (boy) and `coral` (robot) near the top.
5. Continue with **2. Check, sound, render**.

## 1B. Qo'rqinchli hikoya (templates/horror)

All content lives in `story.json` — see `story.example.json`. No code edits needed for a normal story.

1. **Story.** 5–8 scenes, each 1–2 short sentences (7–12 seconds of speech in total per scene at most). Second person ("you" / «sen»),
   present tense, a rule or a deadline, escalating; the last scene ends on a question. For each scene choose
   `place` (`elevator`, `corridor`, `house`, `forest`) and `event` (`none`, `flicker`, `eyes`, `door`, `shadow`, `hand`;
   optional `event_at` 0–1 = when in the line it happens), plus 1–3 `highlight` words. Fill `title`, `timer`, `choice` (q, a, b),
   `handle`, `language`. Keep it original — no famous characters or franchises.
2. **Voices.** One line per scene, ids = scene ids: build `lines.json` from `story.json` (`text` + the story's `voice`) and run `tts.py`.
   Narrator voices: Uzbek `muhriddin` (deep, calm) speed .95; English `james`.
3. **Timeline.** `timeline.py "$P" --story --tail 4.5` (the tail is the A/B card).
4. Continue with **2. Check, sound, render**. To add a new place or event, follow the pattern in `main.js` (`place(...)`,
   `FOG`, hero position `HP`, camera `V`, threat positions `far`).

## 2. Check, sound, render (both)

1. **Stills first:** `cd "$LIB" && node core/render/still.mjs "$P" 1 5 10 20 30 --size 1080x1920 --out "$P/stills"` and LOOK at them:
   faces readable, subtitles inside the frame and not over a face, panels not covering the speaker, nothing cut off.
   Fix and re-check before rendering.
2. **Sound:** `node core/render/events.mjs "$P" --size 1080x1920 --out "$P/events.json"` then
   `"$LIB/.venv/bin/python" "$P/mix.py" "$LIB"` → `out/mix.wav`.
3. **Render:** `node core/render/video.mjs "$P" --fps 24 --size 1080x1920 --out "$P/out/video.mp4"` (minutes; run in the background), then
   `sh core/render/mux.sh "$P/out/video.mp4" "$P/out/mix.wav" "$P/<name>.mp4" 24 0` (−14 LUFS, ready for Instagram/YouTube).
4. **Deliver:** tell the user the file path, the length, and a 2–3 line caption with hashtags in their language.
   Offer one concrete improvement for the next video.

## Rules

- Original characters and stories only — no copyrighted characters, logos or music. Don't imitate a real person's voice without consent.
- Never print API keys; read them only from environment variables.
- Subtitles must match what is said. Big, short, two lines at most.
- If a step fails, read the error, fix the cause, and re-run that step — don't restart everything.
