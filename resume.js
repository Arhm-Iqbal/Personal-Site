/* Resume. The entries draw their own timeline: every list item carries its years
   (data-from, and data-to as a year or "now"), so the list stays the one source.
   Pointing at a line or an entry lights both; on wide screens the chart stays
   beside the list and follows whichever entry is being read. */
(() => {
  const section = document.getElementById('resume');
  const figure = section?.querySelector('.trajectory');
  const svg = figure?.querySelector('.trajectory-chart');
  const note = figure?.querySelector('.trajectory-note');
  if (!svg || !note) return;

  const NS = 'http://www.w3.org/2000/svg';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const now = today.getFullYear() + (today - yearStart) / (365.25 * 864e5);
  const lists = [...section.querySelectorAll('ul[data-track]')];
  const entries = lists.flatMap(ul => [...ul.querySelectorAll(':scope > li[data-from]')]);
  if (!lists.length || !entries.length) return;
  const first = Math.min(...entries.map(li => +li.dataset.from));

  // Spans run from the start of their first year to the end of their last
  // (the years are all the list states), and stop at today. A single date is a point.
  const tracks = lists.map(ul => {
    const items = [...ul.querySelectorAll(':scope > li[data-from]')].map(li => {
      const from = +li.dataset.from, to = li.dataset.to;
      return {
        li, from, point: !to, ongoing: to === 'now',
        to: !to ? from : Math.min(now, to === 'now' ? now : +to + 1)
      };
    });
    const lanes = [];
    items.filter(item => !item.point)
      .sort((a, b) => a.from - b.from)
      .forEach(item => {
        let lane = lanes.findIndex(end => end <= item.from);
        if (lane < 0) { lane = lanes.length; lanes.push(0); }
        lanes[lane] = item.to;
        item.lane = lane;
      });
    // Points spread across their year in the order the list gives them.
    const byYear = new Map();
    items.filter(item => item.point).forEach(item => {
      if (!byYear.has(item.from)) byYear.set(item.from, []);
      byYear.get(item.from).push(item);
    });
    byYear.forEach(group => group.slice().reverse().forEach((item, k) => {
      item.at = Math.min(now - .05, item.from + (k + 1) / (group.length + 1));
      item.lane = 0;
    }));
    return { ul, key: ul.dataset.track, label: ul.dataset.label, items, lanes: Math.max(1, lanes.length) };
  });

  const byId = new Map();
  let current = entries[0], hovered = null;

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    parent?.append(node);
    return node;
  }

  function draw() {
    const W = figure.clientWidth;
    if (!W) return;
    const LABEL = 92, RIGHT = 14, TOP = 28, LANE = 13, GAP = 18;
    const end = now + .12;
    const x = year => LABEL + ((year - first) / (end - first)) * (W - LABEL - RIGHT);
    const height = TOP + tracks.reduce((h, t) => h + t.lanes * LANE, 0) + GAP * (tracks.length - 1) + 8;
    svg.textContent = '';
    svg.setAttribute('viewBox', `0 0 ${W} ${height}`);
    svg.setAttribute('height', height);
    byId.clear();

    for (let year = first; year <= Math.floor(now); year++) {
      el('line', { class: 'grid', x1: x(year), x2: x(year), y1: TOP - 8, y2: height }, svg);
      const label = el('text', { x: (x(year) + x(Math.min(year + 1, now))) / 2, y: 10, 'text-anchor': 'middle' }, svg);
      label.textContent = year;
    }
    el('line', { class: 'now', x1: x(now), x2: x(now), y1: TOP - 8, y2: height }, svg);

    let y = TOP;
    for (const track of tracks) {
      const group = el('g', { 'data-track': track.key }, svg);
      const name = el('text', { class: 'track-name', x: 0, y: y + LANE / 2 + 3.5 }, group);
      name.textContent = track.label;
      for (const item of track.items) {
        const cy = y + item.lane * LANE + LANE / 2;
        const g = el('g', { class: 't-item', 'data-for': item.li.id }, group);
        if (item.point) {
          const cx = x(item.at);
          el('circle', { class: 'hit', cx, cy, r: 8, fill: 'transparent' }, g);
          el('path', { class: 'point', d: `M${cx} ${cy - 4}L${cx + 4} ${cy}L${cx} ${cy + 4}L${cx - 4} ${cy}Z` }, g);
        } else {
          const x1 = x(item.from) + 3, x2 = Math.max(x1 + 4, x(item.to) - (item.ongoing ? 0 : 3));
          el('line', { class: 'hit', x1, x2, y1: cy, y2: cy }, g);
          el('line', { class: 'line', x1, x2, y1: cy, y2: cy }, g);
          el('circle', { class: 'start', cx: x1, cy, r: 2.6 }, g);
          if (item.ongoing) {
            el('circle', { class: 'glow', cx: x2, cy, r: 6 }, g);
            el('circle', { class: 'end', cx: x2, cy, r: 3 }, g);
          } else {
            el('circle', { class: 'end', cx: x2, cy, r: 1.8 }, g);
          }
        }
        byId.set(item.li.id, { g, item, track });
      }
      y += track.lanes * LANE + GAP;
    }
    light();
  }

  function light() {
    const id = (hovered || current)?.id;
    svg.classList.toggle('has-lit', !!hovered);
    for (const { g, item } of byId.values()) {
      const on = item.li.id === id;
      g.classList.toggle('is-lit', on);
      item.li.classList.toggle('is-lit', on && !!hovered);
    }
    const hit = byId.get(id);
    if (!hit) return;
    const { item, track } = hit;
    const when = item.li.querySelector('.when')?.textContent.trim() ?? '';
    const title = item.li.querySelector('h4')?.textContent.trim() ?? '';
    note.dataset.track = track.key;
    note.innerHTML = '';
    const mark = document.createElement('span');
    mark.textContent = `${track.label} · ${when}`;
    const name = document.createElement('b');
    name.textContent = title;
    note.append(mark, document.createElement('br'), name);
  }

  svg.addEventListener('pointerover', event => {
    const g = event.target.closest?.('.t-item');
    if (!g) return;
    hovered = document.getElementById(g.dataset.for);
    light();
  });
  svg.addEventListener('pointerleave', () => { hovered = null; light(); });
  svg.addEventListener('click', event => {
    const g = event.target.closest?.('.t-item');
    const li = g && document.getElementById(g.dataset.for);
    if (!li) return;
    current = li;
    li.scrollIntoView({ block: 'center', behavior: motion.matches ? 'auto' : 'smooth' });
    light();
  });
  for (const li of entries) {
    li.addEventListener('pointerenter', () => { hovered = li; light(); });
    li.addEventListener('pointerleave', () => { if (hovered === li) { hovered = null; light(); } });
  }

  // Follow reading: the first entry inside the upper part of the page is current.
  const inView = new Set();
  const spy = new IntersectionObserver(changes => {
    for (const change of changes) {
      if (change.isIntersecting) inView.add(change.target);
      else inView.delete(change.target);
    }
    const next = entries.find(li => inView.has(li));
    if (next && next !== current) { current = next; light(); }
  }, { root: section, rootMargin: '-12% 0px -55% 0px' });
  entries.forEach(li => spy.observe(li));

  new ResizeObserver(draw).observe(figure);
})();
