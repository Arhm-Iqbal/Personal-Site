(() => {
  // A quiet two-part cursor for mouse users: a dot that sits exactly on the
  // pointer, and a thin ring that trails it and opens over anything clickable.
  // Touch, pen and keyboard users keep the system cursor and never see it.
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  if (!fine.matches) return;

  const root = document.documentElement;
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);

  const clickable = 'a, button, [role="button"], label, summary, select, #field';
  let x = -100, y = -100, rx = -100, ry = -100, frame = 0, on = false;

  function place() {
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
  }

  function follow() {
    const k = still.matches ? 1 : .22;
    rx += (x - rx) * k; ry += (y - ry) * k;
    place();
    frame = Math.abs(x - rx) + Math.abs(y - ry) > .1 ? requestAnimationFrame(follow) : 0;
  }

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') { root.classList.remove('has-cursor'); on = false; return; }
    x = e.clientX; y = e.clientY;
    if (!on) { on = true; rx = x; ry = y; root.classList.add('has-cursor'); }
    root.classList.remove('cursor-away');
    const target = e.target instanceof Element ? e.target.closest(clickable) : null;
    root.classList.toggle('cursor-hover', Boolean(target && target.id !== 'field'));
    root.classList.toggle('cursor-art', target?.id === 'field');
    place();
    if (!frame) frame = requestAnimationFrame(follow);
  }, { passive: true });

  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') root.classList.add('cursor-down'); });
  addEventListener('pointerup', () => root.classList.remove('cursor-down'));
  document.addEventListener('pointerleave', () => root.classList.add('cursor-away'));
  addEventListener('blur', () => root.classList.add('cursor-away'));
  fine.addEventListener('change', () => { if (!fine.matches) root.classList.remove('has-cursor'); });
})();
