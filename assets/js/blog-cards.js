/* Live previews for the learning-blog cards on the Links page.
   Each card's figure is a small, interactive version of a figure from its post,
   drawn in the site's two inks (black and red). */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var zh = (document.documentElement.lang || "").indexOf("zh") === 0;
  var INK = "var(--ink-color)", RED = "var(--accent-color)", SOFT = "var(--global-text-color-light)";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function E(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag), st = "";
    for (var k in attrs) {
      var v = String(attrs[k]);
      if ((k === "fill" || k === "stroke") && v.indexOf("var(") >= 0) st += k + ":" + v + ";";
      else e.setAttribute(k, v);
    }
    if (st) e.setAttribute("style", st);
    if (parent) parent.appendChild(e);
    return e;
  }
  function TX(parent, x, y, txt, attrs) {
    var a = { x: x, y: y, fill: SOFT, "font-size": "12" };
    for (var k in attrs || {}) a[k] = attrs[k];
    var t = E("text", a, parent);
    t.textContent = txt;
    return t;
  }
  function lin(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rng) { var u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  /* "f(X_k)" with a true subscript, since the text faces lack subscript digits */
  function sub(parent, x, y, k, anchor) {
    var t = E("text", { x: x, y: y, fill: INK, "font-size": "13", "font-style": "italic", "text-anchor": anchor }, parent);
    t.appendChild(document.createTextNode("f(X"));
    var s = E("tspan", { dy: "3", "font-size": "9.5", "font-style": "normal" }, t); s.textContent = k;
    var c = E("tspan", { dy: "-3" }, t); c.textContent = ")";
    return t;
  }
  function svgRoot(viewBox, label) { return E("svg", { viewBox: viewBox, role: "img", "aria-label": label }); }

  /* ---------- Covering numbers: the sample view for lines ax + b ---------- */
  function initCovering(root) {
    var POLY = [[-0.75, -1.25], [0.25, -0.25], [0.75, 1.25], [-0.25, 0.25]];
    function inPoly(p) { for (var i = 0; i < 4; i++) { var a = POLY[i], b = POLY[(i + 1) % 4]; if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) < -1e-12) return false; } return true; }
    function clipHalf(poly, f) { var out = []; for (var i = 0; i < poly.length; i++) { var P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q); if (fp >= 0) out.push(P); if ((fp >= 0) !== (fq >= 0)) { var t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); } } return out; }
    function stripExtent(lo, hi, ax) { var p = clipHalf(POLY, function (q) { return q[ax] - lo; }); p = clipHalf(p, function (q) { return hi - q[ax]; }); if (!p.length) return null; var o = 1 - ax, mn = Infinity, mx = -Infinity; p.forEach(function (q) { mn = Math.min(mn, q[o]); mx = Math.max(mx, q[o]); }); return [mn, mx]; }
    /* an explicit cover: strips of height 2e, best of two orientations and 16 offsets */
    function coverB(e) {
      var best = null;
      [1, 0].forEach(function (ax) {
        var lo0 = ax === 1 ? -1.25 : -0.75, hi0 = ax === 1 ? 1.25 : 0.75;
        for (var k = 0; k < 16; k++) {
          var off = 2 * e * k / 16, cs = [];
          for (var j = 0; ; j++) {
            var lo = lo0 - off + 2 * e * j; if (lo >= hi0) break;
            var ext = stripExtent(lo, lo + 2 * e, ax); if (!ext) continue;
            var n = Math.max(1, Math.ceil((ext[1] - ext[0]) / (2 * e) - 1e-9)), mid = (ext[0] + ext[1]) / 2;
            for (var i = 0; i < n; i++) { var u = mid - n * e + e * (2 * i + 1), w = lo + e; cs.push(ax === 1 ? [u, w] : [w, u]); }
          }
          if (!best || cs.length < best.length) best = cs;
        }
      });
      return best;
    }
    /* well-separated points: no two can share a ball, so at least this many balls are needed */
    function packB(e) {
      var s = 2 * e * (1 + 1e-7), best = [];
      for (var i = 0; i < 10; i++) for (var j = 0; j < 10; j++) {
        var ox = s * i / 10, oy = s * j / 10, pts = [];
        for (var a = 0; -0.75 + ox + a * s <= 0.75 + 1e-12; a++) for (var b = 0; -1.25 + oy + b * s <= 1.25 + 1e-12; b++) { var q = [-0.75 + ox + a * s, -1.25 + oy + b * s]; if (inPoly(q)) pts.push(q); }
        if (pts.length > best.length) best = pts;
      }
      return best;
    }
    var EMIN = 0.06, EMAX = 0.4;
    function epsOf(v) { return Math.exp(Math.log(EMIN) + (Math.log(EMAX) - Math.log(EMIN)) * v / 100); }
    var rx = lin(-0.95, 0.95, 58, 278.4), ry = lin(-1.35, 1.35, 337.2, 24);   /* equal px per unit, so balls stay square */

    var svg = svgRoot("0 0 290 380", zh ? "直线 ax + b 在两个数据点上的取值，以及覆盖它们的方块" : "Values of the lines ax + b at two data points, covered by squares");
    root.appendChild(svg);
    var ctl = h("div", "blog-card-ctl");
    var lab = h("label", null, zh ? "容差 ε" : "Tolerance ε"); lab.setAttribute("for", "bc-cov-eps");
    var inp = h("input"); inp.type = "range"; inp.id = "bc-cov-eps"; inp.min = "0"; inp.max = "100"; inp.step = "1"; inp.value = "40";
    var r1 = h("div", "blog-card-read"), r2 = h("div", "blog-card-read"), note = h("p", "blog-card-note", zh ? "每个方块是一个球：方块里的函数在两个数据点上与中心相差都不超过 ε。ε 越小，需要的球越多。" : "Each square is one ball: the functions within ε of its centre at both data points. The smaller ε, the more balls are needed.");
    ctl.appendChild(lab); ctl.appendChild(inp); ctl.appendChild(r1); ctl.appendChild(r2); ctl.appendChild(note);
    root.appendChild(ctl);

    function draw() {
      var e = epsOf(+inp.value), cs = coverB(e), lo = Math.max(packB(e).length, Math.ceil(1 / (4 * e * e) - 1e-9)), hi = cs.length;
      clear(svg);
      var defs = E("defs", {}, svg), cp = E("clipPath", { id: "bc-cov-clip" }, defs);
      E("rect", { x: rx(-0.95), y: ry(1.35), width: rx(0.95) - rx(-0.95), height: ry(-1.35) - ry(1.35) }, cp);
      [-0.5, 0, 0.5].forEach(function (v) { E("line", { x1: rx(v), x2: rx(v), y1: ry(-1.35), y2: ry(1.35), stroke: "var(--ink-rule-soft)", "stroke-width": 0.8 }, svg); TX(svg, rx(v), ry(-1.35) + 16, String(v).replace("-", "−"), { "text-anchor": "middle", "font-size": "11" }); });
      [-1, -0.5, 0, 0.5, 1].forEach(function (v) { E("line", { x1: rx(-0.95), x2: rx(0.95), y1: ry(v), y2: ry(v), stroke: "var(--ink-rule-soft)", "stroke-width": 0.8 }, svg); TX(svg, rx(-0.95) - 6, ry(v) + 4, String(v).replace("-", "−"), { "text-anchor": "end", "font-size": "11" }); });
      E("line", { x1: rx(-0.95), x2: rx(0.95), y1: ry(-1.35), y2: ry(-1.35), stroke: INK }, svg);
      E("line", { x1: rx(-0.95), x2: rx(-0.95), y1: ry(-1.35), y2: ry(1.35), stroke: INK }, svg);
      sub(svg, (rx(-0.95) + rx(0.95)) / 2, 374, "1", "middle");
      sub(svg, 8, 14, "2", "start");
      E("path", { d: POLY.map(function (q, i) { return (i ? "L" : "M") + rx(q[0]).toFixed(1) + "," + ry(q[1]).toFixed(1); }).join("") + "Z", fill: "rgba(29,26,22,0.06)", stroke: INK, "stroke-width": 1.6 }, svg);
      var g = E("g", { "clip-path": "url(#bc-cov-clip)" }, svg);
      cs.forEach(function (c) { E("rect", { x: rx(c[0] - e), y: ry(c[1] + e), width: rx(c[0] + e) - rx(c[0] - e), height: ry(c[1] - e) - ry(c[1] + e), fill: RED, "fill-opacity": 0.08, stroke: RED, "stroke-width": 0.9 }, g); });
      if (cs.length <= 90) cs.forEach(function (c) { E("path", { d: "M" + (rx(c[0]) - 3) + "," + ry(c[1]) + "h6M" + rx(c[0]) + "," + (ry(c[1]) - 3) + "v6", stroke: RED, "stroke-width": 1.2, fill: "none" }, g); });
      TX(svg, rx(0.42), ry(-0.95), "ax + b", { fill: INK, "font-size": "14", "font-style": "italic" });
      r1.textContent = "ε = " + e.toFixed(3);
      r2.textContent = (zh ? "所需球数：" : "balls needed: ") + (lo === hi ? String(hi) : lo + "–" + hi);
    }
    inp.addEventListener("input", draw);
    draw();
  }

  /* ---------- Transformer: attention arcs between the words of a sentence ---------- */
  function initTransformer(root) {
    var EMB = { the: [0.04, 0.1], bank: [0.6, 0.6], raised: [0.45, 0], rates: [1.3, 0.05], after: [0.12, -0.04], loan: [1.0, 0.25], losses: [1.2, -0.05],
                boat: [0.25, 1.0], drifted: [0, 0.5], to: [0.08, -0.03], river: [0.05, 1.3] };
    var SENT = { fin: ["the", "bank", "raised", "rates", "after", "loan", "losses"], riv: ["the", "boat", "drifted", "to", "the", "river", "bank"] };
    function attend(words, i) {
      var x = EMB[words[i]], q = [2.5 * x[0], 2.5 * x[1]];
      var s = words.map(function (w) { var k = EMB[w]; return (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2; });
      var m = Math.max.apply(null, s), ex = s.map(function (v) { return Math.exp(v - m); }), Z = ex.reduce(function (a, b) { return a + b; }, 0);
      return ex.map(function (v) { return v / Z; });
    }
    var sent = "fin", sel = 1;
    var svg = svgRoot("0 0 540 168", zh ? "句子中的注意力权重：所选的词与每个词之间的连线越粗，权重越大" : "Attention weights in a sentence: the thicker the arc from the selected word, the larger the weight");
    var wrap = h("div", "blog-card-scroll");
    wrap.appendChild(svg);
    root.appendChild(wrap);
    var ctl = h("div", "blog-card-ctl blog-card-ctl--row");
    var seg = h("span", "blog-card-seg"); seg.setAttribute("role", "group"); seg.setAttribute("aria-label", zh ? "句子" : "Sentence");
    var bFin = h("button", null, zh ? "金融新闻" : "Finance news"), bRiv = h("button", null, zh ? "河边故事" : "River story");
    bFin.type = bRiv.type = "button";
    seg.appendChild(bFin); seg.appendChild(bRiv);
    ctl.appendChild(seg);
    ctl.appendChild(h("span", "blog-card-hint", zh ? "把鼠标移到词上，或点一下" : "Hover over a word, or tap it"));
    root.appendChild(ctl);

    function draw() {
      var words = SENT[sent], a = attend(words, sel), n = words.length, slot = 520 / n;
      function cx(j) { return 10 + slot * (j + 0.5); }
      clear(svg);
      words.forEach(function (w, j) {
        var sw = 0.8 + 13 * a[j];
        if (j === sel) { var c = cx(j); E("path", { d: "M" + (c - 10) + ",84 C" + (c - 20) + ",48 " + (c + 20) + ",48 " + (c + 10) + ",84", fill: "none", stroke: RED, "stroke-width": sw, "stroke-opacity": 0.75, "stroke-linecap": "round" }, svg); }
        else { var x0 = cx(sel), x1 = cx(j), hh = Math.min(70, 18 + 0.3 * Math.abs(x1 - x0)); E("path", { d: "M" + x0.toFixed(1) + ",84 Q" + ((x0 + x1) / 2).toFixed(1) + "," + (84 - 2 * hh).toFixed(1) + " " + x1.toFixed(1) + ",84", fill: "none", stroke: RED, "stroke-width": sw, "stroke-opacity": 0.75, "stroke-linecap": "round" }, svg); }
      });
      E("line", { x1: 10, x2: 530, y1: 150, y2: 150, stroke: "var(--ink-rule-soft)" }, svg);
      words.forEach(function (w, j) {
        var c = cx(j), on = j === sel;
        E("rect", { x: c - slot / 2 + 4, y: 86, width: slot - 8, height: 30, rx: 3, fill: on ? RED : "none", stroke: on ? RED : INK, "stroke-width": 1.2 }, svg);
        TX(svg, c, 106, w, { "text-anchor": "middle", fill: on ? "var(--paper-color)" : INK, "font-size": "15", "font-weight": on ? "700" : "400" });
        var bh = Math.min(26, 56 * a[j]);
        E("rect", { x: c - 8, y: 150 - bh, width: 16, height: bh, fill: RED, "fill-opacity": 0.18, stroke: RED, "stroke-width": 1 }, svg);
        TX(svg, c, 164, a[j].toFixed(2), { "text-anchor": "middle", "font-size": "11", fill: RED });
        var hit = E("rect", { x: c - slot / 2 + 4, y: 86, width: slot - 8, height: 30, fill: "transparent", class: "blog-card-hit", tabindex: "0", role: "button", "aria-label": (zh ? "选择词 " : "Select the word ") + w }, svg);
        function pick() { if (sel !== j) { sel = j; draw(); } }
        hit.addEventListener("mouseenter", pick);
        hit.addEventListener("click", pick);
        hit.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
      });
      bFin.setAttribute("aria-pressed", String(sent === "fin"));
      bRiv.setAttribute("aria-pressed", String(sent === "riv"));
    }
    bFin.addEventListener("click", function () { sent = "fin"; sel = SENT.fin.indexOf("bank"); draw(); });
    bRiv.addEventListener("click", function () { sent = "riv"; sel = SENT.riv.indexOf("bank"); draw(); });
    draw();
  }

  /* ---------- Diffusion model: samples walking back from noise to data ---------- */
  function initDdpm(root) {
    var COMPS = [{ w: 0.7, m: [0.5, -0.4], s: 0.3 }, { w: 0.3, m: [-1.3, 1.1], s: 0.35 }];   /* calm days, stressed days */
    var T = 1000, beta = new Float64Array(T + 1), alpha = new Float64Array(T + 1), abar = new Float64Array(T + 1);
    abar[0] = 1;
    for (var t = 1; t <= T; t++) { beta[t] = 1e-4 + (0.02 - 1e-4) * (t - 1) / (T - 1); alpha[t] = 1 - beta[t]; abar[t] = abar[t - 1] * alpha[t]; }
    /* the exact best guess E[x0 | x_t] for the two-cluster mixture, turned into a noise guess */
    function epsHat(x, y, t) {
      var a = Math.sqrt(abar[t]), b2 = 1 - abar[t], lw = [], mk = [];
      COMPS.forEach(function (c) { var v = a * a * c.s * c.s + b2, dx = x - a * c.m[0], dy = y - a * c.m[1]; lw.push(Math.log(c.w) - Math.log(v) - (dx * dx + dy * dy) / (2 * v)); var g = a * c.s * c.s / v; mk.push([c.m[0] + g * dx, c.m[1] + g * dy]); });
      var mx = Math.max(lw[0], lw[1]), r0 = Math.exp(lw[0] - mx), r1 = Math.exp(lw[1] - mx), Z = r0 + r1;
      var hx = (r0 * mk[0][0] + r1 * mk[1][0]) / Z, hy = (r0 * mk[0][1] + r1 * mk[1][1]) / Z, b = Math.sqrt(b2);
      return [(x - a * hx) / b, (y - a * hy) / b];
    }
    var N = 300, frames = [];
    function run(sd) {
      var rng = mulberry32(sd), x = new Float64Array(N), y = new Float64Array(N), i;
      for (i = 0; i < N; i++) { x[i] = gauss(rng); y[i] = gauss(rng); }
      frames = new Array(101);
      function keep(tt) { var f = new Float32Array(2 * N); for (var j = 0; j < N; j++) { f[2 * j] = x[j]; f[2 * j + 1] = y[j]; } frames[tt / 10] = f; }
      keep(T);
      for (var s = T; s >= 1; s--) {
        var c1 = 1 / Math.sqrt(alpha[s]), c2 = beta[s] / Math.sqrt(1 - abar[s]), sg = Math.sqrt(beta[s]);
        for (i = 0; i < N; i++) { var e = epsHat(x[i], y[i], s), nx = c1 * (x[i] - c2 * e[0]), ny = c1 * (y[i] - c2 * e[1]); if (s > 1) { nx += sg * gauss(rng); ny += sg * gauss(rng); } x[i] = nx; y[i] = ny; }
        if ((s - 1) % 10 === 0) keep(s - 1);
      }
    }
    var sx = lin(-3, 3, 10, 250), sy = lin(-3, 3, 250, 10);
    var svg = svgRoot("0 0 260 260", zh ? "扩散模型的采样：点从噪声一步步变成两簇数据" : "Diffusion sampling: points move from noise to two clusters of data");
    root.appendChild(svg);
    E("rect", { x: 10, y: 10, width: 240, height: 240, fill: "none", stroke: "var(--ink-rule-soft)" }, svg);
    var drng = mulberry32(20200619);
    for (var d = 0; d < N; d++) { var c = drng() < 0.7 ? COMPS[0] : COMPS[1]; E("circle", { cx: sx(c.m[0] + c.s * gauss(drng)), cy: sy(c.m[1] + c.s * gauss(drng)), r: 1.5, fill: INK, "fill-opacity": 0.16 }, svg); }
    var paths = [], dots = [];
    for (var p = 0; p < 3; p++) paths.push(E("path", { fill: "none", stroke: RED, "stroke-width": 1, "stroke-opacity": 0.45 }, svg));
    for (var q = 0; q < N; q++) dots.push(E("circle", { r: 2.1, fill: RED, "fill-opacity": 0.85 }, svg));
    var tLabel = TX(svg, 16, 26, "", { fill: INK, "font-size": "13", "font-weight": "700" });
    var ctl = h("div", "blog-card-ctl");
    var play = h("button", "blog-card-play", zh ? "▶ 播放" : "▶ Play"); play.type = "button";
    var lab = h("label", null, zh ? "噪声 → 数据" : "Noise → data"); lab.setAttribute("for", "bc-ddpm-p");
    var inp = h("input"); inp.type = "range"; inp.id = "bc-ddpm-p"; inp.min = "0"; inp.max = "100"; inp.step = "1"; inp.value = "100";
    var note = h("p", "blog-card-note", zh ? "从纯噪声出发，每一步去掉一点模型预测的噪声。最后得到两类交易日：平静日和压力日。" : "Start from pure noise and remove a little predicted noise at each step. The result: calm days and stressed days.");
    ctl.appendChild(play); ctl.appendChild(lab); ctl.appendChild(inp); ctl.appendChild(note);
    root.appendChild(ctl);

    function draw(prog) {
      var tt = 1000 - 10 * prog, kt = tt / 10, f = frames[kt];
      for (var i = 0; i < N; i++) {
        var px = f[2 * i], py = f[2 * i + 1], inside = Math.abs(px) <= 3 && Math.abs(py) <= 3;   /* keep the cloud inside its frame */
        dots[i].setAttribute("cx", sx(px).toFixed(1)); dots[i].setAttribute("cy", sy(py).toFixed(1)); dots[i].setAttribute("r", inside ? "2.1" : "0");
      }
      paths.forEach(function (path, j) {
        var dd = "";
        if (kt < 100) { for (var k = 100; k >= kt; k -= 2) dd += (k === 100 ? "M" : "L") + sx(frames[k][2 * j]).toFixed(1) + "," + sy(frames[k][2 * j + 1]).toFixed(1); if ((100 - kt) % 2) dd += "L" + sx(frames[kt][2 * j]).toFixed(1) + "," + sy(frames[kt][2 * j + 1]).toFixed(1); }
        path.setAttribute("d", dd || "M0,0");
      });
      tLabel.textContent = "t = " + tt;
      inp.value = String(prog);
    }
    var raf = 0;
    function animate() {
      cancelAnimationFrame(raf);
      if (reduceMotion) { draw(100); return; }
      var start = performance.now();
      function tick(now) { var pr = Math.min(100, Math.round((now - start) / 3200 * 100)); draw(pr); if (pr < 100) raf = requestAnimationFrame(tick); }
      raf = requestAnimationFrame(tick);
    }
    play.addEventListener("click", animate);
    inp.addEventListener("input", function () { cancelAnimationFrame(raf); draw(+inp.value); });
    run(3 * 7919);
    draw(100);
    /* play once when the card first comes into view */
    if (!reduceMotion && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) { io.disconnect(); animate(); } }, { threshold: 0.5 });
      io.observe(root);
    }
  }

  /* ---------- CoVaR: the system's tail on the bank's bad days versus a normal day ---------- */
  function initCovar(root) {
    /* bank X ~ N(0, 2^2); system Y = lam*0.45*X + (1 + lam*0.5*max(0,-X))*eps; q = 5% */
    var Z = -1.6448536, VI = 2 * Z, N = 400, BAND = 0.35;
    function condQ(x, lam) { return lam * 0.45 * x + (1 + lam * 0.5 * Math.max(0, -x)) * Z; }
    var rng = mulberry32(20080915), Z1 = [], Z2 = [];
    for (var i = 0; i < N; i++) { Z1.push(gauss(rng)); Z2.push(gauss(rng)); }
    var sx = lin(-7, 6, 10, 250), sy = lin(-11, 6, 250, 10);
    var svg = svgRoot("0 0 260 260", zh ? "银行与金融系统的日收益率散点图，以及 CoVaR 和 ΔCoVaR" : "Daily returns of a bank and the financial system, with CoVaR and ΔCoVaR");
    root.appendChild(svg);
    E("rect", { x: 10, y: 10, width: 240, height: 240, fill: "none", stroke: "var(--ink-rule-soft)" }, svg);
    E("rect", { x: sx(VI - BAND), y: 10, width: sx(VI + BAND) - sx(VI - BAND), height: 240, fill: RED, "fill-opacity": 0.09 }, svg);
    E("rect", { x: sx(-BAND), y: 10, width: sx(BAND) - sx(-BAND), height: 240, fill: INK, "fill-opacity": 0.06 }, svg);
    TX(svg, sx(VI), 24, zh ? "银行困境" : "bank in distress", { "text-anchor": "middle", fill: RED, "font-size": "11" });
    TX(svg, sx(0), 24, zh ? "正常日" : "normal day", { "text-anchor": "middle", fill: INK, "font-size": "11" });
    var dots = [];
    for (var d = 0; d < N; d++) dots.push(E("circle", { r: 1.8, fill: SOFT, "fill-opacity": 0.55 }, svg));
    var coBar = E("line", { stroke: RED, "stroke-width": 3.4, "stroke-linecap": "round" }, svg);
    var medBar = E("line", { stroke: INK, "stroke-width": 3.4, "stroke-linecap": "round" }, svg);
    var bracket = E("path", { stroke: RED, "stroke-width": 2, fill: "none" }, svg);
    var dLabel = TX(svg, 0, 0, "", { fill: RED, "font-size": "12", "font-weight": "700" });

    var ctl = h("div", "blog-card-ctl");
    var lab = h("label", null, zh ? "银行与系统的联系" : "Link to the system"); lab.setAttribute("for", "bc-covar-lam");
    var inp = h("input"); inp.type = "range"; inp.id = "bc-covar-lam"; inp.min = "0"; inp.max = "1"; inp.step = "0.05"; inp.value = "1";
    var r1 = h("div", "blog-card-read");
    var note = h("p", "blog-card-note", zh ? "红线是银行陷入困境时系统的 5% 分位数（CoVaR），黑线是正常日的。两者之差 ΔCoVaR 就是这家银行对系统性风险的贡献；联系越弱，贡献越小。" : "The red bar is the system's 5% quantile on the bank's bad days (CoVaR), the black bar the same on a normal day. Their gap, ΔCoVaR, is the bank's contribution to systemic risk; the weaker the link, the smaller it is.");
    ctl.appendChild(lab); ctl.appendChild(inp); ctl.appendChild(r1); ctl.appendChild(note);
    root.appendChild(ctl);

    function draw() {
      var lam = +inp.value, cEq = condQ(VI, lam), cMed = condQ(0, lam), bx = sx(BAND + 0.9);
      for (var i = 0; i < N; i++) {
        var x = 2 * Z1[i], y = lam * 0.45 * x + (1 + lam * 0.5 * Math.max(0, -x)) * Z2[i];
        var inBand = Math.abs(x - VI) <= BAND;
        dots[i].setAttribute("cx", sx(x).toFixed(1)); dots[i].setAttribute("cy", sy(Math.max(-11, Math.min(6, y))).toFixed(1));
        dots[i].setAttribute("style", "fill:" + (inBand ? RED : SOFT) + ";fill-opacity:" + (inBand ? 0.9 : 0.5));
      }
      coBar.setAttribute("x1", sx(VI - BAND - 0.3)); coBar.setAttribute("x2", sx(VI + BAND + 0.3)); coBar.setAttribute("y1", sy(cEq)); coBar.setAttribute("y2", sy(cEq));
      medBar.setAttribute("x1", sx(-BAND - 0.3)); medBar.setAttribute("x2", sx(BAND + 0.3)); medBar.setAttribute("y1", sy(cMed)); medBar.setAttribute("y2", sy(cMed));
      bracket.setAttribute("d", Math.abs(cEq - cMed) > 0.05 ? "M" + bx + "," + sy(cMed) + "V" + sy(cEq) + "M" + (bx - 4) + "," + sy(cMed) + "H" + (bx + 4) + "M" + (bx - 4) + "," + sy(cEq) + "H" + (bx + 4) : "M0,0");
      dLabel.setAttribute("x", bx + 7); dLabel.setAttribute("y", (sy(cMed) + sy(cEq)) / 2 + 4);
      dLabel.textContent = "ΔCoVaR";
      r1.textContent = "ΔCoVaR = " + (cEq - cMed).toFixed(2).replace("-", "−") + "%";
    }
    inp.addEventListener("input", draw);
    draw();
  }

  var INIT = { covering: initCovering, transformer: initTransformer, ddpm: initDdpm, covar: initCovar };
  Array.prototype.forEach.call(document.querySelectorAll("[data-blog-fig]"), function (node) {
    var f = INIT[node.getAttribute("data-blog-fig")];
    if (f) f(node);
  });
})();
