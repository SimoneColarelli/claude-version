(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.YogisContentModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA_VERSION = 1;
  const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const DAY_ORDER = [
    'lunedi',
    'martedi',
    'mercoledi',
    'giovedi',
    'venerdi',
    'sabato',
    'domenica'
  ];
  const DAY_LABELS = {
    lunedi: 'LUNEDI\'',
    martedi: 'MARTEDÌ',
    mercoledi: 'MERCOLEDÌ',
    giovedi: 'GIOVEDÌ',
    venerdi: 'VENERDÌ',
    sabato: 'SABATO',
    domenica: 'DOMENICA'
  };
  const DAY_SHORT_LABELS = {
    lunedi: 'LUN.',
    martedi: 'MAR.',
    mercoledi: 'MER.',
    giovedi: 'GIO.',
    venerdi: 'VEN.',
    sabato: 'SAB.',
    domenica: 'DOM.'
  };

  class ContentValidationError extends Error {
    constructor(file, issues) {
      super(`${file}: ${issues.length} errori di validazione`);
      this.name = 'ContentValidationError';
      this.file = file;
      this.issues = issues;
    }
  }

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function addIssue(issues, path, message) {
    issues.push(`${path}: ${message}`);
  }

  function requireObject(value, path, issues) {
    if (!isObject(value)) {
      addIssue(issues, path, 'deve essere un oggetto');
      return false;
    }
    return true;
  }

  function requireString(value, path, issues, options) {
    const settings = options || {};
    if (typeof value !== 'string' || value.trim() === '') {
      addIssue(issues, path, 'deve essere una stringa non vuota');
      return false;
    }
    if (settings.maxLength && value.length > settings.maxLength) {
      addIssue(issues, path, `non può superare ${settings.maxLength} caratteri`);
      return false;
    }
    return true;
  }

  function requireSlug(value, path, issues) {
    if (!requireString(value, path, issues)) return false;
    if (!SLUG_PATTERN.test(value)) {
      addIssue(issues, path, 'usa solo lettere minuscole, numeri e trattini');
      return false;
    }
    return true;
  }

  function requireStringArray(value, path, issues) {
    if (!Array.isArray(value) || value.length === 0) {
      addIssue(issues, path, 'deve essere un array non vuoto');
      return false;
    }
    value.forEach((item, index) => requireString(item, `${path}[${index}]`, issues));
    return true;
  }

  function requireRelativePath(value, path, issues) {
    if (!requireString(value, path, issues)) return false;
    const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(value);
    const hasParentSegment = value.split('/').some(part => part === '..');
    if (hasProtocol || value.startsWith('/') || value.startsWith('\\') || value.includes('\\') || hasParentSegment) {
      addIssue(issues, path, 'deve essere un percorso relativo al sito, senza protocollo, backslash o ".."');
      return false;
    }
    return true;
  }

  function requireSchemaVersion(data, file, issues) {
    if (!isObject(data)) {
      addIssue(issues, file, 'il contenuto principale deve essere un oggetto');
      return false;
    }
    if (data.schemaVersion !== SCHEMA_VERSION) {
      addIssue(issues, `${file}.schemaVersion`, `deve essere ${SCHEMA_VERSION}`);
      return false;
    }
    return true;
  }

  function checkDuplicate(id, path, seen, issues) {
    if (!id || seen.has(id)) {
      if (id) addIssue(issues, path, `ID duplicato: ${id}`);
      return;
    }
    seen.add(id);
  }

  function finishValidation(file, data, issues) {
    if (issues.length > 0) throw new ContentValidationError(file, issues);
    return data;
  }

  function validateCourses(data) {
    const file = 'content/corsi.json';
    const issues = [];
    if (!requireSchemaVersion(data, file, issues)) return finishValidation(file, data, issues);

    if (!Array.isArray(data.corsi) || data.corsi.length === 0) {
      addIssue(issues, `${file}.corsi`, 'deve essere un array non vuoto');
      return finishValidation(file, data, issues);
    }

    const seenIds = new Set();
    data.corsi.forEach((course, index) => {
      const path = `${file}.corsi[${index}]`;
      if (!requireObject(course, path, issues)) return;

      if (requireSlug(course.id, `${path}.id`, issues)) {
        checkDuplicate(course.id, `${path}.id`, seenIds, issues);
      }
      requireString(course.nome, `${path}.nome`, issues);
      requireString(course.destinatari, `${path}.destinatari`, issues);
      requireString(course.descrizioneBreve, `${path}.descrizioneBreve`, issues);
      requireStringArray(course.descrizioneLunga, `${path}.descrizioneLunga`, issues);
      requireStringArray(course.tags, `${path}.tags`, issues);

      const hasImage = isObject(course.immagine)
        && typeof course.immagine.src === 'string'
        && course.immagine.src.trim() !== '';
      const hasVideo = isObject(course.videoAnteprima)
        && typeof course.videoAnteprima.src === 'string'
        && course.videoAnteprima.src.trim() !== '';

      if (!hasImage && !hasVideo) {
        addIssue(issues, path, 'richiede almeno immagine oppure videoAnteprima');
      }

      if (hasImage) {
        requireRelativePath(course.immagine.src, `${path}.immagine.src`, issues);
        requireString(course.immagine.alt, `${path}.immagine.alt`, issues);
      }

      if (hasVideo) {
        requireRelativePath(course.videoAnteprima.src, `${path}.videoAnteprima.src`, issues);
        requireString(course.videoAnteprima.type, `${path}.videoAnteprima.type`, issues);
      }
    });

    return finishValidation(file, data, issues);
  }

  function validateSchedule(data, coursesData) {
    const file = 'content/orari.json';
    const issues = [];
    if (!requireSchemaVersion(data, file, issues)) return finishValidation(file, data, issues);

    const courseIds = new Set(
      coursesData && Array.isArray(coursesData.corsi)
        ? coursesData.corsi.map(course => course.id)
        : []
    );
    if (courseIds.size === 0) {
      addIssue(issues, file, 'impossibile verificare corsoId senza un content/corsi.json valido');
    }

    const teacherIds = new Set();
    if (!Array.isArray(data.insegnanti) || data.insegnanti.length === 0) {
      addIssue(issues, `${file}.insegnanti`, 'deve essere un array non vuoto');
    } else {
      data.insegnanti.forEach((teacher, index) => {
        const path = `${file}.insegnanti[${index}]`;
        if (!requireObject(teacher, path, issues)) return;
        if (requireSlug(teacher.id, `${path}.id`, issues)) {
          checkDuplicate(teacher.id, `${path}.id`, teacherIds, issues);
        }
        requireString(teacher.nome, `${path}.nome`, issues);
        requireString(teacher.sigla, `${path}.sigla`, issues, { maxLength: 4 });
      });
    }

    const seenDays = new Set();
    const seenLessons = new Set();
    if (!Array.isArray(data.giorni) || data.giorni.length === 0) {
      addIssue(issues, `${file}.giorni`, 'deve essere un array non vuoto');
    } else {
      data.giorni.forEach((day, dayIndex) => {
        const path = `${file}.giorni[${dayIndex}]`;
        if (!requireObject(day, path, issues)) return;

        if (requireString(day.giorno, `${path}.giorno`, issues)) {
          if (!DAY_ORDER.includes(day.giorno)) {
            addIssue(issues, `${path}.giorno`, `valore non riconosciuto: ${day.giorno}`);
          } else {
            checkDuplicate(day.giorno, `${path}.giorno`, seenDays, issues);
          }
        }

        if (!Array.isArray(day.lezioni) || day.lezioni.length === 0) {
          addIssue(issues, `${path}.lezioni`, 'deve essere un array non vuoto');
          return;
        }

        day.lezioni.forEach((lesson, lessonIndex) => {
          const lessonPath = `${path}.lezioni[${lessonIndex}]`;
          if (!requireObject(lesson, lessonPath, issues)) return;

          if (requireString(lesson.ora, `${lessonPath}.ora`, issues) && !TIME_PATTERN.test(lesson.ora)) {
            addIssue(issues, `${lessonPath}.ora`, 'usa il formato 24 ore HH:MM');
          }
          const courseId = typeof lesson.corsoId === 'string' ? lesson.corsoId.trim() : '';
          const teacherId = typeof lesson.insegnanteId === 'string' ? lesson.insegnanteId.trim() : '';
          const isEmptySlot = !courseId && !teacherId;

          if (!isEmptySlot && (!courseId || !teacherId)) {
            addIssue(
              issues,
              lessonPath,
              'corsoId e insegnanteId devono essere entrambi valorizzati oppure entrambi vuoti'
            );
          }

          if (courseId && !courseIds.has(courseId)) {
            addIssue(issues, `${lessonPath}.corsoId`, `corso inesistente: ${courseId}`);
          }
          if (teacherId && !teacherIds.has(teacherId)) {
            addIssue(issues, `${lessonPath}.insegnanteId`, `insegnante inesistente: ${teacherId}`);
          }

          const lessonKey = `${day.giorno}|${lesson.ora}`;
          if (seenLessons.has(lessonKey)) {
            addIssue(issues, lessonPath, 'lezione duplicata');
          }
          seenLessons.add(lessonKey);
        });
      });
    }

    return finishValidation(file, data, issues);
  }

  function validatePlans(data) {
    const file = 'content/abbonamenti.json';
    const issues = [];
    if (!requireSchemaVersion(data, file, issues)) return finishValidation(file, data, issues);

    if (!Array.isArray(data.abbonamenti) || data.abbonamenti.length === 0) {
      addIssue(issues, `${file}.abbonamenti`, 'deve essere un array non vuoto');
      return finishValidation(file, data, issues);
    }

    const seenIds = new Set();
    data.abbonamenti.forEach((plan, index) => {
      const path = `${file}.abbonamenti[${index}]`;
      if (!requireObject(plan, path, issues)) return;

      if (requireSlug(plan.id, `${path}.id`, issues)) {
        checkDuplicate(plan.id, `${path}.id`, seenIds, issues);
      }
      requireString(plan.tipo, `${path}.tipo`, issues);
      requireString(plan.nome, `${path}.nome`, issues);
      if (!Array.isArray(plan.pacchetti) || plan.pacchetti.length === 0) {
        addIssue(issues, `${path}.pacchetti`, 'deve essere un array non vuoto');
        return;
      }

      plan.pacchetti.forEach((packageItem, packageIndex) => {
        const packagePath = `${path}.pacchetti[${packageIndex}]`;
        if (!requireObject(packageItem, packagePath, issues)) return;
        requireString(packageItem.nome, `${packagePath}.nome`, issues);
        requireString(packageItem.prezzo, `${packagePath}.prezzo`, issues);
        requireString(packageItem.prezzoSpeciale, `${packagePath}.prezzoSpeciale`, issues);
      });
    });

    return finishValidation(file, data, issues);
  }

  return {
    ContentValidationError,
    DAY_LABELS,
    DAY_SHORT_LABELS,
    DAY_ORDER,
    SCHEMA_VERSION,
    validateCourses,
    validatePlans,
    validateSchedule
  };
}));
