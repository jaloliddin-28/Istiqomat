/* Istiqomat — Me: level, achievements, saved quotes, quest settings, reminders, sync, backup, install. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX, UI = IST.UI;
  var V = IST.V = IST.V || {};
  var h = U.h;
  var openHabit = null;

  V.me = function (root, sub) {
    var x = M.xp(), st = S.state, got = C.badges.filter(function (b) { return st.badges[b.id]; }).length;
    root.appendChild(h('header', { class: 'page-head me-head' },
      UI.levelStar(x.level, 76),
      h('div', { class: 'me-id' },
        h('p', { class: 'kicker' }, 'Level ' + x.level + ' · ' + x.name.uz),
        h('h1', { class: 'page-title' }, st.profile.name || 'You'),
        h('p', { class: 'me-level' }, x.name.en + ' · ' + U.fmtNum(x.total) + ' XP'),
        h('div', { class: 'xpbar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': x.need, 'aria-valuenow': x.into, 'aria-label': 'Progress to next level' }, h('i', { style: { width: Math.round(x.pct * 100) + '%' } })),
        h('p', { class: 'muted small' }, (x.need - x.into) + ' XP to level ' + (x.level + 1) + ' · ' + C.levelName(x.level + 1).en + ' · ' + got + ' of ' + C.badges.length + ' achievements'))));

    /* level ladder */
    var ladder = h('div', { class: 'ladder' });
    for (var L = 1; L <= 10; L++) {
      var ln = C.levelName(L);
      ladder.appendChild(h('div', { class: 'rung' + (L < x.level ? ' past' : L === x.level ? ' now' : '') }, h('b', null, String(L)), h('span', null, ln.en), h('small', null, U.fmtNum(C.levelXP(L)) + ' XP')));
    }
    var a = h('div', { class: 'col-a' }), b = h('div', { class: 'col-b' });
    a.appendChild(h('section', { class: 'card' }, UI.section('From egg to Humo', null, 'Humo is the bird of happiness on the emblem of Uzbekistan.'), ladder));

    /* achievements */
    var grid = h('div', { class: 'badges' });
    C.badges.forEach(function (bd) {
      var u = st.badges[bd.id];
      grid.appendChild(h('button', { class: 'badge t' + bd.tier + (u ? ' got' : ''), type: 'button', onclick: function () {
        UI.sheet(bd.name, h('div', { class: 'stack center' }, badgeArt(bd, !!u), h('p', null, bd.desc), h('p', { class: 'muted small' }, u ? 'Unlocked ' + D.label(D.of(u.at), 'full') + (bd.xp ? ' · +' + bd.xp + ' XP' : '') : 'Locked' + (bd.xp ? ' · worth ' + bd.xp + ' XP' : ''))));
      } }, badgeArt(bd, !!u), h('span', { class: 'badge-name' }, bd.name)));
    });
    a.appendChild(h('section', { class: 'card' }, UI.section('Achievements', h('span', { class: 'count' }, got + '/' + C.badges.length)), grid));

    /* saved quotes */
    var favs = Object.keys(st.fav).filter(function (k) { return st.fav[k] && !st.fav[k].del; }).sort(function (p, q) { return st.fav[q].at - st.fav[p].at; });
    var fl = h('div', { class: 'favs' });
    favs.forEach(function (id) {
      var q = IST.data.quotes.filter(function (z) { return z.id === id; })[0]; if (!q) return;
      fl.appendChild(h('div', { class: 'fav' }, q.ar && st.settings.showArabic !== false ? h('p', { class: 'qc-ar small-ar', lang: 'ar', dir: 'rtl' }, q.ar) : null,
        h('p', null, q.en), h('a', { class: 'qc-ref', href: q.url, target: '_blank', rel: 'noopener noreferrer' }, q.ref, C.icon('ext', 13))));
    });
    if (!favs.length) fl.appendChild(UI.empty('Tap the bookmark on a quote to keep it here.', 'bookmark'));
    a.appendChild(h('section', { class: 'card' }, UI.section('Saved quotes', h('span', { class: 'count' }, String(favs.length))), fl));

    b.appendChild(habitsSettings());
    b.appendChild(generalSettings());
    b.appendChild(remindersCard());
    b.appendChild(IST.Sync.card());
    b.appendChild(backupCard());
    b.appendChild(installCard());
    b.appendChild(aboutCard());
    root.appendChild(h('div', { class: 'two-col' }, a, b));
    if (sub) setTimeout(function () { var el = document.getElementById('me-' + sub); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  };

  function badgeArt(bd, got) {
    return h('span', { class: 'badge-art' },
      h('@svg', { viewBox: '0 0 64 64', width: 58, height: 58, 'aria-hidden': 'true' }, h('@path', { d: C.starPath(32, 32, 29), class: 'badge-shape' })),
      h('span', { class: 'badge-ico' }, C.icon(got ? bd.icon : 'lock', 22)));
  }

  /* ---------- quests ---------- */
  function habitsSettings() {
    var sec = h('section', { class: 'card', id: 'me-habits' }, UI.section('Quests', null, 'Targets, minimum versions, and when & where you do each one.'));
    C.habitOrder.forEach(function (hid) {
      var hab = S.state.habits[hid], isOpen = openHabit === hid;
      var row = h('div', { class: 'hset' + (isOpen ? ' open' : '') },
        h('button', { class: 'hset-head', type: 'button', 'aria-expanded': isOpen ? 'true' : 'false', onclick: function () { openHabit = isOpen ? null : hid; IST.App.render(); } },
          UI.habitTile(hid, 34, hab.on !== false), h('span', { class: 'hset-name' }, h('b', null, hab.name), h('small', null, hab.on === false ? 'Paused' : hab.targetText)), C.icon('chevD', 18, isOpen ? 'rot' : '')));
      if (isOpen) row.appendChild(habitForm(hid));
      sec.appendChild(row);
    });
    return sec;
  }

  function habitForm(hid) {
    var hab = S.state.habits[hid];
    var f = {};
    function inp(key, type, attrs) {
      var a = { type: type || 'text', id: 'hf-' + hid + '-' + key, value: hab[key] == null ? '' : hab[key] };
      for (var k in attrs || {}) a[k] = attrs[k];
      return (f[key] = h('input', a));
    }
    var form = h('form', { class: 'stack hset-form', onsubmit: function (e) {
      e.preventDefault();
      var p = {};
      Object.keys(f).forEach(function (k) {
        var el = f[k];
        if (el.type === 'number') p[k] = el.value === '' ? null : +el.value;
        else if (el.type === 'checkbox') p[k] = el.checked;
        else p[k] = el.value;
      });
      if (p.target == null || p.target <= 0) p.target = hab.target;
      if (hid === 'workout' && f.plan) { var pl = C.workoutPlans.filter(function (x) { return x.name === f.plan.value; })[0]; if (pl) p.planDays = pl.days; }
      S.habitSet(hid, p);
      FX.toast(hab.name + ' saved.', { icon: 'check', tone: 'good' });
    } });
    form.appendChild(h('div', { class: 'grid2' }, UI.field('Name', inp('name')), UI.field('Target (' + (hab.unit === 'pages' ? 'pages' : 'minutes') + ')', inp('target', 'number', { min: 1, inputmode: 'numeric' }))));
    form.appendChild(UI.field('What counts as done', inp('targetText')));
    if (hid !== 'quran') form.appendChild(h('div', { class: 'grid2' }, UI.field('Minimum (' + (hab.unit === 'pages' ? 'pages' : 'min') + ')', inp('min', 'number', { min: 1, inputmode: 'numeric' }), 'Empty = no minimum version'), UI.field('Minimum version', inp('minText'))));
    else {
      form.appendChild(h('p', { class: 'muted small' }, "You set 10 minutes as your floor for Qur'an, so it has no smaller version. Add one here only if you change your mind."));
      form.appendChild(h('div', { class: 'grid2' }, UI.field('Minimum (min)', inp('min', 'number', { min: 1, inputmode: 'numeric' })), UI.field('Minimum version', inp('minText'))));
    }
    form.appendChild(h('div', { class: 'grid2' }, UI.field('Weekdays: when & where', inp('anchorWd')), UI.field('Time', inp('timeWd', 'time'))));
    form.appendChild(h('div', { class: 'grid2' }, UI.field('Weekends: when & where', inp('anchorWe')), UI.field('Time', inp('timeWe', 'time'))));
    if (hid === 'book') form.appendChild(h('div', { class: 'grid3' }, UI.field('Book', inp('title')), UI.field('Total pages', inp('total', 'number', { min: 0, inputmode: 'numeric' })), UI.field('Current page', inp('page', 'number', { min: 0, inputmode: 'numeric' }))));
    if (hid === 'workout') {
      f.plan = h('select', { id: 'hf-workout-plan' }, C.workoutPlans.map(function (p) { return h('option', { value: p.name, selected: hab.plan === p.name }, p.name + (p.days ? ' (' + p.days + ' days)' : '')); }));
      form.appendChild(h('div', { class: 'grid2' }, UI.field('Home Workout plan', f.plan), UI.field('Current day', inp('day', 'number', { min: 1, inputmode: 'numeric' }))));
    }
    if (hid === 'quran') form.appendChild(UI.field('Bookmark', inp('mark', 'text', { placeholder: 'e.g. Al-Baqarah 2:142' })));
    f.on = h('input', { type: 'checkbox', id: 'hf-' + hid + '-on', checked: hab.on !== false, class: 'tgl-input' });
    form.appendChild(h('label', { class: 'tgl-row', for: 'hf-' + hid + '-on' }, h('span', { class: 'tgl-text' }, h('span', { class: 'tgl-label' }, 'Active'), h('span', { class: 'tgl-hint' }, 'Paused quests leave your streak and stats alone')), f.on, h('span', { class: 'tgl', 'aria-hidden': 'true' })));
    form.appendChild(h('div', { class: 'row end' }, h('button', { class: 'btn btn-primary', type: 'submit' }, 'Save ' + hab.name)));
    return form;
  }

  /* ---------- general ---------- */
  function generalSettings() {
    var s = S.state.settings;
    function num(id, label, val, opts, onChange, hint) {
      var sel = h('select', { id: id, onchange: function () { onChange(+sel.value); } }, opts.map(function (o) { return h('option', { value: o[0], selected: +val === o[0] }, o[1]); }));
      return UI.field(label, sel, hint);
    }
    var name = h('input', { type: 'text', id: 'set-name', value: S.state.profile.name || '', maxlength: 40, onchange: function () { S.setProfile({ name: name.value.trim() || 'Jaloliddin' }); } });
    var theme = UI.seg([{ id: 'auto', label: 'Auto', icon: 'sync' }, { id: 'dark', label: 'Dark', icon: 'moon' }, { id: 'light', label: 'Light', icon: 'sun' }], s.theme || 'auto', function (v) { S.setSetting('theme', v); IST.App.applyTheme(); }, 'seg-sm');
    return h('section', { class: 'card', id: 'me-settings' },
      UI.section('Settings'),
      h('div', { class: 'stack' },
        UI.field('Your name', name),
        h('div', { class: 'grid2' },
          num('set-streak', 'A streak day needs', s.streakMin, [[1, '1 quest'], [2, '2 quests'], [3, '3 quests'], [4, '4 quests'], [5, 'All 5 quests']], function (v) { S.setSetting('streakMin', v); }, 'Minimum versions and rest days count'),
          num('set-daystart', 'A new day starts at', s.dayStart, [[0, 'Midnight'], [1, '1:00 AM'], [2, '2:00 AM'], [3, '3:00 AM'], [4, '4:00 AM'], [5, '5:00 AM']], function (v) { S.setSetting('dayStart', v); }, 'Late nights count for the day you lived')),
        h('div', { class: 'grid2' },
          num('set-gameper', 'Game time per quest', s.gamePerHabit, [[10, '10 min'], [15, '15 min'], [20, '20 min'], [30, '30 min'], [45, '45 min']], function (v) { S.setSetting('gamePerHabit', v); }, 'A perfect day adds one extra share'),
          num('set-gameunlock', 'Games unlock after', s.gameUnlock, [[1, '1 quest'], [2, '2 quests'], [3, '3 quests'], [4, '4 quests'], [5, 'all 5 quests']], function (v) { S.setSetting('gameUnlock', v); })),
        num('set-newcards', 'New Korean words per day', s.newCards, [[5, '5'], [10, '10'], [15, '15'], [20, '20'], [30, '30']], function (v) { S.setSetting('newCards', v); }),
        UI.toggle('set-pn', 'Include place names in flashcards', s.properNouns, function (v) { S.setSetting('properNouns', v); }, '경복궁, 명동, 부산 and other names from the book'),
        UI.toggle('set-ar', 'Show Arabic text of quotes', s.showArabic !== false, function (v) { S.setSetting('showArabic', v); }),
        UI.toggle('set-snd', 'Sounds', s.sounds !== false, function (v) { S.setSetting('sounds', v); }),
        UI.toggle('set-hap', 'Vibration', s.haptics !== false, function (v) { S.setSetting('haptics', v); }, 'Android only'),
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Theme'), theme)));
  }

  /* ---------- reminders ---------- */
  function gcalLink(hid, weekend) {
    var hab = S.state.habits[hid], tz = 'Asia/Seoul';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) { /* default */ }
    var time = (weekend ? hab.timeWe : hab.timeWd) || '08:00';
    var d = D.today(), w = D.dow(d), add = 0;
    while (weekend ? (w + add) % 7 < 5 : (w + add) % 7 >= 5) add++;
    var day = D.add(d, add).replace(/-/g, '');
    var start = day + 'T' + time.replace(':', '') + '00';
    var endD = new Date(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8), +time.slice(0, 2), +time.slice(3, 5) + Math.min(60, hab.unit === 'min' ? hab.target : 20));
    var end = endD.getFullYear() + D.pad(endD.getMonth() + 1) + D.pad(endD.getDate()) + 'T' + D.pad(endD.getHours()) + D.pad(endD.getMinutes()) + '00';
    var q = 'action=TEMPLATE&text=' + encodeURIComponent(hab.name + ' — ' + hab.targetText) +
      '&details=' + encodeURIComponent((weekend ? hab.anchorWe : hab.anchorWd) + '\nOpen Istiqomat and check it off.') +
      '&dates=' + start + '/' + end + '&ctz=' + encodeURIComponent(tz) +
      '&recur=' + encodeURIComponent('RRULE:FREQ=WEEKLY;BYDAY=' + (weekend ? 'SA,SU' : 'MO,TU,WE,TH,FR'));
    return 'https://calendar.google.com/calendar/render?' + q;
  }
  function icsText() {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Istiqomat//Daily quests//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Istiqomat quests'];
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
    M.habits().forEach(function (hid) {
      var hab = S.state.habits[hid];
      [false, true].forEach(function (we) {
        var time = (we ? hab.timeWe : hab.timeWd); if (!time) return;
        var d = D.today(), w = D.dow(d), add = 0;
        while (we ? (w + add) % 7 < 5 : (w + add) % 7 >= 5) add++;
        var day = D.add(d, add).replace(/-/g, '');
        lines.push('BEGIN:VEVENT', 'UID:istiqomat-' + hid + (we ? '-we' : '-wd') + '@istiqomat', 'DTSTAMP:' + stamp,
          'DTSTART:' + day + 'T' + time.replace(':', '') + '00', 'DURATION:PT' + Math.min(60, hab.unit === 'min' ? hab.target : 20) + 'M',
          'RRULE:FREQ=WEEKLY;BYDAY=' + (we ? 'SA,SU' : 'MO,TU,WE,TH,FR'),
          'SUMMARY:' + esc(hab.name + ' — ' + hab.targetText), 'DESCRIPTION:' + esc((we ? hab.anchorWe : hab.anchorWd) + '. Open Istiqomat and check it off.'),
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(hab.name), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
      });
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }
  function remindersCard() {
    var list = h('div', { class: 'rem-list' });
    M.habits().forEach(function (hid) {
      var hab = S.state.habits[hid];
      list.appendChild(h('div', { class: 'rem' }, UI.habitTile(hid, 30), h('span', { class: 'rem-name' }, h('b', null, hab.name), h('small', null, D.fmtTime(hab.timeWd) + ' weekdays · ' + D.fmtTime(hab.timeWe) + ' weekends')),
        h('span', { class: 'rem-links' }, UI.extLink(gcalLink(hid, false), 'Weekdays', 'pill-link'), UI.extLink(gcalLink(hid, true), 'Weekends', 'pill-link'))));
    });
    var inClaude = U.inClaude();
    return h('section', { class: 'card', id: 'me-reminders' },
      UI.section('Reminders', null, 'Phones only buzz for apps that can wake up. The reliable way is your calendar: add each quest once and every device you are signed in to will remind you.'),
      list,
      inClaude ? h('p', { class: 'muted small' }, 'The all-in-one calendar file (.ics) is available in the installable app.')
        : h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { UI.saveFile('istiqomat-quests.ics', icsText(), 'text/calendar').then(function (ok) { if (ok) FX.toast('Calendar file saved. Import it at calendar.google.com → Settings → Import.', { icon: 'calendar', ms: 5000 }); }); } }, C.icon('download', 18), 'Download all as a calendar file (.ics)'),
      h('p', { class: 'muted small' }, 'Times come from your quest settings. Change them there first, then add the reminders.'));
  }

  /* ---------- backup ---------- */
  function backupCard() {
    var file = h('input', { type: 'file', id: 'imp-file', accept: '.json,application/json', class: 'sr-only', onchange: function () {
      var fl = file.files && file.files[0]; if (!fl) return;
      var r = new FileReader();
      r.onload = function () {
        try { S.importText(String(r.result)); FX.toast('Backup merged into this device.', { icon: 'upload', tone: 'good' }); }
        catch (e) { FX.toast(e.message || 'That file could not be read.', { icon: 'info', tone: 'warn' }); }
        file.value = '';
      };
      r.readAsText(fl);
    } });
    return h('section', { class: 'card', id: 'me-backup' },
      UI.section('Backup & move', null, 'Export everything to a file, import it on another device or in the other version of the app. Importing merges — nothing is lost.'),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn btn-soft', type: 'button', onclick: function () {
          UI.saveFile('istiqomat-backup-' + D.today() + '.json', S.exportText(), 'application/json').then(function (ok) { if (ok) FX.toast('Backup saved.', { icon: 'download', tone: 'good' }); });
        } }, C.icon('download', 18), 'Export backup'),
        h('label', { class: 'btn btn-soft', for: 'imp-file' }, C.icon('upload', 18), 'Import backup', file),
        h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { U.copy(S.exportText()).then(function () { FX.toast('Backup copied. Paste it into a note or Telegram “Saved Messages”.', { icon: 'copy', ms: 4500 }); }, function () { FX.toast('Copy is blocked here — use Export.', { icon: 'info' }); }); } }, C.icon('copy', 18), 'Copy as text')),
      h('details', { class: 'paste-imp' }, h('summary', null, 'Paste a backup instead'),
        (function () {
          var ta = h('textarea', { id: 'imp-text', rows: 3, placeholder: 'Paste the copied backup text here' });
          return h('div', { class: 'stack-sm' }, ta, h('button', { class: 'btn btn-small', type: 'button', onclick: function () {
            try { S.importText(ta.value); ta.value = ''; FX.toast('Backup merged.', { icon: 'upload', tone: 'good' }); } catch (e) { FX.toast(e.message, { icon: 'info', tone: 'warn' }); }
          } }, 'Merge pasted backup'));
        })()),
      h('button', { class: 'btn btn-danger-ghost btn-small', type: 'button', onclick: function () {
        UI.confirm('Erase everything on this device?', 'Erase', true, 'Export a backup first. If sync is on, the other devices keep their copy and will send it back.').then(function (ok) { if (ok) { S.resetAll(); FX.toast('Fresh start.', { icon: 'sparkle' }); } });
      } }, C.icon('trash', 16), 'Erase this device'));
  }

  /* ---------- install ---------- */
  function installCard() {
    var mode = U.inClaude() ? 'You are using the Claude-hosted page.' : U.isStandalone() ? 'You are using the installed app.' : 'You are using the web version.';
    var prompt = IST.App.installPrompt;
    return h('section', { class: 'card', id: 'me-install' },
      UI.section('On your phones and PC', null, mode),
      prompt ? h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { prompt.prompt(); } }, C.icon('download', 18), 'Install Istiqomat') : null,
      h('div', { class: 'install-steps' },
        h('div', null, h('b', null, 'Android (both phones)'), h('p', { class: 'small' }, 'Open the app link in Chrome → ⋮ menu → “Add to Home screen” → Install. It gets its own icon and opens full-screen. Put it where your most-used social app was.')),
        h('div', null, h('b', null, 'Windows'), h('p', { class: 'small' }, 'Open the link in Edge or Chrome → the install icon in the address bar (or ⋯ → Apps → Install). Then right-click its taskbar icon → Pin.')),
        h('div', null, h('b', null, 'Claude-hosted page'), h('p', { class: 'small' }, 'Open the artifact link while signed in to Claude. On Android: Chrome ⋮ → Add to Home screen. Your data syncs through Claude automatically.'))));
  }

  function aboutCard() {
    return h('section', { class: 'card about' },
      UI.section('About Istiqomat'),
      h('p', { class: 'small' }, 'Istiqomat means steadfastness: "Those who say, Our Lord is Allah, and then remain steadfast…" (41:30). Built for five daily quests — Qur\'an, Korean, workout, reading and your channel.'),
      h('p', { class: 'small muted' }, 'Arabic Qur\'an text from Quran.com (Tanzil, Uthmani). English lines give the meaning; each card links to Quran.com or Sunnah.com for the standard translation and grading. Korean plan, vocabulary and page numbers from Fun! Fun! Korean 1 (Korea University Korean Language & Culture Center, Kyobo). Fonts: Unbounded, Onest, Amiri Quran (SIL Open Font License).'),
      h('p', { class: 'small muted' }, 'Version 1.0 · ' + (U.inClaude() ? 'Claude page' : 'installable app')));
  }
})();
