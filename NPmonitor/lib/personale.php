<?php

declare(strict_types=1);

function personale_in_forza(): ?array
{
    return db_righe('SELECT MATRICOLA, NOME, COGNOME FROM dbo.PERSONALENP WHERE FINERAPP IS NULL ORDER BY COGNOME ASC');
}

function opzioni_personale(array $persone): string
{
    $html = '';
    foreach ($persone as $p) {
        $cognome = strtoupper(trim((string) $p['COGNOME']));
        $nome = strtoupper(trim((string) $p['NOME']));
        $html .= '<option value="' . h($p['MATRICOLA']) . '" data-cognome="' . h($cognome) . '" data-nome="' . h($nome) . '">'
            . h(trim($cognome . ' ' . $nome))
            . "</option>\n";
    }
    return $html;
}
