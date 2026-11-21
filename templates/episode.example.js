// =============================================================================
//  episode.js — Starter Thai Adult Sitcom & Everyday Social Comedy Template
//  Part of skill: thai-sitcom-animator
//  Default Structure: Event Cuts (`45-60s`/event via `eventId`/`eventTitle`) or Standalone
//  1-Clip Story (`act: 1`, 45-60s). If a 2-part story is used (`maxEp = 2`), mark Part 2's
//  opener with `act: 2, isRecap: true` and summarize the previous beat in 3s ("ความเดิม...").
//
//  Optional Shorts Header Overrides (NO leading "EP 1:", "เหตุการณ์ #1:", or pills/stamps):
//    shortsTitle   : string or [titleTop, titleBot] — short 2-line punchy title
//    titleRedLine  : 1 | 2 — which line renders in Red (#EF4444) vs White (#FFFFFF)
//    eventId       : optional scene grouping key for 45-60s event-cut Shorts
//    eventTitle    : optional short title for that event cut
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
    coverAt: 1.4,
    coverHeadline: ['กาแฟ 145', 'เงินเหลือ 142?!'],
    chapter: ['เปิดคลิป 3 วิแรก · HOOK', 'วินาทีช็อตฟีลหน้าร้าน'],
    vo: 'แก้วละร้อยสี่สิบห้าบาท แต่เปิดแอปธนาคารมาเงินเหลือร้อยสี่สิบสองบาทห้าสิบตังค์ ขาดไปสองบาทห้าสิบ แล้วสั่งไปแล้วด้วยทำไงดีครับ!',
    pad: 0.5,
    bed: 'cafe_bossa',
    sfx: [
      { type: 'record_scratch', at: 0.15 },
      { type: 'cash_register', at: 1.2 },
      { type: 'sad_trombone', at: 4.5 }
    ],
    tele: {
      day: 'วินาทีช็อตฟีล!',
      time: '08:17',
      wallet: 142,
      wmax: 1000,
      mood: 'ช็อตฟีล 😳',
      label: '⚠ เงินขาดไป 2.50 บาท!'
    },
    hud: {
      type: 'price_tag',
      pos: 'r',
      at: 0.5,
      badge: '🧾 คำนวณงบคาเฟ่เช้านี้ · CAFE MATH',
      rows: [
        ['ราคากาแฟส้มยูซุหน้าร้าน', '145.00 บ.'],
        ['ยอดเงินคงเหลือในแอป', '142.50 บ.'],
        ['ค่าธรรมเนียมความเท่', 'ติดลบ 2.50 บ.']
      ],
      total: ['สรุปเช้านี้', 'กินน้ำเปล่าออฟฟิศ'],
      note: ['ประหยัดไปได้ตั้ง 145 บาท (ปลอบใจตัวเอง)']
    }
  },
  {
    id: 's02_rewind_morning_bike',
    act: 1,
    view: 'v01_morning_bike',
    chapter: ['ย้อน 5 นาทีก่อน · REWIND', 'เช้าวันจันทร์แบบสโลว์ไลฟ์'],
    vo: 'ย้อนกลับไปเมื่อห้านาทีก่อน ชีวิตผมยังดูดีอยู่เลยครับ เช้าวันจันทร์ปั่นจักรยานแม่บ้านรับลมผ่านหน้าร้านกาแฟเปิดใหม่ กะจะแวะซื้อให้ดูคูลๆ สักแก้ว',
    pad: 0.6,
    bed: 'sunny_street',
    sfx: [
      { type: 'bike_bell', at: 0.3 },
      { type: 'chat_pop', at: 1.2 }
    ],
    tele: {
      day: 'ย้อนเมื่อ 5 นาทีก่อน',
      time: '08:12',
      wallet: 142,
      wmax: 1000,
      mood: 'ชิลล์ทิพย์ 😌',
      label: '📍 ซอยสุขุมวิท 21 · หน้าร้าน COFFEE & BAKERY'
    },
    hud: {
      type: 'chalkboard',
      pos: 'tm',
      at: 1.0,
      badge: '☕ ป้ายหน้าร้าน · TODAY SPECIAL',
      title: ['อเมริกาโน่ส้มยูซุคั่วกลาง', 'แก้วละ 145 บาท'],
      eng: 'FRESH COFFEE & BAKERY · OPEN 8AM - 6PM'
    }
  },
  {
    id: 's03_office_line',
    act: 1,
    view: 'v03_office_line',
    vo: 'ยังไม่ทันจะได้ถอนหายใจ เสียงไลน์กลุ่มออฟฟิศก็เด้งรัวๆ พี่บอสพิมพ์มาบอกว่า เช้านี้นัดประชุมด่วนตอนแปดโมงครึ่ง ใครมาสายเลี้ยงกาแฟทั้งแผนก',
    pad: 0.6,
    bed: 'upbeat_quirky',
    sfx: [
      { type: 'line_ping', at: 0.3 },
      { type: 'line_ping', at: 0.65 },
      { type: 'vine_boom', at: 2.8 }
    ],
    tele: {
      day: 'กลุ่ม LINE ออฟฟิศ',
      time: '08:22',
      caffeine: 12,
      mood: 'เลิ่กลั่ก 💦',
      label: '💬 พี่บอส (อ่านแล้ว 14 คน)'
    },
    hud: {
      type: 'social',
      pos: 'tm',
      at: 0.6,
      app: 'LINE กลุ่มแผนก',
      user: 'พี่บอส (หัวหน้า)',
      title: ['"8:30 ประชุมด่วนห้องใหญ่"', 'ใครสายเลี้ยงกาแฟสดทั้งทีม!'],
      likes: 'กดร้องไห้ 12 คน',
      comments: 'ไม่มีใครกล้าตอบ'
    }
  },
  {
    id: 's04_turbo_punchline',
    act: 1,
    view: 'v04_turbo_punchline',
    vo: 'จากที่ปั่นกินลมชมวิวแบบพระเอกเอ็มวี ตอนนี้ต้องยืนโยกจักรยานแม่บ้านด้วยความเร็วแสง เพราะถ้าไปสายขึ้นมา ลำพังแค่กาแฟตัวเองยังไม่มีตังค์ซื้อเลยครับพี่น้อง',
    pad: 0.7,
    bed: 'upbeat_quirky',
    sfx: [
      { type: 'whoosh', at: 0.4 },
      { type: 'bike_bell', at: 1.6 },
      { type: 'rimshot', at: 4.5 }
    ],
    tele: {
      day: 'โหมดปั่นหนีตาย',
      time: '08:28',
      wallet: 142,
      wmax: 1000,
      mood: 'ปั่นลืมตาย 🚴‍♂️💨',
      label: '⚡ ความเร็วขาปั่น: ระดับตูร์เดอฟรองซ์'
    },
    hud: {
      type: 'versus',
      at: 0.5,
      head: 'สิ่งที่คิดตอนออกจากบ้าน VS ความเป็นจริง',
      optA: {
        title: 'สิ่งที่คิด (08:00 น.)',
        icon: '😎☕',
        res: 'ปั่นชิลล์จิบกาแฟเก๋ๆ',
        en: 'SLOW LIFE VIBES',
        danger: false
      },
      optB: {
        title: 'ความจริง (08:28 น.)',
        icon: '🚴‍♂️💨',
        res: 'ปั่นหนีพี่บอสหอบแดก',
        en: 'TOUR DE OFFICE',
        danger: true
      }
    }
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
    chapter: ['ตอนจบ · RECAP 3 วิแรก', 'หนีตายห้องประชุม'],
    ...
  }
*/
