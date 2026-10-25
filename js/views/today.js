/* Istiqomat — Today: greeting, HUD, stories, progress, weekend boss, quests, quote, weekend plan, to-dos. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX, A = IST.A, UI = IST.UI, CH = IST.CH, T = IST.T;
  var V = IST.V = IST.V || {};
  var h = U.h;
  var quoteView = {};   /* which of today's 4 quotes is on screen (per date) */

  V.today = function (root) {
    var d = D.today(), c = M.counts(d), o = M.overall(), x = M.xp(), g = M.game(d);
    root.appendChild(header(d, x));
    root.appendChild(hud(d, o, x, g));
    root.appendChild(IST.Stories.row(d));
    var a = h('div', { class: 'col-a' }), b = h('div', { class: 'col-b' });
    a.appendChild(progressCard(d, c, x));
    a.appendChild(questList(d));
    var boss = M.bossOn(d); if (boss) a.appendChild(bossCard(d, boss));
    b.appendChild(quoteCard(d));
    var wp = weekendPlanCard(d); if (wp) b.appendChild(wp);
    b.appendChild(tasksCard(d));
    root.appendChild(h('div', { class: 'two-col' }, a, b));
  };

  function header(d, x) {
    var hij = D.hijri(d);
    return h('header', { class: 'page-head t-head' },
      h('div', { class: 't-greet' },
        h('p', { class: 't-salam' }, 'Assalomu alaykum,'),
        h('h1', { class: 't-name' }, S.state.profile.name || 'friend'),
        h('p', { class: 't-date' }, D.label(d, 'long'), hij ? h('span', { class: 't-hijri' }, ' · ' + hij) : null)),
      h('button', { class: 't-level', type: 'button', onclick: function () { IST.App.go('me'); }, 'aria-label': 'Level ' + x.level + ', ' + x.name.en + '. Open profile' },
        UI.levelStar(x.level, 54),
        h('span', { class: 't-level-name' }, x.name.en)));
  }

  function hud(d, o, x, g) {
    var shields = h('span', { class: 'hud-shields', title: 'Streak shields' });
    for (var i = 0; i < 2; i++) shields.appendChild(h('span', { class: 'shield' + (i < o.shields ? ' on' : '') }, C.icon('shield', 15)));
    var streak = h('button', { class: 'hud-item hud-streak' + (o.todayOK ? ' lit' : ''), type: 'button', onclick: function () { streakInfo(o); } },
      h('span', { class: 'hud-ico flame' }, C.icon('flame', 22)),
      h('span', { class: 'hud-text' }, h('b', { class: 'hud-num' }, String(o.streak)), h('span', { class: 'hud-lbl' }, o.streak === 1 ? 'day streak' : 'day streak')),
      shields);
    var xpEl = h('button', { class: 'hud-item hud-xp', type: 'button', onclick: function () { IST.App.go('me'); } },
      h('span', { class: 'hud-ico bolt' }, C.icon('bolt', 22)),
      h('span', { class: 'hud-text' }, h('b', { class: 'hud-num' }, '+' + x.today), h('span', { class: 'hud-lbl' }, 'XP today')),
      h('span', { class: 'hud-bar', title: (x.need - x.into) + ' XP to level ' + (x.level + 1) }, h('i', { style: { width: Math.round(x.pct * 100) + '%' } })));
    var gameEl = h('button', { class: 'hud-item hud-game' + (g.unlocked ? ' open' : '') + (g.running ? ' running' : ''), type: 'button', onclick: function () { T.gameToggle(); }, 'aria-label': 'Game Pass' },
      h('span', { class: 'hud-ico pad' }, C.icon(g.unlocked ? 'gamepad' : 'lock', 22)),
      h('span', { class: 'hud-text' },
        h('b', { class: 'hud-num' }, g.unlocked ? Math.floor(g.remaining) + 'm' : g.need + ' left'),
        h('span', { class: 'hud-lbl' }, g.running ? 'playing · tap to stop' : g.unlocked ? 'game time' : 'to unlock games')));
    return h('div', { class: 'hud' }, streak, xpEl, gameEl);
  }

  function streakInfo(o) {
    var body = h('div', { class: 'stack' },
      h('div', { class: 'big-stat' }, h('span', { class: 'big-num' }, String(o.streak)), h('span', null, 'day streak · best ' + o.best)),
      h('p', null, 'A day counts when at least ' + M.threshold() + ' of your ' + M.habits().length + ' quests are done (minimum versions and rest days count).'),
      h('p', null, h('b', null, 'Shields: ' + o.shields + ' of 2. '), 'If a day falls short, a shield is used instead of breaking the streak — but never two days in a row. You start with one and earn another every 7 streak days.'),
      h('p', { class: 'muted' }, 'Perfect-day streak: ' + o.perfect + ' · best ' + o.bestPerfect));
    UI.sheet('Your streak', body);
  }

  function progressCard(d, c, x) {
    var n = M.nudge(), wk = D.isWeekend(d);
    var ring = CH.ring(c.total ? c.sat / c.total : 0, 92, 10, 'ring-main', h('div', { class: 'ring-num' }, h('b', null, String(c.sat)), h('span', null, '/' + c.total)));
    return h('section', { class: 'card prog-card tone-' + n.tone },
      ring,
      h('div', { class: 'prog-text' },
        h('h2', { class: 'prog-title' }, c.total && c.sat === c.total ? 'Perfect day' : c.sat + ' of ' + c.total + ' quests done'),
        h('p', { class: 'prog-nudge' }, n.text),
        h('div', { class: 'chips' },
          wk ? UI.chip('2× XP weekend', 'chip-gold') : null,
          !M.dayOK(d) ? UI.chip((M.threshold() - c.sat) + ' more keeps your streak', 'chip-soft') : UI.chip('Streak safe today', 'chip-min'),
          c.min ? UI.chip(c.min + ' at minimum', 'chip-soft') : null)));
  }

  function bossCard(d, b) {
    var left = b.hp - b.hits;
    var card = h('section', { class: 'card boss-card' + (b.defeated ? ' defeated' : '') },
      h('div', { class: 'boss-top' },
        h('span', { class: 'boss-ico' }, C.icon('sword', 24)),
        h('div', null,
          h('p', { class: 'kicker' }, b.preview ? "Tomorrow's weekend boss" : b.defeated ? 'Weekend boss · defeated' : 'Weekend boss'),
          h('h2', { class: 'boss-name' }, b.boss.name))),
      h('p', { class: 'boss-line' }, b.boss.line),
      IST.Stories.bossBar(b),
      h('p', { class: 'boss-foot' }, b.preview ? 'Plan Saturday and Sunday below. Every quest you finish is one hit; ' + b.hp + ' hits win.'
        : b.defeated ? 'Defeated. +100 XP and a step toward Monster Hunter.' : left + ' hit' + (left === 1 ? '' : 's') + ' to go. Each quest is a hit, and weekend XP is doubled.'));
    return card;
  }

  function questList(d) {
    var hs = M.habits().slice();
    hs.sort(function (a, b) { return (M.planTime(a, d) || '99').localeCompare(M.planTime(b, d) || '99'); });
    var list = h('div', { class: 'quests' });
    hs.forEach(function (hid) { list.appendChild(questCard(d, hid)); });
    return h('section', { class: 'quest-sec' }, UI.section("Today's quests", h('button', { class: 'link-btn', type: 'button', onclick: function () { IST.App.go('me', 'habits'); } }, 'Edit'), D.isWeekend(d) ? 'Minimum versions count fully on weekends.' : 'Tap the circle when it is done. Tap the card for options.'), list);
  }

  function questCard(d, hid) {
    var hab = M.habit(hid), s = M.status(d, hid), rec = S.logGet(d, hid) || {}, hs = M.habitStreak(hid), str = M.strength(hid).score;
    var isDone = s === 'done' || s === 'min' || s === 'rest', time = M.planTime(hid, d);
    var check = h('button', { class: 'q-check', type: 'button', 'aria-pressed': isDone ? 'true' : 'false', 'aria-label': isDone ? hab.name + ' done. Open options' : 'Mark ' + hab.name + ' done',
      onclick: function (e) { e.stopPropagation(); if (!A.toggleQuick(hid, check)) V.habitSheet(hid); } },
      C.icon(s === 'rest' ? 'moon' : 'check', 26));
    var running = T.active();
    return h('article', { class: 'quest h-' + hid + ' s-' + s },
      h('button', { class: 'q-main', type: 'button', onclick: function () { V.habitSheet(hid); }, 'aria-label': hab.name + ' options' },
        UI.habitTile(hid, 48, isDone),
        h('span', { class: 'q-body' },
          h('span', { class: 'q-row1' },
            h('span', { class: 'q-name' }, hab.name),
            time ? h('span', { class: 'q-time' }, D.fmtTime(time)) : null,
            s === 'min' ? UI.chip('minimum', 'chip-min') : s === 'rest' ? UI.chip('rest day', 'chip-rest') : null,
            running && running.hid === hid ? UI.chip('timer on', 'chip-live') : null),
          h('span', { class: 'q-line' }, M.todayLine(hid, d)),
          h('span', { class: 'q-meta' },
            h('span', { class: 'q-streak' + (hs.cur ? ' hot' : '') }, C.icon('flame', 14), hs.cur + ' day' + (hs.cur === 1 ? '' : 's')),
            h('span', { class: 'q-str', title: 'Habit strength' }, h('i', { class: 'q-str-bar' }, h('b', { style: { width: Math.round(str * 100) + '%' } })), Math.round(str * 100) + '%'),
            !isDone && rec.m ? h('span', { class: 'q-partial' }, rec.m + ' min so far') : null))),
      check);
  }

  /* ---------- quest sheet ---------- */
  V.habitSheet = function (hid, focus) {
    var d = D.today(), hab = M.habit(hid), s = M.status(d, hid), rec = S.logGet(d, hid) || {}, hs = M.habitStreak(hid), str = M.strength(hid);
    var sh;
    var body = h('div', { class: 'stack hsheet h-' + hid });
    body.appendChild(h('div', { class: 'hs-top' }, UI.habitTile(hid, 52, s !== 'none'),
      h('div', null, h('p', { class: 'hs-line' }, M.todayLine(hid, d)), h('p', { class: 'muted small' }, 'When: ' + M.anchor(hid, d) + ' · ' + D.fmtTime(M.planTime(hid, d))))));
    var acts = h('div', { class: 'hs-acts' });
    function act(label, sub, icon, cls, fn) {
      var b = h('button', { class: 'hs-act ' + (cls || ''), type: 'button', onclick: function () { fn(b); } }, C.icon(icon, 22), h('span', null, h('b', null, label), sub ? h('small', null, sub) : null));
      acts.appendChild(b); return b;
    }
    if (s !== 'done') act('Done', hab.targetText, 'check', 'primary', function (b) { var ex = {}; if (hid === 'book') ex.p = hab.target; else ex.m = Math.max(rec.m || 0, hab.target); A.setHabit(hid, 'done', ex, b); sh.close(); });
    if (hab.min && s !== 'min') act('Minimum version', hab.minText, 'feather', '', function (b) { var ex = {}; if (hid === 'book') ex.p = hab.min; else ex.m = Math.max(rec.m || 0, hab.min); A.setHabit(hid, 'min', ex, b); sh.close(); });
    if (hab.rest && s !== 'rest') act('Rest day', 'Planned rest — keeps your streak', 'moon', '', function (b) { A.setHabit(hid, 'rest', {}, b); FX.toast('Rest day logged. Recover well.', { icon: 'moon' }); sh.close(); });
    if (hab.unit === 'min') act('Start ' + hab.target + '-min timer', 'Logs the minutes when you finish', 'timer', '', function () { sh.close(); T.start(hid, hab.target); });
    if (s !== 'none') act('Undo', 'Mark as not done', 'undo', 'ghost', function (b) { A.setHabit(hid, 'none', null, b); sh.close(); });
    body.appendChild(acts);

    /* details */
    var det = h('div', { class: 'hs-details' });
    if (hid === 'book') {
      var total = h('input', { type: 'number', inputmode: 'numeric', min: 0, id: 'bk-total', value: hab.total || '', placeholder: 'e.g. 320' });
      var page = h('input', { type: 'number', inputmode: 'numeric', min: 0, id: 'bk-page', value: hab.page || '', placeholder: 'e.g. 54' });
      det.appendChild(h('div', { class: 'grid2' }, UI.field('I am now on page', page), UI.field('Pages in the book', total)));
      det.appendChild(h('button', { class: 'btn btn-primary', type: 'button', onclick: function (e) {
        var np = +page.value || 0, tot = +total.value || 0, read = Math.max(0, np - (hab.page || 0));
        S.habitSet('book', { page: np, total: tot });
        if (read > 0) {
          var already = (S.logGet(d, 'book') || {}).p || 0, sum = (M.status(d, 'book') !== 'none' ? already : 0) + read;
          A.setHabit('book', sum >= hab.target ? 'done' : sum >= (hab.min || 1) ? 'min' : 'done', { p: sum }, e.currentTarget);
          FX.toast(read + ' pages read today' + (tot ? ' · ' + Math.max(0, tot - np) + ' to the end' : ''), { icon: 'book', tone: 'good' });
        } else FX.toast('Saved.', { icon: 'book' });
        sh.close();
      } }, 'Save progress'));
      if (focus === 'pages') setTimeout(function () { page.focus(); }, 300);
    } else if (hab.unit === 'min') {
      var mins = h('input', { type: 'number', inputmode: 'numeric', min: 0, id: 'hs-min', value: rec.m || '', placeholder: String(hab.target) });
      det.appendChild(h('div', { class: 'row gap end-wrap' }, UI.field('Minutes today', mins), h('button', { class: 'btn', type: 'button', onclick: function (e) {
        var m = +mins.value || 0; if (!m) return;
        if (m >= hab.target) A.setHabit(hid, 'done', { m: m }, e.currentTarget);
        else if (hab.min && m >= hab.min) A.setHabit(hid, 'min', { m: m }, e.currentTarget);
        else { S.logSet(d, hid, { m: m }); FX.toast(m + ' min saved — ' + ((hab.min || hab.target) - m) + ' more to check it off.', { icon: 'timer' }); }
        sh.close();
      } }, 'Save')));
    }
    if (hid === 'quran') {
      var mark = h('input', { type: 'text', id: 'qr-mark', value: hab.mark || '', placeholder: 'e.g. Al-Baqarah 2:142 or page 23' });
      det.appendChild(h('div', { class: 'row gap end-wrap' }, UI.field('Where you stopped', mark), h('button', { class: 'btn', type: 'button', onclick: function () { S.habitSet('quran', { mark: mark.value.trim() }); FX.toast('Bookmark saved.', { icon: 'bookmark' }); sh.close(); } }, 'Save')));
    }
    if (hid === 'workout') {
      det.appendChild(h('div', { class: 'row gap wrap' },
        h('span', { class: 'muted' }, hab.plan + (hab.planDays ? ' · Day ' + Math.min(hab.day || 1, hab.planDays) + ' of ' + hab.planDays : '')),
        h('button', { class: 'btn btn-small', type: 'button', onclick: function () { S.habitSet('workout', { day: Math.max(1, (hab.day || 1) - 1) }); sh.close(); V.habitSheet('workout'); } }, '− day'),
        h('button', { class: 'btn btn-small', type: 'button', onclick: function () { S.habitSet('workout', { day: (hab.day || 1) + 1 }); sh.close(); V.habitSheet('workout'); } }, '+ day')));
    }
    if (det.childNodes.length) body.appendChild(det);

    /* links */
    var links = h('div', { class: 'row gap wrap' });
    if (hid === 'korean') links.appendChild(h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { sh.close(); IST.App.go('korean'); } }, C.icon('hangul', 18), "Open today's session"));
    if (hid === 'korean') links.appendChild(h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { sh.close(); IST.V.flashcards(); } }, C.icon('cards', 18), 'Flashcards'));
    if (hid === 'workout') links.appendChild(UI.extLink(C.homeWorkoutUrl, 'Open Home Workout', 'btn btn-soft'));
    if (hid === 'quran') links.appendChild(UI.extLink(C.quranUrl, 'Open Quran.com', 'btn btn-soft'));
    if (hid === 'youtube') links.appendChild(h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { sh.close(); IST.App.go('tasks', 'videos'); } }, C.icon('play', 18), 'Video board'));
    if (links.childNodes.length) body.appendChild(links);

    /* mini stats: last 14 days */
    var dots = h('div', { class: 'dots14', 'aria-label': 'Last 14 days' });
    for (var i = 13; i >= 0; i--) {
      var dd = D.add(d, -i), ss = dd < M.startDate() ? 'pre' : M.status(dd, hid);
      dots.appendChild(h('i', { class: 'dot s-' + ss + (dd === d ? ' today' : ''), title: D.label(dd) + ': ' + (ss === 'pre' ? '—' : ss) }));
    }
    body.appendChild(h('div', { class: 'hs-stats' },
      h('div', null, h('b', null, String(hs.cur)), h('span', null, 'streak')),
      h('div', null, h('b', null, String(hs.best)), h('span', null, 'best')),
      h('div', null, h('b', null, Math.round(str.score * 100) + '%'), h('span', null, 'strength')),
      dots));
    if (hab.stretch) body.appendChild(h('p', { class: 'muted small' }, 'Stretch goal: ' + hab.stretch));
    sh = UI.sheet(hab.name, body);
  };

  /* ---------- quote ---------- */
  function quoteCard(d) {
    var Q = IST.data.quotes, qd = M.quotesFor(d);
    var vi = quoteView[d] != null ? Math.min(quoteView[d], qd.k) : qd.k;
    var q = Q[qd.list[vi]];
    var left = 3 - qd.k, fav = M.isFav(q.id);
    var dots = h('div', { class: 'q-dots', role: 'tablist', 'aria-label': "Today's quotes" });
    for (var i = 0; i < 4; i++) {
      (function (k) {
        dots.appendChild(h('button', { class: 'q-dot' + (k === vi ? ' on' : '') + (k > qd.k ? ' locked' : ''), type: 'button', role: 'tab', 'aria-label': 'Quote ' + (k + 1), disabled: k > qd.k,
          onclick: function () { quoteView[d] = k; IST.App.render(); } }));
      })(i);
    }
    return h('section', { class: 'card quote-card ' + (q.t === 'q' ? 'is-quran' : 'is-hadith') },
      h('div', { class: 'qc-top' },
        h('p', { class: 'kicker' }, q.t === 'q' ? "Qur'an · " + q.src : 'Hadith · ' + q.src),
        h('button', { class: 'icon-btn' + (fav ? ' on' : ''), type: 'button', 'aria-label': fav ? 'Remove from saved' : 'Save quote', 'aria-pressed': fav ? 'true' : 'false',
          onclick: function () { var on = S.favToggle(q.id); FX.sound('tap'); FX.toast(on ? 'Saved to your collection.' : 'Removed from saved.', { icon: 'bookmark' }); } }, C.icon('bookmark', 20))),
      q.ar && S.state.settings.showArabic !== false ? h('p', { class: 'qc-ar', lang: 'ar', dir: 'rtl' }, q.ar) : null,
      h('blockquote', { class: 'qc-en' }, q.en),
      h('div', { class: 'qc-foot' },
        h('a', { class: 'qc-ref', href: q.url, target: '_blank', rel: 'noopener noreferrer' }, q.ref + (q.grade ? ' · ' + q.grade : ''), C.icon('ext', 13)),
        dots,
        h('button', { class: 'btn btn-small btn-soft', type: 'button', disabled: left <= 0, onclick: function () {
          S.quoteSet(d, { k: qd.k + 1 }); quoteView[d] = qd.k + 1; FX.sound('flip');
        } }, C.icon('repeat', 16), left > 0 ? 'Another (' + left + ' left)' : 'See you tomorrow')),
      h('p', { class: 'qc-note' }, 'English gives the meaning; the reference opens the full translation on ' + (q.t === 'q' ? 'Quran.com' : 'Sunnah.com') + '.'));
  }

  /* ---------- weekend planner (Friday → Sunday) ---------- */
  function weekendPlanCard(d) {
    var w = D.dow(d); if (w < 4) return null;
    var days = w === 4 ? [D.add(d, 1), D.add(d, 2)] : w === 5 ? [d, D.add(d, 1)] : [d];
    var planned = days.every(function (dd) { var p = S.state.wplan[dd]; return p && p.times && Object.keys(p.times).length; });
    var card = h('section', { class: 'card plan-card' });
    card.appendChild(UI.section(planned ? 'Weekend plan' : 'Plan your weekend', null, planned ? 'Your quests have times. Phone and games come after.' : 'Weekends slip when nothing has a time. Give each quest one — it roughly doubles follow-through.'));
    var grid = h('div', { class: 'plan-grid', style: { gridTemplateColumns: 'minmax(0,1.3fr) ' + days.map(function () { return 'minmax(0,1fr)'; }).join(' ') } });
    grid.appendChild(h('span'));
    days.forEach(function (dd) { grid.appendChild(h('span', { class: 'plan-day' }, D.dayNames[D.dow(dd)])); });
    var inputs = [];
    M.habits().forEach(function (hid) {
      grid.appendChild(h('span', { class: 'plan-h' }, UI.habitTile(hid, 26), M.habit(hid).name));
      days.forEach(function (dd) {
        var inp = h('input', { type: 'time', id: 'wp-' + hid + '-' + dd, value: M.planTime(hid, dd), 'aria-label': M.habit(hid).name + ' on ' + D.dayNames[D.dow(dd)] });
        inputs.push({ hid: hid, d: dd, el: inp }); grid.appendChild(inp);
      });
    });
    card.appendChild(grid);
    card.appendChild(h('div', { class: 'row gap end' }, h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
      inputs.forEach(function (x) { S.wplanSet(x.d, x.hid, x.el.value); });
      IST.App.render(true, true);
      FX.sound('check'); FX.toast('Weekend plan saved. Quests are now sorted by your times.', { icon: 'calendar', tone: 'good' });
    } }, planned ? 'Update plan' : 'Save plan')));
    return card;
  }

  /* ---------- to-dos ---------- */
  function tasksCard(d) {
    var all = Object.keys(S.state.tasks).map(function (k) { return S.state.tasks[k]; }).filter(function (t) { return !t.del; });
    var open = all.filter(function (t) { return !t.done && t.due && t.due <= d; }).sort(function (a, b) { return (a.due < b.due ? -1 : a.due > b.due ? 1 : (b.pr || 0) - (a.pr || 0)); });
    var doneToday = all.filter(function (t) { return t.done && D.of(t.done) === d; });
    var list = h('div', { class: 'tlist' });
    open.slice(0, 7).forEach(function (t) { list.appendChild(V.taskRow(t, d)); });
    doneToday.slice(0, 4).forEach(function (t) { list.appendChild(V.taskRow(t, d)); });
    if (!open.length && !doneToday.length) list.appendChild(UI.empty('Nothing due today. Add a to-do below.', 'tasks'));
    var input = h('input', { type: 'text', id: 'today-add', placeholder: 'Add a to-do for today…', autocomplete: 'off', maxlength: 140 });
    var form = h('form', { class: 'quick-add', onsubmit: function (e) {
      e.preventDefault(); var t = input.value.trim(); if (!t) return;
      S.taskAdd({ t: t, due: d }); input.value = ''; FX.sound('tap');
      IST.App.renderKeep('today-add');
    } }, input, h('button', { class: 'btn btn-primary btn-icon', type: 'submit', 'aria-label': 'Add to-do' }, C.icon('plus', 20)));
    var more = open.length > 7 ? open.length - 7 : 0;
    return h('section', { class: 'card tasks-card' },
      UI.section('To-do today', h('button', { class: 'link-btn', type: 'button', onclick: function () { IST.App.go('tasks'); } }, 'All tasks'), open.length ? open.length + ' open' + (more ? ' · ' + more + ' more in Tasks' : '') : null),
      list, form);
  }

  V.taskRow = function (t, d) {
    var overdue = !t.done && t.due && t.due < d;
    var box = h('button', { class: 'tcheck' + (t.done ? ' on' : ''), type: 'button', 'aria-label': (t.done ? 'Mark not done: ' : 'Complete: ') + t.t, onclick: function (e) { e.stopPropagation(); A.taskToggle(t.id, box); } }, C.icon('check', 16));
    return h('div', { class: 'trow' + (t.done ? ' done' : '') + (t.pr ? ' prio' : '') },
      box,
      h('button', { class: 'ttext', type: 'button', onclick: function () { V.taskSheet && V.taskSheet(t.id); } },
        h('span', { class: 'ttitle' }, t.t),
        h('span', { class: 'tmeta' },
          t.pr ? h('span', { class: 'tprio' }, 'High') : null,
          t.tag ? h('span', { class: 'ttag' }, (C.taskTags.filter(function (x) { return x.id === t.tag; })[0] || { name: t.tag }).name) : null,
          t.due ? h('span', { class: overdue ? 'tdue late' : 'tdue' }, overdue ? 'Overdue · ' + D.label(t.due, 'md') : D.rel(t.due)) : h('span', { class: 'tdue' }, 'Someday'))));
  };
})();
