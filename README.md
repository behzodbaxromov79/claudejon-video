# 🎬 Claudejon Video — Claude skill

Claude ilovasi uchun skill: **3D multfilm-videolar** (ikki qahramon gaplashadi) va **qo'rqinchli hikoyalar**
yasaydi — Instagram Reels, YouTube Shorts, TikTok uchun tayyor (1080×1920, ovoz, subtitr, musiqa bilan).

> A Claude skill that makes vertical low-poly 3D videos in code: two-character talking skits and scary-story shorts
> with narration, word subtitles, a countdown and an A/B choice card. Uzbek, Russian or English.

## Tez o'rnatish

```bash
git clone https://github.com/<USERNAME>/claudejon-video.git ~/.claude/skills/claudejon-video
```

Keyin Claude ilovasining **Code** bo'limida yozing: **boshla**

Batafsil yo'riqnoma: [O'RNATISH.md](O'RNATISH.md)

## Nima kerak
- Kompyuter (Mac / Windows / Linux) va Claude ilovasi (Code bo'limi bilan, pullik tarif)
- Node.js 20+, ffmpeg, Python 3.11+, git — Claude tekshiradi va aytadi
- O'zbekcha ovoz uchun **NeuronAI** API kaliti (my.neuronai.uz) — `NEURON_API_KEY` muhit o'zgaruvchisi sifatida.
  Kalitlar hech qachon repoga yoki chatga yozilmaydi.

## Ichida
| | |
|---|---|
| `SKILL.md` | Claude uchun ish tartibi: savollar → ovoz → sahna → tekshiruv → render |
| `templates/skit/` | 3D suhbat-video shabloni (bola + robot, imo-ishora, lip-sync, panel, oxirgi karta) |
| `templates/horror/` | Qo'rqinchli hikoya shabloni — hikoya `story.json` da, kod o'zgartirish shart emas |
| `scripts/` | `setup.sh` (render kutubxonasi), `tts.py` (ovoz), `timeline.py` (vaqt jadvali) |

## Litsenziya
MIT. Render vositalari — [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) (MIT, LemoLab), o'rnatishda yuklab olinadi.

Instagram **@claudejon_youtube** · Telegram **@Claudejon_ai_bot**
