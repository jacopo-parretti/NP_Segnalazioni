<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';
require __DIR__ . '/../../../lib/segnalazione.php';
require __DIR__ . '/../../../lib/storico.php';

richiedi_accesso_api();
richiedi_csrf_api();

$id = id_da($_POST);
$cifrato = $_POST['cifrato'] ?? null;
$precedente = $_POST['precedente'] ?? '';
if ($id === null || !cifrato_valido($cifrato) || ($precedente !== '' && !cifrato_valido($precedente))) {
    rispondi_json(['errore' => 'Dati non validi.'], 400);
}

if ($precedente === '') {
    $n = db_esegui(
        'UPDATE ' . tabella('SEGNALAZIONI') . ' SET CIFRATO = ?, VERSIONE_CIFRATURA = 1 WHERE ID = ? AND CIFRATO IS NULL',
        [ascii($cifrato), $id]
    );
} else {
    $n = db_esegui(
        'UPDATE ' . tabella('SEGNALAZIONI') . ' SET CIFRATO = ?, VERSIONE_CIFRATURA = 1 WHERE ID = ? AND CIFRATO = ? AND ' . condizione_in_chiaro(),
        [ascii($cifrato), $id, ascii($precedente)]
    );
}
if ($n === null) {
    rispondi_json(['errore' => 'Salvataggio non riuscito.'], 500);
}

rispondi_json(['aggiornate' => $n]);
