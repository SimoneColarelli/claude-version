# Setup recensioni Google per Studio Yogis

Questa integrazione usa un progetto Supabase separato da Yogis Online. La home mantiene la sezione recensioni nascosta finche' la Edge Function non e' stata configurata e verificata con dati reali.

Progetto creato:

- nome: `studio-yogis-web`;
- project ref: `chheawiryvwcrtmggmiw`;
- endpoint: `https://chheawiryvwcrtmggmiw.functions.supabase.co/google-reviews`.

## 1. Creare il progetto Supabase

Nel proprio account Supabase creare un nuovo progetto:

- nome consigliato: `studio-yogis-web`;
- organizzazione: la stessa gia' usata per Yogis Online;
- regione: una regione UE vicina all'Italia;
- database: nuovo e indipendente dal progetto Yogis Online.

Annotare il `project ref` mostrato nel dashboard. Non copiare password o chiavi nel repository.

La CLI puo' essere eseguita senza installazione globale:

```powershell
npx supabase login
npx supabase link --project-ref chheawiryvwcrtmggmiw
npx supabase db push
```

`db push` crea la tabella privata `google_reviews_cache` nel nuovo progetto e pianifica con `pg_cron` la cancellazione giornaliera di ogni contenuto piu' vecchio di 30 giorni.

## 2. Richiedere accesso alle Business Profile API

Seguire i [prerequisiti ufficiali Google](https://developers.google.com/my-business/content/prereqs):

1. usare un profilo Google Business verificato e attivo da almeno 60 giorni;
2. creare o selezionare un progetto Google Cloud dedicato;
3. inviare la richiesta di accesso alle Business Profile API con l'account proprietario o gestore della scheda;
4. attendere l'approvazione prima di proseguire.

Nel pannello quote, `0 QPM` indica che il progetto non e' ancora approvato; la quota standard visibile dopo l'approvazione e' `300 QPM`.

Dopo l'approvazione, abilitare almeno:

- Google My Business API;
- My Business Account Management API;
- My Business Business Information API.

Riferimenti:

- [Basic setup](https://developers.google.com/my-business/content/basic-setup)
- [Reviews list](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list)
- [Policy di conservazione](https://developers.google.com/my-business/content/policies)

## 3. Configurare OAuth offline

Nel progetto Google Cloud:

1. configurare la OAuth consent screen con nome `Studio Yogis Reviews`, dominio `studioyogis.it`, email di supporto e URL della privacy policy;
2. creare un OAuth Client ID di tipo Web;
3. aggiungere temporaneamente `https://developers.google.com/oauthplayground` agli URI di reindirizzamento autorizzati;
4. aprire [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/), attivare `Use your own OAuth credentials` e inserire client ID e client secret;
5. autorizzare lo scope `https://www.googleapis.com/auth/business.manage` con l'account che gestisce Studio Yogis;
6. scambiare il codice ottenendo un refresh token offline.

Il refresh token, il client secret e gli access token non devono essere copiati in file versionati, messaggi di log o codice frontend.

## 4. Individuare account e location

Con un access token temporaneo eseguire:

```http
GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
Authorization: Bearer ACCESS_TOKEN
```

Usare il nome account restituito per elencare le sedi:

```http
GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/ACCOUNT_ID/locations?readMask=name,title,storeCode
Authorization: Bearer ACCESS_TOKEN
```

Conservare solo gli identificatori, senza i prefissi `accounts/` e `locations/`, nei secrets `GBP_ACCOUNT_ID` e `GBP_LOCATION_ID`.

Recuperare inoltre dalla scheda Google Maps il link pubblico diretto dello studio da usare come `GOOGLE_BUSINESS_PROFILE_URL`.

## 5. Impostare i secrets Supabase

Copiare localmente `supabase/.env.example` in `supabase/.env.google-reviews`. Il file risultante e' escluso da Git.

Compilare:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GBP_ACCOUNT_ID=...
GBP_LOCATION_ID=...
GOOGLE_BUSINESS_PROFILE_URL=https://www.google.com/...
ALLOWED_ORIGINS=https://studioyogis.it,https://www.studioyogis.it,http://localhost:8000,http://127.0.0.1:8000
```

Caricare i secrets e distribuire la funzione:

```powershell
npx supabase secrets set --env-file supabase/.env.google-reviews
npx supabase functions deploy google-reviews --no-verify-jwt
```

La funzione usa automaticamente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` forniti dal runtime Supabase.

## 6. Testare prima di attivare la home

Eseguire i test locali:

```powershell
deno test --allow-env supabase/functions/google-reviews/index_test.ts
node --check assets/js/google-reviews-carousel.js
node scripts/validate-content.js
```

Eseguire lo smoke test remoto:

```powershell
$headers = @{ Origin = 'https://www.studioyogis.it'; Accept = 'application/json' }
Invoke-RestMethod -Uri 'https://chheawiryvwcrtmggmiw.functions.supabase.co/google-reviews' -Headers $headers
```

La risposta deve avere stato `200` e contenere:

- `source: google_business_profile`;
- `attribution: Google Maps`;
- rating medio e conteggio totale reali;
- da una a dieci recensioni testuali;
- `businessProfileUrl` corretto;
- nessun token o secret.

Controllare i log della funzione senza aggiungere log dei payload Google o delle credenziali.

## 7. Attivare e pubblicare il frontend

Solo dopo lo smoke test riuscito, modificare nella home:

```html
data-reviews-endpoint="https://chheawiryvwcrtmggmiw.functions.supabase.co/google-reviews"
```

Caricare via FTP:

- `index.html`;
- `assets/css/google-reviews.css`;
- `assets/js/google-reviews-carousel.js`.

Verificare la home a 375, 768 e 1440 pixel, navigazione da tastiera, swipe, pulsanti, link Google e fallback con endpoint temporaneamente irraggiungibile.

Per disattivare immediatamente la sezione e mantenere il resto della home invariato, svuotare nuovamente `data-reviews-endpoint`.
