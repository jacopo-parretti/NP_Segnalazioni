<?php

declare(strict_types=1);

function lunghezza(string $s): int
{
    $n = preg_match_all('/./us', $s);
    return $n === false ? PHP_INT_MAX : $n;
}

function testo_valido($v, int $massimo): ?string
{
    if (!is_string($v)) {
        return null;
    }
    $v = trim($v);
    if ($v === '' || lunghezza($v) > $massimo) {
        return null;
    }
    return $v;
}

function intero_positivo($v): ?int
{
    if (!is_string($v) || preg_match('/^\s*[0-9]{1,9}\s*$/', $v) !== 1) {
        return null;
    }
    $n = (int) trim($v);
    return $n > 0 ? $n : null;
}
