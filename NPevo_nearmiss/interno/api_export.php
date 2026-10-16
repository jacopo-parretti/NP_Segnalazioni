<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/auth.php';
require __DIR__ . '/../lib/stati.php';
require __DIR__ . '/../lib/schema.php';

richiedi_accesso_api();
schema_errore_api(schema_assicura());

$tipo = $_GET['tipo'] ?? '';
$filtro = filtro_stato();
$persona = 'OUTER APPLY (SELECT TOP 1 NOME, COGNOME FROM dbo.PERSONALENP_ALL WHERE MATRICOLA = %s.MATRICOLA ORDER BY CASE WHEN FINERAPP IS NULL THEN 0 ELSE 1 END, FINERAPP DESC, COGNOME, NOME) AS P';
$nome = static fn (array $r): string => trim(($r['COGNOME'] ?? '') . ' ' . ($r['NOME'] ?? ''));
$giorno = static fn ($v): string => $v instanceof DateTimeInterface ? $v->format('d/m/Y') : '';
$testo = static fn ($v): string => trim((string) ($v ?? ''));

if ($tipo === 'kaizen') {
    $righe = db_righe(
        'SELECT K.ID, K.DATA, K.TITOLO, K.DESCRIZIONE, K.MATRICOLA, K.STATO, K.AVANZAMENTO, K.COSTI_IMPLEMENTAZIONE, P.NOME, P.COGNOME, C.CATEGORIA, B.BENEFICI
         FROM ' . tabella('KAIZEN') . ' AS K ' . sprintf($persona, 'K') . '
         LEFT JOIN dbo.CATEGORIA_KAIZEN AS C ON K.CATEGORIA_ID = C.ID_CATEGORIA
         LEFT JOIN dbo.BENEFICI_KAIZEN AS B ON K.BENEFICI_ID = B.ID_BENEFICI'
        . ($filtro > 0 ? ' WHERE K.STATO = ?' : '') . ' ORDER BY K.ID DESC',
        $filtro > 0 ? [$filtro] : []
    );
    if ($righe === null) {
        rispondi_json(['errore' => 'Database non disponibile.'], 500);
    }
    rispondi_json([
        'foglio' => 'Proposte di miglioramento',
        'prefisso' => 'kaizen',
        'intestazioni' => ['ID', 'DATA INSERIMENTO', 'TITOLO', 'DESCRIZIONE', 'PROPONENTE', 'MATRICOLA', 'CATEGORIA', 'BENEFICIO ATTESO', 'STATO', 'AVANZAMENTO ATTIVITÀ', 'COSTI IMPLEMENTAZIONE'],
        'righe' => array_map(static fn (array $r): array => [
            'K' . $r['ID'],
            data_ora($r['DATA']),
            $testo($r['TITOLO']),
            $testo($r['DESCRIZIONE']),
            $nome($r),
            $r['MATRICOLA'] === null ? '' : (string) $r['MATRICOLA'],
            $testo($r['CATEGORIA']),
            $testo($r['BENEFICI']),
            nome_stato($r['STATO'], 'Accettata'),
            $testo($r['AVANZAMENTO']),
            $testo($r['COSTI_IMPLEMENTAZIONE']),
        ], $righe),
    ]);
}

if ($tipo === 'nearmiss') {
    $righe = db_righe(
        'SELECT N.ID_NM, N.DATA, N.DATA_AVVENIMENTO, N.MATRICOLA, N.DESC_EV, N.CONTR_SU, N.STATO, N.CONTROMISURE_APPLICATE, N.COSTI_IMPLEMENTAZIONE, P.NOME, P.COGNOME, R.REPARTO AS NOME_REP
         FROM ' . tabella('NEARMISS') . ' AS N ' . sprintf($persona, 'N') . '
         LEFT JOIN dbo.NEARMISS_REPARTI AS R ON N.REPARTO = R.REPARTO_ID'
        . ($filtro > 0 ? ' WHERE N.STATO = ?' : '') . ' ORDER BY N.ID_NM DESC',
        $filtro > 0 ? [$filtro] : []
    );
    if ($righe === null) {
        rispondi_json(['errore' => 'Database non disponibile.'], 500);
    }
    rispondi_json([
        'foglio' => 'Mancati infortuni',
        'prefisso' => 'mancati_infortuni',
        'intestazioni' => ['ID', 'DATA INSERIMENTO', 'DATA EVENTO', 'REPARTO', 'SEGNALATO DA', 'MATRICOLA', 'DESCRIZIONE', 'CONTROMISURE SUGGERITE', 'STATO', 'CONTROMISURE APPLICATE', 'COSTI IMPLEMENTAZIONE'],
        'righe' => array_map(static fn (array $r): array => [
            'NM' . $r['ID_NM'],
            data_ora($r['DATA']),
            $giorno($r['DATA_AVVENIMENTO']),
            $testo($r['NOME_REP']),
            $nome($r),
            $r['MATRICOLA'] === null ? '' : (string) $r['MATRICOLA'],
            $testo($r['DESC_EV']),
            $testo($r['CONTR_SU']),
            nome_stato($r['STATO'], 'Conclusa'),
            $testo($r['CONTROMISURE_APPLICATE']),
            $testo($r['COSTI_IMPLEMENTAZIONE']),
        ], $righe),
    ]);
}

rispondi_json(['errore' => 'Tipo non valido.'], 400);
