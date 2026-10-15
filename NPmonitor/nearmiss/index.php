<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/personale.php';

$persone = personale_in_forza();
$reparti = db_righe('SELECT REPARTO_ID, REPARTO FROM dbo.NEARMISS_REPARTI ORDER BY REPARTO');
$pronto = $persone !== null && $reparti !== null;
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="../Images/favicon.png" type="image/png">
<link rel="stylesheet" href="../css/stile.css">
<title>Near Miss - Modulo invio</title>
</head>
<body class="modulo nearmiss">
<div class="wrapper">
    <div class="logo-container">
        <img src="Risorse/Images/logo.png" alt="Logo Aziendale">
        <br><br>
        <img src="Risorse/Images/nearmiss.png" alt="Logo Near Miss" id="logo">
    </div>
    <div class="form-container">
        <h2>MODULO</h2>
        <h2>MANCATO INCIDENTE - MANCATO INFORTUNIO</h2>
        <h3>(Near Miss)</h3>
<?php if ($pronto): ?>
        <form name="insertnearmiss" action="insert_nearmiss.php" method="post" autocomplete="off">
            <div class="container">
                <div class="left-col">
                    <div class="form-group">
                        <label for="matricola">Nome e Cognome</label>
                        <select id="matricola" name="matricola" required>
                            <option value="" disabled selected></option>
                            <?= opzioni_personale($persone) ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reparto">Reparto</label>
                        <select id="reparto" name="reparto" required>
                            <option value="" disabled selected></option>
<?php foreach ($reparti as $r): ?>
                            <option value="<?= h((int) $r['REPARTO_ID']) ?>"><?= h($r['REPARTO']) ?></option>
<?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="data">Data evento</label>
                        <input type="date" id="data" name="data" required>
                    </div>
                </div>
                <div class="right-col">
                    <div class="form-group">
                        <label for="event-description">Descrizione Evento (max 1000 caratteri)</label>
                        <textarea id="event-description" name="descrizione" maxlength="1000" required></textarea>
                    </div>
                </div>
            </div>
            <div id="submit-container">
                <button type="submit">INVIA ✔</button>
            </div>
        </form>
<?php else: ?>
        <p class="errore">Errore di connessione al database.</p>
<?php endif; ?>
    </div>
</div>
<div class="back-button-container">
    <a href="../index.php"><button type="button">◄ INDIETRO</button></a>
</div>
</body>
</html>
