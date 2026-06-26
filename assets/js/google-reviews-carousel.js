(function () {
  'use strict';

  const dateFormatter = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric'
  });

  const integerFormatter = new Intl.NumberFormat('it-IT');

  function safeHttpsUrl(value) {
    if (typeof value !== 'string' || !value) return '';
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'https:' ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function safeEndpointUrl(value) {
    if (typeof value !== 'string' || !value) return '';
    try {
      const url = new URL(value, window.location.href);
      const isLocalHttp = url.protocol === 'http:' &&
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
      return url.protocol === 'https:' || isLocalHttp ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function formatItalianRating(value) {
    const rating = Number(value);
    if (!Number.isFinite(rating)) return '';
    return rating.toFixed(1).replace('.', ',');
  }

  function formatReviewDate(value) {
    if (typeof value !== 'string' || !value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
  }

  function isValidPayload(data) {
    return data &&
      data.source === 'google_business_profile' &&
      data.attribution === 'Google Maps' &&
      Number.isFinite(Number(data.averageRating)) &&
      Number.isInteger(Number(data.totalReviewCount)) &&
      Array.isArray(data.reviews) &&
      data.reviews.length > 0;
  }

  function appendTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function createReviewCard(review) {
    const article = document.createElement('article');
    article.className = 'review-card';

    const rating = Math.max(1, Math.min(5, Number(review.rating) || 0));
    const stars = appendTextElement(article, 'div', 'review-card-stars', '★'.repeat(rating));
    stars.setAttribute('aria-label', `${rating} stelle su 5`);

    appendTextElement(article, 'p', 'review-card-text', String(review.comment || ''));

    const author = document.createElement('footer');
    author.className = 'review-author';

    const placeholder = appendTextElement(author, 'span', 'review-author-placeholder', 'Y');
    placeholder.setAttribute('aria-hidden', 'true');

    const meta = document.createElement('div');
    meta.className = 'review-author-meta';
    appendTextElement(meta, 'span', 'review-author-name', review.authorName || 'Utente Google');
    appendTextElement(meta, 'span', 'review-source', 'Recensione da Google Maps');

    const formattedDate = formatReviewDate(review.updateTime || review.createTime);
    if (formattedDate) {
      const time = appendTextElement(meta, 'time', 'review-date', formattedDate);
      time.dateTime = review.updateTime || review.createTime;
    }

    author.appendChild(meta);
    article.appendChild(author);
    return article;
  }

  function setupCarouselControls(track, previousButton, nextButton) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let updateFrame = null;

    const scrollAmount = () => {
      const card = track.querySelector('.review-card');
      if (!card) return track.clientWidth;
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 16;
      return card.getBoundingClientRect().width + gap;
    };

    const scrollByCard = direction => {
      track.scrollBy({
        left: direction * scrollAmount(),
        behavior: reduceMotion.matches ? 'auto' : 'smooth'
      });
    };

    const updateControls = () => {
      updateFrame = null;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      previousButton.disabled = track.scrollLeft <= 2;
      nextButton.disabled = track.scrollLeft >= maxScroll - 2;
      previousButton.hidden = maxScroll <= 2;
      nextButton.hidden = maxScroll <= 2;
    };

    const scheduleControlUpdate = () => {
      if (updateFrame !== null) return;
      updateFrame = window.requestAnimationFrame(updateControls);
    };

    previousButton.addEventListener('click', () => scrollByCard(-1));
    nextButton.addEventListener('click', () => scrollByCard(1));
    track.addEventListener('scroll', scheduleControlUpdate, { passive: true });
    track.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      scrollByCard(event.key === 'ArrowLeft' ? -1 : 1);
    });

    if ('ResizeObserver' in window) {
      new ResizeObserver(scheduleControlUpdate).observe(track);
    } else {
      window.addEventListener('resize', scheduleControlUpdate);
    }

    updateControls();
  }

  async function initGoogleReviews() {
    const section = document.querySelector('[data-google-reviews]');
    if (!section) return;

    const endpoint = safeEndpointUrl(section.dataset.reviewsEndpoint || '');
    if (!endpoint) return;

    const loading = section.querySelector('[data-google-reviews-loading]');
    const summary = section.querySelector('[data-google-reviews-summary]');
    const carousel = section.querySelector('[data-google-reviews-carousel]');
    const track = section.querySelector('[data-google-reviews-track]');
    const fallback = section.querySelector('[data-google-reviews-fallback]');
    const footer = section.querySelector('[data-google-reviews-footer]');
    const ratingElement = section.querySelector('[data-google-average-rating]');
    const totalElement = section.querySelector('[data-google-total-reviews]');
    const summaryStars = section.querySelector('[data-google-summary-stars]');
    const profileLink = section.querySelector('[data-google-business-profile-link]');
    const staleNote = section.querySelector('[data-google-reviews-stale]');
    const previousButton = section.querySelector('[data-google-reviews-prev]');
    const nextButton = section.querySelector('[data-google-reviews-next]');

    if (!loading || !summary || !carousel || !track || !fallback || !footer ||
        !ratingElement || !totalElement || !summaryStars || !profileLink ||
        !staleNote || !previousButton || !nextButton) return;

    section.hidden = false;
    section.setAttribute('aria-busy', 'true');
    const requestController = new AbortController();
    const requestTimeout = window.setTimeout(() => requestController.abort(), 10000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: requestController.signal
      });

      if (!response.ok) throw new Error('reviews_unavailable');
      const data = await response.json();
      if (!isValidPayload(data)) throw new Error('invalid_reviews_payload');

      const averageRating = Number(data.averageRating);
      const roundedRating = Math.max(1, Math.min(5, Math.round(averageRating)));
      summaryStars.textContent = `${'★'.repeat(roundedRating)}${'☆'.repeat(5 - roundedRating)}`;
      summaryStars.setAttribute('aria-label', `${formatItalianRating(averageRating)} stelle su 5`);
      ratingElement.textContent = `${formatItalianRating(averageRating)} su Google Maps`;
      totalElement.textContent = `Basato su ${integerFormatter.format(Number(data.totalReviewCount))} recensioni`;

      const profileUrl = safeHttpsUrl(data.businessProfileUrl);
      if (profileUrl) profileLink.href = profileUrl;

      track.replaceChildren();
      data.reviews.slice(0, 10).forEach(review => {
        if (!review || typeof review.comment !== 'string' || !review.comment.trim()) return;
        track.appendChild(createReviewCard(review));
      });

      if (!track.childElementCount) throw new Error('no_text_reviews');

      loading.hidden = true;
      summary.hidden = false;
      carousel.hidden = false;
      footer.hidden = false;
      staleNote.hidden = data.isStale !== true;
      setupCarouselControls(track, previousButton, nextButton);
    } catch (error) {
      console.error('[Google Reviews]', error instanceof Error ? error.message : 'unknown_error');
      loading.hidden = true;
      fallback.hidden = false;
      footer.hidden = false;
    } finally {
      window.clearTimeout(requestTimeout);
      section.setAttribute('aria-busy', 'false');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleReviews, { once: true });
  } else {
    initGoogleReviews();
  }
})();
