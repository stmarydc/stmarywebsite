/* ==========================================================================
   St. Mary Coptic Orthodox Church — Design Mockup
   Shared script for every page. Plain JavaScript, no libraries.

   Sections:
     1. Basics (mobile menu, fade-up, photo placeholders, mock forms, toast)
     2. Date helpers ("now" in Washington time, Coptic calendar, Easter)
     3. Fasts & seasons (fasting banner, Today in the Coptic Church)
     4. Live Now / Next Service pill
     5. Sermon filters
     6. Our Roots timeline
     7. English / Arabic toggle (with the Arabic dictionary at the bottom)

   PREVIEW TIP: add ?date=2026-12-06 (or ?date=2026-09-27T09:00) to any page
   address to see the site as it would look on that date and time.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lang = "en"; // current language; set properly in section 7

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Small helper: pick the English or Arabic version of a UI string */
  function t(en, ar) { return lang === "ar" ? ar : en; }

  /* =======================================================================
     1. BASICS
     ======================================================================= */

  /* ---------- Mobile slide-in menu ---------- */
  var menuBtn = $(".menu-btn");
  var nav = document.getElementById("site-nav");

  function openNav() {
    document.body.classList.add("nav-open", "nav-locked");
    menuBtn.setAttribute("aria-expanded", "true");
    var first = nav.querySelector("a, button");
    if (first) first.focus();
  }
  function closeNav(returnFocus) {
    document.body.classList.remove("nav-open", "nav-locked");
    menuBtn.setAttribute("aria-expanded", "false");
    if (returnFocus) menuBtn.focus();
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", openNav);
    var closeBtn = $(".nav-close");
    var scrim = $(".nav-scrim");
    if (closeBtn) closeBtn.addEventListener("click", function () { closeNav(true); });
    if (scrim) scrim.addEventListener("click", function () { closeNav(true); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) closeNav(true);
    });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (mq) {
      if (mq.matches) closeNav(false);
    });
  }

  /* ---------- Fade-up on scroll ---------- */
  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Photo placeholders ----------
     Each <img> points at the real photo filename (e.g. images/sanctuary.jpg).
     If that file isn't there yet, the matching placeholder SVG is shown with
     its caption. Drop a real photo in /images with the same name and it
     appears automatically. */
  function usePlaceholder(img) {
    var fallback = img.getAttribute("data-placeholder");
    if (!fallback || img.src.indexOf(fallback) !== -1) return;
    img.src = fallback;
    var fig = img.closest(".photo");
    if (fig) fig.classList.add("is-placeholder");
  }
  $$("img[data-placeholder]").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) {
      usePlaceholder(img);
    } else {
      img.addEventListener("error", function () { usePlaceholder(img); }, { once: true });
    }
  });

  /* ---------- Toast (short "this is a mockup" notes) ---------- */
  var toast, toastTimer;
  function showToast(message) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.innerHTML = "";
    var label = document.createElement("strong");
    label.textContent = t("Mockup", "نموذج تجريبي");
    toast.appendChild(label);
    toast.appendChild(document.createTextNode(message));
    requestAnimationFrame(function () { toast.classList.add("is-shown"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-shown"); }, 4500);
  }

  /* Links marked data-mock-link (e.g. Give via Pushpay) explain themselves */
  $$("[data-mock-link]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      showToast(tr(el.getAttribute("data-mock-link")));
    });
  });

  /* ---------- Mock forms (nothing is sent anywhere) ---------- */
  $$("form[data-mock]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".form-note");
      if (note) {
        note.textContent = t("Mockup only. Nothing was sent. ", "نموذج تجريبي فقط. لم يُرسَل شيء. ") +
          tr(form.getAttribute("data-mock") || "");
      }
    });
  });

  /* ---------- Calendar: Month / List toggle, month arrows, today ----------
     (set up by initCalendar(), called near the end once "now" is known) */
  function initCalendar() {
    $$(".cal").forEach(function (cal) {
      var buttons = $$("[data-cal-view]", cal);
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          cal.setAttribute("data-view", btn.getAttribute("data-cal-view"));
          buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        });
      });

      var months = $$(".cal-month", cal);
      if (!months.length) return;
      var titles = $$("[data-month-title]", cal);
      var prev = $('[data-cal-step="-1"]', cal);
      var next = $('[data-cal-step="1"]', cal);

      // Highlight today and open on the current month (if it's in the calendar)
      var now = getNow();
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      var todayKey = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
      $$('[data-date="' + todayKey + '"]', cal).forEach(function (el) { el.classList.add("is-today"); });
      var index = months.map(function (m) { return m.getAttribute("data-month"); }).indexOf(todayKey.slice(0, 7));
      if (index < 0) index = 0;

      function show(i) {
        index = Math.max(0, Math.min(months.length - 1, i));
        months.forEach(function (m, k) { m.hidden = k !== index; });
        titles.forEach(function (t, k) { t.hidden = k !== index; });
        if (prev) prev.disabled = index === 0;
        if (next) next.disabled = index === months.length - 1;
      }
      if (prev) prev.addEventListener("click", function () { show(index - 1); });
      if (next) next.addEventListener("click", function () { show(index + 1); });
      show(index);
    });
  }

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* =======================================================================
     2. DATE HELPERS
     ======================================================================= */

  var DAY = 86400000;

  /* "Now" as a wall-clock time in Washington (America/New_York), so service
     times work for visitors in any time zone. ?date=YYYY-MM-DD[THH:MM]
     overrides it for previews. Returns a Date whose local fields hold ET. */
  var previewing = false;
  function getNow() {
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(location.search);
    if (m) {
      previewing = true;
      return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 10, m[5] ? +m[5] : 0);
    }
    try {
      var parts = {};
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York", hour12: false,
        year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric"
      }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      return new Date(+parts.year, +parts.month - 1, +parts.day, (+parts.hour) % 24, +parts.minute, +parts.second);
    } catch (e) {
      return new Date();
    }
  }

  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function daysBetween(a, b) { return Math.round((midnight(b) - midnight(a)) / DAY); }

  /* Julian Day Number <-> calendar date */
  function toJdn(d) { return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY) + 2440588; }
  function fromJdn(j) {
    var u = new Date((j - 2440588) * DAY);
    return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
  }

  /* Coptic calendar (Anno Martyrum). 1 Thout 1 A.M. = JDN 1825030. */
  var COPTIC_EPOCH = 1825030;
  function copticToJdn(y, m, d) { return COPTIC_EPOCH + 365 * (y - 1) + Math.floor(y / 4) + 30 * (m - 1) + d - 1; }
  function toCoptic(date) {
    var j = toJdn(date);
    var y = Math.floor((4 * (j - COPTIC_EPOCH) + 1463) / 1461);
    var m = Math.floor((j - copticToJdn(y, 1, 1)) / 30) + 1;
    var d = j - copticToJdn(y, m, 1) + 1;
    return { y: y, m: m, d: d };
  }
  function copticDate(y, m, d) { return fromJdn(copticToJdn(y, m, d)); }

  var COPTIC_MONTHS = {
    en: ["Thout", "Paopi", "Hathor", "Koiak", "Tobi", "Meshir", "Paremhat", "Parmouti", "Pashons", "Paoni", "Epip", "Mesori", "Nasie"],
    ar: ["توت", "بابه", "هاتور", "كيهك", "طوبة", "أمشير", "برمهات", "برمودة", "بشنس", "بؤونة", "أبيب", "مسرى", "النسيء"]
  };

  /* Coptic (Orthodox) Easter: Julian-calendar Easter moved to the
     Gregorian calendar (+13 days, valid 1900–2099). */
  function copticEaster(year) {
    var a = year % 4, b = year % 7, c = year % 19;
    var d = (19 * c + 15) % 30;
    var e = (2 * a + 4 * b - d + 34) % 7;
    var month = Math.floor((d + e + 114) / 31);
    var day = ((d + e + 114) % 31) + 1;
    return new Date(year, month - 1, day + 13);
  }

  /* =======================================================================
     3. FASTS & SEASONS
     Date rules below follow the usual Coptic practice. They are marked
     "to verify" on the site until the clergy confirm them.
     ======================================================================= */

  var FAST_NAMES = {
    nativity: ["Nativity Fast", "صوم الميلاد"],
    jonah:    ["Jonah’s Fast", "صوم يونان"],
    lent:     ["Great Lent & Holy Week", "الصوم الكبير وأسبوع الآلام"],
    apostles: ["Apostles’ Fast", "صوم الرسل"],
    stmary:   ["St. Mary’s Fast", "صوم السيدة العذراء"]
  };

  function fastsAround(date) {
    var cy = toCoptic(date).y;
    var easter = copticEaster(date.getFullYear());
    var apostlesEndYear = toCoptic(new Date(date.getFullYear(), 6, 1)).y;
    return [
      { key: "nativity", start: copticDate(cy, 3, 16), end: copticDate(cy, 4, 28) },   // 16 Hathor – 28 Koiak
      { key: "jonah",    start: addDays(easter, -69), end: addDays(easter, -67) },     // Mon–Wed, 2 weeks before Lent
      { key: "lent",     start: addDays(easter, -55), end: addDays(easter, -1) },      // 55 days
      { key: "apostles", start: addDays(easter, 50),  end: copticDate(apostlesEndYear, 11, 4) }, // day after Pentecost – 4 Epip
      { key: "stmary",   start: copticDate(cy, 12, 1), end: copticDate(cy, 12, 15) }  // 1–15 Mesori
    ];
  }

  function activeFast(date) {
    var day = midnight(date);
    var found = null;
    fastsAround(date).forEach(function (f) {
      if (day >= f.start && day <= f.end) {
        found = { key: f.key, day: daysBetween(f.start, day) + 1, length: daysBetween(f.start, f.end) + 1 };
      }
    });
    return found;
  }

  function currentSeason(date) {
    var fast = activeFast(date);
    if (fast) {
      return {
        name: FAST_NAMES[fast.key],
        note: ["Day " + fast.day + " of " + fast.length, "اليوم " + fast.day + " من " + fast.length]
      };
    }
    var c = toCoptic(date);
    var easter = copticEaster(date.getFullYear());
    var sinceEaster = daysBetween(easter, date);
    var weekday = date.getDay();

    if (sinceEaster === 0) return { name: ["Feast of the Resurrection", "عيد القيامة المجيد"], note: ["Christ is risen!", "المسيح قام!"] };
    if (sinceEaster > 0 && sinceEaster < 50) {
      return { name: ["The Holy Fifty Days", "الخماسين المقدسة"], note: ["Day " + (sinceEaster + 1) + " of 50 · no fasting", "اليوم " + (sinceEaster + 1) + " من 50 · بلا صوم"] };
    }
    if (c.m === 4 && c.d === 29) return { name: ["Feast of the Nativity", "عيد الميلاد المجيد"], note: ["29 Koiak", "29 كيهك"] };
    if (c.m === 5 && c.d === 11) return { name: ["Feast of the Theophany", "عيد الغطاس المجيد"], note: ["11 Tobi", "11 طوبة"] };
    if (c.m === 1 && c.d <= 16) return { name: ["Season of the Nayrouz", "موسم النيروز"], note: ["The Coptic New Year", "رأس السنة القبطية"] };
    if (c.m === 1 && c.d <= 19) return { name: ["Feast of the Cross", "عيد الصليب"], note: ["17–19 Thout", "17–19 توت"] };
    if (c.m === 4) return { name: ["Month of Koiak", "شهر كيهك"], note: ["The Kiahk praises", "تسابيح كيهك"] };

    var fastDay = weekday === 3 || weekday === 5;
    return {
      name: ["Days of the Year", "أيام السنة"],
      note: fastDay ? [(weekday === 3 ? "Wednesday" : "Friday") + " · a fasting day", (weekday === 3 ? "الأربعاء" : "الجمعة") + " · يوم صوم"]
                    : ["Wednesdays & Fridays are fasting days", "الأربعاء والجمعة أيام صوم"]
    };
  }

  function renderFastBanner(now) {
    var banner = $("[data-fast-banner]");
    if (!banner) return;
    var fast = activeFast(now);
    if (!fast) { banner.hidden = true; return; }
    banner.hidden = false;
    $("[data-fast-name]", banner).textContent = t(FAST_NAMES[fast.key][0], FAST_NAMES[fast.key][1]);
    $("[data-fast-day]", banner).textContent = t("Day " + fast.day + " of " + fast.length, "اليوم " + fast.day + " من " + fast.length);
  }

  function renderToday(now) {
    var greg = $('[data-today="gregorian"]');
    if (!greg) return;
    var locale = lang === "ar" ? "ar-EG-u-nu-latn" : "en-US";
    greg.textContent = now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    var c = toCoptic(now);
    $('[data-today="coptic"]').textContent = c.d + " " + COPTIC_MONTHS[lang][c.m - 1] + " " + c.y + t(" A.M.", " ش");
    var s = currentSeason(now);
    $('[data-today="season"]').textContent = t(s.name[0], s.name[1]);
    var note = $('[data-today="season-note"]');
    if (note) note.textContent = t(s.note[0], s.note[1]);
  }

  /* =======================================================================
     4. LIVE NOW / NEXT SERVICE
     Service times (Washington time), as listed on stmarydc.org.
     day: 0 = Sunday … 6 = Saturday
     ======================================================================= */

  var SERVICES = [
    { day: 0, start: "06:30", end: "09:15", name: ["Sunday Holy Liturgy", "قداس الأحد"] },
    { day: 5, start: "05:00", end: "07:00", name: ["Friday Holy Liturgy", "قداس الجمعة"] },
    { day: 6, start: "08:15", end: "11:15", name: ["Saturday Liturgy", "قداس السبت"] },
    { day: 6, start: "13:00", end: "16:00", name: ["Vespers & Midnight Praises", "عشية وتسبحة نصف الليل"] }
  ];

  function at(day, hhmm) {
    var p = hhmm.split(":");
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), +p[0], +p[1]);
  }

  function serviceStatus(now) {
    for (var i = 0; i < 8; i++) {
      var day = addDays(midnight(now), i);
      var todays = SERVICES.filter(function (s) { return s.day === day.getDay(); });
      for (var k = 0; k < todays.length; k++) {
        var s = todays[k];
        var start = at(day, s.start), end = at(day, s.end);
        if (now >= start && now < end) return { live: true, service: s };
        if (start > now) return { live: false, service: s, start: start };
      }
    }
    return null;
  }

  function countdownText(ms) {
    var mins = Math.max(1, Math.round(ms / 60000));
    var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
    if (lang === "ar") {
      var rtf, nf;
      try {
        rtf = new Intl.RelativeTimeFormat("ar-u-nu-latn", { numeric: "auto" });
        nf = function (n, unit) { return new Intl.NumberFormat("ar-u-nu-latn", { style: "unit", unit: unit, unitDisplay: "long" }).format(n); };
        if (d > 0) return rtf.format(d, "day") + (h ? " و" + nf(h, "hour") : "");
        if (h > 0) return rtf.format(h, "hour") + (m ? " و" + nf(m, "minute") : "");
        return rtf.format(m, "minute");
      } catch (e) { /* fall through to numbers */ }
      return "بعد " + (d ? d + " ي " : "") + (h ? h + " س " : "") + m + " د";
    }
    if (d > 0) return "in " + d + (d === 1 ? " day " : " days ") + h + " hr" + (h === 1 ? "" : "s");
    if (h > 0) return "in " + h + " hr" + (h === 1 ? "" : "s") + (m ? " " + m + " min" : "");
    return "in " + m + " min";
  }

  function renderLivePill(now) {
    var pill = $("[data-live-pill]");
    if (!pill) return;
    var text = $("[data-live-text]", pill);
    var st = serviceStatus(now);
    if (!st) return;
    pill.classList.toggle("is-live", st.live);
    var name = t(st.service.name[0], st.service.name[1]);
    text.textContent = st.live
      ? t("Live Now: " + name + " · Watch", "مباشر الآن: " + name + " · شاهد")
      : t("Next: ", "التالي: ") + name + " · " + countdownText(st.start - now);
  }

  /* ---------- Upcoming Events (Home): next four from the weekly schedule ----------
     Same schedule as the Worship page calendar (stmarydc.org "Worship & Events").
     day: 0 = Sunday … 6 = Saturday */
  var WEEKLY_EVENTS = [
    { day: 0, start: "06:30", end: "09:15", name: ["Holy Liturgy", "القداس الإلهي"], where: ["In church", "في الكنيسة"], link: "worship.html#schedule" },
    { day: 0, start: "20:30", end: "21:30", name: ["Prayer Meeting", "اجتماع الصلاة"], where: ["Online", "أونلاين"], link: "ministries.html#prayer-meeting" },
    { day: 1, start: "19:00", end: "20:00", name: ["Youth Academy (Grades 7–12)", "أكاديمية الشباب (الصفوف 7–12)"], where: ["Zoom only", "زووم فقط"], link: "ministries.html#youth" },
    { day: 5, start: "05:00", end: "07:00", name: ["Holy Liturgy", "القداس الإلهي"], where: ["Sanctuary", "الكنيسة"], link: "worship.html#schedule" },
    { day: 5, start: "17:00", end: "18:00", name: ["Children’s Academy (Grades 3–6)", "أكاديمية الأطفال (الصفوف 3–6)"], where: ["Zoom only", "زووم فقط"], link: "ministries.html#sunday-school" },
    { day: 5, start: "19:00", end: "20:00", name: ["Adults’ Academy (Arabic)", "أكاديمية الكبار (بالعربية)"], where: ["Zoom only", "زووم فقط"], link: "ministries.html#adult-academy" },
    { day: 5, start: "19:45", end: "21:00", name: ["Youth Academy (English)", "أكاديمية الشباب (بالإنجليزية)"], where: ["Church basement / Zoom", "قبو الكنيسة / زووم"], link: "ministries.html#youth-english" },
    { day: 6, start: "08:15", end: "11:15", name: ["Saturday Liturgy", "قداس السبت"], where: ["In church", "في الكنيسة"], link: "worship.html#schedule" },
    { day: 6, start: "11:30", end: "12:30", name: ["Services", "صلوات"], where: ["After the Saturday Liturgy", "بعد قداس السبت"], link: "worship.html#schedule" },
    { day: 6, start: "13:00", end: "16:00", name: ["Vespers & Midnight Praises", "عشية وتسبحة نصف الليل"], where: ["In church", "في الكنيسة"], link: "worship.html#schedule" }
  ];

  function clock(hhmm) {
    var p = hhmm.split(":"), h = +p[0], m = p[1];
    var ampm = h < 12 ? t("AM", "ص") : t("PM", "م");
    return { text: ((h + 11) % 12 + 1) + ":" + m, ampm: ampm };
  }
  function timeRange(a, b) {
    var x = clock(a), y = clock(b);
    return x.ampm === y.ampm ? x.text + " – " + y.text + " " + y.ampm
                             : x.text + " " + x.ampm + " – " + y.text + " " + y.ampm;
  }

  function renderUpcoming(now) {
    var list = $("[data-upcoming]");
    if (!list) return;
    var locale = lang === "ar" ? "ar-EG-u-nu-latn" : "en-US";
    var items = [];
    for (var i = 0; i < 14 && items.length < 4; i++) {
      var day = addDays(midnight(now), i);
      WEEKLY_EVENTS.filter(function (ev) { return ev.day === day.getDay(); }).forEach(function (ev) {
        if (items.length < 4 && at(day, ev.end) > now) items.push({ ev: ev, day: day, i: i });
      });
    }
    list.innerHTML = "";
    items.forEach(function (item) {
      var ev = item.ev, day = item.day;
      var when = item.i === 0 ? t("Today", "اليوم") : item.i === 1 ? t("Tomorrow", "غدًا")
               : day.toLocaleDateString(locale, { weekday: "long" });
      var li = document.createElement("li");
      li.className = "event";
      li.innerHTML =
        '<div class="event-date"><span class="m"></span><span class="d"></span></div>' +
        '<div><h3></h3><p></p></div>' +
        '<a class="btn btn--ghost btn--sm"></a>';
      $(".m", li).textContent = day.toLocaleDateString(locale, { month: lang === "ar" ? "long" : "short" });
      $(".d", li).textContent = (day.getDate() < 10 ? "0" : "") + day.getDate();
      $("h3", li).textContent = t(ev.name[0], ev.name[1]);
      $("p", li).textContent = when + " · " + timeRange(ev.start, ev.end) + " · " + t(ev.where[0], ev.where[1]);
      var a = $("a", li);
      a.href = ev.link;
      a.textContent = t("Details", "التفاصيل");
      list.appendChild(li);
    });
  }

  /* ---------- Saint of the Day & Today's Readings (Home) ----------
     Data: js/readings-data.js (window.ST_MARY_READINGS), collected once a year
     from CopticChurch.net. Each date holds saint names + reading references
     in English and Arabic: { s: [[path, en]], sa: [[path, ar]], p/c/a/g: [en, ar], h: [en, ar] } */
  function renderReadings(now) {
    var saintsBox = $("[data-today-saints]");
    if (!saintsBox) return;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var key = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    var day = (window.ST_MARY_READINGS || {})[key];
    var ar = lang === "ar";
    var site = "https://www.copticchurch.net";
    var query = "?g_year=" + now.getFullYear() + "&g_month=" + (now.getMonth() + 1) + "&g_day=" + now.getDate();

    var link = $("[data-today-readings-link]");
    if (link) link.href = site + "/readings" + (ar ? "/ar" : "") + query;

    saintsBox.innerHTML = "";
    // English and Arabic saint lists are kept separately (the source orders them differently)
    var saints = day ? (ar && day.sa && day.sa.length ? day.sa : day.s) : null;
    if (saints && saints.length) {
      saints.forEach(function (x) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = site + x[0];
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = x[1];
        li.appendChild(a);
        saintsBox.appendChild(li);
      });
    } else {
      // e.g. Holy Week: no Synaxarium reading, show the day's name instead
      var li = document.createElement("li");
      li.textContent = day && day.h ? (ar ? day.h[1] : day.h[0])
        : t("See today’s commemoration on CopticChurch.net.", "راجع تذكار اليوم على موقع CopticChurch.net.");
      saintsBox.appendChild(li);
    }

    $$("[data-reading]").forEach(function (el) {
      var r = day && day[el.getAttribute("data-reading")];
      el.textContent = r ? (ar ? r[1] : r[0]) : "—";
    });
  }

  /* Re-draw everything that depends on the date, language, or clock */
  function renderDated() {
    var now = getNow();
    renderFastBanner(now);
    renderToday(now);
    renderLivePill(now);
    renderUpcoming(now);
    renderReadings(now);
  }

  /* =======================================================================
     5. SERMON FILTERS
     ======================================================================= */

  $$("[data-filter-group]").forEach(function (group) {
    var name = group.getAttribute("data-filter-group");
    var items = $$('[data-filter-items="' + name + '"] > *');
    var status = $("[data-filter-status]");
    var chips = $$("[data-filter]", group);
    var current = "all";

    function apply() {
      var shown = 0;
      items.forEach(function (item) {
        var match = current === "all" || item.getAttribute("data-topic") === current;
        item.hidden = !match;
        if (match) shown++;
      });
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-filter") === current)); });
      if (status) {
        status.textContent = current === "all" ? "" :
          t("Showing " + shown + " of " + items.length + " sermons", "عرض " + shown + " من " + items.length + " عظات");
      }
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { current = chip.getAttribute("data-filter"); apply(); });
    });
    group.refresh = apply; // so the language switch can update the status line
  });

  /* =======================================================================
     6. OUR ROOTS TIMELINE
     ======================================================================= */

  var timeline = $(".timeline");
  if (timeline) {
    var tlItems = $$(".tl-item", timeline);
    var prevBtn = $('[data-tl="prev"]');
    var nextBtn = $('[data-tl="next"]');
    var progress = $("[data-tl-progress]");
    var active = 0;

    function isRtl() { return getComputedStyle(timeline).direction === "rtl"; }

    function findActive() {
      var box = timeline.getBoundingClientRect();
      var pad = parseFloat(getComputedStyle(timeline).paddingInlineStart) || 0;
      var rtl = isRtl();
      var edge = rtl ? box.right - pad : box.left + pad;
      var best = 0, bestDist = Infinity;
      tlItems.forEach(function (item, i) {
        var r = item.getBoundingClientRect();
        var dist = Math.abs((rtl ? r.right : r.left) - edge);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      // at the very end of the scroll, the last item counts as active
      var maxScroll = timeline.scrollWidth - timeline.clientWidth;
      if (maxScroll > 0 && Math.abs(timeline.scrollLeft) >= maxScroll - 4) best = tlItems.length - 1;
      return best;
    }

    function update() {
      active = findActive();
      tlItems.forEach(function (item, i) { item.classList.toggle("is-active", i === active); });
      if (prevBtn) prevBtn.disabled = active === 0;
      if (nextBtn) nextBtn.disabled = active === tlItems.length - 1;
      if (progress) progress.style.width = ((active + 1) / tlItems.length * 100) + "%";
    }

    function goTo(i) {
      i = Math.max(0, Math.min(tlItems.length - 1, i));
      var item = tlItems[i];
      var box = timeline.getBoundingClientRect();
      var r = item.getBoundingClientRect();
      var pad = parseFloat(getComputedStyle(timeline).paddingInlineStart) || 0;
      var delta = isRtl() ? r.right - (box.right - pad) : r.left - (box.left + pad);
      timeline.scrollBy({ left: delta, behavior: reduceMotion ? "auto" : "smooth" });
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(active - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(active + 1); });
    timeline.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      var forward = (e.key === "ArrowRight") !== isRtl();
      goTo(active + (forward ? 1 : -1));
    });

    var ticking = false;
    timeline.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener("resize", update);
    timeline.refresh = update;
    update();
  }

  /* =======================================================================
     7. ENGLISH / ARABIC TOGGLE
     Every visible English text on the site is looked up in the AR
     dictionary (bottom of this file). Anything missing stays in English.
     All Arabic is pending review by a native speaker.
     ======================================================================= */

  var STORAGE_KEY = "stmary-lang";
  var AR = {
    "Fridays, 7:45 – 9:00 PM": "الجمعة، 7:45 – 9:00 م",
    "Mon · Fri": "الاثنين · الجمعة",
    "Phone (optional)": "الهاتف (اختياري)",
    "Join Our Community": "انضم إلى مجتمعنا",
    "Bible stories, saints, hymns, and the life of the Church, taught by caring servants.": "قصص الكتاب المقدس والقديسين والألحان وحياة الكنيسة، يقدّمها خدام محبّون.",
    "Fridays, 5:00 – 6:00 PM": "الجمعة، 5:00 – 6:00 م",
    "Middle and high schoolers study the faith together and build friendships rooted in Christ.": "يدرس طلاب الإعدادي والثانوي الإيمان معًا ويبنون صداقات متأصلة في المسيح.",
    "Mondays, 7:00 – 8:00 PM": "الاثنين، 7:00 – 8:00 م",
    "An English-language class where youth study the Scriptures and the Orthodox faith together.": "فصل باللغة الإنجليزية يدرس فيه الشباب الكتاب المقدس والإيمان الأرثوذكسي معًا.",
    "Thursdays, 7:45 – 9:00 PM": "الخميس، 7:45 – 9:00 م",
    "Church basement / Zoom": "قبو الكنيسة / زووم",
    "The parish gathers online on Sunday evenings to pray together.": "تجتمع الكنيسة أونلاين مساء الأحد للصلاة معًا.",
    "Sundays, 8:30 – 9:30 PM": "الأحد، 8:30 – 9:30 م",
    "Online": "أونلاين",
    "Contact the church for meeting times": "تواصل مع الكنيسة لمعرفة المواعيد",
    "St. Mary Church": "كنيسة العذراء مريم",
    "Text keywords": "أرسل الكلمات",
    "to 77977. Service charges may apply.": "إلى 77977. قد تُطبَّق رسوم الخدمة.",
    "Read today’s readings": "اقرأ قراءات اليوم",
    "Saints and readings from": "القديسون والقراءات من موقع",
    ". The dates and season above are calculated automatically.": ". التواريخ والموسم أعلاه تُحسب تلقائيًا.",
    "Join us": "انضم إلينا",
    "Saturday Divine Liturgy": "قداس السبت الإلهي",
    "Sermons": "العظات",
    "What Does the Lord Require of You?": "ماذا يطلب منك الرب؟",
    "How Can I Make My Heart a Temple for God?": "كيف أجعل قلبي هيكلًا لله؟",
    "Celebrating the Honorable Cross": "الاحتفال بالصليب المكرَّم",
    "Jesus Rejoiced in the Spirit": "تهلّل يسوع بالروح",
    "Our Teacher Dioscorus": "معلمنا ديسقوروس",
    "John the Baptist": "يوحنا المعمدان",
    "“I have loved you,” says the LORD": "«أحببتكم» قال الرب",
    "Lord, Teach Us to Pray": "يا رب، علّمنا أن نصلي",
    "Whoever Does the Will of God": "من يصنع مشيئة الله",
    "Youth Academy": "أكاديمية الشباب",
    "Middle and high schoolers study the faith together and build friendships rooted in Christ, with an English-language class on Thursdays.": "يدرس طلاب الإعدادي والثانوي الإيمان معًا ويبنون صداقات متأصلة في المسيح، مع فصل باللغة الإنجليزية يوم الخميس.",
    "Grades 7–12": "الصفوف 7–12",
    "Mondays, 7:00 – 8:00 PM · Thursdays (English), 7:45 – 9:00 PM": "الاثنين، 7:00 – 8:00 م · الخميس (بالإنجليزية)، 7:45 – 9:00 م",
    "Mondays on Zoom · Thursdays in the church basement or on Zoom": "الاثنين عبر زووم · الخميس في قبو الكنيسة أو عبر زووم",
    "Adults study the Scriptures and the Orthodox faith together in Arabic.": "يدرس الكبار الكتاب المقدس والإيمان الأرثوذكسي معًا باللغة العربية.",
    "Adults": "الكبار",
    "Fridays, 7:00 – 8:00 PM": "الجمعة، 7:00 – 8:00 م",
    "Zoom only": "زووم فقط",
    "Join the Class": "انضم إلى الفصل",
    "Children’s Academy, Grades 3–6: Fridays, 5:00 – 6:00 PM on Zoom": "أكاديمية الأطفال، الصفوف 3–6: الجمعة، 5:00 – 6:00 م عبر زووم",
    "Adults’ Academy": "أكاديمية الكبار",
    "Youth Academy (Grades 7–12)": "أكاديمية الشباب (الصفوف 7–12)",
    "Children’s Academy (Grades 3–6)": "أكاديمية الأطفال (الصفوف 3–6)",
    "Weekly schedule as listed on stmarydc.org. Special events will sync from CCB.": "الجدول الأسبوعي كما هو منشور على stmarydc.org. ستُضاف المناسبات الخاصة من CCB.",
    "The Sunday Divine Liturgy, the heart of our week together.": "قداس الأحد الإلهي، قلب أسبوعنا معًا.",
    "An early weekday Liturgy in the sanctuary.": "قداس مبكر في منتصف الأسبوع داخل الكنيسة.",
    "The Saturday Divine Liturgy.": "قداس السبت الإلهي.",
    "All services are held at 5910 Goldsboro Rd, Bethesda, MD, and most are streamed live on YouTube. We also gather online for a prayer meeting on Sunday evenings, 8:30 – 9:30 PM.": "تُقام جميع الصلوات في 5910 Goldsboro Rd، بيثيسدا، ميريلاند، ومعظمها يُبث مباشرة على يوتيوب. كما نجتمع أونلاين لاجتماع صلاة مساء الأحد من 8:30 إلى 9:30 م.",
    "All services are at 5910 Goldsboro Rd, Bethesda, unless marked online.": "جميع الصلوات في 5910 Goldsboro Rd، بيثيسدا، ما لم يُذكر أنها أونلاين.",
    "The Sunday Divine Liturgy. Streamed live.": "قداس الأحد الإلهي. بث مباشر.",
    "Online.": "أونلاين.",
    "In the sanctuary.": "داخل الكنيسة.",
    "Following the Saturday Liturgy.": "بعد قداس السبت.",
    "Mon · Thu · Fri": "الاثنين · الخميس · الجمعة",
    "Evenings": "مساءً",
    "Youth, children, and adults, on Zoom and in person. See the calendar below.": "للشباب والأطفال والكبار، عبر زووم وحضوريًا. راجع التقويم أدناه.",
    "Holy Liturgy": "القداس الإلهي",
    "Prayer Meeting": "اجتماع الصلاة",
    "Prayer Meeting · Online": "اجتماع الصلاة · أونلاين",
    "Youth Academy (7–12)": "أكاديمية الشباب (7–12)",
    "Academy: Youth, Grades 7–12 · Zoom only": "الأكاديمية: الشباب، الصفوف 7–12 · زووم فقط",
    "Youth Academy (English)": "أكاديمية الشباب (إنجليزي)",
    "Academy: Youth (English) · Church basement / Zoom": "الأكاديمية: الشباب (بالإنجليزية) · قبو الكنيسة / زووم",
    "Holy Liturgy · Sanctuary": "القداس الإلهي · الكنيسة",
    "Children’s Academy": "أكاديمية الأطفال",
    "Academy: Children, Grades 3–6 · Zoom only": "الأكاديمية: الأطفال، الصفوف 3–6 · زووم فقط",
    "Adults’ Academy (Arabic)": "أكاديمية الكبار (عربي)",
    "Academy: Adults (Arabic) · Zoom only": "الأكاديمية: الكبار (بالعربية) · زووم فقط",
    "Saturday Liturgy": "قداس السبت",
    "Services": "صلوات",
    "Vespers & Praises": "عشية وتسبحة",
    "November 2026": "نوفمبر 2026",
    "Nov": "نوفمبر",
    "Monday": "الاثنين",
    "Tuesday": "الثلاثاء",
    "Thursday": "الخميس",
    "Academy": "الأكاديمية",
    "Liturgies, services & prayer": "القداسات والصلوات",
    "Academy classes": "فصول الأكاديمية",
    "Liturgies, services, and Academy classes.": "القداسات والصلوات وفصول الأكاديمية.",
    "Weekly schedule as listed on stmarydc.org. Live events will sync from CCB.": "الجدول الأسبوعي كما هو منشور على stmarydc.org. ستُحدَّث الأنشطة الفعلية من CCB.",
    "6:30 AM": "6:30 ص",
    "6:30 – 9:15 AM": "6:30 – 9:15 ص",
    "8:30 PM": "8:30 م",
    "8:30 – 9:30 PM": "8:30 – 9:30 م",
    "7:00 PM": "7:00 م",
    "7:00 – 8:00 PM": "7:00 – 8:00 م",
    "7:45 PM": "7:45 م",
    "7:45 – 9:00 PM": "7:45 – 9:00 م",
    "5:00 AM": "5:00 ص",
    "5:00 – 7:00 AM": "5:00 – 7:00 ص",
    "5:00 PM": "5:00 م",
    "5:00 – 6:00 PM": "5:00 – 6:00 م",
    "8:15 AM": "8:15 ص",
    "8:15 – 11:15 AM": "8:15 – 11:15 ص",
    "11:30 AM": "11:30 ص",
    "11:30 AM – 12:30 PM": "11:30 ص – 12:30 م",
    "1:00 PM": "1:00 م",
    "1:00 – 4:00 PM": "1:00 – 4:00 م",
    "Scan or mail": "امسح الرمز أو أرسل بالبريد",
    "Jesus Christ, the Healer of Our Nature": "يسوع المسيح شافي طبيعتنا",
    "Jesus Christ, the Good Teacher": "يسوع المسيح المعلّم الصالح",
    "For She Loved Much": "لأنها أحبت كثيرًا",
    "Sermon": "عظة",
    "Fr. Domadious Sarabamoun": "أبونا دوماديوس سرابامون",
    "(opens in new tab)": "(يفتح في نافذة جديدة)",
    "Skip to main content": "انتقل إلى المحتوى الرئيسي",
    "DESIGN MOCKUP — NOT LIVE": "نموذج تصميمي — ليس الموقع الفعلي",
    "· For review by the communications team": "· للمراجعة من فريق الإعلام",
    "St. Mary": "العذراء مريم",
    "Coptic Orthodox Church · Washington D.C.": "كنيسة قبطية أرثوذكسية · واشنطن العاصمة",
    "Home": "الرئيسية",
    "Visit": "زيارتك",
    "About": "من نحن",
    "Worship": "العبادة",
    "Ministries": "الخدمات",
    "Our Faith": "إيماننا",
    "Contact": "اتصل بنا",
    "Give": "العطاء",
    "Member Login (CCB)": "دخول الأعضاء (CCB)",
    "St. Mary Coptic Orthodox Church": "كنيسة السيدة العذراء مريم القبطية الأرثوذكسية",
    "of Washington D.C.": "بواشنطن العاصمة",
    "Micah 6:8": "ميخا ٦: ٨",
    "Plan Your Visit": "خطط لزيارتك",
    "Watch Live": "شاهد البث المباشر",
    "Photo: Sanctuary during Liturgy": "صورة: الكنيسة أثناء القداس",
    "Welcome Home": "مرحبًا بك في بيتك",
    "An ancient faith, a family for today": "إيمان عريق، وعائلة لهذا اليوم",
    "Founded in 2020, St. Mary serves the Washington D.C. metropolitan area from our home in Bethesda, Maryland. We worship in the unbroken tradition of the Church of Alexandria, founded by St. Mark the Apostle.": "تأسست كنيسة العذراء مريم عام 2020 لتخدم منطقة واشنطن العاصمة الكبرى من مقرّها في بيثيسدا بولاية ميريلاند. نعبد الله بحسب التقليد المتصل لكنيسة الإسكندرية التي أسسها القديس مرقس الرسول.",
    "Whether you grew up Coptic, are exploring Orthodoxy for the first time, or are simply looking for a place to pray, you are welcome here. We openly welcome people of every race and nationality.": "سواء نشأت قبطيًا، أو تتعرّف على الأرثوذكسية لأول مرة، أو تبحث ببساطة عن مكان للصلاة، فأنت مرحَّب بك هنا. نرحّب بمحبة بالناس من كل عرق وجنسية.",
    "Salvation through Christ": "الخلاص بالمسيح",
    "Loving our neighbor": "محبة القريب",
    "A life of service": "حياة الخدمة",
    "Welcoming every nation": "نرحّب بكل الأمم",
    "Our Story": "قصتنا",
    "The Coptic Faith": "الإيمان القبطي",
    "Daily Rhythm": "إيقاع كل يوم",
    "Today in the Coptic Church": "اليوم في الكنيسة القبطية",
    "The Church keeps time by the feasts, fasts, and saints of the Coptic calendar, counted from the Era of the Martyrs (A.M.).": "تحسب الكنيسة أيامها بأعياد وأصوام وقديسي التقويم القبطي، الذي يبدأ من عصر الشهداء (للشهداء).",
    "Today": "اليوم",
    "Liturgical season": "الموسم الكنسي",
    "Saint of the Day": "قديس اليوم",
    "(Synaxarium)": "(السنكسار)",
    "Sample commemoration text would appear here: the saint or feast remembered today, with a two-sentence summary from the Synaxarium and a link to read more.": "يظهر هنا نص تذكار تجريبي: القديس أو العيد الذي نتذكّره اليوم، مع ملخص قصير من السنكسار ورابط لقراءة المزيد.",
    "Today’s Readings": "قراءات اليوم",
    "(Katameros)": "(القطمارس)",
    "Pauline Epistle": "البولس",
    "Sample reference": "مرجع تجريبي",
    "Catholic Epistle": "الكاثوليكون",
    "Acts (Praxis)": "الإبركسيس",
    "Liturgy Gospel": "إنجيل القداس",
    "Sample content. Live feed TBD.": "محتوى تجريبي. الربط المباشر لاحقًا.",
    "The dates and season above are calculated automatically.": "التواريخ والموسم أعلاه تُحسب تلقائيًا.",
    "Worship With Us": "صلِّ معنا",
    "Service Times": "مواعيد الصلوات",
    "All services are held at 5910 Goldsboro Rd, Bethesda, MD, and most are streamed live on YouTube.": "تُقام جميع الصلوات في 5910 Goldsboro Rd، بيثيسدا، ميريلاند، ومعظمها يُبث مباشرة على يوتيوب.",
    "Sunday": "الأحد",
    "Divine Liturgy": "القداس الإلهي",
    "8:00 – 11:00 AM": "8:00 – 11:00 ص",
    "Matins, Raising of Incense, and the Holy Liturgy, in English and Arabic.": "صلاة باكر ورفع البخور والقداس الإلهي، بالإنجليزية والعربية.",
    "Wednesday": "الأربعاء",
    "Midweek Liturgy": "قداس منتصف الأسبوع",
    "7:00 – 9:00 AM": "7:00 – 9:00 ص",
    "A quieter weekday Liturgy before work and school.": "قداس هادئ في منتصف الأسبوع قبل العمل والمدرسة.",
    "Friday": "الجمعة",
    "Bible Study": "دراسة الكتاب المقدس",
    "7:30 – 9:00 PM": "7:30 – 9:00 م",
    "Verse-by-verse study with Fr. Domadious, followed by fellowship.": "دراسة آية بآية مع أبونا دوماديوس، تليها شركة ومحبة.",
    "Saturday": "السبت",
    "Vespers & Midnight Praises": "عشية وتسبحة نصف الليل",
    "6:00 – 8:30 PM": "6:00 – 8:30 م",
    "Evening Raising of Incense and the Tasbeha hymns of praise.": "رفع بخور عشية وألحان التسبحة.",
    "Full Schedule & Calendar": "الجدول الكامل والتقويم",
    "YouTube Channel": "قناة يوتيوب",
    "Photo: Fellowship after Liturgy": "صورة: الشركة بعد القداس",
    "First Visit?": "زيارتك الأولى؟",
    "Come and see": "تعالَ وانظر",
    "You don’t need to know anything to join us. Here’s what to expect on a Sunday morning.": "لا تحتاج إلى معرفة مسبقة لتنضم إلينا. إليك ما تتوقعه صباح الأحد.",
    "Arrive any time": "تعالَ في أي وقت",
    "The Liturgy is long (around three hours), and many families arrive as it goes on. Slip in quietly and find a seat.": "القداس طويل (نحو ثلاث ساعات)، وكثير من العائلات تصل أثناءه. ادخل بهدوء واختر مكانًا.",
    "Stand, sit, and simply pray": "قِف، واجلس، وصلِّ ببساطة",
    "We stand for the Gospel and key prayers and sit for readings and the sermon. Follow along with those around you.": "نقف أثناء الإنجيل والصلوات الرئيسية، ونجلس أثناء القراءات والعظة. اتبع مَن حولك.",
    "Stay for fellowship": "ابقَ للشركة",
    "Holy Communion is received by Orthodox Christians who have prepared. Everyone is welcome to receive a blessing and join us afterward.": "يتناول من الأسرار المقدسة المسيحيون الأرثوذكس المستعدّون. والجميع مرحَّب بهم لنوال البركة والانضمام إلينا بعد القداس.",
    "New to Orthodoxy?": "جديد على الأرثوذكسية؟",
    "Photo: Fr. Domadious (portrait)": "صورة: أبونا دوماديوس",
    "Our Priest": "كاهن الكنيسة",
    "Hegumen Fr. Domadious Sarabamoun": "القمص دوماديوس سرابامون",
    "Fr. Domadious has shepherded St. Mary since August 2020, when the parish was founded.": "يرعى أبونا دوماديوس كنيسة العذراء مريم منذ أغسطس 2020، عند تأسيسها.",
    "Ordained": "السيامة",
    "Served in": "خدم في",
    "Giza, Amsterdam, and Virginia": "الجيزة وأمستردام وفيرجينيا",
    "Background": "الخلفية",
    "Medical degree, Cairo University": "بكالوريوس الطب، جامعة القاهرة",
    "At St. Mary": "في كنيسة العذراء",
    "Since August 2020": "منذ أغسطس 2020",
    "St. Mary is a parish of the Coptic Orthodox Diocese of Pennsylvania, Delaware, Maryland, West Virginia and its territories, under His Grace Bishop Karas.": "كنيسة العذراء مريم تتبع إيبارشية بنسلفانيا وديلاوير وميريلاند وويست فيرجينيا وتوابعها للأقباط الأرثوذكس، تحت رعاية نيافة الأنبا كاراس.",
    "Meet Our Clergy": "تعرّف على الآباء",
    "Visit the Diocese": "موقع الإيبارشية",
    "Watch & Listen": "شاهد واستمع",
    "Recent Sermons": "أحدث العظات",
    "Catch up on sermons and Bible studies from our YouTube channel.": "تابع العظات ودراسات الكتاب المقدس على قناتنا في يوتيوب.",
    "Spiritual Life": "الحياة الروحية",
    "To Walk Humbly with Your God": "أن تسلك متواضعًا مع إلهك",
    "Fr. Domadious Sarabamoun · 38 min": "أبونا دوماديوس سرابامون · 38 دقيقة",
    "Feasts": "الأعياد",
    "The Feast of the Cross": "عيد الصليب",
    "Fr. Domadious Sarabamoun · 31 min": "أبونا دوماديوس سرابامون · 31 دقيقة",
    "The Gospel of St. Mark, Part 1": "إنجيل مرقس، الجزء الأول",
    "Friday Bible Study · 52 min": "دراسة الجمعة · 52 دقيقة",
    "Browse the Sermon Library": "تصفّح مكتبة العظات",
    "Parish Life": "حياة الكنيسة",
    "Upcoming Events": "الأنشطة القادمة",
    "Sep": "سبتمبر",
    "Feast of the Cross": "عيد الصليب",
    "Sunday · Divine Liturgy and procession": "الأحد · القداس الإلهي والزفّة",
    "Details": "التفاصيل",
    "Oct": "أكتوبر",
    "Youth Meeting": "اجتماع الشباب",
    "Friday · 7:30 PM · Fellowship Hall": "الجمعة · 7:30 م · قاعة الكنيسة",
    "Parish Family Picnic": "رحلة عائلات الكنيسة",
    "Saturday · 12:00 PM · Location TBD": "السبت · 12:00 م · المكان يُحدَّد لاحقًا",
    "Events will sync from CCB.": "ستُحدَّث الأنشطة تلقائيًا من CCB.",
    "Full Calendar": "التقويم الكامل",
    "Faith in Action": "إيمان عامل",
    "“To love mercy”": "«أن تحب الرحمة»",
    "Our faith is lived in service to our neighbors across the D.C. area.": "نعيش إيماننا بخدمة جيراننا في منطقة واشنطن.",
    "Feeding the Hungry": "إطعام الجياع",
    "Monthly meal packing and delivery with local shelters.": "تجهيز وتوصيل وجبات شهرية مع الملاجئ المحلية.",
    "Visiting the Sick": "افتقاد المرضى",
    "Prayer visits to parishioners in hospitals and at home.": "زيارات صلاة لأبناء الكنيسة في المستشفيات والبيوت.",
    "Welcoming Newcomers": "استقبال القادمين الجدد",
    "Helping new immigrant families settle into the area.": "مساعدة العائلات المهاجرة حديثًا على الاستقرار.",
    "Coptic Orphans": "أيتام الأقباط",
    "Supporting children and families in Egypt through partner charities.": "دعم الأطفال والأسر في مصر من خلال جمعيات خيرية شريكة.",
    "Volunteer": "تطوّع معنا",
    "Support Our Parish": "ادعم كنيستك",
    "Your offerings sustain our worship, our youth, and our service to the community, and help build a lasting home for St. Mary in the D.C. area.": "تقدماتكم تسند عبادتنا وشبابنا وخدمتنا للمجتمع، وتساعد في بناء بيت دائم لكنيسة العذراء مريم في منطقة واشنطن.",
    "Give Online": "تبرّع إلكترونيًا",
    "Text to Give": "التبرع برسالة نصية",
    "Bethesda, MD 20817": "بيثيسدا، ميريلاند 20817",
    "Explore": "تصفّح",
    "About Us": "من نحن",
    "Worship & Live Stream": "العبادة والبث المباشر",
    "Connect": "تواصل",
    "Contact Us": "اتصل بنا",
    "Prayer Requests": "طلبات الصلاة",
    "Diocese of PA, DE, MD & WV": "إيبارشية بنسلفانيا وتوابعها",
    "Stay in Touch": "ابقَ على تواصل",
    "Get the weekly parish newsletter.": "اشترك في النشرة الأسبوعية للكنيسة.",
    "Sign Up": "اشترك",
    "St. Mary Coptic Orthodox Church of Washington D.C.": "كنيسة السيدة العذراء مريم القبطية الأرثوذكسية بواشنطن العاصمة",
    "A parish of the Coptic Orthodox Diocese of Pennsylvania, Delaware, Maryland, West Virginia and its territories": "إحدى كنائس إيبارشية بنسلفانيا وديلاوير وميريلاند وويست فيرجينيا وتوابعها للأقباط الأرثوذكس",
    "You are welcome here": "أنت مرحَّب بك هنا",
    "Whether you are Coptic, Orthodox from another tradition, or visiting a church for the first time, we would love to pray with you. Here is everything you need to feel at home on your first Sunday.": "سواء كنت قبطيًا، أو أرثوذكسيًا من تقليد آخر، أو تزور كنيسة لأول مرة، يسعدنا أن نصلي معك. إليك كل ما تحتاجه لتشعر أنك في بيتك في أول أحد لك معنا.",
    "When & Where": "متى وأين",
    "What to Expect": "ماذا تتوقع",
    "New to Orthodoxy": "جديد على الأرثوذكسية",
    "Questions": "أسئلة",
    "Let Us Know": "أخبرنا",
    "Photo: Church entrance & signage": "صورة: مدخل الكنيسة واللافتة",
    "Join us on Sunday morning": "انضم إلينا صباح الأحد",
    "The Divine Liturgy is the heart of our life together, and the best time for a first visit.": "القداس الإلهي هو قلب حياتنا معًا، وأفضل وقت للزيارة الأولى.",
    "Sunday Divine Liturgy": "قداس الأحد",
    "Arriving at 9:00 AM for the Liturgy of the Word is a gentle start.": "الوصول في التاسعة صباحًا لقداس الكلمة بداية هادئة.",
    "5910 Goldsboro Rd, Bethesda, MD 20817": "5910 Goldsboro Rd، بيثيسدا، ميريلاند 20817",
    "Easy to reach from D.C., Maryland, and Northern Virginia.": "يسهل الوصول إليها من واشنطن وميريلاند وشمال فيرجينيا.",
    "Questions before you come?": "أسئلة قبل حضورك؟",
    "Get Directions": "الاتجاهات",
    "All Service Times": "كل مواعيد الصلوات",
    "What to expect at the Divine Liturgy": "ماذا تتوقع في القداس الإلهي",
    "Coptic worship is ancient, beautiful, and full of symbolism. You don’t need to understand it all. Come, watch, listen, and pray.": "العبادة القبطية عريقة وجميلة ومليئة بالرموز. لا تحتاج أن تفهم كل شيء. تعالَ وشاهد واستمع وصلِّ.",
    "How long is it?": "كم يستغرق؟",
    "A full Sunday Liturgy runs around three hours, including morning prayers (Matins) and the Raising of Incense. Many families arrive partway through, and that is perfectly normal.": "يستغرق قداس الأحد الكامل نحو ثلاث ساعات، بما فيها صلاة باكر ورفع البخور. كثير من العائلات تصل في منتصفه، وهذا أمر طبيعي تمامًا.",
    "Standing & sitting": "الوقوف والجلوس",
    "We stand for the Gospel reading and the most solemn prayers, and sit for the other readings and the sermon. Just follow those around you, and sit whenever you need to.": "نقف أثناء قراءة الإنجيل والصلوات الأكثر مهابة، ونجلس أثناء القراءات الأخرى والعظة. اتبع مَن حولك، واجلس متى احتجت.",
    "Languages": "اللغات",
    "Prayers and hymns are chanted in English, Arabic, and Coptic, the last stage of the ancient Egyptian language. Screens or books help you follow along.": "تُرتَّل الصلوات والألحان بالإنجليزية والعربية والقبطية، وهي آخر مراحل اللغة المصرية القديمة. تساعدك الشاشات أو الكتب على المتابعة.",
    "Holy Communion": "التناول",
    "Communion is received by baptized Orthodox Christians who have prepared through fasting and confession. Visitors are warmly welcome to receive the": "يتناول المسيحيون الأرثوذكس المعمَّدون الذين استعدّوا بالصوم والاعتراف. ويُرحَّب بالزوار بمحبة لينالوا",
    "eulogia": "اللقمة المباركة",
    ", the blessed bread shared with everyone at the end of the Liturgy.": "، وهي الخبز المبارك الذي يُوزَّع على الجميع في نهاية القداس.",
    "The kiss of peace": "قبلة السلام",
    "Before the Eucharistic prayers, the deacon invites everyone to “greet one another with a holy kiss.” We simply turn and greet those beside us with a handshake or a slight bow.": "قبل صلوات التقديس يدعو الشماس الجميع: «قبّلوا بعضكم بعضًا بقبلة مقدسة». نلتفت ببساطة ونحيّي مَن بجوارنا بمصافحة أو انحناءة خفيفة.",
    "What to wear": "ماذا ترتدي",
    "Modest, comfortable clothes are perfect. Some women cover their hair, especially for Communion, but visitors are never expected to. Come as you are.": "الملابس المحتشمة والمريحة مناسبة تمامًا. بعض السيدات يغطين شعرهن، خاصة عند التناول، لكن هذا غير مطلوب من الزوار. تعالَ كما أنت.",
    "Parking": "مواقف السيارات",
    "Free parking is available on site. Please leave the spaces closest to the door for elderly parishioners and families with young children.": "تتوفر مواقف مجانية في الكنيسة. نرجو ترك الأماكن الأقرب إلى الباب لكبار السن والعائلات التي لديها أطفال صغار.",
    "Children": "الأطفال",
    "Children are a joyful part of our worship, and a little noise is welcome. A cry room and Sunday School are available during the Liturgy.": "الأطفال جزء مُفرِح من عبادتنا، وقليل من الضجيج لا بأس به. تتوفر غرفة للأطفال ومدارس الأحد أثناء القداس.",
    "Afterward": "بعد القداس",
    "Stay for coffee and fellowship in the hall after the Liturgy. Say hello to Fr. Domadious. He loves meeting new faces.": "ابقَ لتناول القهوة والشركة في القاعة بعد القداس. سلِّم على أبونا دوماديوس، فهو يحب التعرّف على الوجوه الجديدة.",
    "An ancient Church, still praying the same prayers": "كنيسة عريقة، ما زالت تصلي الصلوات نفسها",
    "The Coptic Orthodox Church is one of the oldest Christian churches in the world. It was founded in Alexandria, Egypt, by St. Mark the Apostle, the writer of the second Gospel, in the first century.": "الكنيسة القبطية الأرثوذكسية من أقدم الكنائس المسيحية في العالم. أسسها القديس مرقس الرسول، كاتب الإنجيل الثاني، في الإسكندرية بمصر في القرن الأول.",
    "For nearly two thousand years it has kept the faith of the Apostles, the worship of the early Church, and a long tradition of saints, martyrs, and monastics. Today, Copts and friends of every background worship in Coptic churches across the world.": "على مدى ألفي عام تقريبًا حفظت إيمان الرسل وعبادة الكنيسة الأولى وتقليدًا طويلًا من القديسين والشهداء والرهبان. واليوم يصلي الأقباط وأصدقاؤهم من كل الخلفيات في الكنائس القبطية حول العالم.",
    "If you are curious about Orthodox Christianity, you are welcome to come and see, to ask questions, and to learn at your own pace. There is no pressure.": "إن كنت مهتمًا بالمسيحية الأرثوذكسية، فأنت مدعو أن تأتي وترى، وتسأل، وتتعلّم على مهل. دون أي ضغط.",
    "Explore the Coptic Faith": "تعرّف على الإيمان القبطي",
    "Talk with Fr. Domadious": "تحدّث مع أبونا دوماديوس",
    "A few words you’ll hear": "كلمات ستسمعها",
    "Liturgy": "القداس",
    "The service of Holy Communion, the Church’s central act of worship.": "صلاة سر الإفخارستيا، وهي قلب عبادة الكنيسة.",
    "Qurban": "القربان",
    "The bread offered and consecrated for Communion.": "الخبز الذي يُقدَّم ويُقدَّس للتناول.",
    "Eulogia": "اللقمة المباركة",
    "“Blessing”: blessed bread shared with all at the end.": "«البركة»: خبز مبارك يُوزَّع على الجميع في النهاية.",
    "Abouna": "أبونا",
    "“Our father”: how we address the priest.": "هكذا نخاطب الكاهن.",
    "Tasbeha": "التسبحة",
    "The Midnight Praises, sung on Saturday evenings.": "تسبحة نصف الليل، تُرتَّل مساء السبت.",
    "Theotokos": "والدة الإله",
    "“Mother of God”: a title of St. Mary, our patron.": "«ثيؤطوكوس»: لقب السيدة العذراء شفيعة كنيستنا.",
    "Good Questions": "أسئلة جيدة",
    "Frequently asked": "الأسئلة الشائعة",
    "Do I have to be Coptic or Egyptian to attend?": "هل يجب أن أكون قبطيًا أو مصريًا لأحضر؟",
    "Not at all. St. Mary openly welcomes people of every race and nationality. Our parish includes families from many backgrounds, and English is used throughout our services.": "إطلاقًا. ترحّب كنيسة العذراء مريم بالناس من كل عرق وجنسية. تضم كنيستنا عائلات من خلفيات كثيرة، والإنجليزية مستخدمة في جميع صلواتنا.",
    "Where should I sit?": "أين أجلس؟",
    "Anywhere you are comfortable. In some Coptic churches, men and women traditionally sit on separate sides. If you notice this, feel free to follow it, but no one will mind either way.": "في أي مكان تشعر فيه بالراحة. في بعض الكنائس القبطية يجلس الرجال والسيدات تقليديًا في جانبين منفصلين. إن لاحظت ذلك فلك أن تتبعه، ولن يمانع أحد في الحالتين.",
    "Can I take part if I’m not Orthodox?": "هل أستطيع المشاركة إن لم أكن أرثوذكسيًا؟",
    "Yes. Pray, sing, and listen with us. Holy Communion is reserved for Orthodox Christians, but everyone may receive the blessed bread (eulogia) at the end, and anyone may ask the priest for a blessing.": "نعم. صلِّ ورتّل واستمع معنا. التناول خاص بالمسيحيين الأرثوذكس، لكن يمكن للجميع أخذ اللقمة المباركة في النهاية، ولأي شخص أن يطلب البركة من الكاهن.",
    "How do I become Orthodox?": "كيف أصبح أرثوذكسيًا؟",
    "Start by coming to services and speaking with Fr. Domadious. Adults exploring Orthodoxy usually attend a period of instruction (catechesis) before being received into the Church.": "ابدأ بحضور الصلوات والتحدث مع أبونا دوماديوس. عادةً يحضر البالغون فترة تعليم (موعوظين) قبل قبولهم في الكنيسة.",
    "Is there something for my children?": "هل يوجد شيء لأطفالي؟",
    "Yes. Sunday School classes meet for children and teens. See": "نعم. تجتمع فصول مدارس الأحد للأطفال والمراهقين. راجع",
    "Sunday School": "مدارس الأحد",
    "for ages and times.": "للأعمار والمواعيد.",
    "Can I watch before visiting?": "هل أستطيع المشاهدة قبل الزيارة؟",
    "Of course. Most of our services stream live on": "بالتأكيد. معظم صلواتنا تُبث مباشرة على",
    "YouTube": "يوتيوب",
    ", and past sermons are in our": "، والعظات السابقة متاحة في",
    "Sermon Library": "مكتبة العظات",
    "Planning to Come?": "تنوي الحضور؟",
    "Let us know you’re coming": "أخبرنا بقدومك",
    "We’ll have someone ready to greet you, show you around, and answer questions. Totally optional.": "سيكون هناك من يستقبلك ويعرّفك بالكنيسة ويجيب عن أسئلتك. هذا اختياري تمامًا.",
    "Name": "الاسم",
    "Email": "البريد الإلكتروني",
    "Which Sunday?": "أي يوم أحد؟",
    "How many are coming?": "كم عدد الحاضرين؟",
    "Just me": "أنا فقط",
    "5 or more": "5 أو أكثر",
    "Anything we should know? (optional)": "هل هناك ما يجب أن نعرفه؟ (اختياري)",
    "Send": "إرسال",
    "A young parish with ancient roots": "كنيسة حديثة بجذور عريقة",
    "St. Mary was founded in 2020 to serve the Washington D.C. metropolitan area, carrying forward a faith first preached in Alexandria by St. Mark the Apostle.": "تأسست كنيسة العذراء مريم عام 2020 لتخدم منطقة واشنطن العاصمة الكبرى، حاملةً الإيمان الذي بشّر به القديس مرقس الرسول أولًا في الإسكندرية.",
    "Our Diocese": "إيبارشيتنا",
    "Our Roots": "جذورنا",
    "Photo: Church exterior": "صورة: مبنى الكنيسة من الخارج",
    "Founded in 2020 for the D.C. area": "تأسست عام 2020 لخدمة منطقة واشنطن",
    "In 2020, St. Mary Coptic Orthodox Church of Washington D.C. was established to serve Coptic Orthodox families and all who seek Christ across the capital region.": "في عام 2020 تأسست كنيسة السيدة العذراء مريم القبطية الأرثوذكسية بواشنطن لتخدم العائلات القبطية الأرثوذكسية وكل من يطلب المسيح في منطقة العاصمة.",
    "From our home at 5910 Goldsboro Road in Bethesda, we gather for the Divine Liturgy, raise our children in the faith, study the Scriptures, and serve our neighbors. What began as a small community has grown into a parish family.": "من مقرّنا في 5910 Goldsboro Road في بيثيسدا نجتمع للقداس الإلهي، ونربّي أولادنا في الإيمان، وندرس الكتاب المقدس، ونخدم جيراننا. ما بدأ جماعة صغيرة صار عائلة كنسية.",
    "Our patron is St. Mary, the Theotokos, the Mother of God, whom the Coptic Church honors above all saints and whose Holy Family once found refuge in Egypt.": "شفيعتنا هي السيدة العذراء مريم، والدة الإله، التي تكرّمها الكنيسة القبطية فوق جميع القديسين، والتي لجأت العائلة المقدسة معها إلى مصر.",
    "“…to do justly, to love mercy, and to walk humbly with your God.”": "«…أن تصنع الحق وتحب الرحمة وتسلك متواضعًا مع إلهك.»",
    "Micah 6:8 · Our parish verse": "ميخا ٦: ٨ · آية كنيستنا",
    "What We Hold Dear": "ما نعتز به",
    "Our values": "قيمنا",
    "We proclaim Jesus Christ, the incarnate Son of God, who died and rose for the life of the world.": "نبشّر بيسوع المسيح، ابن الله المتجسد، الذي مات وقام من أجل حياة العالم.",
    "Love for God is shown in love for one another, in our parish and far beyond it.": "محبة الله تظهر في محبتنا بعضنا لبعض، داخل كنيستنا وخارجها.",
    "Following the One who came “not to be served, but to serve,” every member has a place to give.": "على مثال مَن جاء «لا ليُخدَم بل ليَخدِم»، لكل عضو مكان يعطي فيه.",
    "Every nation welcome": "كل الأمم مرحَّب بها",
    "We openly welcome people of every race and nationality into the life of the Church.": "نرحّب بمحبة بالناس من كل عرق وجنسية في حياة الكنيسة.",
    "Fr. Domadious has served St. Mary since August 2020, shepherding the parish from its very first days.": "يخدم أبونا دوماديوس كنيسة العذراء مريم منذ أغسطس 2020، راعيًا لها منذ أيامها الأولى.",
    "Ordained to the priesthood in 1999, Fr. Domadious has served Coptic communities on three continents, in Giza, Egypt; in Amsterdam, the Netherlands; and in Virginia, before coming to St. Mary.": "سيم أبونا دوماديوس كاهنًا عام 1999، وخدم جماعات قبطية في ثلاث قارات: في الجيزة بمصر، وأمستردام بهولندا، وفيرجينيا، قبل أن يأتي إلى كنيسة العذراء مريم.",
    "Before his ordination he earned a medical degree from Cairo University, and he brings a physician’s care to his pastoral ministry of confession, counsel, and visiting the sick.": "قبل سيامته حصل على بكالوريوس الطب من جامعة القاهرة، ويحمل عناية الطبيب إلى خدمته الرعوية في الاعتراف والإرشاد وافتقاد المرضى.",
    "Giza · Amsterdam · Virginia": "الجيزة · أمستردام · فيرجينيا",
    "Education": "التعليم",
    "Request an Appointment": "اطلب موعدًا",
    "Watch His Sermons": "شاهد عظاته",
    "Part of a worldwide Church": "جزء من كنيسة ممتدة في العالم",
    "St. Mary is a parish of the Coptic Orthodox Diocese of Pennsylvania, Delaware, Maryland, West Virginia and its territories.": "كنيسة العذراء مريم تتبع إيبارشية بنسلفانيا وديلاوير وميريلاند وويست فيرجينيا وتوابعها للأقباط الأرثوذكس.",
    "Photo: H.G. Bishop Karas": "صورة: نيافة الأنبا كاراس",
    "Our Bishop": "أسقفنا",
    "His Grace Bishop Karas": "نيافة الأنبا كاراس",
    "His Grace shepherds the parishes of the diocese, which serves Coptic Orthodox communities across Pennsylvania, Delaware, Maryland, West Virginia and its territories.": "يرعى نيافته كنائس الإيبارشية التي تخدم الجماعات القبطية الأرثوذكسية في بنسلفانيا وديلاوير وميريلاند وويست فيرجينيا وتوابعها.",
    "Visit copticpa.org": "زُر copticpa.org",
    "Photo: H.H. Pope Tawadros II": "صورة: قداسة البابا تواضروس الثاني",
    "Our Patriarch": "بطريركنا",
    "His Holiness Pope Tawadros II": "قداسة البابا تواضروس الثاني",
    "Pope of Alexandria and Patriarch of the See of St. Mark, and the 118th successor of St. Mark the Apostle, leading the Coptic Orthodox Church throughout the world.": "بابا الإسكندرية وبطريرك الكرازة المرقسية، والخليفة الـ118 للقديس مرقس الرسول، يقود الكنيسة القبطية الأرثوذكسية في العالم كله.",
    "About the Coptic Church": "عن الكنيسة القبطية",
    "From St. Mark in Alexandria to Bethesda": "من القديس مرقس في الإسكندرية إلى بيثيسدا",
    "Two thousand years of faith, handed down from generation to generation.": "ألفا عام من الإيمان، مُسلَّم من جيل إلى جيل.",
    "c. AD 42–61": "نحو 42–61 م",
    "St. Mark in Alexandria": "مار مرقس في الإسكندرية",
    "St. Mark the Apostle preaches the Gospel in Alexandria. His first convert, the shoemaker Anianus, becomes the city’s bishop after him.": "يبشّر القديس مرقس الرسول بالإنجيل في الإسكندرية. وأول من آمن على يديه، الإسكافي إنيانوس، يصير أسقف المدينة من بعده.",
    "AD 68": "68 م",
    "Martyrdom of St. Mark": "استشهاد مار مرقس",
    "St. Mark is martyred in Alexandria. The Church he founded becomes the See of St. Mark.": "يستشهد القديس مرقس في الإسكندرية، وتصير الكنيسة التي أسسها الكرازة المرقسية.",
    "2nd century": "القرن الثاني",
    "School of Alexandria": "مدرسة الإسكندرية",
    "The Catechetical School of Alexandria becomes a great center of Christian learning, forming teachers such as Clement and Origen.": "تصير مدرسة الإسكندرية اللاهوتية مركزًا عظيمًا للتعليم المسيحي، وتخرّج معلمين مثل إكليمندس وأوريجانوس.",
    "AD 284": "284 م",
    "The Era of the Martyrs": "عصر الشهداء",
    "Under Emperor Diocletian, countless Egyptian Christians are martyred. The Coptic calendar counts its years from this time (Anno Martyrum).": "في عهد الإمبراطور دقلديانوس يستشهد عدد لا يُحصى من المسيحيين المصريين، ويبدأ التقويم القبطي حساب سنينه من ذلك الوقت (تقويم الشهداء).",
    "4th century": "القرن الرابع",
    "Birth of monasticism": "نشأة الرهبنة",
    "St. Anthony the Great goes out into the Egyptian desert, and St. Pachomius founds communal monasteries, a way of life that spreads worldwide.": "يخرج القديس الأنبا أنطونيوس الكبير إلى البرية المصرية، ويؤسس القديس الأنبا باخوميوس أديرة الشركة، وتنتشر هذه الحياة في العالم كله.",
    "AD 325": "325 م",
    "Council of Nicaea": "مجمع نيقية",
    "St. Athanasius of Alexandria defends the full divinity of Christ. The Nicene Creed is still prayed in every Liturgy.": "يدافع القديس أثناسيوس الرسولي عن كمال لاهوت المسيح. وما زال قانون الإيمان النيقاوي يُتلى في كل قداس.",
    "AD 431": "431 م",
    "St. Mary, Theotokos": "العذراء مريم والدة الإله",
    "At the Council of Ephesus, led by St. Cyril of Alexandria, the Church confirms that St. Mary is rightly called Theotokos, the Mother of God.": "في مجمع أفسس، برئاسة القديس كيرلس السكندري، تؤكد الكنيسة أن العذراء مريم تُدعى بحق ثيؤطوكوس، أي والدة الإله.",
    "20th century": "القرن العشرون",
    "Coptic churches in America": "الكنائس القبطية في أمريكا",
    "Coptic immigrants establish the first churches in North America, and parishes multiply across the United States.": "يؤسس المهاجرون الأقباط أولى الكنائس في أمريكا الشمالية، وتتكاثر الكنائس في أنحاء الولايات المتحدة.",
    "Pope Tawadros II": "البابا تواضروس الثاني",
    "H.H. Pope Tawadros II is enthroned as the 118th Pope of Alexandria and Patriarch of the See of St. Mark.": "يُجلَس قداسة البابا تواضروس الثاني بابا الإسكندرية الـ118 وبطريرك الكرازة المرقسية.",
    "St. Mary, Washington D.C.": "العذراء مريم، واشنطن العاصمة",
    "St. Mary Coptic Orthodox Church is founded in Bethesda to serve the capital region, with Fr. Domadious serving from August 2020.": "تأسيس كنيسة العذراء مريم القبطية الأرثوذكسية في بيثيسدا لخدمة منطقة العاصمة، ويخدمها أبونا دوماديوس منذ أغسطس 2020.",
    "Use the arrows, swipe, or scroll sideways to travel through time.": "استخدم الأسهم أو اسحب جانبيًا لتتنقّل عبر الزمن.",
    "Come, let us worship": "هلمّوا نسجد",
    "Services, the live stream, sermons, and everything happening in the life of our parish.": "الصلوات والبث المباشر والعظات، وكل ما يحدث في حياة كنيستنا.",
    "Service Schedule": "جدول الصلوات",
    "Live Stream": "البث المباشر",
    "Calendar": "التقويم",
    "Weekly Services": "الصلوات الأسبوعية",
    "Service schedule": "جدول الصلوات",
    "All services are at 5910 Goldsboro Rd, Bethesda.": "جميع الصلوات في 5910 Goldsboro Rd، بيثيسدا.",
    "Weekly service schedule": "جدول الصلوات الأسبوعي",
    "Service": "الصلاة",
    "Day": "اليوم",
    "Time": "الوقت",
    "Notes": "ملاحظات",
    "Matins, Raising of Morning Incense, and the Liturgy. English, Arabic & Coptic. Streamed live.": "صلاة باكر ورفع بخور باكر والقداس. بالإنجليزية والعربية والقبطية. بث مباشر.",
    "A shorter weekday Liturgy.": "قداس أقصر في منتصف الأسبوع.",
    "Led by Fr. Domadious, followed by fellowship. Streamed live.": "يقودها أبونا دوماديوس، تليها شركة. بث مباشر.",
    "Raising of Evening Incense, then the Tasbeha hymns.": "رفع بخور عشية، ثم ألحان التسبحة.",
    "Confession": "الاعتراف",
    "By appointment": "بموعد مسبق",
    "Request a time": "اطلب موعدًا",
    "with Fr. Domadious.": "مع أبونا دوماديوس.",
    "During fasting seasons and feasts, the schedule changes. Check the": "يتغير الجدول في مواسم الأصوام والأعياد. راجع",
    "calendar": "التقويم",
    "below.": "أدناه.",
    "Pray with us from anywhere": "صلِّ معنا من أي مكان",
    "For the sick, the homebound, travelers, and those far from home: our Liturgies and Bible studies stream live on YouTube.": "للمرضى وغير القادرين على الخروج والمسافرين والبعيدين عن بيوتهم: قداساتنا ودراسات الكتاب المقدس تُبث مباشرة على يوتيوب.",
    "When a service is live, the player here will show it automatically. Between services you’ll see our most recent broadcast.": "عند بث صلاة مباشرة ستظهر هنا تلقائيًا. وبين الصلوات سترى آخر بث.",
    "Subscribe": "اشترك",
    "Sermons & Bible studies": "العظات ودراسات الكتاب",
    "Browse past teaching by topic.": "تصفّح التعاليم السابقة حسب الموضوع.",
    "All": "الكل",
    "Feasts & Fasts": "الأعياد والأصوام",
    "Family": "الأسرة",
    "Saints": "القديسون",
    "A Home That Prays Together": "بيت يصلي معًا",
    "Fr. Domadious Sarabamoun · 35 min": "أبونا دوماديوس سرابامون · 35 دقيقة",
    "St. Mary, the Theotokos": "العذراء مريم والدة الإله",
    "Fr. Domadious Sarabamoun · 29 min": "أبونا دوماديوس سرابامون · 29 دقيقة",
    "Prayer with the Agpeya": "الصلاة بالأجبية",
    "Fr. Domadious Sarabamoun · 41 min": "أبونا دوماديوس سرابامون · 41 دقيقة",
    "Why We Fast": "لماذا نصوم",
    "Fr. Domadious Sarabamoun · 33 min": "أبونا دوماديوس سرابامون · 33 دقيقة",
    "The Book of Micah": "سفر ميخا",
    "Friday Bible Study · 48 min": "دراسة الجمعة · 48 دقيقة",
    "St. Anthony and the Desert Fathers": "الأنبا أنطونيوس وآباء البرية",
    "Fr. Domadious Sarabamoun · 36 min": "أبونا دوماديوس سرابامون · 36 دقيقة",
    "See All Videos on YouTube": "كل الفيديوهات على يوتيوب",
    "Parish Calendar": "تقويم الكنيسة",
    "What’s happening": "ماذا يحدث",
    "Services, feasts, and parish events.": "الصلوات والأعياد وأنشطة الكنيسة.",
    "October 2026": "أكتوبر 2026",
    "Month": "شهر",
    "List": "قائمة",
    "Sun": "الأحد",
    "Mon": "الاثنين",
    "Tue": "الثلاثاء",
    "Wed": "الأربعاء",
    "Thu": "الخميس",
    "Fri": "الجمعة",
    "Sat": "السبت",
    "Youth Meeting · 7:30 PM": "اجتماع الشباب · 7:30 م",
    "Bible Study · 7:30 PM": "دراسة الكتاب · 7:30 م",
    "Vespers & Tasbeha · 6 PM": "عشية وتسبحة · 6 م",
    "Divine Liturgy · 8 AM": "القداس الإلهي · 8 ص",
    "Midweek Liturgy · 7 AM": "قداس منتصف الأسبوع · 7 ص",
    "Parish Family Picnic · 12:00 PM": "رحلة العائلات · 12:00 م",
    "1 Paopi: new Coptic month": "1 بابه: بداية شهر قبطي",
    "Servants’ Retreat · 9:00 AM": "خلوة الخدام · 9:00 ص",
    "Food Drive · 10:00 AM": "حملة جمع الطعام · 10:00 ص",
    "Newcomers’ Lunch · After Liturgy": "غداء القادمين الجدد · بعد القداس",
    "Servants’ Retreat": "خلوة الخدام",
    "Saturday · 9:00 AM · Church hall": "السبت · 9:00 ص · قاعة الكنيسة",
    "Food Drive": "حملة جمع الطعام",
    "Saturday · 10:00 AM · Parking lot": "السبت · 10:00 ص · ساحة الانتظار",
    "Newcomers’ Lunch": "غداء القادمين الجدد",
    "Sunday · After Liturgy · Fellowship Hall": "الأحد · بعد القداس · قاعة الكنيسة",
    "Weekly": "أسبوعيًا",
    "Regular services": "الصلوات المنتظمة",
    "Sun Liturgy · Wed Liturgy · Fri Bible Study · Sat Vespers & Tasbeha": "قداس الأحد · قداس الأربعاء · دراسة الجمعة · عشية وتسبحة السبت",
    "Schedule": "الجدول",
    "Weekly services": "صلوات أسبوعية",
    "Event": "نشاط",
    "Parish events": "أنشطة الكنيسة",
    "Feast": "عيد",
    "Feasts & fasts": "أعياد وأصوام",
    "All events are samples. Live events will sync from CCB.": "جميع الأنشطة تجريبية. ستُحدَّث الأنشطة الفعلية من CCB.",
    "Open CCB Calendar": "افتح تقويم CCB",
    "A place for every member": "مكان لكل عضو",
    "From the youngest children to our elders, there is a place to learn, to grow, and to serve at St. Mary.": "من أصغر الأطفال إلى كبارنا، هناك مكان للتعلّم والنمو والخدمة في كنيسة العذراء مريم.",
    "Youth": "الشباب",
    "College & Young Adults": "الجامعيون والشباب",
    "Servants": "الخدام",
    "Outreach": "خدمة المجتمع",
    "Grow Together": "لننمُ معًا",
    "Our ministries": "خدماتنا",
    "Meeting times, places, and leaders are placeholders.": "مواعيد الاجتماعات وأماكنها وقادتها مؤقتة.",
    "Bible stories, saints, hymns, and the life of the Church, taught by caring servants and grouped by age, from pre-K through high school.": "قصص الكتاب المقدس والقديسين والألحان وحياة الكنيسة، يقدّمها خدام محبّون في فصول حسب العمر، من الحضانة حتى المرحلة الثانوية.",
    "Who": "لمن",
    "Ages 4–18, by grade": "من 4 إلى 18 سنة، حسب الصف",
    "When": "متى",
    "Sundays after Communion": "الأحد بعد التناول",
    "Where": "أين",
    "Classrooms": "الفصول",
    "Register a Child": "سجّل طفلك",
    "Middle and high schoolers gather for honest conversation about faith and life, service projects, retreats, and friendship rooted in Christ.": "يجتمع طلاب الإعدادي والثانوي لحوار صادق عن الإيمان والحياة، ومشروعات خدمة، وخلوات، وصداقة متأصلة في المسيح.",
    "Grades 6–12": "الصفوف 6–12",
    "Fridays, 7:30 PM": "الجمعة، 7:30 م",
    "Fellowship Hall": "قاعة الكنيسة",
    "Get Involved": "شارك معنا",
    "For students at D.C.-area universities and young professionals starting out in the capital region: Bible study, fellowship, and a spiritual home away from home.": "لطلاب جامعات منطقة واشنطن والشباب في بداية حياتهم العملية: دراسة الكتاب المقدس، وشركة، وبيت روحي بعيدًا عن البيت.",
    "Ages 18–30s": "من 18 سنة إلى الثلاثينات",
    "Biweekly, weeknight": "كل أسبوعين، مساء يوم عمل",
    "Church hall & online": "قاعة الكنيسة وأونلاين",
    "Join the Group": "انضم إلى المجموعة",
    "Servants’ Meeting": "اجتماع الخدام",
    "Formation and prayer for Sunday School teachers, youth leaders, deacons, and all who serve, so that we give from what we have first received.": "إعداد وصلاة لخدام مدارس الأحد وقادة الشباب والشمامسة وكل الخدام، لكي نعطي مما أخذناه أولًا.",
    "All parish servants": "جميع خدام الكنيسة",
    "Monthly": "شهريًا",
    "Church hall": "قاعة الكنيسة",
    "Become a Servant": "كن خادمًا",
    "Fr. Domadious leads an in-depth study of the Scriptures through the eyes of the Church Fathers. Open to all, in person and on the live stream.": "يقود أبونا دوماديوس دراسة متعمقة للكتاب المقدس بعيون آباء الكنيسة. مفتوحة للجميع، حضوريًا وعبر البث المباشر.",
    "Everyone": "الجميع",
    "Church & YouTube": "الكنيسة ويوتيوب",
    "Watch Past Studies": "شاهد الدراسات السابقة",
    "Family Meeting": "اجتماع الأسرة",
    "For married couples and parents: raising children in the faith, strengthening marriages, and building friendships between families.": "للأزواج والآباء والأمهات: تربية الأبناء في الإيمان، وتقوية الزواج، وبناء صداقات بين العائلات.",
    "Couples & parents": "الأزواج والوالدون",
    "Learn More": "اعرف المزيد",
    "Outreach & service": "الخدمة والعطاء",
    "“Inasmuch as you did it to one of the least of these My brethren, you did it to Me.” (Matthew 25:40)": "«بما أنكم فعلتموه بأحد إخوتي هؤلاء الأصاغر، فبي فعلتم» (متى ٢٥: ٤٠)",
    "Monthly meal packing and delivery with local shelters in Montgomery County and D.C.": "تجهيز وتوصيل وجبات شهرية مع الملاجئ في مقاطعة مونتغمري وواشنطن.",
    "Prayer visits and meals for parishioners in hospitals, nursing homes, and at home.": "زيارات صلاة ووجبات لأبناء الكنيسة في المستشفيات ودور الرعاية والبيوت.",
    "Helping new immigrant families settle in: housing tips, rides, and friendship.": "مساعدة العائلات المهاجرة حديثًا على الاستقرار: نصائح للسكن، وتوصيل، وصداقة.",
    "Join a ministry or volunteer": "انضم إلى خدمة أو تطوّع",
    "Tell us where you’d like to serve and a ministry leader will reach out.": "أخبرنا أين تحب أن تخدم، وسيتواصل معك أحد المسؤولين.",
    "Phone": "الهاتف",
    "I’m interested in": "أنا مهتم بـ",
    "Sunday School (registering a child)": "مدارس الأحد (تسجيل طفل)",
    "Serving in Sunday School": "الخدمة في مدارس الأحد",
    "Outreach & volunteering": "خدمة المجتمع والتطوع",
    "Not sure yet": "لم أحدد بعد",
    "Anything else?": "أي شيء آخر؟",
    "The faith once delivered to the saints": "الإيمان المُسلَّم مرة للقديسين",
    "An introduction to what the Coptic Orthodox Church believes, and how that faith shapes our prayer, our year, and our daily life.": "مقدمة عمّا تؤمن به الكنيسة القبطية الأرثوذكسية، وكيف يشكّل هذا الإيمان صلاتنا وسنتنا وحياتنا اليومية.",
    "Beliefs": "العقيدة",
    "Sacraments": "الأسرار",
    "Fasting": "الصوم",
    "Coptic Calendar": "التقويم القبطي",
    "The Agpeya": "الأجبية",
    "What We Believe": "بماذا نؤمن",
    "Orthodox, apostolic, ancient": "أرثوذكسية، رسولية، عريقة",
    "The Coptic Orthodox Church is the Church of Alexandria, founded by St. Mark the Apostle. “Copt” comes from the Greek word for Egyptian.": "الكنيسة القبطية الأرثوذكسية هي كنيسة الإسكندرية التي أسسها القديس مرقس الرسول. وكلمة «قبطي» مشتقة من الكلمة اليونانية التي تعني «مصري».",
    "Together with the Armenian, Syriac, Ethiopian, Eritrean, and Indian (Malankara) Orthodox Churches, we belong to the family of Oriental Orthodox Churches, which share one faith and communion.": "مع الكنائس الأرمنية والسريانية والإثيوبية والإريترية والهندية (المالانكارا) الأرثوذكسية، ننتمي إلى عائلة الكنائس الأرثوذكسية الشرقية التي تجمعها عقيدة واحدة وشركة واحدة.",
    "The Holy Trinity:": "الثالوث القدوس:",
    "one God in three Persons, Father, Son, and Holy Spirit.": "إله واحد في ثلاثة أقانيم، الآب والابن والروح القدس.",
    "The Incarnation:": "التجسد:",
    "Jesus Christ is fully God and fully man, one Lord, as St. Cyril of Alexandria taught: “one nature of God the Word incarnate,” without mingling, confusion, or change.": "يسوع المسيح إله كامل وإنسان كامل، رب واحد، كما علّم القديس كيرلس السكندري: «طبيعة واحدة لله الكلمة المتجسد»، بغير اختلاط ولا امتزاج ولا تغيير.",
    "Salvation:": "الخلاص:",
    "by God’s grace, received through faith, the sacraments, and a life of repentance and love.": "بنعمة الله، ننالها بالإيمان والأسرار وحياة التوبة والمحبة.",
    "Holy Scripture and Holy Tradition:": "الكتاب المقدس والتقليد المقدس:",
    "the Bible, read within the living teaching of the Church, the Councils, and the Fathers.": "الكتاب المقدس يُقرأ في ضوء تعليم الكنيسة الحي والمجامع والآباء.",
    "The communion of saints:": "شركة القديسين:",
    "we honor St. Mary the Theotokos, the martyrs, and all the saints, and ask their prayers.": "نكرّم العذراء مريم والدة الإله والشهداء وجميع القديسين، ونطلب صلواتهم.",
    "The Creed": "قانون الإيمان",
    "The Nicene Creed": "قانون الإيمان النيقاوي",
    "Formulated at the Councils of Nicaea (325), where St. Athanasius of Alexandria defended the faith, and Constantinople (381), the Creed is proclaimed in every Liturgy. It begins:": "وُضع في مجمع نيقية (325)، حيث دافع القديس أثناسيوس الرسولي عن الإيمان، ومجمع القسطنطينية (381)، ويُتلى في كل قداس. ويبدأ هكذا:",
    "“We believe in one God, God the Father, the Pantocrator, Creator of heaven and earth, and of all things seen and unseen…”": "«بالحقيقة نؤمن بإله واحد، الله الآب ضابط الكل، خالق السماء والأرض، ما يُرى وما لا يُرى…»",
    "The Holy Mysteries": "الأسرار المقدسة",
    "The seven sacraments": "أسرار الكنيسة السبعة",
    "Through the sacraments, the Holy Spirit gives the grace of God to the faithful at every stage of life.": "من خلال الأسرار يمنح الروح القدس نعمة الله للمؤمنين في كل مراحل الحياة.",
    "Baptism": "المعمودية",
    "New birth by water and the Spirit: full immersion, three times, in the name of the Holy Trinity.": "الميلاد الجديد من الماء والروح: بالتغطيس الكامل ثلاث مرات باسم الثالوث القدوس.",
    "Chrismation": "الميرون",
    "The seal of the gift of the Holy Spirit, given with the holy Myron immediately after Baptism.": "ختم موهبة الروح القدس، يُمنح بالميرون المقدس بعد المعمودية مباشرة.",
    "Eucharist": "الإفخارستيا",
    "Holy Communion: the true Body and Blood of Christ, the center of the Church’s life.": "التناول: جسد المسيح ودمه الحقيقيان، مركز حياة الكنيسة.",
    "Repentance & Confession": "التوبة والاعتراف",
    "Returning to God, confessing before a priest, and receiving absolution and guidance.": "الرجوع إلى الله، والاعتراف أمام الكاهن، ونوال الحِل والإرشاد.",
    "Unction of the Sick": "مسحة المرضى",
    "Prayer and anointing with oil for the healing of body and soul.": "صلاة ومسح بالزيت لشفاء الجسد والنفس.",
    "Matrimony": "الزيجة",
    "The crowning of husband and wife, united by God in one life of love.": "إكليل الزوج والزوجة، يوحّدهما الله في حياة واحدة من المحبة.",
    "Priesthood": "الكهنوت",
    "The ordination of bishops, priests, and deacons to serve the Church.": "سيامة الأساقفة والكهنة والشمامسة لخدمة الكنيسة.",
    "Preparing for a sacrament?": "تستعد لسرّ من الأسرار؟",
    "Baptisms, weddings, and confession are arranged with Fr. Domadious.": "تُرتَّب المعموديات والأكاليل والاعتراف مع أبونا دوماديوس.",
    "A Church that fasts": "كنيسة صائمة",
    "The Coptic Church keeps more fasting days than almost any other, over two hundred in a year.": "تحفظ الكنيسة القبطية أيام صوم أكثر من أي كنيسة تقريبًا، أكثر من مئتي يوم في السنة.",
    "Fasting means abstaining from all food for a period of the day, and then eating a vegan diet with no meat, dairy, or eggs. It is always joined to prayer, repentance, and giving to the poor. Fasting rules are adapted for children, the sick, and others under the guidance of one’s father of confession.": "الصوم هو الانقطاع عن الطعام فترة من اليوم، ثم تناول طعام نباتي خالٍ من اللحوم والألبان والبيض. ويقترن دائمًا بالصلاة والتوبة والعطاء للفقراء. وتُكيَّف قواعد الصوم للأطفال والمرضى وغيرهم بإرشاد أب الاعتراف.",
    "When a fast is under way, you’ll see a banner at the top of every page of this site.": "أثناء أي صوم سيظهر شريط في أعلى كل صفحات الموقع.",
    "Fasts of the Coptic Church": "أصوام الكنيسة القبطية",
    "Fast": "الصوم",
    "Length": "المدة",
    "Wednesdays & Fridays": "الأربعاء والجمعة",
    "All year, except the 50 days after Easter": "طوال السنة، ما عدا الخمسين يومًا بعد القيامة",
    "Nativity Fast": "صوم الميلاد",
    "43 days": "43 يومًا",
    "Nov 25 – Jan 6": "25 نوفمبر – 6 يناير",
    "Jonah’s Fast": "صوم يونان",
    "3 days": "3 أيام",
    "Two weeks before Great Lent": "قبل الصوم الكبير بأسبوعين",
    "Great Lent & Holy Week": "الصوم الكبير وأسبوع الآلام",
    "55 days": "55 يومًا",
    "Before the Feast of the Resurrection": "قبل عيد القيامة",
    "Apostles’ Fast": "صوم الرسل",
    "Varies": "تختلف",
    "After Pentecost until July 12": "من بعد العنصرة حتى 12 يوليو",
    "St. Mary’s Fast": "صوم العذراء",
    "15 days": "15 يومًا",
    "Aug 7 – 21": "7 – 21 أغسطس",
    "Paramoun": "البرامون",
    "1–3 days": "1–3 أيام",
    "Eves of Nativity & Theophany": "ليلة عيدي الميلاد والغطاس",
    "Keeping Time": "حساب الزمن",
    "The Coptic calendar": "التقويم القبطي",
    "The Church counts its years": "تحسب الكنيسة سنينها",
    "Anno Martyrum": "بتقويم الشهداء",
    "(A.M.), the “Year of the Martyrs,” beginning in AD 284 to honor those who died under Emperor Diocletian.": "(ش)، ويبدأ عام 284 م تكريمًا لمن استشهدوا في عهد الإمبراطور دقلديانوس.",
    "The calendar descends from the ancient Egyptian one. It has twelve months of thirty days each, plus a short thirteenth month of five or six days. The new year, the Feast of the": "هذا التقويم مأخوذ عن التقويم المصري القديم، وفيه اثنا عشر شهرًا كل منها ثلاثون يومًا، وشهر ثالث عشر قصير من خمسة أو ستة أيام. ورأس السنة، عيد",
    "Nayrouz": "النيروز",
    ", falls on September 11 (or 12 in the year before a Gregorian leap year).": "، يوافق 11 سبتمبر (أو 12 في السنة التي تسبق السنة الكبيسة الميلادية).",
    "Feasts, fasts, and the daily readings (the": "الأعياد والأصوام والقراءات اليومية (",
    "Katameros": "القطمارس",
    ") and saints (the": ") والقديسون (",
    "Synaxarium": "السنكسار",
    ") all follow this calendar. See today’s Coptic date on our": ") كلها تتبع هذا التقويم. شاهد التاريخ القبطي لليوم في",
    "home page": "الصفحة الرئيسية",
    "The thirteen Coptic months and their usual Gregorian start dates": "الشهور القبطية الثلاثة عشر وبداياتها المعتادة بالتقويم الميلادي",
    "Coptic": "بالقبطية",
    "Begins": "يبدأ",
    "Thout": "توت",
    "Sep 11": "11 سبتمبر",
    "Paopi": "بابه",
    "Oct 11": "11 أكتوبر",
    "Hathor": "هاتور",
    "Nov 10": "10 نوفمبر",
    "Koiak": "كيهك",
    "Dec 10": "10 ديسمبر",
    "Tobi": "طوبة",
    "Jan 9": "9 يناير",
    "Meshir": "أمشير",
    "Feb 8": "8 فبراير",
    "Paremhat": "برمهات",
    "Mar 10": "10 مارس",
    "Parmouti": "برمودة",
    "Apr 9": "9 أبريل",
    "Pashons": "بشنس",
    "May 9": "9 مايو",
    "Paoni": "بؤونة",
    "Jun 8": "8 يونيو",
    "Epip": "أبيب",
    "Jul 8": "8 يوليو",
    "Mesori": "مسرى",
    "Aug 7": "7 أغسطس",
    "Nasie": "النسيء",
    "Sep 6": "6 سبتمبر",
    "Praying the hours": "صلوات السواعي",
    "The Agpeya (from the Coptic word for “hour”) is the Coptic book of hours. Each hour of prayer remembers a moment in the life of Christ, with psalms, a Gospel reading, and prayers.": "الأجبية (من الكلمة القبطية التي تعني «ساعة») هي كتاب صلوات السواعي القبطي. كل ساعة صلاة تذكّرنا بلحظة من حياة المسيح، بمزامير وإنجيل وقطع وتحاليل.",
    "Prime": "باكر",
    "~6 AM": "~6 ص",
    "First Hour": "صلاة باكر",
    "The Resurrection of Christ, the true Light, at the start of the day.": "قيامة المسيح، النور الحقيقي، في بداية اليوم.",
    "Terce": "الثالثة",
    "~9 AM": "~9 ص",
    "Third Hour": "الساعة الثالثة",
    "The descent of the Holy Spirit at Pentecost, and Christ’s trial before Pilate.": "حلول الروح القدس يوم الخمسين، ومحاكمة المسيح أمام بيلاطس.",
    "Sext": "السادسة",
    "~12 PM": "~12 ظهرًا",
    "Sixth Hour": "الساعة السادسة",
    "The Crucifixion of our Lord.": "صلب ربنا.",
    "None": "التاسعة",
    "~3 PM": "~3 م",
    "Ninth Hour": "الساعة التاسعة",
    "The death of Christ on the Cross for our salvation.": "موت المسيح على الصليب لأجل خلاصنا.",
    "Vespers": "الغروب",
    "~5 PM": "~5 م",
    "Eleventh Hour": "الساعة الحادية عشرة",
    "The taking down of Christ’s body from the Cross.": "إنزال جسد المسيح من على الصليب.",
    "Compline": "النوم",
    "~6 PM": "~6 م",
    "Twelfth Hour": "الساعة الثانية عشرة",
    "The burial of Christ, and preparing our souls for sleep.": "دفن المسيح، وإعداد نفوسنا للنوم.",
    "Midnight": "نصف الليل",
    "Midnight Prayer": "صلاة نصف الليل",
    "Three watches awaiting the Second Coming of Christ, the Bridegroom.": "ثلاث خدمات في انتظار المجيء الثاني للمسيح العريس.",
    "Veil": "الستار",
    "Prayer of the Veil": "صلاة الستار",
    "A prayer of self-examination, traditionally prayed by monastics.": "صلاة لمحاسبة النفس، يصليها الرهبان تقليديًا.",
    "Pray the Agpeya Online": "صلِّ الأجبية أونلاين",
    "Offer with a cheerful heart": "قدِّم بقلب مسرور",
    "Your offerings sustain our worship, form our children in the faith, and carry Christ’s love to our neighbors.": "تقدماتكم تسند عبادتنا، وتنشئ أولادنا في الإيمان، وتحمل محبة المسيح إلى جيراننا.",
    "“Let each one give as he purposes in his heart, not grudgingly or of necessity; for God loves a cheerful giver.”": "«كل واحد كما ينوي بقلبه، ليس عن حزن أو اضطرار. لأن المعطي المسرور يحبه الله.»",
    "2 Corinthians 9:7": "٢ كورنثوس ٩: ٧",
    "Give online": "تبرّع إلكترونيًا",
    "Secure one-time or recurring gifts by card or bank transfer.": "تبرعات آمنة لمرة واحدة أو متكررة بالبطاقة أو التحويل البنكي.",
    "Give via Pushpay": "تبرّع عبر Pushpay",
    "Where Your Gift Goes": "أين يذهب عطاؤك",
    "Choose a fund": "اختر صندوقًا",
    "Give to where the need is greatest, or direct your gift to a specific ministry.": "تبرّع حيث الاحتياج الأكبر، أو وجّه عطاءك إلى خدمة محددة.",
    "General Fund": "الصندوق العام",
    "Tithes and offerings that support worship, clergy, and the daily life of the parish.": "العشور والتقدمات التي تسند العبادة والآباء الكهنة والحياة اليومية للكنيسة.",
    "Other": "أخرى",
    "Give to General": "تبرّع للصندوق العام",
    "Building Fund": "صندوق المبنى",
    "Helping St. Mary build and care for a lasting spiritual home in the D.C. area.": "لمساعدة كنيسة العذراء مريم على بناء بيت روحي دائم ورعايته في منطقة واشنطن.",
    "Give to Building": "تبرّع لصندوق المبنى",
    "Meals for the hungry, help for newcomers, and support for families in need.": "وجبات للجياع، ومساعدة للقادمين الجدد، ودعم للأسر المحتاجة.",
    "Give to Outreach": "تبرّع لخدمة المجتمع",
    "Curriculum, supplies, retreats, and activities for our children and youth.": "مناهج وأدوات وخلوات وأنشطة لأطفالنا وشبابنا.",
    "Give to Sunday School": "تبرّع لمدارس الأحد",
    "Other Ways to Give": "طرق أخرى للعطاء",
    "Text, scan, or mail": "رسالة نصية أو مسح رمز أو بريد",
    "Text to give": "التبرع برسالة نصية",
    "Text an amount, like": "أرسل المبلغ، مثل",
    ", to our giving number. First-time givers get a secure link to finish setting up.": "، إلى رقم التبرعات. من يتبرع لأول مرة يصله رابط آمن لإكمال الإعداد.",
    "Scan to give": "امسح للتبرع",
    "Point your phone’s camera at the code to open our giving page. You’ll also find it printed in the church.": "وجّه كاميرا هاتفك إلى الرمز لفتح صفحة التبرع. ستجده أيضًا مطبوعًا في الكنيسة.",
    "By check": "بشيك",
    "Make checks payable to": "تُحرَّر الشيكات باسم",
    "and place them in the offering box or mail them to:": "وتوضع في صندوق التقدمات أو تُرسل بالبريد إلى:",
    "About giving": "عن العطاء",
    "Is my gift tax-deductible?": "هل تبرعي معفى من الضرائب؟",
    "St. Mary is a non-profit church, and gifts are generally tax-deductible as allowed by law.": "كنيسة العذراء مريم كنيسة غير ربحية، والتبرعات عادةً معفاة من الضرائب وفقًا للقانون.",
    "How do I get a giving statement?": "كيف أحصل على كشف بتبرعاتي؟",
    "Members can view and download their giving history any time by signing in to": "يمكن للأعضاء عرض سجل تبرعاتهم وتنزيله في أي وقت بتسجيل الدخول إلى",
    ". Year-end statements are also emailed each January.": ". وتُرسل كشوف نهاية العام بالبريد الإلكتروني كل يناير.",
    "Can I set up recurring giving?": "هل يمكنني إعداد تبرع متكرر؟",
    "Yes. Choose “recurring” in the Pushpay form to give weekly, every two weeks, or monthly. You can change or stop it any time.": "نعم. اختر «متكرر» في نموذج Pushpay للتبرع أسبوعيًا أو كل أسبوعين أو شهريًا. ويمكنك تعديله أو إيقافه في أي وقت.",
    "Is online giving secure?": "هل التبرع الإلكتروني آمن؟",
    "Online gifts are processed by Pushpay, a payment provider used by many churches. St. Mary never sees or stores your full card or bank details.": "تتم معالجة التبرعات الإلكترونية عبر Pushpay، وهي خدمة دفع تستخدمها كنائس كثيرة. ولا ترى كنيسة العذراء مريم بيانات بطاقتك أو حسابك البنكي كاملة ولا تحتفظ بها.",
    "We’d love to hear from you": "يسعدنا أن نسمع منك",
    "Questions, prayer requests, confession, or a pastoral visit: reach out and we’ll respond as soon as we can.": "أسئلة، أو طلبات صلاة، أو اعتراف، أو افتقاد: تواصل معنا وسنرد في أقرب وقت.",
    "Find Us": "موقعنا",
    "Send a Message": "أرسل رسالة",
    "Confession & Appointments": "الاعتراف والمواعيد",
    "Address": "العنوان",
    "Office hours": "مواعيد المكتب",
    "Message on Facebook": "راسلنا على فيسبوك",
    "General questions": "أسئلة عامة",
    "Topic": "الموضوع",
    "General question": "سؤال عام",
    "Planning a visit": "الترتيب لزيارة",
    "Baptism or wedding": "معمودية أو إكليل",
    "Membership / CCB account": "العضوية / حساب CCB",
    "Website feedback": "ملاحظات عن الموقع",
    "Message": "الرسالة",
    "Send Message": "إرسال الرسالة",
    "Let us pray for you": "دعنا نصلي لأجلك",
    "“The effective, fervent prayer of a righteous man avails much.” (James 5:16)": "«طلبة البار تقتدر كثيرًا في فعلها» (يعقوب ٥: ١٦)",
    "Share your request and Fr. Domadious will remember it at the altar during the Liturgy. You may keep it private or ask that the congregation pray with you.": "شاركنا طلبتك وسيذكرها أبونا دوماديوس على المذبح أثناء القداس. يمكنك أن تبقيها خاصة أو تطلب أن تصلي الكنيسة معك.",
    "Your name": "اسمك",
    "Pray for": "صلِّ من أجل",
    "Prayer request": "طلب الصلاة",
    "Keep this private (seen by clergy only)": "اجعلها خاصة (يطّلع عليها الآباء الكهنة فقط)",
    "Submit Prayer Request": "أرسل طلب الصلاة",
    "Meet with Fr. Domadious": "قابل أبونا دوماديوس",
    "Request a time for confession, spiritual guidance, a home or hospital visit, or to arrange a baptism, wedding, or house blessing.": "اطلب موعدًا للاعتراف أو الإرشاد الروحي أو زيارة في البيت أو المستشفى، أو لترتيب معمودية أو إكليل أو تبريك منزل.",
    "Type of appointment": "نوع الموعد",
    "Spiritual guidance": "إرشاد روحي",
    "Home or hospital visit": "زيارة في البيت أو المستشفى",
    "Wedding / engagement": "إكليل / خطوبة",
    "House blessing": "تبريك منزل",
    "Preferred date": "التاريخ المفضّل",
    "Preferred time": "الوقت المفضّل",
    "Morning": "صباحًا",
    "Afternoon": "بعد الظهر",
    "Evening": "مساءً",
    "After a service": "بعد صلاة",
    "Notes (optional)": "ملاحظات (اختياري)",
    "Request Appointment": "اطلب الموعد",
    "Wedding": "إكليل",
    "Calendar view": "طريقة عرض التقويم",
    "Close menu": "إغلاق القائمة",
    "Current fasting season": "الصوم الحالي",
    "Earlier in the timeline": "أقدم في الخط الزمني",
    "Filter sermons by topic": "تصفية العظات حسب الموضوع",
    "Language": "اللغة",
    "Later in the timeline": "أحدث في الخط الزمني",
    "Main": "القائمة الرئيسية",
    "Map placeholder showing the church location at 5910 Goldsboro Rd, Bethesda": "خريطة مؤقتة توضح موقع الكنيسة في 5910 Goldsboro Rd، بيثيسدا",
    "Next month": "الشهر التالي",
    "On this page": "في هذه الصفحة",
    "Open menu": "فتح القائمة",
    "Previous month": "الشهر السابق",
    "St. Mary Coptic Orthodox Church, home": "كنيسة العذراء مريم، الصفحة الرئيسية",
    "St. Mary on Facebook": "كنيسة العذراء مريم على فيسبوك",
    "St. Mary on YouTube": "كنيسة العذراء مريم على يوتيوب",
    "Timeline of the Coptic Church, from the first century to 2020": "الخط الزمني للكنيسة القبطية من القرن الأول حتى 2020",
    "This would open Pushpay with the Building Fund selected. (TBD)": "هنا سيُفتح Pushpay مع اختيار صندوق المبنى. (لاحقًا)",
    "This would open Pushpay with the General Fund selected. (TBD)": "هنا سيُفتح Pushpay مع اختيار الصندوق العام. (لاحقًا)",
    "This would open Pushpay with the Outreach fund selected. (TBD)": "هنا سيُفتح Pushpay مع اختيار صندوق خدمة المجتمع. (لاحقًا)",
    "This would open Pushpay with the Sunday School fund selected. (TBD)": "هنا سيُفتح Pushpay مع اختيار صندوق مدارس الأحد. (لاحقًا)",
    "This would open the church’s Pushpay giving form. (Integration TBD)": "هنا سيُفتح نموذج التبرع عبر Pushpay. (الربط لاحقًا)",
    "Appointment scheduling tool (CCB, email, or a booking app) is TBD.": "أداة حجز المواعيد (CCB أو البريد أو تطبيق حجز) لم تُحدَّد بعد.",
    "Newsletter provider TBD.": "خدمة النشرة البريدية لم تُحدَّد بعد.",
    "Prayer request routing is TBD.": "جهة استلام طلبات الصلاة لم تُحدَّد بعد.",
    "Sign-ups will go through CCB groups/forms (TBD).": "سيتم التسجيل عبر مجموعات/نماذج CCB (لاحقًا).",
    "Visitor form handling (CCB form or email) TBD.": "طريقة استلام نموذج الزوار (CCB أو البريد) لم تُحدَّد بعد.",
    "Where messages go (church email or CCB form) is TBD.": "جهة استلام الرسائل (بريد الكنيسة أو CCB) لم تُحدَّد بعد.",
    "E.g. first time at an Orthodox church, bringing young kids, need accessible seating…": "مثلًا: أول مرة في كنيسة أرثوذكسية، معي أطفال صغار، أحتاج مقعدًا مناسبًا لذوي الإعاقة…",
    "First names only is fine": "يكفي الاسم الأول",
    "Optional": "اختياري",
    "There’s no need to share details of a confession here.": "لا داعي لذكر تفاصيل الاعتراف هنا."
  };

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }
  function tr(en) { return lang === "ar" && AR[norm(en)] ? AR[norm(en)] : en; }

  // Collect translatable text once, while the page is still in English.
  var SKIP = "script, style, svg, .tbd, [data-dynamic], [lang='ar'], [lang='cop'], .ar-notice, .toast";
  var textNodes = [];
  (function collect() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!/[A-Za-z]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return node.parentElement && node.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) textNodes.push({ node: n, en: n.nodeValue });
  })();

  var attrNodes = $$("[placeholder], [aria-label]").filter(function (el) {
    return !el.closest(".lang-toggle");
  }).map(function (el) {
    return { el: el, placeholder: el.getAttribute("placeholder"), label: el.getAttribute("aria-label") };
  });

  function translateText(en) {
    var key = norm(en);
    if (!AR[key]) return en;
    var lead = /^\s/.test(en) ? " " : "", trail = /\s$/.test(en) ? " " : "";
    return lead + AR[key] + trail;
  }

  function setLanguage(next, save) {
    lang = next === "ar" ? "ar" : "en";
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    textNodes.forEach(function (item) {
      item.node.nodeValue = lang === "ar" ? translateText(item.en) : item.en;
    });
    attrNodes.forEach(function (item) {
      if (item.placeholder) item.el.setAttribute("placeholder", lang === "ar" ? tr(item.placeholder) : item.placeholder);
      if (item.label) item.el.setAttribute("aria-label", lang === "ar" ? tr(item.label) : item.label);
    });

    $$(".lang-toggle button[lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("lang") === lang));
    });

    // "Translation pending native review" notice under the header
    var notice = $(".ar-notice");
    if (lang === "ar" && !notice) {
      notice = document.createElement("div");
      notice.className = "ar-notice";
      notice.setAttribute("role", "note");
      notice.innerHTML = 'الترجمة العربية بانتظار مراجعة لغوية · <span lang="en" dir="ltr">Translation pending native review</span>';
      var header = $(".site-header");
      header.parentNode.insertBefore(notice, header.nextSibling);
    } else if (lang === "en" && notice) {
      notice.remove();
    }

    renderDated();
    $$("[data-filter-group]").forEach(function (g) { if (g.refresh) g.refresh(); });
    if (timeline && timeline.refresh) { timeline.scrollLeft = 0; timeline.refresh(); }

    if (save) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable: ignore */ }
    }
  }

  $$(".lang-toggle button[lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLanguage(b.getAttribute("lang"), true); });
  });

  var saved = "en";
  try { saved = localStorage.getItem(STORAGE_KEY) || "en"; } catch (e) { /* ignore */ }
  initCalendar();
  setLanguage(saved, false);

  // Keep the countdown fresh (not needed when previewing a fixed date)
  if (!previewing) setInterval(renderDated, 30000);

  // Show which date is being previewed, so reviewers aren't confused
  if (previewing) {
    var ribbon = $(".mockup-ribbon");
    if (ribbon) {
      var tag = document.createElement("span");
      tag.style.display = "inline";
      tag.textContent = " · Previewing " + getNow().toDateString();
      ribbon.appendChild(tag);
    }
  }
})();
