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
<link rel="stylesheet" href="../../../css/stile.css">
<title>Richiesta Near Miss</title>
</head>
<body class="dettaglio nearmiss">
<a href="nearmisslist.php"><div class="back-button">◄ INDIETRO</div></a>
<div class="header">
    <h1>RICHIESTA NEAR MISS</h1>
</div>
<div class="list-container">
<div class="elenco">
<?php if ($nm === null): ?>
    <p class="errore">Richiesta non trovata.</p>
<?php else: ?>
    <div class="item da-incaricare">
        <strong>ID</strong><br> NM<?= h($nm['ID_NM']) ?>
        <br><br>
        <strong>Richiedente</strong><br>
        <?= h(trim(($nm['COGNOME'] ?? '') . ' ' . ($nm['NOME'] ?? ''))) ?>
        <br><br>
        <strong>Data</strong><br><?= h(data_ora($nm['DATA'])) ?>
        <br><br>
        <strong>Postazione</strong><br><?= h($nm['POSTAZIONE']) ?>
        <br><br>
        <strong>Reparto</strong><br>
        <?= h($nm['NOME_REP']) ?>
        <br><br>
        <strong>Motivi</strong><br>
<?php foreach ($motivi as $m): ?>
        <?= h($m['MOTIVO']) ?><br>
<?php endforeach; ?>
        <br>
        <strong>Descrizione evento</strong><br><?= h($nm['DESC_EV']) ?>
        <br><br>
        <strong>Contromisure suggerite:</strong><br>
        <?= h($nm['CONTR_SU']) ?>
        <br><br>
        <form name="insertstatus" action="insert_status.php" method="post">
            <div class="form-group">
                <label for="stato"><strong>Stato</strong></label>
                <select id="stato" name="stato" required>
                    <?= opzioni_stato((int) $nm['STATO'], 'Conclusa') ?>
                </select>
            </div>
            <input type="hidden" name="id" value="<?= h($nm['ID_NM']) ?>">
            <input type="hidden" name="csrf" value="<?= h(token_csrf()) ?>">
            <div id="submit-container">
                <button type="submit">AGGIORNA STATO</button>
            </div>
        </form>
    </div>
<?php endif; ?>
</div>
</div>
</body>
</html>
