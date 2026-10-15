<?php

declare(strict_types=1);

function classe_stato($stato): string
{
    return [2 => 'in-carico', 3 => 'accettata', 4 => 'rifiutata'][(int) $stato] ?? 'da-incaricare';
}

function filtro_stato(): int
{
    $s = $_GET['stato'] ?? '0';
    return is_string($s) && preg_match('/^[1-4]$/', $s) === 1 ? (int) $s : 0;
}

function stato_da_post(): ?int
{
    $s = $_POST['stato'] ?? null;
    return is_string($s) && preg_match('/^[1-4]$/', $s) === 1 ? (int) $s : null;
}

function id_da(array $sorgente): ?int
{
    $id = $sorgente['id'] ?? null;
    return is_string($id) && preg_match('/^[0-9]{1,9}$/', $id) === 1 && (int) $id > 0 ? (int) $id : null;
}

function data_ora($v): string
{
    return $v instanceof DateTimeInterface ? $v->format('d/m/Y H:i:s') : '';
}

function opzioni_stato(int $attuale, string $etichettaTre): string
{
    $etichette = [1 => 'Nuova', 2 => 'In Carico', 3 => $etichettaTre, 4 => 'Rifiutata'];
    $html = '';
    foreach ($etichette as $valore => $etichetta) {
        $html .= '<option value="' . $valore . '"' . ($valore === $attuale ? ' selected' : '') . '>' . h($etichetta) . "</option>\n";
    }
    return $html;
}
