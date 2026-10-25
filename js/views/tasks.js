/* Istiqomat — Tasks: to-do list with due dates, priorities and tags + the YouTube video board. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX, A = IST.A, UI = IST.UI;
  var V = IST.V = IST.V || {};
  var h = U.h;
  var tab = 'todo', showDone = false;
  var draft = { due: 'today', pr: 0, tag: '' };

  V.tasks = function (root, sub) {
    if (sub) tab = sub;
    root.appendChild(h('header', { class: 'page-head' },
      h('div', null, h('p', { class: 'kicker' }, 'Side quests'), h('h1', { class: 'page-title' }, 'Tasks')),
      UI.seg([{ id: 'todo', label: 'To-do', icon: 'tasks' }, { id: 'videos', label: 'Videos', icon: 'play' }], tab, function (v) { tab = v; IST.App.render(); })));
    if (tab === 'videos') return videos(root);
    todo(root);
  };

  function dueFrom(key) {
    var d = D.today();
    if (key === 'today') return d;
    if (key === 'tomorrow') return D.add(d, 1);
    if (key === 'week') return D.add(D.startOfWeek(d), 6);
    if (key === 'someday') return '';
    return key; /* explicit date */
  }

  function todo(root) {
    var d = D.today();
    var input = h('input', { type: 'text', id: 'task-new', placeholder: 'What needs doing?', autocomplete: 'off', maxlength: 160 });
    var dateIn = h('input', { type: 'date', id: 'task-date', class: 'date-pick', 'aria-label': 'Pick a date', value: /^\d{4}-/.test(draft.due) ? draft.due : '',
      onchange: function () { if (dateIn.value) { draft.due = dateIn.value; paintChips(); } } });
    var chips = h('div', { class: 'chip-row' });
    function paintChips() {
      U.clear(chips);
      [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'This week'], ['someday', 'Someday']].forEach(function (c) {
        chips.appendChild(h('button', { type: 'button', class: 'pick' + (draft.due === c[0] ? ' on' : ''), onclick: function () { draft.due = c[0]; dateIn.value = ''; paintChips(); } }, c[1]));
      });
      chips.appendChild(h('label', { class: 'pick pick-date' + (/^\d{4}-/.test(draft.due) ? ' on' : '') }, C.icon('calendar', 15), /^\d{4}-/.test(draft.due) ? D.label(draft.due, 'md') : 'Date', dateIn));
      chips.appendChild(h('button', { type: 'button', class: 'pick' + (draft.pr ? ' on prio' : ''), 'aria-pressed': draft.pr ? 'true' : 'false', onclick: function () { draft.pr = draft.pr ? 0 : 1; paintChips(); } }, C.icon('flag', 15), 'High'));
      var sel = h('select', { id: 'task-tag', class: 'pick-select', 'aria-label': 'Tag', onchange: function () { draft.tag = sel.value; } },
        h('option', { value: '' }, 'No tag'),
        C.taskTags.map(function (t) { return h('option', { value: t.id, selected: draft.tag === t.id }, t.name); }));
      chips.appendChild(sel);
    }
    paintChips();
    var form = h('form', { class: 'card add-card', onsubmit: function (e) {
      e.preventDefault(); var t = input.value.trim(); if (!t) { input.focus(); return; }
      S.taskAdd({ t: t, due: dueFrom(draft.due), pr: draft.pr, tag: draft.tag });
      FX.sound('tap'); input.value = '';
      IST.App.renderKeep('task-new');
    } }, h('div', { class: 'quick-add' }, input, h('button', { class: 'btn btn-primary btn-icon', type: 'submit', 'aria-label': 'Add task' }, C.icon('plus', 20))), chips);
    root.appendChild(form);

    var all = Object.keys(S.state.tasks).map(function (k) { return S.state.tasks[k]; }).filter(function (t) { return !t.del; });
    var open = all.filter(function (t) { return !t.done; });
    var wkEnd = D.add(D.startOfWeek(d), 6), tm = D.add(d, 1);
    var groups = [
      { name: 'Overdue', f: function (t) { return t.due && t.due < d; }, cls: 'late' },
      { name: 'Today', f: function (t) { return t.due === d; } },
      { name: 'Tomorrow', f: function (t) { return t.due === tm; } },
      { name: 'Later this week', f: function (t) { return t.due > tm && t.due <= wkEnd; } },
      { name: 'Later', f: function (t) { return t.due > tm && t.due > wkEnd; } },
      { name: 'Someday', f: function (t) { return !t.due; } }
    ];
    var any = false;
    groups.forEach(function (g) {
      var items = open.filter(g.f).sort(function (a, b) { return (b.pr || 0) - (a.pr || 0) || (a.due || '').localeCompare(b.due || '') || a.c - b.c; });
      if (!items.length) return;
      any = true;
      var list = h('div', { class: 'tlist' });
      items.forEach(function (t) { list.appendChild(V.taskRow(t, d)); });
      root.appendChild(h('section', { class: 'card tgroup ' + (g.cls || '') }, UI.section(g.name, h('span', { class: 'count' }, String(items.length))), list));
    });
    if (!any) root.appendChild(h('section', { class: 'card' }, UI.empty('No open tasks. Add one above — small, specific and with a day.', 'tasks')));
    var done = all.filter(function (t) { return t.done; }).sort(function (a, b) { return b.done - a.done; });
    if (done.length) {
      var dl = h('div', { class: 'tlist' });
      if (showDone) done.slice(0, 40).forEach(function (t) { dl.appendChild(V.taskRow(t, d)); });
      root.appendChild(h('section', { class: 'card tgroup done-group' },
        UI.section('Completed', h('button', { class: 'link-btn', type: 'button', onclick: function () { showDone = !showDone; IST.App.render(); } }, showDone ? 'Hide' : 'Show ' + Math.min(40, done.length)), done.length + ' done · ' + M.tasksStats().week + ' this week'),
        dl));
    }
  }

  V.taskSheet = function (id) {
    var t = S.state.tasks[id]; if (!t) return;
    var sh;
    var title = h('input', { type: 'text', id: 'ts-title', value: t.t, maxlength: 160 });
    var due = h('input', { type: 'date', id: 'ts-due', value: t.due || '' });
    var note = h('textarea', { id: 'ts-note', rows: 3, placeholder: 'Notes (optional)' }, t.note || '');
    var tag = h('select', { id: 'ts-tag' }, h('option', { value: '' }, 'No tag'), C.taskTags.map(function (x) { return h('option', { value: x.id, selected: t.tag === x.id }, x.name); }));
    var pr = h('input', { type: 'checkbox', id: 'ts-pr', checked: !!t.pr });
    var body = h('form', { class: 'stack', onsubmit: function (e) {
      e.preventDefault();
      S.taskSet(id, { t: title.value.trim() || t.t, due: due.value || '', note: note.value, tag: tag.value, pr: pr.checked ? 1 : 0 });
      sh.close(); FX.toast('Task saved.', { icon: 'check' });
    } },
      UI.field('Task', title),
      h('div', { class: 'grid2' }, UI.field('Due date', due, 'Leave empty for Someday'), UI.field('Tag', tag)),
      h('label', { class: 'check-row', for: 'ts-pr' }, pr, h('span', null, 'High priority')),
      UI.field('Notes', note),
      h('div', { class: 'row gap between' },
        h('button', { class: 'btn btn-danger-ghost', type: 'button', onclick: function () {
          UI.confirm('Delete this task?', 'Delete', true).then(function (ok) { if (ok) { S.taskSet(id, { del: 1 }); sh.close(); FX.toast('Task deleted.', { icon: 'trash', action: { label: 'Undo', fn: function () { S.taskSet(id, { del: 0 }); } } }); } });
        } }, C.icon('trash', 16), 'Delete'),
        h('div', { class: 'row gap' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { A.taskToggle(id); sh.close(); } }, t.done ? 'Mark not done' : 'Complete'),
          h('button', { class: 'btn btn-primary', type: 'submit' }, 'Save'))));
    sh = UI.sheet('Edit task', body, { noFocus: true });
  };

  /* ---------- video board ---------- */
  function videos(root) {
    var input = h('input', { type: 'text', id: 'video-new', placeholder: 'New video idea…', autocomplete: 'off', maxlength: 120 });
    root.appendChild(h('form', { class: 'card add-card', onsubmit: function (e) {
      e.preventDefault(); var t = input.value.trim(); if (!t) return;
      S.videoAdd(t); input.value = ''; FX.sound('tap');
      IST.App.renderKeep('video-new');
    } }, h('div', { class: 'quick-add' }, input, h('button', { class: 'btn btn-primary btn-icon', type: 'submit', 'aria-label': 'Add video' }, C.icon('plus', 20))),
      h('p', { class: 'muted small' }, 'Every video moves through ' + C.videoStages.length + ' stages: ' + C.videoStages.join(' → ') + '.')));
    var vs = Object.keys(S.state.videos).map(function (k) { return S.state.videos[k]; }).filter(function (v) { return !v.del; });
    vs.sort(function (a, b) { var pa = a.stage >= C.videoStages.length - 1, pb = b.stage >= C.videoStages.length - 1; return pa - pb || (b.u || 0) - (a.u || 0); });
    if (!vs.length) root.appendChild(h('section', { class: 'card' }, UI.empty('No videos yet. Add the next topic you want to explain.', 'play')));
    var grid = h('div', { class: 'video-grid' });
    vs.forEach(function (v) {
      var n = C.videoStages.length, pub = v.stage >= n - 1;
      var steps = h('div', { class: 'vsteps', 'aria-label': 'Stage ' + (v.stage + 1) + ' of ' + n });
      for (var i = 0; i < n; i++) steps.appendChild(h('i', { class: i < v.stage ? 'done' : i === v.stage ? 'now' : '' }));
      grid.appendChild(h('button', { class: 'card video-card' + (pub ? ' pub' : ''), type: 'button', onclick: function () { videoSheet(v.id); } },
        h('span', { class: 'kicker' }, pub ? 'Published' : 'Stage ' + (v.stage + 1) + ' of ' + n + ' · now: ' + C.videoStages[v.stage]),
        h('span', { class: 'video-title' }, v.t),
        steps,
        v.note ? h('span', { class: 'muted small clamp2' }, v.note) : null,
        !pub ? h('span', { class: 'video-next' }, 'Open · then ' + C.videoStages[Math.min(v.stage + 1, n - 1)], C.icon('chevR', 16)) : null));
    });
    root.appendChild(grid);
    var hrs = M.totals().youtube.amount;
    root.appendChild(h('p', { class: 'muted small center' }, U.fmtMin(hrs) + ' logged on the channel so far.'));
  }

  function videoSheet(id) {
    var v = S.state.videos[id]; if (!v) return;
    var sh, n = C.videoStages.length;
    var title = h('input', { type: 'text', id: 'vs-title', value: v.t, maxlength: 120 });
    var note = h('textarea', { id: 'vs-note', rows: 3, placeholder: 'Notes, links, script outline…' }, v.note || '');
    var list = h('ol', { class: 'stage-list' });
    C.videoStages.forEach(function (name, i) {
      list.appendChild(h('li', { class: i < v.stage ? 'done' : i === v.stage ? 'now' : '' },
        h('button', { type: 'button', onclick: function () { S.videoSet(id, { stage: i }); sh.close(); videoSheet(id); } },
          h('span', { class: 'st-dot' }, i < v.stage ? C.icon('check', 14) : String(i + 1)), name)));
    });
    var body = h('div', { class: 'stack' },
      UI.field('Title', title),
      list,
      h('div', { class: 'row gap wrap' },
        v.stage < n - 1 ? h('button', { class: 'btn btn-primary', type: 'button', onclick: function (e) {
          var prev = A.snapshot();
          S.videoSet(id, { stage: v.stage + 1, t: title.value.trim() || v.t, note: note.value });
          FX.sound(v.stage + 1 === n - 1 ? 'perfect' : 'check'); FX.confetti(FX.at(e.currentTarget).x, FX.at(e.currentTarget).y, { n: v.stage + 1 === n - 1 ? 120 : 30, big: v.stage + 1 === n - 1 });
          A.after(prev, e.currentTarget); sh.close();
        } }, C.icon('check', 18), 'Done: ' + C.videoStages[v.stage]) : null,
        v.stage < n - 1 ? h('button', { class: 'btn btn-soft', type: 'button', onclick: function () {
          S.taskAdd({ t: C.videoStages[v.stage] + ' — ' + (title.value.trim() || v.t), due: D.today(), tag: 'youtube' });
          FX.toast('Added to today\'s to-dos.', { icon: 'tasks', tone: 'good' });
        } }, C.icon('plus', 18), 'Add “' + C.videoStages[v.stage] + '” to today') : null),
      UI.field('Notes', note),
      h('div', { class: 'row gap between' },
        h('button', { class: 'btn btn-danger-ghost', type: 'button', onclick: function () {
          UI.confirm('Delete this video from the board?', 'Delete', true).then(function (ok) { if (ok) { S.videoSet(id, { del: 1 }); sh.close(); } });
        } }, C.icon('trash', 16), 'Delete'),
        h('button', { class: 'btn', type: 'button', onclick: function () { S.videoSet(id, { t: title.value.trim() || v.t, note: note.value }); sh.close(); FX.toast('Saved.', { icon: 'check' }); } }, 'Save')));
    sh = UI.sheet('Video', body, { noFocus: true });
  }
})();
