<?php

declare(strict_types=1);

require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/chiavi.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: login.php');
    exit;
}

$utente = $_POST['usr'] ?? null;
$accesso = $_POST['accesso'] ?? null;
if (!is_string($utente) || $utente === '' || strlen($utente) > 100 || !is_string($accesso) || preg_match('/^[0-9a-f]{32}$/', $accesso) !== 1) {
    rispondi_json(['ok' => false], 400);
}

$righe = db_righe(
    'SELECT ID, UTENTE, ACCESSO FROM dbo.USERS WHERE UTENTE = ? AND RUOLO = \'MC\' AND ATTIVO = 1',
    [testo($utente)]
);
if ($righe === null) {
    rispondi_json(['ok' => false, 'errore' => 'Servizio non disponibile.'], 503);
}

$trovato = null;
if (count($righe) === 1 && hash_equals(strtolower(trim((string) $righe[0]['ACCESSO'])), $accesso)) {
    $trovato = $righe[0];
}
if ($trovato === null) {
    rispondi_json(['ok' => false], 401);
}

accedi((string) $trovato['UTENTE'], (int) $trovato['ID']);

$chiave = chiave_gestore();
rispondi_json([
    'ok' => true,
    'sale' => $chiave !== null && sale_valido($chiave['SALE_PASSWORD']) ? $chiave['SALE_PASSWORD'] : null,
    'parametri' => $chiave !== null && parametri_validi($chiave['PARAMETRI_KDF']) ? $chiave['PARAMETRI_KDF'] : null,
]);
