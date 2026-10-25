# Istiqomat — daily quests

Habit tracker + to-do list for five daily quests: **Qur'an (10 min)**, **Korean** (Fun! Fun! Korean 1),
**Home Workout**, **reading** (Baxtiyor Oila) and **one hour on your YouTube channel**.

Streaks with shields, XP and levels (Egg → Humo), weekend bosses with double XP, a Game Pass you earn by
finishing quests, Instagram-style daily stories, a Qur'an/hadith quote every day (3 swaps), a Korean study
plan with flashcards, and a stats page.

There are two ways to use it. Both run the same code.

- **Claude-hosted page:** https://claude.ai/artifact/NJ66ex5AZ6LBSNwNy4oJ (private to you; open it while signed in to Claude)
- **Installable app:** the `app` folder here, hosted free on GitHub Pages (steps below)

| | Claude-hosted page | Installable app (this folder) |
|---|---|---|
| Setup | none — open the link | ~10 minutes, once |
| Sync between devices | automatic (Claude storage) | private GitHub Gist |
| Works offline | no | yes |
| On the home screen | browser shortcut | real app icon, opens full-screen |

You can start on the Claude page today and move later: **Me → Backup & move → Export backup**, then
**Import backup** in the other version. Importing merges, nothing is lost.

---

## A. Put the installable app online (GitHub Pages, free)

1. Sign in at github.com → **New repository** → name it `istiqomat` → Public → Create.
2. On the empty repo page click **uploading an existing file**.
3. Open this folder's **`app`** folder, select **everything inside it** (index.html, sw.js, manifest.webmanifest,
   and the css, data, fonts, icons, js folders) and drag it into the browser. Click **Commit changes**.
   `index.html` must end up at the top level of the repo, not inside an `app` folder.
4. Repo **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
5. After a minute your app is at `https://YOUR-USERNAME.github.io/istiqomat/`.

## B. Install it on your devices

**Android (both phones)** — open the link in Chrome → ⋮ menu → **Add to Home screen → Install**.
It gets its own icon and opens without the browser bar. Long-press the icon for shortcuts (Today, Korean, Tasks).
Put it where your most-used social app used to be.

**Windows** — open the link in Edge → **⋯ → Apps → Install this site as an app**.
Then right-click the taskbar icon → **Pin to taskbar**. In `edge://apps` you can tick
**Start app when you sign in**, so it greets you every morning.

## C. Sync the three devices (installable app)

1. On the PC: **Me → Sync** → *create token (scope: gist)*. GitHub opens with the `gist` scope already ticked.
   Pick a long expiry → **Generate token** → copy it.
2. Paste it into Istiqomat → **Connect**. A private gist called “Istiqomat sync” is created for your data.
3. **Copy link for another device**, send it to yourself (Telegram *Saved Messages* works well) and open it once on
   each phone. That device is now connected.

Changes go up a few seconds after you make them and come down whenever you open the app.
The token can only read and write your gists, and you can revoke it on GitHub at any time.

## D. Reminders

Web apps cannot reliably wake your phone, so reminders go through Google Calendar:
**Me → Reminders** has a weekday and a weekend link for each quest (times come from your quest settings),
or download the whole set as one `.ics` file and import it at calendar.google.com → Settings → Import & export.
Every device signed in to your Google account will then remind you.

---

## How it fights the day-4 wall and lazy weekends

- **Shields** — a short day uses a shield instead of breaking your streak (never two days in a row).
  You start with one and earn another every 7 streak days.
- **Minimum versions** — 10 flashcards, one workout round, 2 pages, 15 minutes on the channel. They keep the
  streak alive on bad days. Qur'an stays at your 10-minute floor.
- **A badge just past day 4** (“Day-4 Wall Breaker” at a 5-day streak) and a special nudge on days 4–5.
- **Weekends**: double XP, a boss with 8 hit points (every quest on Saturday + Sunday is one hit), weekend-only
  times for each quest, and a Friday planner. Bosses are named after what usually breaks your weekends:
  the Snooze Dragon, the Scroll Serpent, the Lag Wraith and the Couch Golem.
- **Game Pass** — games unlock after 3 quests; each quest earns 15 minutes (a perfect day earns an extra share).
  Start the game timer from the Today screen; it warns you when the time is up.
- **Never miss twice** — the day after a miss, the app switches to comeback quotes and tells you the minimum is enough.

## Korean plan

85 sessions of about 30 minutes, built from *Fun! Fun! Korean 1*: 4 review sessions for Units 1–4
(이에요/예요, 은/는, -아/어요, 을/를, numbers and counters, time, past tense), then Unit 5 *Location* (p. 86)
through Unit 15 *Pharmacy*. Each session lists the exact pages (book page and your PDF page — the scan is
missing pp. 154, 187, 218 and 276), tasks, and grammar cards. Flashcards use spaced repetition with
732 words from the book's glossary and unit pages; tap the speaker to hear them.

## Quotes

103 short quotes: 60 Qur'an verses (Arabic text from Quran.com) and 43 hadith checked on Sunnah.com.
The English line gives the meaning; tap the reference to open the full translation, context and grading.
The first quote of the day depends on the day: steadfastness quotes on weekends, comeback quotes after a missed day.

---

## Folder map

```
app/                  ← upload the contents of this folder to GitHub Pages
  index.html          app shell          sw.js   offline cache (bump VERSION after edits)
  css/app.css         all styles         manifest.webmanifest, icons/, fonts/
  js/                 app code (no libraries, no build step)
  js/views/           Today, Korean, Tasks, Stats, Me
  data/quotes.js      generated by tools/build_quotes.py
  data/korean.js      generated by tools/build_korean.py
tools/
  build_quotes.py     edit the QURAN / HADITH lists, then run it
  build_korean.py     units, sessions, grammar cards; vocabulary in tools/korean_src/
  build_single.py     makes dist/istiqomat-claude.html (the one-file version used for the Claude page)
  make_icons.js       renders the icons
dist/istiqomat-claude.html
```

After changing any file in `app/`, raise `VERSION` in `app/sw.js` (e.g. `istiqomat-v1.0.1`) and upload again;
installed apps show “A new version is ready”.

Your data lives in your browser (and in your gist or Claude storage when sync is on) — never in this code.

Fonts: Unbounded, Onest, Amiri Quran — SIL Open Font License (licenses in `tools/`).
