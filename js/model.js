/* Istiqomat — everything derived from the log: streaks, shields, strength, XP, levels, badges,
   bosses, game pass, quotes of the day, Korean progress, flashcards and statistics.
   Nothing here is stored, so every device computes the same numbers from the same synced log. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S;
  var M = IST.M = {};
  var ver = 0, memo = {};
  S.on(function () { ver++; memo = {}; });
  function cached(key, fn) { if (!(key in memo)) memo[key] = fn(); return memo[key]; }
  M.bump = function () { ver++; memo = {}; };

  var st = function () { return S.state; };
  M.settings = function () { return st().settings; };

  /* ---------- habits & day status ---------- */
  M.habits = function () { return C.habitOrder.filter(function (id) { return st().habits[id] && st().habits[id].on !== false; }); };
  M.habit = function (id) { return st().habits[id]; };
  M.status = function (date, hid) { var r = S.logGet(date, hid); return r && r.s ? r.s : 'none'; };
  M.isDone = function (s) { return s === 'done' || s === 'min'; };
  M.sat = function (date, hid) { var s = M.status(date, hid); return s === 'done' || s === 'min' || s === 'rest'; };
  M.counts = function (date) {
    return cached('c' + date, function () {
      var hs = M.habits(), o = { done: 0, full: 0, min: 0, rest: 0, sat: 0, total: hs.length };
      hs.forEach(function (h) {
        var s = M.status(date, h);
        if (s === 'done') { o.full++; o.done++; }
        else if (s === 'min') { o.min++; o.done++; }
        else if (s === 'rest') o.rest++;
      });
      o.sat = o.done + o.rest;
      return o;
    });
  };
  M.threshold = function () { return Math.min(+M.settings().streakMin || 3, M.habits().length || 1); };
  M.dayOK = function (date) { return M.counts(date).sat >= M.threshold(); };
  M.isPerfect = function (date) { var c = M.counts(date); return c.total > 0 && c.sat === c.total && c.done > 0; };

  M.startDate = function () {
    return cached('start', function () {
      var s = st().meta.start || D.today();
      Object.keys(st().log).forEach(function (d) { if (d < s && hasAny(d)) s = d; });
      return s > D.today() ? D.today() : s;
    });
  };
  function hasAny(d) { var day = st().log[d]; if (!day) return false; for (var k in day) if (day[k] && day[k].s && day[k].s !== 'none') return true; return false; }
  M.days = function () { return cached('days', function () { return D.range(M.startDate(), D.today()); }); };

  /* ---------- overall streak with shields ---------- */
  var MILESTONES = [3, 5, 7, 10, 14, 21, 30, 40, 50, 66, 80, 100, 150, 200, 250, 300, 365];
  M.overall = function () {
    return cached('overall', function () {
      var today = D.today(), days = M.days();
      var shields = 1, streak = 0, best = 0, pstreak = 0, pbest = 0, hist = {}, milestones = {}, prev = null;
      days.forEach(function (d) {
        var ok = M.dayOK(d), isToday = d === today;
        if (isToday && !ok) { hist[d] = 'pending'; return; }
        if (ok) {
          streak++; hist[d] = 'ok';
          if (streak % 7 === 0) shields = Math.min(2, shields + 1);
          if (MILESTONES.indexOf(streak) >= 0) milestones[d] = streak;
        } else if (shields > 0 && streak > 0 && prev !== 'shield') { shields--; hist[d] = 'shield'; }   /* never miss twice: no shield two days running */
        else { if (streak > 0) shields = Math.max(shields, 1); streak = 0; hist[d] = 'miss'; }   /* a fresh start gets a fresh shield */
        prev = hist[d];
        if (streak > best) best = streak;
        if (M.isPerfect(d)) { pstreak++; if (pstreak > pbest) pbest = pstreak; } else if (!isToday) pstreak = 0;
      });
      return { streak: streak, best: best, shields: shields, hist: hist, milestones: milestones, todayOK: M.dayOK(today), perfect: pstreak, bestPerfect: pbest };
    });
  };

  M.habitStreak = function (hid) {
    return cached('hs' + hid, function () {
      var today = D.today(), cur = 0, best = 0, last = null;
      M.days().forEach(function (d) {
        var s = M.status(d, hid);
        if (d === today && !M.sat(d, hid)) return;
        if (s === 'done' || s === 'min') { cur++; last = d; }
        else if (s === 'rest') { /* planned rest keeps the chain */ }
        else cur = 0;
        if (cur > best) best = cur;
      });
      return { cur: cur, best: best, last: last };
    });
  };

  /* Habit strength: exponential moving average, like the Loop Habit Tracker.
     ~50% after 13 straight days, ~96% after 60. A miss costs a few percent, never everything. */
  var MULT = Math.pow(0.5, 1 / 13);
  M.strength = function (hid) {
    return cached('str' + hid, function () {
      var today = D.today(), score = 0, series = [];
      M.days().forEach(function (d) {
        var s = M.status(d, hid);
        if (d === today && !M.sat(d, hid)) { series.push(score); return; }
        if (s !== 'rest') {
          var v = s === 'done' ? 1 : s === 'min' ? 0.75 : 0;
          score = score * MULT + v * (1 - MULT);
        }
        series.push(score);
      });
      return { score: score, series: series };
    });
  };

  /* ---------- XP & levels ---------- */
  M.lucky = function (d, hid) {
    var r = U.rng(U.hash32('gift|' + d + '|' + hid));
    var a = r(), b = r();
    return a < 0.12 ? 5 + Math.floor(b * 26) : 0;
  };
  M.xpDay = function (d) {
    return cached('xd' + d, function () {
      var o = { habits: 0, bonus: 0, lucky: 0, comeback: 0, perfect: 0, tasks: 0, korean: 0, cards: 0, milestone: 0, boss: 0, badges: 0, total: 0 };
      var wk = D.isWeekend(d) ? 2 : 1, y = D.add(d, -1), started = y >= M.startDate();
      M.habits().forEach(function (h) {
        var s = M.status(d, h);
        if (s === 'done' || s === 'min') {
          o.habits += (s === 'done' ? 10 : 5) * wk;
          o.lucky += M.lucky(d, h);
          if (started && M.status(y, h) === 'none') o.comeback += 10;
        }
      });
      if (M.isPerfect(d)) o.perfect = 25 * wk;
      var ms = M.overall().milestones[d]; if (ms) o.milestone = ms * 3;
      o.tasks = cached('taskxp', taskXP)[d] || 0;
      o.korean = (cached('kosxp', koSessXP)[d] || 0);
      var kr = st().kr[d]; o.cards = kr ? Math.min(20, kr.n || 0) : 0;
      var bd = M.bossOn(d); if (bd && bd.defeatedOn === d) o.boss = 100;
      o.badges = cached('badgexp', badgeXP)[d] || 0;
      o.total = o.habits + o.lucky + o.comeback + o.perfect + o.tasks + o.korean + o.cards + o.milestone + o.boss + o.badges;
      return o;
    });
  };
  function taskXP() {
    var m = {}, tasks = st().tasks;
    Object.keys(tasks).forEach(function (id) {
      var t = tasks[id];
      if (t.del || !t.done) return;
      var d = D.of(t.done); m[d] = (m[d] || 0) + (t.pr ? 8 : 5);
    });
    return m;
  }
  function koSessXP() {
    var m = {}, s = st().ko.s;
    Object.keys(s).forEach(function (id) { var r = s[id]; if (r && r.d) { var d = D.of(r.d); m[d] = (m[d] || 0) + 15; } });
    return m;
  }
  function badgeXP() {
    var m = {}, b = st().badges;
    C.badges.forEach(function (def) { var r = b[def.id]; if (r && r.at && def.xp) { var d = D.of(r.at); m[d] = (m[d] || 0) + def.xp; } });
    return m;
  }
  M.xp = function () {
    return cached('xp', function () {
      var total = 0, byDay = {};
      M.days().forEach(function (d) { var x = M.xpDay(d).total; byDay[d] = x; total += x; });
      var L = 1; while (C.levelXP(L + 1) <= total) L++;
      var from = C.levelXP(L), to = C.levelXP(L + 1);
      return { total: total, today: byDay[D.today()] || 0, byDay: byDay, level: L, name: C.levelName(L), from: from, to: to, into: total - from, need: to - from, pct: (total - from) / (to - from) };
    });
  };

  /* ---------- weekend boss ---------- */
  M.bossFor = function (sat) { var i = Math.floor(D.dayIndex(sat) / 7); return C.bosses[((i % C.bosses.length) + C.bosses.length) % C.bosses.length]; };
  M.weekendOf = function (d) {
    var w = D.dow(d);
    if (w === 5) return d; if (w === 6) return D.add(d, -1);
    if (w === 4) return D.add(d, 1); /* Friday previews tomorrow's boss */
    return null;
  };
  M.bossOn = function (d) {
    var sat = M.weekendOf(d); if (!sat) return null;
    var b = cached('boss' + sat, function () {
      var sun = D.add(sat, 1), hits = 0, defeatedOn = null, hp = C.bossHP;
      [sat, sun].forEach(function (day) {
        if (day > D.today()) return;
        hits += M.counts(day).sat;
        if (!defeatedOn && hits >= hp) defeatedOn = day;
      });
      return { sat: sat, sun: sun, boss: M.bossFor(sat), hp: hp, hits: Math.min(hits, hp), defeated: !!defeatedOn, defeatedOn: defeatedOn };
    });
    return Object.assign({ preview: D.dow(d) === 4 }, b);
  };
  M.bossesDefeated = function () {
    return cached('bossk', function () {
      var n = 0, seen = {};
      M.days().forEach(function (d) { if (D.dow(d) === 5 || D.dow(d) === 6) { var b = M.bossOn(d); if (b && b.defeated && !seen[b.sat]) { seen[b.sat] = 1; n++; } } });
      return n;
    });
  };

  /* ---------- game pass ---------- */
  M.game = function (d) {
    var s = M.settings(), c = M.counts(d), g = st().game[d] || {};
    var unlocked = c.sat >= (+s.gameUnlock || 3);
    var per = +s.gamePerHabit || 15, earned = unlocked ? c.sat * per + (M.isPerfect(d) ? per : 0) : 0;
    var used = Math.round(g.used || 0);
    var running = g.run ? Math.max(0, (Date.now() - g.run) / 60000) : 0;
    return { unlocked: unlocked, earned: earned, used: used, running: !!g.run, runStart: g.run || 0, live: used + running, remaining: Math.max(0, earned - used - running), need: Math.max(0, (+s.gameUnlock || 3) - c.sat) };
  };

  /* ---------- quotes ---------- */
  var QORDER = null;
  M.quoteOrder = function () {
    if (!QORDER) { var n = IST.data.quotes.length, a = []; for (var i = 0; i < n; i++) a.push(i); QORDER = U.shuffle(a, U.rng(U.hash32('istiqomat-quotes'))); }
    return QORDER;
  };
  M.quoteContext = function (d) {
    var y = D.add(d, -1);
    if (y >= M.startDate() && y < D.today() && !M.dayOK(y) && hasAny(D.add(d, -2))) return 'comeback';
    if (D.isWeekend(d)) return 'weekend';
    if (D.dow(d) === 4) return 'friday';
    if (D.dow(d) === 0) return 'monday';
    return null;
  };
  M.quotesFor = function (d) {
    var Q = IST.data.quotes, order = M.quoteOrder(), n = order.length, di = D.dayIndex(d), ctx = M.quoteContext(d);
    var first;
    if (ctx) {
      var pool = order.filter(function (i) { return Q[i].ctx && Q[i].ctx.indexOf(ctx) >= 0; });
      first = pool.length ? pool[di % pool.length] : order[di % n];
    } else first = order[di % n];
    var list = [first], j = (di * 3 + 1) % n;
    while (list.length < 4) { var c = order[j % n]; if (list.indexOf(c) < 0) list.push(c); j++; }
    var rec = st().quotes[d] || { k: 0 };
    return { list: list, k: Math.min(3, rec.k || 0), ctx: ctx };
  };
  M.isFav = function (qid) { var f = st().fav[qid]; return !!(f && !f.del); };

  /* ---------- Korean ---------- */
  var INT = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32, 7: 64 };
  M.K = function () { return IST.data.korean; };
  M.sessionDone = function (sid) { var r = st().ko.s[sid]; return !!(r && r.d); };
  M.ko = function () {
    return cached('ko', function () {
      var K = M.K(), ss = K.sessions, cur = null, curIdx = ss.length, done = 0;
      ss.forEach(function (s, i) { if (M.sessionDone(s.id)) done++; else if (!cur) { cur = s; curIdx = i; } });
      var unitMax = cur ? (cur.id === 'r1' ? 2 : cur.unit) : 15;
      var today = D.today(), cards = st().ko.c, words = [], due = [], fresh = [], learned = 0, known = 0;
      K.words.forEach(function (w) {
        if (w.u > unitMax) return;
        if (w.pn && !M.settings().properNouns) return;
        words.push(w);
        var c = cards[w.id];
        if (!c) fresh.push(w);
        else if (c.due <= today) due.push(w);
      });
      fresh.sort(function (a, b) { return (a.u === unitMax ? 0 : 1) - (b.u === unitMax ? 0 : 1) || a.u - b.u || a.p - b.p; });
      Object.keys(cards).forEach(function (id) { var c = cards[id]; if (c.b >= 3) learned++; if (c.b >= 1) known++; });
      var kr = st().kr[today] || {}, newLeft = Math.max(0, (+M.settings().newCards || 10) - (kr.nw || 0));
      /* pace over the last 14 days */
      var since = D.add(today, -13), recent = 0;
      Object.keys(st().ko.s).forEach(function (id) { var r = st().ko.s[id]; if (r && r.d && D.of(r.d) >= since) recent++; });
      var perDay = recent / 14 || 5 / 7, left = ss.length - done;
      var units = K.units.map(function (u) {
        var us = ss.filter(function (s) { return s.unit === u.n || (s.also && s.also.indexOf(u.n) >= 0); });
        var d = us.filter(function (s) { return M.sessionDone(s.id); }).length;
        return { n: u.n, total: us.length, done: d };
      });
      return {
        sessions: ss, current: cur, currentIndex: curIdx, done: done, total: ss.length, pct: done / ss.length,
        unitMax: unitMax, words: words, due: due, fresh: fresh, newLeft: newLeft, learned: learned, known: known,
        reviewedToday: kr.n || 0, newToday: kr.nw || 0, perDay: perDay, finish: left ? D.add(today, Math.ceil(left / perDay)) : today, units: units
      };
    });
  };
  M.koQueue = function () {
    var k = M.ko(), q = k.due.slice(0, 200);
    q.sort(function (a, b) { var ca = st().ko.c[a.id], cb = st().ko.c[b.id]; return (ca.due < cb.due ? -1 : ca.due > cb.due ? 1 : ca.b - cb.b); });
    var news = k.fresh.slice(0, k.newLeft).map(function (w) { return Object.assign({ isNew: true }, w); });
    /* interleave: a few reviews, then a new word */
    var out = [], i = 0, j = 0;
    while (i < q.length || j < news.length) {
      for (var r = 0; r < 3 && i < q.length; r++) out.push(q[i++]);
      if (j < news.length) out.push(news[j++]);
    }
    return out;
  };
  M.koGrade = function (w, grade) {
    var today = D.today(), c = st().ko.c[w.id], isNew = !c;
    c = c ? JSON.parse(JSON.stringify(c)) : { b: 0, n: 0, l: 0 };
    c.n = (c.n || 0) + 1;
    if (grade === 'known') { c.b = 5; c.due = D.add(today, INT[5]); }
    else if (grade === 'good') { c.b = Math.min(7, (c.b || 0) + 1); c.due = D.add(today, INT[c.b]); }
    else { c.b = 1; c.l = (c.l || 0) + 1; c.due = today; }
    S.koCard(w.id, c, true);
    S.koReviewCount(today, 1, isNew ? 1 : 0);
    M.bump();
    return c;
  };
  M.wordOfDay = function (d) {
    var k = M.ko(), K = M.K();
    var pool = K.words.filter(function (w) { return !w.pn && w.u === Math.max(1, k.unitMax); });
    if (!pool.length) pool = k.words.filter(function (w) { return !w.pn; });
    if (!pool.length) return null;
    return pool[U.hash32('wotd' + d) % pool.length];
  };
  M.unitOf = function (n) { return M.K().units.filter(function (u) { return u.n === n; })[0]; };
  M.pdfRange = function (s) {
    var ps = s.pdf.filter(function (p) { return p != null; });
    if (!ps.length) return '';
    var a = Math.min.apply(null, ps), b = Math.max.apply(null, ps);
    return a === b ? 'PDF ' + a : 'PDF ' + a + '–' + b;
  };
  M.pageRange = function (s) {
    var ps = s.pages, a = Math.min.apply(null, ps), b = Math.max.apply(null, ps);
    return a === b ? 'p. ' + a : 'pp. ' + a + '–' + b;
  };

  /* ---------- habit-specific "today" lines ---------- */
  M.activeVideo = function () {
    var vs = Object.keys(st().videos).map(function (k) { return st().videos[k]; }).filter(function (v) { return !v.del && v.stage < C.videoStages.length - 1; });
    vs.sort(function (a, b) { return (b.u || 0) - (a.u || 0); });
    return vs[0] || null;
  };
  M.todayLine = function (hid, d) {
    var h = M.habit(hid);
    if (hid === 'korean') {
      var k = M.ko(); if (!k.current) return 'Book 1 complete — review due flashcards';
      return (k.current.kind === 'review' ? 'Review · ' : 'Unit ' + k.current.unit + ' · ') + k.current.title + ' (' + M.pageRange(k.current) + ')';
    }
    if (hid === 'workout') return h.plan + (h.planDays ? ' · Day ' + Math.min(h.day || 1, h.planDays) + ' of ' + h.planDays : '');
    if (hid === 'book') {
      if (h.total) return h.title + ((h.page || 0) >= h.total ? ' · finished — set your next book' : ' · p. ' + (h.page || 0) + ' of ' + h.total);
      return h.title + ' · ' + h.target + ' pages';
    }
    if (hid === 'youtube') { var v = M.activeVideo(); return v ? v.t + ' · now: ' + C.videoStages[v.stage] : 'Pick your next video topic'; }
    if (hid === 'quran') return h.target + ' minutes' + (h.mark ? ' · continue from ' + h.mark : '');
    return h.targetText;
  };
  M.planTime = function (hid, d) {
    var w = st().wplan[d]; if (w && w.times && w.times[hid]) return w.times[hid];
    var h = M.habit(hid); return D.isWeekend(d) ? h.timeWe : h.timeWd;
  };
  M.anchor = function (hid, d) { var h = M.habit(hid); return D.isWeekend(d) ? h.anchorWe : h.anchorWd; };

  /* ---------- totals & stats ---------- */
  M.amount = function (hid, rec) {
    if (!rec || !(rec.s === 'done' || rec.s === 'min')) return 0;
    var h = M.habit(hid);
    if (hid === 'book') return rec.p != null ? +rec.p : (rec.s === 'min' ? (h.min || 2) : h.target);
    return rec.m != null ? +rec.m : (rec.s === 'min' ? (h.min || h.target) : h.target);
  };
  M.totals = function () {
    return cached('totals', function () {
      var o = {}; C.habitOrder.forEach(function (h) { o[h] = { days: 0, amount: 0, full: 0, min: 0, rest: 0 }; });
      Object.keys(st().log).forEach(function (d) {
        var day = st().log[d];
        C.habitOrder.forEach(function (h) {
          var r = day[h]; if (!r) return;
          if (r.s === 'done') { o[h].days++; o[h].full++; o[h].amount += M.amount(h, r); }
          else if (r.s === 'min') { o[h].days++; o[h].min++; o[h].amount += M.amount(h, r); }
          else if (r.s === 'rest') o[h].rest++;
        });
      });
      return o;
    });
  };
  M.rate = function (from, to, hid) {
    var sat = 0, poss = 0, today = D.today();
    D.range(from, to).forEach(function (d) {
      if (d < M.startDate()) return;
      if (d === today && !(hid ? M.sat(d, hid) : M.counts(d).sat)) return;
      (hid ? [hid] : M.habits()).forEach(function (h) {
        var s = M.status(d, h);
        if (s === 'rest') return;
        poss++; if (s === 'done' || s === 'min') sat++;
      });
    });
    return { sat: sat, poss: poss, pct: poss ? sat / poss : 0 };
  };
  M.dowRates = function (from, to, hid) {
    var sat = [0, 0, 0, 0, 0, 0, 0], poss = [0, 0, 0, 0, 0, 0, 0], today = D.today();
    D.range(from, to).forEach(function (d) {
      if (d < M.startDate()) return;
      if (d === today && !M.counts(d).sat) return;
      var w = D.dow(d);
      (hid ? [hid] : M.habits()).forEach(function (h) { var s = M.status(d, h); if (s === 'rest') return; poss[w]++; if (s === 'done' || s === 'min') sat[w]++; });
    });
    return sat.map(function (s, i) { return { sat: s, poss: poss[i], pct: poss[i] ? s / poss[i] : null }; });
  };
  M.timeOfDay = function () {
    var bins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    Object.keys(st().log).forEach(function (d) {
      var day = st().log[d];
      Object.keys(day).forEach(function (h) { var r = day[h]; if (r && (r.s === 'done' || r.s === 'min') && r.at) bins[new Date(r.at).getHours()]++; });
    });
    return bins;
  };
  M.recovery = function (hid) {
    var misses = 0, rec = 0, days = M.days(), today = D.today();
    for (var i = 0; i < days.length - 1; i++) {
      var d = days[i]; if (d >= today) break;
      if (M.status(d, hid) === 'none') {
        var nx = days[i + 1]; if (nx === today && !M.sat(nx, hid)) continue;
        misses++; if (M.sat(nx, hid)) rec++;
      }
    }
    return { misses: misses, recovered: rec, pct: misses ? rec / misses : null };
  };
  M.tasksStats = function () {
    var all = Object.keys(st().tasks).map(function (k) { return st().tasks[k]; }).filter(function (t) { return !t.del; });
    var done = all.filter(function (t) { return t.done; });
    var ontime = done.filter(function (t) { return !t.due || D.of(t.done) <= t.due; });
    var wk = D.startOfWeek(D.today());
    return { total: all.length, done: done.length, open: all.length - done.length, ontime: done.length ? ontime.length / done.length : null,
      week: done.filter(function (t) { return D.of(t.done) >= wk; }).length };
  };

  /* ---------- badges ---------- */
  M.badgeState = function () {
    var o = M.overall(), tot = M.totals(), k = M.ko(), x = M.xp(), days = M.days(), start = M.startDate();
    var anyPerfect = false, comeback = false, early = false, wkwar = false;
    days.forEach(function (d) {
      if (!M.isPerfect(d)) return;
      anyPerfect = true;
      var y = D.add(d, -1);
      if (y >= start && !M.dayOK(y)) comeback = true;
      if (D.dow(d) === 6 && M.isPerfect(y)) wkwar = true;
      var ok = true, day = st().log[d] || {};
      M.habits().forEach(function (h) { var r = day[h]; if (!r || !r.at || (r.s !== 'rest' && new Date(r.at).getHours() >= 9)) ok = false; });
      if (ok) early = true;
    });
    var unitDone = k.units.some(function (u) { return u.n >= 5 && u.total && u.done === u.total; });
    var published = Object.keys(st().videos).some(function (id) { var v = st().videos[id]; return !v.del && v.stage >= C.videoStages.length - 1; });
    var strong = C.habitOrder.some(function (h) { return M.strength(h).score >= 0.8; });
    var bk = M.habit('book');
    return {
      first: tot.quran.days + tot.korean.days + tot.workout.days + tot.book.days + tot.youtube.days > 0,
      s3: o.best >= 3, wall: o.best >= 5, s7: o.best >= 7, s14: o.best >= 14, s30: o.best >= 30, s66: o.best >= 66,
      perfect: anyPerfect, pweek: o.bestPerfect >= 7, wkwar: wkwar, boss: M.bossesDefeated() >= 1, boss4: M.bossesDefeated() >= 4,
      comeback: comeback, early: early, quran30: tot.quran.days >= 30, kunit: unitDone, kwords: k.learned >= 100, kbook: k.done === k.total,
      pages100: tot.book.amount >= 100, bookdone: !!(bk.total && bk.page >= bk.total), work10: tot.workout.days >= 10,
      creator10: tot.youtube.amount >= 600, publish: published, tasks50: M.tasksStats().done >= 50, strong: strong,
      lv5: x.level >= 5, lv10: x.level >= 10
    };
  };
  M.checkBadges = function () {
    var bs = M.badgeState(), fresh = [];
    C.badges.forEach(function (b) { if (bs[b.id] && !st().badges[b.id]) { if (S.badgeUnlock(b.id)) fresh.push(b); } });
    if (fresh.length) { M.bump(); S.touch(['core'], 'badge'); }
    return fresh;
  };

  /* ---------- the one line of encouragement on the Today screen ---------- */
  M.nudge = function () {
    var d = D.today(), c = M.counts(d), o = M.overall(), hour = new Date().getHours(), y = D.add(d, -1);
    var left = c.total - c.sat;
    if (c.total && c.sat === c.total) return { tone: 'win', text: 'Every quest done. Enjoy the rest of your day — you earned it.' };
    if (y >= M.startDate() && !M.dayOK(y) && hasAny(D.add(d, -2))) return { tone: 'comeback', text: 'Yesterday slipped. Never miss twice: the minimum version of each quest is enough today.' };
    if (o.streak >= 3 && o.streak <= 4 && !o.todayOK) return { tone: 'wall', text: 'Day ' + (o.streak + 1) + '. This is where you used to stop. Not this time — one quest at a time.' };
    if (D.isWeekend(d) && hour >= 14 && left >= 3) return { tone: 'weekend', text: 'Weekend afternoon check: ' + left + ' quests left. Minimum versions count fully. Then the game is yours.' };
    if (D.isWeekend(d)) return { tone: 'weekend', text: 'Weekend mode: double XP, and a boss to beat. Start with Qur\'an before you open any game.' };
    if (hour >= 21 && left > 0) return { tone: 'late', text: left + ' quest' + (left > 1 ? 's' : '') + ' left before the day ends. The two-minute versions still count.' };
    if (!c.sat && hour < 12) return { tone: 'morning', text: 'Bismillah. Start with the smallest quest and let the rest follow.' };
    return { tone: 'plain', text: left + ' quest' + (left === 1 ? '' : 's') + ' to go. Strength grows with every check-in.' };
  };
})();
