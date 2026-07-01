(function () {
  'use strict';

  const carouselMedia = window.matchMedia('(min-width: 769px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initialiseCourseCarousel(carousel) {
    if (carousel.dataset.carouselReady === 'true') return;

    const track = carousel.querySelector('.corsi-grid');
    const previousButton = carousel.querySelector('[data-courses-prev]');
    const nextButton = carousel.querySelector('[data-courses-next]');
    if (!track || !previousButton || !nextButton) return;

    carousel.dataset.carouselReady = 'true';
    let updateFrame = null;

    const scrollAmount = () => {
      const card = track.querySelector('.corso-card');
      if (!card) return track.clientWidth;
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 20;
      return card.getBoundingClientRect().width + gap;
    };

    const scrollByCard = direction => {
      if (!carouselMedia.matches) return;
      track.scrollBy({
        left: direction * scrollAmount(),
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
    };

    const updateControls = () => {
      updateFrame = null;
      const isCarousel = carouselMedia.matches;

      if (!isCarousel) {
        track.scrollLeft = 0;
        track.tabIndex = -1;
        previousButton.hidden = true;
        nextButton.hidden = true;
        return;
      }

      track.tabIndex = 0;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const hasOverflow = maxScroll > 2;
      previousButton.hidden = !hasOverflow;
      nextButton.hidden = !hasOverflow;
      previousButton.disabled = !hasOverflow || track.scrollLeft <= 2;
      nextButton.disabled = !hasOverflow || track.scrollLeft >= maxScroll - 2;
    };

    const scheduleUpdate = () => {
      if (updateFrame !== null) return;
      updateFrame = window.requestAnimationFrame(updateControls);
    };

    previousButton.addEventListener('click', () => scrollByCard(-1));
    nextButton.addEventListener('click', () => scrollByCard(1));
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    track.addEventListener('keydown', event => {
      if (!carouselMedia.matches || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      event.preventDefault();
      scrollByCard(event.key === 'ArrowLeft' ? -1 : 1);
    });

    carouselMedia.addEventListener('change', scheduleUpdate);
    document.addEventListener('yogis:content-ready', scheduleUpdate);
    new MutationObserver(scheduleUpdate).observe(track, { childList: true });

    if ('ResizeObserver' in window) {
      new ResizeObserver(scheduleUpdate).observe(track);
    } else {
      window.addEventListener('resize', scheduleUpdate);
    }

    updateControls();
  }

  function initialiseAllCourseCarousels() {
    document.querySelectorAll('[data-courses-carousel]').forEach(initialiseCourseCarousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseAllCourseCarousels, { once: true });
  } else {
    initialiseAllCourseCarousels();
  }
})();

