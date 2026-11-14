// =============================================================================
//  views.js — Starter Thai Adult Sitcom & Everyday Social Comedy Scene Renderers
//  Part of skill: thai-sitcom-animator
//  Demonstrates:
//    - v01_morning_bike: Exact recreation of the Adult Cartoon Sitcom reference
//      image (Ton on city commuter bicycle with front wire basket passing the
//      COFFEE & BAKERY shop with green-and-white striped awning, A-frame
//      Today's Special chalkboard, and multi-plate street sign pole).
//    - v02_menu_math: Sidewalk reaction + macro POV smartphone banking balance check.
//    - v03_office_line: Split-screen chat stage (Ton on street vs Boss in office).
//    - v04_turbo_punchline: High-speed turbo pedaling with comic speed lines.
// =============================================================================

const NO_BLUR_VIEWS = ['v01_morning_bike', 'v03_office_line'];

const VIEWS = {
  // Scene 1: Morning commuter bike ride past COFFEE & BAKERY (Reference Image Hero Shot!)
  v01_morning_bike(c, lt, s) {
    streetCafeStage(c, lt, {
      pan: 18,
      shopTitle: 'COFFEE & BAKERY',
      signs: ['Oak St.', 'Maple Ave.', '3rd St.'],
      chalkLines: ["Today's Special", 'Fresh Coffee', 'Bakery', 'Sandwich', 'Open 8am - 6pm']
    });

    // Barista standing warmly near café doorway
    drawSitcomPerson(c, 880 - lt * 10, 495, 0.96, {
      t: lt,
      cast: 'barista',
      dir: -1,
      expr: 'happy',
      coffee: true
    });

    // Protagonist Ton riding the grey commuter bicycle with wire basket
    drawBicycle(c, 455 + Math.sin(lt * 1.5) * 8, 635, 1.32, {
      t: lt,
      speed: 1.5,
      dir: 1,
      cast: 'ton',
      expr: 'chill',
      talking: lt < (s.voDur || 5)
    });
  },

  // Scene 2: Sticker shock looking at the chalkboard vs mobile banking app
  v02_menu_math(c, lt, s) {
    streetCafeStage(c, lt, {
      pan: 0,
      shopTitle: 'COFFEE & BAKERY',
      signs: ['ซอยสุขุมวิท 21', 'ถ.อโศกมนตรี', 'คาเฟ่เปิดใหม่'],
      chalkLines: ["Today's Special", 'ยูซุอเมริกาโน่', 'ครัวซองต์ทรัฟเฟิล', 'แก้วละ 145.-', 'รับเฉพาะโอน']
    });

    // Ton stopped next to his bike, looking at his phone with deadpan/awkward sweat
    drawBicycle(c, 330, 625, 1.22, {
      t: 0,
      speed: 0,
      dir: 1,
      rider: false
    });

    drawSitcomPerson(c, 485, 615, 1.38, {
      t: lt,
      cast: 'ton',
      dir: -1,
      expr: lt > 1.2 ? 'awkward' : 'shock',
      sweat: lt > 1.0,
      talking: lt < (s.voDur || 5),
      pose: poseStand(lt, { arms: [{ a: 0.25, b: 1.1 }, { a: 0.2, b: 0.3 }] })
    });

    // Foreground Macro POV Hand holding smartphone with 142.50 Baht balance
    const popK = easeBack(prog(lt, 0.4, 0.9));
    if (popK > 0) {
      hand(c, 195, 760 - 150 * popK, 0.14, 1.15, {
        phone: true,
        phoneTitle: 'K-PLUS',
        phoneText: '฿ 142.50',
        phoneSub: 'ขาดอีก 2.50 บาท!'
      });
    }
  },

  // Scene 3: Split-screen Office LINE Group emergency message from Boss
  v03_office_line(c, lt, s) {
    splitChatStage(
      c,
      lt,
      // Left Half: Ton panicking on the street with his phone
      (ctx, t) => {
        streetCafeStage(ctx, t, { pan: 0, chalkboard: false });
        drawSitcomPerson(ctx, 250, 625, 1.42, {
          t,
          cast: 'ton',
          dir: 1,
          expr: 'shock',
          sweat: true,
          phone: true,
          talking: t < (s.voDur || 5)
        });
      },
      // Right Half: Boss in the office pointing at the 08:30 clock
      (ctx, t) => {
        officeStage(ctx, t, { deskX: 740, boardTitle: '⏰ 08:30 ประชุมด่วน!' });
        drawSitcomPerson(ctx, 975, 615, 1.4, {
          t,
          cast: 'boss',
          dir: -1,
          expr: 'annoyed',
          phone: true,
          pose: poseStand(t, { arms: [{ a: -0.85, b: -0.4 }, { a: 0.2, b: 0.3 }] })
        });
      }
    );
  },

  // Scene 4: High-speed Tour de Office turbo cycling punchline
  v04_turbo_punchline(c, lt, s) {
    streetCafeStage(c, lt, {
      pan: 95,
      shopTitle: 'COFFEE & BAKERY'
    });

    // Comic horizontal speed lines across the frame
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = 3.5;
    for (let i = 0; i < 14; i++) {
      const y = 120 + (i * 42) % 520;
      const x = ((W - ((lt * 980 + i * 173) % (W + 300))));
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 140, y);
      c.stroke();
    }
    c.restore();

    // Ton turbo-pedaling at 3.8x speed with panic sweat
    drawBicycle(c, 420 + Math.sin(lt * 12) * 10, 656, 1.24, {
      t: lt,
      speed: 3.8,
      dir: 1,
      cast: 'ton',
      expr: 'awkward',
      talking: lt < (s.voDur || 5)
    });
  }
};

if (typeof window !== 'undefined') {
  window.VIEWS = VIEWS;
  window.NO_BLUR_VIEWS = NO_BLUR_VIEWS;
}
if (typeof module !== 'undefined') {
  module.exports = { VIEWS, NO_BLUR_VIEWS };
}
