/* Istiqomat — Korean: Fun! Fun! Korean 1 plan (review of Units 1–4, then Unit 5 Location onward),
   flashcards with spaced repetition and pronunciation, grammar cards and word lists. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX, A = IST.A, UI = IST.UI, CH = IST.CH;
  var V = IST.V = IST.V || {};
  var h = U.h;
  var openUnit = null;
  var CHECKS = 'istiqomat.kochecks';

  V.korean = function (root) {
    var k = M.ko(), K = M.K(), cur = k.current;
    var ring = CH.ring(k.pct, 84, 9, 'ko', h('div', { class: 'ring-num' }, h('b', null, Math.round(k.pct * 100) + '%')));
    root.appendChild(h('header', { class: 'page-head ko-head' },
      h('div', null,
        h('p', { class: 'kicker' }, K.book.ko + ' · ' + K.book.title),
        h('h1', { class: 'page-title' }, '한국어 ', h('span', { class: 'thin' }, 'Korean')),
        h('p', { class: 'muted' }, k.done + ' of ' + k.total + ' sessions · ' + k.learned + ' words learned' + (cur ? ' · on pace to finish ' + D.short(k.finish) : ''))),
      ring));
    var a = h('div', { class: 'col-a' }), b = h('div', { class: 'col-b' });
    a.appendChild(cur ? sessionCard(cur, k) : h('section', { class: 'card' }, UI.empty('Book 1 complete. Keep your flashcards alive while Book 2 arrives.', 'trophy')));
    b.appendChild(cardsCard(k));
    b.appendChild(h('section', { class: 'card note-card' }, C.icon('info', 18), h('p', { class: 'small' }, K.book.pdfNote)));
    a.appendChild(unitsList(k));
    root.appendChild(h('div', { class: 'two-col' }, a, b));
  };

  function unitBadge(n) {
    var u = M.unitOf(n);
    return h('span', { class: 'unit-badge' }, h('b', null, '제' + n + '과'), ' ' + u.ko);
  }

  function sessionCard(s, k) {
    var u = M.unitOf(s.unit), checks = U.ls.getJSON(CHECKS, {}), mine = checks[s.id] || {};
    var list = h('ol', { class: 'ko-tasks' });
    s.tasks.forEach(function (t, i) {
      var id = 'kt-' + s.id + '-' + i;
      var cb = h('input', { type: 'checkbox', id: id, checked: !!mine[i], onchange: function () { var c = U.ls.getJSON(CHECKS, {}); c[s.id] = c[s.id] || {}; c[s.id][i] = cb.checked ? 1 : 0; U.ls.setJSON(CHECKS, c); FX.sound('tap'); } });
      list.appendChild(h('li', null, h('label', { for: id, class: 'ko-task' }, cb, h('span', { class: 'ko-box', 'aria-hidden': 'true' }, C.icon('check', 14)), h('span', null, t))));
    });
    var gram = h('div', { class: 'chips' });
    s.grammar.forEach(function (g) { var G = M.K().grammar[g]; gram.appendChild(h('button', { class: 'chip chip-btn', type: 'button', onclick: function () { grammarSheet(g); } }, G.title)); });
    var done = M.sessionDone(s.id);
    var btn = h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { A.sessionDone(s.id, true, btn); FX.toast('Session complete. Next one is ready.', { icon: 'hangul', tone: 'good' }); } }, C.icon('check', 20), 'Session complete');
    return h('section', { class: 'card session-card' },
      h('div', { class: 'row between wrap gap' }, s.kind === 'review' ? h('span', { class: 'unit-badge review' }, h('b', null, 'Review'), ' Units 1–4') : unitBadge(s.unit),
        h('span', { class: 'muted small' }, 'Session ' + (k.currentIndex + 1) + ' of ' + k.total)),
      h('h2', { class: 'session-title' }, s.title),
      h('p', { class: 'session-pages' }, C.icon('book', 16), 'Book ' + M.pageRange(s), h('span', { class: 'muted' }, ' · ' + M.pdfRange(s))),
      s.note ? h('p', { class: 'muted small' }, s.note) : null,
      list,
      s.grammar.length ? h('div', { class: 'stack-sm' }, h('p', { class: 'kicker' }, 'Grammar for this session'), gram) : null,
      h('div', { class: 'row gap wrap' }, btn,
        h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { V.flashcards(); } }, C.icon('cards', 18), 'Flashcards'),
        u ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { wordsSheet(s.unit === 1 && s.id === 'r1' ? [1, 2] : [s.unit]); } }, 'Unit words') : null),
      h('p', { class: 'muted small' }, 'About 30 minutes. Finishing the session also checks off today\'s Korean quest.'));
  }

  function cardsCard(k) {
    var due = k.due.length, fresh = Math.min(k.fresh.length, k.newLeft);
    var total = due + fresh;
    return h('section', { class: 'card cards-card' },
      UI.section('Flashcards', null, 'Spaced repetition: each word comes back just before you would forget it.'),
      h('div', { class: 'stat-row' },
        h('div', { class: 'stat' }, h('b', null, String(due)), h('span', null, 'due now')),
        h('div', { class: 'stat' }, h('b', null, String(fresh)), h('span', null, 'new today')),
        h('div', { class: 'stat' }, h('b', null, String(k.learned)), h('span', null, 'learned')),
        h('div', { class: 'stat' }, h('b', null, String(k.reviewedToday)), h('span', null, 'reviewed today'))),
      h('button', { class: 'btn btn-primary btn-lg', type: 'button', disabled: !total, onclick: function () { V.flashcards(); } }, C.icon('cards', 20), total ? 'Start · ' + total + ' cards' : 'All caught up'),
      h('p', { class: 'muted small' }, 'Ten cards also count as the minimum version of the Korean quest. Words come from Units 1–' + k.unitMax + ' of the book glossary.'));
  }

  function unitsList(k) {
    var K = M.K(), sec = h('section', { class: 'card units-card' }, UI.section('All units', null, 'Tap a unit to see its sessions, grammar and words. You can tick sessions in any order.'));
    K.units.forEach(function (u) {
      var us = K.sessions.filter(function (s) { return s.unit === u.n || (s.also && s.also.indexOf(u.n) >= 0); });
      var prog = k.units.filter(function (x) { return x.n === u.n; })[0];
      var isOpen = openUnit === u.n || (openUnit == null && k.current && k.current.unit === u.n);
      var head = h('button', { class: 'unit-head', type: 'button', 'aria-expanded': isOpen ? 'true' : 'false', onclick: function () { openUnit = isOpen ? -1 : u.n; IST.App.render(); } },
        h('span', { class: 'unit-num' }, String(u.n)),
        h('span', { class: 'unit-name' }, h('b', { lang: 'ko' }, u.ko), h('span', null, u.en)),
        prog && prog.total ? h('span', { class: 'unit-prog' + (prog.done === prog.total ? ' full' : '') }, prog.done + '/' + prog.total) : h('span', { class: 'unit-prog' }, '—'),
        C.icon('chevD', 18, isOpen ? 'rot' : ''));
      var row = h('div', { class: 'unit' + (isOpen ? ' open' : '') }, head);
      if (isOpen) {
        var inner = h('div', { class: 'unit-body' });
        inner.appendChild(h('p', { class: 'small' }, u.goals, h('span', { class: 'muted' }, ' · pp. ' + u.pages[0] + '–' + u.pages[1] + ' · Pronunciation: ' + u.pron + ' · Culture: ' + u.culture)));
        var gl = h('div', { class: 'chips' });
        u.grammar.forEach(function (g) { gl.appendChild(h('button', { class: 'chip chip-btn', type: 'button', onclick: function () { grammarSheet(g); } }, K.grammar[g].title)); });
        inner.appendChild(gl);
        var sl = h('ul', { class: 'sess-list' });
        us.forEach(function (s) {
          var dn = M.sessionDone(s.id), isCur = k.current && k.current.id === s.id;
          var cb = h('button', { class: 'tcheck' + (dn ? ' on' : ''), type: 'button', 'aria-label': (dn ? 'Mark not done: ' : 'Mark done: ') + s.title, onclick: function () {
            if (dn) { S.koSession(s.id, false); FX.sound('undo'); } else A.sessionDone(s.id, true, cb);
          } }, C.icon('check', 16));
          sl.appendChild(h('li', { class: 'sess' + (dn ? ' done' : '') + (isCur ? ' cur' : '') }, cb,
            h('span', { class: 'sess-text' }, h('span', { class: 'sess-title' }, s.title), h('span', { class: 'muted small' }, M.pageRange(s) + ' · ' + M.pdfRange(s) + (isCur ? ' · next up' : '')))));
        });
        inner.appendChild(sl);
        inner.appendChild(h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () { wordsSheet(u.n === 1 ? [1] : [u.n]); } }, C.icon('cards', 16), 'Words in this unit (' + K.words.filter(function (w) { return w.u === u.n; }).length + ')'));
        row.appendChild(inner);
      }
      sec.appendChild(row);
    });
    return sec;
  }

  function grammarSheet(gid) {
    var G = M.K().grammar[gid], u = M.unitOf(G.unit);
    var body = h('div', { class: 'stack gram' },
      h('p', { class: 'kicker' }, 'Unit ' + G.unit + ' · ' + u.en + ' · grammar page ' + G.page),
      h('p', { class: 'gram-mean' }, G.meaning),
      h('ul', { class: 'gram-form' }, G.form.map(function (f) { return h('li', { lang: 'ko' }, f); })),
      h('div', { class: 'gram-ex' }, G.ex.map(function (e) {
        return h('div', { class: 'ex' }, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Listen', onclick: function () { IST.Stories.speak(e[0]); } }, C.icon('volume', 18)),
          h('div', null, h('p', { class: 'ex-ko', lang: 'ko' }, e[0]), h('p', { class: 'muted' }, e[1])));
      })),
      h('p', { class: 'muted small' }, 'A short summary for quick review. The full explanation is in your book.'));
    UI.sheet(G.title, body);
  }
  V.grammarSheet = grammarSheet;

  function wordsSheet(units) {
    var K = M.K(), cards = S.state.ko.c;
    var ws = K.words.filter(function (w) { return units.indexOf(w.u) >= 0; });
    var list = h('div', { class: 'word-list' });
    ws.forEach(function (w) {
      var c = cards[w.id];
      list.appendChild(h('div', { class: 'word' + (w.pn ? ' pn' : '') },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Listen to ' + w.ko, onclick: function () { IST.Stories.speak(w.ko); } }, C.icon('volume', 18)),
        h('span', { class: 'w-ko', lang: 'ko' }, w.ko),
        h('span', { class: 'w-en' }, w.en),
        h('span', { class: 'w-meta' }, 'p. ' + w.p + (c ? ' · box ' + c.b : ''))));
    });
    UI.sheet('Words · Unit ' + units.join('–') + ' (' + ws.length + ')', h('div', { class: 'stack' }, h('p', { class: 'muted small' }, 'From the book glossary and the unit pages. Place names are shown but left out of flashcards.'), list), { wide: true });
  }

  /* ---------- flashcards ---------- */
  V.flashcards = function () {
    var queue = M.koQueue();
    if (!queue.length) { FX.toast('No cards due. Come back tomorrow — or finish a session to unlock new words.', { icon: 'cards' }); return; }
    var i = 0, flipped = false, stats = { good: 0, again: 0, known: 0, n: 0 }, requeued = {};
    var prev = A.snapshot();
    var prog = h('div', { class: 'fc-prog' }, h('i'));
    var count = h('span', { class: 'fc-count' });
    var card = h('div', { class: 'fc-card', tabindex: '0', role: 'button', 'aria-label': 'Flip card' });
    var btns = h('div', { class: 'fc-btns' });
    var ov = h('div', { class: 'fc', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Flashcards' },
      h('div', { class: 'fc-top' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close flashcards', onclick: function () { finish(); } }, C.icon('x', 22)),
        prog, count),
      h('div', { class: 'fc-stage' }, card),
      btns,
      h('p', { class: 'fc-keys' }, 'Space: flip · 1: again · 2: got it · 3: I already know it'));
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('in'); });
    card.addEventListener('click', flip);
    function onKey(e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      else if (e.key === '1' && flipped) grade('again');
      else if (e.key === '2' && flipped) grade('good');
      else if (e.key === '3') grade('known');
      else if (e.key === 'Escape') finish();
    }
    document.addEventListener('keydown', onKey);
    function paint() {
      var w = queue[i];
      prog.firstChild.style.width = (i / queue.length * 100) + '%';
      count.textContent = (i + 1) + ' / ' + queue.length;
      var c = S.state.ko.c[w.id];
      U.clear(card);
      card.className = 'fc-card' + (flipped ? ' flipped' : '');
      card.appendChild(h('div', { class: 'fc-face' },
        h('span', { class: 'fc-tag' }, w.isNew && !c ? 'New word' : 'Review · box ' + (c ? c.b : 0)),
        h('span', { class: 'fc-ko', lang: 'ko' }, w.ko),
        flipped ? h('span', { class: 'fc-en' }, w.en) : h('span', { class: 'fc-hint' }, 'Say it, then tap to check'),
        flipped ? h('span', { class: 'fc-meta' }, 'Unit ' + w.u + ' · p. ' + w.p) : null,
        h('button', { class: 'btn btn-glass btn-small', type: 'button', onclick: function (e) { e.stopPropagation(); IST.Stories.speak(w.ko); } }, C.icon('volume', 16), 'Listen')));
      U.clear(btns);
      if (!flipped) {
        btns.appendChild(h('button', { class: 'btn btn-lg btn-soft', type: 'button', onclick: flip }, 'Show meaning'));
        if (!c) btns.appendChild(h('button', { class: 'btn btn-lg btn-ghost', type: 'button', onclick: function () { grade('known'); } }, 'I already know it'));
      } else {
        btns.appendChild(h('button', { class: 'btn btn-lg btn-again', type: 'button', onclick: function () { grade('again'); } }, C.icon('repeat', 18), 'Again'));
        btns.appendChild(h('button', { class: 'btn btn-lg btn-good', type: 'button', onclick: function () { grade('good'); } }, C.icon('check', 18), 'Got it'));
      }
    }
    function flip() { flipped = !flipped; FX.sound('flip'); if (flipped) IST.Stories.speak(queue[i].ko); paint(); }
    function grade(gr) {
      var w = queue[i];
      M.koGrade(w, gr);
      stats.n++; stats[gr]++;
      FX.sound(gr === 'again' ? 'again' : 'good');
      if (gr === 'again' && !requeued[w.id]) { requeued[w.id] = 1; queue.push(Object.assign({}, w, { isNew: false })); }
      i++; flipped = false;
      if (i >= queue.length) return summary();
      paint();
    }
    function summary() {
      prog.firstChild.style.width = '100%';
      U.clear(card); U.clear(btns);
      card.className = 'fc-card done';
      card.appendChild(h('div', { class: 'fc-face' },
        h('span', { class: 'fc-tag' }, 'Session done'),
        h('span', { class: 'fc-ko' }, '잘했어요!'),
        h('span', { class: 'fc-en' }, stats.n + ' cards · ' + stats.good + ' got it · ' + stats.again + ' again · ' + stats.known + ' already known'),
        h('span', { class: 'fc-meta' }, 'Well done. +' + Math.min(20, (S.state.kr[D.today()] || {}).n || 0) + ' XP from cards today (max 20).')));
      btns.appendChild(h('button', { class: 'btn btn-lg btn-primary', type: 'button', onclick: finish }, 'Done'));
      FX.confetti(null, window.innerHeight * 0.4, { n: 60 });
      FX.sound('perfect');
    }
    function finish() {
      document.removeEventListener('keydown', onKey);
      try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      ov.classList.remove('in');
      setTimeout(function () { ov.remove(); }, 220);
      if (stats.n) A.flashcardsFinished(stats.n, null, prev);
      else IST.App.render();
    }
    paint();
  };
})();
