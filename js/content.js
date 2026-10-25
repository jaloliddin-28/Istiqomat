/* Istiqomat — static content: icons, habit defaults, levels, badges, tips, weekend bosses. */
(function () {
  'use strict';
  var IST = window.IST = window.IST || {};
  var C = IST.C = {};

  /* ---------- Icons (24×24, stroke = currentColor) ---------- */
  var I = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>',
    chevD: '<path d="M5 9l7 7 7-7"/>',
    flame: '<path d="M12 2.8c.9 3.4 5.3 5.6 5.3 10.4a5.3 5.3 0 0 1-10.6 0c0-2.4 1.1-4 2.5-5.2.2 1.7 1.1 2.8 2.2 3.1-.6-3-.2-5.9.6-8.3z"/>',
    shield: '<path d="M12 3l7 3v5.2c0 4.4-3 8.1-7 9.8-4-1.7-7-5.4-7-9.8V6z"/>',
    home: '<path d="M4 11l8-7 8 7v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
    tasks: '<path d="M10 6.5h10M10 12h10M10 17.5h10"/><path d="M3.8 6.5l1.4 1.4L7.6 5.4M3.8 12l1.4 1.4 2.4-2.5M3.8 17.5l1.4 1.4 2.4-2.5"/>',
    chart: '<path d="M3.5 20.5h17"/><path d="M6.5 17v-5M11 17V6.5M15.5 17v-3.5M20 17V9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.4-3.7 4.3-5.5 7.5-5.5s6.1 1.8 7.5 5.5"/>',
    book: '<path d="M5 4.6A1.6 1.6 0 0 1 6.6 3H19v14.5H6.6A1.6 1.6 0 0 0 5 19.1z"/><path d="M5 19.1A1.6 1.6 0 0 0 6.6 20.7H19v-3.2"/>',
    quran: '<path d="M12 7.2C9.8 5.6 6.8 5.2 3.5 5.7v12.6c3.3-.5 6.3-.1 8.5 1.5 2.2-1.6 5.2-2 8.5-1.5V5.7c-3.3-.5-6.3-.1-8.5 1.5z"/><path d="M12 7.2v12.6"/><path d="M16.6 2.6l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z" fill="currentColor" stroke="none"/>',
    hangul: '<text x="12" y="17.2" text-anchor="middle" font-size="14.5" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui, \'Malgun Gothic\', \'Noto Sans KR\', sans-serif">한</text>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.2v5.6M20.5 9.2v5.6M6.5 12h11"/>',
    play: '<rect x="2.5" y="5" width="19" height="14" rx="4.2"/><path d="M10 9.1v5.8l4.9-2.9z" fill="currentColor" stroke="none"/>',
    playSm: '<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M9 5.5v13M15 5.5v13"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 2M9.5 2.8h5"/>',
    gamepad: '<path d="M6.3 8h11.4a4 4 0 0 1 3.9 4.9l-.8 3.5a2.4 2.4 0 0 1-4.1 1.1L14.4 15H9.6l-2.3 2.5a2.4 2.4 0 0 1-4.1-1.1l-.8-3.5A4 4 0 0 1 6.3 8z"/><path d="M7.7 10.6v3M6.2 12.1h3"/><circle cx="15.8" cy="11.3" r=".9" fill="currentColor" stroke="none"/><circle cx="17.6" cy="13.3" r=".9" fill="currentColor" stroke="none"/>',
    trophy: '<path d="M8 3.5h8v5.3a4 4 0 0 1-8 0z"/><path d="M8 5.5H4.8a3.2 3.2 0 0 0 3.6 4M16 5.5h3.2a3.2 3.2 0 0 1-3.6 4M12 12.8v3.7M8.5 20.5h7M9.5 16.5h5v4h-5z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    bell: '<path d="M6 16.5v-5.2a6 6 0 0 1 12 0v5.2l1.6 2H4.4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    sync: '<path d="M19.5 8.5A8 8 0 0 0 5.3 6.2L4 7.5"/><path d="M4 3.5v4h4"/><path d="M4.5 15.5a8 8 0 0 0 14.2 2.3l1.3-1.3"/><path d="M20 20.5v-4h-4"/>',
    cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.6A3.4 3.4 0 0 0 7 18.5z"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    more: '<circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    sparkle: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5C10.5 5 7 5 7 7c0 1.5 2.5 1.5 5 1.5zM12 8.5c1.5-3.5 5-3.5 5-1.5 0 1.5-2.5 1.5-5 1.5z"/>',
    sword: '<path d="M14 4h6v6L9.5 20.5 3.5 14.5z"/><path d="M7 12l5 5M4 17.5L2.5 19l2.5 2.5L6.5 20"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    bookmark: '<path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z"/>',
    volume: '<path d="M4 9.5h3.8l5-4v13l-5-4H4z"/><path d="M16.3 9a4 4 0 0 1 0 6M18.8 6.5a7.6 7.6 0 0 1 0 11"/>',
    repeat: '<path d="M4.5 12a7 7 0 0 1 12-5l1.8 1.8"/><path d="M18.5 4v4.8h-4.8"/><path d="M19.5 12a7 7 0 0 1-12 5l-1.8-1.8"/><path d="M5.5 20v-4.8h4.8"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    ext: '<path d="M8 16L16 8M9.5 8H16v6.5"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.2a2 2 0 0 0-2-2H6.2a2 2 0 0 0-2 2v7.3a2 2 0 0 0 2 2h2.3"/>',
    bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    flag: '<path d="M5.5 21V4M5.5 4h11l-2 4 2 4h-11"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    note: '<path d="M5.5 3.5h9l4 4v13h-13z"/><path d="M14.5 3.5v4h4M8.5 12h7M8.5 16h7"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="M12 3.5l9 4.5-9 4.5-9-4.5z"/><path d="M3 12.5l9 4.5 9-4.5"/>',
    feather: '<path d="M20 4c-6 0-11 3.5-12.5 10L6 19"/><path d="M20 4c0 7-5 12-11.5 12"/><path d="M11 9.5h5M9 13h5"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    cards: '<rect x="6.5" y="3.5" width="12" height="15" rx="2.5"/><path d="M4.5 7.5v11a2 2 0 0 0 2 2h9"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    swap: '<path d="M7 7h12l-3.5-3.5M17 17H5l3.5 3.5"/>'
  };
  C.icons = I;
  C.icon = function (name, size, cls) {
    var s = size || 22;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', s); svg.setAttribute('height', s);
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.9'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'ico' + (cls ? ' ' + cls : ''));
    svg.innerHTML = I[name] || I.info;
    return svg;
  };

  /* 8-point star (Rub el Hizb) path, used for levels and badges — a nod to Samarkand tilework */
  C.starPath = function (cx, cy, R) {
    var r = R * 0.7654, pts = [];
    for (var i = 0; i < 16; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 8, rr = i % 2 ? r : R;
      pts.push((cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2));
    }
    return 'M' + pts.join('L') + 'Z';
  };

  /* ---------- Habits ---------- */
  C.habitOrder = ['quran', 'korean', 'workout', 'book', 'youtube'];
  C.habitDefaults = {
    quran: {
      name: "Qur'an", icon: 'quran', target: 10, unit: 'min', min: null,
      targetText: 'Read for 10 minutes', minText: '',
      stretch: '20 minutes, or 2 pages',
      anchorWd: 'Right after Fajr', anchorWe: 'Right after Fajr — before touching the phone',
      timeWd: '06:00', timeWe: '06:30', rest: false
    },
    korean: {
      name: 'Korean', icon: 'hangul', target: 30, unit: 'min', min: 10,
      targetText: "Today's Fun! Fun! Korean session (~30 min)", minText: '10 flashcards (5 min)',
      anchorWd: 'After lunch, at my desk', anchorWe: 'After breakfast, before any game',
      timeWd: '13:00', timeWe: '10:00', rest: false
    },
    workout: {
      name: 'Workout', icon: 'dumbbell', target: 20, unit: 'min', min: 5,
      targetText: "Today's Home Workout routine", minText: 'One round — 5 minutes',
      anchorWd: 'When I get home, before dinner', anchorWe: 'Late morning, before lunch',
      timeWd: '18:30', timeWe: '11:30', rest: true,
      plan: 'Full Body 7×4 Challenge', planDays: 28, day: 1
    },
    book: {
      name: 'Reading', icon: 'book', target: 10, unit: 'pages', min: 2,
      targetText: 'Read 10 pages of the book', minText: '2 pages',
      anchorWd: 'In bed, before sleep — phone on the charger', anchorWe: 'After Asr, with tea',
      timeWd: '22:30', timeWe: '16:00', rest: false,
      title: 'Baxtiyor Oila', total: 0, page: 0
    },
    youtube: {
      name: 'YouTube', icon: 'play', target: 60, unit: 'min', min: 15,
      targetText: 'One focused hour on the channel', minText: '15 minutes on the next step',
      anchorWd: 'After Isha, at my desk', anchorWe: 'Early afternoon, before gaming',
      timeWd: '20:30', timeWe: '14:00', rest: false
    }
  };
  C.workoutPlans = [
    { name: 'Full Body 7×4 Challenge', days: 28 },
    { name: 'Lower Body 7×4 Challenge', days: 28 },
    { name: 'Abs routine', days: 0 },
    { name: 'Chest routine', days: 0 },
    { name: 'Arm routine', days: 0 },
    { name: 'Leg routine', days: 0 },
    { name: 'Shoulder & Back routine', days: 0 },
    { name: 'Custom', days: 0 }
  ];
  C.homeWorkoutUrl = 'https://play.google.com/store/apps/details?id=homeworkout.homeworkouts.noequipment';
  C.quranUrl = 'https://quran.com';

  C.videoStages = ['Topic', 'Research', 'Script', 'Uzbek translation', 'Manim animation', 'Voice-over', 'Edit', 'Thumbnail & title', 'Published'];

  /* ---------- Levels: from egg to Humo, the bird of happiness on Uzbekistan's emblem ---------- */
  C.levels = [
    { en: 'Egg', uz: 'Tuxum' }, { en: 'Hatchling', uz: "Jo'ja" }, { en: 'Fledgling', uz: 'Polapon' },
    { en: 'First Flight', uz: 'Ilk parvoz' }, { en: 'Sparrow', uz: 'Chumchuq' }, { en: 'Swallow', uz: "Qaldirg'och" },
    { en: 'Falcon', uz: 'Lochin' }, { en: 'Eagle', uz: 'Burgut' }, { en: 'Golden Eagle', uz: 'Berkut' }, { en: 'Humo', uz: 'Humo qushi' }
  ];
  C.levelXP = function (L) { return 75 * L * (L - 1); };   /* total XP needed to reach level L */
  C.levelName = function (L) {
    if (L <= C.levels.length) return C.levels[L - 1];
    var roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    var k = L - C.levels.length + 1;
    return { en: 'Humo ' + (roman[k] || k), uz: 'Humo qushi' };
  };

  /* ---------- Weekend bosses — built from the three things that usually break your weekends ---------- */
  C.bosses = [
    { name: 'The Snooze Dragon', line: 'Feeds on sleeping in. Hit it early, while it is still yawning.' },
    { name: 'The Scroll Serpent', line: 'Grows longer every time you drift on your phone.' },
    { name: 'The Lag Wraith', line: 'Lives inside "just one more game". Earn your game time first.' },
    { name: 'The Couch Golem', line: 'Heavy, slow and very comfortable. Two minutes of action cracks it.' }
  ];
  C.bossHP = 8;

  /* ---------- Achievements ---------- */
  C.badges = [
    { id: 'first', name: 'First Step', desc: 'Complete your first quest.', icon: 'flag', xp: 20, tier: 1 },
    { id: 's3', name: 'Three in a Row', desc: 'Reach a 3-day streak.', icon: 'flame', xp: 30, tier: 1 },
    { id: 'wall', name: 'Day-4 Wall Breaker', desc: 'Reach a 5-day streak — past the point where you used to stop.', icon: 'sword', xp: 60, tier: 2 },
    { id: 's7', name: 'One Full Week', desc: 'Reach a 7-day streak.', icon: 'flame', xp: 70, tier: 2 },
    { id: 's14', name: 'Fortnight', desc: 'Reach a 14-day streak.', icon: 'flame', xp: 120, tier: 3 },
    { id: 's30', name: 'Thirty Days', desc: 'Reach a 30-day streak.', icon: 'flame', xp: 250, tier: 3 },
    { id: 's66', name: 'Habit Formed', desc: 'Reach a 66-day streak — the average time a habit becomes automatic.', icon: 'star', xp: 500, tier: 4 },
    { id: 'perfect', name: 'Perfect Day', desc: 'Complete all five quests in one day.', icon: 'sparkle', xp: 40, tier: 1 },
    { id: 'pweek', name: 'Perfect Week', desc: 'Seven perfect days in a row.', icon: 'trophy', xp: 300, tier: 4 },
    { id: 'wkwar', name: 'Weekend Warrior', desc: 'Keep all five quests on a Saturday and the Sunday after it.', icon: 'sword', xp: 120, tier: 3 },
    { id: 'boss', name: 'Boss Slayer', desc: 'Defeat a weekend boss.', icon: 'sword', xp: 100, tier: 2 },
    { id: 'boss4', name: 'Monster Hunter', desc: 'Defeat four weekend bosses.', icon: 'trophy', xp: 250, tier: 4 },
    { id: 'comeback', name: 'Comeback', desc: 'Miss a day, then complete every quest the next day.', icon: 'repeat', xp: 50, tier: 2 },
    { id: 'early', name: 'Early Bird', desc: 'Finish all quests before 9 AM.', icon: 'sun', xp: 60, tier: 2 },
    { id: 'quran30', name: 'Thirty Days with the Qur\'an', desc: "Read the Qur'an on 30 days.", icon: 'quran', xp: 150, tier: 3 },
    { id: 'kunit', name: 'Unit Cleared', desc: 'Finish every session of a Korean unit.', icon: 'hangul', xp: 80, tier: 2 },
    { id: 'kwords', name: '100 Words', desc: 'Learn 100 Korean words (flashcard box 3 or higher).', icon: 'cards', xp: 120, tier: 3 },
    { id: 'kbook', name: 'Book 1 Complete', desc: 'Finish Fun! Fun! Korean 1.', icon: 'trophy', xp: 500, tier: 4 },
    { id: 'pages100', name: '100 Pages', desc: 'Read 100 pages of your book.', icon: 'book', xp: 80, tier: 2 },
    { id: 'bookdone', name: 'The End', desc: 'Finish your book.', icon: 'book', xp: 200, tier: 3 },
    { id: 'work10', name: 'Ten Workouts', desc: 'Complete 10 workouts.', icon: 'dumbbell', xp: 80, tier: 2 },
    { id: 'creator10', name: 'Ten Studio Hours', desc: 'Log 10 hours on your channel.', icon: 'play', xp: 120, tier: 3 },
    { id: 'publish', name: 'Published!', desc: 'Move a video to "Published".', icon: 'play', xp: 150, tier: 3 },
    { id: 'tasks50', name: 'Task Master', desc: 'Complete 50 to-dos.', icon: 'tasks', xp: 100, tier: 2 },
    { id: 'strong', name: 'Strong Habit', desc: 'Get any habit to 80% strength.', icon: 'bolt', xp: 150, tier: 3 },
    { id: 'lv5', name: 'Level 5', desc: 'Reach level 5 (Sparrow).', icon: 'feather', xp: 0, tier: 2 },
    { id: 'lv10', name: 'Humo', desc: 'Reach level 10.', icon: 'feather', xp: 0, tier: 4 }
  ];

  /* ---------- Tips (one per day, rotating) ---------- */
  C.tips = [
    { t: 'Never miss twice', b: 'Missing one day is an accident. Missing two is the start of a new habit. If yesterday slipped, today only needs the minimum version.', s: 'James Clear, Atomic Habits' },
    { t: 'Shrink it on bad days', b: 'Every quest has a minimum version. It keeps the streak and, more importantly, keeps you the kind of person who shows up.', s: 'BJ Fogg, Tiny Habits' },
    { t: 'Decide when and where', b: '"I will do X at TIME in PLACE" roughly doubles follow-through compared with good intentions alone. Your quest cards show your plan.', s: 'Gollwitzer & Sheeran, 2006 (meta-analysis of 94 studies)' },
    { t: 'Stack it on a prayer', b: 'Prayer times are fixed even on weekends, so they make the strongest anchors: "After Fajr, I read Qur\'an for 10 minutes."', s: 'Habit stacking' },
    { t: '66 days, on average', b: 'In a study of everyday habits, automaticity took 18 to 254 days, 66 on average. Missing a single day did not change the outcome.', s: 'Lally et al., 2010' },
    { t: 'Earn your game time', b: 'Use the thing you want to do as the reward for the thing you should do. Your Game Pass unlocks after three quests.', s: 'Premack principle' },
    { t: 'Bundle it', b: 'Pair a "want" with a "should": play Korean audio only while working out, or your favourite tea only while reading.', s: 'Milkman et al., 2014' },
    { t: 'Same wake time on weekends', b: 'Sleeping in shifts your body clock ("social jet lag") and wipes out your morning anchors. Keep Saturday and Sunday within an hour of a weekday.', s: 'Wittmann et al., 2006' },
    { t: 'Move the phone, not your willpower', b: 'Charge the phone outside the bedroom and keep the book on your pillow. Make the good habit the easy one.', s: 'Environment design' },
    { t: 'Small and steady wins', b: '"The most beloved deed to Allah is the one done regularly, even if it is small."', s: 'Sahih al-Bukhari 6464' },
    { t: 'Strength, not perfection', b: 'Habit strength rises with every check-in and falls slowly after a miss. A bad day costs you a few percent, not everything.', s: 'How the strength score works' },
    { t: 'Two focus blocks', b: 'Split the YouTube hour into 2 × 25 minutes with a 5-minute break. Start the timer before you open anything else.', s: 'Pomodoro technique' },
    { t: 'Spaced practice beats cramming', b: 'Reviewing words just before you would forget them is the fastest way to keep them. Do the flashcards that are due, every day.', s: 'Cepeda et al., 2006' },
    { t: 'Ten pages a day', b: 'Ten pages a day is about 3,650 pages a year — a dozen books.', s: '' },
    { t: 'Two pages a day', b: 'At two pages a day you complete the whole mushaf (604 pages) in about ten months.', s: '' },
    { t: 'Say it out loud', b: 'Read every Korean dialogue aloud three times. Producing the language makes it stick far better than reading silently.', s: 'Production effect' },
    { t: 'Plan the weekend on Friday', b: 'Weekends break habits because nothing is scheduled. On Friday evening, give each quest a time on Saturday and Sunday.', s: '' },
    { t: 'Identity first', b: 'Each check-in is a vote for the person you want to become: someone who keeps their word to themselves.', s: 'James Clear' },
    { t: 'Start before you feel ready', b: 'Motivation usually comes after starting, not before. Open the book, start the timer, and give it two minutes.', s: '' },
    { t: 'Celebrate immediately', b: 'A small celebration right after the action wires it in. That is what the confetti is for — let it land.', s: 'BJ Fogg' }
  ];

  C.dayParts = [
    { name: 'Night', from: 0, to: 5 }, { name: 'Morning', from: 5, to: 12 },
    { name: 'Afternoon', from: 12, to: 17 }, { name: 'Evening', from: 17, to: 21 }, { name: 'Late', from: 21, to: 24 }
  ];

  C.taskTags = [
    { id: 'korean', name: 'Korean' }, { id: 'youtube', name: 'YouTube' }, { id: 'study', name: 'Study' },
    { id: 'research', name: 'Research' }, { id: 'personal', name: 'Personal' }, { id: 'deen', name: 'Deen' }
  ];
})();
