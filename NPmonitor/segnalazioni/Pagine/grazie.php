<?php

header('Refresh: 3; url=../');
?>
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="../../Images/favicon.png" type="image/png">
  <link rel="stylesheet" href="../../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../../css/stile.css') ?>">
  <title>Segnalazione inviata</title>
</head>
<body class="np esito grazie">
  <header class="barra">
    <div class="barra-modulo">
      <img class="icona" src="../Risorse/Images/segnalazioni.png" alt="Segnalazioni">
      <h1 class="barra-titolo">Segnalazione anonima</h1>
    </div>
    <img class="marchio" src="../../Images/logo-bianco.png" alt="North Plastik">
  </header>
  <main class="esito-corpo">
    <p class="esito-codice">Grazie</p>
    <p class="esito-titolo">La tua segnalazione è stata inviata correttamente.</p>
    <p class="esito-testo">Tra pochi secondi si torna al modulo.</p>
  </main>
</body>
</html>
