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
  <link rel="stylesheet" href="css/stile.css">
  <title>Gestione Richieste</title>
</head>
<body class="login">
  <div id="loader">
    <div class="spinner"></div>
  </div>
  <div class="hero">
    <div class="image">
      <img src="Images/Logo bianco.png" alt="Logo">
    </div>
    <div class="card">
      <h1>Login Totem</h1>
      <form id="accesso" autocomplete="off">
        <p id="errore" class="errore" hidden>Identificazione non riuscita: nome utente o password errati</p>
        <input type="text" id="usr" placeholder="USERNAME" required>
        <input type="password" id="pw" placeholder="PASSWORD" required>
        <input type="submit" id="accedi" value="ACCEDI" disabled>
      </form>
    </div>
  </div>
  <script src="js/vendor/nacl-fast.js"></script>
  <script src="js/vendor/scrypt.js"></script>
  <script src="js/vendor/md5.js"></script>
  <script src="js/cifra.js"></script>
  <script src="js/login.js"></script>
</body>
</html>
