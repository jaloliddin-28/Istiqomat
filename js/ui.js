/* Istiqomat — shared UI pieces: sheets, confirm dialogs, segmented controls, toggles, habit tiles. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, C = IST.C;
  var UI = IST.UI = {};
  var h = U.h;

  UI.icon = C.icon;

  /* ---------- bottom sheet / dialog ---------- */
  var openSheets = [];
  UI.sheet = function (title, body, opts) {
    opts = opts || {};
    var close;
    var panel = h('div', { class: 'sheet-panel' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Dialog' },
      h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }),
      title ? h('div', { class: 'sheet-head' },
        h('h2', { class: 'sheet-title' }, title),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: function () { close(); } }, C.icon('x', 20))) : null,
      h('div', { class: 'sheet-body' }, body));
    var wrap = h('div', { class: 'sheet' }, h('div', { class: 'sheet-scrim', onclick: function () { if (!opts.modal) close(); } }), panel);
    document.body.appendChild(wrap);
    document.body.classList.add('sheet-open');
    requestAnimationFrame(function () { wrap.classList.add('in'); });
    var prevFocus = document.activeElement;
    setTimeout(function () { var f = panel.querySelector('[autofocus]') || panel.querySelector('input,textarea,select'); if (f && !opts.noFocus) { try { f.focus(); } catch (e) { /* ignore */ } } }, 260);
    function onKey(e) { if (e.key === 'Escape' && openSheets[openSheets.length - 1] === api) close(); }
    document.addEventListener('keydown', onKey);
    close = function (result) {
      if (!wrap.parentNode) return;
      wrap.classList.remove('in');
      document.removeEventListener('keydown', onKey);
      openSheets = openSheets.filter(function (s) { return s !== api; });
      if (!openSheets.length) document.body.classList.remove('sheet-open');
      setTimeout(function () { wrap.remove(); }, 260);
      try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) { /* ignore */ }
      if (opts.onClose) opts.onClose(result);
    };
    var api = { close: close, el: panel, body: panel.querySelector('.sheet-body') };
    openSheets.push(api);
    return api;
  };
  UI.closeAll = function () { openSheets.slice().forEach(function (s) { s.close(); }); };

  UI.confirm = function (text, okLabel, danger, detail) {
    return new Promise(function (resolve) {
      var done = false, sh;
      var body = h('div', { class: 'confirm' },
        h('p', { class: 'confirm-text' }, text),
        detail ? h('p', { class: 'muted small' }, detail) : null,
        h('div', { class: 'row gap end' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { done = true; sh.close(); resolve(false); } }, 'Cancel'),
          h('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), type: 'button', autofocus: true, onclick: function () { done = true; sh.close(); resolve(true); } }, okLabel || 'OK')));
      sh = UI.sheet(null, body, { onClose: function () { if (!done) resolve(false); } });
    });
  };

  /* ---------- controls ---------- */
  UI.seg = function (items, value, onChange, cls) {
    var wrap = h('div', { class: 'seg ' + (cls || ''), role: 'tablist' });
    items.forEach(function (it) {
      wrap.appendChild(h('button', { type: 'button', role: 'tab', class: 'seg-btn' + (it.id === value ? ' on' : ''), 'aria-selected': it.id === value ? 'true' : 'false',
        onclick: function () { onChange(it.id); } }, it.icon ? C.icon(it.icon, 16) : null, it.label));
    });
    return wrap;
  };
  UI.toggle = function (id, label, checked, onChange, hint) {
    var input = h('input', { type: 'checkbox', id: id, checked: !!checked, class: 'tgl-input', onchange: function () { onChange(input.checked); } });
    return h('label', { class: 'tgl-row', for: id },
      h('span', { class: 'tgl-text' }, h('span', { class: 'tgl-label' }, label), hint ? h('span', { class: 'tgl-hint' }, hint) : null),
      input, h('span', { class: 'tgl', 'aria-hidden': 'true' }));
  };
  UI.field = function (label, input, hint) {
    return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), input, hint ? h('span', { class: 'field-hint' }, hint) : null);
  };
  UI.habitTile = function (hid, size, done) {
    var hab = IST.S.state.habits[hid] || C.habitDefaults[hid];
    return h('span', { class: 'htile h-' + hid + (done ? ' done' : ''), style: { width: (size || 44) + 'px', height: (size || 44) + 'px' } }, C.icon(hab.icon || 'star', Math.round((size || 44) * 0.52)));
  };
  UI.section = function (title, right, sub) {
    return h('div', { class: 'sec-head' }, h('div', null, h('h2', { class: 'sec-title' }, title), sub ? h('p', { class: 'sec-sub' }, sub) : null), right || null);
  };
  UI.empty = function (text, icon) { return h('div', { class: 'empty' }, icon ? C.icon(icon, 26) : null, h('p', null, text)); };
  UI.chip = function (text, cls) { return h('span', { class: 'chip ' + (cls || '') }, text); };
  UI.levelStar = function (level, size) {
    size = size || 46;
    return h('span', { class: 'lvl-star', style: { width: size + 'px', height: size + 'px' } },
      h('@svg', { viewBox: '0 0 48 48', width: size, height: size, 'aria-hidden': 'true' }, h('@path', { d: C.starPath(24, 24, 22), class: 'lvl-star-shape' })),
      h('span', { class: 'lvl-star-n' }, String(level)));
  };
  UI.extLink = function (href, label, cls) {
    return h('a', { href: href, target: '_blank', rel: 'noopener noreferrer', class: cls || 'link' }, label, C.icon('ext', 14));
  };
  /* Save a generated file: the Claude page uses its downloads capability; a normal browser uses a link. */
  UI.saveFile = function (filename, text, mime) {
    var data = text;
    if (U.inClaude()) {
      return window.claude.use('downloads').then(function (dl) {
        if (!dl) { IST.FX.toast('Downloads are not available on this page — use Copy instead.', { tone: 'warn' }); return false; }
        return dl.save({ filename: filename, data: data }).then(function () { return true; }, function () { return false; });
      });
    }
    try {
      var blob = new Blob([data], { type: mime || 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = h('a', { href: url, download: filename });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      return Promise.resolve(true);
    } catch (e) { return Promise.resolve(false); }
  };
})();
