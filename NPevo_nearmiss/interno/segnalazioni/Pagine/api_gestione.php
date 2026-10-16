<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';
require __DIR__ . '/../../../lib/schema.php';
require __DIR__ . '/../../../lib/segnalazione.php';

richiedi_accesso_api();
richiedi_csrf_api();

$colonna = ['contromisure' => 'CONTROMISURE_CIFRATO', 'costi' => 'COSTI_CIFRATO'][is_string($_POST['campo'] ?? null) ? $_POST['campo'] : ''] ?? null;
$id = id_da($_POST);
$cifrato = $_POST['cifrato'] ?? null;
if ($colonna === null || $id === null || !is_string($cifrato) || ($cifrato !== '' && !cifrato_valido($cifrato))) {
    rispondi_json(['errore' => 'Dati non validi.'], 400);
}

schema_errore_api(schema_assicura());

$n = db_esegui(
    'UPDATE ' . tabella('SEGNALAZIONI') . ' SET ' . $colonna . ' = ? WHERE ID = ?',
    [$cifrato === '' ? null : ascii($cifrato), $id]
);
if ($n === null) {
    rispondi_json(['errore' => 'Salvataggio non riuscito.'], 500);
}
if ($n !== 1) {
    rispondi_json(['errore' => 'Segnalazione non trovata.'], 404);
}

rispondi_json(['salvato' => true]);
