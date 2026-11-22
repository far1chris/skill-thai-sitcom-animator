---
name: thai-sitcom-animator
description: >-
  Use when creating, scripting, rigging, voicing, or rendering 2D flat-color Adult Cartoon
  Sitcom animations in Thai (clean ink outlines, half-lidded expressive eyes, everyday Thai
  street/cafe/office/apartment environments, recurring cast characters, relatable Thai comedy,
  social media gags, HyperFrames Studio, 16:9 MP4, or 9:16 vertical Shorts/Reels/TikTok).
---

# Thai Adult Cartoon Sitcom Animator (`thai-sitcom-animator`)

Complete production workflow for **Adult Cartoon Sitcom Style** animations in Thai—using the **Clean Option B Hybrid Visual Standard (คลีนช่วงเล่าเรื่อง + เด้งสติกเกอร์เฉพาะตอนตบมุก)**: clean black ink outlines (`#18181B`, `2.5–3px`), warm flat-color shading, signature half-lidded deadpan sitcom eyes, shallow-DoF blurred everyday Thai urban backgrounds during setups, and **high-impact white-sticker punchline cutouts + radial comic speed-lines + `drawComicBurst()` starbursts** on comedic shock beats—built on **HyperFrames (`heygen-com/hyperframes`)** and Gemini Interactions TTS.

> **Clean Option B Storytelling Rule (NO Giant Top Cream HUD Cards / NO Telemetry Boxes / NO Chapter Pills):**
> Keep both setup and punchline frames uncluttered so **characters' facial expressions and comedic acting own 70%+ of the screen**:
> - **ช่วงปูเรื่อง / เล่าเรื่องปกติ (Clean Setup):** ปิดกล่องข้อความสีครีมบนซ้าย (`drawCard`), Telemetry บนขวา (`drawTele`), และป้าย `drawChapter` ทิ้งทั้งหมด (ปิดเป็นค่าเริ่มต้นแล้วใน `core.js` และห้ามใส่ `chapter:`, `tele:`, `hud:` ใน `episode.js`) ให้ใช้ `blurLayer(c, 2.0, ...)` เบลอฉากหลังนุ่มๆ แล้ววางตัวละครไซซ์ใหญ่ (`scale 1.38–1.58`) นั่งหลังโต๊ะ/ถือพร็อพในโลกจริง (ห้ามใส่ขอบสติกเกอร์ขาวช่วงปูเรื่อง เพื่อให้เชื่อมกับโต๊ะ/วัตถุได้เนียน 100%)
> - **ช่วงตบมุก / ช็อตฟีล (Sticker Punchline Cut):** ใช้ `cameraRig` ซูมกระแทก (`snapAt`) สลับฉากเข้า `drawPunchlineBackdrop()`, วาดตัวละคร Close-Up (`scale 1.9–2.3`) ด้วย `drawStickerPerson()` (ขอบขาว + เงาตกกระทบ) + ท่าฮาๆ (`posePanic`, `poseFacepalm`, `posePoint`) + ดาวระเบิดคอมิก `drawComicBurst()` (`"ซุปสาด!!"`, `"ขาด 2.50!!"`, `"จ๊ะเอ๋!!"`, `"หมดตัว!!"`)
> - **มุกแชต / บทพูดสั้น:** ใช้ `drawSpeechBubble()` กะทัดรัดชี้ที่ตัวพูด หรือมือถือโคลสอัพ `hand({ phone: true })` แทนกล่องการ์ดยักษ์บังจอ!

---

## 0. Intake & Sitcom Episode Planning

Before writing Phase 1 (`episode.js`), confirm or infer from the user's request:
1. **Comedy Situation & Setting:**
   - **A. คาเฟ่ & ถนนคนเมือง (Street & Cafe Life):** ปั่นจักรยานผ่านร้านกาแฟ, ป้ายเมนูแพงเกินจริง, ชีวิตสโลว์ไลฟ์ที่เงินในบัญชีไม่สโลว์ตาม (`streetCafeStage()`)
   - **B. มนุษย์ออฟฟิศ & ประชุมออนไลน์ (Office & Work-from-Home):** หัวหน้าสั่งแก้งานตอน 17:59 น., สลิปเงินเดือนออกแล้วหายวับใน 3 วินาที (`officeStage()`)
   - **C. ชีวิตหอพัก/คอนโด & โซเชียลมีเดีย (Condo & Social Media Drama):** สั่งอาหารเดลิเวอรีตอนตีสอง, รีวิวของตรงปก vs ไม่ตรงปก, แชตกลุ่มไลน์หมู่บ้าน (`roomInteriorStage()`)
   - **D. ร้านสะดวกซื้อ / ตลาดนัดยามเย็น (Thai Convenience & Night Market):** ยืนเลือกมาม่าตอนสิ้นเดือน, ป้าข้างบ้านถามเรื่องแต่งงาน/เงินเดือน
2. **Recurring Cast (`CAST` Roster):** Select from the built-in recurring characters (`ton` หนุ่มออฟฟิศหน้ามึน, `fah` เพื่อนสาวสายปั่น, `boss` หัวหน้ายิ้มเชือดเฉือน, `barista` พนักงานคาเฟ่หน้านิ่ง) or define custom cast members in `episode.js`.
3. **Target Deliverables:** Master `16:9` MP4 + `1920x1080` Sitcom Thumbnails + **45–60s Shorts/Reels/TikTok Bundle** (auto-sliced by interesting **event cuts** via `format: 'events'`, OR 1 condensed `45–60s` clip, OR max 2 parts with 3s recap) + Clean Covers + Thai Comedy SEO.

### Bootstrap Project Directory
Copy files **ONLY** from [`templates/`](./templates/) and [`scripts/`](./scripts/) into the new episode folder and install dependencies:
```powershell
npm install
$env:GEMINI_API_KEYS = "key_proj1,key_proj2,key_proj3"
```

> **⛔ Strict Context-Isolation Rule (Zero Cross-Episode File Reading) & User Camera Lock:**
> - **NEVER** scan inside, inspect, or `read_file` any previous `sitcom-*` or episode folders on `C:\`, `D:\`, or `scratch\` (`episode.js`, `views.js`, `packaging.json`). Reading old projects causes subconscious layout/gag cloning.
> - Map every scene/camera direction requested by the user (`ภาพและฉาก:` / `มุมกล้อง:`) 1:1 into `SCENES` with `cameraSpec`, and keep sub-scene expansions inside the user's specified setting by varying framing, DoF blur, and punchline cuts.

---

## 1. Visual DNA: Adult Cartoon Sitcom Art Direction

Match the exact **Adult Cartoon Sitcom** visual aesthetic (inspired by modern Western adult sitcoms adapted for Thai daily life):

### 1.1 Signature Character Design (`drawSitcomPerson` in [`templates/core.js`](./templates/core.js))
1. **Clean Ink Outlines (`2.5px–3px`, `#18181B`):**
   - Unlike lineless horror vectors, **every character part, prop, shirt collar, cuff, sneaker, and background building has a crisp dark ink outline (`inkrr`, `inkLimb`)** with flat, warm daylight colors and subtle 1-step cel-shading.
2. **Signature Sitcom Face & Half-Lidded Eyes:**
   - **Large Expressive Oval Eyes (`rx = 7.5, ry = 8.5`):** White sclera (`#FFFFFF`) with full `#18181B` outline, centered dark pupils, and **signature upper-eyelid droop (`eyelid = 0.42` default)** that gives characters that relatable, slightly tired, deadpan adult-sitcom look.
   - **Lip-Sync, Comedy Expressions & Mid-Scene Reaction Flips (`expr`, `exprAt`, `talking`):**
     - `'chill' | 'deadpan' | 'smirk' | 'side_eye' | 'awkward' | 'shock' | 'sigh' | 'happy' | 'annoyed'`
     - Pass `talking: true` when the character is speaking so the mouth animates open/closed naturally with `t`.
     - Use `exprAt` for instant mid-scene punchline reactions (e.g., `exprAt: [[0, 'chill'], [1.8, 'shock']]` or `exprAt: { at: 1.8, expr: 'shock', sweat: true }`) so characters snap from chill to shocked right on the audio beat!
3. **Natural Low Poses & Sitcom Comedy Acting Rigs (`core.js`):**
   - Sit/crouch naturally with `withHipLean()` hip-pivoting & `clampSitArms()`: **`poseFloorSit(t)`** (`by: 72`) for sitting on floor mats/ground, **`poseSit(t, { curb: true })`** (`by: 54`) for low steps/stools, **`poseSit(t)`** (`by: 34`) for chairs/tables, **`poseSquat(t)`** (`by: 64`) for deep squats, and low grounded **`poseKneel(t)`** (`by: 58`, never for floor sitting!).
   - Expressive punchline poses: **`posePanic(t)`** (hands thrown up near face in panic), **`poseFacepalm(t)`**, **`posePoint(t)`**, plus `drawBicycle(c, x, y, s, { t, rider })`, `phone`, `coffee`, `receipt`, `creditCard`, `cash50`.

### 1.2 Everyday Daylight Staging & Option B Punchline Mode (`core.js`)
Never use dark horror fog or clutter scenes with giant top cream HUD cards. Pair **blurred clean setups** with **high-contrast sticker punchlines**:
1. **`streetCafeStage(c, t, o)` / `officeStage(c, t, o)` / `roomInteriorStage(c, t, o)` / `splitChatStage(c, t, leftFn, rightFn)`:** Wrap the static background layer inside `blurLayer(c, 1.8..2.4, ...)` during setups so foreground `drawSitcomPerson()` characters & foreground tables pop cleanly with depth of field.
2. **Option B Punchline Kit (`drawPunchlineBackdrop`, `drawStickerPerson`, `drawComicBurst`, `drawSpeechBubble`):**
   - `drawPunchlineBackdrop(c, t, o)`: Diagonal comic split gradient (`leftBg` vs `rightBg`) + radial speed-lines (`drawSpeedLines`) + electric lightning bolt crack.
   - `drawStickerPerson(c, x, y, s, opts, borderR, overlayFn)`: Renders `drawSitcomPerson` (+ optional `overlayFn` soup stains/props inside the silhouette) with an aspect-compensated white sticker border + drop shadow (`16:9` & `9:16 SHORTS_MODE` safe!). Reserve sticker borders **strictly for punchline/shock beats**—never during normal setups where characters sit behind tables.
   - `drawComicBurst(c, cx, cy, label, o)`: Jagged white+yellow comic starburst + bold Kanit 900 punchword (`"ซุปสาด!!"`, `"ขาด 2.50!!"`, `"สายแน่!!"`) instead of prose HUD boxes.
   - `drawSpeechBubble(c, x, y, text, o)`: Compact (`<= 340px`) in-world dialogue/thought bubble pointing directly at the character.

> **Dynamic Sitcom Camera & Motion Rule:** Never leave a scene static for `> 3s` and never repeat the exact same framing for `> 2` consecutive scenes. Wrap views with `cameraRig(c, lt, s.dur, { zoomFrom: 1.0, zoomTo: 1.04, snapAt, shakeAt })` so setups gently push in and punchline cuts snap-zoom (`1.12x–1.16x`) synced with comedic SFX.

---

## 2. Thai Sitcom Comedy Structure & Frameless Punchline Visuals

Read [`references/sitcom-visual-and-comedy-guide.md`](./references/sitcom-visual-and-comedy-guide.md) for full schemas. Tell every joke visually using the **Inverted Peak-First 4-Beat Thai Comedy Formula**, **Option B Sticker Punchlines**, and frameless `drawSub` subtitles (**top cream HUD cards `drawCard` and `drawTele` are disabled by default**):

### 2.1 The Event-Cut / Inverted 4-Beat Sitcom Gag Formula (`45–60s` ต่อเหตุการณ์ หรือจบใน 1 คลิป — ไม่เกิน 2 ตอน)
1. **Beat 1 — Zero-Delay 3-Second Peak / Anomaly Hook (`0.06s` Lead, `t0 = 0.00s` Sub):** เปิดคลิปด้วยวินาทีช็อตฟีลสุดขีดทันทีใน 3 วิแรก (`COLD_OPEN_LEAD = 0.06s` + `t0 = 0.000s` ซับกระชับ `<= 24–26` ตัวอักษร + Sticker Punchline snap-cut & `drawComicBurst()`)
2. **Beat 2 — Rewind & Context Setup (ย้อนเล่าที่มาแบบคลีน):** ตัดกลับมาช่วงปูเรื่อง **Clean Setup** (ฉากหลังเบลอเบาๆ ไม่มีขอบสติกเกอร์ ไม่มีกรอบข้อความบังหน้า) ให้ตัวละครแสดงแอ็กติงธรรมชาติเพื่อดึง Avg View Duration ขึ้น **`30–45 วินาที`**
3. **Beat 3 — Escalation & Social Trigger (`splitChatStage` + `drawSpeechBubble` + `exprAt`):** ขยายความป่วนด้วยแชต `splitChatStage` คู่บับเบิลคำพูดกะทัดรัด และ `exprAt` เปลี่ยนหน้าชิลล์เป็นหน้าเหวอตรงจังหวะเสียง
4. **Beat 4 — Standalone Event-Cut / Punchline Ending (`45–60s` ต่อเหตุการณ์):**
   - **เรื่องยาวหลายมุก/หลายเหตุการณ์ (`format: 'events'`):** ใส่ `eventId` / `eventTitle` ในฉาก หรือ `events: [...]` ใน `shorts_config.json` (หรือปล่อย `shorts_planner.js` ตัดอัตโนมัติ) เพื่อตัดแบ่งเรื่องน่าสนใจออกมาเป็น **แต่ละคลิปเหตุการณ์ `45–60s`** ที่ขมวดปมจบฮาในตัวเอง
   - **เรื่องสั้นจบใน 1 คลิป / ไม่เกิน 2 ตอน:** เรื่องสั้น `<= 58s` จบใน 1 คลิป หรือหากแบ่ง 2 ตอน (`act: 2, isRecap: true`) **ตอนที่ 2 ต้องสรุปความเดิมสั้น ๆ ใน 3 วิแรก!**
   - **High-Retention Ending & 2s Silent Visual CTA:** **ห้ามพูดขอไลก์/แชร์/ซับใน 3 วินาทีสุดท้าย** (`"ฝากกดไลก์ กดแชร์ กดติดตาม..."` เพราะจะทำให้คนดูปัดหนีทันที) ให้ปิดด้วย **(1) คำถามเลือกข้างจากในเรื่อง** (เช่น *"ถ้าเป็นคุณ โดนทักไลน์ตอน 17:59 จะอ่านไม่ตอบ หรือแกล้งสลบคาโต๊ะดีครับ?"*), **(2) ปมค้างคา 1 ประโยค / สะพานเชื่อมคลิปยาวหน้าช่อง**, และ **`drawShortsEndingCTA`** ที่ขึ้นป้าย + ลูกศรชี้ลง `▼` อัตโนมัติในช่วง 2.25 วินาทีสุดท้าย!

### 2.2 Visual Comedy Tools vs. Disabled Heavy HUD Cards
- **Recommended In-Scene Visuals:**
  - `drawComicBurst(c, cx, cy, label)`: ดาวระเบิดคำตบมุกสั้นๆ (`"ซุปสาด!!"`, `"หมดตัว!!"`, `"ขาด 2.50!!"`)
  - `drawSpeechBubble(c, x, y, text, o)`: บับเบิลคำพูดขนาดกะทัดรัดตรงหัวคนพูด
  - `hand(c, x, y, ang, s, { phone: true, receipt: true })`: จอมือถือ/ใบเสร็จโคลสอัพในมือตัวละครจริง
  - `splitChatStage(c, t, leftFn, rightFn)`: ฉากแบ่งครึ่งสายฟ้าสำหรับมุกเทียบ *"สิ่งที่คิด vs ความเป็นจริง"* หรือโต้ตอบข้ามสถานที่
- **Disabled by Default (`__ENABLE_SITCOM_HUD` / `__ENABLE_SITCOM_TELE` / `__ENABLE_SITCOM_CHAPTER` off):** กล่องข้อความสีครีมใหญ่ด้านบน (`drawCard`), Telemetry มุมขวาบน (`drawTele`), และป้าย `drawChapter` ถูกปิดเป็นค่าเริ่มต้น เพื่อไม่ให้บังตัวละครและกินพื้นที่จอ 40% เหมือนสไลด์บรรยายครับ

### 2.3 การตั้งชื่อคลิปและ Shorts SEO: เอาชื่อคลิปขึ้นหน้าสุด (ห้ามนำหน้าด้วย `EP` / `จบในคลิป:`) + `<= 38–45` ตัวอักษร + `| ชื่อซีรีส์`
- **สูตรตั้งชื่อบังคับ:**
  - **คลิปเต็ม (Long-Form):** **`[ประโยคคำถามหรือจุดพีค <= 45 ตัวอักษรแรก] | [ชื่อซีรีส์เหมือนกันเป๊ะ]`**
  - **Shorts จบใน 1 คลิป (`45–60s`, แนะนำ):** **`[ชื่อคลิปสั้นเข้าใจง่าย <= 38 ตัวอักษร] | [ชื่อซีรีส์]`** *(ห้ามขึ้นต้นด้วย `EP 1:` หรือ `จบในคลิป:` ให้เอาชื่อคลิปสั้นๆ ขึ้นหน้าสุดทันที!)*
  - **Shorts แบบ 2 ตอน (กรณีเรื่องยาว ห้ามเกิน 2 ตอน):** **`[ชื่อคลิปตอนเปิด <= 38 ตัวอักษร] | [ชื่อซีรีส์เหมือนกันเป๊ะ]`** และ **`[ชื่อคลิปตอนสรุป <= 34 ตัวอักษร] (ตอนจบ) | [ชื่อซีรีส์เหมือนกันเป๊ะ]`**
- ใส่คำโปรย/ชื่อคลิปสั้น **ไม่เกิน 38 ตัวอักษร** ไว้หน้าสุดเพื่อให้อ่านจบเข้าใจทันทีบนหน้าฟีด ไม่โดนตัดคำ และต่อท้ายด้วย **`| [ชื่อซีรีส์]`** เหมือนกันเป๊ะ
- **ตัวอย่าง:**
  - `สลับร่างกับแฟน! | ซิตคอมคนเมือง` *(หัวบนคลิป & ปก: 2 บรรทัดสลับสีแดง `#EF4444` / ขาว `#FFFFFF` หรือขาว / เหลือง-ส้ม — **ปิดแถบ Pill สีแดง/ส้ม, Telemetry HUD บนปก, กรอบสีเหลือง/Viewfinder แดง, Stamp ด้านล่าง (`เหตุการณ์ #1–#5`, `EP 1`, `จบใน 1 คลิป`) และเส้น Gradient ด้านล่างทั้งหมด!**)*
  - `กาแฟ 145 เงินเหลือ 142?! | ซิตคอมมนุษย์ออฟฟิศ` *(26 ตัวอักษร)*
  - `ประชุม 8:30 ใครสายเลี้ยงทั้งทีม! | ซิตคอมมนุษย์ออฟฟิศ` / `บอสถือใบเสร็จรอหน้าลิฟต์ (ตอนจบ) | ซิตคอมมนุษย์ออฟฟิศ`

### 2.4 High-CTR Comic Sitcom Thumbnails & Vertical Covers (`templates/render_pro_thumbnails.js`)
แทนที่จะแคปฉากดิบที่มีกรอบ HUD เล็กๆ รกตา ให้สร้างปกสไตล์ **High-CTR Thai Adult Sitcom Comic Cover** ด้วย [`templates/render_pro_thumbnails.js`](./templates/render_pro_thumbnails.js) (อ่านค่าจาก `packaging.json -> proThumbnails` และ `shorts/shorts_plan.json` หรือปรับแต่งพร็อพเฉพาะตอนได้ทันที):
- **ปกคลิปยาว YouTube แบบที่ 1 (`thumbnail_reallens_showdown.png`, `1920x1080`):**
  - ฉากหลัง **Diagonal Split Contrast** (สีอุ่นส้ม-แดงตัดสีน้ำเงิน-กรมท่าเข้ม) + เส้น **Radial Comic Speed-Lines** + สายฟ้าผ่ากลางฉาก
  - ตัวละครหลัก **Close-Up ขนาดใหญ่ (`scale 3.2–3.65x`)** พร้อม **ขอบสติกเกอร์สีขาว + เงาตกกระทบ (`drawStickerChar`)** ให้ตัวละครเด้งออกจากพื้นหลัง (ปิด HUD เล็กๆ จากในคลิปทั้งหมด)
  - ดาวระเบิดคอมิกตรงกลาง (`จ๊ะเอ๋!!` / คำพีคสั้น) + ป้ายสติกเกอร์ตัวเลขช็อกเอียง 2 มุมบน + แถบมืดด้านล่าง + แคปซูลชื่อซีรีส์ + **พาดหัวใหญ่ 2 สี Kanit 900 ขอบดำหนา** (ขาว + ไล่เฉดเหลือง-ส้ม `#FEF08A -> #FACC15 -> #F97316`) อ่านชัดแม้ดูบนจอมือถือ
- **ปกคลิปยาว YouTube แบบที่ 2 (`thumbnail_reallens_5panel.png`, `1920x1080` — A/B Test Variant):**
  - กริดการ์ตูน **2×2 รวม 4 หายนะ** คั่นด้วยขอบขาวหนา พร้อมตัวละคร Close-Up ขอบสติกเกอร์ขาวทุกช่อง
  - วางแถบแคปชันเลข `1–2` ที่ **ด้านบน** ของช่องบน และเลข `3–4` ที่ **ด้านล่าง** ของช่องล่าง เพื่อไม่ให้โดนป้ายชื่อตอนขอบทองตรงกลางบังข้อความ
- **ปก Shorts แนวตั้ง 9:16 (`shorts/cover_*.png`, `1080x1920`):**
  - ฉากหลังไล่เฉด + เส้น Radial Speed-Lines + ตัวละคร Close-Up ขอบสติกเกอร์ขาว (`drawStickerChar` ใช้ขนาด `c.canvas.width × c.canvas.height` เต็มเฟรม) + พร็อพ/การ์ดจุดพีคกลางเฟรม + แถบไล่สีมืดด้านบนรองรับพาดหัว 2 บรรทัดใหญ่สีขาว/เหลือง-ส้ม (อ่านชัด 100% ไม่มีข้อความพื้นหลังตีกัน)

---

## 3. Upbeat Comedy Audio Pipeline (`generate_audio.js`)

Uses [`templates/generate_audio.js`](./templates/generate_audio.js) with **Strict Narrator Vocal Tone Lock (`Puck`, single `lockedModelId` per episode)** + **Explicit Exceptions for Other Characters (`CAST`) & Impersonations**, parallel synthesis across `GEMINI_API_KEYS` (with `dailyExhausted` tracking), **`-16.0 LUFS` Two-Pass Linear EBU R128 mastering (`dynaudnorm` + `LRA=3.5` narrator lock / `LRA=4.5` characters)**, tight cut timing (`0.06s` cold-open / `0.18s` normal lead, `0.25s` pad), fast `chunkSubs(24)` (`<= 26` chars), and **Dual-Bus Ducking** (`bedMix` 42% duck vs. `impactSfxMix` `<= 10%` duck so comedy stings punch through dialogue):
- **Strict Narrator Vocal Tone Lock (`VOICE_NAME = "Puck"`):** All narration lines (`role: 'narrator'` default and protagonist `'ton'`) remain locked to the **exact same single voice (`Puck`)**, pitch register, and deadpan sitcom cadence (`NARRATOR_STYLE` + `sanitizeVoForTTS(text, 'narrator')` strips `?!`/`!` before TTS so punchlines don't spike in pitch while subtitles preserve `?!`; never override `voice` on narrator lines).
- **Character & Impersonation Exceptions (`ตัวละครอื่น` & `ตอนทำเสียงเป็นคนอื่น`):**
  - **Other Characters (`role: 'character'` / `speaker`):** Built-in `CAST` voices (`fah` / `clinic_staff` / `sales_girl` $\rightarrow$ `'Kore'`, `boss` $\rightarrow$ `'Charon'`, `barista` / `rider` / `friend_male` $\rightarrow$ `'Fenrir'`, `mother` / `auntie` $\rightarrow$ `'Aoede'`, plus custom `episode.CHARACTER_VOICES`).
  - **Narrator Impersonations (`role: 'impersonate'` / `impersonate` / `voicePreset`):** Narrator `'Puck'` acts out an impression (`'sweet_sales'`, `'elder'`, `'deep'`, `'excited'`, `'phone_speaker'`) with expressive inflection before snapping cleanly back to locked deadpan `'Puck'` on the next narrator segment.
  - Supports multi-role scenes via `scene.voSegments`, inline `[[char:fah|...]]` / `[[impersonate:sweet_sales|...]]` tags, or speech-verb quotes (`พูดว่า "..."`), with clean subtitle stripping via `stripVoMarkupForSubs()`.
- **AI Pronunciation & Speech Clarity Guard (`normalizeThaiForTTS` + `inspectVoClipClarity`):** Converts digits, times, baht amounts, units, abbreviations, and acronyms (`LINE`, `CCTV`, `KPI`, `7-Eleven`, `episode.PRONUNCIATION_MAP`, `scene.ttsVo`) to natural spoken Thai before synthesis while keeping subtitles clean; audits every generated WAV (`0–100` clarity score for cutoff, dropout, mumbled endings, and muffled articulation), auto-retries unclear fresh takes (`--fix-unclear`, `--verify-asr` Gemini ASR round-trip, `--audit-only`), and exports `audio/pronunciation_report.json` verified by `inspect_video.js`.
- **Sitcom Narrator Style (`UNIFIED_STYLE` / `NARRATOR_STYLE`):**
  > `"same single male Thai narrator (Puck) across all scenes, locked warm conversational baritone pitch register, consistent deadpan sitcom tone, steady even cadence, identical close-mic proximity, zero theatrical shouting or pitch jumps"`
- **Built-In Comedy & Everyday Foley Catalog (`s.sfx`):**
  - **Comedy Timing:** `rimshot` / `ba_dum_tss` (ตบมุกกลอง), `record_scratch` (แผ่นเสียงสะดุดหน้าเหวอ), `boing` (เด้งดึ๋ง), `slide_whistle` (นกหวีดสไลด์แป้ก), `cricket` (จิ้งหรีดร้องกริบ), `sad_trombone` (แตรเศร้าเฟล), `vine_boom` (เสียงตึงมีม), `ding` (ปิ๊งไอเดีย)
  - **Everyday & Social:** `bike_bell` (กริ่งจักรยานกริ๊งๆ), `line_ping` / `chat_pop` (เสียงเด้งแชต), `cash_register` (เสียงคิดเงิน касс), `cafe_door_bell` (กระดิ่งเข้าร้านกาแฟ), `slurp` (ดูดกาแฟ), `keyboard` (รัวคีย์บอร์ด), `step`, `steps`, `ui_pop`, `whoosh`
- **Daylight Ambient Beds (`s.bed`):**
  - `sunny_street` (นกร้องยามเช้า + ลมเบาๆ), `cafe_bossa` (จังหวะคอร์ดอุ่นๆ ในร้านกาแฟ + เสียงช้อนแก้วเบาๆ), `office_hum` (แอร์ออฟฟิศ + คีย์บอร์ด), `upbeat_quirky` (จังหวะเบสเดินกวนๆ สไตล์ซิตคอม), `awkward_silence` (เงียบกริบชวนอึดอัด)

---

## 4. Workflow Commands (HyperFrames + Packaging + 16-Point QA)

> **⏸️ MANDATORY USER REVIEW GATE (ตรวจคลิปยาวก่อนทำคลิปสั้น):**
> เมื่อสร้างและตรวจคลิปยาว (`master_hf.mp4` + ปก 16:9) ใน **Stage A** เสร็จแล้ว **ให้หยุดส่งคลิปยาวให้ผู้ใช้ตรวจสอบก่อนเสมอ ห้ามสั่งรัน Stage B (`generate_shorts_overlays.js`, `render_all_shorts.js`, หรือปก Shorts) อัตโนมัติจนกว่าผู้ใช้จะตรวจคลิปยาวเสร็จและบอกให้ทำคลิปสั้นต่อ** *(ยกเว้นกรณีผู้ใช้สั่งทำเฉพาะคลิปสั้นตั้งแต่ต้น)*

```bash
# --- Stage A: Long-Form 16:9 Master & QA (ส่งให้ผู้ใช้ตรวจก่อนเสมอ!) ---
node generate_audio.js                                   # 1. Parallel TTS + Dual-Bus Comedy SFX + timeline.json (-16 LUFS)
node sync_hyperframes.js                                 # 2. Sync Kanit fonts, GSAP, & scene clips into index.html
node hf.js lint && node hf.js check                      # 3. Verify 0 errors, 0 warnings in HyperFrames
node audit_all_scenes.js                                 # 4. Generate audit_all_scenes.png & inspect via read_file
node hf.js render -f 24 -q looks -o master_hf.mp4        # 5. Render 16:9 Master MP4 (or node render_mp4.js --1080p)
node inspect_video.js master_hf.mp4 --strict             # 6. Long-Form 16/16 QA Gate -> STOP & let user review master_hf.mp4!

# --- Stage B: Vertical Shorts & Covers (รันหลังผู้ใช้ตรวจคลิปยาวและสั่งให้ทำต่อเท่านั้น!) ---
node render_pro_thumbnails.js                            # 7. Render High-CTR Comic Thumbnails (16:9 Showdown + 2x2 Grid) & Radial 9:16 Shorts Covers
node generate_shorts_overlays.js                         # 8. Render Clean 2-Line Two-Tone Title Overlays (NO Pill/Red Box, NO leading EP)
node render_all_shorts.js                                # 9. Render 45-60s Full-Screen Shorts (--format events|single|two_part, -14 LUFS)
node inspect_video.js shorts/<clip>.mp4 --shorts --strict # 10. Final Shorts 16/16 QA Gate (<= 60s, Safe Zone, Title SEO)
```
*(For full-episode multi-agent delegation across Director, Sitcom View Artist, Visual QA, and Comedy SEO Writer, see [`references/sitcom-visual-and-comedy-guide.md`](./references/sitcom-visual-and-comedy-guide.md).)*
