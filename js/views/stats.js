/* Istiqomat — Stats: completion, streaks, strength, weekday vs weekend, calendar, trends, time of day,
   and per-habit numbers (minutes, pages, sessions, words, videos, workouts, tasks, game time, XP). */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, UI = IST.UI, CH = IST.CH;
  var V = IST.V = IST.V || {};
  var h = U.h;
  var period = '30';

  function tile(label, value, sub, cls) {
    return h('div', { class: 'kpi ' + (cls || '') }, h('span', { class: 'kpi-label' }, label), h('span', { class: 'kpi-value' }, value), sub ? h('span', { class: 'kpi-sub' }, sub) : null);
  }
  function card(title, sub, content, cls) { return h('section', { class: 'card stat-card ' + (cls || '') }, UI.section(title, null, sub), content); }

  V.stats = function (root) {
    var today = D.today(), start = M.startDate();
    var from = period === 'all' ? start : D.add(today, -(+period - 1));
    if (from < start) from = start;
    var days = D.range(from, today), o = M.overall(), x = M.xp(), rate = M.rate(from, today);
    root.appendChild(h('header', { class: 'page-head' },
      h('div', null, h('p', { class: 'kicker' }, 'Since ' + D.label(start, 'full')), h('h1', { class: 'page-title' }, 'Stats')),
      UI.seg([{ id: '7', label: '7 days' }, { id: '30', label: '30 days' }, { id: '90', label: '90 days' }, { id: 'all', label: 'All' }], period, function (v) { period = v; IST.App.render(); }, 'seg-sm')));

    var perfect = days.filter(function (d) { return M.isPerfect(d); }).length;
    var xpP = U.sum(days, function (d) { return M.xpDay(d).total; });
    var avgStr = U.avg(M.habits().map(function (hid) { return M.strength(hid).score; }));
    root.appendChild(h('div', { class: 'kpis' },
      tile('Completion', Math.round(rate.pct * 100) + '%', rate.sat + ' of ' + rate.poss + ' quest-days'),
      tile('Streak', String(o.streak), 'best ' + o.best + ' · ' + o.shields + ' shield' + (o.shields === 1 ? '' : 's')),
      tile('Perfect days', String(perfect), 'in ' + days.length + ' day' + (days.length === 1 ? '' : 's')),
      tile('Habit strength', Math.round(avgStr * 100) + '%', 'average of ' + M.habits().length + ' quests'),
      tile('XP earned', U.fmtNum(xpP), 'level ' + x.level + ' · ' + x.name.en),
      tile('Bosses beaten', String(M.bossesDefeated()), 'weekend bosses')));

    var a = h('div', { class: 'col-a' }), b = h('div', { class: 'col-b' });

    /* calendar heatmap: last 26 weeks */
    var hs = D.startOfWeek(D.add(today, -7 * 25));
    var cells = D.range(hs, today).map(function (d) {
      if (d < start) return { d: d, v: null, tip: 'Before you started' };
      var c = M.counts(d); return { d: d, v: c.sat, today: d === today, tip: c.sat + ' of ' + c.total + ' quests' + (M.overall().hist[d] === 'shield' ? ' · shield used' : '') };
    });
    a.appendChild(card('Calendar', 'Quests completed per day', CH.heatmap(cells, { max: M.habits().length, label: 'Quests per day' })));

    /* weekday vs weekend */
    var dr = M.dowRates(from, today), wd = 0, wdp = 0, we = 0, wep = 0;
    dr.forEach(function (r, i) { if (i >= 5) { we += r.sat; wep += r.poss; } else { wd += r.sat; wdp += r.poss; } });
    var cols = dr.map(function (r, i) { return { label: D.dayShort[i], v: r.pct == null ? null : Math.round(r.pct * 100), display: r.pct == null ? '–' : Math.round(r.pct * 100) + '%', tip: r.pct == null ? 'No data yet' : Math.round(r.pct * 100) + '% (' + r.sat + ' of ' + r.poss + ')', tipTitle: D.dayNames[i], band: i >= 5, showValue: r.pct != null }; });
    var gap = wdp && wep ? Math.round(100 * (wd / wdp - we / wep)) : null;
    a.appendChild(card('Weekdays vs weekends', wdp && wep ? 'Weekdays ' + U.pct(wd, wdp) + '% · weekends ' + U.pct(we, wep) + '%' + (gap > 0 ? ' — the gap to close is ' + gap + ' points' : gap < 0 ? ' — weekends are winning' : '') : 'Fills in after your first weekend',
      h('div', { class: 'chart-box' }, CH.columns(cols, { width: 340, height: 170, max: 100, ticks: [0, 50, 100], axis: true, fmtTick: function (t) { return t + '%'; }, label: 'Completion by weekday' })), 'wk-card'));

    /* weekly trend */
    var weeks = [], ws = D.startOfWeek(today);
    for (var i = 11; i >= 0; i--) {
      var w0 = D.add(ws, -7 * i), w1 = D.add(w0, 6);
      if (w1 < start) { weeks.push({ label: D.label(w0, 'md'), v: null }); continue; }
      var r = M.rate(w0 < start ? start : w0, w1 > today ? today : w1);
      weeks.push({ label: D.label(w0, 'md'), v: r.poss ? Math.round(r.pct * 100) : null, tip: r.poss ? Math.round(r.pct * 100) + '% of quests' : 'No data', tipTitle: 'Week of ' + D.label(w0, 'md') });
    }
    a.appendChild(card('Weekly trend', 'Completion per week, last 12 weeks', h('div', { class: 'chart-box' }, CH.line(weeks, { width: 340, height: 150, max: 100, min: 0, ticks: [0, 50, 100], axis: true, fmtTick: function (t) { return t + '%'; }, maxLabels: 4, label: 'Weekly completion' }))));

    /* per habit */
    var tot = M.totals();
    var hgrid = h('div', { class: 'habit-stats' });
    M.habits().forEach(function (hid) {
      var hab = M.habit(hid), str = M.strength(hid), hs2 = M.habitStreak(hid), r = M.rate(from, today, hid), rec = M.recovery(hid), t = tot[hid];
      var amount = hid === 'book' ? U.fmtNum(t.amount) : hab.unit === 'min' ? U.fmtMin(t.amount) : t.days + ' days', amountLbl = hid === 'book' ? ' pages' : ' total';
      var series = str.series.slice(-60).map(function (v) { return Math.round(v * 100); });
      hgrid.appendChild(h('div', { class: 'hstat h-' + hid },
        h('div', { class: 'hstat-top' }, UI.habitTile(hid, 36, true), h('b', null, hab.name),
          CH.ring(str.score, 46, 6, 'hab', h('span', { class: 'ring-small' }, Math.round(str.score * 100)))),
        h('div', { class: 'hstat-grid' },
          h('span', null, h('b', null, String(hs2.cur)), ' streak'),
          h('span', null, h('b', null, String(hs2.best)), ' best'),
          h('span', null, h('b', null, Math.round(r.pct * 100) + '%'), ' done'),
          h('span', null, h('b', null, amount), amountLbl),
          h('span', null, h('b', null, t.min ? String(t.min) : '0'), ' minimum'),
          h('span', null, h('b', null, rec.pct == null ? '–' : Math.round(rec.pct * 100) + '%'), ' bounce-back')),
        h('div', { class: 'hstat-spark', title: 'Strength, last 60 days' }, CH.spark(series, { max: 100, min: 0, width: 200, height: 34 }))));
    });
    a.appendChild(card('Each quest', 'Strength ring · bounce-back = how often a miss was followed by a check-in the next day', hgrid));

    /* right column */
    var tod = M.timeOfDay(), parts = C.dayParts.map(function (p) { var n = 0; for (var k = p.from; k < p.to; k++) n += tod[k]; return { label: p.name, v: n, display: String(n), tip: n + ' check-ins between ' + p.from + ':00 and ' + p.to + ':00', showValue: n > 0 }; });
    b.appendChild(card('When you show up', 'Check-ins by time of day, all time', h('div', { class: 'chart-box' }, CH.columns(parts, { width: 320, height: 150, label: 'Check-ins by time of day' }))));

    var k = M.ko(), kr = 0; Object.keys(S.state.kr).forEach(function (d2) { kr += S.state.kr[d2].n || 0; });
    b.appendChild(card('Korean', 'Fun! Fun! Korean 1', h('div', { class: 'mini-kpis' },
      tile('Sessions', k.done + '/' + k.total, Math.round(k.pct * 100) + '% of Book 1'),
      tile('Words learned', String(k.learned), k.known + ' started'),
      tile('Card reviews', U.fmtNum(kr), 'all time'),
      tile('Finish', k.current ? D.short(k.finish) : 'Done', k.current ? 'at your 14-day pace' : 'MashaAllah'))));

    var bk = M.habit('book'), pages = tot.book.amount, since14 = D.add(today, -13), p14 = 0;
    D.range(since14, today).forEach(function (d2) { var r2 = S.logGet(d2, 'book'); p14 += M.amount('book', r2); });
    var pace = p14 / 14, leftP = bk.total ? Math.max(0, bk.total - (bk.page || 0)) : 0;
    b.appendChild(card('Reading', bk.title, h('div', { class: 'mini-kpis' },
      tile('Pages read', U.fmtNum(pages), tot.book.days + ' reading days'),
      tile('Progress', bk.total ? Math.min(100, Math.round(100 * (bk.page || 0) / bk.total)) + '%' : '—', bk.total ? 'p. ' + Math.min(bk.page || 0, bk.total) + ' of ' + bk.total : 'Set the page count in the Reading quest'),
      tile('Pace', pace ? pace.toFixed(1) + '/day' : '—', 'last 14 days'),
      tile('Finish', bk.total && !leftP ? 'Finished' : bk.total && pace ? D.short(D.add(today, Math.ceil(leftP / pace))) : '—', bk.total && !leftP ? 'time for the next book' : bk.total && pace ? leftP + ' pages left' : ''))));

    b.appendChild(card("Qur'an", 'Daily reading', h('div', { class: 'mini-kpis' },
      tile('Time', U.fmtMin(tot.quran.amount), tot.quran.days + ' days'),
      tile('Average', tot.quran.days ? Math.round(tot.quran.amount / tot.quran.days) + ' min' : '—', 'per reading day'),
      tile('Bookmark', M.habit('quran').mark || '—', 'where you stopped'))));

    var vids = Object.keys(S.state.videos).map(function (id2) { return S.state.videos[id2]; }).filter(function (v) { return !v.del; });
    var pub = vids.filter(function (v) { return v.stage >= C.videoStages.length - 1; }).length;
    b.appendChild(card('YouTube', 'Your channel hour', h('div', { class: 'mini-kpis' },
      tile('Studio time', U.fmtHours(tot.youtube.amount), tot.youtube.days + ' days'),
      tile('Published', String(pub), vids.length + ' on the board'),
      tile('In progress', String(vids.length - pub), M.activeVideo() ? 'now: ' + C.videoStages[M.activeVideo().stage] : ''))));

    var wo = M.habit('workout');
    b.appendChild(card('Workout', wo.plan, h('div', { class: 'mini-kpis' },
      tile('Workouts', String(tot.workout.days), tot.workout.rest + ' rest days'),
      tile('Plan day', wo.planDays ? Math.min(wo.day || 1, wo.planDays) + '/' + wo.planDays : String(wo.day || 1), 'Home Workout'),
      tile('Time', U.fmtMin(tot.workout.amount), 'logged'))));

    var ts = M.tasksStats();
    b.appendChild(card('To-dos', 'Side quests', h('div', { class: 'mini-kpis' },
      tile('Completed', String(ts.done), ts.week + ' this week'),
      tile('Open', String(ts.open), ''),
      tile('On time', ts.ontime == null ? '—' : Math.round(ts.ontime * 100) + '%', 'done by the due date'))));

    var gEarn = 0, gUse = 0, wkS = D.startOfWeek(today);
    D.range(wkS, today).forEach(function (d2) { var g = M.game(d2); gEarn += g.earned; gUse += g.used; });
    b.appendChild(card('Game Pass', 'This week', h('div', { class: 'mini-kpis' },
      tile('Earned', U.fmtMin(gEarn), 'from quests'),
      tile('Played', U.fmtMin(gUse), 'logged with the timer'),
      tile('Unused', U.fmtMin(Math.max(0, gEarn - gUse)), gUse > gEarn ? 'over budget' : 'earned but not played'))));

    var xd = D.range(D.add(today, -59) < start ? start : D.add(today, -59), today), run = 0, before = 0;
    M.days().forEach(function (d2) { if (d2 < xd[0]) before += M.xpDay(d2).total; });
    run = before;
    var xpPts = xd.map(function (d2) { run += M.xpDay(d2).total; return { label: D.label(d2, 'md'), v: run, tip: U.fmtNum(run) + ' XP total (+' + M.xpDay(d2).total + ')' }; });
    b.appendChild(card('Experience', U.fmtNum(x.total) + ' XP · ' + (x.need - x.into) + ' to level ' + (x.level + 1), h('div', { class: 'chart-box' }, CH.line(xpPts, { width: 320, height: 140, axis: true, fmtTick: function (t) { return t >= 1000 ? (t / 1000).toFixed(1) + 'K' : Math.round(t); }, maxLabels: 4, label: 'Cumulative XP' }))));

    root.appendChild(h('div', { class: 'two-col' }, a, b));
  };
})();
