# Specifica Codex — Carosello recensioni Google custom per Studio Yogis

## Obiettivo

Sostituire il widget Elfsight attualmente presente su `https://www.studioyogis.it/` con una sezione recensioni custom, coerente con il visual di Yogis, alimentata dalle recensioni ufficiali della scheda Google Business Profile dello studio.

La sezione dovrà mostrare circa 10 recensioni in un carosello responsive, senza usare widget esterni e senza scraping.

---

## Fonti ufficiali da rispettare

Codex deve attenersi alla documentazione ufficiale Google:

- Google Business Profile API — Reviews list:  
  https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list

- Google Business Profile API — Work with review data:  
  https://developers.google.com/my-business/content/review-data

- Google Business Profile API — OAuth:  
  https://developers.google.com/my-business/content/implement-oauth

- Google Business Profile API — Policies:  
  https://developers.google.com/my-business/content/policies

- Google Maps Platform attribution requirements:  
  https://developers.google.com/maps/documentation/javascript/policies

---

## Vincoli fondamentali

1. Non usare Elfsight.
2. Non fare scraping da Google Maps o dalla scheda Google.
3. Non esporre credenziali, client secret, refresh token o access token nel frontend.
4. Non usare Google Places API per questa feature, perché per l’obiettivo richiesto è limitante.
5. Usare Google Business Profile Reviews API, perché serve recuperare più recensioni della scheda verificata.
6. Mostrare sempre attribuzione chiara a Google Maps / Google.
7. Non modificare, riscrivere o manipolare il contenuto delle recensioni.
8. Non archiviare le recensioni in modo permanente.
9. Usare cache temporanea solo per performance.
10. Non presentare le recensioni come recensioni della piattaforma online, ma come recensioni dello studio Yogis.

---

## Copy della sezione

Titolo consigliato:

```text
La cura di Yogis, raccontata da chi pratica con noi
```

Sottotitolo:

```text
Le recensioni dello studio raccontano l’attenzione, la presenza e il metodo che portiamo anche nella piattaforma online.
```

Badge rating:

```text
★★★★★ 4,9 su Google Maps
Basato su {totalReviewCount} recensioni
```

CTA finale:

```text
Leggi tutte le recensioni su Google
```

Micro-attribuzione da mostrare vicino al blocco recensioni:

```text
Recensioni provenienti da Google Maps
```

Nota: mantenere `Google Maps` scritto esattamente così, senza tradurlo o alterarlo.

---

## Architettura consigliata

Usare una funzione backend/serverless come intermediario.

Se il progetto usa Supabase, implementare con Supabase Edge Function.

```text
Frontend index.html
   ↓ fetch
Supabase Edge Function: google-reviews
   ↓ usa refresh token OAuth
Google OAuth token endpoint
   ↓ access token
Google Business Profile Reviews API
   ↓ reviews
Cache temporanea in Supabase Postgres
   ↓
Frontend renderizza carosello custom
```

---

## File/cartelle da creare o modificare

Se il progetto è statico HTML/CSS/JS:

```text
/index.html
/assets/css/google-reviews.css
/assets/js/google-reviews-carousel.js
```

Se si usa Supabase:

```text
/supabase/functions/google-reviews/index.ts
/supabase/migrations/YYYYMMDD_create_google_reviews_cache.sql
```

Eventuale script una tantum per ottenere refresh token:

```text
/scripts/google-oauth-init.md
```

oppure

```text
/scripts/google-oauth-init.ts
```

---

## Setup Google Cloud

### 1. Creare progetto Google Cloud

Creare o usare un progetto Google Cloud dedicato a Yogis.

### 2. Abilitare API necessarie

Abilitare le API Google Business Profile necessarie per leggere le recensioni.

Verificare nella console Google Cloud che il progetto abbia accesso alle Business Profile APIs.

### 3. Configurare OAuth consent screen

Creare OAuth consent screen con:

- nome app: `Studio Yogis Reviews`
- email supporto
- dominio autorizzato: `studioyogis.it`
- link privacy policy
- link termini, se richiesti

### 4. Creare credenziali OAuth

Creare OAuth Client ID.

Per sviluppo locale può essere usato un client di tipo Desktop o Web.

Scope richiesto:

```text
https://www.googleapis.com/auth/business.manage
```

Non usare il vecchio scope `plus.business.manage`, perché è deprecato.

### 5. Ottenere refresh token

Serve un refresh token offline generato dal Google Account proprietario o gestore della scheda Google Business Profile dello studio.

Il token va salvato solo come secret lato backend.

---

## Variabili d’ambiente / secrets

In Supabase impostare:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GBP_ACCOUNT_ID=...
GBP_LOCATION_ID=...
GOOGLE_BUSINESS_PROFILE_URL=https://www.google.com/...
ALLOWED_ORIGIN=https://www.studioyogis.it
```

Se il sito è accessibile anche senza `www`, gestire anche:

```text
https://studioyogis.it
```

Non committare mai questi valori nel repository.

---

## Endpoint Google da usare

Endpoint recensioni:

```http
GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews?pageSize=10&orderBy=updateTime desc
```

Parametri:

```text
pageSize=10
orderBy=updateTime desc
```

Motivo:

- mostrare le recensioni più recenti è più trasparente di selezionare solo le più favorevoli;
- evitare cherry picking aggressivo;
- mantenere coerenza con policy e fiducia.

Se arrivano recensioni senza testo, è accettabile non mostrarle nel carosello testuale, ma il rating medio e il conteggio totale devono restare quelli restituiti dall’API.

---

## Forma della risposta pubblica della Edge Function

La funzione `/google-reviews` deve restituire JSON normalizzato:

```json
{
  "source": "google_business_profile",
  "attribution": "Google Maps",
  "businessProfileUrl": "https://www.google.com/...",
  "averageRating": 4.9,
  "totalReviewCount": 120,
  "cachedAt": "2026-06-22T10:00:00.000Z",
  "isStale": false,
  "reviews": [
    {
      "id": "review-id",
      "authorName": "Nome Cognome",
      "profilePhotoUrl": "https://...",
      "rating": 5,
      "comment": "Testo recensione...",
      "createTime": "2026-05-10T09:00:00.000Z",
      "updateTime": "2026-05-10T09:00:00.000Z"
    }
  ]
}
```

Non restituire al frontend token, refresh token, client secret o dati non necessari.

---

## Mapping rating Google

La Review API può restituire `starRating` come enum.

Implementare mapping:

```ts
const ratingMap: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5
};
```

Se il campo è assente o non riconosciuto, non mostrare la recensione.

---

## Database cache Supabase

Creare tabella cache.

Esempio SQL:

```sql
create table if not exists public.google_reviews_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.google_reviews_cache enable row level security;
```

Poiché la tabella viene letta/scritta solo dalla Edge Function con service role, non creare policy pubbliche.

### Regole cache

- Fresh cache: massimo 24 ore.
- Hard expiry: massimo 30 giorni.
- Se cache < 24 ore: restituire cache.
- Se cache > 24 ore: tentare refresh.
- Se refresh fallisce ma cache < 30 giorni: restituire cache con `isStale: true`.
- Se refresh fallisce e cache > 30 giorni: non restituire contenuto cache, mostrare fallback frontend.
- Eliminare o sovrascrivere contenuti cache prima dei 30 giorni.

---

## Edge Function — comportamento richiesto

La funzione deve:

1. Gestire CORS solo per domini autorizzati.
2. Rispondere a `OPTIONS`.
3. Leggere cache da Supabase.
4. Se cache fresh, restituirla.
5. Se cache stale, ottenere un nuovo access token con refresh token.
6. Chiamare Google Business Profile Reviews API.
7. Normalizzare la risposta.
8. Salvare temporaneamente in cache con `expires_at`.
9. Restituire JSON al frontend.
10. In caso di errore Google, usare cache temporanea se valida.
11. In caso di totale assenza dati, restituire errore gestibile.

---

## Pseudocodice Edge Function

```ts
serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return json({ error: "Origin not allowed" }, 403);
  }

  const cached = await getCache("studio-yogis-google-reviews");

  if (cached && isFresh(cached.fetched_at, 24)) {
    return json(cached.payload);
  }

  try {
    const accessToken = await refreshGoogleAccessToken();

    const googleResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${GBP_ACCOUNT_ID}/locations/${GBP_LOCATION_ID}/reviews?pageSize=10&orderBy=updateTime%20desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!googleResponse.ok) {
      throw new Error(`Google API error: ${googleResponse.status}`);
    }

    const raw = await googleResponse.json();
    const normalized = normalizeGoogleReviews(raw);

    await saveCache("studio-yogis-google-reviews", normalized, 24);

    return json(normalized);
  } catch (error) {
    if (cached && isYoungerThan(cached.fetched_at, 30)) {
      return json({ ...cached.payload, isStale: true });
    }

    return json(
      {
        error: "reviews_unavailable",
        message: "Google reviews temporarily unavailable"
      },
      503
    );
  }
});
```

---

## Funzione refresh access token

Endpoint OAuth:

```http
POST https://oauth2.googleapis.com/token
```

Body:

```text
client_id={GOOGLE_CLIENT_ID}
client_secret={GOOGLE_CLIENT_SECRET}
refresh_token={GOOGLE_REFRESH_TOKEN}
grant_type=refresh_token
```

Restituisce `access_token` temporaneo da usare nella chiamata Reviews API.

---

## UI frontend

### HTML da inserire nella index

```html
<section class="yogis-google-reviews" id="recensioni-google" aria-labelledby="google-reviews-title">
  <div class="reviews-shell">
    <div class="reviews-header">
      <p class="section-kicker">Recensioni dello studio Yogis</p>
      <h2 id="google-reviews-title">La cura di Yogis, raccontata da chi pratica con noi</h2>
      <p class="reviews-intro">
        Le recensioni dello studio raccontano l’attenzione, la presenza e il metodo
        che portiamo anche nella piattaforma online.
      </p>

      <div class="reviews-summary" data-google-reviews-summary hidden>
        <span class="reviews-stars" aria-hidden="true">★★★★★</span>
        <span data-google-average-rating></span>
        <span data-google-total-reviews></span>
      </div>
    </div>

    <div class="reviews-carousel" data-google-reviews-carousel hidden>
      <button class="reviews-nav reviews-nav-prev" type="button" aria-label="Recensione precedente">
        ‹
      </button>

      <div class="reviews-track" data-google-reviews-track tabindex="0" aria-label="Carosello recensioni Google">
        <!-- cards generate via JS -->
      </div>

      <button class="reviews-nav reviews-nav-next" type="button" aria-label="Recensione successiva">
        ›
      </button>
    </div>

    <div class="reviews-fallback" data-google-reviews-fallback hidden>
      <p>
        Le recensioni Google non sono momentaneamente disponibili.
        Puoi leggerle direttamente sulla scheda dello studio.
      </p>
    </div>

    <div class="reviews-footer">
      <span class="google-attribution" translate="no">Google Maps</span>
      <a href="#" data-google-business-profile-link target="_blank" rel="noopener noreferrer">
        Leggi tutte le recensioni su Google
      </a>
    </div>
  </div>
</section>
```

---

## CSS richiesto

Creare `/assets/css/google-reviews.css`.

Linee guida:

- coerente con Yogis;
- sfondo caldo chiaro o bianco;
- card morbide;
- niente stile widget esterno;
- stelle discrete;
- carosello mobile-first;
- scroll-snap;
- accessibile;
- supporto `prefers-reduced-motion`.

Esempio base:

```css
.yogis-google-reviews {
  padding: clamp(4rem, 8vw, 7rem) 1.25rem;
  background: #fffaf6;
}

.reviews-shell {
  max-width: 1120px;
  margin: 0 auto;
}

.reviews-header {
  max-width: 760px;
  margin-bottom: 2rem;
}

.section-kicker {
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: .78rem;
  margin-bottom: .75rem;
}

.reviews-header h2 {
  font-size: clamp(2rem, 5vw, 3.6rem);
  line-height: 1.05;
  margin: 0 0 1rem;
}

.reviews-intro {
  font-size: 1.05rem;
  line-height: 1.7;
  max-width: 640px;
}

.reviews-summary {
  display: flex;
  gap: .65rem;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 1.25rem;
}

.reviews-stars {
  letter-spacing: .04em;
}

.reviews-carousel {
  position: relative;
}

.reviews-track {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: .25rem 0 1rem;
}

.review-card {
  flex: 0 0 min(86vw, 360px);
  scroll-snap-align: start;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 24px;
  padding: 1.35rem;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.review-card-stars {
  margin-bottom: 1rem;
}

.review-card-text {
  line-height: 1.65;
  margin: 0 0 1.25rem;
}

.review-author {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-top: auto;
}

.review-author img {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  object-fit: cover;
}

.review-author-name {
  font-weight: 600;
}

.review-source {
  display: block;
  font-size: .82rem;
  opacity: .72;
}

.reviews-nav {
  display: none;
}

.reviews-footer {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.google-attribution {
  font-family: Roboto, Arial, sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #5E5E5E;
}

@media (min-width: 900px) {
  .review-card {
    flex-basis: calc((100% - 2rem) / 3);
  }

  .reviews-nav {
    display: inline-flex;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,.08);
    background: #fff;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .reviews-nav-prev {
    left: -1.2rem;
  }

  .reviews-nav-next {
    right: -1.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reviews-track {
    scroll-behavior: auto;
  }
}
```

Adattare colori, font e spacing al CSS reale del sito.

---

## JS frontend

Creare `/assets/js/google-reviews-carousel.js`.

Requisiti:

- fetch da endpoint backend;
- rendering sicuro con `textContent`;
- niente `innerHTML` per testo recensioni/autori;
- gestione loading/fallback;
- pulsanti prev/next;
- scroll orizzontale su mobile;
- link a scheda Google;
- rendering massimo 10 card.

Esempio:

```js
const REVIEWS_ENDPOINT = "https://YOUR_SUPABASE_PROJECT.functions.supabase.co/google-reviews";

document.addEventListener("DOMContentLoaded", initGoogleReviews);

async function initGoogleReviews() {
  const summary = document.querySelector("[data-google-reviews-summary]");
  const carousel = document.querySelector("[data-google-reviews-carousel]");
  const track = document.querySelector("[data-google-reviews-track]");
  const fallback = document.querySelector("[data-google-reviews-fallback]");
  const ratingEl = document.querySelector("[data-google-average-rating]");
  const totalEl = document.querySelector("[data-google-total-reviews]");
  const linkEl = document.querySelector("[data-google-business-profile-link]");

  if (!track) return;

  try {
    const response = await fetch(REVIEWS_ENDPOINT, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) throw new Error("Reviews unavailable");

    const data = await response.json();

    if (!Array.isArray(data.reviews) || data.reviews.length === 0) {
      throw new Error("No reviews returned");
    }

    ratingEl.textContent = `${formatItalianRating(data.averageRating)} su Google Maps`;
    totalEl.textContent = `Basato su ${data.totalReviewCount} recensioni`;

    if (data.businessProfileUrl) {
      linkEl.href = data.businessProfileUrl;
    }

    track.textContent = "";

    data.reviews.slice(0, 10).forEach((review) => {
      track.appendChild(createReviewCard(review));
    });

    summary.hidden = false;
    carousel.hidden = false;

    setupCarouselControls(track);
  } catch (error) {
    console.error("[Google Reviews]", error);
    fallback.hidden = false;
  }
}

function createReviewCard(review) {
  const article = document.createElement("article");
  article.className = "review-card";

  const stars = document.createElement("div");
  stars.className = "review-card-stars";
  stars.setAttribute("aria-label", `${review.rating} stelle su 5`);
  stars.textContent = "★".repeat(review.rating);

  const text = document.createElement("p");
  text.className = "review-card-text";
  text.textContent = review.comment || "";

  const author = document.createElement("div");
  author.className = "review-author";

  if (review.profilePhotoUrl) {
    const img = document.createElement("img");
    img.src = review.profilePhotoUrl;
    img.alt = "";
    img.loading = "lazy";
    author.appendChild(img);
  }

  const authorMeta = document.createElement("div");

  const name = document.createElement("span");
  name.className = "review-author-name";
  name.textContent = review.authorName || "Cliente Yogis";

  const source = document.createElement("span");
  source.className = "review-source";
  source.textContent = "Recensione da Google Maps";

  authorMeta.appendChild(name);
  authorMeta.appendChild(source);
  author.appendChild(authorMeta);

  article.appendChild(stars);
  article.appendChild(text);
  article.appendChild(author);

  return article;
}

function setupCarouselControls(track) {
  const prev = document.querySelector(".reviews-nav-prev");
  const next = document.querySelector(".reviews-nav-next");

  if (!prev || !next) return;

  const scrollAmount = () => {
    const card = track.querySelector(".review-card");
    return card ? card.getBoundingClientRect().width + 16 : 360;
  };

  prev.addEventListener("click", () => {
    track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });

  next.addEventListener("click", () => {
    track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });
}

function formatItalianRating(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "";
  return number.toFixed(1).replace(".", ",");
}
```

Sostituire `REVIEWS_ENDPOINT` con URL reale della Edge Function.

---

## Fallback statico

Se API non disponibile, mostrare blocco minimale:

```text
Le recensioni Google non sono momentaneamente disponibili.
Puoi leggerle direttamente sulla scheda dello studio.
```

CTA:

```text
Leggi tutte le recensioni su Google
```

Non mostrare recensioni inventate.

---

## Rimozione Elfsight

Rimuovere dal sito:

- script Elfsight;
- contenitore widget Elfsight;
- eventuali CSS residui;
- eventuale lazy loader del widget.

Cercare nel progetto stringhe:

```text
elfsight
Elfsight
elfsight-app
static.elfsight.com
```

---

## UX e posizionamento

La sezione deve essere inserita nella index dopo la spiegazione del metodo Yogis e prima della sezione prezzo/CTA.

Motivo:

- prima si spiega cosa rende Yogis diverso;
- poi si mostra la fiducia costruita dallo studio fisico;
- poi si invita all’accesso o all’abbonamento.

Non usare titoli come:

```text
Recensioni della piattaforma Yogis Online
```

Usare invece:

```text
Recensioni dello studio Yogis
```

oppure:

```text
La cura di Yogis, raccontata da chi pratica con noi
```

---

## Sicurezza

1. Nessun secret nel frontend.
2. Nessuna API key Google nel frontend.
3. CORS ristretto ai domini Yogis.
4. Edge Function pubblica solo se necessario, ma con output limitato.
5. Rate limit consigliato, se disponibile nell’infrastruttura.
6. Logging senza token.
7. Non loggare refresh token, access token o risposta completa Google con dati sensibili.
8. Validare e normalizzare tutte le risposte Google.
9. Usare `textContent` nel frontend.
10. Non usare `innerHTML` per commenti o nomi autore.

---

## Accessibilità

La sezione deve rispettare:

- titolo `h2`;
- carosello navigabile da tastiera;
- bottoni con `aria-label`;
- stelle con testo accessibile;
- immagini autore con `alt=""`, perché decorative;
- contrasto sufficiente;
- nessun autoplay obbligatorio;
- `prefers-reduced-motion`.

---

## Performance

1. Non chiamare Google direttamente dal browser.
2. Usare cache temporanea lato backend.
3. Caricare JS con `defer`.
4. Lazy loading immagini autore.
5. Non bloccare rendering della pagina se recensioni non disponibili.
6. Il fallback deve apparire senza rompere layout.
7. Evitare librerie pesanti per il carosello: implementarlo con CSS scroll-snap + JS leggero.

---

## Test richiesti

### Test backend

- cache assente → chiama Google → salva cache → restituisce JSON;
- cache fresh → non chiama Google;
- cache stale → prova refresh;
- Google down + cache valida → restituisce cache con `isStale: true`;
- Google down + cache scaduta → restituisce 503 gestito;
- CORS da dominio non autorizzato → 403;
- rating enum non valido → recensione esclusa;
- recensione senza commento → esclusa dal carosello ma non altera rating medio.

### Test frontend

- renderizza 10 card se presenti;
- renderizza meno di 10 card se Google ne restituisce meno;
- prev/next funzionano;
- scroll mobile funziona;
- fallback funziona;
- link Google apre nuova scheda;
- niente errori JS se endpoint non risponde;
- nessun contenuto inserito con `innerHTML`.

### Test compliance visiva

- compare “Google Maps” come attribuzione;
- le recensioni sono chiaramente distinguibili come contenuto proveniente da Google;
- non sembra un widget Elfsight;
- non presenta le recensioni come recensioni della piattaforma online.

---

## Acceptance criteria finale

La task è completata quando:

1. Elfsight è stato rimosso completamente.
2. La index mostra una sezione recensioni custom Yogis.
3. Il carosello mostra fino a 10 recensioni Google.
4. Il rating medio e il numero totale recensioni sono mostrati.
5. Il link “Leggi tutte le recensioni su Google” è presente.
6. Le recensioni sono ottenute via backend, non dal frontend.
7. I secret non sono esposti.
8. La cache è temporanea e non supera 30 giorni.
9. È presente attribuzione Google Maps.
10. Il layout è responsive.
11. Il fallback funziona.
12. La sezione è coerente con il tono: caldo, curato, non aggressivo, non e-commerce.

---

## Nota alternativa se Google Business Profile API non viene approvata o è troppo lenta da configurare

Implementare una versione temporanea manuale:

- creare file `/assets/data/testimonials.json`;
- inserire testimonianze autorizzate direttamente dalle clienti oppure recensioni riportate fedelmente e attribuite correttamente;
- mostrare comunque rating Google e CTA alla scheda;
- non dichiarare aggiornamento automatico;
- programmare successiva integrazione API.

Questa alternativa è accettabile solo come fallback temporaneo.
