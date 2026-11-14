(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.sky');
  const button = document.getElementById('fullscreen-toggle');
  if (!hero || !button) return;

  // The whole page goes fullscreen, so the section pages still open over the
  // artwork. iPhone Safari cannot fullscreen a page; there the button hides the
  // interface instead and leaves only the artwork.
  const canFullscreen = Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

  function sync() {
    const active = Boolean(fullscreenElement()) || hero.classList.contains('is-immersive');
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'View space artwork fullscreen');
    button.title = active ? 'Exit fullscreen' : 'View fullscreen';
  }

  function setImmersive(on) {
    hero.classList.toggle('is-immersive', on);
    sync();
  }

  button.addEventListener('click', async () => {
    if (fullscreenElement()) {
      try { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (_) {}
    } else if (hero.classList.contains('is-immersive')) {
      setImmersive(false);
    } else if (canFullscreen) {
      try { await (root.requestFullscreen || root.webkitRequestFullscreen).call(root); }
      catch (_) { setImmersive(true); }
    } else {
      setImmersive(true);
    }
    sync();
  });

  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && hero.classList.contains('is-immersive')) setImmersive(false);
  });
})();
