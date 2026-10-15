<?php

declare(strict_types=1);

require __DIR__ . '/../../../lib/db.php';
require __DIR__ . '/../../../lib/auth.php';
require __DIR__ . '/../../../lib/stati.php';

richiedi_accesso('../../../login.php');

$id = id_da($_GET);
$nm = $id === null ? null : db_riga(
    'SELECT N.ID_NM, N.MATRICOLA, N.DATA, N.POSTAZIONE, N.DESC_EV, N.CONTR_SU, N.STATO, P.NOME, P.COGNOME, R.REPARTO AS NOME_REP
     FROM ' . tabella('NEARMISS') . ' AS N
     OUTER APPLY (SELECT TOP 1 NOME, COGNOME FROM dbo.PERSONALENP_ALL WHERE MATRICOLA = N.MATRICOLA ORDER BY CASE WHEN FINERAPP IS NULL THEN 0 ELSE 1 END, FINERAPP DESC, COGNOME, NOME) AS P
     LEFT JOIN dbo.NEARMISS_REPARTI AS R ON N.REPARTO = R.REPARTO_ID
     WHERE N.ID_NM = ?',
    [$id]
);
$motivi = $nm === null ? [] : (db_righe(
    'SELECT M.MOTIVO FROM dbo.NEARMISS_SUPPORT AS S
     INNER JOIN dbo.NEARMISS_MOTIVO AS M ON S.ID_MOTIVO = M.MOTIVO_ID
     WHERE S.ID_NM = ?',
    [$id]
) ?? []);
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="../../../css/stile.css?v=<?= (int) @filemtime(__DIR__ . '/../../../css/stile.css') ?>">
<title>Richiesta Near Miss</title>
</head>
<body class="dettaglio nearmiss">
<header class="barra">
    <img class="marchio" src="../../../Images/logo-bianco.png" alt="North Plastik">
    <span class="barra-titolo">Gestione segnalazioni</span>
    <div class="destra"><a href="nearmisslist.php" class="btn">Torna all'elenco</a></div>
</header>
<main class="pagina">
<?php if ($nm === null): ?>
<p class="errore">Richiesta non trovata.</p>
<?php else: ?>
<div class="testa">
    <h1>Mancato infortunio NM<?= h($nm['ID_NM']) ?></h1>
    <span class="stato-nome <?= classe_stato($nm['STATO']) ?>"><?= h(nome_stato($nm['STATO'], 'Conclusa')) ?></span>
</div>
<div class="scheda">
<dl class="voci">
    <div><dt>Segnalato da</dt><dd><?= h(trim(($nm['COGNOME'] ?? '') . ' ' . ($nm['NOME'] ?? ''))) ?></dd></div>
    <div><dt>Data</dt><dd><?= h(data_ora($nm['DATA'])) ?></dd></div>
    <div><dt>Reparto</dt><dd><?= h($nm['NOME_REP']) ?></dd></div>
    <div><dt>Postazione</dt><dd><?= h($nm['POSTAZIONE']) ?></dd></div>
<?php if ($motivi !== []): ?>
    <div><dt>Motivi</dt><dd><ul>
<?php foreach ($motivi as $m): ?>
        <li><?= h($m['MOTIVO']) ?></li>
<?php endforeach; ?>
    </ul></dd></div>
<?php endif; ?>
    <div><dt>Descrizione</dt><dd><?= h($nm['DESC_EV']) ?></dd></div>
    <div><dt>Contromisure suggerite</dt><dd><?= h($nm['CONTR_SU']) ?></dd></div>
</dl>
<form name="insertstatus" class="cambio" action="insert_status.php" method="post">
    <h2 id="stato-titolo">Cambia stato</h2>
    <fieldset class="stati" aria-labelledby="stato-titolo">
<?= scelte_stato((int) $nm['STATO'], 'Conclusa') ?>
    </fieldset>
    <input type="hidden" name="id" value="<?= h($nm['ID_NM']) ?>">
    <input type="hidden" name="csrf" value="<?= h(token_csrf()) ?>">
    <button type="submit" class="pulsante principale">Aggiorna lo stato</button>
</form>
</div>
<?php endif; ?>
</main>
</body>
</html>
