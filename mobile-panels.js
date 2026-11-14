(() => {
  const content = document.getElementById('content');
  const back = document.querySelector('.mobile-back');
  if (!content || !back) return;

  let trigger = null;
  const panelIds = new Set(['work', 'resume', 'books', 'contact']);

  // Work is presented as one focused project at a time on the fixed-screen layout.
  const workItems = [...document.querySelectorAll('#work .rows > li')];
  const workSection = document.getElementById('work');
  const workPager = document.createElement('div');
  workPager.className = 'work-pager';
  workPager.innerHTML = '<button type="button" data-step="-1" aria-label="Previous project">←</button><span aria-live="polite"></span><button type="button" data-step="1" aria-label="Next project">→</button>';
  workSection.append(workPager);
  let workIndex = 0;

  function showWork(index) {
    workIndex = (index + workItems.length) % workItems.length;
    workItems.forEach((item, i) => {
      const active = i === workIndex;
      item.classList.toggle('work-item-active', active);
      item.setAttribute('aria-hidden', String(!active));
    });
    workPager.querySelector('span').textContent = `${workIndex + 1} / ${workItems.length}`;
  }
  showWork(0);
  workPager.addEventListener('click', event => {
    const button = event.target.closest('button[data-step]');
    if (button) showWork(workIndex + Number(button.dataset.step));
  });

  // Each resume group becomes a page chosen from a compact select control.
  const resume = document.getElementById('resume');
  const resumeHeading = resume.querySelector('h2');
  const resumePages = [];
  let page = null;
  [...resume.children].slice(1).forEach(node => {
    if (node.classList.contains('group')) {
      page = document.createElement('div');
      page.className = 'resume-category-page';
      page.dataset.label = node.textContent.trim();
      resumePages.push(page);
    }
    if (page) page.append(node);
  });
  const resumePicker = document.createElement('label');
  resumePicker.className = 'resume-picker';
  resumePicker.innerHTML = '<span>Section</span><select aria-label="Resume section"></select>';
  const select = resumePicker.querySelector('select');
  resumePages.forEach((resumePage, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = resumePage.dataset.label;
    select.append(option);
    resume.append(resumePage);
  });
  resumeHeading.after(resumePicker);
  function showResume(index) {
    resumePages.forEach((resumePage, i) => resumePage.classList.toggle('resume-category-active', i === index));
  }
  showResume(0);
  select.addEventListener('change', () => showResume(Number(select.value)));

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
    if (id === 'work') showWork(workIndex);
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
