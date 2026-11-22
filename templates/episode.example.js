// =============================================================================
//  episode.js — Option B Clean Storytelling & Sticker Punchline Sitcom Template
//  Part of skill: thai-sitcom-animator
//  Visual Standard: ZERO top cream HUD cards, ZERO telemetry boxes, ZERO chapter pills!
//  Tell jokes through pure visual staging (blurred setups + sticker punchlines +
//  drawComicBurst / drawSpeechBubble + clean drawSub subtitles).
//
//  Default Structure: Event Cuts (`45-60s`/event via `eventId`/`eventTitle`) or Standalone
//  1-Clip Story (`act: 1`, 45-60s). If a 2-part story is used (`maxEp = 2`), mark Part 2's
//  opener with `act: 2, isRecap: true` and summarize the previous beat in 3s ("ความเดิม...").
// =============================================================================

const TITLE = 'กาแฟ 145 เงินเหลือ 142?! | ซิตคอมมนุษย์ออฟฟิศ';
const SUBTITLE = 'Thai Adult Sitcom Animation · ซิตคอมชีวิตประจำวัน';

const SHORTS_TITLE = ['กาแฟ 145', 'เงินเหลือ 142?!'];
const TITLE_RED_LINE = 1;

const SCENES = [
  {
    id: 's01_peak_sticker_shock',
    act: 1,
    eventId: 'ev_coffee_shock',
    eventTitle: 'กาแฟ 145 เงินเหลือ 142?!',
    view: 'v02_menu_math',
    isClimax: true,
    coverAt: 2.0,
    focusX: 540,
    coverHeadline: ['กาแฟ 145', 'เงินเหลือ 142?!'],
    cameraSpec: { framing: 'Setup Sidewalk -> Sticker Punchline Snap-Zoom', pitch: 'eye-level -> punchline closeup' },
    vo: 'แก้วละร้อยสี่สิบห้าบาท แต่เปิดแอปธนาคารมาเงินเหลือร้อยสี่สิบสองบาทห้าสิบตังค์ ขาดไปสองบาทห้าสิบ แล้วสั่งไปแล้วด้วยทำไงดีครับ!',
    pad: 0.5,
    bed: 'cafe_bossa',
    sfx: [
      { type: 'record_scratch', at: 1.2 },
      { type: 'cash_register', at: 0.4 },
      { type: 'sad_trombone', at: 4.5 }
    ]
  },
  {
    id: 's02_rewind_morning_bike',
    act: 1,
    view: 'v01_morning_bike',
    focusX: 480,
    cameraSpec: { framing: 'Clean Wide Daylight Tracking', pitch: 'slightly low sidewalk' },
    vo: 'ย้อนกลับไปเมื่อห้านาทีก่อน ชีวิตผมยังดูดีอยู่เลยครับ เช้าวันจันทร์ปั่นจักรยานแม่บ้านรับลมผ่านหน้าร้านกาแฟเปิดใหม่ กะจะแวะซื้อให้ดูคูลๆ สักแก้ว',
    pad: 0.6,
    bed: 'sunny_street',
    sfx: [
      { type: 'bike_bell', at: 0.3 },
      { type: 'chat_pop', at: 1.2 }
    ]
  },
  {
    id: 's03_office_line',
    act: 1,
    view: 'v03_office_line',
    focusX: 520,
    cameraSpec: { framing: 'Split-Chat Blurred BGs + Speech Bubble', pitch: 'medium two-shot' },
    vo: 'ยังไม่ทันจะได้ถอนหายใจ เสียงไลน์กลุ่มออฟฟิศก็เด้งรัวๆ พี่บอสพิมพ์มาบอกว่า เช้านี้นัดประชุมด่วนตอนแปดโมงครึ่ง ใครมาสายเลี้ยงกาแฟทั้งแผนก',
    pad: 0.6,
    bed: 'upbeat_quirky',
    sfx: [
      { type: 'line_ping', at: 0.3 },
      { type: 'line_ping', at: 0.65 },
      { type: 'vine_boom', at: 2.8 }
    ]
  },
  {
    id: 's04_turbo_punchline',
    act: 1,
    view: 'v04_turbo_punchline',
    focusX: 520,
    cameraSpec: { framing: 'Dynamic Speed-Lines + Comic Burst Snap-Zoom', pitch: 'low tracking action' },
    vo: 'จากที่ปั่นกินลมชมวิวแบบพระเอกเอ็มวี ตอนนี้ต้องยืนโยกจักรยานแม่บ้านด้วยความเร็วแสง เพราะถ้าไปสายขึ้นมา ลำพังแค่กาแฟตัวเองยังไม่มีตังค์ซื้อเลยครับพี่น้อง',
    pad: 0.7,
    bed: 'upbeat_quirky',
    sfx: [
      { type: 'whoosh', at: 0.4 },
      { type: 'bike_bell', at: 1.2 },
      { type: 'rimshot', at: 4.5 }
    ]
  }
];

module.exports = { TITLE, SUBTITLE, SCENES };

/* Optional 2-Part Sitcom Template (MAX 2 EPs — ONLY if story exceeds 60s):
  {
    id: 's05_part2_recap_opener',
    act: 2,
    isRecap: true, // Forces 0.06s Cold-Open + 0.00s subtitle for 3s recap!
    view: 'v03_office_line',
    vo: 'ความเดิมเมื่อกี้ เงินในบัญชีเหลือร้อยสี่สิบสองบาท แต่พี่บอสเพิ่งทวงกาแฟทั้งแผนกหน้าลิฟต์...',
    ...
  }
*/
