(function () {
  'use strict';

  function initialiseNavigation() {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mobileMenu');
    const closeButton = document.getElementById('mobileClose');
    if (!nav || !toggle || !menu || !closeButton) return;

    const setMobileMenu = isOpen => {
      menu.classList.toggle('open', isOpen);
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    };

    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60), {
      passive: true
    });
    toggle.addEventListener('click', () => setMobileMenu(!menu.classList.contains('open')));
    closeButton.addEventListener('click', () => setMobileMenu(false));
    menu.addEventListener('click', event => {
      if (event.target === menu && event.clientX < window.innerWidth / 2) setMobileMenu(false);
    });
    menu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => setMobileMenu(false));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseNavigation, { once: true });
  } else {
    initialiseNavigation();
  }
})();
