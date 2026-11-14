(() => {
  const hero = document.querySelector('.sky');
  const button = document.getElementById('fullscreen-toggle');
  if (!hero || !button) return;

  const usePageFullscreen = /iPhone|iPod/.test(navigator.userAgent);

  function sync() {
    const active = hero.classList.contains('is-fullscreen') || document.fullscreenElement === hero;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'View space artwork fullscreen');
    button.title = active ? 'Exit fullscreen' : 'View fullscreen';
  }

  function enterPageFullscreen() {
    hero.classList.add('is-fullscreen');
    document.documentElement.classList.add('fullscreen-page-open');
    document.body.classList.add('fullscreen-page-open');
    sync();
  }

  function exitPageFullscreen() {
    hero.classList.remove('is-fullscreen');
    document.documentElement.classList.remove('fullscreen-page-open');
    document.body.classList.remove('fullscreen-page-open');
    sync();
  }

  button.addEventListener('click', async () => {
    if (hero.classList.contains('is-fullscreen') || document.fullscreenElement === hero) {
      if (document.fullscreenElement === hero) {
        try { await document.exitFullscreen(); } catch (_) { exitPageFullscreen(); }
      } else exitPageFullscreen();
      return;
    }

    // iPhone Safari does not provide reliable fullscreen for arbitrary elements.
    if (usePageFullscreen || !hero.requestFullscreen) {
      enterPageFullscreen();
      return;
    }
    try { await hero.requestFullscreen(); }
    catch (_) { enterPageFullscreen(); }
    sync();
  });

  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && hero.classList.contains('is-fullscreen')) exitPageFullscreen();
  });
})();
