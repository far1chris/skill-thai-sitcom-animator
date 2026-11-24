// =============================================================================
//  render_pro_thumbnails.js — In-Scene Cinematic Storytelling Thumbnails & Covers
//  Part of skill: thai-sitcom-animator
//  Data-driven via packaging.json (`proThumbnails`), timeline.json, views.js,
//  and shorts/shorts_plan.json. Optional custom hooks via cover_renderers.js
//  (`window.COVER_RENDERERS = { showdown, comicGrid, shorts }`).
//
//  Generates:
//    1. thumbnail_reallens_showdown.png (1920x1080 — Torn-Paper Expectation vs. Reality)
//    2. thumbnail_reallens_5panel.png   (1920x1080 — 4-Act In-Scene 2x2 Comic Grid)
//    3. shorts/cover_*.png              (1080x1920 — Full-Bleed In-Scene Vertical Covers)
//
//  Design Standards (Enforced):
//    - ZERO empty radial-gradient voids (always renders live views.js or built-in sitcom stages)
//    - ZERO plain white text cards (uses diegetic drawEvidencePhone / speech bubbles / props)
//    - ZERO stiff parallel zombie arms (uses natural posePanic / poseFacepalm / posePoint)
//    - ZERO unicode emojis in Canvas text (auto-stripped; uses vector drawSparkleVec instead)
//    - Supports BOTH Kanit .ttf AND @fontsource/kanit Thai + Latin .woff2 subsets
//
//  Usage:
//    node render_pro_thumbnails.js [--dir <projectDir>] [--out-dir <outputDir>]
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
const outDir = path.resolve(getArg('--out-dir') || projectDir);
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

// Strip pictographic Unicode emojis (Canvas lacks color emoji font fallback on headless Windows)
function stripEmoji(str) {
  return String(str || '')
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const THAI_UNICODE_RANGE = 'U+0E00-0E7F, U+200C-200D, U+25CC';
const LATIN_UNICODE_RANGE = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

function buildFontFaceRules(ttfName, weight, fallbackWeight = 900) {
  const fontsDir = path.join(projectDir, 'assets', 'fonts');
  const ttf = path.join(fontsDir, ttfName);
  if (fs.existsSync(ttf)) {
    return `@font-face { font-family: 'Kanit'; src: url('file:///${ttf.replace(/\\/g, '/')}') format('truetype'); font-weight: ${weight}; }`;
  }
  const w = fs.existsSync(path.join(fontsDir, `kanit-thai-${weight}-normal.woff2`)) ? weight : fallbackWeight;
  const thai = path.join(fontsDir, `kanit-thai-${w}-normal.woff2`);
  const latin = path.join(fontsDir, `kanit-latin-${w}-normal.woff2`);
  const rules = [];
  if (fs.existsSync(thai)) {
    rules.push(`@font-face { font-family: 'Kanit'; src: url('file:///${thai.replace(/\\/g, '/')}') format('woff2'); font-weight: ${weight}; unicode-range: ${THAI_UNICODE_RANGE}; }`);
  }
  if (fs.existsSync(latin)) {
    rules.push(`@font-face { font-family: 'Kanit'; src: url('file:///${latin.replace(/\\/g, '/')}') format('woff2'); font-weight: ${weight}; unicode-range: ${LATIN_UNICODE_RANGE}; }`);
  }
  return rules.join('\n  ');
}

const coreSrc = fs.readFileSync(path.join(projectDir, 'core.js'), 'utf8');
const viewsPath = path.join(projectDir, 'views.js');
const viewsSrc = fs.existsSync(viewsPath) ? fs.readFileSync(viewsPath, 'utf8') : '';
const coverHookPath = path.join(projectDir, 'cover_renderers.js');
const coverHookSrc = fs.existsSync(coverHookPath) ? fs.readFileSync(coverHookPath, 'utf8') : '';

const pkgPath = path.join(projectDir, 'packaging.json');
const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : {};
const timelinePath = path.join(projectDir, 'timeline.json');
const timeline = fs.existsSync(timelinePath) ? JSON.parse(fs.readFileSync(timelinePath, 'utf8')) : null;
const planPath = path.join(projectDir, 'shorts', 'shorts_plan.json');
const shortsPlan = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : null;

const scenes = (timeline && Array.isArray(timeline.scenes)) ? timeline.scenes : [];

function findSceneById(id) {
  if (!id) return null;
  return scenes.find(s => s.id === id || s.view === id) || null;
}

function findSceneAtGlobalTime(sec) {
  const t = Number(sec);
  if (!Number.isFinite(t) || scenes.length === 0) return null;
  return scenes.find(s => t >= Number(s.start || 0) && t < Number(s.start || 0) + Number(s.dur || 0)) || null;
}

function computeSceneLt(scene, extractAtSec) {
  if (!scene) return 1.5;
  const dur = Math.max(0.8, Number(scene.dur || 5));
  if (extractAtSec !== undefined && extractAtSec !== null) {
    const t = Number(extractAtSec);
    const st = Number(scene.start || 0);
    if (Number.isFinite(t) && t >= st && t <= st + dur) {
      return Math.max(0.35, Math.min(dur - 0.35, t - st));
    }
  }
  if (typeof scene.coverAt === 'number' && Number.isFinite(scene.coverAt)) {
    return Math.max(0.25, Math.min(dur - 0.25, scene.coverAt));
  }
  return Math.max(0.5, Math.min(dur - 0.4, dur * 0.42));
}

function pickAutoShowdownScenes() {
  if (scenes.length === 0) return { expect: null, reality: null };
  const expect =
    scenes.find(s => /setup|intro|morning|start/i.test(String(s.id || '')) && !s.isClimax) ||
    scenes.find(s => !s.isClimax && !/cold/i.test(String(s.id || ''))) ||
    scenes[0];
  const reality =
    scenes.find(s => s.isClimax && !/cold/i.test(String(s.id || ''))) ||
    scenes.find(s => /peak|twist|climax/i.test(String(s.id || ''))) ||
    scenes.find(s => s.isClimax) ||
    scenes[Math.min(scenes.length - 1, Math.floor(scenes.length / 2))];
  return { expect, reality };
}

function pickAuto4PanelScenes() {
  const eps = (shortsPlan && Array.isArray(shortsPlan.episodes)) ? shortsPlan.episodes : [];
  if (eps.length >= 4) {
    return eps.slice(0, 4).map(ep => {
      const sc =
        findSceneById(ep.keySceneId) ||
        findSceneById(ep.keyView) ||
        findSceneAtGlobalTime(ep.extractAt) ||
        (Array.isArray(ep.sceneIds) && ep.sceneIds.length ? findSceneById(ep.sceneIds[ep.sceneIds.length - 1]) : null);
      if (!sc) return null;
      return {
        view: ep.keyView || sc.view,
        lt: computeSceneLt(sc, ep.extractAt),
        dur: Number(sc.dur || 6),
        focusX: Number(ep.focusX || sc.focusX || 640),
        sceneId: sc.id
      };
    });
  }
  if (scenes.length === 0) return [null, null, null, null];
  const nonCold = scenes.filter(s => !/cold/i.test(String(s.id || '')));
  const pool = nonCold.length >= 4 ? nonCold : scenes;
  return [0, 1, 2, 3].map(q => {
    const startIdx = Math.floor((q / 4) * pool.length);
    const endIdx = Math.max(startIdx + 1, Math.floor(((q + 1) / 4) * pool.length));
    const slice = pool.slice(startIdx, endIdx);
    const best =
      slice.find(s => s.isClimax) ||
      slice.find(s => /twist|peak|escalation/i.test(String(s.id || ''))) ||
      slice[Math.floor(slice.length / 2)] ||
      pool[Math.min(pool.length - 1, startIdx)];
    return {
      view: best.view,
      lt: computeSceneLt(best, null),
      dur: Number(best.dur || 6),
      focusX: Number(best.focusX || 640),
      sceneId: best.id
    };
  });
}

// Build data-driven configs with rich in-scene sitcom defaults
const proCfg = pkg.proThumbnails || {};
const autoShowdown = pickAutoShowdownScenes();

const rawShowdown = Object.assign({
  expectStage: 'cafe',
  realityStage: 'office',
  expectTag: 'สิ่งที่คิด',
  leftChar: { cast: 'ton', expr: 'happy', sunglasses: true },
  heroChar: { cast: 'ton', expr: 'shock', darkCircles: true, tear: true, sweat: true, gloom: 0.52, pose: 'panic' },
  rightChar: { cast: 'boss', expr: 'annoyed', pose: 'point' },
  centerBurst: null,
  leftBadge: { bg: '#16A34A', line1: 'กะชิลๆ ประหยัดงบ', line2: 'ง่ายนิดเดียว!', l1Col: '#FFFFFF', l2Col: '#FEF08A' },
  rightBadge: { bg: '#DC2626', line1: 'ความจริงพังยับ!', line2: 'ช็อกทั้งออฟฟิศ!', l1Col: '#FFFFFF', l2Col: '#FEF08A' },
  seriesPill: 'ซิตคอมคนเมือง · ตอนพิเศษ',
  headlineWhite: (pkg.title || 'ช็อตฟีลทั้งวัน ').split(' ').slice(0, 2).join(' ') + ' ',
  headlineGold: (pkg.title || 'ซวยยับทั้งสัปดาห์!').split(' ').slice(2).join(' ') || 'พังยับไม่เหลือชิ้นดี!',
  subHook: pkg.subtitle || 'ฮาจุกอก · หักมุมซ้ำสอง · ชีวิตจริงคนเมือง!'
}, proCfg.showdown || {});

const showdownCfg = Object.assign({}, rawShowdown, {
  seriesPill: stripEmoji(rawShowdown.seriesPill),
  expectTag: stripEmoji(rawShowdown.expectTag || 'สิ่งที่คิด'),
  expectView: rawShowdown.expectView !== undefined ? rawShowdown.expectView : (autoShowdown.expect ? autoShowdown.expect.view : null),
  expectLt: rawShowdown.expectLt !== undefined ? rawShowdown.expectLt : computeSceneLt(autoShowdown.expect, null),
  expectDur: rawShowdown.expectDur !== undefined ? rawShowdown.expectDur : Number((autoShowdown.expect && autoShowdown.expect.dur) || 6),
  realityView: rawShowdown.realityView !== undefined ? rawShowdown.realityView : (autoShowdown.reality ? autoShowdown.reality.view : null),
  realityLt: rawShowdown.realityLt !== undefined ? rawShowdown.realityLt : computeSceneLt(autoShowdown.reality, null),
  realityDur: rawShowdown.realityDur !== undefined ? rawShowdown.realityDur : Number((autoShowdown.reality && autoShowdown.reality.dur) || 6),
  // Keep backward compatibility: if packaging.json styled `leftChar` as shocked hero, carry its colors/cast onto heroChar
  heroChar: Object.assign(
    { cast: 'ton', expr: 'shock', darkCircles: true, tear: true, sweat: true, gloom: 0.52, pose: 'panic' },
    (proCfg.showdown && proCfg.showdown.leftChar && proCfg.showdown.leftChar.colors) ? { cast: proCfg.showdown.leftChar.cast || 'ton', colors: proCfg.showdown.leftChar.colors } : {},
    (proCfg.showdown && proCfg.showdown.heroChar) || {}
  ),
  expectChar: Object.assign(
    { cast: (proCfg.showdown && proCfg.showdown.leftChar && proCfg.showdown.leftChar.cast) || 'ton', expr: 'happy', sunglasses: true, pose: 'smug' },
    (proCfg.showdown && proCfg.showdown.expectChar) || {}
  )
});

const autoPanels = pickAuto4PanelScenes();
const defaultPanels = [
  { num: '1', stage: 'cafe', tagBg: '#0284C7', tag: 'องก์ 1 · จุดเริ่มต้นหายนะ!', cast: 'ton', expr: 'shock', cardHeader: 'เหตุการณ์ #1', cardBig: 'พังยับ!!', cardSub: 'ไม่น่าเลยกู...' },
  { num: '2', stage: 'office', tagBg: '#DC2626', tag: 'องก์ 2 · พลาดซ้ำสอง!', cast: 'ton', expr: 'shock', cardHeader: 'เหตุการณ์ #2', cardBig: 'ช็อกทั้งตึก!', cardSub: 'แก้ไม่ทันแล้ว!' },
  { num: '3', stage: 'room', tagBg: '#EA580C', tag: 'องก์ 3 · จ๊ะเอ๋กลางทาง!', cast: 'ton', rightCast: 'boss', expr: 'shock', burst: 'จ๊ะเอ๋!' },
  { num: '4', stage: 'roomNight', tagBg: '#7C3AED', tag: 'องก์ 4 · บทสรุปตัวเบา!', cast: 'ton', expr: 'sigh', cardHeader: 'ยอดรวมสุทธิ', cardBig: 'หมดตัว!', cardSub: 'เหลือติดบัญชี' }
];
const rawPanels = (proCfg.comicGrid && Array.isArray(proCfg.comicGrid.panels) && proCfg.comicGrid.panels.length >= 4)
  ? proCfg.comicGrid.panels.slice(0, 4)
  : defaultPanels;

const comicGridCfg = Object.assign({
  centerTitle: stripEmoji(pkg.title || 'ซิตคอมคนเมือง!').split('|')[0].trim(),
  centerSub: stripEmoji(pkg.subtitle || 'ซิตคอมคนเมือง · รวมครบ 4 หายนะ!')
}, proCfg.comicGrid || {}, {
  panels: rawPanels.map((p, idx) => {
    const autoP = autoPanels[idx] || {};
    return Object.assign({}, defaultPanels[idx], p, {
      tag: stripEmoji(p.tag || defaultPanels[idx].tag),
      view: p.view !== undefined ? p.view : (autoP.view || null),
      lt: p.lt !== undefined ? p.lt : (autoP.lt !== undefined ? autoP.lt : 1.5),
      dur: p.dur !== undefined ? p.dur : (autoP.dur || 6),
      focusX: p.focusX !== undefined ? p.focusX : (autoP.focusX || 640)
    });
  })
});

function buildShortsCoverConfigs() {
  const eps = (shortsPlan && Array.isArray(shortsPlan.episodes)) ? shortsPlan.episodes : [];
  const manualList = (Array.isArray(proCfg.shortsCovers) && proCfg.shortsCovers.length > 0) ? proCfg.shortsCovers : null;
  const stages = ['cafe', 'office', 'room', 'roomNight'];
  const count = manualList ? manualList.length : eps.length;
  const out = [];

  for (let idx = 0; idx < count; idx++) {
    const manual = manualList ? manualList[idx] : {};
    const ep = eps[idx] || {};
    const scene =
      findSceneById(manual.sceneId || manual.view) ||
      findSceneById(ep.keySceneId) ||
      findSceneById(ep.keyView) ||
      findSceneAtGlobalTime(ep.extractAt) ||
      (Array.isArray(ep.sceneIds) && ep.sceneIds.length ? findSceneById(ep.sceneIds[ep.sceneIds.length - 1]) : null);

    const view = manual.view !== undefined ? manual.view : (ep.keyView || (scene && scene.view) || null);
    const lt = manual.lt !== undefined ? manual.lt : computeSceneLt(scene, ep.extractAt);
    const dur = manual.dur !== undefined ? manual.dur : Number((scene && scene.dur) || 6);
    const focusX = manual.focusX !== undefined ? manual.focusX : Number(ep.focusX || (scene && scene.focusX) || 640);
    const outFile = manual.outFile || ep.coverFile || `cover_event_${String(idx + 1).padStart(2, '0')}.png`;
    const line1 = stripEmoji(manual.line1 || ep.titleTop || ep.topLine || ep.titleLine1 || ep.eventTitle || `เหตุการณ์ #${idx + 1}`);
    const line2 = stripEmoji(manual.line2 || ep.titleBot || ep.redWord || ep.titleLine2 || 'พังยับไม่เหลือ!');

    out.push(Object.assign({
      eventNum: idx + 1,
      outFile,
      stage: stages[idx % stages.length],
      view,
      lt,
      dur,
      focusX,
      line1,
      line2,
      cast: 'ton',
      rightCast: idx % 2 === 0 ? 'boss' : null,
      burst: idx % 2 === 0 ? 'ช็อก!!' : null
    }, manual, {
      eventNum: manual.eventNum || (idx + 1),
      outFile,
      view,
      lt,
      dur,
      focusX,
      line1,
      line2
    }));
  }
  return out;
}

function buildThumbnailHtml() {
  const fontRules = [
    buildFontFaceRules('Kanit-Regular.ttf', 400, 400),
    buildFontFaceRules('Kanit-Bold.ttf', 700, 700),
    buildFontFaceRules('Kanit-ExtraBold.ttf', 800, 900),
    buildFontFaceRules('Kanit-Black.ttf', 900, 900)
  ].filter(Boolean).join('\n  ');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  ${fontRules}
  html, body { margin: 0; padding: 0; overflow: hidden; background: #000; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="cv" width="1920" height="1080"></canvas>
<script>
${coreSrc}
${viewsSrc}
${coverHookSrc}

// Cached 1280x720 offscreen buffer for rendering live views.js & built-in stages cleanly
const _viewOff = document.createElement('canvas');
_viewOff.width = W;
_viewOff.height = H;
const _viewCtx = _viewOff.getContext('2d');

function resolvePose(poseSpec, t = 1.8) {
  if (poseSpec && typeof poseSpec === 'object') return poseSpec;
  const key = String(poseSpec || '').toLowerCase();
  if (key === 'panic') return posePanic(t);
  if (key === 'facepalm') return poseFacepalm(t);
  if (key === 'point') return posePoint(t);
  if (key === 'smug') {
    return {
      by: 0, lean: -0.02, tilt: -0.03,
      arms: [{ a: 0.85, b: 1.05 }, { a: 0.14, b: 0.30 }],
      legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }]
    };
  }
  return poseStand(t);
}

function drawFallbackStageOn(vc, stageKey, t = 1.5) {
  vc.save();
  vc.setTransform(1, 0, 0, 1, 0, 0);
  vc.clearRect(0, 0, W, H);
  const key = String(stageKey || 'cafe').toLowerCase();
  if (key === 'office') {
    officeStage(vc, t);
  } else if (key === 'roomnight' || key === 'night') {
    roomInteriorStage(vc, t, { night: true });
  } else if (key === 'room' || key === 'bedroom' || key === 'home') {
    roomInteriorStage(vc, t, { night: false });
  } else {
    streetCafeStage(vc, t);
  }
  vc.restore();
}

function renderLiveView16x9(c, viewName, lt, dur, focusX, dx, dy, dw, dh, fallbackStage = 'cafe', blurPx = 0) {
  const prevShorts = window.SHORTS_MODE;
  const prevHide = window.__HIDE_HUD;
  const prevCover = window.__COVER_MODE;
  window.SHORTS_MODE = false;
  window.__HIDE_HUD = true;
  window.__COVER_MODE = true;
  let rendered = false;
  try {
    _viewCtx.setTransform(1, 0, 0, 1, 0, 0);
    _viewCtx.clearRect(0, 0, W, H);
    if (viewName && window.VIEWS && typeof window.VIEWS[viewName] === 'function') {
      const dummyScene = { id: viewName, view: viewName, dur: dur || 6, focusX: focusX || 640, subs: [] };
      window.VIEWS[viewName](_viewCtx, lt !== undefined ? lt : 1.5, dummyScene);
      rendered = true;
    } else {
      drawFallbackStageOn(_viewCtx, fallbackStage, lt !== undefined ? lt : 1.5);
    }
  } catch (err) {
    console.warn('renderLiveView16x9 fallback for', viewName, err && err.message);
    drawFallbackStageOn(_viewCtx, fallbackStage, 1.5);
  } finally {
    window.SHORTS_MODE = prevShorts;
    window.__HIDE_HUD = prevHide;
    window.__COVER_MODE = prevCover;
  }
  c.save();
  if (blurPx > 0) {
    c.filter = 'blur(' + blurPx + 'px) saturate(1.12)';
    const pad = blurPx * 2.5;
    c.drawImage(_viewOff, 0, 0, W, H, dx - pad, dy - pad, dw + pad * 2, dh + pad * 2);
  } else {
    c.drawImage(_viewOff, 0, 0, W, H, dx, dy, dw, dh);
  }
  c.restore();
  return rendered;
}

function renderLiveViewShorts(c, viewName, lt, dur, focusX, fallbackStage = 'cafe') {
  const prevShorts = window.SHORTS_MODE;
  const prevHide = window.__HIDE_HUD;
  const prevFocus = window.__SHORTS_FOCUS_X;
  const prevCover = window.__COVER_MODE;
  window.SHORTS_MODE = true;
  window.__HIDE_HUD = true;
  window.__COVER_MODE = true;
  window.__SHORTS_FOCUS_X = typeof focusX === 'number' ? focusX : 640;
  let rendered = false;
  let sw = false;
  try {
    const dummyScene = { id: viewName || 'cover', view: viewName || '', dur: dur || 6, focusX: window.__SHORTS_FOCUS_X, subs: [] };
    sw = beginShortsWorld(c, dummyScene);
    if (viewName && window.VIEWS && typeof window.VIEWS[viewName] === 'function') {
      window.VIEWS[viewName](c, lt !== undefined ? lt : 1.5, dummyScene);
      rendered = true;
    } else {
      const key = String(fallbackStage || 'cafe').toLowerCase();
      if (key === 'office') officeStage(c, lt || 1.5);
      else if (key === 'roomnight' || key === 'night') roomInteriorStage(c, lt || 1.5, { night: true });
      else if (key === 'room' || key === 'bedroom' || key === 'home') roomInteriorStage(c, lt || 1.5, { night: false });
      else streetCafeStage(c, lt || 1.5);
    }
  } catch (err) {
    console.warn('renderLiveViewShorts fallback for', viewName, err && err.message);
    if (sw) { endShortsWorld(c, sw); sw = false; }
    sw = beginShortsWorld(c, { focusX: 640 });
    streetCafeStage(c, 1.5);
  } finally {
    if (sw) endShortsWorld(c, sw);
    window.SHORTS_MODE = prevShorts;
    window.__HIDE_HUD = prevHide;
    window.__SHORTS_FOCUS_X = prevFocus;
    window.__COVER_MODE = prevCover;
  }
  return rendered;
}

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

function drawCoverSpeedLines(c, cx, cy, count, rIn, rOut, col1, col2) {
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

// =============================================================================
//  1. 16:9 MAIN COVER — Torn-Paper Expectation vs. In-Scene Reality Chaos
// =============================================================================
window.renderShowdownThumb = (cfg) => {
  const cv = document.getElementById('cv');
  cv.width = 1920; cv.height = 1080;
  const c = cv.getContext('2d');

  if (window.COVER_RENDERERS && typeof window.COVER_RENDERERS.showdown === 'function') {
    window.COVER_RENDERERS.showdown(c, cfg);
    return;
  }

  // 1. Right Side (~67%): Live Reality Chaos Background with cinematic DOF blur so foreground stickers pop
  const bgBlur = cfg.bgBlur !== undefined ? cfg.bgBlur : (cfg.realityView ? 6.5 : 0);
  renderLiveView16x9(c, cfg.realityView, cfg.realityLt, cfg.realityDur, 640, 0, 0, 1920, 1080, cfg.realityStage || 'office', bgBlur);
  c.fillStyle = 'rgba(15, 23, 42, 0.24)';
  c.fillRect(580, 0, 1340, 1080);
  drawCoverSpeedLines(c, 1280, 460, 34, 150, 1200, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0)');

  // 2. Left Side (~33%): Torn-Paper "Expectation" Zone clipped by jagged ridge
  const ripPts = [
    [650, -10], [620, 180], [660, 360], [605, 540], [645, 720], [590, 1090]
  ];
  c.save();
  c.beginPath();
  c.moveTo(0, -10);
  for (const [rx, ry] of ripPts) c.lineTo(rx, ry);
  c.lineTo(0, 1090);
  c.closePath();
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 24; c.shadowOffsetX = 12;
  c.fillStyle = '#FFFFFF'; c.fill();
  c.restore();
  c.clip();

  const expBlur = cfg.expectBlur !== undefined ? cfg.expectBlur : (cfg.expectView ? 5.0 : 0);
  renderLiveView16x9(c, cfg.expectView, cfg.expectLt, cfg.expectDur, 640, 0, 0, 1920, 1080, cfg.expectStage || 'cafe', expBlur);
  glow(c, 340, 430, 520, '#FDE047', 0.36);
  c.fillStyle = 'rgba(254, 240, 138, 0.16)';
  c.fillRect(0, 0, 700, 1080);
  for (const [sx, sy, sr] of [[120, 310, 22], [510, 260, 26], [520, 520, 18], [135, 620, 16]]) {
    drawSparkleVec(c, sx, sy, sr, '#FEF9C3', '#F59E0B', false);
  }

  // Smug sunglasses hero inside left Expectation strip
  const expC = cfg.expectChar || {};
  drawStickerChar(c, 325, 1215, 3.25, Object.assign({
    t: 1.8, dir: 1, cast: 'ton', expr: 'happy', sunglasses: true
  }, expC, {
    pose: resolvePose(expC.pose || 'smug', 1.8)
  }));
  c.restore();

  // Crisp jagged white torn-paper border down ridge
  c.save();
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 14;
  c.beginPath();
  ripPts.forEach(([rx, ry], idx) => idx === 0 ? c.moveTo(rx, ry) : c.lineTo(rx, ry));
  c.stroke();
  c.strokeStyle = '#CBD5E1'; c.lineWidth = 3;
  c.beginPath();
  ripPts.forEach(([rx, ry], idx) => idx === 0 ? c.moveTo(rx - 4, ry) : c.lineTo(rx - 4, ry));
  c.stroke();
  c.restore();

  // Top-left Expectation tag + badge (with vector sparkle, zero unicode emoji)
  c.save(); c.translate(155, 68);
  inkrr(c, -110, -28, 220, 56, 14, '#FACC15', 4, INK_OUTLINE);
  txt(c, cfg.expectTag || 'สิ่งที่คิด', -24, 10, 28, INK_OUTLINE, 900, 'center');
  drawSparkleVec(c, 68, 0, 14, '#FFFFFF', '#B45309', false);
  c.restore();
  if (cfg.leftBadge) {
    drawStickerBadge(c, 275, 182, -5, cfg.leftBadge.bg || '#16A34A', '#18181B',
      cfg.leftBadge.line1, cfg.leftBadge.line2, cfg.leftBadge.l1Col, cfg.leftBadge.l2Col, 370, 112);
  }

  // Right-side Macro Diegetic Evidence Phone OR Top-Right Shock Badge
  if (cfg.evidencePhone) {
    drawEvidencePhone(c, 1395, 420, Object.assign({ scale: 0.88, rot: 0.05 }, cfg.evidencePhone));
  } else {
    if (cfg.rightBadge) {
      drawStickerBadge(c, 1685, 122, 4, cfg.rightBadge.bg || '#1E293B', '#18181B',
        cfg.rightBadge.line1, cfg.rightBadge.line2, cfg.rightBadge.l1Col, cfg.rightBadge.l2Col, 375, 110);
    }
    if (cfg.centerBurst) {
      c.save(); c.translate(1365, 250); c.rotate(-0.07);
      comicBurst(c, 0, 0, 92, 134, 11, '#FFFFFF', '#18181B');
      comicBurst(c, 0, 0, 78, 116, 11, '#FACC15', '#18181B');
      drawStrokedText(c, cfg.centerBurst, 0, 16, fitFontSize(c, cfg.centerBurst, 148, 44, 24), '#DC2626', 8, 'center', '#FFFFFF');
      c.restore();
    }
  }

  // 3. Center-Right Panicked Hero (natural posePanic + gloom + ghost soul) + Far-Right Foil (posePoint)
  const heroC = cfg.heroChar || {};
  drawStickerChar(c, 1020, 1225, 3.55, Object.assign({
    t: 1.8, dir: 1, cast: 'ton', expr: 'shock', darkCircles: true, tear: true, sweat: true, gloom: 0.52
  }, heroC, {
    pose: resolvePose(heroC.pose || 'panic', 1.8)
  }));
  drawSoulEscape(c, 1185, 435, 1.5, 0.95);

  const rightC = cfg.rightChar || {};
  drawStickerChar(c, 1680, 1220, 3.30, Object.assign({
    t: 1.8, dir: -1, cast: 'boss', expr: 'annoyed'
  }, rightC, {
    pose: resolvePose(rightC.pose || 'point', 1.8)
  }));

  // 4. Bottom Dark Scrim + Series Pill (zero emojis) + Giant 2-Tone Kanit 900 Headline + Sub-Hook
  const botG = c.createLinearGradient(0, 660, 0, 1080);
  botG.addColorStop(0, 'rgba(9,9,11,0)');
  botG.addColorStop(0.40, 'rgba(9,9,11,0.80)');
  botG.addColorStop(1, 'rgba(9,9,11,0.97)');
  c.fillStyle = botG; c.fillRect(0, 660, 1920, 420);

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

// =============================================================================
//  2. 16:9 A/B COVER — 4-Act In-Scene Action 2x2 Comic Grid
// =============================================================================
window.render4PanelComicThumb = (cfg) => {
  const cv = document.getElementById('cv');
  cv.width = 1920; cv.height = 1080;
  const c = cv.getContext('2d');

  if (window.COVER_RENDERERS && typeof window.COVER_RENDERERS.comicGrid === 'function') {
    window.COVER_RENDERERS.comicGrid(c, cfg);
    return;
  }

  c.fillStyle = '#09090B'; c.fillRect(0, 0, 1920, 1080);

  const slots = [
    { x: 20, y: 20, w: 930, h: 510 },
    { x: 970, y: 20, w: 930, h: 510 },
    { x: 20, y: 550, w: 930, h: 510 },
    { x: 970, y: 550, w: 930, h: 510 }
  ];
  const fallbackStages = ['cafe', 'office', 'room', 'roomNight'];

  slots.forEach((slot, idx) => {
    const p = (cfg.panels && cfg.panels[idx]) || (cfg.panels && cfg.panels[0]) || {};
    c.save();
    rr(c, slot.x, slot.y, slot.w, slot.h, 20);
    c.clip();

    const useLive = Boolean(p.view && p.useLiveView !== false && window.VIEWS && typeof window.VIEWS[p.view] === 'function');
    if (useLive) {
      // Live in-scene render of actual episode view scaled crisply into comic panel
      renderLiveView16x9(c, p.view, p.lt, p.dur, p.focusX, slot.x, slot.y, slot.w, slot.h, p.stage || fallbackStages[idx]);
      // Subtle edge contrast vignette so white caption bar pops cleanly
      const vg = c.createLinearGradient(0, idx < 2 ? slot.y : slot.y + slot.h, 0, idx < 2 ? slot.y + 130 : slot.y + slot.h - 130);
      vg.addColorStop(0, 'rgba(9,9,11,0.45)');
      vg.addColorStop(1, 'rgba(9,9,11,0)');
      c.fillStyle = vg; c.fillRect(slot.x, slot.y, slot.w, slot.h);
    } else {
      // Fallback: real built-in sitcom stage + sticker actors + diegetic phone/burst (zero white boxes, zero zombie arms)
      c.save();
      c.translate(slot.x, slot.y);
      c.scale(slot.w / W, slot.h / H);
      renderLiveView16x9(c, null, 1.5, 6, 640, 0, 0, W, H, p.stage || fallbackStages[idx]);

      if (p.rightCast) {
        drawStickerPerson(c, 370, 645, 1.60, {
          t: 1.5, dir: 1, cast: p.cast || 'ton', expr: p.expr || 'shock', sweat: true, gloom: 0.45,
          pose: posePanic(1.5), shadow: false
        }, 6);
        drawStickerPerson(c, 960, 645, 1.58, {
          t: 1.5, dir: -1, cast: p.rightCast, expr: 'annoyed',
          pose: posePoint(1.5), shadow: false
        }, 6);
        if (p.burst) drawComicBurst(c, 660, 290, p.burst, { scale: 0.92 });
      } else {
        const charRight = idx === 1;
        drawEvidencePhone(c, charRight ? 420 : 850, 385, Object.assign({
          scale: 0.68, rot: charRight ? -0.05 : 0.05,
          headerCol: p.tagBg || '#BE185D',
          app: p.cardHeader || 'แจ้งเตือน',
          account: 'LIVE',
          subtitle: p.cardSub || 'สถานะล่าสุด',
          amount: p.cardBig || 'พังยับ!!',
          amountCol: '#DC2626',
          merchant: p.tag || '',
          errorTitle: p.cardBig || 'ช็อกหนักมาก!',
          errorSub: p.cardSub || ''
        }, p.phone || {}));
        drawStickerPerson(c, charRight ? 920 : 380, 650, 1.62, {
          t: 1.5, dir: charRight ? -1 : 1, cast: p.cast || 'ton', expr: p.expr || 'shock',
          tear: idx === 0 || idx === 3, sweat: true, gloom: 0.48,
          pose: idx === 3 ? poseFacepalm(1.5) : posePanic(1.5), shadow: false
        }, 6);
      }
      c.restore();
    }

    // Optional explicit diegetic accents inside live panel
    if (p.overlayPhone || p.overlayBubble || p.overlayBurst) {
      c.save();
      c.translate(slot.x, slot.y);
      c.scale(slot.w / W, slot.h / H);
      if (p.overlayPhone) drawEvidencePhone(c, p.overlayPhone.x || 940, p.overlayPhone.y || 390, Object.assign({ scale: 0.66 }, p.overlayPhone));
      if (p.overlayBubble) drawSpeechBubble(c, p.overlayBubble.x || 960, p.overlayBubble.y || 225, p.overlayBubble.text || '', p.overlayBubble);
      if (p.overlayBurst) drawComicBurst(c, p.overlayBurst.x || 990, p.overlayBurst.y || 315, p.overlayBurst.text || '', p.overlayBurst);
      c.restore();
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
  drawStrokedText(c, cfg.centerTitle || '', 0, 12, fitFontSize(c, cfg.centerTitle || '', 830, 74, 42), yg, 14, 'center', '#000000');
  drawStrokedText(c, cfg.centerSub || '', 0, 68, fitFontSize(c, cfg.centerSub || '', 830, 34, 22), '#FFFFFF', 8, 'center', '#000000');
  c.restore();
};

// =============================================================================
//  3. 9:16 VERTICAL SHORTS COVERS — Full-Bleed In-Scene Storytelling Covers
// =============================================================================
window.renderShortsCover = (cfg) => {
  const cv = document.getElementById('cv');
  cv.width = 1080; cv.height = 1920;
  const c = cv.getContext('2d');

  if (window.COVER_RENDERERS && typeof window.COVER_RENDERERS.shorts === 'function') {
    window.COVER_RENDERERS.shorts(c, cfg);
    return;
  }

  const useLive = Boolean(cfg.view && cfg.useLiveView !== false && window.VIEWS && typeof window.VIEWS[cfg.view] === 'function');
  if (useLive) {
    // Full-bleed live scene in authentic 9:16 Shorts World Mode (zero distortion, HUD hidden)
    renderLiveViewShorts(c, cfg.view, cfg.lt, cfg.dur, cfg.focusX, cfg.stage || 'cafe');
    if (cfg.evidencePhone) {
      drawEvidencePhone(c, cfg.evidencePhone.x || 770, cfg.evidencePhone.y || 960, Object.assign({ scale: 1.05, rot: 0.04 }, cfg.evidencePhone));
    }
    if (cfg.bubble) {
      drawSpeechBubble(c, cfg.bubble.x || 540, cfg.bubble.y || 1040, cfg.bubble.text || '', Object.assign({ size: 22 }, cfg.bubble));
    }
    if (cfg.soul) {
      drawSoulEscape(c, cfg.soul.x || 720, cfg.soul.y || 1080, 1.5, cfg.soul.scale || 1.1);
    }
  } else {
    // Fallback: Built-in vertical sitcom stage + foreground white-sticker characters + diegetic proof
    renderLiveViewShorts(c, null, 1.5, 6, 640, cfg.stage || 'cafe');
    c.fillStyle = 'rgba(15, 23, 42, 0.20)';
    c.fillRect(0, 0, 1080, 1920);
    drawCoverSpeedLines(c, 540, 1060, 28, 120, 1300, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0)');

    if (cfg.rightCast) {
      drawStickerChar(c, 275, 1860, 3.25, {
        t: 1.8, dir: 1, cast: cfg.cast || 'ton', expr: 'shock', darkCircles: true, tear: true, sweat: true, gloom: 0.50,
        pose: posePanic(1.8)
      });
      drawStickerChar(c, 815, 1860, 3.20, {
        t: 1.8, dir: -1, cast: cfg.rightCast, expr: 'annoyed',
        pose: posePoint(1.8)
      });
      if (cfg.burst) {
        c.save(); c.translate(540, 960);
        comicBurst(c, 0, 0, 82, 122, 11, '#FFFFFF', '#18181B');
        comicBurst(c, 0, 0, 68, 104, 11, '#FACC15', '#18181B');
        drawStrokedText(c, cfg.burst, 0, 20, fitFontSize(c, cfg.burst, 190, 54, 28), '#DC2626', 10, 'center', '#FFFFFF');
        c.restore();
      }
    } else {
      drawEvidencePhone(c, 680, 980, Object.assign({
        scale: 1.25, rot: -0.04,
        headerCol: '#BE185D',
        app: cfg.cardHeader || 'แจ้งเตือนด่วน',
        account: 'LIVE',
        subtitle: cfg.cardSub || 'เหตุการณ์จริง',
        amount: cfg.cardBig || 'ช็อก!!',
        amountCol: '#DC2626',
        merchant: cfg.line1 || '',
        errorTitle: cfg.line2 || 'พังยับ!',
        errorSub: cfg.cardSub || ''
      }, cfg.evidencePhone || {}));
      drawStickerChar(c, 340, 1910, 3.55, {
        t: 1.8, dir: 1, cast: cfg.cast || 'ton', expr: 'shock', darkCircles: true, tear: true, sweat: true, gloom: 0.52,
        pose: posePanic(1.8)
      });
      drawSoulEscape(c, 520, 1180, 1.5, 1.1);
    }
  }

  // Smooth top dark scrim + Clean 2-Line Two-Tone High-CTR Title (ZERO pills, ZERO bottom stamps, ZERO emojis)
  const topG = c.createLinearGradient(0, 0, 0, 560);
  topG.addColorStop(0, 'rgba(9,9,11,0.92)');
  topG.addColorStop(0.62, 'rgba(9,9,11,0.58)');
  topG.addColorStop(1, 'rgba(9,9,11,0)');
  c.fillStyle = topG; c.fillRect(0, 0, 1080, 560);

  const yGrad = c.createLinearGradient(0, 310, 0, 440);
  yGrad.addColorStop(0, '#FEF08A'); yGrad.addColorStop(0.55, '#FACC15'); yGrad.addColorStop(1, '#F97316');
  const s1 = fitFontSize(c, cfg.line1 || '', 960, cfg.size1 || 96, 54);
  const s2 = fitFontSize(c, cfg.line2 || '', 960, cfg.size2 || 100, 54);
  drawStrokedText(c, cfg.line1 || '', 540, 265, s1, '#FFFFFF', 22, 'center', '#09090B');
  drawStrokedText(c, cfg.line2 || '', 540, 395, s2, yGrad, 22, 'center', '#09090B');
};
</script>
</body>
</html>`;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    ...(findChrome() ? { executablePath: findChrome() } : {}),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  page.on('pageerror', err => console.error('PageError:', err.message));
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.setContent(buildThumbnailHtml(), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  await page.evaluate(cfg => window.renderShowdownThumb(cfg), showdownCfg);
  const out1 = path.join(outDir, 'thumbnail_reallens_showdown.png');
  await page.screenshot({ path: out1, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log('✓ Saved High-CTR Thumbnail 1:', out1);

  await page.evaluate(cfg => window.render4PanelComicThumb(cfg), comicGridCfg);
  const out2 = path.join(outDir, 'thumbnail_reallens_5panel.png');
  await page.screenshot({ path: out2, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log('✓ Saved High-CTR Thumbnail 2:', out2);

  const coverCfgs = buildShortsCoverConfigs();
  if (coverCfgs.length > 0) {
    fs.mkdirSync(path.join(outDir, 'shorts'), { recursive: true });
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    for (const cfg of coverCfgs) {
      await page.evaluate(c => window.renderShortsCover(c), cfg);
      const outC = path.join(outDir, 'shorts', cfg.outFile);
      await page.screenshot({ path: outC, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
      console.log('✓ Saved High-CTR Shorts Cover:', outC);
    }
  }

  await browser.close();
})();
