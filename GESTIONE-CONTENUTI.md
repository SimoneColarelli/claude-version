# Gestione dei contenuti Yogis

Il sito legge i contenuti pubblici da tre file JSON nella cartella `public/content`, pubblicata online come `/content`:

- `corsi.json`: corsi mostrati nella homepage e nella pagina Corsi;
- `orari.json`: insegnanti, giorni e lezioni della pagina Orari;
- `abbonamenti.json`: card dei piani e dei prezzi.

Non servono database, pannelli di amministrazione o compilazioni. I file devono restare in formato UTF-8 e non possono contenere commenti, virgole dopo l'ultimo elemento o HTML.

## Prima di caricare i file

Aprire PowerShell nella cartella del sito ed eseguire:

```powershell
node scripts/validate-content.js
```

Il comando controlla sintassi, campi obbligatori, ID duplicati, riferimenti tra orari e corsi e presenza dei file multimediali. Caricare i file solo quando termina con `Tutti i contenuti sono validi`.

Per vedere il sito in locale, non aprire direttamente gli HTML con un doppio clic: `fetch` richiede un server HTTP. Avviare invece:

```powershell
python -m http.server 8000 --directory public
```

Poi visitare `http://localhost:8000/` e interrompere il server con `Ctrl+C`.

## Corsi

Ogni elemento di `public/content/corsi.json` usa questi campi:

- `id`: identificatore permanente in minuscolo, ad esempio `vinyasa-flow`; non cambiarlo dopo aver condiviso il relativo link;
- `status`: usare `active` per mostrare il corso sul sito oppure `inactive` per conservarlo nel file senza renderizzarlo nella homepage, nella pagina Corsi e nell'orario;
- `nome` e `destinatari`: titolo e pubblico/livello mostrato sulla card;
- `descrizioneBreve`: testo della card;
- `descrizioneLunga`: uno o più paragrafi, ciascuno come voce dell'array;
- `tags`: etichette della sezione di dettaglio;
- `immagine.src`: percorso relativo al file; `immagine.alt`: descrizione accessibile. L'immagine viene usata nella sezione di dettaglio del corso. È facoltativa se esiste `videoAnteprima`: si può omettere il blocco, usare `null` oppure lasciare `src` vuoto;
- `videoAnteprima`: viene sempre usato come anteprima nelle card di homepage e pagina Corsi. Se manca l'immagine, il suo primo fotogramma viene usato anche nella sezione di dettaglio.

L'ordine dei corsi nel file è lo stesso usato nel sito. Per aggiungerne uno, copiare un oggetto completo, assegnare un nuovo `id` e modificare tutti i campi. Salvare immagini e video rispettivamente in `public/assets/images/` e `public/assets/videos/`, usando nomi semplici come `yoga-pregnancy.jpg`.

Per togliere temporaneamente un corso dal sito, non eliminare il relativo oggetto: impostare `"status": "inactive"`. Per pubblicarlo di nuovo, riportare il valore a `"active"`. Se un corso inattivo è ancora referenziato in `orari.json`, quello slot viene mostrato come privo di lezioni.

I link ai singoli corsi presenti nei footer di tutte le pagine vengono generati dallo stesso file: nome, destinazione e visibilità non vanno duplicati negli HTML.

## Orario

Gli insegnanti sono definiti una volta in `insegnanti`:

```json
{ "id": "maria", "nome": "Maria Rossi", "sigla": "MR" }
```

Le lezioni referenziano gli ID del corso e dell'insegnante:

```json
{
  "ora": "18:00",
  "corsoId": "vinyasa",
  "insegnanteId": "maria"
}
```

I giorni ammessi sono `lunedi`, `martedi`, `mercoledi`, `giovedi`, `venerdi`, `sabato` e `domenica`. Il sito ordina automaticamente giorni e lezioni; un giorno senza lezioni va rimosso dal file.

## Abbonamenti

Ogni abbonamento contiene `id`, `tipo`, `nome`, `status` e un array non vuoto `pacchetti`. Anche ogni pacchetto ha il proprio `status`:

```json
{
  "status": "active",
  "nome": "1 lezione/settimana",
  "prezzo": "40€",
  "prezzoSpeciale": "35€"
}
```

Per `status` sono ammessi solo `active` e `inactive`. Gli abbonamenti e i pacchetti inattivi restano visibili nel listino e mostrano accanto al nome il tag `Temporaneamente non attivo`.

`prezzo` e `prezzoSpeciale` sono testi liberi. Usare `—` quando il prezzo speciale per Yogis in gravidanza e Yogis Mum & Baby non è previsto o non è ancora disponibile.

## Pubblicazione via FTP

1. Eseguire la validazione locale.
2. Caricare tutto il contenuto della cartella `public/` nella root pubblica del dominio, ad esempio `public_html`.
3. Verificare che venga caricato anche il file nascosto `public/.htaccess`: gestisce la home e i redirect 301 dai vecchi URL `.html`.
4. Per aggiornamenti parziali, mantenere sempre gli stessi percorsi presenti dentro `public/`, ad esempio `public/assets/images/`, `public/assets/videos/` e `public/content/`.
5. Caricare per ultimi i file JSON modificati nella cartella `content` del sito online.
6. Ricaricare la pagina: il browser richiede sempre una copia aggiornata dei JSON.

Gli URL pubblici del sito sono `/`, `/studio/`, `/corsi/`, `/online/` e `/orari/`. Non caricare nuovamente i vecchi file `studio.html`, `corsi.html`, `online.html` e `orari.html` nella root.

Se un JSON è irraggiungibile o non valido, il sito non mostra dati potenzialmente obsoleti per quella sezione e registra il motivo nella console del browser. Gli altri archivi validi continuano a funzionare in modo indipendente.
