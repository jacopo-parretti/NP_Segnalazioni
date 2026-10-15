<?php

declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/auth.php';
require __DIR__ . '/../lib/schema.php';

richiedi_accesso('../login.php');
intestazioni_protette();
schema_assicura();

$conta = static function (string $sql): ?int {
    $r = db_riga($sql);
    return $r === null ? null : (int) ($r['N'] ?? 0);
};
$kaizen = $conta('SELECT COUNT(*) AS N FROM ' . tabella('KAIZEN') . ' WHERE STATO = 1');
$nearmiss = $conta('SELECT COUNT(*) AS N FROM ' . tabella('NEARMISS') . ' WHERE STATO = 1');
$segnalazioni = $conta('SELECT COUNT(*) AS N FROM ' . tabella('SEGNALAZIONI'));
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../css/stile.css') ?>">
<title>Gestione segnalazioni</title>
</head>
<body class="home">
    <header class="barra">
        <img class="marchio" src="../Images/logo-bianco.png" alt="North Plastik">
        <span class="barra-titolo">Gestione segnalazioni</span>
        <div class="destra"><a href="logout.php" class="btn">Esci</a></div>
    </header>
    <main class="pagina">
        <div class="testa"><h1>Rapporti</h1></div>
        <nav class="moduli" aria-label="Rapporti">
            <a href="kaizen/Pagine/kaizenlist.php" class="modulo">
                <span class="modulo-figura"><img src="Images/kaizen.png" alt=""></span>
                <span class="modulo-piede">
                    <span class="modulo-nome">Proposte di miglioramento</span>
<?php if ($kaizen !== null): ?>
                    <span class="modulo-conta"><strong><?= h($kaizen) ?></strong><span><?= $kaizen === 1 ? 'nuova' : 'nuove' ?></span></span>
<?php endif; ?>
                </span>
            </a>
            <a href="nearmiss/Pagine/nearmisslist.php" class="modulo">
                <span class="modulo-figura"><img src="Images/nearmiss.png" alt=""></span>
                <span class="modulo-piede">
                    <span class="modulo-nome">Mancati infortuni</span>
<?php if ($nearmiss !== null): ?>
                    <span class="modulo-conta"><strong><?= h($nearmiss) ?></strong><span><?= $nearmiss === 1 ? 'nuovo' : 'nuovi' ?></span></span>
<?php endif; ?>
                </span>
            </a>
            <a href="segnalazioni/Pagine/segnalazionilist.php" class="modulo">
                <span class="modulo-figura"><img src="Images/segnalazioni.png" alt=""></span>
                <span class="modulo-piede">
                    <span class="modulo-nome">Segnalazioni</span>
<?php if ($segnalazioni !== null): ?>
                    <span class="modulo-conta"><strong><?= h($segnalazioni) ?></strong><span>in tutto</span></span>
<?php endif; ?>
                </span>
            </a>
        </nav>
    </main>
</body>
</html>
