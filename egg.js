// Hidden behind a code (found at the end of Books). Drop more images in
// assets/egg/ and add them here; one is picked at random each time.
(function () {
  const IMAGES = ['assets/egg/3893.jpg', 'assets/egg/3894.jpg', 'assets/egg/3895.jpg', 'assets/egg/kobeni-1.jpg', 'assets/egg/kobeni-2.jpg', 'assets/egg/kobeni-3.jpg'];
  const CODE = '99942';
  const egg = document.getElementById('egg');
  const open = document.getElementById('egg-open');
  if (!egg || !open) return;
  const form = egg.querySelector('.egg-form');
  const input = form.querySelector('input');
  const img = egg.querySelector('.egg-img');
  let last = -1;

  function show() {
    egg.hidden = false; egg.classList.remove('is-open-img');
    form.hidden = false; img.hidden = true; img.removeAttribute('src'); input.value = '';
    form.classList.remove('is-wrong');
    input.focus();
  }
  function hide() { egg.hidden = true; open.focus(); }

  open.addEventListener('click', show);
  egg.querySelector('.egg-x').addEventListener('click', hide);
  egg.addEventListener('click', (e) => { if (e.target === egg) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !egg.hidden) { e.stopPropagation(); hide(); } }, true);
  input.addEventListener('input', () => {
    form.classList.remove('is-wrong');
    if (input.value.trim() === CODE) reveal();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value.trim() === CODE) reveal(); else form.classList.add('is-wrong');
  });

  function reveal() {
    let i;
    do { i = Math.floor(Math.random() * IMAGES.length); } while (IMAGES.length > 1 && i === last);
    last = i;
    img.src = IMAGES[i];
    form.hidden = true; img.hidden = false;
    egg.classList.add('is-open-img');
  }
})();
