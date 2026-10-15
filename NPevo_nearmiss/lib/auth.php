<?php

declare(strict_types=1);

function sessione_avvia(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
        session_start();
    }
}

function utente_collegato(): bool
{
    sessione_avvia();
    return isset($_SESSION['userMC'], $_SESSION['idMC']);
}

function richiedi_accesso(string $paginaLogin): void
{
    if (!utente_collegato()) {
        header('Location: ' . $paginaLogin);
        exit;
    }
}

function rispondi_json(array $dati, int $codice = 200): void
{
    $json = json_encode($dati, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $codice = 500;
        $json = '{"errore":"Dati non leggibili in UTF-8."}';
    }
    http_response_code($codice);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo $json;
    exit;
}

function richiedi_accesso_api(): void
{
    if (!utente_collegato()) {
        rispondi_json(['errore' => 'Sessione scaduta: accedi di nuovo.'], 401);
    }
}

function token_csrf(): string
{
    sessione_avvia();
    if (empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_valido(): bool
{
    $token = $_POST['csrf'] ?? null;
    return ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && is_string($token) && hash_equals(token_csrf(), $token);
}

function richiedi_csrf(): void
{
    if (!csrf_valido()) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'Richiesta non valida.';
        exit;
    }
}

function richiedi_csrf_api(): void
{
    if (!csrf_valido()) {
        rispondi_json(['errore' => 'Richiesta non valida.'], 403);
    }
}

function accedi(string $utente, int $id): void
{
    sessione_avvia();
    session_regenerate_id(true);
    $_SESSION = [];
    $_SESSION['userMC'] = $utente;
    $_SESSION['idMC'] = $id;
}

function esci(): void
{
    sessione_avvia();
    $_SESSION = [];
    $p = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $p['path'],
        'domain' => $p['domain'],
        'secure' => $p['secure'],
        'httponly' => $p['httponly'],
        'samesite' => 'Lax',
    ]);
    session_destroy();
}

function intestazioni_protette(): void
{
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'");
    header('Referrer-Policy: no-referrer');
    header('Cache-Control: no-store');
}
