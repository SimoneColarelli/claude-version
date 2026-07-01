'use strict';

const fs = require('fs');
const path = require('path');
const publicRoot = path.resolve(__dirname, '..', 'public');
const model = require(path.join(publicRoot, 'assets/js/content-model.js'));

const root = publicRoot;
let hasErrors = false;

function reportError(label, error) {
  hasErrors = true;
  console.error(`\n[ERRORE] ${label}`);
  console.error(error.message || error);
  if (Array.isArray(error.issues)) {
    error.issues.forEach(issue => console.error(`  - ${issue}`));
  }
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  let source;
  try {
    source = fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    throw new Error(`${relativePath}: file non leggibile (${error.message})`);
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`${relativePath}: JSON non valido (${error.message})`);
  }
}

function validateMediaFiles(coursesData) {
  const missing = [];
  coursesData.corsi.forEach((course, index) => {
    const media = [
      ...(course.immagine && course.immagine.src ? [['immagine.src', course.immagine.src]] : []),
      ...(course.videoAnteprima && course.videoAnteprima.src ? [['videoAnteprima.src', course.videoAnteprima.src]] : [])
    ];
    media.forEach(([field, relativePath]) => {
      if (!fs.existsSync(path.join(root, relativePath))) {
        missing.push(`content/corsi.json.corsi[${index}].${field}: file non trovato (${relativePath})`);
      }
    });
  });
  if (missing.length > 0) {
    const error = new Error(`${missing.length} file multimediali mancanti`);
    error.issues = missing;
    throw error;
  }
}

let coursesData = null;
try {
  coursesData = model.validateCourses(readJson('content/corsi.json'));
  validateMediaFiles(coursesData);
  console.log('[OK] content/corsi.json e relativi media');
} catch (error) {
  reportError('Corsi', error);
}

try {
  const plansData = readJson('content/abbonamenti.json');
  model.validatePlans(plansData);
  console.log('[OK] content/abbonamenti.json');
} catch (error) {
  reportError('Abbonamenti', error);
}

if (coursesData) {
  try {
    const scheduleData = readJson('content/orari.json');
    model.validateSchedule(scheduleData, coursesData);
    console.log('[OK] content/orari.json');
  } catch (error) {
    reportError('Orario', error);
  }
} else {
  reportError('Orario', new Error('controllo sospeso: correggere prima content/corsi.json'));
}

if (hasErrors) {
  console.error('\nValidazione fallita. I file non sono pronti per il caricamento.');
  process.exitCode = 1;
} else {
  console.log('\nTutti i contenuti sono validi e pronti per il caricamento.');
}
