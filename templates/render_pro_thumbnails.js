// =============================================================================
//  render_pro_thumbnails.js — High-CTR Thai Adult Sitcom Thumbnails & Covers
//  Part of skill: thai-sitcom-animator
//  Data-driven via packaging.json (`proThumbnails`) + shorts/shorts_plan.json.
//  Generates:
//    1. thumbnail_reallens_showdown.png (1920x1080 — Split-Contrast Hero Showdown)
//    2. thumbnail_reallens_5panel.png   (1920x1080 — 2x2 4-Act Comic Grid A/B Cover)
//    3. shorts/cover_*.png              (1080x1920 — High-CTR Radial Vertical Covers)
//
//  Usage:
//    node render_pro_thumbnails.js [--dir <projectDir>]
// =============================================================================
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

function getArg(...flags) {
  for (const flag of flags) {
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  }
  return null;
}

const projectDir = path.resolve(getArg('--dir') || process.cwd());
const localReq = createRequire(
  fs.existsSync(path.join(projectDir, 'package.json'))
    ? path.join(projectDir, 'package.json')
    : path.join(projectDir, '_resolver.js')
);

function loadPuppeteer() {
  for (const r of [localReq, require]) {
    try { return r('puppeteer-core'); } catch (_) {}
    try { return r('puppeteer'); } catch (_) {}
  }
  throw new Error('puppeteer-core not found. Run: npm install puppeteer-core');
}

const puppeteer = loadPuppeteer();

function findChrome() {
  for (const p of [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ]) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

const fontRegular = path.join(projectDir, 'assets', 'fonts', 'Kanit-Regular.ttf').replace(/\\/g, '/');
const fontBold = path.join(projectDir, 'assets', 'fonts', 'Kanit-Bold.ttf').replace(/\\/g, '/');
const fontBlack = path.join(projectDir, 'assets', 'fonts', 'Kanit-Black.ttf').replace(/\\/g, '/');
const fontExtraBold = fs.existsSync(path.join(projectDir, 'assets', 'fonts', 'Kanit-ExtraBold.ttf'))
  ? path.join(projectDir, 'assets', 'fonts', 'Kanit-ExtraBold.ttf').replace(/\\/g, '/')
  : fontBlack;

const coreSrc = fs.readFileSync(path.join(projectDir, 'core.js'), 'utf8');
const pkgPath = path.join(projectDir, 'packaging.json');
const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : {};
const planPath = path.join(projectDir, 'shorts', 'shorts_plan.json');
const shortsPlan = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : null;

// Build data-driven config with sensible sitcom defaults if `proThumbnails` is omitted
const proCfg = pkg.proThumbnails || {};
const showdownCfg = Object.assign({
  leftBg: ['#FDE047', '#F97316', '#991B1B'],
  rightBg: ['#2563EB', '#1E293B', '#09090B'],
  leftChar: { cast: 'ton', expr: 'shock', darkCircles: true, tear: true, sweat: true },
  rightChar: { cast: 'boss', expr: 'shock' },
  centerBurst: 'จ๊ะเอ๋!!',
  leftBadge: { bg: '#DC2626', line1: 'ความพังขั้นสุด!', line2: 'ช็อกทั้งออฟฟิศ!', l1Col: '#FFFFFF', l2Col: '#FEF08A' },
  rightBadge: { bg: '#1E293B', line1: 'ชีวิตมนุษย์ออฟฟิศ', line2: 'เหลือติดบัญชี!', l1Col: '#FACC15', l2Col: '#4ADE80' },
  seriesPill: '🔥 ซิตคอมมนุษย์ออฟฟิศ · ตอนพิเศษ',
  headlineWhite: (pkg.title || 'ช็อตฟีลทั้งวัน ').split(' ').slice(0, 2).join(' ') + ' ',
  headlineGold: (pkg.title || 'ซวยยับทั้งสัปดาห์!').split(' ').slice(2).join(' ') || 'พังยับไม่เหลือชิ้นดี!',
  subHook: pkg.subtitle || 'ฮาจุกอก · หักมุมซ้ำสอง · ชีวิตจริงมนุษย์เงินเดือน!'
}, proCfg.showdown || {});

const comicGridCfg = Object.assign({
  centerTitle: pkg.title || 'ซิตคอมมนุษย์ออฟฟิศ!',
  centerSub: 'ซิตคอมมนุษย์ออฟฟิศ · รวมครบ 4 หายนะ!',
  panels: [
    { num: '1', bg: ['#1E3A8A', '#0F172A'], tagBg: '#16A34A', tag: 'องก์ 1 · จุดเริ่มต้นหายนะ!', cast: 'ton', expr: 'shock', cardHeader: 'เหตุการณ์ #1', cardBig: 'พังยับ!!', cardSub: 'ไม่น่าเลยกู...' },
    { num: '2', bg: ['#991B1B', '#450A0A'], tagBg: '#DC2626', tag: 'องก์ 2 · พลาดซ้ำสอง!', cast: 'ton', expr: 'shock', cardHeader: 'เหตุการณ์ #2', cardBig: 'ฉิบหายแล้ว!', cardSub: 'แก้ไม่ทันแล้ว!' },
    { num: '3', bg: ['#F59E0B', '#B45309'], tagBg: '#EA580C', tag: 'องก์ 3 · จ๊ะเอ๋กลางทาง!', cast: 'ton', rightCast: 'boss', expr: 'shock', burst: 'จ๊ะเอ๋!' },
    { num: '4', bg: ['#4C1D95', '#1E1B4B'], tagBg: '#7C3AED', tag: 'องก์ 4 · บทสรุปตัวเบา!', cast: 'ton', expr: 'sigh', cardHeader: 'ยอดรวมสุทธิ', cardBig: 'หมดตัว!', cardSub: 'เหลือติดบัญชี' }
  ]
}, proCfg.comicGrid || {});

function buildShortsCoverConfigs() {
  if (Array.isArray(proCfg.shortsCovers) && proCfg.shortsCovers.length > 0) {
    return proCfg.shortsCovers;
  }
  const palettes = [
    ['#FDE047', '#EA580C', '#7C2D12'],
    ['#EF4444', '#991B1B', '#18181B'],
    ['#7C3AED', '#312E81', '#09090B'],
    ['#2563EB', '#1E293B', '#09090B']
  ];
  const eps = (shortsPlan && Array.isArray(shortsPlan.episodes)) ? shortsPlan.episodes : [];
  return eps.map((ep, idx) => {
    const pal = palettes[idx % palettes.length];
    const outFile = (ep.coverFile || `cover_event_${String(idx + 1).padStart(2, '0')}.png`);
    return {
      outFile,
      bg: pal,
      line1: ep.titleLine1 || ep.eventTitle || `เหตุการณ์ #${idx + 1}`,
      line2: ep.titleLine2 || 'พังยับไม่เหลือ!',
      cast: 'ton',
      rightCast: idx % 2 === 0 ? 'boss' : null,
      burst: idx % 2 === 0 ? 'จ๊ะเอ๋!!' : null,
      cardHeader: ep.eventTitle || `ตอนที่ ${idx + 1}`,
      cardBig: ep.titleLine2 || 'ช็อก!!',
      cardSub: ep.titleLine1 || ''
    };
  });
}

function buildThumbnailHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @font-face { font-family: 'Kanit'; src: url('file:///${fontRegular}'); font-weight: 400; }
  @font-face { font-family: 'Kanit'; src: url('file:///${fontBold}'); font-weight: 700; }
  @font-face { font-family: 'Kanit'; src: url('file:///${fontExtraBold}'); font-weight: 800; }
  @font-face { font-family: 'Kanit'; src: url('file:///${fontBlack}'); font-weight: 900; }
  html, body { margin: 0; padding: 0; overflow: hidden; background: #000; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="cv" width="1920" height="1080"></canvas>
<script>
${coreSrc}

function comicBurst(c, cx, cy, rIn, rOut, spikes = 10, fill = '#FACC15', stroke = '#18181B') {
  c.save();
  c.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = fill; c.fill();
  c.strokeStyle = stroke; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke();
  c.restore();
}

function drawSpeedLines(c, cx, cy, count, rIn, rOut, col1, col2) {
  c.save();
  for (let i = 0; i < count; i++) {
    const a0 = (i / count) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2 / count) * 0.48;
    c.fillStyle = i % 2 === 0 ? col1 : col2;
    c.beginPath();
    c.moveTo(cx + Math.cos(a0) * rIn, cy + Math.sin(a0) * rIn);
    c.lineTo(cx + Math.cos(a0) * rOut, cy + Math.sin(a0) * rOut);
    c.lineTo(cx + Math.cos(a1) * rOut, cy + Math.sin(a1) * rOut);
    c.lineTo(cx + Math.cos(a1) * rIn, cy + Math.sin(a1) * rIn);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function drawStickerChar(c, x, y, scale, opts) {
  // Offscreen dimensions match target canvas (works identically for 1920x1080 & 1080x1920)
  const cw = c.canvas.width, ch = c.canvas.height;
  const off = document.createElement('canvas');
  off.width = cw; off.height = ch;
  const oc = off.getContext('2d');
  drawSitcomPerson(oc, x, y, scale, opts);

  c.save();
  const halo = document.createElement('canvas');
  halo.width = cw; halo.height = ch;
  const hc = halo.getContext('2d');
  hc.drawImage(off, 0, 0);
  hc.globalCompositeOperation = 'source-in';
  hc.fillStyle = '#FFFFFF';
  hc.fillRect(0, 0, cw, ch);

  c.shadowColor = 'rgba(0,0,0,0.65)';
  c.shadowBlur = 24;
  c.shadowOffsetY = 12;
  const r = 10;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    c.drawImage(halo, Math.cos(a) * r, Math.sin(a) * r);
  }
  c.shadowColor = 'transparent';
  c.drawImage(off, 0, 0);
  c.restore();
}

function drawStrokedText(c, text, x, y, size, fill, strokeW = 16, align = 'center', strokeCol = '#09090B') {
  c.save();
  c.font = '900 ' + size + 'px "Kanit", sans-serif';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.lineJoin = 'round';
  c.fillStyle = 'rgba(0,0,0,0.75)';
  c.strokeStyle = 'rgba(0,0,0,0.75)';
  c.lineWidth = strokeW + 6;
  c.strokeText(text, x + 5, y + 10);
  c.strokeStyle = strokeCol;
  c.lineWidth = strokeW;
  c.strokeText(text, x, y);
  c.fillStyle = fill;
  c.fillText(text, x, y);
  c.restore();
}

function fitFontSize(c, text, maxW, maxPx, minPx = 40) {
  let sz = maxPx;
  while (sz > minPx) {
    c.font = '900 ' + sz + 'px "Kanit", sans-serif';
    if (c.measureText(text).width <= maxW) break;
    sz -= 2;
  }
  return sz;
}

function drawStickerBadge(c, x, y, rotDeg, bg, borderCol, line1, line2, l1Col = '#FFFFFF', l2Col = '#FEF08A', w = 390, h = 118) {
  c.save();
  c.translate(x, y);
  c.rotate((rotDeg * Math.PI) / 180);
  c.shadowColor = 'rgba(0,0,0,0.55)';
  c.shadowBlur = 18;
  c.shadowOffsetY = 8;
  rr(c, -w / 2 - 7, -h / 2 - 7, w + 14, h + 14, 24);
  c.fillStyle = '#FFFFFF'; c.fill();
  c.shadowColor = 'transparent';
  rr(c, -w / 2, -h / 2, w, h, 18);
  c.fillStyle = bg; c.fill();
  c.lineWidth = 5; c.strokeStyle = borderCol; c.stroke();
  const s1 = fitFontSize(c, line1, w - 34, 32, 20);
  c.font = '900 ' + s1 + 'px "Kanit", sans-serif';
  c.textAlign = 'center';
  c.fillStyle = l1Col;
  c.fillText(line1, 0, line2 ? -6 : 11);
  if (line2) {
    const s2 = fitFontSize(c, line2, w - 34, 36, 22);
    c.font = '900 ' + s2 + 'px "Kanit", sans-serif';
    c.fillStyle = l2Col;
    c.fillText(line2, 0, 38);
  }
  c.restore();
}

window.renderShowdownThumb = (cfg) => {
  const cv = document.getElementById('cv');
  cv.width = 1920; cv.height = 1080;
  const c = cv.getContext('2d');

  // 1. Diagonal split contrast background + radial comic speed-lines
  const bgL = c.createRadialGradient(560, 480, 60, 560, 480, 980);
  bgL.addColorStop(0, cfg.leftBg[0]); bgL.addColorStop(0.45, cfg.leftBg[1]); bgL.addColorStop(1, cfg.leftBg[2]);
  c.fillStyle = bgL; c.fillRect(0, 0, 1920, 1080);

  c.save();
  c.beginPath(); c.moveTo(1080, 0); c.lineTo(1920, 0); c.lineTo(1920, 1080); c.lineTo(860, 1080); c.closePath(); c.clip();
  const bgR = c.createRadialGradient(1420, 460, 60, 1420, 460, 880);
  bgR.addColorStop(0, cfg.rightBg[0]); bgR.addColorStop(0.55, cfg.rightBg[1]); bgR.addColorStop(1, cfg.rightBg[2]);
  c.fillStyle = bgR; c.fillRect(0, 0, 1920, 1080);
  c.restore();

  drawSpeedLines(c, 960, 460, 36, 120, 1400, 'rgba(255,255,255,0.11)', 'rgba(0,0,0,0)');

  // Electric diagonal lightning crack
  c.save();
  c.strokeStyle = '#FEF08A'; c.lineWidth = 14; c.lineJoin = 'round';
  c.shadowColor = '#FACC15'; c.shadowBlur = 26;
  c.beginPath();
  c.moveTo(1080, -10); c.lineTo(990, 260); c.lineTo(1065, 310); c.lineTo(920, 610); c.lineTo(985, 650); c.lineTo(845, 1090);
  c.stroke();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 6; c.stroke();
  c.restore();

  // 2. Huge White-Sticker-Outlined Hero Characters
  drawStickerChar(c, 500, 1210, 3.65, Object.assign({
    t: 1.8, dir: 1, cast: 'ton', expr: 'shock', darkCircles: true, tear: true, sweat: true,
    pose: { lean: 0.08, by: 0, arms: [{ a: 1.48, b: 0.25 }, { a: 0.35, b: 0.75 }], legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }] }
  }, cfg.leftChar || {}));

  drawStickerChar(c, 1455, 1215, 3.60, Object.assign({
    t: 1.8, dir: -1, cast: 'boss', expr: 'shock',
    pose: { lean: -0.06, by: 0, arms: [{ a: 1.05, b: 0.65 }, { a: 0.3, b: 0.4 }], legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }] }
  }, cfg.rightChar || {}));

  // 3. Center Comic Burst
  if (cfg.centerBurst) {
    c.save(); c.translate(970, 360); c.rotate(-0.08);
    comicBurst(c, 0, 0, 86, 124, 11, '#FFFFFF', '#18181B');
    comicBurst(c, 0, 0, 72, 108, 11, '#FACC15', '#18181B');
    drawStrokedText(c, cfg.centerBurst, 0, 22, fitFontSize(c, cfg.centerBurst, 195, 58, 30), '#DC2626', 10, 'center', '#FFFFFF');
    c.restore();
  }

  // 4. Two Tilted Corner Shock Sticker Badges
  if (cfg.leftBadge) {
    drawStickerBadge(c, 245, 148, -6, cfg.leftBadge.bg, '#18181B', cfg.leftBadge.line1, cfg.leftBadge.line2, cfg.leftBadge.l1Col, cfg.leftBadge.l2Col, 390, 118);
  }
  if (cfg.rightBadge) {
    drawStickerBadge(c, 1675, 148, 5, cfg.rightBadge.bg, '#18181B', cfg.rightBadge.line1, cfg.rightBadge.line2, cfg.rightBadge.l1Col, cfg.rightBadge.l2Col, 395, 118);
  }

  // 5. Bottom Dark Scrim + Series Pill + Giant 2-Tone Headline
  const botG = c.createLinearGradient(0, 670, 0, 1080);
  botG.addColorStop(0, 'rgba(9,9,11,0)');
  botG.addColorStop(0.42, 'rgba(9,9,11,0.78)');
  botG.addColorStop(1, 'rgba(9,9,11,0.96)');
  c.fillStyle = botG; c.fillRect(0, 670, 1920, 410);

  if (cfg.seriesPill) {
    c.save();
    c.font = '900 30px "Kanit", sans-serif';
    const pw = Math.min(920, Math.max(540, c.measureText(cfg.seriesPill).width + 90));
    rr(c, 960 - pw / 2, 745, pw, 56, 28);
    c.fillStyle = '#FACC15'; c.fill();
    c.lineWidth = 5; c.strokeStyle = '#18181B'; c.stroke();
    c.textAlign = 'center'; c.fillStyle = '#18181B';
    c.fillText(cfg.seriesPill, 960, 783);
    c.restore();
  }

  const yGrad = c.createLinearGradient(0, 825, 0, 965);
  yGrad.addColorStop(0, '#FEF08A'); yGrad.addColorStop(0.55, '#FACC15'); yGrad.addColorStop(1, '#F97316');

  const t1 = cfg.headlineWhite || '';
  const t2 = cfg.headlineGold || '';
  const hSize = fitFontSize(c, t1 + t2, 1800, 112, 64);
  c.font = '900 ' + hSize + 'px "Kanit", sans-serif';
  const w1 = c.measureText(t1).width;
  const w2 = c.measureText(t2).width;
  const startX = (1920 - (w1 + w2)) / 2;
  drawStrokedText(c, t1, startX, 940, hSize, '#FFFFFF', 22, 'left', '#09090B');
  drawStrokedText(c, t2, startX + w1, 940, hSize, yGrad, 22, 'left', '#09090B');

  if (cfg.subHook) {
    drawStrokedText(c, cfg.subHook, 960, 1024, fitFontSize(c, cfg.subHook, 1800, 38, 24), '#F8FAFC', 10, 'center', '#09090B');
  }
};

window.render4PanelComicThumb = (cfg) => {
  const cv = document.getElementById('cv');
  cv.width = 1920; cv.height = 1080;
  const c = cv.getContext('2d');
  c.fillStyle = '#09090B'; c.fillRect(0, 0, 1920, 1080);

  const slots = [
    { x: 20, y: 20, w: 930, h: 510 },
    { x: 970, y: 20, w: 930, h: 510 },
    { x: 20, y: 550, w: 930, h: 510 },
    { x: 970, y: 550, w: 930, h: 510 }
  ];

  slots.forEach((slot, idx) => {
    const p = cfg.panels[idx] || cfg.panels[0];
    c.save();
    rr(c, slot.x, slot.y, slot.w, slot.h, 20);
    c.clip();
    const g = c.createRadialGradient(slot.x + slot.w * 0.5, slot.y + slot.h * 0.5, 40, slot.x + slot.w * 0.5, slot.y + slot.h * 0.5, 620);
    g.addColorStop(0, p.bg[0]); g.addColorStop(1, p.bg[1]);
    c.fillStyle = g; c.fillRect(slot.x, slot.y, slot.w, slot.h);
    drawSpeedLines(c, slot.x + slot.w * 0.5, slot.y + slot.h * 0.5, 20, 40, 650, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0)');

    if (p.rightCast) {
      drawStickerChar(c, slot.x + 260, slot.y + 645, 2.3, {
        t: 1, dir: 1, cast: p.cast || 'ton', expr: p.expr || 'shock', sweat: true,
        pose: { lean: 0.05, by: 0, arms: [{ a: 1.4, b: 0.3 }, { a: 0.4, b: 0.6 }], legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }] }
      });
      drawStickerChar(c, slot.x + 700, slot.y + 645, 2.3, {
        t: 1, dir: -1, cast: p.rightCast, expr: 'shock',
        pose: { lean: -0.04, by: 0, arms: [{ a: 1.1, b: 0.6 }, { a: 0.3, b: 0.4 }], legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }] }
      });
      if (p.burst) {
        c.save(); c.translate(slot.x + 480, slot.y + 280);
        comicBurst(c, 0, 0, 56, 82, 9, '#FEF08A', '#18181B');
        drawStrokedText(c, p.burst, 0, 14, 38, '#DC2626', 7, 'center', '#FFFFFF');
        c.restore();
      }
    } else {
      const charRight = idx === 1;
      const cardX = charRight ? slot.x + 330 : slot.x + 610;
      const charX = charRight ? slot.x + 720 : slot.x + 235;
      c.save();
      c.translate(cardX, slot.y + 278); c.rotate(charRight ? -0.04 : 0.04);
      inkrr(c, -210, -140, 420, 280, 18, '#FFFDF9', 6);
      c.fillStyle = p.tagBg || '#15803D'; rr(c, -210, -140, 420, 54, [18, 18, 0, 0]); c.fill();
      c.font = '900 26px "Kanit"'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center';
      c.fillText(p.cardHeader || '', 0, -104);
      c.font = '900 ' + fitFontSize(c, p.cardBig || '', 380, 52, 26) + 'px "Kanit"'; c.fillStyle = '#DC2626';
      c.fillText(p.cardBig || '', 0, 6);
      c.font = '800 ' + fitFontSize(c, p.cardSub || '', 380, 28, 18) + 'px "Kanit"'; c.fillStyle = '#1E293B';
      c.fillText(p.cardSub || '', 0, 74);
      c.restore();

      drawStickerChar(c, charX, slot.y + 655, 2.35, {
        t: 1, dir: charRight ? -1 : 1, cast: p.cast || 'ton', expr: p.expr || 'shock', tear: idx === 0 || idx === 3, sweat: true,
        pose: { lean: charRight ? -0.05 : 0.06, by: 0, arms: [{ a: 2.1, b: 0.6 }, { a: 0.6, b: 0.8 }], legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }] }
      });
    }

    // Caption bar at TOP for panels 1-2, BOTTOM for panels 3-4 (zero overlap with center medallion!)
    const capY = idx < 2 ? (slot.y + 18) : (slot.y + slot.h - 76);
    inkrr(c, slot.x + 18, capY, slot.w - 36, 58, 14, '#FFFDF9', 4.5);
    inkrr(c, slot.x + 26, capY + 7, 46, 44, 10, p.tagBg || '#DC2626', 3.5);
    c.font = '900 30px "Kanit"'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center';
    c.fillText(String(p.num || idx + 1), slot.x + 49, capY + 40);
    c.font = '900 ' + fitFontSize(c, p.tag || '', slot.w - 120, 30, 20) + 'px "Kanit"'; c.fillStyle = '#18181B'; c.textAlign = 'left';
    c.fillText(p.tag || '', slot.x + 88, capY + 40);
    c.restore();

    rr(c, slot.x, slot.y, slot.w, slot.h, 20);
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 8; c.stroke();
  });

  // Center gold-trimmed title medallion
  c.save(); c.translate(960, 540);
  c.shadowColor = 'rgba(0,0,0,0.75)'; c.shadowBlur = 32; c.shadowOffsetY = 10;
  rr(c, -455, -104, 910, 208, 34); c.fillStyle = '#FFFFFF'; c.fill();
  c.shadowColor = 'transparent';
  rr(c, -443, -92, 886, 184, 26);
  const mg = c.createLinearGradient(0, -92, 0, 92);
  mg.addColorStop(0, '#18181B'); mg.addColorStop(1, '#27272A');
  c.fillStyle = mg; c.fill(); c.lineWidth = 6; c.strokeStyle = '#FACC15'; c.stroke();

  const yg = c.createLinearGradient(0, -55, 0, 30);
  yg.addColorStop(0, '#FEF08A'); yg.addColorStop(0.6, '#FACC15'); yg.addColorStop(1, '#F97316');
  drawStrokedText(c, cfg.centerTitle, 0, 12, fitFontSize(c, cfg.centerTitle, 830, 74, 42), yg, 14, 'center', '#000000');
  drawStrokedText(c, cfg.centerSub, 0, 68, fitFontSize(c, cfg.centerSub, 830, 34, 22), '#FFFFFF', 8, 'center', '#000000');
  c.restore();
};

window.renderShortsCover = (cfg) => {
  const cv = document.getElementById('cv');
  cv.width = 1080; cv.height = 1920;
  const c = cv.getContext('2d');

  const g = c.createRadialGradient(540, 1080, 80, 540, 1080, 1200);
  g.addColorStop(0, cfg.bg[0]); g.addColorStop(0.55, cfg.bg[1]); g.addColorStop(1, cfg.bg[2]);
  c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
  drawSpeedLines(c, 540, 1060, 28, 110, 1400, 'rgba(255,255,255,0.11)', 'rgba(0,0,0,0)');

  if (cfg.rightCast) {
    drawStickerChar(c, 265, 1790, 3.25, {
      t: 1.8, dir: 1, cast: cfg.cast || 'ton', expr: 'shock', sweat: true,
      pose: { lean: 0.06, by: 0, arms: [{ a: 1.4, b: 0.3 }, { a: 0.4, b: 0.6 }], legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }] }
    });
    drawStickerChar(c, 830, 1790, 3.25, {
      t: 1.8, dir: -1, cast: cfg.rightCast, expr: 'shock',
      pose: { lean: -0.05, by: 0, arms: [{ a: 1.1, b: 0.6 }, { a: 0.3, b: 0.4 }], legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }] }
    });
    if (cfg.burst) {
      c.save(); c.translate(540, 1010);
      comicBurst(c, 0, 0, 82, 122, 11, '#FFFFFF', '#18181B');
      comicBurst(c, 0, 0, 68, 104, 11, '#FACC15', '#18181B');
      drawStrokedText(c, cfg.burst, 0, 20, fitFontSize(c, cfg.burst, 190, 56, 30), '#DC2626', 10, 'center', '#FFFFFF');
      c.restore();
    }
  } else {
    c.save(); c.translate(540, 1020); c.rotate(-0.03);
    inkrr(c, -330, -210, 660, 420, 26, '#FFFDF9', 7);
    c.fillStyle = '#1E293B'; rr(c, -330, -210, 660, 74, [26, 26, 0, 0]); c.fill();
    c.font = '900 ' + fitFontSize(c, cfg.cardHeader || '', 600, 34, 22) + 'px "Kanit"'; c.fillStyle = '#FACC15'; c.textAlign = 'center';
    c.fillText(cfg.cardHeader || '', 0, -162);
    c.font = '900 ' + fitFontSize(c, cfg.cardBig || '', 600, 68, 34) + 'px "Kanit"'; c.fillStyle = '#DC2626';
    c.fillText(cfg.cardBig || '', 0, -18);
    c.font = '800 ' + fitFontSize(c, cfg.cardSub || '', 600, 36, 22) + 'px "Kanit"'; c.fillStyle = '#1E293B';
    c.fillText(cfg.cardSub || '', 0, 96);
    c.restore();
    drawStickerChar(c, 540, 2120, 3.6, {
      t: 2, dir: 1, cast: cfg.cast || 'ton', expr: 'shock', tear: true, sweat: true,
      pose: { lean: 0.04, by: 0, arms: [{ a: 2.2, b: 0.6 }, { a: 2.1, b: -0.6 }], legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }] }
    });
  }

  // Smooth top dark scrim + 2-line two-tone high-CTR title
  const topG = c.createLinearGradient(0, 0, 0, 620);
  topG.addColorStop(0, 'rgba(9,9,11,0.92)'); topG.addColorStop(0.62, 'rgba(9,9,11,0.58)'); topG.addColorStop(1, 'rgba(9,9,11,0)');
  c.fillStyle = topG; c.fillRect(0, 0, 1080, 620);

  const yGrad = c.createLinearGradient(0, 350, 0, 500);
  yGrad.addColorStop(0, '#FEF08A'); yGrad.addColorStop(0.55, '#FACC15'); yGrad.addColorStop(1, '#F97316');
  const s1 = fitFontSize(c, cfg.line1 || '', 960, cfg.size1 || 104, 58);
  const s2 = fitFontSize(c, cfg.line2 || '', 960, cfg.size2 || 106, 58);
  drawStrokedText(c, cfg.line1 || '', 540, 320, s1, '#FFFFFF', 22, 'center', '#09090B');
  drawStrokedText(c, cfg.line2 || '', 540, 455, s2, yGrad, 22, 'center', '#09090B');
};
</script>
</body>
</html>`;
}

(async () => {
  const browser = await puppeteer.launch({
    ...(findChrome() ? { executablePath: findChrome() } : {}),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(buildThumbnailHtml(), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  await page.evaluate(cfg => window.renderShowdownThumb(cfg), showdownCfg);
  const out1 = path.join(projectDir, 'thumbnail_reallens_showdown.png');
  await page.screenshot({ path: out1, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log('✓ Saved High-CTR Thumbnail 1:', out1);

  await page.evaluate(cfg => window.render4PanelComicThumb(cfg), comicGridCfg);
  const out2 = path.join(projectDir, 'thumbnail_reallens_5panel.png');
  await page.screenshot({ path: out2, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log('✓ Saved High-CTR Thumbnail 2:', out2);

  const coverCfgs = buildShortsCoverConfigs();
  if (coverCfgs.length > 0) {
    fs.mkdirSync(path.join(projectDir, 'shorts'), { recursive: true });
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    for (const cfg of coverCfgs) {
      await page.evaluate(c => window.renderShortsCover(c), cfg);
      const outC = path.join(projectDir, 'shorts', cfg.outFile);
      await page.screenshot({ path: outC, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
      console.log('✓ Saved High-CTR Shorts Cover:', outC);
    }
  }

  await browser.close();
})();
