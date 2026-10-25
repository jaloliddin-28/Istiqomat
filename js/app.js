/* Istiqomat — app shell: navigation, rendering, theme, install prompt, offline cache, day rollover. */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U, D = IST.D, C = IST.C, S = IST.S, M = IST.M, FX = IST.FX, UI = IST.UI, T = IST.T;
  var App = IST.App = { tab: 'today', sub: null, installPrompt: null };
  var h = U.h;
  var TABS = [
    { id: 'today', label: 'Today', icon: 'home' },
    { id: 'korean', label: 'Korean', icon: 'hangul' },
    { id: 'tasks', label: 'Tasks', icon: 'tasks' },
    { id: 'stats', label: 'Stats', icon: 'chart' },
    { id: 'me', label: 'Me', icon: 'user' }
  ];
  var view, pending = false, rafId = 0, lastDay = '';

  App.applyTheme = function () {
    var t = S.state.settings.theme || 'auto', root = document.documentElement;
    if (t === 'auto') { if (root.getAttribute('data-app-theme')) { root.removeAttribute('data-theme'); root.removeAttribute('data-app-theme'); } }
    else { root.setAttribute('data-theme', t); root.setAttribute('data-app-theme', t); }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#0A0E22');
  };

  App.go = function (tab, sub) {
    App.tab = tab; App.sub = sub || null;
    U.ls.set('istiqomat.tab', tab);
    UI.closeAll();
    App.render(true);
    window.scrollTo(0, 0);
  };

  App.render = function (now, force) {
    if (now === true) { cancelAnimationFrame(rafId); return draw(force === true); }
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () { draw(false); });
  };
  /* redraw now and put the cursor back into a field (after adding a to-do, a video…) */
  App.renderKeep = function (id) {
    App.render(true, true);
    var el = document.getElementById(id);
    if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  };
  function busy() {
    var a = document.activeElement;
    return a && view && view.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox' && a.type !== 'file';
  }
  function draw(force) {
    if (!view) return;
    if (!force && busy()) { pending = true; return; }
    pending = false;
    M.bump();
    lastDay = D.today();
    var fresh = h('div', { class: 'view view-' + App.tab });
    try {
      var fn = IST.V[App.tab] || IST.V.today;
      fn(fresh, App.sub);
    } catch (e) {
      console.error(e);
      fresh.appendChild(h('div', { class: 'card' }, h('p', null, 'Something went wrong drawing this page: ' + (e && e.message)), h('button', { class: 'btn', type: 'button', onclick: function () { App.go('today'); } }, 'Back to Today')));
    }
    App.sub = null;
    view.replaceWith(fresh); view = fresh; view.id = 'view';
    U.$$('.nav-btn').forEach(function (b) { var on = b.getAttribute('data-tab') === App.tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    paintTimerBar();
  }
  document.addEventListener('focusout', function () { setTimeout(function () { if (pending && !busy()) App.render(); }, 60); });

  function paintTimerBar() {
    var bar = document.getElementById('timer-bar'), t = T.active();
    if (!bar) return;
    if (!t) { bar.hidden = true; return; }
    var hab = M.habit(t.hid), sec = (t.acc || 0) + (t.run ? (Date.now() - t.run) / 1000 : 0);
    U.clear(bar); bar.hidden = false;
    bar.className = 'timer-bar h-' + t.hid;
    bar.appendChild(h('button', { type: 'button', class: 'tb-btn', onclick: function () { T.open(); } },
      UI.habitTile(t.hid, 28), h('span', { class: 'tb-text' }, hab.name + (t.run ? ' · focus' : ' · paused')), h('b', { class: 'tb-time' }, U.fmtClock(sec)), C.icon('chevR', 18)));
  }
  setInterval(function () { if (T.active()) paintTimerBar(); }, 1000);

  function shell() {
    var root = document.getElementById('app');
    U.clear(root);
    var side = h('nav', { class: 'side', 'aria-label': 'Main' },
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, h('@svg', { viewBox: '0 0 48 48', width: 34, height: 34, 'aria-hidden': 'true' }, h('@path', { d: C.starPath(24, 24, 22), class: 'brand-star' })), C.icon('feather', 18)),
        h('span', { class: 'brand-name' }, 'Istiqomat')),
      TABS.map(function (t) { return h('button', { class: 'nav-btn', type: 'button', 'data-tab': t.id, onclick: function () { App.go(t.id); } }, C.icon(t.icon, 22), h('span', null, t.label)); }),
      h('div', { class: 'side-foot' }, h('span', { id: 'sync-dot', class: 'sync-dot ' + IST.Sync.state, title: IST.Sync.label() }), h('span', { class: 'muted small' }, 'Small deeds, done daily')));
    var tabbar = h('nav', { class: 'tabbar', 'aria-label': 'Main' },
      TABS.map(function (t) { return h('button', { class: 'nav-btn', type: 'button', 'data-tab': t.id, onclick: function () { App.go(t.id); } }, C.icon(t.icon, 23), h('span', null, t.label)); }));
    view = h('div', { id: 'view' });
    var main = h('main', { class: 'main' }, view);
    root.appendChild(h('div', { class: 'shell' }, side, main));
    root.appendChild(h('div', { id: 'timer-bar', class: 'timer-bar', hidden: true }));
    root.appendChild(tabbar);
  }

  function boot() {
    S.init();
    App.applyTheme();
    try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', App.applyTheme); } catch (e) { /* old browsers */ }
    var saved = U.ls.get('istiqomat.tab', 'today');
    if (TABS.some(function (t) { return t.id === saved; })) App.tab = saved;
    var anchor = (location.hash || '').replace('#', '');
    if (TABS.some(function (t) { return t.id === anchor; })) App.tab = anchor;
    var linked = IST.Sync.takeLink();
    shell();
    S.on(function () { App.render(); if (IST.Onboarding.isOpen() && S.state.meta.onboarded) IST.Onboarding.close(); });
    App.render(true);
    IST.Sync.init();
    if (linked) FX.toast('Sync link accepted — fetching your data…', { icon: 'cloud', tone: 'good', ms: 4000 });
    setTimeout(function () { if (!S.state.meta.onboarded) IST.Onboarding.show(); }, U.inClaude() || IST.Sync.mode === 'gist' ? 3500 : 350);
    setTimeout(function () { M.checkBadges(); }, 1500);
    setInterval(function () { if (D.today() !== lastDay) { M.bump(); App.render(); } }, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && D.today() !== lastDay) App.render(); });

    /* installable app: offline cache + install prompt (not inside Claude's page) */
    if (!U.inClaude() && !U.framed() && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing; if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) FX.toast('A new version is ready.', { icon: 'sparkle', ms: 8000, action: { label: 'Reload', fn: function () { location.reload(); } } });
          });
        });
      }).catch(function () { /* offline cache unavailable */ });
    }
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); App.installPrompt = e; });
    window.addEventListener('appinstalled', function () { App.installPrompt = null; FX.toast('Installed. Find Istiqomat on your home screen.', { icon: 'download', tone: 'good' }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
