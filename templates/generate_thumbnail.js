// =============================================================================
//  generate_thumbnail.js — Vibrant Sitcom YouTube Thumbnails (1920x1080)
//  Part of skill: thai-sitcom-animator
//  Uses shorts_planner.js (pickTopLongFormHighlights + pickKeyTimestampInScene)
//  with vibrant adult-sitcom ink-outline cards, comic burst callout, 1.18x focal zoom,
//  and high-CTR stroked multi-tone headlines.
//    1. thumbnail_reallens_showdown.png  (Vibrant Sitcom Gag + Comic Callout + Status)
//    2. thumbnail_reallens_5panel.png    (5-Column Key-Scene Escalation Strip)
//
//  Usage:
//    node generate_thumbnail.js [--dir <projectDir>]
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

function loadPlanner(projectDir) {
  for (const candidate of [
    path.join(projectDir, 'shorts_planner.js'),
    path.join(__dirname, 'shorts_planner.js'),
    path.join(__dirname, '..', 'scripts', 'shorts_planner.js')
  ]) {
    if (fs.existsSync(candidate)) {
      try { return require(candidate); } catch (_) {}
    }
  }
  return null;
}

function findBrowserExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const p of candidates) { if (p && fs.existsSync(p)) return p; }
  return undefined;
}

const tlPath = path.join(projectDir, 'timeline.json');
if (!fs.existsSync(tlPath)) {
  console.error('Missing timeline.json — run generate_audio.js first.');
  process.exit(1);
}
const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const pkgCfgPath = path.join(projectDir, 'packaging.json');
const pkgCfg = fs.existsSync(pkgCfgPath) ? JSON.parse(fs.readFileSync(pkgCfgPath, 'utf8')) : {};

const scenes = tl.scenes || [];
const planner = loadPlanner(projectDir);
const firstRuleScene = scenes.find(s => (s.hud && s.hud.type === 'rule') || (s.card && s.card.type === 'rule')) || scenes[0];
const firstRuleCard = (firstRuleScene && (firstRuleScene.card || firstRuleScene.hud)) || {};

function fallbackHighlights(allScenes) {
  if (!allScenes.length) return { showdownScene: null, panels: [] };
  const climax = allScenes.find(s => s.isClimax)
    || allScenes.find(s => s.telemetry && /DANGER|CRITICAL|อันตราย|วิกฤต/i.test(`${s.telemetry.day || ''} ${s.telemetry.label || ''}`))
    || allScenes[Math.max(0, allScenes.length - 3)]
    || allScenes[0];
  const idxs = [0, 0.22, 0.45, 0.68, 0.88].map(r => Math.min(allScenes.length - 1, Math.floor(r * allScenes.length)));
  const panels = idxs.map((idx, i) => {
    const sc = allScenes[idx] || allScenes[0];
    return {
      num: String(i + 1),
      label: (sc.chapter && (Array.isArray(sc.chapter) ? sc.chapter[1] : sc.chapter.title)) || sc.view,
      view: sc.view,
      lt: Number(Math.min((sc.dur || 3) * 0.65, 2.2).toFixed(2)),
      focusX: sc.focusX || 640
    };
  });
  return { showdownScene: climax, panels };
}

const highlights = planner ? planner.pickTopLongFormHighlights(scenes, 5) : fallbackHighlights(scenes);
const climaxScene = highlights.showdownScene || scenes[Math.max(0, scenes.length - 3)] || scenes[0];
const climaxAbs = planner && climaxScene ? planner.pickKeyTimestampInScene(climaxScene) : ((climaxScene?.start || 0) + Math.min((climaxScene?.dur || 5) * 0.65, 2.5));
const defaultShowdownLt = climaxScene ? Number(Math.max(0.25, Math.min(climaxAbs - (climaxScene.start || 0), Math.max(0.5, (climaxScene.dur || 5) - 0.2))).toFixed(2)) : 1.5;

const rawTitle = pkgCfg.title || tl.title || 'THAI ADULT SITCOM ANIMATION';
const mainHook = pkgCfg.mainHook || (rawTitle.includes('|') ? rawTitle.split('|')[0].trim() : rawTitle.trim());
const seriesBadge = pkgCfg.seriesName || (rawTitle.includes('|') ? rawTitle.split('|').pop().trim() : '') || pkgCfg.pillLabel || 'ซิตคอมชีวิตจริง';

const THUMB_CONFIG = {
  title: rawTitle,
  mainHook,
  seriesBadge,
  subtitleEn: pkgCfg.subtitleEn || tl.subtitle || 'THAI SITCOM & SOCIAL COMEDY',
  hookQuote: pkgCfg.hookQuote || '“เมื่ออยากใช้ชีวิตสโลว์ไลฟ์... แต่ยอดเงินในบัญชีบอกให้ปั่นไปทำงาน”',
  pillLabel: pkgCfg.pillLabel || seriesBadge,
  ruleBadge: pkgCfg.ruleBadge || `🤣 ${firstRuleCard.ruleNo || firstRuleCard.badge || 'ช็อตฟีลประจำวัน'}`,
  ruleLine1: pkgCfg.ruleLine1 || (Array.isArray(firstRuleCard.title) ? firstRuleCard.title[0] : firstRuleCard.title) || 'กาแฟส้มยูซุแก้วละ 145 บาท',
  ruleLine2: pkgCfg.ruleLine2 || (Array.isArray(firstRuleCard.title) ? firstRuleCard.title[1] : firstRuleCard.sub) || 'แต่ในบัญชีมีอยู่ 142 บาท 50 ตังค์!',
  ruleEn: pkgCfg.ruleEn || firstRuleCard.eng || firstRuleCard.sub || 'ADULT CARTOON SITCOM · EVERYDAY THAI HUMOR',
  teleDay: pkgCfg.teleDay || (climaxScene?.telemetry?.day || climaxScene?.tele?.day || '☀️ เช้าวันจันทร์'),
  teleTime: pkgCfg.teleTime || (climaxScene?.telemetry?.time || climaxScene?.tele?.time || '08:15'),
  teleSub: pkgCfg.teleSub || (climaxScene?.telemetry?.label || climaxScene?.tele?.label || 'สถานะ: ช็อตฟีลตั้งแต่เช้า'),
  distLabel: pkgCfg.distLabel || (climaxScene?.telemetry?.distLabel || '💸 เงินในบัญชี'),
  distValue: pkgCfg.distValue || (climaxScene?.telemetry?.distance || '142 บ.'),
  showdownView: pkgCfg.showdownView || climaxScene?.view || scenes[0]?.view,
  showdownLt: pkgCfg.showdownLt != null ? Number(pkgCfg.showdownLt) : defaultShowdownLt,
  focusX: pkgCfg.focusX != null ? Number(pkgCfg.focusX) : (climaxScene?.focusX || 640),
  focusY: pkgCfg.focusY != null ? Number(pkgCfg.focusY) : (climaxScene?.focusY || 350),
  targetLabel: pkgCfg.targetLabel || '💥 ช็อตฟีล!',
  panels: Array.isArray(pkgCfg.panels) && pkgCfg.panels.length ? pkgCfg.panels : highlights.panels
};

const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <style>
    @font-face { font-family: "Kanit"; font-weight: 400; src: url("assets/fonts/kanit-thai-400-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 600; src: url("assets/fonts/kanit-thai-600-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 700; src: url("assets/fonts/kanit-thai-700-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 800; src: url("assets/fonts/kanit-thai-800-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 900; src: url("assets/fonts/kanit-thai-900-normal.woff2") format("woff2"); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; font-family: 'Kanit', sans-serif; }
    canvas { display: block; width: 1920px; height: 1080px; }
  </style>
</head>
<body>
  <canvas id="thumbCanvas" width="1920" height="1080"></canvas>
  <script src="./timeline.js"></script>
  <script src="./core.js"></script>
  <script src="./views.js"></script>
  <script>
    const cv = document.getElementById('thumbCanvas');
    const c = cv.getContext('2d');
    const SCENES = (window.TIMELINE && window.TIMELINE.scenes) || [];

    function drawPanel(x, w, h, fn) {
      c.save(); c.beginPath(); c.rect(x, 0, w, h); c.clip(); fn(x, w, h); c.restore();
    }

    function drawComicHeadline(text, cx, y, maxW, startSize, minSize) {
      const sz = fitTextSize(c, text, maxW, startSize, minSize, 900);
      const kwPat = '(?<![\\u0E40-\\u0E44])(?:\\d+(?:[.,:]\\d+)?(?:\\s*(?:บาท|฿|%|วิ|นาที|ชม\\.|กม\\.))?|ช็อตฟีล|ไม่ตรงปก|เงินเดือน|โบนัส|ประชุม|หนี้|ฟรี|หมดตัว|โอที|\\?\\!)(?![\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E])';
      const splitRe = new RegExp('(' + kwPat + ')', 'g');
      const exactRe = new RegExp('^' + kwPat + '$');
      const shockRe = /^(?:ช็อตฟีล|ไม่ตรงปก|หนี้|หมดตัว|ประชุม|โอที|\?\!)$/;
      const parts = String(text || '').split(splitRe).filter(Boolean);

      c.save();
      c.font = '900 ' + sz + 'px "Kanit", sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.lineJoin = 'round';
      const widths = parts.map(p => c.measureText(p).width);
      const totalW = widths.reduce((a, b) => a + b, 0);

      // Comic drop offset + crisp dark ink outline
      c.lineWidth = 16;
      c.strokeStyle = '#18181B';
      let px = cx - totalW / 2;
      for (let i = 0; i < parts.length; i++) {
        c.strokeText(parts[i], px + 4, y + 6);
        c.strokeText(parts[i], px, y);
        px += widths[i];
      }

      px = cx - totalW / 2;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const isShock = shockRe.test(p);
        const isKw = !isShock && exactRe.test(p);
        c.fillStyle = isShock ? '#FB7185' : (isKw ? '#FFFFFF' : '#FACC15');
        c.fillText(p, px, y);
        px += widths[i];
      }
      c.restore();
    }

    function drawComicBurstCallout(tx, ty, label) {
      c.save();
      // Comic highlight ring around focal gag
      c.strokeStyle = '#18181B'; c.lineWidth = 10;
      c.beginPath(); c.arc(tx, ty, 82, 0, TAU); c.stroke();
      c.strokeStyle = '#FACC15'; c.lineWidth = 5;
      c.beginPath(); c.arc(tx, ty, 82, 0, TAU); c.stroke();

      // Comic pointer arrow & yellow burst pill
      const ax = tx + 148, ay = ty - 114;
      c.strokeStyle = '#18181B'; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.moveTo(ax, ay + 24); c.lineTo(tx + 62, ty - 56); c.stroke();
      c.strokeStyle = '#EF4444'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(ax, ay + 24); c.lineTo(tx + 62, ty - 56); c.stroke();

      c.font = '900 24px "Kanit", sans-serif';
      const bw = c.measureText(label).width + 36;
      c.fillStyle = '#18181B'; rr(c, ax - bw / 2 + 5, ay - 22 + 5, bw, 46, 23); c.fill();
      c.fillStyle = '#FACC15'; rr(c, ax - bw / 2, ay - 22, bw, 46, 23); c.fill();
      c.strokeStyle = '#18181B'; c.lineWidth = 3.5; rr(c, ax - bw / 2, ay - 22, bw, 46, 23); c.stroke();
      txt(c, label, ax, ay + 9, 24, '#18181B', 900, 'center');
      c.restore();
    }

    window.renderShowdown = function (cfg) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, 1920, 1080);

      c.save();
      c.filter = 'contrast(1.10) saturate(1.22) brightness(1.04)';
      c.scale(1.5, 1.5);
      const fx = cfg.focusX || 640, fy = cfg.focusY || 350;
      c.translate(fx, fy);
      c.scale(1.18, 1.18);
      c.translate(-fx, -fy);
      const sceneObj = SCENES.find(s => s.view === cfg.showdownView) || SCENES[0] || { view: cfg.showdownView, dur: 5 };
      const viewMap = window.VIEWS || (typeof VIEWS !== 'undefined' ? VIEWS : {});
      const fn = viewMap[cfg.showdownView] || viewMap[sceneObj.view];
      if (fn) {
        const showdownLt = cfg.showdownLt != null ? Number(cfg.showdownLt) : Math.min((sceneObj.dur || 5) * 0.65, 2.5);
        fn(c, showdownLt, sceneObj);
      } else {
        streetCafeStage(c, 1.5, { pan: 18 });
        drawBicycle(c, 520, 620, 1.35, { t: 1.5, cast: 'ton', expr: 'shock', sweat: true });
        drawSitcomPerson(c, 920, 620, 1.35, { t: 1.5, dir: -1, cast: 'barista', expr: 'deadpan', coffee: true });
      }
      c.restore();

      c.save();
      c.scale(1.5, 1.5);
      vignette(c, 0.25, 0.58);
      c.restore();

      // Comic Burst Callout on focal gag
      const ringX = Math.max(460, Math.min(1380, fx * 1.5));
      const ringY = Math.max(360, Math.min(680, fy * 1.5));
      drawComicBurstCallout(ringX, ringY, cfg.targetLabel || '💥 ช็อตฟีล!');

      // Top-Left Sitcom Cream Gag Card (4px ink border + offset shadow)
      c.save();
      c.translate(72, 56);
      c.fillStyle = 'rgba(24,24,27,0.92)'; rr(c, 10, 10, 820, 248, 18); c.fill();
      c.fillStyle = '#FFFDF9'; rr(c, 0, 0, 820, 248, 18); c.fill();
      c.strokeStyle = '#18181B'; c.lineWidth = 4; rr(c, 0, 0, 820, 248, 18); c.stroke();
      badge(c, 28, 22, cfg.ruleBadge, '#FACC15');
      txt(c, cfg.ruleLine1, 32, 114, fitTextSize(c, cfg.ruleLine1, 756, 40, 24, 800), '#18181B', 800);
      txt(c, cfg.ruleLine2, 32, 170, fitTextSize(c, cfg.ruleLine2, 756, 36, 22, 800), '#DC2626', 800);
      c.fillStyle = '#E5E7EB'; c.fillRect(32, 194, 756, 2.5);
      txt(c, cfg.ruleEn, 32, 224, fitTextSize(c, cfg.ruleEn, 756, 17, 12, 700), '#4B5563', 700);
      c.restore();

      // Top-Right Sitcom Status & Wallet Pill
      c.save();
      c.fillStyle = 'rgba(24,24,27,0.92)'; rr(c, 1390, 66, 468, 126, 18); c.fill();
      c.fillStyle = '#FFFDF9'; rr(c, 1380, 56, 468, 126, 18); c.fill();
      c.strokeStyle = '#18181B'; c.lineWidth = 4; rr(c, 1380, 56, 468, 126, 18); c.stroke();
      txt(c, cfg.teleDay, 1408, 102, fitTextSize(c, cfg.teleDay, 280, 22, 15, 800), '#18181B', 800);
      txt(c, cfg.teleTime, 1824, 114, 44, '#18181B', 900, 'right');
      txt(c, cfg.teleSub, 1408, 154, fitTextSize(c, cfg.teleSub, 412, 21, 14, 700), '#B45309', 700);

      c.fillStyle = 'rgba(24,24,27,0.92)'; rr(c, 1430, 208, 428, 72, 16); c.fill();
      c.fillStyle = '#FACC15'; rr(c, 1420, 198, 428, 72, 16); c.fill();
      c.strokeStyle = '#18181B'; c.lineWidth = 4; rr(c, 1420, 198, 428, 72, 16); c.stroke();
      c.fillStyle = '#18181B'; rr(c, 1436, 214, 180, 40, 20); c.fill();
      txt(c, cfg.distLabel, 1526, 241, 20, '#FFFFFF', 700, 'center');
      txt(c, cfg.distValue, 1824, 246, fitTextSize(c, cfg.distValue, 185, 34, 20, 900), '#DC2626', 900, 'right');
      c.restore();

      // Bottom Sitcom Gradient + Series Pill + Stroked Multi-Tone Comic Headline
      const bgGrad = c.createLinearGradient(0, 680, 0, 1080);
      bgGrad.addColorStop(0, 'rgba(24,24,27,0)'); bgGrad.addColorStop(0.48, 'rgba(24,24,27,0.88)'); bgGrad.addColorStop(1, '#18181B');
      c.fillStyle = bgGrad; c.fillRect(0, 680, 1920, 400);

      c.save();
      c.font = '800 26px "Kanit", sans-serif';
      const sText = cfg.seriesBadge || cfg.pillLabel || 'ซิตคอมชีวิตจริง';
      const sbW = Math.min(760, c.measureText(sText).width + 54);
      c.fillStyle = '#18181B'; rr(c, 960 - sbW / 2 + 4, 756 + 4, sbW, 48, 24); c.fill();
      c.fillStyle = '#FACC15'; rr(c, 960 - sbW / 2, 756, sbW, 48, 24); c.fill();
      c.strokeStyle = '#18181B'; c.lineWidth = 3.5; rr(c, 960 - sbW / 2, 756, sbW, 48, 24); c.stroke();
      txt(c, sText, 960, 789, fitTextSize(c, sText, sbW - 32, 26, 16, 900), '#18181B', 900, 'center');
      c.restore();

      drawComicHeadline(cfg.mainHook || cfg.title, 960, 922, 1780, 108, 56);
      txt(c, cfg.hookQuote, 960, 1018, fitTextSize(c, cfg.hookQuote, 1780, 36, 22, 700), '#FFFFFF', 700, 'center');
    };

    window.render5Panel = function (cfg) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, 1920, 1080);
      const pw = 1920 / 5, ph = 720;

      cfg.panels.slice(0, 5).forEach((p, i) => {
        drawPanel(i * pw, pw, ph, (x, w, h) => {
          const sc = SCENES.find(s => s.view === p.view) || SCENES[0] || { view: p.view, dur: 4 };
          const viewMap = window.VIEWS || (typeof VIEWS !== 'undefined' ? VIEWS : {});
          const fn = viewMap[p.view];
          c.save();
          c.filter = 'contrast(1.10) saturate(1.20) brightness(1.04)';
          c.translate(x + w / 2, h / 2);
          c.scale(1.15, 1.15);
          c.translate(-(p.focusX || 640), -360);
          if (fn) fn(c, p.lt || 1.2, sc);
          else { c.fillStyle = '#F5E6C8'; c.fillRect(0, 0, 1280, 720); }
          c.restore();
        });
      });

      c.strokeStyle = '#18181B'; c.lineWidth = 6;
      for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(i * pw, 0); c.lineTo(i * pw, ph); c.stroke(); }

      const bgGrad = c.createLinearGradient(0, 470, 0, 770);
      bgGrad.addColorStop(0, 'rgba(24,24,27,0)'); bgGrad.addColorStop(0.55, 'rgba(24,24,27,0.88)'); bgGrad.addColorStop(1, '#18181B');
      c.fillStyle = bgGrad; c.fillRect(0, 470, 1920, 610);

      cfg.panels.slice(0, 5).forEach((p, i) => {
        const cx = i * pw + pw / 2, ly = 605;
        const lblSz = fitTextSize(c, p.label, pw - 96, 22, 14, 800);
        c.font = '800 ' + lblSz + 'px "Kanit"';
        const tw = c.measureText(p.label).width, totalW = 40 + 12 + tw + 24, sx = cx - totalW / 2;
        c.fillStyle = '#FFFDF9'; rr(c, sx, ly - 30, totalW, 44, 10); c.fill();
        c.strokeStyle = '#18181B'; c.lineWidth = 3; rr(c, sx, ly - 30, totalW, 44, 10); c.stroke();
        c.fillStyle = '#FACC15'; rr(c, sx + 4, ly - 26, 36, 36, 6); c.fill();
        txt(c, p.num, sx + 22, ly + 1, 22, '#18181B', 900, 'center');
        txt(c, p.label, sx + 50, ly + 1, lblSz, '#18181B', 800, 'left');
      });

      drawComicHeadline(cfg.mainHook || cfg.title, 960, 815, 1780, 106, 56);
      txt(c, cfg.subtitleEn, 960, 886, fitTextSize(c, cfg.subtitleEn, 1740, 26, 16, 600), '#E5E7EB', 600, 'center');

      c.fillStyle = '#FACC15'; rr(c, 160, 932, 460, 82, 14); c.fill();
      c.strokeStyle = '#18181B'; c.lineWidth = 4; rr(c, 160, 932, 460, 82, 14); c.stroke();
      txt(c, cfg.seriesBadge || cfg.pillLabel, 390, 986, fitTextSize(c, cfg.seriesBadge || cfg.pillLabel, 420, 34, 22, 900), '#18181B', 900, 'center');
      txt(c, cfg.hookQuote, 1240, 986, fitTextSize(c, cfg.hookQuote, 1140, 34, 20, 700), '#FFFFFF', 700, 'center');
    };
  </script>
</body>
</html>`;

(async () => {
  const tmpHtml = path.join(projectDir, '_tmp_thumb_render.html');
  fs.writeFileSync(tmpHtml, htmlContent, 'utf8');
  const executablePath = findBrowserExecutable();
  const browser = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto('file:///' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const checkCanvasLuma = () => {
      const data = c.getImageData(120, 120, 1680, 720).data;
      let sum = 0, cnt = 0;
      for (let i = 0; i < data.length; i += 128) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        cnt++;
      }
      return cnt ? sum / cnt : 0;
    };

    console.log(`=== Key-Scene Thumbnails ===`);
    console.log(`  Showdown: view=${THUMB_CONFIG.showdownView} @ lt=${THUMB_CONFIG.showdownLt}s`);
    THUMB_CONFIG.panels.forEach(p => console.log(`  Panel ${p.num}: ${p.view} (${p.label}) @ lt=${p.lt}s focusX=${p.focusX || 640}`));

    const out1 = path.join(projectDir, 'thumbnail_reallens_showdown.png');
    await page.evaluate(cfg => window.renderShowdown(cfg), THUMB_CONFIG);
    const luma1 = await page.evaluate(checkCanvasLuma);
    if (luma1 < 8) console.warn(`  ⚠️ Showdown thumbnail luma very low (${luma1.toFixed(1)}) — verify scene lighting!`);
    await page.screenshot({ path: out1, type: 'png' });
    console.log(`✓ Saved Thumbnail 1: ${path.basename(out1)} (luma=${luma1.toFixed(1)})`);

    const out2 = path.join(projectDir, 'thumbnail_reallens_5panel.png');
    await page.evaluate(cfg => window.render5Panel(cfg), THUMB_CONFIG);
    const luma2 = await page.evaluate(checkCanvasLuma);
    if (luma2 < 8) console.warn(`  ⚠️ 5-Panel thumbnail luma very low (${luma2.toFixed(1)}) — verify panel views!`);
    await page.screenshot({ path: out2, type: 'png' });
    console.log(`✓ Saved Thumbnail 2: ${path.basename(out2)} (luma=${luma2.toFixed(1)})`);
  } finally {
    await browser.close();
    try { fs.unlinkSync(tmpHtml); } catch (_) {}
  }
})();
