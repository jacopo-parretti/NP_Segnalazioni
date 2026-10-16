<?php

declare(strict_types=1);

const CAMPI_IN_CHIARO = ['TIPOLOGIA', 'LUOGO', 'DATA_EVENTO', 'ORA_EVENTO', 'DESCRIZIONE', 'COINVOLGIMENTO', 'PROVE', 'SEGNALATO', 'MATRICOLA'];

function testo_o_null($v): ?string
{
    return $v === null ? null : (string) $v;
}

function data_evento_testo($v): ?string
{
    if (!$v instanceof DateTimeInterface) {
        return testo_o_null($v);
    }
    if ($v->format('H:i:s.u') === '00:00:00.000000') {
        return $v->format('Y-m-d');
    }
    return $v->format('u') === '000000' ? $v->format('Y-m-d H:i:s') : $v->format('Y-m-d H:i:s.u');
}

function ora_testo($v): ?string
{
    if (!$v instanceof DateTimeInterface) {
        return testo_o_null($v);
    }
    if ($v->format('s.u') === '00.000000') {
        return $v->format('H:i');
    }
    return $v->format('u') === '000000' ? $v->format('H:i:s') : $v->format('H:i:s.u');
}

function istante_testo($v): ?string
{
    return $v instanceof DateTimeInterface ? $v->format('Y-m-d H:i:s.u') : testo_o_null($v);
}

function si_no($v): ?string
{
    if ($v === null) {
        return null;
    }
    return (int) $v === 1 ? 'SI' : 'NO';
}

function riga_segnalazione(array $r): array
{
    $haChiaro = false;
    foreach (CAMPI_IN_CHIARO as $campo) {
        if ($r[$campo] !== null) {
            $haChiaro = true;
        }
    }
    return [
        'id' => (int) $r['ID'],
        'data_inserimento' => $r['DATA_INSERIMENTO'] instanceof DateTimeInterface ? $r['DATA_INSERIMENTO']->format('Y-m-d') : null,
        'cifrato' => testo_o_null($r['CIFRATO']),
        'versione' => $r['VERSIONE_CIFRATURA'] === null ? null : (int) $r['VERSIONE_CIFRATURA'],
        'contromisure_cifrato' => testo_o_null($r['CONTROMISURE_CIFRATO'] ?? null),
        'costi_cifrato' => testo_o_null($r['COSTI_CIFRATO'] ?? null),
        'chiaro' => !$haChiaro ? null : [
            'tipologia' => testo_o_null($r['TIPOLOGIA']),
            'descrizione' => testo_o_null($r['DESCRIZIONE']),
            'luogo' => testo_o_null($r['LUOGO']),
            'data_evento' => data_evento_testo($r['DATA_EVENTO']),
            'ora_evento' => ora_testo($r['ORA_EVENTO']),
            'coinvolgimento' => testo_o_null($r['COINVOLGIMENTO']),
            'prove' => si_no($r['PROVE']),
            'segnalato' => si_no($r['SEGNALATO']),
            'matricola' => $r['MATRICOLA'] === null ? null : (string) (int) $r['MATRICOLA'],
            'data_inserimento' => istante_testo($r['DATA_INSERIMENTO']),
        ],
    ];
}

function segnalazioni_tutte(): ?array
{
    $righe = db_righe(
        'SELECT ID, DATA_INSERIMENTO, TIPOLOGIA, LUOGO, DATA_EVENTO, ORA_EVENTO, DESCRIZIONE, COINVOLGIMENTO, PROVE, SEGNALATO, MATRICOLA, CIFRATO, VERSIONE_CIFRATURA, CONTROMISURE_CIFRATO, COSTI_CIFRATO
         FROM ' . tabella('SEGNALAZIONI') . ' ORDER BY ID DESC'
    );
    return $righe === null ? null : array_map('riga_segnalazione', $righe);
}

function condizione_in_chiaro(): string
{
    return '(' . implode(' OR ', array_map(fn ($c) => $c . ' IS NOT NULL', CAMPI_IN_CHIARO)) . ')';
}

function segnalazioni_conta(): ?int
{
    $riga = db_riga('SELECT COUNT(*) AS N FROM ' . tabella('SEGNALAZIONI'));
    return $riga === null ? null : (int) $riga['N'];
}
