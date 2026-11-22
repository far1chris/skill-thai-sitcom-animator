// =============================================================================
//  views.js — Clean Storytelling & 6-Mode Punchline Toolkit Scene Renderers
//  Part of skill: thai-sitcom-animator
//  Visual Flow:
//    - Clean Setup scenes: Zero giant top cream HUD cards (`drawCard`/`drawTele` disabled).
//      Soft shallow-DoF background (`blurLayer`), crisp foreground characters interacting
//      naturally with props & furniture (no sticker halo), plus compact `drawSpeechBubble`.
//    - 6-Mode Punchline Toolkit (no back-to-back repeats — match mood to joke):
//      1. `punchDeadpanZoom`      — The Office crash zoom + forehead gloom + `• • •`
//      2. `punchFreezeSpotlight`  — Record-scratch grayscale freeze + color spotlight + arrow
//      3. `punchMangaImpact`      — Manga radial focus lines + flash + Dutch angle + soul escape
//      4. `punchEvidenceCutIn`    — Macro K-PLUS/LINE proof phone + pure reaction comic insets
//      5. `punchInScenePopOut`    — Real stage preserved + white-sticker hero + variety kinetic text
//      6. `punchExpectationRip`   — Torn-paper diagonal split: dreamy expectation vs grey reality
// =============================================================================

const NO_BLUR_VIEWS = [
  'v01_morning_bike',
  'v02_menu_math',
  'v03_office_line',
  'v04_turbo_punchline',
  'v05_freeze_spotlight',
  'v06_manga_impact',
  'v07_expectation_rip'
];

const VIEWS = {
  // Scene 1 (Clean Setup): Morning commuter bike ride past COFFEE & BAKERY (zero sticker halo)
  v01_morning_bike(c, lt, s) {
    cameraRig(c, lt, s.dur, { zoomFrom: 1.0, zoomTo: 1.04, focusX: 540, focusY: 440 }, () => {
      blurLayer(c, 1.8, (bc) => {
        streetCafeStage(bc, lt, {
          pan: 18,
          shopTitle: 'COFFEE & BAKERY',
          signs: ['Oak St.', 'ซอยสุขุมวิท 21', 'คาเฟ่เปิดใหม่'],
          chalkLines: ["Today's Special", 'Fresh Coffee', 'Bakery', '145.-', 'Open 8am - 6pm']
        });
      });

      drawSitcomPerson(c, 880 - lt * 10, 505, 1.04, {
        t: lt, cast: 'barista', dir: -1, expr: 'happy', coffee: true
      });

      drawBicycle(c, 455 + Math.sin(lt * 1.5) * 8, 640, 1.38, {
        t: lt, speed: 1.5, dir: 1, cast: 'ton', expr: 'chill', talking: lt < (s.voDur || 5)
      });
    });
  },

  // Scene 2 (Setup -> Mode 4 Diegetic Evidence Cut-In): K-PLUS 142.50 proof + dual reaction insets
  v02_menu_math(c, lt, s) {
    if (lt < 1.2) {
      cameraRig(c, lt, 1.2, { zoomFrom: 1.02, zoomTo: 1.08, focusX: 520, focusY: 410 }, () => {
        blurLayer(c, 2.0, (bc) => {
          streetCafeStage(bc, lt, {
            pan: 0,
            shopTitle: 'COFFEE & BAKERY',
            signs: ['ซอยสุขุมวิท 21', 'ถ.อโศกมนตรี', 'คาเฟ่เปิดใหม่'],
            chalkLines: ["Today's Special", 'ยูซุอเมริกาโน่', 'แก้วละ 145.-', 'รับเฉพาะโอน']
          });
        });

        drawBicycle(c, 325, 635, 1.26, { t: 0, speed: 0, dir: 1, rider: false });
        drawSitcomPerson(c, 535, 625, 1.48, {
          t: lt, cast: 'ton', dir: -1, expr: 'awkward', talking: lt < (s.voDur || 5),
          pose: poseStand(lt, { arms: [{ a: 0.25, b: 1.1 }, { a: 0.2, b: 0.3 }] })
        });
      });
      return;
    }

    cameraRig(c, lt, s.dur, { snapAt: 1.2, snapScale: isShortsMode() ? 1.05 : 1.08, shakeAt: 1.2, shakeAmp: 5, focusX: 640, focusY: 360 }, () => {
      punchEvidenceCutIn(c, lt, {
        bgFn: (bc, t) => streetCafeStage(bc, t, { pan: 0, shopTitle: 'COFFEE & BAKERY', signs: [] }),
        phone: {
          app: 'K-PLUS',
          account: 'ออมทรัพย์',
          amount: '฿ 142.50',
          merchant: 'ผู้รับโอน: COFFEE & BAKERY',
          billLabel: 'ยอดชำระ',
          billValue: '145.00 บาท',
          errorTitle: 'ยอดเงินไม่เพียงพอ',
          errorSub: '(ขาดอีก 2.50 บาท)'
        },
        topHero: {
          t: lt, cast: 'ton', dir: -1, lookX: -2, expr: 'shock', darkCircles: true, sweat: true, tear: true, shadow: false,
          pose: posePanic(lt)
        },
        bottomHero: {
          t: lt, cast: 'barista', dir: -1, expr: 'deadpan', coffee: true, shadow: false
        }
      });
    });
  },

  // Scene 3 (Split Chat Setup -> Mode 1 Deadpan Crash Zoom): Boss LINE -> Deadpan Ton Gloom
  v03_office_line(c, lt, s) {
    if (lt < 1.8) {
      splitChatStage(
        c,
        lt,
        (ctx, t) => {
          blurLayer(ctx, 2.0, (bc) => { streetCafeStage(bc, t, { pan: 0, chalkboard: false }); });
          drawSitcomPerson(ctx, 360, 650, 1.56, {
            t, cast: 'ton', dir: 1, expr: 'shock', sweat: true, phone: true, talking: t < (s.voDur || 5)
          });
        },
        (ctx, t) => {
          blurLayer(ctx, 2.0, (bc) => { officeStage(bc, t, { deskX: 740, boardTitle: '08:30 ประชุมด่วน!' }); });
          drawSitcomPerson(ctx, 940, 645, 1.54, {
            t, cast: 'boss', dir: -1, expr: 'annoyed', phone: true, pose: posePoint(t)
          });
          if (t > 0.35) {
            drawSpeechBubble(ctx, 880, 175, '08:30 น. ใครสายเลี้ยงทั้งทีม!', { tailDir: 'br', size: 19 });
          }
        }
      );
      return;
    }

    cameraRig(c, lt, s.dur, { snapAt: 1.8, snapScale: 1.12, focusX: 600, focusY: 280 }, () => {
      punchDeadpanZoom(c, lt, {
        at: 1.8,
        bgFn: (bc, t) => {
          streetCafeStage(bc, t, { pan: 0, shopTitle: 'COFFEE & BAKERY', signs: [] });
          drawSitcomPerson(bc, 210, 625, 1.56, { t, cast: 'barista', dir: 1, expr: 'deadpan', coffee: true });
        },
        hero: { t: lt, cast: 'ton', expr: 'deadpan', darkCircles: true, sweat: true }
      });
    });
  },

  // Scene 4 (Turbo Bike Action -> Mode 5 In-Scene Pop-Out): Keeps real street + Variety Text!
  v04_turbo_punchline(c, lt, s) {
    if (lt < 1.6) {
      cameraRig(c, lt, 1.6, { zoomFrom: 1.02, zoomTo: 1.08, focusX: 520, focusY: 420 }, () => {
        blurLayer(c, 3.0, (bc) => {
          streetCafeStage(bc, lt, { pan: 95, shopTitle: 'COFFEE & BAKERY' });
        });
        c.save();
        c.strokeStyle = 'rgba(255,255,255,0.75)';
        c.lineWidth = 3.5;
        for (let i = 0; i < 14; i++) {
          const y = 120 + (i * 42) % 520;
          const x = W - ((lt * 980 + i * 173) % (W + 300));
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + 140, y); c.stroke();
        }
        c.restore();

        drawBicycle(c, 450 + Math.sin(lt * 12) * 10, 665, 1.38, {
          t: lt, speed: 3.8, dir: 1, cast: 'ton', expr: 'awkward', sweat: true, talking: lt < (s.voDur || 5)
        });
      });
      return;
    }

    cameraRig(c, lt, s.dur, { snapAt: 1.6, snapScale: isShortsMode() ? 1.05 : 1.12, shakeAt: 1.6, shakeAmp: 6, focusX: 600, focusY: 360 }, () => {
      punchInScenePopOut(c, lt, {
        at: 1.6,
        bgFn: (bc, t) => streetCafeStage(bc, t, { pan: 40, shopTitle: 'COFFEE & BAKERY' }),
        midFn: (mc, t, shorts) => {
          drawBicycle(mc, shorts ? 745 : 940, 625, shorts ? 1.05 : 1.24, { t: 0, speed: 0, dir: -1, rider: false });
        },
        hero: { t: lt, cast: 'ton', expr: 'shock', darkCircles: true, sweat: true, tear: true, pose: posePanic(lt) },
        tag: 'เงินติดบัญชีก็หมด',
        mainText: 'สายแน่!!'
      });
    });
  },

  // Example 5 (Mode 2 Freeze-Frame & Spotlight): Grayscale record-scratch spotlight on mistake
  v05_freeze_spotlight(c, lt, s) {
    punchFreezeSpotlight(c, lt, {
      freezeAt: 1.2,
      spotX: 568,
      spotY: 380,
      label: 'เหลือแค่ 142.50.-!!',
      badge: 'RECORD SCRATCH',
      sceneFn: (sc, ft) => {
        streetCafeStage(sc, 0, { pan: 0, shopTitle: 'COFFEE & BAKERY', signs: ['ซอยสุขุมวิท 21', 'คาเฟ่เปิดใหม่'] });
        drawBicycle(sc, 275, 625, 1.24, { t: 0, speed: 0, dir: 1, rider: false });
        drawSitcomPerson(sc, 545, 635, 1.56, {
          t: ft, cast: 'ton', dir: 1, expr: 'shock', darkCircles: true, sweat: true, tear: true, phone: true, pose: posePanic(ft)
        });
        drawSitcomPerson(sc, 885, 632, 1.52, {
          t: ft, cast: 'barista', dir: -1, expr: 'deadpan', coffee: true,
          pose: poseStand(ft, { arms: [{ a: 0.44, b: 0.96 }, { a: 0.14, b: 0.35 }] })
        });
      }
    });
  },

  // Example 6 (Mode 3 Manga Impact Cut): Focus lines + Dutch angle + soul escaping from mouth
  v06_manga_impact(c, lt, s) {
    punchMangaImpact(c, lt, {
      at: 0.5,
      sfxText: 'ช็อก!!',
      subText: 'ขาด 2.50!!',
      soul: true,
      hero: { t: lt, cast: 'ton', expr: 'shock', darkCircles: true, sweat: true, tear: true, pose: posePanic(lt) }
    });
  },

  // Example 7 (Mode 6 Expectation vs Reality Rip): Diagonal torn-paper comparison
  v07_expectation_rip(c, lt, s) {
    punchExpectationRip(c, lt, {
      leftLabel: 'สิ่งที่คิด',
      rightLabel: 'ความจริง',
      expectationFn: (ec, t) => {
        streetCafeStage(ec, 0, { pan: 0, shopTitle: 'COFFEE & BAKERY', signs: [] });
        drawSitcomPerson(ec, isShortsMode() ? 450 : 320, 645, isShortsMode() ? 1.56 : 2.02, {
          t, cast: 'ton', dir: 1, expr: 'happy', sunglasses: true, coffee: true,
          pose: poseStand(t, { arms: [{ a: 0.42, b: 0.98 }, { a: 0.1, b: 0.28 }], lean: -0.04 })
        });
      },
      realityFn: (rc, t) => {
        streetCafeStage(rc, 0, { pan: 0, skyTop: '#64748B', shopTitle: 'COFFEE & BAKERY', signs: [] });
        drawSitcomPerson(rc, isShortsMode() ? 765 : 805, 645, isShortsMode() ? 1.54 : 1.98, {
          t, cast: 'ton', dir: 1, expr: 'shock', darkCircles: true, sweat: true, tear: true, gloom: 0.56,
          pose: poseStand(t, { arms: [{ a: 0.25, b: 0.9 }, { a: -0.2, b: 0.75 }], lean: 0.06, tilt: 0.08 })
        });
        if (!isShortsMode()) {
          drawSitcomPerson(rc, 1105, 642, 1.82, {
            t, cast: 'barista', dir: -1, expr: 'deadpan', coffee: true,
            pose: poseStand(t, { arms: [{ a: 0.45, b: 0.96 }, { a: 0.14, b: 0.35 }] })
          });
        }
      }
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
