// =============================================================================
//  views.js — Option B Hybrid Sitcom Scene Renderers (Clean Storytelling + Sticker Punchline)
//  Part of skill: thai-sitcom-animator
//  Visual Flow:
//    - Setup scenes (`v01_morning_bike`, `v03_office_line`): Zero giant top HUD cards!
//      Soft shallow-DoF background (`blurLayer`), crisp foreground characters interacting
//      naturally with props & furniture (no sticker halo), plus compact `drawSpeechBubble`.
//    - Punchline beats (`v02_menu_math`, `v04_turbo_punchline`): Camera snap-zooms via
//      `cameraRig`, cuts/switches into `drawPunchlineBackdrop()`, `drawStickerPerson()`,
//      expressive reaction poses (`posePanic`, `poseFacepalm`), and `drawComicBurst()`.
// =============================================================================

const NO_BLUR_VIEWS = ['v01_morning_bike', 'v02_menu_math', 'v03_office_line', 'v04_turbo_punchline'];

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

      // Barista standing warmly near café doorway
      drawSitcomPerson(c, 880 - lt * 10, 505, 1.04, {
        t: lt,
        cast: 'barista',
        dir: -1,
        expr: 'happy',
        coffee: true
      });

      // Protagonist Ton riding city commuter bicycle in crisp foreground
      drawBicycle(c, 455 + Math.sin(lt * 1.5) * 8, 640, 1.38, {
        t: lt,
        speed: 1.5,
        dir: 1,
        cast: 'ton',
        expr: 'chill',
        talking: lt < (s.voDur || 5)
      });
    });
  },

  // Scene 2 (Option B Hybrid): Clean sidewalk setup (lt < 1.2s) -> Sticker Punchline snap-cut (lt >= 1.2s)
  v02_menu_math(c, lt, s) {
    const isPunchline = lt >= 1.2;
    if (!isPunchline) {
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
          t: lt,
          cast: 'ton',
          dir: -1,
          expr: 'awkward',
          talking: lt < (s.voDur || 5),
          pose: poseStand(lt, { arms: [{ a: 0.25, b: 1.1 }, { a: 0.2, b: 0.3 }] })
        });

        const popK = easeBack(prog(lt, 0.2, 0.7));
        if (popK > 0) {
          hand(c, 195, 760 - 150 * popK, 0.14, 1.15, {
            phone: true,
            phoneTitle: 'K-PLUS',
            phoneText: '฿ 142.50',
            phoneSub: 'ขาดอีก 2.50 บาท!'
          });
        }
      });
      return;
    }

    // PUNCHLINE BEAT: Split comic backdrop + radial speed lines + Sticker Hero + Comic Burst!
    const shorts = typeof isShortsMode === 'function' && isShortsMode();
    cameraRig(c, lt, s.dur, { snapAt: 1.2, snapScale: shorts ? 1.06 : 1.14, shakeAt: 1.2, shakeAmp: 7, focusX: 640, focusY: 360 }, () => {
      drawPunchlineBackdrop(c, lt, {
        leftBg: ['#FDE047', '#F97316', '#991B1B'],
        rightBg: ['#0F172A', '#1E293B', '#09090B'],
        split: true
      });

      const py = shorts ? 620 : 785;
      const pScale = shorts ? 1.82 : 2.08;
      drawStickerPerson(c, shorts ? 475 : 465, py, pScale, {
        t: lt,
        cast: 'ton',
        dir: 1,
        expr: 'shock',
        darkCircles: true,
        sweat: true,
        tear: true,
        talking: lt < (s.voDur || 5),
        pose: posePanic(lt)
      }, 7);

      drawStickerPerson(c, shorts ? 810 : 885, py - 10, pScale * 0.92, {
        t: lt,
        cast: 'barista',
        dir: -1,
        expr: 'deadpan',
        coffee: true,
        pose: poseStand(lt, { arms: [{ a: 0.45, b: 0.95 }, { a: 0.2, b: 0.4 }] })
      }, 6);

      drawComicBurst(c, 640, shorts ? 155 : 148, 'ขาด 2.50!!', { scale: shorts ? 0.92 : 1.08 });
    });
  },

  // Scene 3 (Clean Setup): Split-screen chat with soft blurred walls & compact comic speech bubble
  v03_office_line(c, lt, s) {
    splitChatStage(
      c,
      lt,
      (ctx, t) => {
        blurLayer(ctx, 2.0, (bc) => { streetCafeStage(bc, t, { pan: 0, chalkboard: false }); });
        drawSitcomPerson(ctx, 275, 650, 1.56, {
          t,
          cast: 'ton',
          dir: 1,
          expr: 'shock',
          sweat: true,
          phone: true,
          talking: t < (s.voDur || 5)
        });
      },
      (ctx, t) => {
        blurLayer(ctx, 2.0, (bc) => { officeStage(bc, t, { deskX: 740, boardTitle: '⏰ 08:30 ประชุมด่วน!' }); });
        drawSitcomPerson(ctx, 975, 645, 1.54, {
          t,
          cast: 'boss',
          dir: -1,
          expr: 'annoyed',
          phone: true,
          pose: posePoint(t)
        });
        if (t > 0.35) {
          drawSpeechBubble(ctx, 935, 175, '08:30 น. ใครสายเลี้ยงทั้งทีม!', { tailDir: 'br', size: 19 });
        }
      }
    );
  },

  // Scene 4 (Punchline Finale): High-speed Tour de Office + Speed Lines + Comic Burst!
  v04_turbo_punchline(c, lt, s) {
    cameraRig(c, lt, s.dur, { snapAt: 1.6, snapScale: 1.12, shakeAt: 1.6, shakeAmp: 6, focusX: 520, focusY: 420 }, () => {
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
        t: lt,
        speed: 3.8,
        dir: 1,
        cast: 'ton',
        expr: 'awkward',
        sweat: true,
        talking: lt < (s.voDur || 5)
      });

      if (lt >= 1.2) {
        drawComicBurst(c, 920, 165, 'สายแน่!!', { scale: 1.05 });
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
