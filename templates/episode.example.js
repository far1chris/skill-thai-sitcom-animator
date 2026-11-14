// =============================================================================
//  episode.js — Starter Thai Adult Sitcom & Everyday Social Comedy Template
//  Part of skill: thai-sitcom-animator
//  Showcases the exact reference image scene (Ton riding his commuter bicycle
//  past the COFFEE & BAKERY shop), hipster menu sticker shock, office LINE group
//  chaos, and deadpan Thai comedic punchlines.
// =============================================================================

const TITLE = 'เมื่ออยากใช้ชีวิตสโลว์ไลฟ์ แต่เงินในบัญชีบอกให้ปั่นไปทำงาน';
const SUBTITLE = 'Thai Adult Sitcom Animation · ซิตคอมชีวิตประจำวัน';

const SCENES = [
  {
    id: 's01_morning_bike',
    view: 'v01_morning_bike',
    chapter: ['ตอนที่ 1', 'เช้าวันจันทร์แบบสโลว์ไลฟ์'],
    vo: 'เช้าวันจันทร์ที่อากาศสดใส ผมตัดสินใจปั่นจักรยานแม่บ้านออกมาสูดอากาศแบบคนคูลๆ ผ่านหน้าร้านกาแฟเปิดใหม่ในซอย กลิ่นครัวซองต์หอมทะลุแมสก์ออกมาเลยครับ',
    pad: 0.6,
    bed: 'sunny_street',
    sfx: [
      { type: 'bike_bell', at: 0.3 },
      { type: 'chat_pop', at: 1.2 }
    ],
    tele: {
      day: 'วันจันทร์ต้นเดือน?',
      time: '08:15',
      wallet: 142,
      wmax: 1000,
      mood: 'ชิลล์จัด 😌',
      label: '📍 ซอยสุขุมวิท 21 · หน้าร้าน COFFEE & BAKERY'
    },
    hud: {
      type: 'chalkboard',
      pos: 'tr',
      at: 1.0,
      badge: '☕ ป้ายหน้าร้าน · TODAY SPECIAL',
      title: ['อเมริกาโน่ส้มยูซุคั่วกลาง', 'แก้วละ 145 บาท'],
      eng: 'FRESH COFFEE & BAKERY · OPEN 8AM - 6PM'
    }
  },
  {
    id: 's02_menu_math',
    view: 'v02_menu_math',
    vo: 'พอก้มดูป้ายเมนูหน้าร้าน แก้วละร้อยสี่สิบห้าบาท แต่เปิดแอปธนาคารดูยอดเงินคงเหลือ มีอยู่ร้อยสี่สิบสองบาทห้าสิบตังค์ ขาดไปสองบาทห้าสิบ ชีวิตสโลว์ไลฟ์จบตั้งแต่ยังไม่จอดจักรยาน',
    pad: 0.6,
    bed: 'cafe_bossa',
    sfx: [
      { type: 'record_scratch', at: 0.35 },
      { type: 'cash_register', at: 1.4 },
      { type: 'sad_trombone', at: 4.8 }
    ],
    tele: {
      day: 'เช็กบิลความจริง',
      time: '08:17',
      wallet: 142,
      wmax: 1000,
      mood: 'ช็อตฟีล 😳',
      label: '⚠ เงินขาดไป 2.50 บาท'
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
    id: 's03_office_line',
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
      pos: 'tr',
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
