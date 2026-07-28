/*
 * AGNI landing — page behaviors.
 * Content: window.AGNI_DATA (js/data.js). Shell: index.html.
 */
(function () {
  "use strict";

  var DATA = window.AGNI_DATA || {};

  var state = {
    scenario: 0,
    gw: null, // set on first applyBreakpoints — 'sm' | 'md' | 'lg'
    gh: null, // 'tight' | 'short' | 'comfy'
    navOpen: false,
    playedScenes: {},
    isTouch: false,
    cmpA: (DATA.keyIdx && DATA.keyIdx.cmpA) || 0,
    cmpB: (DATA.keyIdx && DATA.keyIdx.cmpB) || 3,
    triA: (DATA.keyIdx && DATA.keyIdx.triA) || 0,
    triB: (DATA.keyIdx && DATA.keyIdx.triB) || 1,
    triC: (DATA.keyIdx && DATA.keyIdx.triC) || 3,
    triOpen: null,
    triStuck: false,
    triBuyOn: false
  };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------------------
  // Breakpoints — sm < 640, md 640–1099, lg >= 1100; gh from visualViewport
  // height (tight < 660, short < 760, else comfy). Sets data-gw / data-gh on <html>.
  // ---------------------------------------------------------------------
  function computeBreakpoints() {
    var w = window.innerWidth;
    var h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    var gw = w >= 1100 ? "lg" : w >= 640 ? "md" : "sm";
    var gh = h < 660 ? "tight" : h < 760 ? "short" : "comfy";
    return { gw: gw, gh: gh };
  }

  function applyBreakpoints() {
    var next = computeBreakpoints();
    var first = state.gw === null;
    var changedW = first || next.gw !== state.gw;
    var changedH = first || next.gh !== state.gh;
    state.gw = next.gw;
    state.gh = next.gh;
    var html = document.documentElement;
    html.setAttribute("data-gw", state.gw);
    html.setAttribute("data-gh", state.gh);
    if (changedW && state.gw === "lg" && state.navOpen) {
      setNavOpen(false);
    }
    if (changedW) {
      renderEventsRail();
      applyBreakpointAssets();
      if (!first) renderCompare();
      refreshScenarioAssets();
    } else if (changedH) {
      refreshScenarioAssets();
    }
  }

  function initBreakpoints() {
    applyBreakpoints();
    window.addEventListener("resize", applyBreakpoints);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", applyBreakpoints);
    }
  }

  // ---------------------------------------------------------------------
  // NAV — burger toggle, mobile drawer, scroll-hide header
  // ---------------------------------------------------------------------
  function setNavOpen(open) {
    state.navOpen = open;
    var header = document.getElementById("site-header");
    var burgerIcon = document.getElementById("nav-burger-icon");
    if (header) header.classList.toggle("nav-open", open);
    if (burgerIcon) {
      var burgerUse = burgerIcon.querySelector("use");
      if (burgerUse) burgerUse.setAttribute("href", open ? "#ph-x" : "#ph-list");
    }
    var burger = document.getElementById("nav-burger");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function initNav() {
    var burger = document.getElementById("nav-burger");
    if (burger) {
      burger.addEventListener("click", function () {
        setNavOpen(!state.navOpen);
      });
    }
    $all("[data-nav-close]").forEach(function (el) {
      el.addEventListener("click", function () { setNavOpen(false); });
    });

    // hide header on scroll-down, reveal on scroll-up
    var header = document.getElementById("site-header");
    if (!header) return;
    var lastY = window.scrollY;
    var shown = true;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (state.navOpen || y < 90) {
        shown = true;
      } else if (y > lastY + 6) {
        shown = false;
      } else if (y < lastY - 6) {
        shown = true;
      }
      lastY = y;
      header.classList.toggle("site-header--hidden", !shown);
      // sticky bars (compare selbar) hug the top once the header itself is hidden
      document.documentElement.classList.toggle("header-hidden", !shown);
    }, { passive: true });
  }

  // ---------------------------------------------------------------------
  // HERO — muted/looping video, picks hero-vid_1[_sm|_md].webm via aBp
  // ---------------------------------------------------------------------
  function applyBreakpointAssets() {
    applyHeroSrc();
    var faqImg = document.querySelector(".faq-card__img");
    if (faqImg && DATA.aBp) {
      faqImg.src = DATA.aBp("faq-pic", ".webp", state.gw);
    }
    $all(".adv-card__photo[data-adv-stem]").forEach(function (el) {
      var stem = el.getAttribute("data-adv-stem");
      if (stem && DATA.aBp) {
        el.style.backgroundImage = "url('" + DATA.aBp(stem, ".webp", state.gw) + "')";
      }
    });
  }

  function applyHeroSrc() {
    var vid = document.getElementById("hero-vid-solid");
    if (!vid || !DATA.aBp) return;
    var src = DATA.aBp("hero-vid_1", ".webm", state.gw);
    if (vid.getAttribute("data-current-src") === src) return;
    vid.setAttribute("data-current-src", src);
    var wasPlaying = !vid.paused;
    vid.src = src;
    vid.load();
    if (wasPlaying || vid.autoplay) {
      vid.play().catch(function () {});
    }
  }

  function initHero() {
    var vid = document.getElementById("hero-vid-solid");
    if (!vid) return;
    vid.muted = true;
    vid.loop = true;
    vid.addEventListener("ended", function () {
      vid.currentTime = 0;
      vid.play().catch(function () {});
    });
    applyHeroSrc();
    vid.play().catch(function () {});
  }

  // ---------------------------------------------------------------------
  // ADVANTAGES — idle 3D tilt + pointer override
  // ---------------------------------------------------------------------
  function initAdvantagesTilt() {
    var grid = document.getElementById("adv-grid");
    if (!grid) return;
    var cards = $all("[data-tilt]", grid);
    if (!cards.length) return;
    var MAX = 9;
    var st = cards.map(function (_, i) { return { hover: false, px: 0, py: 0, phase: i * 1.1 }; });

    cards.forEach(function (card, i) {
      card.addEventListener("mouseenter", function () {
        st[i].hover = true;
        card.style.zIndex = "3";
        card.style.transition = "transform .12s ease-out,border-color .25s,box-shadow .25s";
      });
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        st[i].px = (e.clientX - r.left) / r.width - 0.5;
        st[i].py = (e.clientY - r.top) / r.height - 0.5;
      });
      card.addEventListener("mouseleave", function () {
        st[i].hover = false;
        card.style.zIndex = "";
        card.style.boxShadow = "";
        card.style.transition = "transform .6s ease-out,border-color .25s,box-shadow .25s";
      });
    });

    var t0 = performance.now();
    function tick(t) {
      var s = (t - t0) / 1000;
      cards.forEach(function (card, i) {
        var ry, rx, tz;
        if (st[i].hover) {
          ry = st[i].px * MAX;
          rx = -st[i].py * MAX;
          tz = 24;
          card.style.boxShadow = "0 30px 55px -18px rgba(0,0,0,.8), 0 0 40px rgba(15,159,148,.08)";
        } else {
          var p = st[i].phase;
          ry = Math.sin(s * 0.6 + p) * 5.5;
          rx = Math.cos(s * 0.5 + p * 1.3) * 4;
          tz = 6 + Math.sin(s * 0.7 + p) * 4;
        }
        card.style.transform = "rotateY(" + ry.toFixed(2) + "deg) rotateX(" + rx.toFixed(2) + "deg) translateZ(" + tz.toFixed(1) + "px)";
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------------
  // EVENTS — marquee photo rail (data.js) + fullscreen modal player
  // ---------------------------------------------------------------------
  function renderEventsRail() {
    if (!DATA.aBp) return;
    var colAEl = document.getElementById("events-col-a");
    var colBEl = document.getElementById("events-col-b");
    if (!colAEl || !colBEl) return;
    var bp = state.gw;

    function mkImg(item) {
      var img = document.createElement("img");
      img.src = DATA.aBp(item.stem, ".webp", bp);
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.className = item.tall ? "events-shot events-shot--tall" : "events-shot";
      return img;
    }

    function fill(el, base) {
      el.innerHTML = "";
      var full = base.concat(base); // duplicated for seamless marquee loop
      full.forEach(function (item) { el.appendChild(mkImg(item)); });
    }

    fill(colAEl, DATA.eventsColABase || []);
    fill(colBEl, DATA.eventsColBBase || []);
  }

  function initEventsModal() {
    var eVid = document.getElementById("events-vid");
    var eBtn = document.getElementById("events-play-btn");
    var eModal = document.getElementById("events-modal");
    var ePlayer = document.getElementById("events-player");
    var eFull = document.getElementById("events-vid-full");
    var eClose = document.getElementById("events-modal-close");
    var ePp = document.getElementById("events-pp");
    var ePpIcon = document.getElementById("events-pp-icon");
    var eSeek = document.getElementById("events-seek");
    var eTcur = document.getElementById("events-tcur");
    var eTdur = document.getElementById("events-tdur");
    var eSeeking = false;

    function fmtTime(s) {
      if (!isFinite(s) || s < 0) return "0:00";
      var m = Math.floor(s / 60);
      var sec = Math.floor(s % 60);
      return m + ":" + String(sec).padStart(2, "0");
    }
    function syncPpIcon() {
      if (!ePpIcon || !eFull) return;
      var paused = eFull.paused;
      var ppUse = ePpIcon.querySelector("use");
      if (ppUse) ppUse.setAttribute("href", paused ? "#ph-play-fill" : "#ph-pause-fill");
      if (ePp) ePp.setAttribute("aria-label", paused ? "Воспроизвести" : "Пауза");
    }
    function syncSeek() {
      if (!eFull || !eSeek || eSeeking) return;
      var d = eFull.duration || 0;
      var t = eFull.currentTime || 0;
      eSeek.value = d ? String(Math.round((t / d) * 1000)) : "0";
      if (eTcur) eTcur.textContent = fmtTime(t);
      if (eTdur) eTdur.textContent = fmtTime(d);
    }
    function loadEventsPreview() {
      if (!eVid || eVid.dataset.loaded === "1") return;
      var src = eVid.getAttribute("data-src");
      if (!src) return;
      eVid.src = src;
      eVid.dataset.loaded = "1";
      eVid.muted = true;
      eVid.loop = true;
      eVid.play().catch(function () {});
    }
    function eventsFullSrc() {
      // prefer MP4+AAC (Safari/iOS); fall back to webm with Opus (Chrome/Android)
      var mp4 = eFull && eFull.getAttribute("data-src-mp4");
      var webm = (eFull && eFull.getAttribute("data-src")) || "assets/Sponsor_Agni_4K.webm";
      var canMp4 = !!(mp4 && eFull.canPlayType && eFull.canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"'));
      return canMp4 ? mp4 : webm;
    }
    function unmuteEventsFull() {
      if (!eFull) return;
      eFull.muted = false;
      eFull.defaultMuted = false;
      eFull.volume = 1;
      eFull.removeAttribute("muted");
    }
    function ensureEventsFull() {
      if (!eFull) return;
      var src = eventsFullSrc();
      var name = src.split("/").pop();
      var cur = eFull.getAttribute("src") || eFull.currentSrc || "";
      if (!cur.includes(name)) {
        eFull.src = src;
        eFull.load();
      }
      unmuteEventsFull();
    }
    function playEventsFull() {
      if (!eFull) return Promise.resolve();
      unmuteEventsFull();
      return eFull.play().catch(function () {
        return new Promise(function (resolve) {
          function onReady() {
            eFull.removeEventListener("canplay", onReady);
            unmuteEventsFull();
            eFull.play().then(resolve).catch(function () { resolve(); });
          }
          eFull.addEventListener("canplay", onReady);
          setTimeout(function () {
            eFull.removeEventListener("canplay", onReady);
            resolve();
          }, 2500);
        });
      });
    }

    if (eVid) {
      eVid.muted = true;
      eVid.loop = true;
      var eventsSection = document.getElementById("events");
      if (eventsSection && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries.some(function (en) { return en.isIntersecting; })) {
            loadEventsPreview();
            io.disconnect();
          }
        }, { rootMargin: "240px 0px" });
        io.observe(eventsSection);
      } else {
        loadEventsPreview();
      }
    }
    if (eFull) {
      eFull.loop = true;
      eFull.addEventListener("timeupdate", syncSeek);
      eFull.addEventListener("loadedmetadata", syncSeek);
      eFull.addEventListener("play", syncPpIcon);
      eFull.addEventListener("pause", syncPpIcon);
      eFull.addEventListener("click", function () {
        if (eFull.paused) playEventsFull(); else eFull.pause();
      });
    }
    if (ePp) {
      ePp.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!eFull) return;
        if (eFull.paused) playEventsFull(); else eFull.pause();
      });
    }
    if (eSeek) {
      eSeek.addEventListener("pointerdown", function () { eSeeking = true; });
      eSeek.addEventListener("pointerup", function () { eSeeking = false; syncSeek(); });
      eSeek.addEventListener("input", function () {
        if (!eFull || !eFull.duration) return;
        eFull.currentTime = (parseInt(eSeek.value, 10) / 1000) * eFull.duration;
        if (eTcur) eTcur.textContent = fmtTime(eFull.currentTime);
      });
    }

    function openEventsModal() {
      if (!eModal) return;
      eModal.style.display = "flex";
      document.documentElement.style.overflow = "hidden";
      var header = document.getElementById("site-header");
      if (header) {
        header.classList.add("site-header--hidden");
        header.setAttribute("aria-hidden", "true");
      }
      if (eFull) {
        ensureEventsFull();
        var t = eVid ? eVid.currentTime : 0;
        try { if (t > 0 && isFinite(t)) eFull.currentTime = t; } catch (err) {}
        playEventsFull();
        syncPpIcon();
        syncSeek();
      }
      var fsTarget = ePlayer || eModal;
      var req = fsTarget.requestFullscreen || fsTarget.webkitRequestFullscreen || fsTarget.msRequestFullscreen;
      if (req) { try { req.call(fsTarget); } catch (err) {} }
    }
    function closeEventsModal() {
      if (!eModal) return;
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        var ex = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (ex) { try { ex.call(document); } catch (err) {} }
      }
      eModal.style.display = "none";
      document.documentElement.style.overflow = "";
      var header = document.getElementById("site-header");
      if (header) {
        header.classList.remove("site-header--hidden");
        header.removeAttribute("aria-hidden");
      }
      if (eFull) eFull.pause();
      if (eVid) { loadEventsPreview(); eVid.play().catch(function () {}); }
    }

    function onFsChange() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && eModal && eModal.style.display !== "none") {
        closeEventsModal();
      }
    }
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);

    if (eBtn) {
      eBtn.addEventListener("click", openEventsModal);
      eBtn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEventsModal(); }
      });
    }
    if (eClose) eClose.addEventListener("click", function (e) { e.stopPropagation(); closeEventsModal(); });
    if (eModal) eModal.addEventListener("click", function (e) { if (e.target === eModal) closeEventsModal(); });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeEventsModal();
      if (e.key === " " && eModal && eModal.style.display !== "none" && e.target === document.body) {
        e.preventDefault();
        if (eFull) { if (eFull.paused) playEventsFull(); else eFull.pause(); }
      }
    });
  }

  // ---------------------------------------------------------------------
  // COMPARE — 3-device on lg/md, 2-device on sm.
  // Full re-render on selection / dropdown / breakpoint; one delegated click listener.
  // ---------------------------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cmpModelImg(m) {
    return DATA.aBp ? DATA.aBp(m.stem, ".webp", state.gw) : "";
  }

  var CMP_CART_SVG = '<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21.5756 5.51906C21.5052 5.43481 21.4172 5.36705 21.3177 5.32056C21.2183 5.27407 21.1098 5.24998 21 5.25H5.87625L5.30625 2.11594C5.27485 1.94313 5.1838 1.78681 5.04897 1.67425C4.91414 1.56169 4.74408 1.50003 4.56844 1.5H2.25C2.05109 1.5 1.86032 1.57902 1.71967 1.71967C1.57902 1.86032 1.5 2.05109 1.5 2.25C1.5 2.44891 1.57902 2.63968 1.71967 2.78033C1.86032 2.92098 2.05109 3 2.25 3H3.9375L6.33375 16.1522C6.40434 16.5422 6.57671 16.9067 6.83344 17.2087C6.47911 17.5397 6.22336 17.9623 6.09455 18.4298C5.96575 18.8972 5.96892 19.3912 6.10371 19.8569C6.23851 20.3226 6.49966 20.7419 6.85821 21.0683C7.21676 21.3947 7.6587 21.6154 8.13502 21.7059C8.61134 21.7965 9.10344 21.7533 9.55673 21.5813C10.01 21.4092 10.4068 21.115 10.7031 20.7312C10.9994 20.3474 11.1836 19.889 11.2353 19.407C11.287 18.9249 11.2041 18.4379 10.9959 18H15.2541C15.0863 18.3513 14.9995 18.7357 15 19.125C15 19.6442 15.154 20.1517 15.4424 20.5834C15.7308 21.0151 16.1408 21.3515 16.6205 21.5502C17.1001 21.7489 17.6279 21.8008 18.1371 21.6996C18.6463 21.5983 19.114 21.3483 19.4812 20.9812C19.8483 20.614 20.0983 20.1463 20.1996 19.6371C20.3008 19.1279 20.2489 18.6001 20.0502 18.1205C19.8515 17.6408 19.5151 17.2308 19.0834 16.9424C18.6517 16.654 18.1442 16.5 17.625 16.5H8.54719C8.37155 16.5 8.20149 16.4383 8.06665 16.3257C7.93182 16.2132 7.84077 16.0569 7.80938 15.8841L7.51219 14.25H18.3872C18.9141 14.2499 19.4243 14.0649 19.8288 13.7272C20.2333 13.3896 20.5064 12.9206 20.6006 12.4022L21.7406 6.13406C21.7599 6.02572 21.7551 5.91447 21.7266 5.80818C21.6981 5.7019 21.6466 5.60319 21.5756 5.51906ZM9.75 19.125C9.75 19.3475 9.68402 19.565 9.5604 19.75C9.43679 19.935 9.26109 20.0792 9.05552 20.1644C8.84995 20.2495 8.62375 20.2718 8.40552 20.2284C8.18729 20.185 7.98684 20.0778 7.8295 19.9205C7.67217 19.7632 7.56502 19.5627 7.52162 19.3445C7.47821 19.1262 7.50049 18.9 7.58564 18.6945C7.67078 18.4889 7.81498 18.3132 7.99998 18.1896C8.18499 18.066 8.4025 18 8.625 18C8.92337 18 9.20952 18.1185 9.4205 18.3295C9.63147 18.5405 9.75 18.8266 9.75 19.125ZM18.75 19.125C18.75 19.3475 18.684 19.565 18.5604 19.75C18.4368 19.935 18.2611 20.0792 18.0555 20.1644C17.85 20.2495 17.6238 20.2718 17.4055 20.2284C17.1873 20.185 16.9868 20.0778 16.8295 19.9205C16.6722 19.7632 16.565 19.5627 16.5216 19.3445C16.4782 19.1262 16.5005 18.9 16.5856 18.6945C16.6708 18.4889 16.815 18.3132 17 18.1896C17.185 18.066 17.4025 18 17.625 18C17.9234 18 18.2095 18.1185 18.4205 18.3295C18.6315 18.5405 18.75 18.8266 18.75 19.125ZM19.125 12.1341C19.0935 12.3074 19.0021 12.464 18.8666 12.5766C18.7312 12.6893 18.5605 12.7506 18.3844 12.75H7.23938L6.14906 6.75H20.1009L19.125 12.1341Z"/></svg>';

  function cmpDropdownHtml(key, curIdx, disabledIdx, models, withChrome) {
    var open = state.triOpen === key;
    var cur = models[curIdx] || models[0];
    var opts = models.map(function (m, i) {
      var disabled = disabledIdx.indexOf(i) !== -1;
      var selected = i === curIdx;
      var cls = "cmp-dd-opt" + (selected ? " is-selected" : "") + (disabled ? " is-disabled" : "");
      return '<button type="button" class="' + cls + '" data-cmp-opt data-cmp-key="' + key + '" data-cmp-idx="' + i + '"' + (disabled ? " disabled" : "") + ">" + escapeHtml(m.name) + "</button>";
    }).join("");
    var thumb = withChrome
      ? '<img class="cmp-dd-thumb" src="' + cmpModelImg(cur) + '" alt="" decoding="async">'
      : "";
    var buy = withChrome
      ? '<a href="' + cur.url + '" target="_blank" rel="noopener noreferrer" class="buy-btn cmp-dd-buy" title="Купить" aria-label="Купить">' + CMP_CART_SVG + "</a>"
      : "";
    return (
      '<div class="cmp-dd" data-cmp-dd>' +
        '<div class="cmp-dd-inner">' +
          '<button type="button" class="cmp-dd-btn' + (open ? " is-open" : "") + '" data-cmp-toggle data-cmp-key="' + key + '">' +
            thumb +
            '<span class="cmp-dd-name">' + escapeHtml(cur.name) + "</span>" +
            '<svg class="icon cmp-dd-caret"><use href="#ph-caret-down"></use></svg>' +
          "</button>" +
          '<div class="cmp-dd-panel' + (open ? " is-open" : "") + '">' + opts + "</div>" +
        "</div>" +
        buy +
      "</div>"
    );
  }

  function cmpDeviceHtml(m) {
    return (
      '<div class="cmp-device">' +
        '<img class="cmp-device-img" src="' + cmpModelImg(m) + '" alt="' + escapeHtml(m.name) + '" loading="lazy" decoding="async">' +
        '<span class="cmp-device-price">' + escapeHtml(m.price) + "</span>" +
        '<span class="cmp-device-name">Сетевой фильтр ' + escapeHtml(m.name) + "</span>" +
        '<div class="cmp-device-buy-wrap">' +
          '<a href="' + m.url + '" target="_blank" rel="noopener noreferrer" class="buy-btn cmp-device-buy">Купить</a>' +
        "</div>" +
      "</div>"
    );
  }

  function cmpSpecsHtml(defs, selIdx) {
    return defs.map(function (d, i) {
      var cells = selIdx.map(function (mi) {
        return (
          '<div class="cmp-spec-cell">' +
            '<span class="cmp-spec-icon"><svg class="icon"><use href="#' + d.icon + '"></use></svg></span>' +
            '<span class="cmp-spec-label">' + escapeHtml(d.label) + "</span>" +
            '<span class="cmp-spec-value">' + escapeHtml(d.vals[mi]) + "</span>" +
          "</div>"
        );
      }).join("");
      return (
        '<div class="cmp-spec-row' + (i % 2 === 0 ? " is-odd" : "") + '">' +
          '<div class="cmp-spec-cells" style="grid-template-columns:repeat(' + selIdx.length + ',minmax(0,1fr))">' + cells + "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderCompareTrio(models, defs) {
    var cols = [
      { key: "A", cur: state.triA, others: [state.triB, state.triC] },
      { key: "B", cur: state.triB, others: [state.triA, state.triC] },
      { key: "C", cur: state.triC, others: [state.triA, state.triB] }
    ];
    var selbar = cols.map(function (c) { return cmpDropdownHtml(c.key, c.cur, c.others, models, true); }).join("");
    var devices = cols.map(function (c) { return cmpDeviceHtml(models[c.cur] || models[0]); }).join("");
    var selIdx = [state.triA, state.triB, state.triC];
    var stuckCls = (state.triStuck ? " is-stuck" : "") + (state.triBuyOn ? " is-buy-on" : "");
    return (
      '<div id="cmp-selbar" class="cmp-selbar' + stuckCls + '" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + selbar + "</div>" +
      '<div class="cmp-devices" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + devices + "</div>" +
      '<div id="cmp-specs" class="cmp-specs">' + cmpSpecsHtml(defs, selIdx) + "</div>"
    );
  }

  function renderCompareDuo(models, defs) {
    var cols = [
      { key: "A", cur: state.cmpA, others: [state.cmpB] },
      { key: "B", cur: state.cmpB, others: [state.cmpA] }
    ];
    var selbar = cols.map(function (c) { return cmpDropdownHtml(c.key, c.cur, c.others, models, false); }).join("");
    var devices = cols.map(function (c) { return cmpDeviceHtml(models[c.cur] || models[0]); }).join("");
    var selIdx = [state.cmpA, state.cmpB];
    return (
      '<div id="cmp-selbar" class="cmp-selbar" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + selbar + "</div>" +
      '<div class="cmp-devices" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + devices + "</div>" +
      '<div id="cmp-specs" class="cmp-specs">' + cmpSpecsHtml(defs, selIdx) + "</div>"
    );
  }

  function syncCmpSticky() {
    var bar = document.getElementById("cmp-selbar");
    if (!bar || state.gw === "sm") {
      state.triStuck = false;
      state.triBuyOn = false;
      if (bar) {
        bar.classList.remove("is-stuck", "is-buy-on");
      }
      return;
    }
    var br = bar.getBoundingClientRect();
    var stuck = br.top <= 100;
    var specs = document.getElementById("cmp-specs");
    var buyOn = stuck && !!specs && specs.getBoundingClientRect().top <= br.bottom;
    state.triStuck = stuck;
    state.triBuyOn = buyOn;
    bar.classList.toggle("is-stuck", stuck);
    bar.classList.toggle("is-buy-on", buyOn);
  }

  function renderCompare() {
    var root = document.getElementById("compare-root");
    var models = DATA.compareModels;
    var defs = DATA.compareDefs;
    if (!root || !models || !defs) return;
    var isDuo = state.gw === "sm";
    root.innerHTML = isDuo ? renderCompareDuo(models, defs) : renderCompareTrio(models, defs);
    // bake sticky from state, then re-measure after layout
    syncCmpSticky();
    requestAnimationFrame(syncCmpSticky);
  }

  function initCompare() {
    var root = document.getElementById("compare-root");
    if (!root) return;
    renderCompare();

    root.addEventListener("click", function (e) {
      var toggle = e.target.closest("[data-cmp-toggle]");
      if (toggle) {
        var key = toggle.getAttribute("data-cmp-key");
        state.triOpen = state.triOpen === key ? null : key;
        renderCompare();
        return;
      }
      var opt = e.target.closest("[data-cmp-opt]");
      if (opt && !opt.disabled) {
        var k = opt.getAttribute("data-cmp-key");
        var idx = parseInt(opt.getAttribute("data-cmp-idx"), 10) || 0;
        var isDuo = state.gw === "sm";
        var stateKey = isDuo ? "cmp" + k : "tri" + k;
        state[stateKey] = idx;
        state.triOpen = null;
        renderCompare();
      }
    });

    document.addEventListener("mousedown", function (e) {
      if (state.triOpen && !(e.target.closest && e.target.closest("[data-cmp-dd]"))) {
        state.triOpen = null;
        renderCompare();
      }
    });

    window.addEventListener("scroll", syncCmpSticky, { passive: true });
  }

  // ---------------------------------------------------------------------
  // SCENARIOS — dual-overlay (lg) + sticky pad (md/sm):
  // full-bleed overlays, playedScenes entrance, scroll markers.
  // ---------------------------------------------------------------------
  function prepSceneVid(v) {
    if (!v || v._agniVidReady) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.loop = v.classList.contains("scene-vid-loop");
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.setAttribute("disablepictureinpicture", "");
    v.removeAttribute("controls");
    v.controls = false;
    try { v.disablePictureInPicture = true; } catch (e) {}
    try { v.disableRemotePlayback = true; } catch (e) {}
    v.style.pointerEvents = "none";
    var exitFs = function () {
      try {
        if (v.webkitDisplayingFullscreen && v.webkitExitFullscreen) v.webkitExitFullscreen();
        if (document.fullscreenElement === v && document.exitFullscreen) document.exitFullscreen();
      } catch (err) {}
    };
    v.addEventListener("webkitbeginfullscreen", function (e) { e.preventDefault(); exitFs(); });
    v.addEventListener("fullscreenchange", exitFs);
    v._agniVidReady = true;
  }

  function armSceneVid(v) {
    if (!v) return;
    prepSceneVid(v);
    var ds = v.getAttribute("data-src");
    if (ds && !v.getAttribute("src")) {
      v.setAttribute("src", ds);
      try { v.load(); } catch (e) {}
    }
    var isLoop = v.classList.contains("scene-vid-loop") || v.loop;
    if (!isLoop) {
      if (v._done || v.ended) {
        try { if (v.duration && isFinite(v.duration)) v.currentTime = v.duration; } catch (e) {}
        return;
      }
      if (!v._endedBound) {
        v._endedBound = true;
        v.addEventListener("ended", function () {
          v._done = true;
          v._playing = false;
          try { v.pause(); } catch (e) {}
        });
      }
    }
    if (v._playing && !v.paused) return;
    function kick() {
      if (!isLoop && (v._done || v.ended)) return;
      v.muted = true;
      var p = v.play();
      if (p && typeof p.then === "function") {
        p.then(function () { v._playing = true; }).catch(function () {});
      }
    }
    kick();
    if (!v._armRetry) {
      v._armRetry = true;
      v.addEventListener("loadeddata", kick, { once: true });
      setTimeout(kick, 280);
    }
  }

  function scSpecHtml(ac, rich) {
    return (
      '<div class="sc-spec' + (rich ? " is-rich" : "") + '">' +
        '<div class="sc-spec-pre"' + (ac.pre ? "" : ' hidden') + ">" + escapeHtml(ac.pre || "") + "</div>" +
        '<div class="sc-spec-big"><span>' + escapeHtml(ac.big) + "</span></div>" +
        '<div class="sc-spec-label">' + escapeHtml(ac.label) + "</div>" +
      "</div>"
    );
  }

  function scVidTag(opts) {
    var cls = "scene-vid" + (opts.loop ? " scene-vid-loop" : "") + (opts.cls ? " " + opts.cls : "");
    var lg = opts.lgOnly ? ' data-lg-only="1"' : "";
    return (
      '<video class="' + cls + '" data-scene-i="' + opts.i + '" data-stem="' + opts.stem +
      '" data-ext="' + (opts.ext || ".mp4") + '"' + lg + ' muted playsinline preload="none"></video>'
    );
  }

  function scImgTag(opts) {
    var lg = opts.lgOnly ? ' data-lg-only="1"' : "";
    var cls = opts.cls ? ' class="' + opts.cls + '"' : "";
    return (
      '<img' + cls + ' data-stem="' + opts.stem + '" data-ext="' + (opts.ext || ".webp") + '"' +
      lg + ' alt="" loading="lazy" decoding="async">'
    );
  }

  // LG dual overlay — slides 0–2: main video fade + left USB/sockets slide-in + title/specs
  function scDualOverlayHtml(sc) {
    var i = sc.idx;
    var rich = !!(sc.rich || sc.vidStem);
    var dets = sc.detailsLg || sc.details || [];
    var usb = dets[0];
    var sock = dets[1];
    var sockHtml = "";
    if (sock) {
      sockHtml = sock.kind === "vid"
        ? scVidTag({ i: i, stem: sock.stem, loop: true, cls: "sc-dual-sock", lgOnly: !!sock.lgOnly })
        : scImgTag({ stem: sock.stem, cls: "sc-dual-sock", lgOnly: !!sock.lgOnly || i === 2 });
    }
    var mainCls = "sc-dual-main" + (i === 0 ? " sc-dual-main--scaled" : "");
    var specs = (sc.accents || []).map(function (ac) {
      return scSpecHtml(ac, rich);
    }).join("");
    return (
      '<div class="sc-dual' + (rich ? " is-rich" : "") + '" data-sc-ov="' + i + '">' +
        '<div class="sc-dual-inner">' +
          '<div class="sc-dual-top">' +
            '<div class="sc-dual-title">' +
              '<div class="sc-dual-model">' + escapeHtml(sc.model) + "</div>" +
              '<div class="sc-dual-h">' + escapeHtml(sc.title || "") + "</div>" +
            "</div>" +
            '<div class="' + mainCls + '">' +
              scVidTag({ i: i, stem: sc.vidStem }) +
            "</div>" +
          "</div>" +
          '<div class="sc-dual-bot">' +
            '<div class="sc-dual-left">' +
              (usb ? scImgTag({ stem: usb.stem, cls: "sc-dual-usb" }) : "") +
              sockHtml +
            "</div>" +
            '<div class="sc-dual-specs">' + specs + "</div>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  // LG tower overlay — slide 3: tall main fade + detail media slide from right
  function scTowerOverlayHtml(sc) {
    var i = sc.idx;
    var dets = sc.details || [];
    var d0 = dets[0];
    var d1 = dets[1];
    var ac = sc.accents || [];
    return (
      '<div class="sc-tower" data-sc-ov="' + i + '">' +
        '<div class="sc-tower-inner">' +
          '<div class="sc-tower-main">' + scVidTag({ i: i, stem: sc.vidStem }) + "</div>" +
          '<div class="sc-tower-side">' +
            '<div class="sc-tower-title">' +
              '<div class="sc-dual-model">' + escapeHtml(sc.model) + "</div>" +
              '<div class="sc-dual-h sc-dual-h--single">' + escapeHtml(sc.titleText) + "</div>" +
            "</div>" +
            '<div class="sc-tower-details">' +
              '<div class="sc-tower-col">' +
                (d0 && d0.kind === "vid"
                  ? scVidTag({ i: i, stem: d0.stem, loop: true, cls: "sc-tower-det sc-tower-det--vid" })
                  : "") +
                (ac[0] ? scSpecHtml(ac[0], true) : "") +
              "</div>" +
              '<div class="sc-tower-col">' +
                (d1 ? scImgTag({ stem: d1.stem, cls: "sc-tower-det sc-tower-det--img", lgOnly: true }) : "") +
                (ac[1] ? scSpecHtml(ac[1], true) : "") +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  // MD tower side-by-side overlay (only visible on md when scene 3 active)
  function scTowerMdHtml(sc) {
    var i = sc.idx;
    var dets = sc.details || [];
    var d0 = dets[0];
    var d1 = dets[1];
    var ac = sc.accents || [];
    return (
      '<div class="sc-tower-md" data-sc-ov="' + i + '">' +
        '<div class="sc-tower-md-main">' + scVidTag({ i: i, stem: sc.vidStem }) + "</div>" +
        '<div class="sc-tower-md-side">' +
          '<div class="sc-tower-md-title">' +
            '<div class="sc-tab-model">' + escapeHtml(sc.model) + "</div>" +
            '<div class="sc-tab-h">' + escapeHtml(sc.titleText) + "</div>" +
          "</div>" +
          '<div class="sc-tower-md-cols">' +
            '<div class="sc-tower-md-col">' +
              '<div class="sc-tower-md-media">' +
                (d0 && d0.kind === "vid"
                  ? scVidTag({ i: i, stem: d0.stem, loop: true })
                  : "") +
              "</div>" +
              (ac[0] ? scSpecHtml(ac[0], true) : "") +
            "</div>" +
            '<div class="sc-tower-md-col">' +
              (d1 ? scImgTag({ stem: d1.stem, cls: "sc-tower-md-img" }) : "") +
              (ac[1] ? scSpecHtml(ac[1], true) : "") +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  // MD/SM accent column — media order fixed; labels swapped for slides 0–1
  function scAccentSlideHtml(sc) {
    var i = sc.idx;
    var accents = sc.accents || [];
    var details = sc.details || [];
    var swap = !sc.tower && i < 2 && accents.length === 2;
    var cols = accents.map(function (ac, ai) {
      var tx = swap ? accents[1 - ai] : ac;
      var det = details[ai];
      var media = "";
      if (det) {
        var lgOnly = !!det.lgOnly;
        if (det.kind === "vid") {
          media =
            '<div class="sc-acc-media-wrap">' +
              scVidTag({ i: i, stem: det.stem, loop: true, cls: "sc-acc-media", lgOnly: lgOnly }) +
            "</div>";
        } else {
          media = scImgTag({ stem: det.stem, cls: "sc-acc-media", lgOnly: lgOnly });
        }
      }
      return (
        '<div class="sc-acc-col">' +
          media +
          '<div class="sc-spec-pre"' + (tx.pre ? "" : ' hidden') + ">" + escapeHtml(tx.pre || "") + "</div>" +
          '<div class="sc-spec-big sc-spec-big--tab"><span>' + escapeHtml(tx.big) + "</span></div>" +
          '<div class="sc-spec-label sc-spec-label--tab">' + escapeHtml(tx.label) + "</div>" +
        "</div>"
      );
    }).join("");
    return (
      '<div class="sc-acc-slide' + (sc.tower ? " is-tower" : "") + '" data-sc-ov="' + i + '">' +
        '<div class="sc-acc-head">' +
          '<div class="sc-tab-model">' + escapeHtml(sc.model) + "</div>" +
          '<h3 class="sc-tab-h">' + escapeHtml(sc.titleText) + "</h3>" +
        "</div>" +
        cols +
      "</div>"
    );
  }

  function scVidSlideHtml(sc) {
    var i = sc.idx;
    return (
      '<div class="sc-vid-slide' + (sc.tower ? " is-tower" : "") + '" data-sc-ov="' + i + '">' +
        scVidTag({ i: i, stem: sc.vidStem, cls: "sc-vid-el" }) +
      "</div>"
    );
  }

  function scDotsHtml(scenes) {
    return scenes.map(function (sc) {
      return (
        '<button type="button" class="sc-dot" data-sc-dot="' + sc.idx + '" title="' + escapeHtml(sc.titleText) + '" aria-label="' + escapeHtml(sc.titleText) + '">' +
          '<img src="assets/' + sc.thumbStem + '.webp" alt="" loading="lazy" decoding="async">' +
        "</button>"
      );
    }).join("");
  }

  function scCtaHtml() {
    return (
      '<a href="#compare" class="sc-cta">' +
        '<span class="sc-cta-label">Сравнить фильтры</span>' +
        '<span class="sc-cta-icon"><svg class="icon"><use href="#ph-arrow-right"></use></svg></span>' +
      "</a>"
    );
  }

  function scTrackHtml(scenes, edgeClass, itemClass) {
    var items = scenes.map(function (sc) {
      return (
        '<div class="' + itemClass + '" data-scene-idx="' + sc.idx +
        '" data-has-views="' + (sc.left ? "1" : "") + '"></div>'
      );
    }).join("");
    return (
      '<div class="sc-track">' +
        '<div class="' + edgeClass + '"></div>' +
        items +
        '<div class="' + edgeClass + '"></div>' +
      "</div>"
    );
  }

  function renderScenarios() {
    var root = document.getElementById("scenarios-root");
    var base = DATA.scenarioBase;
    if (!root || !base || !base.length) return;
    var scenes = base.map(function (s, i) {
      return Object.assign({}, s, {
        idx: i,
        titleText: (s.title || "").replace(/\n/g, " ")
      });
    });
    var duals = scenes.filter(function (s) { return s.left && !s.tower; }).map(scDualOverlayHtml).join("");
    var tower = scenes.filter(function (s) { return s.tower; })[0];
    var towerLg = tower ? scTowerOverlayHtml(tower) : "";
    var towerMd = tower ? scTowerMdHtml(tower) : "";
    var vidSlides = scenes.map(scVidSlideHtml).join("");
    var accSlides = scenes.map(scAccentSlideHtml).join("");
    var dots = scDotsHtml(scenes);

    root.innerHTML =
      '<div class="sc-shell sc-shell--lg">' +
        '<div class="sc-sticky sc-sticky--lg">' +
          '<h2 class="sc-heading sc-heading--lg">Один центр питания<br>для всего сетапа</h2>' +
          duals +
          towerLg +
          '<div class="sc-chrome sc-chrome--lg">' +
            '<div class="sc-dots">' + dots + "</div>" +
            scCtaHtml() +
          "</div>" +
        "</div>" +
        scTrackHtml(scenes, "sc-track-edge sc-track-edge--lg", "sc-track-item sc-track-item--lg") +
      "</div>" +
      '<div class="sc-shell sc-shell--tab">' +
        '<div id="sc-sticky-t" class="sc-sticky sc-sticky--tab">' +
          '<h2 class="sc-heading sc-heading--tab">Один центр питания<br>для всего сетапа</h2>' +
          '<div class="sc-main-row">' +
            '<div class="sc-stack">' +
              '<div class="sc-vid-box">' + vidSlides + "</div>" +
              '<div class="sc-accent-box">' + accSlides + "</div>" +
            "</div>" +
            towerMd +
          "</div>" +
          '<div class="sc-chrome sc-chrome--tab">' +
            '<div class="sc-dots sc-dots--tab">' + dots + "</div>" +
            scCtaHtml() +
          "</div>" +
        "</div>" +
        scTrackHtml(scenes, "sc-track-edge sc-track-edge--tab", "sc-track-item sc-track-item--tab") +
      "</div>";

    refreshScenarioAssets();
  }

  function resolveSceneAssetSrc(el) {
    var stem = el.getAttribute("data-stem");
    if (!stem || !DATA.aBp) return;
    var ext = el.getAttribute("data-ext") || ".mp4";
    var forceLg = el.hasAttribute("data-lg-only") || !!el.closest(".sc-shell--lg");
    var bp = forceLg ? "lg" : state.gw;
    var url = DATA.aBp(stem, ext, bp);
    if (el.tagName === "IMG") {
      if (el.getAttribute("src") !== url) el.setAttribute("src", url);
      return;
    }
    var prev = el.getAttribute("data-src");
    el.setAttribute("data-src", url);
    if (prev && prev !== url) {
      if (el.getAttribute("src")) el.removeAttribute("src");
      el._done = false;
      el._playing = false;
      el._armRetry = false;
      try { el.load(); } catch (e) {}
    }
  }

  function sceneShellVisible(el) {
    var shell = el.closest(".sc-shell");
    if (!shell) return true;
    // display:none shells (lg↔tab swap) — skip; offsetParent alone misses some absolute children
    return window.getComputedStyle(shell).display !== "none";
  }

  function updateSceneClasses(root) {
    var base = DATA.scenarioBase || [];
    var cur = base[state.scenario];
    var isTower = !!(cur && cur.tower);
    root.setAttribute("data-active-scene", String(state.scenario));
    root.setAttribute("data-active-tower", isTower ? "1" : "0");

    $all("[data-sc-ov]", root).forEach(function (el) {
      var i = parseInt(el.getAttribute("data-sc-ov"), 10) || 0;
      el.classList.toggle("is-active", i === state.scenario);
      el.classList.toggle("is-played", !!state.playedScenes[i]);
    });
    $all(".sc-vid-slide", root).forEach(function (el) {
      var i = parseInt(el.getAttribute("data-sc-ov"), 10) || 0;
      el.classList.toggle("is-active", i === state.scenario);
      el.classList.toggle("is-played", !!state.playedScenes[i]);
    });
    $all("[data-sc-dot]", root).forEach(function (el) {
      var i = parseInt(el.getAttribute("data-sc-dot"), 10) || 0;
      el.classList.toggle("is-active", i === state.scenario);
    });
  }

  function armSceneVisible(root) {
    $all(".scene-vid", root).forEach(function (v) {
      if (!sceneShellVisible(v)) return;
      var i = parseInt(v.getAttribute("data-scene-i") || "0", 10);
      if (state.playedScenes[i]) armSceneVid(v);
    });
  }

  function refreshScenarioAssets() {
    var root = document.getElementById("scenarios-root");
    if (!root) return;
    $all("[data-stem]", root).forEach(resolveSceneAssetSrc);
    updateSceneClasses(root);
    armSceneVisible(root);
  }

  function goToScene(root, i) {
    var items = $all('[data-scene-idx="' + i + '"]', root).filter(function (x) { return x.offsetParent !== null; });
    var el = items[0];
    if (!el) return;
    state.scenario = i;
    state.playedScenes[i] = true;
    updateSceneClasses(root);
    armSceneVisible(root);
    var r = el.getBoundingClientRect();
    var target = window.scrollY + r.top - (window.innerHeight / 2 - r.height / 2);
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }

  function initScenariosScroll() {
    var root = document.getElementById("scenarios-root");
    if (!root) return;
    updateSceneClasses(root);

    function sceneScroll() {
      var items = $all("[data-scene-idx]", root).filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var mid = window.innerHeight * 0.5;
      var best = 0;
      var bestDist = Infinity;
      var bestEl = null;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var c = r.top + r.height / 2;
        var d = Math.abs(c - mid);
        if (d < bestDist) { bestDist = d; best = parseInt(el.getAttribute("data-scene-idx"), 10) || 0; bestEl = el; }
      });
      var changed = false;
      if (best !== state.scenario) { state.scenario = best; changed = true; }
      if (bestEl && !state.playedScenes[best] && bestDist < window.innerHeight * 0.9) {
        state.playedScenes[best] = true;
        changed = true;
      }
      if (changed) {
        updateSceneClasses(root);
        armSceneVisible(root);
      }
    }

    window.addEventListener("scroll", sceneScroll, { passive: true });
    sceneScroll();

    if (state.isTouch) {
      document.addEventListener("touchstart", function () { armSceneVisible(root); }, { passive: true });
    }

    root.addEventListener("click", function (e) {
      var dot = e.target.closest("[data-sc-dot]");
      if (!dot) return;
      goToScene(root, parseInt(dot.getAttribute("data-sc-dot"), 10) || 0);
    });
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  function boot() {
    state.isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    initBreakpoints();
    initNav();
    initHero();
    renderEventsRail();
    initEventsModal();
    initAdvantagesTilt();
    initCompare();
    renderScenarios();
    initScenariosScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.AGNI_APP = { state: state };
})();
