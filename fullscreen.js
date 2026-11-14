(() => {
  const hero = document.querySelector('.sky');
  const button = document.getElementById('fullscreen-toggle');
  if (!hero || !button) return;

  function sync() {
    const active = document.fullscreenElement === hero;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'View space artwork fullscreen');
    button.title = active ? 'Exit fullscreen' : 'View fullscreen';
  }

  button.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === hero) await document.exitFullscreen();
      else if (hero.requestFullscreen) await hero.requestFullscreen();
    } catch (_) {
      // Fullscreen permission can be denied by the browser or device.
    }
    sync();
  });

  document.addEventListener('fullscreenchange', sync);
})();
