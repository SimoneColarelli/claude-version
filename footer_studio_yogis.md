# Footer — studioyogis.it

Documento operativo per implementare il footer del sito vetrina dello studio fisico **Yogis Studio**.

> Dominio: `studioyogis.it`  
> Scopo del footer: rassicurare, far contattare facilmente lo studio, collegare l'area clienti online, rendere sempre accessibili le informazioni legali e privacy.

---

## 1. Obiettivo UX del footer

Il footer del sito vetrina deve chiudere ogni pagina con tre messaggi chiari:

1. **Yogis è uno studio fisico reale**, con indirizzo, contatti e presenza locale.
2. **La pratica è accessibile e progressiva**, coerente con il posizionamento del brand.
3. **La piattaforma online esiste, ma come area clienti complementare**, non come servizio generalista aperto a chiunque.

Il footer deve quindi essere più caldo e orientato alla conversione rispetto al footer della piattaforma online.

---

## 2. Struttura consigliata

### Desktop

Usare una struttura a 4 colonne:

1. Brand + micro-copy + link socials
2. Navigazione studio
3. Contatti e sede
4. Area clienti Yogis Online

Sotto le 4 colonne inserire una fascia legale unica a larghezza piena.

### Mobile

Impilare le sezioni verticalmente.

Ordine consigliato su mobile:

1. Brand + link socials
2. Contatti
3. Studio
4. Area clienti
5. Fascia legale

Le colonne possono diventare blocchi semplici. Evitare accordion se il footer non diventa troppo lungo.

---

## 3. Copy definitivo del footer

### Colonna 1 — Brand

Mantieni già esistente

---

### Colonna 2 — Studio

Mantieni già esistente

---

### Colonna 3 — Contatti

Titolo:

```text
Vieni a trovarci
```

Copy:

```text
Yogis Studio
[INDIRIZZO_COMPLETO]
[CAP] [CITTÀ] ([PROVINCIA])
```

Contatti:

```text
WhatsApp: [NUMERO_TELEFONO]
Email: [EMAIL_CONTATTO]
```

Link:

```text
Apri su Google Maps
```

Indicazioni:
- Il numero WhatsApp deve essere cliccabile.
- L'email deve usare `mailto:`.
- Il link Google Maps deve aprirsi in una nuova scheda.
- Aggiungere `rel="noopener noreferrer"` ai link esterni con `target="_blank"`.

Esempio messaggio per Maps:

```text
Apri lo studio su Google Maps
```

---

### Colonna 4 — Area clienti

Titolo:

```text
Area clienti
```

Copy:

```text
Yogis Online è la piattaforma riservata alle clienti dello studio per continuare la pratica anche da casa.
```

Link consigliati:

```text
Accedi a Yogis Online
Cos'è Yogis Online
Assistenza accesso
```

Indicazioni:
- `Accedi a Yogis Online` deve puntare a `https://online.studioyogis.it` oppure alla pagina di login.
- `Cos'è Yogis Online` può puntare a una sezione del sito vetrina che spiega la piattaforma complementare.
- `Assistenza accesso` può puntare a WhatsApp, email o pagina FAQ.

---

## 4. Fascia legale finale

La fascia legale deve stare sotto le colonne, con testo piccolo ma leggibile.

### Copy con placeholder

```text
[DENOMINAZIONE_LEGALE] – P.IVA [PARTITA_IVA] – CF [CODICE_FISCALE] – Sede legale: [SEDE_LEGALE] – PEC: [PEC] – REA: [REA_SE_PRESENTE]
```

Seconda riga:

```text
Privacy Policy · Cookie Policy · Preferenze cookie · Termini e condizioni · Regolamento studio · Note legali
```

Terza riga:

```text
© 2026 Yogis Studio. Tutti i diritti riservati.
```

Indicazioni:
- Se REA non è presente, omettere la voce invece di mostrare un placeholder.
- Se la PEC non deve essere esposta nel footer, verificare con consulente legale/commercialista. In generale è consigliabile mostrarla tra i dati societari o nelle note legali.
- La P.IVA deve essere presente in modo visibile sul sito.
- Il link `Preferenze cookie` deve riaprire il pannello di gestione consenso cookie, non puntare solo alla Cookie Policy.

---

## 5. Placeholder da sostituire

Codex deve cercare questi placeholder e sostituirli con valori reali:

```text
[Studio Yogis]
[PARTITA_IVA]
[TTRMHL96M60A345B]
[L'Aquila]
[via Monte Matese]
[67100]
[L'Aquila]
[AQ]
[3452233737]
[info@studioyogis.it]
[google.com/maps?cid=355538108428236225&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=it&gl=IT&source=embed]
[https://wa.me/393452233737]
[online.studioyogis.it]
```

Se alcuni dati non sono disponibili:
- lasciare un `TODO` nel codice;
- non mostrare il placeholder in produzione;
- non inventare dati.

---

## 6. Requisiti tecnici per Codex

### Componente

Creare o aggiornare un componente footer riutilizzabile.

Nome consigliato:

```text
site-footer
```

Classi consigliate:

```text
.footer
.footer__inner
.footer__brand
.footer__columns
.footer__column
.footer__title
.footer__text
.footer__links
.footer__link
.footer__cta-row
.footer__cta
.footer__legal
.footer__legal-links
.footer__copyright
```

---

## 7. Esempio HTML semantico

Adattare i percorsi reali del progetto.

```html
<footer class="footer" aria-labelledby="footer-title">
  <div class="footer__inner">

    <section class="footer__brand">
      <h2 id="footer-title" class="footer__title">Yogis Studio</h2>
      <p class="footer__text">
        Yoga accessibile, progressivo e guidato con cura, per accompagnarti dal tuo punto di partenza verso una pratica più consapevole.
      </p>

      <div class="footer__cta-row">
        <a class="footer__cta footer__cta--primary" href="[URL_PRENOTAZIONE]">
          Prenota una lezione di prova
        </a>
        <a class="footer__cta footer__cta--secondary" href="[URL_WHATSAPP]">
          Scrivici su WhatsApp
        </a>
      </div>
    </section>

    <nav class="footer__column" aria-label="Navigazione studio">
      <h3 class="footer__title">Studio</h3>
      <ul class="footer__links">
        <li><a class="footer__link" href="/studio.html">Lo studio</a></li>
        <li><a class="footer__link" href="/corsi.html">Corsi in presenza</a></li>
        <li><a class="footer__link" href="/yoga-posturale.html">Yoga posturale</a></li>
        <li><a class="footer__link" href="/yoga-gravidanza.html">Yoga in gravidanza</a></li>
        <li><a class="footer__link" href="/vinyasa-yoga.html">Vinyasa yoga</a></li>
        <li><a class="footer__link" href="/fit-yoga.html">Fit yoga</a></li>
        <li><a class="footer__link" href="/prezzi.html">Prezzi e abbonamenti</a></li>
        <li><a class="footer__link" href="/faq.html">FAQ</a></li>
      </ul>
    </nav>

    <section class="footer__column" aria-labelledby="footer-contatti-title">
      <h3 id="footer-contatti-title" class="footer__title">Vieni a trovarci</h3>
      <address class="footer__address">
        <strong>Yogis Studio</strong><br>
        [INDIRIZZO_COMPLETO]<br>
        [CAP] [CITTÀ] ([PROVINCIA])<br>
        <a class="footer__link" href="tel:[NUMERO_TELEFONO_FORMAT_TEL]">WhatsApp: [NUMERO_TELEFONO]</a><br>
        <a class="footer__link" href="mailto:[EMAIL_CONTATTO]">[EMAIL_CONTATTO]</a>
      </address>
      <a class="footer__link" href="[URL_GOOGLE_MAPS]" target="_blank" rel="noopener noreferrer">
        Apri su Google Maps
      </a>
    </section>

    <section class="footer__column" aria-labelledby="footer-online-title">
      <h3 id="footer-online-title" class="footer__title">Area clienti</h3>
      <p class="footer__text">
        Yogis Online è la piattaforma riservata alle clienti dello studio per continuare la pratica anche da casa.
      </p>
      <ul class="footer__links">
        <li><a class="footer__link" href="[URL_YOGIS_ONLINE]">Accedi a Yogis Online</a></li>
        <li><a class="footer__link" href="/yogis-online.html">Cos'è Yogis Online</a></li>
        <li><a class="footer__link" href="[URL_ASSISTENZA_ACCESSO]">Assistenza accesso</a></li>
      </ul>
    </section>

    <div class="footer__legal">
      <p>
        [DENOMINAZIONE_LEGALE] – P.IVA [PARTITA_IVA] – CF [CODICE_FISCALE] – Sede legale: [SEDE_LEGALE] – PEC: [PEC] – REA: [REA_SE_PRESENTE]
      </p>

      <nav aria-label="Link legali">
        <ul class="footer__legal-links">
          <li><a href="/privacy-policy.html">Privacy Policy</a></li>
          <li><a href="/cookie-policy.html">Cookie Policy</a></li>
          <li><button type="button" class="footer__link-button" data-cookie-preferences>Preferenze cookie</button></li>
          <li><a href="/termini-condizioni.html">Termini e condizioni</a></li>
          <li><a href="/regolamento-studio.html">Regolamento studio</a></li>
          <li><a href="/note-legali.html">Note legali</a></li>
        </ul>
      </nav>

      <p class="footer__copyright">
        © 2026 Yogis Studio. Tutti i diritti riservati.
      </p>
    </div>

  </div>
</footer>
```

---

## 8. CSS e comportamento responsive

Indicazioni CSS:

- Desktop: griglia 4 colonne.
- Tablet: 2 colonne.
- Mobile: 1 colonna.
- Padding generoso, ma non eccessivo.
- Testo legale leggibile: non sotto 12px.
- Link con stato hover/focus visibile.
- Focus outline sempre presente per accessibilità.
- CTA primaria più evidente; CTA secondaria più discreta.
- Non usare colori troppo freddi: mantenere coerenza con il visual Yogis.
- Verificare contrasto testo/sfondo.

Esempio struttura CSS:

```css
.footer {
  padding: 4rem 1.5rem 2rem;
}

.footer__inner {
  max-width: 1200px;
  margin: 0 auto;
}

.footer__columns,
.footer__inner {
  display: grid;
  gap: 2rem;
}

@media (min-width: 900px) {
  .footer__inner {
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
  }

  .footer__legal {
    grid-column: 1 / -1;
  }
}
```

Adattare colori, font e spaziature al sistema grafico già presente nel progetto.

---

## 9. Accessibilità

Requisiti:

- Il footer deve usare il tag semantico `<footer>`.
- Le liste di link devono usare `<nav>` con `aria-label`.
- L'indirizzo deve usare `<address>`.
- I link telefonici devono usare `tel:`.
- I link email devono usare `mailto:`.
- I bottoni che aprono modali o pannelli, come `Preferenze cookie`, devono essere `<button>`, non `<a href="#">`.
- Ogni stato focus deve essere visibile da tastiera.
- Il testo non deve diventare troppo piccolo su mobile.

---

## 10. Note legali da verificare prima della pubblicazione

Questa sezione non sostituisce un controllo di commercialista/legale, ma serve a Codex e al team come checklist.

Fonti normative/istituzionali utili:
- D.Lgs. 70/2003, art. 7: informazioni generali da rendere facilmente accessibili in modo diretto e permanente.
  - https://www.parlamento.it/parlam/leggi/deleghe/03070dl.htm
- DPR 633/1972, art. 35: indicazione della Partita IVA nei siti relativi all'attività.
  - https://www.normattiva.it/
- Linee guida cookie e altri strumenti di tracciamento del Garante Privacy.
  - https://www.garanteprivacy.it/

Controlli:
- Verificare che P.IVA, denominazione, sede legale ed email siano corretti.
- Verificare se mostrare anche REA, capitale sociale, forma giuridica, PEC o altri dati in base alla forma dell'attività.
- Verificare che Privacy Policy e Cookie Policy siano aggiornate.
- Verificare che il link `Preferenze cookie` riapra davvero il pannello consensi.
- Verificare che non ci siano link morti.
- Verificare che il sito online e il sito vetrina abbiano documenti coerenti ma non confusi.

---

## 11. Checklist finale per Codex

Prima di considerare completata l'implementazione:

- [ ] Footer presente su tutte le pagine pubbliche di `studioyogis.it`.
- [ ] Layout desktop a 4 colonne.
- [ ] Layout mobile a colonna singola.
- [ ] CTA prenotazione funzionante.
- [ ] CTA WhatsApp funzionante.
- [ ] Link Google Maps funzionante.
- [ ] Link a Yogis Online funzionante.
- [ ] Dati legali inseriti e non lasciati come placeholder.
- [ ] Privacy Policy collegata.
- [ ] Cookie Policy collegata.
- [ ] Pulsante Preferenze cookie funzionante.
- [ ] Termini e condizioni collegati.
- [ ] Regolamento studio collegato.
- [ ] Nessun `href="#"` in produzione.
- [ ] Focus visibile da tastiera.
- [ ] Contrasto sufficiente.
- [ ] Footer coerente con il visual brand Yogis.
