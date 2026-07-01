(function () {
  'use strict';

  const FALLBACK_COVER =
    'https://pikwqvucmvlxmjxllqmu.supabase.co/storage/v1/object/public/content-media/public-collection-covers/collection-vinyasa.jpg';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function safeText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function safeCoverUrl(value) {
    const candidate = safeText(value);
    if (!candidate) return FALLBACK_COVER;

    try {
      const url = new URL(candidate);
      return url.protocol === 'https:' ? url.href : FALLBACK_COVER;
    } catch (_error) {
      return FALLBACK_COVER;
    }
  }

  function normalizeCollections(payload) {
    if (!isRecord(payload) || !Array.isArray(payload.collections)) return [];

    return payload.collections.flatMap(collection => {
      if (!isRecord(collection)) return [];

      const title = safeText(collection.title);
      if (!title) return [];

      return [{
        title,
        description: safeText(collection.description),
        coverImageUrl: safeCoverUrl(collection.coverImageUrl)
      }];
    });
  }

  function appendEmphasizedTitle(heading, title) {
    const words = title.split(/\s+/).filter(Boolean);
    const firstWord = words.shift();
    /*const lastWord = words.pop();*/

    if (words.length) heading.append(document.createTextNode(firstWord + ' '));

    const emphasis = document.createElement('em');
    emphasis.textContent = `${words.join(' ')} ` || '';
    heading.append(emphasis);
  }

  function createCollectionCard(collection) {
    const card = document.createElement('article');
    card.className = 'online-collection-card';

    const media = document.createElement('div');
    media.className = 'online-collection-media';

    const image = document.createElement('img');
    image.src = collection.coverImageUrl;
    image.alt = collection.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 800;
    image.height = 500;
    image.addEventListener('error', () => {
      if (image.src !== FALLBACK_COVER) image.src = FALLBACK_COVER;
    }, { once: true });
    media.append(image);

    const body = document.createElement('div');
    body.className = 'online-collection-body';

    const headingGroup = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'online-collection-eyebrow';
    eyebrow.textContent = 'Collezione';

    const heading = document.createElement('h3');
    heading.className = 'online-collection-title';
    appendEmphasizedTitle(heading, collection.title);
    headingGroup.append(eyebrow, heading);

    const description = document.createElement('p');
    description.className = 'online-collection-description';
    description.textContent = collection.description;

    body.append(headingGroup, description);
    card.append(media, body);
    return card;
  }

  function initialiseControls(carousel, track) {
    const previousButton = carousel.querySelector('[data-collections-prev]');
    const nextButton = carousel.querySelector('[data-collections-next]');
    if (!previousButton || !nextButton) return function () {};

    let updateFrame = null;

    function scrollAmount() {
      const card = track.querySelector('.online-collection-card');
      if (!card) return track.clientWidth;
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 16;
      return card.getBoundingClientRect().width + gap;
    }

    function scrollByCard(direction) {
      track.scrollBy({
        left: direction * scrollAmount(),
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
    }

    function updateControls() {
      updateFrame = null;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const hasOverflow = maxScroll > 2;

      previousButton.hidden = !hasOverflow;
      nextButton.hidden = !hasOverflow;
      previousButton.disabled = !hasOverflow || track.scrollLeft <= 2;
      nextButton.disabled = !hasOverflow || track.scrollLeft >= maxScroll - 2;
      track.tabIndex = hasOverflow ? 0 : -1;
    }

    function scheduleUpdate() {
      if (updateFrame !== null) return;
      updateFrame = window.requestAnimationFrame(updateControls);
    }

    previousButton.addEventListener('click', () => scrollByCard(-1));
    nextButton.addEventListener('click', () => scrollByCard(1));
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    track.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      scrollByCard(event.key === 'ArrowLeft' ? -1 : 1);
    });

    if ('ResizeObserver' in window) {
      new ResizeObserver(scheduleUpdate).observe(track);
    } else {
      window.addEventListener('resize', scheduleUpdate);
    }

    return scheduleUpdate;
  }

  async function initialiseCollections(section) {
    const endpoint = safeText(section.dataset.collectionsEndpoint);
    const fallback = section.querySelector('[data-collections-fallback]');
    const carousel = section.querySelector('[data-collections-carousel]');
    const track = section.querySelector('[data-collections-track]');
    const status = section.querySelector('[data-collections-status]');
    if (!endpoint || !fallback || !carousel || !track || !status) return;

    const scheduleControlsUpdate = initialiseControls(carousel, track);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit'
      });
      if (!response.ok) return;

      const collections = normalizeCollections(await response.json());
      if (!collections.length) return;

      const fragment = document.createDocumentFragment();
      collections.forEach(collection => fragment.append(createCollectionCard(collection)));

      track.replaceChildren(fragment);
      track.scrollLeft = 0;
      fallback.hidden = true;
      carousel.hidden = false;
      status.textContent = `${collections.length} collezioni caricate.`;
      scheduleControlsUpdate();
    } catch (_error) {
      // Il contenuto statico resta visibile come fallback.
    }
  }

  function initialiseAllCollections() {
    document.querySelectorAll('[data-online-collections]').forEach(initialiseCollections);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseAllCollections, { once: true });
  } else {
    initialiseAllCollections();
  }
})();
