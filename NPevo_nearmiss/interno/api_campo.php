<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/auth.php';
require __DIR__ . '/../lib/stati.php';
require __DIR__ . '/../lib/schema.php';

richiedi_accesso_api();
richiedi_csrf_api();

const CAMPI_MODIFICABILI = [
    'kaizen' => ['tabella' => 'KAIZEN', 'chiave' => 'ID', 'campi' => ['avanzamento' => 'AVANZAMENTO', 'costi' => 'COSTI_IMPLEMENTAZIONE']],
    'nearmiss' => ['tabella' => 'NEARMISS', 'chiave' => 'ID_NM', 'campi' => ['contromisure' => 'CONTROMISURE_APPLICATE', 'costi' => 'COSTI_IMPLEMENTAZIONE']],
];

$testo_post = static fn (string $k): string => is_string($_POST[$k] ?? null) ? $_POST[$k] : '';
$tipo = CAMPI_MODIFICABILI[$testo_post('tipo')] ?? null;
$id = id_da($_POST);
$colonna = $tipo === null ? null : ($tipo['campi'][$testo_post('campo')] ?? null);
$valore = $_POST['valore'] ?? null;
if ($tipo === null || $id === null || $colonna === null || !is_string($valore) || preg_match('/^.{0,1000}$/su', $valore) !== 1) {
    rispondi_json(['errore' => 'Dati non validi.'], 400);
}

schema_errore_api(schema_assicura());

$testo = trim(str_replace("\r\n", "\n", $valore));
$n = db_esegui(
    'UPDATE ' . tabella($tipo['tabella']) . ' SET ' . $colonna . ' = ? WHERE ' . $tipo['chiave'] . ' = ?',
    [$testo === '' ? null : testo($testo), $id]
);
if ($n === null) {
    rispondi_json(['errore' => 'Salvataggio non riuscito.'], 500);
}
if ($n !== 1) {
    rispondi_json(['errore' => 'Riga non trovata.'], 404);
}

rispondi_json(['valore' => $testo]);
