/* Work. Projects with no public picture get a cover drawn in the artwork's own
   characters, each one a picture of what the project measures or does. They are
   still until a visitor points at the project, then they run.
   The year on GitHub is drawn below as a field of stars. */
(() => {
  const FONT = '"IBM Plex Mono", monospace';
  const GROUND = [8, 10, 15];
  const TAU = Math.PI * 2;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hash = (x, y) => {
    let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  // A bump on a repeating cycle, centred at c with width w.
  const bump = (p, c, w) => { let d = Math.abs(p - c) % 1; d = Math.min(d, 1 - d); return Math.exp(-(d * d) / (2 * w * w)); };
  const fract = n => n - Math.floor(n);

  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => {
      t = fract(t);
      return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }

  // The same symbol set as the artwork, sorted by how much ink each one lays down.
  let glyphs = [];
  function measureGlyphs() {
    const sample = document.createElement('canvas');
    sample.width = sample.height = 24;
    const g = sample.getContext('2d', { willReadFrequently: true });
    g.font = `14px ${FONT}`; g.textBaseline = 'middle'; g.textAlign = 'center';
    glyphs = [...new Set(' .·,:;\'`^"-_=+~<>/\\|()[]{}!?ilI1trcfjvuxnzXYUJCLQ0OZmwqpdbkhao*#%&@$WMB8RNEHK2345679⊕×÷±°:')].map(char => {
      g.clearRect(0, 0, 24, 24); g.fillText(char, 12, 12);
      const data = g.getImageData(0, 0, 24, 24).data;
      let ink = 0;
      for (let i = 3; i < data.length; i += 4) ink += data[i];
      return { char, ink };
    }).sort((a, b) => a.ink - b.ink).map(g => g.char);
  }

  // A programmed temperature cycle: hold cool, ramp, hold warm, back again.
  const program = p => {
    p = fract(p);
    return smooth(.13, .2, p) - smooth(.42, .49, p) + smooth(.61, .68, p) - smooth(.87, .94, p);
  };

  // Distance in rows from a cell to a curve y(u), using the curve's span across
  // the cell's width so steep stretches stay joined.
  function rowsFrom(curve, u, v, du, rows) {
    const a = curve(u - du), b = curve(u + du), c = curve(u);
    const lo = Math.min(a, b, c), hi = Math.max(a, b, c);
    return (v < lo ? lo - v : v > hi ? v - hi : 0) * rows;
  }

  // Every cover returns the brightness of one cell (o.i, 0..1) and its colour (o.h, o.s).
  const COVERS = {
    // Rows are Wi-Fi subcarriers and columns are time. Breathing swells through
    // every subcarrier at its own phase and strength; a movement breaks it once.
    breath: {
      still: 3.2,
      field(u, v, t, o, c) {
        const x = u * 4.6 + t * .22;
        const gain = Math.pow(.5 + .5 * Math.sin(v * 13.1 + 2), 1.6) * (.55 + .45 * noise(3.7, v * 9));
        const crest = .5 + .5 * Math.sin(TAU * x + 1.4 * Math.sin(v * 4.1 + 1.1) + v * 1.8);
        const moved = bump(x / 4.6, .7, .028);
        const grain = noise(x * 9, v * c.rows * .6);
        const breath = gain * Math.pow(crest, 2.4) * (1 - moved);
        const burst = moved * Math.pow(grain, 1.5) * 1.1;
        const floor = .06 * gain * noise(x * 4 + 40, v * c.rows);
        o.i = Math.min(1, breath * 1.05 + burst + floor);
        o.h = 174 + 16 * moved; o.s = .72;
      }
    },
    // Lines of form text; one route crosses them and lights each step it reaches.
    path: {
      still: 5.6,
      field(u, v, t, o, c) {
        const route = s => .64 - .3 * s + .13 * Math.sin(s * TAU * 1.1 + .5);
        const q = Math.floor(u * c.cols), r = Math.floor(v * c.rows);
        const d = rowsFrom(route, u, v, .5 / c.cols, c.rows);
        let text = 0;
        if (r % 2 === 1 && r % 9 !== 7) {
          const k = q + r * 7, word = Math.floor(k / 6);
          const ends = 4 + Math.floor(hash(r, 9) * (c.cols - 6));
          if (k % 6 < 2 + Math.floor(hash(word, r) * 4) && q > 1 && q < ends) text = .13 + .06 * hash(q, r);
        }
        text *= smooth(.6, 3, d);
        const head = fract(t * .11) * 1.3 - .15;
        const lit = .5 + .5 * Math.exp(-((u - head) ** 2) / (2 * .04 * .04)) + (u < head ? .12 : 0);
        let i = Math.max(text, Math.exp(-(d * d) / (2 * .45 * .45)) * clamp(lit));
        for (const s of [.06, .3, .53, .76, .95]) {
          const dx = (u - s) * c.cols * .62, dy = (v - route(s)) * c.rows * 1.25;
          const dist = Math.hypot(dx, dy);
          const ring = Math.exp(-((dist - 1.6) ** 2) / .5) * (s < head ? 1 : .55);
          i = Math.max(i, ring, Math.exp(-(dist * dist) / .5) * (s < head ? 1 : .6));
        }
        o.i = i; o.h = 42; o.s = .62;
      }
    },
    // Temperature against time: cool holds, warm holds, and the ramps between.
    heat: {
      still: 0,
      field(u, v, t, o, c) {
        const x = u * .92 + t * .035;
        const level = s => .8 - .58 * program(s);
        const d = (v - level(x)) * c.rows;
        const edge = rowsFrom(level, x, v, .46 / c.cols, c.rows);
        const warm = program(x);
        let i = Math.exp(-(edge * edge) / (2 * .45 * .45));
        if (d > 0) i = Math.max(i, (.14 + .26 * warm) * (1 - smooth(0, c.rows * .75, d)) * (.75 + .5 * noise(x * 40, v * 12)));
        const setpoint = (Math.abs(v - .8) * c.rows < .5 || Math.abs(v - .22) * c.rows < .5) && Math.floor(u * c.cols) % 2 === 0;
        if (setpoint) i = Math.max(i, .09);
        o.i = i; o.h = 205 + 163 * warm; o.s = .6;
      }
    }
  };

  const covers = [...document.querySelectorAll('canvas.glyph-cover')].map(canvas => ({
    canvas, spec: COVERS[canvas.dataset.cover], g: canvas.getContext('2d'),
    project: canvas.closest('.project'), cols: 0, rows: 0, t: 0, ready: false
  })).filter(c => c.spec && c.g);

  function layout(c) {
    const box = c.canvas.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    c.canvas.width = Math.round(box.width * scale);
    c.canvas.height = Math.round(box.height * scale);
    c.scale = scale;
    c.fontSize = clamp(box.width / 47, 10, 14);
    c.cols = Math.max(12, Math.floor(box.width / (c.fontSize * .62)));
    c.rows = Math.max(8, Math.floor(box.height / (c.fontSize * 1.28)));
    c.small = document.createElement('canvas');
    c.small.width = c.cols; c.small.height = c.rows;
    c.sg = c.small.getContext('2d');
    c.pixels = c.sg.createImageData(c.cols, c.rows);
    return true;
  }

  const out = { i: 0, h: 0, s: 0 };
  function paint(c) {
    const { g, cols, rows, spec, pixels } = c;
    const W = c.canvas.width, H = c.canvas.height, cw = W / cols, ch = H / rows;
    const last = glyphs.length - 1, data = pixels.data, buckets = new Map();
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        spec.field((q + .5) / cols, (r + .5) / rows, c.t, out, c);
        const i = clamp(out.i), p = (r * cols + q) * 4;
        const [R, G, B] = hsl(out.h, out.s * (1 - .45 * i), .16 + .7 * Math.pow(i, .9));
        data[p] = R; data[p + 1] = G; data[p + 2] = B; data[p + 3] = 255 * Math.min(1, i * 1.4);
        if (i < .045) continue;
        const k = Math.round(Math.pow(i, .8) * last + (hash(q, r) - .5) * 7);
        const char = glyphs[Math.max(1, Math.min(last, k))];
        const key = `${Math.round(out.h / 8)}|${Math.round(i * 14)}`;
        let bucket = buckets.get(key);
        if (!bucket) {
          const [r2, g2, b2] = hsl(out.h, out.s * (1 - .5 * i), .3 + .62 * i);
          bucket = { colour: `rgb(${r2 | 0} ${g2 | 0} ${b2 | 0})`, cells: [] };
          buckets.set(key, bucket);
        }
        bucket.cells.push(char, (q + .5) * cw, (r + .5) * ch);
      }
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.fillStyle = `rgb(${GROUND.join(' ')})`;
    g.fillRect(0, 0, W, H);
    // A soft bloom of the same light behind the characters.
    c.sg.putImageData(pixels, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = .34;
    if ('filter' in g) g.filter = `blur(${Math.round(cw * 1.6)}px)`;
    g.drawImage(c.small, 0, 0, W, H);
    if ('filter' in g) g.filter = 'none';
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.font = `${c.fontSize * c.scale}px ${FONT}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const { colour, cells } of buckets.values()) {
      g.fillStyle = colour;
      for (let k = 0; k < cells.length; k += 3) g.fillText(cells[k], cells[k + 1], cells[k + 2]);
    }
  }

  // One cover runs at a time: the one being pointed at or focused.
  let active = null, raf = 0, then = 0;
  function frame(now) {
    raf = 0;
    if (!active) return;
    const dt = Math.min(.1, (now - then) / 1000 || 0);
    if (dt >= 1 / 30) {
      then = now;
      active.t += dt;
      paint(active);
    }
    raf = requestAnimationFrame(frame);
  }
  function run(c) {
    if (motion.matches || !c.ready) return;
    active = c;
    then = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function rest(c) { if (active === c) active = null; }

  async function startCovers() {
    if (!covers.length) return;
    try { await document.fonts.load(`12px ${FONT}`); } catch { /* the fallback monospace still draws */ }
    measureGlyphs();
    const resized = new ResizeObserver(entries => {
      for (const entry of entries) {
        const c = covers.find(c => c.canvas === entry.target);
        if (c && layout(c)) {
          if (!c.ready) c.t = c.spec.still;
          c.ready = true;
          paint(c);
        }
      }
    });
    for (const c of covers) {
      resized.observe(c.canvas);
      c.project.addEventListener('pointerenter', () => run(c));
      c.project.addEventListener('pointerleave', () => rest(c));
      c.project.addEventListener('focusin', () => run(c));
      c.project.addEventListener('focusout', () => rest(c));
    }
  }
  startCovers();

  /* GitHub activity. The saved year draws at once; when a visitor reaches it,
     the page asks GitHub's public calendar (through a free mirror) for fresher
     numbers and keeps the saved ones if that fails. */
  const box = document.getElementById('activity');
  if (!box || !window.GITHUB_ACTIVITY) return;
  const svg = box.querySelector('.activity-graph');
  const months = box.querySelector('.activity-months');
  const stats = box.querySelector('.activity-stats');
  const key = box.querySelector('.activity-key svg');
  const tip = box.querySelector('.activity-tip');
  const plot = box.querySelector('.activity-plot');
  const scroller = box.querySelector('.activity-scroll');
  const user = window.GITHUB_ACTIVITY.user;
  const P = 16;
  const SIZES = [.95, 1.5, 2.1, 2.75, 3.3, 3.8];
  let days = window.GITHUB_ACTIVITY.days, lead = 0, cols = 0, levelOf = () => 0;
  let sweep = 1;

  const asDate = s => new Date(`${s}T00:00:00Z`);
  const fmt = (s, opts) => asDate(s).toLocaleDateString('en-CA', { timeZone: 'UTC', ...opts });

  function star(x, y, level) {
    const r = SIZES[level];
    let m = '';
    if (level >= 4) m += `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#act-halo)" opacity="${level === 5 ? .55 : .35}"/>`;
    if (level === 5) {
      const L = 9.5, w = .5;
      m += `<path class="spike" opacity=".8" d="M${x - L} ${y}L${x} ${y - w}L${x + L} ${y}L${x} ${y + w}ZM${x} ${y - L}L${x + w} ${y}L${x} ${y + L}L${x - w} ${y}Z"/>`;
    }
    return m + `<circle class="s${level}" cx="${x}" cy="${y}" r="${r}"/>`;
  }

  function draw() {
    lead = asDate(days[0][0]).getUTCDay();
    cols = Math.ceil((lead + days.length) / 7);
    const nonzero = days.map(d => d[1]).filter(Boolean).sort((a, b) => a - b);
    const at = f => nonzero.length ? nonzero[Math.min(nonzero.length - 1, Math.floor(f * (nonzero.length - 1)))] : 1;
    const cuts = [at(.25), at(.5), at(.75), at(.93)];
    levelOf = n => n === 0 ? 0 : 1 + cuts.filter(c => n > c).length;

    const width = cols * P, height = 7 * P;
    let stars = '';
    days.forEach(([, n], i) => {
      const k = lead + i;
      stars += star(Math.floor(k / 7) * P + P / 2, (k % 7) * P + P / 2, levelOf(n));
    });
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = `<defs>
        <radialGradient id="act-halo"><stop offset="0" stop-color="#fff4ea" stop-opacity=".9"/><stop offset=".35" stop-color="#d6bcb0" stop-opacity=".35"/><stop offset="1" stop-color="#d6bcb0" stop-opacity="0"/></radialGradient>
        <linearGradient id="act-edge"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#2e2e2e"/></linearGradient>
        <mask id="act-sweep" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${width + 40}" height="${height + 40}">
          <rect x="-20" y="-20" width="${width + 40}" height="${height + 40}" fill="#2e2e2e"/>
          <rect class="lit" x="-20" y="-20" height="${height + 40}" fill="#fff"/>
          <rect class="edge" y="-20" width="${P * 6}" height="${height + 40}" fill="url(#act-edge)"/>
        </mask>
      </defs>
      <g class="stars"${sweep < 1 ? ' mask="url(#act-sweep)"' : ''}>${stars}</g>
      <circle class="pick" r="6.5" visibility="hidden"/>`;
    setSweep(sweep);

    // Each month is named over the week that holds its first day; the opening,
    // partial month only when there is room before the next name.
    const starts = [];
    days.forEach(([date], i) => { if (date.endsWith('-01')) starts.push([date, Math.floor((lead + i) / 7)]); });
    if (!days[0][0].endsWith('-01') && (!starts.length || starts[0][1] >= 3)) starts.unshift([days[0][0], 0]);
    months.textContent = '';
    let previous = -9;
    for (const [date, col] of starts) {
      if (col - previous < 3 || col > cols - 2) continue;
      previous = col;
      const label = document.createElement('span');
      label.textContent = fmt(date, { month: 'short' });
      label.style.left = `${(col / cols) * 100}%`;
      months.append(label);
    }

    const total = days.reduce((sum, d) => sum + d[1], 0);
    const busiest = days.reduce((a, b) => (b[1] > a[1] ? b : a));
    let run = 0, longest = 0;
    for (const [, n] of days) { run = n ? run + 1 : 0; longest = Math.max(longest, run); }
    stats.innerHTML = `<strong>${total.toLocaleString('en-CA')} contributions</strong> in the last year · busiest day ${fmt(busiest[0], { month: 'short', day: 'numeric', year: 'numeric' })}, ${busiest[1]} · longest streak ${longest} days`;
    svg.setAttribute('aria-label', `GitHub contributions over the last year: ${total} in total. The busiest day was ${fmt(busiest[0], { month: 'long', day: 'numeric', year: 'numeric' })}, with ${busiest[1]}.`);
    key.innerHTML = [0, 1, 2, 3, 4, 5].map(l => star(8 + l * 15.2, 8, l)).join('');
  }

  function setSweep(f) {
    const width = cols * P, edge = svg.querySelector('#act-sweep .edge'), lit = svg.querySelector('#act-sweep .lit');
    if (!edge || !lit) return;
    const x = -P * 6 + f * (width + P * 12);
    lit.setAttribute('width', Math.max(0, x + 20));
    edge.setAttribute('x', x);
  }

  // A year of light arrives once, oldest day first, when the graph is first seen.
  function reveal() {
    if (motion.matches) return;
    sweep = 0;
    svg.querySelector('.stars')?.setAttribute('mask', 'url(#act-sweep)');
    const start = performance.now(), duration = 1700;
    const step = now => {
      const k = clamp((now - start) / duration);
      sweep = 1 - Math.pow(1 - k, 3);
      setSweep(sweep);
      if (k < 1) requestAnimationFrame(step);
      else { sweep = 1; svg.querySelector('.stars')?.removeAttribute('mask'); }
    };
    requestAnimationFrame(step);
  }

  async function refresh() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`, { signal: controller.signal });
      if (!response.ok) return;
      const body = await response.json();
      const today = new Date().toISOString().slice(0, 10);
      const fresh = (body.contributions || [])
        .filter(d => typeof d?.date === 'string' && Number.isFinite(d.count) && d.date <= today)
        .map(d => [d.date, d.count]);
      if (fresh.length < 300) return;
      const changed = fresh.length !== days.length || fresh.some((d, i) => d[0] !== days[i][0] || d[1] !== days[i][1]);
      if (changed) { days = fresh; draw(); }
    } catch { /* keep the saved year */ }
    finally { clearTimeout(timer); }
  }

  function pickAt(event) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return null;
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * cols);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * 7);
    const i = col * 7 + row - lead;
    if (col < 0 || row < 0 || row > 6 || i < 0 || i >= days.length) return null;
    return { i, col, row, rect };
  }
  function showTip(event) {
    const hit = pickAt(event);
    const ring = svg.querySelector('.pick');
    if (!hit) { tip.hidden = true; ring?.setAttribute('visibility', 'hidden'); return; }
    const [date, n] = days[hit.i];
    const x = hit.col * P + P / 2, y = hit.row * P + P / 2;
    ring?.setAttribute('cx', x); ring?.setAttribute('cy', y); ring?.setAttribute('visibility', 'visible');
    tip.textContent = `${n === 0 ? 'No' : n} contribution${n === 1 ? '' : 's'} · ${fmt(date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
    const host = plot.getBoundingClientRect();
    tip.style.left = `${hit.rect.left - host.left + (x / (cols * P)) * hit.rect.width}px`;
    tip.style.top = `${hit.rect.top - host.top + (y / (7 * P)) * hit.rect.height}px`;
    tip.hidden = false;
  }
  svg.addEventListener('pointermove', showTip);
  svg.addEventListener('pointerdown', showTip);
  svg.addEventListener('pointerleave', () => { tip.hidden = true; svg.querySelector('.pick')?.setAttribute('visibility', 'hidden'); });

  draw();
  let seen = false;
  new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !seen) {
        seen = true;
        // Narrow screens scroll the year sideways; start at the latest week.
        scroller.scrollLeft = scroller.scrollWidth;
        reveal();
        refresh();
      }
    }
  }, { threshold: .35 }).observe(svg);
  // The panel may open at a narrow width after the first measure.
  new ResizeObserver(() => { if (!seen) scroller.scrollLeft = scroller.scrollWidth; }).observe(scroller);
})();
