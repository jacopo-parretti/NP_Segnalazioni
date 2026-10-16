<?php

declare(strict_types=1);

function cella_modificabile(string $tipo, int $id, string $campo, ?string $valore, string $etichetta, string $url): string
{
    return '<span class="cella-campo"><textarea class="campo-riga" rows="2" maxlength="1000" aria-label="' . h($etichetta) . '"'
        . ' data-tipo="' . h($tipo) . '" data-id="' . $id . '" data-campo="' . h($campo) . '" data-url="' . h($url) . '">'
        . h($valore) . '</textarea><span class="campo-stato" aria-live="polite"></span></span>';
}
