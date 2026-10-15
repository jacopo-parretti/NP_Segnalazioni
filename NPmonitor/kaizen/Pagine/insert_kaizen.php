<?php

declare(strict_types=1);

require __DIR__ . '/../../lib/db.php';
require __DIR__ . '/../../lib/validazione.php';

$id = null;
$messaggio = null;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: ../index.php');
    exit;
}

$matricola = intero_positivo($_POST['matricola'] ?? null);
$titolo = testo_valido($_POST['titolo'] ?? null, 100);
$descrizione = testo_valido($_POST['descrizione'] ?? null, 1000);
$categoria = intero_positivo($_POST['categoria'] ?? null);
$benefici = intero_positivo($_POST['benefici'] ?? null);

if ($matricola === null || $titolo === null || $descrizione === null || $categoria === null || $benefici === null) {
    http_response_code(400);
    $messaggio = 'Dati mancanti o non validi.';
} else {
    $postazione = substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 15);
    $riga = db_riga(
        'INSERT INTO ' . tabella('KAIZEN') . ' (MATRICOLA, TITOLO, DATA, DESCRIZIONE, CATEGORIA_ID, BENEFICI_ID, RISPARMIO, POSTAZIONE, STATO)
         OUTPUT INSERTED.ID
         VALUES (?, ?, GETDATE(), ?, ?, ?, 0, ?, 1)',
        [$matricola, testo($titolo), testo($descrizione), $categoria, $benefici, testo($postazione)]
    );
    if ($riga === null) {
        http_response_code(500);
        $messaggio = 'Inserimento non riuscito. Riprova più tardi.';
    } else {
        $id = (int) $riga['ID'];
    }
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="../../Images/favicon.png" type="image/png">
<link rel="stylesheet" href="../../css/stile.css">
<title>UPLOAD KAIZEN</title>
</head>
<body class="esito">
<div class="wrapper">
    <div class="logo-container">
        <img src="../Risorse/Images/logo.png" alt="Logo Aziendale">
    </div>
    <div class="form-container">
<?php if ($id !== null): ?>
        <h2>INSERIMENTO EFFETTUATO CORRETTAMENTE <br> </h2>
        <h1>IDENTIFICATIVO <br> K<?= h($id) ?></h1>
        <h2>Si prega gentilmente di appuntare il numero identificativo, successivamente verrà reso disponibile lo stato della richiesta sulle bacheche utilizzando il numero assegnato</h2>
<?php else: ?>
        <h2 class="errore"><?= h($messaggio) ?></h2>
<?php endif; ?>
        <form action="../../index.php" name="indietro" method="get">
            <div id="submit-container">
                <button type="submit">TORNA INDIETRO</button>
            </div>
        </form>
    </div>
</div>
</body>
</html>
