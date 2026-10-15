<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/segnalazione.php';
require __DIR__ . '/../../../lib/storico.php';

richiedi_accesso_api();
richiedi_csrf_api();

$elenco = json_decode(is_string($_POST['righe'] ?? null) ? $_POST['righe'] : '', true);
if (!is_array($elenco) || count($elenco) === 0) {
    rispondi_json(['errore' => 'Dati non validi.'], 400);
}
foreach ($elenco as $e) {
    if (!is_array($e) || !is_int($e['id'] ?? null) || $e['id'] <= 0 || !is_string($e['impronta'] ?? null) || preg_match('/^[0-9A-F]{64}$/', $e['impronta']) !== 1) {
        rispondi_json(['errore' => 'Dati non validi.'], 400);
    }
}

$conn = db();
if ($conn === false || !sqlsrv_begin_transaction($conn)) {
    rispondi_json(['errore' => 'Database non disponibile.'], 500);
}

$prima = segnalazioni_conta();
$svuotate = 0;
$sql = 'UPDATE ' . tabella('SEGNALAZIONI') . '
        SET TIPOLOGIA = NULL, LUOGO = NULL, DATA_EVENTO = NULL, ORA_EVENTO = NULL, DESCRIZIONE = NULL,
            COINVOLGIMENTO = NULL, PROVE = NULL, SEGNALATO = NULL, MATRICOLA = NULL
        WHERE ID = ? AND VERSIONE_CIFRATURA = 1 AND LEFT(CONVERT(varchar(128), HASHBYTES(\'SHA2_512\', CIFRATO), 2), 64) = ?';
foreach ($elenco as $e) {
    if (db_esegui($sql, [$e['id'], ascii($e['impronta'])]) !== 1) {
        sqlsrv_rollback($conn);
        rispondi_json(['errore' => 'La riga S' . $e['id'] . ' non coincide con il cifrato verificato: nulla è stato svuotato.'], 409);
    }
    $svuotate++;
}
$dopo = segnalazioni_conta();

if ($prima === null || $dopo !== $prima || !sqlsrv_commit($conn)) {
    sqlsrv_rollback($conn);
    rispondi_json(['errore' => 'Conteggio delle righe non coerente: nulla è stato svuotato.'], 409);
}

rispondi_json(['prima' => $prima, 'dopo' => $dopo, 'svuotate' => $svuotate]);
