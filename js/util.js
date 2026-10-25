/* Istiqomat — small helpers (DOM builder, formatting, random, files). No dependencies. */
(function () {
  'use strict';
  var IST = window.IST = window.IST || {};
  var U = IST.U = {};

  /* h('div', {class:'x', onclick: fn}, child, [children], 'text') ; tags starting with '@' are SVG */
  U.h = function h(tag, props) {
    var svg = tag.charAt(0) === '@';
    var el = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag.slice(1)) : document.createElement(tag);
    if (props) {
      for (var k in props) {
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.setAttribute('class', v);
        else if (k === 'style') {
          if (typeof v === 'string') el.style.cssText = v;
          else for (var s in v) el.style.setProperty(s.charAt(0) === '-' ? s : s.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }), v[s]);
        }
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (!svg && (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected')) el[k] = v;
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (var i = 2; i < arguments.length; i++) U.append(el, arguments[i]);
    return el;
  };
  U.append = function (el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { for (var i = 0; i < c.length; i++) U.append(el, c[i]); }
    else if (c.nodeType) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  };
  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  U.clear = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  U.clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };
  U.sum = function (arr, f) { var s = 0; for (var i = 0; i < arr.length; i++) s += f ? f(arr[i]) : arr[i]; return s; };
  U.avg = function (arr) { return arr.length ? U.sum(arr) / arr.length : 0; };
  U.pct = function (a, b) { return b > 0 ? Math.round(100 * a / b) : 0; };
  U.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };

  U.fmtMin = function (m) {
    m = Math.round(m || 0);
    if (m < 60) return m + 'm';
    var hh = Math.floor(m / 60), mm = m % 60;
    return mm ? hh + 'h ' + (mm < 10 ? '0' : '') + mm + 'm' : hh + 'h';
  };
  U.fmtHours = function (m) { return (m / 60).toFixed(m >= 6000 ? 0 : 1) + ' h'; };
  U.fmtClock = function (sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (h ? h + ':' + p(m) : m) + ':' + p(s);
  };
  U.fmtNum = function (n) { return Math.round(n).toLocaleString('en-US'); };

  U.uid = function (prefix) {
    return (prefix || '') + Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 6);
  };

  U.hash32 = function (str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  };
  U.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.shuffle = function (arr, rnd) {
    rnd = rnd || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  U.pick = function (arr, rnd) { return arr[Math.floor((rnd || Math.random)() * arr.length)]; };

  U.debounce = function (fn, ms) {
    var t;
    return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  };

  U.copy = function (text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () { return U.copyFallback(text); });
      }
    } catch (e) { /* fall through */ }
    return U.copyFallback(text);
  };
  U.copyFallback = function (text) {
    var ta = U.h('textarea', { value: text, style: 'position:fixed;top:0;left:0;opacity:0' });
    document.body.appendChild(ta); ta.focus(); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  };
  U.vibrate = function (p) {
    try {
      var st = IST.S && IST.S.state;
      if (st && st.settings && st.settings.haptics === false) return;
      if (navigator.vibrate) navigator.vibrate(p);
    } catch (e) { /* ignore */ }
  };
  U.isAndroid = function () { return /Android/i.test(navigator.userAgent); };
  U.isStandalone = function () { try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
  U.reducedMotion = function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  U.json = function (s, d) { try { return JSON.parse(s); } catch (e) { return d; } };
  U.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* localStorage that never throws (private windows, blocked storage, previews) */
  U.ls = {
    get: function (k, d) { try { var v = window.localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } },
    getJSON: function (k, d) { var raw = U.ls.get(k, null); if (raw == null) return d; var v = U.json(raw, d); return v == null ? d : v; },
    setJSON: function (k, v) { return U.ls.set(k, JSON.stringify(v)); }
  };

  U.inClaude = function () { return !!(window.claude && typeof window.claude.use === 'function'); };
  U.framed = function () { try { return window.top !== window.self; } catch (e) { return true; } };
})();
