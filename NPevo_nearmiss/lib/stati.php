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

function nome_stato($stato, string $etichettaTre): string
{
    return [2 => 'In carico', 3 => $etichettaTre, 4 => 'Rifiutata'][(int) $stato] ?? 'Nuova';
}

function scelte_stato(int $attuale, string $etichettaTre): string
{
    $html = '';
    foreach ([1, 2, 3, 4] as $valore) {
        $html .= '<label class="' . classe_stato($valore) . '"><input type="radio" name="stato" value="' . $valore . '"'
            . ($valore === $attuale ? ' checked' : '') . ' required>' . h(nome_stato($valore, $etichettaTre)) . "</label>\n";
    }
    return $html;
}
