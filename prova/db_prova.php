<?php

declare(strict_types=1);

$percorsoConfig = getenv('NPSEG_CONFIG');
$config = require ($percorsoConfig !== false && $percorsoConfig !== '' ? $percorsoConfig : __DIR__ . '/config.php');
$comando = $argv[1] ?? 'controlla';

$copie = [];
foreach (['SEGNALAZIONI', 'SEGNALAZIONI_CHIAVI', 'KAIZEN', 'NEARMISS'] as $nome) {
    $prova = $config['tabelle'][$nome] ?? '';
    if ($prova !== $nome . '_PROVA') {
        fwrite(STDERR, "prova/config.php deve puntare a {$nome}_PROVA, non a '{$prova}'.\n");
        exit(2);
    }
    $copie[$nome] = $prova;
}

const COLONNE_FINTE = ['DATA_INSERIMENTO', 'TIPOLOGIA', 'LUOGO', 'DATA_EVENTO', 'ORA_EVENTO', 'DESCRIZIONE', 'COINVOLGIMENTO', 'PROVE', 'SEGNALATO', 'MATRICOLA'];

function segnalazioni_finte(): array
{
    $parita = 'Parità di genere, Violenza verbale o abusi';
    $diritti = 'Diritti dei lavoratori, Sicurezza in ambiente di lavoro';
    $ambiente = 'Tutela dell’ambiente';
    $lunga = 'PROVA - Descrizione lunga per provare il limite di 1000 caratteri del modulo: ' . str_repeat('riga di prova con accento è, ', 31) . 'fine.';
    return [
        ['2025-10-23T08:12:44.123', $parita, 'PROVA - Reparto stampaggio', '2025-10-20T00:00:00', '08:15:00', 'PROVA - Frase con l\'apostrofo, "virgolette" e accenti: àèéìòù.', 'Una voce sentita in giro', 1, 0, null],
        ['2025-12-02T17:45:00.000', $diritti, 'PROVA - Magazzino', '2025-12-01T00:00:00', null, $lunga, 'Diretto coinvolto', 0, 1, 999001],
        ['2026-01-16T06:30:10.000', $ambiente, 'PROVA - Piazzale esterno', '2026-01-15T00:00:00', '22:05:00', 'PROVA - Costo stimato 1.500 € per lo smaltimento; c\'è un odore «forte».', 'Indiretto coinvolto', 1, 1, null],
        ['2026-03-03T12:00:00.000', $parita, 'PROVA - Ufficio', '2026-03-03T00:00:00', null, 'PROVA - Testo breve.', 'Sono la vittima', 0, 0, 999002],
        ['2026-05-20T23:59:59.997', $diritti, 'PROVA - Linea 3', '2026-05-20T00:00:00', '07:45:00', 'PROVA - Ore 7/8: "quasi" incidente con il muletto; l\'operatore è salvo. Ä Ö Ü ß ç ñ', 'Sono testimone', 1, 0, null],
        ['2026-07-04T14:05:33.000', $ambiente, 'PROVA - Area rifiuti', '2026-07-04T00:00:00', '13:30:00', 'PROVA - Sversamento d\'olio vicino al tombino; ‘apici’ e “virgolette” tipografiche — trattino lungo…', 'Mi è stato detto da un diretto testimone', 0, 1, 999001],
        ['2026-09-10T09:15:00.000', $diritti, 'PROVA - Non so', '2026-09-09T00:00:00', '10:00:00', 'PROVA - Segnalazione con data e ora dell\'evento.', 'Una voce sentita in giro', 1, 1, null],
        ['2026-10-07T16:20:00.000', null, 'PROVA - Mensa', null, null, 'PROVA - Riga senza tipologia né data evento, come alcune storiche.', 'Diretto coinvolto', 0, 0, null],
    ];
}

function sql_inserimento(string $tabella): string
{
    return 'INSERT INTO dbo.[' . $tabella . '] (' . implode(', ', COLONNE_FINTE) . ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
}

function letterale($v): string
{
    if ($v === null) {
        return 'NULL';
    }
    if (is_int($v)) {
        return (string) $v;
    }
    return "N'" . str_replace("'", "''", $v) . "'";
}

function istruzioni_crea(array $copie): array
{
    $istruzioni = ["SELECT TOP 0 * INTO dbo.[{$copie['SEGNALAZIONI']}] FROM dbo.[SEGNALAZIONI]"];
    foreach (segnalazioni_finte() as $riga) {
        $istruzioni[] = str_replace('VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 'VALUES (' . implode(', ', array_map('letterale', $riga)) . ')', sql_inserimento($copie['SEGNALAZIONI']));
    }
    $istruzioni[] = "SELECT * INTO dbo.[{$copie['KAIZEN']}] FROM dbo.[KAIZEN]";
    $istruzioni[] = "SELECT * INTO dbo.[{$copie['NEARMISS']}] FROM dbo.[NEARMISS]";
    return $istruzioni;
}

if ($comando === 'righe') {
    echo json_encode(['colonne' => COLONNE_FINTE, 'righe' => segnalazioni_finte()], JSON_UNESCAPED_UNICODE);
    exit(0);
}

if ($comando === 'sql') {
    echo implode(";\n", istruzioni_crea($copie)), ";\n";
    exit(0);
}

$conn = sqlsrv_connect($config['db']['server'], [
    'Database' => $config['db']['database'],
    'UID' => $config['db']['utente'],
    'PWD' => $config['db']['password'],
    'CharacterSet' => 'UTF-8',
    'Encrypt' => 'Optional',
]);
if ($conn === false) {
    fwrite(STDERR, "Connessione a SRV-DB non riuscita.\n");
    exit(1);
}

function fallisci(string $dove): void
{
    fwrite(STDERR, "Errore SQL ($dove): " . (sqlsrv_errors()[0]['message'] ?? '') . "\n");
    exit(1);
}

function valore($conn, string $sql)
{
    $st = sqlsrv_query($conn, $sql);
    if ($st === false) {
        fallisci($sql);
    }
    $r = sqlsrv_fetch_array($st, SQLSRV_FETCH_NUMERIC);
    return $r[0] ?? null;
}

function esegui($conn, string $sql, array $parametri = []): void
{
    echo $sql, $parametri === [] ? '' : '  [' . implode(', ', array_map('letterale', $parametri)) . ']', "\n";
    if (sqlsrv_query($conn, $sql, $parametri) === false) {
        fallisci($sql);
    }
}

function esiste($conn, string $tabella): bool
{
    return valore($conn, "SELECT OBJECT_ID('dbo.$tabella', 'U')") !== null;
}

function crea($conn, array $copie): void
{
    if (!esiste($conn, $copie['SEGNALAZIONI'])) {
        if (!sqlsrv_begin_transaction($conn)) {
            fallisci('BEGIN TRANSACTION');
        }
        esegui($conn, "SELECT TOP 0 * INTO dbo.[{$copie['SEGNALAZIONI']}] FROM dbo.[SEGNALAZIONI]");
        foreach (segnalazioni_finte() as $riga) {
            esegui($conn, sql_inserimento($copie['SEGNALAZIONI']), $riga);
        }
        if (!sqlsrv_commit($conn)) {
            fallisci('COMMIT');
        }
    }
    foreach (['KAIZEN', 'NEARMISS'] as $originale) {
        if (!esiste($conn, $copie[$originale])) {
            esegui($conn, "SELECT * INTO dbo.[{$copie[$originale]}] FROM dbo.[$originale]");
        }
    }
}

if ($comando === 'crea') {
    crea($conn, $copie);
    exit(0);
}

if ($comando === 'azzera') {
    foreach ($copie as $tabella) {
        esegui($conn, "DROP TABLE IF EXISTS dbo.[$tabella]");
    }
    crea($conn, $copie);
    exit(0);
}

if ($comando === 'controlla') {
    $mancanti = [];
    foreach (['SEGNALAZIONI', 'KAIZEN', 'NEARMISS'] as $originale) {
        if (!esiste($conn, $copie[$originale])) {
            $mancanti[] = $copie[$originale];
            continue;
        }
        echo str_pad($copie[$originale], 28), valore($conn, "SELECT COUNT(*) FROM dbo.[{$copie[$originale]}]"), ' righe',
            $originale === 'SEGNALAZIONI' ? ' (finte, nessuna copiata dalla tabella vera)' : ' (originale ' . valore($conn, "SELECT COUNT(*) FROM dbo.[$originale]") . ')', "\n";
    }
    if ($mancanti !== []) {
        echo 'Tabelle di prova assenti: ', implode(', ', $mancanti), "\n";
        exit(3);
    }
    $s = $copie['SEGNALAZIONI'];
    $inChiaro = "COALESCE(TIPOLOGIA, CAST(LUOGO AS varchar(max)), CAST(DESCRIZIONE AS varchar(max)), CAST(COINVOLGIMENTO AS varchar(max))) IS NOT NULL OR DATA_EVENTO IS NOT NULL OR ORA_EVENTO IS NOT NULL OR PROVE IS NOT NULL OR SEGNALATO IS NOT NULL OR MATRICOLA IS NOT NULL";
    echo "$s: in chiaro ", valore($conn, "SELECT COUNT(*) FROM dbo.[$s] WHERE $inChiaro"),
        ', testi non marcati PROVA ', valore($conn, "SELECT COUNT(*) FROM dbo.[$s] WHERE CAST(DESCRIZIONE AS varchar(max)) NOT LIKE 'PROVA -%'");
    if (valore($conn, "SELECT COL_LENGTH('dbo.$s', 'CIFRATO')") !== null) {
        echo ', senza CIFRATO ', valore($conn, "SELECT COUNT(*) FROM dbo.[$s] WHERE CIFRATO IS NULL");
    } else {
        echo ', colonne CIFRATO non ancora create (le crea il primo accesso di mcadmin)';
    }
    echo "\n", $copie['SEGNALAZIONI_CHIAVI'], ': ', esiste($conn, $copie['SEGNALAZIONI_CHIAVI']) ? valore($conn, "SELECT COUNT(*) FROM dbo.[{$copie['SEGNALAZIONI_CHIAVI']}]") . ' righe' : 'non ancora creata', "\n";
    echo 'USERS: impronta ', valore($conn, 'SELECT CHECKSUM_AGG(BINARY_CHECKSUM(*)) FROM dbo.USERS'), ', righe ', valore($conn, 'SELECT COUNT(*) FROM dbo.USERS'), "\n";
    exit(0);
}

fwrite(STDERR, "Uso: php db_prova.php controlla|crea|azzera|sql|righe\n");
exit(2);
