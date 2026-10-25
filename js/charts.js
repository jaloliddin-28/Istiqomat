/* Istiqomat — small SVG charts: progress ring, heatmap, columns, line, sparkline, with hover/tap tooltips.
   Marks: columns ≤ 24px with 4px rounded data-ends, 2px lines, ≥8px end-dots with a surface ring,
   hairline recessive grid, text in text tokens (never the series colour). */
(function () {
  'use strict';
  var IST = window.IST, U = IST.U;
  var CH = IST.CH = {};
  var h = U.h;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- shared tooltip ---------- */
  var tip = null;
  function tipEl() {
    if (!tip) { tip = h('div', { class: 'chart-tip', role: 'tooltip' }); document.body.appendChild(tip); }
    return tip;
  }
  CH.showTip = function (evOrEl, html) {
    var t = tipEl(); t.innerHTML = html; t.classList.add('on');
    var r = evOrEl.getBoundingClientRect ? evOrEl.getBoundingClientRect() : null;
    var x = r ? r.left + r.width / 2 : evOrEl.clientX, y = r ? r.top : evOrEl.clientY;
    var tw = t.offsetWidth, th = t.offsetHeight;
    var left = U.clamp(x - tw / 2, 8, window.innerWidth - tw - 8), top = y - th - 10;
    if (top < 8) top = (r ? r.bottom : y) + 10;
    t.style.left = left + 'px'; t.style.top = top + 'px';
  };
  CH.hideTip = function () { if (tip) tip.classList.remove('on'); };
  document.addEventListener('scroll', CH.hideTip, true);
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest || !e.target.closest('[data-tip]')) CH.hideTip(); });
  function bindTip(el, html) {
    el.setAttribute('data-tip', '1');
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') CH.showTip(el, html); });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') CH.hideTip(); });
    el.addEventListener('click', function (e) { e.stopPropagation(); CH.showTip(el, html); });
    el.setAttribute('tabindex', '0');
    el.addEventListener('focus', function () { CH.showTip(el, html); });
    el.addEventListener('blur', CH.hideTip);
  }
  CH.bindTip = bindTip;

  function svg(w, hgt, cls) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    s.setAttribute('class', 'chart ' + (cls || ''));
    return s;
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- progress ring ---------- */
  CH.ring = function (pct, size, stroke, cls, inner) {
    size = size || 64; stroke = stroke || 7;
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, p = U.clamp(pct || 0, 0, 1);
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 ' + size + ' ' + size); s.setAttribute('width', size); s.setAttribute('height', size);
    s.setAttribute('class', 'ring ' + (cls || ''));
    el('circle', { cx: size / 2, cy: size / 2, r: r, class: 'ring-track', 'stroke-width': stroke, fill: 'none' }, s);
    el('circle', { cx: size / 2, cy: size / 2, r: r, class: 'ring-fill', 'stroke-width': stroke, fill: 'none',
      'stroke-dasharray': c.toFixed(2), 'stroke-dashoffset': (c * (1 - p)).toFixed(2), 'stroke-linecap': 'round',
      transform: 'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')' }, s);
    if (inner) { var wrap = h('div', { class: 'ring-wrap', style: { width: size + 'px', height: size + 'px' } }, s, h('div', { class: 'ring-in' }, inner)); return wrap; }
    return s;
  };

  /* ---------- calendar heatmap (weeks as columns, Mon→Sun rows) ---------- */
  CH.heatmap = function (cells, opts) {
    opts = opts || {};
    var max = opts.max || 5, cs = window.innerWidth >= 960 ? 16 : 13, gap = 3;
    if (!cells.length) return h('div', { class: 'empty-chart' }, 'No days yet');
    var first = cells[0].d, offset = IST.D.dow(first);
    var cols = Math.ceil((cells.length + offset) / 7);
    var W = cols * (cs + gap) + 22, H = 7 * (cs + gap) + 16;
    var wrap = h('div', { class: 'heat-wrap' });
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H); s.setAttribute('width', W); s.setAttribute('height', H);
    s.setAttribute('class', 'heat'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', opts.label || 'Calendar heatmap');
    ['M', '', 'W', '', 'F', '', 'S'].forEach(function (t, i) {
      if (!t) return;
      var tx = el('text', { x: 0, y: 14 + i * (cs + gap) + cs - 3, class: 'axis-text' }, s); tx.textContent = t;
    });
    var lastMonth = '';
    cells.forEach(function (c, i) {
      var k = i + offset, col = Math.floor(k / 7), row = k % 7;
      var x = 22 + col * (cs + gap), y = 14 + row * (cs + gap);
      var m = c.d.slice(5, 7);
      if (row === 0 || i === 0) {
        if (m !== lastMonth) { var tx = el('text', { x: x, y: 9, class: 'axis-text' }, s); tx.textContent = IST.D.monthShort[+m - 1]; lastMonth = m; }
      }
      var lvl = c.v == null ? -1 : Math.round(U.clamp(c.v / max, 0, 1) * 4);
      var rect = el('rect', { x: x, y: y, width: cs, height: cs, rx: 3, class: 'heat-cell heat-' + (c.v == null ? 'none' : lvl) + (c.today ? ' heat-today' : '') }, s);
      bindTip(rect, '<b>' + IST.D.label(c.d) + '</b><br>' + (c.tip || (c.v == null ? 'No data' : c.v + ' of ' + max)));
    });
    wrap.appendChild(s);
    if (opts.legend !== false) {
      var lg = h('div', { class: 'heat-legend' }, h('span', null, 'Less'));
      [0, 1, 2, 3, 4].forEach(function (l) { lg.appendChild(h('i', { class: 'heat-cell heat-' + l })); });
      lg.appendChild(h('span', null, 'More'));
      wrap.appendChild(lg);
    }
    setTimeout(function () { wrap.scrollLeft = wrap.scrollWidth; }, 0);
    return wrap;
  };

  /* ---------- columns ---------- */
  CH.columns = function (items, opts) {
    opts = opts || {};
    var n = items.length, W = opts.width || 320, H = opts.height || 150, pb = 22, pt = 18, pl = opts.axis ? 28 : 4, pr = 4;
    var max = opts.max != null ? opts.max : Math.max.apply(null, items.map(function (i) { return i.v || 0; }).concat([1]));
    var s = svg(W, H, 'cols'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', opts.label || 'Column chart');
    var plotH = H - pb - pt, band = (W - pl - pr) / n, bw = Math.min(20, band * 0.5);
    var ticks = opts.ticks || [0, max / 2, max];
    ticks.forEach(function (t) {
      var y = pt + plotH - (t / max) * plotH;
      el('line', { x1: pl, x2: W - pr, y1: y, y2: y, class: 'grid' }, s);
      if (opts.axis) { var tx = el('text', { x: pl - 5, y: y + 3, class: 'axis-text', 'text-anchor': 'end' }, s); tx.textContent = opts.fmtTick ? opts.fmtTick(t) : Math.round(t); }
    });
    items.forEach(function (it, i) {
      var cx = pl + band * i + band / 2;
      if (it.band) el('rect', { x: pl + band * i, y: pt - 6, width: band, height: plotH + 6, class: 'col-band' }, s);
      var v = it.v || 0, bh = max ? (v / max) * plotH : 0, x = cx - bw / 2, y = pt + plotH - bh;
      if (bh > 0.5) {
        var r = Math.min(4, bh, bw / 2);
        var d = 'M' + x + ' ' + (pt + plotH) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (pt + plotH) + 'Z';
        el('path', { d: d, class: 'col ' + (it.cls || ''), style: it.color ? 'fill:' + it.color : '' }, s);
      } else if (it.v != null) {
        el('rect', { x: x, y: pt + plotH - 1.5, width: bw, height: 1.5, rx: 0.75, class: 'col col-zero' }, s);
      }
      var hit = el('rect', { x: pl + band * i, y: pt - 6, width: band, height: plotH + 6, class: 'hit' }, s);
      bindTip(hit, '<b>' + U.esc(it.tipTitle || it.label) + '</b><br>' + U.esc(it.tip || (it.display != null ? it.display : v)));
      var lb = el('text', { x: cx, y: H - 6, class: 'axis-text' + (it.strong ? ' strong' : ''), 'text-anchor': 'middle' }, s);
      lb.textContent = it.label;
      if (it.showValue && it.v != null) { var vt = el('text', { x: cx, y: y - 5, class: 'val-text', 'text-anchor': 'middle' }, s); vt.textContent = it.display != null ? it.display : v; }
    });
    return s;
  };

  /* ---------- line with soft area, crosshair tooltip ---------- */
  CH.line = function (pts, opts) {
    opts = opts || {};
    var W = opts.width || 320, H = opts.height || 140, pb = 20, pt = 14, pl = opts.axis ? 30 : 6, pr = 10;
    var vals = pts.map(function (p) { return p.v; }).filter(function (v) { return v != null; });
    var max = opts.max != null ? opts.max : Math.max.apply(null, vals.concat([1])), min = opts.min != null ? opts.min : 0;
    var s = svg(W, H, 'line'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', opts.label || 'Line chart');
    var plotH = H - pb - pt, n = pts.length, step = n > 1 ? (W - pl - pr) / (n - 1) : 0;
    function X(i) { return pl + i * step; }
    function Y(v) { return pt + plotH - ((v - min) / (max - min || 1)) * plotH; }
    (opts.ticks || [min, (min + max) / 2, max]).forEach(function (t) {
      var y = Y(t); el('line', { x1: pl, x2: W - pr, y1: y, y2: y, class: 'grid' }, s);
      if (opts.axis) { var tx = el('text', { x: pl - 5, y: y + 3, class: 'axis-text', 'text-anchor': 'end' }, s); tx.textContent = opts.fmtTick ? opts.fmtTick(t) : Math.round(t); }
    });
    var path = '', area = '', started = false, lastI = -1;
    pts.forEach(function (p, i) {
      if (p.v == null) return;
      path += (started ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1);
      if (!started) area = 'M' + X(i).toFixed(1) + ' ' + Y(min).toFixed(1);
      area += 'L' + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1);
      started = true; lastI = i;
    });
    if (started) {
      area += 'L' + X(lastI).toFixed(1) + ' ' + Y(min).toFixed(1) + 'Z';
      el('path', { d: area, class: 'line-area' }, s);
      el('path', { d: path, class: 'line-path' }, s);
      el('circle', { cx: X(lastI), cy: Y(pts[lastI].v), r: 4.5, class: 'line-dot' }, s);
    }
    var labelEvery = Math.max(1, Math.ceil(n / (opts.maxLabels || 6)));
    pts.forEach(function (p, i) {
      var lastTick = Math.floor((n - 1) / labelEvery) * labelEvery;
      if ((i % labelEvery === 0 && !(i === lastTick && n - 1 - i < labelEvery * 0.8 && i !== n - 1)) || i === n - 1) {
        var tx = el('text', { x: X(i), y: H - 5, class: 'axis-text', 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, s);
        tx.textContent = p.label;
      }
    });
    var cross = el('line', { x1: 0, x2: 0, y1: pt, y2: pt + plotH, class: 'crosshair' }, s);
    var hit = el('rect', { x: pl, y: 0, width: W - pl - pr, height: H, class: 'hit' }, s);
    function move(e) {
      var r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
      var i = U.clamp(Math.round((x - pl) / (step || 1)), 0, n - 1), p = pts[i];
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.classList.add('on');
      CH.showTip({ clientX: r.left + X(i) / W * r.width, clientY: r.top + (p.v != null ? Y(p.v) : pt) / H * r.height }, '<b>' + U.esc(p.tipTitle || p.label) + '</b><br>' + U.esc(p.tip || (p.v == null ? 'No data' : p.v)));
    }
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', function () { cross.classList.remove('on'); CH.hideTip(); });
    hit.setAttribute('data-tip', '1');
    return s;
  };

  /* ---------- sparkline ---------- */
  CH.spark = function (vals, opts) {
    opts = opts || {};
    var W = opts.width || 120, H = opts.height || 32, n = vals.length;
    var max = opts.max != null ? opts.max : Math.max.apply(null, vals.concat([0.0001])), min = opts.min || 0;
    var s = svg(W, H, 'spark'); s.setAttribute('aria-hidden', 'true');
    if (n < 2) return s;
    var d = '', a = '';
    vals.forEach(function (v, i) {
      var x = 2 + i * (W - 6) / (n - 1), y = H - 3 - ((v - min) / (max - min || 1)) * (H - 8);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      a += (i ? 'L' : 'M' + x.toFixed(1) + ' ' + (H - 2) + 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
      if (i === n - 1) { a += 'L' + x.toFixed(1) + ' ' + (H - 2) + 'Z'; }
    });
    el('path', { d: a, class: 'line-area', style: opts.color ? 'fill:' + opts.color : '' }, s);
    el('path', { d: d, class: 'line-path', style: opts.color ? 'stroke:' + opts.color : '' }, s);
    return s;
  };
})();
