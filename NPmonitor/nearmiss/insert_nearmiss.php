<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/validazione.php';
require __DIR__ . '/../lib/nearmiss.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: index.php');
    exit;
}

$id = null;
$messaggio = null;

$matricola = intero_positivo($_POST['matricola'] ?? null);
$reparto = intero_positivo($_POST['reparto'] ?? null);
$descrizione = testo_valido($_POST['descrizione'] ?? null, 1000);
$dataTesto = is_string($_POST['data'] ?? null) ? $_POST['data'] : '';
$dataEvento = DateTimeImmutable::createFromFormat('!Y-m-d', $dataTesto);
if ($dataEvento === false || $dataEvento->format('Y-m-d') !== $dataTesto) {
    $dataEvento = null;
}

if ($matricola === null || $reparto === null || $descrizione === null || $dataEvento === null) {
    http_response_code(400);
    $messaggio = 'Dati mancanti o non validi.';
} else {
    $riga = db_riga(
        'INSERT INTO ' . tabella('NEARMISS') . ' ([MATRICOLA], [DATA], [REPARTO], [DESC_EV], [DATA_AVVENIMENTO], [STATO])
         OUTPUT INSERTED.ID_NM
         VALUES (?, GETDATE(), ?, ?, DATEFROMPARTS(?, ?, ?), 1)',
        [
            $matricola,
            $reparto,
            testo($descrizione),
            (int) $dataEvento->format('Y'),
            (int) $dataEvento->format('m'),
            (int) $dataEvento->format('d'),
        ]
    );
    if ($riga === null) {
        http_response_code(500);
        $messaggio = 'Errore durante l\'inserimento.';
    } else {
        $id = (int) $riga['ID_NM'];
        $persona = db_riga(
            'SELECT LTRIM(RTRIM(CONCAT(NOME, \' \', COGNOME))) AS Nominativo FROM dbo.PERSONALENP WHERE MATRICOLA = ?',
            [$matricola]
        );
        $nomeReparto = db_riga('SELECT REPARTO AS Reparto FROM dbo.NEARMISS_REPARTI WHERE REPARTO_ID = ?', [$reparto]);
        $nominativo = (string) ($persona['Nominativo'] ?? '');
        $repartoTesto = (string) ($nomeReparto['Reparto'] ?? '');
        nearmiss_notifica(
            configurazione()['power_automate'] ?? [],
            nearmiss_payload(
                $id,
                $nominativo !== '' ? $nominativo : (string) $matricola,
                $dataEvento,
                $repartoTesto !== '' ? $repartoTesto : (string) $reparto,
                $descrizione
            )
        );
    }
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="../Images/favicon.png" type="image/png">
<link rel="stylesheet" href="../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../css/stile.css') ?>">
<title>Near Miss - Inserimento</title>
</head>
<body class="np esito">
    <header class="barra">
        <div class="barra-modulo">
            <img class="icona" src="Risorse/Images/nearmiss.png" alt="Near Miss">
            <h1 class="barra-titolo">Mancato incidente / infortunio</h1>
        </div>
        <img class="marchio" src="../Images/logo-bianco.png" alt="North Plastik">
    </header>
    <main class="esito-corpo">
<?php if ($id !== null): ?>
        <p class="esito-titolo">Segnalazione inviata correttamente</p>
        <p class="esito-etichetta">Identificativo</p>
        <p class="esito-codice">NM<?= h($id) ?></p>
<?php else: ?>
        <p class="avviso"><?= h($messaggio) ?></p>
<?php endif; ?>
        <a class="pulsante principale" href="../index.php">Torna alla pagina iniziale</a>
    </main>
</body>
</html>
