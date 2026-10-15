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
  <link rel="stylesheet" href="../css/stile.css">
  <title>Segnalazione Anonima</title>
</head>
<body class="segnalazione">
  <div class="wrapper">
    <div class="logo-container">
      <img src="Risorse/Images/logo.png" alt="Logo Aziendale">
      <img src="Risorse/Images/segnalazioni.png" alt="Segnalazioni" id="logo">
    </div>
    <div class="form-container">
      <h2>SEGNALAZIONE ANONIMA</h2>
      <p class="helper">Questo modulo consente di inviare, anche in forma anonima, una segnalazione su temi etici, sicurezza, diritti, ambiente e altro.</p>
<?php if (!$attivo): ?>
      <p class="avviso">Il canale delle segnalazioni non è ancora attivo. Nessun dato è stato inviato.</p>
      <div class="actions">
        <a href="../index.php"><button class="back-btn" type="button">◄ INDIETRO</button></a>
      </div>
<?php else: ?>
      <div id="segnalazioneForm" data-chiave="<?= h($pubblica) ?>">
        <div class="form-group">
          <label for="tipologia">Tipologia di segnalazione</label>
          <select id="tipologia" required>
            <option value="" disabled selected>Seleziona...</option>
            <option>Parità di genere, Violenza verbale o abusi</option>
            <option>Diritti dei lavoratori, Sicurezza in ambiente di lavoro</option>
            <option>Tutela dell’ambiente</option>
          </select>
        </div>
        <div class="form-group">
          <label for="descrizione">Descrivi la tua segnalazione (max 1000 caratteri)</label>
          <textarea id="descrizione" maxlength="1000" required></textarea>
        </div>
        <div class="grid">
          <div class="form-group">
            <label for="luogo">Dove sono avvenuti i fatti</label>
            <textarea id="luogo" maxlength="300" placeholder="Es. reparto, sede, area, contesto" required></textarea>
          </div>
          <div>
            <div class="form-group">
              <label for="data">Quando sono avvenuti i fatti</label>
              <div class="grid stretto">
                <input type="date" id="data" required>
                <input type="time" id="ora">
              </div>
              <span class="inline-help">Se l'ora non è nota puoi lasciarla vuota.</span>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>Come sei coinvolto</label>
          <ul class="checklist">
            <li><input type="radio" id="coinv1" name="coinvolgimento" value="Una voce sentita in giro" required><label for="coinv1">Una voce sentita in giro</label></li>
            <li><input type="radio" id="coinv2" name="coinvolgimento" value="Diretto coinvolto"><label for="coinv2">Diretto coinvolto</label></li>
            <li><input type="radio" id="coinv3" name="coinvolgimento" value="Indiretto coinvolto"><label for="coinv3">Indiretto coinvolto</label></li>
            <li><input type="radio" id="coinv4" name="coinvolgimento" value="Sono la vittima"><label for="coinv4">Sono la vittima</label></li>
            <li><input type="radio" id="coinv5" name="coinvolgimento" value="Sono testimone"><label for="coinv5">Sono testimone</label></li>
            <li><input type="radio" id="coinv6" name="coinvolgimento" value="Mi è stato detto da un diretto testimone"><label for="coinv6">Mi è stato detto da un diretto testimone</label></li>
          </ul>
        </div>
        <div class="divider"></div>
        <div class="grid">
          <div class="form-group">
            <label for="prove">Hai delle prove?</label>
            <select id="prove" required>
              <option value="" disabled selected>Seleziona...</option>
              <option value="SI">SI</option>
              <option value="NO">NO</option>
            </select>
          </div>
          <div class="form-group">
            <label for="giaSegnalato">Hai già segnalato i fatti a qualcuno?</label>
            <select id="giaSegnalato" required>
              <option value="" disabled selected>Seleziona...</option>
              <option value="SI">SI</option>
              <option value="NO">NO</option>
            </select>
          </div>
        </div>
        <div class="divider"></div>
        <div class="grid">
          <div class="form-group">
            <label for="fornireDati">Vuoi fornire dati identificativi?</label>
            <select id="fornireDati" required>
              <option value="" disabled selected>Seleziona...</option>
              <option value="NO">NO</option>
              <option value="SI">SI</option>
            </select>
            <span class="inline-help">Se scegli NO la segnalazione resterà anonima.</span>
          </div>
        </div>
        <div id="datiPersonali" class="hidden">
          <div class="form-group">
            <label for="matricolaSelect">Seleziona il tuo nome</label>
            <select id="matricolaSelect">
              <option value="" disabled selected>Seleziona...</option>
              <?= opzioni_personale($persone) ?>
            </select>
          </div>
        </div>
        <p id="errore" class="avviso hidden"></p>
        <div class="actions">
          <a href="../index.php"><button class="back-btn" type="button">◄ INDIETRO</button></a>
          <button type="button" id="invia" disabled>INVIA ✔</button>
        </div>
      </div>
<?php endif; ?>
    </div>
  </div>
<?php if ($attivo): ?>
  <script src="../js/vendor/nacl-fast.js"></script>
  <script src="../js/vendor/scrypt.js"></script>
  <script src="../js/cifra.js"></script>
  <script src="../js/segnalazione.js"></script>
<?php endif; ?>
</body>
</html>
