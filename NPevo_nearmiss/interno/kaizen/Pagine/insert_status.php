<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';

richiedi_accesso('../../../login.php');
richiedi_csrf();

$id = id_da($_POST);
$stato = stato_da_post();
if ($id === null || $stato === null) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Dati non validi.';
    exit;
}

if (db_esegui('UPDATE ' . tabella('KAIZEN') . ' SET STATO = ? WHERE ID = ?', [$stato, $id]) === null) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Aggiornamento non riuscito. Riprova più tardi.';
    exit;
}

header('Location: kaizenlist.php', true, 303);
exit;
