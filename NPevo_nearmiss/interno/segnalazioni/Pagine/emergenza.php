<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';

richiedi_accesso('../../../login.php');
intestazioni_protette();
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../../css/stile.css">
<title>Chiave di emergenza</title>
</head>
<body class="segnalazioni" data-csrf="<?= h(token_csrf()) ?>">
<a href="segnalazionilist.php" class="btn">◄ INDIETRO</a>
<div class="header"><h1>CHIAVE DI EMERGENZA</h1></div>
<div id="stato" class="stato hidden"></div>
<div class="pannello">
    <p>Per legare di nuovo le segnalazioni alla password con cui sei entrato adesso, scrivi la chiave di emergenza stampata oppure la vecchia password. Nessuna delle due viene inviata al server.</p>
    <p><label for="chiave"><strong>Chiave di emergenza</strong></label></p>
    <p><textarea id="chiave" rows="3" autocomplete="off" spellcheck="false"></textarea></p>
    <p><label for="vecchia"><strong>oppure vecchia password</strong></label></p>
    <p><input type="password" id="vecchia" autocomplete="off"></p>
    <p><button type="button" id="apri" class="btn">Apri e collega alla password attuale</button></p>
</div>
<script src="../../../js/vendor/nacl-fast.js"></script>
<script src="../../../js/vendor/scrypt.js"></script>
<script src="../../../js/cifra.js"></script>
<script src="../../../js/emergenza.js"></script>
</body>
</html>
