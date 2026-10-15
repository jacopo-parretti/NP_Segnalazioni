<?php

declare(strict_types=1);

function nearmiss_payload(int $id, string $nominativo, DateTimeInterface $dataEvento, string $reparto, string $descrizione): string
{
    $payload = [
        'ID_NM' => 'NM' . $id,
        'MATRICOLA' => $nominativo,
        'DATA_AVVENIMENTO' => $dataEvento->format('d-m-Y'),
        'REPARTO' => $reparto,
        'DESC_EV' => $descrizione,
    ];
    return (string) json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
}

function nearmiss_notifica(array $powerAutomate, string $json): bool
{
    if (empty($powerAutomate['attivo']) || !is_string($powerAutomate['url'] ?? null) || $powerAutomate['url'] === '') {
        return false;
    }
    $ch = curl_init($powerAutomate['url']);
    if ($ch === false) {
        return false;
    }
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $json,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
    ]);
    $risposta = curl_exec($ch);
    $codice = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    if ($risposta === false || $codice >= 400) {
        error_log('NP_Segnalazioni Power Automate: ' . ($risposta === false ? curl_error($ch) : 'HTTP ' . $codice));
    }
    curl_close($ch);
    return $risposta !== false && $codice < 400;
}
