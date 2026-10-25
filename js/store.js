/* Istiqomat — state, persistence and conflict-free merging.
   Every record carries `u` (last-updated time). Merging two copies keeps, per record, the newer one,
   so phones and the PC can edit offline and still converge when they sync. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C;
  var S = IST.S = {};
  S.KEY = 'istiqomat.v1';
  S.listeners = [];
  S.dirty = {};          /* doc keys changed locally since the last remote push */
  var lastTs = 0;

  S.now = function () { var t = Date.now(); if (t <= lastTs) t = lastTs + 1; lastTs = t; return t; };

  /* Defaults carry u = 0, so anything a real device has saved always wins a merge against them
     (a second phone opening the app for the first time never overwrites your real data). */
  S.fresh = function () {
    var t = Date.now(), habits = {};
    C.habitOrder.forEach(function (id) {
      var h = JSON.parse(JSON.stringify(C.habitDefaults[id]));
      h.on = true; h.u = 0; habits[id] = h;
    });
    var videos = {};
    videos['v-ep1'] = { id: 'v-ep1', t: 'Episode 1 — π (grade 6: circumference & area)', stage: 2, note: 'ManimGL · on-screen text in Uzbek', c: t, del: 0, u: 0 };
    return {
      v: 1,
      meta: { created: t, start: D.today(), onboarded: false, u: 0 },
      profile: { name: 'Jaloliddin', u: 0 },
      settings: { theme: 'auto', sounds: true, haptics: true, dayStart: 3, streakMin: 3, gamePerHabit: 15, gameUnlock: 3, newCards: 10, properNouns: false, showArabic: true, u: 0 },
      habits: habits,
      log: {}, tasks: {}, videos: videos,
      ko: { s: {}, c: {} }, kr: {},
      quotes: {}, fav: {}, game: {}, wplan: {}, badges: {}
    };
  };

  S.normalize = function (st) {
    var f = S.fresh();
    ['meta', 'profile', 'settings'].forEach(function (k) {
      st[k] = st[k] || f[k];
      for (var p in f[k]) if (!(p in st[k])) st[k][p] = f[k][p];
    });
    ['log', 'tasks', 'videos', 'kr', 'quotes', 'fav', 'game', 'wplan', 'badges'].forEach(function (k) { if (!st[k] || typeof st[k] !== 'object') st[k] = {}; });
    st.habits = st.habits || {};
    C.habitOrder.forEach(function (id) {
      if (!st.habits[id]) st.habits[id] = f.habits[id];
      var d = C.habitDefaults[id];
      for (var p in d) if (!(p in st.habits[id])) st.habits[id][p] = d[p];
      if (!('on' in st.habits[id])) st.habits[id].on = true;
    });
    st.ko = st.ko || { s: {}, c: {} }; st.ko.s = st.ko.s || {}; st.ko.c = st.ko.c || {};
    st.v = 1;
    return st;
  };

  S.init = function () {
    var raw = U.ls.getJSON(S.KEY, null);
    S.state = S.normalize(raw && raw.v ? raw : S.fresh());
    S.applyDayStart();
    if (!raw) S.saveNow();
  };
  S.applyDayStart = function () { D.dayStartHour = +S.state.settings.dayStart || 0; };

  S.saveNow = function () { U.ls.setJSON(S.KEY, S.state); };
  S.save = U.debounce(S.saveNow, 250);
  window.addEventListener('pagehide', function () { S.saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) S.saveNow(); });

  S.on = function (fn) { S.listeners.push(fn); };
  S.emit = function (why) { S.listeners.forEach(function (fn) { try { fn(why); } catch (e) { console.error(e); } }); };

  function touch(keys, why) {
    (keys || []).forEach(function (k) { S.dirty[k] = 1; });
    S.save();
    S.emit(why || 'local');
  }
  S.touch = touch;
  function mkey(date) { return 'm-' + date.slice(0, 7); }
  function taskKey(t) { return 'm-' + D.of(t.c).slice(0, 7); }

  /* ---------- mutations ---------- */
  S.logGet = function (date, hid) { var d = S.state.log[date]; return d && d[hid] || null; };
  S.logSet = function (date, hid, patch) {
    var day = S.state.log[date] = S.state.log[date] || {};
    var rec = day[hid] ? JSON.parse(JSON.stringify(day[hid])) : {};
    if (patch === null) rec = { s: 'none' };
    else for (var k in patch) rec[k] = patch[k];
    rec.u = S.now();
    day[hid] = rec;
    touch([mkey(date)], 'log');
    return rec;
  };
  S.setSetting = function (k, v) { S.state.settings[k] = v; S.state.settings.u = S.now(); if (k === 'dayStart') S.applyDayStart(); touch(['core'], 'settings'); };
  S.setProfile = function (patch) { for (var k in patch) S.state.profile[k] = patch[k]; S.state.profile.u = S.now(); touch(['core'], 'profile'); };
  S.setMeta = function (patch) { for (var k in patch) S.state.meta[k] = patch[k]; S.state.meta.u = S.now(); touch(['core'], 'meta'); };
  S.habitSet = function (hid, patch) {
    var h = S.state.habits[hid];
    for (var k in patch) h[k] = patch[k];
    h.u = S.now();
    touch(['core'], 'habit');
  };
  S.taskAdd = function (t) {
    var id = U.uid('t'), now = S.now();
    var rec = { id: id, t: t.t, due: t.due || '', pr: t.pr || 0, tag: t.tag || '', note: t.note || '', done: 0, c: now, del: 0, u: now };
    S.state.tasks[id] = rec;
    touch([taskKey(rec)], 'task');
    return rec;
  };
  S.taskSet = function (id, patch) {
    var t = S.state.tasks[id]; if (!t) return;
    for (var k in patch) t[k] = patch[k];
    t.u = S.now();
    touch([taskKey(t)], 'task');
  };
  S.videoAdd = function (title) {
    var id = U.uid('v'), now = S.now();
    S.state.videos[id] = { id: id, t: title, stage: 0, note: '', c: now, del: 0, u: now };
    touch(['core'], 'video');
    return S.state.videos[id];
  };
  S.videoSet = function (id, patch) {
    var v = S.state.videos[id]; if (!v) return;
    for (var k in patch) v[k] = patch[k];
    v.u = S.now();
    touch(['core'], 'video');
  };
  S.koSession = function (sid, done) {
    S.state.ko.s[sid] = { d: done ? S.now() : 0, u: S.now() };
    touch(['ko'], 'korean');
  };
  S.koCard = function (wid, card, silent) {
    card.u = S.now();
    S.state.ko.c[wid] = card;
    S.dirty.ko = 1; S.save();
    if (!silent) S.emit('card');
  };
  S.koReviewCount = function (date, dn, dnew) {
    var r = S.state.kr[date] || { n: 0, nw: 0 };
    r = { n: (r.n || 0) + (dn || 0), nw: (r.nw || 0) + (dnew || 0), u: S.now() };
    S.state.kr[date] = r;
    S.dirty[mkey(date)] = 1; S.save();
  };
  S.quoteSet = function (date, patch) {
    var q = S.state.quotes[date] || { k: 0 };
    for (var k in patch) q[k] = patch[k];
    q.u = S.now();
    S.state.quotes[date] = q;
    touch([mkey(date)], 'quote');
  };
  S.favToggle = function (qid) {
    var f = S.state.fav[qid];
    var on = !(f && !f.del);
    S.state.fav[qid] = { at: on ? S.now() : (f ? f.at : 0), del: on ? 0 : 1, u: S.now() };
    touch(['core'], 'fav');
    return on;
  };
  S.gameSet = function (date, patch) {
    var g = S.state.game[date] || { used: 0 };
    for (var k in patch) g[k] = patch[k];
    g.u = S.now();
    S.state.game[date] = g;
    touch([mkey(date)], 'game');
  };
  S.wplanSet = function (date, hid, time) {
    var w = S.state.wplan[date] || { times: {} };
    w = { times: JSON.parse(JSON.stringify(w.times || {})) };
    if (time) w.times[hid] = time; else delete w.times[hid];
    w.u = S.now();
    S.state.wplan[date] = w;
    touch([mkey(date)], 'wplan');
  };
  S.badgeUnlock = function (id, at) {
    if (S.state.badges[id]) return false;
    S.state.badges[id] = { at: at || S.now(), u: S.now() };
    S.dirty.core = 1; S.save();
    return true;
  };

  /* ---------- documents (for Claude's store) ---------- */
  var CORE_SINGLE = ['meta', 'profile', 'settings'];
  var CORE_MAPS = ['habits', 'videos', 'badges', 'fav'];
  var MONTH_DATE_MAPS = ['quotes', 'game', 'kr', 'wplan'];

  S.docKeys = function () {
    var keys = { core: 1, ko: 1 }, st = S.state;
    Object.keys(st.log).concat(Object.keys(st.quotes), Object.keys(st.game), Object.keys(st.kr), Object.keys(st.wplan)).forEach(function (d) { keys[mkey(d)] = 1; });
    Object.keys(st.tasks).forEach(function (id) { keys[taskKey(st.tasks[id])] = 1; });
    return Object.keys(keys);
  };
  S.docBody = function (key) {
    var st = S.state, body = {};
    if (key === 'core') {
      CORE_SINGLE.concat(CORE_MAPS).forEach(function (k) { body[k] = st[k]; });
    } else if (key === 'ko') {
      body.s = st.ko.s; body.c = st.ko.c;
    } else if (key.slice(0, 2) === 'm-') {
      var ym = key.slice(2);
      body.log = {}; body.tasks = {};
      MONTH_DATE_MAPS.forEach(function (k) { body[k] = {}; });
      Object.keys(st.log).forEach(function (d) { if (d.slice(0, 7) === ym) body.log[d] = st.log[d]; });
      MONTH_DATE_MAPS.forEach(function (k) { Object.keys(st[k]).forEach(function (d) { if (d.slice(0, 7) === ym) body[k][d] = st[k][d]; }); });
      Object.keys(st.tasks).forEach(function (id) { if (taskKey(st.tasks[id]) === key) body.tasks[id] = st.tasks[id]; });
    }
    return JSON.parse(JSON.stringify(body));
  };

  /* record-level merge helpers: return {loc: local changed, rem: remote is missing something} */
  function newer(a, b) { return (a && a.u || 0) > (b && b.u || 0); }
  function mergeMap(local, remote, res) {
    remote = remote || {};
    Object.keys(remote).forEach(function (k) {
      var r = remote[k];
      if (!r || typeof r !== 'object') return;
      if (!local[k] || newer(r, local[k])) { local[k] = r; res.loc = true; }
      else if (newer(local[k], r)) res.rem = true;
    });
    Object.keys(local).forEach(function (k) { if (!(k in remote)) res.rem = true; });
  }
  function mergeLog(local, remote, res) {
    remote = remote || {};
    Object.keys(remote).forEach(function (d) {
      if (!local[d]) local[d] = {};
      mergeMap(local[d], remote[d], res);
    });
    Object.keys(local).forEach(function (d) { if (!(d in remote)) res.rem = true; });
  }
  S.mergeDoc = function (key, body) {
    var st = S.state, res = { loc: false, rem: false };
    if (!body) { res.rem = true; return res; }
    if (key === 'core') {
      CORE_SINGLE.forEach(function (k) {
        if (body[k] && newer(body[k], st[k])) { st[k] = body[k]; res.loc = true; }
        else if (newer(st[k], body[k])) res.rem = true;
      });
      CORE_MAPS.forEach(function (k) { mergeMap(st[k], body[k], res); });
    } else if (key === 'ko') {
      mergeMap(st.ko.s, body.s, res); mergeMap(st.ko.c, body.c, res);
    } else if (key.slice(0, 2) === 'm-') {
      var ym = key.slice(2);
      var sub = function (obj) { var o = {}; Object.keys(obj).forEach(function (d) { if (d.slice(0, 7) === ym) o[d] = obj[d]; }); return o; };
      var lg = sub(st.log); mergeLog(lg, body.log, res); Object.keys(lg).forEach(function (d) { st.log[d] = lg[d]; });
      MONTH_DATE_MAPS.forEach(function (k) { var m = sub(st[k]); mergeMap(m, body[k], res); Object.keys(m).forEach(function (d) { st[k][d] = m[d]; }); });
      var tk = {}; Object.keys(st.tasks).forEach(function (id) { if (taskKey(st.tasks[id]) === key) tk[id] = st.tasks[id]; });
      mergeMap(tk, body.tasks, res); Object.keys(tk).forEach(function (id) { st.tasks[id] = tk[id]; });
    }
    if (res.loc) { S.normalize(st); S.applyDayStart(); }
    return res;
  };
  /* merge a whole remote state (GitHub Gist sync, file import) */
  S.mergeState = function (remote) {
    var res = { loc: false, rem: false };
    if (!remote || typeof remote !== 'object') return res;
    remote = S.normalize(JSON.parse(JSON.stringify(remote)));
    var keys = {};
    S.docKeys().forEach(function (k) { keys[k] = 1; });
    var saved = S.state;
    S.state = remote; S.docKeys().forEach(function (k) { keys[k] = 1; });
    var bodies = {};
    Object.keys(keys).forEach(function (k) { bodies[k] = S.docBody(k); });
    S.state = saved;
    Object.keys(bodies).forEach(function (k) {
      var r = S.mergeDoc(k, bodies[k]);
      if (r.loc) res.loc = true;
      if (r.rem) res.rem = true;
    });
    return res;
  };

  S.exportText = function () {
    return JSON.stringify({ app: 'Istiqomat', exported: new Date().toISOString(), state: S.state });
  };
  S.importText = function (text) {
    var o = U.json(text, null);
    var st = o && (o.state || o);
    if (!st || !st.habits || !st.v) throw new Error('This file is not an Istiqomat backup.');
    var r = S.mergeState(st);
    S.docKeys().forEach(function (k) { S.dirty[k] = 1; });
    S.saveNow();
    S.emit('import');
    return r;
  };
  S.resetAll = function () {
    S.state = S.fresh();
    S.applyDayStart();
    S.saveNow();
    S.emit('reset');
  };
})();
