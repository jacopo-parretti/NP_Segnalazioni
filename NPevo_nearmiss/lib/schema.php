<?php

declare(strict_types=1);

function schema_istruzioni(): array
{
    $segnalazioni = nome_tabella('SEGNALAZIONI');
    $chiavi = nome_tabella('SEGNALAZIONI_CHIAVI');
    return [
        "IF COL_LENGTH('dbo.$segnalazioni', 'CIFRATO') IS NULL ALTER TABLE dbo.[$segnalazioni] ADD CIFRATO varchar(max) NULL;",
        "IF COL_LENGTH('dbo.$segnalazioni', 'VERSIONE_CIFRATURA') IS NULL ALTER TABLE dbo.[$segnalazioni] ADD VERSIONE_CIFRATURA tinyint NULL;",
        "IF OBJECT_ID('dbo.$chiavi', 'U') IS NULL CREATE TABLE dbo.[$chiavi] (ID int IDENTITY(1,1) NOT NULL PRIMARY KEY, ID_UTENTE int NOT NULL, CHIAVE_PUBBLICA varchar(64) NULL, PRIVATA_DA_PASSWORD varchar(max) NULL, SALE_PASSWORD varchar(64) NULL, PARAMETRI_KDF varchar(100) NULL, PRIVATA_DA_EMERGENZA varchar(max) NULL, CREATA date NULL);",
    ];
}

function schema_completo(): ?bool
{
    $riga = db_riga(
        'SELECT COL_LENGTH(?, \'CIFRATO\') AS C, COL_LENGTH(?, \'VERSIONE_CIFRATURA\') AS V, OBJECT_ID(?, \'U\') AS K',
        ['dbo.' . nome_tabella('SEGNALAZIONI'), 'dbo.' . nome_tabella('SEGNALAZIONI'), 'dbo.' . nome_tabella('SEGNALAZIONI_CHIAVI')]
    );
    if ($riga === null) {
        return null;
    }
    return $riga['C'] !== null && $riga['V'] !== null && $riga['K'] !== null;
}

function schema_assicura(): array
{
    $completo = schema_completo();
    if ($completo === true) {
        return ['stato' => 'ok', 'sql' => ''];
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
        return ['stato' => 'ok', 'sql' => ''];
    }
    return ['stato' => $dopo === null ? 'irraggiungibile' : 'mancante', 'sql' => $dopo === null ? '' : implode("\n", $istruzioni)];
}

function schema_errore_api(array $schema): void
{
    if ($schema['stato'] === 'irraggiungibile') {
        rispondi_json(['errore' => 'Database non raggiungibile: riprova più tardi.'], 503);
    }
    if ($schema['stato'] !== 'ok') {
        rispondi_json(['errore' => 'Le tabelle delle segnalazioni cifrate mancano e non è stato possibile crearle.', 'sql' => $schema['sql']], 500);
    }
}
