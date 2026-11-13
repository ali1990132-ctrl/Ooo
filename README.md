# رحلة المدربة

لعبة مغامرات أندرويد بالدور. البطلة شهد ورفيقتها شرارة.

## البناء
ارفع المجلد على مستودع GitHub، وراح يشتغل GitHub Actions ويطلع ملف
`RihlatAlMudarriba.apk` تلكاه بتبويب **Actions** ← آخر تشغيل ← **Artifacts**.

## الملفات المهمة
- `app/src/main/assets/game/js/story.js` — نصوص الحلقات
- `app/src/main/assets/game/js/data.js` — الكائنات والضربات
- `app/src/main/assets/game/js/battle.js` — محرك المعارك
- `app/src/main/assets/game/js/art.js` — الرسومات

## كارة كوين والشحن
- قواعد الأمان بملف `firestore.rules`، تنحط بـFirebase ← Firestore ← Rules.
- لوحة الشحن: اضغط على شعار اللعبة 7 مرات، وسجل دخول بإيميل المدير.
- الأسعار والأغراض بملف `js/data.js` (قسم SHOP). إذا غيرت سعر غرض بالكوين، غيّره بملف القواعد هم.

## الرسومات ثلاثية الأبعاد
- مكتبة Three.js (ترخيص MIT) بمجلد `lib`.
- الموديلات بمجلد `models`: شخصيات ووحوش Quaternius (CC0)، والثعلب من Khronos glTF Sample Assets (الموديل PixelMannen CC0، الحركة tomkranis CC-BY 4.0).
- إذا الجهاز ما يدعم 3D، اللعبة ترجع تلقائياً للرسومات العادية.
