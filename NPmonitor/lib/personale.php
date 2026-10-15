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
        $html .= '<option value="' . h($p['MATRICOLA']) . '">'
            . h(strtoupper((string) $p['COGNOME']) . ' ' . strtoupper((string) $p['NOME']))
            . "</option>\n";
    }
    return $html;
}
