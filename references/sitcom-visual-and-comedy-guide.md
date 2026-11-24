# Thai Adult Sitcom & Everyday Social Comedy Guide (`thai-sitcom-animator`)

คู่มือการออกแบบงานภาพ ตัวละครประจำ (`CAST`) ฉากชีวิตประจำวัน และจังหวะมุกตลกสไตล์ไทยสำหรับสกิล `thai-sitcom-animator`

---

## 1. Visual DNA (สไตล์ภาพการ์ตูนซิตคอมผู้ใหญ่)

อ้างอิงจากภาพต้นฉบับ **Adult Cartoon Sitcom Style**:

1. **เส้นตัดขอบคมชัด (`INK_OUTLINE = '#18181B'`)**:
   - ทุกชิ้นส่วนของตัวละคร เสื้อผ้า จักรยาน อาคาร ป้ายชื่อถนน และป้ายกระดานดำ ใช้ฟังก์ชัน `inkrr(c, x, y, w, h, r, fillCol, strokeW)` และ `limb(..., outlineW)` เพื่อวาดเส้นขอบสีดำเข้มหนา `2.4px – 3.0px`
2. **สีแบนโทนอุ่นสบายตา (Flat Daylight Colors + 1-Step Cel Shading)**:
   - ท้องฟ้ากลางวัน (`#7CC2F5` -> `#CBE8FC`)
   - ตึกอิฐสีน้ำตาลทองอบอุ่น (`#DFAF7B`)
   - กันสาดลายทางสีเขียวเข้มสลับครีม (`#2E5A44` / `#F3EDE0`) พร้อมป้าย `COFFEE & BAKERY`
3. **เอกลักษณ์ใบหน้าตัวละคร (Signature Sitcom Facial Expression)**:
   - ดวงตาทรงรีสีขาวขนาดใหญ่ พร้อม **เปลือกตาบนครึ่งตา (`eyelid: 0.42`)** ที่ให้ฟีลคนวัยทำงานกวนๆ ชิลล์ๆ หรือปลงกับชีวิต
   - คิ้วหนาที่ขยับตามอารมณ์ (`chill`, `deadpan`, `smirk`, `side_eye`, `awkward`, `shock`, `annoyed`, `sigh`, `happy`)
   - ปากขยับตามเสียงพากย์ (`talking: true`) พร้อมเหงื่อเม็ดโต (`sweat: true`) เวลาเจอสถานการณ์เลิ่กลั่ก
   - รองรับ **`exprAt`** เปลี่ยนสีหน้ากลางฉากได้อัตโนมัติ (เช่น `exprAt: [[0, 'chill'], [1.8, 'shock']]` หรือ `{ at: 1.8, expr: 'shock', sweat: true }`), **`gloom: 0.52`** สำหรับเส้นอารมณ์หม่นบนหน้าผากแบบคลิปพอดีศีรษะ, และ **`cameraRig(c, lt, s.dur, { snapAt, shakeAt })`** เพื่อซูมกระแทกมุก 1.08x–1.16x ในเสี้ยววินาทีที่ตบมุก
4. **คลังท่าตบมุก 6 สไตล์ (Clean Storytelling + 6-Mode Punchline Toolkit — มาตรฐานหลัก):**
   - **ช่วงปูเรื่อง (Setup):** ปิดการ์ดข้อความครีม (`drawCard`) และ Telemetry (`drawTele`) ด้านบนทั้งหมด (ปิดเป็นค่าเริ่มต้นใน `core.js`) แล้วใช้ `blurLayer(c, 1.8..2.4, ...)` เบลอพื้นหลังนุ่มๆ วางตัวละครไซซ์ใหญ่ (`scale 1.38–1.58`) นั่ง/ถือของร่วมกับโต๊ะและฉากจริงแบบ **ไม่มีขอบสติกเกอร์** และใช้ท่านั่งที่ถูกต้อง (`poseFloorSit` สำหรับพื้นเสื่อ, `poseSit({ curb: true })` สำหรับขอนไม้/เก้าอี้เตี้ย, `poseSit()` สำหรับเก้าอี้/โต๊ะ, `poseSquat()` สำหรับนั่งยอง)
   - **ช่วงตบมุก (6-Mode Punchline Toolkit — ห้ามใช้โหมดเดิมซ้ำ 2 ซีนติดกัน และห้ามใช้ `drawPunchlineBackdrop` ส้ม-น้ำเงินสำเร็จรูปทุกมุก!):**
     1. **`punchDeadpanZoom(c, lt, o)`** — ซูมกระแทกหน้าตายในฉากจริง (เบลอหลัง + Close-up + `gloom: 0.56` + จุดไข่ปลา `• • •` เด้งเรียง)
     2. **`punchFreezeSpotlight(c, lt, o)`** — หยุดภาพขาวดำ `RECORD SCRATCH` + เจาะ Spotlight สีสดเฉพาะจุดพลาด + ลูกศรชี้ป้ายเหลือง `o.label`
     3. **`punchMangaImpact(c, lt, o)`** — Flash ขาวดำ 2 เฟรม + เส้นสปีดมังงะ `drawMangaFocusLines` + Dutch Angle + วิญญาณหลุดจากปาก (`drawSoulEscape`) + `ช็อก!!`
     4. **`punchEvidenceCutIn(c, lt, o)`** — ซูมของกลางจอมือถือ (`drawEvidencePhone`, มีไอคอน X เวกเตอร์ ไม่ใช้อิโมจิแหว่ง) + กรอบคอมิกหน้าช็อก/หน้านิ่ง (`drawComicInset`)
     5. **`punchInScenePopOut(c, lt, o)`** — **เก็บฉากจริงไว้** + เด้งตัวละครขอบสติกเกอร์ขาว (`drawStickerPerson`) + ตัวหนังสือเด้งสไตล์รายการวาไรตี้ (`drawVarietyPopText`)
     6. **`punchExpectationRip(c, lt, o)`** — ฉีกกระดาษแนวทแยงกลางจอ เทียบฝั่งซ้ายสว่างสดใส + ประกายเวกเตอร์ (`drawSparkleVec`) vs ฝั่งขวาหม่นซีดโทรม + ป้ายเวกเตอร์ (`สิ่งที่คิด` / `ความจริง`)
   - **บับเบิลพูดสั้น & ท่าตบมุก:** ใช้ `drawSpeechBubble(c, x, y, text)` และท่าแอ็กติง (`posePanic`, `poseFacepalm`, `posePoint`) หลีกเลี่ยงตัวอักษรอิโมจิ (`✨`, `💸`, `❌`) ใน Canvas ให้วาดเป็นรูปเวกเตอร์แทนเสมอเพื่อให้คมชัดทั้ง Windows และ Linux!

---

## 2. ทะเบียนตัวละครประจำ (`CAST` Roster ใน `core.js`)

เรียกใช้งานผ่าน `drawSitcomPerson(c, x, y, s, { cast: 'ton', ... })` หรือ `drawBicycle(c, x, y, s, { cast: 'ton', ... })`:

| รหัส `cast` | ชื่อตัวละคร | คาแรกเตอร์ & การแต่งกาย | บทบาทในซิตคอม |
| :--- | :--- | :--- | :--- |
| `'ton'` | **ต้น** | ผมซอยยุ่งสีน้ำตาลเข้ม เสื้อเชิ้ตสีครีมพับแขน กางเกงยีนส์พับขา รองเท้าผ้าใบสีขาว | พระเอกวัยทำงานสายชิลล์ ชอบปั่นจักรยานแม่บ้านตระเวนหาของกิน แต่เงินในบัญชีไม่ค่อยเป็นใจ |
| `'fah'` | **ฟ้า** | ผมบ็อบสั้น เสื้อสีเหลืองพาสเทล กางเกงสแล็คสีกรมท่า | เพื่อนร่วมงานสายโซเชียล รู้ทุกดราม่าในทวิตเตอร์และติ๊กต็อก ชอบชวนสั่งชานมไข่มุก |
| `'boss'` | **พี่บอส** | ผมแสกข้าง ใส่แว่น เสื้อเชิ้ตฟ้าผูกเนกไทสีแดง | หัวหน้างานสายนัดประชุมด่วนตอน 08:30 น. และชอบทัก LINE กลุ่มตอนวันหยุด |
| `'barista'` | **บาริสต้าเจ** | หมวกบีนนี่สีน้ำตาล เสื้อขาว ผ้ากันเปื้อนคาเฟ่สีเขียวเข้ม | เจ้าของร้านกาแฟอินดี้ที่ตั้งชื่อเมนูยาวเหยียดและขายราคาช็อตฟีล |
| `'rider'` | **พี่วิน / ไรเดอร์** | เสื้อแจ็คเก็ตสีเขียวสด กางเกงยีนส์ | ผู้รู้ทุกความลับในซอย โผล่มาตบมุกสั้นๆ แต่ได้ใจความ |

---

## 3. Stage Builders (ฟังก์ชันจัดฉากชีวิตประจำวัน)

- **`streetCafeStage(c, t, o)`**:
  - ฉากถนนหน้าร้านกาแฟและเบเกอรี่ (`COFFEE & BAKERY`) พร้อมต้นไม้ใหญ่ ป้ายบอกทาง 3 แผ่น (`o.signs`) และป้ายกระดานดำตั้งพื้น (`o.chalkLines`)
  - รองรับการเลื่อนฉากพารัลแลกซ์ด้วย `o.pan` (เช่น `pan: 18` ตอนปั่นชิลล์ หรือ `pan: 95` ตอนปั่นหนีตาย)
- **`officeStage(c, t, o)`**:
  - ฉากออฟฟิศเปิดโล่ง มีหน้าต่างกระจกบานใหญ่ นาฬิกาแขวนผนัง กระดานไวท์บอร์ดกราฟ KPI (`o.boardTitle`) และโต๊ะทำงานพร้อมโน้ตบุ๊กและแก้วกาแฟเย็น
- **`roomInteriorStage(c, t, o)`**:
  - ฉากห้องนั่งเล่นคอนโด โซฟา และโปสเตอร์คำคมกวนๆ บนผนัง (`o.posterText`)
- **`splitChatStage(c, t, leftFn, rightFn)`**:
  - ฉากแบ่งครึ่งซ้าย-ขวาด้วยเส้นสายฟ้าการ์ตูน สำหรับฉากคุยโทรศัพท์หรือแช็ตกลุ่ม LINE โต้ตอบกันสดๆ

---

## 4. โครงสร้างการเล่าเรื่องตลก 4 จังหวะ: จบใน 1 คลิป (`45–60s`) หรือไม่เกิน 2 ตอน

1. **Beat 1 — เปิดด้วยจุดหักมุม/เหตุการณ์พีคใน 3 วินาทีแรก (Zero-Delay `0.06s` Cold Open):**
   - **ตัดการเกริ่นนำตามลำดับเวลาออก** เปิดคลิปด้วยวินาทีที่เจอความผิดปกติหรือช็อตฟีลสุดขีดก่อนทันที (`COLD_OPEN_LEAD = 0.06s` + ซับไตเติลคิวแรกที่ `t0 = 0.00s` ความยาว `<= 24–26` ตัวอักษร) พร้อมเสียง `record_scratch` / `cash_register` (ไม่โดน Ducking กดเสียง) และ `cameraRig` ซูมกระแทก
2. **Beat 2 — ย้อนเล่าที่มาแบบกระชับ (Rewind & Context):**
   - เมื่อดึงความสนใจใน 3 วินาทีแรกได้แล้ว ค่อยเล่าย้อนสั้นๆ ว่า 5 นาทีก่อนหน้านี้ตัวเอกมั่นใจแค่ไหน เพื่อดึงให้คนดูอยู่ติดตามต่อจนถึง **`30–45 วินาที`**
3. **Beat 3 — โซเชียลมีเดีย / แช็ตกลุ่มซ้ำเติม (Social Media Chaos):**
   - เด้งการ์ดแช็ต LINE (`type: 'social'`) หรือฉาก `splitChatStage` พร้อมเสียง `line_ping` และ `vine_boom` และใช้ `exprAt` สลับสีหน้ากลางฉาก
4. **Beat 4 — ตบมุกหน้าตาย & จบครบใน 1 คลิป (หรือสูงสุดไม่เกิน 2 ตอนพร้อมทวนความเดิม 3 วิ):**
   - เปรียบเทียบ `สิ่งที่คิด VS ความเป็นจริง` (`type: 'versus'`) หรือสรุปบิลชีวิตจริง (`type: 'price_tag'`) ปิดท้ายด้วยเสียง `rimshot` (`ba_dum_tss`) หรือ `sad_trombone` **ขมวดปมและเฉลยจบใน 1 คลิป (`45–60s`)** เพื่อให้คลิปยืนด้วยตัวเองได้บนฟีดคนแปลกหน้า
   - **กรณีเรื่องยาวจริง ๆ (ห้ามเกิน 2 ตอน: ตอนที่ 1 และ ตอนจบ):** ตอนที่ 1 จบด้วยปมค้างคา ส่วน **ตอนที่ 2 (`act: 2, isRecap: true`) ต้องสรุปความเดิมสั้น ๆ ภายใน 3 วินาทีแรก** (`"ความเดิมเมื่อกี้..."` ที่ `0.06s` Lead) ก่อนตบมุกเฉลยจบ!
   - **กฎปิดท้ายคลิปสั้นแบบไม่เสีย Retention (`Side-Choosing Question + Cliffhanger + 2s Visual CTA`):** ห้ามพูดปิดท้ายแบบสำเร็จรูปอย่าง `"ฝากกดไลก์ กดแชร์ กดติดตามด้วยนะครับ"` ใน 3 วิสุดท้าย ให้ปิดด้วย **คำถามปลายเปิดที่ให้คนดูเลือกข้าง** + **ปมค้างคา/บอกต่อคลิปเต็มหน้าช่อง** แล้วปล่อยให้ **`drawShortsEndingCTA`** ใน `core.js` ขึ้นป้ายลูกศรชี้ลง `▼` มุมซ้ายล่างช่วง 2.25 วินาทีสุดท้ายโดยอัตโนมัติ (ปรับข้อความเฉพาะฉากได้ผ่าน `scene.visualCta`)
   - **กฎคุมโทนเสียงคนพากย์ + ข้อยกเว้นเฉพาะตัวละครอื่นและตอนดัดเสียง (`Strict Narrator Lock`):** เสียงผู้บรรยายหลักล็อกเป็นเสียงเดียวโทนเดียวกันทั้งเรื่อง (`VOICE_NAME = 'Puck'` + `NARRATOR_STYLE` + `sanitizeVoForTTS` + Two-Pass `LRA=3.5` และ `lockedModelId` ตัวเดียวทั้งเรื่อง) ห้ามเปลี่ยนเสียงผู้บรรยายกลางเรื่องเด็ดขาด ยกเว้นเฉพาะบทพูดของ **ตัวละครอื่น** (`role: 'character'` / `speaker: 'fah' | 'boss' | 'barista' | 'clinic_staff'`) หรือ **ตอนผู้บรรยายดัดเสียงเป็นคนอื่น** (`role: 'impersonate'` / `impersonate` / `[[impersonate:...|...]]` / ประโยคคำพูด `พูดว่า "..."`) ซึ่งจะเปลี่ยนเสียงเฉพาะช่วงนั้นแล้วตัดกลับมาโทนผู้บรรยายเดิมเป๊ะทันที!

---

## 5. หลักการตั้งชื่อคลิป & Shorts — เอาชื่อคลิปสั้นขึ้นหน้าสุด (ห้ามนำหน้าด้วย `EP` / `จบในคลิป:`) + จบในคลิปเดียว หรือไม่เกิน 2 ตอน

- **ฟอร์แมต Shorts ตัดแบ่งเหตุการณ์ / จบใน 1 คลิป (`45–60s`, แนะนำ):** **`[ชื่อเหตุการณ์/ชื่อคลิปสั้นเข้าใจง่าย <= 38 ตัวอักษร] | [ชื่อซีรีส์]`** *(ห้ามขึ้นต้นด้วย `EP 1:`, `เหตุการณ์ #1:`, หรือ `จบในคลิป:` ให้เอาชื่อคลิปที่คนดูอ่านแวบแรกแล้วเข้าใจทันทีขึ้นไปบนหัวเลย)*
- **ฟอร์แมต Overlay & Cover บนคลิปแนวตั้ง:** ใช้ **หัวเรื่องใหญ่ 2 บรรทัดสลับสี แดง `#EF4444` / ขาว `#FFFFFF`** (`Kanit 900`, ขอบดำหนา `16px`) บนภาพเต็มจอใสสะอาด — **ปิดแถบ Pill สีแดง/ส้มใต้พาดหัว, ปิดกล่อง Telemetry HUD บนภาพปก, ปิดกรอบสีเหลือง + Viewfinder สีแดงกลางภาพ, ปิด Stamp ด้านล่าง (`เหตุการณ์ #1–#5`, `EP 1`, `EP 2 (จบ)`, `จบใน 1 คลิป`) และปิดแถบเส้น Gradient ด้านล่างทั้งหมด!**
- **ฟอร์แมต Shorts แบบ 2 ตอน (กรณีแบ่ง 2 ตอน ห้ามเกิน 2 ตอน):** **`[ชื่อคลิปตอนเปิด <= 38 ตัวอักษร] | [ชื่อซีรีส์เหมือนกันเป๊ะ]`** และ **`[ชื่อคลิปตอนสรุป <= 32 ตัวอักษร] (ตอนจบ) | [ชื่อซีรีส์เหมือนกันเป๊ะ]`**
- **ฟอร์แมตคลิปเต็ม (Long-Form):** **`[ประโยคคำถามหรือจุดพีค ไม่เกิน 45 ตัวอักษรแรก] | [ชื่อซีรีส์]`**

| รูปแบบที่ไม่แนะนำ (ขึ้นต้นด้วย EP/เหตุการณ์ / ยาวเกิน) | รูปแบบมาตรฐาน (ชื่อคลิปสั้นขึ้นหน้าสุด แบ่งเหตุการณ์ `45–60s` หรือสูงสุด 2 ตอน) | ความยาวหน้า `|` |
| :--- | :--- | :--- |
| `ซิตคอมมนุษย์ออฟฟิศ EP.1..EP.6 กาแฟแก้วเดียว` / `EP 1: สลับร่าง...` / `เหตุการณ์ #1:` | `สลับร่างกับแฟน! \| ซิตคอมคนเมือง` *(หัวคลิป & ปก: แดง `สลับร่าง` / ขาว `กับแฟน!` — ไม่มี Pill, ไม่มี Stamp, ไม่มี Telemetry บนปก)* | 16 ตัวอักษร |
| `จบในคลิป: กาแฟ 145 แต่เงินเหลือ 142 บาททำไงดี?!` | `กาแฟ 145 เงินเหลือ 142?! \| ซิตคอมมนุษย์ออฟฟิศ` | 26 ตัวอักษร |
| `EP 3..8 เมื่อหัวหน้านัดประชุมด่วนตอนเช้า` | `ประชุม 8:30 ใครสายเลี้ยงทั้งทีม! \| ซิตคอมมนุษย์ออฟฟิศ` / `บอสถือใบเสร็จรอหน้าลิฟต์ (ตอนจบ) \| ซิตคอมมนุษย์ออฟฟิศ` | 33 / 34 ตัวอักษร |

---

## 6. Multi-Agent Production Workflow (4 Roles สำหรับซิตคอมเต็มเรื่อง)

สำหรับการผลิตซิตคอมเต็มตอน (`15–30+` ฉาก หรือแพ็กเกจ `16:9 + Shorts + Covers + SEO`) ให้แบ่งหน้าที่ออกเป็น 4 บทบาทตามขอบเขตไฟล์ (ห้ามสองเอเจนต์แก้ `views.js` หรือ `episode.js` พร้อมกัน):

> **⏸️ กฎตรวจคลิปยาวก่อนทำคลิปสั้น (Mandatory Long-Form Review Gate):** เมื่อ **Director** เรนเดอร์และผ่าน QA ของคลิปยาว (`master_hf.mp4`) แล้ว **ต้องหยุดส่งคลิปยาวให้ผู้ใช้ตรวจสอบและอนุมัติก่อนเสมอ ห้ามตัดหรือเรนเดอร์ Shorts (`render_all_shorts.js` / `generate_shorts_overlays.js` / ปก Shorts) จนกว่าผู้ใช้จะสั่งให้ทำคลิปสั้นต่อ** *(ยกเว้นกรณีผู้ใช้สั่งทำเฉพาะคลิปสั้นตั้งแต่ต้น)*

| Role | Execution Mode | Primary Ownership | Required Context |
| :--- | :--- | :--- | :--- |
| **1. Director (Main Agent)** | Coordinator | `episode.js`, CLI (`generate_audio.js`, `sync_hyperframes.js`, `hf.js`, `render_*`) | `SKILL.md`, `sitcom-visual-and-comedy-guide.md`, `../reallens-audio-director/SKILL.md` |
| **2. Sitcom Canvas2D View Artist** | Subagent (Phase 3) | `views.js` (`window.VIEWS`, `window.NO_BLUR_VIEWS`) | `episode.js`, `templates/core.js`, `sitcom-visual-and-comedy-guide.md` |
| **3. Visual & Pipeline QA** | Fresh Subagent (Phase 4 & 7) | *Read-only / Defect Ticket* | `SKILL.md`, `audit_all_scenes.png`, `thumbnail_*.png`, `shorts/cover_*.png`, `inspect_video.js --strict` |
| **4. Comedy SEO Writer** | Subagent (Parallel Phase 5–6) | `seo_package.md` | `episode.js`, `timeline.json`, `shorts/shorts_plan.json` |

### Brief Templates สำหรับ Subagents

#### A. `Sitcom Canvas2D View Artist`
```markdown
Role: Sitcom Canvas2D View Artist (thai-sitcom-animator)
Workspace: <EPISODE_DIR>
Read first: <EPISODE_DIR>/core.js, <EPISODE_DIR>/episode.js, <SKILL_DIR>/references/sitcom-visual-and-comedy-guide.md
Task: Implement `<EPISODE_DIR>/views.js` (`window.VIEWS` + `window.NO_BLUR_VIEWS`) for every `scene.view`.
Mandatory Guardrails:
- Warm flat-color adult sitcom aesthetic with clean dark ink outlines (`INK_OUTLINE = '#18181B'`), `drawSitcomPerson`, `drawBicycle`, and stage builders (`streetCafeStage`, `officeStage`, `roomInteriorStage`, `splitChatStage`).
- **`cameraRig` & 6-Mode Punchline Toolkit Guard:** Never put giant top cream HUD cards/telemetry boxes (`drawCard` / `drawTele` / `drawChapter`) into scenes or repeat generic orange-blue VS backdrops (`drawPunchlineBackdrop`) every gag! Tell setups cleanly via shallow-DoF blurred stages (`blurLayer(c, 1.8..2.4, ...)`) and rotate across the **6-Mode Punchline Toolkit** in `core.js` (`punchDeadpanZoom`, `punchFreezeSpotlight`, `punchMangaImpact`, `punchEvidenceCutIn`, `punchInScenePopOut`, `punchExpectationRip` — NEVER repeat the same punchline mode back-to-back, NEVER draw manual forehead gloom boxes or unicode emojis that break across OS fonts; use `gloom: 0.52` and vector helpers like `drawSparkleVec`), paired with `cameraRig(c, lt, s.dur, { snapAt, shakeAt })` (no > 2 consecutive identical setups).
- **Natural Sitting & Support Rule:** Use `poseFloorSit(lt)` for sitting on mats/floors, `poseSit(lt, { curb: true })` on low steps/stools, `poseSit(lt)` on chairs/tables, and `poseSquat(lt)` for flat squats — never use `poseKneel(lt)` as a floor-sit substitute or leave seated characters floating without furniture underneath.
- **Built-in Sunglasses (`sunglasses: true`):** Never draw a manual black rectangle over eyes for sunglasses; pass `sunglasses: true` to `drawSitcomPerson` so glossy 2-lens wayfarer sunglasses (with nose bridge, temple arm, and white diagonal shine) track the character's head bob automatically.
- Use `exprAt` for mid-scene reaction shifts (e.g. `[[0, 'chill'], [1.8, 'shock']]`) synced to audio beats, `drawSpeechBubble()` for crisp dialogue/text gags, and `talking: true` whenever `s.vo` is active.
```

#### B. `Visual & Pipeline QA`
```markdown
Role: Independent Sitcom Visual & Pipeline QA Critic
Workspace: <EPISODE_DIR>
Inspect via read_file: `audit_all_scenes.png`, `thumbnail_*.png`, `shorts/overlay_*.png`, `shorts/cover_*.png`
Verify CLI: `node hf.js lint`, `node hf.js check`, `node inspect_video.js master_hf.mp4 --strict`, `node inspect_video.js shorts/<ep>.mp4 --shorts --strict`
Checklist:
- [ ] `SCENES[0]` opens within 0–3s at the comedic peak/twist (`voStart <= 0.08`, pre-roll sub at `0.00s`) and story resolves cleanly in **1 standalone `45–60s` clip** (or max **2 EPs** where Part 2 / `act: 2` opens with `isRecap: true` 3s recap)
- [ ] **Clean Storytelling & 6-Mode Punchline Variety:** Zero giant top cream HUD cards/telemetry/chapter pills inside scenes (`audit_all_scenes.png` shows large expressive characters occupying 65–75%+ height, soft blurred setup backgrounds without sticker borders, and varied punchlines across `punchDeadpanZoom` / `punchFreezeSpotlight` / `punchMangaImpact` / `punchEvidenceCutIn` / `punchInScenePopOut` / `punchExpectationRip` — zero back-to-back repeated punchline modes, zero generic orange-blue VS spam, zero square gloom box artifacts behind hair, zero broken unicode emoji in Canvas artwork)
- [ ] `cameraRig` snap-zoom/motion and `exprAt` reaction shifts active on punchline scenes; no > 2 consecutive identical stage setups
- [ ] Clean `#18181B` ink outlines, half-lidded eyes, proper `sunglasses: true` (no black-block visors), explicit chairs/tables under all `poseSit` characters, and crisp Thai typography without HUD overlap
- [ ] **High-CTR In-Scene Storytelling Thumbnails & Covers (`render_pro_thumbnails.js`):** ZERO empty radial-gradient voids, ZERO plain white floating text cards, ZERO stiff zombie-arm poses, and ZERO broken unicode emojis on covers! `thumbnail_reallens_showdown.png` uses Torn-Paper Expectation vs. In-Scene Reality Chaos (left real scene + `สิ่งที่คิด` + sunglasses hero vs. right real disaster scene + macro proof/props + huge white-sticker `posePanic` hero + `drawSoulEscape` + bold 2-tone Kanit 900 headline); `thumbnail_reallens_5panel.png` renders actual live episode scenes & props from `views.js` inside all four 2×2 comic panels with captions at top (panels 1–2) & bottom (panels 3–4); `shorts/cover_*.png` renders full-bleed `1080×1920` in-scene vertical storytelling environments + iconic episode props (`drawEvidencePhone` / `drawSpeechBubble` / `drawSoulEscape` / custom props) + natural-pose white-sticker heroes + clean top scrim & 2-line two-tone headline (verified via `read_file` with zero face/prop overlaps)
- [ ] All Shorts `45–60s` (`isEvent: true` event cuts or `<= 2 EPs`), `overlay_*.png` & `cover_*.png` show **ONLY** clean 2-line two-tone Title (`#EF4444`/`#FFFFFF` or `#FFFFFF`/`#FACC15`) — **NO Pill/Box, NO Telemetry HUD on covers, NO Yellow border / Red Viewfinder brackets, NO Bottom Stamp (`เหตุการณ์ #N`/`EP`/`จบใน 1 คลิป`), NO Gradient Bar**; `feedTitle` leads directly with short clip/event title `<= 38 chars | [Series]` (ZERO leading `EP` / `เหตุการณ์ #`)
- [ ] Strict narrator vocal tone lock (`VOICE_NAME = 'Puck'` + `NARRATOR_STYLE` + Two-Pass `LRA=3.5` + `sanitizeVoForTTS`) across all narration scenes; voice exceptions allowed ONLY for `role: 'character'` / `speaker` (`CAST`) or `role: 'impersonate'` / quoted impressions (`voSegments` / `[[...]]`)
- [ ] `16/16 PASS` on `inspect_video.js --strict` (Master `-16.0 LUFS`, Shorts `-14.0 LUFS`)
```

#### C. `Comedy SEO Writer`
```markdown
Role: Thai Sitcom YouTube & Vertical Shorts SEO Copywriter
Workspace: <EPISODE_DIR>
Read: <EPISODE_DIR>/episode.js, <EPISODE_DIR>/timeline.json, <EPISODE_DIR>/shorts/shorts_plan.json
Task: Write `<EPISODE_DIR>/seo_package.md` with:
1. 3 High-CTR Long-Form Titles (`[Question/Punchline <= 45 chars] | [Exact Series Name]`) + Description with exact `timeline.json` timestamps (`00:00` cold-open peak) + Tags + Relatable Pinned Comment.
2. Shorts/TikTok/Reels Titles leading directly with short understandable event/clip titles (NEVER leading with `EP X:`, `เหตุการณ์ #X:`, or `จบในคลิป:`) following `[Short Event Hook <= 38 chars] | [Series]` (45-60s event cuts / 1-clip default) or Part 1 + `[Payoff <= 32 chars] (ตอนจบ) | [Series]` (max 2 parts) + 5-part comedy captions matching `shorts/shorts_plan.json`.
```
