// =============================================================================
//  shorts_planner.js — Standalone 1-Clip (45-60s) & Max 2-EP Shorts Planner
//  & Key-Scene Climax Frame Selector
//  Part of skill: thai-sitcom-animator
//
//  Used by:
//    - render_all_shorts.js
//    - generate_shorts_overlays.js
//    - generate_scene_covers.js
//    - generate_thumbnail.js
// =============================================================================
const fs = require('fs');
const path = require('path');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const HIGH_IMPACT_SFX = /stinger|sting|shriek|scream|crack|crash|slam|blackout|boom|heartbeat|alert|squeak|rumble|attack|roar|growl|hiss|snap|thunder|rimshot|ba_dum_tss|record_scratch|vine_boom|cash_register|sad_trombone|line_ping|slurp/i;
const HIGH_IMPACT_VIEW = /twist|climax|entity|monster|creature|chase|hide|attack|reveal|crack|escape|showdown|blood|danger|trap|swarm|dead|panic|freeze|collapse|confront|punchline|versus|price_tag|shock|wallet|bill|boss|chat/i;

function isCliffhangerScene(sc) {
  if (!sc) return false;
  if (sc.isClimax || sc.isCliffhanger) return true;
  const card = sc.card || sc.hud;
  if (card && /^(dilemma|flow|anomaly|clue|punchline|versus)$/.test(card.type || '')) return true;
  const tl = sc.telemetry || sc.tele;
  if (tl && (tl.status === 'CRITICAL' || tl.status === 'DANGER')) return true;
  const vo = String(sc.vo || '').trim();
  return /[?؟!]$/.test(vo);
}

function hasRecapCue(scene) {
  if (!scene) return false;
  if (scene.isRecap === true) return true;
  const chap = Array.isArray(scene.chapter)
    ? scene.chapter.join(' ')
    : `${scene.chapter?.label || ''} ${scene.chapter?.title || ''}`;
  const card = scene.card || scene.hud;
  const cardTxt = card ? (Array.isArray(card.title) ? card.title.join(' ') : `${card.title || ''} ${card.badge || ''}`) : '';
  return /ความเดิม|ตอนที่แล้ว|หลังจาก|ก่อนหน้านี้|จากตอน|เมื่อกี้|ย้อนสรุป|สรุปความเดิม|recap/i.test(`${scene.vo || ''} ${chap} ${cardTxt}`);
}

function scoreSceneDramaticImpact(scene, posInEp = 0, totalInEp = 1) {
  if (!scene) return 0;
  if (typeof scene.coverScore === 'number') return scene.coverScore;

  let score = 0;
  if (scene.isClimax) score += 60;
  if (scene.coverAt !== undefined) score += 40;

  const tl = scene.telemetry || scene.tele;
  if (tl) {
    if (tl.status === 'CRITICAL') score += 32;
    else if (tl.status === 'DANGER') score += 26;
    else if (tl.status === 'WARN') score += 8;
    if (tl.lights === false) score += 20;
    if (tl.distance || tl.dist) score += 24;
    if (tl.wallet != null && tl.wallet < 100) score += 20;
    if (tl.battery != null && tl.battery <= 15) score += 16;
  }

  const card = scene.card || scene.hud;
  if (card) {
    if (card.type === 'dilemma' || card.type === 'flow' || card.type === 'versus') score += 22;
    else if (card.type === 'anomaly' || card.type === 'clue' || card.type === 'punchline') score += 22;
    else if (card.type === 'rule' || card.type === 'social') score += 20;
    else if (card.type === 'math' || card.type === 'calc' || card.type === 'price_tag') score += 14;
    else if (card.type === 'info' || card.type === 'speech' || card.type === 'thought') score += 8;
    else if (card.type === 'inventory') score += 4;
  }

  const sfxList = scene.sfx || [];
  let sfxHits = 0;
  for (const cue of sfxList) {
    const key = cue.type || cue.k || '';
    if (HIGH_IMPACT_SFX.test(key)) sfxHits++;
  }
  score += Math.min(24, sfxHits * 10);

  const viewAndId = `${scene.view || ''} ${scene.id || ''}`;
  if (HIGH_IMPACT_VIEW.test(viewAndId)) score += 16;

  // Reward both 3-second cold-open peak hooks (posInEp === 0) and finale cliffhangers
  if (posInEp === 0 || (totalInEp > 1 && posInEp >= totalInEp - 2)) score += 10;
  if (scene.dur >= 4.0) score += 4;

  return score;
}

function pickKeyTimestampInScene(scene, winStart = null, winEnd = null) {
  const sStart = Number(scene.start || 0);
  const sDur = Number(scene.dur || 4);
  const lo = winStart !== null ? Math.max(sStart + 0.32, winStart + 0.32) : sStart + 0.32;
  const hi = winEnd !== null ? Math.min(sStart + sDur - 0.32, winEnd - 0.32) : sStart + sDur - 0.32;
  const safeClamp = (absT) => Number(clamp(absT, Math.min(lo, hi), Math.max(lo, hi)).toFixed(2));

  if (scene.coverAt !== undefined) {
    return safeClamp(sStart + Number(scene.coverAt));
  }

  // Prefer right after the highest-impact SFX cue within the visible window
  const sfxList = scene.sfx || [];
  for (const cue of sfxList) {
    const key = cue.type || cue.k || '';
    const at = cue.at !== undefined ? Number(cue.at) : Number(cue.t || 0);
    if (HIGH_IMPACT_SFX.test(key) && sStart + at + 0.35 >= lo && sStart + at + 0.35 <= hi) {
      return safeClamp(sStart + at + 0.35);
    }
  }

  // Otherwise capture right after an iconic HUD card settles on screen
  const card = scene.card || scene.hud;
  if (card) {
    const at = card.at !== undefined ? Number(card.at) : 0.4;
    const candidate = sStart + at + 1.15;
    if (candidate >= lo && candidate <= hi) return safeClamp(candidate);
  }

  // Default: 58% into the scene window (well clear of 0.14s edge fades)
  return safeClamp(lo + (hi - lo) * 0.58);
}

function splitLongSingleScene(scene, maxSec) {
  const parts = [];
  const total = Number(scene.dur || 0);
  const subs = Array.isArray(scene.subs) ? scene.subs : [];
  let cursor = 0;

  while (cursor < total - 0.2) {
    const remaining = total - cursor;
    if (remaining <= maxSec) {
      parts.push({
        start: Number((scene.start + cursor).toFixed(3)),
        dur: Number(remaining.toFixed(3)),
        scenes: [scene]
      });
      break;
    }

    // Find latest subtitle end that fits cleanly within maxSec
    let splitAt = cursor + maxSec;
    const candidates = subs.filter(q => {
      const t1 = q.t1 !== undefined ? q.t1 : q.end;
      return t1 > cursor + 15 && t1 <= cursor + maxSec;
    });
    if (candidates.length > 0) {
      const last = candidates[candidates.length - 1];
      splitAt = last.t1 !== undefined ? last.t1 : last.end;
    }

    parts.push({
      start: Number((scene.start + cursor).toFixed(3)),
      dur: Number((splitAt - cursor).toFixed(3)),
      scenes: [scene]
    });
    cursor = splitAt;
  }
  return parts;
}

function splitSceneListUnderMax(sceneList, maxSec = 58.0, minSec = 22.0, preferActBreaks = false) {
  if (!sceneList || sceneList.length === 0) return [];

  const buckets = [];
  let current = [];
  let currentDur = 0;

  for (let idx = 0; idx < sceneList.length; idx++) {
    const sc = sceneList[idx];
    const d = Number(sc.dur || 0);
    if (d > maxSec) {
      if (current.length > 0) {
        buckets.push({
          start: current[0].start,
          dur: Number(currentDur.toFixed(3)),
          scenes: current
        });
        current = [];
        currentDur = 0;
      }
      buckets.push(...splitLongSingleScene(sc, maxSec));
      continue;
    }

    const lastInCurrent = current.length > 0 ? current[current.length - 1] : null;
    const prevAct = lastInCurrent ? lastInCurrent.act : null;
    const isActBoundary = preferActBreaks && prevAct != null && sc.act != null && sc.act !== prevAct;
    const actMinCut = Math.max(minSec, Math.min(38, maxSec * 0.65));
    const cliffMinCut = Math.max(minSec, maxSec * 0.72);
    const isCliffCut = Boolean(
      lastInCurrent &&
      currentDur >= cliffMinCut &&
      isCliffhangerScene(lastInCurrent) &&
      (currentDur + d > maxSec * 0.90 || !isCliffhangerScene(sc))
    );

    if (current.length > 0 && (currentDur + d > maxSec || (isActBoundary && currentDur >= actMinCut) || isCliffCut)) {
      buckets.push({
        start: current[0].start,
        dur: Number(currentDur.toFixed(3)),
        scenes: current
      });
      current = [sc];
      currentDur = d;
    } else {
      current.push(sc);
      currentDur += d;
    }
  }

  if (current.length > 0) {
    buckets.push({
      start: current[0].start,
      dur: Number(currentDur.toFixed(3)),
      scenes: current
    });
  }

  // Merge adjacent undersized buckets when their sum still fits safely inside maxSec
  for (let i = 0; i < buckets.length - 1; ) {
    const a = buckets[i];
    const b = buckets[i + 1];
    if ((a.dur < minSec || b.dur < minSec) && (a.dur + b.dur <= maxSec)) {
      buckets.splice(i, 2, {
        start: a.start,
        dur: Number((a.dur + b.dur).toFixed(3)),
        scenes: [...a.scenes, ...b.scenes]
      });
    } else {
      i++;
    }
  }

  // Rebalance last two buckets so the finale EP isn't dramatically shorter than the penultimate EP
  if (buckets.length >= 2) {
    const last = buckets[buckets.length - 1];
    const prev = buckets[buckets.length - 2];
    while (last.dur < prev.dur - 12 && prev.scenes.length > 1 && last.scenes.length > 0) {
      const moved = prev.scenes[prev.scenes.length - 1];
      if (last.dur + moved.dur > maxSec || prev.dur - moved.dur < minSec) break;
      prev.scenes.pop();
      prev.dur = Number((prev.dur - moved.dur).toFixed(3));
      last.scenes.unshift(moved);
      last.start = moved.start;
      last.dur = Number((last.dur + moved.dur).toFixed(3));
    }
  }

  return buckets;
}

function condenseBucketsToMaxEpisodes(buckets, allScenes, maxEpisodes = 2, maxSec = 58.0, minSec = 22.0) {
  if (!Array.isArray(buckets) || buckets.length <= maxEpisodes) return buckets;
  const sumDur = list => Number(list.reduce((s, sc) => s + Number(sc.dur || 0), 0).toFixed(3));

  if (maxEpisodes <= 1) {
    const allDur = sumDur(allScenes);
    if (allScenes.length > 0 && allDur <= maxSec) {
      return [{ start: allScenes[0].start, dur: allDur, scenes: allScenes }];
    }
    let best = buckets[0];
    let bestScore = -1;
    for (const b of buckets) {
      const scList = b.scenes || [];
      const scScore = scList.reduce((acc, sc, i) => acc + scoreSceneDramaticImpact(sc, i, scList.length), 0);
      if (scScore > bestScore) {
        bestScore = scScore;
        best = b;
      }
    }
    return [best];
  }

  if (maxEpisodes === 2) {
    const part1 = buckets[0];
    const p1Last = part1.scenes?.[part1.scenes.length - 1];
    const p1EndIdx = p1Last ? allScenes.indexOf(p1Last) : -1;
    const tailScenes = p1EndIdx >= 0 ? allScenes.slice(p1EndIdx + 1) : [];

    if (tailScenes.length > 0) {
      const recapIdx = tailScenes.findIndex((sc, i) => hasRecapCue(sc) || (i > 0 && sc.act != null && sc.act !== tailScenes[i - 1].act));
      if (recapIdx >= 0) {
        const fromRecap = tailScenes.slice(recapIdx);
        const fromRecapDur = sumDur(fromRecap);
        if (fromRecapDur > 0 && fromRecapDur <= maxSec) {
          return [part1, { start: fromRecap[0].start, dur: fromRecapDur, scenes: fromRecap }];
        }
      }

      // Pack from the finale backwards up to maxSec so Part 2 always lands on the ending resolution
      const chosenTail = [];
      let accDur = 0;
      for (let i = tailScenes.length - 1; i >= 0; i--) {
        const d = Number(tailScenes[i].dur || 0);
        if (d > maxSec) {
          if (chosenTail.length === 0) {
            return [part1, ...splitLongSingleScene(tailScenes[i], maxSec).slice(-1)];
          }
          break;
        }
        if (accDur + d > maxSec) break;
        chosenTail.unshift(tailScenes[i]);
        accDur += d;
      }
      if (chosenTail.length > 0 && accDur <= maxSec) {
        return [part1, { start: chosenTail[0].start, dur: Number(accDur.toFixed(3)), scenes: chosenTail }];
      }
    }

    return [part1, buckets[buckets.length - 1]];
  }

  return [buckets[0], ...buckets.slice(-(maxEpisodes - 1))];
}

function segmentThaiWords(text) {
  if (typeof Intl === 'undefined' || !Intl.Segmenter) return null;
  return Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(text), p => p.segment);
}

function trimHeadlinePhrase(text, maxChars) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= maxChars) return s;
  const segs = segmentThaiWords(s);
  if (segs) {
    let acc = '';
    for (const seg of segs) {
      if ((acc + seg).trim().length > maxChars) break;
      acc += seg;
    }
    const clean = acc.trim().replace(/[.,…:;\-]+$/, '');
    if (clean.length >= Math.floor(maxChars * 0.45)) return clean;
  }
  const cut = s.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace >= Math.floor(maxChars * 0.55) ? cut.slice(0, lastSpace) : cut).replace(/[.,…:;\-]+$/, '');
}

function trimPunchTail(text, maxChars) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= maxChars) return s;
  if (/[\d!?؟]/.test(s.slice(-12))) {
    const segs = segmentThaiWords(s);
    if (segs) {
      let acc = '';
      let bestAcc = '';
      for (let i = segs.length - 1; i >= 0; i--) {
        if ((segs[i] + acc).trim().length > maxChars) break;
        acc = segs[i] + acc;
        const cleanStart = /^[\u0E01-\u0E2E\u0E40-\u0E44A-Za-z0-9]/.test(segs[i])
          && (i === 0 || !/[\u0E40-\u0E44]$/.test(segs[i - 1]));
        if (cleanStart) bestAcc = acc.trim();
      }
      if (bestAcc.length >= Math.floor(maxChars * 0.45)) return bestAcc;
    }
    return s.slice(-maxChars).trim();
  }
  return trimHeadlinePhrase(s, maxChars);
}

function extractCuriosityHookFromVo(rawText) {
  const clean = String(rawText || '').split('|')[0].replace(/…/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 8) return null;

  const twistSplit = clean.match(/^(.{6,34}?)(?:\s*[,.;]\s*|\s+(?:แต่|กลับ|จน|พบว่า|กลายเป็น|แถม|สรุป|แล้ว)\s*)(.{4,})$/);
  let top = '';
  let punch = '';
  if (twistSplit) {
    top = trimHeadlinePhrase(twistSplit[1], 34);
    punch = trimPunchTail(twistSplit[2], 26);
  } else {
    const spaceParts = clean.split(/\s+/).filter(Boolean);
    if (spaceParts.length >= 2) {
      const mid = Math.max(1, Math.min(spaceParts.length - 1, Math.ceil(spaceParts.length * 0.55)));
      top = trimHeadlinePhrase(spaceParts.slice(0, mid).join(' '), 34);
      punch = trimPunchTail(spaceParts.slice(mid).join(' '), 26);
    } else {
      const segs = segmentThaiWords(clean);
      if (segs) {
        const target = Math.floor(clean.length * 0.55);
        let acc = '';
        let splitIdx = 0;
        for (let i = 0; i < segs.length; i++) {
          if (acc.length >= target && acc.length >= 8) break;
          acc += segs[i];
          splitIdx = i + 1;
        }
        const rest = segs.slice(splitIdx).join('').trim();
        if (acc.trim().length >= 6 && rest.length >= 4) {
          top = trimHeadlinePhrase(acc.trim(), 34);
          punch = trimPunchTail(rest, 26);
        }
      }
    }
  }
  if (!top || !punch) return null;
  if (!/[!?؟]$/.test(punch)) {
    const isQ = /ทำไม|ใคร|อะไร|ที่ไหน|เมื่อไหร่|ยังไง|ทำไง|จริงหรือ/.test(`${top} ${punch}`);
    punch = trimHeadlinePhrase(punch, 26) + (isQ ? '?!' : '!');
  }
  return { topLine: top, redWord: punch };
}

function deriveHeadlineFromScene(scene, epNum, totalEps, fallbackTitle) {
  if (Array.isArray(scene?.coverHeadline) && scene.coverHeadline.length >= 2) {
    return { topLine: scene.coverHeadline[0], redWord: scene.coverHeadline[1] };
  }
  const tl = scene?.telemetry || scene?.tele;
  const card = scene?.card || scene?.hud;
  const voHook = extractCuriosityHookFromVo(scene?.vo);
  if (card) {
    const titles = Array.isArray(card.title) ? card.title : [card.title, card.sub].filter(Boolean);
    const shortRule = card.ruleNo ? `${card.ruleNo} ห้ามพลาด!` : null;
    if (titles.length >= 2) {
      const punch = titles[1].length <= 26 ? titles[1] : (shortRule || voHook?.redWord || (tl?.label && tl.label.length <= 26 ? tl.label : null) || trimHeadlinePhrase(titles[1], 26));
      return { topLine: trimHeadlinePhrase(titles[0], 34), redWord: punch };
    }
    if (titles.length === 1) {
      return {
        topLine: trimHeadlinePhrase(titles[0], 34),
        redWord: voHook?.redWord || shortRule || (tl?.label && trimHeadlinePhrase(tl.label, 24)) || (epNum === totalEps && totalEps > 1 ? 'จุดจบจริง?!' : 'พลาดไม่ได้!')
      };
    }
  }
  if (voHook) return voHook;
  const chapTitle = scene?.chapter
    ? (Array.isArray(scene.chapter) ? scene.chapter[1] : scene.chapter.title)
    : null;
  if (chapTitle && tl?.label) return { topLine: trimHeadlinePhrase(chapTitle, 34), redWord: trimHeadlinePhrase(tl.label, 24) };
  if (chapTitle) return { topLine: trimHeadlinePhrase(chapTitle, 34), redWord: epNum === totalEps ? 'ความจริงทั้งหมด?!' : 'นาทีวิกฤต!' };
  if (tl?.day && tl?.label) return { topLine: trimHeadlinePhrase(String(tl.day), 34), redWord: trimHeadlinePhrase(String(tl.label), 24) };
  const fbHook = extractCuriosityHookFromVo(fallbackTitle);
  if (fbHook) return fbHook;
  const cleanFallback = String(fallbackTitle || '').split('|')[0].trim();
  return { topLine: trimHeadlinePhrase(cleanFallback || `เหตุการณ์ที่ ${epNum}`, 34), redWord: epNum === totalEps ? 'บทสรุปจริง?!' : 'จุดเปลี่ยนสำคัญ!' };
}

function stripEpPrefix(text) {
  return String(text || '')
    .replace(/^(?:EP\.?\s*\d+(?:\s*\([^)]*\))?|ตอนที่\s*\d+|เหตุการณ์\s*(?:ที่|#)?\s*\d+|ตอนจบ|ตอนเดียวจบ|จบใน\s*\d*\s*คลิป(?:\s*เดียว)?)\s*[:·\-–—]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitShortTwoLines(rawText, maxLineChars = 22) {
  const s = stripEpPrefix(String(rawText || '').split('|')[0]).replace(/[“”"]/g, '').trim();
  if (!s) return ['เรื่องฮา', 'ห้ามพลาด!'];
  if (s.length <= 10) return [s, 'ห้ามพลาด!'];

  const compact = s.length > maxLineChars * 2 ? trimHeadlinePhrase(s, maxLineChars * 2) : s;
  const words = compact.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    let bestSplit = -1;
    let bestScore = Infinity;
    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(' ');
      const l2 = words.slice(i).join(' ');
      if (l1.length < 4 || l2.length < 3) continue;
      if (l1.length <= maxLineChars && l2.length <= maxLineChars) {
        const diff = Math.abs(l1.length - l2.length);
        if (diff < bestScore) { bestScore = diff; bestSplit = i; }
      }
    }
    if (bestSplit !== -1) {
      const a = trimHeadlinePhrase(words.slice(0, bestSplit).join(' '), maxLineChars);
      const b = trimHeadlinePhrase(words.slice(bestSplit).join(' '), maxLineChars);
      if (a && b && !/^[!?.,…]+$/.test(b)) return [a, b];
    }
  }

  const segs = segmentThaiWords(compact);
  if (segs && segs.length >= 2) {
    const target = Math.floor(compact.length * 0.52);
    let acc = '';
    let bestIdx = -1;
    let bestDist = Infinity;
    let fallbackIdx = -1;
    let fallbackDist = Infinity;
    for (let i = 0; i < segs.length - 1; i++) {
      acc += segs[i];
      const nextSeg = segs[i + 1] || '';
      const validBreak = !/^[!?.,…\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]+$/.test(nextSeg)
        && !/^\d+$/.test(segs[i].trim());
      const l1Len = acc.trim().length;
      const l2Len = compact.slice(acc.length).trim().length;
      if (validBreak && l1Len >= 4 && l2Len >= 3) {
        const dist = Math.abs(l1Len - target);
        if (l1Len <= maxLineChars && l2Len <= maxLineChars) {
          if (dist < bestDist) { bestDist = dist; bestIdx = i + 1; }
        } else if (dist < fallbackDist) {
          fallbackDist = dist; fallbackIdx = i + 1;
        }
      }
    }
    const chosenIdx = bestIdx !== -1 ? bestIdx : fallbackIdx;
    if (chosenIdx !== -1) {
      const l1 = trimHeadlinePhrase(segs.slice(0, chosenIdx).join('').trim(), maxLineChars);
      const l2 = trimHeadlinePhrase(segs.slice(chosenIdx).join('').trim(), maxLineChars);
      if (l1 && l2 && !/^[!?.,…]+$/.test(l2)) return [l1, l2];
    }
  }

  const mid = Math.ceil(compact.length / 2);
  return [trimHeadlinePhrase(compact.slice(0, mid), maxLineChars), trimHeadlinePhrase(compact.slice(mid), maxLineChars) || '!'];
}

function deriveShortsHeaderFields({ bestScene, seriesTitle, headline, epNum, totalEps, isEvent = false, isFinal, spec = {}, ovCfg = null, cfg = {} }) {
  const topCfgTitle = spec.shortsTitle || bestScene?.shortsTitle || (!isEvent && cfg.shortsTitle) || (!isEvent && cfg.SHORTS_TITLE);
  const customArr = Array.isArray(topCfgTitle) && topCfgTitle.length >= 2 ? topCfgTitle : null;
  const customStr = typeof topCfgTitle === 'string' && topCfgTitle.trim() ? topCfgTitle.trim() : null;

  let titleTop, titleBot;
  if (ovCfg?.titleTop && ovCfg?.titleBot) {
    titleTop = stripEpPrefix(ovCfg.titleTop);
    titleBot = stripEpPrefix(ovCfg.titleBot);
  } else if (spec.topLine && spec.redWord) {
    titleTop = trimHeadlinePhrase(stripEpPrefix(spec.topLine), 24);
    titleBot = trimHeadlinePhrase(stripEpPrefix(spec.redWord), 24);
  } else if (customArr) {
    titleTop = trimHeadlinePhrase(stripEpPrefix(customArr[0]), 24);
    titleBot = trimHeadlinePhrase(stripEpPrefix(customArr[1]), 24);
  } else if (customStr) {
    [titleTop, titleBot] = splitShortTwoLines(customStr, 22);
  } else if (isEvent) {
    const evArr = Array.isArray(spec.coverHeadline) && spec.coverHeadline.length >= 2
      ? spec.coverHeadline
      : (Array.isArray(bestScene?.coverHeadline) && bestScene.coverHeadline.length >= 2 ? bestScene.coverHeadline : null);
    if (evArr) {
      titleTop = trimHeadlinePhrase(stripEpPrefix(evArr[0]), 24);
      titleBot = trimHeadlinePhrase(stripEpPrefix(evArr[1]), 24);
    } else if (spec.title) {
      [titleTop, titleBot] = splitShortTwoLines(spec.title, 22);
    } else {
      const chap = bestScene?.chapter ? (Array.isArray(bestScene.chapter) ? bestScene.chapter[1] : bestScene.chapter.title) : null;
      const evRaw = ovCfg?.title || spec.eventTitle || bestScene?.eventTitle || headline?.topLine || chap;
      if (evRaw && headline?.redWord && String(evRaw).length <= 22 && String(headline.redWord).length <= 22) {
        titleTop = stripEpPrefix(evRaw);
        titleBot = stripEpPrefix(headline.redWord);
      } else {
        const base = stripEpPrefix(evRaw || (String(seriesTitle).includes('|') ? String(seriesTitle).split('|')[0] : seriesTitle));
        [titleTop, titleBot] = splitShortTwoLines(base, 22);
      }
    }
  } else {
    const rawClipTitle = ovCfg?.title || spec.title || (String(seriesTitle).includes('|') ? String(seriesTitle).split('|')[0] : seriesTitle);
    const shortTitleBase = epNum > 1 && totalEps > 1 && headline?.topLine && headline.topLine.length <= 28
      ? headline.topLine
      : stripEpPrefix(rawClipTitle);
    const coverOk = Array.isArray(bestScene?.coverHeadline) && bestScene.coverHeadline.length >= 2
      && String(bestScene.coverHeadline[0]).length <= 22 && String(bestScene.coverHeadline[1]).length <= 22;
    if (coverOk && epNum > 1) {
      titleTop = stripEpPrefix(bestScene.coverHeadline[0]);
      titleBot = stripEpPrefix(bestScene.coverHeadline[1]);
    } else {
      [titleTop, titleBot] = splitShortTwoLines(shortTitleBase, 22);
    }
  }

  const titleRedLine = Number(ovCfg?.titleRedLine || spec.titleRedLine || bestScene?.titleRedLine || (!isEvent && (cfg.titleRedLine || cfg.TITLE_RED_LINE)) || (epNum % 2 === 1 ? 1 : 2));
  return { titleTop, titleBot, titleRedLine, subHook: '' };
}

function deriveBadgeFromScene(scene, epNum, totalEps, fallbackTitle) {
  const chapTitle = scene?.chapter
    ? stripEpPrefix(Array.isArray(scene.chapter) ? scene.chapter[1] : scene.chapter.title)
    : null;
  const card = scene?.card || scene?.hud;
  const cardTitle = card ? stripEpPrefix(Array.isArray(card.title) ? card.title[0] : card.title) : null;
  const tl = scene?.telemetry || scene?.tele;
  const cleanFallback = stripEpPrefix(String(fallbackTitle || '').split('|')[0].trim());
  const label = chapTitle || cardTitle || tl?.label || cleanFallback || 'ช็อตเด็ดห้ามพลาด!';
  return trimHeadlinePhrase(label, 28);
}

function formatFeedTitle(hookText, seriesTitle, epNum = null, totalEps = null, isEvent = false) {
  const seriesStr = String(seriesTitle || '').trim();
  const hasPipeInSeries = seriesStr.includes('|');
  const seriesName = hasPipeInSeries
    ? seriesStr.split('|').pop().trim()
    : seriesStr;
  const fallbackHook = hasPipeInSeries ? seriesStr.split('|')[0].trim() : seriesName;
  const rawHook = stripEpPrefix(String(hookText || '').split('|')[0]);
  const isPart2 = !isEvent && totalEps === 2 && epNum === totalEps;
  const maxHookChars = isPart2 ? 32 : 38;
  const trimmedHook = trimHeadlinePhrase(rawHook || fallbackHook || 'จุดหักมุมที่คุณห้ามพลาด!', maxHookChars);
  const front = isPart2 && !/ตอนจบ/.test(trimmedHook) ? `${trimmedHook} (ตอนจบ)` : trimmedHook;
  return seriesName && !front.includes(seriesName) ? `${front} | ${seriesName}` : front;
}

// Auto-slice a multi-event sitcom episode into standalone 45-60s comedic event clips
function autoPickEventArcs(scenes, maxSec = 58.0, minDur = 45.0, seriesTitle = '') {
  if (!Array.isArray(scenes) || scenes.length === 0) return [];
  const totalFull = scenes.reduce((s, sc) => s + Number(sc.dur || 0), 0);
  if (totalFull <= maxSec) {
    return [{ isSingle: true, isEvent: false, scenes: [...scenes] }];
  }

  const hasExplicitEvents = scenes.some(s => s.eventId != null || s.event != null || s.eventGroup != null);
  if (hasExplicitEvents) {
    const groups = [];
    let curKey = null;
    let curScenes = [];
    for (const sc of scenes) {
      const k = sc.eventId ?? sc.event ?? sc.eventGroup ?? curKey ?? 'ev_1';
      if (curKey !== null && k !== curKey && curScenes.length > 0) {
        groups.push({ key: curKey, scenes: curScenes });
        curScenes = [];
      }
      curKey = k;
      curScenes.push(sc);
    }
    if (curScenes.length > 0) groups.push({ key: curKey, scenes: curScenes });

    const outSpecs = [];
    for (const grp of groups) {
      let evSc = [...grp.scenes];
      let d = evSc.reduce((s, x) => s + Number(x.dur || 0), 0);
      if (d > maxSec) {
        const sliced = splitSceneListUnderMax(evSc, maxSec, Math.min(minDur, maxSec - 4), false);
        evSc = sliced[0]?.scenes || evSc.slice(0, 1);
      } else if (d < minDur) {
        let firstIdx = scenes.indexOf(evSc[0]);
        let lastIdx = scenes.indexOf(evSc[evSc.length - 1]);
        while (d < minDur && lastIdx + 1 < scenes.length && d + Number(scenes[lastIdx + 1].dur || 0) <= maxSec) {
          lastIdx++;
          evSc.push(scenes[lastIdx]);
          d += Number(scenes[lastIdx].dur || 0);
        }
        while (d < minDur && firstIdx - 1 >= 0 && d + Number(scenes[firstIdx - 1].dur || 0) <= maxSec) {
          firstIdx--;
          evSc.unshift(scenes[firstIdx]);
          d += Number(scenes[firstIdx].dur || 0);
        }
      }
      const evHost = evSc.find(s => s.eventTitle || s.shortsTitle || s.isClimax) || evSc[0];
      outSpecs.push({
        isSingle: false,
        isEvent: true,
        title: evHost?.eventTitle || (typeof evHost?.chapter === 'object' ? (Array.isArray(evHost.chapter) ? evHost.chapter[1] : evHost.chapter.title) : undefined),
        shortsTitle: evHost?.shortsTitle,
        scenes: evSc
      });
    }
    if (outSpecs.length > 0) return outSpecs;
  }

  const targetCount = clamp(Math.round(totalFull / 54), 2, Math.min(5, Math.max(2, Math.floor(scenes.length / 2))));
  const outSpecs = [];
  const usedPeaks = new Set();
  const usedTitles = new Set();
  let prevHiIdx = -1;

  for (let b = 0; b < targetCount; b++) {
    const loBound = Math.min(scenes.length - 1, Math.floor((b * scenes.length) / targetCount));
    const hiBound = Math.max(loBound + 1, Math.floor(((b + 1) * scenes.length) / targetCount));

    let peakIdx = loBound;
    let bestScore = -1;
    for (let i = loBound; i < hiBound && i < scenes.length; i++) {
      if (usedPeaks.has(i)) continue;
      const scScore = scoreSceneDramaticImpact(scenes[i], i, scenes.length) + (isCliffhangerScene(scenes[i]) ? 8 : 0);
      if (scScore > bestScore) { bestScore = scScore; peakIdx = i; }
    }
    usedPeaks.add(peakIdx);

    if (Number(scenes[peakIdx].dur || 0) > maxSec) {
      outSpecs.push({ isSingle: false, isEvent: true, scenes: [scenes[peakIdx]] });
      prevHiIdx = Math.max(prevHiIdx, peakIdx);
      continue;
    }

    let lo = peakIdx;
    let hi = peakIdx;
    let dur = Number(scenes[peakIdx].dur || 0);
    const maxForwardBeforeBack = maxSec * 0.42;
    let fwdAdded = 0;

    while (hi + 1 < scenes.length && hi + 1 < hiBound + 1 && dur + Number(scenes[hi + 1].dur || 0) <= maxSec && fwdAdded < maxForwardBeforeBack) {
      const nd = Number(scenes[hi + 1].dur || 0);
      hi++;
      dur += nd;
      fwdAdded += nd;
    }
    const softFloor = Math.max(0, prevHiIdx + 1);
    while (lo - 1 >= softFloor && dur < maxSec && dur + Number(scenes[lo - 1].dur || 0) <= maxSec) {
      lo--;
      dur += Number(scenes[lo].dur || 0);
      if (dur >= minDur && isCliffhangerScene(scenes[hi])) break;
    }
    while (dur < minDur && hi + 1 < scenes.length && dur + Number(scenes[hi + 1].dur || 0) <= maxSec) {
      hi++;
      dur += Number(scenes[hi].dur || 0);
    }
    while (dur < minDur && lo - 1 >= 0 && dur + Number(scenes[lo - 1].dur || 0) <= maxSec) {
      lo--;
      dur += Number(scenes[lo].dur || 0);
    }

    const evScenes = scenes.slice(lo, hi + 1);
    if (outSpecs.length > 0) {
      const prevSet = new Set(outSpecs[outSpecs.length - 1].scenes);
      const uniqueCount = evScenes.filter(s => !prevSet.has(s)).length;
      if (uniqueCount === 0) continue;
    }

    prevHiIdx = hi;
    const peakSc = scenes[peakIdx];
    const peakCoverStr = Array.isArray(peakSc?.coverHeadline) ? peakSc.coverHeadline.join(' ').trim() : '';
    const peakChap = peakSc?.chapter ? (Array.isArray(peakSc.chapter) ? peakSc.chapter[1] : peakSc.chapter.title) : '';
    const peakCard = peakSc?.card || peakSc?.hud;
    const peakCardTitle = peakCard ? (Array.isArray(peakCard.title) ? peakCard.title[0] : peakCard.title) : '';
    const voHook = extractCuriosityHookFromVo(peakSc?.vo);
    const voTitle = voHook ? `${voHook.topLine} ${voHook.redWord}`.trim() : '';

    let pickedTitle = peakSc?.eventTitle || peakCoverStr || peakCardTitle || peakChap || voTitle || trimHeadlinePhrase(peakSc?.vo || '', 28) || seriesTitle.split('|')[0].trim();
    if (usedTitles.has(pickedTitle) && voTitle && !usedTitles.has(voTitle)) {
      pickedTitle = voTitle;
    }
    usedTitles.add(pickedTitle);

    outSpecs.push({
      isSingle: false,
      isEvent: true,
      keySceneId: peakSc?.id,
      title: pickedTitle,
      scenes: evScenes
    });
  }

  return outSpecs;
}

function planShortsEpisodes(timeline, cfg = {}, options = {}) {
  const scenes = timeline.scenes || [];
  let maxSec = Number(options.maxSec || cfg.maxSec || cfg.maxDurationSec || 58.0);
  if (!options.allowOver60) maxSec = Math.min(maxSec, 59.5);
  const minSec = Number(options.minSec || cfg.minSec || 45.0);
  const explicitMaxEp = options.maxEp || options.maxEpisodes || cfg.maxEp || cfg.maxEpisodes || null;
  const maxEpisodes = Math.max(1, Number(explicitMaxEp || 2));
  const seriesTitle = cfg.shortTitle || cfg.title || cfg.TITLE || timeline.title || 'ซิตคอมชีวิตประจำวัน';
  const totalFull = Number(timeline.total || scenes.reduce((a, s) => a + Number(s.dur || 0), 0));

  const format = (
    options.format ||
    cfg.shortsFormat ||
    (Array.isArray(cfg.events) && cfg.events.length > 0
      ? 'events'
      : (totalFull <= maxSec ? 'single' : (explicitMaxEp ? 'two_part' : 'events')))
  ).toLowerCase();

  let rawBuckets = [];

  if (format === 'events' || format === 'all') {
    const eventSpecs = (Array.isArray(cfg.events) && cfg.events.length > 0)
      ? cfg.events.map(evSpec => ({ ...evSpec, isSingle: false, isEvent: true }))
      : autoPickEventArcs(scenes, maxSec, minSec, seriesTitle);

    for (const ev of eventSpecs) {
      const evScenes = ev.sceneIds
        ? ev.sceneIds.map(r => (typeof r === 'string' ? scenes.find(s => s.id === r) : scenes[r])).filter(Boolean)
        : (ev.scenes || []);
      const evSegs = Array.isArray(ev.segments) && ev.segments.length > 0 ? ev.segments : null;
      const startSec = evSegs ? Number(evSegs[0].start) : Number(evScenes[0]?.start || 0);
      const durSec = evSegs
        ? Number(evSegs.reduce((s, x) => s + Number(x.dur || 0), 0).toFixed(3))
        : Number(evScenes.reduce((s, x) => s + Number(x.dur || 0), 0).toFixed(3));
      rawBuckets.push({
        start: startSec,
        dur: durSec,
        scenes: evScenes,
        segments: evSegs,
        explicit: { ...ev, isEvent: ev.isSingle ? false : true }
      });
    }
  }

  if (format !== 'events') {
    if (Array.isArray(cfg.episodes) && cfg.episodes.length > 0) {
      for (const item of cfg.episodes) {
        let itemScenes = [];
        let itemSegments = null;
        let startSec = 0;
        let durSec = 0;
        if (Array.isArray(item.segments) && item.segments.length > 0) {
          itemSegments = item.segments.map(seg => {
            if (seg.sceneId != null || seg.sIdx != null) {
              const sc = seg.sIdx != null ? scenes[seg.sIdx] : scenes.find(x => x.id === seg.sceneId);
              if (!sc) return null;
              const s0 = seg.start != null ? Number(seg.start) : Number(sc.start);
              const d0 = seg.dur != null ? Number(seg.dur) : Number(sc.dur);
              if (!itemScenes.includes(sc)) itemScenes.push(sc);
              return {
                start: Number(s0.toFixed(3)),
                dur: Number(d0.toFixed(3)),
                focusX: seg.focusX != null ? Number(seg.focusX) : sc.focusX,
                sceneId: sc.id
              };
            }
            const s0 = Number(seg.start);
            const d0 = Number(seg.dur);
            const matched = scenes.filter(s => (s.start + s.dur) > s0 && s.start < (s0 + d0));
            for (const m of matched) if (!itemScenes.includes(m)) itemScenes.push(m);
            return {
              start: Number(s0.toFixed(3)),
              dur: Number(d0.toFixed(3)),
              ...(seg.focusX != null ? { focusX: Number(seg.focusX) } : {})
            };
          }).filter(Boolean);
          if (itemSegments.length > 0) {
            startSec = itemSegments[0].start;
            durSec = Number(itemSegments.reduce((sum, x) => sum + x.dur, 0).toFixed(3));
          }
        } else if (item.sStart != null && item.sEnd != null) {
          itemScenes = scenes.slice(item.sStart, item.sEnd + 1);
          startSec = itemScenes[0].start;
          const last = itemScenes[itemScenes.length - 1];
          durSec = (last.start + last.dur) - startSec;
        } else if (item.start != null && item.dur != null) {
          startSec = Number(item.start);
          durSec = Number(item.dur);
          itemScenes = scenes.filter(s => (s.start + s.dur) > startSec && s.start < (startSec + durSec));
        }
        if (!itemSegments && durSec > 60.0 && !options.allowOver60 && itemScenes.length > 0) {
          rawBuckets.push(...splitSceneListUnderMax(itemScenes, maxSec, minSec));
        } else if (durSec > 0) {
          rawBuckets.push({ start: startSec, dur: Number(durSec.toFixed(3)), scenes: itemScenes, segments: itemSegments, explicit: item });
        }
      }
    } else if (format === 'single') {
      const packed = scenes.reduce((s, sc) => s + Number(sc.dur || 0), 0) <= maxSec
        ? [{ start: scenes[0]?.start || 0, dur: Number(scenes.reduce((s, sc) => s + Number(sc.dur || 0), 0).toFixed(3)), scenes: [...scenes] }]
        : splitSceneListUnderMax(scenes, maxSec, minSec, false);
      rawBuckets.push(...condenseBucketsToMaxEpisodes(packed, scenes, 1, maxSec, minSec));
    } else {
      const hasActs = scenes.some(s => s.act != null);
      let epBuckets = [];
      let allActsFit = false;
      if (hasActs) {
        const actGroups = [];
        let curAct = scenes[0]?.act;
        let group = [];
        for (const sc of scenes) {
          if (sc.act != null && sc.act !== curAct && group.length > 0) {
            actGroups.push(group);
            group = [];
            curAct = sc.act;
          }
          group.push(sc);
        }
        if (group.length > 0) actGroups.push(group);

        allActsFit = actGroups.every(grp => grp.reduce((sum, s) => sum + Number(s.dur || 0), 0) <= maxSec);
        if (allActsFit) {
          for (const grp of actGroups) {
            epBuckets.push({
              start: grp[0].start,
              dur: Number(grp.reduce((sum, s) => sum + Number(s.dur || 0), 0).toFixed(3)),
              scenes: grp
            });
          }
        }
      }
      if (!allActsFit) {
        epBuckets = splitSceneListUnderMax(scenes, maxSec, minSec, hasActs);
      }
      rawBuckets.push(...condenseBucketsToMaxEpisodes(epBuckets, scenes, maxEpisodes, maxSec, minSec));
    }
  }

  let eventIdx = 0;
  let serialIdx = 0;
  const serialTotal = rawBuckets.filter(b => !(b.explicit && b.explicit.isEvent)).length;
  const eventTotal = rawBuckets.filter(b => b.explicit && b.explicit.isEvent).length;

  return rawBuckets.map((b) => {
    const exp = b.explicit || {};
    const isEvent = Boolean(exp.isEvent);
    const ep = isEvent ? (++eventIdx) : (++serialIdx);
    const totalGroup = isEvent ? eventTotal : serialTotal;
    const epScenes = b.scenes.length > 0 ? b.scenes : scenes;
    const winStart = Number(b.start);
    const winEnd = Number((b.start + b.dur).toFixed(3));

    let bestScene = epScenes[0];
    let bestScore = -1;
    if (exp.keySceneId) {
      const manualKey = epScenes.find(s => s.id === exp.keySceneId) || scenes.find(s => s.id === exp.keySceneId);
      if (manualKey) { bestScene = manualKey; bestScore = scoreSceneDramaticImpact(manualKey, 0, epScenes.length); }
    } else {
      epScenes.forEach((sc, i) => {
        const scScore = scoreSceneDramaticImpact(sc, i, epScenes.length);
        if (scScore > bestScore) { bestScore = scScore; bestScene = sc; }
      });
    }

    const ovCfg = Array.isArray(cfg.overlays) ? cfg.overlays.find(o => o.ep === ep && (!isEvent || o.isEvent)) : null;
    const covCfg = Array.isArray(cfg.covers) ? cfg.covers.find(c => c.ep === ep && (!isEvent || c.isEvent)) : null;
    const headline = deriveHeadlineFromScene(bestScene, ep, totalGroup, seriesTitle);
    const seriesName = cfg.seriesName || (String(seriesTitle).includes('|') ? String(seriesTitle).split('|').pop().trim() : seriesTitle);
    const isStandalone = !isEvent && totalGroup === 1;
    const isFinal = !isEvent && ep === totalGroup && totalGroup > 1;
    const tag = exp.tag || (isEvent ? `event_${String(ep).padStart(2, '0')}` : (isStandalone ? 'shorts' : `ep${ep}`));

    const { titleTop, titleBot, titleRedLine } = deriveShortsHeaderFields({
      bestScene, seriesTitle, headline, epNum: ep, totalEps: totalGroup, isEvent, isFinal, spec: exp, ovCfg, cfg
    });
    const shortClipName = `${titleTop} ${titleBot}`.trim();
    const hookCandidate = ovCfg?.hook || exp.hook || (isStandalone && String(seriesTitle).includes('|') ? String(seriesTitle).split('|')[0].trim() : shortClipName);

    return {
      ep,
      totalEps: totalGroup,
      isStandalone,
      isSingle: isStandalone,
      isEvent,
      isFinal,
      tag,
      hasRecapHook: (isEvent || ep === 1) ? true : Boolean(exp.isRecap || hasRecapCue(epScenes[0])),
      start: Number(winStart.toFixed(3)),
      dur: Number(b.dur.toFixed(3)),
      end: winEnd,
      ...(b.segments ? { segments: b.segments } : {}),
      sceneIds: epScenes.map(s => s.id),
      keySceneId: bestScene.id,
      keyView: bestScene.view,
      keyScore: bestScore,
      focusX: exp.focusX != null ? Number(exp.focusX) : (bestScene.focusX || 640),
      extractAt: covCfg?.extractAt != null ? String(covCfg.extractAt) : (exp.extractAt != null ? String(exp.extractAt) : String(pickKeyTimestampInScene(bestScene, winStart, winEnd))),
      title: ovCfg?.title || exp.title || shortClipName,
      titleTop,
      titleBot,
      titleRedLine: covCfg?.titleRedLine || titleRedLine,
      feedTitle: ovCfg?.feedTitle || exp.feedTitle || formatFeedTitle(hookCandidate, seriesName, ep, totalGroup, isEvent),
      badge: ovCfg?.badge || exp.badge || shortClipName,
      topLine: covCfg?.topLine || exp.topLine || titleTop,
      redWord: covCfg?.redWord || exp.redWord || titleBot,
      coverStamp: '',
      stampLeft: '',
      stampRight: '',
      overlayFile: ovCfg?.file || exp.overlayFile || (isStandalone ? 'overlay_shorts.png' : `overlay_${tag}.png`),
      coverFile: covCfg?.file || exp.coverFile || (isStandalone ? 'cover_shorts.png' : `cover_${tag}.png`),
      outFileName: exp.outFileName || exp.outFile || (isStandalone ? 'master_hf_shorts.mp4' : (isEvent ? `master_hf_${tag}.mp4` : `master_hf_ep${ep}_shorts.mp4`)),
      ...(exp.outFile ? { outFile: exp.outFile } : {})
    };
  });
}

function pickTopLongFormHighlights(scenes, count = 5) {
  if (!scenes || scenes.length === 0) return { showdownScene: null, panels: [] };

  // Pick Showdown scene from middle-to-climax (last 65%), plus Scene 0 when marked as 3s Peak Cold Open (isClimax: true)
  const startSearch = Math.min(scenes.length - 1, Math.floor(scenes.length * 0.35));
  const candidateIndices = scenes[0]?.isClimax && startSearch > 0 ? [0] : [];
  for (let i = startSearch; i < scenes.length; i++) candidateIndices.push(i);
  let showdownScene = scenes[scenes.length - 1];
  let bestShowdownScore = -1;
  for (const i of candidateIndices) {
    const s = scenes[i];
    const score = scoreSceneDramaticImpact(s, i, scenes.length) + ((s.telemetry?.distance || s.tele?.distance) ? 15 : 0);
    if (score > bestShowdownScore) {
      bestShowdownScore = score;
      showdownScene = s;
    }
  }

  // Pick 5 visually distinct dramatic scenes across 5 story progression bands
  const usedViews = new Set();
  const panels = [];
  for (let b = 0; b < count; b++) {
    const lo = Math.floor((b * scenes.length) / count);
    const hi = Math.max(lo + 1, Math.floor(((b + 1) * scenes.length) / count));
    let best = scenes[lo];
    let bestScore = -999;
    for (let i = lo; i < hi && i < scenes.length; i++) {
      const sc = scenes[i];
      const dupPenalty = usedViews.has(sc.view) ? -30 : 0;
      const scScore = scoreSceneDramaticImpact(sc, i - lo, hi - lo) + dupPenalty;
      if (scScore > bestScore) {
        bestScore = scScore;
        best = sc;
      }
    }
    usedViews.add(best.view);
    const absAt = pickKeyTimestampInScene(best);
    const chap = best.chapter ? (Array.isArray(best.chapter) ? best.chapter[1] : best.chapter.title) : null;
    const card = best.card || best.hud;
    const cardTxt = card ? (Array.isArray(card.title) ? card.title[0] : card.title) : null;
    panels.push({
      num: String(b + 1),
      label: chap || cardTxt || best.view,
      view: best.view,
      lt: Number(Math.max(0.5, absAt - (best.start || 0)).toFixed(2)),
      focusX: best.focusX || 640
    });
  }

  return { showdownScene, panels };
}

function saveShortsPlan(projectDir, plan) {
  const shortsDir = path.join(projectDir, 'shorts');
  fs.mkdirSync(shortsDir, { recursive: true });
  const planPath = path.join(shortsDir, 'shorts_plan.json');
  fs.writeFileSync(planPath, JSON.stringify({ maxDurationSec: 58, count: plan.length, episodes: plan }, null, 2));
  return planPath;
}

module.exports = {
  scoreSceneDramaticImpact,
  pickKeyTimestampInScene,
  autoPickEventArcs,
  planShortsEpisodes,
  pickTopLongFormHighlights,
  formatFeedTitle,
  splitShortTwoLines,
  stripEpPrefix,
  hasRecapCue,
  saveShortsPlan
};
