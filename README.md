# NP Segnalazioni

Rifacimento di `NPmonitor` (invio) e `NPevo_nearmiss` (gestione mcadmin). Stessi URL e stesse tabelle di CED_DB di prima; le cartelle nuove sostituiscono quelle vecchie su srv-web (vedi «Messa in opera»).

## Sicurezza

**Cosa è cifrato e dove.** Solo le Segnalazioni. Il browser di chi segnala mette tutti i campi (matricola compresa) in un JSON, lo riempie a multipli di 1 KB e lo cifra con `nacl.box` (X25519 + XSalsa20-Poly1305) verso la chiave pubblica del gestore. Al server arrivano solo `cifrato` e `versione`; in `dbo.SEGNALAZIONI` si salvano `CIFRATO` (base64), `VERSIONE_CIFRATURA = 1` e `DATA_INSERIMENTO` alla mezzanotte del giorno. Le altre colonne restano `NULL`; nessun IP né ora di ricezione. Kaizen e Near Miss restano nominativi e in chiaro come prima.

**Chiave pubblica fissata.** Il modulo Segnalazioni di NPmonitor si attiva solo se la chiave pubblica letta dal DB ha esattamente l'impronta scritta in `NPmonitor/config.php` (`impronta_chiave_gestore`: SHA-512 della chiave, primi 16 byte). Altrimenti dice «canale non attivo», non invia nulla e scrive l'errore nel log di PHP. Così chi ha `ced_db` non può sostituire la chiave con la sua.

**Chi può leggere.** Solo mcadmin, nel suo browser. Al login il browser manda al server `md5(password)`, confrontato con `dbo.USERS.ACCESSO` (tabella mai scritta). Dalla stessa password ricava con scrypt (N=2^17, r=8, p=1, sale proprio) la chiave che apre la chiave privata del gestore. Quella chiave resta in `sessionStorage` della scheda e si cancella all'uscita. Il server, il DB, i backup e chi conosce la password `ced_db` vedono solo testo cifrato. La chiave privata sta in `dbo.SEGNALAZIONI_CHIAVI`, cifrata due volte con `secretbox`: una con la chiave della password, una con la chiave di emergenza.

**Chiave di emergenza.** 32 byte casuali, mostrati una sola volta quando si imposta la chiave (16 gruppi da 4 caratteri), da stampare e chiudere a chiave. Apre la chiave privata anche senza password.

**Storico.** Alla prima apertura della lista, il browser di mcadmin cifra le segnalazioni già in chiaro, le rilegge dal DB, le decifra e le confronta campo per campo con l'originale. Solo se coincidono tutte, una transazione svuota i campi di contenuto e la matricola (`WHERE ID = ? AND CIFRATO = ?`); `DATA_INSERIMENTO` resta identica, giorno e ora. Nessuna riga viene cancellata e il conteggio prima e dopo viene mostrato. Se una riga non coincide non si svuota niente; il suo `CIFRATO` si può riscrivere solo finché i suoi campi in chiaro ci sono ancora. Il controllo si ripete a ogni apertura.

**Rischi accettati.**
1. Per ogni invio i log IIS registrano IP, ora e URL: incrociati con il DHCP possono dire chi ha inviato, non cosa.
2. Senza HTTPS, chi può modificare i file su srv-web o manomettere la rete può alterare le pagine. Modificando il modulo legge le segnalazioni future prima della cifratura; modificando `login.js` cattura la password di mcadmin e con essa apre tutte le segnalazioni, storico compreso.
3. Se si perdono sia la password di mcadmin sia la chiave di emergenza, le segnalazioni non sono più leggibili da nessuno.
4. Contengono lo storico in chiaro i backup di CED_DB fatti prima della migrazione e i backup del log delle transazioni che coprono la migrazione e i giorni prima.
5. L'md5 di mcadmin in `dbo.USERS` si attacca per forza bruta molto in fretta: chi ha `ced_db` e indovina la password apre anche le segnalazioni. La difesa è solo la lunghezza della password.
6. `ced_db` è db_owner e la sua password stava in chiaro nei file di prima: chi la conosce non legge le segnalazioni nuove, ma può cancellarle.
7. La chiave derivata dalla password sta in `sessionStorage`, legato all'origine `http://192.168.1.8`. Qualunque altra applicazione servita da srv-web sulla stessa origine, se ha una falla XSS, può leggerla mentre la scheda di mcadmin è aperta. Una sessione di mcadmin compromessa così potrebbe anche far salvare un cifrato inutilizzabile e poi svuotare il chiaro di quelle righe.

**Segreti.** Password del DB e URL di Power Automate stanno solo nei `config.php` (ignorati da git). Si generano dai file di prima con `node tools/genera-config.js` (legge `..\NPevo_nearmiss\confirm.php` e `..\NPmonitor\nearmiss\insert_nearmiss.php`; l'impronta già scritta resta). Nel repo c'è solo `config.example.php`.

**Librerie nel browser** (in `js/vendor/`, identiche nelle due cartelle, prese con `npm pack` e integrità npm verificata):

| File | Pacchetto | SHA-256 |
|---|---|---|
| `nacl-fast.js` | tweetnacl 1.0.3 (Unlicense) | `6bcd37a3b20dce913f82d4b23e4e2b661058b4b953df8a3f8c45d56ac4f72447` |
| `scrypt.js` | scrypt-js 3.0.1 (MIT) | `544292934136527d60acc9e337d8c7b953f412e81314aa551a12d4230afd449d` |
| `md5.js` | blueimp-md5 2.19.0 (MIT) | `5f14f0efb563db7b23efaf394339a78bced6fd5ba649f049961a65476d928af5` |

## Workflow

**Controlli.** `node --test tests/` e `node tools/controlli.js`. Il secondo verifica che non ci siano segreti, commenti, URL esterni o file del questionario; che non ci siano `DELETE`/`DROP`/`TRUNCATE` né scritture su `USERS`; che i file comuni siano identici nelle due cartelle e che passi `php -l`.

**Prova locale.** `prova\prova.cmd` scarica la prima volta PHP 8.2.7 e sqlsrv 5.12.0 in `%LOCALAPPDATA%\php82`, genera `prova\config.php` e apre `http://localhost:8090/NPmonitor/` e `/NPevo_nearmiss/login.php`. Lavora sulle copie `SEGNALAZIONI_PROVA`, `SEGNALAZIONI_CHIAVI_PROVA`, `KAIZEN_PROVA` e `NEARMISS_PROVA`, con Power Automate spento.
- Le segnalazioni del banco sono 8 righe finte (testi che iniziano con «PROVA -», matricole 999001/999002): nessuna segnalazione vera viene copiata. Kaizen e Near Miss sono copie delle tabelle vere.
- `prova\prova.cmd crea` crea le copie; `prova\prova.cmd azzera` le rifà da capo; `prova\prova.cmd controlla` le conta in sola lettura.
- Dopo aver impostato la chiave di prova: `prova\prova.cmd impronta XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`, con l'impronta mostrata dalla pagina di gestione.

**Messa in opera, in quest'ordine.** Su srv-web le cartelle vecchie si **rinominano** (per esempio `NPevo_nearmiss_old`) o si spostano fuori dal sito, e poi si copiano le nuove. Mai copiare sopra le vecchie: resterebbero vivi `esterno/`, `segnalazioni/test.php`, `insert_segnalazioni3.php`, `nearmiss/Pagine/insert_nearmiss.php` e gli altri file di prima, con le loro falle e con password e URL scritti dentro.
1. `node tools/genera-config.js`, poi mettere la nuova `NPevo_nearmiss` (con il suo `config.php`) al posto della vecchia.
2. mcadmin entra da `/NPevo_nearmiss/login.php` e apre Segnalazioni.
   - Le colonne e la tabella delle chiavi si creano da sole; se mancano i permessi, la pagina mostra lo SQL da lanciare.
   - Imposta la chiave, stampa la chiave di emergenza e conferma con l'ultimo gruppo. Lo storico si cifra e si svuota, con il conteggio delle righe a video.
   - La pagina mostra l'impronta: `node tools/genera-config.js --impronta <impronta>` la scrive in `NPmonitor/config.php`.
3. Mettere la nuova `NPmonitor` (con il suo `config.php`) al posto della vecchia. Senza impronta giusta il modulo Segnalazioni dice che il canale non è attivo e non invia nulla.

**Recupero.** Se la password di mcadmin cambia o si perde, mcadmin entra con la password attuale e apre Segnalazioni. La pagina dice che la password non apre la chiave e porta alla pagina di recupero. Lì si scrive la chiave di emergenza stampata oppure la vecchia password: la chiave privata viene ricifrata con la password attuale e le segnalazioni non vengono toccate.
