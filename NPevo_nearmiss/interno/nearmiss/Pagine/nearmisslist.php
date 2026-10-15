<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';

richiedi_accesso('../../../login.php');

$filtro = filtro_stato();
$sql = 'SELECT ID_NM, DATA, STATO FROM ' . tabella('NEARMISS') . ($filtro > 0 ? ' WHERE STATO = ?' : '') . ' ORDER BY ID_NM DESC';
$righe = db_righe($sql, $filtro > 0 ? [$filtro] : []);
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../../css/stile.css">
<title>Lista Near Miss</title>
</head>
<body class="lista">
<a href="../../index.php"><div class="back-button">◄ INDIETRO</div></a>
<div class="header">
<h1>RICHIESTE NEAR MISS</h1>
</div>
<div class="legend">
<a class="nav" href="?stato=0"><div>Tutte le richieste</div></a>
<a class="nav" href="?stato=1"><div><span class="da-incaricare"></span> Nuove</div></a>
<a class="nav" href="?stato=2"><div><span class="in-carico"></span> In carico</div></a>
<a class="nav" href="?stato=3"><div><span class="accettata"></span> Accettata</div></a>
<a class="nav" href="?stato=4"><div><span class="rifiutata"></span> Rifiutata</div></a>
</div>
<div class="list-container">
<div class="elenco">
<?php if ($righe === null): ?>
<p class="errore">Errore di connessione al database.</p>
<?php else: ?>
<?php foreach ($righe as $r): ?>
<a href="nearmissexplosion.php?id=<?= h($r['ID_NM']) ?>">
<div class="item <?= classe_stato($r['STATO']) ?>">
<strong>ID:</strong> NM<?= h($r['ID_NM']) ?> <strong>Data:</strong> <?= h(data_ora($r['DATA'])) ?>
</div>
</a>
<?php endforeach; ?>
<?php endif; ?>
</div>
</div>
</body>
</html>
