/* Istiqomat — sync between your devices.
   · On the Claude-hosted page: Claude's artifact database (automatic, while you are signed in).
   · In the installable app: a private GitHub Gist (one token, set once per device, or via a setup link).
   Both merge record by record using each record's update time, so offline edits never get lost. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, FX = IST.FX, UI = IST.UI;
  var SY = IST.Sync = { mode: 'local', state: 'idle', last: 0, msg: '' };
  var h = U.h;
  var GKEY = 'istiqomat.gist', GFILE = 'istiqomat.json', GDESC = 'Istiqomat sync';

  function setStatus(state, msg) {
    SY.state = state; SY.msg = msg || '';
    if (state === 'ok') SY.last = Date.now();
    var el = document.getElementById('sync-dot');
    if (el) { el.className = 'sync-dot ' + state; el.title = SY.label(); }
    var t = document.getElementById('sync-status'); if (t) t.textContent = SY.label();
  }
  SY.label = function () {
    if (SY.mode === 'local') return 'Only on this device';
    if (SY.state === 'syncing') return 'Syncing…';
    if (SY.state === 'error') return 'Sync problem: ' + SY.msg;
    if (SY.last) return 'Synced ' + D.hhmm(SY.last) + (SY.mode === 'claude' ? ' via Claude' : ' via GitHub');
    return SY.mode === 'claude' ? 'Connecting to Claude…' : 'Connecting to GitHub…';
  };

  SY.init = function () {
    if (U.inClaude()) {
      SY.mode = 'claude'; setStatus('syncing');
      window.claude.use('db').then(function (db) {
        if (!db) { SY.mode = 'local'; setStatus('idle'); return; }
        claudeStart(db);
      }, function () { SY.mode = 'local'; setStatus('idle'); });
      return;
    }
    var cfg = U.ls.getJSON(GKEY, null);
    if (cfg && cfg.token) { SY.mode = 'gist'; gistSync(); }
  };

  /* ================= Claude's database ================= */
  var cdb = null, unsub = null, pushing = false, pushTimer = null;
  function claudeStart(db) {
    cdb = db;
    db.collection('st').get().then(function (snap) {
      var seen = {}, changed = false;
      snap.docs.forEach(function (doc) {
        seen[doc.id] = 1;
        var r = S.mergeDoc(doc.id, doc.data());
        if (r.loc) changed = true;
        if (r.rem) S.dirty[doc.id] = 1;
      });
      S.docKeys().forEach(function (k) { if (!seen[k] && hasData(k)) S.dirty[k] = 1; });
      if (changed) { S.saveNow(); S.emit('remote'); }
      setStatus('ok');
      claudePush();
      claudeSubscribe();
    }, function (e) { setStatus('error', (e && e.code) || 'unavailable'); setTimeout(function () { claudeStart(db); }, 15000); });
  }
  function hasData(k) {
    var b = S.docBody(k);
    if (k === 'core') return S.state.meta.u > 0 || Object.keys(S.state.badges).length > 0;
    return JSON.stringify(b).length > 60;
  }
  function claudeSubscribe() {
    if (unsub) unsub();
    unsub = cdb.collection('st').onSnapshot(function (snap) {
      if (snap.metadata && snap.metadata.hasPendingWrites) return;
      var changed = false, behind = false;
      snap.docChanges().forEach(function (ch) {
        if (ch.type === 'removed') return;
        var r = S.mergeDoc(ch.doc.id, ch.doc.data());
        if (r.loc) changed = true;
        if (r.rem) { S.dirty[ch.doc.id] = 1; behind = true; }   /* another device overwrote something we still have: send it back */
      });
      if (changed) { S.saveNow(); S.emit('remote'); }
      if (behind) schedule();
      setStatus('ok');
    }, function (e) {
      setStatus('error', (e && e.code) || 'unavailable');
      if (e && e.code === 'unavailable') setTimeout(claudeSubscribe, 10000);
    });
  }
  function claudePush() {
    if (!cdb || pushing) return;
    var keys = Object.keys(S.dirty);
    if (!keys.length) return;
    pushing = true; S.dirty = {}; setStatus('syncing');
    var chain = Promise.resolve();
    keys.forEach(function (key) {
      chain = chain.then(function () {
        var ref = cdb.collection('st').doc(key);
        return ref.get().then(function (snap) {
          if (snap.exists) { var r = S.mergeDoc(key, snap.data()); if (r.loc) { S.saveNow(); S.emit('remote'); } }
          return ref.set(S.docBody(key));
        }).catch(function (e) { S.dirty[key] = 1; throw e; });
      });
    });
    chain.then(function () { pushing = false; setStatus('ok'); if (Object.keys(S.dirty).length) schedule(); },
      function (e) { pushing = false; setStatus('error', (e && e.code) || 'write failed'); setTimeout(schedule, 8000); });
  }
  function schedule() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { if (SY.mode === 'claude') claudePush(); else if (SY.mode === 'gist') gistSync(); }, SY.mode === 'claude' ? 1200 : 2500);
  }
  S.on(function (why) { if (why !== 'remote' && Object.keys(S.dirty).length && SY.mode !== 'local') schedule(); });

  /* ================= GitHub Gist ================= */
  var API = 'https://api.github.com';
  var gBusy = false, gAgain = false;
  function gh(path, opts, token) {
    opts = opts || {};
    opts.headers = Object.assign({ Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' }, opts.headers || {});
    opts.cache = 'no-store';
    return fetch(API + path, opts).then(function (r) {
      if (r.status === 401) throw new Error('the token was rejected — make a new one with the "gist" scope');
      if (r.status === 404) { var e = new Error('not found'); e.status = 404; throw e; }
      if (!r.ok) throw new Error('GitHub answered ' + r.status);
      return r.status === 204 ? null : r.json();
    });
  }
  function gistFind(cfg) {
    return gh('/gists?per_page=100', {}, cfg.token).then(function (list) {
      var g = (list || []).filter(function (x) { return x.description === GDESC && x.files && x.files[GFILE]; })[0];
      if (g) return g.id;
      return gh('/gists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: GDESC, public: false, files: { 'istiqomat.json': { content: S.exportText() } } }) }, cfg.token).then(function (ng) { return ng.id; });
    });
  }
  function gistRead(cfg) {
    return gh('/gists/' + cfg.id, {}, cfg.token).then(function (g) {
      var f = g.files && g.files[GFILE];
      if (!f) return null;
      if (f.truncated && f.raw_url) return fetch(f.raw_url, { cache: 'no-store' }).then(function (r) { return r.text(); });
      return f.content;
    });
  }
  function gistSync() {
    var cfg = U.ls.getJSON(GKEY, null);
    if (!cfg || !cfg.token) { SY.mode = 'local'; setStatus('idle'); return Promise.resolve(); }
    if (gBusy) { gAgain = true; return Promise.resolve(); }
    gBusy = true; setStatus('syncing');
    var idP = cfg.id ? Promise.resolve(cfg.id) : gistFind(cfg).then(function (id) { cfg.id = id; U.ls.setJSON(GKEY, cfg); return id; });
    return idP.then(function () { return gistRead(cfg); }).then(function (text) {
      var res = { loc: false, rem: true };
      if (text) { var o = U.json(text, null); if (o && o.state) res = S.mergeState(o.state); }
      if (res.loc) { S.saveNow(); S.emit('remote'); }
      var need = res.rem || Object.keys(S.dirty).length;
      S.dirty = {};
      if (!need) return null;
      return gh('/gists/' + cfg.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: { 'istiqomat.json': { content: S.exportText() } } }) }, cfg.token);
    }).then(function () { setStatus('ok'); }, function (e) {
      if (e && e.status === 404 && cfg.id) { delete cfg.id; U.ls.setJSON(GKEY, cfg); }
      setStatus('error', e.message || 'offline');
    }).then(function () { gBusy = false; if (gAgain) { gAgain = false; schedule(); } });
  }
  SY.connectGist = function (token) {
    U.ls.setJSON(GKEY, { token: token.trim() });
    SY.mode = 'gist';
    return gistSync();
  };
  SY.disconnect = function () { U.ls.del(GKEY); SY.mode = 'local'; setStatus('idle'); };
  SY.syncNow = function () { if (SY.mode === 'gist') return gistSync(); if (SY.mode === 'claude') { Object.keys(S.dirty).length ? claudePush() : setStatus('ok'); } return Promise.resolve(); };
  SY.setupLink = function () {
    var cfg = U.ls.getJSON(GKEY, null); if (!cfg) return '';
    var base = location.href.split('#')[0];
    return base + '#gist=' + btoa(JSON.stringify({ t: cfg.token, i: cfg.id || '' }));
  };
  SY.takeLink = function () {
    var m = /#gist=([A-Za-z0-9+/=]+)/.exec(location.hash || '');
    if (!m) return false;
    try {
      var o = JSON.parse(atob(m[1]));
      if (o.t) { U.ls.setJSON(GKEY, { token: o.t, id: o.i || undefined }); SY.mode = 'gist'; }
    } catch (e) { /* ignore bad link */ }
    try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) { location.hash = ''; }
    return true;
  };
  document.addEventListener('visibilitychange', function () { if (!document.hidden && SY.mode === 'gist') gistSync(); });
  setInterval(function () { if (!document.hidden && SY.mode === 'gist') gistSync(); }, 120000);

  /* ================= settings card ================= */
  SY.card = function () {
    var sec = h('section', { class: 'card', id: 'me-sync' }, UI.section('Sync', h('span', { id: 'sync-status', class: 'muted small' }, SY.label())));
    if (U.inClaude()) {
      sec.appendChild(h('p', { class: 'small' }, SY.mode === 'claude' ? 'This page saves to your private Claude storage. Open the same link on your phones and PC while signed in to Claude and everything stays in step. Claude can also read your progress when you ask it to.' : 'Claude storage is not available in this view, so data stays in this browser. Open the page from claude.ai while signed in.'));
      sec.appendChild(h('p', { class: 'muted small' }, 'Moving to the installable app later? Export a backup here and import it there — it merges.'));
      return sec;
    }
    var cfg = U.ls.getJSON(GKEY, null);
    if (!cfg) {
      var tok = h('input', { type: 'password', id: 'gist-token', placeholder: 'ghp_…', autocomplete: 'off', spellcheck: 'false' });
      sec.appendChild(h('ol', { class: 'steps small' },
        h('li', null, 'Make a free token that can only touch your gists: ', UI.extLink('https://github.com/settings/tokens/new?scopes=gist&description=Istiqomat%20sync', 'create token (scope: gist)'), '. Choose “No expiration” or a long one.'),
        h('li', null, 'Paste it here and connect. Istiqomat makes a private gist called “' + GDESC + '” for your data.'),
        h('li', null, 'On your other devices, use “Copy link for another device” below and open that link once.')));
      sec.appendChild(h('form', { class: 'quick-add', onsubmit: function (e) {
        e.preventDefault(); if (!tok.value.trim()) return;
        SY.connectGist(tok.value).then(function () { FX.toast(SY.state === 'error' ? 'Could not connect: ' + SY.msg : 'Sync is on.', { icon: 'cloud', tone: SY.state === 'error' ? 'warn' : 'good', ms: 4500 }); IST.App.render(); });
      } }, tok, h('button', { class: 'btn btn-primary', type: 'submit' }, 'Connect')));
      return sec;
    }
    sec.appendChild(h('p', { class: 'small' }, 'Syncing through your private GitHub Gist. Changes go up a few seconds after you make them and come down when you open the app.'));
    sec.appendChild(h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn btn-soft', type: 'button', onclick: function () { SY.syncNow().then(function () { FX.toast(SY.label(), { icon: 'sync' }); }); } }, C.icon('sync', 18), 'Sync now'),
      h('button', { class: 'btn btn-soft', type: 'button', onclick: function () {
        U.copy(SY.setupLink()).then(function () { FX.toast('Link copied. Send it to yourself (e.g. Telegram Saved Messages) and open it on the other device.', { icon: 'link', ms: 5000 }); }, function () { FX.toast('Copy failed.', { icon: 'info' }); });
      } }, C.icon('link', 18), 'Copy link for another device'),
      h('button', { class: 'btn btn-danger-ghost', type: 'button', onclick: function () {
        UI.confirm('Stop syncing this device?', 'Disconnect', true, 'Your data stays here and in the gist.').then(function (ok) { if (ok) { SY.disconnect(); IST.App.render(); } });
      } }, 'Disconnect')));
    sec.appendChild(h('p', { class: 'muted small' }, 'The link contains your token. Keep it private; you can revoke the token on GitHub anytime.'));
    return sec;
  };
})();
