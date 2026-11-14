/* Each photograph has a hand-placed motion score in space-motion.js.
   Flow follows its own pillars, arms, shells, bands or tidal filaments.
   The photo and stars stay anchored; the field and local star light animate.
   The score also cuts the picture into lanes that follow those structures.
   Each lane carries its symbols along at its own speed, and runs hot in places.
   Character layers update at 30 Hz; tile flips run at display refresh. */
(() => {
  const canvas = document.getElementById('field');
  const hero = document.querySelector('.sky');
  const images = window.SPACE_IMAGES;
  if (!canvas || !images?.length) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const caption = document.getElementById('caption');
  const announcement = document.getElementById('field-status');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const FONT = '"IBM Plex Mono", monospace';
  const GROUND = '#07090d';
  // How much of the plain photograph shows behind the characters. At 0 the
  // characters are the picture: the photograph is seen only through their ink.
  const UNDER = 0;
  // A heavily blurred copy of the photograph glows behind the characters. It has
  // no detail of its own; it gives the picture its masses of light and colour.
  const BLOOM = .4;
  const COLOUR = 1.8;  // saturation of the symbols: 1 is the photograph's own
  const SHINE = .45;   // extra light added to every symbol, 0 for none
  const SKY = .22;     // strength of the faint symbols in empty sky, 0 for none
  // Each photograph is exposed for itself. floor is its sky level and ceil its
  // brightest gas; brightness is stretched between the two before anything is
  // drawn, so a faint deep field uses the whole range of symbols just as a
  // bright nebula does. This table also lifts the dark tones (by 0..255).
  const exposure = (floor, ceil) => Float32Array.from({ length: 256 }, (_, l) => {
    const t = l / 255, seen = clamp((t - floor * .9) / (ceil - floor * .9));
    return Math.min(5, Math.pow(seen, .6) / Math.max(t, .004));
  });
  let mask = null, mg = null; // the characters of the scene being painted, as a stencil
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const hash = (n) => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  let W = 0, H = 0, scale = 1, fontSize = 12, cellW = 8, cellH = 13;
  let current = null, upcoming = null;
  let tiles = [], tileCols = 0, tileRows = 0, clicks = 0;
  // Section pages lie behind the artwork: 1 while every tile is turned to show
  // the page, 0 for the artwork. pageDone settles the flip in progress.
  let pageTarget = 0, pageDone = null, pageFlips = 0;
  let tileW = 72, tileH = 56;
  let visible = true, raf = 0, lastTime = 0, time = 0, renderedAt = -Infinity;
  const TICK = 1 / 32; // character layers update at about 30 Hz
  let bag = [], failed = new Set(), glyphs = [];
  const cache = new Map();


  // Shuffle without replacement, including across the boundary of two bags.
  function pick(exclude) {
    if (!bag.length) {
      bag = images.map((_, i) => i).filter(i => !failed.has(i) && i !== exclude);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  }

  function load(index) {
    if (!cache.has(index)) {
      cache.set(index, new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = async () => {
          try { await img.decode(); resolve(img); } catch (e) { reject(e); }
        };
        img.onerror = reject;
        img.src = images[index].src;
      }));
    }
    return cache.get(index);
  }

  // Sort 90+ symbols by actual ink coverage in the loaded font. This avoids
  // arbitrary brightness steps and keeps stars, wisps and dust lanes distinct.
  function measureGlyphs() {
    const sample = document.createElement('canvas');
    sample.width = 24; sample.height = 24;
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

  function makeLayer() {
    const layer = document.createElement('canvas');
    layer.width = canvas.width; layer.height = canvas.height;
    const g = layer.getContext('2d');
    g.setTransform(scale, 0, 0, scale, 0, 0);
    return { layer, g };
  }

  // Builds a scene in one go, for the first photograph and after a resize.
  function prepare(index, img) {
    const steps = prepareSteps(index, img);
    let step;
    do step = steps.next(); while (!step.done);
    return step.value;
  }

  // Builds a scene a few milliseconds at a time, so the artwork keeps moving
  // while the next photograph is readied.
  async function prepareGently(index, img) {
    const steps = prepareSteps(index, img);
    let step, slice = performance.now();
    while (!(step = steps.next()).done) {
      if (performance.now() - slice > 6) {
        await new Promise(resolve => setTimeout(resolve));
        slice = performance.now();
      }
    }
    return step.value;
  }

  function* prepareSteps(index, img) {
    const info = images[index];
    const { layer, g } = makeLayer();
    const { layer: photo, g: pg } = makeLayer();
    const ratio = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const sw = W / ratio, sh = H / ratio;
    const sx = (img.naturalWidth - sw) * info.fx, sy = (img.naturalHeight - sh) * info.fy;
    pg.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    g.fillStyle = GROUND; g.fillRect(0, 0, W, H);
    g.globalAlpha = .3; g.drawImage(photo, 0, 0, W, H); g.globalAlpha = 1;
    yield;
    const cols = Math.ceil(W / cellW), rows = Math.ceil(H / cellH);
    const sample = document.createElement('canvas');
    sample.width = cols * 2; sample.height = rows * 2;
    const sg = sample.getContext('2d', { willReadFrequently: true });
    sg.drawImage(photo, 0, 0, photo.width, photo.height, 0, 0, sample.width, sample.height);
    let data;
    try { data = sg.getImageData(0, 0, sample.width, sample.height).data; }
    catch (_) { // Direct file:// previews may disallow pixel reads.
      g.globalAlpha = .65; g.drawImage(photo, 0, 0, W, H);
      return { index, img, layer, photo, data: null };
    }
    const scene = { index, img, layer, photo, g, data, cols, rows,
      sampleW: sample.width, sampleH: sample.height, paintedAt: -Infinity };
    // Is there light in this cell? Judged by the brightest thing inside it, not
    // its average: a small galaxy or a thin filament fills only part of a cell
    // and would otherwise be averaged away into the dark around it.
    const fine = document.createElement('canvas');
    fine.width = cols * 4; fine.height = rows * 4;
    const fg = fine.getContext('2d', { willReadFrequently: true });
    fg.imageSmoothingQuality = 'high';
    fg.drawImage(photo, 0, 0, photo.width, photo.height, 0, 0, fine.width, fine.height);
    const fd = fg.getImageData(0, 0, fine.width, fine.height).data;
    yield;
    scene.peak = new Float32Array(cols * rows);
    const brightest = new Uint8ClampedArray(cols * rows * 3); // colour of that brightest thing
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let top = -1, where = 0;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
        const o = ((r * 4 + j) * fine.width + c * 4 + i) * 4;
        const l = .2126 * fd[o] + .7152 * fd[o+1] + .0722 * fd[o+2];
        if (l > top) { top = l; where = o; }
      }
      const at = r * cols + c;
      scene.peak[at] = top / 255;
      brightest[at*3] = fd[where]; brightest[at*3+1] = fd[where+1]; brightest[at*3+2] = fd[where+2];
    }
    // The photograph's overall colour, lightened: the tint of its sky symbols.
    let tr = 0, tg = 0, tb = 0, tw = 0;
    for (let at = 0; at < cols * rows; at++) {
      const wgt = scene.peak[at] * scene.peak[at];
      tr += brightest[at*3] * wgt; tg += brightest[at*3+1] * wgt; tb += brightest[at*3+2] * wgt; tw += wgt;
    }
    const tmax = Math.max(tr, tg, tb, 1) / 210;
    scene.tint = `rgb(${(tr / tmax * .6 + 150 * .4) | 0},${(tg / tmax * .6 + 165 * .4) | 0},${(tb / tmax * .6 + 200 * .4) | 0})`;
    const ranked = Float32Array.from(scene.peak).sort();
    scene.floor = Math.min(.08, ranked[Math.floor(ranked.length * .1)]);
    scene.ceil = Math.max(.3, ranked[Math.floor(ranked.length * .96)]);
    // Characters cannot hold detail finer than a cell: a thin bright rim, a
    // thread of gas, a star. Those are kept as real pixels of the photograph,
    // drawn over the characters. Two things qualify:
    //   the very brightest parts (star cores keep their true profile), and
    //   anything that stands out from its own blurred surroundings (fine lines and points).
    // Smooth areas, however bright, are left entirely to the characters.
    const { layer: highlights, g: hg } = makeLayer();
    const pixels = pg.getImageData(0, 0, photo.width, photo.height);
    const small = document.createElement('canvas');
    small.width = Math.max(1, Math.round(photo.width / 10)); small.height = Math.max(1, Math.round(photo.height / 10));
    const smg = small.getContext('2d');
    smg.imageSmoothingQuality = 'high';
    smg.drawImage(photo, 0, 0, small.width, small.height);
    const { layer: soft, g: softG } = makeLayer();
    softG.setTransform(1, 0, 0, 1, 0, 0);
    softG.imageSmoothingQuality = 'high';
    softG.drawImage(small, 0, 0, photo.width, photo.height);
    const around = softG.getImageData(0, 0, photo.width, photo.height).data;
    yield;
    const rowBytes = photo.width * 4;
    for (let row = 0; row < pixels.data.length; row += rowBytes) {
      for (let i = row; i < row + rowBytes; i += 4) {
        const l = (.2126 * pixels.data[i] + .7152 * pixels.data[i+1] + .0722 * pixels.data[i+2]) / 255;
        const blurred = (.2126 * around[i] + .7152 * around[i+1] + .0722 * around[i+2]) / 255;
        const bright = clamp((l - .6) / .35), fine = clamp((l - blurred - .045) / .15);
        const k = Math.max(bright * bright * (3 - 2 * bright), fine * fine * (3 - 2 * fine));
        pixels.data[i+3] = Math.round(255 * k);
      }
      yield;
    }
    hg.putImageData(pixels, 0, 0);
    yield;
    scene.highlights = highlights;
    scene.bloom = small;
    // A small brightness map of the whole photograph, uncropped. Scores that
    // trace an object's real outline measure it from this.
    const whole = document.createElement('canvas');
    whole.width = 128; whole.height = Math.max(1, Math.round(128 * img.naturalHeight / img.naturalWidth));
    const wg = whole.getContext('2d', { willReadFrequently: true });
    wg.imageSmoothingQuality = 'high';
    wg.drawImage(img, 0, 0, whole.width, whole.height);
    const wd = wg.getImageData(0, 0, whole.width, whole.height).data;
    const light = new Float32Array(whole.width * whole.height);
    for (let i = 0; i < light.length; i++) light[i] = (.2126 * wd[i*4] + .7152 * wd[i*4+1] + .0722 * wd[i*4+2]) / 255;
    yield;
    scene.motion = window.SpaceMotion.compile(info,
      { sx, sy, sw, sh, iw: img.naturalWidth, ih: img.naturalHeight }, cols, rows, cellW, cellH, W, H,
      { light, w: whole.width, h: whole.height });
    yield;
    scene.stars = findStars(scene);
    yield;
    // Characters stand back from detected stars, so their real profiles stay clean.
    scene.guard = new Float32Array(cols * rows);
    for (const star of scene.stars) {
      const reach = star.radius * .9;
      const c0 = Math.max(0, Math.floor((star.x - reach) / cellW)), c1 = Math.min(cols - 1, Math.ceil((star.x + reach) / cellW));
      const r0 = Math.max(0, Math.floor((star.y - reach) / cellH)), r1 = Math.min(rows - 1, Math.ceil((star.y + reach) / cellH));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const v = clamp(1 - Math.hypot((c + .5) * cellW - star.x, (r + .5) * cellH - star.y) / reach);
        scene.guard[r * cols + c] = Math.max(scene.guard[r * cols + c], v * v * (3 - 2 * v));
      }
    }
    // The photograph at full resolution, lifted and saturated. It is never
    // drawn directly: it only appears inside the strokes of the characters, so
    // each symbol carries the real detail and colour of the pixels it covers.
    const { layer: vivid, g: vg } = makeLayer();
    const lift = exposure(scene.floor, scene.ceil);
    const lit = pg.getImageData(0, 0, photo.width, photo.height), p = lit.data;
    yield;
    for (let row = 0; row < p.length; row += rowBytes) {
      for (let i = row; i < row + rowBytes; i += 4) {
        const l = .2126 * p[i] + .7152 * p[i+1] + .0722 * p[i+2], gain = lift[l | 0];
        p[i] = Math.max(0, Math.min(255, (l + (p[i] - l) * COLOUR) * gain));
        p[i+1] = Math.max(0, Math.min(255, (l + (p[i+1] - l) * COLOUR) * gain));
        p[i+2] = Math.max(0, Math.min(255, (l + (p[i+2] - l) * COLOUR) * gain));
      }
      yield;
    }
    vg.putImageData(lit, 0, 0);
    yield;
    // A character's strokes mostly miss an object smaller than its cell, and
    // would show the dark around it. So each cell is also given the colour of
    // the brightest thing inside it, and whichever is lighter wins.
    const cellLight = document.createElement('canvas');
    cellLight.width = cols; cellLight.height = rows;
    const cg = cellLight.getContext('2d'), cd = cg.createImageData(cols, rows);
    for (let at = 0; at < cols * rows; at++) {
      const r0 = brightest[at*3], g0 = brightest[at*3+1], b0 = brightest[at*3+2];
      const l = .2126 * r0 + .7152 * g0 + .0722 * b0, gain = lift[l | 0];
      cd.data[at*4] = (l + (r0 - l) * COLOUR) * gain;
      cd.data[at*4+1] = (l + (g0 - l) * COLOUR) * gain;
      cd.data[at*4+2] = (l + (b0 - l) * COLOUR) * gain;
      cd.data[at*4+3] = 255;
    }
    cg.putImageData(cd, 0, 0);
    vg.globalCompositeOperation = 'lighten';
    vg.imageSmoothingEnabled = true; vg.imageSmoothingQuality = 'high';
    vg.drawImage(cellLight, 0, 0, cols * cellW, rows * cellH);
    vg.globalCompositeOperation = 'source-over';
    scene.vivid = vivid;
    paintScene(scene);
    return scene;
  }

  function findStars(scene) {
    if (!scene.motion.stars) return [];
    const { data, sampleW: sw, sampleH: sh } = scene;
    const light = new Float32Array(sw * sh);
    for (let i = 0; i < light.length; i++) light[i] = (.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2])/255;
    const peaks = [];
    for (let y = 3; y < sh-3; y++) for (let x = 3; x < sw-3; x++) {
      const i = y*sw+x, l = light[i];
      if (l < .35 || l <= light[i-1] || l < light[i+1] || l < light[i-sw] || l < light[i+sw]) continue;
      const surround = (light[i-3]+light[i+3]+light[i-3*sw]+light[i+3*sw]+light[i-2*sw-2]+light[i-2*sw+2]+light[i+2*sw-2]+light[i+2*sw+2])/8;
      const contrast = l - surround;
      if (contrast > .16) peaks.push({ x: (x+.5)/sw*W, y: (y+.5)/sh*H, strength: contrast, phase: hash(i)*Math.PI*2 });
    }
    peaks.sort((a,b)=>b.strength-a.strength);
    const stars = [];
    for (const peak of peaks) {
      if (stars.some(s=>Math.hypot(s.x-peak.x,s.y-peak.y)<20)) continue;
      const radius = 12 + peak.strength*18;
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = Math.ceil(radius*2*scale);
      const g = sprite.getContext('2d'); g.setTransform(scale,0,0,scale,0,0);
      g.drawImage(scene.photo, -(peak.x-radius), -(peak.y-radius), W, H);
      g.globalCompositeOperation = 'destination-in';
      const mask = g.createRadialGradient(radius,radius,0,radius,radius,radius);
      mask.addColorStop(0,'#000');mask.addColorStop(.25,'rgba(0,0,0,.8)');mask.addColorStop(1,'transparent');
      g.fillStyle=mask;g.fillRect(0,0,radius*2,radius*2);
      stars.push({ ...peak, radius, sprite });
      if (stars.length === 60) break;
    }
    return stars;
  }

  function paintScene(scene) {
    // Cache only between animation ticks, never the actual character pattern.
    if (!scene.data || time - scene.paintedAt < TICK) return;
    const elapsed = clamp(time - scene.paintedAt, 0, .05);
    scene.paintedAt = time;
    const field = scene.motion;
    field.step(elapsed); // carry pointer dye along this photograph's currents
    const { dye } = field;
    const flow = new Float32Array(2), last = glyphs.length - 1;
    const { g, data, cols, rows, sampleW: sw, sampleH: sh, guard, peak, floor } = scene;
    const stretch = 1 / (scene.ceil - floor * .9);
    // 1. Draw the characters as a stencil. 2. Show the photograph through it.
    mg.globalCompositeOperation = 'source-over';
    mg.clearRect(0, 0, W, H);
    mg.fillStyle = '#fff';
    mg.font = `${fontSize}px ${FONT}`; mg.textAlign = 'center'; mg.textBaseline = 'middle';
    const hot = []; // characters running hot, redrawn in light afterwards: char, x, y, strength
    const sky = []; // faint characters where there is no light at all: char, x, y
    const kx = sw / W, ky = sh / H;
    const displacement = new Float32Array(3);
    for (let r = 0; r < rows; r++) {
      const y = r * cellH + cellH / 2;
      for (let c = 0; c < cols; c++) {
        const tile = tiles[Math.floor(r / 4) * tileCols + Math.floor(c / 8)];
        if (scene === current && upcoming && tile?.a >= .5) continue;
        if (scene === upcoming && tile?.a < .5) continue;
        const i = r * cols + c;
        const x = c * cellW + cellW / 2;
        const dyed = dye[i];
        // Each score has its own source-space paths, periods and focal points.
        // Local star protection keeps their real photographic profiles intact.
        const base = (Math.min(sh - 1, Math.floor(y * ky)) * sw + Math.min(sw - 1, Math.floor(x * kx))) * 4;
        const anchorL = (.2126 * data[base] + .7152 * data[base+1] + .0722 * data[base+2]) / 255;
        const present = clamp((peak[i] - floor - .01) / .05);
        if (present <= 0 && dyed < .04) {
          // Empty sky still belongs to a lane. It carries light, sparse symbols:
          // the lane decides which cells hold one right now and which are blank.
          if (SKY) {
            field.flow(i, time, flow);
            const k = Math.round(last * .1 + flow[0] * .8);
            if (k > 0) sky.push(glyphs[Math.min(last, k)], x, y);
          }
          continue;
        }
        const protection = Math.max(guard[i], clamp((anchorL - .74) / .2));
        const hold = clamp((anchorL - .35) / .45);
        const mobility = 1 - hold * hold * (3 - 2 * hold);
        field.sample(i, time, displacement);
        const qx = clamp((x + mobility * displacement[0]) * kx, 0, sw - 1.001);
        const qy = clamp((y + mobility * displacement[1]) * ky, 0, sh - 1.001);
        const ix = Math.floor(qx), iy = Math.floor(qy), fx = qx - ix, fy = qy - iy;
        const o = (iy * sw + ix) * 4, below = o + sw * 4;
        const a = (1 - fx) * (1 - fy), b = fx * (1 - fy), d = (1 - fx) * fy, e = fx * fy;
        const R = data[o]*a + data[o+4]*b + data[below]*d + data[below+4]*e;
        const G = data[o+1]*a + data[o+5]*b + data[below+1]*d + data[below+5]*e;
        const B = data[o+2]*a + data[o+6]*b + data[below+2]*d + data[below+6]*e;
        const baseL = (.2126 * R + .7152 * G + .0722 * B) / 255;
        // Every cell rides a lane of this photograph's score. The lane carries
        // its symbols along the structure at its own speed, and stretches of it
        // run hot. Heat only shows where there is gas or dust to light up;
        // dye dropped by the pointer shows anywhere.
        field.flow(i, time, flow);
        const heat = clamp(flow[1] * present * (1 - protection) + dyed);
        const seen = clamp((Math.max(baseL, peak[i] * .75) - floor * .9) * stretch);
        const light = clamp(seen * displacement[2] + heat * .22);
        if (light < .02) continue;
        const tone = clamp(Math.pow(light, .65) * .95);
        // The tone picks the symbol's weight; the lane, and the pointer, pick
        // which symbol of about that weight is passing through right now.
        let char = glyphs[Math.max(1, Math.min(last, Math.round(tone * last + flow[0] + dyed * 9)))];
        const dx = (data[o+4] + data[o+5] + data[o+6] - data[o] - data[o+1] - data[o+2]) / 765;
        const dy = (data[below] + data[below+1] + data[below+2] - data[o] - data[o+1] - data[o+2]) / 765;
        if (Math.hypot(dx, dy) > .14) {
          char = Math.abs(dx) > Math.abs(dy) * 2 ? '|' : Math.abs(dy) > Math.abs(dx) * 2 ? '\u2014' : dx * dy > 0 ? '\\' : '/';
        }
        const visibility = Math.max(present, clamp(dyed * 1.5));
        mg.globalAlpha = clamp((.45 + tone * .55) * visibility * (1 - protection * .7));
        mg.fillText(char, x, y);
        if (heat > .08) hot.push(char, x, y, heat * .6);
      }
    }
    mg.globalAlpha = 1;
    mg.globalCompositeOperation = 'source-in';
    mg.drawImage(scene.vivid, 0, 0, W, H);
    mg.globalCompositeOperation = 'source-over';

    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1; g.fillStyle = GROUND; g.fillRect(0, 0, W, H);
    if (UNDER) { g.globalAlpha = UNDER; g.drawImage(scene.photo, 0, 0, W, H); }
    if (BLOOM) { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.globalAlpha = BLOOM; g.drawImage(scene.bloom, 0, 0, W, H); }
    g.globalAlpha = 1;
    g.font = `${fontSize}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (sky.length) {
      g.fillStyle = scene.tint; g.globalAlpha = SKY;
      for (let k = 0; k < sky.length; k += 3) g.fillText(sky[k], sky[k + 1], sky[k + 2]);
      g.globalAlpha = 1;
    }
    g.drawImage(mask, 0, 0, W, H);
    // The symbols are drawn a second time as added light, so they shine.
    g.globalCompositeOperation = 'lighter';
    if (SHINE) { g.globalAlpha = SHINE; g.drawImage(mask, 0, 0, W, H); }
    // Hot stretches of a lane, and the pointer's dye, add white light on top.
    g.fillStyle = '#fff';
    for (let k = 0; k < hot.length; k += 4) {
      g.globalAlpha = hot[k + 3];
      g.fillText(hot[k], hot[k + 1], hot[k + 2]);
    }
    g.globalCompositeOperation = 'source-over';
    // A smooth luminance mask lets real star halos and bright filaments
    // show through the character layer, without adding artificial stars.
    g.globalAlpha = .8;
    g.drawImage(scene.highlights, 0, 0, W, H);
    // Soft, independent changes in actual stellar halos. No invented stars,
    // moving star positions or screen-wide sparkle texture.
    g.globalCompositeOperation = 'screen';
    for (const star of scene.stars) {
      const cadence = 3.5 + star.phase;
      const glint = Math.pow(.5+.5*Math.sin(time/cadence*Math.PI*2+star.phase),3);
      g.globalAlpha = scene.motion.stars * glint;
      g.drawImage(star.sprite,star.x-star.radius,star.y-star.radius,star.radius*2,star.radius*2);
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  function setCaption() {
    const info = images[current.index];
    caption.textContent = info.name;
    caption.href = info.source;
    caption.title = info.credit;
    hero.dataset.image = String(current.index);
  }

  async function preload() {
    upcoming = null;
    canvas.setAttribute('aria-busy', 'true');
    let candidate;
    while ((candidate = pick(current.index)) !== undefined) {
      try {
        const img = await load(candidate);
        const size = `${canvas.width}x${canvas.height}`;
        const scene = await prepareGently(candidate, img);
        // A resize while it was being built leaves it the wrong size; rebuild it.
        upcoming = size === `${canvas.width}x${canvas.height}` ? scene : prepare(candidate, img);
        canvas.setAttribute('aria-busy', 'false');
        kick();
        // Retain decoded data for only the current and upcoming photograph.
        for (const key of cache.keys()) if (key !== current.index && key !== candidate) cache.delete(key);
        return;
      } catch (_) { failed.add(candidate); cache.delete(candidate); }
    }
  }

  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    const s = Math.min(devicePixelRatio || 1, 1.5);
    if (W === w && H === h && scale === s) return;
    W = w; H = h; scale = s;
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    ({ layer: mask, g: mg } = makeLayer());
    fontSize = W < 600 ? 10 : 12;
    cellW = fontSize * .75; cellH = fontSize * 1.18;
    if (current) current = prepare(current.index, current.img);
    if (upcoming) upcoming = prepare(upcoming.index, upcoming.img);
    const previous = tiles, previousCols = tileCols, previousRows = tileRows;
    tileW = cellW * 8; tileH = cellH * 4;
    tileCols = Math.ceil(W / tileW); tileRows = Math.ceil(H / tileH);
    tiles = [];
    for (let r = 0; r < tileRows; r++) for (let c = 0; c < tileCols; c++) {
      const old = previous[Math.floor(r / tileRows * previousRows) * previousCols + Math.floor(c / tileCols * previousCols)];
      tiles.push({ c, r, turned: old?.turned || false, peek: false, a: old?.a || 0, velocity: 0, wait: 0,
        page: old ? old.page : pageTarget, pageSpeed: 0, pageWait: 0 });
    }
    render(); kick();
  }

  function render() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1; ctx.fillStyle = GROUND; ctx.fillRect(0, 0, W, H);
    if (!current) return;
    paintScene(current);
    ctx.drawImage(current.layer, 0, 0, W, H);
    if (upcoming && tiles.some(t => t.a >= .5)) paintScene(upcoming);
    for (const tile of tiles) {
      const turning = upcoming && tile.a >= .001, paging = tile.page >= .001;
      if (!turning && !paging) continue;
      const x = tile.c * tileW, y = tile.r * tileH;
      const w = Math.min(tileW, W - x), h = Math.min(tileH, H - y);
      const width = Math.abs(Math.cos((paging ? tile.page : tile.a) * Math.PI));
      const side = turning && tile.a >= .5 ? upcoming : current;
      // Composite the live field on each face, including already flipped tiles.
      ctx.fillStyle = GROUND; ctx.fillRect(x, y, w, h);
      if (width <= .004) continue;
      // Past halfway a page tile's back face is a window onto the page beneath.
      if (tile.page >= .5) ctx.clearRect(x + w * (1 - width) / 2, y, w * width, h);
      else ctx.drawImage(side.layer, x * scale, y * scale, w * scale, h * scale,
        x + w * (1 - width) / 2, y, w * width, h);
    }
  }

  // Critically damped motion keeps a reversing flip from snapping.
  function settle(t, key, speedKey, target, dt) {
    const omega = 17, f = 1 + 2 * dt * omega;
    const oo = omega * omega, inv = 1 / (f + dt * dt * oo);
    const previous = t[key];
    t[key] = (f * previous + dt * t[speedKey] + dt * dt * oo * target) * inv;
    t[speedKey] = (t[speedKey] + dt * oo * (target - previous)) * inv;
  }

  function updatePage(dt) {
    let moving = false;
    for (const t of tiles) {
      if (motion.matches) {
        t.page = pageTarget; t.pageSpeed = 0; t.pageWait = 0;
      } else if (t.pageWait > 0) {
        t.pageWait -= dt; moving = true;
      } else if (Math.abs(t.page - pageTarget) > .001 || Math.abs(t.pageSpeed) > .01) {
        settle(t, 'page', 'pageSpeed', pageTarget, dt); moving = true;
      } else { t.page = pageTarget; t.pageSpeed = 0; }
    }
    if (!moving && pageDone) { const done = pageDone; pageDone = null; done(); }
    return moving;
  }

  // Turns every tile, each at its own moment, to show the section page behind
  // the artwork (show) or to bring the artwork back. Resolves once all have turned.
  function flipPage(show) {
    pageTarget = show ? 1 : 0;
    pageFlips++;
    if (!current) {
      for (const t of tiles) t.page = pageTarget;
      return Promise.resolve();
    }
    for (const t of tiles) { t.pageWait = hash(t.c * 73 + t.r * 151 + pageFlips * 977) * .6; t.pageSpeed = 0; }
    return new Promise(resolve => {
      pageDone?.();
      pageDone = resolve;
      lastTime = 0; kick();
    });
  }
  window.SpaceField = { flipPage };

  function completeReveal() {
    current = upcoming; current.paintedAt = -Infinity; upcoming = null; clicks = 0;
    for (const t of tiles) { t.turned = false; t.peek = false; t.a = 0; t.velocity = 0; t.wait = 0; }
    setCaption(); announcement.textContent = images[current.index].name;
    hero.dataset.revealed = '0';
    preload();
  }

  function updateTiles(dt) {
    if (!upcoming) return false;
    let moving = false;
    let complete = tiles.length > 0;
    for (const t of tiles) {
      const oldFace = t.a >= .5;
      const target = t.turned || t.peek ? 1 : 0;
      if (motion.matches) {
        t.a = target; t.velocity = 0; t.wait = 0;
      } else if (t.wait > 0) {
        t.wait -= dt; moving = true;
      } else if (Math.abs(t.a - target) > .001 || Math.abs(t.velocity) > .01) {
        settle(t, 'a', 'velocity', target, dt); moving = true;
      } else { t.a = target; t.velocity = 0; }
      if (oldFace !== (t.a >= .5)) {
        current.paintedAt = -Infinity; upcoming.paintedAt = -Infinity;
      }
      if (!t.turned || t.a < .999) complete = false;
    }
    if (complete) completeReveal();
    return moving;
  }

  function tileAt(e) {
    const b = canvas.getBoundingClientRect();
    const c = Math.floor((e.clientX - b.left) / tileW);
    const r = Math.floor((e.clientY - b.top) / tileH);
    return c >= 0 && c < tileCols && r >= 0 && r < tileRows ? tiles[r * tileCols + c] : null;
  }

  function reveal(hit, all = false) {
    if (!current || !upcoming) return;
    const available = tiles.filter(t => !t.turned);
    if (!available.length) return;
    clicks++;
    let count = all ? available.length : Math.min(available.length, Math.pow(4, Math.min(clicks, 6)));
    const chosen = [];
    if (hit && !hit.turned) { chosen.push(hit); count--; }
    const pool = available.filter(t => t !== hit);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    chosen.push(...pool.slice(0, count));
    chosen.forEach((t, i) => { t.turned = true; t.wait = t === hit ? 0 : Math.min(.42, i * .01) + hash(t.c + t.r * tileCols) * .12; });
    hero.dataset.revealed = String(tiles.filter(t => t.turned).length);
    updateTiles(0); render(); kick();
  }

  function frame(ms) {
    raf = 0;
    if (!visible || document.hidden) { lastTime = 0; return; }
    const dt = lastTime ? Math.min((ms - lastTime) / 1000, .05) : 0;
    lastTime = ms;
    if (!motion.matches) time += dt;
    const turning = updateTiles(dt), paging = updatePage(dt), moving = turning || paging;
    // Between character ticks the picture is unchanged, so on 120 Hz screens
    // only tile flips are drawn at display rate.
    if (moving || motion.matches || time - renderedAt >= TICK) { render(); renderedAt = time; }
    // Once a section page fully covers the artwork, the animation rests.
    const covered = pageTarget === 1 && !paging;
    if (moving || (!motion.matches && !covered)) kick();
  }

  function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointercancel', () => { down = null; });
  canvas.addEventListener('click', e => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return;
    reveal(tileAt(e));
    down = null;
  });
  function clearPeek() {
    for (const t of tiles) t.peek = false;
    if (motion.matches) { updateTiles(0); render(); }
    kick();
  }
  let trace = null;
  canvas.addEventListener('pointermove', e => {
    // Moving across the artwork drops dye into this photograph's currents.
    if (!motion.matches && current?.motion?.inject) {
      const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      const dt = trace ? Math.max(.008, (e.timeStamp - trace.t) / 1000) : 0;
      if (dt && dt < .2) current.motion.inject(x, y, (x - trace.x) / dt, (y - trace.y) / dt);
      trace = { x, y, t: e.timeStamp };
    }
    if (e.pointerType !== 'mouse' || !upcoming) return;
    for (const t of tiles) t.peek = false;
    const hit = tileAt(e);
    if (hit) hit.peek = true;
    if (motion.matches) { updateTiles(0); render(); }
    kick();
  });
  canvas.addEventListener('pointerleave', clearPeek);
  canvas.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      reveal(tiles[Math.floor(tileRows / 2) * tileCols + Math.floor(tileCols / 2)]);
    }
  });
  motion.addEventListener('change', () => { updateTiles(0); render(); kick(); });
  new ResizeObserver(layout).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) { lastTime = 0; kick(); } }).observe(hero);
  document.addEventListener('visibilitychange', () => { lastTime = 0; if (!document.hidden) kick(); });

  async function start() {
    layout();
    await document.fonts.load(`12px ${FONT}`).catch(() => {});
    measureGlyphs();
    // Keep the original opening composition; subsequent photographs are random.
    let index = 0;
    while (index !== undefined) {
      try {
        const img = await load(index); current = prepare(index, img); break;
      } catch (_) { failed.add(index); cache.delete(index); index = pick(-1); }
    }
    if (!current) { announcement.textContent = 'The space images could not be loaded.'; canvas.setAttribute('aria-busy', 'false'); return; }
    setCaption(); preload(); render(); kick();
  }
  start();
})();
