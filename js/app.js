/* vertoxe — вход по кодовому слову, разделы, чтение, материалы, рейтинг.
   Разделы и их порядок меняются в списке SECTIONS ниже. */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  var SECTIONS = [
    { id: "instagram", path: "/instagram", icon: "ic-manual", title: "Instagram мануал", nav: "Instagram мануал", tab: "Мануал",
      desc: "Руководство для новых участников команды. Читайте по главам, в удобном темпе." },
    { id: "faq", path: "/faq", icon: "ic-if", title: "Что делать если", nav: "Что делать если", tab: "Если",
      desc: "Решения типовых проблем. Найдите свою ситуацию и действуйте по шагам." },
    { id: "materials", path: "/materials", icon: "ic-kit", title: "Материалы для работы", nav: "Материалы", tab: "Материалы",
      desc: "Хештеги, список музыки, выдача видео, уникализация и удаление метаданных." },
    { id: "leaders", path: "/leaders", icon: "ic-top", title: "Результаты лидеров", nav: "Результаты", tab: "Лидеры",
      desc: "Рейтинг лучших участников команды. Равняйтесь на тех, кто впереди." },
    { id: "payouts", path: "/payouts", icon: "ic-pay", title: "Как строятся выплаты", nav: "Выплаты", tab: "Выплаты",
      desc: "Принципы расчёта и порядок выплат. Всё в одном материале." }
  ];

  var MATERIALS = [
    { id: "about", icon: "ic-info", title: "Что это такое и как с этим работать", desc: "Короткое знакомство с материалами: что это и как ими пользоваться.", full: true },
    { id: "hashtags", icon: "ic-hash", title: "Хештеги", desc: "Готовые подборки хештегов. Нажмите на тег, чтобы скопировать.", wide: false },
    { id: "music", icon: "ic-music", title: "Список музыки", desc: "Подборка треков для работы. Копируйте название в один клик.", wide: false },
    { id: "video", icon: "ic-video", title: "Выдача видео", desc: "Видео выдаёт владелец проекта. Узнайте, как его получить.", wide: false },
    { id: "unique", icon: "ic-unique", title: "Уникализация видео", desc: "Сервис для уникализации видео. Откроется в новой вкладке.", tag: "Сервис", wide: true },
    { id: "metadata", icon: "ic-meta", title: "Удаление метаданных", desc: "Сервис для удаления метаданных видео. Откроется в новой вкладке.", tag: "Сервис", wide: true }
  ];

  /* ---------- Утилиты ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function icon(id, cls) {
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + id + '"/></svg>';
  }

  function store(kind) {
    try { return window[kind]; } catch (e) { return null; }
  }
  function sget(kind, k) { try { var s = store(kind); return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function sset(kind, k, v) { try { var s = store(kind); if (s) s.setItem(k, v); } catch (e) {} }
  function sdel(kind, k) { try { var s = store(kind); if (s) s.removeItem(k); } catch (e) {} }

  function safeUrl(u) {
    u = (u || "").trim();
    return /^https?:\/\/[^\s]+$/i.test(u) ? u : "";
  }

  function plural(n, a, b, c) {
    var m = Math.abs(n) % 100, d = m % 10;
    if (m > 10 && m < 20) return c;
    if (d > 1 && d < 5) return b;
    if (d === 1) return a;
    return c;
  }

  /* ---------- SHA-256 ---------- */

  function sha256Fallback(str) {
    var utf8 = unescape(encodeURIComponent(str));
    var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = [], i, j;
    for (i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);
    var rotr = function (x, n) { return (x >>> n) | (x << (32 - n)); };
    for (i = 0; i < bytes.length; i += 64) {
      var w = [];
      for (j = 0; j < 16; j++) w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
      for (j = 16; j < 64; j++) {
        var s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
  }

  function sha256(str) {
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
          return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
        }).catch(function () { return sha256Fallback(str); });
      }
    } catch (e) {}
    return Promise.resolve(sha256Fallback(str));
  }

  /* ---------- Тосты и копирование ---------- */

  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = doc.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      doc.body.appendChild(toastEl);
    }
    toastEl.innerHTML = icon("ic-check") + "<span>" + esc(msg) + "</span>";
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    doc.body.appendChild(ta);
    ta.select();
    try { doc.execCommand("copy"); } catch (e) {}
    doc.body.removeChild(ta);
  }

  /* ---------- Данные из index.html ---------- */

  function entries(section) {
    return $$('script.entry[data-section="' + section + '"]').map(function (el) {
      var lines = el.textContent.replace(/\r\n?/g, "\n").split("\n");
      while (lines.length && !lines[0].trim()) lines.shift();
      var title = (lines.shift() || "").trim();
      return { title: title, body: lines.join("\n").replace(/^\s*\n/, "").replace(/\s+$/, "") };
    }).filter(function (e) { return e.title || e.body; });
  }

  function block(name) {
    var el = $('script[data-block="' + name + '"]');
    return el ? el.textContent.replace(/\r\n?/g, "\n").trim() : "";
  }

  function config() {
    var cfg = {};
    block("links").split("\n").forEach(function (ln) {
      var i = ln.indexOf("=");
      if (i > 0) cfg[ln.slice(0, i).trim()] = ln.slice(i + 1).trim();
    });
    return cfg;
  }

  /* ---------- Оформление текста ---------- */

  function inline(src) {
    var out = esc(src), stash = [];
    function put(h) { stash.push(h); return "\u0000" + (stash.length - 1) + "\u0000"; }
    function link(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + "</a>"; }
    out = out.replace(/`([^`]+)`/g, function (m, c) { return put("<code>" + c + "</code>"); });
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (m, t, u) { return put(link(u, t)); });
    out = out.replace(/(https?:\/\/[^\s<]*[^\s<.,;:!?)\]'"])/g, function (u) { return put(link(u, u)); });
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return out.replace(/\u0000(\d+)\u0000/g, function (m, i) { return stash[+i]; });
  }

  /* Если в тексте нет «##», сайт сам находит заголовки, предупреждения и подсказки в обычном тексте. */
  function autoHeads(lines) {
    if (lines.some(function (l) { return /^\s*#{1,3}\s+\S/.test(l); })) return lines;
    var out = lines.slice(), found = 0;
    var EMO = /^[\u{1F300}-\u{1FAFF}☀-➿⭐⬆⬇⌀-⏿]/u;
    var WARN = /^(⚠|❗|‼|🚫|❌|⛔|🔴)|^(Важно|Внимание|Запрещено|Нельзя|Осторожно|Предупреждение)\s*[:!—–-]/i;
    var INFO = /^(💡|📌|ℹ|📎)|^(Совет|Примечание|Заметка|Лайфхак|Подсказка|Помните)\s*[:!—–-]/i;
    var LIST = /^([-*•–▪●◦]|\d+[.)])\s/;
    function nextText(i) { for (var k = i + 1; k < out.length; k++) { if (out[k].trim()) return { idx: k, t: out[k].trim() }; } return null; }

    for (var i = 0; i < out.length; i++) {
      var t = out[i].trim();
      if (!t || (i > 0 && out[i - 1].trim())) continue;       /* только первая строка абзаца */
      if (/^(>|#|-{3,}|\*{3,})/.test(t)) continue;

      /* предупреждение / подсказка: весь абзац */
      var kind = WARN.test(t) ? "> ! " : (INFO.test(t) && t.length > 30 ? "> " : "");
      if (kind) {
        out[i] = kind + t; found++;
        for (var k = i + 1; k < out.length && out[k].trim() && !LIST.test(out[k].trim()); k++) out[k] = "> " + out[k].trim();
        continue;
      }

      if (t.length < 3 || t.length > 70) continue;
      if (LIST.test(t) && !/^\d+[.)]\s/.test(t)) continue;
      var nx = nextText(i);
      if (!nx) continue;
      var adj = nx.idx === i + 1;
      var endsPunct = /[.,;!?…)\]»"]$/.test(t);
      var label = /:$/.test(t) && t.length <= 60;

      /* «Что нужно:» перед списком или текстом */
      if (label) { out[i] = "### " + t.replace(/:$/, ""); found++; continue; }
      if (endsPunct) continue;

      var num = /^\d+[.)]\s+/.test(t);
      if (num) {                                            /* «1. Название» + абзац = раздел; «1. шаг» + «2. шаг» = список */
        if (!LIST.test(nx.t) && nx.t.length >= 30) { out[i] = "## " + t; found++; }
        continue;
      }
      var emo = EMO.test(t);
      var caps = t === t.toUpperCase() && /[A-ZА-ЯЁ]{3}/.test(t);
      var named = /^(Глава|Часть|Шаг|Раздел|Урок|Этап|Правило|Пункт|Блок)\s+\d+/i.test(t);
      var strong = emo || caps || named;
      if (!strong) {
        if (!/^[A-ZА-ЯЁ0-9]/.test(t)) continue;
        if (t.length > 56) continue;
        if (nx.t.length < 40 && !LIST.test(nx.t)) continue;
      }
      out[i] = "## " + t; found++;
    }
    return found ? out : lines;
  }

  function rich(text, idPrefix, auto) {
    var lines = String(text || "").replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").replace(/\t/g, "  ").replace(/[\u200b\ufeff]/g, "").split("\n");
    if (auto) lines = autoHeads(lines);
    var html = [], heads = [], cur = null, gap = false, n = 0;

    function close() {
      if (!cur) return;
      if (cur.t === "p") html.push("<p>" + cur.items.join("<br>") + "</p>");
      else if (cur.t === "ul") html.push("<ul>" + cur.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>");
      else if (cur.t === "ol") html.push("<ol>" + cur.items.map(function (i) { return "<li><span>" + i + "</span></li>"; }).join("") + "</ol>");
      else if (cur.t === "q") {
        html.push('<div class="callout' + (cur.warn ? " warn" : "") + '">' + icon(cur.warn ? "ic-warn" : "ic-info") +
          "<div>" + cur.items.map(function (i) { return "<p>" + i + "</p>"; }).join("") + "</div></div>");
      }
      cur = null;
    }

    lines.forEach(function (raw) {
      var ln = raw.replace(/\s+$/, ""), m;
      if (!ln.trim()) { gap = true; if (cur && cur.t !== "ul" && cur.t !== "ol") close(); return; }
      var t = ln.trim();

      if ((m = /^(#{1,3})\s+(.+)$/.exec(t))) {
        close(); gap = false;
        var lvl = Math.max(2, m[1].length), id = idPrefix + "-h" + (++n);
        if (lvl === 2) heads.push({ id: id, text: m[2] });
        html.push("<h" + lvl + ' id="' + id + '">' + inline(m[2]) + "</h" + lvl + ">");
        return;
      }
      if ((m = /^(\*\*|__)([^*_]{2,80}?)\1:?$/.exec(t)) && !/[.!?]$/.test(m[2])) {
        close(); gap = false;
        html.push("<h3>" + inline(m[2]) + "</h3>");
        return;
      }
      if (/^(-{3,}|\*{3,}|_{3,}|={3,})$/.test(t)) { close(); gap = false; html.push("<hr>"); return; }
      if ((m = /^>\s?(.*)$/.exec(t))) {
        var warn = false, q = m[1];
        if (/^!\s*/.test(q)) { warn = true; q = q.replace(/^!\s*/, ""); }
        if (!cur || cur.t !== "q") { close(); cur = { t: "q", items: [], warn: warn }; }
        else if (warn) cur.warn = true;
        if (q) cur.items.push(inline(q));
        gap = false; return;
      }
      if ((m = /^[-*•–▪●◦]\s+(.+)$/.exec(t))) {
        if (!cur || cur.t !== "ul") { close(); cur = { t: "ul", items: [] }; }
        cur.items.push(inline(m[1])); gap = false; return;
      }
      if ((m = /^\d+[.)]\s+(.+)$/.exec(t))) {
        if (!cur || cur.t !== "ol") { close(); cur = { t: "ol", items: [] }; }
        cur.items.push(inline(m[1])); gap = false; return;
      }
      /* обычная строка */
      if (cur && (cur.t === "ul" || cur.t === "ol") && !gap) {
        cur.items[cur.items.length - 1] += "<br>" + inline(t);
        return;
      }
      if (!cur || cur.t !== "p") { close(); cur = { t: "p", items: [] }; }
      cur.items.push(inline(t)); gap = false;
    });
    close();
    return { html: html.join("\n"), heads: heads };
  }

  function readMinutes(text) {
    var words = (String(text).match(/\S+/g) || []).length;
    return Math.max(1, Math.round(words / 170));
  }

  /* ---------- Шаблоны страниц ---------- */

  function pageHead(opts) {
    var crumbs = "";
    if (opts.back) {
      crumbs = '<div class="crumbs"><a href="#' + opts.back.path + '">' + icon("ic-back") + esc(opts.back.label) + "</a></div>";
    } else {
      crumbs = '<div class="crumbs"><a href="#/">' + icon("ic-back") + "На главную</a></div>";
    }
    return '<section class="page-head"><div class="wrap">' + crumbs +
      '<div class="page-title-row"><span class="page-ico">' + icon(opts.icon) + '</span><h1 class="page-title">' + esc(opts.title) + "</h1></div>" +
      (opts.lead ? '<p class="page-lead">' + esc(opts.lead) + "</p>" : "") +
      (opts.tools || "") + "</div></section>";
  }

  function viewHome() {
    var cards = SECTIONS.map(function (s, i) {
      return '<a class="card" href="#' + s.path + '" style="--i:' + (i + 3) + '">' +
        '<div class="card-top"><span class="card-ico">' + icon(s.icon) + '</span><span class="card-num">0' + (i + 1) + "</span></div>" +
        "<h3>" + esc(s.title) + "</h3><p>" + esc(s.desc) + "</p>" +
        '<span class="card-go">' + icon("ic-arrow") + "</span></a>";
    }).join("");

    return '<div class="view">' +
      '<section class="hero" id="hero" style="--i:0"><div class="hero-fx" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i><span class="spot"></span>' +
      '<svg class="rings" viewBox="0 0 600 600"><g fill="none" stroke="currentColor"><circle cx="300" cy="300" r="120"/><circle cx="300" cy="300" r="190" stroke-dasharray="2 9"/><circle cx="300" cy="300" r="260"/><circle cx="300" cy="300" r="295" stroke-dasharray="1 14"/></g>' +
      '<g class="orbit o1"><circle cx="300" cy="40" r="5"/></g><g class="orbit o2"><circle cx="300" cy="110" r="3.5"/></g><g class="orbit o3"><circle cx="300" cy="180" r="4"/></g></svg></div>' +
      '<div class="wrap"><span class="eyebrow">Закрытая база знаний</span>' +
      "<h1><span>Всё для работы</span> <em>в одном месте</em></h1>" +
      '<p class="lead">Мануалы, материалы и результаты команды vertoxe. Всё, что нужно новому участнику, чтобы быстро войти в процесс.</p>' +
      '<div class="hero-cta"><a class="btn btn-primary" href="#/instagram"><span>Instagram мануал</span>' + icon("ic-arrow") + "</a>" +
      '<a class="btn btn-ghost" href="#/leaders"><span>Результаты лидеров</span></a></div></div></section>' +
      '<section style="--i:2"><div class="wrap"><div class="section-head"><h2>Разделы</h2><span>' + SECTIONS.length + " " + plural(SECTIONS.length, "раздел", "раздела", "разделов") + "</span></div>" +
      '<div class="cards">' + cards + "</div></div></section>" +
      homeResult() +
      '<section class="band" style="--i:7"><div class="wrap band-in"><h2>Быстрый старт</h2><ol class="band-steps">' +
      "<li><span><b>Прочитайте Instagram мануал.</b> Он объясняет, с чего начать и как двигаться дальше.</span></li>" +
      "<li><span><b>Заберите материалы.</b> Хештеги, музыка и сервисы для работы с видео уже собраны в одном разделе.</span></li>" +
      "<li><span><b>Если что-то пошло не так,</b> откройте «Что делать если» и найдите свою ситуацию.</span></li>" +
      "</ol></div></section></div>";
  }

  function homeResult() {
    var d = resultData();
    if (!d.kpis.length && !d.shots.length) return "";
    var phones = d.shots.slice(0, 3).map(function (x, i) {
      return '<span class="mini mini-' + (i + 1) + '"><img src="' + esc(x.src) + '" alt="" decoding="async"></span>';
    }).join("");
    return '<section class="teaser" style="--i:6"><div class="wrap"><div class="teaser-in">' +
      '<div class="teaser-txt"><span class="eyebrow">Реальный результат</span><h2>' + esc(d.title || "Результат команды") + "</h2>" +
      (d.lead ? "<p>" + esc(d.lead) + "</p>" : "") +
      '<div class="teaser-kpis">' + d.kpis.map(function (k) { return "<div><b>" + esc(k.val) + "</b><span>" + esc(k.label) + "</span></div>"; }).join("") + "</div>" +
      '<a class="btn btn-primary" href="#/leaders"><span>Смотреть скриншоты</span>' + icon("ic-arrow") + "</a></div>" +
      (phones ? '<div class="teaser-phones" aria-hidden="true">' + phones + "</div>" : "") + "</div></div></section>";
  }

  var FS_LEVELS = [{ v: "0.98rem", l: "Мелкий текст", s: "0.85rem" }, { v: "1.0625rem", l: "Обычный текст", s: "1.05rem" }, { v: "1.1875rem", l: "Крупный текст", s: "1.3rem" }];
  function fsLevel() { var v = parseInt(sget("localStorage", "vx-fs"), 10); return v >= 0 && v < FS_LEVELS.length ? v : 1; }
  function applyFs(i) { root.style.setProperty("--fs", FS_LEVELS[i].v); }

  function fsControl() {
    var cur = fsLevel();
    return '<div class="seg" role="group" aria-label="Размер текста" data-fs>' + FS_LEVELS.map(function (f, i) {
      return '<button type="button" data-fs-i="' + i + '" aria-pressed="' + (i === cur) + '" aria-label="' + f.l + '" style="font-size:' + f.s + ';font-weight:700">A</button>';
    }).join("") + "</div>";
  }

  function manualText() {
    var m = block("manual");
    if (m) return m;
    /* совместимость со старым форматом: несколько глав */
    return entries("instagram").map(function (e) { return "## " + e.title + "\n" + e.body; }).join("\n\n");
  }

  function viewInstagram() { return viewReader(SECTIONS[0], manualText(), "Пошаговое руководство для новых участников команды."); }
  function viewPayouts() { return viewReader(SECTIONS[4], block("payouts"), "Принципы расчёта и порядок выплат."); }

  function viewReader(s, text, lead, back) {
    var r = text ? rich(text, "m", true) : { html: "", heads: [] };
    var has = !!text.trim();

    var tocHtml = r.heads.length > 1 ? '<details class="toc" id="toc"><summary>Оглавление' + icon("ic-chev") + "</summary><ol>" + r.heads.map(function (h, i) {
      return '<li><a href="#" data-goto="' + h.id + '"><i>' + ("0" + (i + 1)).slice(-2) + "</i><span>" + esc(h.text) + "</span></a></li>";
    }).join("") + "</ol></details>" : "";

    var tools = has ? '<div class="tools">' +
      (r.heads.length > 1 ? '<span class="chip-meta">' + icon("ic-manual") + r.heads.length + " " + plural(r.heads.length, "раздел", "раздела", "разделов") + "</span>" : "") +
      '<span class="chip-meta">' + icon("ic-eye") + "около " + readMinutes(text) + " мин чтения</span>" + fsControl() + "</div>" : "";

    var sheet = r.heads.length > 1 ? '<button class="toc-fab" id="toc-fab" type="button" aria-haspopup="dialog">' + icon("ic-list") + "<span>Оглавление</span><b id=\"fab-pct\">0%</b></button>" +
      '<div class="sheet" id="toc-sheet" hidden><div class="sheet-bg" data-sheet="close"></div><div class="sheet-card" role="dialog" aria-modal="true" aria-label="Оглавление"><div class="sheet-head"><b>Оглавление</b><button class="icon-btn" type="button" data-sheet="close" aria-label="Закрыть">' + icon("ic-x") + "</button></div><ol>" +
      r.heads.map(function (h, i) { return '<li><a href="#" data-goto="' + h.id + '"><i>' + ("0" + (i + 1)).slice(-2) + "</i><span>" + esc(h.text) + "</span></a></li>"; }).join("") + "</ol></div></div>" : "";

    var body = has ? '<div class="read' + (tocHtml ? "" : " no-toc") + '">' + tocHtml + '<article class="chapters"><div class="prose manual">' + r.html + "</div>" +
      '<div class="read-end">' + icon("ic-check") + "<span>Вы дочитали до конца</span><a class=\"btn btn-ghost btn-sm\" href=\"#/faq\"><span>Что делать если</span>" + icon("ic-arrow") + "</a></div></article></div>"
      : '<div class="empty">' + icon(s.icon) + "<p>Материал скоро появится.</p></div>";

    return '<div class="view">' + pageHead({ icon: s.icon, title: s.title, lead: lead, tools: tools, back: back }) +
      '<div class="wrap" style="--i:2">' + body + "</div>" + sheet + "</div>";
  }

  function viewFaq() {
    var list = entries("faq");
    var s = SECTIONS[1];
    var items = list.map(function (e, i) {
      var r = rich(e.body, "f" + i);
      return '<details class="acc-item" data-search="' + esc((e.title + " " + e.body).toLowerCase()) + '">' +
        '<summary><span class="acc-no">' + ("0" + (i + 1)).slice(-2) + '</span><span class="acc-title">' + esc(e.title) +
        '</span><span class="acc-chev">' + icon("ic-chev") + "</span></summary>" +
        '<div class="acc-body"><div class="prose">' + r.html + "</div></div></details>";
    }).join("");

    var tools = list.length ? '<div class="bar-tools" style="--i:1">' +
      (list.length >= 4 ? '<label class="search">' + icon("ic-search") + '<input id="faq-search" type="search" placeholder="Найти ситуацию" autocomplete="off" spellcheck="false" aria-label="Поиск по ситуациям"></label>' : "") +
      '<button class="btn btn-ghost" id="faq-toggle" type="button" data-open="0">' + icon("ic-expand") + "<span>Раскрыть все</span></button></div>" : "";

    var body = list.length
      ? tools + '<div class="acc" id="faq-list">' + items + '</div><div class="empty" id="faq-empty" hidden>' + icon("ic-search") + "<p>Ничего не найдено. Попробуйте другие слова.</p></div>"
      : '<div class="empty">' + icon("ic-if") + "<p>Решения скоро появятся.</p></div>";

    return '<div class="view">' + pageHead({ icon: s.icon, title: s.title, lead: "Найдите свою ситуацию и действуйте по шагам." }) +
      '<div class="wrap" style="--i:2">' + body + "</div></div>";
  }

  function viewMaterials() {
    var s = SECTIONS[2];
    var tiles = MATERIALS.map(function (m, i) {
      return '<a class="tile' + (m.wide ? " wide" : "") + (m.full ? " full" : "") + '" href="#/materials/' + m.id + '" style="--i:' + (i + 2) + '">' +
        '<div class="tile-top"><span class="card-ico">' + icon(m.icon) + "</span>" +
        (m.tag ? '<span class="tag">' + icon("ic-link") + esc(m.tag) + "</span>" : "") + "</div>" +
        "<h3>" + esc(m.title) + "</h3><p>" + esc(m.desc) + "</p>" +
        '<span class="card-go">' + icon("ic-arrow") + "</span></a>";
    }).join("");
    return '<div class="view">' + pageHead({ icon: s.icon, title: s.title, lead: "Всё, что нужно в работе, собрано в одном месте." }) +
      '<div class="wrap"><div class="tiles">' + tiles + "</div></div></div>";
  }

  function groups(text, defaultTitle) {
    var out = [], cur = null;
    text.split("\n").forEach(function (ln) {
      var t = ln.trim();
      if (!t) return;
      var m = /^##\s+(.+)$/.exec(t);
      if (m) { cur = { title: m[1], lines: [] }; out.push(cur); return; }
      if (!cur) { cur = { title: defaultTitle, lines: [] }; out.push(cur); }
      cur.lines.push(t);
    });
    return out.filter(function (g) { return g.lines.length; });
  }

  function viewMaterialDetail(id) {
    var meta = MATERIALS.filter(function (m) { return m.id === id; })[0];
    if (!meta) return null;
    if (id === "about") return viewReader(meta, block("about"), "Что это такое и как с этим работать.", { path: "/materials", label: "Материалы для работы" });
    var cfg = config();
    var head = function (lead) {
      return pageHead({ icon: meta.icon, title: meta.title, lead: lead, back: { path: "/materials", label: "Материалы для работы" } });
    };
    var inner = "";

    if (id === "hashtags") {
      var gs = groups(block("hashtags"), "Хештеги");
      inner = gs.map(function (g, gi) {
        var tags = g.lines.join(" ").split(/\s+/).filter(Boolean);
        return '<section class="panel" style="--i:' + (gi + 2) + '"><div class="panel-head"><h2>' + esc(g.title) + " <small>" + tags.length + '</small></h2>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-copy="' + esc(tags.join(" ")) + '">' + icon("ic-copy") + "<span>Копировать все</span></button></div>" +
          '<div class="chips">' + tags.map(function (t) { return '<button class="chip" type="button" data-copy="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + "</div></section>";
      }).join("") + (gs.length ? '<p class="hint">Нажмите на хештег, чтобы скопировать его, или на «Копировать все» для всей подборки.</p>' : "");
      if (!gs.length) inner = '<div class="empty">' + icon("ic-hash") + "<p>Хештеги скоро появятся.</p></div>";
      return '<div class="view">' + head("Готовые подборки. Копируйте по одному или всей группой.") + '<div class="wrap">' + inner + "</div></div>";
    }

    if (id === "music") {
      var mg = groups(block("music"), "Список");
      var total = 0;
      inner = mg.map(function (g, gi) {
        var rows = g.lines.map(function (ln) {
          var m = /^(.*?)\s+[—–-]\s+(.+)$/.exec(ln);
          return { name: m ? m[1] : ln, artist: m ? m[2] : "", full: ln };
        });
        return '<section class="panel" style="--i:' + (gi + 2) + '"><div class="panel-head"><h2>' + esc(g.title) + " <small>" + rows.length + '</small></h2>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-copy="' + esc(rows.map(function (r) { return r.full; }).join("\n")) + '">' + icon("ic-copy") + "<span>Копировать список</span></button></div>" +
          '<ul class="tracks">' + rows.map(function (r) {
            total++;
            return '<li class="track" data-q="' + esc(r.full.toLowerCase()) + '"><span class="track-no">' + ("0" + total).slice(-2) + '</span><span class="track-ico">' + icon("ic-music") + "</span>" +
              '<span class="track-txt"><span class="track-name">' + esc(r.name) + "</span>" + (r.artist ? '<span class="track-artist">' + esc(r.artist) + "</span>" : "") + "</span>" +
              '<button class="icon-btn" type="button" data-copy="' + esc(r.full) + '" aria-label="Скопировать: ' + esc(r.full) + '">' + icon("ic-copy") + "</button></li>";
          }).join("") + "</ul></section>";
      }).join("");
      if (!mg.length) inner = '<div class="empty">' + icon("ic-music") + "<p>Список музыки скоро появится.</p></div>";
      var msearch = total >= 8 ? '<div class="bar-tools"><label class="search">' + icon("ic-search") + '<input id="music-search" type="search" placeholder="Найти трек" autocomplete="off" spellcheck="false" aria-label="Поиск по трекам"></label></div>' : "";
      return '<div class="view">' + head("Подборка треков. Нажмите на кнопку справа, чтобы скопировать название.") + '<div class="wrap">' + msearch + inner + '<div class="empty" id="music-empty" hidden>' + icon("ic-search") + "<p>Ничего не найдено.</p></div></div></div>";
    }

    if (id === "video") {
      var owner = safeUrl(cfg.owner);
      if (!owner && /^@[\w.]{3,}$/.test(cfg.owner || "")) owner = "https://t.me/" + cfg.owner.slice(1);
      var oname = cfg.ownerName || (cfg.owner && cfg.owner.charAt(0) === "@" ? cfg.owner : "");
      var contact = owner
        ? '<a class="contact" href="' + esc(owner) + '" target="_blank" rel="noopener noreferrer"><span class="card-ico">' + icon("ic-user") + "</span><span><small>Владелец проекта</small><b>" + esc(oname || "Написать владельцу") + "</b></span>" + icon("ic-link") + "</a>"
        : '<div class="contact"><span class="card-ico">' + icon("ic-user") + "</span><span><small>Владелец проекта</small><b>Контакт уточняйте у куратора</b></span></div>";
      inner = '<section class="panel" style="--i:2"><div class="service"><div><h2>Видео выдаёт владелец проекта</h2>' +
        "<p>Чтобы получить видео для работы, свяжитесь с владельцем проекта.</p></div>" + contact + "</div></section>";
      return '<div class="view">' + head("Как получить видео для работы.") + '<div class="wrap">' + inner + "</div></div>";
    }

    /* unique / metadata: ссылка на внешний сервис */
    var url = safeUrl(cfg[id]);
    var copy = id === "unique"
      ? { h: "Сервис уникализации", p: "Загрузите видео в сервис и получите уникальную версию файла. Сервис откроется в новой вкладке, а этот сайт останется открытым.", lead: "Ссылка на сервис для уникализации видео." }
      : { h: "Сервис очистки метаданных", p: "Метаданные — это служебная информация внутри файла. Откройте сервис, загрузите видео и удалите метаданные. Сервис откроется в новой вкладке.", lead: "Ссылка на сервис для удаления метаданных видео." };
    var btn = url
      ? '<div><a class="btn btn-primary" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"><span>Открыть сервис</span>' + icon("ic-link") + '</a><span class="service-note">Откроется в новой вкладке</span></div>'
      : '<div><span class="btn btn-ghost" aria-disabled="true"><span>Ссылка скоро появится</span></span></div>';
    inner = '<section class="panel" style="--i:2"><div class="service"><div><h2>' + copy.h + "</h2><p>" + copy.p + "</p></div>" + btn + "</div></section>";
    return '<div class="view">' + head(copy.lead) + '<div class="wrap">' + inner + "</div></div>";
  }

  function resultData() {
    var d = { period: "", member: "", title: "", lead: "", kpis: [], shots: [] };
    block("leaders").split("\n").forEach(function (ln) {
      var t = ln.trim();
      if (!t) return;
      var m = /^(period|member|title|lead|kpi|shot)\s*:\s*(.*)$/i.exec(t);
      if (!m) return;
      var k = m[1].toLowerCase(), c = m[2].split("|").map(function (x) { return x.trim(); });
      if (k === "kpi") d.kpis.push({ val: c[0], label: c[1] || "" });
      else if (k === "shot") { if (/^[\w./-]+\.(jpe?g|png|webp|gif)$/i.test(c[0])) d.shots.push({ src: c[0], title: c[1] || "", note: c[2] || "" }); }
      else d[k] = m[2].trim();
    });
    if (d.shots.length >= 3) { var first = d.shots.shift(); d.shots.splice(Math.floor((d.shots.length + 1) / 2), 0, first); d.center = Math.floor(d.shots.length / 2); }
    else d.center = 0;
    return d;
  }

  function viewLeaders() {
    var s = SECTIONS[3];
    var d = resultData();
    var tools = '<div class="tools">' + (d.period ? '<span class="chip-meta">' + icon("ic-top") + esc(d.period) + "</span>" : "") +
      (d.member ? '<span class="chip-meta">' + icon("ic-user") + esc(d.member) + "</span>" : "") +
      '<span class="chip-meta chip-ok">' + icon("ic-check") + "Скриншоты из Instagram</span></div>";

    var kpis = d.kpis.map(function (k, i) {
      return '<div class="kpi' + (i === 0 ? " main" : "") + '" style="--i:' + (i + 2) + '"><b>' + esc(k.val) + "</b><span>" + esc(k.label) + "</span></div>";
    }).join("");

    var shots = d.shots.map(function (x, i) {
      var pos = d.shots.length >= 3 ? (i === d.center ? "center" : i < d.center ? "left" : "right") : "flat";
      return '<figure class="shot ' + pos + '" style="--i:' + (i + 4) + '"><button class="phone" type="button" data-zoom="' + i + '" aria-label="Открыть крупно: ' + esc(x.title) + '">' +
        '<span class="phone-in"><img src="' + esc(x.src) + '" alt="' + esc(x.title + (x.note ? ". " + x.note : "")) + '" decoding="async"></span>' +
        '<span class="phone-zoom">' + icon("ic-expand") + "<em>Открыть</em></span></button>" +
        "<figcaption><b>" + esc(x.title) + "</b>" + (x.note ? "<small>" + esc(x.note) + "</small>" : "") + "</figcaption></figure>";
    }).join("");

    var body = d.shots.length || d.kpis.length
      ? (d.lead ? '<p class="result-lead" style="--i:1">' + esc(d.lead) + "</p>" : "") +
        (kpis ? '<div class="kpis">' + kpis + "</div>" : "") +
        (shots ? '<div class="stage"><div class="stage-glow" aria-hidden="true"></div><div class="shots" data-shots>' + shots + "</div></div><p class=\"hint center-hint\">Нажмите на скриншот, чтобы открыть его крупно.</p>" : "")
      : '<div class="empty">' + icon("ic-top") + "<p>Результат скоро появится.</p></div>";

    return '<div class="view">' + pageHead({ icon: s.icon, title: s.title, lead: "Реальный результат участника команды.", tools: tools }) + '<div class="wrap">' + body + "</div></div>";
  }

  function sheetClose() {
    var sh = $("#toc-sheet");
    if (!sh || sh.hidden) return;
    sh.classList.remove("on");
    doc.body.classList.remove("lb-open");
    setTimeout(function () { sh.hidden = true; }, 240);
  }

  /* ---------- Просмотр скриншотов ---------- */

  var lb, lbIndex = 0, lbItems = [], lbLast = null;
  function lbBuild() {
    lb = doc.createElement("div");
    lb.className = "lb";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Просмотр скриншота");
    lb.innerHTML = '<div class="lb-bg" data-lb="close"></div><button class="lb-btn lb-x" type="button" data-lb="close" aria-label="Закрыть">' + icon("ic-x") + "</button>" +
      '<button class="lb-btn lb-prev" type="button" data-lb="prev" aria-label="Предыдущий">' + icon("ic-back") + "</button>" +
      '<button class="lb-btn lb-next" type="button" data-lb="next" aria-label="Следующий">' + icon("ic-arrow") + "</button>" +
      '<figure class="lb-fig"><img alt=""><figcaption></figcaption></figure>';
    doc.body.appendChild(lb);
    lb.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lb]");
      if (!b) return;
      var a = b.getAttribute("data-lb");
      if (a === "close") lbClose(); else lbGo(lbIndex + (a === "next" ? 1 : -1));
    });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) lbGo(lbIndex + (dx < 0 ? 1 : -1));
    });
  }
  function lbGo(i) {
    if (!lbItems.length) return;
    lbIndex = (i + lbItems.length) % lbItems.length;
    var it = lbItems[lbIndex];
    $("img", lb).src = it.src; $("img", lb).alt = it.title;
    $("figcaption", lb).innerHTML = "<b>" + esc(it.title) + "</b>" + (it.note ? "<span>" + esc(it.note) + "</span>" : "") + "<i>" + (lbIndex + 1) + " / " + lbItems.length + "</i>";
    lb.classList.toggle("single", lbItems.length < 2);
  }
  function lbOpen(i) {
    lbItems = resultData().shots;
    if (!lbItems.length) return;
    if (!lb) lbBuild();
    lbLast = doc.activeElement;
    lb.hidden = false;
    void lb.offsetWidth;
    lb.classList.add("on");
    doc.body.classList.add("lb-open");
    lbGo(i);
    $(".lb-x", lb).focus();
  }
  function lbClose() {
    if (!lb || lb.hidden) return;
    lb.classList.remove("on");
    doc.body.classList.remove("lb-open");
    setTimeout(function () { lb.hidden = true; }, 220);
    if (lbLast && lbLast.focus) lbLast.focus({ preventScroll: true });
  }

  /* ---------- Роутер ---------- */

  var main, topNav, tabbar, spy;

  function parseRoute() {
    var h = (location.hash || "").replace(/^#/, "");
    if (h.charAt(0) !== "/") h = "/" + h;
    return h.replace(/\/+$/, "") || "/";
  }

  function route() {
    var path = parseRoute(), html = null, title = "vertoxe", sec = "";
    spy = null;

    if (path === "/") { html = viewHome(); sec = "/"; }
    else if (path === "/instagram") { html = viewInstagram(); sec = path; title = SECTIONS[0].title; }
    else if (path === "/faq") { html = viewFaq(); sec = path; title = SECTIONS[1].title; }
    else if (path === "/materials") { html = viewMaterials(); sec = path; title = SECTIONS[2].title; }
    else if (path.indexOf("/materials/") === 0) {
      html = viewMaterialDetail(path.slice(11));
      sec = "/materials";
      var mm = MATERIALS.filter(function (m) { return "/materials/" + m.id === path; })[0];
      if (mm) title = mm.title;
    }
    else if (path === "/payouts") { html = viewPayouts(); sec = path; title = SECTIONS[4].title; }
    else if (path === "/leaders") { html = viewLeaders(); sec = path; title = SECTIONS[3].title; }

    if (html === null) { location.replace("#/"); return; }

    if (lb && !lb.hidden) { lb.hidden = true; lb.classList.remove("on"); doc.body.classList.remove("lb-open"); }
    doc.body.classList.remove("lb-open");
    main.innerHTML = html;
    doc.title = (path === "/" ? "vertoxe" : title + " · vertoxe");

    $$("a[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === sec) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    afterRender(path);
    updateProgress();
  }

  function countUp() {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, txt = el.textContent, m = /^(\d[\d\s]*)([.,]\d+)?(.*)$/.exec(txt);
        if (!m) return;
        var dec = m[2] ? m[2].length - 1 : 0, sep = m[2] ? m[2].charAt(0) : "", end = parseFloat(m[1].replace(/\s/g, "") + (m[2] ? "." + m[2].slice(1) : ""));
        var t0 = null;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1100), v = end * (1 - Math.pow(1 - k, 3));
          var s = dec ? v.toFixed(dec).replace(".", sep) : String(Math.round(v));
          el.textContent = k >= 1 ? txt : s + m[3];
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    $$(".kpi b, .teaser-kpis b").forEach(function (b) { io.observe(b); });
  }

  function afterRender(path) {
    countUp();
    var toc = $("#toc");
    if (toc) {
      if (window.matchMedia("(min-width: 980px)").matches) toc.open = true;
      spy = { targets: $$(".manual h2"), links: $$(".toc a[data-goto], .sheet a[data-goto]") };
      updateSpy();
    }
    var fl = $("#faq-list");
    if (fl && /^\/faq/.test(path) && entries("faq").length === 1) { var d = $("details", fl); if (d) d.open = true; }
  }

  function updateSpy() {
    if (!spy) return;
    var line = window.innerHeight * 0.3, cur = spy.targets[0];
    if (!cur) return;
    spy.targets.forEach(function (t) { if (t.getBoundingClientRect().top <= line) cur = t; });
    spy.links.forEach(function (a) { a.classList.toggle("active", !!cur && a.getAttribute("data-goto") === cur.id); });
  }

  function updateProgress() {
    updateSpy();
    var bar = $("#progress-bar");
    var h = doc.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
    var hd = $("#site-header");
    if (hd) hd.classList.toggle("scrolled", window.scrollY > 8);
    var fab = $("#toc-fab");
    if (fab) {
      var rd = $(".manual"), pct = 0;
      if (rd) { var rr = rd.getBoundingClientRect(); pct = Math.max(0, Math.min(100, Math.round((-rr.top + window.innerHeight * 0.4) / rr.height * 100))); }
      $("#fab-pct").textContent = pct + "%";
      fab.classList.toggle("show", window.scrollY > 320);
    }
    var tt = $("#to-top");
    if (tt) tt.style.visibility = window.scrollY > 400 ? "visible" : "hidden";
  }

  function buildNav() {
    topNav = $("#top-nav");
    tabbar = $("#tabbar");
    topNav.innerHTML = SECTIONS.map(function (s) {
      return '<a href="#' + s.path + '" data-nav="' + s.path + '">' + icon(s.icon) + "<span>" + esc(s.nav) + "</span></a>";
    }).join("");
    var fn = $("#foot-nav");
    if (fn) fn.innerHTML = SECTIONS.map(function (s) { return '<a href="#' + s.path + '">' + esc(s.nav) + "</a>"; }).join("");
    tabbar.innerHTML = '<a href="#/" data-nav="/">' + icon("ic-home") + "<span>Главная</span></a>" + SECTIONS.map(function (s) {
      return '<a href="#' + s.path + '" data-nav="' + s.path + '">' + icon(s.icon) + "<span>" + esc(s.tab) + "</span></a>";
    }).join("");
  }

  /* ---------- Делегирование событий ---------- */

  function bindApp() {
    main.addEventListener("click", function (e) {
      var t = e.target;

      var cp = t.closest("[data-copy]");
      if (cp) {
        var val = cp.getAttribute("data-copy");
        Promise.resolve(copyText(val)).then(function () {
          toast(cp.classList.contains("chip") ? "Скопировано: " + val : "Скопировано");
          cp.classList.add("done");
          setTimeout(function () { cp.classList.remove("done"); }, 1200);
        });
        return;
      }

      var fb = t.closest("#toc-fab");
      if (fb) { var sh = $("#toc-sheet"); sh.hidden = false; void sh.offsetWidth; sh.classList.add("on"); doc.body.classList.add("lb-open"); return; }
      if (t.closest("[data-sheet]")) { sheetClose(); return; }

      var z = t.closest("[data-zoom]");
      if (z) { lbOpen(+z.getAttribute("data-zoom")); return; }

      var g = t.closest("[data-goto]");
      if (g) {
        e.preventDefault();
        if (g.closest(".sheet")) sheetClose();
        var el = doc.getElementById(g.getAttribute("data-goto"));
        if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        var toc = $("#toc");
        if (toc && !window.matchMedia("(min-width: 980px)").matches) toc.open = false;
        return;
      }

      var fs = t.closest("[data-fs-i]");
      if (fs) {
        var i = +fs.getAttribute("data-fs-i");
        sset("localStorage", "vx-fs", String(i));
        applyFs(i);
        $$("[data-fs-i]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-fs-i") === i)); });
        return;
      }

      var tg = t.closest("#faq-toggle");
      if (tg) {
        var open = tg.getAttribute("data-open") !== "1";
        $$("#faq-list .acc-item").forEach(function (d) { if (!d.hidden) d.open = open; });
        tg.setAttribute("data-open", open ? "1" : "0");
        $("span", tg).textContent = open ? "Свернуть все" : "Раскрыть все";
      }
    });

    main.addEventListener("input", function (e) {
      if (e.target.id === "music-search") {
        var mq = e.target.value.trim().toLowerCase(), ms = 0;
        $$(".track").forEach(function (li) { var ok = !mq || li.getAttribute("data-q").indexOf(mq) !== -1; li.hidden = !ok; if (ok) ms++; });
        $$(".tracks").forEach(function (ul) { var p = ul.closest(".panel"); if (p) p.hidden = !$$(".track:not([hidden])", ul).length; });
        var me = $("#music-empty"); if (me) me.hidden = ms > 0;
        return;
      }
      if (e.target.id !== "faq-search") return;
      var q = e.target.value.trim().toLowerCase(), shown = 0;
      $$("#faq-list .acc-item").forEach(function (d) {
        var ok = !q || d.getAttribute("data-search").indexOf(q) !== -1;
        d.hidden = !ok;
        if (ok) shown++;
        if (q && ok) d.open = true;
      });
      var em = $("#faq-empty");
      if (em) em.hidden = shown > 0;
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") sheetClose();
      if (lb && !lb.hidden) {
        if (e.key === "Escape") lbClose();
        else if (e.key === "ArrowRight") lbGo(lbIndex + 1);
        else if (e.key === "ArrowLeft") lbGo(lbIndex - 1);
        return;
      }
      if (e.key !== "/" || !root.classList.contains("auth")) return;
      var s = $("#faq-search") || $("#music-search");
      if (s && doc.activeElement !== s && !/^(INPUT|TEXTAREA)$/.test((doc.activeElement || {}).tagName || "")) { e.preventDefault(); s.focus(); }
    });

    main.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".card, .tile");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
    main.addEventListener("pointermove", function (e) {
      var h = e.target.closest && e.target.closest("#hero");
      if (!h) return;
      var r = h.getBoundingClientRect();
      h.style.setProperty("--hx", (e.clientX - r.left) + "px");
      h.style.setProperty("--hy", (e.clientY - r.top) + "px");
    }, { passive: true });
    $("#to-top").addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    window.addEventListener("hashchange", function () { if (root.classList.contains("auth")) route(); });
    $("#logout").addEventListener("click", logout);
  }

  /* ---------- Вход ---------- */

  var appStarted = false;
  function startApp() {
    if (!appStarted) {
      appStarted = true;
      main = $("#main");
      applyFs(fsLevel());
      buildNav();
      bindApp();
    }
    route();
  }

  function logout() {
    sdel("localStorage", "vx-auth");
    sdel("sessionStorage", "vx-auth");
    root.classList.remove("auth");
    history.replaceState(null, "", location.pathname + location.search);
    var inp = $("#gate-input");
    inp.value = "";
    setTimeout(function () { inp.focus(); }, 50);
  }

  function initGate() {
    var form = $("#gate-form"), input = $("#gate-input"), err = $("#gate-error"), card = $("#gate-card");
    var box = input.closest(".field-box"), btn = $("#gate-submit"), eye = $("#gate-eye");
    var fails = 0, locked = false;

    function showError(msg) {
      err.textContent = msg;
      err.hidden = false;
      box.classList.add("invalid");
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
    }
    function clearError() { err.hidden = true; box.classList.remove("invalid"); }

    eye.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      eye.setAttribute("aria-pressed", String(show));
      eye.setAttribute("aria-label", show ? "Скрыть кодовое слово" : "Показать кодовое слово");
      input.focus();
    });
    input.addEventListener("input", clearError);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (locked) return;
      var val = input.value.trim().toLowerCase(); /* регистр не важен */
      if (!val) { showError("Введите кодовое слово."); input.focus(); return; }
      btn.disabled = true;
      sha256(val).then(function (h) {
        btn.disabled = false;
        if (h === window.VX_KEY_HASH) {
          var remember = $("#gate-remember").checked;
          sdel("localStorage", "vx-auth");
          sdel("sessionStorage", "vx-auth");
          sset(remember ? "localStorage" : "sessionStorage", "vx-auth", h);
          input.value = "";
          input.type = "password";
          eye.setAttribute("aria-pressed", "false");
          clearError();
          fails = 0;
          root.classList.add("auth");
          if (!location.hash || location.hash === "#") history.replaceState(null, "", "#/");
          startApp();
        } else {
          fails++;
          if (fails >= 5) {
            locked = true;
            var left = 15;
            btn.disabled = true;
            showError("Слишком много попыток. Подождите " + left + " сек.");
            var iv = setInterval(function () {
              left--;
              if (left <= 0) { clearInterval(iv); locked = false; fails = 0; btn.disabled = false; clearError(); input.focus(); }
              else err.textContent = "Слишком много попыток. Подождите " + left + " сек.";
            }, 1000);
          } else {
            showError("Неверное кодовое слово. Проверьте раскладку и регистр.");
            input.select();
          }
        }
      });
    });

    if (!root.classList.contains("auth")) setTimeout(function () { input.focus(); }, 120);
  }

  /* ---------- Старт ---------- */

  function boot() {
    initGate();
    if (root.classList.contains("auth")) startApp();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})();
