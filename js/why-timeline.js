/*
 * Standalone enhancement for the "Why businesses trust Cre8X-HUB" timeline.
 *
 * The compiled React bundle renders the five icon nodes plus a scroll-driven
 * connecting bar, using framer-motion `whileInView` with `once: true`. That
 * means the nodes light up a single time and never dim again when you scroll
 * back up.
 *
 * This script takes over that timeline and drives it straight from the scroll
 * position: the bar fills/empties smoothly and each node glows once the fill
 * front passes it, un-glowing when you scroll back above it. It re-applies
 * itself whenever React (re)renders the section.
 */
(function () {
  "use strict";

  var STYLE_ID = "cx-why-timeline-style";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#why .cx-why-node{position:relative;z-index:2;transition:opacity .45s ease;}",
      "#why .cx-why-node .cx-why-icon-ring{transition:box-shadow .45s ease,border-color .45s ease,background-color .45s ease;}",
      "#why .cx-why-node svg{transition:color .45s ease,filter .45s ease;}",
      // `!important` so we win over framer-motion's inline opacity.
      "#why .cx-why-node.is-lit{opacity:1 !important;}",
      "#why .cx-why-node:not(.is-lit){opacity:.4 !important;}",
      "#why .cx-why-node:not(.is-lit) .cx-why-icon-ring{box-shadow:none;border-color:rgba(157,78,221,.25);background-color:#000;}",
      "#why .cx-why-node.is-lit .cx-why-icon-ring{border-color:rgba(157,78,221,.9);background-color:rgba(157,78,221,.14);box-shadow:0 0 42px rgba(157,78,221,.9),0 0 14px rgba(187,134,252,.7);}",
      "#why .cx-why-node.is-lit svg{color:#bb86fc;filter:drop-shadow(0 0 8px rgba(187,134,252,.9));}",
      "#why .cx-why-bar-progress{position:absolute;left:50%;top:0;width:1px;height:100%;margin-left:-.5px;transform-origin:top center;transform:scaleY(0);background:linear-gradient(to bottom,#9d4edd,#bb86fc,#9d4edd);box-shadow:0 0 16px rgba(157,78,221,.8);z-index:1;}",
      "#why .cx-why-react-bar{display:none !important;}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function progress(value, lo, hi) {
    if (hi === lo) return value >= hi ? 1 : 0;
    return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
  }

  var activeHandler = null;
  var activeResize = null;

  function enhance() {
    var section = document.getElementById("why");
    if (!section) return null;

    var nodes = section.querySelectorAll('[data-testid^="why-node-"]');
    if (!nodes.length) return null;

    Array.prototype.forEach.call(nodes, function (node) {
      node.classList.add("cx-why-node");
      var ring = node.firstElementChild;
      if (ring) ring.classList.add("cx-why-icon-ring");
    });

    var track = section.querySelector(".relative.hidden.lg\\:block");
    if (!track && nodes[0].parentElement) {
      track = nodes[0].parentElement.parentElement;
    }
    if (!track) return null;

    // Hide the React/framer-motion bar that would otherwise sit under ours.
    var reactBar = track.querySelector('div[class*="origin-top"]');
    if (reactBar) reactBar.classList.add("cx-why-react-bar");

    var bar = track.querySelector(".cx-why-bar-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "cx-why-bar-progress";
      track.appendChild(bar);
    }

    return { track: track, nodes: nodes, bar: bar };
  }

  function start() {
    if (activeHandler) {
      window.removeEventListener("scroll", activeHandler);
      activeHandler = null;
    }
    if (activeResize) {
      window.removeEventListener("resize", activeResize);
      activeResize = null;
    }

    var ctx = enhance();
    if (!ctx) return false;

    var ticking = false;

    function update() {
      ticking = false;
      var rect = ctx.track.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;

      // Spread the fill across the full traversal of the track through the
      // viewport (top enters near the bottom, bottom leaves near the top) so the
      // glow travels slowly instead of snapping full within half a screen.
      var startTop = vh * 0.9;
      var endTop = vh * 0.1 - rect.height;
      var p = progress(rect.top, startTop, endTop);
      ctx.bar.style.transform = "scaleY(" + p + ")";

      var front = p * rect.height;
      Array.prototype.forEach.call(ctx.nodes, function (node) {
        var r = node.getBoundingClientRect();
        var center = r.top + r.height / 2 - rect.top;
        node.classList.toggle("is-lit", p > 0.001 && front >= center);
      });
    }

    activeHandler = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    activeResize = activeHandler;

    window.addEventListener("scroll", activeHandler, { passive: true });
    window.addEventListener("resize", activeResize);
    update();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Hero headline: the bundle fades the whole text block from opacity 1 to 0
  // across the first 500px of scroll. The user wants the headline to stay fully
  // readable (no dim) once the page loads, so we pin it to full opacity.
  // ---------------------------------------------------------------------------
  function fixHero() {
    var hero = document.querySelector('[data-testid="hero-section"]');
    if (!hero) return false;
    var fade = hero.querySelector('[x-id="Hero_40_8"]');
    if (!fade) return false;
    fade.style.setProperty("opacity", "1", "important");
    if (!document.getElementById("cx-hero-style")) {
      var s = document.createElement("style");
      s.id = "cx-hero-style";
      s.textContent =
        '#home [x-id="Hero_40_8"]{opacity:1 !important;}';
      document.head.appendChild(s);
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Process line: bundle drives a horizontal bar with a bidirectional scaleX, so
  // it retracts as you scroll back up. We want it to draw once toward the four
  // circles and stay lit. Recompute the fill ourselves and never shrink it below
  // the furthest point reached.
  // ---------------------------------------------------------------------------
  var processHandler = null;
  var processMax = 0;

  function fixProcess() {
    var section = document.querySelector('[data-testid="process-section"]');
    if (!section) return false;
    var track = section.querySelector('[x-id="Process_26_8"]');
    if (!track) return false;

    var base = track.querySelector('[x-id="Process_28_10"]');
    if (base) base.classList.add("cx-process-react-bar");

    if (!document.getElementById("cx-process-style")) {
      var s = document.createElement("style");
      s.id = "cx-process-style";
      s.textContent = [
        ".cx-process-react-bar{display:none !important;}",
        ".cx-process-fill{position:absolute;left:0;top:.5rem;height:1px;width:100%;transform-origin:left center;transform:scaleX(0);" +
          "background:linear-gradient(to right,#9d4edd,#e0aaff);box-shadow:0 0 14px rgba(157,78,221,.8);pointer-events:none;}",
        "@media (max-width:767px){.cx-process-fill{display:none;}}"
      ].join("\n");
      document.head.appendChild(s);
    }

    var fill = track.querySelector(".cx-process-fill");
    if (!fill) {
      fill = document.createElement("div");
      fill.className = "cx-process-fill";
      track.appendChild(fill);
    }

    if (processHandler) {
      window.removeEventListener("scroll", processHandler);
      window.removeEventListener("resize", processHandler);
      processHandler = null;
    }

    var ticking = false;
    function update() {
      ticking = false;
      var rect = track.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var p = progress(rect.top, vh * 0.85, vh * 0.45);
      if (p > processMax) processMax = p; // monotonic: never un-glow going up
      fill.style.transform = "scaleX(" + processMax + ")";
    }
    processHandler = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", processHandler, { passive: true });
    window.addEventListener("resize", processHandler);
    update();
    return true;
  }

  function applyAll() {
    injectStyles();
    fixHero();
    start();
    fixProcess();
  }

  function boot() {
    applyAll();
    var tries = 0;
    var timer = setInterval(function () {
      var ok = true;
      if (!document.querySelector("#why .cx-why-bar-progress")) ok = start() && ok;
      if (!document.getElementById("cx-hero-style")) ok = fixHero() && ok;
      if (!document.querySelector(".cx-process-fill")) ok = fixProcess() && ok;
      if (ok || ++tries > 40) clearInterval(timer);
    }, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  if (window.MutationObserver) {
    var mount = document.getElementById("root") || document.body;
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        var changed = false;
        if (document.getElementById("why") && !document.querySelector("#why .cx-why-bar-progress")) {
          injectStyles();
          start();
          changed = true;
        }
        if (document.querySelector('[data-testid="hero-section"]') && !document.getElementById("cx-hero-style")) {
          fixHero();
          changed = true;
        }
        if (document.querySelector('[data-testid="process-section"]') && !document.querySelector(".cx-process-fill")) {
          fixProcess();
          changed = true;
        }
      });
    });
    observer.observe(mount, { childList: true, subtree: true });
  }
})();