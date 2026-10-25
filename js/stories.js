/* Istiqomat — daily "stories": quote, Korean word, yesterday, your week, weekend boss, tip.
   Tap a circle to watch; tap right/left to move, hold to pause. Seen state is per device. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX, UI = IST.UI, CH = IST.CH;
  var ST = IST.Stories = {};
  var h = U.h;
  var SEEN = 'istiqomat.seen';

  function seenMap() { return U.ls.getJSON(SEEN, {}); }
  function markSeen(d, id) {
    var m = seenMap(); m[d] = m[d] || {}; m[d][id] = 1;
    Object.keys(m).forEach(function (k) { if (k < D.add(d, -7)) delete m[k]; });
    U.ls.setJSON(SEEN, m);
  }

  ST.speak = function (text, lang) {
    try {
      if (!window.speechSynthesis) { FX.toast('Speech is not available in this browser.', { icon: 'volume' }); return; }
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || 'ko-KR'; u.rate = 0.85;
      var vs = speechSynthesis.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf((lang || 'ko').slice(0, 2)) === 0; });
      if (vs.length) u.voice = vs.filter(function (v) { return /natural|google|sunhi|heami|yuna/i.test(v.name); })[0] || vs[0];
      speechSynthesis.speak(u);
    } catch (e) { FX.toast('Speech is not available here.', { icon: 'volume' }); }
  };
  try { if (window.speechSynthesis) speechSynthesis.getVoices(); } catch (e) { /* warm voices */ }

  ST.list = function (d) {
    var out = [], Q = IST.data.quotes, qd = M.quotesFor(d), q = Q[qd.list[qd.k]];
    out.push({ id: 'quote', label: q.t === 'q' ? 'Ayah' : 'Hadith', icon: q.t === 'q' ? 'quran' : 'bookmark', cls: 'st-quote', render: function (box) {
      box.appendChild(h('div', { class: 'st-kicker' }, q.t === 'q' ? "Qur'an · " + q.src : 'Hadith · ' + q.src));
      if (q.ar && S.state.settings.showArabic !== false) box.appendChild(h('p', { class: 'st-ar', lang: 'ar', dir: 'rtl' }, q.ar));
      box.appendChild(h('p', { class: 'st-en' }, '“' + q.en + '”'));
      box.appendChild(h('a', { class: 'st-ref', href: q.url, target: '_blank', rel: 'noopener noreferrer' }, q.ref + (q.grade ? ' · ' + q.grade : ''), C.icon('ext', 14)));
    } });
    var w = M.wordOfDay(d);
    if (w) out.push({ id: 'word', label: '한국어', icon: 'hangul', cls: 'st-word', render: function (box) {
      box.appendChild(h('div', { class: 'st-kicker' }, 'Korean word of the day · Unit ' + w.u));
      box.appendChild(h('p', { class: 'st-hangul', lang: 'ko' }, w.ko));
      box.appendChild(h('p', { class: 'st-mean' }, w.en));
      box.appendChild(h('button', { class: 'btn btn-glass', type: 'button', onclick: function (e) { e.stopPropagation(); ST.speak(w.ko); } }, C.icon('volume', 18), 'Listen'));
      box.appendChild(h('p', { class: 'st-small' }, 'Fun! Fun! Korean 1 · p. ' + w.p));
    } });
    var y = D.add(d, -1);
    if (y >= M.startDate()) out.push({ id: 'yday', label: 'Yesterday', icon: 'repeat', cls: 'st-yday', render: function (box) {
      var c = M.counts(y), xp = M.xpDay(y).total, perfect = M.isPerfect(y);
      box.appendChild(h('div', { class: 'st-kicker' }, 'Yesterday · ' + D.label(y, 'long')));
      box.appendChild(h('p', { class: 'st-big' }, perfect ? 'Perfect day' : c.sat + ' of ' + c.total + ' quests'));
      var row = h('div', { class: 'st-tiles' });
      M.habits().forEach(function (hid) { row.appendChild(h('div', { class: 'st-tile' }, UI.habitTile(hid, 44, M.sat(y, hid)), h('span', null, M.habit(hid).name))); });
      box.appendChild(row);
      box.appendChild(h('p', { class: 'st-mean' }, '+' + xp + ' XP' + (M.overall().hist[y] === 'shield' ? ' · a shield saved your streak' : '')));
      box.appendChild(h('p', { class: 'st-small' }, perfect ? 'Do it again today.' : c.sat >= M.threshold() ? 'Streak kept. Can today be complete?' : 'Never miss twice: today only needs the minimum versions.'));
    } });
    out.push({ id: 'week', label: 'Week', icon: 'chart', cls: 'st-week', render: function (box) {
      var ws = D.startOfWeek(d), items = [], xp = 0;
      for (var i = 0; i < 7; i++) {
        var dd = D.add(ws, i), future = dd > d, c = M.counts(dd);
        if (!future) xp += M.xpDay(dd).total;
        items.push({ label: D.dayInitial[i], v: future ? null : c.sat, display: future ? '–' : c.sat + '/' + c.total, tip: future ? 'Not yet' : c.sat + ' of ' + c.total + ' quests', tipTitle: D.label(dd), band: i >= 5, strong: dd === d });
      }
      box.appendChild(h('div', { class: 'st-kicker' }, 'This week so far'));
      box.appendChild(h('p', { class: 'st-big' }, '+' + xp + ' XP'));
      var ch = CH.columns(items, { width: 300, height: 150, max: M.habits().length, ticks: [0, M.habits().length], label: 'Quests per day this week' });
      box.appendChild(h('div', { class: 'st-chart' }, ch));
      var r = M.dowRates(D.add(d, -27), d), wd = 0, wdp = 0, we = 0, wep = 0;
      r.forEach(function (x, i) { if (i >= 5) { we += x.sat; wep += x.poss; } else { wd += x.sat; wdp += x.poss; } });
      if (wdp && wep) box.appendChild(h('p', { class: 'st-small' }, 'Last 4 weeks · weekdays ' + U.pct(wd, wdp) + '% · weekends ' + U.pct(we, wep) + '%'));
      else box.appendChild(h('p', { class: 'st-small' }, 'Every bar is one day. Weekends are shaded — that is where the boss lives.'));
    } });
    var b = M.bossOn(d);
    if (b) out.push({ id: 'boss', label: 'Boss', icon: 'sword', cls: 'st-boss', render: function (box) {
      box.appendChild(h('div', { class: 'st-kicker' }, b.preview ? "Tomorrow's weekend boss" : 'Weekend boss'));
      box.appendChild(h('p', { class: 'st-big' }, b.boss.name));
      box.appendChild(h('p', { class: 'st-mean' }, b.boss.line));
      box.appendChild(bossBar(b));
      box.appendChild(h('p', { class: 'st-small' }, b.defeated ? 'Defeated. MashaAllah.' : 'Every quest on Saturday and Sunday is one hit. ' + b.hp + ' hits defeat it. Weekend XP is doubled.'));
    } });
    var tip = C.tips[D.dayIndex(d) % C.tips.length];
    out.push({ id: 'tip', label: 'Tip', icon: 'sparkle', cls: 'st-tip', render: function (box) {
      box.appendChild(h('div', { class: 'st-kicker' }, 'Habit science'));
      box.appendChild(h('p', { class: 'st-big' }, tip.t));
      box.appendChild(h('p', { class: 'st-mean' }, tip.b));
      if (tip.s) box.appendChild(h('p', { class: 'st-small' }, tip.s));
    } });
    return out;
  };

  function bossBar(b) {
    var bar = h('div', { class: 'boss-hp', role: 'img', 'aria-label': (b.hp - b.hits) + ' of ' + b.hp + ' health left' });
    for (var i = 0; i < b.hp; i++) bar.appendChild(h('i', { class: i < b.hp - b.hits ? 'hp-on' : 'hp-off' }));
    return bar;
  }
  ST.bossBar = bossBar;

  ST.row = function (d) {
    var items = ST.list(d), seen = seenMap()[d] || {};
    var row = h('div', { class: 'stories', role: 'list', 'aria-label': 'Daily stories' });
    items.forEach(function (it, i) {
      row.appendChild(h('button', { class: 'story ' + it.cls + (seen[it.id] ? ' seen' : ''), type: 'button', role: 'listitem', onclick: function () { ST.open(i, d); } },
        h('span', { class: 'story-ring' }, h('span', { class: 'story-face' }, C.icon(it.icon, 26))),
        h('span', { class: 'story-label' }, it.label)));
    });
    return row;
  };

  ST.open = function (start, d) {
    var items = ST.list(d), i = start, timer = null, t0 = 0, paused = false, dur = 7000, pausedAt = 0;
    var bars = h('div', { class: 'sv-bars' });
    items.forEach(function () { bars.appendChild(h('span', { class: 'sv-bar' }, h('i'))); });
    var content = h('div', { class: 'sv-content' });
    var ov = h('div', { class: 'sv', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Stories' },
      bars,
      h('button', { class: 'icon-btn sv-close', type: 'button', 'aria-label': 'Close stories', onclick: function (e) { e.stopPropagation(); close(); } }, C.icon('x', 24)),
      content,
      h('div', { class: 'sv-hint' }, 'Tap right for next · left for back · hold to pause'));
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('in'); });
    var downAt = 0, downX = 0, downY = 0;
    ov.addEventListener('pointerdown', function (e) { if (e.target.closest('button, a')) return; downAt = Date.now(); downX = e.clientX; downY = e.clientY; pause(true); });
    ov.addEventListener('pointerup', function (e) {
      if (e.target.closest('button, a')) return;
      var held = Date.now() - downAt > 350; pause(false);
      if (e.clientY - downY > 80) return close();
      if (held) return;
      if (downX < window.innerWidth * 0.3) go(i - 1); else go(i + 1);
    });
    function onKey(e) { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') go(i + 1); else if (e.key === 'ArrowLeft') go(i - 1); }
    document.addEventListener('keydown', onKey);
    function show() {
      var it = items[i];
      CH.hideTip();
      ov.className = 'sv in ' + it.cls;
      U.clear(content); it.render(content);
      markSeen(d, it.id);
      U.$$('.sv-bar', bars).forEach(function (b, k) { b.className = 'sv-bar' + (k < i ? ' done' : k === i ? ' now' : ''); b.firstChild.style.width = k < i ? '100%' : '0%'; });
      t0 = performance.now(); paused = false;
      cancelAnimationFrame(timer); timer = requestAnimationFrame(step);
    }
    function step(t) {
      if (!paused) {
        var k = (t - t0) / dur, bar = bars.children[i] && bars.children[i].firstChild;
        if (bar) bar.style.width = Math.min(100, k * 100) + '%';
        if (k >= 1) return go(i + 1);
      }
      timer = requestAnimationFrame(step);
    }
    function pause(p) {
      if (p && !paused) { paused = true; pausedAt = performance.now(); }
      else if (!p && paused) { paused = false; t0 += performance.now() - pausedAt; }
    }
    function go(n) { if (n < 0) n = 0; if (n >= items.length) return close(); i = n; show(); }
    function close() {
      cancelAnimationFrame(timer); document.removeEventListener('keydown', onKey);
      try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      ov.classList.remove('in'); setTimeout(function () { ov.remove(); IST.App.render(); }, 220);
    }
    show();
  };
})();
