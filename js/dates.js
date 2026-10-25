/* Istiqomat — date helpers. Dates are 'YYYY-MM-DD' strings in the device's local time.
   Weekdays are Monday=0 … Sunday=6. "Today" respects the user's day-start hour (default 03:00),
   so a late-night session still counts for the day you were living. */
(function () {
  'use strict';
  var IST = window.IST = window.IST || {};
  var D = IST.D = {};

  D.dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  D.dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  D.dayInitial = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  D.monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  D.monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  D.dayStartHour = 3;

  D.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  D.fmt = function (d) { return d.getFullYear() + '-' + D.pad(d.getMonth() + 1) + '-' + D.pad(d.getDate()); };
  D.parse = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0); };
  D.of = function (ms) { return D.fmt(new Date(ms - D.dayStartHour * 3600000)); }; /* the "living day" of a timestamp */
  D.today = function () { return D.of(Date.now()); };
  D.add = function (s, n) { var d = D.parse(s); d.setDate(d.getDate() + n); return D.fmt(d); };
  D.diff = function (a, b) { return Math.round((D.parse(a) - D.parse(b)) / 86400000); };
  D.dow = function (s) { return (D.parse(s).getDay() + 6) % 7; };
  D.startOfWeek = function (s) { return D.add(s, -D.dow(s)); };
  D.startOfMonth = function (s) { return s.slice(0, 8) + '01'; };
  D.daysInMonth = function (y, m) { return new Date(y, m, 0).getDate(); };
  D.range = function (a, b) { var out = [], n = D.diff(b, a); for (var i = 0; i <= n; i++) out.push(D.add(a, i)); return out; };
  D.isWeekend = function (s) { var w = D.dow(s); return w === 5 || w === 6; };
  D.dayIndex = function (s) { return Math.round(D.parse(s).getTime() / 86400000); };
  D.month = function (s) { return +s.slice(5, 7); };
  D.year = function (s) { return +s.slice(0, 4); };
  D.dayNum = function (s) { return +s.slice(8, 10); };
  D.monthKey = function (s) { return s.slice(0, 7); };

  D.label = function (s, style) {
    var d = D.parse(s), i = D.dow(s);
    if (style === 'long') return D.dayNames[i] + ', ' + d.getDate() + ' ' + D.monthNames[d.getMonth()];
    if (style === 'weekday') return D.dayNames[i];
    if (style === 'month') return D.monthNames[d.getMonth()] + ' ' + d.getFullYear();
    if (style === 'md') return D.monthShort[d.getMonth()] + ' ' + d.getDate();
    if (style === 'full') return d.getDate() + ' ' + D.monthNames[d.getMonth()] + ' ' + d.getFullYear();
    return D.dayShort[i] + ', ' + D.monthShort[d.getMonth()] + ' ' + d.getDate();
  };
  D.short = function (s) { var l = D.label(s, 'md'); return D.year(s) === D.year(D.today()) ? l : l + ', ' + D.year(s); };
  D.rel = function (s) {
    var t = D.today(), n = D.diff(s, t);
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n === -1) return 'Yesterday';
    if (n > 1 && n < 7) return D.dayNames[D.dow(s)];
    return D.label(s);
  };
  D.hijri = function (s) {
    try {
      var f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' });
      var parts = f.formatToParts(D.parse(s)), o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      if (!o.day || !o.month) return '';
      return o.day + ' ' + o.month + ' ' + String(o.year || '').replace(/\s*AH$/, '') + ' AH';
    } catch (e) { return ''; }
  };
  D.hhmm = function (ms) { var d = new Date(ms); return D.pad(d.getHours()) + ':' + D.pad(d.getMinutes()); };
  D.hourOf = function (ms) { var d = new Date(ms); return d.getHours() + d.getMinutes() / 60; };
  D.fmtTime = function (hhmm) {
    if (!hhmm) return '';
    var p = hhmm.split(':'), h = +p[0], m = +p[1];
    var ap = h < 12 ? 'AM' : 'PM', hh = h % 12 || 12;
    return hh + ':' + D.pad(m) + ' ' + ap;
  };
  D.nowMinutes = function () { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  D.greeting = function () {
    var h = new Date().getHours();
    if (h < 5) return 'Still up';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  };
})();
