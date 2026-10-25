/* Istiqomat — feedback: confetti, floating XP, toasts, sounds (synthesised, no files) and celebrations. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, C = IST.C;
  var FX = IST.FX = {};
  var h = U.h;

  /* ---------- layer ---------- */
  function layer() {
    var l = document.getElementById('fx-layer');
    if (!l) { l = h('div', { id: 'fx-layer', 'aria-hidden': 'true' }); document.body.appendChild(l); }
    return l;
  }

  /* ---------- confetti (canvas) ---------- */
  FX.confetti = function (x, y, opts) {
    if (U.reducedMotion()) return;
    opts = opts || {};
    var cv = h('canvas', { class: 'fx-canvas' });
    layer().appendChild(cv);
    var dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var css = getComputedStyle(document.documentElement);
    var cols = ['--accent', '--gold', '--rose', '--h-korean', '--h-book', '--h-quran'].map(function (v) { return css.getPropertyValue(v).trim() || '#35d0c0'; });
    if (opts.color) cols.unshift(opts.color, opts.color);
    var n = opts.n || 70, P = [];
    x = x == null ? W / 2 : x; y = y == null ? H / 3 : y;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * (opts.big ? 9 : 6);
      P.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.big ? 6 : 4), r: 3 + Math.random() * 4, c: cols[i % cols.length],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, shape: i % 3 });
    }
    var t0 = performance.now(), life = opts.big ? 2200 : 1500;
    (function frame(t) {
      var k = (t - t0) / life;
      ctx.clearRect(0, 0, W, H);
      P.forEach(function (p) {
        p.vy += 0.22; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.shape === 0) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        else if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.r * 0.7, 0, 6.283); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r, p.r); ctx.lineTo(-p.r, p.r); ctx.fill(); }
        ctx.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  };

  /* ---------- floating "+10 XP" ---------- */
  FX.float = function (x, y, text, cls) {
    var el = h('div', { class: 'fx-float ' + (cls || ''), style: { left: x + 'px', top: y + 'px' } }, text);
    layer().appendChild(el);
    setTimeout(function () { el.remove(); }, 1400);
  };
  FX.at = function (el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ---------- toasts ---------- */
  FX.toast = function (text, opts) {
    opts = opts || {};
    var t = h('div', { class: 'toast ' + (opts.tone || ''), role: 'status' },
      opts.icon ? C.icon(opts.icon, 18) : null,
      h('span', { class: 'toast-text' }, text),
      opts.action ? h('button', { class: 'toast-act', type: 'button', onclick: function () { opts.action.fn(); kill(); } }, opts.action.label) : null);
    var box = document.getElementById('toasts');
    if (!box) { box = h('div', { id: 'toasts' }); document.body.appendChild(box); }
    box.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    var timer = setTimeout(kill, opts.ms || 2800);
    function kill() { clearTimeout(timer); t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }
    return kill;
  };

  /* ---------- sounds ---------- */
  var AC = null;
  function ac() {
    if (IST.S && IST.S.state.settings.sounds === false) return null;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; }
  }
  function tone(ctx, f, t, d, type, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.16, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d + 0.02);
  }
  FX.sound = function (kind) {
    var ctx = ac(); if (!ctx) return;
    var t = ctx.currentTime;
    if (kind === 'check') { tone(ctx, 660, t, 0.14, 'triangle'); tone(ctx, 990, t + 0.08, 0.22, 'sine'); }
    else if (kind === 'min') { tone(ctx, 520, t, 0.16, 'triangle'); }
    else if (kind === 'undo') { tone(ctx, 440, t, 0.1, 'sine', 0.08); tone(ctx, 330, t + 0.07, 0.12, 'sine', 0.08); }
    else if (kind === 'perfect' || kind === 'level') { [523, 659, 784, 1047].forEach(function (f, i) { tone(ctx, f, t + i * 0.09, 0.32, 'triangle', 0.14); }); }
    else if (kind === 'gift') { [1175, 1568, 1319, 1760].forEach(function (f, i) { tone(ctx, f, t + i * 0.06, 0.18, 'sine', 0.1); }); }
    else if (kind === 'flip') { tone(ctx, 880, t, 0.06, 'sine', 0.05); }
    else if (kind === 'good') { tone(ctx, 784, t, 0.12, 'sine', 0.1); }
    else if (kind === 'again') { tone(ctx, 300, t, 0.14, 'sine', 0.08); }
    else if (kind === 'boss') { [196, 247, 294, 392].forEach(function (f, i) { tone(ctx, f, t + i * 0.1, 0.4, 'sawtooth', 0.06); }); }
    else if (kind === 'tap') { tone(ctx, 1200, t, 0.04, 'sine', 0.04); }
  };

  /* ---------- celebrations (level up, badge, boss) ---------- */
  var queue = [], showing = false;
  FX.celebrate = function (item) { queue.push(item); if (!showing) next(); };
  function next() {
    var it = queue.shift(); if (!it) { showing = false; return; }
    showing = true;
    var star = h('@svg', { viewBox: '0 0 120 120', class: 'cele-star', width: 120, height: 120 },
      h('@path', { d: C.starPath(60, 60, 54), class: 'cele-star-bg' }),
      h('@path', { d: C.starPath(60, 60, 42), class: 'cele-star-in' }));
    var iconWrap = h('div', { class: 'cele-icon' }, it.big ? h('span', { class: 'cele-big' }, it.big) : C.icon(it.icon || 'star', 40));
    var box = h('div', { class: 'cele', role: 'dialog', 'aria-modal': 'true', 'aria-label': it.title },
      h('div', { class: 'cele-card' },
        h('div', { class: 'cele-kicker' }, it.kicker || 'Achievement unlocked'),
        h('div', { class: 'cele-art' }, star, iconWrap),
        h('h2', { class: 'cele-title' }, it.title),
        it.text ? h('p', { class: 'cele-text' }, it.text) : null,
        it.xp ? h('div', { class: 'cele-xp' }, '+' + it.xp + ' XP') : null,
        h('button', { class: 'btn btn-primary', type: 'button', onclick: close }, it.button || 'Alhamdulillah')));
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('in'); });
    FX.sound(it.sound || 'level'); U.vibrate([30, 40, 60]);
    setTimeout(function () { FX.confetti(null, window.innerHeight * 0.35, { big: true, n: 110 }); }, 150);
    function close() { box.classList.remove('in'); setTimeout(function () { box.remove(); next(); }, 250); }
  }
})();
