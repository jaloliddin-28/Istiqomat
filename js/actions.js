/* Istiqomat — actions with side effects: completing quests (XP, gifts, level-ups, badges, bosses),
   Korean sessions, tasks. Views call these; they never touch celebrations themselves. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX;
  var A = IST.A = {};

  function snapshot() {
    var d = D.today(), x = M.xp(), b = M.bossOn(d);
    return { level: x.level, perfect: M.isPerfect(d), boss: b ? b.defeated : null, xp: x.total, streak: M.overall().streak };
  }
  A.snapshot = snapshot;

  /* compare before/after and celebrate what changed */
  A.after = function (prev, el) {
    M.bump();
    var d = D.today(), now = snapshot();
    var pos = el ? FX.at(el) : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var gained = now.xp - prev.xp;
    if (gained > 0) FX.float(pos.x, pos.y - 10, '+' + gained + ' XP', 'xp');
    if (now.perfect && !prev.perfect) {
      FX.celebrate({ kicker: D.isWeekend(d) ? 'Weekend perfect day' : 'Perfect day', title: 'All five quests done', text: 'MashaAllah. This is exactly how habits are built: one complete day at a time.', icon: 'sparkle', xp: D.isWeekend(d) ? 50 : 25, sound: 'perfect' });
    }
    if (now.boss && prev.boss === false) {
      var b = M.bossOn(d);
      FX.celebrate({ kicker: 'Weekend boss defeated', title: b.boss.name + ' is down', text: 'Weekends were the hard part. Not anymore.', icon: 'sword', xp: 100, sound: 'boss' });
    }
    if (now.level > prev.level) {
      var ln = C.levelName(now.level);
      FX.celebrate({ kicker: 'Level up', title: 'Level ' + now.level + ' · ' + ln.en, text: ln.uz + ' — keep flying.', big: String(now.level), sound: 'level' });
    }
    if (now.streak > prev.streak && [3, 5, 7, 14, 21, 30, 40, 50, 66, 100].indexOf(now.streak) >= 0) {
      FX.toast(now.streak + '-day streak! +' + now.streak * 3 + ' XP', { icon: 'flame', tone: 'good', ms: 3500 });
    }
    var fresh = M.checkBadges();
    fresh.forEach(function (b) { FX.celebrate({ kicker: 'Achievement unlocked', title: b.name, text: b.desc, icon: b.icon, xp: b.xp }); });
    var after = M.xp();
    if (after.level > now.level) { var l2 = C.levelName(after.level); FX.celebrate({ kicker: 'Level up', title: 'Level ' + after.level + ' · ' + l2.en, text: l2.uz + ' — keep flying.', big: String(after.level), sound: 'level' }); }
  };

  /* set a quest's status for today (or another date) */
  A.setHabit = function (hid, status, extra, el, date) {
    var d = date || D.today(), prev = snapshot(), before = M.status(d, hid);
    var patch = { s: status, at: Date.now() };
    if (extra) for (var k in extra) patch[k] = extra[k];
    if (status === 'none') patch = { s: 'none' };
    S.logSet(d, hid, patch);
    /* workout plans move forward one day per completed (or rest) day */
    if (hid === 'workout') {
      var hb = M.habit('workout'), was = before === 'done' || before === 'min' || before === 'rest', is = status === 'done' || status === 'min' || status === 'rest';
      if (!was && is) S.habitSet('workout', { day: (hb.day || 1) + 1 });
      if (was && !is && (hb.day || 1) > 1) S.habitSet('workout', { day: hb.day - 1 });
    }
    if (status === 'done' || status === 'min') {
      FX.sound(status === 'done' ? 'check' : 'min'); U.vibrate(18);
      if (el) { var p = FX.at(el); FX.confetti(p.x, p.y, { n: status === 'done' ? 46 : 24, color: getComputedStyle(document.documentElement).getPropertyValue('--h-' + hid) }); }
      var gift = M.lucky(d, hid);
      if (gift && before !== 'done' && before !== 'min') setTimeout(function () { FX.sound('gift'); FX.toast('Gift box opened: +' + gift + ' bonus XP', { icon: 'gift', tone: 'gift', ms: 3200 }); }, 650);
    } else if (status === 'none') FX.sound('undo');
    A.after(prev, el);
  };

  A.toggleQuick = function (hid, el) {
    var s = M.status(D.today(), hid);
    if (s === 'done' || s === 'min' || s === 'rest') return false;
    var h = M.habit(hid), extra = {};
    if (hid === 'book') extra.p = h.target; else extra.m = h.target;
    A.setHabit(hid, 'done', extra, el);
    if (hid === 'book') {
      FX.toast('Logged ' + h.target + ' pages.', { icon: 'book', action: { label: 'Set page', fn: function () { IST.V.habitSheet && IST.V.habitSheet('book', 'pages'); } } });
    }
    return true;
  };

  /* Korean session done → also completes the Korean quest for today */
  A.sessionDone = function (sid, done, el) {
    var prev = snapshot();
    S.koSession(sid, done);
    if (done) {
      FX.sound('check'); U.vibrate(18);
      if (el) { var p = FX.at(el); FX.confetti(p.x, p.y, { n: 40 }); }
      var d = D.today(), s = M.status(d, 'korean');
      if (s !== 'done') S.logSet(d, 'korean', { s: 'done', at: Date.now(), m: Math.max(M.habit('korean').target, (S.logGet(d, 'korean') || {}).m || 0), ses: sid });
    }
    A.after(prev, el);
  };

  A.taskToggle = function (id, el) {
    var t = S.state.tasks[id]; if (!t) return;
    var prev = snapshot();
    S.taskSet(id, { done: t.done ? 0 : Date.now() });
    if (!t.done) return A.after(prev, el);
    FX.sound('check'); U.vibrate(12);
    if (el) { var p = FX.at(el); FX.confetti(p.x, p.y, { n: 18 }); }
    A.after(prev, el);
  };

  A.flashcardsFinished = function (count, el, before) {
    var d = D.today(), prev = before || snapshot();
    var h = M.habit('korean'), s = M.status(d, 'korean');
    if (count >= 10 && s === 'none' && h.min) {
      S.logSet(d, 'korean', { s: 'min', at: Date.now(), m: h.min, cards: count });
      FX.toast('Korean minimum done with ' + count + ' cards. A full session makes it a full check.', { icon: 'hangul', tone: 'good', ms: 4000 });
    }
    S.emit('cards');
    A.after(prev, el);
  };
})();
