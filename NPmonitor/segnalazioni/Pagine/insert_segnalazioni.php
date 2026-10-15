<?php

declare(strict_types=1);

require __DIR__ . '/../../lib/db.php';
require __DIR__ . '/../../lib/segnalazione.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: ../index.php');
    exit;
}

$cifrato = segnalazione_da_post($_POST);
if ($cifrato === null) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Richiesta non valida: sono accettate solo segnalazioni cifrate.';
    exit;
}

$scritte = db_esegui(
    'INSERT INTO ' . tabella('SEGNALAZIONI') . ' (DATA_INSERIMENTO, CIFRATO, VERSIONE_CIFRATURA)
     VALUES (CAST(CAST(GETDATE() AS date) AS datetime), ?, 1)',
    [ascii($cifrato)]
);

if ($scritte !== 1) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Invio non riuscito. Riprova più tardi.';
    exit;
}

header('Location: grazie.php', true, 303);
exit;
