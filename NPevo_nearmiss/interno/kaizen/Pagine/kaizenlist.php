<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';
require __DIR__ . '/../../../lib/schema.php';
require __DIR__ . '/../../../lib/campi.php';

richiedi_accesso('../../../login.php');

$schema = schema_assicura();
$filtro = filtro_stato();
$righe = $schema['stato'] !== 'ok' ? null : db_righe(
    'SELECT K.ID, K.DATA, K.STATO, K.TITOLO, K.AVANZAMENTO, K.COSTI_IMPLEMENTAZIONE, P.NOME, P.COGNOME
     FROM ' . tabella('KAIZEN') . ' AS K
     OUTER APPLY (SELECT TOP 1 NOME, COGNOME FROM dbo.PERSONALENP_ALL WHERE MATRICOLA = K.MATRICOLA ORDER BY CASE WHEN FINERAPP IS NULL THEN 0 ELSE 1 END, FINERAPP DESC, COGNOME, NOME) AS P'
    . ($filtro > 0 ? ' WHERE K.STATO = ?' : '') . ' ORDER BY K.ID DESC',
    $filtro > 0 ? [$filtro] : []
);
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../../../css/stile.css') ?>">
<title>Proposte di miglioramento</title>
</head>
<body class="lista con-campi" data-csrf="<?= h(token_csrf()) ?>">
<header class="barra">
    <img class="marchio" src="../../../Images/logo-bianco.png" alt="North Plastik">
    <span class="barra-titolo">Gestione segnalazioni</span>
    <div class="destra"><a href="../../index.php" class="btn">Indietro</a></div>
</header>
<main class="pagina larga">
<div class="testa">
    <h1>Proposte di miglioramento</h1>
    <nav class="filtro" aria-label="Filtra per stato">
<?php foreach ([0 => 'Tutte', 1 => 'Nuove', 2 => 'In carico', 3 => 'Accettate', 4 => 'Rifiutate'] as $valore => $nome): ?>
        <a href="?stato=<?= $valore ?>"<?= $filtro === $valore ? ' aria-current="page"' : '' ?>><?= h($nome) ?></a>
<?php endforeach; ?>
    </nav>
    <button type="button" class="btn" data-export="../../api_export.php?tipo=kaizen&amp;stato=<?= $filtro ?>">Esporta Excel</button>
</div>
<?php if ($schema['stato'] === 'mancante'): ?>
<p class="errore">Mancano delle colonne nel database e non è stato possibile crearle. Fai lanciare questo SQL su CED_DB e ricarica la pagina:</p>
<pre class="sql"><?= h($schema['sql']) ?></pre>
<?php endif; ?>
<div class="elenco">
<?php if ($righe === null): ?>
<p class="errore">Errore di connessione al database.</p>
<?php elseif ($righe === []): ?>
<p class="vuoto">Nessuna proposta in questo stato.</p>
<?php else: ?>
<div class="elenco-testa"><span>Codice</span><span>Inserita il</span><span>Titolo</span><span>Proponente</span><span>Stato</span><span>Avanzamento attività</span><span>Costi implementazione</span><span></span></div>
<?php foreach ($righe as $r): ?>
<div class="riga">
<a class="codice" href="kaizenexplosion.php?id=<?= h($r['ID']) ?>">K<?= h($r['ID']) ?></a>
<span class="data"><?= h(data_ora($r['DATA'])) ?></span>
<span class="testo"><?= h($r['TITOLO']) ?></span>
<span class="chi"><?= h(trim(($r['COGNOME'] ?? '') . ' ' . ($r['NOME'] ?? ''))) ?></span>
<span class="stato-nome <?= classe_stato($r['STATO']) ?>"><?= h(nome_stato($r['STATO'], 'Accettata')) ?></span>
<?= cella_modificabile('kaizen', (int) $r['ID'], 'avanzamento', $r['AVANZAMENTO'], 'Avanzamento attività K' . $r['ID'], '../../api_campo.php') ?>
<?= cella_modificabile('kaizen', (int) $r['ID'], 'costi', $r['COSTI_IMPLEMENTAZIONE'], 'Costi implementazione K' . $r['ID'], '../../api_campo.php') ?>
<a class="apri" href="kaizenexplosion.php?id=<?= h($r['ID']) ?>">Apri</a>
</div>
<?php endforeach; ?>
<?php endif; ?>
</div>
</main>
<script src="../../../js/xlsx.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/xlsx.js') ?>"></script>
<script src="../../../js/esporta.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/esporta.js') ?>"></script>
<script src="../../../js/campi.js?v=<?= (int) @filemtime(__DIR__ . '/../../../js/campi.js') ?>"></script>
</body>
</html>
