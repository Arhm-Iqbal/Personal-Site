(() => {
  const content = document.getElementById('content');
  const back = document.querySelector('.mobile-back');
  const mobile = matchMedia('(max-width: 700px)');
  if (!content || !back) return;

  let trigger = null;
  const panelIds = new Set(['work', 'resume', 'books', 'contact']);

  function setPanel(id, opener) {
    if (!mobile.matches || !panelIds.has(id)) return false;
    const panel = document.getElementById(id);
    if (!panel) return false;

    if (!content.classList.contains('mobile-panel-open')) trigger = opener || null;
    content.querySelectorAll('.mobile-active').forEach(node => node.classList.remove('mobile-active'));
    panel.classList.add('mobile-active');
    content.classList.add('mobile-panel-open');
    content.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('mobile-panel-open');
    document.body.classList.add('mobile-panel-open');
    content.scrollTop = 0;

    document.querySelectorAll('.mobile-panel-nav a').forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    back.focus({ preventScroll: true });
    return true;
  }

  function closePanel() {
    content.classList.remove('mobile-panel-open');
    content.querySelectorAll('.mobile-active').forEach(node => node.classList.remove('mobile-active'));
    content.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('mobile-panel-open');
    document.body.classList.remove('mobile-panel-open');
    trigger?.focus({ preventScroll: true });
    trigger = null;
  }

  if (mobile.matches) content.setAttribute('aria-hidden', 'true');

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !mobile.matches) return;
    const id = link.hash.slice(1);
    if (id === 'top') {
      event.preventDefault();
      if (content.classList.contains('mobile-panel-open')) closePanel();
      return;
    }
    if (setPanel(id, link)) event.preventDefault();
  });

  back.addEventListener('click', closePanel);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && content.classList.contains('mobile-panel-open')) closePanel();
  });
  mobile.addEventListener('change', event => {
    if (event.matches) content.setAttribute('aria-hidden', 'true');
    else {
      closePanel();
      content.removeAttribute('aria-hidden');
    }
  });
})();
