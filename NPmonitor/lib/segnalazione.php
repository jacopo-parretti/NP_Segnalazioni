<?php

declare(strict_types=1);

function cifrato_valido($cifrato): bool
{
    if (!is_string($cifrato) || strlen($cifrato) > 65536 || preg_match('/^[A-Za-z0-9+\/]+={0,2}$/', $cifrato) !== 1) {
        return false;
    }
    $grezzo = base64_decode($cifrato, true);
    if ($grezzo === false) {
        return false;
    }
    $n = strlen($grezzo);
    return $n >= 72 + 1024 && ($n - 72) % 1024 === 0;
}

function segnalazione_da_post(array $post): ?string
{
    $chiavi = array_keys($post);
    sort($chiavi);
    if ($chiavi !== ['cifrato', 'versione']) {
        return null;
    }
    if ($post['versione'] !== '1' || !cifrato_valido($post['cifrato'])) {
        return null;
    }
    return $post['cifrato'];
}

function impronta_pubblica(string $pubblica): ?string
{
    $grezza = base64_decode($pubblica, true);
    if ($grezza === false || strlen($grezza) !== 32) {
        return null;
    }
    return implode('-', str_split(strtoupper(substr(hash('sha512', $grezza), 0, 32)), 4));
}

function impronta_normalizzata($impronta): string
{
    $hex = strtoupper((string) preg_replace('/[^0-9A-Fa-f]/', '', is_string($impronta) ? $impronta : ''));
    return strlen($hex) === 32 ? implode('-', str_split($hex, 4)) : '';
}

function pubblica_ammessa($pubblica, $improntaAttesa): ?string
{
    $attesa = impronta_normalizzata($improntaAttesa);
    if ($attesa === '') {
        error_log('NP_Segnalazioni: impronta della chiave del gestore assente o non valida in config.php');
        return null;
    }
    if (!is_string($pubblica) || preg_match('/^[A-Za-z0-9+\/]{43}=$/', $pubblica) !== 1) {
        return null;
    }
    $letta = impronta_pubblica($pubblica);
    if ($letta === null || !hash_equals($attesa, $letta)) {
        error_log('NP_Segnalazioni: la chiave pubblica nel DB non corrisponde all\'impronta in config.php (letta ' . $letta . ')');
        return null;
    }
    return $pubblica;
}

function chiave_pubblica_gestore(): ?string
{
    if (!tabella_esiste('SEGNALAZIONI_CHIAVI')) {
        return null;
    }
    $riga = db_riga('SELECT TOP 1 CHIAVE_PUBBLICA FROM ' . tabella('SEGNALAZIONI_CHIAVI') . ' ORDER BY ID');
    if ($riga === null) {
        return null;
    }
    return pubblica_ammessa($riga['CHIAVE_PUBBLICA'] ?? null, configurazione()['impronta_chiave_gestore'] ?? '');
}
