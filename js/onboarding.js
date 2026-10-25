/* Istiqomat — first-run setup: name, book & workout, when and where for each quest. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX, UI = IST.UI;
  var OB = IST.Onboarding = {};
  var h = U.h;
  var ov = null;

  OB.isOpen = function () { return !!ov; };
  OB.close = function () { if (ov) { var o = ov; ov = null; o.classList.remove('in'); setTimeout(function () { o.remove(); }, 250); } };

  OB.show = function () {
    if (ov) return;
    var step = 0, data = {
      name: S.state.profile.name || 'Jaloliddin',
      total: S.state.habits.book.total || '', page: S.state.habits.book.page || '',
      plan: S.state.habits.workout.plan, day: S.state.habits.workout.day || 1, times: {}
    };
    C.habitOrder.forEach(function (hid) { data.times[hid] = { wd: S.state.habits[hid].timeWd, we: S.state.habits[hid].timeWe }; });
    var box = h('div', { class: 'ob-card' });
    ov = h('div', { class: 'ob', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Set up Istiqomat' }, box);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('in'); });

    function dots() { var d = h('div', { class: 'ob-dots' }); for (var i = 0; i < 4; i++) d.appendChild(h('i', { class: i === step ? 'on' : i < step ? 'past' : '' })); return d; }
    function nav(nextLabel, onNext, back) {
      return h('div', { class: 'row gap between ob-nav' },
        back ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { step--; paint(); } }, 'Back') : h('span'),
        h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: onNext }, nextLabel));
    }
    function paint() {
      U.clear(box);
      box.appendChild(dots());
      if (step === 0) {
        var nm = h('input', { type: 'text', id: 'ob-name', value: data.name, maxlength: 40 });
        box.appendChild(h('div', { class: 'ob-hero' },
          h('@svg', { viewBox: '0 0 120 120', width: 96, height: 96, class: 'ob-star', 'aria-hidden': 'true' }, h('@path', { d: C.starPath(60, 60, 56) })),
          h('span', { class: 'ob-wing' }, C.icon('feather', 40))));
        box.appendChild(h('p', { class: 'kicker center' }, 'Assalomu alaykum'));
        box.appendChild(h('h1', { class: 'ob-title' }, 'Istiqomat'));
        box.appendChild(h('p', { class: 'ob-lead' }, 'Five daily quests — Qur\'an, Korean, workout, reading and your channel. Streaks with shields so one bad day never wipes you out, double XP and a boss on weekends, and game time you earn by finishing quests.'));
        box.appendChild(UI.field('What should I call you?', nm));
        box.appendChild(nav('Start', function () { data.name = nm.value.trim() || 'Jaloliddin'; step++; paint(); }));
      } else if (step === 1) {
        var tot = h('input', { type: 'number', id: 'ob-total', inputmode: 'numeric', min: 0, value: data.total, placeholder: 'e.g. 320' });
        var pg = h('input', { type: 'number', id: 'ob-page', inputmode: 'numeric', min: 0, value: data.page, placeholder: 'e.g. 54' });
        var plan = h('select', { id: 'ob-plan' }, C.workoutPlans.map(function (p) { return h('option', { value: p.name, selected: p.name === data.plan }, p.name); }));
        var day = h('input', { type: 'number', id: 'ob-day', inputmode: 'numeric', min: 1, value: data.day });
        box.appendChild(h('h2', { class: 'ob-h2' }, 'Your book and your workout'));
        box.appendChild(h('p', { class: 'muted' }, 'So the app can show progress and predict when you will finish. You can skip and fill these in later.'));
        box.appendChild(h('div', { class: 'ob-group' }, h('p', { class: 'ob-label' }, UI.habitTile('book', 28), ' Baxtiyor Oila'), h('div', { class: 'grid2' }, UI.field('Pages in the book', tot), UI.field('Page you are on', pg))));
        box.appendChild(h('div', { class: 'ob-group' }, h('p', { class: 'ob-label' }, UI.habitTile('workout', 28), ' Home Workout'), h('div', { class: 'grid2' }, UI.field('Plan', plan), UI.field('Day you are on', day))));
        box.appendChild(nav('Next', function () { data.total = tot.value; data.page = pg.value; data.plan = plan.value; data.day = +day.value || 1; step++; paint(); }, true));
      } else if (step === 2) {
        box.appendChild(h('h2', { class: 'ob-h2' }, 'When will you do them?'));
        box.appendChild(h('p', { class: 'muted' }, 'A quest with a set time and place gets done about twice as often. Weekends get their own times, because that is where things usually slip.'));
        var grid = h('div', { class: 'ob-times' }, h('span'), h('span', { class: 'plan-day' }, 'Weekdays'), h('span', { class: 'plan-day' }, 'Weekends'));
        var inputs = [];
        C.habitOrder.forEach(function (hid) {
          var a = h('input', { type: 'time', id: 'ob-wd-' + hid, value: data.times[hid].wd }), b = h('input', { type: 'time', id: 'ob-we-' + hid, value: data.times[hid].we });
          inputs.push([hid, a, b]);
          grid.appendChild(h('span', { class: 'plan-h' }, UI.habitTile(hid, 26), S.state.habits[hid].name));
          grid.appendChild(a); grid.appendChild(b);
        });
        box.appendChild(grid);
        box.appendChild(h('p', { class: 'muted small' }, "Qur'an is anchored right after Fajr on both — prayer times stay fixed even when the weekend does not."));
        box.appendChild(nav('Next', function () { inputs.forEach(function (x) { data.times[x[0]] = { wd: x[1].value, we: x[2].value }; }); step++; paint(); }, true));
      } else {
        box.appendChild(h('div', { class: 'ob-hero' }, h('@svg', { viewBox: '0 0 120 120', width: 96, height: 96, class: 'ob-star', 'aria-hidden': 'true' }, h('@path', { d: C.starPath(60, 60, 56) })), h('span', { class: 'ob-wing' }, C.icon('flag', 38))));
        box.appendChild(h('h2', { class: 'ob-h2 center' }, 'Ready, ' + data.name));
        box.appendChild(h('ul', { class: 'ob-list' },
          h('li', null, h('b', null, 'Tap the circle'), ' on a quest when it is done. Tap the card for the minimum version, timer and more.'),
          h('li', null, h('b', null, 'Never miss twice. '), 'A short day costs a shield, not your streak. You start with one.'),
          h('li', null, h('b', null, 'Day 5 is your breakthrough. '), 'You usually stopped after 3 or 4 days — there is a badge waiting just past that wall.'),
          h('li', null, h('b', null, 'Put the icon where your most-used social app is '), 'on all three home screens.')));
        box.appendChild(nav('Bismillah — let\'s go', finish, true));
      }
    }
    function finish(e) {
      S.setProfile({ name: data.name });
      S.habitSet('book', { total: +data.total || 0, page: +data.page || 0 });
      var pl = C.workoutPlans.filter(function (p) { return p.name === data.plan; })[0];
      S.habitSet('workout', { plan: data.plan, planDays: pl ? pl.days : 0, day: data.day });
      C.habitOrder.forEach(function (hid) { S.habitSet(hid, { timeWd: data.times[hid].wd, timeWe: data.times[hid].we }); });
      S.setMeta({ onboarded: true, start: S.state.meta.start || D.today() });
      FX.sound('perfect'); FX.confetti(null, window.innerHeight * 0.4, { big: true, n: 120 });
      OB.close();
      void e;
    }
    paint();
  };
})();
