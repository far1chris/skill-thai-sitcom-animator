// =============================================================================
//  Thai Adult Sitcom & Everyday Social Comedy 2.5D Core Engine
//  Part of skill: thai-sitcom-animator
//  Visual Style: Clean dark ink outlines (#18181B), flat warm colors + 1-step cel shade,
//  signature half-lidded sitcom eyes, recurring CAST roster, bicycle & everyday props,
//  and Thai social media / comedy HUD cards.
//  Human Proportion Ratio 1:6.5 (Athletic / casual build with continuous trapezius slope)
// =============================================================================
const W = 1280, H = 720, TAU = Math.PI * 2;
const SHORTS_W = 1080, SHORTS_H = 1920;
const SHORTS_SX = 1.50, SHORTS_SY = SHORTS_H / H; // 1.50x horizontal (720px visible width), 2.6667x vertical (full 0..1920 height)
const SHORTS_CHAR_SCALE = 1.85;
let _inShortsWorld = false;
let _inShortsRig = false;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k = clamp(k), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const easeBack = k => { k = clamp(k); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const prog = (t, a, b) => clamp((t - a) / (b - a));
const FONT = "'Kanit','Leelawadee UI','Tahoma',sans-serif";
const F_MONO = "'JetBrains Mono','Kanit',monospace";
const INK_OUTLINE = '#18181B';

function isShortsMode() {
  return typeof window !== 'undefined' && Boolean(window.SHORTS_MODE);
}
function beginShortsWorld(c, s) {
  if (!isShortsMode()) return false;
  const rawFx = (typeof window !== 'undefined' && typeof window.__SHORTS_FOCUS_X === 'number')
    ? window.__SHORTS_FOCUS_X
    : (s && typeof s.focusX === 'number' ? s.focusX : W / 2);
  const halfVisW = (SHORTS_W / SHORTS_SX) / 2; // 360px
  const fx = clamp(rawFx, halfVisW, W - halfVisW);
  c.save();
  c.translate(SHORTS_W / 2, 0);
  c.scale(SHORTS_SX, SHORTS_SY);
  c.translate(-fx, 0);
  _inShortsWorld = true;
  return true;
}
function endShortsWorld(c, active) {
  if (!active) return;
  _inShortsWorld = false;
  c.restore();
}
function applyShortsRigComp(c) {
  if (!_inShortsWorld || _inShortsRig) return false;
  c.scale(SHORTS_CHAR_SCALE / SHORTS_SX, SHORTS_CHAR_SCALE / SHORTS_SY);
  _inShortsRig = true;
  return true;
}
function endShortsRigComp(applied) {
  if (applied) _inShortsRig = false;
}

function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mix(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})`; }
function rgba(h, a) { const A = hex2rgb(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function inkrr(c, x, y, w, h, r, fillCol, strokeW = 2.6, strokeCol = INK_OUTLINE) {
  rr(c, x, y, w, h, r);
  if (fillCol) { c.fillStyle = fillCol; c.fill(); }
  if (strokeW > 0) { c.strokeStyle = strokeCol; c.lineWidth = strokeW; c.lineJoin = 'round'; c.stroke(); }
}
function cyl(c, x, w, base, hi, sh) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, base); g.addColorStop(0.35, hi || base); g.addColorStop(1, sh || base); return g;
}
function limb(c, x1, y1, x2, y2, w, col, sh, outlineW = 2.6) {
  c.lineCap = 'round';
  if (outlineW > 0) {
    c.strokeStyle = INK_OUTLINE; c.lineWidth = w + outlineW * 2;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  if (sh) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w * 0.26, ny = dx / L * w * 0.26;
    c.strokeStyle = sh; c.lineWidth = w * 0.34; c.beginPath(); c.moveTo(x1 + nx, y1 + ny); c.lineTo(x2 + nx, y2 + ny); c.stroke();
  }
}

// Analytical 2-bone Inverse Kinematics solver (bendSign: -1 pushes knee forward/+x, +1 drops elbow naturally)
function solveIK2(x0, y0, tx, ty, L1, L2, bendSign = 1) {
  const dx = tx - x0, dy = ty - y0;
  const rawD = Math.hypot(dx, dy) || 0.001;
  const d = clamp(rawD, Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.25);
  const baseAng = Math.atan2(dy, dx);
  const cosA = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
  const ang = baseAng + bendSign * Math.acos(cosA);
  return [x0 + L1 * Math.cos(ang), y0 + L1 * Math.sin(ang)];
}

function drawSegHighlight(c, x1, y1, x2, y2, w, sh) {
  if (!sh) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * w * 0.26, ny = (dx / L) * w * 0.26;
  c.strokeStyle = sh; c.lineWidth = w * 0.34; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1 + nx, y1 + ny); c.lineTo(x2 + nx, y2 + ny); c.stroke();
}

// Seamless 2-segment leg: fused outer ink contour first, flat denim fill second (no U-ring across knee)
function drawJointedLeg(c, hx, hy, kx, ky, ax, ay, K, thin = 1, isBack = false, shoeAngle = 0) {
  const col = isBack ? mix(K.pants, '#000000', 0.18) : K.pants;
  const sh = isBack ? null : K.pantsSh;
  const w1 = 16.5 * thin, w2 = 14.5 * thin, ow = 2.6;
  c.lineCap = 'round'; c.lineJoin = 'round';
  // Pass 1: fused outline
  c.strokeStyle = INK_OUTLINE;
  c.lineWidth = w1 + ow * 2; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.stroke();
  c.lineWidth = w2 + ow * 2; c.beginPath(); c.moveTo(kx, ky); c.lineTo(ax, ay); c.stroke();
  // Pass 2: seamless denim fill + highlight
  c.strokeStyle = col;
  c.lineWidth = w1; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.stroke();
  c.lineWidth = w2; c.beginPath(); c.moveTo(kx, ky); c.lineTo(ax, ay); c.stroke();
  drawSegHighlight(c, hx, hy, kx, ky, w1, sh);
  drawSegHighlight(c, kx, ky, ax, ay, w2, sh);
  // Rolled denim cuff aligned perpendicular to shin right above sneaker
  const sdx = ax - kx, sdy = ay - ky, sL = Math.hypot(sdx, sdy) || 1;
  const ux = sdx / sL, uy = sdy / sL;
  c.save(); c.translate(ax - ux * 6.5, ay - uy * 6.5); c.rotate(Math.atan2(sdy, sdx) - Math.PI / 2);
  inkrr(c, -9, -4, 18, 8, 3, isBack ? mix(K.cuff || '#7BA3C7', '#000000', 0.14) : (K.cuff || '#7BA3C7'), 2.2);
  c.restore();
  // Sneaker with sole & laces
  c.save(); c.translate(ax, ay); c.rotate(shoeAngle);
  inkrr(c, -8, -4, 26, 11, 5, isBack ? mix(K.shoe, '#000000', 0.14) : K.shoe, 2.5);
  c.fillStyle = K.shoeSole || '#D6CFC2'; c.fillRect(-7, 4, 24, 3);
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(4, -3); c.lineTo(7, -1); c.moveTo(9, -3); c.lineTo(12, -1); c.stroke();
  c.restore();
}

// Seamless 2-segment arm with rolled shirt cuff cleanly below elbow (no ring across elbow crease)
function drawJointedArm(c, sx, sy, ex, ey, wx, wy, K, shirtCol, thin = 1, isBack = false) {
  const skinCol = isBack ? mix(K.skin, '#000000', 0.12) : K.skin;
  const skinSh = isBack ? null : K.skinSh;
  const shirtSh = isBack ? null : K.shirtSh;
  const wU = 14 * thin, wL = 11 * thin;
  const cuffFrac = 0.18;
  const cx = ex + (wx - ex) * cuffFrac, cy = ey + (wy - ey) * cuffFrac;
  c.lineCap = 'round'; c.lineJoin = 'round';
  // Pass 1: fused outline
  c.strokeStyle = INK_OUTLINE;
  c.lineWidth = wU + 5.2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(cx, cy); c.stroke();
  c.lineWidth = wL + 5.0; c.beginPath(); c.moveTo(cx, cy); c.lineTo(wx, wy); c.stroke();
  // Pass 2: forearm skin then continuous rolled shirt sleeve over elbow
  c.strokeStyle = skinCol; c.lineWidth = wL;
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(wx, wy); c.stroke();
  drawSegHighlight(c, cx, cy, wx, wy, wL, skinSh);
  c.strokeStyle = shirtCol; c.lineWidth = wU;
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(cx, cy); c.stroke();
  drawSegHighlight(c, sx, sy, ex, ey, wU, shirtSh);
  // Rolled sleeve cuff perpendicular to forearm
  c.save(); c.translate(cx, cy); c.rotate(Math.atan2(wy - ey, wx - ex) - Math.PI / 2);
  inkrr(c, -8.5 * thin, -4.5, 17 * thin, 9, 4, shirtCol, 2.3);
  c.restore();
  // Hand with ink outline
  c.fillStyle = skinCol; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.4;
  c.beginPath(); c.arc(wx, wy, 6.8, 0, TAU); c.fill(); c.stroke();
  return [wx, wy];
}
function txt(c, s, x, y, size, col, weight = 700, align = 'left', base = 'alphabetic') {
  c.font = `${weight} ${size}px ${FONT}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y);
}
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

// Offscreen Gaussian blur buffer (depth-of-field & HUD rack-focus)
const _tmp = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (_tmp) { _tmp.width = W; _tmp.height = H; }
const _tc = _tmp ? _tmp.getContext('2d') : null;
function blurLayer(c, px, fn, extra = '') {
  if (!_tc) { fn(c); return; }
  const wasShortsWorld = _inShortsWorld;
  _inShortsWorld = false;
  _tc.setTransform(1, 0, 0, 1, 0, 0); _tc.clearRect(0, 0, W, H); fn(_tc);
  _inShortsWorld = wasShortsWorld;
  c.save();
  if (!wasShortsWorld) c.setTransform(1, 0, 0, 1, 0, 0);
  c.filter = `blur(${px}px) ${extra}`; c.drawImage(_tmp, 0, 0); c.restore();
}
function flick(i, t, rate = 1) {
  const a = hash(i * 13.1 + Math.floor(t * 14 * rate));
  const bad = hash(i * 7.7) > 0.78;
  return bad ? (a > 0.55 ? 1 : a > 0.3 ? 0.35 : 0.08) : (a > 0.985 ? 0.4 : 1);
}

// Dynamic Sitcom Camera Motion Rig: gentle push-in, punchline snap-zoom, pan, impact shake
function cameraRig(c, lt, dur, o = {}, drawFn = null) {
  const safeDur = Math.max(0.5, Number(dur) || 5);
  const k = clamp(lt / safeDur);
  const fx = o.focusX !== undefined ? o.focusX : W / 2;
  const fy = o.focusY !== undefined ? o.focusY : H / 2;
  const zFrom = o.zoomFrom !== undefined ? o.zoomFrom : (o.handheld ? 1.012 : 1.0);
  const zTo = o.zoomTo !== undefined ? o.zoomTo : (o.push === false ? zFrom : 1.04);
  let scale = lerp(zFrom, zTo, ease(k));
  if (o.snapAt !== undefined) {
    const snapK = easeOut(prog(lt, o.snapAt, o.snapAt + (o.snapDur || 0.12)));
    scale *= 1 + ((o.snapScale || 1.16) - 1) * snapK;
  }
  let tx = (o.panX || 0) * k;
  let ty = (o.panY || 0) * k;
  let rot = 0;
  if (o.handheld) {
    const amp = o.handheldAmp !== undefined ? o.handheldAmp : 1.0;
    tx += Math.sin(lt * 1.9) * 1.8 * amp;
    ty += Math.cos(lt * 1.5) * 1.5 * amp;
    rot += Math.sin(lt * 1.3) * 0.0018 * amp;
  }
  if (o.shakeAt !== undefined && lt >= o.shakeAt) {
    const dt = lt - o.shakeAt;
    const shDur = o.shakeDur || 0.30;
    if (dt <= shDur) {
      const decay = Math.pow(1 - dt / shDur, 2) * (o.shakeAmp || 8);
      tx += Math.sin(dt * 95) * decay;
      ty += Math.cos(dt * 115) * decay * 0.8;
      rot += Math.sin(dt * 80) * 0.008 * (1 - dt / shDur);
    }
  }
  const apply = () => {
    c.translate(fx + tx, fy + ty);
    if (rot) c.rotate(rot);
    c.scale(scale, scale);
    c.translate(-fx, -fy);
  };
  if (typeof drawFn === 'function') {
    c.save();
    apply();
    drawFn();
    c.restore();
  } else {
    apply();
  }
}

// ----------------------------------------------------------------- POSES (2-Segment FK)
function poseWalk(t, speed = 1.6, amp = 0.42) {
  const p = t * TAU * speed * 0.5;
  return {
    by: -Math.abs(Math.sin(p)) * 3, lean: 0.03,
    legs: [
      { a: amp * Math.sin(p), b: Math.max(0, -Math.sin(p + 0.9)) * 0.7 },
      { a: -amp * Math.sin(p), b: Math.max(0, Math.sin(p + 0.9)) * 0.7 }
    ],
    arms: [
      { a: -amp * 0.8 * Math.sin(p), b: 0.25 },
      { a: amp * 0.8 * Math.sin(p), b: 0.25 }
    ],
    tilt: 0
  };
}
function poseStand(t, o = {}) {
  const br = Math.sin(t * 2.2) * 1.2;
  return {
    by: br * 0.4, lean: o.lean || 0,
    legs: o.legs || [{ a: 0.05, b: 0 }, { a: -0.05, b: 0 }],
    arms: o.arms || [{ a: 0.08, b: 0.1 }, { a: -0.08, b: 0.1 }],
    tilt: o.tilt || 0
  };
}
function clampSitArms(arms, defArms, raw = false) {
  if (!arms) return defArms;
  if (raw) return arms;
  return arms.map((A, i) => {
    const d = defArms[i] || defArms[0];
    if (!A || typeof A.a !== 'number') return d;
    let a = A.a, b = typeof A.b === 'number' ? A.b : d.b;
    if (a > 0.62) a = 0.28 + Math.min(0.34, (a - 0.62) * 0.32);
    if (a + b > 1.36) b = Math.max(0.25, 1.32 - a);
    if (a + b < 0.45) b = 0.55 - a;
    return { a, b };
  });
}
function poseKneel(t, o = {}) {
  const defArms = [{ a: 0.36, b: 0.76 }, { a: 0.24, b: 0.72 }];
  return {
    by: o.by !== undefined ? o.by : 58,
    lean: o.lean !== undefined ? o.lean : 0.16,
    legs: o.legs || [{ a: 1.78, b: 1.56 }, { a: 0.72, b: 2.24 }],
    arms: clampSitArms(o.arms, defArms, o.rawArms),
    tilt: o.tilt !== undefined ? o.tilt : 0.08
  };
}
function poseFloorSit(t, o = {}) {
  const breathe = Math.sin(t * 2.0) * 0.012;
  const defArms = [{ a: 0.28, b: 0.78 }, { a: 0.20, b: 0.74 }];
  return {
    by: o.by !== undefined ? o.by : 72,
    lean: (o.lean !== undefined ? o.lean : 0.06) + breathe,
    legs: o.legs || [{ a: 1.32, b: 2.72 }, { a: 1.22, b: 2.66 }],
    arms: clampSitArms(o.arms, defArms, o.rawArms),
    tilt: o.tilt || 0
  };
}
function poseSit(t, o = {}) {
  if (o.floor) return poseFloorSit(t, o);
  const isCurb = Boolean(o.curb || o.low);
  const breathe = Math.sin(t * 2.0) * 0.012;
  const defArms = isCurb
    ? [{ a: 0.32, b: 0.78 }, { a: 0.22, b: 0.74 }]
    : [{ a: 0.26, b: 0.84 }, { a: 0.18, b: 0.80 }];
  return {
    by: o.by !== undefined ? o.by : (isCurb ? 54 : 34),
    lean: o.lean !== undefined ? o.lean : ((isCurb ? 0.08 : 0.02) + breathe),
    legs: o.legs || (isCurb
      ? [{ a: 1.72, b: 1.58 }, { a: 1.64, b: 1.50 }]
      : [{ a: 1.38, b: 1.34 }, { a: 1.30, b: 1.26 }]),
    arms: clampSitArms(o.arms, defArms, o.rawArms),
    tilt: o.tilt || 0
  };
}
function poseSquat(t, o = {}) {
  const defArms = [{ a: 0.42, b: 0.68 }, { a: 0.32, b: 0.66 }];
  return {
    by: o.by !== undefined ? o.by : 64,
    lean: o.lean !== undefined ? o.lean : 0.18,
    legs: o.legs || [{ a: 2.02, b: 2.38 }, { a: 1.94, b: 2.30 }],
    arms: clampSitArms(o.arms, defArms, o.rawArms),
    tilt: o.tilt || 0
  };
}
function posePanic(t, o = {}) {
  const jitter = Math.sin((t || 0) * 24) * 1.5;
  return {
    by: (o.by || 0) + jitter,
    lean: o.lean !== undefined ? o.lean : -0.08,
    legs: o.legs || [{ a: 0.06, b: 0 }, { a: -0.06, b: 0 }],
    arms: o.arms || [{ a: 2.38, b: -0.62 }, { a: 1.98, b: -0.48 }],
    tilt: o.tilt !== undefined ? o.tilt : -0.06
  };
}
function poseFacepalm(t, o = {}) {
  const sigh = Math.sin((t || 0) * 2.5) * 0.015;
  return {
    by: o.by || 0,
    lean: (o.lean !== undefined ? o.lean : 0.06) + sigh,
    legs: o.legs || [{ a: 0.04, b: 0 }, { a: -0.04, b: 0 }],
    arms: o.arms || [{ a: 1.95, b: 1.12 }, { a: 0.18, b: 0.35 }],
    tilt: o.tilt !== undefined ? o.tilt : 0.14
  };
}
function posePoint(t, o = {}) {
  return {
    by: o.by || 0,
    lean: o.lean !== undefined ? o.lean : 0.06,
    legs: o.legs || [{ a: 0.06, b: 0 }, { a: -0.06, b: 0 }],
    arms: o.arms || [{ a: 1.38, b: 0.18 }, { a: 0.22, b: 0.55 }],
    tilt: o.tilt || 0
  };
}
function poseBike(t, speed = 1.6) {
  const p = t * TAU * speed;
  return {
    by: Math.sin(p * 2) * 1.2, lean: 0.12,
    legs: [
      { a: 0.56 + 0.34 * Math.sin(p), b: Math.max(0.32, 0.96 + 0.38 * Math.cos(p)) },
      { a: 0.56 - 0.34 * Math.sin(p), b: Math.max(0.32, 0.96 - 0.38 * Math.cos(p)) }
    ],
    arms: [
      { a: 0.72, b: 0.55 },
      { a: 0.68, b: 0.50 }
    ],
    tilt: -0.06
  };
}

// --------------------------------------------------------- RECURRING SITCOM CAST ROSTER (1:6.5 Ratio)
const PROTAGONIST = {
  name: 'ต้น',
  skin: '#E6AF82', skinHi: '#F0C097', skinSh: '#C98E60',
  shirt: '#F3EDE0', shirtHi: '#FAF6EE', shirtSh: '#DED5C3',
  pants: '#4B79A1', pantsSh: '#385E80', cuff: '#7BA3C7',
  shoe: '#F5F2EB', shoeSole: '#D6CFC2',
  hair: '#3A2618', hairStyle: 'messy',
  eyelid: 0.42
};
const TON = PROTAGONIST;

const CAST = {
  ek: PROTAGONIST,
  ton: PROTAGONIST,
  fah: {
    name: 'น้องฟ้า',
    skin: '#ECC09B', skinHi: '#F5CFAF', skinSh: '#CFA07A',
    shirt: '#FDE68A', shirtHi: '#FEF3C7', shirtSh: '#F59E0B',
    pants: '#334155', pantsSh: '#1E293B', cuff: '#475569',
    shoe: '#FAF6EE', shoeSole: '#CBD5E1',
    hair: '#271911', hairStyle: 'bob',
    eyelid: 0.28
  },
  mom: {
    name: 'แม่',
    skin: '#E6AF82', skinHi: '#F0C097', skinSh: '#C98E60',
    shirt: '#E9D5FF', shirtHi: '#F3E8FF', shirtSh: '#C084FC',
    pants: '#334155', pantsSh: '#1E293B', cuff: '#475569',
    shoe: '#F5F2EB', shoeSole: '#D6CFC2',
    hair: '#292524', hairStyle: 'bun',
    eyelid: 0.44
  },
  doctor: {
    name: 'หมอฟัน',
    skin: '#E6AF82', skinHi: '#F0C097', skinSh: '#C98E60',
    shirt: '#FFFFFF', shirtHi: '#F8FAFC', shirtSh: '#CBD5E1',
    pants: '#0F766E', pantsSh: '#115E59', cuff: '#14B8A6',
    shoe: '#F8FAFC', shoeSole: '#CBD5E1',
    hair: '#1E293B', hairStyle: 'parted',
    eyelid: 0.48
  },
  pa_auntie: {
    name: 'ป้าตามสั่ง',
    skin: '#D6996B', skinHi: '#E6AF82', skinSh: '#B87B4E',
    shirt: '#2DD4BF', shirtHi: '#5EEAD4', shirtSh: '#0D9488',
    apron: '#EA580C',
    pants: '#3F3F46', pantsSh: '#27272A', cuff: '#52525B',
    shoe: '#FAF6EE', shoeSole: '#CBD5E1',
    hair: '#292524', hairStyle: 'bun',
    eyelid: 0.36
  },
  boss: {
    name: 'พี่บอส',
    skin: '#DDA172', skinHi: '#E8B48B', skinSh: '#BA7E50',
    shirt: '#DBEAFE', shirtHi: '#EFF6FF', shirtSh: '#93C5FD',
    pants: '#1E293B', pantsSh: '#0F172A', cuff: '#334155',
    shoe: '#27272A', shoeSole: '#18181B',
    hair: '#1F1B18', hairStyle: 'parted',
    tie: '#DC2626', glasses: true,
    eyelid: 0.48
  },
  barista: {
    name: 'บาริสต้าเจ',
    skin: '#E6AF82', skinHi: '#F0C097', skinSh: '#C98E60',
    shirt: '#FFFFFF', shirtHi: '#F8FAFC', shirtSh: '#E2E8F0',
    apron: '#2E5A44',
    pants: '#27272A', pantsSh: '#18181B', cuff: '#3F3F46',
    shoe: '#F5F2EB', shoeSole: '#D6CFC2',
    hair: '#2A1D15', hairStyle: 'beanie', beanieCol: '#B45309',
    eyelid: 0.45
  },
  rider: {
    name: 'พี่ไรเดอร์',
    skin: '#D08B5B', skinHi: '#DF9E70', skinSh: '#AD6D40',
    shirt: '#22C55E', shirtHi: '#4ADE80', shirtSh: '#15803D',
    pants: '#3B6998', pantsSh: '#2B4C6F', cuff: '#6088B0',
    shoe: '#F5F2EB', shoeSole: '#D6CFC2',
    hair: '#1C1917', hairStyle: 'messy',
    eyelid: 0.38
  }
};

// Semantic prop helpers
function drawPlasticBagsProp(c, x, y, s = 1, full = true) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-2, 0); c.lineTo(-10, 16); c.moveTo(2, 0); c.lineTo(10, 16); c.stroke();
  if (full) {
    inkrr(c, -18, 8, 18, 24, 4, '#EF4444', 2.0);
    inkrr(c, 1, 5, 18, 26, 4, '#FACC15', 2.0);
    inkrr(c, -6, 2, 16, 20, 4, '#22C55E', 2.0);
  }
  inkrr(c, -22, 16, 44, 44, 8, '#F8FAFC', 2.5);
  c.fillStyle = '#15803D'; c.fillRect(-20, 26, 40, 6);
  c.fillStyle = '#EA580C'; c.fillRect(-20, 32, 40, 4);
  c.fillStyle = '#DC2626'; c.fillRect(-20, 36, 40, 4);
  c.restore();
}

function drawMarketBagsCluster(c, x, y, s = 1, count = 5, colors = null) {
  const cols = colors || ['#F97316', '#EC4899', '#22C55E', '#FACC15', '#38BDF8'];
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < count; i++) {
    const ox = (i - (count - 1) / 2) * 10;
    const oy = (i % 2) * 5;
    const bgCol = cols[i % cols.length];
    c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-2, 0); c.quadraticCurveTo(ox - 6, 8, ox - 8, 18 + oy);
    c.moveTo(2, 0); c.quadraticCurveTo(ox + 6, 8, ox + 8, 18 + oy);
    c.stroke();
    inkrr(c, ox - 14, 16 + oy, 28, 34, 8, bgCol, 2.3);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(ox - 9, 22 + oy, 18, 8);
  }
  c.restore();
}

function drawReceiptProp(c, x, y, s = 1, totalStr = '384.-', len = 64) {
  c.save(); c.translate(x, y); c.scale(s, s);
  inkrr(c, -2, -4, 24, len, 2, '#FFFDF9', 2.2);
  c.fillStyle = '#94A3B8';
  for (let ry = 4; ry < len - 18; ry += 6) c.fillRect(2, ry, 16, 2.2);
  const inv = c.getTransform().a < 0 ? -1 : 1;
  c.save(); c.translate(10, len - 10); c.scale(inv, 1);
  txt(c, totalStr, 0, 0, 8.5, '#DC2626', 900, 'center');
  c.restore();
  c.restore();
}

function drawCreditCardProp(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  inkrr(c, -4, -12, 34, 22, 4, '#1D4ED8', 2.3);
  inkrr(c, 2, -6, 8, 6, 1.5, '#FACC15', 1.5);
  c.fillStyle = '#93C5FD'; c.fillRect(14, 2, 12, 3);
  c.restore();
}

function drawCash50Prop(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  inkrr(c, -2, -10, 32, 16, 3, '#38BDF8', 2.2);
  const inv = c.getTransform().a < 0 ? -1 : 1;
  c.save(); c.translate(14, 2); c.scale(inv, 1);
  txt(c, '50', 0, 0, 10, '#0F172A', 900, 'center');
  c.restore();
  c.restore();
}

// Semantic prop helpers
function drawIcedCoffeeCup(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // Green straw
  c.strokeStyle = '#15803D'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -14); c.lineTo(5, -34); c.stroke();
  // Clear cup + iced coffee + cardboard sleeve
  inkrr(c, -10, -16, 20, 28, 4, '#D97706', 2.4);
  inkrr(c, -11, -8, 22, 11, 2, '#C89D66', 2.2);
  // Dome lid
  c.fillStyle = 'rgba(255,255,255,0.78)'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
  c.beginPath(); c.arc(0, -16, 10, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
  c.restore();
}

function drawSmartphoneProp(c, x, y, s = 1, glowScreen = true) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (glowScreen) glow(c, 4, -8, 28, '#38BDF8', 0.35);
  inkrr(c, -8, -18, 16, 28, 4, '#1E293B', 2.4);
  c.fillStyle = '#38BDF8'; rr(c, -5, -14, 10, 20, 2); c.fill();
  c.restore();
}

function drawSitcomUpperBody(c, K, o, P, thin = 1) {
  const by = P.by || 0, torsoH = 58;
  // Torso (with continuous trapezius slope & button-up shirt details)
  inkrr(c, -22 * thin, -152 + by, 44 * thin, torsoH, 12, cyl(c, -22 * thin, 44 * thin, K.shirt, K.shirtHi, K.shirtSh), 2.7);
  // Seated pelvis bridge (only needed when astride a saddle so front/rear leg angle meets smoothly)
  if (P.seatedBridge) {
    c.fillStyle = K.pants;
    rr(c, -20.5 * thin, -96 + by, 41 * thin, 11, 4); c.fill();
    c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-20.5 * thin, -96 + by); c.lineTo(-20.5 * thin, -88 + by); c.stroke();
    c.beginPath(); c.moveTo(20.5 * thin, -96 + by); c.lineTo(20.5 * thin, -88 + by); c.stroke();
  }
  // Café apron if barista
  if (K.apron || o.apron) {
    inkrr(c, -18 * thin, -138 + by, 36 * thin, 48, 6, K.apron || '#2E5A44', 2.4);
  }
  // Clean black belt (only show front buckle when facing front)
  inkrr(c, -21.5 * thin, -99.5 + by, 43 * thin, 6.5, 3, '#27272A', 2.4);
  if (!o.back) {
    c.fillStyle = '#D4D4D8'; c.fillRect(2 * thin, -98.5 + by, 5, 4.5);
  }
  // Neck & Shirt Collar + Placket Buttons
  inkrr(c, -6.5, -163 + by, 13, 15, 4, K.skin, 2.4);
  if (o.back) {
    // Back-of-shirt neck trim & subtle upper-back shoulder yoke seam (no front collar flaps/buttons)
    c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.0;
    c.beginPath(); c.moveTo(-9, -152 + by); c.quadraticCurveTo(0, -148 + by, 9, -152 + by); c.stroke();
    c.strokeStyle = rgba(K.shirtSh || '#CBD5E1', 0.8); c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(-19 * thin, -138 + by); c.lineTo(19 * thin, -138 + by); c.stroke();
  } else {
    // Collar flaps
    c.fillStyle = K.shirtHi || K.shirt; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-7, -153 + by); c.lineTo(-14, -141 + by); c.lineTo(-2, -143 + by); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(7, -153 + by); c.lineTo(14, -141 + by); c.lineTo(2, -143 + by); c.closePath(); c.fill(); c.stroke();
    // Vertical placket line & buttons
    c.beginPath(); c.moveTo(2, -143 + by); c.lineTo(2, -99 + by); c.stroke();
    if (K.tie) {
      c.fillStyle = K.tie; c.beginPath(); c.moveTo(0, -143 + by); c.lineTo(-5, -112 + by); c.lineTo(0, -104 + by); c.lineTo(5, -112 + by); c.closePath(); c.fill(); c.stroke();
    } else {
      c.fillStyle = INK_OUTLINE;
      for (const byBtn of [-132, -120, -108]) { c.beginPath(); c.arc(5, byBtn + by, 1.6, 0, TAU); c.fill(); }
    }
  }

  // Head (Adult Cartoon Sitcom Style — half-lidded oval eyes, C-ear, expressive brows)
  c.save(); c.translate(0, -192 + by); c.rotate(P.tilt || 0);
  // C-shaped Ear on back side of head
  inkrr(c, -31, -8, 12, 16, 6, K.skin, 2.4);
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 1.8;
  c.beginPath(); c.arc(-26, 0, 3.2, 0.4 * Math.PI, 1.5 * Math.PI); c.stroke();

  // Head contour
  inkrr(c, -25, -34, 50, 64, 21, cyl(c, -25, 50, K.skin, K.skinHi, K.skinSh), 2.7);

  // Hair styles
  c.fillStyle = K.hair; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.6; c.lineJoin = 'round';
  if (o.back) {
    inkrr(c, -27, -37, 54, 54, [22, 22, 14, 14], K.hair, 2.6);
  } else {
    if (K.hairStyle === 'bob') {
      c.beginPath();
      c.moveTo(-27, 14); c.lineTo(-29, -18);
      c.quadraticCurveTo(-26, -42, 0, -41);
      c.quadraticCurveTo(27, -41, 28, -14);
      c.lineTo(26, 12); c.lineTo(20, -16); c.lineTo(-18, -18); c.closePath();
      c.fill(); c.stroke();
    } else if (K.hairStyle === 'bun') {
      // Warm mom/auntie bun at back + parted front sweep
      c.beginPath(); c.arc(-24, -18, 12, 0, TAU); c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(-26, -4); c.quadraticCurveTo(-28, -36, 0, -39);
      c.quadraticCurveTo(26, -38, 26, -14);
      c.lineTo(19, -18); c.quadraticCurveTo(2, -26, -18, -14); c.closePath();
      c.fill(); c.stroke();
    } else if (K.hairStyle === 'beanie') {
      inkrr(c, -27, -42, 54, 24, [20, 20, 5, 5], K.beanieCol || '#B45309', 2.6);
      inkrr(c, -28, -24, 56, 8, 4, mix(K.beanieCol || '#B45309', '#000000', 0.2), 2.4);
    } else {
      // Tousled messy sitcom hair with spiky tufts (exact match to 7-Eleven ending!)
      c.beginPath();
      c.moveTo(-25, -6);
      c.lineTo(-28, -22);
      c.lineTo(-22, -33);
      c.lineTo(-26, -38);
      c.lineTo(-14, -39);
      c.lineTo(-10, -44);
      c.lineTo(2, -40);
      c.lineTo(14, -43);
      c.lineTo(18, -37);
      c.lineTo(27, -33);
      c.lineTo(26, -15);
      c.lineTo(21, -12);
      c.lineTo(16, -21);
      c.lineTo(8, -16);
      c.lineTo(2, -22);
      c.lineTo(-6, -16);
      c.lineTo(-14, -22);
      c.lineTo(-19, -14);
      c.closePath();
      c.fill(); c.stroke();
    }

    if (o.headMirror) {
      c.strokeStyle = '#64748B'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-25, -24); c.lineTo(25, -24); c.stroke();
      c.fillStyle = '#E2E8F0'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
      c.beginPath(); c.arc(8, -25, 10, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(10, -27, 4, 0, TAU); c.fill();
    }

    let activeExpr = o.expr || 'chill';
    let activeSweat = Boolean(o.sweat);
    if (o.exprAt != null && o.t != null) {
      if (Array.isArray(o.exprAt)) {
        for (const step of o.exprAt) {
          const at = Array.isArray(step) ? step[0] : step.at;
          if (o.t >= at) {
            activeExpr = Array.isArray(step) ? step[1] : (step.expr || activeExpr);
            if (!Array.isArray(step) && step.sweat !== undefined) activeSweat = Boolean(step.sweat);
          }
        }
      } else if (typeof o.exprAt === 'object' && o.t >= (o.exprAt.at || 0)) {
        activeExpr = o.exprAt.expr || activeExpr;
        if (o.exprAt.sweat !== undefined) activeSweat = Boolean(o.exprAt.sweat);
      }
    }
    const fx = o.profile ? 8 : 4, ex = activeExpr;
    const blink = o.t != null && (o.t % 3.8) < 0.11;

    // Signature Adult Sitcom Oval Eyes + Half-Lidded Upper Eyelids
    const eyePositions = [-8 + fx, 10 + fx];
    const lidRatio = o.puppyEyes ? 0.05 : ex === 'shock' ? 0.08 : ex === 'deadpan' || ex === 'annoyed' ? 0.50 : ex === 'happy' ? 0.24 : (K.eyelid || 0.38);
    const pupilShiftX = ex === 'side_eye' ? -3.2 : (o.lookX !== undefined ? o.lookX : 1.3);
    const pupilShiftY = o.lookY !== undefined ? o.lookY : 0.8;

    for (const exPos of eyePositions) {
      if (o.darkCircles) {
        c.strokeStyle = 'rgba(49, 46, 129, 0.55)'; c.lineWidth = 3.2; c.lineCap = 'round';
        c.beginPath(); c.arc(exPos, -1, 7.6, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      }
      if ((blink || ex === 'sigh') && !o.puppyEyes && !o.heartEyes) {
        c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.6;
        c.beginPath(); c.moveTo(exPos - 6, -4); c.quadraticCurveTo(exPos, -1, exPos + 6, -4); c.stroke();
        continue;
      }
      c.save();
      const rx = o.puppyEyes ? 8.2 : 7.2, ry = o.puppyEyes ? 7.6 : 6.4;
      c.beginPath(); c.ellipse(exPos, -4, rx, ry, 0, 0, TAU);
      c.fillStyle = '#FFFFFF'; c.fill();
      c.clip();
      if (o.heartEyes) {
        c.fillStyle = '#EC4899';
        c.beginPath(); c.arc(exPos - 2, -5, 2.8, 0, TAU); c.arc(exPos + 2, -5, 2.8, 0, TAU);
        c.moveTo(exPos - 4.8, -4); c.lineTo(exPos, 1.5); c.lineTo(exPos + 4.8, -4); c.fill();
      } else {
        const pr = o.puppyEyes ? 3.8 : (ex === 'shock' ? 2.1 : 2.3);
        c.fillStyle = INK_OUTLINE;
        c.beginPath(); c.arc(exPos + pupilShiftX, -2.5 + pupilShiftY, pr, 0, TAU); c.fill();
        if (o.puppyEyes) {
          c.fillStyle = '#FFFFFF';
          c.beginPath(); c.arc(exPos + pupilShiftX - 1.4, -4.2, 1.5, 0, TAU); c.fill();
          c.beginPath(); c.arc(exPos + pupilShiftX + 1.4, -1.6, 0.9, 0, TAU); c.fill();
        }
      }
      if (lidRatio > 0.1 && !o.heartEyes) {
        const lidY = -10.2 + lidRatio * 12.0;
        c.fillStyle = K.skin;
        c.fillRect(exPos - 9, -12, 18, lidY + 12);
        c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(exPos - 8, lidY); c.lineTo(exPos + 8, lidY); c.stroke();
      }
      c.restore();
      c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.3;
      c.beginPath(); c.ellipse(exPos, -4, rx, ry, 0, 0, TAU); c.stroke();

      if (K.glasses || o.glasses) {
        c.strokeStyle = '#1E293B'; c.lineWidth = 2.2;
        rr(c, exPos - 9, -11, 18, 14, 3); c.stroke();
      }
    }

    if (K.sunglasses || o.sunglasses) {
      const lx = -10 + fx, rxPos = 10 + fx;
      // Temple arm back toward ear
      c.strokeStyle = '#09090B'; c.lineWidth = 2.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(lx - 9, -7); c.lineTo(-27, -3); c.stroke();
      // Nose bridge
      c.beginPath(); c.moveTo(lx + 8, -7); c.lineTo(rxPos - 8, -7); c.stroke();
      // Two glossy dark wayfarer lenses with diagonal shine
      for (const exPos of [lx, rxPos]) {
        c.save();
        rr(c, exPos - 9.5, -11.5, 19, 14.5, 4);
        c.fillStyle = '#18181B';
        c.fill();
        c.clip();
        c.strokeStyle = 'rgba(255,255,255,0.45)';
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(exPos - 6, 4); c.lineTo(exPos + 2, -12);
        c.moveTo(exPos + 1, 4); c.lineTo(exPos + 7, -8);
        c.stroke();
        c.restore();
        c.strokeStyle = '#09090B'; c.lineWidth = 2.3;
        rr(c, exPos - 9.5, -11.5, 19, 14.5, 4); c.stroke();
      }
    }

    if (o.tear) {
      c.fillStyle = '#7DD3FC'; c.strokeStyle = '#0284C7'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(10 + fx, 4); c.quadraticCurveTo(15 + fx, 12, 10 + fx, 15);
      c.quadraticCurveTo(5 + fx, 12, 10 + fx, 4); c.fill(); c.stroke();
    }

    // Thick Expressive Eyebrows
    c.strokeStyle = K.hair; c.lineWidth = 3.4; c.lineCap = 'round';
    const browLift = ex === 'shock' ? -4 : ex === 'annoyed' ? 2.5 : 0;
    const rightTilt = ex === 'smirk' || ex === 'awkward' ? -2.5 : browLift;
    c.beginPath(); c.moveTo(-15 + fx, -14 + browLift * 0.5); c.lineTo(-3 + fx, -14 + browLift); c.stroke();
    c.beginPath(); c.moveTo(4 + fx, -14 + rightTilt); c.lineTo(17 + fx, -13 + rightTilt * 0.4); c.stroke();

    // Nose (clean cartoon L/C curve)
    c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.3;
    c.beginPath(); c.moveTo(fx + 1, -2); c.quadraticCurveTo(fx + 6.5, 4, fx + 1, 7); c.stroke();

    if (o.mask) {
      // Dental surgical mask over nose & mouth
      c.strokeStyle = INK_OUTLINE; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(-25, 2); c.lineTo(-14, 6); c.stroke();
      inkrr(c, fx - 14, 2, 30, 22, 6, '#BAE6FD', 2.3);
      c.strokeStyle = '#0284C7'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(fx - 9, 9); c.lineTo(fx + 11, 9); c.moveTo(fx - 9, 15); c.lineTo(fx + 11, 15); c.stroke();
    } else {
      // Mouth (supports lip-sync talking + comedic expressions)
      const isTalking = o.talking && Math.sin((o.t || 0) * 26) > 0.1;
      if (o.suctionTube) {
        c.fillStyle = '#7F1D1D'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.3;
        c.beginPath(); c.ellipse(fx + 1, 16, 6.5, 7.2, 0, 0, TAU); c.fill(); c.stroke();
        c.strokeStyle = '#38BDF8'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(fx + 3, 17); c.quadraticCurveTo(fx + 20, 26, fx + 34, 42); c.stroke();
        c.strokeStyle = INK_OUTLINE; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(fx + 3, 17); c.quadraticCurveTo(fx + 20, 26, fx + 34, 42); c.stroke();
      } else if (isTalking) {
        c.fillStyle = '#7F1D1D'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
        c.beginPath(); c.ellipse(fx + 1, 15, 5.5, 4.2, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#FFFFFF'; c.fillRect(fx - 3, 11.5, 8, 2.2);
      } else if (ex === 'shock') {
        c.fillStyle = '#7F1D1D'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.3;
        c.beginPath(); c.ellipse(fx + 1, 16, 5, 6.5, 0, 0, TAU); c.fill(); c.stroke();
      } else if (ex === 'awkward') {
        inkrr(c, fx - 7, 13, 15, 6, 3, '#FFFFFF', 2.1);
        c.beginPath(); c.moveTo(fx - 7, 16); c.lineTo(fx + 8, 16); c.stroke();
      } else if (ex === 'deadpan' || ex === 'annoyed') {
        c.beginPath(); c.moveTo(fx - 6, 15.5); c.lineTo(fx + 7, 15.5); c.stroke();
      } else {
        c.beginPath(); c.moveTo(fx - 6, 14.5); c.quadraticCurveTo(fx + 1, 18.2, fx + 8, 13.5); c.stroke();
      }
    }

    // Comic sweat drop for awkward/panic moments
    if (activeSweat || ex === 'awkward') {
      c.fillStyle = '#38BDF8'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2;
      const sy = -10 + ((o.t || 0) * 18 % 14);
      c.beginPath(); c.moveTo(-21, sy - 6); c.quadraticCurveTo(-16, sy + 2, -21, sy + 5); c.quadraticCurveTo(-26, sy + 2, -21, sy - 6); c.fill(); c.stroke();
    }
  }
  c.restore();
}

function drawSitcomPerson(c, x, y, s, o = {}) {
  const charPreset = typeof o.cast === 'string' && CAST[o.cast] ? CAST[o.cast] : PROTAGONIST;
  const P = o.pose || poseStand(o.t || 0), K = { ...PROTAGONIST, ...charPreset, ...(o.colors || {}) };
  const thin = o.thin ? 0.88 : 1;
  const shiverX = o.shiver ? Math.sin((o.t || 0) * 42) * 1.6 : 0;
  c.save(); c.translate(x + shiverX, y); const _rc = applyShortsRigComp(c); c.scale(s * (o.dir || 1), s);
  if (o.shadow !== false) { c.fillStyle = 'rgba(24,24,27,0.22)'; c.beginPath(); c.ellipse(0, 0, 40, 7, 0, 0, TAU); c.fill(); }
  const by = P.by || 0, hipY = -92 + by;

  const leg = (hx, L, isBack = false) => {
    const kx = hx + 45 * Math.sin(L.a), ky = hipY + 45 * Math.cos(L.a);
    const sa = L.a - L.b, ax = kx + 45 * Math.sin(sa), ay = ky + 45 * Math.cos(sa);
    drawJointedLeg(c, hx, hipY, kx, ky, ax, ay, K, thin, isBack, 0);
  };
  const arm = (i, A, col, isBack = false) => {
    const sx = 14 * thin * (i ? -1 : 1) * 0.3, sy = -144 + by;
    const ex = sx + 32 * Math.sin(A.a), ey = sy + 32 * Math.cos(A.a);
    const fa = A.a + A.b, wx = ex + 30 * Math.sin(fa), wy = ey + 30 * Math.cos(fa);
    return drawJointedArm(c, sx, sy, ex, ey, wx, wy, K, col, thin, isBack);
  };
  const armTarget = (i, A) => {
    const sx = 14 * thin * (i ? -1 : 1) * 0.3, sy = -144 + by;
    const ex = sx + 32 * Math.sin(A.a), ey = sy + 32 * Math.cos(A.a);
    const fa = A.a + A.b, wx = ex + 30 * Math.sin(fa), wy = ey + 30 * Math.cos(fa);
    return [wx, wy];
  };
  const withHipLean = (fn) => {
    c.save();
    if (P.lean) { c.translate(0, hipY); c.rotate(P.lean); c.translate(0, -hipY); }
    fn();
    c.restore();
  };

  let backPose = P.arms[1];
  if ((o.plasticBags && o.leftPlasticBags) || o.marketBags) {
    backPose = { a: Math.min(-0.34, (P.arms[1]?.a || 0) - 0.28), b: 0.24 };
  }

  // Far arm (behind body & hips) -> Back leg -> Tapered standing trouser pelvis -> Front leg -> Torso/Belt/Head/Front Arm
  let backHand = [0, 0];
  withHipLean(() => {
    const backTarget = armTarget(1, backPose);
    backHand = arm(1, backPose, mix(K.shirt, '#000000', 0.1), true);
    if (o.leftPlasticBags) drawPlasticBagsProp(c, backHand[0] - 6, backHand[1], 0.92, true);
    if (o.marketBags) drawMarketBagsCluster(c, backHand[0] - 6, backHand[1], 0.92, 4, ['#F97316', '#EC4899', '#22C55E', '#FACC15']);
    if (o.leftPlasticBags || o.marketBags) {
      c.fillStyle = mix(K.skin, '#000000', 0.12); c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
      c.beginPath(); c.arc(backHand[0], backHand[1], 6.0, 0, TAU); c.fill(); c.stroke();
    }
  });
  leg(-7, P.legs[1], true);
  // Subtle standing trouser hip flare so legs meet the 42px waistband without a vertical step
  c.fillStyle = K.pants;
  c.beginPath();
  c.moveTo(-20 * thin, -95 + by); c.lineTo(20 * thin, -95 + by);
  c.lineTo(14.5 * thin, -82 + by); c.lineTo(-15.5 * thin, -82 + by);
  c.closePath(); c.fill();
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-20 * thin, -95 + by); c.lineTo(-15.5 * thin, -82 + by); c.stroke();
  c.beginPath(); c.moveTo(20 * thin, -95 + by); c.lineTo(14.5 * thin, -82 + by); c.stroke();
  leg(6, P.legs[0], false);

  withHipLean(() => {
    drawSitcomUpperBody(c, K, o, P, thin);
    let frontPose = o.coverMouth ? { a: 2.35, b: 1.05 } : o.phone ? { a: 0.72, b: 1.15 } : P.arms[0];
    if ((o.plasticBags && o.leftPlasticBags) || o.marketBags) {
      frontPose = { a: Math.max(0.36, (P.arms[0]?.a || 0) + 0.28), b: 0.28 };
    }
    const frontTarget = armTarget(0, frontPose);
    if (o.plasticBags) drawPlasticBagsProp(c, frontTarget[0] + 4, frontTarget[1], 0.96, true);
    if (o.marketBags) drawMarketBagsCluster(c, frontTarget[0] + 4, frontTarget[1], 0.96, 5, ['#38BDF8', '#EC4899', '#FACC15', '#22C55E', '#A855F7']);
    const front = arm(0, frontPose, K.shirt, false);
    if (o.bag) {
      c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(front[0] - 2, front[1]); c.lineTo(front[0] - 8, front[1] + 8);
      c.moveTo(front[0] + 2, front[1]); c.lineTo(front[0] + 8, front[1] + 8); c.stroke();
      inkrr(c, front[0] - 14, front[1] + 4, 28, 34, 6, '#F5EFE6', 2.4);
    }
    if (o.coffee || o.milk) drawIcedCoffeeCup(c, front[0] + 6, front[1] - 2, 1);
    if (o.phone) drawSmartphoneProp(c, front[0] + 8, front[1] - 6, 1, o.phoneGlow !== false);
    if (o.receipt) drawReceiptProp(c, front[0] + 2, front[1] + 2, 1, o.receiptTotal || '384.-', o.receiptLen || 64);
    if (o.creditCard) drawCreditCardProp(c, front[0] + 4, front[1], 1);
    if (o.cash50) drawCash50Prop(c, front[0] + 4, front[1], 1);
    if (o.plasticBags || o.marketBags || o.bag) {
      c.fillStyle = K.skin; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.2;
      c.beginPath(); c.arc(front[0], front[1], 6.4, 0, TAU); c.fill(); c.stroke();
    }
    if (o.receipt || o.creditCard || o.cash50) {
      c.fillStyle = K.skin; c.strokeStyle = INK_OUTLINE; c.lineWidth = 1.9;
      c.beginPath(); c.arc(front[0] + 3, front[1] - 2, 3.2, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.arc(front[0] + 3, front[1] + 3, 3.0, 0, TAU); c.fill(); c.stroke();
    }
  });
  endShortsRigComp(_rc);
  c.restore();
}
const drawPerson = drawSitcomPerson;

// --------------------------------------------------------- CITY COMMUTER BICYCLE + RIDER (IK Pedaling & Straddle Z-Order)
function drawBicycle(c, x, y, s = 1, o = {}) {
  const t = o.t || 0;
  const speed = o.speed !== undefined ? o.speed : 1.6;
  const spin = t * TAU * speed;
  const dir = o.dir || 1;
  const frameCol = o.frameCol || '#6E716A';

  c.save(); c.translate(x, y); const _rc = applyShortsRigComp(c); c.scale(s * dir, s);
  // Ground shadow
  c.fillStyle = 'rgba(24,24,27,0.24)';
  c.beginPath(); c.ellipse(0, 4, 120, 12, 0, 0, TAU); c.fill();

  const rearX = -70, frontX = 70, wheelY = -42, wheelR = 40;
  const crankX = -4, crankY = -36, crankR = 16;
  const seatX = -32, seatY = -100;
  const headX = 44, headY = -108;
  const stemX = 39, stemY = -130;
  const farGripX = 33, farGripY = -134;
  const nearGripX = 16, nearGripY = -124;

  const pNearX = crankX + Math.cos(spin) * crankR, pNearY = crankY + Math.sin(spin) * crankR;
  const pFarX = crankX - Math.cos(spin) * crankR, pFarY = crankY - Math.sin(spin) * crankR;

  function drawWheel(wx, wy) {
    c.save(); c.translate(wx, wy);
    // Spokes
    c.strokeStyle = '#9CA3AF'; c.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) {
      const a = spin + (i * Math.PI) / 4;
      c.beginPath();
      c.moveTo(Math.cos(a) * (-wheelR + 5), Math.sin(a) * (-wheelR + 5));
      c.lineTo(Math.cos(a) * (wheelR - 5), Math.sin(a) * (wheelR - 5));
      c.stroke();
    }
    // Inner metallic rim
    c.strokeStyle = '#D4D4D8'; c.lineWidth = 4.5;
    c.beginPath(); c.arc(0, 0, wheelR - 5, 0, TAU); c.stroke();
    // Dark rubber tire with ink outline
    c.strokeStyle = '#27272A'; c.lineWidth = 9;
    c.beginPath(); c.arc(0, 0, wheelR, 0, TAU); c.stroke();
    c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.4;
    c.beginPath(); c.arc(0, 0, wheelR + 4, 0, TAU); c.stroke();
    // Hub
    c.fillStyle = '#52525B'; c.beginPath(); c.arc(0, 0, 5.5, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }

  const drawTube = (x1, y1, x2, y2, w = 7) => {
    c.lineCap = 'round';
    c.strokeStyle = INK_OUTLINE; c.lineWidth = w + 4.4; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = frameCol; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  };

  const drawCrankPedal = (px, py, isBack) => {
    c.lineCap = 'round';
    c.strokeStyle = INK_OUTLINE; c.lineWidth = 5;
    c.beginPath(); c.moveTo(crankX, crankY); c.lineTo(px, py); c.stroke();
    c.strokeStyle = isBack ? '#6B7280' : '#9CA3AF'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(crankX, crankY); c.lineTo(px, py); c.stroke();
    inkrr(c, px - 8, py - 3, 16, 6, 2, isBack ? '#27272A' : '#18181B', 1.8);
  };

  // Layer 1: Wheels, fenders & rear rack
  drawWheel(rearX, wheelY);
  drawWheel(frontX, wheelY);
  c.strokeStyle = frameCol; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.arc(rearX, wheelY, wheelR + 7, -0.85 * Math.PI, -0.15 * Math.PI); c.stroke();
  c.beginPath(); c.arc(frontX, wheelY, wheelR + 7, -0.78 * Math.PI, 0.08 * Math.PI); c.stroke();
  c.strokeStyle = '#52525B'; c.lineWidth = 3.5;
  c.beginPath(); c.moveTo(rearX - 18, wheelY - 52); c.lineTo(rearX + 30, wheelY - 52); c.lineTo(rearX, wheelY); c.stroke();

  // Resolve rider rig parameters (shared CAST presets)
  const hasRider = o.rider !== false;
  const charPreset = typeof o.cast === 'string' && CAST[o.cast] ? CAST[o.cast] : PROTAGONIST;
  const K = { ...PROTAGONIST, ...charPreset, ...(o.colors || {}) };
  const thin = o.thin ? 0.88 : 1;
  const by = Math.sin(spin * 2) * 1.2;
  const lean = 0.12;
  const hipX = seatX + 4, hipY = seatY - 5 + by;
  const rotHip = (dx, dy) => [
    hipX + dx * Math.cos(lean) - dy * Math.sin(lean),
    hipY + dx * Math.sin(lean) + dy * Math.cos(lean)
  ];
  const [sxFar, syFar] = rotHip(-4.2 * thin, -53);
  const [sxNear, syNear] = rotHip(-1 * thin, -54);

  // Layer 2: Far crank/pedal + Rider far leg & far handlebar/far arm (behind bike frame!)
  drawCrankPedal(pFarX, pFarY, true);
  if (hasRider) {
    const farHipX = hipX - 2, farHipY = hipY + 3;
    const farAx = pFarX - 5, farAy = pFarY - 10;
    const [fkx, fky] = solveIK2(farHipX, farHipY, farAx, farAy, 45, 45, -1);
    drawJointedLeg(c, farHipX, farHipY, fkx, fky, farAx, farAy, K, thin, true, -0.06 * Math.sin(spin + Math.PI));
  }
  // Far handlebar bar + far grip behind headtube/basket
  c.lineCap = 'round';
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 8.5;
  c.beginPath(); c.moveTo(stemX, stemY); c.quadraticCurveTo(37, -135, farGripX, farGripY); c.stroke();
  c.strokeStyle = '#9CA3AF'; c.lineWidth = 4.5;
  c.beginPath(); c.moveTo(stemX, stemY); c.quadraticCurveTo(37, -135, farGripX, farGripY); c.stroke();
  inkrr(c, farGripX - 7, farGripY - 4, 14, 8, 4, '#18181B', 2);
  if (hasRider) {
    const [fex, fey] = solveIK2(sxFar, syFar, farGripX, farGripY, 33, 33, 1);
    drawJointedArm(c, sxFar, syFar, fex, fey, farGripX, farGripY, K, mix(K.shirt, '#000000', 0.1), thin, true);
  }

  // Layer 3: Frame diamond, fork, stem, chainring, saddle & front basket
  drawTube(rearX, wheelY, crankX, crankY, 5.5);
  drawTube(rearX, wheelY, seatX, seatY + 8, 5);
  drawTube(crankX, crankY, seatX, seatY, 7);
  drawTube(crankX, crankY, headX, headY + 12, 7.5);
  drawTube(seatX, seatY + 8, headX, headY + 10, 6.5);
  drawTube(headX, headY + 8, frontX, wheelY, 6.5);
  drawTube(headX, headY + 8, stemX, stemY, 6);

  // Saddle & Crankset Chainring
  inkrr(c, seatX - 18, seatY - 7, 34, 10, 5, '#27272A', 2.5);
  c.fillStyle = '#3F3F46'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.5;
  c.beginPath(); c.arc(crankX, crankY, 13, 0, TAU); c.fill(); c.stroke();

  // Front wire mesh basket
  drawTube(headX + 2, headY + 4, headX + 10, headY - 1, 3.5);
  const bx = headX + 8, basketY = headY - 8, bw = 38, bh = 28;
  inkrr(c, bx, basketY, bw, bh, 4, 'rgba(212,212,216,0.22)', 2.8);
  c.strokeStyle = '#3F3F46'; c.lineWidth = 1.6;
  for (let gx = bx + 7; gx < bx + bw; gx += 7) { c.beginPath(); c.moveTo(gx, basketY); c.lineTo(gx, basketY + bh); c.stroke(); }
  for (let gy = basketY + 7; gy < basketY + bh; gy += 7) { c.beginPath(); c.moveTo(bx, gy); c.lineTo(bx + bw, gy); c.stroke(); }

  // Layer 4: Near crank arm + center crank bolt + near pedal
  drawCrankPedal(pNearX, pNearY, false);
  c.fillStyle = '#D4D4D8'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 1.6;
  c.beginPath(); c.arc(crankX, crankY, 3.2, 0, TAU); c.fill(); c.stroke();

  // Layer 5 & 6: Rider near leg (straddling over frame & planted on near pedal) -> Rider torso & head on saddle
  if (hasRider) {
    const nearHipX = hipX + 2, nearHipY = hipY + 4;
    const nearAx = pNearX - 5, nearAy = pNearY - 10;
    const [nkx, nky] = solveIK2(nearHipX, nearHipY, nearAx, nearAy, 45, 45, -1);
    drawJointedLeg(c, nearHipX, nearHipY, nkx, nky, nearAx, nearAy, K, thin, false, -0.06 * Math.sin(spin));

    c.save();
    c.translate(hipX, hipY); c.rotate(lean); c.translate(0, 92 - by);
    drawSitcomUpperBody(c, K, o, { by, lean, tilt: -lean * 0.55, seatedBridge: true }, thin);
    c.restore();
  }

  // Layer 7: Near swept-back handlebar, grip & near arm grasping grip
  c.lineCap = 'round';
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 9;
  c.beginPath(); c.moveTo(stemX, stemY); c.quadraticCurveTo(28, -131, nearGripX, nearGripY); c.stroke();
  c.strokeStyle = '#D4D4D8'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(stemX, stemY); c.quadraticCurveTo(28, -131, nearGripX, nearGripY); c.stroke();
  inkrr(c, nearGripX - 8, nearGripY - 4, 15, 8, 4, '#18181B', 2);

  if (hasRider) {
    const [nex, ney] = solveIK2(sxNear, syNear, nearGripX, nearGripY, 33, 33, 1);
    drawJointedArm(c, sxNear, syNear, nex, ney, nearGripX, nearGripY, K, K.shirt, thin, false);
  }

  endShortsRigComp(_rc);
  c.restore();
}

// --------------------------------------------------------- COMPATIBILITY ENTITY & POV HAND RIGS
function drawEntity(c, x, y, s, o = {}) {
  const t = o.t || 0, P = o.pose || poseWalk(t, 0.8, 0.22);
  const suit = o.suit || (o.dark ? '#3F4652' : '#4B5563');
  const suitHi = o.suitHi || (o.dark ? '#4D5562' : '#6B7280');
  const suitSh = o.suitSh || (o.dark ? '#2A3039' : '#374151');
  const skin = o.skin || '#E6AF82';

  c.save(); c.translate(x, y); const _rc = applyShortsRigComp(c); c.scale(s * (o.dir || 1), s * (o.tall || 1.04));
  if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(0, 0, 38, 7, 0, 0, TAU); c.fill(); }
  const by = P.by || 0, hipY = -96 + by;
  const leg = (hx, L, col) => {
    const kx = hx + 46 * Math.sin(L.a), ky = hipY + 46 * Math.cos(L.a), sa = L.a - L.b, ax = kx + 46 * Math.sin(sa), ay = ky + 46 * Math.cos(sa);
    limb(c, hx, hipY, kx, ky, 17, col, suitSh); limb(c, kx, ky, ax, ay, 15, col, suitSh);
    inkrr(c, ax - 8, ay - 7, 26, 11, 4, '#18181B', 2.4);
  };
  leg(-6, P.legs[1], suitSh);

  // 1. Far arm (suitSh)
  limb(c, 10, -158 + by, 20, -132, 13, suit, suitSh); limb(c, 20, -132, 22, -148, 11, skin);

  // 2. Prop drawn BEFORE front arm (suitHi) so near palm/sleeve occludes shaft
  const hasMop = o.prop === 'mop' || o.mop === true;
  if (hasMop && o.mop !== false && o.prop !== 'none') {
    const sw = Math.sin(t * 2.4) * 10;
    c.strokeStyle = '#7A5B3A'; c.lineWidth = 5.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(18, -150); c.lineTo(70 + sw, -4); c.stroke();
    c.fillStyle = '#8F8F86'; for (let k = 0; k < 7; k++) { rr(c, 52 + sw + k * 5, -10, 4, 12 + (k % 2) * 3, 2); c.fill(); }
  }

  inkrr(c, -24, -168 + by, 48, 80, 12, cyl(c, -24, 48, suit, suitHi, suitSh), 2.6);
  if (o.badge === true) { inkrr(c, 4, -150 + by, 14, 8, 2, '#FACC15', 2); }
  leg(6, P.legs[0], suit);

  // 3. Front arm (suitHi)
  limb(c, -6, -158 + by, 4, -128, 13, suitHi, suitSh); limb(c, 4, -128, 18, -142, 11, skin);
  inkrr(c, -5, -178 + by, 12, 14, 3, skin, 2.2);

  // Head
  c.save(); c.translate(0, -206 + by); c.rotate(o.tilt || 0);
  inkrr(c, -25, -30, 50, 60, 22, cyl(c, -25, 50, o.headColor || skin, o.headHi || '#F0C097', o.headSh || '#C98E60'), 2.6);
  if (o.cap === true) {
    inkrr(c, -27, -36, 54, 18, [20, 20, 3, 3], o.capColor || '#2E5A44', 2.4);
    inkrr(c, 4, -22, 30, 6, 3, o.capColor || '#2E5A44', 2.2);
  }
  c.restore(); endShortsRigComp(_rc); c.restore();
}
function drawJanitor(c, x, y, s, o = {}) {
  return drawEntity(c, x, y, s, { cap: true, badge: true, ...o, prop: o.mop === false ? 'none' : 'mop' });
}

// Macro POV Forearm (400px — smartphone, iced coffee, receipt, watch)
function hand(c, x, y, ang = 0, s = 1, o = {}) {
  const K = { ...PROTAGONIST, ...(o.colors || {}) };
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  inkrr(c, -26, 0, 52, 400, 22, cyl(c, -26, 52, K.skin, K.skinHi, K.skinSh), 2.8);
  inkrr(c, -32, -38, 64, 54, 20, K.skin, 2.8);
  for (let i = 0; i < 4; i++) { inkrr(c, -28 + i * 15, -62, 12, 32, 6, K.skin, 2.4); }
  if (o.sleeve !== false) { inkrr(c, -31, 90, 62, 320, 14, o.sleeveColor || K.shirt, 2.8); }
  if (o.watch) {
    const label = typeof o.watch === 'string' ? o.watch : '08:45';
    inkrr(c, -29, 32, 58, 16, 3, '#27272A', 2.2);
    inkrr(c, -20, 24, 40, 30, 6, '#18181B', 2.4);
    txt(c, label, 0, 44, 13, '#4ADE80', 700, 'center');
  }
  if (o.phone) {
    c.save(); c.translate(0, -82);
    inkrr(c, -44, -74, 88, 148, 12, '#18181B', 3);
    inkrr(c, -38, -64, 76, 126, 8, '#F8FAFC', 2);
    // Banking / Chat screen header
    c.fillStyle = o.phoneHeader || '#16A34A'; rr(c, -38, -64, 76, 26, [8, 8, 0, 0]); c.fill();
    const titleStr = o.phoneTitle || 'K-PLUS';
    const textStr = o.phoneText || '฿ 42.50';
    const subStr = o.phoneSub || 'ยอดเงินคงเหลือ';
    txt(c, titleStr, 0, -46, fitTextSize(c, titleStr, 64, 12, 9, 800), '#FFFFFF', 800, 'center');
    txt(c, textStr, 0, -4, fitTextSize(c, textStr, 66, 17, 11, 800), '#DC2626', 800, 'center');
    txt(c, subStr, 0, 18, fitTextSize(c, subStr, 66, 10, 7.5, 600), '#64748B', 600, 'center');
    c.restore();
  }
  if (o.coffee) {
    drawIcedCoffeeCup(c, 0, -56, 2.1);
  }
  c.restore();
}

// --------------------------------------------------------- EVERYDAY SITCOM STAGES & BACKGROUNDS
// 1. Neighborhood Street + Coffee & Bakery Shop (Inspired directly by the user's reference image!)
function streetCafeStage(c, t = 0, o = {}) {
  const pan = (o.pan || 0) * t;
  // Clear warm daylight sky
  const skyG = c.createLinearGradient(0, 0, 0, 480);
  skyG.addColorStop(0, o.skyTop || '#7CC2F5');
  skyG.addColorStop(1, o.skyBot || '#CBE8FC');
  c.fillStyle = skyG; c.fillRect(0, 0, W, 480);

  // Soft clouds
  c.fillStyle = 'rgba(255,255,255,0.72)';
  for (const [cx, cy, r] of [[210, 88, 38], [250, 82, 48], [295, 90, 34], [620, 68, 42], [665, 64, 52]]) {
    const x = ((cx - pan * 0.15) % (W + 200) + W + 200) % (W + 200) - 100;
    c.beginPath(); c.arc(x, cy, r, 0, TAU); c.fill();
  }

  // Background neighborhood brick row buildings (left side)
  const bgShift = -pan * 0.35;
  inkrr(c, -40 + bgShift, 220, 240, 260, 4, '#D9A76A', 2.6);
  inkrr(c, 190 + bgShift, 250, 190, 230, 4, '#C89258', 2.6);
  for (let wx = 10; wx < 340; wx += 64) {
    inkrr(c, wx + bgShift, 272, 34, 48, 3, '#475B63', 2.2);
    inkrr(c, wx + bgShift, 355, 34, 58, 3, '#3E5A4C', 2.2);
  }

  // Lush green neighborhood trees
  const drawTreeCanopy = (tx, ty, tr, col = '#5B8736', sh = '#3E6024') => {
    c.fillStyle = sh; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.6;
    c.beginPath(); c.arc(tx, ty + 10, tr, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = col;
    for (const [ox, oy, rr] of [[-tr * 0.45, -6, tr * 0.72], [tr * 0.45, -4, tr * 0.7], [0, -tr * 0.48, tr * 0.78]]) {
      c.beginPath(); c.arc(tx + ox, ty + oy, rr, 0, TAU); c.fill(); c.stroke();
    }
  };
  // Grounded background tree on far sidewalk (positioned clear of foreground rider head)
  const midTreeX = 595 + bgShift * 0.6;
  inkrr(c, midTreeX - 10, 265, 20, 205, 4, '#5C4028', 2.4);
  drawTreeCanopy(midTreeX, 252, 58, '#65933D', '#476A2A');

  // Main Tree Trunk on left sidewalk
  const treeX = 210 - pan * 0.4;
  inkrr(c, treeX - 24, 90, 48, 410, 8, '#5C4028', 2.8);
  drawTreeCanopy(treeX + 10, 68, 128, '#5B8736', '#3E6024');

  // Right Side: Warm Tan Brick COFFEE & BAKERY Building
  const shopX = 650 - pan * 0.6;
  inkrr(c, shopX, -20, 680, 520, 4, '#DFAF7B', 3);
  // Subtle brick mortar lines
  c.strokeStyle = 'rgba(120,75,35,0.25)'; c.lineWidth = 2;
  for (let by = 30; by < 480; by += 42) {
    c.beginPath(); c.moveTo(shopX, by); c.lineTo(shopX + 680, by); c.stroke();
  }
  // Upper apartment window
  inkrr(c, shopX + 160, 12, 220, 96, 4, '#2F3640', 3);
  inkrr(c, shopX + 172, 20, 92, 80, 2, '#4A5568', 2);
  inkrr(c, shopX + 276, 20, 92, 80, 2, '#4A5568', 2);

  // Dark forest-green storefront frame & cozy warm interior glow
  inkrr(c, shopX + 70, 210, 560, 285, 4, '#1E3329', 3);
  // Windows with warm café pendant lamps inside
  for (const [wx, ww] of [[shopX + 94, 150], [shopX + 266, 140], [shopX + 428, 175]]) {
    inkrr(c, wx, 232, ww, 240, 3, '#283630', 2.4);
    glow(c, wx + ww / 2, 285, 68, '#FDE047', 0.35);
    c.fillStyle = '#FEF08A';
    c.beginPath(); c.arc(wx + ww / 2, 268, 12, Math.PI, 0); c.fill();
  }
  // Potted café plant & patio bistro table outside
  inkrr(c, shopX + 35, 425, 58, 65, 6, '#B45309', 2.6);
  drawTreeCanopy(shopX + 64, 396, 38, '#4D7C2B', '#36581E');

  // Striped Green & Cream Awning ("COFFEE & BAKERY")
  const awnX = shopX + 20, awnY = 115, awnW = 620, awnH = 88;
  const stripes = 12;
  const sw = awnW / stripes;
  for (let i = 0; i < stripes; i++) {
    c.fillStyle = i % 2 === 0 ? '#2E5A44' : '#F3EDE0';
    c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(awnX + i * sw + 28, awnY);
    c.lineTo(awnX + (i + 1) * sw + 28, awnY);
    c.lineTo(awnX + (i + 1) * sw, awnY + awnH);
    c.lineTo(awnX + i * sw, awnY + awnH);
    c.closePath(); c.fill(); c.stroke();
  }
  // Awning front valance banner with "COFFEE & BAKERY"
  inkrr(c, awnX - 4, awnY + awnH - 4, awnW + 8, 46, 4, '#244735', 2.8);
  txt(c, o.shopTitle || 'COFFEE & BAKERY', awnX + awnW / 2 - 20, awnY + awnH + 29, 29, '#F5EFE6', 800, 'center');

  // Sidewalk & Curb + Asphalt Street + Crosswalk Stripe
  // Asphalt road
  c.fillStyle = '#525860'; c.fillRect(0, 465, W, H - 465);
  // Curved sidewalk
  c.fillStyle = '#D6CEBF'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.8;
  c.beginPath();
  c.moveTo(0, 455); c.lineTo(W, 565); c.lineTo(W, 465); c.lineTo(0, 420); c.closePath();
  c.fill(); c.stroke();
  // Curb edge
  c.fillStyle = '#BEB5A4';
  c.beginPath();
  c.moveTo(0, 455); c.lineTo(W, 565); c.lineTo(W, 584); c.lineTo(0, 472); c.closePath();
  c.fill(); c.stroke();
  // White crosswalk rectangle on asphalt
  c.save(); c.translate(920 - pan * 0.6, 635); c.rotate(0.08);
  inkrr(c, -130, -22, 260, 44, 3, '#E7E5E4', 2.2);
  c.restore();

  // Multi-Plate Green Street Sign Pole on left ("Oak St." / "Maple Ave." / "3rd St.")
  if (o.streetSign !== false) {
    const sx = 178 - pan * 0.35;
    inkrr(c, sx - 7, 65, 14, 410, 4, '#3F3F46', 2.6);
    inkrr(c, sx - 26, 462, 52, 18, 6, '#52525B', 2.6);
    const signs = o.signs || ['ซอยสุขุมวิท 21', 'ถ.อโศกมนตรี', 'คาเฟ่เปิดใหม่'];
    signs.forEach((label, idx) => {
      const sy = 76 + idx * 54;
      c.save(); c.translate(sx, sy);
      c.fillStyle = '#2E473B'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-88, 0); c.lineTo(96, 6); c.lineTo(114, 24); c.lineTo(96, 42); c.lineTo(-88, 36); c.lineTo(-106, 18); c.closePath();
      c.fill(); c.stroke();
      c.strokeStyle = '#E7E5E4'; c.lineWidth = 1.8;
      c.strokeRect(-82, 5, 172, 30);
      txt(c, label, 4, 27, fitTextSize(c, label, 160, 19, 13, 700), '#FAF6EE', 700, 'center');
      c.restore();
    });
  }

  // Wooden A-Frame Sidewalk Chalkboard ("Today's Special")
  if (o.chalkboard !== false) {
    const bx = shopX + 355, by = 340;
    c.save(); c.translate(bx, by);
    // Back leg
    inkrr(c, 118, 12, 16, 175, 4, '#784721', 2.4);
    // Main wooden frame
    inkrr(c, 0, 0, 148, 192, 6, '#9A5B2B', 2.8);
    // Black slate board
    inkrr(c, 12, 14, 124, 152, 4, '#1E2422', 2.4);
    const boardLines = o.chalkLines || ["Today's Special", 'อเมริกาโน่ส้มยูซุ', 'ครัวซองต์เนยสด', 'แก้วละ 145.-', 'Open 8am - 6pm'];
    txt(c, boardLines[0] || "Today's Special", 74, 42, 16, '#FDE68A', 700, 'center');
    for (let i = 1; i < boardLines.length; i++) {
      txt(c, boardLines[i], 74, 46 + i * 26, fitTextSize(c, boardLines[i], 112, 14, 11, 600), '#F5EFE6', 600, 'center');
    }
    c.restore();
  }
}

// 2. Open-Plan Thai Office Stage (Desks, monitors, water cooler, wall clock)
function officeStage(c, t = 0, o = {}) {
  // Cream/sage office wall + carpet floor
  c.fillStyle = o.wallCol || '#EAE4D7'; c.fillRect(0, 0, W, 470);
  c.fillStyle = o.floorCol || '#94A3B8'; c.fillRect(0, 470, W, H - 470);
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, 470); c.lineTo(W, 470); c.stroke();

  // Large glass office window showing city sky
  inkrr(c, 80, 64, 460, 260, 6, '#BAE6FD', 3);
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 3;
  c.beginPath(); c.moveTo(310, 64); c.lineTo(310, 324); c.moveTo(80, 194); c.lineTo(540, 194); c.stroke();

  // Office Wall Clock
  const cx = 640, cy = 115;
  c.fillStyle = '#FFFFFF'; c.strokeStyle = INK_OUTLINE; c.lineWidth = 3;
  c.beginPath(); c.arc(cx, cy, 38, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 16, cy + 8); c.moveTo(cx, cy); c.lineTo(cx, cy - 24); c.stroke();

  // Whiteboard / KPI chart
  inkrr(c, 740, 74, 380, 210, 8, '#FFFFFF', 3);
  txt(c, o.boardTitle || '📊 ประชุมด่วน (รอบที่ 5 ของวัน)', 930, 112, 19, INK_OUTLINE, 700, 'center');
  c.fillStyle = '#EF4444'; inkrr(c, 790, 180, 45, 75, 3, '#EF4444', 2.2);
  c.fillStyle = '#F59E0B'; inkrr(c, 860, 150, 45, 105, 3, '#F59E0B', 2.2);
  c.fillStyle = '#22C55E'; inkrr(c, 930, 130, 45, 125, 3, '#22C55E', 2.2);

  // Office Desk + Laptop
  if (o.desk !== false) {
    const dx = o.deskX || 320, dy = 430;
    inkrr(c, dx, dy, 420, 22, 4, '#C89D66', 2.8);
    inkrr(c, dx + 24, dy + 22, 18, 120, 3, '#475569', 2.6);
    inkrr(c, dx + 378, dy + 22, 18, 120, 3, '#475569', 2.6);
    // Laptop on desk
    inkrr(c, dx + 160, dy - 56, 92, 56, 5, '#334155', 2.6);
    inkrr(c, dx + 144, dy - 6, 124, 8, 3, '#64748B', 2.4);
    drawIcedCoffeeCup(c, dx + 310, dy - 12, 1.1);
  }
}

// 3. Cozy Thai Condo / Living Room / Convenience Store Interior Stage
function roomInteriorStage(c, t = 0, o = {}) {
  c.fillStyle = o.wallCol || '#F5E6C8'; c.fillRect(0, 0, W, 480);
  c.fillStyle = o.floorCol || '#C89D66'; c.fillRect(0, 480, W, H - 480);
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, 480); c.lineTo(W, 480); c.stroke();

  // Framed wall poster
  inkrr(c, 160, 88, 180, 220, 6, '#FEF3C7', 2.8);
  txt(c, o.posterText || 'พรุ่งนี้ค่อยลด', 250, 200, 22, '#B45309', 800, 'center');

  // Sofa & houseplant
  if (o.sofa !== false) {
    inkrr(c, 420, 340, 440, 145, 22, o.sofaCol || '#3B82F6', 3);
    inkrr(c, 395, 380, 45, 110, 14, o.sofaCol || '#2563EB', 2.8);
    inkrr(c, 840, 380, 45, 110, 14, o.sofaCol || '#2563EB', 2.8);
  }
}

// 4. Split-Screen Phone Call / Group Chat Reaction Stage
function splitChatStage(c, t = 0, leftFn, rightFn) {
  c.save();
  c.beginPath(); c.moveTo(0, 0); c.lineTo(665, 0); c.lineTo(615, H); c.lineTo(0, H); c.closePath();
  c.clip();
  if (leftFn) leftFn(c, t);
  c.restore();

  c.save();
  c.beginPath(); c.moveTo(665, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(615, H); c.closePath();
  c.clip();
  if (rightFn) rightFn(c, t);
  c.restore();

  // Comic diagonal divider lightning bolt line
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 10;
  c.beginPath(); c.moveTo(665, 0); c.lineTo(615, H); c.stroke();
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 4;
  c.beginPath(); c.moveTo(665, 0); c.lineTo(615, H); c.stroke();
}

// --------------------------------------------------------- OPTION B HYBRID PUNCHLINE HELPERS (Sticker Cutout + Comic Burst)
const _stickerOff = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const _stickerHalo = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (_stickerOff) { _stickerOff.width = W; _stickerOff.height = H; }
if (_stickerHalo) { _stickerHalo.width = W; _stickerHalo.height = H; }
const _sOffCtx = _stickerOff ? _stickerOff.getContext('2d') : null;
const _sHaloCtx = _stickerHalo ? _stickerHalo.getContext('2d') : null;

function drawSpeedLines(c, cx = W / 2, cy = H / 2, count = 34, rIn = 90, rOut = 960, col = 'rgba(255,255,255,0.14)', t = 0) {
  c.save();
  const spin = t * 0.12;
  for (let i = 0; i < count; i++) {
    if (i % 2 === 1) continue;
    const a0 = spin + (i / count) * TAU;
    const a1 = a0 + (TAU / count) * 0.45;
    c.fillStyle = col;
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

function drawPunchlineBackdrop(c, t = 0, o = {}) {
  const lCol = o.leftBg || ['#FDE047', '#F97316', '#991B1B'];
  const rCol = o.rightBg || ['#2563EB', '#1E293B', '#09090B'];
  const cx = o.cx !== undefined ? o.cx : W / 2, cy = o.cy !== undefined ? o.cy : H * 0.44;
  const bgL = c.createRadialGradient(W * 0.27, cy, 40, W * 0.27, cy, 680);
  bgL.addColorStop(0, lCol[0]); bgL.addColorStop(0.5, lCol[1]); bgL.addColorStop(1, lCol[2]);
  c.fillStyle = bgL; c.fillRect(0, 0, W, H);

  if (o.split !== false) {
    c.save();
    c.beginPath(); c.moveTo(cx + 68, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(cx - 72, H); c.closePath(); c.clip();
    const bgR = c.createRadialGradient(W * 0.75, cy, 40, W * 0.75, cy, 640);
    bgR.addColorStop(0, rCol[0]); bgR.addColorStop(0.6, rCol[1]); bgR.addColorStop(1, rCol[2]);
    c.fillStyle = bgR; c.fillRect(0, 0, W, H);
    c.restore();
  }

  drawSpeedLines(c, cx, cy, o.lineCount || 34, 90, 960, o.lineCol || 'rgba(255,255,255,0.14)', t);
  if (o.lightning !== false) {
    c.save();
    c.strokeStyle = '#FEF08A'; c.lineWidth = 10; c.lineJoin = 'round';
    c.shadowColor = '#FACC15'; c.shadowBlur = 18;
    c.beginPath();
    c.moveTo(cx + 68, -6); c.lineTo(cx + 12, 180); c.lineTo(cx + 58, 215);
    c.lineTo(cx - 28, 415); c.lineTo(cx + 18, 445); c.lineTo(cx - 72, H + 6);
    c.stroke();
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.stroke();
    c.restore();
  }
}

function drawStickerPerson(c, x, y, s, opts = {}, borderR = 7, overlayFn = null) {
  if (!_sOffCtx || !_sHaloCtx) {
    drawSitcomPerson(c, x, y, s, opts);
    return;
  }
  _sOffCtx.setTransform(1, 0, 0, 1, 0, 0);
  _sOffCtx.clearRect(0, 0, W, H);
  drawSitcomPerson(_sOffCtx, x, y, s, opts);
  if (typeof overlayFn === 'function') overlayFn(_sOffCtx, x, y, s);

  _sHaloCtx.setTransform(1, 0, 0, 1, 0, 0);
  _sHaloCtx.globalCompositeOperation = 'source-over';
  _sHaloCtx.clearRect(0, 0, W, H);
  _sHaloCtx.drawImage(_stickerOff, 0, 0);
  _sHaloCtx.globalCompositeOperation = 'source-in';
  _sHaloCtx.fillStyle = '#FFFFFF';
  _sHaloCtx.fillRect(0, 0, W, H);
  _sHaloCtx.globalCompositeOperation = 'source-over';

  const rx = _inShortsWorld ? (borderR * 1.4 / SHORTS_SX) : borderR;
  const ry = _inShortsWorld ? (borderR * 1.4 / SHORTS_SY) : borderR;
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.48)';
  c.shadowBlur = 18;
  c.shadowOffsetY = 8;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    c.drawImage(_stickerHalo, Math.cos(a) * rx, Math.sin(a) * ry);
  }
  c.shadowColor = 'transparent';
  c.drawImage(_stickerOff, 0, 0);
  c.restore();
}

function drawComicBurst(c, cx, cy, label, o = {}) {
  const s = o.scale !== undefined ? o.scale : 1;
  const rIn = o.rIn || 66, rOut = o.rOut || 100, spikes = o.spikes || 12;
  const drawPoly = (ri, ro, fill, lw) => {
    c.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? ro : ri;
      const a = (i * Math.PI) / spikes - Math.PI / 2;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = fill; c.fill();
    c.strokeStyle = o.stroke || INK_OUTLINE; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke();
  };
  c.save();
  c.translate(cx, cy);
  const _rc = applyShortsRigComp(c);
  if (o.rot) c.rotate(o.rot);
  c.scale(s, s);
  drawPoly(rIn + 9, rOut + 10, '#FFFFFF', 4.5);
  drawPoly(rIn, rOut, o.fill || '#FACC15', 4.0);
  const sz = fitTextSize(c, label, rIn * 1.65, o.fontSize || 34, 18, 900);
  c.font = `900 ${sz}px ${FONT}`;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = 7; c.strokeStyle = '#FFFFFF'; c.strokeText(label, 0, 2);
  c.fillStyle = o.textCol || '#DC2626'; c.fillText(label, 0, 2);
  endShortsRigComp(_rc);
  c.restore();
}

function drawSpeechBubble(c, x, y, text, o = {}) {
  const sz = o.size || 20;
  const maxW = o.maxW || 340;
  c.save();
  c.translate(x, y);
  const _rc = applyShortsRigComp(c);
  c.font = `700 ${sz}px ${FONT}`;
  const fittedSz = fitTextSize(c, text, maxW - 36, sz, 14, 700);
  c.font = `700 ${fittedSz}px ${FONT}`;
  const tw = c.measureText(text).width;
  const bw = Math.min(maxW, Math.max(120, Math.ceil(tw + 38)));
  const bh = fittedSz + 26;
  const bx = -bw / 2, by = -bh;

  c.fillStyle = 'rgba(24,24,27,0.85)';
  rr(c, bx + 4, by + 4, bw, bh, 14); c.fill();
  inkrr(c, bx, by, bw, bh, 14, o.bg || '#FFFDF9', 2.8, INK_OUTLINE);
  const tailX = o.tailDir === 'br' ? bx + bw * 0.72 : bx + bw * 0.28;
  const tipX = o.tailDir === 'br' ? tailX + 16 : tailX - 16;
  c.fillStyle = o.bg || '#FFFDF9';
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 2.6; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(tailX - 9, -2); c.lineTo(tipX, 14); c.lineTo(tailX + 9, -2); c.closePath();
  c.fill(); c.stroke();
  c.fillRect(tailX - 8, -5, 16, 5);
  txt(c, text, 0, by + bh / 2 + fittedSz * 0.34, fittedSz, o.col || INK_OUTLINE, 700, 'center');
  endShortsRigComp(_rc);
  c.restore();
}

// Legacy stage compatibility wrappers
const LIT = { wall: '#EAE4D7', wallSh: '#D6CEBF', floor: '#C89D66', line: '#B58952', ceil: '#F5EFE6', fog: '#F5E6C8', shutter: '#2E5A44', rib: '#1E3329', panel: '#FFFBE8' };
const DARK = { wall: '#334155', wallSh: '#1E293B', floor: '#475569', line: '#64748B', ceil: '#1E293B', fog: '#0F172A', shutter: '#334155', rib: '#1E293B', panel: '#E2E8F0' };
const PK = LIT;
function corridor(c, t, o = {}) { streetCafeStage(c, t, o); return (X, Y, z) => [640 + X * 120, 480 - Y * 80]; }
function outdoorStage(c, t, o = {}) { streetCafeStage(c, t, o); return { horizonY: 465 }; }
function roomCorner(c, o = {}) { roomInteriorStage(c, 0, o); return { cx: 520, topY: 90, botY: 480 }; }
function topDownRoom(c, o = {}) { officeStage(c, 0, o); return { rx: 120, ry: 90, rw: 640, rh: 520 }; }
function cctvOverlay(c, t, o = {}) {}

// --------------------------------------------------------- ATMOSPHERIC POST & SHADERS
function vignette(c, k = 0.22, inner = 0.62, col = '#18181B') {
  const g = c.createRadialGradient(W / 2, H / 2, H * inner, W / 2, H / 2, H * 0.98);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, k)); c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function darken(c, a = 0.15, col = '#18181B') {
  if (typeof a === 'string') a = 0.15;
  c.fillStyle = rgba(col, a); c.fillRect(0, 0, W, H);
}
function emergency(c, x, y, r, a = 0.25) {
  if (y === undefined || r === undefined) { x = W / 2; y = 180; r = 520; a = 0.25; }
  c.save(); c.globalCompositeOperation = 'screen'; glow(c, x, y, r, '#FACC15', a); c.restore();
}
function frostOverlay() {}

const grainCv = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (grainCv) {
  grainCv.width = grainCv.height = 256;
  const g = grainCv.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = hash(i * 0.37) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
}
function grain(c, T, a = 0.02) {
  if (!grainCv) return;
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay';
  const ox = Math.floor(hash(Math.floor(T * 30)) * 256), oy = Math.floor(hash(Math.floor(T * 30) + 5) * 256);
  c.translate(-ox, -oy); c.fillStyle = c.createPattern(grainCv, 'repeat'); c.fillRect(0, 0, W + 256, H + 256); c.restore();
}

// --------------------------------------------------------- SITCOM & SOCIAL MEDIA HUD CARDS, TELEMETRY & SUBTITLES
const CREAM = '#FFFDF9', INK = '#18181B', RED = '#DC2626', YELLOW = '#FACC15', GREEN = '#16A34A';
const CARD = { bg: CREAM, ink: INK, red: RED, muted: '#57534E' };

function badge(c, x, y, s, dark = true) {
  const isHex = typeof dark === 'string';
  c.font = `700 15px ${FONT}`; const w = c.measureText(s).width + 24;
  const fillCol = isHex ? dark : (dark ? '#18181B' : RED);
  inkrr(c, x, y, w, 26, 13, fillCol, 2, INK_OUTLINE);
  txt(c, s, x + 12, y + 18.5, 15, fillCol === '#FACC15' ? INK_OUTLINE : '#fff', 700); return w;
}
function cardBox(c, x, y, w, h, bgCol = CREAM) {
  c.save();
  // Crisp comic offset drop shadow
  c.fillStyle = 'rgba(24,24,27,0.88)';
  rr(c, x + 6, y + 6, w, h, 14); c.fill();
  c.restore();
  inkrr(c, x, y, w, h, 14, bgCol, 3, INK_OUTLINE);
}
function measure(c, s, size, weight = 700) { c.font = `${weight} ${size}px ${FONT}`; return c.measureText(s).width; }
function fitTextSize(c, s, maxW, startSize, minSize = 14, weight = 700) {
  let sz = startSize;
  while (sz > minSize && measure(c, s, sz, weight) > maxW) sz -= 1;
  return sz;
}
function cardPos(pos, w, h) {
  const shorts = typeof window !== 'undefined' && window.SHORTS_MODE;
  if (shorts) {
    const safeW = SHORTS_W - 140 - 56;
    const alignLeft = (pos === 'tl' || pos === 'left') && w <= 620;
    const sx = alignLeft
      ? 48
      : clamp(Math.round(56 + (safeW - w) / 2), 48, Math.max(48, SHORTS_W - w - 140));
    const sy = (pos === 'tl' || pos === 'left') ? 606 : 620;
    return [sx, clamp(sy, 480, SHORTS_H - h - 420)];
  }
  const maxX = W - w - 46;
  let x, y;
  if (pos === 'tl' || pos === 'left') { x = 56; y = 44; }
  else if (pos === 'tm' || pos === 'tc') { x = clamp((W - w) / 2 - 30, 260, Math.max(260, W - w - 380)); y = 40; }
  else if (pos === 'tr') { x = W - w - 46; y = 186; }
  else if (pos === 'r' || pos === 'right') { x = W - w - 46; y = Math.max(186, (H - h) / 2 + 28); }
  else if (pos === 'bl') { x = 56; y = H - h - 92; }
  else if (pos === 'br') { x = W - w - 46; y = H - h - 92; }
  else { x = (W - w) / 2; y = (H - h) / 2 - 20; }
  return [clamp(x, 24, Math.max(24, maxX)), clamp(y, 24, Math.max(24, H - h - 76))];
}

function normalizeCard(s) {
  if (!s) return null;
  if (s.card) return s.card;
  if (!s.hud) return null;
  const h = s.hud;
  const at = h.at !== undefined ? h.at : 0.4;
  const pos = h.pos || 'tr';
  if (h.type === 'speech' || h.type === 'thought') {
    return {
      type: 'rule', at, pos,
      badge: h.speaker ? `💬 ${h.speaker}` : (h.type === 'thought' ? '💭 คิดในใจ' : '💬 บทสนทนา'),
      title: Array.isArray(h.title) ? h.title : [h.text || h.title || '', h.sub || ''].filter(Boolean),
      sub: h.eng || h.tag || ''
    };
  }
  if (h.type === 'social' || h.type === 'chat') {
    return {
      type: 'info', at, pos,
      badge: h.app ? `📱 ${h.app} · ${h.user || ''}` : (h.badge || '📱 โซเชียลมีเดีย · SOCIAL'),
      title: Array.isArray(h.title) ? h.title : [h.text || h.title || '', h.sub || ''].filter(Boolean),
      sub: h.likes ? `❤️ ${h.likes}   💬 ${h.comments || '1.2K'}` : (h.eng || '')
    };
  }
  if (h.type === 'punchline' || h.type === 'rule') {
    return {
      type: 'rule', at, pos,
      badge: h.badge || `🤣 ${h.ruleNo || 'มุกตลกประจำซีน'}`,
      title: Array.isArray(h.title) ? h.title : [h.title || '', h.sub || ''].filter(Boolean),
      sub: h.eng || 'SITCOM PUNCHLINE'
    };
  }
  if (h.type === 'info' || h.type === 'chalkboard') {
    return {
      type: 'info', at, pos,
      badge: h.badge || '☕ เมนูวันนี้ · TODAY SPECIAL',
      title: Array.isArray(h.title) ? h.title : [h.title || '', h.sub || ''].filter(Boolean),
      sub: Array.isArray(h.title) ? (h.sub || '') : (h.eng || '')
    };
  }
  if (h.type === 'inventory') {
    return { type: 'inventory', at, pos: h.pos || 'tr', badge: h.badge || '🎒 ของในตะกร้า · ITEMS', items: (h.items || []).map(it => Array.isArray(it) ? it : [it.icon || '•', it.name, it.qty]) };
  }
  if (h.type === 'price_tag' || h.type === 'math' || h.type === 'calc') {
    return { type: 'calc', at, pos: h.pos || 'r', badge: h.badge || '🧾 เช็กบิลชีวิตจริง · RECEIPT', rows: h.rows || [], total: h.total || ['รวมทั้งหมด', 'ช็อตฟีล'], note: h.note || [] };
  }
  if (h.type === 'versus' || h.type === 'dilemma' || h.type === 'flow') {
    return {
      type: 'flow', at, head: h.head || 'สิ่งที่คิด VS ความเป็นจริง',
      left: h.left || { tag: h.optA.title, icon: h.optA.icon || '😎', res: h.optA.res, en: h.optA.en, danger: Boolean(h.optA.danger) },
      right: h.right || { tag: h.optB.title, icon: h.optB.icon || '😭', res: h.optB.res, en: h.optB.en, danger: h.optB.danger !== false }
    };
  }
  if (h.type === 'anomaly' || h.type === 'clue') {
    return { type: 'clue', at, pos: h.pos || 'r', badge: h.badge || '❗ จุดพีค · PLOT TWIST', glyph: h.glyph || '😳', title: Array.isArray(h.title) ? h.title : [h.title || '', h.sub || ''].filter(Boolean), sub: h.detail || h.eng || '' };
  }
  return null;
}

function drawCard(c, rawCard, lt, sceneDur) {
  // Option B clean storytelling default: top cream cards disabled unless explicitly enabled
  if (typeof window === 'undefined' || !window.__ENABLE_SITCOM_HUD || window.__HIDE_HUD) return;
  const card = rawCard && !rawCard.pos && !rawCard.head && !rawCard.rows && !rawCard.items && !Array.isArray(rawCard.title)
    ? normalizeCard({ hud: rawCard }) : rawCard;
  if (!card) return;
  const at = card.at !== undefined ? card.at : 0.4;
  const k = easeBack(prog(lt, at, at + 0.38)), out = 1 - prog(lt, sceneDur - 0.3, sceneDur);
  const a = clamp(prog(lt, at, at + 0.2)) * out; if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  if (card.type === 'flow') { drawFlow(c, card, lt - at); c.restore(); return; }

  let w, h; const pad = 26;
  const maxCardW = (typeof window !== 'undefined' && window.SHORTS_MODE) ? 880 : 760;

  if (card.type === 'rule' || card.type === 'info' || card.type === 'clue') {
    const baseSize = card.small ? 24 : 28;
    const gw = card.type === 'clue' ? 105 : 0;
    const lines = card.title || [];
    const subStr = card.sub || '';
    const rawW = Math.max(340, ...lines.map(s => measure(c, s, baseSize, 700) + pad * 2 + gw), measure(c, subStr, 13, 600) + pad * 2 + gw, measure(c, card.badge || '', 15, 600) + 64);
    w = Math.min(maxCardW, rawW);
    const innerTextW = w - pad * 2 - gw;
    const lineSizes = lines.map(s => fitTextSize(c, s, innerTextW, baseSize, 17, 700));
    const subSize = subStr ? fitTextSize(c, subStr, innerTextW, 13, 10, 600) : 13;
    const lineStep = Math.max(...lineSizes, baseSize) + 10;
    h = 62 + lines.length * lineStep + (subStr ? 40 : 8);

    const [x, y] = cardPos(card.pos, w, h);
    c.translate(x + w / 2, y + h / 2); c.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); c.translate(-w / 2, -h / 2);
    cardBox(c, 0, 0, w, h);
    badge(c, pad - 6, 18, card.badge, card.type === 'rule' ? '#FACC15' : '#16A34A');
    let ty = 62;
    if (gw) {
      inkrr(c, pad - 4, 58, 88, h - 76, 10, '#FEF3C7', 2.2);
      const gSz = String(card.glyph || '😳').length > 2 ? 26 : 42;
      txt(c, card.glyph || '😳', pad + 40, 58 + (h - 76) / 2 + gSz * 0.34, gSz, INK, 700, 'center');
    }
    for (let i = 0; i < lines.length; i++) {
      const sz = lineSizes[i];
      ty += sz + 6;
      txt(c, lines[i], pad + gw, ty, sz, i === 1 && (card.type === 'rule' || card.type === 'clue') ? RED : INK, 700);
      ty += 4;
    }
    if (subStr) {
      c.fillStyle = '#E5E7EB'; c.fillRect(pad + gw, ty + 10, w - pad * 2 - gw, 2);
      txt(c, subStr, pad + gw, ty + 32, subSize, card.type === 'rule' ? RED : '#4B5563', 700);
    }
  } else if (card.type === 'inventory') {
    const items = card.items || [];
    const maxItemW = Math.max(360, ...items.map(it => 86 + measure(c, it[1], 19, 700) + measure(c, it[2], 18, 700) + 32));
    w = clamp(maxItemW, 380, Math.min(540, maxCardW));
    h = 66 + items.length * 46;
    const [x, y] = cardPos(card.pos, w, h);
    c.translate(x, y); cardBox(c, 0, 0, w, h); badge(c, 20, 18, card.badge, '#2563EB');
    items.forEach((it, i) => {
      const ia = prog(lt, at + 0.25 + i * 0.35, at + 0.55 + i * 0.35); if (ia <= 0) return;
      c.globalAlpha = a * ia; const yy = 64 + i * 46;
      inkrr(c, 20, yy, 36, 36, 8, '#FEF3C7', 2); txt(c, it[0], 38, yy + 26, 20, INK, 400, 'center');
      const qtyW = measure(c, it[2], 17, 700);
      const nameSz = fitTextSize(c, it[1], w - 98 - qtyW, 18, 14, 700);
      txt(c, it[1], 68, yy + 25, nameSz, INK, 700); txt(c, it[2], w - 22, yy + 25, 17, RED, 700, 'right');
    });
  } else if (card.type === 'calc') {
    const rows = card.rows || [], notes = card.note || [], tot = card.total || ['', ''];
    const rowMaxW = Math.max(520, ...rows.map(r => 68 + measure(c, r[0], 18, 600) + measure(c, r[1], 19, 700)), 68 + measure(c, tot[0], 21, 700) + measure(c, tot[1], 23, 700), ...notes.map(n => 68 + measure(c, '▸ ' + n, 15, 600)));
    w = Math.min(maxCardW, Math.max(520, rowMaxW));
    h = 70 + rows.length * 40 + 60 + notes.length * 26 + 10;
    const [x, y] = cardPos(card.pos, w, h);
    c.translate(x + w / 2, y + h / 2); c.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); c.translate(-w / 2, -h / 2);
    cardBox(c, 0, 0, w, h); badge(c, 20, 18, card.badge, '#FACC15');
    let yy = 72;
    rows.forEach((r, i) => {
      const ia = prog(lt, at + 0.35 + i * 0.45, at + 0.65 + i * 0.45); c.globalAlpha = a * ia;
      const valW = measure(c, r[1], 19, 700);
      const lblSz = fitTextSize(c, r[0], w - 68 - valW, 18, 13, 600);
      txt(c, r[0], 26, yy + 22, lblSz, INK, 600); txt(c, r[1], w - 26, yy + 22, 19, INK, 700, 'right'); yy += 40;
    });
    const ta = prog(lt, at + 0.35 + rows.length * 0.45, at + 0.75 + rows.length * 0.45); c.globalAlpha = a * ta;
    c.fillStyle = INK; c.fillRect(26, yy + 4, w - 52, 2.5);
    const totValW = measure(c, tot[1], 23, 700);
    const totLblSz = fitTextSize(c, tot[0], w - 68 - totValW, 21, 15, 700);
    txt(c, tot[0], 26, yy + 40, totLblSz, INK, 700); txt(c, tot[1], w - 26, yy + 40, 23, RED, 800, 'right'); yy += 60;
    notes.forEach((n, i) => {
      const na = prog(lt, at + 1.8 + i * 0.5, at + 2.2 + i * 0.5); c.globalAlpha = a * na;
      const nSz = fitTextSize(c, '▸ ' + n, w - 52, 15, 12, 600);
      txt(c, '▸ ' + n, 26, yy + 20, nSz, i === notes.length - 1 ? RED : '#4B5563', 700); yy += 26;
    });
  }
  c.restore();
}

function drawFlow(c, card, lt) {
  if (typeof window !== 'undefined' && window.__HIDE_HUD) return;
  const shorts = isShortsMode();
  const cx = shorts ? 485 : 480, top = shorts ? 606 : 46;
  const headSz = fitTextSize(c, card.head, 640, 22, 16, 700);
  c.font = `700 ${headSz}px ${FONT}`; const hw = Math.min(700, c.measureText(card.head).width + 48);
  inkrr(c, cx - hw / 2, top, hw, 44, 22, '#FACC15', 3);
  txt(c, card.head, cx, top + 29, headSz, INK, 800, 'center');
  const k = easeOut(prog(lt, 0.2, 0.9));
  c.strokeStyle = INK_OUTLINE; c.lineWidth = 3.5;
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx, top + 44);
    c.quadraticCurveTo(cx + s * 190 * k, top + 56, cx + s * 195 * k, top + 84 * k + 2);
    c.stroke();
  }
  [['left', -1, 0.5], ['right', 1, 0.95]].forEach(([key, s, at]) => {
    const b = card[key]; if (!b) return;
    const ka = easeBack(prog(lt, at, at + 0.4)); if (ka <= 0) return;
    const w = 320, h = 178, x = cx + s * 195 - w / 2, y = top + 84;
    c.save(); c.globalAlpha *= clamp(ka); c.translate(x + w / 2, y); c.scale(0.9 + 0.1 * ka, 0.9 + 0.1 * ka); c.translate(-w / 2, 0);
    cardBox(c, 0, 0, w, h);
    txt(c, b.tag, w / 2, 34, fitTextSize(c, b.tag, w - 30, 19, 13, 700), '#4B5563', 700, 'center');
    txt(c, b.icon, w / 2, 88, 38, INK, 400, 'center');
    txt(c, b.res, w / 2, 134, fitTextSize(c, b.res, w - 30, 22, 14, 700), b.danger ? RED : GREEN, 800, 'center');
    if (b.en) txt(c, b.en, w / 2, 160, fitTextSize(c, b.en, w - 30, 12, 10, 600), '#6B7280', 600, 'center');
    c.restore();
  });
}

// Sitcom Everyday Status Telemetry (disabled by default in Option B clean storytelling)
function drawTele(c, s, lt) {
  if (typeof window === 'undefined' || !window.__ENABLE_SITCOM_TELE || window.__HIDE_HUD) return;
  const tl = s.tele || s.telemetry; if (!tl) return;
  const shorts = isShortsMode();
  if (shorts && typeof window !== 'undefined' && window.__HIDE_SHORTS_TELE) return;
  const x = shorts ? (SHORTS_W - 150) : (W - 46), y = shorts ? 448 : 26, w = 320;
  const dayStr = tl.day === 0 ? '☀️ เช้าวันทำงาน' : `📍 ${tl.day}`;
  const timeStr = tl.time || '';
  const subLabel = tl.label || tl.shift || '';

  let bar = tl.bar || null;
  if (!bar && tl.wallet != null) {
    const r = clamp(tl.wallet / (tl.wmax || 1000)), low = tl.wallet < 100;
    bar = { label: 'เงินในบัญชี', ratio: r, text: `฿${tl.wallet}`, color: low ? '#EF4444' : '#22C55E', warn: low };
  } else if (!bar && tl.caffeine != null) {
    const r = clamp(tl.caffeine / 100), low = tl.caffeine < 30;
    bar = { label: 'คาเฟอีน', ratio: r, text: `${tl.caffeine}%`, color: low ? '#F59E0B' : '#10B981', warn: low };
  } else if (!bar && tl.battery != null) {
    const r = clamp(tl.battery / 100), low = tl.battery <= 15;
    bar = { label: 'แบตมือถือ', ratio: r, text: `${tl.battery}%`, color: low ? '#EF4444' : '#38BDF8', warn: low };
  } else if (!bar && tl.kcal != null) {
    const r = clamp(tl.kcal / (tl.kmax || 2400)), low = r < 0.3;
    bar = { label: 'พลังงานชีวิต', ratio: r, text: `${tl.kcal} kcal`, color: low ? '#EF4444' : '#FACC15', warn: low };
  }

  c.save(); c.globalAlpha = clamp(lt / 0.3);
  const h = 56 + (bar ? 28 : 0) + (subLabel ? 24 : 0);
  cardBox(c, x - w, y, w, h, '#FFFDF9');
  txt(c, dayStr, x - w + 16, y + 24, fitTextSize(c, dayStr, w - 120, 15, 12, 700), INK, 700);
  if (timeStr) txt(c, timeStr, x - 16, y + 42, 26, INK, 800, 'right');

  const statusTxt = tl.statusText || (tl.mood ? `อารมณ์: ${tl.mood}` : '');
  if (statusTxt) txt(c, statusTxt, x - w + 16, y + 46, 13.5, '#B45309', 700);

  let yy = y + 56;
  if (bar) {
    const r = clamp(bar.ratio !== undefined ? bar.ratio : (bar.value / (bar.max || 100)));
    txt(c, bar.label || 'สถานะ', x - w + 16, yy + 17, 13, '#4B5563', 700);
    inkrr(c, x - w + 92, yy + 6, 122, 12, 6, '#E5E7EB', 1.8);
    inkrr(c, x - w + 92, yy + 6, Math.max(8, 122 * r), 12, 6, bar.color || '#22C55E', 1.8);
    txt(c, bar.text || `${bar.value}${bar.unit || ''}`, x - 16, yy + 18, 14, bar.warn ? RED : INK, 800, 'right');
    yy += 28;
  }

  if (subLabel) {
    txt(c, subLabel, x - w + 16, yy + 14, fitTextSize(c, subLabel, w - 32, 13.5, 11, 700), '#D97706', 700);
  }
  c.restore();
}

function drawChapter(c, chap, lt) {
  if (typeof window === 'undefined' || !window.__ENABLE_SITCOM_CHAPTER || window.__HIDE_HUD) return;
  const label = Array.isArray(chap) ? chap[0] : (chap.label || '');
  const title = Array.isArray(chap) ? chap[1] : (chap.title || '');
  const a = clamp(prog(lt, 0, 0.35)) * (1 - prog(lt, 2.8, 3.3));
  if (a <= 0) return;
  const cw = isShortsMode() ? SHORTS_W : W, ch = isShortsMode() ? SHORTS_H : H;
  c.save(); c.globalAlpha = a;
  const ox = (1 - easeOut(lt / 0.6)) * -30;
  c.font = `700 20px ${FONT}`; const bw = c.measureText(label).width + 36;
  inkrr(c, cw / 2 - bw / 2 + ox, ch / 2 - 68, bw, 38, 19, '#FACC15', 3);
  txt(c, label, cw / 2 + ox, ch / 2 - 42, 20, INK, 800, 'center');
  const tSz = fitTextSize(c, title, cw - 120, 44, 24, 800);
  c.font = `800 ${tSz}px ${FONT}`; c.textAlign = 'center';
  c.lineJoin = 'round'; c.lineWidth = 8; c.strokeStyle = INK_OUTLINE; c.strokeText(title, cw / 2 - ox, ch / 2 + 28);
  c.fillStyle = '#FFFDF9'; c.fillText(title, cw / 2 - ox, ch / 2 + 28);
  c.restore();
}

// --------------------------------------------------------- SUBTITLES (FRAMELESS — Pop-In + Punchword Highlight + 9:16 Safe Zone Aware)
function drawSub(c, s, lt) {
  if (typeof window !== 'undefined' && window.__HIDE_HUD) return;
  if (!s.subs) return;
  const cue = s.subs.find(q => {
    const t0 = q.t0 !== undefined ? q.t0 : q.start;
    const t1 = q.t1 !== undefined ? q.t1 : q.end;
    return lt >= t0 && lt < t1;
  });
  if (!cue) return;
  const t0 = cue.t0 !== undefined ? cue.t0 : cue.start;
  const isShorts = typeof window !== 'undefined' && window.SHORTS_MODE;
  const ctaActive = isShorts && typeof window.__SHORTS_REM_SEC === 'number' && window.__SHORTS_REM_SEC <= 2.25 && window.__SHORTS_REM_SEC >= 0.04;
  const subY = isShorts ? (ctaActive ? 1482 : Math.min(SHORTS_H - 42, 1500)) : (H - 42);
  const maxSubW = isShorts ? (SHORTS_W - 220) : (W - 120);
  const subSz = fitTextSize(c, cue.text, maxSubW, isShorts ? 42 : 30, isShorts ? 26 : 20, 800);
  const subX = isShorts ? 495 : (W / 2);
  const pop = easeBack(prog(lt, t0, t0 + 0.09));
  const sc = 0.88 + 0.12 * pop;
  const kwPattern = '(?<![\\u0E40-\\u0E44])(?:\\d+(?:[.,:]\\d+)?(?:\\s*(?:บาท|฿|%|วิ|นาที|ชม\\.|กม\\.|เดือน|กล่อง|ถุง|ไม้|เมตร|ม\\.))?|ช็อตฟีล|ไม่ตรงปก|เงินเดือน|โบนัส|ประชุม|หนี้|ฟรี|ส่งฟรี|หมดตัว|โอที|ขาดทุน|กำไร|กะเพรา|จัดฟันใส|ขูดหินปูน)(?![\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E])';
  const kwSplitRe = new RegExp(`(${kwPattern})`, 'g');
  const kwExactRe = new RegExp(`^${kwPattern}$`);
  const shockRe = /^(?:ช็อตฟีล|ไม่ตรงปก|หนี้|หมดตัว|ประชุม|โอที|ขาดทุน)$/;
  const parts = String(cue.text || '').split(kwSplitRe).filter(Boolean);

  c.save();
  c.font = `800 ${subSz}px ${FONT}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.lineJoin = 'round';
  const widths = parts.map(p => c.measureText(p).width);
  const totalW = widths.reduce((a, b) => a + b, 0);
  c.translate(subX, subY);
  c.scale(sc, sc);

  c.lineWidth = 8;
  c.strokeStyle = 'rgba(24,24,27,0.96)';
  let px = -totalW / 2;
  for (let i = 0; i < parts.length; i++) {
    c.strokeText(parts[i], px, 0);
    px += widths[i];
  }

  c.shadowColor = 'rgba(0,0,0,0.45)';
  c.shadowBlur = 8;
  px = -totalW / 2;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const isShock = shockRe.test(p);
    const isKw = !isShock && kwExactRe.test(p);
    c.fillStyle = isShock ? '#FB7185' : (isKw ? '#FFFFFF' : '#FEF08A');
    c.fillText(p, px, 0);
    px += widths[i];
  }
  c.restore();
}

// Non-intrusive 2.2s silent Visual CTA inside 9:16 Safe Active Zone (replaces retention-killing cliché outro)
function drawShortsEndingCTA(c, s, lt, t = 0, totalDur = 0) {
  if (typeof window === 'undefined' || !window.SHORTS_MODE || window.__HIDE_HUD) return;
  let remSec = null;
  if (typeof window.__SHORTS_REM_SEC === 'number') {
    remSec = window.__SHORTS_REM_SEC;
  } else if (s && s.visualCta) {
    remSec = Math.max(0, Number(s.dur || 0) - lt);
  } else if (totalDur > 0) {
    remSec = Math.max(0, totalDur - t);
  }
  if (remSec === null || remSec > 2.25 || remSec < 0.04) return;

  const elapsed = 2.25 - remSec;
  const a = clamp(prog(elapsed, 0, 0.25)) * clamp(remSec / 0.12);
  if (a <= 0.02) return;

  const isFollow = window.__SHORTS_IS_FINAL === false;
  const badgeTxt = isFollow ? '+ ติดตาม' : '▶ คลิปเต็ม';
  const label = (s && s.visualCta) || window.__SHORTS_CTA_TEXT || (isFollow
    ? 'กดติดตามรอตอนจบ · คลิปเต็มหน้าช่อง'
    : 'ดูเรื่องเต็มแบบไม่ตัด ที่คลิปยาวด้านล่าง');

  const x = 68;
  const y = 1544;
  const h = 44;
  const arrowBounce = Math.sin(elapsed * 11) * 4;
  const badgeW = Math.ceil(measure(c, badgeTxt, 17, 800)) + 22;
  const arrowZone = 26;
  const lblSz = fitTextSize(c, label, 840 - badgeW - arrowZone - 32, 18, 13, 800);
  const lblW = Math.ceil(measure(c, label, lblSz, 800));
  const boxW = Math.min(846, badgeW + lblW + arrowZone + 28);

  c.save();
  c.globalAlpha = a;
  c.shadowColor = 'rgba(0,0,0,0.45)';
  c.shadowBlur = 14;
  c.fillStyle = 'rgba(24, 24, 27, 0.90)';
  rr(c, x, y, boxW, h, 10);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = '#FACC15';
  c.lineWidth = 2.2;
  rr(c, x, y, boxW, h, 10);
  c.stroke();

  c.fillStyle = '#EF4444';
  rr(c, x + 5, y + 5, badgeW, h - 10, 7);
  c.fill();
  txt(c, badgeTxt, x + 5 + badgeW / 2, y + 28, 17, '#FFFFFF', 800, 'center');

  txt(c, label, x + badgeW + 16, y + 28.5, lblSz, '#FFFFFF', 800, 'left');
  txt(c, '▼', x + boxW - 18, y + 29 + arrowBounce, 18, '#FACC15', 900, 'center');
  c.restore();
}
