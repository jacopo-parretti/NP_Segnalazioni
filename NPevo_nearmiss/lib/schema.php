<?php

declare(strict_types=1);

function schema_colonne(): array
{
    return [
        ['SEGNALAZIONI', 'CIFRATO', 'varchar(max)'],
        ['SEGNALAZIONI', 'VERSIONE_CIFRATURA', 'tinyint'],
        ['SEGNALAZIONI', 'CONTROMISURE_CIFRATO', 'varchar(max)'],
        ['SEGNALAZIONI', 'COSTI_CIFRATO', 'varchar(max)'],
        ['KAIZEN', 'AVANZAMENTO', 'nvarchar(1000)'],
        ['KAIZEN', 'COSTI_IMPLEMENTAZIONE', 'nvarchar(1000)'],
        ['NEARMISS', 'CONTROMISURE_APPLICATE', 'nvarchar(1000)'],
        ['NEARMISS', 'COSTI_IMPLEMENTAZIONE', 'nvarchar(1000)'],
    ];
}

function schema_istruzioni(): array
{
    $istruzioni = [];
    foreach (schema_colonne() as [$tabella, $colonna, $tipo]) {
        $nome = nome_tabella($tabella);
        $istruzioni[] = "IF COL_LENGTH('dbo.$nome', '$colonna') IS NULL ALTER TABLE dbo.[$nome] ADD $colonna $tipo NULL;";
    }
    $chiavi = nome_tabella('SEGNALAZIONI_CHIAVI');
    $istruzioni[] = "IF OBJECT_ID('dbo.$chiavi', 'U') IS NULL CREATE TABLE dbo.[$chiavi] (ID int IDENTITY(1,1) NOT NULL PRIMARY KEY, ID_UTENTE int NOT NULL, CHIAVE_PUBBLICA varchar(64) NULL, PRIVATA_DA_PASSWORD varchar(max) NULL, SALE_PASSWORD varchar(64) NULL, PARAMETRI_KDF varchar(100) NULL, PRIVATA_DA_EMERGENZA varchar(max) NULL, CREATA date NULL);";
    return $istruzioni;
}

function schema_completo(): ?bool
{
    $colonne = schema_colonne();
    $sql = [];
    $parametri = [];
    foreach ($colonne as $i => [$tabella, $colonna]) {
        $sql[] = 'COL_LENGTH(?, ?) AS C' . $i;
        $parametri[] = 'dbo.' . nome_tabella($tabella);
        $parametri[] = $colonna;
    }
    $parametri[] = 'dbo.' . nome_tabella('SEGNALAZIONI_CHIAVI');
    $riga = db_riga('SELECT ' . implode(', ', $sql) . ', OBJECT_ID(?, \'U\') AS K', $parametri);
    if ($riga === null) {
        return null;
    }
    foreach (array_keys($colonne) as $i) {
        if ($riga['C' . $i] === null) {
            return false;
        }
    }
    return $riga['K'] !== null;
}

function schema_assicura(): array
{
    static $esito = null;
    if ($esito !== null) {
        return $esito;
    }
    $completo = schema_completo();
    if ($completo === true) {
        return $esito = ['stato' => 'ok', 'sql' => ''];
    }
    if ($completo === null) {
        return ['stato' => 'irraggiungibile', 'sql' => ''];
    }
    $istruzioni = schema_istruzioni();
    foreach ($istruzioni as $sql) {
        if (db_esegui($sql) === null) {
            break;
        }
    }
    $dopo = schema_completo();
    if ($dopo === true) {
        return $esito = ['stato' => 'ok', 'sql' => ''];
    }
    return ['stato' => $dopo === null ? 'irraggiungibile' : 'mancante', 'sql' => $dopo === null ? '' : implode("\n", $istruzioni)];
}

function schema_errore_api(array $schema): void
{
    if ($schema['stato'] === 'irraggiungibile') {
        rispondi_json(['errore' => 'Database non raggiungibile: riprova più tardi.'], 503);
    }
    if ($schema['stato'] !== 'ok') {
        rispondi_json(['errore' => 'Mancano delle colonne nel database e non è stato possibile crearle.', 'sql' => $schema['sql']], 500);
    }
}
