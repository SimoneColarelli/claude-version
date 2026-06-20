(function () {
  'use strict';

  const model = window.YogisContentModel;
  if (!model) {
    console.error('[Yogis CMS] Modello di validazione non disponibile. Mantengo i contenuti HTML di fallback.');
    return;
  }

  const CONTENT_PATHS = {
    courses: '/content/corsi.json',
    schedule: '/content/orari.json',
    plans: '/content/abbonamenti.json'
  };

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function siteUrl(path) {
    const rootPath = path.startsWith('/') ? path : `/${path}`;
    return new URL(rootPath, window.location.origin).href;
  }

  function hasMediaSource(media) {
    return media && typeof media.src === 'string' && media.src.trim() !== '';
  }

  async function fetchJson(path) {
    const url = new URL(path, document.baseURI);
    url.searchParams.set('cms', Date.now().toString());
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error(`${path}: risposta HTTP ${response.status}`);
    try {
      return await response.json();
    } catch (error) {
      throw new Error(`${path}: JSON non valido (${error.message})`);
    }
  }

  function logFailure(section, error) {
    console.group(`[Yogis CMS] ${section}: uso il contenuto HTML di fallback`);
    console.error(error.message || error);
    if (Array.isArray(error.issues)) {
      error.issues.forEach(issue => console.error(`- ${issue}`));
    }
    console.groupEnd();
  }

  function setBusy(nodes, isBusy) {
    nodes.filter(Boolean).forEach(node => {
      if (isBusy) node.setAttribute('aria-busy', 'true');
      else node.removeAttribute('aria-busy');
    });
  }

  function createCourseMedia(course) {
    if (hasMediaSource(course.videoAnteprima)) {
      const video = element('video', 'corso-media');
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      const source = document.createElement('source');
      source.src = siteUrl(course.videoAnteprima.src);
      source.type = course.videoAnteprima.type;
      video.append(source);
      showVideoFirstFrame(video);
      return video;
    }

    const image = element('img', 'corso-media');
    image.src = siteUrl(course.immagine.src);
    image.alt = '';
    image.loading = 'lazy';
    image.setAttribute('aria-hidden', 'true');
    image.addEventListener('error', () => image.remove(), { once: true });
    return image;
  }

  function showVideoFirstFrame(video) {
    const seekToPreview = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      video.currentTime = Math.min(0.1, video.duration / 2);
    };
    if (video.readyState >= 1) seekToPreview();
    else video.addEventListener('loadedmetadata', seekToPreview, { once: true });
  }

  function createCourseCard(course, index, hrefPrefix, showAudience) {
    const card = element('a', `corso-card corso-card-${course.id}`);
    card.href = `${hrefPrefix}#${course.id}`;
    card.dataset.courseId = course.id;
    card.append(createCourseMedia(course));
    card.append(element('span', 'corso-number', String(index + 1).padStart(2, '0')));
    card.append(element('h3', 'corso-name', course.nome));
    card.append(element('p', 'corso-desc', course.descrizioneBreve));
    if (showAudience) card.append(element('span', 'corso-detail', course.destinatari));
    card.append(element('span', 'corso-arrow', '↗'));
    return card;
  }

  function createCourseCards(courses, hrefPrefix, showAudience) {
    const fragment = document.createDocumentFragment();
    const cards = [];
    courses.forEach((course, index) => {
      const card = createCourseCard(course, index, hrefPrefix, showAudience);
      cards.push(card);
      fragment.append(card);
    });
    return { fragment, cards };
  }

  function appendStyledCourseName(heading, name) {
    const separator = name.indexOf(' ');
    if (separator < 0) {
      heading.textContent = name;
      return;
    }
    heading.append(document.createTextNode(`${name.slice(0, separator)} `));
    heading.append(element('em', '', name.slice(separator + 1)));
  }

  function createCourseDetail(course, index) {
    const section = element('section', 'section-corso-detail');
    section.id = course.id;

    const visual = element('div', 'corso-detail-visual');
    if (hasMediaSource(course.immagine)) {
      const image = document.createElement('img');
      image.src = siteUrl(course.immagine.src);
      image.alt = course.immagine.alt;
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        if (hasMediaSource(course.videoAnteprima)) image.replaceWith(createDetailVideo(course));
        else image.replaceWith(element('div', 'corso-detail-visual-placeholder', '✦'));
      }, { once: true });
      visual.append(image);
    } else {
      visual.append(createDetailVideo(course));
    }

    const text = element('div', 'corso-detail-text');
    text.append(element('p', 'section-label', `${String(index + 1).padStart(2, '0')} · ${course.destinatari}`));
    const heading = element('h2', 'section-title');
    appendStyledCourseName(heading, course.nome);
    text.append(heading, element('div', 'divider'));
    course.descrizioneLunga.forEach(paragraph => text.append(element('p', 'section-body', paragraph)));

    const tags = element('div', 'corso-tags');
    course.tags.forEach(tag => tags.append(element('span', 'corso-tag', tag)));
    text.append(tags);

    const booking = element('a', 'btn-primary', 'Prenota una lezione');
    booking.href = 'https://wa.me/3452233737';
    text.append(booking);
    section.append(visual, text);
    return section;
  }

  function createDetailVideo(course) {
    const video = document.createElement('video');
    video.className = 'corso-detail-media';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', `Anteprima video di ${course.nome}`);
    const source = document.createElement('source');
    source.src = siteUrl(course.videoAnteprima.src);
    source.type = course.videoAnteprima.type;
    video.append(source);
    showVideoFirstFrame(video);
    video.addEventListener('error', () => {
      video.replaceWith(element('div', 'corso-detail-visual-placeholder', '✦'));
    }, { once: true });
    return video;
  }

  function tickerItem(label, highlighted) {
    const item = document.createElement('p');
    if (highlighted) item.append(element('strong', '', label));
    else item.textContent = label;
    return item;
  }

  function createTickerGroup(courses, hidden) {
    const group = element('div', 'intro-strip-group');
    if (hidden) group.setAttribute('aria-hidden', 'true');
    for (let cycle = 0; cycle < 2; cycle += 1) {
      courses.forEach((course, index) => group.append(tickerItem(course.nome, index % 2 === 0)));
      group.append(tickerItem('Online', true));
    }
    return group;
  }

  function playCardVideo(card) {
    const video = card.querySelector('video.corso-media');
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }

  function resetCardVideo(card) {
    const video = card.querySelector('video.corso-media');
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  function installCourseInteractions(cards) {
    cards.forEach(card => {
      const video = card.querySelector('video.corso-media');
      if (!video) return;
      video.load();
      card.addEventListener('mouseenter', () => playCardVideo(card));
      card.addEventListener('mouseleave', () => resetCardVideo(card));
      card.addEventListener('focusin', () => playCardVideo(card));
      card.addEventListener('focusout', () => resetCardVideo(card));
    });

    if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    let activeCard = null;
    let animationFrame = null;
    const updateActiveCard = () => {
      animationFrame = null;
      const viewportCenter = window.innerHeight / 2;
      let nextCard = null;
      let nearestDistance = Infinity;
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        if (visibleHeight / rect.height < 0.48) return;
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (distance < nearestDistance) {
          nextCard = card;
          nearestDistance = distance;
        }
      });
      if (nextCard === activeCard) return;
      if (activeCard) {
        activeCard.classList.remove('is-in-view');
        resetCardVideo(activeCard);
      }
      activeCard = nextCard;
      if (activeCard) {
        activeCard.classList.add('is-in-view');
        playCardVideo(activeCard);
      }
    };
    const requestUpdate = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(updateActiveCard);
    };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function renderHomeCourses(data) {
    const grid = document.querySelector('#corsi .corsi-grid');
    const ticker = document.querySelector('.intro-strip-track');
    if (!grid || !ticker) throw new Error('contenitori corsi della homepage non trovati');

    const courseCards = createCourseCards(data.corsi, '/corsi/', false);
    const tickerGroups = document.createDocumentFragment();
    tickerGroups.append(createTickerGroup(data.corsi, false), createTickerGroup(data.corsi, true));

    grid.replaceChildren(courseCards.fragment);
    ticker.replaceChildren(tickerGroups);
    installCourseInteractions(courseCards.cards);
  }

  function renderCoursePage(data) {
    const grid = document.querySelector('.section-corsi .corsi-grid');
    const callToAction = document.querySelector('.section-cta');
    const oldDetails = Array.from(document.querySelectorAll('.section-corso-detail'));
    if (!grid || !callToAction || oldDetails.length === 0) {
      throw new Error('contenitori della pagina corsi non trovati');
    }

    const courseCards = createCourseCards(data.corsi, '', true);
    const detailSections = data.corsi.map(createCourseDetail);

    grid.replaceChildren(courseCards.fragment);
    oldDetails.forEach(section => section.remove());
    detailSections.forEach(section => callToAction.before(section));
    installCourseInteractions(courseCards.cards);

    if (window.location.hash) {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) target.scrollIntoView();
      });
    }
  }

  function createSchedule(data, coursesData) {
    const courseById = new Map(coursesData.corsi.map(course => [course.id, course]));
    const teacherById = new Map(data.insegnanti.map(teacher => [teacher.id, teacher]));
    const orderedDays = [...data.giorni].sort(
      (left, right) => model.DAY_ORDER.indexOf(left.giorno) - model.DAY_ORDER.indexOf(right.giorno)
    );
    const fragment = document.createDocumentFragment();

    orderedDays.forEach(day => {
      const article = element('article', 'orario-day');
      const dayName = element('div', 'orario-day-name');
      dayName.append(element('h3', '', model.DAY_LABELS[day.giorno]));
      const slots = element('ul', 'orario-slots');

      [...day.lezioni].sort((left, right) => left.ora.localeCompare(right.ora)).forEach(lesson => {
        const course = courseById.get(lesson.corsoId);
        const teacher = teacherById.get(lesson.insegnanteId);
        const item = element('li', 'orario-slot');
        const time = element('time', 'orario-time', lesson.ora);
        time.dateTime = lesson.ora;
        const courseName = element('span', 'orario-course', course.nome);
        const teacherLabel = element('span', 'orario-teacher', teacher.sigla);
        teacherLabel.setAttribute('aria-label', `Insegnante ${teacher.nome}`);
        teacherLabel.title = `Insegnante: ${teacher.nome}`;
        item.append(time, courseName, teacherLabel);
        slots.append(item);
      });

      article.append(dayName, slots);
      fragment.append(article);
    });
    return fragment;
  }

  function renderSchedule(data, coursesData) {
    const board = document.querySelector('.orario-board');
    if (!board) throw new Error('contenitore orario non trovato');
    board.replaceChildren(createSchedule(data, coursesData));
  }

  function createPlanCard(plan) {
    const card = element('div', plan.inEvidenza ? 'prezzo-card featured' : 'prezzo-card');
    card.dataset.planId = plan.id;
    card.append(element('p', 'prezzo-tipo', plan.tipo));
    card.append(element('p', 'prezzo-nome', plan.nome));
    const priceBlock = document.createElement('div');
    priceBlock.append(element('p', 'prezzo-importo', plan.prezzo));
    priceBlock.append(element('p', 'prezzo-periodo', `${plan.periodo} · ${plan.frequenza}`));
    card.append(priceBlock, element('div', 'prezzo-divider'));
    const details = element('ul', 'prezzo-dettagli');
    plan.descrizione.forEach(item => details.append(element('li', '', item)));
    card.append(details);
    return card;
  }

  function renderPlans(data) {
    const grid = document.querySelector('.prezzi-grid');
    if (!grid) throw new Error('contenitore abbonamenti non trovato');
    const fragment = document.createDocumentFragment();
    data.abbonamenti.forEach(plan => fragment.append(createPlanCard(plan)));
    grid.replaceChildren(fragment);
  }

  async function init() {
    const page = document.body.dataset.cmsPage;
    const courseTargets = [
      document.querySelector('.section-corsi .corsi-grid'),
      document.querySelector('.intro-strip-track')
    ];
    const scheduleTarget = document.querySelector('.orario-board');
    const plansTarget = document.querySelector('.prezzi-grid');
    const needsCourses = page === 'home' || page === 'courses' || page === 'schedule';

    setBusy(courseTargets, needsCourses);
    setBusy([scheduleTarget], page === 'schedule');
    setBusy([plansTarget], page === 'schedule');

    const coursesRequest = needsCourses ? fetchJson(CONTENT_PATHS.courses) : Promise.resolve(null);
    const scheduleRequest = page === 'schedule' ? fetchJson(CONTENT_PATHS.schedule) : Promise.resolve(null);
    const plansRequest = page === 'schedule' ? fetchJson(CONTENT_PATHS.plans) : Promise.resolve(null);
    const [coursesResult, scheduleResult, plansResult] = await Promise.allSettled([
      coursesRequest,
      scheduleRequest,
      plansRequest
    ]);

    let coursesData = null;
    if (needsCourses) {
      try {
        if (coursesResult.status === 'rejected') throw coursesResult.reason;
        coursesData = model.validateCourses(coursesResult.value);
        if (page === 'home') renderHomeCourses(coursesData);
        if (page === 'courses') renderCoursePage(coursesData);
      } catch (error) {
        logFailure('Corsi', error);
      }
    }

    if (page === 'schedule') {
      try {
        if (!coursesData) throw new Error('orario non aggiornato perché content/corsi.json non è valido');
        if (scheduleResult.status === 'rejected') throw scheduleResult.reason;
        const scheduleData = model.validateSchedule(scheduleResult.value, coursesData);
        renderSchedule(scheduleData, coursesData);
      } catch (error) {
        logFailure('Orario', error);
      }

      try {
        if (plansResult.status === 'rejected') throw plansResult.reason;
        const plansData = model.validatePlans(plansResult.value);
        renderPlans(plansData);
      } catch (error) {
        logFailure('Abbonamenti', error);
      }
    }

    setBusy(courseTargets, false);
    setBusy([scheduleTarget, plansTarget], false);
    document.dispatchEvent(new CustomEvent('yogis:content-ready', { detail: { page } }));
  }

  init().catch(error => logFailure('Inizializzazione', error));
}());
