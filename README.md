# 🚲 Thai Adult Sitcom & Everyday Social Comedy Animator (`thai-sitcom-animator`)

เอ็นจิ้นสร้างแอนิเมชัน 2.5D HTML5 Canvas สไตล์ **การ์ตูนซิตคอมสำหรับผู้ใหญ่ (Adult Cartoon Sitcom Style)** — ออกแบบตัวละครเรียบง่ายตัดเส้นคมชัด (`#18181B`), ลงสีแบนโทนอุ่นสบายตา (Flat Daylight Colors), ดวงตาครึ่งตาสุดกวน (`eyelid: 0.42`), ฉากชีวิตประจำวัน (`COFFEE & BAKERY`, ถนนในซอย, ออฟฟิศ, คอนโด), ตัวละครประจำที่ปรากฏซ้ำ (`CAST`), และการ์ดมุกตลกโซเชียลมีเดียสไตล์ไทย พร้อมระบบพากย์เสียง Gemini 3.8 Flash TTS (`Puck`) และเรนเดอร์ผ่าน **HyperFrames (`heygen-com/hyperframes`)** ทั้งแบบ 16:9 Master MP4 และ 9:16 Vertical Shorts (`<= 60s`)

---

## ✨ จุดเด่นของสกิลนี้ (Key Features)

1. **Adult Cartoon Sitcom Visual Engine (`templates/core.js`)**:
   - **เส้นตัดขอบคมชัด (`inkrr`, `limb`)**: ทุกชิ้นส่วนของตัวละคร เสื้อเชิ้ตพับแขน กางเกงยีนส์พับขา รองเท้าผ้าใบสีขาว และฉากหลัง มีเส้นขอบสีดำเข้มสม่ำเสมอ
   - **จักรยานแม่บ้านพร้อมตะกร้าหน้า (`drawBicycle`)**: ล้อซี่ลวดหมุนตามความเร็ว ขาปั่นแบบ 2-Segment FK (`poseBike`) ตะกร้าเหล็กด้านหน้า และแฮนด์จับตรงตามภาพต้นฉบับ
   - **ตัวละครประจำ (`CAST`)**: มี `ton` (พระเอกสายชิลล์), `fah` (เพื่อนร่วมงานสายโซเชียล), `boss` (หัวหน้าสายประชุมด่วน), `barista` (บาริสต้าคาเฟ่), และ `rider` (พี่วินมอเตอร์ไซค์)
   - **ฉากชีวิตประจำวัน (Everyday Stages)**:
     - `streetCafeStage`: หน้าร้าน `COFFEE & BAKERY` กันสาดลายทางเขียว-ครีม ป้ายกระดานดำ `Today's Special` และเสาป้ายบอกทาง 3 แผ่น
     - `officeStage`: ออฟฟิศเปิดโล่ง กระดาน KPI นาฬิกา และโต๊ะทำงาน
     - `roomInteriorStage`: ห้องนั่งเล่นคอนโดพร้อมโปสเตอร์คำคม
     - `splitChatStage`: ฉากแบ่งครึ่งซ้าย-ขวาสำหรับคุยแช็ต LINE หรือโทรคุยกัน
2. **Sitcom & Social Media HUD Cards (`normalizeCard` / `drawCard`)**:
   - รองรับการ์ด `chalkboard` (ป้ายเมนูหน้าร้าน), `price_tag` (ใบเสร็จเช็กบิลชีวิตจริง), `social` / `chat` (แช็ตกลุ่ม LINE / โพสต์โซเชียล), `versus` (สิ่งที่คิด VS ความเป็นจริง), `speech` / `thought`, และ `punchline`
   - แถบสถานะชีวิตประจำวัน (`drawTele`): แสดงยอดเงินในบัญชี (`wallet`), ระดับคาเฟอีน (`caffeine`), แบตมือถือ (`battery`), และอารมณ์ (`mood`)
3. **Comedy & Everyday Audio Pipeline (`templates/generate_audio.js`)**:
   - พากย์เสียงภาษาไทยด้วย `gemini-3.8-flash-tts` (`Puck`) โทนเล่าเรื่องกวนๆ จังหวะซิตคอม
   - เอฟเฟกต์เสียงตลกครบครัน: `rimshot` (`ba_dum_tss`), `record_scratch`, `bike_bell`, `cash_register`, `line_ping`, `chat_pop`, `sad_trombone`, `cricket`, `vine_boom`, `boing`, `slide_whistle`, `slurp`, `keyboard`
   - เพลงบรรยากาศกลางวัน: `sunny_street`, `cafe_bossa`, `upbeat_quirky`, `office_hum`

---

## 🚀 การใช้งานด่วน (Quick Start)

```bash
# 1. คัดลอกเทมเพลตและสคริปต์ไปยังโฟลเดอร์โปรเจกต์
cp templates/core.js templates/generate_audio.js templates/index.html templates/package.json ./
cp templates/episode.example.js ./episode.js
cp templates/views.example.js ./views.js
cp templates/generate_thumbnail.js templates/generate_shorts_overlays.js templates/generate_scene_covers.js ./
cp scripts/*.js ./

# 2. สร้างเสียงพากย์ TTS + ซับไตเติล + timeline.json
node generate_audio.js

# 3. ซิงค์เวลาเข้ากับ HyperFrames และตรวจสอบความถูกต้อง
node sync_hyperframes.js
node hf.js lint
node hf.js check

# 4. เรนเดอร์วิดีโอ 16:9 Master MP4 + ภาพปก + Shorts 9:16 + ตรวจ QA 16 ข้อ
node hf.js render -f 24 -q looks -o master_hf.mp4
node generate_thumbnail.js
node generate_shorts_overlays.js
node render_all_shorts.js --input master_hf.mp4
node generate_scene_covers.js --input master_hf.mp4
node inspect_video.js master_hf.mp4 --strict
```

---

## 📁 โครงสร้างไฟล์ในสกิล

- `SKILL.md` — คู่มือหลักของสกิลและกฎการสร้างแอนิเมชันซิตคอม
- `templates/core.js` — เอ็นจิ้นวาดตัวละครซิตคอม จักรยาน ฉากคาเฟ่/ออฟฟิศ และการ์ดโซเชียล
- `templates/generate_audio.js` — ระบบพากย์เสียง Gemini TTS และเอฟเฟกต์เสียงตลก
- `templates/episode.example.js` & `templates/views.example.js` — ตัวอย่างตอนซิตคอม 4 ซีน (ปั่นจักรยานผ่านร้านกาแฟ -> เช็กยอดเงินในแอป -> แช็ต LINE กลุ่มเด้ง -> ปั่นหนีตายไปออฟฟิศ)
- `scripts/` — ชุดสคริปต์ HyperFrames CLI, ตัวตัด Shorts อัตโนมัติ (`<= 58s`), และตัวตรวจคุณภาพ `inspect_video.js`
- `references/sitcom-visual-and-comedy-guide.md` — คู่มือเจาะลึกการออกแบบตัวละคร `CAST` และมุกตลกสไตล์ไทย
