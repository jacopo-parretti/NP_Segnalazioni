<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';

richiedi_accesso('../../../login.php');

$id = id_da($_GET);
$k = $id === null ? null : db_riga(
    'SELECT K.ID, K.TITOLO, K.DATA, K.STATO, K.DESCRIZIONE, P.NOME, P.COGNOME, C.CATEGORIA, B.BENEFICI
     FROM ' . tabella('KAIZEN') . ' AS K
     OUTER APPLY (SELECT TOP 1 NOME, COGNOME FROM dbo.PERSONALENP_ALL WHERE MATRICOLA = K.MATRICOLA ORDER BY CASE WHEN FINERAPP IS NULL THEN 0 ELSE 1 END, FINERAPP DESC, COGNOME, NOME) AS P
     LEFT JOIN dbo.CATEGORIA_KAIZEN AS C ON K.CATEGORIA_ID = C.ID_CATEGORIA
     LEFT JOIN dbo.BENEFICI_KAIZEN AS B ON K.BENEFICI_ID = B.ID_BENEFICI
     WHERE K.ID = ?',
    [$id]
);
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../../../css/stile.css') ?>">
<title>Proposta di miglioramento</title>
</head>
<body class="dettaglio">
<header class="barra">
    <img class="marchio" src="../../../Images/logo-bianco.png" alt="North Plastik">
    <span class="barra-titolo">Gestione segnalazioni</span>
    <div class="destra"><a href="kaizenlist.php" class="btn">Torna all'elenco</a></div>
</header>
<main class="pagina">
<?php if ($k === null): ?>
<p class="errore">Richiesta non trovata.</p>
<?php else: ?>
<div class="testa">
    <h1>Proposta K<?= h($k['ID']) ?></h1>
    <span class="stato-nome <?= classe_stato($k['STATO']) ?>"><?= h(nome_stato($k['STATO'], 'Accettata')) ?></span>
</div>
<div class="scheda">
<dl class="voci">
    <div><dt>Titolo</dt><dd><?= h($k['TITOLO']) ?></dd></div>
    <div><dt>Proponente</dt><dd><?= h(trim(($k['COGNOME'] ?? '') . ' ' . ($k['NOME'] ?? ''))) ?></dd></div>
    <div><dt>Inserita il</dt><dd><?= h(data_ora($k['DATA'])) ?></dd></div>
    <div><dt>Categoria</dt><dd><?= h($k['CATEGORIA']) ?></dd></div>
    <div><dt>Beneficio atteso</dt><dd><?= h($k['BENEFICI']) ?></dd></div>
    <div><dt>Descrizione</dt><dd><?= h($k['DESCRIZIONE']) ?></dd></div>
</dl>
<form name="insertstatus" class="cambio" action="insert_status.php" method="post">
    <h2 id="stato-titolo">Cambia stato</h2>
    <fieldset class="stati" aria-labelledby="stato-titolo">
<?= scelte_stato((int) $k['STATO'], 'Accettata') ?>
    </fieldset>
    <input type="hidden" name="id" value="<?= h($k['ID']) ?>">
    <input type="hidden" name="csrf" value="<?= h(token_csrf()) ?>">
    <button type="submit" class="pulsante principale">Aggiorna lo stato</button>
</form>
</div>
<?php endif; ?>
</main>
</body>
</html>
