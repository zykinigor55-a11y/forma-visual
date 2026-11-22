// FORMA AI — Black Cinema V18. Independent UI layer; does not modify Quantum Kinetic V14 or Möbius V17.
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const menuButton = $('#menu-toggle');
  const nav = $('#mobile-nav');
  const setMenu = (opened) => {
    menuButton.setAttribute('aria-expanded', String(opened));
    menuButton.setAttribute('aria-label', opened ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('open', opened);
    nav.inert = !opened;
    document.body.classList.toggle('menu-open', opened);
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  const showreel = $('#showreel-dialog');
  const video = $('#quantum-video');
  const videoError = $('#video-error');
  const openShowreel = () => {
    if (typeof showreel.showModal !== 'function') return;
    showreel.showModal();
    video.play().catch(() => { videoError.hidden = false; });
  };
  $$('[data-open-showreel]').forEach(button => button.addEventListener('click', openShowreel));
  showreel.addEventListener('close', () => video.pause());
  const projects = {
    achron: { title: 'АХРОН', tag: 'СЕРИАЛ · КОНЦЕПТ', image: 'assets/project-achron.webp', alt: 'Сверхъестественный персонаж с золотыми энергетическими узорами', copy: 'Научно-мистическая история о разуме, памяти и новых формах существования. Визуальные исследования персонажей, окружений и кинематографического языка.' },
    dome: { title: 'КУПОЛ НАД ВОДОЙ', tag: 'КОРОТКИЙ МЕТР · КОНЦЕПТ', image: 'assets/project-dome.webp', alt: 'Ракета поднимается к прозрачному куполу над водой', copy: 'Спекулятивная короткометражная история, в которой полёт ракеты ставит под сомнение привычную картину мира. CGI, AI-кинематограф и атмосферная постановка.' },
    gods: { title: 'БОГИ', tag: 'СЕРИАЛ · КОНЦЕПТ', image: 'assets/project-gods.webp', alt: 'Футуристическая героиня с механической фактурой', copy: 'Серия научно-мистических визуальных сюжетов о существах вне времени. Работа с образами, композицией, светом и глубиной кадра.' }
  };
  const projectDialog = $('#project-dialog');
  $$('[data-project]').forEach(button => button.addEventListener('click', () => {
    const data = projects[button.dataset.project];
    if (!data || typeof projectDialog.showModal !== 'function') return;
    $('#project-dialog-title').textContent = data.title;
    $('#project-dialog-tag').textContent = data.tag;
    $('#project-dialog-text').textContent = data.copy;
    $('#project-dialog-image').src = data.image;
    $('#project-dialog-image').alt = data.alt;
    projectDialog.showModal();
  }));
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  }));
  $('#project-dialog-contact').addEventListener('click', () => projectDialog.close());

  // Service links preselect a relevant brief without guessing a visitor's contact details.
  const service = $('#brief-service');
  $$('[data-service]').forEach(link => link.addEventListener('click', () => { service.value = link.dataset.service; }));
  $$('[data-highlight]').forEach(link => link.addEventListener('click', () => {
    const card = $(`[data-key="${link.dataset.highlight}"]`);
    if (!card) return;
    $$('.service-card').forEach(item => item.classList.remove('service-highlight'));
    card.classList.add('service-highlight');
    setTimeout(() => card.classList.remove('service-highlight'), 1350);
  }));
  $('#copyright-year').textContent = String(new Date().getFullYear());
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reducedMotion) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
      });
    }, { threshold: .08, rootMargin: '0px 0px 80px 0px' });
    $$('[data-reveal]').forEach(item => reveal.observe(item));
  } else {
    $$('[data-reveal]').forEach(item => item.classList.add('visible'));
  }
  // Deliberately restrained parallax. Decorative only, disabled for small screens.
  if (!reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    const hero = $('.hero');
    let frame = 0;
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        hero.style.setProperty('--hero-x', `${x * -11}px`);
        hero.style.setProperty('--hero-y', `${y * -8}px`);
      });
    }, { passive: true });
  }

  const brief = $('#brief-form');
  const status = $('#brief-status');
  brief.addEventListener('submit', async event => {
    event.preventDefault();
    const name = $('#brief-name').value.trim();
    const direction = service.value;
    const description = $('#brief-description').value.trim();
    if (!name || !direction || !description) { status.textContent = 'Заполните имя, направление и описание.'; return; }
    const content = `FORMA AI — бриф проекта\nИмя / команда: ${name}\nНаправление: ${direction}\nОписание: ${description}`;
    try {
      await navigator.clipboard.writeText(content);
      status.textContent = 'Бриф скопирован. Его можно отправить студии, когда контактный канал будет подключён.';
    } catch (error) {
      const field = document.createElement('textarea');
      field.value = content; field.style.position = 'fixed'; field.style.opacity = '0';
      document.body.appendChild(field); field.focus(); field.select();
      const copied = document.execCommand('copy'); field.remove();
      status.textContent = copied ? 'Бриф скопирован в буфер обмена.' : 'Автоматическое копирование недоступно в этом браузере. Скопируйте текст вручную.';
      if (!copied) window.prompt('Ваш бриф — скопируйте текст:', content);
    }
  });
})();
