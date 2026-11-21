// =============================================================================
//  generate_scene_covers.js — Key-Scene Vertical Shorts Covers (1080x1920)
//  Part of skill: thai-sitcom-animator
//  Uses shorts_planner.js to pick the highest-impact climax frame in each EP
//  (Event clips / Single Short, 45-60s each), crops subtitle-free focal action
//  (HUD/Telemetry force-hidden), and composites ONLY a 2-Line Two-Tone Top Title
//  + Full-Bleed Climax Frame. NO viewfinder frame, NO pill, NO bottom stamp
//  (เหตุการณ์ #N / EP N / จบใน 1 คลิป), NO gradient bar.
//
//  Usage:
//    node generate_scene_covers.js [--input master.mp4] [--max-sec 58] [--min-sec 22] [--allow-over-60]
// =============================================================================
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { createRequire } = require('module');

function getArg(...flags) {
  for (const flag of flags) {
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  }
  return null;
}

const hasFlag = flag => process.argv.includes(flag);
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

function resolveFFmpeg() {
  for (const r of [localReq, require]) {
    try {
      const p = r('ffmpeg-static');
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return 'ffmpeg';
}

function loadPlanner() {
  for (const candidate of [
    path.join(projectDir, 'shorts_planner.js'),
    path.join(__dirname, 'shorts_planner.js'),
    path.join(__dirname, '..', 'scripts', 'shorts_planner.js')
  ]) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  throw new Error('Missing shorts_planner.js — copy scripts/shorts_planner.js into your project folder.');
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

const shortsDir = path.join(projectDir, 'shorts');
fs.mkdirSync(shortsDir, { recursive: true });

function findMasterMp4(required = true) {
  const explicit = getArg('--input', '-i');
  if (explicit) return path.resolve(projectDir, explicit);
  const preferred = ['master_hf.mp4', 'master_16x9.mp4', 'master_1440p.mp4', 'output_hf.mp4', 'output.mp4'];
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) preferred.unshift(`${pkg.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`);
    } catch (_) {}
  }
  for (const name of preferred) {
    const p = path.join(projectDir, name);
    if (fs.existsSync(p)) return p;
  }
  const anyMp4 = fs.readdirSync(projectDir).find(f => f.endsWith('.mp4') && !f.includes('shorts'));
  if (anyMp4) return path.join(projectDir, anyMp4);
  if (required) throw new Error('Master 16:9 MP4 not found. Pass --input <path-to-master.mp4>');
  return null;
}

const MAKE_COVERS_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @font-face { font-family: "Kanit"; font-weight: 400; src: url("../assets/fonts/kanit-thai-400-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 700; src: url("../assets/fonts/kanit-thai-700-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 800; src: url("../assets/fonts/kanit-thai-800-normal.woff2") format("woff2"); }
    @font-face { font-family: "Kanit"; font-weight: 900; src: url("../assets/fonts/kanit-thai-900-normal.woff2") format("woff2"); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1080px; height: 1920px; background: #060b14; overflow: hidden; font-family: 'Kanit', sans-serif; }
    canvas { width: 1080px; height: 1920px; display: block; }
  </style>
</head>
<body>
  <canvas id="c" width="1080" height="1920"></canvas>
  <script>
    function fitFont(ctx, text, maxW, startSize, minSize, weight) {
      let sz = startSize;
      while (sz > minSize) {
        ctx.font = weight + ' ' + sz + 'px "Kanit", sans-serif';
        if (ctx.measureText(text).width <= maxW) break;
        sz -= 2;
      }
      return sz;
    }

    window.measureImageLuma = function(imgUrl) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = function() {
          const probe = document.createElement('canvas');
          const pw = 160, ph = 90;
          probe.width = pw; probe.height = ph;
          const pctx = probe.getContext('2d');
          pctx.drawImage(img, 0, 0, pw, ph);
          const data = pctx.getImageData(0, 0, pw, ph).data;
          let sum = 0, brightPixels = 0;
          const total = pw * ph;
          for (let i = 0; i < data.length; i += 4) {
            const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            sum += luma;
            if (luma > 20) brightPixels++;
          }
          resolve({ meanLuma: sum / total, brightRatio: brightPixels / total });
        };
        img.onerror = function() { resolve({ meanLuma: 0, brightRatio: 0, error: true }); };
        img.src = imgUrl;
      });
    };

    window.drawCover = function(epData) {
      window.__done = false;
      window.__lastStats = null;
      const cvs = document.getElementById('c');
      const ctx = cvs.getContext('2d');
      const W = 1080, H = 1920;

      const img = new Image();
      img.onload = function() {
        // Full-Screen 9:16 Scene Artwork (1080x1920) with focal alignment & vibrant sitcom boost
        ctx.save();
        const scale = Math.max(W / img.width, H / img.height) * 1.06;
        const sw = img.width * scale, sh = img.height * scale;
        const focusRatio = epData.hudBaked
          ? Math.max(0.40, Math.min(0.60, (Number(epData.focusX) || 640) / 1280))
          : Math.max(0.15, Math.min(0.85, (Number(epData.focusX) || 640) / 1280));
        const drawX = img.width > img.height
          ? Math.max(W - sw, Math.min(0, W / 2 - focusRatio * sw))
          : (W - sw) / 2;
        const drawY = (H - sh) / 2;
        ctx.filter = 'contrast(1.12) saturate(1.24) brightness(1.06)';
        ctx.drawImage(img, drawX, drawY, sw, sh);
        ctx.filter = 'none';

        // Localized Top (0..430) readability scrim — rest of 9:16 frame stays clean & full-bleed!
        const topGrad = ctx.createLinearGradient(0, 0, 0, 430);
        topGrad.addColorStop(0, 'rgba(24, 24, 27, 0.86)');
        topGrad.addColorStop(0.65, 'rgba(24, 24, 27, 0.45)');
        topGrad.addColorStop(1, 'rgba(24, 24, 27, 0)');
        ctx.fillStyle = topGrad; ctx.fillRect(0, 0, W, 430);
        ctx.restore();

        // Luminance probe across bright center art zone
        const heroX = 36, heroY = 460, heroW = 1008, heroH = 900;
        const heroSample = ctx.getImageData(heroX + 80, heroY + 60, heroW - 160, heroH - 120).data;
        let hSum = 0, hCount = 0;
        for (let i = 0; i < heroSample.length; i += 64) {
          hSum += 0.2126 * heroSample[i] + 0.7152 * heroSample[i + 1] + 0.0722 * heroSample[i + 2];
          hCount++;
        }
        window.__lastStats = { heroMeanLuma: hCount ? (hSum / hCount) : 0 };

        // NOTE: Yellow border + red corner viewfinder brackets are intentionally DISABLED (clean full-bleed art).

        // Clean 2-Line Two-Tone Top Title (Red / White) ONLY — NO pill/box, NO stamp, NO gradient bar
        const rawTop = String(epData.titleTop || epData.topLine || '').trim();
        const rawBot = String(epData.titleBot || epData.redWord || '').trim();
        const redLine = Number(epData.titleRedLine) === 2 ? 2 : 1;

        function drawHeavyTitleLine(text, yCenter, isRed) {
          if (!text) return;
          const sz = fitFont(ctx, text, 940, 102, 46, 900);
          ctx.save();
          ctx.font = '900 ' + sz + 'px "Kanit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.lineWidth = Math.max(12, Math.round(sz * 0.16));
          ctx.strokeStyle = '#000000';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
          ctx.shadowBlur = 14;
          ctx.shadowOffsetY = 6;
          ctx.strokeText(text, W / 2, yCenter);
          ctx.shadowColor = isRed ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
          ctx.fillText(text, W / 2, yCenter);
          ctx.restore();
        }

        if (rawTop && rawBot) {
          drawHeavyTitleLine(rawTop, 236, redLine === 1);
          drawHeavyTitleLine(rawBot, 362, redLine === 2);
        } else if (rawTop || rawBot) {
          drawHeavyTitleLine(rawTop || rawBot, 285, redLine === 1);
        }
        // NOTE: Sub-hook pill/box, bottom stamp (เหตุการณ์ #N / EP N / จบใน 1 คลิป) and gradient bar are DISABLED.
        window.__done = true;
      };
      img.src = epData.imgUrl;
    };
  </script>
</body>
</html>`;

(async () => {
  const ffmpeg = resolveFFmpeg();
  const stageHtmlPath = path.join(projectDir, 'index.html');
  const hasStageHtml = fs.existsSync(stageHtmlPath);
  const inMp4 = findMasterMp4(!hasStageHtml);
  const tlPath = path.join(projectDir, 'timeline.json');
  if (!fs.existsSync(tlPath)) {
    console.error('Missing timeline.json — run generate_audio.js first.');
    process.exit(1);
  }
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const cfgPath = path.join(projectDir, 'shorts_config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};

  const maxSec = Number(getArg('--max-sec') || cfg.maxSec || 58);
  const minSec = Number(getArg('--min-sec') || cfg.minSec || 45);
  const maxEpArg = getArg('--max-ep');
  const maxEp = maxEpArg ? Number(maxEpArg) : (cfg.maxEp || cfg.maxEpisodes || null);
  const format = hasFlag('--single') ? 'single' : (getArg('--format') || cfg.shortsFormat || undefined);
  const allowOver60 = hasFlag('--allow-over-60') || Boolean(cfg.allowOver60);
  const onlyEvents = hasFlag('--events-only');

  const { planShortsEpisodes, saveShortsPlan } = loadPlanner();
  const planned = planShortsEpisodes(tl, cfg, { maxSec, minSec, maxEp, allowOver60, format });
  saveShortsPlan(projectDir, planned);

  const selected = onlyEvents ? planned.filter(item => item.isEvent) : planned;
  const manualCovers = Array.isArray(cfg.covers) ? cfg.covers : [];
  const episodes = selected.map((item, idx) => {
    const manual = (!onlyEvents && manualCovers[idx]) ? manualCovers[idx] : {};
    const exTs = Number(manual.extractAt != null ? manual.extractAt : item.extractAt);
    let segFocusX = item.focusX || 640;
    if (Array.isArray(item.segments)) {
      const segHit = item.segments.find(sg => exTs >= sg.start && exTs <= sg.start + sg.dur);
      if (segHit && segHit.focusX != null) segFocusX = segHit.focusX;
    }
    const isStandalone = Boolean(item.isStandalone || item.isSingle || planned.length === 1);
    const tag = item.tag || (item.isEvent ? `event_${String(item.ep).padStart(2, '0')}` : (isStandalone ? 'shorts' : `ep${item.ep}`));
    return {
      ep: item.ep,
      totalEps: planned.length,
      tag,
      isStandalone,
      isEvent: Boolean(item.isEvent),
      start: item.start,
      end: item.end,
      dur: item.dur,
      keySceneId: item.keySceneId,
      keyView: item.keyView,
      keyScore: item.keyScore,
      focusX: manual.focusX != null ? manual.focusX : segFocusX,
      isFinal: item.isFinal !== undefined ? item.isFinal : (!item.isEvent && item.ep === planned.length && planned.length > 1),
      extractAt: exTs,
      titleTop: manual.titleTop || item.titleTop || manual.topLine || item.topLine,
      titleBot: manual.titleBot || item.titleBot || manual.redWord || item.redWord,
      titleRedLine: manual.titleRedLine || item.titleRedLine || 1,
      topLine: manual.topLine || item.topLine,
      redWord: manual.redWord || item.redWord,
      rawImg: manual.rawImg || path.join(shortsDir, `raw_frame_${tag}.png`),
      outFile: manual.outFile || path.join(shortsDir, item.coverFile || (isStandalone ? 'cover_shorts.png' : `cover_${tag}.png`))
    };
  });

  const htmlFile = path.join(shortsDir, '_make_covers.html');
  fs.writeFileSync(htmlFile, MAKE_COVERS_HTML, 'utf8');
  const tmpProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p_cov_'));
  const executablePath = findBrowserExecutable();
  const browser = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: 'new',
    userDataDir: tmpProfileDir,
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto('file:///' + htmlFile.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    let scenePage = null;
    if (hasStageHtml) {
      scenePage = await browser.newPage();
      await scenePage.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
      await scenePage.goto('file:///' + stageHtmlPath.replace(/\\/g, '/') + '?shorts=1', { waitUntil: 'load' });
      await scenePage.evaluate(async () => {
        if (window.__setHeadless) window.__setHeadless();
        await document.fonts.ready;
        if (typeof window.setShortsMode === 'function') window.setShortsMode(true);
      });
    }

    async function captureCandidateFrame(ts, destPath, focusX) {
      if (scenePage) {
        const b64 = await scenePage.evaluate((t, fx) => {
          // Hard-disable ALL HUD layers (Telemetry top-right, chapter, cards, subtitles) on cover frames,
          // even when the project's index.html predates the __HIDE_HUD guard.
          const HUD_FNS = ['drawTele', 'drawChapter', 'drawCard', 'drawFlow', 'drawSub', 'drawHud'];
          const saved = {};
          for (const k of HUD_FNS) {
            if (typeof window[k] === 'function') { saved[k] = window[k]; try { window[k] = function () {}; } catch (_) {} }
          }
          window.__HIDE_HUD = true;
          window.__SHORTS_FOCUS_X = fx;
          try {
            window.renderAtTime(t);
            const stage = document.getElementById('stage');
            return stage ? stage.toDataURL('image/png') : null;
          } finally {
            window.__HIDE_HUD = false;
            window.__SHORTS_FOCUS_X = null;
            for (const k of Object.keys(saved)) { try { window[k] = saved[k]; } catch (_) {} }
          }
        }, ts, focusX);
        if (b64) {
          fs.writeFileSync(destPath, Buffer.from(b64.slice(b64.indexOf(',') + 1), 'base64'));
          return 'stage';
        }
      }
      execFileSync(ffmpeg, ['-y', '-ss', String(ts), '-i', inMp4, '-frames:v', '1', '-update', '1', '-q:v', '2', destPath]);
      return 'ffmpeg';
    }

    console.log(`=== 1. Extracting Full-Screen Key-Scene Climax Frames (${episodes.length} EPs, <= ${allowOver60 ? maxSec : Math.min(maxSec, 60)}s each) ===`);
    for (const ep of episodes) {
      const span = Math.max(0.5, ep.end - ep.start);
      const candidates = [
        ep.extractAt,
        Number((ep.start + span * 0.55).toFixed(2)),
        Number((ep.start + span * 0.35).toFixed(2)),
        Number((ep.start + span * 0.78).toFixed(2))
      ];
      let chosenAt = ep.extractAt;
      let bestLuma = -1;
      for (let i = 0; i < candidates.length; i++) {
        const ts = Math.max(0, candidates[i]);
        await captureCandidateFrame(ts, ep.rawImg, ep.focusX);
        const imgUrl = 'file:///' + ep.rawImg.replace(/\\/g, '/') + `?t=${Date.now()}_${i}`;
        const stats = await page.evaluate(u => window.measureImageLuma(u), imgUrl);
        if (stats.meanLuma > bestLuma) {
          bestLuma = stats.meanLuma;
          chosenAt = ts;
        }
        if (stats.meanLuma >= 12 && stats.brightRatio >= 0.08) break;
        if (i < candidates.length - 1) {
          console.warn(`  ⚠️ EP ${ep.ep} frame at ${ts}s is near-black (luma=${stats.meanLuma.toFixed(1)}); trying brighter keyframe...`);
        }
      }
      if (chosenAt !== ep.extractAt) {
        await captureCandidateFrame(chosenAt, ep.rawImg, ep.focusX);
      }
      if (!scenePage) {
        // FFmpeg fallback frames have HUD baked in (Telemetry top-right) — keep the 9:16 crop near center.
        ep.hudBaked = true;
        console.warn(`  ⚠️ EP ${ep.ep}: no index.html — frame taken from master MP4 (HUD baked in); cover crop clamped to center to hide Telemetry.`);
      }
      if (bestLuma < 8) {
        console.warn(`  ⚠️ EP ${ep.ep} best candidate frame at ${chosenAt}s still very dark (luma=${bestLuma.toFixed(1)}). Check visual output!`);
      }
      ep.extractAt = chosenAt;
      console.log(`✓ EP ${ep.ep}: extracted @ ${chosenAt}s [${ep.keySceneId}/${ep.keyView} | score=${ep.keyScore} | luma=${bestLuma.toFixed(1)}]`);
    }

    if (scenePage) await scenePage.close().catch(() => {});

    console.log('\n=== 2. Rendering Key-Scene Shorts Covers (1080x1920) ===');
    for (const ep of episodes) {
      const epData = { ...ep, imgUrl: 'file:///' + ep.rawImg.replace(/\\/g, '/') + `?v=${Date.now()}` };
      await page.evaluate(d => window.drawCover(d), epData);
      await page.waitForFunction(() => window.__done === true, { timeout: 8000 });
      await new Promise(r => setTimeout(r, 120));
      const coverStats = await page.evaluate(() => window.__lastStats);
      if (coverStats && coverStats.heroMeanLuma < 8) {
        console.warn(`  ⚠️ Cover EP ${ep.ep} hero frame is very dark (luma=${coverStats.heroMeanLuma.toFixed(1)}).`);
      }
      await page.screenshot({ path: ep.outFile, type: 'png' });
      console.log(`  -> Saved ${path.basename(ep.outFile)} ("${ep.titleTop || ep.topLine} / ${ep.titleBot || ep.redWord}")`);
    }
  } finally {
    await browser.close();
    try { fs.unlinkSync(htmlFile); } catch (_) {}
    try { fs.rmSync(tmpProfileDir, { recursive: true, force: true }); } catch (_) {}
  }
  console.log('🎉 All Key-Scene Shorts Covers Successfully Rendered!');
})();
