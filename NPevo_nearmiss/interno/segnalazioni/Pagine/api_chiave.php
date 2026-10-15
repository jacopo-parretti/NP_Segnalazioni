<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/schema.php';
require __DIR__ . '/../../../lib/chiavi.php';

richiedi_accesso_api();

schema_errore_api(schema_assicura());

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    $chiave = chiave_gestore();
    if ($chiave === null) {
        rispondi_json(['esiste' => false]);
    }
    $risposta = [
        'esiste' => true,
        'pubblica' => $chiave['CHIAVE_PUBBLICA'],
        'privata_password' => $chiave['PRIVATA_DA_PASSWORD'],
        'sale' => $chiave['SALE_PASSWORD'],
        'parametri' => $chiave['PARAMETRI_KDF'],
    ];
    if (($_GET['emergenza'] ?? '') === '1') {
        $risposta['privata_emergenza'] = $chiave['PRIVATA_DA_EMERGENZA'];
    }
    rispondi_json($risposta);
}

richiedi_csrf_api();
$azione = $_POST['azione'] ?? '';

if ($azione === 'crea') {
    $pubblica = $_POST['pubblica'] ?? null;
    $privataPassword = $_POST['privata_password'] ?? null;
    $privataEmergenza = $_POST['privata_emergenza'] ?? null;
    $sale = $_POST['sale'] ?? null;
    $parametri = $_POST['parametri'] ?? null;
    if (!pubblica_valida($pubblica) || !privata_valida($privataPassword) || !privata_valida($privataEmergenza) || !sale_valido($sale) || !parametri_validi($parametri)) {
        rispondi_json(['errore' => 'Dati della chiave non validi.'], 400);
    }
    $t = tabella('SEGNALAZIONI_CHIAVI');
    $n = db_esegui(
        "INSERT INTO $t (ID_UTENTE, CHIAVE_PUBBLICA, PRIVATA_DA_PASSWORD, SALE_PASSWORD, PARAMETRI_KDF, PRIVATA_DA_EMERGENZA, CREATA)
         SELECT ?, ?, ?, ?, ?, ?, CAST(GETDATE() AS date)
         WHERE NOT EXISTS (SELECT 1 FROM $t WITH (UPDLOCK, HOLDLOCK))",
        [(int) $_SESSION['idMC'], ascii($pubblica), ascii($privataPassword), ascii($sale), ascii($parametri), ascii($privataEmergenza)]
    );
    if ($n !== 1) {
        rispondi_json(['errore' => 'La chiave del gestore esiste già o non è stato possibile salvarla.'], 409);
    }
    rispondi_json(['ok' => true]);
}

if ($azione === 'reincapsula') {
    $privataPassword = $_POST['privata_password'] ?? null;
    if (!privata_valida($privataPassword)) {
        rispondi_json(['errore' => 'Dati della chiave non validi.'], 400);
    }
    $chiave = chiave_gestore();
    if ($chiave === null) {
        rispondi_json(['errore' => 'Chiave del gestore assente.'], 404);
    }
    $n = db_esegui(
        'UPDATE ' . tabella('SEGNALAZIONI_CHIAVI') . ' SET PRIVATA_DA_PASSWORD = ? WHERE ID = ?',
        [ascii($privataPassword), (int) $chiave['ID']]
    );
    if ($n !== 1) {
        rispondi_json(['errore' => 'Salvataggio non riuscito.'], 500);
    }
    rispondi_json(['ok' => true]);
}

rispondi_json(['errore' => 'Azione sconosciuta.'], 400);
