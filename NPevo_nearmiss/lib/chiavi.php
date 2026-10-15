<?php

declare(strict_types=1);

function chiave_gestore(): ?array
{
    if (!tabella_esiste('SEGNALAZIONI_CHIAVI')) {
        return null;
    }
    return db_riga(
        'SELECT TOP 1 ID, ID_UTENTE, CHIAVE_PUBBLICA, PRIVATA_DA_PASSWORD, SALE_PASSWORD, PARAMETRI_KDF, PRIVATA_DA_EMERGENZA
         FROM ' . tabella('SEGNALAZIONI_CHIAVI') . ' ORDER BY ID'
    );
}

function formato_valido($v, string $regola): bool
{
    return is_string($v) && preg_match($regola, $v) === 1;
}

function pubblica_valida($v): bool
{
    return formato_valido($v, '/^[A-Za-z0-9+\/]{43}=$/');
}

function privata_valida($v): bool
{
    return formato_valido($v, '/^[A-Za-z0-9+\/]{96}$/');
}

function sale_valido($v): bool
{
    return formato_valido($v, '/^[A-Za-z0-9+\/]{22}==$/');
}

function parametri_validi($v): bool
{
    return formato_valido($v, '/^\{"N":[0-9]{4,7},"r":[0-9]{1,2},"p":[0-9]\}$/');
}
