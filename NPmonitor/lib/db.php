<?php

declare(strict_types=1);

function configurazione(): array
{
    static $config = null;
    if ($config === null) {
        $percorso = getenv('NPSEG_CONFIG');
        if ($percorso === false || $percorso === '') {
            $percorso = dirname(__DIR__) . '/config.php';
        }
        $config = require $percorso;
    }
    return $config;
}

function nome_tabella(string $nome): string
{
    $vero = configurazione()['tabelle'][$nome] ?? '';
    if (!is_string($vero) || preg_match('/^[A-Za-z][A-Za-z0-9_]{0,100}$/', $vero) !== 1) {
        throw new RuntimeException('Nome tabella non valido: ' . $nome);
    }
    return $vero;
}

function tabella(string $nome): string
{
    return 'dbo.[' . nome_tabella($nome) . ']';
}

function db_registra_errore(string $dove): void
{
    error_log('NP_Segnalazioni ' . $dove . ': ' . print_r(sqlsrv_errors(), true));
}

function db()
{
    static $conn = null;
    if ($conn === null) {
        $c = configurazione()['db'];
        $conn = sqlsrv_connect($c['server'], [
            'Database' => $c['database'],
            'UID' => $c['utente'],
            'PWD' => $c['password'],
            'CharacterSet' => 'UTF-8',
            'Encrypt' => 'Optional',
        ]);
        if ($conn === false) {
            db_registra_errore('connessione');
        }
    }
    return $conn;
}

function db_righe(string $sql, array $parametri = []): ?array
{
    $conn = db();
    if ($conn === false) {
        return null;
    }
    $stmt = sqlsrv_query($conn, $sql, $parametri);
    if ($stmt === false) {
        db_registra_errore('lettura');
        return null;
    }
    $righe = [];
    while (($riga = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) !== null) {
        if ($riga === false) {
            db_registra_errore('lettura');
            sqlsrv_free_stmt($stmt);
            return null;
        }
        $righe[] = $riga;
    }
    sqlsrv_free_stmt($stmt);
    return $righe;
}

function db_riga(string $sql, array $parametri = []): ?array
{
    $righe = db_righe($sql, $parametri);
    if ($righe === null || count($righe) === 0) {
        return null;
    }
    return $righe[0];
}

function db_esegui(string $sql, array $parametri = []): ?int
{
    $conn = db();
    if ($conn === false) {
        return null;
    }
    $stmt = sqlsrv_query($conn, $sql, $parametri);
    if ($stmt === false) {
        db_registra_errore('scrittura');
        return null;
    }
    $n = sqlsrv_rows_affected($stmt);
    sqlsrv_free_stmt($stmt);
    return $n === false ? null : $n;
}

function tabella_esiste(string $nome): bool
{
    $riga = db_riga('SELECT OBJECT_ID(?, \'U\') AS OID', ['dbo.' . nome_tabella($nome)]);
    return $riga !== null && $riga['OID'] !== null;
}

function testo(string $s): array
{
    return [$s, SQLSRV_PARAM_IN, SQLSRV_PHPTYPE_STRING('UTF-8'), SQLSRV_SQLTYPE_NVARCHAR('max')];
}

function ascii(string $s): array
{
    return [$s, SQLSRV_PARAM_IN, SQLSRV_PHPTYPE_STRING('UTF-8'), SQLSRV_SQLTYPE_VARCHAR('max')];
}

function h($v): string
{
    return htmlspecialchars((string) ($v ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
