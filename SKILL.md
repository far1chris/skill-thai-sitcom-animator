---
name: thai-sitcom-animator
description: >-
  Use when creating, scripting, rigging, voicing, or rendering 2D flat-color Adult Cartoon
  Sitcom animations in Thai (clean ink outlines, half-lidded expressive eyes, everyday Thai
  street/cafe/office/apartment environments, recurring cast characters, relatable Thai comedy,
  social media gags, HyperFrames Studio, 16:9 MP4, or 9:16 vertical Shorts/Reels/TikTok).
---

# Thai Adult Cartoon Sitcom Animator (`thai-sitcom-animator`)

Complete production workflow for **Adult Cartoon Sitcom Style** animations in Thai—featuring **clean black ink outlines (`#18181B`, `2.5–3px`), warm flat-color shading, signature half-lidded deadpan sitcom eyes, everyday Thai urban environments (coffee & bakery shops, street signs, BTS/soi sidewalks, offices, condos, convenience stores), recurring cast characters (`CAST`), relatable Thai slice-of-life comedy, and social-media punchline overlays**, built on **HyperFrames (`heygen-com/hyperframes`)** and Gemini Interactions TTS.

---

## 0. Intake & Sitcom Episode Planning

Before writing Phase 1 (`episode.js`), confirm or infer from the user's request:
1. **Comedy Situation & Setting:**
   - **A. คาเฟ่ & ถนนคนเมือง (Street & Cafe Life):** ปั่นจักรยานผ่านร้านกาแฟ, ป้ายเมนูแพงเกินจริง, ชีวิตสโลว์ไลฟ์ที่เงินในบัญชีไม่สโลว์ตาม (`streetCafeStage()`)
   - **B. มนุษย์ออฟฟิศ & ประชุมออนไลน์ (Office & Work-from-Home):** หัวหน้าสั่งแก้งานตอน 17:59 น., สลิปเงินเดือนออกแล้วหายวับใน 3 วินาที (`officeStage()`)
   - **C. ชีวิตหอพัก/คอนโด & โซเชียลมีเดีย (Condo & Social Media Drama):** สั่งอาหารเดลิเวอรีตอนตีสอง, รีวิวของตรงปก vs ไม่ตรงปก, แชตกลุ่มไลน์หมู่บ้าน (`roomInteriorStage()`)
   - **D. ร้านสะดวกซื้อ / ตลาดนัดยามเย็น (Thai Convenience & Night Market):** ยืนเลือกมาม่าตอนสิ้นเดือน, ป้าข้างบ้านถามเรื่องแต่งงาน/เงินเดือน
2. **Recurring Cast (`CAST` Roster):** Select from the built-in recurring characters (`ton` หนุ่มออฟฟิศหน้ามึน, `fah` เพื่อนสาวสายปั่น, `boss` หัวหน้ายิ้มเชือดเฉือน, `barista` พนักงานคาเฟ่หน้านิ่ง) or define custom cast members in `episode.js`.
3. **Target Deliverables:** Master `16:9` MP4 + `1920x1080` Sitcom Thumbnails + `EP 1..N <= 60s` Vertical `9:16` Shorts/Reels/TikTok + Covers + Thai Comedy SEO.

### Bootstrap Project Directory
Copy all files from [`templates/`](./templates/) and [`scripts/`](./scripts/) into the new episode folder and install dependencies:
```powershell
npm install
$env:GEMINI_API_KEYS = "key_proj1,key_proj2,key_proj3"
```

---

## 1. Visual DNA: Adult Cartoon Sitcom Art Direction

Match the exact **Adult Cartoon Sitcom** visual aesthetic (inspired by modern Western adult sitcoms adapted for Thai daily life):

### 1.1 Signature Character Design (`drawSitcomPerson` in [`templates/core.js`](./templates/core.js))
1. **Clean Ink Outlines (`2.5px–3px`, `#18181B`):**
   - Unlike lineless horror vectors, **every character part, prop, shirt collar, cuff, sneaker, and background building has a crisp dark ink outline (`inkrr`, `inkLimb`)** with flat, warm daylight colors and subtle 1-step cel-shading.
2. **Signature Sitcom Face & Half-Lidded Eyes:**
   - **Large Expressive Oval Eyes (`rx = 7.5, ry = 8.5`):** White sclera (`#FFFFFF`) with full `#18181B` outline, centered dark pupils, and **signature upper-eyelid droop (`eyelid = 0.42` default)** that gives characters that relatable, slightly tired, deadpan adult-sitcom look.
   - **Lip-Sync & Comedy Expressions (`expr` + `talking`):**
     - `'chill' | 'deadpan' | 'smirk' | 'side_eye' | 'awkward' | 'shock' | 'sigh' | 'happy' | 'annoyed'`
     - Pass `talking: true` when the character is speaking so the mouth animates open/closed naturally with `t`.
3. **Everyday Casual Wardrobe & Recurring Cast (`CAST`):**
   - **Rolled-up button-down shirts** with collar flaps, button plackets, and rolled cuffs (`topStyle: 'button_shirt' | 'tshirt' | 'hoodie' | 'apron'`).
   - **Cuffed blue jeans (`cuffedJeans: true`)** and **chunky white sneakers with lace details**.
   - **Bicycle & Everyday Props (`drawBicycle`, `phone`, `coffee`, `toteBag`, `laptop`):** Built-in `drawBicycle(c, x, y, s, { t, rider })` renders the complete city bicycle with spoked wheels, front wire basket, handlebars, pedals, and seated rider pedaling in sync!

### 1.2 Everyday Daylight & Urban Environments (`core.js` Stage Builders)
Never use dark horror fog or pure black backgrounds. Use **warm, inviting daylight, golden-hour, or cozy indoor palettes**:
1. **`streetCafeStage(c, t, o)`:** Warm cream/terracotta brick buildings, **green-&-white striped cafe awning (`COFFEE & BAKERY`)**, **wooden A-frame chalkboard sign (`Today's Special`)**, multi-plate directional street sign pole (`Oak St. / ซอยสุขุมวิท / คาเฟ่เปิดใหม่`), lush puffy green trees, sidewalk curb, asphalt road, and crosswalk stripes.
2. **`officeStage(c, t, o)`:** Clean modern Thai office desks, computer monitors, partition walls, wall clock (always 17:59!), water cooler, and sunny window blinds.
3. **`roomInteriorStage(c, t, o)`:** Cozy condo/apartment living room with sofa, TV, potted plant, framed wall art, and warm floor lamp.
4. **`splitChatStage(c, t, leftFn, rightFn)`:** Dynamic 2-panel split screen for phone calls, Line group chats, or "Expectation vs. Reality (สิ่งที่คิด vs ความเป็นจริง)" gags.

---

## 2. Thai Sitcom Comedy Structure & Social Media Overlays

Read [`references/sitcom-visual-and-comedy-guide.md`](./references/sitcom-visual-and-comedy-guide.md) for full schemas. Instead of horror rules, use **4 Relatable Thai Comedy Beats** and **Sitcom UI Overlays (`s.hud`)**:

### 2.1 The 4-Beat Thai Sitcom Gag Formula
1. **Setup (เปิดฉากชีวิตประจำวันสุดชิล):** ตัวละครกำลังใช้ชีวิตปกติ (เช่น ปั่นจักรยานรับลมเช้า, แวะซื้อกาแฟ, นั่งทำงานชิลๆ)
2. **Escalation / Social Trigger (จุดชนวนความฮาใกล้ตัว):** เจอเหตุการณ์กวนประสาทแบบไทยๆ (เช่น เมนูกาแฟชื่อยาวเหยียดราคาเท่ารถเมล์ทั้งเดือน, แจ้งเตือนเงินเดือนเข้าปุ๊บหักค่าบัตรเครดิตปั๊บ, เพื่อนทักมายืมตังค์)
3. **Expectation vs. Reality / Inner Monologue (สิ่งที่คิด vs ความเป็นจริง):** ตัดภาพเปรียบเทียบ หรือขึ้น Bubble ความคิดในหัวสวนทางกับหน้านิ่งๆ (`expr: 'deadpan'` หรือ `'side_eye'`)
4. **Deadpan Punchline & Reaction Tag (ตบมุกหน้านิ่ง + ป้ายสรุปพีคๆ):** ตบมุกสั้นๆ คมๆ พร้อมเสียง `ba_dum_tss` / `record_scratch` / `cash_register` และการ์ดตบมุก

### 2.2 Sitcom & Social Media HUD Archetypes (`s.hud`)
- **`type: 'speech'` / `'thought'`:** Comic speech bubble or cloud thought bubble pointing to a character (`speaker: 'ต้น'`, `text: [...]`).
- **`type: 'social'` (Social Media Post / Comment Card):** Floating Instagram/TikTok/X/Line notification card with avatar, handle (`@ton_slowlife`), caption, like counter (`❤️ 14.2K`), and top hilarious Thai netizen comment.
- **`type: 'chalkboard'` / `'price_tag'` (Signage & Wallet Damage Gag):** Cafe menu chalkboard or receipt breakdown (`กาแฟดริปคั่วอ่อน: 280฿`, `เงินในบัญชีเหลือ: 42.50฿`).
- **`type: 'versus'` (สิ่งที่คิด vs ความเป็นจริง):** Side-by-side comparison card with green expectation vs. red hilarious reality.
- **`type: 'punchline'` (Sitcom Reaction Banner):** Pop-in yellow/cream comic sticker badge (`⚠ ความจริงวันนี้`, `💸 ตัวเบาเฉียบพลัน`) with punchy Thai tagline.
- **Top-Right Sitcom Status Pill (`s.telemetry`):** Optional light-hearted life meter — e.g. `day: 'เช้าวันจันทร์ · ซอยอารีย์'`, `time: '08:45'`, `mood: 'ชิลทิพย์'`, `wallet: 120` (เงินติดตัว ฿), `caffeine: 15` (คาเฟอีน %), or `battery: 20` (พลังชีวิต %).

---

## 3. Upbeat Comedy Audio Pipeline (`generate_audio.js`)

Uses [`templates/generate_audio.js`](./templates/generate_audio.js) with **Gemini 3.8 Flash TTS (`Puck`)**:
- **Sitcom Vocal Style (`UNIFIED_STYLE`):**
  > `"witty, expressive, conversational male Thai sitcom narrator and voice actor, natural comedic timing, warm and lively everyday tone, clear punchline delivery"`
- **Built-In Comedy & Everyday Foley Catalog (`s.sfx`):**
  - **Comedy Timing:** `rimshot` / `ba_dum_tss` (ตบมุกกลอง), `record_scratch` (แผ่นเสียงสะดุดหน้าเหวอ), `boing` (เด้งดึ๋ง), `slide_whistle` (นกหวีดสไลด์แป้ก), `cricket` (จิ้งหรีดร้องกริบ), `sad_trombone` (แตรเศร้าเฟล), `vine_boom` (เสียงตึงมีม), `ding` (ปิ๊งไอเดีย)
  - **Everyday & Social:** `bike_bell` (กริ่งจักรยานกริ๊งๆ), `Line_ping` / `chat_pop` (เสียงเด้งแชต), `cash_register` (เสียงคิดเงิน касс), `cafe_door_bell` (กระดิ่งเข้าร้านกาแฟ), `slurp` (ดูดกาแฟ), `keyboard` (รัวคีย์บอร์ด), `step`, `steps`, `ui_pop`, `whoosh`
- **Daylight Ambient Beds (`s.bed`):**
  - `sunny_street` (นกร้องยามเช้า + ลมเบาๆ), `cafe_bossa` (จังหวะคอร์ดอุ่นๆ ในร้านกาแฟ + เสียงช้อนแก้วเบาๆ), `office_hum` (แอร์ออฟฟิศ + คีย์บอร์ด), `upbeat_quirky` (จังหวะเบสเดินกวนๆ สไตล์ซิตคอม), ` awkward_silence` (เงียบกริบชวนอึดอัด)

---

## 4. Workflow Commands (HyperFrames + Packaging + 16-Point QA)

```bash
node generate_audio.js                                   # 1. TTS + Comedy SFX + timeline.json (-16 LUFS)
node sync_hyperframes.js                                 # 2. Sync Kanit fonts, GSAP, & scene clips into index.html
node hf.js lint && node hf.js check                      # 3. Verify 0 errors, 0 warnings in HyperFrames
node audit_all_scenes.js                                 # 4. Generate audit_all_scenes.png & inspect via read_file
node hf.js render -f 24 -q looks -o master_hf.mp4        # 5. Render 16:9 Master MP4 (or node render_mp4.js --1080p)
node generate_thumbnail.js                               # 6. Render 2 Sitcom YouTube Thumbnails (1920x1080)
node generate_shorts_overlays.js                         # 7. Render Minimalist Title + EP Pill overlays (EP 1..N <= 58s)
node render_all_shorts.js                                # 8. Render 9:16 Vertical Shorts (<= 60s, -14 LUFS)
node generate_scene_covers.js                            # 9. Render 9:16 Key-Scene Covers
node inspect_video.js master_hf.mp4 --strict             # 10. Final 16/16 QA Gate
```
*(For full-episode multi-agent delegation across Director, Sitcom View Artist, Visual QA, and Comedy SEO Writer, see [`references/sitcom-visual-and-comedy-guide.md`](./references/sitcom-visual-and-comedy-guide.md).)*
