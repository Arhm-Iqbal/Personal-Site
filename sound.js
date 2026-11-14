(() => {
  const button = document.getElementById('sound-toggle');
  if (!button) return;

  const SRC = 'audio/theme.mp3';
  const KEY = 'sound-muted';
  const VOLUME = .55;
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0;

  // Browsers only allow sound after the visitor interacts, so the loop starts
  // on the first click or key press anywhere unless they muted it before.
  let muted = localStorage.getItem(KEY) === '1';
  let started = false, fade = 0, resumeOnShow = false;

  function sync() {
    const playing = started && !muted;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Mute music' : 'Play music');
    button.title = playing ? 'Mute music' : 'Play music';
    button.classList.toggle('is-playing', playing);
  }

  function rampTo(target, done) {
    cancelAnimationFrame(fade);
    const from = audio.volume, start = performance.now(), length = target ? 1800 : 450;
    const step = now => {
      const k = Math.min(1, (now - start) / length);
      audio.volume = from + (target - from) * k * k * (3 - 2 * k);
      if (k < 1) fade = requestAnimationFrame(step);
      else done?.();
    };
    fade = requestAnimationFrame(step);
  }

  function play() {
    if (!audio.src) audio.src = SRC;
    audio.play().then(() => { started = true; sync(); rampTo(VOLUME); }).catch(() => {});
  }

  function stop() {
    rampTo(0, () => audio.pause());
  }

  function firstInteraction(event) {
    if (button.contains(event.target)) return;
    removeEventListener('click', firstInteraction, true);
    removeEventListener('keydown', firstInteraction, true);
    if (!muted) play();
  }

  button.addEventListener('click', () => {
    muted = started && !muted;
    localStorage.setItem(KEY, muted ? '1' : '0');
    if (muted) stop();
    else play();
    sync();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeOnShow = !audio.paused;
      audio.pause();
    } else if (resumeOnShow && !muted) {
      audio.play().catch(() => {});
    }
  });

  fetch(SRC, { method: 'HEAD' }).then(response => {
    if (!response.ok) return;
    button.hidden = false;
    addEventListener('click', firstInteraction, true);
    addEventListener('keydown', firstInteraction, true);
  }).catch(() => {});
  sync();
})();
