# 🎬 Claudejon Video skill — o'rnatish

Bu skill bilan Claude ilovasi sizga **3D multfilm-videolar** (ikki qahramon gaplashadi) va **qo'rqinchli hikoyalar**
yasab beradi — Instagram Reels, YouTube Shorts va TikTok uchun tayyor (1080×1920).

## Nima kerak

- **Kompyuter:** Mac (yoki Windows/Linux). Telefonda ishlamaydi.
- **Claude ilovasi** (claude.ai/download) — ichidagi **Code** bo'limi bilan. Pullik tarif (Pro yoki undan yuqori) kerak.
- Bepul dasturlar: **Node.js** (nodejs.org, LTS), **ffmpeg** (Mac: `brew install ffmpeg`), **Python 3.11+**, **git**.
  Claude o'zi tekshiradi va nima yetishmasa aytadi.
- **Ovoz uchun** (o'zbekcha eng yaxshisi): **NeuronAI** — my.neuronai.uz da ro'yxatdan o'ting, hisobni to'ldiring,
  *API keys* bo'limidan kalit oling. (Inglizcha video uchun bepul Mac ovozi ham bor.)

## O'rnatish (5 daqiqa)

1. `claudejon-video.zip` faylini oching — `claudejon-video` papkasi chiqadi.
2. Uni shu joyga ko'chiring:
   - **Mac:** Finder → `Cmd + Shift + G` → `~/.claude/skills/` yozing → Enter → papkani shu yerga tashlang.
     (Agar `skills` papkasi bo'lmasa, yarating.)
   - **Windows:** `C:\Users\<ismingiz>\.claude\skills\`
3. Ovoz kalitini qo'shing (bir marta). Terminalni oching va yozing:
   ```
   echo 'export NEURON_API_KEY=KALITINGIZ' >> ~/.zshrc
   ```
   Kalitni hech kimga, hatto chatga ham yubormang.
4. Claude ilovasini qayta oching → **Code** bo'limi → papka tanlang (masalan, "Videolarim").

## Ishlatish

Chatga shunchaki yozing: **boshla**

Claude so'raydi:
- 🎭 3D suhbatmi yoki 👻 qo'rqinchli hikoyami?
- 🌐 Qaysi tilda?
- 📝 Mavzu nima? Qahramonlar kim?
- 🎙 Ovoz qanaqa bo'lsin?
- ⏱ Necha soniya? Oxirida qaysi kanal nomi chiqsin?

Javob berasiz — Claude ovozlarni yozdiradi, sahnalarni yasaydi, tekshiradi va **tayyor .mp4 videoni** papkangizga saqlaydi.
Birinchi marta o'rnatish 5–10 daqiqa, keyin bitta video odatda 10–20 daqiqa.

## Maslahatlar

- Mavzuni aniq yozing: «kim, qayerda, nima bo'ladi». Masalan: *«qishloqdagi eski quduqdan kechasi ovoz chiqadi»*.
- Videodan keyin «qahramonni qiz qil», «subtitrni kattaroq qil», «oxirini qisqartir» deb o'zgartirishni so'rashingiz mumkin.
- Faqat o'zingiz o'ylab topgan qahramon va hikoyalar — mashhur multfilm qahramonlari mualliflik huquqi sababli mumkin emas.

---
Videolarni chizish uchun bepul **Lemo-Opuscar** kutubxonasidan foydalaniladi (MIT litsenziya, github.com/lemomo-ai/lemo-opuscar).
Savollar bo'lsa: Instagram **@claudejon_youtube** · Telegram **@Claudejon_ai_bot**
