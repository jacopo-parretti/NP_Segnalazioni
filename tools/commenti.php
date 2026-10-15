<?php

declare(strict_types=1);

$trovati = [];
foreach (array_slice($argv, 1) as $file) {
    $codice = (string) file_get_contents($file);
    foreach (token_get_all($codice) as $t) {
        if (!is_array($t)) {
            continue;
        }
        [$tipo, $testo, $riga] = $t;
        if ($tipo === T_COMMENT || $tipo === T_DOC_COMMENT) {
            $trovati[] = "$file:$riga commento PHP";
        }
        if ($tipo === T_INLINE_HTML) {
            if (str_contains($testo, '<!--')) {
                $trovati[] = "$file:$riga commento HTML";
            }
            if (preg_match('/<script(?![^>]*\bsrc=)[^>]*>/i', $testo) === 1) {
                $trovati[] = "$file:$riga script inline";
            }
            if (preg_match('/<style\b|\sstyle\s*=/i', $testo) === 1) {
                $trovati[] = "$file:$riga stile inline";
            }
        }
    }
}
echo json_encode($trovati);
