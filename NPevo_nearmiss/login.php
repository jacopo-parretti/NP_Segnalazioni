<?php

declare(strict_types=1);

require __DIR__ . '/lib/auth.php';

if (utente_collegato()) {
    header('Location: interno/index.php');
    exit;
}
intestazioni_protette();
?>
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/css/stile.css') ?>">
  <title>Gestione segnalazioni</title>
</head>
<body class="login">
  <div id="loader">
    <div class="spinner"></div>
  </div>
  <div class="hero">
    <div class="image">
      <img src="Images/logo-bianco.png" alt="North Plastik">
    </div>
    <div class="card">
      <h1>Gestione segnalazioni</h1>
      <p class="sotto">Kaizen, Near Miss e Segnalazioni</p>
      <form id="accesso" autocomplete="off">
        <p id="errore" class="errore" hidden>Nome utente o password errati.</p>
        <label for="usr">Nome utente</label>
        <input type="text" id="usr" required>
        <label for="pw">Password</label>
        <input type="password" id="pw" required>
        <input type="submit" id="accedi" value="Accedi" disabled>
      </form>
    </div>
  </div>
  <script src="js/vendor/nacl-fast.js?v=<?= (int) @filemtime(__DIR__ . '/js/vendor/nacl-fast.js') ?>"></script>
  <script src="js/vendor/scrypt.js?v=<?= (int) @filemtime(__DIR__ . '/js/vendor/scrypt.js') ?>"></script>
  <script src="js/vendor/md5.js?v=<?= (int) @filemtime(__DIR__ . '/js/vendor/md5.js') ?>"></script>
  <script src="js/cifra.js?v=<?= (int) @filemtime(__DIR__ . '/js/cifra.js') ?>"></script>
  <script src="js/login.js?v=<?= (int) @filemtime(__DIR__ . '/js/login.js') ?>"></script>
</body>
</html>
