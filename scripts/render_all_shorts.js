// =============================================================================
//  render_all_shorts.js — Render Dynamic Vertical Shorts (EP 1..N, <= 60s each)
//  Part of skill: thai-sitcom-animator
//  Automatically packs & splits timeline scenes via shorts_planner.js so every
//  Shorts episode is <= 58s (strictly <= 60s) — scaling from EP 1..5 to EP 6,
//  EP 7, EP 8+ as story length grows.
//  Composites overlays with shorts/overlay_epX.png (Minimalist Title + EP Pill).
//
//  Usage:
//    node render_all_shorts.js [--input master.mp4] [--mode fullscreen|crop|letterbox|zoom] [--fps 30] [--lufs -14] [--max-sec 58] [--min-sec 22] [--max-ep 2] [--ep N] [--concurrency 2] [--allow-over-60]
// =============================================================================
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
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

function resolvePkg(name) {
  for (const r of [localReq, require]) {
    try { return r(name); } catch (_) {}
  }
  return null;
}

function loadPlanner() {
  for (const candidate of [
    path.join(projectDir, 'shorts_planner.js'),
    path.join(__dirname, 'shorts_planner.js')
  ]) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  throw new Error('Missing shorts_planner.js — copy scripts/shorts_planner.js or run from scripts/.');
}

function resolveFFmpeg() {
  for (const r of [localReq, require]) {
    try {
      const p = r('ffmpeg-static');
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return 'ffmpeg';
}

function findBrowserExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const p of candidates) { if (p && fs.existsSync(p)) return p; }
  return undefined;
}

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

function findAudioSource(inMp4) {
  for (const rel of [path.join('audio', 'master.wav'), path.join('audio', 'master.mp3')]) {
    const p = path.join(projectDir, rel);
    if (fs.existsSync(p)) return p;
  }
  if (inMp4 && fs.existsSync(inMp4)) return inMp4;
  throw new Error('Missing audio/master.wav (or master MP4) for Shorts audio.');
}

(async () => {
  const ffmpeg = resolveFFmpeg();
  const tlPath = path.join(projectDir, 'timeline.json');
  if (!fs.existsSync(tlPath)) {
    console.error('Missing timeline.json — run generate_audio.js first.');
    process.exit(1);
  }

  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const cfgPath = path.join(projectDir, 'shorts_config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
  const outDir = path.join(projectDir, 'shorts');
  fs.mkdirSync(outDir, { recursive: true });

  const requestedMode = (getArg('--mode') || cfg.mode || 'fullscreen').toLowerCase(); // 'fullscreen' (default 9:16 full-bleed) | 'crop' | 'letterbox' | 'zoom'
  const format = hasFlag('--single') ? 'single' : (getArg('--format') || cfg.shortsFormat || undefined);
  const fps = getArg('--fps') || '30';
  const fpsNum = Number(fps) || 30;
  const lufs = getArg('--lufs') || '-14.0';
  const maxSec = Number(getArg('--max-sec') || cfg.maxSec || 58);
  const minSec = Number(getArg('--min-sec') || cfg.minSec || 45);
  const maxEpArg = getArg('--max-ep');
  const maxEp = maxEpArg ? Number(maxEpArg) : (cfg.maxEp || cfg.maxEpisodes || null);
  const allowOver60 = hasFlag('--allow-over-60') || Boolean(cfg.allowOver60);
  const onlyEp = getArg('--ep') ? Number(getArg('--ep')) : null;
  const onlyEvents = hasFlag('--events-only');
  const concurrency = Math.max(1, Math.min(4, Number(getArg('--concurrency') || 2)));

  const htmlPath = path.join(projectDir, 'index.html');
  const puppeteer = resolvePkg('puppeteer-core') || resolvePkg('puppeteer');
  const executablePath = findBrowserExecutable();
  const hasNativeHtml = fs.existsSync(htmlPath) && puppeteer && (executablePath || resolvePkg('puppeteer'));
  const useNativeFullscreen = requestedMode === 'fullscreen' && hasNativeHtml;
  const effectiveMode = requestedMode === 'fullscreen' && !hasNativeHtml ? 'crop' : requestedMode;

  const inMp4 = findMasterMp4(!useNativeFullscreen);
  if (requestedMode === 'fullscreen' && !useNativeFullscreen) {
    console.warn('⚠️ index.html or Chrome/Puppeteer not found; falling back from native fullscreen to FFmpeg focal 9:16 crop.');
  }

  let defaultPrefix = 'master_hf';
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) defaultPrefix = pkg.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    } catch (_) {}
  }
  const prefix = inMp4 ? path.basename(inMp4, path.extname(inMp4)).replace(/_16x9$/, '') : defaultPrefix;
  const audioSrc = useNativeFullscreen ? findAudioSource(inMp4) : inMp4;

  const { planShortsEpisodes, saveShortsPlan } = loadPlanner();
  const epRanges = planShortsEpisodes(tl, cfg, { maxSec, minSec, maxEp, allowOver60, format });
  const planPath = saveShortsPlan(projectDir, epRanges);

  const selected = onlyEvents
    ? epRanges.filter(item => item.isEvent)
    : (onlyEp ? epRanges.filter(item => item.ep === onlyEp && !item.isSingle && !item.isEvent) : epRanges);
  console.log(`=== Rendering ${selected.length} Vertical Shorts (1080x1920, ${fps}fps, mode=${effectiveMode}${useNativeFullscreen ? ' [native canvas]' : ''}, ${lufs} LUFS, concurrency=${concurrency}, cap=${allowOver60 ? `${maxSec}s (override)` : `${Math.min(maxSec, 60)}s <= 60s`}) ===`);
  console.log(`✓ Saved Shorts plan: ${path.relative(projectDir, planPath)} (${epRanges.length} EPs)`);

  for (const item of selected) {
    const durSec = Number(item.dur);
    if (!allowOver60 && durSec > 60.0) {
      console.error(`❌ EP ${item.ep} duration ${durSec.toFixed(2)}s exceeds 60.0s YouTube Shorts limit. Lower --max-sec or check shorts_config.json.`);
      process.exit(1);
    }
    const overlayFile = path.join(outDir, item.overlayFile || `overlay_ep${item.ep}.png`);
    if (!fs.existsSync(overlayFile)) {
      console.error(`Missing overlay: ${overlayFile}. Run generate_shorts_overlays.js${getArg('--max-sec') ? ` --max-sec ${maxSec}` : ''} first.`);
      process.exit(1);
    }
  }

  function runFFmpegAsync(args) {
    return new Promise((resolve, reject) => {
      const child = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let errTail = '';
      child.stderr.on('data', d => { errTail = (errTail + d.toString()).slice(-1200); });
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${errTail}`)));
    });
  }

  const tmpProfileDir = useNativeFullscreen ? fs.mkdtempSync(path.join(os.tmpdir(), 'p_ren_')) : null;
  const browser = useNativeFullscreen
    ? await puppeteer.launch({
        ...(executablePath ? { executablePath } : {}),
        headless: 'new',
        protocolTimeout: 600000,
        userDataDir: tmpProfileDir,
        args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
      })
    : null;

  let cursor = 0;
  async function renderWorker() {
    let page = null;
    let hasNativeSetter = false;
    if (browser) {
      page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
      await page.goto('file:///' + htmlPath.replace(/\\/g, '/') + '?shorts=1', { waitUntil: 'load' });
      hasNativeSetter = await page.evaluate(async () => {
        if (window.__setHeadless) window.__setHeadless();
        document.body.classList.add('headless', 'export-mode');
        await document.fonts.ready;
        if (typeof window.setShortsMode === 'function') {
          window.setShortsMode(true);
          return true;
        }
        window.SHORTS_MODE = true;
        const root = document.getElementById('root');
        const cvs = document.getElementById('stage');
        if (root) {
          root.style.width = '1080px';
          root.style.height = '1920px';
        }
        if (cvs) {
          cvs.style.position = 'absolute';
          cvs.style.left = '50%';
          cvs.style.top = '0';
          cvs.style.width = '1280px';
          cvs.style.height = '720px';
          cvs.style.transformOrigin = 'top center';
          cvs.style.transform = 'translateX(-50%) scale(2.6667)';
        }
        return false;
      });
    }

    try {
      while (true) {
        const idx = cursor++;
        if (idx >= selected.length) return;
        const item = selected[idx];
        const startSec = Number(item.start);
        const durSec = Number(item.dur);
        const overlayFile = path.join(outDir, item.overlayFile || (item.isStandalone ? 'overlay_shorts.png' : `overlay_ep${item.ep}.png`));
        const outFile = path.join(outDir, item.outFile || item.outFileName || (item.isStandalone ? `${prefix}_shorts.mp4` : `${prefix}_ep${item.ep}_shorts.mp4`));

        const rawSegs = (Array.isArray(item.segments) && item.segments.length > 0)
          ? item.segments
          : [{ start: startSec, dur: durSec, focusX: item.focusX }];
        const segPlans = rawSegs.map(seg => {
          const sDur = Number(seg.dur);
          const frames = Math.max(1, Math.round(sDur * fpsNum));
          const exactDur = frames / fpsNum;
          return {
            start: Number(seg.start),
            frames,
            exactDur,
            focusX: seg.focusX != null ? Number(seg.focusX) : Number(item.focusX || 640)
          };
        });

        console.log(`--- Rendering EP ${item.ep} (${segPlans.length} segs, Start: ${startSec.toFixed(2)}s, Dur: ${durSec.toFixed(2)}s, mode=${effectiveMode}) ---`);
        const t0 = Date.now();

        if (useNativeFullscreen && page) {
          let ffArgs;
          if (segPlans.length === 1) {
            ffArgs = [
              '-y',
              '-f', 'image2pipe',
              '-vcodec', 'mjpeg',
              '-r', String(fps),
              '-i', '-',
              '-ss', segPlans[0].start.toFixed(4),
              '-t', segPlans[0].exactDur.toFixed(4),
              '-i', audioSrc,
              '-i', overlayFile,
              '-filter_complex', '[0:v][2:v]overlay=0:0[vfinal]',
              '-map', '[vfinal]',
              '-map', '1:a',
              '-r', String(fps),
              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
              '-af', `loudnorm=I=${lufs}:LRA=7.0:TP=-2.2,aresample=48000,alimiter=limit=0.81:attack=1:release=50:level=false`,
              '-ar', '48000',
              '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
              outFile
            ];
          } else {
            const aTrims = segPlans.map((sg, si) =>
              `[1:a]atrim=start=${sg.start.toFixed(4)}:duration=${sg.exactDur.toFixed(4)},asetpts=PTS-STARTPTS[a${si}]`
            ).join(';');
            const aConcatIn = segPlans.map((_, si) => `[a${si}]`).join('');
            const filterComplex =
              `[0:v][2:v]overlay=0:0[vfinal];` +
              `${aTrims};` +
              `${aConcatIn}concat=n=${segPlans.length}:v=0:a=1[aconcat];` +
              `[aconcat]loudnorm=I=${lufs}:LRA=7.0:TP=-2.2,aresample=48000,alimiter=limit=0.81:attack=1:release=50:level=false[afinal]`;
            ffArgs = [
              '-y',
              '-f', 'image2pipe',
              '-vcodec', 'mjpeg',
              '-r', String(fps),
              '-i', '-',
              '-i', audioSrc,
              '-i', overlayFile,
              '-filter_complex', filterComplex,
              '-map', '[vfinal]',
              '-map', '[afinal]',
              '-r', String(fps),
              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
              '-ar', '48000',
              '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
              outFile
            ];
          }

          const ff = spawn(ffmpeg, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
          let errTail = '';
          ff.stderr.on('data', d => { errTail = (errTail + d.toString()).slice(-1200); });
          const ffDone = new Promise((resolve, reject) => {
            ff.on('error', reject);
            ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${errTail}`)));
          });

          const totalPlanFrames = segPlans.reduce((a, b) => a + b.frames, 0);
          const totalPlanDur = totalPlanFrames / fpsNum;
          const isFinalEp = item.isFinal !== false;
          const ctaText = item.visualCta || null;

          if (hasNativeSetter) {
            const BATCH = 8;
            let globalFrameBase = 0;
            for (const sg of segPlans) {
              for (let f = 0; f < sg.frames; f += BATCH) {
                const framesBatch = [];
                for (let k = 0; k < BATCH && f + k < sg.frames; k++) {
                  const uSec = (globalFrameBase + f + k) / fpsNum;
                  framesBatch.push({
                    t: sg.start + (f + k) / fpsNum,
                    remSec: +(Math.max(0, totalPlanDur - uSec)).toFixed(3)
                  });
                }
                const dataUrls = await page.evaluate((items, fx, isFin, cta) => {
                  window.__SHORTS_FOCUS_X = fx;
                  window.__SHORTS_IS_FINAL = isFin;
                  window.__SHORTS_CTA_TEXT = cta;
                  const stage = document.getElementById('stage');
                  try {
                    return items.map(it => {
                      window.__SHORTS_REM_SEC = it.remSec;
                      window.renderAtTime(it.t);
                      return stage.toDataURL('image/jpeg', 0.90);
                    });
                  } finally {
                    window.__SHORTS_FOCUS_X = null;
                    window.__SHORTS_REM_SEC = null;
                  }
                }, framesBatch, sg.focusX, isFinalEp, ctaText);
                for (const durl of dataUrls) {
                  const buf = Buffer.from(durl.slice(durl.indexOf(',') + 1), 'base64');
                  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
                }
              }
              globalFrameBase += sg.frames;
            }
          } else {
            let globalFrameBase = 0;
            for (const sg of segPlans) {
              await page.evaluate((fx, isFin, cta) => {
                window.__SHORTS_FOCUS_X = fx;
                window.__SHORTS_IS_FINAL = isFin;
                window.__SHORTS_CTA_TEXT = cta;
              }, sg.focusX, isFinalEp, ctaText);
              for (let f = 0; f < sg.frames; f++) {
                const uSec = (globalFrameBase + f) / fpsNum;
                const remSec = +(Math.max(0, totalPlanDur - uSec)).toFixed(3);
                await page.evaluate((t, rSec) => {
                  window.__SHORTS_REM_SEC = rSec;
                  window.renderAtTime(t);
                }, sg.start + f / fpsNum, remSec);
                const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
                if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
              }
              globalFrameBase += sg.frames;
              await page.evaluate(() => {
                window.__SHORTS_FOCUS_X = null;
                window.__SHORTS_REM_SEC = null;
              });
            }
          }
          ff.stdin.end();
          await ffDone;
        } else {
          const buildScaleChain = (inLabel, outLabel) => {
            if (effectiveMode === 'letterbox' || effectiveMode === 'zoom') {
              const fgFilter = effectiveMode === 'zoom'
                ? `[${inLabel}]scale=1458:820:flags=lanczos,crop=1080:608:(iw-1080)/2:(ih-608)/2[fg];`
                : `[${inLabel}]scale=1080:608:flags=lanczos[fg];`;
              return (
                `[${inLabel}]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:5,eq=brightness=-0.16:contrast=0.88[bg];` +
                fgFilter +
                `[bg][fg]overlay=0:576[${outLabel}]`
              );
            }
            const focusRatio = Math.max(0.15, Math.min(0.85, (Number(item.focusX) || 640) / 1280)).toFixed(3);
            return `[${inLabel}]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920:(iw-1080)*${focusRatio}:0[${outLabel}]`;
          };

          if (segPlans.length === 1) {
            const filterComplex = `${buildScaleChain('0:v', 'vbase')};[vbase][1:v]overlay=0:0[vfinal]`;
            await runFFmpegAsync([
              '-y',
              '-ss', segPlans[0].start.toFixed(4),
              '-t', segPlans[0].exactDur.toFixed(4),
              '-i', inMp4,
              '-i', overlayFile,
              '-filter_complex', filterComplex,
              '-map', '[vfinal]',
              '-map', '0:a',
              '-r', String(fps),
              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
              '-af', `loudnorm=I=${lufs}:LRA=7.0:TP=-2.2,aresample=48000,alimiter=limit=0.81:attack=1:release=50:level=false`,
              '-ar', '48000',
              '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
              outFile
            ]);
          } else {
            const trims = segPlans.map((sg, si) =>
              `[0:v]trim=start=${sg.start.toFixed(4)}:duration=${sg.exactDur.toFixed(4)},setpts=PTS-STARTPTS[v${si}];` +
              `[0:a]atrim=start=${sg.start.toFixed(4)}:duration=${sg.exactDur.toFixed(4)},asetpts=PTS-STARTPTS[a${si}]`
            ).join(';');
            const concatIn = segPlans.map((_, si) => `[v${si}][a${si}]`).join('');
            const filterComplex =
              `${trims};` +
              `${concatIn}concat=n=${segPlans.length}:v=1:a=1[vraw][aconcat];` +
              `${buildScaleChain('vraw', 'vbase')};` +
              `[vbase][1:v]overlay=0:0[vfinal];` +
              `[aconcat]loudnorm=I=${lufs}:LRA=7.0:TP=-2.2,aresample=48000,alimiter=limit=0.81:attack=1:release=50:level=false[afinal]`;
            await runFFmpegAsync([
              '-y',
              '-i', inMp4,
              '-i', overlayFile,
              '-filter_complex', filterComplex,
              '-map', '[vfinal]',
              '-map', '[afinal]',
              '-r', String(fps),
              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
              '-ar', '48000',
              '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
              outFile
            ]);
          }
        }

        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        const size = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
        console.log(`  -> Finished EP ${item.ep} in ${elapsed}s | Size: ${size} MB | ${path.basename(outFile)}`);
      }
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, selected.length)) }, () => renderWorker()));
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (tmpProfileDir) try { fs.rmSync(tmpProfileDir, { recursive: true, force: true }); } catch (_) {}
  }
  console.log('\n🎉 All Vertical Shorts Episodes Rendered Successfully!');
})();
