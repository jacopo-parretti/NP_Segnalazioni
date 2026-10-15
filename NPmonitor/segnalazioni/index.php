<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/personale.php';
require __DIR__ . '/../lib/segnalazione.php';

header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'");
header('Referrer-Policy: no-referrer');

$pubblica = chiave_pubblica_gestore();
$persone = $pubblica !== null ? personale_in_forza() : null;
$attivo = $pubblica !== null && $persone !== null;
?>
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="../Images/favicon.png" type="image/png">
  <link rel="stylesheet" href="../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../css/stile.css') ?>">
  <title>Segnalazione Anonima</title>
</head>
<body class="np modulo segnalazione">
  <header class="barra">
    <a class="pulsante barra-indietro" href="../index.php">Indietro</a>
    <div class="barra-modulo">
      <img class="icona" src="Risorse/Images/segnalazioni.png" alt="">
      <h1 class="barra-titolo">Segnalazione <span class="barra-sigla">anche anonima</span></h1>
    </div>
    <img class="marchio" src="../Images/logo-bianco.png" alt="North Plastik">
  </header>
<?php if (!$attivo): ?>
  <main class="foglio">
    <p class="avviso">Il canale delle segnalazioni non è ancora attivo. Nessun dato è stato inviato.</p>
  </main>
<?php else: ?>
  <div id="segnalazioneForm" class="foglio" data-chiave="<?= h($pubblica) ?>">
    <div class="passi">
      <section class="passo">
        <h2 class="passo-titolo"><span class="passo-numero">1</span>Di cosa si tratta</h2>
        <div class="campo">
          <label for="tipologia">Tipologia</label>
          <select id="tipologia" required data-scelte="larghe">
            <option value="" disabled selected>Seleziona...</option>
            <option>Parità di genere, Violenza verbale o abusi</option>
            <option>Diritti dei lavoratori, Sicurezza in ambiente di lavoro</option>
            <option>Tutela dell’ambiente</option>
          </select>
        </div>
        <div class="campo cresce">
          <label for="descrizione">Descrivi i fatti</label>
          <textarea id="descrizione" maxlength="1000" rows="6" required data-contatore placeholder="Cosa è successo e chi è coinvolto"></textarea>
        </div>
      </section>
      <section class="passo">
        <h2 class="passo-titolo"><span class="passo-numero">2</span>Dove e quando</h2>
        <div class="campo">
          <label for="luogo">Dove sono avvenuti i fatti</label>
          <textarea id="luogo" maxlength="300" rows="2" placeholder="Reparto, sede, area, contesto" required data-contatore></textarea>
        </div>
        <div class="coppia">
          <div class="campo">
            <label for="data">Data</label>
            <input type="date" id="data" required data-calendario>
          </div>
          <div class="campo">
            <label for="ora">Ora, se la sai</label>
            <input type="time" id="ora" data-orario data-passo="5">
          </div>
        </div>
        <div class="campo">
          <p class="etichetta" id="coinvolgimento-etichetta">Come sei coinvolto</p>
          <div class="scelte larghe" role="radiogroup" aria-labelledby="coinvolgimento-etichetta">
            <label class="scelta" for="coinv1"><input type="radio" id="coinv1" name="coinvolgimento" value="Una voce sentita in giro" required><span>Una voce sentita in giro</span></label>
            <label class="scelta" for="coinv2"><input type="radio" id="coinv2" name="coinvolgimento" value="Diretto coinvolto"><span>Diretto coinvolto</span></label>
            <label class="scelta" for="coinv3"><input type="radio" id="coinv3" name="coinvolgimento" value="Indiretto coinvolto"><span>Indiretto coinvolto</span></label>
            <label class="scelta" for="coinv4"><input type="radio" id="coinv4" name="coinvolgimento" value="Sono la vittima"><span>Sono la vittima</span></label>
            <label class="scelta" for="coinv5"><input type="radio" id="coinv5" name="coinvolgimento" value="Sono testimone"><span>Sono testimone</span></label>
            <label class="scelta" for="coinv6"><input type="radio" id="coinv6" name="coinvolgimento" value="Mi è stato detto da un diretto testimone"><span>Mi è stato detto da un diretto testimone</span></label>
          </div>
        </div>
      </section>
      <section class="passo">
        <h2 class="passo-titolo"><span class="passo-numero">3</span>Altre informazioni</h2>
        <div class="campo in-linea">
          <label for="prove">Hai delle prove?</label>
          <select id="prove" required data-scelte>
            <option value="" disabled selected>Seleziona...</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
        </div>
        <div class="campo in-linea">
          <label for="giaSegnalato">Hai già segnalato i fatti a qualcuno?</label>
          <select id="giaSegnalato" required data-scelte>
            <option value="" disabled selected>Seleziona...</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
        </div>
        <div class="campo in-linea">
          <label for="fornireDati">Vuoi dire chi sei?</label>
          <select id="fornireDati" required data-scelte>
            <option value="" disabled selected>Seleziona...</option>
            <option value="NO">NO</option>
            <option value="SI">SI</option>
          </select>
        </div>
        <div id="datiPersonali" class="campo cresce hidden">
          <label for="matricolaSelect">Il tuo nome</label>
          <select id="matricolaSelect" data-persona>
            <option value="" disabled selected>Seleziona...</option>
            <?= opzioni_personale($persone) ?>
          </select>
        </div>
        <p class="riservatezza">Con NO la segnalazione resta anonima. Il contenuto viene cifrato su questo computer prima dell'invio e lo legge solo il gestore.</p>
      </section>
    </div>
    <footer class="azioni">
      <p id="errore" class="avviso hidden"></p>
      <p class="azioni-nota">Tutti i campi sono obbligatori, tranne l'ora.</p>
      <button type="button" class="pulsante secondario tastiera-pulsante" data-tastiera-pulsante hidden>Tastiera</button>
      <button type="button" id="invia" class="pulsante invio" data-tastiera-invio disabled>Invia segnalazione</button>
    </footer>
  </div>
<?php endif; ?>
<?php if ($attivo): ?>
  <script src="../js/vendor/nacl-fast.js?v=<?= (int) @filemtime(__DIR__ . '/../js/vendor/nacl-fast.js') ?>"></script>
  <script src="../js/vendor/scrypt.js?v=<?= (int) @filemtime(__DIR__ . '/../js/vendor/scrypt.js') ?>"></script>
  <script src="../js/cifra.js?v=<?= (int) @filemtime(__DIR__ . '/../js/cifra.js') ?>"></script>
  <script src="../js/moduli.js?v=<?= (int) @filemtime(__DIR__ . '/../js/moduli.js') ?>"></script>
  <script src="../js/tastiera.js?v=<?= (int) @filemtime(__DIR__ . '/../js/tastiera.js') ?>"></script>
  <script src="../js/segnalazione.js?v=<?= (int) @filemtime(__DIR__ . '/../js/segnalazione.js') ?>"></script>
<?php endif; ?>
</body>
</html>
