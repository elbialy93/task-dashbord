# دار التيجان — عدّة الفيديو لـ OpenMontage

هوية دار التيجان جاهزة للاستخدام مع [OpenMontage](https://github.com/OpenMontageInc/OpenMontage):
ملف الهوية، قالب مشاهد عربي (RTL، رأسي 1080×1920)، والخطوط.

| الملف | وظيفته |
|---|---|
| `dar-al-tijan.yaml` | ملف الهوية (playbook): الألوان، الخطوط، الحركة، الصوت، وقواعد المحتوى |
| `template/` | قالب Remotion بهوية الدار، محتواه كله يأتي من ملف props |
| `example-props.json` | مثال على بيانات فيديو: المشاهد والنصوص والتوقيتات |
| `public/` | خطوط Cairo وAmiri. ضع هنا `logo.png` (خلفية شفافة) وملف التعليق الصوتي |
| `preview.png` | لقطات من القالب بالمثال المرفق |

## التثبيت (مرة واحدة)

```bash
git clone https://github.com/OpenMontageInc/OpenMontage && cd OpenMontage && make setup
cp <هذا المجلد>/dar-al-tijan.yaml styles/custom/
```

## عمل فيديو

قل للمساعد داخل OpenMontage:

> اعمل فيديو 60 ثانية عن «…» بهوية دار التيجان: استخدم playbook `dar-al-tijan` والقالب في `dar-al-tijan-video/template`.

المساعد يكتب السكربت، وبعد موافقتك ومراجعة المعلم يولّد التعليق، ثم يملأ ملف props ويصيّر:

```bash
P=projects/<اسم-الفيديو>
mkdir -p remotion-composer/$P && cp <هذا المجلد>/template/*.tsx remotion-composer/$P/
cd remotion-composer
npx remotion render $P/index.tsx DarAlTijan out.mp4 \
  --props=<props.json> --public-dir=<هذا المجلد>/public
```

## بيانات الفيديو (props)

- `totalSeconds`: مدة الفيديو، وآخر `closingSeconds` (3.5 ث) كارت الختام «دار التيجان · نبني جيل القرآن».
- `narration`: اسم ملف الصوت داخل `public/` (اختياري).
- `logo`: اسم ملف اللوجو داخل `public/` (اختياري؛ يظهر أعلى اليمين وفي كارت الختام).
- `seriesTitle`: عنوان السلسلة، يظهر أول 2.6 ث.
- `segments`: لكل مقطع `start` (ثانية بدء الكلام)، و`audioFrom`/`audioTo` (موضعه في ملف الصوت)، و`scene`.

أنواع المشاهد: `hook` (سؤال الافتتاح)، `quote` (آية أو حديث أو ذكر بخط Amiri مع المصدر)،
`point` (نصيحة مرقّمة)، `list` (حتى 4 كروت). كل سطر له `at`: الثانية التي يظهر فيها بعد بدء المقطع،
وتُضبط على وقفات التعليق (`ffmpeg silencedetect`).

## ثوابت الهوية

- الألوان: كحلي `#0F1A3D`، ذهبي `#E0B04F`، أخضر زمردي `#1F9D6B`، نص عاجي `#F7F1E3`.
- الخطوط: Cairo للعناوين والنص، Amiri للنصوص المشكّلة.
- الصوت: ElevenLabs، الصوت `Taj - Dar Al-Tijan`، موديل `eleven_v4`، بدون موسيقى.
- لا نص عربي أو قرآني داخل صور مولّدة، ولا أطفال مولّدون يُقدَّمون كطلاب الدار.
