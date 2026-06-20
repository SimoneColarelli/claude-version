# DESIGN.md - Guida stile Yogis

Questo documento serve a importare fedelmente lo stile visivo del sito Yogis in un altro progetto. Usalo come brief operativo: prima ricrea i token, poi applica i pattern di layout e componenti. Lo stile deve risultare caldo, essenziale, editoriale, arioso e naturale.

## Sintesi Visiva

Yogis e' un sito wellness/yoga con estetica premium ma accessibile: fondi crema e bianchi, accenti terracotta, testi scuri caldi, fotografie ampie e naturali, griglie ordinate e micro-interazioni discrete.

Parole chiave: caldo, pulito, intimo, naturale, editoriale, lento, curato, materico, respirabile.

Evita: gradienti decorativi non funzionali, viola/blu freddi, ombre pesanti, card arrotondate, UI troppo tech, bordi radius evidenti, saturazione eccessiva, font geometrici freddi senza calore.

## Token CSS Canonici

Importa Google Fonts e definisci questi token globali. Nel sito originale alcuni link font includono anche Cormorant/Jost, ma i token effettivamente usati sono Poppins e Montserrat.

```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap");

:root {
  --white: #FFFFFF;
  --cream: #F7F2EA;
  --cream-mid: #EDE5D5;
  --sand: #C8B89A;
  --sand-dark: #A8926E;
  --terracotta: #B5714A;
  --terra-light: #C98B67;
  --terra-dark: #8C5A36;
  --terra-pale: #F0E0D4;
  --charcoal: #2A2520;
  --black: #000000;
  --brown: #6B5344;
  --brown-light: #9C7E6A;
  --olive: #7A8456;
  --olive-pale: #EAE9DF;
  --font-display: "Poppins", sans-serif;
  --font-body: "Montserrat", sans-serif;
  --pad: clamp(4rem, 8vw, 7rem);
  --gutter: clamp(1.5rem, 6vw, 5rem);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background: var(--white);
  color: var(--charcoal);
  font-weight: 500;
  overflow-x: hidden;
}
```

## Tipografia

Usa Montserrat per corpo, navigazione, label e bottoni. Usa Poppins per titoli grandi, numeri decorativi, nomi di card e CTA. Il look nasce dal contrasto tra testi piccoli molto spaziati e titoli grandi, compatti, spesso con enfasi italic.

Gerarchie principali:

```css
.page-title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.01em;
  color: var(--charcoal);
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(3.2rem, 9vw, 7.5rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.01em;
  color: var(--white);
}

.section-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 500;
  line-height: 1.18;
  color: var(--charcoal);
}

.section-label {
  font-size: 0.65rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--terracotta);
}

.section-body,
.page-intro {
  font-size: 0.95rem;
  line-height: 1.75;
  color: var(--brown);
  max-width: 46ch;
}

em {
  font-style: italic;
  color: var(--terra-light);
  font-weight: 400;
}
```

Regole:

- Titoli hero e page header: molto grandi, line-height stretta, peso 800.
- Titoli sezione: Poppins, peso 500, meno aggressivi.
- Label: sempre uppercase, letter-spacing forte, piccole.
- Body: line-height generosa, max-width 42-50ch.
- I corsivi sono accenti caldi, non decorazioni casuali.

## Layout

Il sito usa sezioni a banda piena, senza card esterne o contenitori flottanti. I contenuti respirano grazie a `--pad` e `--gutter`.

Pattern principali:

```css
.two-column-section {
  padding: var(--pad) var(--gutter);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(3rem, 6vw, 7rem);
  align-items: center;
  background: var(--white);
}

.section-cream {
  padding: var(--pad) var(--gutter);
  background: var(--cream);
}

.section-header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
}

.divider {
  width: 40px;
  height: 1px;
  background: var(--sand);
  margin: 1.4rem 0;
}
```

Su mobile sotto 768px, tutte le griglie a due colonne diventano una colonna. Le CTA allineate a destra tornano allineate a sinistra.

```css
@media (max-width: 768px) {
  .two-column-section {
    grid-template-columns: 1fr;
  }

  .section-header-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

## Navigazione

La nav e' fissa, molto sottile, con logo a sinistra, link centrali/destra, CTA "Prenota". In homepage parte trasparente sopra hero scuro, poi diventa bianca allo scroll; nelle pagine interne e' bianca da subito.

```css
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem var(--gutter);
  background: var(--white);
  transition: background 0.4s, box-shadow 0.4s;
}

nav.scrolled {
  box-shadow: 0 1px 0 rgba(42, 37, 32, 0.08);
  backdrop-filter: blur(10px);
}

.nav-logo {
  display: block;
  width: clamp(58px, 7vw, 86px);
  aspect-ratio: 467.82 / 353.09;
  background: url("assets/images/Yogis Logo.svg") center / contain no-repeat;
}

.nav-links {
  display: flex;
  gap: clamp(1.2rem, 3vw, 2.5rem);
  list-style: none;
}

.nav-links a {
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--brown);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.active {
  color: var(--terracotta);
}
```

Mobile menu: overlay full-screen crema, link grandi Poppins italic, centrati verticalmente.

```css
.mobile-menu {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 99;
  background: var(--cream);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.mobile-menu.open {
  display: flex;
}

.mobile-menu a {
  font-family: var(--font-display);
  font-size: clamp(2rem, 7vw, 3rem);
  font-style: italic;
  color: var(--charcoal);
  text-decoration: none;
}
```

## Hero

La homepage ha un hero fotografico full viewport, testo in basso a sinistra, overlay scuro caldo e accento radiale leggero. Non usare hero split text/image: l'immagine deve essere sfondo.

```css
.hero {
  min-height: 100dvh;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: clamp(6rem, 12vw, 10rem) var(--gutter) clamp(3.5rem, 7vw, 5.5rem);
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(42, 37, 32, 0.72) 0%, rgba(42, 37, 32, 0.48) 42%, rgba(42, 37, 32, 0.2) 100%),
    linear-gradient(0deg, rgba(42, 37, 32, 0.58) 0%, rgba(42, 37, 32, 0.08) 52%),
    url("hero-image.png") center / cover no-repeat;
}

.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 22% 72%, rgba(253, 250, 245, 0.16), transparent 34%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 820px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.68rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(253, 250, 245, 0.9);
  margin-bottom: 2rem;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.34);
}

.hero-tag::before {
  content: "";
  width: 28px;
  height: 1px;
  background: rgba(253, 250, 245, 0.78);
}
```

Mobile hero: riduci altezza a 76-82dvh, centra verticalmente, sposta il focus immagine circa `58% 38-42%`.

## Bottoni e Link

I bottoni non sono arrotondati. Sono rettangolari, uppercase, piccoli, molto spaziati.

```css
.btn-primary {
  display: inline-block;
  padding: 0.9rem 2.4rem;
  background: var(--terracotta);
  color: var(--white);
  text-decoration: none;
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-family: var(--font-body);
  transition: background 0.3s, transform 0.2s;
}

.btn-primary:hover {
  background: var(--terra-light);
  transform: translateY(-2px);
}

.btn-outline-dark {
  display: inline-block;
  padding: 0.8rem 2rem;
  border: 1px solid var(--charcoal);
  color: var(--charcoal);
  text-decoration: none;
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: background 0.3s, color 0.3s;
}

.btn-outline-dark:hover {
  background: var(--charcoal);
  color: var(--white);
}

.btn-ghost-dark {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--brown);
  text-decoration: none;
  font-size: 0.72rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.btn-ghost-dark::after {
  content: "";
  width: 28px;
  height: 1px;
  background: currentColor;
  transition: width 0.3s;
}

.btn-ghost-dark:hover {
  color: var(--terracotta);
}

.btn-ghost-dark:hover::after {
  width: 44px;
}
```

## Card e Griglie

Le card non usano border-radius ne' ombre. La separazione avviene con gap di 1.5px e background del contenitore `--cream-mid`.

```css
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 1.5px;
  background: var(--cream-mid);
}

.simple-card {
  background: var(--white);
  padding: 2.5rem 2rem;
  transition: background 0.3s;
}

.simple-card:hover {
  background: var(--cream);
}
```

Card corsi con video/foto:

```css
.course-card {
  min-height: clamp(22rem, 38vw, 28rem);
  background: var(--cream);
  padding: clamp(2rem, 4vw, 2.8rem) clamp(1.5rem, 3vw, 2rem);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  text-decoration: none;
}

.course-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(249, 243, 235, 0.94) 0%, rgba(249, 243, 235, 0.78) 31%, rgba(249, 243, 235, 0.14) 58%);
  pointer-events: none;
  z-index: 1;
}

.course-card::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--terracotta);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s;
  z-index: 3;
}

.course-card:hover::after {
  transform: scaleX(1);
}

.course-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center bottom;
  filter: saturate(0.78) brightness(0.88) contrast(0.94);
  transition: filter 0.45s ease;
}

.course-card:hover .course-media {
  filter: saturate(1.08) brightness(1.05) contrast(1.02);
}
```

## Immagini e Media

Usa immagini reali, calde, chiare e pertinenti: yoga, studio, interni, movimento, pratica. Le immagini sono rettangolari e tagliate con `object-fit: cover`. Evita illustrazioni astratte come media primario.

Pattern gallery:

```css
.gallery {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.gallery-item {
  overflow: hidden;
  background: var(--cream-mid);
}

.gallery-item:first-child {
  grid-column: 1 / -1;
  aspect-ratio: 16 / 7;
}

.gallery-item:not(:first-child) {
  aspect-ratio: 1;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.gallery-item:hover img {
  transform: scale(1.04);
}
```

Pattern visual singolo:

```css
.visual-portrait {
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--cream-mid);
}

.visual-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

## Sezioni Speciali

Intro strip/marquee: banda terracotta con testo piccolo uppercase bianco in movimento lento.

```css
.intro-strip {
  background: var(--terra-light);
  padding: 1.6rem 0;
  overflow: hidden;
  border-top: 1px solid rgba(181, 113, 74, 0.15);
  border-bottom: 1px solid rgba(181, 113, 74, 0.15);
}

.intro-strip-track {
  display: flex;
  width: max-content;
  animation: introMarquee 38s linear infinite;
}

.intro-strip p {
  color: var(--white);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
}

@keyframes introMarquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .intro-strip-track { animation: none; }
}
```

Quote/support band: terracotta pieno, testo bianco o crema, eventuale box con bordo bianco trasparente.

```css
.support-section {
  padding: var(--pad) var(--gutter);
  background: var(--terra-light);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(3rem, 6vw, 7rem);
  align-items: center;
}

.support-section .section-label {
  color: rgba(255, 255, 255, 0.82);
}

.support-section .section-title {
  color: var(--white);
}

.support-section .section-body {
  color: rgba(255, 255, 255, 0.88);
}

.support-visual {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
  padding: 2.5rem;
}
```

CTA finale: fondo `--cream-mid`, due colonne centrate, grande distanza orizzontale su desktop.

```css
.section-cta {
  padding: clamp(4rem, 8vw, 6.5rem) var(--gutter);
  background: var(--cream-mid);
  display: grid;
  grid-template-columns: auto auto;
  justify-content: center;
  gap: 16rem;
  align-items: center;
  border-top: 1px solid rgba(181, 113, 74, 0.12);
}

.cta-title {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 4.5vw, 3.2rem);
  font-weight: 300;
  color: var(--charcoal);
  line-height: 1.18;
}

.cta-title em {
  color: var(--terracotta);
}

.cta-sub {
  font-size: 0.82rem;
  color: var(--brown-light);
  margin-top: 0.75rem;
  letter-spacing: 0.04em;
}
```

## Prezzi, Liste e Regole

Le card prezzo sono rettangoli senza radius, con una card featured terracotta.

```css
.price-card {
  background: var(--white);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  transition: background 0.3s;
}

.price-card:hover {
  background: var(--cream);
}

.price-card.featured {
  background: var(--terra-light);
}

.price-card.featured:hover {
  background: var(--terracotta);
}

.price-type {
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--terracotta);
}

.price-name {
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 2.5vw, 1.7rem);
  font-weight: 600;
  color: var(--charcoal);
  line-height: 1.2;
}

.price-amount {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 700;
  color: var(--charcoal);
  line-height: 1;
}

.price-card.featured * {
  color: var(--white);
}
```

Liste regolamento: righe separate da bordo `--cream-mid`, numeri grandi italic e chiari.

```css
.rule-list {
  border-top: 1px solid var(--cream-mid);
}

.rule-item {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--cream-mid);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.2rem;
}

.rule-num {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-style: italic;
  color: var(--cream-mid);
  line-height: 1;
}
```

## Footer

Footer nero pieno, logo bianco, tre colonne, link bianchi, titoli colonna terracotta chiara. Separatore sottile quasi invisibile.

```css
footer {
  background: var(--black);
  padding: clamp(3rem, 6vw, 5rem) var(--gutter) 2rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: clamp(2rem, 5vw, 4rem);
  margin-bottom: 3rem;
  padding-bottom: 3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.footer-tagline {
  font-size: 0.85rem;
  color: var(--white);
  line-height: 1.7;
  max-width: 28ch;
}

.footer-col-title {
  font-size: 0.63rem;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--terra-light);
}

.footer-links a {
  font-size: 0.9rem;
  color: var(--white);
  text-decoration: none;
}

.footer-bottom p {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.2);
}
```

## Animazioni e Interazioni

Le animazioni sono lente, leggere e solo dove aiutano il ritmo. Usa fade-up in ingresso su hero/page header.

```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-title {
  animation: fadeUp 0.9s ease 0.2s both;
}

.page-intro {
  animation: fadeUp 0.9s ease 0.4s both;
}
```

Hover ricorrenti:

- Bottoni primary: schiariscono e salgono di 2px.
- Link ghost: la linea laterale si allunga da 28px a 44px.
- Immagini: zoom leggero `scale(1.04)` in 0.6s.
- Card corsi: filtro media piu' luminoso/saturo, barra terracotta in basso.
- Nav link: marrone -> terracotta.

## Responsive

Breakpoint principale: `768px`.

Regole:

- Nascondi `.nav-links` e `.nav-cta-btn`, mostra hamburger.
- Converti le griglie 2 colonne in 1 colonna.
- Footer da 3 colonne a 1 colonna.
- CTA finale da 2 colonne a 1 colonna, allineata a sinistra.
- Visual portrait da `4/5` a `3/2` quando serve piu' compattezza.
- Hero mobile: altezza 76-82dvh, contenuto centrato verticalmente.

```css
@media (max-width: 768px) {
  .nav-links,
  .nav-cta-btn {
    display: none;
  }

  .nav-toggle {
    display: flex;
  }

  .two-column-section,
  .support-section,
  .section-cta {
    grid-template-columns: 1fr;
  }

  .section-cta {
    gap: 2rem;
    text-align: left;
  }

  .cta-side {
    align-items: flex-start;
  }

  .footer-grid {
    grid-template-columns: 1fr;
  }
}
```

## Asset e Direzione Fotografica

Nel sito originale sono usati:

- `assets/images/Yogis Logo.svg`: logo, spesso come background o mask.
- `assets/images/yoga hero image.png`: hero homepage.
- `assets/images/videolezioni image.png`: visual sezione online.
- `assets/images/studio image panoramic.png`, `assets/images/studio image 2.png`, `assets/images/ingresso studio image.png`: gallery studio.
- `assets/videos/`: video di anteprima delle card corso.
- Video corsi: Vinyasa, Pregnancy, Mum & Baby, Advanced.

Se gli asset non sono disponibili nel nuovo progetto, sostituiscili con immagini equivalenti: studio yoga reale, luce naturale, colori caldi, pelle/tessuti/legno/crema, inquadrature pulite. Non sostituire con illustrazioni astratte.

## Checklist per Codex sull'altro progetto

1. Aggiungi i token CSS globali esatti e importa Poppins/Montserrat.
2. Applica background a bande: bianco, crema, crema-mid, terracotta.
3. Ricrea nav fissa, page header, bottoni, CTA finale e footer prima di lavorare sui dettagli.
4. Usa griglie senza radius e senza ombre; separa le card con gap di 1.5px su fondo `--cream-mid`.
5. Mantieni titoli Poppins grandi con enfasi italic terracotta.
6. Usa label uppercase piccole e molto spaziate.
7. Usa immagini reali, rettangolari, con `object-fit: cover` e hover zoom leggero.
8. Verifica mobile sotto 768px: nessun overflow, nav overlay full-screen, CTA e footer in colonna.
9. Mantieni micro-interazioni sobrie: fade-up, hover colore, linea che si allunga, zoom immagine.
10. Non introdurre un design system diverso: niente card tonde, gradienti viola, hero split o UI SaaS.

## Mini Template HTML

```html
<section class="page-header">
  <div class="page-header-content">
    <h1 class="page-title">Titolo <em>Pagina</em></h1>
    <p class="page-intro">Una frase breve, calda e chiara, con massimo 46-50 caratteri per riga.</p>
  </div>
</section>

<section class="two-column-section">
  <div>
    <p class="section-label">Categoria</p>
    <h2 class="section-title">Titolo sezione<br><em>con accento caldo</em></h2>
    <div class="divider"></div>
    <p class="section-body">Testo descrittivo con ritmo lento, max-width contenuto e line-height ariosa.</p>
    <a class="btn-outline-dark" href="#">Scopri di piu</a>
  </div>
  <div class="visual-portrait">
    <img src="image.jpg" alt="">
  </div>
</section>
```
