<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';

richiedi_accesso('../../../login.php');

$filtro = filtro_stato();
$righe = db_righe(
    'SELECT N.ID_NM, N.DATA, N.STATO, R.REPARTO AS NOME_REP, P.NOME, P.COGNOME
     FROM ' . tabella('NEARMISS') . ' AS N
     OUTER APPLY (SELECT TOP 1 NOME, COGNOME FROM dbo.PERSONALENP_ALL WHERE MATRICOLA = N.MATRICOLA ORDER BY CASE WHEN FINERAPP IS NULL THEN 0 ELSE 1 END, FINERAPP DESC, COGNOME, NOME) AS P
     LEFT JOIN dbo.NEARMISS_REPARTI AS R ON N.REPARTO = R.REPARTO_ID'
    . ($filtro > 0 ? ' WHERE N.STATO = ?' : '') . ' ORDER BY N.ID_NM DESC',
    $filtro > 0 ? [$filtro] : []
);
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../../../css/stile.css') ?>">
<title>Mancati infortuni</title>
</head>
<body class="lista">
<header class="barra">
    <img class="marchio" src="../../../Images/logo-bianco.png" alt="North Plastik">
    <span class="barra-titolo">Gestione segnalazioni</span>
    <div class="destra"><a href="../../index.php" class="btn">Indietro</a></div>
</header>
<main class="pagina">
<div class="testa">
    <h1>Mancati infortuni</h1>
    <nav class="filtro" aria-label="Filtra per stato">
<?php foreach ([0 => 'Tutti', 1 => 'Nuovi', 2 => 'In carico', 3 => 'Conclusi', 4 => 'Rifiutati'] as $valore => $nome): ?>
        <a href="?stato=<?= $valore ?>"<?= $filtro === $valore ? ' aria-current="page"' : '' ?>><?= h($nome) ?></a>
<?php endforeach; ?>
    </nav>
    <button type="button" class="btn" data-export="../../api_export.php?tipo=nearmiss&amp;stato=<?= $filtro ?>">Esporta Excel</button>
</div>
<div class="elenco">
<?php if ($righe === null): ?>
<p class="errore">Errore di connessione al database.</p>
<?php elseif ($righe === []): ?>
<p class="vuoto">Nessun mancato infortunio in questo stato.</p>
<?php else: ?>
<div class="elenco-testa"><span>Codice</span><span>Inserito il</span><span>Reparto</span><span>Segnalato da</span><span>Stato</span><span></span></div>
<?php foreach ($righe as $r): ?>
<a class="riga" href="nearmissexplosion.php?id=<?= h($r['ID_NM']) ?>">
<span class="codice">NM<?= h($r['ID_NM']) ?></span>
<span class="data"><?= h(data_ora($r['DATA'])) ?></span>
<span class="testo"><?= h(trim((string) ($r['NOME_REP'] ?? ''))) ?></span>
<span class="chi"><?= h(trim(($r['COGNOME'] ?? '') . ' ' . ($r['NOME'] ?? ''))) ?></span>
<span class="stato-nome <?= classe_stato($r['STATO']) ?>"><?= h(nome_stato($r['STATO'], 'Conclusa')) ?></span>
<span class="apri">Apri</span>
</a>
<?php endforeach; ?>
<?php endif; ?>
</div>
</main>
<script src="../../../js/xlsx.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/xlsx.js') ?>"></script>
<script src="../../../js/esporta.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/esporta.js') ?>"></script>
</body>
</html>
