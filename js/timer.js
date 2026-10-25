/* Istiqomat — focus timer (counts toward a quest) and the Game Pass timer. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX, A = IST.A, UI = IST.UI, CH = IST.CH;
  var T = IST.T = {};
  var h = U.h;
  var KEY = 'istiqomat.timer';
  var wake = null, tick = null, overlay = null;

  function load() { return U.ls.getJSON(KEY, null); }
  function save(t) { if (t) U.ls.setJSON(KEY, t); else U.ls.del(KEY); }
  function elapsed(t) { return (t.acc || 0) + (t.run ? (Date.now() - t.run) / 1000 : 0); }
  T.active = function () { return load(); };

  function lockScreen(on) {
    try {
      if (on && navigator.wakeLock && !wake) navigator.wakeLock.request('screen').then(function (w) { wake = w; }, function () { /* ignore */ });
      if (!on && wake) { wake.release(); wake = null; }
    } catch (e) { /* ignore */ }
  }

  T.start = function (hid, minutes) {
    var cur = load();
    if (cur && cur.hid !== hid) { FX.toast('Finish the ' + M.habit(cur.hid).name + ' timer first.', { icon: 'timer' }); return T.open(); }
    if (!cur) save({ hid: hid, target: minutes || M.habit(hid).target, acc: 0, run: Date.now(), date: D.today() });
    T.open();
  };

  T.open = function () {
    var t = load(); if (!t) return;
    if (overlay) overlay.remove();
    var hab = M.habit(t.hid);
    var ringBox = h('div', { class: 'tm-ring' });
    var time = h('div', { class: 'tm-time' });
    var sub = h('div', { class: 'tm-sub' });
    var btnPause = h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () {
      var x = load(); if (!x) return;
      if (x.run) { x.acc = elapsed(x); x.run = 0; } else x.run = Date.now();
      save(x); paint();
    } });
    var btnDone = h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { finish(true); } }, C.icon('check', 18), 'Finish & log');
    overlay = h('div', { class: 'timer-ov h-' + t.hid, role: 'dialog', 'aria-modal': 'true', 'aria-label': hab.name + ' focus timer' },
      h('div', { class: 'tm-top' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Minimise timer', onclick: function () { close(); } }, C.icon('chevD', 22)),
        h('span', { class: 'tm-title' }, UI.habitTile(t.hid, 30), hab.name + ' · focus'),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Cancel timer', onclick: function () {
          UI.confirm('Cancel this timer without logging it?', 'Cancel timer', true).then(function (ok) { if (ok) { save(null); close(); lockScreen(false); IST.App.render(); } });
        } }, C.icon('trash', 20))),
      h('div', { class: 'tm-mid' }, ringBox, time, sub),
      h('p', { class: 'tm-tip' }, t.hid === 'youtube' ? 'Phone face down. One window open. Only the next step.' : t.hid === 'quran' ? 'Read slowly — with tartil. Quality over speed.' : 'Stay with it until the ring closes.'),
      h('div', { class: 'tm-actions' }, btnPause, btnDone));
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('in'); });
    lockScreen(true);
    function paint() {
      var x = load(); if (!x) return close();
      var sec = elapsed(x), tgt = x.target * 60, left = tgt - sec;
      U.clear(ringBox).appendChild(CH.ring(Math.min(1, sec / tgt), 240, 12, 'tm'));
      time.textContent = left > 0 ? U.fmtClock(left) : '+' + U.fmtClock(-left);
      sub.textContent = left > 0 ? Math.floor(sec / 60) + ' of ' + x.target + ' min' : 'Target reached — keep going or finish';
      U.clear(btnPause); btnPause.appendChild(C.icon(x.run ? 'pause' : 'playSm', 18)); btnPause.appendChild(document.createTextNode(x.run ? 'Pause' : 'Resume'));
      if (left <= 0 && !x.rang) { x.rang = 1; save(x); FX.sound('perfect'); U.vibrate([60, 60, 120]); }
    }
    function close() { clearInterval(tick); tick = null; if (overlay) { var o = overlay; overlay = null; o.classList.remove('in'); setTimeout(function () { o.remove(); }, 250); } IST.App.render(); }
    function finish() {
      var x = load(); if (!x) return close();
      var mins = Math.max(1, Math.round(elapsed(x) / 60)), hb = M.habit(x.hid), d = x.date || D.today();
      var prevRec = S.logGet(d, x.hid) || {}, total = (prevRec.m || 0) + mins;
      save(null); lockScreen(false);
      if (total >= hb.target) A.setHabit(x.hid, 'done', { m: total }, btnDone, d);
      else if (hb.min && total >= hb.min) A.setHabit(x.hid, 'min', { m: total }, btnDone, d);
      else {
        S.logSet(d, x.hid, { m: total });
        FX.toast(hb.name + ': ' + total + ' min so far — ' + ((hb.min || hb.target) - total) + ' more to check it off.', { icon: 'timer', ms: 4000 });
      }
      close();
    }
    paint();
    clearInterval(tick); tick = setInterval(paint, 1000);
  };

  /* ---------- Game Pass ---------- */
  T.gameToggle = function () {
    var d = D.today(), g = M.game(d), rec = S.state.game[d] || {};
    if (!g.unlocked) { FX.toast('Game Pass unlocks after ' + M.settings().gameUnlock + ' quests. ' + g.need + ' to go.', { icon: 'lock' }); return; }
    if (rec.run) {
      var used = (rec.used || 0) + Math.max(0, Math.round((Date.now() - rec.run) / 60000));
      S.gameSet(d, { used: used, run: 0 });
      FX.toast('Game time logged: ' + used + ' of ' + g.earned + ' min used today.', { icon: 'gamepad' });
    } else {
      if (g.remaining <= 0) { FX.toast('You have used today\'s game time. More quests, more minutes.', { icon: 'gamepad' }); return; }
      S.gameSet(d, { run: Date.now() });
      var end = new Date(Date.now() + g.remaining * 60000);
      FX.toast('Enjoy! Your game time ends at ' + D.pad(end.getHours()) + ':' + D.pad(end.getMinutes()) + '.', { icon: 'gamepad', tone: 'good', ms: 4000 });
      FX.sound('gift');
    }
  };
  /* gentle end-of-game alert while the app is open */
  setInterval(function () {
    var d = D.today(), rec = S.state && S.state.game[d];
    if (!rec || !rec.run) return;
    var g = M.game(d);
    if (g.remaining <= 0 && !rec.warned) {
      S.gameSet(d, { warned: 1 });
      FX.sound('boss'); U.vibrate([200, 100, 200]);
      FX.toast('Game time is up. Save and stop — tomorrow brings more.', { icon: 'gamepad', tone: 'warn', ms: 8000 });
    }
  }, 30000);
})();
