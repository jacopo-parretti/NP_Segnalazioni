<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/schema.php';
require __DIR__ . '/../../../lib/storico.php';

richiedi_accesso_api();

schema_errore_api(schema_assicura());

$righe = segnalazioni_tutte();
if ($righe === null) {
    rispondi_json(['errore' => 'Lettura non riuscita.'], 500);
}

rispondi_json(['totale' => count($righe), 'righe' => $righe]);
