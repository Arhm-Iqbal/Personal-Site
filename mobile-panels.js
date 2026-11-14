(() => {
  const content = document.getElementById('content');
  const back = document.querySelector('.mobile-back');
  if (!content || !back) return;

  let trigger = null;
  const panelIds = new Set(['work', 'resume', 'books', 'contact']);

  // Opening a section from the artwork turns every tile over to reveal the page,
  // and Home turns them back. page-shown hides the artwork's own text while a
  // page is up; page-flipping lifts the artwork above the page while tiles turn.
  const root = document.documentElement;
  const flipPage = show => window.SpaceField ? window.SpaceField.flipPage(show) : Promise.resolve();
  let state = 'home', run = 0;

  function setPanel(id, opener) {
    if (!panelIds.has(id)) return false;
    const panel = document.getElementById(id);
    if (!panel) return false;

    const opening = state === 'home' || state === 'closing';
    if (state === 'home') trigger = opener || null;
    content.querySelectorAll('.page-active').forEach(node => node.classList.remove('page-active'));
    panel.classList.add('page-active');
    content.classList.add('page-open');
    content.setAttribute('aria-hidden', 'false');
    panel.scrollTop = 0;

    document.querySelectorAll('.mobile-panel-nav a').forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    back.focus({ preventScroll: true });

    if (opening) {
      state = 'opening';
      const mine = ++run;
      root.classList.add('page-shown', 'page-flipping');
      flipPage(true).then(() => {
        if (mine !== run) return;
        state = 'open';
        root.classList.remove('page-flipping');
      });
    }
    return true;
  }

  function closePanel() {
    if (state === 'home' || state === 'closing') return;
    state = 'closing';
    const mine = ++run;
    root.classList.add('page-flipping');
    flipPage(false).then(() => {
      if (mine !== run) return;
      state = 'home';
      content.classList.remove('page-open');
      content.querySelectorAll('.page-active').forEach(node => node.classList.remove('page-active'));
      content.setAttribute('aria-hidden', 'true');
      root.classList.remove('page-shown', 'page-flipping');
      trigger?.focus({ preventScroll: true });
      trigger = null;
    });
  }

  content.setAttribute('aria-hidden', 'true');

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.hash.slice(1);
    if (id === 'top') {
      event.preventDefault();
      closePanel();
      return;
    }
    if (setPanel(id, link)) event.preventDefault();
  });

  back.addEventListener('click', closePanel);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePanel();
  });
})();
